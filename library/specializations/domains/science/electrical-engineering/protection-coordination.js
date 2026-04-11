/**
 * @process specializations/domains/science/electrical-engineering/protection-coordination
 * @description Protection Coordination Study - Guide the design and coordination of power system protection schemes.
 * Covers relay selection, settings calculation, coordination curves, and fault analysis for reliable fault clearing.
 * @inputs { systemName: string, singleLineDiagram: object, protectionZones: array, faultStudyData?: object }
 * @outputs { success: boolean, relaySettings: object, coordinationCurves: object, faultAnalysis: object, documentation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/protection-coordination', {
 *   systemName: 'Industrial Substation',
 *   singleLineDiagram: { feeders: 6, transformers: 2, motors: 15 },
 *   protectionZones: ['incoming', 'bus', 'feeder', 'motor'],
 *   faultStudyData: { maxFault: '25kA', minFault: '8kA' }
 * });
 *
 * @references
 * - IEEE C37 Series (Protection Standards)
 * - IEC 60255 (Measuring Relays and Protection Equipment)
 * - NFPA 70E (Electrical Safety)
 * - Relay Manufacturer Application Guides
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName,
    singleLineDiagram,
    protectionZones,
    faultStudyData = {}
  } = inputs;

  // Phase 1: Collect System Data and Single-Line Diagrams
  const systemDataCollection = await ctx.task(systemDataCollectionTask, {
    systemName,
    singleLineDiagram,
    protectionZones
  });

  // Quality Gate: Data must be complete
  if (!systemDataCollection.dataComplete) {
    return {
      success: false,
      error: 'System data incomplete for protection study',
      phase: 'data-collection',
      missingData: systemDataCollection.missingData
    };
  }

  // Breakpoint: Review system data
  await ctx.breakpoint({
    question: `Review system data for ${systemName} protection study. Proceed with fault calculations?`,
    title: 'System Data Review',
    context: {
      runId: ctx.runId,
      systemName,
      dataSummary: systemDataCollection.summary,
      files: [{
        path: `artifacts/phase1-system-data.json`,
        format: 'json',
        content: systemDataCollection
      }]
    }
  });

  // Phase 2: Calculate Short-Circuit Currents at Key Locations
  const shortCircuitAnalysis = await ctx.task(shortCircuitAnalysisTask, {
    systemName,
    systemData: systemDataCollection.systemData,
    faultStudyData,
    protectionZones
  });

  // Breakpoint: Review fault currents
  await ctx.breakpoint({
    question: `Short-circuit analysis complete. Max fault: ${shortCircuitAnalysis.maxFault}, Min fault: ${shortCircuitAnalysis.minFault}. Review before relay selection?`,
    title: 'Fault Analysis Review',
    context: {
      runId: ctx.runId,
      faultSummary: shortCircuitAnalysis.summary,
      faultLocations: shortCircuitAnalysis.faultLocations,
      files: [{
        path: `artifacts/phase2-fault-analysis.json`,
        format: 'json',
        content: shortCircuitAnalysis
      }]
    }
  });

  // Phase 3: Select Protective Device Types and Ratings
  const deviceSelection = await ctx.task(deviceSelectionTask, {
    systemName,
    systemData: systemDataCollection.systemData,
    shortCircuitResults: shortCircuitAnalysis.results,
    protectionZones
  });

  // Phase 4: Determine Relay Settings and Pickup Values
  const relaySettingsCalculation = await ctx.task(relaySettingsCalculationTask, {
    systemName,
    deviceSelection: deviceSelection.devices,
    shortCircuitResults: shortCircuitAnalysis.results,
    systemData: systemDataCollection.systemData
  });

  // Breakpoint: Review relay settings
  await ctx.breakpoint({
    question: `Review calculated relay settings for ${systemName}. ${relaySettingsCalculation.totalSettings} settings defined. Proceed with coordination?`,
    title: 'Relay Settings Review',
    context: {
      runId: ctx.runId,
      settings: relaySettingsCalculation.settingsSummary,
      files: [{
        path: `artifacts/phase4-relay-settings.json`,
        format: 'json',
        content: relaySettingsCalculation
      }]
    }
  });

  // Phase 5: Plot Time-Current Coordination Curves
  const coordinationCurves = await ctx.task(coordinationCurvesTask, {
    systemName,
    relaySettings: relaySettingsCalculation.settings,
    deviceSelection: deviceSelection.devices,
    shortCircuitResults: shortCircuitAnalysis.results
  });

  // Phase 6: Verify Coordination Between Devices
  const coordinationVerification = await ctx.task(coordinationVerificationTask, {
    systemName,
    coordinationCurves: coordinationCurves.curves,
    relaySettings: relaySettingsCalculation.settings,
    protectionZones
  });

  // Quality Gate: Coordination must be achieved
  if (!coordinationVerification.fullyCoordinated) {
    await ctx.breakpoint({
      question: `Coordination verification found ${coordinationVerification.coordinationIssues.length} coordination issues. Review and adjust settings?`,
      title: 'Coordination Issues',
      context: {
        runId: ctx.runId,
        issues: coordinationVerification.coordinationIssues,
        recommendations: coordinationVerification.recommendations
      }
    });
  }

  // Phase 7: Analyze Protection for Various Fault Scenarios
  const faultScenarioAnalysis = await ctx.task(faultScenarioAnalysisTask, {
    systemName,
    relaySettings: relaySettingsCalculation.settings,
    shortCircuitResults: shortCircuitAnalysis.results,
    coordinationCurves: coordinationCurves.curves
  });

  // Phase 8: Document Settings and Coordination Study Results
  const studyDocumentation = await ctx.task(studyDocumentationTask, {
    systemName,
    systemDataCollection,
    shortCircuitAnalysis,
    deviceSelection,
    relaySettingsCalculation,
    coordinationCurves,
    coordinationVerification,
    faultScenarioAnalysis
  });

  // Final Breakpoint: Study Approval
  await ctx.breakpoint({
    question: `Protection coordination study complete for ${systemName}. Coordination ${coordinationVerification.fullyCoordinated ? 'ACHIEVED' : 'PARTIAL'}. Approve study?`,
    title: 'Study Approval',
    context: {
      runId: ctx.runId,
      systemName,
      coordinationStatus: coordinationVerification.summary,
      files: [
        { path: `artifacts/relay-settings.json`, format: 'json', content: relaySettingsCalculation.settings },
        { path: `artifacts/coordination-study.md`, format: 'markdown', content: studyDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    systemName,
    relaySettings: relaySettingsCalculation.settings,
    coordinationCurves: coordinationCurves.curves,
    faultAnalysis: {
      shortCircuitResults: shortCircuitAnalysis.results,
      scenarioAnalysis: faultScenarioAnalysis.results
    },
    coordinationStatus: {
      fullyCoordinated: coordinationVerification.fullyCoordinated,
      issues: coordinationVerification.coordinationIssues,
      margins: coordinationVerification.coordinationMargins
    },
    devices: deviceSelection.devices,
    documentation: studyDocumentation.document,
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/protection-coordination',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const systemDataCollectionTask = defineTask('system-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: System Data Collection - ${args.systemName}`,
  agent: {
    name: 'protection-engineer',
    prompt: {
      role: 'Protection Engineer with expertise in power system data collection',
      task: 'Collect and organize system data for protection coordination study',
      context: {
        systemName: args.systemName,
        singleLineDiagram: args.singleLineDiagram,
        protectionZones: args.protectionZones
      },
      instructions: [
        '1. Gather single-line diagram with all protective devices',
        '2. Collect transformer data (ratings, impedances, tap positions)',
        '3. Gather cable and conductor data (lengths, sizes, impedances)',
        '4. Collect motor and load data (ratings, starting characteristics)',
        '5. Gather utility source data (available fault current, X/R ratio)',
        '6. Document existing protective device data (CTs, relays, breakers)',
        '7. Identify protection zones and coordination paths',
        '8. Collect equipment damage curves where available',
        '9. Gather inrush current data for transformers and motors',
        '10. Document system grounding configuration'
      ],
      outputFormat: 'JSON object with complete system data'
    },
    outputSchema: {
      type: 'object',
      required: ['dataComplete', 'systemData', 'summary'],
      properties: {
        dataComplete: { type: 'boolean' },
        systemData: {
          type: 'object',
          properties: {
            transformers: { type: 'array', items: { type: 'object' } },
            cables: { type: 'array', items: { type: 'object' } },
            motors: { type: 'array', items: { type: 'object' } },
            utilitySource: { type: 'object' },
            existingDevices: { type: 'array', items: { type: 'object' } },
            groundingConfig: { type: 'string' }
          }
        },
        protectionZones: { type: 'array', items: { type: 'object' } },
        summary: { type: 'string' },
        missingData: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'protection', 'data-collection']
}));

export const shortCircuitAnalysisTask = defineTask('short-circuit-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Short-Circuit Analysis - ${args.systemName}`,
  agent: {
    name: 'protection-engineer',
    prompt: {
      role: 'Power Systems Engineer specializing in fault analysis',
      task: 'Calculate short-circuit currents at key locations',
      context: {
        systemName: args.systemName,
        systemData: args.systemData,
        faultStudyData: args.faultStudyData,
        protectionZones: args.protectionZones
      },
      instructions: [
        '1. Calculate three-phase fault currents at each bus',
        '2. Calculate line-to-ground fault currents',
        '3. Determine maximum and minimum fault levels',
        '4. Calculate fault currents for different system configurations',
        '5. Determine X/R ratios for DC offset calculation',
        '6. Calculate through-fault currents for each protective device',
        '7. Account for motor contribution to faults',
        '8. Identify fault current variation with time (AC decrement)',
        '9. Document fault current at each relay location',
        '10. Calculate interrupting duty for circuit breakers'
      ],
      outputFormat: 'JSON object with fault analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'maxFault', 'minFault', 'faultLocations'],
      properties: {
        results: {
          type: 'object',
          properties: {
            threePhase: { type: 'array', items: { type: 'object' } },
            lineToGround: { type: 'array', items: { type: 'object' } },
            lineToLine: { type: 'array', items: { type: 'object' } }
          }
        },
        maxFault: { type: 'string' },
        minFault: { type: 'string' },
        faultLocations: { type: 'array', items: { type: 'object' } },
        xrRatios: { type: 'object' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'protection', 'fault-analysis']
}));

export const deviceSelectionTask = defineTask('device-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Device Selection - ${args.systemName}`,
  agent: {
    name: 'protection-engineer',
    prompt: {
      role: 'Protection Engineer with expertise in relay selection',
      task: 'Select protective device types and ratings',
      context: {
        systemName: args.systemName,
        systemData: args.systemData,
        shortCircuitResults: args.shortCircuitResults,
        protectionZones: args.protectionZones
      },
      instructions: [
        '1. Select relay types for each protection zone (overcurrent, differential, distance)',
        '2. Determine CT ratios based on load and fault currents',
        '3. Select circuit breaker ratings (continuous, interrupting)',
        '4. Choose fuse ratings where applicable',
        '5. Select ground fault protection devices',
        '6. Determine PT ratios for voltage sensing',
        '7. Select communication protocols for relay integration',
        '8. Specify relay settings ranges needed',
        '9. Document device specifications and part numbers',
        '10. Verify device compatibility with system requirements'
      ],
      outputFormat: 'JSON object with selected devices'
    },
    outputSchema: {
      type: 'object',
      required: ['devices'],
      properties: {
        devices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              deviceType: { type: 'string' },
              manufacturer: { type: 'string' },
              model: { type: 'string' },
              ratings: { type: 'object' },
              ctRatio: { type: 'string' },
              functions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        ctSelections: { type: 'array', items: { type: 'object' } },
        ptSelections: { type: 'array', items: { type: 'object' } },
        breakerSelections: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'protection', 'device-selection']
}));

export const relaySettingsCalculationTask = defineTask('relay-settings-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Relay Settings Calculation - ${args.systemName}`,
  agent: {
    name: 'protection-engineer',
    prompt: {
      role: 'Protection Engineer with expertise in relay settings',
      task: 'Determine relay settings and pickup values',
      context: {
        systemName: args.systemName,
        deviceSelection: args.deviceSelection,
        shortCircuitResults: args.shortCircuitResults,
        systemData: args.systemData
      },
      instructions: [
        '1. Calculate phase overcurrent pickup settings (50/51)',
        '2. Calculate time dial settings for inverse time curves',
        '3. Calculate ground fault pickup settings (50G/51G)',
        '4. Determine instantaneous element settings',
        '5. Calculate differential relay settings where applicable',
        '6. Set motor protection elements (locked rotor, thermal)',
        '7. Calculate voltage relay settings (27/59)',
        '8. Set frequency relay elements (81)',
        '9. Configure logic and trip schemes',
        '10. Document all settings with justification'
      ],
      outputFormat: 'JSON object with relay settings'
    },
    outputSchema: {
      type: 'object',
      required: ['settings', 'totalSettings', 'settingsSummary'],
      properties: {
        settings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              device: { type: 'string' },
              location: { type: 'string' },
              function: { type: 'string' },
              pickup: { type: 'string' },
              timeDial: { type: 'string' },
              curve: { type: 'string' },
              instantaneous: { type: 'string' },
              justification: { type: 'string' }
            }
          }
        },
        totalSettings: { type: 'number' },
        settingsSummary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'protection', 'relay-settings']
}));

export const coordinationCurvesTask = defineTask('coordination-curves', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Coordination Curves - ${args.systemName}`,
  agent: {
    name: 'protection-engineer',
    prompt: {
      role: 'Protection Coordination Engineer',
      task: 'Plot time-current coordination curves',
      context: {
        systemName: args.systemName,
        relaySettings: args.relaySettings,
        deviceSelection: args.deviceSelection,
        shortCircuitResults: args.shortCircuitResults
      },
      instructions: [
        '1. Generate TCC (Time-Current Characteristic) data for each device',
        '2. Plot relay curves using standard curve equations',
        '3. Include fuse curves and damage characteristics',
        '4. Add cable and transformer damage curves',
        '5. Show motor starting curves where applicable',
        '6. Plot inrush points for transformers',
        '7. Mark fault current ranges on plots',
        '8. Overlay upstream and downstream devices',
        '9. Generate coordination plots for each path',
        '10. Document curve data and parameters'
      ],
      outputFormat: 'JSON object with coordination curve data'
    },
    outputSchema: {
      type: 'object',
      required: ['curves'],
      properties: {
        curves: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              devices: { type: 'array', items: { type: 'string' } },
              curveData: { type: 'array', items: { type: 'object' } },
              faultRange: { type: 'object' }
            }
          }
        },
        curveEquations: { type: 'object' },
        damageCurves: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'protection', 'coordination', 'tcc']
}));

export const coordinationVerificationTask = defineTask('coordination-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Coordination Verification - ${args.systemName}`,
  agent: {
    name: 'protection-engineer',
    prompt: {
      role: 'Protection Coordination Verification Engineer',
      task: 'Verify coordination between protective devices',
      context: {
        systemName: args.systemName,
        coordinationCurves: args.coordinationCurves,
        relaySettings: args.relaySettings,
        protectionZones: args.protectionZones
      },
      instructions: [
        '1. Check coordination time intervals (CTI) between devices',
        '2. Verify minimum 0.2-0.4s CTI depending on relay types',
        '3. Check that downstream devices clear before upstream',
        '4. Verify backup protection operates if primary fails',
        '5. Check coordination across voltage levels',
        '6. Verify no curve crossover in fault current range',
        '7. Check protection against transformer inrush',
        '8. Verify motor starting does not cause nuisance trips',
        '9. Document coordination margins at key fault levels',
        '10. Identify and document any coordination compromises'
      ],
      outputFormat: 'JSON object with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['fullyCoordinated', 'coordinationMargins'],
      properties: {
        fullyCoordinated: { type: 'boolean' },
        coordinationMargins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              margin: { type: 'string' },
              adequate: { type: 'boolean' }
            }
          }
        },
        coordinationIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'protection', 'verification']
}));

export const faultScenarioAnalysisTask = defineTask('fault-scenario-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Fault Scenario Analysis - ${args.systemName}`,
  agent: {
    name: 'protection-engineer',
    prompt: {
      role: 'Protection Systems Analyst',
      task: 'Analyze protection for various fault scenarios',
      context: {
        systemName: args.systemName,
        relaySettings: args.relaySettings,
        shortCircuitResults: args.shortCircuitResults,
        coordinationCurves: args.coordinationCurves
      },
      instructions: [
        '1. Simulate three-phase fault scenarios at each bus',
        '2. Simulate single line-to-ground faults',
        '3. Analyze arcing fault scenarios (reduced fault current)',
        '4. Test protection response to motor starting',
        '5. Analyze transformer inrush scenarios',
        '6. Test backup protection operation',
        '7. Verify protection during minimum fault conditions',
        '8. Analyze protection for evolving faults',
        '9. Test ground fault detection sensitivity',
        '10. Document clearing times for each scenario'
      ],
      outputFormat: 'JSON object with scenario analysis results'
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
              scenario: { type: 'string' },
              faultLocation: { type: 'string' },
              faultType: { type: 'string' },
              primaryDevice: { type: 'string' },
              clearingTime: { type: 'string' },
              backupDevice: { type: 'string' },
              backupTime: { type: 'string' },
              passed: { type: 'boolean' }
            }
          }
        },
        failedScenarios: { type: 'array', items: { type: 'object' } },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'protection', 'fault-analysis', 'scenarios']
}));

export const studyDocumentationTask = defineTask('study-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Study Documentation - ${args.systemName}`,
  agent: {
    name: 'protection-engineer',
    prompt: {
      role: 'Protection Engineering Documentation Specialist',
      task: 'Document settings and coordination study results',
      context: {
        systemName: args.systemName,
        systemDataCollection: args.systemDataCollection,
        shortCircuitAnalysis: args.shortCircuitAnalysis,
        deviceSelection: args.deviceSelection,
        relaySettingsCalculation: args.relaySettingsCalculation,
        coordinationCurves: args.coordinationCurves,
        coordinationVerification: args.coordinationVerification,
        faultScenarioAnalysis: args.faultScenarioAnalysis
      },
      instructions: [
        '1. Create executive summary of protection study',
        '2. Document system description and single-line diagram',
        '3. Include fault study results and methodology',
        '4. Create relay settings tables with all parameters',
        '5. Include time-current coordination curves',
        '6. Document coordination analysis and margins',
        '7. Include fault scenario analysis results',
        '8. Create relay settings sheets for field implementation',
        '9. Document any protection gaps or recommendations',
        '10. Generate comprehensive study report'
      ],
      outputFormat: 'JSON object with complete documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'markdown'],
      properties: {
        document: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            systemDescription: { type: 'string' },
            faultStudySummary: { type: 'object' },
            relaySettingsTables: { type: 'array', items: { type: 'object' } },
            coordinationAnalysis: { type: 'object' },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        settingsSheets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              device: { type: 'string' },
              location: { type: 'string' },
              settings: { type: 'object' }
            }
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
  labels: ['ee', 'protection', 'documentation']
}));
