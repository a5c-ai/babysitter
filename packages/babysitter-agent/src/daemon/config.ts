/**
 * GAP-REMOTE-001: Daemon Config — load/validate/write daemon configuration.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { ok, fail } from "../api/utils";
import type { ApiResult } from "../api/runs";
import type { DaemonConfig } from "./types";

const VALID_TRIGGER_TYPES = new Set(["file", "webhook", "timer"]);
const VALID_AUTOMATION_STATES = new Set(["draft", "active", "paused", "disabled", "archived"]);
const DEFAULT_MAX_CONCURRENT_RUNS = 4;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function validateFileTrigger(raw: unknown, index: number): string | null {
  if (!isRecord(raw)) {
    return `Trigger at index ${index} must be an object`;
  }
  if (raw.type !== "file") {
    return `Invalid trigger type at index ${index}: ${String(raw.type)}. Must be one of: file, webhook, timer`;
  }
  if (typeof raw.processId !== "string" || !raw.processId) {
    return `Missing processId at trigger index ${index}`;
  }
  if (typeof raw.entrypoint !== "string" || !raw.entrypoint) {
    return `Missing entrypoint at trigger index ${index}`;
  }
  if (typeof raw.pattern !== "string" || !raw.pattern) {
    return `Missing pattern at trigger index ${index}`;
  }

  return null;
}

function validateAutomationRule(raw: unknown, index: number): string | null {
  if (!isRecord(raw)) {
    return `Trigger at index ${index} must be an object`;
  }
  if (typeof raw.id !== "string" || !raw.id) {
    return `Missing automation rule id at trigger index ${index}`;
  }
  if (typeof raw.name !== "string" || !raw.name) {
    return `Missing automation rule name at trigger index ${index}`;
  }
  if (typeof raw.state !== "string" || !VALID_AUTOMATION_STATES.has(raw.state)) {
    return `Invalid automation state at trigger index ${index}: ${String(raw.state)}`;
  }

  const trigger = raw.trigger;
  if (!isRecord(trigger) || typeof trigger.type !== "string" || !VALID_TRIGGER_TYPES.has(trigger.type)) {
    return `Invalid automation trigger type at index ${index}: ${String(isRecord(trigger) ? trigger.type : trigger)}`;
  }
  if (trigger.type === "file") {
    return `Automation rules do not support file triggers at index ${index}`;
  }
  if (trigger.type === "timer" && (typeof trigger.cron !== "string" || !trigger.cron)) {
    return `Missing cron for timer automation at trigger index ${index}`;
  }
  if (trigger.type === "webhook") {
    if (typeof trigger.port !== "number" || trigger.port <= 0) {
      return `Missing port for webhook automation at trigger index ${index}`;
    }
    if (trigger.path !== undefined && (typeof trigger.path !== "string" || !trigger.path)) {
      return `Invalid webhook path at trigger index ${index}`;
    }
  }

  const target = raw.target;
  if (!isRecord(target) || typeof target.projectId !== "string" || !target.projectId) {
    return `Missing target.projectId at trigger index ${index}`;
  }
  if (typeof target.boardProjectId !== "string" || !target.boardProjectId) {
    return `Missing target.boardProjectId at trigger index ${index}`;
  }

  const template = raw.template;
  if (!isRecord(template) || typeof template.title !== "string" || !template.title) {
    return `Missing template.title at trigger index ${index}`;
  }

  const routing = raw.routing;
  if (!isRecord(routing)) {
    return `Missing routing block at trigger index ${index}`;
  }
  if (!isRecord(routing.issue) || routing.issue.action !== "canonical-issue-create") {
    return `Invalid routing.issue action at trigger index ${index}`;
  }
  if (!isRecord(routing.board) || routing.board.action !== "shared-board-derive") {
    return `Invalid routing.board action at trigger index ${index}`;
  }
  if (routing.mutateBoardDirectly !== false) {
    return `Automation routing must disable direct board mutation at trigger index ${index}`;
  }

  const source = raw.source;
  if (!isRecord(source) || typeof source.kind !== "string" || !source.kind) {
    return `Missing source.kind at trigger index ${index}`;
  }

  const audit = raw.audit;
  if (!isRecord(audit) || typeof audit.createdAt !== "string" || !audit.createdAt) {
    return `Missing audit.createdAt at trigger index ${index}`;
  }

  return null;
}

function validateConfig(raw: unknown): { valid: true; config: DaemonConfig } | { valid: false; error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { valid: false, error: "Config must be a JSON object" };
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.workspace !== "string" || !obj.workspace) {
    return { valid: false, error: "Missing required field: workspace" };
  }

  if (!isUnknownArray(obj.triggers)) {
    return { valid: false, error: "Missing required field: triggers (must be an array)" };
  }

  for (let i = 0; i < obj.triggers.length; i++) {
    const trigger = obj.triggers[i];
    const error = isRecord(trigger) && trigger.type === "file"
      ? validateFileTrigger(trigger, i)
      : validateAutomationRule(trigger, i);
    if (error) {
      return { valid: false, error };
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
