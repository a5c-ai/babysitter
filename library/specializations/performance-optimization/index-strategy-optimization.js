/**
 * @process specializations/performance-optimization/index-strategy-optimization
 * @description Index Strategy Optimization - Design and implement optimal index strategy for database including
 * query pattern analysis, composite index design, covering index implementation, and index usage monitoring.
 * @inputs { projectName: string, database: string, tables?: array }
 * @outputs { success: boolean, indexRecommendations: array, implementedIndexes: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/index-strategy-optimization', {
 *   projectName: 'Order Management System',
 *   database: 'mysql',
 *   tables: ['orders', 'order_items', 'customers', 'products']
 * });
 *
 * @references
 * - Use The Index Luke: https://use-the-index-luke.com/sql/table-of-contents
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    database = 'postgresql',
    tables = [],
    outputDir = 'index-strategy-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Index Strategy Optimization for ${projectName}`);

  // Phase 1: Analyze Query Patterns
  const queryPatterns = await ctx.task(analyzeQueryPatternsTask, { projectName, database, tables, outputDir });
  artifacts.push(...queryPatterns.artifacts);

  // Phase 2: Review Existing Indexes
  const existingIndexes = await ctx.task(reviewExistingIndexesTask, { projectName, database, tables, outputDir });
  artifacts.push(...existingIndexes.artifacts);

  // Phase 3: Identify Redundant Indexes
  let redundantIndexes = await ctx.task(identifyRedundantIndexesTask, { projectName, existingIndexes, outputDir });
    let lastFeedback_phase3Review = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_phase3Review) {
      redundantIndexes = await ctx.task(identifyRedundantIndexesTask, { ...{ projectName, existingIndexes, outputDir }, feedback: lastFeedback_phase3Review, attempt: attempt + 1 });
    }
  const phase3Review = await ctx.breakpoint({
    question: `Found ${existingIndexes.indexes.length} existing indexes, ${redundantIndexes.redundant.length} redundant. Design new indexes?`,
    title: 'Index Analysis',
    context: { runId: ctx.runId, existingIndexes, redundantIndexes },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_phase3Review || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (phase3Review.approved) break;
    lastFeedback_phase3Review = phase3Review.response || phase3Review.feedback || 'Changes requested';
  }
  // Phase 4: Design Missing Indexes
  const missingIndexes = await ctx.task(designMissingIndexesTask, { projectName, queryPatterns, existingIndexes, outputDir });
  artifacts.push(...missingIndexes.artifacts);

  // Phase 5: Create Composite Indexes
  const compositeIndexes = await ctx.task(createCompositeIndexesTask, { projectName, queryPatterns, outputDir });
  artifacts.push(...compositeIndexes.artifacts);

  // Phase 6: Implement Covering Indexes
  const coveringIndexes = await ctx.task(implementCoveringIndexesTask, { projectName, queryPatterns, outputDir });
  artifacts.push(...coveringIndexes.artifacts);

  // Phase 7: Test Index Effectiveness
  const testing = await ctx.task(testIndexEffectivenessTask, { projectName, missingIndexes, compositeIndexes, coveringIndexes, outputDir });
  artifacts.push(...testing.artifacts);

  // Phase 8: Monitor Index Usage
  const monitoring = await ctx.task(monitorIndexUsageTask, { projectName, outputDir });
  artifacts.push(...monitoring.artifacts);

  // Phase 9: Document Index Strategy
  let documentation = await ctx.task(documentIndexStrategyTask, { projectName, missingIndexes, compositeIndexes, coveringIndexes, testing, outputDir });
    let lastFeedback_finalApproval = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_finalApproval) {
      documentation = await ctx.task(documentIndexStrategyTask, { ...{ projectName, missingIndexes, compositeIndexes, coveringIndexes, testing, outputDir }, feedback: lastFeedback_finalApproval, attempt: attempt + 1 });
    }
  const finalApproval = await ctx.breakpoint({
    question: `Index strategy complete. ${missingIndexes.indexes.length} new indexes designed. Query improvement: ${testing.improvement}%. Accept?`,
    title: 'Index Strategy Results',
    context: { runId: ctx.runId, testing },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_finalApproval || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (finalApproval.approved) break;
    lastFeedback_finalApproval = finalApproval.response || finalApproval.feedback || 'Changes requested';
  }
  return {
    success: true,
    projectName,
    indexRecommendations: [...missingIndexes.indexes, ...compositeIndexes.indexes, ...coveringIndexes.indexes],
    implementedIndexes: testing.implementedIndexes,
    redundantIndexes: redundantIndexes.redundant,
    queryImprovement: testing.improvement,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/index-strategy-optimization', timestamp: startTime, outputDir }
  };
}

export const analyzeQueryPatternsTask = defineTask('analyze-query-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Query Patterns - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Performance Engineer', task: 'Analyze query patterns for index design', context: args,
      instructions: ['1. Collect query workload', '2. Analyze WHERE clauses', '3. Analyze JOIN conditions', '4. Analyze ORDER BY', '5. Document patterns'],
      outputFormat: 'JSON with query patterns' },
    outputSchema: { type: 'object', required: ['patterns', 'artifacts'], properties: { patterns: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'index', 'patterns']
}));

export const reviewExistingIndexesTask = defineTask('review-existing-indexes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review Existing Indexes - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Performance Engineer', task: 'Review existing indexes', context: args,
      instructions: ['1. List all indexes', '2. Analyze index types', '3. Check index usage stats', '4. Identify unused indexes', '5. Document indexes'],
      outputFormat: 'JSON with existing indexes' },
    outputSchema: { type: 'object', required: ['indexes', 'artifacts'], properties: { indexes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'index', 'review']
}));

export const identifyRedundantIndexesTask = defineTask('identify-redundant-indexes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Redundant Indexes - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Performance Engineer', task: 'Identify redundant indexes', context: args,
      instructions: ['1. Find duplicate indexes', '2. Find overlapping indexes', '3. Find unused indexes', '4. Calculate savings', '5. Document redundancies'],
      outputFormat: 'JSON with redundant indexes' },
    outputSchema: { type: 'object', required: ['redundant', 'artifacts'], properties: { redundant: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'index', 'redundant']
}));

export const designMissingIndexesTask = defineTask('design-missing-indexes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Missing Indexes - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Performance Engineer', task: 'Design missing indexes', context: args,
      instructions: ['1. Identify missing indexes', '2. Design index columns', '3. Choose index types', '4. Estimate size', '5. Document designs'],
      outputFormat: 'JSON with missing index designs' },
    outputSchema: { type: 'object', required: ['indexes', 'artifacts'], properties: { indexes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'index', 'design']
}));

export const createCompositeIndexesTask = defineTask('create-composite-indexes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Composite Indexes - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Performance Engineer', task: 'Create composite indexes', context: args,
      instructions: ['1. Identify multi-column queries', '2. Design column order', '3. Consider selectivity', '4. Create index DDL', '5. Document indexes'],
      outputFormat: 'JSON with composite indexes' },
    outputSchema: { type: 'object', required: ['indexes', 'artifacts'], properties: { indexes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'index', 'composite']
}));

export const implementCoveringIndexesTask = defineTask('implement-covering-indexes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Covering Indexes - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Performance Engineer', task: 'Implement covering indexes', context: args,
      instructions: ['1. Identify covering candidates', '2. Add included columns', '3. Create index DDL', '4. Estimate benefits', '5. Document indexes'],
      outputFormat: 'JSON with covering indexes' },
    outputSchema: { type: 'object', required: ['indexes', 'artifacts'], properties: { indexes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'index', 'covering']
}));

export const testIndexEffectivenessTask = defineTask('test-index-effectiveness', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Index Effectiveness - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Performance Engineer', task: 'Test index effectiveness', context: args,
      instructions: ['1. Create indexes', '2. Run test queries', '3. Compare execution plans', '4. Measure improvement', '5. Document results'],
      outputFormat: 'JSON with effectiveness testing' },
    outputSchema: { type: 'object', required: ['improvement', 'implementedIndexes', 'artifacts'], properties: { improvement: { type: 'number' }, implementedIndexes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'index', 'testing']
}));

export const monitorIndexUsageTask = defineTask('monitor-index-usage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitor Index Usage - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Performance Engineer', task: 'Monitor index usage', context: args,
      instructions: ['1. Setup usage monitoring', '2. Track index scans', '3. Monitor write overhead', '4. Create dashboards', '5. Document monitoring'],
      outputFormat: 'JSON with monitoring setup' },
    outputSchema: { type: 'object', required: ['monitoring', 'artifacts'], properties: { monitoring: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'index', 'monitoring']
}));

export const documentIndexStrategyTask = defineTask('document-index-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Index Strategy - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Performance Engineer', task: 'Document index strategy', context: args,
      instructions: ['1. Document all indexes', '2. Explain design decisions', '3. Include DDL scripts', '4. Add maintenance guide', '5. Generate report'],
      outputFormat: 'JSON with strategy documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'index', 'documentation']
}));
