/**
 * @process specializations/performance-optimization/memory-profiling-analysis
 * @description Memory Profiling Analysis - Profile application memory usage to identify optimization opportunities
 * including heap allocation patterns, object retention analysis, and memory-intensive operations.
 * @inputs { projectName: string, targetApplication: string, profilingTool?: string, duration?: number }
 * @outputs { success: boolean, memoryProfile: object, allocationPatterns: array, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/performance-optimization/memory-profiling-analysis', {
 *   projectName: 'API Gateway',
 *   targetApplication: 'gateway-service',
 *   profilingTool: 'eclipse-mat',
 *   duration: 300
 * });
 *
 * @references
 * - Valgrind Massif: https://valgrind.org/docs/manual/ms-manual.html
 * - Eclipse MAT: https://www.eclipse.org/mat/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetApplication,
    profilingTool = 'heap-profiler',
    duration = 300,
    outputDir = 'memory-profiling-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Memory Profiling Analysis for ${projectName}`);

  // Phase 1: Select Memory Profiling Tools
  const toolSelection = await ctx.task(selectMemoryProfilingToolsTask, {
    projectName, targetApplication, profilingTool, outputDir
  });
  artifacts.push(...toolSelection.artifacts);

  // Phase 2: Configure Profiling Environment
  const configuration = await ctx.task(configureMemoryProfilingTask, {
    projectName, targetApplication, toolSelection, outputDir
  });
  artifacts.push(...configuration.artifacts);

  // Phase 3: Capture Memory Allocation Data
  const allocationData = await ctx.task(captureMemoryAllocationDataTask, {
    projectName, targetApplication, duration, outputDir
  });
  artifacts.push(...allocationData.artifacts);

  await ctx.breakpoint({
    question: `Captured ${allocationData.sampleCount} memory samples. Analyze heap patterns?`,
    title: 'Memory Data Collection',
    context: { runId: ctx.runId, allocationData }
  });

  // Phase 4: Analyze Heap Allocation Patterns
  const heapAnalysis = await ctx.task(analyzeHeapAllocationPatternsTask, {
    projectName, allocationData, outputDir
  });
  artifacts.push(...heapAnalysis.artifacts);

  // Phase 5: Identify Memory-Intensive Operations
  const memoryIntensive = await ctx.task(identifyMemoryIntensiveOperationsTask, {
    projectName, heapAnalysis, outputDir
  });
  artifacts.push(...memoryIntensive.artifacts);

  // Phase 6: Review Object Retention Graphs
  const retentionAnalysis = await ctx.task(reviewObjectRetentionGraphsTask, {
    projectName, heapAnalysis, outputDir
  });
  artifacts.push(...retentionAnalysis.artifacts);

  // Phase 7: Document Memory Usage Patterns
  const documentation = await ctx.task(documentMemoryUsagePatternsTask, {
    projectName, heapAnalysis, memoryIntensive, retentionAnalysis, outputDir
  });
  artifacts.push(...documentation.artifacts);

  // Phase 8: Provide Optimization Recommendations
  const recommendations = await ctx.task(provideMemoryOptimizationRecommendationsTask, {
    projectName, heapAnalysis, memoryIntensive, retentionAnalysis, outputDir
  });
  artifacts.push(...recommendations.artifacts);

  await ctx.breakpoint({
    question: `Analysis complete. Found ${memoryIntensive.operations.length} memory-intensive operations. Review recommendations?`,
    title: 'Memory Profiling Results',
    context: { runId: ctx.runId, recommendations: recommendations.recommendations }
  });

  return {
    success: true,
    projectName,
    memoryProfile: heapAnalysis.profile,
    allocationPatterns: heapAnalysis.patterns,
    memoryIntensiveOperations: memoryIntensive.operations,
    recommendations: recommendations.recommendations,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/performance-optimization/memory-profiling-analysis',
      timestamp: startTime,
      outputDir
    }
  };
}

export const selectMemoryProfilingToolsTask = defineTask('select-memory-profiling-tools', (args, taskCtx) => ({
  kind: 'agent',
  title: `Select Memory Profiling Tools - ${args.projectName}`,
  agent: {
    name: 'memlab-analysis',
    prompt: {
      role: 'Performance Engineer',
      task: 'Select appropriate memory profiling tools',
      context: args,
      instructions: [
        '1. Evaluate memory profiling tools',
        '2. Consider runtime overhead',
        '3. Select primary tool',
        '4. Configure tool options',
        '5. Document tool selection'
      ],
      outputFormat: 'JSON with tool selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTools', 'artifacts'],
      properties: { selectedTools: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'memory-profiling', 'tools']
}));

export const configureMemoryProfilingTask = defineTask('configure-memory-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Memory Profiling - ${args.projectName}`,
  agent: {
    name: 'memlab-analysis',
    prompt: {
      role: 'Performance Engineer',
      task: 'Configure memory profiling environment',
      context: args,
      instructions: [
        '1. Set up profiler agent',
        '2. Configure heap sampling',
        '3. Set allocation tracking options',
        '4. Configure snapshot triggers',
        '5. Test configuration'
      ],
      outputFormat: 'JSON with configuration details'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'artifacts'],
      properties: { configuration: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'memory-profiling', 'configuration']
}));

export const captureMemoryAllocationDataTask = defineTask('capture-memory-allocation-data', (args, taskCtx) => ({
  kind: 'agent',
  title: `Capture Memory Allocation Data - ${args.projectName}`,
  agent: {
    name: 'memlab-analysis',
    prompt: {
      role: 'Performance Engineer',
      task: 'Capture memory allocation data',
      context: args,
      instructions: [
        '1. Start memory profiler',
        '2. Execute representative workload',
        '3. Capture allocation samples',
        '4. Take heap snapshots',
        '5. Export profiling data'
      ],
      outputFormat: 'JSON with allocation data'
    },
    outputSchema: {
      type: 'object',
      required: ['sampleCount', 'data', 'artifacts'],
      properties: { sampleCount: { type: 'number' }, data: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'memory-profiling', 'capture']
}));

export const analyzeHeapAllocationPatternsTask = defineTask('analyze-heap-allocation-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Heap Allocation Patterns - ${args.projectName}`,
  agent: {
    name: 'memlab-analysis',
    prompt: {
      role: 'Performance Engineer',
      task: 'Analyze heap allocation patterns',
      context: args,
      instructions: [
        '1. Analyze allocation frequency',
        '2. Identify allocation hotspots',
        '3. Analyze object lifecycles',
        '4. Identify allocation patterns',
        '5. Document findings'
      ],
      outputFormat: 'JSON with heap analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['profile', 'patterns', 'artifacts'],
      properties: { profile: { type: 'object' }, patterns: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'memory-profiling', 'heap-analysis']
}));

export const identifyMemoryIntensiveOperationsTask = defineTask('identify-memory-intensive-operations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identify Memory-Intensive Operations - ${args.projectName}`,
  agent: {
    name: 'memlab-analysis',
    prompt: {
      role: 'Performance Engineer',
      task: 'Identify memory-intensive operations',
      context: args,
      instructions: [
        '1. Rank operations by memory usage',
        '2. Identify allocation hotspots',
        '3. Analyze memory growth patterns',
        '4. Identify optimization targets',
        '5. Document findings'
      ],
      outputFormat: 'JSON with memory-intensive operations'
    },
    outputSchema: {
      type: 'object',
      required: ['operations', 'artifacts'],
      properties: { operations: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'memory-profiling', 'intensive-operations']
}));

export const reviewObjectRetentionGraphsTask = defineTask('review-object-retention-graphs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review Object Retention Graphs - ${args.projectName}`,
  agent: {
    name: 'memlab-analysis',
    prompt: {
      role: 'Performance Engineer',
      task: 'Review object retention graphs',
      context: args,
      instructions: [
        '1. Analyze retention paths',
        '2. Identify dominator trees',
        '3. Find unexpected retainers',
        '4. Identify leak suspects',
        '5. Document retention analysis'
      ],
      outputFormat: 'JSON with retention analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['retentionAnalysis', 'artifacts'],
      properties: { retentionAnalysis: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'memory-profiling', 'retention']
}));

export const documentMemoryUsagePatternsTask = defineTask('document-memory-usage-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Memory Usage Patterns - ${args.projectName}`,
  agent: {
    name: 'memlab-analysis',
    prompt: {
      role: 'Performance Engineer',
      task: 'Document memory usage patterns',
      context: args,
      instructions: [
        '1. Summarize memory profile',
        '2. Document allocation patterns',
        '3. Document retention issues',
        '4. Create memory usage report',
        '5. Include visualizations'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'artifacts'],
      properties: { documentation: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'memory-profiling', 'documentation']
}));

export const provideMemoryOptimizationRecommendationsTask = defineTask('provide-memory-optimization-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Provide Memory Optimization Recommendations - ${args.projectName}`,
  agent: {
    name: 'memlab-analysis',
    prompt: {
      role: 'Performance Engineer',
      task: 'Provide memory optimization recommendations',
      context: args,
      instructions: [
        '1. Recommend allocation reductions',
        '2. Suggest object pooling',
        '3. Recommend data structure changes',
        '4. Prioritize by impact',
        '5. Document recommendations'
      ],
      outputFormat: 'JSON with recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: { recommendations: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['performance-optimization', 'memory-profiling', 'recommendations']
}));
