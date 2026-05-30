/**
 * @process repo/issue-577-tasks-mux-native-agent-tools
 * @description Complete issue #577 by wiring tasks-mux into the agent stack as native built-in tools and governance routing.
 * @inputs {
 *   issueNumber: number,
 *   baseBranch: string,
 *   relatedIssues: number[],
 *   designDocs: string[],
 *   targetFiles: string[],
 *   expectedNativeTools: string[],
 *   verificationCommands: string[],
 *   maxImplementationIterations: number,
 *   targetQuality: number
 * }
 * @outputs { success: boolean, reuseAudit: object, runtimeCallPaths: object, testMatrix: object, implementation: object, verification: object, review: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Existing tasks-mux responder routing exists on staging: packages/tasks-mux/src/types.ts has ResponderType, packages/tasks-mux/src/router.ts exports routeTask(), packages/tasks-mux/src/backends/agent-mux.ts implements AgentMuxResponderBackend, and packages/tasks-mux/src/backends/external-tracker.ts implements ExternalTrackerBackend.
 * - Existing SDK responder metadata exists on staging: packages/sdk/src/tasks/types.ts, defineTask.ts, kinds/index.ts, serializer tests, and hook-run tests include responderType and adapter routing metadata.
 * - Existing agent-platform effect routing partially exists: packages/agent-platform/src/harness/internal/createRun/orchestration/effects.ts tries tasks-mux routeTask() for agent/breakpoint effects and delegates agent routes to AgentMuxResponderBackend.
 * - Existing tasks-mux MCP server only registers breakpoint/responder tools in packages/tasks-mux/src/mcp/server.ts; create_todo, assign_task, search_tasks, and escalate are not present.
 * - Existing agent-core and agent-platform delegation tools still expose generic task/skill delegation through injected taskHandler/skillHandler; native create_todo, assign_task, search_tasks, and escalate tools are not present.
 * - Existing agent-platform breakpoint delegation and approval-chain modules still use local webhook/pure-chain primitives; they are not yet unified behind tasks-mux BreakpointBackend/responder routing.
 * - No repo-local .a5c/process-library directory exists. Process-library research used /home/runner/.a5c/process-library/babysitter-repo/library and selected pilot-shell, superpowers TDD/verification, v-model, and feature-implementation-contribute patterns.
 *
 * Process-library references used:
 * - methodologies/pilot-shell/pilot-shell-feature.js
 * - methodologies/superpowers/test-driven-development.js
 * - methodologies/superpowers/verification-before-completion.js
 * - methodologies/v-model/v-model.js
 * - cradle/feature-implementation-contribute.js
 * - processes/shared/completeness-gate.js
 *
 * Repo-specific authoring note:
 * - This process uses agent tasks for implementation and verification work per docs/agent-reference/process-authoring.md. Verification agents must run the listed deterministic commands and return fresh evidence.
 *
 * @process methodologies/pilot-shell/pilot-shell-feature
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/v-model
 * @process cradle/feature-implementation-contribute
 * @process processes/shared/completeness-gate
 * @agent context-monitor methodologies/pilot-shell/agents/context-monitor/AGENT.md
 * @agent plan-reviewer methodologies/pilot-shell/agents/plan-reviewer/AGENT.md
 * @agent spec-guard methodologies/pilot-shell/agents/spec-guard/AGENT.md
 * @agent tdd-enforcer methodologies/pilot-shell/agents/tdd-enforcer/AGENT.md
 * @agent unified-reviewer methodologies/pilot-shell/agents/unified-reviewer/AGENT.md
 * @agent implementer methodologies/superpowers/agents/implementer/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

const DEFAULT_EXPECTED_TOOLS = [
  "create_todo",
  "assign_task",
  "search_tasks",
  "escalate",
];

const DEFAULT_QUALITY = 90;

export async function process(inputs, ctx) {
  const issueNumber = inputs.issueNumber ?? 577;
  const targetQuality = inputs.targetQuality ?? DEFAULT_QUALITY;
  const maxImplementationIterations = inputs.maxImplementationIterations ?? 3;
  const expectedNativeTools = inputs.expectedNativeTools ?? DEFAULT_EXPECTED_TOOLS;

  const issueContext = await ctx.task(readIssueContextTask, {
    ...inputs,
    issueNumber,
  }, { key: "issue-577.read-issue-context" });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
    expectedNativeTools,
  }, { key: "issue-577.phase-0.reuse-audit" });

  const runtimeCallPaths = await ctx.task(traceRuntimeCallPathsTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, { key: "issue-577.phase-1.runtime-call-paths" });

  const acceptanceContract = await ctx.task(acceptanceContractTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeCallPaths,
    expectedNativeTools,
  }, { key: "issue-577.phase-2.acceptance-contract" });

  const testMatrix = await ctx.task(testMatrixTask, {
    inputs,
    issueContext,
    acceptanceContract,
    runtimeCallPaths,
    expectedNativeTools,
  }, { key: "issue-577.phase-3.tests-first-matrix" });

  const implementationResults = [];
  let verification = null;
  let review = null;

  for (let iteration = 1; iteration <= maxImplementationIterations; iteration += 1) {
    const implementation = await ctx.task(implementationTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeCallPaths,
      acceptanceContract,
      testMatrix,
      previousVerification: verification,
      previousReview: review,
      iteration,
    }, { key: `issue-577.phase-4.implementation.${iteration}` });

    verification = await ctx.task(verificationTask, {
      inputs,
      issueContext,
      acceptanceContract,
      testMatrix,
      implementation,
      iteration,
    }, { key: `issue-577.phase-5.verification.${iteration}` });

    review = await ctx.task(reviewTask, {
      inputs,
      issueContext,
      reuseAudit,
      runtimeCallPaths,
      acceptanceContract,
      testMatrix,
      implementation,
      verification,
      targetQuality,
      iteration,
    }, { key: `issue-577.phase-6.review.${iteration}` });

    implementationResults.push({ iteration, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true && (review.score ?? 0) >= targetQuality) {
      break;
    }

    if (review?.requiresMaintainerDecision === true) {
      await ctx.breakpoint({
        title: `Issue #${issueNumber} maintainer decision`,
        question: review.question ?? "The tasks-mux agent-stack integration has an unresolved architecture or compatibility decision.",
        context: {
          runId: ctx.runId,
          iteration,
          review,
          options: [
            "Continue with the reviewer's recommended narrow fix",
            "Pause for maintainer guidance",
          ],
        },
      }, {
        breakpointId: `issue-577.iteration-${iteration}.maintainer-decision`,
        tags: ["issue-577", "tasks-mux", "architecture-decision"],
        strategy: "single",
      });
    }
  }

  const finalGate = await ctx.task(finalAcceptanceTask, {
    inputs,
    issueContext,
    reuseAudit,
    runtimeCallPaths,
    acceptanceContract,
    testMatrix,
    implementationResults,
    verification,
    review,
    targetQuality,
  }, { key: "issue-577.phase-7.final-acceptance" });

  if (finalGate?.passed !== true) {
    await ctx.breakpoint({
      title: `Issue #${issueNumber} final acceptance`,
      question: "Final acceptance did not pass. Review the reported gaps before deciding whether to continue another implementation iteration or split follow-up work.",
      context: {
        runId: ctx.runId,
        finalGate,
      },
    }, {
      breakpointId: "issue-577.final-acceptance",
      tags: ["issue-577", "final-acceptance"],
      strategy: "single",
    });
  }

  return {
    success: finalGate?.passed === true,
    issueNumber,
    baseBranch: inputs.baseBranch ?? "staging",
    reuseAudit,
    runtimeCallPaths,
    acceptanceContract,
    testMatrix,
    implementationResults,
    verification,
    review,
    finalGate,
    metadata: {
      processId: "repo/issue-577-tasks-mux-native-agent-tools",
      completedAt: ctx.now().toISOString(),
      targetQuality,
      maxImplementationIterations,
    },
  };
}

export const readIssueContextTask = defineTask("issue-577/read-issue-context", (args, taskCtx) => ({
  kind: "agent",
  title: "Read issue #577 and linked context",
  labels: ["issue-577", "research", "github"],
  agent: {
    name: "context-monitor",
    prompt: {
      role: "senior maintainer gathering source-of-truth issue context",
      task: "Read issue #577, all comments, labels, and related issues before implementation planning or code changes.",
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments,state`,
        `Confirm whether #${args.issueNumber} is also a PR with: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        "Read the issue body and every comment carefully, including prior planning comments and comments that say slice issues implemented part of the work.",
        "Read related issues and PRs only enough to determine which slices have landed and which gaps remain: #581, #597, #602, #603, #604, #630, #631, #633, #635, and any PRs mentioned in #577 comments.",
        "Read docs/agent-layer-gaps.md and every path in inputs.designDocs.",
        "Return JSON with title, state, labels, issueSummary, commentTimeline, relatedIssueStatus, acceptanceCriteria, alreadyImplementedClaims, unresolvedClaims, and sourceLinks.",
      ],
    },
    outputSchema: objectSchema(["issueSummary", "acceptanceCriteria", "alreadyImplementedClaims", "unresolvedClaims"]),
  },
  io: io(taskCtx),
}));

export const reuseAuditTask = defineTask("issue-577/reuse-audit", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 0 - Reuse audit",
  labels: ["issue-577", "phase-0", "reuse-audit"],
  agent: {
    name: "plan-reviewer",
    prompt: {
      role: "senior TypeScript monorepo architect",
      task: "Perform the mandatory reuse audit before implementing issue #577.",
      context: args,
      instructions: [
        "Start the report with exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).",
        "Do not edit files in this phase.",
        "Extract keyword nouns and verbs from the issue: tasks-mux, native tools, MCP tools, create_todo, assign_task, search_tasks, escalate, BreakpointBackend, approval chains, SDK task effects, agent-core delegation, agent-platform delegation, subtask dispatch, agent-mux adapters.",
        "Scan existing migrations/routes/env vars/package dependencies/imports for those keywords, even if this repo likely has no web migration surface.",
        "Inspect current source surfaces in inputs.targetFiles and follow imports/exports as needed.",
        "Distinguish already-landed slice work from missing issue #577 scope. Treat implemented ResponderType/router/AgentMuxResponderBackend/ExternalTrackerBackend/SDK metadata as reusable infrastructure, not work to duplicate.",
        "Identify target files that should be edited and files that should remain untouched.",
        "Return JSON with findings, reusableInfrastructure, missingSurfaces, dependencyStatus, targetFileMap, nonGoals, blockers, and needsMaintainerDecision.",
      ],
    },
    outputSchema: objectSchema(["findings", "reusableInfrastructure", "missingSurfaces", "targetFileMap"]),
  },
  io: io(taskCtx),
}));

export const traceRuntimeCallPathsTask = defineTask("issue-577/runtime-call-paths", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 1 - Trace runtime call paths",
  labels: ["issue-577", "phase-1", "runtime-call-paths"],
  agent: {
    name: "context-monitor",
    prompt: {
      role: "runtime integration engineer",
      task: "Trace live call paths that issue #577 must wire through tasks-mux.",
      context: args,
      instructions: [
        "Do not edit files in this phase.",
        "Trace agent-core tool registration from packages/agent-core/src/agenticTools/index.ts and tools.ts into packages/agent-core/src/agenticTools/tools/delegation.ts.",
        "Trace agent-platform harness tool registration and delegation through packages/agent-platform/src/harness/agenticTools/** and packages/agent-platform/src/harness/internal/createRun/orchestration/effects.ts.",
        "Trace tasks-mux MCP server registration through packages/tasks-mux/src/mcp/server.ts and packages/tasks-mux/src/mcp/tools/*.ts.",
        "Trace tasks-mux routing/backend ownership through packages/tasks-mux/src/router.ts, backend.ts, backends/index.ts, backends/agent-mux.ts, and backends/external-tracker.ts.",
        "Trace SDK task effect creation/replay through packages/sdk/src/runtime/intrinsics/task.ts, packages/sdk/src/runtime/orchestrateIteration.ts, packages/sdk/src/harness/hooks/stopHookContinuation.ts, and packages/sdk/src/cli/commands/__tests__/hookRun.test.ts.",
        "Trace breakpoint governance through packages/agent-platform/src/breakpoints/delegation.ts and approvalChains.ts.",
        "Return JSON with runtimeCallPaths, owners, missingEdges, compatibilityRisks, and recommendedImplementationOrder.",
      ],
    },
    outputSchema: objectSchema(["runtimeCallPaths", "missingEdges", "recommendedImplementationOrder"]),
  },
  io: io(taskCtx),
}));

export const acceptanceContractTask = defineTask("issue-577/acceptance-contract", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 2 - Acceptance contract and scope boundaries",
  labels: ["issue-577", "phase-2", "acceptance-contract"],
  agent: {
    name: "spec-guard",
    prompt: {
      role: "spec guardian for cross-package task routing work",
      task: "Convert the issue and runtime path map into an executable acceptance contract for issue #577.",
      context: args,
      instructions: [
        "Do not edit implementation files in this phase.",
        "Build the contract from the issue body/comments and runtimeCallPaths, not from assumptions.",
        "The contract must cover native agent-core tools, agent-platform harness tools, tasks-mux MCP tool registration, breakpoint delegation through BreakpointBackend, approval-chain routing through tasks-mux, SDK task effects through tasks-mux for human-in-the-loop, and subtask dispatch through agent-mux adapters via tasks-mux.",
        "Define compatibility requirements for existing taskHandler/skillHandler behavior and already-landed responderType/router APIs.",
        "Define non-goals so implementation does not reimplement #630/#631/#633/#635 work unless a gap is proven.",
        "Return JSON with acceptanceCriteria, behaviorContracts, nonGoals, targetFiles, testRequirements, and rollbackRisks.",
      ],
    },
    outputSchema: objectSchema(["acceptanceCriteria", "behaviorContracts", "nonGoals", "testRequirements"]),
  },
  io: io(taskCtx),
}));

export const testMatrixTask = defineTask("issue-577/test-matrix", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 3 - Tests-first matrix",
  labels: ["issue-577", "phase-3", "tests-first", "tdd"],
  agent: {
    name: "tdd-enforcer",
    prompt: {
      role: "TDD engineer for TypeScript monorepo integration work",
      task: "Author the tests-first plan for issue #577 before production implementation.",
      context: args,
      instructions: [
        "Do not implement production code in this phase.",
        "Define targeted tests that fail for missing native tools and governance routing, not for already-landed responder infrastructure.",
        "Include tasks-mux tests for create_todo, assign_task, search_tasks, escalate handlers, MCP server registration, backend/routing semantics, idempotency, and task lifecycle state.",
        "Include agent-core and agent-platform tests proving native tool registration and execution route through tasks-mux while legacy task/skill delegation remains compatible.",
        "Include agent-platform breakpoint tests proving delegation and approval chains submit/wait/answer through BreakpointBackend instead of independent webhook-only flows.",
        "Include SDK/hook-run tests proving human-in-the-loop task effects and external agent subtasks route through tasks-mux decisions.",
        "Include negative tests for unavailable agent-mux adapter, missing auth, timeout, tracker backend unavailable, and fallbackType behavior.",
        "Return JSON with testFiles, redCommands, behaviorCoverage, fixturesNeeded, mocks, and implementationPreconditions.",
      ],
    },
    outputSchema: objectSchema(["testFiles", "redCommands", "behaviorCoverage"]),
  },
  io: io(taskCtx),
}));

export const implementationTask = defineTask("issue-577/implementation", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 4 - Implement native tasks-mux wiring",
  labels: ["issue-577", "phase-4", "implementation"],
  agent: {
    name: "implementer",
    prompt: {
      role: "senior TypeScript integration engineer",
      task: "Implement issue #577 narrowly against the tests-first matrix and current reusable tasks-mux infrastructure.",
      context: args,
      instructions: [
        "Follow the tests-first matrix. If the RED tests are not present, add them before production code.",
        "Keep changes scoped to target files and live call paths from runtimeCallPaths unless a documented import/export seam requires an adjacent file.",
        "Implement tasks-mux task/todo domain primitives only to the extent required by issue #577: create_todo, assign_task, search_tasks, escalate, lifecycle metadata, routing decisions, idempotent identifiers, and answer/result metadata.",
        "Register native MCP tools in tasks-mux server with handler modules consistent with existing ask/list/answer tool patterns.",
        "Add native tools to agent-core and agent-platform harness surfaces, routing executions through tasks-mux APIs/backends instead of bypassing to raw taskHandler where tasks-mux owns the route.",
        "Preserve existing task and skill tools for compatibility; do not delete or break current injected handlers.",
        "Wire breakpoint delegation and approval chains to tasks-mux BreakpointBackend/routing while preserving current public pure helpers where callers use them.",
        "Use AgentMuxResponderBackend only through tasks-mux routing for agent responder subtasks. Do not introduce direct agent-platform-to-agent-mux special cases that bypass tasks-mux.",
        "Avoid broad refactors and do not reimplement already-landed #630/#631/#633/#635 surfaces unless tests prove a gap.",
        "Return JSON with changedFiles, implementedBehaviors, compatibilityNotes, testsAdded, knownRisks, and commandsToRunNext.",
      ],
    },
    outputSchema: objectSchema(["changedFiles", "implementedBehaviors", "testsAdded", "commandsToRunNext"]),
  },
  io: io(taskCtx),
}));

export const verificationTask = defineTask("issue-577/verification", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 5 - Run quality gates",
  labels: ["issue-577", "phase-5", "verification", "quality-gate"],
  agent: {
    name: "unified-reviewer",
    prompt: {
      role: "verification engineer running fresh deterministic checks",
      task: "Run the focused and package-level verification gates for issue #577 and report evidence.",
      context: args,
      instructions: [
        "Run the commands in inputs.verificationCommands. If a command is unavailable because a package lacks the script, report that explicitly and run the nearest focused equivalent.",
        "At minimum, verify focused new tests, tasks-mux test/typecheck/lint/build, SDK test/build, agent-core test/build, agent-platform test/lint/build, agent-mux relevant tests/build if adapter routing changed, architecture tests, metadata verification, and git diff --check.",
        "Read full failures before changing anything. If failures are issue-related and narrow, fix them and rerun affected commands. Do not fix unrelated dirty-worktree changes.",
        "Check that no source files outside the target path map were modified without a documented reason.",
        "Return JSON with passed, commandsRun, evidence, failures, fixesApplied, unresolvedFailures, changedFiles, and residualRisk.",
      ],
    },
    outputSchema: objectSchema(["passed", "commandsRun", "evidence", "unresolvedFailures"]),
  },
  io: io(taskCtx),
}));

export const reviewTask = defineTask("issue-577/review", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 6 - Adversarial integration review",
  labels: ["issue-577", "phase-6", "review"],
  agent: {
    name: "code-reviewer",
    prompt: {
      role: "adversarial reviewer for tasks-mux, SDK, agent-core, agent-platform, and agent-mux integration",
      task: "Review the implementation against issue #577, current architecture, and verification evidence.",
      context: args,
      instructions: [
        "Review for bypasses around tasks-mux, duplicate task routing contracts, package dependency cycles, tool schema drift, untested fallback behavior, and silent fallback from agent routing to human/internal routing.",
        "Confirm native create_todo, assign_task, search_tasks, and escalate are available from both MCP and agent-core/agent-platform tool surfaces as intended.",
        "Confirm breakpoint delegation and approval chains use tasks-mux BreakpointBackend/routing for external responders and preserve public compatibility.",
        "Confirm SDK task effect replay and hook-run behavior preserve legacy ctx.task behavior while honoring responderType routes.",
        "Confirm subtask dispatch uses tasks-mux to reach AgentMuxResponderBackend rather than direct agent-mux calls outside tasks-mux-owned seams.",
        "If defects are narrow, fix them and request verification rerun. If a public API or architecture decision is genuinely ambiguous, set requiresMaintainerDecision true.",
        "Return JSON with approved, score, findings, fixesApplied, requiresMaintainerDecision, question, residualRisks, and followUpIssues.",
      ],
    },
    outputSchema: objectSchema(["approved", "score", "findings", "residualRisks"]),
  },
  io: io(taskCtx),
}));

export const finalAcceptanceTask = defineTask("issue-577/final-acceptance", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 7 - Final acceptance and handoff",
  labels: ["issue-577", "phase-7", "final-acceptance"],
  agent: {
    name: "spec-guard",
    prompt: {
      role: "final acceptance reviewer",
      task: "Compare the issue #577 source context directly to final artifacts and verification evidence.",
      context: args,
      instructions: [
        "Re-read issue #577 and the current diff fresh before deciding.",
        "Compare every issue body requirement and comment-derived requirement against the final artifacts.",
        "Require evidence for native tools, MCP registration, BreakpointBackend delegation, approval-chain routing, SDK human-in-loop task system, agent-mux-backed subtask dispatch, and compatibility with already-landed responder work.",
        "Require fresh verification evidence from the commands in inputs.verificationCommands or documented equivalent focused commands.",
        "Return JSON with passed, perCriterionStatus, qualityScore, missingCoverage, verificationEvidence, changedFiles, releaseNotes, and issueCommentSummary.",
      ],
    },
    outputSchema: objectSchema(["passed", "perCriterionStatus", "qualityScore", "missingCoverage", "issueCommentSummary"]),
  },
  io: io(taskCtx),
}));

function io(taskCtx) {
  return {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  };
}

function objectSchema(required) {
  return {
    type: "object",
    required,
    additionalProperties: true,
  };
}
