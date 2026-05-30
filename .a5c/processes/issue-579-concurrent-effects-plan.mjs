/**
 * @process repo/issue-579-concurrent-effects-plan
 * @description Implementation process for issue #579: ConcurrentEffects parallel within-harness execution.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, relatedIssues: number[] }
 * @outputs { success: boolean, phases: string[], design: object, changedFiles: string[], verification: object, review: object }
 *
 * @process cradle/feature
 * @process methodologies/shared/root-cause-diagnosis
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/sdk-platform-development/runtime-orchestration
 * @process specializations/sdk-platform-development/harness-integration
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const ISSUE_CONTEXT = {
  title: 'agent-platform: implement ConcurrentEffects (parallel within-harness)',
  summary: [
    'ConcurrentEffects is declared but not implemented end-to-end.',
    'Existing SDK pieces expose ctx.parallel batching, parallelGroupId, maxConcurrency, and capability-gated run:iterate metadata.',
    'Agent-platform orchestration loops still resolve effects sequentially and post each result one at a time.',
    'BackgroundEffects are related but explicitly follow-up scope unless implementation needs a small shared abstraction.',
  ],
  labels: [
    'enhancement',
    'sdk',
    'agent-platform',
    'feature',
    'priority:high',
    'P0',
    'effort:large',
    'risk:high',
    'ready-for-dev',
  ],
  relatedIssues: [593, 595, 598, 604],
};

const REUSE_AUDIT_FINDINGS = {
  heading: 'Reuse-audit findings (REVIEW BEFORE PROCEEDING)',
  processLibrary: '.a5c/process-library was not present in the checked-out repository during planning; use repo processes, docs, and SDK/agent-platform source patterns instead.',
  existingInfrastructure: [
    'packages/sdk/src/harness/types.ts declares HarnessCapability.ConcurrentEffects, BackgroundEffects, and MultiHarnessDispatch.',
    'packages/sdk/src/runtime/intrinsics/parallel.ts collects ctx.parallel.all/map effects and propagates maxConcurrency/executionStrategy into scheduler hints.',
    'packages/sdk/src/tasks/batching.ts and packages/sdk/src/tasks/grouping.ts assign parallelGroupId and compute effective concurrency.',
    'packages/sdk/src/cli/commands/runIterate.ts exposes parallelGroups only when harnessCapabilities includes concurrent-effects.',
    'packages/sdk/src/cli/main/runInspection.ts currently calls runIterate without harnessCapabilities, so CLI capability propagation is incomplete.',
    'packages/sdk/src/testing/runHarness.ts and packages/sdk/src/testing/__tests__/parallelHarness.test.ts provide deterministic harness fixtures for scheduler-hint assertions.',
    'packages/agent-platform/src/harness/internal/createRun/orchestration/externalPhase.ts and effects.ts contain the sequential effect resolution loops that need bounded concurrent dispatch.',
    'packages/agent-platform/src/harness/internal/createRun/orchestration/effects.ts already centralizes resolveEffectWithRetry and commit-compatible result payloads.',
  ],
  avoidNewInfrastructureUnlessNeeded: [
    'Do not add a second effect metadata model; extend EffectSchedulerHints and existing grouping helpers only when required.',
    'Do not implement BackgroundEffects in this issue except for preserving current classification behavior and not regressing its metadata.',
    'Do not replace the journal/replay model; keep effect result commits serialized through commitEffectResult.',
  ],
};

const TARGET_FILES = [
  'packages/sdk/src/runtime/types.ts',
  'packages/sdk/src/runtime/orchestrateIteration.ts',
  'packages/sdk/src/runtime/intrinsics/parallel.ts',
  'packages/sdk/src/tasks/batching.ts',
  'packages/sdk/src/tasks/grouping.ts',
  'packages/sdk/src/cli/commands/runIterate.ts',
  'packages/sdk/src/cli/main/runInspection.ts',
  'packages/sdk/src/testing/runHarness.ts',
  'packages/sdk/src/testing/__tests__/parallelHarness.test.ts',
  'packages/agent-platform/src/harness/internal/createRun/orchestration/effects.ts',
  'packages/agent-platform/src/harness/internal/createRun/orchestration/externalPhase.ts',
  'packages/agent-platform/src/harness/internal/createRun/orchestration/internalPhase.ts',
  'packages/agent-platform/src/harness/internal/createRun/orchestration/index.ts',
  'packages/agent-platform/src/harness/internal/createRun/orchestration/types.ts',
  'packages/agent-platform/src/harness/internal/createRun/__tests__/orchestration.test.ts',
];

const QUALITY_GATES = [
  'Concurrent execution is gated by HarnessCapability.ConcurrentEffects or equivalent selected-harness capability detection; existing sequential behavior remains default.',
  'Only explicit ctx.parallel groups or effects proven independent by scheduler hints run concurrently; ordinary sequential ctx.task chains remain ordered.',
  'Dispatch respects maxConcurrency and uses deterministic group ordering for reproducible logs and tests.',
  'Effect execution uses all-settled aggregation: every sibling success or error is committed before the next replay iteration proceeds.',
  'commitEffectResult calls remain serialized per run to preserve journal ordering and state-cache consistency.',
  'Mixed success/failure in a parallel group does not drop successful sibling results and surfaces failed sibling errors deterministically.',
  'CLI run:iterate capability propagation is fixed so repeated iterations can expose parallelGroups when supported.',
  'BackgroundEffects metadata and classification are not broken, but non-blocking dispatch stays out of scope for this issue.',
];

const VERIFICATION_COMMANDS = [
  'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/sdk/src/testing/__tests__/parallelHarness.test.ts packages/sdk/src/tasks/__tests__/grouping.test.ts packages/sdk/src/tasks/__tests__/batching.test.ts',
  'npm exec --yes --package=vitest -- vitest run --config vitest.config.ts packages/agent-platform/src/harness/internal/createRun/__tests__/orchestration.test.ts',
  'npm run build:sdk',
  'npm run build --workspace=@a5c-ai/agent-platform',
  'npm run test:sdk',
  'npm run test --workspace=@a5c-ai/agent-platform',
  'npm run verify:metadata',
  'git diff --check',
];

const contextAndReuseAuditTask = defineTask('issue-579.context-and-reuse-audit', (args) => ({
  kind: 'agent',
  title: 'Read issue #579 and perform reuse audit',
  labels: ['issue-579', 'context', 'reuse-audit', 'sdk', 'agent-platform'],
  agent: {
    name: 'concurrent-effects-archaeologist',
    prompt: {
      role: 'senior SDK runtime engineer',
      task: 'Read issue #579, related comments, and existing repo infrastructure before implementation.',
      instructions: [
        'Do not edit files in this task.',
        'Start with this required heading exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Issue context:',
        JSON.stringify(args.issueContext, null, 2),
        'Planning-time reuse audit:',
        JSON.stringify(args.reuseAuditFindings, null, 2),
        'Target files to inspect:',
        JSON.stringify(args.targetFiles, null, 2),
        'Re-run or refresh issue context if needed, including comments and labels.',
        'Inspect the listed SDK and agent-platform files plus any nearby tests before proposing code changes.',
        'Identify existing helpers to reuse, missing contracts, and implementation risks.',
        'Return JSON: { reuseAudit: object, currentBehavior: string, affectedFiles: string[], missingContracts: string[], risks: string[], recommendedOrder: string[] }.',
      ],
    },
  },
}));

const designTask = defineTask('issue-579.design-concurrent-effects', (args) => ({
  kind: 'agent',
  title: 'Design dependency-aware concurrent effect execution',
  labels: ['issue-579', 'design', 'scheduler', 'quality-gate'],
  agent: {
    name: 'concurrent-effects-designer',
    prompt: {
      role: 'principal runtime architect',
      task: 'Design the ConcurrentEffects implementation before coding.',
      instructions: [
        'Do not edit files in this task.',
        'Context and reuse audit:',
        JSON.stringify(args.context, null, 2),
        'Quality gates:',
        JSON.stringify(args.qualityGates, null, 2),
        'Design an end-to-end implementation that reuses ctx.parallel scheduler hints and agent-platform resolveEffectWithRetry.',
        'Define the dependency/order model. Only explicit parallel groups or demonstrably independent effects should run concurrently.',
        'Define where capability gating lives for SDK CLI, agent-platform selected harnesses, internal orchestration, external orchestration, and the legacy CLI orchestration loop.',
        'Define all-settled aggregation semantics, result commit serialization, progress events, retry behavior, worker session lifecycle, and cancellation/cleanup behavior.',
        'Call out any scope-expanding choices. BackgroundEffects and MultiHarnessDispatch must remain follow-up scope unless a tiny shared utility is unavoidable.',
        'Return JSON: { architecture: string, executionPlan: string[], targetFiles: string[], newHelpers: string[], publicApiChanges: string[], testMatrix: string[], scopeExpansionRequired: boolean, scopeExpansionReason?: string }.',
      ],
    },
  },
}));

const implementSdkTask = defineTask('issue-579.implement-sdk-surfaces', (args) => ({
  kind: 'agent',
  title: 'Implement SDK scheduler and CLI surfaces',
  labels: ['issue-579', 'implementation', 'sdk'],
  agent: {
    name: 'sdk-concurrent-effects-implementer',
    prompt: {
      role: 'senior TypeScript SDK maintainer',
      task: 'Implement the SDK side of ConcurrentEffects.',
      instructions: [
        'Edit the repository directly.',
        'Design context:',
        JSON.stringify(args.design, null, 2),
        'Keep changes focused on the SDK runtime/types/tasks/CLI surfaces needed for concurrent within-harness dispatch.',
        'Preserve replay determinism and backward compatibility for harnesses that do not declare concurrent-effects.',
        'Likely SDK work: strengthen effect scheduler hints/grouping helpers, pass harness capabilities consistently through run:iterate and CLI inspection, and expose enough metadata for agent-platform scheduling.',
        'Do not implement BackgroundEffects non-blocking dispatch here.',
        'Return JSON: { changedFiles: string[], summary: string, contractsAdded: string[], compatibilityNotes: string[], testsPlanned: string[] }.',
      ],
    },
  },
}));

const implementHarnessTask = defineTask('issue-579.implement-harness-dispatch', (args) => ({
  kind: 'agent',
  title: 'Implement agent-platform concurrent dispatch',
  labels: ['issue-579', 'implementation', 'agent-platform', 'harness'],
  agent: {
    name: 'agent-platform-concurrent-dispatcher',
    prompt: {
      role: 'senior agent-platform harness maintainer',
      task: 'Implement bounded parallel effect dispatch within agent-platform orchestration.',
      instructions: [
        'Edit the repository directly.',
        'Design context:',
        JSON.stringify(args.design, null, 2),
        'SDK implementation summary:',
        JSON.stringify(args.sdkImplementation, null, 2),
        'Implement dependency-aware grouped dispatch for eligible pending effects in internal and external orchestration paths.',
        'Reuse resolveEffectWithRetry for individual effect execution.',
        'Respect maxConcurrency and selected-harness concurrent-effects capability; fall back to the current sequential loop otherwise.',
        'Use Promise.allSettled-style aggregation, but serialize commitEffectResult calls to preserve journal ordering.',
        'Ensure worker sessions/subscriptions are created, retried, and disposed per effect without leaking sessions on partial failure.',
        'Emit progress for group start, per-effect completion, and group summary where the surrounding code already reports progress.',
        'Do not broaden scope to BackgroundEffects or MultiHarnessDispatch.',
        'Return JSON: { changedFiles: string[], summary: string, schedulingBehavior: string, failureBehavior: string, testsPlanned: string[] }.',
      ],
    },
  },
}));

const testsTask = defineTask('issue-579.add-regression-tests', (args) => ({
  kind: 'agent',
  title: 'Add deterministic ConcurrentEffects regression tests',
  labels: ['issue-579', 'tests', 'quality-gate'],
  agent: {
    name: 'concurrent-effects-test-engineer',
    prompt: {
      role: 'senior test engineer for deterministic orchestration runtimes',
      task: 'Add focused regression tests for ConcurrentEffects.',
      instructions: [
        'Edit the repository directly.',
        'Implementation summaries:',
        JSON.stringify({ sdk: args.sdkImplementation, harness: args.harnessImplementation }, null, 2),
        'Add tests proving scheduler hints, capability gating, bounded concurrency, all-settled aggregation, serialized commits, mixed success/failure handling, and sequential fallback.',
        'Prefer deterministic fake resolvers, fake clocks, and existing testing helpers over sleeps or live harness credentials.',
        'Include at least one regression that would fail if only the first failed parallel effect were posted and sibling successes were dropped.',
        'Include at least one regression that proves ordinary sequential ctx.task chains are not parallelized.',
        'Return JSON: { changedFiles: string[], testsAdded: string[], coverageMap: Record<string, string>, residualGaps: string[] }.',
      ],
    },
  },
}));

const verificationTask = defineTask('issue-579.verify-quality-gates', (args) => ({
  kind: 'agent',
  title: 'Run ConcurrentEffects verification gates',
  labels: ['issue-579', 'verification', 'quality-gate'],
  agent: {
    name: 'concurrent-effects-verifier',
    prompt: {
      role: 'release-quality engineer',
      task: 'Verify the ConcurrentEffects implementation against required quality gates.',
      instructions: [
        'Run the verification commands below, plus any narrower commands needed to isolate failures.',
        JSON.stringify(args.verificationCommands, null, 2),
        'Quality gates:',
        JSON.stringify(args.qualityGates, null, 2),
        'Summarize exact pass/fail status for every command and map each quality gate to test evidence or source evidence.',
        'If a command fails, diagnose whether the implementation or test expectation is wrong and fix only issue-scoped code before rerunning.',
        'Return JSON: { passed: boolean, commands: Array<{ command: string, status: string, notes?: string }>, gateEvidence: Record<string, string>, failures: string[] }.',
      ],
    },
  },
}));

const artifactReadbackTask = defineTask('issue-579.readback-artifacts', (args) => ({
  kind: 'agent',
  title: 'Read final ConcurrentEffects artifacts',
  labels: ['issue-579', 'artifacts', 'review'],
  agent: {
    name: 'concurrent-effects-artifact-reader',
    prompt: {
      role: 'implementation summarizer',
      task: 'Read final changed files and summarize the diff for review.',
      instructions: [
        'Do not make substantive code changes in this task.',
        'Inspect git status and the diff for issue-scoped files only.',
        'Target files:',
        JSON.stringify(args.targetFiles, null, 2),
        'Return JSON: { changedFiles: string[], diffSummary: string, publicBehaviorChanges: string[], verificationRelevantFiles: string[] }.',
      ],
    },
  },
}));

const reviewTask = defineTask('issue-579.review-concurrent-effects', (args) => ({
  kind: 'agent',
  title: 'Review ConcurrentEffects implementation',
  labels: ['issue-579', 'review', 'quality-gate'],
  agent: {
    name: 'concurrent-effects-reviewer',
    prompt: {
      role: 'principal SDK and harness reviewer',
      task: 'Review the final ConcurrentEffects implementation against issue #579.',
      instructions: [
        'Review in code-review stance. Findings first, ordered by severity, with file/line references.',
        'Issue context:',
        JSON.stringify(args.issueContext, null, 2),
        'Design:',
        JSON.stringify(args.design, null, 2),
        'Artifacts:',
        JSON.stringify(args.artifacts, null, 2),
        'Verification:',
        JSON.stringify(args.verification, null, 2),
        'Check replay determinism, dependency ordering, capability gating, all-settled aggregation, serialized journal commits, worker cleanup, backwards compatibility, and test coverage.',
        'Return JSON: { approved: boolean, findings: Array<{ severity: string, file?: string, line?: number, issue: string }>, residualRisks: string[], summary: string }.',
      ],
    },
  },
}));

const deliveryTask = defineTask('issue-579.prepare-delivery', (args) => ({
  kind: 'agent',
  title: 'Prepare implementation PR and issue update',
  labels: ['issue-579', 'delivery', 'github'],
  agent: {
    name: 'concurrent-effects-delivery-agent',
    prompt: {
      role: 'maintainer preparing a GitHub delivery',
      task: 'Commit the issue #579 implementation, open a PR, and comment on the issue.',
      instructions: [
        'Only proceed if review.approved is true and verification.passed is true.',
        'Preserve unrelated dirty worktree files. Stage only files changed for issue #579.',
        `Use implementation branch ${args.implementationBranch} based on ${args.baseBranch}.`,
        'Open a PR titled "Implement ConcurrentEffects within-harness dispatch" and link it to #579.',
        'The PR body must summarize phases, implementation behavior, tests run, quality gates, and residual risks.',
        'Post an issue comment on #579 with the implementation summary, verification commands, and PR URL.',
        'Return JSON: { prUrl: string, commit: string, issueCommentUrl?: string, stagedFiles: string[] }.',
      ],
    },
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 579;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const implementationBranch = inputs?.implementationBranch ?? 'agent/issue-579-concurrent-effects';

  const context = await ctx.task(contextAndReuseAuditTask, {
    issueNumber,
    issueContext: ISSUE_CONTEXT,
    reuseAuditFindings: REUSE_AUDIT_FINDINGS,
    targetFiles: TARGET_FILES,
  }, {
    key: 'issue-579.context-and-reuse-audit',
  });

  const design = await ctx.task(designTask, {
    context,
    qualityGates: QUALITY_GATES,
  }, {
    key: 'issue-579.design',
  });

  if (design?.scopeExpansionRequired) {
    const decision = await ctx.breakpoint({
      issueNumber,
      reason: design.scopeExpansionReason,
      design,
      question: 'The ConcurrentEffects design requires scope expansion. Approve continuing with the expanded scope?',
    }, {
      label: 'Approve issue #579 scope expansion',
      breakpointId: 'issue-579.scope-expansion',
    });
    if (!decision?.approved) {
      return {
        success: false,
        phases: ['context', 'design', 'scope-breakpoint'],
        design,
        changedFiles: [],
        verification: null,
        review: { approved: false, findings: [{ severity: 'blocked', issue: 'Scope expansion was not approved.' }] },
      };
    }
  }

  const sdkImplementation = await ctx.task(implementSdkTask, {
    design,
  }, {
    key: 'issue-579.implement-sdk',
  });

  const harnessImplementation = await ctx.task(implementHarnessTask, {
    design,
    sdkImplementation,
  }, {
    key: 'issue-579.implement-harness',
  });

  const tests = await ctx.task(testsTask, {
    sdkImplementation,
    harnessImplementation,
  }, {
    key: 'issue-579.tests',
  });

  const verification = await ctx.task(verificationTask, {
    verificationCommands: VERIFICATION_COMMANDS,
    qualityGates: QUALITY_GATES,
    tests,
  }, {
    key: 'issue-579.verification',
  });

  const artifacts = await ctx.task(artifactReadbackTask, {
    targetFiles: TARGET_FILES,
  }, {
    key: 'issue-579.artifacts',
  });

  const review = await ctx.task(reviewTask, {
    issueContext: ISSUE_CONTEXT,
    design,
    artifacts,
    verification,
  }, {
    key: 'issue-579.review',
  });

  if (review?.approved === false || verification?.passed === false) {
    return {
      success: false,
      phases: ['context', 'design', 'implementation', 'tests', 'verification', 'artifacts', 'review'],
      design,
      changedFiles: artifacts?.changedFiles ?? [
        ...(sdkImplementation?.changedFiles ?? []),
        ...(harnessImplementation?.changedFiles ?? []),
        ...(tests?.changedFiles ?? []),
      ],
      verification,
      review,
    };
  }

  const delivery = await ctx.task(deliveryTask, {
    issueNumber,
    baseBranch,
    implementationBranch,
    verification,
    review,
  }, {
    key: 'issue-579.delivery',
  });

  return {
    success: true,
    phases: ['context', 'design', 'implementation', 'tests', 'verification', 'artifacts', 'review', 'delivery'],
    design,
    changedFiles: artifacts?.changedFiles ?? [
      ...(sdkImplementation?.changedFiles ?? []),
      ...(harnessImplementation?.changedFiles ?? []),
      ...(tests?.changedFiles ?? []),
    ],
    verification,
    review,
    delivery,
  };
}
