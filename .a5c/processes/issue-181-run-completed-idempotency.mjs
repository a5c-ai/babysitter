/**
 * @process repo/issue-181-run-completed-idempotency
 * @description Fix duplicate RUN_COMPLETED journal emission after terminal replay or post-completion state rebuild.
 * @inputs { issueNumber: number, title: string, issueBody: string, triageComment: string, labels: string[], targetFiles: string[], qualityCommands: string[] }
 * @outputs { success, phases, runtimeCallPaths, changedFiles, qualityGate, review }
 * @process methodologies/superpowers/systematic-debugging
 * @process methodologies/superpowers/test-driven-development
 * @process repo/sdk-runtime-bugfix
 *
 * This process intentionally uses agent tasks rather than shell tasks to respect
 * this repository's process-authoring override for direct Babysitter workflows.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const traceRuntimeCallPathTask = defineTask(
  'issue-181.trace-runtime-call-path',
  async ({ issueContext, targetFiles }) => ({
    kind: 'agent',
    title: 'Trace RUN_COMPLETED runtime call path',
    labels: ['sdk', 'runtime', 'journal', 'debugging', 'phase:research'],
    agent: {
      name: 'sdk-runtime-researcher',
      prompt: {
        role: 'senior SDK runtime engineer',
        task: 'Trace the live runtime path that can append duplicate RUN_COMPLETED events.',
        instructions: [
          'Use systematic debugging before proposing a fix.',
          'Read the issue context below as the source of truth.',
          'Inspect the target files and any directly related runtime/replay/storage helpers.',
          'Trace the live execution path from run:iterate / orchestrateIteration through replay initialization, process execution, terminal event append, state-cache rebuild, and subsequent terminal replay.',
          'Record runtimeCallPaths with file paths, function names, and why each path is relevant.',
          'Determine whether the fix belongs in orchestrateIteration terminal idempotency, replay initialization, state-cache rebuild, or another live path.',
          'Do not edit files in this phase.',
          'Return JSON: { rootCauseHypothesis: string, confidence: number, runtimeCallPaths: array, affectedFiles: array, regressionScenario: string, fixStrategy: string, risks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          `TARGET FILES: ${JSON.stringify(targetFiles ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Trace runtime call path', labels: ['sdk', 'runtime', 'debugging'] },
);

const authorRegressionTestTask = defineTask(
  'issue-181.author-regression-test',
  async ({ issueContext, research, testTargets }) => ({
    kind: 'agent',
    title: 'Author duplicate RUN_COMPLETED regression test',
    labels: ['sdk', 'runtime', 'tdd', 'phase:red'],
    agent: {
      name: 'sdk-runtime-test-author',
      prompt: {
        role: 'senior TypeScript test engineer',
        task: 'Add a focused failing regression test for issue #181 before production code changes.',
        instructions: [
          'Follow TDD: write the regression test before changing runtime implementation code.',
          'Use the issue context below as the acceptance spec.',
          'Do not redefine the expected behavior from implementation details.',
          'Prefer packages/sdk/src/runtime/__tests__/orchestrateIteration.integration.test.ts unless investigation proves a closer test surface.',
          'Model a completed run, then invoke the terminal replay / repeated orchestration path that currently appends a second RUN_COMPLETED event.',
          'Assert the journal contains exactly one RUN_COMPLETED event after the second terminal path.',
          'Also assert completed output is preserved and no pending effects are introduced.',
          'Run the narrow test and confirm it fails for the duplicate-event reason before implementation.',
          'Do not weaken or skip existing tests.',
          'Return JSON: { testFiles: string[], testNames: string[], redVerified: boolean, redCommand: string, redOutputSummary: string, failureMatchesIssue: boolean }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'RESEARCH:',
          JSON.stringify(research ?? {}, null, 2),
          '',
          `TEST TARGETS: ${JSON.stringify(testTargets ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Author regression test', labels: ['sdk', 'runtime', 'tdd'] },
);

const implementIdempotencyFixTask = defineTask(
  'issue-181.implement-idempotency-fix',
  async ({ issueContext, research, regression, verificationFeedback }) => ({
    kind: 'agent',
    title: 'Implement terminal lifecycle idempotency fix',
    labels: ['sdk', 'runtime', 'implementation', 'phase:green'],
    agent: {
      name: 'sdk-runtime-implementer',
      prompt: {
        role: 'senior SDK runtime engineer',
        task: 'Implement the minimal runtime fix that prevents duplicate terminal lifecycle events.',
        instructions: [
          'Keep the change focused on the live runtime path identified in research.',
          'The invariant is: after a successful process completion, later terminal replay or post-completion state rebuild must not append another RUN_COMPLETED event.',
          'Do not make rebuildStateCache append or suppress journal events; keep it a pure cache rebuild path.',
          'Prefer an idempotent terminal short-circuit before executing the process function again when the journal already has a terminal lifecycle state and no pending effects.',
          'Preserve existing output, completion metadata, cost accounting behavior, process-error behavior, and RUN_FAILED behavior unless the issue requires a change.',
          'Keep public API and CLI surfaces stable.',
          'Run the regression test after the fix and report the result.',
          'Return JSON: { changedFiles: string[], summary: string, testResults: array, remainingRisks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'RESEARCH:',
          JSON.stringify(research ?? {}, null, 2),
          '',
          'REGRESSION TEST:',
          JSON.stringify(regression ?? {}, null, 2),
          '',
          'VERIFICATION FEEDBACK FROM PRIOR ATTEMPT:',
          JSON.stringify(verificationFeedback ?? null, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Implement idempotency fix', labels: ['sdk', 'runtime', 'implementation'] },
);

const verifyQualityGateTask = defineTask(
  'issue-181.verify-quality-gate',
  async ({ issueContext, implementation, qualityCommands }) => ({
    kind: 'agent',
    title: 'Verify SDK runtime quality gates',
    labels: ['sdk', 'runtime', 'verification', 'phase:quality-gate'],
    agent: {
      name: 'sdk-runtime-verifier',
      prompt: {
        role: 'senior SDK runtime verifier',
        task: 'Run and interpret the quality gates for the issue #181 fix.',
        instructions: [
          'Run the listed commands from the repository root.',
          'Confirm the new regression test fails before the fix in the recorded red phase and passes after the fix.',
          'Confirm the full SDK test suite and SDK build pass.',
          'Inspect the final diff for accidental source changes outside the issue scope.',
          'Return JSON: { passed: boolean, commands: array, failures: array, changedFiles: string[], duplicateRunCompletedInvariantVerified: boolean, notes: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'IMPLEMENTATION:',
          JSON.stringify(implementation ?? {}, null, 2),
          '',
          `QUALITY COMMANDS: ${JSON.stringify(qualityCommands ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Verify quality gates', labels: ['sdk', 'runtime', 'verification'] },
);

const reviewFixTask = defineTask(
  'issue-181.review-fix',
  async ({ issueContext, research, regression, implementation, qualityGate }) => ({
    kind: 'agent',
    title: 'Review issue #181 fix against spec',
    labels: ['sdk', 'runtime', 'review', 'phase:review'],
    agent: {
      name: 'sdk-runtime-reviewer',
      prompt: {
        role: 'senior SDK runtime code reviewer',
        task: 'Review the final changes for issue #181.',
        instructions: [
          'Compare the issue spec directly to the produced tests and implementation.',
          'Verify terminal lifecycle idempotency is enforced at the root cause, not by masking duplicate journal entries in doctor/status consumers.',
          'Verify rebuildStateCache remains a cache-only path and does not append lifecycle events.',
          'Verify the regression test would catch a repeated RUN_COMPLETED append.',
          'Check replay determinism, journal ordering assumptions, output preservation, and compatibility with failed runs.',
          'Return JSON: { approved: boolean, blockingIssues: array, nonBlockingSuggestions: array, finalSummary: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'RESEARCH:',
          JSON.stringify(research ?? {}, null, 2),
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
  { kind: 'agent', title: 'Review issue fix', labels: ['sdk', 'runtime', 'review'] },
);

export async function process(inputs, ctx) {
  const issueContext = {
    issueNumber: inputs?.issueNumber ?? 181,
    title: inputs?.title,
    labels: inputs?.labels ?? [],
    body: inputs?.issueBody,
    triageComment: inputs?.triageComment,
    expectedBehavior: inputs?.expectedBehavior,
    actualBehavior: inputs?.actualBehavior,
  };
  const qualityCommands = inputs?.qualityCommands ?? ['npm run test:sdk', 'npm run build:sdk'];
  const maxVerificationAttempts = inputs?.maxVerificationAttempts ?? 2;

  const research = await ctx.task(traceRuntimeCallPathTask, {
    issueContext,
    targetFiles: inputs?.targetFiles ?? [],
  }, { key: 'issue-181.research' });

  if (Number(research?.confidence ?? 1) < 0.6) {
    await ctx.breakpoint({
      title: 'Root-cause confidence is low',
      question: 'Research confidence is below 0.6. Review the diagnosis before implementation continues?',
      context: {
        runId: ctx.runId,
        research,
      },
    });
  }

  const regression = await ctx.task(authorRegressionTestTask, {
    issueContext,
    research,
    testTargets: inputs?.testTargets ?? [],
  }, { key: 'issue-181.regression-test' });

  let implementation = null;
  let qualityGate = null;
  let verificationFeedback = null;

  for (let attempt = 1; attempt <= maxVerificationAttempts; attempt += 1) {
    implementation = await ctx.task(implementIdempotencyFixTask, {
      issueContext,
      research,
      regression,
      verificationFeedback,
    }, { key: `issue-181.implementation.${attempt}` });

    qualityGate = await ctx.task(verifyQualityGateTask, {
      issueContext,
      implementation,
      qualityCommands,
    }, { key: `issue-181.quality-gate.${attempt}` });

    if (qualityGate?.passed && qualityGate?.duplicateRunCompletedInvariantVerified) {
      break;
    }

    verificationFeedback = qualityGate;
  }

  if (!qualityGate?.passed || !qualityGate?.duplicateRunCompletedInvariantVerified) {
    await ctx.breakpoint({
      title: 'Quality gate failed',
      question: 'The issue #181 quality gate did not pass within the configured attempts. Review failures before any further changes?',
      context: {
        runId: ctx.runId,
        qualityGate,
        implementation,
      },
    });
  }

  const review = await ctx.task(reviewFixTask, {
    issueContext,
    research,
    regression,
    implementation,
    qualityGate,
  }, { key: 'issue-181.review' });

  return {
    success: Boolean(qualityGate?.passed && qualityGate?.duplicateRunCompletedInvariantVerified && review?.approved !== false),
    phases: ['runtime-call-path-research', 'regression-test-red-phase', 'idempotency-fix', 'quality-gate', 'review'],
    runtimeCallPaths: research?.runtimeCallPaths ?? [],
    changedFiles: qualityGate?.changedFiles ?? implementation?.changedFiles ?? [],
    qualityGate,
    review,
  };
}
