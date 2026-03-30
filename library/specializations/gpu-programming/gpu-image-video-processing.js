/**
 * @process specializations/gpu-programming/gpu-image-video-processing
 * @description GPU-Accelerated Image and Video Processing - Workflow for implementing GPU-accelerated
 * image and video processing pipelines for real-time applications.
 * @inputs { projectName: string, operations: array, realTime?: boolean, videoCodec?: string, outputDir?: string }
 * @outputs { success: boolean, processingPipeline: object, kernelLibrary: array, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/gpu-programming/gpu-image-video-processing', {
 *   projectName: 'video_effects',
 *   operations: ['resize', 'color_correction', 'denoise'],
 *   realTime: true,
 *   videoCodec: 'h264'
 * });
 *
 * @references
 * - NVIDIA Video Codec SDK: https://developer.nvidia.com/nvidia-video-codec-sdk
 * - NPP Library: https://docs.nvidia.com/cuda/npp/
 * - NVENC/NVDEC: https://developer.nvidia.com/video-encode-and-decode-gpu-support-matrix
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    operations,
    realTime = true,
    videoCodec = 'h264',
    outputDir = 'image-video-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting GPU Image/Video Processing: ${projectName}`);
  ctx.log('info', `Operations: ${operations.join(', ')}, Real-time: ${realTime}`);

  // Phase 1: Pipeline Design
  const pipelineDesign = await ctx.task(processingPipelineDesignTask, {
    projectName, operations, realTime, outputDir
  });
  artifacts.push(...pipelineDesign.artifacts);

  // Phase 2: Image Processing Kernels
  const imageKernels = await ctx.task(imageProcessingKernelsTask, {
    projectName, operations, pipelineDesign, outputDir
  });
  artifacts.push(...imageKernels.artifacts);

  // Phase 3: Video Codec Integration
  const codecIntegration = await ctx.task(videoCodecIntegrationTask, {
    projectName, videoCodec, outputDir
  });
  artifacts.push(...codecIntegration.artifacts);

  // Phase 4: Tiling and Boundaries
  const tilingBoundaries = await ctx.task(imageTilingTask, {
    projectName, operations, imageKernels, outputDir
  });
  artifacts.push(...tilingBoundaries.artifacts);

  // Phase 5: Pipeline Optimization
  const pipelineOptimization = await ctx.task(pipelineOptimizationTask, {
    projectName, pipelineDesign, imageKernels, realTime, outputDir
  });
  artifacts.push(...pipelineOptimization.artifacts);

  // Phase 6: Performance Benchmarking
  const benchmarking = await ctx.task(imageVideoBenchmarkingTask, {
    projectName, pipelineOptimization, realTime, outputDir
  });
  artifacts.push(...benchmarking.artifacts);

  await ctx.breakpoint({
    question: `Image/video processing complete for ${projectName}. Frame rate: ${benchmarking.fps} FPS. Latency: ${benchmarking.latency}ms. Review?`,
    title: 'Image/Video Processing Complete',
    context: { runId: ctx.runId, benchmarking }
  });

  return {
    success: !realTime || benchmarking.fps >= 30,
    projectName,
    processingPipeline: {
      stages: pipelineDesign.stages,
      dataFlow: pipelineDesign.dataFlow,
      optimizations: pipelineOptimization.optimizations
    },
    kernelLibrary: imageKernels.kernels,
    performanceMetrics: {
      fps: benchmarking.fps,
      latency: benchmarking.latency,
      throughput: benchmarking.throughput,
      gpuUtilization: benchmarking.gpuUtilization
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: {
      processId: 'specializations/gpu-programming/gpu-image-video-processing',
      timestamp: startTime,
      outputDir
    }
  };
}

export const processingPipelineDesignTask = defineTask('processing-pipeline-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pipeline Design - ${args.projectName}`,
  agent: {
    name: 'graphics-compute-expert',
    skills: ['npp-library', 'video-codec-sdk'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Design image/video processing pipeline',
      context: args,
      instructions: [
        '1. Define pipeline stages',
        '2. Design data flow',
        '3. Plan buffer management',
        '4. Design for streaming',
        '5. Plan GPU memory usage',
        '6. Handle frame queuing',
        '7. Design for latency',
        '8. Plan kernel fusion',
        '9. Document pipeline',
        '10. Create architecture diagram'
      ],
      outputFormat: 'JSON with pipeline design'
    },
    outputSchema: {
      type: 'object',
      required: ['stages', 'dataFlow', 'artifacts'],
      properties: {
        stages: { type: 'array', items: { type: 'object' } },
        dataFlow: { type: 'object' },
        bufferStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'image-video', 'pipeline']
}));

export const imageProcessingKernelsTask = defineTask('image-processing-kernels', (args, taskCtx) => ({
  kind: 'agent',
  title: `Processing Kernels - ${args.projectName}`,
  agent: {
    name: 'graphics-compute-expert',
    skills: ['npp-library', 'video-codec-sdk'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement image processing kernels',
      context: args,
      instructions: [
        '1. Implement resize kernels',
        '2. Implement convolution kernels',
        '3. Implement color conversion',
        '4. Implement histogram ops',
        '5. Implement morphological ops',
        '6. Use texture memory',
        '7. Optimize for cache',
        '8. Handle pixel formats',
        '9. Test kernel correctness',
        '10. Document kernels'
      ],
      outputFormat: 'JSON with processing kernels'
    },
    outputSchema: {
      type: 'object',
      required: ['kernels', 'kernelPaths', 'artifacts'],
      properties: {
        kernels: { type: 'array', items: { type: 'object' } },
        kernelPaths: { type: 'array', items: { type: 'string' } },
        pixelFormats: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'image-video', 'kernels']
}));

export const videoCodecIntegrationTask = defineTask('video-codec-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Codec Integration - ${args.projectName}`,
  agent: {
    name: 'graphics-compute-expert',
    skills: ['npp-library', 'video-codec-sdk'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Integrate video codec acceleration',
      context: args,
      instructions: [
        '1. Initialize NVDEC decoder',
        '2. Initialize NVENC encoder',
        '3. Configure codec settings',
        '4. Handle decoded frames',
        '5. Handle encoding pipeline',
        '6. Manage codec surfaces',
        '7. Handle B-frames',
        '8. Configure bitrate control',
        '9. Test codec integration',
        '10. Document codec usage'
      ],
      outputFormat: 'JSON with codec integration'
    },
    outputSchema: {
      type: 'object',
      required: ['decoderCode', 'encoderCode', 'artifacts'],
      properties: {
        decoderCode: { type: 'string' },
        encoderCode: { type: 'string' },
        supportedCodecs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'image-video', 'codec']
}));

export const imageTilingTask = defineTask('image-tiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tiling and Boundaries - ${args.projectName}`,
  agent: {
    name: 'graphics-compute-expert',
    skills: ['npp-library', 'video-codec-sdk'],
    prompt: {
      role: 'GPU Software Engineer',
      task: 'Implement image tiling',
      context: args,
      instructions: [
        '1. Design tile sizes',
        '2. Handle tile boundaries',
        '3. Implement halo loading',
        '4. Handle image edges',
        '5. Implement padding modes',
        '6. Optimize tile overlap',
        '7. Handle odd dimensions',
        '8. Test boundary correctness',
        '9. Profile tiling overhead',
        '10. Document tiling strategy'
      ],
      outputFormat: 'JSON with tiling implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['tilingStrategy', 'boundaryHandling', 'artifacts'],
      properties: {
        tilingStrategy: { type: 'object' },
        boundaryHandling: { type: 'object' },
        paddingModes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'image-video', 'tiling']
}));

export const pipelineOptimizationTask = defineTask('pipeline-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pipeline Optimization - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['gpu-benchmarking', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Optimize processing pipeline',
      context: args,
      instructions: [
        '1. Fuse adjacent kernels',
        '2. Overlap transfers',
        '3. Use async processing',
        '4. Minimize memory copies',
        '5. Use pinned memory',
        '6. Optimize for latency',
        '7. Balance stages',
        '8. Profile bottlenecks',
        '9. Apply optimizations',
        '10. Document improvements'
      ],
      outputFormat: 'JSON with pipeline optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'latencyReduction', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        latencyReduction: { type: 'number' },
        fusedKernels: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'image-video', 'optimization']
}));

export const imageVideoBenchmarkingTask = defineTask('image-video-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benchmarking - ${args.projectName}`,
  agent: {
    name: 'gpu-performance-engineer',
    skills: ['gpu-benchmarking', 'nsight-profiler'],
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Benchmark image/video processing',
      context: args,
      instructions: [
        '1. Measure frame rate',
        '2. Measure latency',
        '3. Profile GPU utilization',
        '4. Test various resolutions',
        '5. Measure throughput',
        '6. Profile memory usage',
        '7. Test real-time capability',
        '8. Compare to CPU baseline',
        '9. Create benchmark report',
        '10. Document results'
      ],
      outputFormat: 'JSON with benchmarking results'
    },
    outputSchema: {
      type: 'object',
      required: ['fps', 'latency', 'throughput', 'gpuUtilization', 'artifacts'],
      properties: {
        fps: { type: 'number' },
        latency: { type: 'number' },
        throughput: { type: 'number' },
        gpuUtilization: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['gpu-programming', 'image-video', 'benchmarking']
}));
