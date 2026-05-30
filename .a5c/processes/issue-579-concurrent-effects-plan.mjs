/**
 * @process repo/issue-579-concurrent-effects-plan
 * @description Implementation process for issue #579: dependency-aware ConcurrentEffects within-harness dispatch.
 * @inputs { issueNumber?: number, baseBranch?: string, implementationBranch?: string, maxImplementationIterations?: number }
 * @outputs { success, context, design, tests, implementation, verification, review, delivery }
 *
 * @process cradle/feature-harness-integration-contribute
 * @process methodologies/atdd-tdd/atdd-tdd
 * @process methodologies/shared/root-cause-diagnosis
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process processes/shared/ci/idempotency-and-safe-abort
 * @process specializations/collaboration/github/branch-policies
 * @process specializations/collaboration/github/issue-linking
 * @process specializations/sdk-platform-development/sdk-testing-strategy
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const PROCESS_LIBRARY_ROOT = '/home/runner/.a5c/process-library/babysitter-repo/library';

const TARGET_FILES = [
  'docs/agent-layer-gaps.md',
  'packages/sdk/src/harness/types.ts',
  'packages/sdk/src/runtime/types.ts',
  'packages/sdk/src/runtime/orchestrateIteration.ts',
  'packages/sdk/src/runtime/intrinsics/parallel.ts',
  'packages/sdk/src/tasks/batching.ts',
  'packages/sdk/src/tasks/grouping.ts',
  'packages/sdk/src/cli/commands/runIterate.ts',
  'packages/sdk/src/cli/main/runInspection.ts',
  'packages/sdk/src/testing/runHarness.ts',
  'packages/sdk/src/testing/__tests__/parallelHarness.test.ts',
  'packages/sdk/src/tasks/__tests__/batching.test.ts',
  'packages/sdk/src/tasks/__tests__/grouping.test.ts',
  'packages/agent-platform/src/harness/internal.ts',
  'packages/agent-platform/src/harness/internal/createRun/orchestration/dispatch.ts',
  'packages/agent-platform/src/harness/internal/createRun/orchestration/effects.ts',
  'packages/agent-platform/src/harness/internal/createRun/orchestration/externalPhase.ts',
  'packages/agent-platform/src/harness/internal/createRun/orchestration/index.ts',
  'packages/agent-platform/src/harness/internal/createRun/orchestration/internalPhase.ts',
  'packages/agent-platform/src/harness/internal/createRun/orchestration/internalTools.ts',
  'packages/agent-platform/src/harness/internal/createRun/orchestration/types.ts',
  'packages/agent-platform/src/harness/internal/createRun/orchestration/__tests__/dispatch.test.ts',
  'packages/agent-platform/src/harness/internal/createRun/__tests__/createRun.test.ts',
];

const QUALITY_GATES = [
  'Concurrent dispatch is enabled only when the selected harness declares HarnessCapability.ConcurrentEffects or an equivalent selected-harness capability.',
  'Existing sequential behavior remains the default for harnesses without concurrent-effects.',
  'Only explicit ctx.parallel groups or effects proven independent by scheduler hints run concurrently; ordinary ctx.task chains remain ordered.',
  'parallelGroupId grouping is deterministic, respects executionStrategy, and never merges foreground and background semantics accidentally.',
  'maxConcurrency is enforced as an upper bound for every eligible group.',
  'Result handling is all-settled: sibling successes and sibling failures are all preserved.',
  'commitEffectResult and task:post-equivalent journal writes remain serialized per run and in deterministic action order.',
  'Mixed success/failure surfaces a deterministic error state without dropping successful sibling commits.',
  'Regression tests are no-model and require no live harness credentials.',
  'BackgroundEffects non-blocking dispatch and MultiHarnessDispatch remain follow-up scope unless a small shared helper is unavoidable and explicitly justified.',
];

const VERIFICATION_COMMANDS = [
  'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/sdk/src/testing/__tests__/parallelHarness.test.ts packages/sdk/src/tasks/__tests__/grouping.test.ts packages/sdk/src/tasks/__tests__/batching.test.ts',
  'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/agent-platform/src/harness/internal/createRun/orchestration/__tests__/dispatch.test.ts packages/agent-platform/src/harness/internal/createRun/__tests__/createRun.test.ts',
  'npm run build:sdk',
  'npm run build --workspace=@a5c-ai/agent-platform',
  'npm run test:sdk',
  'npm run test --workspace=@a5c-ai/agent-platform',
  'npm run verify:metadata',
  'git diff --check',
];

const readContextTask = defineTask('issue-579.read-context-and-reuse-audit', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #579, code context, and reuse-audit findings',
  labels: ['issue-579', 'context', 'reuse-audit', 'sdk', 'agent-platform'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- pr check ---\\n"',
      `gh pr view ${args.issueNumber} --json files,title,body,comments 2>/dev/null || true`,
      'printf "\\n--- Reuse-audit findings (REVIEW BEFORE PROCEEDING) ---\\n"',
      'printf "Keywords: ConcurrentEffects, parallel effect dispatch, dependency graph, effect ordering, result aggregation, BackgroundEffects, MultiHarnessDispatch, ctx.parallel, parallelGroupId, maxConcurrency, commitEffectResult, task:post.\\n"',
      'printf "\\nExisting migrations/routes/env vars/SDK deps/imports matching keywords:\\n"',
      'rg -n "ConcurrentEffects|BackgroundEffects|MultiHarnessDispatch|ctx\\.parallel|parallelGroupId|maxConcurrency|schedulerHints|parallelGroups|commitEffectResult|task:post|resolveEffectWithRetry|dispatchEffectActions|effect executor|dependency graph|allSettled|all-settled" packages docs .a5c/processes library -g "*.ts" -g "*.tsx" -g "*.js" -g "*.mjs" -g "*.md" -g "*.json" | head -700 || true',
      'printf "\\n--- active process library matches ---\\n"',
      `find ${PROCESS_LIBRARY_ROOT} -maxdepth 4 -type f | sed 's#^${PROCESS_LIBRARY_ROOT}/##' | sort | rg -i "sdk|runtime|orchestrat|harness|tdd|quality|github|issue|parallel|concurrent|integration" | head -250 || true`,
      'printf "\\n--- selected process-library references ---\\n"',
      `sed -n "1,220p" ${PROCESS_LIBRARY_ROOT}/cradle/feature-harness-integration-contribute.js`,
      `sed -n "1,180p" ${PROCESS_LIBRARY_ROOT}/methodologies/atdd-tdd/atdd-tdd.js`,
      `sed -n "1,220p" ${PROCESS_LIBRARY_ROOT}/specializations/sdk-platform-development/sdk-testing-strategy.js`,
      'printf "\\n--- docs/agent-layer-gaps.md ---\\n"',
      'sed -n "1,260p" docs/agent-layer-gaps.md',
      'printf "\\n--- target source excerpts ---\\n"',
      `for file in ${args.targetFiles.map((file) => `'${file.replace(/'/g, "'\\''")}'`).join(' ')}; do if test -f "$file"; then printf "\\n### %s\\n" "$file"; sed -n "1,260p" "$file"; else printf "\\n### missing: %s\\n" "$file"; fi; done`,
      'printf "\\n--- package scripts ---\\n"',
      'node -e "const p=require(\'./package.json\'); console.log(JSON.stringify({scripts:p.scripts, workspaces:p.workspaces}, null, 2))"',
      'printf "\\n--- git status ---\\n"',
      'git status --short --branch',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const designTask = defineTask('issue-579.design-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design ConcurrentEffects execution contract',
  labels: ['issue-579', 'design', 'runtime-contract'],
  agent: {
    name: 'concurrent-effects-runtime-architect',
    prompt: {
      role: 'principal TypeScript runtime architect',
      task: 'Produce the issue #579 implementation contract from the runtime-read issue and code context.',
      instructions: [
        'SPEC AND CONTEXT (verbatim, do not paraphrase):',
        '---',
        args.contextStdout,
        '---',
        'Do not edit files in this phase.',
        'Trace the runtime call paths from process ctx.parallel collection through run:iterate, pending effects, harness effect resolution, and commitEffectResult/task:post.',
        'Classify the current branch as missing, partially implemented, or already implemented for each quality gate below.',
        JSON.stringify(args.qualityGates, null, 2),
        'Define the dependency-aware execution model, selected-harness capability gate, maxConcurrency semantics, all-settled aggregation, serialized commit ordering, retry behavior, cancellation cleanup, and progress/reporting behavior.',
        'Keep BackgroundEffects non-blocking dispatch and MultiHarnessDispatch out of scope. If a helper touches their metadata, explain why it is not expanding scope.',
        'Return JSON: { currentStatus: string, alreadyComplete: boolean, runtimeCallPaths: string[], affectedFiles: string[], architecture: string, implementationPhases: string[], testsToAuthorFirst: string[], qualityGates: string[], outOfScope: string[], risks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const authorTestsTask = defineTask('issue-579.author-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author ConcurrentEffects regression tests before implementation',
  labels: ['issue-579', 'tests', 'tdd'],
  agent: {
    name: 'concurrent-effects-contract-test-engineer',
    prompt: {
      role: 'senior test engineer for deterministic event-sourced orchestration',
      task: 'Author no-model regression tests for the issue #579 contract before implementation changes.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'IMPLEMENTATION CONTRACT (verbatim):',
        '---',
        JSON.stringify(args.design, null, 2),
        '---',
        'Author tests strictly from the spec/context and contract above. Avoid reading unrelated implementation directories beyond the target files named in the context.',
        'Edit only focused test files and narrowly necessary fixtures.',
        'Cover: capability-gated sequential fallback, explicit parallelGroupId dispatch, maxConcurrency limiting, deterministic commit order, all-settled mixed success/failure aggregation, thrown resolver conversion to error result, ordinary ctx.task ordering, BackgroundEffects remaining non-blocking-dispatch out of scope, CLI run:iterate capability propagation.',
        'Use fake resolvers, fake harness discovery, and existing SDK test harness helpers. Do not require external agent credentials or sleeps that make tests flaky.',
        'Return JSON: { changedFiles: string[], testsAdded: string[], expectedInitialFailures: string[], verificationCommands: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementSdkTask = defineTask('issue-579.implement-sdk', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement SDK scheduler and CLI surfaces',
  labels: ['issue-579', 'implementation', 'sdk'],
  agent: {
    name: 'sdk-concurrent-effects-implementer',
    prompt: {
      role: 'senior Babysitter SDK maintainer',
      task: 'Implement the SDK side of issue #579.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'IMPLEMENTATION CONTRACT:',
        JSON.stringify(args.design, null, 2),
        'TESTS AUTHORED FIRST:',
        JSON.stringify(args.tests, null, 2),
        'Edit the repository directly and keep changes issue-scoped.',
        'Preserve existing ctx.parallel collection behavior while strengthening scheduler hints only where the contract requires it.',
        'Pass harness capabilities consistently through run:iterate and CLI inspection so parallelGroups/concurrent-effects metadata is visible across repeated iterations.',
        'Do not implement BackgroundEffects non-blocking dispatch or MultiHarnessDispatch.',
        'Return JSON: { changedFiles: string[], summary: string, contractsAdded: string[], compatibilityNotes: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementHarnessTask = defineTask('issue-579.implement-harness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement agent-platform concurrent effect dispatch',
  labels: ['issue-579', 'implementation', 'agent-platform', 'harness'],
  agent: {
    name: 'agent-platform-concurrent-effects-implementer',
    prompt: {
      role: 'senior agent-platform harness maintainer',
      task: 'Implement bounded within-harness concurrent effect dispatch for issue #579.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'IMPLEMENTATION CONTRACT:',
        JSON.stringify(args.design, null, 2),
        'SDK IMPLEMENTATION SUMMARY:',
        JSON.stringify(args.sdkImplementation, null, 2),
        'Edit the repository directly and keep changes issue-scoped.',
        'Resolve eligible grouped pending effects concurrently only when selected-harness capability allows it.',
        'Reuse existing effect resolution and retry helpers. Use all-settled style aggregation and then serialize commitEffectResult calls in deterministic action order.',
        'Respect maxConcurrency, isolate foreground/background semantics, and preserve existing sequential loops when the capability is absent.',
        'Clean up worker sessions/subscriptions on success, failure, and cancellation.',
        'Do not broaden scope to BackgroundEffects non-blocking dispatch or MultiHarnessDispatch.',
        'Return JSON: { changedFiles: string[], summary: string, schedulingBehavior: string, failureBehavior: string, cleanupBehavior: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyCommandTask = defineTask('issue-579.verify-command', (args, taskCtx) => ({
  kind: 'shell',
  title: `Verify issue #579: ${args.name}`,
  labels: ['issue-579', 'verification', 'quality-gate'],
  shell: {
    command: args.command,
    expectedExitCode: 0,
    timeout: args.timeout ?? 600000,
  },
  expectedExitCode: 0,
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-579.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review ConcurrentEffects implementation against issue #579',
  labels: ['issue-579', 'review', 'quality-gate'],
  agent: {
    name: 'concurrent-effects-reviewer',
    prompt: {
      role: 'principal SDK and harness reviewer',
      task: 'Perform a code-review style final assessment of issue #579.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'DESIGN:',
        JSON.stringify(args.design, null, 2),
        'IMPLEMENTATION:',
        JSON.stringify(args.implementation, null, 2),
        'VERIFICATION OUTPUTS:',
        JSON.stringify(args.verification, null, 2),
        'Review findings first, ordered by severity, with file/line references.',
        'Check replay determinism, dependency ordering, capability gating, maxConcurrency, all-settled aggregation, serialized journal commits, worker cleanup, backwards compatibility, and no-model test coverage.',
        'Return JSON: { approved: boolean, findings: Array<{ severity: string, file?: string, line?: number, issue: string }>, gateEvidence: Record<string, string>, residualRisks: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const deliveryTask = defineTask('issue-579.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare issue #579 implementation PR',
  labels: ['issue-579', 'delivery', 'github'],
  agent: {
    name: 'github-delivery-agent',
    prompt: {
      role: 'maintainer preparing a GitHub implementation PR',
      task: 'Commit and publish the issue #579 implementation after review approval.',
      instructions: [
        'Only proceed if review.approved is true and all verification commands passed.',
        'Preserve unrelated dirty worktree files. Stage only issue #579 implementation and test files.',
        `Use implementation branch ${args.implementationBranch} based on ${args.baseBranch}.`,
        'Create a non-draft PR linking issue #579. If the issue is already implemented on the base branch, comment with verification evidence instead of creating a duplicate implementation PR.',
        'Post a concise issue comment summarizing phases, verification, residual risks, and the PR link or already-implemented evidence.',
        'Return JSON: { prUrl?: string, issueCommentUrl?: string, commit?: string, alreadyImplemented?: boolean, summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 579;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const implementationBranch = inputs?.implementationBranch ?? 'agent/issue-579-concurrent-effects';
  const maxImplementationIterations = inputs?.maxImplementationIterations ?? 2;

  const context = await ctx.task(readContextTask, {
    issueNumber,
    targetFiles: TARGET_FILES,
  }, {
    key: 'issue-579.context',
  });

  const design = await ctx.task(designTask, {
    contextStdout: context.stdout,
    qualityGates: QUALITY_GATES,
  }, {
    key: 'issue-579.design',
  });

  const tests = await ctx.task(authorTestsTask, {
    contextStdout: context.stdout,
    design,
  }, {
    key: 'issue-579.tests',
  });

  let sdkImplementation = { skipped: true, reason: 'Design reported issue already complete on this branch.' };
  let harnessImplementation = { skipped: true, reason: 'Design reported issue already complete on this branch.' };

  if (!design?.alreadyComplete) {
    let iteration = 0;
    while (iteration < maxImplementationIterations) {
      iteration += 1;
      sdkImplementation = await ctx.task(implementSdkTask, {
        contextStdout: context.stdout,
        design,
        tests,
        iteration,
      }, {
        key: `issue-579.implement-sdk.${iteration}`,
      });

      harnessImplementation = await ctx.task(implementHarnessTask, {
        contextStdout: context.stdout,
        design,
        tests,
        sdkImplementation,
        iteration,
      }, {
        key: `issue-579.implement-harness.${iteration}`,
      });
      break;
    }
  }

  const verification = [];
  for (const [index, command] of VERIFICATION_COMMANDS.entries()) {
    const result = await ctx.task(verifyCommandTask, {
      name: `gate-${index + 1}`,
      command,
    }, {
      key: `issue-579.verify.${index + 1}`,
    });
    verification.push({ command, result });
  }

  const implementation = {
    sdk: sdkImplementation,
    harness: harnessImplementation,
    tests,
  };

  const review = await ctx.task(reviewTask, {
    contextStdout: context.stdout,
    design,
    implementation,
    verification,
  }, {
    key: 'issue-579.review',
  });

  if (review?.approved === false) {
    return {
      success: false,
      context,
      design,
      tests,
      implementation,
      verification,
      review,
      delivery: null,
    };
  }

  const delivery = await ctx.task(deliveryTask, {
    issueNumber,
    baseBranch,
    implementationBranch,
    review,
    verification,
  }, {
    key: 'issue-579.delivery',
  });

  return {
    success: true,
    context,
    design,
    tests,
    implementation,
    verification,
    review,
    delivery,
  };
}
