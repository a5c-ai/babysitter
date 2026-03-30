/**
 * @process sales/revenue-forecasting-planning
 * @description Comprehensive revenue forecasting and planning process with bottom-up and top-down approaches, scenario modeling, and variance analysis.
 * @inputs { historicalData: object, pipelineData: object, planningPeriod: string, assumptions?: object, scenarios?: array }
 * @outputs { success: boolean, forecast: object, scenarios: array, planningCalendar: object, varianceModel: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/revenue-forecasting-planning', {
 *   historicalData: { revenue: [], growth: [] },
 *   pipelineData: { opportunities: [], stages: [] },
 *   planningPeriod: 'FY2025',
 *   scenarios: ['base', 'optimistic', 'conservative']
 * });
 *
 * @references
 * - Anaplan Revenue Planning: https://www.anaplan.com/
 * - Clari Revenue Operations: https://www.clari.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    historicalData = {},
    pipelineData = {},
    planningPeriod,
    assumptions = {},
    scenarios = ['base', 'optimistic', 'conservative'],
    outputDir = 'revenue-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Revenue Forecasting for ${planningPeriod}`);

  // Phase 1: Historical Analysis
  const historicalAnalysis = await ctx.task(historicalAnalysisTask, { historicalData, planningPeriod, outputDir });
  artifacts.push(...(historicalAnalysis.artifacts || []));

  // Phase 2: Pipeline Analysis
  const pipelineAnalysis = await ctx.task(pipelineAnalysisTask, { pipelineData, outputDir });
  artifacts.push(...(pipelineAnalysis.artifacts || []));

  // Phase 3: Bottom-Up Forecast
  const bottomUpForecast = await ctx.task(bottomUpForecastTask, { pipelineAnalysis, assumptions, outputDir });
  artifacts.push(...(bottomUpForecast.artifacts || []));

  // Phase 4: Top-Down Forecast
  const topDownForecast = await ctx.task(topDownForecastTask, { historicalAnalysis, assumptions, planningPeriod, outputDir });
  artifacts.push(...(topDownForecast.artifacts || []));

  // Phase 5: Forecast Reconciliation
  const forecastReconciliation = await ctx.task(forecastReconciliationTask, {
    bottomUpForecast, topDownForecast, outputDir
  });
  artifacts.push(...(forecastReconciliation.artifacts || []));

  // Phase 6: Scenario Modeling
  const scenarioModeling = await ctx.task(scenarioModelingTask, {
    forecastReconciliation, scenarios, assumptions, outputDir
  });
  artifacts.push(...(scenarioModeling.artifacts || []));

  // Phase 7: Risk and Sensitivity Analysis
  const riskAnalysis = await ctx.task(riskSensitivityAnalysisTask, {
    scenarioModeling, pipelineAnalysis, outputDir
  });
  artifacts.push(...(riskAnalysis.artifacts || []));

  // Phase 8: Planning Calendar and Milestones
  const planningCalendar = await ctx.task(planningCalendarTask, {
    forecastReconciliation, planningPeriod, outputDir
  });
  artifacts.push(...(planningCalendar.artifacts || []));

  // Phase 9: Forecast Report Compilation
  const forecastReport = await ctx.task(forecastReportCompilationTask, {
    forecastReconciliation, scenarioModeling, riskAnalysis, planningCalendar, outputDir
  });
  artifacts.push(...(forecastReport.artifacts || []));

  await ctx.breakpoint({
    question: `Revenue forecast complete for ${planningPeriod}. ${scenarios.length} scenarios modeled. Review forecast?`,
    title: 'Revenue Forecast Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    planningPeriod,
    forecast: forecastReconciliation.reconciledForecast,
    scenarios: scenarioModeling.scenarioResults,
    riskFactors: riskAnalysis.riskFactors,
    planningCalendar: planningCalendar.calendar,
    varianceModel: forecastReport.varianceModel,
    artifacts,
    metadata: { processId: 'sales/revenue-forecasting-planning', timestamp: startTime }
  };
}

export const historicalAnalysisTask = defineTask('historical-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Historical Revenue Analysis',
  agent: {
    name: 'revenue-analyst',
    prompt: {
      role: 'Historical revenue analyst',
      task: 'Analyze historical revenue patterns',
      context: args,
      instructions: ['Analyze revenue trends', 'Identify seasonality', 'Calculate growth rates', 'Document historical patterns']
    },
    outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, trends: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'historical-analysis']
}));

export const pipelineAnalysisTask = defineTask('pipeline-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Pipeline Analysis',
  agent: {
    name: 'pipeline-analyst',
    prompt: {
      role: 'Pipeline analyst',
      task: 'Analyze current pipeline for forecasting',
      context: args,
      instructions: ['Analyze pipeline by stage', 'Calculate conversion rates', 'Assess deal aging', 'Identify pipeline gaps']
    },
    outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, conversionRates: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'pipeline-analysis']
}));

export const bottomUpForecastTask = defineTask('bottom-up-forecast', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Bottom-Up Forecast',
  agent: {
    name: 'forecast-analyst',
    prompt: {
      role: 'Bottom-up forecast analyst',
      task: 'Build bottom-up revenue forecast',
      context: args,
      instructions: ['Project from current pipeline', 'Apply stage probabilities', 'Factor in rep attainment', 'Calculate weighted forecast']
    },
    outputSchema: { type: 'object', required: ['forecast', 'artifacts'], properties: { forecast: { type: 'object' }, methodology: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'bottom-up']
}));

export const topDownForecastTask = defineTask('top-down-forecast', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Top-Down Forecast',
  agent: {
    name: 'forecast-analyst',
    prompt: {
      role: 'Top-down forecast analyst',
      task: 'Build top-down revenue forecast',
      context: args,
      instructions: ['Apply growth assumptions', 'Factor market conditions', 'Consider capacity constraints', 'Model market share']
    },
    outputSchema: { type: 'object', required: ['forecast', 'artifacts'], properties: { forecast: { type: 'object' }, assumptions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'top-down']
}));

export const forecastReconciliationTask = defineTask('forecast-reconciliation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Forecast Reconciliation',
  agent: {
    name: 'forecast-reconciler',
    prompt: {
      role: 'Forecast reconciliation specialist',
      task: 'Reconcile bottom-up and top-down forecasts',
      context: args,
      instructions: ['Compare forecasts', 'Identify gaps', 'Reconcile differences', 'Build consensus forecast']
    },
    outputSchema: { type: 'object', required: ['reconciledForecast', 'artifacts'], properties: { reconciledForecast: { type: 'object' }, gapAnalysis: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'reconciliation']
}));

export const scenarioModelingTask = defineTask('scenario-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scenario Modeling',
  agent: {
    name: 'scenario-modeler',
    prompt: {
      role: 'Scenario modeling specialist',
      task: 'Model revenue scenarios',
      context: args,
      instructions: ['Build base scenario', 'Model optimistic case', 'Model conservative case', 'Define triggers for each']
    },
    outputSchema: { type: 'object', required: ['scenarioResults', 'artifacts'], properties: { scenarioResults: { type: 'array' }, triggers: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'scenarios']
}));

export const riskSensitivityAnalysisTask = defineTask('risk-sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Risk and Sensitivity Analysis',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'Forecast risk analyst',
      task: 'Analyze forecast risks and sensitivities',
      context: args,
      instructions: ['Identify risk factors', 'Model sensitivities', 'Calculate confidence intervals', 'Document assumptions risks']
    },
    outputSchema: { type: 'object', required: ['riskFactors', 'artifacts'], properties: { riskFactors: { type: 'array' }, sensitivities: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'risk-analysis']
}));

export const planningCalendarTask = defineTask('planning-calendar', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Planning Calendar and Milestones',
  agent: {
    name: 'planning-specialist',
    prompt: {
      role: 'Revenue planning specialist',
      task: 'Create planning calendar and milestones',
      context: args,
      instructions: ['Define planning cadence', 'Set review milestones', 'Plan forecast updates', 'Schedule variance reviews']
    },
    outputSchema: { type: 'object', required: ['calendar', 'artifacts'], properties: { calendar: { type: 'object' }, milestones: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'planning']
}));

export const forecastReportCompilationTask = defineTask('forecast-report-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Forecast Report Compilation',
  agent: {
    name: 'report-compiler',
    prompt: {
      role: 'Revenue forecast report compiler',
      task: 'Compile comprehensive forecast report',
      context: args,
      instructions: ['Compile executive summary', 'Document methodology', 'Present scenarios', 'Create variance model']
    },
    outputSchema: { type: 'object', required: ['report', 'varianceModel', 'artifacts'], properties: { report: { type: 'object' }, varianceModel: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['sales', 'revops', 'reporting']
}));
