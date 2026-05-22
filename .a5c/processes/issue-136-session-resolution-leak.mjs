/**
 * @process repo/issue-136-session-resolution-leak
 * @description Plan and execute the fix for issue #136: run:create --harness claude-code must not bind to stale inherited session IDs.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - .a5c/processes/issue-166-stop-hook-missing-session-recovery.mjs
 * - packages/sdk/src/harness/README.md
 * - packages/sdk/src/cli/main/runCreate.ts
 * - packages/sdk/src/utils/sessionMarker.ts
 * - packages/sdk/src/cli/__tests__/cliRuns.test.ts
 *
 * Note: .a5c/process-library/ was not present in this checkout. The process is
 * aligned with existing local .a5c/processes conventions and the repo-specific
 * process authoring policy.
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent error-message-reviewer specializations/sdk-platform-development/agents/error-message-reviewer/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-136.read-issue-context',
  });

  const resolutionTrace = await ctx.task(traceSessionResolutionTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-136.trace-session-resolution',
  });

  const regressionPlan = await ctx.task(authorRegressionTestsTask, {
    inputs,
    issueContext,
    resolutionTrace,
  }, {
    key: 'issue-136.author-regression-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementFocusedFixTask, {
      inputs,
      issueContext,
      resolutionTrace,
      regressionPlan,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-136.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      resolutionTrace,
      regressionPlan,
      implementation,
      attempt,
    }, {
      key: `issue-136.verification.${attempt}`,
    });

    review = await ctx.task(reviewCompatibilityTask, {
      inputs,
      issueContext,
      resolutionTrace,
      regressionPlan,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-136.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    resolutionTrace,
    regressionPlan,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-136.final-acceptance',
  });

  if (finalGate?.needsHumanDecision) {
    await ctx.breakpoint({
      title: 'Issue #136 Session Resolution Semantics Need Decision',
      question: finalGate.question,
      options: ['Proceed with recommended semantics', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-136', 'session-resolution'],
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
      'session-resolution-trace',
      'regression-tests',
      'focused-implementation',
      'verification-loop',
      'compatibility-review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    resolutionCallPaths: resolutionTrace?.resolutionCallPaths ?? [],
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-136.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #136 and related session-binding context',
  labels: ['sdk', 'hooks-mux', 'research', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK runtime engineer',
      task: 'Read the GitHub issue and produce the authoritative behavioral spec for this run.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Use the issue body, every comment, and labels as the source of truth. Keep the most important raw observations in the output so downstream tasks can compare behavior directly.',
        'Inspect related issues or PRs mentioned in issue comments only enough to distinguish scope boundaries, especially #130, #133, #134, #164, #138, and #166.',
        'Return JSON: { title, labels, rawIssueSummary, commentsSummary, relatedIssues, acceptanceCriteria, nonGoals, severity, targetFilesFromIssue, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceSessionResolutionTask = defineTask('issue-136.trace-session-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace run:create and session resolution call paths',
  labels: ['sdk', 'hooks-mux', 'runtime-trace', 'root-cause'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior SDK runtime engineer',
      task: 'Map the current session-resolution and session-binding paths before code changes.',
      instructions: [
        'Work from the issue context JSON and inspect the current codebase.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Inspect these likely files first, then follow imports/callers as needed:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
        'Trace run:create from CLI argument parsing through adapter selection, explicit --session-id handling, adapter.resolveSessionId(), bindSession(), JSON output, and state-file writes.',
        'Trace session:* and session:whoami resolution paths enough to confirm whether they share the same resolver and provenance reporting.',
        'Trace Claude Code session-start marker/env-file behavior and stop-hook lookup enough to prove why the wrong binding leaves runs stuck at RUN_CREATED.',
        'Compare implementation behavior against packages/sdk/src/harness/README.md precedence: explicit > PID marker > harness-native env file/native env var > AGENT_SESSION_ID, with AGENT_TRUST_ENV_SESSION/BABYSITTER_TRUST_ENV_SESSION as the explicit env-first escape hatch.',
        'Identify tests that currently encode the wrong behavior and tests that should be added or inverted.',
        'Return JSON: { rootCause, resolutionCallPaths, sessionBindingFiles, hookFiles, testFiles, observedContractDrift, proposedDesign, risks, outOfScope }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionTestsTask = defineTask('issue-136.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing regression tests for stale session leak',
  labels: ['sdk', 'hooks-mux', 'tests', 'tdd'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add failing regression coverage for issue #136 before implementation changes.',
      instructions: [
        'You own test files only in this task. Do not modify implementation files.',
        'Use the issue context and resolution trace JSON below as the spec source.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Resolution trace JSON:',
        JSON.stringify(args.resolutionTrace, null, 2),
        'Add or update targeted tests proving run:create --harness claude-code binds to the current PID-marker/current-session source instead of a leaked inherited AGENT_SESSION_ID/BABYSITTER_SESSION_ID-style value.',
        'Invert or split any existing test that currently expects leaked AGENT_SESSION_ID to win when a current marker exists.',
        'Add coverage for the explicit trust-env escape hatch: AGENT_TRUST_ENV_SESSION=1 or BABYSITTER_TRUST_ENV_SESSION=1 should preserve env-first behavior for CI.',
        'Add coverage for JSON/provenance output where applicable: resolvedFrom should distinguish pid-marker/current-session, env-var, explicit, and none accurately.',
        'Add coverage for --session-id override semantics if the trace confirms SESSION_ID_CONFLICT blocks a necessary documented escape hatch; preserve safeguards for accidental conflicts.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, commandsToRun, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementFocusedFixTask = defineTask('issue-136.implement-focused-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement session-resolution fix attempt ${args.attempt}`,
  labels: ['sdk', 'hooks-mux', 'implementation', 'bugfix'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK runtime engineer',
      task: 'Implement the focused issue #136 fix.',
      instructions: [
        'You own SDK session-resolution, harness adapter, and closely related docs/tests required by the issue. Do not weaken or rewrite the regression tests to fit the implementation.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Resolution trace JSON:',
        JSON.stringify(args.resolutionTrace, null, 2),
        'Regression test context JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Previous verification JSON:',
        JSON.stringify(args.previousVerification, null, 2),
        'Previous review JSON:',
        JSON.stringify(args.previousReview, null, 2),
        'Implement one authoritative resolver contract for run:create and session:* paths. Prefer localized changes in resolveSessionIdWithMarker/BaseHarnessAdapter/Claude adapter provenance over duplicated special cases.',
        'Default interactive behavior must prefer a live PID-scoped marker/current hook-provided session over inherited AGENT_SESSION_ID or legacy BABYSITTER_SESSION_ID-style leaks.',
        'Keep explicit trust-env behavior for CI: AGENT_TRUST_ENV_SESSION=1 or BABYSITTER_TRUST_ENV_SESSION=1 makes env-first behavior intentional and covered by tests.',
        'Make run:create --harness claude-code JSON provenance truthful, including marker/current-session vs env-var vs explicit, so users can diagnose future binding issues.',
        'If supporting --session-id as an override is necessary, loosen SESSION_ID_CONFLICT deliberately and document the guardrails; otherwise document why the resolver makes it unnecessary.',
        'Emit a clear warning or diagnostic when run:create detects an env-var session ID losing to a different current marker/session source, without making successful current-session binding noisy in JSON automation.',
        'Return JSON: { changedFiles, summary, resolverSemantics, provenanceSemantics, compatibilityNotes, testsExpectedToPass }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-136.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run SDK verification gate attempt ${args.attempt}`,
  labels: ['sdk', 'hooks-mux', 'verification', 'quality-gate'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior SDK verification engineer',
      task: 'Run the targeted and full verification gates for issue #136.',
      instructions: [
        'Use the issue context, trace, tests, and implementation summaries below.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Resolution trace JSON:',
        JSON.stringify(args.resolutionTrace, null, 2),
        'Regression test JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Run the verification commands listed in inputs unless the implementation changed the relevant command set. Capture exact commands, pass/fail status, and any failure excerpts.',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'Verify that regression tests fail against the pre-fix behavior if evidence is still available, and pass after the implementation.',
        'Verify no generated dist output or unrelated source files were modified unless the repo explicitly requires it.',
        'Return JSON: { passed, commands, failures, preExistingFailures, changedFiles, coverageNotes, nextFixInstructions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewCompatibilityTask = defineTask('issue-136.review-compatibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review session compatibility attempt ${args.attempt}`,
  labels: ['sdk', 'hooks-mux', 'review', 'compatibility'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior compatibility reviewer for harness session semantics',
      task: 'Review the issue #136 fix for regressions and contract drift.',
      instructions: [
        'Prioritize bugs, behavior regressions, missing tests, and compatibility risks. Findings should include file and line references.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Resolution trace JSON:',
        JSON.stringify(args.resolutionTrace, null, 2),
        'Regression test JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Check run:create, session:init/session:update/session:whoami, Claude Code session-start/stop hooks, non-Claude adapters, and CI trust-env compatibility.',
        'Check docs/help text and diagnostics for consistency with the new resolver semantics.',
        'Return JSON: { approved, findings, missingTests, compatibilityRisks, docsRisks, requiredChanges, changedFiles }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-136.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #136',
  labels: ['sdk', 'hooks-mux', 'final-gate', 'quality-gate'],
  agent: {
    name: 'error-message-reviewer',
    prompt: {
      role: 'release-minded SDK reviewer',
      task: 'Decide whether the issue #136 run is complete and ready for PR.',
      instructions: [
        'Use the full run context below.',
        'Inputs JSON:',
        JSON.stringify(args.inputs, null, 2),
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Resolution trace JSON:',
        JSON.stringify(args.resolutionTrace, null, 2),
        'Regression test JSON:',
        JSON.stringify(args.regressionPlan, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Review JSON:',
        JSON.stringify(args.review, null, 2),
        'Attempts JSON:',
        JSON.stringify(args.attempts, null, 2),
        'Pass only if all acceptance focus items are satisfied, verification passed, compatibility review approved, and any warnings/diagnostics are actionable without being noisy for JSON automation.',
        'If a maintainer decision is required, set needsHumanDecision true with a concise question and recommended option. Otherwise set it false.',
        'Return JSON: { passed, needsHumanDecision, question, acceptanceResults, changedFiles, verificationSummary, reviewSummary, releaseNotesCandidate, followUps }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
