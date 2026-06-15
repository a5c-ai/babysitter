/**
 * @process repo/issue-635-sdk-task-responder-type-plan
 * @description Implementation process for issue #635: add responderType routing intent to SDK defineTask task definitions.
 * @inputs { issueNumber: number, baseBranch: string, targetBranch: string, targetFiles: string[], verificationCommands: string[], relatedIssues: number[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object, dependencyStatus: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - docs/adapters-babysitter-integrations/tasks-mux-routing.md
 * - docs/adapters-babysitter-integrations/external-agent-tasks.md
 * - packages/sdk/src/tasks/types.ts
 * - packages/sdk/src/tasks/defineTask.ts
 * - packages/sdk/src/tasks/kinds/index.ts
 * - packages/sdk/src/tasks/__tests__/defineTask.test.ts
 * - packages/sdk/src/tasks/__tests__/kinds.test.ts
 *
 * Process-library references used:
 * - methodologies/superpowers/test-driven-development.js
 * - methodologies/superpowers/verification-before-completion.js
 * - methodologies/v-model/v-model.js
 * - cradle/feature-implementation-contribute.js
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
  const issueNumber = inputs?.issueNumber ?? 635;

  const issueContext = await ctx.task(readIssueContextTask, {
    ...inputs,
    issueNumber,
  }, {
    key: 'issue-635.read-issue-context',
  });

  const dependencyStatus = await ctx.task(checkFoundationDependencyTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-635.check-foundation-dependency',
  });

  if (dependencyStatus?.requiresMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #635 Foundational Dependency Decision',
      question: dependencyStatus.question ?? 'The foundational tasks-mux routing work appears unresolved or has an incompatible contract. Choose how to proceed.',
      options: ['Proceed with SDK-only compatibility shim', 'Pause for foundational work to land'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-635', 'dependency'],
      context: {
        runId: ctx.runId,
        dependencyStatus,
        relatedIssues: inputs?.relatedIssues ?? [630, 620, 603],
      },
    });
  }

  const apiPlan = await ctx.task(designSdkApiTask, {
    inputs,
    issueContext,
    dependencyStatus,
  }, {
    key: 'issue-635.design-sdk-api',
  });

  const regressionPlan = await ctx.task(authorRegressionPlanTask, {
    inputs,
    issueContext,
    dependencyStatus,
    apiPlan,
  }, {
    key: 'issue-635.author-regression-plan',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt++) {
    implementation = await ctx.task(implementSdkRoutingTypesTask, {
      inputs,
      issueContext,
      dependencyStatus,
      apiPlan,
      regressionPlan,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-635.implementation.${attempt}`,
    });

    verification = await ctx.task(runVerificationGateTask, {
      inputs,
      issueContext,
      dependencyStatus,
      apiPlan,
      regressionPlan,
      implementation,
      attempt,
    }, {
      key: `issue-635.verification.${attempt}`,
    });

    review = await ctx.task(reviewCompatibilityTask, {
      inputs,
      issueContext,
      dependencyStatus,
      apiPlan,
      regressionPlan,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-635.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    dependencyStatus,
    apiPlan,
    regressionPlan,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-635.final-acceptance',
  });

  if (finalGate?.needsHumanDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #635 Final Acceptance Needs Maintainer Decision',
      question: finalGate.question ?? 'Final acceptance found an unresolved SDK API or dependency decision.',
      options: ['Proceed with recommended final shape', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['approval-gate', 'issue-635', 'final-acceptance'],
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
      'foundation-dependency-check',
      'sdk-api-design',
      'regression-plan',
      'implementation-loop',
      'verification-gate',
      'compatibility-review',
      'final-acceptance',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    dependencyStatus,
    apiPlan,
    regressionPlan,
    verification,
    review,
    attempts,
    finalGate,
  };
}

export const readIssueContextTask = defineTask('issue-635.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #635 and SDK task-definition context',
  labels: ['issue-635', 'sdk', 'tasks-mux', 'research'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'senior Babysitter SDK architect',
      task: 'Read the issue, related design docs, and current SDK task-definition code before any implementation.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Confirm #${args.issueNumber} is not a PR with: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Read all issue comments and labels carefully. Treat the issue and comments as the source of truth.',
        'Inspect the related issues mentioned in the issue only enough to determine scope boundaries, especially #603, #620, and #630.',
        'Inspect these docs for the intended API and migration direction: docs/adapters-babysitter-integrations/tasks-mux-routing.md, docs/adapters-babysitter-integrations/external-agent-tasks.md, docs/adapters-babysitter-integrations/overview.md, docs/adapters-babysitter-integrations/testing.md.',
        'Inspect these current code/test files first, then follow exports/imports as needed:',
        JSON.stringify(args.targetFiles ?? [], null, 2),
        'Identify every current SDK task helper/export/test surface that must change, and explicitly separate #635 SDK work from tasks-mux consumption work in #630/#620.',
        'Return JSON: { title, labels, issueSummary, commentsSummary, acceptanceCriteria, nonGoals, relatedIssues, currentCodeMap, docsDesignMap, targetFiles, openQuestions }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['acceptanceCriteria', 'nonGoals', 'currentCodeMap', 'targetFiles'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const checkFoundationDependencyTask = defineTask('issue-635.check-foundation-dependency', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check parallel foundational routing dependency',
  labels: ['issue-635', 'tasks-mux', 'dependency', 'risk'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'senior integration architect',
      task: 'Determine how parallel foundational tasks-mux work affects the SDK-only implementation for #635.',
      instructions: [
        'Use the issue context JSON below and inspect related issue/PR state as needed.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'Run GitHub queries for related issues and open PRs mentioning responderType, tasks-mux routing, #630, #620, and #603.',
        'Check whether any branch or open PR already adds ResponderType, AgentTaskOptions, BreakpointTaskOptions, externalAgentTask, humanTask, autoTask, or adapter validation.',
        'If foundational work is absent, plan a backward-compatible SDK implementation that stores typed routing metadata without requiring tasks-mux runtime consumption.',
        'If foundational work defines incompatible field names, flag a maintainer decision instead of inventing a divergent API.',
        'Return JSON: { status: "clear"|"blocked"|"needs-decision", relatedWork: array, contractAssumptions: array, requiresMaintainerDecision: boolean, question?: string, mitigationPlan: string }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'contractAssumptions', 'requiresMaintainerDecision', 'mitigationPlan'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designSdkApiTask = defineTask('issue-635.design-sdk-api', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design SDK responderType API changes',
  labels: ['issue-635', 'sdk', 'api-design'],
  agent: {
    name: 'architect',
    prompt: {
      role: 'senior TypeScript SDK API designer',
      task: 'Create a focused implementation design for responderType on SDK task definitions.',
      instructions: [
        'Use the issue context and dependency status as the authoritative scope.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'Dependency status JSON:',
        JSON.stringify(args.dependencyStatus ?? {}, null, 2),
        'Design the smallest backward-compatible public API that satisfies #635.',
        'Required deliverables: ResponderType type, AgentTaskOptions on TaskDef.agent, responderType on BreakpointTaskOptions, adapter and fallbackType agent routing hints, helper APIs externalAgentTask(), humanTask(), and autoTask(), and validation requiring a non-empty adapter when agent.responderType is "agent".',
        'Define the exact accepted responderType union. Start from the docs: internal, human, agent, tracker, auto. Preserve structural permissiveness for custom TaskDef fields where existing compatibility depends on it.',
        'Specify where validation belongs. Prefer normalizeTaskDef in packages/sdk/src/tasks/defineTask.ts so both positional and object-form defineTask builds are covered; verify serializer behavior still preserves metadata.',
        'Specify docs/examples that must move from external: true to responderType: "agent", and mark legacy external docs as superseded rather than extending the old external flag model.',
        'Return JSON: { apiShape, validationRules, helperShapes, compatibilityRules, filesToChange, docsToUpdate, risks, implementationSteps }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['apiShape', 'validationRules', 'helperShapes', 'compatibilityRules', 'filesToChange', 'implementationSteps'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorRegressionPlanTask = defineTask('issue-635.author-regression-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing tests for SDK responderType API',
  labels: ['issue-635', 'sdk', 'tests', 'tdd'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add failing regression coverage for the #635 SDK task-definition API before implementation changes.',
      instructions: [
        'Work test-first. In this task, modify only tests and fixtures unless a compile-only type fixture is needed next to existing tests.',
        'Use the API plan JSON below as the target behavior.',
        'API plan JSON:',
        JSON.stringify(args.apiPlan ?? {}, null, 2),
        'Add or update tests near packages/sdk/src/tasks/__tests__/defineTask.test.ts and packages/sdk/src/tasks/__tests__/kinds.test.ts.',
        'Cover helper output for externalAgentTask(), humanTask(), and autoTask(). externalAgentTask() must emit agent.responderType === "agent" and a non-empty adapter, not external: true.',
        'Cover defineTask positional and object forms preserving valid agent.responderType, adapter, fallbackType, and breakpoint.responderType metadata.',
        'Cover missing/blank adapter validation when agent.responderType === "agent".',
        'Cover compatibility: existing object-form custom fields and task definitions without responderType still build successfully.',
        'Run targeted tests and show that new tests fail for the expected missing implementation reason before implementation.',
        'Return JSON: { changedFiles: string[], testsAdded: string[], expectedRedFailures: string[], testCommands: string[], compatibilityCoverage: string[] }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'testsAdded', 'testCommands'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementSdkRoutingTypesTask = defineTask('issue-635.implement-sdk-routing-types', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement SDK responderType task-definition API',
  labels: ['issue-635', 'sdk', 'implementation'],
  agent: {
    name: 'coder',
    prompt: {
      role: 'senior TypeScript SDK engineer',
      task: 'Implement the #635 SDK task-definition API changes against the failing tests.',
      instructions: [
        'Edit the repository directly. Preserve unrelated dirty workspace changes.',
        'Use the issue context, dependency status, API plan, and regression plan below as the implementation contract.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'Dependency status JSON:',
        JSON.stringify(args.dependencyStatus ?? {}, null, 2),
        'API plan JSON:',
        JSON.stringify(args.apiPlan ?? {}, null, 2),
        'Regression plan JSON:',
        JSON.stringify(args.regressionPlan ?? {}, null, 2),
        args.previousVerification ? `Previous verification JSON:\n${JSON.stringify(args.previousVerification, null, 2)}` : 'No previous verification result.',
        args.previousReview ? `Previous review JSON:\n${JSON.stringify(args.previousReview, null, 2)}` : 'No previous review result.',
        `Attempt: ${args.attempt}`,
        'Implement the typed fields in packages/sdk/src/tasks/types.ts: ResponderType, AgentTaskOptions, agent?: AgentTaskOptions, BreakpointTaskOptions responderType/routing metadata, and definition-option fields needed by helpers.',
        'Implement validation in defineTask normalization so adapter is required when taskDef.agent.responderType === "agent"; reject blank adapters with a clear error. Do not reject legacy/custom task definitions that omit responderType.',
        'Implement helpers in packages/sdk/src/tasks/kinds/index.ts or a locally appropriate module exported by that barrel: externalAgentTask(), humanTask(), and autoTask(). Follow existing helper resolver patterns where practical.',
        'Update exports if the repo requires changes outside packages/sdk/src/tasks/index.ts for public SDK access.',
        'Update docs/examples that still teach external: true for this feature, making clear #635 supersedes #603 and that tasks-mux consumption is related follow-up work.',
        'Do not implement tasks-mux routing consumption unless it is strictly needed to compile SDK tests; that belongs to #630/#620.',
        'Return JSON: { changedFiles: string[], summary: string, publicApiChanges: string[], docsUpdated: string[], testsUpdated: string[], residualRisks: string[] }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['changedFiles', 'summary', 'publicApiChanges', 'testsUpdated'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runVerificationGateTask = defineTask('issue-635.run-verification-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run SDK responderType verification gate',
  labels: ['issue-635', 'sdk', 'verification', 'quality-gate'],
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'senior SDK quality engineer',
      task: 'Run the targeted and package-level verification commands for #635 and diagnose any failures.',
      instructions: [
        'Run the exact verification commands from inputs unless a command is impossible in this checkout; capture command, exit status, and decisive output for each.',
        'Verification commands:',
        JSON.stringify(args.inputs?.verificationCommands ?? [], null, 2),
        'At minimum, verify targeted tasks tests, SDK build, SDK test suite, and metadata verification.',
        'Also run git diff --check and inspect the diff for accidental unrelated source changes.',
        'If a command fails, determine whether it is caused by #635 changes, missing dependency work, or pre-existing environment/repo state. Provide exact evidence.',
        'Return JSON: { passed: boolean, commands: array, failures: array, diagnostics: array, changedFiles: string[], nextFixes: string[] }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'commands', 'failures', 'diagnostics'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewCompatibilityTask = defineTask('issue-635.review-compatibility', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review SDK compatibility and API completeness',
  labels: ['issue-635', 'sdk', 'review', 'compatibility'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'senior SDK code reviewer',
      task: 'Review the #635 implementation against issue acceptance, API compatibility, and dependency boundaries.',
      instructions: [
        'Review actual repository changes, not only summaries.',
        'Compare the implementation to the issue context, dependency status, API plan, regression plan, and verification output below.',
        'Issue context JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'Dependency status JSON:',
        JSON.stringify(args.dependencyStatus ?? {}, null, 2),
        'API plan JSON:',
        JSON.stringify(args.apiPlan ?? {}, null, 2),
        'Regression plan JSON:',
        JSON.stringify(args.regressionPlan ?? {}, null, 2),
        'Implementation JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'Verification JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
        'Check: typed API shape, helper output, adapter validation, object-form compatibility, serializer preservation, docs migration from external: true, and non-goal compliance for tasks-mux runtime routing.',
        'Reject if validation breaks permissive legacy TaskDef shapes, if helpers still emit external: true as the primary contract, or if adapter validation misses object-form defineTask.',
        'Return JSON: { approved: boolean, issues: string[], compatibilityRisks: string[], missingTests: string[], summary: string }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'issues', 'compatibilityRisks', 'missingTests', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-635.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance for issue #635',
  labels: ['issue-635', 'sdk', 'final-gate'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'release-minded SDK maintainer',
      task: 'Decide whether the #635 implementation is complete and ready for PR finalization.',
      instructions: [
        'Evaluate all attempts and current repository state.',
        'Acceptance criteria from issue context:',
        JSON.stringify(args.issueContext?.acceptanceCriteria ?? [], null, 2),
        'Attempts JSON:',
        JSON.stringify(args.attempts ?? [], null, 2),
        'Final verification JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
        'Final review JSON:',
        JSON.stringify(args.review ?? {}, null, 2),
        'Confirm every deliverable: AgentTaskOptions and BreakpointTaskOptions responderType fields, adapter/fallbackType hints, externalAgentTask/humanTask/autoTask helpers, adapter-required validation, docs/examples update, and compatibility tests.',
        'Confirm no implementation code for tasks-mux consumption was added beyond SDK task definitions unless strictly necessary.',
        'If a foundational dependency mismatch requires maintainer choice, set needsHumanDecision true with a concrete question.',
        'Return JSON: { passed: boolean, changedFiles: string[], missingAcceptanceCriteria: string[], needsHumanDecision: boolean, question?: string, prSummary: string, verificationSummary: string }.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'changedFiles', 'missingAcceptanceCriteria', 'needsHumanDecision', 'prSummary', 'verificationSummary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
