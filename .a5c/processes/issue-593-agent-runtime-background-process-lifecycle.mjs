/**
 * @process repo/issue-593-agent-runtime-background-process-lifecycle
 * @description Plan and execute issue #593: close agent-runtime background process lifecycle gaps for state transitions, signals, stream backpressure, dependencies, hooks, and pause/resume semantics.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: array, verification: object, review: object, finalGate: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-layer-gaps.md
 * - packages/agent-runtime/src/backgroundProcessRegistry.ts
 * - packages/agent-runtime/src/__tests__/backgroundProcessRegistry.test.ts
 * - packages/agent-runtime/src/daemon/lifecycle.ts
 * - packages/agent-runtime/src/daemon/loop.ts
 * - packages/agent-runtime/src/execution/modes/local.ts
 * - library/methodologies/pilot-shell/pilot-shell-feature.js
 * - library/methodologies/planning-with-files/planning-orchestrator.js
 * - library/methodologies/feature-driven-development/feature-driven-development.js
 * - library/processes/shared/tdd-triplet.js
 * - library/processes/shared/completeness-gate.js
 *
 * Repo policy note: this process intentionally uses agent tasks rather than
 * shell tasks to respect docs/agent-reference/process-authoring.md for direct
 * Babysitter workflows in this repository. Verification agents must run the
 * listed commands directly and report exact command, exit code, and output.
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - BackgroundProcessRegistry already exists in packages/agent-runtime/src/backgroundProcessRegistry.ts.
 * - The registry already accepts ExecutionPolicy, validates cwd/env policy, tracks completion, cancel, killAll, dispose, and supports injectable spawnFn for tests.
 * - Stream retention caps are partially implemented through maxOutputBytes, stdoutTruncated, and stderrTruncated; broader backpressure accounting and lifecycle semantics remain incomplete.
 * - Existing focused tests live in packages/agent-runtime/src/__tests__/backgroundProcessRegistry.test.ts and should be extended before adding new test suites.
 * - LocalExecutor and daemon lifecycle have separate process kill semantics that must be reviewed for shared signal/escalation behavior without accidentally widening this issue into the full executor sandboxing scope of #590 or deduplication scope of #600.
 * - Daemon loop has an in-memory queue and no first-class trigger dependency ordering or lifecycle hook contract.
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent plan-reviewer methodologies/pilot-shell/agents/plan-reviewer/AGENT.md
 * @agent spec-guard methodologies/pilot-shell/agents/spec-guard/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-593.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-593.reuse-audit',
  });

  const runtimeTrace = await ctx.task(traceBackgroundRuntimeTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-593.runtime-trace',
  });

  const lifecycleDesign = await ctx.task(authorLifecycleDesignTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeTrace,
  }, {
    key: 'issue-593.lifecycle-design',
  });

  const regressionPlan = await ctx.task(authorRegressionCoverageTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeTrace,
    lifecycleDesign,
  }, {
    key: 'issue-593.regression-coverage',
  });

  const designReview = await ctx.task(reviewLifecycleDesignTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeTrace,
    lifecycleDesign,
    regressionPlan,
  }, {
    key: 'issue-593.design-review',
  });

  if (designReview?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #593 Lifecycle Semantics Need Maintainer Decision',
      question: designReview.question,
      options: ['Proceed with recommended lifecycle contract', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-593', 'agent-runtime', 'background-processes'],
      context: {
        runId: ctx.runId,
        designReview,
      },
    });
  }

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementLifecycleHardeningTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeTrace,
      lifecycleDesign,
      regressionPlan,
      designReview,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-593.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      runtimeTrace,
      lifecycleDesign,
      regressionPlan,
      implementation,
      attempt,
    }, {
      key: `issue-593.verification.${attempt}`,
    });

    review = await ctx.task(reviewLifecycleImplementationTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeTrace,
      lifecycleDesign,
      regressionPlan,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-593.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeTrace,
    lifecycleDesign,
    regressionPlan,
    designReview,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-593.final-acceptance',
  });

  if (finalGate?.needsHumanDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #593 Final Acceptance Needs Maintainer Decision',
      question: finalGate.question,
      options: ['Proceed with recommended scope', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-593', 'agent-runtime', 'final-acceptance'],
      context: {
        runId: ctx.runId,
        finalGate,
        attempts: attempts.length,
      },
    });
  }

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit',
      'background-runtime-call-path-trace',
      'lifecycle-contract-design',
      'regression-coverage',
      'design-review',
      'incremental-implementation',
      'verification-loop',
      'compatibility-review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    reuseAudit,
    runtimeTrace,
    lifecycleDesign,
    regressionPlan,
    designReview,
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-593.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #593 and related background process context',
  labels: ['agent-runtime', 'background-processes', 'research', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter runtime maintainer',
      task: 'Read the GitHub issue and produce the authoritative scope for issue #593.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Use the issue body, every comment, and labels as the source of truth.',
        'Inspect docs/agent-layer-gaps.md only for agent-runtime background process entries and adjacent daemon lifecycle entries.',
        'Inspect related issues #585, #590, #591, #592, and #600 only enough to identify scope boundaries and avoid duplicating their work.',
        'Preserve raw issue observations separately from your summary so downstream tasks can compare against them.',
        'Return JSON: { title, labels, rawIssueSummary, commentsSummary, relatedIssues, acceptanceCriteria, explicitNonGoals, affectedFilesFromIssue, riskLevel, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-593.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 reuse audit for background process infrastructure',
  labels: ['agent-runtime', 'background-processes', 'reuse-audit', 'phase:0'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript monorepo architecture analyst',
      task: 'Perform the repo-required Phase 0 reuse audit before proposing new background lifecycle infrastructure.',
      instructions: [
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract keyword nouns and verbs from the issue: BackgroundProcessRegistry, background process, state transitions, paused, resumed, zombie, stale, orphaned, signal forwarding, process group, SIGTERM, SIGKILL, grace timeout, backpressure, stdout, stderr, maxOutputBytes, dropped bytes, lifecycle hooks, preSpawn, postSpawn, preDestroy, postDestroy, dependencies, dependsOn, daemon pause, daemon resume.',
        'Search the repo for matching implementations, tests, package exports, docs, API types, and imports. Honor .a5c/reuse-audit.json if present.',
        'Start with target files:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
        'Verify the current state of stream caps and tests; do not assume the issue comments are current if the code has moved.',
        'Identify existing helper functions or policy types from issue #590 and deduplication work from issue #600 that should be reused instead of creating competing contracts.',
        'Return JSON: { findingsMarkdown, existingInfrastructure, partialImplementations, missingInfrastructure, candidateTestFiles, packageBoundaryNotes, noNewInfrastructureNeeded, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceBackgroundRuntimeTask = defineTask('issue-593.trace-background-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace background process runtime call paths',
  labels: ['agent-runtime', 'runtime-trace', 'root-cause'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior runtime engineer',
      task: 'Map the live execution paths before any implementation changes.',
      instructions: [
        'Work from the issue context and reuse-audit JSON below. Inspect the current codebase directly.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse-audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Trace background process spawn from run_in_background tool entry points through getBackgroundRegistry, BackgroundProcessRegistry.spawn, stdout/stderr listeners, onComplete callbacks, snapshot/list/get, cancel, killAll, and dispose.',
        'Trace timeout handling and termination semantics in BackgroundProcessRegistry, LocalExecutor.destroy, daemon start/stop lifecycle, and daemon loop shutdown.',
        'Trace daemon queue handling from triggers through queue, activeRuns, drainQueue, status persistence, abort handling, and cleanup.',
        'Trace public type surfaces and exports that would be affected by adding lifecycle state, signal policy, backpressure metadata, dependency fields, lifecycle hooks, and pause/resume operations.',
        'Record runtimeCallPaths with entry point, files, functions, current behavior, planned touch points, and out-of-scope adjacent code.',
        'Return JSON: { rootCause, runtimeCallPaths, liveEntryPoints, publicApiSurfaces, currentStateModel, currentSignalModel, currentBackpressureModel, currentQueueModel, proposedTouchPoints, testsToAddOrUpdate, risks, outOfScope }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorLifecycleDesignTask = defineTask('issue-593.author-lifecycle-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design background lifecycle contract',
  labels: ['agent-runtime', 'background-processes', 'design'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'principal TypeScript runtime architect',
      task: 'Design the staged background process lifecycle contract for issue #593 before implementation.',
      instructions: [
        'Do not edit files in this task.',
        'Use the issue context, reuse audit, and runtime trace as the inputs. Keep the design scoped to agent-runtime unless compile contracts require minimal downstream updates.',
        'Design stream backpressure as an explicit policy: retained byte caps, dropped/truncated byte counters, per-stream metadata in snapshots and completion events, deterministic behavior when limits are exceeded, and no unbounded Buffer array growth.',
        'Design signal forwarding and graceful termination: process-group-aware behavior where supported, direct child fallback, grace timeout, escalation to SIGKILL, idempotent cancel/killAll/dispose, and Windows capability handling.',
        'Design lifecycle states and transitions: running, paused, resumed/running after resume, completed, exited, cancelled, killed, timed_out, stale, zombie/orphaned where supported. Define which states are public and which are internal diagnostics.',
        'Design pause/resume APIs separately from daemon start/stop. Note platform capability checks for SIGSTOP/SIGCONT or unsupported Windows behavior.',
        'Design dependency ordering and lifecycle hooks only to the level needed for this issue: dependency graph shape, cycle detection, dependency failure policy, pre/post spawn hooks, pre/post destroy hooks, hook timeout/failure behavior, and how hooks interact with cancellation.',
        'Call out decisions that genuinely require maintainer input. Keep breakpoints sparse.',
        'Return JSON: { lifecycleContract, stateMachine, streamPolicy, signalPolicy, pauseResumePolicy, dependencyPolicy, hookPolicy, apiChanges, compatibilityConstraints, testMatrix, stagedImplementationOrder, maintainerDecisions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionCoverageTask = defineTask('issue-593.author-regression-coverage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing regression coverage before implementation',
  labels: ['agent-runtime', 'background-processes', 'tests', 'tdd'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript runtime test engineer practicing strict TDD',
      task: 'Add focused failing regression tests for issue #593 before implementation changes.',
      instructions: [
        'You own test files only in this task. Do not modify implementation files.',
        'Use deterministic unit tests with mocked child_process.spawn, mocked streams, controllable timers, and platform capability seams. Do not require root privileges or real long-running child process trees unless an existing integration test pattern already supports it safely.',
        'Use the issue context, reuse audit, runtime trace, and lifecycle design JSON below as the spec source.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse-audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Lifecycle design JSON:',
        JSON.stringify(args.lifecycleDesign, null, 2),
        'Extend packages/agent-runtime/src/__tests__/backgroundProcessRegistry.test.ts where practical before adding a new suite.',
        'Add or update coverage for stream policy metadata: retained bytes, dropped/truncated byte counters, stdout/stderr independently capped, snapshot and completion event parity, and bounded memory behavior.',
        'Add coverage for termination semantics: process-group signal target when supported, direct-child fallback, grace timeout, SIGKILL escalation, idempotent cancel/killAll/dispose, and timeout status.',
        'Add coverage for lifecycle states and pause/resume capability gating, including unsupported platform behavior.',
        'Add coverage for dependency ordering, cycle detection, skipped/dependent failure behavior, and lifecycle hook success/timeout/failure policy if these APIs are added in the design.',
        'Run the relevant tests and confirm the new tests fail for the expected missing-lifecycle reasons, not syntax or fixture errors. The repo-specific process policy asks for agent tasks rather than shell subtasks, so run commands within this agent task and report exact command output.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, commandsRun, failureEvidence, failureMatchesIssue, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewLifecycleDesignTask = defineTask('issue-593.review-lifecycle-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review lifecycle design before implementation',
  labels: ['agent-runtime', 'architecture-review', 'background-processes'],
  agent: {
    name: 'plan-reviewer',
    prompt: {
      role: 'senior architecture reviewer',
      task: 'Validate that the issue #593 design is complete, staged, testable, and scoped.',
      instructions: [
        'Review the runtime trace, lifecycle design, and regression-test plan before implementation starts.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse-audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Lifecycle design JSON:',
        JSON.stringify(args.lifecycleDesign, null, 2),
        'Regression plan JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Challenge assumptions about public API compatibility, platform-dependent signals, Windows behavior, pause/resume semantics, hook failure policy, dependency deadlocks, and log-loss/backpressure policy.',
        'Approve only if tests are planned before implementation, runtime call paths are recorded, and the implementation remains focused on issue #593 instead of absorbing crash recovery, sandbox policy, observability, or cross-package deduplication work.',
        'If a maintainer decision is required, set needsMaintainerDecision true and provide one concise question with the recommended option first.',
        'Return JSON: { approved, issues, risks, revisionRequests, implementationOrder, compatibilityRequirements, needsMaintainerDecision, question }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementLifecycleHardeningTask = defineTask('issue-593.implement-lifecycle-hardening', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement background lifecycle hardening attempt ${args.attempt}`,
  labels: ['agent-runtime', 'background-processes', 'implementation'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter agent-runtime engineer',
      task: 'Implement issue #593 in staged, focused changes.',
      instructions: [
        'Edit the repository directly. Preserve unrelated worktree changes.',
        'Do not weaken or rewrite regression tests to fit the implementation.',
        'Keep implementation scoped to packages/agent-runtime unless downstream compile contracts require minimal type/export updates.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse-audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Lifecycle design JSON:',
        JSON.stringify(args.lifecycleDesign, null, 2),
        'Regression plan JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Design review JSON:',
        JSON.stringify(args.designReview, null, 2),
        'Previous verification JSON:',
        JSON.stringify(args.previousVerification, null, 2),
        'Previous review JSON:',
        JSON.stringify(args.previousReview, null, 2),
        'Implement in this order unless the design review says otherwise: stream metadata/backpressure, graceful termination and signal policy, lifecycle state transitions plus pause/resume capability checks, dependency ordering, lifecycle hooks, daemon/session integration docs if needed.',
        'For stream backpressure, preserve current maxOutputBytes behavior where valid and add missing counters/metadata without unbounded memory growth.',
        'For signal forwarding, use process-group behavior only where supported and make fallback semantics explicit and testable.',
        'For state transitions, keep public statuses compatible where possible and document new statuses in exported types and README/docs when they become public.',
        'For dependencies and hooks, avoid hidden deadlocks: add cycle detection, hook timeouts, explicit failure policy, and deterministic ordering.',
        'Update docs/agent-layer-gaps.md only for the issue #593 claims that are actually closed by this implementation.',
        'Return JSON: { changedFiles, summary, streamSemantics, signalSemantics, stateMachineSemantics, dependencyHookSemantics, docsUpdated, testsExpectedToPass, residualRisks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-593.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run verification gate for issue #593 attempt ${args.attempt}`,
  labels: ['agent-runtime', 'verification', 'tests'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior TypeScript verification engineer',
      task: 'Run the targeted and package-level verification gates and interpret failures.',
      instructions: [
        'Run the commands listed in inputs.verificationCommands. The repo-specific process policy asks for agent tasks rather than shell subtasks, so execute commands directly in this task and report exact command, exit code, and relevant output.',
        'Inputs verification commands:',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'Also run targeted tests named by the regression plan if they are not covered by the command list.',
        'Verify stream retention is bounded and exposes explicit retained/truncated/dropped metadata in snapshots and completion events.',
        'Verify cancel, killAll, dispose, timeout, process-group signal forwarding, grace timeout, and SIGKILL escalation behavior are tested without hanging the suite.',
        'Verify lifecycle states and pause/resume capability checks are deterministic on the current platform and do not break existing callers.',
        'Verify dependency ordering and lifecycle hooks have tests for success, failure, timeout, and cycle detection where those APIs were introduced.',
        'Verify docs were updated only for claims actually closed by the implementation.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Lifecycle design JSON:',
        JSON.stringify(args.lifecycleDesign, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Return JSON: { passed, commandsRun, failedCommands, targetedCoverage, docsCheck, unrelatedFailures, nextFixes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewLifecycleImplementationTask = defineTask('issue-593.review-lifecycle-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review background lifecycle implementation attempt ${args.attempt}`,
  labels: ['agent-runtime', 'review', 'compatibility'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior compatibility auditor for TypeScript runtimes',
      task: 'Review the issue #593 implementation for behavior, compatibility, and lifecycle regressions.',
      instructions: [
        'Review the implementation against the issue context, runtime trace, lifecycle design, regression plan, and verification output.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse-audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Lifecycle design JSON:',
        JSON.stringify(args.lifecycleDesign, null, 2),
        'Regression plan JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Check public API compatibility for BackgroundTaskRecord, BackgroundCompletionEvent, SpawnOptions, BackgroundProcessRegistry, daemon types, and exports.',
        'Check race conditions around close/error/timeout/cancel/killAll/dispose and ensure status transitions are idempotent.',
        'Check platform semantics for process groups, Windows unsupported pause/resume, and SIGSTOP/SIGCONT behavior.',
        'Check stream backpressure does not silently discard logs without surfaced metadata.',
        'Check dependencies and lifecycle hooks cannot deadlock or mask hook failures.',
        'Return JSON: { approved, findings, requiredFixes, compatibilityMatrix, residualRisks, needsHumanDecision, question }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-593.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #593',
  labels: ['agent-runtime', 'final-gate', 'spec-guard'],
  agent: {
    name: 'spec-guard',
    prompt: {
      role: 'spec completion guardian',
      task: 'Compare the issue requirements to the implementation artifacts directly and decide whether the run can complete.',
      instructions: [
        'Ignore any narrative in your context about how artifacts were built. Compare the issue context to the final implementation, verification, and review evidence.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse-audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Lifecycle design JSON:',
        JSON.stringify(args.lifecycleDesign, null, 2),
        'Regression plan JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Design review JSON:',
        JSON.stringify(args.designReview, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Compatibility review JSON:',
        JSON.stringify(args.review, null, 2),
        'Attempt history JSON:',
        JSON.stringify(args.attempts, null, 2),
        'Acceptance requires: tests-first evidence, runtime call paths recorded, bounded stream retention with surfaced metadata, process-group/direct-child signal semantics with grace/escalation, lifecycle state transitions including pause/resume capability behavior, dependency/hook semantics if implemented, targeted and package verification run, compatibility review approved, docs updated for closed gaps, and no unapproved expansion into crash recovery, sandboxing, observability, or cross-package deduplication.',
        'If a maintainer decision is required, set needsHumanDecision true and provide one concise question with the recommended option first.',
        'Return JSON: { passed, changedFiles, criteria, unresolvedItems, needsHumanDecision, question, releaseNotesCandidate }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
