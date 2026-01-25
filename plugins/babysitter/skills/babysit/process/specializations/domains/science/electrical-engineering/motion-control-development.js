/**
 * @process specializations/domains/science/electrical-engineering/motion-control-development
 * @description Motion Control System Development - Guide the development of motion control systems for robotics,
 * CNC machines, and automation. Covers servo drives, trajectory planning, and multi-axis coordination.
 * @inputs { systemName: string, motionRequirements: object, motorSelection?: object, loadCharacteristics?: object }
 * @outputs { success: boolean, motionSystem: object, controlLoops: object, trajectoryPlanning: object, validation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/motion-control-development', {
 *   systemName: 'Pick-and-Place Robot',
 *   motionRequirements: { axes: 4, maxSpeed: '2m/s', accuracy: '0.1mm', repeatability: '0.05mm' },
 *   loadCharacteristics: { inertia: '0.5kg-m2', friction: 'moderate' }
 * });
 *
 * @references
 * - PLCopen Motion Control Standards
 * - IEC 61800 Series (Adjustable Speed Electrical Power Drive Systems)
 * - Servo System Design Guidelines
 * - Motion Control Best Practices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName,
    motionRequirements,
    motorSelection = {},
    loadCharacteristics = {}
  } = inputs;

  // Phase 1: Define Motion Requirements
  const requirementsDefinition = await ctx.task(requirementsDefinitionTask, {
    systemName,
    motionRequirements,
    loadCharacteristics
  });

  // Phase 2: Select Motor and Drive System
  const motorDriveSelection = await ctx.task(motorDriveSelectionTask, {
    systemName,
    requirements: requirementsDefinition.specifications,
    motorSelection,
    loadCharacteristics
  });

  // Breakpoint: Review motor/drive selection
  await ctx.breakpoint({
    question: `Review motor and drive selection for ${systemName}. Motor: ${motorDriveSelection.selectedMotor}. Proceed with control design?`,
    title: 'Motor/Drive Selection Review',
    context: {
      runId: ctx.runId,
      systemName,
      selection: motorDriveSelection,
      files: [{
        path: `artifacts/phase2-motor-selection.json`,
        format: 'json',
        content: motorDriveSelection
      }]
    }
  });

  // Phase 3: Design Velocity and Position Control Loops
  const controlLoopDesign = await ctx.task(controlLoopDesignTask, {
    systemName,
    motorDrive: motorDriveSelection,
    requirements: requirementsDefinition.specifications,
    loadCharacteristics
  });

  // Phase 4: Implement Trajectory Generation Algorithms
  const trajectoryPlanning = await ctx.task(trajectoryPlanningTask, {
    systemName,
    requirements: requirementsDefinition.specifications,
    controlLoops: controlLoopDesign.loops,
    motionProfile: motionRequirements.profile
  });

  // Breakpoint: Review trajectory planning
  await ctx.breakpoint({
    question: `Review trajectory planning for ${systemName}. Profile type: ${trajectoryPlanning.profileType}. Proceed with drive configuration?`,
    title: 'Trajectory Planning Review',
    context: {
      runId: ctx.runId,
      trajectoryPlanning,
      files: [{
        path: `artifacts/phase4-trajectory.json`,
        format: 'json',
        content: trajectoryPlanning
      }]
    }
  });

  // Phase 5: Configure Servo Drive Parameters
  const driveConfiguration = await ctx.task(driveConfigurationTask, {
    systemName,
    motorDrive: motorDriveSelection,
    controlLoops: controlLoopDesign.loops,
    trajectoryPlanning
  });

  // Phase 6: Tune Control Loops for Optimal Response
  const loopTuning = await ctx.task(loopTuningTask, {
    systemName,
    controlLoops: controlLoopDesign.loops,
    driveConfig: driveConfiguration,
    requirements: requirementsDefinition.specifications
  });

  // Phase 7: Test Motion Profiles and Accuracy
  const motionTesting = await ctx.task(motionTestingTask, {
    systemName,
    tunedSystem: loopTuning.tunedSystem,
    trajectoryPlanning,
    requirements: requirementsDefinition.specifications
  });

  // Quality Gate: Motion accuracy must meet specifications
  if (!motionTesting.meetsSpecs) {
    await ctx.breakpoint({
      question: `Motion testing shows accuracy: ${motionTesting.achievedAccuracy}, required: ${requirementsDefinition.specifications.accuracy}. Iterate tuning?`,
      title: 'Accuracy Gap',
      context: {
        runId: ctx.runId,
        testResults: motionTesting.results,
        recommendations: motionTesting.recommendations
      }
    });
  }

  // Phase 8: Validate System Performance Under Load
  const loadValidation = await ctx.task(loadValidationTask, {
    systemName,
    tunedSystem: loopTuning.tunedSystem,
    loadCharacteristics,
    requirements: requirementsDefinition.specifications,
    motionTestResults: motionTesting.results
  });

  // Final Breakpoint: System Approval
  await ctx.breakpoint({
    question: `Motion control system complete for ${systemName}. Performance under load: ${loadValidation.passed ? 'PASSED' : 'NEEDS ATTENTION'}. Approve?`,
    title: 'System Approval',
    context: {
      runId: ctx.runId,
      systemName,
      performanceSummary: loadValidation.summary,
      files: [
        { path: `artifacts/motion-system.json`, format: 'json', content: loopTuning.tunedSystem },
        { path: `artifacts/motion-report.md`, format: 'markdown', content: loadValidation.markdown }
      ]
    }
  });

  return {
    success: true,
    systemName,
    motionSystem: {
      motor: motorDriveSelection.selectedMotor,
      drive: motorDriveSelection.selectedDrive,
      configuration: driveConfiguration
    },
    controlLoops: loopTuning.tunedSystem,
    trajectoryPlanning: trajectoryPlanning,
    validation: {
      motionTests: motionTesting.results,
      loadTests: loadValidation.results,
      meetsSpecs: loadValidation.passed
    },
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/motion-control-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const requirementsDefinitionTask = defineTask('requirements-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Definition - ${args.systemName}`,
  agent: {
    name: 'motion-control-specialist',
    prompt: {
      role: 'Motion Control Systems Engineer',
      task: 'Define motion requirements and specifications',
      context: {
        systemName: args.systemName,
        motionRequirements: args.motionRequirements,
        loadCharacteristics: args.loadCharacteristics
      },
      instructions: [
        '1. Define number of axes and coordination requirements',
        '2. Specify speed requirements (max velocity, acceleration, jerk)',
        '3. Define positioning accuracy and repeatability',
        '4. Specify load characteristics (inertia, friction, external forces)',
        '5. Define duty cycle and thermal considerations',
        '6. Specify motion profile requirements (trapezoidal, S-curve, PVT)',
        '7. Define homing and limit switch requirements',
        '8. Specify communication interface requirements',
        '9. Define safety and emergency stop requirements',
        '10. Document environmental and mounting constraints'
      ],
      outputFormat: 'JSON object with motion specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications'],
      properties: {
        specifications: {
          type: 'object',
          properties: {
            axes: { type: 'number' },
            speed: { type: 'object' },
            accuracy: { type: 'string' },
            repeatability: { type: 'string' },
            load: { type: 'object' },
            profile: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'motion-control', 'requirements']
}));

export const motorDriveSelectionTask = defineTask('motor-drive-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Motor/Drive Selection - ${args.systemName}`,
  agent: {
    name: 'motion-control-specialist',
    prompt: {
      role: 'Servo Systems Engineer',
      task: 'Select motor and drive system',
      context: {
        systemName: args.systemName,
        requirements: args.requirements,
        motorSelection: args.motorSelection,
        loadCharacteristics: args.loadCharacteristics
      },
      instructions: [
        '1. Calculate required torque (continuous and peak)',
        '2. Calculate required speed',
        '3. Match motor inertia to load inertia',
        '4. Select motor type (AC servo, stepper, brushless DC)',
        '5. Size motor for thermal capacity',
        '6. Select appropriate encoder/feedback device',
        '7. Select servo drive with appropriate ratings',
        '8. Verify drive-motor compatibility',
        '9. Consider cable lengths and voltage drop',
        '10. Document selection rationale'
      ],
      outputFormat: 'JSON object with motor/drive selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedMotor', 'selectedDrive'],
      properties: {
        selectedMotor: { type: 'string' },
        motorSpecs: { type: 'object' },
        selectedDrive: { type: 'string' },
        driveSpecs: { type: 'object' },
        feedbackDevice: { type: 'object' },
        inertiaMatch: { type: 'object' },
        sizingCalculations: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'motion-control', 'motor-selection']
}));

export const controlLoopDesignTask = defineTask('control-loop-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Control Loop Design - ${args.systemName}`,
  agent: {
    name: 'motion-control-specialist',
    prompt: {
      role: 'Servo Control Systems Engineer',
      task: 'Design velocity and position control loops',
      context: {
        systemName: args.systemName,
        motorDrive: args.motorDrive,
        requirements: args.requirements,
        loadCharacteristics: args.loadCharacteristics
      },
      instructions: [
        '1. Design current/torque loop (typically drive-internal)',
        '2. Design velocity loop with PI controller',
        '3. Design position loop with P or PID controller',
        '4. Calculate loop bandwidths based on requirements',
        '5. Design feedforward compensation (velocity, acceleration)',
        '6. Design friction compensation if needed',
        '7. Implement disturbance observer if beneficial',
        '8. Design notch filters for mechanical resonance',
        '9. Define loop gains and time constants',
        '10. Verify stability margins'
      ],
      outputFormat: 'JSON object with control loop design'
    },
    outputSchema: {
      type: 'object',
      required: ['loops'],
      properties: {
        loops: {
          type: 'object',
          properties: {
            currentLoop: { type: 'object' },
            velocityLoop: { type: 'object' },
            positionLoop: { type: 'object' },
            feedforward: { type: 'object' },
            filters: { type: 'array', items: { type: 'object' } }
          }
        },
        bandwidths: { type: 'object' },
        stabilityMargins: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'motion-control', 'control-loops']
}));

export const trajectoryPlanningTask = defineTask('trajectory-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Trajectory Planning - ${args.systemName}`,
  agent: {
    name: 'motion-control-specialist',
    prompt: {
      role: 'Motion Planning Engineer',
      task: 'Implement trajectory generation algorithms',
      context: {
        systemName: args.systemName,
        requirements: args.requirements,
        controlLoops: args.controlLoops,
        motionProfile: args.motionProfile
      },
      instructions: [
        '1. Select trajectory profile type (trapezoidal, S-curve, polynomial)',
        '2. Implement position profile generator',
        '3. Calculate velocity and acceleration profiles',
        '4. Implement jerk limiting for smooth motion',
        '5. Design multi-axis coordination/interpolation',
        '6. Implement path blending between segments',
        '7. Design cam/gearing functions if needed',
        '8. Implement electronic gearing',
        '9. Design PVT (position-velocity-time) mode',
        '10. Document trajectory planning algorithms'
      ],
      outputFormat: 'JSON object with trajectory planning'
    },
    outputSchema: {
      type: 'object',
      required: ['profileType', 'trajectoryGenerator'],
      properties: {
        profileType: { type: 'string' },
        trajectoryGenerator: {
          type: 'object',
          properties: {
            positionProfile: { type: 'object' },
            velocityProfile: { type: 'object' },
            accelerationProfile: { type: 'object' },
            jerkLimits: { type: 'object' }
          }
        },
        interpolation: { type: 'object' },
        coordination: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'motion-control', 'trajectory']
}));

export const driveConfigurationTask = defineTask('drive-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Drive Configuration - ${args.systemName}`,
  agent: {
    name: 'motion-control-specialist',
    prompt: {
      role: 'Servo Drive Configuration Specialist',
      task: 'Configure servo drive parameters',
      context: {
        systemName: args.systemName,
        motorDrive: args.motorDrive,
        controlLoops: args.controlLoops,
        trajectoryPlanning: args.trajectoryPlanning
      },
      instructions: [
        '1. Configure motor parameters in drive',
        '2. Set encoder/feedback configuration',
        '3. Configure current limits and protection',
        '4. Set velocity and position limits',
        '5. Configure control loop parameters',
        '6. Set up I/O and communication',
        '7. Configure homing routine',
        '8. Set up limit switch handling',
        '9. Configure fault handling and recovery',
        '10. Document all drive parameters'
      ],
      outputFormat: 'JSON object with drive configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration'],
      properties: {
        configuration: {
          type: 'object',
          properties: {
            motorParams: { type: 'object' },
            feedbackConfig: { type: 'object' },
            limits: { type: 'object' },
            loopParams: { type: 'object' },
            ioConfig: { type: 'object' },
            homingConfig: { type: 'object' },
            faultConfig: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'motion-control', 'drive-config']
}));

export const loopTuningTask = defineTask('loop-tuning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Loop Tuning - ${args.systemName}`,
  agent: {
    name: 'motion-control-specialist',
    prompt: {
      role: 'Servo Tuning Specialist',
      task: 'Tune control loops for optimal response',
      context: {
        systemName: args.systemName,
        controlLoops: args.controlLoops,
        driveConfig: args.driveConfig,
        requirements: args.requirements
      },
      instructions: [
        '1. Tune current loop (if accessible)',
        '2. Tune velocity loop for fast response with minimal overshoot',
        '3. Tune position loop for accuracy and stability',
        '4. Optimize feedforward gains',
        '5. Tune notch filters for resonance suppression',
        '6. Balance stability vs. response speed',
        '7. Test with actual load',
        '8. Verify following error under motion',
        '9. Test disturbance rejection',
        '10. Document final tuning parameters'
      ],
      outputFormat: 'JSON object with tuned system'
    },
    outputSchema: {
      type: 'object',
      required: ['tunedSystem'],
      properties: {
        tunedSystem: {
          type: 'object',
          properties: {
            velocityLoopGains: { type: 'object' },
            positionLoopGains: { type: 'object' },
            feedforwardGains: { type: 'object' },
            filterSettings: { type: 'object' }
          }
        },
        tuningResults: { type: 'object' },
        stabilityVerification: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'motion-control', 'tuning']
}));

export const motionTestingTask = defineTask('motion-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Motion Testing - ${args.systemName}`,
  agent: {
    name: 'motion-control-specialist',
    prompt: {
      role: 'Motion Systems Test Engineer',
      task: 'Test motion profiles and accuracy',
      context: {
        systemName: args.systemName,
        tunedSystem: args.tunedSystem,
        trajectoryPlanning: args.trajectoryPlanning,
        requirements: args.requirements
      },
      instructions: [
        '1. Test point-to-point motion accuracy',
        '2. Measure repeatability over multiple cycles',
        '3. Test velocity profile accuracy',
        '4. Measure settling time',
        '5. Test contouring accuracy (for multi-axis)',
        '6. Measure following error during motion',
        '7. Test homing accuracy and repeatability',
        '8. Verify motion within speed and acceleration limits',
        '9. Compare results to specifications',
        '10. Document test results and any deficiencies'
      ],
      outputFormat: 'JSON object with motion test results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'meetsSpecs', 'achievedAccuracy'],
      properties: {
        results: {
          type: 'object',
          properties: {
            positionAccuracy: { type: 'string' },
            repeatability: { type: 'string' },
            settlingTime: { type: 'string' },
            followingError: { type: 'string' }
          }
        },
        meetsSpecs: { type: 'boolean' },
        achievedAccuracy: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'motion-control', 'testing']
}));

export const loadValidationTask = defineTask('load-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Load Validation - ${args.systemName}`,
  agent: {
    name: 'motion-control-specialist',
    prompt: {
      role: 'Motion Systems Validation Engineer',
      task: 'Validate system performance under load',
      context: {
        systemName: args.systemName,
        tunedSystem: args.tunedSystem,
        loadCharacteristics: args.loadCharacteristics,
        requirements: args.requirements,
        motionTestResults: args.motionTestResults
      },
      instructions: [
        '1. Test with actual application load',
        '2. Verify accuracy under loaded conditions',
        '3. Test thermal performance during duty cycle',
        '4. Verify protection features operate correctly',
        '5. Test emergency stop response',
        '6. Verify fault handling and recovery',
        '7. Test long-term repeatability',
        '8. Verify noise and vibration levels',
        '9. Generate performance report',
        '10. Document commissioning results'
      ],
      outputFormat: 'JSON object with load validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'results', 'summary'],
      properties: {
        passed: { type: 'boolean' },
        results: {
          type: 'object',
          properties: {
            loadedAccuracy: { type: 'string' },
            thermalPerformance: { type: 'object' },
            protectionTests: { type: 'object' },
            reliability: { type: 'object' }
          }
        },
        summary: { type: 'string' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'motion-control', 'validation']
}));
