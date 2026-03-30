/**
 * @process sales/crm-data-quality
 * @description Workflow for maintaining CRM data accuracy, enforcing field requirements, and automating data hygiene routines.
 * @inputs { crmData: object, dataRules: array, qualityThresholds: object, automationConfig?: object }
 * @outputs { success: boolean, qualityReport: object, issues: array, automationResults: object, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/crm-data-quality', {
 *   crmData: { opportunities: [], contacts: [], accounts: [] },
 *   dataRules: [{ field: 'closeDate', required: true }],
 *   qualityThresholds: { completeness: 90, accuracy: 95 }
 * });
 *
 * @references
 * - Salesforce Data Quality: https://www.salesforce.com/products/sales-cloud/
 * - Data Quality Management: https://www.gartner.com/en/documents/data-quality
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    crmData = {},
    dataRules = [],
    qualityThresholds = {},
    automationConfig = {},
    outputDir = 'crm-quality-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting CRM Data Quality Management');

  // Phase 1: Data Profiling
  const dataProfiling = await ctx.task(dataProfilingTask, { crmData, outputDir });
  artifacts.push(...(dataProfiling.artifacts || []));

  // Phase 2: Completeness Analysis
  const completenessAnalysis = await ctx.task(completenessAnalysisTask, { crmData, dataRules, outputDir });
  artifacts.push(...(completenessAnalysis.artifacts || []));

  // Phase 3: Accuracy Validation
  const accuracyValidation = await ctx.task(accuracyValidationTask, { crmData, dataRules, outputDir });
  artifacts.push(...(accuracyValidation.artifacts || []));

  // Phase 4: Duplicate Detection
  const duplicateDetection = await ctx.task(duplicateDetectionTask, { crmData, outputDir });
  artifacts.push(...(duplicateDetection.artifacts || []));

  // Phase 5: Staleness Analysis
  const stalenessAnalysis = await ctx.task(stalenessAnalysisTask, { crmData, outputDir });
  artifacts.push(...(stalenessAnalysis.artifacts || []));

  // Phase 6: Issue Prioritization
  const issuePrioritization = await ctx.task(issuePrioritizationTask, {
    completenessAnalysis, accuracyValidation, duplicateDetection, stalenessAnalysis, outputDir
  });
  artifacts.push(...(issuePrioritization.artifacts || []));

  // Phase 7: Automation Recommendations
  const automationRecs = await ctx.task(automationRecommendationsTask, {
    issuePrioritization, automationConfig, outputDir
  });
  artifacts.push(...(automationRecs.artifacts || []));

  // Phase 8: Quality Report Generation
  const qualityReport = await ctx.task(qualityReportTask, {
    dataProfiling, completenessAnalysis, accuracyValidation, duplicateDetection,
    stalenessAnalysis, issuePrioritization, qualityThresholds, outputDir
  });
  artifacts.push(...(qualityReport.artifacts || []));

  await ctx.breakpoint({
    question: `CRM data quality analysis complete. Score: ${qualityReport.overallScore}. Review findings?`,
    title: 'CRM Data Quality Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    qualityReport: qualityReport.report,
    overallScore: qualityReport.overallScore,
    issues: issuePrioritization.issues,
    automationResults: automationRecs.recommendations,
    recommendations: qualityReport.recommendations,
    artifacts,
    metadata: { processId: 'sales/crm-data-quality', timestamp: startTime }
  };
}

export const dataProfilingTask = defineTask('data-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Data Profiling',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'CRM data profiling specialist',
      task: 'Profile CRM data structure and content',
      context: args,
      instructions: ['Analyze data structure', 'Profile field distributions', 'Identify patterns', 'Document data characteristics']
    },
    outputSchema: { type: 'object', required: ['profile', 'artifacts'], properties: { profile: { type: 'object' }, statistics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'crm', 'data-profiling']
}));

export const completenessAnalysisTask = defineTask('completeness-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Completeness Analysis',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'Data completeness analyst',
      task: 'Analyze data completeness',
      context: args,
      instructions: ['Check required fields', 'Calculate completeness rates', 'Identify gaps', 'Prioritize by impact']
    },
    outputSchema: { type: 'object', required: ['completenessRate', 'artifacts'], properties: { completenessRate: { type: 'number' }, gaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'crm', 'completeness']
}));

export const accuracyValidationTask = defineTask('accuracy-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Accuracy Validation',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'Data accuracy validator',
      task: 'Validate data accuracy',
      context: args,
      instructions: ['Validate data formats', 'Check value ranges', 'Verify relationships', 'Identify inaccuracies']
    },
    outputSchema: { type: 'object', required: ['accuracyRate', 'artifacts'], properties: { accuracyRate: { type: 'number' }, issues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'crm', 'accuracy']
}));

export const duplicateDetectionTask = defineTask('duplicate-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Duplicate Detection',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'Duplicate detection specialist',
      task: 'Detect duplicate records',
      context: args,
      instructions: ['Identify potential duplicates', 'Score match likelihood', 'Recommend merge actions', 'Calculate dedup impact']
    },
    outputSchema: { type: 'object', required: ['duplicates', 'artifacts'], properties: { duplicates: { type: 'array' }, duplicateRate: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'crm', 'duplicates']
}));

export const stalenessAnalysisTask = defineTask('staleness-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Staleness Analysis',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'Data freshness analyst',
      task: 'Analyze data staleness',
      context: args,
      instructions: ['Check last update dates', 'Identify stale records', 'Calculate freshness metrics', 'Recommend refresh actions']
    },
    outputSchema: { type: 'object', required: ['stalenessMetrics', 'artifacts'], properties: { stalenessMetrics: { type: 'object' }, staleRecords: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'crm', 'staleness']
}));

export const issuePrioritizationTask = defineTask('issue-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Issue Prioritization',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'Data issue prioritization specialist',
      task: 'Prioritize data quality issues',
      context: args,
      instructions: ['Compile all issues', 'Score by business impact', 'Prioritize remediation', 'Create action plan']
    },
    outputSchema: { type: 'object', required: ['issues', 'artifacts'], properties: { issues: { type: 'array' }, actionPlan: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'crm', 'prioritization']
}));

export const automationRecommendationsTask = defineTask('automation-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Automation Recommendations',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'Data automation specialist',
      task: 'Recommend automation for data quality',
      context: args,
      instructions: ['Identify automation opportunities', 'Design validation rules', 'Recommend workflows', 'Estimate ROI']
    },
    outputSchema: { type: 'object', required: ['recommendations', 'artifacts'], properties: { recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'crm', 'automation']
}));

export const qualityReportTask = defineTask('quality-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quality Report Generation',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'Data quality report specialist',
      task: 'Generate comprehensive quality report',
      context: args,
      instructions: ['Compile all metrics', 'Calculate overall score', 'Generate executive summary', 'Create recommendations']
    },
    outputSchema: { type: 'object', required: ['report', 'overallScore', 'recommendations', 'artifacts'], properties: { report: { type: 'object' }, overallScore: { type: 'number' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'crm', 'quality-report']
}));
