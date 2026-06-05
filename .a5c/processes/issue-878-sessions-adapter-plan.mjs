/**
 * @process issue-878-sessions-adapter-plan
 * @description Plan and execute issue #878: unified, ontology-driven persistent session adapters for native and plugin targets.
 * @inputs {
 *   issueNumber: number,
 *   baseBranch: string,
 *   implementationBranchName: string,
 *   targetAgents: string[],
 *   verificationCommands: string[],
 *   docsToUpdate: string[]
 * }
 * @outputs { success: boolean, reuseAudit: object, contract: object, fixtures: object, implementation: object, verification: object, review: object, delivery: object }
 *
 * Planning research performed before authoring:
 * - gh issue view 878 --json title,body,labels,comments
 * - gh pr view 878 --json files,title,body,comments (no PR exists for #878)
 * - babysitter process-library:active --json
 * - docs/agent-reference/process-authoring.md
 * - packages/adapters/core/src/session-manager.ts
 * - packages/adapters/core/src/adapter-types.ts
 * - packages/adapters/codecs/src/session-fs.ts
 * - packages/adapters/codecs/src/{claude-adapter,codex-adapter,pi-adapter}.ts
 * - packages/adapters/gateway/src/runs/manager.ts
 * - packages/adapters/gateway/src/server.ts
 * - packages/atlas/graph/lifecycle/session-semantics/*.yaml
 * - packages/atlas/graph/extensions/plugin-artifacts/plugin-target-*.yaml
 * - docs/adapters/reference/07-session-manager.md
 * - docs/adapters/tutorials/sessions.md
 * - packages/adapters/* session, CLI, gateway, hook, and e2e test surfaces
 *
 * Process-library research:
 * - .a5c/process-library/ was not present in this checkout.
 * - Active SDK binding: /home/runner/.a5c/process-library/babysitter-repo/library
 * - Matching methodologies:
 *   - methodologies/spec-kit-brownfield.js
 *   - methodologies/spec-driven-development.js
 *   - methodologies/atdd-tdd/atdd-tdd.js
 *   - methodologies/superpowers/test-driven-development.js
 *   - methodologies/superpowers/verification-before-completion.js
 *   - methodologies/v-model/v-model.js
 *   - processes/shared/tdd-triplet.js
 *   - processes/shared/completeness-gate.js
 * - Matching specializations:
 *   - specializations/sdk-platform-development/sdk-testing-strategy.js
 *   - specializations/sdk-platform-development/backward-compatibility-management.js
 *   - specializations/sdk-platform-development/compatibility-testing.js
 *   - specializations/qa-testing-automation/contract-testing.js
 *   - specializations/qa-testing-automation/e2e-testing-strategy.js
 *   - specializations/qa-testing-automation/quality-gates.js
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - SessionManagerImpl currently delegates list/get to each adapter's listSessionFiles() and parseSessionFile().
 * - BaseAgentAdapterInterface still requires per-adapter sessionDir(), parseSessionFile(), and listSessionFiles().
 * - packages/adapters/codecs/src/session-fs.ts has reusable JSON/JSONL filesystem helpers and Codex-specific parsing logic.
 * - Claude, Codex, Pi, Gemini, OpenCode, OMP, Copilot, Cursor, Hermes, OpenClaw, Droid, Amp, and other adapters already expose per-target session wrappers.
 * - packages/adapters/gateway/src/runs/manager.ts has a direct native-session fallback that again uses adapter list/parse functions.
 * - Atlas already has SessionSemantics records and PluginTarget metadata with session env vars, launch behavior, adapter module, session ID quality, and plugin host details.
 * - Existing docs describe adapter-delegated parsing and must be updated to describe the new shared contract without hiding backward compatibility behavior.
 * - Existing test surfaces include adapter codec session tests, core SessionManager tests, CLI session tests, gateway server/session runtime tests, hook session-resolver tests, extension target contract tests, and e2e sessions-list-export tests.
 *
 * Repo-specific authoring note:
 * - Per docs/agent-reference/process-authoring.md, this direct babysitter process uses agent tasks for implementation and verification and avoids kind: "shell" subtasks.
 * - Breakpoints are sparse and only used when the contract phase finds an actual maintainer-level ambiguity.
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

const DEFAULT_MAX_ITERATIONS = 3;

function io(taskCtx) {
  return {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  };
}

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 878;
  const baseBranch = inputs?.baseBranch ?? "staging";
  const implementationBranchName =
    inputs?.implementationBranchName ?? "agent/issue-878-sessions-adapter";
  const maxImplementationIterations =
    inputs?.maxImplementationIterations ?? DEFAULT_MAX_ITERATIONS;

  const issueContext = await ctx.task(readIssueContextTask, {
    issueNumber,
    baseBranch,
    inputs,
  }, { key: "issue-878.phase-0.issue-context" });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    issueNumber,
    issueContext,
    inputs,
  }, { key: "issue-878.phase-0.reuse-audit" });

  const architectureMap = await ctx.task(mapCurrentArchitectureTask, {
    issueNumber,
    issueContext,
    reuseAudit,
    inputs,
  }, { key: "issue-878.phase-1.architecture-map" });

  const contract = await ctx.task(authorContractAndSpecTask, {
    issueNumber,
    issueContext,
    reuseAudit,
    architectureMap,
    inputs,
  }, { key: "issue-878.phase-2.contract-and-spec" });

  if (contract?.requiresMaintainerDecision === true) {
    const decision = await ctx.breakpoint({
      title: "Issue #878 Session Adapter Contract Decision",
      question:
        contract.question ||
        "The unified session adapter contract has an unresolved compatibility or scope decision. Choose the approved path before implementation starts.",
      options: contract.options || [
        "Proceed with compatibility-preserving shared registry",
        "Pause for maintainer guidance",
      ],
      expert: "owner",
      tags: ["issue-878", "sessions", "adapters", "architecture"],
      context: {
        runId: ctx.runId,
        issueNumber,
        contract,
      },
    }, {
      breakpointId: "issue-878.contract-decision",
      strategy: "single",
    });

    if (decision?.approved === false) {
      return {
        success: false,
        issueNumber,
        blockedAt: "contract-decision",
        issueContext,
        reuseAudit,
        architectureMap,
        contract,
        decision,
      };
    }
  }

  const fixtureAndTestPlan = await ctx.task(authorFixtureAndTestPlanTask, {
    issueNumber,
    issueContext,
    reuseAudit,
    architectureMap,
    contract,
    inputs,
  }, { key: "issue-878.phase-3.fixtures-and-tests" });

  const iterations = [];
  let implementation = null;
  let verification = null;
  let review = null;

  for (let iteration = 1; iteration <= maxImplementationIterations; iteration += 1) {
    implementation = await ctx.task(implementationTask, {
      issueNumber,
      iteration,
      issueContext,
      reuseAudit,
      architectureMap,
      contract,
      fixtureAndTestPlan,
      previousVerification: verification,
      previousReview: review,
      inputs,
    }, { key: `issue-878.phase-4.implementation.${iteration}` });

    verification = await ctx.task(verificationTask, {
      issueNumber,
      iteration,
      issueContext,
      contract,
      fixtureAndTestPlan,
      implementation,
      verificationCommands: inputs?.verificationCommands ?? [],
    }, { key: `issue-878.phase-5.verification.${iteration}` });

    review = await ctx.task(reviewTask, {
      issueNumber,
      iteration,
      issueContext,
      reuseAudit,
      architectureMap,
      contract,
      fixtureAndTestPlan,
      implementation,
      verification,
    }, { key: `issue-878.phase-6.review.${iteration}` });

    iterations.push({ iteration, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const docsAndMigration = await ctx.task(docsAndMigrationTask, {
    issueNumber,
    issueContext,
    contract,
    fixtureAndTestPlan,
    implementation,
    verification,
    review,
    docsToUpdate: inputs?.docsToUpdate ?? [],
  }, { key: "issue-878.phase-7.docs-and-migration" });

  const finalAcceptance = await ctx.task(finalAcceptanceTask, {
    issueNumber,
    issueContext,
    reuseAudit,
    architectureMap,
    contract,
    fixtureAndTestPlan,
    iterations,
    implementation,
    verification,
    review,
    docsAndMigration,
    acceptanceCriteria: inputs?.acceptanceCriteria ?? [],
  }, { key: "issue-878.phase-8.final-acceptance" });

  if (finalAcceptance?.passed !== true) {
    return {
      success: false,
      issueNumber,
      baseBranch,
      issueContext,
      reuseAudit,
      architectureMap,
      contract,
      fixtureAndTestPlan,
      iterations,
      docsAndMigration,
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
    docsAndMigration,
  }, { key: "issue-878.phase-9.delivery" });

  return {
    success: delivery?.readyForPr === true,
    issueNumber,
    baseBranch,
    issueContext,
    reuseAudit,
    architectureMap,
    contract,
    fixtureAndTestPlan,
    iterations,
    docsAndMigration,
    finalAcceptance,
    delivery,
    metadata: {
      processId: "issue-878-sessions-adapter-plan",
      completedAt: ctx.now?.().toISOString?.() ?? new Date().toISOString(),
    },
  };
}

export const readIssueContextTask = defineTask("issue-878.read-issue-context", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 0 - Read issue and planning context",
  labels: ["issue-878", "phase-0", "context"],
  agent: {
    name: "sessions-context-reader",
    prompt: {
      role: "senior maintainer collecting authoritative feature context",
      task: "Read the issue, all comments, labels, and relevant docs before implementation planning.",
      instructions: [
        "Do not edit files in this phase.",
        "Use gh issue view 878 --json title,body,labels,comments as the authoritative issue input.",
        "Confirm whether #878 is also a PR; if not, record that no PR object exists.",
        "Capture the triage comment's affected files/functions, root cause, acceptance criteria, priority, risk, and related prior work.",
        "Read docs/adapters/reference/07-session-manager.md and docs/adapters/tutorials/sessions.md for current public contract language.",
        "Return JSON with issueSummary, labels, commentsSummary, acceptanceRequirements, riskProfile, relatedDocs, and artifactPath.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));

export const reuseAuditTask = defineTask("issue-878.reuse-audit", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 0 - Reuse audit",
  labels: ["issue-878", "phase-0", "reuse-audit"],
  agent: {
    name: "sessions-reuse-auditor",
    prompt: {
      role: "brownfield platform reuse auditor",
      task: "Run the mandatory reuse audit before proposing new infrastructure or contracts.",
      instructions: [
        "Start the report with exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).",
        "Do not edit files in this phase.",
        "Extract keywords: session adapter, persistent session, parseSessionFile, listSessionFiles, SessionManagerImpl, SessionSemantics, PluginTarget, adapterModule, native session ID, unified ID, resume, gateway sessions, CLI sessions, fixture matrix.",
        "Scan package dependencies, imports, existing session helpers, API routes, CLI commands, tests, fixtures, Atlas records, plugin target metadata, and environment variable names.",
        "Honor .a5c/reuse-audit.json if present.",
        "Classify existing seams as reusable, implemented-but-needs-contract, missing, stale, or off-path.",
        "Identify any existing migrations or generated catalog outputs that must be updated rather than recreated.",
        "Return JSON with findings, existingInfrastructure, reusableHelpers, liveCallPaths, missingGaps, verificationGaps, offPathRisks, and artifactPath.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));

export const mapCurrentArchitectureTask = defineTask("issue-878.map-current-architecture", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 1 - Map current session architecture",
  labels: ["issue-878", "phase-1", "architecture"],
  agent: {
    name: "session-architecture-mapper",
    prompt: {
      role: "TypeScript platform architect",
      task: "Trace the current native and plugin session parsing architecture and identify the exact integration boundaries.",
      instructions: [
        "Do not edit files in this phase.",
        "Trace SessionManagerImpl list/get/search/export/diff and unified/native ID resolution.",
        "Trace adapter contract requirements in packages/adapters/core/src/adapter-types.ts and packages/adapters/core/src/adapter.ts.",
        "Trace packages/adapters/codecs session parsing wrappers for claude, codex, pi, gemini, opencode, omp, copilot, cursor, hermes, openclaw, droid, and amp where present.",
        "Trace gateway session list/show/full/message routes and runs manager native-session fallback.",
        "Trace CLI sessions list/show/full/export/resume/fork behavior and its dependency on SessionManager.",
        "Trace Atlas catalog APIs that expose SessionSemantics, PluginTarget, adapter metadata, runtime implementation, and session directory fields.",
        "Trace plugin generation/extension target contract tests that could validate plugin-generated targets.",
        "Return JSON with callPaths, contractBoundaries, atlasInputs, targetMatrix, testSurfaces, docsSurfaces, compatibilityConstraints, and artifactPath.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));

export const authorContractAndSpecTask = defineTask("issue-878.author-contract-and-spec", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 2 - Author unified session adapter contract and specs",
  labels: ["issue-878", "phase-2", "spec", "contract"],
  agent: {
    name: "session-contract-author",
    prompt: {
      role: "spec-driven SDK architect",
      task: "Write the implementation spec for a unified, ontology-driven session adapter layer.",
      instructions: [
        "Do not implement runtime code in this task unless this process is being executed for implementation; the output is a contract-ready work plan.",
        "Define a shared SessionAdapter or SessionParser contract that separates native ID, unified ID, file discovery, parser selection, metadata normalization, and resume/fork capabilities.",
        "Define how Atlas SessionSemantics and PluginTarget metadata are consumed without making runtime behavior depend on fragile YAML string parsing at hot call sites.",
        "Define backward compatibility for existing AgentAdapter parseSessionFile/listSessionFiles methods while moving SessionManager and gateway to the shared registry.",
        "Define target support for at least claude-code, codex, pi, gemini, opencode, and one plugin-generated target; include extension points for copilot, cursor, hermes, openclaw, omp, droid, and amp.",
        "Define malformed/unreadable session handling, cwd-scoped listing, date sorting fast path, cost aggregation, session ID normalization, and optional remote/programmatic adapter behavior.",
        "Define public docs changes and migration notes.",
        "Set requiresMaintainerDecision true only for an actual compatibility or scope decision that cannot be safely resolved from current issue/docs/code.",
        "Return JSON with proposedContract, registryDesign, atlasProjectionDesign, compatibilityPlan, migrationPlan, openQuestions, requiresMaintainerDecision, question, options, and artifactPath.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));

export const authorFixtureAndTestPlanTask = defineTask("issue-878.author-fixture-and-test-plan", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 3 - Author fixture matrix and tests first",
  labels: ["issue-878", "phase-3", "tests", "fixtures", "tdd"],
  agent: {
    name: "session-test-planner",
    prompt: {
      role: "contract-testing and e2e testing specialist",
      task: "Create the test-first plan and fixture matrix for unified session adapters.",
      instructions: [
        "Implement tests before production code when the process is executed.",
        "Freeze representative native session fixtures for claude-code, codex, pi, gemini, opencode, and at least one plugin-generated target.",
        "Include fixture coverage for malformed JSONL rows, missing files, session ID aliasing, cwd-scoped lists, date filters, cost records, tool calls, fork metadata, and active/resume lookups.",
        "Add or extend unit tests for shared registry selection, per-format parser behavior, SessionManager list/get/search/export/diff, and resolveUnifiedId/resolveNativeId.",
        "Add Atlas projection tests proving metadata used by the registry matches graph records and plugin target metadata.",
        "Add gateway tests for /api/v1/sessions, /api/v1/sessions/:id, and /api/v1/sessions/:id/full behavior.",
        "Add CLI/e2e coverage for adapters sessions list/show/full/export/resume paths through mock or fixture-backed adapters.",
        "Return JSON with fixtureMatrix, testsToAdd, testsToUpdate, fakeAdapters, e2eScenarios, acceptanceMapping, and artifactPath.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));

export const implementationTask = defineTask("issue-878.implementation", (args, taskCtx) => ({
  kind: "agent",
  title: `Phase 4 - Implement unified session adapters (iteration ${args.iteration})`,
  labels: ["issue-878", "phase-4", "implementation", `iteration-${args.iteration}`],
  agent: {
    name: "session-adapter-implementer",
    responderType: "agent",
    adapter: "codex",
    fallbackType: "internal",
    prompt: {
      role: "senior TypeScript engineer implementing a brownfield adapter platform feature",
      task: "Implement the unified session adapter layer according to the contract and test plan.",
      instructions: [
        "Before editing, read current diffs and avoid overwriting unrelated user changes.",
        "Keep edits scoped to adapters, Atlas projection/catalog code, gateway, CLI, tests, fixtures, and docs required by issue #878.",
        "Add shared session adapter interfaces and registry in the adapters package boundary that already owns session management.",
        "Reuse existing session-fs helpers and target-specific parsers where native formats differ; do not duplicate parser logic unnecessarily.",
        "Wire SessionManagerImpl to the shared registry while preserving the legacy adapter parse/list API as a compatibility shim.",
        "Wire gateway native-session loading through the shared registry instead of directly re-parsing adapter file paths.",
        "Use Atlas SessionSemantics and PluginTarget data as tested registry inputs; keep runtime access through structured catalog APIs or generated projections.",
        "Preserve native session IDs separately from unified IDs and cover active session lookup plus resume/fork paths.",
        "Implement docs and examples only after the runtime behavior and tests are in place.",
        "Return JSON with changedFiles, implementationSummary, compatibilityNotes, testsAdded, docsUpdated, unresolvedRisks, and artifactPath.",
      ],
      context: args,
    },
    maxTurns: 20,
    timeout: 900000,
    approvalMode: "yolo",
  },
  io: io(taskCtx),
}));

export const verificationTask = defineTask("issue-878.verification", (args, taskCtx) => ({
  kind: "agent",
  title: `Phase 5 - Run quality gates (iteration ${args.iteration})`,
  labels: ["issue-878", "phase-5", "verification", `iteration-${args.iteration}`],
  agent: {
    name: "session-adapter-verifier",
    responderType: "agent",
    adapter: "codex",
    fallbackType: "internal",
    prompt: {
      role: "release verification engineer",
      task: "Run focused and broad quality gates for the session adapter implementation.",
      instructions: [
        "Do not skip failed commands; capture exact failing command, failure summary, and likely owning files.",
        "Run the focused tests from the fixture/test plan first.",
        "Run the verificationCommands from inputs, adapting only when a command is unavailable in the current package scripts and documenting the substitute.",
        "Verify TypeScript build coverage for affected adapters packages.",
        "Verify metadata/catalog projection tests and process metadata validation.",
        "Verify CLI and gateway session behavior through fixture-backed tests, not live provider credentials.",
        "Classify failures as implementation defect, stale test, environment-only unavailable, or pre-existing unrelated failure with evidence.",
        "Return JSON with passed, commands, focusedResults, broadResults, failures, environmentNotes, and artifactPath.",
      ],
      context: args,
    },
    maxTurns: 12,
    timeout: 900000,
    approvalMode: "yolo",
  },
  io: io(taskCtx),
}));

export const reviewTask = defineTask("issue-878.review", (args, taskCtx) => ({
  kind: "agent",
  title: `Phase 6 - Review implementation (iteration ${args.iteration})`,
  labels: ["issue-878", "phase-6", "review", `iteration-${args.iteration}`],
  agent: {
    name: "session-adapter-reviewer",
    responderType: "agent",
    adapter: "codex",
    fallbackType: "internal",
    prompt: {
      role: "critical code reviewer for adapter platform contracts",
      task: "Review the implementation for regressions, incomplete contract wiring, and missing tests.",
      instructions: [
        "Review from the diff and from the issue acceptance criteria, not from the implementer's summary alone.",
        "Prioritize blocking issues: cross-adapter parser regression, broken unified/native ID behavior, Atlas metadata drift, gateway API behavior changes, and docs claiming unsupported behavior.",
        "Check that legacy adapter APIs still work or are clearly deprecated with compatibility tests.",
        "Check that plugin-generated target coverage is real and not only hardcoded native target coverage.",
        "Check that tests include fixture-backed parser behavior and e2e CLI/gateway surfaces.",
        "Return JSON with approved, findings, requiredFixes, nonBlockingFollowups, coverageGaps, and artifactPath.",
      ],
      context: args,
    },
    maxTurns: 10,
    timeout: 600000,
  },
  io: io(taskCtx),
}));

export const docsAndMigrationTask = defineTask("issue-878.docs-and-migration", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 7 - Final docs and migration sweep",
  labels: ["issue-878", "phase-7", "docs", "migration"],
  agent: {
    name: "session-docs-migration-sweeper",
    prompt: {
      role: "developer documentation and migration specialist",
      task: "Make the final docs and migration pass for the unified session adapter feature.",
      instructions: [
        "Update the public session manager reference and tutorials to describe the shared registry and compatibility shims.",
        "Document how Atlas SessionSemantics and PluginTarget metadata influence session parsing and plugin target registration.",
        "Document how native session IDs, unified IDs, resume, fork, and active-session lookups are expected to behave.",
        "Remove or qualify stale text that says parsing is solely adapter-delegated if the implementation has changed that behavior.",
        "Confirm no source docs, generated catalog docs, or migration notes contradict the implemented contract.",
        "Return JSON with docsChanged, staleDocsResolved, migrationNotes, remainingDocsRisks, and artifactPath.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));

export const finalAcceptanceTask = defineTask("issue-878.final-acceptance", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 8 - Final acceptance gate",
  labels: ["issue-878", "phase-8", "quality-gate", "acceptance"],
  agent: {
    name: "session-adapter-acceptance-gate",
    prompt: {
      role: "release owner enforcing issue acceptance",
      task: "Decide whether issue #878 is ready for delivery.",
      instructions: [
        "Evaluate only evidence from issue context, reuse audit, contract/spec, tests, implementation, verification, review, and docs sweep.",
        "Require specs/docs/unit tests/e2e tests/implementation to be present and aligned.",
        "Require fixture-backed coverage for claude-code, codex, pi, gemini, opencode, and at least one plugin-generated target.",
        "Require Atlas projection tests proving runtime metadata inputs match graph/catalog records.",
        "Require gateway and CLI session behavior tests to pass or have precise environment-only unavailable evidence.",
        "Require backward compatibility for existing adapter APIs and existing session manager behavior.",
        "Return JSON with passed, acceptanceChecklist, blockingIssues, residualRisks, and readyForPr.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));

export const deliveryTask = defineTask("issue-878.delivery", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 9 - Delivery",
  labels: ["issue-878", "phase-9", "delivery"],
  agent: {
    name: "session-adapter-delivery-agent",
    prompt: {
      role: "maintainer preparing the implementation PR",
      task: "Prepare the finished implementation for review.",
      instructions: [
        "Create or reuse the implementation branch named in inputs.",
        "Commit only relevant implementation, test, fixture, Atlas, docs, and generated metadata files.",
        "Open a PR against the base branch with a concise feat: title and link to issue #878.",
        "Include a PR body summarizing contract changes, parser/registry wiring, target coverage, tests run, and residual risks.",
        "Post a comment on issue #878 with the implementation summary and PR link.",
        "Return JSON with readyForPr, branchName, commitSha, prUrl, issueCommentUrl, and deliveryNotes.",
      ],
      context: args,
    },
  },
  io: io(taskCtx),
}));
