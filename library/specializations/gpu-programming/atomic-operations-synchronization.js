/**
 * @process specializations/gpu-programming/atomic-operations-synchronization
 * @description Atomic Operations and Synchronization Patterns - Process for correctly and efficiently using
 * atomic operations and synchronization primitives in GPU kernels.
 * @inputs { projectName: string, synchronizationNeeds: array, atomicOperations?: array, lockFree?: boolean, outputDir?: string }
 * @outputs { success: boolean, synchronizationDesign: object, atomicImplementations: array, performanceAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/atomic-operations-synchronization', {
 *   projectName: 'concurrent_data_structures',
 *   synchronizationNeeds: ['histogram', 'queue_insert'],
 *   atomicOperations: ['atomicAdd', 'atomicCAS'],
 *   lockFree: true
 * });
 *
 * @references
 * - CUDA Atomics: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
 * - Cooperative Groups: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
 * - Lock-Free Programming: https://developer.nvidia.com/blog/cooperative-groups/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    synchronizationNeeds,
    atomicOperations = ['atomicAdd', 'atomicCAS'],
    lockFree = true,
    outputDir = 'atomic-sync-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Atomic Operations/Synchronization: ${projectName}`);
  ctx.log('info', `Needs: ${synchronizationNeeds.join(', ')}, Lock-free: ${lockFree}`);

  // Phase 1: Synchronization Requirements
  const syncRequirements = await ctx.task(synchronizationRequirementsTask, {
    projectName, synchronizationNeeds, outputDir
  });
  artifacts.push(...syncRequirements.artifacts);

  // Phase 2: Atomic Operation Selection
  const atomicSelection = await ctx.task(atomicSelectionTask, {
    projectName, atomicOperations, syncRequirements, outputDir
  });
  artifacts.push(...atomicSelection.artifacts);

  // Phase 3: Lock-Free Algorithm Design
  let lockFreeDesign = null;
  if (lockFree) {
    lockFreeDesign = await ctx.task(lockFreeDesignTask, {
      projectName, syncRequirements, atomicSelection, outputDir
    });
    artifacts.push(...lockFreeDesign.artifacts);
  }

  // Phase 4: Contention Minimization
  const contentionMinimization = await ctx.task(contentionMinimizationTask, {
    projectName, atomicSelection, lockFreeDesign, outputDir
  });
  artifacts.push(...contentionMinimization.artifacts);

  // Phase 5: Cooperative Groups Integration
  const cooperativeGroups = await ctx.task(cooperativeGroupsTask, {
    projectName, syncRequirements, outputDir
  });
  artifacts.push(...cooperativeGroups.artifacts);

  // Phase 6: Performance Analysis
  const performanceAnalysis = await ctx.task(atomicPerformanceTask, {
    projectName, atomicSelection, contentionMinimization, outputDir
  });
  artifacts.push(...performanceAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Atomic/sync implementation complete for ${projectName}. Contention reduction: ${performanceAnalysis.contentionReduction}%. Review?`,
    title: 'Atomic Operations Complete',
    context: { runId: ctx.runId, performanceAnalysis }
  });

  return {
    success: performanceAnalysis.correctness && performanceAnalysis.contentionReduction >= 30,
    projectName,
    synchronizationDesign: {
      strategy: syncRequirements.strategy,
      atomicsUsed: atomicSelection.selectedAtomics,
      lockFree: lockFreeDesign?.isLockFree || false
    },
    atomicImplementations: atomicSelection.implementations,
    performanceAnalysis: {
      contentionReduction: performanceAnalysis.contentionReduction,
      throughput: performanceAnalysis.throughput,
      correctness: performanceAnalysis.correctness
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/atomic-operations-synchronization',
      timestamp: startTime,
      outputDir
    }
  };
}

export const synchronizationRequirementsTask = defineTask('synchronization-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sync Requirements - ${args.projectName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit', 'warp-primitives'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Analyze synchronization requirements',
      context: args,
      instructions: [
        '1. Identify shared data structures',
        '2. Analyze access patterns',
        '3. Identify race conditions',
        '4. Determine sync granularity',
        '5. Map thread-to-data relationships',
        '6. Identify critical sections',
        '7. Analyze ordering requirements',
        '8. Document sync points',
        '9. Choose sync strategy',
        '10. Create sync diagram'
      ],
      outputFormat: 'JSON with sync requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'sharedData', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        sharedData: { type: 'array', items: { type: 'object' } },
        raceConditions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'atomic', 'requirements']
}));

export const atomicSelectionTask = defineTask('atomic-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Atomic Selection - ${args.projectName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit', 'warp-primitives'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Select and implement atomic operations',
      context: args,
      instructions: [
        '1. Choose appropriate atomics',
        '2. Implement atomicAdd usage',
        '3. Implement atomicCAS patterns',
        '4. Use atomicExch when needed',
        '5. Implement atomic counters',
        '6. Handle 64-bit atomics',
        '7. Use system-scope atomics',
        '8. Implement compare-and-swap loops',
        '9. Test atomic correctness',
        '10. Document atomic usage'
      ],
      outputFormat: 'JSON with atomic selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedAtomics', 'implementations', 'artifacts'],
      properties: {
        selectedAtomics: { type: 'array', items: { type: 'string' } },
        implementations: { type: 'array', items: { type: 'object' } },
        casPatterns: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'atomic', 'selection']
}));

export const lockFreeDesignTask = defineTask('lock-free-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Lock-Free Design - ${args.projectName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit', 'warp-primitives'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Design lock-free algorithms',
      context: args,
      instructions: [
        '1. Design lock-free data structures',
        '2. Implement CAS-based algorithms',
        '3. Handle ABA problem',
        '4. Use hazard pointers if needed',
        '5. Ensure progress guarantees',
        '6. Avoid livelocks',
        '7. Test under contention',
        '8. Verify linearizability',
        '9. Document invariants',
        '10. Prove correctness'
      ],
      outputFormat: 'JSON with lock-free design'
    },
    outputSchema: {
      type: 'object',
      required: ['isLockFree', 'algorithms', 'artifacts'],
      properties: {
        isLockFree: { type: 'boolean' },
        algorithms: { type: 'array', items: { type: 'object' } },
        progressGuarantee: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'atomic', 'lock-free']
}));

export const contentionMinimizationTask = defineTask('contention-minimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Contention Minimization - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['nsight-profiler', 'cuda-toolkit'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Minimize atomic contention',
      context: args,
      instructions: [
        '1. Profile atomic contention',
        '2. Use privatization',
        '3. Implement hierarchical atomics',
        '4. Use warp-level reduction',
        '5. Batch atomic updates',
        '6. Use block-level aggregation',
        '7. Randomize access patterns',
        '8. Use multiple counters',
        '9. Profile optimized version',
        '10. Document strategies'
      ],
      outputFormat: 'JSON with contention minimization'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'contentionReduction', 'artifacts'],
      properties: {
        strategies: { type: 'array', items: { type: 'object' } },
        contentionReduction: { type: 'number' },
        optimizedCode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'atomic', 'contention']
}));

export const cooperativeGroupsTask = defineTask('cooperative-groups', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cooperative Groups - ${args.projectName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit', 'warp-primitives'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement cooperative groups',
      context: args,
      instructions: [
        '1. Use thread_block groups',
        '2. Use tiled_partition',
        '3. Implement coalesced_threads',
        '4. Use grid-level sync',
        '5. Implement custom partitions',
        '6. Use collective operations',
        '7. Implement group reductions',
        '8. Handle subgroup sync',
        '9. Test group operations',
        '10. Document usage patterns'
      ],
      outputFormat: 'JSON with cooperative groups'
    },
    outputSchema: {
      type: 'object',
      required: ['groupTypes', 'implementation', 'artifacts'],
      properties: {
        groupTypes: { type: 'array', items: { type: 'string' } },
        implementation: { type: 'object' },
        collectiveOps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'atomic', 'cooperative-groups']
}));

export const atomicPerformanceTask = defineTask('atomic-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Analysis - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['nsight-profiler', 'cuda-toolkit'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Analyze atomic performance',
      context: args,
      instructions: [
        '1. Profile atomic throughput',
        '2. Measure contention levels',
        '3. Compare strategies',
        '4. Verify correctness',
        '5. Test scalability',
        '6. Measure under load',
        '7. Profile memory traffic',
        '8. Create comparison report',
        '9. Document findings',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON with performance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['contentionReduction', 'throughput', 'correctness', 'artifacts'],
      properties: {
        contentionReduction: { type: 'number' },
        throughput: { type: 'number' },
        correctness: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'atomic', 'performance']
}));
