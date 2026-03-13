/**
 * @process specializations/domains/science/aerospace-engineering/gas-turbine-cycle-analysis
 * @description Process for analyzing and optimizing gas turbine engine thermodynamic cycles including
 * turbofan, turbojet, and turboprop configurations.
 * @inputs { projectName: string, engineType: string, designRequirements: object, operatingConditions?: object }
 * @outputs { success: boolean, cycleAnalysis: object, performanceMap: object, optimizationResults: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/aerospace-engineering/gas-turbine-cycle-analysis', {
 *   projectName: 'High Bypass Turbofan Analysis',
 *   engineType: 'turbofan',
 *   designRequirements: { thrust: 25000, sfc: 0.35, bpr: 8.0 },
 *   operatingConditions: { altitude: 35000, mach: 0.85 }
 * });
 *
 * @references
 * - Gas Turbine Theory (Saravanamuttoo): Standard textbook reference
 * - NASA Glenn Research Center: https://www.grc.nasa.gov/
 * - NPSS (Numerical Propulsion System Simulation)
 * - GasTurb Software Documentation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    engineType,
    designRequirements,
    operatingConditions = {}
  } = inputs;

  // Phase 1: Design Point Definition
  const designPointDef = await ctx.task(designPointDefinitionTask, {
    projectName,
    engineType,
    designRequirements,
    operatingConditions
  });

  // Phase 2: Cycle Architecture Selection
  const cycleArchitecture = await ctx.task(cycleArchitectureTask, {
    projectName,
    engineType,
    designPoint: designPointDef,
    requirements: designRequirements
  });

  // Breakpoint: Review cycle architecture
  await ctx.breakpoint({
    question: `Review cycle architecture for ${projectName}. Configuration: ${cycleArchitecture.configuration}. Proceed with cycle analysis?`,
    title: 'Cycle Architecture Review',
    context: {
      runId: ctx.runId,
      architecture: cycleArchitecture,
      keyParameters: cycleArchitecture.keyParameters
    }
  });

  // Phase 3: Component Performance Modeling
  const componentModeling = await ctx.task(componentModelingTask, {
    projectName,
    architecture: cycleArchitecture,
    designPoint: designPointDef
  });

  // Phase 4: Thermodynamic Cycle Analysis
  const cycleAnalysis = await ctx.task(cycleAnalysisTask, {
    projectName,
    architecture: cycleArchitecture,
    componentMaps: componentModeling,
    designPoint: designPointDef
  });

  // Quality Gate: Check cycle convergence
  if (!cycleAnalysis.converged) {
    await ctx.breakpoint({
      question: `Cycle analysis did not converge. Error: ${cycleAnalysis.convergenceError}. Adjust parameters or review component models?`,
      title: 'Cycle Convergence Warning',
      context: {
        runId: ctx.runId,
        cycleState: cycleAnalysis,
        recommendation: 'Review component efficiencies and pressure ratios'
      }
    });
  }

  // Phase 5: Off-Design Performance Analysis
  const offDesignAnalysis = await ctx.task(offDesignAnalysisTask, {
    projectName,
    designCycle: cycleAnalysis,
    componentMaps: componentModeling,
    operatingEnvelope: designPointDef.operatingEnvelope
  });

  // Phase 6: Performance Optimization
  const optimization = await ctx.task(optimizationTask, {
    projectName,
    cycleAnalysis,
    offDesignAnalysis,
    designRequirements,
    constraints: designPointDef.constraints
  });

  // Phase 7: Emissions and Environmental Analysis
  const emissionsAnalysis = await ctx.task(emissionsAnalysisTask, {
    projectName,
    optimizedCycle: optimization.optimizedCycle,
    operatingProfile: operatingConditions.profile
  });

  // Phase 8: Sensitivity Analysis
  const sensitivityAnalysis = await ctx.task(sensitivityAnalysisTask, {
    projectName,
    optimizedCycle: optimization.optimizedCycle,
    parameterRanges: designPointDef.uncertaintyRanges
  });

  // Phase 9: Performance Map Generation
  const performanceMap = await ctx.task(performanceMapTask, {
    projectName,
    optimizedCycle: optimization.optimizedCycle,
    componentMaps: componentModeling,
    operatingEnvelope: designPointDef.operatingEnvelope
  });

  // Phase 10: Report Generation
  const reportGeneration = await ctx.task(cycleReportTask, {
    projectName,
    engineType,
    designPointDef,
    cycleArchitecture,
    cycleAnalysis,
    offDesignAnalysis,
    optimization,
    emissionsAnalysis,
    sensitivityAnalysis,
    performanceMap
  });

  // Final Breakpoint: Results Approval
  await ctx.breakpoint({
    question: `Gas turbine cycle analysis complete for ${projectName}. SFC improvement: ${optimization.improvement.sfc}%. Approve design?`,
    title: 'Cycle Analysis Approval',
    context: {
      runId: ctx.runId,
      summary: {
        thrust: optimization.optimizedCycle.thrust,
        sfc: optimization.optimizedCycle.sfc,
        thermalEfficiency: optimization.optimizedCycle.thermalEfficiency,
        improvement: optimization.improvement
      },
      files: [
        { path: 'artifacts/cycle-analysis-report.json', format: 'json', content: reportGeneration },
        { path: 'artifacts/cycle-analysis-report.md', format: 'markdown', content: reportGeneration.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    engineType,
    cycleAnalysis: {
      designPoint: cycleAnalysis.designPoint,
      stationData: cycleAnalysis.stationData,
      performance: cycleAnalysis.performance
    },
    performanceMap: performanceMap.maps,
    optimizationResults: {
      optimizedParameters: optimization.optimizedParameters,
      improvement: optimization.improvement,
      tradeStudies: optimization.tradeStudies
    },
    emissions: emissionsAnalysis,
    report: reportGeneration,
    metadata: {
      processId: 'specializations/domains/science/aerospace-engineering/gas-turbine-cycle-analysis',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const designPointDefinitionTask = defineTask('design-point-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Point Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gas Turbine Propulsion Engineer specializing in cycle design',
      task: 'Define design point requirements for gas turbine cycle analysis',
      context: {
        projectName: args.projectName,
        engineType: args.engineType,
        designRequirements: args.designRequirements,
        operatingConditions: args.operatingConditions
      },
      instructions: [
        '1. Define design point altitude and Mach number',
        '2. Specify required thrust or power at design point',
        '3. Define specific fuel consumption (SFC) targets',
        '4. Establish operating envelope (altitude-Mach)',
        '5. Define inlet conditions and recovery factors',
        '6. Specify bleed air and power extraction requirements',
        '7. Define installation losses (inlet, nozzle)',
        '8. Establish noise and emissions constraints',
        '9. Define weight and size constraints',
        '10. Document uncertainty ranges for sensitivity analysis'
      ],
      outputFormat: 'JSON object with complete design point specification'
    },
    outputSchema: {
      type: 'object',
      required: ['designPoint', 'operatingEnvelope', 'constraints'],
      properties: {
        designPoint: {
          type: 'object',
          properties: {
            altitude: { type: 'number' },
            mach: { type: 'number' },
            ambientTemperature: { type: 'number' },
            ambientPressure: { type: 'number' },
            inletRecovery: { type: 'number' }
          }
        },
        requirements: {
          type: 'object',
          properties: {
            thrust: { type: 'number' },
            sfc: { type: 'number' },
            bypassRatio: { type: 'number' }
          }
        },
        operatingEnvelope: {
          type: 'object',
          properties: {
            altitudeRange: { type: 'array', items: { type: 'number' } },
            machRange: { type: 'array', items: { type: 'number' } },
            ambientTemperatureRange: { type: 'array', items: { type: 'number' } }
          }
        },
        constraints: {
          type: 'object',
          properties: {
            maxTIT: { type: 'number' },
            maxWeight: { type: 'number' },
            maxDiameter: { type: 'number' },
            noiseLimit: { type: 'number' },
            emissionsLimits: { type: 'object' }
          }
        },
        uncertaintyRanges: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'gas-turbine', 'design', 'aerospace']
}));

export const cycleArchitectureTask = defineTask('cycle-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cycle Architecture Selection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gas Turbine Architect with expertise in engine configurations',
      task: 'Select and define cycle architecture for the engine',
      context: {
        projectName: args.projectName,
        engineType: args.engineType,
        designPoint: args.designPoint,
        requirements: args.requirements
      },
      instructions: [
        '1. Select engine configuration (single/multi-spool, geared)',
        '2. Define number of compressor and turbine stages',
        '3. Establish bypass ratio for turbofans',
        '4. Define overall pressure ratio and fan pressure ratio',
        '5. Specify turbine inlet temperature',
        '6. Define combustor type and configuration',
        '7. Specify nozzle type (convergent, C-D)',
        '8. Define bleed and secondary flow paths',
        '9. Establish cooling flow requirements',
        '10. Document architecture rationale and trade-offs'
      ],
      outputFormat: 'JSON object with cycle architecture definition'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'keyParameters'],
      properties: {
        configuration: { type: 'string' },
        spoolConfiguration: {
          type: 'object',
          properties: {
            numberOfSpools: { type: 'number' },
            geared: { type: 'boolean' },
            gearRatio: { type: 'number' }
          }
        },
        keyParameters: {
          type: 'object',
          properties: {
            overallPressureRatio: { type: 'number' },
            fanPressureRatio: { type: 'number' },
            bypassRatio: { type: 'number' },
            turbineInletTemperature: { type: 'number' }
          }
        },
        componentCount: {
          type: 'object',
          properties: {
            fanStages: { type: 'number' },
            lpcStages: { type: 'number' },
            hpcStages: { type: 'number' },
            hptStages: { type: 'number' },
            lptStages: { type: 'number' }
          }
        },
        coolingFlows: { type: 'object' },
        rationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'gas-turbine', 'architecture', 'aerospace']
}));

export const componentModelingTask = defineTask('component-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Component Performance Modeling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gas Turbine Component Performance Engineer',
      task: 'Develop component performance models for cycle analysis',
      context: {
        projectName: args.projectName,
        architecture: args.architecture,
        designPoint: args.designPoint
      },
      instructions: [
        '1. Define fan/compressor maps (efficiency, pressure ratio vs corrected flow)',
        '2. Define turbine maps (efficiency vs expansion ratio)',
        '3. Specify combustor efficiency and pressure loss',
        '4. Define inlet and nozzle performance characteristics',
        '5. Establish component polytropic efficiencies',
        '6. Define duct pressure losses',
        '7. Model cooling flow effects on turbine performance',
        '8. Define surge margins for compression components',
        '9. Establish operating line characteristics',
        '10. Document component technology assumptions'
      ],
      outputFormat: 'JSON object with component performance models'
    },
    outputSchema: {
      type: 'object',
      required: ['compressorMaps', 'turbineMaps', 'efficiencies'],
      properties: {
        compressorMaps: {
          type: 'object',
          properties: {
            fan: { type: 'object' },
            lpc: { type: 'object' },
            hpc: { type: 'object' }
          }
        },
        turbineMaps: {
          type: 'object',
          properties: {
            hpt: { type: 'object' },
            lpt: { type: 'object' }
          }
        },
        efficiencies: {
          type: 'object',
          properties: {
            fanPolytropic: { type: 'number' },
            compressorPolytropic: { type: 'number' },
            turbinePolytropic: { type: 'number' },
            combustor: { type: 'number' },
            mechanical: { type: 'number' }
          }
        },
        pressureLosses: { type: 'object' },
        surgeMargins: { type: 'object' },
        coolingModel: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'gas-turbine', 'components', 'aerospace']
}));

export const cycleAnalysisTask = defineTask('cycle-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Thermodynamic Cycle Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gas Turbine Thermodynamic Analyst',
      task: 'Perform detailed thermodynamic cycle analysis',
      context: {
        projectName: args.projectName,
        architecture: args.architecture,
        componentMaps: args.componentMaps,
        designPoint: args.designPoint
      },
      instructions: [
        '1. Calculate inlet conditions and ram effects',
        '2. Perform compression process analysis (fan, LPC, HPC)',
        '3. Calculate combustor fuel flow and exit conditions',
        '4. Perform turbine expansion analysis (HPT, LPT)',
        '5. Calculate core and bypass nozzle performance',
        '6. Compute thrust and specific fuel consumption',
        '7. Calculate cycle thermal and propulsive efficiency',
        '8. Generate station-by-station thermodynamic data',
        '9. Verify power and flow balances',
        '10. Document cycle convergence and residuals'
      ],
      outputFormat: 'JSON object with complete cycle analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['converged', 'designPoint', 'stationData', 'performance'],
      properties: {
        converged: { type: 'boolean' },
        convergenceError: { type: 'number' },
        designPoint: {
          type: 'object',
          properties: {
            thrust: { type: 'number' },
            sfc: { type: 'number' },
            airflow: { type: 'number' },
            fuelFlow: { type: 'number' }
          }
        },
        stationData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              station: { type: 'string' },
              totalTemperature: { type: 'number' },
              totalPressure: { type: 'number' },
              massFlow: { type: 'number' },
              mach: { type: 'number' }
            }
          }
        },
        performance: {
          type: 'object',
          properties: {
            thermalEfficiency: { type: 'number' },
            propulsiveEfficiency: { type: 'number' },
            overallEfficiency: { type: 'number' },
            bypassRatio: { type: 'number' }
          }
        },
        componentOperatingPoints: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'gas-turbine', 'thermodynamics', 'aerospace']
}));

export const offDesignAnalysisTask = defineTask('off-design-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Off-Design Performance Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gas Turbine Off-Design Performance Engineer',
      task: 'Analyze engine performance across operating envelope',
      context: {
        projectName: args.projectName,
        designCycle: args.designCycle,
        componentMaps: args.componentMaps,
        operatingEnvelope: args.operatingEnvelope
      },
      instructions: [
        '1. Define operating points across altitude-Mach envelope',
        '2. Calculate performance at part-power conditions',
        '3. Analyze transient operation capability',
        '4. Determine component matching at off-design',
        '5. Calculate surge margins across envelope',
        '6. Analyze idle and windmill operation',
        '7. Determine relight envelope',
        '8. Calculate performance with bleed and power extraction',
        '9. Analyze hot day and cold day performance',
        '10. Generate off-design performance tables'
      ],
      outputFormat: 'JSON object with off-design performance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['envelopePerformance', 'partPower', 'operatingLimits'],
      properties: {
        envelopePerformance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              altitude: { type: 'number' },
              mach: { type: 'number' },
              thrust: { type: 'number' },
              sfc: { type: 'number' },
              surgeMargin: { type: 'number' }
            }
          }
        },
        partPower: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              throttleSetting: { type: 'number' },
              thrust: { type: 'number' },
              sfc: { type: 'number' },
              n1: { type: 'number' },
              n2: { type: 'number' }
            }
          }
        },
        operatingLimits: {
          type: 'object',
          properties: {
            maxThrust: { type: 'object' },
            surgeLine: { type: 'array', items: { type: 'object' } },
            temperatureLimits: { type: 'object' }
          }
        },
        transientCapability: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'gas-turbine', 'off-design', 'aerospace']
}));

export const optimizationTask = defineTask('cycle-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cycle Optimization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gas Turbine Optimization Specialist',
      task: 'Optimize cycle parameters for best performance',
      context: {
        projectName: args.projectName,
        cycleAnalysis: args.cycleAnalysis,
        offDesignAnalysis: args.offDesignAnalysis,
        designRequirements: args.designRequirements,
        constraints: args.constraints
      },
      instructions: [
        '1. Define optimization objectives (min SFC, max thrust, multi-objective)',
        '2. Identify optimization variables (OPR, BPR, FPR, TIT)',
        '3. Apply design constraints (temperature, weight, diameter)',
        '4. Perform parametric studies for key parameters',
        '5. Execute multi-variable optimization',
        '6. Analyze Pareto front for multi-objective cases',
        '7. Validate optimized design feasibility',
        '8. Compare optimized vs baseline performance',
        '9. Document design sensitivities',
        '10. Provide recommended optimal design'
      ],
      outputFormat: 'JSON object with optimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedCycle', 'optimizedParameters', 'improvement'],
      properties: {
        optimizedCycle: {
          type: 'object',
          properties: {
            thrust: { type: 'number' },
            sfc: { type: 'number' },
            thermalEfficiency: { type: 'number' }
          }
        },
        optimizedParameters: {
          type: 'object',
          properties: {
            opr: { type: 'number' },
            bpr: { type: 'number' },
            fpr: { type: 'number' },
            tit: { type: 'number' }
          }
        },
        improvement: {
          type: 'object',
          properties: {
            sfc: { type: 'number' },
            thrust: { type: 'number' },
            efficiency: { type: 'number' }
          }
        },
        tradeStudies: { type: 'array', items: { type: 'object' } },
        paretoFront: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'gas-turbine', 'optimization', 'aerospace']
}));

export const emissionsAnalysisTask = defineTask('emissions-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Emissions Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gas Turbine Emissions Engineer',
      task: 'Analyze engine emissions and environmental impact',
      context: {
        projectName: args.projectName,
        optimizedCycle: args.optimizedCycle,
        operatingProfile: args.operatingProfile
      },
      instructions: [
        '1. Calculate CO2 emissions from fuel burn',
        '2. Estimate NOx emissions using combustor correlations',
        '3. Calculate CO and UHC emissions',
        '4. Estimate particulate matter emissions',
        '5. Analyze emissions across operating envelope',
        '6. Compare with ICAO/CAEP emissions standards',
        '7. Calculate landing-takeoff (LTO) cycle emissions',
        '8. Estimate mission-level emissions',
        '9. Assess contrail and climate impact',
        '10. Recommend emissions reduction strategies'
      ],
      outputFormat: 'JSON object with emissions analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['emissions', 'compliance'],
      properties: {
        emissions: {
          type: 'object',
          properties: {
            co2: { type: 'number' },
            nox: { type: 'number' },
            co: { type: 'number' },
            uhc: { type: 'number' },
            pm: { type: 'number' }
          }
        },
        ltoEmissions: { type: 'object' },
        compliance: {
          type: 'object',
          properties: {
            caepStandard: { type: 'string' },
            margin: { type: 'number' },
            compliant: { type: 'boolean' }
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
  labels: ['propulsion', 'gas-turbine', 'emissions', 'aerospace']
}));

export const sensitivityAnalysisTask = defineTask('sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sensitivity Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gas Turbine Uncertainty Analysis Engineer',
      task: 'Perform sensitivity analysis on cycle performance',
      context: {
        projectName: args.projectName,
        optimizedCycle: args.optimizedCycle,
        parameterRanges: args.parameterRanges
      },
      instructions: [
        '1. Identify key sensitivity parameters',
        '2. Perform one-at-a-time sensitivity analysis',
        '3. Calculate sensitivity coefficients for SFC, thrust',
        '4. Perform Monte Carlo uncertainty propagation',
        '5. Identify dominant uncertainty contributors',
        '6. Analyze component degradation effects',
        '7. Assess manufacturing tolerance effects',
        '8. Calculate performance guarantees with uncertainty',
        '9. Identify robust design parameters',
        '10. Document sensitivity results and implications'
      ],
      outputFormat: 'JSON object with sensitivity analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['sensitivities', 'uncertainty'],
      properties: {
        sensitivities: {
          type: 'object',
          properties: {
            sfcToEfficiency: { type: 'object' },
            thrustToTIT: { type: 'object' },
            sfcToOPR: { type: 'object' }
          }
        },
        uncertainty: {
          type: 'object',
          properties: {
            sfcUncertainty: { type: 'number' },
            thrustUncertainty: { type: 'number' },
            confidenceLevel: { type: 'number' }
          }
        },
        dominantFactors: { type: 'array', items: { type: 'string' } },
        degradationEffects: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'gas-turbine', 'sensitivity', 'aerospace']
}));

export const performanceMapTask = defineTask('performance-map', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Map Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gas Turbine Performance Data Engineer',
      task: 'Generate engine performance maps and deck data',
      context: {
        projectName: args.projectName,
        optimizedCycle: args.optimizedCycle,
        componentMaps: args.componentMaps,
        operatingEnvelope: args.operatingEnvelope
      },
      instructions: [
        '1. Generate thrust-altitude-Mach performance maps',
        '2. Create SFC-thrust characteristic at multiple conditions',
        '3. Generate fuel flow maps',
        '4. Create spool speed schedules',
        '5. Generate bleed air availability maps',
        '6. Create power extraction capability maps',
        '7. Generate temperature margin maps',
        '8. Format data for flight simulation integration',
        '9. Create interpolation tables',
        '10. Document map limitations and validity ranges'
      ],
      outputFormat: 'JSON object with performance maps'
    },
    outputSchema: {
      type: 'object',
      required: ['maps', 'format'],
      properties: {
        maps: {
          type: 'object',
          properties: {
            thrustMap: { type: 'object' },
            sfcMap: { type: 'object' },
            fuelFlowMap: { type: 'object' },
            spoolSpeedMap: { type: 'object' }
          }
        },
        format: { type: 'string' },
        interpolationMethod: { type: 'string' },
        validityLimits: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['propulsion', 'gas-turbine', 'performance-maps', 'aerospace']
}));

export const cycleReportTask = defineTask('cycle-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cycle Analysis Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Gas Turbine Technical Writer',
      task: 'Generate comprehensive gas turbine cycle analysis report',
      context: {
        projectName: args.projectName,
        engineType: args.engineType,
        designPointDef: args.designPointDef,
        cycleArchitecture: args.cycleArchitecture,
        cycleAnalysis: args.cycleAnalysis,
        offDesignAnalysis: args.offDesignAnalysis,
        optimization: args.optimization,
        emissionsAnalysis: args.emissionsAnalysis,
        sensitivityAnalysis: args.sensitivityAnalysis,
        performanceMap: args.performanceMap
      },
      instructions: [
        '1. Create executive summary with key performance metrics',
        '2. Document design requirements and constraints',
        '3. Present cycle architecture and rationale',
        '4. Detail thermodynamic cycle analysis results',
        '5. Present off-design performance characteristics',
        '6. Document optimization results and improvements',
        '7. Present emissions analysis and compliance',
        '8. Include sensitivity analysis findings',
        '9. Document performance map data',
        '10. Generate both structured JSON and markdown formats'
      ],
      outputFormat: 'JSON object with complete analysis report'
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
            architecture: { type: 'object' },
            performance: { type: 'object' },
            optimization: { type: 'object' },
            emissions: { type: 'object' },
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
  labels: ['propulsion', 'gas-turbine', 'reporting', 'aerospace']
}));
