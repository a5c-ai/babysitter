/**
 * Tests for the structured run logger.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  appendRunLog,
  createRunLogger,
  formatLogLine,
  resolveLogPath,
  getDefaultLogDir,
} from "../runLogger";
import type { RunLogEntry } from "../runLogger";

describe("runLogger", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `run-logger-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Cleanup best-effort
    }
  });

  describe("formatLogLine", () => {
    it("formats a minimal log entry as JSONL", () => {
      const entry: RunLogEntry = {
        timestamp: "2026-03-31T10:00:00.000Z",
        level: "info",
        message: "hello world",
      };
      const line = formatLogLine(entry);
      const parsed = JSON.parse(line);
      expect(parsed.ts).toBe("2026-03-31T10:00:00.000Z");
      expect(parsed.level).toBe("info");
      expect(parsed.msg).toBe("hello world");
      expect(line.endsWith("\n")).toBe(true);
    });

    it("includes label when provided", () => {
      const entry: RunLogEntry = {
        timestamp: "2026-03-31T10:00:00.000Z",
        level: "info",
        label: "phase:research",
        message: "Researching...",
      };
      const parsed = JSON.parse(formatLogLine(entry));
      expect(parsed.label).toBe("phase:research");
    });

    it("includes type field when provided", () => {
      const entry: RunLogEntry = {
        timestamp: "2026-03-31T10:00:00.000Z",
        level: "info",
        type: "hook",
        message: "hook invoked",
      };
      const parsed = JSON.parse(formatLogLine(entry));
      expect(parsed.type).toBe("hook");
    });

    it("includes runId and processId when provided", () => {
      const entry: RunLogEntry = {
        timestamp: "2026-03-31T10:00:00.000Z",
        level: "warn",
        message: "watch out",
        runId: "run-001",
        processId: "proc-abc",
      };
      const parsed = JSON.parse(formatLogLine(entry));
      expect(parsed.runId).toBe("run-001");
      expect(parsed.processId).toBe("proc-abc");
    });

    it("includes source when provided", () => {
      const entry: RunLogEntry = {
        timestamp: "2026-03-31T10:00:00.000Z",
        level: "info",
        message: "test",
        source: "ctx.log",
      };
      const parsed = JSON.parse(formatLogLine(entry));
      expect(parsed.source).toBe("ctx.log");
    });

    it("includes context when provided", () => {
      const entry: RunLogEntry = {
        timestamp: "2026-03-31T10:00:00.000Z",
        level: "info",
        message: "test",
        context: { harness: "claude-code", exitCode: 0 },
      };
      const parsed = JSON.parse(formatLogLine(entry));
      expect(parsed.ctx).toEqual({ harness: "claude-code", exitCode: 0 });
    });

    it("omits empty context", () => {
      const entry: RunLogEntry = {
        timestamp: "2026-03-31T10:00:00.000Z",
        level: "info",
        message: "test",
        context: {},
      };
      const parsed = JSON.parse(formatLogLine(entry));
      expect(parsed.ctx).toBeUndefined();
    });

    it("supports all log levels", () => {
      for (const level of ["debug", "info", "warn", "error"] as const) {
        const entry: RunLogEntry = {
          timestamp: "2026-03-31T10:00:00.000Z",
          level,
          message: `${level} message`,
        };
        const parsed = JSON.parse(formatLogLine(entry));
        expect(parsed.level).toBe(level);
      }
    });
  });

  describe("resolveLogPath", () => {
    it("process type with runId → <logDir>/<runId>/process.log", () => {
      expect(resolveLogPath("/logs", "process", "run-1")).toBe(
        path.join("/logs", "run-1", "process.log"),
      );
    });

    it("hook type with runId → <logDir>/<runId>/hooks.log", () => {
      expect(resolveLogPath("/logs", "hook", "run-1")).toBe(
        path.join("/logs", "run-1", "hooks.log"),
      );
    });

    it("cli type with runId → <logDir>/<runId>/cli.log", () => {
      expect(resolveLogPath("/logs", "cli", "run-1")).toBe(
        path.join("/logs", "run-1", "cli.log"),
      );
    });

    it("process type without runId → <logDir>/process.log", () => {
      expect(resolveLogPath("/logs", "process")).toBe(
        path.join("/logs", "process.log"),
      );
    });

    it("hook type without runId → <logDir>/hooks.log", () => {
      expect(resolveLogPath("/logs", "hook")).toBe(
        path.join("/logs", "hooks.log"),
      );
    });

    it("getDefaultLogDir returns ~/.a5c/logs or BABYSITTER_LOG_DIR", () => {
      const result = getDefaultLogDir();
      if (!process.env.BABYSITTER_LOG_DIR) {
        expect(result).toBe(path.join(os.homedir(), ".a5c", "logs"));
      }
    });
  });

  describe("appendRunLog", () => {
    it("writes to process.log when type is process", async () => {
      const logPath = await appendRunLog(
        {
          timestamp: "2026-03-31T10:00:00.000Z",
          level: "info",
          type: "process",
          label: "phase:test",
          message: "test message",
          runId: "run-001",
        },
        { logDir: testDir },
      );

      expect(logPath).toBe(path.join(testDir, "run-001", "process.log"));
      const content = await fs.readFile(logPath, "utf8");
      expect(JSON.parse(content.trim()).msg).toBe("test message");
    });

    it("writes to hooks.log when type is hook", async () => {
      const logPath = await appendRunLog(
        {
          timestamp: "2026-03-31T10:00:00.000Z",
          level: "info",
          type: "hook",
          message: "hook event",
          runId: "run-002",
        },
        { logDir: testDir },
      );

      expect(logPath).toBe(path.join(testDir, "run-002", "hooks.log"));
    });

    it("writes to global hooks.log when type is hook with no runId", async () => {
      const logPath = await appendRunLog(
        {
          timestamp: "2026-03-31T10:00:00.000Z",
          level: "info",
          type: "hook",
          message: "global hook event",
        },
        { logDir: testDir },
      );

      expect(logPath).toBe(path.join(testDir, "hooks.log"));
    });

    it("defaults to process type when no type specified", async () => {
      const logPath = await appendRunLog(
        {
          timestamp: "2026-03-31T10:00:00.000Z",
          level: "info",
          message: "default type",
          runId: "run-003",
        },
        { logDir: testDir },
      );

      expect(logPath).toBe(path.join(testDir, "run-003", "process.log"));
    });

    it("appends multiple entries to the same log file", async () => {
      const entry = (msg: string): RunLogEntry => ({
        timestamp: "2026-03-31T10:00:00.000Z",
        level: "info",
        type: "process",
        message: msg,
        runId: "run-multi",
      });

      await appendRunLog(entry("first"), { logDir: testDir });
      await appendRunLog(entry("second"), { logDir: testDir });
      await appendRunLog(entry("third"), { logDir: testDir });

      const content = await fs.readFile(
        path.join(testDir, "run-multi", "process.log"),
        "utf8",
      );
      const lines = content.trim().split("\n");
      expect(lines).toHaveLength(3);
      expect(JSON.parse(lines[0]).msg).toBe("first");
      expect(JSON.parse(lines[1]).msg).toBe("second");
      expect(JSON.parse(lines[2]).msg).toBe("third");
    });

    it("creates parent directories when they don't exist", async () => {
      const deepLogDir = path.join(testDir, "deep", "nested", "logs");
      await appendRunLog(
        {
          timestamp: "2026-03-31T10:00:00.000Z",
          level: "info",
          type: "process",
          message: "deep entry",
          runId: "run-deep",
        },
        { logDir: deepLogDir },
      );

      const logPath = path.join(deepLogDir, "run-deep", "process.log");
      const content = await fs.readFile(logPath, "utf8");
      expect(JSON.parse(content.trim()).msg).toBe("deep entry");
    });
  });

  describe("createRunLogger", () => {
    it("creates a logger with bound runId and processId", async () => {
      const logger = createRunLogger({
        runId: "run-factory",
        processId: "proc-factory",
        logDir: testDir,
        source: "test",
        type: "process",
      });

      logger.info("test:label", "info message");

      await logger.flush();

      const logPath = path.join(testDir, "run-factory", "process.log");
      const content = await fs.readFile(logPath, "utf8");
      const parsed = JSON.parse(content.trim());
      expect(parsed.level).toBe("info");
      expect(parsed.type).toBe("process");
      expect(parsed.label).toBe("test:label");
      expect(parsed.msg).toBe("info message");
      expect(parsed.runId).toBe("run-factory");
      expect(parsed.processId).toBe("proc-factory");
      expect(parsed.source).toBe("test");
    });

    it("supports all log levels via convenience methods", async () => {
      const logger = createRunLogger({
        runId: "run-levels",
        logDir: testDir,
        type: "process",
      });

      logger.debug("d", "debug msg");
      logger.info("i", "info msg");
      logger.warn("w", "warn msg");
      logger.error("e", "error msg");

      await logger.flush();

      const logPath = path.join(testDir, "run-levels", "process.log");
      const content = await fs.readFile(logPath, "utf8");
      const lines = content.trim().split("\n").map((l) => JSON.parse(l));
      expect(lines).toHaveLength(4);
      const levels = new Set(lines.map((l: { level: string }) => l.level));
      expect(levels).toEqual(new Set(["debug", "info", "warn", "error"]));
    });

    it("uses hook log type when configured", async () => {
      const logger = createRunLogger({
        runId: "run-hook",
        logDir: testDir,
        source: "hook:run",
        type: "hook",
      });

      logger.info("hook:stop", "hook completed");

      await logger.flush();

      const logPath = path.join(testDir, "run-hook", "hooks.log");
      const content = await fs.readFile(logPath, "utf8");
      const parsed = JSON.parse(content.trim());
      expect(parsed.type).toBe("hook");
    });

    it("supports optional context parameter", async () => {
      const logger = createRunLogger({
        runId: "run-ctx",
        logDir: testDir,
      });

      logger.info("hook:stop", "hook completed", { exitCode: 0, harness: "claude-code" });

      await logger.flush();

      const logPath = path.join(testDir, "run-ctx", "process.log");
      const content = await fs.readFile(logPath, "utf8");
      const parsed = JSON.parse(content.trim());
      expect(parsed.ctx).toEqual({ exitCode: 0, harness: "claude-code" });
    });

    it("never throws even when logDir is invalid", () => {
      const logger = createRunLogger({
        runId: "run-invalid",
        logDir: "/nonexistent/readonly/path/that/cannot/be/created",
      });

      // Fire-and-forget — should not throw
      expect(() => logger.info("test", "should not throw")).not.toThrow();
    });
  });
});
