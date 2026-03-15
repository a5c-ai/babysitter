/**
 * @process specializations/domains/business/legal/litigation-management
 * @description Litigation Management System - Deploy matter management for litigation tracking, budget control,
 * outside counsel coordination, and outcome analysis.
 * @inputs { matterId: string, matterType?: string, action?: string, outputDir?: string }
 * @outputs { success: boolean, matterStatus: object, budget: object, timeline: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/litigation-management', {
 *   matterId: 'LIT-2024-001',
 *   matterType: 'breach-of-contract',
 *   action: 'track',
 *   outputDir: 'litigation'
 * });
 *
 * @references
 * - Mitratech Legal Matter Management: https://www.mitratech.com/
 * - CLOC Legal Operations: https://cloc.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    matterId,
    matterType = 'general-litigation',
    action = 'track', // 'create', 'track', 'budget', 'analyze', 'close'
    outsideCounsel = null,
    outputDir = 'litigation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Litigation Management for ${matterId}`);

  // Phase 1: Matter Setup/Status
  const matterStatus = await ctx.task(matterStatusTask, {
    matterId,
    matterType,
    action,
    outputDir
  });
  artifacts.push(...matterStatus.artifacts);

  // Phase 2: Timeline Management
  const timeline = await ctx.task(timelineManagementTask, {
    matterId,
    matterType,
    outputDir
  });
  artifacts.push(...timeline.artifacts);

  // Phase 3: Budget Tracking
  const budget = await ctx.task(budgetTrackingTask, {
    matterId,
    outsideCounsel,
    outputDir
  });
  artifacts.push(...budget.artifacts);

  // Phase 4: Outside Counsel Coordination
  let counselCoordination = null;
  if (outsideCounsel) {
    counselCoordination = await ctx.task(counselCoordinationTask, {
      matterId,
      outsideCounsel,
      outputDir
    });
    artifacts.push(...counselCoordination.artifacts);
  }

  // Phase 5: Risk Assessment
  const riskAssessment = await ctx.task(litigationRiskAssessmentTask, {
    matterId,
    matterType,
    matterStatus: matterStatus.status,
    outputDir
  });
  artifacts.push(...riskAssessment.artifacts);

  // Phase 6: Strategy Documentation
  const strategy = await ctx.task(strategyDocumentationTask, {
    matterId,
    riskAssessment,
    outputDir
  });
  artifacts.push(...strategy.artifacts);

  // Phase 7: Reporting
  const report = await ctx.task(matterReportingTask, {
    matterId,
    matterStatus,
    timeline,
    budget,
    riskAssessment,
    outputDir
  });
  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Litigation matter ${matterId} status updated. Budget: ${budget.spent}/${budget.total}. Risk: ${riskAssessment.riskLevel}. Review report?`,
    title: 'Litigation Matter Review',
    context: {
      runId: ctx.runId,
      matterId,
      status: matterStatus.status,
      budgetSpent: budget.spent,
      riskLevel: riskAssessment.riskLevel,
      files: [{ path: report.reportPath, format: 'markdown', label: 'Matter Report' }]
    }
  });

  return {
    success: true,
    matterId,
    matterType,
    matterStatus: matterStatus.status,
    budget: { total: budget.total, spent: budget.spent, remaining: budget.remaining },
    timeline: timeline.events,
    riskAssessment: { riskLevel: riskAssessment.riskLevel, exposureRange: riskAssessment.exposureRange },
    reportPath: report.reportPath,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/litigation-management', timestamp: startTime }
  };
}

export const matterStatusTask = defineTask('matter-status', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Track matter status',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Matter Management Specialist',
      task: 'Track litigation matter status',
      context: args,
      instructions: ['Review current matter status', 'Update case stage', 'Document recent developments', 'Track key dates'],
      outputFormat: 'JSON with status object, artifacts'
    },
    outputSchema: { type: 'object', required: ['status', 'artifacts'], properties: { status: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'litigation']
}));

export const timelineManagementTask = defineTask('timeline-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Manage timeline',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Litigation Timeline Manager',
      task: 'Manage litigation timeline and deadlines',
      context: args,
      instructions: ['Track all deadlines', 'Update timeline events', 'Set reminders', 'Document milestone completion'],
      outputFormat: 'JSON with events array, upcomingDeadlines, artifacts'
    },
    outputSchema: { type: 'object', required: ['events', 'artifacts'], properties: { events: { type: 'array' }, upcomingDeadlines: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'litigation']
}));

export const budgetTrackingTask = defineTask('budget-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Track budget',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Legal Budget Analyst',
      task: 'Track litigation budget',
      context: args,
      instructions: ['Track total budget', 'Monitor spend', 'Review invoices', 'Forecast remaining costs'],
      outputFormat: 'JSON with total, spent, remaining, forecast, artifacts'
    },
    outputSchema: { type: 'object', required: ['total', 'spent', 'remaining', 'artifacts'], properties: { total: { type: 'number' }, spent: { type: 'number' }, remaining: { type: 'number' }, forecast: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'litigation']
}));

export const counselCoordinationTask = defineTask('counsel-coordination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Coordinate with counsel',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Outside Counsel Coordinator',
      task: 'Coordinate with outside counsel',
      context: args,
      instructions: ['Track counsel activities', 'Review status updates', 'Manage communications', 'Document coordination'],
      outputFormat: 'JSON with coordinationStatus object, artifacts'
    },
    outputSchema: { type: 'object', required: ['coordinationStatus', 'artifacts'], properties: { coordinationStatus: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'litigation']
}));

export const litigationRiskAssessmentTask = defineTask('litigation-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess litigation risk',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Litigation Risk Analyst',
      task: 'Assess litigation risk and exposure',
      context: args,
      instructions: ['Evaluate case strength', 'Assess liability exposure', 'Calculate exposure range', 'Recommend risk level'],
      outputFormat: 'JSON with riskLevel, exposureRange, factors, artifacts'
    },
    outputSchema: { type: 'object', required: ['riskLevel', 'exposureRange', 'artifacts'], properties: { riskLevel: { type: 'string' }, exposureRange: { type: 'object' }, factors: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'litigation']
}));

export const strategyDocumentationTask = defineTask('strategy-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document strategy',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Litigation Strategist',
      task: 'Document litigation strategy',
      context: args,
      instructions: ['Document case strategy', 'Identify key arguments', 'Plan discovery approach', 'Document settlement position'],
      outputFormat: 'JSON with strategy object, artifacts'
    },
    outputSchema: { type: 'object', required: ['strategy', 'artifacts'], properties: { strategy: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'litigation']
}));

export const matterReportingTask = defineTask('matter-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate matter report',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Matter Reporter',
      task: 'Generate litigation matter report',
      context: args,
      instructions: ['Summarize matter status', 'Include budget analysis', 'Present risk assessment', 'Document recommendations'],
      outputFormat: 'JSON with reportPath, artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'litigation']
}));
