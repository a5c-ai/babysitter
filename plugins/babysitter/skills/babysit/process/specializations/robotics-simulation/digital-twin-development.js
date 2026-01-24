/**
 * @process specializations/robotics-simulation/digital-twin-development
 * @description Digital Twin Development - Create accurate digital twin of physical robot for development and
 * testing with bidirectional communication, state synchronization, hardware-in-the-loop testing, and
 * sim-to-real validation.
 * @inputs { robotName: string, physicalRobotInterface?: string, syncFrequency?: number, outputDir?: string }
 * @outputs { success: boolean, digitalTwinPath: string, communicationBridge: object, validationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/robotics-simulation/digital-twin-development', {
 *   robotName: 'ur10_arm',
 *   physicalRobotInterface: 'ros2_control',
 *   syncFrequency: 100
 * });
 *
 * @references
 * - Reality Gap: https://arxiv.org/abs/2011.12820
 * - Digital Twins: https://ieeexplore.ieee.org/document/9387482
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    robotName,
    physicalRobotInterface = 'ros2_control',
    syncFrequency = 100,
    hilEnabled = true,
    realTimeSync = true,
    outputDir = 'digital-twin-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const issues = [];

  ctx.log('info', `Starting Digital Twin Development for ${robotName}`);
  ctx.log('info', `Interface: ${physicalRobotInterface}, Sync: ${syncFrequency}Hz`);

  // ============================================================================
  // PHASE 1: PHYSICAL ROBOT MODELING
  // ============================================================================

  ctx.log('info', 'Phase 1: Accurate Physical Robot Modeling');

  const physicalModeling = await ctx.task(physicalRobotModelingTask, {
    robotName,
    physicalRobotInterface,
    outputDir
  });

  artifacts.push(...physicalModeling.artifacts);

  // ============================================================================
  // PHASE 2: BIDIRECTIONAL COMMUNICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Bidirectional Robot-Sim Communication Setup');

  const communicationSetup = await ctx.task(bidirectionalCommunicationTask, {
    robotName,
    physicalRobotInterface,
    syncFrequency,
    realTimeSync,
    outputDir
  });

  artifacts.push(...communicationSetup.artifacts);

  // ============================================================================
  // PHASE 3: STATE SYNCHRONIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Robot State Synchronization');

  const stateSync = await ctx.task(stateSynchronizationTask, {
    robotName,
    communicationSetup,
    syncFrequency,
    outputDir
  });

  artifacts.push(...stateSync.artifacts);

  // ============================================================================
  // PHASE 4: SIMULATION FIDELITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Simulation Fidelity Validation Against Real Robot');

  const fidelityValidation = await ctx.task(fidelityValidationTask, {
    robotName,
    physicalModeling,
    stateSync,
    outputDir
  });

  artifacts.push(...fidelityValidation.artifacts);
  if (fidelityValidation.issues) issues.push(...fidelityValidation.issues);

  await ctx.breakpoint({
    question: `Fidelity validation for ${robotName}: ${fidelityValidation.fidelityScore}% match. ${fidelityValidation.discrepancies.length} discrepancies found. Continue with HIL setup?`,
    title: 'Fidelity Validation Review',
    context: {
      runId: ctx.runId,
      fidelityScore: fidelityValidation.fidelityScore,
      discrepancies: fidelityValidation.discrepancies,
      files: fidelityValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 5: HARDWARE-IN-THE-LOOP TESTING
  // ============================================================================

  if (hilEnabled) {
    ctx.log('info', 'Phase 5: Hardware-in-the-Loop (HIL) Testing Implementation');

    const hilSetup = await ctx.task(hilTestingTask, {
      robotName,
      communicationSetup,
      physicalRobotInterface,
      outputDir
    });

    artifacts.push(...hilSetup.artifacts);
  }

  // ============================================================================
  // PHASE 6: SIM-TO-REAL TRANSFER VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Sim-to-Real Transfer Validation Tests');

  const simToRealValidation = await ctx.task(simToRealValidationTask, {
    robotName,
    physicalModeling,
    fidelityValidation,
    outputDir
  });

  artifacts.push(...simToRealValidation.artifacts);
  if (simToRealValidation.issues) issues.push(...simToRealValidation.issues);

  // ============================================================================
  // PHASE 7: REALITY GAP MONITORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Reality Gap Monitoring and Reduction');

  const realityGapMonitoring = await ctx.task(realityGapMonitoringTask, {
    robotName,
    fidelityValidation,
    simToRealValidation,
    outputDir
  });

  artifacts.push(...realityGapMonitoring.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Digital Twin Documentation');

  const documentation = await ctx.task(digitalTwinDocumentationTask, {
    robotName,
    physicalModeling,
    communicationSetup,
    fidelityValidation,
    realityGapMonitoring,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Digital Twin Complete for ${robotName}. Fidelity: ${fidelityValidation.fidelityScore}%. Reality Gap: ${realityGapMonitoring.gapMetrics.overall}. Review digital twin package?`,
    title: 'Digital Twin Complete',
    context: {
      runId: ctx.runId,
      summary: {
        robotName,
        fidelityScore: fidelityValidation.fidelityScore,
        realityGap: realityGapMonitoring.gapMetrics,
        hilEnabled
      },
      files: [
        { path: documentation.docPath, format: 'markdown', label: 'Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: fidelityValidation.fidelityScore >= 90,
    robotName,
    digitalTwinPath: physicalModeling.modelPath,
    communicationBridge: communicationSetup.bridgeConfig,
    validationResults: {
      fidelityScore: fidelityValidation.fidelityScore,
      simToRealGap: simToRealValidation.gapMetrics,
      realityGap: realityGapMonitoring.gapMetrics
    },
    issues,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/robotics-simulation/digital-twin-development',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const physicalRobotModelingTask = defineTask('physical-robot-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Physical Robot Modeling - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: {
      role: 'Robotics Engineer',
      task: 'Model physical robot accurately for digital twin',
      context: args,
      instructions: [
        '1. Measure physical robot dimensions precisely',
        '2. Characterize joint dynamics (friction, damping, backlash)',
        '3. Model actuator dynamics (motor models, gear ratios)',
        '4. Capture sensor characteristics and noise',
        '5. Document mass and inertia properties',
        '6. Model end-effector and tool characteristics',
        '7. Capture controller latencies',
        '8. Document environmental interactions',
        '9. Create high-fidelity simulation model',
        '10. Validate model against measurements'
      ],
      outputFormat: 'JSON with physical modeling details'
    },
    outputSchema: {
      type: 'object',
      required: ['modelPath', 'dynamicsModel', 'sensorModels', 'artifacts'],
      properties: {
        modelPath: { type: 'string' },
        dynamicsModel: { type: 'object' },
        sensorModels: { type: 'array', items: { type: 'object' } },
        actuatorModels: { type: 'array', items: { type: 'object' } },
        measurements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'digital-twin', 'physical-modeling']
}));

export const bidirectionalCommunicationTask = defineTask('bidirectional-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Bidirectional Communication - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: {
      role: 'Robotics Software Engineer',
      task: 'Implement bidirectional robot-sim communication',
      context: args,
      instructions: [
        '1. Design communication architecture',
        '2. Implement robot state publisher',
        '3. Create simulation state subscriber',
        '4. Implement command forwarding',
        '5. Add message synchronization',
        '6. Handle communication latency',
        '7. Implement error recovery',
        '8. Add bandwidth optimization',
        '9. Create connection monitoring',
        '10. Document communication protocol'
      ],
      outputFormat: 'JSON with communication setup'
    },
    outputSchema: {
      type: 'object',
      required: ['bridgeConfig', 'topics', 'latency', 'artifacts'],
      properties: {
        bridgeConfig: { type: 'object' },
        topics: { type: 'array', items: { type: 'object' } },
        latency: { type: 'object' },
        bandwidth: { type: 'object' },
        errorHandling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'digital-twin', 'communication']
}));

export const stateSynchronizationTask = defineTask('state-synchronization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: State Synchronization - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: {
      role: 'Robotics Software Engineer',
      task: 'Implement robot state synchronization',
      context: args,
      instructions: [
        '1. Synchronize joint positions',
        '2. Sync joint velocities and torques',
        '3. Synchronize sensor data streams',
        '4. Handle timestamp alignment',
        '5. Implement state interpolation',
        '6. Add state prediction for latency',
        '7. Handle state divergence',
        '8. Implement resynchronization',
        '9. Add logging for analysis',
        '10. Document sync parameters'
      ],
      outputFormat: 'JSON with state sync configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['syncConfig', 'stateVariables', 'artifacts'],
      properties: {
        syncConfig: { type: 'object' },
        stateVariables: { type: 'array', items: { type: 'string' } },
        syncFrequency: { type: 'number' },
        interpolationMethod: { type: 'string' },
        divergenceThresholds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'digital-twin', 'synchronization']
}));

export const fidelityValidationTask = defineTask('fidelity-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Fidelity Validation - ${args.robotName}`,
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Robotics Test Engineer',
      task: 'Validate simulation fidelity against real robot',
      context: args,
      instructions: [
        '1. Design validation test scenarios',
        '2. Execute same trajectories on sim and real',
        '3. Compare joint position tracking',
        '4. Compare sensor data outputs',
        '5. Measure timing and latency differences',
        '6. Quantify dynamics discrepancies',
        '7. Test edge cases and limits',
        '8. Calculate fidelity metrics',
        '9. Identify sources of discrepancy',
        '10. Document validation results'
      ],
      outputFormat: 'JSON with fidelity validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['fidelityScore', 'discrepancies', 'artifacts'],
      properties: {
        fidelityScore: { type: 'number' },
        discrepancies: { type: 'array', items: { type: 'object' } },
        positionError: { type: 'object' },
        velocityError: { type: 'object' },
        sensorFidelity: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'digital-twin', 'fidelity']
}));

export const hilTestingTask = defineTask('hil-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: HIL Testing - ${args.robotName}`,
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'HIL Test Engineer',
      task: 'Implement hardware-in-the-loop testing',
      context: args,
      instructions: [
        '1. Design HIL test architecture',
        '2. Connect real sensors to simulation',
        '3. Connect simulated actuators to real motors',
        '4. Implement real-time synchronization',
        '5. Test control algorithms with real sensors',
        '6. Validate sensor fusion with mixed data',
        '7. Test failure modes and recovery',
        '8. Measure HIL timing accuracy',
        '9. Document HIL test procedures',
        '10. Create HIL test suite'
      ],
      outputFormat: 'JSON with HIL testing setup'
    },
    outputSchema: {
      type: 'object',
      required: ['hilArchitecture', 'testCases', 'artifacts'],
      properties: {
        hilArchitecture: { type: 'object' },
        testCases: { type: 'array', items: { type: 'object' } },
        sensorConnections: { type: 'array', items: { type: 'object' } },
        actuatorConnections: { type: 'array', items: { type: 'object' } },
        timingResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'digital-twin', 'hil']
}));

export const simToRealValidationTask = defineTask('sim-to-real-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Sim-to-Real Validation - ${args.robotName}`,
  agent: {
    name: 'ml-engineer',
    prompt: {
      role: 'ML Engineer',
      task: 'Validate sim-to-real transfer',
      context: args,
      instructions: [
        '1. Define transfer validation metrics',
        '2. Test policies trained in simulation',
        '3. Measure performance gap',
        '4. Identify transfer failure modes',
        '5. Test with domain randomization',
        '6. Validate perception models',
        '7. Test control policies',
        '8. Measure adaptation requirements',
        '9. Document transfer methodology',
        '10. Recommend gap reduction strategies'
      ],
      outputFormat: 'JSON with sim-to-real validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['gapMetrics', 'transferSuccess', 'artifacts'],
      properties: {
        gapMetrics: { type: 'object' },
        transferSuccess: { type: 'boolean' },
        policyPerformance: { type: 'object' },
        failureModes: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'digital-twin', 'sim-to-real']
}));

export const realityGapMonitoringTask = defineTask('reality-gap-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Reality Gap Monitoring - ${args.robotName}`,
  agent: {
    name: 'robotics-engineer',
    prompt: {
      role: 'Robotics Engineer',
      task: 'Monitor and reduce reality gap',
      context: args,
      instructions: [
        '1. Define reality gap metrics',
        '2. Implement continuous monitoring',
        '3. Track gap over time',
        '4. Identify gap sources',
        '5. Implement gap reduction strategies',
        '6. Tune simulation parameters',
        '7. Update models based on real data',
        '8. Create gap alerts and thresholds',
        '9. Document gap reduction history',
        '10. Recommend ongoing improvements'
      ],
      outputFormat: 'JSON with reality gap monitoring'
    },
    outputSchema: {
      type: 'object',
      required: ['gapMetrics', 'monitoringConfig', 'artifacts'],
      properties: {
        gapMetrics: { type: 'object' },
        monitoringConfig: { type: 'object' },
        gapSources: { type: 'array', items: { type: 'object' } },
        reductionStrategies: { type: 'array', items: { type: 'object' } },
        alerts: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robotics-simulation', 'digital-twin', 'reality-gap']
}));

export const digitalTwinDocumentationTask = defineTask('digital-twin-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation - ${args.robotName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Document digital twin',
      context: args,
      instructions: [
        '1. Create digital twin overview',
        '2. Document physical robot model',
        '3. Describe communication architecture',
        '4. Document synchronization methods',
        '5. Include fidelity validation results',
        '6. Document HIL testing procedures',
        '7. Describe reality gap metrics',
        '8. Include troubleshooting guide',
        '9. Add usage examples',
        '10. Document limitations and future work'
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
  labels: ['robotics-simulation', 'digital-twin', 'documentation']
}));
