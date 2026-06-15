/**
 * @process repo/issue-607-external-agent-docs
 * @description Implement contributor-facing documentation for external agent task authoring, dispatch, plugin-mode integration, fallback behavior, and troubleshooting.
 * @inputs { issueNumber?: number, baseBranch?: string, workBranch?: string, targetFiles?: string[], sourceDocs?: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], review: object, qualityGates: object, publish: object }
 *
 * References searched before authoring:
 * - .a5c/processes/issue-430-openai-gpt-oss-model-tracking.js
 * - .a5c/processes/issue-435-inference-provider-model-availability.mjs
 * - methodologies/planning-with-files/planning-orchestrator.js
 * - docs/agent-reference/process-authoring.md
 * - docs/agent-reference/command-surfaces.md
 * - docs/plugins.md
 * - docs/adapters-babysitter-integrations/external-agent-tasks.md
 * - docs/adapters-babysitter-integrations/process-authoring.md
 * - docs/adapters-babysitter-integrations/effect-resolution.md
 * - docs/adapters-babysitter-integrations/plugin-mode.md
 *
 * @process methodologies/planning-with-files/planning-orchestrator
 * @process specializations/collaboration/github/branch-policies
 * @process specializations/collaboration/github/issue-linking
 * @process processes/shared/communication/handoff-conventions
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_TARGET_FILES = [
  'docs/agent-reference/process-authoring.md',
  'docs/agent-reference/command-surfaces.md',
  'docs/plugins.md',
];

const DEFAULT_SOURCE_DOCS = [
  'docs/adapters-babysitter-integrations/external-agent-tasks.md',
  'docs/adapters-babysitter-integrations/process-authoring.md',
  'docs/adapters-babysitter-integrations/effect-resolution.md',
  'docs/adapters-babysitter-integrations/plugin-mode.md',
];

function valueOf(result, fallback = {}) {
  return result?.value ?? result ?? fallback;
}

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 607;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const workBranch = inputs?.workBranch ?? 'agent/issue-607-external-agent-docs';
  const targetFiles = inputs?.targetFiles ?? DEFAULT_TARGET_FILES;
  const sourceDocs = inputs?.sourceDocs ?? DEFAULT_SOURCE_DOCS;

  ctx.log('Phase 1: confirm issue context, dependency status, and doc source material');
  const context = await ctx.task(collectContextTask, {
    issueNumber,
    targetFiles,
    sourceDocs,
  }, { key: 'issue-607.context' });
  const contextValue = valueOf(context, {});

  if (contextValue?.requiresHumanDecision === true) {
    const decision = await ctx.breakpoint({
      title: 'External agent docs dependency check',
      question: 'Issue #607 depends on related external-agent API work. Continue with docs using the finalized behavior found in the repo, or pause for dependency clarification?',
      context: {
        issueNumber,
        dependencyStatus: contextValue.dependencyStatus ?? [],
        blockingQuestions: contextValue.blockingQuestions ?? [],
      },
    });

    if (decision?.approved === false) {
      return {
        success: false,
        phases: ['context'],
        changedFiles: [],
        review: { approved: false, issues: ['Stopped at dependency clarification breakpoint.'] },
        qualityGates: {},
        publish: {},
      };
    }
  }

  ctx.log('Phase 2: draft the concrete documentation edit plan');
  const editPlan = await ctx.task(draftEditPlanTask, {
    issueNumber,
    targetFiles,
    sourceDocs,
    context: contextValue,
  }, { key: 'issue-607.edit-plan' });

  ctx.log('Phase 3: update only the requested documentation files');
  const implementation = await ctx.task(implementDocsTask, {
    issueNumber,
    targetFiles,
    sourceDocs,
    editPlan: valueOf(editPlan, {}),
  }, { key: 'issue-607.implementation' });

  ctx.log('Phase 4: verify docs against the issue, design docs, and repo style');
  const qualityGates = await ctx.task(qualityGateTask, {
    issueNumber,
    targetFiles,
    sourceDocs,
    implementation: valueOf(implementation, {}),
  }, { key: 'issue-607.quality-gates' });

  ctx.log('Phase 5: review final artifacts for acceptance coverage and overreach');
  const review = await ctx.task(finalReviewTask, {
    issueNumber,
    targetFiles,
    sourceDocs,
    context: contextValue,
    editPlan: valueOf(editPlan, {}),
    implementation: valueOf(implementation, {}),
    qualityGates: valueOf(qualityGates, {}),
  }, { key: 'issue-607.review' });
  const reviewValue = valueOf(review, {});

  if (reviewValue?.approved === false) {
    return {
      success: false,
      phases: ['context', 'edit-plan', 'implementation', 'quality-gates', 'review'],
      changedFiles: valueOf(implementation, {})?.changedFiles ?? [],
      review: reviewValue,
      qualityGates: valueOf(qualityGates, {}),
      publish: {},
    };
  }

  ctx.log('Phase 6: publish the documentation PR and update the issue');
  const publish = await ctx.task(publishTask, {
    issueNumber,
    baseBranch,
    workBranch,
    targetFiles,
    implementation: valueOf(implementation, {}),
    qualityGates: valueOf(qualityGates, {}),
    review: reviewValue,
  }, { key: 'issue-607.publish' });

  return {
    success: true,
    phases: ['context', 'edit-plan', 'implementation', 'quality-gates', 'review', 'publish'],
    changedFiles: valueOf(implementation, {})?.changedFiles ?? targetFiles,
    review: reviewValue,
    qualityGates: valueOf(qualityGates, {}),
    publish: valueOf(publish, {}),
  };
}

export const collectContextTask = defineTask('issue-607.collect-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect issue and documentation context',
  labels: ['issue-607', 'documentation', 'adapters', 'context'],
  agent: {
    name: 'external-agent-docs-context-researcher',
    prompt: {
      role: 'senior technical documentation planner',
      task: 'Collect the current source context for issue #607 without editing files.',
      instructions: [
        'Read the live issue and comments with: gh issue view ' + args.issueNumber + ' --json title,body,labels,comments.',
        'Check related issues #602, #603, #604, and #605 enough to know whether their external-agent API behavior is finalized or still ambiguous.',
        'Read these target docs exactly as they exist now: ' + args.targetFiles.join(', ') + '.',
        'Read these design source docs exactly as source material: ' + args.sourceDocs.join(', ') + '.',
        'Map which requested concepts are already covered, missing, or potentially stale.',
        'Do not edit source files.',
        'Return JSON: { dependencyStatus: array, docGapMap: object, sourceMapping: object, requiresHumanDecision: boolean, blockingQuestions: array, summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const draftEditPlanTask = defineTask('issue-607.draft-edit-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft concrete documentation edit plan',
  labels: ['issue-607', 'documentation', 'planning'],
  agent: {
    name: 'external-agent-docs-plan-writer',
    prompt: {
      role: 'senior docs architect',
      task: 'Create the concrete implementation plan for the requested docs update.',
      instructions: [
        'Use the collected context as the source of truth and re-open the target docs before planning edits.',
        'Plan concise contributor-facing edits, not a copy of the design documents.',
        'Plan updates for docs/agent-reference/process-authoring.md covering internal kind: "agent" tasks versus agent.external: true tasks, required adapter, optional model/provider/timeout/approvalMode/maxTurns fields, fallbackToInternal behavior, and when internal agents are preferable.',
        'Plan updates for docs/agent-reference/command-surfaces.md covering external-agent dispatch through adapters/amuxBridge, discovery and orchestration command surfaces, and failure modes: adapters missing, adapter missing, auth failure, timeout, and agent crash.',
        'Plan updates for docs/plugins.md as a short plugin-mode integration note that distinguishes host-resolvable effects from external-agent effects and links back to agent-reference docs.',
        'Plan examples that show internal and external task patterns side by side.',
        'Keep scope to these target docs unless the context reveals a directly necessary generated-doc update.',
        'Return JSON: { filePlans: object, examplesToAdd: array, qualityGates: array, risks: array, expectedChangedFiles: array }.',
        '',
        'COLLECTED CONTEXT:',
        JSON.stringify(args.context, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementDocsTask = defineTask('issue-607.implement-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement external agent documentation update',
  labels: ['issue-607', 'documentation', 'implementation'],
  agent: {
    name: 'external-agent-docs-implementer',
    prompt: {
      role: 'senior contributor-docs engineer',
      task: 'Edit only the issue #607 documentation files according to the approved plan.',
      instructions: [
        'Read files before editing and preserve unrelated local changes.',
        'Modify only these files unless a generated-doc check proves another docs artifact is directly required: ' + args.targetFiles.join(', ') + '.',
        'Use the design docs as source material, but keep the target docs concise and contributor-facing.',
        'Add examples for internal agent tasks and external agent tasks without encouraging external agents for simple text-only work.',
        'Document fallbackToInternal as graceful degradation when adapters or a preferred adapter is unavailable, and state the failure behavior when fallback is not enabled.',
        'Document troubleshooting for missing adapters, missing adapter, unauthenticated adapter, timeout, and crash scenarios.',
        'Update docs/plugins.md with a short adapters/plugin-mode note and avoid duplicating the full agent-reference explanation.',
        'Do not modify runtime code, tests, package metadata, generated docs, or unrelated docs.',
        'Return JSON: { changedFiles: string[], summary: string, notableDecisions: string[], unresolvedItems: string[] }.',
        '',
        'EDIT PLAN:',
        JSON.stringify(args.editPlan, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const qualityGateTask = defineTask('issue-607.quality-gates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run documentation quality gates',
  labels: ['issue-607', 'documentation', 'verification'],
  agent: {
    name: 'external-agent-docs-verifier',
    prompt: {
      role: 'documentation quality engineer',
      task: 'Verify the docs update is correct, scoped, and mechanically clean.',
      instructions: [
        'Inspect the final diff for only these files: ' + args.targetFiles.join(', ') + '.',
        'Verify all issue #607 deliverables are covered: external agent task section, external dispatch command-surface notes, plugin-mode adapters note, internal vs external examples, fallbackToInternal, error scenarios, and troubleshooting.',
        'Run the smallest practical docs checks for this change. Prefer npm run docs:lint and npm run docs:snippets; run broader docs:qa if failures suggest generated or link issues.',
        'Run targeted grep checks for external agent, adapters, fallbackToInternal, adapter, amuxBridge or agent.external across the target docs.',
        'Confirm no runtime source files were modified.',
        'Return JSON: { passed: boolean, commandsRun: array, coverage: object, failures: array, changedFiles: array }.',
        '',
        'IMPLEMENTATION SUMMARY:',
        JSON.stringify(args.implementation, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalReviewTask = defineTask('issue-607.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review external agent docs against issue requirements',
  labels: ['issue-607', 'documentation', 'review'],
  agent: {
    name: 'external-agent-docs-reviewer',
    prompt: {
      role: 'senior docs reviewer',
      task: 'Compare issue #607 and the design docs to the final documentation artifacts.',
      instructions: [
        'Re-read the issue, target docs, and source design docs directly before reviewing.',
        'Compare the final artifacts to the issue requirements. Ignore implementation narrative when deciding pass/fail.',
        'Reject if the docs drift from the finalized API shape, omit fallback/error behavior, duplicate too much design-doc detail in docs/plugins.md, or over-encourage external agents.',
        'Reject if modified files are outside the requested documentation scope without a concrete generated-doc requirement.',
        'Return JSON: { approved: boolean, issues: string[], summary: string, residualRisk: string[] }.',
        '',
        'CONTEXT:',
        JSON.stringify(args.context, null, 2),
        '',
        'EDIT PLAN:',
        JSON.stringify(args.editPlan, null, 2),
        '',
        'QUALITY GATES:',
        JSON.stringify(args.qualityGates, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const publishTask = defineTask('issue-607.publish', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Publish documentation PR and issue update',
  labels: ['issue-607', 'documentation', 'github', 'publish'],
  agent: {
    name: 'external-agent-docs-publisher',
    prompt: {
      role: 'release-minded GitHub collaborator',
      task: 'Commit, push, open the implementation PR, and comment on issue #607.',
      instructions: [
        'Confirm the working branch is ' + args.workBranch + ' and the base branch is ' + args.baseBranch + '. If needed, create the branch from the current base without discarding unrelated local changes.',
        'Stage only the documentation files changed for issue #607: ' + args.targetFiles.join(', ') + '.',
        'Commit with a docs-scoped message that links to issue #607.',
        'Push the branch and open a non-draft PR against ' + args.baseBranch + '.',
        'Use a PR title like "Docs: document external agent task patterns".',
        'In the PR body, link issue #607 and summarize the updated sections, examples, fallback behavior, troubleshooting, and quality gates run.',
        'Post a comment on issue #607 with the implementation summary, PR link, and quality gates.',
        'Return JSON: { branch: string, commit: string, prUrl: string, issueCommentUrl: string, summary: string }.',
        '',
        'IMPLEMENTATION:',
        JSON.stringify(args.implementation, null, 2),
        '',
        'QUALITY GATES:',
        JSON.stringify(args.qualityGates, null, 2),
        '',
        'REVIEW:',
        JSON.stringify(args.review, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
