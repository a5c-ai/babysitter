/**
 * @process repo/issue-185-native-macos-arm64-pty
 * @description Replace the rejected issue #184 bridge fallback with native macOS ARM64 PTY support for live-stack interactive tests.
 * @inputs { issueNumber: number, linkedIssueNumber: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[], guardrailCommands: string[], ciWorkflowFile: string }
 * @outputs { success: boolean, changedFiles: string[], runtimeCallPaths: array, verification: object, review: object }
 *
 * References used while authoring:
 * - tdd-quality-convergence.md
 * - methodologies/spec-kit-brownfield.js
 * - specializations/sdk-platform-development/sdk-testing-strategy.js
 * - specializations/sdk-platform-development/error-handling-debugging-support.js
 * - specializations/devops-sre-platform/agents/cicd-specialist/AGENT.md
 *
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-coverage-analyzer specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent cicd-specialist specializations/devops-sre-platform/agents/cicd-specialist/AGENT.md
 * @agent code-reviewer specializations/web-development/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-185.read-issue-context',
  });

  const specText = await ctx.task(readSpecTextTask, inputs, {
    key: 'issue-185.read-spec-text',
  });

  const runtimeTrace = await ctx.task(traceNativePtyRuntimeTask, {
    inputs,
    issueContext,
    specText: specText.stdout,
  }, {
    key: 'issue-185.trace-runtime',
  });

  const tests = await ctx.task(authorNativePtyTestsTask, {
    inputs,
    issueContext,
    specText: specText.stdout,
    runtimeTrace,
  }, {
    key: 'issue-185.author-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementNativePtyFixTask, {
      inputs,
      issueContext,
      specText: specText.stdout,
      runtimeTrace,
      tests,
      attempt,
      previousVerification: verification,
      previousReview: review,
    }, {
      key: `issue-185.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      specText: specText.stdout,
      runtimeTrace,
      tests,
      implementation,
      attempt,
    }, {
      key: `issue-185.verification.${attempt}`,
    });

    review = await ctx.task(reviewNativePtyFixTask, {
      inputs,
      issueContext,
      specText: specText.stdout,
      runtimeTrace,
      tests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-185.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });
    if (verification?.passed === true && review?.approved === true) break;
  }

  const ciGate = await ctx.task(reviewCiImpactTask, {
    inputs,
    issueContext,
    specText: specText.stdout,
    runtimeTrace,
    implementation,
    verification,
    review,
  }, {
    key: 'issue-185.ci-impact',
  });

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    specText: specText.stdout,
    runtimeTrace,
    tests,
    implementation,
    verification,
    review,
    ciGate,
    attempts,
  }, {
    key: 'issue-185.final-acceptance',
  });

  return {
    success: finalGate?.passed === true,
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    tests,
    implementation,
    verification,
    review,
    ciGate,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-185.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue and PR context for #185',
  labels: ['agent-mux', 'live-stack', 'macos', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter agent-mux engineer',
      task: 'Read the GitHub issue/PR context and produce the authoritative native PTY spec.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        `Run: gh issue view ${args.linkedIssueNumber} --json title,body,labels,comments`,
        'The newest user request explicitly rejects bridge-interactive fallback. Treat that as superseding the earlier issue #184 suggested fallback.',
        'Return JSON: { title, labels, rawIssue, rawPr, linkedIssue, comments, affectedComponents, acceptanceCriteria, nonGoals, rejectedApproaches, rootCauseHypothesis, severity }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const readSpecTextTask = defineTask('issue-185.read-spec-text', (args) => ({
  kind: 'shell',
  title: 'Read issue #185 and #184 spec text',
  command: [
    `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
    `gh pr view ${args.issueNumber} --json files,title,body,comments`,
    `gh issue view ${args.linkedIssueNumber} --json title,body,labels,comments`,
  ].join(' && '),
  expectedExitCode: 0,
  labels: ['agent-mux', 'spec', 'shell'],
}));

export const traceNativePtyRuntimeTask = defineTask('issue-185.trace-native-pty-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace native PTY runtime path',
  labels: ['agent-mux', 'runtime-trace', 'root-cause'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Trace the live-stack interactive PTY path and identify the narrowest native macOS ARM64 PTY fix.',
      instructions: [
        'Inspect target files and follow imports/callers before planning changes:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
        `Inspect workflow file: ${args.inputs.ciWorkflowFile}`,
        'Trace the live-stack path from workflow env through pipeline-scenario.test.ts, executePtyCommand, command transcript writing, and evidence validation.',
        'Also trace amux launch bridge-interactive PTY startup and core spawn-runner PTY startup to avoid divergent PTY loading behavior.',
        'No bridge-interactive fallback is allowed for the live-stack interactive path.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specText,
        '---',
        'Return JSON: { rootCause, runtimeCallPaths, liveExecutionFiles, testFiles, ciWorkflowPaths, currentInteractiveCommandShape, nativePtyDesignRecommendation, rejectedOptions, risks, outOfScope }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorNativePtyTestsTask = defineTask('issue-185.author-native-pty-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author native PTY regression tests before implementation',
  labels: ['agent-mux', 'live-stack', 'tests', 'tdd'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Replace fallback-oriented tests with native PTY behavior coverage before implementation changes.',
      instructions: [
        'You own test files only. Do not modify implementation files in this task.',
        'Add deterministic tests that fail if executePtyCommand uses bridge-interactive or non-interactive fallback after node-pty startup failure.',
        'Add coverage for the chosen native PTY launcher/loader behavior without requiring real macOS ARM64 CI hardware or live provider credentials.',
        'Keep existing bridge-interactive tests only where they test the bridge feature directly, not as live-stack fallback.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specText,
        '---',
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, commandsToRun, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementNativePtyFixTask = defineTask('issue-185.implement-native-pty-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement native macOS ARM64 PTY fix attempt ${args.attempt}`,
  labels: ['agent-mux', 'live-stack', 'implementation', 'bugfix'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter agent-mux engineer',
      task: 'Implement native PTY-based interactive support for macOS ARM64 CI runners.',
      instructions: [
        'Remove the live-stack bridge-interactive fallback added by the earlier PR.',
        'Fix node-pty for darwin-arm64 or replace the live-stack PTY executor with a native PTY implementation that preserves real TTY semantics.',
        'Do not convert node-pty startup failures into child-process bridged/non-interactive execution.',
        'Do not weaken or rewrite the tests to match the implementation.',
        'Previous verification JSON:',
        JSON.stringify(args.previousVerification, null, 2),
        'Previous review JSON:',
        JSON.stringify(args.previousReview, null, 2),
        '',
        'SPEC (verbatim):',
        '---',
        args.specText,
        '---',
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Regression test context JSON:',
        JSON.stringify(args.tests, null, 2),
        'Return JSON: { changedFiles, summary, nativePtySemantics, commandShapeBeforeAfter, compatibilityNotes, testsExpectedToPass }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-185.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run issue #185 verification gate attempt ${args.attempt}`,
  labels: ['agent-mux', 'verification', 'quality-gate'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript verification engineer',
      task: 'Run the objective verification and guardrail commands and report exact results.',
      instructions: [
        'Run these commands from repository root. Capture command, exit code, and concise failure output.',
        JSON.stringify([...args.inputs.verificationCommands, ...args.inputs.guardrailCommands], null, 2),
        'The guardrail commands must fail if the live-stack PTY runner still contains fallback or bridge-interactive fallback behavior.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specText,
        '---',
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

export const reviewNativePtyFixTask = defineTask('issue-185.review-native-pty-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review issue #185 native PTY fix attempt ${args.attempt}`,
  labels: ['agent-mux', 'review', 'quality-gate'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'senior TypeScript code reviewer',
      task: 'Review the fix against native PTY requirements and existing live-stack behavior.',
      instructions: [
        'Prioritize behavioral regressions, accidental fallback behavior, lost artifacts/transcripts, timeout/kill handling, platform assumptions, dependency drift, and macOS ARM64 CI feasibility.',
        'Fail the review if primary live-stack interactive execution can silently switch to bridge-interactive/non-interactive fallback.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specText,
        '---',
        'ARTIFACTS (verbatim):',
        '---',
        JSON.stringify({
          runtimeTrace: args.runtimeTrace,
          tests: args.tests,
          implementation: args.implementation,
          verification: args.verification,
        }, null, 2),
        '---',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Return JSON: { approved, findings: [{ severity, file, line, message }], requiredChanges, residualRisks, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewCiImpactTask = defineTask('issue-185.review-ci-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review macOS ARM64 CI impact',
  labels: ['agent-mux', 'github-actions', 'macos', 'quality-gate'],
  agent: {
    name: 'cicd-specialist',
    prompt: {
      role: 'GitHub Actions CI engineer',
      task: 'Assess whether the native PTY fix can work on macOS ARM64 GitHub-hosted runners.',
      instructions: [
        'Inspect workflow and dependency changes. Prefer dependency/build fixes over workflow churn unless CI setup is required for native PTY availability.',
        'No bridge-interactive fallback is allowed for the live-stack interactive path.',
        `Workflow file: ${args.inputs.ciWorkflowFile}`,
        '',
        'SPEC (verbatim):',
        '---',
        args.specText,
        '---',
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Return JSON: { approved, workflowChangesNeeded, findings, ciRisk, recommendedFollowUp, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-185.final-acceptance-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #185',
  labels: ['agent-mux', 'acceptance', 'quality-gate'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior release reviewer',
      task: 'Decide whether the native PTY implementation is ready for PR.',
      instructions: [
        'Pass only if verification passed, review is approved, and live-stack interactive mode no longer uses bridge-interactive/non-interactive fallback for node-pty startup failure.',
        'Changed files must be limited to the traced PTY/runtime/test/CI/dependency paths needed for the fix.',
        '',
        'SPEC (verbatim):',
        '---',
        args.specText,
        '---',
        'ARTIFACTS (verbatim):',
        '---',
        JSON.stringify({
          runtimeTrace: args.runtimeTrace,
          tests: args.tests,
          implementation: args.implementation,
          verification: args.verification,
          review: args.review,
          ciGate: args.ciGate,
          attempts: args.attempts,
        }, null, 2),
        '---',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Return JSON: { passed, changedFiles, acceptanceSummary, qualityGates, residualRisks, prSummary }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
