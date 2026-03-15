/**
 * @process specializations/gpu-programming/warp-efficiency-optimization
 * @description Warp/Wavefront Efficiency Optimization - Workflow for minimizing warp divergence and maximizing
 * SIMD efficiency across GPU threads executing in lockstep.
 * @inputs { projectName: string, targetKernels: array, divergenceAnalysis?: boolean, outputDir?: string }
 * @outputs { success: boolean, optimizations: array, warpEfficiencyReport: object, divergenceAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/warp-efficiency-optimization', {
 *   projectName: 'decision_tree_traversal',
 *   targetKernels: ['tree_traverse', 'leaf_compute'],
 *   divergenceAnalysis: true
 * });
 *
 * @references
 * - Warp Divergence: https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/
 * - SIMD Efficiency: https://developer.nvidia.com/blog/using-cuda-warp-level-primitives/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetKernels,
    divergenceAnalysis = true,
    outputDir = 'warp-efficiency-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Warp Efficiency Optimization: ${projectName}`);
  ctx.log('info', `Target kernels: ${targetKernels.join(', ')}`);

  // Phase 1: Divergence Analysis
  const divergenceReport = await ctx.task(divergenceAnalysisTask, {
    projectName, targetKernels, outputDir
  });
  artifacts.push(...divergenceReport.artifacts);

  // Phase 2: Control Flow Optimization
  const controlFlowOpt = await ctx.task(controlFlowOptimizationTask, {
    projectName, targetKernels, divergenceReport, outputDir
  });
  artifacts.push(...controlFlowOpt.artifacts);

  // Phase 3: Data Reorganization
  const dataReorg = await ctx.task(dataReorganizationTask, {
    projectName, targetKernels, divergenceReport, outputDir
  });
  artifacts.push(...dataReorg.artifacts);

  // Phase 4: Warp-Level Primitives
  const warpPrimitives = await ctx.task(warpPrimitivesTask, {
    projectName, targetKernels, outputDir
  });
  artifacts.push(...warpPrimitives.artifacts);

  // Phase 5: Warp-Synchronous Programming
  const warpSync = await ctx.task(warpSynchronousTask, {
    projectName, targetKernels, warpPrimitives, outputDir
  });
  artifacts.push(...warpSync.artifacts);

  // Phase 6: Efficiency Measurement
  const efficiencyMeasurement = await ctx.task(warpEfficiencyMeasurementTask, {
    projectName, targetKernels, divergenceReport, outputDir
  });
  artifacts.push(...efficiencyMeasurement.artifacts);

  await ctx.breakpoint({
    question: `Warp efficiency optimization complete for ${projectName}. Efficiency: ${efficiencyMeasurement.warpEfficiency}%. Review?`,
    title: 'Warp Efficiency Complete',
    context: { runId: ctx.runId, efficiencyMeasurement }
  });

  return {
    success: efficiencyMeasurement.warpEfficiency >= 80,
    projectName,
    optimizations: [
      ...controlFlowOpt.optimizations,
      ...dataReorg.optimizations,
      ...warpPrimitives.optimizations,
      ...warpSync.optimizations
    ],
    warpEfficiencyReport: {
      before: divergenceReport.initialEfficiency,
      after: efficiencyMeasurement.warpEfficiency,
      improvement: efficiencyMeasurement.warpEfficiency - divergenceReport.initialEfficiency
    },
    divergenceAnalysis: {
      divergentBranches: divergenceReport.divergentBranches,
      resolved: controlFlowOpt.resolvedBranches
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/warp-efficiency-optimization',
      timestamp: startTime,
      outputDir
    }
  };
}

export const divergenceAnalysisTask = defineTask('divergence-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Divergence Analysis - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['warp-primitives', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Analyze warp divergence',
      context: args,
      instructions: [
        '1. Profile predicated instructions',
        '2. Identify divergent branches',
        '3. Measure warp execution efficiency',
        '4. Identify divergence hotspots',
        '5. Analyze branch patterns',
        '6. Profile active threads per warp',
        '7. Identify data-dependent branches',
        '8. Calculate divergence overhead',
        '9. Create divergence visualization',
        '10. Document divergence findings'
      ],
      outputFormat: 'JSON with divergence analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['initialEfficiency', 'divergentBranches', 'artifacts'],
      properties: {
        initialEfficiency: { type: 'number' },
        divergentBranches: { type: 'array', items: { type: 'object' } },
        divergenceOverhead: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'warp', 'divergence']
}));

export const controlFlowOptimizationTask = defineTask('control-flow-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Control Flow Optimization - ${args.projectName}`,
  agent: {
    name: 'parallel-algorithm-designer',
    skills: ['warp-primitives'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Optimize divergent control flow',
      context: args,
      instructions: [
        '1. Restructure divergent branches',
        '2. Use branchless programming',
        '3. Convert branches to selects',
        '4. Group similar work items',
        '5. Separate divergent code paths',
        '6. Use predication effectively',
        '7. Minimize divergent loops',
        '8. Unroll loops to reduce divergence',
        '9. Test optimized control flow',
        '10. Document transformations'
      ],
      outputFormat: 'JSON with control flow optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'resolvedBranches', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        resolvedBranches: { type: 'number' },
        techniques: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'warp', 'control-flow']
}));

export const dataReorganizationTask = defineTask('data-reorganization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Reorganization - ${args.projectName}`,
  agent: {
    name: 'parallel-algorithm-designer',
    skills: ['warp-primitives'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Reorganize data for warp coherence',
      context: args,
      instructions: [
        '1. Analyze data access patterns',
        '2. Sort data for warp coherence',
        '3. Bin similar items together',
        '4. Use data clustering',
        '5. Implement thread compaction',
        '6. Reorganize irregular data',
        '7. Balance workload distribution',
        '8. Minimize warp-level variance',
        '9. Test reorganization impact',
        '10. Document data layout changes'
      ],
      outputFormat: 'JSON with data reorganization'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'dataLayouts', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        dataLayouts: { type: 'array', items: { type: 'object' } },
        coherenceImprovement: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'warp', 'data']
}));

export const warpPrimitivesTask = defineTask('warp-primitives', (args, taskCtx) => ({
  kind: 'agent',
  title: `Warp Primitives - ${args.projectName}`,
  agent: {
    name: 'parallel-algorithm-designer',
    skills: ['warp-primitives'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement warp-level primitives',
      context: args,
      instructions: [
        '1. Use __shfl_sync for warp shuffle',
        '2. Implement warp reduce',
        '3. Use warp vote functions',
        '4. Implement warp scan',
        '5. Use __ballot_sync',
        '6. Implement warp match',
        '7. Use __all_sync/__any_sync',
        '8. Leverage warp-level atomics',
        '9. Test primitive correctness',
        '10. Document primitive usage'
      ],
      outputFormat: 'JSON with warp primitives implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'primitivesUsed', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        primitivesUsed: { type: 'array', items: { type: 'string' } },
        performanceGain: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'warp', 'primitives']
}));

export const warpSynchronousTask = defineTask('warp-synchronous', (args, taskCtx) => ({
  kind: 'agent',
  title: `Warp-Synchronous Programming - ${args.projectName}`,
  agent: {
    name: 'parallel-algorithm-designer',
    skills: ['warp-primitives'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement warp-synchronous patterns',
      context: args,
      instructions: [
        '1. Identify warp-synchronous opportunities',
        '2. Remove unnecessary barriers',
        '3. Use implicit warp synchronization',
        '4. Implement warp-cooperative patterns',
        '5. Handle independent thread scheduling',
        '6. Use cooperative groups',
        '7. Implement warp-level algorithms',
        '8. Test synchronization correctness',
        '9. Profile sync overhead',
        '10. Document patterns used'
      ],
      outputFormat: 'JSON with warp-synchronous programming'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'patterns', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        patterns: { type: 'array', items: { type: 'string' } },
        syncOverheadReduction: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'warp', 'synchronous']
}));

export const warpEfficiencyMeasurementTask = defineTask('warp-efficiency-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Warp Efficiency Measurement - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['warp-primitives', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Measure final warp efficiency',
      context: args,
      instructions: [
        '1. Profile optimized kernels',
        '2. Measure warp execution efficiency',
        '3. Calculate active threads per warp',
        '4. Compare to baseline',
        '5. Verify divergence reduction',
        '6. Profile instruction throughput',
        '7. Create comparison report',
        '8. Document improvements',
        '9. Identify remaining issues',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON with warp efficiency measurement'
    },
    outputSchema: {
      type: 'object',
      required: ['warpEfficiency', 'kernelMetrics', 'artifacts'],
      properties: {
        warpEfficiency: { type: 'number' },
        kernelMetrics: { type: 'object' },
        improvementDetails: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'warp', 'measurement']
}));
