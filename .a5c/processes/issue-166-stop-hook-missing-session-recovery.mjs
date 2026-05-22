/**
 * @process repo/issue-166-stop-hook-missing-session-recovery
 * @description Fix issue #166: stop hook must not silently allow exit when an active run's session state file disappears mid-run.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object }
 *
 * References used while authoring:
 * - cradle/bugfix.js
 * - babysitter/tdd-quality-convergence.js
 * - specializations/sdk-platform-development/sdk-testing-strategy.js
 * - specializations/sdk-platform-development/error-handling-debugging-support.js
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent error-message-reviewer specializations/sdk-platform-development/agents/error-message-reviewer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-166.read-issue-context',
  });

  const runtimeTrace = await ctx.task(traceHookRuntimeTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-166.trace-runtime',
  });

  const regressionTests = await ctx.task(authorRegressionTestsTask, {
    inputs,
    issueContext,
    runtimeTrace,
  }, {
    key: 'issue-166.author-regression-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementFocusedFixTask, {
      inputs,
      issueContext,
      runtimeTrace,
      regressionTests,
      attempt,
      previousVerification: verification,
      previousReview: review,
    }, {
      key: `issue-166.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      runtimeTrace,
      regressionTests,
      implementation,
      attempt,
    }, {
      key: `issue-166.verification.${attempt}`,
    });

    review = await ctx.task(reviewFixTask, {
      inputs,
      issueContext,
      runtimeTrace,
      regressionTests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-166.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    runtimeTrace,
    regressionTests,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-166.final-acceptance',
  });

  if (finalGate?.needsHumanDecision) {
    await ctx.breakpoint({
      title: 'Issue #166 Recovery Semantics Need Decision',
      question: finalGate.question,
      options: ['Proceed with recommended semantics', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-166', 'recovery-semantics'],
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
      'runtime-trace',
      'regression-tests',
      'focused-implementation',
      'verification-loop',
      'review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-166.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #166 and related context',
  labels: ['sdk', 'hooks-mux', 'research', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK runtime engineer',
      task: 'Read the GitHub issue and produce the authoritative runtime spec for this run.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Use the issue body, comments, and labels as the source of truth. Keep raw issue/comment text in the output so downstream tasks can compare against it directly.',
        'Also inspect related issues mentioned in the issue/comments only enough to distinguish scope boundaries.',
        'Return JSON: { title, labels, rawIssue, comments, relatedIssues, acceptanceCriteria, nonGoals, severity, targetFilesFromIssue }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceHookRuntimeTask = defineTask('issue-166.trace-hook-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace stop-hook and session runtime path',
  labels: ['sdk', 'hooks-mux', 'runtime-trace', 'root-cause'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior SDK runtime engineer',
      task: 'Trace the live stop-hook/session execution path before code changes.',
      instructions: [
        'Work from the issue context below and inspect the current codebase.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Trace the runtime path from hook input parsing through session lookup, run-state resolution, continuation/block decision, and session cleanup/resume behavior.',
        'Inspect these likely files first, then follow imports/callers as needed:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
        'Identify current tests that encode the existing allow-exit behavior and tests that should be extended.',
        'Return JSON: { rootCause, runtimeCallPaths, liveExecutionFiles, testFiles, recoverySources, deletionAuditPaths, proposedDesign, risks, outOfScope }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionTestsTask = defineTask('issue-166.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author regression tests before implementation',
  labels: ['sdk', 'hooks-mux', 'tests', 'tdd'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add failing regression coverage for issue #166 before implementation changes.',
      instructions: [
        'You own test files only. Do not modify implementation files in this task.',
        'Use the issue context JSON and runtime trace JSON below as the spec source. Preserve the issue acceptance criteria in test names or test comments only where helpful.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Add targeted tests that simulate a previously valid hook-bound run whose session file is missing while the run journal remains non-terminal.',
        'The regression must fail against the current behavior where the hook returns exit code 0 and an empty JSON object without inspecting run state.',
        'Cover the desired behavior: recover/recreate the session binding and block continuation when a non-terminal run can be resolved; fail visibly/non-zero when recovery cannot safely resolve a run; preserve legitimate allow-exit behavior for truly unbound sessions.',
        'Add or update audit-related tests for session cleanup/removal paths if the trace identifies a deletion or deactivation path relevant to the issue.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, commandsToRun, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementFocusedFixTask = defineTask('issue-166.implement-focused-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement missing-session recovery attempt ${args.attempt}`,
  labels: ['sdk', 'hooks-mux', 'implementation', 'bugfix'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK runtime engineer',
      task: 'Implement the focused issue #166 fix.',
      instructions: [
        'You own SDK hook/session implementation files. Do not weaken or rewrite the regression tests to fit the implementation.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Regression test result/context JSON:',
        JSON.stringify(args.regressionTests, null, 2),
        'Previous verification JSON:',
        JSON.stringify(args.previousVerification, null, 2),
        'Previous review JSON:',
        JSON.stringify(args.previousReview, null, 2),
        'Implement a localized recovery path before the missing-session-file branch silently approves exit.',
        'Prefer existing helpers and patterns in stopHookContinuation/sessionBinding/session resume code. Keep behavior compatible for sessions that truly have no associated active run.',
        'When a non-terminal run can be resolved for the hook session, recreate or repair the session binding and continue with normal stop-hook run-state handling.',
        'When recovery cannot safely identify a run but evidence indicates an active orchestration may exist, fail visibly rather than returning success.',
        'Add explicit audit logging/metadata for session state removal/deactivation paths touched by this issue, including path, session id, run id when known, reason, timestamp, and source/caller where available.',
        'Return JSON: { changedFiles, summary, recoverySemantics, auditSemantics, compatibilityNotes, testsExpectedToPass }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-166.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run SDK verification gate attempt ${args.attempt}`,
  labels: ['sdk', 'hooks-mux', 'verification', 'quality-gate'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior SDK verification engineer',
      task: 'Run the objective verification commands and report exact results.',
      instructions: [
        'Run the commands below from the repository root. Do not skip failing checks; capture command, exit code, and concise failure output.',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'At minimum, verify the targeted hook/session tests first, then the broader SDK build/test commands supplied in inputs.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Implementation summary JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Return JSON: { passed, commands: [{ command, exitCode, passed, summary }], failures, changedFilesObserved, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewFixTask = defineTask('issue-166.review-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review issue #166 fix attempt ${args.attempt}`,
  labels: ['sdk', 'hooks-mux', 'review', 'quality-gate'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior SDK compatibility reviewer',
      task: 'Review the fix against the issue and existing hook/session behavior.',
      instructions: [
        'Review the diff, tests, and verification result. Prioritize behavioral regressions, replay determinism, session-binding compatibility, and false-positive blocking risk.',
        'Compare the issue context directly to the artifacts. Do not substitute the implementation summary for the issue requirements.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Return JSON: { approved, findings: [{ severity, file, line, message }], requiredChanges, residualRisks, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-166.final-acceptance-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #166',
  labels: ['sdk', 'hooks-mux', 'acceptance', 'quality-gate'],
  agent: {
    name: 'error-message-reviewer',
    prompt: {
      role: 'senior SDK release reviewer',
      task: 'Decide whether the issue #166 implementation is ready for PR.',
      instructions: [
        'Check that the final implementation satisfies the issue context, passes verification, and has no blocking review findings.',
        'Confirm the changed files are limited to the traced hook/session runtime path, tests, and any necessary docs or logging support.',
        'Confirm no source changes unrelated to issue #166 were introduced.',
        'If a recovery semantic remains ambiguous or risky, set needsHumanDecision true and provide a precise question.',
        'Inputs JSON:',
        JSON.stringify({
          issueContext: args.issueContext,
          runtimeTrace: args.runtimeTrace,
          regressionTests: args.regressionTests,
          implementation: args.implementation,
          verification: args.verification,
          review: args.review,
          attempts: args.attempts,
        }, null, 2),
        'Return JSON: { passed, needsHumanDecision, question, changedFiles, acceptanceSummary, qualityGates, residualRisks, prSummary }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
