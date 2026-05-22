/**
 * @process agent-mux/message-queueing-steering
 * @description Brownfield implementation and verification workflow for SDK/TUI message queueing and steering.
 * @skill babysitter:plan plugins/babysitter/skills/plan/SKILL.md
 * @skill babysitter:retrospect plugins/babysitter/skills/retrospect/SKILL.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readFileTask = defineTask('read-file', (args, taskCtx) => ({
  kind: 'shell',
  title: `Read ${args.label}`,
  shell: {
    command: [
      `cd "${args.projectRoot}"`,
      `node -e "process.stdout.write(require('fs').readFileSync('${args.path.replace(/\\/g, '/')}','utf8'))"`,
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 30_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const captureRepoStateTask = defineTask('capture-repo-state', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Capture repo state and candidate implementation paths',
  shell: {
    command: [
      `cd "${args.projectRoot}"`,
      `echo "# git status --short"`,
      `git status --short || true`,
      `echo ""`,
      `echo "# message queueing / steering references"`,
      `rg -n "message queueing / steering|queueing|steering|interactive mode|stdin injection|interaction channel|tool call|agent response|turn finishes" todos.md docs packages -S || true`,
      `echo ""`,
      `echo "# queue/steer related files"`,
      `rg --files packages docs .a5c | rg "(capabilities|run-options|interaction|run-handle|session-watch|codex|claude|gemini|opencode|tui|chat|prompt|history|sessions|remote|docs/19-capabilities-matrix)" || true`,
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 60_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const planTask = defineTask('plan-queueing-steering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan live-path queueing and steering implementation',
  execution: {
    harness: 'codex',
  },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript monorepo engineer',
      task: 'Plan the brownfield implementation for message queueing and steering in agent-mux without changing scope.',
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.specVerbatim,
        capabilityMatrixVerbatim: args.capabilityMatrixVerbatim,
        repoStateVerbatim: args.repoStateVerbatim,
      },
      instructions: [
        'Read the SPEC block and treat it as the source of truth for scope.',
        'Use the repo-state block to trace the runtime call paths from user-facing entry points to the adapters/core/TUI files that need to change.',
        'Produce a brownfield plan that lists runtimeCallPaths, target files, required tests, and required docs updates.',
        'If the todo item is underspecified, prefer the smallest faithful interpretation that still delivers SDK support and any required TUI exposure.',
        'Return JSON with keys: { summary, runtimeCallPaths, targetFiles, docsFiles, testFiles, acceptanceCriteria, risks }.',
        '',
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.specVerbatim,
        '---',
        '',
        'CAPABILITY MATRIX (verbatim):',
        '---',
        args.capabilityMatrixVerbatim,
        '---',
        '',
        'REPO STATE (verbatim):',
        '---',
        args.repoStateVerbatim,
        '---',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'runtimeCallPaths', 'targetFiles', 'docsFiles', 'testFiles', 'acceptanceCriteria', 'risks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('implement-queueing-steering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement message queueing and steering (attempt ${args.attempt})`,
  execution: {
    harness: 'codex',
  },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript monorepo engineer',
      task: 'Implement message queueing and steering in the current repository, including tests and docs updates required by the spec and plan.',
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.specVerbatim,
        capabilityMatrixVerbatim: args.capabilityMatrixVerbatim,
        planJson: args.planJson,
        feedback: args.feedback ?? null,
        attempt: args.attempt,
      },
      instructions: [
        'Implement the requested scope fully in the workspace. Do not just describe the work.',
        'Modify only files on the plan runtimeCallPaths plus directly adjacent tests/docs/config required to prove the change.',
        'Preserve existing user changes outside the scoped files.',
        'Update docs if behavior or capabilities change.',
        'Add or update tests that would catch regressions in queueing/steering support.',
        'Do not commit or push.',
        'If this is a retry, address the FEEDBACK block first.',
        'Return JSON with keys: { implemented, filesChanged, testsChanged, docsChanged, summary }.',
        '',
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.specVerbatim,
        '---',
        '',
        'CAPABILITY MATRIX (verbatim):',
        '---',
        args.capabilityMatrixVerbatim,
        '---',
        '',
        'PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.planJson, null, 2),
        '---',
        '',
        'FEEDBACK (verbatim):',
        '---',
        args.feedback ?? 'none',
        '---',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'filesChanged', 'testsChanged', 'docsChanged', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const qualityGateTask = defineTask('quality-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Deterministic quality gate for queueing and steering',
  shell: {
    command: [
      `cd "${args.projectRoot}"`,
      `npm run build`,
      `npm run lint`,
      `npm test`,
      `npm run test:e2e`,
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 45 * 60_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const artifactSnapshotTask = defineTask('artifact-snapshot', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Capture artifact snapshot for acceptance review',
  shell: {
    command: [
      `cd "${args.projectRoot}"`,
      `echo "# git status --short"`,
      `git status --short || true`,
      `echo ""`,
      `echo "# git diff --stat"`,
      `git diff --stat || true`,
      `echo ""`,
      `echo "# git diff"`,
      `git diff -- packages docs package.json package-lock.json tsconfig.json .github || true`,
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 120_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('acceptance-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Acceptance review against the spec',
  execution: {
    harness: 'codex',
  },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Acceptance reviewer',
      task: 'Compare SPEC to ARTIFACTS directly and decide whether the queueing/steering work is complete.',
      context: {
        projectRoot: args.projectRoot,
      },
      instructions: [
        'Evaluate whether the implementation satisfies the todo item and remains coherent with the capability matrix intent.',
        'Be strict about missing docs, missing tests, or scope drift.',
        'Return JSON with keys: { approved, findings, summary }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specVerbatim,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsVerbatim,
        '---',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'findings', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs = {}, ctx) {
  const projectRoot = inputs.projectRoot ?? 'C:/work/agent-mux';
  const specPath = inputs.specPath ?? 'todos.md';
  const capabilityMatrixPath = inputs.capabilityMatrixPath ?? 'docs/19-capabilities-matrix.md';
  const maxAttempts = inputs.maxAttempts ?? 2;

  const specFile = await ctx.task(readFileTask, {
    projectRoot,
    path: specPath,
    label: specPath,
  });

  const capabilityMatrixFile = await ctx.task(readFileTask, {
    projectRoot,
    path: capabilityMatrixPath,
    label: capabilityMatrixPath,
  });

  const repoState = await ctx.task(captureRepoStateTask, {
    projectRoot,
  });

  const plan = await ctx.task(planTask, {
    projectRoot,
    specVerbatim: specFile.stdout,
    capabilityMatrixVerbatim: capabilityMatrixFile.stdout,
    repoStateVerbatim: repoState.stdout,
  });

  let attempt = 1;
  let implementation = null;
  let qualityGate = null;
  let artifacts = null;
  let review = null;
  let lastFeedback = null;

  while (attempt <= maxAttempts) {
    implementation = await ctx.task(implementTask, {
      projectRoot,
      specVerbatim: specFile.stdout,
      capabilityMatrixVerbatim: capabilityMatrixFile.stdout,
      planJson: plan,
      feedback: lastFeedback,
      attempt,
    });

    try {
      qualityGate = await ctx.task(qualityGateTask, { projectRoot });
    } catch (error) {
      lastFeedback = `Quality gate failed on attempt ${attempt}. Review the deterministic verification failures and fix the root cause before retrying.`;
      if (attempt === maxAttempts) {
        throw error;
      }
      attempt += 1;
      continue;
    }

    artifacts = await ctx.task(artifactSnapshotTask, { projectRoot });
    review = await ctx.task(reviewTask, {
      projectRoot,
      specVerbatim: specFile.stdout,
      artifactsVerbatim: artifacts.stdout,
    });

    if (review.approved === true) {
      return {
        success: true,
        attempts: attempt,
        plan,
        implementation,
        qualityGate: {
          exitCode: qualityGate.exitCode,
          stdout: qualityGate.stdout,
          stderr: qualityGate.stderr,
        },
        review,
      };
    }

    lastFeedback = review.summary || 'Acceptance review did not approve the result.';
    if (attempt === maxAttempts) {
      return {
        success: false,
        attempts: attempt,
        plan,
        implementation,
        qualityGate: {
          exitCode: qualityGate.exitCode,
          stdout: qualityGate.stdout,
          stderr: qualityGate.stderr,
        },
        review,
      };
    }
    attempt += 1;
  }

  return {
    success: false,
    attempts: attempt - 1,
    plan,
    implementation,
    qualityGate: qualityGate
      ? {
          exitCode: qualityGate.exitCode,
          stdout: qualityGate.stdout,
          stderr: qualityGate.stderr,
        }
      : null,
    review,
  };
}
