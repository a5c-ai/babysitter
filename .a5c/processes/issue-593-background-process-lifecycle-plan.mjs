/**
 * @process repo/issue-593-background-process-lifecycle-plan
 * @description Current-state-aware implementation plan for issue #593: agent-runtime background process lifecycle gaps.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, processEntry: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], reuseAudit: object, runtimeCallPaths: array, implementation: object, verification: object, finalGate: object }
 *
 * Authored from:
 * - GitHub issue #593 title/body/labels/comments
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-layer-gaps.md
 * - packages/agent-runtime/src/backgroundProcessRegistry.ts
 * - packages/agent-runtime/src/__tests__/backgroundProcessRegistry.test.ts
 * - packages/agent-runtime/src/background/state.ts
 * - packages/agent-runtime/src/execution/modes/local.ts
 * - packages/agent-runtime/src/daemon/lifecycle.ts
 * - packages/agent-runtime/src/daemon/loop.ts
 * - library/methodologies/pilot-shell/pilot-shell-feature.js
 * - library/methodologies/planning-with-files/planning-orchestrator.js
 * - library/methodologies/feature-driven-development/feature-driven-development.js
 * - library/processes/shared/tdd-triplet.js
 * - library/processes/shared/completeness-gate.js
 * - library/reference/ADVANCED_PATTERNS.md
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Current staging already has a canonical BackgroundProcessRegistry at packages/agent-runtime/src/backgroundProcessRegistry.ts.
 * - Current staging already includes output byte metadata, process-group/direct-child termination, pause/resume methods, dependency queueing, lifecycle hooks, and focused registry tests.
 * - Do not create a second process manager or duplicate registry state. Treat issue #593 as a remaining-gap and acceptance-hardening effort against the existing registry and adjacent live call paths.
 * - Daemon lifecycle and daemon queue behavior remain adjacent surfaces; only change them if runtime tracing proves they are on the issue #593 live path and not broader crash-recovery/durable-queue scope.
 *
 * Repo policy note: direct Babysitter processes in this repository should avoid
 * kind: 'shell' tasks unless explicitly requested. Verification is delegated to
 * agents, which must run the listed commands and report command, exit code, and
 * relevant output verbatim.
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent plan-reviewer methodologies/pilot-shell/agents/plan-reviewer/AGENT.md
 * @agent spec-guard methodologies/pilot-shell/agents/spec-guard/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueSpec = await ctx.task(readIssueSpecTask, inputs, {
    key: 'issue-593.read-issue-spec',
  });

  const reuseAudit = await ctx.task(reuseAndRemainingGapAuditTask, {
    inputs,
    issueSpec,
  }, {
    key: 'issue-593.reuse-and-remaining-gap-audit',
  });

  const runtimeTrace = await ctx.task(traceRuntimeCallPathsTask, {
    inputs,
    issueSpec,
    reuseAudit,
  }, {
    key: 'issue-593.runtime-call-path-trace',
  });

  const acceptanceMatrix = await ctx.task(authorAcceptanceMatrixTask, {
    inputs,
    issueSpec,
    reuseAudit,
    runtimeTrace,
  }, {
    key: 'issue-593.acceptance-matrix',
  });

  const testPlan = await ctx.task(authorRegressionPlanTask, {
    inputs,
    issueSpec,
    reuseAudit,
    runtimeTrace,
    acceptanceMatrix,
  }, {
    key: 'issue-593.regression-plan',
  });

  const designReview = await ctx.task(reviewImplementationPlanTask, {
    inputs,
    issueSpec,
    reuseAudit,
    runtimeTrace,
    acceptanceMatrix,
    testPlan,
  }, {
    key: 'issue-593.plan-review',
  });

  if (designReview?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #593 Scope Or Lifecycle Contract Decision',
      question: designReview.question,
      options: [
        'Proceed with recommended issue #593 scope',
        'Pause for maintainer guidance',
      ],
      expert: 'maintainer',
      tags: ['issue-593', 'agent-runtime', 'scope-gate'],
      context: {
        runId: ctx.runId,
        designReview,
      },
    });
  }

  let implementation = null;
  let verification = null;
  let compatibilityReview = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementRemainingGapsTask, {
      inputs,
      issueSpec,
      reuseAudit,
      runtimeTrace,
      acceptanceMatrix,
      testPlan,
      designReview,
      previousVerification: verification,
      previousCompatibilityReview: compatibilityReview,
      attempt,
    }, {
      key: `issue-593.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueSpec,
      runtimeTrace,
      acceptanceMatrix,
      testPlan,
      implementation,
      attempt,
    }, {
      key: `issue-593.verification.${attempt}`,
    });

    compatibilityReview = await ctx.task(reviewCompatibilityAndScopeTask, {
      inputs,
      issueSpec,
      reuseAudit,
      runtimeTrace,
      acceptanceMatrix,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-593.compatibility-review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, compatibilityReview });

    if (verification?.passed === true && compatibilityReview?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalSpecGuardTask, {
    inputs,
    issueSpec,
    reuseAudit,
    runtimeTrace,
    acceptanceMatrix,
    testPlan,
    designReview,
    implementation,
    verification,
    compatibilityReview,
    attempts,
  }, {
    key: 'issue-593.final-spec-guard',
  });

  if (finalGate?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #593 Final Acceptance Decision',
      question: finalGate.question,
      options: [
        'Accept documented remaining scope',
        'Pause for maintainer guidance',
      ],
      expert: 'maintainer',
      tags: ['issue-593', 'agent-runtime', 'final-gate'],
      context: {
        runId: ctx.runId,
        finalGate,
      },
    });
  }

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-spec-read',
      'reuse-and-remaining-gap-audit',
      'runtime-call-path-trace',
      'acceptance-matrix',
      'regression-plan',
      'plan-review',
      'remaining-gap-implementation',
      'verification-loop',
      'compatibility-and-scope-review',
      'final-spec-guard',
    ],
    reuseAudit,
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    acceptanceMatrix,
    testPlan,
    designReview,
    implementation,
    verification,
    compatibilityReview,
    attempts,
    finalGate,
  };
}

export const readIssueSpecTask = defineTask('issue-593.read-issue-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #593 source of truth',
  labels: ['issue-context', 'agent-runtime', 'background-processes'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior agent-runtime maintainer',
      task: 'Read issue #593 and capture the authoritative implementation scope.',
      instructions: [
        `Run gh issue view ${args.issueNumber} --json title,body,labels,comments.`,
        `If #${args.issueNumber} resolves as a PR, also run gh pr view ${args.issueNumber} --json files,title,body,comments.`,
        'Read docs/agent-layer-gaps.md for the referenced background process lifecycle gap entry.',
        'Keep the raw issue body and comment observations available in your task output so downstream tasks can compare against source text rather than summaries.',
        'Return JSON with: title, labels, rawIssueBody, comments, acceptanceCriteria, explicitNonGoals, relatedIssues, riskLevel, and openQuestions.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAndRemainingGapAuditTask = defineTask('issue-593.reuse-and-remaining-gap-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 reuse audit and remaining-gap scan',
  labels: ['phase:0', 'reuse-audit', 'agent-runtime'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'brownfield TypeScript runtime architect',
      task: 'Audit existing infrastructure before planning any new implementation for issue #593.',
      instructions: [
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Use the issueSpec.rawIssueBody and issueSpec.comments from the input JSON as the spec source.',
        'Search for BackgroundProcessRegistry, BackgroundTaskRecord, stdout/stderr retention, dropped byte metadata, signal forwarding, process groups, pause/resume, dependency queueing, lifecycle hooks, daemon lifecycle, and local executor destroy behavior.',
        'Inspect package dependencies and exports before proposing any new SDK/library/API surface.',
        'Classify each issue requirement as already implemented, partially implemented, missing, unclear, or out of scope.',
        'If current staging already implements a requirement, plan verification and documentation hardening instead of duplicate code.',
        'Return JSON with: findingsMarkdown, existingInfrastructure, requirementStatus, remainingGaps, duplicateInfrastructureRisks, recommendedScope.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceRuntimeCallPathsTask = defineTask('issue-593.trace-runtime-call-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace live background process runtime call paths',
  labels: ['runtime-trace', 'agent-runtime', 'brownfield'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'runtime call-path analyst',
      task: 'Trace the live execution paths affected by issue #593 before implementation.',
      instructions: [
        'Trace from public exports and bash/background invocation seams into BackgroundProcessRegistry.spawn(), stream listeners, completion, cancel(), killAll(), dispose(), pause(), resume(), dependency handling, and lifecycle hooks.',
        'Trace adjacent LocalExecutor.destroy, daemon lifecycle stop, and daemon loop queue paths only enough to decide whether they are live scope for this issue or adjacent non-goals.',
        'Record exact file paths and function/type names. Do not propose edits outside traced live paths unless the final output marks them as docs/tests only.',
        'Return JSON with: runtimeCallPaths, publicApiSurfaces, adjacentButOutOfScopePaths, filesAllowedForImplementation, filesAllowedForTests, docsAllowed.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorAcceptanceMatrixTask = defineTask('issue-593.acceptance-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create acceptance matrix from issue text',
  labels: ['acceptance', 'spec', 'agent-runtime'],
  agent: {
    name: 'spec-guard',
    prompt: {
      role: 'acceptance criteria auditor',
      task: 'Convert issue #593 into a traceable acceptance matrix.',
      instructions: [
        'Use only issueSpec.rawIssueBody, issueSpec.comments, reuseAudit.requirementStatus, and runtimeTrace.runtimeCallPaths from the input JSON.',
        'For each criterion, cite the issue source as body/comment/label and name the live file path that will prove or implement it.',
        'Include criteria for lifecycle states, graceful signal forwarding, bounded stdout/stderr retention and metadata, dependency ordering, lifecycle hooks, pause/resume semantics, and daemon/session scope boundaries.',
        'Mark any currently implemented criterion as verification-required, not implementation-required.',
        'Return JSON with: criteria, nonGoals, openDecisions, requiredTests, requiredDocs, passFailRules.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionPlanTask = defineTask('issue-593.regression-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author test-first regression plan',
  labels: ['testing', 'tdd', 'agent-runtime'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'TypeScript runtime test strategist',
      task: 'Plan regression tests before any production changes.',
      instructions: [
        'Use acceptanceMatrix.requiredTests and runtimeTrace.filesAllowedForTests from the input JSON.',
        'Prefer extending packages/agent-runtime/src/__tests__/backgroundProcessRegistry.test.ts unless runtimeTrace proves a separate suite is necessary.',
        'Design tests that fail for missing issue behavior, not fixture timing or platform assumptions.',
        'Use fake spawn/process-kill seams where practical; do not require Docker, SSH, Kubernetes, root privileges, or a real process tree for core gates.',
        'Include platform-gated expectations for POSIX process groups and Windows/direct-child fallback.',
        'Return JSON with: redPhaseTests, fixtureStrategy, platformMatrix, commandsToRun, expectedInitialFailures, riskControls.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewImplementationPlanTask = defineTask('issue-593.review-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review plan for scope, compatibility, and deadlock risk',
  labels: ['plan-review', 'compatibility', 'agent-runtime'],
  agent: {
    name: 'plan-reviewer',
    prompt: {
      role: 'skeptical runtime plan reviewer',
      task: 'Review the issue #593 plan before implementation.',
      instructions: [
        'Compare issueSpec, reuseAudit, runtimeTrace, acceptanceMatrix, and testPlan from the input JSON.',
        'Reject duplicate background-process infrastructure, untraced source edits, broad daemon crash-recovery scope, hidden log loss, or dependency/hook behavior that can deadlock silently.',
        'Require a maintainer breakpoint only for real public API semantics, unsupported-platform behavior, or explicit scope expansion.',
        'Return JSON with: approved, blockingIssues, needsMaintainerDecision, question, recommendedAdjustments.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementRemainingGapsTask = defineTask('issue-593.implement-remaining-gaps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement only remaining issue #593 gaps',
  labels: ['implementation', 'agent-runtime', 'background-processes'],
  agent: {
    name: 'platform-architect',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    prompt: {
      role: 'senior TypeScript runtime implementer',
      task: 'Implement the issue #593 remaining gaps identified by the audited plan.',
      instructions: [
        'Do not edit source until tests from testPlan.redPhaseTests are added or confirmed already present.',
        'Modify only runtimeTrace.filesAllowedForImplementation plus required tests/docs unless you can justify a traced live-path addition in the task output.',
        'Reuse BackgroundProcessRegistry and existing ExecutionPolicy/resource seams; do not create a second process manager.',
        'Keep daemon pause/resume and crash recovery out of scope unless acceptanceMatrix and designReview explicitly approve it.',
        'After changes, report changedFiles, testsAdded, productionChanges, docsChanges, deferredItems, and any commands run with exact exit codes.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-593.verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run issue #593 verification gate',
  labels: ['verification', 'tests', 'agent-runtime'],
  agent: {
    name: 'test-coverage-analyzer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    prompt: {
      role: 'verification engineer',
      task: 'Run deterministic verification for issue #593 and report pass/fail.',
      instructions: [
        'Run every command listed in inputs.verificationCommands unless the command is invalid for the current package layout; if invalid, report the exact replacement and why.',
        'At minimum, cover focused BackgroundProcessRegistry tests, agent-runtime package tests/build, and npm run verify:metadata.',
        'Report exact command, exit code, and concise relevant output for each command.',
        'Map failures back to acceptanceMatrix.criteria and testPlan.expectedInitialFailures.',
        'Return JSON with: passed, commandResults, failedCriteria, missingCoverage, recommendedNextFixes.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewCompatibilityAndScopeTask = defineTask('issue-593.compatibility-scope-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review compatibility, race conditions, and scope boundaries',
  labels: ['review', 'compatibility', 'scope-control'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'agent-runtime compatibility auditor',
      task: 'Review implementation for public API safety, runtime races, and issue scope fidelity.',
      instructions: [
        'Inspect changed files and verification output from the input JSON.',
        'Check stream truncation metadata, signal escalation idempotency, pause/resume platform gating, dependency cycle/skip behavior, lifecycle hook failure recording, and docs claims.',
        'Flag any unapproved expansion into crash recovery, sandboxing, observability exporters, or cross-package deduplication.',
        'Return JSON with: approved, blockingIssues, compatibilityRisks, raceRisks, documentationFindings, requiredFixes.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalSpecGuardTask = defineTask('issue-593.final-spec-guard', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final issue #593 spec guard',
  labels: ['final-gate', 'spec-guard', 'agent-runtime'],
  agent: {
    name: 'spec-guard',
    prompt: {
      role: 'final acceptance auditor',
      task: 'Compare the issue #593 spec to the final artifacts directly.',
      instructions: [
        'Compare issueSpec.rawIssueBody and issueSpec.comments to acceptanceMatrix, implementation, verification, and compatibilityReview from the input JSON.',
        'Ignore narrative claims from prior context if artifacts or command results contradict them.',
        'Pass only if every in-scope criterion is implemented or already present, tested, documented where appropriate, and verified.',
        'Require a maintainer decision for any unresolved criterion that is being deferred.',
        'Return JSON with: passed, perCriterionStatus, changedFiles, verificationSummary, unresolvedItems, needsMaintainerDecision, question.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
