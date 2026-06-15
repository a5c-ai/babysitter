/**
 * @process advanced-uis-full-implementation
 * @description Implement the remaining advanced-uis.md roadmap after T1.1 and T1.6 in milestone waves with explicit quality gates.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_WAVES = [
  {
    waveId: 'M1-runtime-hooks',
    milestoneId: 'M1',
    taskIds: ['T1.2', 'T1.3', 'T1.4', 'T1.5'],
    specPatterns: ['docs/21*.md'],
    verificationCommands: ['npm run build', 'npm run lint'],
  },
  {
    waveId: 'M1-gateway-core',
    milestoneId: 'M1',
    taskIds: ['T1.7', 'T1.8', 'T1.9'],
    specPatterns: ['docs/22*.md'],
    verificationCommands: ['npm run build', 'npm run lint'],
  },
  {
    waveId: 'M1-gateway-finish',
    milestoneId: 'M1',
    taskIds: ['T1.10', 'T1.11', 'T1.12', 'T1.13'],
    specPatterns: ['docs/22*.md', 'docs/23*.md'],
    verificationCommands: ['npm run build', 'npm run lint'],
  },
  {
    waveId: 'M2-ui-foundation',
    milestoneId: 'M2',
    taskIds: ['T2.1', 'T2.2', 'T2.3', 'T2.4', 'T2.5'],
    specPatterns: ['docs/23*.md'],
    verificationCommands: ['npm run build', 'npm run lint'],
  },
  {
    waveId: 'M2-ui-feature-surface',
    milestoneId: 'M2',
    taskIds: ['T2.6', 'T2.7', 'T2.8', 'T2.9'],
    specPatterns: ['docs/23*.md'],
    verificationCommands: ['npm run build', 'npm run lint'],
  },
  {
    waveId: 'M2-webui-app',
    milestoneId: 'M2',
    taskIds: ['T2.10', 'T2.11', 'T2.12', 'T2.13'],
    specPatterns: ['docs/24*.md', 'docs/22*.md'],
    verificationCommands: ['npm run build', 'npm run lint'],
  },
  {
    waveId: 'M3-ios',
    milestoneId: 'M3',
    taskIds: ['T3.1', 'T3.2', 'T3.3', 'T3.4', 'T3.5', 'T3.6', 'T3.7', 'T3.8'],
    specPatterns: ['docs/25*.md'],
    verificationCommands: ['npm run build', 'npm run lint'],
  },
  {
    waveId: 'M3-android',
    milestoneId: 'M3',
    taskIds: ['T3.9', 'T3.10', 'T3.11', 'T3.12', 'T3.13', 'T3.14', 'T3.15', 'T3.16'],
    specPatterns: ['docs/26*.md'],
    verificationCommands: ['npm run build', 'npm run lint'],
  },
  {
    waveId: 'M4-watchos-foundation',
    milestoneId: 'M4',
    taskIds: ['T4.1', 'T4.2', 'T4.3', 'T4.4', 'T4.5', 'T4.6'],
    specPatterns: ['docs/27*.md'],
    verificationCommands: ['npm run build', 'npm run lint'],
  },
  {
    waveId: 'M4-watchos-finish',
    milestoneId: 'M4',
    taskIds: ['T4.7', 'T4.8', 'T4.9', 'T4.10', 'T4.11'],
    specPatterns: ['docs/27*.md'],
    verificationCommands: ['npm run build', 'npm run lint'],
  },
  {
    waveId: 'M4-wearos-foundation',
    milestoneId: 'M4',
    taskIds: ['T4.12', 'T4.13', 'T4.14', 'T4.15', 'T4.16', 'T4.17'],
    specPatterns: ['docs/28*.md'],
    verificationCommands: ['npm run build', 'npm run lint'],
  },
  {
    waveId: 'M4-wearos-finish',
    milestoneId: 'M4',
    taskIds: ['T4.18', 'T4.19', 'T4.20'],
    specPatterns: ['docs/28*.md'],
    verificationCommands: ['npm run build', 'npm run lint'],
  },
  {
    waveId: 'M5-appletv',
    milestoneId: 'M5',
    taskIds: ['T5.1', 'T5.2', 'T5.3', 'T5.4', 'T5.5', 'T5.6', 'T5.7'],
    specPatterns: ['docs/29*.md'],
    verificationCommands: ['npm run build', 'npm run lint'],
  },
  {
    waveId: 'M5-androidtv',
    milestoneId: 'M5',
    taskIds: ['T5.8', 'T5.9', 'T5.10', 'T5.11', 'T5.12', 'T5.13', 'T5.14'],
    specPatterns: ['docs/30*.md'],
    verificationCommands: ['npm run build', 'npm run lint'],
  },
];

function resolveWorkspaceRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..');
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
  const waves = Array.isArray(inputs.waves) && inputs.waves.length > 0
    ? inputs.waves
    : DEFAULT_WAVES;

  await ctx.task(shellTask, {
    title: 'Baseline repo status before full implementation run',
    command: [
      `cd "${workspaceRoot}"`,
      'echo "# git status --porcelain"',
      'git status --porcelain=v1 || true',
      'echo "\\n# git diff --stat"',
      'git diff --stat || true',
    ].join(' && '),
    timeout: 60_000,
  });

  for (const wave of waves) {
    await ctx.task(agentTask, {
      title: `Implement ${wave.waveId}`,
      role: 'Senior TypeScript monorepo engineer',
      task: 'Implement the requested advanced-uis wave in the current repository and leave the touched surfaces coherent.',
      context: {
        workspaceRoot,
        playbookPath,
        completedTaskIds,
        waveId: wave.waveId,
        milestoneId: wave.milestoneId,
        taskIds: wave.taskIds,
        specPatterns: wave.specPatterns,
      },
      instructions: [
        'Read advanced-uis.md before editing anything.',
        'Treat advanced-uis.md as the source of truth for scope and sequencing.',
        `These tasks are already complete and must be preserved: ${completedTaskIds.join(', ')}.`,
        'If referenced numbered specs under docs/ are missing, continue using the playbook task text as the operative spec and record that in your summary.',
        'Implement only the tasks for this wave, plus minimal glue needed to keep the repository coherent.',
        'Actually edit files in the workspace. Do not return a plan.',
        'Return JSON with keys: { implementedTasks: string[], touchedFiles: string[], summary: string }.',
      ],
      outputSchema: {
        type: 'object',
        required: ['implementedTasks', 'touchedFiles', 'summary'],
        properties: {
          implementedTasks: { type: 'array', items: { type: 'string' } },
          touchedFiles: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
        },
      },
    });

    await ctx.task(shellTask, {
      title: `Quality gate for ${wave.waveId}`,
      command: `cd "${workspaceRoot}" && ${wave.verificationCommands.map((command) => `(${command})`).join(' && ')}`,
      timeout: 1_200_000,
    });
  }

  const finalStatus = await ctx.task(shellTask, {
    title: 'Capture final repo status for implementation review',
    command: [
      `cd "${workspaceRoot}"`,
      'echo "# git status --porcelain"',
      'git status --porcelain=v1 || true',
      'echo "\\n# git diff --name-only"',
      'git diff --name-only || true',
    ].join(' && '),
    timeout: 60_000,
  });

  const acceptance = await ctx.task(agentTask, {
    title: 'Final implementation review against advanced-uis roadmap',
    role: 'Acceptance reviewer',
    task: 'Compare the advanced-uis roadmap to the current repo state and report what is complete versus what remains.',
    context: {
      workspaceRoot,
      playbookPath,
      completedTaskIds,
    },
    instructions: [
      'Read advanced-uis.md and compare it directly to the current repo artifacts.',
      'Be conservative: if a task is not clearly implemented, mark it as remaining.',
      `The tasks considered already complete before this run were: ${completedTaskIds.join(', ')}.`,
      'Return JSON with keys: { completedTaskIds: string[], remainingTaskIds: string[], risks: string[], summary: string }.',
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
    finalStatus: {
      stdout: finalStatus.stdout,
      stderr: finalStatus.stderr,
      exitCode: finalStatus.exitCode,
    },
    acceptance,
  };
}
