/**
 * @process issue-633-route-effect-resolution-through-tasks-mux
 * @description SDK + agent-platform integration plan for routing all effect resolution through tasks-mux.
 * @inputs { issueNumber: number, branch: string, designDocPath: string, dependencyIssues: number[], targetQuality?: number, maxImplementationIterations?: number }
 * @outputs { success: boolean, runtimeCallPaths: object, qualityGates: object, artifacts: object }
 *
 * @process methodologies/pilot-shell/pilot-shell-feature
 * @process methodologies/atdd-tdd
 * @process processes/shared/completeness-gate
 * @agent plan-reviewer methodologies/pilot-shell/agents/plan-reviewer/AGENT.md
 * @agent spec-guard methodologies/pilot-shell/agents/spec-guard/AGENT.md
 * @agent unified-reviewer methodologies/pilot-shell/agents/unified-reviewer/AGENT.md
 * @agent tdd-enforcer methodologies/pilot-shell/agents/tdd-enforcer/AGENT.md
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

export async function process(inputs, ctx) {
  const {
    issueNumber = 633,
    branch = "staging",
    designDocPath = "docs/agent-mux-babysitter-integrations/tasks-mux-routing.md",
    dependencyIssues = [630, 631],
    targetQuality = 90,
    maxImplementationIterations = 3,
  } = inputs;

  const reuseAudit = await ctx.task(reuseAuditTask, {
    issueNumber,
    branch,
    designDocPath,
    dependencyIssues,
  }, { key: "phase-0.reuse-audit" });

  if (reuseAudit.needsBreakpoint === true) {
    await ctx.breakpoint({
      title: "Dependency or Scope Decision",
      question: "The reuse/dependency audit found unresolved prerequisite or scope ambiguity. Choose how to proceed before implementation.",
      context: {
        runId: ctx.runId,
        auditSummary: reuseAudit.summary,
        blockers: reuseAudit.blockers ?? [],
        options: [
          "Proceed only after prerequisite branches/PRs are merged",
          "Implement a minimal compatible seam in this issue",
          "Stop and ask the issue owner for clarification",
        ],
      },
    }, {
      breakpointId: "issue-633.dependency-or-scope-decision",
      tags: ["issue-633", "tasks-mux", "dependency"],
      strategy: "single",
    });
  }

  const callPathMap = await ctx.task(runtimeCallPathTask, {
    issueNumber,
    designDocPath,
    reuseAudit,
  }, { key: "phase-1.runtime-call-paths" });

  const implementationSpec = await ctx.task(implementationSpecTask, {
    issueNumber,
    designDocPath,
    reuseAudit,
    callPathMap,
  }, { key: "phase-2.implementation-spec" });

  const planReview = await ctx.task(planReviewTask, {
    issueNumber,
    implementationSpec,
    callPathMap,
    reuseAudit,
  }, { key: "phase-2.plan-review" });

  let approvedSpec = implementationSpec;
  if (planReview.approved !== true) {
    const refinement = await ctx.task(specRefinementTask, {
      issueNumber,
      implementationSpec,
      planReview,
      callPathMap,
    }, { key: "phase-2.spec-refinement" });
    approvedSpec = refinement.revisedSpec;
  }

  const testPlan = await ctx.task(testAuthoringTask, {
    issueNumber,
    designDocPath,
    implementationSpec: approvedSpec,
    callPathMap,
  }, { key: "phase-3.tests-first" });

  let iteration = 0;
  let converged = false;
  const implementationIterations = [];

  while (!converged && iteration < maxImplementationIterations) {
    iteration += 1;

    const implementation = await ctx.task(implementationTask, {
      issueNumber,
      iteration,
      implementationSpec: approvedSpec,
      testPlan,
      previousIterations: implementationIterations,
    }, { key: `phase-4.implementation.${iteration}` });

    const qualityGate = await ctx.task(qualityGateTask, {
      issueNumber,
      iteration,
      implementationSpec: approvedSpec,
      testPlan,
      implementation,
      targetQuality,
      requiredCommands: inputs.requiredCommands,
    }, { key: `phase-5.quality-gates.${iteration}` });

    const review = await ctx.task(integrationReviewTask, {
      issueNumber,
      iteration,
      implementationSpec: approvedSpec,
      testPlan,
      implementation,
      qualityGate,
      targetQuality,
    }, { key: `phase-6.integration-review.${iteration}` });

    implementationIterations.push({
      iteration,
      implementation,
      qualityGate,
      review,
    });

    converged = qualityGate.passed === true && review.approved === true && review.score >= targetQuality;

    if (!converged && iteration < maxImplementationIterations && review.requiresHumanDecision === true) {
      await ctx.breakpoint({
        title: `Issue #${issueNumber} Iteration ${iteration} Review`,
        question: "The integration review found a decision that should not be guessed. Review the notes and choose whether to continue refinement.",
        context: {
          runId: ctx.runId,
          iteration,
          reviewSummary: review.summary,
          blockingQuestions: review.blockingQuestions ?? [],
        },
      }, {
        breakpointId: `issue-633.iteration-${iteration}.manual-decision`,
        tags: ["issue-633", "tasks-mux", "review"],
        strategy: "single",
      });
    }
  }

  const finalVerification = await ctx.task(finalVerificationTask, {
    issueNumber,
    designDocPath,
    implementationSpec: approvedSpec,
    callPathMap,
    testPlan,
    implementationIterations,
    converged,
    targetQuality,
  }, { key: "phase-7.final-verification" });

  return {
    success: finalVerification.passed === true,
    issueNumber,
    branch,
    runtimeCallPaths: callPathMap.runtimeCallPaths,
    reuseAudit,
    implementationSpec: approvedSpec,
    testPlan,
    implementationIterations,
    qualityGates: finalVerification.qualityGates,
    artifacts: finalVerification.artifacts,
    metadata: {
      processId: "issue-633-route-effect-resolution-through-tasks-mux",
      completedAt: ctx.now().toISOString(),
      targetQuality,
      maxImplementationIterations,
    },
  };
}

export const reuseAuditTask = defineTask("issue-633/reuse-audit", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 0 - Reuse and dependency audit",
  agent: {
    name: "plan-reviewer",
    prompt: {
      role: "senior maintainer performing the mandatory reuse audit before implementation",
      task: "Audit existing infrastructure and prerequisite issue state for issue #633 before any implementation begins.",
      context: args,
      instructions: [
        "Start the report with exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).",
        "Read issue #633, all comments, labels, and the linked design document from the repository at runtime.",
        "Read dependency issues #630 and #631 and inspect whether their process PRs or implementation branches have landed in the current checkout.",
        "Extract keyword nouns and verbs from the issue: SDK, agent-platform, tasks-mux, routeTask, resolveAndPostEffect, orchestrateIteration, stop-hook, responderType, AgentMuxResponderBackend, BreakpointBackend, ExternalTrackerBackend, agent-core, amuxBridge.",
        "Scan for matching migrations, API routes, environment variables, SDK dependencies, package dependencies, exports, imports, and tests.",
        "Identify reusable existing seams and explicitly warn about missing or pseudo-code-only seams.",
        "Do not modify source files in this phase.",
      ],
      outputFormat: "JSON with summary, findings, reusableSeams, missingSeams, dependencyStatus, blockers, needsBreakpoint, artifactPath",
    },
    outputSchema: {
      type: "object",
      required: ["summary", "findings", "reusableSeams", "missingSeams", "dependencyStatus", "needsBreakpoint"],
      properties: {
        summary: { type: "string" },
        findings: { type: "array", items: { type: "object" } },
        reusableSeams: { type: "array", items: { type: "string" } },
        missingSeams: { type: "array", items: { type: "string" } },
        dependencyStatus: { type: "array", items: { type: "object" } },
        blockers: { type: "array", items: { type: "string" } },
        needsBreakpoint: { type: "boolean" },
        artifactPath: { type: "string" },
      },
    },
  },
  io: io(taskCtx),
  labels: ["issue-633", "reuse-audit", "planning"],
}));

export const runtimeCallPathTask = defineTask("issue-633/runtime-call-paths", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 1 - Trace live effect-resolution call paths",
  agent: {
    name: "context-monitor",
    prompt: {
      role: "runtime integration engineer",
      task: "Trace the current live execution paths for SDK, CLI orchestration, agent-platform internal orchestration, and plugin stop-hook effect resolution.",
      context: args,
      instructions: [
        "Trace from ctx.task effect creation through pending EffectAction output and each resolver that can post a result.",
        "Include the SDK run-loop path through packages/sdk/src/runtime/orchestrateIteration.ts and related task intrinsic helpers.",
        "Include CLI run:iterate and task:post surfaces in packages/sdk.",
        "Include agent-platform internal createRun orchestration, especially resolveEffect and resolveAndPostEffect paths.",
        "Include plugin stop-hook paths under plugins/babysitter and plugins/babysitter-unified, plus SDK hook-run tests if those are the active handler surface.",
        "Include tasks-mux backend/router/export paths that can own routing decisions.",
        "Record runtimeCallPaths as file/function hops. Scope later edits only to live execution paths unless the spec proves a new seam is required.",
        "Do not modify source files in this phase.",
      ],
      outputFormat: "JSON with runtimeCallPaths, candidateEditFiles, candidateTestFiles, offPathFilesToAvoid, openQuestions, artifactPath",
    },
    outputSchema: {
      type: "object",
      required: ["runtimeCallPaths", "candidateEditFiles", "candidateTestFiles", "offPathFilesToAvoid"],
      properties: {
        runtimeCallPaths: { type: "object" },
        candidateEditFiles: { type: "array", items: { type: "string" } },
        candidateTestFiles: { type: "array", items: { type: "string" } },
        offPathFilesToAvoid: { type: "array", items: { type: "string" } },
        openQuestions: { type: "array", items: { type: "string" } },
        artifactPath: { type: "string" },
      },
    },
  },
  io: io(taskCtx),
  labels: ["issue-633", "runtime-call-path", "brownfield"],
}));

export const implementationSpecTask = defineTask("issue-633/implementation-spec", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 2 - Author implementation spec",
  agent: {
    name: "plan-reviewer",
    prompt: {
      role: "senior architect writing an implementation spec from runtime evidence",
      task: "Convert issue #633 and the traced call paths into an implementation spec with acceptance criteria and file-level scope.",
      context: args,
      instructions: [
        "Read the issue and design document at runtime before writing acceptance criteria.",
        "Make the spec cover these required behaviors: SDK effect routing delegates to tasks-mux, CLI resolveAndPostEffect delegates to tasks-mux, plugin stop-hook mode queries tasks-mux before deciding host delegation, internal effects still resolve through agent-core, external agent effects resolve through AgentMuxResponderBackend, human effects resolve through BreakpointBackend, and tracker effects resolve through ExternalTrackerBackend when available.",
        "Reconcile the stale #620/#621 references with the current #630/#631 dependency comments.",
        "Define minimal public seams between SDK, agent-platform, and tasks-mux. Avoid package dependency cycles.",
        "List exact source files and tests likely to change, and explain why each is on a live call path.",
        "Do not implement source changes in this phase.",
      ],
      outputFormat: "JSON with goals, acceptanceCriteria, nonGoals, sourcePlan, testPlanSeed, dependencyAssumptions, risks, artifactPath",
    },
    outputSchema: {
      type: "object",
      required: ["goals", "acceptanceCriteria", "nonGoals", "sourcePlan", "testPlanSeed", "dependencyAssumptions", "risks"],
      properties: {
        goals: { type: "array", items: { type: "string" } },
        acceptanceCriteria: { type: "array", items: { type: "string" } },
        nonGoals: { type: "array", items: { type: "string" } },
        sourcePlan: { type: "array", items: { type: "object" } },
        testPlanSeed: { type: "array", items: { type: "object" } },
        dependencyAssumptions: { type: "array", items: { type: "string" } },
        risks: { type: "array", items: { type: "object" } },
        artifactPath: { type: "string" },
      },
    },
  },
  io: io(taskCtx),
  labels: ["issue-633", "implementation-spec", "planning"],
}));

export const planReviewTask = defineTask("issue-633/plan-review", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 2 - Challenge implementation spec",
  agent: {
    name: "plan-reviewer",
    prompt: {
      role: "adversarial architecture reviewer",
      task: "Review the implementation spec before code changes and block if it drifts from issue #633.",
      context: args,
      instructions: [
        "Verify every acceptance criterion maps to issue #633, its comments, or the routing design document.",
        "Verify the source plan edits only files on traced runtime call paths unless a new seam is explicitly justified.",
        "Reject direct SDK-to-agent-mux or agent-platform-to-amuxBridge routing that bypasses tasks-mux for task effects.",
        "Reject broad refactors, feature flags, or compatibility shims not required for the issue.",
        "Check package dependency direction for cycles before approving.",
      ],
      outputFormat: "JSON with approved, issues, requiredRevisions, dependencyCycleRisks, summary",
    },
    outputSchema: {
      type: "object",
      required: ["approved", "issues", "requiredRevisions", "summary"],
      properties: {
        approved: { type: "boolean" },
        issues: { type: "array", items: { type: "object" } },
        requiredRevisions: { type: "array", items: { type: "string" } },
        dependencyCycleRisks: { type: "array", items: { type: "string" } },
        summary: { type: "string" },
      },
    },
  },
  io: io(taskCtx),
  labels: ["issue-633", "plan-review", "quality-gate"],
}));

export const specRefinementTask = defineTask("issue-633/spec-refinement", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 2 - Refine implementation spec",
  agent: {
    name: "plan-reviewer",
    prompt: {
      role: "implementation planner",
      task: "Revise the implementation spec to satisfy the plan-review findings.",
      context: args,
      instructions: [
        "Address every required revision directly.",
        "Keep scope limited to issue #633.",
        "Preserve runtimeCallPaths and update only the file-level plan that changed.",
        "Do not implement source changes in this phase.",
      ],
      outputFormat: "JSON with revisedSpec, changesMade, remainingRisks, artifactPath",
    },
    outputSchema: {
      type: "object",
      required: ["revisedSpec", "changesMade", "remainingRisks"],
      properties: {
        revisedSpec: { type: "object" },
        changesMade: { type: "array", items: { type: "string" } },
        remainingRisks: { type: "array", items: { type: "string" } },
        artifactPath: { type: "string" },
      },
    },
  },
  io: io(taskCtx),
  labels: ["issue-633", "spec-refinement"],
}));

export const testAuthoringTask = defineTask("issue-633/tests-first", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 3 - Author failing tests before implementation",
  agent: {
    name: "tdd-enforcer",
    prompt: {
      role: "test engineer enforcing acceptance-test-first implementation",
      task: "Author focused failing tests for the issue #633 routing contract before implementation changes.",
      context: args,
      instructions: [
        "Do not implement production source code in this phase.",
        "Read issue #633 and the routing design document at runtime before writing tests.",
        "Create or update tests that fail against the current direct-resolution behavior and pass only when tasks-mux owns task routing decisions.",
        "Cover SDK/iteration behavior, CLI resolveAndPostEffect behavior, agent-platform internal orchestration, plugin stop-hook decision behavior, internal responder fallback, agent responder dispatch, human breakpoint routing, and tracker routing where the dependency seam exists.",
        "Mock tasks-mux routing/backends rather than invoking real external agents or humans.",
        "Include guard tests or assertions that prevent direct agent-mux routing from S../tula-platform task effect resolution paths.",
      ],
      outputFormat: "JSON with testsAdded, testsModified, expectedFailures, coverageMap, commandsToRun, artifactPath",
    },
    outputSchema: {
      type: "object",
      required: ["testsAdded", "testsModified", "expectedFailures", "coverageMap", "commandsToRun"],
      properties: {
        testsAdded: { type: "array", items: { type: "string" } },
        testsModified: { type: "array", items: { type: "string" } },
        expectedFailures: { type: "array", items: { type: "string" } },
        coverageMap: { type: "array", items: { type: "object" } },
        commandsToRun: { type: "array", items: { type: "string" } },
        artifactPath: { type: "string" },
      },
    },
  },
  io: io(taskCtx),
  labels: ["issue-633", "tests-first", "tdd"],
}));

export const implementationTask = defineTask("issue-633/implementation", (args, taskCtx) => ({
  kind: "agent",
  title: `Phase 4 - Implement tasks-mux routing iteration ${args.iteration}`,
  agent: {
    name: "coder",
    prompt: {
      role: "senior TypeScript engineer implementing a narrow brownfield integration",
      task: "Implement issue #633 by routing task effect resolution through tasks-mux without broad refactors.",
      context: args,
      instructions: [
        "Work only from the approved implementation spec, test plan, and runtime call paths.",
        "Make the minimum source changes needed for the tests to pass.",
        "Route S../tula-platform task effect resolution through tasks-mux instead of direct agent-mux or ad hoc resolver logic.",
        "Keep internal responder effects resolving through agent-core via the tasks-mux internal route.",
        "Keep external agent effects resolving through AgentMuxResponderBackend via tasks-mux.",
        "Keep human effects resolving through the existing BreakpointBackend path via tasks-mux.",
        "Keep tracker effects resolving through ExternalTrackerBackend only where that dependency surface exists; otherwise preserve an explicit unsupported/unavailable result as required by the spec.",
        "Preserve existing public APIs unless the approved spec identifies a required extension.",
        "Do not modify unrelated docs, generated artifacts, or package metadata unless required by the integration.",
      ],
      outputFormat: "JSON with filesModified, behaviorChanges, dependencyChanges, testsRun, knownIssues, artifactPath",
    },
    outputSchema: {
      type: "object",
      required: ["filesModified", "behaviorChanges", "dependencyChanges", "testsRun", "knownIssues"],
      properties: {
        filesModified: { type: "array", items: { type: "string" } },
        behaviorChanges: { type: "array", items: { type: "string" } },
        dependencyChanges: { type: "array", items: { type: "string" } },
        testsRun: { type: "array", items: { type: "object" } },
        knownIssues: { type: "array", items: { type: "string" } },
        artifactPath: { type: "string" },
      },
    },
  },
  io: io(taskCtx),
  labels: ["issue-633", "implementation", "tasks-mux"],
}));

export const qualityGateTask = defineTask("issue-633/quality-gates", (args, taskCtx) => ({
  kind: "agent",
  title: `Phase 5 - Run quality gates iteration ${args.iteration}`,
  agent: {
    name: "file-checker",
    prompt: {
      role: "release engineer running deterministic validation commands and reporting exact results",
      task: "Run the focused and broad validation commands for issue #633 and report pass/fail with command output summaries.",
      context: args,
      instructions: [
        "Run the commands listed in requiredCommands if provided; otherwise run the relevant focused tests from the test plan plus package-level gates for tasks-mux, SDK, and agent-platform.",
        "At minimum, validate targeted tests, package typecheck/build where available, `npm run test:sdk`, relevant agent-platform tests, relevant tasks-mux tests, `npm run verify:metadata`, and `git diff --check` unless the repository state makes a command inapplicable.",
        "Do not mark a command passed unless it exited successfully.",
        "If a command is skipped, provide the exact reason and the risk it leaves.",
        "Do not edit source code in this phase except for purely mechanical formatting required to satisfy the checked-in formatter if that is an established local command.",
      ],
      outputFormat: "JSON with passed, score, commands, failures, skipped, residualRisk, artifactPath",
    },
    outputSchema: {
      type: "object",
      required: ["passed", "score", "commands", "failures", "skipped", "residualRisk"],
      properties: {
        passed: { type: "boolean" },
        score: { type: "number" },
        commands: { type: "array", items: { type: "object" } },
        failures: { type: "array", items: { type: "object" } },
        skipped: { type: "array", items: { type: "object" } },
        residualRisk: { type: "array", items: { type: "string" } },
        artifactPath: { type: "string" },
      },
    },
  },
  io: io(taskCtx),
  labels: ["issue-633", "quality-gate", "verification"],
}));

export const integrationReviewTask = defineTask("issue-633/integration-review", (args, taskCtx) => ({
  kind: "agent",
  title: `Phase 6 - Integration review iteration ${args.iteration}`,
  agent: {
    name: "unified-reviewer",
    prompt: {
      role: "adversarial code reviewer for SDK, agent-platform, and tasks-mux integration",
      task: "Review the implementation against issue #633, runtime call paths, and quality-gate evidence.",
      context: args,
      instructions: [
        "Find bugs, regressions, package dependency cycles, direct-routing bypasses, untested branches, and behavior that violates issue #633.",
        "Verify internal, agent, human, tracker, and auto/unavailable responder flows behave according to the approved spec.",
        "Verify plugin stop-hook behavior queries tasks-mux rather than guessing based only on task kind.",
        "Verify CLI orchestration posts task results after tasks-mux resolution and preserves existing error/result semantics.",
        "Verify tests are meaningful and not just matching the implementation.",
        "Return approved=false for any P0/P1 issue or missing required acceptance criterion.",
      ],
      outputFormat: "JSON with approved, score, summary, findings, acceptanceStatus, requiresHumanDecision, blockingQuestions",
    },
    outputSchema: {
      type: "object",
      required: ["approved", "score", "summary", "findings", "acceptanceStatus", "requiresHumanDecision"],
      properties: {
        approved: { type: "boolean" },
        score: { type: "number" },
        summary: { type: "string" },
        findings: { type: "array", items: { type: "object" } },
        acceptanceStatus: { type: "array", items: { type: "object" } },
        requiresHumanDecision: { type: "boolean" },
        blockingQuestions: { type: "array", items: { type: "string" } },
      },
    },
  },
  io: io(taskCtx),
  labels: ["issue-633", "review", "quality-gate"],
}));

export const finalVerificationTask = defineTask("issue-633/final-verification", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 7 - Final spec-vs-artifacts verification",
  agent: {
    name: "spec-guard",
    prompt: {
      role: "final acceptance verifier",
      task: "Compare issue #633 and the design document directly against the final code, tests, and command evidence.",
      context: args,
      instructions: [
        "Read issue #633, all comments, and the routing design document again at runtime.",
        "Read the final git diff and relevant test files at runtime.",
        "Compare SPEC to ARTIFACTS directly. Ignore narrative in your context about how ARTIFACTS were built.",
        "Confirm no implementation source files outside the approved call paths were changed unless explicitly justified.",
        "Confirm all quality gates passed or enumerate residual risks and why they block completion.",
        "Confirm the implementation is ready for a PR linked to #633.",
      ],
      outputFormat: "JSON with passed, qualityGates, acceptanceMatrix, residualRisks, artifacts, prSummary",
    },
    outputSchema: {
      type: "object",
      required: ["passed", "qualityGates", "acceptanceMatrix", "residualRisks", "artifacts", "prSummary"],
      properties: {
        passed: { type: "boolean" },
        qualityGates: { type: "object" },
        acceptanceMatrix: { type: "array", items: { type: "object" } },
        residualRisks: { type: "array", items: { type: "string" } },
        artifacts: { type: "object" },
        prSummary: { type: "string" },
      },
    },
  },
  io: io(taskCtx),
  labels: ["issue-633", "final-verification", "spec-guard"],
}));

function io(taskCtx) {
  return {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  };
}
