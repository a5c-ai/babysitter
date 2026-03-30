/**
 * @process specializations/performance-optimization/memory-leak-detection
 * @description Memory Leak Detection and Resolution - Detect and fix memory leaks in applications including
 * heap snapshot comparison, object retention analysis, leak source location, and regression testing.
 * @inputs { projectName: string, targetApplication: string, detectionTool?: string, testDuration?: number }
 * @outputs { success: boolean, leaksDetected: array, leaksFixed: number, regressionTests: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/memory-leak-detection', {
 *   projectName: 'Web Application',
 *   targetApplication: 'frontend-app',
 *   detectionTool: 'memlab',
 *   testDuration: 600
 * });
 *
 * @references
 * - MemLab: https://facebook.github.io/memlab/
 * - LeakCanary: https://square.github.io/leakcanary/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetApplication,
    detectionTool = 'heap-analysis',
    testDuration = 600,
    outputDir = 'memory-leak-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Memory Leak Detection for ${projectName}`);

  // Phase 1: Setup Memory Leak Detection Tooling
  const setup = await ctx.task(setupMemoryLeakDetectionTask, {
    projectName, targetApplication, detectionTool, outputDir
  });
  artifacts.push(...setup.artifacts);

  // Phase 2: Run Application Under Memory Profiler
  const profiling = await ctx.task(runMemoryProfilerTask, {
    projectName, targetApplication, testDuration, outputDir
  });
  artifacts.push(...profiling.artifacts);

  // Phase 3: Capture Heap Snapshots Over Time
  const snapshots = await ctx.task(captureHeapSnapshotsTask, {
    projectName, profiling, outputDir
  });
  artifacts.push(...snapshots.artifacts);

  await ctx.breakpoint({
    question: `Captured ${snapshots.snapshotCount} heap snapshots. Analyze for growing memory patterns?`,
    title: 'Heap Snapshot Collection',
    context: { runId: ctx.runId, snapshots }
  });

  // Phase 4: Identify Growing Memory Patterns
  const growthAnalysis = await ctx.task(identifyMemoryGrowthPatternsTask, {
    projectName, snapshots, outputDir
  });
  artifacts.push(...growthAnalysis.artifacts);

  // Phase 5: Analyze Object Retention Paths
  const retentionPaths = await ctx.task(analyzeObjectRetentionPathsTask, {
    projectName, growthAnalysis, snapshots, outputDir
  });
  artifacts.push(...retentionPaths.artifacts);

  // Phase 6: Locate Leak Source in Code
  const leakSources = await ctx.task(locateLeakSourceTask, {
    projectName, retentionPaths, growthAnalysis, outputDir
  });
  artifacts.push(...leakSources.artifacts);

  await ctx.breakpoint({
    question: `Found ${leakSources.leaks.length} potential memory leaks. Review and approve fixes?`,
    title: 'Memory Leak Analysis',
    context: { runId: ctx.runId, leaks: leakSources.leaks }
  });

  // Phase 7: Implement Fixes for Identified Leaks
  const fixes = await ctx.task(implementLeakFixesTask, {
    projectName, leakSources, outputDir
  });
  artifacts.push(...fixes.artifacts);

  // Phase 8: Validate Leaks are Resolved
  const validation = await ctx.task(validateLeaksResolvedTask, {
    projectName, fixes, outputDir
  });
  artifacts.push(...validation.artifacts);

  // Phase 9: Add Regression Tests for Leaks
  const regressionTests = await ctx.task(addLeakRegressionTestsTask, {
    projectName, leakSources, fixes, outputDir
  });
  artifacts.push(...regressionTests.artifacts);

  await ctx.breakpoint({
    question: `${fixes.fixedCount} leaks fixed. ${regressionTests.testCount} regression tests added. Accept changes?`,
    title: 'Memory Leak Resolution',
    context: { runId: ctx.runId, validation, regressionTests }
  });

  return {
    success: true,
    projectName,
    leaksDetected: leakSources.leaks,
    leaksFixed: fixes.fixedCount,
    validation: validation.results,
    regressionTests: regressionTests.tests,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/performance-optimization/memory-leak-detection',
      timestamp: startTime,
      outputDir
    }
  };
}

export const setupMemoryLeakDetectionTask = defineTask('setup-memory-leak-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Memory Leak Detection - ${args.projectName}`,
  agent: {
    name: 'memlab-analysis',
    prompt: {
      role: 'Performance Engineer',
      task: 'Setup memory leak detection tooling',
      context: args,
      instructions: ['1. Install leak detection tools', '2. Configure heap analysis', '3. Setup snapshot triggers', '4. Configure alerting', '5. Document setup'],
      outputFormat: 'JSON with setup details'
    },
    outputSchema: { type: 'object', required: ['configured', 'artifacts'], properties: { configured: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'memory-leak', 'setup']
}));

export const runMemoryProfilerTask = defineTask('run-memory-profiler', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run Memory Profiler - ${args.projectName}`,
  agent: {
    name: 'memlab-analysis',
    prompt: {
      role: 'Performance Engineer',
      task: 'Run application under memory profiler',
      context: args,
      instructions: ['1. Start profiler', '2. Execute test scenarios', '3. Monitor memory growth', '4. Collect allocation data', '5. Export profiling data'],
      outputFormat: 'JSON with profiling results'
    },
    outputSchema: { type: 'object', required: ['data', 'artifacts'], properties: { data: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'memory-leak', 'profiling']
}));

export const captureHeapSnapshotsTask = defineTask('capture-heap-snapshots', (args, taskCtx) => ({
  kind: 'agent',
  title: `Capture Heap Snapshots - ${args.projectName}`,
  agent: {
    name: 'memlab-analysis',
    prompt: {
      role: 'Performance Engineer',
      task: 'Capture heap snapshots over time',
      context: args,
      instructions: ['1. Take initial snapshot', '2. Execute workload cycles', '3. Take periodic snapshots', '4. Store snapshots', '5. Document snapshot timing'],
      outputFormat: 'JSON with snapshot data'
    },
    outputSchema: { type: 'object', required: ['snapshotCount', 'artifacts'], properties: { snapshotCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'memory-leak', 'snapshots']
}));

export const identifyMemoryGrowthPatternsTask = defineTask('identify-memory-growth-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Memory Growth Patterns - ${args.projectName}`,
  agent: {
    name: 'memlab-analysis',
    prompt: {
      role: 'Performance Engineer',
      task: 'Identify growing memory patterns',
      context: args,
      instructions: ['1. Compare snapshots', '2. Identify growing objects', '3. Calculate growth rates', '4. Identify leak suspects', '5. Document patterns'],
      outputFormat: 'JSON with growth analysis'
    },
    outputSchema: { type: 'object', required: ['patterns', 'artifacts'], properties: { patterns: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'memory-leak', 'growth-analysis']
}));

export const analyzeObjectRetentionPathsTask = defineTask('analyze-object-retention-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Object Retention Paths - ${args.projectName}`,
  agent: {
    name: 'memlab-analysis',
    prompt: {
      role: 'Performance Engineer',
      task: 'Analyze object retention paths',
      context: args,
      instructions: ['1. Build retention graph', '2. Find shortest paths to GC roots', '3. Identify unexpected retainers', '4. Analyze dominator trees', '5. Document retention paths'],
      outputFormat: 'JSON with retention analysis'
    },
    outputSchema: { type: 'object', required: ['retentionPaths', 'artifacts'], properties: { retentionPaths: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'memory-leak', 'retention']
}));

export const locateLeakSourceTask = defineTask('locate-leak-source', (args, taskCtx) => ({
  kind: 'agent',
  title: `Locate Leak Source - ${args.projectName}`,
  agent: {
    name: 'memlab-analysis',
    prompt: {
      role: 'Performance Engineer',
      task: 'Locate leak source in code',
      context: args,
      instructions: ['1. Correlate to source code', '2. Identify allocation sites', '3. Find missing cleanup', '4. Document leak sources', '5. Recommend fixes'],
      outputFormat: 'JSON with leak sources'
    },
    outputSchema: { type: 'object', required: ['leaks', 'artifacts'], properties: { leaks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'memory-leak', 'source-location']
}));

export const implementLeakFixesTask = defineTask('implement-leak-fixes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Leak Fixes - ${args.projectName}`,
  agent: {
    name: 'memlab-analysis',
    prompt: {
      role: 'Performance Engineer',
      task: 'Implement fixes for identified leaks',
      context: args,
      instructions: ['1. Implement cleanup code', '2. Add proper disposal', '3. Fix event listener leaks', '4. Fix cache leaks', '5. Document fixes'],
      outputFormat: 'JSON with fix details'
    },
    outputSchema: { type: 'object', required: ['fixedCount', 'artifacts'], properties: { fixedCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'memory-leak', 'fixes']
}));

export const validateLeaksResolvedTask = defineTask('validate-leaks-resolved', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Leaks Resolved - ${args.projectName}`,
  agent: {
    name: 'memlab-analysis',
    prompt: {
      role: 'Performance Engineer',
      task: 'Validate leaks are resolved',
      context: args,
      instructions: ['1. Rerun memory tests', '2. Compare before/after', '3. Verify no memory growth', '4. Validate fixes work', '5. Document validation'],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: { type: 'object', required: ['results', 'artifacts'], properties: { results: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'memory-leak', 'validation']
}));

export const addLeakRegressionTestsTask = defineTask('add-leak-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Add Leak Regression Tests - ${args.projectName}`,
  agent: {
    name: 'memlab-analysis',
    prompt: {
      role: 'Performance Engineer',
      task: 'Add regression tests for leaks',
      context: args,
      instructions: ['1. Create memory leak tests', '2. Add to CI pipeline', '3. Set memory thresholds', '4. Document test coverage', '5. Verify tests pass'],
      outputFormat: 'JSON with test details'
    },
    outputSchema: { type: 'object', required: ['testCount', 'tests', 'artifacts'], properties: { testCount: { type: 'number' }, tests: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'memory-leak', 'regression-tests']
}));
