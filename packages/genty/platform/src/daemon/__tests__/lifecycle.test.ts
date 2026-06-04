/**
 * GAP-REMOTE-001: Daemon Mode — Lifecycle TDD Red Phase
 *
 * Tests for startDaemon, stopDaemon, getDaemonStatus.
 * Covers AC-001, AC-002, AC-003, AC-007, AC-009, AC-011, AC-012, AC-013.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";

// Imports from the module under test (will fail until implementation -- that's TDD).
import { startDaemon, stopDaemon, getDaemonStatus } from "../lifecycle";
import type {
  DaemonStartOptions,
  DaemonStartOutput,
  DaemonStopOptions,
  DaemonStopOutput,
  DaemonStatusOptions,
  DaemonStatusOutput,
  DaemonConfig,
} from "../types";
import type { ApiResult } from "../../api/runs";

// -- Helpers ------------------------------------------------------------------

function tmpDir(): string {
  return path.join(os.tmpdir(), `gap-remote-001-lifecycle-${crypto.randomUUID()}`);
}

function minimalConfig(workspace: string): DaemonConfig {
  return {
    workspace,
    triggers: [],
  };
}

// -- Test Suite ---------------------------------------------------------------

describe("GAP-REMOTE-001: Daemon Lifecycle", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = tmpDir();
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  // -- AC-001: daemon:start writes PID file and daemon.json -----------------

  describe("AC-001: startDaemon writes PID file and daemon.json", () => {
    it("returns ok:true with pid, daemonDir, and startedAt", async () => {
      const daemonDir = path.join(testDir, "daemon");
      const workspace = path.join(testDir, "workspace");
      await fs.mkdir(workspace, { recursive: true });

      const result = await startDaemon({
        daemonDir,
        workspace,
        config: minimalConfig(workspace),
        foreground: true,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(typeof result.data.pid).toBe("number");
        expect(result.data.pid).toBeGreaterThan(0);
        expect(result.data.daemonDir).toBe(daemonDir);
        expect(typeof result.data.startedAt).toBe("string");
      }
    });

    it("creates a PID file in the daemon directory", async () => {
      const daemonDir = path.join(testDir, "daemon-pid");
      const workspace = path.join(testDir, "workspace");
      await fs.mkdir(workspace, { recursive: true });

      const result = await startDaemon({
        daemonDir,
        workspace,
        config: minimalConfig(workspace),
        foreground: true,
      });

      expect(result.ok).toBe(true);
      const pidFile = path.join(daemonDir, "daemon.pid");
      const pidContent = await fs.readFile(pidFile, "utf-8");
      expect(parseInt(pidContent.trim(), 10)).toBeGreaterThan(0);
    });

    it("writes daemon.json with config and metadata", async () => {
      const daemonDir = path.join(testDir, "daemon-json");
      const workspace = path.join(testDir, "workspace");
      await fs.mkdir(workspace, { recursive: true });

      const config = minimalConfig(workspace);
      config.maxConcurrentRuns = 3;

      await startDaemon({ daemonDir, workspace, config, foreground: true });

      const daemonJson = JSON.parse(
        await fs.readFile(path.join(daemonDir, "daemon.json"), "utf-8"),
      );
      expect(daemonJson.workspace).toBe(workspace);
      expect(daemonJson.maxConcurrentRuns).toBe(3);
      expect(typeof daemonJson.startedAt).toBe("string");
    });
  });

  // -- AC-002: daemon:stop sends SIGTERM and removes PID file ---------------

  describe("AC-002: stopDaemon sends SIGTERM and removes PID file", () => {
    it("returns ok:true with pid and stoppedAt after stopping", async () => {
      const daemonDir = path.join(testDir, "daemon-stop");
      const workspace = path.join(testDir, "workspace");
      await fs.mkdir(workspace, { recursive: true });

      await startDaemon({
        daemonDir,
        workspace,
        config: minimalConfig(workspace),
        foreground: true,
      });

      const result = await stopDaemon({ daemonDir });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(typeof result.data.pid).toBe("number");
        expect(typeof result.data.stoppedAt).toBe("string");
      }
    });

    it("removes the PID file after stop", async () => {
      const daemonDir = path.join(testDir, "daemon-stop-pid");
      const workspace = path.join(testDir, "workspace");
      await fs.mkdir(workspace, { recursive: true });

      await startDaemon({
        daemonDir,
        workspace,
        config: minimalConfig(workspace),
        foreground: true,
      });

      await stopDaemon({ daemonDir });

      const pidFile = path.join(daemonDir, "daemon.pid");
      await expect(fs.access(pidFile)).rejects.toThrow();
    });

    it("returns error when no daemon is running", async () => {
      const daemonDir = path.join(testDir, "daemon-not-running");
      await fs.mkdir(daemonDir, { recursive: true });

      const result = await stopDaemon({ daemonDir });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(typeof result.error.code).toBe("string");
        expect(typeof result.error.message).toBe("string");
      }
    });
  });

  // -- AC-003: daemon:status returns running/stopped state ------------------

  describe("AC-003: getDaemonStatus returns running/stopped state", () => {
    it("returns running:false when no daemon is active", async () => {
      const daemonDir = path.join(testDir, "daemon-status-none");
      await fs.mkdir(daemonDir, { recursive: true });

      const result = await getDaemonStatus({ daemonDir });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.running).toBe(false);
        expect(result.data.pid).toBeUndefined();
      }
    });

    it("returns running:true with pid and uptime when daemon is active", async () => {
      const daemonDir = path.join(testDir, "daemon-status-active");
      const workspace = path.join(testDir, "workspace");
      await fs.mkdir(workspace, { recursive: true });

      await startDaemon({
        daemonDir,
        workspace,
        config: minimalConfig(workspace),
        foreground: true,
      });

      const result = await getDaemonStatus({ daemonDir });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.running).toBe(true);
        expect(typeof result.data.pid).toBe("number");
        expect(typeof result.data.uptime).toBe("number");
        expect(result.data.uptime).toBeGreaterThanOrEqual(0);
        expect(typeof result.data.startedAt).toBe("string");
      }
    });
  });

  // -- AC-007: Stale PID detection ------------------------------------------

  describe("AC-007: stale PID detection", () => {
    it("detects stale PID file when process is not running", async () => {
      const daemonDir = path.join(testDir, "daemon-stale");
      await fs.mkdir(daemonDir, { recursive: true });

      // Write a PID file with an unlikely-to-exist PID
      const stalePid = 2147483647;
      await fs.writeFile(
        path.join(daemonDir, "daemon.pid"),
        String(stalePid),
      );
      // Also write a daemon.json so status can read metadata
      await fs.writeFile(
        path.join(daemonDir, "daemon.json"),
        JSON.stringify({
          workspace: testDir,
          startedAt: new Date().toISOString(),
          triggers: [],
        }),
      );

      const result = await getDaemonStatus({ daemonDir });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should detect the PID is stale and report not running
        expect(result.data.running).toBe(false);
      }
    });

    it("cleans up stale PID file on startDaemon", async () => {
      const daemonDir = path.join(testDir, "daemon-stale-start");
      const workspace = path.join(testDir, "workspace");
      await fs.mkdir(workspace, { recursive: true });
      await fs.mkdir(daemonDir, { recursive: true });

      // Write a stale PID
      await fs.writeFile(
        path.join(daemonDir, "daemon.pid"),
        String(2147483647),
      );

      const result = await startDaemon({
        daemonDir,
        workspace,
        config: minimalConfig(workspace),
        foreground: true,
      });

      // Should succeed despite stale PID
      expect(result.ok).toBe(true);
    });
  });

  // -- AC-009: --json flag support ------------------------------------------

  describe("AC-009: JSON-serializable output", () => {
    it("startDaemon result is JSON-serializable", async () => {
      const daemonDir = path.join(testDir, "daemon-json-out");
      const workspace = path.join(testDir, "workspace");
      await fs.mkdir(workspace, { recursive: true });

      const result = await startDaemon({
        daemonDir,
        workspace,
        config: minimalConfig(workspace),
        foreground: true,
      });

      expect(() => JSON.stringify(result)).not.toThrow();
    });

    it("getDaemonStatus result is JSON-serializable", async () => {
      const daemonDir = path.join(testDir, "daemon-json-status");
      await fs.mkdir(daemonDir, { recursive: true });

      const result = await getDaemonStatus({ daemonDir });

      expect(() => JSON.stringify(result)).not.toThrow();
    });
  });

  // -- AC-011: maxConcurrentRuns limit --------------------------------------

  describe("AC-011: maxConcurrentRuns limit", () => {
    it("respects maxConcurrentRuns from config", async () => {
      const daemonDir = path.join(testDir, "daemon-concurrent");
      const workspace = path.join(testDir, "workspace");
      await fs.mkdir(workspace, { recursive: true });

      const config: DaemonConfig = {
        workspace,
        triggers: [],
        maxConcurrentRuns: 2,
      };

      const result = await startDaemon({
        daemonDir,
        workspace,
        config,
        foreground: true,
      });

      expect(result.ok).toBe(true);

      // Verify daemon.json records the concurrency limit
      const daemonJson = JSON.parse(
        await fs.readFile(path.join(daemonDir, "daemon.json"), "utf-8"),
      );
      expect(daemonJson.maxConcurrentRuns).toBe(2);
    });
  });

  // -- AC-012: --foreground mode --------------------------------------------

  describe("AC-012: foreground mode", () => {
    it("accepts foreground:true option without forking", async () => {
      const daemonDir = path.join(testDir, "daemon-fg");
      const workspace = path.join(testDir, "workspace");
      await fs.mkdir(workspace, { recursive: true });

      const result = await startDaemon({
        daemonDir,
        workspace,
        config: minimalConfig(workspace),
        foreground: true,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // In foreground mode the PID should be the current process
        expect(result.data.pid).toBe(process.pid);
      }
    });
  });

  // -- AC-013: Graceful shutdown --------------------------------------------

  describe("AC-013: graceful shutdown", () => {
    it("accepts gracePeriodMs option for stop", async () => {
      const daemonDir = path.join(testDir, "daemon-graceful");
      const workspace = path.join(testDir, "workspace");
      await fs.mkdir(workspace, { recursive: true });

      await startDaemon({
        daemonDir,
        workspace,
        config: minimalConfig(workspace),
        foreground: true,
      });

      const result = await stopDaemon({
        daemonDir,
        gracePeriodMs: 5000,
      });

      expect(result.ok).toBe(true);
    });

    it("defaults gracePeriodMs when not specified", async () => {
      const daemonDir = path.join(testDir, "daemon-graceful-default");
      const workspace = path.join(testDir, "workspace");
      await fs.mkdir(workspace, { recursive: true });

      await startDaemon({
        daemonDir,
        workspace,
        config: minimalConfig(workspace),
        foreground: true,
      });

      // Should not hang or error with default grace period
      const result = await stopDaemon({ daemonDir });
      expect(result.ok).toBe(true);
    });
  });

  // -- Edge case: double start ----------------------------------------------

  describe("double start prevention", () => {
    it("returns error when daemon is already running", async () => {
      const daemonDir = path.join(testDir, "daemon-double");
      const workspace = path.join(testDir, "workspace");
      await fs.mkdir(workspace, { recursive: true });

      const first = await startDaemon({
        daemonDir,
        workspace,
        config: minimalConfig(workspace),
        foreground: true,
      });
      expect(first.ok).toBe(true);

      const second = await startDaemon({
        daemonDir,
        workspace,
        config: minimalConfig(workspace),
        foreground: true,
      });

      expect(second.ok).toBe(false);
      if (!second.ok) {
        expect(second.error.code).toMatch(/ALREADY_RUNNING|DAEMON_RUNNING/);
      }
    });
  });
});
