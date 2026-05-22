/**
 * @process advanced-uis-m1-runtime-hooks
 * @description Execute the next honest advanced-uis slice by landing M1 runtime-hooks task T1.1 with deterministic verification.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const implementTask = defineTask('implement-runtime-hooks-foundation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement ${args.taskId} from advanced-uis.md`,
  execution: {
    harness: 'codex',
  },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript monorepo engineer',
      task: 'Implement exactly the requested advanced-uis task in the current repository, then leave the workspace in a buildable and testable state.',
      context: {
        projectRoot: args.projectRoot,
        playbookPath: args.playbookPath,
        taskId: args.taskId,
      },
      instructions: [
        'Read the task definition for the requested taskId from advanced-uis.md before editing anything.',
        'Implement exactly that task and only the minimal glue required to keep the repository coherent.',
        'The repo layout is authoritative. If the playbook names older paths like packages/agent-mux/core/src/client/types.ts or packages/agent-mux/core/src/capabilities/types.ts, map the work onto the actual current files in this repo.',
        'For T1.1 specifically, ensure RunOptions gains optional runtime hooks support, AgentCapabilities gains runtime hook capability declarations, existing adapters declare those capability values, and core exports the new runtime-hook types.',
        'Update or add tests where they materially prove the new types/capabilities exist and are wired consistently.',
        'Do not commit or push.',
        'Return JSON with keys: { implemented: boolean, filesChanged: string[], summary: string }.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'filesChanged', 'summary'],
      properties: {
        implemented: { type: 'boolean' },
        filesChanged: {
          type: 'array',
          items: { type: 'string' },
        },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const qualityGateTask = defineTask('quality-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Quality gate: build, lint, and targeted runtime-hooks tests',
  shell: {
    command: [
      `cd "${args.projectRoot}"`,
      `npm run build`,
      `npm run lint`,
      `npx vitest run packages/agent-mux/core/tests/adapter-registry.test.ts packages/agent-mux/core/tests/capabilities.test.ts packages/agent-mux/core/tests/client-run.test.ts packages/agent-mux/core/tests/model-registry.test.ts packages/agent-mux/core/tests/plugin-manager.test.ts`,
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 30 * 60_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const repoStatusTask = defineTask('repo-status', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Summarize repo status after implementation',
  shell: {
    command: [
      `cd "${args.projectRoot}"`,
      `echo "# git status --porcelain"`,
      `git status --porcelain=v1 || true`,
      `echo "\n# git diff --stat"`,
      `git diff --stat || true`,
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 30_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('review-runtime-hooks-foundation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review completion for ${args.taskId}`,
  execution: {
    harness: 'codex',
  },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Acceptance reviewer',
      task: 'Compare the requested advanced-uis task to the changed artifacts and determine whether the task is complete.',
      context: {
        taskId: args.taskId,
        playbookPath: args.playbookPath,
        artifactSummary: args.artifactSummary,
      },
      instructions: [
        'Read the task definition for the requested taskId from advanced-uis.md.',
        'Compare that task directly against the artifact summary provided.',
        'Be strict about the task done-when statement.',
        'Return JSON with keys: { approved: boolean, findings: string[], summary: string }.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'findings', 'summary'],
      properties: {
        approved: { type: 'boolean' },
        findings: {
          type: 'array',
          items: { type: 'string' },
        },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs = {}, ctx) {
  const {
    projectRoot = 'C:/work/agent-mux',
    playbookPath = 'C:/work/agent-mux/advanced-uis.md',
    taskId = 'T1.1',
  } = inputs;

  const implementation = await ctx.task(implementTask, {
    projectRoot,
    playbookPath,
    taskId,
  });

  const qualityGate = await ctx.task(qualityGateTask, {
    projectRoot,
  });

  const repoStatus = await ctx.task(repoStatusTask, {
    projectRoot,
  });

  const review = await ctx.task(reviewTask, {
    taskId,
    playbookPath,
    artifactSummary: repoStatus.stdout,
  });

  return {
    success: implementation.implemented === true && review.approved === true,
    taskId,
    projectRoot,
    playbookPath,
    implementation,
    qualityGate: {
      exitCode: qualityGate.exitCode,
      stdout: qualityGate.stdout,
      stderr: qualityGate.stderr,
    },
    review,
  };
}
