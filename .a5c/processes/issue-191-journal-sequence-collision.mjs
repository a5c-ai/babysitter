/**
 * @process repo/issue-191-journal-sequence-collision
 * @description Plan and execute the fix for issue #191 / duplicate #120: concurrent journal appends must not allocate duplicate sequence numbers when non-interactive breakpoints auto-approve back-to-back.
 * @inputs { issueNumber: number, duplicateOfIssue: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - library/methodologies/atdd-tdd/atdd-tdd.js
 * - library/specializations/sdk-platform-development/sdk-testing-strategy.js
 * - library/specializations/sdk-platform-development/error-handling-debugging-support.js
 * - library/specializations/sdk-platform-development/compatibility-testing.js
 * - library/specializations/qa-testing-automation/quality-gates.js
 *
 * @agent platform-architect library/specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-coverage-analyzer library/specializations/sdk-platform-development/agents/test-coverage-analyzer/AGENT.md
 * @agent compatibility-auditor library/specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 * @agent test-strategy-architect library/specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent error-message-reviewer library/specializations/sdk-platform-development/agents/error-message-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-191.read-issue-context',
  });

  const runtimeTrace = await ctx.task(traceJournalSequenceRuntimeTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-191.trace-journal-runtime',
  });

  const fixDesign = await ctx.task(designJournalSerializationTask, {
    inputs,
    issueContext,
    runtimeTrace,
  }, {
    key: 'issue-191.design-journal-serialization',
  });

  if (fixDesign?.needsMaintainerDecision) {
    await ctx.breakpoint({
      title: 'Issue #191 Journal Semantics Need Decision',
      question: fixDesign.question,
      options: ['Proceed with recommended append serialization', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-191', 'journal-sequence'],
      context: {
        runId: ctx.runId,
        issueNumber: inputs.issueNumber,
        duplicateOfIssue: inputs.duplicateOfIssue,
        fixDesign,
      },
    });
  }

  const regressionTests = await ctx.task(authorJournalRegressionTestsTask, {
    inputs,
    issueContext,
    runtimeTrace,
    fixDesign,
  }, {
    key: 'issue-191.author-regression-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementJournalSequenceFixTask, {
      inputs,
      issueContext,
      runtimeTrace,
      fixDesign,
      regressionTests,
      attempt,
      previousVerification: verification,
      previousReview: review,
    }, {
      key: `issue-191.implementation.${attempt}`,
    });

    verification = await ctx.task(runJournalVerificationGateTask, {
      inputs,
      issueContext,
      runtimeTrace,
      fixDesign,
      regressionTests,
      implementation,
      attempt,
    }, {
      key: `issue-191.verification.${attempt}`,
    });

    review = await ctx.task(reviewJournalFixTask, {
      inputs,
      issueContext,
      runtimeTrace,
      fixDesign,
      regressionTests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-191.review.${attempt}`,
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
    fixDesign,
    regressionTests,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-191.final-acceptance',
  });

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'runtime-trace',
      'serialization-design',
      'regression-tests',
      'implementation-loop',
      'verification',
      'compatibility-review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    fixDesign,
    regressionTests,
    implementation,
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-191.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #191 and duplicate tracker #120',
  labels: ['sdk', 'runtime', 'journal', 'research', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK runtime engineer',
      task: 'Read the GitHub issues and produce the authoritative implementation spec for this run.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Issue #${args.issueNumber} is labeled duplicate and points to #${args.duplicateOfIssue}; run: gh issue view ${args.duplicateOfIssue} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Use the issue body, all comments, labels, and the duplicate tracker as the source of truth. Keep raw issue/comment text in the output so downstream tasks can compare against it directly.',
        'Distinguish the two reported root-cause hypotheses: PROCESS_LOG logSeq=-1 from #120 and appendEvent sequence allocation races from #191.',
        'Return JSON: { title, labels, rawIssue, comments, duplicateIssue, acceptanceCriteria, implementationHints, nonGoals, severity, targetFilesFromIssue }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceJournalSequenceRuntimeTask = defineTask('issue-191.trace-journal-sequence-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace journal sequence allocation and non-interactive breakpoint logging',
  labels: ['sdk', 'runtime', 'journal', 'root-cause'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior SDK runtime engineer',
      task: 'Trace the live runtime path that can produce duplicate journal sequence numbers.',
      instructions: [
        'Work from the issue context below and inspect the current codebase before proposing changes.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Inspect these likely files first, then follow imports and callers as needed:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
        'Trace appendEvent from sequence discovery through writeFileAtomic, readRunHarness, session stamping, checksum generation, and loadJournal ordering.',
        'Trace ctx.breakpoint in nonInteractive mode, including runBreakpointIntrinsic, InternalProcessContext.logSeq, recordedLogSeqs, state/logSeqs.txt, replay engine initialization, and PROCESS_LOG shape.',
        'Confirm whether the current branch already contains a partial logSeq fix and whether that fix addresses #120 only, #191 only, or neither under concurrent append pressure.',
        'Inspect storage/lock.ts and existing run-lock usage, but do not assume it covers concurrent appendEvent calls within one iteration.',
        'Identify test helper patterns for temporary run directories, appendEvent/loadJournal, EffectIndex validation, and minimal process replay/iteration tests.',
        'Return JSON: { rootCause, duplicateTrackerStatus, runtimeCallPaths, liveExecutionFiles, testFiles, existingPartialFixes, appendRaceWindow, lockOptions, risks, outOfScope }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designJournalSerializationTask = defineTask('issue-191.design-journal-serialization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design journal append serialization semantics',
  labels: ['sdk', 'runtime', 'journal', 'design'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior runtime design engineer',
      task: 'Design the smallest robust fix for journal sequence collisions.',
      instructions: [
        'Use issue context and runtime trace as constraints.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Prefer a minimal append-level serialization strategy that makes allocate-then-write atomic per run directory. A per-run in-memory promise queue/mutex around appendEvent is expected to be the default unless the trace proves cross-process writes are in scope.',
        'Compare this to alternatives from the issue: deriving numeric sequence on replay, forgiving duplicate sequences in EffectIndex, or relying only on PROCESS_LOG logSeq. Explain why rejected options are less appropriate for this fix.',
        'The design must preserve existing journal filename shape, checksum semantics, harness/session stamping, loadJournal order, EffectIndex strict sequence validation, and replay determinism.',
        'If a stale per-run mutex map is introduced, include cleanup or bounded lifecycle semantics so long-lived processes do not leak unbounded run keys.',
        'If the current branch already includes a PROCESS_LOG logSeq fix, preserve it and only adjust it if the trace shows it is required for the append serialization fix.',
        'If there is a real product or compatibility ambiguity, set needsMaintainerDecision true and provide one precise question. Otherwise set it false.',
        'Return JSON: { recommendedDesign, appendSerializationStrategy, rejectedAlternatives, logSeqCompatibility, cleanupSemantics, replaySemantics, testPlan, risks, needsMaintainerDecision, question }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorJournalRegressionTestsTask = defineTask('issue-191.author-journal-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author journal collision regression tests before implementation',
  labels: ['sdk', 'runtime', 'journal', 'tests', 'tdd'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add failing regression coverage for issue #191 before implementation changes.',
      instructions: [
        'You own test files only. Do not modify implementation files in this task.',
        'Use the issue context, runtime trace, and design JSON below as the spec source.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Fix design JSON:',
        JSON.stringify(args.fixDesign, null, 2),
        'Add a storage-level regression that drives multiple appendEvent calls for the same run concurrently and asserts the resulting journal files have contiguous unique sequence numbers and loadJournal succeeds in strict order.',
        'Add or preserve focused coverage for non-interactive back-to-back breakpoints producing distinct PROCESS_LOG metadata without weakening current breakpointSkip tests.',
        'Where practical, add an integration-style regression for a minimal process with two consecutive ctx.breakpoint calls in non-interactive mode, then assert a subsequent status/replay path reports completed and does not append a phantom RUN_FAILED.',
        'Tests must avoid arbitrary sleeps and should use deterministic barriers/mocks where needed to expose the allocate-then-write race.',
        'The initial regression should fail against the current un-serialized appendEvent behavior or clearly document why an existing partial fix already masks the original symptom.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, commandsToRun, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementJournalSequenceFixTask = defineTask('issue-191.implement-journal-sequence-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement journal sequence fix attempt ${args.attempt}`,
  labels: ['sdk', 'runtime', 'journal', 'implementation', 'bugfix'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK runtime engineer',
      task: 'Implement the focused issue #191 journal sequence fix.',
      instructions: [
        'You own SDK journal/runtime implementation files. Do not weaken or rewrite the regression tests to fit the implementation.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Fix design JSON:',
        JSON.stringify(args.fixDesign, null, 2),
        'Regression test result/context JSON:',
        JSON.stringify(args.regressionTests, null, 2),
        'Previous verification JSON:',
        JSON.stringify(args.previousVerification, null, 2),
        'Previous review JSON:',
        JSON.stringify(args.previousReview, null, 2),
        'Implement a localized append serialization fix so sequence allocation and journal write are atomic per run directory.',
        'Keep appendEvent public behavior stable: same return shape, same file naming, same checksums, same event payload stamping, same loadJournal sorting expectations.',
        'Preserve EffectIndex strict validation. Do not mask duplicate sequence numbers by weakening replay validation unless the design task explicitly escalated and received approval.',
        'Preserve existing non-interactive breakpoint logSeq behavior unless the trace proves a narrowly-scoped adjustment is required.',
        'Keep changes limited to journal storage, directly related runtime context/breakpoint code if required, and tests.',
        'Return JSON: { changedFiles, summary, serializationSemantics, compatibilityNotes, testsExpectedToPass }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runJournalVerificationGateTask = defineTask('issue-191.run-journal-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run journal verification gate attempt ${args.attempt}`,
  labels: ['sdk', 'runtime', 'journal', 'verification', 'quality-gate'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior SDK verification engineer',
      task: 'Run the objective verification commands and report exact results.',
      instructions: [
        'Run the commands below from the repository root. Do not skip failing checks; capture command, exit code, and concise failure output.',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'At minimum, verify the targeted storage and breakpoint/runtime tests first, then the broader SDK build/test commands supplied in inputs.',
        'Inspect the resulting journal files for the regression run and confirm sequence numbers are contiguous, unique, and replay/status does not write a phantom RUN_FAILED after RUN_COMPLETED.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Implementation summary JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Return JSON: { passed, commands: [{ command, exitCode, passed, summary }], journalEvidence, failures, changedFilesObserved, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewJournalFixTask = defineTask('issue-191.review-journal-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review issue #191 fix attempt ${args.attempt}`,
  labels: ['sdk', 'runtime', 'journal', 'review', 'quality-gate'],
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'senior SDK compatibility reviewer',
      task: 'Review the fix against journal/replay invariants and the issue requirements.',
      instructions: [
        'Review the diff, tests, and verification result. Prioritize replay determinism, journal ordering, concurrency behavior, compatibility with existing run locks, and false completed/failed status risks.',
        'Compare the issue context directly to the artifacts. Do not substitute the implementation summary for the issue requirements.',
        'Confirm the fix addresses both issue #191 and duplicate tracker #120 boundaries without introducing a broad replay-validator forgiveness path.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Runtime trace JSON:',
        JSON.stringify(args.runtimeTrace, null, 2),
        'Fix design JSON:',
        JSON.stringify(args.fixDesign, null, 2),
        'Regression tests JSON:',
        JSON.stringify(args.regressionTests, null, 2),
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

export const finalAcceptanceGateTask = defineTask('issue-191.final-acceptance-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #191',
  labels: ['sdk', 'runtime', 'journal', 'acceptance', 'quality-gate'],
  agent: {
    name: 'error-message-reviewer',
    prompt: {
      role: 'senior SDK release reviewer',
      task: 'Decide whether the issue #191 implementation is ready for PR.',
      instructions: [
        'Check that the final implementation satisfies the issue context, passes verification, and has no blocking review findings.',
        'Confirm the changed files are limited to journal storage, directly related runtime/breakpoint code if justified by the trace, tests, and any necessary docs.',
        'Confirm no unrelated source changes were introduced.',
        'Confirm the PR summary should mention issue #191 and duplicate tracker #120.',
        'Inputs JSON:',
        JSON.stringify({
          issueContext: args.issueContext,
          runtimeTrace: args.runtimeTrace,
          fixDesign: args.fixDesign,
          regressionTests: args.regressionTests,
          implementation: args.implementation,
          verification: args.verification,
          review: args.review,
          attempts: args.attempts,
        }, null, 2),
        'Return JSON: { passed, changedFiles, acceptanceSummary, qualityGates, residualRisks, prSummary }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
