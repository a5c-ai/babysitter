/**
 * @process specializations/gpu-programming/compute-shader-development
 * @description Compute Shader Development - Process for developing compute shaders using graphics APIs
 * (Vulkan, DirectX, Metal). Covers shader authoring, resource binding, and dispatch configuration.
 * @inputs { shaderName: string, graphicsApi: string, operation: string, workgroupSize?: array, outputDir?: string }
 * @outputs { success: boolean, shaderFiles: object, pipelineCode: object, bindingSpec: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/compute-shader-development', {
 *   shaderName: 'particle_simulation',
 *   graphicsApi: 'vulkan',
 *   operation: 'physics_update',
 *   workgroupSize: [256, 1, 1]
 * });
 *
 * @references
 * - Vulkan Compute Shaders: https://vulkan-tutorial.com/Compute_Shader
 * - DirectCompute: https://learn.microsoft.com/en-us/windows/win32/direct3d11/direct3d-11-advanced-stages-compute-shader
 * - Metal Compute: https://developer.apple.com/metal/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    shaderName,
    graphicsApi,
    operation,
    workgroupSize = [256, 1, 1],
    outputDir = 'compute-shader-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Compute Shader Development: ${shaderName}`);
  ctx.log('info', `API: ${graphicsApi}, Operation: ${operation}, Workgroup: ${workgroupSize.join('x')}`);

  // Phase 1: Shader Design
  const shaderDesign = await ctx.task(shaderDesignTask, {
    shaderName, graphicsApi, operation, workgroupSize, outputDir
  });
  artifacts.push(...shaderDesign.artifacts);

  // Phase 2: Shader Implementation
  const shaderImpl = await ctx.task(computeShaderImplementationTask, {
    shaderName, graphicsApi, shaderDesign, workgroupSize, outputDir
  });
  artifacts.push(...shaderImpl.artifacts);

  // Phase 3: Resource Binding
  const resourceBinding = await ctx.task(resourceBindingTask, {
    shaderName, graphicsApi, shaderDesign, outputDir
  });
  artifacts.push(...resourceBinding.artifacts);

  // Phase 4: Pipeline Creation
  const pipelineCreation = await ctx.task(computePipelineTask, {
    shaderName, graphicsApi, shaderImpl, resourceBinding, outputDir
  });
  artifacts.push(...pipelineCreation.artifacts);

  // Phase 5: Dispatch Logic
  const dispatchLogic = await ctx.task(dispatchLogicTask, {
    shaderName, graphicsApi, workgroupSize, pipelineCreation, outputDir
  });
  artifacts.push(...dispatchLogic.artifacts);

  // Phase 6: Validation
  const validation = await ctx.task(computeShaderValidationTask, {
    shaderName, graphicsApi, shaderImpl, dispatchLogic, outputDir
  });
  artifacts.push(...validation.artifacts);

  await ctx.breakpoint({
    question: `Compute shader ${shaderName} development complete for ${graphicsApi}. Validation: ${validation.passed ? 'PASSED' : 'FAILED'}. Review?`,
    title: 'Compute Shader Development Complete',
    context: { runId: ctx.runId, validation }
  });

  return {
    success: validation.passed,
    shaderName,
    graphicsApi,
    shaderFiles: {
      shaderSource: shaderImpl.shaderPath,
      spirv: shaderImpl.spirvPath,
      header: shaderImpl.headerPath
    },
    pipelineCode: {
      pipelineSetup: pipelineCreation.pipelinePath,
      descriptorSetup: resourceBinding.descriptorPath
    },
    bindingSpec: {
      bindings: resourceBinding.bindings,
      descriptorSets: resourceBinding.descriptorSets
    },
    dispatchConfig: {
      workgroupSize,
      dispatchCode: dispatchLogic.dispatchCode
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/compute-shader-development',
      timestamp: startTime,
      outputDir
    }
  };
}

export const shaderDesignTask = defineTask('shader-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Shader Design - ${args.shaderName}`,
  agent: {
    name: 'graphics-compute-expert',
    skills: ['vulkan-compute'],
    prompt: {
      role: 'Graphics Engineer',
      task: 'Design compute shader architecture',
      context: args,
      instructions: [
        '1. Define shader inputs and outputs',
        '2. Design buffer layouts',
        '3. Plan workgroup organization',
        '4. Identify shared memory needs',
        '5. Design push constants usage',
        '6. Plan synchronization needs',
        '7. Define uniform buffers',
        '8. Design image/sampler usage',
        '9. Document shader interface',
        '10. Create design diagram'
      ],
      outputFormat: 'JSON with shader design'
    },
    outputSchema: {
      type: 'object',
      required: ['interface', 'bufferLayouts', 'artifacts'],
      properties: {
        interface: { type: 'object' },
        bufferLayouts: { type: 'array', items: { type: 'object' } },
        sharedMemorySize: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'compute-shader', 'design']
}));

export const computeShaderImplementationTask = defineTask('compute-shader-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Shader Implementation - ${args.shaderName}`,
  agent: {
    name: 'graphics-compute-expert',
    skills: ['vulkan-compute'],
    prompt: {
      role: 'Graphics Engineer',
      task: 'Implement compute shader',
      context: args,
      instructions: [
        '1. Write shader in GLSL/HLSL/MSL',
        '2. Implement workgroup indexing',
        '3. Add shared memory operations',
        '4. Implement barriers if needed',
        '5. Use atomic operations appropriately',
        '6. Optimize memory access patterns',
        '7. Add subgroup operations if supported',
        '8. Compile to SPIR-V if needed',
        '9. Validate shader compilation',
        '10. Document shader code'
      ],
      outputFormat: 'JSON with shader implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['shaderPath', 'spirvPath', 'artifacts'],
      properties: {
        shaderPath: { type: 'string' },
        spirvPath: { type: 'string' },
        headerPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'compute-shader', 'implementation']
}));

export const resourceBindingTask = defineTask('resource-binding', (args, taskCtx) => ({
  kind: 'agent',
  title: `Resource Binding - ${args.shaderName}`,
  agent: {
    name: 'graphics-compute-expert',
    skills: ['vulkan-compute'],
    prompt: {
      role: 'Graphics Engineer',
      task: 'Configure resource bindings',
      context: args,
      instructions: [
        '1. Create descriptor set layouts',
        '2. Define binding points',
        '3. Configure storage buffers',
        '4. Set up uniform buffers',
        '5. Configure image bindings',
        '6. Set up samplers if needed',
        '7. Create descriptor pools',
        '8. Allocate descriptor sets',
        '9. Update descriptor writes',
        '10. Document binding layout'
      ],
      outputFormat: 'JSON with resource binding details'
    },
    outputSchema: {
      type: 'object',
      required: ['bindings', 'descriptorSets', 'descriptorPath', 'artifacts'],
      properties: {
        bindings: { type: 'array', items: { type: 'object' } },
        descriptorSets: { type: 'array', items: { type: 'object' } },
        descriptorPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'compute-shader', 'bindings']
}));

export const computePipelineTask = defineTask('compute-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pipeline Creation - ${args.shaderName}`,
  agent: {
    name: 'graphics-compute-expert',
    skills: ['vulkan-compute'],
    prompt: {
      role: 'Graphics Engineer',
      task: 'Create compute pipeline',
      context: args,
      instructions: [
        '1. Create shader module from SPIR-V',
        '2. Define pipeline layout',
        '3. Configure push constants',
        '4. Create compute pipeline',
        '5. Handle specialization constants',
        '6. Set up pipeline cache',
        '7. Handle pipeline creation errors',
        '8. Implement pipeline cleanup',
        '9. Document pipeline setup',
        '10. Test pipeline creation'
      ],
      outputFormat: 'JSON with pipeline creation details'
    },
    outputSchema: {
      type: 'object',
      required: ['pipelinePath', 'pipelineLayout', 'artifacts'],
      properties: {
        pipelinePath: { type: 'string' },
        pipelineLayout: { type: 'object' },
        pushConstants: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'compute-shader', 'pipeline']
}));

export const dispatchLogicTask = defineTask('dispatch-logic', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dispatch Logic - ${args.shaderName}`,
  agent: {
    name: 'graphics-compute-expert',
    skills: ['vulkan-compute'],
    prompt: {
      role: 'Graphics Engineer',
      task: 'Implement dispatch logic',
      context: args,
      instructions: [
        '1. Calculate dispatch dimensions',
        '2. Handle workgroup size limits',
        '3. Implement indirect dispatch if needed',
        '4. Record compute commands',
        '5. Add pipeline barriers',
        '6. Handle memory barriers',
        '7. Implement synchronization',
        '8. Profile dispatch efficiency',
        '9. Handle edge cases',
        '10. Document dispatch usage'
      ],
      outputFormat: 'JSON with dispatch logic'
    },
    outputSchema: {
      type: 'object',
      required: ['dispatchCode', 'barrierCode', 'artifacts'],
      properties: {
        dispatchCode: { type: 'string' },
        barrierCode: { type: 'string' },
        indirectSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'compute-shader', 'dispatch']
}));

export const computeShaderValidationTask = defineTask('compute-shader-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validation - ${args.shaderName}`,
  agent: {
    name: 'graphics-compute-expert',
    skills: ['vulkan-compute'],
    prompt: {
      role: 'GPU Test Engineer',
      task: 'Validate compute shader',
      context: args,
      instructions: [
        '1. Validate shader compilation',
        '2. Test resource binding',
        '3. Verify compute results',
        '4. Test edge cases',
        '5. Validate synchronization',
        '6. Check memory barriers',
        '7. Profile performance',
        '8. Test error handling',
        '9. Validate cleanup',
        '10. Document test results'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'testResults', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        testResults: { type: 'array', items: { type: 'object' } },
        performance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'compute-shader', 'validation']
}));
