/**
 * @process issue-634-tasks-mux-routing-hub-gaps
 * @description Implementation process for issue #634: tasks-mux task-management gaps needed for unified routing hub readiness.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, duplicateOf: number, relatedIssues: number[], designDocs: string[], targetFiles: string[], verificationCommands: string[], targetQuality?: number, maxImplementationAttempts?: number }
 * @outputs { success: boolean, issueContext: object, reuseAudit: object, architecturePlan: object, regressionPlan: object, implementationAttempts: array, finalGate: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-layer-gaps.md
 * - docs/agent-mux-babysitter-integrations/tasks-mux-routing.md
 * - packages/tasks-mux/src/types.ts
 * - packages/tasks-mux/src/backend.ts
 * - packages/tasks-mux/src/backends/git-native.ts
 * - packages/tasks-mux/src/backends/server.ts
 * - packages/tasks-mux/src/backends/github-issues.ts
 * - packages/tasks-mux/src/cli/program.ts
 * - packages/tasks-mux/src/mcp/server.ts
 *
 * Process-library references used:
 * - /home/runner/.a5c/process-library/babysitter-repo/library/cradle/feature-implementation-contribute.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/spec-driven-development.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/state-machine-orchestration.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/tdd-quality-convergence.js
 *
 * @process cradle/feature-implementation-contribute
 * @process methodologies/spec-driven-development
 * @process methodologies/state-machine-orchestration
 * @process babysitter/tdd-quality-convergence
 * @agent architect methodologies/maestro/agents/architect/AGENT.md
 * @agent coder methodologies/maestro/agents/coder/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

const DEFAULT_MAX_IMPLEMENTATION_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 634;
  const targetQuality = inputs?.targetQuality ?? 90;
  const maxImplementationAttempts = inputs?.maxImplementationAttempts ?? DEFAULT_MAX_IMPLEMENTATION_ATTEMPTS;

  const issueContext = await ctx.task(readIssueContextTask, {
    ...inputs,
    issueNumber,
  }, {
    key: "issue-634.read-issue-context",
  });

  if (issueContext?.requiresScopeDecision === true) {
    await ctx.breakpoint({
      title: "Issue #634 Duplicate and Scope Decision",
      question: issueContext.question ?? "Issue #634 is marked duplicate/closed. Decide whether to proceed with the narrowed routing-hub gap plan or switch to the duplicate parent issue.",
      options: [
        "Proceed with narrowed #634 plan",
        "Switch implementation run to duplicate parent issue",
        "Pause for maintainer guidance",
      ],
      expert: "owner",
      tags: ["issue-634", "tasks-mux", "scope"],
      context: {
        runId: ctx.runId,
        issueContext,
      },
    });
  }

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: "issue-634.reuse-audit",
  });

  const architecturePlan = await ctx.task(architecturePlanTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: "issue-634.architecture-plan",
  });

  const regressionPlan = await ctx.task(regressionPlanTask, {
    inputs,
    issueContext,
    reuseAudit,
    architecturePlan,
  }, {
    key: "issue-634.regression-plan",
  });

  const redGate = await ctx.task(redGateTask, {
    inputs,
    issueContext,
    architecturePlan,
    regressionPlan,
  }, {
    key: "issue-634.red-gate",
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const implementationAttempts = [];

  for (let attempt = 1; attempt <= maxImplementationAttempts; attempt += 1) {
    implementation = await ctx.task(implementationSliceTask, {
      inputs,
      issueContext,
      reuseAudit,
      architecturePlan,
      regressionPlan,
      redGate,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-634.implementation.${attempt}`,
    });

    verification = await ctx.task(verificationGateTask, {
      inputs,
      issueContext,
      architecturePlan,
      regressionPlan,
      implementation,
      attempt,
    }, {
      key: `issue-634.verification.${attempt}`,
    });

    review = await ctx.task(integrationReviewTask, {
      inputs,
      issueContext,
      architecturePlan,
      regressionPlan,
      implementation,
      verification,
      targetQuality,
      attempt,
    }, {
      key: `issue-634.review.${attempt}`,
    });

    implementationAttempts.push({
      attempt,
      implementation,
      verification,
      review,
    });

    if (verification?.passed === true && review?.approved === true && (review?.score ?? 0) >= targetQuality) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    reuseAudit,
    architecturePlan,
    regressionPlan,
    redGate,
    implementation,
    verification,
    review,
    implementationAttempts,
    targetQuality,
  }, {
    key: "issue-634.final-acceptance",
  });

  if (finalGate?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: "Issue #634 Final Acceptance Decision",
      question: finalGate.question ?? "Final acceptance found an unresolved compatibility or scope decision.",
      options: [
        "Accept current additive contract",
        "Limit to schema/backend only",
        "Pause for maintainer guidance",
      ],
      expert: "owner",
      tags: ["issue-634", "tasks-mux", "final-gate"],
      context: {
        runId: ctx.runId,
        finalGate,
      },
    });
  }

  return {
    success: finalGate?.passed === true,
    issueNumber,
    issueContext,
    reuseAudit,
    architecturePlan,
    regressionPlan,
    redGate,
    implementationAttempts,
    finalGate,
    metadata: {
      processId: "issue-634-tasks-mux-routing-hub-gaps",
      completedAt: ctx.now().toISOString(),
      targetQuality,
      maxImplementationAttempts,
    },
  };
}

export const readIssueContextTask = defineTask("issue-634.read-issue-context", (args, taskCtx) => ({
  kind: "agent",
  title: "Read #634, duplicate parent, comments, labels, and design docs",
  labels: ["issue-634", "tasks-mux", "research"],
  agent: {
    name: "architect",
    prompt: {
      role: "senior Babysitter tasks-mux architect",
      task: "Read the live GitHub issue context and repository design docs before planning implementation.",
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Run: gh issue view ${args.duplicateOf ?? 596} --json title,body,labels,comments`,
        `Confirm #${args.issueNumber} is not a PR with: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        "Read every issue comment and label. Treat comments that mark the issue duplicate or closed as scope signals, not as permission to skip acceptance analysis.",
        "Read the design docs listed in inputs.designDocs, especially docs/agent-layer-gaps.md and docs/agent-mux-babysitter-integrations/tasks-mux-routing.md.",
        "Summarize the narrowed #634 deliverables: priority, dependsOn, searchBreakpoints, status history, bulk approve/close/reassign, state-machine validation, and audit log.",
        "Separate parent #596 larger-epic items that are out of scope for #634 unless needed as extension points: notifications, SLA metrics, comments, escalation chains, forms, export/backup.",
        "Return JSON with title, labels, issueSummary, duplicateSummary, commentsSummary, acceptanceCriteria, nonGoals, relatedIssues, designDocFindings, requiresScopeDecision, question.",
      ],
    },
    outputSchema: {
      type: "object",
      required: ["issueSummary", "acceptanceCriteria", "nonGoals", "relatedIssues", "designDocFindings", "requiresScopeDecision"],
    },
  },
  io: io(taskCtx),
}));

export const reuseAuditTask = defineTask("issue-634.reuse-audit", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 0 - Mandatory reuse audit",
  labels: ["issue-634", "reuse-audit", "tasks-mux"],
  agent: {
    name: "architect",
    prompt: {
      role: "senior maintainer performing the mandatory reuse audit before implementation",
      task: "Audit current tasks-mux infrastructure and render findings before proposing new APIs or persistence structures.",
      instructions: [
        "Start the report with exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).",
        "Extract keyword nouns and verbs from the issue: priority, critical, dependsOn, searchBreakpoints, status, assignee, text filter, status history, timeline, bulk approve, bulk close, bulk reassign, state transition, audit log.",
        "Scan target files and follow imports/exports for existing schema fields, backend methods, CLI commands, MCP tools, client APIs, server APIs, and tests.",
        "Record current overlaps: UrgencySchema, BreakpointStatusSchema, claimedByResponderId, listPendingBreakpoints, answerBreakpoint, cancelBreakpoint, claimBreakpoint, server/GitHub payload mappers, MCP list/claim/poll tools.",
        "Identify reusable seams and missing seams. Do not propose duplicate infrastructure where a shared helper or backend interface extension is sufficient.",
        "Call out existing compatibility risks for stored git-native JSON, GitHub issue hidden payloads, server Question/Expert mappings, and public package exports.",
        "Do not modify source files in this phase.",
      ],
    },
    outputSchema: {
      type: "object",
      required: ["summary", "findings", "reusableSeams", "missingSeams", "compatibilityRisks"],
      properties: {
        summary: { type: "string" },
        findings: { type: "array", items: { type: "object" } },
        reusableSeams: { type: "array", items: { type: "string" } },
        missingSeams: { type: "array", items: { type: "string" } },
        compatibilityRisks: { type: "array", items: { type: "string" } },
        artifactPath: { type: "string" },
      },
    },
  },
  io: io(taskCtx),
}));

export const architecturePlanTask = defineTask("issue-634.architecture-plan", (args, taskCtx) => ({
  kind: "agent",
  title: "Design additive task-management contract",
  labels: ["issue-634", "architecture", "tasks-mux"],
  agent: {
    name: "architect",
    prompt: {
      role: "senior TypeScript API and persistence architect",
      task: "Design the implementation contract for #634 before tests or code changes.",
      instructions: [
        "Use the issue context and reuse audit JSON as constraints.",
        "Design an additive schema that preserves existing breakpoints: priority low|medium|high|critical, dependsOn string[], assigned responder fields, statusHistory timeline, auditLog entries, and optional compatibility mapping from context.urgency to priority.",
        "Design the expanded state machine. Include existing statuses pending/routed/claimed/answered/completed/expired/cancelled and decide whether #634 needs assigned/in-progress/blocked/escalated for dependency and bulk operations, while documenting compatibility behavior.",
        "Define transition rules, terminal states, dependency-blocked resolution rules, actor attribution, and timestamp source policy.",
        "Define backend API additions: searchBreakpoints(query), updateBreakpointStatus or transition helper, bulkApprove, bulkClose, bulkReassign, plus any shared query/operation result types.",
        "Define git-native persistence behavior using existing JSON files and atomic update expectations; avoid introducing a database.",
        "Define server and GitHub Issues parity behavior, including mapping labels/assignees/status, hidden payload versioning, and unsupported capability behavior if exact parity is impossible.",
        "Define client, CLI, and MCP public surfaces for search and bulk operations, keeping command semantics backend-agnostic.",
        "Identify docs and README updates required to make the feature discoverable.",
        "Return JSON with contract, stateMachine, dependencyRules, auditModel, backendPlan, surfacePlan, compatibilityPlan, migrationPlan, risks, and orderedImplementationSlices.",
      ],
    },
    outputSchema: {
      type: "object",
      required: ["contract", "stateMachine", "dependencyRules", "auditModel", "backendPlan", "surfacePlan", "compatibilityPlan", "orderedImplementationSlices"],
    },
  },
  io: io(taskCtx),
}));

export const regressionPlanTask = defineTask("issue-634.regression-plan", (args, taskCtx) => ({
  kind: "agent",
  title: "Author failing acceptance and compatibility test plan",
  labels: ["issue-634", "tdd", "tests"],
  agent: {
    name: "test-engineer",
    prompt: {
      role: "senior test engineer enforcing ATDD/TDD",
      task: "Create the red-first regression plan for #634.",
      instructions: [
        "Plan tests before implementation and require the implementation agent to prove at least one targeted red failure for each slice.",
        "Cover type/schema defaults and validation for priority, dependsOn, statusHistory, auditLog, and invalid transitions.",
        "Cover dependency blocking: a breakpoint with unresolved dependsOn cannot be answered/approved/completed until prerequisites are terminal-success states.",
        "Cover searchBreakpoints filters for status, assignee/responder, priority, free-text over text/context/tags, projectId, repoId, and combined filters.",
        "Cover bulk approve, bulk close, and bulk reassign result semantics: per-id success/failure, audit entry creation, partial failure reporting, and no mutation for invalid transitions.",
        "Cover git-native stored legacy fixture compatibility and new persistence files.",
        "Cover server and GitHub backend mapping parity or explicit unsupported errors with tests.",
        "Cover CLI and MCP parity for search and bulk surfaces.",
        "Cover docs examples and public exports if the package exposes new types.",
        "Return JSON with testFilesToAdd, testFilesToModify, acceptanceTests, compatibilityFixtures, redGateCommands, and sliceGateCommands.",
      ],
    },
    outputSchema: {
      type: "object",
      required: ["acceptanceTests", "compatibilityFixtures", "redGateCommands", "sliceGateCommands"],
    },
  },
  io: io(taskCtx),
}));

export const redGateTask = defineTask("issue-634.red-gate", (args, taskCtx) => ({
  kind: "agent",
  title: "Run red gate for planned tests",
  labels: ["issue-634", "red-gate", "tdd"],
  agent: {
    name: "test-engineer",
    prompt: {
      role: "TDD gatekeeper",
      task: "Add the planned tests and prove they fail for expected missing-feature reasons before implementation.",
      instructions: [
        "Modify only tests, fixtures, and test-support files in this phase.",
        "Run targeted red gate commands from the regression plan.",
        "Classify failures as expected missing implementation, unexpected existing breakage, or invalid test design.",
        "Do not edit production source files in this phase.",
        "Return JSON with passed, expectedFailures, unexpectedFailures, commandsRun, filesChanged, and nextImplementationConstraints.",
      ],
    },
    outputSchema: {
      type: "object",
      required: ["passed", "expectedFailures", "unexpectedFailures", "commandsRun", "filesChanged"],
    },
  },
  io: io(taskCtx),
}));

export const implementationSliceTask = defineTask("issue-634.implementation-slices", (args, taskCtx) => ({
  kind: "agent",
  title: "Implement gated tasks-mux task-management slices",
  labels: ["issue-634", "implementation", "tasks-mux"],
  agent: {
    name: "coder",
    prompt: {
      role: "senior TypeScript implementation engineer",
      task: "Implement #634 in ordered, reviewable slices, using the architecture plan and red tests as the source of truth.",
      instructions: [
        "Do not implement unrelated #596 epic items unless the architecture plan marks them as extension hooks required for #634.",
        "Slice 1: shared types, schemas, defaults, transition validation helpers, audit/history helpers, public exports, and compatibility parsing.",
        "Slice 2: backend interface additions and git-native implementation for search, dependencies, bulk approve/close/reassign, transition validation, history, and audit persistence.",
        "Slice 3: server backend, GitHub Issues backend, client APIs, hidden payload/label/assignee mapping, and unsupported capability errors where exact parity is not currently possible.",
        "Slice 4: CLI commands, MCP tools, README/docs/spec updates, and packaged surface parity.",
        "After each slice, run the relevant slice gate commands from the regression plan and capture evidence.",
        "Preserve existing behavior for ask, answer, status, poll, claim, responder matching, proven answers, and routing metadata.",
        "Keep changes scoped to packages/tasks-mux and docs unless the plan proves a package export outside tasks-mux must change.",
        "Return JSON with attempt, slicesCompleted, filesChanged, commandsRun, knownIssues, and migrationNotes.",
      ],
    },
    outputSchema: {
      type: "object",
      required: ["attempt", "slicesCompleted", "filesChanged", "commandsRun", "knownIssues"],
    },
  },
  io: io(taskCtx),
}));

export const verificationGateTask = defineTask("issue-634.verification-gate", (args, taskCtx) => ({
  kind: "agent",
  title: "Run implementation verification gates",
  labels: ["issue-634", "verification", "quality-gate"],
  agent: {
    name: "test-engineer",
    prompt: {
      role: "verification engineer",
      task: "Run the required verification gates for #634 and report exact evidence.",
      instructions: [
        "Run targeted slice tests first, then the required full verification commands from inputs.verificationCommands.",
        "At minimum verify tasks-mux tests, typecheck, build, lint or package-level lint if available, metadata verification, packaged exports, and git diff hygiene.",
        "Check CLI help/output snapshots or command tests for search, assign/reassign, close/cancel, approve, and bulk operation names if implemented.",
        "Check MCP server tests include search and bulk tools.",
        "If a command is unavailable in this repo, record the exact command, failure, and why it is not blocking or how it should be replaced.",
        "Return JSON with passed, commands, failures, skipped, artifacts, and residualRisk.",
      ],
    },
    outputSchema: {
      type: "object",
      required: ["passed", "commands", "failures", "skipped", "residualRisk"],
    },
  },
  io: io(taskCtx),
}));

export const integrationReviewTask = defineTask("issue-634.integration-review", (args, taskCtx) => ({
  kind: "agent",
  title: "Review compatibility, API coherence, and routing-hub readiness",
  labels: ["issue-634", "review", "tasks-mux"],
  agent: {
    name: "code-reviewer",
    prompt: {
      role: "senior maintainer performing blocking code review",
      task: "Review the implementation against #634, #596 duplicate scope, design docs, and the architecture plan.",
      instructions: [
        "Prioritize bugs, API incompatibilities, invalid state transitions, dependency-bypass paths, audit/history omissions, backend parity gaps, and missing tests.",
        "Confirm priority and dependsOn are canonical fields, not only context metadata.",
        "Confirm invalid transitions are rejected consistently across direct methods and bulk operations.",
        "Confirm dependency blocking cannot be bypassed by answer, approve, complete, or bulk approve paths.",
        "Confirm search filters operate backend-agnostically or return explicit unsupported capability errors.",
        "Confirm audit entries include actor, action, before/after, timestamp, and source surface where available.",
        "Confirm legacy breakpoint fixtures still parse and existing public commands continue to work.",
        "Score quality from 0-100 and approve only if no blocking findings remain.",
        "Return JSON with approved, score, findings, requiredFixes, testGaps, compatibilityNotes, and needsMaintainerDecision.",
      ],
    },
    outputSchema: {
      type: "object",
      required: ["approved", "score", "findings", "requiredFixes", "testGaps", "compatibilityNotes", "needsMaintainerDecision"],
    },
  },
  io: io(taskCtx),
}));

export const finalAcceptanceGateTask = defineTask("issue-634.final-acceptance", (args, taskCtx) => ({
  kind: "agent",
  title: "Final spec-to-artifacts acceptance gate",
  labels: ["issue-634", "final-gate", "acceptance"],
  agent: {
    name: "code-reviewer",
    prompt: {
      role: "release-quality gatekeeper",
      task: "Determine whether #634 is complete and ready for maintainer review.",
      instructions: [
        "Build a traceability matrix from every #634 deliverable to source code, tests, docs, and verification evidence.",
        "Include priority, dependsOn, searchBreakpoints, status history, bulk approve/close/reassign, invalid transition rejection, and audit log.",
        "Verify the implementation did not silently expand into unrelated #596 items without tests and docs.",
        "Verify final verification passed or document exact non-blocking pre-existing failures with evidence.",
        "Return JSON with passed, traceabilityMatrix, changedFiles, commandsRun, blockingIssues, followUps, needsMaintainerDecision, and question.",
      ],
    },
    outputSchema: {
      type: "object",
      required: ["passed", "traceabilityMatrix", "changedFiles", "commandsRun", "blockingIssues", "followUps", "needsMaintainerDecision"],
    },
  },
  io: io(taskCtx),
}));

function io(taskCtx) {
  return {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  };
}
