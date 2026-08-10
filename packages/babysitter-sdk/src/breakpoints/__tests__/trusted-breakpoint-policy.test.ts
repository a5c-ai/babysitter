/**
 * Milestone C — trust-anchored signed-breakpoint policy (SDK), closing the two
 * evidence-producer defects found by adversarial review (score 58):
 *
 *   DEFECT 1 (fail-open via workspace-writable task.json): the requirement + trusted
 *     keys were read from `tasks/<id>/task.json`, so deleting/corrupting it erased the
 *     requirement (gate returned WITHOUT enforcing). Now the requirement comes from the
 *     integrity-protected, config-manifest-signed `.policy/breakpoint-policy.json`, and a
 *     required-signature breakpoint whose trust config is unreadable is REJECTED.
 *
 *   DEFECT 2 (agent-controlled trust anchor): the trusted-key dir was read from task.json,
 *     letting the agent self-sign with its own key. Now WHICH `human` keys are trusted
 *     comes ONLY from the manifest-verified `.policy/trust-roots.json`.
 *
 * These tests build a genuinely signed config manifest (the same primitives Milestone A
 * uses) and assert fail-closed behavior against tampering.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createKeyPair, signPayload } from "@a5c-ai/genty-core/trust";

import { loadTrustedBreakpointPolicy } from "../trusted-breakpoint-policy";

const sha256 = (s: string): string => createHash("sha256").update(s).digest("hex");
const MANIFEST_FIELDS = ["payloadType", "configEpoch", "files", "issuedAt"];

interface Fixture {
  configDir: string;
  humanFp: string;
  configRootKey: string;
  configRootFp: string;
}

const savedEnv: Record<string, string | undefined> = {};
const ENV_KEYS = [
  "POLICY_CONFIG_ROOT_FP",
  "POLICY_CONFIG_MIN_EPOCH",
  "POLICY_CONFIG_ROOT_KEY",
  "POLICY_CONFIG_DIR",
];

let tmpDirs: string[] = [];

function makeFixture(opts?: {
  trustRootsBytes?: string;
  breakpointPolicyBytes?: string;
  epoch?: number;
  /** Corrupt the trust-roots ON DISK after signing (hash mismatch → deny). */
  tamperTrustRootsAfterSign?: string;
  omitBreakpointPolicy?: boolean;
}): Fixture {
  const configDir = mkdtempSync(join(tmpdir(), "policy-"));
  tmpDirs.push(configDir);

  const humanKp = createKeyPair();
  const configRoot = createKeyPair();

  const trustRootsBytes =
    opts?.trustRootsBytes ??
    JSON.stringify({
      roots: [
        { fingerprint: humanKp.fingerprint, kind: "human", publicKey: humanKp.publicKey, label: "alice" },
      ],
    });
  const breakpointPolicyBytes =
    opts?.breakpointPolicyBytes ??
    JSON.stringify({ requireSignatureForAllBreakpoints: true });

  const files: Array<{ path: string; sha256: string }> = [
    { path: "trust-roots.json", sha256: sha256(trustRootsBytes) },
  ];
  if (!opts?.omitBreakpointPolicy) {
    files.push({ path: "breakpoint-policy.json", sha256: sha256(breakpointPolicyBytes) });
  }

  const manifestPayload = {
    payloadType: "config-manifest" as const,
    configEpoch: opts?.epoch ?? 1,
    files,
    issuedAt: "2026-07-03T00:00:00.000Z",
  };
  const manifestEnv = signPayload(
    configRoot.privateKey,
    configRoot.fingerprint,
    manifestPayload,
    MANIFEST_FIELDS,
  );

  writeFileSync(join(configDir, "config-manifest.json"), JSON.stringify(manifestEnv));
  writeFileSync(
    join(configDir, "trust-roots.json"),
    opts?.tamperTrustRootsAfterSign ?? trustRootsBytes,
  );
  if (!opts?.omitBreakpointPolicy) {
    writeFileSync(join(configDir, "breakpoint-policy.json"), breakpointPolicyBytes);
  }

  return {
    configDir,
    humanFp: humanKp.fingerprint,
    configRootKey: configRoot.publicKey,
    configRootFp: configRoot.fingerprint,
  };
}

function pinEnv(fx: Fixture, overrides?: Partial<Record<string, string>>) {
  process.env.POLICY_CONFIG_ROOT_FP = fx.configRootFp;
  process.env.POLICY_CONFIG_MIN_EPOCH = "1";
  process.env.POLICY_CONFIG_ROOT_KEY = fx.configRootKey;
  process.env.POLICY_CONFIG_DIR = fx.configDir;
  if (overrides) Object.assign(process.env, overrides);
}

beforeEach(() => {
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
  tmpDirs = [];
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

describe("Milestone C — trust-anchored breakpoint policy (defects 1 & 2)", () => {
  it("no config anchor pinned → enforcement inactive (back-compat pass-through)", async () => {
    delete process.env.POLICY_CONFIG_ROOT_FP;
    const policy = await loadTrustedBreakpointPolicy(process.cwd());
    expect(policy.enforcementActive).toBe(false);
    expect(policy.requiresSignature("bp-deploy")).toBe(false);
  });

  it("valid signed manifest → enforcement active, human fingerprint sourced from trust-roots", async () => {
    const fx = makeFixture();
    pinEnv(fx);
    const policy = await loadTrustedBreakpointPolicy(process.cwd());
    expect(policy.enforcementActive).toBe(true);
    expect(policy.configError).toBeUndefined();
    expect(policy.requiresSignature("bp-deploy-prod")).toBe(true);
    // DEFECT 2: the trusted human key comes from the manifest-verified trust-roots.
    expect(policy.trustedHumanFingerprints).toEqual([fx.humanFp]);
  });

  it("DEFECT 1: anchor pinned but manifest MISSING → configError, requiresSignature stays true (deny)", async () => {
    const fx = makeFixture();
    pinEnv(fx);
    // Simulate the workspace-writable agent deleting the trusted config.
    rmSync(join(fx.configDir, "config-manifest.json"), { force: true });
    const policy = await loadTrustedBreakpointPolicy(process.cwd());
    expect(policy.enforcementActive).toBe(true);
    expect(policy.configError).toBeDefined();
    // Fail closed: an unreadable trust anchor must NOT drop the requirement.
    expect(policy.requiresSignature("bp-deploy-prod")).toBe(true);
    expect(policy.trustedHumanFingerprints).toEqual([]);
  });

  it("DEFECT 1: trust-roots CORRUPTED on disk after signing (hash mismatch) → deny-all", async () => {
    const fx = makeFixture({ tamperTrustRootsAfterSign: '{"roots":[{"fingerprint":"fp-attacker","kind":"human"}]}' });
    pinEnv(fx);
    const policy = await loadTrustedBreakpointPolicy(process.cwd());
    expect(policy.configError).toBeDefined();
    expect(policy.requiresSignature("bp-deploy-prod")).toBe(true);
  });

  it("manifest signed by a NON-config-root key (wrong signer) → deny-all", async () => {
    const fx = makeFixture();
    // Pin a DIFFERENT config-root fingerprint/key than the one that signed the manifest.
    const attacker = createKeyPair();
    pinEnv(fx, {
      POLICY_CONFIG_ROOT_FP: attacker.fingerprint,
      POLICY_CONFIG_ROOT_KEY: attacker.publicKey,
    });
    const policy = await loadTrustedBreakpointPolicy(process.cwd());
    expect(policy.configError).toBeDefined();
    expect(policy.requiresSignature("bp-deploy-prod")).toBe(true);
  });

  it("epoch below the pinned floor → deny-all (anti-rollback)", async () => {
    const fx = makeFixture({ epoch: 1 });
    pinEnv(fx, { POLICY_CONFIG_MIN_EPOCH: "5" });
    const policy = await loadTrustedBreakpointPolicy(process.cwd());
    expect(policy.configError).toBeDefined();
  });

  it("breakpoint-policy selects specific ids when not all-required", async () => {
    const fx = makeFixture({
      breakpointPolicyBytes: JSON.stringify({
        requireSignatureForAllBreakpoints: false,
        signedBreakpointIds: ["deploy-prod"],
      }),
    });
    pinEnv(fx);
    const policy = await loadTrustedBreakpointPolicy(process.cwd());
    expect(policy.enforcementActive).toBe(true);
    expect(policy.configError).toBeUndefined();
    expect(policy.requiresSignature("deploy-prod")).toBe(true);
    expect(policy.requiresSignature("harmless-note")).toBe(false);
  });
});
