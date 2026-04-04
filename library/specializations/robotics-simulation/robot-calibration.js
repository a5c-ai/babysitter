/**
 * @process specializations/robotics-simulation/robot-calibration
 * @description Robot Calibration Workflow - Systematic calibration of robot sensors, actuators, and kinematic
 * parameters including intrinsic camera calibration, extrinsic sensor calibration, DH parameter calibration,
 * IMU calibration, and hand-eye calibration.
 * @inputs { robotName: string, calibrationTypes?: array, sensorList?: array, outputDir?: string }
 * @outputs { success: boolean, calibrationResults: object, calibrationFiles: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/robot-calibration', {
 *   robotName: 'ur5_robot',
 *   calibrationTypes: ['camera-intrinsic', 'hand-eye', 'kinematic'],
 *   sensorList: ['wrist_camera', 'base_camera', 'imu']
 * });
 *
 * @references
 * - ROS Camera Calibration: https://wiki.ros.org/camera_calibration
 * - Kalibr: https://github.com/ethz-asl/kalibr
 * - Robot Calibration: http://wiki.ros.org/robot_calibration
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    calibrationTypes = ['camera-intrinsic', 'extrinsic', 'kinematic'],
    sensorList = [],
    calibrationTarget = 'checkerboard',
    targetParameters = {},
    outputDir = 'robot-calibration-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const issues = [];
  const calibrationResults = {};

  ctx.log('info', `Starting Robot Calibration for ${robotName}`);
  ctx.log('info', `Calibration Types: ${calibrationTypes.join(', ')}`);

  // ============================================================================
  // PHASE 1: CALIBRATION PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Calibration Preparation and Target Setup');

  const preparation = await ctx.task(calibrationPreparationTask, {
    robotName,
    calibrationTypes,
    sensorList,
    calibrationTarget,
    targetParameters,
    outputDir
  });

  artifacts.push(...preparation.artifacts);

  // ============================================================================
  // PHASE 2: INTRINSIC CAMERA CALIBRATION
  // ============================================================================

  if (calibrationTypes.includes('camera-intrinsic')) {
    ctx.log('info', 'Phase 2: Intrinsic Camera Calibration');

    const intrinsicCalibration = await ctx.task(intrinsicCameraCalibrationTask, {
      robotName,
      sensorList,
      calibrationTarget,
      targetParameters,
      preparation,
      outputDir
    });

    artifacts.push(...intrinsicCalibration.artifacts);
    calibrationResults.intrinsic = intrinsicCalibration;
    if (intrinsicCalibration.issues) issues.push(...intrinsicCalibration.issues);
  }

  // ============================================================================
  // PHASE 3: EXTRINSIC SENSOR CALIBRATION
  // ============================================================================

  if (calibrationTypes.includes('extrinsic')) {
    ctx.log('info', 'Phase 3: Extrinsic Sensor Calibration (Sensor-to-Sensor Transforms)');

    const extrinsicCalibration = await ctx.task(extrinsicSensorCalibrationTask, {
      robotName,
      sensorList,
      preparation,
      intrinsicResults: calibrationResults.intrinsic,
      outputDir
    });

    artifacts.push(...extrinsicCalibration.artifacts);
    calibrationResults.extrinsic = extrinsicCalibration;
    if (extrinsicCalibration.issues) issues.push(...extrinsicCalibration.issues);
  }

  // ============================================================================
  // PHASE 4: KINEMATIC PARAMETER CALIBRATION
  // ============================================================================

  if (calibrationTypes.includes('kinematic')) {
    ctx.log('info', 'Phase 4: Kinematic Parameter Calibration (DH Parameters)');

    const kinematicCalibration = await ctx.task(kinematicCalibrationTask, {
      robotName,
      preparation,
      outputDir
    });

    artifacts.push(...kinematicCalibration.artifacts);
    calibrationResults.kinematic = kinematicCalibration;
    if (kinematicCalibration.issues) issues.push(...kinematicCalibration.issues);
  }

  // ============================================================================
  // PHASE 5: IMU CALIBRATION
  // ============================================================================

  if (calibrationTypes.includes('imu')) {
    ctx.log('info', 'Phase 5: IMU Bias and Scale Factor Calibration');

    const imuCalibration = await ctx.task(imuCalibrationTask, {
      robotName,
      sensorList,
      outputDir
    });

    artifacts.push(...imuCalibration.artifacts);
    calibrationResults.imu = imuCalibration;
    if (imuCalibration.issues) issues.push(...imuCalibration.issues);
  }

  // ============================================================================
  // PHASE 6: HAND-EYE CALIBRATION
  // ============================================================================

  if (calibrationTypes.includes('hand-eye')) {
    ctx.log('info', 'Phase 6: Hand-Eye Calibration (Camera-to-End-Effector)');

    const handEyeCalibration = await ctx.task(handEyeCalibrationTask, {
      robotName,
      sensorList,
      calibrationTarget,
      intrinsicResults: calibrationResults.intrinsic,
      outputDir
    });

    artifacts.push(...handEyeCalibration.artifacts);
    calibrationResults.handEye = handEyeCalibration;
    if (handEyeCalibration.issues) issues.push(...handEyeCalibration.issues);
  }

  // ============================================================================
  // PHASE 7: CALIBRATION VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Calibration Accuracy Validation');

  const validation = await ctx.task(calibrationValidationTask, {
    robotName,
    calibrationResults,
    calibrationTypes,
    outputDir
  });

  artifacts.push(...validation.artifacts);
  if (validation.issues) issues.push(...validation.issues);

  // Quality Gate: Calibration accuracy
  if (!validation.allCalibrationsPassed) {
    await ctx.breakpoint({
      question: `Calibration validation for ${robotName} found accuracy issues. Failed: ${validation.failedCalibrations.join(', ')}. Review and recalibrate?`,
      title: 'Calibration Accuracy Concerns',
      context: {
        runId: ctx.runId,
        failedCalibrations: validation.failedCalibrations,
        accuracyMetrics: validation.accuracyMetrics,
        files: validation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: CALIBRATION FILE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Calibration File Generation');

  const fileGeneration = await ctx.task(calibrationFileGenerationTask, {
    robotName,
    calibrationResults,
    validation,
    outputDir
  });

  artifacts.push(...fileGeneration.artifacts);

  // ============================================================================
  // PHASE 9: DOCUMENTATION AND PROCEDURES
  // ============================================================================

  ctx.log('info', 'Phase 9: Calibration Documentation and Procedures');

  const documentation = await ctx.task(calibrationDocumentationTask, {
    robotName,
    calibrationResults,
    validation,
    fileGeneration,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Robot Calibration Complete for ${robotName}. ${validation.passedCalibrations.length}/${calibrationTypes.length} calibrations passed. Review calibration package?`,
    title: 'Robot Calibration Complete',
    context: {
      runId: ctx.runId,
      summary: {
        robotName,
        calibrationTypes,
        passed: validation.passedCalibrations,
        failed: validation.failedCalibrations
      },
      files: [
        { path: documentation.docPath, format: 'markdown', label: 'Calibration Report' },
        ...fileGeneration.calibrationFiles.map(f => ({ path: f.path, format: 'yaml', label: f.type }))
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validation.allCalibrationsPassed,
    robotName,
    calibrationResults,
    calibrationFiles: fileGeneration.calibrationFiles,
    validation: {
      passed: validation.passedCalibrations,
      failed: validation.failedCalibrations,
      accuracyMetrics: validation.accuracyMetrics
    },
    issues,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/robotics-simulation/robot-calibration',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const calibrationPreparationTask = defineTask('calibration-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Calibration Preparation - ${args.robotName}`,
  agent: {
    name: 'calibration-engineer',
    prompt: {
      role: 'Robot Calibration Engineer',
      task: 'Prepare for robot calibration',
      context: args,
      instructions: [
        '1. Verify calibration target specifications',
        '2. Set up calibration environment (lighting, temperature)',
        '3. Prepare data collection scripts',
        '4. Configure sensor data recording',
        '5. Plan calibration poses/trajectories',
        '6. Set up ground truth measurement system if needed',
        '7. Verify robot repeatability',
        '8. Create calibration checklist',
        '9. Prepare calibration software tools',
        '10. Document environmental conditions'
      ],
      outputFormat: 'JSON with calibration preparation details'
    },
    outputSchema: {
      type: 'object',
      required: ['targetSetup', 'dataCollectionPlan', 'artifacts'],
      properties: {
        targetSetup: { type: 'object' },
        dataCollectionPlan: { type: 'object' },
        environmentConditions: { type: 'object' },
        calibrationPoses: { type: 'array', items: { type: 'object' } },
        softwareTools: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'calibration', 'preparation']
}));

export const intrinsicCameraCalibrationTask = defineTask('intrinsic-camera-calibration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Intrinsic Camera Calibration - ${args.robotName}`,
  agent: {
    name: 'calibration-engineer',
    prompt: {
      role: 'Robot Calibration Engineer',
      task: 'Perform intrinsic camera calibration',
      context: args,
      instructions: [
        '1. Capture calibration images from multiple angles',
        '2. Detect calibration pattern in images',
        '3. Run camera calibration algorithm',
        '4. Extract focal length (fx, fy)',
        '5. Extract principal point (cx, cy)',
        '6. Calculate distortion coefficients (k1, k2, p1, p2, k3)',
        '7. Compute reprojection error',
        '8. Validate calibration with test images',
        '9. Generate camera info file (camera_info.yaml)',
        '10. Document calibration accuracy'
      ],
      outputFormat: 'JSON with intrinsic calibration results'
    },
    outputSchema: {
      type: 'object',
      required: ['cameraMatrix', 'distortionCoeffs', 'reprojectionError', 'artifacts'],
      properties: {
        cameraMatrix: { type: 'object' },
        distortionCoeffs: { type: 'array', items: { type: 'number' } },
        reprojectionError: { type: 'number' },
        imageSize: { type: 'object' },
        calibrationImages: { type: 'number' },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'calibration', 'camera-intrinsic']
}));

export const extrinsicSensorCalibrationTask = defineTask('extrinsic-sensor-calibration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Extrinsic Sensor Calibration - ${args.robotName}`,
  agent: {
    name: 'calibration-engineer',
    prompt: {
      role: 'Robot Calibration Engineer',
      task: 'Perform extrinsic sensor-to-sensor calibration',
      context: args,
      instructions: [
        '1. Define sensor pairs to calibrate',
        '2. Collect synchronized sensor data',
        '3. Compute sensor-to-sensor transformations',
        '4. Calculate rotation matrices and translation vectors',
        '5. Validate with fiducial marker detection',
        '6. Compute calibration uncertainty',
        '7. Verify sensor-to-base transforms',
        '8. Update robot TF tree',
        '9. Test transform accuracy',
        '10. Generate extrinsic calibration files'
      ],
      outputFormat: 'JSON with extrinsic calibration results'
    },
    outputSchema: {
      type: 'object',
      required: ['transforms', 'calibrationAccuracy', 'artifacts'],
      properties: {
        transforms: { type: 'array', items: { type: 'object' } },
        calibrationAccuracy: { type: 'object' },
        tfUpdates: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'calibration', 'extrinsic']
}));

export const kinematicCalibrationTask = defineTask('kinematic-calibration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Kinematic Calibration - ${args.robotName}`,
  agent: {
    name: 'calibration-engineer',
    prompt: {
      role: 'Robot Calibration Engineer',
      task: 'Calibrate robot kinematic parameters',
      context: args,
      instructions: [
        '1. Collect end-effector poses at multiple configurations',
        '2. Use external measurement system (laser tracker, CMM)',
        '3. Set up kinematic parameter optimization',
        '4. Identify DH parameter errors',
        '5. Optimize joint offsets',
        '6. Calculate link length corrections',
        '7. Validate with independent measurements',
        '8. Update URDF with calibrated values',
        '9. Compute positional accuracy improvement',
        '10. Document calibration procedure'
      ],
      outputFormat: 'JSON with kinematic calibration results'
    },
    outputSchema: {
      type: 'object',
      required: ['dhCorrections', 'jointOffsets', 'accuracyImprovement', 'artifacts'],
      properties: {
        dhCorrections: { type: 'array', items: { type: 'object' } },
        jointOffsets: { type: 'array', items: { type: 'number' } },
        linkCorrections: { type: 'array', items: { type: 'object' } },
        accuracyImprovement: { type: 'object' },
        positionError: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'calibration', 'kinematic']
}));

export const imuCalibrationTask = defineTask('imu-calibration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: IMU Calibration - ${args.robotName}`,
  agent: {
    name: 'calibration-engineer',
    prompt: {
      role: 'Robot Calibration Engineer',
      task: 'Calibrate IMU biases and scale factors',
      context: args,
      instructions: [
        '1. Collect static IMU data for bias estimation',
        '2. Calculate accelerometer biases',
        '3. Calculate gyroscope biases',
        '4. Perform multi-position calibration',
        '5. Estimate scale factors',
        '6. Compute axis misalignment',
        '7. Characterize noise parameters',
        '8. Validate calibration with known motions',
        '9. Generate IMU calibration file',
        '10. Document temperature sensitivity'
      ],
      outputFormat: 'JSON with IMU calibration results'
    },
    outputSchema: {
      type: 'object',
      required: ['accelerometerBias', 'gyroscopeBias', 'scaleFactors', 'artifacts'],
      properties: {
        accelerometerBias: { type: 'array', items: { type: 'number' } },
        gyroscopeBias: { type: 'array', items: { type: 'number' } },
        scaleFactors: { type: 'object' },
        axisMisalignment: { type: 'object' },
        noiseParameters: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'calibration', 'imu']
}));

export const handEyeCalibrationTask = defineTask('hand-eye-calibration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Hand-Eye Calibration - ${args.robotName}`,
  agent: {
    name: 'calibration-engineer',
    prompt: {
      role: 'Robot Calibration Engineer',
      task: 'Perform hand-eye calibration',
      context: args,
      instructions: [
        '1. Determine calibration type (eye-in-hand or eye-to-hand)',
        '2. Collect robot poses and corresponding camera poses',
        '3. Detect calibration pattern in camera images',
        '4. Solve AX=XB or AX=ZB equation',
        '5. Compute camera-to-end-effector transform',
        '6. Validate with verification poses',
        '7. Compute calibration accuracy',
        '8. Generate transform file',
        '9. Test with pick-and-place operations',
        '10. Document calibration procedure'
      ],
      outputFormat: 'JSON with hand-eye calibration results'
    },
    outputSchema: {
      type: 'object',
      required: ['handEyeTransform', 'calibrationType', 'calibrationError', 'artifacts'],
      properties: {
        handEyeTransform: { type: 'object' },
        calibrationType: { type: 'string' },
        calibrationError: { type: 'object' },
        numPoses: { type: 'number' },
        validationResults: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'calibration', 'hand-eye']
}));

export const calibrationValidationTask = defineTask('calibration-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Calibration Validation - ${args.robotName}`,
  agent: {
    name: 'simulation-test-engineer',  // AG-012: Simulation Test Engineer Agent
    prompt: {
      role: 'Robotics Test Engineer',
      task: 'Validate calibration accuracy',
      context: args,
      instructions: [
        '1. Define validation test scenarios',
        '2. Measure reprojection errors for cameras',
        '3. Validate transform accuracy with ground truth',
        '4. Test kinematic accuracy at multiple poses',
        '5. Verify IMU drift over time',
        '6. Test hand-eye accuracy with grasping tasks',
        '7. Compare against acceptance criteria',
        '8. Document pass/fail for each calibration',
        '9. Identify recalibration needs',
        '10. Generate validation report'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['allCalibrationsPassed', 'passedCalibrations', 'failedCalibrations', 'artifacts'],
      properties: {
        allCalibrationsPassed: { type: 'boolean' },
        passedCalibrations: { type: 'array', items: { type: 'string' } },
        failedCalibrations: { type: 'array', items: { type: 'string' } },
        accuracyMetrics: { type: 'object' },
        validationTests: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'calibration', 'validation']
}));

export const calibrationFileGenerationTask = defineTask('calibration-file-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Calibration File Generation - ${args.robotName}`,
  agent: {
    name: 'robotics-architect',  // AG-001: Robotics System Architect Agent
    prompt: {
      role: 'Robotics Engineer',
      task: 'Generate calibration files',
      context: args,
      instructions: [
        '1. Generate camera_info.yaml for each camera',
        '2. Create sensor TF static transform files',
        '3. Update URDF with calibrated parameters',
        '4. Generate IMU calibration YAML',
        '5. Create hand-eye transform file',
        '6. Package calibration files',
        '7. Create calibration launch file',
        '8. Add calibration file versioning',
        '9. Create backup of previous calibration',
        '10. Document file locations and usage'
      ],
      outputFormat: 'JSON with calibration files'
    },
    outputSchema: {
      type: 'object',
      required: ['calibrationFiles', 'launchFile', 'artifacts'],
      properties: {
        calibrationFiles: { type: 'array', items: { type: 'object' } },
        launchFile: { type: 'string' },
        urdfUpdates: { type: 'object' },
        fileVersions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'calibration', 'file-generation']
}));

export const calibrationDocumentationTask = defineTask('calibration-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Calibration Documentation - ${args.robotName}`,
  agent: {
    name: 'robotics-documentation-specialist',  // AG-020: Robotics Documentation Specialist Agent
    prompt: {
      role: 'Technical Writer',
      task: 'Document calibration procedures and results',
      context: args,
      instructions: [
        '1. Create calibration report summary',
        '2. Document calibration procedures step-by-step',
        '3. Include accuracy metrics and acceptance criteria',
        '4. Add calibration target specifications',
        '5. Document environmental conditions',
        '6. Include troubleshooting guide',
        '7. Create recalibration schedule',
        '8. Document file locations and versions',
        '9. Add calibration history log',
        '10. Include lessons learned'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['docPath', 'procedures', 'artifacts'],
      properties: {
        docPath: { type: 'string' },
        procedures: { type: 'array', items: { type: 'object' } },
        recalibrationSchedule: { type: 'object' },
        troubleshooting: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'calibration', 'documentation']
}));
