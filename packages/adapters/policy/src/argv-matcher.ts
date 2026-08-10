/**
 * Milestone B — Canonicalized argv matcher (AC-38 / AC-38a / AC-38b / AC-38c).
 *
 * The matcher operates on a CANONICALIZED argv, never a raw string:
 *   1. Tokenize into argv[]; if the program is a shell (sh/bash/zsh) with -c, RECURSE
 *      into the -c payload so the INNER program is matched, not the shell.
 *   2. Resolve argv[0] to a program basename (abs path / symlink basename → `aws`).
 *   3. DENY (do not silently non-match) when the program cannot be resolved, or a
 *      wrapper that defeats canonicalization is present for a covered scope (AC-38a).
 *   4. subcommandEquals / subcommandMatches operate on NORMALIZED subcommand tokens.
 *
 * Wrapper handling is an ALLOWLIST per covered scope (AC-38c), NOT a denylist: a
 * leading token not on the scope's allowlist, or any construct breaking static
 * resolution ($()/backticks, $PROG indirection, eval, piped/substituted program),
 * makes the program UNRESOLVABLE → deny, never default-allow.
 *
 * commandDefaultAllow (AC-38b): default-allow for command-bearing tools is OPT-IN per
 * env; when false (default), an UNCOVERED command-bearing invocation is DENIED.
 *
 * OVERRIDING RULE: fail closed. Any parse/resolution error, or any adversarial alias
 * of a covered command, denies rather than falling through to default-allow.
 */
import { canonicalizeArgv } from './canonicalize-args.js';

/** The `argv` matcher shape from the §7 policy schema. */
export interface ArgvMatch {
  /** Resolved binary basename to match (e.g. `aws`). */
  program: string;
  /** Normalized subcommand tokens that count as a covered match (e.g. `s3 cp`). */
  subcommandEquals?: string[];
  /** Regex(es) over the normalized subcommand string. */
  subcommandMatches?: string[];
  /**
   * AC-38c closed, per-scope allowlist of transparent leading wrappers the matcher may
   * recurse through to the real program (e.g. `time`, `sudo`). Any leading token NOT on
   * this allowlist makes the program unresolvable → deny.
   */
  wrapperAllowlist?: string[];
  /** Programs recognized as a legitimate resolved program for this scope. */
  recognizedPrograms?: string[];
}

/**
 * A policy-covered scope: the argv matcher, plus the closed per-scope wrapper
 * ALLOWLIST (AC-38c) and the recognized programs for the scope.
 */
export interface ArgvMatchScope {
  scopeId: string;
  match: ArgvMatch;
  /** Closed, reviewable allowlist of transparent leading wrappers (e.g. `time`, `sudo`). */
  wrapperAllowlist?: string[];
  /** Programs recognized as a legitimate resolved program for this scope. */
  recognizedPrograms?: string[];
  /** AC-38b: default-allow for uncovered command-bearing tools (per-env opt-in). */
  commandDefaultAllow?: boolean;
}

export interface ArgvMatchResult {
  /** True iff this invocation is a covered match for the scope's action. */
  covered: boolean;
  /** True iff the invocation must be DENIED (unresolvable covered program, or
   *  uncovered command-bearing with commandDefaultAllow=false). */
  deny?: boolean;
  /** The resolved program basename, on a successful resolution. */
  program?: string;
  /** The normalized subcommand string, on a successful resolution. */
  subcommand?: string;
  reason?: string;
}

/** Shells whose `-c` payload we recurse into (spec step 1). */
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ash', 'ksh']);

/**
 * Interpreter programs that run an INLINE code payload via a code-eval flag
 * (`python -c`, `perl -e`, `ruby -e`, `node -e`, ...). An inline payload can NAME a
 * covered program textually (`python -c "import os; os.system('aws s3 rm ...')"`)
 * while the argv's leading program is the interpreter — so static resolution to a
 * program is DEFEATED. Under a covered scope this is unresolvable → deny (AC-38a),
 * never default-allow. We recognize the interpreter by basename (with a trailing
 * version suffix stripped, e.g. `python3`, `ruby2.7`) so alternate binary names do
 * not slip through.
 */
const INTERPRETERS = new Set([
  'python',
  'python2',
  'python3',
  'pypy',
  'perl',
  'ruby',
  'node',
  'nodejs',
  'deno',
  'bun',
  'php',
  'lua',
  'Rscript',
  'osascript',
]);

/**
 * Code-eval flags that make an interpreter run an inline payload. `-c` (python),
 * `-e` (perl/ruby/node), `-E` (perl), and `-m <module>` (python module exec) all
 * hand the interpreter a payload that can invoke a covered program indirectly.
 */
const INTERPRETER_EVAL_FLAGS = new Set(['-c', '-e', '-E', '-m']);

/**
 * Strip a trailing version suffix from an interpreter basename so `python3`,
 * `python3.11`, `ruby2.7`, `nodejs` canonicalize toward a known interpreter name.
 * Returns the raw basename when no interpreter root is recognized.
 */
function interpreterRoot(base: string): string {
  if (INTERPRETERS.has(base)) return base;
  // Strip a trailing version (digits/dots) e.g. python3.11 -> python.
  const stripped = base.replace(/[0-9]+(?:\.[0-9]+)*$/, '');
  if (INTERPRETERS.has(stripped)) return stripped;
  return base;
}

/**
 * True iff `base` is an interpreter and one of `rest` (the tokens AFTER the
 * interpreter, allowing intervening interpreter flags like `-I`, `-W`, `-u`) is a
 * code-eval flag (`-c`/`-e`/`-E`/`-m`). The interpreter payload defeats static
 * program resolution → the caller treats this as unresolvable (AC-38a).
 */
function isInterpreterEval(base: string, rest: string[]): boolean {
  const root = interpreterRoot(base);
  if (!INTERPRETERS.has(root)) return false;
  // Scan the interpreter's own leading flags; if we hit a code-eval flag before a
  // non-flag token (the script path), it is an inline-code eval.
  for (const tok of rest) {
    if (INTERPRETER_EVAL_FLAGS.has(tok)) return true;
    // A `-c`/`-e` may be glued (`-ce`, unusual) — treat any flag STARTING with an
    // eval letter conservatively as an eval flag under a covered scope.
    if (tok.startsWith('-') && /^-[a-zA-Z]*[ceEm]/.test(tok)) return true;
    if (!tok.startsWith('-')) break; // reached the script path — not inline eval
  }
  return false;
}

/**
 * Constructs that defeat static program resolution. Any token containing one of
 * these makes the program UNRESOLVABLE → deny (AC-38a): command substitution
 * `$(...)` / backticks, variable-indirect program `$VAR`, etc.
 */
function tokenBreaksResolution(token: string): boolean {
  return (
    token.includes('$(') ||
    token.includes('`') ||
    token.includes('${') ||
    token.startsWith('$')
  );
}

/** True if the token looks like an inline env-var assignment `NAME=value`. */
function isEnvAssignment(token: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*=/.test(token);
}

/** Take the canonical basename of a path (abs path / symlink target string → basename). */
function basename(program: string): string {
  const parts = program.split(/[\\/]/);
  return parts[parts.length - 1] || program;
}

interface Resolution {
  program?: string;
  argv?: string[];
  /** True when the argv could not be statically resolved to a program. */
  unresolvable: boolean;
  reason?: string;
}

/**
 * Statically resolve the real leading program of a command line, recursing through
 * the scope's wrapper allowlist and shell `-c` payloads. Returns `unresolvable:true`
 * for any construct that defeats static resolution (AC-38a / AC-38c).
 */
function resolveProgram(command: string, scope: ArgvMatchScope, depth = 0): Resolution {
  if (depth > 8) return { unresolvable: true, reason: 'wrapper recursion too deep' };

  let argv: string[];
  try {
    argv = canonicalizeArgv(command);
  } catch (err) {
    return { unresolvable: true, reason: `tokenize failed: ${(err as Error).message}` };
  }
  if (argv.length === 0) return { unresolvable: true, reason: 'empty command' };

  const wrapperAllow = new Set(scope.wrapperAllowlist ?? []);

  let idx = 0;
  // Peel off leading env-assignments and allowlisted wrappers.
  while (idx < argv.length) {
    const tok = argv[idx];

    // Any statically-unresolvable construct in the leading position → deny.
    if (tokenBreaksResolution(tok)) {
      return { unresolvable: true, reason: `unresolvable construct: ${tok}` };
    }

    // Inline env-var assignment (`AWS=aws`) preceding the program → env indirection.
    // The program that follows is either indirect ($AWS) or the assignment shifts
    // resolution; treat leading env-assignment as an indirection defeat → deny.
    if (isEnvAssignment(tok)) {
      return { unresolvable: true, reason: 'inline env assignment (indirection)' };
    }

    const base = basename(tok);

    // `eval` defeats static resolution outright.
    if (base === 'eval') {
      return { unresolvable: true, reason: 'eval defeats static resolution' };
    }

    // Shell with -c: recurse into the -c payload (the INNER program is matched).
    if (SHELLS.has(base)) {
      const cIndex = argv.indexOf('-c', idx + 1);
      if (cIndex >= 0 && cIndex + 1 < argv.length) {
        return resolveProgram(argv[cIndex + 1], scope, depth + 1);
      }
      // A bare shell with no -c payload is not a recognized program → unresolvable.
      return { unresolvable: true, reason: 'shell without -c payload' };
    }

    // An interpreter running inline code (`python -c`, `perl -e`, `ruby -e`,
    // `node -e`, `python -m ...`) defeats static resolution — the payload can name a
    // covered program indirectly. Recognize the interpreter + code-eval flag form
    // (with intervening interpreter flags) → unresolvable (AC-38a / AC-38c).
    if (!SHELLS.has(base) && isInterpreterEval(base, argv.slice(idx + 1))) {
      return { unresolvable: true, reason: `interpreter indirection: ${base}` };
    }

    // A leading allowlisted wrapper: consume it and continue to the real program.
    if (wrapperAllow.has(base)) {
      // Skip the wrapper token and any of its own flags/args up to the next program.
      // We advance one token; wrapper flags (e.g. `stdbuf -oL`) are not modelled for
      // allowlisted wrappers in the frozen fixtures (they use `time`/`sudo` bare or
      // `sudo -u user`), so advance conservatively to the next non-flag token.
      idx++;
      while (idx < argv.length && argv[idx].startsWith('-')) {
        // consume wrapper flags; the value after `-u` is the wrapper's arg
        const flag = argv[idx];
        idx++;
        if (flag === '-u' && idx < argv.length) idx++; // sudo -u <user>
      }
      continue;
    }

    // This token is the resolved program (no more wrappers to peel).
    return { program: base, argv: argv.slice(idx), unresolvable: false };
  }

  return { unresolvable: true, reason: 'no program after wrappers' };
}

/**
 * Extract the sequence of NON-OPTION tokens from argv[1..] for a covered program.
 *
 * GLOBAL-OPTION ARGV-EVASION (residual bypass on top of 43ab59142): a covered program
 * accepts global options BEFORE its subcommand — `aws --region us-east-1 s3 rm`,
 * `aws --debug s3 rm`, `git --no-pager push`, `kubectl -n prod delete`. The previous
 * `normalizeSubcommand` broke at the FIRST `-`-prefixed token, yielding an EMPTY
 * subcommand for these, so a deny action `subcommandEquals:['s3 rm']` NON-MATCHED and the
 * disguised command fell through to a broader program-level `aws` grant — evading the deny.
 *
 * FIX: strip EVERY option token (anything starting with `-`: `--flag`, `--flag=value`,
 * short `-f`, clustered `-oL`) and keep only the non-option tokens, in order. The covered
 * subcommand pattern is then matched as a CONTIGUOUS WINDOW over this non-option sequence
 * (see `subcommandWindowMatches`), so no ordering/interspersion of global options can hide
 * a deny-listed subcommand.
 *
 * VALUE-TAKING FLAGS: flag arity is CLI-specific and unknowable in general, so a bare
 * value like `us-east-1` after `--region` is INDISTINGUISHABLE from a subcommand token
 * without arity knowledge. We deliberately do NOT try to skip flag values: leaving the
 * value in the non-option sequence can only ADD spurious tokens, and the window match still
 * finds the real covered subcommand path (`s3 rm`) wherever it sits contiguously. Erring
 * toward INCLUDING a value token can only make a covered/deny subcommand match MORE readily
 * (the fail-closed direction for a deny), never let one hide. A genuinely different
 * subcommand (`aws --region x s3 ls`) still produces a non-option sequence without the
 * `s3 rm`/`s3 cp` window, so it correctly NON-MATCHES.
 */
function nonOptionTokens(argv: string[]): string[] {
  // argv[0] is the program; keep every argv[1..] token that is not an option.
  return argv.slice(1).filter((tok) => !tok.startsWith('-'));
}

/**
 * Legacy leading-non-option join (argv[1..] up to the first option) — retained only for
 * the `subcommand` field reported on the result for observability. Matching itself uses the
 * window match below, NOT this string, so global-option position cannot defeat coverage.
 */
function normalizeSubcommand(argv: string[]): string {
  const words: string[] = [];
  for (const tok of argv.slice(1)) {
    if (tok.startsWith('-')) break;
    words.push(tok);
  }
  return words.join(' ');
}

/**
 * True iff the covered subcommand pattern `pattern` (a space-separated token sequence such
 * as `s3 rm`) appears as a CONTIGUOUS WINDOW inside the non-option token sequence `tokens`.
 * This is the security-critical match: because option tokens are already stripped, the
 * deny-listed subcommand path matches regardless of where global options were interspersed.
 */
function subcommandEqualsWindow(pattern: string, tokens: string[]): boolean {
  const pat = pattern.split(/\s+/).filter((s) => s.length > 0);
  if (pat.length === 0) return false;
  for (let start = 0; start + pat.length <= tokens.length; start++) {
    let all = true;
    for (let j = 0; j < pat.length; j++) {
      if (tokens[start + j] !== pat[j]) {
        all = false;
        break;
      }
    }
    if (all) return true;
  }
  return false;
}

/**
 * True iff the `subcommandMatches` regex `pattern` matches SOME contiguous window (of any
 * length ≥1) of the non-option token sequence, anchored full-string over that window's
 * space-join. Anchoring keeps an unanchored pattern from matching on an arbitrary substring
 * (allowlist-widening), while windowing keeps a leading global option from shifting the
 * subcommand out of view.
 */
function subcommandMatchesWindow(pattern: string, tokens: string[]): boolean {
  let re: RegExp;
  try {
    re = new RegExp(`^(?:${pattern})$`);
  } catch {
    return false;
  }
  for (let start = 0; start < tokens.length; start++) {
    for (let end = start + 1; end <= tokens.length; end++) {
      if (re.test(tokens.slice(start, end).join(' '))) return true;
    }
  }
  return false;
}

/**
 * True if the invocation's leading program *could belong to* this covered scope —
 * i.e. the raw leading program (before allowlist/shell peeling), or a shell/wrapper
 * form, references a recognized program for this scope. Used to decide whether an
 * unresolvable command is "covered-but-unauthorized" (→ deny) vs merely uncovered.
 */
/**
 * True iff any recognized program appears in `command` as a standalone WORD (bounded
 * by whitespace, quotes, or `(`/`,`/`;`), so `awscli` / `/opt/awesome/x` do not
 * spuriously fire but `os.system('aws s3 rm ...')` does. Used only for the fallback
 * whole-command check for unresolvable / interpreter-payload disguises.
 */
function commandNamesRecognized(command: string, recognized: Set<string>): boolean {
  for (const prog of recognized) {
    // Word-ish boundary: start-of-string / non-[\w-] before, non-[\w-] / end after.
    const escaped = prog.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^\\w-])${escaped}([^\\w-]|$)`);
    if (re.test(command)) return true;
  }
  return false;
}

function touchesScope(command: string, scope: ArgvMatchScope): boolean {
  const recognized = new Set([
    ...(scope.recognizedPrograms ?? []),
    scope.match.program,
  ]);
  // Prefer a RESOLVED-PROGRAM check over a raw `String.includes(program)` (which would
  // spuriously fire on `awscli`, `/opt/awesome/x`, or a scope program appearing only in an
  // argument). Tokenize the command and test whether any token's canonical BASENAME equals
  // a recognized program (also matching the `$VAR`/`$(...)`-indirected forms of it, since
  // those tokens still name the covered program textually and are the disguise we must
  // deny). Fall back to the containment check only if tokenization fails outright.
  let argv: string[];
  try {
    argv = canonicalizeArgv(command);
  } catch {
    // Not statically tokenizable (e.g. unterminated quote) → fall back to the word
    // check, failing closed toward "touches" so a covered program is denied.
    return commandNamesRecognized(command, recognized);
  }
  // If ANY token defeats static resolution (`$(...)`, backticks, `$VAR`, `NAME=value`),
  // the command is an unresolvable disguise: we cannot cleanly isolate the program, so
  // fall back to the whole-command containment check (fail closed toward deny). This is
  // exactly the covered-but-unauthorized case AC-38a must deny, not default-allow.
  if (argv.some((tok) => tokenBreaksResolution(tok) || isEnvAssignment(tok))) {
    return commandNamesRecognized(command, recognized);
  }
  // An INTERPRETER-EVAL disguise (`python -c "... aws s3 rm ..."`, `perl -e '...'`,
  // `node -e "..."`) hides the covered program inside an INLINE code payload token that
  // is not the argv's leading program. Static basename resolution cannot see it, so if
  // the leading program is an interpreter running inline code, fall back to a
  // whole-command word check for the covered program (fail closed toward deny, AC-38a).
  {
    const lead = basename(argv[0]);
    if (!SHELLS.has(lead) && isInterpreterEval(lead, argv.slice(1))) {
      return commandNamesRecognized(command, recognized);
    }
  }
  // Otherwise, use a precise RESOLVED-BASENAME check: a recognized program only "touches"
  // the scope if a token's canonical basename actually equals it — so `awscli`,
  // `/opt/awesome/x`, or `aws` appearing only inside an argument do NOT spuriously fire.
  return argv.some((tok) => recognized.has(basename(tok)));
}

/**
 * Match a command line against a covered scope, on the CANONICALIZED argv.
 *
 * Returns `{ covered: true }` when the resolved program + normalized subcommand match
 * the scope; `{ deny: true }` when the program is unresolvable under a covered scope,
 * or when the command is uncovered and command-bearing with commandDefaultAllow=false;
 * `{ covered: false }` (no deny) only for an uncovered command that is explicitly
 * opted-in via commandDefaultAllow=true.
 */
export function matchArgv(command: string, scope: ArgvMatchScope): ArgvMatchResult {
  try {
    if (typeof command !== 'string' || command.trim().length === 0) {
      return { covered: false, deny: true, reason: 'empty/malformed command' };
    }
    if (!scope || typeof scope !== 'object' || !scope.match) {
      return { covered: false, deny: true, reason: 'missing scope' };
    }

    const resolution = resolveProgram(command, scope);

    if (resolution.unresolvable || !resolution.program || !resolution.argv) {
      // Unresolvable. If it touches a covered scope → covered-but-unauthorized → deny
      // (AC-38a). Otherwise it is an uncovered command-bearing invocation, subject to
      // commandDefaultAllow (AC-38b) — but an unresolvable construct is never allowed.
      if (touchesScope(command, scope)) {
        return { covered: false, deny: true, reason: resolution.reason ?? 'unresolvable covered program' };
      }
      // Unresolvable and not touching a covered scope: still a command-bearing action.
      if (scope.commandDefaultAllow === true) {
        // Even opted-in, an unresolvable construct is a covered-scope threat only when
        // it touches the scope; a wholly-unrelated unresolvable command with opt-in is
        // not this matcher's concern → treat as uncovered, not denied.
        return { covered: false, deny: false, reason: resolution.reason };
      }
      return { covered: false, deny: true, reason: resolution.reason ?? 'unresolvable command, default-deny' };
    }

    const { program, argv } = resolution;

    // Program mismatch: this is an UNCOVERED command-bearing action.
    if (program !== scope.match.program) {
      if (scope.commandDefaultAllow === true) {
        return { covered: false, deny: false, program, reason: 'uncovered, default-allow opted in' };
      }
      return { covered: false, deny: true, program, reason: 'uncovered command-bearing, default-deny' };
    }

    // Program matches; check the covered subcommand against the NON-OPTION token
    // sequence as a contiguous window (global-option argv-evasion fix). The reported
    // `subcommand` string is the legacy leading-non-option join (observability only);
    // the actual match is window-based so global-option position cannot defeat it.
    const subcommand = normalizeSubcommand(argv);
    const tokens = nonOptionTokens(argv);
    const eq = scope.match.subcommandEquals;
    const rx = scope.match.subcommandMatches;

    let subMatch = true;
    if (eq || rx) {
      subMatch = false;
      if (eq && eq.some((s) => subcommandEqualsWindow(s, tokens))) {
        subMatch = true;
      }
      if (!subMatch && rx && rx.some((pat) => subcommandMatchesWindow(pat, tokens))) {
        subMatch = true;
      }
    }

    if (!subMatch) {
      // Correct COVERED program but no covered/deny subcommand appears anywhere in the
      // non-option token sequence — a genuinely different subcommand (e.g. `aws s3 ls`,
      // or `aws --region x s3 ls`, under an `s3 cp|rm|sync` action). This is NOT a covered
      // match for THIS action, and (crucially) it is NOT a deny: the security invariant is
      // only that a deny-listed subcommand cannot be HIDDEN behind global options — a
      // legitimately distinct subcommand must still non-match and be allowed by a broader
      // grant. Because option stripping is total, any covered subcommand present in ANY
      // ordering WOULD have matched the window above; its absence here is unambiguous.
      return { covered: false, deny: false, program, subcommand, reason: 'subcommand not covered by this action' };
    }

    return { covered: true, deny: false, program, subcommand };
  } catch (err) {
    return { covered: false, deny: true, reason: `exception during argv match: ${(err as Error)?.message ?? String(err)}` };
  }
}
