/**
 * @process specializations/domains/business/legal/corporate-policy-management
 * @description Corporate Policy Management - Establish policy lifecycle management including drafting, approval,
 * distribution, acknowledgment, and periodic review.
 * @inputs { policyId?: string, action?: string, policyType?: string, outputDir?: string }
 * @outputs { success: boolean, policy: object, approvalStatus: object, distributionStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/corporate-policy-management', {
 *   policyType: 'code-of-conduct',
 *   action: 'create',
 *   outputDir: 'corporate-policies'
 * });
 *
 * @references
 * - SCCE Policy Management: https://www.corporatecompliance.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    policyId = null,
    action = 'create', // 'create', 'review', 'update', 'distribute', 'track'
    policyType = 'general',
    policyScope = 'organization-wide',
    outputDir = 'policy-management-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const actualPolicyId = policyId || `POL-${Date.now()}`;

  ctx.log('info', `Starting Policy Management - Action: ${action}, Policy: ${actualPolicyId}`);

  // Phase 1: Policy Drafting/Review
  const policyDraft = await ctx.task(policyDraftingTask, {
    policyId: actualPolicyId,
    policyType,
    policyScope,
    action,
    outputDir
  });
  artifacts.push(...policyDraft.artifacts);

  // Phase 2: Legal Review
  const legalReview = await ctx.task(policyLegalReviewTask, {
    policyId: actualPolicyId,
    policy: policyDraft.policy,
    outputDir
  });
  artifacts.push(...legalReview.artifacts);

  // Phase 3: Approval Workflow
  const approval = await ctx.task(policyApprovalTask, {
    policyId: actualPolicyId,
    policy: policyDraft.policy,
    legalReview,
    outputDir
  });
  artifacts.push(...approval.artifacts);

  await ctx.breakpoint({
    question: `Policy ${actualPolicyId} drafted and reviewed. Legal review: ${legalReview.status}. Submit for approval?`,
    title: 'Policy Review',
    context: {
      runId: ctx.runId,
      policyId: actualPolicyId,
      legalReviewStatus: legalReview.status,
      files: [{ path: policyDraft.policyPath, format: 'docx', label: 'Policy Document' }]
    }
  });

  // Phase 4: Distribution
  const distribution = await ctx.task(policyDistributionTask, {
    policyId: actualPolicyId,
    policy: policyDraft.policy,
    approvalStatus: approval.status,
    outputDir
  });
  artifacts.push(...distribution.artifacts);

  // Phase 5: Acknowledgment Tracking
  const acknowledgment = await ctx.task(policyAcknowledgmentTask, {
    policyId: actualPolicyId,
    distribution,
    outputDir
  });
  artifacts.push(...acknowledgment.artifacts);

  // Phase 6: Review Schedule
  const reviewSchedule = await ctx.task(policyReviewScheduleTask, {
    policyId: actualPolicyId,
    policyType,
    outputDir
  });
  artifacts.push(...reviewSchedule.artifacts);

  return {
    success: true,
    policyId: actualPolicyId,
    policyType,
    policy: {
      path: policyDraft.policyPath,
      version: policyDraft.version,
      effectiveDate: policyDraft.effectiveDate
    },
    approvalStatus: approval.status,
    distributionStatus: distribution.status,
    acknowledgmentRate: acknowledgment.rate,
    nextReviewDate: reviewSchedule.nextReviewDate,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/corporate-policy-management', timestamp: startTime }
  };
}

export const policyDraftingTask = defineTask('policy-drafting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft policy',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Policy Drafter',
      task: 'Draft or update corporate policy',
      context: args,
      instructions: ['Draft policy content', 'Include purpose and scope', 'Define requirements', 'Include compliance procedures', 'Add definitions'],
      outputFormat: 'JSON with policy object, policyPath, version, effectiveDate, artifacts'
    },
    outputSchema: { type: 'object', required: ['policy', 'policyPath', 'artifacts'], properties: { policy: { type: 'object' }, policyPath: { type: 'string' }, version: { type: 'string' }, effectiveDate: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'policy-management']
}));

export const policyLegalReviewTask = defineTask('policy-legal-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Legal review',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Legal Reviewer',
      task: 'Conduct legal review of policy',
      context: args,
      instructions: ['Review for legal compliance', 'Check regulatory alignment', 'Identify legal risks', 'Recommend revisions'],
      outputFormat: 'JSON with status, findings, recommendations, artifacts'
    },
    outputSchema: { type: 'object', required: ['status', 'artifacts'], properties: { status: { type: 'string' }, findings: { type: 'array' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'policy-management']
}));

export const policyApprovalTask = defineTask('policy-approval', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Manage approval',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Approval Manager',
      task: 'Manage policy approval workflow',
      context: args,
      instructions: ['Route for approvals', 'Track approval status', 'Collect signatures', 'Document approval chain'],
      outputFormat: 'JSON with status object, approvers, artifacts'
    },
    outputSchema: { type: 'object', required: ['status', 'artifacts'], properties: { status: { type: 'object' }, approvers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'policy-management']
}));

export const policyDistributionTask = defineTask('policy-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Distribute policy',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Distribution Manager',
      task: 'Distribute policy to stakeholders',
      context: args,
      instructions: ['Identify distribution list', 'Publish to policy portal', 'Send notifications', 'Track distribution'],
      outputFormat: 'JSON with status object, distributedTo, artifacts'
    },
    outputSchema: { type: 'object', required: ['status', 'artifacts'], properties: { status: { type: 'object' }, distributedTo: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'policy-management']
}));

export const policyAcknowledgmentTask = defineTask('policy-acknowledgment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Track acknowledgments',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Acknowledgment Tracker',
      task: 'Track policy acknowledgments',
      context: args,
      instructions: ['Monitor acknowledgments', 'Send reminders', 'Track completion rate', 'Report non-compliance'],
      outputFormat: 'JSON with rate, pending, completed, artifacts'
    },
    outputSchema: { type: 'object', required: ['rate', 'artifacts'], properties: { rate: { type: 'number' }, pending: { type: 'number' }, completed: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'policy-management']
}));

export const policyReviewScheduleTask = defineTask('policy-review-schedule', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Schedule review',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Review Scheduler',
      task: 'Schedule policy review',
      context: args,
      instructions: ['Set review frequency', 'Schedule next review', 'Set reminders', 'Document review requirements'],
      outputFormat: 'JSON with nextReviewDate, reviewFrequency, artifacts'
    },
    outputSchema: { type: 'object', required: ['nextReviewDate', 'artifacts'], properties: { nextReviewDate: { type: 'string' }, reviewFrequency: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'policy-management']
}));
