/**
 * @process specializations/domains/science/electrical-engineering/renewable-integration
 * @description Renewable Energy Integration Study - Guide the technical analysis for integrating renewable energy
 * sources (solar, wind) into power systems. Addresses interconnection requirements, grid impact, and stability concerns.
 * @inputs { projectName: string, renewableType: string, capacity: string, interconnectionPoint: object, gridData?: object }
 * @outputs { success: boolean, impactAssessment: object, interconnectionRequirements: object, stabilityAnalysis: object, complianceStatus: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/renewable-integration', {
 *   projectName: '50MW Solar Farm',
 *   renewableType: 'solar-pv',
 *   capacity: '50MW',
 *   interconnectionPoint: { voltage: '138kV', substation: 'Main Sub', pcc: 'Bus 5' },
 *   gridData: { shortCircuitLevel: '2000MVA', existingRenewables: '20%' }
 * });
 *
 * @references
 * - IEEE 1547 (Interconnection Standards)
 * - IEC 61850 (Communication Networks)
 * - Regional Grid Codes
 * - NERC Reliability Standards
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    renewableType,
    capacity,
    interconnectionPoint,
    gridData = {}
  } = inputs;

  // Phase 1: Characterize Renewable Resource and Generation Profile
  const resourceCharacterization = await ctx.task(resourceCharacterizationTask, {
    projectName,
    renewableType,
    capacity,
    interconnectionPoint
  });

  // Breakpoint: Review resource characterization
  await ctx.breakpoint({
    question: `Review renewable resource characterization for ${projectName}. Capacity factor: ${resourceCharacterization.capacityFactor}. Proceed with modeling?`,
    title: 'Resource Characterization Review',
    context: {
      runId: ctx.runId,
      projectName,
      resourceProfile: resourceCharacterization.profile,
      files: [{
        path: `artifacts/phase1-resource.json`,
        format: 'json',
        content: resourceCharacterization
      }]
    }
  });

  // Phase 2: Model Inverter/Converter Control Characteristics
  const inverterModeling = await ctx.task(inverterModelingTask, {
    projectName,
    renewableType,
    capacity,
    resourceProfile: resourceCharacterization.profile
  });

  // Phase 3: Perform Steady-State Impact Analysis
  const steadyStateAnalysis = await ctx.task(steadyStateAnalysisTask, {
    projectName,
    capacity,
    interconnectionPoint,
    gridData,
    inverterModel: inverterModeling.model
  });

  // Quality Gate: Check for steady-state violations
  if (steadyStateAnalysis.violations && steadyStateAnalysis.violations.length > 0) {
    await ctx.breakpoint({
      question: `Steady-state analysis found ${steadyStateAnalysis.violations.length} violations. Review mitigations before proceeding?`,
      title: 'Steady-State Violations',
      context: {
        runId: ctx.runId,
        violations: steadyStateAnalysis.violations,
        mitigations: steadyStateAnalysis.proposedMitigations
      }
    });
  }

  // Phase 4: Analyze Voltage Regulation and Power Quality
  const powerQualityAnalysis = await ctx.task(powerQualityAnalysisTask, {
    projectName,
    steadyStateResults: steadyStateAnalysis.results,
    inverterModel: inverterModeling.model,
    interconnectionPoint
  });

  // Phase 5: Study Fault Ride-Through Capabilities
  const faultRideThroughStudy = await ctx.task(faultRideThroughStudyTask, {
    projectName,
    inverterModel: inverterModeling.model,
    gridData,
    interconnectionPoint
  });

  // Breakpoint: Review fault ride-through compliance
  await ctx.breakpoint({
    question: `Fault ride-through study complete for ${projectName}. Compliance: ${faultRideThroughStudy.compliant ? 'YES' : 'NO'}. Review results?`,
    title: 'Fault Ride-Through Review',
    context: {
      runId: ctx.runId,
      compliance: faultRideThroughStudy.compliance,
      testResults: faultRideThroughStudy.testResults,
      files: [{
        path: `artifacts/phase5-frt.json`,
        format: 'json',
        content: faultRideThroughStudy
      }]
    }
  });

  // Phase 6: Assess Grid Stability and Frequency Response
  const stabilityAssessment = await ctx.task(stabilityAssessmentTask, {
    projectName,
    capacity,
    gridData,
    inverterModel: inverterModeling.model,
    interconnectionPoint
  });

  // Quality Gate: Check stability margins
  if (!stabilityAssessment.stable) {
    await ctx.breakpoint({
      question: `Stability assessment indicates potential issues: ${stabilityAssessment.concerns.join(', ')}. Review stability enhancements?`,
      title: 'Stability Concerns',
      context: {
        runId: ctx.runId,
        concerns: stabilityAssessment.concerns,
        recommendations: stabilityAssessment.recommendations
      }
    });
  }

  // Phase 7: Design Protection and Control Modifications
  const protectionControlDesign = await ctx.task(protectionControlDesignTask, {
    projectName,
    interconnectionPoint,
    inverterModel: inverterModeling.model,
    steadyStateResults: steadyStateAnalysis.results,
    stabilityAssessment
  });

  // Phase 8: Document Compliance with Interconnection Standards
  const complianceDocumentation = await ctx.task(complianceDocumentationTask, {
    projectName,
    renewableType,
    capacity,
    resourceCharacterization,
    inverterModeling,
    steadyStateAnalysis,
    powerQualityAnalysis,
    faultRideThroughStudy,
    stabilityAssessment,
    protectionControlDesign,
    interconnectionPoint
  });

  // Final Breakpoint: Study Approval
  await ctx.breakpoint({
    question: `Renewable integration study complete for ${projectName}. Overall compliance: ${complianceDocumentation.overallCompliance}. Approve study?`,
    title: 'Study Approval',
    context: {
      runId: ctx.runId,
      projectName,
      complianceStatus: complianceDocumentation.complianceStatus,
      keyFindings: complianceDocumentation.keyFindings,
      files: [
        { path: `artifacts/integration-study.json`, format: 'json', content: complianceDocumentation.technicalData },
        { path: `artifacts/integration-report.md`, format: 'markdown', content: complianceDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    renewableType,
    capacity,
    impactAssessment: {
      steadyState: steadyStateAnalysis.results,
      powerQuality: powerQualityAnalysis.results,
      violations: steadyStateAnalysis.violations
    },
    interconnectionRequirements: {
      protection: protectionControlDesign.protectionRequirements,
      control: protectionControlDesign.controlRequirements,
      metering: protectionControlDesign.meteringRequirements
    },
    stabilityAnalysis: {
      stable: stabilityAssessment.stable,
      frequencyResponse: stabilityAssessment.frequencyResponse,
      voltageStability: stabilityAssessment.voltageStability
    },
    faultRideThrough: faultRideThroughStudy.compliance,
    complianceStatus: complianceDocumentation.complianceStatus,
    documentation: complianceDocumentation.document,
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/renewable-integration',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const resourceCharacterizationTask = defineTask('resource-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Resource Characterization - ${args.projectName}`,
  agent: {
    name: 'renewable-integration-expert',
    prompt: {
      role: 'Renewable Energy Resource Analyst',
      task: 'Characterize renewable resource and generation profile',
      context: {
        projectName: args.projectName,
        renewableType: args.renewableType,
        capacity: args.capacity,
        interconnectionPoint: args.interconnectionPoint
      },
      instructions: [
        '1. Analyze historical resource data (irradiance for solar, wind speed for wind)',
        '2. Develop hourly generation profiles for typical days',
        '3. Calculate capacity factor and annual energy production',
        '4. Analyze variability and ramp rate characteristics',
        '5. Identify correlation with load patterns',
        '6. Assess seasonal and diurnal variations',
        '7. Evaluate extreme event scenarios (cloud cover, wind gusts)',
        '8. Calculate probability distributions for output',
        '9. Assess forecast uncertainty',
        '10. Document resource characterization methodology'
      ],
      outputFormat: 'JSON object with resource characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['profile', 'capacityFactor'],
      properties: {
        profile: {
          type: 'object',
          properties: {
            hourlyGeneration: { type: 'array', items: { type: 'number' } },
            peakOutput: { type: 'string' },
            minimumOutput: { type: 'string' },
            rampRates: { type: 'object' }
          }
        },
        capacityFactor: { type: 'string' },
        annualEnergy: { type: 'string' },
        variability: { type: 'object' },
        extremeScenarios: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'renewable', 'resource-analysis']
}));

export const inverterModelingTask = defineTask('inverter-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Inverter Modeling - ${args.projectName}`,
  agent: {
    name: 'renewable-integration-expert',
    prompt: {
      role: 'Power Electronics Engineer specializing in grid-tied inverters',
      task: 'Model inverter/converter control characteristics',
      context: {
        projectName: args.projectName,
        renewableType: args.renewableType,
        capacity: args.capacity,
        resourceProfile: args.resourceProfile
      },
      instructions: [
        '1. Define inverter topology and configuration',
        '2. Model active power control modes (curtailment, ramp rate control)',
        '3. Model reactive power control capabilities (voltage regulation, power factor)',
        '4. Define voltage-reactive power (Volt-VAR) curves',
        '5. Model frequency-watt response characteristics',
        '6. Define fault current contribution characteristics',
        '7. Model anti-islanding protection',
        '8. Specify communication and control interfaces',
        '9. Define operating limits and protection settings',
        '10. Document inverter model parameters'
      ],
      outputFormat: 'JSON object with inverter model'
    },
    outputSchema: {
      type: 'object',
      required: ['model'],
      properties: {
        model: {
          type: 'object',
          properties: {
            topology: { type: 'string' },
            activePowerControl: { type: 'object' },
            reactivePowerControl: { type: 'object' },
            voltVarCurve: { type: 'array', items: { type: 'object' } },
            freqWattCurve: { type: 'array', items: { type: 'object' } },
            faultResponse: { type: 'object' },
            protectionSettings: { type: 'object' }
          }
        },
        specifications: { type: 'object' },
        controlModes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'renewable', 'inverter', 'modeling']
}));

export const steadyStateAnalysisTask = defineTask('steady-state-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Steady-State Impact Analysis - ${args.projectName}`,
  agent: {
    name: 'renewable-integration-expert',
    prompt: {
      role: 'Power Systems Engineer specializing in interconnection studies',
      task: 'Perform steady-state impact analysis for renewable interconnection',
      context: {
        projectName: args.projectName,
        capacity: args.capacity,
        interconnectionPoint: args.interconnectionPoint,
        gridData: args.gridData,
        inverterModel: args.inverterModel
      },
      instructions: [
        '1. Run power flow with renewable generation at various output levels',
        '2. Analyze thermal loading on transmission lines and transformers',
        '3. Evaluate voltage profile impact throughout the system',
        '4. Calculate short-circuit contribution from renewable plant',
        '5. Analyze reverse power flow scenarios',
        '6. Evaluate contingency performance with renewable generation',
        '7. Calculate losses impact',
        '8. Identify system upgrade requirements',
        '9. Analyze multiple generation scenarios (high/low load, high/low renewable)',
        '10. Document steady-state impact summary'
      ],
      outputFormat: 'JSON object with steady-state analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['results'],
      properties: {
        results: {
          type: 'object',
          properties: {
            thermalLoading: { type: 'array', items: { type: 'object' } },
            voltageImpact: { type: 'object' },
            shortCircuitContribution: { type: 'object' },
            lossesImpact: { type: 'object' }
          }
        },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              scenario: { type: 'string' }
            }
          }
        },
        proposedMitigations: { type: 'array', items: { type: 'object' } },
        upgradeRequirements: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'renewable', 'steady-state', 'impact']
}));

export const powerQualityAnalysisTask = defineTask('power-quality-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Power Quality Analysis - ${args.projectName}`,
  agent: {
    name: 'renewable-integration-expert',
    prompt: {
      role: 'Power Quality Engineer',
      task: 'Analyze voltage regulation and power quality impacts',
      context: {
        projectName: args.projectName,
        steadyStateResults: args.steadyStateResults,
        inverterModel: args.inverterModel,
        interconnectionPoint: args.interconnectionPoint
      },
      instructions: [
        '1. Analyze voltage flicker from output variability',
        '2. Evaluate harmonic injection from inverters',
        '3. Calculate voltage regulation requirements',
        '4. Assess impact on voltage regulating equipment',
        '5. Analyze rapid voltage change (RVC) events',
        '6. Evaluate power factor and reactive power management',
        '7. Assess impact on existing power quality issues',
        '8. Design harmonic filtering if required',
        '9. Specify power quality monitoring requirements',
        '10. Document power quality compliance'
      ],
      outputFormat: 'JSON object with power quality analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['results'],
      properties: {
        results: {
          type: 'object',
          properties: {
            flicker: { type: 'object' },
            harmonics: { type: 'object' },
            voltageRegulation: { type: 'object' },
            rapidVoltageChange: { type: 'object' }
          }
        },
        compliance: { type: 'object' },
        mitigations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'renewable', 'power-quality']
}));

export const faultRideThroughStudyTask = defineTask('fault-ride-through', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Fault Ride-Through Study - ${args.projectName}`,
  agent: {
    name: 'renewable-integration-expert',
    prompt: {
      role: 'Grid Integration Engineer specializing in fault ride-through',
      task: 'Study fault ride-through capabilities and compliance',
      context: {
        projectName: args.projectName,
        inverterModel: args.inverterModel,
        gridData: args.gridData,
        interconnectionPoint: args.interconnectionPoint
      },
      instructions: [
        '1. Define fault ride-through requirements per applicable standard',
        '2. Simulate three-phase fault response',
        '3. Simulate single-phase fault response',
        '4. Analyze voltage support during faults',
        '5. Evaluate reactive current injection requirements',
        '6. Test low voltage ride-through (LVRT) compliance',
        '7. Test high voltage ride-through (HVRT) compliance',
        '8. Analyze post-fault recovery behavior',
        '9. Verify protection coordination during faults',
        '10. Document fault ride-through test results'
      ],
      outputFormat: 'JSON object with fault ride-through results'
    },
    outputSchema: {
      type: 'object',
      required: ['compliant', 'compliance', 'testResults'],
      properties: {
        compliant: { type: 'boolean' },
        compliance: {
          type: 'object',
          properties: {
            lvrt: { type: 'boolean' },
            hvrt: { type: 'boolean' },
            reactiveCurrent: { type: 'boolean' }
          }
        },
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testCase: { type: 'string' },
              faultType: { type: 'string' },
              voltageLevel: { type: 'string' },
              duration: { type: 'string' },
              result: { type: 'string' }
            }
          }
        },
        nonCompliances: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'renewable', 'fault-ride-through']
}));

export const stabilityAssessmentTask = defineTask('stability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Stability Assessment - ${args.projectName}`,
  agent: {
    name: 'renewable-integration-expert',
    prompt: {
      role: 'Power System Stability Engineer',
      task: 'Assess grid stability and frequency response with renewable integration',
      context: {
        projectName: args.projectName,
        capacity: args.capacity,
        gridData: args.gridData,
        inverterModel: args.inverterModel,
        interconnectionPoint: args.interconnectionPoint
      },
      instructions: [
        '1. Analyze frequency response and inertia impact',
        '2. Evaluate primary frequency response requirements',
        '3. Study voltage stability with renewable variability',
        '4. Analyze small-signal stability (oscillations)',
        '5. Study transient stability for major disturbances',
        '6. Evaluate sub-synchronous oscillation risks',
        '7. Analyze control interactions with other grid equipment',
        '8. Assess weak grid performance',
        '9. Evaluate need for grid-forming capabilities',
        '10. Document stability margins and concerns'
      ],
      outputFormat: 'JSON object with stability assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['stable', 'frequencyResponse', 'voltageStability'],
      properties: {
        stable: { type: 'boolean' },
        frequencyResponse: {
          type: 'object',
          properties: {
            inertiaContribution: { type: 'string' },
            primaryResponse: { type: 'string' },
            nadir: { type: 'string' }
          }
        },
        voltageStability: {
          type: 'object',
          properties: {
            margin: { type: 'string' },
            weakestBus: { type: 'string' }
          }
        },
        transientStability: { type: 'object' },
        oscillationRisks: { type: 'array', items: { type: 'object' } },
        concerns: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'renewable', 'stability']
}));

export const protectionControlDesignTask = defineTask('protection-control-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Protection and Control Design - ${args.projectName}`,
  agent: {
    name: 'renewable-integration-expert',
    prompt: {
      role: 'Protection and Control Engineer for renewable integration',
      task: 'Design protection and control modifications for interconnection',
      context: {
        projectName: args.projectName,
        interconnectionPoint: args.interconnectionPoint,
        inverterModel: args.inverterModel,
        steadyStateResults: args.steadyStateResults,
        stabilityAssessment: args.stabilityAssessment
      },
      instructions: [
        '1. Design interconnection protection scheme',
        '2. Specify relay settings for renewable plant protection',
        '3. Design anti-islanding protection',
        '4. Specify utility-grade metering requirements',
        '5. Design SCADA and communication interfaces',
        '6. Specify automatic generation control (AGC) interface',
        '7. Design reactive power control scheme',
        '8. Specify curtailment control requirements',
        '9. Design fault recording and monitoring systems',
        '10. Document protection and control requirements'
      ],
      outputFormat: 'JSON object with protection and control design'
    },
    outputSchema: {
      type: 'object',
      required: ['protectionRequirements', 'controlRequirements', 'meteringRequirements'],
      properties: {
        protectionRequirements: {
          type: 'object',
          properties: {
            interconnectionProtection: { type: 'object' },
            plantProtection: { type: 'object' },
            antiIslanding: { type: 'object' }
          }
        },
        controlRequirements: {
          type: 'object',
          properties: {
            scadaInterface: { type: 'object' },
            agcInterface: { type: 'object' },
            curtailmentControl: { type: 'object' }
          }
        },
        meteringRequirements: {
          type: 'object',
          properties: {
            revenueMetering: { type: 'object' },
            settlementMetering: { type: 'object' }
          }
        },
        communicationRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'renewable', 'protection', 'control']
}));

export const complianceDocumentationTask = defineTask('compliance-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Compliance Documentation - ${args.projectName}`,
  agent: {
    name: 'renewable-integration-expert',
    prompt: {
      role: 'Grid Interconnection Compliance Specialist',
      task: 'Document compliance with interconnection standards',
      context: {
        projectName: args.projectName,
        renewableType: args.renewableType,
        capacity: args.capacity,
        resourceCharacterization: args.resourceCharacterization,
        inverterModeling: args.inverterModeling,
        steadyStateAnalysis: args.steadyStateAnalysis,
        powerQualityAnalysis: args.powerQualityAnalysis,
        faultRideThroughStudy: args.faultRideThroughStudy,
        stabilityAssessment: args.stabilityAssessment,
        protectionControlDesign: args.protectionControlDesign,
        interconnectionPoint: args.interconnectionPoint
      },
      instructions: [
        '1. Compile compliance matrix against IEEE 1547 requirements',
        '2. Document compliance with regional grid code requirements',
        '3. Summarize steady-state impact study results',
        '4. Document power quality compliance',
        '5. Summarize fault ride-through test results',
        '6. Document stability study findings',
        '7. Compile protection and control specifications',
        '8. Document commissioning test requirements',
        '9. Identify any exemptions or special conditions',
        '10. Generate comprehensive interconnection study report'
      ],
      outputFormat: 'JSON object with compliance documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceStatus', 'overallCompliance', 'document', 'markdown'],
      properties: {
        complianceStatus: {
          type: 'object',
          properties: {
            ieee1547: { type: 'object' },
            gridCode: { type: 'object' },
            powerQuality: { type: 'object' },
            stability: { type: 'object' }
          }
        },
        overallCompliance: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        technicalData: { type: 'object' },
        document: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            studyMethodology: { type: 'string' },
            results: { type: 'object' },
            recommendations: { type: 'array', items: { type: 'string' } }
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
  labels: ['ee', 'renewable', 'compliance', 'documentation']
}));
