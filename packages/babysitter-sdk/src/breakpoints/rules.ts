/**
 * Rules CRUD for breakpoint auto-approval.
 * Rules stored at ~/.a5c/breakpoint-approvals/rules.json with atomic writes.
 */

import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { writeFileAtomic } from "../storage/atomic";
import type { BreakpointRule, BreakpointRulesFile } from "./types";
import { BREAKPOINT_RULES_SCHEMA_VERSION } from "./types";

function defaultRulesPath(): string {
  return path.join(os.homedir(), ".a5c", "breakpoint-approvals", "rules.json");
}

/**
 * Read rules from the rules file. Returns empty array if file doesn't exist.
 */
export async function readRules(rulesPath?: string): Promise<BreakpointRule[]> {
  const filePath = rulesPath ?? defaultRulesPath();
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as BreakpointRulesFile;
    if (!Array.isArray(parsed.rules)) {
      return [];
    }
    return parsed.rules;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

/**
 * Write rules to the rules file atomically.
 */
export async function writeRules(rules: BreakpointRule[], rulesPath?: string): Promise<void> {
  const filePath = rulesPath ?? defaultRulesPath();
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const data: BreakpointRulesFile = {
    schemaVersion: BREAKPOINT_RULES_SCHEMA_VERSION,
    rules,
  };
  await writeFileAtomic(filePath, JSON.stringify(data, null, 2) + "\n");
}

/**
 * Add a rule. Deduplicates by rule id.
 */
export async function addRule(rule: BreakpointRule, rulesPath?: string): Promise<BreakpointRule[]> {
  const existing = await readRules(rulesPath);
  const filtered = existing.filter(r => r.id !== rule.id);
  filtered.push(rule);
  await writeRules(filtered, rulesPath);
  return filtered;
}

/**
 * Remove a rule by id. Returns the updated list.
 */
export async function removeRule(ruleId: string, rulesPath?: string): Promise<BreakpointRule[]> {
  const existing = await readRules(rulesPath);
  const filtered = existing.filter(r => r.id !== ruleId);
  await writeRules(filtered, rulesPath);
  return filtered;
}

/**
 * List all rules.
 */
export async function listRules(rulesPath?: string): Promise<BreakpointRule[]> {
  return readRules(rulesPath);
}
