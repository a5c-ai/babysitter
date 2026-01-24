/**
 * @process specializations/robotics-simulation/simulation-performance-optimization
 * @description Simulation Performance Optimization - Optimize simulation speed and scalability for large-scale
 * testing including profiling, collision geometry optimization, LOD rendering, parallelization, and GPU
 * acceleration.
 * @inputs { simulationPath: string, targetRTF?: number, parallelInstances?: number, outputDir?: string }
 * @outputs { success: boolean, achievedRTF: number, optimizations: array, benchmarks: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/simulation-performance-optimization', {
 *   simulationPath: 'worlds/warehouse.world',
 *   targetRTF: 1.0,
 *   parallelInstances: 10
 * });
 *
 * @references
 * - Gazebo Performance Tips: https://gazebosim.org/docs/latest/performance_tips
 * - Isaac Sim Performance: https://docs.omniverse.nvidia.com/isaacsim/latest/manual_isaac_sim_performance.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    simulationPath,
    targetRTF = 1.0,
    parallelInstances = 1,
    gpuAcceleration = true,
    headlessMode = true,
    outputDir = 'simulation-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const issues = [];

  ctx.log('info', `Starting Simulation Performance Optimization`);
  ctx.log('info', `Target RTF: ${targetRTF}, Parallel Instances: ${parallelInstances}`);

  // ============================================================================
  // PHASE 1: PERFORMANCE PROFILING
  // ============================================================================

  ctx.log('info', 'Phase 1: Profile Simulation Bottlenecks');

  const profiling = await ctx.task(performanceProfilingTask, {
    simulationPath,
    outputDir
  });

  artifacts.push(...profiling.artifacts);

  // ============================================================================
  // PHASE 2: COLLISION GEOMETRY OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Collision Geometry Optimization');

  const collisionOptimization = await ctx.task(collisionGeometryOptimizationTask, {
    simulationPath,
    profiling,
    outputDir
  });

  artifacts.push(...collisionOptimization.artifacts);

  // ============================================================================
  // PHASE 3: LOD RENDERING IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Level-of-Detail Rendering Implementation');

  const lodRendering = await ctx.task(lodRenderingTask, {
    simulationPath,
    profiling,
    outputDir
  });

  artifacts.push(...lodRendering.artifacts);

  // ============================================================================
  // PHASE 4: PARALLEL SIMULATION
  // ============================================================================

  if (parallelInstances > 1) {
    ctx.log('info', 'Phase 4: Parallel Simulation Instances Configuration');

    const parallelSimulation = await ctx.task(parallelSimulationTask, {
      simulationPath,
      parallelInstances,
      outputDir
    });

    artifacts.push(...parallelSimulation.artifacts);
  }

  // ============================================================================
  // PHASE 5: GPU ACCELERATION
  // ============================================================================

  if (gpuAcceleration) {
    ctx.log('info', 'Phase 5: GPU Acceleration Configuration');

    const gpuAccelerationSetup = await ctx.task(gpuAccelerationTask, {
      simulationPath,
      profiling,
      outputDir
    });

    artifacts.push(...gpuAccelerationSetup.artifacts);
  }

  // ============================================================================
  // PHASE 6: SENSOR RATE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Sensor Update Rate Optimization');

  const sensorOptimization = await ctx.task(sensorRateOptimizationTask, {
    simulationPath,
    profiling,
    targetRTF,
    outputDir
  });

  artifacts.push(...sensorOptimization.artifacts);

  // ============================================================================
  // PHASE 7: HEADLESS MODE CONFIGURATION
  // ============================================================================

  if (headlessMode) {
    ctx.log('info', 'Phase 7: Headless Simulation Mode Configuration');

    const headlessConfig = await ctx.task(headlessModeConfigTask, {
      simulationPath,
      outputDir
    });

    artifacts.push(...headlessConfig.artifacts);
  }

  // ============================================================================
  // PHASE 8: PERFORMANCE BENCHMARKING
  // ============================================================================

  ctx.log('info', 'Phase 8: Performance Benchmarking');

  const benchmarking = await ctx.task(performanceBenchmarkingTask, {
    simulationPath,
    targetRTF,
    parallelInstances,
    collisionOptimization,
    lodRendering,
    sensorOptimization,
    outputDir
  });

  artifacts.push(...benchmarking.artifacts);

  // Quality Gate: Performance targets
  if (benchmarking.achievedRTF < targetRTF * 0.9) {
    await ctx.breakpoint({
      question: `Performance target not met. Achieved RTF: ${benchmarking.achievedRTF}, Target: ${targetRTF}. Review optimizations?`,
      title: 'Performance Target Review',
      context: {
        runId: ctx.runId,
        achievedRTF: benchmarking.achievedRTF,
        targetRTF,
        bottlenecks: benchmarking.remainingBottlenecks,
        files: benchmarking.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Simulation Optimization Complete. RTF: ${benchmarking.achievedRTF} (target: ${targetRTF}). Performance improvement: ${benchmarking.improvement}%. Review optimization package?`,
    title: 'Simulation Optimization Complete',
    context: {
      runId: ctx.runId,
      summary: {
        achievedRTF: benchmarking.achievedRTF,
        targetRTF,
        improvement: benchmarking.improvement,
        parallelInstances
      },
      files: [
        { path: benchmarking.reportPath, format: 'markdown', label: 'Benchmark Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: benchmarking.achievedRTF >= targetRTF * 0.9,
    achievedRTF: benchmarking.achievedRTF,
    optimizations: [
      collisionOptimization.optimizations,
      lodRendering.optimizations,
      sensorOptimization.optimizations
    ].flat(),
    benchmarks: {
      baseline: profiling.baselineRTF,
      optimized: benchmarking.achievedRTF,
      improvement: benchmarking.improvement,
      parallelScaling: benchmarking.parallelScaling
    },
    issues,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/robotics-simulation/simulation-performance-optimization',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const performanceProfilingTask = defineTask('performance-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Performance Profiling`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Profile simulation bottlenecks',
      context: args,
      instructions: [
        '1. Measure baseline simulation RTF',
        '2. Profile physics computation time',
        '3. Profile rendering time',
        '4. Profile sensor computation',
        '5. Identify collision detection overhead',
        '6. Profile ROS communication overhead',
        '7. Measure memory usage patterns',
        '8. Identify CPU/GPU utilization',
        '9. Profile I/O bottlenecks',
        '10. Generate profiling report'
      ],
      outputFormat: 'JSON with profiling results'
    },
    outputSchema: {
      type: 'object',
      required: ['baselineRTF', 'bottlenecks', 'artifacts'],
      properties: {
        baselineRTF: { type: 'number' },
        bottlenecks: { type: 'array', items: { type: 'object' } },
        physicsTime: { type: 'number' },
        renderTime: { type: 'number' },
        sensorTime: { type: 'number' },
        memoryUsage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'performance', 'profiling']
}));

export const collisionGeometryOptimizationTask = defineTask('collision-geometry-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Collision Geometry Optimization`,
  agent: {
    name: 'simulation-engineer',
    prompt: {
      role: 'Simulation Engineer',
      task: 'Optimize collision geometry',
      context: args,
      instructions: [
        '1. Analyze collision mesh complexity',
        '2. Apply convex decomposition',
        '3. Replace meshes with primitives',
        '4. Simplify complex collision shapes',
        '5. Configure collision filtering',
        '6. Reduce collision pair counts',
        '7. Optimize self-collision settings',
        '8. Test collision accuracy',
        '9. Measure performance improvement',
        '10. Document collision optimizations'
      ],
      outputFormat: 'JSON with collision optimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'collisionPairReduction', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        collisionPairReduction: { type: 'number' },
        meshSimplifications: { type: 'array', items: { type: 'object' } },
        primitiveReplacements: { type: 'array', items: { type: 'object' } },
        performanceGain: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'performance', 'collision']
}));

export const lodRenderingTask = defineTask('lod-rendering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: LOD Rendering`,
  agent: {
    name: 'graphics-engineer',
    prompt: {
      role: 'Graphics Engineer',
      task: 'Implement level-of-detail rendering',
      context: args,
      instructions: [
        '1. Identify high-poly models',
        '2. Generate LOD mesh versions',
        '3. Configure LOD switching distances',
        '4. Implement LOD for textures',
        '5. Set up view-distance culling',
        '6. Configure shadow LOD',
        '7. Optimize material complexity',
        '8. Test visual quality',
        '9. Measure render performance',
        '10. Document LOD configuration'
      ],
      outputFormat: 'JSON with LOD rendering setup'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'lodConfigs', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        lodConfigs: { type: 'array', items: { type: 'object' } },
        polyReduction: { type: 'number' },
        cullDistance: { type: 'number' },
        renderTimeReduction: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'performance', 'lod']
}));

export const parallelSimulationTask = defineTask('parallel-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Parallel Simulation`,
  agent: {
    name: 'simulation-engineer',
    prompt: {
      role: 'Simulation Engineer',
      task: 'Configure parallel simulation instances',
      context: args,
      instructions: [
        '1. Design parallel simulation architecture',
        '2. Configure instance isolation',
        '3. Set up resource allocation per instance',
        '4. Configure port/namespace management',
        '5. Implement load balancing',
        '6. Set up shared resources efficiently',
        '7. Configure inter-instance communication',
        '8. Test scaling behavior',
        '9. Measure parallel efficiency',
        '10. Document parallel configuration'
      ],
      outputFormat: 'JSON with parallel simulation setup'
    },
    outputSchema: {
      type: 'object',
      required: ['parallelConfig', 'scalingEfficiency', 'artifacts'],
      properties: {
        parallelConfig: { type: 'object' },
        scalingEfficiency: { type: 'number' },
        resourceAllocation: { type: 'object' },
        namespaceConfig: { type: 'array', items: { type: 'string' } },
        maxInstances: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'performance', 'parallel']
}));

export const gpuAccelerationTask = defineTask('gpu-acceleration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: GPU Acceleration`,
  agent: {
    name: 'gpu-engineer',
    prompt: {
      role: 'GPU Engineer',
      task: 'Configure GPU acceleration',
      context: args,
      instructions: [
        '1. Enable GPU physics (if available)',
        '2. Configure GPU rendering',
        '3. Optimize sensor GPU compute',
        '4. Set up CUDA/OpenCL acceleration',
        '5. Configure GPU memory allocation',
        '6. Balance CPU/GPU workloads',
        '7. Enable GPU-based collision',
        '8. Configure multi-GPU if available',
        '9. Measure GPU utilization',
        '10. Document GPU configuration'
      ],
      outputFormat: 'JSON with GPU acceleration setup'
    },
    outputSchema: {
      type: 'object',
      required: ['gpuConfig', 'acceleratedComponents', 'artifacts'],
      properties: {
        gpuConfig: { type: 'object' },
        acceleratedComponents: { type: 'array', items: { type: 'string' } },
        gpuUtilization: { type: 'number' },
        memoryUsage: { type: 'object' },
        performanceGain: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'performance', 'gpu']
}));

export const sensorRateOptimizationTask = defineTask('sensor-rate-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Sensor Rate Optimization`,
  agent: {
    name: 'sensor-engineer',
    prompt: {
      role: 'Sensor Engineer',
      task: 'Optimize sensor update rates',
      context: args,
      instructions: [
        '1. Analyze sensor update frequencies',
        '2. Identify over-sampled sensors',
        '3. Reduce unnecessary sensor rates',
        '4. Implement sensor rate scaling',
        '5. Configure sensor decimation',
        '6. Optimize point cloud resolution',
        '7. Configure camera resolution scaling',
        '8. Balance rate vs accuracy',
        '9. Test perception impact',
        '10. Document rate optimizations'
      ],
      outputFormat: 'JSON with sensor optimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'originalRates', 'optimizedRates', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'object' } },
        originalRates: { type: 'object' },
        optimizedRates: { type: 'object' },
        computeSavings: { type: 'number' },
        accuracyImpact: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'performance', 'sensors']
}));

export const headlessModeConfigTask = defineTask('headless-mode-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Headless Mode Configuration`,
  agent: {
    name: 'simulation-engineer',
    prompt: {
      role: 'Simulation Engineer',
      task: 'Configure headless simulation mode',
      context: args,
      instructions: [
        '1. Disable GUI rendering',
        '2. Configure offscreen rendering for sensors',
        '3. Set up virtual framebuffer if needed',
        '4. Optimize for server deployment',
        '5. Configure logging for headless',
        '6. Set up remote monitoring',
        '7. Test sensor data in headless',
        '8. Measure headless performance gain',
        '9. Configure Docker/container support',
        '10. Document headless configuration'
      ],
      outputFormat: 'JSON with headless configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['headlessConfig', 'performanceGain', 'artifacts'],
      properties: {
        headlessConfig: { type: 'object' },
        performanceGain: { type: 'number' },
        offscreenRendering: { type: 'object' },
        monitoringConfig: { type: 'object' },
        containerConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'performance', 'headless']
}));

export const performanceBenchmarkingTask = defineTask('performance-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Performance Benchmarking`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Benchmark optimized simulation',
      context: args,
      instructions: [
        '1. Run standardized benchmark suite',
        '2. Measure optimized RTF',
        '3. Compare to baseline',
        '4. Test parallel scaling',
        '5. Measure memory efficiency',
        '6. Test long-duration stability',
        '7. Identify remaining bottlenecks',
        '8. Generate performance report',
        '9. Create performance recommendations',
        '10. Document benchmark methodology'
      ],
      outputFormat: 'JSON with benchmark results'
    },
    outputSchema: {
      type: 'object',
      required: ['achievedRTF', 'improvement', 'reportPath', 'artifacts'],
      properties: {
        achievedRTF: { type: 'number' },
        improvement: { type: 'number' },
        reportPath: { type: 'string' },
        parallelScaling: { type: 'object' },
        memoryEfficiency: { type: 'number' },
        remainingBottlenecks: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'performance', 'benchmarking']
}));
