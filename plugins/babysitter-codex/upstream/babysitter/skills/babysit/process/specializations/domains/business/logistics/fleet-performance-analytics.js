/**
 * @process specializations/domains/business/logistics/fleet-performance-analytics
 * @description Comprehensive fleet KPI monitoring, benchmarking, and analytics to drive operational excellence and cost efficiency.
 * @inputs { vehicles: array, tripData: array, costData?: array, benchmarks?: object }
 * @outputs { success: boolean, performanceDashboard: object, kpiScorecard: object, recommendations: array, trends: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/logistics/fleet-performance-analytics', {
 *   vehicles: [{ id: 'V001', type: 'tractor', region: 'midwest' }],
 *   tripData: [{ vehicleId: 'V001', miles: 500, fuel: 75, date: '2024-01-15' }],
 *   costData: [{ vehicleId: 'V001', category: 'fuel', amount: 300 }]
 * });
 *
 * @references
 * - ATA: https://www.trucking.org/
 * - ATRI: https://truckingresearch.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    vehicles = [],
    tripData = [],
    costData = [],
    benchmarks = {},
    outputDir = 'fleet-performance-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Fleet Performance Analytics Process');
  ctx.log('info', `Vehicles: ${vehicles.length}, Trips: ${tripData.length}`);

  // PHASE 1: DATA AGGREGATION
  ctx.log('info', 'Phase 1: Aggregating fleet data');
  const dataAggregation = await ctx.task(fleetDataAggregationTask, { vehicles, tripData, costData, outputDir });
  artifacts.push(...dataAggregation.artifacts);

  // PHASE 2: KPI CALCULATION
  ctx.log('info', 'Phase 2: Calculating KPIs');
  const kpiCalculation = await ctx.task(fleetKpiCalculationTask, { aggregatedData: dataAggregation.data, outputDir });
  artifacts.push(...kpiCalculation.artifacts);

  // PHASE 3: BENCHMARKING ANALYSIS
  ctx.log('info', 'Phase 3: Performing benchmarking analysis');
  const benchmarkingAnalysis = await ctx.task(fleetBenchmarkingTask, { kpis: kpiCalculation.kpis, benchmarks, outputDir });
  artifacts.push(...benchmarkingAnalysis.artifacts);

  // PHASE 4: TREND ANALYSIS
  ctx.log('info', 'Phase 4: Analyzing trends');
  const trendAnalysis = await ctx.task(fleetTrendAnalysisTask, { tripData, kpis: kpiCalculation.kpis, outputDir });
  artifacts.push(...trendAnalysis.artifacts);

  // Quality Gate: Review performance metrics
  await ctx.breakpoint({
    question: `Fleet performance analysis complete. Overall score: ${benchmarkingAnalysis.overallScore}/100. ${benchmarkingAnalysis.belowBenchmark} KPIs below benchmark. Review findings?`,
    title: 'Fleet Performance Review',
    context: {
      runId: ctx.runId,
      summary: { overallScore: benchmarkingAnalysis.overallScore, belowBenchmark: benchmarkingAnalysis.belowBenchmark },
      files: benchmarkingAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // PHASE 5: COST ANALYSIS
  ctx.log('info', 'Phase 5: Analyzing costs');
  const costAnalysis = await ctx.task(fleetCostAnalysisTask, { costData, vehicles, kpis: kpiCalculation.kpis, outputDir });
  artifacts.push(...costAnalysis.artifacts);

  // PHASE 6: UTILIZATION ANALYSIS
  ctx.log('info', 'Phase 6: Analyzing utilization');
  const utilizationAnalysis = await ctx.task(fleetUtilizationTask, { tripData, vehicles, outputDir });
  artifacts.push(...utilizationAnalysis.artifacts);

  // PHASE 7: DRIVER PERFORMANCE
  ctx.log('info', 'Phase 7: Analyzing driver performance');
  const driverPerformance = await ctx.task(driverPerformanceAnalyticsTask, { tripData, outputDir });
  artifacts.push(...driverPerformance.artifacts);

  // PHASE 8: RECOMMENDATION ENGINE
  ctx.log('info', 'Phase 8: Generating recommendations');
  const recommendations = await ctx.task(fleetRecommendationsTask, { benchmarkingAnalysis, costAnalysis, utilizationAnalysis, outputDir });
  artifacts.push(...recommendations.artifacts);

  // PHASE 9: DASHBOARD GENERATION
  ctx.log('info', 'Phase 9: Generating performance dashboard');
  const dashboardGeneration = await ctx.task(fleetDashboardTask, { kpiCalculation, benchmarkingAnalysis, trendAnalysis, recommendations, outputDir });
  artifacts.push(...dashboardGeneration.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Fleet analytics complete. Overall score: ${benchmarkingAnalysis.overallScore}/100. Cost per mile: $${costAnalysis.costPerMile}. ${recommendations.recommendations.length} recommendations generated. Approve report?`,
    title: 'Fleet Performance Analytics Complete',
    context: {
      runId: ctx.runId,
      summary: {
        vehiclesAnalyzed: vehicles.length,
        overallScore: benchmarkingAnalysis.overallScore,
        costPerMile: `$${costAnalysis.costPerMile}`,
        utilizationRate: `${utilizationAnalysis.utilizationRate}%`,
        recommendations: recommendations.recommendations.length
      },
      files: [{ path: dashboardGeneration.dashboardPath, format: 'markdown', label: 'Performance Dashboard' }]
    }
  });

  const endTime = ctx.now();
  return {
    success: true,
    performanceDashboard: dashboardGeneration.dashboard,
    kpiScorecard: kpiCalculation.kpis,
    recommendations: recommendations.recommendations,
    trends: trendAnalysis.trends,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/domains/business/logistics/fleet-performance-analytics', timestamp: startTime, outputDir }
  };
}

// TASK DEFINITIONS
export const fleetDataAggregationTask = defineTask('fleet-data-aggregation', (args, taskCtx) => ({
  kind: 'agent', title: 'Aggregate fleet data', agent: { name: 'fleet-data-aggregator', prompt: { role: 'Fleet Data Aggregation Specialist', task: 'Aggregate and normalize fleet data for analysis', context: args, instructions: ['Collect vehicle data', 'Normalize trip records', 'Aggregate cost data', 'Handle missing data', 'Create analysis datasets', 'Generate data summary'] }, outputSchema: { type: 'object', required: ['data', 'artifacts'], properties: { data: { type: 'object' }, dataSummary: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'fleet-analytics', 'data-aggregation']
}));

export const fleetKpiCalculationTask = defineTask('fleet-kpi-calculation', (args, taskCtx) => ({
  kind: 'agent', title: 'Calculate fleet KPIs', agent: { name: 'fleet-kpi-specialist', prompt: { role: 'Fleet KPI Calculation Specialist', task: 'Calculate key performance indicators for fleet', context: args, instructions: ['Calculate fuel efficiency', 'Calculate utilization rate', 'Calculate cost per mile', 'Calculate maintenance costs', 'Calculate safety metrics', 'Generate KPI scorecard'] }, outputSchema: { type: 'object', required: ['kpis', 'artifacts'], properties: { kpis: { type: 'object' }, kpiDetails: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'fleet-analytics', 'kpi']
}));

export const fleetBenchmarkingTask = defineTask('fleet-benchmarking', (args, taskCtx) => ({
  kind: 'agent', title: 'Perform benchmarking analysis', agent: { name: 'fleet-benchmarking-analyst', prompt: { role: 'Fleet Benchmarking Analyst', task: 'Compare fleet performance against benchmarks', context: args, instructions: ['Compare to industry benchmarks', 'Identify performance gaps', 'Calculate percentile rankings', 'Score overall performance', 'Identify best practices', 'Generate benchmark report'] }, outputSchema: { type: 'object', required: ['overallScore', 'belowBenchmark', 'artifacts'], properties: { overallScore: { type: 'number' }, belowBenchmark: { type: 'number' }, benchmarkComparison: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'fleet-analytics', 'benchmarking']
}));

export const fleetTrendAnalysisTask = defineTask('fleet-trend-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze trends', agent: { name: 'fleet-trend-analyst', prompt: { role: 'Fleet Trend Analysis Specialist', task: 'Analyze performance trends over time', context: args, instructions: ['Analyze historical trends', 'Identify seasonality', 'Detect anomalies', 'Project future trends', 'Calculate growth rates', 'Generate trend report'] }, outputSchema: { type: 'object', required: ['trends', 'artifacts'], properties: { trends: { type: 'object' }, anomalies: { type: 'array' }, projections: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'fleet-analytics', 'trend-analysis']
}));

export const fleetCostAnalysisTask = defineTask('fleet-cost-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze costs', agent: { name: 'fleet-cost-analyst', prompt: { role: 'Fleet Cost Analysis Specialist', task: 'Analyze fleet operating costs', context: args, instructions: ['Break down by category', 'Calculate cost per mile', 'Calculate cost per vehicle', 'Identify cost drivers', 'Find cost reduction opportunities', 'Generate cost report'] }, outputSchema: { type: 'object', required: ['costPerMile', 'costBreakdown', 'artifacts'], properties: { costPerMile: { type: 'number' }, costBreakdown: { type: 'object' }, opportunities: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'fleet-analytics', 'cost-analysis']
}));

export const fleetUtilizationTask = defineTask('fleet-utilization', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze utilization', agent: { name: 'fleet-utilization-analyst', prompt: { role: 'Fleet Utilization Analyst', task: 'Analyze fleet utilization metrics', context: args, instructions: ['Calculate utilization rates', 'Identify idle time', 'Analyze capacity usage', 'Find underutilized assets', 'Recommend right-sizing', 'Generate utilization report'] }, outputSchema: { type: 'object', required: ['utilizationRate', 'artifacts'], properties: { utilizationRate: { type: 'number' }, utilizationByVehicle: { type: 'array' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'fleet-analytics', 'utilization']
}));

export const driverPerformanceAnalyticsTask = defineTask('driver-performance-analytics', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze driver performance', agent: { name: 'driver-performance-analyst', prompt: { role: 'Driver Performance Analyst', task: 'Analyze driver performance metrics', context: args, instructions: ['Calculate driver scorecards', 'Analyze fuel efficiency by driver', 'Review safety events', 'Identify top performers', 'Find coaching opportunities', 'Generate driver performance report'] }, outputSchema: { type: 'object', required: ['driverScores', 'artifacts'], properties: { driverScores: { type: 'array' }, topPerformers: { type: 'array' }, coachingNeeds: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'fleet-analytics', 'driver-performance']
}));

export const fleetRecommendationsTask = defineTask('fleet-recommendations', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate recommendations', agent: { name: 'fleet-recommendation-specialist', prompt: { role: 'Fleet Recommendation Specialist', task: 'Generate actionable recommendations', context: args, instructions: ['Prioritize improvements', 'Calculate ROI potential', 'Create action plans', 'Set targets', 'Identify quick wins', 'Generate recommendations report'] }, outputSchema: { type: 'object', required: ['recommendations', 'artifacts'], properties: { recommendations: { type: 'array' }, prioritizedActions: { type: 'array' }, roiEstimates: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'fleet-analytics', 'recommendations']
}));

export const fleetDashboardTask = defineTask('fleet-dashboard', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate performance dashboard', agent: { name: 'fleet-dashboard-specialist', prompt: { role: 'Fleet Dashboard Specialist', task: 'Generate comprehensive fleet performance dashboard', context: args, instructions: ['Design dashboard layout', 'Create KPI visualizations', 'Add trend charts', 'Include benchmarks', 'Highlight recommendations', 'Generate executive dashboard'] }, outputSchema: { type: 'object', required: ['dashboard', 'dashboardPath', 'artifacts'], properties: { dashboard: { type: 'object' }, dashboardPath: { type: 'string' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'logistics', 'fleet-analytics', 'dashboard']
}));
