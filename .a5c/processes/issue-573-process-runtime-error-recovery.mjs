/**
 * @process repo/issue-573-process-runtime-error-recovery
 * @description Implementation process for issue #573: durable PROCESS_RUNTIME_ERROR journaling, effect-failure separation, and a targeted run:recover-process-error CLI workflow.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, relatedIssues: number[], targetFiles: string[], verificationCommands: string[], maxImplementationAttempts: number }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: string[], qualityGates: object, review: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - No `.a5c/reuse-audit.json` exists in this checkout.
 * - No migrations or API routes are relevant to this SDK/runtime issue.
 * - Existing runtime surface:
 *   - packages/sdk/src/runtime/orchestrateIteration.ts already returns transient status "process-error" for non-RunFailedError exceptions.
 *   - packages/sdk/src/runtime/types.ts already includes IterationResult status "process-error".
 *   - packages/sdk/src/runtime/commitEffectResult.ts journals task outcomes as EFFECT_RESOLVED with status "ok" or "error".
 * - Existing replay/state surfaces to extend:
 *   - packages/sdk/src/runtime/replay/effectIndex.ts enumerates supported journal event types.
 *   - packages/sdk/src/runtime/runLifecycleState.ts and packages/sdk/src/cli/main/runState.ts derive run status from journal lifecycle events.
 *   - packages/sdk/src/runtime/replay/stateCache.ts rebuilds derived state from the journal.
 * - Existing CLI/MCP surfaces to extend:
 *   - packages/sdk/src/cli/commands/runIterate.ts maps process-error to failed CLI output without durable journal state.
 *   - packages/sdk/src/cli/main/runCreate.ts owns run:rebuild-state and run:repair-journal; place targeted process-error recovery beside these commands.
 *   - packages/sdk/src/cli/main/program.ts, usage.ts, argPositionals.ts, dispatchRunSession.ts, runInspection.ts, and render/events own registration and presentation.
 *   - packages/sdk/src/mcp/tools/runs.ts already exposes process-error as recoverable for run iteration.
 * - Existing docs/prompt surfaces to update:
 *   - library/reference/sdk.md, docs/user-guide/reference/cli-reference.md, docs/reference/babysitter_cli_surface_spec.md.
 *   - packages/sdk/src/prompts/templates/recovery.md, critical-rules.md, and breakpoint-handling.md.
 * - Existing dependency/test surface:
 *   - vitest is already available; no SDK dependency addition is planned.
 *
 * Process-library research:
 * - Active process library: /home/runner/.a5c/process-library/babysitter-repo/library
 * - Relevant references inspected:
 *   - specializations/sdk-platform-development/error-handling-debugging-support.js
 *   - specializations/sdk-platform-development/cli-tool-development.js
 *   - specializations/sdk-platform-development/sdk-testing-strategy.js
 *   - specializations/qa-testing-automation/quality-gates.js
 *   - reference/sdk.md
 *   - reference/ORCHESTRATION_GUIDE.md
 *   - tdd-quality-convergence.js
 *
 * @process specializations/sdk-platform-development/error-handling-debugging-support
 * @process specializations/sdk-platform-development/cli-tool-development
 * @process specializations/sdk-platform-development/sdk-testing-strategy
 * @process specializations/qa-testing-automation/quality-gates
 * @process tdd-quality-convergence
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_MAX_ATTEMPTS = 3;

function valueOf(result) {
  return result?.value ?? result ?? null;
}

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-573.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext: valueOf(issueContext),
  }, {
    key: 'issue-573.reuse-audit',
  });

  const architecture = await ctx.task(designRuntimeRecoveryContractTask, {
    inputs,
    issueContext: valueOf(issueContext),
    reuseAudit: valueOf(reuseAudit),
  }, {
    key: 'issue-573.runtime-recovery-contract',
  });

  const architectureValue = valueOf(architecture);
  if (architectureValue?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #573 Contract Decision',
      question: architectureValue.question ?? 'Review the proposed PROCESS_RUNTIME_ERROR event and recovery CLI contract.',
      options: [
        'Proceed with recommended conservative contract',
        'Pause for maintainer guidance',
      ],
      expert: 'maintainer',
      tags: ['issue-573', 'sdk', 'process-runtime-error', 'recovery-cli'],
      context: {
        issueNumber: inputs.issueNumber,
        architecture: architectureValue,
      },
    });
  }

  const regressionTests = await ctx.task(authorRegressionTestsTask, {
    inputs,
    issueContext: valueOf(issueContext),
    reuseAudit: valueOf(reuseAudit),
    architecture: architectureValue,
  }, {
    key: 'issue-573.author-regression-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];
  const maxAttempts = inputs.maxImplementationAttempts ?? DEFAULT_MAX_ATTEMPTS;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    implementation = await ctx.task(implementRuntimeRecoveryTask, {
      inputs,
      issueContext: valueOf(issueContext),
      reuseAudit: valueOf(reuseAudit),
      architecture: architectureValue,
      regressionTests: valueOf(regressionTests),
      previousVerification: valueOf(verification),
      previousReview: valueOf(review),
      attempt,
    }, {
      key: `issue-573.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext: valueOf(issueContext),
      architecture: architectureValue,
      implementation: valueOf(implementation),
      attempt,
    }, {
      key: `issue-573.verification.${attempt}`,
    });

    review = await ctx.task(reviewRuntimeRecoveryTask, {
      inputs,
      issueContext: valueOf(issueContext),
      reuseAudit: valueOf(reuseAudit),
      architecture: architectureValue,
      regressionTests: valueOf(regressionTests),
      implementation: valueOf(implementation),
      verification: valueOf(verification),
      attempt,
    }, {
      key: `issue-573.review.${attempt}`,
    });

    attempts.push({
      attempt,
      implementation: valueOf(implementation),
      verification: valueOf(verification),
      review: valueOf(review),
    });

    if (valueOf(verification)?.passed === true && valueOf(review)?.approved === true) {
      break;
    }
  }

  const documentation = await ctx.task(documentRecoveryWorkflowTask, {
    inputs,
    issueContext: valueOf(issueContext),
    architecture: architectureValue,
    implementation: valueOf(implementation),
    verification: valueOf(verification),
    review: valueOf(review),
  }, {
    key: 'issue-573.documentation',
  });

  const finalAcceptance = await ctx.task(finalAcceptanceTask, {
    inputs,
    issueContext: valueOf(issueContext),
    reuseAudit: valueOf(reuseAudit),
    architecture: architectureValue,
    regressionTests: valueOf(regressionTests),
    implementation: valueOf(implementation),
    verification: valueOf(verification),
    review: valueOf(review),
    documentation: valueOf(documentation),
    attempts,
  }, {
    key: 'issue-573.final-acceptance',
  });

  const finalValue = valueOf(finalAcceptance);
  if (finalValue?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #573 Final Acceptance Decision',
      question: finalValue.question ?? 'Review the remaining verification or contract concern before completion.',
      options: [
        'Iterate on the reported issue',
        'Pause for maintainer guidance',
      ],
      expert: 'maintainer',
      tags: ['issue-573', 'final-acceptance', 'sdk'],
      context: {
        issueNumber: inputs.issueNumber,
        finalAcceptance: finalValue,
      },
    });
  }

  return {
    success: finalValue?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit',
      'runtime-recovery-contract',
      'test-first-regression-coverage',
      'implementation-repair-loop',
      'verification-gate',
      'runtime-recovery-review',
      'documentation-gate',
      'final-acceptance',
    ],
    changedFiles: finalValue?.changedFiles ?? valueOf(implementation)?.changedFiles ?? [],
    runtimeCallPaths: valueOf(reuseAudit)?.runtimeCallPaths ?? [],
    qualityGates: valueOf(verification),
    issueContext: valueOf(issueContext),
    reuseAudit: valueOf(reuseAudit),
    architecture: architectureValue,
    regressionTests: valueOf(regressionTests),
    implementation: valueOf(implementation),
    verification: valueOf(verification),
    review: valueOf(review),
    documentation: valueOf(documentation),
    attempts,
    finalAcceptance: finalValue,
  };
}

export const readIssueContextTask = defineTask('issue-573.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #573 and related recovery context',
  labels: ['issue-573', 'sdk', 'research', 'issue-context'],
  agent: {
    name: 'sdk-runtime-architect',
    prompt: {
      role: 'senior Babysitter SDK runtime engineer',
      task: 'Read the GitHub issue thread and produce the authoritative implementation brief.',
      instructions: [
        'Do not edit files in this task.',
        `Run gh issue view ${args.issueNumber ?? 573} --json title,body,labels,comments,state,stateReason,url.`,
        `If ${args.issueNumber ?? 573} resolves as a PR rather than an issue, also run gh pr view ${args.issueNumber ?? 573} --json files,title,body,comments.`,
        `Read related issues: ${(args.relatedIssues ?? [572, 191, 132]).map((n) => `#${n}`).join(', ')}. Use them only to preserve boundaries and historical context.`,
        'Return JSON with: title, state, labels, rawIssueBody, comments, relatedIssueNotes, acceptanceCriteria, nonGoals, severity, and implementationRisks.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-573.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run SDK reuse audit and trace runtime call paths',
  labels: ['issue-573', 'reuse-audit', 'runtime-trace'],
  agent: {
    name: 'sdk-runtime-architect',
    prompt: {
      role: 'senior TypeScript SDK maintainer',
      task: 'Audit existing runtime, CLI, replay, MCP, docs, and prompt surfaces before implementation.',
      instructions: [
        'Do not edit files in this task.',
        'Use the issue context JSON below as the spec source.',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'Search for PROCESS_RUNTIME_ERROR, process-error, RunFailedError, RUN_FAILED, EFFECT_RESOLVED, run:rebuild-state, run:repair-journal, run:status, run:events, and run:iterate.',
        'Trace live call paths from run:iterate through orchestrateIteration, replay, journal append, run-state derivation, CLI rendering, and MCP run tools.',
        'Trace task result posting through task:post and commitEffectResult so effect_failed semantics remain distinct.',
        'Confirm no migrations, API routes, environment variables, or new SDK dependencies are needed.',
        'Identify existing tests and helpers that should be extended rather than replaced.',
        'Return JSON with: reuseAuditFindings, runtimeCallPaths, liveExecutionFiles, testFiles, docsFiles, commandRegistrationFiles, mcpFiles, dependencyFindings, and risks.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designRuntimeRecoveryContractTask = defineTask('issue-573.design-runtime-recovery-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design PROCESS_RUNTIME_ERROR and recovery CLI contract',
  labels: ['issue-573', 'architecture', 'recovery-cli'],
  agent: {
    name: 'sdk-runtime-architect',
    prompt: {
      role: 'senior runtime and CLI API designer',
      task: 'Design the smallest durable contract that satisfies issue #573.',
      instructions: [
        'Do not edit files in this task.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
        'Define PROCESS_RUNTIME_ERROR event payload fields, including serialized error, iteration number, run id or process id when available, journal head, and best-effort last effect metadata.',
        'Decide whether the event is terminal for state derivation and explain how recovery clears or supersedes that marker while preserving journal invariants.',
        'Define run:recover-process-error <runDir> flags. The command must support --dry-run and --json, identify the latest typed process error, optionally patch a task result artifact, rebuild state, and avoid generic journal surgery.',
        'Specify JSON patch grammar conservatively. If a full JSON Patch implementation would add risk, recommend a scoped path assignment grammar with explicit validation.',
        'Preserve distinction between PROCESS_RUNTIME_ERROR, EFFECT_RESOLVED status error, shell non-zero payloads, and RUN_FAILED infrastructure failures.',
        'Return JSON with: eventContract, recoveryCliContract, stateModel, compatibilityPlan, implementationOrder, testPlan, docsPlan, risks, needsMaintainerDecision, and question.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionTestsTask = defineTask('issue-573.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing regression coverage before implementation',
  labels: ['issue-573', 'tests', 'tdd'],
  agent: {
    name: 'sdk-test-engineer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add focused failing tests for issue #573 before implementation changes.',
      instructions: [
        'Edit test files only in this task.',
        'Do not modify runtime, CLI, docs, prompt templates, or source implementation files.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'Architecture JSON:',
        JSON.stringify(args.architecture ?? {}, null, 2),
        'Use existing test helpers and patterns from the reuse audit.',
        'Cover at minimum: process exception journals PROCESS_RUNTIME_ERROR; task:post --status error remains EFFECT_RESOLVED status error; recovery with patch clears the marker and allows iteration; recovery without patch honestly rethrows; malformed recovery arguments do not mutate artifacts; no-marker recovery fails cleanly; run:status/run:events/MCP expose the new classification.',
        'Run the smallest targeted test commands needed to prove the tests fail for the expected missing behavior.',
        'Return JSON with: changedFiles, testsAdded, expectedFailures, commandsRun, failureEvidence, and any spec ambiguity.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementRuntimeRecoveryTask = defineTask('issue-573.implement-runtime-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement runtime event, recovery CLI, and consumers',
  labels: ['issue-573', 'implementation', 'sdk'],
  agent: {
    name: 'sdk-implementation-engineer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    timeout: 900000,
    maxTurns: 12,
    prompt: {
      role: 'senior TypeScript SDK engineer',
      task: `Implement issue #573 attempt ${args.attempt}.`,
      instructions: [
        'Edit the repository directly. Keep changes scoped to files on the live runtime, CLI, replay/state, MCP, docs, prompt, and test paths identified by the reuse audit.',
        'Do not modify unrelated process files, generated marketplace files, local Codex config, or unrelated dirty worktree files.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
        'Architecture JSON:',
        JSON.stringify(args.architecture ?? {}, null, 2),
        'Regression test result JSON:',
        JSON.stringify(args.regressionTests ?? {}, null, 2),
        'Previous verification JSON:',
        JSON.stringify(args.previousVerification ?? {}, null, 2),
        'Previous review JSON:',
        JSON.stringify(args.previousReview ?? {}, null, 2),
        'Implement durable PROCESS_RUNTIME_ERROR journaling in the process exception path without converting task effect failures into process errors.',
        'Extend replay/state/status/events/render/MCP consumers so classification is consistent and backward compatible.',
        'Add run:recover-process-error beside existing run repair commands with dry-run, JSON output, scoped patching, no-marker failure, malformed-input safety, state rebuild, and honest rethrow behavior.',
        'Update documentation and recovery prompt templates only where required by the implemented contract.',
        'Run focused checks while implementing and report exact commands and results.',
        'Return JSON with: changedFiles, summary, runtimeCallPathsModified, commandContract, testsUpdated, docsUpdated, verificationCommandsRun, risks, and blockers.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-573.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run issue #573 verification gate',
  labels: ['issue-573', 'verification', 'quality-gate'],
  agent: {
    name: 'sdk-verification-engineer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    timeout: 900000,
    maxTurns: 8,
    prompt: {
      role: 'senior SDK verification engineer',
      task: `Run and assess the verification gate for issue #573 attempt ${args.attempt}.`,
      instructions: [
        'Do not edit files unless a command creates normal test/build artifacts that are ignored by git.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'Architecture JSON:',
        JSON.stringify(args.architecture ?? {}, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'Run these commands from the repository root:',
        JSON.stringify(args.inputs.verificationCommands ?? [], null, 2),
        'Also inspect git status and verify the diff is scoped to issue #573.',
        'Report exact pass/fail for each command. If a command fails, include the relevant failing lines and identify whether the cause is implementation, test expectation, environment, or pre-existing unrelated state.',
        'Return JSON with: passed, commandResults, scopedDiff, changedFiles, failures, suspectedRootCauses, and nextActions.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewRuntimeRecoveryTask = defineTask('issue-573.review-runtime-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review runtime recovery implementation',
  labels: ['issue-573', 'review', 'quality-gate'],
  agent: {
    name: 'sdk-code-reviewer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    timeout: 900000,
    maxTurns: 8,
    prompt: {
      role: 'senior SDK code reviewer',
      task: 'Review the implementation against issue #573 and the architecture contract.',
      instructions: [
        'Do not edit files in this task.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
        'Architecture JSON:',
        JSON.stringify(args.architecture ?? {}, null, 2),
        'Regression tests JSON:',
        JSON.stringify(args.regressionTests ?? {}, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
        'Review for journal invariants, recovery mutation safety, state-cache correctness, status/events/MCP consistency, error-message actionability, missing tests, docs drift, and unrelated churn.',
        'Verify PROCESS_RUNTIME_ERROR is distinct from EFFECT_RESOLVED status error and RUN_FAILED.',
        'Return JSON with: approved, findings, blockingIssues, missingTests, compatibilityRisks, docsRisks, and recommendedFixes.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const documentRecoveryWorkflowTask = defineTask('issue-573.document-recovery-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify docs and prompt recovery guidance',
  labels: ['issue-573', 'docs', 'recovery-guidance'],
  agent: {
    name: 'sdk-docs-reviewer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    timeout: 600000,
    maxTurns: 6,
    prompt: {
      role: 'technical documentation reviewer',
      task: 'Ensure the implemented recovery workflow is documented and prompt guidance no longer defaults to manual journal surgery.',
      instructions: [
        'Edit docs and prompt templates only if the implementation task left required documentation gaps.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'Architecture JSON:',
        JSON.stringify(args.architecture ?? {}, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
        'Review library/reference/sdk.md, docs/user-guide/reference/cli-reference.md, docs/reference/babysitter_cli_surface_spec.md, packages/sdk/src/prompts/templates/recovery.md, critical-rules.md, and breakpoint-handling.md.',
        'Ensure docs cover how to inspect PROCESS_RUNTIME_ERROR, run dry-run recovery, patch an offending task result, rebuild state through the command, and re-run run:iterate.',
        'Return JSON with: passed, changedFiles, docsCoverage, promptGuidanceChanges, staleManualSurgeryReferences, and risks.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceTask = defineTask('issue-573.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance for issue #573',
  labels: ['issue-573', 'final-acceptance'],
  agent: {
    name: 'sdk-final-acceptance-reviewer',
    prompt: {
      role: 'release-quality reviewer',
      task: 'Decide whether issue #573 is complete and ready for PR handoff.',
      instructions: [
        'Do not edit files in this task.',
        'Compare the issue context, architecture, implementation, verification, review, and documentation results directly.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'Architecture JSON:',
        JSON.stringify(args.architecture ?? {}, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
        'Review JSON:',
        JSON.stringify(args.review ?? {}, null, 2),
        'Documentation JSON:',
        JSON.stringify(args.documentation ?? {}, null, 2),
        'Confirm every acceptance point: durable PROCESS_RUNTIME_ERROR event; distinct effect_failed semantics; targeted recovery CLI; honest rethrow; malformed-input safety; state/status/events/MCP consistency; docs and prompt updates; no unrelated churn; required commands pass.',
        'Inspect git status and list changed files.',
        'Return JSON with: passed, changedFiles, acceptanceMatrix, qualityGateSummary, residualRisks, releaseNote, needsMaintainerDecision, and question.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
