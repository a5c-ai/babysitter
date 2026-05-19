/**
 * @process repo/issue-184-macos-arm64-node-pty-fallback
 * @description Fix issue #184: live-stack interactive tests must survive node-pty posix_spawnp failures on macOS ARM64 CI runners.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[], ciWorkflowFile: string }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: array, verification: object, review: object }
 *
 * References used while authoring:
 * - cradle/bugfix.js
 * - tdd-quality-convergence.md
 * - specializations/sdk-platform-development/sdk-testing-strategy.js
 * - specializations/sdk-platform-development/error-handling-debugging-support.js
 * - specializations/web-development/agents/code-reviewer/AGENT.md
 * - specializations/devops-sre-platform/agents/cicd-specialist/AGENT.md
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent error-message-reviewer specializations/sdk-platform-development/agents/error-message-reviewer/AGENT.md
 * @agent cicd-specialist specializations/devops-sre-platform/agents/cicd-specialist/AGENT.md
 * @agent code-reviewer specializations/web-development/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-184.read-issue-context',
  });

  const runtimeTrace = await ctx.task(traceLiveStackRuntimeTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-184.trace-runtime',
  });

  const regressionTests = await ctx.task(authorRegressionTestsTask, {
    inputs,
    issueContext,
    runtimeTrace,
  }, {
    key: 'issue-184.author-regression-tests',
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
      key: `issue-184.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      runtimeTrace,
      regressionTests,
      implementation,
      attempt,
    }, {
      key: `issue-184.verification.${attempt}`,
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
      key: `issue-184.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const ciGate = await ctx.task(reviewCiImpactTask, {
    inputs,
    issueContext,
    runtimeTrace,
    implementation,
    verification,
    review,
  }, {
    key: 'issue-184.ci-impact',
  });

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    runtimeTrace,
    regressionTests,
    implementation,
    verification,
    review,
    ciGate,
    attempts,
  }, {
    key: 'issue-184.final-acceptance',
  });

  if (finalGate?.needsHumanDecision) {
    await ctx.breakpoint({
      title: 'Issue #184 Fallback Semantics Need Decision',
      question: finalGate.question,
      options: ['Proceed with recommended fallback semantics', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-184', 'fallback-semantics'],
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
      'code-review',
      'ci-impact-review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    verification,
    review,
    ciGate,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-184.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #184 and labels/comments',
  labels: ['agent-mux', 'live-stack', 'macos', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter agent-mux engineer',
      task: 'Read the GitHub issue and produce the authoritative runtime spec for this run.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Use the issue body, all comments, and labels as the source of truth. Preserve the raw issue and comment text in the output for downstream comparison.',
        'Return JSON: { title, labels, rawIssue, comments, affectedComponents, failingRunUrl, acceptanceCriteria, nonGoals, rootCauseHypothesis, suggestedFixes, severity }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceLiveStackRuntimeTask = defineTask('issue-184.trace-live-stack-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace live-stack PTY runtime path',
  labels: ['agent-mux', 'runtime-trace', 'root-cause'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Trace the live-stack interactive CI execution path before any code changes.',
      instructions: [
        'Work from the issue context below and inspect the current codebase.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Inspect the target files from inputs first, then follow imports/callers as needed:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
        `Inspect the CI workflow file: ${args.inputs.ciWorkflowFile}`,
        'Trace from the live-stack workflow matrix environment through pipeline-scenario.test.ts command executor selection, buildPrimaryLiveStackCommands, executePtyCommand, executeChildProcessCommand, bridge flag construction, transcript/artifact writing, and evidence validation.',
        'Identify the narrowest implementation point that can catch synchronous node-pty load/spawn failures while preserving artifact/transcript behavior and interactive coverage intent.',
        'Evaluate these design options from the issue, but do not implement yet: ensure native addon build, macOS script wrapper, graceful bridged fallback.',
        'Return JSON: { rootCause, runtimeCallPaths, liveExecutionFiles, testFiles, ciWorkflowPaths, currentInteractiveCommandShape, fallbackDesignRecommendation, rejectedOptions, risks, outOfScope }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionTestsTask = defineTask('issue-184.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author regression tests before implementation',
  labels: ['agent-mux', 'live-stack', 'tests', 'tdd'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add failing regression coverage for issue #184 before implementation changes.',
      instructions: [
        'You own test files only. Do not modify implementation files in this task.',
        'Use the issue context JSON and runtime trace JSON below as the spec source.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Add targeted coverage that simulates node-pty failing synchronously with "posix_spawnp failed" on the non-TTY interactive live-stack path.',
        'The regression must fail against current behavior by demonstrating that the raw exception escapes instead of returning a CommandResult or selecting a bridged fallback path.',
        'Cover both the executor-level fallback behavior and the pipeline selection/command-shape behavior needed to keep live-stack artifact writing intact.',
        'Keep the tests local and deterministic; do not require real macOS ARM64 runners, real model credentials, or live provider execution.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, commandsToRun, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementFocusedFixTask = defineTask('issue-184.implement-focused-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement macOS ARM64 PTY fallback attempt ${args.attempt}`,
  labels: ['agent-mux', 'live-stack', 'implementation', 'bugfix'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter agent-mux engineer',
      task: 'Implement the focused issue #184 fix.',
      instructions: [
        'You own the traced live-stack runner path and any tests required for it. Do not weaken or rewrite the regression tests to fit the implementation.',
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
        'Prefer a localized graceful fallback over broad workflow changes: catch node-pty require/spawn failures, convert them into a controlled execution path, and keep transcripts/artifact writing visible to the scenario runner.',
        'If falling back to bridged interactive mode, ensure the command shape is valid for amux launch by adding --no-interactive and --bridge-interactive where appropriate and by adjusting LIVE_STACK_INTERACTIVE/LIVE_STACK_BRIDGE_INTERACTIVE in the command environment.',
        'Preserve true TTY semantics where node-pty succeeds. Do not remove interactive coverage for platforms where PTY works.',
        'Avoid making node-pty installation/build the only guardrail; the fix must tolerate the runtime posix_spawnp failure reported in the issue.',
        'Return JSON: { changedFiles, summary, fallbackSemantics, commandShapeBeforeAfter, compatibilityNotes, testsExpectedToPass }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-184.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run issue #184 verification gate attempt ${args.attempt}`,
  labels: ['agent-mux', 'verification', 'quality-gate'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript verification engineer',
      task: 'Run the objective verification commands and report exact results.',
      instructions: [
        'Run the commands below from the repository root. Do not skip failing checks; capture command, exit code, and concise failure output.',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'At minimum, verify the targeted live-stack regression test first, then the broader agent-mux/live-stack checks supplied in inputs.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Implementation summary JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Confirm generated scenario artifacts/transcripts still report command failures through runPrimaryLiveStackScenario instead of raw Vitest crashes when the fallback path is exercised.',
        'Return JSON: { passed, commands: [{ command, exitCode, passed, summary }], failures, changedFilesObserved, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewFixTask = defineTask('issue-184.review-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review issue #184 fix attempt ${args.attempt}`,
  labels: ['agent-mux', 'review', 'quality-gate'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'senior TypeScript code reviewer',
      task: 'Review the fix against the issue and existing live-stack behavior.',
      instructions: [
        'Review the diff, tests, and verification result. Prioritize behavioral regressions, invalid amux command flags, lost artifact/transcript evidence, timeout/kill handling, platform-specific assumptions, and accidental weakening of interactive coverage.',
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

export const reviewCiImpactTask = defineTask('issue-184.review-ci-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review macOS ARM64 CI impact',
  labels: ['agent-mux', 'github-actions', 'macos', 'quality-gate'],
  agent: {
    name: 'cicd-specialist',
    prompt: {
      role: 'GitHub Actions CI engineer',
      task: 'Assess whether the fix addresses the macOS ARM64 live-stack CI failure without unnecessary workflow churn.',
      instructions: [
        'Inspect the workflow and implementation diff. Prefer no workflow change unless the code-level fallback cannot fully address the issue.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        `Workflow file: ${args.inputs.ciWorkflowFile}`,
        'Check whether macos-15-arm64/macos-latest interactive lanes can continue to produce artifacts if node-pty fails before process launch.',
        'Return JSON: { approved, workflowChangesNeeded, findings, ciRisk, recommendedFollowUp, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-184.final-acceptance-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #184',
  labels: ['agent-mux', 'acceptance', 'quality-gate'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior release reviewer',
      task: 'Decide whether the issue #184 implementation is ready for PR.',
      instructions: [
        'Check that the final implementation satisfies the issue context, passes verification, has no blocking review findings, and avoids unrelated source changes.',
        'Confirm changed files are limited to the traced live-stack runner path, tests, and only necessary CI/docs updates.',
        'Confirm the fix handles synchronous node-pty require/spawn failures and reports controlled live-stack results with artifacts/transcripts instead of raw test crashes.',
        'Confirm normal node-pty success path and non-interactive bridged paths remain intact.',
        'If fallback semantics remain ambiguous or risky, set needsHumanDecision true and provide a precise question.',
        'Inputs JSON:',
        JSON.stringify({
          issueContext: args.issueContext,
          runtimeTrace: args.runtimeTrace,
          regressionTests: args.regressionTests,
          implementation: args.implementation,
          verification: args.verification,
          review: args.review,
          ciGate: args.ciGate,
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
