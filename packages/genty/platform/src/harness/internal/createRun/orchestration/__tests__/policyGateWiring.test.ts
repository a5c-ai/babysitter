import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createKeyPair, signPayload } from "@a5c-ai/genty-core/trust";
import {
  issueCommandAuthorization,
  argsHash as computeArgsHash,
  commandHash as computeCommandHash,
  type TrustRoot,
} from "@a5c-ai/policy-adapter";
import {
  applyPolicyGateSync,
  resolveRunPolicyGates,
  withPolicyGate,
  registerRunAuthorizationResolver,
  unregisterRunAuthorizationResolver,
  __resetRunPolicyGatesCache,
} from "../policy-enforcement-wiring";
import type { AgentCoreSessionOptions } from "@a5c-ai/genty-core";

const sha256 = (s: string): string => createHash("sha256").update(s).digest("hex");

/**
 * Milestone D — CENTRALIZED session-gate wiring (§9.4 / AC-49).
 *
 * Proves the fix for adversarial-review defect #4: every tool-executing
 * `createAgentCoreSession` construction routes through one funnel
 * (`withPolicyGate` / `applyPolicyGateSync`), so no site can silently omit the
 * load-bearing `policyToolGate`. Also proves the fold-in: with the anchor pinned
 * but the adapter unavailable, resolution FAILS CLOSED (a deny-all gate), never a
 * silent disable.
 */
describe("Milestone D — centralized policy session-gate wiring", () => {
  const prevFp = process.env.POLICY_CONFIG_ROOT_FP;

  beforeEach(() => {
    __resetRunPolicyGatesCache();
    delete process.env.POLICY_CONFIG_ROOT_FP;
  });

  afterEach(() => {
    __resetRunPolicyGatesCache();
    if (prevFp === undefined) delete process.env.POLICY_CONFIG_ROOT_FP;
    else process.env.POLICY_CONFIG_ROOT_FP = prevFp;
  });

  it("unpinned anchor → resolveRunPolicyGates returns no gate (back-compat)", async () => {
    const gates = await resolveRunPolicyGates("/some/workspace");
    expect(gates.policyToolGate).toBeUndefined();
    expect(gates.mcpPolicyGate).toBeUndefined();
  });

  it("withPolicyGate leaves options unchanged when the anchor is unpinned", async () => {
    const opts: AgentCoreSessionOptions = { workspace: "/ws", ephemeral: true };
    const gated = await withPolicyGate(opts, "/ws");
    expect(gated.policyToolGate).toBeUndefined();
  });

  it("applyPolicyGateSync attaches a provided gate to session options", () => {
    const gate = () => ({ allowed: false, reason: "denied" });
    const gated = applyPolicyGateSync({ workspace: "/ws", ephemeral: true }, gate);
    expect(gated.policyToolGate).toBe(gate);
  });

  it("applyPolicyGateSync is idempotent — an already-gated option is not overwritten", () => {
    const existing = () => ({ allowed: true });
    const other = () => ({ allowed: false });
    const gated = applyPolicyGateSync({ workspace: "/ws", policyToolGate: existing }, other);
    expect(gated.policyToolGate).toBe(existing);
  });

  it("applyPolicyGateSync with no gate leaves options unchanged (unpinned back-compat)", () => {
    const opts: AgentCoreSessionOptions = { workspace: "/ws" };
    expect(applyPolicyGateSync(opts, undefined)).toBe(opts);
  });

  // ── Milestone E — ALLOW-path threading (§5 / AC-9 / AC-49) ──────────────────
  // A registered run authorization-store resolver is threaded into the load-bearing gate
  // WITHOUT the session call site passing it, so a legitimately-authorized covered action is
  // ALLOWED. With no registered resolver a covered action DENIES (fail closed, unchanged).
  describe("Milestone E — registered authorization-store resolver threads the ALLOW path", () => {
    const CONFIG_ENV = [
      "POLICY_CONFIG_ROOT_FP",
      "POLICY_CONFIG_MIN_EPOCH",
      "POLICY_CONFIG_ROOT_KEY",
      "POLICY_CONFIG_DIR",
      "POLICY_ISSUER_ROOTS",
    ];

    const POLICY_YAML = `version: 1
commandDefaultAllow: false
actions:
  - id: aws-prod-write
    match:
      tool: "Bash"
      argv:
        program: "aws"
        subcommandEquals: ["s3 rm", "s3 cp"]
    chains:
      - id: human-only
        requirements:
          - step:
              kind: human-approval
`;

    let workspace: string | undefined;

    function materialize(): { workspace: string; issuerKp: ReturnType<typeof createKeyPair>; issuerRoots: TrustRoot[]; policyDocHash: string; epoch: number } {
      const ws = mkdtempSync(join(tmpdir(), "policy-allow-thread-"));
      const configDir = join(ws, ".policy");
      const policiesDir = join(configDir, "policies");
      mkdirSync(policiesDir, { recursive: true });
      const trustRootsBytes = JSON.stringify({ trustRoots: [] });
      writeFileSync(join(configDir, "trust-roots.json"), trustRootsBytes);
      writeFileSync(join(policiesDir, "aws.yaml"), POLICY_YAML);
      const configRoot = createKeyPair();
      const epoch = 9;
      const manifestPayload = {
        payloadType: "config-manifest" as const,
        configEpoch: epoch,
        files: [
          { path: "trust-roots.json", sha256: sha256(trustRootsBytes) },
          { path: "policies/aws.yaml", sha256: sha256(POLICY_YAML) },
        ],
        issuedAt: "2026-07-03T00:00:00.000Z",
      };
      const manifest = signPayload(configRoot.privateKey, configRoot.fingerprint, manifestPayload, ["payloadType", "configEpoch", "files", "issuedAt"]);
      writeFileSync(join(configDir, "config-manifest.json"), JSON.stringify(manifest));
      const issuerKp = createKeyPair();
      const issuerRoots: TrustRoot[] = [{ fingerprint: issuerKp.fingerprint, kind: "engine", publicKey: issuerKp.publicKey, label: "issuer" }];
      process.env.POLICY_CONFIG_ROOT_FP = configRoot.fingerprint;
      process.env.POLICY_CONFIG_MIN_EPOCH = String(epoch);
      process.env.POLICY_CONFIG_ROOT_KEY = configRoot.publicKey;
      process.env.POLICY_CONFIG_DIR = configDir;
      process.env.POLICY_ISSUER_ROOTS = JSON.stringify(issuerRoots);
      return { workspace: ws, issuerKp, issuerRoots, policyDocHash: sha256(POLICY_YAML), epoch };
    }

    function validAuth(a: ReturnType<typeof materialize>, toolCallId: string, input: unknown, command: string) {
      const humanKp = createKeyPair();
      const humanRoot: TrustRoot = { fingerprint: humanKp.fingerprint, kind: "human", publicKey: humanKp.publicKey, label: "alice" };
      const evidence = signPayload(
        humanKp.privateKey,
        humanKp.fingerprint,
        { payloadType: "human-approval", action: "aws-prod-write", scope: "aws:prod:s3", approvedBy: "alice", approvedAt: "2026-07-03T00:00:00.000Z" },
        ["payloadType", "action", "scope", "approvedBy", "approvedAt"],
      );
      const result = issueCommandAuthorization({
        issuerKeyPair: a.issuerKp,
        store: { trustRoots: [...a.issuerRoots, humanRoot] },
        policyId: "aws-prod-write",
        policyDocHash: a.policyDocHash,
        matchedChainId: "human-only",
        configEpoch: a.epoch,
        minEpochFloor: a.epoch,
        toolName: "Bash",
        toolCallId,
        commandHash: computeCommandHash(command),
        argsHash: computeArgsHash(input),
        credentialScope: "",
        authorizationTtlSeconds: 120,
        requiredStepCount: 1,
        evidenceUsed: [{ kind: "human-approval", envelope: evidence, stepIndex: 0 }],
      });
      if (!result.issued || !result.authorization) throw new Error(`issue failed: ${result.reason}`);
      return result.authorization;
    }

    beforeEach(() => {
      for (const k of CONFIG_ENV) delete process.env[k];
      __resetRunPolicyGatesCache();
    });
    afterEach(() => {
      if (workspace) {
        unregisterRunAuthorizationResolver(workspace);
        rmSync(workspace, { recursive: true, force: true });
      }
      workspace = undefined;
      __resetRunPolicyGatesCache();
      for (const k of CONFIG_ENV) delete process.env[k];
    });

    it("ALLOW: a registered resolver threads into resolveRunPolicyGates → covered action ALLOWED", async () => {
      const a = materialize();
      workspace = a.workspace;
      const input = { command: "aws s3 rm s3://bucket/key" };
      const toolCallId = "call-allow-thread";
      const auth = validAuth(a, toolCallId, input, input.command);

      // Register the run's store resolver (what the orchestrator does after issuing).
      registerRunAuthorizationResolver(a.workspace, (ctx) => (ctx.toolCallId === toolCallId ? auth : undefined));

      // The session call site does NOT pass a resolver — it is threaded from the registry.
      const gates = await resolveRunPolicyGates(a.workspace);
      expect(gates.policyToolGate).toBeDefined();
      const decision = gates.policyToolGate!({ toolName: "Bash", toolCallId, input });
      expect(decision.allowed, decision.reason).toBe(true);
    });

    it("DENY (fail closed): with NO registered resolver, the covered action is DENIED", async () => {
      const a = materialize();
      workspace = a.workspace;
      const gates = await resolveRunPolicyGates(a.workspace);
      expect(gates.policyToolGate).toBeDefined();
      const decision = gates.policyToolGate!({
        toolName: "Bash",
        toolCallId: "call-none",
        input: { command: "aws s3 rm s3://bucket/key" },
      });
      expect(decision.allowed).toBe(false);
    });
  });

  it("FOLD-IN: pinned anchor + adapter unavailable → FAIL CLOSED (deny-all gate), not a silent disable", async () => {
    // Pin the anchor but point at a workspace/config that cannot yield a valid manifest.
    // The adapter loads and reports enforcement inactive (no .policy config) → because the
    // anchor is pinned this is a contradiction, so a DENY-ALL gate is installed.
    process.env.POLICY_CONFIG_ROOT_FP = "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
    __resetRunPolicyGatesCache();
    const gates = await resolveRunPolicyGates("/nonexistent/workspace-xyz");
    // A gate MUST be present (enforcement was requested); it must DENY covered actions.
    expect(gates.policyToolGate).toBeDefined();
    const decision = gates.policyToolGate!({ toolName: "Bash", toolCallId: "c1", input: { command: "rm -rf /" } });
    expect(decision.allowed).toBe(false);
    expect(gates.mcpPolicyGate).toBeDefined();
    expect(gates.mcpPolicyGate!({ toolName: "Bash", input: {} }).allowed).toBe(false);
  });
});
