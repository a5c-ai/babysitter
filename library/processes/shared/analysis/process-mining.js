/**
 * @process processes/shared/analysis/process-mining
 * @description Scans .a5c/runs/*\/journal/*.json files and produces a frequency report of
 *   task ids, effect kinds, and average iteration counts. Writes a Markdown report to
 *   docs/analysis/process-mining-<date>.md. Pure node tasks — no agent.
 * @inputs { runsDir?: string, outputDir?: string, date?: string }
 * @outputs { success: boolean, reportPath: string, stats: object }
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import { join } from 'node:path';
import {
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from 'node:fs';

function listRunDirs(runsDir) {
  if (!existsSync(runsDir)) return [];
  return readdirSync(runsDir)
    .map((name) => join(runsDir, name))
    .filter((p) => {
      try {
        return statSync(p).isDirectory();
      } catch {
        return false;
      }
    });
}

function listJournalFiles(runDir) {
  const journalDir = join(runDir, 'journal');
  if (!existsSync(journalDir)) return [];
  return readdirSync(journalDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(journalDir, f));
}

const scanTask = defineTask(
  'process-mining-scan',
  async ({ runsDir }) => {
    const runDirs = listRunDirs(runsDir);
    const taskFreq = {};
    const effectKindFreq = {};
    const iterationCounts = [];
    const runsScanned = [];

    for (const runDir of runDirs) {
      const files = listJournalFiles(runDir);
      if (!files.length) continue;
      let iterationEvents = 0;
      for (const file of files) {
        let evt;
        try {
          evt = JSON.parse(readFileSync(file, 'utf8'));
        } catch {
          continue;
        }
        const type = evt?.type;
        if (type === 'EFFECT_REQUESTED') {
          iterationEvents += 1;
          const taskId = evt?.data?.taskId ?? evt?.data?.effect?.taskId ?? '(unknown)';
          const kind = evt?.data?.kind ?? evt?.data?.effect?.kind ?? '(unknown)';
          taskFreq[taskId] = (taskFreq[taskId] ?? 0) + 1;
          effectKindFreq[kind] = (effectKindFreq[kind] ?? 0) + 1;
        }
      }
      iterationCounts.push(iterationEvents);
      runsScanned.push(runDir);
    }

    const avgIterations =
      iterationCounts.length === 0
        ? 0
        : iterationCounts.reduce((a, b) => a + b, 0) / iterationCounts.length;

    return {
      runsScanned: runsScanned.length,
      taskFreq,
      effectKindFreq,
      avgIterations: Number(avgIterations.toFixed(2)),
      iterationCounts,
    };
  },
  { kind: 'node', title: 'Process-mining scan', labels: ['analysis', 'process-mining'] },
);

const reportTask = defineTask(
  'process-mining-write-report',
  async ({ reportPath, stats, runsDir }) => {
    mkdirSync(join(reportPath, '..'), { recursive: true });
    const sortedTasks = Object.entries(stats.taskFreq ?? {}).sort((a, b) => b[1] - a[1]);
    const sortedKinds = Object.entries(stats.effectKindFreq ?? {}).sort((a, b) => b[1] - a[1]);
    const lines = [];
    lines.push(`# Process Mining Report`);
    lines.push('');
    lines.push(`- Runs directory: \`${runsDir}\``);
    lines.push(`- Runs scanned: ${stats.runsScanned}`);
    lines.push(`- Average iterations per run: ${stats.avgIterations}`);
    lines.push('');
    lines.push('## Task frequency');
    lines.push('');
    lines.push('| Task ID | Count |');
    lines.push('|---------|-------|');
    for (const [id, n] of sortedTasks) lines.push(`| ${id} | ${n} |`);
    lines.push('');
    lines.push('## Effect kind frequency');
    lines.push('');
    lines.push('| Kind | Count |');
    lines.push('|------|-------|');
    for (const [k, n] of sortedKinds) lines.push(`| ${k} | ${n} |`);
    lines.push('');
    writeFileSync(reportPath, lines.join('\n'), 'utf8');
    return { written: true, path: reportPath };
  },
  { kind: 'node', title: 'Process-mining report', labels: ['analysis', 'process-mining'] },
);

function todayIso() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export async function process(inputs, ctx) {
  const {
    runsDir = '.a5c/runs',
    outputDir = 'docs/analysis',
    date,
  } = inputs ?? {};
  const d = date ?? todayIso();
  const reportPath = join(outputDir, `process-mining-${d}.md`);

  const stats = await ctx.task(scanTask, { runsDir });
  await ctx.task(reportTask, { reportPath, stats, runsDir });
  return { success: true, reportPath, stats };
}
