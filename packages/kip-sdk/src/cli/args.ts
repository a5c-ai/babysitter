/**
 * `kip` CLI — zero-dependency argv parser (spec §1 "Argument parsing is done with a zero-dependency
 * internal parser (no `commander`/`yargs` runtime dep)").
 *
 * The grammar is `kip [GLOBAL_OPTS] <command> [ARGS] [CMD_OPTS]` (spec §1). Because global options
 * (`--dir`, `--replica`, `--tenant`, `--json`, …) may appear ANYWHERE relative to the command token
 * (spec §2 precedence tables + the frozen suite's interleaved argv), this parser splits the whole
 * token stream into a flat `{ positionals, flags }` pair up-front, using a single flag classification
 * table spanning every subcommand. The first positional is the command; the rest are the command's
 * own positionals (e.g. `get <EID>`, `sync <remote>`, `asof <subread> <selector>`).
 */

/** Boolean flags — presence sets `true`; they never consume the following token. */
const BOOLEAN_FLAGS = new Set([
  "version",
  "help",
  "json",
  "create",
  "edge",
  "fail-on-conflict",
  "fail-on-unknown",
  "quiet",
  "ndjson",
  "stdin",
  "fetch",
  "push",
  "heads-committed",
  // `kip link` (ADR-B11): compute + print the would-be links without authoring any fact.
  "dry-run",
  // `kip resolve confirm/reject` (ADR-B12): operator override that skips the outstanding-candidate
  // guard (off by default; authors a real same_as/not_same_as without a quarantine lifecycle).
  "force",
  // `kip ingest-rdf` (D-67): downgrade malformed N-Triples lines from a strict fail (N5, exit 1) to
  // reported per-line skips, ingesting the well-formed triples.
  "skip-malformed",
]);

/** Value flags that may appear MORE THAN ONCE, accumulated into an array (spec §4: `--root-key`,
 *  `--seed`, `--edge-kind`, `--kind`, `--prop`, `--remote-branch` are all "repeatable"). */
const REPEATABLE_FLAGS = new Set([
  "root-key",
  "seed",
  "edge-kind",
  "kind",
  "prop",
  "remote-branch",
  // `kip index` (ADR-B9c): repeatable advisory globs scoping the analyzed module set.
  "include",
  "exclude",
]);

/** Single-value flags — consume exactly one following token (or an inline `--flag=value`). */
const VALUE_FLAGS = new Set([
  "dir",
  "replica",
  "keyring",
  "tenant",
  "namespace",
  "as-of",
  "hash-algo",
  "shard-depth",
  "clock-epoch",
  "epsilon-causal-ms",
  "quarantine-ttl-ms",
  "quarantine-key-cap-bytes",
  "quarantine-pool-bytes",
  "key-chain-durable-cap-bytes",
  "genesis-file",
  "eid",
  "from",
  "to",
  "valid-from",
  "valid-to",
  "file",
  "direction",
  "depth",
  "max-fanout",
  "k",
  "embedding-file",
  "valid-time",
  "tx-time",
  "believer",
  "through-hlc",
  "retention",
  "model",
  "timeout",
  "manifest",
  // `kip index` (ADR-B9c): the provenance sha override anchoring the acquisition.
  "git-sha",
  // `kip learn` (ADR-B10e): the accept threshold, the three disjunctive budget axes, and the
  // document's media type (sourced ONCE and threaded byte-identically into every decode, INV-A14).
  "threshold",
  "max-iterations",
  "max-wall-ms",
  "max-invocations",
  "raw-kind",
  // `kip resolve` (ADR-B12): the model-assisted Layer-2 entity resolver's bounded-candidate + N5
  // adjudication knobs — per-node recall fan-out, the total pair cap, and the confidence bar.
  "top-k",
  "max-pairs",
  "min-confidence",
  // `kip ingest-rdf` (D-67): the blank-node namespace (a stable per-file skolem namespace; defaults to
  // a content hash) and the data-resource source uri recorded on every authored fact's provenance.
  "graph",
  "source",
  // `kip ingest-rdf` (D-67 remote half, ADR-B14): an explicit HTTPS URL to fetch N-Triples from (gated
  // behind the KIP_RDF_FETCH host allowlist; mutually exclusive with the <file> positional).
  "url",
]);

/** Short aliases → canonical long flag name. */
const SHORT_ALIASES: Record<string, string> = {
  V: "version",
  h: "help",
};

export type FlagValue = boolean | string | string[];

export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, FlagValue>;
  /** Set iff the token stream is a USAGE error (unknown flag, value flag missing its value). */
  error?: string;
}

/**
 * Parse `argv` (already `process.argv.slice(2)`) into positionals + a flag map. A malformed token
 * stream (unknown option, a value flag with no value) is surfaced as `error` — the caller maps that
 * to exit 2 (spec §3). This never throws.
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, FlagValue> = {};
  let sawDoubleDash = false;

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];

    if (sawDoubleDash) {
      positionals.push(token);
      continue;
    }
    if (token === "--") {
      sawDoubleDash = true;
      continue;
    }

    if (token.startsWith("--")) {
      let name = token.slice(2);
      let inlineValue: string | undefined;
      const eq = name.indexOf("=");
      if (eq >= 0) {
        inlineValue = name.slice(eq + 1);
        name = name.slice(0, eq);
      }

      if (BOOLEAN_FLAGS.has(name)) {
        flags[name] = true;
        continue;
      }
      if (VALUE_FLAGS.has(name) || REPEATABLE_FLAGS.has(name)) {
        const value = inlineValue !== undefined ? inlineValue : argv[++i];
        if (value === undefined) {
          return { positionals, flags, error: `option --${name} requires a value` };
        }
        if (REPEATABLE_FLAGS.has(name)) {
          const existing = flags[name];
          if (Array.isArray(existing)) existing.push(value);
          else flags[name] = [value];
        } else {
          flags[name] = value;
        }
        continue;
      }
      return { positionals, flags, error: `unknown option --${name}` };
    }

    if (token.length > 1 && token.startsWith("-")) {
      const alias = SHORT_ALIASES[token.slice(1)];
      if (alias && BOOLEAN_FLAGS.has(alias)) {
        flags[alias] = true;
        continue;
      }
      return { positionals, flags, error: `unknown option ${token}` };
    }

    positionals.push(token);
  }

  return { positionals, flags };
}

// ---------------------------------------------------------------------------
// Typed accessors over the flat flag map.
// ---------------------------------------------------------------------------

export function flagBool(flags: Record<string, FlagValue>, name: string): boolean {
  return flags[name] === true;
}

export function flagStr(flags: Record<string, FlagValue>, name: string): string | undefined {
  const v = flags[name];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[v.length - 1];
  return undefined;
}

export function flagList(flags: Record<string, FlagValue>, name: string): string[] {
  const v = flags[name];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") return [v];
  return [];
}
