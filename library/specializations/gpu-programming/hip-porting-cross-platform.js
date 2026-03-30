/**
 * @process specializations/gpu-programming/hip-porting-cross-platform
 * @description HIP Porting and Cross-Platform Development - Workflow for porting CUDA applications to AMD GPUs
 * using HIP, enabling cross-platform GPU computing.
 * @inputs { projectName: string, sourceType: string, targetPlatforms?: array, portingStrategy?: string, outputDir?: string }
 * @outputs { success: boolean, portedCode: object, compatibilityReport: object, buildSystem: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/hip-porting-cross-platform', {
 *   projectName: 'compute_library',
 *   sourceType: 'cuda',
 *   targetPlatforms: ['nvidia', 'amd'],
 *   portingStrategy: 'hipify-perl'
 * });
 *
 * @references
 * - HIP Documentation: https://rocm.docs.amd.com/projects/HIP/
 * - Hipify Tools: https://github.com/ROCm-Developer-Tools/HIPIFY
 * - ROCm Documentation: https://rocm.docs.amd.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sourceType,
    targetPlatforms = ['nvidia', 'amd'],
    portingStrategy = 'hipify-clang',
    outputDir = 'hip-porting-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting HIP Porting: ${projectName}`);
  ctx.log('info', `Source: ${sourceType}, Targets: ${targetPlatforms.join(', ')}`);

  // Phase 1: Codebase Analysis
  const codebaseAnalysis = await ctx.task(codebaseAnalysisTask, {
    projectName, sourceType, outputDir
  });
  artifacts.push(...codebaseAnalysis.artifacts);

  // Phase 2: Hipify Conversion
  const hipifyConversion = await ctx.task(hipifyConversionTask, {
    projectName, portingStrategy, codebaseAnalysis, outputDir
  });
  artifacts.push(...hipifyConversion.artifacts);

  // Phase 3: API Differences Handling
  const apiDifferences = await ctx.task(apiDifferencesTask, {
    projectName, hipifyConversion, outputDir
  });
  artifacts.push(...apiDifferences.artifacts);

  // Phase 4: Cross-Platform Build System
  const buildSystem = await ctx.task(crossPlatformBuildTask, {
    projectName, targetPlatforms, outputDir
  });
  artifacts.push(...buildSystem.artifacts);

  // Phase 5: Platform Testing
  const platformTesting = await ctx.task(platformTestingTask, {
    projectName, targetPlatforms, hipifyConversion, outputDir
  });
  artifacts.push(...platformTesting.artifacts);

  // Phase 6: Performance Comparison
  const performanceComparison = await ctx.task(crossPlatformPerformanceTask, {
    projectName, targetPlatforms, platformTesting, outputDir
  });
  artifacts.push(...performanceComparison.artifacts);

  await ctx.breakpoint({
    question: `HIP porting complete for ${projectName}. Platforms passed: ${platformTesting.passedPlatforms.join(', ')}. Review?`,
    title: 'HIP Porting Complete',
    context: { runId: ctx.runId, platformTesting, performanceComparison }
  });

  return {
    success: platformTesting.allPlatformsPassed,
    projectName,
    portedCode: {
      hipSourceDir: hipifyConversion.outputDir,
      workarounds: apiDifferences.workarounds,
      manualChanges: apiDifferences.manualChanges
    },
    compatibilityReport: {
      cudaFeatures: codebaseAnalysis.cudaFeatures,
      unsupported: codebaseAnalysis.unsupportedFeatures,
      workarounds: apiDifferences.workaroundCount
    },
    buildSystem: {
      cmakeConfig: buildSystem.cmakePath,
      buildFlags: buildSystem.flags,
      platformDetection: buildSystem.detection
    },
    performance: performanceComparison.platformPerformance,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/hip-porting-cross-platform',
      timestamp: startTime,
      outputDir
    }
  };
}

export const codebaseAnalysisTask = defineTask('codebase-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Codebase Analysis - ${args.projectName}`,
  agent: {
    name: 'cross-platform-gpu-expert',
    skills: ['hip-rocm'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Analyze CUDA codebase for porting',
      context: args,
      instructions: [
        '1. Scan for CUDA API usage',
        '2. Identify CUDA libraries used',
        '3. Find device code features',
        '4. Identify unsupported features',
        '5. List inline PTX usage',
        '6. Find NVIDIA-specific code',
        '7. Analyze build system',
        '8. Document dependencies',
        '9. Estimate porting effort',
        '10. Create compatibility report'
      ],
      outputFormat: 'JSON with codebase analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['cudaFeatures', 'unsupportedFeatures', 'artifacts'],
      properties: {
        cudaFeatures: { type: 'array', items: { type: 'string' } },
        unsupportedFeatures: { type: 'array', items: { type: 'string' } },
        portingEffort: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'hip', 'analysis']
}));

export const hipifyConversionTask = defineTask('hipify-conversion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hipify Conversion - ${args.projectName}`,
  agent: {
    name: 'cross-platform-gpu-expert',
    skills: ['hip-rocm'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Convert CUDA to HIP using hipify',
      context: args,
      instructions: [
        '1. Run hipify-clang/hipify-perl',
        '2. Convert CUDA API calls',
        '3. Convert kernel syntax',
        '4. Handle include files',
        '5. Convert library calls',
        '6. Review conversion warnings',
        '7. Fix conversion errors',
        '8. Update file extensions',
        '9. Document changes made',
        '10. Verify syntax correctness'
      ],
      outputFormat: 'JSON with hipify conversion'
    },
    outputSchema: {
      type: 'object',
      required: ['outputDir', 'convertedFiles', 'artifacts'],
      properties: {
        outputDir: { type: 'string' },
        convertedFiles: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'hip', 'hipify']
}));

export const apiDifferencesTask = defineTask('api-differences', (args, taskCtx) => ({
  kind: 'agent',
  title: `API Differences - ${args.projectName}`,
  agent: {
    name: 'cross-platform-gpu-expert',
    skills: ['hip-rocm'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Handle API differences',
      context: args,
      instructions: [
        '1. Identify remaining differences',
        '2. Create workarounds',
        '3. Handle texture API changes',
        '4. Handle cooperative groups',
        '5. Handle warp primitives',
        '6. Create compatibility macros',
        '7. Implement fallbacks',
        '8. Document manual changes',
        '9. Test workarounds',
        '10. Create migration guide'
      ],
      outputFormat: 'JSON with API differences handling'
    },
    outputSchema: {
      type: 'object',
      required: ['workarounds', 'manualChanges', 'workaroundCount', 'artifacts'],
      properties: {
        workarounds: { type: 'array', items: { type: 'object' } },
        manualChanges: { type: 'array', items: { type: 'object' } },
        workaroundCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'hip', 'api']
}));

export const crossPlatformBuildTask = defineTask('cross-platform-build', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cross-Platform Build - ${args.projectName}`,
  agent: {
    name: 'cross-platform-gpu-expert',
    skills: ['hip-rocm'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Create cross-platform build system',
      context: args,
      instructions: [
        '1. Create CMake configuration',
        '2. Add platform detection',
        '3. Configure HIP compiler',
        '4. Set platform-specific flags',
        '5. Handle library linking',
        '6. Add build targets',
        '7. Configure GPU architectures',
        '8. Test build on both platforms',
        '9. Document build process',
        '10. Create CI/CD config'
      ],
      outputFormat: 'JSON with cross-platform build'
    },
    outputSchema: {
      type: 'object',
      required: ['cmakePath', 'flags', 'detection', 'artifacts'],
      properties: {
        cmakePath: { type: 'string' },
        flags: { type: 'object' },
        detection: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'hip', 'build']
}));

export const platformTestingTask = defineTask('platform-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Platform Testing - ${args.projectName}`,
  agent: {
    name: 'cross-platform-gpu-expert',
    skills: ['hip-rocm'],
    prompt: {
      role: 'GPU Test Engineer',
      task: 'Test on multiple platforms',
      context: args,
      instructions: [
        '1. Build on NVIDIA hardware',
        '2. Build on AMD hardware',
        '3. Run correctness tests',
        '4. Compare numerical results',
        '5. Test edge cases',
        '6. Document platform issues',
        '7. Test all features',
        '8. Verify memory management',
        '9. Create test report',
        '10. Document compatibility'
      ],
      outputFormat: 'JSON with platform testing'
    },
    outputSchema: {
      type: 'object',
      required: ['allPlatformsPassed', 'passedPlatforms', 'artifacts'],
      properties: {
        allPlatformsPassed: { type: 'boolean' },
        passedPlatforms: { type: 'array', items: { type: 'string' } },
        platformIssues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'hip', 'testing']
}));

export const crossPlatformPerformanceTask = defineTask('cross-platform-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Comparison - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['gpu-benchmarking', 'hip-rocm'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Compare performance across platforms',
      context: args,
      instructions: [
        '1. Benchmark on NVIDIA GPU',
        '2. Benchmark on AMD GPU',
        '3. Compare throughput',
        '4. Compare latency',
        '5. Profile memory bandwidth',
        '6. Identify platform differences',
        '7. Optimize for each platform',
        '8. Create comparison report',
        '9. Document best practices',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON with performance comparison'
    },
    outputSchema: {
      type: 'object',
      required: ['platformPerformance', 'comparison', 'artifacts'],
      properties: {
        platformPerformance: { type: 'object' },
        comparison: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'hip', 'performance']
}));
