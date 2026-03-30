/**
 * @process specializations/gpu-programming/opencl-application-development
 * @description OpenCL Application Development - Process for developing portable GPU applications using OpenCL.
 * Covers platform/device selection, context creation, kernel compilation, and cross-vendor deployment.
 * @inputs { appName: string, kernelOperations: array, targetVendors?: array, portabilityLevel?: string, outputDir?: string }
 * @outputs { success: boolean, applicationFiles: object, kernelFiles: array, platformSupport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/opencl-application-development', {
 *   appName: 'image_processor',
 *   kernelOperations: ['convolution', 'histogram'],
 *   targetVendors: ['NVIDIA', 'AMD', 'Intel'],
 *   portabilityLevel: 'high'
 * });
 *
 * @references
 * - OpenCL Specification: https://registry.khronos.org/OpenCL/specs/3.0-unified/html/OpenCL_API.html
 * - OpenCL C Language Specification: https://registry.khronos.org/OpenCL/specs/3.0-unified/html/OpenCL_C.html
 * - OpenCL Reference Pages: https://man.opencl.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    kernelOperations,
    targetVendors = ['NVIDIA', 'AMD', 'Intel'],
    portabilityLevel = 'high',
    openclVersion = '2.0',
    outputDir = 'opencl-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting OpenCL Application Development: ${appName}`);
  ctx.log('info', `Target vendors: ${targetVendors.join(', ')}, Portability: ${portabilityLevel}`);

  // Phase 1: Platform and Device Discovery
  const platformDiscovery = await ctx.task(platformDiscoveryTask, {
    appName, targetVendors, openclVersion, outputDir
  });
  artifacts.push(...platformDiscovery.artifacts);

  // Phase 2: Context and Queue Setup
  const contextSetup = await ctx.task(contextSetupTask, {
    appName, platformDiscovery, outputDir
  });
  artifacts.push(...contextSetup.artifacts);

  // Phase 3: Kernel Development
  const kernelDevelopment = await ctx.task(openclKernelDevelopmentTask, {
    appName, kernelOperations, portabilityLevel, openclVersion, outputDir
  });
  artifacts.push(...kernelDevelopment.artifacts);

  // Phase 4: Buffer Management
  const bufferManagement = await ctx.task(bufferManagementTask, {
    appName, kernelOperations, kernelDevelopment, outputDir
  });
  artifacts.push(...bufferManagement.artifacts);

  // Phase 5: Kernel Compilation
  const kernelCompilation = await ctx.task(kernelCompilationTask, {
    appName, kernelDevelopment, targetVendors, outputDir
  });
  artifacts.push(...kernelCompilation.artifacts);

  // Phase 6: Host Application
  const hostApplication = await ctx.task(openclHostApplicationTask, {
    appName, contextSetup, kernelCompilation, bufferManagement, outputDir
  });
  artifacts.push(...hostApplication.artifacts);

  // Phase 7: Cross-Platform Testing
  const crossPlatformTesting = await ctx.task(crossPlatformTestingTask, {
    appName, targetVendors, hostApplication, outputDir
  });
  artifacts.push(...crossPlatformTesting.artifacts);

  await ctx.breakpoint({
    question: `OpenCL application ${appName} development complete. Platform support: ${crossPlatformTesting.supportedPlatforms.join(', ')}. Review?`,
    title: 'OpenCL Development Complete',
    context: { runId: ctx.runId, crossPlatformTesting }
  });

  return {
    success: crossPlatformTesting.allPlatformsPassed,
    appName,
    applicationFiles: {
      main: hostApplication.mainPath,
      headers: hostApplication.headers,
      utilities: hostApplication.utilities
    },
    kernelFiles: kernelDevelopment.kernelFiles,
    platformSupport: {
      tested: crossPlatformTesting.supportedPlatforms,
      passed: crossPlatformTesting.passedPlatforms,
      issues: crossPlatformTesting.platformIssues
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/opencl-application-development',
      timestamp: startTime,
      outputDir
    }
  };
}

export const platformDiscoveryTask = defineTask('platform-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Platform Discovery - ${args.appName}`,
  agent: {
    name: 'cross-platform-gpu-expert',
    skills: ['opencl-runtime'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement OpenCL platform and device discovery',
      context: args,
      instructions: [
        '1. Query available OpenCL platforms',
        '2. Enumerate devices per platform',
        '3. Query device capabilities',
        '4. Implement device selection logic',
        '5. Check OpenCL version support',
        '6. Query memory sizes and limits',
        '7. Check extension support',
        '8. Create device capability report',
        '9. Implement fallback strategies',
        '10. Document platform requirements'
      ],
      outputFormat: 'JSON with platform discovery details'
    },
    outputSchema: {
      type: 'object',
      required: ['platforms', 'deviceSelection', 'artifacts'],
      properties: {
        platforms: { type: 'array', items: { type: 'object' } },
        deviceSelection: { type: 'object' },
        capabilities: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'opencl', 'platform']
}));

export const contextSetupTask = defineTask('context-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Context Setup - ${args.appName}`,
  agent: {
    name: 'cross-platform-gpu-expert',
    skills: ['opencl-runtime'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Create OpenCL context and command queues',
      context: args,
      instructions: [
        '1. Create OpenCL context for selected devices',
        '2. Set up error callback for context',
        '3. Create command queues with properties',
        '4. Enable profiling if needed',
        '5. Handle out-of-order execution option',
        '6. Implement context error handling',
        '7. Create resource cleanup functions',
        '8. Add multi-device context support',
        '9. Document context configuration',
        '10. Test context creation on targets'
      ],
      outputFormat: 'JSON with context setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['contextCode', 'queueCode', 'artifacts'],
      properties: {
        contextCode: { type: 'string' },
        queueCode: { type: 'string' },
        properties: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'opencl', 'context']
}));

export const openclKernelDevelopmentTask = defineTask('opencl-kernel-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kernel Development - ${args.appName}`,
  agent: {
    name: 'cross-platform-gpu-expert',
    skills: ['opencl-runtime'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Develop OpenCL kernels',
      context: args,
      instructions: [
        '1. Design kernel interfaces',
        '2. Implement kernels in OpenCL C',
        '3. Use appropriate address spaces',
        '4. Implement work-item indexing',
        '5. Use local memory for shared data',
        '6. Add synchronization barriers',
        '7. Ensure portability across vendors',
        '8. Use vector types appropriately',
        '9. Add kernel attributes',
        '10. Document kernel requirements'
      ],
      outputFormat: 'JSON with kernel development details'
    },
    outputSchema: {
      type: 'object',
      required: ['kernelFiles', 'kernelSignatures', 'artifacts'],
      properties: {
        kernelFiles: { type: 'array', items: { type: 'string' } },
        kernelSignatures: { type: 'array', items: { type: 'object' } },
        localMemoryUsage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'opencl', 'kernels']
}));

export const bufferManagementTask = defineTask('buffer-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Buffer Management - ${args.appName}`,
  agent: {
    name: 'cross-platform-gpu-expert',
    skills: ['opencl-runtime'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement OpenCL buffer management',
      context: args,
      instructions: [
        '1. Create buffer allocation functions',
        '2. Implement memory object creation',
        '3. Set appropriate memory flags',
        '4. Implement data transfer functions',
        '5. Use sub-buffers where appropriate',
        '6. Implement image objects if needed',
        '7. Handle buffer mapping',
        '8. Add zero-copy optimizations',
        '9. Implement buffer pooling',
        '10. Document memory requirements'
      ],
      outputFormat: 'JSON with buffer management details'
    },
    outputSchema: {
      type: 'object',
      required: ['bufferFunctions', 'memoryFlags', 'artifacts'],
      properties: {
        bufferFunctions: { type: 'array', items: { type: 'string' } },
        memoryFlags: { type: 'object' },
        zeroCopySupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'opencl', 'memory']
}));

export const kernelCompilationTask = defineTask('kernel-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kernel Compilation - ${args.appName}`,
  agent: {
    name: 'cross-platform-gpu-expert',
    skills: ['opencl-runtime'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement OpenCL kernel compilation',
      context: args,
      instructions: [
        '1. Create program from source',
        '2. Set compilation options',
        '3. Handle vendor-specific options',
        '4. Implement build error handling',
        '5. Extract build logs',
        '6. Create kernel objects',
        '7. Implement program caching',
        '8. Support binary loading',
        '9. Add JIT compilation options',
        '10. Document compilation requirements'
      ],
      outputFormat: 'JSON with compilation details'
    },
    outputSchema: {
      type: 'object',
      required: ['compilationCode', 'buildOptions', 'artifacts'],
      properties: {
        compilationCode: { type: 'string' },
        buildOptions: { type: 'object' },
        binaryCaching: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'opencl', 'compilation']
}));

export const openclHostApplicationTask = defineTask('opencl-host-application', (args, taskCtx) => ({
  kind: 'agent',
  title: `Host Application - ${args.appName}`,
  agent: {
    name: 'cross-platform-gpu-expert',
    skills: ['opencl-runtime'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Create OpenCL host application',
      context: args,
      instructions: [
        '1. Create main application structure',
        '2. Integrate platform/device setup',
        '3. Add kernel execution wrapper',
        '4. Implement argument setting',
        '5. Configure NDRange',
        '6. Add event-based synchronization',
        '7. Implement profiling support',
        '8. Create utility functions',
        '9. Add error handling throughout',
        '10. Document application usage'
      ],
      outputFormat: 'JSON with host application details'
    },
    outputSchema: {
      type: 'object',
      required: ['mainPath', 'headers', 'artifacts'],
      properties: {
        mainPath: { type: 'string' },
        headers: { type: 'array', items: { type: 'string' } },
        utilities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'opencl', 'application']
}));

export const crossPlatformTestingTask = defineTask('cross-platform-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cross-Platform Testing - ${args.appName}`,
  agent: {
    name: 'cross-platform-gpu-expert',
    skills: ['opencl-runtime'],
    prompt: {
      role: 'GPU Test Engineer',
      task: 'Test OpenCL application across platforms',
      context: args,
      instructions: [
        '1. Test on NVIDIA GPUs',
        '2. Test on AMD GPUs',
        '3. Test on Intel GPUs/CPUs',
        '4. Verify numerical correctness',
        '5. Compare performance across platforms',
        '6. Document platform-specific issues',
        '7. Test memory limits',
        '8. Test error handling',
        '9. Create compatibility matrix',
        '10. Document workarounds'
      ],
      outputFormat: 'JSON with testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['allPlatformsPassed', 'supportedPlatforms', 'passedPlatforms', 'artifacts'],
      properties: {
        allPlatformsPassed: { type: 'boolean' },
        supportedPlatforms: { type: 'array', items: { type: 'string' } },
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
  labels: ['gpu-programming', 'opencl', 'testing']
}));
