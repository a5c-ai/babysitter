/**
 * @process business-strategy/strategy-execution-monitoring
 * @description Ongoing monitoring and adaptation of strategy execution with governance and performance management
 * @inputs { organizationName: string, strategicPlan: object, currentMetrics: object, reviewCadence: object }
 * @outputs { success: boolean, governanceFramework: object, performanceDashboards: object, adaptationRecommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    strategicPlan = {},
    currentMetrics = {},
    reviewCadence = {},
    outputDir = 'execution-monitoring-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Strategy Execution Monitoring for ${organizationName}`);

  // Phase 1: Governance Structure Establishment
  ctx.log('info', 'Phase 1: Establishing strategy governance structure');
  const governanceStructure = await ctx.task(governanceStructureTask, {
    organizationName, strategicPlan, outputDir
  });
  artifacts.push(...governanceStructure.artifacts);

  // Phase 2: KPI and Dashboard Definition
  ctx.log('info', 'Phase 2: Defining KPIs and performance dashboards');
  const kpiDefinition = await ctx.task(kpiDefinitionTask, {
    organizationName, strategicPlan, currentMetrics, outputDir
  });
  artifacts.push(...kpiDefinition.artifacts);

  // Phase 3: Review Cadence Implementation
  ctx.log('info', 'Phase 3: Implementing review cadences');
  const reviewCadenceImpl = await ctx.task(reviewCadenceTask, {
    organizationName, governanceStructure, kpiDefinition, reviewCadence, outputDir
  });
  artifacts.push(...reviewCadenceImpl.artifacts);

  // Phase 4: Initiative Progress Tracking
  ctx.log('info', 'Phase 4: Tracking initiative progress and milestones');
  const initiativeTracking = await ctx.task(initiativeTrackingTask, {
    organizationName, strategicPlan, currentMetrics, outputDir
  });
  artifacts.push(...initiativeTracking.artifacts);

  // Phase 5: Environmental Monitoring
  ctx.log('info', 'Phase 5: Monitoring external environment for strategic triggers');
  const environmentalMonitoring = await ctx.task(environmentalMonitoringTask, {
    organizationName, strategicPlan, outputDir
  });
  artifacts.push(...environmentalMonitoring.artifacts);

  // Phase 6: Variance Analysis
  ctx.log('info', 'Phase 6: Conducting root cause analysis for variances');
  const varianceAnalysis = await ctx.task(varianceAnalysisTask, {
    organizationName, kpiDefinition, initiativeTracking, currentMetrics, outputDir
  });
  artifacts.push(...varianceAnalysis.artifacts);

  // Phase 7: Strategy Adaptation Recommendations
  ctx.log('info', 'Phase 7: Developing strategy adaptation recommendations');
  const adaptationRecommendations = await ctx.task(adaptationRecommendationsTask, {
    organizationName, varianceAnalysis, environmentalMonitoring, initiativeTracking, outputDir
  });
  artifacts.push(...adaptationRecommendations.artifacts);

  // Phase 8: Strategic Risk Management
  ctx.log('info', 'Phase 8: Managing strategic risks and opportunities');
  const riskManagement = await ctx.task(strategicRiskManagementTask, {
    organizationName, varianceAnalysis, environmentalMonitoring, adaptationRecommendations, outputDir
  });
  artifacts.push(...riskManagement.artifacts);

  // Phase 9: Generate Report
  ctx.log('info', 'Phase 9: Generating comprehensive monitoring report');
  const monitoringReport = await ctx.task(executionMonitoringReportTask, {
    organizationName, governanceStructure, kpiDefinition, reviewCadenceImpl, initiativeTracking,
    environmentalMonitoring, varianceAnalysis, adaptationRecommendations, riskManagement, outputDir
  });
  artifacts.push(...monitoringReport.artifacts);

  await ctx.breakpoint({
    question: `Strategy execution monitoring framework complete for ${organizationName}. Review governance and adaptation recommendations?`,
    title: 'Strategy Execution Monitoring Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true, organizationName,
    governanceFramework: governanceStructure.framework,
    performanceDashboards: kpiDefinition.dashboards,
    reviewProcess: reviewCadenceImpl.process,
    initiativeStatus: initiativeTracking.status,
    adaptationRecommendations: adaptationRecommendations.recommendations,
    riskAssessment: riskManagement.assessment,
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'business-strategy/strategy-execution-monitoring', timestamp: startTime, outputDir }
  };
}

export const governanceStructureTask = defineTask('governance-structure', (args, taskCtx) => ({
  kind: 'agent', title: 'Establish strategy governance structure',
  agent: {
    name: 'governance-architect',
    prompt: {
      role: 'strategy governance specialist',
      task: 'Design strategy governance structure and decision rights',
      context: args,
      instructions: ['Define strategy governance bodies', 'Establish decision rights and escalation paths', 'Define roles and responsibilities', 'Create RACI matrix for strategy execution', 'Define governance meeting cadence', 'Generate governance framework documentation']
    },
    outputSchema: { type: 'object', required: ['framework', 'artifacts'], properties: { framework: { type: 'object' }, governanceBodies: { type: 'array' }, decisionRights: { type: 'object' }, raciMatrix: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'execution-monitoring', 'governance']
}));

export const kpiDefinitionTask = defineTask('kpi-definition', (args, taskCtx) => ({
  kind: 'agent', title: 'Define KPIs and performance dashboards',
  agent: {
    name: 'kpi-analyst',
    prompt: {
      role: 'performance measurement specialist',
      task: 'Define KPIs and design performance dashboards',
      context: args,
      instructions: ['Define strategic KPIs aligned with objectives', 'Set targets and thresholds for each KPI', 'Design executive dashboard layout', 'Define drill-down dashboards by area', 'Establish data collection requirements', 'Generate KPI and dashboard documentation']
    },
    outputSchema: { type: 'object', required: ['kpis', 'dashboards', 'artifacts'], properties: { kpis: { type: 'array' }, targets: { type: 'object' }, dashboards: { type: 'object' }, dataRequirements: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'execution-monitoring', 'kpis']
}));

export const reviewCadenceTask = defineTask('review-cadence', (args, taskCtx) => ({
  kind: 'agent', title: 'Implement review cadences',
  agent: {
    name: 'cadence-designer',
    prompt: {
      role: 'review process specialist',
      task: 'Design and implement strategic review cadences',
      context: args,
      instructions: ['Define monthly operational review', 'Define quarterly strategy review', 'Define annual strategic planning review', 'Create review meeting agendas', 'Define preparation requirements', 'Generate review cadence documentation']
    },
    outputSchema: { type: 'object', required: ['process', 'artifacts'], properties: { process: { type: 'object' }, monthlyReview: { type: 'object' }, quarterlyReview: { type: 'object' }, annualReview: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'execution-monitoring', 'reviews']
}));

export const initiativeTrackingTask = defineTask('initiative-tracking', (args, taskCtx) => ({
  kind: 'agent', title: 'Track initiative progress',
  agent: {
    name: 'initiative-tracker',
    prompt: {
      role: 'project portfolio analyst',
      task: 'Track strategic initiative progress and milestones',
      context: args,
      instructions: ['Assess current status of each initiative', 'Track milestone achievement', 'Identify at-risk initiatives', 'Assess resource consumption vs. plan', 'Calculate initiative health scores', 'Generate initiative tracking report']
    },
    outputSchema: { type: 'object', required: ['status', 'artifacts'], properties: { status: { type: 'object' }, initiativeHealth: { type: 'array' }, milestoneStatus: { type: 'object' }, atRiskInitiatives: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'execution-monitoring', 'initiatives']
}));

export const environmentalMonitoringTask = defineTask('environmental-monitoring', (args, taskCtx) => ({
  kind: 'agent', title: 'Monitor external environment',
  agent: {
    name: 'environment-monitor',
    prompt: {
      role: 'strategic intelligence analyst',
      task: 'Monitor external environment for strategic triggers',
      context: args,
      instructions: ['Monitor competitive environment changes', 'Track market and customer trends', 'Monitor regulatory changes', 'Track technology developments', 'Identify strategic triggers and signals', 'Generate environmental monitoring report']
    },
    outputSchema: { type: 'object', required: ['monitoring', 'artifacts'], properties: { monitoring: { type: 'object' }, triggers: { type: 'array' }, competitiveChanges: { type: 'array' }, marketTrends: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'execution-monitoring', 'environment']
}));

export const varianceAnalysisTask = defineTask('variance-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Conduct variance analysis',
  agent: {
    name: 'variance-analyst',
    prompt: {
      role: 'performance variance specialist',
      task: 'Conduct root cause analysis for performance variances',
      context: args,
      instructions: ['Identify significant performance variances', 'Conduct root cause analysis', 'Distinguish internal vs. external causes', 'Assess variance impact on strategy', 'Prioritize variances by significance', 'Generate variance analysis report']
    },
    outputSchema: { type: 'object', required: ['variances', 'artifacts'], properties: { variances: { type: 'array' }, rootCauses: { type: 'object' }, impact: { type: 'object' }, prioritization: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'execution-monitoring', 'variance']
}));

export const adaptationRecommendationsTask = defineTask('adaptation-recommendations', (args, taskCtx) => ({
  kind: 'agent', title: 'Develop strategy adaptation recommendations',
  agent: {
    name: 'adaptation-advisor',
    prompt: {
      role: 'strategy adaptation specialist',
      task: 'Develop recommendations for strategy adaptation',
      context: args,
      instructions: ['Identify needed strategy adjustments', 'Recommend initiative course corrections', 'Suggest resource reallocation', 'Recommend timeline adjustments', 'Prioritize adaptations by impact', 'Generate adaptation recommendations report']
    },
    outputSchema: { type: 'object', required: ['recommendations', 'artifacts'], properties: { recommendations: { type: 'array' }, courseCorrections: { type: 'array' }, resourceChanges: { type: 'array' }, timelineAdjustments: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'execution-monitoring', 'adaptation']
}));

export const strategicRiskManagementTask = defineTask('strategic-risk-management', (args, taskCtx) => ({
  kind: 'agent', title: 'Manage strategic risks and opportunities',
  agent: {
    name: 'risk-manager',
    prompt: {
      role: 'strategic risk management specialist',
      task: 'Manage strategic risks and emerging opportunities',
      context: args,
      instructions: ['Assess current strategic risk exposure', 'Identify emerging risks and opportunities', 'Update risk mitigation plans', 'Recommend risk response actions', 'Track risk trend over time', 'Generate risk management report']
    },
    outputSchema: { type: 'object', required: ['assessment', 'artifacts'], properties: { assessment: { type: 'object' }, risks: { type: 'array' }, opportunities: { type: 'array' }, mitigationPlans: { type: 'object' }, riskTrends: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'execution-monitoring', 'risk']
}));

export const executionMonitoringReportTask = defineTask('execution-monitoring-report', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate execution monitoring report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'strategy monitoring report author',
      task: 'Generate comprehensive strategy execution monitoring report',
      context: args,
      instructions: ['Create executive summary', 'Present governance framework', 'Include performance dashboards', 'Document initiative status', 'Present variance analysis', 'Include adaptation recommendations', 'Document risk assessment', 'Format as professional report']
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, keyFindings: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'execution-monitoring', 'reporting']
}));
