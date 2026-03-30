/**
 * @process specializations/performance-optimization/performance-tuning-recommendations
 * @description Performance Tuning Recommendations - Generate comprehensive performance tuning recommendations
 * based on profiling data, benchmarks, and best practices including prioritized action items and implementation guidance.
 * @inputs { projectName: string, profilingData: object, benchmarkResults: object }
 * @outputs { success: boolean, recommendations: array, priorityMatrix: object, implementationPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/performance-tuning-recommendations', {
 *   projectName: 'API Service',
 *   profilingData: cpuProfilingResults,
 *   benchmarkResults: loadTestResults
 * });
 *
 * @references
 * - Systems Performance: https://www.brendangregg.com/systems-performance-2nd-edition-book.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    profilingData = {},
    benchmarkResults = {},
    outputDir = 'tuning-recommendations-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Performance Tuning Recommendations for ${projectName}`);

  // Phase 1: Analyze Profiling Results
  const profilingAnalysis = await ctx.task(analyzeProfilingResultsTask, { projectName, profilingData, outputDir });
  artifacts.push(...profilingAnalysis.artifacts);

  // Phase 2: Review Benchmark Data
  const benchmarkAnalysis = await ctx.task(reviewBenchmarkDataTask, { projectName, benchmarkResults, outputDir });
  artifacts.push(...benchmarkAnalysis.artifacts);

  // Phase 3: Identify Performance Gaps
  const performanceGaps = await ctx.task(identifyPerformanceGapsTask, { projectName, profilingAnalysis, benchmarkAnalysis, outputDir });
  artifacts.push(...performanceGaps.artifacts);

  await ctx.breakpoint({
    question: `Identified ${performanceGaps.gaps.length} performance gaps. Generate optimization recommendations?`,
    title: 'Performance Gap Analysis',
    context: { runId: ctx.runId, performanceGaps }
  });

  // Phase 4: Generate Optimization Recommendations
  const recommendations = await ctx.task(generateOptimizationRecommendationsTask, { projectName, performanceGaps, outputDir });
  artifacts.push(...recommendations.artifacts);

  // Phase 5: Create Priority Matrix
  const priorityMatrix = await ctx.task(createPriorityMatrixTask, { projectName, recommendations, outputDir });
  artifacts.push(...priorityMatrix.artifacts);

  // Phase 6: Estimate Improvement Impact
  const impactEstimation = await ctx.task(estimateImprovementImpactTask, { projectName, recommendations, outputDir });
  artifacts.push(...impactEstimation.artifacts);

  // Phase 7: Develop Implementation Plan
  const implementationPlan = await ctx.task(developImplementationPlanTask, { projectName, recommendations, priorityMatrix, outputDir });
  artifacts.push(...implementationPlan.artifacts);

  // Phase 8: Document Recommendations
  const documentation = await ctx.task(documentTuningRecommendationsTask, { projectName, recommendations, priorityMatrix, implementationPlan, impactEstimation, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `${recommendations.recommendations.length} recommendations generated. Estimated improvement: ${impactEstimation.totalImprovement}%. Accept?`,
    title: 'Tuning Recommendations Review',
    context: { runId: ctx.runId, recommendations, impactEstimation }
  });

  return {
    success: true,
    projectName,
    recommendations: recommendations.recommendations,
    priorityMatrix: priorityMatrix.matrix,
    implementationPlan: implementationPlan.plan,
    estimatedImprovement: impactEstimation.totalImprovement,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/performance-tuning-recommendations', timestamp: startTime, outputDir }
  };
}

export const analyzeProfilingResultsTask = defineTask('analyze-profiling-results', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Profiling Results - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Analyze profiling results', context: args,
      instructions: ['1. Review CPU profiling', '2. Review memory profiling', '3. Review I/O profiling', '4. Identify hotspots', '5. Document analysis'],
      outputFormat: 'JSON with profiling analysis' },
    outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'tuning', 'analysis']
}));

export const reviewBenchmarkDataTask = defineTask('review-benchmark-data', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review Benchmark Data - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Review benchmark data', context: args,
      instructions: ['1. Analyze latency data', '2. Analyze throughput data', '3. Review error rates', '4. Compare to baselines', '5. Document review'],
      outputFormat: 'JSON with benchmark review' },
    outputSchema: { type: 'object', required: ['review', 'artifacts'], properties: { review: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'tuning', 'benchmarks']
}));

export const identifyPerformanceGapsTask = defineTask('identify-performance-gaps', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Performance Gaps - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Identify performance gaps', context: args,
      instructions: ['1. Compare to targets', '2. Identify bottlenecks', '3. Find inefficiencies', '4. Rank by severity', '5. Document gaps'],
      outputFormat: 'JSON with performance gaps' },
    outputSchema: { type: 'object', required: ['gaps', 'artifacts'], properties: { gaps: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'tuning', 'gaps']
}));

export const generateOptimizationRecommendationsTask = defineTask('generate-optimization-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Recommendations - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Generate optimization recommendations', context: args,
      instructions: ['1. Recommend code changes', '2. Recommend config changes', '3. Recommend architecture changes', '4. Include rationale', '5. Document recommendations'],
      outputFormat: 'JSON with recommendations' },
    outputSchema: { type: 'object', required: ['recommendations', 'artifacts'], properties: { recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'tuning', 'recommendations']
}));

export const createPriorityMatrixTask = defineTask('create-priority-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Priority Matrix - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Create priority matrix', context: args,
      instructions: ['1. Score by impact', '2. Score by effort', '3. Calculate ROI', '4. Create quadrants', '5. Document matrix'],
      outputFormat: 'JSON with priority matrix' },
    outputSchema: { type: 'object', required: ['matrix', 'artifacts'], properties: { matrix: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'tuning', 'priority']
}));

export const estimateImprovementImpactTask = defineTask('estimate-improvement-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: `Estimate Improvement Impact - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Estimate improvement impact', context: args,
      instructions: ['1. Estimate per recommendation', '2. Calculate cumulative impact', '3. Consider dependencies', '4. Provide confidence levels', '5. Document estimates'],
      outputFormat: 'JSON with impact estimates' },
    outputSchema: { type: 'object', required: ['totalImprovement', 'artifacts'], properties: { totalImprovement: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'tuning', 'impact']
}));

export const developImplementationPlanTask = defineTask('develop-implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Develop Implementation Plan - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Develop implementation plan', context: args,
      instructions: ['1. Sequence recommendations', '2. Define milestones', '3. Estimate timelines', '4. Identify dependencies', '5. Document plan'],
      outputFormat: 'JSON with implementation plan' },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'tuning', 'implementation']
}));

export const documentTuningRecommendationsTask = defineTask('document-tuning-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Recommendations - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Document tuning recommendations', context: args,
      instructions: ['1. Summarize findings', '2. Detail recommendations', '3. Include implementation steps', '4. Add success metrics', '5. Generate report'],
      outputFormat: 'JSON with documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'tuning', 'documentation']
}));
