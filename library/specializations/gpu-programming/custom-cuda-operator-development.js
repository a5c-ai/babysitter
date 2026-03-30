/**
 * @process specializations/gpu-programming/custom-cuda-operator-development
 * @description Custom CUDA Operator Development for Deep Learning - Process for developing custom CUDA kernels
 * integrated with deep learning frameworks (PyTorch, TensorFlow) for specialized operations.
 * @inputs { operatorName: string, framework: string, operation: string, supportBackward?: boolean, outputDir?: string }
 * @outputs { success: boolean, operatorFiles: object, integrationCode: object, benchmarks: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/custom-cuda-operator-development', {
 *   operatorName: 'fused_attention',
 *   framework: 'pytorch',
 *   operation: 'scaled_dot_product_attention',
 *   supportBackward: true
 * });
 *
 * @references
 * - PyTorch CUDA Extensions: https://pytorch.org/tutorials/advanced/cpp_extension.html
 * - TensorFlow Custom Ops: https://www.tensorflow.org/guide/create_op
 * - Custom Operator Best Practices: https://pytorch.org/docs/stable/notes/extending.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    operatorName,
    framework,
    operation,
    supportBackward = true,
    outputDir = 'custom-op-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Custom CUDA Operator Development: ${operatorName}`);
  ctx.log('info', `Framework: ${framework}, Operation: ${operation}, Backward: ${supportBackward}`);

  // Phase 1: Operator Specification
  const operatorSpec = await ctx.task(operatorSpecificationTask, {
    operatorName, framework, operation, supportBackward, outputDir
  });
  artifacts.push(...operatorSpec.artifacts);

  // Phase 2: Forward Kernel Implementation
  const forwardKernel = await ctx.task(forwardKernelTask, {
    operatorName, operatorSpec, outputDir
  });
  artifacts.push(...forwardKernel.artifacts);

  // Phase 3: Backward Kernel Implementation
  let backwardKernel = null;
  if (supportBackward) {
    backwardKernel = await ctx.task(backwardKernelTask, {
      operatorName, operatorSpec, forwardKernel, outputDir
    });
    artifacts.push(...backwardKernel.artifacts);
  }

  // Phase 4: Framework Integration
  const frameworkIntegration = await ctx.task(frameworkIntegrationTask, {
    operatorName, framework, forwardKernel, backwardKernel, outputDir
  });
  artifacts.push(...frameworkIntegration.artifacts);

  // Phase 5: Gradient Verification
  let gradientVerification = null;
  if (supportBackward) {
    gradientVerification = await ctx.task(gradientVerificationTask, {
      operatorName, framework, frameworkIntegration, outputDir
    });
    artifacts.push(...gradientVerification.artifacts);
  }

  // Phase 6: Performance Benchmarking
  const benchmarking = await ctx.task(operatorBenchmarkingTask, {
    operatorName, framework, frameworkIntegration, outputDir
  });
  artifacts.push(...benchmarking.artifacts);

  await ctx.breakpoint({
    question: `Custom operator ${operatorName} complete for ${framework}. Speedup vs native: ${benchmarking.speedup}x. Review?`,
    title: 'Custom Operator Complete',
    context: { runId: ctx.runId, benchmarking, gradientVerification }
  });

  return {
    success: benchmarking.speedup >= 1.0 && (!supportBackward || gradientVerification.passed),
    operatorName,
    operatorFiles: {
      forwardKernel: forwardKernel.kernelPath,
      backwardKernel: backwardKernel?.kernelPath,
      header: forwardKernel.headerPath
    },
    integrationCode: {
      extension: frameworkIntegration.extensionPath,
      pythonBinding: frameworkIntegration.pythonPath,
      setupScript: frameworkIntegration.setupPath
    },
    benchmarks: {
      speedup: benchmarking.speedup,
      forwardTime: benchmarking.forwardTime,
      backwardTime: benchmarking.backwardTime,
      memoryUsage: benchmarking.memoryUsage
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/custom-cuda-operator-development',
      timestamp: startTime,
      outputDir
    }
  };
}

export const operatorSpecificationTask = defineTask('operator-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Operator Specification - ${args.operatorName}`,
  agent: {
    name: 'ml-inference-optimizer',
    skills: ['tensorrt-builder', 'cuda-toolkit'],
    prompt: {
      role: 'ML Engineer',
      task: 'Specify custom operator interface',
      context: args,
      instructions: [
        '1. Define input tensors and shapes',
        '2. Define output tensors',
        '3. Specify data types supported',
        '4. Define gradient requirements',
        '5. Document memory layout',
        '6. Specify threading model',
        '7. Define error conditions',
        '8. Document edge cases',
        '9. Create operator schema',
        '10. Document usage examples'
      ],
      outputFormat: 'JSON with operator specification'
    },
    outputSchema: {
      type: 'object',
      required: ['inputSpec', 'outputSpec', 'artifacts'],
      properties: {
        inputSpec: { type: 'array', items: { type: 'object' } },
        outputSpec: { type: 'array', items: { type: 'object' } },
        gradientSpec: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'custom-op', 'specification']
}));

export const forwardKernelTask = defineTask('forward-kernel', (args, taskCtx) => ({
  kind: 'agent',
  title: `Forward Kernel - ${args.operatorName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit', 'warp-primitives'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement forward CUDA kernel',
      context: args,
      instructions: [
        '1. Design kernel architecture',
        '2. Implement thread indexing',
        '3. Handle tensor strides',
        '4. Optimize memory access',
        '5. Use shared memory if needed',
        '6. Handle batch dimension',
        '7. Support multiple data types',
        '8. Add error checking',
        '9. Test correctness',
        '10. Document kernel'
      ],
      outputFormat: 'JSON with forward kernel'
    },
    outputSchema: {
      type: 'object',
      required: ['kernelPath', 'headerPath', 'artifacts'],
      properties: {
        kernelPath: { type: 'string' },
        headerPath: { type: 'string' },
        launchConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'custom-op', 'forward']
}));

export const backwardKernelTask = defineTask('backward-kernel', (args, taskCtx) => ({
  kind: 'agent',
  title: `Backward Kernel - ${args.operatorName}`,
  agent: {
    name: 'cuda-kernel-expert',
    skills: ['cuda-toolkit', 'warp-primitives'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement backward CUDA kernel',
      context: args,
      instructions: [
        '1. Derive gradient formulas',
        '2. Implement input gradients',
        '3. Handle gradient accumulation',
        '4. Optimize backward pass',
        '5. Share computation with forward',
        '6. Handle in-place operations',
        '7. Support gradient checkpointing',
        '8. Test gradient computation',
        '9. Document gradient flow',
        '10. Verify numerical stability'
      ],
      outputFormat: 'JSON with backward kernel'
    },
    outputSchema: {
      type: 'object',
      required: ['kernelPath', 'gradientFormulas', 'artifacts'],
      properties: {
        kernelPath: { type: 'string' },
        gradientFormulas: { type: 'array', items: { type: 'string' } },
        sharedWithForward: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'custom-op', 'backward']
}));

export const frameworkIntegrationTask = defineTask('framework-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Framework Integration - ${args.operatorName}`,
  agent: {
    name: 'ml-inference-optimizer',
    skills: ['tensorrt-builder', 'cuda-toolkit'],
    prompt: {
      role: 'ML Engineer',
      task: 'Integrate with deep learning framework',
      context: args,
      instructions: [
        '1. Create C++/CUDA extension',
        '2. Implement Python bindings',
        '3. Create autograd Function',
        '4. Register with framework',
        '5. Handle device placement',
        '6. Support mixed precision',
        '7. Create setup.py/CMakeLists',
        '8. Add JIT compilation option',
        '9. Document integration',
        '10. Test in framework'
      ],
      outputFormat: 'JSON with framework integration'
    },
    outputSchema: {
      type: 'object',
      required: ['extensionPath', 'pythonPath', 'setupPath', 'artifacts'],
      properties: {
        extensionPath: { type: 'string' },
        pythonPath: { type: 'string' },
        setupPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'custom-op', 'integration']
}));

export const gradientVerificationTask = defineTask('gradient-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Gradient Verification - ${args.operatorName}`,
  agent: {
    name: 'ml-inference-optimizer',
    skills: ['tensorrt-builder', 'cuda-toolkit'],
    prompt: {
      role: 'ML Engineer',
      task: 'Verify gradient correctness',
      context: args,
      instructions: [
        '1. Implement finite difference check',
        '2. Use gradcheck utility',
        '3. Test various input shapes',
        '4. Test edge cases',
        '5. Check numerical precision',
        '6. Test with random inputs',
        '7. Verify gradient accumulation',
        '8. Test double backward',
        '9. Document test results',
        '10. Create regression tests'
      ],
      outputFormat: 'JSON with gradient verification'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'testResults', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        testResults: { type: 'array', items: { type: 'object' } },
        maxError: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'custom-op', 'gradients']
}));

export const operatorBenchmarkingTask = defineTask('operator-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benchmarking - ${args.operatorName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['gpu-benchmarking', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Benchmark custom operator',
      context: args,
      instructions: [
        '1. Benchmark forward pass',
        '2. Benchmark backward pass',
        '3. Compare to native ops',
        '4. Measure memory usage',
        '5. Test various batch sizes',
        '6. Profile kernel execution',
        '7. Identify bottlenecks',
        '8. Compare to alternatives',
        '9. Create performance report',
        '10. Provide optimization tips'
      ],
      outputFormat: 'JSON with benchmarking results'
    },
    outputSchema: {
      type: 'object',
      required: ['speedup', 'forwardTime', 'backwardTime', 'memoryUsage', 'artifacts'],
      properties: {
        speedup: { type: 'number' },
        forwardTime: { type: 'number' },
        backwardTime: { type: 'number' },
        memoryUsage: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'custom-op', 'benchmarking']
}));
