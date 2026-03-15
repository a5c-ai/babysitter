/**
 * @process specializations/performance-optimization/n-plus-one-query-detection
 * @description N+1 Query Detection and Resolution - Detect and fix N+1 query problems in applications including
 * query logging instrumentation, pattern identification, eager loading implementation, and batch query optimization.
 * @inputs { projectName: string, targetApplication: string, ormFramework?: string }
 * @outputs { success: boolean, nPlusOneIssues: array, fixesApplied: array, queryReduction: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/n-plus-one-query-detection', {
 *   projectName: 'Blog Platform',
 *   targetApplication: 'blog-api',
 *   ormFramework: 'hibernate'
 * });
 *
 * @references
 * - SQLAlchemy: https://www.sqlalchemy.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetApplication,
    ormFramework = 'generic',
    outputDir = 'n-plus-one-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting N+1 Query Detection for ${projectName}`);

  // Phase 1: Instrument Query Logging
  const queryLogging = await ctx.task(instrumentQueryLoggingTask, { projectName, targetApplication, ormFramework, outputDir });
  artifacts.push(...queryLogging.artifacts);

  // Phase 2: Identify N+1 Patterns
  const patterns = await ctx.task(identifyNPlusOnePatternsTask, { projectName, queryLogging, outputDir });
  artifacts.push(...patterns.artifacts);

  await ctx.breakpoint({
    question: `Found ${patterns.issues.length} N+1 query patterns executing ${patterns.totalExtraQueries} extra queries. Fix issues?`,
    title: 'N+1 Query Analysis',
    context: { runId: ctx.runId, patterns }
  });

  // Phase 3: Analyze ORM/Data Access Code
  const codeAnalysis = await ctx.task(analyzeDataAccessCodeTask, { projectName, patterns, ormFramework, outputDir });
  artifacts.push(...codeAnalysis.artifacts);

  // Phase 4: Implement Eager Loading
  const eagerLoading = await ctx.task(implementEagerLoadingTask, { projectName, patterns, ormFramework, outputDir });
  artifacts.push(...eagerLoading.artifacts);

  // Phase 5: Use Batch Queries
  const batchQueries = await ctx.task(implementBatchQueriesTask, { projectName, patterns, outputDir });
  artifacts.push(...batchQueries.artifacts);

  // Phase 6: Add Query Count Tests
  const queryTests = await ctx.task(addQueryCountTestsTask, { projectName, patterns, outputDir });
  artifacts.push(...queryTests.artifacts);

  // Phase 7: Validate Improvements
  const validation = await ctx.task(validateNPlusOneFixesTask, { projectName, eagerLoading, batchQueries, outputDir });
  artifacts.push(...validation.artifacts);

  // Phase 8: Document Patterns to Avoid
  const documentation = await ctx.task(documentNPlusOnePatternsTask, { projectName, patterns, eagerLoading, batchQueries, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `N+1 fixes applied. Query reduction: ${validation.queryReduction}%. Accept changes?`,
    title: 'N+1 Query Resolution',
    context: { runId: ctx.runId, validation }
  });

  return {
    success: true,
    projectName,
    nPlusOneIssues: patterns.issues,
    fixesApplied: [...eagerLoading.fixes, ...batchQueries.fixes],
    queryReduction: validation.queryReduction,
    queryTests: queryTests.tests,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/n-plus-one-query-detection', timestamp: startTime, outputDir }
  };
}

export const instrumentQueryLoggingTask = defineTask('instrument-query-logging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Instrument Query Logging - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Instrument query logging', context: args,
      instructions: ['1. Enable ORM query logging', '2. Add query counting', '3. Capture stack traces', '4. Correlate to requests', '5. Document setup'],
      outputFormat: 'JSON with logging setup' },
    outputSchema: { type: 'object', required: ['configured', 'artifacts'], properties: { configured: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'n-plus-one', 'logging']
}));

export const identifyNPlusOnePatternsTask = defineTask('identify-n-plus-one-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify N+1 Patterns - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Identify N+1 query patterns', context: args,
      instructions: ['1. Analyze query logs', '2. Find repeated patterns', '3. Identify lazy loading', '4. Count extra queries', '5. Document patterns'],
      outputFormat: 'JSON with N+1 patterns' },
    outputSchema: { type: 'object', required: ['issues', 'totalExtraQueries', 'artifacts'], properties: { issues: { type: 'array' }, totalExtraQueries: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'n-plus-one', 'detection']
}));

export const analyzeDataAccessCodeTask = defineTask('analyze-data-access-code', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Data Access Code - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Analyze ORM/data access code', context: args,
      instructions: ['1. Review entity mappings', '2. Analyze fetch strategies', '3. Review query patterns', '4. Find lazy loading', '5. Document issues'],
      outputFormat: 'JSON with code analysis' },
    outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'n-plus-one', 'code-analysis']
}));

export const implementEagerLoadingTask = defineTask('implement-eager-loading', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Eager Loading - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Implement eager loading', context: args,
      instructions: ['1. Add JOIN FETCH', '2. Configure fetch graphs', '3. Add includes/joins', '4. Test eager loading', '5. Document changes'],
      outputFormat: 'JSON with eager loading fixes' },
    outputSchema: { type: 'object', required: ['fixes', 'artifacts'], properties: { fixes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'n-plus-one', 'eager-loading']
}));

export const implementBatchQueriesTask = defineTask('implement-batch-queries', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Batch Queries - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Implement batch queries', context: args,
      instructions: ['1. Identify batch candidates', '2. Implement IN queries', '3. Configure batch fetching', '4. Test batch queries', '5. Document changes'],
      outputFormat: 'JSON with batch query fixes' },
    outputSchema: { type: 'object', required: ['fixes', 'artifacts'], properties: { fixes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'n-plus-one', 'batch-queries']
}));

export const addQueryCountTestsTask = defineTask('add-query-count-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Add Query Count Tests - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Add query count tests', context: args,
      instructions: ['1. Create test fixtures', '2. Add query assertions', '3. Set count limits', '4. Add to CI', '5. Document tests'],
      outputFormat: 'JSON with query tests' },
    outputSchema: { type: 'object', required: ['tests', 'artifacts'], properties: { tests: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'n-plus-one', 'testing']
}));

export const validateNPlusOneFixesTask = defineTask('validate-n-plus-one-fixes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate N+1 Fixes - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Validate N+1 fixes', context: args,
      instructions: ['1. Run with fixes', '2. Count queries', '3. Compare before/after', '4. Calculate reduction', '5. Document validation'],
      outputFormat: 'JSON with validation results' },
    outputSchema: { type: 'object', required: ['queryReduction', 'artifacts'], properties: { queryReduction: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'n-plus-one', 'validation']
}));

export const documentNPlusOnePatternsTask = defineTask('document-n-plus-one-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document N+1 Patterns - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Performance Engineer', task: 'Document patterns to avoid', context: args,
      instructions: ['1. Document anti-patterns', '2. Show correct patterns', '3. Add code examples', '4. Create guidelines', '5. Generate report'],
      outputFormat: 'JSON with documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'n-plus-one', 'documentation']
}));
