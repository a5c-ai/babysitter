/**
 * @process repo/issue-605-process-authoring-responder-context
 * @description Implement issue #605: inject discovered responder context into process creation prompts and validation.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, relatedIssues: number[], targetFiles: string[], designDocs: string[], verificationCommands: string[], maxImplementationAttempts?: number }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], issueContext: object, architecture: object, promptContract: object, tests: object, verification: object, review: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-mux-babysitter-integrations/process-authoring.md
 * - docs/agent-mux-babysitter-integrations/tasks-mux-routing.md
 * - docs/agent-mux-babysitter-integrations/external-agent-tasks.md
 * - docs/agent-mux-babysitter-integrations/plugin-mode.md
 * - docs/agent-mux-babysitter-integrations/testing.md
 * - packages/agent-platform/src/harness/internal/createRun/planProcess/phase.ts
 * - packages/agent-platform/src/harness/internal/createRun/planProcess/prompts.ts
 * - packages/agent-platform/src/harness/internal/createRun/prompts.ts
 * - packages/agent-platform/src/harness/internal/createRun/planProcess/validation.ts
 * - packages/agent-platform/src/harness/internal/createRun/planProcess/validationSource.ts
 * - packages/sdk/src/harness/externalAgentDiscovery.ts
 * - packages/sdk/src/tasks/types.ts
 * - packages/sdk/src/tasks/kinds/index.ts
 * - /home/runner/.a5c/process-library/babysitter-repo/library/cradle/feature-implementation-contribute.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/methodologies/spec-driven-development.js
 * - /home/runner/.a5c/process-library/babysitter-repo/library/tdd-quality-convergence.js
 *
 * Repo policy note: this process intentionally avoids kind: "shell" subtasks
 * because direct Babysitter processes in this repo should prefer agent/skill
 * tasks unless the user explicitly asks for shell-oriented workflows.
 *
 * @process cradle/feature-implementation-contribute
 * @process methodologies/spec-driven-development
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @agent architect methodologies/maestro/agents/architect/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent coder methodologies/maestro/agents/coder/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 * @agent system-prompt-engineer specializations/ai-agents-conversational/agents/system-prompt-engineer/AGENT.md
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

const MAX_ATTEMPTS_DEFAULT = 3;

function json(value) {
  return JSON.stringify(value ?? {}, null, 2);
}

function valueOf(result, fallback = {}) {
  return result?.value ?? result ?? fallback;
}

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 605;
  const maxImplementationAttempts = inputs?.maxImplementationAttempts ?? MAX_ATTEMPTS_DEFAULT;

  ctx.log("Phase 0: run reuse audit and collect current issue context");
  const reuseAudit = await ctx.task(reuseAuditTask, { inputs, issueNumber }, {
    key: "issue-605.reuse-audit",
  });

  const issueContext = await ctx.task(issueContextTask, {
    inputs,
    issueNumber,
    reuseAudit: valueOf(reuseAudit),
  }, {
    key: "issue-605.issue-context",
  });

  ctx.log("Phase 1: trace the current prompt and validation architecture");
  const architecture = await ctx.task(traceArchitectureTask, {
    inputs,
    issueContext: valueOf(issueContext),
    reuseAudit: valueOf(reuseAudit),
  }, {
    key: "issue-605.trace-architecture",
  });

  ctx.log("Phase 2: define prompt and validation contracts");
  const promptContract = await ctx.task(designPromptContractTask, {
    inputs,
    issueContext: valueOf(issueContext),
    architecture: valueOf(architecture),
  }, {
    key: "issue-605.prompt-contract",
  });

  if (valueOf(promptContract)?.requiresMaintainerDecision === true) {
    const decision = await ctx.breakpoint({
      title: "Issue #605 Responder Prompt Contract Decision",
      question: valueOf(promptContract).question ?? "The process-authoring responder contract is ambiguous. Choose whether to proceed with the recommended responderType-based contract.",
      options: [
        "Proceed with responderType-based contract",
        "Pause for maintainer clarification",
      ],
      expert: "owner",
      tags: ["issue-605", "prompt-contract", "approval"],
      context: {
        issueNumber,
        promptContract: valueOf(promptContract),
      },
    });
    if (decision?.approved === false || decision?.choice === "Pause for maintainer clarification") {
      return {
        success: false,
        phases: ["reuse-audit", "issue-context", "architecture", "prompt-contract"],
        changedFiles: [],
        issueContext: valueOf(issueContext),
        architecture: valueOf(architecture),
        promptContract: valueOf(promptContract),
        stoppedAt: "maintainer-decision",
      };
    }
  }

  ctx.log("Phase 3: write failing regression coverage before implementation");
  const tests = await ctx.task(authorRegressionTestsTask, {
    inputs,
    issueContext: valueOf(issueContext),
    architecture: valueOf(architecture),
    promptContract: valueOf(promptContract),
  }, {
    key: "issue-605.regression-tests",
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= maxImplementationAttempts; attempt += 1) {
    ctx.log(`Phase 4.${attempt}: implement and verify responder prompt context`);
    implementation = await ctx.task(implementationTask, {
      inputs,
      issueContext: valueOf(issueContext),
      architecture: valueOf(architecture),
      promptContract: valueOf(promptContract),
      tests: valueOf(tests),
      attempt,
      previousVerification: valueOf(verification),
      previousReview: valueOf(review),
    }, {
      key: `issue-605.implementation.${attempt}`,
    });

    verification = await ctx.task(verificationTask, {
      inputs,
      issueContext: valueOf(issueContext),
      architecture: valueOf(architecture),
      promptContract: valueOf(promptContract),
      tests: valueOf(tests),
      implementation: valueOf(implementation),
      attempt,
    }, {
      key: `issue-605.verification.${attempt}`,
    });

    review = await ctx.task(reviewTask, {
      inputs,
      issueContext: valueOf(issueContext),
      architecture: valueOf(architecture),
      promptContract: valueOf(promptContract),
      tests: valueOf(tests),
      implementation: valueOf(implementation),
      verification: valueOf(verification),
      attempt,
    }, {
      key: `issue-605.review.${attempt}`,
    });

    attempts.push({
      attempt,
      implementation: valueOf(implementation),
      verification: valueOf(verification),
      review: valueOf(review),
    });

    if (valueOf(verification)?.passed === true && valueOf(review)?.approved === true) {
      break;
    }
  }

  ctx.log("Phase 5: final acceptance and issue handoff");
  const finalGate = await ctx.task(finalAcceptanceTask, {
    inputs,
    issueContext: valueOf(issueContext),
    architecture: valueOf(architecture),
    promptContract: valueOf(promptContract),
    tests: valueOf(tests),
    implementation: valueOf(implementation),
    verification: valueOf(verification),
    review: valueOf(review),
    attempts,
  }, {
    key: "issue-605.final-acceptance",
  });

  return {
    success: valueOf(finalGate)?.passed === true,
    phases: [
      "reuse-audit",
      "issue-context",
      "architecture-trace",
      "prompt-contract",
      "regression-tests",
      "implementation-loop",
      "verification",
      "review",
      "final-acceptance",
    ],
    changedFiles: valueOf(finalGate)?.changedFiles ?? valueOf(implementation)?.changedFiles ?? [],
    reuseAudit: valueOf(reuseAudit),
    issueContext: valueOf(issueContext),
    architecture: valueOf(architecture),
    promptContract: valueOf(promptContract),
    tests: valueOf(tests),
    implementation: valueOf(implementation),
    verification: valueOf(verification),
    review: valueOf(review),
    attempts,
    finalGate: valueOf(finalGate),
  };
}

export const reuseAuditTask = defineTask("issue-605.reuse-audit", (args, taskCtx) => ({
  kind: "agent",
  title: "Phase 0: reuse audit for process-authoring responder context",
  labels: ["issue-605", "reuse-audit", "agent-platform", "sdk"],
  agent: {
    name: "architect",
    prompt: {
      role: "senior Babysitter platform architect",
      task: "Run the required Phase 0 reuse audit before any implementation work for issue #605.",
      instructions: [
        "Extract keyword nouns and verbs from the issue and this task: process creation prompts, external agents, responder types, discoverExternalAgents, host agent identity, raw text session template, conformance repair, validationSource, validation warning, agent-mux unavailable.",
        "Read .a5c/reuse-audit.json if it exists and honor its scan globs or rules.",
        "Search current source, docs, local .a5c/processes examples, repo library materials, and the active process-library clone under /home/runner/.a5c/process-library/babysitter-repo for reusable patterns.",
        "Specifically inspect prior process artifacts for #602, #619, #635, #607, and this issue number if present.",
        "Render a section named exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).",
        "Do not edit source files in this task.",
        "Return JSON: { findingsTitle, keywords, matchingInfrastructure, matchingTests, processLibraryMatches, noMatchNotes, implications, noCodeChanges }.",
      ],
      context: {
        issueNumber: args.issueNumber,
        targetFiles: args.inputs?.targetFiles ?? [],
        designDocs: args.inputs?.designDocs ?? [],
      },
    },
    outputSchema: {
      type: "object",
      required: ["findingsTitle", "keywords", "matchingInfrastructure", "implications", "noCodeChanges"],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

export const issueContextTask = defineTask("issue-605.issue-context", (args, taskCtx) => ({
  kind: "agent",
  title: "Read issue #605 and dependency context",
  labels: ["issue-605", "research", "github", "scope"],
  agent: {
    name: "architect",
    prompt: {
      role: "senior integration planner",
      task: "Read the issue, comments, labels, related issues, and design docs to produce the authoritative implementation scope.",
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments,state`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments,state`,
        "Read all comments carefully. The architecture update comment that says process prompts show available responder types supersedes the older external:true shape.",
        "Read related issues from inputs, especially #602, #635, and #619, enough to determine which dependencies have landed and which contracts are current.",
        "Read the design docs listed in inputs, including process-authoring.md, tasks-mux-routing.md, external-agent-tasks.md, plugin-mode.md, and testing.md.",
        "Use the reuse audit findings below as context.",
        "Do not modify source files in this task.",
        "Return JSON: { title, state, labels, issueSummary, commentTimeline, dependencyStatus, acceptanceCriteria, supersededRequirements, nonGoals, riskLevel, targetFiles, designDocMap }.",
        "Reuse audit JSON:",
        json(args.reuseAudit),
      ],
    },
    outputSchema: {
      type: "object",
      required: ["title", "labels", "acceptanceCriteria", "nonGoals", "targetFiles"],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

export const traceArchitectureTask = defineTask("issue-605.trace-architecture", (args, taskCtx) => ({
  kind: "agent",
  title: "Trace process prompt and validation architecture",
  labels: ["issue-605", "architecture", "agent-platform"],
  agent: {
    name: "architect",
    prompt: {
      role: "senior TypeScript runtime architect",
      task: "Trace the current source architecture for process creation prompts, host context, discovery, conformance repair, and validation.",
      instructions: [
        "Read every target file from inputs before deciding implementation shape.",
        "Trace runPlanProcessPhase in phase.ts from workspace assessment through raw text session prompt, full agent-platform system prompt, user prompt, conformance repair, validateProcessExport, and createRunAndMaybeBindFromProcessDefinition.",
        "Trace shared prompt context in createRun/prompts.ts, especially HarnessPromptContext, formatSharedContext, formatHostAgentContext, buildProcessDefinitionSystemPrompt, buildProcessDefinitionUserPrompt, and raw planProcess/prompts.ts.",
        "Trace discoverExternalAgents() exports and current SDK responder task helper/type contracts.",
        "Trace validationSource.ts and validation.ts to identify exact source-level checks that must accept agent.responderType and warn rather than fail when discovery is unavailable.",
        "Locate existing tests for createRun prompts, planProcess validation, SDK discovery, and SDK task helpers.",
        "Do not edit source files in this task.",
        "Return JSON: { runtimeCallPaths, promptContextTypes, rawPromptPath, fullPromptPath, conformanceRepairPath, validationPath, discoveryApiStatus, responderApiStatus, existingTests, targetFiles, implementationSequence, risks }.",
        "Issue context JSON:",
        json(args.issueContext),
      ],
    },
    outputSchema: {
      type: "object",
      required: ["runtimeCallPaths", "rawPromptPath", "fullPromptPath", "validationPath", "implementationSequence"],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

export const designPromptContractTask = defineTask("issue-605.prompt-contract", (args, taskCtx) => ({
  kind: "agent",
  title: "Design responder-context prompt and validation contract",
  labels: ["issue-605", "prompt-contract", "validation"],
  agent: {
    name: "system-prompt-engineer",
    prompt: {
      role: "senior system prompt and platform contract engineer",
      task: "Define the exact implementation contract for issue #605 before tests or code changes.",
      instructions: [
        "Use issueContext and architecture as source of truth.",
        "Make `responderType: \"agent\"` plus `adapter` the primary external agent task syntax.",
        "Treat `agent.external: true` and fallbackToInternal as legacy/transitional terminology only if the current source still requires compatibility references.",
        "Design a reusable responder-context renderer or prompt-context field that covers available agent responders from discoverExternalAgents(), host agent identity from #619, and responder type syntax for internal, human, agent, tracker, and auto where appropriate.",
        "Specify when the section appears: installed agent responders present; empty/unavailable discovery should produce no misleading available-agent list and may include concise unavailable guidance only if useful.",
        "Keep raw text session and full agent-platform paths semantically aligned.",
        "Specify conformance repair language for external agent tasks and adapter requirement.",
        "Specify validation behavior: accept valid agent responder tasks; require syntactically non-empty adapter for responderType agent if validation inspects that level; warn, not error, when agent-mux/discovered adapters are unavailable at validation time.",
        "Flag requiresMaintainerDecision only if current source or merged dependency contracts conflict with issue #605 acceptance criteria.",
        "Return JSON: { requiresMaintainerDecision, question, sectionContract, rawPromptContract, fullPromptContract, conformanceContract, validationContract, warningContract, compatibilityNotes, testMatrix, nonGoals }.",
        "Issue context JSON:",
        json(args.issueContext),
        "Architecture JSON:",
        json(args.architecture),
      ],
    },
    outputSchema: {
      type: "object",
      required: ["requiresMaintainerDecision", "sectionContract", "validationContract", "testMatrix", "nonGoals"],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

export const authorRegressionTestsTask = defineTask("issue-605.regression-tests", (args, taskCtx) => ({
  kind: "agent",
  title: "Author failing regression tests for issue #605",
  labels: ["issue-605", "tdd", "tests"],
  agent: {
    name: "test-engineer",
    prompt: {
      role: "senior TypeScript test engineer",
      task: "Write targeted failing tests for issue #605 before implementation.",
      instructions: [
        "Read current test style in packages/agent-platform/src/harness/internal/createRun/__tests__/prompts.test.ts, any planProcess validation tests, and SDK discovery/task helper tests.",
        "Author the smallest useful tests that fail before implementation and prove the prompt and validation contract.",
        "Cover full agent-platform process prompt context: discovered external agents render as available agent responders, show authenticated/installed status and capabilities when present, include host identity context without conflating host with external responder, and show responderType syntax.",
        "Cover raw text/external CLI prompt path in planProcess/prompts.ts or phase prompt construction so the omni/raw path receives the same responder guidance.",
        "Cover conformance repair prompt content for kind: \"agent\" with agent.responderType: \"agent\" and adapter.",
        "Cover validationSource/validation behavior for valid agent responder tasks, missing adapter when responderType is agent, and warning-not-error behavior when discovery cannot confirm agent-mux availability.",
        "Prefer isolated unit tests with mocked discoverExternalAgents() over live agent-mux dependencies.",
        "Do not implement production code in this task except minimal test-only fixtures.",
        "Run targeted tests and capture expected red failures.",
        "Return JSON: { testFiles, testsWritten, redCommands, expectedFailures, fixtures, notes }.",
        "Prompt contract JSON:",
        json(args.promptContract),
      ],
    },
    outputSchema: {
      type: "object",
      required: ["testFiles", "testsWritten", "redCommands", "expectedFailures"],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

export const implementationTask = defineTask("issue-605.implementation", (args, taskCtx) => ({
  kind: "agent",
  title: "Implement issue #605 responder prompt context",
  labels: ["issue-605", "implementation", "agent-platform", "sdk"],
  agent: {
    name: "coder",
    prompt: {
      role: "senior TypeScript platform engineer",
      task: "Implement issue #605 and make the pre-authored regression tests pass.",
      instructions: [
        "Read the issue context, architecture, prompt contract, regression tests, and current source before editing.",
        "Create or switch to the implementation branch from inputs without overwriting unrelated local changes.",
        "Keep source changes scoped to issue #605. Do not reimplement #602 discoverExternalAgents(), #635 SDK responder helpers, #619 host identity, tasks-mux runtime dispatch, or documentation-only issue #607 unless a narrow prompt/test update requires it.",
        "Expected implementation areas: packages/agent-platform/src/harness/internal/createRun/planProcess/phase.ts, planProcess/prompts.ts, createRun/prompts.ts, planProcess/validation.ts, planProcess/validationSource.ts, and focused tests.",
        "Import and call discoverExternalAgents() where process creation prompt context is assembled, with bounded timeout and graceful unavailable behavior.",
        "Add a typed prompt-context field or shared renderer for available responder context. Keep raw text and full process-authoring paths aligned.",
        "Include available installed/authenticated external agent responders, adapter names, display names, capabilities, and default provider/model when useful.",
        "Show current task syntax using kind: \"agent\" and agent: { responderType: \"agent\", adapter: \"...\" }. Include fallbackType: \"internal\" only as optional fallback guidance.",
        "Preserve host-agent context semantics from #619: host agent, selected orchestration binding harness, internal worker, external harness, and external agent responder are distinct concepts.",
        "Update conformance repair prompt requirements so generated processes can be repaired into the responderType external-agent shape.",
        "Update validation so valid external agent responder tasks are accepted, missing adapter is surfaced clearly, and unavailable agent-mux discovery emits a warning instead of a validation failure.",
        "Run targeted tests during implementation until they pass.",
        "Return JSON: { changedFiles, summary, promptChanges, validationChanges, testsRun, risks, branch }.",
        "Attempt: " + args.attempt,
        "Previous verification JSON:",
        json(args.previousVerification),
        "Previous review JSON:",
        json(args.previousReview),
        "Regression tests JSON:",
        json(args.tests),
      ],
    },
    outputSchema: {
      type: "object",
      required: ["changedFiles", "summary", "testsRun"],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

export const verificationTask = defineTask("issue-605.verification", (args, taskCtx) => ({
  kind: "agent",
  title: "Run issue #605 quality gates",
  labels: ["issue-605", "verification", "quality-gates"],
  agent: {
    name: "test-engineer",
    prompt: {
      role: "senior verification engineer",
      task: "Run deterministic quality gates for issue #605 and report exact results.",
      instructions: [
        "Inspect the diff before running checks. Confirm changed files are scoped to issue #605.",
        "Run the targeted tests written for prompt rendering, conformance repair, validationSource, and validation warning behavior.",
        "Run the verification commands from inputs. If a command is too broad for the environment, run the closest targeted command and record the reason.",
        "Required default gates: targeted Vitest for createRun/planProcess prompt and validation tests, npm run build:runtime, npm run test:sdk, npm run verify:metadata, git diff --check.",
        "Add static prompt contract grep checks confirming the final prompt surface includes responderType, adapter, available agent responders, host agent context, and fallbackType guidance where specified.",
        "Fail the gate if tests were not actually run, if failures remain unexplained, or if prompt text regresses to the superseded external:true-only shape.",
        "Return JSON: { passed, commandsRun, commandResults, staticChecks, failures, changedFiles, notes }.",
        "Implementation JSON:",
        json(args.implementation),
      ],
    },
    outputSchema: {
      type: "object",
      required: ["passed", "commandsRun", "failures", "changedFiles"],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

export const reviewTask = defineTask("issue-605.review", (args, taskCtx) => ({
  kind: "agent",
  title: "Review issue #605 implementation",
  labels: ["issue-605", "review", "risk"],
  agent: {
    name: "code-reviewer",
    prompt: {
      role: "senior code reviewer",
      task: "Review the issue #605 implementation for behavioral bugs, prompt regressions, validation gaps, and missing tests.",
      instructions: [
        "Use a code-review stance: findings first, ordered by severity, with file and line references.",
        "Compare the diff against issue #605, comments, design docs, and the prompt contract.",
        "Specifically look for prompt-path divergence between raw text and full process-authoring paths.",
        "Check that discoverExternalAgents() remains optional and bounded, never a hard process-creation failure when unavailable.",
        "Check that validation is not too permissive: external agent responder tasks should require adapter when responderType is agent, but agent-mux absence should warn rather than fail.",
        "Check that host identity wording does not imply the host agent and external responder are the same execution target.",
        "Check that tests cover both positive and unavailable/empty discovery cases.",
        "Return JSON: { approved, findings, requiredFixes, residualRisks, testGaps }.",
        "Verification JSON:",
        json(args.verification),
      ],
    },
    outputSchema: {
      type: "object",
      required: ["approved", "findings", "requiredFixes", "residualRisks"],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));

export const finalAcceptanceTask = defineTask("issue-605.final-acceptance", (args, taskCtx) => ({
  kind: "agent",
  title: "Final acceptance and handoff for issue #605",
  labels: ["issue-605", "final-acceptance", "handoff"],
  agent: {
    name: "architect",
    prompt: {
      role: "senior maintainer",
      task: "Decide whether issue #605 implementation is complete and prepare the delivery handoff.",
      instructions: [
        "Review issue context, implementation summary, verification, review findings, and final diff.",
        "Pass only if all acceptance criteria are satisfied, verification passed, review approved, and no required fixes remain.",
        "Confirm changed files are scoped to prompt context, conformance repair, validation, and tests for #605.",
        "Confirm the plan did not modify unrelated source or metadata.",
        "Prepare a concise PR/issue handoff summary with phases completed, tests run, and residual risk.",
        "Return JSON: { passed, changedFiles, acceptanceCoverage, testsRun, issueCommentSummary, prSummary, residualRisks, blockers }.",
        "Attempts JSON:",
        json(args.attempts),
      ],
    },
    outputSchema: {
      type: "object",
      required: ["passed", "changedFiles", "acceptanceCoverage", "testsRun", "blockers"],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
}));
