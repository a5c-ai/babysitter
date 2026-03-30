/**
 * @process specializations/robotics-simulation/robot-urdf-sdf-model
 * @description Robot URDF/SDF Model Creation - Create accurate robot models in URDF/SDF format for simulation
 * and visualization, including kinematic chain design, 3D meshes, link properties, joint configuration,
 * sensor models, and validation in RViz/Gazebo.
 * @inputs { robotName: string, robotType?: string, meshesPath?: string, urdfOrSdf?: string, outputDir?: string }
 * @outputs { success: boolean, modelPath: string, validationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/robot-urdf-sdf-model', {
 *   robotName: 'mobile_manipulator',
 *   robotType: 'mobile-arm',
 *   meshesPath: 'meshes/',
 *   urdfOrSdf: 'urdf'
 * });
 *
 * @references
 * - URDF Tutorials: http://wiki.ros.org/urdf/Tutorials
 * - SDF Format: http://sdformat.org/
 * - Xacro: https://wiki.ros.org/xacro
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    robotType = 'mobile-robot',
    meshesPath = 'meshes/',
    urdfOrSdf = 'urdf',
    useXacro = true,
    includeCollision = true,
    includeInertials = true,
    sensorConfigs = [],
    outputDir = 'robot-model-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const issues = [];

  ctx.log('info', `Starting Robot Model Creation: ${robotName}`);
  ctx.log('info', `Format: ${urdfOrSdf.toUpperCase()}, Type: ${robotType}`);

  // ============================================================================
  // PHASE 1: KINEMATIC CHAIN DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Kinematic Chain and Joint Hierarchy Design');

  const kinematicDesign = await ctx.task(kinematicChainDesignTask, {
    robotName,
    robotType,
    urdfOrSdf,
    outputDir
  });

  artifacts.push(...kinematicDesign.artifacts);

  // ============================================================================
  // PHASE 2: MESH PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Visual and Collision Mesh Preparation');

  const meshPreparation = await ctx.task(meshPreparationTask, {
    robotName,
    meshesPath,
    kinematicDesign,
    includeCollision,
    outputDir
  });

  artifacts.push(...meshPreparation.artifacts);

  // ============================================================================
  // PHASE 3: LINK PROPERTIES DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 3: Link Properties (Mass, Inertia, Dimensions)');

  const linkProperties = await ctx.task(linkPropertiesTask, {
    robotName,
    kinematicDesign,
    meshPreparation,
    includeInertials,
    outputDir
  });

  artifacts.push(...linkProperties.artifacts);

  // ============================================================================
  // PHASE 4: JOINT CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Joint Types, Limits, and Dynamics Configuration');

  const jointConfiguration = await ctx.task(jointConfigurationTask, {
    robotName,
    kinematicDesign,
    robotType,
    outputDir
  });

  artifacts.push(...jointConfiguration.artifacts);

  // ============================================================================
  // PHASE 5: SENSOR MODEL SETUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Sensor Model Configuration');

  const sensorModels = await ctx.task(sensorModelSetupTask, {
    robotName,
    sensorConfigs,
    kinematicDesign,
    urdfOrSdf,
    outputDir
  });

  artifacts.push(...sensorModels.artifacts);

  // ============================================================================
  // PHASE 6: MODEL FILE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 6: URDF/SDF/Xacro File Generation');

  const modelGeneration = await ctx.task(modelFileGenerationTask, {
    robotName,
    urdfOrSdf,
    useXacro,
    kinematicDesign,
    meshPreparation,
    linkProperties,
    jointConfiguration,
    sensorModels,
    outputDir
  });

  artifacts.push(...modelGeneration.artifacts);

  // ============================================================================
  // PHASE 7: MODEL VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Model Validation in RViz/Gazebo');

  const modelValidation = await ctx.task(modelValidationTask, {
    robotName,
    modelGeneration,
    urdfOrSdf,
    outputDir
  });

  artifacts.push(...modelValidation.artifacts);
  if (modelValidation.issues) issues.push(...modelValidation.issues);

  // Quality Gate: Model validation
  if (!modelValidation.validationPassed) {
    await ctx.breakpoint({
      question: `Model validation for ${robotName} found issues: ${modelValidation.errors.join(', ')}. Review and fix model issues?`,
      title: 'Model Validation Failed',
      context: {
        runId: ctx.runId,
        errors: modelValidation.errors,
        warnings: modelValidation.warnings,
        files: modelValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: COLLISION GEOMETRY OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Collision Geometry Optimization');

  const collisionOptimization = await ctx.task(collisionOptimizationTask, {
    robotName,
    modelGeneration,
    meshPreparation,
    outputDir
  });

  artifacts.push(...collisionOptimization.artifacts);

  // ============================================================================
  // PHASE 9: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Model Documentation');

  const modelDocumentation = await ctx.task(modelDocumentationTask, {
    robotName,
    kinematicDesign,
    linkProperties,
    jointConfiguration,
    sensorModels,
    modelGeneration,
    outputDir
  });

  artifacts.push(...modelDocumentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Robot Model Complete for ${robotName}. Validation: ${modelValidation.validationPassed ? 'PASSED' : 'ISSUES'}. Review model package?`,
    title: 'Robot Model Complete',
    context: {
      runId: ctx.runId,
      summary: {
        robotName,
        format: urdfOrSdf,
        linkCount: kinematicDesign.linkCount,
        jointCount: kinematicDesign.jointCount,
        sensorCount: sensorModels.sensorCount
      },
      files: [
        { path: modelGeneration.modelPath, format: urdfOrSdf, label: 'Robot Model' },
        { path: modelDocumentation.docPath, format: 'markdown', label: 'Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: modelValidation.validationPassed,
    robotName,
    modelPath: modelGeneration.modelPath,
    validationResults: {
      passed: modelValidation.validationPassed,
      errors: modelValidation.errors,
      warnings: modelValidation.warnings
    },
    modelDetails: {
      format: urdfOrSdf,
      linkCount: kinematicDesign.linkCount,
      jointCount: kinematicDesign.jointCount,
      sensorCount: sensorModels.sensorCount
    },
    issues,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/robotics-simulation/robot-urdf-sdf-model',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const kinematicChainDesignTask = defineTask('kinematic-chain-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Kinematic Chain Design - ${args.robotName}`,
  agent: {
    name: 'urdf-sdf-expert',  // AG-005: URDF/SDF Modeling Expert Agent
    prompt: {
      role: 'Robotics Engineer',
      task: 'Design robot kinematic chain and joint hierarchy',
      context: args,
      instructions: [
        '1. Define base link and coordinate frame convention',
        '2. Design link hierarchy from base to end-effector(s)',
        '3. Identify joint types for each connection (revolute, prismatic, continuous, fixed)',
        '4. Define parent-child relationships',
        '5. Establish joint axis directions',
        '6. Plan for sensor attachment points',
        '7. Consider symmetry and modularity',
        '8. Document kinematic tree structure',
        '9. Define frame naming conventions',
        '10. Create kinematic diagram'
      ],
      outputFormat: 'JSON with kinematic chain design'
    },
    outputSchema: {
      type: 'object',
      required: ['links', 'joints', 'linkCount', 'jointCount', 'artifacts'],
      properties: {
        links: { type: 'array', items: { type: 'object' } },
        joints: { type: 'array', items: { type: 'object' } },
        linkCount: { type: 'number' },
        jointCount: { type: 'number' },
        kinematicTree: { type: 'object' },
        frameConventions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'urdf-sdf', 'kinematics']
}));

export const meshPreparationTask = defineTask('mesh-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Mesh Preparation - ${args.robotName}`,
  agent: {
    name: 'urdf-sdf-expert',  // AG-005: URDF/SDF Modeling Expert Agent
    prompt: {
      role: 'CAD Engineer',
      task: 'Prepare visual and collision meshes',
      context: args,
      instructions: [
        '1. Import or create 3D meshes for each link',
        '2. Ensure mesh origins align with link frames',
        '3. Create simplified collision meshes',
        '4. Optimize mesh polygon count for performance',
        '5. Export meshes in appropriate format (STL, DAE, OBJ)',
        '6. Set up mesh scaling factors',
        '7. Verify mesh normals and orientations',
        '8. Create collision primitives where appropriate',
        '9. Document mesh file organization',
        '10. Verify mesh watertightness for collision'
      ],
      outputFormat: 'JSON with mesh preparation details'
    },
    outputSchema: {
      type: 'object',
      required: ['visualMeshes', 'collisionMeshes', 'artifacts'],
      properties: {
        visualMeshes: { type: 'array', items: { type: 'object' } },
        collisionMeshes: { type: 'array', items: { type: 'object' } },
        meshFormat: { type: 'string' },
        totalVertices: { type: 'number' },
        optimizationNotes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'urdf-sdf', 'meshes']
}));

export const linkPropertiesTask = defineTask('link-properties', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Link Properties - ${args.robotName}`,
  agent: {
    name: 'urdf-sdf-expert',  // AG-005: URDF/SDF Modeling Expert Agent
    prompt: {
      role: 'Mechanical Engineer',
      task: 'Define link physical properties',
      context: args,
      instructions: [
        '1. Calculate or specify mass for each link',
        '2. Compute inertia tensors (Ixx, Iyy, Izz, Ixy, Ixz, Iyz)',
        '3. Define center of mass locations',
        '4. Specify link dimensions and bounding boxes',
        '5. Add material properties (friction, color)',
        '6. Verify physical plausibility of values',
        '7. Use CAD-derived values where available',
        '8. Document assumptions and simplifications',
        '9. Create inertial verification tests',
        '10. Handle composite materials appropriately'
      ],
      outputFormat: 'JSON with link properties'
    },
    outputSchema: {
      type: 'object',
      required: ['linkProperties', 'totalMass', 'artifacts'],
      properties: {
        linkProperties: { type: 'array', items: { type: 'object' } },
        totalMass: { type: 'number' },
        centerOfMass: { type: 'object' },
        materialProperties: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'urdf-sdf', 'inertials']
}));

export const jointConfigurationTask = defineTask('joint-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Joint Configuration - ${args.robotName}`,
  agent: {
    name: 'urdf-sdf-expert',  // AG-005: URDF/SDF Modeling Expert Agent
    prompt: {
      role: 'Robotics Engineer',
      task: 'Configure joint types, limits, and dynamics',
      context: args,
      instructions: [
        '1. Set joint types (revolute, prismatic, continuous, fixed, floating)',
        '2. Define position limits (lower, upper)',
        '3. Set velocity limits',
        '4. Define effort/torque limits',
        '5. Configure joint dynamics (damping, friction)',
        '6. Set soft limits and safety controllers',
        '7. Configure mimic joints if needed',
        '8. Set initial joint positions',
        '9. Define joint calibration parameters',
        '10. Document joint naming conventions'
      ],
      outputFormat: 'JSON with joint configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['jointConfigs', 'artifacts'],
      properties: {
        jointConfigs: { type: 'array', items: { type: 'object' } },
        jointLimits: { type: 'object' },
        dynamics: { type: 'object' },
        safetyControllers: { type: 'array', items: { type: 'object' } },
        mimicJoints: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'urdf-sdf', 'joints']
}));

export const sensorModelSetupTask = defineTask('sensor-model-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Sensor Model Setup - ${args.robotName}`,
  agent: {
    name: 'perception-engineer',  // AG-004: Perception Engineer Agent
    prompt: {
      role: 'Sensor Integration Engineer',
      task: 'Set up sensor models in URDF/SDF',
      context: args,
      instructions: [
        '1. Define camera sensor models with intrinsics',
        '2. Configure LiDAR sensor models (range, FoV, resolution)',
        '3. Set up IMU sensor models with noise parameters',
        '4. Add depth camera configurations',
        '5. Configure contact/force-torque sensors',
        '6. Set sensor update rates',
        '7. Define sensor coordinate frames',
        '8. Add Gazebo sensor plugins',
        '9. Configure sensor noise models',
        '10. Document sensor mounting transforms'
      ],
      outputFormat: 'JSON with sensor model configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['sensors', 'sensorCount', 'artifacts'],
      properties: {
        sensors: { type: 'array', items: { type: 'object' } },
        sensorCount: { type: 'number' },
        gazeboPlugins: { type: 'array', items: { type: 'object' } },
        sensorFrames: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'urdf-sdf', 'sensors']
}));

export const modelFileGenerationTask = defineTask('model-file-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Model File Generation - ${args.robotName}`,
  agent: {
    name: 'urdf-sdf-expert',  // AG-005: URDF/SDF Modeling Expert Agent
    prompt: {
      role: 'Robotics Engineer',
      task: 'Generate URDF/SDF/Xacro model files',
      context: args,
      instructions: [
        '1. Create main model file structure',
        '2. Add all link definitions with visual/collision/inertial',
        '3. Add all joint definitions with limits and dynamics',
        '4. Include sensor definitions and plugins',
        '5. Add Gazebo-specific extensions if needed',
        '6. Use xacro macros for modularity if applicable',
        '7. Add material and color definitions',
        '8. Include transmission definitions for control',
        '9. Add ros2_control hardware interface tags',
        '10. Validate XML syntax and structure'
      ],
      outputFormat: 'JSON with model generation details'
    },
    outputSchema: {
      type: 'object',
      required: ['modelPath', 'modelFormat', 'artifacts'],
      properties: {
        modelPath: { type: 'string' },
        modelFormat: { type: 'string' },
        xacroMacros: { type: 'array', items: { type: 'string' } },
        transmissions: { type: 'array', items: { type: 'object' } },
        gazeboExtensions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'urdf-sdf', 'generation']
}));

export const modelValidationTask = defineTask('model-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Model Validation - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: {
      role: 'Robotics Test Engineer',
      task: 'Validate robot model in RViz and Gazebo',
      context: args,
      instructions: [
        '1. Run check_urdf for syntax validation',
        '2. Visualize model in RViz',
        '3. Verify TF tree structure',
        '4. Test joint state publisher functionality',
        '5. Load model in Gazebo',
        '6. Verify physics simulation stability',
        '7. Test sensor data generation',
        '8. Check collision detection',
        '9. Verify coordinate frame orientations',
        '10. Document any validation errors or warnings'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validationPassed', 'errors', 'warnings', 'artifacts'],
      properties: {
        validationPassed: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        rvizValidation: { type: 'object' },
        gazeboValidation: { type: 'object' },
        tfTree: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'urdf-sdf', 'validation']
}));

export const collisionOptimizationTask = defineTask('collision-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Collision Optimization - ${args.robotName}`,
  agent: {
    name: 'simulation-optimization-expert',  // AG-009: Simulation Optimization Expert Agent
    prompt: {
      role: 'Simulation Engineer',
      task: 'Optimize collision geometry for performance',
      context: args,
      instructions: [
        '1. Analyze collision mesh complexity',
        '2. Apply convex decomposition where needed',
        '3. Replace complex meshes with primitives',
        '4. Optimize self-collision filtering',
        '5. Configure collision bitmasks',
        '6. Test collision detection performance',
        '7. Balance accuracy vs simulation speed',
        '8. Document collision simplifications',
        '9. Verify collision coverage',
        '10. Test edge cases and corner geometries'
      ],
      outputFormat: 'JSON with collision optimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedMeshes', 'performanceGain', 'artifacts'],
      properties: {
        optimizedMeshes: { type: 'array', items: { type: 'object' } },
        performanceGain: { type: 'string' },
        collisionPairs: { type: 'number' },
        primitiveReplacements: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'urdf-sdf', 'collision-optimization']
}));

export const modelDocumentationTask = defineTask('model-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Model Documentation - ${args.robotName}`,
  agent: {
    name: 'robotics-documentation-specialist',  // AG-020: Robotics Documentation Specialist Agent
    prompt: {
      role: 'Technical Writer',
      task: 'Document robot model',
      context: args,
      instructions: [
        '1. Create model overview and purpose',
        '2. Document kinematic structure with diagrams',
        '3. List all links with properties',
        '4. Document joint specifications and limits',
        '5. Describe sensor configurations',
        '6. Include mesh file locations and formats',
        '7. Document coordinate frame conventions',
        '8. Add usage examples for ROS',
        '9. Include troubleshooting guide',
        '10. Create change log and version history'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['docPath', 'sections', 'artifacts'],
      properties: {
        docPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        diagrams: { type: 'array', items: { type: 'string' } },
        usageExamples: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'urdf-sdf', 'documentation']
}));
