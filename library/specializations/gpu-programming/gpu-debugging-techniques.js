/**
 * @process specializations/gpu-programming/gpu-debugging-techniques
 * @description GPU Debugging Techniques - Systematic approach to debugging GPU code, identifying race conditions,
 * memory errors, and correctness issues.
 * @inputs { projectName: string, targetKernels: array, debugTool?: string, issueType?: string, outputDir?: string }
 * @outputs { success: boolean, debugReport: object, issuesFound: array, validationSuite: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/gpu-debugging-techniques', {
 *   projectName: 'parallel_reduction',
 *   targetKernels: ['reduce_sum', 'reduce_max'],
 *   debugTool: 'compute-sanitizer',
 *   issueType: 'race-condition'
 * });
 *
 * @references
 * - compute-sanitizer: https://docs.nvidia.com/cuda/compute-sanitizer/
 * - CUDA-GDB: https://docs.nvidia.com/cuda/cuda-gdb/
 * - Nsight Debugger: https://docs.nvidia.com/nsight-visual-studio-edition/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetKernels,
    debugTool = 'compute-sanitizer',
    issueType = 'all',
    outputDir = 'debug-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting GPU Debugging: ${projectName}`);
  ctx.log('info', `Kernels: ${targetKernels.join(', ')}, Tool: ${debugTool}, Issue type: ${issueType}`);

  // Phase 1: CPU Reference Implementation
  const cpuReference = await ctx.task(cpuReferenceTask, {
    projectName, targetKernels, outputDir
  });
  artifacts.push(...cpuReference.artifacts);

  // Phase 2: Memory Error Detection
  const memoryErrors = await ctx.task(memoryErrorDetectionTask, {
    projectName, targetKernels, debugTool, outputDir
  });
  artifacts.push(...memoryErrors.artifacts);

  // Phase 3: Race Condition Detection
  const raceConditions = await ctx.task(raceConditionDetectionTask, {
    projectName, targetKernels, debugTool, outputDir
  });
  artifacts.push(...raceConditions.artifacts);

  // Phase 4: Correctness Validation
  const correctnessValidation = await ctx.task(correctnessValidationTask, {
    projectName, targetKernels, cpuReference, outputDir
  });
  artifacts.push(...correctnessValidation.artifacts);

  // Phase 5: Debug Instrumentation
  const debugInstrumentation = await ctx.task(debugInstrumentationTask, {
    projectName, targetKernels, outputDir
  });
  artifacts.push(...debugInstrumentation.artifacts);

  // Phase 6: Issue Resolution
  const issueResolution = await ctx.task(issueResolutionTask, {
    projectName, memoryErrors, raceConditions, correctnessValidation, outputDir
  });
  artifacts.push(...issueResolution.artifacts);

  const allIssues = [
    ...memoryErrors.issues,
    ...raceConditions.issues,
    ...correctnessValidation.issues
  ];

  await ctx.breakpoint({
    question: `GPU debugging complete for ${projectName}. Found ${allIssues.length} issues. Review report?`,
    title: 'GPU Debugging Complete',
    context: { runId: ctx.runId, allIssues, issueResolution }
  });

  return {
    success: allIssues.length === 0 || issueResolution.allResolved,
    projectName,
    debugReport: {
      tool: debugTool,
      memoryErrors: memoryErrors.issues.length,
      raceConditions: raceConditions.issues.length,
      correctnessIssues: correctnessValidation.issues.length
    },
    issuesFound: allIssues,
    validationSuite: {
      cpuReference: cpuReference.referencePath,
      testCases: correctnessValidation.testCases,
      debugInstrumentation: debugInstrumentation.instrumentedKernels
    },
    resolution: {
      resolved: issueResolution.resolvedIssues,
      remaining: issueResolution.remainingIssues
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/gpu-debugging-techniques',
      timestamp: startTime,
      outputDir
    }
  };
}

export const cpuReferenceTask = defineTask('cpu-reference', (args, taskCtx) => ({
  kind: 'agent',
  title: `CPU Reference - ${args.projectName}`,
  agent: {
    name: 'gpu-debugging-specialist',
    skills: ['cuda-debugging'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Create CPU reference implementation',
      context: args,
      instructions: [
        '1. Implement sequential version of algorithm',
        '2. Ensure numerical correctness',
        '3. Handle edge cases properly',
        '4. Add comprehensive comments',
        '5. Make output comparable to GPU',
        '6. Add tolerance for floating point',
        '7. Implement comparison utilities',
        '8. Generate test vectors',
        '9. Document expected behavior',
        '10. Test reference thoroughly'
      ],
      outputFormat: 'JSON with CPU reference details'
    },
    outputSchema: {
      type: 'object',
      required: ['referencePath', 'testVectors', 'artifacts'],
      properties: {
        referencePath: { type: 'string' },
        testVectors: { type: 'array', items: { type: 'object' } },
        comparisonUtil: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'debugging', 'reference']
}));

export const memoryErrorDetectionTask = defineTask('memory-error-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Memory Error Detection - ${args.projectName}`,
  agent: {
    name: 'gpu-debugging-specialist',
    skills: ['cuda-debugging'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Detect memory errors',
      context: args,
      instructions: [
        '1. Run compute-sanitizer memcheck',
        '2. Detect out-of-bounds access',
        '3. Find uninitialized memory reads',
        '4. Detect memory leaks',
        '5. Find invalid global memory access',
        '6. Check shared memory bounds',
        '7. Detect invalid device pointers',
        '8. Analyze error reports',
        '9. Locate error sources',
        '10. Document memory issues'
      ],
      outputFormat: 'JSON with memory error detection results'
    },
    outputSchema: {
      type: 'object',
      required: ['issues', 'scanResults', 'artifacts'],
      properties: {
        issues: { type: 'array', items: { type: 'object' } },
        scanResults: { type: 'object' },
        memcheckLog: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'debugging', 'memory']
}));

export const raceConditionDetectionTask = defineTask('race-condition-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Race Condition Detection - ${args.projectName}`,
  agent: {
    name: 'gpu-debugging-specialist',
    skills: ['cuda-debugging'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Detect race conditions',
      context: args,
      instructions: [
        '1. Run compute-sanitizer racecheck',
        '2. Detect WAW hazards',
        '3. Detect WAR hazards',
        '4. Detect RAW hazards',
        '5. Analyze shared memory races',
        '6. Check atomic operation usage',
        '7. Verify synchronization',
        '8. Analyze barrier usage',
        '9. Document race conditions',
        '10. Provide fix suggestions'
      ],
      outputFormat: 'JSON with race condition detection results'
    },
    outputSchema: {
      type: 'object',
      required: ['issues', 'raceCheckLog', 'artifacts'],
      properties: {
        issues: { type: 'array', items: { type: 'object' } },
        raceCheckLog: { type: 'string' },
        hazardTypes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'debugging', 'race-conditions']
}));

export const correctnessValidationTask = defineTask('correctness-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Correctness Validation - ${args.projectName}`,
  agent: {
    name: 'gpu-debugging-specialist',
    skills: ['cuda-debugging'],
    prompt: {
      role: 'GPU Test Engineer',
      task: 'Validate kernel correctness',
      context: args,
      instructions: [
        '1. Compare GPU vs CPU results',
        '2. Test with various input sizes',
        '3. Test boundary conditions',
        '4. Test with random inputs',
        '5. Check numerical precision',
        '6. Test determinism',
        '7. Test thread block variations',
        '8. Identify failing cases',
        '9. Generate minimal repro',
        '10. Document correctness issues'
      ],
      outputFormat: 'JSON with correctness validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['issues', 'testCases', 'artifacts'],
      properties: {
        issues: { type: 'array', items: { type: 'object' } },
        testCases: { type: 'array', items: { type: 'object' } },
        passRate: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'debugging', 'correctness']
}));

export const debugInstrumentationTask = defineTask('debug-instrumentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Debug Instrumentation - ${args.projectName}`,
  agent: {
    name: 'gpu-debugging-specialist',
    skills: ['cuda-debugging'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Add debug instrumentation',
      context: args,
      instructions: [
        '1. Add conditional printf debugging',
        '2. Create assertion macros',
        '3. Add bounds checking',
        '4. Instrument memory accesses',
        '5. Add execution counters',
        '6. Create debug build configuration',
        '7. Add early-exit debugging',
        '8. Implement single-thread debugging',
        '9. Add value logging',
        '10. Document debug usage'
      ],
      outputFormat: 'JSON with debug instrumentation'
    },
    outputSchema: {
      type: 'object',
      required: ['instrumentedKernels', 'debugMacros', 'artifacts'],
      properties: {
        instrumentedKernels: { type: 'array', items: { type: 'string' } },
        debugMacros: { type: 'array', items: { type: 'string' } },
        debugConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'debugging', 'instrumentation']
}));

export const issueResolutionTask = defineTask('issue-resolution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Issue Resolution - ${args.projectName}`,
  agent: {
    name: 'gpu-debugging-specialist',
    skills: ['cuda-debugging'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Resolve identified issues',
      context: args,
      instructions: [
        '1. Prioritize issues by severity',
        '2. Fix memory errors',
        '3. Fix race conditions',
        '4. Fix correctness issues',
        '5. Add proper synchronization',
        '6. Fix bounds checking',
        '7. Verify fixes work',
        '8. Regression test',
        '9. Document fixes',
        '10. Update code patterns'
      ],
      outputFormat: 'JSON with issue resolution results'
    },
    outputSchema: {
      type: 'object',
      required: ['allResolved', 'resolvedIssues', 'remainingIssues', 'artifacts'],
      properties: {
        allResolved: { type: 'boolean' },
        resolvedIssues: { type: 'array', items: { type: 'object' } },
        remainingIssues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'debugging', 'resolution']
}));
