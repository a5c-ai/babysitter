/**
 * @process specializations/robotics-simulation/visual-slam-implementation
 * @description Visual SLAM Implementation - Implement and tune visual SLAM system for robot localization
 * and mapping including algorithm selection, camera configuration, feature detection, loop closure,
 * visual-inertial fusion, and accuracy evaluation.
 * @inputs { robotName: string, slamAlgorithm?: string, cameraType?: string, imuAvailable?: boolean, outputDir?: string }
 * @outputs { success: boolean, slamConfig: object, accuracyMetrics: object, mapPath: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/visual-slam-implementation', {
 *   robotName: 'mobile_robot',
 *   slamAlgorithm: 'orb-slam3',
 *   cameraType: 'stereo',
 *   imuAvailable: true
 * });
 *
 * @references
 * - ORB-SLAM3: https://github.com/UZ-SLAMLab/ORB_SLAM3
 * - RTAB-Map: https://github.com/introlab/rtabmap_ros
 * - Google Cartographer: https://google-cartographer-ros.readthedocs.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    slamAlgorithm = 'orb-slam3',
    cameraType = 'stereo',
    imuAvailable = false,
    targetEnvironments = ['indoor'],
    outputDir = 'visual-slam-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const issues = [];

  ctx.log('info', `Starting Visual SLAM Implementation for ${robotName}`);
  ctx.log('info', `Algorithm: ${slamAlgorithm}, Camera: ${cameraType}, IMU: ${imuAvailable}`);

  // ============================================================================
  // PHASE 1: SLAM ALGORITHM SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: SLAM Algorithm Selection and Configuration');

  const algorithmSelection = await ctx.task(slamAlgorithmSelectionTask, {
    robotName,
    slamAlgorithm,
    cameraType,
    imuAvailable,
    targetEnvironments,
    outputDir
  });

  artifacts.push(...algorithmSelection.artifacts);

  // ============================================================================
  // PHASE 2: CAMERA CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Camera Parameters and Calibration Configuration');

  const cameraConfig = await ctx.task(cameraConfigurationTask, {
    robotName,
    cameraType,
    algorithmSelection,
    outputDir
  });

  artifacts.push(...cameraConfig.artifacts);

  // ============================================================================
  // PHASE 3: FEATURE DETECTION SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Visual Feature Detection and Tracking Setup');

  const featureDetection = await ctx.task(featureDetectionSetupTask, {
    robotName,
    slamAlgorithm,
    cameraConfig,
    outputDir
  });

  artifacts.push(...featureDetection.artifacts);

  // ============================================================================
  // PHASE 4: LOOP CLOSURE CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Loop Closure Detection Configuration');

  const loopClosure = await ctx.task(loopClosureConfigTask, {
    robotName,
    slamAlgorithm,
    featureDetection,
    outputDir
  });

  artifacts.push(...loopClosure.artifacts);

  // ============================================================================
  // PHASE 5: SLAM PARAMETER TUNING
  // ============================================================================

  ctx.log('info', 'Phase 5: SLAM Parameter Tuning');

  const parameterTuning = await ctx.task(slamParameterTuningTask, {
    robotName,
    slamAlgorithm,
    cameraType,
    featureDetection,
    loopClosure,
    outputDir
  });

  artifacts.push(...parameterTuning.artifacts);

  // ============================================================================
  // PHASE 6: VISUAL-INERTIAL FUSION
  // ============================================================================

  if (imuAvailable) {
    ctx.log('info', 'Phase 6: Visual-Inertial Fusion Setup');

    const viFusion = await ctx.task(visualInertialFusionTask, {
      robotName,
      slamAlgorithm,
      cameraConfig,
      outputDir
    });

    artifacts.push(...viFusion.artifacts);
  }

  // ============================================================================
  // PHASE 7: ENVIRONMENT TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Testing in Diverse Environments');

  const environmentTesting = await ctx.task(environmentTestingTask, {
    robotName,
    slamAlgorithm,
    targetEnvironments,
    parameterTuning,
    outputDir
  });

  artifacts.push(...environmentTesting.artifacts);
  if (environmentTesting.issues) issues.push(...environmentTesting.issues);

  // ============================================================================
  // PHASE 8: ACCURACY EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Accuracy Evaluation (Trajectory Error, Map Quality)');

  const accuracyEvaluation = await ctx.task(accuracyEvaluationTask, {
    robotName,
    environmentTesting,
    outputDir
  });

  artifacts.push(...accuracyEvaluation.artifacts);

  await ctx.breakpoint({
    question: `SLAM accuracy evaluation for ${robotName}: ATE=${accuracyEvaluation.ate}m, RPE=${accuracyEvaluation.rpe}m/s. Meets requirements: ${accuracyEvaluation.meetsRequirements}. Continue with optimization?`,
    title: 'SLAM Accuracy Review',
    context: {
      runId: ctx.runId,
      ate: accuracyEvaluation.ate,
      rpe: accuracyEvaluation.rpe,
      mapQuality: accuracyEvaluation.mapQuality,
      files: accuracyEvaluation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 9: REAL-TIME OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Real-Time Performance Optimization');

  const realTimeOptimization = await ctx.task(realTimeOptimizationTask, {
    robotName,
    slamAlgorithm,
    parameterTuning,
    accuracyEvaluation,
    outputDir
  });

  artifacts.push(...realTimeOptimization.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Visual SLAM Implementation Complete for ${robotName}. ATE: ${accuracyEvaluation.ate}m, Processing: ${realTimeOptimization.processingTime}ms. Review SLAM package?`,
    title: 'Visual SLAM Complete',
    context: {
      runId: ctx.runId,
      summary: {
        robotName,
        algorithm: slamAlgorithm,
        ate: accuracyEvaluation.ate,
        processingTime: realTimeOptimization.processingTime,
        realTimeFactor: realTimeOptimization.realTimeFactor
      },
      files: [
        { path: parameterTuning.configPath, format: 'yaml', label: 'SLAM Config' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: accuracyEvaluation.meetsRequirements,
    robotName,
    slamConfig: {
      algorithm: slamAlgorithm,
      parameters: parameterTuning.parameters,
      configPath: parameterTuning.configPath
    },
    accuracyMetrics: {
      ate: accuracyEvaluation.ate,
      rpe: accuracyEvaluation.rpe,
      mapQuality: accuracyEvaluation.mapQuality
    },
    mapPath: environmentTesting.mapPath,
    issues,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/robotics-simulation/visual-slam-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const slamAlgorithmSelectionTask = defineTask('slam-algorithm-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: SLAM Algorithm Selection - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: {
      role: 'Robotics Engineer',
      task: 'Select and configure SLAM algorithm',
      context: args,
      instructions: [
        '1. Evaluate SLAM algorithm options (ORB-SLAM3, RTAB-Map, Cartographer)',
        '2. Consider camera type compatibility',
        '3. Evaluate IMU integration support',
        '4. Consider computational requirements',
        '5. Assess map representation needs',
        '6. Consider loop closure capabilities',
        '7. Evaluate robustness to motion blur',
        '8. Consider localization vs mapping focus',
        '9. Document algorithm selection rationale',
        '10. Set up algorithm dependencies'
      ],
      outputFormat: 'JSON with algorithm selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedAlgorithm', 'dependencies', 'artifacts'],
      properties: {
        selectedAlgorithm: { type: 'string' },
        dependencies: { type: 'array', items: { type: 'string' } },
        capabilities: { type: 'object' },
        limitations: { type: 'array', items: { type: 'string' } },
        alternatives: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'visual-slam', 'algorithm-selection']
}));

export const cameraConfigurationTask = defineTask('camera-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Camera Configuration - ${args.robotName}`,
  agent: {
    name: 'sensor-engineer',
    prompt: {
      role: 'Sensor Engineer',
      task: 'Configure camera parameters for SLAM',
      context: args,
      instructions: [
        '1. Set camera intrinsic parameters',
        '2. Configure distortion coefficients',
        '3. Set up stereo baseline (if stereo)',
        '4. Configure image resolution',
        '5. Set frame rate',
        '6. Configure exposure and gain',
        '7. Set up rectification (if stereo)',
        '8. Configure depth range (if RGB-D)',
        '9. Set up camera-IMU extrinsics (if available)',
        '10. Create camera calibration file'
      ],
      outputFormat: 'JSON with camera configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['cameraParams', 'calibrationFile', 'artifacts'],
      properties: {
        cameraParams: { type: 'object' },
        calibrationFile: { type: 'string' },
        stereoConfig: { type: 'object' },
        depthConfig: { type: 'object' },
        imuExtrinsics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'visual-slam', 'camera']
}));

export const featureDetectionSetupTask = defineTask('feature-detection-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Feature Detection Setup - ${args.robotName}`,
  agent: {
    name: 'computer-vision-engineer',
    prompt: {
      role: 'Computer Vision Engineer',
      task: 'Set up visual feature detection and tracking',
      context: args,
      instructions: [
        '1. Configure feature detector (ORB, SIFT, SURF)',
        '2. Set number of features to extract',
        '3. Configure feature distribution',
        '4. Set up descriptor computation',
        '5. Configure feature matching strategy',
        '6. Set matching thresholds',
        '7. Configure optical flow tracking',
        '8. Set up feature aging/culling',
        '9. Test feature detection quality',
        '10. Document feature parameters'
      ],
      outputFormat: 'JSON with feature detection setup'
    },
    outputSchema: {
      type: 'object',
      required: ['featureConfig', 'matchingConfig', 'artifacts'],
      properties: {
        featureConfig: { type: 'object' },
        matchingConfig: { type: 'object' },
        detectorType: { type: 'string' },
        numFeatures: { type: 'number' },
        trackingConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'visual-slam', 'features']
}));

export const loopClosureConfigTask = defineTask('loop-closure-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Loop Closure Configuration - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: {
      role: 'Robotics Engineer',
      task: 'Configure loop closure detection',
      context: args,
      instructions: [
        '1. Configure bag-of-words vocabulary',
        '2. Set loop detection thresholds',
        '3. Configure geometric verification',
        '4. Set up pose graph optimization',
        '5. Configure loop closure frequency',
        '6. Set minimum inlier threshold',
        '7. Configure multi-session loop closure',
        '8. Set up loop closure validation',
        '9. Test loop closure detection',
        '10. Document loop closure parameters'
      ],
      outputFormat: 'JSON with loop closure configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['loopClosureConfig', 'vocabularyPath', 'artifacts'],
      properties: {
        loopClosureConfig: { type: 'object' },
        vocabularyPath: { type: 'string' },
        detectionThreshold: { type: 'number' },
        geometricVerification: { type: 'object' },
        poseGraphConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'visual-slam', 'loop-closure']
}));

export const slamParameterTuningTask = defineTask('slam-parameter-tuning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: SLAM Parameter Tuning - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: {
      role: 'Robotics Engineer',
      task: 'Tune SLAM parameters',
      context: args,
      instructions: [
        '1. Set keyframe selection thresholds',
        '2. Configure local mapping parameters',
        '3. Set map point culling criteria',
        '4. Configure bundle adjustment settings',
        '5. Set tracking loss recovery parameters',
        '6. Configure map scale initialization',
        '7. Set relocalization parameters',
        '8. Configure map saving/loading',
        '9. Create comprehensive config file',
        '10. Document parameter choices'
      ],
      outputFormat: 'JSON with tuned parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['parameters', 'configPath', 'artifacts'],
      properties: {
        parameters: { type: 'object' },
        configPath: { type: 'string' },
        keyframeConfig: { type: 'object' },
        mappingConfig: { type: 'object' },
        trackingConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'visual-slam', 'tuning']
}));

export const visualInertialFusionTask = defineTask('visual-inertial-fusion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Visual-Inertial Fusion - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: {
      role: 'Robotics Engineer',
      task: 'Set up visual-inertial fusion',
      context: args,
      instructions: [
        '1. Configure IMU noise parameters',
        '2. Set camera-IMU time synchronization',
        '3. Configure IMU preintegration',
        '4. Set gravity alignment',
        '5. Configure scale estimation',
        '6. Set bias estimation parameters',
        '7. Configure tightly-coupled fusion',
        '8. Test VI-SLAM performance',
        '9. Compare to visual-only',
        '10. Document VI configuration'
      ],
      outputFormat: 'JSON with VI fusion setup'
    },
    outputSchema: {
      type: 'object',
      required: ['viConfig', 'imuNoiseParams', 'artifacts'],
      properties: {
        viConfig: { type: 'object' },
        imuNoiseParams: { type: 'object' },
        timeSyncConfig: { type: 'object' },
        biasEstimation: { type: 'object' },
        performanceComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'visual-slam', 'vi-fusion']
}));

export const environmentTestingTask = defineTask('environment-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Environment Testing - ${args.robotName}`,
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Robotics Test Engineer',
      task: 'Test SLAM in diverse environments',
      context: args,
      instructions: [
        '1. Test in indoor structured environments',
        '2. Test in outdoor environments',
        '3. Test with varying lighting',
        '4. Test with dynamic objects',
        '5. Test with texture-poor areas',
        '6. Test with fast motion',
        '7. Test with occlusions',
        '8. Test long-duration operation',
        '9. Generate test reports',
        '10. Identify failure cases'
      ],
      outputFormat: 'JSON with environment testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['testResults', 'mapPath', 'artifacts'],
      properties: {
        testResults: { type: 'array', items: { type: 'object' } },
        mapPath: { type: 'string' },
        successRate: { type: 'object' },
        failureCases: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'visual-slam', 'testing']
}));

export const accuracyEvaluationTask = defineTask('accuracy-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Accuracy Evaluation - ${args.robotName}`,
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Robotics Test Engineer',
      task: 'Evaluate SLAM accuracy',
      context: args,
      instructions: [
        '1. Compute Absolute Trajectory Error (ATE)',
        '2. Compute Relative Pose Error (RPE)',
        '3. Evaluate map quality metrics',
        '4. Compare to ground truth',
        '5. Analyze drift over time',
        '6. Evaluate loop closure accuracy',
        '7. Measure relocalization accuracy',
        '8. Compare across environments',
        '9. Generate accuracy report',
        '10. Assess against requirements'
      ],
      outputFormat: 'JSON with accuracy evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['ate', 'rpe', 'mapQuality', 'meetsRequirements', 'artifacts'],
      properties: {
        ate: { type: 'number' },
        rpe: { type: 'number' },
        mapQuality: { type: 'object' },
        meetsRequirements: { type: 'boolean' },
        driftAnalysis: { type: 'object' },
        comparisonResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'visual-slam', 'accuracy']
}));

export const realTimeOptimizationTask = defineTask('real-time-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Real-Time Optimization - ${args.robotName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Optimize for real-time performance',
      context: args,
      instructions: [
        '1. Profile processing time per frame',
        '2. Optimize feature extraction',
        '3. Reduce matching complexity',
        '4. Optimize bundle adjustment',
        '5. Configure parallel processing',
        '6. Reduce memory footprint',
        '7. Optimize loop closure detection',
        '8. Balance accuracy vs speed',
        '9. Test real-time performance',
        '10. Document optimizations'
      ],
      outputFormat: 'JSON with optimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['processingTime', 'realTimeFactor', 'artifacts'],
      properties: {
        processingTime: { type: 'number' },
        realTimeFactor: { type: 'number' },
        optimizations: { type: 'array', items: { type: 'object' } },
        componentTimes: { type: 'object' },
        memoryUsage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'visual-slam', 'optimization']
}));
