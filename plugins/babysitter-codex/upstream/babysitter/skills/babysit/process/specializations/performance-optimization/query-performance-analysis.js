/**
 * @process specializations/performance-optimization/query-performance-analysis
 * @description Query Performance Analysis - Analyze and optimize slow database queries including execution plan
 * analysis, index identification, join strategy optimization, and query complexity review.
 * @inputs { projectName: string, database: string, slowQueryThreshold?: number }
 * @outputs { success: boolean, slowQueries: array, optimizations: array, improvementMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/query-performance-analysis', {
 *   projectName: 'E-commerce Platform',
 *   database: 'postgresql',
 *   slowQueryThreshold: 100
 * });
 *
 * @references
 * - Use The Index Luke: https://use-the-index-luke.com/
 * - PostgreSQL EXPLAIN: https://www.postgresql.org/docs/current/sql-explain.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    database = 'postgresql',
    slowQueryThreshold = 100,
    outputDir = 'query-performance-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Query Performance Analysis for ${projectName}`);

  // Phase 1: Identify Slow Queries
  const slowQueries = await ctx.task(identifySlowQueriesTask, { projectName, database, slowQueryThreshold, outputDir });
  artifacts.push(...slowQueries.artifacts);

  // Phase 2: Analyze Query Execution Plans
  const executionPlans = await ctx.task(analyzeExecutionPlansTask, { projectName, slowQueries, database, outputDir });
  artifacts.push(...executionPlans.artifacts);

  await ctx.breakpoint({
    question: `Found ${slowQueries.queries.length} slow queries. ${executionPlans.fullScans} full table scans detected. Analyze?`,
    title: 'Slow Query Analysis',
    context: { runId: ctx.runId, slowQueries, executionPlans }
  });

  // Phase 3: Identify Missing Indexes
  const missingIndexes = await ctx.task(identifyMissingIndexesTask, { projectName, executionPlans, outputDir });
  artifacts.push(...missingIndexes.artifacts);

  // Phase 4: Detect Full Table Scans
  const tableScans = await ctx.task(detectFullTableScansTask, { projectName, executionPlans, outputDir });
  artifacts.push(...tableScans.artifacts);

  // Phase 5: Analyze Join Strategies
  const joinAnalysis = await ctx.task(analyzeJoinStrategiesTask, { projectName, executionPlans, outputDir });
  artifacts.push(...joinAnalysis.artifacts);

  // Phase 6: Review Query Complexity
  const complexityReview = await ctx.task(reviewQueryComplexityTask, { projectName, slowQueries, outputDir });
  artifacts.push(...complexityReview.artifacts);

  // Phase 7: Document Optimization Opportunities
  const optimizations = await ctx.task(documentOptimizationOpportunitiesTask, { projectName, missingIndexes, tableScans, joinAnalysis, complexityReview, outputDir });
  artifacts.push(...optimizations.artifacts);

  // Phase 8: Prioritize by Impact
  const priorities = await ctx.task(prioritizeQueryOptimizationsTask, { projectName, optimizations, outputDir });
  artifacts.push(...priorities.artifacts);

  await ctx.breakpoint({
    question: `Query analysis complete. ${optimizations.opportunities.length} optimization opportunities identified. Review recommendations?`,
    title: 'Query Optimization Recommendations',
    context: { runId: ctx.runId, priorities }
  });

  return {
    success: true,
    projectName,
    slowQueries: slowQueries.queries,
    optimizations: optimizations.opportunities,
    priorities: priorities.prioritizedList,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/query-performance-analysis', timestamp: startTime, outputDir }
  };
}

export const identifySlowQueriesTask = defineTask('identify-slow-queries', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Slow Queries - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Performance Engineer', task: 'Identify slow queries from logs/monitoring', context: args,
      instructions: ['1. Enable slow query logging', '2. Collect slow queries', '3. Analyze frequency', '4. Calculate impact', '5. Document queries'],
      outputFormat: 'JSON with slow queries' },
    outputSchema: { type: 'object', required: ['queries', 'artifacts'], properties: { queries: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'query', 'slow-queries']
}));

export const analyzeExecutionPlansTask = defineTask('analyze-execution-plans', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Execution Plans - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Performance Engineer', task: 'Analyze query execution plans', context: args,
      instructions: ['1. Run EXPLAIN ANALYZE', '2. Analyze plan nodes', '3. Identify costly operations', '4. Find scan types', '5. Document plans'],
      outputFormat: 'JSON with execution plan analysis' },
    outputSchema: { type: 'object', required: ['plans', 'fullScans', 'artifacts'], properties: { plans: { type: 'array' }, fullScans: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'query', 'execution-plans']
}));

export const identifyMissingIndexesTask = defineTask('identify-missing-indexes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Missing Indexes - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Performance Engineer', task: 'Identify missing indexes', context: args,
      instructions: ['1. Analyze WHERE clauses', '2. Analyze JOIN conditions', '3. Check ORDER BY columns', '4. Identify index candidates', '5. Document recommendations'],
      outputFormat: 'JSON with missing indexes' },
    outputSchema: { type: 'object', required: ['indexes', 'artifacts'], properties: { indexes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'query', 'indexes']
}));

export const detectFullTableScansTask = defineTask('detect-full-table-scans', (args, taskCtx) => ({
  kind: 'agent',
  title: `Detect Full Table Scans - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Performance Engineer', task: 'Detect full table scans', context: args,
      instructions: ['1. Find sequential scans', '2. Analyze table sizes', '3. Calculate scan cost', '4. Identify causes', '5. Document findings'],
      outputFormat: 'JSON with table scan analysis' },
    outputSchema: { type: 'object', required: ['scans', 'artifacts'], properties: { scans: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'query', 'table-scans']
}));

export const analyzeJoinStrategiesTask = defineTask('analyze-join-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Join Strategies - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Performance Engineer', task: 'Analyze join strategies', context: args,
      instructions: ['1. Identify join types', '2. Analyze join costs', '3. Check join order', '4. Find nested loops', '5. Document analysis'],
      outputFormat: 'JSON with join analysis' },
    outputSchema: { type: 'object', required: ['joins', 'artifacts'], properties: { joins: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'query', 'joins']
}));

export const reviewQueryComplexityTask = defineTask('review-query-complexity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review Query Complexity - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Performance Engineer', task: 'Review query complexity', context: args,
      instructions: ['1. Analyze subqueries', '2. Review CTEs', '3. Check DISTINCT/GROUP BY', '4. Analyze aggregations', '5. Document complexity'],
      outputFormat: 'JSON with complexity review' },
    outputSchema: { type: 'object', required: ['complexityIssues', 'artifacts'], properties: { complexityIssues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'query', 'complexity']
}));

export const documentOptimizationOpportunitiesTask = defineTask('document-optimization-opportunities', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Optimization Opportunities - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Performance Engineer', task: 'Document optimization opportunities', context: args,
      instructions: ['1. Compile all findings', '2. Document recommendations', '3. Estimate improvements', '4. Create action items', '5. Generate report'],
      outputFormat: 'JSON with optimization opportunities' },
    outputSchema: { type: 'object', required: ['opportunities', 'artifacts'], properties: { opportunities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'query', 'documentation']
}));

export const prioritizeQueryOptimizationsTask = defineTask('prioritize-query-optimizations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prioritize Query Optimizations - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Performance Engineer', task: 'Prioritize query optimizations by impact', context: args,
      instructions: ['1. Score by impact', '2. Consider frequency', '3. Estimate effort', '4. Calculate ROI', '5. Create prioritized list'],
      outputFormat: 'JSON with prioritized optimizations' },
    outputSchema: { type: 'object', required: ['prioritizedList', 'artifacts'], properties: { prioritizedList: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'query', 'prioritization']
}));
