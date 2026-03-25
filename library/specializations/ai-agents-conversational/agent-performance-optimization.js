/**
 * @process specializations/ai-agents-conversational/agent-performance-optimization
 * @description Agent Performance Optimization - Process for optimizing AI agent performance including
 * latency reduction, throughput improvements, response streaming, and inference optimization.
 * @inputs { agentName?: string, performanceGoals?: object, currentMetrics?: object, outputDir?: string }
 * @outputs { success: boolean, performanceAnalysis: object, optimizations: array, benchmarks: object, improvements: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/agent-performance-optimization', {
 *   agentName: 'production-agent',
 *   performanceGoals: { maxLatencyP95: 500, targetThroughput: 100 },
 *   currentMetrics: { avgLatency: 1200, throughput: 50 }
 * });
 *
 * @references
 * - vLLM: https://docs.vllm.ai/
 * - TensorRT-LLM: https://nvidia.github.io/TensorRT-LLM/
 * - DeepSpeed: https://www.deepspeed.ai/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    agentName = 'performance-optimization',
    performanceGoals = {},
    currentMetrics = {},
    outputDir = 'performance-optimization-output',
    enableStreaming = true,
    enableBatching = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Performance Optimization for ${agentName}`);

  // ============================================================================
  // PHASE 1: PERFORMANCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing current performance');

  const performanceAnalysis = await ctx.task(performanceAnalysisTask, {
    agentName,
    currentMetrics,
    performanceGoals,
    outputDir
  });

  artifacts.push(...performanceAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: LATENCY OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Optimizing latency');

  const latencyOptimization = await ctx.task(latencyOptimizationTask, {
    agentName,
    analysis: performanceAnalysis.analysis,
    performanceGoals,
    outputDir
  });

  artifacts.push(...latencyOptimization.artifacts);

  // ============================================================================
  // PHASE 3: STREAMING OPTIMIZATION
  // ============================================================================

  let streamingOptimization = null;
  if (enableStreaming) {
    ctx.log('info', 'Phase 3: Optimizing streaming');

    streamingOptimization = await ctx.task(streamingOptimizationTask, {
      agentName,
      outputDir
    });

    artifacts.push(...streamingOptimization.artifacts);
  }

  // ============================================================================
  // PHASE 4: BATCHING AND THROUGHPUT
  // ============================================================================

  let batchingOptimization = null;
  if (enableBatching) {
    ctx.log('info', 'Phase 4: Optimizing batching and throughput');

    batchingOptimization = await ctx.task(batchingThroughputTask, {
      agentName,
      performanceGoals,
      outputDir
    });

    artifacts.push(...batchingOptimization.artifacts);
  }

  // ============================================================================
  // PHASE 5: INFERENCE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Optimizing inference');

  const inferenceOptimization = await ctx.task(inferenceOptimizationTask, {
    agentName,
    outputDir
  });

  artifacts.push(...inferenceOptimization.artifacts);

  // ============================================================================
  // PHASE 6: BENCHMARKING
  // ============================================================================

  ctx.log('info', 'Phase 6: Running benchmarks');

  const benchmarks = await ctx.task(benchmarkingTask, {
    agentName,
    optimizations: [
      latencyOptimization.optimization,
      ...(streamingOptimization ? [streamingOptimization.optimization] : []),
      ...(batchingOptimization ? [batchingOptimization.optimization] : []),
      inferenceOptimization.optimization
    ],
    performanceGoals,
    currentMetrics,
    outputDir
  });

  artifacts.push(...benchmarks.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Performance optimization for ${agentName} complete. Latency improvement: ${benchmarks.improvements.latencyReduction}%. Review optimizations?`,
    title: 'Performance Optimization Review',
    context: {
      runId: ctx.runId,
      summary: {
        agentName,
        latencyReduction: benchmarks.improvements.latencyReduction,
        throughputIncrease: benchmarks.improvements.throughputIncrease,
        enableStreaming,
        enableBatching
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'python' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    agentName,
    performanceAnalysis: performanceAnalysis.analysis,
    optimizations: [
      latencyOptimization.optimization,
      ...(streamingOptimization ? [streamingOptimization.optimization] : []),
      ...(batchingOptimization ? [batchingOptimization.optimization] : []),
      inferenceOptimization.optimization
    ],
    benchmarks: benchmarks.results,
    improvements: benchmarks.improvements,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/agent-performance-optimization',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const performanceAnalysisTask = defineTask('performance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Performance - ${args.agentName}`,
  agent: {
    name: 'latency-optimizer',  // AG-OPS-003: Optimizes agent response latency
    prompt: {
      role: 'Performance Analyst',
      task: 'Analyze current agent performance',
      context: args,
      instructions: [
        '1. Profile current latencies',
        '2. Identify bottlenecks',
        '3. Analyze throughput limits',
        '4. Review resource utilization',
        '5. Map request flow',
        '6. Identify optimization targets',
        '7. Prioritize improvements',
        '8. Save performance analysis'
      ],
      outputFormat: 'JSON with performance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        bottlenecks: { type: 'array' },
        optimizationPriorities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance', 'analysis']
}));

export const latencyOptimizationTask = defineTask('latency-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Latency - ${args.agentName}`,
  agent: {
    name: 'latency-optimizer',
    prompt: {
      role: 'Latency Optimizer',
      task: 'Optimize agent latency',
      context: args,
      instructions: [
        '1. Optimize network calls',
        '2. Reduce preprocessing time',
        '3. Optimize prompt assembly',
        '4. Parallelize independent operations',
        '5. Implement connection pooling',
        '6. Add request prioritization',
        '7. Test latency improvements',
        '8. Save latency optimizations'
      ],
      outputFormat: 'JSON with latency optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['optimization', 'artifacts'],
      properties: {
        optimization: { type: 'object' },
        optimizationCodePath: { type: 'string' },
        expectedImprovement: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance', 'latency']
}));

export const streamingOptimizationTask = defineTask('streaming-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Streaming - ${args.agentName}`,
  agent: {
    name: 'streaming-optimizer',
    prompt: {
      role: 'Streaming Optimizer',
      task: 'Optimize response streaming',
      context: args,
      instructions: [
        '1. Implement efficient streaming',
        '2. Optimize time-to-first-token',
        '3. Configure buffer sizes',
        '4. Handle backpressure',
        '5. Optimize chunk processing',
        '6. Add progress indicators',
        '7. Test streaming performance',
        '8. Save streaming optimizations'
      ],
      outputFormat: 'JSON with streaming optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['optimization', 'artifacts'],
      properties: {
        optimization: { type: 'object' },
        streamingCodePath: { type: 'string' },
        ttftImprovement: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance', 'streaming']
}));

export const batchingThroughputTask = defineTask('batching-throughput', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Batching/Throughput - ${args.agentName}`,
  agent: {
    name: 'throughput-optimizer',
    prompt: {
      role: 'Throughput Optimizer',
      task: 'Optimize batching and throughput',
      context: args,
      instructions: [
        '1. Implement request batching',
        '2. Configure batch sizes',
        '3. Add dynamic batching',
        '4. Optimize queue management',
        '5. Implement concurrency limits',
        '6. Add load shedding',
        '7. Test throughput improvements',
        '8. Save batching optimizations'
      ],
      outputFormat: 'JSON with batching optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['optimization', 'artifacts'],
      properties: {
        optimization: { type: 'object' },
        batchingCodePath: { type: 'string' },
        throughputImprovement: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance', 'batching']
}));

export const inferenceOptimizationTask = defineTask('inference-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Inference - ${args.agentName}`,
  agent: {
    name: 'inference-optimizer',
    prompt: {
      role: 'Inference Optimizer',
      task: 'Optimize model inference',
      context: args,
      instructions: [
        '1. Evaluate vLLM/TensorRT',
        '2. Implement KV-cache optimization',
        '3. Configure quantization',
        '4. Optimize memory usage',
        '5. Implement speculative decoding',
        '6. Configure GPU utilization',
        '7. Test inference improvements',
        '8. Save inference optimizations'
      ],
      outputFormat: 'JSON with inference optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['optimization', 'artifacts'],
      properties: {
        optimization: { type: 'object' },
        inferenceCodePath: { type: 'string' },
        speedup: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance', 'inference']
}));

export const benchmarkingTask = defineTask('benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run Benchmarks - ${args.agentName}`,
  agent: {
    name: 'benchmark-runner',
    prompt: {
      role: 'Benchmark Runner',
      task: 'Run performance benchmarks',
      context: args,
      instructions: [
        '1. Setup benchmark suite',
        '2. Run latency benchmarks',
        '3. Run throughput benchmarks',
        '4. Compare before/after',
        '5. Calculate improvements',
        '6. Validate against goals',
        '7. Generate benchmark report',
        '8. Save benchmark results'
      ],
      outputFormat: 'JSON with benchmark results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'improvements', 'artifacts'],
      properties: {
        results: { type: 'object' },
        improvements: {
          type: 'object',
          properties: {
            latencyReduction: { type: 'number' },
            throughputIncrease: { type: 'number' }
          }
        },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance', 'benchmark']
}));
