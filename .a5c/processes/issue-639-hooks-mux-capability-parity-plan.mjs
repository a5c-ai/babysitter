/**
 * @process repo/issue-639-hooks-mux-capability-parity-plan
 * @description Execute the implementation plan for issue #639, starting with a current-state gate because a prior plan/implementation PR already exists.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranchName: string, issueContext: object, dependencyIssues: object, priorPlan: object, scanRoots: string[], targetFiles: string[], qualityCommands: string[] }
 * @outputs { success: boolean, phases: string[], currentState: object, reuseAudit: object, dependencyReadiness: object, runtimeTrace: object, contract: object, tests: object, implementation: object, verification: object, review: object, delivery: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Matching existing infrastructure found in hooks-mux plan types, matcher evaluation, runner execution, propagation/materialization, session-store markers, CLI invoke tests, programmatic engine tests, and agent-platform background process tracking.
 * - Existing issue #639 process artifacts are already present on staging from merged PR #674; this refreshed plan treats that as prior art and adds a current-state gate before any implementation work.
 * - Repo-local `.a5c/process-library/` was not present in this checkout. The active process-library binding was available at `/home/runner/.a5c/process-library/babysitter-repo/library`, and matching guidance was found under `methodologies/atdd-tdd/atdd-tdd.js`, `methodologies/process-hardening/process-hardening-patterns.js`, `methodologies/superpowers/verification-before-completion.js`, `methodologies/shared/root-cause-diagnosis.js`, `processes/shared/tdd-triplet.js`, `specializations/sdk-platform-development/sdk-testing-strategy.js`, `specializations/qa-testing-automation/quality-gates.js`, and `specializations/collaboration/github/issue-linking.js`.
 * - No `.a5c/reuse-audit.json` was present; keyword scan used: hooks-mux, async, asyncRewake, once, matcher, regex, OR, if, timeout, shell, statusMessage, disableAllHooks, CLAUDE_ENV_FILE, CLAUDE_EFFORT, CLAUDE_PLUGIN_DATA, session-store, background.
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-stack/hooks/missing-capabilities.md
 * - .a5c/processes/issue-636-hooks-mux-missing-events.mjs
 * - .a5c/processes/issue-638-hooks-mux-decisions.mjs
 * - .a5c/processes/issue-639-hooks-mux-async-matchers-config.mjs
 * - active process library: /home/runner/.a5c/process-library/babysitter-repo/library
 * - methodologies/atdd-tdd/atdd-tdd.js
 * - methodologies/process-hardening/process-hardening-patterns.js
 * - methodologies/superpowers/verification-before-completion.js
 * - methodologies/shared/root-cause-diagnosis.js
 * - processes/shared/tdd-triplet.js
 * - specializations/sdk-platform-development/sdk-testing-strategy.js
 * - specializations/qa-testing-automation/quality-gates.js
 * - specializations/collaboration/github/issue-linking.js
 *
 * @process methodologies/atdd-tdd/atdd-tdd
 * @process methodologies/process-hardening/process-hardening-patterns
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/shared/root-cause-diagnosis
 * @process processes/shared/tdd-triplet
 * @process specializations/sdk-platform-development/sdk-testing-strategy
 * @process specializations/qa-testing-automation/quality-gates
 * @process specializations/collaboration/github/issue-linking
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_QUALITY_COMMANDS = [
  'npm run build:hooks-mux',
  'npm run test:hooks-mux',
  'npm run lint:hooks-mux',
  'npm run build:sdk',
  'npm run test:sdk',
  'npm run verify:metadata',
  'git diff --check',
];

const currentStateGateTask = defineTask('issue-639.current-state-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check current issue and prior PR state',
  labels: ['issue-639', 'planning', 'current-state'],
  agent: {
    name: 'hooks-mux-current-state-analyst',
    prompt: {
      role: 'senior hooks-mux maintainer',
      task: 'Determine whether issue #639 still needs implementation work before starting changes.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments,state`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments,state`,
        'Inspect the prior plan/implementation PR if provided. The latest issue comments may say implementation is complete in PR #674 and may also link a refreshed plan PR.',
        'Read the issue description, every comment, labels, and any referenced PR body carefully.',
        'Classify the task as already-complete, verification-only, or needs-implementation.',
        'If the issue appears complete, plan verification of the landed behavior instead of duplicating implementation work.',
        'Do not edit files in this phase.',
        'Return JSON: { status, title, labels, commentsReviewed, priorPrs, implementationStillNeeded, verificationOnly, rationale, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reuseAuditTask = defineTask('issue-639.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Render repo reuse audit',
  labels: ['issue-639', 'reuse-audit', 'hooks-mux'],
  agent: {
    name: 'hooks-mux-reuse-auditor',
    prompt: {
      role: 'senior TypeScript platform engineer',
      task: 'Perform the repo-required reuse audit before design or implementation work.',
      instructions: [
        'Follow docs/agent-reference/process-authoring.md for babysitter:plan reuse-audit requirements.',
        'Extract keyword nouns and verbs from issue #639 and the current-state result.',
        'Scan the provided roots for matching migrations, API routes, environment variables, SDK dependencies, imports, hook config models, background process helpers, session stores, and existing tests.',
        'Research process-library guidance. The prompt requested `.a5c/process-library/`; if that repo-local path is absent, record it and use the active process-library binding plus matching checked-in `library/` mirrors.',
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Do not edit files in this phase.',
        'Return JSON: { keywords, findingsMarkdown, existingInfrastructure, missingInfrastructure, matchingMethodologies, recommendedReuse, risks }.',
        '',
        'CURRENT STATE:',
        JSON.stringify(args.currentState, null, 2),
        '',
        'SCAN ROOTS:',
        JSON.stringify(args.scanRoots ?? [], null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const dependencyReadinessTask = defineTask('issue-639.dependency-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gate dependency readiness',
  labels: ['issue-639', 'dependencies', 'hooks-mux'],
  agent: {
    name: 'hooks-mux-dependency-gatekeeper',
    prompt: {
      role: 'senior hooks-mux release engineer',
      task: 'Decide which issue #639 slices can proceed based on #636, #637, and the prior #674 work.',
      instructions: [
        'Do not edit files in this phase.',
        'Treat #637 as the typed/async-capable handler dependency and #636 as related missing-event matcher infrastructure.',
        'Inspect whether #674 already merged some or all issue #639 behavior onto the base branch.',
        'Separate independent hooks-mux core verification from blocked or already-implemented agent-platform asyncRewake integration.',
        'Recommend a breakpoint only when maintainer input is genuinely needed.',
        'Return JSON: { ready, mode, proceedSlices, verifyOnlySlices, blockedSlices, dependencyEvidence, breakpointRecommended, question, risks }.',
        '',
        'CURRENT STATE:',
        JSON.stringify(args.currentState, null, 2),
        '',
        'REUSE AUDIT:',
        JSON.stringify(args.reuseAudit, null, 2),
        '',
        'DEPENDENCY ISSUES:',
        JSON.stringify(args.dependencyIssues ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const runtimeTraceTask = defineTask('issue-639.runtime-trace', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace hooks-mux runtime surfaces',
  labels: ['issue-639', 'research', 'runtime-call-path'],
  agent: {
    name: 'hooks-mux-runtime-researcher',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Trace live issue #639 runtime paths and narrow the implementation or verification target.',
      instructions: [
        'Do not edit files in this phase.',
        'Trace from CLI invoke and programmatic engine entry points through event normalization, plan resolution, matcher evaluation, handler execution, result merge, propagation/materialization, session persistence, and adapter rendering.',
        'Trace background process and rewake-related surfaces in agent-platform only if dependency readiness says they are in scope.',
        'Identify existing tests that already cover landed behavior and gaps that still require red tests.',
        'Return JSON: { runtimeCallPaths, targetImplementationFiles, targetTestFiles, existingCoverage, coverageGaps, outOfScopeFiles, risks }.',
        '',
        'DEPENDENCY READINESS:',
        JSON.stringify(args.dependencyReadiness, null, 2),
        '',
        'TARGET FILES:',
        JSON.stringify(args.targetFiles ?? [], null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const contractTask = defineTask('issue-639.contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define compatibility contract',
  labels: ['issue-639', 'design', 'contract'],
  agent: {
    name: 'hooks-mux-contract-designer',
    prompt: {
      role: 'senior TypeScript API designer',
      task: 'Define the issue #639 compatibility contract before tests or implementation.',
      instructions: [
        'Do not edit production code in this phase.',
        'Define matcher semantics for exact equality, pipe-separated OR, regex, negation, and if-condition behavior while preserving legacy literal equality where unambiguous.',
        'Define async, asyncRewake, and once semantics including session-scoped durable dedupe, cleanup, timeout, and exit recording.',
        'Define per-hook timeout, shell selection, statusMessage, and disableAllHooks precedence.',
        'Define Claude compatibility env allowlist and precedence for CLAUDE_ENV_FILE, CLAUDE_EFFORT, CLAUDE_PLUGIN_DATA, CLAUDE_PROJECT_DIR, and existing AGENT_* vars.',
        'For any capability already implemented on the base branch, state the expected regression coverage instead of requesting duplicate code.',
        'Return JSON: { contract, acceptanceCriteria, alreadySatisfiedCriteria, implementationCriteria, dependencyBoundaries, nonGoals, risks }.',
        '',
        'RUNTIME TRACE:',
        JSON.stringify(args.runtimeTrace, null, 2),
        '',
        'DEPENDENCY READINESS:',
        JSON.stringify(args.dependencyReadiness, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const regressionTestsTask = defineTask('issue-639.regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author or verify regression tests',
  labels: ['issue-639', 'atdd', 'tdd', 'tests'],
  agent: {
    name: 'hooks-mux-test-architect',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Create failing tests for remaining gaps, or verify existing regression tests for already-landed behavior.',
      instructions: [
        'Follow ATDD/TDD: tests must specify behavior before production changes for any remaining gap.',
        'If current-state says implementation is already complete, do not add duplicate tests unless coverage is missing; verify existing tests instead.',
        'Cover matcher parity: literal equality, pipe-OR, regex, negation, and if conditions.',
        'Cover per-hook config: timeout precedence, shell selection, statusMessage diagnostics, and disableAllHooks skip behavior.',
        'Cover async lifecycle: async does not block synchronous hook flow, once suppresses duplicates per session, cleanup/error recording is deterministic, and asyncRewake behavior is implemented or dependency-gated.',
        'Cover Claude env propagation and precedence: CLAUDE_ENV_FILE, CLAUDE_EFFORT, CLAUDE_PLUGIN_DATA, CLAUDE_PROJECT_DIR, and AGENT_* interactions.',
        'Run narrow tests needed to prove red for gaps or green for already-landed behavior.',
        'Return JSON: { mode, changedFiles, verifiedExistingTests, newTests, commandsRun, redVerified, coverageByCapability, deferredCoverage, risks }.',
        '',
        'CONTRACT:',
        JSON.stringify(args.contract, null, 2),
        '',
        'RUNTIME TRACE:',
        JSON.stringify(args.runtimeTrace, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementationTask = defineTask('issue-639.implementation-slices', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement remaining issue slices',
  labels: ['issue-639', 'implementation', 'hooks-mux'],
  agent: {
    name: 'hooks-mux-implementer',
    prompt: {
      role: 'senior TypeScript hooks-mux maintainer',
      task: 'Implement only the issue #639 behavior that remains after current-state verification.',
      instructions: [
        'Edit the repository directly only if the current-state, dependency, contract, and test phases identify remaining gaps.',
        'Keep changes scoped to traced hooks-mux and agent-platform runtime paths.',
        'Do not reimplement behavior that already landed in the prior #674 work.',
        'Preserve legacy shell handler behavior, literal matcher compatibility, and existing adapter contracts.',
        'Implement remaining slices in this order when needed: matcher/config support, Claude env propagation, async/once lifecycle, asyncRewake integration or explicit dependency gate.',
        'Run focused tests after each changed slice and record evidence.',
        'Return JSON: { mode, changedFiles, implementedSlices, skippedAlreadyCompleteSlices, deferredDependencySlices, commandsRun, risks }.',
        '',
        'CURRENT STATE:',
        JSON.stringify(args.currentState, null, 2),
        '',
        'REGRESSION TESTS:',
        JSON.stringify(args.tests, null, 2),
        '',
        'CONTRACT:',
        JSON.stringify(args.contract, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verificationTask = defineTask('issue-639.verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run quality gates',
  labels: ['issue-639', 'verification', 'quality-gate'],
  agent: {
    name: 'hooks-mux-quality-verifier',
    prompt: {
      role: 'senior CI and release verification engineer',
      task: 'Run fresh verification and report evidence without claiming success unless commands pass.',
      instructions: [
        'Run the listed quality commands from the repository root unless a command is unavailable; record exact blockers and closest targeted alternatives.',
        'Read full command output, record exit codes, and count failures.',
        'Verify issue requirements line by line against tests and implementation state.',
        'Confirm the diff contains only in-scope files and no unrelated working tree changes are staged.',
        'Return JSON: { passed, commandResults, requirementChecklist, changedFiles, evidenceGaps, deferredItems, notes }.',
        '',
        'QUALITY COMMANDS:',
        JSON.stringify(args.qualityCommands ?? DEFAULT_QUALITY_COMMANDS, null, 2),
        '',
        'IMPLEMENTATION:',
        JSON.stringify(args.implementation, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-639.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review implementation or verification result',
  labels: ['issue-639', 'review', 'quality-gate'],
  agent: {
    name: 'hooks-mux-code-reviewer',
    prompt: {
      role: 'senior hooks-mux code reviewer',
      task: 'Review the final issue #639 state against the contract and verification evidence.',
      instructions: [
        'Use a code-review stance. Lead with blocking bugs, regressions, missing tests, or dependency mistakes.',
        'Verify matcher compatibility, async lifecycle safety, env allowlist/precedence, per-hook config semantics, and dependency-deferred work.',
        'If the run was verification-only, review whether the existing landed implementation truly satisfies #639.',
        'Return JSON: { approved, findings, missingCoverage, residualRisks, summary }.',
        '',
        'CONTRACT:',
        JSON.stringify(args.contract, null, 2),
        '',
        'VERIFICATION:',
        JSON.stringify(args.verification, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const deliveryTask = defineTask('issue-639.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare delivery artifacts',
  labels: ['issue-639', 'delivery', 'github'],
  agent: {
    name: 'hooks-mux-delivery-engineer',
    prompt: {
      role: 'senior maintainer preparing GitHub delivery',
      task: 'Deliver the issue #639 implementation or verification result after gates pass.',
      instructions: [
        'Only proceed if verification passed and review approved.',
        'Do not stage unrelated dirty worktree files.',
        'If no code changes were needed, do not create an empty implementation PR; instead post an issue comment with verification evidence.',
        `If changes were made, use branch name ${args.branchName}.`,
        'Open a PR against the configured base branch and link #639.',
        'Post an issue comment summarizing phases completed, verification commands, deferred items, and the PR link or verification-only outcome.',
        'Return JSON: { delivered, mode, commit, prUrl, issueCommentUrl, notes }.',
        '',
        'VERIFICATION:',
        JSON.stringify(args.verification, null, 2),
        '',
        'REVIEW:',
        JSON.stringify(args.review, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 639;
  const qualityCommands = inputs?.qualityCommands ?? DEFAULT_QUALITY_COMMANDS;

  const currentState = await ctx.task(currentStateGateTask, {
    issueNumber,
    priorPlan: inputs?.priorPlan,
    issueContext: inputs?.issueContext,
  }, { key: 'issue-639.current-state-gate' });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    currentState,
    scanRoots: inputs?.scanRoots ?? [],
  }, { key: 'issue-639.reuse-audit' });

  const dependencyReadiness = await ctx.task(dependencyReadinessTask, {
    currentState,
    reuseAudit,
    dependencyIssues: inputs?.dependencyIssues ?? {},
  }, { key: 'issue-639.dependency-readiness' });

  if (dependencyReadiness?.breakpointRecommended === true) {
    await ctx.breakpoint({
      title: 'Issue #639 Dependency Decision',
      question: dependencyReadiness.question ?? 'Review dependency readiness before continuing issue #639.',
      expert: 'owner',
      tags: ['issue-639', 'dependency-gate'],
      context: { runId: ctx.runId, dependencyReadiness },
    });
  }

  const runtimeTrace = await ctx.task(runtimeTraceTask, {
    dependencyReadiness,
    targetFiles: inputs?.targetFiles ?? [],
  }, { key: 'issue-639.runtime-trace' });

  const contract = await ctx.task(contractTask, {
    runtimeTrace,
    dependencyReadiness,
  }, { key: 'issue-639.contract' });

  const tests = await ctx.task(regressionTestsTask, {
    contract,
    runtimeTrace,
  }, { key: 'issue-639.regression-tests' });

  const implementation = await ctx.task(implementationTask, {
    currentState,
    tests,
    contract,
  }, { key: 'issue-639.implementation' });

  const verification = await ctx.task(verificationTask, {
    implementation,
    qualityCommands,
  }, { key: 'issue-639.verification' });

  if (verification?.passed !== true) {
    await ctx.breakpoint({
      title: 'Issue #639 Quality Gate Failed',
      question: 'Verification did not pass. Review evidence gaps before delivery?',
      expert: 'owner',
      tags: ['issue-639', 'quality-gate'],
      context: { runId: ctx.runId, verification },
    });
  }

  const review = await ctx.task(reviewTask, {
    contract,
    verification,
  }, { key: 'issue-639.review' });

  let delivery = null;
  if (verification?.passed === true && review?.approved !== false) {
    delivery = await ctx.task(deliveryTask, {
      branchName: inputs?.implementationBranchName ?? 'fix/issue-639-hooks-mux-capability-parity',
      verification,
      review,
    }, { key: 'issue-639.delivery' });
  }

  return {
    success: Boolean(verification?.passed === true && review?.approved !== false),
    phases: [
      'current-state-gate',
      'reuse-audit',
      'dependency-readiness',
      'runtime-trace',
      'contract-design',
      'regression-tests',
      'implementation-or-verification-only',
      'quality-gate',
      'review',
      'delivery',
    ],
    currentState,
    reuseAudit,
    dependencyReadiness,
    runtimeTrace,
    contract,
    tests,
    implementation,
    verification,
    review,
    delivery,
  };
}
