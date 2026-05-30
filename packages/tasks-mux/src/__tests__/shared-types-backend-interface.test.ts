import { describe, it, expect, beforeEach } from "vitest";
import {
  // Zod schemas
  BreakpointStatusSchema,
  BreakpointStrategySchema,
  UrgencySchema,
  InteractionKindSchema,
  CodeSnippetSchema,
  BreakpointContextSchema,
  BreakpointContextLinkSchema,
  BreakpointContextSectionSchema,
  BreakpointContextArtifactSchema,
  BreakpointRoutingSchema,
  ResponderProfileSchema,
  BreakpointAnswerSchema,
  BreakpointAnswerRatingSchema,
  DecisionMemorySchema,
  BreakpointSubmitterSchema,
  BreakpointSchema,
  BreakpointWaitResultSchema,
  ProvenBreakpointAnswerSchema,
  ProvenVerificationResultSchema,
  BackendConfigSchema,
  RoutingRuleSchema,
  RoutingConfigSchema,
  // Constants
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_TIMEOUT_MS,
  BREAKPOINTS_DIR,
  BREAKPOINTS_KEYS_DIR,
  BREAKPOINTS_TRUSTED_KEYS_DIR,
  BREAKPOINTS_PRIVATE_KEYS_DIR,
  // Utility
  generateBreakpointId,
} from "../index.js";
import type {
  BreakpointBackend,
  SubmitBreakpointParams,
  WaitForAnswerOptions,
  SubmitAnswerParams,
  ListRespondersParams,
} from "../index.js";
import type {
  Breakpoint,
  BreakpointAnswer,
  BreakpointContext,
  BreakpointRouting,
  BreakpointWaitResult,
  ResponderProfile,
  BreakpointStatus,
  BreakpointStrategy,
  Urgency,
  InteractionKind,
  CodeSnippet,
  BreakpointSubmitter,
  ProvenBreakpointAnswer,
  ProvenVerificationResult,
  RoutingConfig,
  RoutingRule,
  DecisionMemory,
  BreakpointAnswerRating,
  BreakpointContextLink,
  BreakpointContextSection,
  BreakpointContextArtifact,
} from "../index.js";

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
    timeoutMs: 1800000,
    presentToUser: true,
    ...overrides,
  };
}

function makeAnswer(overrides: Partial<BreakpointAnswer> = {}): BreakpointAnswer {
  return {
    id: "answer-001",
    breakpointId: "bp-001",
    responderId: "responder-1",
    responderName: "Test Responder",
    text: "The answer is 42.",
    confidence: 90,
    references: [],
    followUpQuestions: [],
    answeredAt: NOW,
    ...overrides,
  };
}

function makeBreakpoint(overrides: Partial<Breakpoint> = {}): Breakpoint {
  return {
    id: "bp-001",
    text: "Should we use pooling?",
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

function makeResponderProfile(overrides: Partial<ResponderProfile> = {}): ResponderProfile {
  return {
    id: "responder-1",
    name: "Test Responder",
    title: "Senior Engineer",
    domains: ["backend"],
    tags: ["node", "typescript"],
    availability: true,
    responseTimeSla: 60000,
    ...overrides,
  };
}

function makeWaitResult(overrides: Partial<BreakpointWaitResult> = {}): BreakpointWaitResult {
  return {
    answered: true,
    breakpoint: makeBreakpoint({ status: "answered" }),
    answer: makeAnswer(),
    allAnswers: [makeAnswer()],
    elapsedMs: 5000,
    ...overrides,
  };
}

function makeSubmitter(overrides: Partial<BreakpointSubmitter> = {}): BreakpointSubmitter {
  return {
    sub: "user-sub-123",
    login: "testuser",
    name: "Test User",
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Section 3: Domain Types and Zod Schemas
// ────────────────────────────────────────────────────────────────────────────

describe("Section 3: Domain Types and Zod Schemas", () => {
  // ── 3.1 BreakpointStatusSchema ──────────────────────────────────────────

  describe("BreakpointStatusSchema", () => {
    const validStatuses: BreakpointStatus[] = [
      "pending",
      "routed",
      "claimed",
      "answered",
      "completed",
      "expired",
      "cancelled",
    ];

    it.each(validStatuses)("accepts valid status '%s'", (status) => {
      const result = BreakpointStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(status);
      }
    });

    it("rejects invalid status values", () => {
      expect(BreakpointStatusSchema.safeParse("unknown").success).toBe(false);
      expect(BreakpointStatusSchema.safeParse("").success).toBe(false);
      expect(BreakpointStatusSchema.safeParse(42).success).toBe(false);
      expect(BreakpointStatusSchema.safeParse(null).success).toBe(false);
    });

    it("contains exactly 7 status values", () => {
      expect(BreakpointStatusSchema.options).toHaveLength(7);
    });
  });

  // ── 3.1 BreakpointStrategySchema ────────────────────────────────────────

  describe("BreakpointStrategySchema", () => {
    const validStrategies: BreakpointStrategy[] = [
      "single",
      "first-response-wins",
      "collect-all",
      "quorum",
    ];

    it.each(validStrategies)("accepts valid strategy '%s'", (strategy) => {
      const result = BreakpointStrategySchema.safeParse(strategy);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(strategy);
      }
    });

    it("rejects invalid strategy values", () => {
      expect(BreakpointStrategySchema.safeParse("round-robin").success).toBe(false);
      expect(BreakpointStrategySchema.safeParse("").success).toBe(false);
      expect(BreakpointStrategySchema.safeParse(123).success).toBe(false);
    });

    it("contains exactly 4 strategy values", () => {
      expect(BreakpointStrategySchema.options).toHaveLength(4);
    });
  });

  // ── 3.2 UrgencySchema ──────────────────────────────────────────────────

  describe("UrgencySchema", () => {
    const validUrgencies: Urgency[] = ["low", "medium", "high"];

    it.each(validUrgencies)("accepts valid urgency '%s'", (urgency) => {
      const result = UrgencySchema.safeParse(urgency);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(urgency);
      }
    });

    it("rejects invalid urgency values", () => {
      expect(UrgencySchema.safeParse("critical").success).toBe(false);
      expect(UrgencySchema.safeParse("").success).toBe(false);
      expect(UrgencySchema.safeParse(1).success).toBe(false);
    });

    it("contains exactly 3 urgency values", () => {
      expect(UrgencySchema.options).toHaveLength(3);
    });
  });

  // ── 3.3 InteractionKindSchema ───────────────────────────────────────────

  describe("InteractionKindSchema", () => {
    const validKinds: InteractionKind[] = [
      "clarification",
      "approval",
      "intervention",
      "notification",
      "handoff",
    ];

    it.each(validKinds)("accepts valid interaction kind '%s'", (kind) => {
      const result = InteractionKindSchema.safeParse(kind);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(kind);
      }
    });

    it("rejects invalid interaction kind values", () => {
      expect(InteractionKindSchema.safeParse("escalation").success).toBe(false);
      expect(InteractionKindSchema.safeParse("").success).toBe(false);
    });

    it("contains exactly 5 interaction kind values", () => {
      expect(InteractionKindSchema.options).toHaveLength(5);
    });
  });

  // ── 3.4 CodeSnippetSchema ──────────────────────────────────────────────

  describe("CodeSnippetSchema", () => {
    it("accepts a plain string code snippet", () => {
      const result = CodeSnippetSchema.safeParse("const x = 42;");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("const x = 42;");
      }
    });

    it("accepts an object code snippet with all fields", () => {
      const snippet = {
        filename: "src/index.ts",
        code: "export const foo = 'bar';",
        language: "typescript",
      };
      const result = CodeSnippetSchema.safeParse(snippet);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(snippet);
      }
    });

    it("accepts an object code snippet without optional language field", () => {
      const snippet = {
        filename: "main.py",
        code: "print('hello')",
      };
      const result = CodeSnippetSchema.safeParse(snippet);
      expect(result.success).toBe(true);
    });

    it("rejects object code snippet missing required filename", () => {
      const snippet = {
        code: "console.log('test');",
        language: "javascript",
      };
      const result = CodeSnippetSchema.safeParse(snippet);
      expect(result.success).toBe(false);
    });

    it("rejects object code snippet missing required code field", () => {
      const snippet = {
        filename: "test.ts",
        language: "typescript",
      };
      const result = CodeSnippetSchema.safeParse(snippet);
      expect(result.success).toBe(false);
    });

    it("rejects number input", () => {
      expect(CodeSnippetSchema.safeParse(42).success).toBe(false);
    });

    it("rejects null input", () => {
      expect(CodeSnippetSchema.safeParse(null).success).toBe(false);
    });
  });

  // ── 3.5 BreakpointContext sub-schemas ──────────────────────────────────

  describe("BreakpointContextLinkSchema", () => {
    it("accepts a valid link with all fields", () => {
      const link = {
        label: "GitHub PR",
        url: "https://github.com/org/repo/pull/1",
        kind: "reference" as const,
      };
      const result = BreakpointContextLinkSchema.safeParse(link);
      expect(result.success).toBe(true);
    });

    it("accepts a valid link without optional kind", () => {
      const link = { label: "docs", url: "https://example.com" };
      const result = BreakpointContextLinkSchema.safeParse(link);
      expect(result.success).toBe(true);
    });

    it("accepts all valid kind values", () => {
      for (const kind of ["reference", "repo", "artifact", "external"]) {
        const link = { label: "test", url: "https://example.com", kind };
        expect(BreakpointContextLinkSchema.safeParse(link).success).toBe(true);
      }
    });

    it("rejects empty label", () => {
      const link = { label: "", url: "https://example.com" };
      expect(BreakpointContextLinkSchema.safeParse(link).success).toBe(false);
    });

    it("rejects invalid URL", () => {
      const link = { label: "test", url: "not-a-url" };
      expect(BreakpointContextLinkSchema.safeParse(link).success).toBe(false);
    });

    it("allows additional unknown fields via catchall", () => {
      const link = {
        label: "test",
        url: "https://example.com",
        customField: "custom-value",
      };
      const result = BreakpointContextLinkSchema.safeParse(link);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).customField).toBe("custom-value");
      }
    });
  });

  describe("BreakpointContextSectionSchema", () => {
    it("accepts a valid section", () => {
      const section = { title: "Background", markdown: "Some context here." };
      const result = BreakpointContextSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
    });

    it("rejects empty title", () => {
      const section = { title: "", markdown: "content" };
      expect(BreakpointContextSectionSchema.safeParse(section).success).toBe(false);
    });

    it("rejects empty markdown", () => {
      const section = { title: "Title", markdown: "" };
      expect(BreakpointContextSectionSchema.safeParse(section).success).toBe(false);
    });

    it("allows additional unknown fields via catchall", () => {
      const section = { title: "T", markdown: "M", extra: 123 };
      const result = BreakpointContextSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
    });
  });

  describe("BreakpointContextArtifactSchema", () => {
    it("accepts a valid artifact with all fields", () => {
      const artifact = {
        label: "Build log",
        url: "https://ci.example.com/logs/123",
        kind: "log" as const,
        mimeType: "text/plain",
      };
      const result = BreakpointContextArtifactSchema.safeParse(artifact);
      expect(result.success).toBe(true);
    });

    it("accepts a valid artifact with only required fields", () => {
      const artifact = {
        label: "Screenshot",
        url: "https://example.com/img.png",
      };
      const result = BreakpointContextArtifactSchema.safeParse(artifact);
      expect(result.success).toBe(true);
    });

    it("accepts all valid kind values", () => {
      for (const kind of ["image", "document", "trace", "log", "build", "external"]) {
        const artifact = { label: "test", url: "https://example.com/x", kind };
        expect(BreakpointContextArtifactSchema.safeParse(artifact).success).toBe(true);
      }
    });

    it("rejects empty label", () => {
      const artifact = { label: "", url: "https://example.com" };
      expect(BreakpointContextArtifactSchema.safeParse(artifact).success).toBe(false);
    });

    it("rejects invalid URL", () => {
      const artifact = { label: "test", url: "bad-url" };
      expect(BreakpointContextArtifactSchema.safeParse(artifact).success).toBe(false);
    });

    it("rejects empty mimeType when provided", () => {
      const artifact = {
        label: "test",
        url: "https://example.com/x",
        mimeType: "",
      };
      expect(BreakpointContextArtifactSchema.safeParse(artifact).success).toBe(false);
    });
  });

  // ── 3.5 BreakpointContextSchema ────────────────────────────────────────

  describe("BreakpointContextSchema", () => {
    it("accepts a minimal valid context", () => {
      const context = makeContext();
      const result = BreakpointContextSchema.safeParse(context);
      expect(result.success).toBe(true);
    });

    it("accepts a fully populated context", () => {
      const context = makeContext({
        description: "Full context",
        codeSnippets: [
          "const x = 1;",
          { filename: "test.ts", code: "export {};", language: "typescript" },
        ],
        fileReferences: ["src/index.ts", "package.json"],
        tags: ["backend", "performance"],
        title: "Redis Connection Pooling",
        summary: "Investigating connection pooling options",
        markdown: "## Details\nSome markdown here.",
        domain: "backend",
        urgency: "high",
        interactionKind: "clarification",
        links: [{ label: "Docs", url: "https://docs.example.com" }],
        sections: [{ title: "Background", markdown: "Some context." }],
        artifacts: [{ label: "Log", url: "https://ci.example.com/log" }],
        metadata: { source: "mcp-tool", runId: "abc-123" },
      });
      const result = BreakpointContextSchema.safeParse(context);
      expect(result.success).toBe(true);
    });

    it("rejects context missing required description field", () => {
      const context = {
        codeSnippets: [],
        fileReferences: [],
        tags: [],
      };
      expect(BreakpointContextSchema.safeParse(context).success).toBe(false);
    });

    it("rejects context missing required codeSnippets field", () => {
      const context = {
        description: "test",
        fileReferences: [],
        tags: [],
      };
      expect(BreakpointContextSchema.safeParse(context).success).toBe(false);
    });

    it("rejects context missing required fileReferences field", () => {
      const context = {
        description: "test",
        codeSnippets: [],
        tags: [],
      };
      expect(BreakpointContextSchema.safeParse(context).success).toBe(false);
    });

    it("rejects context missing required tags field", () => {
      const context = {
        description: "test",
        codeSnippets: [],
        fileReferences: [],
      };
      expect(BreakpointContextSchema.safeParse(context).success).toBe(false);
    });

    it("accepts optional fields as undefined", () => {
      const context = {
        description: "test",
        codeSnippets: [],
        fileReferences: [],
        tags: [],
        title: undefined,
        summary: undefined,
        markdown: undefined,
        domain: undefined,
        urgency: undefined,
        interactionKind: undefined,
        links: undefined,
        sections: undefined,
        artifacts: undefined,
        metadata: undefined,
      };
      expect(BreakpointContextSchema.safeParse(context).success).toBe(true);
    });

    it("rejects invalid urgency in context", () => {
      const context = makeContext({ urgency: "critical" as Urgency });
      expect(BreakpointContextSchema.safeParse(context).success).toBe(false);
    });

    it("rejects invalid interactionKind in context", () => {
      const context = makeContext({ interactionKind: "escalation" as InteractionKind });
      expect(BreakpointContextSchema.safeParse(context).success).toBe(false);
    });

    it("allows additional unknown fields via catchall", () => {
      const context = {
        ...makeContext(),
        customExtension: { foo: "bar" },
      };
      const result = BreakpointContextSchema.safeParse(context);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).customExtension).toEqual({ foo: "bar" });
      }
    });
  });

  // ── 3.6 BreakpointRoutingSchema ────────────────────────────────────────

  describe("BreakpointRoutingSchema", () => {
    it("accepts a valid routing config with required fields", () => {
      const routing = makeRouting();
      const result = BreakpointRoutingSchema.safeParse(routing);
      expect(result.success).toBe(true);
    });

    it("accepts routing with all optional fields", () => {
      const routing = makeRouting({
        breakpointId: "bp-canonical-001",
        autoApproveAfterN: 3,
      });
      const result = BreakpointRoutingSchema.safeParse(routing);
      expect(result.success).toBe(true);
    });

    it("accepts all valid strategy values in routing", () => {
      for (const strategy of ["single", "first-response-wins", "collect-all", "quorum"] as const) {
        const routing = makeRouting({ strategy });
        expect(BreakpointRoutingSchema.safeParse(routing).success).toBe(true);
      }
    });

    it("rejects routing with non-positive timeoutMs", () => {
      expect(BreakpointRoutingSchema.safeParse(makeRouting({ timeoutMs: 0 })).success).toBe(false);
      expect(BreakpointRoutingSchema.safeParse(makeRouting({ timeoutMs: -1 })).success).toBe(false);
    });

    it("rejects routing missing strategy", () => {
      const { strategy, ...rest } = makeRouting();
      expect(BreakpointRoutingSchema.safeParse(rest).success).toBe(false);
    });

    it("rejects routing missing targetResponders", () => {
      const { targetResponders, ...rest } = makeRouting();
      expect(BreakpointRoutingSchema.safeParse(rest).success).toBe(false);
    });

    it("rejects routing missing timeoutMs", () => {
      const { timeoutMs, ...rest } = makeRouting();
      expect(BreakpointRoutingSchema.safeParse(rest).success).toBe(false);
    });

    it("rejects routing missing presentToUser", () => {
      const { presentToUser, ...rest } = makeRouting();
      expect(BreakpointRoutingSchema.safeParse(rest).success).toBe(false);
    });

    it("rejects non-integer autoApproveAfterN", () => {
      const routing = makeRouting({ autoApproveAfterN: 2.5 });
      expect(BreakpointRoutingSchema.safeParse(routing).success).toBe(false);
    });

    it("accepts negative autoApproveAfterN (-1 means disabled)", () => {
      const routing = makeRouting({ autoApproveAfterN: -1 });
      expect(BreakpointRoutingSchema.safeParse(routing).success).toBe(true);
    });
  });

  // ── 3.7 ResponderProfileSchema ─────────────────────────────────────────

  describe("ResponderProfileSchema", () => {
    it("accepts a valid responder profile with required fields", () => {
      const profile = makeResponderProfile();
      const result = ResponderProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it("accepts a responder profile with optional publicKeyFingerprint", () => {
      const profile = makeResponderProfile({
        publicKeyFingerprint: "abcdef1234567890",
      });
      const result = ResponderProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.publicKeyFingerprint).toBe("abcdef1234567890");
      }
    });

    it("rejects responder profile with empty id", () => {
      expect(ResponderProfileSchema.safeParse(makeResponderProfile({ id: "" })).success).toBe(false);
    });

    it("rejects responder profile with empty name", () => {
      expect(ResponderProfileSchema.safeParse(makeResponderProfile({ name: "" })).success).toBe(false);
    });

    it("rejects responder profile with non-positive responseTimeSla", () => {
      expect(ResponderProfileSchema.safeParse(makeResponderProfile({ responseTimeSla: 0 })).success).toBe(false);
      expect(ResponderProfileSchema.safeParse(makeResponderProfile({ responseTimeSla: -100 })).success).toBe(false);
    });

    it("rejects responder profile missing required fields", () => {
      expect(ResponderProfileSchema.safeParse({}).success).toBe(false);
      expect(ResponderProfileSchema.safeParse({ id: "x" }).success).toBe(false);
    });
  });

  // ── 3.8 BreakpointAnswerRatingSchema ───────────────────────────────────

  describe("BreakpointAnswerRatingSchema", () => {
    it("accepts a valid rating with all fields", () => {
      const rating = {
        helpful: true,
        comment: "Very helpful answer.",
        ratedAt: NOW,
      };
      const result = BreakpointAnswerRatingSchema.safeParse(rating);
      expect(result.success).toBe(true);
    });

    it("accepts a rating without optional comment", () => {
      const rating = { helpful: false, ratedAt: NOW };
      const result = BreakpointAnswerRatingSchema.safeParse(rating);
      expect(result.success).toBe(true);
    });

    it("rejects rating with invalid datetime in ratedAt", () => {
      const rating = { helpful: true, ratedAt: "not-a-datetime" };
      expect(BreakpointAnswerRatingSchema.safeParse(rating).success).toBe(false);
    });

    it("rejects rating missing helpful field", () => {
      const rating = { ratedAt: NOW };
      expect(BreakpointAnswerRatingSchema.safeParse(rating).success).toBe(false);
    });
  });

  describe("DecisionMemorySchema", () => {
    it("accepts a valid decision memory with required fields", () => {
      const memory: DecisionMemory = {
        applicabilityContext: "When Redis latency exceeds 100ms",
        reasoning: "Connection pooling reduces overhead",
        savedAt: NOW,
      };
      const result = DecisionMemorySchema.safeParse(memory);
      expect(result.success).toBe(true);
    });

    it("accepts decision memory with optional enrichedContext", () => {
      const memory = {
        applicabilityContext: "When latency spikes",
        reasoning: "Use pooling",
        enrichedContext: "Additional context from team discussion",
        savedAt: NOW,
      };
      const result = DecisionMemorySchema.safeParse(memory);
      expect(result.success).toBe(true);
    });

    it("rejects decision memory with empty applicabilityContext", () => {
      const memory = {
        applicabilityContext: "",
        reasoning: "reason",
        savedAt: NOW,
      };
      expect(DecisionMemorySchema.safeParse(memory).success).toBe(false);
    });

    it("rejects decision memory with empty reasoning", () => {
      const memory = {
        applicabilityContext: "context",
        reasoning: "",
        savedAt: NOW,
      };
      expect(DecisionMemorySchema.safeParse(memory).success).toBe(false);
    });

    it("rejects decision memory with invalid savedAt datetime", () => {
      const memory = {
        applicabilityContext: "context",
        reasoning: "reason",
        savedAt: "bad-date",
      };
      expect(DecisionMemorySchema.safeParse(memory).success).toBe(false);
    });
  });

  // ── 3.8 BreakpointAnswerSchema ─────────────────────────────────────────

  describe("BreakpointAnswerSchema", () => {
    it("accepts a valid answer with required fields", () => {
      const answer = makeAnswer();
      const result = BreakpointAnswerSchema.safeParse(answer);
      expect(result.success).toBe(true);
    });

    it("accepts an answer with all optional fields", () => {
      const answer = makeAnswer({
        approved: true,
        rating: { helpful: true, ratedAt: NOW },
        decisionMemory: {
          applicabilityContext: "When caching",
          reasoning: "Use Redis",
          savedAt: NOW,
        },
      });
      const result = BreakpointAnswerSchema.safeParse(answer);
      expect(result.success).toBe(true);
    });

    it("rejects answer with empty id", () => {
      expect(BreakpointAnswerSchema.safeParse(makeAnswer({ id: "" })).success).toBe(false);
    });

    it("rejects answer with empty breakpointId", () => {
      expect(BreakpointAnswerSchema.safeParse(makeAnswer({ breakpointId: "" })).success).toBe(false);
    });

    it("rejects answer with empty responderId", () => {
      expect(BreakpointAnswerSchema.safeParse(makeAnswer({ responderId: "" })).success).toBe(false);
    });

    it("rejects answer with empty responderName", () => {
      expect(BreakpointAnswerSchema.safeParse(makeAnswer({ responderName: "" })).success).toBe(false);
    });

    it("rejects answer with confidence below 0", () => {
      expect(BreakpointAnswerSchema.safeParse(makeAnswer({ confidence: -1 })).success).toBe(false);
    });

    it("rejects answer with confidence above 100", () => {
      expect(BreakpointAnswerSchema.safeParse(makeAnswer({ confidence: 101 })).success).toBe(false);
    });

    it("accepts answer with confidence at boundaries (0 and 100)", () => {
      expect(BreakpointAnswerSchema.safeParse(makeAnswer({ confidence: 0 })).success).toBe(true);
      expect(BreakpointAnswerSchema.safeParse(makeAnswer({ confidence: 100 })).success).toBe(true);
    });

    it("rejects answer with invalid datetime in answeredAt", () => {
      expect(BreakpointAnswerSchema.safeParse(makeAnswer({ answeredAt: "not-a-date" })).success).toBe(false);
    });

    it("accepts answer with empty text (text is z.string(), no min)", () => {
      const answer = makeAnswer({ text: "" });
      const result = BreakpointAnswerSchema.safeParse(answer);
      expect(result.success).toBe(true);
    });

    it("accepts answer with empty references and followUpQuestions arrays", () => {
      const answer = makeAnswer({ references: [], followUpQuestions: [] });
      expect(BreakpointAnswerSchema.safeParse(answer).success).toBe(true);
    });

    it("accepts answer with populated references and followUpQuestions", () => {
      const answer = makeAnswer({
        references: ["https://docs.example.com", "src/cache.ts"],
        followUpQuestions: ["How will this affect latency?"],
      });
      expect(BreakpointAnswerSchema.safeParse(answer).success).toBe(true);
    });
  });

  // ── 3.9 BreakpointSubmitterSchema ──────────────────────────────────────

  describe("BreakpointSubmitterSchema", () => {
    it("accepts a valid submitter with required fields", () => {
      const submitter = makeSubmitter();
      const result = BreakpointSubmitterSchema.safeParse(submitter);
      expect(result.success).toBe(true);
    });

    it("accepts a submitter with all optional fields", () => {
      const submitter = makeSubmitter({
        email: "test@example.com",
        avatarUrl: "https://avatars.example.com/testuser.png",
      });
      const result = BreakpointSubmitterSchema.safeParse(submitter);
      expect(result.success).toBe(true);
    });

    it("rejects submitter with empty sub", () => {
      expect(BreakpointSubmitterSchema.safeParse(makeSubmitter({ sub: "" })).success).toBe(false);
    });

    it("rejects submitter with empty login", () => {
      expect(BreakpointSubmitterSchema.safeParse(makeSubmitter({ login: "" })).success).toBe(false);
    });

    it("rejects submitter with empty name", () => {
      expect(BreakpointSubmitterSchema.safeParse(makeSubmitter({ name: "" })).success).toBe(false);
    });

    it("rejects submitter with invalid email", () => {
      const submitter = makeSubmitter({ email: "not-an-email" });
      expect(BreakpointSubmitterSchema.safeParse(submitter).success).toBe(false);
    });

    it("rejects submitter with invalid avatarUrl", () => {
      const submitter = makeSubmitter({ avatarUrl: "not-a-url" });
      expect(BreakpointSubmitterSchema.safeParse(submitter).success).toBe(false);
    });
  });

  // ── 3.9 BreakpointSchema ──────────────────────────────────────────────

  describe("BreakpointSchema", () => {
    it("accepts a valid breakpoint with required fields", () => {
      const bp = makeBreakpoint();
      const result = BreakpointSchema.safeParse(bp);
      expect(result.success).toBe(true);
    });

    it("accepts a breakpoint with all optional fields", () => {
      const bp = makeBreakpoint({
        selectedAnswer: "answer-001",
        projectId: "project-123",
        repoId: "repo-456",
        createdBy: makeSubmitter(),
        claimedByResponderId: "responder-1",
        claimedByResponderName: "Test Responder",
      });
      const result = BreakpointSchema.safeParse(bp);
      expect(result.success).toBe(true);
    });

    it("accepts a breakpoint with answers array populated", () => {
      const bp = makeBreakpoint({
        status: "answered",
        answers: [makeAnswer()],
        selectedAnswer: "answer-001",
      });
      const result = BreakpointSchema.safeParse(bp);
      expect(result.success).toBe(true);
    });

    it("rejects breakpoint with empty id", () => {
      expect(BreakpointSchema.safeParse(makeBreakpoint({ id: "" })).success).toBe(false);
    });

    it("rejects breakpoint with empty text", () => {
      expect(BreakpointSchema.safeParse(makeBreakpoint({ text: "" })).success).toBe(false);
    });

    it("rejects breakpoint with invalid status", () => {
      expect(BreakpointSchema.safeParse(makeBreakpoint({ status: "bogus" as BreakpointStatus })).success).toBe(false);
    });

    it("rejects breakpoint with invalid datetime in createdAt", () => {
      expect(BreakpointSchema.safeParse(makeBreakpoint({ createdAt: "bad" })).success).toBe(false);
    });

    it("rejects breakpoint with invalid datetime in updatedAt", () => {
      expect(BreakpointSchema.safeParse(makeBreakpoint({ updatedAt: "bad" })).success).toBe(false);
    });

    it("rejects breakpoint with invalid datetime in expiresAt", () => {
      expect(BreakpointSchema.safeParse(makeBreakpoint({ expiresAt: "bad" })).success).toBe(false);
    });

    it("rejects breakpoint missing context", () => {
      const { context, ...rest } = makeBreakpoint();
      expect(BreakpointSchema.safeParse(rest).success).toBe(false);
    });

    it("rejects breakpoint missing routing", () => {
      const { routing, ...rest } = makeBreakpoint();
      expect(BreakpointSchema.safeParse(rest).success).toBe(false);
    });

    it("rejects breakpoint with empty claimedByResponderId", () => {
      expect(BreakpointSchema.safeParse(makeBreakpoint({ claimedByResponderId: "" })).success).toBe(false);
    });

    it("rejects breakpoint with empty claimedByResponderName", () => {
      expect(BreakpointSchema.safeParse(makeBreakpoint({ claimedByResponderName: "" })).success).toBe(false);
    });

    it("validates nested context schema within breakpoint", () => {
      const bp = makeBreakpoint({
        context: { description: "test", codeSnippets: [], fileReferences: [], tags: [], urgency: "invalid" as Urgency },
      });
      expect(BreakpointSchema.safeParse(bp).success).toBe(false);
    });

    it("validates nested routing schema within breakpoint", () => {
      const bp = makeBreakpoint({
        routing: { ...makeRouting(), strategy: "invalid" as BreakpointStrategy },
      });
      expect(BreakpointSchema.safeParse(bp).success).toBe(false);
    });

    it("validates nested answers schema within breakpoint", () => {
      const bp = makeBreakpoint({
        answers: [{ ...makeAnswer(), confidence: 200 }],
      });
      expect(BreakpointSchema.safeParse(bp).success).toBe(false);
    });
  });

  // ── 3.10 BreakpointWaitResultSchema ────────────────────────────────────

  describe("BreakpointWaitResultSchema", () => {
    it("accepts a valid answered wait result", () => {
      const result = makeWaitResult();
      const parsed = BreakpointWaitResultSchema.safeParse(result);
      expect(parsed.success).toBe(true);
    });

    it("accepts an unanswered wait result (timeout)", () => {
      const result: BreakpointWaitResult = {
        answered: false,
        breakpoint: makeBreakpoint({ status: "expired" }),
        allAnswers: [],
        resolution: "timeout",
        elapsedMs: 1800000,
      };
      const parsed = BreakpointWaitResultSchema.safeParse(result);
      expect(parsed.success).toBe(true);
    });

    it("accepts wait result without optional answer and resolution", () => {
      const result = {
        answered: false,
        breakpoint: makeBreakpoint(),
        allAnswers: [],
        elapsedMs: 0,
      };
      const parsed = BreakpointWaitResultSchema.safeParse(result);
      expect(parsed.success).toBe(true);
    });

    it("rejects wait result with negative elapsedMs", () => {
      const result = makeWaitResult({ elapsedMs: -1 });
      expect(BreakpointWaitResultSchema.safeParse(result).success).toBe(false);
    });

    it("accepts elapsedMs of 0 (nonnegative)", () => {
      const result = makeWaitResult({ elapsedMs: 0 });
      expect(BreakpointWaitResultSchema.safeParse(result).success).toBe(true);
    });

    it("rejects wait result missing breakpoint", () => {
      const { breakpoint, ...rest } = makeWaitResult();
      expect(BreakpointWaitResultSchema.safeParse(rest).success).toBe(false);
    });

    it("rejects wait result missing answered boolean", () => {
      const { answered, ...rest } = makeWaitResult();
      expect(BreakpointWaitResultSchema.safeParse(rest).success).toBe(false);
    });

    it("rejects wait result missing allAnswers array", () => {
      const { allAnswers, ...rest } = makeWaitResult();
      expect(BreakpointWaitResultSchema.safeParse(rest).success).toBe(false);
    });

    it("validates nested breakpoint schema within wait result", () => {
      const result = makeWaitResult({
        breakpoint: { ...makeBreakpoint(), id: "" },
      });
      expect(BreakpointWaitResultSchema.safeParse(result).success).toBe(false);
    });
  });

  // ── 3.11 ProvenBreakpointAnswerSchema ──────────────────────────────────

  describe("ProvenBreakpointAnswerSchema", () => {
    function makeProvenAnswer(overrides: Partial<ProvenBreakpointAnswer> = {}): ProvenBreakpointAnswer {
      return {
        ...makeAnswer(),
        signature: "base64signaturedata==",
        publicKeyFingerprint: "abcdef1234567890abcdef1234567890",
        signedAt: NOW,
        signedFields: ["id", "breakpointId", "responderId", "text", "approved", "confidence", "answeredAt"],
        ...overrides,
      };
    }

    it("accepts a valid proven answer", () => {
      const proven = makeProvenAnswer();
      const result = ProvenBreakpointAnswerSchema.safeParse(proven);
      expect(result.success).toBe(true);
    });

    it("extends BreakpointAnswerSchema with additional fields", () => {
      const proven = makeProvenAnswer();
      // Should also pass the base BreakpointAnswerSchema (minus proven-specific fields)
      const baseResult = BreakpointAnswerSchema.safeParse(proven);
      expect(baseResult.success).toBe(true);
    });

    it("rejects proven answer with empty signature", () => {
      expect(ProvenBreakpointAnswerSchema.safeParse(makeProvenAnswer({ signature: "" })).success).toBe(false);
    });

    it("rejects proven answer with empty publicKeyFingerprint", () => {
      expect(ProvenBreakpointAnswerSchema.safeParse(makeProvenAnswer({ publicKeyFingerprint: "" })).success).toBe(false);
    });

    it("rejects proven answer with invalid signedAt datetime", () => {
      expect(ProvenBreakpointAnswerSchema.safeParse(makeProvenAnswer({ signedAt: "bad" })).success).toBe(false);
    });

    it("rejects proven answer missing base answer fields", () => {
      const { id, ...rest } = makeProvenAnswer();
      expect(ProvenBreakpointAnswerSchema.safeParse(rest).success).toBe(false);
    });

    it("accepts proven answer with empty signedFields array", () => {
      const proven = makeProvenAnswer({ signedFields: [] });
      const result = ProvenBreakpointAnswerSchema.safeParse(proven);
      expect(result.success).toBe(true);
    });
  });

  // ── 3.11 ProvenVerificationResultSchema ────────────────────────────────

  describe("ProvenVerificationResultSchema", () => {
    it("accepts a valid successful verification result", () => {
      const result: ProvenVerificationResult = {
        valid: true,
        publicKeyFingerprint: "abcdef123456",
        responderName: "Test Responder",
        reason: "Signature verified successfully",
        verifiedAt: NOW,
      };
      const parsed = ProvenVerificationResultSchema.safeParse(result);
      expect(parsed.success).toBe(true);
    });

    it("accepts a valid failed verification result", () => {
      const result: ProvenVerificationResult = {
        valid: false,
        reason: "Public key not found in trusted keys",
        verifiedAt: NOW,
      };
      const parsed = ProvenVerificationResultSchema.safeParse(result);
      expect(parsed.success).toBe(true);
    });

    it("accepts verification result with only required fields", () => {
      const result = { valid: true, verifiedAt: NOW };
      const parsed = ProvenVerificationResultSchema.safeParse(result);
      expect(parsed.success).toBe(true);
    });

    it("rejects verification result with invalid verifiedAt datetime", () => {
      const result = { valid: true, verifiedAt: "bad-date" };
      expect(ProvenVerificationResultSchema.safeParse(result).success).toBe(false);
    });

    it("rejects verification result missing valid boolean", () => {
      const result = { verifiedAt: NOW };
      expect(ProvenVerificationResultSchema.safeParse(result).success).toBe(false);
    });

    it("rejects verification result missing verifiedAt", () => {
      const result = { valid: true };
      expect(ProvenVerificationResultSchema.safeParse(result).success).toBe(false);
    });
  });

  // ── 3.12 BackendConfigSchema ───────────────────────────────────────────

  describe("BackendConfigSchema", () => {
    it("accepts a valid git-native backend config with all fields", () => {
      const config = {
        type: "git-native",
        breakpointsDir: "/tmp/.breakpoints",
        pollIntervalMs: 5000,
        timeoutMs: 60000,
      };
      const result = BackendConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("accepts a git-native config with only type (all others optional)", () => {
      const config = { type: "git-native" };
      const result = BackendConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("rejects backend config with unknown type", () => {
      const config = { type: "unknown-backend" };
      expect(BackendConfigSchema.safeParse(config).success).toBe(false);
    });

    it("rejects git-native config with non-positive pollIntervalMs", () => {
      const config = { type: "git-native", pollIntervalMs: 0 };
      expect(BackendConfigSchema.safeParse(config).success).toBe(false);
    });

    it("rejects git-native config with non-positive timeoutMs", () => {
      const config = { type: "git-native", timeoutMs: -1 };
      expect(BackendConfigSchema.safeParse(config).success).toBe(false);
    });

    it("rejects config missing type", () => {
      const config = { breakpointsDir: "/tmp" };
      expect(BackendConfigSchema.safeParse(config).success).toBe(false);
    });
  });

  // ── 3.12 RoutingRuleSchema ─────────────────────────────────────────────

  describe("RoutingRuleSchema", () => {
    it("accepts a valid routing rule with all fields", () => {
      const rule: RoutingRule = {
        domains: ["security", "auth"],
        tags: ["security-review"],
        backend: "bmux-server",
        backendConfig: { type: "server", url: "https://bmux.a5c.ai" },
      };
      const result = RoutingRuleSchema.safeParse(rule);
      expect(result.success).toBe(true);
    });

    it("accepts a routing rule without optional domains and tags", () => {
      const rule = {
        backend: "git-native",
        backendConfig: {},
      };
      const result = RoutingRuleSchema.safeParse(rule);
      expect(result.success).toBe(true);
    });

    it("rejects routing rule with empty backend", () => {
      const rule = { backend: "", backendConfig: {} };
      expect(RoutingRuleSchema.safeParse(rule).success).toBe(false);
    });

    it("rejects routing rule missing backend", () => {
      const rule = { backendConfig: {} };
      expect(RoutingRuleSchema.safeParse(rule).success).toBe(false);
    });

    it("rejects routing rule missing backendConfig", () => {
      const rule = { backend: "git-native" };
      expect(RoutingRuleSchema.safeParse(rule).success).toBe(false);
    });

    it("accepts backendConfig as an arbitrary record", () => {
      const rule = {
        backend: "custom",
        backendConfig: {
          apiKey: "secret",
          endpoint: "https://custom.example.com",
          retries: 3,
        },
      };
      const result = RoutingRuleSchema.safeParse(rule);
      expect(result.success).toBe(true);
    });
  });

  // ── 3.12 RoutingConfigSchema ───────────────────────────────────────────

  describe("RoutingConfigSchema", () => {
    it("accepts a valid routing config", () => {
      const config: RoutingConfig = {
        defaultBackend: "git-native",
        routes: [
          {
            domains: ["security"],
            backend: "bmux-server",
            backendConfig: { type: "server", url: "https://bmux.a5c.ai" },
          },
        ],
      };
      const result = RoutingConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("accepts routing config with empty routes array", () => {
      const config = { defaultBackend: "git-native", routes: [] };
      const result = RoutingConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("rejects routing config with empty defaultBackend", () => {
      const config = { defaultBackend: "", routes: [] };
      expect(RoutingConfigSchema.safeParse(config).success).toBe(false);
    });

    it("rejects routing config missing defaultBackend", () => {
      const config = { routes: [] };
      expect(RoutingConfigSchema.safeParse(config).success).toBe(false);
    });

    it("rejects routing config missing routes", () => {
      const config = { defaultBackend: "git-native" };
      expect(RoutingConfigSchema.safeParse(config).success).toBe(false);
    });

    it("validates nested routing rules", () => {
      const config = {
        defaultBackend: "git-native",
        routes: [{ backend: "", backendConfig: {} }],
      };
      expect(RoutingConfigSchema.safeParse(config).success).toBe(false);
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Section 3.13: Constants
// ────────────────────────────────────────────────────────────────────────────

describe("Section 3.13: Constants", () => {
  it("DEFAULT_POLL_INTERVAL_MS is 3000", () => {
    expect(DEFAULT_POLL_INTERVAL_MS).toBe(3_000);
  });

  it("DEFAULT_TIMEOUT_MS is 30 minutes (1,800,000 ms)", () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(30 * 60 * 1_000);
    expect(DEFAULT_TIMEOUT_MS).toBe(1_800_000);
  });

  it("BREAKPOINTS_DIR is '.breakpoints'", () => {
    expect(BREAKPOINTS_DIR).toBe(".breakpoints");
  });

  it("BREAKPOINTS_KEYS_DIR is '.breakpoints/.keys'", () => {
    expect(BREAKPOINTS_KEYS_DIR).toBe(".breakpoints/.keys");
  });

  it("BREAKPOINTS_TRUSTED_KEYS_DIR is '.breakpoints/.keys/trusted'", () => {
    expect(BREAKPOINTS_TRUSTED_KEYS_DIR).toBe(".breakpoints/.keys/trusted");
  });

  it("BREAKPOINTS_PRIVATE_KEYS_DIR is '.breakpoints/.keys/private'", () => {
    expect(BREAKPOINTS_PRIVATE_KEYS_DIR).toBe(".breakpoints/.keys/private");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Section 3.14: Utility - generateBreakpointId
// ────────────────────────────────────────────────────────────────────────────

describe("Section 3.14: generateBreakpointId()", () => {
  it("returns a string", () => {
    const id = generateBreakpointId();
    expect(typeof id).toBe("string");
  });

  it("returns a 24-character hex string (12 random bytes)", () => {
    const id = generateBreakpointId();
    expect(id).toHaveLength(24);
    expect(id).toMatch(/^[0-9a-f]{24}$/);
  });

  it("generates unique IDs on consecutive calls", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateBreakpointId());
    }
    expect(ids.size).toBe(100);
  });

  it("produces a valid hex string that can be used as a breakpoint id", () => {
    const id = generateBreakpointId();
    const bp = makeBreakpoint({ id });
    const result = BreakpointSchema.safeParse(bp);
    expect(result.success).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Section 4: Backend Interface
// ────────────────────────────────────────────────────────────────────────────

describe("Section 4: BreakpointBackend Interface", () => {
  /**
   * A mock backend that fulfills the BreakpointBackend contract.
   * Used to verify the interface shape and method signatures
   * can be implemented correctly.
   */
  class MockBreakpointBackend implements BreakpointBackend {
    readonly name = "mock";

    private breakpoints = new Map<string, Breakpoint>();
    private answers = new Map<string, BreakpointAnswer>();
    private counter = 0;

    async submitBreakpoint(params: SubmitBreakpointParams): Promise<Breakpoint> {
      const id = `mock-${Date.now()}-${this.counter++}`;
      const now = new Date().toISOString();
      const bp: Breakpoint = {
        id,
        text: params.text,
        context: params.context,
        status: "pending",
        routing: params.routing,
        answers: [],
        projectId: params.projectId,
        repoId: params.repoId,
        createdAt: now,
        updatedAt: now,
        expiresAt: new Date(Date.now() + params.routing.timeoutMs).toISOString(),
      };
      this.breakpoints.set(id, bp);
      return bp;
    }

    async getBreakpoint(id: string): Promise<Breakpoint> {
      const bp = this.breakpoints.get(id);
      if (!bp) throw new Error(`Breakpoint not found: ${id}`);
      return bp;
    }

    async waitForAnswer(id: string, _options?: WaitForAnswerOptions): Promise<BreakpointWaitResult> {
      const bp = await this.getBreakpoint(id);
      const answer = this.answers.get(id);
      return {
        answered: !!answer,
        breakpoint: bp,
        answer,
        allAnswers: answer ? [answer] : [],
        elapsedMs: 0,
      };
    }

    async listPendingBreakpoints(responderId?: string): Promise<Breakpoint[]> {
      const pending: Breakpoint[] = [];
      for (const bp of this.breakpoints.values()) {
        if (bp.status !== "pending") continue;
        if (responderId && bp.routing.targetResponders.length > 0) {
          if (!bp.routing.targetResponders.includes(responderId)) continue;
        }
        pending.push(bp);
      }
      return pending;
    }

    async answerBreakpoint(id: string, answer: SubmitAnswerParams): Promise<BreakpointAnswer> {
      const bp = await this.getBreakpoint(id);
      const now = new Date().toISOString();
      const bpAnswer: BreakpointAnswer = {
        id: `answer-${Date.now()}`,
        breakpointId: id,
        responderId: answer.responderId,
        responderName: answer.responderName,
        text: answer.text,
        approved: answer.approved,
        confidence: answer.confidence ?? 80,
        references: answer.references ?? [],
        followUpQuestions: answer.followUpQuestions ?? [],
        answeredAt: now,
      };
      this.answers.set(id, bpAnswer);
      bp.status = "answered";
      bp.answers.push(bpAnswer);
      bp.updatedAt = now;
      return bpAnswer;
    }

    async cancelBreakpoint(id: string): Promise<void> {
      const bp = await this.getBreakpoint(id);
      bp.status = "cancelled";
      bp.updatedAt = new Date().toISOString();
    }

    // Optional methods
    async listResponders(_params?: ListRespondersParams): Promise<ResponderProfile[]> {
      return [makeResponderProfile()];
    }

    async claimBreakpoint(id: string, responderId: string): Promise<Breakpoint> {
      const bp = await this.getBreakpoint(id);
      bp.status = "claimed";
      bp.claimedByResponderId = responderId;
      bp.updatedAt = new Date().toISOString();
      return bp;
    }

    // Test helper
    _setAnswer(bpId: string, answer: BreakpointAnswer): void {
      this.answers.set(bpId, answer);
    }
  }

  let backend: MockBreakpointBackend;

  const defaultContext = makeContext({
    description: "Should we use connection pooling?",
    tags: ["backend", "redis"],
    domain: "backend",
  });

  const defaultRouting = makeRouting({
    strategy: "first-response-wins",
    targetResponders: ["responder-1"],
    timeoutMs: 60000,
    presentToUser: true,
  });

  beforeEach(() => {
    backend = new MockBreakpointBackend();
  });

  describe("name property", () => {
    it("has a readonly name property", () => {
      expect(backend.name).toBe("mock");
      expect(typeof backend.name).toBe("string");
    });
  });

  describe("submitBreakpoint()", () => {
    it("creates a breakpoint and returns it with a generated ID", async () => {
      const params: SubmitBreakpointParams = {
        text: "Should we use connection pooling?",
        context: defaultContext,
        routing: defaultRouting,
      };
      const bp = await backend.submitBreakpoint(params);
      expect(bp.id).toBeTruthy();
      expect(bp.text).toBe(params.text);
      expect(bp.status).toBe("pending");
      expect(bp.answers).toEqual([]);
    });

    it("includes optional projectId and repoId", async () => {
      const params: SubmitBreakpointParams = {
        text: "test question",
        context: defaultContext,
        routing: defaultRouting,
        projectId: "project-123",
        repoId: "repo-456",
      };
      const bp = await backend.submitBreakpoint(params);
      expect(bp.projectId).toBe("project-123");
      expect(bp.repoId).toBe("repo-456");
    });

    it("sets createdAt, updatedAt, and expiresAt timestamps", async () => {
      const params: SubmitBreakpointParams = {
        text: "test",
        context: defaultContext,
        routing: defaultRouting,
      };
      const bp = await backend.submitBreakpoint(params);
      expect(bp.createdAt).toBeTruthy();
      expect(bp.updatedAt).toBeTruthy();
      expect(bp.expiresAt).toBeTruthy();
      // expiresAt should be after createdAt
      expect(new Date(bp.expiresAt).getTime()).toBeGreaterThan(new Date(bp.createdAt).getTime());
    });

    it("preserves context and routing from params", async () => {
      const params: SubmitBreakpointParams = {
        text: "test",
        context: defaultContext,
        routing: defaultRouting,
      };
      const bp = await backend.submitBreakpoint(params);
      expect(bp.context).toEqual(defaultContext);
      expect(bp.routing).toEqual(defaultRouting);
    });
  });

  describe("getBreakpoint()", () => {
    it("retrieves a previously submitted breakpoint by ID", async () => {
      const bp = await backend.submitBreakpoint({
        text: "test",
        context: defaultContext,
        routing: defaultRouting,
      });
      const retrieved = await backend.getBreakpoint(bp.id);
      expect(retrieved.id).toBe(bp.id);
      expect(retrieved.text).toBe(bp.text);
    });

    it("throws an error for a non-existent breakpoint ID", async () => {
      await expect(backend.getBreakpoint("nonexistent")).rejects.toThrow();
    });
  });

  describe("waitForAnswer()", () => {
    it("returns answered: false when no answer exists yet", async () => {
      const bp = await backend.submitBreakpoint({
        text: "test",
        context: defaultContext,
        routing: defaultRouting,
      });
      const result = await backend.waitForAnswer(bp.id);
      expect(result.answered).toBe(false);
      expect(result.answer).toBeUndefined();
      expect(result.allAnswers).toEqual([]);
    });

    it("returns answered: true when an answer exists", async () => {
      const bp = await backend.submitBreakpoint({
        text: "test",
        context: defaultContext,
        routing: defaultRouting,
      });
      const answer = makeAnswer({ breakpointId: bp.id });
      backend._setAnswer(bp.id, answer);

      const result = await backend.waitForAnswer(bp.id);
      expect(result.answered).toBe(true);
      expect(result.answer).toEqual(answer);
      expect(result.allAnswers).toHaveLength(1);
    });

    it("accepts optional WaitForAnswerOptions", async () => {
      const bp = await backend.submitBreakpoint({
        text: "test",
        context: defaultContext,
        routing: defaultRouting,
      });
      const options: WaitForAnswerOptions = {
        timeoutMs: 5000,
        pollIntervalMs: 1000,
        preferStreaming: true,
      };
      const result = await backend.waitForAnswer(bp.id, options);
      expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
    });

    it("includes elapsedMs in the result", async () => {
      const bp = await backend.submitBreakpoint({
        text: "test",
        context: defaultContext,
        routing: defaultRouting,
      });
      const result = await backend.waitForAnswer(bp.id);
      expect(typeof result.elapsedMs).toBe("number");
      expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("listPendingBreakpoints()", () => {
    it("returns an empty array when no breakpoints exist", async () => {
      const pending = await backend.listPendingBreakpoints();
      expect(pending).toEqual([]);
    });

    it("returns pending breakpoints", async () => {
      await backend.submitBreakpoint({
        text: "question 1",
        context: defaultContext,
        routing: defaultRouting,
      });
      await backend.submitBreakpoint({
        text: "question 2",
        context: defaultContext,
        routing: defaultRouting,
      });
      const pending = await backend.listPendingBreakpoints();
      expect(pending).toHaveLength(2);
    });

    it("excludes non-pending breakpoints", async () => {
      const bp = await backend.submitBreakpoint({
        text: "question",
        context: defaultContext,
        routing: defaultRouting,
      });
      await backend.cancelBreakpoint(bp.id);
      const pending = await backend.listPendingBreakpoints();
      expect(pending).toHaveLength(0);
    });

    it("filters by responderId when provided", async () => {
      await backend.submitBreakpoint({
        text: "for responder-1",
        context: defaultContext,
        routing: makeRouting({ targetResponders: ["responder-1"] }),
      });
      await backend.submitBreakpoint({
        text: "for responder-2",
        context: defaultContext,
        routing: makeRouting({ targetResponders: ["responder-2"] }),
      });

      const forResponder1 = await backend.listPendingBreakpoints("responder-1");
      expect(forResponder1).toHaveLength(1);
      expect(forResponder1[0].text).toBe("for responder-1");
    });
  });

  describe("answerBreakpoint()", () => {
    it("creates and returns a BreakpointAnswer", async () => {
      const bp = await backend.submitBreakpoint({
        text: "test question",
        context: defaultContext,
        routing: defaultRouting,
      });
      const answerParams: SubmitAnswerParams = {
        responderId: "responder-1",
        responderName: "Test Responder",
        text: "Yes, use connection pooling.",
        approved: true,
        confidence: 90,
        references: ["https://docs.example.com"],
        followUpQuestions: ["What pool size?"],
      };
      const answer = await backend.answerBreakpoint(bp.id, answerParams);
      expect(answer.id).toBeTruthy();
      expect(answer.breakpointId).toBe(bp.id);
      expect(answer.responderId).toBe("responder-1");
      expect(answer.text).toBe("Yes, use connection pooling.");
      expect(answer.approved).toBe(true);
      expect(answer.confidence).toBe(90);
    });

    it("updates the breakpoint status to 'answered'", async () => {
      const bp = await backend.submitBreakpoint({
        text: "test question",
        context: defaultContext,
        routing: defaultRouting,
      });
      await backend.answerBreakpoint(bp.id, {
        responderId: "r1",
        responderName: "R1",
        text: "answer",
      });
      const updated = await backend.getBreakpoint(bp.id);
      expect(updated.status).toBe("answered");
    });

    it("defaults confidence to 80 when not provided", async () => {
      const bp = await backend.submitBreakpoint({
        text: "test",
        context: defaultContext,
        routing: defaultRouting,
      });
      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "r1",
        responderName: "R1",
        text: "answer",
      });
      expect(answer.confidence).toBe(80);
    });

    it("adds the answer to the breakpoint answers array", async () => {
      const bp = await backend.submitBreakpoint({
        text: "test",
        context: defaultContext,
        routing: defaultRouting,
      });
      await backend.answerBreakpoint(bp.id, {
        responderId: "r1",
        responderName: "R1",
        text: "answer",
      });
      const updated = await backend.getBreakpoint(bp.id);
      expect(updated.answers).toHaveLength(1);
    });
  });

  describe("cancelBreakpoint()", () => {
    it("sets the breakpoint status to 'cancelled'", async () => {
      const bp = await backend.submitBreakpoint({
        text: "to cancel",
        context: defaultContext,
        routing: defaultRouting,
      });
      await backend.cancelBreakpoint(bp.id);
      const updated = await backend.getBreakpoint(bp.id);
      expect(updated.status).toBe("cancelled");
    });

    it("returns void", async () => {
      const bp = await backend.submitBreakpoint({
        text: "to cancel",
        context: defaultContext,
        routing: defaultRouting,
      });
      const result = await backend.cancelBreakpoint(bp.id);
      expect(result).toBeUndefined();
    });

    it("throws for non-existent breakpoint", async () => {
      await expect(backend.cancelBreakpoint("nonexistent")).rejects.toThrow();
    });
  });

  describe("listResponders() (optional)", () => {
    it("returns an array of ResponderProfile objects", async () => {
      const responders = await backend.listResponders!();
      expect(Array.isArray(responders)).toBe(true);
      expect(responders.length).toBeGreaterThan(0);
      expect(responders[0].id).toBeTruthy();
      expect(responders[0].name).toBeTruthy();
    });

    it("accepts optional ListRespondersParams", async () => {
      const params: ListRespondersParams = {
        projectId: "project-123",
        repoId: "repo-456",
      };
      const responders = await backend.listResponders!(params);
      expect(Array.isArray(responders)).toBe(true);
    });
  });

  describe("claimBreakpoint() (optional)", () => {
    it("sets breakpoint status to 'claimed'", async () => {
      const bp = await backend.submitBreakpoint({
        text: "to claim",
        context: defaultContext,
        routing: defaultRouting,
      });
      const claimed = await backend.claimBreakpoint!(bp.id, "responder-1");
      expect(claimed.status).toBe("claimed");
      expect(claimed.claimedByResponderId).toBe("responder-1");
    });

    it("returns the updated Breakpoint", async () => {
      const bp = await backend.submitBreakpoint({
        text: "to claim",
        context: defaultContext,
        routing: defaultRouting,
      });
      const claimed = await backend.claimBreakpoint!(bp.id, "responder-1");
      expect(claimed.id).toBe(bp.id);
    });
  });

  describe("full lifecycle: submit -> claim -> answer -> wait", () => {
    it("completes the full breakpoint lifecycle", async () => {
      // 1. Submit
      const bp = await backend.submitBreakpoint({
        text: "Architecture question",
        context: defaultContext,
        routing: defaultRouting,
      });
      expect(bp.status).toBe("pending");

      // 2. List pending (responder sees it)
      const pending = await backend.listPendingBreakpoints("responder-1");
      expect(pending).toHaveLength(1);

      // 3. Claim
      const claimed = await backend.claimBreakpoint!(bp.id, "responder-1");
      expect(claimed.status).toBe("claimed");

      // 4. Answer
      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "responder-1",
        responderName: "Test Responder",
        text: "Use Redis Cluster with pooling.",
        approved: true,
        confidence: 95,
      });
      expect(answer.breakpointId).toBe(bp.id);

      // 5. Wait for answer (should resolve immediately)
      const result = await backend.waitForAnswer(bp.id);
      expect(result.answered).toBe(true);
      expect(result.answer).toBeTruthy();
    });
  });

  describe("interface type compatibility", () => {
    it("the mock backend is assignable to BreakpointBackend type", () => {
      // This is a compile-time check -- if this assignment compiles, the interface matches.
      const _backend: BreakpointBackend = backend;
      expect(_backend.name).toBe("mock");
    });

    it("a minimal backend without optional methods satisfies the interface", () => {
      const minimalBackend: BreakpointBackend = {
        name: "minimal",
        submitBreakpoint: async () => makeBreakpoint(),
        getBreakpoint: async () => makeBreakpoint(),
        waitForAnswer: async () => makeWaitResult(),
        listPendingBreakpoints: async () => [],
        answerBreakpoint: async () => makeAnswer(),
        cancelBreakpoint: async () => {},
        // listResponders and claimBreakpoint are optional -- omitted here
      };
      expect(minimalBackend.name).toBe("minimal");
      expect(minimalBackend.listResponders).toBeUndefined();
      expect(minimalBackend.claimBreakpoint).toBeUndefined();
    });
  });
});
