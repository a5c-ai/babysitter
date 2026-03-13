'use strict';

const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function inc(map, key, by = 1) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + by);
}

function toNumberMapObject(map) {
  return Object.fromEntries(Array.from(map.entries()).sort((a, b) => b[1] - a[1]));
}

function parseTs(ts) {
  const n = Date.parse(String(ts || ''));
  return Number.isFinite(n) ? n : null;
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.floor((sorted.length - 1) * p);
  return sorted[idx];
}

function round(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  return Math.round(n * 1000) / 1000;
}

function summarizeDurationsMs(values) {
  const list = values.filter((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0).sort((a, b) => a - b);
  if (list.length === 0) {
    return {
      count: 0,
      minSec: null,
      p50Sec: null,
      p90Sec: null,
      avgSec: null,
      maxSec: null,
    };
  }
  const total = list.reduce((a, b) => a + b, 0);
  return {
    count: list.length,
    minSec: round(list[0] / 1000),
    p50Sec: round(percentile(list, 0.5) / 1000),
    p90Sec: round(percentile(list, 0.9) / 1000),
    avgSec: round((total / list.length) / 1000),
    maxSec: round(list[list.length - 1] / 1000),
  };
}

function readHooks(hooksLogPath) {
  if (!fs.existsSync(hooksLogPath)) {
    return {
      count: 0,
      byType: {},
      score: { count: 0, min: null, max: null, avg: null, unique: 0 },
    };
  }

  const byType = new Map();
  const scores = [];
  const lines = fs.readFileSync(hooksLogPath, 'utf8').split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    let row = null;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    const hookType = row && row.hookType ? row.hookType : 'unknown';
    inc(byType, hookType);
    const score = row && row.payload && row.payload.score;
    if (typeof score === 'number' && Number.isFinite(score)) scores.push(score);
  }

  const unique = new Set(scores);
  const min = scores.length ? Math.min(...scores) : null;
  const max = scores.length ? Math.max(...scores) : null;
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  return {
    count: lines.length,
    byType: toNumberMapObject(byType),
    score: {
      count: scores.length,
      min: round(min),
      max: round(max),
      avg: round(avg),
      unique: unique.size,
    },
  };
}

function listRunIds(runsDir, limit) {
  if (!fs.existsSync(runsDir)) return [];
  const dirs = fs
    .readdirSync(runsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  if (typeof limit === 'number' && limit > 0) return dirs.slice(-limit);
  return dirs;
}

function loadJournalEvents(runDir) {
  const journalDir = path.join(runDir, 'journal');
  if (!fs.existsSync(journalDir)) return [];
  const files = fs.readdirSync(journalDir).filter((f) => f.endsWith('.json')).sort();
  const out = [];
  for (const file of files) {
    const event = readJson(path.join(journalDir, file));
    if (event && typeof event === 'object') out.push(event);
  }
  return out;
}

function generateRecommendations(report) {
  const recs = [];
  const s = report.summary;
  if (s.partialRuns > 0) {
    recs.push('Add explicit run-finalization checks so every run emits RUN_COMPLETED or RUN_FAILED.');
  }
  if (s.unresolvedEffects > 0 || s.orphanResolvedEffects > 0) {
    recs.push('Improve effect lifecycle correlation and alert on requested/resolved mismatches.');
  }
  if (report.hooks.score.count > 0 && report.hooks.score.unique <= 1) {
    recs.push('Replace constant score values with dimensioned scoring (quality, latency, regressions).');
  }
  if (s.effectDurationsByKind.breakpoint && s.effectDurationsByKind.breakpoint.count > 0) {
    recs.push('Measure breakpoint ROI by tagging each breakpoint with decision impact and downstream outcomes.');
  }
  if (s.effectDurations.p90Sec !== null && s.effectDurations.avgSec !== null && s.effectDurations.p90Sec > s.effectDurations.avgSec * 1.5) {
    recs.push('Split queue time vs execution time to identify tail-latency bottlenecks.');
  }
  if (recs.length === 0) recs.push('Telemetry looks consistent; next step is trend tracking across releases.');
  return recs;
}

function mineProcess(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const runsDir = path.resolve(options.runsDir || path.join(repoRoot, '.a5c', 'runs'));
  const hooksLogPath = path.resolve(options.hooksLogPath || path.join(repoRoot, '.a5c', 'logs', 'hooks.jsonl'));
  const runIds = listRunIds(runsDir, options.limit);

  const eventTypeCounts = new Map();
  const kindCounts = new Map();
  const statusCounts = new Map();
  const durationsAll = [];
  const durationsByKind = new Map();
  const slowEffects = [];
  const runs = [];

  let totalRequested = 0;
  let totalResolved = 0;
  let unresolvedEffects = 0;
  let orphanResolvedEffects = 0;
  let completedRuns = 0;

  for (const runId of runIds) {
    const runDir = path.join(runsDir, runId);
    const runMeta = readJson(path.join(runDir, 'run.json')) || {};
    const events = loadJournalEvents(runDir);
    const runCounts = new Map();
    const requestedById = new Map();
    const resolvedIds = new Set();
    let runCreatedAt = runMeta.createdAt || null;
    let runCompletedAt = null;
    let runOrphanResolved = 0;

    for (const event of events) {
      const eventType = event.type || 'UNKNOWN';
      inc(eventTypeCounts, eventType);
      inc(runCounts, eventType);

      if (eventType === 'RUN_CREATED' && event.recordedAt) runCreatedAt = event.recordedAt;
      if (eventType === 'RUN_COMPLETED' && event.recordedAt) runCompletedAt = event.recordedAt;

      if (eventType === 'EFFECT_REQUESTED') {
        const data = event.data || {};
        requestedById.set(data.effectId, {
          effectId: data.effectId,
          kind: data.kind || 'unknown',
          taskId: data.taskId || null,
          stepId: data.stepId || null,
          requestedAt: event.recordedAt || null,
        });
        inc(kindCounts, data.kind || 'unknown');
        totalRequested += 1;
      }

      if (eventType === 'EFFECT_RESOLVED') {
        const data = event.data || {};
        totalResolved += 1;
        resolvedIds.add(data.effectId);
        inc(statusCounts, data.status || 'unknown');

        const req = requestedById.get(data.effectId) || null;
        const requestedMs = parseTs(req && req.requestedAt);
        const startedMs = parseTs(data.startedAt);
        const finishedMs = parseTs(data.finishedAt);
        const recordedMs = parseTs(event.recordedAt);
        const startMs = requestedMs ?? startedMs ?? recordedMs;
        const endMs = Math.max(
          finishedMs !== null ? finishedMs : -Infinity,
          recordedMs !== null ? recordedMs : -Infinity,
        );
        let durationMs = null;
        if (startMs !== null && Number.isFinite(endMs) && endMs >= startMs) durationMs = endMs - startMs;

        if (durationMs !== null) {
          durationsAll.push(durationMs);
          const kind = (req && req.kind) || 'unknown';
          if (!durationsByKind.has(kind)) durationsByKind.set(kind, []);
          durationsByKind.get(kind).push(durationMs);
          slowEffects.push({
            runId,
            effectId: data.effectId || null,
            kind,
            status: data.status || 'unknown',
            durationSec: round(durationMs / 1000),
          });
        }

        if (!req) runOrphanResolved += 1;
      }
    }

    const unresolvedInRun = Array.from(requestedById.keys()).filter((id) => !resolvedIds.has(id)).length;
    unresolvedEffects += unresolvedInRun;
    orphanResolvedEffects += runOrphanResolved;

    if (runCompletedAt) completedRuns += 1;

    const runDurationMs = (() => {
      const start = parseTs(runCreatedAt);
      const end = parseTs(runCompletedAt);
      if (start === null || end === null || end < start) return null;
      return end - start;
    })();

    runs.push({
      runId,
      processId: runMeta.processId || null,
      createdAt: runCreatedAt,
      completedAt: runCompletedAt,
      completed: Boolean(runCompletedAt),
      durationSec: runDurationMs !== null ? round(runDurationMs / 1000) : null,
      requestedEffects: runCounts.get('EFFECT_REQUESTED') || 0,
      resolvedEffects: runCounts.get('EFFECT_RESOLVED') || 0,
      unresolvedEffects: unresolvedInRun,
      orphanResolvedEffects: runOrphanResolved,
      eventTypes: toNumberMapObject(runCounts),
    });
  }

  const hooks = readHooks(hooksLogPath);
  const durationByKindObj = {};
  for (const [kind, values] of durationsByKind.entries()) {
    durationByKindObj[kind] = summarizeDurationsMs(values);
  }
  const report = {
    generatedAt: new Date().toISOString(),
    repoRoot,
    runsDir,
    hooksLogPath,
    summary: {
      totalRuns: runs.length,
      completedRuns,
      partialRuns: runs.length - completedRuns,
      totalEffectsRequested: totalRequested,
      totalEffectsResolved: totalResolved,
      unresolvedEffects,
      orphanResolvedEffects,
      eventTypeCounts: toNumberMapObject(eventTypeCounts),
      effectKindCounts: toNumberMapObject(kindCounts),
      effectStatusCounts: toNumberMapObject(statusCounts),
      effectDurations: summarizeDurationsMs(durationsAll),
      effectDurationsByKind: durationByKindObj,
    },
    hooks,
    topSlowEffects: slowEffects
      .filter((e) => typeof e.durationSec === 'number')
      .sort((a, b) => b.durationSec - a.durationSec)
      .slice(0, 10),
    runs,
  };

  report.recommendations = generateRecommendations(report);
  return report;
}

module.exports = {
  mineProcess,
};
