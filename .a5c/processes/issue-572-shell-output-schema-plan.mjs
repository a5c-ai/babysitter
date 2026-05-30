/**
 * @process repo/issue-572-shell-output-schema-plan
 * @description Implementation process for issue #572: extend shell task outputSchema support and enforce posted values in the shared SDK result commit path.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[], processLibraryResearch: object }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object, finalGate: object }
 *
 * References used while authoring:
 * - gh issue view 572 --json title,body,labels,comments
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-reference/runtime-and-layout.md
 * - docs/agent-reference/command-surfaces.md
 * - library/reference/sdk.md
 * - packages/sdk/src/runtime/commitEffectResult.ts
 * - packages/sdk/src/runtime/schemaValidator.ts
 * - packages/sdk/src/runtime/types.ts
 * - packages/sdk/src/tasks/types.ts
 * - packages/sdk/src/tasks/serializer.ts
 * - packages/sdk/src/storage/tasks.ts
 * - packages/sdk/src/cli/main/taskCommands.ts
 * - packages/sdk/src/mcp/tools/tasks.ts
 * - packages/sdk/src/runtime/__tests__/commitEffectResult.test.ts
 * - packages/sdk/src/cli/__tests__/cliMain.test.ts
 * - packages/sdk/src/mcp/__tests__/integration.test.ts
 *
 * Process-library references used:
 * - .a5c/process-library/ was requested but is not present in this checkout.
 * - Used in-repo shared process components as local process-library analogues:
 *   library/processes/shared/prior-attempts-scanner.js
 *   library/processes/shared/completeness-gate.js
 *   library/processes/shared/deterministic-quality-gate.js
 *   library/processes/shared/tdd-triplet.js
 *
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process methodologies/v-model
 * @process cradle/feature-implementation-contribute
 * @agent architect methodologies/maestro/agents/architect/AGENT.md
 * @agent coder methodologies/maestro/agents/coder/AGENT.md
 * @agent test-engineer methodologies/maestro/agents/test-engineer/AGENT.md
 * @agent code-reviewer methodologies/maestro/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 572;

  const reuseAudit = await ctx.task(reuseAuditTask, {
    ...inputs,
    issueNumber,
  }, {
    key: 'issue-572.reuse-audit',
  });

  const issueContext = await ctx.task(readIssueContextTask, {
    ...inputs,
    issueNumber,
    reuseAudit,
  }, {
    key: 'issue-572.read-issue-context',
  });

  const architectureMap = await ctx.task(mapCurrentArchitectureTask, {
    inputs,
    reuseAudit,
    issueContext,
  }, {
    key: 'issue-572.map-current-architecture',
  });

  const contractDesign = await ctx.task(designSchemaContractTask, {
    inputs,
    issueContext,
    architectureMap,
  }, {
    key: 'issue-572.design-schema-contract',
  });

  if (contractDesign?.requiresMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #572 Shell outputSchema Contract Decision',
      question: contractDesign.question ?? 'Choose the compatibility contract for shell outputSchema validation before implementation continues.',
      options: [
        'Apply recommended shared commit-path contract',
        'Pause for maintainer guidance',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-572', 'sdk-contract'],
      context: {
        runId: ctx.runId,
        contractDesign,
      },
    });
  }

  const regressionPlan = await ctx.task(authorRegressionPlanTask, {
    inputs,
    issueContext,
    architectureMap,
    contractDesign,
  }, {
    key: 'issue-572.author-regression-plan',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementSdkValidationTask, {
      inputs,
      issueContext,
      architectureMap,
      contractDesign,
      regressionPlan,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-572.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      architectureMap,
      contractDesign,
      regressionPlan,
      implementation,
      attempt,
    }, {
      key: `issue-572.verification.${attempt}`,
    });

    review = await ctx.task(reviewImplementationTask, {
      inputs,
      issueContext,
      architectureMap,
      contractDesign,
      regressionPlan,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-572.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const docsAndLibrarySweep = await ctx.task(docsAndLibrarySweepTask, {
    inputs,
    issueContext,
    architectureMap,
    contractDesign,
    implementation,
    verification,
    review,
  }, {
    key: 'issue-572.docs-and-library-sweep',
  });

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    reuseAudit,
    issueContext,
    architectureMap,
    contractDesign,
    regressionPlan,
    implementation,
    verification,
    review,
    docsAndLibrarySweep,
    attempts,
  }, {
    key: 'issue-572.final-acceptance',
  });

  if (finalGate?.needsHumanDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #572 Final Acceptance Needs Maintainer Decision',
      question: finalGate.question ?? 'Final acceptance found an unresolved SDK behavior or compatibility decision.',
      options: [
        'Proceed with documented remaining follow-up',
        'Pause for maintainer guidance',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-572', 'final-acceptance'],
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
      'reuse-audit',
      'issue-context',
      'architecture-map',
      'schema-contract-design',
      'regression-plan',
      'implementation-loop',
      'verification-gate',
      'implementation-review',
      'docs-and-library-sweep',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    reuseAudit,
    issueContext,
    architectureMap,
    contractDesign,
    regressionPlan,
    implementation,
    verification,
    review,
    docsAndLibrarySweep,
    attempts,
    finalGate,
  };
}

export const reuseAuditTask = defineTask('issue-572.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 reuse audit for shell outputSchema validation',
  labels: ['issue-572', 'reuse-audit', 'sdk'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'senior SDK architect performing the repo-required reuse audit',
      task: 'Find existing infrastructure that should be reused before planning or implementing outputSchema validation for shell task results.',
      instructions: [
        'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract keyword nouns and verbs from the request: shell task, outputSchema, task:post, commitEffectResult, result.json, EFFECT_RESOLVED, schemaValidator, validation_error, resultRef, task definition.',
        'If .a5c/reuse-audit.json exists, honor its scan globs and keyword rules.',
        'Scan the SDK, docs, and in-repo process-library analogues for matching migrations, helpers, validators, schema APIs, CLI surfaces, MCP surfaces, and task serializers.',
        'Explicitly note that .a5c/process-library/ is absent if it is still absent at execution time, then use library/processes/shared as a local process-library analogue.',
        'Identify existing validation code that can be reused instead of introducing a new validator dependency.',
        'Return JSON: { keywords, findings, reusableSurfaces, noMatchingInfrastructureFound, processLibraryStatus, recommendedReuse, risks }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['keywords', 'findings', 'reusableSurfaces', 'processLibraryStatus', 'recommendedReuse'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const readIssueContextTask = defineTask('issue-572.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #572 and confirm scope',
  labels: ['issue-572', 'sdk', 'research'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'senior Babysitter SDK maintainer',
      task: 'Read the full GitHub issue context and convert it into acceptance criteria and non-goals.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Confirm #${args.issueNumber} is not a PR with: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Read every comment and label carefully. Treat the issue description plus triage comment as source of truth.',
        'Capture the triage refinement that validation belongs in the shared SDK commit path, not only the CLI wrapper.',
        'Capture the real-run failure mode: malformed shell JSON reached process code and caused a downstream TypeError.',
        'Return JSON: { title, labels, issueSummary, commentsSummary, acceptanceCriteria, nonGoals, risks, explicitDecisionsNeeded }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'labels', 'acceptanceCriteria', 'nonGoals', 'risks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const mapCurrentArchitectureTask = defineTask('issue-572.map-current-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map current task result commit architecture',
  labels: ['issue-572', 'sdk', 'architecture'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'senior TypeScript SDK architect',
      task: 'Map the exact current data flow for task definitions, task:post values, result serialization, and replay consumption.',
      instructions: [
        'Inspect the target files from inputs first, then follow imports only as needed.',
        'Required files to inspect include packages/sdk/src/runtime/commitEffectResult.ts, packages/sdk/src/runtime/schemaValidator.ts, packages/sdk/src/tasks/types.ts, packages/sdk/src/tasks/serializer.ts, packages/sdk/src/storage/tasks.ts, packages/sdk/src/cli/main/taskCommands.ts, packages/sdk/src/mcp/tools/tasks.ts, and packages/sdk/src/runtime/intrinsics/taskHelpers.ts.',
        'Explain where task definitions are written and read, where arbitrary task fields are preserved, where values may spill through resultRef, and where process replay returns result.value.',
        'Identify whether agent outputSchema currently lives in agent options, top-level task definitions, or both.',
        'Identify the narrowest implementation surface that covers CLI, MCP, tests, and direct SDK callers.',
        'Return JSON: { currentFlow, reusableValidator, targetFiles, sharedCommitPath, serializationNotes, replayNotes, compatibilityRisks }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['currentFlow', 'reusableValidator', 'targetFiles', 'sharedCommitPath', 'compatibilityRisks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designSchemaContractTask = defineTask('issue-572.design-schema-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design shell outputSchema enforcement contract',
  labels: ['issue-572', 'sdk', 'api-design'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'senior SDK API designer',
      task: 'Define the backward-compatible SDK contract for shell task outputSchema and posted result validation.',
      instructions: [
        'Design the public task-definition shape for shell outputSchema. Prefer a top-level outputSchema on TaskDef for non-agent task kinds, with outputSchema: false or absence meaning no validation.',
        'Decide how to avoid breaking existing agent tasks that use agent.outputSchema for agent-platform structured output handling.',
        'Design shared commit-path validation in commitEffectResult after effect lookup/invocation-key checks and before task.completed hooks, result.json writes, EFFECT_RESOLVED events, registry updates, or state-cache rebuilds.',
        'Specify how to load the requested task definition with readTaskDefinition and how to select the applicable schema for kind: "shell".',
        'Specify validation error behavior: reject the post with RunFailedError, structured error data including reason "validation_error", effectId, taskId, kind, schema path or field errors, and no result/journal mutation.',
        'Explicitly decide whether validation applies only to successful result values or also to CLI-normalized shell failure values. Preserve current no-schema behavior for shell failures.',
        'Include compatibility handling for absent task.json or outputSchema: false.',
        'Return JSON: { apiContract, validationPoint, errorContract, shellFailurePolicy, compatibilityRules, requiresMaintainerDecision, question, nonGoals }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['apiContract', 'validationPoint', 'errorContract', 'shellFailurePolicy', 'compatibilityRules', 'requiresMaintainerDecision', 'nonGoals'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionPlanTask = defineTask('issue-572.author-regression-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing regression plan',
  labels: ['issue-572', 'sdk', 'tests', 'tdd'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'senior SDK test engineer',
      task: 'Plan the red tests that should be added before implementation.',
      instructions: [
        'Use the issue context, architecture map, and schema contract.',
        'Plan commitEffectResult unit tests proving a shell task with outputSchema rejects a missing required field before writing result.json or appending EFFECT_RESOLVED.',
        'Plan positive unit tests proving the same schema accepts a valid value and replay/process consumers can read the required fields.',
        'Plan compatibility tests proving absent outputSchema and outputSchema: false preserve current behavior.',
        'Plan CLI task:post coverage that proves a rejected --value-inline or --value post exits non-zero and surfaces a structured validation_error without committing.',
        'Plan MCP/direct SDK coverage only if the shared commitEffectResult tests do not already prove non-CLI callers inherit the behavior.',
        'Plan type/serializer tests proving the shell task definition can declare outputSchema and task.json preserves it.',
        'Return JSON: { redTests, positiveTests, compatibilityTests, cliTests, typeAndSerializerTests, expectedInitialFailures, fixturesNeeded }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['redTests', 'positiveTests', 'compatibilityTests', 'cliTests', 'expectedInitialFailures'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementSdkValidationTask = defineTask('issue-572.implement-sdk-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement SDK shell outputSchema validation',
  labels: ['issue-572', 'sdk', 'implementation'],
  agent: {
    name: 'coder',
    prompt: {
      role: 'senior TypeScript SDK engineer',
      task: 'Implement issue #572 using the approved regression plan and schema contract.',
      instructions: [
        'Do not broaden the issue into a full task-definition redesign.',
        'Start by adding the failing tests from the regression plan, then implement the minimum code needed to pass them.',
        'Update TaskDef/type surfaces so shell task definitions can intentionally declare outputSchema and outputSchema: false without relying on an index signature.',
        'Use the existing validateAgainstSchema implementation from packages/sdk/src/runtime/schemaValidator.ts unless the contract design found a blocking limitation.',
        'Implement validation in packages/sdk/src/runtime/commitEffectResult.ts so CLI task:post, MCP task_post, testing harnesses, and direct SDK callers share the invariant.',
        'Validate before task.completed hooks and before any result artifact or journal mutation.',
        'Ensure validation checks the actual in-memory result value before serialization and therefore before resultRef spill behavior.',
        'Make validation errors actionable and structured; include missing/wrong-typed field messages from the existing schema validator.',
        'Update docs in library/reference/sdk.md and docs/agent-reference/process-authoring.md, plus prompt/user-guide references if needed.',
        'Return JSON: { changedFiles, implementationSummary, validationBehavior, docsUpdated, testsAdded, compatibilityNotes, unresolvedQuestions }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'implementationSummary', 'validationBehavior', 'testsAdded', 'compatibilityNotes'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-572.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run SDK verification gate',
  labels: ['issue-572', 'sdk', 'verification'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'senior SDK verification engineer',
      task: 'Run the targeted and full verification commands for issue #572 and report exact evidence.',
      instructions: [
        'Run targeted tests first, including commitEffectResult, task intrinsic or serializer tests if changed, CLI task:post tests if changed, and MCP task_post tests if changed.',
        'Run the verification commands from inputs.verificationCommands.',
        'Run git diff --check.',
        'If a command fails, capture the exact command, exit status, and relevant failure lines. Determine whether the failure is caused by this change or pre-existing/unrelated.',
        'Confirm rejected schema posts leave no result.json and no EFFECT_RESOLVED event.',
        'Return JSON: { passed, commands, failures, mutationSafetyEvidence, coverageNotes, retryRecommendations }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'commands', 'failures', 'mutationSafetyEvidence', 'coverageNotes'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewImplementationTask = defineTask('issue-572.review-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review SDK validation implementation',
  labels: ['issue-572', 'sdk', 'review'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'senior SDK code reviewer',
      task: 'Review the implementation for behavioral regressions, public API risk, and missing tests.',
      instructions: [
        'Review the diff against the issue acceptance criteria and contract design.',
        'Prioritize bugs, compatibility regressions, mutation ordering problems, and missing tests.',
        'Check that validation is in the shared commit path and not only in taskCommands.ts.',
        'Check that schema validation happens before task.completed hooks, result writes, EFFECT_RESOLVED, registry updates, and state-cache rebuilds.',
        'Check CLI/MCP/direct SDK behavior remains consistent because they all call commitEffectResult.',
        'Check outputSchema: false and absence preserve current behavior.',
        'Check docs clearly show shell task outputSchema examples and task:post rejection behavior.',
        'Return JSON: { approved, findings, requiredFixes, missingTests, compatibilityRisks, docsRisks }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'findings', 'requiredFixes', 'missingTests', 'compatibilityRisks'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const docsAndLibrarySweepTask = defineTask('issue-572.docs-and-library-sweep', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Docs and shared process shell-schema sweep',
  labels: ['issue-572', 'docs', 'process-library'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'senior documentation and process-library maintainer',
      task: 'Verify docs are updated and assess existing shared shell task helpers for follow-up schemas.',
      instructions: [
        'Confirm library/reference/sdk.md and docs/agent-reference/process-authoring.md explain shell outputSchema and task:post validation failures.',
        'Check prompt templates and user docs that show shell task examples; update if needed so new examples show outputSchema when a shell task returns JSON consumed downstream.',
        'Scan library/processes/shared/*.js for kind: "shell" task helpers including prior-attempts-scanner, completeness-gate, cost-aggregation, tdd-triplet, forbidden-markers-scanner, deterministic-quality-gate, ts-check, and related helpers.',
        'Do not expand implementation beyond issue scope unless the issue implementation already touched a helper. Produce a concrete follow-up list for helpers that should gain schemas separately.',
        'Return JSON: { docsComplete, docsChanged, sharedShellHelpersReviewed, followUpSchemas, blockers }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['docsComplete', 'docsChanged', 'sharedShellHelpersReviewed', 'followUpSchemas', 'blockers'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-572.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance for issue #572',
  labels: ['issue-572', 'sdk', 'acceptance'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'senior maintainer performing final acceptance',
      task: 'Decide whether the issue #572 implementation is ready to PR.',
      instructions: [
        'Check every acceptance criterion from the issue and triage comment.',
        'Confirm only source/docs/test files required by the implementation were changed; do not count planning artifacts.',
        'Confirm no unrelated local changes were included.',
        'Confirm the verification gate passed or any unrelated failures are documented with exact evidence.',
        'Confirm the PR body should mention shared commit-path enforcement, shell task outputSchema contract, mutation-before-rejection safety, docs, and tests.',
        'Return JSON: { passed, needsHumanDecision, question, changedFiles, acceptanceStatus, qualityGates, residualRisks, prSummary }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'needsHumanDecision', 'changedFiles', 'acceptanceStatus', 'qualityGates', 'residualRisks', 'prSummary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
