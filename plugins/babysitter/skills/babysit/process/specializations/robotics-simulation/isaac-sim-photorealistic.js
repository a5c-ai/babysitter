/**
 * @process specializations/robotics-simulation/isaac-sim-photorealistic
 * @description Isaac Sim Photorealistic Simulation - Build GPU-accelerated photorealistic simulation environment
 * using NVIDIA Isaac Sim with ray tracing, synthetic data generation, domain randomization, and USD asset
 * management.
 * @inputs { projectName: string, robotModelPath?: string, environmentType?: string, syntheticDataTypes?: array, outputDir?: string }
 * @outputs { success: boolean, projectPath: string, syntheticDatasets: array, performanceMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/isaac-sim-photorealistic', {
 *   projectName: 'perception_training',
 *   robotModelPath: 'models/robot.urdf',
 *   environmentType: 'warehouse',
 *   syntheticDataTypes: ['rgb', 'depth', 'segmentation', 'bounding-boxes']
 * });
 *
 * @references
 * - NVIDIA Isaac Sim: https://developer.nvidia.com/isaac-sim
 * - Isaac Sim Documentation: https://docs.omniverse.nvidia.com/isaacsim/latest/
 * - NVIDIA Isaac ROS: https://developer.nvidia.com/isaac-ros
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    robotModelPath = '',
    environmentType = 'indoor',
    syntheticDataTypes = ['rgb', 'depth', 'segmentation'],
    domainRandomization = true,
    rayTracingEnabled = true,
    outputDir = 'isaac-sim-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const issues = [];

  ctx.log('info', `Starting Isaac Sim Setup: ${projectName}`);
  ctx.log('info', `Environment: ${environmentType}, Ray Tracing: ${rayTracingEnabled}`);

  // ============================================================================
  // PHASE 1: ISAAC SIM ENVIRONMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Isaac Sim Environment and USD Assets Setup');

  const environmentSetup = await ctx.task(isaacSimEnvironmentTask, {
    projectName,
    environmentType,
    outputDir
  });

  artifacts.push(...environmentSetup.artifacts);

  // ============================================================================
  // PHASE 2: ROBOT MODEL IMPORT
  // ============================================================================

  ctx.log('info', 'Phase 2: Robot Model Import (URDF to USD Conversion)');

  const robotImport = await ctx.task(robotModelImportTask, {
    projectName,
    robotModelPath,
    outputDir
  });

  artifacts.push(...robotImport.artifacts);

  // ============================================================================
  // PHASE 3: PHOTOREALISTIC ENVIRONMENT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Photorealistic Environment Design with Ray Tracing');

  const environmentDesign = await ctx.task(photorealisticEnvironmentTask, {
    projectName,
    environmentType,
    rayTracingEnabled,
    environmentSetup,
    outputDir
  });

  artifacts.push(...environmentDesign.artifacts);

  // ============================================================================
  // PHASE 4: PHYSICS SIMULATION CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 4: PhysX Physics Simulation Configuration');

  const physicsConfig = await ctx.task(physxConfigurationTask, {
    projectName,
    robotImport,
    outputDir
  });

  artifacts.push(...physicsConfig.artifacts);

  // ============================================================================
  // PHASE 5: SYNTHETIC DATA GENERATION SETUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Synthetic Data Generation Pipeline Setup');

  const syntheticDataSetup = await ctx.task(syntheticDataGenerationTask, {
    projectName,
    syntheticDataTypes,
    environmentDesign,
    outputDir
  });

  artifacts.push(...syntheticDataSetup.artifacts);

  // ============================================================================
  // PHASE 6: DOMAIN RANDOMIZATION
  // ============================================================================

  if (domainRandomization) {
    ctx.log('info', 'Phase 6: Domain Randomization Configuration');

    const domainRandomizationSetup = await ctx.task(domainRandomizationTask, {
      projectName,
      environmentDesign,
      syntheticDataSetup,
      outputDir
    });

    artifacts.push(...domainRandomizationSetup.artifacts);
  }

  // ============================================================================
  // PHASE 7: SCENARIO CREATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Simulation Scenarios and Test Cases');

  const scenarioCreation = await ctx.task(scenarioCreationTask, {
    projectName,
    environmentType,
    robotImport,
    environmentDesign,
    outputDir
  });

  artifacts.push(...scenarioCreation.artifacts);

  // ============================================================================
  // PHASE 8: GPU PERFORMANCE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 8: GPU Performance Optimization');

  const gpuOptimization = await ctx.task(gpuOptimizationTask, {
    projectName,
    rayTracingEnabled,
    environmentDesign,
    outputDir
  });

  artifacts.push(...gpuOptimization.artifacts);

  await ctx.breakpoint({
    question: `GPU optimization complete for ${projectName}. Achieved FPS: ${gpuOptimization.achievedFPS}. Continue with dataset export?`,
    title: 'GPU Performance Review',
    context: {
      runId: ctx.runId,
      achievedFPS: gpuOptimization.achievedFPS,
      gpuUtilization: gpuOptimization.gpuUtilization,
      files: gpuOptimization.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 9: DATASET EXPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Synthetic Dataset Export');

  const datasetExport = await ctx.task(datasetExportTask, {
    projectName,
    syntheticDataTypes,
    syntheticDataSetup,
    scenarioCreation,
    outputDir
  });

  artifacts.push(...datasetExport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Isaac Sim Project Complete for ${projectName}. Generated ${datasetExport.totalImages} synthetic images. Review project?`,
    title: 'Isaac Sim Project Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        environmentType,
        syntheticDataTypes,
        totalImages: datasetExport.totalImages,
        datasetFormats: datasetExport.formats
      },
      files: [
        { path: environmentSetup.projectPath, format: 'usd', label: 'USD Scene' },
        { path: datasetExport.datasetPath, format: 'folder', label: 'Dataset' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    projectPath: environmentSetup.projectPath,
    syntheticDatasets: datasetExport.datasets,
    performanceMetrics: {
      fps: gpuOptimization.achievedFPS,
      gpuUtilization: gpuOptimization.gpuUtilization,
      renderTime: gpuOptimization.avgRenderTime
    },
    issues,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/robotics-simulation/isaac-sim-photorealistic',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const isaacSimEnvironmentTask = defineTask('isaac-sim-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Isaac Sim Environment - ${args.projectName}`,
  agent: {
    name: 'simulation-engineer',
    prompt: {
      role: 'Isaac Sim Engineer',
      task: 'Set up Isaac Sim environment and USD assets',
      context: args,
      instructions: [
        '1. Create new Isaac Sim project',
        '2. Set up project directory structure',
        '3. Import Omniverse assets',
        '4. Configure USD stage settings',
        '5. Set up asset library references',
        '6. Configure Nucleus connection',
        '7. Set up scene composition',
        '8. Configure render settings',
        '9. Set up extension dependencies',
        '10. Document project configuration'
      ],
      outputFormat: 'JSON with environment setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['projectPath', 'usdStagePath', 'artifacts'],
      properties: {
        projectPath: { type: 'string' },
        usdStagePath: { type: 'string' },
        assetReferences: { type: 'array', items: { type: 'string' } },
        extensions: { type: 'array', items: { type: 'string' } },
        renderSettings: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'isaac-sim', 'environment']
}));

export const robotModelImportTask = defineTask('robot-model-import', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Robot Model Import - ${args.projectName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: {
      role: 'Robotics Engineer',
      task: 'Import robot model (URDF to USD conversion)',
      context: args,
      instructions: [
        '1. Load URDF robot model',
        '2. Convert URDF to USD format',
        '3. Configure articulation root',
        '4. Set up joint drives',
        '5. Configure collision properties',
        '6. Add physics materials',
        '7. Set up rigid body dynamics',
        '8. Configure self-collision filters',
        '9. Add sensor USD components',
        '10. Validate robot model in simulation'
      ],
      outputFormat: 'JSON with robot import details'
    },
    outputSchema: {
      type: 'object',
      required: ['robotUsdPath', 'articulationConfig', 'artifacts'],
      properties: {
        robotUsdPath: { type: 'string' },
        articulationConfig: { type: 'object' },
        jointDrives: { type: 'array', items: { type: 'object' } },
        collisionGroups: { type: 'array', items: { type: 'string' } },
        sensorComponents: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'isaac-sim', 'robot-import']
}));

export const photorealisticEnvironmentTask = defineTask('photorealistic-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Photorealistic Environment - ${args.projectName}`,
  agent: {
    name: 'simulation-engineer',
    prompt: {
      role: 'Isaac Sim Engineer',
      task: 'Design photorealistic environments with ray tracing',
      context: args,
      instructions: [
        '1. Create environment layout',
        '2. Add photorealistic 3D assets',
        '3. Configure PBR materials',
        '4. Set up HDR lighting',
        '5. Enable RTX ray tracing',
        '6. Configure path tracing settings',
        '7. Add global illumination',
        '8. Set up reflections and refractions',
        '9. Configure ambient occlusion',
        '10. Optimize render quality vs performance'
      ],
      outputFormat: 'JSON with environment design details'
    },
    outputSchema: {
      type: 'object',
      required: ['environmentUsdPath', 'materials', 'lighting', 'artifacts'],
      properties: {
        environmentUsdPath: { type: 'string' },
        materials: { type: 'array', items: { type: 'object' } },
        lighting: { type: 'object' },
        rayTracingSettings: { type: 'object' },
        renderQuality: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'isaac-sim', 'photorealistic']
}));

export const physxConfigurationTask = defineTask('physx-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: PhysX Configuration - ${args.projectName}`,
  agent: {
    name: 'simulation-engineer',
    prompt: {
      role: 'Physics Simulation Engineer',
      task: 'Configure PhysX physics simulation',
      context: args,
      instructions: [
        '1. Configure PhysX scene settings',
        '2. Set physics time step',
        '3. Configure GPU physics acceleration',
        '4. Set up collision detection',
        '5. Configure contact reporting',
        '6. Set material friction and restitution',
        '7. Configure solver settings',
        '8. Set up physics debug visualization',
        '9. Configure simulation determinism',
        '10. Validate physics accuracy'
      ],
      outputFormat: 'JSON with PhysX configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['physxSettings', 'timeStep', 'artifacts'],
      properties: {
        physxSettings: { type: 'object' },
        timeStep: { type: 'number' },
        gpuPhysics: { type: 'boolean' },
        solverSettings: { type: 'object' },
        collisionSettings: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'isaac-sim', 'physx']
}));

export const syntheticDataGenerationTask = defineTask('synthetic-data-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Synthetic Data Generation - ${args.projectName}`,
  agent: {
    name: 'ml-engineer',
    prompt: {
      role: 'ML Data Engineer',
      task: 'Set up synthetic data generation pipeline',
      context: args,
      instructions: [
        '1. Configure Replicator synthetic data pipeline',
        '2. Set up RGB image capture',
        '3. Configure depth sensor output',
        '4. Set up semantic segmentation',
        '5. Configure instance segmentation',
        '6. Add 2D/3D bounding box output',
        '7. Set up keypoint annotations',
        '8. Configure normals and motion vectors',
        '9. Set up camera intrinsics output',
        '10. Configure output formats and directories'
      ],
      outputFormat: 'JSON with synthetic data setup'
    },
    outputSchema: {
      type: 'object',
      required: ['dataTypes', 'replicatorConfig', 'artifacts'],
      properties: {
        dataTypes: { type: 'array', items: { type: 'string' } },
        replicatorConfig: { type: 'object' },
        annotationFormats: { type: 'array', items: { type: 'string' } },
        outputPaths: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'isaac-sim', 'synthetic-data']
}));

export const domainRandomizationTask = defineTask('domain-randomization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Domain Randomization - ${args.projectName}`,
  agent: {
    name: 'ml-engineer',
    prompt: {
      role: 'ML Engineer',
      task: 'Configure domain randomization',
      context: args,
      instructions: [
        '1. Set up lighting randomization',
        '2. Configure texture/material randomization',
        '3. Add object pose randomization',
        '4. Configure camera pose variation',
        '5. Add distractors and clutter',
        '6. Randomize object scales',
        '7. Configure color/hue variations',
        '8. Add noise to sensors',
        '9. Set up background randomization',
        '10. Configure randomization schedules'
      ],
      outputFormat: 'JSON with domain randomization config'
    },
    outputSchema: {
      type: 'object',
      required: ['randomizationConfig', 'parameters', 'artifacts'],
      properties: {
        randomizationConfig: { type: 'object' },
        parameters: { type: 'array', items: { type: 'object' } },
        distributions: { type: 'object' },
        schedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'isaac-sim', 'domain-randomization']
}));

export const scenarioCreationTask = defineTask('scenario-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Scenario Creation - ${args.projectName}`,
  agent: {
    name: 'simulation-engineer',
    prompt: {
      role: 'Simulation Engineer',
      task: 'Create simulation scenarios and test cases',
      context: args,
      instructions: [
        '1. Define scenario objectives',
        '2. Create object placement configurations',
        '3. Set up robot task sequences',
        '4. Configure success/failure criteria',
        '5. Add scenario variations',
        '6. Set up multi-scenario batches',
        '7. Configure scenario randomization',
        '8. Add edge case scenarios',
        '9. Set up scenario logging',
        '10. Document scenario specifications'
      ],
      outputFormat: 'JSON with scenario configurations'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'batchConfigs', 'artifacts'],
      properties: {
        scenarios: { type: 'array', items: { type: 'object' } },
        batchConfigs: { type: 'object' },
        successCriteria: { type: 'object' },
        variations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'isaac-sim', 'scenarios']
}));

export const gpuOptimizationTask = defineTask('gpu-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: GPU Optimization - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'GPU Performance Engineer',
      task: 'Optimize GPU performance',
      context: args,
      instructions: [
        '1. Profile GPU utilization',
        '2. Optimize render settings',
        '3. Configure ray tracing quality',
        '4. Set up render resolution scaling',
        '5. Optimize texture streaming',
        '6. Configure LOD settings',
        '7. Balance quality vs performance',
        '8. Test multi-GPU scaling',
        '9. Optimize memory usage',
        '10. Document performance benchmarks'
      ],
      outputFormat: 'JSON with GPU optimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['achievedFPS', 'gpuUtilization', 'artifacts'],
      properties: {
        achievedFPS: { type: 'number' },
        gpuUtilization: { type: 'number' },
        avgRenderTime: { type: 'number' },
        optimizations: { type: 'array', items: { type: 'object' } },
        memoryUsage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'isaac-sim', 'gpu-optimization']
}));

export const datasetExportTask = defineTask('dataset-export', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Dataset Export - ${args.projectName}`,
  agent: {
    name: 'ml-engineer',
    prompt: {
      role: 'ML Data Engineer',
      task: 'Export synthetic datasets',
      context: args,
      instructions: [
        '1. Run data generation pipeline',
        '2. Export images in specified formats',
        '3. Generate annotation files',
        '4. Export in COCO format',
        '5. Export in KITTI format',
        '6. Create train/val/test splits',
        '7. Generate dataset statistics',
        '8. Validate annotation quality',
        '9. Create dataset documentation',
        '10. Package dataset for distribution'
      ],
      outputFormat: 'JSON with dataset export details'
    },
    outputSchema: {
      type: 'object',
      required: ['datasetPath', 'totalImages', 'formats', 'artifacts'],
      properties: {
        datasetPath: { type: 'string' },
        totalImages: { type: 'number' },
        formats: { type: 'array', items: { type: 'string' } },
        datasets: { type: 'array', items: { type: 'object' } },
        splits: { type: 'object' },
        statistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'isaac-sim', 'dataset-export']
}));
