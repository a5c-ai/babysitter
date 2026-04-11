/**
 * @process specializations/domains/science/automotive-engineering/battery-system-design
 * @description Battery System Design and Validation - Design, develop, and validate battery systems for electric
 * vehicles including cell selection, pack architecture, battery management system (BMS), and thermal management.
 * @inputs { projectName: string, vehicleClass: string, performanceTargets: object, safetyStandards?: string[] }
 * @outputs { success: boolean, batteryPackDesign: object, bmsSpecification: object, thermalAnalysis: object, safetyTestReports: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/battery-system-design', {
 *   projectName: 'EV-Battery-Pack-400V',
 *   vehicleClass: 'D-Segment Sedan',
 *   performanceTargets: { capacity: 80, range: 400, fastChargeTime: 30, peakPower: 200 },
 *   safetyStandards: ['UN ECE R100', 'IEC 62660', 'SAE J2464', 'GB/T 31485']
 * });
 *
 * @references
 * - UN ECE R100 Electric Vehicle Safety
 * - IEC 62660 Lithium-ion Cells for EV
 * - SAE J2464 EV Battery Abuse Testing
 * - ISO 6469 EV Safety Specifications
 * - GB/T 31485 Chinese EV Battery Standards
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    vehicleClass,
    performanceTargets = {},
    safetyStandards = ['UN ECE R100', 'IEC 62660', 'SAE J2464']
  } = inputs;

  // Phase 1: Cell Selection and Characterization
  const cellSelection = await ctx.task(cellSelectionTask, {
    projectName,
    vehicleClass,
    performanceTargets
  });

  // Quality Gate: Cell selection must be complete
  if (!cellSelection.selectedCell) {
    return {
      success: false,
      error: 'Battery cell selection not completed',
      phase: 'cell-selection',
      batteryPackDesign: null
    };
  }

  // Breakpoint: Cell selection review
  await ctx.breakpoint({
    question: `Review cell selection for ${projectName}. Selected: ${cellSelection.selectedCell.manufacturer} ${cellSelection.selectedCell.model}. Approve cell selection?`,
    title: 'Cell Selection Review',
    context: {
      runId: ctx.runId,
      projectName,
      cellSelection,
      files: [{
        path: `artifacts/cell-selection.json`,
        format: 'json',
        content: cellSelection
      }]
    }
  });

  // Phase 2: Pack Architecture Design
  const packArchitecture = await ctx.task(packArchitectureTask, {
    projectName,
    selectedCell: cellSelection.selectedCell,
    performanceTargets,
    vehicleClass
  });

  // Phase 3: BMS Development
  const bmsDesign = await ctx.task(bmsDesignTask, {
    projectName,
    packArchitecture,
    selectedCell: cellSelection.selectedCell,
    performanceTargets
  });

  // Phase 4: Thermal Management Design
  const thermalDesign = await ctx.task(thermalDesignTask, {
    projectName,
    packArchitecture,
    selectedCell: cellSelection.selectedCell,
    performanceTargets
  });

  // Phase 5: Safety Analysis
  const safetyAnalysis = await ctx.task(safetyAnalysisTask, {
    projectName,
    packArchitecture,
    bmsDesign,
    thermalDesign,
    safetyStandards
  });

  // Quality Gate: Safety analysis must pass
  if (safetyAnalysis.criticalIssues && safetyAnalysis.criticalIssues.length > 0) {
    await ctx.breakpoint({
      question: `Safety analysis identified ${safetyAnalysis.criticalIssues.length} critical issues. Review and address before proceeding?`,
      title: 'Battery Safety Critical Issues',
      context: {
        runId: ctx.runId,
        criticalIssues: safetyAnalysis.criticalIssues,
        recommendation: 'Address all critical safety issues before validation'
      }
    });
  }

  // Phase 6: Abuse Testing Validation
  const abuseTestPlan = await ctx.task(abuseTestPlanTask, {
    projectName,
    packArchitecture,
    safetyStandards,
    safetyAnalysis
  });

  // Phase 7: Design Documentation
  const designDocumentation = await ctx.task(designDocumentationTask, {
    projectName,
    vehicleClass,
    cellSelection,
    packArchitecture,
    bmsDesign,
    thermalDesign,
    safetyAnalysis,
    abuseTestPlan
  });

  // Final Breakpoint: Design approval
  await ctx.breakpoint({
    question: `Battery System Design complete for ${projectName}. Total capacity: ${packArchitecture.totalCapacity} kWh. Approve design for prototype build?`,
    title: 'Battery System Design Approval',
    context: {
      runId: ctx.runId,
      projectName,
      designSummary: designDocumentation.summary,
      files: [
        { path: `artifacts/battery-pack-design.json`, format: 'json', content: packArchitecture },
        { path: `artifacts/bms-specification.json`, format: 'json', content: bmsDesign },
        { path: `artifacts/thermal-analysis.json`, format: 'json', content: thermalDesign }
      ]
    }
  });

  return {
    success: true,
    projectName,
    batteryPackDesign: packArchitecture.design,
    bmsSpecification: bmsDesign.specification,
    thermalAnalysis: thermalDesign.analysis,
    safetyTestReports: {
      safetyAnalysis: safetyAnalysis.analysis,
      abuseTestPlan: abuseTestPlan.plan
    },
    cellSelection: cellSelection.selectedCell,
    performanceProjections: designDocumentation.performanceProjections,
    nextSteps: designDocumentation.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/battery-system-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const cellSelectionTask = defineTask('cell-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Cell Selection and Characterization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Battery Cell Engineer with expertise in lithium-ion technology',
      task: 'Select and characterize battery cells for EV application',
      context: {
        projectName: args.projectName,
        vehicleClass: args.vehicleClass,
        performanceTargets: args.performanceTargets
      },
      instructions: [
        '1. Define cell requirements based on vehicle performance targets',
        '2. Evaluate cell chemistry options (NMC, LFP, NCA, solid-state)',
        '3. Analyze cell format options (cylindrical, prismatic, pouch)',
        '4. Evaluate supplier options and supply chain reliability',
        '5. Characterize cell performance (capacity, resistance, cycle life)',
        '6. Analyze cell thermal characteristics',
        '7. Evaluate cell safety characteristics',
        '8. Assess cell cost and volume availability',
        '9. Conduct cell aging characterization',
        '10. Select optimal cell with rationale'
      ],
      outputFormat: 'JSON object with cell selection analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedCell', 'alternatives', 'characterization'],
      properties: {
        selectedCell: {
          type: 'object',
          properties: {
            manufacturer: { type: 'string' },
            model: { type: 'string' },
            chemistry: { type: 'string' },
            format: { type: 'string' },
            nominalCapacity: { type: 'number' },
            nominalVoltage: { type: 'number' },
            energyDensity: { type: 'number' },
            maxDischargePower: { type: 'number' },
            maxChargePower: { type: 'number' }
          }
        },
        alternatives: { type: 'array', items: { type: 'object' } },
        characterization: { type: 'object' },
        selectionRationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'battery', 'cell-selection', 'EV']
}));

export const packArchitectureTask = defineTask('pack-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Pack Architecture Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Battery Pack Design Engineer',
      task: 'Design battery pack architecture and structure',
      context: {
        projectName: args.projectName,
        selectedCell: args.selectedCell,
        performanceTargets: args.performanceTargets,
        vehicleClass: args.vehicleClass
      },
      instructions: [
        '1. Define pack configuration (series/parallel cell arrangement)',
        '2. Design module structure and cell grouping',
        '3. Design pack housing and enclosure',
        '4. Define high-voltage distribution architecture',
        '5. Design pack mounting and integration points',
        '6. Specify pack connectors and HV interfaces',
        '7. Design crash protection and structural reinforcement',
        '8. Define service disconnect and safety features',
        '9. Calculate pack weight and energy density',
        '10. Create pack assembly sequence'
      ],
      outputFormat: 'JSON object with pack architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'configuration', 'totalCapacity'],
      properties: {
        design: {
          type: 'object',
          properties: {
            configuration: { type: 'string' },
            modules: { type: 'array', items: { type: 'object' } },
            housing: { type: 'object' },
            hvDistribution: { type: 'object' }
          }
        },
        configuration: {
          type: 'object',
          properties: {
            cellsInSeries: { type: 'number' },
            cellsInParallel: { type: 'number' },
            totalCells: { type: 'number' },
            numberOfModules: { type: 'number' }
          }
        },
        totalCapacity: { type: 'number' },
        nominalVoltage: { type: 'number' },
        packWeight: { type: 'number' },
        energyDensity: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'battery', 'pack-design', 'architecture']
}));

export const bmsDesignTask = defineTask('bms-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: BMS Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'BMS Engineer with expertise in battery management systems',
      task: 'Design battery management system hardware and software',
      context: {
        projectName: args.projectName,
        packArchitecture: args.packArchitecture,
        selectedCell: args.selectedCell,
        performanceTargets: args.performanceTargets
      },
      instructions: [
        '1. Define BMS architecture (centralized, distributed, modular)',
        '2. Design cell monitoring circuits',
        '3. Develop SOC/SOH estimation algorithms',
        '4. Design cell balancing system (passive/active)',
        '5. Develop thermal management control algorithms',
        '6. Design fault detection and isolation',
        '7. Develop charging control algorithms',
        '8. Design HV contactor control',
        '9. Define diagnostic capabilities',
        '10. Specify communication interfaces (CAN, LIN)'
      ],
      outputFormat: 'JSON object with BMS specification'
    },
    outputSchema: {
      type: 'object',
      required: ['specification', 'hardware', 'software'],
      properties: {
        specification: {
          type: 'object',
          properties: {
            architecture: { type: 'string' },
            cellMonitoring: { type: 'object' },
            balancing: { type: 'object' },
            faultDetection: { type: 'object' }
          }
        },
        hardware: {
          type: 'object',
          properties: {
            mainControlUnit: { type: 'object' },
            cellMonitoringUnits: { type: 'array', items: { type: 'object' } },
            sensors: { type: 'array', items: { type: 'object' } }
          }
        },
        software: {
          type: 'object',
          properties: {
            socAlgorithm: { type: 'string' },
            sohAlgorithm: { type: 'string' },
            thermalControl: { type: 'string' },
            diagnostics: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'battery', 'bms', 'electronics']
}));

export const thermalDesignTask = defineTask('thermal-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Thermal Management Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Thermal Engineer with expertise in EV battery cooling',
      task: 'Design battery thermal management system',
      context: {
        projectName: args.projectName,
        packArchitecture: args.packArchitecture,
        selectedCell: args.selectedCell,
        performanceTargets: args.performanceTargets
      },
      instructions: [
        '1. Analyze cell heat generation during operation',
        '2. Define thermal requirements and targets',
        '3. Select cooling strategy (air, liquid, immersion)',
        '4. Design cooling circuit and flow paths',
        '5. Design cold plate or cooling interface',
        '6. Size pump, radiator, and heat exchanger',
        '7. Design heating system for cold climate',
        '8. Develop thermal simulation models',
        '9. Validate thermal performance through simulation',
        '10. Define thermal control strategy'
      ],
      outputFormat: 'JSON object with thermal management design'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'design', 'simulation'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            heatGeneration: { type: 'object' },
            thermalRequirements: { type: 'object' },
            ambientConditions: { type: 'object' }
          }
        },
        design: {
          type: 'object',
          properties: {
            coolingStrategy: { type: 'string' },
            coolingCircuit: { type: 'object' },
            coldPlate: { type: 'object' },
            components: { type: 'array', items: { type: 'object' } },
            heatingSystem: { type: 'object' }
          }
        },
        simulation: {
          type: 'object',
          properties: {
            maxTemperature: { type: 'number' },
            temperatureUniformity: { type: 'number' },
            coolingCapacity: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'battery', 'thermal', 'cooling']
}));

export const safetyAnalysisTask = defineTask('safety-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Safety Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Battery Safety Engineer with expertise in functional safety',
      task: 'Conduct comprehensive battery safety analysis',
      context: {
        projectName: args.projectName,
        packArchitecture: args.packArchitecture,
        bmsDesign: args.bmsDesign,
        thermalDesign: args.thermalDesign,
        safetyStandards: args.safetyStandards
      },
      instructions: [
        '1. Conduct hazard analysis (thermal runaway, HV shock, gas release)',
        '2. Perform FMEA for battery system',
        '3. Define safety goals and ASIL levels',
        '4. Design safety mechanisms and protections',
        '5. Analyze fault tree for critical failures',
        '6. Define safe state conditions',
        '7. Design isolation monitoring',
        '8. Define emergency response procedures',
        '9. Map to regulatory requirements',
        '10. Document safety case'
      ],
      outputFormat: 'JSON object with safety analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'safetyGoals', 'criticalIssues'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            hazards: { type: 'array', items: { type: 'object' } },
            fmea: { type: 'array', items: { type: 'object' } },
            faultTree: { type: 'object' }
          }
        },
        safetyGoals: { type: 'array', items: { type: 'object' } },
        safetyMechanisms: { type: 'array', items: { type: 'object' } },
        criticalIssues: { type: 'array', items: { type: 'object' } },
        regulatoryMapping: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'battery', 'safety', 'functional-safety']
}));

export const abuseTestPlanTask = defineTask('abuse-test-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Abuse Testing Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Battery Test Engineer with abuse testing expertise',
      task: 'Develop abuse testing and validation plan',
      context: {
        projectName: args.projectName,
        packArchitecture: args.packArchitecture,
        safetyStandards: args.safetyStandards,
        safetyAnalysis: args.safetyAnalysis
      },
      instructions: [
        '1. Define abuse test matrix per standards',
        '2. Plan mechanical abuse tests (crush, penetration, drop)',
        '3. Plan thermal abuse tests (thermal shock, fire exposure)',
        '4. Plan electrical abuse tests (overcharge, short circuit)',
        '5. Define test procedures and acceptance criteria',
        '6. Plan cell-level vs pack-level testing',
        '7. Define test sample quantities',
        '8. Specify test facilities and equipment',
        '9. Define data acquisition requirements',
        '10. Create test schedule and resource plan'
      ],
      outputFormat: 'JSON object with abuse test plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'tests', 'schedule'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            scope: { type: 'string' },
            standards: { type: 'array', items: { type: 'string' } },
            testLevels: { type: 'array', items: { type: 'string' } }
          }
        },
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testId: { type: 'string' },
              testName: { type: 'string' },
              category: { type: 'string' },
              standard: { type: 'string' },
              procedure: { type: 'string' },
              acceptanceCriteria: { type: 'string' },
              sampleSize: { type: 'number' }
            }
          }
        },
        schedule: { type: 'array', items: { type: 'object' } },
        resources: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'battery', 'testing', 'abuse-testing']
}));

export const designDocumentationTask = defineTask('design-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Design Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer with battery engineering expertise',
      task: 'Generate comprehensive battery system design documentation',
      context: {
        projectName: args.projectName,
        vehicleClass: args.vehicleClass,
        cellSelection: args.cellSelection,
        packArchitecture: args.packArchitecture,
        bmsDesign: args.bmsDesign,
        thermalDesign: args.thermalDesign,
        safetyAnalysis: args.safetyAnalysis,
        abuseTestPlan: args.abuseTestPlan
      },
      instructions: [
        '1. Create executive summary',
        '2. Document cell selection rationale',
        '3. Compile pack architecture specifications',
        '4. Document BMS specifications',
        '5. Document thermal management design',
        '6. Compile safety analysis results',
        '7. Include test plan summary',
        '8. Calculate performance projections',
        '9. Define manufacturing requirements',
        '10. List next steps for prototype phase'
      ],
      outputFormat: 'JSON object with design documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'performanceProjections', 'nextSteps'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            totalCapacity: { type: 'number' },
            nominalVoltage: { type: 'number' },
            packWeight: { type: 'number' },
            estimatedRange: { type: 'number' },
            fastChargeCapability: { type: 'string' }
          }
        },
        performanceProjections: {
          type: 'object',
          properties: {
            efficiency: { type: 'number' },
            cycleLife: { type: 'number' },
            calendarLife: { type: 'number' },
            rangeByTemperature: { type: 'object' }
          }
        },
        manufacturingRequirements: { type: 'array', items: { type: 'object' } },
        nextSteps: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'battery', 'documentation', 'design-review']
}));
