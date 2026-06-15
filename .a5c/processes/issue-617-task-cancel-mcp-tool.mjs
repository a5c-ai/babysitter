/**
 * @process repo/issue-617-task-cancel-mcp-tool
 * @description Implement issue #617: expose pending-effect cancellation through the SDK MCP task_cancel tool.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - library/specializations/cli-mcp-development/processes-backlog.md#6-mcp-tool-implementation
 * - library/specializations/sdk-platform-development/processes-backlog.md#13-sdk-testing-strategy
 * - library/processes/shared/tdd-triplet.js
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueContext = await ctx.task(readIssueContextTask, inputs, {
    key: 'issue-617.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-617.reuse-audit',
  });

  const cancellationTrace = await ctx.task(traceCancellationSurfacesTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-617.trace-cancellation-surfaces',
  });

  const regressionTests = await ctx.task(authorRegressionTestsTask, {
    inputs,
    issueContext,
    reuseAudit,
    cancellationTrace,
  }, {
    key: 'issue-617.author-regression-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt += 1) {
    implementation = await ctx.task(implementTaskCancelTask, {
      inputs,
      issueContext,
      reuseAudit,
      cancellationTrace,
      regressionTests,
      attempt,
      previousVerification: verification,
      previousReview: review,
    }, {
      key: `issue-617.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      cancellationTrace,
      regressionTests,
      implementation,
      attempt,
    }, {
      key: `issue-617.verification.${attempt}`,
    });

    review = await ctx.task(reviewCancellationImplementationTask, {
      inputs,
      issueContext,
      reuseAudit,
      cancellationTrace,
      regressionTests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-617.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });
    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    reuseAudit,
    cancellationTrace,
    regressionTests,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-617.final-acceptance',
  });

  if (finalGate?.needsHumanDecision) {
    await ctx.breakpoint({
      title: 'Issue #617 Cancellation Contract Needs Maintainer Decision',
      question: finalGate.question,
      options: ['Use recommended existing cancellation contract', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-617', 'mcp', 'cancellation'],
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
      'reuse-audit',
      'cancellation-surface-trace',
      'regression-tests',
      'focused-implementation',
      'verification-loop',
      'review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-617.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #617 and related cancellation context',
  labels: ['sdk', 'mcp', 'research', 'issue-context'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK MCP engineer',
      task: 'Read the GitHub issue and produce the authoritative implementation spec for this run.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} resolves to a PR instead of an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Use the issue body, comments, and labels as the source of truth.',
        'Pay close attention to related issues #577 and #596, the plugin-mode design doc, and the triage note that runtime and CLI cancellation already exist.',
        'Return JSON: { title, labels, rawIssue, comments, severity, acceptanceCriteria, nonGoals, relatedIssues, targetFilesFromIssue, implementationNotes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-617.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run reuse audit before implementation planning',
  labels: ['sdk', 'mcp', 'reuse-audit', 'architecture'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior SDK maintainer',
      task: 'Audit existing cancellation infrastructure before proposing or making changes.',
      instructions: [
        'Render this exact heading before the findings: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract nouns and verbs from the issue prompt: task_cancel, MCP tool, cancel, cancellation, pending effect, EFFECT_CANCELLED, task_post, task_list, task_show, run_status, ctx.task.',
        'Scan for matching SDK runtime, MCP, CLI, storage, tests, docs, imports, schemas, and generated command surfaces.',
        'Honor .a5c/reuse-audit.json if present; if absent, state that repo default scan globs were used.',
        'Start from these known reuse findings gathered during planning:',
        JSON.stringify(args.inputs.reuseAuditFindings ?? [], null, 2),
        'Confirm whether commitEffectCancellation, EFFECT_CANCELLED handling, task:cancel CLI coverage, run_status cancellation handling, EffectCancelledError, and StoredTaskResult.status="cancelled" already exist.',
        'Identify the smallest implementation path that reuses existing cancellation support instead of duplicating CLI logic.',
        'Return JSON: { headingRendered: true, existingInfrastructure, missingSurfaces, filesToChange, filesToAvoid, risks, recommendedReusePath }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceCancellationSurfacesTask = defineTask('issue-617.trace-cancellation-surfaces', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace MCP task and runtime cancellation surfaces',
  labels: ['sdk', 'mcp', 'runtime', 'root-cause'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK runtime engineer',
      task: 'Trace the current cancellation behavior and decide the exact implementation boundary.',
      instructions: [
        'Work from the issue context and reuse-audit JSON below.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Inspect these target files first, then follow imports/callers as needed:',
        JSON.stringify(args.inputs.targetFiles, null, 2),
        'Specifically inspect packages/sdk/src/mcp/tools/tasks.ts, packages/sdk/src/mcp/tools/runs.ts, packages/sdk/src/mcp/__tests__/server.test.ts, packages/sdk/src/mcp/__tests__/tools/tasks.test.ts, packages/sdk/src/mcp/__tests__/integration.test.ts, packages/sdk/src/runtime/commitEffectResult.ts, packages/sdk/src/runtime/intrinsics/taskHelpers.ts, packages/sdk/src/runtime/replay/effectIndex.ts, packages/sdk/src/storage/types.ts, and packages/sdk/src/cli/main/taskCommands.ts.',
        'Determine whether issue #617 still needs journal or orchestrateIteration changes, or whether the current code already covers those through existing cancellation support. Do not create redundant event abstractions if the storage/runtime contract already exists.',
        'Define the public MCP contract for task_cancel: arguments, optional reason, runsDir behavior, success result shape, and error behavior for unknown or non-requested effects.',
        'Return JSON: { rootCause, existingCancellationContract, mcpContract, targetImplementationFiles, testFiles, docsFiles, noChangeAreas, risks, outOfScope }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionTestsTask = defineTask('issue-617.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author MCP cancellation regression tests first',
  labels: ['sdk', 'mcp', 'tests', 'tdd'],
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'senior TypeScript MCP test engineer',
      task: 'Add failing regression coverage for issue #617 before implementation changes.',
      instructions: [
        'You own test files only. Do not modify implementation files in this task.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Cancellation trace JSON:',
        JSON.stringify(args.cancellationTrace, null, 2),
        'Add unit coverage in packages/sdk/src/mcp/__tests__/tools/tasks.test.ts proving task_cancel is registered by registerTaskTools, calls commitEffectCancellation with runDir/effectId/reason, returns { status: "cancelled", effectId, resultRef }, and returns toolError for cancellation failures.',
        'Update task_list tests so EFFECT_CANCELLED makes a task status "cancelled" and excludes it from pendingOnly and pendingCount.',
        'Update task_show tests so cancelled effects load and return result.json, not null.',
        'Update packages/sdk/src/mcp/__tests__/server.test.ts expected tool list/count from 15 to 16 and include task_cancel.',
        'Add integration coverage in packages/sdk/src/mcp/__tests__/integration.test.ts proving task_cancel appends EFFECT_CANCELLED, writes a cancelled task result with the reason, removes the effect from task_list pendingOnly and run_status pendingEffects, and leaves already resolved or unknown effects as MCP errors.',
        'If runtime replay cancellation propagation lacks coverage after tracing, add a focused runtime test showing replaying a cancelled ctx.task throws EffectCancelledError with effectId/reason. Do this only if the gap is real.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, commandsToRun, coverageMap, notes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementTaskCancelTask = defineTask('issue-617.implement-task-cancel', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement task_cancel MCP support attempt ${args.attempt}`,
  labels: ['sdk', 'mcp', 'implementation', 'feature'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'senior Babysitter SDK MCP engineer',
      task: 'Implement the focused issue #617 fix.',
      instructions: [
        'You own only the SDK MCP/runtime files directly required by the trace and any directly related docs. Do not weaken or rewrite regression tests to fit the implementation.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Cancellation trace JSON:',
        JSON.stringify(args.cancellationTrace, null, 2),
        'Regression test context JSON:',
        JSON.stringify(args.regressionTests, null, 2),
        'Previous verification JSON:',
        JSON.stringify(args.previousVerification, null, 2),
        'Previous review JSON:',
        JSON.stringify(args.previousReview, null, 2),
        'Add task_cancel in packages/sdk/src/mcp/tools/tasks.ts with args: runId, effectId, optional reason, optional runsDir.',
        'Import and call commitEffectCancellation from packages/sdk/src/runtime/commitEffectResult. Do not duplicate task:cancel CLI effect-index checks unless the shared runtime helper cannot express the needed invariant.',
        'Return a toolResult containing status: "cancelled", effectId, resultRef, and reason when provided. Convert thrown errors to toolError consistently with task_post.',
        'Update buildTaskList in tasks.ts to treat EFFECT_CANCELLED as terminal with status "cancelled", include cancelledAt or resolvedAt timing, keep pendingCount based only on status "pending", and preserve resolved behavior.',
        'Update task_show to load result files for all terminal states, including cancelled.',
        'If taskHelpers currently rehydrates cancelled results as a generic failure instead of EffectCancelledError, route stored.status === "cancelled" through the existing EffectCancelledError class with the stored reason. Keep this change narrowly scoped.',
        'Do not change unrelated plugin-mode external dispatch, tasks-mux, run creation, CLI command names, journal layout, or process authoring behavior.',
        'Return JSON: { changedFiles, summary, mcpContract, runtimeSemantics, testsExpectedToPass, risksHandled }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-617.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run SDK MCP cancellation verification gate attempt ${args.attempt}`,
  labels: ['sdk', 'mcp', 'verification', 'quality-gate'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior SDK verification engineer',
      task: 'Run objective verification commands and report exact results.',
      instructions: [
        'Run the commands below from the repository root. Do not skip failing checks; capture command, exit code, and concise failure output.',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'Also run any narrower failing test commands listed by the regression test task before the broad suite, if those commands are not already included.',
        'Confirm the registered MCP tool count is 16, task_cancel appears in the server tool list, task_list pendingOnly excludes cancelled effects, task_show returns cancelled result data, run_status has no pending effect after cancellation, and runtime replay throws EffectCancelledError if that gap required implementation.',
        'Return JSON: { passed, commands: [{ command, exitCode, passed, outputSummary }], failures, coverageConfirmed, skippedCommands, environmentNotes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewCancellationImplementationTask = defineTask('issue-617.review-cancellation-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review task_cancel implementation attempt ${args.attempt}`,
  labels: ['sdk', 'mcp', 'review', 'risk'],
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'adversarial SDK MCP reviewer',
      task: 'Review the implementation for correctness, scope, and regression coverage.',
      instructions: [
        'Review source and tests changed for issue #617. Focus on bugs, behavioral regressions, missing tests, and contract drift.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Cancellation trace JSON:',
        JSON.stringify(args.cancellationTrace, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Check that the implementation reuses commitEffectCancellation, preserves task_post behavior, avoids duplicate cancellation paths, keeps run_status and task_list semantics aligned, and does not invent unrelated tasks-mux behavior.',
        'Check that all new statuses are typed consistently and that cancelled results cannot remain pending in MCP clients.',
        'Return JSON: { approved, findings: [{ severity, file, line, issue, recommendation }], missingTests, contractRisks, requiredFollowUps }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-617.final-acceptance-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #617',
  labels: ['sdk', 'mcp', 'acceptance', 'quality-gate'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'release-minded SDK maintainer',
      task: 'Decide whether issue #617 is complete and ready for PR handoff.',
      instructions: [
        'Evaluate the entire run against the acceptance focus and non-goals.',
        'Inputs JSON:',
        JSON.stringify(args.inputs, null, 2),
        'Reuse audit JSON:',
        JSON.stringify(args.reuseAudit, null, 2),
        'Cancellation trace JSON:',
        JSON.stringify(args.cancellationTrace, null, 2),
        'Regression tests JSON:',
        JSON.stringify(args.regressionTests, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification, null, 2),
        'Review JSON:',
        JSON.stringify(args.review, null, 2),
        'Attempts JSON:',
        JSON.stringify(args.attempts, null, 2),
        'Pass only if task_cancel is implemented, cancelled effects are terminal in MCP task views, cancellation errors propagate through ctx.task when replayed, all objective verification commands pass or have justified environment-only skips, and review has no blockers.',
        'If there is a real product/API ambiguity, set needsHumanDecision true and provide one concise question. Otherwise do not require a breakpoint.',
        'Return JSON: { passed, needsHumanDecision, question, changedFiles, acceptanceEvidence, unresolvedRisks, recommendedPRSummary }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
