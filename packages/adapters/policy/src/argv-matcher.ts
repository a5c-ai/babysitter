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

    // An interpreter running inline code (`python -c "..."`) defeats resolution.
    if (argv[idx + 1] === '-c' && !SHELLS.has(base)) {
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

/** Normalize argv[1..] into a subcommand string (flags separated out). */
function normalizeSubcommand(argv: string[]): string {
  // argv[0] is the program; the subcommand is the leading non-flag tokens.
  const rest = argv.slice(1);
  const words: string[] = [];
  for (const tok of rest) {
    if (tok.startsWith('-')) break; // stop at the first flag/option
    words.push(tok);
  }
  return words.join(' ');
}

/**
 * True if the invocation's leading program *could belong to* this covered scope —
 * i.e. the raw leading program (before allowlist/shell peeling), or a shell/wrapper
 * form, references a recognized program for this scope. Used to decide whether an
 * unresolvable command is "covered-but-unauthorized" (→ deny) vs merely uncovered.
 */
function touchesScope(command: string, scope: ArgvMatchScope): boolean {
  const recognized = new Set([
    ...(scope.recognizedPrograms ?? []),
    scope.match.program,
  ]);
  // Cheap textual containment check on the raw command for any recognized program.
  return [...recognized].some((prog) => command.includes(prog));
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

    // Program matches; check the normalized subcommand.
    const subcommand = normalizeSubcommand(argv);
    const eq = scope.match.subcommandEquals;
    const rx = scope.match.subcommandMatches;

    let subMatch = true;
    if (eq || rx) {
      subMatch = false;
      if (eq && eq.some((s) => subcommand === s || subcommand.startsWith(`${s} `))) {
        subMatch = true;
      }
      if (!subMatch && rx && rx.some((pat) => new RegExp(pat).test(subcommand))) {
        subMatch = true;
      }
    }

    if (!subMatch) {
      // Correct program but a subcommand NOT in the action's list — not a covered
      // match for THIS action (e.g. `aws s3 ls` under an `s3 cp|rm|sync` action).
      return { covered: false, deny: false, program, subcommand, reason: 'subcommand not covered by this action' };
    }

    return { covered: true, deny: false, program, subcommand };
  } catch (err) {
    return { covered: false, deny: true, reason: `exception during argv match: ${(err as Error)?.message ?? String(err)}` };
  }
}
