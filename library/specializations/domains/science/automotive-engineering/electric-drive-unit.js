/**
 * @process specializations/domains/science/automotive-engineering/electric-drive-unit
 * @description Electric Drive Unit Development - Develop integrated electric drive units comprising electric motor,
 * power electronics (inverter), and gear reduction. Optimize for efficiency, power density, and NVH performance.
 * @inputs { projectName: string, vehicleClass: string, performanceTargets: object, driveConfiguration?: string }
 * @outputs { success: boolean, eduDesignSpec: object, controlSoftware: object, efficiencyMaps: object, validationReports: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/electric-drive-unit', {
 *   projectName: 'EDU-200kW-RearDrive',
 *   vehicleClass: 'D-Segment Performance',
 *   performanceTargets: { peakPower: 200, peakTorque: 400, maxSpeed: 16000 },
 *   driveConfiguration: 'rear-wheel-drive'
 * });
 *
 * @references
 * - SAE J2907 Power Electronics Test Standard
 * - ISO 21498 Electric Motor Testing
 * - SAE J2464 Electrical Component Testing
 * - IEC 60034 Rotating Electrical Machines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    vehicleClass,
    performanceTargets = {},
    driveConfiguration = 'single-motor'
  } = inputs;

  // Phase 1: Motor Requirements and Topology Selection
  const motorSelection = await ctx.task(motorSelectionTask, {
    projectName,
    vehicleClass,
    performanceTargets,
    driveConfiguration
  });

  // Quality Gate: Motor topology must be selected
  if (!motorSelection.selectedTopology) {
    return {
      success: false,
      error: 'Motor topology selection not completed',
      phase: 'motor-selection',
      eduDesignSpec: null
    };
  }

  // Breakpoint: Motor topology review
  await ctx.breakpoint({
    question: `Review motor topology selection for ${projectName}. Selected: ${motorSelection.selectedTopology}. Approve motor design direction?`,
    title: 'Motor Topology Review',
    context: {
      runId: ctx.runId,
      projectName,
      motorSelection,
      files: [{
        path: `artifacts/motor-selection.json`,
        format: 'json',
        content: motorSelection
      }]
    }
  });

  // Phase 2: Inverter and Power Electronics Design
  const inverterDesign = await ctx.task(inverterDesignTask, {
    projectName,
    motorSelection,
    performanceTargets
  });

  // Phase 3: Motor Control Algorithm Development
  const controlAlgorithms = await ctx.task(controlAlgorithmsTask, {
    projectName,
    motorSelection,
    inverterDesign,
    performanceTargets
  });

  // Phase 4: Gear Reduction Design
  const gearReduction = await ctx.task(gearReductionTask, {
    projectName,
    motorSelection,
    performanceTargets,
    vehicleClass
  });

  // Phase 5: EDU Integration
  const eduIntegration = await ctx.task(eduIntegrationTask, {
    projectName,
    motorSelection,
    inverterDesign,
    gearReduction
  });

  // Phase 6: Efficiency Optimization
  const efficiencyOptimization = await ctx.task(efficiencyOptimizationTask, {
    projectName,
    motorSelection,
    inverterDesign,
    controlAlgorithms,
    gearReduction
  });

  // Phase 7: NVH Analysis
  const nvhAnalysis = await ctx.task(nvhAnalysisTask, {
    projectName,
    motorSelection,
    gearReduction,
    eduIntegration
  });

  // Quality Gate: NVH targets check
  if (nvhAnalysis.exceedances && nvhAnalysis.exceedances.length > 0) {
    await ctx.breakpoint({
      question: `NVH analysis identified ${nvhAnalysis.exceedances.length} target exceedances. Review and approve mitigation plan?`,
      title: 'NVH Target Exceedances',
      context: {
        runId: ctx.runId,
        exceedances: nvhAnalysis.exceedances,
        mitigations: nvhAnalysis.mitigations
      }
    });
  }

  // Phase 8: Validation Planning
  const validationPlan = await ctx.task(validationPlanTask, {
    projectName,
    motorSelection,
    inverterDesign,
    controlAlgorithms,
    efficiencyOptimization,
    nvhAnalysis
  });

  // Final Breakpoint: EDU design approval
  await ctx.breakpoint({
    question: `Electric Drive Unit design complete for ${projectName}. Peak power: ${performanceTargets.peakPower} kW. Approve for prototype build?`,
    title: 'EDU Design Approval',
    context: {
      runId: ctx.runId,
      projectName,
      designSummary: eduIntegration.summary,
      files: [
        { path: `artifacts/edu-design-specification.json`, format: 'json', content: eduIntegration },
        { path: `artifacts/efficiency-maps.json`, format: 'json', content: efficiencyOptimization }
      ]
    }
  });

  return {
    success: true,
    projectName,
    eduDesignSpec: {
      motor: motorSelection.design,
      inverter: inverterDesign.design,
      gearbox: gearReduction.design,
      integration: eduIntegration.design
    },
    controlSoftware: controlAlgorithms.software,
    efficiencyMaps: efficiencyOptimization.maps,
    validationReports: validationPlan.reports,
    nvhPerformance: nvhAnalysis.performance,
    nextSteps: validationPlan.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/electric-drive-unit',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const motorSelectionTask = defineTask('motor-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Motor Requirements and Topology Selection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Electric Motor Design Engineer',
      task: 'Define motor requirements and select optimal topology',
      context: {
        projectName: args.projectName,
        vehicleClass: args.vehicleClass,
        performanceTargets: args.performanceTargets,
        driveConfiguration: args.driveConfiguration
      },
      instructions: [
        '1. Define motor performance requirements from vehicle targets',
        '2. Evaluate motor topologies (PMSM, IPM, SRM, induction)',
        '3. Analyze rotor configurations (interior PM, surface PM)',
        '4. Define winding configuration (distributed, concentrated)',
        '5. Analyze magnet options (NdFeB, ferrite, hybrid)',
        '6. Define cooling requirements (water jacket, oil spray)',
        '7. Evaluate motor size and weight targets',
        '8. Analyze cost implications of different topologies',
        '9. Select optimal motor topology with rationale',
        '10. Define preliminary motor specifications'
      ],
      outputFormat: 'JSON object with motor selection analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTopology', 'design', 'specifications'],
      properties: {
        selectedTopology: { type: 'string' },
        design: {
          type: 'object',
          properties: {
            rotorType: { type: 'string' },
            windingType: { type: 'string' },
            magnetType: { type: 'string' },
            coolingMethod: { type: 'string' }
          }
        },
        specifications: {
          type: 'object',
          properties: {
            peakPower: { type: 'number' },
            continuousPower: { type: 'number' },
            peakTorque: { type: 'number' },
            maxSpeed: { type: 'number' },
            efficiency: { type: 'number' }
          }
        },
        alternatives: { type: 'array', items: { type: 'object' } },
        selectionRationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'electric-motor', 'design', 'EDU']
}));

export const inverterDesignTask = defineTask('inverter-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Inverter and Power Electronics Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Power Electronics Engineer',
      task: 'Design inverter and power electronics for EDU',
      context: {
        projectName: args.projectName,
        motorSelection: args.motorSelection,
        performanceTargets: args.performanceTargets
      },
      instructions: [
        '1. Define inverter topology (2-level, 3-level, multilevel)',
        '2. Select power semiconductor technology (Si IGBT, SiC MOSFET)',
        '3. Design gate driver circuits',
        '4. Define DC-link capacitor requirements',
        '5. Design current sensors and voltage sensing',
        '6. Define thermal management requirements',
        '7. Design EMC filtering (input/output)',
        '8. Define high-voltage safety features',
        '9. Specify control hardware (MCU/FPGA)',
        '10. Design housing and connector interfaces'
      ],
      outputFormat: 'JSON object with inverter design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'specifications', 'components'],
      properties: {
        design: {
          type: 'object',
          properties: {
            topology: { type: 'string' },
            semiconductorType: { type: 'string' },
            cooling: { type: 'string' },
            emcStrategy: { type: 'string' }
          }
        },
        specifications: {
          type: 'object',
          properties: {
            dcVoltageRange: { type: 'object' },
            peakCurrent: { type: 'number' },
            continuousCurrent: { type: 'number' },
            switchingFrequency: { type: 'number' },
            efficiency: { type: 'number' }
          }
        },
        components: { type: 'array', items: { type: 'object' } },
        thermalDesign: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'power-electronics', 'inverter', 'EDU']
}));

export const controlAlgorithmsTask = defineTask('control-algorithms', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Motor Control Algorithm Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Motor Control Engineer',
      task: 'Develop motor control algorithms and software',
      context: {
        projectName: args.projectName,
        motorSelection: args.motorSelection,
        inverterDesign: args.inverterDesign,
        performanceTargets: args.performanceTargets
      },
      instructions: [
        '1. Design FOC (Field-Oriented Control) architecture',
        '2. Develop current control loops (d-q axis)',
        '3. Implement MTPA (Maximum Torque Per Ampere) strategy',
        '4. Develop field weakening algorithms',
        '5. Design position/speed estimation (sensorless option)',
        '6. Implement thermal derating algorithms',
        '7. Develop torque ripple minimization',
        '8. Design fault detection and safe state handling',
        '9. Implement calibration procedures',
        '10. Define software architecture (AUTOSAR integration)'
      ],
      outputFormat: 'JSON object with control algorithms'
    },
    outputSchema: {
      type: 'object',
      required: ['software', 'algorithms', 'parameters'],
      properties: {
        software: {
          type: 'object',
          properties: {
            architecture: { type: 'string' },
            executionRate: { type: 'number' },
            autosarCompliance: { type: 'boolean' }
          }
        },
        algorithms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              function: { type: 'string' },
              inputs: { type: 'array', items: { type: 'string' } },
              outputs: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        parameters: { type: 'object' },
        faultHandling: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'motor-control', 'software', 'EDU']
}));

export const gearReductionTask = defineTask('gear-reduction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Gear Reduction Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Transmission Design Engineer',
      task: 'Design gear reduction unit for EDU',
      context: {
        projectName: args.projectName,
        motorSelection: args.motorSelection,
        performanceTargets: args.performanceTargets,
        vehicleClass: args.vehicleClass
      },
      instructions: [
        '1. Define gear ratio requirements from motor and wheel speed',
        '2. Select gear configuration (single-speed, 2-speed, planetary)',
        '3. Design gear geometry and tooth profiles',
        '4. Calculate gear strength and durability',
        '5. Design bearings and shafts',
        '6. Define lubrication system (oil bath, spray)',
        '7. Analyze gear mesh NVH characteristics',
        '8. Design differential (if applicable)',
        '9. Define housing and integration requirements',
        '10. Specify manufacturing processes'
      ],
      outputFormat: 'JSON object with gear reduction design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'specifications', 'analysis'],
      properties: {
        design: {
          type: 'object',
          properties: {
            configuration: { type: 'string' },
            gearRatio: { type: 'number' },
            gearType: { type: 'string' },
            lubrication: { type: 'string' }
          }
        },
        specifications: {
          type: 'object',
          properties: {
            inputTorque: { type: 'number' },
            outputTorque: { type: 'number' },
            inputSpeed: { type: 'number' },
            efficiency: { type: 'number' }
          }
        },
        analysis: {
          type: 'object',
          properties: {
            gearStrength: { type: 'object' },
            bearingLife: { type: 'object' },
            nvhCharacteristics: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'transmission', 'gear-design', 'EDU']
}));

export const eduIntegrationTask = defineTask('edu-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: EDU Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'EDU Integration Engineer',
      task: 'Integrate motor, inverter, and gearbox into unified EDU',
      context: {
        projectName: args.projectName,
        motorSelection: args.motorSelection,
        inverterDesign: args.inverterDesign,
        gearReduction: args.gearReduction
      },
      instructions: [
        '1. Define integrated housing architecture',
        '2. Design shared cooling system',
        '3. Integrate HV connections and busbars',
        '4. Design sealing and environmental protection',
        '5. Define mounting and vehicle integration points',
        '6. Integrate rotor position sensing',
        '7. Design service accessibility',
        '8. Specify connector interfaces',
        '9. Calculate total EDU weight and volume',
        '10. Define manufacturing and assembly sequence'
      ],
      outputFormat: 'JSON object with EDU integration design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'summary', 'integration'],
      properties: {
        design: {
          type: 'object',
          properties: {
            housing: { type: 'object' },
            cooling: { type: 'object' },
            hvSystem: { type: 'object' },
            sealing: { type: 'object' }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalWeight: { type: 'number' },
            totalVolume: { type: 'number' },
            powerDensity: { type: 'number' }
          }
        },
        integration: {
          type: 'object',
          properties: {
            mountingPoints: { type: 'array', items: { type: 'object' } },
            connectors: { type: 'array', items: { type: 'object' } },
            assemblySequence: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'integration', 'EDU', 'powertrain']
}));

export const efficiencyOptimizationTask = defineTask('efficiency-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Efficiency Optimization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Efficiency Optimization Engineer',
      task: 'Optimize and characterize EDU efficiency',
      context: {
        projectName: args.projectName,
        motorSelection: args.motorSelection,
        inverterDesign: args.inverterDesign,
        controlAlgorithms: args.controlAlgorithms,
        gearReduction: args.gearReduction
      },
      instructions: [
        '1. Create motor efficiency maps',
        '2. Create inverter efficiency maps',
        '3. Calculate gearbox efficiency across operating range',
        '4. Generate combined system efficiency maps',
        '5. Identify efficiency optimization opportunities',
        '6. Optimize control parameters for efficiency',
        '7. Analyze efficiency over drive cycles',
        '8. Calculate losses breakdown by component',
        '9. Define thermal efficiency limits',
        '10. Create efficiency calibration recommendations'
      ],
      outputFormat: 'JSON object with efficiency analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['maps', 'analysis', 'recommendations'],
      properties: {
        maps: {
          type: 'object',
          properties: {
            motor: { type: 'object' },
            inverter: { type: 'object' },
            gearbox: { type: 'object' },
            system: { type: 'object' }
          }
        },
        analysis: {
          type: 'object',
          properties: {
            peakEfficiency: { type: 'number' },
            driveCycleEfficiency: { type: 'object' },
            lossesBreakdown: { type: 'object' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'efficiency', 'optimization', 'EDU']
}));

export const nvhAnalysisTask = defineTask('nvh-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: NVH Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'NVH Engineer',
      task: 'Analyze and optimize EDU NVH performance',
      context: {
        projectName: args.projectName,
        motorSelection: args.motorSelection,
        gearReduction: args.gearReduction,
        eduIntegration: args.eduIntegration
      },
      instructions: [
        '1. Identify noise and vibration sources',
        '2. Analyze motor electromagnetic NVH (torque ripple, harmonics)',
        '3. Analyze gear mesh NVH',
        '4. Analyze bearing noise',
        '5. Model structural vibration transfer paths',
        '6. Define NVH targets by frequency band',
        '7. Design noise isolation and damping',
        '8. Analyze inverter switching noise',
        '9. Identify target exceedances',
        '10. Develop NVH mitigation strategies'
      ],
      outputFormat: 'JSON object with NVH analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['performance', 'exceedances', 'mitigations'],
      properties: {
        performance: {
          type: 'object',
          properties: {
            overallNoise: { type: 'object' },
            vibrationLevels: { type: 'object' },
            orderAnalysis: { type: 'object' }
          }
        },
        exceedances: { type: 'array', items: { type: 'object' } },
        mitigations: { type: 'array', items: { type: 'object' } },
        sources: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'nvh', 'analysis', 'EDU']
}));

export const validationPlanTask = defineTask('validation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Validation Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Validation Planning Engineer',
      task: 'Develop EDU validation test plan',
      context: {
        projectName: args.projectName,
        motorSelection: args.motorSelection,
        inverterDesign: args.inverterDesign,
        controlAlgorithms: args.controlAlgorithms,
        efficiencyOptimization: args.efficiencyOptimization,
        nvhAnalysis: args.nvhAnalysis
      },
      instructions: [
        '1. Define validation test matrix',
        '2. Plan performance validation tests',
        '3. Plan efficiency measurement tests',
        '4. Plan NVH validation tests',
        '5. Plan durability and life testing',
        '6. Plan environmental testing (temperature, humidity)',
        '7. Plan EMC validation tests',
        '8. Plan safety validation tests',
        '9. Define test facilities and equipment',
        '10. Create validation schedule'
      ],
      outputFormat: 'JSON object with validation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'testMatrix', 'nextSteps'],
      properties: {
        reports: {
          type: 'object',
          properties: {
            testPlan: { type: 'object' },
            facilityRequirements: { type: 'object' },
            schedule: { type: 'object' }
          }
        },
        testMatrix: { type: 'array', items: { type: 'object' } },
        nextSteps: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'validation', 'test-planning', 'EDU']
}));
