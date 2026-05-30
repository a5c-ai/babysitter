/**
 * @process babysitter/issue-573-process-runtime-error-recovery
 * @description Implement issue #573: durable process runtime error events and first-class recovery CLI.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Requested `.a5c/process-library/` path is not present in this checkout.
 *   Local methodology sources used instead:
 *   - library/methodologies/rpikit/skills/test-driven-development/SKILL.md
 *   - library/methodologies/rpikit/skills/verification/SKILL.md
 *   - library/methodologies/planning-with-files/skills/session-recovery/SKILL.md
 *   - library/methodologies/maestro/skills/code-review-gate/SKILL.md
 *   - library/methodologies/maestro/skills/test-enforcement/SKILL.md
 * - Existing process-error surface to reuse:
 *   - packages/sdk/src/runtime/orchestrateIteration.ts already returns transient
 *     IterationResult status "process-error" for non-RunFailedError exceptions.
 *   - packages/sdk/src/cli/commands/runIterate.ts maps that transient result to
 *     CLI status "failed" with a process-error reason, but does not journal a
 *     typed event or expose a recovery handle.
 *   - packages/sdk/src/mcp/tools/runs.ts already returns process-error with
 *     recoverable: true for MCP run_iterate.
 * - Existing failure and replay surfaces to extend instead of replacing:
 *   - packages/sdk/src/runtime/commitEffectResult.ts journals EFFECT_RESOLVED
 *     with status "ok" or "error"; this is the effect_failed side of the split.
 *   - packages/sdk/src/runtime/replay/effectIndex.ts, runtime/runLifecycleState.ts,
 *     cli/main/runState.ts, cli/main/runInspection.ts, and replay/stateCache.ts
 *     derive run state from journal events and must understand the new event.
 *   - packages/sdk/src/cli/main/runCreate.ts already owns run:rebuild-state and
 *     run:repair-journal; add targeted recovery beside these commands.
 *   - packages/sdk/src/cli/main/program.ts, usage.ts, argPositionals.ts, and
 *     dispatchRunSession.ts are the command registration surfaces.
 * - Documentation/recovery guidance to update:
 *   - library/reference/sdk.md documents the SDK execution model.
 *   - packages/sdk/src/prompts/templates/recovery.md and critical-rules.md hold
 *     operator recovery guidance that currently permits manual journal surgery.
 *
 * @process methodologies/rpikit/test-driven-development
 * @process methodologies/rpikit/verification
 * @process methodologies/planning-with-files/session-recovery
 * @process methodologies/maestro/code-review-gate
 * @process methodologies/maestro/test-enforcement
 * @specialization sdk-runtime-operability
 * @agent sdk-runtime-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent sdk-implementation-engineer specializations/sdk-platform-development/agents/typescript-engineer/AGENT.md
 * @agent cli-recovery-engineer specializations/developer-experience/agents/cli-engineer/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent docs-reviewer specializations/technical-writing/agents/docs-reviewer/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

function compact(result) {
  return result?.value ?? result ?? null;
}

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-573.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext: compact(issueContext),
  }, {
    key: 'issue-573.reuse-audit',
  });

  const architecture = await ctx.task(designRuntimeAndRecoveryTask, {
    inputs,
    issueContext: compact(issueContext),
    reuseAudit: compact(reuseAudit),
  }, {
    key: 'issue-573.architecture',
  });

  if (architecture?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #573 Runtime Recovery Contract',
      question: architecture.question ?? 'Review the proposed process runtime error event and recovery command contract before implementation.',
      options: [
        'Proceed with recommended conservative contract',
        'Pause for maintainer guidance',
      ],
      expert: 'maintainer',
      tags: ['issue-573', 'sdk', 'process-runtime-error', 'recovery-cli'],
      context: {
        runId: ctx.runId,
        architecture,
      },
    });
  }

  const regressionPlan = await ctx.task(authorRegressionPlanTask, {
    inputs,
    issueContext: compact(issueContext),
    reuseAudit: compact(reuseAudit),
    architecture: compact(architecture),
  }, {
    key: 'issue-573.regression-plan',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= (inputs.maxImplementationAttempts ?? MAX_IMPLEMENTATION_ATTEMPTS); attempt += 1) {
    implementation = await ctx.task(implementRuntimeAndCliTask, {
      inputs,
      issueContext: compact(issueContext),
      reuseAudit: compact(reuseAudit),
      architecture: compact(architecture),
      regressionPlan: compact(regressionPlan),
      previousVerification: compact(verification),
      previousReview: compact(review),
      attempt,
    }, {
      key: `issue-573.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext: compact(issueContext),
      architecture: compact(architecture),
      regressionPlan: compact(regressionPlan),
      implementation: compact(implementation),
      attempt,
    }, {
      key: `issue-573.verification.${attempt}`,
    });

    review = await ctx.task(reviewRuntimeRecoveryTask, {
      inputs,
      issueContext: compact(issueContext),
      reuseAudit: compact(reuseAudit),
      architecture: compact(architecture),
      regressionPlan: compact(regressionPlan),
      implementation: compact(implementation),
      verification: compact(verification),
      attempt,
    }, {
      key: `issue-573.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const docsAndRecoveryGuidance = await ctx.task(updateDocsAndRecoveryGuidanceTask, {
    inputs,
    issueContext: compact(issueContext),
    architecture: compact(architecture),
    implementation: compact(implementation),
    verification: compact(verification),
    review: compact(review),
  }, {
    key: 'issue-573.docs-and-recovery-guidance',
  });

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext: compact(issueContext),
    reuseAudit: compact(reuseAudit),
    architecture: compact(architecture),
    regressionPlan: compact(regressionPlan),
    implementation: compact(implementation),
    verification: compact(verification),
    review: compact(review),
    docsAndRecoveryGuidance: compact(docsAndRecoveryGuidance),
    attempts,
  }, {
    key: 'issue-573.final-acceptance',
  });

  if (finalGate?.needsHumanDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #573 Final Acceptance Decision',
      question: finalGate.question ?? 'Final acceptance found a contract or verification concern. Review before declaring the implementation complete.',
      options: [
        'Iterate on the reported issues',
        'Pause for maintainer guidance',
      ],
      expert: 'maintainer',
      tags: ['issue-573', 'final-acceptance', 'sdk'],
      context: {
        runId: ctx.runId,
        finalGate,
      },
    });
  }

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-context',
      'reuse-audit',
      'runtime-and-recovery-architecture',
      'test-first-regression-plan',
      'implementation-and-repair-loop',
      'verification-gates',
      'runtime-recovery-review',
      'docs-and-recovery-guidance',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    issueContext,
    reuseAudit,
    architecture,
    regressionPlan,
    implementation,
    verification,
    review,
    docsAndRecoveryGuidance,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-573.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #573 and related SDK recovery context',
  labels: ['issue-573', 'sdk', 'research', 'issue-context'],
  agent: {
    name: 'sdk-runtime-architect',
    prompt: {
      role: 'senior TypeScript runtime engineer',
      task: 'Read the GitHub issue and produce the authoritative implementation contract for issue #573.',
      instructions: [
        'Do not edit files in this task.',
        `Run: gh issue view ${args.issueNumber ?? 573} --json title,body,labels,comments`,
        `If #${args.issueNumber ?? 573} is a PR rather than an issue, also run: gh pr view ${args.issueNumber ?? 573} --json files,title,body,comments`,
        'Read the issue body, labels, and every comment. Treat the issue thread as the source of truth.',
        'Inspect related issues only enough to preserve boundaries: #572, #191, and #132.',
        'Return JSON: { title, labels, issueSummary, commentsSummary, acceptanceCriteria, nonGoals, relatedIssues, riskLevel, targetSurfaces, openQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-573.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run reuse audit for runtime error and recovery surfaces',
  labels: ['issue-573', 'reuse-audit', 'sdk', 'runtime'],
  agent: {
    name: 'sdk-runtime-architect',
    prompt: {
      role: 'senior monorepo architect',
      task: 'Find existing runtime, journal, CLI, MCP, docs, and test surfaces to reuse before proposing new infrastructure.',
      instructions: [
        'Do not edit files in this task.',
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Report whether `.a5c/process-library/` exists. If absent, use the local `library/` methodology files listed in the inputs as methodology references.',
        'Search these terms and variants: PROCESS_RUNTIME_ERROR, process-error, process_runtime_error, RUN_FAILED, EFFECT_RESOLVED, effect_failed, run:recover-process-error, recover, repair-journal, rebuild-state, lifecycle, run state, task:post --status error.',
        'Inspect packages/sdk/src/runtime/orchestrateIteration.ts, runtime/types.ts, runtime/replay/effectIndex.ts, runtime/replay/stateCache.ts, runtime/runLifecycleState.ts, runtime/commitEffectResult.ts, runtime/intrinsics/taskHelpers.ts, cli/commands/runIterate.ts, cli/main/runCreate.ts, cli/main/program.ts, cli/main/argPositionals.ts, cli/main/dispatchRunSession.ts, cli/main/usage.ts, cli/render/events, mcp/tools/runs.ts, docs/reference, library/reference/sdk.md, and packages/sdk/src/prompts/templates.',
        'Identify the smallest set of surfaces that must change and any consumers that should deliberately ignore PROCESS_RUNTIME_ERROR.',
        'Return JSON: { processLibraryStatus, reusableRuntimeSurfaces, reusableCliSurfaces, reusableDocs, testFixturesToExtend, stateConsumers, risks, noNewInfrastructureNotes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designRuntimeAndRecoveryTask = defineTask('issue-573.design-runtime-and-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design typed process runtime error event and recovery CLI contract',
  labels: ['issue-573', 'architecture', 'sdk', 'recovery-cli'],
  agent: {
    name: 'sdk-runtime-architect',
    prompt: {
      role: 'senior SDK runtime architect',
      task: 'Design the smallest safe architecture for typed process runtime errors and targeted recovery.',
      instructions: [
        'Do not edit files in this task.',
        'Use the issue context and reuse audit as inputs.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Specify a durable PROCESS_RUNTIME_ERROR journal event payload with serialized error details, iteration metadata, runId/processId where available, last known journal head, and best-effort last requested/resolved effect metadata.',
        'Do not make PROCESS_RUNTIME_ERROR mean effect failure. Preserve EFFECT_RESOLVED status "error" as the effect_failed signal.',
        'Decide whether PROCESS_RUNTIME_ERROR is terminal for observed run state. Prefer recoverable failed state until the typed marker is recovered, and document any compatibility impacts.',
        'Design run:recover-process-error <runDir> with --json, --dry-run, and conservative mutation semantics. Include an option to patch the offending task result before recovery; if the proposed --patch-effect <effectId>:<jsonPath>=<json> grammar is inadequate, recommend a precise safer CLI grammar.',
        'Require backups or atomic journal rewrite when dropping/superseding the typed event. Avoid broad journal surgery.',
        'Specify how run:iterate, run:status, run:events, MCP run tools, TUI/observer/renderers, and state cache should expose the new classification.',
        'Call out optional onProcessError support as explicitly out of scope unless the issue owner requires it.',
        'Return JSON: { eventContract, recoveryCommandContract, stateModel, cliOutputContract, mcpContract, docsContract, compatibilityPlan, implementationOrder, needsMaintainerDecision, question }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionPlanTask = defineTask('issue-573.author-regression-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing regression test plan before implementation',
  labels: ['issue-573', 'tdd', 'tests'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Turn the issue and architecture into a test-first implementation checklist.',
      instructions: [
        'Do not edit production code in this task. If editing is needed, write only failing tests first.',
        'Use test-driven-development: specify tests before implementation, keep effect-failure and process-error semantics separate, and make every acceptance criterion executable.',
        'Architecture JSON:',
        JSON.stringify(args.architecture, null, 2),
        'Plan tests in packages/sdk/src/runtime/__tests__, packages/sdk/src/cli/__tests__/cliRuns.test.ts or nearby CLI tests, packages/sdk/src/mcp/__tests__/tools/runs.test.ts when MCP output changes, state/replay tests, and docs snapshot tests if relevant.',
        'Required positive tests: process code throws after consuming a malformed task result and journals PROCESS_RUNTIME_ERROR; run:iterate returns process_runtime_error details distinct from effect_failed; run:recover-process-error dry-run reports planned mutation; recovery with a patched result removes/supersedes only the typed error and rebuilds state; subsequent run:iterate proceeds.',
        'Required negative tests: recovery without patch can reset the marker but the next iterate rethrows honestly; effect status error remains effect_failed and is not converted into process_runtime_error; RUN_FAILED remains for infrastructure/runtime RunFailedError cases; no recovery occurs when no typed process error exists.',
        'Required edge tests: most recent lifecycle classification wins without losing older events; malformed patch paths or invalid JSON fail without mutation; journal backup/atomicity behavior is asserted where implemented.',
        'Return JSON: { failingTestsToAdd, fixtures, expectedPreFixFailures, targetTestFiles, testData, acceptanceTraceability, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementRuntimeAndCliTask = defineTask('issue-573.implement-runtime-and-cli', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement typed runtime error event, recovery CLI, and consumers',
  labels: ['issue-573', 'implementation', 'sdk', 'cli'],
  agent: {
    name: 'sdk-implementation-engineer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    prompt: {
      role: 'senior TypeScript SDK engineer',
      task: 'Implement issue #573 according to the architecture and regression plan.',
      instructions: [
        'Edit only files required for issue #573. Do not modify unrelated local changes.',
        `Base branch: ${args.inputs?.baseBranch ?? 'staging'}. Target branch: ${args.inputs?.targetBranch ?? 'agent/issue-573-process-runtime-error-recovery'}.`,
        `Implementation attempt: ${args.attempt}.`,
        'Follow the TDD plan: add or complete failing tests before production code where they do not already exist.',
        'Implement durable PROCESS_RUNTIME_ERROR journaling in the non-RunFailedError catch path of orchestrateIteration. Include serialized error details and useful recovery metadata without overfitting stack parsing.',
        'Keep EFFECT_RESOLVED status "error" behavior intact and visibly distinct in names, result status, CLI JSON, and docs.',
        'Update IterationResult/runtime types, state cache/replay/run lifecycle consumers, CLI run:iterate output, run:status/run:events/rendering, and MCP run tools as required by the architecture.',
        'Add run:recover-process-error beside run:rebuild-state and run:repair-journal. Register it in command validation, usage, positional parsing, dispatch, help, and suggestion surfaces. Support --json and --dry-run.',
        'Implement conservative recovery: locate the latest PROCESS_RUNTIME_ERROR, optionally patch/replace the named task result artifact, drop or supersede only the typed process-error marker using atomic filesystem operations and a backup, rebuild state, and report the recovered state.',
        'Avoid implementing defineProcess({ onProcessError }) unless the architecture explicitly makes it in scope.',
        'Update tests and fixtures until targeted gates pass.',
        'Return JSON: { changedFiles, eventPayloadSummary, recoveryCommandSummary, cliBehaviorSummary, testsAdded, knownLimitations, commandsRun, remainingFailures }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-573.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run issue #573 verification gates',
  labels: ['issue-573', 'verification', 'quality-gate'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'release-minded SDK test engineer',
      task: 'Run verification before completion and diagnose any failures.',
      instructions: [
        'Do not declare success without running the requested commands or documenting why a command cannot run.',
        'Run the targeted commands from inputs.verificationCommands in order.',
        'At minimum, cover targeted runtime tests, targeted CLI recovery tests, targeted MCP/status tests if changed, npm run build:sdk, npm run test:sdk, and npm run verify:metadata.',
        'For every failure, identify whether it is caused by the new implementation, pre-existing local changes, environment/dependency state, or an upstream unrelated failure.',
        'If failures are implementation-related, return passed: false with concrete repair instructions for the next implementation attempt.',
        'Return JSON: { passed, commands, failures, diagnosis, repairInstructions, coverageAgainstAcceptanceCriteria }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewRuntimeRecoveryTask = defineTask('issue-573.review-runtime-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review runtime recovery implementation for correctness',
  labels: ['issue-573', 'review', 'runtime', 'cli'],
  agent: {
    name: 'code-reviewer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    prompt: {
      role: 'senior SDK code reviewer',
      task: 'Review the issue #573 diff with a bug-risk-first stance.',
      instructions: [
        'Review the working tree diff and relevant unchanged call paths.',
        'Lead with blocking bugs, data loss risk, journal invariant violations, CLI compatibility regressions, and missing tests. Include file:line references.',
        'Verify PROCESS_RUNTIME_ERROR is durable, recoverable, and distinct from EFFECT_RESOLVED status "error".',
        'Verify recovery is conservative: it does not drop unrelated events, handles dry-run and JSON modes, creates backup/atomic writes as designed, rebuilds state, and fails closed on malformed patch inputs.',
        'Verify run state/status/event rendering/MCP consumers do not misclassify effect failures as process runtime errors or vice versa.',
        'Check for speculative onProcessError implementation, broad refactors, or unrelated source churn.',
        'Return JSON: { approved, findings, requiredFixes, missingTests, compatibilityRisks, dataIntegrityRisks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const updateDocsAndRecoveryGuidanceTask = defineTask('issue-573.update-docs-and-recovery-guidance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update SDK docs and operator recovery guidance',
  labels: ['issue-573', 'docs', 'recovery'],
  agent: {
    name: 'docs-reviewer',
    prompt: {
      role: 'technical documentation engineer',
      task: 'Document the new process exception recovery workflow and remove unsafe manual guidance.',
      instructions: [
        'Edit only documentation and prompt-template files required by issue #573.',
        'Add a "Recovering from a process exception" section to library/reference/sdk.md or the current equivalent SDK reference location.',
        'Document the distinction between process_runtime_error, effect_failed/EFFECT_RESOLVED status "error", shell command non-zero payloads, and RUN_FAILED infrastructure failures.',
        'Document run:recover-process-error dry-run, patching, recovery, rebuild behavior, and what happens if the original bad task result is not fixed.',
        'Update packages/sdk/src/prompts/templates/recovery.md and critical-rules.md so operators prefer the targeted CLI flow over manual journal edits.',
        'Update user-facing CLI reference/help docs when the new command appears in CLI usage.',
        'Return JSON: { changedFiles, docsSections, recoveryWorkflow, manualSurgeryReferencesRemoved, remainingDocsGaps }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-573.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance for issue #573',
  labels: ['issue-573', 'final-gate', 'acceptance'],
  agent: {
    name: 'sdk-runtime-architect',
    prompt: {
      role: 'principal SDK maintainer',
      task: 'Decide whether the implementation fully satisfies issue #573.',
      instructions: [
        'Inspect the final diff, verification results, review results, docs changes, and issue acceptance criteria.',
        'Pass only if all critical verification commands pass or any skipped command has a clear non-implementation reason, all blocking review findings are resolved, docs describe the new recovery flow, and no unrelated source files were changed.',
        'Confirm these acceptance points explicitly: durable PROCESS_RUNTIME_ERROR event, no conflation with effect_failed, first-class recovery CLI with dry-run/json and optional patching, state rebuild after recovery, honest rethrow when bad result remains, updated docs and prompts, and tests for positive/negative/edge cases.',
        'Return JSON: { passed, changedFiles, acceptanceCriteriaStatus, qualityGateStatus, unresolvedRisks, releaseNoteCandidate, needsHumanDecision, question }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
