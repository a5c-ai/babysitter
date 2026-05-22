/**
 * @process advanced-uis-foundation
 * @description Execute the first unblocking foundation wave from advanced-uis.md by scaffolding the gateway, ui, and webui packages and wiring them into the monorepo.
 * @skill react-native-dev plugins/babysitter/skills/babysit/process/specializations/mobile-development/skills/react-native-dev/SKILL.md
 * @skill zustand plugins/babysitter/skills/babysit/process/specializations/web-development/skills/zustand/SKILL.md
 * @agent react-native-expert plugins/babysitter/skills/babysit/process/specializations/mobile-development/agents/react-native-expert/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readPlaybookTask = defineTask('read-playbook', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read advanced UI playbook',
  shell: {
    command: `Get-Content -Raw "${args.playbookPath}"`,
    expectedExitCode: 0,
    timeout: 10000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const planFoundationTask = defineTask('plan-foundation-wave', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan the first unblocking foundation wave',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior monorepo architect for a TypeScript + React + React Native product line',
      task: 'Extract the first unblocking implementation wave from the playbook and turn it into a concrete scaffold plan for this repository.',
      context: {
        playbookVerbatim: args.playbookText,
        projectRoot: args.projectRoot,
      },
      instructions: [
        'Treat the PLAYBOOK block below as the source of truth.',
        'Limit the first wave to the earliest scaffolding tasks that unblock later work, without inventing extra product scope.',
        'Inspect the existing monorepo structure under the project root and align the new package skeletons to existing package conventions.',
        'Output JSON with fields: waveName, targetTasks, packages, filesToCreate, filesToModify, verificationCommands, rationale.',
        '',
        'PLAYBOOK (verbatim, do not paraphrase):',
        '---',
        args.playbookText,
        '---',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['waveName', 'targetTasks', 'packages', 'filesToCreate', 'filesToModify', 'verificationCommands', 'rationale'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementFoundationTask = defineTask('implement-foundation-wave', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement the foundation wave',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript monorepo engineer',
      task: 'Implement the planned foundation wave in the repository and leave the workspace in a buildable state.',
      context: {
        playbookVerbatim: args.playbookText,
        plan: args.plan,
        projectRoot: args.projectRoot,
      },
      instructions: [
        'Treat the PLAYBOOK block as authoritative scope.',
        'Implement only the first unblocking scaffolding wave described by the plan.',
        'Create minimal but real package skeletons for the selected packages, following existing repo conventions.',
        'Wire the new packages into root workspace and TypeScript project references as needed.',
        'Prefer ASCII and concise code; do not add speculative features beyond the scaffold.',
        'Actually edit/create the files in the repo. Do not return a plan.',
        'Return JSON with fields: filesChanged, packagesScaffolded, completedTasks, notes.',
        '',
        'PLAYBOOK (verbatim, do not paraphrase):',
        '---',
        args.playbookText,
        '---',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['filesChanged', 'packagesScaffolded', 'completedTasks', 'notes'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const buildGateTask = defineTask('build-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify the monorepo still builds',
  shell: {
    command: `npm run build`,
    expectedExitCode: 0,
    timeout: 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('review-foundation-wave', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare playbook tasks to changed artifacts',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Acceptance reviewer',
      task: 'Compare the requested foundation wave from the playbook to the changed artifacts and determine whether the scaffold landed cleanly.',
      context: {
        playbookVerbatim: args.playbookText,
        plan: args.plan,
        implementationSummary: args.implementationSummary,
        artifactSummary: args.artifactSummary,
      },
      instructions: [
        'Compare PLAYBOOK to ARTIFACTS directly. Ignore any narrative about how the artifacts were built.',
        'Focus on whether the selected unblocking tasks were completed faithfully and minimally.',
        'Return JSON with fields: approved, coveredTasks, findings, summary.',
        '',
        'PLAYBOOK (verbatim):',
        '---',
        args.playbookText,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactSummary,
        '---',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'coveredTasks', 'findings', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const {
    projectRoot = 'C:/work/agent-mux',
    playbookPath = 'C:/work/agent-mux/advanced-uis.md',
  } = inputs;

  const playbook = await ctx.task(readPlaybookTask, { playbookPath });
  const playbookText = playbook.stdout || '';

  const plan = await ctx.task(planFoundationTask, {
    projectRoot,
    playbookText,
  });

  const implementation = await ctx.task(implementFoundationTask, {
    projectRoot,
    playbookText,
    plan,
  });

  const build = await ctx.task(buildGateTask, {
    projectRoot,
  });

  const artifactSummary = JSON.stringify({
    plan,
    implementation,
    build: {
      exitCode: build.exitCode,
      stdout: build.stdout,
      stderr: build.stderr,
    },
  }, null, 2);

  const review = await ctx.task(reviewTask, {
    playbookText,
    plan,
    implementationSummary: implementation,
    artifactSummary,
  });

  return {
    success: review.approved === true,
    projectRoot,
    playbookPath,
    waveName: plan.waveName,
    targetTasks: plan.targetTasks,
    completedTasks: implementation.completedTasks,
    review,
  };
}
