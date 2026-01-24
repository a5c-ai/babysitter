/**
 * @process specializations/robotics-simulation/gazebo-simulation-setup
 * @description Gazebo Simulation Environment Setup - Create high-fidelity simulation environment using Gazebo
 * for robot testing including world design, physics configuration, sensor plugins, dynamic objects, and
 * performance optimization.
 * @inputs { worldName: string, robotModel?: string, environmentType?: string, sensorPlugins?: array, outputDir?: string }
 * @outputs { success: boolean, worldFilePath: string, launchFilePath: string, validationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/gazebo-simulation-setup', {
 *   worldName: 'warehouse_world',
 *   robotModel: 'mobile_robot.urdf',
 *   environmentType: 'indoor-warehouse',
 *   sensorPlugins: ['camera', 'lidar', 'imu']
 * });
 *
 * @references
 * - Gazebo Tutorials: https://gazebosim.org/docs
 * - gazebo_ros_pkgs: http://wiki.ros.org/gazebo_ros_pkgs
 * - Classic Gazebo Tutorials: https://classic.gazebosim.org/tutorials
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    worldName,
    robotModel = '',
    environmentType = 'indoor',
    sensorPlugins = ['camera', 'lidar', 'imu'],
    physicsEngine = 'ode',
    realTimeFactor = 1.0,
    outputDir = 'gazebo-simulation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const issues = [];

  ctx.log('info', `Starting Gazebo Simulation Setup: ${worldName}`);
  ctx.log('info', `Environment: ${environmentType}, Physics: ${physicsEngine}`);

  // ============================================================================
  // PHASE 1: WORLD FILE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: World File Design with Terrain and Obstacles');

  const worldDesign = await ctx.task(worldFileDesignTask, {
    worldName,
    environmentType,
    outputDir
  });

  artifacts.push(...worldDesign.artifacts);

  // ============================================================================
  // PHASE 2: 3D MODEL IMPORT
  // ============================================================================

  ctx.log('info', 'Phase 2: 3D Model Import and Environment Creation');

  const modelImport = await ctx.task(modelImportTask, {
    worldName,
    environmentType,
    worldDesign,
    outputDir
  });

  artifacts.push(...modelImport.artifacts);

  // ============================================================================
  // PHASE 3: PHYSICS CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Physics Engine Configuration');

  const physicsConfig = await ctx.task(physicsConfigurationTask, {
    worldName,
    physicsEngine,
    realTimeFactor,
    outputDir
  });

  artifacts.push(...physicsConfig.artifacts);

  // ============================================================================
  // PHASE 4: LIGHTING AND ENVIRONMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Lighting and Environmental Effects');

  const lightingConfig = await ctx.task(lightingEnvironmentTask, {
    worldName,
    environmentType,
    worldDesign,
    outputDir
  });

  artifacts.push(...lightingConfig.artifacts);

  // ============================================================================
  // PHASE 5: SENSOR PLUGIN IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Sensor Plugin Implementation');

  const sensorPluginSetup = await ctx.task(sensorPluginImplementationTask, {
    worldName,
    robotModel,
    sensorPlugins,
    outputDir
  });

  artifacts.push(...sensorPluginSetup.artifacts);

  // ============================================================================
  // PHASE 6: DYNAMIC OBJECTS AND ACTORS
  // ============================================================================

  ctx.log('info', 'Phase 6: Dynamic Objects and Actors Configuration');

  const dynamicObjects = await ctx.task(dynamicObjectsTask, {
    worldName,
    environmentType,
    worldDesign,
    outputDir
  });

  artifacts.push(...dynamicObjects.artifacts);

  // ============================================================================
  // PHASE 7: MULTI-ROBOT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 7: Multi-Robot Instance Setup');

  const multiRobotSetup = await ctx.task(multiRobotSetupTask, {
    worldName,
    robotModel,
    outputDir
  });

  artifacts.push(...multiRobotSetup.artifacts);

  // ============================================================================
  // PHASE 8: PERFORMANCE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Simulation Performance Optimization');

  const performanceOptimization = await ctx.task(performanceOptimizationTask, {
    worldName,
    worldDesign,
    modelImport,
    physicsConfig,
    outputDir
  });

  artifacts.push(...performanceOptimization.artifacts);

  // ============================================================================
  // PHASE 9: PHYSICS VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Physics Accuracy Validation');

  const physicsValidation = await ctx.task(physicsValidationTask, {
    worldName,
    physicsConfig,
    robotModel,
    outputDir
  });

  artifacts.push(...physicsValidation.artifacts);
  if (physicsValidation.issues) issues.push(...physicsValidation.issues);

  // Quality Gate: Physics validation
  if (!physicsValidation.validationPassed) {
    await ctx.breakpoint({
      question: `Physics validation for ${worldName} found issues. Accuracy: ${physicsValidation.accuracy}%. Review and adjust physics parameters?`,
      title: 'Physics Validation Review',
      context: {
        runId: ctx.runId,
        accuracy: physicsValidation.accuracy,
        issues: physicsValidation.issues,
        files: physicsValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 10: LAUNCH FILE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Launch File Generation');

  const launchFileGeneration = await ctx.task(launchFileGenerationTask, {
    worldName,
    robotModel,
    sensorPlugins,
    physicsConfig,
    outputDir
  });

  artifacts.push(...launchFileGeneration.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Gazebo Simulation Setup Complete for ${worldName}. Physics validation: ${physicsValidation.validationPassed ? 'PASSED' : 'ISSUES'}. Review simulation package?`,
    title: 'Gazebo Simulation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        worldName,
        environmentType,
        physicsEngine,
        sensorPlugins,
        realTimeFactor: performanceOptimization.achievedRTF
      },
      files: [
        { path: worldDesign.worldFilePath, format: 'sdf', label: 'World File' },
        { path: launchFileGeneration.launchFilePath, format: 'python', label: 'Launch File' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: physicsValidation.validationPassed,
    worldName,
    worldFilePath: worldDesign.worldFilePath,
    launchFilePath: launchFileGeneration.launchFilePath,
    validationResults: {
      physicsPassed: physicsValidation.validationPassed,
      accuracy: physicsValidation.accuracy,
      realTimeFactor: performanceOptimization.achievedRTF
    },
    issues,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/robotics-simulation/gazebo-simulation-setup',
      timestamp: startTime,
      physicsEngine,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const worldFileDesignTask = defineTask('world-file-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: World File Design - ${args.worldName}`,
  agent: {
    name: 'simulation-engineer',
    prompt: {
      role: 'Simulation Engineer',
      task: 'Design Gazebo world file with terrain and obstacles',
      context: args,
      instructions: [
        '1. Create world file structure',
        '2. Define ground plane and terrain',
        '3. Add static obstacles and structures',
        '4. Configure world boundaries',
        '5. Set up coordinate frames',
        '6. Define spawn locations',
        '7. Add collision geometry for static objects',
        '8. Configure atmospheric settings',
        '9. Set simulation time parameters',
        '10. Document world layout'
      ],
      outputFormat: 'JSON with world design details'
    },
    outputSchema: {
      type: 'object',
      required: ['worldFilePath', 'terrain', 'obstacles', 'artifacts'],
      properties: {
        worldFilePath: { type: 'string' },
        terrain: { type: 'object' },
        obstacles: { type: 'array', items: { type: 'object' } },
        spawnPoints: { type: 'array', items: { type: 'object' } },
        worldBounds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'gazebo', 'world-design']
}));

export const modelImportTask = defineTask('model-import', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Model Import - ${args.worldName}`,
  agent: {
    name: 'simulation-engineer',
    prompt: {
      role: 'Simulation Engineer',
      task: 'Import or create 3D models for environment',
      context: args,
      instructions: [
        '1. Import 3D models from Gazebo model database',
        '2. Create custom models as needed',
        '3. Set model scales and positions',
        '4. Configure model collision properties',
        '5. Add material and texture properties',
        '6. Set up model plugins if needed',
        '7. Organize model files in package',
        '8. Configure model paths',
        '9. Optimize mesh complexity',
        '10. Document model sources and licenses'
      ],
      outputFormat: 'JSON with model import details'
    },
    outputSchema: {
      type: 'object',
      required: ['models', 'modelPaths', 'artifacts'],
      properties: {
        models: { type: 'array', items: { type: 'object' } },
        modelPaths: { type: 'array', items: { type: 'string' } },
        customModels: { type: 'array', items: { type: 'object' } },
        totalVertexCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'gazebo', 'models']
}));

export const physicsConfigurationTask = defineTask('physics-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Physics Configuration - ${args.worldName}`,
  agent: {
    name: 'simulation-engineer',
    prompt: {
      role: 'Simulation Engineer',
      task: 'Configure physics engine parameters',
      context: args,
      instructions: [
        '1. Select physics engine (ODE, Bullet, DART, Simbody)',
        '2. Configure gravity vector',
        '3. Set solver iteration counts',
        '4. Configure step size and real-time update rate',
        '5. Set friction coefficients',
        '6. Configure contact parameters (stiffness, damping)',
        '7. Set constraint force mixing (CFM) and error reduction (ERP)',
        '8. Configure collision detection parameters',
        '9. Set max contacts per surface',
        '10. Document physics parameters'
      ],
      outputFormat: 'JSON with physics configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['physicsEngine', 'stepSize', 'solverIterations', 'artifacts'],
      properties: {
        physicsEngine: { type: 'string' },
        stepSize: { type: 'number' },
        solverIterations: { type: 'number' },
        gravity: { type: 'array', items: { type: 'number' } },
        friction: { type: 'object' },
        contactParameters: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'gazebo', 'physics']
}));

export const lightingEnvironmentTask = defineTask('lighting-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Lighting and Environment - ${args.worldName}`,
  agent: {
    name: 'simulation-engineer',
    prompt: {
      role: 'Simulation Engineer',
      task: 'Configure lighting and environmental effects',
      context: args,
      instructions: [
        '1. Add sun/directional light source',
        '2. Configure ambient lighting',
        '3. Add point lights for indoor scenes',
        '4. Set up shadows and shadow parameters',
        '5. Configure fog/haze effects if needed',
        '6. Add skybox or background',
        '7. Configure scene ambient color',
        '8. Set up time-of-day variations',
        '9. Add environmental sensors (wind)',
        '10. Optimize rendering settings'
      ],
      outputFormat: 'JSON with lighting configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['lights', 'ambientSettings', 'artifacts'],
      properties: {
        lights: { type: 'array', items: { type: 'object' } },
        ambientSettings: { type: 'object' },
        shadows: { type: 'object' },
        skybox: { type: 'object' },
        environmentEffects: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'gazebo', 'lighting']
}));

export const sensorPluginImplementationTask = defineTask('sensor-plugin-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Sensor Plugin Implementation - ${args.worldName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: {
      role: 'Robotics Engineer',
      task: 'Implement sensor plugins for Gazebo',
      context: args,
      instructions: [
        '1. Configure camera plugin with ROS interface',
        '2. Set up LiDAR plugin with range/resolution',
        '3. Configure depth camera plugin',
        '4. Add IMU plugin with noise models',
        '5. Set up GPS plugin if needed',
        '6. Configure contact sensors',
        '7. Add force/torque sensors',
        '8. Set sensor update rates',
        '9. Configure ROS topic names',
        '10. Test sensor data publishing'
      ],
      outputFormat: 'JSON with sensor plugin configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['sensorPlugins', 'rosTopics', 'artifacts'],
      properties: {
        sensorPlugins: { type: 'array', items: { type: 'object' } },
        rosTopics: { type: 'array', items: { type: 'string' } },
        updateRates: { type: 'object' },
        noiseModels: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'gazebo', 'sensors']
}));

export const dynamicObjectsTask = defineTask('dynamic-objects', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Dynamic Objects - ${args.worldName}`,
  agent: {
    name: 'simulation-engineer',
    prompt: {
      role: 'Simulation Engineer',
      task: 'Create dynamic objects and actors',
      context: args,
      instructions: [
        '1. Add moveable objects (boxes, pallets)',
        '2. Create animated actors (people, vehicles)',
        '3. Set up actor animation paths',
        '4. Configure object physics properties',
        '5. Add object spawning/despawning logic',
        '6. Create traffic patterns if needed',
        '7. Set up crowd simulation',
        '8. Configure actor collision behaviors',
        '9. Add scripted scenarios',
        '10. Document dynamic object configurations'
      ],
      outputFormat: 'JSON with dynamic objects configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['dynamicObjects', 'actors', 'artifacts'],
      properties: {
        dynamicObjects: { type: 'array', items: { type: 'object' } },
        actors: { type: 'array', items: { type: 'object' } },
        animationPaths: { type: 'array', items: { type: 'object' } },
        spawnLogic: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'gazebo', 'dynamic-objects']
}));

export const multiRobotSetupTask = defineTask('multi-robot-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Multi-Robot Setup - ${args.worldName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: {
      role: 'Robotics Engineer',
      task: 'Set up multiple robot instances',
      context: args,
      instructions: [
        '1. Configure robot namespacing',
        '2. Set up TF prefixes for each robot',
        '3. Configure unique spawn positions',
        '4. Set up robot communication topics',
        '5. Configure robot-specific parameters',
        '6. Handle inter-robot collision',
        '7. Set up fleet management interface',
        '8. Configure shared world resources',
        '9. Test multi-robot spawning',
        '10. Document multi-robot configuration'
      ],
      outputFormat: 'JSON with multi-robot setup'
    },
    outputSchema: {
      type: 'object',
      required: ['robotNamespaces', 'spawnConfigs', 'artifacts'],
      properties: {
        robotNamespaces: { type: 'array', items: { type: 'string' } },
        spawnConfigs: { type: 'array', items: { type: 'object' } },
        tfPrefixes: { type: 'array', items: { type: 'string' } },
        topicRemappings: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'gazebo', 'multi-robot']
}));

export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Performance Optimization - ${args.worldName}`,
  agent: {
    name: 'simulation-engineer',
    prompt: {
      role: 'Simulation Engineer',
      task: 'Optimize simulation performance',
      context: args,
      instructions: [
        '1. Profile simulation bottlenecks',
        '2. Optimize collision geometry complexity',
        '3. Reduce visual mesh polygon count',
        '4. Configure level-of-detail (LOD) settings',
        '5. Optimize sensor update rates',
        '6. Configure render distance and culling',
        '7. Test headless simulation mode',
        '8. Measure real-time factor',
        '9. Optimize physics solver settings',
        '10. Document performance benchmarks'
      ],
      outputFormat: 'JSON with performance optimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['achievedRTF', 'optimizations', 'artifacts'],
      properties: {
        achievedRTF: { type: 'number' },
        optimizations: { type: 'array', items: { type: 'object' } },
        benchmarks: { type: 'object' },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'gazebo', 'performance']
}));

export const physicsValidationTask = defineTask('physics-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Physics Validation - ${args.worldName}`,
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Simulation Test Engineer',
      task: 'Validate physics accuracy',
      context: args,
      instructions: [
        '1. Test gravity and free-fall',
        '2. Validate friction coefficients',
        '3. Test collision response',
        '4. Verify joint dynamics',
        '5. Test robot locomotion physics',
        '6. Validate sensor models',
        '7. Compare with real-world measurements',
        '8. Test edge cases and stability',
        '9. Document physics accuracy',
        '10. Identify simulation limitations'
      ],
      outputFormat: 'JSON with physics validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validationPassed', 'accuracy', 'testResults', 'artifacts'],
      properties: {
        validationPassed: { type: 'boolean' },
        accuracy: { type: 'number' },
        testResults: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'gazebo', 'validation']
}));

export const launchFileGenerationTask = defineTask('launch-file-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Launch File Generation - ${args.worldName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: {
      role: 'Robotics Engineer',
      task: 'Generate ROS launch files for simulation',
      context: args,
      instructions: [
        '1. Create main Gazebo launch file',
        '2. Add robot spawn launch file',
        '3. Configure simulation parameters',
        '4. Add sensor launch configurations',
        '5. Include RViz visualization launch',
        '6. Create headless simulation option',
        '7. Add argument parsing for flexibility',
        '8. Configure GUI vs headless modes',
        '9. Add debugging launch options',
        '10. Document launch file usage'
      ],
      outputFormat: 'JSON with launch file details'
    },
    outputSchema: {
      type: 'object',
      required: ['launchFilePath', 'launchArguments', 'artifacts'],
      properties: {
        launchFilePath: { type: 'string' },
        launchArguments: { type: 'array', items: { type: 'object' } },
        includedLaunches: { type: 'array', items: { type: 'string' } },
        configurations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'gazebo', 'launch']
}));
