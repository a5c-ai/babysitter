'use strict';

const fs = require('fs');
const path = require('path');

function writeEvalResult(repoRoot, result) {
  const root = repoRoot || process.cwd();
  const out = path.join(root, '.a5c', 'eval', 'latest.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(result, null, 2), 'utf8');
  return out;
}

function evaluateRun(metrics) {
  const quality = Number(metrics.quality || 0);
  const latencyMs = Number(metrics.latencyMs || 0);
  const costUsd = Number(metrics.costUsd || 0);
  const regressionPenalty = Number(metrics.regressionCount || 0) * 5;
  const score = Math.max(0, Math.min(100, quality - costUsd * 10 - latencyMs / 10000 - regressionPenalty));
  return {
    score,
    quality,
    latencyMs,
    costUsd,
    regressionCount: Number(metrics.regressionCount || 0),
    passed: score >= Number(metrics.minScore || 80),
  };
}

function compareRuns(current, baseline) {
  const costDelta = Number((current.costUsd - baseline.costUsd).toFixed(6));
  const latencyDelta = current.latencyMs - baseline.latencyMs;
  const scoreDelta = Number((current.score - baseline.score).toFixed(2));
  return {
    scoreDelta,
    latencyDelta,
    costDelta,
    regressed: scoreDelta < 0 || latencyDelta > 0 || costDelta > 0,
  };
}

module.exports = {
  writeEvalResult,
  evaluateRun,
  compareRuns,
};
