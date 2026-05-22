import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  Breakpoint,
  BreakpointAnswer,
  BreakpointContext,
  BreakpointRouting,
  BreakpointWaitResult,
  InteractionKind,
  RoutingConfig,
} from "../types.js";
import type {
  BreakpointBackend,
  SubmitBreakpointParams,
  SubmitAnswerParams,
  WaitForAnswerOptions,
} from "../backend.js";

// ────────────────────────────────────────────────────────────────────────────
// Dynamic imports for harness integration modules.
// These are loaded lazily so that individual test failures are visible
// rather than a single top-level import failure blocking all tests.
// ────────────────────────────────────────────────────────────────────────────

async function importInteractionProvider() {
  return import("../harness/interaction-provider.js");
}

async function importRoutingRules() {
  return import("../harness/routing-rules.js");
}

async function importHarnessBarrel() {
  return import("../harness/index.js");
}

// ────────────────────────────────────────────────────────────────────────────
// Test Factories
// ────────────────────────────────────────────────────────────────────────────

const NOW = "2026-04-21T10:00:00.000Z";
const LATER = "2026-04-21T10:30:00.000Z";

function makeContext(overrides: Partial<BreakpointContext> = {}): BreakpointContext {
  return {
    description: "A test breakpoint",
    codeSnippets: [],
    fileReferences: [],
    tags: [],
    ...overrides,
  };
}

function makeRouting(overrides: Partial<BreakpointRouting> = {}): BreakpointRouting {
  return {
    strategy: "first-response-wins",
    targetResponders: [],
    timeoutMs: 1_800_000,
    presentToUser: false,
    ...overrides,
  };
}

function makeBreakpoint(overrides: Partial<Breakpoint> = {}): Breakpoint {
  return {
    id: "bp-001",
    text: "Should we use connection pooling?",
    context: makeContext(),
    status: "pending",
    routing: makeRouting(),
    answers: [],
    createdAt: NOW,
    updatedAt: NOW,
    expiresAt: LATER,
    ...overrides,
  };
}

function makeAnswer(overrides: Partial<BreakpointAnswer> = {}): BreakpointAnswer {
  return {
    id: "answer-001",
    breakpointId: "bp-001",
    responderId: "tal",
    responderName: "Tal M",
    text: "Yes, use connection pooling with ioredis.",
    approved: true,
    confidence: 90,
    references: ["https://github.com/redis/ioredis#cluster"],
    followUpQuestions: [],
    answeredAt: NOW,
    ...overrides,
  };
}

function makeWaitResult(overrides: Partial<BreakpointWaitResult> = {}): BreakpointWaitResult {
  const answer = makeAnswer();
  return {
    answered: true,
    breakpoint: makeBreakpoint({ status: "answered", answers: [answer] }),
    answer,
    allAnswers: [answer],
    elapsedMs: 5000,
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Mock Backend Factory
// ────────────────────────────────────────────────────────────────────────────

function createMockBackend(
  name: string = "mock-backend",
  overrides: Partial<BreakpointBackend> = {},
): BreakpointBackend {
  return {
    name,
    submitBreakpoint: vi.fn<(params: SubmitBreakpointParams) => Promise<Breakpoint>>()
      .mockResolvedValue(makeBreakpoint()),
    getBreakpoint: vi.fn<(id: string) => Promise<Breakpoint>>()
      .mockResolvedValue(makeBreakpoint()),
    waitForAnswer: vi.fn<(id: string, options?: WaitForAnswerOptions) => Promise<BreakpointWaitResult>>()
      .mockResolvedValue(makeWaitResult()),
    listPendingBreakpoints: vi.fn<(responderId?: string) => Promise<Breakpoint[]>>()
      .mockResolvedValue([makeBreakpoint()]),
    answerBreakpoint: vi.fn<(id: string, answer: SubmitAnswerParams) => Promise<BreakpointAnswer>>()
      .mockResolvedValue(makeAnswer()),
    cancelBreakpoint: vi.fn<(id: string) => Promise<void>>()
      .mockResolvedValue(undefined),
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("Harness Integration", () => {
  // ──────────────────────────────────────────────────────────────────────────
  // Section 1: Barrel export
  // ──────────────────────────────────────────────────────────────────────────

  describe("harness barrel export", () => {
    it("exports BreakpointMuxInteractionProvider", async () => {
      const mod = await importHarnessBarrel();
      expect(mod.BreakpointMuxInteractionProvider).toBeDefined();
      expect(typeof mod.BreakpointMuxInteractionProvider).toBe("function");
    });

    it("exports loadRoutingConfig", async () => {
      const mod = await importHarnessBarrel();
      expect(mod.loadRoutingConfig).toBeDefined();
      expect(typeof mod.loadRoutingConfig).toBe("function");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 2: BreakpointMuxInteractionProvider -- Construction
  // ──────────────────────────────────────────────────────────────────────────

  describe("BreakpointMuxInteractionProvider -- construction", () => {
    it("can be constructed with just a default backend", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");

      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      expect(provider).toBeDefined();
    });

    it("can be constructed with multiple backends and routing config", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const defaultBackend = createMockBackend("git-native");
      const serverBackend = createMockBackend("bmux-server");

      const routingConfig: RoutingConfig = {
        defaultBackend: "git-native",
        routes: [
          {
            domains: ["security"],
            backend: "bmux-server",
            backendConfig: { type: "server", url: "https://bmux.a5c.ai" },
          },
        ],
      };

      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
        backends: { "bmux-server": serverBackend },
        routingConfig,
      });

      expect(provider).toBeDefined();
    });

    it("accepts an optional defaultTimeoutMs", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");

      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
        defaultTimeoutMs: 60_000,
      });

      expect(provider).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 3: handleBreakpoint -- Core functionality
  // ──────────────────────────────────────────────────────────────────────────

  describe("handleBreakpoint -- core flow", () => {
    let defaultBackend: BreakpointBackend;

    beforeEach(() => {
      defaultBackend = createMockBackend("git-native");
    });

    it("submits a breakpoint to the backend with correct text from label", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
      });

      await provider.handleBreakpoint("Some payload", {
        label: "Should we refactor the auth module?",
      });

      expect(defaultBackend.submitBreakpoint).toHaveBeenCalledTimes(1);
      const params = (defaultBackend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.text).toBe("Should we refactor the auth module?");
    });

    it("extracts text from string payload when no label is provided", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
      });

      await provider.handleBreakpoint("What approach should we take?", {});

      const params = (defaultBackend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.text).toBe("What approach should we take?");
    });

    it("extracts text from object payload with question property", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
      });

      await provider.handleBreakpoint(
        { question: "Is this correct?", details: "More info" },
        {},
      );

      const params = (defaultBackend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.text).toBe("Is this correct?");
    });

    it("extracts text from object payload with text property", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
      });

      await provider.handleBreakpoint(
        { text: "Check this configuration" },
        {},
      );

      const params = (defaultBackend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.text).toBe("Check this configuration");
    });

    it("falls back to default text for unrecognized payload shapes", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
      });

      await provider.handleBreakpoint({ arbitrary: 42 }, {});

      const params = (defaultBackend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.text).toBe("Breakpoint requires human input");
    });

    it("calls waitForAnswer after submitting", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
      });

      await provider.handleBreakpoint("Test payload", { label: "Test" });

      expect(defaultBackend.waitForAnswer).toHaveBeenCalledTimes(1);
      const [id] = (defaultBackend.waitForAnswer as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(id).toBe("bp-001");
    });

    it("returns { approved, response, feedback, respondedBy } from answer", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
      });

      const result = await provider.handleBreakpoint("Test", { label: "Test" });

      expect(result).toEqual({
        approved: true,
        response: "Yes, use connection pooling with ioredis.",
        feedback: "Yes, use connection pooling with ioredis.",
        respondedBy: "Tal M",
      });
    });

    it("maps approved=false from answer correctly", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const rejectedAnswer = makeAnswer({ approved: false, text: "No, rejected." });
      const backend = createMockBackend("git-native", {
        waitForAnswer: vi.fn().mockResolvedValue(
          makeWaitResult({
            answer: rejectedAnswer,
            allAnswers: [rejectedAnswer],
          }),
        ),
      });
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      const result = await provider.handleBreakpoint("Test", { label: "Test" });

      expect(result.approved).toBe(false);
      expect(result.response).toBe("No, rejected.");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 4: handleBreakpoint -- Context building
  // ──────────────────────────────────────────────────────────────────────────

  describe("handleBreakpoint -- context building", () => {
    it("builds context with description from string payload", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      await provider.handleBreakpoint("Should we deploy now?", {
        tags: ["deploy", "ops"],
        domain: "infrastructure",
      });

      const params = (backend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.context.description).toBe("Should we deploy now?");
      expect(params.context.tags).toEqual(["deploy", "ops"]);
      expect(params.context.domain).toBe("infrastructure");
      expect(params.context.codeSnippets).toEqual([]);
      expect(params.context.fileReferences).toEqual([]);
    });

    it("builds context with JSON stringified description from object payload", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      const payload = { question: "Can we proceed?", data: [1, 2, 3] };
      await provider.handleBreakpoint(payload, {});

      const params = (backend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.context.description).toBe(JSON.stringify(payload, null, 2));
    });

    it("maps interactionKind to context.interactionKind", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      const kinds: InteractionKind[] = [
        "clarification",
        "approval",
        "intervention",
        "notification",
        "handoff",
      ];

      for (const kind of kinds) {
        (backend.submitBreakpoint as ReturnType<typeof vi.fn>).mockClear();

        await provider.handleBreakpoint("Test", {
          label: "Test",
          interactionKind: kind,
        });

        const params = (backend.submitBreakpoint as ReturnType<typeof vi.fn>)
          .mock.calls[0][0] as SubmitBreakpointParams;
        expect(params.context.interactionKind).toBe(kind);
      }
    });

    it("uses empty tags array when no tags provided", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      await provider.handleBreakpoint("Test", { label: "Test" });

      const params = (backend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.context.tags).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 5: handleBreakpoint -- Routing construction
  // ──────────────────────────────────────────────────────────────────────────

  describe("handleBreakpoint -- routing construction", () => {
    it("builds routing with expert as single string target responder", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      await provider.handleBreakpoint("Test", {
        label: "Test",
        expert: "tal",
      });

      const params = (backend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.routing.targetResponders).toEqual(["tal"]);
    });

    it("builds routing with expert as array of target responders", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      await provider.handleBreakpoint("Test", {
        label: "Test",
        expert: ["tal", "bob"],
      });

      const params = (backend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.routing.targetResponders).toEqual(["tal", "bob"]);
    });

    it("uses empty target responders when no expert specified", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      await provider.handleBreakpoint("Test", { label: "Test" });

      const params = (backend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.routing.targetResponders).toEqual([]);
    });

    it("defaults strategy to first-response-wins", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      await provider.handleBreakpoint("Test", { label: "Test" });

      const params = (backend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.routing.strategy).toBe("first-response-wins");
    });

    it("passes strategy from options", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      await provider.handleBreakpoint("Test", {
        label: "Test",
        strategy: "collect-all",
      });

      const params = (backend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.routing.strategy).toBe("collect-all");
    });

    it("passes breakpointId to routing", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      await provider.handleBreakpoint("Test", {
        label: "Test",
        breakpointId: "canonical-bp-id-001",
      });

      const params = (backend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.routing.breakpointId).toBe("canonical-bp-id-001");
    });

    it("passes autoApproveAfterN to routing", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      await provider.handleBreakpoint("Test", {
        label: "Test",
        autoApproveAfterN: 3,
      });

      const params = (backend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.routing.autoApproveAfterN).toBe(3);
    });

    it("maps presentAlwaysApprove to routing.presentToUser", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      await provider.handleBreakpoint("Test", {
        label: "Test",
        presentAlwaysApprove: false,
      });

      const params = (backend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.routing.presentToUser).toBe(false);
    });

    it("defaults presentToUser to true when presentAlwaysApprove is not set", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      await provider.handleBreakpoint("Test", { label: "Test" });

      const params = (backend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.routing.presentToUser).toBe(true);
    });

    it("passes timeoutMs from options to routing", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      await provider.handleBreakpoint("Test", {
        label: "Test",
        timeoutMs: 60_000,
      });

      const params = (backend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.routing.timeoutMs).toBe(60_000);
    });

    it("uses defaultTimeoutMs from provider options when no timeoutMs in options", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
        defaultTimeoutMs: 120_000,
      });

      await provider.handleBreakpoint("Test", { label: "Test" });

      const params = (backend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.routing.timeoutMs).toBe(120_000);
    });

    it("passes routing timeoutMs to waitForAnswer", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      await provider.handleBreakpoint("Test", {
        label: "Test",
        timeoutMs: 45_000,
      });

      const [, waitOpts] = (backend.waitForAnswer as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(waitOpts).toEqual(expect.objectContaining({ timeoutMs: 45_000 }));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 6: handleBreakpoint -- Domain-based routing
  // ──────────────────────────────────────────────────────────────────────────

  describe("handleBreakpoint -- domain-based routing", () => {
    it("routes to domain-specific backend when routing config matches domain", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const defaultBackend = createMockBackend("git-native");
      const securityBackend = createMockBackend("bmux-server");

      const routingConfig: RoutingConfig = {
        defaultBackend: "git-native",
        routes: [
          {
            domains: ["security", "auth"],
            backend: "bmux-server",
            backendConfig: { type: "server", url: "https://bmux.a5c.ai" },
          },
        ],
      };

      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
        backends: { "bmux-server": securityBackend },
        routingConfig,
      });

      await provider.handleBreakpoint("Test security question", {
        label: "Security review needed",
        domain: "security",
      });

      expect(securityBackend.submitBreakpoint).toHaveBeenCalledTimes(1);
      expect(defaultBackend.submitBreakpoint).not.toHaveBeenCalled();
    });

    it("routes to default backend when domain does not match any rule", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const defaultBackend = createMockBackend("git-native");
      const securityBackend = createMockBackend("bmux-server");

      const routingConfig: RoutingConfig = {
        defaultBackend: "git-native",
        routes: [
          {
            domains: ["security"],
            backend: "bmux-server",
            backendConfig: { type: "server" },
          },
        ],
      };

      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
        backends: { "bmux-server": securityBackend },
        routingConfig,
      });

      await provider.handleBreakpoint("Test frontend question", {
        label: "UI question",
        domain: "frontend",
      });

      expect(defaultBackend.submitBreakpoint).toHaveBeenCalledTimes(1);
      expect(securityBackend.submitBreakpoint).not.toHaveBeenCalled();
    });

    it("matches second domain in domains array", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const defaultBackend = createMockBackend("git-native");
      const securityBackend = createMockBackend("bmux-server");

      const routingConfig: RoutingConfig = {
        defaultBackend: "git-native",
        routes: [
          {
            domains: ["security", "auth"],
            backend: "bmux-server",
            backendConfig: { type: "server" },
          },
        ],
      };

      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
        backends: { "bmux-server": securityBackend },
        routingConfig,
      });

      await provider.handleBreakpoint("Test auth question", {
        label: "Auth question",
        domain: "auth",
      });

      expect(securityBackend.submitBreakpoint).toHaveBeenCalledTimes(1);
      expect(defaultBackend.submitBreakpoint).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 7: handleBreakpoint -- Tag-based routing
  // ──────────────────────────────────────────────────────────────────────────

  describe("handleBreakpoint -- tag-based routing", () => {
    it("routes to tag-matched backend when tags intersect", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const defaultBackend = createMockBackend("git-native");
      const opsBackend = createMockBackend("github-issues");

      const routingConfig: RoutingConfig = {
        defaultBackend: "git-native",
        routes: [
          {
            tags: ["ops", "deploy", "infrastructure"],
            backend: "github-issues",
            backendConfig: { type: "github-issues", owner: "myorg", repo: "ops" },
          },
        ],
      };

      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
        backends: { "github-issues": opsBackend },
        routingConfig,
      });

      await provider.handleBreakpoint("Deploy question", {
        label: "Should we deploy?",
        tags: ["deploy", "staging"],
      });

      expect(opsBackend.submitBreakpoint).toHaveBeenCalledTimes(1);
      expect(defaultBackend.submitBreakpoint).not.toHaveBeenCalled();
    });

    it("routes to default when tags do not match any rule", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const defaultBackend = createMockBackend("git-native");
      const opsBackend = createMockBackend("github-issues");

      const routingConfig: RoutingConfig = {
        defaultBackend: "git-native",
        routes: [
          {
            tags: ["ops", "deploy"],
            backend: "github-issues",
            backendConfig: { type: "github-issues" },
          },
        ],
      };

      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
        backends: { "github-issues": opsBackend },
        routingConfig,
      });

      await provider.handleBreakpoint("Frontend question", {
        label: "CSS question",
        tags: ["css", "frontend"],
      });

      expect(defaultBackend.submitBreakpoint).toHaveBeenCalledTimes(1);
      expect(opsBackend.submitBreakpoint).not.toHaveBeenCalled();
    });

    it("matches via single overlapping tag even if others don't match", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const defaultBackend = createMockBackend("git-native");
      const opsBackend = createMockBackend("github-issues");

      const routingConfig: RoutingConfig = {
        defaultBackend: "git-native",
        routes: [
          {
            tags: ["ops", "deploy"],
            backend: "github-issues",
            backendConfig: {},
          },
        ],
      };

      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
        backends: { "github-issues": opsBackend },
        routingConfig,
      });

      await provider.handleBreakpoint("Mixed tags question", {
        label: "Some question",
        tags: ["unrelated", "ops"],
      });

      expect(opsBackend.submitBreakpoint).toHaveBeenCalledTimes(1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 8: handleBreakpoint -- Routing precedence and edge cases
  // ──────────────────────────────────────────────────────────────────────────

  describe("handleBreakpoint -- routing precedence and edge cases", () => {
    it("first matching routing rule wins", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const defaultBackend = createMockBackend("git-native");
      const backendA = createMockBackend("backend-a");
      const backendB = createMockBackend("backend-b");

      const routingConfig: RoutingConfig = {
        defaultBackend: "git-native",
        routes: [
          {
            domains: ["security"],
            backend: "backend-a",
            backendConfig: {},
          },
          {
            domains: ["security"],
            backend: "backend-b",
            backendConfig: {},
          },
        ],
      };

      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
        backends: { "backend-a": backendA, "backend-b": backendB },
        routingConfig,
      });

      await provider.handleBreakpoint("Test", {
        label: "Test",
        domain: "security",
      });

      expect(backendA.submitBreakpoint).toHaveBeenCalledTimes(1);
      expect(backendB.submitBreakpoint).not.toHaveBeenCalled();
    });

    it("uses default backend when no routing config is set", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const defaultBackend = createMockBackend("git-native");

      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
        // No routingConfig
      });

      await provider.handleBreakpoint("Test", {
        label: "Test",
        domain: "security",
        tags: ["ops"],
      });

      expect(defaultBackend.submitBreakpoint).toHaveBeenCalledTimes(1);
    });

    it("falls back to default backend when matched rule references unknown backend", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const defaultBackend = createMockBackend("git-native");

      const routingConfig: RoutingConfig = {
        defaultBackend: "git-native",
        routes: [
          {
            domains: ["security"],
            backend: "nonexistent-backend",
            backendConfig: {},
          },
        ],
      };

      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
        routingConfig,
      });

      await provider.handleBreakpoint("Test", {
        label: "Test",
        domain: "security",
      });

      // Should fall through to default since "nonexistent-backend" is not registered
      expect(defaultBackend.submitBreakpoint).toHaveBeenCalledTimes(1);
    });

    it("routes to default when domain is undefined and no tags", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const defaultBackend = createMockBackend("git-native");
      const securityBackend = createMockBackend("bmux-server");

      const routingConfig: RoutingConfig = {
        defaultBackend: "git-native",
        routes: [
          {
            domains: ["security"],
            backend: "bmux-server",
            backendConfig: {},
          },
        ],
      };

      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
        backends: { "bmux-server": securityBackend },
        routingConfig,
      });

      await provider.handleBreakpoint("Test", { label: "Test" });

      expect(defaultBackend.submitBreakpoint).toHaveBeenCalledTimes(1);
      expect(securityBackend.submitBreakpoint).not.toHaveBeenCalled();
    });

    it("routes to default when tags is empty array", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const defaultBackend = createMockBackend("git-native");
      const opsBackend = createMockBackend("github-issues");

      const routingConfig: RoutingConfig = {
        defaultBackend: "git-native",
        routes: [
          {
            tags: ["ops"],
            backend: "github-issues",
            backendConfig: {},
          },
        ],
      };

      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
        backends: { "github-issues": opsBackend },
        routingConfig,
      });

      await provider.handleBreakpoint("Test", {
        label: "Test",
        tags: [],
      });

      expect(defaultBackend.submitBreakpoint).toHaveBeenCalledTimes(1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 9: handleBreakpoint -- Timeout handling
  // ──────────────────────────────────────────────────────────────────────────

  describe("handleBreakpoint -- timeout handling", () => {
    it("returns approved=false when waitForAnswer returns unanswered result", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native", {
        waitForAnswer: vi.fn().mockResolvedValue(
          makeWaitResult({
            answered: false,
            answer: undefined,
            allAnswers: [],
            resolution: "timeout",
          }),
        ),
      });
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      const result = await provider.handleBreakpoint("Test", { label: "Test" });

      expect(result.approved).toBe(false);
      expect(result.response).toBeUndefined();
      expect(result.feedback).toBeUndefined();
      expect(result.respondedBy).toBeUndefined();
    });

    it("uses 30-minute default timeout when neither provider nor options specify it", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native");
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      await provider.handleBreakpoint("Test", { label: "Test" });

      const params = (backend.submitBreakpoint as ReturnType<typeof vi.fn>)
        .mock.calls[0][0] as SubmitBreakpointParams;
      expect(params.routing.timeoutMs).toBe(30 * 60 * 1000);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 10: handleBreakpoint -- Backend error propagation
  // ──────────────────────────────────────────────────────────────────────────

  describe("handleBreakpoint -- backend error propagation", () => {
    it("propagates submitBreakpoint errors", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native", {
        submitBreakpoint: vi.fn().mockRejectedValue(new Error("Backend submit failed")),
      });
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      await expect(
        provider.handleBreakpoint("Test", { label: "Test" }),
      ).rejects.toThrow("Backend submit failed");
    });

    it("propagates waitForAnswer errors", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const backend = createMockBackend("git-native", {
        waitForAnswer: vi.fn().mockRejectedValue(new Error("Backend wait failed")),
      });
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      await expect(
        provider.handleBreakpoint("Test", { label: "Test" }),
      ).rejects.toThrow("Backend wait failed");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 11: handleBreakpoint -- Answer mapping edge cases
  // ──────────────────────────────────────────────────────────────────────────

  describe("handleBreakpoint -- answer mapping edge cases", () => {
    it("uses answered boolean as approved when answer has no explicit approved field", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const answerWithoutApproved = makeAnswer({ approved: undefined });
      const backend = createMockBackend("git-native", {
        waitForAnswer: vi.fn().mockResolvedValue(
          makeWaitResult({
            answered: true,
            answer: answerWithoutApproved,
            allAnswers: [answerWithoutApproved],
          }),
        ),
      });
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      const result = await provider.handleBreakpoint("Test", { label: "Test" });

      // When answer.approved is undefined, falls back to result.answered (true)
      expect(result.approved).toBe(true);
    });

    it("returns respondedBy from answer's responderName", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const customAnswer = makeAnswer({ responderName: "Alice Security" });
      const backend = createMockBackend("git-native", {
        waitForAnswer: vi.fn().mockResolvedValue(
          makeWaitResult({
            answer: customAnswer,
            allAnswers: [customAnswer],
          }),
        ),
      });
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      const result = await provider.handleBreakpoint("Test", { label: "Test" });

      expect(result.respondedBy).toBe("Alice Security");
    });

    it("maps both response and feedback to answer text", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const customAnswer = makeAnswer({ text: "Detailed answer here." });
      const backend = createMockBackend("git-native", {
        waitForAnswer: vi.fn().mockResolvedValue(
          makeWaitResult({
            answer: customAnswer,
            allAnswers: [customAnswer],
          }),
        ),
      });
      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend: backend,
      });

      const result = await provider.handleBreakpoint("Test", { label: "Test" });

      expect(result.response).toBe("Detailed answer here.");
      expect(result.feedback).toBe("Detailed answer here.");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 12: handleBreakpoint -- Multi-backend with mixed routing
  // ──────────────────────────────────────────────────────────────────────────

  describe("handleBreakpoint -- multi-backend mixed routing", () => {
    it("routes different domains to different backends", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const defaultBackend = createMockBackend("git-native");
      const securityBackend = createMockBackend("bmux-server");
      const opsBackend = createMockBackend("github-issues");

      const routingConfig: RoutingConfig = {
        defaultBackend: "git-native",
        routes: [
          {
            domains: ["security"],
            backend: "bmux-server",
            backendConfig: {},
          },
          {
            domains: ["infrastructure"],
            tags: ["ops", "deploy"],
            backend: "github-issues",
            backendConfig: {},
          },
        ],
      };

      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
        backends: {
          "bmux-server": securityBackend,
          "github-issues": opsBackend,
        },
        routingConfig,
      });

      // Security question -> bmux-server
      await provider.handleBreakpoint("Sec question", {
        label: "Security review",
        domain: "security",
      });
      expect(securityBackend.submitBreakpoint).toHaveBeenCalledTimes(1);

      // Ops question via domain -> github-issues
      await provider.handleBreakpoint("Ops question", {
        label: "Deploy review",
        domain: "infrastructure",
      });
      expect(opsBackend.submitBreakpoint).toHaveBeenCalledTimes(1);

      // Unmatched domain -> default
      await provider.handleBreakpoint("Other question", {
        label: "General question",
        domain: "frontend",
      });
      expect(defaultBackend.submitBreakpoint).toHaveBeenCalledTimes(1);
    });

    it("domain match takes precedence over tag match in same rule", async () => {
      const { BreakpointMuxInteractionProvider } = await importInteractionProvider();
      const defaultBackend = createMockBackend("git-native");
      const targetBackend = createMockBackend("target");

      const routingConfig: RoutingConfig = {
        defaultBackend: "git-native",
        routes: [
          {
            domains: ["security"],
            tags: ["ops"],
            backend: "target",
            backendConfig: {},
          },
        ],
      };

      const provider = new BreakpointMuxInteractionProvider({
        defaultBackend,
        backends: { target: targetBackend },
        routingConfig,
      });

      // Domain matches, even though tags don't -- rule still matches
      await provider.handleBreakpoint("Test", {
        label: "Test",
        domain: "security",
        tags: ["unrelated"],
      });

      expect(targetBackend.submitBreakpoint).toHaveBeenCalledTimes(1);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 13: loadRoutingConfig
  // ──────────────────────────────────────────────────────────────────────────

  describe("loadRoutingConfig", () => {
    it("is exported as a function", async () => {
      const { loadRoutingConfig } = await importRoutingRules();
      expect(typeof loadRoutingConfig).toBe("function");
    });

    it("returns null when no config file exists at default paths", async () => {
      const { loadRoutingConfig } = await importRoutingRules();

      // Use a temp dir with no config files
      const result = await loadRoutingConfig(undefined, "/tmp/nonexistent-dir-" + Date.now());

      expect(result).toBeNull();
    });

    it("returns null when explicit config path does not exist", async () => {
      const { loadRoutingConfig } = await importRoutingRules();

      const result = await loadRoutingConfig(
        "/tmp/definitely-not-here-" + Date.now() + "/routing.json",
      );

      expect(result).toBeNull();
    });
  });
});
