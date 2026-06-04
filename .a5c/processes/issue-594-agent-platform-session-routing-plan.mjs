/**
 * @process repo/issue-594-agent-platform-session-routing-plan
 * @description Implement issue #594: close remaining agent-platform session-management and routing wiring gaps.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranchName: string, verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], audit: object, strategy: object, implementation: object, verification: object, review: object, delivery: object }
 *
 * Planning research performed before authoring:
 * - gh issue view 594 --json title,body,labels,comments
 * - gh pr list --head plan/issue-594 --json number,title,state,url,baseRefName,headRefName
 * - gh pr view 717 --json files,title,body,comments,headRefOid,baseRefOid,url
 * - babysitter process-library:active --json
 * - babysitter skill:discover --process-path /home/runner/.a5c/process-library/babysitter-repo/library/specializations/sdk-platform-development/sdk-testing-strategy.js --json
 * - babysitter skill:discover --process-path /home/runner/.a5c/process-library/babysitter-repo/library/specializations/qa-testing-automation/quality-gates.js --json
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-layer-gaps.md
 * - packages/genty/platform/src/harness/internal/createRun/planProcess/runState.ts
 * - packages/genty/platform/src/harness/internal/createRun/planProcess/prompts.ts
 * - packages/genty/platform/src/harness/internal/createRun/orchestration/{effects,dispatch,index,internalPhase}.ts
 * - packages/genty/platform/src/session/{context,history,cost}.ts
 * - packages/genty/platform/src/compression/compaction.ts
 * - packages/genty/platform/src/cost/effectCost.ts
 * - packages/genty/platform/src/harness/{capabilityRouter,modelSelection,fallbackChains,selectionPolicies}.ts
 * - /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/{spec-kit-brownfield,plan-and-execute}.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/superpowers/{test-driven-development,verification-before-completion}.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/specializations/sdk-platform-development/{sdk-testing-strategy,backward-compatibility-management,compatibility-testing}.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/specializations/qa-testing-automation/quality-gates.js
 *
 * @process methodologies/spec-kit-brownfield
 * @process methodologies/plan-and-execute
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/sdk-platform-development/sdk-testing-strategy
 * @process specializations/sdk-platform-development/backward-compatibility-management
 * @process specializations/qa-testing-automation/quality-gates
 *
 * Repo policy note: direct babysitter:call processes in this repo should avoid
 * kind: "shell" subtasks unless the user explicitly asks for a shell-oriented
 * workflow. This process uses agent tasks for research, implementation,
 * verification, review, and GitHub delivery. Concrete commands are supplied as
 * task instructions and inputs.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

function phases(includeDelivery = false) {
  return [
    'phase-0-reuse-audit',
    'issue-and-process-library-research',
    'current-state-reconciliation',
    'integration-strategy',
    'regression-tests',
    'implementation-loop',
    'verification',
    'review',
    'final-acceptance',
    ...(includeDelivery ? ['delivery'] : []),
  ];
}

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 594;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const implementationBranchName = inputs?.implementationBranchName ?? 'agent/issue-594-session-routing';

  const reuseAudit = await ctx.task(reuseAuditTask, { inputs, issueNumber }, {
    key: 'issue-594.phase-0-reuse-audit',
  });

  const issueAndLibrary = await ctx.task(issueAndLibraryResearchTask, {
    inputs,
    issueNumber,
    reuseAudit,
  }, {
    key: 'issue-594.issue-and-library-research',
  });

  const currentState = await ctx.task(reconcileCurrentStateTask, {
    inputs,
    issueNumber,
    reuseAudit,
    issueAndLibrary,
  }, {
    key: 'issue-594.current-state-reconciliation',
  });

  const strategy = await ctx.task(strategyTask, {
    inputs,
    issueNumber,
    reuseAudit,
    issueAndLibrary,
    currentState,
  }, {
    key: 'issue-594.integration-strategy',
  });

  if (strategy?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #594 Integration Decision',
      question: strategy.question || 'A maintainer decision is required before wiring the remaining session/routing gaps. How should the run proceed?',
      options: [
        'Proceed with compatibility-preserving staged integration',
        'Pause for maintainer guidance',
      ],
      expert: 'owner',
      tags: ['issue-594', 'agent-platform', 'architecture-decision'],
      context: {
        runId: ctx.runId,
        issueNumber,
        currentState,
        strategy,
      },
    });
  }

  const regressionTests = await ctx.task(regressionTestsTask, {
    inputs,
    issueNumber,
    issueAndLibrary,
    currentState,
    strategy,
  }, {
    key: 'issue-594.regression-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt += 1) {
    implementation = await ctx.task(implementRemainingGapsTask, {
      inputs,
      issueNumber,
      currentState,
      strategy,
      regressionTests,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-594.implementation.${attempt}`,
    });

    verification = await ctx.task(verificationTask, {
      inputs,
      issueNumber,
      currentState,
      strategy,
      regressionTests,
      implementation,
      attempt,
    }, {
      key: `issue-594.verification.${attempt}`,
    });

    review = await ctx.task(reviewTask, {
      inputs,
      issueNumber,
      issueAndLibrary,
      currentState,
      strategy,
      regressionTests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-594.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalAcceptance = await ctx.task(finalAcceptanceTask, {
    inputs,
    issueNumber,
    issueAndLibrary,
    currentState,
    strategy,
    regressionTests,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-594.final-acceptance',
  });

  if (finalAcceptance?.passed !== true) {
    await ctx.breakpoint({
      title: 'Issue #594 Quality Gate Blocked',
      question: 'The implementation did not satisfy the final acceptance gate. Stop for maintainer review, or approve one manual follow-up attempt?',
      options: [
        'Stop and report blocked quality gate',
        'Approve one manual follow-up attempt',
      ],
      expert: 'owner',
      tags: ['issue-594', 'agent-platform', 'quality-gate'],
      context: {
        runId: ctx.runId,
        issueNumber,
        finalAcceptance,
        attempts,
      },
    });

    return {
      success: false,
      phases: phases(false),
      reuseAudit,
      issueAndLibrary,
      currentState,
      strategy,
      regressionTests,
      implementation,
      verification,
      review,
      attempts,
      finalAcceptance,
    };
  }

  const delivery = await ctx.task(deliveryTask, {
    issueNumber,
    baseBranch,
    implementationBranchName,
    finalAcceptance,
    implementation,
    verification,
    review,
  }, {
    key: 'issue-594.delivery',
  });

  return {
    success: true,
    phases: phases(true),
    reuseAudit,
    issueAndLibrary,
    currentState,
    strategy,
    regressionTests,
    implementation,
    verification,
    review,
    attempts,
    finalAcceptance,
    delivery,
  };
}

export const reuseAuditTask = defineTask('issue-594.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 - Reuse audit for session and routing gaps',
  labels: ['issue-594', 'reuse-audit', 'agent-platform'],
  agent: {
    name: 'codebase-researcher',
    prompt: {
      role: 'senior repository researcher',
      task: 'Run the required Phase 0 reuse audit before issue #594 implementation planning.',
      instructions: [
        'Do not edit files.',
        'Start your output with exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract keyword nouns and verbs from issue #594: session context, plan phase injection, session history, decision trail, run summary, context snapshot, compaction, cost budget, capability router, model selection, fallback chains, selection policies, task dispatch, orchestration loop, resolveTaskHarness.',
        'Honor .a5c/reuse-audit.json if it exists. If it does not exist, record that and use the target files and keywords in inputs.',
        'Scan for matching migrations, API routes, CLI/env variables, package scripts, SDK dependencies, imports, tests, and existing integration surfaces.',
        'Specifically inspect packages/genty/platform/src/session, packages/genty/platform/src/compression, packages/genty/platform/src/cost, packages/genty/platform/src/harness/internal/createRun, packages/genty/platform/src/harness/{capabilityRouter,modelSelection,fallbackChains,selectionPolicies}.ts, and docs/agent-layer-gaps.md.',
        'Call out current wiring that already exists so implementation does not duplicate or regress it.',
        'Return JSON: { heading, keywords, existingInfrastructure, matchingFiles, existingTests, alreadyWiredSurfaces, suspectedRemainingGaps, conflictsOrDuplicates, reusablePatterns }.',
        'INPUTS JSON:',
        JSON.stringify(args.inputs ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const issueAndLibraryResearchTask = defineTask('issue-594.issue-and-library-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #594 and process-library methodology references',
  labels: ['issue-594', 'context', 'process-library'],
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Babysitter process-library researcher and agent-platform maintainer',
      task: 'Read the authoritative issue context and select applicable process-library methods.',
      instructions: [
        'Do not edit files.',
        `Run gh issue view ${args.issueNumber} --json title,body,labels,comments and preserve the issue title, labels, body, and all comments.`,
        `Check whether #${args.issueNumber} is also a PR before reading PR-only fields. If it is a PR, run gh pr view ${args.issueNumber} --json files,title,body,comments; if it is an issue only, record that and do not treat a gh pr view failure as blocking.`,
        'Record that the local project path .a5c/process-library may be absent; use /home/runner/.a5c/process-library/babysitter-repo/library as the active shared process-library when present.',
        'Research process-library references for brownfield integration, plan-and-execute, TDD, verification-before-completion, SDK testing, backward compatibility, compatibility testing, and quality gates.',
        'Apply docs/agent-reference/process-authoring.md, especially the direct babysitter:call rule to avoid kind: shell subtasks unless explicitly requested.',
        'Summarize related issue comments: #580 MCP wiring dependency, #578 cost tracking dependency, prior closed planning PR #657, and any note that implementation may already be in progress or stale.',
        'Return JSON: { issue, isPullRequest, relatedIssues, priorPlanPr, processLibraryRoot, references, applicablePatterns, repoPolicyConstraints, recommendedProcessShape, breakpointPolicy, qualityGatePattern }.',
        'REUSE AUDIT JSON:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reconcileCurrentStateTask = defineTask('issue-594.reconcile-current-state', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reconcile issue #594 claims against current agent-platform source',
  labels: ['issue-594', 'current-state', 'architecture'],
  agent: {
    name: 'agent-platform-architect',
    prompt: {
      role: 'senior TypeScript orchestration architect',
      task: 'Determine which issue #594 gaps are still live in the current branch.',
      instructions: [
        'Do not edit files.',
        'Trace current code paths before proposing changes. The issue may be stale because adjacent work has already wired parts of the reported gaps.',
        'Inspect planProcess session binding and prompt construction: packages/genty/platform/src/harness/internal/createRun/planProcess/runState.ts, prompts.ts, phase.ts, index.ts, and createRun tests.',
        'Inspect live orchestration and effect dispatch: packages/genty/platform/src/harness/internal/createRun/orchestration/effects.ts, dispatch.ts, internalPhase.ts, externalPhase.ts, internalTools.ts, and related tests.',
        'Inspect session persistence helpers and tests: session/context.ts, session/history.ts, session/cost.ts, session/types.ts, and session/__tests__.',
        'Inspect compaction and cost helpers: compression/compaction.ts, cost/effectCost.ts, and their tests.',
        'Inspect routing helpers and call sites: harness/capabilityRouter.ts, modelSelection.ts, fallbackChains.ts, selectionPolicies.ts, utils resolveTaskHarness, tasks-mux routing, and dispatch tests.',
        'Run static searches for addDecision, addRunSummary, saveContextSnapshot, getSessionContext, checkBudget, updateSessionCost, enforceSessionBudgetForRun, shouldAutoCompact, compactSession, resolveModelForTask, resolveFallbackHarness, evaluatePolicy, getPolicyByName, selectHarness, and buildTaskRequirements.',
        'Classify each reported gap as already wired, partially wired, still missing, or obsolete because superseded by newer architecture.',
        'Return JSON: { liveGapMatrix, callPaths, existingTests, staleClaims, remainingGaps, compatibilityConstraints, targetFiles, risks, recommendedSlices }.',
        'ISSUE AND LIBRARY JSON:',
        JSON.stringify(args.issueAndLibrary ?? {}, null, 2),
        'REUSE AUDIT JSON:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const strategyTask = defineTask('issue-594.strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design staged integration strategy for remaining #594 gaps',
  labels: ['issue-594', 'strategy', 'agent-platform'],
  agent: {
    name: 'software-architect',
    prompt: {
      role: 'senior agent-platform architecture maintainer',
      task: 'Create a compatibility-preserving staged implementation strategy for issue #594.',
      instructions: [
        'Do not edit files.',
        'Use a flat phase-list strategy because the issue describes known integration gaps, not an unknown root-cause investigation.',
        'Do not blindly reimplement modules that are already wired. Base the strategy on currentState.liveGapMatrix.',
        'Plan testable vertical slices in this order:',
        '1. Session context injection into plan phase prompts: read existing session context after binding/resolution and make notes/sharedKnowledge/worktree visible to planning without leaking unrelated sessions.',
        '2. Session history capture: record decisions, run summaries, and context snapshots from the live orchestration loop or terminal transition points, using the existing history helpers.',
        '3. Cost budget enforcement: verify current cost overlay behavior; if incomplete, wire configured budgets so no-budget runs preserve old behavior, alerts are not repeatedly emitted, and auto-pause only happens for explicit budgets.',
        '4. Compaction triggering: verify current compaction overlay behavior; if incomplete, invoke shouldAutoCompact/compactSession from state size estimates without mutating original journals/tasks.',
        '5. Capability/model/fallback/policy routing: integrate capabilityRouter, modelSelection, fallbackChains, and selectionPolicies into task dispatch only where task metadata opts in or where it preserves resolveTaskHarness as the compatibility baseline.',
        'Include stale-doc reconciliation if docs/agent-layer-gaps.md still claims surfaces are missing after implementation.',
        'Identify any maintainer decision that is genuinely required, especially if policy-based routing would change default harness choice. Otherwise set needsMaintainerDecision false.',
        'Return JSON: { recommendedDesign, slicePlan, targetFiles, testPlan, compatibilityDefaults, budgetBehavior, compactionBehavior, routingBehavior, docsPlan, risks, needsMaintainerDecision, question }.',
        'CURRENT STATE JSON:',
        JSON.stringify(args.currentState ?? {}, null, 2),
        'ISSUE AND LIBRARY JSON:',
        JSON.stringify(args.issueAndLibrary ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const regressionTestsTask = defineTask('issue-594.regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author focused failing regression tests for remaining #594 gaps',
  labels: ['issue-594', 'tdd', 'tests'],
  agent: {
    name: 'tdd-guide',
    prompt: {
      role: 'senior TypeScript test engineer for event-sourced orchestration',
      task: 'Add or update focused regression tests before production changes.',
      instructions: [
        'Edit tests only unless a test helper fixture must be added next to tests.',
        'Preserve unrelated local changes. Do not stage or revert unrelated files.',
        'Use currentState.remainingGaps and strategy.slicePlan to avoid adding tests for behavior that already passes unless the test freezes a compatibility baseline.',
        'Cover session context injection into planProcess prompt construction with a fake stateDir/sessionId, including notes, sharedKnowledge, and worktree context. Verify unrelated or missing context does not crash planning.',
        'Cover live session history capture by proving addDecision/addRunSummary/saveContextSnapshot are invoked or persisted from orchestration terminal/decision paths, not only in helper unit tests.',
        'Cover budget enforcement only for configured budgets: no-budget runs do not pause; explicit autoPause budget can pause or return a blocked result with a clear reason; triggered thresholds are not re-emitted every iteration.',
        'Cover compaction triggering based on estimated state size and config; assert compaction writes overlays and preserves original journal/task artifacts.',
        'Cover routing policy opt-in: task metadata/execution preferences use capability/model/policy/fallback helpers; existing resolveTaskHarness behavior remains the default when no policy metadata is present.',
        'Use deterministic fakes and dependency injection where practical. Do not require provider credentials, network access, live MCP servers, or a real external harness.',
        'Run the focused tests in red mode where practical and capture expected failure signals.',
        'Return JSON: { changedFiles, testsAdded, compatibilityBaselines, redCommands, expectedFailuresBeforeImplementation, coverageMap, notes }.',
        'STRATEGY JSON:',
        JSON.stringify(args.strategy ?? {}, null, 2),
        'CURRENT STATE JSON:',
        JSON.stringify(args.currentState ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementRemainingGapsTask = defineTask('issue-594.implement-remaining-gaps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement remaining session and routing wiring gaps',
  labels: ['issue-594', 'implementation', 'agent-platform'],
  agent: {
    name: 'agent-platform-implementer',
    prompt: {
      role: 'senior TypeScript maintainer for agent-platform orchestration',
      task: 'Implement issue #594 against the staged strategy and regression tests.',
      instructions: [
        'Edit the repository directly.',
        'Preserve unrelated local changes and do not stage or revert them.',
        `This is implementation attempt ${args.attempt}.`,
        'Keep changes scoped to packages/genty/platform source/tests and docs/agent-layer-gaps.md only if stale gap documentation must be corrected.',
        'Implement only gaps still live after the current-state reconciliation. If a gap is already wired, strengthen tests or docs instead of duplicating code.',
        'Session context: use the existing getSessionContext/updateSessionContext types and bind/resolution path. Inject context into planProcess prompt construction in a bounded, readable section. Missing/corrupt context must preserve existing behavior.',
        'Session history: wire addDecision/addRunSummary/saveContextSnapshot at live orchestration decision and terminal summary points. Avoid noisy per-effect spam; capture meaningful decisions, summaries, and context snapshots with run/session IDs.',
        'Cost budgets: reuse updateSessionCost/checkBudget/markThresholdsTriggered/enforceSessionBudgetForRun where appropriate. Preserve no-budget behavior, and only pause or block orchestration when an explicit budget with autoPause requires it.',
        'Compaction: reuse shouldAutoCompact/compactSession and existing config types. Estimate state size from real orchestration state or artifacts, and write overlay state only.',
        'Routing: integrate capabilityRouter/modelSelection/fallbackChains/selectionPolicies into the dispatch or harness-selection path through explicit task metadata/execution policy. Preserve resolveTaskHarness as the compatibility baseline for tasks without routing metadata.',
        'Update docs/agent-layer-gaps.md only to accurately reflect implemented or partially implemented status after tests prove the behavior.',
        'Return JSON: { changedFiles, summary, slicesCompleted, compatibilityBehavior, testsUpdated, docsUpdated, risks, commitMessage }.',
        'REGRESSION TESTS JSON:',
        JSON.stringify(args.regressionTests ?? {}, null, 2),
        'STRATEGY JSON:',
        JSON.stringify(args.strategy ?? {}, null, 2),
        'CURRENT STATE JSON:',
        JSON.stringify(args.currentState ?? {}, null, 2),
        'PREVIOUS VERIFICATION JSON:',
        JSON.stringify(args.previousVerification ?? {}, null, 2),
        'PREVIOUS REVIEW JSON:',
        JSON.stringify(args.previousReview ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verificationTask = defineTask('issue-594.verify', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run issue #594 quality gates',
  labels: ['issue-594', 'verification', 'quality-gate'],
  agent: {
    name: 'cicd-test-integration',
    prompt: {
      role: 'senior CI verification engineer',
      task: 'Run and interpret the issue #594 verification gates.',
      instructions: [
        'Run the concrete commands supplied in inputs.verificationCommands plus any narrower focused checks required by changed files.',
        'At minimum, run focused agent-platform tests that cover createRun planProcess, orchestration/effects, dispatch, session context/history/cost, compaction, and harness routing helpers.',
        'Also run git diff --check, npm run build --workspace=@a5c-ai/genty-platform when available, npm run test --workspace=@a5c-ai/genty-platform when available, npm run build:sdk, npm run test:sdk, npm run verify:v6:seams, and npm run verify:metadata unless the command is unavailable in this checkout. Record exact unavailable-command evidence.',
        'Verify no-budget orchestration behavior remains compatible and explicit budget auto-pause behavior is gated by configuration.',
        'Verify compaction overlays never mutate original journals/tasks.',
        'Verify default task routing remains resolveTaskHarness-compatible when no routing policy metadata exists.',
        'Verify docs/agent-layer-gaps.md does not continue to say fully wired behavior is missing, while preserving honest partial-gap notes.',
        'Return JSON: { passed, commandsRun: [{ command, exitCode, evidence }], focusedCoverage, failures, unavailableCommands, residualRisk, changedFiles }.',
        'INPUT VERIFICATION COMMANDS:',
        JSON.stringify(args.inputs?.verificationCommands ?? [], null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'STRATEGY JSON:',
        JSON.stringify(args.strategy ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewTask = defineTask('issue-594.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review issue #594 implementation for compatibility and scope',
  labels: ['issue-594', 'review', 'spec-compliance'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'senior code reviewer focused on deterministic orchestration systems',
      task: 'Review the issue #594 implementation for bugs, regressions, and missing tests.',
      instructions: [
        'Inspect the git diff and relevant source paths.',
        'Lead with blocking findings ordered by severity, with file/line references.',
        'Compare the implementation to issue #594, related comments, currentState.liveGapMatrix, and strategy.compatibilityDefaults.',
        'Reject if session context leaks across sessions, corrupt/missing context crashes planning, history capture spams low-value events, budget checks pause no-budget runs, compaction mutates source-of-truth journals/tasks, or routing changes default harness selection without opt-in metadata.',
        'Reject if tests require live network/provider credentials or only exercise helper functions while live orchestration paths remain untested.',
        'Check docs changes for stale or overbroad claims.',
        'Return JSON: { approved, findings, requiredChanges, summary, residualRisks }.',
        'CURRENT STATE JSON:',
        JSON.stringify(args.currentState ?? {}, null, 2),
        'STRATEGY JSON:',
        JSON.stringify(args.strategy ?? {}, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceTask = defineTask('issue-594.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #594',
  labels: ['issue-594', 'acceptance', 'quality-gate'],
  agent: {
    name: 'spec-reviewer',
    prompt: {
      role: 'release-minded agent-platform maintainer',
      task: 'Decide whether the issue #594 implementation is ready for PR delivery.',
      instructions: [
        'Read the final diff, issue context, current-state reconciliation, implementation notes, verification evidence, and review findings.',
        'Acceptance requires either implementation or proven/stale reconciliation for each original gap: plan-phase session context, session history, compaction trigger, cost budget enforcement, capability router, model selection, fallback chains, and selection policies.',
        'Acceptance requires focused tests for every changed live path and explicit compatibility coverage for no-budget runs, compaction overlays, and default harness routing.',
        'Acceptance requires broad verification commands to pass or have precise environment-only unavailable evidence.',
        'Return JSON: { passed, changedFiles, acceptance: string[], blockers: string[], residualRisk: string[], prSummary: string, issueComment: string }.',
        'ISSUE AND LIBRARY JSON:',
        JSON.stringify(args.issueAndLibrary ?? {}, null, 2),
        'CURRENT STATE JSON:',
        JSON.stringify(args.currentState ?? {}, null, 2),
        'STRATEGY JSON:',
        JSON.stringify(args.strategy ?? {}, null, 2),
        'REGRESSION TESTS JSON:',
        JSON.stringify(args.regressionTests ?? {}, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
        'REVIEW JSON:',
        JSON.stringify(args.review ?? {}, null, 2),
        'ATTEMPTS JSON:',
        JSON.stringify(args.attempts ?? [], null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliveryTask = defineTask('issue-594.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Commit, push, create PR, and comment on issue #594',
  labels: ['issue-594', 'delivery', 'github'],
  agent: {
    name: 'delivery-agent',
    prompt: {
      role: 'repository delivery agent',
      task: 'Deliver the completed issue #594 implementation through GitHub.',
      instructions: [
        'Inspect git status and stage only files related to issue #594.',
        'Do not stage unrelated local changes, secrets, generated logs, run artifacts, or planning-only files from a different branch.',
        `Commit on branch ${args.implementationBranchName} using the implementation commit message from finalAcceptance or implementation.`,
        `Push ${args.implementationBranchName} to origin.`,
        `Create a PR against ${args.baseBranch} with a title that links to issue #${args.issueNumber} and a body summarizing phases, tests, quality gates, compatibility behavior, and residual risk.`,
        `Post a comment on issue #${args.issueNumber} with the implementation summary, verification evidence, residual risk, and PR link.`,
        'Return JSON: { committed, commitSha, prUrl, issueCommentUrl, stagedFiles, summary }.',
        'FINAL ACCEPTANCE JSON:',
        JSON.stringify(args.finalAcceptance ?? {}, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
        'REVIEW JSON:',
        JSON.stringify(args.review ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
