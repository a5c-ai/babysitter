/**
 * @process specializations/domains/science/aerospace-engineering/flight-simulation-model
 * @description Workflow for creating validated flight dynamics models for pilot training and engineering simulation.
 * @inputs { projectName: string, vehicleData: object, modelFidelity: string, validationData?: object }
 * @outputs { success: boolean, simulationModel: object, validationResults: object, documentation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/aerospace-engineering/flight-simulation-model', {
 *   projectName: 'Transport Sim Model',
 *   vehicleData: { type: 'transport', aeroData: 'aero-db.json' },
 *   modelFidelity: 'level-d',
 *   validationData: { flightTest: 'flight-test-data.csv' }
 * });
 *
 * @references
 * - FAA AC 120-40B Airplane Simulator Qualification
 * - ICAO 9625 Manual of Criteria for Flight Simulation
 * - CS-FSTD(A) Certification Specifications
 * - NASA Flight Simulation Guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    vehicleData,
    modelFidelity,
    validationData = {}
  } = inputs;

  // Phase 1: Requirements and Standards
  const modelRequirements = await ctx.task(simModelRequirementsTask, {
    projectName,
    modelFidelity,
    intendedUse: vehicleData.intendedUse
  });

  // Phase 2: Aerodynamic Model Development
  const aeroModel = await ctx.task(simAeroModelTask, {
    projectName,
    vehicleData,
    requirements: modelRequirements
  });

  // Phase 3: Propulsion Model Development
  const propulsionModel = await ctx.task(simPropulsionModelTask, {
    projectName,
    vehicleData,
    requirements: modelRequirements
  });

  // Breakpoint: Core model review
  await ctx.breakpoint({
    question: `Core models complete for ${projectName}. Aero tables: ${aeroModel.tableCount}, Propulsion: ${propulsionModel.engineCount} engines. Proceed?`,
    title: 'Core Model Review',
    context: {
      runId: ctx.runId,
      aeroModel: aeroModel.summary,
      propulsionModel: propulsionModel.summary
    }
  });

  // Phase 4: Flight Control Model
  const flightControlModel = await ctx.task(simFlightControlTask, {
    projectName,
    vehicleData,
    aeroModel,
    requirements: modelRequirements
  });

  // Phase 5: Landing Gear and Ground Model
  const groundModel = await ctx.task(simGroundModelTask, {
    projectName,
    vehicleData,
    requirements: modelRequirements
  });

  // Phase 6: Systems Models
  const systemsModels = await ctx.task(simSystemsModelTask, {
    projectName,
    vehicleData,
    requirements: modelRequirements
  });

  // Phase 7: Model Integration
  const integratedModel = await ctx.task(simModelIntegrationTask, {
    projectName,
    aeroModel,
    propulsionModel,
    flightControlModel,
    groundModel,
    systemsModels
  });

  // Phase 8: Validation Testing
  const validationTesting = await ctx.task(simValidationTestingTask, {
    projectName,
    integratedModel,
    validationData,
    requirements: modelRequirements
  });

  // Quality Gate: Validation results
  if (validationTesting.passRate < 0.9) {
    await ctx.breakpoint({
      question: `Validation pass rate ${(validationTesting.passRate * 100).toFixed(1)}% below 90% target. Review failures?`,
      title: 'Validation Warning',
      context: {
        runId: ctx.runId,
        validationTesting,
        failures: validationTesting.failures
      }
    });
  }

  // Phase 9: Tuning and Refinement
  const modelTuning = await ctx.task(simModelTuningTask, {
    projectName,
    integratedModel,
    validationResults: validationTesting,
    tuningTargets: validationTesting.tuningRecommendations
  });

  // Phase 10: Qualification Documentation
  const qualificationDocs = await ctx.task(simQualificationTask, {
    projectName,
    integratedModel: modelTuning.tunedModel,
    validationTesting,
    modelFidelity,
    requirements: modelRequirements
  });

  // Final Breakpoint: Model Approval
  await ctx.breakpoint({
    question: `Simulation model complete for ${projectName}. Qualification level: ${qualificationDocs.qualificationLevel}. Approve for release?`,
    title: 'Simulation Model Approval',
    context: {
      runId: ctx.runId,
      summary: {
        qualificationLevel: qualificationDocs.qualificationLevel,
        validationPassRate: validationTesting.passRate,
        openItems: qualificationDocs.openItems
      },
      files: [
        { path: 'artifacts/sim-model-docs.json', format: 'json', content: qualificationDocs },
        { path: 'artifacts/sim-model-docs.md', format: 'markdown', content: qualificationDocs.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    simulationModel: modelTuning.tunedModel,
    validationResults: validationTesting,
    qualification: qualificationDocs,
    documentation: qualificationDocs,
    metadata: {
      processId: 'specializations/domains/science/aerospace-engineering/flight-simulation-model',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions (abbreviated)

export const simModelRequirementsTask = defineTask('sim-model-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Flight Simulation Standards Engineer',
      task: 'Define simulation model requirements',
      context: args,
      instructions: [
        '1. Identify applicable qualification standards',
        '2. Define fidelity level requirements',
        '3. Specify model update rates',
        '4. Define validation tolerances',
        '5. Identify required subsystems',
        '6. Define data package requirements',
        '7. Specify interface requirements',
        '8. Define testing requirements',
        '9. Document acceptance criteria',
        '10. Create requirements matrix'
      ],
      outputFormat: 'JSON object with model requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['qualificationStandard', 'fidelityLevel', 'tolerances'],
      properties: {
        qualificationStandard: { type: 'string' },
        fidelityLevel: { type: 'string' },
        updateRates: { type: 'object' },
        tolerances: { type: 'object' },
        subsystems: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'requirements', 'aerospace']
}));

export const simAeroModelTask = defineTask('sim-aero-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Aerodynamic Model - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Simulation Aerodynamics Engineer',
      task: 'Develop aerodynamic model for simulation',
      context: args,
      instructions: [
        '1. Process aerodynamic database',
        '2. Create coefficient tables',
        '3. Implement increment methodology',
        '4. Model ground effect',
        '5. Model icing effects',
        '6. Implement stall model',
        '7. Model high-AoA characteristics',
        '8. Implement aeroelastic corrections',
        '9. Create interpolation functions',
        '10. Document aerodynamic model'
      ],
      outputFormat: 'JSON object with aerodynamic model'
    },
    outputSchema: {
      type: 'object',
      required: ['tableCount', 'summary'],
      properties: {
        tableCount: { type: 'number' },
        summary: { type: 'object' },
        coefficients: { type: 'object' },
        increments: { type: 'object' },
        specialModels: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'aerodynamics', 'aerospace']
}));

export const simPropulsionModelTask = defineTask('sim-propulsion-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Propulsion Model - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Simulation Propulsion Engineer',
      task: 'Develop propulsion model for simulation',
      context: args,
      instructions: [
        '1. Create engine performance tables',
        '2. Model engine dynamics',
        '3. Implement fuel flow model',
        '4. Model engine limits',
        '5. Implement start/shutdown logic',
        '6. Model failure modes',
        '7. Implement thrust vectoring if applicable',
        '8. Model inlet effects',
        '9. Create integration interface',
        '10. Document propulsion model'
      ],
      outputFormat: 'JSON object with propulsion model'
    },
    outputSchema: {
      type: 'object',
      required: ['engineCount', 'summary'],
      properties: {
        engineCount: { type: 'number' },
        summary: { type: 'object' },
        performanceTables: { type: 'object' },
        dynamics: { type: 'object' },
        failureModes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'propulsion', 'aerospace']
}));

export const simFlightControlTask = defineTask('sim-flight-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Flight Control Model - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Simulation FCS Engineer',
      task: 'Develop flight control model for simulation',
      context: args,
      instructions: [
        '1. Implement control law model',
        '2. Model actuator dynamics',
        '3. Implement sensor models',
        '4. Model autopilot modes',
        '5. Implement failure modes',
        '6. Model control limiting',
        '7. Implement feel system',
        '8. Model trim system',
        '9. Create mode logic',
        '10. Document FCS model'
      ],
      outputFormat: 'JSON object with flight control model'
    },
    outputSchema: {
      type: 'object',
      required: ['controlLaws', 'actuators'],
      properties: {
        controlLaws: { type: 'object' },
        actuators: { type: 'object' },
        sensors: { type: 'object' },
        autopilotModes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'flight-control', 'aerospace']
}));

export const simGroundModelTask = defineTask('sim-ground-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Ground Model - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Simulation Ground Dynamics Engineer',
      task: 'Develop landing gear and ground model',
      context: args,
      instructions: [
        '1. Model gear oleo dynamics',
        '2. Implement tire model',
        '3. Model brake system',
        '4. Implement steering model',
        '5. Model ground contact logic',
        '6. Implement runway surface effects',
        '7. Model gear retraction',
        '8. Implement failure modes',
        '9. Create ground effect transitions',
        '10. Document ground model'
      ],
      outputFormat: 'JSON object with ground model'
    },
    outputSchema: {
      type: 'object',
      required: ['gearModel', 'tireModel'],
      properties: {
        gearModel: { type: 'object' },
        tireModel: { type: 'object' },
        brakeModel: { type: 'object' },
        steeringModel: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'ground-dynamics', 'aerospace']
}));

export const simSystemsModelTask = defineTask('sim-systems-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Systems Models - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Simulation Systems Engineer',
      task: 'Develop aircraft systems models',
      context: args,
      instructions: [
        '1. Model hydraulic system',
        '2. Model electrical system',
        '3. Model fuel system',
        '4. Model environmental control',
        '5. Model avionics integration',
        '6. Implement failure logic',
        '7. Model warning systems',
        '8. Create system interfaces',
        '9. Implement system logic',
        '10. Document systems models'
      ],
      outputFormat: 'JSON object with systems models'
    },
    outputSchema: {
      type: 'object',
      required: ['systems'],
      properties: {
        systems: { type: 'array', items: { type: 'object' } },
        failures: { type: 'array', items: { type: 'object' } },
        interfaces: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'systems', 'aerospace']
}));

export const simModelIntegrationTask = defineTask('sim-model-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Simulation Integration Engineer',
      task: 'Integrate all simulation models',
      context: args,
      instructions: [
        '1. Define model interfaces',
        '2. Implement equations of motion',
        '3. Integrate subsystem models',
        '4. Implement initialization',
        '5. Create trim routines',
        '6. Define output parameters',
        '7. Implement real-time scheduling',
        '8. Verify integration integrity',
        '9. Perform basic functionality tests',
        '10. Document integrated model'
      ],
      outputFormat: 'JSON object with integrated model'
    },
    outputSchema: {
      type: 'object',
      required: ['modelStructure', 'interfaces'],
      properties: {
        modelStructure: { type: 'object' },
        interfaces: { type: 'object' },
        outputs: { type: 'array', items: { type: 'string' } },
        updateRate: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'integration', 'aerospace']
}));

export const simValidationTestingTask = defineTask('sim-validation-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validation Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Simulation Validation Engineer',
      task: 'Perform simulation model validation',
      context: args,
      instructions: [
        '1. Execute static tests',
        '2. Execute dynamic response tests',
        '3. Compare with flight test data',
        '4. Evaluate against tolerances',
        '5. Document pass/fail results',
        '6. Identify tuning needs',
        '7. Test edge cases',
        '8. Verify failure modes',
        '9. Create validation report',
        '10. Provide tuning recommendations'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['passRate', 'testResults'],
      properties: {
        passRate: { type: 'number' },
        testResults: { type: 'array', items: { type: 'object' } },
        failures: { type: 'array', items: { type: 'object' } },
        tuningRecommendations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'validation', 'aerospace']
}));

export const simModelTuningTask = defineTask('sim-model-tuning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Tuning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Simulation Model Tuning Engineer',
      task: 'Tune simulation model for validation compliance',
      context: args,
      instructions: [
        '1. Analyze validation failures',
        '2. Identify tuning parameters',
        '3. Apply parameter adjustments',
        '4. Re-run validation tests',
        '5. Iterate until compliant',
        '6. Document all changes',
        '7. Verify no regression',
        '8. Update model documentation',
        '9. Create tuning report',
        '10. Finalize tuned model'
      ],
      outputFormat: 'JSON object with tuned model'
    },
    outputSchema: {
      type: 'object',
      required: ['tunedModel', 'changes'],
      properties: {
        tunedModel: { type: 'object' },
        changes: { type: 'array', items: { type: 'object' } },
        improvedMetrics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'tuning', 'aerospace']
}));

export const simQualificationTask = defineTask('sim-qualification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Qualification Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Simulation Qualification Engineer',
      task: 'Prepare qualification documentation',
      context: args,
      instructions: [
        '1. Compile validation evidence',
        '2. Document model description',
        '3. Create QTG (Qualification Test Guide)',
        '4. Document compliance matrix',
        '5. Identify open items',
        '6. Determine qualification level',
        '7. Prepare submission package',
        '8. Create user documentation',
        '9. Document limitations',
        '10. Generate qualification report'
      ],
      outputFormat: 'JSON object with qualification documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['qualificationLevel', 'complianceMatrix', 'markdown'],
      properties: {
        qualificationLevel: { type: 'string' },
        complianceMatrix: { type: 'object' },
        qtg: { type: 'object' },
        openItems: { type: 'array', items: { type: 'string' } },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'qualification', 'aerospace']
}));
