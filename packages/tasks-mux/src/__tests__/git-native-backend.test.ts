import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { GitNativeBackend } from "../backends/git-native.js";
import type { BreakpointBackend, SubmitBreakpointParams } from "../backend.js";
import type {
  Breakpoint,
  BreakpointAnswer,
  BreakpointContext,
  BreakpointRouting,
  BreakpointWaitResult,
} from "../types.js";
import {
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_TIMEOUT_MS,
  BREAKPOINTS_DIR,
  BreakpointSchema,
  BreakpointAnswerSchema,
} from "../types.js";

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

function makeSubmitParams(overrides: Partial<SubmitBreakpointParams> = {}): SubmitBreakpointParams {
  return {
    text: "Should we use connection pooling?",
    context: makeContext(),
    routing: makeRouting(),
    ...overrides,
  };
}

function makeAnswerFile(breakpointId: string, overrides: Record<string, unknown> = {}): object {
  return {
    id: "answer-id-001",
    breakpointId,
    responderId: "tal",
    responderName: "Tal M",
    text: "Yes, use connection pooling.",
    approved: true,
    confidence: 90,
    references: [],
    followUpQuestions: [],
    answeredAt: NOW,
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

let tmpDir: string;
let breakpointsDir: string;

async function createTmpDir(): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), "bp-test-"));
}

async function readJsonFile(filePath: string): Promise<unknown> {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("GitNativeBackend", () => {
  beforeEach(async () => {
    tmpDir = await createTmpDir();
    breakpointsDir = path.join(tmpDir, ".breakpoints");
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  // ── Constructor & Configuration ─────────────────────────────────────────

  describe("constructor and configuration", () => {
    it("should have name property 'git-native'", () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      expect(backend.name).toBe("git-native");
    });

    it("should implement BreakpointBackend interface", () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      // Verify all required BreakpointBackend methods exist
      expect(typeof backend.submitBreakpoint).toBe("function");
      expect(typeof backend.getBreakpoint).toBe("function");
      expect(typeof backend.waitForAnswer).toBe("function");
      expect(typeof backend.listPendingBreakpoints).toBe("function");
      expect(typeof backend.answerBreakpoint).toBe("function");
      expect(typeof backend.cancelBreakpoint).toBe("function");
    });

    it("should accept custom breakpointsDir option", () => {
      const customDir = path.join(tmpDir, "custom-dir");
      const backend = new GitNativeBackend({ breakpointsDir: customDir });
      expect(backend.name).toBe("git-native");
    });

    it("should accept custom pollIntervalMs option", () => {
      const backend = new GitNativeBackend({
        breakpointsDir,
        pollIntervalMs: 500,
      });
      expect(backend.name).toBe("git-native");
    });

    it("should accept custom timeoutMs option", () => {
      const backend = new GitNativeBackend({
        breakpointsDir,
        timeoutMs: 60_000,
      });
      expect(backend.name).toBe("git-native");
    });

    it("should use defaults when no options provided", () => {
      const backend = new GitNativeBackend();
      expect(backend.name).toBe("git-native");
    });
  });

  // ── File Storage ────────────────────────────────────────────────────────

  describe("file storage", () => {
    it("should create .breakpoints/ directory if it does not exist", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      expect(await fileExists(breakpointsDir)).toBe(false);
      await backend.submitBreakpoint(makeSubmitParams());
      expect(await fileExists(breakpointsDir)).toBe(true);
    });

    it("should store each breakpoint as .breakpoints/<id>.json", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const filePath = path.join(breakpointsDir, `${bp.id}.json`);
      expect(await fileExists(filePath)).toBe(true);

      const data = await readJsonFile(filePath);
      expect(data).toMatchObject({ id: bp.id, text: "Should we use connection pooling?" });
    });

    it("should store answers as .breakpoints/<id>.answer.json", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes, use connection pooling.",
        confidence: 90,
      });

      const answerPath = path.join(breakpointsDir, `${bp.id}.answer.json`);
      expect(await fileExists(answerPath)).toBe(true);

      const data = await readJsonFile(answerPath) as Record<string, unknown>;
      expect(data).toMatchObject({
        breakpointId: bp.id,
        responderId: "tal",
        text: "Yes, use connection pooling.",
      });
    });

    it("should write valid JSON with pretty formatting", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const filePath = path.join(breakpointsDir, `${bp.id}.json`);
      const raw = await fs.readFile(filePath, "utf-8");

      // Should be pretty-printed (contains newlines) and end with newline
      expect(raw).toContain("\n");
      expect(raw.endsWith("\n")).toBe(true);

      // Should parse as valid JSON matching the breakpoint schema
      const parsed = JSON.parse(raw);
      expect(() => BreakpointSchema.parse(parsed)).not.toThrow();
    });

    it("should handle multiple breakpoints in the same directory", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      const bp1 = await backend.submitBreakpoint(makeSubmitParams({ text: "Question 1" }));
      const bp2 = await backend.submitBreakpoint(makeSubmitParams({ text: "Question 2" }));
      const bp3 = await backend.submitBreakpoint(makeSubmitParams({ text: "Question 3" }));

      expect(bp1.id).not.toBe(bp2.id);
      expect(bp2.id).not.toBe(bp3.id);

      for (const bp of [bp1, bp2, bp3]) {
        expect(await fileExists(path.join(breakpointsDir, `${bp.id}.json`))).toBe(true);
      }
    });

    it("should work when .breakpoints/ directory already exists", async () => {
      await fs.mkdir(breakpointsDir, { recursive: true });
      const backend = new GitNativeBackend({ breakpointsDir });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      expect(bp.id).toBeTruthy();
    });
  });

  // ── submitBreakpoint ────────────────────────────────────────────────────

  describe("submitBreakpoint()", () => {
    it("should return a Breakpoint with a generated ID", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      expect(bp.id).toBeDefined();
      expect(bp.id.length).toBeGreaterThan(0);
    });

    it("should set status to 'pending'", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      expect(bp.status).toBe("pending");
    });

    it("should include the submitted text", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(
        makeSubmitParams({ text: "Should we refactor the auth module?" }),
      );

      expect(bp.text).toBe("Should we refactor the auth module?");
    });

    it("should include the submitted context", async () => {
      const context = makeContext({
        description: "High latency on Redis",
        tags: ["performance", "redis"],
        domain: "backend",
        urgency: "medium",
      });
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams({ context }));

      expect(bp.context.description).toBe("High latency on Redis");
      expect(bp.context.tags).toEqual(["performance", "redis"]);
      expect(bp.context.domain).toBe("backend");
      expect(bp.context.urgency).toBe("medium");
    });

    it("should include the submitted routing configuration", async () => {
      const routing = makeRouting({
        strategy: "single",
        targetResponders: ["alice", "bob"],
        timeoutMs: 60_000,
        presentToUser: true,
      });
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams({ routing }));

      expect(bp.routing.strategy).toBe("single");
      expect(bp.routing.targetResponders).toEqual(["alice", "bob"]);
      expect(bp.routing.timeoutMs).toBe(60_000);
      expect(bp.routing.presentToUser).toBe(true);
    });

    it("should initialize answers as empty array", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      expect(bp.answers).toEqual([]);
    });

    it("should set createdAt and updatedAt timestamps", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      expect(bp.createdAt).toBeDefined();
      expect(bp.updatedAt).toBeDefined();
      // createdAt and updatedAt should be the same on creation
      expect(bp.createdAt).toBe(bp.updatedAt);
      // Should be valid ISO datetime
      expect(() => new Date(bp.createdAt)).not.toThrow();
    });

    it("should set expiresAt based on routing timeoutMs", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(
        makeSubmitParams({ routing: makeRouting({ timeoutMs: 60_000 }) }),
      );

      expect(bp.expiresAt).toBeDefined();
      const created = new Date(bp.createdAt).getTime();
      const expires = new Date(bp.expiresAt).getTime();
      // The expiration should be roughly timeoutMs after creation
      expect(expires - created).toBeGreaterThanOrEqual(50_000);
      expect(expires - created).toBeLessThanOrEqual(70_000);
    });

    it("should include optional projectId when provided", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(
        makeSubmitParams({ projectId: "proj-123" }),
      );

      expect(bp.projectId).toBe("proj-123");
    });

    it("should include optional repoId when provided", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(
        makeSubmitParams({ repoId: "repo-456" }),
      );

      expect(bp.repoId).toBe("repo-456");
    });

    it("should generate unique IDs for each breakpoint", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const ids = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const bp = await backend.submitBreakpoint(makeSubmitParams());
        ids.add(bp.id);
      }

      expect(ids.size).toBe(10);
    });

    it("should produce a Breakpoint that validates against BreakpointSchema", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const result = BreakpointSchema.safeParse(bp);
      expect(result.success).toBe(true);
    });

    it("should persist breakpoint data to the filesystem", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const filePath = path.join(breakpointsDir, `${bp.id}.json`);
      const data = await readJsonFile(filePath) as Record<string, unknown>;

      expect(data.id).toBe(bp.id);
      expect(data.text).toBe(bp.text);
      expect(data.status).toBe("pending");
    });
  });

  // ── getBreakpoint ───────────────────────────────────────────────────────

  describe("getBreakpoint()", () => {
    it("should retrieve a previously submitted breakpoint by ID", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const submitted = await backend.submitBreakpoint(makeSubmitParams());

      const retrieved = await backend.getBreakpoint(submitted.id);

      expect(retrieved.id).toBe(submitted.id);
      expect(retrieved.text).toBe(submitted.text);
      expect(retrieved.status).toBe(submitted.status);
    });

    it("should throw for a non-existent breakpoint ID", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      await fs.mkdir(breakpointsDir, { recursive: true });

      await expect(backend.getBreakpoint("nonexistent-id")).rejects.toThrow();
    });

    it("should throw when breakpoints directory does not exist", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      await expect(backend.getBreakpoint("any-id")).rejects.toThrow();
    });

    it("should reflect updated status after cancellation", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      await backend.cancelBreakpoint(bp.id);

      const retrieved = await backend.getBreakpoint(bp.id);
      expect(retrieved.status).toBe("cancelled");
    });

    it("should detect answer file and include it in breakpoint", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      // Manually write an answer file
      const answerPath = path.join(breakpointsDir, `${bp.id}.answer.json`);
      await writeJsonFile(answerPath, makeAnswerFile(bp.id));

      const retrieved = await backend.getBreakpoint(bp.id);

      expect(retrieved.answers.length).toBeGreaterThanOrEqual(1);
      expect(retrieved.answers[0].breakpointId).toBe(bp.id);
    });

    it("should update status to 'answered' when answer file exists", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      // Manually write an answer file
      const answerPath = path.join(breakpointsDir, `${bp.id}.answer.json`);
      await writeJsonFile(answerPath, makeAnswerFile(bp.id));

      const retrieved = await backend.getBreakpoint(bp.id);
      expect(retrieved.status).toBe("answered");
    });

    it("should return breakpoint with correct context data", async () => {
      const context = makeContext({
        description: "Redis latency problem",
        codeSnippets: [{ filename: "redis.ts", code: "const client = new Redis()", language: "typescript" }],
        fileReferences: ["src/cache/redis-client.ts"],
        tags: ["performance", "redis"],
      });
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams({ context }));

      const retrieved = await backend.getBreakpoint(bp.id);
      expect(retrieved.context.description).toBe("Redis latency problem");
      expect(retrieved.context.codeSnippets).toHaveLength(1);
      expect(retrieved.context.fileReferences).toEqual(["src/cache/redis-client.ts"]);
      expect(retrieved.context.tags).toEqual(["performance", "redis"]);
    });
  });

  // ── waitForAnswer ───────────────────────────────────────────────────────

  describe("waitForAnswer()", () => {
    it("should resolve when answer file appears", async () => {
      const backend = new GitNativeBackend({
        breakpointsDir,
        pollIntervalMs: 50,
      });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      // Write answer file after a short delay
      setTimeout(async () => {
        const answerPath = path.join(breakpointsDir, `${bp.id}.answer.json`);
        await writeJsonFile(answerPath, makeAnswerFile(bp.id));
      }, 100);

      const result = await backend.waitForAnswer(bp.id, {
        pollIntervalMs: 50,
        timeoutMs: 5_000,
      });

      expect(result.answered).toBe(true);
      expect(result.answer).toBeDefined();
      expect(result.answer!.breakpointId).toBe(bp.id);
      expect(result.breakpoint.status).toBe("answered");
    });

    it("should return with answered=false on timeout", async () => {
      const backend = new GitNativeBackend({
        breakpointsDir,
        pollIntervalMs: 50,
      });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const result = await backend.waitForAnswer(bp.id, {
        pollIntervalMs: 50,
        timeoutMs: 200,
      });

      expect(result.answered).toBe(false);
      expect(result.resolution).toBe("timeout");
    });

    it("should track elapsed time", async () => {
      const backend = new GitNativeBackend({
        breakpointsDir,
        pollIntervalMs: 50,
      });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const result = await backend.waitForAnswer(bp.id, {
        pollIntervalMs: 50,
        timeoutMs: 200,
      });

      expect(result.elapsedMs).toBeGreaterThanOrEqual(100);
      expect(result.elapsedMs).toBeDefined();
    });

    it("should support AbortSignal cancellation", async () => {
      const backend = new GitNativeBackend({
        breakpointsDir,
        pollIntervalMs: 50,
      });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const controller = new AbortController();
      setTimeout(() => controller.abort(), 100);

      const result = await backend.waitForAnswer(bp.id, {
        pollIntervalMs: 50,
        timeoutMs: 10_000,
        signal: controller.signal,
      });

      expect(result.answered).toBe(false);
      expect(result.resolution).toBe("aborted");
    });

    it("should return cancelled resolution when breakpoint is cancelled during wait", async () => {
      const backend = new GitNativeBackend({
        breakpointsDir,
        pollIntervalMs: 50,
      });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      // Cancel the breakpoint after a short delay
      setTimeout(async () => {
        await backend.cancelBreakpoint(bp.id);
      }, 100);

      const result = await backend.waitForAnswer(bp.id, {
        pollIntervalMs: 50,
        timeoutMs: 5_000,
      });

      expect(result.answered).toBe(false);
      expect(result.resolution).toBe("cancelled");
    });

    it("should use default pollIntervalMs from constructor when not specified", async () => {
      const backend = new GitNativeBackend({
        breakpointsDir,
        pollIntervalMs: 50,
        timeoutMs: 200,
      });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      // No answer provided, should timeout using constructor defaults
      const result = await backend.waitForAnswer(bp.id);

      expect(result.answered).toBe(false);
      expect(result.resolution).toBe("timeout");
    });

    it("should use default timeoutMs from constructor when not specified in options", async () => {
      const backend = new GitNativeBackend({
        breakpointsDir,
        pollIntervalMs: 50,
        timeoutMs: 200,
      });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const result = await backend.waitForAnswer(bp.id);

      expect(result.answered).toBe(false);
      expect(result.elapsedMs).toBeGreaterThanOrEqual(100);
    });

    it("should include all answers in allAnswers field", async () => {
      const backend = new GitNativeBackend({
        breakpointsDir,
        pollIntervalMs: 50,
      });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      // Write answer file
      setTimeout(async () => {
        const answerPath = path.join(breakpointsDir, `${bp.id}.answer.json`);
        await writeJsonFile(answerPath, makeAnswerFile(bp.id));
      }, 100);

      const result = await backend.waitForAnswer(bp.id, {
        pollIntervalMs: 50,
        timeoutMs: 5_000,
      });

      expect(result.allAnswers).toBeDefined();
      expect(Array.isArray(result.allAnswers)).toBe(true);
      if (result.answered) {
        expect(result.allAnswers.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("should resolve immediately when answer already exists", async () => {
      const backend = new GitNativeBackend({
        breakpointsDir,
        pollIntervalMs: 50,
      });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      // Write the answer file before waiting
      const answerPath = path.join(breakpointsDir, `${bp.id}.answer.json`);
      await writeJsonFile(answerPath, makeAnswerFile(bp.id));

      const start = Date.now();
      const result = await backend.waitForAnswer(bp.id, {
        pollIntervalMs: 50,
        timeoutMs: 5_000,
      });
      const elapsed = Date.now() - start;

      expect(result.answered).toBe(true);
      // Should resolve very quickly since the answer already exists
      expect(elapsed).toBeLessThan(1_000);
    });
  });

  // ── listPendingBreakpoints ──────────────────────────────────────────────

  describe("listPendingBreakpoints()", () => {
    it("should return empty array when no breakpoints exist", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const pending = await backend.listPendingBreakpoints();

      expect(pending).toEqual([]);
    });

    it("should return empty array when directory does not exist", async () => {
      const nonexistentDir = path.join(tmpDir, "does-not-exist");
      const backend = new GitNativeBackend({ breakpointsDir: nonexistentDir });
      const pending = await backend.listPendingBreakpoints();

      expect(pending).toEqual([]);
    });

    it("should list all pending breakpoints", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      await backend.submitBreakpoint(makeSubmitParams({ text: "Question 1" }));
      await backend.submitBreakpoint(makeSubmitParams({ text: "Question 2" }));
      await backend.submitBreakpoint(makeSubmitParams({ text: "Question 3" }));

      const pending = await backend.listPendingBreakpoints();
      expect(pending).toHaveLength(3);
    });

    it("should not include answered breakpoints", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      const bp1 = await backend.submitBreakpoint(makeSubmitParams({ text: "Q1" }));
      await backend.submitBreakpoint(makeSubmitParams({ text: "Q2" }));

      // Answer the first breakpoint
      await backend.answerBreakpoint(bp1.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes",
      });

      const pending = await backend.listPendingBreakpoints();
      expect(pending).toHaveLength(1);
      expect(pending[0].text).toBe("Q2");
    });

    it("should not include cancelled breakpoints", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      const bp1 = await backend.submitBreakpoint(makeSubmitParams({ text: "Q1" }));
      await backend.submitBreakpoint(makeSubmitParams({ text: "Q2" }));

      await backend.cancelBreakpoint(bp1.id);

      const pending = await backend.listPendingBreakpoints();
      expect(pending).toHaveLength(1);
      expect(pending[0].text).toBe("Q2");
    });

    it("should filter by responderId when provided", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      await backend.submitBreakpoint(
        makeSubmitParams({
          text: "For Alice",
          routing: makeRouting({ targetResponders: ["alice"] }),
        }),
      );
      await backend.submitBreakpoint(
        makeSubmitParams({
          text: "For Bob",
          routing: makeRouting({ targetResponders: ["bob"] }),
        }),
      );
      await backend.submitBreakpoint(
        makeSubmitParams({
          text: "For anyone",
          routing: makeRouting({ targetResponders: [] }),
        }),
      );

      const aliceBreakpoints = await backend.listPendingBreakpoints("alice");
      // Should include Alice's targeted breakpoint and any with empty targetResponders
      const aliceTexts = aliceBreakpoints.map((bp) => bp.text);
      expect(aliceTexts).toContain("For Alice");
      expect(aliceTexts).toContain("For anyone");
      expect(aliceTexts).not.toContain("For Bob");
    });

    it("should not include expired breakpoints", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      // Submit a breakpoint with a very short timeout
      const bp = await backend.submitBreakpoint(
        makeSubmitParams({
          text: "Short-lived",
          routing: makeRouting({ timeoutMs: 1 }),
        }),
      );

      // Wait a small amount for expiration to pass
      await new Promise((resolve) => setTimeout(resolve, 50));

      const pending = await backend.listPendingBreakpoints();
      const ids = pending.map((b) => b.id);
      expect(ids).not.toContain(bp.id);
    });

    it("should skip malformed JSON files without throwing", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      await backend.submitBreakpoint(makeSubmitParams({ text: "Valid breakpoint" }));

      // Write a corrupted file
      await fs.writeFile(
        path.join(breakpointsDir, "corrupted.json"),
        "this is not valid json{{{",
        "utf-8",
      );

      const pending = await backend.listPendingBreakpoints();
      expect(pending).toHaveLength(1);
      expect(pending[0].text).toBe("Valid breakpoint");
    });

    it("should ignore .answer.json files", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      const bp = await backend.submitBreakpoint(makeSubmitParams());

      // Write an answer file -- it should be ignored in the list
      await writeJsonFile(
        path.join(breakpointsDir, `${bp.id}.answer.json`),
        makeAnswerFile(bp.id),
      );

      // The breakpoint has an answer, so it should not be in pending
      const pending = await backend.listPendingBreakpoints();
      const ids = pending.map((b) => b.id);
      expect(ids).not.toContain(bp.id);
    });

    it("should ignore .proven.json files", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      await fs.mkdir(breakpointsDir, { recursive: true });

      // Write a proven file directly -- should be ignored
      await writeJsonFile(
        path.join(breakpointsDir, "some-id.answer.proven.json"),
        { someData: true },
      );

      const pending = await backend.listPendingBreakpoints();
      expect(pending).toHaveLength(0);
    });

    it("should return breakpoints with 'routed' status as pending", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      const bp = await backend.submitBreakpoint(makeSubmitParams());

      // Manually update the status to "routed" on disk
      const filePath = path.join(breakpointsDir, `${bp.id}.json`);
      const data = await readJsonFile(filePath) as Record<string, unknown>;
      data.status = "routed";
      await writeJsonFile(filePath, data);

      const pending = await backend.listPendingBreakpoints();
      expect(pending).toHaveLength(1);
      expect(pending[0].status).toBe("routed");
    });
  });

  // ── answerBreakpoint ────────────────────────────────────────────────────

  describe("answerBreakpoint()", () => {
    it("should create an answer file on disk", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes, definitely.",
      });

      const answerPath = path.join(breakpointsDir, `${bp.id}.answer.json`);
      expect(await fileExists(answerPath)).toBe(true);
    });

    it("should return a BreakpointAnswer with generated ID", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Use connection pooling.",
      });

      expect(answer.id).toBeDefined();
      expect(answer.id.length).toBeGreaterThan(0);
    });

    it("should set breakpointId on the answer", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Use connection pooling.",
      });

      expect(answer.breakpointId).toBe(bp.id);
    });

    it("should include responderId and responderName", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "alice",
        responderName: "Alice W",
        text: "Approved.",
      });

      expect(answer.responderId).toBe("alice");
      expect(answer.responderName).toBe("Alice W");
    });

    it("should include the answer text", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes, use ioredis cluster mode.",
      });

      expect(answer.text).toBe("Yes, use ioredis cluster mode.");
    });

    it("should include optional approved field", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Approved",
        approved: true,
      });

      expect(answer.approved).toBe(true);
    });

    it("should include confidence with default of 80", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Probably yes.",
      });

      expect(answer.confidence).toBe(80);
    });

    it("should use provided confidence value", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Definitely yes.",
        confidence: 95,
      });

      expect(answer.confidence).toBe(95);
    });

    it("should include references when provided", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "See the docs.",
        references: ["https://redis.io/docs", "src/cache/readme.md"],
      });

      expect(answer.references).toEqual(["https://redis.io/docs", "src/cache/readme.md"]);
    });

    it("should default references to empty array", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      expect(answer.references).toEqual([]);
    });

    it("should include followUpQuestions when provided", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes, but...",
        followUpQuestions: ["What about connection limits?"],
      });

      expect(answer.followUpQuestions).toEqual(["What about connection limits?"]);
    });

    it("should default followUpQuestions to empty array", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      expect(answer.followUpQuestions).toEqual([]);
    });

    it("should set answeredAt timestamp", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Done.",
      });

      expect(answer.answeredAt).toBeDefined();
      expect(() => new Date(answer.answeredAt)).not.toThrow();
    });

    it("should update the breakpoint status to 'answered'", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      const updated = await backend.getBreakpoint(bp.id);
      expect(updated.status).toBe("answered");
    });

    it("should update the breakpoint updatedAt timestamp", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());
      const originalUpdatedAt = bp.updatedAt;

      // Small delay to ensure timestamp differs
      await new Promise((resolve) => setTimeout(resolve, 10));

      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      const updated = await backend.getBreakpoint(bp.id);
      expect(updated.updatedAt).not.toBe(originalUpdatedAt);
    });

    it("should throw for a non-existent breakpoint ID", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      await fs.mkdir(breakpointsDir, { recursive: true });

      await expect(
        backend.answerBreakpoint("nonexistent", {
          responderId: "tal",
          responderName: "Tal M",
          text: "Yes.",
        }),
      ).rejects.toThrow();
    });

    it("should produce an answer that validates against BreakpointAnswerSchema", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
        confidence: 90,
      });

      const result = BreakpointAnswerSchema.safeParse(answer);
      expect(result.success).toBe(true);
    });

    it("should include decisionMemory when provided", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Use connection pooling.",
        decisionMemory: {
          applicabilityContext: "When dealing with high-throughput Redis",
          reasoning: "Connection pooling reduces overhead",
        },
      });

      expect(answer.decisionMemory).toBeDefined();
      expect(answer.decisionMemory!.applicabilityContext).toBe(
        "When dealing with high-throughput Redis",
      );
      expect(answer.decisionMemory!.reasoning).toBe(
        "Connection pooling reduces overhead",
      );
      expect(answer.decisionMemory!.savedAt).toBeDefined();
    });
  });

  // ── cancelBreakpoint ────────────────────────────────────────────────────

  describe("cancelBreakpoint()", () => {
    it("should update breakpoint status to 'cancelled'", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      await backend.cancelBreakpoint(bp.id);

      const cancelled = await backend.getBreakpoint(bp.id);
      expect(cancelled.status).toBe("cancelled");
    });

    it("should update the updatedAt timestamp", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());
      const originalUpdatedAt = bp.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));
      await backend.cancelBreakpoint(bp.id);

      const cancelled = await backend.getBreakpoint(bp.id);
      expect(cancelled.updatedAt).not.toBe(originalUpdatedAt);
    });

    it("should throw for a non-existent breakpoint ID", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      await fs.mkdir(breakpointsDir, { recursive: true });

      await expect(backend.cancelBreakpoint("nonexistent")).rejects.toThrow();
    });

    it("should persist cancellation to disk", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      await backend.cancelBreakpoint(bp.id);

      // Read directly from disk
      const filePath = path.join(breakpointsDir, `${bp.id}.json`);
      const data = await readJsonFile(filePath) as Record<string, unknown>;
      expect(data.status).toBe("cancelled");
    });

    it("should not remove the breakpoint file", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      await backend.cancelBreakpoint(bp.id);

      const filePath = path.join(breakpointsDir, `${bp.id}.json`);
      expect(await fileExists(filePath)).toBe(true);
    });
  });

  // ── claimBreakpoint (optional) ──────────────────────────────────────────

  describe("claimBreakpoint()", () => {
    it("should be defined as a method (optional in the interface)", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      // claimBreakpoint is optional in the interface; if the git-native
      // backend implements it, it should update status to "claimed"
      if (typeof backend.claimBreakpoint === "function") {
        const bp = await backend.submitBreakpoint(makeSubmitParams());
        const claimed = await backend.claimBreakpoint(bp.id, "tal");

        expect(claimed.status).toBe("claimed");
      }
    });

    it("should update claimedByResponderId if implemented", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      if (typeof backend.claimBreakpoint === "function") {
        const bp = await backend.submitBreakpoint(makeSubmitParams());
        const claimed = await backend.claimBreakpoint(bp.id, "alice");

        // The spec shows claimBreakpoint takes (id, responderId)
        expect(claimed.status).toBe("claimed");
      }
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("should handle corrupted JSON files gracefully in listPendingBreakpoints", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      await fs.mkdir(breakpointsDir, { recursive: true });

      // Write some corrupted files
      await fs.writeFile(
        path.join(breakpointsDir, "bad1.json"),
        "{invalid json!",
        "utf-8",
      );
      await fs.writeFile(
        path.join(breakpointsDir, "bad2.json"),
        "",
        "utf-8",
      );

      // Should not throw, should return empty list
      const pending = await backend.listPendingBreakpoints();
      expect(pending).toEqual([]);
    });

    it("should handle JSON files that do not match schema in listPendingBreakpoints", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      await fs.mkdir(breakpointsDir, { recursive: true });

      // Write a valid JSON file that doesn't match the breakpoint schema
      await writeJsonFile(
        path.join(breakpointsDir, "not-a-breakpoint.json"),
        { foo: "bar", baz: 42 },
      );

      const pending = await backend.listPendingBreakpoints();
      expect(pending).toEqual([]);
    });

    it("should auto-create deeply nested breakpoints directory", async () => {
      const deepDir = path.join(tmpDir, "a", "b", "c", ".breakpoints");
      const backend = new GitNativeBackend({ breakpointsDir: deepDir });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      expect(bp.id).toBeTruthy();
      expect(await fileExists(path.join(deepDir, `${bp.id}.json`))).toBe(true);
    });

    it("should handle concurrent submit operations", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      const promises = Array.from({ length: 10 }, (_, i) =>
        backend.submitBreakpoint(makeSubmitParams({ text: `Question ${i}` })),
      );

      const results = await Promise.all(promises);

      // All should succeed with unique IDs
      const ids = new Set(results.map((bp) => bp.id));
      expect(ids.size).toBe(10);

      // All should be on disk
      for (const bp of results) {
        expect(await fileExists(path.join(breakpointsDir, `${bp.id}.json`))).toBe(true);
      }
    });

    it("should handle concurrent read operations", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const promises = Array.from({ length: 10 }, () =>
        backend.getBreakpoint(bp.id),
      );

      const results = await Promise.all(promises);
      for (const result of results) {
        expect(result.id).toBe(bp.id);
      }
    });

    it("should handle AbortSignal that is already aborted", async () => {
      const backend = new GitNativeBackend({
        breakpointsDir,
        pollIntervalMs: 50,
      });
      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const controller = new AbortController();
      controller.abort(); // Abort immediately before waiting

      const result = await backend.waitForAnswer(bp.id, {
        pollIntervalMs: 50,
        timeoutMs: 5_000,
        signal: controller.signal,
      });

      expect(result.answered).toBe(false);
      expect(result.resolution).toBe("aborted");
    });

    it("should handle non-JSON files in breakpoints directory", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });
      await fs.mkdir(breakpointsDir, { recursive: true });

      // Write non-JSON files
      await fs.writeFile(path.join(breakpointsDir, ".gitignore"), ".keys/private/\n", "utf-8");
      await fs.writeFile(path.join(breakpointsDir, "readme.txt"), "hello", "utf-8");

      const pending = await backend.listPendingBreakpoints();
      expect(pending).toEqual([]);
    });

    it("should handle breakpoint with rich context including code snippets", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      const context = makeContext({
        description: "Complex scenario",
        codeSnippets: [
          { filename: "app.ts", code: "const x = 1;", language: "typescript" },
          "const y = 2;",
        ],
        fileReferences: ["src/a.ts", "src/b.ts"],
        tags: ["complex", "multi-file"],
        title: "Complex Question",
        summary: "A summary of the complex question",
        markdown: "## Details\nMore info here",
        domain: "backend",
        urgency: "high",
        interactionKind: "approval",
        links: [{ label: "PR", url: "https://github.com/org/repo/pull/1" }],
        sections: [{ title: "Background", markdown: "Some background" }],
        artifacts: [{ label: "Build log", url: "https://ci.example.com/log/1", kind: "log" }],
        metadata: { customKey: "customValue" },
      });

      const bp = await backend.submitBreakpoint(makeSubmitParams({ context }));
      const retrieved = await backend.getBreakpoint(bp.id);

      expect(retrieved.context.title).toBe("Complex Question");
      expect(retrieved.context.codeSnippets).toHaveLength(2);
      expect(retrieved.context.links).toHaveLength(1);
      expect(retrieved.context.sections).toHaveLength(1);
      expect(retrieved.context.artifacts).toHaveLength(1);
      expect(retrieved.context.metadata).toEqual({ customKey: "customValue" });
    });
  });

  // ── Full Lifecycle ──────────────────────────────────────────────────────

  describe("full lifecycle", () => {
    it("should support submit -> list -> answer -> verify answered workflow", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      // 1. Submit
      const bp = await backend.submitBreakpoint(
        makeSubmitParams({ text: "Should we deploy?" }),
      );
      expect(bp.status).toBe("pending");

      // 2. List pending
      const pending = await backend.listPendingBreakpoints();
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(bp.id);

      // 3. Answer
      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes, deploy to staging first.",
        approved: true,
        confidence: 85,
      });
      expect(answer.breakpointId).toBe(bp.id);

      // 4. Verify answered
      const answered = await backend.getBreakpoint(bp.id);
      expect(answered.status).toBe("answered");
      expect(answered.answers.length).toBeGreaterThanOrEqual(1);

      // 5. No longer in pending
      const pendingAfter = await backend.listPendingBreakpoints();
      expect(pendingAfter).toHaveLength(0);
    });

    it("should support submit -> cancel workflow", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      expect(bp.status).toBe("pending");

      await backend.cancelBreakpoint(bp.id);

      const cancelled = await backend.getBreakpoint(bp.id);
      expect(cancelled.status).toBe("cancelled");

      const pending = await backend.listPendingBreakpoints();
      expect(pending).toHaveLength(0);
    });

    it("should support submit -> wait with concurrent answer", async () => {
      const backend = new GitNativeBackend({
        breakpointsDir,
        pollIntervalMs: 50,
      });

      const bp = await backend.submitBreakpoint(makeSubmitParams());

      // Answer after a short delay
      const answerPromise = new Promise<void>(async (resolve) => {
        await new Promise((r) => setTimeout(r, 150));
        await backend.answerBreakpoint(bp.id, {
          responderId: "tal",
          responderName: "Tal M",
          text: "Go ahead.",
          approved: true,
        });
        resolve();
      });

      const result = await backend.waitForAnswer(bp.id, {
        pollIntervalMs: 50,
        timeoutMs: 5_000,
      });

      await answerPromise;

      expect(result.answered).toBe(true);
      expect(result.answer!.text).toBe("Go ahead.");
    });

    it("should support multiple breakpoints with different responders", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      const bp1 = await backend.submitBreakpoint(
        makeSubmitParams({
          text: "Security review needed",
          routing: makeRouting({ targetResponders: ["alice"] }),
        }),
      );

      const bp2 = await backend.submitBreakpoint(
        makeSubmitParams({
          text: "Architecture decision needed",
          routing: makeRouting({ targetResponders: ["bob"] }),
        }),
      );

      // Alice sees her breakpoints
      const alicePending = await backend.listPendingBreakpoints("alice");
      expect(alicePending).toHaveLength(1);
      expect(alicePending[0].id).toBe(bp1.id);

      // Bob sees his breakpoints
      const bobPending = await backend.listPendingBreakpoints("bob");
      expect(bobPending).toHaveLength(1);
      expect(bobPending[0].id).toBe(bp2.id);

      // Answer both
      await backend.answerBreakpoint(bp1.id, {
        responderId: "alice",
        responderName: "Alice",
        text: "LGTM",
        approved: true,
      });
      await backend.answerBreakpoint(bp2.id, {
        responderId: "bob",
        responderName: "Bob",
        text: "Use event sourcing",
        confidence: 75,
      });

      expect((await backend.listPendingBreakpoints()).length).toBe(0);
    });
  });

  // ── Isolation ───────────────────────────────────────────────────────────

  describe("isolation", () => {
    it("should isolate data between separate backend instances with different dirs", async () => {
      const dir1 = path.join(tmpDir, "backend1");
      const dir2 = path.join(tmpDir, "backend2");

      const backend1 = new GitNativeBackend({ breakpointsDir: dir1 });
      const backend2 = new GitNativeBackend({ breakpointsDir: dir2 });

      await backend1.submitBreakpoint(makeSubmitParams({ text: "Q from backend1" }));
      await backend2.submitBreakpoint(makeSubmitParams({ text: "Q from backend2" }));

      const pending1 = await backend1.listPendingBreakpoints();
      const pending2 = await backend2.listPendingBreakpoints();

      expect(pending1).toHaveLength(1);
      expect(pending1[0].text).toBe("Q from backend1");

      expect(pending2).toHaveLength(1);
      expect(pending2[0].text).toBe("Q from backend2");
    });
  });
});
