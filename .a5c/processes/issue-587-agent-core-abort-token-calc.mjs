/**
 * @process repo/issue-587-agent-core-abort-token-calc
 * @description Implement issue #587: harden agent-core abort(), model-aware token estimation, and the advertised calc tool.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, issueContext: object, relatedIssues: object, targetFiles: string[], verificationCommands: string[], planningFindings: object }
 * @outputs { success: boolean, phases: string[], runtimeCallPaths: string[], changedFiles: string[], verification: object, review: object, finalGate: object }
 *
 * References used while authoring:
 * - methodologies/spec-kit-brownfield.js
 * - processes/shared/tdd-triplet.js
 * - contrib/rogelsm/generic-bugfix.js
 * - specializations/ai-agents-conversational/custom-tool-development.js
 * - specializations/ai-agents-conversational/tool-safety-validation.js
 * - docs/agent-reference/process-authoring.md
 * - .a5c/processes/issue-575-agent-core-streaming-history.mjs
 * - .a5c/processes/issue-582-agent-core-structured-output-vision.mjs
 * - .a5c/processes/issue-617-task-cancel-mcp-tool.mjs
 *
 * Repo policy note: this process intentionally uses agent tasks rather than
 * kind: "shell" subtasks because this repository's process-authoring policy
 * says not to generate shell subtasks for Babysitter workflows unless the user
 * explicitly asks for a shell-oriented workflow. Verification tasks still tell
 * the agent to run deterministic commands and report the command evidence.
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - No repo-local .a5c/process-library directory exists in this checkout; the
 *   active library was resolved to /home/runner/.a5c/process-library/babysitter-repo/library.
 * - Matching library patterns: spec-kit-brownfield for live-path tracing,
 *   tdd-triplet for tests-first convergence, generic-bugfix for root-cause
 *   diagnosis, and AI-agent tool-safety/custom-tool specializations for calc.
 * - Current staging already contains abort-controller plumbing in session.ts
 *   plus an abort regression test. The run must verify whether that satisfies
 *   #587 before changing abort code.
 * - Token estimation is still hardcoded in context/token-estimator.ts and old
 *   tests assert chars/4 behavior.
 * - AGENT_CORE_TOOL_NAMES and README advertise calc, but
 *   createAgentCoreToolDefinitions() composes no calc tool implementation.
 *
 * @process methodologies/spec-kit-brownfield
 * @process processes/shared/tdd-triplet
 * @process contrib/rogelsm/generic-bugfix
 * @process specializations/ai-agents-conversational/custom-tool-development
 * @process specializations/ai-agents-conversational/tool-safety-validation
 * @agent technical-planner methodologies/spec-kit/agents/technical-planner/AGENT.md
 * @agent platform-architect methodologies/maestro/agents/architect/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

function compactResult(result) {
  return result?.value ?? result ?? null;
}

export async function process(inputs, ctx) {
  const reuseAudit = await ctx.task(reuseAuditTask, inputs, {
    key: 'issue-587.reuse-audit',
  });

  const architecturePlan = await ctx.task(architecturePlanTask, {
    inputs,
    reuseAudit: compactResult(reuseAudit),
  }, {
    key: 'issue-587.architecture-plan',
  });

  if (architecturePlan?.needsMaintainerDecision) {
    await ctx.breakpoint({
      title: 'Issue #587 API Decision Needed',
      question: architecturePlan.question,
      options: [
        'Proceed with recommended compatible contract',
        'Pause for maintainer guidance',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-587', 'agent-core', 'public-api'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs.issueNumber,
        architecturePlan,
      },
    });
  }

  const regressionTests = await ctx.task(authorRegressionTestsTask, {
    inputs,
    reuseAudit: compactResult(reuseAudit),
    architecturePlan: compactResult(architecturePlan),
  }, {
    key: 'issue-587.author-regression-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt += 1) {
    implementation = await ctx.task(implementAgentCoreHardeningTask, {
      inputs,
      reuseAudit: compactResult(reuseAudit),
      architecturePlan: compactResult(architecturePlan),
      regressionTests: compactResult(regressionTests),
      previousVerification: compactResult(verification),
      previousReview: compactResult(review),
      attempt,
    }, {
      key: `issue-587.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      implementation: compactResult(implementation),
      attempt,
    }, {
      key: `issue-587.verification.${attempt}`,
    });

    review = await ctx.task(reviewImplementationTask, {
      inputs,
      reuseAudit: compactResult(reuseAudit),
      architecturePlan: compactResult(architecturePlan),
      regressionTests: compactResult(regressionTests),
      implementation: compactResult(implementation),
      verification: compactResult(verification),
      attempt,
    }, {
      key: `issue-587.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const docsAndHandoff = await ctx.task(updateDocsAndHandoffTask, {
    inputs,
    reuseAudit: compactResult(reuseAudit),
    architecturePlan: compactResult(architecturePlan),
    regressionTests: compactResult(regressionTests),
    implementation: compactResult(implementation),
    verification: compactResult(verification),
    review: compactResult(review),
  }, {
    key: 'issue-587.docs-and-handoff',
  });

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    reuseAudit: compactResult(reuseAudit),
    architecturePlan: compactResult(architecturePlan),
    regressionTests: compactResult(regressionTests),
    implementation: compactResult(implementation),
    verification: compactResult(verification),
    review: compactResult(review),
    docsAndHandoff: compactResult(docsAndHandoff),
    attempts,
  }, {
    key: 'issue-587.final-acceptance',
  });

  if (finalGate?.needsHumanDecision) {
    await ctx.breakpoint({
      title: 'Issue #587 Final Decision Needed',
      question: finalGate.question,
      options: [
        'Accept current implementation with documented residual risk',
        'Pause for maintainer guidance',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-587', 'final-acceptance'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs.issueNumber,
        finalGate,
        attempts: attempts.length,
      },
    });
  }

  return {
    success: finalGate?.passed === true,
    phases: [
      'reuse-audit',
      'architecture-plan',
      'contract-tests-first',
      'implementation-loop',
      'verification-gate',
      'review-gate',
      'docs-and-handoff',
      'final-acceptance',
    ],
    runtimeCallPaths: reuseAudit?.runtimeCallPaths ?? [],
    changedFiles: finalGate?.changedFiles ?? docsAndHandoff?.changedFiles ?? implementation?.changedFiles ?? [],
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const reuseAuditTask = defineTask('issue-587.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 - Reuse-audit findings (REVIEW BEFORE PROCEEDING)',
  labels: ['agent-core', 'reuse-audit', 'runtime-trace', 'brownfield'],
  agent: {
    name: 'technical-planner',
    prompt: {
      role: 'senior TypeScript runtime architect',
      task: 'Run the required reuse audit and trace the live agent-core paths before any implementation work.',
      instructions: [
        'Use ISSUE_CONTEXT as the authoritative spec. Treat comments and labels as part of the issue context.',
        'ISSUE_CONTEXT (verbatim JSON):',
        '---',
        JSON.stringify(args.issueContext, null, 2),
        '---',
        'PLANNING_FINDINGS (verbatim JSON):',
        '---',
        JSON.stringify(args.planningFindings ?? {}, null, 2),
        '---',
        'Inspect the repository before planning changes. Start with targetFiles, then follow imports and consumers as needed.',
        'Extract keyword nouns and verbs from the issue: abort, AbortController, AbortSignal, prompt cancellation, token estimation, chars per token, model-aware, Claude, GPT-4, context overflow, calc tool, safe calculator, AGENT_CORE_TOOL_NAMES, createAgentCoreToolDefinitions.',
        'Render a section literally titled "Reuse-audit findings (REVIEW BEFORE PROCEEDING)".',
        'Trace runtime call paths for: createAgentCoreSession().prompt() through callCompletionApi(), abort(), dispose(), history trimming; estimateTokens()/estimateEntryTokens() through ContextManagerImpl and summary strategies; createAgentCoreToolDefinitions() through code tools and AGENT_CORE_TOOL_NAMES parity.',
        'Explicitly detect whether abort is already implemented on the current branch. If it is already implemented, treat the abort work as validation plus any missing lifecycle/edge-case tests, not a rewrite.',
        'Identify live execution files, adjacent docs/tests, old behavior tests to update, and areas that must remain out of scope: initialize() warmup, LLM client DI, browser pool, DuckDuckGo search backend, real summarization, and tool AbortSignal from #588.',
        'Return JSON: { reuseAuditFindings, runtimeCallPaths, liveExecutionFiles, adjacentFiles, existingInfrastructure, missingInfrastructure, oldBehaviorTests, dependencyBoundaries, targetFiles, risks, outOfScope }.',
      ],
      context: {
        inputs: args,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const architecturePlanTask = defineTask('issue-587.architecture-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design abort, token estimation, and calc contracts',
  labels: ['agent-core', 'architecture', 'public-api', 'tool-safety'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript API and tool-runtime architect',
      task: 'Design the smallest compatible implementation plan for issue #587 before tests and code changes.',
      instructions: [
        'Compare ISSUE_CONTEXT and REUSE_AUDIT directly. Preserve current public APIs unless a narrow optional extension is required.',
        'ISSUE_CONTEXT (verbatim JSON):',
        '---',
        JSON.stringify(args.inputs.issueContext, null, 2),
        '---',
        'REUSE_AUDIT (verbatim JSON):',
        '---',
        JSON.stringify(args.reuseAudit, null, 2),
        '---',
        'Abort plan: validate current active AbortController behavior; ensure abort() cancels the in-flight fetch/stream, abort after completion is harmless, dispose aborts and clears state, failed/aborted prompts do not append history, isStreaming resets, and concurrent prompt protection remains intact.',
        'Token plan: make estimation model/provider-aware while keeping estimateTokens(text) backwards compatible. Prefer an optional options object and conservative fallback. Ensure session history trimming can use the selected session model/provider, and context manager tests stop asserting implementation-only chars/4 as the only behavior.',
        'Calc plan: implement the advertised calc tool in the code tool surface without eval or Function. Use a constrained parser/evaluator with explicit allowed numeric literals, parentheses, unary +/- and arithmetic operators; reject identifiers, property access, assignment, function calls, NaN/Infinity results, malformed expressions, and overlong input.',
        'Tool parity plan: add a regression check that AGENT_CORE_TOOL_NAMES advertised names are present in createAgentCoreToolDefinitions(), with an explicit exception only for code_executor when programmaticToolCalling is disabled if needed.',
        'Docs plan: update packages/agent-core/README.md and docs/agent-layer-gaps.md only where behavior changed or the gap is closed/partially closed.',
        'Return JSON: { abortPlan, tokenEstimatorContract, calcToolContract, parityPlan, testPlan, docsPlan, needsMaintainerDecision, question, risks, changedFilesExpected }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionTestsTask = defineTask('issue-587.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing contract tests before implementation',
  labels: ['agent-core', 'tests', 'tdd', 'tool-safety'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Author focused tests that freeze issue #587 acceptance before implementation changes.',
      instructions: [
        'Use ISSUE_CONTEXT, REUSE_AUDIT, and ARCHITECTURE_PLAN as authoritative inputs. Add or update tests before editing implementation files.',
        'ISSUE_CONTEXT (verbatim JSON):',
        '---',
        JSON.stringify(args.inputs.issueContext, null, 2),
        '---',
        'REUSE_AUDIT (verbatim JSON):',
        '---',
        JSON.stringify(args.reuseAudit, null, 2),
        '---',
        'ARCHITECTURE_PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.architecturePlan, null, 2),
        '---',
        'Abort coverage: in-flight prompt cancellation reaches fetch signal, prompt resolves failed without history append, isStreaming resets, abort after completion is harmless, dispose aborts an active prompt and clears listeners/history/followups, and concurrent prompt rejection still works.',
        'Token coverage: default estimate remains conservative and compatible, explicit OpenAI/GPT-family and Anthropic/Claude estimates differ by configured chars-per-token, unknown model fallback is conservative, estimateEntryTokens respects explicit tokenCount, ContextManagerImpl uses the configured estimator path if architecture adds config, and session history trimming uses the session model/provider rather than a hardcoded global.',
        'Calc coverage: createAgentCoreToolDefinitions() includes calc, simple arithmetic works, precedence and parentheses work, unary operators work, decimal values work, invalid identifiers/function calls/property access/assignment are rejected, division by zero or non-finite results are rejected, and tool output uses the existing ToolResult/jsonResult style.',
        'Parity coverage: AGENT_CORE_TOOL_NAMES and createAgentCoreToolDefinitions() stay in sync for bundled enabled tools. If code_executor remains opt-in, assert and document that exception precisely.',
        'Prefer packages/agent-core/src/session.test.ts, packages/agent-core/src/context/__tests__/manager.test.ts or adjacent token-estimator tests, and a focused agentic tool test. Keep tests deterministic and network-free.',
        'Run the narrow tests and confirm new tests fail only for missing or incomplete issue #587 behavior before implementation.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, commandsToRun, coverageMatrix, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementAgentCoreHardeningTask = defineTask('issue-587.implement-agent-core-hardening', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement agent-core issue #587 attempt ${args.attempt}`,
  labels: ['agent-core', 'implementation', 'abort', 'token-estimator', 'calc-tool'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Implement issue #587 in agent-core, scoped to the live execution path and contract tests.',
      instructions: [
        'Keep changes focused on files identified by REUSE_AUDIT and ARCHITECTURE_PLAN. Preserve unrelated worktree changes.',
        'ISSUE_CONTEXT (verbatim JSON):',
        '---',
        JSON.stringify(args.inputs.issueContext, null, 2),
        '---',
        'REUSE_AUDIT (verbatim JSON):',
        '---',
        JSON.stringify(args.reuseAudit, null, 2),
        '---',
        'ARCHITECTURE_PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.architecturePlan, null, 2),
        '---',
        'REGRESSION_TESTS (verbatim JSON):',
        '---',
        JSON.stringify(args.regressionTests, null, 2),
        '---',
        'PREVIOUS_VERIFICATION (verbatim JSON):',
        '---',
        JSON.stringify(args.previousVerification, null, 2),
        '---',
        'PREVIOUS_REVIEW (verbatim JSON):',
        '---',
        JSON.stringify(args.previousReview, null, 2),
        '---',
        'Abort implementation: do not rewrite working controller plumbing if the current branch already satisfies the contract. Fill only missing lifecycle gaps and tests.',
        'Token implementation: add model/provider-aware estimation with a compatible default API. Update all live callers that should use model context, especially session history trimming and context manager paths chosen in the architecture plan.',
        'Calc implementation: add the missing bundled calc tool to the code tool surface using a constrained parser/evaluator. Do not use eval, Function, dynamic import, shell, Python, or external process execution for evaluation.',
        'Tool parity implementation: keep AGENT_CORE_TOOL_NAMES, README, and generated definitions aligned. Avoid adding broad tool-mux or deferred registry work.',
        'Return JSON: { changedFiles, summary, abortSemantics, tokenEstimatorSemantics, calcSemantics, paritySemantics, commandsToRun, unresolvedRisks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-587.verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run issue #587 verification gate attempt ${args.attempt}`,
  labels: ['agent-core', 'verification', 'quality-gate'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'senior TypeScript release validation engineer',
      task: 'Run the deterministic verification commands and interpret failures for issue #587.',
      instructions: [
        'Run the commands listed in VERIFICATION_COMMANDS from the repository root unless a command itself specifies a workspace.',
        'VERIFICATION_COMMANDS (verbatim JSON):',
        '---',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        '---',
        'IMPLEMENTATION (verbatim JSON):',
        '---',
        JSON.stringify(args.implementation, null, 2),
        '---',
        'The gate passes only when agent-core tests pass, agent-core builds, advertised tool parity is proven, calc safety tests pass, abort lifecycle tests pass, token estimator tests pass, and no focused contract test was skipped or weakened.',
        'If a command fails, capture the failing command, concise stderr/stdout evidence, likely root cause, and exact next fix recommendation.',
        'Return JSON: { passed, commands, failures, skippedChecks, evidence, nextFixes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewImplementationTask = defineTask('issue-587.review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review issue #587 implementation attempt ${args.attempt}`,
  labels: ['agent-core', 'code-review', 'quality-gate'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'senior API compatibility and tool-safety reviewer',
      task: 'Review the issue #587 implementation against the issue, design, tests, and verification evidence.',
      instructions: [
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'SPEC (verbatim JSON):',
        '---',
        JSON.stringify(args.inputs.issueContext, null, 2),
        '---',
        'REUSE_AUDIT (verbatim JSON):',
        '---',
        JSON.stringify(args.reuseAudit, null, 2),
        '---',
        'ARCHITECTURE_PLAN (verbatim JSON):',
        '---',
        JSON.stringify(args.architecturePlan, null, 2),
        '---',
        'REGRESSION_TESTS (verbatim JSON):',
        '---',
        JSON.stringify(args.regressionTests, null, 2),
        '---',
        'IMPLEMENTATION (verbatim JSON):',
        '---',
        JSON.stringify(args.implementation, null, 2),
        '---',
        'VERIFICATION (verbatim JSON):',
        '---',
        JSON.stringify(args.verification, null, 2),
        '---',
        'Review for: abort lifecycle correctness, no partial history on abort/errors, token estimator API compatibility, conservative unknown-model behavior, no unsafe calculator evaluation, no tool-surface drift, focused docs updates, and no scope bleed into initialize(), LLM client DI, browser pool, web search backend, summary strategy, or #588 tool AbortSignal.',
        'Return JSON: { approved, issues, requiredFixes, changedFiles, compatibilityRisks, safetyRisks, testGaps }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const updateDocsAndHandoffTask = defineTask('issue-587.docs-and-handoff', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update docs and prepare issue handoff',
  labels: ['agent-core', 'docs', 'handoff', 'github'],
  agent: {
    name: 'technical-planner',
    prompt: {
      role: 'senior developer documentation engineer',
      task: 'Update documentation and prepare the final GitHub handoff for issue #587.',
      instructions: [
        'Update only documentation directly affected by implemented behavior. Prefer packages/agent-core/README.md and docs/agent-layer-gaps.md if the gap status changed.',
        'ISSUE_CONTEXT (verbatim JSON):',
        '---',
        JSON.stringify(args.inputs.issueContext, null, 2),
        '---',
        'IMPLEMENTATION (verbatim JSON):',
        '---',
        JSON.stringify(args.implementation, null, 2),
        '---',
        'VERIFICATION (verbatim JSON):',
        '---',
        JSON.stringify(args.verification, null, 2),
        '---',
        'REVIEW (verbatim JSON):',
        '---',
        JSON.stringify(args.review, null, 2),
        '---',
        'Document calc expression support and rejection behavior, token estimator model/provider options if public, and abort lifecycle behavior if docs currently imply otherwise. Do not mark unrelated "Also" gaps complete.',
        'Prepare a concise PR summary and issue comment summary with tests run and residual risks.',
        'Return JSON: { changedFiles, docsUpdated, prSummary, issueComment, residualRisks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-587.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #587',
  labels: ['agent-core', 'acceptance', 'quality-gate'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'senior maintainer performing final acceptance',
      task: 'Decide whether issue #587 is complete and ready for PR.',
      instructions: [
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'SPEC (verbatim JSON):',
        '---',
        JSON.stringify(args.inputs.issueContext, null, 2),
        '---',
        'ARTIFACTS (verbatim JSON):',
        '---',
        JSON.stringify({
          reuseAudit: args.reuseAudit,
          architecturePlan: args.architecturePlan,
          regressionTests: args.regressionTests,
          implementation: args.implementation,
          verification: args.verification,
          review: args.review,
          docsAndHandoff: args.docsAndHandoff,
          attempts: args.attempts,
        }, null, 2),
        '---',
        'Pass only if abort behavior is implemented or verified complete with regression coverage, token estimation is model/provider-aware with compatible conservative default, calc is implemented safely without eval/Function, advertised bundled tool names match actual definitions, focused docs are updated, and all verification evidence is clean.',
        'Return JSON: { passed, needsHumanDecision, question, changedFiles, evidence, remainingRisks, prSummary, issueComment }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
