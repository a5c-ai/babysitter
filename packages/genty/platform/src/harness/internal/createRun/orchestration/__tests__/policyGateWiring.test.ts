import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyPolicyGateSync,
  resolveRunPolicyGates,
  withPolicyGate,
  __resetRunPolicyGatesCache,
} from "../policy-enforcement-wiring";
import type { AgentCoreSessionOptions } from "@a5c-ai/genty-core";

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
