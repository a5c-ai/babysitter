/**
 * @process repo/issue-138-session-resume-state-dir-normalization
 * @description Fix issue #138: session:resume must write the resumed session binding to the hook-readable canonical state directory.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object }
 *
 * References used while authoring:
 * - cradle/bugfix.js
 * - babysitter/tdd-quality-convergence.js
 * - specializations/sdk-platform-development/cli-tool-development.js
 * - specializations/sdk-platform-development/references.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-138.read-issue-context',
  });

  const stateDirTrace = await ctx.task(traceStateDirResolutionTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-138.trace-state-dir-resolution',
  });

  const regressionTests = await ctx.task(authorRegressionTestsTask, {
    inputs,
    issueContext,
    stateDirTrace,
  }, {
    key: 'issue-138.author-regression-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementFocusedFixTask, {
      inputs,
      issueContext,
      stateDirTrace,
      regressionTests,
      attempt,
      previousVerification: verification,
      previousReview: review,
    }, {
      key: `issue-138.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      stateDirTrace,
      regressionTests,
      implementation,
      attempt,
    }, {
      key: `issue-138.verification.${attempt}`,
    });

    review = await ctx.task(reviewFixTask, {
      inputs,
      issueContext,
      stateDirTrace,
      regressionTests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-138.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    stateDirTrace,
    regressionTests,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-138.final-acceptance',
  });

  if (finalGate?.needsHumanDecision) {
    await ctx.breakpoint({
      title: 'Issue #138 State Directory Semantics Need Decision',
      question: finalGate.question,
      options: ['Use recommended canonical semantics', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-138', 'state-dir-semantics'],
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
      'state-dir-resolution-trace',
      'regression-tests',
      'focused-implementation',
      'verification-loop',
      'review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    affectedCallPaths: stateDirTrace?.affectedCallPaths ?? [],
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-138.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #138 and comments',
  labels: ['sdk', 'cli', 'research', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK CLI engineer',
      task: 'Read the GitHub issue and produce the authoritative bug spec for this run.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} resolves to a PR instead of an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Use the issue body, comments, and labels as the source of truth. Pay close attention to recurrence comments about explicit --state-dir .a5c, HOME/.a5c, missing state/ subdir, and empty run_id in the canonical file.',
        'Return JSON: { title, labels, rawIssue, comments, severity, acceptanceCriteria, nonGoals, relatedIssues, targetFilesFromIssue }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceStateDirResolutionTask = defineTask('issue-138.trace-state-dir-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace session state-dir resolution and hook reader paths',
  labels: ['sdk', 'cli', 'harness', 'root-cause'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior SDK runtime engineer',
      task: 'Trace current session:resume writer behavior against hook/session reader behavior before code changes.',
      instructions: [
        'Work from the issue context below and inspect the current codebase.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Inspect these likely files first, then follow imports/callers as needed:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
        'Compare session:resume, shared session command resolution, session:init, session:associate, BaseAdapter/custom/unified adapter state-dir normalization, stop-hook/session-binding readers, and normalizeSessionStateDir.',
        'Identify the compatibility boundary between root-style inputs that should normalize to <root>/state and custom leaf directories that should remain direct state directories.',
        'Check docs and skill examples for session:resume --state-dir .a5c and decide whether code normalization alone makes them correct or whether docs also need updates.',
        'Return JSON: { rootCause, affectedCallPaths, readerWriterMismatch, compatibleSemantics, targetImplementationFiles, testFiles, docsFiles, risks, outOfScope }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionTestsTask = defineTask('issue-138.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author regression tests before implementation',
  labels: ['sdk', 'cli', 'tests', 'tdd'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add failing regression coverage for issue #138 before implementation changes.',
      instructions: [
        'You own test files only. Do not modify implementation files in this task.',
        'Use the issue context JSON and state-dir trace JSON below as the spec source.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'State-dir trace JSON:',
        JSON.stringify(args.stateDirTrace, null, 2),
        'Add targeted coverage in packages/sdk/src/cli/commands/session/__tests__/resume.test.ts for explicit --state-dir values that represent the configured global root and for relative .a5c when it is the configured global root.',
        'The regression must fail against current behavior where handleSessionResume writes <root>/<sessionId>.md instead of <root>/state/<sessionId>.md for explicit root-style stateDir input.',
        'Preserve coverage proving intentionally custom leaf state directories still write directly to that leaf, unless the issue context or maintainer guidance explicitly requires deprecating custom leaves.',
        'If shared session command normalization is changed, add or update lifecycle tests for session:init, session:associate, session:state, session:update, and session:check-iteration as needed.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, commandsToRun, compatibilityCoverage, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementFocusedFixTask = defineTask('issue-138.implement-focused-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement session state-dir fix attempt ${args.attempt}`,
  labels: ['sdk', 'cli', 'implementation', 'bugfix'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK CLI engineer',
      task: 'Implement the focused issue #138 fix.',
      instructions: [
        'You own SDK CLI/session state-dir implementation files and any directly related docs. Do not weaken or rewrite regression tests to fit the implementation.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'State-dir trace JSON:',
        JSON.stringify(args.stateDirTrace, null, 2),
        'Regression test result/context JSON:',
        JSON.stringify(args.regressionTests, null, 2),
        'Previous verification JSON:',
        JSON.stringify(args.previousVerification, null, 2),
        'Previous review JSON:',
        JSON.stringify(args.previousReview, null, 2),
        'Route session:resume state-dir resolution through the canonical normalizer used by hooks/adapters, likely normalizeSessionStateDir(...), instead of using explicit args.stateDir directly.',
        'Prefer updating shared session command resolution if the trace shows other session commands can produce the same reader/writer mismatch. Keep the change localized and compatible with existing custom leaf-dir tests.',
        'Ensure JSON and human output report the actual canonical file path that was written.',
        'Do not change unrelated run directory resolution, journal replay, hooks-mux behavior, or run lifecycle semantics.',
        'Return JSON: { changedFiles, summary, normalizationSemantics, compatibilityNotes, docsUpdated, testsExpectedToPass }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-138.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run SDK verification gate attempt ${args.attempt}`,
  labels: ['sdk', 'cli', 'verification', 'quality-gate'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior SDK verification engineer',
      task: 'Run the objective verification commands and report exact results.',
      instructions: [
        'Run the commands below from the repository root. Do not skip failing checks; capture command, exit code, and concise failure output.',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'At minimum, verify the targeted session resume tests first, then the broader SDK build/test commands supplied in inputs.',
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

export const reviewFixTask = defineTask('issue-138.review-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review issue #138 fix attempt ${args.attempt}`,
  labels: ['sdk', 'cli', 'review', 'quality-gate'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior SDK compatibility reviewer',
      task: 'Review the fix against issue #138 and existing hook/session state-dir behavior.',
      instructions: [
        'Review the diff, tests, and verification result. Prioritize behavioral regressions, CLI compatibility, path normalization correctness, Windows/path.resolve edge cases, and hook reader/writer agreement.',
        'Compare the issue context directly to the artifacts. Do not substitute the implementation summary for the issue requirements.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'State-dir trace JSON:',
        JSON.stringify(args.stateDirTrace, null, 2),
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

export const finalAcceptanceGateTask = defineTask('issue-138.final-acceptance-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #138',
  labels: ['sdk', 'cli', 'acceptance', 'quality-gate'],
  agent: {
    name: 'error-message-reviewer',
    prompt: {
      role: 'senior SDK release reviewer',
      task: 'Decide whether the issue #138 implementation is ready for PR.',
      instructions: [
        'Check that the final implementation satisfies the issue context, passes verification, and has no blocking review findings.',
        'Confirm session:resume writes the canonical hook-readable path for explicit root-style --state-dir values and that reported stateFile matches the written file.',
        'Confirm custom leaf-dir behavior is either preserved or explicitly justified with maintainer guidance.',
        'Confirm changed files are limited to SDK session state-dir resolution, targeted tests, and any necessary docs updates.',
        'If the root-vs-leaf state-dir semantic remains ambiguous or risky, set needsHumanDecision true and provide a precise question.',
        'Inputs JSON:',
        JSON.stringify({
          issueContext: args.issueContext,
          stateDirTrace: args.stateDirTrace,
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
