/**
 * @process specializations/domains/science/electrical-engineering/arc-flash-analysis
 * @description Arc Flash Hazard Analysis - Guide the analysis of arc flash hazards in electrical systems to ensure
 * worker safety. Covers incident energy calculations, PPE requirements, and labeling compliance.
 * @inputs { facilityName: string, systemData: object, equipmentList: array, protectionDevices?: object }
 * @outputs { success: boolean, incidentEnergyResults: object, ppeRequirements: object, labelingData: object, safetyRecommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/arc-flash-analysis', {
 *   facilityName: 'Manufacturing Plant',
 *   systemData: { voltage: '480V', systemType: 'solidly-grounded' },
 *   equipmentList: ['MCC-1', 'MCC-2', 'Switchgear-Main', 'Panel-A'],
 *   protectionDevices: { relays: true, fuses: true }
 * });
 *
 * @references
 * - IEEE 1584-2018 (Arc Flash Hazard Calculations)
 * - NFPA 70E (Electrical Safety in the Workplace)
 * - OSHA 29 CFR 1910 (Electrical Standards)
 * - CSA Z462 (Workplace Electrical Safety)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    facilityName,
    systemData,
    equipmentList,
    protectionDevices = {}
  } = inputs;

  // Phase 1: Collect System Data and Protective Device Information
  const dataCollection = await ctx.task(dataCollectionTask, {
    facilityName,
    systemData,
    equipmentList,
    protectionDevices
  });

  // Quality Gate: Data must be complete
  if (!dataCollection.dataComplete) {
    return {
      success: false,
      error: 'System data incomplete for arc flash analysis',
      phase: 'data-collection',
      missingData: dataCollection.missingData
    };
  }

  // Breakpoint: Review collected data
  await ctx.breakpoint({
    question: `Review system data for ${facilityName} arc flash study. ${dataCollection.equipmentCount} equipment items identified. Proceed with modeling?`,
    title: 'Data Collection Review',
    context: {
      runId: ctx.runId,
      facilityName,
      dataSummary: dataCollection.summary,
      files: [{
        path: `artifacts/phase1-data-collection.json`,
        format: 'json',
        content: dataCollection
      }]
    }
  });

  // Phase 2: Build Power System Model with Device Characteristics
  const systemModeling = await ctx.task(systemModelingTask, {
    facilityName,
    collectedData: dataCollection.data,
    equipmentList
  });

  // Phase 3: Calculate Bolted Fault Currents at Equipment
  const faultCurrentCalculation = await ctx.task(faultCurrentCalculationTask, {
    facilityName,
    systemModel: systemModeling.model,
    equipmentLocations: systemModeling.equipmentLocations
  });

  // Breakpoint: Review fault currents
  await ctx.breakpoint({
    question: `Fault current calculations complete. Max bolted fault: ${faultCurrentCalculation.maxFault}. Review before clearing time analysis?`,
    title: 'Fault Current Review',
    context: {
      runId: ctx.runId,
      faultSummary: faultCurrentCalculation.summary,
      files: [{
        path: `artifacts/phase3-fault-currents.json`,
        format: 'json',
        content: faultCurrentCalculation
      }]
    }
  });

  // Phase 4: Determine Protective Device Clearing Times
  const clearingTimeAnalysis = await ctx.task(clearingTimeAnalysisTask, {
    facilityName,
    faultCurrents: faultCurrentCalculation.results,
    protectionData: dataCollection.data.protectionDevices
  });

  // Phase 5: Calculate Incident Energy Levels
  const incidentEnergyCalculation = await ctx.task(incidentEnergyCalculationTask, {
    facilityName,
    faultCurrents: faultCurrentCalculation.results,
    clearingTimes: clearingTimeAnalysis.clearingTimes,
    systemData: dataCollection.data.systemInfo
  });

  // Phase 6: Determine Arc Flash Boundaries
  const arcFlashBoundaries = await ctx.task(arcFlashBoundaryTask, {
    facilityName,
    incidentEnergies: incidentEnergyCalculation.results,
    equipmentLocations: systemModeling.equipmentLocations
  });

  // Breakpoint: Review incident energy results
  await ctx.breakpoint({
    question: `Incident energy calculations complete for ${facilityName}. ${incidentEnergyCalculation.hazardousLocations} hazardous locations identified. Review results?`,
    title: 'Incident Energy Review',
    context: {
      runId: ctx.runId,
      energySummary: incidentEnergyCalculation.summary,
      highRiskLocations: incidentEnergyCalculation.highRiskLocations,
      files: [{
        path: `artifacts/phase5-incident-energy.json`,
        format: 'json',
        content: incidentEnergyCalculation
      }]
    }
  });

  // Phase 7: Specify PPE Requirements and Labeling
  const ppeAndLabeling = await ctx.task(ppeAndLabelingTask, {
    facilityName,
    incidentEnergies: incidentEnergyCalculation.results,
    arcFlashBoundaries: arcFlashBoundaries.results,
    equipmentList
  });

  // Phase 8: Document Hazard Analysis and Safety Recommendations
  const documentationAndRecommendations = await ctx.task(documentationTask, {
    facilityName,
    dataCollection,
    systemModeling,
    faultCurrentCalculation,
    clearingTimeAnalysis,
    incidentEnergyCalculation,
    arcFlashBoundaries,
    ppeAndLabeling
  });

  // Final Breakpoint: Study Approval
  await ctx.breakpoint({
    question: `Arc flash hazard analysis complete for ${facilityName}. ${ppeAndLabeling.totalLabels} labels generated. Approve study?`,
    title: 'Study Approval',
    context: {
      runId: ctx.runId,
      facilityName,
      hazardSummary: documentationAndRecommendations.hazardSummary,
      files: [
        { path: `artifacts/arc-flash-results.json`, format: 'json', content: incidentEnergyCalculation.results },
        { path: `artifacts/arc-flash-report.md`, format: 'markdown', content: documentationAndRecommendations.markdown }
      ]
    }
  });

  return {
    success: true,
    facilityName,
    incidentEnergyResults: incidentEnergyCalculation.results,
    ppeRequirements: ppeAndLabeling.ppeRequirements,
    labelingData: ppeAndLabeling.labelData,
    arcFlashBoundaries: arcFlashBoundaries.results,
    safetyRecommendations: documentationAndRecommendations.recommendations,
    hazardCategories: ppeAndLabeling.hazardCategories,
    documentation: documentationAndRecommendations.document,
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/arc-flash-analysis',
      timestamp: ctx.now(),
      version: '1.0.0',
      standard: 'IEEE 1584-2018'
    }
  };
}

// Task Definitions

export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Data Collection - ${args.facilityName}`,
  agent: {
    name: 'protection-engineer',
    prompt: {
      role: 'Electrical Safety Engineer specializing in arc flash studies',
      task: 'Collect system data and protective device information for arc flash analysis',
      context: {
        facilityName: args.facilityName,
        systemData: args.systemData,
        equipmentList: args.equipmentList,
        protectionDevices: args.protectionDevices
      },
      instructions: [
        '1. Gather single-line diagrams and equipment layout drawings',
        '2. Collect utility source data (available fault current, X/R ratio)',
        '3. Document transformer data (kVA, impedance, configuration)',
        '4. Gather conductor data (lengths, sizes, types)',
        '5. Collect protective device data (breakers, fuses, relays)',
        '6. Document trip unit settings and time-current characteristics',
        '7. Identify working distances for each equipment location',
        '8. Gather equipment enclosure types and dimensions',
        '9. Document grounding system configuration',
        '10. Verify data accuracy and completeness'
      ],
      outputFormat: 'JSON object with collected system data'
    },
    outputSchema: {
      type: 'object',
      required: ['dataComplete', 'data', 'equipmentCount'],
      properties: {
        dataComplete: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            systemInfo: { type: 'object' },
            transformers: { type: 'array', items: { type: 'object' } },
            conductors: { type: 'array', items: { type: 'object' } },
            protectionDevices: { type: 'array', items: { type: 'object' } },
            equipment: { type: 'array', items: { type: 'object' } }
          }
        },
        equipmentCount: { type: 'number' },
        summary: { type: 'string' },
        missingData: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'arc-flash', 'safety', 'data-collection']
}));

export const systemModelingTask = defineTask('system-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: System Modeling - ${args.facilityName}`,
  agent: {
    name: 'protection-engineer',
    prompt: {
      role: 'Power Systems Modeling Engineer',
      task: 'Build power system model with device characteristics',
      context: {
        facilityName: args.facilityName,
        collectedData: args.collectedData,
        equipmentList: args.equipmentList
      },
      instructions: [
        '1. Create impedance model of the power system',
        '2. Model utility source with equivalent impedance',
        '3. Model transformers with proper impedances and tap settings',
        '4. Model conductors with calculated impedances',
        '5. Include motor contribution to fault current',
        '6. Model protective device characteristics',
        '7. Define equipment locations for analysis',
        '8. Specify electrode configurations per IEEE 1584',
        '9. Define enclosure types and working distances',
        '10. Validate model against known system parameters'
      ],
      outputFormat: 'JSON object with power system model'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'equipmentLocations'],
      properties: {
        model: {
          type: 'object',
          properties: {
            buses: { type: 'array', items: { type: 'object' } },
            branches: { type: 'array', items: { type: 'object' } },
            sources: { type: 'array', items: { type: 'object' } }
          }
        },
        equipmentLocations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              voltage: { type: 'string' },
              enclosureType: { type: 'string' },
              workingDistance: { type: 'string' },
              electrodeConfig: { type: 'string' }
            }
          }
        },
        modelAssumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'arc-flash', 'modeling']
}));

export const faultCurrentCalculationTask = defineTask('fault-current-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Fault Current Calculation - ${args.facilityName}`,
  agent: {
    name: 'protection-engineer',
    prompt: {
      role: 'Power Systems Engineer specializing in short circuit analysis',
      task: 'Calculate bolted fault currents at equipment locations',
      context: {
        facilityName: args.facilityName,
        systemModel: args.systemModel,
        equipmentLocations: args.equipmentLocations
      },
      instructions: [
        '1. Calculate three-phase bolted fault current at each location',
        '2. Account for motor contribution to fault current',
        '3. Calculate X/R ratio at each location',
        '4. Determine peak asymmetrical fault current',
        '5. Calculate reduced fault currents for arcing conditions',
        '6. Consider system configuration variations',
        '7. Verify fault currents against protective device ratings',
        '8. Document calculation methodology',
        '9. Identify maximum and minimum fault scenarios',
        '10. Validate results against previous studies if available'
      ],
      outputFormat: 'JSON object with fault current calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'maxFault', 'summary'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              boltedFault: { type: 'string' },
              xrRatio: { type: 'number' },
              arcingCurrent: { type: 'string' }
            }
          }
        },
        maxFault: { type: 'string' },
        minFault: { type: 'string' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'arc-flash', 'fault-analysis']
}));

export const clearingTimeAnalysisTask = defineTask('clearing-time-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Clearing Time Analysis - ${args.facilityName}`,
  agent: {
    name: 'protection-engineer',
    prompt: {
      role: 'Protection Engineer specializing in device coordination',
      task: 'Determine protective device clearing times for arc flash',
      context: {
        facilityName: args.facilityName,
        faultCurrents: args.faultCurrents,
        protectionData: args.protectionData
      },
      instructions: [
        '1. Determine upstream protective device for each location',
        '2. Calculate clearing time based on arcing current',
        '3. Account for relay time and breaker operating time',
        '4. Consider instantaneous trip settings if applicable',
        '5. Apply IEEE 1584 arc duration limits',
        '6. Account for current-limiting effects of fuses',
        '7. Consider zone selective interlocking (ZSI) if installed',
        '8. Document assumptions for clearing time calculations',
        '9. Identify locations with excessive clearing times',
        '10. Recommend protection upgrades where beneficial'
      ],
      outputFormat: 'JSON object with clearing time analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['clearingTimes'],
      properties: {
        clearingTimes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              protectiveDevice: { type: 'string' },
              clearingTime: { type: 'number' },
              tripType: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        excessiveTimes: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'arc-flash', 'protection']
}));

export const incidentEnergyCalculationTask = defineTask('incident-energy-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Incident Energy Calculation - ${args.facilityName}`,
  agent: {
    name: 'protection-engineer',
    prompt: {
      role: 'Arc Flash Analysis Engineer',
      task: 'Calculate incident energy levels per IEEE 1584',
      context: {
        facilityName: args.facilityName,
        faultCurrents: args.faultCurrents,
        clearingTimes: args.clearingTimes,
        systemData: args.systemData
      },
      instructions: [
        '1. Apply IEEE 1584-2018 calculation methodology',
        '2. Calculate arcing current using standard equations',
        '3. Calculate incident energy at working distance',
        '4. Account for electrode configuration and enclosure',
        '5. Consider both maximum and reduced arcing scenarios',
        '6. Calculate incident energy for variation factor analysis',
        '7. Apply appropriate correction factors',
        '8. Determine hazard risk category based on energy',
        '9. Identify locations exceeding 40 cal/cm2',
        '10. Document calculation details and assumptions'
      ],
      outputFormat: 'JSON object with incident energy results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'hazardousLocations', 'summary'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              incidentEnergy: { type: 'number' },
              unit: { type: 'string' },
              hazardCategory: { type: 'string' },
              workingDistance: { type: 'string' }
            }
          }
        },
        hazardousLocations: { type: 'number' },
        highRiskLocations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              incidentEnergy: { type: 'number' },
              concern: { type: 'string' }
            }
          }
        },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'arc-flash', 'incident-energy', 'ieee1584']
}));

export const arcFlashBoundaryTask = defineTask('arc-flash-boundary', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Arc Flash Boundaries - ${args.facilityName}`,
  agent: {
    name: 'protection-engineer',
    prompt: {
      role: 'Electrical Safety Specialist',
      task: 'Determine arc flash boundaries for all equipment',
      context: {
        facilityName: args.facilityName,
        incidentEnergies: args.incidentEnergies,
        equipmentLocations: args.equipmentLocations
      },
      instructions: [
        '1. Calculate arc flash boundary (1.2 cal/cm2 threshold)',
        '2. Calculate limited approach boundary',
        '3. Calculate restricted approach boundary',
        '4. Calculate prohibited approach boundary',
        '5. Account for voltage levels in boundary calculations',
        '6. Document boundary distances for each location',
        '7. Identify work practices needed within boundaries',
        '8. Consider equipment accessibility in boundary context',
        '9. Recommend physical barriers where appropriate',
        '10. Document boundary calculation methodology'
      ],
      outputFormat: 'JSON object with arc flash boundaries'
    },
    outputSchema: {
      type: 'object',
      required: ['results'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              arcFlashBoundary: { type: 'string' },
              limitedApproach: { type: 'string' },
              restrictedApproach: { type: 'string' },
              prohibitedApproach: { type: 'string' }
            }
          }
        },
        boundaryRecommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'arc-flash', 'boundaries', 'safety']
}));

export const ppeAndLabelingTask = defineTask('ppe-labeling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: PPE and Labeling - ${args.facilityName}`,
  agent: {
    name: 'protection-engineer',
    prompt: {
      role: 'Electrical Safety Compliance Specialist',
      task: 'Specify PPE requirements and generate equipment labels',
      context: {
        facilityName: args.facilityName,
        incidentEnergies: args.incidentEnergies,
        arcFlashBoundaries: args.arcFlashBoundaries,
        equipmentList: args.equipmentList
      },
      instructions: [
        '1. Determine PPE category based on incident energy',
        '2. Specify required arc-rated clothing',
        '3. Specify face shield and head protection requirements',
        '4. Specify hand protection requirements',
        '5. Generate arc flash warning labels per NFPA 70E',
        '6. Include all required label information (energy, boundary, PPE)',
        '7. Specify label format and placement',
        '8. Document equipment-specific PPE requirements',
        '9. Identify locations requiring additional safety measures',
        '10. Create PPE selection guide for facility'
      ],
      outputFormat: 'JSON object with PPE requirements and label data'
    },
    outputSchema: {
      type: 'object',
      required: ['ppeRequirements', 'labelData', 'totalLabels', 'hazardCategories'],
      properties: {
        ppeRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              ppeCategory: { type: 'string' },
              arcRating: { type: 'string' },
              clothing: { type: 'array', items: { type: 'string' } },
              faceProtection: { type: 'string' },
              handProtection: { type: 'string' }
            }
          }
        },
        labelData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              equipmentId: { type: 'string' },
              voltage: { type: 'string' },
              incidentEnergy: { type: 'string' },
              arcFlashBoundary: { type: 'string' },
              hazardCategory: { type: 'string' },
              requiredPPE: { type: 'string' },
              limitedApproach: { type: 'string' },
              restrictedApproach: { type: 'string' }
            }
          }
        },
        totalLabels: { type: 'number' },
        hazardCategories: {
          type: 'object',
          properties: {
            category1: { type: 'number' },
            category2: { type: 'number' },
            category3: { type: 'number' },
            category4: { type: 'number' },
            dangerous: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'arc-flash', 'ppe', 'labeling', 'nfpa70e']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation - ${args.facilityName}`,
  agent: {
    name: 'protection-engineer',
    prompt: {
      role: 'Electrical Safety Documentation Specialist',
      task: 'Document hazard analysis and safety recommendations',
      context: {
        facilityName: args.facilityName,
        dataCollection: args.dataCollection,
        systemModeling: args.systemModeling,
        faultCurrentCalculation: args.faultCurrentCalculation,
        clearingTimeAnalysis: args.clearingTimeAnalysis,
        incidentEnergyCalculation: args.incidentEnergyCalculation,
        arcFlashBoundaries: args.arcFlashBoundaries,
        ppeAndLabeling: args.ppeAndLabeling
      },
      instructions: [
        '1. Create executive summary of arc flash study',
        '2. Document study methodology and standards used',
        '3. Include system single-line diagram',
        '4. Present fault current and incident energy results',
        '5. Document PPE requirements by location',
        '6. Include all equipment label information',
        '7. Provide safety recommendations for high-risk areas',
        '8. Recommend protection improvements to reduce hazard',
        '9. Include training requirements and safe work practices',
        '10. Generate comprehensive arc flash study report'
      ],
      outputFormat: 'JSON object with complete documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'recommendations', 'markdown', 'hazardSummary'],
      properties: {
        document: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            methodology: { type: 'string' },
            results: { type: 'object' },
            ppeMatrix: { type: 'array', items: { type: 'object' } },
            labelSchedule: { type: 'array', items: { type: 'object' } }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              expectedReduction: { type: 'string' }
            }
          }
        },
        hazardSummary: {
          type: 'object',
          properties: {
            totalLocations: { type: 'number' },
            maxIncidentEnergy: { type: 'string' },
            averageIncidentEnergy: { type: 'string' },
            highRiskCount: { type: 'number' }
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
  labels: ['ee', 'arc-flash', 'documentation', 'safety']
}));
