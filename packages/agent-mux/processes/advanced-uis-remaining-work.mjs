/**
 * @process advanced-uis-remaining-work
 * @description Cover the remaining advanced-uis.md roadmap after the already-landed T1.1 and T1.6 slices with an explicit execution plan, baseline verification, and acceptance summary.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineTask } from '@a5c-ai/babysitter-sdk';

function resolveWorkspaceRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function expandDocPattern(workspaceRoot, pattern) {
  const docsRoot = path.join(workspaceRoot, 'docs');
  if (!fs.existsSync(docsRoot)) {
    return [];
  }

  const normalized = pattern.replace(/\\/g, '/');
  const regex = new RegExp(`^${normalized.split('*').map(escapeRegExp).join('.*')}$`, 'i');
  const out = [];
  const stack = [docsRoot];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      const relativePath = path.relative(workspaceRoot, fullPath).replace(/\\/g, '/');
      if (regex.test(relativePath)) {
        out.push(relativePath);
      }
    }
  }

  return out.sort();
}

function readResolvedSpecs(workspaceRoot, specs) {
  const missing = [];
  const resolved = [];

  for (const spec of specs ?? []) {
    const matches = expandDocPattern(workspaceRoot, spec.path);
    if (matches.length === 0) {
      missing.push(spec.path);
      continue;
    }

    for (const relativePath of matches) {
      resolved.push({
        path: relativePath,
        text: fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8'),
      });
    }
  }

  return { resolved, missing };
}

const shellTask = defineTask('shell-task', (args, taskCtx) => ({
  kind: 'shell',
  title: args.title,
  shell: {
    command: args.command,
    expectedExitCode: args.expectedExitCode ?? 0,
    timeout: args.timeout ?? 300_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const agentTask = defineTask('agent-task', (args, taskCtx) => ({
  kind: 'agent',
  title: args.title,
  execution: {
    harness: 'codex',
  },
  agent: {
    name: args.agentName ?? 'general-purpose',
    prompt: {
      role: args.role ?? 'Software engineer',
      task: args.task,
      context: args.context ?? {},
      instructions: args.instructions ?? [],
      outputFormat: args.outputFormat ?? 'JSON',
    },
    outputSchema: args.outputSchema ?? {
      type: 'object',
      additionalProperties: true,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs = {}, ctx) {
  const workspaceRoot = resolveWorkspaceRoot();
  const playbookPath = path.join(workspaceRoot, 'advanced-uis.md');
  const completedTaskIds = Array.isArray(inputs.completedTaskIds)
    ? inputs.completedTaskIds
    : ['T1.1', 'T1.6'];

  const playbook = await ctx.task(shellTask, {
    title: 'Read advanced-uis.md (source of truth)',
    command: `cd "${workspaceRoot}" && node -e "const fs=require('node:fs');process.stdout.write(fs.readFileSync('advanced-uis.md','utf8'))"`,
    timeout: 30_000,
  });

  const repoInventory = await ctx.task(shellTask, {
    title: 'Read repo inventory and current status',
    command: [
      `cd "${workspaceRoot}"`,
      'echo "# package roots"',
      'node -e "const fs=require(\'node:fs\');for (const dir of [\'packages\',\'docs\']) { console.log(`\\n## ${dir}`); if (!fs.existsSync(dir)) { console.log(\'missing\'); continue; } for (const entry of fs.readdirSync(dir,{withFileTypes:true})) { console.log(entry.name + (entry.isDirectory()?\'/\':\'\')); } }"',
      'echo "\\n# git status --porcelain"',
      'git status --porcelain=v1 || true',
      'echo "\\n# git diff --stat"',
      'git diff --stat || true',
    ].join(' && '),
    timeout: 60_000,
  });

  const baseline = await ctx.task(shellTask, {
    title: 'Baseline quality snapshot before remaining-roadmap execution',
    command: [
      `cd "${workspaceRoot}"`,
      'echo "# baseline build"',
      'npm run build || true',
      'echo "\\n# baseline lint"',
      'npm run lint || true',
      'echo "\\n# baseline test"',
      'npm test || true',
    ].join(' && '),
    timeout: 1_200_000,
  });

  const plan = await ctx.task(agentTask, {
    title: 'Plan all remaining advanced-uis roadmap work',
    role: 'Technical lead for a TypeScript monorepo',
    task: 'Produce an execution plan that covers every remaining advanced-uis task after the already completed tasks. Output strict JSON only.',
    context: {
      workspaceRoot,
      playbookPath,
      completedTaskIds,
    },
    instructions: [
      'Treat advanced-uis.md as the source of truth.',
      `Assume these tasks are already complete and must be preserved: ${completedTaskIds.join(', ')}.`,
      'Plan all remaining tasks from M1 through the end of the playbook. Do not silently drop any remaining task.',
      'Group execution into milestone waves, but keep each wave small enough to be implementable and reviewable.',
      'For each wave, include taskIds in dependency order, spec file patterns to read under docs/, and focused verification commands.',
      'If a numbered spec is missing, keep going by using advanced-uis.md as the operative spec and record that pattern in missingSpecPatterns.',
      'Assume full-repo npm test is currently noisy; choose focused verification commands that honestly cover the tasks in each wave.',
      '',
      'PLAYBOOK (verbatim):',
      '---',
      playbook.stdout,
      '---',
      '',
      'REPO SNAPSHOT (verbatim):',
      '---',
      repoInventory.stdout,
      '---',
      '',
      'BASELINE QUALITY (verbatim):',
      '---',
      baseline.stdout,
      '---',
    ],
    outputSchema: {
      type: 'object',
      required: ['completedTaskIds', 'remainingTaskIds', 'waves', 'assumptions'],
      properties: {
        completedTaskIds: { type: 'array', items: { type: 'string' } },
        remainingTaskIds: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        waves: {
          type: 'array',
          items: {
            type: 'object',
            required: ['waveId', 'milestoneId', 'taskIds', 'specPatterns', 'verificationCommands'],
            properties: {
              waveId: { type: 'string' },
              milestoneId: { type: 'string' },
              taskIds: { type: 'array', items: { type: 'string' } },
              specPatterns: { type: 'array', items: { type: 'string' } },
              missingSpecPatterns: { type: 'array', items: { type: 'string' } },
              verificationCommands: { type: 'array', items: { type: 'string' } },
              notes: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  });

  const waveSpecSummary = [];
  for (const wave of plan.waves) {
    const { resolved, missing } = readResolvedSpecs(
      workspaceRoot,
      (wave.specPatterns ?? []).map((pattern) => ({ path: pattern })),
    );
    waveSpecSummary.push({
      waveId: wave.waveId,
      milestoneId: wave.milestoneId,
      taskIds: wave.taskIds,
      resolvedSpecs: resolved.map((spec) => spec.path),
      missingSpecPatterns: missing,
      verificationCommands: wave.verificationCommands ?? [],
    });
  }

  const finalStatus = await ctx.task(shellTask, {
    title: 'Capture final repo status for roadmap acceptance review',
    command: [
      `cd "${workspaceRoot}"`,
      'echo "# git status --porcelain"',
      'git status --porcelain=v1 || true',
      'echo "\\n# git diff --name-only"',
      'git diff --name-only || true',
    ].join(' && '),
    timeout: 60_000,
  });

  const executionProgram = await ctx.task(agentTask, {
    title: 'Render remaining advanced-uis execution program',
    role: 'Program manager',
    task: 'Turn the plan into a concise execution program that covers every remaining roadmap task and calls out missing specs and baseline quality risks.',
    context: {
      workspaceRoot,
      playbookPath,
      completedTaskIds,
      waveSpecSummary,
    },
    instructions: [
      'Summarize the full remaining roadmap wave-by-wave.',
      'Do not claim implementation work that has not happened in this run.',
      'Call out missing or unresolved spec patterns explicitly.',
      'Call out any baseline build/lint/test failures that could interfere with later implementation waves.',
      'Return JSON with keys: { waveSummaries: {waveId: string, summary: string}[], risks: string[], summary: string }.',
      '',
      'PLAYBOOK (verbatim):',
      '---',
      playbook.stdout,
      '---',
      '',
      'BASELINE QUALITY (verbatim):',
      '---',
      baseline.stdout,
      '---',
    ],
    outputSchema: {
      type: 'object',
      required: ['waveSummaries', 'risks', 'summary'],
      properties: {
        waveSummaries: {
          type: 'array',
          items: {
            type: 'object',
            required: ['waveId', 'summary'],
            properties: {
              waveId: { type: 'string' },
              summary: { type: 'string' },
            },
          },
        },
        risks: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  });

  const acceptance = await ctx.task(agentTask, {
    title: 'Acceptance review for remaining advanced-uis roadmap coverage',
    role: 'Acceptance reviewer',
    task: 'Compare advanced-uis.md to the planned coverage and current repo artifacts, and report whether every remaining task is represented in the execution plan.',
    context: {
      workspaceRoot,
      playbookPath,
      completedTaskIds,
      waveSpecSummary,
    },
    instructions: [
      'This is a roadmap-coverage acceptance check, not an implementation-completion check.',
      'Confirm that every remaining playbook task after the completedTaskIds is represented in the plan.',
      'Be conservative: if you cannot confirm that a task is covered by the plan, classify it as remaining.',
      `The tasks considered already complete at run start were: ${completedTaskIds.join(', ')}.`,
      'Return JSON with keys: { completedTaskIds: string[], remainingTaskIds: string[], risks: string[], summary: string }.',
      '',
      'PLAYBOOK (verbatim):',
      '---',
      playbook.stdout,
      '---',
      '',
      'ARTIFACT SUMMARY (verbatim):',
      '---',
      finalStatus.stdout,
      '---',
      '',
      'PLANNED WAVE COVERAGE (JSON):',
      '---',
      JSON.stringify(waveSpecSummary, null, 2),
      '---',
    ],
    outputSchema: {
      type: 'object',
      required: ['completedTaskIds', 'remainingTaskIds', 'risks', 'summary'],
      properties: {
        completedTaskIds: { type: 'array', items: { type: 'string' } },
        remainingTaskIds: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  });

  return {
    ok: acceptance.remainingTaskIds.length === 0,
    workspaceRoot,
    playbookPath,
    completedTaskIds,
    plannedWaveCount: plan.waves.length,
    executionProgram,
    acceptance,
  };
}
