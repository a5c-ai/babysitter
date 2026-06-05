/**
 * @process repo/issue-880-run-halt-command
 * @description Implement issue #880: operator-facing babysitter run:halt for auditable manual sealing of divergent runs.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, targetFiles: string[], testTargets: string[], docsTargets: string[], qualityCommands: string[], maxImplementationAttempts: number }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: string[], contract: object, verification: object, review: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - No `.a5c/reuse-audit.json` exists in this checkout.
 * - No migrations, API routes, environment variables, or new SDK dependencies are relevant to this SDK CLI recovery command.
 * - Existing adjacent CLI recovery commands live in packages/sdk/src/cli/main/runCreate.ts: `run:rebuild-state`, `run:repair-journal`, and `run:recover-process-error`.
 * - Existing command registration and parsing surfaces to extend:
 *   - packages/sdk/src/cli/main/program.ts command allowlist does not include `run:halt`.
 *   - packages/sdk/src/cli/main/dispatchRunSession.ts dispatches run commands but has no halt handler.
 *   - packages/sdk/src/cli/main/runCommands.ts exports adjacent run recovery handlers.
 *   - packages/sdk/src/cli/main/argPositionals.ts maps run recovery commands to `<runDir>` but has no halt mapping.
 *   - packages/sdk/src/cli/main/argFlagParsers.ts already has `--reason` for task cancel as `cancelReason`; `run:halt` needs its own reason/final-status parsing without reusing task-cancel semantics accidentally.
 *   - packages/sdk/src/cli/main/types.ts needs parsed fields for the new command flags.
 *   - packages/sdk/src/cli/main/usage.ts needs help output.
 * - Existing journal/state primitives to reuse:
 *   - packages/sdk/src/storage/journal.ts `appendEvent` allocates seq/ULID/checksum and stamps harness/session metadata through a per-run append queue.
 *   - packages/sdk/src/runtime/replay/stateCache.ts `rebuildStateCache` rebuilds derived state and metadata after mutation.
 *   - packages/sdk/src/cli/completionProof.ts resolves completed-run proof from metadata or derived run id.
 * - Existing state consumers already understand first-class `RUN_HALTED`:
 *   - packages/sdk/src/runtime/runLifecycleState.ts and packages/sdk/src/cli/main/runState.ts derive `halted`.
 *   - packages/sdk/src/cli/main/runInspection.ts reports halted state without completionProof.
 * - Existing tests to extend:
 *   - packages/sdk/src/cli/__tests__/cliRuns.test.ts covers status, rebuild-state, repair-journal, recover-process-error, halted state, and completionProof behavior.
 * - Existing docs/prompt surfaces to update:
 *   - docs/reference/babysitter_cli_surface_spec.md
 *   - docs/user-guide/reference/cli-reference.md
 *   - docs/agent-reference/runtime-and-layout.md
 *   - packages/sdk/src/prompts/templates/recovery.md
 *   - packages/sdk/src/prompts/templates/breakpoint-handling.md
 *
 * Process-library research:
 * - Active process library: /home/runner/.a5c/process-library/babysitter-repo/library
 * - Relevant library/process patterns inspected:
 *   - methodologies/superpowers/systematic-debugging
 *   - methodologies/superpowers/test-driven-development
 *   - methodologies/superpowers/verification-before-completion
 *   - methodologies/v-model
 *   - processes/shared/tdd-triplet.js
 *   - processes/shared/completeness-gate.js
 *   - tdd-quality-convergence.js
 * - Relevant repo process patterns inspected:
 *   - .a5c/processes/issue-573-process-runtime-error-recovery.mjs
 *   - .a5c/processes/issue-574-typed-ctx-halt.mjs
 *
 * This process intentionally uses agent tasks rather than shell tasks to respect
 * this repository's direct-user Babysitter process-authoring override.
 *
 * @process methodologies/superpowers/systematic-debugging
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/v-model
 * @process tdd-quality-convergence
 * @process repo/issue-573-process-runtime-error-recovery
 * @process repo/issue-574-typed-ctx-halt
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_MAX_ATTEMPTS = 3;

function valueOf(result) {
  return result?.value ?? result ?? null;
}

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 880;

  const issueContext = await ctx.task(readIssueContextTask, {
    ...inputs,
    issueNumber,
  }, {
    key: 'issue-880.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext: valueOf(issueContext),
  }, {
    key: 'issue-880.reuse-audit',
  });

  const contract = await ctx.task(designManualSealContractTask, {
    inputs,
    issueContext: valueOf(issueContext),
    reuseAudit: valueOf(reuseAudit),
  }, {
    key: 'issue-880.manual-seal-contract',
  });

  const contractValue = valueOf(contract);
  if (contractValue?.requiresMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #880 Manual Seal Contract Decision',
      question: contractValue.question ?? 'Confirm the operator seal terminal-event contract before implementation continues.',
      options: [
        'Proceed with recommended conservative contract',
        'Pause for maintainer guidance',
      ],
      expert: 'maintainer',
      tags: ['issue-880', 'sdk', 'run-halt', 'manual-seal', 'api-contract'],
      context: {
        issueNumber,
        contract: contractValue,
      },
    });
  }

  const regressionTests = await ctx.task(authorRegressionTestsTask, {
    inputs,
    issueContext: valueOf(issueContext),
    reuseAudit: valueOf(reuseAudit),
    contract: contractValue,
  }, {
    key: 'issue-880.author-regression-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];
  const maxAttempts = inputs?.maxImplementationAttempts ?? DEFAULT_MAX_ATTEMPTS;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    implementation = await ctx.task(implementRunHaltTask, {
      inputs,
      issueContext: valueOf(issueContext),
      reuseAudit: valueOf(reuseAudit),
      contract: contractValue,
      regressionTests: valueOf(regressionTests),
      previousVerification: valueOf(verification),
      previousReview: valueOf(review),
      attempt,
    }, {
      key: `issue-880.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext: valueOf(issueContext),
      contract: contractValue,
      regressionTests: valueOf(regressionTests),
      implementation: valueOf(implementation),
      attempt,
    }, {
      key: `issue-880.verification.${attempt}`,
    });

    review = await ctx.task(reviewRunHaltTask, {
      inputs,
      issueContext: valueOf(issueContext),
      reuseAudit: valueOf(reuseAudit),
      contract: contractValue,
      regressionTests: valueOf(regressionTests),
      implementation: valueOf(implementation),
      verification: valueOf(verification),
      attempt,
    }, {
      key: `issue-880.review.${attempt}`,
    });

    attempts.push({
      attempt,
      implementation: valueOf(implementation),
      verification: valueOf(verification),
      review: valueOf(review),
    });

    if (
      valueOf(verification)?.passed === true &&
      valueOf(verification)?.journalInvariantVerified === true &&
      valueOf(verification)?.auditTrailVerified === true &&
      valueOf(review)?.approved === true
    ) {
      break;
    }
  }

  if (
    valueOf(verification)?.passed !== true ||
    valueOf(verification)?.journalInvariantVerified !== true ||
    valueOf(verification)?.auditTrailVerified !== true ||
    valueOf(review)?.approved !== true
  ) {
    await ctx.breakpoint({
      title: 'Issue #880 Final Gate Did Not Pass',
      question: 'The run:halt implementation did not satisfy verification and review within the configured attempts. Review failures before continuing?',
      options: [
        'Retry with reviewer feedback',
        'Pause for maintainer guidance',
      ],
      expert: 'maintainer',
      tags: ['issue-880', 'run-halt', 'quality-gate'],
      context: {
        issueNumber,
        verification: valueOf(verification),
        review: valueOf(review),
        attempts: attempts.length,
      },
    });
  }

  const documentation = await ctx.task(documentManualSealWorkflowTask, {
    inputs,
    issueContext: valueOf(issueContext),
    reuseAudit: valueOf(reuseAudit),
    contract: contractValue,
    implementation: valueOf(implementation),
    verification: valueOf(verification),
    review: valueOf(review),
  }, {
    key: 'issue-880.documentation',
  });

  const finalAcceptance = await ctx.task(finalAcceptanceTask, {
    inputs,
    issueContext: valueOf(issueContext),
    reuseAudit: valueOf(reuseAudit),
    contract: contractValue,
    regressionTests: valueOf(regressionTests),
    implementation: valueOf(implementation),
    verification: valueOf(verification),
    review: valueOf(review),
    documentation: valueOf(documentation),
    attempts,
  }, {
    key: 'issue-880.final-acceptance',
  });

  const finalValue = valueOf(finalAcceptance);
  return {
    success: finalValue?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit-and-runtime-map',
      'manual-seal-contract',
      'red-regression-tests',
      'implementation-loop',
      'verification-gate',
      'code-review',
      'documentation-gate',
      'final-acceptance',
    ],
    changedFiles: finalValue?.changedFiles ?? valueOf(implementation)?.changedFiles ?? [],
    runtimeCallPaths: valueOf(reuseAudit)?.runtimeCallPaths ?? [],
    issueContext: valueOf(issueContext),
    reuseAudit: valueOf(reuseAudit),
    contract: contractValue,
    regressionTests: valueOf(regressionTests),
    implementation: valueOf(implementation),
    verification: valueOf(verification),
    review: valueOf(review),
    documentation: valueOf(documentation),
    attempts,
    finalAcceptance: finalValue,
  };
}

export const readIssueContextTask = defineTask('issue-880.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #880 and related recovery context',
  labels: ['issue-880', 'sdk', 'run-halt', 'issue-context'],
  agent: {
    name: 'sdk-recovery-researcher',
    prompt: {
      role: 'senior Babysitter SDK maintainer',
      task: 'Read the GitHub issue thread and produce the authoritative implementation brief for issue #880.',
      instructions: [
        'Do not edit files in this task.',
        `Run gh issue view ${args.issueNumber ?? 880} --json title,body,labels,comments,state,stateReason,url.`,
        `If ${args.issueNumber ?? 880} resolves as a PR rather than an issue, also run gh pr view ${args.issueNumber ?? 880} --json files,title,body,comments.`,
        `Read related issues and PRs listed in the inputs when available: ${JSON.stringify(args.relatedIssues ?? [879, 574, 573, 191, 181], null, 2)}.`,
        'Treat the issue body, comments, and labels as the source of truth. Preserve the distinction between operator-authored `run:halt` and process-authored `ctx.halt(...)`.',
        'Return JSON with: title, state, url, labels, rawIssueBody, comments, acceptanceCriteria, nonGoals, terminalSemanticsOptions, relatedIssueNotes, implementationRisks, and priority.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'labels', 'acceptanceCriteria', 'nonGoals', 'implementationRisks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-880.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map existing CLI recovery and journal sealing surfaces',
  labels: ['issue-880', 'sdk', 'reuse-audit', 'runtime-trace'],
  agent: {
    name: 'sdk-runtime-architect',
    prompt: {
      role: 'senior TypeScript SDK maintainer',
      task: 'Run Phase 0 reuse audit and trace the live command path for a new run:halt recovery command.',
      instructions: [
        'Do not edit files in this task.',
        'Render "Reuse-audit findings (REVIEW BEFORE PROCEEDING)" before implementation planning details.',
        'Confirm whether `.a5c/reuse-audit.json` exists and apply it if present.',
        'Confirm no migrations, API routes, environment variables, or dependency additions are needed.',
        'Search for run:halt, manual_seal_reason, run:recover-process-error, run:rebuild-state, run:repair-journal, RUN_HALTED, RUN_COMPLETED, RUN_FAILED, completionProof, appendEvent, rebuildStateCache, final-status, and --reason.',
        'Trace the command path from command allowlist through flag parsing, positional parsing, dispatch, handler export, run metadata loading, journal append, state cache rebuild, status/events visibility, and help output.',
        'Trace completed/halted/failed terminal status derivation through runLifecycleState, runState, runInspection, and replay/effectIndex to avoid conflicting terminal semantics.',
        'Identify tests and helpers in packages/sdk/src/cli/__tests__/cliRuns.test.ts that can be extended for run:halt.',
        'Identify docs and prompt templates that should explain when to use run:halt versus run:recover-process-error, run:repair-journal, run:rebuild-state, and ctx.halt.',
        'Return JSON with: reuseAuditFindings, runtimeCallPaths, liveExecutionFiles, commandRegistrationFiles, parserFiles, handlerFiles, stateFiles, testFiles, docsFiles, dependencyFindings, existingGaps, and risks.',
        '',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['reuseAuditFindings', 'runtimeCallPaths', 'liveExecutionFiles', 'testFiles', 'docsFiles', 'risks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designManualSealContractTask = defineTask('issue-880.manual-seal-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design operator manual-seal CLI contract',
  labels: ['issue-880', 'sdk', 'api-design', 'manual-seal'],
  agent: {
    name: 'sdk-cli-architect',
    prompt: {
      role: 'senior CLI and runtime API designer',
      task: 'Define the smallest safe contract for `babysitter run:halt`.',
      instructions: [
        'Do not edit files in this task.',
        'Use the issue context and reuse audit as the acceptance spec.',
        'Define the public command grammar: `babysitter run:halt <runDir> [--reason <text>] [--final-status completed|failed|halted] [--json] [--dry-run]` if the reuse audit supports `halted`, or explicitly justify omitting `halted` despite existing RUN_HALTED support.',
        'Resolve the issue/comment tension explicitly: the issue suggests completed|failed, while triage recommends default manual halt semantics unless completed/failed is explicit.',
        'Recommended baseline unless disproven: require a non-empty `--reason`; default `--final-status halted`; allow explicit completed or failed only when the operator chooses it.',
        'Map final status to exactly one terminal event: RUN_HALTED for halted, RUN_COMPLETED for completed, RUN_FAILED for failed.',
        'For RUN_COMPLETED, specify completionProof behavior using existing metadata/resolveCompletionProof semantics; do not invent a second proof source.',
        'Specify event data fields, including manual_seal_reason, sealedBy: "run:halt", requestedFinalStatus, pendingEffectsSummary, priorLifecycleState, priorLifecycleEvent, and any completionProof only for completed seals.',
        'Specify validation: missing runDir, missing/blank reason, invalid final status, already terminal run rejection by default, malformed/corrupt journal failure, and dry-run no mutation.',
        'Specify state rebuild: append terminal event through appendEvent, then rebuildStateCache with reason "manual_seal".',
        'Specify output: human and JSON must include final status, appended event seq/filename/checksum, pending counts, prior state, state rebuild metadata, and completionProof only when completed.',
        'If an override for already-terminal runs is needed, recommend a follow-up instead of adding it unless issue context requires it.',
        'Return JSON with: commandContract, terminalEventContract, validationRules, outputContract, implementationOrder, testPlan, docsPlan, nonGoals, riskMitigations, requiresMaintainerDecision, and question.',
        '',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'REUSE AUDIT JSON:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['commandContract', 'terminalEventContract', 'validationRules', 'testPlan', 'docsPlan', 'nonGoals'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionTestsTask = defineTask('issue-880.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing run:halt regression tests',
  labels: ['issue-880', 'sdk', 'tests', 'tdd', 'phase:red'],
  agent: {
    name: 'sdk-cli-test-author',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    timeout: 900000,
    maxTurns: 10,
    prompt: {
      role: 'senior TypeScript SDK test engineer',
      task: 'Add focused failing tests for issue #880 before production code changes.',
      instructions: [
        'Edit test files only in this task.',
        'Do not modify CLI implementation, runtime source, docs, prompt templates, generated metadata, or unrelated dirty files.',
        'Use existing helpers and patterns from packages/sdk/src/cli/__tests__/cliRuns.test.ts before creating new scaffolding.',
        'Cover command registration/help: run:halt is accepted and usage describes `<runDir>`, `--reason`, `--final-status`, `--json`, and `--dry-run` according to the contract.',
        'Cover missing/blank `--reason` failing without journal/state mutation.',
        'Cover dry-run JSON reporting prior state, selected final status, pending effect counts, and planned terminal event without mutating journal or state cache.',
        'Cover default/manual seal behavior from the contract, including event type, manual_seal_reason, sealedBy, pending summary, status output, and state cache rebuild metadata.',
        'Cover explicit `--final-status failed` appending RUN_FAILED and explicit `--final-status completed` appending RUN_COMPLETED with completionProof output.',
        'Cover already-terminal run rejection without mutation.',
        'Cover `run:status --json` and `run:events --json` visibility of the audit fields after sealing.',
        'Run the smallest targeted test command needed to prove the new tests fail for the missing command, and preserve the failure evidence.',
        'Return JSON with: changedFiles, testsAdded, redVerified, redCommands, redOutputSummary, coverageMatrix, and ambiguities.',
        '',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'CONTRACT JSON:',
        JSON.stringify(args.contract ?? {}, null, 2),
        '',
        `TEST TARGETS: ${JSON.stringify(args.inputs?.testTargets ?? [], null, 2)}`,
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'testsAdded', 'redVerified', 'coverageMatrix'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementRunHaltTask = defineTask('issue-880.implement-run-halt', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement run:halt command and consumers',
  labels: ['issue-880', 'sdk', 'implementation', 'phase:green'],
  agent: {
    name: 'sdk-cli-implementer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    timeout: 900000,
    maxTurns: 12,
    prompt: {
      role: 'senior Babysitter SDK engineer',
      task: `Implement issue #880 attempt ${args.attempt}.`,
      instructions: [
        'Edit the repository directly. Keep changes scoped to files on the live CLI, journal/state, tests, docs, and prompt paths identified by the reuse audit.',
        'Do not modify unrelated process files, generated marketplace files, local Codex config, or unrelated dirty worktree files.',
        'Make the red tests pass with the smallest coherent change.',
        'Wire `run:halt` through command allowlist, usage, flag parsing/types, positional parsing, command exports, and dispatch.',
        'Implement the handler beside adjacent run recovery handlers unless the reuse audit identifies a better existing home.',
        'Use `appendEvent` for the terminal event. Do not hand-write journal files.',
        'Use `rebuildStateCache` after a successful append with reason "manual_seal".',
        'Use existing run metadata and completionProof helpers for completed seals. Do not change normal completion proof behavior.',
        'Validate non-empty reason, valid final status, non-terminal current state, and dry-run no mutation.',
        'Include the audit fields defined by the contract in the event data and output.',
        'Preserve process-level `ctx.halt(...)` semantics. The operator command must not blur with process-authored halts except where the contract intentionally maps default manual sealing to RUN_HALTED.',
        'Update docs and prompt templates only where required by the contract.',
        'Run focused checks while implementing and report exact command outcomes.',
        'Return JSON with: changedFiles, summary, commandContractImplemented, eventPayloadImplemented, stateRebuildBehavior, testsUpdated, docsUpdated, verificationCommandsRun, risks, and blockers.',
        '',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'REUSE AUDIT JSON:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
        '',
        'CONTRACT JSON:',
        JSON.stringify(args.contract ?? {}, null, 2),
        '',
        'REGRESSION TESTS JSON:',
        JSON.stringify(args.regressionTests ?? {}, null, 2),
        '',
        'PREVIOUS VERIFICATION JSON:',
        JSON.stringify(args.previousVerification ?? null, null, 2),
        '',
        'PREVIOUS REVIEW JSON:',
        JSON.stringify(args.previousReview ?? null, null, 2),
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'summary', 'commandContractImplemented', 'eventPayloadImplemented'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-880.verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify run:halt quality gates',
  labels: ['issue-880', 'sdk', 'verification', 'quality-gate'],
  agent: {
    name: 'sdk-cli-verifier',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    timeout: 900000,
    maxTurns: 8,
    prompt: {
      role: 'senior SDK verification engineer',
      task: `Run and interpret the verification gate for issue #880 attempt ${args.attempt}.`,
      instructions: [
        'Do not edit files unless a command creates normal ignored test/build artifacts.',
        'Run the listed quality commands from the repository root.',
        'Confirm red-phase evidence exists and that the same tests now pass.',
        'Confirm `run:halt` uses appendEvent rather than hand-writing journal files.',
        'Confirm one and only one terminal event is appended for each successful seal.',
        'Confirm the event contains manual_seal_reason, sealedBy, selected final status, prior lifecycle state, pending summary, and completionProof only for completed seals.',
        'Confirm dry-run, missing reason, invalid final status, and already-terminal rejection do not mutate journal or state cache.',
        'Confirm successful seals rebuild the state cache with manual_seal metadata and `run:status --json` reflects the selected terminal state.',
        'Confirm completed seals preserve completionProof behavior and failed/halted seals do not emit a completionProof.',
        'Inspect git status and verify the diff is scoped to issue #880.',
        'Return JSON with: passed, commands, commandResults, scopedDiff, changedFiles, failures, journalInvariantVerified, auditTrailVerified, completionProofInvariantVerified, stateRebuildVerified, docsVerified, and nextActions.',
        '',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'CONTRACT JSON:',
        JSON.stringify(args.contract ?? {}, null, 2),
        '',
        'REGRESSION TESTS JSON:',
        JSON.stringify(args.regressionTests ?? {}, null, 2),
        '',
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        '',
        `QUALITY COMMANDS: ${JSON.stringify(args.inputs?.qualityCommands ?? [], null, 2)}`,
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'commands', 'journalInvariantVerified', 'auditTrailVerified', 'completionProofInvariantVerified', 'stateRebuildVerified'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewRunHaltTask = defineTask('issue-880.review-run-halt', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review run:halt implementation',
  labels: ['issue-880', 'sdk', 'code-review', 'manual-seal'],
  agent: {
    name: 'sdk-recovery-reviewer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    timeout: 900000,
    maxTurns: 8,
    prompt: {
      role: 'senior SDK code reviewer',
      task: 'Review issue #880 changes against the issue spec and manual seal contract.',
      instructions: [
        'Do not edit files in this task.',
        'Lead with blocking findings, each with file and line references.',
        'Verify `run:halt` is operator-authored recovery and remains distinct from process-authored `ctx.halt(...)`.',
        'Verify command parsing cannot accidentally reuse task-cancel `--reason` state or leak flags into other commands.',
        'Verify the handler refuses unsafe/malformed inputs before mutation.',
        'Verify appendEvent and rebuildStateCache preserve journal/state invariants.',
        'Verify event audit fields are stable, documented, and visible through run:events/status paths.',
        'Verify completionProof behavior is only present for completed seals and uses existing proof helpers.',
        'Verify tests cover dry-run, JSON output, reason recording, all supported final statuses, already-terminal rejection, state rebuild, and visibility.',
        'Verify docs explain command selection versus run:recover-process-error, run:repair-journal, run:rebuild-state, and ctx.halt.',
        'Return JSON with: approved, blockingIssues, nonBlockingSuggestions, missingTests, specCoverage, riskAssessment, and finalSummary.',
        '',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'REUSE AUDIT JSON:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
        '',
        'CONTRACT JSON:',
        JSON.stringify(args.contract ?? {}, null, 2),
        '',
        'REGRESSION TESTS JSON:',
        JSON.stringify(args.regressionTests ?? {}, null, 2),
        '',
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        '',
        'VERIFICATION JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
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

export const documentManualSealWorkflowTask = defineTask('issue-880.documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document manual seal recovery workflow',
  labels: ['issue-880', 'sdk', 'docs', 'operator-recovery'],
  agent: {
    name: 'sdk-docs-maintainer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    timeout: 600000,
    maxTurns: 6,
    prompt: {
      role: 'senior SDK documentation maintainer',
      task: 'Update recovery documentation for the implemented run:halt command.',
      instructions: [
        'Edit only the documentation and prompt-template files required by the contract and implementation.',
        'Document the exact command grammar, final-status semantics, audit fields, JSON output, and dry-run behavior.',
        'Add a decision table: ctx.halt for process-authored early exit; run:recover-process-error for typed process exceptions; run:repair-journal for malformed/colliding journal entries; run:rebuild-state for cache drift; run:halt for operator-authored manual sealing of divergent runs.',
        'Warn that completed manual seals are explicit operator assertions and must include manual_seal_reason.',
        'Avoid implying that run:halt repairs root causes or resolves pending effects. It seals operational reality with an audit trail.',
        'Run focused docs/grep checks as practical and report the results.',
        'Return JSON with: changedFiles, docsUpdated, commandExamples, decisionTableUpdated, promptTemplatesUpdated, checksRun, and risks.',
        '',
        'CONTRACT JSON:',
        JSON.stringify(args.contract ?? {}, null, 2),
        '',
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        '',
        `DOC TARGETS: ${JSON.stringify(args.inputs?.docsTargets ?? [], null, 2)}`,
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'docsUpdated', 'decisionTableUpdated'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceTask = defineTask('issue-880.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Finalize issue #880 acceptance evidence',
  labels: ['issue-880', 'sdk', 'final-acceptance'],
  agent: {
    name: 'sdk-release-verifier',
    prompt: {
      role: 'senior release verifier',
      task: 'Produce final acceptance evidence for issue #880.',
      instructions: [
        'Do not edit files in this task.',
        'Compare the issue context, contract, implementation, verification, review, and documentation results directly.',
        'Confirm every acceptance criterion is addressed or explicitly listed as a deferred follow-up.',
        'Confirm the final diff is scoped to issue #880 and excludes unrelated dirty worktree files.',
        'Confirm no implementation code weakens journal invariants, completionProof semantics, or existing recovery commands.',
        'Return JSON with: passed, changedFiles, acceptanceMatrix, deferredFollowUps, qualityEvidence, docsEvidence, risks, and finalSummary.',
        '',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        '',
        'CONTRACT JSON:',
        JSON.stringify(args.contract ?? {}, null, 2),
        '',
        'REGRESSION TESTS JSON:',
        JSON.stringify(args.regressionTests ?? {}, null, 2),
        '',
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        '',
        'VERIFICATION JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
        '',
        'REVIEW JSON:',
        JSON.stringify(args.review ?? {}, null, 2),
        '',
        'DOCUMENTATION JSON:',
        JSON.stringify(args.documentation ?? {}, null, 2),
        '',
        `ATTEMPTS JSON: ${JSON.stringify(args.attempts ?? [], null, 2)}`,
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'changedFiles', 'acceptanceMatrix', 'finalSummary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
