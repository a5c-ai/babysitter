/**
 * GAP-REMOTE-001: Daemon Mode — Config TDD Red Phase
 *
 * Tests for loadDaemonConfig and writeDaemonConfig.
 * Covers AC-008 (config loading with validation).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";

// Imports from the module under test (will fail until implementation -- that's TDD).
import { loadDaemonConfig, writeDaemonConfig } from "../config";
import type { DaemonConfig, TriggerConfig } from "../types";
import type { ApiResult } from "../../api/runs";

// -- Helpers ------------------------------------------------------------------

function tmpDir(): string {
  return path.join(os.tmpdir(), `gap-remote-001-config-${crypto.randomUUID()}`);
}

function validConfig(): DaemonConfig {
  return {
    workspace: "/tmp/workspace",
    triggers: [
      {
        type: "file" as const,
        processId: "lint-on-save",
        entrypoint: "processes/lint.js#process",
        pattern: "src/**/*.ts",
        debounceMs: 500,
      },
    ],
    maxConcurrentRuns: 4,
  };
}

// -- Test Suite ---------------------------------------------------------------

describe("GAP-REMOTE-001: Daemon Config", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = tmpDir();
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  // -- AC-008: Config loading with validation -------------------------------

  describe("AC-008: loadDaemonConfig", () => {
    it("loads a valid config file successfully", async () => {
      const configPath = path.join(testDir, "daemon.config.json");
      const config = validConfig();
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));

      const result = await loadDaemonConfig(configPath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.workspace).toBe(config.workspace);
        expect(result.data.triggers).toHaveLength(1);
        expect(result.data.triggers[0].type).toBe("file");
        expect(result.data.maxConcurrentRuns).toBe(4);
      }
    });

    it("returns error for missing config file", async () => {
      const configPath = path.join(testDir, "nonexistent.json");

      const result = await loadDaemonConfig(configPath);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toMatch(/NOT_FOUND|CONFIG_NOT_FOUND/);
      }
    });

    it("returns error for invalid JSON", async () => {
      const configPath = path.join(testDir, "bad.json");
      await fs.writeFile(configPath, "{ not valid json!!!");

      const result = await loadDaemonConfig(configPath);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toMatch(/PARSE_ERROR|INVALID_CONFIG/);
      }
    });

    it("returns error when workspace field is missing", async () => {
      const configPath = path.join(testDir, "no-workspace.json");
      await fs.writeFile(
        configPath,
        JSON.stringify({ triggers: [] }),
      );

      const result = await loadDaemonConfig(configPath);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toMatch(/VALIDATION_ERROR|INVALID_CONFIG/);
        expect(result.error.message).toMatch(/workspace/i);
      }
    });

    it("returns error when triggers field is missing", async () => {
      const configPath = path.join(testDir, "no-triggers.json");
      await fs.writeFile(
        configPath,
        JSON.stringify({ workspace: "/tmp/ws" }),
      );

      const result = await loadDaemonConfig(configPath);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toMatch(/VALIDATION_ERROR|INVALID_CONFIG/);
        expect(result.error.message).toMatch(/triggers/i);
      }
    });

    it("returns error for trigger with invalid type", async () => {
      const configPath = path.join(testDir, "bad-trigger.json");
      await fs.writeFile(
        configPath,
        JSON.stringify({
          workspace: "/tmp/ws",
          triggers: [
            {
              type: "unknown_type",
              processId: "p",
              entrypoint: "e",
            },
          ],
        }),
      );

      const result = await loadDaemonConfig(configPath);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toMatch(/VALIDATION_ERROR|INVALID_CONFIG/);
      }
    });

    it("defaults maxConcurrentRuns when not specified", async () => {
      const configPath = path.join(testDir, "defaults.json");
      await fs.writeFile(
        configPath,
        JSON.stringify({ workspace: "/tmp/ws", triggers: [] }),
      );

      const result = await loadDaemonConfig(configPath);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should have a sensible default (e.g. 1 or some positive integer)
        expect(result.data.maxConcurrentRuns).toBeGreaterThan(0);
      }
    });
  });

  // -- writeDaemonConfig ----------------------------------------------------

  describe("writeDaemonConfig", () => {
    it("writes config to the specified path", async () => {
      const configPath = path.join(testDir, "write-test.json");
      const config = validConfig();

      const result = await writeDaemonConfig(config, configPath);

      expect(result.ok).toBe(true);

      // Verify file was written and is valid JSON
      const raw = await fs.readFile(configPath, "utf-8");
      const parsed = JSON.parse(raw);
      expect(parsed.workspace).toBe(config.workspace);
      expect(parsed.triggers).toHaveLength(1);
    });

    it("overwrites existing config atomically", async () => {
      const configPath = path.join(testDir, "overwrite.json");

      const config1 = validConfig();
      config1.maxConcurrentRuns = 1;
      await writeDaemonConfig(config1, configPath);

      const config2 = validConfig();
      config2.maxConcurrentRuns = 8;
      await writeDaemonConfig(config2, configPath);

      const raw = await fs.readFile(configPath, "utf-8");
      const parsed = JSON.parse(raw);
      expect(parsed.maxConcurrentRuns).toBe(8);
    });
  });
});
