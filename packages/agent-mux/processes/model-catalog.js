/**
 * @process agent-mux/model-catalog
 * @description Brownfield implementation and verification workflow for unified model catalog and model configuration management.
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

const readTodoSliceTask = defineTask('read-todo-slice', (args, taskCtx) => ({
  kind: 'shell',
  title: `Read ${args.label}`,
  shell: {
    command: [
      `cd "${args.projectRoot}"`,
      `powershell -NoProfile -Command "$lines = Get-Content '${args.path}'; $start=${args.start}; $end=${args.end}; for($i=$start; $i -le $end; $i++){ if($i -le $lines.Length){ '{0,4}: {1}' -f $i,$lines[$i-1] } }"`,
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
  title: 'Capture repo state and model-catalog execution paths',
  shell: {
    command: [
      `cd "${args.projectRoot}"`,
      `echo "# git status --short"`,
      `git status --short || true`,
      `echo ""`,
      `echo "# model catalog references"`,
      `rg -n "model catalog|model configuration|provider|protocol|responses api|chat api|ollama|local model|defaultModelId|ModelRegistry|ModelCapabilities|models refresh|models list" todos.md docs packages scripts -S || true`,
      `echo ""`,
      `echo "# likely runtime call path files"`,
      `rg --files packages docs .a5c | rg "(model-registry|capabilities|adapter-registry|parse-args|commands/models|commands/config|providers|ollama|tui/.+models|docs/06-capabilities-and-models|docs/10-cli-reference|docs/12-built-in-adapters)" || true`,
      `echo ""`,
      `echo "# adapter model declarations"`,
      `rg -n "readonly models:|defaultModelId|modelAlias|inputPricePerMillion|outputPricePerMillion" packages/agent-mux/adapters/src -S || true`,
      `echo ""`,
      `echo "# oh-my-pi references already in repo"`,
      `rg -n "oh-my-pi|omp|models.yml|provider configuration|model discovery" . -S || true`,
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 90_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const captureDocsContextTask = defineTask('capture-docs-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Capture model-related spec and CLI context',
  shell: {
    command: [
      `cd "${args.projectRoot}"`,
      `echo "# docs/06-capabilities-and-models.md excerpts"`,
      `rg -n "ModelRegistry|ModelCapabilities|provider|protocol|chat|response|responses|refresh|validate|estimateCost" docs/06-capabilities-and-models.md -C 3 || true`,
      `echo ""`,
      `echo "# docs/10-cli-reference.md excerpts"`,
      `rg -n "amux capabilities|amux models|models list|models get|models refresh|config validate" docs/10-cli-reference.md -C 3 || true`,
      `echo ""`,
      `echo "# current implementation excerpts"`,
      `rg -n "models\\(|model\\(|defaultModel\\(|validate\\(|refresh\\(|refreshAll\\(|lastUpdated\\(|estimateCost\\(" packages/agent-mux/core/src/model-registry.ts packages/agent-mux/cli/src/commands/models.ts packages/agent-mux/cli/src/index.ts -C 2 || true`,
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 60_000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const planTask = defineTask('plan-model-catalog', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan model catalog and model configuration work',
  execution: {
    harness: 'codex',
  },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript monorepo engineer',
      task: 'Plan the brownfield implementation for unified model catalog and model configuration management in agent-mux without changing scope.',
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.specVerbatim,
        repoStateVerbatim: args.repoStateVerbatim,
        docsContextVerbatim: args.docsContextVerbatim,
        ohMyPiResearchHint: 'Research can1357/oh-my-pi model registry, provider configuration, model discovery, local-model support, and protocol handling for relevant ideas before finalizing the plan.',
      },
      instructions: [
        'Read the SPEC block and treat it as the source of truth for scope.',
        'Use the repo-state and docs-context blocks to trace the runtime call paths from user-facing SDK and CLI entry points to the adapters/core/TUI/docs files that need to change.',
        'Research oh-my-pi and adapter-specific model/provider handling for relevant model-catalog design references before finalizing the plan.',
        'Produce a brownfield plan that lists runtimeCallPaths, target files, docs updates, tests, and verification commands.',
        'Prefer the smallest faithful implementation that closes real gaps already present in the repository.',
        'Be explicit about how provider-specific and local-model discovery should fit without inventing unsupported adapter behavior.',
        'Return JSON with keys: { summary, runtimeCallPaths, targetFiles, docsFiles, testFiles, acceptanceCriteria, risks, verificationCommands }.',
        '',
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.specVerbatim,
        '---',
        '',
        'REPO STATE (verbatim):',
        '---',
        args.repoStateVerbatim,
        '---',
        '',
        'DOCS CONTEXT (verbatim):',
        '---',
        args.docsContextVerbatim,
        '---',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'runtimeCallPaths', 'targetFiles', 'docsFiles', 'testFiles', 'acceptanceCriteria', 'risks', 'verificationCommands'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('implement-model-catalog', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement model catalog and model configuration management (attempt ${args.attempt})`,
  execution: {
    harness: 'codex',
  },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript monorepo engineer',
      task: 'Implement the scoped model catalog and model configuration improvements in the current repository, including tests and docs updates required by the spec and plan.',
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.specVerbatim,
        docsContextVerbatim: args.docsContextVerbatim,
        planJson: args.planJson,
        feedback: args.feedback ?? null,
        attempt: args.attempt,
      },
      instructions: [
        'Implement the requested scope fully in the workspace. Do not just describe the work.',
        'Modify only files on the plan runtimeCallPaths plus directly adjacent tests/docs/config required to prove the change.',
        'Preserve existing user changes outside the scoped files.',
        'Update docs if behavior, capability discovery, or CLI behavior changes.',
        'Add or update tests that would catch regressions in model catalog, provider/model capability reporting, or model configuration behavior.',
        'Research oh-my-pi and supported harness model/provider handling where needed to close scope-faithful gaps, but keep this repository as the source of truth for shipped behavior.',
        'Do not commit or push.',
        'If this is a retry, address the FEEDBACK block first.',
        'Return JSON with keys: { implemented, filesChanged, testsChanged, docsChanged, summary }.',
        '',
        'SPEC (verbatim, do not paraphrase):',
        '---',
        args.specVerbatim,
        '---',
        '',
        'DOCS CONTEXT (verbatim):',
        '---',
        args.docsContextVerbatim,
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
  title: 'Deterministic quality gate for model catalog work',
  shell: {
    command: [
      `cd "${args.projectRoot}"`,
      `npm run build`,
      `npm run lint`,
      `npx vitest run packages/agent-mux/core/tests/model-registry.test.ts packages/agent-mux/core/tests/config-manager.test.ts packages/agent-mux/cli/tests/commands-audit.test.ts packages/agent-mux/tui/tests/info-views.test.tsx packages/agent-mux/tui/tests/models-view.test.tsx`,
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
      `echo "# git diff --stat"` ,
      `git diff --stat || true`,
      `echo ""`,
      `echo "# git diff"` ,
      `git diff -- packages docs todos.md package.json package-lock.json tsconfig.json .github || true`,
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
      task: 'Compare SPEC to ARTIFACTS directly and decide whether the model-catalog work is complete.',
      context: {
        projectRoot: args.projectRoot,
      },
      instructions: [
        'Evaluate whether the implementation satisfies the todo item and remains coherent with the existing SDK and CLI model/capability architecture.',
        'Be strict about missing docs, missing tests, fake discovery claims, or scope drift.',
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
  const maxAttempts = inputs.maxAttempts ?? 2;

  const specSlice = await ctx.task(readTodoSliceTask, {
    projectRoot,
    path: specPath,
    start: inputs.specStartLine ?? 85,
    end: inputs.specEndLine ?? 88,
    label: `${specPath}:${inputs.specStartLine ?? 85}-${inputs.specEndLine ?? 88}`,
  });

  const docs06 = await ctx.task(readFileTask, {
    projectRoot,
    path: inputs.capabilitiesDocPath ?? 'docs/06-capabilities-and-models.md',
    label: inputs.capabilitiesDocPath ?? 'docs/06-capabilities-and-models.md',
  });

  const docs10 = await ctx.task(readFileTask, {
    projectRoot,
    path: inputs.cliDocPath ?? 'docs/10-cli-reference.md',
    label: inputs.cliDocPath ?? 'docs/10-cli-reference.md',
  });

  const repoState = await ctx.task(captureRepoStateTask, {
    projectRoot,
  });

  const docsContext = await ctx.task(captureDocsContextTask, {
    projectRoot,
  });

  const plan = await ctx.task(planTask, {
    projectRoot,
    specVerbatim: specSlice.stdout,
    repoStateVerbatim: repoState.stdout,
    docsContextVerbatim: [
      docsContext.stdout,
      '',
      '# docs/06-capabilities-and-models.md',
      docs06.stdout,
      '',
      '# docs/10-cli-reference.md',
      docs10.stdout,
    ].join('\n'),
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
      specVerbatim: specSlice.stdout,
      docsContextVerbatim: [
        docsContext.stdout,
        '',
        '# docs/06-capabilities-and-models.md',
        docs06.stdout,
        '',
        '# docs/10-cli-reference.md',
        docs10.stdout,
      ].join('\n'),
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
      specVerbatim: specSlice.stdout,
      artifactsVerbatim: artifacts.stdout,
    });

    if (review.approved === true) {
      return {
        success: true,
        attempts: attempt,
        plan,
        implementation,
        qualityGate: {
          stdout: qualityGate.stdout,
          stderr: qualityGate.stderr,
        },
        review,
      };
    }

    lastFeedback = [
      `Acceptance review failed on attempt ${attempt}.`,
      review.summary ?? '',
      ...(Array.isArray(review.findings) ? review.findings : []).map((finding) =>
        typeof finding === 'string' ? finding : JSON.stringify(finding),
      ),
    ].filter(Boolean).join('\n');

    if (attempt === maxAttempts) {
      return {
        success: false,
        attempts: attempt,
        plan,
        implementation,
        qualityGate: {
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
    qualityGate,
    review,
  };
}
