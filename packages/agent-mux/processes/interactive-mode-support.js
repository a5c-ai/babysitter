/**
 * @process agent-mux-interactive-mode-support
 * @description Spec-driven repair and verification loop for interactive harness mode, including ANSI transcript fallback when structured JSON is unavailable.
 */

import pkg from '@a5c-ai/babysitter-sdk';

const { defineTask } = pkg;

const readTodoSpecTask = defineTask('read-todo-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read interactive-mode TODO spec',
  shell: {
    command: `powershell -NoProfile -Command "Get-Content -Path '${args.todoFile}' | Select-Object -Skip ${args.todoLine - 1} -First 1"`,
    expectedExitCode: 0,
    timeout: 5000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const auditRuntimePathTask = defineTask('audit-runtime-path', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit interactive runtime call paths',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript systems engineer auditing brownfield runtime transport paths',
      task: 'Trace the real runtime path for interactive runs and identify the exact gaps preventing interactive harness support when JSON mode is unavailable.',
      context: {
        repoRoot: args.repoRoot,
        todoSpec: args.specStdout,
        targetHarnesses: args.targetHarnesses,
      },
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        'Read the repo and trace the live runtime path from user-facing entry points through gateway/core/adapters to the harness process.',
        'Focus on capability discovery, interactive transport semantics, stdin/PTY handling, ANSI/plaintext parsing fallback, and session behavior.',
        'Inspect existing files on the execution path rather than proposing greenfield abstractions.',
        'Identify the exact files that must change and the tests that should fail before implementation.',
        'Return JSON with: { runtimeCallPaths: string[], blockers: string[], targetFiles: string[], testTargets: string[], implementationPlan: string[], smokeChecks: string[] }',
        'Do not implement code in this task.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['runtimeCallPaths', 'blockers', 'targetFiles', 'testTargets', 'implementationPlan', 'smokeChecks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const authorTestsTask = defineTask('author-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author interactive-mode tests first',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior test engineer writing brownfield regression tests from spec',
      task: 'Add or update failing tests that define the required interactive-mode behavior before implementation.',
      context: {
        repoRoot: args.repoRoot,
        todoSpec: args.specStdout,
        audit: args.audit,
      },
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        'Use the audit results to place tests in the correct existing suites.',
        'Cover capability discovery, interactive transport selection, ANSI/plaintext fallback parsing when JSON mode is unavailable, and session semantics impacted by interactive mode.',
        'Prefer extending existing tests over creating redundant suites.',
        'Write the tests so they fail against the current implementation or clearly lock the missing behavior.',
        'Return JSON with: { filesModified: string[], testsAdded: string[], summary: string }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'testsAdded', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('implement-interactive-mode', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement interactive-mode support',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript systems engineer implementing interactive harness transport',
      task: 'Implement the interactive-mode fixes on the audited runtime path and satisfy the authored tests.',
      context: {
        repoRoot: args.repoRoot,
        todoSpec: args.specStdout,
        audit: args.audit,
        attempt: args.attempt,
        refinementFeedback: args.refinementFeedback ?? null,
      },
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        'Follow the audited runtime call paths and modify only files on the live execution path unless tests force an adjacent update.',
        'Make interactive mode genuinely supported, not merely declared.',
        'If a harness cannot provide structured JSON in interactive mode, add the appropriate ANSI/plaintext transcript parsing fallback rather than forcing incorrect capability claims.',
        'Align capability discovery, adapter wiring, core transport semantics, and any affected UI/gateway assumptions.',
        'Preserve session-first semantics and existing non-interactive behavior.',
        args.refinementFeedback ? `Address this refinement feedback exactly: ${args.refinementFeedback}` : 'This is the first implementation pass.',
        'Run no shell commands yourself; make the code changes and tests only.',
        'Return JSON with: { filesModified: string[], summary: string, residualRisks: string[] }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'summary', 'residualRisks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const deterministicGateTask = defineTask('deterministic-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: `Run deterministic quality gate (attempt ${args.attempt})`,
  shell: {
    command: [
      `cd "${args.repoRoot}"`,
      'npm test -- packages/agent-mux/adapters/tests/codex-adapter.test.ts packages/agent-mux/adapters/tests/claude-adapter.test.ts packages/agent-mux/core/tests/spawn-runner.test.ts packages/agent-mux/cli/tests/commands/run.test.ts packages/agent-mux/gateway/tests/e2e.test.ts',
      'npm run build',
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const smokeCheckTask = defineTask('interactive-smoke-check', (args, taskCtx) => ({
  kind: 'shell',
  title: `Run interactive smoke checks (attempt ${args.attempt})`,
  shell: {
    command: [
      `cd "${args.repoRoot}"`,
      'node packages/agent-mux/cli/dist/index.js help > NUL',
      'node packages/agent-mux/cli/dist/index.js models --help > NUL',
      'node packages/agent-mux/cli/dist/index.js gateway --help > NUL',
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const captureArtifactsTask = defineTask('capture-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Capture working-tree artifacts for review',
  shell: {
    command: [
      `cd "${args.repoRoot}"`,
      'git diff -- .',
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const adversarialReviewTask = defineTask('adversarial-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adversarial review (attempt ${args.attempt})`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Adversarial reviewer comparing spec to actual edited artifacts',
      task: 'Decide whether the implementation really provides interactive-mode support with correct semantics.',
      context: {
        todoSpec: args.specStdout,
        audit: args.audit,
        artifactDiff: args.artifactDiff,
      },
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.specStdout,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactDiff,
        '---',
        '',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Be strict about capability discovery honesty, interactive transport behavior, ANSI/plaintext fallback parsing, and verification depth.',
        'Return JSON with: { approved: boolean, score: number, findings: string[], refinementFeedback: string }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'score', 'findings', 'refinementFeedback'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const repoRoot = inputs.repoRoot ?? 'C:/work/agent-mux';
  const todoFile = inputs.todoFile ?? 'C:/work/agent-mux/todos.md';
  const todoLine = inputs.todoLine ?? 40;
  const targetHarnesses = inputs.targetHarnesses ?? ['codex', 'claude', 'claude-code', 'opencode'];
  const maxReviewLoops = inputs.maxReviewLoops ?? 3;

  ctx.log('info', 'Starting interactive-mode support process.');

  const spec = await ctx.task(readTodoSpecTask, { todoFile, todoLine });
  const specStdout = typeof spec.stdout === 'string' ? spec.stdout : '';

  const audit = await ctx.task(auditRuntimePathTask, {
    repoRoot,
    specStdout,
    targetHarnesses,
  });

  await ctx.task(authorTestsTask, {
    repoRoot,
    specStdout,
    audit,
  });

  let approved = false;
  let lastReview = null;

  for (let attempt = 1; attempt <= maxReviewLoops; attempt += 1) {
    await ctx.task(implementTask, {
      repoRoot,
      specStdout,
      audit,
      attempt,
      refinementFeedback: lastReview?.refinementFeedback ?? null,
    });

    await ctx.task(deterministicGateTask, { repoRoot, attempt });
    await ctx.task(smokeCheckTask, { repoRoot, attempt });

    const artifacts = await ctx.task(captureArtifactsTask, { repoRoot });
    const artifactDiff = typeof artifacts.stdout === 'string' ? artifacts.stdout : '';

    lastReview = await ctx.task(adversarialReviewTask, {
      specStdout,
      audit,
      artifactDiff,
      attempt,
    });

    if (lastReview.approved) {
      approved = true;
      break;
    }

    ctx.log('warn', `Interactive-mode support not approved on attempt ${attempt}. Refining.`);
  }

  if (!approved) {
    throw new Error(`Interactive-mode support did not converge after ${maxReviewLoops} attempts.`);
  }

  return {
    success: true,
    todoFile,
    todoLine,
    targetHarnesses,
    review: lastReview,
  };
}
