/**
 * @process specializations/domains/science/aerospace-engineering/rocket-propulsion-design
 * @description Complete workflow for rocket engine design including combustion analysis, nozzle design,
 * propellant selection, and performance optimization.
 * @inputs { projectName: string, missionRequirements: object, engineType: string, propellantOptions?: array }
 * @outputs { success: boolean, engineDesign: object, performanceAnalysis: object, combustionAnalysis: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/aerospace-engineering/rocket-propulsion-design', {
 *   projectName: 'Upper Stage Engine Design',
 *   missionRequirements: { thrust: 100000, isp: 350, burnTime: 300 },
 *   engineType: 'liquid-bipropellant',
 *   propellantOptions: ['LOX/LH2', 'LOX/RP-1', 'LOX/CH4']
 * });
 *
 * @references
 * - Sutton: Rocket Propulsion Elements
 * - NASA CEA (Chemical Equilibrium with Applications)
 * - JANNAF Rocket Propulsion Guidelines
 * - AIAA Liquid Propulsion Standards
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    missionRequirements,
    engineType,
    propellantOptions = []
  } = inputs;

  // Phase 1: Requirements Analysis and Mission Definition
  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    projectName,
    missionRequirements,
    engineType
  });

  // Phase 2: Propellant Selection and Trade Study
  const propellantSelection = await ctx.task(propellantSelectionTask, {
    projectName,
    requirements: requirementsAnalysis,
    propellantOptions,
    engineType
  });

  // Breakpoint: Review propellant selection
  await ctx.breakpoint({
    question: `Review propellant selection for ${projectName}. Recommended: ${propellantSelection.selectedPropellant}. Approve selection?`,
    title: 'Propellant Selection Review',
    context: {
      runId: ctx.runId,
      tradeStudy: propellantSelection.tradeStudy,
      recommendation: propellantSelection.recommendation
    }
  });

  // Phase 3: Combustion Analysis
  const combustionAnalysis = await ctx.task(combustionAnalysisTask, {
    projectName,
    propellant: propellantSelection.selectedPropellant,
    chamberPressure: requirementsAnalysis.designParameters.chamberPressure,
    mixtureRatio: propellantSelection.optimalMixtureRatio
  });

  // Phase 4: Chamber Design
  const chamberDesign = await ctx.task(chamberDesignTask, {
    projectName,
    combustionAnalysis,
    requirements: requirementsAnalysis,
    propellant: propellantSelection.selectedPropellant
  });

  // Phase 5: Nozzle Design
  const nozzleDesign = await ctx.task(nozzleDesignTask, {
    projectName,
    combustionAnalysis,
    requirements: requirementsAnalysis,
    chamberDesign
  });

  // Quality Gate: Check nozzle performance
  if (nozzleDesign.specificImpulse < missionRequirements.isp * 0.95) {
    await ctx.breakpoint({
      question: `Designed Isp (${nozzleDesign.specificImpulse}s) below target (${missionRequirements.isp}s). Review design or accept deviation?`,
      title: 'Performance Shortfall Warning',
      context: {
        runId: ctx.runId,
        designedIsp: nozzleDesign.specificImpulse,
        targetIsp: missionRequirements.isp,
        recommendation: 'Consider higher area ratio or chamber pressure'
      }
    });
  }

  // Phase 6: Injector Design
  const injectorDesign = await ctx.task(injectorDesignTask, {
    projectName,
    combustionAnalysis,
    chamberDesign,
    propellant: propellantSelection.selectedPropellant
  });

  // Phase 7: Feed System Design
  const feedSystemDesign = await ctx.task(feedSystemDesignTask, {
    projectName,
    requirements: requirementsAnalysis,
    chamberDesign,
    propellant: propellantSelection.selectedPropellant
  });

  // Phase 8: Cooling System Design
  const coolingDesign = await ctx.task(coolingDesignTask, {
    projectName,
    chamberDesign,
    nozzleDesign,
    propellant: propellantSelection.selectedPropellant,
    combustionAnalysis
  });

  // Phase 9: Structural Analysis
  const structuralAnalysis = await ctx.task(structuralAnalysisTask, {
    projectName,
    chamberDesign,
    nozzleDesign,
    coolingDesign,
    operatingConditions: requirementsAnalysis.operatingConditions
  });

  // Phase 10: Performance Integration
  const performanceIntegration = await ctx.task(performanceIntegrationTask, {
    projectName,
    combustionAnalysis,
    chamberDesign,
    nozzleDesign,
    injectorDesign,
    feedSystemDesign,
    coolingDesign
  });

  // Phase 11: Mass Budget
  const massBudget = await ctx.task(massBudgetTask, {
    projectName,
    chamberDesign,
    nozzleDesign,
    injectorDesign,
    feedSystemDesign,
    coolingDesign,
    structuralAnalysis
  });

  // Phase 12: Report Generation
  const reportGeneration = await ctx.task(rocketReportTask, {
    projectName,
    requirementsAnalysis,
    propellantSelection,
    combustionAnalysis,
    chamberDesign,
    nozzleDesign,
    injectorDesign,
    feedSystemDesign,
    coolingDesign,
    structuralAnalysis,
    performanceIntegration,
    massBudget
  });

  // Final Breakpoint: Design Approval
  await ctx.breakpoint({
    question: `Rocket engine design complete for ${projectName}. Thrust: ${performanceIntegration.thrust}N, Isp: ${performanceIntegration.isp}s. Approve design?`,
    title: 'Engine Design Approval',
    context: {
      runId: ctx.runId,
      summary: {
        thrust: performanceIntegration.thrust,
        isp: performanceIntegration.isp,
        massFlowRate: performanceIntegration.massFlowRate,
        engineMass: massBudget.totalMass
      },
      files: [
        { path: 'artifacts/rocket-engine-design.json', format: 'json', content: reportGeneration },
        { path: 'artifacts/rocket-engine-design.md', format: 'markdown', content: reportGeneration.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    engineDesign: {
      propellant: propellantSelection.selectedPropellant,
      chamber: chamberDesign,
      nozzle: nozzleDesign,
      injector: injectorDesign,
      feedSystem: feedSystemDesign,
      cooling: coolingDesign
    },
    performanceAnalysis: performanceIntegration,
    combustionAnalysis: combustionAnalysis,
    massBudget: massBudget,
    report: reportGeneration,
    metadata: {
      processId: 'specializations/domains/science/aerospace-engineering/rocket-propulsion-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Requirements Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Rocket Propulsion Systems Engineer',
      task: 'Analyze mission requirements and derive engine design parameters',
      context: {
        projectName: args.projectName,
        missionRequirements: args.missionRequirements,
        engineType: args.engineType
      },
      instructions: [
        '1. Analyze mission profile and trajectory requirements',
        '2. Derive thrust requirements (vacuum and sea level)',
        '3. Define specific impulse targets',
        '4. Establish chamber pressure requirements',
        '5. Define throttling and restart requirements',
        '6. Establish reliability and life requirements',
        '7. Define environmental and operational constraints',
        '8. Establish size and mass constraints',
        '9. Define interface requirements',
        '10. Document derived design parameters'
      ],
      outputFormat: 'JSON object with derived design requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['designParameters', 'operatingConditions'],
      properties: {
        designParameters: {
          type: 'object',
          properties: {
            thrustVacuum: { type: 'number' },
            thrustSeaLevel: { type: 'number' },
            specificImpulse: { type: 'number' },
            chamberPressure: { type: 'number' },
            expansionRatio: { type: 'number' }
          }
        },
        operatingConditions: {
          type: 'object',
          properties: {
            burnTime: { type: 'number' },
            numberOfStarts: { type: 'number' },
            throttleRange: { type: 'array', items: { type: 'number' } },
            gimbaling: { type: 'boolean' }
          }
        },
        constraints: {
          type: 'object',
          properties: {
            maxMass: { type: 'number' },
            maxLength: { type: 'number' },
            maxDiameter: { type: 'number' }
          }
        },
        reliabilityRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rocket', 'propulsion', 'requirements', 'aerospace']
}));

export const propellantSelectionTask = defineTask('propellant-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Propellant Selection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Rocket Propellant Engineer',
      task: 'Select optimal propellant combination for the engine',
      context: {
        projectName: args.projectName,
        requirements: args.requirements,
        propellantOptions: args.propellantOptions,
        engineType: args.engineType
      },
      instructions: [
        '1. Evaluate candidate propellant combinations',
        '2. Calculate theoretical specific impulse for each',
        '3. Assess density impulse and propellant density',
        '4. Evaluate storability and handling requirements',
        '5. Assess toxicity and safety considerations',
        '6. Evaluate material compatibility',
        '7. Consider supply chain and cost factors',
        '8. Analyze thermal characteristics',
        '9. Determine optimal mixture ratio',
        '10. Recommend propellant with trade study justification'
      ],
      outputFormat: 'JSON object with propellant selection and trade study'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedPropellant', 'optimalMixtureRatio', 'tradeStudy'],
      properties: {
        selectedPropellant: { type: 'string' },
        optimalMixtureRatio: { type: 'number' },
        theoreticalIsp: { type: 'number' },
        densityImpulse: { type: 'number' },
        tradeStudy: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              propellant: { type: 'string' },
              isp: { type: 'number' },
              density: { type: 'number' },
              score: { type: 'number' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rocket', 'propellant', 'selection', 'aerospace']
}));

export const combustionAnalysisTask = defineTask('combustion-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Combustion Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Rocket Combustion Specialist',
      task: 'Perform detailed combustion analysis using chemical equilibrium',
      context: {
        projectName: args.projectName,
        propellant: args.propellant,
        chamberPressure: args.chamberPressure,
        mixtureRatio: args.mixtureRatio
      },
      instructions: [
        '1. Perform chemical equilibrium analysis (CEA methodology)',
        '2. Calculate adiabatic flame temperature',
        '3. Determine equilibrium product composition',
        '4. Calculate gas properties (gamma, molecular weight, Cp)',
        '5. Analyze frozen vs equilibrium flow effects',
        '6. Calculate characteristic velocity (C*)',
        '7. Determine combustion efficiency factors',
        '8. Analyze mixture ratio sensitivity',
        '9. Identify potential combustion instability modes',
        '10. Document combustion analysis results'
      ],
      outputFormat: 'JSON object with combustion analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['chamberConditions', 'characteristicVelocity', 'gasProperties'],
      properties: {
        chamberConditions: {
          type: 'object',
          properties: {
            temperature: { type: 'number' },
            pressure: { type: 'number' },
            density: { type: 'number' }
          }
        },
        gasProperties: {
          type: 'object',
          properties: {
            gamma: { type: 'number' },
            molecularWeight: { type: 'number' },
            cp: { type: 'number' },
            specificHeatRatio: { type: 'number' }
          }
        },
        characteristicVelocity: { type: 'number' },
        productComposition: { type: 'array', items: { type: 'object' } },
        combustionEfficiency: { type: 'number' },
        instabilityRisk: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rocket', 'combustion', 'analysis', 'aerospace']
}));

export const chamberDesignTask = defineTask('chamber-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Chamber Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Rocket Combustion Chamber Designer',
      task: 'Design thrust chamber geometry and configuration',
      context: {
        projectName: args.projectName,
        combustionAnalysis: args.combustionAnalysis,
        requirements: args.requirements,
        propellant: args.propellant
      },
      instructions: [
        '1. Calculate throat area from thrust and chamber pressure',
        '2. Determine characteristic length (L*) for propellant',
        '3. Design chamber volume and contraction ratio',
        '4. Specify chamber diameter and length',
        '5. Define convergent section geometry',
        '6. Select chamber materials',
        '7. Design acoustic cavities if required',
        '8. Define chamber-nozzle interface',
        '9. Consider manufacturing constraints',
        '10. Document chamber design parameters'
      ],
      outputFormat: 'JSON object with chamber design specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['geometry', 'materials', 'performance'],
      properties: {
        geometry: {
          type: 'object',
          properties: {
            throatDiameter: { type: 'number' },
            throatArea: { type: 'number' },
            chamberDiameter: { type: 'number' },
            chamberLength: { type: 'number' },
            contractionRatio: { type: 'number' },
            characteristicLength: { type: 'number' }
          }
        },
        materials: {
          type: 'object',
          properties: {
            chamberMaterial: { type: 'string' },
            linerMaterial: { type: 'string' },
            throatMaterial: { type: 'string' }
          }
        },
        performance: {
          type: 'object',
          properties: {
            residenceTime: { type: 'number' },
            combustionEfficiency: { type: 'number' }
          }
        },
        acousticDesign: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rocket', 'chamber', 'design', 'aerospace']
}));

export const nozzleDesignTask = defineTask('nozzle-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Nozzle Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Rocket Nozzle Designer',
      task: 'Design supersonic nozzle contour and performance',
      context: {
        projectName: args.projectName,
        combustionAnalysis: args.combustionAnalysis,
        requirements: args.requirements,
        chamberDesign: args.chamberDesign
      },
      instructions: [
        '1. Determine optimal expansion ratio for mission',
        '2. Calculate nozzle exit area and diameter',
        '3. Design nozzle contour (conical, bell, or aerospike)',
        '4. Apply method of characteristics for bell nozzle',
        '5. Calculate thrust coefficient',
        '6. Determine specific impulse (vacuum and sea level)',
        '7. Analyze flow separation at low altitude',
        '8. Design nozzle extension if applicable',
        '9. Specify nozzle materials and cooling',
        '10. Document nozzle performance predictions'
      ],
      outputFormat: 'JSON object with nozzle design specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['geometry', 'performance', 'specificImpulse'],
      properties: {
        geometry: {
          type: 'object',
          properties: {
            exitDiameter: { type: 'number' },
            exitArea: { type: 'number' },
            expansionRatio: { type: 'number' },
            length: { type: 'number' },
            contourType: { type: 'string' },
            halfAngle: { type: 'number' }
          }
        },
        performance: {
          type: 'object',
          properties: {
            thrustCoefficient: { type: 'number' },
            divergenceLoss: { type: 'number' },
            frictionLoss: { type: 'number' }
          }
        },
        specificImpulse: { type: 'number' },
        specificImpulseSeaLevel: { type: 'number' },
        exitConditions: {
          type: 'object',
          properties: {
            pressure: { type: 'number' },
            temperature: { type: 'number' },
            velocity: { type: 'number' },
            mach: { type: 'number' }
          }
        },
        contourCoordinates: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rocket', 'nozzle', 'design', 'aerospace']
}));

export const injectorDesignTask = defineTask('injector-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Injector Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Rocket Injector Design Engineer',
      task: 'Design propellant injector system',
      context: {
        projectName: args.projectName,
        combustionAnalysis: args.combustionAnalysis,
        chamberDesign: args.chamberDesign,
        propellant: args.propellant
      },
      instructions: [
        '1. Select injector element type (impinging, coaxial, pintle)',
        '2. Calculate number of injection elements',
        '3. Design element geometry and spacing',
        '4. Calculate injection velocities and pressure drops',
        '5. Determine atomization characteristics',
        '6. Design face pattern for uniform mixing',
        '7. Analyze acoustic stability margins',
        '8. Design manifold system',
        '9. Specify materials and manufacturing',
        '10. Document injector design and performance'
      ],
      outputFormat: 'JSON object with injector design specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['elementDesign', 'facePattern', 'performance'],
      properties: {
        elementDesign: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            numberOfElements: { type: 'number' },
            oxidzerOrifice: { type: 'object' },
            fuelOrifice: { type: 'object' }
          }
        },
        facePattern: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            spacing: { type: 'number' },
            coverage: { type: 'number' }
          }
        },
        performance: {
          type: 'object',
          properties: {
            pressureDropOx: { type: 'number' },
            pressureDropFuel: { type: 'number' },
            injectionVelocityOx: { type: 'number' },
            injectionVelocityFuel: { type: 'number' }
          }
        },
        stabilityAnalysis: { type: 'object' },
        manifoldDesign: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rocket', 'injector', 'design', 'aerospace']
}));

export const feedSystemDesignTask = defineTask('feed-system-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Feed System Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Rocket Propellant Feed System Engineer',
      task: 'Design propellant feed system (pump-fed or pressure-fed)',
      context: {
        projectName: args.projectName,
        requirements: args.requirements,
        chamberDesign: args.chamberDesign,
        propellant: args.propellant
      },
      instructions: [
        '1. Select feed system type (pump-fed vs pressure-fed)',
        '2. Size turbopumps or pressurant system',
        '3. Design propellant lines and valves',
        '4. Calculate NPSH requirements',
        '5. Size propellant tanks and pressurant bottles',
        '6. Design thermal conditioning system',
        '7. Design start and shutdown sequences',
        '8. Specify instrumentation requirements',
        '9. Analyze system reliability',
        '10. Document feed system design'
      ],
      outputFormat: 'JSON object with feed system design specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['feedType', 'massFlowRates', 'pressures'],
      properties: {
        feedType: { type: 'string' },
        massFlowRates: {
          type: 'object',
          properties: {
            oxidizer: { type: 'number' },
            fuel: { type: 'number' },
            total: { type: 'number' }
          }
        },
        pressures: {
          type: 'object',
          properties: {
            tankOxidizer: { type: 'number' },
            tankFuel: { type: 'number' },
            inletOxidizer: { type: 'number' },
            inletFuel: { type: 'number' }
          }
        },
        turbopump: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            power: { type: 'number' },
            speed: { type: 'number' },
            efficiency: { type: 'number' }
          }
        },
        valves: { type: 'array', items: { type: 'object' } },
        startSequence: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rocket', 'feed-system', 'design', 'aerospace']
}));

export const coolingDesignTask = defineTask('cooling-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cooling System Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Rocket Thermal/Cooling Engineer',
      task: 'Design chamber and nozzle cooling system',
      context: {
        projectName: args.projectName,
        chamberDesign: args.chamberDesign,
        nozzleDesign: args.nozzleDesign,
        propellant: args.propellant,
        combustionAnalysis: args.combustionAnalysis
      },
      instructions: [
        '1. Calculate heat flux distribution along chamber and nozzle',
        '2. Select cooling method (regenerative, film, ablative, radiative)',
        '3. Design regenerative cooling channels',
        '4. Calculate coolant flow rate and pressure drop',
        '5. Determine wall temperatures and thermal margins',
        '6. Design film cooling injection if needed',
        '7. Analyze thermal stress in walls',
        '8. Design thermal barrier coatings if applicable',
        '9. Verify cooling adequacy at throat',
        '10. Document thermal design and margins'
      ],
      outputFormat: 'JSON object with cooling system design'
    },
    outputSchema: {
      type: 'object',
      required: ['coolingMethod', 'channelDesign', 'thermalAnalysis'],
      properties: {
        coolingMethod: { type: 'string' },
        channelDesign: {
          type: 'object',
          properties: {
            numberOfChannels: { type: 'number' },
            channelWidth: { type: 'number' },
            channelDepth: { type: 'number' },
            wallThickness: { type: 'number' }
          }
        },
        thermalAnalysis: {
          type: 'object',
          properties: {
            maxHeatFlux: { type: 'number' },
            maxWallTemp: { type: 'number' },
            coolantTempRise: { type: 'number' },
            thermalMargin: { type: 'number' }
          }
        },
        filmCooling: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            flowRate: { type: 'number' },
            injectionLocations: { type: 'array', items: { type: 'number' } }
          }
        },
        pressureDrop: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rocket', 'cooling', 'thermal', 'aerospace']
}));

export const structuralAnalysisTask = defineTask('structural-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Structural Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Rocket Structural Analysis Engineer',
      task: 'Perform structural analysis of engine components',
      context: {
        projectName: args.projectName,
        chamberDesign: args.chamberDesign,
        nozzleDesign: args.nozzleDesign,
        coolingDesign: args.coolingDesign,
        operatingConditions: args.operatingConditions
      },
      instructions: [
        '1. Calculate pressure loads on chamber and nozzle',
        '2. Analyze thermal stresses from temperature gradients',
        '3. Perform creep analysis for hot section',
        '4. Analyze fatigue for cyclic operation',
        '5. Calculate buckling margins for nozzle',
        '6. Analyze dynamic loads and vibration',
        '7. Calculate safety factors and margins',
        '8. Verify weld and joint integrity',
        '9. Analyze gimbal loads if applicable',
        '10. Document structural analysis results'
      ],
      outputFormat: 'JSON object with structural analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['stressAnalysis', 'margins', 'lifeAnalysis'],
      properties: {
        stressAnalysis: {
          type: 'object',
          properties: {
            maxPressureStress: { type: 'number' },
            maxThermalStress: { type: 'number' },
            combinedStress: { type: 'number' },
            allowableStress: { type: 'number' }
          }
        },
        margins: {
          type: 'object',
          properties: {
            yieldMargin: { type: 'number' },
            ultimateMargin: { type: 'number' },
            bucklingMargin: { type: 'number' },
            creepMargin: { type: 'number' }
          }
        },
        lifeAnalysis: {
          type: 'object',
          properties: {
            fatigueLife: { type: 'number' },
            creepLife: { type: 'number' },
            predictedLife: { type: 'number' },
            safetyFactor: { type: 'number' }
          }
        },
        dynamicAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rocket', 'structural', 'analysis', 'aerospace']
}));

export const performanceIntegrationTask = defineTask('performance-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Rocket Engine Performance Integration Engineer',
      task: 'Integrate all design elements and calculate overall performance',
      context: {
        projectName: args.projectName,
        combustionAnalysis: args.combustionAnalysis,
        chamberDesign: args.chamberDesign,
        nozzleDesign: args.nozzleDesign,
        injectorDesign: args.injectorDesign,
        feedSystemDesign: args.feedSystemDesign,
        coolingDesign: args.coolingDesign
      },
      instructions: [
        '1. Calculate delivered specific impulse with all losses',
        '2. Compute actual thrust at design conditions',
        '3. Calculate total mass flow rate',
        '4. Determine propellant consumption',
        '5. Compute combustion efficiency',
        '6. Calculate thermal efficiency',
        '7. Determine throttling performance',
        '8. Compute off-design performance',
        '9. Generate performance tables',
        '10. Document integrated performance summary'
      ],
      outputFormat: 'JSON object with integrated performance'
    },
    outputSchema: {
      type: 'object',
      required: ['thrust', 'isp', 'massFlowRate'],
      properties: {
        thrust: { type: 'number' },
        isp: { type: 'number' },
        ispSeaLevel: { type: 'number' },
        massFlowRate: { type: 'number' },
        efficiencies: {
          type: 'object',
          properties: {
            combustion: { type: 'number' },
            nozzle: { type: 'number' },
            overall: { type: 'number' }
          }
        },
        losses: {
          type: 'object',
          properties: {
            divergence: { type: 'number' },
            friction: { type: 'number' },
            filmCooling: { type: 'number' },
            combustion: { type: 'number' }
          }
        },
        throttlingRange: { type: 'object' },
        performanceTables: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rocket', 'performance', 'integration', 'aerospace']
}));

export const massBudgetTask = defineTask('mass-budget', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mass Budget - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Rocket Engine Mass Properties Engineer',
      task: 'Calculate engine mass budget and properties',
      context: {
        projectName: args.projectName,
        chamberDesign: args.chamberDesign,
        nozzleDesign: args.nozzleDesign,
        injectorDesign: args.injectorDesign,
        feedSystemDesign: args.feedSystemDesign,
        coolingDesign: args.coolingDesign,
        structuralAnalysis: args.structuralAnalysis
      },
      instructions: [
        '1. Calculate combustion chamber mass',
        '2. Calculate nozzle mass',
        '3. Calculate injector mass',
        '4. Calculate feed system mass (pumps, valves, lines)',
        '5. Calculate gimbal system mass if applicable',
        '6. Add instrumentation and harness mass',
        '7. Add brackets and mounting hardware',
        '8. Calculate total dry mass',
        '9. Compute thrust-to-weight ratio',
        '10. Document mass budget breakdown'
      ],
      outputFormat: 'JSON object with mass budget'
    },
    outputSchema: {
      type: 'object',
      required: ['totalMass', 'breakdown', 'thrustToWeight'],
      properties: {
        totalMass: { type: 'number' },
        breakdown: {
          type: 'object',
          properties: {
            chamber: { type: 'number' },
            nozzle: { type: 'number' },
            injector: { type: 'number' },
            turbopump: { type: 'number' },
            valves: { type: 'number' },
            lines: { type: 'number' },
            gimbal: { type: 'number' },
            instrumentation: { type: 'number' },
            miscellaneous: { type: 'number' }
          }
        },
        thrustToWeight: { type: 'number' },
        centerOfGravity: { type: 'object' },
        momentsOfInertia: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rocket', 'mass', 'budget', 'aerospace']
}));

export const rocketReportTask = defineTask('rocket-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Rocket Propulsion Technical Writer',
      task: 'Generate comprehensive rocket engine design report',
      context: {
        projectName: args.projectName,
        requirementsAnalysis: args.requirementsAnalysis,
        propellantSelection: args.propellantSelection,
        combustionAnalysis: args.combustionAnalysis,
        chamberDesign: args.chamberDesign,
        nozzleDesign: args.nozzleDesign,
        injectorDesign: args.injectorDesign,
        feedSystemDesign: args.feedSystemDesign,
        coolingDesign: args.coolingDesign,
        structuralAnalysis: args.structuralAnalysis,
        performanceIntegration: args.performanceIntegration,
        massBudget: args.massBudget
      },
      instructions: [
        '1. Create executive summary with key performance metrics',
        '2. Document requirements and design drivers',
        '3. Present propellant selection rationale',
        '4. Detail combustion analysis results',
        '5. Present chamber and nozzle design',
        '6. Document injector and feed system design',
        '7. Present thermal and structural analysis',
        '8. Summarize integrated performance',
        '9. Present mass budget and properties',
        '10. Generate both JSON and markdown formats'
      ],
      outputFormat: 'JSON object with complete design report'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'markdown'],
      properties: {
        report: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            requirements: { type: 'object' },
            propellant: { type: 'object' },
            combustion: { type: 'object' },
            design: { type: 'object' },
            performance: { type: 'object' },
            mass: { type: 'object' },
            conclusions: { type: 'array', items: { type: 'string' } }
          }
        },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['rocket', 'reporting', 'documentation', 'aerospace']
}));
