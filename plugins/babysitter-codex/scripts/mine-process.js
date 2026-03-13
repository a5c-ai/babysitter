#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { mineProcess } = require('../.codex/process-mining');

function parseArgs(argv) {
  const out = {
    repoRoot: process.cwd(),
    runsDir: null,
    hooksLogPath: null,
    outJson: null,
    outMd: null,
    limit: null,
    printJson: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--repo-root' && argv[i + 1]) out.repoRoot = argv[++i];
    else if (a === '--runs-dir' && argv[i + 1]) out.runsDir = argv[++i];
    else if (a === '--hooks-log' && argv[i + 1]) out.hooksLogPath = argv[++i];
    else if (a === '--out-json' && argv[i + 1]) out.outJson = argv[++i];
    else if (a === '--out-md' && argv[i + 1]) out.outMd = argv[++i];
    else if (a === '--limit' && argv[i + 1]) out.limit = Number(argv[++i]);
    else if (a === '--json') out.printJson = true;
    else if (a === '--help' || a === '-h') out.help = true;
  }

  return out;
}

function fmt(n) {
  return typeof n === 'number' ? String(n) : '-';
}

function renderMarkdown(report) {
  const s = report.summary;
  const duration = s.effectDurations;
  const lines = [
    '# Process Mining Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Repo: ${report.repoRoot}`,
    '',
    '## Summary',
    '',
    `- Runs: ${s.totalRuns} (${s.completedRuns} completed, ${s.partialRuns} partial)`,
    `- Effects: ${s.totalEffectsRequested} requested, ${s.totalEffectsResolved} resolved`,
    `- Integrity: ${s.unresolvedEffects} unresolved, ${s.orphanResolvedEffects} orphan-resolved`,
    `- Duration (sec): min ${fmt(duration.minSec)}, p50 ${fmt(duration.p50Sec)}, p90 ${fmt(duration.p90Sec)}, avg ${fmt(duration.avgSec)}, max ${fmt(duration.maxSec)}`,
    '',
    '## Effect Kinds',
    '',
    ...Object.entries(s.effectKindCounts).map(([k, v]) => `- ${k}: ${v}`),
    '',
    '## Hook Activity',
    '',
    `- Records: ${report.hooks.count}`,
    ...Object.entries(report.hooks.byType).map(([k, v]) => `- ${k}: ${v}`),
    `- Score stats: count ${report.hooks.score.count}, min ${fmt(report.hooks.score.min)}, max ${fmt(report.hooks.score.max)}, avg ${fmt(report.hooks.score.avg)}, unique ${report.hooks.score.unique}`,
    '',
    '## Recommendations',
    '',
    ...report.recommendations.map((r) => `- ${r}`),
    '',
    '## Slowest Effects',
    '',
  ];

  if (report.topSlowEffects.length === 0) {
    lines.push('- none');
  } else {
    for (const e of report.topSlowEffects) {
      lines.push(`- run ${e.runId} | effect ${e.effectId} | kind ${e.kind} | ${fmt(e.durationSec)} sec`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: node scripts/mine-process.js [--repo-root <path>] [--runs-dir <path>] [--hooks-log <path>] [--out-json <path>] [--out-md <path>] [--limit <n>] [--json]');
    process.exit(0);
  }

  const repoRoot = path.resolve(args.repoRoot);
  const outJson = path.resolve(args.outJson || path.join(repoRoot, '.a5c', 'reports', 'process-mining-latest.json'));
  const outMd = path.resolve(args.outMd || path.join(repoRoot, '.a5c', 'reports', 'process-mining-latest.md'));
  const report = mineProcess({
    repoRoot,
    runsDir: args.runsDir ? path.resolve(args.runsDir) : undefined,
    hooksLogPath: args.hooksLogPath ? path.resolve(args.hooksLogPath) : undefined,
    limit: Number.isFinite(args.limit) && args.limit > 0 ? args.limit : undefined,
  });

  writeFile(outJson, JSON.stringify(report, null, 2));
  writeFile(outMd, renderMarkdown(report));

  if (args.printJson) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    const s = report.summary;
    console.log(`[mine:process] runs=${s.totalRuns} completed=${s.completedRuns} effects=${s.totalEffectsResolved} p90=${fmt(s.effectDurations.p90Sec)}s`);
    console.log(`[mine:process] json=${outJson}`);
    console.log(`[mine:process] md=${outMd}`);
  }
}

main();

