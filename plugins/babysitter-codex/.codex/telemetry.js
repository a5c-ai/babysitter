'use strict';

const fs = require('fs');
const path = require('path');

function telemetryPath(runDir) {
  return path.join(runDir, 'state', 'telemetry.json');
}

function telemetryHistoryPath(runDir) {
  return path.join(runDir, 'state', 'telemetry-history.jsonl');
}

function readTelemetry(runDir) {
  const p = telemetryPath(runDir);
  if (!fs.existsSync(p)) return { iterations: 0, tokens: 0, estimatedCostUsd: 0 };
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return { iterations: 0, tokens: 0, estimatedCostUsd: 0 };
  }
}

function estimateTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

function updateTelemetry(runDir, delta) {
  const current = readTelemetry(runDir);
  const now = new Date().toISOString();
  const next = {
    iterations: current.iterations + (delta.iterations || 0),
    tokens: current.tokens + (delta.tokens || 0),
    estimatedCostUsd: Number((current.estimatedCostUsd + (delta.estimatedCostUsd || 0)).toFixed(6)),
    updatedAt: now,
  };
  fs.mkdirSync(path.dirname(telemetryPath(runDir)), { recursive: true });
  fs.writeFileSync(telemetryPath(runDir), JSON.stringify(next, null, 2), 'utf8');
  const historyEntry = {
    ts: now,
    delta: {
      iterations: delta.iterations || 0,
      tokens: delta.tokens || 0,
      estimatedCostUsd: Number((delta.estimatedCostUsd || 0).toFixed(6)),
    },
    totals: next,
  };
  fs.appendFileSync(telemetryHistoryPath(runDir), JSON.stringify(historyEntry) + '\n', 'utf8');
  return next;
}

function checkBudget(runDir, budgetUsd) {
  if (!budgetUsd) return { allowed: true, ratio: null };
  const t = readTelemetry(runDir);
  const b = Number(budgetUsd);
  const ratio = b > 0 ? t.estimatedCostUsd / b : null;
  return {
    allowed: t.estimatedCostUsd <= b,
    estimatedCostUsd: t.estimatedCostUsd,
    budgetUsd: b,
    ratio,
    remainingUsd: Number((b - t.estimatedCostUsd).toFixed(6)),
  };
}

function getBudgetStatus(runDir, budgetUsd, softRatio = 0.8) {
  const status = checkBudget(runDir, budgetUsd);
  if (!budgetUsd || status.ratio === null) {
    return { ...status, phase: 'disabled' };
  }
  if (!status.allowed) {
    return { ...status, phase: 'hard-stop' };
  }
  if (status.ratio >= Number(softRatio || 0.8)) {
    return { ...status, phase: 'soft-limit' };
  }
  return { ...status, phase: 'normal' };
}

module.exports = {
  estimateTokens,
  updateTelemetry,
  readTelemetry,
  checkBudget,
  getBudgetStatus,
};
