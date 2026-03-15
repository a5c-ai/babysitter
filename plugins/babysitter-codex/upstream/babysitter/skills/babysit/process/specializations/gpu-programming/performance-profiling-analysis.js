/**
 * @process specializations/gpu-programming/performance-profiling-analysis
 * @description Performance Profiling and Analysis - Comprehensive workflow for profiling GPU applications,
 * identifying bottlenecks, and measuring performance against theoretical limits.
 * @inputs { projectName: string, targetKernels: array, profilingTool?: string, createRoofline?: boolean, outputDir?: string }
 * @outputs { success: boolean, profilingReport: object, bottlenecks: array, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/performance-profiling-analysis', {
 *   projectName: 'neural_network_ops',
 *   targetKernels: ['conv2d', 'gemm', 'relu'],
 *   profilingTool: 'nsight-compute',
 *   createRoofline: true
 * });
 *
 * @references
 * - Nsight Systems Documentation: https://docs.nvidia.com/nsight-systems/
 * - Nsight Compute Documentation: https://docs.nvidia.com/nsight-compute/
 * - Roofline Model: https://crd.lbl.gov/divisions/amcr/computer-science-amcr/par/research/roofline/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetKernels,
    profilingTool = 'nsight-compute',
    createRoofline = true,
    outputDir = 'profiling-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Performance Profiling: ${projectName}`);
  ctx.log('info', `Target kernels: ${targetKernels.join(', ')}, Tool: ${profilingTool}`);

  // Phase 1: System-Wide Profiling
  const systemProfiling = await ctx.task(systemProfilingTask, {
    projectName, targetKernels, outputDir
  });
  artifacts.push(...systemProfiling.artifacts);

  // Phase 2: Kernel-Level Profiling
  const kernelProfiling = await ctx.task(kernelProfilingTask, {
    projectName, targetKernels, profilingTool, outputDir
  });
  artifacts.push(...kernelProfiling.artifacts);

  // Phase 3: Memory Analysis
  const memoryAnalysis = await ctx.task(memoryProfilingTask, {
    projectName, targetKernels, kernelProfiling, outputDir
  });
  artifacts.push(...memoryAnalysis.artifacts);

  // Phase 4: Occupancy Analysis
  const occupancyAnalysis = await ctx.task(occupancyAnalysisTask, {
    projectName, targetKernels, kernelProfiling, outputDir
  });
  artifacts.push(...occupancyAnalysis.artifacts);

  // Phase 5: Roofline Analysis
  let rooflineAnalysis = null;
  if (createRoofline) {
    rooflineAnalysis = await ctx.task(rooflineAnalysisTask, {
      projectName, targetKernels, kernelProfiling, memoryAnalysis, outputDir
    });
    artifacts.push(...rooflineAnalysis.artifacts);
  }

  // Phase 6: Bottleneck Identification
  const bottleneckAnalysis = await ctx.task(bottleneckIdentificationTask, {
    projectName, kernelProfiling, memoryAnalysis, occupancyAnalysis, rooflineAnalysis, outputDir
  });
  artifacts.push(...bottleneckAnalysis.artifacts);

  // Phase 7: Optimization Recommendations
  const recommendations = await ctx.task(optimizationRecommendationsTask, {
    projectName, bottleneckAnalysis, kernelProfiling, outputDir
  });
  artifacts.push(...recommendations.artifacts);

  await ctx.breakpoint({
    question: `Profiling complete for ${projectName}. Found ${bottleneckAnalysis.bottlenecks.length} bottlenecks. Review report?`,
    title: 'Profiling Complete',
    context: { runId: ctx.runId, bottleneckAnalysis, recommendations }
  });

  return {
    success: true,
    projectName,
    profilingReport: {
      systemTimeline: systemProfiling.timelinePath,
      kernelMetrics: kernelProfiling.metrics,
      rooflinePlot: rooflineAnalysis?.plotPath
    },
    bottlenecks: bottleneckAnalysis.bottlenecks,
    recommendations: recommendations.optimizations,
    metrics: {
      averageOccupancy: occupancyAnalysis.averageOccupancy,
      memoryBandwidth: memoryAnalysis.bandwidth,
      computeUtilization: kernelProfiling.computeUtilization
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/performance-profiling-analysis',
      timestamp: startTime,
      outputDir
    }
  };
}

export const systemProfilingTask = defineTask('system-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `System Profiling - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['nsight-profiler', 'gpu-benchmarking'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Perform system-wide profiling',
      context: args,
      instructions: [
        '1. Configure Nsight Systems profiling',
        '2. Capture CPU-GPU interaction timeline',
        '3. Profile API calls and overhead',
        '4. Capture kernel launch patterns',
        '5. Profile memory transfers',
        '6. Identify idle GPU time',
        '7. Analyze stream utilization',
        '8. Profile CUDA context operations',
        '9. Generate timeline visualization',
        '10. Document system-level findings'
      ],
      outputFormat: 'JSON with system profiling results'
    },
    outputSchema: {
      type: 'object',
      required: ['timelinePath', 'systemMetrics', 'artifacts'],
      properties: {
        timelinePath: { type: 'string' },
        systemMetrics: { type: 'object' },
        cpuGpuOverlap: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'profiling', 'system']
}));

export const kernelProfilingTask = defineTask('kernel-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kernel Profiling - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['nsight-profiler', 'gpu-benchmarking'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Profile kernel performance',
      context: args,
      instructions: [
        '1. Configure Nsight Compute for kernels',
        '2. Collect instruction throughput',
        '3. Measure compute utilization',
        '4. Profile SM efficiency',
        '5. Measure warp execution efficiency',
        '6. Collect register usage',
        '7. Profile shared memory usage',
        '8. Measure launch configuration impact',
        '9. Compare across kernel variants',
        '10. Generate kernel reports'
      ],
      outputFormat: 'JSON with kernel profiling results'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'computeUtilization', 'artifacts'],
      properties: {
        metrics: { type: 'object' },
        computeUtilization: { type: 'number' },
        smEfficiency: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'profiling', 'kernel']
}));

export const memoryProfilingTask = defineTask('memory-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Memory Profiling - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['nsight-profiler', 'gpu-benchmarking'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Profile memory performance',
      context: args,
      instructions: [
        '1. Measure global memory throughput',
        '2. Profile L1/L2 cache hit rates',
        '3. Measure shared memory bandwidth',
        '4. Identify memory-bound kernels',
        '5. Profile memory transactions',
        '6. Measure coalescing efficiency',
        '7. Profile bank conflicts',
        '8. Analyze memory divergence',
        '9. Compare to theoretical limits',
        '10. Document memory findings'
      ],
      outputFormat: 'JSON with memory profiling results'
    },
    outputSchema: {
      type: 'object',
      required: ['bandwidth', 'cacheHitRates', 'artifacts'],
      properties: {
        bandwidth: { type: 'object' },
        cacheHitRates: { type: 'object' },
        coalescingEfficiency: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'profiling', 'memory']
}));

export const occupancyAnalysisTask = defineTask('occupancy-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Occupancy Analysis - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['nsight-profiler', 'gpu-benchmarking'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Analyze kernel occupancy',
      context: args,
      instructions: [
        '1. Calculate theoretical occupancy',
        '2. Measure achieved occupancy',
        '3. Analyze limiting factors',
        '4. Profile register usage impact',
        '5. Analyze shared memory impact',
        '6. Test different block sizes',
        '7. Use occupancy calculator API',
        '8. Compare achieved vs theoretical',
        '9. Identify occupancy limiters',
        '10. Document occupancy findings'
      ],
      outputFormat: 'JSON with occupancy analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['averageOccupancy', 'limitingFactors', 'artifacts'],
      properties: {
        averageOccupancy: { type: 'number' },
        theoreticalOccupancy: { type: 'number' },
        limitingFactors: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'profiling', 'occupancy']
}));

export const rooflineAnalysisTask = defineTask('roofline-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Roofline Analysis - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['nsight-profiler', 'gpu-benchmarking'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Create roofline model analysis',
      context: args,
      instructions: [
        '1. Calculate peak FLOPS for GPU',
        '2. Measure memory bandwidth ceiling',
        '3. Calculate arithmetic intensity per kernel',
        '4. Plot kernels on roofline model',
        '5. Identify compute vs memory bound',
        '6. Calculate distance from roofline',
        '7. Identify optimization direction',
        '8. Create roofline visualization',
        '9. Compare to theoretical limits',
        '10. Document roofline insights'
      ],
      outputFormat: 'JSON with roofline analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['plotPath', 'kernelPositions', 'artifacts'],
      properties: {
        plotPath: { type: 'string' },
        kernelPositions: { type: 'array', items: { type: 'object' } },
        peakFlops: { type: 'number' },
        peakBandwidth: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'profiling', 'roofline']
}));

export const bottleneckIdentificationTask = defineTask('bottleneck-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Bottleneck Identification - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['nsight-profiler', 'gpu-benchmarking'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Identify performance bottlenecks',
      context: args,
      instructions: [
        '1. Analyze all profiling data',
        '2. Identify memory bottlenecks',
        '3. Identify compute bottlenecks',
        '4. Identify latency bottlenecks',
        '5. Rank bottlenecks by impact',
        '6. Identify root causes',
        '7. Calculate potential gains',
        '8. Prioritize optimization targets',
        '9. Document bottleneck analysis',
        '10. Create bottleneck summary'
      ],
      outputFormat: 'JSON with bottleneck identification'
    },
    outputSchema: {
      type: 'object',
      required: ['bottlenecks', 'prioritizedList', 'artifacts'],
      properties: {
        bottlenecks: { type: 'array', items: { type: 'object' } },
        prioritizedList: { type: 'array', items: { type: 'object' } },
        potentialGains: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'profiling', 'bottlenecks']
}));

export const optimizationRecommendationsTask = defineTask('optimization-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimization Recommendations - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['nsight-profiler', 'gpu-benchmarking'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Generate optimization recommendations',
      context: args,
      instructions: [
        '1. Analyze bottleneck root causes',
        '2. Recommend memory optimizations',
        '3. Recommend compute optimizations',
        '4. Suggest launch config changes',
        '5. Recommend algorithm changes',
        '6. Prioritize by effort vs impact',
        '7. Provide code examples',
        '8. Estimate improvement potential',
        '9. Create optimization roadmap',
        '10. Document recommendations'
      ],
      outputFormat: 'JSON with optimization recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'roadmap', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        roadmap: { type: 'array', items: { type: 'object' } },
        estimatedGains: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'profiling', 'recommendations']
}));
