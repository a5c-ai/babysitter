/**
 * @process repo/issue-574-typed-ctx-halt
 * @description Implement typed ctx.halt() and RUN_HALTED lifecycle semantics for honest early exits.
 * @inputs { issueNumber: number, baseBranch: string, targetFiles: string[], docsTargets: string[], qualityCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], lifecycleContract: object, verification: object, review: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - No existing ctx.halt(), RUN_HALTED, or halted observed-state surface was found.
 * - Existing completion/failure terminal behavior lives in packages/sdk/src/runtime/orchestrateIteration.ts.
 * - Existing lifecycle derivation lives in packages/sdk/src/runtime/runLifecycleState.ts and packages/sdk/src/cli/main/runState.ts.
 * - Existing completion-proof CLI/status behavior lives in packages/sdk/src/cli/main/runInspection.ts and packages/sdk/src/cli/commands/runIterate.ts.
 * - Related prior process: .a5c/processes/issue-181-run-completed-idempotency.mjs.
 * - Matching process-library methodologies: systematic debugging, test-driven development, verification-before-completion, V-model traceability.
 *
 * This process intentionally uses agent tasks rather than shell tasks to respect
 * this repository's process-authoring override for direct Babysitter workflows.
 *
 * @process methodologies/superpowers/systematic-debugging
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/v-model
 * @process repo/sdk-runtime-bugfix
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_MAX_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 574;
  const issueContext = {
    issueNumber,
    title: inputs?.title,
    labels: inputs?.labels ?? [],
    issueBody: inputs?.issueBody,
    comments: inputs?.comments ?? [],
    acceptanceCriteria: inputs?.acceptanceCriteria ?? [],
    nonGoals: inputs?.nonGoals ?? [],
  };

  const reuseAudit = await ctx.task(reuseAuditTask, {
    issueContext,
    targetFiles: inputs?.targetFiles ?? [],
    docsTargets: inputs?.docsTargets ?? [],
    relatedProcesses: inputs?.relatedProcesses ?? [],
  }, { key: 'issue-574.reuse-audit' });

  const lifecycleContract = await ctx.task(designLifecycleContractTask, {
    issueContext,
    reuseAudit,
    targetFiles: inputs?.targetFiles ?? [],
    docsTargets: inputs?.docsTargets ?? [],
  }, { key: 'issue-574.lifecycle-contract' });

  if (lifecycleContract?.requiresMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #574 Halt Lifecycle Contract Decision',
      question: lifecycleContract.question ?? 'Confirm the public ctx.halt and RUN_HALTED contract before implementation continues.',
      options: ['Proceed with recommended contract', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-574', 'api-contract'],
      context: {
        runId: ctx.runId,
        lifecycleContract,
      },
    });
  }

  const regressionPlan = await ctx.task(authorRegressionTestsTask, {
    issueContext,
    reuseAudit,
    lifecycleContract,
    testTargets: inputs?.testTargets ?? [],
  }, { key: 'issue-574.regression-tests' });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];
  const maxAttempts = inputs?.maxVerificationAttempts ?? DEFAULT_MAX_ATTEMPTS;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    implementation = await ctx.task(implementHaltLifecycleTask, {
      issueContext,
      reuseAudit,
      lifecycleContract,
      regressionPlan,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, { key: `issue-574.implementation.${attempt}` });

    verification = await ctx.task(runQualityGateTask, {
      issueContext,
      lifecycleContract,
      regressionPlan,
      implementation,
      qualityCommands: inputs?.qualityCommands ?? [],
      attempt,
    }, { key: `issue-574.quality-gate.${attempt}` });

    review = await ctx.task(reviewHaltLifecycleTask, {
      issueContext,
      lifecycleContract,
      regressionPlan,
      implementation,
      verification,
      attempt,
    }, { key: `issue-574.review.${attempt}` });

    attempts.push({ attempt, implementation, verification, review });

    if (
      verification?.passed === true &&
      verification?.haltedInvariantVerified === true &&
      review?.approved === true
    ) {
      break;
    }
  }

  if (
    verification?.passed !== true ||
    verification?.haltedInvariantVerified !== true ||
    review?.approved !== true
  ) {
    await ctx.breakpoint({
      title: 'Issue #574 Final Gate Did Not Pass',
      question: 'The typed halt lifecycle implementation did not pass verification and review within the configured attempts. Review the failures before continuing?',
      options: ['Retry with reviewer feedback', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['quality-gate', 'issue-574'],
      context: {
        runId: ctx.runId,
        verification,
        review,
        attempts: attempts.length,
      },
    });
  }

  const finalAcceptance = await ctx.task(finalAcceptanceTask, {
    issueContext,
    lifecycleContract,
    regressionPlan,
    implementation,
    verification,
    review,
    attempts,
  }, { key: 'issue-574.final-acceptance' });

  return {
    success: finalAcceptance?.passed === true,
    phases: [
      'reuse-audit-and-runtime-map',
      'halt-lifecycle-contract',
      'red-regression-tests',
      'implementation-loop',
      'cli-harness-docs-integration',
      'quality-gate',
      'review',
      'final-acceptance',
    ],
    changedFiles: finalAcceptance?.changedFiles ?? verification?.changedFiles ?? implementation?.changedFiles ?? [],
    lifecycleContract,
    regressionPlan,
    implementation,
    verification,
    review,
    attempts,
    finalAcceptance,
  };
}

export const reuseAuditTask = defineTask('issue-574.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map issue #574 runtime surfaces and reusable patterns',
  labels: ['issue-574', 'sdk', 'runtime', 'research', 'reuse-audit'],
  agent: {
    name: 'sdk-runtime-researcher',
    prompt: {
      role: 'senior Babysitter SDK runtime engineer',
      task: 'Perform the Phase 0 reuse audit and codebase research for typed ctx.halt().',
      instructions: [
        `Run: gh issue view ${args.issueContext?.issueNumber ?? 574} --json title,body,labels,comments`,
        `Confirm it is not a PR with: gh pr view ${args.issueContext?.issueNumber ?? 574} --json files,title,body,comments`,
        'Read the issue body, all comments, and labels carefully. Treat them as the source of truth.',
        'Render "Reuse-audit findings (REVIEW BEFORE PROCEEDING)" before any implementation plan details.',
        'Inspect existing process-library matches under library/methodologies and library/processes/shared, especially systematic-debugging, test-driven-development, verification-before-completion, V-model, and issue #181 runtime-bugfix patterns.',
        'Inspect the current SDK runtime, CLI, harness, tests, and docs surfaces listed below, then follow imports/exports as needed.',
        'Identify all places where RUN_COMPLETED/RUN_FAILED, completionProof, terminal state, or IterationResult status assumptions must be updated for RUN_HALTED.',
        'Explicitly confirm there is no existing ctx.halt/RUN_HALTED implementation to reuse, or list it if found.',
        'Do not edit files in this phase.',
        'Return JSON: { issueSummary, commentsSummary, labels, reuseAuditFindings, runtimeMap, cliMap, harnessMap, docsMap, testMap, targetFiles, risks }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        `TARGET FILES: ${JSON.stringify(args.targetFiles ?? [], null, 2)}`,
        `DOCS TARGETS: ${JSON.stringify(args.docsTargets ?? [], null, 2)}`,
        `RELATED PROCESSES: ${JSON.stringify(args.relatedProcesses ?? [], null, 2)}`,
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['reuseAuditFindings', 'runtimeMap', 'cliMap', 'testMap', 'risks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designLifecycleContractTask = defineTask('issue-574.lifecycle-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design ctx.halt and RUN_HALTED contract',
  labels: ['issue-574', 'sdk', 'api-design', 'runtime', 'lifecycle'],
  agent: {
    name: 'sdk-runtime-architect',
    prompt: {
      role: 'senior SDK API architect',
      task: 'Define the minimal public and internal contract for typed process halts.',
      instructions: [
        'Use the issue context and reuse audit as the acceptance spec.',
        'Design ctx.halt(reason: string, payload?: object) as a typed early-exit API distinct from a normal process return.',
        'Prefer a typed internal RunHaltedError/sentinel path so `return ctx.halt(...)` cannot be confused with normal output.',
        'Specify event data for RUN_HALTED: reason, optional payload, and any phase/calling metadata that can be captured reliably.',
        'Specify IterationResult, observed run state, replay terminal handling, effect index, run:status JSON/text, run:iterate JSON/text, harness hook run-state summaries, and runtime hook behavior.',
        'Require halted runs to have no completionProof and to be non-success in CLI exit behavior. Completed runs must keep completionProof behavior unchanged.',
        'Specify backward compatibility: legacy normal return objects with halt: true record RUN_HALTED, emit a one-line deprecation warning to stderr, preserve useful fields in payload, and do not record fake RUN_COMPLETED.',
        'Scope broad static analysis/output-schema inference as a follow-up unless a narrow outputSchema boundary check already exists and can be wired safely.',
        'Define migration notes and docs changes.',
        'If any public contract choice is ambiguous or breaking, set requiresMaintainerDecision=true and include a concrete question.',
        'Return JSON: { apiContract, eventContract, cliContract, harnessContract, legacyMigration, docsPlan, nonGoals, requiresMaintainerDecision, question, acceptanceTests, riskMitigations }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'REUSE AUDIT:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['apiContract', 'eventContract', 'cliContract', 'legacyMigration', 'acceptanceTests', 'nonGoals'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionTestsTask = defineTask('issue-574.regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing halt lifecycle regression tests',
  labels: ['issue-574', 'sdk', 'tdd', 'phase:red', 'tests'],
  agent: {
    name: 'sdk-runtime-test-author',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add focused failing regression tests for issue #574 before production code changes.',
      instructions: [
        'Follow TDD: write tests first and verify they fail for the issue-specific reason before implementation.',
        'Cover ctx.halt("phase-0", { reason: "invalid-input" }) producing RUN_HALTED and an IterationResult/status of halted with reason and payload.',
        'Cover run:status --json reporting state="halted", reason, payload, and completionProof=null.',
        'Cover run:iterate and CLI command handling: halted must not be reported as completed and must produce non-zero CLI exit behavior where the CLI command is used as a process result.',
        'Cover normal successful return still produces RUN_COMPLETED, state="completed", and completionProof.',
        'Cover legacy return { success: false, halt: true, phase, error } records RUN_HALTED, emits a deprecation warning, and does not write RUN_COMPLETED or completionProof.',
        'Cover terminal replay of a halted run: no duplicate RUN_HALTED and no process re-execution when no pending effects remain.',
        'Update type-level tests or compile checks so ProcessContext exposes ctx.halt with the intended return type.',
        'Prefer existing SDK test suites before creating new test scaffolding. Do not skip or weaken existing tests.',
        'Return JSON: { testFiles, testNames, redVerified, redCommands, redOutputSummary, failureMatchesIssue, coverageMatrix }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'LIFECYCLE CONTRACT:',
        JSON.stringify(args.lifecycleContract ?? {}, null, 2),
        '',
        `TEST TARGETS: ${JSON.stringify(args.testTargets ?? [], null, 2)}`,
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['testFiles', 'testNames', 'redVerified', 'coverageMatrix'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementHaltLifecycleTask = defineTask('issue-574.implement-halt-lifecycle', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement typed halt lifecycle',
  labels: ['issue-574', 'sdk', 'runtime', 'implementation', 'phase:green'],
  agent: {
    name: 'sdk-runtime-implementer',
    prompt: {
      role: 'senior Babysitter SDK engineer',
      task: 'Implement the typed ctx.halt lifecycle while preserving existing completion and failure behavior.',
      instructions: [
        'Make the red tests pass with the smallest coherent runtime/API change.',
        'Add ctx.halt(reason, payload?) to ProcessContext and createProcessContext. Validate reason is a non-empty string and payload is object-like or undefined according to the agreed contract.',
        'Use a typed internal halt path, such as RunHaltedError, that orchestrateIteration can distinguish from process errors and RunFailedError.',
        'Append RUN_HALTED with the agreed event payload. Rebuild state cache after halted terminal events with an explicit halt reason.',
        'Update terminal replay to return halted state and never require outputRef or completionProof for halted runs.',
        'Update lifecycle derivation and effect-index terminal handling to recognize RUN_HALTED.',
        'Update CLI run:status and run:iterate JSON/text contracts to expose halted reason/payload and not expose completionProof.',
        'Make CLI exit behavior distinguish halted from completed. Do not change failed/process-error behavior beyond what is required for halt support.',
        'Update harness hook run-state summaries and any completion-proof messaging so halted runs do not prompt agents for completionProof.',
        'Implement legacy { halt: true } detection on normal process return as a deprecation migration path that records RUN_HALTED instead of RUN_COMPLETED.',
        'Keep broad static analysis/schema inference out of this implementation unless the lifecycle contract explicitly approved a narrow, low-risk addition.',
        'Update docs listed in the docs plan, especially library/reference/sdk.md Process function exit conventions.',
        'Run the narrow regression tests and report results.',
        'Return JSON: { changedFiles, summary, testResults, haltedBehavior, legacyMigrationBehavior, docsUpdated, remainingRisks }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'REUSE AUDIT:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
        '',
        'LIFECYCLE CONTRACT:',
        JSON.stringify(args.lifecycleContract ?? {}, null, 2),
        '',
        'REGRESSION PLAN:',
        JSON.stringify(args.regressionPlan ?? {}, null, 2),
        '',
        'PREVIOUS VERIFICATION:',
        JSON.stringify(args.previousVerification ?? null, null, 2),
        '',
        'PREVIOUS REVIEW:',
        JSON.stringify(args.previousReview ?? null, null, 2),
        `ATTEMPT: ${args.attempt}`,
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'summary', 'testResults', 'haltedBehavior'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runQualityGateTask = defineTask('issue-574.quality-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify typed halt lifecycle quality gates',
  labels: ['issue-574', 'sdk', 'verification', 'quality-gate'],
  agent: {
    name: 'sdk-runtime-verifier',
    prompt: {
      role: 'senior SDK runtime verifier',
      task: 'Run and interpret quality gates for issue #574.',
      instructions: [
        'Run the listed quality commands from the repository root.',
        'Confirm red-phase evidence exists and that the same tests now pass.',
        'Confirm the journal contains RUN_HALTED, not RUN_COMPLETED, for ctx.halt and legacy halt:true early exits.',
        'Confirm run:status --json reports halted with reason/payload and completionProof=null.',
        'Confirm completed runs still expose completionProof and failed/process-error runs keep existing behavior.',
        'Confirm run:iterate CLI behavior returns non-zero for halted terminal results while normal completion returns zero.',
        'Confirm terminal replay of halted runs is idempotent and does not re-execute process code.',
        'Inspect the final diff for accidental implementation of broad static-analysis/schema-inference follow-up work.',
        'Return JSON: { passed, commands, failures, changedFiles, haltedInvariantVerified, completionProofInvariantVerified, cliExitInvariantVerified, docsVerified, notes }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'LIFECYCLE CONTRACT:',
        JSON.stringify(args.lifecycleContract ?? {}, null, 2),
        '',
        'REGRESSION PLAN:',
        JSON.stringify(args.regressionPlan ?? {}, null, 2),
        '',
        'IMPLEMENTATION:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        '',
        `QUALITY COMMANDS: ${JSON.stringify(args.qualityCommands ?? [], null, 2)}`,
        `ATTEMPT: ${args.attempt}`,
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'commands', 'haltedInvariantVerified', 'completionProofInvariantVerified', 'cliExitInvariantVerified'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewHaltLifecycleTask = defineTask('issue-574.review-halt-lifecycle', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review halt lifecycle implementation',
  labels: ['issue-574', 'sdk', 'code-review', 'runtime'],
  agent: {
    name: 'sdk-runtime-reviewer',
    prompt: {
      role: 'senior SDK runtime code reviewer',
      task: 'Review issue #574 changes against the issue spec and lifecycle contract.',
      instructions: [
        'Lead with blocking findings, each with file and line references.',
        'Verify ctx.halt is typed and cannot be mistaken for a successful process output.',
        'Verify RUN_HALTED is a first-class terminal lifecycle state across replay, effect indexing, status, CLI, hooks, tests, and docs.',
        'Verify no halted path writes outputRef as a completion artifact or exposes completionProof.',
        'Verify legacy halt:true migration preserves useful payload data and emits a deprecation warning without fake RUN_COMPLETED.',
        'Verify terminal replay remains deterministic and idempotent for completed, failed, and halted runs.',
        'Verify existing public completed/failed behavior and tests remain compatible unless the issue explicitly changed them.',
        'Verify broad static analysis was not slipped into the core halt fix.',
        'Return JSON: { approved, blockingIssues, nonBlockingSuggestions, specCoverage, riskAssessment, finalSummary }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'LIFECYCLE CONTRACT:',
        JSON.stringify(args.lifecycleContract ?? {}, null, 2),
        '',
        'REGRESSION PLAN:',
        JSON.stringify(args.regressionPlan ?? {}, null, 2),
        '',
        'IMPLEMENTATION:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        '',
        'VERIFICATION:',
        JSON.stringify(args.verification ?? {}, null, 2),
        `ATTEMPT: ${args.attempt}`,
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'blockingIssues', 'specCoverage', 'finalSummary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceTask = defineTask('issue-574.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Finalize issue #574 acceptance evidence',
  labels: ['issue-574', 'sdk', 'final-acceptance'],
  agent: {
    name: 'sdk-runtime-acceptance',
    prompt: {
      role: 'senior release verifier',
      task: 'Produce final acceptance evidence for issue #574.',
      instructions: [
        'Summarize the phases completed, changed files, and quality-gate evidence.',
        'Confirm each acceptance criterion from the issue and lifecycle contract is addressed or explicitly deferred.',
        'List any follow-up issue recommended for static analysis/output-schema validation.',
        'Confirm no unrelated files were modified.',
        'Return JSON: { passed, changedFiles, acceptanceMatrix, deferredFollowUps, qualityEvidence, finalSummary }.',
        '',
        'ISSUE CONTEXT:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'LIFECYCLE CONTRACT:',
        JSON.stringify(args.lifecycleContract ?? {}, null, 2),
        '',
        'REGRESSION PLAN:',
        JSON.stringify(args.regressionPlan ?? {}, null, 2),
        '',
        'IMPLEMENTATION:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        '',
        'VERIFICATION:',
        JSON.stringify(args.verification ?? {}, null, 2),
        '',
        'REVIEW:',
        JSON.stringify(args.review ?? {}, null, 2),
        '',
        'ATTEMPTS:',
        JSON.stringify(args.attempts ?? [], null, 2),
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'acceptanceMatrix', 'qualityEvidence', 'finalSummary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
