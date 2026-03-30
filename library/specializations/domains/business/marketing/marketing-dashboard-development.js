/**
 * @process marketing/marketing-dashboard-development
 * @description Create executive dashboards tracking key metrics (CAC, LTV, conversion rates, brand awareness) with data visualization for stakeholder reporting.
 * @inputs { metrics: array, dataSources: array, stakeholders: array, reportingCadence: object, existingDashboards: array }
 * @outputs { success: boolean, dashboardDesign: object, kpiDefinitions: array, visualizations: array, reportingFramework: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    metrics = [],
    dataSources = [],
    stakeholders = [],
    reportingCadence = {},
    existingDashboards = [],
    outputDir = 'dashboard-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Marketing Dashboard Development');

  const requirementsGathering = await ctx.task(dashboardRequirementsTask, { stakeholders, metrics, reportingCadence, outputDir });
  artifacts.push(...requirementsGathering.artifacts);

  const kpiDefinition = await ctx.task(kpiDefinitionTask, { requirementsGathering, metrics, outputDir });
  artifacts.push(...kpiDefinition.artifacts);

  const dataSourceMapping = await ctx.task(dataSourceMappingTask, { kpiDefinition, dataSources, outputDir });
  artifacts.push(...dataSourceMapping.artifacts);

  const dashboardArchitecture = await ctx.task(dashboardArchitectureTask, { requirementsGathering, kpiDefinition, stakeholders, outputDir });
  artifacts.push(...dashboardArchitecture.artifacts);

  const visualizationDesign = await ctx.task(visualizationDesignTask, { dashboardArchitecture, kpiDefinition, outputDir });
  artifacts.push(...visualizationDesign.artifacts);

  const executiveDashboard = await ctx.task(executiveDashboardTask, { dashboardArchitecture, visualizationDesign, kpiDefinition, outputDir });
  artifacts.push(...executiveDashboard.artifacts);

  const operationalDashboards = await ctx.task(operationalDashboardsTask, { dashboardArchitecture, visualizationDesign, kpiDefinition, outputDir });
  artifacts.push(...operationalDashboards.artifacts);

  const alertingSetup = await ctx.task(dashboardAlertingTask, { kpiDefinition, dashboardArchitecture, outputDir });
  artifacts.push(...alertingSetup.artifacts);

  const reportingFramework = await ctx.task(reportingFrameworkTask, { dashboardArchitecture, reportingCadence, stakeholders, outputDir });
  artifacts.push(...reportingFramework.artifacts);

  const qualityAssessment = await ctx.task(dashboardQualityTask, { dashboardArchitecture, kpiDefinition, visualizationDesign, reportingFramework, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  const dashboardScore = qualityAssessment.overallScore;

  await ctx.breakpoint({
    question: `Dashboard development complete. Quality score: ${dashboardScore}/100. Review and approve?`,
    title: 'Dashboard Development Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    dashboardScore,
    dashboardDesign: dashboardArchitecture.design,
    kpiDefinitions: kpiDefinition.kpis,
    visualizations: visualizationDesign.visualizations,
    reportingFramework: reportingFramework.framework,
    executiveDashboard: executiveDashboard.dashboard,
    operationalDashboards: operationalDashboards.dashboards,
    alerting: alertingSetup.alerts,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'marketing/marketing-dashboard-development', timestamp: startTime, outputDir }
  };
}

export const dashboardRequirementsTask = defineTask('dashboard-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather dashboard requirements',
  agent: {
    name: 'requirements-analyst',
    prompt: {
      role: 'Business intelligence analyst',
      task: 'Gather requirements for marketing dashboards',
      context: args,
      instructions: ['Interview stakeholders', 'Define use cases', 'Identify key questions', 'Define success criteria', 'Document requirements']
    },
    outputSchema: { type: 'object', required: ['requirements', 'useCases', 'artifacts'], properties: { requirements: { type: 'array' }, useCases: { type: 'array' }, questions: { type: 'array' }, success: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dashboard', 'requirements']
}));

export const kpiDefinitionTask = defineTask('kpi-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define KPIs',
  agent: {
    name: 'kpi-designer',
    prompt: {
      role: 'Marketing metrics specialist',
      task: 'Define and document key performance indicators',
      context: args,
      instructions: ['Define KPI formulas', 'Set targets and thresholds', 'Define calculation logic', 'Create KPI hierarchy', 'Document data requirements']
    },
    outputSchema: { type: 'object', required: ['kpis', 'hierarchy', 'artifacts'], properties: { kpis: { type: 'array' }, hierarchy: { type: 'object' }, targets: { type: 'object' }, calculations: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dashboard', 'kpi']
}));

export const dataSourceMappingTask = defineTask('data-source-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map data sources',
  agent: {
    name: 'data-mapper',
    prompt: {
      role: 'Data integration specialist',
      task: 'Map KPIs to data sources',
      context: args,
      instructions: ['Map KPIs to sources', 'Define data pipelines', 'Identify data gaps', 'Plan data transformations', 'Create data dictionary']
    },
    outputSchema: { type: 'object', required: ['mapping', 'pipelines', 'artifacts'], properties: { mapping: { type: 'object' }, pipelines: { type: 'array' }, gaps: { type: 'array' }, dictionary: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dashboard', 'data-mapping']
}));

export const dashboardArchitectureTask = defineTask('dashboard-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design dashboard architecture',
  agent: {
    name: 'dashboard-architect',
    prompt: {
      role: 'Dashboard architect',
      task: 'Design overall dashboard architecture',
      context: args,
      instructions: ['Define dashboard hierarchy', 'Design navigation', 'Plan drill-down paths', 'Define filtering', 'Create wireframes']
    },
    outputSchema: { type: 'object', required: ['design', 'hierarchy', 'artifacts'], properties: { design: { type: 'object' }, hierarchy: { type: 'object' }, navigation: { type: 'object' }, wireframes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dashboard', 'architecture']
}));

export const visualizationDesignTask = defineTask('visualization-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design visualizations',
  agent: {
    name: 'viz-designer',
    prompt: {
      role: 'Data visualization specialist',
      task: 'Design data visualizations for dashboards',
      context: args,
      instructions: ['Select chart types', 'Design color schemes', 'Plan interactivity', 'Define formatting', 'Create visualization specs']
    },
    outputSchema: { type: 'object', required: ['visualizations', 'specs', 'artifacts'], properties: { visualizations: { type: 'array' }, specs: { type: 'object' }, interactivity: { type: 'object' }, formatting: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dashboard', 'visualization']
}));

export const executiveDashboardTask = defineTask('executive-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design executive dashboard',
  agent: {
    name: 'executive-designer',
    prompt: {
      role: 'Executive reporting specialist',
      task: 'Design executive summary dashboard',
      context: args,
      instructions: ['Define executive KPIs', 'Design summary views', 'Create trend analysis', 'Add commentary areas', 'Design mobile view']
    },
    outputSchema: { type: 'object', required: ['dashboard', 'kpis', 'artifacts'], properties: { dashboard: { type: 'object' }, kpis: { type: 'array' }, layout: { type: 'object' }, mobileDesign: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dashboard', 'executive']
}));

export const operationalDashboardsTask = defineTask('operational-dashboards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design operational dashboards',
  agent: {
    name: 'operational-designer',
    prompt: {
      role: 'Operational reporting specialist',
      task: 'Design operational marketing dashboards',
      context: args,
      instructions: ['Design channel dashboards', 'Create campaign dashboards', 'Build funnel dashboards', 'Add tactical details', 'Enable self-service']
    },
    outputSchema: { type: 'object', required: ['dashboards', 'specifications', 'artifacts'], properties: { dashboards: { type: 'array' }, specifications: { type: 'object' }, selfService: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dashboard', 'operational']
}));

export const dashboardAlertingTask = defineTask('dashboard-alerting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up alerting',
  agent: {
    name: 'alerting-designer',
    prompt: {
      role: 'Alerting and monitoring specialist',
      task: 'Design dashboard alerting system',
      context: args,
      instructions: ['Define alert thresholds', 'Design notification rules', 'Plan escalation', 'Define anomaly detection', 'Create alert documentation']
    },
    outputSchema: { type: 'object', required: ['alerts', 'thresholds', 'artifacts'], properties: { alerts: { type: 'array' }, thresholds: { type: 'object' }, notifications: { type: 'object' }, anomalyDetection: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dashboard', 'alerting']
}));

export const reportingFrameworkTask = defineTask('reporting-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create reporting framework',
  agent: {
    name: 'reporting-designer',
    prompt: {
      role: 'Reporting framework specialist',
      task: 'Create comprehensive reporting framework',
      context: args,
      instructions: ['Define reporting cadence', 'Create report templates', 'Define distribution', 'Plan automation', 'Create governance']
    },
    outputSchema: { type: 'object', required: ['framework', 'templates', 'artifacts'], properties: { framework: { type: 'object' }, templates: { type: 'array' }, automation: { type: 'object' }, governance: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dashboard', 'reporting']
}));

export const dashboardQualityTask = defineTask('dashboard-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess dashboard quality',
  agent: {
    name: 'dashboard-validator',
    prompt: {
      role: 'Business intelligence director',
      task: 'Assess overall dashboard quality',
      context: args,
      instructions: ['Evaluate completeness', 'Assess usability', 'Review visualization', 'Assess actionability', 'Calculate overall score']
    },
    outputSchema: { type: 'object', required: ['overallScore', 'componentScores', 'artifacts'], properties: { overallScore: { type: 'number' }, componentScores: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dashboard', 'quality-assessment']
}));
