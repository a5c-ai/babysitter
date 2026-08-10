/**
 * `kip` CLI — repo-dir / identity / keyring resolution (spec §2, §6).
 *
 * Resolution is PURE PRECEDENCE — flag → environment → default — and every failure is surfaced
 * BEFORE any SDK call (exit 3), never as a silent default (N5, "fallbacks are evil"). All the
 * pre-flight gates the spec lists in §2/§6 live here: repo-not-initialized, missing `replicaId`, and
 * keyring-required-but-unreadable.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import type { OpenOptions, Repo, ScopeRef } from "../index";
import { flagStr } from "./args";
import type { FlagValue } from "./args";

/** A pre-flight resolution failure (spec §6, exit 3). Carries an actionable stderr message. */
export class ResolutionError extends Error {}

export type OpenRepoFn = (options: OpenOptions) => Promise<Repo>;

export interface ResolveContext {
  cwd: string;
  env: Record<string, string | undefined>;
  flags: Record<string, FlagValue>;
}

/** `--dir` → `KIP_DIR` → `./.kip` (spec §2), resolved to an absolute path against `cwd`. */
export function resolveDir(ctx: ResolveContext): string {
  const raw = flagStr(ctx.flags, "dir") ?? ctx.env.KIP_DIR ?? join(ctx.cwd, ".kip");
  return isAbsolute(raw) ? raw : join(ctx.cwd, raw);
}

/** `--replica` → `KIP_REPLICA_ID` → (required, no invented default) (spec §2). */
export function resolveReplicaId(ctx: ResolveContext): string {
  const replicaId = flagStr(ctx.flags, "replica") ?? ctx.env.KIP_REPLICA_ID;
  if (!replicaId) {
    throw new ResolutionError("replicaId required (--replica or KIP_REPLICA_ID)");
  }
  return replicaId;
}

/** The resolved keyring FILE PATH (spec §2 precedence), or `undefined` if none is resolvable. The
 *  `<dir>/keyring.json` default only counts when the file actually exists ("if present"). */
export function resolveKeyringPath(ctx: ResolveContext, dir: string): string | undefined {
  const explicit = flagStr(ctx.flags, "keyring") ?? ctx.env.KIP_KEYRING;
  if (explicit) return explicit;
  const dflt = join(dir, "keyring.json");
  return existsSync(dflt) ? dflt : undefined;
}

/** Load + parse the keyring at `path` as JSON key material (spec §2). Throws `ResolutionError` on an
 *  unreadable/unparseable file (the caller maps that to exit 3 for writes). */
function loadKeyring(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new ResolutionError("keyring required to author facts");
  }
}

/** True iff `dir` is an initialized kip repo — "a git dir with a valid /manifest.json" (spec §2). */
export function isInitializedRepo(dir: string): boolean {
  return existsSync(join(dir, "manifest.json"));
}

/**
 * A content-addressed id of the immutable genesis `manifest.json` (spec §4.1 `manifestGenesisCid`).
 * kip stores no separate genesis-CID accessor on the `Repo` surface, so the CLI derives it as the
 * SHA-256 of the on-disk genesis manifest bytes — a faithful, stable content address. `null` when no
 * manifest is on disk (e.g. a spy `openRepo` that never wrote one).
 */
export function manifestGenesisCid(dir: string): string | null {
  const path = join(dir, "manifest.json");
  try {
    if (!existsSync(path)) return null;
    return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
  } catch {
    return null;
  }
}

/** Build a `ScopeRef` from `--tenant`/`--namespace` (env fallbacks), or `undefined` when no tenant. */
export function resolveScope(ctx: ResolveContext): ScopeRef | undefined {
  const tenant = flagStr(ctx.flags, "tenant") ?? ctx.env.KIP_TENANT;
  if (!tenant) return undefined;
  const namespace = flagStr(ctx.flags, "namespace") ?? ctx.env.KIP_NAMESPACE;
  const scope: ScopeRef = { tenant };
  if (namespace) scope.namespace = namespace;
  return scope;
}

export interface ResolvedRepo {
  repo: Repo;
  dir: string;
  replicaId: string;
  scope?: ScopeRef;
}

export interface ResolveRepoOptions {
  /** The dir must already be an initialized kip repo (all read/write commands except `init`). */
  requireInitialized: boolean;
  /** A resolvable keyring is mandatory (write commands: `assert`/`retract`, `sync --push`). */
  requireKeyring: boolean;
}

/**
 * Resolve + open a `Repo` for a command that reads/writes an existing repo. Runs every §2/§6
 * pre-flight gate (initialized, identity, keyring) BEFORE `openRepo`, then lenses via `withScope`
 * when a tenant is set (spec §2 "Scope"). Throws `ResolutionError` (→ exit 3) on any gate failure.
 */
export async function resolveRepo(
  ctx: ResolveContext,
  openRepo: OpenRepoFn,
  options: ResolveRepoOptions,
): Promise<ResolvedRepo> {
  const dir = resolveDir(ctx);
  const replicaId = resolveReplicaId(ctx);

  if (options.requireInitialized && !isInitializedRepo(dir)) {
    throw new ResolutionError(`repo not initialized at ${dir}; run 'kip init' first`);
  }

  const keyringPath = resolveKeyringPath(ctx, dir);
  let keyring: unknown = {};
  if (options.requireKeyring) {
    if (!keyringPath) throw new ResolutionError("keyring required to author facts");
    keyring = loadKeyring(keyringPath);
  } else if (keyringPath) {
    // Read-only commands: a keyring is OPTIONAL (reads verify signatures, they do not sign, spec §2).
    try {
      keyring = loadKeyring(keyringPath);
    } catch {
      keyring = {};
    }
  }

  const openedRepo = await openRepo({ dir, replicaId, keyring });
  const scope = resolveScope(ctx);
  const repo = scope ? openedRepo.withScope(scope) : openedRepo;
  return { repo, dir, replicaId, scope };
}
