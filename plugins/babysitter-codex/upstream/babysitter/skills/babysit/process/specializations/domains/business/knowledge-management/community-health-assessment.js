/**
 * @process domains/business/knowledge-management/community-health-assessment
 * @description Assess community vitality, engagement levels, value delivery, and develop strategies to sustain and revitalize communities
 * @specialization Knowledge Management
 * @category Communities of Practice Management
 * @inputs { community: object, assessmentPeriod: string, benchmarks: object, outputDir: string }
 * @outputs { success: boolean, healthAssessment: object, vitalityScore: number, recommendations: array, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    community = {},
    assessmentPeriod = '12 months',
    benchmarks = {},
    historicalData = [],
    outputDir = 'community-health-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Community Health Assessment and Improvement Process');

  const activityAnalysis = await ctx.task(activityAnalysisTask, { community, assessmentPeriod, historicalData, outputDir });
  artifacts.push(...activityAnalysis.artifacts);

  const engagementAnalysis = await ctx.task(engagementAnalysisTask, { community, assessmentPeriod, outputDir });
  artifacts.push(...engagementAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Engagement analysis shows ${engagementAnalysis.engagementRate}% active engagement. Review?`,
    title: 'Engagement Analysis Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { engagementRate: engagementAnalysis.engagementRate } }
  });

  const valueDeliveryAssessment = await ctx.task(valueDeliveryTask, { community, activityAnalysis, engagementAnalysis, outputDir });
  artifacts.push(...valueDeliveryAssessment.artifacts);

  const contentAnalysis = await ctx.task(contentAnalysisTask, { community, assessmentPeriod, outputDir });
  artifacts.push(...contentAnalysis.artifacts);

  const governanceAssessment = await ctx.task(governanceAssessmentTask, { community, outputDir });
  artifacts.push(...governanceAssessment.artifacts);

  const vitalityScoring = await ctx.task(vitalityScoringTask, { activityAnalysis, engagementAnalysis, valueDeliveryAssessment, contentAnalysis, governanceAssessment, benchmarks, outputDir });
  artifacts.push(...vitalityScoring.artifacts);

  const issueIdentification = await ctx.task(issueIdentificationTask, { vitalityScoring, community, outputDir });
  artifacts.push(...issueIdentification.artifacts);

  const recommendationDevelopment = await ctx.task(recommendationDevelopmentTask, { issues: issueIdentification.issues, vitalityScoring, community, outputDir });
  artifacts.push(...recommendationDevelopment.artifacts);

  const qualityAssessment = await ctx.task(qualityAssessmentTask, { activityAnalysis, engagementAnalysis, vitalityScoring, recommendationDevelopment, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  let reviewResult = null;
  if (requireApproval) {
    reviewResult = await ctx.task(stakeholderReviewTask, { healthAssessment: vitalityScoring.assessment, recommendations: recommendationDevelopment.recommendations, qualityScore: qualityAssessment.overallScore, outputDir });
    artifacts.push(...reviewResult.artifacts);
  }

  const endTime = ctx.now();
  return {
    success: true,
    healthAssessment: vitalityScoring.assessment,
    vitalityScore: vitalityScoring.overallScore,
    engagementMetrics: engagementAnalysis.metrics,
    valueDelivery: valueDeliveryAssessment.assessment,
    issues: issueIdentification.issues,
    recommendations: recommendationDevelopment.recommendations,
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'domains/business/knowledge-management/community-health-assessment', timestamp: startTime, outputDir }
  };
}

export const activityAnalysisTask = defineTask('activity-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze activity levels',
  agent: { name: 'activity-analyst', prompt: { role: 'community activity analyst', task: 'Analyze community activity levels', context: args, instructions: ['Assess activity trends and patterns', 'Save to output directory'], outputFormat: 'JSON with analysis (object), artifacts' }, outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'community', 'activity']
}));

export const engagementAnalysisTask = defineTask('engagement-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze engagement',
  agent: { name: 'engagement-analyst', prompt: { role: 'engagement analyst', task: 'Analyze member engagement', context: args, instructions: ['Calculate engagement metrics', 'Save to output directory'], outputFormat: 'JSON with metrics (object), engagementRate (number), artifacts' }, outputSchema: { type: 'object', required: ['metrics', 'engagementRate', 'artifacts'], properties: { metrics: { type: 'object' }, engagementRate: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'community', 'engagement']
}));

export const valueDeliveryTask = defineTask('value-delivery', (args, taskCtx) => ({
  kind: 'agent', title: 'Assess value delivery',
  agent: { name: 'value-analyst', prompt: { role: 'value delivery analyst', task: 'Assess community value delivery', context: args, instructions: ['Evaluate value to members and organization', 'Save to output directory'], outputFormat: 'JSON with assessment (object), artifacts' }, outputSchema: { type: 'object', required: ['assessment', 'artifacts'], properties: { assessment: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'community', 'value']
}));

export const contentAnalysisTask = defineTask('content-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze content',
  agent: { name: 'content-analyst', prompt: { role: 'content analyst', task: 'Analyze community content', context: args, instructions: ['Assess content quality and relevance', 'Save to output directory'], outputFormat: 'JSON with analysis (object), artifacts' }, outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'community', 'content']
}));

export const governanceAssessmentTask = defineTask('governance-assessment', (args, taskCtx) => ({
  kind: 'agent', title: 'Assess governance',
  agent: { name: 'governance-assessor', prompt: { role: 'governance assessor', task: 'Assess community governance', context: args, instructions: ['Evaluate governance effectiveness', 'Save to output directory'], outputFormat: 'JSON with assessment (object), artifacts' }, outputSchema: { type: 'object', required: ['assessment', 'artifacts'], properties: { assessment: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'community', 'governance']
}));

export const vitalityScoringTask = defineTask('vitality-scoring', (args, taskCtx) => ({
  kind: 'agent', title: 'Calculate vitality score',
  agent: { name: 'vitality-scorer', prompt: { role: 'vitality scoring specialist', task: 'Calculate community vitality score', context: args, instructions: ['Compute weighted vitality score', 'Save to output directory'], outputFormat: 'JSON with assessment (object), overallScore (number 0-100), artifacts' }, outputSchema: { type: 'object', required: ['assessment', 'overallScore', 'artifacts'], properties: { assessment: { type: 'object' }, overallScore: { type: 'number', minimum: 0, maximum: 100 }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'community', 'vitality']
}));

export const issueIdentificationTask = defineTask('issue-identification', (args, taskCtx) => ({
  kind: 'agent', title: 'Identify issues',
  agent: { name: 'issue-analyst', prompt: { role: 'community issue analyst', task: 'Identify community health issues', context: args, instructions: ['Identify problems and root causes', 'Save to output directory'], outputFormat: 'JSON with issues (array), artifacts' }, outputSchema: { type: 'object', required: ['issues', 'artifacts'], properties: { issues: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'community', 'issues']
}));

export const recommendationDevelopmentTask = defineTask('recommendation-development', (args, taskCtx) => ({
  kind: 'agent', title: 'Develop recommendations',
  agent: { name: 'recommendation-developer', prompt: { role: 'improvement specialist', task: 'Develop improvement recommendations', context: args, instructions: ['Create actionable recommendations', 'Save to output directory'], outputFormat: 'JSON with recommendations (array), artifacts' }, outputSchema: { type: 'object', required: ['recommendations', 'artifacts'], properties: { recommendations: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'community', 'recommendations']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent', title: 'Assess quality',
  agent: { name: 'quality-assessor', prompt: { role: 'quality assessor', task: 'Assess assessment quality', context: args, instructions: ['Evaluate assessment quality', 'Save to output directory'], outputFormat: 'JSON with overallScore (number 0-100), artifacts' }, outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number', minimum: 0, maximum: 100 }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'quality', 'assessment']
}));

export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent', title: 'Stakeholder review',
  agent: { name: 'project-manager', prompt: { role: 'project manager', task: 'Coordinate review', context: args, instructions: ['Present for approval', 'Save to output directory'], outputFormat: 'JSON with approved (boolean), stakeholders (array), artifacts' }, outputSchema: { type: 'object', required: ['approved', 'stakeholders', 'artifacts'], properties: { approved: { type: 'boolean' }, stakeholders: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
