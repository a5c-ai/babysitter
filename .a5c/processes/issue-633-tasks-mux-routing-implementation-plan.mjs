/**
 * @process issue-633-tasks-mux-routing-implementation-plan
 * @description Plan and execute issue #633 with an idempotent audit: SDK and agent-platform task effect resolution must route through tasks-mux.
 * @inputs {
 *   issueNumber: number,
 *   baseBranch: string,
 *   dependencyIssues: number[],
 *   designDocs: string[],
 *   maxImplementationIterations: number,
 *   verificationCommands: string[]
 * }
 * @outputs { success: boolean, reuseAudit: object, runtimeCallPaths: object, plan: object, verification: object, delivery: object }
 *
 * Process-library research:
 * - .a5c/process-library/ was not present in this checkout; use the repository's SDK-managed library/ tree per docs/user-guide/features/process-library.md.
 * - library/processes/shared/runtime-call-tracer.js
 * - library/processes/shared/tdd-triplet.js
 * - library/processes/shared/completeness-gate.js
 * - specializations/sdk-platform-development/sdk-testing-strategy
 * - specializations/sdk-platform-development/cli-tool-development
 * - specializations/qa-testing-automation/contract-testing
 * - babysitter/tdd-quality-convergence
 * - docs/agent-reference/process-authoring.md
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Design docs already exist under docs/agent-mux-babysitter-integrations/, including tasks-mux-routing.md, effect-resolution.md, and testing.md.
 * - tasks-mux already exposes ResponderType, routeTask, AgentMuxResponderBackend, ExternalTrackerBackend, and BreakpointBackend seams on the current checkout.
 * - Current staging has routeTask in packages/tasks-mux/src/router.ts, AgentMuxResponderBackend in packages/tasks-mux/src/backends/agent-mux.ts, and ExternalTrackerBackend in packages/tasks-mux/src/backends/external-tracker.ts.
 * - Current staging has agent-platform resolveEffect delegating routable agent effects through tasks-mux in packages/tula-platform/src/harness/internal/createRun/orchestration/effects.ts.
 * - agent-platform already imports/mocks routeTask and AgentMuxResponderBackend in createRun orchestration tests, so implementation must audit current behavior before adding duplicate routing layers.
 * - SDK stop-hook continuation already references routeTask/isHostDelegableRoute, so plugin-mode work should be verified against that live path rather than recreating a separate decision path.
 * - Current staging has SDK task responderType serialization/validation in packages/sdk/src/tasks/types.ts, packages/sdk/src/tasks/defineTask.ts, and packages/sdk/src/tasks/kinds/index.ts.
 * - Existing process .a5c/processes/issue-633-route-effect-resolution-through-tasks-mux.mjs covers a broad implementation flow. This process is a fresh, plan-scoped artifact for issue #633 with an explicit completed-work audit and current-staging gap analysis.
 *
 * Repo-specific authoring note:
 * - Per docs/agent-reference/process-authoring.md, this process uses agent tasks for implementation and verification phases and keeps breakpoints sparse.
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

function io(taskCtx) {
  return {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  };
}

export async function process(inputs, ctx) {
  const {
    issueNumber = 633,
    baseBranch = "staging",
    dependencyIssues = [630, 631],
    designDocs = [
      "docs/agent-mux-babysitter-integrations/tasks-mux-routing.md",
      "docs/agent-mux-babysitter-integrations/effect-resolution.md",
      "docs/agent-mux-babysitter-integrations/testing.md",
    ],
    maxImplementationIterations = 2,
    verificationCommands = [],
  } = inputs;

  const issueContext = await ctx.task(readIssueAndDesignContextTask, {
    issueNumber,
    baseBranch,
    dependencyIssues,
    designDocs,
  }, { key: "phase-0.issue-and-design-context" });

  const reuseAudit = await ctx.task(reuseAndCompletionAuditTask, {
    issueNumber,
    issueContext,
    designDocs,
  }, { key: "phase-0.reuse-and-completion-audit" });

  const runtimeCallPaths = await ctx.task(traceRuntimeCallPathsTask, {
    issueNumber,
    issueContext,
    reuseAudit,
  }, { key: "phase-1.runtime-call-paths" });

  const implementationPlan = await ctx.task(authorGapPlanTask, {
    issueNumber,
    issueContext,
    reuseAudit,
    runtimeCallPaths,
  }, { key: "phase-2.gap-plan" });

  const planReview = await ctx.task(reviewGapPlanTask, {
    issueNumber,
    issueContext,
    reuseAudit,
    runtimeCallPaths,
    implementationPlan,
  }, { key: "phase-2.plan-review" });

  if (planReview.requiresOwnerDecision === true) {
    await ctx.breakpoint({
      title: `Issue #${issueNumber} Scope Decision`,
      question: "The plan review found a dependency, merge-state, or scope decision that should not be guessed. Choose the approved path before implementation starts.",
      context: {
        runId: ctx.runId,
        issueNumber,
        decisionNeeded: planReview.decisionNeeded,
        options: planReview.options,
      },
    }, {
      breakpointId: "issue-633.scope-decision",
      tags: ["issue-633", "tasks-mux", "scope"],
      strategy: "single",
    });
  }

  const testPlan = await ctx.task(authorRegressionTestsTask, {
    issueNumber,
    issueContext,
    reuseAudit,
    runtimeCallPaths,
    implementationPlan,
    planReview,
  }, { key: "phase-3.tests-first" });

  const iterations = [];
  let converged = false;
  for (let iteration = 1; iteration <= maxImplementationIterations && !converged; iteration += 1) {
    const implementation = await ctx.task(implementGapPlanTask, {
      issueNumber,
      iteration,
      implementationPlan,
      testPlan,
      priorIterations: iterations,
    }, { key: `phase-4.implementation.${iteration}` });

    const verification = await ctx.task(runQualityGateTask, {
      issueNumber,
      iteration,
      implementationPlan,
      testPlan,
      implementation,
      verificationCommands,
    }, { key: `phase-5.quality-gate.${iteration}` });

    const review = await ctx.task(reviewImplementationTask, {
      issueNumber,
      iteration,
      issueContext,
      reuseAudit,
      runtimeCallPaths,
      implementationPlan,
      testPlan,
      implementation,
      verification,
    }, { key: `phase-6.review.${iteration}` });

    iterations.push({ iteration, implementation, verification, review });
    converged = verification.passed === true && review.approved === true;
  }

  const delivery = await ctx.task(finalAcceptanceAndDeliveryTask, {
    issueNumber,
    issueContext,
    reuseAudit,
    runtimeCallPaths,
    implementationPlan,
    testPlan,
    iterations,
    converged,
  }, { key: "phase-7.final-acceptance" });

  return {
    success: delivery.readyForPr === true,
    issueNumber,
    baseBranch,
    reuseAudit,
    runtimeCallPaths,
    plan: implementationPlan,
    testPlan,
    verification: iterations.at(-1)?.verification ?? null,
    delivery,
    metadata: {
      processId: "issue-633-tasks-mux-routing-implementation-plan",
      completedAt: ctx.now().toISOString(),
    },
  };
}

export const readIssueAndDesignContextTask = defineTask("issue-633.read-issue-and-design-context", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 0 - Read authoritative issue and design context",
  labels: ["issue-633", "phase-0", "context"],
  agent: {
    name: "tasks-mux-context-reader",
    prompt: {
      role: "senior maintainer collecting authoritative planning context",
      task: "Read issue #633, all comments, labels, dependency issues, and the design docs before planning implementation.",
      instructions: [
        "Do not edit files in this phase.",
        "Use gh issue view for issue #633 and dependency issues #630 and #631.",
        "Capture the issue title, labels, body, comments, dependency correction comments, existing plan PR comments, and any implementation-complete comments.",
        "Read each design doc path from inputs and summarize only the parts that affect task routing through tasks-mux.",
        "Explicitly distinguish stale design-doc direct agent-mux language from the current issue requirement: tasks-mux owns routing decisions.",
        "Return JSON with issueSummary, dependencyStatus, currentComments, designRequirements, staleOrSupersededRequirements, and artifactPath.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));

export const reuseAndCompletionAuditTask = defineTask("issue-633.reuse-and-completion-audit", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 0 - Reuse and completion audit",
  labels: ["issue-633", "phase-0", "reuse-audit", "idempotency"],
  agent: {
    name: "tasks-mux-reuse-auditor",
    prompt: {
      role: "brownfield implementation auditor",
      task: "Run the mandatory reuse audit and determine whether issue #633 is absent, partial, or already implemented on the current checkout.",
      instructions: [
        "Start the report with exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).",
        "Do not edit files in this phase.",
        "Extract keywords: tasks-mux, routeTask, ResponderType, AgentMuxResponderBackend, BreakpointBackend, ExternalTrackerBackend, orchestrateIteration, resolveAndPostEffect, stop-hook, agent-core, agent-mux, tracker, human, internal.",
        "Scan package dependencies and imports in packages/tasks-mux, packages/sdk, packages/tula-platform, plugins/babysitter, and plugins/babysitter-unified.",
        "Scan environment variables relevant to AMUX, BMUX, AGENT_SESSION_ID, AGENT_PLUGIN_ROOT, and AGENT_CAPABILITIES_JSON.",
        "Scan docs and tests for existing tasks-mux routing coverage.",
        "Classify every matching seam as reusable, implemented-but-needs-verification, missing, stale, or off-path.",
        "If the current checkout already implements a requirement, plan verification and hardening instead of duplicating code.",
        "Return JSON with findings, existingInfrastructure, implementationState, missingGaps, verificationGaps, offPathRisks, and artifactPath.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));

export const traceRuntimeCallPathsTask = defineTask("issue-633.trace-runtime-call-paths", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 1 - Trace live runtime call paths",
  labels: ["issue-633", "phase-1", "runtime-call-paths"],
  agent: {
    name: "sdk-runtime-tracer",
    prompt: {
      role: "TypeScript runtime integration engineer",
      task: "Trace the live call paths where task effects are created, surfaced, routed, resolved, posted, and continued.",
      instructions: [
        "Do not edit files in this phase.",
        "Trace SDK ctx.task/orchestrateIteration/run:iterate task effect creation and continuation.",
        "Trace agent-platform createRun orchestration, including resolveAndPostEffect and resolveEffect paths.",
        "Trace plugin stop-hook continuation logic and host-delegation decisions.",
        "Trace tasks-mux routeTask, backend registry, AgentMuxResponderBackend, BreakpointBackend, and ExternalTrackerBackend surfaces.",
        "Record file/function hops for each flow: internal, agent, human, tracker, auto, unavailable fallback, and error posting.",
        "Mark files that are live edit candidates, live test candidates, and files that should be avoided because they are docs-only or superseded.",
        "Return JSON with runtimeCallPaths, liveEditCandidates, liveTestCandidates, offPathFilesToAvoid, dependencyCycleRisks, and artifactPath.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));

export const authorGapPlanTask = defineTask("issue-633.author-gap-plan", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 2 - Author implementation or hardening plan",
  labels: ["issue-633", "phase-2", "planning"],
  agent: {
    name: "tasks-mux-implementation-planner",
    prompt: {
      role: "senior TypeScript architect",
      task: "Produce the concrete implementation plan for issue #633 based on the reuse audit and runtime traces.",
      instructions: [
        "Do not edit implementation files in this phase.",
        "If a required behavior is already implemented, plan verification, regression coverage, or cleanup only where evidence shows a gap.",
        "Plan tasks-mux as the single routing decision layer for internal, agent, human, tracker, and auto/unavailable responder flows.",
        "Plan SDK and agent-platform changes only on traced live execution paths.",
        "Plan plugin stop-hook behavior to query tasks-mux before host delegation decisions.",
        "Avoid new direct SDK-to-agent-mux or agent-platform-to-agent-mux routing paths for task effects.",
        "Avoid package dependency cycles; prefer existing tasks-mux exports and dynamic/import-local seams where needed.",
        "Return JSON with phases, acceptanceCriteria, sourceChanges, testChanges, nonGoals, risks, rollbackNotes, and artifactPath.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));

export const reviewGapPlanTask = defineTask("issue-633.review-gap-plan", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 2 - Review plan against issue and reuse audit",
  labels: ["issue-633", "phase-2", "quality-gate", "review"],
  agent: {
    name: "tasks-mux-plan-reviewer",
    prompt: {
      role: "adversarial architecture reviewer",
      task: "Review the implementation plan for drift, duplication, dependency mistakes, and missing #633 acceptance coverage.",
      instructions: [
        "Reject plans that duplicate existing tasks-mux routing infrastructure instead of extending or verifying it.",
        "Reject direct task-effect routing to agent-mux outside tasks-mux.",
        "Reject source changes outside traced live call paths unless the plan justifies a new seam from the issue or design docs.",
        "Verify the plan accounts for issue comments saying dependencies changed to #630 and #631 and implementation may already exist in PR #685.",
        "Set requiresOwnerDecision only for real dependency, merge-state, or scope ambiguity.",
        "Return JSON with approved, issues, requiredRevisions, requiresOwnerDecision, decisionNeeded, options, and summary.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));

export const authorRegressionTestsTask = defineTask("issue-633.author-regression-tests", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 3 - Author tests before source changes",
  labels: ["issue-633", "phase-3", "tdd", "tests"],
  agent: {
    name: "tasks-mux-tdd-engineer",
    prompt: {
      role: "senior TypeScript test engineer",
      task: "Add or harden regression tests before changing production code.",
      instructions: [
        "Do not implement production source code in this phase.",
        "Author tests from issue #633, comments, design docs, reuse audit, and runtime call paths rather than from desired implementation shortcuts.",
        "Cover tasks-mux routeTask decisions for internal, agent, human, tracker, auto, and unavailable tracker cases.",
        "Cover agent-platform effect resolution delegating routable task effects through tasks-mux and preserving result/error posting semantics.",
        "Cover plugin stop-hook continuation using tasks-mux route decisions before deciding host delegation.",
        "Cover SDK-facing task metadata preservation only if reuse audit finds an uncovered gap.",
        "Add guard assertions that fail when SDK or agent-platform bypass tasks-mux to route task effects directly to agent-mux.",
        "Use mocks for agent-mux, human responders, and external trackers.",
        "Return JSON with testsAdded, testsModified, behaviorsCovered, expectedRedOrHardeningResults, focusedCommands, and artifactPath.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));

export const implementGapPlanTask = defineTask("issue-633.implement-gap-plan", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 4 - Implement scoped gap plan",
  labels: ["issue-633", "phase-4", "implementation"],
  agent: {
    name: "tasks-mux-routing-implementer",
    prompt: {
      role: "senior TypeScript monorepo engineer",
      task: "Implement only the remaining issue #633 gaps identified by the approved plan and tests.",
      instructions: [
        "Use the approved plan, reuse audit, runtime call paths, and tests as the only implementation scope.",
        "If the tests reveal the current checkout already satisfies a behavior, do not rewrite it.",
        "Route task effect decisions through tasks-mux routeTask and backend decisions.",
        "Keep internal responder flow on the agent-core route, agent responder flow on AgentMuxResponderBackend, human flow on BreakpointBackend, and tracker flow on ExternalTrackerBackend or explicit unavailable evidence.",
        "Preserve existing result posting, journal, cancellation, timeout, and error semantics.",
        "Do not introduce broad refactors, feature flags, compatibility aliases, or unrelated documentation churn.",
        "Return JSON with changedFiles, behaviorChanges, testsRun, dependencyChanges, skippedBecauseAlreadyImplemented, risks, and artifactPath.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));

export const runQualityGateTask = defineTask("issue-633.run-quality-gate", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 5 - Run quality gates",
  labels: ["issue-633", "phase-5", "verification", "quality-gate"],
  agent: {
    name: "tasks-mux-quality-gate-runner",
    prompt: {
      role: "release engineer",
      task: "Run focused and broad verification for issue #633 and report exact pass/fail evidence.",
      instructions: [
        "Run every focused command from the test plan and every verification command from inputs that applies to the checkout.",
        "At minimum, cover tasks-mux tests/typecheck/build, agent-platform tests, npm run test:sdk, npm run verify:metadata, npm run validate:processes when process artifacts changed, and git diff --check.",
        "Do not mark a command as passed unless it exited successfully.",
        "If a command is skipped, state the exact reason and residual risk.",
        "Fix only issue #633-scoped failures when the fix is obvious and on a traced live path; otherwise return passed=false with failure evidence.",
        "Return JSON with passed, commandsRun, failures, fixesApplied, skipped, residualRisk, and artifactPath.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));

export const reviewImplementationTask = defineTask("issue-633.review-implementation", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 6 - Review implementation and tests",
  labels: ["issue-633", "phase-6", "review", "quality-gate"],
  agent: {
    name: "tasks-mux-adversarial-reviewer",
    prompt: {
      role: "adversarial code reviewer for SDK, agent-platform, and tasks-mux routing",
      task: "Review the diff against issue #633, issue comments, design docs, runtime call paths, tests, and verification evidence.",
      instructions: [
        "Reject any direct task-effect routing around tasks-mux.",
        "Reject dependency cycles or package-surface changes that make tasks-mux depend on higher-level orchestration packages.",
        "Reject tests that only mirror implementation and do not enforce issue behavior.",
        "Verify internal, agent, human, tracker, and unavailable responder cases are covered by code and tests.",
        "Verify plugin stop-hook behavior asks tasks-mux before host delegation decisions.",
        "Verify existing implemented behavior was preserved and no off-path files changed without justification.",
        "Return JSON with approved, findings, acceptanceStatus, testAdequacy, dependencyRisks, requiredFixes, and residualRisks.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));

export const finalAcceptanceAndDeliveryTask = defineTask("issue-633.final-acceptance-and-delivery", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 7 - Final acceptance and delivery notes",
  labels: ["issue-633", "phase-7", "delivery"],
  agent: {
    name: "tasks-mux-delivery-reviewer",
    prompt: {
      role: "release owner preparing final handoff",
      task: "Compare final artifacts to issue #633 and produce delivery notes.",
      instructions: [
        "Do not modify implementation files in this phase.",
        "Compare the issue requirements directly against the final diff and verification evidence.",
        "Confirm the PR links #633 and mentions dependency issue state for #630 and #631.",
        "Summarize phases completed, files changed, tests run, skipped checks, residual risk, and follow-up issues if any.",
        "Return readyForPr=false if any required acceptance criterion lacks implementation or test evidence.",
        "Return JSON with readyForPr, acceptanceSummary, changedFiles, verificationSummary, residualRisks, prBody, issueComment, and artifactPath.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));
