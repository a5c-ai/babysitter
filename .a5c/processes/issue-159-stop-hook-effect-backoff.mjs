/**
 * @process repo/issue-159-stop-hook-effect-backoff
 * @description Implement issue #159: per-effectId exponential backoff for shared stop-hook continuation during long waits.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object }
 *
 * References used while authoring:
 * - methodologies/atdd-tdd/atdd-tdd.js
 * - methodologies/process-hardening/process-hardening-patterns.js
 * - processes/shared/deterministic-quality-gate.js
 * - specializations/sdk-platform-development/sdk-testing-strategy.js
 * - specializations/sdk-platform-development/error-handling-debugging-support.js
 * - specializations/sdk-platform-development/compatibility-testing.js
 * - specializations/qa-testing-automation/quality-gates.js
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent telemetry-privacy-auditor specializations/sdk-platform-development/agents/telemetry-privacy-auditor/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-159.read-issue-context',
  });

  const runtimeTrace = await ctx.task(traceStopHookBackoffRuntimeTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-159.trace-runtime',
  });

  const design = await ctx.task(designBackoffSemanticsTask, {
    inputs,
    issueContext,
    runtimeTrace,
  }, {
    key: 'issue-159.design-backoff-semantics',
  });

  if (design?.needsMaintainerDecision) {
    await ctx.breakpoint({
      title: 'Issue #159 Backoff Semantics Need Decision',
      question: design.question,
      options: ['Proceed with recommended SDK-shared design', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-159', 'backoff-semantics'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs.issueNumber,
        design,
      },
    });
  }

  const regressionTests = await ctx.task(authorBackoffRegressionTestsTask, {
    inputs,
    issueContext,
    runtimeTrace,
    design,
  }, {
    key: 'issue-159.author-regression-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementBackoffTask, {
      inputs,
      issueContext,
      runtimeTrace,
      design,
      regressionTests,
      attempt,
      previousVerification: verification,
      previousReview: review,
    }, {
      key: `issue-159.implementation.${attempt}`,
    });

    verification = await ctx.task(runBackoffVerificationGateTask, {
      inputs,
      issueContext,
      runtimeTrace,
      design,
      regressionTests,
      implementation,
      attempt,
    }, {
      key: `issue-159.verification.${attempt}`,
    });

    review = await ctx.task(reviewBackoffFixTask, {
      inputs,
      issueContext,
      runtimeTrace,
      design,
      regressionTests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-159.review.${attempt}`,
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
    design,
    regressionTests,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-159.final-acceptance',
  });

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'runtime-trace',
      'backoff-design',
      'regression-tests',
      'implementation-loop',
      'verification',
      'review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    design,
    regressionTests,
    implementation,
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-159.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #159 and related hook context',
  labels: ['sdk', 'hooks-mux', 'plugins', 'research', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK runtime engineer',
      task: 'Read the GitHub issue and produce the authoritative implementation spec for this run.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Use the issue body, all comments, and labels as the source of truth. Keep raw issue/comment text in the output so downstream tasks can compare against it directly.',
        'Read related issues mentioned by #159 only enough to preserve boundaries, especially #158. Do not expand this run to fix unrelated hook issues.',
        'Return JSON: { title, labels, rawIssue, comments, relatedIssues, acceptanceCriteria, implementationHints, nonGoals, priority, targetFilesFromIssue }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceStopHookBackoffRuntimeTask = defineTask('issue-159.trace-stop-hook-backoff-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace shared stop-hook waiting path',
  labels: ['sdk', 'hooks-mux', 'runtime-trace', 'root-cause'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior SDK runtime engineer',
      task: 'Trace the stop-hook runtime path that repeatedly blocks while a run waits on the same pending effect.',
      instructions: [
        'Work from the issue context below and inspect the current codebase before proposing changes.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Inspect these likely files first, then follow imports and callers as needed:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
        'Confirm that plugins/babysitter-unified/hooks/stop.sh is a thin wrapper and that shared behavior belongs in the SDK hook runtime unless the current code proves otherwise.',
        'Trace how handleStopHookCommon resolves session state, run state, pending effects, continuation prompts, STOP_HOOK_INVOKED journal events, and hook output decisions.',
        'Identify how to get the active pending effectId for the waiting state. Prefer existing effect index or run-state helpers over ad hoc journal parsing if available.',
        'Identify existing tests and helper patterns for constructing run journals, session files, and hook invocation payloads.',
        'Return JSON: { rootCause, runtimeCallPaths, liveExecutionFiles, testFiles, pendingEffectSelection, stopHookEventShape, wrapperBehavior, relatedIssueBoundaries, risks, outOfScope }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designBackoffSemanticsTask = defineTask('issue-159.design-backoff-semantics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design per-effectId backoff semantics',
  labels: ['sdk', 'hooks-mux', 'design', 'feature'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior runtime design engineer',
      task: 'Design the smallest robust SDK-shared backoff implementation for issue #159.',
      instructions: [
        'Use issue context and runtime trace as constraints.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Design requirements:',
        '- Track repeated stop-hook blocks per runId + effectId while the same effect remains pending.',
        '- Default delay sequence must match the issue expectation: 10s, 30s, 90s, then cap at 300s unless env vars override it.',
        '- Support BABYSITTER_HOOK_BACKOFF_BASE and BABYSITTER_HOOK_BACKOFF_CAP.',
        '- Include applied delay and effectId in STOP_HOOK_INVOKED metadata for retrospects.',
        '- Reset naturally when the current pending effect changes, resolves, or is cancelled, and clean run-level tracking on RUN_COMPLETED or RUN_FAILED.',
        '- Preserve prompt responsiveness when an effect resolves during backoff; use interruptible polling or equivalent state checks instead of a single uninterruptible sleep.',
        '- Preserve #158-style post-resolution progress: a resolved effect must not leave the hook stuck in an old delay path.',
        'Prefer a journal-derived or run-local state strategy only after comparing race conditions, replay determinism, testability, and cleanup needs.',
        'If there is a real product ambiguity, set needsMaintainerDecision true and provide one precise question. Otherwise set it false.',
        'Return JSON: { recommendedDesign, storageStrategy, delayFormula, envSemantics, pendingEffectSemantics, interruptibleWaitSemantics, cleanupSemantics, journalMetadata, testPlan, risks, needsMaintainerDecision, question }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorBackoffRegressionTestsTask = defineTask('issue-159.author-backoff-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author stop-hook backoff regression tests',
  labels: ['sdk', 'hooks-mux', 'tests', 'tdd'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add failing regression coverage for issue #159 before implementation changes.',
      instructions: [
        'You own test files only. Do not modify implementation files in this task.',
        'Use existing hookRun test helpers and add helpers only where they reduce duplication for this feature.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Backoff design JSON:',
        JSON.stringify(args.design, null, 2),
        'Add focused tests for:',
        '- delay growth for repeated stop-hook blocks on the same pending effectId, using defaults that yield 10, 30, 90, then cap behavior;',
        '- BABYSITTER_HOOK_BACKOFF_BASE and BABYSITTER_HOOK_BACKOFF_CAP overrides;',
        '- reset/fresh delay when EFFECT_RESOLVED or EFFECT_CANCELLED is followed by a new pending effect;',
        '- run-level cleanup or harmless no-op behavior after RUN_COMPLETED and RUN_FAILED;',
        '- STOP_HOOK_INVOKED records effectId and actual delay metadata;',
        '- no regression for #158-style post-resolution progress where a resolved effect should not be delayed by stale backoff state;',
        '- interruptible wait behavior: simulate resolution during a backoff period with fake timers or injectable sleep/poll helpers so tests do not actually sleep.',
        'Tests must not wait for real 10s+ timers. Use fake timers, dependency injection, or a test-mode wait hook consistent with local patterns.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, timerStrategy, commandsToRun, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementBackoffTask = defineTask('issue-159.implement-backoff', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement stop-hook backoff attempt ${args.attempt}`,
  labels: ['sdk', 'hooks-mux', 'plugins', 'implementation', 'feature'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK runtime engineer',
      task: 'Implement the focused issue #159 stop-hook backoff feature.',
      instructions: [
        'You own SDK hook runtime implementation files and any necessary narrow test-support helpers. Do not weaken or rewrite regression tests to fit the implementation.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Backoff design JSON:',
        JSON.stringify(args.design, null, 2),
        'Regression test context JSON:',
        JSON.stringify(args.regressionTests, null, 2),
        'Previous verification JSON:',
        JSON.stringify(args.previousVerification, null, 2),
        'Previous review JSON:',
        JSON.stringify(args.previousReview, null, 2),
        'Implementation constraints:',
        '- Keep the behavior in the shared SDK stop-hook path unless runtime tracing proves a narrower shared helper is more appropriate.',
        '- Do not move policy into plugins/babysitter-unified/hooks/stop.sh except for a necessary wrapper pass-through discovered during tracing.',
        '- Keep scope limited to stop-hook backoff, event metadata, lifecycle cleanup, and tests.',
        '- Avoid long real sleeps in tests and avoid blocking legitimate progress after effect resolution.',
        '- Use existing journal/effect-index/session helpers where possible.',
        '- Keep env parsing defensive: invalid or non-positive values should fall back or clamp predictably and be covered by tests if behavior is introduced.',
        'Return JSON: { changedFiles, summary, backoffSemantics, journalMetadata, envSemantics, cleanupSemantics, responsivenessSemantics, compatibilityNotes, testsExpectedToPass }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runBackoffVerificationGateTask = defineTask('issue-159.run-backoff-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run issue #159 verification gate attempt ${args.attempt}`,
  labels: ['sdk', 'hooks-mux', 'verification', 'quality-gate'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior SDK verification engineer',
      task: 'Run objective verification and report exact results.',
      instructions: [
        'Run the commands below from the repository root. Do not skip failing checks; capture command, exit code, and concise failure output.',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'At minimum, run the targeted hook test command first, then SDK build/test commands supplied in inputs.',
        'Also inspect the final diff and confirm no implementation code unrelated to issue #159 was introduced.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Implementation summary JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Return JSON: { passed, commands: [{ command, exitCode, passed, summary }], failures, changedFilesObserved, diffScope, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewBackoffFixTask = defineTask('issue-159.review-backoff-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review issue #159 backoff fix attempt ${args.attempt}`,
  labels: ['sdk', 'hooks-mux', 'plugins', 'review', 'quality-gate'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior SDK compatibility reviewer',
      task: 'Review the backoff implementation against issue #159 and existing hook behavior.',
      instructions: [
        'Review the diff, tests, and verification result. Prioritize behavioral regressions, delayed-progress risk, race conditions, env compatibility, and journal replay determinism.',
        'Compare against the issue context directly, including every acceptance criterion.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Backoff design JSON:',
        JSON.stringify(args.design, null, 2),
        'Regression tests JSON:',
        JSON.stringify(args.regressionTests, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Return JSON: { approved, findings: [{ severity, file, line, message }], requiredChanges, acceptanceCoverage, residualRisks, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-159.final-acceptance-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #159',
  labels: ['sdk', 'hooks-mux', 'plugins', 'acceptance', 'quality-gate'],
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'senior SDK release reviewer',
      task: 'Decide whether the issue #159 implementation is ready for PR.',
      instructions: [
        'Check that the final implementation satisfies the issue context, passes verification, and has no blocking review findings.',
        'Confirm STOP_HOOK_INVOKED metadata is useful for retrospects without exposing sensitive transcript content.',
        'Confirm changed files are limited to the shared stop-hook runtime, necessary plugin wrapper updates if justified, tests, and narrow docs if needed.',
        'Confirm no source changes unrelated to issue #159 were introduced.',
        'Inputs JSON:',
        JSON.stringify({
          issueContext: args.issueContext,
          runtimeTrace: args.runtimeTrace,
          design: args.design,
          regressionTests: args.regressionTests,
          implementation: args.implementation,
          verification: args.verification,
          review: args.review,
          attempts: args.attempts,
        }, null, 2),
        'Return JSON: { passed, changedFiles, acceptanceSummary, qualityGates, privacyTelemetryReview, residualRisks, prSummary }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
