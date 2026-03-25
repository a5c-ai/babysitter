/**
 * @process specializations/domains/science/automotive-engineering/hybrid-powertrain-integration
 * @description Hybrid Powertrain Integration - Integrate hybrid powertrain architectures (series, parallel,
 * series-parallel) including energy management strategy development and mode transition control.
 * @inputs { projectName: string, hybridArchitecture: string, iceSpecification?: object, motorSpecification?: object, targetEmissions?: object }
 * @outputs { success: boolean, hybridSystemDesign: object, energyManagementAlgorithms: object, calibrationData: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/hybrid-powertrain-integration', {
 *   projectName: 'HEV-Parallel-SUV',
 *   hybridArchitecture: 'P2-parallel',
 *   iceSpecification: { displacement: 2.0, power: 150, fuelType: 'gasoline' },
 *   motorSpecification: { power: 50, torque: 200 },
 *   targetEmissions: { co2: 120, nox: 0.06 }
 * });
 *
 * @references
 * - SAE J1711 Hybrid Electric Vehicle Test Procedure
 * - UN ECE R101 CO2 Emission Measurement
 * - EPA Federal Test Procedure
 * - WLTP Test Procedure
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    hybridArchitecture,
    iceSpecification = {},
    motorSpecification = {},
    targetEmissions = {}
  } = inputs;

  // Phase 1: Hybrid Architecture Definition
  const architectureDefinition = await ctx.task(architectureDefinitionTask, {
    projectName,
    hybridArchitecture,
    iceSpecification,
    motorSpecification
  });

  // Quality Gate: Architecture must be defined
  if (!architectureDefinition.architecture) {
    return {
      success: false,
      error: 'Hybrid architecture definition failed',
      phase: 'architecture-definition',
      hybridSystemDesign: null
    };
  }

  // Phase 2: Operating Mode Definition
  const operatingModes = await ctx.task(operatingModesTask, {
    projectName,
    architectureDefinition,
    hybridArchitecture
  });

  // Breakpoint: Operating modes review
  await ctx.breakpoint({
    question: `Review operating modes for ${projectName}. ${operatingModes.modes?.length || 0} modes defined. Approve mode definitions?`,
    title: 'Operating Modes Review',
    context: {
      runId: ctx.runId,
      projectName,
      operatingModes,
      files: [{
        path: `artifacts/operating-modes.json`,
        format: 'json',
        content: operatingModes
      }]
    }
  });

  // Phase 3: Energy Management Strategy Development
  const energyManagement = await ctx.task(energyManagementTask, {
    projectName,
    architectureDefinition,
    operatingModes,
    targetEmissions
  });

  // Phase 4: Component Integration
  const componentIntegration = await ctx.task(componentIntegrationTask, {
    projectName,
    architectureDefinition,
    iceSpecification,
    motorSpecification
  });

  // Phase 5: Mode Transition Control
  const modeTransition = await ctx.task(modeTransitionTask, {
    projectName,
    operatingModes,
    energyManagement,
    componentIntegration
  });

  // Phase 6: Drivability Calibration
  const drivabilityCalibration = await ctx.task(drivabilityCalibrationTask, {
    projectName,
    modeTransition,
    operatingModes,
    energyManagement
  });

  // Phase 7: Fuel Economy and Emissions Validation
  const emissionsValidation = await ctx.task(emissionsValidationTask, {
    projectName,
    energyManagement,
    drivabilityCalibration,
    targetEmissions
  });

  // Quality Gate: Emissions targets
  if (emissionsValidation.targetsMet === false) {
    await ctx.breakpoint({
      question: `Emissions targets not met for ${projectName}. CO2: ${emissionsValidation.actualEmissions?.co2} vs target ${targetEmissions.co2}. Review optimization options?`,
      title: 'Emissions Target Warning',
      context: {
        runId: ctx.runId,
        emissionsValidation,
        recommendation: 'Optimize energy management strategy or component sizing'
      }
    });
  }

  // Phase 8: System Documentation
  const systemDocumentation = await ctx.task(systemDocumentationTask, {
    projectName,
    architectureDefinition,
    operatingModes,
    energyManagement,
    componentIntegration,
    modeTransition,
    drivabilityCalibration,
    emissionsValidation
  });

  // Final Breakpoint: Design approval
  await ctx.breakpoint({
    question: `Hybrid Powertrain Integration complete for ${projectName}. Projected CO2: ${emissionsValidation.actualEmissions?.co2} g/km. Approve design?`,
    title: 'Hybrid Powertrain Design Approval',
    context: {
      runId: ctx.runId,
      projectName,
      designSummary: systemDocumentation.summary,
      files: [
        { path: `artifacts/hybrid-system-design.json`, format: 'json', content: systemDocumentation },
        { path: `artifacts/energy-management.json`, format: 'json', content: energyManagement }
      ]
    }
  });

  return {
    success: true,
    projectName,
    hybridSystemDesign: systemDocumentation.design,
    energyManagementAlgorithms: energyManagement.algorithms,
    calibrationData: {
      drivability: drivabilityCalibration.data,
      modeTransition: modeTransition.calibration
    },
    emissionsPerformance: emissionsValidation.performance,
    nextSteps: systemDocumentation.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/hybrid-powertrain-integration',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const architectureDefinitionTask = defineTask('architecture-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Hybrid Architecture Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Hybrid Powertrain Architect',
      task: 'Define hybrid powertrain architecture and configuration',
      context: {
        projectName: args.projectName,
        hybridArchitecture: args.hybridArchitecture,
        iceSpecification: args.iceSpecification,
        motorSpecification: args.motorSpecification
      },
      instructions: [
        '1. Define hybrid architecture configuration (P0-P4, series, parallel)',
        '2. Specify ICE and motor power split',
        '3. Define transmission integration approach',
        '4. Specify battery/energy storage requirements',
        '5. Define electrical architecture (voltage level)',
        '6. Specify clutch and coupling mechanisms',
        '7. Define packaging constraints',
        '8. Analyze architecture trade-offs',
        '9. Define operating envelope',
        '10. Document architecture rationale'
      ],
      outputFormat: 'JSON object with hybrid architecture definition'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'configuration', 'specifications'],
      properties: {
        architecture: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            motorPosition: { type: 'string' },
            clutchConfiguration: { type: 'string' },
            transmissionType: { type: 'string' }
          }
        },
        configuration: {
          type: 'object',
          properties: {
            icePower: { type: 'number' },
            motorPower: { type: 'number' },
            combinedPower: { type: 'number' },
            batteryCapacity: { type: 'number' },
            voltageLevel: { type: 'number' }
          }
        },
        specifications: { type: 'object' },
        rationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'hybrid', 'architecture', 'powertrain']
}));

export const operatingModesTask = defineTask('operating-modes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Operating Mode Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Hybrid Control Engineer',
      task: 'Define hybrid operating modes and conditions',
      context: {
        projectName: args.projectName,
        architectureDefinition: args.architectureDefinition,
        hybridArchitecture: args.hybridArchitecture
      },
      instructions: [
        '1. Define EV-only mode and operating conditions',
        '2. Define ICE-only mode and operating conditions',
        '3. Define hybrid/combined mode',
        '4. Define regenerative braking mode',
        '5. Define charging mode (ICE charging battery)',
        '6. Define engine start/stop modes',
        '7. Define sport/eco mode variations',
        '8. Specify mode entry/exit conditions',
        '9. Define mode priorities and constraints',
        '10. Document mode state machine'
      ],
      outputFormat: 'JSON object with operating mode definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['modes', 'stateMachine', 'conditions'],
      properties: {
        modes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              entryConditions: { type: 'array', items: { type: 'string' } },
              exitConditions: { type: 'array', items: { type: 'string' } },
              priority: { type: 'number' }
            }
          }
        },
        stateMachine: { type: 'object' },
        conditions: { type: 'object' },
        constraints: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'hybrid', 'operating-modes', 'control']
}));

export const energyManagementTask = defineTask('energy-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Energy Management Strategy Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Energy Management Strategy Engineer',
      task: 'Develop energy management strategy for hybrid powertrain',
      context: {
        projectName: args.projectName,
        architectureDefinition: args.architectureDefinition,
        operatingModes: args.operatingModes,
        targetEmissions: args.targetEmissions
      },
      instructions: [
        '1. Define energy management objectives (fuel economy, emissions, performance)',
        '2. Develop power split strategy between ICE and motor',
        '3. Design SOC management strategy',
        '4. Implement equivalent consumption minimization (ECMS)',
        '5. Design predictive energy management (if applicable)',
        '6. Optimize ICE operating points',
        '7. Develop regenerative braking strategy',
        '8. Design thermal energy management',
        '9. Implement adaptive strategy based on driving style',
        '10. Validate strategy over standard drive cycles'
      ],
      outputFormat: 'JSON object with energy management strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithms', 'strategy', 'optimization'],
      properties: {
        algorithms: {
          type: 'object',
          properties: {
            powerSplit: { type: 'object' },
            socManagement: { type: 'object' },
            ecms: { type: 'object' },
            predictive: { type: 'object' }
          }
        },
        strategy: {
          type: 'object',
          properties: {
            objectives: { type: 'array', items: { type: 'string' } },
            constraints: { type: 'array', items: { type: 'string' } },
            parameters: { type: 'object' }
          }
        },
        optimization: {
          type: 'object',
          properties: {
            iceOperatingPoints: { type: 'object' },
            motorUtilization: { type: 'object' },
            regenerativeRecovery: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'hybrid', 'energy-management', 'optimization']
}));

export const componentIntegrationTask = defineTask('component-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Component Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Hybrid Integration Engineer',
      task: 'Integrate hybrid powertrain components',
      context: {
        projectName: args.projectName,
        architectureDefinition: args.architectureDefinition,
        iceSpecification: args.iceSpecification,
        motorSpecification: args.motorSpecification
      },
      instructions: [
        '1. Design mechanical integration of motor to transmission',
        '2. Design clutch integration and control',
        '3. Integrate power electronics and HV system',
        '4. Design cooling system integration',
        '5. Integrate battery pack location and mounting',
        '6. Design HV wiring and connectors',
        '7. Integrate CAN communication networks',
        '8. Design exhaust system routing',
        '9. Integrate thermal management systems',
        '10. Document interface specifications'
      ],
      outputFormat: 'JSON object with component integration'
    },
    outputSchema: {
      type: 'object',
      required: ['integration', 'interfaces', 'specifications'],
      properties: {
        integration: {
          type: 'object',
          properties: {
            mechanical: { type: 'object' },
            electrical: { type: 'object' },
            thermal: { type: 'object' },
            communication: { type: 'object' }
          }
        },
        interfaces: { type: 'array', items: { type: 'object' } },
        specifications: { type: 'object' },
        packagingConstraints: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'hybrid', 'integration', 'powertrain']
}));

export const modeTransitionTask = defineTask('mode-transition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Mode Transition Control - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Transition Control Engineer',
      task: 'Develop mode transition control strategies',
      context: {
        projectName: args.projectName,
        operatingModes: args.operatingModes,
        energyManagement: args.energyManagement,
        componentIntegration: args.componentIntegration
      },
      instructions: [
        '1. Design engine start transition (EV to hybrid)',
        '2. Design engine stop transition (hybrid to EV)',
        '3. Control clutch engagement/disengagement',
        '4. Design torque fill during transitions',
        '5. Manage NVH during mode changes',
        '6. Design smooth regenerative braking transition',
        '7. Control ICE speed matching for clutch engagement',
        '8. Design fault handling during transitions',
        '9. Optimize transition times',
        '10. Develop transition calibration parameters'
      ],
      outputFormat: 'JSON object with mode transition control'
    },
    outputSchema: {
      type: 'object',
      required: ['calibration', 'transitions', 'control'],
      properties: {
        calibration: {
          type: 'object',
          properties: {
            engineStart: { type: 'object' },
            engineStop: { type: 'object' },
            clutchControl: { type: 'object' },
            torqueFill: { type: 'object' }
          }
        },
        transitions: { type: 'array', items: { type: 'object' } },
        control: {
          type: 'object',
          properties: {
            strategies: { type: 'array', items: { type: 'object' } },
            faultHandling: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'hybrid', 'mode-transition', 'control']
}));

export const drivabilityCalibrationTask = defineTask('drivability-calibration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Drivability Calibration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Drivability Calibration Engineer',
      task: 'Calibrate hybrid system for drivability',
      context: {
        projectName: args.projectName,
        modeTransition: args.modeTransition,
        operatingModes: args.operatingModes,
        energyManagement: args.energyManagement
      },
      instructions: [
        '1. Calibrate pedal map and torque response',
        '2. Tune acceleration feel across modes',
        '3. Calibrate regenerative braking feel',
        '4. Tune mode transition smoothness',
        '5. Calibrate tip-in/tip-out response',
        '6. Tune creep behavior in EV mode',
        '7. Calibrate sport/eco mode differences',
        '8. Tune NVH during steady state and transients',
        '9. Calibrate brake blending',
        '10. Document calibration datasets'
      ],
      outputFormat: 'JSON object with drivability calibration'
    },
    outputSchema: {
      type: 'object',
      required: ['data', 'calibration', 'targets'],
      properties: {
        data: {
          type: 'object',
          properties: {
            pedalMaps: { type: 'object' },
            torqueResponse: { type: 'object' },
            regenBraking: { type: 'object' },
            modeTransitions: { type: 'object' }
          }
        },
        calibration: {
          type: 'object',
          properties: {
            parameters: { type: 'array', items: { type: 'object' } },
            tuningHistory: { type: 'array', items: { type: 'object' } }
          }
        },
        targets: {
          type: 'object',
          properties: {
            accelerationTime: { type: 'object' },
            transitionTime: { type: 'object' },
            nvhLevels: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'hybrid', 'drivability', 'calibration']
}));

export const emissionsValidationTask = defineTask('emissions-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Fuel Economy and Emissions Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Emissions Validation Engineer',
      task: 'Validate fuel economy and emissions performance',
      context: {
        projectName: args.projectName,
        energyManagement: args.energyManagement,
        drivabilityCalibration: args.drivabilityCalibration,
        targetEmissions: args.targetEmissions
      },
      instructions: [
        '1. Execute WLTP drive cycle simulation',
        '2. Execute FTP-75 drive cycle simulation',
        '3. Calculate combined fuel consumption',
        '4. Calculate CO2 emissions',
        '5. Validate against emission targets',
        '6. Analyze SOC correction factors',
        '7. Calculate electric range (PHEV)',
        '8. Validate cold start performance',
        '9. Compare to regulatory limits',
        '10. Identify optimization opportunities'
      ],
      outputFormat: 'JSON object with emissions validation'
    },
    outputSchema: {
      type: 'object',
      required: ['performance', 'actualEmissions', 'targetsMet'],
      properties: {
        performance: {
          type: 'object',
          properties: {
            wltpFuelConsumption: { type: 'number' },
            ftpFuelConsumption: { type: 'number' },
            combinedFuelConsumption: { type: 'number' },
            electricRange: { type: 'number' }
          }
        },
        actualEmissions: {
          type: 'object',
          properties: {
            co2: { type: 'number' },
            nox: { type: 'number' },
            co: { type: 'number' },
            hc: { type: 'number' }
          }
        },
        targetsMet: { type: 'boolean' },
        gaps: { type: 'array', items: { type: 'object' } },
        optimizationOpportunities: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'hybrid', 'emissions', 'validation']
}));

export const systemDocumentationTask = defineTask('system-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: System Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Engineer',
      task: 'Generate comprehensive hybrid system documentation',
      context: {
        projectName: args.projectName,
        architectureDefinition: args.architectureDefinition,
        operatingModes: args.operatingModes,
        energyManagement: args.energyManagement,
        componentIntegration: args.componentIntegration,
        modeTransition: args.modeTransition,
        drivabilityCalibration: args.drivabilityCalibration,
        emissionsValidation: args.emissionsValidation
      },
      instructions: [
        '1. Create executive summary',
        '2. Document architecture specification',
        '3. Compile operating mode definitions',
        '4. Document energy management algorithms',
        '5. Document component integration',
        '6. Compile calibration data',
        '7. Document emissions performance',
        '8. Create validation summary',
        '9. List open issues and risks',
        '10. Define next steps'
      ],
      outputFormat: 'JSON object with system documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'summary', 'nextSteps'],
      properties: {
        design: {
          type: 'object',
          properties: {
            architecture: { type: 'object' },
            modes: { type: 'object' },
            energyManagement: { type: 'object' },
            calibration: { type: 'object' }
          }
        },
        summary: {
          type: 'object',
          properties: {
            combinedPower: { type: 'number' },
            fuelConsumption: { type: 'number' },
            co2Emissions: { type: 'number' },
            electricRange: { type: 'number' }
          }
        },
        nextSteps: { type: 'array', items: { type: 'object' } },
        openIssues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'hybrid', 'documentation', 'deliverable']
}));
