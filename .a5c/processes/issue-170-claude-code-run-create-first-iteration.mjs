/**
 * @process repo/issue-170-claude-code-run-create-first-iteration
 * @description Fix issue #170: run:create --harness claude-code must not leave a newly bound run parked at state=created with no first iteration.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object }
 *
 * References used while authoring:
 * - cradle/bugfix.js
 * - babysitter/tdd-quality-convergence.js
 * - methodologies/atdd-tdd/atdd-tdd.js
 * - methodologies/process-hardening/process-hardening-patterns.js
 * - specializations/sdk-platform-development/sdk-testing-strategy.js
 * - specializations/sdk-platform-development/error-handling-debugging-support.js
 * - specializations/sdk-platform-development/compatibility-testing.js
 * - specializations/collaboration/github/issue-linking.js
 * - specializations/collaboration/github/pr-policies.js
 * - processes/shared/ci/idempotency-and-safe-abort.js
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-170.read-issue-context',
  });

  const runtimeTrace = await ctx.task(traceInitialWakeupRuntimeTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-170.trace-runtime',
  });

  const design = await ctx.task(designFirstIterationWakeupTask, {
    inputs,
    issueContext,
    runtimeTrace,
  }, {
    key: 'issue-170.design-first-iteration-wakeup',
  });

  if (design?.needsMaintainerDecision) {
    await ctx.breakpoint({
      title: 'Issue #170 First-Iteration Semantics Need Decision',
      question: design.question,
      options: ['Proceed with recommended first-iteration design', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-170', 'first-iteration'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs.issueNumber,
        design,
      },
    });
  }

  const regressionTests = await ctx.task(authorFirstIterationRegressionTestsTask, {
    inputs,
    issueContext,
    runtimeTrace,
    design,
  }, {
    key: 'issue-170.author-regression-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt += 1) {
    implementation = await ctx.task(implementFirstIterationWakeupTask, {
      inputs,
      issueContext,
      runtimeTrace,
      design,
      regressionTests,
      attempt,
      previousVerification: verification,
      previousReview: review,
    }, {
      key: `issue-170.implementation.${attempt}`,
    });

    verification = await ctx.task(runFirstIterationVerificationGateTask, {
      inputs,
      issueContext,
      runtimeTrace,
      design,
      regressionTests,
      implementation,
      attempt,
    }, {
      key: `issue-170.verification.${attempt}`,
    });

    review = await ctx.task(reviewFirstIterationFixTask, {
      inputs,
      issueContext,
      runtimeTrace,
      design,
      regressionTests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-170.review.${attempt}`,
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
    key: 'issue-170.final-acceptance',
  });

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'runtime-trace',
      'first-iteration-design',
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

export const readIssueContextTask = defineTask('issue-170.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #170 and related hook context',
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
        'Read related issues mentioned by #170 only enough to preserve boundaries, especially #158, #166, #139, and #136. Do not expand this run to fix unrelated hook issues.',
        'Return JSON: { title, labels, rawIssue, comments, relatedIssues, acceptanceCriteria, implementationHints, nonGoals, priority, targetFilesFromIssue }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceInitialWakeupRuntimeTask = defineTask('issue-170.trace-initial-wakeup-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace run:create, session binding, and first iteration path',
  labels: ['sdk', 'hooks-mux', 'runtime-trace', 'root-cause'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior SDK runtime engineer',
      task: 'Trace the live initial wakeup path before code changes.',
      instructions: [
        'Work from the issue context below and inspect the current codebase before proposing changes.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Inspect these likely files first, then follow imports and callers as needed:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
        'Trace run:create from CLI argument parsing through createRun, session binding, run-state derivation, stop-hook continuation, and run:iterate.',
        'Confirm the current behavior for a newly created harness-bound run: journal contains RUN_CREATED, run state is created, pending effects are zero, and stopHookHandler would block only if the host invokes it.',
        'Identify existing test helpers for CLI run creation, harness session resolution, hook stop handling, and first run iteration.',
        'Return JSON: { rootCause, runtimeCallPaths, liveExecutionFiles, testFiles, createdStateSemantics, stopHookInvocationGap, existingRelatedFixes, risks, outOfScope }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designFirstIterationWakeupTask = defineTask('issue-170.design-first-iteration-wakeup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design first-iteration wakeup semantics',
  labels: ['sdk', 'hooks-mux', 'design', 'bugfix'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior runtime design engineer',
      task: 'Design the smallest robust fix for issue #170.',
      instructions: [
        'Use issue context and runtime trace as constraints.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Compare the two issue-suggested approaches: special-case created state in stop-hook handling versus having run:create seed the first iteration for hook-driven harness-bound runs.',
        'Prefer a fix that makes run:create --harness claude-code return a reachable run without relying on a host Stop hook invocation that may never happen.',
        'Define exact eligibility: non-bare run, successful session binding, hook-driven harness with stop-hook lifecycle, not dry-run, not already iterated, and no session binding fatal/error.',
        'Define safeguards against double iteration, accidental bare-run iteration, custom harness behavior changes, and JSON/human output ambiguity.',
        'If the design needs a product decision, set needsMaintainerDecision true with one precise question; otherwise set it false.',
        'Return JSON: { recommendedDesign, rejectedAlternatives, eligibilityRules, cliOutputSemantics, idempotencySemantics, compatibilityNotes, testPlan, risks, needsMaintainerDecision, question }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorFirstIterationRegressionTestsTask = defineTask('issue-170.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author first-iteration regression tests',
  labels: ['sdk', 'hooks-mux', 'tests', 'tdd'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add failing regression coverage for issue #170 before implementation changes.',
      instructions: [
        'You own test files only. Do not modify implementation files in this task.',
        'Use existing cliRuns, hookRun, and runtime test helpers before adding new helpers.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Design JSON:',
        JSON.stringify(args.design, null, 2),
        'Add targeted tests proving run:create --harness claude-code with a real process and successful session binding advances beyond a RUN_CREATED-only journal and reaches the first pending EFFECT_REQUESTED without manual run:iterate.',
        'Add negative coverage proving bare runs and failed/unresolved session binding do not auto-iterate.',
        'Add compatibility coverage for JSON output shape and existing session resolution precedence, especially marker-backed claude-code sessions versus trusted env sessions.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, commandsToRun, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementFirstIterationWakeupTask = defineTask('issue-170.implement-first-iteration-wakeup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement first-iteration wakeup attempt ${args.attempt}`,
  labels: ['sdk', 'hooks-mux', 'implementation', 'bugfix'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK runtime engineer',
      task: 'Implement the focused issue #170 fix.',
      instructions: [
        'You own SDK CLI/runtime/harness implementation files. Do not weaken or rewrite regression tests to fit the implementation.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Design JSON:',
        JSON.stringify(args.design, null, 2),
        'Regression test result/context JSON:',
        JSON.stringify(args.regressionTests, null, 2),
        'Previous verification JSON:',
        JSON.stringify(args.previousVerification, null, 2),
        'Previous review JSON:',
        JSON.stringify(args.previousReview, null, 2),
        'Implement only the initial wakeup gap. Keep normal stop-hook waiting/backoff behavior from #158/#159 and missing-session recovery from #166 intact.',
        'Prefer existing runIterate/orchestrateIteration, harness capability, and run-state helpers over ad hoc journal mutation.',
        'Preserve dry-run behavior, bare-run creation, process validation, session binding conflict handling, and existing CLI output compatibility.',
        'Return JSON: { changedFiles, summary, wakeupSemantics, compatibilityNotes, testsExpectedToPass }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runFirstIterationVerificationGateTask = defineTask('issue-170.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run SDK verification gate attempt ${args.attempt}`,
  labels: ['sdk', 'hooks-mux', 'verification', 'quality-gate'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior SDK verification engineer',
      task: 'Run deterministic verification for the issue #170 fix and report exact command results.',
      instructions: [
        'Run the verification commands from inputs. Do not skip commands unless the command is impossible in the environment; if so, explain the concrete blocker.',
        'Verification commands:',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'The gate passes only if targeted regression tests pass, SDK build passes, and SDK tests pass or any unrelated pre-existing failures are evidenced.',
        'Also inspect the resulting journal for the regression scenario and confirm it contains EFFECT_REQUESTED after run:create, not only RUN_CREATED.',
        'Return JSON: { passed, commandResults, journalEvidence, failures, suspectedUnrelatedFailures, followUpRequired }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewFirstIterationFixTask = defineTask('issue-170.review-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review first-iteration wakeup fix attempt ${args.attempt}`,
  labels: ['sdk', 'hooks-mux', 'review', 'compatibility'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior SDK compatibility reviewer',
      task: 'Review the issue #170 fix for behavioral regressions.',
      instructions: [
        'Review code changes, regression tests, and verification evidence.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Design JSON:',
        JSON.stringify(args.design, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Check for double-iteration risk, bare-run regression, unsupported harness behavior changes, session conflict masking, JSON output breakage, and interaction with #158/#159/#166 fixes.',
        'Return JSON: { approved, issues, requiredChanges, compatibilityNotes, riskLevel }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-170.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #170',
  labels: ['sdk', 'hooks-mux', 'final-gate', 'acceptance'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior maintainer',
      task: 'Decide whether the issue #170 run is ready to hand off for PR.',
      instructions: [
        'Compare the issue context against implementation, verification, and review evidence.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Design JSON:',
        JSON.stringify(args.design, null, 2),
        'Regression tests JSON:',
        JSON.stringify(args.regressionTests, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Review JSON:',
        JSON.stringify(args.review, null, 2),
        'All attempts JSON:',
        JSON.stringify(args.attempts, null, 2),
        'Pass only when the original stuck-created scenario is fixed, tests cover the regression and negative cases, compatibility review approves, and verification is clean or unrelated failures are documented with evidence.',
        'Return JSON: { passed, changedFiles, acceptanceEvidence, remainingRisks, prSummary, followUps }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
