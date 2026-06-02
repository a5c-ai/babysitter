/**
 * @process repo/issue-575-agent-core-streaming-history
 * @description Plan and execute issue #575: add streaming responses and multi-turn history to agent-core session.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - No `.a5c/process-library/` directory was present in this checkout. Local
 *   process-authoring sources used instead:
 *   - docs/agent-reference/process-authoring.md
 *   - .a5c/processes/issue-136-session-resolution-leak.mjs
 *   - .a5c/processes/issue-483-gemini-live-stack-regression.mjs
 * - Existing agent-core surfaces to reuse:
 *   - packages/agent-core/src/session.ts currently owns endpoint resolution,
 *     provider request shaping, event emission, queued follow-ups, and direct
 *     fetch calls.
 *   - packages/agent-core/src/types.ts owns AgentCorePromptResult,
 *     AgentCoreSessionEvent, and AgentCoreSessionOptions.
 *   - packages/agent-core/src/session.test.ts already mocks fetch and asserts
 *     the current one-shot behavior, including the current lack of persisted
 *     second-turn history.
 * - Existing streaming infrastructure to study before adding new parsers:
 *   - packages/transport-mux/src/engines/openai.ts parses OpenAI/Azure SSE
 *     `data:` chunks, `[DONE]`, deltas, finish reasons, and usage.
 *   - packages/transport-mux/src/engines/anthropic.ts parses Anthropic
 *     message streaming events, including `content_block_delta` text deltas
 *     and `message_delta` usage.
 *   - packages/transport-mux/tests/transports/openai-chat.test.ts and
 *     packages/transport-mux/tests/transports/anthropic.test.ts provide
 *     realistic stream fixtures.
 * - Existing context/token surfaces to consider before inventing new trimming:
 *   - packages/agent-core/src/context/token-estimator.ts
 *   - packages/tula-platform/src/compression/compaction.ts
 * - Downstream integration boundaries to protect:
 *   - packages/tula-platform/src/harness/invoker.ts
 *   - packages/tula-platform/src/harness/internal/createRun/__tests__/createRun.test.ts
 *   - packages/agent-core/README.md session API documentation
 *
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/shared/root-cause-diagnosis
 * @process specializations/sdk-platform-development
 * @process specializations/qa-testing-automation
 * @agent agent-core-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent streaming-parser-engineer specializations/network-programming/agents/proxy-expert/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

function compactResult(result) {
  return result?.value ?? result ?? null;
}

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-575.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext: compactResult(issueContext),
  }, {
    key: 'issue-575.reuse-audit',
  });

  const architectureTrace = await ctx.task(traceArchitectureTask, {
    inputs,
    issueContext: compactResult(issueContext),
    reuseAudit: compactResult(reuseAudit),
  }, {
    key: 'issue-575.architecture-trace',
  });

  const regressionPlan = await ctx.task(authorRegressionPlanTask, {
    inputs,
    issueContext: compactResult(issueContext),
    reuseAudit: compactResult(reuseAudit),
    architectureTrace: compactResult(architectureTrace),
  }, {
    key: 'issue-575.regression-plan',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementStreamingAndHistoryTask, {
      inputs,
      issueContext: compactResult(issueContext),
      reuseAudit: compactResult(reuseAudit),
      architectureTrace: compactResult(architectureTrace),
      regressionPlan: compactResult(regressionPlan),
      previousVerification: compactResult(verification),
      previousReview: compactResult(review),
      attempt,
    }, {
      key: `issue-575.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext: compactResult(issueContext),
      architectureTrace: compactResult(architectureTrace),
      implementation: compactResult(implementation),
      attempt,
    }, {
      key: `issue-575.verification.${attempt}`,
    });

    review = await ctx.task(reviewCompatibilityTask, {
      inputs,
      issueContext: compactResult(issueContext),
      reuseAudit: compactResult(reuseAudit),
      architectureTrace: compactResult(architectureTrace),
      regressionPlan: compactResult(regressionPlan),
      implementation: compactResult(implementation),
      verification: compactResult(verification),
      attempt,
    }, {
      key: `issue-575.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext: compactResult(issueContext),
    reuseAudit: compactResult(reuseAudit),
    architectureTrace: compactResult(architectureTrace),
    regressionPlan: compactResult(regressionPlan),
    implementation: compactResult(implementation),
    verification: compactResult(verification),
    review: compactResult(review),
    attempts,
  }, {
    key: 'issue-575.final-acceptance',
  });

  if (finalGate?.needsHumanDecision) {
    await ctx.breakpoint({
      title: 'Issue #575 Agent-Core Session Contract Decision',
      question: finalGate.question,
      options: [
        'Proceed with recommended API-compatible contract',
        'Pause for maintainer guidance',
      ],
      expert: 'maintainer',
      tags: ['approval-gate', 'issue-575', 'agent-core', 'session-contract'],
      context: {
        runId: ctx.runId,
        finalGate,
        attempts: attempts.length,
      },
    });
  }

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit',
      'architecture-trace',
      'regression-plan',
      'streaming-and-history-implementation',
      'verification-loop',
      'compatibility-review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    issueContext,
    reuseAudit,
    architectureTrace,
    regressionPlan,
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-575.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #575 and related session requirements',
  labels: ['issue-575', 'agent-core', 'research', 'issue-context'],
  agent: {
    name: 'agent-core-architect',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Read issue #575 and produce the authoritative implementation spec before code changes.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Read docs/agent-layer-gaps.md and packages/agent-core/README.md session API sections.',
        'Inspect related issues mentioned in comments only enough to preserve scope boundaries: #582, #578, #587, #594, and #257.',
        'Treat the issue body, comments, and labels as the source of truth.',
        'Return JSON: { title, labels, issueSummary, commentsSummary, relatedScopeBoundaries, acceptanceCriteria, nonGoals, riskLevel, targetFilesFromIssue, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-575.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run reuse audit for streaming and history infrastructure',
  labels: ['issue-575', 'reuse-audit', 'architecture'],
  agent: {
    name: 'agent-core-architect',
    prompt: {
      role: 'senior monorepo architect',
      task: 'Find existing code, tests, and docs to reuse before proposing new infrastructure.',
      instructions: [
        'Do not edit files.',
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Use these keywords and variants: streaming, stream, SSE, text/event-stream, ReadableStream, chat/completions, /v1/messages, content_block_delta, message_delta, [DONE], history, conversation, messages, multi-turn, turn trimming, token estimate, getHistory, clearHistory, followUp, steer.',
        'Scan packages/agent-core, packages/transport-mux, packages/agent-mux, packages/tula-platform, docs, and .a5c/processes. Note that `.a5c/process-library/` may be absent; report whether it exists.',
        'Identify reusable parser logic or fixtures, compatible token-estimation helpers, current public API boundaries, and tests that already lock in old behavior.',
        'Return JSON: { processLibraryStatus, reusableImplementations, reusableTests, apiBoundaries, oldBehaviorTests, noNewInfrastructureNotes, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceArchitectureTask = defineTask('issue-575.trace-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace agent-core session architecture and contracts',
  labels: ['issue-575', 'agent-core', 'architecture-trace'],
  agent: {
    name: 'agent-core-architect',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Map the current agent-core session call path and propose the smallest safe design.',
      instructions: [
        'Do not edit files.',
        'Use issue context and reuse audit JSON as input.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Trace packages/agent-core/src/session.ts from prompt() through endpoint resolution, request body construction, fetch, event emission, followUp()/steer(), abort(), dispose(), and sessionId/isStreaming getters.',
        'Trace packages/agent-core/src/types.ts and downstream imports/re-exports in agent-platform so any new getHistory()/clearHistory() and history/trimming options are API-compatible.',
        'Trace OpenAI/Azure and Anthropic streaming wire formats from transport-mux tests/engines enough to avoid hand-rolled divergent parsing.',
        'Define failure behavior explicitly: when to append user turns, when to append assistant output, how to handle partial streams, failed requests, timeout/abort, and queued follow-ups.',
        'Define deterministic trimming semantics, using max turns and token-aware limits if available. Keep system prompt handling stable and avoid duplicating the system prompt in history.',
        'Return JSON: { currentBehavior, rootCause, proposedDesign, providerStreamingContracts, historyContract, trimmingContract, failureContract, filesToTouch, testsToAdd, risks, outOfScope }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionPlanTask = defineTask('issue-575.author-regression-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing regression tests for streaming and history',
  labels: ['issue-575', 'tests', 'tdd'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add or update tests first so the current issue #575 behavior fails before implementation.',
      instructions: [
        'You own test files only in this task. Do not modify implementation files.',
        'Use issue context, reuse audit, and architecture trace as the spec source.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Architecture trace JSON:',
        JSON.stringify(args.architectureTrace, null, 2),
        'Add OpenAI/Azure SSE tests where fetch returns a ReadableStream containing multiple data chunks. Assert multiple incremental text_delta events, preserved event ordering, stream: true request body, and final AgentCorePromptResult.output concatenation.',
        'Add Anthropic streaming tests with message_start/content_block_delta/message_delta/message_stop-shaped chunks. Assert normalized text_delta events and final output.',
        'Add multi-turn tests proving a second prompt includes the prior user and successful assistant turns plus the new user prompt.',
        'Add getHistory()/clearHistory() tests, including defensive copying and system prompt not being duplicated into mutable history.',
        'Add trimming tests for the chosen deterministic max-turn/token policy.',
        'Add followUp()/steer() tests showing queued follow-up text is merged into the next user turn and persisted exactly once in history.',
        'Add failure/timeout tests showing unsuccessful assistant output is not appended while API errors still emit error events and clear active state.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, requestFixtures, commandsToRun, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementStreamingAndHistoryTask = defineTask('issue-575.implement-streaming-and-history', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement agent-core streaming and history attempt ${args.attempt}`,
  labels: ['issue-575', 'agent-core', 'implementation'],
  agent: {
    name: 'streaming-parser-engineer',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Implement the focused issue #575 fix and keep changes scoped to agent-core session behavior.',
      instructions: [
        'Edit the repository directly. Do not modify unrelated source files.',
        'Do not weaken regression tests to fit the implementation.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Architecture trace JSON:',
        JSON.stringify(args.architectureTrace, null, 2),
        'Regression plan JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Previous verification JSON:',
        JSON.stringify(args.previousVerification, null, 2),
        'Previous review JSON:',
        JSON.stringify(args.previousReview, null, 2),
        'Implement provider streaming for OpenAI/Azure chat completions and Anthropic messages using response.body readers and provider-specific parser helpers. Keep parsing isolated from prompt() orchestration.',
        'Send stream: true for streaming-capable providers. Preserve existing endpoint/auth/model/max token behavior unless the tests prove a contract bug.',
        'Emit session_start before provider work, zero or more incremental text_delta events as chunks arrive, error on failures, and session_end only after successful completion unless the established event contract says otherwise.',
        'Return AgentCorePromptResult.output as the concatenated text and preserve success/duration/exitCode semantics.',
        'Persist conversation history per session handle: include successful user turns and assistant turns across prompts. Apply followUp()/steer() text to the next user turn exactly once.',
        'Add getHistory() and clearHistory() or the equivalent public controls required by the issue, with types exported from packages/agent-core/src/types.ts.',
        'Implement deterministic history trimming with explicit max-turn and token-aware behavior; use existing token-estimation helpers where practical.',
        'Append assistant output only after successful completion. Define and implement failure/abort behavior so partial assistant output does not corrupt future prompts.',
        'Keep transport-mux fixes out of scope unless a test proves agent-core cannot implement its contract without a small shared parser extraction.',
        'Update packages/agent-core/README.md only if public API or documented session behavior changes.',
        'Return JSON: { changedFiles, summary, streamingContract, historyContract, trimmingContract, failureBehavior, testsExpectedToPass }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-575.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run issue #575 verification gate attempt ${args.attempt}`,
  labels: ['issue-575', 'verification', 'quality-gate'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior TypeScript verification engineer',
      task: 'Run targeted and package-level verification for issue #575 and report exact results.',
      instructions: [
        'Run the verification commands from inputs unless a command is impossible in the environment; if impossible, explain the exact blocker.',
        'Inputs verificationCommands:',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'At minimum, verify: agent-core session tests, agent-core package tests, agent-core build, git diff --check, and relevant agent-platform direct-harness tests if API shape changed.',
        'Inspect the final diff enough to confirm only issue #575 files changed, aside from tests/docs directly required.',
        'Return JSON: { passed: boolean, commandsRun: Array<{ command: string, exitCode: number, summary: string }>, failedCommands, changedFiles, coverageGaps, environmentBlockers }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewCompatibilityTask = defineTask('issue-575.review-compatibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review issue #575 implementation attempt ${args.attempt}`,
  labels: ['issue-575', 'review', 'compatibility'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior API compatibility reviewer',
      task: 'Review the implementation against the issue contract, event semantics, and downstream agent-platform boundaries.',
      instructions: [
        'Do not edit files in this task.',
        'Use git diff and the provided context to review for bugs, regressions, and missing tests.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Architecture trace JSON:',
        JSON.stringify(args.architectureTrace, null, 2),
        'Regression plan JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Check provider parser robustness for split SSE frames, multi-line event payloads, [DONE], Anthropic event names, usage chunks, non-streaming fallback if intentionally retained, and malformed chunk error messages.',
        'Check history semantics for system prompt placement, follow-up persistence, failed prompts, clearHistory(), getHistory() copies, concurrent prompt rejection, and unbounded memory growth.',
        'Check downstream compatibility with packages/tula-platform direct agent-core harness usage and existing README promises.',
        'Return JSON: { approved: boolean, findings: Array<{ severity: string, file: string, line: number, issue: string }>, missingTests, apiCompatibilityNotes, residualRisks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-575.final-acceptance-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #575',
  labels: ['issue-575', 'final-gate', 'acceptance'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'senior maintainer',
      task: 'Decide whether issue #575 is complete and ready for PR.',
      instructions: [
        'Do not edit files in this task.',
        'Compare the final repository state against the issue acceptance criteria and the latest verification/review outputs.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Final verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Final review JSON:',
        JSON.stringify(args.review, null, 2),
        'Attempts JSON:',
        JSON.stringify(args.attempts, null, 2),
        'Confirm all of these gates: streaming emits incremental text_delta events for OpenAI/Azure and Anthropic; prompt() final output remains complete; multi-turn history includes prior user/assistant turns; history controls exist and are typed; trimming is deterministic and tested; followUp()/steer() still work; failures do not corrupt history; event ordering is preserved; targeted tests and build pass; scope avoids unrelated transport-mux or agent-platform rewrites.',
        'Set needsHumanDecision only for a real unresolved semantic/API conflict, not for ordinary follow-up work.',
        'Return JSON: { passed: boolean, needsHumanDecision: boolean, question: string | null, changedFiles: string[], acceptanceStatus: Record<string, boolean>, verificationSummary: string, releaseNoteCandidate: string, residualRisks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
