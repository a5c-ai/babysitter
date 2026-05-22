/**
 * Status: NOT INTEGRATED YET
 * Moved from @a5c-ai/babysitter-sdk.
 * GAP-BRK-002: Breakpoint Delegation to External Systems.
 *
 * Routes breakpoint approvals to external systems via webhooks.
 * Supports async approval workflows with configurable timeouts.
 */

import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { writeFileAtomic } from "@a5c-ai/babysitter-sdk/dist/storage/atomic";
import { parsePattern, matchPattern } from "@a5c-ai/babysitter-sdk";
import type {
  DelegationRule,
  DelegationRulesFile,
  DelegationPayload,
  DelegationSendOptions,
  DelegationResponse,
} from "./delegationTypes";
import {
  DELEGATION_RULES_SCHEMA_VERSION,
  DEFAULT_DELEGATION_TIMEOUT_MS,
} from "./delegationTypes";

function defaultDelegationRulesPath(): string {
  return path.join(os.homedir(), ".a5c", "breakpoint-delegations", "rules.json");
}

/**
 * Returns all delegation rules whose patterns match the given breakpoint.
 */
export function evaluateDelegation(
  breakpointId: string,
  tags: string[] | undefined,
  rules: DelegationRule[],
): DelegationRule[] {
  const attributes = { tags, expert: undefined };
  return rules.filter((rule) => {
    const pattern = parsePattern(rule.pattern);
    return matchPattern(pattern, breakpointId, attributes);
  });
}

/**
 * Sends breakpoint data to a webhook endpoint and returns the response.
 */
export async function sendDelegationWebhook(
  rule: DelegationRule,
  payload: DelegationPayload,
  options?: DelegationSendOptions,
): Promise<DelegationResponse> {
  const timeoutMs = options?.timeoutMs ?? rule.timeoutMs ?? DEFAULT_DELEGATION_TIMEOUT_MS;
  const method = rule.method ?? "POST";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...rule.headers,
  };

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);

  // Combine with external signal if provided
  if (options?.signal) {
    options.signal.addEventListener("abort", () => ac.abort(), { once: true });
  }

  try {
    const response = await fetch(rule.webhookUrl, {
      method,
      headers,
      body: JSON.stringify(payload),
      signal: ac.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      return {
        approved: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as Record<string, unknown>;
    return {
      approved: data.approved === true,
      respondedBy: typeof data.respondedBy === "string" ? data.respondedBy : undefined,
      responseData: data,
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      return { approved: false, timedOut: true, error: "Delegation timed out" };
    }
    return {
      approved: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Read delegation rules from file.
 */
export async function readDelegationRules(rulesPath?: string): Promise<DelegationRule[]> {
  const filePath = rulesPath ?? defaultDelegationRulesPath();
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as DelegationRulesFile;
    if (!Array.isArray(parsed.rules)) return [];
    return parsed.rules;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

/**
 * Write delegation rules atomically.
 */
export async function writeDelegationRules(
  rules: DelegationRule[],
  rulesPath?: string,
): Promise<void> {
  const filePath = rulesPath ?? defaultDelegationRulesPath();
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const data: DelegationRulesFile = {
    schemaVersion: DELEGATION_RULES_SCHEMA_VERSION,
    rules,
  };
  await writeFileAtomic(filePath, JSON.stringify(data, null, 2) + "\n");
}

/**
 * Add a delegation rule. Deduplicates by rule ID.
 */
export async function addDelegationRule(
  rule: DelegationRule,
  rulesPath?: string,
): Promise<DelegationRule[]> {
  const existing = await readDelegationRules(rulesPath);
  const filtered = existing.filter((r) => r.id !== rule.id);
  filtered.push(rule);
  await writeDelegationRules(filtered, rulesPath);
  return filtered;
}

/**
 * Remove a delegation rule by ID.
 */
export async function removeDelegationRule(
  ruleId: string,
  rulesPath?: string,
): Promise<DelegationRule[]> {
  const existing = await readDelegationRules(rulesPath);
  const filtered = existing.filter((r) => r.id !== ruleId);
  await writeDelegationRules(filtered, rulesPath);
  return filtered;
}

/**
 * List all delegation rules.
 */
export async function listDelegationRules(rulesPath?: string): Promise<DelegationRule[]> {
  return readDelegationRules(rulesPath);
}

/**
 * Send breakpoint to all matching delegates. Returns first approval/rejection (first-response-wins).
 */
export async function delegateBreakpoint(
  breakpointId: string,
  payload: DelegationPayload,
  rules: DelegationRule[],
  options?: DelegationSendOptions,
): Promise<DelegationResponse> {
  const matchingRules = evaluateDelegation(breakpointId, payload.tags, rules);
  if (matchingRules.length === 0) {
    return { approved: false, error: "No matching delegation rules" };
  }

  // First-response-wins: race all matching webhooks
  const promises = matchingRules.map((rule) =>
    sendDelegationWebhook(rule, payload, options),
  );

  const results = await Promise.allSettled(promises);

  // Return first successful (non-error) response
  for (const result of results) {
    if (result.status === "fulfilled" && !result.value.error) {
      return result.value;
    }
  }

  // All failed — return first error
  for (const result of results) {
    if (result.status === "fulfilled") {
      return result.value;
    }
  }

  return { approved: false, error: "All delegation webhooks failed" };
}
