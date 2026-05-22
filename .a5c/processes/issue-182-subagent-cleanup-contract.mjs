/**
 * @process repo/issue-182-subagent-cleanup-contract
 * @description Plan implementation of a finally-style cleanup contract for subagent /tmp workspaces and run-dir worktree leak detection.
 * @inputs { issueNumber: number, title: string, issueBody: string, triageComment: string, labels: string[], targetFiles: string[], documentationFiles: string[], testTargets: string[], qualityCommands: string[], maxVerificationAttempts?: number }
 * @outputs { success, phases, runtimeCallPaths, contractDesign, changedFiles, qualityGate, review }
 * @process methodologies/superpowers/systematic-debugging
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/process-hardening/process-hardening-patterns
 * @process specializations/sdk-platform-development/error-handling-debugging-support
 * @process processes/shared/runtime-call-tracer
 *
 * This process intentionally uses agent tasks rather than shell tasks to respect
 * this repository's process-authoring override for direct Babysitter workflows.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const traceCleanupRuntimeSurfaceTask = defineTask(
  'issue-182.trace-cleanup-runtime-surface',
  async ({ issueContext, targetFiles, documentationFiles }) => ({
    kind: 'agent',
    title: 'Trace cleanup runtime and documentation surfaces',
    labels: ['sdk', 'runtime', 'cleanup', 'phase:research'],
    agent: {
      name: 'sdk-runtime-researcher',
      prompt: {
        role: 'senior SDK runtime engineer',
        task: 'Trace the live runtime surfaces for process cleanup callbacks, task result commit, run failure/completion, and run-dir worktree leak warnings.',
        instructions: [
          'Use systematic debugging before proposing a fix.',
          'Read the issue context below as the source of truth.',
          'Inspect the listed runtime, task serialization, hook, test, and skill documentation files.',
          'Trace the live path from process execution in orchestrateIteration through waiting, completion, process-error, RUN_FAILED, and effect result/cancellation commits.',
          'Determine where a ProcessContext cleanup registry can be stored without changing replay determinism or serializing callback functions.',
          'Determine whether per-task cleanup callbacks are feasible in the current task definition/serialization model; if not, explain the constraint and prefer ctx.onCleanup for this issue.',
          'Trace how task definitions are serialized so the implementation does not accidentally attempt to persist functions.',
          'Trace where runtime warnings or metrics can be emitted if <runDir>/work exists and is non-empty after a task resolves, is cancelled, or a run reaches a terminal path.',
          'Check both plugins/babysitter-unified/skills/babysit/SKILL.md and .codex/skills/babysit/SKILL.md for the /tmp-only convention documentation surface.',
          'Do not edit files in this phase.',
          'Return JSON: { runtimeCallPaths: array, currentBehavior: object, feasibleContracts: array, recommendedContract: string, affectedFiles: array, testTargets: array, risks: array, confidence: number }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          `TARGET FILES: ${JSON.stringify(targetFiles ?? [])}`,
          `DOCUMENTATION FILES: ${JSON.stringify(documentationFiles ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Trace cleanup runtime surface', labels: ['sdk', 'runtime', 'cleanup'] },
);

const designCleanupContractTask = defineTask(
  'issue-182.design-cleanup-contract',
  async ({ issueContext, research }) => ({
    kind: 'agent',
    title: 'Design cleanup contract and leak guardrails',
    labels: ['sdk', 'runtime', 'cleanup', 'architecture', 'phase:design'],
    agent: {
      name: 'sdk-runtime-architect',
      prompt: {
        role: 'senior SDK API designer',
        task: 'Design the minimal cleanup contract for issue #182 before tests and implementation.',
        instructions: [
          'Base the design on the issue context and traced runtime paths.',
          'Prefer a process-level ctx.onCleanup(callback) API because callback functions cannot safely cross the serialized task boundary.',
          'Define the ProcessContext TypeScript surface, callback registration semantics, execution order, error handling behavior, idempotency expectations, and replay behavior.',
          'Specify that cleanup callbacks run when a process reaches completed, failed, or process-error terminal paths, and do not run on ordinary waiting iterations.',
          'Specify a work-directory leak warning/check that detects a non-empty <runDir>/work directory without deleting user data.',
          'Specify the /tmp/<descriptive-name>/ convention for subagent scratch clones and the pre-return run-dir worktree validation instruction for babysit skill docs.',
          'Keep the design minimal; avoid new public APIs beyond ctx.onCleanup unless research proves they are required.',
          'Return JSON: { apiSurface: object, lifecycleSemantics: object, leakWarningSemantics: object, documentationPlan: object, nonGoals: array, migrationNotes: array, risks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'RESEARCH:',
          JSON.stringify(research ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Design cleanup contract', labels: ['sdk', 'runtime', 'architecture'] },
);

const authorRegressionTestsTask = defineTask(
  'issue-182.author-regression-tests',
  async ({ issueContext, research, contractDesign, testTargets }) => ({
    kind: 'agent',
    title: 'Author cleanup contract regression tests',
    labels: ['sdk', 'runtime', 'cleanup', 'tdd', 'phase:red'],
    agent: {
      name: 'sdk-runtime-test-author',
      prompt: {
        role: 'senior TypeScript test engineer',
        task: 'Add focused failing regression tests for issue #182 before production code changes.',
        instructions: [
          'Follow TDD: write tests before changing runtime implementation code.',
          'Use the issue context and cleanup contract design as the acceptance spec.',
          'Prefer packages/sdk/src/runtime/__tests__/orchestrateIteration.integration.test.ts for ctx.onCleanup lifecycle behavior.',
          'Prefer packages/sdk/src/runtime/__tests__/commitEffectResult.test.ts or a new narrow runtime test only if it is the closest surface for post-task work-dir warnings.',
          'Add a type/API assertion that ProcessContext exposes onCleanup with the intended callback signature.',
          'Test that a registered cleanup removes a /tmp-style directory after successful process completion.',
          'Test that cleanup does not run during a waiting iteration before a pending task is resolved.',
          'Test that cleanup runs when the process returns process-error or failed status according to the design.',
          'Test that cleanup callback errors are reported without masking the original process result unless the design explicitly says otherwise.',
          'Test that a non-empty <runDir>/work directory produces a deterministic warning or metric after effect resolution and/or terminal completion.',
          'Test that empty or absent <runDir>/work does not warn.',
          'Run the narrow test command and confirm it fails for the missing cleanup contract or missing warning, not for unrelated setup issues.',
          'Do not weaken, skip, or delete existing tests.',
          'Return JSON: { testFiles: string[], testNames: string[], redVerified: boolean, redCommand: string, redOutputSummary: string, failureMatchesIssue: boolean, notes: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'RESEARCH:',
          JSON.stringify(research ?? {}, null, 2),
          '',
          'CONTRACT DESIGN:',
          JSON.stringify(contractDesign ?? {}, null, 2),
          '',
          `TEST TARGETS: ${JSON.stringify(testTargets ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Author cleanup regression tests', labels: ['sdk', 'runtime', 'tdd'] },
);

const implementCleanupContractTask = defineTask(
  'issue-182.implement-cleanup-contract',
  async ({ issueContext, research, contractDesign, regression, verificationFeedback }) => ({
    kind: 'agent',
    title: 'Implement cleanup contract and docs',
    labels: ['sdk', 'runtime', 'cleanup', 'implementation', 'phase:green'],
    agent: {
      name: 'sdk-runtime-implementer',
      prompt: {
        role: 'senior SDK runtime engineer',
        task: 'Implement issue #182 with the minimal runtime and documentation changes required by the approved contract.',
        instructions: [
          'Keep changes focused on the live runtime paths identified in research.',
          'Add ProcessContext.onCleanup(callback) to the public type surface and concrete process context implementation.',
          'Store cleanup callbacks in internal runtime context only; do not serialize callback functions into task definitions or journals.',
          'Flush registered callbacks exactly once for a terminal process execution path. Do not flush on normal waiting iterations caused by pending effects.',
          'Run cleanup in finally-style handling for success, RunFailedError failure, and process-error paths according to the contract design.',
          'Handle cleanup errors deterministically and observably; do not hide the original process failure.',
          'Add a small runtime helper if useful to inspect <runDir>/work and emit a warning or runtime metric when it exists and is non-empty. Do not delete the directory automatically.',
          'Consider both commitEffectResult and commitEffectCancellation for post-task leak checks, and terminal completion/failure paths for process-level checks.',
          'Update babysit skill documentation surfaces so subagents that need scratch clones use /tmp/<descriptive-name>/, never .a5c/runs/<runId>/work, and pre-validate that .a5c/runs/**/work is absent before returning deliverables.',
          'Update SDK reference docs only if the public ProcessContext API changes are documented there already.',
          'Do not implement a per-task cleanup callback unless the design and tests prove it can be done without serializing functions or breaking existing task execution.',
          'Run the focused regression tests after implementation and report results.',
          'Return JSON: { changedFiles: string[], summary: string, contractImplemented: boolean, docsUpdated: boolean, leakWarningImplemented: boolean, testResults: array, remainingRisks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'RESEARCH:',
          JSON.stringify(research ?? {}, null, 2),
          '',
          'CONTRACT DESIGN:',
          JSON.stringify(contractDesign ?? {}, null, 2),
          '',
          'REGRESSION TESTS:',
          JSON.stringify(regression ?? {}, null, 2),
          '',
          'VERIFICATION FEEDBACK FROM PRIOR ATTEMPT:',
          JSON.stringify(verificationFeedback ?? null, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Implement cleanup contract', labels: ['sdk', 'runtime', 'implementation'] },
);

const verifyQualityGateTask = defineTask(
  'issue-182.verify-quality-gate',
  async ({ issueContext, contractDesign, implementation, qualityCommands }) => ({
    kind: 'agent',
    title: 'Verify cleanup contract quality gates',
    labels: ['sdk', 'runtime', 'cleanup', 'verification', 'phase:quality-gate'],
    agent: {
      name: 'sdk-runtime-verifier',
      prompt: {
        role: 'senior SDK runtime verifier',
        task: 'Run and interpret the quality gates for the issue #182 cleanup contract implementation.',
        instructions: [
          'Run the listed commands from the repository root.',
          'Confirm the new regression tests failed before implementation for the intended missing behavior and pass after the implementation.',
          'Confirm the focused runtime tests, SDK test suite, SDK build, and metadata verification pass.',
          'Inspect the final diff for accidental source changes outside the issue scope.',
          'Confirm ProcessContext.onCleanup is type-visible and runtime-visible.',
          'Confirm cleanup callbacks run for success/failure/process-error terminal paths and not for ordinary waiting iterations.',
          'Confirm non-empty <runDir>/work detection warns or reports deterministically and never deletes data.',
          'Confirm babysit skill docs state the /tmp-only subagent workspace convention and the run-dir worktree pre-validation step.',
          'Return JSON: { passed: boolean, commands: array, failures: array, changedFiles: string[], cleanupContractVerified: boolean, leakWarningVerified: boolean, docsVerified: boolean, notes: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'CONTRACT DESIGN:',
          JSON.stringify(contractDesign ?? {}, null, 2),
          '',
          'IMPLEMENTATION:',
          JSON.stringify(implementation ?? {}, null, 2),
          '',
          `QUALITY COMMANDS: ${JSON.stringify(qualityCommands ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Verify cleanup quality gates', labels: ['sdk', 'runtime', 'verification'] },
);

const reviewCleanupContractTask = defineTask(
  'issue-182.review-cleanup-contract',
  async ({ issueContext, research, contractDesign, regression, implementation, qualityGate }) => ({
    kind: 'agent',
    title: 'Review issue #182 cleanup contract',
    labels: ['sdk', 'runtime', 'cleanup', 'review', 'phase:review'],
    agent: {
      name: 'sdk-runtime-reviewer',
      prompt: {
        role: 'senior SDK runtime code reviewer',
        task: 'Review the final changes for issue #182 against the requested cleanup contract.',
        instructions: [
          'Compare the issue spec directly to the produced tests, implementation, docs, and quality gate evidence.',
          'Verify the solution addresses the root failure modes: leaked .a5c/runs/<runId>/work trees and no finally-style cleanup hook for /tmp clones.',
          'Verify callback registration is not persisted in journals or task definitions and does not change replay determinism.',
          'Verify cleanup runs exactly once per terminal process execution and does not run on waiting iterations.',
          'Verify cleanup failure handling is explicit and does not mask original failures unexpectedly.',
          'Verify run-dir worktree warnings are deterministic, actionable, and non-destructive.',
          'Verify the docs include the subagent /tmp-only convention and the pre-return worktree leak validation.',
          'Return JSON: { approved: boolean, blockingIssues: array, nonBlockingSuggestions: array, finalSummary: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'RESEARCH:',
          JSON.stringify(research ?? {}, null, 2),
          '',
          'CONTRACT DESIGN:',
          JSON.stringify(contractDesign ?? {}, null, 2),
          '',
          'REGRESSION:',
          JSON.stringify(regression ?? {}, null, 2),
          '',
          'IMPLEMENTATION:',
          JSON.stringify(implementation ?? {}, null, 2),
          '',
          'QUALITY GATE:',
          JSON.stringify(qualityGate ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Review cleanup contract', labels: ['sdk', 'runtime', 'review'] },
);

export async function process(inputs, ctx) {
  const issueContext = {
    issueNumber: inputs?.issueNumber ?? 182,
    title: inputs?.title,
    labels: inputs?.labels ?? [],
    body: inputs?.issueBody,
    triageComment: inputs?.triageComment,
    acceptanceCriteria: inputs?.acceptanceCriteria ?? [],
    userRequest: inputs?.userRequest,
  };
  const qualityCommands = inputs?.qualityCommands ?? [
    'npm exec --workspace=@a5c-ai/babysitter-sdk -- vitest run src/runtime/__tests__/orchestrateIteration.integration.test.ts src/runtime/__tests__/commitEffectResult.test.ts',
    'npm run test:sdk',
    'npm run build:sdk',
    'npm run verify:metadata',
  ];
  const maxVerificationAttempts = inputs?.maxVerificationAttempts ?? 2;

  const research = await ctx.task(traceCleanupRuntimeSurfaceTask, {
    issueContext,
    targetFiles: inputs?.targetFiles ?? [],
    documentationFiles: inputs?.documentationFiles ?? [],
  }, { key: 'issue-182.research' });

  if (Number(research?.confidence ?? 1) < 0.6) {
    await ctx.breakpoint({
      title: 'Cleanup runtime diagnosis confidence is low',
      question: 'Research confidence is below 0.6. Review the diagnosis before designing the cleanup contract?',
      context: {
        runId: ctx.runId,
        research,
      },
    });
  }

  const contractDesign = await ctx.task(designCleanupContractTask, {
    issueContext,
    research,
  }, { key: 'issue-182.contract-design' });

  const regression = await ctx.task(authorRegressionTestsTask, {
    issueContext,
    research,
    contractDesign,
    testTargets: inputs?.testTargets ?? [],
  }, { key: 'issue-182.regression-tests' });

  let implementation = null;
  let qualityGate = null;
  let verificationFeedback = null;

  for (let attempt = 1; attempt <= maxVerificationAttempts; attempt += 1) {
    implementation = await ctx.task(implementCleanupContractTask, {
      issueContext,
      research,
      contractDesign,
      regression,
      verificationFeedback,
    }, { key: `issue-182.implementation.${attempt}` });

    qualityGate = await ctx.task(verifyQualityGateTask, {
      issueContext,
      contractDesign,
      implementation,
      qualityCommands,
    }, { key: `issue-182.quality-gate.${attempt}` });

    if (
      qualityGate?.passed
      && qualityGate?.cleanupContractVerified
      && qualityGate?.leakWarningVerified
      && qualityGate?.docsVerified
    ) {
      break;
    }

    verificationFeedback = qualityGate;
  }

  if (
    !qualityGate?.passed
    || !qualityGate?.cleanupContractVerified
    || !qualityGate?.leakWarningVerified
    || !qualityGate?.docsVerified
  ) {
    await ctx.breakpoint({
      title: 'Cleanup contract quality gate failed',
      question: 'The issue #182 quality gate did not pass within the configured attempts. Review failures before any further changes?',
      context: {
        runId: ctx.runId,
        qualityGate,
        implementation,
      },
    });
  }

  const review = await ctx.task(reviewCleanupContractTask, {
    issueContext,
    research,
    contractDesign,
    regression,
    implementation,
    qualityGate,
  }, { key: 'issue-182.review' });

  return {
    success: Boolean(
      qualityGate?.passed
      && qualityGate?.cleanupContractVerified
      && qualityGate?.leakWarningVerified
      && qualityGate?.docsVerified
      && review?.approved !== false,
    ),
    phases: [
      'runtime-surface-research',
      'cleanup-contract-design',
      'regression-tests-red-phase',
      'cleanup-contract-implementation',
      'quality-gate',
      'review',
    ],
    runtimeCallPaths: research?.runtimeCallPaths ?? [],
    contractDesign,
    changedFiles: qualityGate?.changedFiles ?? implementation?.changedFiles ?? [],
    qualityGate,
    review,
  };
}
