/**
 * @process repo/issue-639-hooks-mux-async-matchers-config
 * @description Implement hooks-mux async execution, richer matchers, Claude env propagation, and per-hook config.
 * @inputs { issueNumber: number, title: string, issueBody: string, labels: string[], comments: array, dependencyIssues: object, targetFiles: string[], qualityCommands: string[] }
 * @outputs { success: boolean, phases: string[], reuseAudit: object, runtimeCallPaths: array, changedFiles: string[], qualityGate: object, review: object }
 *
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/systematic-debugging
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/shared/root-cause-diagnosis
 * @process processes/shared/tdd-triplet
 * @process specializations/collaboration/github/issue-linking
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const renderReuseAuditTask = defineTask(
  'issue-639.render-reuse-audit',
  async ({ issueContext, scanRoots }) => ({
    kind: 'agent',
    title: 'Render reuse audit for issue #639',
    labels: ['issue-639', 'reuse-audit', 'hooks-mux', 'phase:research'],
    agent: {
      name: 'hooks-mux-reuse-auditor',
      prompt: {
        role: 'senior TypeScript platform engineer',
        task: 'Perform the repo-required reuse audit before implementation planning.',
        instructions: [
          'Do not edit files in this phase.',
          'Extract keyword nouns and verbs from the issue context.',
          'Search the listed scan roots for matching migrations, APIs, env vars, SDK dependencies, imports, state stores, hook config models, async/background process helpers, and existing tests.',
          'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
          'Include matching existing infrastructure and a brief "No matching existing infrastructure found" note for any major capability area with no match.',
          'Return JSON: { keywords: string[], findingsMarkdown: string, existingInfrastructure: array, gaps: array, recommendedReuse: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          `SCAN ROOTS: ${JSON.stringify(scanRoots ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Render reuse audit', labels: ['issue-639', 'reuse-audit'] },
);

const dependencyReadinessTask = defineTask(
  'issue-639.dependency-readiness',
  async ({ issueContext, dependencyIssues, reuseAudit }) => ({
    kind: 'agent',
    title: 'Check dependency readiness for #636 and #637',
    labels: ['issue-639', 'dependencies', 'hooks-mux', 'phase:gate'],
    agent: {
      name: 'hooks-mux-dependency-analyst',
      prompt: {
        role: 'senior hooks-mux maintainer',
        task: 'Decide which parts of issue #639 can proceed based on foundational issue status.',
        instructions: [
          'Do not edit files in this phase.',
          'Read the dependency issues as execution constraints, not background trivia.',
          'Issue #639 depends on #637 handler types. #637 depends on or coordinates with #636 missing events.',
          'Classify each capability as ready, blocked, or implementable behind a narrow adapter/contract once the dependency lands.',
          'Separate independent hooks-mux core work from agent-platform rewake integration work.',
          'Return JSON: { ready: boolean, blockingDependencies: array, proceedSlices: array, blockedSlices: array, sequencingPlan: array, breakpointRecommended: boolean, notes: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'DEPENDENCY ISSUES:',
          JSON.stringify(dependencyIssues ?? {}, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Check dependency readiness', labels: ['issue-639', 'dependencies'] },
);

const traceRuntimeTask = defineTask(
  'issue-639.trace-runtime',
  async ({ issueContext, targetFiles, dependencyReadiness }) => ({
    kind: 'agent',
    title: 'Trace hooks-mux runtime call paths',
    labels: ['issue-639', 'runtime-call-path', 'hooks-mux', 'phase:research'],
    agent: {
      name: 'hooks-mux-runtime-researcher',
      prompt: {
        role: 'senior TypeScript runtime engineer',
        task: 'Trace the live hook execution paths for issue #639 before tests or implementation.',
        instructions: [
          'Do not edit files in this phase.',
          'Trace from CLI invoke and programmatic engine entry points through event normalization, plan resolution, matcher evaluation, handler execution, result merge, propagation/materialization, and adapter rendering.',
          'Trace where session identity and persisted env are loaded and saved.',
          'Trace any existing background process, reminder, or rewake infrastructure in agent-platform that could receive asyncRewake results.',
          'Record runtimeCallPaths with file paths, functions, and why each path is live.',
          'Identify the narrow files that implementation should touch; avoid unrelated refactors.',
          'Return JSON: { runtimeCallPaths: array, targetImplementationFiles: array, testSurfaces: array, integrationSurfaces: array, risks: array, notes: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          `TARGET FILES: ${JSON.stringify(targetFiles ?? [])}`,
          '',
          'DEPENDENCY READINESS:',
          JSON.stringify(dependencyReadiness ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Trace runtime call paths', labels: ['issue-639', 'research'] },
);

const designContractTask = defineTask(
  'issue-639.design-contract',
  async ({ issueContext, reuseAudit, dependencyReadiness, runtimeTrace }) => ({
    kind: 'agent',
    title: 'Design hook plan/config contract',
    labels: ['issue-639', 'contract', 'hooks-mux', 'phase:design'],
    agent: {
      name: 'hooks-mux-contract-designer',
      prompt: {
        role: 'senior TypeScript API designer',
        task: 'Design the backward-compatible contract for matchers, async options, per-hook config, and Claude env propagation.',
        instructions: [
          'Do not edit production code in this phase.',
          'Keep omitted handler type compatible with legacy command/shell handlers from #637.',
          'Define matcher semantics for exact equality, pipe-separated OR, regex, negation, and if conditions while preserving current literal equality behavior where unambiguous.',
          'Define async, asyncRewake, and once semantics including durable per-session deduplication and cleanup behavior.',
          'Define per-hook timeout, shell selection, statusMessage, and disableAllHooks precedence.',
          'Define a Claude compatibility env allowlist and precedence policy for CLAUDE_ENV_FILE, CLAUDE_EFFORT, CLAUDE_PLUGIN_DATA, CLAUDE_PROJECT_DIR, and existing AGENT_* vars.',
          'Call out any contract items that must wait for #637 typed handler support or #636 missing event support.',
          'Return JSON: { contract: object, migrationNotes: array, dependencyBoundaries: array, acceptanceCriteria: array, risks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
          '',
          'DEPENDENCY READINESS:',
          JSON.stringify(dependencyReadiness ?? {}, null, 2),
          '',
          'RUNTIME TRACE:',
          JSON.stringify(runtimeTrace ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Design hook contract', labels: ['issue-639', 'contract'] },
);

const authorRegressionTestsTask = defineTask(
  'issue-639.author-regression-tests',
  async ({ issueContext, contract, runtimeTrace }) => ({
    kind: 'agent',
    title: 'Author failing regression tests for issue #639',
    labels: ['issue-639', 'tdd', 'phase:red'],
    agent: {
      name: 'hooks-mux-test-author',
      prompt: {
        role: 'senior TypeScript test engineer',
        task: 'Add focused failing regression tests before implementation code changes.',
        instructions: [
          'Follow TDD: author tests first and verify they fail for the expected missing-capability reasons.',
          'Do not redefine expected behavior from current implementation details.',
          'Cover matcher parity: existing literal equality, pipe-OR, regex, negation, and if-condition behavior.',
          'Cover per-hook config: entry timeout precedence, shell selection, statusMessage propagation/diagnostics, and disableAllHooks skip behavior.',
          'Cover async execution: async returns without awaiting process exit, once suppresses duplicate execution per session, cleanup/error recording is deterministic, and asyncRewake exit-code behavior is either implemented or explicitly gated by dependency status.',
          'Cover Claude env propagation and precedence for CLAUDE_ENV_FILE, CLAUDE_EFFORT, CLAUDE_PLUGIN_DATA, CLAUDE_PROJECT_DIR, and existing AGENT_* vars.',
          'Use existing hooks-mux core/CLI/propagation test patterns where possible.',
          'Run the narrow tests and confirm red status matches issue #639.',
          'Return JSON: { testFiles: string[], testNames: string[], redVerified: boolean, redCommand: string, redOutputSummary: string, failureMatchesIssue: boolean, deferredCoverage: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'CONTRACT:',
          JSON.stringify(contract ?? {}, null, 2),
          '',
          'RUNTIME TRACE:',
          JSON.stringify(runtimeTrace ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Author regression tests', labels: ['issue-639', 'tdd'] },
);

const implementMatchersAndConfigTask = defineTask(
  'issue-639.implement-matchers-config',
  async ({ issueContext, contract, runtimeTrace, regressionTests, verificationFeedback }) => ({
    kind: 'agent',
    title: 'Implement matcher and per-hook config support',
    labels: ['issue-639', 'implementation', 'matchers', 'config', 'phase:green'],
    agent: {
      name: 'hooks-mux-core-implementer',
      prompt: {
        role: 'senior TypeScript hooks-mux maintainer',
        task: 'Implement matcher and per-hook configuration support for issue #639.',
        instructions: [
          'Edit the repository directly.',
          'Keep changes scoped to the traced hooks-mux runtime paths.',
          'Preserve existing strict equality matcher tests and legacy shell handler behavior.',
          'Implement the agreed matcher contract in plan resolution/evaluation with deterministic tests.',
          'Implement per-hook timeout precedence, shell selection, statusMessage, and disableAllHooks where the current config and plan surfaces can support them.',
          'Do not implement HTTP-only header interpolation or allowedEnvVars in this issue unless #637 has already landed that handler surface.',
          'Run the focused matcher/config tests after changes and record results.',
          'Return JSON: { changedFiles: string[], summary: string, testsRun: array, remainingWork: array, risks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'CONTRACT:',
          JSON.stringify(contract ?? {}, null, 2),
          '',
          'RUNTIME TRACE:',
          JSON.stringify(runtimeTrace ?? {}, null, 2),
          '',
          'REGRESSION TESTS:',
          JSON.stringify(regressionTests ?? {}, null, 2),
          '',
          'VERIFICATION FEEDBACK:',
          JSON.stringify(verificationFeedback ?? null, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Implement matchers and config', labels: ['issue-639', 'implementation'] },
);

const implementEnvTask = defineTask(
  'issue-639.implement-env',
  async ({ issueContext, contract, runtimeTrace, priorImplementation, verificationFeedback }) => ({
    kind: 'agent',
    title: 'Implement Claude compatibility env propagation',
    labels: ['issue-639', 'implementation', 'env', 'phase:green'],
    agent: {
      name: 'hooks-mux-env-implementer',
      prompt: {
        role: 'senior TypeScript runtime engineer',
        task: 'Implement Claude compatibility environment propagation for issue #639.',
        instructions: [
          'Edit the repository directly.',
          'Keep changes scoped to hooks-mux materialization, runner env injection, session persistence, and any traced agent-platform session option source.',
          'Implement the agreed allowlist and precedence policy.',
          'Add or update tests for CLAUDE_ENV_FILE, CLAUDE_EFFORT, CLAUDE_PLUGIN_DATA, CLAUDE_PROJECT_DIR, AGENT_* interactions, and persisted env filtering.',
          'Avoid leaking arbitrary env vars.',
          'Run focused propagation/env tests and record results.',
          'Return JSON: { changedFiles: string[], summary: string, testsRun: array, envPolicy: object, remainingWork: array, risks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'CONTRACT:',
          JSON.stringify(contract ?? {}, null, 2),
          '',
          'RUNTIME TRACE:',
          JSON.stringify(runtimeTrace ?? {}, null, 2),
          '',
          'PRIOR IMPLEMENTATION:',
          JSON.stringify(priorImplementation ?? {}, null, 2),
          '',
          'VERIFICATION FEEDBACK:',
          JSON.stringify(verificationFeedback ?? null, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Implement env propagation', labels: ['issue-639', 'implementation'] },
);

const implementAsyncTask = defineTask(
  'issue-639.implement-async',
  async ({ issueContext, contract, dependencyReadiness, runtimeTrace, priorImplementation, verificationFeedback }) => ({
    kind: 'agent',
    title: 'Implement async, once, and asyncRewake support',
    labels: ['issue-639', 'implementation', 'async', 'phase:green'],
    agent: {
      name: 'hooks-mux-async-implementer',
      prompt: {
        role: 'senior TypeScript process-runtime engineer',
        task: 'Implement async hook execution, once tracking, and the available asyncRewake integration for issue #639.',
        instructions: [
          'Edit the repository directly.',
          'Keep changes scoped to traced runtime paths and dependency-ready surfaces.',
          'Use spawn/background execution for async handlers and do not block runPlan on async process exit.',
          'Track once execution durably per session and hook identity.',
          'Record async exits, stderr, timeout/cleanup, and duplicate suppression deterministically.',
          'Implement asyncRewake only where the rewake/reminder callback path is defined; otherwise leave an explicit typed/status result and tests that assert the dependency gate.',
          'Avoid orphaned background processes and swallowed promise rejections.',
          'Run focused async/once/rewake tests and record results.',
          'Return JSON: { changedFiles: string[], summary: string, testsRun: array, asyncLifecycle: object, dependencyDeferredItems: array, risks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'CONTRACT:',
          JSON.stringify(contract ?? {}, null, 2),
          '',
          'DEPENDENCY READINESS:',
          JSON.stringify(dependencyReadiness ?? {}, null, 2),
          '',
          'RUNTIME TRACE:',
          JSON.stringify(runtimeTrace ?? {}, null, 2),
          '',
          'PRIOR IMPLEMENTATION:',
          JSON.stringify(priorImplementation ?? {}, null, 2),
          '',
          'VERIFICATION FEEDBACK:',
          JSON.stringify(verificationFeedback ?? null, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Implement async support', labels: ['issue-639', 'implementation'] },
);

const verifyQualityGateTask = defineTask(
  'issue-639.verify-quality-gate',
  async ({ issueContext, implementations, qualityCommands }) => ({
    kind: 'agent',
    title: 'Verify issue #639 quality gates',
    labels: ['issue-639', 'verification', 'quality-gate'],
    agent: {
      name: 'hooks-mux-quality-verifier',
      prompt: {
        role: 'senior TypeScript verifier',
        task: 'Run and interpret the quality gates for issue #639.',
        instructions: [
          'Run the listed commands from the repository root.',
          'Confirm the red-phase tests were authored before implementation and now pass after implementation.',
          'Confirm matcher, async/once, env propagation, per-hook config, CLI invoke, and agent-platform rewake/dependency-gated behavior are covered.',
          'Inspect the diff for accidental changes outside the traced runtime path.',
          'Report any deferred item only if it is explicitly blocked by #636 or #637 and represented in tests or docs.',
          'Return JSON: { passed: boolean, commands: array, failures: array, changedFiles: string[], coverage: object, deferredItems: array, notes: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'IMPLEMENTATIONS:',
          JSON.stringify(implementations ?? {}, null, 2),
          '',
          `QUALITY COMMANDS: ${JSON.stringify(qualityCommands ?? [])}`,
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Verify quality gates', labels: ['issue-639', 'verification'] },
);

const reviewTask = defineTask(
  'issue-639.review',
  async ({ issueContext, reuseAudit, dependencyReadiness, runtimeTrace, contract, regressionTests, implementations, qualityGate }) => ({
    kind: 'agent',
    title: 'Review issue #639 implementation against spec',
    labels: ['issue-639', 'review', 'quality-gate'],
    agent: {
      name: 'hooks-mux-code-reviewer',
      prompt: {
        role: 'senior hooks-mux code reviewer',
        task: 'Review the final issue #639 changes for correctness, scope, and test coverage.',
        instructions: [
          'Compare issue requirements directly to the final tests, implementation, and quality gate output.',
          'Lead with blocking bugs, regressions, missing tests, or dependency mistakes.',
          'Verify legacy shell handler and literal matcher behavior remain compatible.',
          'Verify async execution cannot leak untracked processes or hide failures.',
          'Verify env propagation uses explicit allowlist/precedence and does not leak arbitrary variables.',
          'Verify per-hook config semantics are deterministic and documented by tests.',
          'Verify dependency-blocked work is not silently claimed as done.',
          'Return JSON: { approved: boolean, blockingIssues: array, nonBlockingIssues: array, residualRisks: array, summary: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(reuseAudit ?? {}, null, 2),
          '',
          'DEPENDENCY READINESS:',
          JSON.stringify(dependencyReadiness ?? {}, null, 2),
          '',
          'RUNTIME TRACE:',
          JSON.stringify(runtimeTrace ?? {}, null, 2),
          '',
          'CONTRACT:',
          JSON.stringify(contract ?? {}, null, 2),
          '',
          'REGRESSION TESTS:',
          JSON.stringify(regressionTests ?? {}, null, 2),
          '',
          'IMPLEMENTATIONS:',
          JSON.stringify(implementations ?? {}, null, 2),
          '',
          'QUALITY GATE:',
          JSON.stringify(qualityGate ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Review final changes', labels: ['issue-639', 'review'] },
);

const deliveryTask = defineTask(
  'issue-639.delivery',
  async ({ issueContext, branchName, implementations, qualityGate, review }) => ({
    kind: 'agent',
    title: 'Prepare issue #639 delivery',
    labels: ['issue-639', 'delivery', 'github'],
    agent: {
      name: 'hooks-mux-delivery-engineer',
      prompt: {
        role: 'senior maintainer preparing a GitHub delivery',
        task: 'Commit the verified implementation, push a branch, open a PR, and comment on issue #639.',
        instructions: [
          'Only proceed if the quality gate passed and review approved.',
          'Do not stage unrelated dirty worktree files.',
          `Use branch name ${branchName}.`,
          'Create a commit that includes only issue #639 implementation and test changes.',
          'Open a PR against staging with a title that references hooks-mux async/matcher/config support and links to #639.',
          'Post an issue comment summarizing implemented phases, verification commands, dependency-deferred items, and the PR link.',
          'Return JSON: { delivered: boolean, commit: string, prUrl: string, issueCommentUrl: string, notes: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'IMPLEMENTATIONS:',
          JSON.stringify(implementations ?? {}, null, 2),
          '',
          'QUALITY GATE:',
          JSON.stringify(qualityGate ?? {}, null, 2),
          '',
          'REVIEW:',
          JSON.stringify(review ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Deliver implementation', labels: ['issue-639', 'delivery'] },
);

export async function process(inputs, ctx) {
  const issueContext = {
    issueNumber: inputs?.issueNumber ?? 639,
    title: inputs?.title ?? 'hooks-mux: async execution, regex matchers, and per-hook config',
    body: inputs?.issueBody,
    labels: inputs?.labels ?? [],
    comments: inputs?.comments ?? [],
    dependencyNote: inputs?.dependencyNote,
  };
  const qualityCommands = inputs?.qualityCommands ?? [
    'npm run build:hooks-mux',
    'npm run test:hooks-mux',
    'npm run lint:hooks-mux',
    'npm run build:sdk',
    'npm run test:sdk',
    'npm run verify:metadata',
    'git diff --check',
  ];
  const maxVerificationAttempts = inputs?.maxVerificationAttempts ?? 2;

  const reuseAudit = await ctx.task(renderReuseAuditTask, {
    issueContext,
    scanRoots: inputs?.reuseAuditScanRoots ?? [],
  }, { key: 'issue-639.reuse-audit' });

  const dependencyReadiness = await ctx.task(dependencyReadinessTask, {
    issueContext,
    dependencyIssues: inputs?.dependencyIssues ?? {},
    reuseAudit,
  }, { key: 'issue-639.dependency-readiness' });

  if (dependencyReadiness?.breakpointRecommended || dependencyReadiness?.ready === false) {
    await ctx.breakpoint({
      title: 'Dependency readiness gate',
      question: 'Issue #639 depends on foundational hooks-mux work. Review the ready/blocked slice plan before implementation continues?',
      context: {
        runId: ctx.runId,
        dependencyReadiness,
      },
    });
  }

  const runtimeTrace = await ctx.task(traceRuntimeTask, {
    issueContext,
    targetFiles: inputs?.targetFiles ?? [],
    dependencyReadiness,
  }, { key: 'issue-639.runtime-trace' });

  const contract = await ctx.task(designContractTask, {
    issueContext,
    reuseAudit,
    dependencyReadiness,
    runtimeTrace,
  }, { key: 'issue-639.contract' });

  const regressionTests = await ctx.task(authorRegressionTestsTask, {
    issueContext,
    contract,
    runtimeTrace,
  }, { key: 'issue-639.regression-tests' });

  let implementations = null;
  let qualityGate = null;
  let verificationFeedback = null;

  for (let attempt = 1; attempt <= maxVerificationAttempts; attempt += 1) {
    const matcherConfig = await ctx.task(implementMatchersAndConfigTask, {
      issueContext,
      contract,
      runtimeTrace,
      regressionTests,
      verificationFeedback,
    }, { key: `issue-639.implementation.matchers-config.${attempt}` });

    const env = await ctx.task(implementEnvTask, {
      issueContext,
      contract,
      runtimeTrace,
      priorImplementation: matcherConfig,
      verificationFeedback,
    }, { key: `issue-639.implementation.env.${attempt}` });

    const asyncLifecycle = await ctx.task(implementAsyncTask, {
      issueContext,
      contract,
      dependencyReadiness,
      runtimeTrace,
      priorImplementation: { matcherConfig, env },
      verificationFeedback,
    }, { key: `issue-639.implementation.async.${attempt}` });

    implementations = { matcherConfig, env, asyncLifecycle };

    qualityGate = await ctx.task(verifyQualityGateTask, {
      issueContext,
      implementations,
      qualityCommands,
    }, { key: `issue-639.quality-gate.${attempt}` });

    if (qualityGate?.passed) {
      break;
    }

    verificationFeedback = qualityGate;
  }

  if (!qualityGate?.passed) {
    await ctx.breakpoint({
      title: 'Quality gate failed',
      question: 'Issue #639 quality gates did not pass within the configured attempts. Review failures before further changes?',
      context: {
        runId: ctx.runId,
        qualityGate,
        implementations,
      },
    });
  }

  const review = await ctx.task(reviewTask, {
    issueContext,
    reuseAudit,
    dependencyReadiness,
    runtimeTrace,
    contract,
    regressionTests,
    implementations,
    qualityGate,
  }, { key: 'issue-639.review' });

  let delivery = null;
  if (qualityGate?.passed && review?.approved !== false) {
    delivery = await ctx.task(deliveryTask, {
      issueContext,
      branchName: inputs?.implementationBranchName ?? 'fix/issue-639-hooks-mux-async-matchers-config',
      implementations,
      qualityGate,
      review,
    }, { key: 'issue-639.delivery' });
  }

  return {
    success: Boolean(qualityGate?.passed && review?.approved !== false),
    phases: [
      'reuse-audit',
      'dependency-readiness-gate',
      'runtime-call-path-trace',
      'contract-design',
      'regression-tests-red-phase',
      'matcher-and-config-implementation',
      'env-propagation-implementation',
      'async-lifecycle-implementation',
      'quality-gate',
      'review',
      'delivery',
    ],
    reuseAudit,
    dependencyReadiness,
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    changedFiles: qualityGate?.changedFiles ?? [],
    qualityGate,
    review,
    delivery,
  };
}
