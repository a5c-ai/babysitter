/**
 * @process repo/issue-597-tasks-mux-cli-mcp-surface
 * @description Plan and execute issue #597: add missing tasks-mux CLI commands, MCP tools, breakpoint resources, and subscription notifications.
 * @inputs {
 *   issueNumber: number,
 *   baseBranch: string,
 *   implementationBranch: string,
 *   relatedIssues: number[],
 *   requiredCliSurface: object,
 *   requiredMcpSurface: object,
 *   targetFiles: string[],
 *   verificationCommands: string[]
 * }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], contract: object, verification: object, review: object }
 *
 * Process-library research:
 * - /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/plan-and-execute.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/spec-driven-development.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/tdd-quality-convergence.js
 * - docs/agent-reference/process-authoring.md
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - No repository-local .a5c/process-library directory exists in this checkout; the matching process library was found under /home/runner/.a5c/process-library/babysitter-repo/library.
 * - packages/tasks-mux/src/cli/program.ts currently registers ask, responders, breakpoints, server, responder-loop, and auth command groups only.
 * - packages/tasks-mux/src/cli/commands/breakpoints.ts currently exposes pending, answer, status, and poll only.
 * - packages/tasks-mux/src/cli/commands/responders.ts currently exposes list and show only.
 * - packages/tasks-mux/src/mcp/server.ts currently registers the existing breakpoint/responder tools and has no breakpoint:// resource or subscription registration.
 * - packages/tasks-mux/src/backend.ts has the BreakpointBackend lifecycle contract with submit/get/wait/list/answer/cancel/listResponders/claim, but no shared search, assignment, close/approve, comments, escalation, templates, rules, or subscription contract.
 * - Existing backends already contain partial lifecycle capabilities: git-native/server/github-issues/external-tracker/agent-mux. The implementation should extend shared backend/types first and avoid one-off CLI or MCP-only behavior.
 * - Existing tests already cover CLI program shape, MCP tool registration/transport, backend contracts, git-native, server, GitHub Issues, external tracker, and agent-mux. The implementation should add failing contract tests before changing production source.
 *
 * Repo-specific authoring note:
 * - This process intentionally uses agent tasks instead of kind: "shell" subtasks per docs/agent-reference/process-authoring.md.
 * - Breakpoints are sparse and only used for unresolved contract ambiguity.
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

const MAX_IMPLEMENTATION_ITERATIONS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: "issue-597.read-issue-context",
  });

  const reuseAudit = await ctx.task(reuseAuditTask, { inputs, issueContext }, {
    key: "issue-597.phase-0-reuse-audit",
  });

  const surfaceMap = await ctx.task(surfaceMapTask, { inputs, issueContext, reuseAudit }, {
    key: "issue-597.phase-1-surface-map",
  });

  const contract = await ctx.task(contractSpecTask, { inputs, issueContext, reuseAudit, surfaceMap }, {
    key: "issue-597.phase-2-contract-spec",
  });

  if (contract?.needsHumanDecision === true) {
    await ctx.breakpoint({
      title: "Issue #597 Contract Decision",
      question: contract.question ?? "Review the CLI/MCP/backend contract ambiguity before implementation continues.",
      options: contract.options ?? [
        "Proceed with the recommended contract",
        "Pause for maintainer guidance",
      ],
      expert: "maintainer",
      tags: ["issue-597", "tasks-mux", "contract"],
      context: {
        runId: ctx.runId,
        contract,
        surfaceMap,
      },
    });
  }

  const tests = await ctx.task(contractTestsTask, { inputs, issueContext, reuseAudit, surfaceMap, contract }, {
    key: "issue-597.phase-3-contract-tests",
  });

  const implementationIterations = [];
  let backendImplementation = null;
  let cliImplementation = null;
  let mcpImplementation = null;
  let docsUpdate = null;
  let verification = null;
  let review = null;

  for (let iteration = 1; iteration <= MAX_IMPLEMENTATION_ITERATIONS; iteration += 1) {
    backendImplementation = await ctx.task(backendImplementationTask, {
      inputs,
      issueContext,
      reuseAudit,
      surfaceMap,
      contract,
      tests,
      previousVerification: verification,
      previousReview: review,
      iteration,
    }, {
      key: `issue-597.phase-4-backend.${iteration}`,
    });

    cliImplementation = await ctx.task(cliImplementationTask, {
      inputs,
      issueContext,
      reuseAudit,
      surfaceMap,
      contract,
      tests,
      backendImplementation,
      previousVerification: verification,
      previousReview: review,
      iteration,
    }, {
      key: `issue-597.phase-5-cli.${iteration}`,
    });

    mcpImplementation = await ctx.task(mcpImplementationTask, {
      inputs,
      issueContext,
      reuseAudit,
      surfaceMap,
      contract,
      tests,
      backendImplementation,
      cliImplementation,
      previousVerification: verification,
      previousReview: review,
      iteration,
    }, {
      key: `issue-597.phase-6-mcp.${iteration}`,
    });

    docsUpdate = await ctx.task(docsParityTask, {
      inputs,
      issueContext,
      reuseAudit,
      surfaceMap,
      contract,
      backendImplementation,
      cliImplementation,
      mcpImplementation,
      iteration,
    }, {
      key: `issue-597.phase-7-docs.${iteration}`,
    });

    verification = await ctx.task(verificationGateTask, {
      inputs,
      issueContext,
      contract,
      tests,
      backendImplementation,
      cliImplementation,
      mcpImplementation,
      docsUpdate,
      iteration,
    }, {
      key: `issue-597.phase-8-verification.${iteration}`,
    });

    review = await ctx.task(finalReviewTask, {
      inputs,
      issueContext,
      reuseAudit,
      surfaceMap,
      contract,
      tests,
      backendImplementation,
      cliImplementation,
      mcpImplementation,
      docsUpdate,
      verification,
      iteration,
    }, {
      key: `issue-597.phase-9-review.${iteration}`,
    });

    implementationIterations.push({
      iteration,
      backendImplementation,
      cliImplementation,
      mcpImplementation,
      docsUpdate,
      verification,
      review,
    });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const delivery = await ctx.task(deliveryTask, {
    inputs,
    issueContext,
    reuseAudit,
    surfaceMap,
    contract,
    tests,
    backendImplementation,
    cliImplementation,
    mcpImplementation,
    docsUpdate,
    verification,
    review,
    implementationIterations,
  }, {
    key: "issue-597.phase-10-delivery",
  });

  return {
    success: delivery?.ready === true,
    phases: [
      "issue-context",
      "phase-0-reuse-audit",
      "surface-map",
      "contract-spec",
      "contract-tests",
      "backend-types-and-lifecycle",
      "cli-surface",
      "mcp-tools-resources-subscriptions",
      "docs-and-parity",
      "verification-loop",
      "final-review",
      "delivery",
    ],
    changedFiles: delivery?.changedFiles ?? [],
    issueContext,
    reuseAudit,
    surfaceMap,
    contract,
    tests,
    backendImplementation,
    cliImplementation,
    mcpImplementation,
    docsUpdate,
    verification,
    review,
    implementationIterations,
    delivery,
  };
}

export const readIssueContextTask = defineTask("issue-597.read-issue-context", (args, taskCtx) => ({
  kind: "agent",
  title: "Read issue #597 and linked context",
  labels: ["issue-597", "research", "issue-context"],
  agent: {
    name: "tasks-mux-issue-researcher",
    prompt: {
      role: "senior tasks-mux maintainer",
      task: "Read the issue, comments, labels, and linked references that define the implementation scope.",
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR instead of an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        "Read docs/agent-layer-gaps.md entries for tasks-mux CLI, MCP tools, resources, search/filter, assignment, comments, escalation, templates, and rules.",
        "Read related issues listed in inputs only for scope dependencies and conflicts; do not expand implementation beyond issue #597 without a direct dependency.",
        "Treat the issue body, comments, and labels as the source of truth.",
        "Return JSON with title, labels, commentsSummary, acceptanceCriteria, relatedIssues, affectedSurfaces, explicitNonGoals, risks, and openQuestions.",
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask("issue-597.phase-0-reuse-audit", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 0 - Required reuse audit",
  labels: ["issue-597", "phase-0", "reuse-audit"],
  agent: {
    name: "tasks-mux-reuse-auditor",
    prompt: {
      role: "senior TypeScript monorepo engineer",
      task: "Perform the mandatory reuse audit before any implementation begins.",
      instructions: [
        "Do not edit files in this phase.",
        "Render a section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).",
        "Extract nouns and verbs from the issue: breakpoints, responders, templates, rules, search, assign, reassign, close, approve, create_todo, create_task, assign_task, search_tasks, cancel_breakpoint, escalate_breakpoint, add_comment_to_breakpoint, breakpoint resource, resource subscriptions.",
        "Scan packages/tasks-mux/src, packages/tasks-mux/src/__tests__, docs/agent-layer-gaps.md, docs/agent-reference, and package metadata for existing seams.",
        "Search for package imports, backend methods, CLI commands, MCP registrations, MCP resource APIs, subscription APIs, environment variables, SDK dependencies, and docs that can be reused.",
        "If .a5c/reuse-audit.json exists, honor its scan globs and keyword extraction rules.",
        "Identify partial existing backend support in git-native, server, github-issues, external-tracker, and agent-mux before proposing new abstractions.",
        "Return JSON with findings, reusableSeams, missingSeams, likelyTargetFiles, infrastructureToAvoidRecreating, risks, and blockerIfAny.",
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const surfaceMapTask = defineTask("issue-597.phase-1-surface-map", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 1 - Map current tasks-mux surfaces",
  labels: ["issue-597", "phase-1", "architecture"],
  agent: {
    name: "tasks-mux-surface-mapper",
    prompt: {
      role: "tasks-mux architecture mapper",
      task: "Trace the current CLI, MCP, backend, resource, subscription, and test call paths for issue #597.",
      instructions: [
        "Do not edit files in this phase.",
        "Map CLI registration from packages/tasks-mux/src/cli/program.ts into each command module and client/backend it calls.",
        "Map MCP registration from packages/tasks-mux/src/mcp/server.ts into tool handler modules, backend resolution, HTTP transport, and stdio startup.",
        "Map BreakpointBackend and type schema responsibilities across backend.ts, types.ts, backends/index.ts, and concrete backend implementations.",
        "Map relevant tests that must change or become contract tests: cli-program, cli-output, mcp-server, mcp-http-transport, mcp tool tests, shared-types-backend-interface, and concrete backend tests.",
        "Identify docs and packaged-surface expectations that should be updated.",
        "Return JSON with callPaths, currentSurfaceInventory, testInventory, docsInventory, packageSurfaceInventory, and integrationRisks.",
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const contractSpecTask = defineTask("issue-597.phase-2-contract-spec", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 2 - Define CLI/MCP/backend contract",
  labels: ["issue-597", "phase-2", "contract"],
  agent: {
    name: "tasks-mux-contract-designer",
    prompt: {
      role: "API and CLI contract designer",
      task: "Define the concrete surface contract before production code changes.",
      instructions: [
        "Do not edit production files in this phase.",
        "Define exact CLI grammar for breakpoints search, assign, reassign, close, approve, list --status; responders search, stats; templates list/show/create; and rules list/add/remove.",
        "Define exact MCP tool names, schemas, handler behavior, and output shapes for create_todo, create_task, assign_task, search_tasks, cancel_breakpoint, escalate_breakpoint, and add_comment_to_breakpoint.",
        "Define breakpoint://[id] resource behavior, read/list semantics, subscription lifecycle, and state-change notification payloads for both HTTP and stdio where supported by the current MCP SDK.",
        "Define shared backend/type extensions needed for search/filter, assignment/reassignment, close/approve, comments, escalation, templates, rules, and task/todo aliases.",
        "Make unsupported backend behavior explicit and consistent rather than silently succeeding.",
        "Preserve backward compatibility for existing ask/responders/breakpoints/server/responder-loop/auth commands and the existing MCP tools.",
        "If the MCP SDK resource/subscription API is ambiguous or unavailable, set needsHumanDecision=true with a specific question and options.",
        "Return JSON with cliContract, mcpToolContract, resourceContract, subscriptionContract, backendContract, compatibilityRules, migrationPlan, needsHumanDecision, question, options, and acceptanceCriteria.",
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const contractTestsTask = defineTask("issue-597.phase-3-contract-tests", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 3 - Write failing contract tests first",
  labels: ["issue-597", "phase-3", "tdd", "tests"],
  agent: {
    name: "tasks-mux-tdd-engineer",
    prompt: {
      role: "senior TypeScript engineer practicing strict TDD",
      task: "Add contract tests that fail for the missing issue #597 surfaces before implementation.",
      instructions: [
        "Edit only tests and minimal type fixtures needed to express the RED state.",
        "Add or update CLI tests for command registration, command options, JSON output, non-JSON output, and error handling.",
        "Add or update backend contract tests for search/filter, assignment/reassignment, close/approve, comments, escalation, templates, rules, and task/todo aliases.",
        "Add or update MCP tests for public tool list, handler schemas, handler backend calls, error behavior, breakpoint resources, resource reads, subscriptions, and state-change notifications.",
        "Cover HTTP and stdio registration paths where the current MCP SDK supports them.",
        "Prove the tests fail because the surfaces are missing, not because of fixture setup or import errors.",
        "Return JSON with testFiles, redCommands, redResultSummary, behaviorsCovered, implementationHints, and risks.",
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const backendImplementationTask = defineTask("issue-597.phase-4-backend", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 4 - Extend shared backend and type contracts",
  labels: ["issue-597", "phase-4", "backend", "types"],
  agent: {
    name: "tasks-mux-backend-implementer",
    prompt: {
      role: "senior TypeScript backend engineer",
      task: "Implement the shared tasks-mux backend/type support needed by the CLI and MCP surfaces.",
      instructions: [
        "Keep changes scoped to issue #597.",
        "Extend shared types and BreakpointBackend capabilities before adding command/tool-specific logic.",
        "Implement backend methods or capability helpers for search/filter, assignment/reassignment, close/approve, comments, escalation, templates, rules, and task/todo aliases.",
        "Update git-native, server, GitHub Issues, external-tracker, and agent-mux behavior where the contract requires support.",
        "For unsupported backend operations, return clear typed errors or documented capability failures consistently across CLI and MCP.",
        "Preserve existing breakpoint lifecycle semantics and existing tests.",
        "Run focused backend/type tests and fix only issue-related failures.",
        "Return JSON with changedFiles, implementedCapabilities, unsupportedCapabilities, compatibilityNotes, focusedCommandsRun, and remainingRisks.",
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const cliImplementationTask = defineTask("issue-597.phase-5-cli", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 5 - Add CLI command surface",
  labels: ["issue-597", "phase-5", "cli"],
  agent: {
    name: "tasks-mux-cli-implementer",
    prompt: {
      role: "TypeScript CLI engineer",
      task: "Add the missing tasks-mux CLI command groups and subcommands using existing Commander and output conventions.",
      instructions: [
        "Keep changes scoped to CLI files, client helpers, tests, and shared types needed by the contract.",
        "Implement breakpoints search, assign, reassign, close, approve, and list --status using existing JSON/non-JSON output conventions.",
        "Implement responders search and stats using existing ResponderMatcher/client conventions where possible.",
        "Add templates list/show/create and rules list/add/remove as first-class command groups only if the contract selected that grammar.",
        "Use formatTable, printError, and existing global option behavior consistently.",
        "Do not break existing ask, breakpoints pending/answer/status/poll, responders list/show, server, responder-loop, or auth commands.",
        "Run focused CLI tests and fix only issue-related failures.",
        "Return JSON with changedFiles, commandsAdded, outputBehavior, compatibilityNotes, focusedCommandsRun, and remainingRisks.",
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const mcpImplementationTask = defineTask("issue-597.phase-6-mcp", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 6 - Add MCP tools, resources, and subscriptions",
  labels: ["issue-597", "phase-6", "mcp"],
  agent: {
    name: "tasks-mux-mcp-implementer",
    prompt: {
      role: "MCP server engineer",
      task: "Add the missing tasks-mux MCP tools, breakpoint resources, and state-change subscriptions.",
      instructions: [
        "Keep changes scoped to MCP files, backend resolver support, tests, and shared types needed by the contract.",
        "Implement create_todo/create_task, assign_task, search_tasks, cancel_breakpoint, escalate_breakpoint, and add_comment_to_breakpoint with zod schemas and handler modules matching existing MCP tool style.",
        "Register breakpoint://[id] resources and resource reads in createBreakpointMcpServer using the current MCP SDK API.",
        "Implement resource subscription and state-change notification support where the current MCP SDK and transport support it; document and test any unsupported transport behavior explicitly.",
        "Preserve all existing MCP tools and their output shape.",
        "Cover backend resolution, JSON result formatting, and typed errors consistently.",
        "Run focused MCP tests for server, tools, HTTP transport, and stdio startup where present.",
        "Return JSON with changedFiles, toolsAdded, resourcesAdded, subscriptionsAdded, unsupportedTransportNotes, focusedCommandsRun, and remainingRisks.",
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const docsParityTask = defineTask("issue-597.phase-7-docs-parity", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 7 - Update docs and packaged surface parity",
  labels: ["issue-597", "phase-7", "docs", "package-surface"],
  agent: {
    name: "tasks-mux-docs-maintainer",
    prompt: {
      role: "SDK package surface maintainer",
      task: "Update documentation and package-surface metadata to match the implemented CLI/MCP/backend contract.",
      instructions: [
        "Update only docs and package-surface metadata directly affected by issue #597.",
        "Document command usage, MCP tool/resource names, backend capability behavior, unsupported backend errors, and migration notes.",
        "Keep docs aligned with actual implemented command and tool schemas.",
        "Update exports or package metadata only if the implementation added public types or modules that must be packaged.",
        "Do not remove docs for existing supported behavior.",
        "Return JSON with changedFiles, docsUpdated, exportsUpdated, parityChecks, and remainingRisks.",
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verificationGateTask = defineTask("issue-597.phase-8-verification", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 8 - Run quality gates and fix scoped failures",
  labels: ["issue-597", "phase-8", "verification", "quality-gate"],
  agent: {
    name: "tasks-mux-quality-engineer",
    prompt: {
      role: "senior TypeScript QA engineer",
      task: "Run the issue #597 quality gates with fresh evidence and fix only scoped failures.",
      instructions: [
        "Run the verification commands from inputs, plus any focused commands from earlier phases that need rechecking.",
        "At minimum verify focused contract tests, full tasks-mux tests, tasks-mux typecheck/build, packaged surface parity, npm pack dry run where available, metadata verification, and git diff --check.",
        "Confirm the RED tests from Phase 3 are now green.",
        "Inspect failures before editing. Fix only issue #597-related failures.",
        "Confirm no unrelated source files changed.",
        "Return JSON with passed, commandsRun, failures, fixesApplied, changedFilesAfterVerification, evidence, and unresolvedFailures.",
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalReviewTask = defineTask("issue-597.phase-9-final-review", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 9 - Final implementation review",
  labels: ["issue-597", "phase-9", "review"],
  agent: {
    name: "tasks-mux-surface-reviewer",
    prompt: {
      role: "adversarial reviewer for CLI/MCP/backend surface parity",
      task: "Review the final implementation against issue #597, the contract, and the verification evidence.",
      instructions: [
        "Do not make broad refactors.",
        "Review for CLI/MCP/backend contract drift, missing tests, inconsistent unsupported-backend errors, broken existing command/tool behavior, schema incompatibility, and docs mismatch.",
        "Verify breakpoint resources and subscriptions are implemented or explicitly documented as unsupported where the MCP SDK cannot support them.",
        "Verify all required CLI commands and MCP tools from the issue are present or covered by an approved contract decision.",
        "If defects are found, fix narrowly and request a verification rerun for affected commands.",
        "Return JSON with approved, score, findings, fixesApplied, residualRisks, and finalVerificationNeeded.",
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliveryTask = defineTask("issue-597.phase-10-delivery", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 10 - Prepare implementation delivery",
  labels: ["issue-597", "phase-10", "delivery"],
  agent: {
    name: "tasks-mux-delivery-captain",
    prompt: {
      role: "release-focused maintainer",
      task: "Prepare the final implementation delivery summary for issue #597.",
      instructions: [
        "Confirm verification passed and review approved.",
        "Summarize implemented CLI commands, MCP tools, resources, subscriptions, backend/type changes, docs changes, and quality gates.",
        "List exact changed files and verification commands with pass/fail status.",
        "Call out residual risks or unsupported backend behavior that should be visible in the PR body.",
        "Do not create commits or PRs from inside this task unless the implementation run explicitly requests delivery automation.",
        "Return JSON with ready, changedFiles, summary, verificationSummary, reviewSummary, residualRisks, and prBodyDraft.",
      ],
      context: args,
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
