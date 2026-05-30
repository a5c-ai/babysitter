/**
 * @process issue-634-tasks-mux-routing-hub-gaps
 * @description Implementation process for issue #634: tasks-mux task-management primitives needed before unified routing hub work.
 * @inputs { issueNumber: number, duplicateOf: number, relatedIssues: number[], baseBranch: string, targetBranch: string, designDocs: string[], contextFiles: string[], verificationCommands: string[], maxImplementationAttempts?: number, targetQuality?: number }
 * @outputs { success: boolean, context: object, reuseAudit: object, architecture: object, tests: object, attempts: object[], final: object }
 *
 * @process methodologies/spec-kit/spec-kit-planning
 * @process methodologies/atdd-tdd/atdd-tdd
 * @process methodologies/process-hardening/process-hardening-patterns
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/superpowers/finishing-a-development-branch
 * @agent architect methodologies/maestro/agents/architect/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent coder methodologies/maestro/agents/coder/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

const DEFAULT_MAX_IMPLEMENTATION_ATTEMPTS = 3;
const DEFAULT_TARGET_QUALITY = 90;

export async function process(inputs, ctx) {
  const issueNumber = inputs.issueNumber ?? 634;
  const duplicateOf = inputs.duplicateOf ?? 596;
  const maxImplementationAttempts = inputs.maxImplementationAttempts ?? DEFAULT_MAX_IMPLEMENTATION_ATTEMPTS;
  const targetQuality = inputs.targetQuality ?? DEFAULT_TARGET_QUALITY;

  const context = await ctx.task(readLiveContextTask, {
    issueNumber,
    duplicateOf,
    relatedIssues: inputs.relatedIssues ?? [],
    designDocs: inputs.designDocs ?? [],
    contextFiles: inputs.contextFiles ?? [],
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    searchTerms: inputs.reuseAuditSearchTerms ?? [],
    scanGlobs: inputs.reuseAuditScanGlobs ?? [],
  });

  const scope = await ctx.task(scopeTask, {
    issueNumber,
    duplicateOf,
    contextStdout: stdoutOf(context),
    reuseAuditStdout: stdoutOf(reuseAudit),
  });

  if (scope.requiresMaintainerDecision === true) {
    await ctx.breakpoint({
      title: "Issue #634 Scope Decision",
      question: scope.question ?? "Issue #634 is marked duplicate. Choose whether to continue with the narrowed #634 implementation plan.",
      options: [
        "Proceed with narrowed #634 plan",
        "Switch to duplicate parent #596",
        "Pause for maintainer guidance",
      ],
      context: { runId: ctx.runId, scope },
    });
  }

  const architecture = await ctx.task(architectureTask, {
    contextStdout: stdoutOf(context),
    reuseAuditStdout: stdoutOf(reuseAudit),
    scope,
  });

  const tests = await ctx.task(authorTestsTask, {
    contextStdout: stdoutOf(context),
    architecture,
    mutableTestPaths: inputs.mutableTestPaths ?? [],
  });

  const redGate = await ctx.task(redGateTask, {
    commands: tests.redGateCommands ?? inputs.redGateCommands ?? [],
  });

  const attempts = [];
  let implementation = null;
  let verification = null;
  let review = null;

  for (let attempt = 1; attempt <= maxImplementationAttempts; attempt += 1) {
    implementation = await ctx.task(implementationTask, {
      attempt,
      contextStdout: stdoutOf(context),
      reuseAuditStdout: stdoutOf(reuseAudit),
      scope,
      architecture,
      tests,
      redGateStdout: stdoutOf(redGate),
      previousVerification: verification,
      previousReview: review,
      mutableSourcePaths: inputs.mutableSourcePaths ?? [],
    });

    verification = await ctx.task(verificationTask, {
      commands: inputs.verificationCommands ?? [],
      attempt,
    });

    review = await ctx.task(reviewTask, {
      attempt,
      targetQuality,
      contextStdout: stdoutOf(context),
      reuseAuditStdout: stdoutOf(reuseAudit),
      architecture,
      tests,
      verificationStdout: stdoutOf(verification),
    });

    attempts.push({ attempt, implementation, verification, review });

    if (review.approved === true && (review.score ?? 0) >= targetQuality && gatePassed(verification)) {
      break;
    }
  }

  const artifacts = await ctx.task(readFinalArtifactsTask, {
    artifactCommand: inputs.finalArtifactCommand,
  });

  const final = await ctx.task(finalAcceptanceTask, {
    issueNumber,
    targetQuality,
    contextStdout: stdoutOf(context),
    reuseAuditStdout: stdoutOf(reuseAudit),
    artifactsStdout: stdoutOf(artifacts),
    architecture,
    tests,
    attempts,
  });

  if (final.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: "Issue #634 Final Decision",
      question: final.question ?? "Final acceptance found an unresolved compatibility or scope issue.",
      options: [
        "Accept current implementation",
        "Iterate on blocking findings",
        "Pause for maintainer guidance",
      ],
      context: { runId: ctx.runId, final },
    });
  }

  return {
    success: final.passed === true,
    context,
    reuseAudit,
    scope,
    architecture,
    tests,
    redGate,
    attempts,
    final,
    metadata: {
      processId: "issue-634-tasks-mux-routing-hub-gaps",
      issueNumber,
      duplicateOf,
      baseBranch: inputs.baseBranch ?? "staging",
      targetBranch: inputs.targetBranch,
      completedAt: nowIso(ctx),
    },
  };
}

const readLiveContextTask = defineTask("issue-634.read-live-context", (args, taskCtx) => {
  const docs = [...new Set([...(args.designDocs ?? []), ...(args.contextFiles ?? [])])];
  const relatedIssues = args.relatedIssues ?? [];
  const docReads = docs.map((file) => `printf '\\n===== ${file} =====\\n'; sed -n '1,260p' ${sh(file)}`).join("\n");
  const relatedReads = relatedIssues.map((issue) => `printf '\\n===== related issue #${issue} =====\\n'; gh issue view ${issue} --json title,body,labels,comments`).join("\n");
  return {
    kind: "shell",
    title: "Read live issue and tasks-mux context",
    labels: ["issue-634", "context", "spec"],
    shell: {
      command: [
        "set -euo pipefail",
        `printf '===== issue #${args.issueNumber} =====\\n'`,
        `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `printf '\\n===== issue #${args.issueNumber} PR probe =====\\n'`,
        `gh pr view ${args.issueNumber} --json files,title,body,comments 2>/dev/null || true`,
        `printf '\\n===== duplicate parent #${args.duplicateOf} =====\\n'`,
        `gh issue view ${args.duplicateOf} --json title,body,labels,comments`,
        relatedReads,
        docReads,
        "printf '\\n===== git status =====\\n'",
        "git status --short --branch",
      ].filter(Boolean).join("\n"),
      timeout: 240000,
      expectedExitCode: 0,
    },
    expectedExitCode: 0,
    io: io(taskCtx),
  };
});

const reuseAuditTask = defineTask("issue-634.reuse-audit", (args, taskCtx) => {
  const terms = (args.searchTerms?.length ? args.searchTerms : [
    "priority",
    "dependsOn",
    "searchBreakpoints",
    "bulk",
    "audit",
    "statusHistory",
    "state transition",
    "assignee",
    "reassign",
  ]).join("|");
  const globs = args.scanGlobs?.length ? args.scanGlobs : [
    "packages/tasks-mux",
    "packages/agent-runtime",
    "packages/agent-platform",
    "packages/agent-core",
    "docs",
    ".a5c/processes",
    "package.json",
  ];
  return {
    kind: "shell",
    title: "Phase 0 - Reuse audit",
    labels: ["issue-634", "reuse-audit"],
    shell: {
      command: [
        "set -euo pipefail",
        "printf '## Reuse-audit findings (REVIEW BEFORE PROCEEDING)\\n\\n'",
        "printf '### Matching migrations and API routes\\n'",
        "find . -path './node_modules' -prune -o -path './.git' -prune -o \\( -path './supabase/migrations/*.sql' -o -path './src/app/api/*/route.ts' -o -path './src/app/api/*/route.js' -o -path './app/api/*/route.ts' -o -path './app/api/*/route.js' \\) -print || true",
        "printf '\\n### Matching source/docs/process surfaces\\n'",
        `rg -n ${sh(terms)} ${globs.map(sh).join(" ")} -S -g '*.ts' -g '*.tsx' -g '*.js' -g '*.mjs' -g '*.md' -g '*.json' | head -1000 || true`,
        "printf '\\n### Environment variables near matched task-management surfaces\\n'",
        `rg -n 'process\\.env|BPX_|TASKS_MUX|BREAKPOINT|GITHUB|JIRA|LINEAR' ${globs.map(sh).join(" ")} -S -g '*.ts' -g '*.js' -g '*.mjs' | head -500 || true`,
        "printf '\\n### Package dependencies\\n'",
        "node -e \"const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); console.log(JSON.stringify({dependencies:p.dependencies,devDependencies:p.devDependencies,workspaces:p.workspaces}, null, 2))\"",
      ].join("\n"),
      timeout: 240000,
      expectedExitCode: 0,
    },
    expectedExitCode: 0,
    io: io(taskCtx),
  };
});

const scopeTask = defineTask("issue-634.scope", (args, taskCtx) => ({
  kind: "agent",
  title: "Classify issue scope and duplicate relationship",
  labels: ["issue-634", "scope"],
  agent: {
    name: "architect",
    prompt: {
      role: "senior Babysitter maintainer",
      task: "Classify #634 scope from live issue bytes and the reuse audit.",
      instructions: [
        "Do not edit files.",
        "SPEC AND CONTEXT (verbatim):",
        "---",
        args.contextStdout,
        "---",
        "REUSE AUDIT (verbatim):",
        "---",
        args.reuseAuditStdout,
        "---",
        "Treat #634 as a narrowed duplicate of #596 unless the live issue text/comments say otherwise.",
        "Preserve the exact #634 deliverables: priority low|medium|high|critical, dependsOn, searchBreakpoints filters, status history, bulk approve/close/reassign, state-machine validation, and audit log.",
        "Classify broader #596 items as non-goals unless needed as extension hooks.",
        "Return JSON with issueSummary, labels, deliverables, nonGoals, duplicateRelationship, relatedIssues, requiresMaintainerDecision, question.",
      ],
    },
    outputSchema: {
      type: "object",
      required: ["issueSummary", "deliverables", "nonGoals", "duplicateRelationship", "requiresMaintainerDecision"],
    },
  },
  io: io(taskCtx),
}));

const architectureTask = defineTask("issue-634.architecture", (args, taskCtx) => ({
  kind: "agent",
  title: "Design additive tasks-mux contract",
  labels: ["issue-634", "architecture"],
  agent: {
    name: "architect",
    prompt: {
      role: "senior TypeScript API and persistence architect",
      task: "Design the implementation contract for #634 before tests and source changes.",
      instructions: [
        "Do not edit files.",
        "SPEC AND CONTEXT (verbatim):",
        "---",
        args.contextStdout,
        "---",
        "REUSE AUDIT (verbatim):",
        "---",
        args.reuseAuditStdout,
        "---",
        "SCOPE DECISION (verbatim):",
        "---",
        JSON.stringify(args.scope, null, 2),
        "---",
        "Produce an additive architecture that reuses current BreakpointSchema, BreakpointBackend, git-native JSON persistence, server/GitHub mappers, client, CLI, MCP, public exports, README, and specs.",
        "Define canonical types for priority, dependsOn, search query/results, bulk operation results, actor metadata, status history entries, audit log entries, and transition validation errors.",
        "Define compatibility behavior for context.urgency, legacy git-native JSON, hidden GitHub payloads, server Question/Expert naming, proven answers, ask/answer/status/poll/claim, and responder routing metadata.",
        "Define transition rules and terminal-success states so dependencies block answer/approve/complete paths and bulk approval paths consistently.",
        "Define backend parity expectations: full support where feasible, explicit unsupported capability errors where not feasible, and shared capability tests.",
        "Return JSON with runtimeCallPaths, affectedFiles, contract, stateMachine, dependencyRules, auditHistoryModel, backendPlan, cliMcpClientPlan, compatibilityPlan, orderedSlices, risks.",
      ],
    },
    outputSchema: {
      type: "object",
      required: ["runtimeCallPaths", "affectedFiles", "contract", "stateMachine", "dependencyRules", "auditHistoryModel", "backendPlan", "orderedSlices"],
    },
  },
  io: io(taskCtx),
}));

const authorTestsTask = defineTask("issue-634.author-tests", (args, taskCtx) => ({
  kind: "agent",
  title: "Author red-first acceptance and compatibility tests",
  labels: ["issue-634", "tests", "atdd"],
  agent: {
    name: "test-engineer",
    prompt: {
      role: "senior TypeScript test engineer",
      task: "Author failing tests before implementation changes.",
      instructions: [
        "SPEC AND CONTEXT (verbatim):",
        "---",
        args.contextStdout,
        "---",
        "ARCHITECTURE CONTRACT (verbatim):",
        "---",
        JSON.stringify(args.architecture, null, 2),
        "---",
        "Do not edit production source files in this phase.",
        "Edit only tests, fixtures, and narrowly necessary test-support files under the mutable test paths.",
        `Mutable test paths: ${JSON.stringify(args.mutableTestPaths)}`,
        "Create tests that fail against current implementation for priority, dependsOn, searchBreakpoints filters, status history, bulk approve/close/reassign, invalid transition rejection, audit log entries, backend capability parity, CLI/MCP exposure, package exports, and legacy fixture compatibility.",
        "Do not rationalize missing criteria from implementation artifacts; cite the spec/context or architecture contract for each test group.",
        "Return JSON with filesChanged, acceptanceTests, compatibilityFixtures, redGateCommands, sliceGateCommands, expectedInitialFailures.",
      ],
    },
    outputSchema: {
      type: "object",
      required: ["filesChanged", "acceptanceTests", "compatibilityFixtures", "redGateCommands", "sliceGateCommands", "expectedInitialFailures"],
    },
  },
  io: io(taskCtx),
}));

const redGateTask = defineTask("issue-634.red-gate", (args, taskCtx) => ({
  kind: "shell",
  title: "Confirm tests fail before implementation",
  labels: ["issue-634", "red-gate"],
  shell: {
    command: redGateCommand(args.commands ?? []),
    timeout: 900000,
    expectedExitCode: 0,
  },
  expectedExitCode: 0,
  io: io(taskCtx),
}));

const implementationTask = defineTask("issue-634.implementation", (args, taskCtx) => ({
  kind: "agent",
  title: `Implement issue #634 slices, attempt ${args.attempt}`,
  labels: ["issue-634", "implementation"],
  agent: {
    name: "coder",
    prompt: {
      role: "senior TypeScript engineer for tasks-mux",
      task: "Implement #634 in ordered, test-driven slices.",
      instructions: [
        "SPEC AND CONTEXT (verbatim):",
        "---",
        args.contextStdout,
        "---",
        "REUSE AUDIT (verbatim):",
        "---",
        args.reuseAuditStdout,
        "---",
        "ARCHITECTURE CONTRACT (verbatim):",
        "---",
        JSON.stringify(args.architecture, null, 2),
        "---",
        "TEST PLAN (verbatim):",
        "---",
        JSON.stringify(args.tests, null, 2),
        "---",
        "RED GATE OUTPUT (verbatim):",
        "---",
        args.redGateStdout,
        "---",
        "Modify only files on the live runtime call paths unless the architecture explicitly names an additional public surface.",
        `Mutable source paths: ${JSON.stringify(args.mutableSourcePaths)}`,
        "Implement in slices: shared schema/types/helpers, git-native persistence and operations, server/GitHub/client parity, CLI/MCP/docs/package exports.",
        "Preserve existing ask/answer/status/poll/claim, proven-answer behavior, responder routing metadata, and legacy breakpoint parsing.",
        "When backend parity cannot be complete, return explicit unsupported capability errors and tests proving the behavior.",
        "After each slice, run the relevant slice gate commands and record exact command output summaries.",
        "Return JSON with attempt, slicesCompleted, filesChanged, commandsRun, remainingFailures, compatibilityNotes.",
      ],
    },
    outputSchema: {
      type: "object",
      required: ["attempt", "slicesCompleted", "filesChanged", "commandsRun", "remainingFailures", "compatibilityNotes"],
    },
  },
  io: io(taskCtx),
}));

const verificationTask = defineTask("issue-634.verification", (args, taskCtx) => ({
  kind: "shell",
  title: `Run verification gates, attempt ${args.attempt}`,
  labels: ["issue-634", "verification"],
  shell: {
    command: verificationCommand(args.commands ?? []),
    timeout: 1200000,
    expectedExitCode: 0,
  },
  expectedExitCode: 0,
  io: io(taskCtx),
}));

const reviewTask = defineTask("issue-634.review", (args, taskCtx) => ({
  kind: "agent",
  title: `Review issue #634 implementation, attempt ${args.attempt}`,
  labels: ["issue-634", "review"],
  agent: {
    name: "code-reviewer",
    prompt: {
      role: "senior maintainer reviewing a tasks-mux API change",
      task: "Find blocking issues before final acceptance.",
      instructions: [
        "SPEC AND CONTEXT (verbatim):",
        "---",
        args.contextStdout,
        "---",
        "REUSE AUDIT (verbatim):",
        "---",
        args.reuseAuditStdout,
        "---",
        "ARCHITECTURE CONTRACT (verbatim):",
        "---",
        JSON.stringify(args.architecture, null, 2),
        "---",
        "TEST PLAN (verbatim):",
        "---",
        JSON.stringify(args.tests, null, 2),
        "---",
        "VERIFICATION OUTPUT (verbatim):",
        "---",
        args.verificationStdout,
        "---",
        "Prioritize bugs, API incompatibilities, dependency bypasses, invalid transition holes, audit/history omissions, backend parity gaps, missing CLI/MCP/client exposure, legacy fixture breakage, and missing tests.",
        `Approve only if score is at least ${args.targetQuality} and there are no blocking findings.`,
        "Return JSON with approved, score, findings, requiredFixes, testGaps, compatibilityNotes, needsMaintainerDecision.",
      ],
    },
    outputSchema: {
      type: "object",
      required: ["approved", "score", "findings", "requiredFixes", "testGaps", "compatibilityNotes", "needsMaintainerDecision"],
    },
  },
  io: io(taskCtx),
}));

const readFinalArtifactsTask = defineTask("issue-634.read-final-artifacts", (args, taskCtx) => ({
  kind: "shell",
  title: "Read final diff and verification artifacts",
  labels: ["issue-634", "artifacts"],
  shell: {
    command: args.artifactCommand ?? [
      "set -euo pipefail",
      "git status --short --branch",
      "git diff --stat",
      "git diff -- . ':!node_modules'",
    ].join("\n"),
    timeout: 240000,
    expectedExitCode: 0,
  },
  expectedExitCode: 0,
  io: io(taskCtx),
}));

const finalAcceptanceTask = defineTask("issue-634.final-acceptance", (args, taskCtx) => ({
  kind: "agent",
  title: "Final spec-to-artifacts acceptance",
  labels: ["issue-634", "final-gate"],
  agent: {
    name: "code-reviewer",
    prompt: {
      role: "release-quality gatekeeper",
      task: "Compare #634 spec to implementation artifacts directly.",
      instructions: [
        "Ignore any narrative in your context about how ARTIFACTS were built.",
        "SPEC AND CONTEXT (verbatim):",
        "---",
        args.contextStdout,
        "---",
        "REUSE AUDIT (verbatim):",
        "---",
        args.reuseAuditStdout,
        "---",
        "ARTIFACTS (verbatim):",
        "---",
        args.artifactsStdout,
        "---",
        "Compare SPEC to ARTIFACTS directly.",
        "Build a traceability matrix for priority, dependsOn, searchBreakpoints, status history, bulk approve/close/reassign, invalid transition rejection, audit log, backend parity, CLI/MCP/client exposure, docs, and legacy compatibility.",
        "Verify broader #596 items were not implemented without explicit tests and docs.",
        `Pass only if all #${args.issueNumber} deliverables are covered and review quality is at least ${args.targetQuality}.`,
        "Return JSON with passed, traceabilityMatrix, changedFiles, commandsRun, blockingIssues, followUps, needsMaintainerDecision, question.",
      ],
    },
    outputSchema: {
      type: "object",
      required: ["passed", "traceabilityMatrix", "changedFiles", "commandsRun", "blockingIssues", "followUps", "needsMaintainerDecision"],
    },
  },
  io: io(taskCtx),
}));

function redGateCommand(commands) {
  if (commands.length === 0) {
    return [
      "set -euo pipefail",
      "echo 'No red gate commands were produced by the test authoring task.'",
      "exit 1",
    ].join("\n");
  }

  return [
    "set -euo pipefail",
    "git diff --check",
    "FAILED=0",
    ...commands.map((command, index) => [
      `echo '--- red gate ${index + 1}: ${escapeSingle(command)} ---'`,
      "set +e",
      command,
      "CODE=$?",
      "set -e",
      "if [ \"$CODE\" -eq 0 ]; then",
      `  echo 'Expected red gate command ${index + 1} to fail before implementation, but it passed.'`,
      "  FAILED=1",
      "else",
      `  echo 'Red gate command ${index + 1} failed as expected with exit code' \"$CODE\"`,
      "fi",
    ].join("\n")),
    "if [ \"$FAILED\" -ne 0 ]; then exit 1; fi",
  ].join("\n");
}

function verificationCommand(commands) {
  if (commands.length === 0) {
    return [
      "set -euo pipefail",
      "git diff --check",
      "npm run test --workspace=@a5c-ai/tasks-mux",
      "npm run typecheck --workspace=@a5c-ai/tasks-mux",
      "npm run build --workspace=@a5c-ai/tasks-mux",
      "npm run verify:metadata",
    ].join("\n");
  }

  return [
    "set -euo pipefail",
    "git diff --check",
    ...commands,
  ].join("\n");
}

function stdoutOf(result) {
  if (typeof result === "string") return result;
  if (result?.stdout) return result.stdout;
  if (result?.value?.stdout) return result.value.stdout;
  return JSON.stringify(result ?? null, null, 2);
}

function gatePassed(result) {
  if (result?.passed === true) return true;
  if (result?.exitCode === 0) return true;
  if (result?.value?.exitCode === 0) return true;
  return false;
}

function nowIso(ctx) {
  const value = typeof ctx.now === "function" ? ctx.now() : new Date();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function io(taskCtx) {
  return {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  };
}

function sh(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function escapeSingle(value) {
  return String(value).replaceAll("'", "'\\''");
}
