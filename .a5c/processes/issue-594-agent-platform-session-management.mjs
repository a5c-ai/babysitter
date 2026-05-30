/**
 * @process repo/issue-594-agent-platform-session-management
 * @description Implement agent-platform session context/history/compaction/cost/routing integration gaps.
 * @inputs { issueNumber?: number, baseBranch?: string, implementationBranch?: string, maxRefinementIterations?: number, requireArchitectureApproval?: boolean, validationCommands?: string[] }
 * @outputs { success, architecture, tests, implementation, verification, review, changedFiles }
 *
 * @process methodologies/spec-kit-brownfield
 * @process methodologies/atdd-tdd/atdd-tdd
 * @process methodologies/shared/root-cause-diagnosis
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/process-hardening/process-hardening-patterns
 * @process specializations/collaboration/github/pr-policies
 * @process specializations/collaboration/github/issue-linking
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

const defaultValidationCommands = [
  "git diff --check",
  "npm run build --workspace=@a5c-ai/agent-platform",
  "npm run test --workspace=@a5c-ai/agent-platform",
  "npm run verify:v6:seams",
  "npm run verify:metadata",
];

const readSpecAndRepoContextTask = defineTask("issue-594.read-spec-and-repo-context", (args, taskCtx) => ({
  kind: "shell",
  title: "Read issue #594 and live agent-platform context",
  labels: ["issue-594", "agent-platform", "context"],
  shell: {
    command: "bash",
    args: ["-lc", [
      "set -euo pipefail",
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      "printf '\\n--- docs/agent-layer-gaps.md agent-platform section ---\\n'",
      "sed -n '/## agent-platform (L6)/,/## tasks-mux/p' docs/agent-layer-gaps.md",
      "printf '\\n--- relevant source and test files ---\\n'",
      "rg --files packages/agent-platform/src docs | rg 'agent-platform/src/(harness/internal/createRun|session|compression|harness/(capabilityRouter|modelSelection|fallbackChains|selectionPolicies)|cost)|docs/agent-layer-gaps.md'",
      "printf '\\n--- integration usage search ---\\n'",
      "rg -n \"planProcess|updateSessionContext|getSessionContext|addDecision\\(|addRunSummary\\(|saveContextSnapshot\\(|updateSessionCost\\(|checkBudget\\(|markThresholdsTriggered\\(|shouldAutoCompact|compactSession\\(|resolveTaskHarness\\(|resolveModelForTask\\(|resolveFallbackHarness\\(|getPolicyByName\\(|evaluatePolicy\\(\" packages/agent-platform/src -g '*.ts'",
      "printf '\\n--- package scripts ---\\n'",
      "node -e \"const root=require('./package.json'); const ap=require('./packages/agent-platform/package.json'); console.log(JSON.stringify({root: root.scripts, agentPlatform: ap.scripts}, null, 2))\"",
      "printf '\\n--- current git status ---\\n'",
      "git status --short --branch",
    ].join("\n")],
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const architectureTraceTask = defineTask("issue-594.architecture-trace", (args, taskCtx) => ({
  kind: "agent",
  title: "Trace live orchestration paths and define integration design",
  labels: ["issue-594", "architecture", "brownfield"],
  agent: {
    name: "agent-platform-architect",
    prompt: {
      role: "senior agent-platform architect",
      task: "Trace the live createRun/orchestration paths and produce a scoped implementation design for issue #594.",
      instructions: [
        "SPEC AND REPO CONTEXT (verbatim):",
        "---",
        args.specAndRepoStdout,
        "---",
        "Use the brownfield runtime-call-path rule: identify user-facing entry points, the live call path, and the exact files on that path before planning changes.",
        "Do not propose broad rewrites or unrelated L4/L5/tool-mux work.",
        "Split the work into independently testable integration slices:",
        "1. Session context is read and injected into planProcess prompt construction.",
        "2. Session history captures decisions, run summaries, and context snapshots from live orchestration.",
        "3. Session cost state aggregates run/effect cost and enforces budget only when configured.",
        "4. Compaction is triggered from orchestration state size and writes overlay artifacts only.",
        "5. Capability routing, model selection, fallback chains, and selection policies participate in task dispatch while preserving resolveTaskHarness compatibility as the default baseline.",
        "Explicitly call out compatibility defaults and any sequencing constraints with related issues #580 and #578.",
        "Return JSON with keys: runtimeCallPaths, affectedFiles, implementationSlices, compatibilityPolicy, riskRegister, testMatrix, qualityGates.",
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const authorRegressionTestsTask = defineTask("issue-594.author-regression-tests", (args, taskCtx) => ({
  kind: "agent",
  title: "Author failing regression tests before implementation",
  labels: ["issue-594", "tests", "atdd-tdd"],
  agent: {
    name: "agent-platform-test-engineer",
    prompt: {
      role: "senior TypeScript test engineer",
      task: "Author regression tests for issue #594 before implementation.",
      instructions: [
        "SPEC (verbatim, do not paraphrase):",
        "---",
        args.specAndRepoStdout,
        "---",
        "ARCHITECTURE TRACE (verbatim):",
        "---",
        JSON.stringify(args.architecture ?? {}, null, 2),
        "---",
        "Do not implement production fixes in this task.",
        "Do not read files under implementation directories. Author tests strictly from the spec text above and the architecture trace above.",
        "Use existing agent-platform test style and keep tests focused on live orchestration behavior rather than helper-only unit tests.",
        "Add or update tests that fail unless the live paths wire the existing session context, history, compaction, cost, and routing helpers.",
        "Prefer tests under existing packages/agent-platform/src/**/__tests__ locations.",
        "Return JSON: { changedFiles: string[], testsAdded: string[], expectedFailures: string[], verificationCommand: string }.",
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const redGateTask = defineTask("issue-594.red-gate", (args, taskCtx) => ({
  kind: "shell",
  title: "Confirm new regression coverage is red before implementation",
  labels: ["issue-594", "tests", "red-gate"],
  shell: {
    command: "bash",
    args: ["-lc", [
      "set -euo pipefail",
      "command=${1:-npm run test --workspace=@a5c-ai/agent-platform}",
      "set +e",
      "bash -lc \"$command\"",
      "status=$?",
      "set -e",
      "if [ \"$status\" -eq 0 ]; then",
      "  echo 'Expected the newly authored issue #594 regression tests to fail before implementation, but they passed.' >&2",
      "  exit 1",
      "fi",
      "echo \"Regression tests failed before implementation as expected with exit code $status.\"",
    ].join("\n"), "bash", args.testCommand],
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementIntegrationSlicesTask = defineTask("issue-594.implement-integration-slices", (args, taskCtx) => ({
  kind: "agent",
  title: "Implement issue #594 integration slices",
  labels: ["issue-594", "implementation", "agent-platform"],
  agent: {
    name: "agent-platform-implementer",
    prompt: {
      role: "senior TypeScript engineer on the Babysitter agent-platform package",
      task: "Implement issue #594 with focused changes on the traced live paths.",
      instructions: [
        "SPEC (verbatim):",
        "---",
        args.specAndRepoStdout,
        "---",
        "ARCHITECTURE TRACE (verbatim):",
        "---",
        JSON.stringify(args.architecture ?? {}, null, 2),
        "---",
        "TEST AUTHORING RESULT (verbatim):",
        "---",
        JSON.stringify(args.tests ?? {}, null, 2),
        "---",
        "RED GATE OUTPUT (verbatim):",
        "---",
        args.redGateStdout,
        "---",
        "Edit the repository directly.",
        "Keep changes scoped to packages/agent-platform live createRun planning/orchestration/dispatch paths and their tests unless the architecture trace identifies another live dependency.",
        "Implement in this order: session context injection, history capture, cost aggregation and configured budget enforcement, compaction trigger, routing/model/fallback policy wiring.",
        "Preserve current behavior when no session context, no budget, no compaction config, or no explicit routing policy is configured.",
        "Do not change unrelated L4/L5/tool-mux behavior.",
        "Do not revert unrelated dirty workspace changes.",
        "Return JSON: { changedFiles: string[], implementationNotes: string[], compatibilityNotes: string[], verificationCommands: string[] }.",
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verificationTask = defineTask("issue-594.verify", (args, taskCtx) => ({
  kind: "shell",
  title: "Run issue #594 quality gates",
  labels: ["issue-594", "verification", "quality-gate"],
  shell: {
    command: "bash",
    args: ["-lc", [
      "set -euo pipefail",
      "for command in \"$@\"; do",
      "  printf '\\n--- running: %s ---\\n' \"$command\"",
      "  bash -lc \"$command\"",
      "done",
    ].join("\n"), "bash", ...args.validationCommands],
    expectedExitCode: 0,
    timeout: 1200000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask("issue-594.read-artifacts", (args, taskCtx) => ({
  kind: "shell",
  title: "Read final issue #594 artifacts",
  labels: ["issue-594", "artifacts"],
  shell: {
    command: "bash",
    args: ["-lc", [
      "set -euo pipefail",
      "printf '%s\\n' '--- status ---'",
      "git status --short",
      "printf '%s\\n' '--- changed files ---'",
      "git diff --name-only -- . ':!.codex/**' ':!.agents/**' ':!plugins/babysitter/**'",
      "printf '%s\\n' '--- diff ---'",
      "git diff -- . ':!.codex/**' ':!.agents/**' ':!plugins/babysitter/**'",
    ].join("\n")],
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask("issue-594.review", (args, taskCtx) => ({
  kind: "agent",
  title: "Review issue #594 implementation against spec",
  labels: ["issue-594", "review", "quality-gate"],
  agent: {
    name: "agent-platform-reviewer",
    prompt: {
      role: "code reviewer focused on orchestration correctness and regression risk",
      task: "Compare SPEC to ARTIFACTS directly. Report per-criterion pass/fail.",
      instructions: [
        "Ignore any narrative in your context about how ARTIFACTS were built.",
        "Check for missing tests, behavior regressions, compatibility breaks, and overbroad changes.",
        "Return JSON: { approved: boolean, issues: string[], perCriterion: object, residualRisks: string[], summary: string }.",
        "",
        "SPEC (verbatim):",
        "---",
        args.specAndRepoStdout,
        "---",
        "",
        "ARCHITECTURE TRACE (verbatim):",
        "---",
        JSON.stringify(args.architecture ?? {}, null, 2),
        "---",
        "",
        "ARTIFACTS (verbatim):",
        "---",
        args.artifactsStdout,
        "---",
        "",
        "VERIFICATION OUTPUT (verbatim):",
        "---",
        args.verificationStdout,
        "---",
        "",
        "Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.",
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 594;
  const maxRefinementIterations = inputs?.maxRefinementIterations ?? 2;
  const validationCommands = Array.isArray(inputs?.validationCommands) && inputs.validationCommands.length > 0
    ? inputs.validationCommands
    : defaultValidationCommands;

  ctx.log("Phase 1: read issue, docs, live source paths, and package commands");
  const context = await ctx.task(readSpecAndRepoContextTask, { issueNumber });
  const specAndRepoStdout = context?.stdout ?? "";

  ctx.log("Phase 2: trace architecture and decide compatibility policy");
  const architecture = await ctx.task(architectureTraceTask, { specAndRepoStdout });

  if (inputs?.requireArchitectureApproval !== false) {
    await ctx.breakpoint({
      title: "Issue #594 Architecture Approval",
      question: "Review the traced runtime paths and compatibility policy before authoring regression tests and implementation changes.",
      context: {
        issueNumber,
        architecture,
      },
    });
  }

  ctx.log("Phase 3: author regression tests before implementation");
  const tests = await ctx.task(authorRegressionTestsTask, {
    specAndRepoStdout,
    architecture,
  });
  const testCommand = tests?.verificationCommand || "npm run test --workspace=@a5c-ai/agent-platform";
  const redGate = await ctx.task(redGateTask, {
    testCommand,
  });

  let implementation = null;
  let verification = null;
  let artifacts = null;
  let review = null;

  for (let iteration = 0; iteration <= maxRefinementIterations; iteration += 1) {
    ctx.log(`Phase 4: implementation/refinement iteration ${iteration + 1}`);
    implementation = await ctx.task(implementIntegrationSlicesTask, {
      specAndRepoStdout,
      architecture,
      tests,
      redGateStdout: redGate?.stdout ?? "",
      previousReview: review,
    });

    ctx.log("Phase 5: deterministic verification gates");
    verification = await ctx.task(verificationTask, { validationCommands });

    ctx.log("Phase 6: read artifacts and review against spec");
    artifacts = await ctx.task(readArtifactsTask, {});
    review = await ctx.task(reviewTask, {
      specAndRepoStdout,
      architecture,
      artifactsStdout: artifacts?.stdout ?? "",
      verificationStdout: verification?.stdout ?? "",
    });

    if (review?.approved !== false) {
      break;
    }

    if (iteration === maxRefinementIterations) {
      return {
        success: false,
        issueNumber,
        architecture,
        tests,
        implementation,
        verification,
        review,
        changedFiles: implementation?.changedFiles ?? [],
      };
    }
  }

  return {
    success: true,
    issueNumber,
    architecture,
    tests,
    implementation,
    verification,
    review,
    changedFiles: implementation?.changedFiles ?? [],
  };
}
