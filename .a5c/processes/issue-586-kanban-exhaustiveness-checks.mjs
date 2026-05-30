/**
 * @process repo/issue-586-kanban-exhaustiveness-checks
 * @description Add exhaustive guardrails around kanban status/workflow-state mappings with focused tests.
 * @inputs { issueNumber: number, title: string, issueBody: string, triageComment: string, labels: string[], targetFiles: string[], testFiles: string[], qualityCommands: string[] }
 * @outputs { success, phases, reuseAudit, runtimeCallPaths, changedFiles, qualityGate, review }
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process library/tdd-quality-convergence
 *
 * References searched before authoring:
 * - docs/agent-reference/process-authoring.md
 * - /home/runner/.a5c/process-library/babysitter-repo/library/tdd-quality-convergence.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared/tdd-triplet.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/superpowers/test-driven-development.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/superpowers/verification-before-completion.js
 *
 * This process intentionally uses agent tasks rather than shell tasks to respect
 * this repository's process-authoring override for direct Babysitter workflows.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const reuseAuditTask = defineTask(
  'issue-586.reuse-audit',
  async ({ issueContext, targetFiles }) => ({
    kind: 'agent',
    title: 'Reuse audit for kanban exhaustiveness work',
    labels: ['issue-586', 'agent-mux', 'reuse-audit', 'phase:research'],
    agent: {
      name: 'agent-mux-reuse-auditor',
      prompt: {
        role: 'senior TypeScript maintainer',
        task: 'Run Phase 0 reuse audit before implementation planning continues.',
        instructions: [
          'Print a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
          'Extract keyword nouns and verbs from the issue context.',
          'Search for existing kanban status/workflow mappings, exhaustiveness helpers, status arrays, tests, scripts, and docs that should be reused.',
          'Do not edit files in this phase.',
          'Return JSON: { keywords: string[], existingInfrastructure: array, noNewInfrastructureNeeded: boolean, targetFilesConfirmed: string[], notes: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          `TARGET FILES: ${JSON.stringify(targetFiles ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Reuse audit', labels: ['issue-586', 'reuse-audit'] },
);

const traceKanbanPathTask = defineTask(
  'issue-586.trace-kanban-path',
  async ({ issueContext, reuseAudit, targetFiles, testFiles }) => ({
    kind: 'agent',
    title: 'Trace kanban status and workflow-state paths',
    labels: ['issue-586', 'agent-mux', 'kanban', 'phase:research'],
    agent: {
      name: 'agent-mux-kanban-researcher',
      prompt: {
        role: 'senior agent-mux engineer',
        task: 'Trace the live kanban status/workflow-state call paths and identify the narrow change surface.',
        instructions: [
          'Use the issue context as the acceptance spec.',
          'Read the target kanban source and tests.',
          'Trace status/workflow-state flow through board snapshot grouping, move validation, WIP checks, blocked flow, and status persistence.',
          'Identify every mapping site that must become exhaustive or table-driven.',
          'Confirm whether `getColumnName`, `getColumnWipLimit`, `getAllowedMoveStates`, `resolveKanbanWorkflowState`, `resolveKanbanStatusForWorkflowState`, and `evaluateKanbanIssueMove` are on the live path.',
          'Keep scope limited to kanban status/workflow-state guardrails and focused tests.',
          'Do not edit files in this phase.',
          'Return JSON: { runtimeCallPaths: array, mappingSites: array, recommendedStrategy: string, testPlan: array, risks: array, confidence: number }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
          '',
          `TARGET FILES: ${JSON.stringify(targetFiles ?? [])}`,
          `TEST FILES: ${JSON.stringify(testFiles ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Trace kanban paths', labels: ['issue-586', 'kanban', 'research'] },
);

const authorRegressionTestsTask = defineTask(
  'issue-586.author-regression-tests',
  async ({ issueContext, research, testFiles }) => ({
    kind: 'agent',
    title: 'Author kanban exhaustiveness regression tests',
    labels: ['issue-586', 'agent-mux', 'tdd', 'phase:red'],
    agent: {
      name: 'agent-mux-kanban-test-author',
      prompt: {
        role: 'senior TypeScript test engineer',
        task: 'Add focused tests that lock down kanban status/workflow-state mapping coverage before production edits.',
        instructions: [
          'Follow TDD: edit tests before production code.',
          'Use the issue context as the acceptance spec.',
          'Do not broaden the issue into a kanban.ts split or unrelated cleanup.',
          'Prefer packages/agent-mux/core/tests/kanban.test.ts unless research identifies a closer existing test surface.',
          'Add tests that enumerate every current KanbanIssueStatus and KanbanWorkflowState mapping.',
          'Cover that backlog/ready map to todo, in-progress/blocked map to in-progress, review maps to review, done maps to done, and workflow-state-to-status preserves backlog when appropriate.',
          'Cover move evaluation enough to prove the centralized mappings still drive WIP, blocked flow, acceptance, and nextStatus behavior.',
          'Run the narrow kanban test command and report whether the new tests fail before implementation or are characterization tests for type-level guardrails.',
          'Do not weaken or skip existing tests.',
          'Return JSON: { testFiles: string[], testNames: string[], redVerified: boolean, redCommand: string, redOutputSummary: string, characterizationReason: string | null }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'RESEARCH:',
          JSON.stringify(research ?? {}, null, 2),
          '',
          `TEST FILES: ${JSON.stringify(testFiles ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Author regression tests', labels: ['issue-586', 'tdd'] },
);

const implementExhaustivenessTask = defineTask(
  'issue-586.implement-exhaustiveness',
  async ({ issueContext, research, regression, verificationFeedback }) => ({
    kind: 'agent',
    title: 'Implement kanban exhaustiveness checks',
    labels: ['issue-586', 'agent-mux', 'implementation', 'phase:green'],
    agent: {
      name: 'agent-mux-kanban-implementer',
      prompt: {
        role: 'senior TypeScript maintainer',
        task: 'Implement the narrow kanban exhaustiveness guardrails for issue #586.',
        instructions: [
          'Keep edits scoped to packages/agent-mux/core/src/kanban.ts and focused kanban tests unless research proves another live-path file is necessary.',
          'Prefer exhaustive mapping tables with `satisfies Record<...>` or a local `assertNever` helper over broad control-flow rewrites.',
          'Remove the broad default behavior from `resolveKanbanWorkflowState`; every KanbanIssueStatus member must be handled deliberately.',
          'Make workflow-state labels, allowed transitions, and workflow-state-to-status mapping exhaustive for KanbanWorkflowState.',
          'Preserve existing runtime behavior for all current statuses and workflow states.',
          'Do not split the 2500+ line file or refactor unrelated kanban domains.',
          'Run the narrow kanban tests after implementation and report results.',
          'Return JSON: { changedFiles: string[], strategyUsed: string, behaviorPreserved: boolean, testResults: array, remainingRisks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'RESEARCH:',
          JSON.stringify(research ?? {}, null, 2),
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
  { kind: 'agent', title: 'Implement exhaustiveness checks', labels: ['issue-586', 'implementation'] },
);

const verifyQualityGateTask = defineTask(
  'issue-586.verify-quality-gate',
  async ({ issueContext, implementation, regression, qualityCommands, targetFiles, testFiles }) => ({
    kind: 'agent',
    title: 'Verify kanban exhaustiveness quality gates',
    labels: ['issue-586', 'agent-mux', 'verification', 'phase:quality-gate'],
    agent: {
      name: 'agent-mux-kanban-verifier',
      prompt: {
        role: 'senior TypeScript verifier',
        task: 'Run and interpret the quality gates for the issue #586 implementation.',
        instructions: [
          'Run the listed commands from the repository root and report exact pass/fail status.',
          'Confirm the kanban tests pass.',
          'Confirm the agent-mux core build/typecheck passes.',
          'Inspect the final diff for accidental source changes outside the issue scope.',
          'Verify there is no broad default in resolveKanbanWorkflowState that silently routes unknown issue statuses to todo.',
          'Verify every KanbanIssueStatus and KanbanWorkflowState mapping site has an exhaustive guardrail.',
          'Verify current runtime behavior is preserved for all existing status/state values.',
          'Return JSON: { passed: boolean, commands: array, failures: array, changedFiles: string[], exhaustiveGuardrailsVerified: boolean, behaviorPreserved: boolean, notes: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'REGRESSION TESTS:',
          JSON.stringify(regression ?? {}, null, 2),
          '',
          'IMPLEMENTATION:',
          JSON.stringify(implementation ?? {}, null, 2),
          '',
          `QUALITY COMMANDS: ${JSON.stringify(qualityCommands ?? [])}`,
          `TARGET FILES: ${JSON.stringify(targetFiles ?? [])}`,
          `TEST FILES: ${JSON.stringify(testFiles ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Verify quality gates', labels: ['issue-586', 'verification'] },
);

const reviewTask = defineTask(
  'issue-586.review',
  async ({ issueContext, reuseAudit, research, regression, implementation, qualityGate }) => ({
    kind: 'agent',
    title: 'Review kanban exhaustiveness implementation',
    labels: ['issue-586', 'agent-mux', 'review', 'phase:review'],
    agent: {
      name: 'agent-mux-kanban-reviewer',
      prompt: {
        role: 'senior TypeScript code reviewer',
        task: 'Review the final changes for issue #586 against the issue spec and quality gate results.',
        instructions: [
          'Use a code-review stance: findings first, ordered by severity, with file/line references.',
          'Verify the implementation addresses the maintenance hazard without broad kanban rewrites.',
          'Verify tests enumerate current statuses and workflow states and would make future additions visible.',
          'Verify the type-level guardrail actually fails compilation or linting when a status/state member is added without updating mappings.',
          'Verify no public API semantics changed for current status/state values.',
          'Return JSON: { approved: boolean, blockingIssues: array, nonBlockingSuggestions: array, finalSummary: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
          '',
          'RESEARCH:',
          JSON.stringify(research ?? {}, null, 2),
          '',
          'REGRESSION TESTS:',
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
  { kind: 'agent', title: 'Review final changes', labels: ['issue-586', 'review'] },
);

export async function process(inputs, ctx) {
  const issueContext = {
    issueNumber: inputs?.issueNumber ?? 586,
    title: inputs?.title,
    labels: inputs?.labels ?? [],
    body: inputs?.issueBody,
    comments: inputs?.comments ?? [],
    triageComment: inputs?.triageComment,
    relatedIssues: inputs?.relatedIssues ?? [],
  };
  const targetFiles = inputs?.targetFiles ?? ['packages/agent-mux/core/src/kanban.ts'];
  const testFiles = inputs?.testFiles ?? ['packages/agent-mux/core/tests/kanban.test.ts'];
  const qualityCommands = inputs?.qualityCommands ?? [
    'npm run test --workspace=@a5c-ai/agent-comm-mux -- packages/agent-mux/core/tests/kanban.test.ts',
    'npm run build --workspace=@a5c-ai/agent-comm-mux',
    'npm run test:agent-mux',
  ];
  const maxVerificationAttempts = inputs?.maxVerificationAttempts ?? 2;

  const reuseAudit = await ctx.task(reuseAuditTask, {
    issueContext,
    targetFiles,
  }, { key: 'issue-586.reuse-audit' });

  const research = await ctx.task(traceKanbanPathTask, {
    issueContext,
    reuseAudit,
    targetFiles,
    testFiles,
  }, { key: 'issue-586.research' });

  if (Number(research?.confidence ?? 1) < 0.65) {
    await ctx.breakpoint({
      title: 'Kanban research confidence is low',
      question: 'Research confidence is below 0.65. Review the diagnosis before implementation continues?',
      context: {
        runId: ctx.runId,
        research,
      },
    });
  }

  const regression = await ctx.task(authorRegressionTestsTask, {
    issueContext,
    research,
    testFiles,
  }, { key: 'issue-586.regression-tests' });

  let implementation = null;
  let qualityGate = null;
  let verificationFeedback = null;

  for (let attempt = 1; attempt <= maxVerificationAttempts; attempt += 1) {
    implementation = await ctx.task(implementExhaustivenessTask, {
      issueContext,
      research,
      regression,
      verificationFeedback,
    }, { key: `issue-586.implementation.${attempt}` });

    qualityGate = await ctx.task(verifyQualityGateTask, {
      issueContext,
      implementation,
      regression,
      qualityCommands,
      targetFiles,
      testFiles,
    }, { key: `issue-586.quality-gate.${attempt}` });

    if (
      qualityGate?.passed &&
      qualityGate?.exhaustiveGuardrailsVerified &&
      qualityGate?.behaviorPreserved
    ) {
      break;
    }

    verificationFeedback = qualityGate;
  }

  if (
    !qualityGate?.passed ||
    !qualityGate?.exhaustiveGuardrailsVerified ||
    !qualityGate?.behaviorPreserved
  ) {
    await ctx.breakpoint({
      title: 'Kanban exhaustiveness quality gate failed',
      question: 'The issue #586 quality gate did not pass within the configured attempts. Review failures before any further changes?',
      context: {
        runId: ctx.runId,
        qualityGate,
        implementation,
      },
    });
  }

  const review = await ctx.task(reviewTask, {
    issueContext,
    reuseAudit,
    research,
    regression,
    implementation,
    qualityGate,
  }, { key: 'issue-586.review' });

  return {
    success: Boolean(
      qualityGate?.passed &&
      qualityGate?.exhaustiveGuardrailsVerified &&
      qualityGate?.behaviorPreserved &&
      review?.approved !== false,
    ),
    phases: [
      'reuse-audit',
      'runtime-call-path-research',
      'regression-tests-red-phase',
      'exhaustiveness-implementation',
      'quality-gate',
      'review',
    ],
    reuseAudit,
    runtimeCallPaths: research?.runtimeCallPaths ?? [],
    changedFiles: qualityGate?.changedFiles ?? implementation?.changedFiles ?? [],
    qualityGate,
    review,
  };
}
