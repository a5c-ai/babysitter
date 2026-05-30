/**
 * GAP-SESSION-004: Session-Level Cost Tracking and Budgets.
 *
 * Aggregates cost data from runs within a session. Supports configurable
 * budgets with threshold alerts and auto-pause.
 * Uses the same atomic temp-file + rename pattern as context.ts.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionBudget {
  /** Maximum cost in USD. 0 = unlimited. */
  maxCostUsd: number;
  /** Alert threshold percentages (default: [50, 80, 100]). */
  alertThresholds: number[];
  /** Whether to auto-pause orchestration when budget exceeded. */
  autoPause: boolean;
}

export interface SessionCostState {
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  runCosts: Array<{ runId: string; costUsd: number; inputTokens: number; outputTokens: number }>;
  budget?: SessionBudget;
  triggeredThresholds: number[];
  paused: boolean;
  lastUpdatedAt: string;
}

export interface SessionBudgetAlert {
  thresholdPct: number;
  currentCostUsd: number;
  budgetUsd: number;
  currentPct: number;
  message: string;
}

export interface BudgetCheckResult {
  exceeded: boolean;
  alerts: SessionBudgetAlert[];
  shouldPause: boolean;
  pauseReason?: string;
}

export interface RunCostUpdate {
  runId: string;
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
}

export interface SessionBudgetEnforcementResult {
  costState: SessionCostState;
  budget: BudgetCheckResult;
  paused: boolean;
  pauseReason?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function emptyCostState(): SessionCostState {
  return {
    totalCostUsd: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    runCosts: [],
    triggeredThresholds: [],
    paused: false,
    lastUpdatedAt: new Date().toISOString(),
  };
}

async function readRaw(filePath: string): Promise<SessionCostState> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return emptyCostState();
    return emptyCostState();
  }
  try {
    const data = JSON.parse(raw) as Partial<SessionCostState>;
    return {
      totalCostUsd: typeof data.totalCostUsd === "number" ? data.totalCostUsd : 0,
      totalInputTokens: typeof data.totalInputTokens === "number" ? data.totalInputTokens : 0,
      totalOutputTokens: typeof data.totalOutputTokens === "number" ? data.totalOutputTokens : 0,
      runCosts: Array.isArray(data.runCosts) ? data.runCosts : [],
      budget: data.budget,
      triggeredThresholds: Array.isArray(data.triggeredThresholds) ? data.triggeredThresholds : [],
      paused: typeof data.paused === "boolean" ? data.paused : false,
      lastUpdatedAt: typeof data.lastUpdatedAt === "string" ? data.lastUpdatedAt : new Date().toISOString(),
    };
  } catch {
    return emptyCostState();
  }
}

async function writeRaw(filePath: string, data: SessionCostState): Promise<void> {
  const dir = path.dirname(filePath);
  const tempPath = `${filePath}.tmp.${process.pid}`;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tempPath, filePath);
}

async function setSessionPaused(
  stateDir: string,
  sessionId: string,
  paused: boolean,
): Promise<SessionCostState> {
  const filePath = getSessionCostPath(stateDir, sessionId);
  const data = await readRaw(filePath);
  data.paused = paused;
  data.lastUpdatedAt = new Date().toISOString();
  await writeRaw(filePath, data);
  return data;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getSessionCostPath(stateDir: string, sessionId: string): string {
  return path.join(stateDir, `${sessionId}.cost.json`);
}

export async function getSessionCost(stateDir: string, sessionId: string): Promise<SessionCostState> {
  return readRaw(getSessionCostPath(stateDir, sessionId));
}

export async function updateSessionCost(
  stateDir: string,
  sessionId: string,
  update: RunCostUpdate,
): Promise<SessionCostState> {
  const filePath = getSessionCostPath(stateDir, sessionId);
  const data = await readRaw(filePath);

  // Check for duplicate run cost entry and update or add
  const existingIdx = data.runCosts.findIndex((r) => r.runId === update.runId);
  if (existingIdx >= 0) {
    // Update existing entry (re-aggregation): subtract old, add new
    const old = data.runCosts[existingIdx];
    data.totalCostUsd += update.costUsd - old.costUsd;
    data.totalInputTokens += update.inputTokens - old.inputTokens;
    data.totalOutputTokens += update.outputTokens - old.outputTokens;
    data.runCosts[existingIdx] = {
      runId: update.runId,
      costUsd: update.costUsd,
      inputTokens: update.inputTokens,
      outputTokens: update.outputTokens,
    };
  } else {
    data.totalCostUsd += update.costUsd;
    data.totalInputTokens += update.inputTokens;
    data.totalOutputTokens += update.outputTokens;
    data.runCosts.push({
      runId: update.runId,
      costUsd: update.costUsd,
      inputTokens: update.inputTokens,
      outputTokens: update.outputTokens,
    });
  }
  data.lastUpdatedAt = new Date().toISOString();

  await writeRaw(filePath, data);
  return data;
}

export async function setSessionBudget(
  stateDir: string,
  sessionId: string,
  budget: SessionBudget,
): Promise<SessionCostState> {
  const filePath = getSessionCostPath(stateDir, sessionId);
  const data = await readRaw(filePath);
  data.budget = budget;
  data.lastUpdatedAt = new Date().toISOString();
  await writeRaw(filePath, data);
  return data;
}

/**
 * Pure function: evaluate budget thresholds against current cost.
 * Returns new alerts (excluding already-triggered thresholds).
 */
export function checkBudget(costState: SessionCostState): BudgetCheckResult {
  if (!costState.budget || costState.budget.maxCostUsd <= 0) {
    return { exceeded: false, alerts: [], shouldPause: false };
  }

  const { maxCostUsd, alertThresholds, autoPause } = costState.budget;
  const currentPct = (costState.totalCostUsd / maxCostUsd) * 100;
  const exceeded = currentPct >= 100;

  const alerts: SessionBudgetAlert[] = [];
  for (const threshold of alertThresholds) {
    if (currentPct >= threshold && !costState.triggeredThresholds.includes(threshold)) {
      alerts.push({
        thresholdPct: threshold,
        currentCostUsd: costState.totalCostUsd,
        budgetUsd: maxCostUsd,
        currentPct,
        message: `Session cost ${currentPct.toFixed(1)}% of budget ($${costState.totalCostUsd.toFixed(4)} / $${maxCostUsd.toFixed(2)})`,
      });
    }
  }

  return {
    exceeded,
    alerts,
    shouldPause: exceeded && autoPause,
    pauseReason: exceeded && autoPause
      ? `Session cost budget exceeded: $${costState.totalCostUsd.toFixed(4)} / $${maxCostUsd.toFixed(2)}`
      : undefined,
  };
}

/**
 * Persist triggered thresholds back to cost state after checkBudget produces alerts.
 * Call this after processing alerts to prevent re-triggering.
 */
export async function markThresholdsTriggered(
  stateDir: string,
  sessionId: string,
  thresholds: number[],
): Promise<void> {
  if (thresholds.length === 0) return;
  const filePath = getSessionCostPath(stateDir, sessionId);
  const data = await readRaw(filePath);
  const existing = new Set(data.triggeredThresholds);
  for (const t of thresholds) existing.add(t);
  data.triggeredThresholds = [...existing];
  data.lastUpdatedAt = new Date().toISOString();
  await writeRaw(filePath, data);
}

export async function enforceSessionBudgetForRun(
  stateDir: string,
  sessionId: string,
  update: RunCostUpdate,
): Promise<SessionBudgetEnforcementResult> {
  const updated = await updateSessionCost(stateDir, sessionId, update);
  const budget = checkBudget(updated);
  await markThresholdsTriggered(
    stateDir,
    sessionId,
    budget.alerts.map((alert) => alert.thresholdPct),
  );
  const costState = budget.shouldPause
    ? await setSessionPaused(stateDir, sessionId, true)
    : await getSessionCost(stateDir, sessionId);

  return {
    costState,
    budget,
    paused: budget.shouldPause,
    pauseReason: budget.pauseReason,
  };
}
