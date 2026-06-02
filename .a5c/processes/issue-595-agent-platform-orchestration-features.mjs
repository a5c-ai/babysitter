/**
 * @process repo/issue-595-agent-platform-orchestration-features
 * @description Plan and execute issue #595: reconcile stale orchestration-gap claims, then implement agent-platform orchestration contracts for concurrent routing, checkpointing, rollback, process versioning, and dependencies.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string, implementationBranchName?: string }
 * @outputs { success, scope, contract, tests, implementation, verification, review, publish }
 *
 * @process methodologies/spec-kit/spec-kit-planning
 * @process methodologies/shared/root-cause-diagnosis
 * @process methodologies/process-hardening/process-hardening-patterns
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/collaboration/github/pr-policies
 * @process processes/shared/communication/single-channel-communication
 * @process processes/shared/ci/idempotency-and-safe-abort
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-595.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #595 and orchestration code context',
  labels: ['issue-595', 'context', 'reuse-audit'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- pr check ---\\n"',
      `gh pr view ${args.issueNumber} --json files,title,body,comments 2>/dev/null || true`,
      'printf "\\n--- reuse-audit findings ---\\n"',
      'rg -n "branching|conditional task routing|checkpointing|savepoint|rollback|undo|process versioning|schema evolution|task dependenc|dependency management|ConcurrentEffects|BackgroundEffects|MultiHarnessDispatch|maxConcurrentRuns|parallelGroupId|schedulerHints|subprocess" packages docs .a5c/processes -g "*.ts" -g "*.md" -g "*.mjs" -g "*.js" | head -500',
      'printf "\\n--- docs/agent-layer-gaps.md ---\\n"',
      'sed -n "1,230p" docs/agent-layer-gaps.md',
      'printf "\\n--- agent-platform harness capabilities ---\\n"',
      'sed -n "1,180p" packages/tula-platform/src/harness/types.ts',
      'printf "\\n--- agent-platform orchestration index ---\\n"',
      'sed -n "1,240p" packages/tula-platform/src/harness/internal/createRun/orchestration/index.ts',
      'printf "\\n--- agent-platform orchestration effects ---\\n"',
      'sed -n "1,460p" packages/tula-platform/src/harness/internal/createRun/orchestration/effects.ts',
      'printf "\\n--- agent-platform internal phase ---\\n"',
      'sed -n "1,520p" packages/tula-platform/src/harness/internal/createRun/orchestration/internalPhase.ts',
      'printf "\\n--- sdk parallel/runtime/task surfaces ---\\n"',
      'sed -n "1,220p" packages/sdk/src/runtime/intrinsics/parallel.ts',
      'sed -n "1,220p" packages/sdk/src/tasks/batching.ts',
      'sed -n "1,220p" packages/sdk/src/tasks/grouping.ts',
      'sed -n "1,180p" packages/sdk/src/tasks/partitioning.ts',
      'sed -n "1,220p" packages/sdk/src/runtime/types.ts',
      'sed -n "1,180p" packages/sdk/src/storage/types.ts',
      'printf "\\n--- existing tests ---\\n"',
      'rg -n "parallelGroupId|background|subprocess|processCodeHash|schemaVersion|checkpoint|rollback|dependsOn|maxConcurrentRuns" packages/sdk packages/tula-platform packages/agent-runtime -g "*.test.ts" -g "*.ts" | head -600',
      'printf "\\n--- package scripts ---\\n"',
      'node -e "const p=require(\'./package.json\'); console.log(JSON.stringify({scripts:p.scripts}, null, 2))"',
      'printf "\\n--- git status ---\\n"',
      'git status --short --branch',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 240000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const scopeAndContractTask = defineTask('issue-595.scope-and-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reconcile issue scope and define orchestration contracts',
  labels: ['issue-595', 'architecture', 'contract'],
  agent: {
    name: 'orchestration-architect',
    prompt: {
      role: 'senior Babysitter orchestration architect',
      task: 'Reconcile issue #595 against the current codebase and produce an implementation contract.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Do not edit files in this phase.',
        'Classify every issue bullet as stale, partially implemented, or still missing, with code evidence.',
        'Trace runtime call paths from CLI orchestration entry points through effect resolution and journal commits.',
        'Define a contract for the remaining live gaps: concurrent same-iteration dispatch, background effect semantics, multi-harness routing hooks, checkpoint/savepoint semantics, rollback/compensation semantics, process version/schema evolution, and task dependency semantics.',
        'Make the plan incremental: docs reconciliation first, contract tests before implementation, then small runtime phases.',
        'Explicitly exclude daemon maxConcurrentRuns from implementation unless evidence shows it regressed; it is already configurable in current code.',
        'Return JSON: { staleClaims: string[], liveGaps: string[], runtimeCallPaths: string[], affectedFiles: string[], contract: object, implementationPhases: array, qualityGates: string[], riskMitigations: string[], readyForImplementation: boolean }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const authorContractTestsTask = defineTask('issue-595.author-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing contract tests before implementation',
  labels: ['issue-595', 'tests', 'tdd'],
  agent: {
    name: 'contract-test-engineer',
    prompt: {
      role: 'senior TypeScript test engineer for event-sourced orchestration systems',
      task: 'Author the regression and contract tests for issue #595 before implementation changes.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'IMPLEMENTATION CONTRACT (verbatim):',
        '---',
        JSON.stringify(args.scope?.contract ?? {}, null, 2),
        '---',
        'Do not read files under implementation directories beyond the context above. Author tests strictly from the spec/context and current test patterns included above.',
        'Edit only test files and narrowly necessary test fixtures.',
        'Add tests that would fail before implementation for: grouped concurrent dispatch preserving deterministic commit order, failure aggregation for mixed group results, background-effect partitioning/polling semantics, subprocess child action batching, checkpoint/savepoint metadata and replay guarantees, rollback/compensation contracts for reversible versus non-reversible effects, process version/schema migration fixtures, and dependency-aware task ordering.',
        'Keep tests no-model and deterministic. Use SDK fake harnesses or local unit seams instead of paid/external agent CLIs.',
        'Return JSON: { changedFiles: string[], testsAdded: string[], expectedInitialFailures: string[], verificationCommands: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const redGateTask = defineTask('issue-595.red-gate', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Confirm contract tests fail before implementation',
  labels: ['issue-595', 'tests', 'red-gate'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --check',
      'set +e',
      'npm run test:sdk',
      'SDK_CODE=$?',
      'npm run test --workspace=@a5c-ai/tula-platform',
      'PLATFORM_CODE=$?',
      'set -e',
      'if [ "$SDK_CODE" -eq 0 ] && [ "$PLATFORM_CODE" -eq 0 ]; then',
      '  echo "Expected at least one newly authored issue #595 contract test to fail before implementation."',
      '  exit 1',
      'fi',
      'echo "Red gate confirmed. sdk=$SDK_CODE agent-platform=$PLATFORM_CODE"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementRuntimeDispatchTask = defineTask('issue-595.implement-runtime-dispatch', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement concurrent/background/multi-harness dispatch integration',
  labels: ['issue-595', 'implementation', 'dispatch'],
  agent: {
    name: 'agent-platform-runtime-engineer',
    prompt: {
      role: 'senior TypeScript engineer for Babysitter agent-platform runtime',
      task: 'Implement the dispatch portion of issue #595.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'IMPLEMENTATION CONTRACT (verbatim):',
        '---',
        JSON.stringify(args.scope?.contract ?? {}, null, 2),
        '---',
        'TEST ARTIFACTS (verbatim):',
        '---',
        JSON.stringify(args.tests ?? {}, null, 2),
        '---',
        'Edit the repository directly, scoped to the live runtime call paths from the contract.',
        'Implement same-iteration grouped effect dispatch using existing schedulerHints.parallelGroupId, maxConcurrency, and executionStrategy metadata.',
        'Preserve deterministic journal/result ordering even when effects resolve concurrently.',
        'Aggregate mixed successes and failures without losing per-effect stdout/stderr/error metadata.',
        'Use existing SDK task grouping/partitioning helpers where practical.',
        'Extend subprocess child-action resolution to respect the same batching semantics.',
        'Wire background effect hints as explicit non-blocking or polling semantics only where the contract and tests require it; do not imply external side effects are complete before they are recorded.',
        'Prepare multi-harness routing seams through existing resolveTaskHarness/discovery paths without inventing a second router.',
        'Return JSON: { changedFiles: string[], summary: string, testsExpectedToPass: string[], residualRisks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementStateContractsTask = defineTask('issue-595.implement-state-contracts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement checkpoint, rollback, version, and dependency contracts',
  labels: ['issue-595', 'implementation', 'state-contracts'],
  agent: {
    name: 'event-sourcing-runtime-engineer',
    prompt: {
      role: 'senior TypeScript engineer for event-sourced run state and migrations',
      task: 'Implement the durable state contracts for issue #595.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'IMPLEMENTATION CONTRACT (verbatim):',
        '---',
        JSON.stringify(args.scope?.contract ?? {}, null, 2),
        '---',
        'DISPATCH IMPLEMENTATION SUMMARY (verbatim):',
        '---',
        JSON.stringify(args.dispatchImplementation ?? {}, null, 2),
        '---',
        'Edit the repository directly, scoped to S../tula-platform runtime, storage, and tests named by the contract.',
        'Implement checkpoint/savepoint semantics as event-sourced metadata or derived snapshots with replay validation; avoid introducing a second source of truth.',
        'Implement rollback/undo as an explicit reversible-effect/compensating-action contract. Non-reversible completed effects must be reported as non-rollbackable, not silently undone.',
        'Implement process version/schema evolution metadata and fixture-based migration behavior for old run artifacts and process definitions.',
        'Implement dependency-aware task semantics where declared dependencies block execution until prerequisites are resolved, preserving stable ordering and cycle/error reporting.',
        'Update docs/agent-layer-gaps.md to remove stale bullets and describe the new supported contracts.',
        'Return JSON: { changedFiles: string[], summary: string, migrationNotes: string[], docsUpdated: string[], residualRisks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-595.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run issue #595 deterministic verification',
  labels: ['issue-595', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --check',
      'npm run build:sdk',
      'npm run test:sdk',
      'npm run build:runtime',
      'npm run test --workspace=@a5c-ai/tula-platform',
      'npm run test --workspace=@a5c-ai/agent-runtime',
      'npm run verify:metadata',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 1800000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-595.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #595 final artifacts',
  labels: ['issue-595', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'printf "\\n--- changed files ---\\n"',
      'git diff --name-only',
      'printf "\\n--- staged files ---\\n"',
      'git diff --cached --name-only',
      'printf "\\n--- diff ---\\n"',
      'git diff -- packages/sdk packages/tula-platform packages/agent-runtime docs .a5c/processes',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-595.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review issue #595 implementation against contract',
  labels: ['issue-595', 'review'],
  agent: {
    name: 'orchestration-code-reviewer',
    prompt: {
      role: 'code reviewer focused on deterministic orchestration, event sourcing, and rollback safety',
      task: 'Compare SPEC to ARTIFACTS directly. Report per-criterion pass/fail.',
      instructions: [
        'Ignore any narrative in your context about how ARTIFACTS were built.',
        'Return JSON: { approved: boolean, issues: string[], perCriterion: array, residualRisk: string[], requiredFixes: string[] }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.contextStdout,
        '---',
        '',
        'CONTRACT (verbatim):',
        '---',
        JSON.stringify(args.scope?.contract ?? {}, null, 2),
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        '',
        'VERIFICATION OUTPUT (verbatim):',
        '---',
        args.verificationStdout,
        '---',
        '',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-595.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create implementation PR, and comment on issue',
  labels: ['issue-595', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      `git switch ${args.implementationBranchName} 2>/dev/null || git switch -c ${args.implementationBranchName}`,
      'git status --short',
      'CHANGED="$(git diff --name-only -- packages/sdk packages/tula-platform packages/agent-runtime docs .a5c/processes)"',
      'if [ -z "$CHANGED" ]; then echo "No implementation changes to publish"; exit 1; fi',
      'printf "%s\\n" "$CHANGED" | xargs git add',
      'git diff --cached --name-only',
      'git commit -m "feat(agent-platform): add orchestration state contracts"',
      `git push -u origin ${args.implementationBranchName}`,
      `PR_URL="$(gh pr list --head ${args.implementationBranchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.implementationBranchName} --title "Implement agent-platform orchestration state contracts" --body "Closes #${args.issueNumber}\\n\\nImplements the issue #${args.issueNumber} orchestration plan: stale gap reconciliation, concurrent/background dispatch integration, checkpoint/savepoint semantics, rollback/compensation contracts, process version/schema evolution, and dependency-aware task semantics.\\n\\nQuality gates:\\n- npm run build:sdk\\n- npm run test:sdk\\n- npm run build:runtime\\n- npm run test --workspace=@a5c-ai/tula-platform\\n- npm run test --workspace=@a5c-ai/agent-runtime\\n- npm run verify:metadata")"; fi`,
      'COMMENT_BODY="$(mktemp)"',
      'cat > "$COMMENT_BODY" <<COMMENT',
      'Implemented the issue #595 orchestration plan.',
      '',
      'Phases completed:',
      '- Reconciled stale gap claims against current code.',
      '- Added contract tests first for concurrent dispatch, checkpointing, rollback, process versioning, and dependencies.',
      '- Integrated runtime dispatch/state contracts.',
      '- Updated documentation and ran deterministic quality gates.',
      '',
      'COMMENT',
      'printf "\\nPR: %s\\n" "$PR_URL" >> "$COMMENT_BODY"',
      `gh issue comment ${args.issueNumber} --body-file "$COMMENT_BODY"`,
      'printf "%s\\n" "$PR_URL"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 595;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const implementationBranchName = inputs?.implementationBranchName ?? 'agent/issue-595-orchestration-features';
  const maxReviewIterations = inputs?.maxReviewIterations ?? 2;

  const context = await ctx.task(readContextTask, { issueNumber });
  const scope = await ctx.task(scopeAndContractTask, {
    contextStdout: context?.stdout ?? '',
  });

  await ctx.breakpoint({
    title: 'Issue #595 Scope Gate',
    question: 'Review the reconciled issue scope and implementation contract before code changes. Continue with contract-test authoring and implementation?',
    context: {
      runId: ctx.runId,
      issueNumber,
      staleClaims: scope?.staleClaims ?? [],
      liveGaps: scope?.liveGaps ?? [],
      runtimeCallPaths: scope?.runtimeCallPaths ?? [],
      implementationPhases: scope?.implementationPhases ?? [],
    },
  });

  const tests = await ctx.task(authorContractTestsTask, {
    contextStdout: context?.stdout ?? '',
    scope,
  });
  const redGate = await ctx.task(redGateTask, {});

  const dispatchImplementation = await ctx.task(implementRuntimeDispatchTask, {
    contextStdout: context?.stdout ?? '',
    scope,
    tests,
  });
  const stateImplementation = await ctx.task(implementStateContractsTask, {
    contextStdout: context?.stdout ?? '',
    scope,
    dispatchImplementation,
  });

  let verification = await ctx.task(verifyTask, {});
  let artifacts = await ctx.task(readArtifactsTask, {});
  let review = await ctx.task(reviewTask, {
    contextStdout: context?.stdout ?? '',
    scope,
    artifactsStdout: artifacts?.stdout ?? '',
    verificationStdout: verification?.stdout ?? '',
  });

  let reviewIteration = 0;
  while (review?.approved !== true && reviewIteration < maxReviewIterations) {
    reviewIteration += 1;
    const fixes = await ctx.task(implementStateContractsTask, {
      contextStdout: context?.stdout ?? '',
      scope,
      dispatchImplementation: {
        review,
        previousDispatchImplementation: dispatchImplementation,
        previousStateImplementation: stateImplementation,
      },
    });
    verification = await ctx.task(verifyTask, { fixes });
    artifacts = await ctx.task(readArtifactsTask, {});
    review = await ctx.task(reviewTask, {
      contextStdout: context?.stdout ?? '',
      scope,
      artifactsStdout: artifacts?.stdout ?? '',
      verificationStdout: verification?.stdout ?? '',
      fixes,
    });
  }

  if (review?.approved !== true) {
    await ctx.breakpoint({
      title: 'Issue #595 Review Gate',
      question: 'Review still reports required fixes after the configured refinement iterations. Approve publishing with documented residual risk, or stop for manual follow-up?',
      context: {
        runId: ctx.runId,
        review,
        maxReviewIterations,
      },
    });
  }

  const publish = await ctx.task(publishTask, {
    issueNumber,
    baseBranch,
    implementationBranchName,
  });

  return {
    success: review?.approved === true,
    issueNumber,
    scope,
    tests,
    redGate,
    implementation: {
      dispatch: dispatchImplementation,
      state: stateImplementation,
    },
    verification,
    review,
    publish,
  };
}
