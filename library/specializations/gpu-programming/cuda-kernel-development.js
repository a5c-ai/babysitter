/**
 * @process specializations/gpu-programming/cuda-kernel-development
 * @description CUDA Kernel Development Workflow - End-to-end process for developing, testing, and deploying CUDA kernels.
 * Covers kernel design, thread indexing strategies, execution configuration, and integration with host code.
 * @inputs { kernelName: string, operation: string, dataType?: string, targetArch?: string, blockSize?: number, outputDir?: string }
 * @outputs { success: boolean, kernelFiles: object, hostCode: object, launchConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/cuda-kernel-development', {
 *   kernelName: 'matrix_multiply',
 *   operation: 'GEMM',
 *   dataType: 'float',
 *   targetArch: 'sm_86',
 *   blockSize: 256
 * });
 *
 * @references
 * - CUDA C++ Programming Guide: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
 * - CUDA C++ Best Practices Guide: https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/
 * - NVIDIA Developer Blog: https://developer.nvidia.com/blog/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    kernelName,
    operation,
    dataType = 'float',
    targetArch = 'sm_80',
    blockSize = 256,
    useSharedMemory = true,
    errorChecking = true,
    outputDir = 'cuda-kernel-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CUDA Kernel Development: ${kernelName}`);
  ctx.log('info', `Operation: ${operation}, Data type: ${dataType}, Target: ${targetArch}`);

  // ============================================================================
  // PHASE 1: KERNEL REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Kernel Requirements Analysis');

  const requirements = await ctx.task(kernelRequirementsTask, {
    kernelName,
    operation,
    dataType,
    targetArch,
    blockSize,
    useSharedMemory,
    outputDir
  });

  artifacts.push(...requirements.artifacts);

  await ctx.breakpoint({
    question: `Kernel requirements defined for ${kernelName}. Computational pattern: ${requirements.computePattern}. Proceed with design?`,
    title: 'Kernel Requirements Review',
    context: {
      runId: ctx.runId,
      kernelName,
      requirements: requirements.functionalReqs,
      files: requirements.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: THREAD INDEXING DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Thread Indexing Design');

  const threadIndexing = await ctx.task(threadIndexingTask, {
    kernelName,
    operation,
    requirements,
    blockSize,
    outputDir
  });

  artifacts.push(...threadIndexing.artifacts);

  // ============================================================================
  // PHASE 3: EXECUTION CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Execution Configuration');

  const executionConfig = await ctx.task(executionConfigTask, {
    kernelName,
    targetArch,
    blockSize,
    requirements,
    threadIndexing,
    outputDir
  });

  artifacts.push(...executionConfig.artifacts);

  // ============================================================================
  // PHASE 4: KERNEL IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Kernel Implementation');

  const kernelImpl = await ctx.task(kernelImplementationTask, {
    kernelName,
    operation,
    dataType,
    targetArch,
    useSharedMemory,
    requirements,
    threadIndexing,
    executionConfig,
    outputDir
  });

  artifacts.push(...kernelImpl.artifacts);

  // ============================================================================
  // PHASE 5: HOST CODE INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Host Code Integration');

  const hostIntegration = await ctx.task(hostIntegrationTask, {
    kernelName,
    dataType,
    kernelImpl,
    executionConfig,
    errorChecking,
    outputDir
  });

  artifacts.push(...hostIntegration.artifacts);

  // ============================================================================
  // PHASE 6: ERROR HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 6: Error Handling Implementation');

  const errorHandling = await ctx.task(cudaErrorHandlingTask, {
    kernelName,
    kernelImpl,
    hostIntegration,
    outputDir
  });

  artifacts.push(...errorHandling.artifacts);

  // ============================================================================
  // PHASE 7: VALIDATION AND TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Validation and Testing');

  const validation = await ctx.task(kernelValidationTask, {
    kernelName,
    operation,
    dataType,
    kernelImpl,
    hostIntegration,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Documentation');

  const documentation = await ctx.task(kernelDocumentationTask, {
    kernelName,
    operation,
    requirements,
    executionConfig,
    kernelImpl,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `CUDA Kernel Development Complete for ${kernelName}. Validation: ${validation.passed ? 'PASSED' : 'FAILED'}. Review kernel package?`,
    title: 'Kernel Development Complete',
    context: {
      runId: ctx.runId,
      summary: {
        kernelName,
        operation,
        targetArch,
        validationPassed: validation.passed,
        testCount: validation.testCount
      },
      files: [
        { path: kernelImpl.kernelPath, format: 'cuda', label: 'Kernel Source' },
        { path: documentation.docPath, format: 'markdown', label: 'Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validation.passed,
    kernelName,
    operation,
    kernelFiles: {
      kernel: kernelImpl.kernelPath,
      header: kernelImpl.headerPath,
      host: hostIntegration.hostPath
    },
    hostCode: {
      path: hostIntegration.hostPath,
      launchWrapper: hostIntegration.launchWrapper,
      memoryManagement: hostIntegration.memoryFunctions
    },
    launchConfig: {
      gridDim: executionConfig.gridDim,
      blockDim: executionConfig.blockDim,
      sharedMemSize: executionConfig.sharedMemSize,
      occupancy: executionConfig.theoreticalOccupancy
    },
    validation: {
      passed: validation.passed,
      testCount: validation.testCount,
      accuracy: validation.accuracy
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/gpu-programming/cuda-kernel-development',
      timestamp: startTime,
      targetArch,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const kernelRequirementsTask = defineTask('kernel-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements - ${args.kernelName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit', 'warp-primitives'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Define CUDA kernel requirements',
      context: args,
      instructions: [
        '1. Analyze computational operation requirements',
        '2. Identify data parallelism opportunities',
        '3. Define input/output data structures',
        '4. Specify memory access patterns',
        '5. Identify shared memory requirements',
        '6. Define performance targets',
        '7. Specify precision requirements',
        '8. Identify boundary conditions',
        '9. Define error handling requirements',
        '10. Document hardware constraints'
      ],
      outputFormat: 'JSON with kernel requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['functionalReqs', 'computePattern', 'artifacts'],
      properties: {
        functionalReqs: { type: 'array', items: { type: 'object' } },
        computePattern: { type: 'string' },
        memoryPattern: { type: 'string' },
        performanceTargets: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'cuda', 'requirements']
}));

export const threadIndexingTask = defineTask('thread-indexing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Thread Indexing - ${args.kernelName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit', 'warp-primitives'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Design thread indexing strategy',
      context: args,
      instructions: [
        '1. Define thread-to-data mapping',
        '2. Design grid and block dimensions',
        '3. Implement global index calculation',
        '4. Handle boundary conditions',
        '5. Optimize for memory coalescing',
        '6. Consider warp alignment',
        '7. Design multi-dimensional indexing if needed',
        '8. Document indexing scheme',
        '9. Create index validation logic',
        '10. Handle edge cases'
      ],
      outputFormat: 'JSON with thread indexing design'
    },
    outputSchema: {
      type: 'object',
      required: ['indexingScheme', 'boundsChecking', 'artifacts'],
      properties: {
        indexingScheme: { type: 'object' },
        boundsChecking: { type: 'string' },
        dimensions: { type: 'number' },
        coalescingStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'cuda', 'thread-indexing']
}));

export const executionConfigTask = defineTask('execution-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Execution Config - ${args.kernelName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Configure kernel execution parameters',
      context: args,
      instructions: [
        '1. Calculate optimal block size',
        '2. Determine grid dimensions',
        '3. Calculate shared memory requirements',
        '4. Estimate register usage',
        '5. Calculate theoretical occupancy',
        '6. Use occupancy calculator API',
        '7. Consider target architecture limits',
        '8. Balance occupancy vs resources',
        '9. Document launch configuration',
        '10. Create dynamic configuration logic'
      ],
      outputFormat: 'JSON with execution configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['gridDim', 'blockDim', 'theoreticalOccupancy', 'artifacts'],
      properties: {
        gridDim: { type: 'object' },
        blockDim: { type: 'object' },
        sharedMemSize: { type: 'number' },
        theoreticalOccupancy: { type: 'number' },
        registersPerThread: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'cuda', 'execution-config']
}));

export const kernelImplementationTask = defineTask('kernel-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Implementation - ${args.kernelName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit', 'warp-primitives'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement CUDA kernel',
      context: args,
      instructions: [
        '1. Create kernel function signature',
        '2. Implement thread indexing',
        '3. Add bounds checking',
        '4. Implement core computation',
        '5. Use shared memory if applicable',
        '6. Add synchronization barriers',
        '7. Optimize memory access patterns',
        '8. Use appropriate intrinsics',
        '9. Add kernel attributes (__launch_bounds__)',
        '10. Implement any helper device functions'
      ],
      outputFormat: 'JSON with implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['kernelPath', 'headerPath', 'artifacts'],
      properties: {
        kernelPath: { type: 'string' },
        headerPath: { type: 'string' },
        kernelSignature: { type: 'string' },
        deviceFunctions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'cuda', 'implementation']
}));

export const hostIntegrationTask = defineTask('host-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Host Integration - ${args.kernelName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Create host-device integration code',
      context: args,
      instructions: [
        '1. Create memory allocation functions',
        '2. Implement host-to-device transfers',
        '3. Create kernel launch wrapper',
        '4. Implement device-to-host transfers',
        '5. Add stream support for async operations',
        '6. Create cleanup/deallocation functions',
        '7. Implement pinned memory option',
        '8. Add device query functions',
        '9. Create batch processing support',
        '10. Document API usage'
      ],
      outputFormat: 'JSON with host integration details'
    },
    outputSchema: {
      type: 'object',
      required: ['hostPath', 'launchWrapper', 'memoryFunctions', 'artifacts'],
      properties: {
        hostPath: { type: 'string' },
        launchWrapper: { type: 'string' },
        memoryFunctions: { type: 'array', items: { type: 'string' } },
        streamSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'cuda', 'host-integration']
}));

export const cudaErrorHandlingTask = defineTask('cuda-error-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Error Handling - ${args.kernelName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit', 'cuda-debugging'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement CUDA error handling',
      context: args,
      instructions: [
        '1. Create error checking macros',
        '2. Check all CUDA API calls',
        '3. Implement kernel launch error detection',
        '4. Add getLastError checks',
        '5. Create error reporting mechanism',
        '6. Handle out-of-memory conditions',
        '7. Add device capability checks',
        '8. Implement graceful degradation',
        '9. Add logging for debugging',
        '10. Document error codes'
      ],
      outputFormat: 'JSON with error handling details'
    },
    outputSchema: {
      type: 'object',
      required: ['errorMacros', 'errorCodes', 'artifacts'],
      properties: {
        errorMacros: { type: 'array', items: { type: 'string' } },
        errorCodes: { type: 'array', items: { type: 'object' } },
        recoveryStrategies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'cuda', 'error-handling']
}));

export const kernelValidationTask = defineTask('kernel-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Validation - ${args.kernelName}`,
  agent: {
    name: 'gpu-debugging-specialist',
    skills: ['cuda-debugging', 'gpu-benchmarking'],
    prompt: {
      role: 'GPU Test Engineer',
      task: 'Validate CUDA kernel correctness',
      context: args,
      instructions: [
        '1. Create CPU reference implementation',
        '2. Generate test input data',
        '3. Compare GPU vs CPU results',
        '4. Test boundary conditions',
        '5. Test with various input sizes',
        '6. Verify numerical accuracy',
        '7. Test error conditions',
        '8. Run compute-sanitizer checks',
        '9. Measure performance baseline',
        '10. Document test results'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'testCount', 'accuracy', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        testCount: { type: 'number' },
        accuracy: { type: 'string' },
        testCases: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'cuda', 'validation']
}));

export const kernelDocumentationTask = defineTask('kernel-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation - ${args.kernelName}`,
  agent: {
    name: 'technical-writer',
    skills: ['cuda-toolkit'],
    prompt: {
      role: 'Technical Writer',
      task: 'Create kernel documentation',
      context: args,
      instructions: [
        '1. Document kernel API',
        '2. Describe algorithm and approach',
        '3. Document launch configuration',
        '4. Add usage examples',
        '5. Document performance characteristics',
        '6. Describe memory requirements',
        '7. Add architecture requirements',
        '8. Document limitations',
        '9. Include troubleshooting guide',
        '10. Add performance tuning tips'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['docPath', 'artifacts'],
      properties: {
        docPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        examples: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'cuda', 'documentation']
}));
