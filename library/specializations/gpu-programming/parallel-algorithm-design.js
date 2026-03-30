/**
 * @process specializations/gpu-programming/parallel-algorithm-design
 * @description Parallel Algorithm Design - Process for designing efficient parallel algorithms that exploit GPU architecture.
 * Covers algorithm decomposition, work distribution, and synchronization strategies.
 * @inputs { algorithmName: string, problemType: string, inputSize?: string, parallelPattern?: string, outputDir?: string }
 * @outputs { success: boolean, algorithmDesign: object, workDistribution: object, implementationGuide: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/parallel-algorithm-design', {
 *   algorithmName: 'parallel_sort',
 *   problemType: 'sorting',
 *   inputSize: 'large',
 *   parallelPattern: 'divide-and-conquer'
 * });
 *
 * @references
 * - Programming Massively Parallel Processors by Kirk & Hwu
 * - GPU Gems 3: Parallel Prefix Sum: https://developer.nvidia.com/gpugems/gpugems3
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    algorithmName,
    problemType,
    inputSize = 'large',
    parallelPattern = 'data-parallel',
    outputDir = 'algorithm-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Parallel Algorithm Design: ${algorithmName}`);
  ctx.log('info', `Problem type: ${problemType}, Pattern: ${parallelPattern}`);

  // Phase 1: Problem Analysis
  const problemAnalysis = await ctx.task(problemAnalysisTask, {
    algorithmName, problemType, inputSize, outputDir
  });
  artifacts.push(...problemAnalysis.artifacts);

  // Phase 2: Parallelism Analysis
  const parallelismAnalysis = await ctx.task(parallelismAnalysisTask, {
    algorithmName, problemAnalysis, parallelPattern, outputDir
  });
  artifacts.push(...parallelismAnalysis.artifacts);

  // Phase 3: Work Decomposition
  const workDecomposition = await ctx.task(workDecompositionTask, {
    algorithmName, parallelismAnalysis, inputSize, outputDir
  });
  artifacts.push(...workDecomposition.artifacts);

  // Phase 4: Synchronization Design
  const synchronizationDesign = await ctx.task(synchronizationDesignTask, {
    algorithmName, workDecomposition, outputDir
  });
  artifacts.push(...synchronizationDesign.artifacts);

  // Phase 5: Pattern Implementation
  const patternImplementation = await ctx.task(patternImplementationTask, {
    algorithmName, parallelPattern, workDecomposition, synchronizationDesign, outputDir
  });
  artifacts.push(...patternImplementation.artifacts);

  // Phase 6: Complexity Analysis
  const complexityAnalysis = await ctx.task(complexityAnalysisTask, {
    algorithmName, workDecomposition, patternImplementation, outputDir
  });
  artifacts.push(...complexityAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Parallel algorithm design complete for ${algorithmName}. Work efficiency: ${complexityAnalysis.workEfficiency}. Proceed with documentation?`,
    title: 'Algorithm Design Complete',
    context: { runId: ctx.runId, complexityAnalysis }
  });

  return {
    success: true,
    algorithmName,
    algorithmDesign: {
      problemType,
      parallelPattern,
      parallelismType: parallelismAnalysis.parallelismType,
      scalability: complexityAnalysis.scalability
    },
    workDistribution: {
      decomposition: workDecomposition.strategy,
      granularity: workDecomposition.granularity,
      loadBalance: workDecomposition.loadBalanceStrategy
    },
    implementationGuide: {
      patterns: patternImplementation.patterns,
      synchronization: synchronizationDesign.strategy,
      codeTemplates: patternImplementation.codeTemplates
    },
    complexity: {
      work: complexityAnalysis.workComplexity,
      span: complexityAnalysis.spanComplexity,
      efficiency: complexityAnalysis.workEfficiency
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/parallel-algorithm-design',
      timestamp: startTime,
      outputDir
    }
  };
}

export const problemAnalysisTask = defineTask('problem-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Problem Analysis - ${args.algorithmName}`,
  agent: {
    name: 'parallel-algorithm-designer',
    skills: ['parallel-patterns', 'warp-primitives'],
    prompt: {
      role: 'Parallel Algorithm Designer',
      task: 'Analyze problem for parallelization',
      context: args,
      instructions: [
        '1. Define problem domain and constraints',
        '2. Identify input/output characteristics',
        '3. Analyze data dependencies',
        '4. Identify inherent parallelism',
        '5. Determine computational intensity',
        '6. Analyze memory requirements',
        '7. Identify bottleneck operations',
        '8. Define correctness criteria',
        '9. Document sequential baseline',
        '10. Estimate parallelization potential'
      ],
      outputFormat: 'JSON with problem analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['problemDomain', 'dependencies', 'artifacts'],
      properties: {
        problemDomain: { type: 'object' },
        dependencies: { type: 'array', items: { type: 'object' } },
        parallelizationPotential: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'algorithm', 'analysis']
}));

export const parallelismAnalysisTask = defineTask('parallelism-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Parallelism Analysis - ${args.algorithmName}`,
  agent: {
    name: 'parallel-algorithm-designer',
    skills: ['parallel-patterns', 'warp-primitives'],
    prompt: {
      role: 'Parallel Algorithm Designer',
      task: 'Analyze parallelism opportunities',
      context: args,
      instructions: [
        '1. Identify data parallelism opportunities',
        '2. Analyze task parallelism potential',
        '3. Identify pipeline parallelism',
        '4. Analyze reduction opportunities',
        '5. Identify scan/prefix operations',
        '6. Analyze gather/scatter patterns',
        '7. Identify stencil computations',
        '8. Determine parallelism granularity',
        '9. Assess GPU suitability',
        '10. Document parallelism strategy'
      ],
      outputFormat: 'JSON with parallelism analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['parallelismType', 'patterns', 'artifacts'],
      properties: {
        parallelismType: { type: 'string' },
        patterns: { type: 'array', items: { type: 'string' } },
        gpuSuitability: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'algorithm', 'parallelism']
}));

export const workDecompositionTask = defineTask('work-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Work Decomposition - ${args.algorithmName}`,
  agent: {
    name: 'parallel-algorithm-designer',
    skills: ['parallel-patterns', 'warp-primitives'],
    prompt: {
      role: 'Parallel Algorithm Designer',
      task: 'Design work decomposition strategy',
      context: args,
      instructions: [
        '1. Define work unit granularity',
        '2. Map work to GPU threads',
        '3. Design thread block organization',
        '4. Balance load across threads',
        '5. Handle irregular workloads',
        '6. Design grid dimensions',
        '7. Optimize for GPU occupancy',
        '8. Handle input size variations',
        '9. Document mapping strategy',
        '10. Create work distribution diagram'
      ],
      outputFormat: 'JSON with work decomposition'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'granularity', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        granularity: { type: 'string' },
        loadBalanceStrategy: { type: 'string' },
        threadMapping: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'algorithm', 'decomposition']
}));

export const synchronizationDesignTask = defineTask('synchronization-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Synchronization Design - ${args.algorithmName}`,
  agent: {
    name: 'parallel-algorithm-designer',
    skills: ['parallel-patterns', 'warp-primitives'],
    prompt: {
      role: 'Parallel Algorithm Designer',
      task: 'Design synchronization strategy',
      context: args,
      instructions: [
        '1. Identify synchronization points',
        '2. Design barrier usage',
        '3. Plan atomic operations',
        '4. Minimize synchronization overhead',
        '5. Handle warp-level sync',
        '6. Design block-level sync',
        '7. Plan global synchronization',
        '8. Avoid deadlock conditions',
        '9. Use cooperative groups if needed',
        '10. Document sync strategy'
      ],
      outputFormat: 'JSON with synchronization design'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'syncPoints', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        syncPoints: { type: 'array', items: { type: 'object' } },
        atomicOps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'algorithm', 'synchronization']
}));

export const patternImplementationTask = defineTask('pattern-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pattern Implementation - ${args.algorithmName}`,
  agent: {
    name: 'parallel-algorithm-designer',
    skills: ['parallel-patterns'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement parallel patterns',
      context: args,
      instructions: [
        '1. Implement map pattern if needed',
        '2. Implement reduce pattern',
        '3. Implement scan/prefix sum',
        '4. Implement scatter/gather',
        '5. Implement stencil pattern',
        '6. Combine patterns as needed',
        '7. Optimize pattern implementations',
        '8. Create reusable templates',
        '9. Test pattern correctness',
        '10. Document pattern usage'
      ],
      outputFormat: 'JSON with pattern implementations'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'codeTemplates', 'artifacts'],
      properties: {
        patterns: { type: 'array', items: { type: 'object' } },
        codeTemplates: { type: 'array', items: { type: 'object' } },
        optimizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'algorithm', 'patterns']
}));

export const complexityAnalysisTask = defineTask('complexity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Complexity Analysis - ${args.algorithmName}`,
  agent: {
    name: 'parallel-algorithm-designer',
    skills: ['parallel-patterns', 'warp-primitives'],
    prompt: {
      role: 'Parallel Algorithm Designer',
      task: 'Analyze algorithm complexity',
      context: args,
      instructions: [
        '1. Calculate work complexity (total operations)',
        '2. Calculate span complexity (critical path)',
        '3. Compute parallelism (work/span)',
        '4. Calculate work efficiency',
        '5. Analyze scalability',
        '6. Identify Amdahl\'s law limitations',
        '7. Estimate speedup potential',
        '8. Compare to sequential baseline',
        '9. Document complexity analysis',
        '10. Provide optimization recommendations'
      ],
      outputFormat: 'JSON with complexity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['workComplexity', 'spanComplexity', 'workEfficiency', 'artifacts'],
      properties: {
        workComplexity: { type: 'string' },
        spanComplexity: { type: 'string' },
        workEfficiency: { type: 'string' },
        scalability: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'algorithm', 'complexity']
}));
