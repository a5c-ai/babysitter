/**
 * @process specializations/domains/science/electrical-engineering/motor-drive-design
 * @description Motor Drive Design - Guide the design of motor drives including variable frequency drives (VFDs),
 * servo drives, and brushless DC motor controllers. Covers power stage design, control algorithms, and system integration.
 * @inputs { driveName: string, motorType: string, requirements: object, controlMethod?: string }
 * @outputs { success: boolean, powerStage: object, controlSystem: object, protection: object, validation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/motor-drive-design', {
 *   driveName: '5HP VFD for Pump Application',
 *   motorType: 'induction-3phase',
 *   requirements: { power: '3.7kW', voltage: '380-480VAC', speedRange: '0-1800RPM' },
 *   controlMethod: 'FOC'
 * });
 *
 * @references
 * - IEC 61800 Series (Adjustable Speed Electrical Power Drive Systems)
 * - IEEE 519 (Harmonic Control)
 * - Motor Drive Application Notes
 * - Field-Oriented Control Guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    driveName,
    motorType,
    requirements,
    controlMethod = 'auto'
  } = inputs;

  // Phase 1: Define Motor and Load Requirements
  const requirementsDefinition = await ctx.task(requirementsDefinitionTask, {
    driveName,
    motorType,
    requirements
  });

  // Phase 2: Select Drive Topology
  const topologySelection = await ctx.task(topologySelectionTask, {
    driveName,
    motorType,
    requirements: requirementsDefinition.specs
  });

  // Breakpoint: Review topology selection
  await ctx.breakpoint({
    question: `Review drive topology for ${driveName}. Selected: ${topologySelection.topology}. Proceed with power stage design?`,
    title: 'Topology Review',
    context: {
      runId: ctx.runId,
      driveName,
      topology: topologySelection,
      files: [{
        path: `artifacts/phase2-topology.json`,
        format: 'json',
        content: topologySelection
      }]
    }
  });

  // Phase 3: Design Power Stage (Inverter, Gate Drivers)
  const powerStageDesign = await ctx.task(powerStageDesignTask, {
    driveName,
    topology: topologySelection.topology,
    requirements: requirementsDefinition.specs
  });

  // Phase 4: Select Control Method
  const controlMethodSelection = await ctx.task(controlMethodSelectionTask, {
    driveName,
    motorType,
    controlMethod,
    requirements: requirementsDefinition.specs
  });

  // Phase 5: Implement Current and Speed Control Loops
  const controlLoopImplementation = await ctx.task(controlLoopImplementationTask, {
    driveName,
    controlMethod: controlMethodSelection.method,
    powerStage: powerStageDesign,
    requirements: requirementsDefinition.specs
  });

  // Breakpoint: Review control loops
  await ctx.breakpoint({
    question: `Review control loop design for ${driveName}. Current loop BW: ${controlLoopImplementation.currentBW}, Speed loop BW: ${controlLoopImplementation.speedBW}. Proceed with protection design?`,
    title: 'Control Loop Review',
    context: {
      runId: ctx.runId,
      controlLoops: controlLoopImplementation,
      files: [{
        path: `artifacts/phase5-control.json`,
        format: 'json',
        content: controlLoopImplementation
      }]
    }
  });

  // Phase 6: Design Protection Features
  const protectionDesign = await ctx.task(protectionDesignTask, {
    driveName,
    powerStage: powerStageDesign,
    requirements: requirementsDefinition.specs
  });

  // Phase 7: Test Drive Performance and Efficiency
  const performanceTesting = await ctx.task(performanceTestingTask, {
    driveName,
    powerStage: powerStageDesign,
    controlLoops: controlLoopImplementation,
    protection: protectionDesign,
    requirements: requirementsDefinition.specs
  });

  // Quality Gate: Performance must meet requirements
  if (!performanceTesting.meetsSpecs) {
    await ctx.breakpoint({
      question: `Performance testing shows ${performanceTesting.failures.length} specifications not met. Iterate design?`,
      title: 'Performance Issues',
      context: {
        runId: ctx.runId,
        failures: performanceTesting.failures,
        recommendations: performanceTesting.recommendations
      }
    });
  }

  // Phase 8: Validate with Motor and Load Testing
  const loadValidation = await ctx.task(loadValidationTask, {
    driveName,
    performanceResults: performanceTesting.results,
    motorType,
    requirements: requirementsDefinition.specs
  });

  // Final Breakpoint: Design Approval
  await ctx.breakpoint({
    question: `Motor drive design complete for ${driveName}. Efficiency: ${loadValidation.efficiency}. Approve for production?`,
    title: 'Design Approval',
    context: {
      runId: ctx.runId,
      driveName,
      validationSummary: loadValidation.summary,
      files: [
        { path: `artifacts/motor-drive-design.json`, format: 'json', content: { powerStage: powerStageDesign, control: controlLoopImplementation } },
        { path: `artifacts/motor-drive-report.md`, format: 'markdown', content: loadValidation.markdown }
      ]
    }
  });

  return {
    success: true,
    driveName,
    powerStage: powerStageDesign,
    controlSystem: {
      method: controlMethodSelection.method,
      loops: controlLoopImplementation
    },
    protection: protectionDesign,
    validation: {
      performance: performanceTesting.results,
      loadTest: loadValidation.results
    },
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/motor-drive-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions (abbreviated for brevity)

export const requirementsDefinitionTask = defineTask('requirements-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Definition - ${args.driveName}`,
  agent: {
    name: 'power-electronics-engineer',
    prompt: {
      role: 'Motor Drive Systems Engineer',
      task: 'Define motor and load requirements',
      context: args,
      instructions: [
        '1. Define motor type and ratings',
        '2. Specify voltage and current requirements',
        '3. Define speed range and torque profile',
        '4. Specify efficiency targets',
        '5. Define dynamic performance requirements',
        '6. Specify thermal constraints',
        '7. Define EMC and harmonics requirements',
        '8. Specify communication interfaces',
        '9. Define safety requirements',
        '10. Document all specifications'
      ],
      outputFormat: 'JSON object with drive specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['specs'],
      properties: { specs: { type: 'object' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'motor-drive', 'requirements']
}));

export const topologySelectionTask = defineTask('topology-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Topology Selection - ${args.driveName}`,
  agent: {
    name: 'power-electronics-engineer',
    prompt: {
      role: 'Power Electronics Engineer',
      task: 'Select drive topology',
      context: args,
      instructions: [
        '1. Evaluate voltage source vs. current source inverter',
        '2. Select rectifier topology (diode, active)',
        '3. Determine DC bus configuration',
        '4. Select inverter topology',
        '5. Evaluate regeneration requirements',
        '6. Consider harmonic mitigation needs',
        '7. Select switching frequency range',
        '8. Document topology selection'
      ],
      outputFormat: 'JSON object with topology selection'
    },
    outputSchema: {
      type: 'object',
      required: ['topology'],
      properties: { topology: { type: 'string' }, rationale: { type: 'string' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'motor-drive', 'topology']
}));

export const powerStageDesignTask = defineTask('power-stage-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Power Stage Design - ${args.driveName}`,
  agent: {
    name: 'power-electronics-engineer',
    prompt: {
      role: 'Power Stage Design Engineer',
      task: 'Design power stage (inverter, gate drivers)',
      context: args,
      instructions: [
        '1. Size IGBTs/MOSFETs for voltage and current',
        '2. Design gate driver circuits',
        '3. Design DC bus capacitor bank',
        '4. Design snubber circuits if needed',
        '5. Design current sensing',
        '6. Design voltage sensing',
        '7. Plan thermal management',
        '8. Design PCB layout for power stage',
        '9. Specify dead time and PWM timing',
        '10. Document power stage design'
      ],
      outputFormat: 'JSON object with power stage design'
    },
    outputSchema: {
      type: 'object',
      required: ['inverter', 'gateDrive', 'sensing'],
      properties: {
        inverter: { type: 'object' },
        gateDrive: { type: 'object' },
        sensing: { type: 'object' },
        dcBus: { type: 'object' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'motor-drive', 'power-stage']
}));

export const controlMethodSelectionTask = defineTask('control-method-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Control Method Selection - ${args.driveName}`,
  agent: {
    name: 'power-electronics-engineer',
    prompt: {
      role: 'Motor Control Specialist',
      task: 'Select control method (V/f, FOC, DTC)',
      context: args,
      instructions: [
        '1. Evaluate V/f (scalar) control',
        '2. Evaluate Field-Oriented Control (FOC)',
        '3. Evaluate Direct Torque Control (DTC)',
        '4. Consider sensorless vs. encoder feedback',
        '5. Evaluate dynamic performance requirements',
        '6. Consider computational requirements',
        '7. Select optimal control method',
        '8. Document selection rationale'
      ],
      outputFormat: 'JSON object with control method selection'
    },
    outputSchema: {
      type: 'object',
      required: ['method'],
      properties: { method: { type: 'string' }, feedbackType: { type: 'string' }, rationale: { type: 'string' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'motor-drive', 'control-method']
}));

export const controlLoopImplementationTask = defineTask('control-loop-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Control Loop Implementation - ${args.driveName}`,
  agent: {
    name: 'power-electronics-engineer',
    prompt: {
      role: 'Motor Drive Control Engineer',
      task: 'Implement current and speed control loops',
      context: args,
      instructions: [
        '1. Design current control loop (d-q axis for FOC)',
        '2. Design speed control loop',
        '3. Design position control loop if needed',
        '4. Implement coordinate transformations',
        '5. Design flux estimator/observer',
        '6. Tune control loop gains',
        '7. Implement field weakening',
        '8. Design anti-windup',
        '9. Verify stability and bandwidth',
        '10. Document control implementation'
      ],
      outputFormat: 'JSON object with control loop implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['currentLoop', 'speedLoop', 'currentBW', 'speedBW'],
      properties: {
        currentLoop: { type: 'object' },
        speedLoop: { type: 'object' },
        currentBW: { type: 'string' },
        speedBW: { type: 'string' },
        fluxEstimator: { type: 'object' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'motor-drive', 'control-loops']
}));

export const protectionDesignTask = defineTask('protection-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Protection Design - ${args.driveName}`,
  agent: {
    name: 'power-electronics-engineer',
    prompt: {
      role: 'Drive Protection Engineer',
      task: 'Design protection features',
      context: args,
      instructions: [
        '1. Design overcurrent protection',
        '2. Design overvoltage protection',
        '3. Design undervoltage lockout',
        '4. Design short circuit protection',
        '5. Design thermal protection',
        '6. Design ground fault detection',
        '7. Design motor overload protection',
        '8. Implement safe torque off (STO)',
        '9. Design fault handling and recovery',
        '10. Document protection features'
      ],
      outputFormat: 'JSON object with protection design'
    },
    outputSchema: {
      type: 'object',
      required: ['protections'],
      properties: {
        protections: { type: 'array', items: { type: 'object' } },
        faultHandling: { type: 'object' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'motor-drive', 'protection']
}));

export const performanceTestingTask = defineTask('performance-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Performance Testing - ${args.driveName}`,
  agent: {
    name: 'power-electronics-engineer',
    prompt: {
      role: 'Drive Test Engineer',
      task: 'Test drive performance and efficiency',
      context: args,
      instructions: [
        '1. Test no-load operation',
        '2. Measure efficiency at various loads',
        '3. Test speed control accuracy',
        '4. Test torque control accuracy',
        '5. Measure dynamic response',
        '6. Test regeneration capability',
        '7. Measure harmonic performance',
        '8. Test EMC performance',
        '9. Verify protection operation',
        '10. Document test results'
      ],
      outputFormat: 'JSON object with performance test results'
    },
    outputSchema: {
      type: 'object',
      required: ['meetsSpecs', 'results'],
      properties: {
        meetsSpecs: { type: 'boolean' },
        results: { type: 'object' },
        failures: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'motor-drive', 'testing']
}));

export const loadValidationTask = defineTask('load-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Load Validation - ${args.driveName}`,
  agent: {
    name: 'power-electronics-engineer',
    prompt: {
      role: 'Motor Drive Validation Engineer',
      task: 'Validate with motor and load testing',
      context: args,
      instructions: [
        '1. Test with actual motor',
        '2. Apply rated load',
        '3. Test across speed range',
        '4. Verify torque capability',
        '5. Test thermal performance',
        '6. Verify efficiency under load',
        '7. Test application-specific profiles',
        '8. Long-term reliability testing',
        '9. Document validation results',
        '10. Generate test report'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'efficiency', 'summary'],
      properties: {
        results: { type: 'object' },
        efficiency: { type: 'string' },
        summary: { type: 'string' },
        markdown: { type: 'string' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['ee', 'motor-drive', 'validation']
}));
