/**
 * GAP-REMOTE-001: Daemon Config — load/validate/write daemon configuration.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { ok, fail } from "../api/utils";
import type { ApiResult } from "../api/runs";
import type { DaemonConfig } from "./types";

const VALID_TRIGGER_TYPES = new Set(["file", "webhook", "timer"]);
const DEFAULT_MAX_CONCURRENT_RUNS = 4;

function validateConfig(raw: unknown): { valid: true; config: DaemonConfig } | { valid: false; error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { valid: false, error: "Config must be a JSON object" };
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.workspace !== "string" || !obj.workspace) {
    return { valid: false, error: "Missing required field: workspace" };
  }

  if (!Array.isArray(obj.triggers)) {
    return { valid: false, error: "Missing required field: triggers (must be an array)" };
  }

  for (let i = 0; i < obj.triggers.length; i++) {
    const t = obj.triggers[i] as Record<string, unknown>;
    if (typeof t.type !== "string" || !VALID_TRIGGER_TYPES.has(t.type)) {
      return { valid: false, error: `Invalid trigger type at index ${i}: ${String(t.type)}. Must be one of: file, webhook, timer` };
    }
    if (typeof t.processId !== "string" || !t.processId) {
      return { valid: false, error: `Missing processId at trigger index ${i}` };
    }
    if (typeof t.entrypoint !== "string" || !t.entrypoint) {
      return { valid: false, error: `Missing entrypoint at trigger index ${i}` };
    }
  }

  const maxConcurrent = typeof obj.maxConcurrentRuns === "number"
    ? obj.maxConcurrentRuns
    : DEFAULT_MAX_CONCURRENT_RUNS;

  return {
    valid: true,
    config: {
      workspace: obj.workspace,
      triggers: obj.triggers as DaemonConfig["triggers"],
      maxConcurrentRuns: maxConcurrent,
    },
  };
}

export async function loadDaemonConfig(
  configPath: string,
): Promise<ApiResult<DaemonConfig>> {
  try {
    let raw: string;
    try {
      raw = await fs.readFile(configPath, "utf-8");
    } catch {
      return fail("CONFIG_NOT_FOUND", `Config file not found: ${configPath}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return fail("INVALID_CONFIG", `Failed to parse config as JSON: ${configPath}`);
    }

    const result = validateConfig(parsed);
    if (!result.valid) {
      return fail("INVALID_CONFIG", result.error);
    }

    return ok(result.config);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}

export async function writeDaemonConfig(
  config: DaemonConfig,
  configPath: string,
): Promise<ApiResult<void>> {
  try {
    const dir = path.dirname(configPath);
    await fs.mkdir(dir, { recursive: true });

    const content = JSON.stringify(config, null, 2);
    const tmpPath = `${configPath}.tmp-${process.pid}-${Date.now()}`;

    await fs.writeFile(tmpPath, content, "utf-8");
    await fs.rename(tmpPath, configPath);

    return ok(undefined);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return fail("INTERNAL_ERROR", msg);
  }
}
