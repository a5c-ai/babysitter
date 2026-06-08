import { describe, it, expect, beforeEach } from "vitest";
import { createOrchestrationRegistry } from "../registry";
import type { OrchestrationRegistry } from "../registry";
import type {
  OrchestrationProvider,
  JournalProvider,
  GovernanceProvider,
  ExternalAgentProvider,
  SessionProvider,
  ProcessDefinitionProvider,
  RunHandle,
  RunEvent,
  IterationResult,
  PendingEffect,
} from "../interfaces";

// ── Stubs ───────────────────────────────────────────────────────────────

function stubOrchestrationProvider(name: string): OrchestrationProvider {
  return {
    name,
    createRun: async () => ({ runId: "r1", runDir: "/tmp/r1", processId: "p1", status: "pending" }),
    iterateRun: async () =>
      ({ iteration: 1, status: "executed", action: "test", reason: "stub", pendingEffects: [] }) as IterationResult,
    postEffectResult: async () => {},
    getRunStatus: async (h: RunHandle) => h,
    getRunEvents: async () => [] as RunEvent[],
    getPendingEffects: async () => [] as PendingEffect[],
    resolveRunsDir: () => "/tmp/runs",
  };
}

function stubJournalProvider(): JournalProvider {
  return {
    loadEvents: async () => [],
    appendEvent: async () => {},
  };
}

function stubGovernanceProvider(): GovernanceProvider {
  return {
    evaluateBreakpoint: async () => ({ autoApprove: false }),
    getApprovalPosture: () => "ask",
  };
}

function stubAgentDiscoveryProvider(): ExternalAgentProvider {
  return {
    discoverAgents: async () => [],
  };
}

function stubSessionProvider(): SessionProvider {
  return {
    resolveSessionId: () => "sess-1",
    bindSession: async () => {},
  };
}

function stubProcessDefinitionProvider(): ProcessDefinitionProvider {
  return {
    validateProcess: async () => ({ valid: true, errors: [], warnings: [] }),
    loadProcess: async () => ({ entrypoint: "index.ts", exportName: "default" }),
  };
}

// ── Tests ───────────────────────────────────────────────────────────────

describe("OrchestrationRegistry", () => {
  let registry: OrchestrationRegistry;

  beforeEach(() => {
    registry = createOrchestrationRegistry();
  });

  // ── Orchestration provider ──────────────────────────────────────────

  describe("orchestration provider", () => {
    it("can register and retrieve by name", () => {
      const provider = stubOrchestrationProvider("babysitter");
      registry.registerOrchestration("babysitter", provider);
      expect(registry.getOrchestration("babysitter")).toBe(provider);
    });

    it("provides a default orchestration provider when none explicitly registered", () => {
      // The registry pre-registers a "babysitter" orchestration provider so the
      // genty runtime, API commands, and tests have a working provider without
      // loading the plugin's register.ts. See #936.
      const provider = registry.getOrchestration();
      expect(provider).toBeDefined();
      expect(typeof provider.createRun).toBe("function");
      expect(typeof provider.postEffectResult).toBe("function");
    });

    it("throws when named provider not found", () => {
      registry.registerOrchestration("alpha", stubOrchestrationProvider("alpha"));
      expect(() => registry.getOrchestration("beta")).toThrow(/no orchestration provider registered with name "beta"/i);
    });

    it("supports multiple named providers", () => {
      const alpha = stubOrchestrationProvider("alpha");
      const beta = stubOrchestrationProvider("beta");
      registry.registerOrchestration("alpha", alpha);
      registry.registerOrchestration("beta", beta);

      expect(registry.getOrchestration("alpha")).toBe(alpha);
      expect(registry.getOrchestration("beta")).toBe(beta);
    });

    it("keeps the default babysitter provider first when name omitted", () => {
      const first = stubOrchestrationProvider("first");
      const second = stubOrchestrationProvider("second");
      registry.registerOrchestration("first", first);
      registry.registerOrchestration("second", second);

      // "babysitter" is pre-registered, so it remains the first-wins provider.
      expect(registry.getOrchestration()).toBe(registry.getOrchestration("babysitter"));
    });

    it("lists registered provider names including the default", () => {
      registry.registerOrchestration("alpha", stubOrchestrationProvider("alpha"));
      registry.registerOrchestration("beta", stubOrchestrationProvider("beta"));
      expect(registry.listProviders()).toEqual(["babysitter", "alpha", "beta"]);
    });

    it("lists only the default provider when nothing else registered", () => {
      expect(registry.listProviders()).toEqual(["babysitter"]);
    });
  });

  // ── Journal provider ────────────────────────────────────────────────

  describe("journal provider", () => {
    it("can register and retrieve by name", () => {
      const provider = stubJournalProvider();
      registry.registerJournal("custom", provider);
      expect(registry.getJournal("custom")).toBe(provider);
    });

    it("provides a default filesystem journal when none explicitly registered", () => {
      // The registry pre-registers an "fs" filesystem journal so API
      // functions (CLI, tests, standalone scripts) work without explicit
      // provider registration. Journal access is genty-native and never
      // throws for a missing provider.
      const journal = registry.getJournal();
      expect(journal).toBeDefined();
      expect(typeof journal.loadEvents).toBe("function");
      expect(typeof journal.appendEvent).toBe("function");
    });

    it("keeps the default fs journal first when name omitted", () => {
      const provider = stubJournalProvider();
      registry.registerJournal("default", provider);
      // "fs" is pre-registered, so it remains the first-wins provider.
      expect(registry.getJournal()).toBe(registry.getJournal("fs"));
    });
  });

  // ── Governance provider ─────────────────────────────────────────────

  describe("governance provider", () => {
    it("can register and retrieve", () => {
      const provider = stubGovernanceProvider();
      registry.registerGovernance("policy", provider);
      expect(registry.getGovernance("policy")).toBe(provider);
    });

    it("throws when no provider registered", () => {
      expect(() => registry.getGovernance()).toThrow(/no governance provider registered/i);
    });

    it("returns first when name omitted", () => {
      const provider = stubGovernanceProvider();
      registry.registerGovernance("default", provider);
      expect(registry.getGovernance()).toBe(provider);
    });
  });

  // ── Agent discovery provider ────────────────────────────────────────

  describe("agent discovery provider", () => {
    it("can register and retrieve", () => {
      const provider = stubAgentDiscoveryProvider();
      registry.registerAgentDiscovery("workspace", provider);
      expect(registry.getAgentDiscovery("workspace")).toBe(provider);
    });

    it("throws when no provider registered", () => {
      expect(() => registry.getAgentDiscovery()).toThrow(/no agentDiscovery provider registered/i);
    });

    it("returns first when name omitted", () => {
      const provider = stubAgentDiscoveryProvider();
      registry.registerAgentDiscovery("default", provider);
      expect(registry.getAgentDiscovery()).toBe(provider);
    });
  });

  // ── Session provider ────────────────────────────────────────────────

  describe("session provider", () => {
    it("can register and retrieve", () => {
      const provider = stubSessionProvider();
      registry.registerSession("marker", provider);
      expect(registry.getSession("marker")).toBe(provider);
    });

    it("throws when no provider registered", () => {
      expect(() => registry.getSession()).toThrow(/no session provider registered/i);
    });

    it("returns first when name omitted", () => {
      const provider = stubSessionProvider();
      registry.registerSession("default", provider);
      expect(registry.getSession()).toBe(provider);
    });
  });

  // ── Process definition provider ─────────────────────────────────────

  describe("process definition provider", () => {
    it("can register and retrieve", () => {
      const provider = stubProcessDefinitionProvider();
      registry.registerProcessDefinition("yaml", provider);
      expect(registry.getProcessDefinition("yaml")).toBe(provider);
    });

    it("throws when no provider registered", () => {
      expect(() => registry.getProcessDefinition()).toThrow(/no processDefinition provider registered/i);
    });

    it("returns first when name omitted", () => {
      const provider = stubProcessDefinitionProvider();
      registry.registerProcessDefinition("default", provider);
      expect(registry.getProcessDefinition()).toBe(provider);
    });
  });
});
