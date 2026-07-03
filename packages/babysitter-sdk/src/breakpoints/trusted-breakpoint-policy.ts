/**
 * Milestone C (AC-7 / AC-28 / AC-35 / AC-36 / AC-37 / AC-46 / AC-47 / AC-48) —
 * the TRUST-ANCHORED source of the signed-breakpoint requirement + trusted human roots.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS (the two closed defects).
 *
 * The prior wiring sourced BOTH the `signatureRequired` flag AND the `trustedKeysDir`
 * from the per-effect `tasks/<effectId>/task.json` — a file the (in-scope, §11 AC-33)
 * workspace-writable agent can freely DELETE, CORRUPT, or rewrite. That gave the
 * adversary two trivial escapes:
 *   (defect 1) delete/corrupt task.json so the gate could not read `signatureRequired`
 *     and FAILED OPEN — an unsigned `{approved:true}` then committed; and
 *   (defect 2) point `trustedKeysDir` at a directory holding the AGENT's own public
 *     key, so a self-signed "human approval" verified.
 *
 * This module makes BOTH un-attacker-controllable by sourcing them ONLY from the
 * out-of-agent, integrity-protected trust anchor the design §10 defines:
 *
 *   pinned config root FP + pinned min-epoch floor (OFF the workspace — env/deploy)
 *     → `.policy/config-manifest.json` (one signed `SignedEnvelope<ConfigManifestPayload>`,
 *        AC-36/AC-46, verified by `verifyConfigManifest` against the pinned root)
 *        → covers `.policy/trust-roots.json` (the trusted `human` roots, AC-35) and
 *          `.policy/breakpoint-policy.json` (which breakpoints require a signature).
 *
 * A config file whose sha256 is not the one bound in the current-epoch signed manifest,
 * or a manifest signed by anything other than the pinned config root, or an epoch below
 * the pinned floor, is REJECTED (deny-all) — so editing any of these files on the
 * workspace cannot forge a lower requirement or inject a trusted key. The trust source
 * is therefore the signed manifest, NEVER the mutable per-effect task.json.
 *
 * FAIL CLOSED. When the pinned config anchor is present (a policy-enforced deployment),
 * ANY failure to establish trust — missing/edited/corrupt manifest or config file, wrong
 * signer, below-floor epoch, unreadable trust-roots — is surfaced as
 * `{ enforcementActive: true, configError: ... }`, and the caller MUST reject the post
 * for any breakpoint the trusted policy marks as requiring a signature (the requirement
 * cannot be trustworthily determined ⇒ deny). It is NEVER silently skipped.
 *
 * BACK-COMPAT. When NO config anchor is pinned (`POLICY_CONFIG_ROOT_FP` unset — the
 * pre-Milestone-C default deployment), enforcement is inactive and unsigned breakpoint
 * answers are unaffected, exactly as before. Opting in is a deploy operation (pinning the
 * off-workspace root + floor), which an in-workspace agent cannot do.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

// ── Local structural types (dynamic import keeps policy-adapter out of the CJS build) ─
// The policy-adapter is an ESM package the SDK consumes via dynamic import() only (the
// same pattern proven-verification.ts uses for @a5c-ai/tasks-adapter). We declare the
// minimal shapes we touch rather than statically importing the ESM module.

interface TrustRootLike {
  fingerprint: string;
  kind: "human" | "engine" | "agent" | "tool" | "config";
  publicKey?: string;
  publicKeyPath?: string;
  label?: string;
  revoked?: boolean;
  expiresAt?: string;
}

interface ConfigManifestVerificationLike {
  valid: boolean;
  reason?: string;
  configEpoch?: number;
  verifiedFiles?: string[];
}

interface PolicyAdapterModule {
  verifyConfigManifest: (
    manifest: unknown,
    ctx: {
      pinnedConfigRootFp: string;
      configRoot: TrustRootLike;
      minEpoch: number;
      files: Record<string, string>;
    },
  ) => ConfigManifestVerificationLike;
}

// ── Config anchor pins (OFF the workspace: env / deploy image, AC-37/AC-47) ──────

const CONFIG_ROOT_FP_ENV = "POLICY_CONFIG_ROOT_FP";
const CONFIG_MIN_EPOCH_ENV = "POLICY_CONFIG_MIN_EPOCH";
/** The config-root PUBLIC key material (PEM/DER-base64), or a path to it. Pinned off-workspace. */
const CONFIG_ROOT_KEY_ENV = "POLICY_CONFIG_ROOT_KEY";
const CONFIG_ROOT_KEY_PATH_ENV = "POLICY_CONFIG_ROOT_KEY_PATH";
/** The `.policy` config directory. Off-workspace by default; env override for tests/deploys. */
const CONFIG_DIR_ENV = "POLICY_CONFIG_DIR";

const MANIFEST_FILE = "config-manifest.json";
const TRUST_ROOTS_FILE = "trust-roots.json";
const BREAKPOINT_POLICY_FILE = "breakpoint-policy.json";

export interface TrustedBreakpointPolicy {
  /**
   * True when a config anchor is pinned (enforcement is a live requirement for this
   * deployment). When false, enforcement is inactive (back-compat) and the caller
   * leaves unsigned breakpoint answers unaffected.
   */
  enforcementActive: boolean;
  /**
   * Set ONLY when `enforcementActive` is true and the trust anchor could NOT be
   * established (missing/edited/corrupt/untrusted config). The caller MUST treat every
   * breakpoint that the (trusted, when readable) policy marks as requiring a signature
   * as a REJECT — the requirement cannot be trustworthily determined ⇒ deny.
   */
  configError?: string;
  /**
   * Decide whether the given breakpoint requires a signature. When the trusted policy is
   * unreadable this is a FAIL-CLOSED default (returns true) so a config error denies.
   */
  requiresSignature(breakpointId: string | undefined): boolean;
  /** The trusted `human` root fingerprints from the manifest-verified trust-roots (AC-35). */
  trustedHumanFingerprints: string[];
  /**
   * The trust-anchored base dir handed to proven `verifyAnswer` for raw-signature
   * checking. This is the manifest-verified `.policy` dir's key store — NOT any
   * task.json-supplied directory (defect 2). The gate ALSO checks the resolved
   * fingerprint is in `trustedHumanFingerprints`, so a raw verify against a stray key
   * is still rejected.
   */
  trustedKeysBaseDir?: string;
}

interface BreakpointPolicyDoc {
  /** When true, EVERY breakpoint requires a signature unless explicitly exempted. */
  requireSignatureForAllBreakpoints?: boolean;
  /** Breakpoint ids that require a signature (used when the default is false). */
  signedBreakpointIds?: string[];
  /** Breakpoint ids exempted from the all-breakpoints default. */
  exemptBreakpointIds?: string[];
}

function readEnv(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/** Resolve the `.policy` config dir: explicit env pin, else `<projectRoot>/.policy`. */
function resolveConfigDir(projectRoot: string): string {
  return readEnv(CONFIG_DIR_ENV) ?? path.join(projectRoot, ".policy");
}

async function readFileOrUndefined(file: string): Promise<string | undefined> {
  try {
    return await fs.readFile(file, "utf8");
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") return undefined;
    throw err;
  }
}

/**
 * Load + verify the trust-anchored breakpoint policy for a run/project.
 *
 * `projectRoot` is the anchor for the default `.policy` location (typically the run's
 * project root, resolvable from the run dir). It is NOT the per-effect task dir.
 */
export async function loadTrustedBreakpointPolicy(
  projectRoot: string,
): Promise<TrustedBreakpointPolicy> {
  const pinnedConfigRootFp = readEnv(CONFIG_ROOT_FP_ENV);

  // No off-workspace anchor pinned → enforcement inactive (pre-Milestone-C default).
  if (!pinnedConfigRootFp) {
    return {
      enforcementActive: false,
      requiresSignature: () => false,
      trustedHumanFingerprints: [],
    };
  }

  // Anchor IS pinned: any failure below is a fail-closed config error (deny), never skip.
  const denied = (reason: string): TrustedBreakpointPolicy => ({
    enforcementActive: true,
    configError: reason,
    // Fail closed: with no trusted policy readable, treat every breakpoint as requiring
    // a signature so the caller denies (a config error must never let an unsigned answer
    // through).
    requiresSignature: () => true,
    trustedHumanFingerprints: [],
  });

  try {
    const minEpoch = Number(readEnv(CONFIG_MIN_EPOCH_ENV) ?? "1");
    if (!Number.isFinite(minEpoch)) return denied("POLICY_CONFIG_MIN_EPOCH is not a number");

    // Resolve the config-root PUBLIC key material from the off-workspace pin.
    let configRootKey = readEnv(CONFIG_ROOT_KEY_ENV);
    if (!configRootKey) {
      const keyPath = readEnv(CONFIG_ROOT_KEY_PATH_ENV);
      if (keyPath) configRootKey = await readFileOrUndefined(keyPath);
    }
    if (!configRootKey) return denied("config-root key material is not pinned");

    const configDir = resolveConfigDir(projectRoot);

    const manifestRaw = await readFileOrUndefined(path.join(configDir, MANIFEST_FILE));
    if (manifestRaw === undefined) return denied(`missing ${MANIFEST_FILE}`);
    let manifest: unknown;
    try {
      manifest = JSON.parse(manifestRaw);
    } catch {
      return denied(`corrupt ${MANIFEST_FILE}`);
    }

    // Read every config file the manifest could cover; the verifier requires each
    // on-disk file to be listed in the manifest with a matching hash (AC-36 step 3).
    const files: Record<string, string> = {};
    for (const name of [TRUST_ROOTS_FILE, BREAKPOINT_POLICY_FILE]) {
      const bytes = await readFileOrUndefined(path.join(configDir, name));
      if (bytes !== undefined) files[name] = bytes;
    }
    if (files[TRUST_ROOTS_FILE] === undefined) return denied(`missing ${TRUST_ROOTS_FILE}`);

    // Dynamically import the ESM policy-adapter (same pattern as proven-verification.ts).
    let adapter: PolicyAdapterModule;
    try {
      const mod = "@a5c-ai/policy-adapter";
      adapter = (await import(/* webpackIgnore: true */ mod)) as unknown as PolicyAdapterModule;
    } catch (err) {
      // The trust core is REQUIRED to establish the anchor; if it cannot load, deny.
      return denied(`policy-adapter unavailable: ${(err as Error)?.message ?? String(err)}`);
    }
    if (typeof adapter.verifyConfigManifest !== "function") {
      return denied("policy-adapter.verifyConfigManifest missing");
    }

    const configRoot: TrustRootLike = {
      fingerprint: pinnedConfigRootFp,
      kind: "config",
      publicKey: configRootKey,
      label: "pinned-config-root",
    };

    const verification = adapter.verifyConfigManifest(manifest, {
      pinnedConfigRootFp,
      configRoot,
      minEpoch,
      files,
    });
    if (!verification.valid) {
      return denied(`config manifest not trusted: ${verification.reason ?? "invalid"}`);
    }

    // The manifest verified: trust-roots.json + breakpoint-policy.json are now
    // integrity-anchored. Parse the trusted human roots (AC-35).
    let trustRootsDoc: unknown;
    try {
      trustRootsDoc = JSON.parse(files[TRUST_ROOTS_FILE]);
    } catch {
      return denied(`corrupt ${TRUST_ROOTS_FILE}`);
    }
    const trustedHumanFingerprints = extractHumanFingerprints(trustRootsDoc);

    // Parse the (now-trusted) breakpoint policy. Absent → default: every breakpoint
    // requires a signature (fail-closed default when the anchor is active).
    let policyDoc: BreakpointPolicyDoc = { requireSignatureForAllBreakpoints: true };
    if (files[BREAKPOINT_POLICY_FILE] !== undefined) {
      try {
        policyDoc = JSON.parse(files[BREAKPOINT_POLICY_FILE]) as BreakpointPolicyDoc;
      } catch {
        return denied(`corrupt ${BREAKPOINT_POLICY_FILE}`);
      }
    }

    const requiresSignature = (breakpointId: string | undefined): boolean => {
      const signed = new Set(policyDoc.signedBreakpointIds ?? []);
      const exempt = new Set(policyDoc.exemptBreakpointIds ?? []);
      if (policyDoc.requireSignatureForAllBreakpoints === true) {
        return breakpointId === undefined ? true : !exempt.has(breakpointId);
      }
      return breakpointId !== undefined && signed.has(breakpointId);
    };

    return {
      enforcementActive: true,
      requiresSignature,
      trustedHumanFingerprints,
      // proven verifyAnswer resolves trusted keys from `<baseDir>/.keys/trusted`; anchor
      // it at the manifest-verified config dir so the key store is trust-anchored, not
      // task.json-supplied. The gate ALSO checks the resolved fingerprint membership.
      trustedKeysBaseDir: configDir,
    };
  } catch (err) {
    return denied(`enforcement config error: ${(err as Error)?.message ?? String(err)}`);
  }
}

/** Extract the fingerprints of every non-revoked `human` trust root. */
function extractHumanFingerprints(doc: unknown): string[] {
  const roots = extractTrustRoots(doc);
  return roots
    .filter((r) => r.kind === "human" && r.revoked !== true && typeof r.fingerprint === "string")
    .map((r) => r.fingerprint);
}

function extractTrustRoots(doc: unknown): TrustRootLike[] {
  if (Array.isArray(doc)) return doc as TrustRootLike[];
  if (doc && typeof doc === "object") {
    const d = doc as Record<string, unknown>;
    if (Array.isArray(d.trustRoots)) return d.trustRoots as TrustRootLike[];
    if (Array.isArray(d.roots)) return d.roots as TrustRootLike[];
  }
  return [];
}
