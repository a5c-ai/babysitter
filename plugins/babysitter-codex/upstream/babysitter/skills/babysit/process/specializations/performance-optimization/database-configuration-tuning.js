/**
 * @process specializations/performance-optimization/database-configuration-tuning
 * @description Database Configuration Tuning - Tune database server configuration for optimal performance including
 * memory settings, connection configuration, query cache optimization, and checkpoint tuning.
 * @inputs { projectName: string, database: string, workloadType?: string }
 * @outputs { success: boolean, configurationChanges: array, performanceImprovement: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/database-configuration-tuning', {
 *   projectName: 'Analytics Platform',
 *   database: 'postgresql',
 *   workloadType: 'olap'
 * });
 *
 * @references
 * - PostgreSQL Performance Tips: https://www.postgresql.org/docs/current/performance-tips.html
 * - MySQL Optimization: https://dev.mysql.com/doc/refman/8.0/en/optimization.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    database = 'postgresql',
    workloadType = 'oltp',
    outputDir = 'db-config-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Database Configuration Tuning for ${projectName}`);

  // Phase 1: Analyze Current Configuration
  const currentConfig = await ctx.task(analyzeCurrentConfigurationTask, { projectName, database, outputDir });
  artifacts.push(...currentConfig.artifacts);

  // Phase 2: Review Resource Utilization
  const resourceUtilization = await ctx.task(reviewResourceUtilizationTask, { projectName, database, outputDir });
  artifacts.push(...resourceUtilization.artifacts);

  await ctx.breakpoint({
    question: `Resource utilization: CPU ${resourceUtilization.cpu}%, Memory ${resourceUtilization.memory}%. Optimize configuration?`,
    title: 'Database Resource Analysis',
    context: { runId: ctx.runId, resourceUtilization }
  });

  // Phase 3: Tune Memory Settings
  const memoryTuning = await ctx.task(tuneMemorySettingsTask, { projectName, database, resourceUtilization, workloadType, outputDir });
  artifacts.push(...memoryTuning.artifacts);

  // Phase 4: Optimize Connection Settings
  const connectionTuning = await ctx.task(optimizeConnectionSettingsTask, { projectName, database, outputDir });
  artifacts.push(...connectionTuning.artifacts);

  // Phase 5: Configure Query Cache
  const queryCache = await ctx.task(configureQueryCacheTask, { projectName, database, workloadType, outputDir });
  artifacts.push(...queryCache.artifacts);

  // Phase 6: Tune Checkpoint Settings
  const checkpointTuning = await ctx.task(tuneCheckpointSettingsTask, { projectName, database, outputDir });
  artifacts.push(...checkpointTuning.artifacts);

  // Phase 7: Test Under Production Load
  const loadTest = await ctx.task(testConfigUnderLoadTask, { projectName, memoryTuning, connectionTuning, queryCache, checkpointTuning, outputDir });
  artifacts.push(...loadTest.artifacts);

  // Phase 8: Monitor Performance Metrics
  const monitoring = await ctx.task(monitorDBPerformanceMetricsTask, { projectName, outputDir });
  artifacts.push(...monitoring.artifacts);

  // Phase 9: Document Configuration Changes
  const documentation = await ctx.task(documentConfigurationChangesTask, { projectName, memoryTuning, connectionTuning, queryCache, checkpointTuning, loadTest, outputDir });
  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Configuration tuning complete. Performance improvement: ${loadTest.improvement}%. Accept changes?`,
    title: 'Database Configuration Results',
    context: { runId: ctx.runId, loadTest }
  });

  return {
    success: true,
    projectName,
    configurationChanges: [...memoryTuning.changes, ...connectionTuning.changes, ...queryCache.changes, ...checkpointTuning.changes],
    performanceImprovement: loadTest.improvement,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/performance-optimization/database-configuration-tuning', timestamp: startTime, outputDir }
  };
}

export const analyzeCurrentConfigurationTask = defineTask('analyze-current-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Current Configuration - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Administrator', task: 'Analyze current database configuration', context: args,
      instructions: ['1. Export current settings', '2. Compare to defaults', '3. Identify non-optimal', '4. Analyze history', '5. Document configuration'],
      outputFormat: 'JSON with current configuration' },
    outputSchema: { type: 'object', required: ['configuration', 'artifacts'], properties: { configuration: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'database-config', 'analysis']
}));

export const reviewResourceUtilizationTask = defineTask('review-resource-utilization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review Resource Utilization - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Administrator', task: 'Review resource utilization', context: args,
      instructions: ['1. Analyze CPU usage', '2. Analyze memory usage', '3. Analyze disk I/O', '4. Analyze connections', '5. Document utilization'],
      outputFormat: 'JSON with resource utilization' },
    outputSchema: { type: 'object', required: ['cpu', 'memory', 'artifacts'], properties: { cpu: { type: 'number' }, memory: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'database-config', 'resources']
}));

export const tuneMemorySettingsTask = defineTask('tune-memory-settings', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tune Memory Settings - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Administrator', task: 'Tune database memory settings', context: args,
      instructions: ['1. Calculate buffer pool size', '2. Configure shared buffers', '3. Set work_mem', '4. Configure sort buffers', '5. Document changes'],
      outputFormat: 'JSON with memory tuning' },
    outputSchema: { type: 'object', required: ['changes', 'artifacts'], properties: { changes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'database-config', 'memory']
}));

export const optimizeConnectionSettingsTask = defineTask('optimize-connection-settings', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Connection Settings - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Administrator', task: 'Optimize connection settings', context: args,
      instructions: ['1. Set max connections', '2. Configure timeouts', '3. Set idle timeouts', '4. Configure pooling', '5. Document settings'],
      outputFormat: 'JSON with connection settings' },
    outputSchema: { type: 'object', required: ['changes', 'artifacts'], properties: { changes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'database-config', 'connections']
}));

export const configureQueryCacheTask = defineTask('configure-query-cache', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Query Cache - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Administrator', task: 'Configure query cache', context: args,
      instructions: ['1. Analyze query patterns', '2. Configure cache size', '3. Set cache policies', '4. Configure invalidation', '5. Document configuration'],
      outputFormat: 'JSON with query cache config' },
    outputSchema: { type: 'object', required: ['changes', 'artifacts'], properties: { changes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'database-config', 'cache']
}));

export const tuneCheckpointSettingsTask = defineTask('tune-checkpoint-settings', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tune Checkpoint Settings - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Administrator', task: 'Tune checkpoint settings', context: args,
      instructions: ['1. Analyze checkpoint frequency', '2. Configure checkpoint timeout', '3. Set completion target', '4. Configure WAL settings', '5. Document changes'],
      outputFormat: 'JSON with checkpoint settings' },
    outputSchema: { type: 'object', required: ['changes', 'artifacts'], properties: { changes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'database-config', 'checkpoint']
}));

export const testConfigUnderLoadTask = defineTask('test-config-under-load', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Under Production Load - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Administrator', task: 'Test configuration under load', context: args,
      instructions: ['1. Apply new configuration', '2. Run load test', '3. Compare metrics', '4. Calculate improvement', '5. Document results'],
      outputFormat: 'JSON with load test results' },
    outputSchema: { type: 'object', required: ['improvement', 'artifacts'], properties: { improvement: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'database-config', 'load-test']
}));

export const monitorDBPerformanceMetricsTask = defineTask('monitor-db-performance-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitor Performance Metrics - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Administrator', task: 'Monitor database performance metrics', context: args,
      instructions: ['1. Setup metrics collection', '2. Create dashboards', '3. Configure alerts', '4. Monitor key metrics', '5. Document setup'],
      outputFormat: 'JSON with monitoring setup' },
    outputSchema: { type: 'object', required: ['monitoring', 'artifacts'], properties: { monitoring: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'database-config', 'monitoring']
}));

export const documentConfigurationChangesTask = defineTask('document-configuration-changes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Configuration Changes - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: { role: 'Database Administrator', task: 'Document configuration changes', context: args,
      instructions: ['1. Document all changes', '2. Explain rationale', '3. Include benchmarks', '4. Create rollback plan', '5. Generate report'],
      outputFormat: 'JSON with documentation' },
    outputSchema: { type: 'object', required: ['documentation', 'artifacts'], properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'database-config', 'documentation']
}));
