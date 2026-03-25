/**
 * @process chemical-engineering/heat-integration-analysis
 * @description Apply pinch analysis methodology to optimize heat recovery, design heat exchanger networks, and minimize utility consumption
 * @inputs { processName: string, streamData: array, utilityData: object, outputDir: string }
 * @outputs { success: boolean, pinchTemperature: number, minimumUtilities: object, henDesign: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    streamData,
    utilityData,
    deltaT_min = 10,
    economicData = {},
    outputDir = 'heat-integration-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Stream Data Extraction and Validation
  ctx.log('info', 'Starting heat integration analysis: Extracting stream data');
  const streamExtractionResult = await ctx.task(streamDataExtractionTask, {
    processName,
    streamData,
    deltaT_min,
    outputDir
  });

  if (!streamExtractionResult.success) {
    return {
      success: false,
      error: 'Stream data extraction failed',
      details: streamExtractionResult,
      metadata: { processId: 'chemical-engineering/heat-integration-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...streamExtractionResult.artifacts);

  // Task 2: Composite Curve Construction
  ctx.log('info', 'Constructing composite curves');
  const compositeCurveResult = await ctx.task(compositeCurveTask, {
    processName,
    hotStreams: streamExtractionResult.hotStreams,
    coldStreams: streamExtractionResult.coldStreams,
    deltaT_min,
    outputDir
  });

  artifacts.push(...compositeCurveResult.artifacts);

  // Task 3: Pinch Point Determination
  ctx.log('info', 'Determining pinch point and minimum utilities');
  const pinchAnalysisResult = await ctx.task(pinchAnalysisTask, {
    processName,
    compositeCurves: compositeCurveResult.compositeCurves,
    utilityData,
    deltaT_min,
    outputDir
  });

  artifacts.push(...pinchAnalysisResult.artifacts);

  // Task 4: Grand Composite Curve Construction
  ctx.log('info', 'Constructing grand composite curve');
  const grandCompositeResult = await ctx.task(grandCompositeCurveTask, {
    processName,
    hotStreams: streamExtractionResult.hotStreams,
    coldStreams: streamExtractionResult.coldStreams,
    pinchTemperature: pinchAnalysisResult.pinchTemperature,
    deltaT_min,
    outputDir
  });

  artifacts.push(...grandCompositeResult.artifacts);

  // Task 5: Heat Exchanger Network Design Above Pinch
  ctx.log('info', 'Designing HEN above pinch');
  const henAbovePinchResult = await ctx.task(henDesignAbovePinchTask, {
    processName,
    hotStreams: streamExtractionResult.hotStreams,
    coldStreams: streamExtractionResult.coldStreams,
    pinchTemperature: pinchAnalysisResult.pinchTemperature,
    deltaT_min,
    outputDir
  });

  artifacts.push(...henAbovePinchResult.artifacts);

  // Task 6: Heat Exchanger Network Design Below Pinch
  ctx.log('info', 'Designing HEN below pinch');
  const henBelowPinchResult = await ctx.task(henDesignBelowPinchTask, {
    processName,
    hotStreams: streamExtractionResult.hotStreams,
    coldStreams: streamExtractionResult.coldStreams,
    pinchTemperature: pinchAnalysisResult.pinchTemperature,
    deltaT_min,
    outputDir
  });

  artifacts.push(...henBelowPinchResult.artifacts);

  // Task 7: Evaluate Heat Integration vs. Operability Trade-offs
  ctx.log('info', 'Evaluating operability trade-offs');
  const operabilityResult = await ctx.task(operabilityAnalysisTask, {
    processName,
    henAbovePinch: henAbovePinchResult.henDesign,
    henBelowPinch: henBelowPinchResult.henDesign,
    pinchTemperature: pinchAnalysisResult.pinchTemperature,
    outputDir
  });

  artifacts.push(...operabilityResult.artifacts);

  // Breakpoint: Review pinch analysis results
  await ctx.breakpoint({
    question: `Pinch analysis complete for ${processName}. Pinch temperature: ${pinchAnalysisResult.pinchTemperature}C. Minimum hot utility: ${pinchAnalysisResult.minimumHotUtility} kW. Minimum cold utility: ${pinchAnalysisResult.minimumColdUtility} kW. Review HEN design?`,
    title: 'Heat Integration Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        pinchTemperature: pinchAnalysisResult.pinchTemperature,
        minimumHotUtility: pinchAnalysisResult.minimumHotUtility,
        minimumColdUtility: pinchAnalysisResult.minimumColdUtility,
        exchangerCount: henAbovePinchResult.exchangerCount + henBelowPinchResult.exchangerCount,
        utilityReduction: pinchAnalysisResult.utilityReductionPercentage
      }
    }
  });

  // Task 8: Process Modification Opportunities
  ctx.log('info', 'Identifying process modification opportunities');
  const processModificationResult = await ctx.task(processModificationTask, {
    processName,
    grandCompositeCurve: grandCompositeResult.grandCompositeCurve,
    pinchTemperature: pinchAnalysisResult.pinchTemperature,
    streamData: streamExtractionResult,
    outputDir
  });

  artifacts.push(...processModificationResult.artifacts);

  // Task 9: Economic Analysis
  ctx.log('info', 'Performing economic analysis');
  const economicResult = await ctx.task(economicAnalysisTask, {
    processName,
    henDesign: {
      abovePinch: henAbovePinchResult.henDesign,
      belowPinch: henBelowPinchResult.henDesign
    },
    minimumUtilities: pinchAnalysisResult.minimumUtilities,
    economicData,
    outputDir
  });

  artifacts.push(...economicResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    pinchTemperature: pinchAnalysisResult.pinchTemperature,
    minimumUtilities: {
      hotUtility: pinchAnalysisResult.minimumHotUtility,
      coldUtility: pinchAnalysisResult.minimumColdUtility
    },
    utilityReduction: pinchAnalysisResult.utilityReductionPercentage,
    henDesign: {
      abovePinch: henAbovePinchResult.henDesign,
      belowPinch: henBelowPinchResult.henDesign,
      totalExchangers: henAbovePinchResult.exchangerCount + henBelowPinchResult.exchangerCount
    },
    economics: economicResult.economics,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/heat-integration-analysis',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Stream Data Extraction
export const streamDataExtractionTask = defineTask('stream-data-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract and validate stream data for pinch analysis',
  agent: {
    name: 'heat-integration-specialist',
    prompt: {
      role: 'heat integration engineer',
      task: 'Extract and validate stream data for pinch analysis',
      context: args,
      instructions: [
        'Identify all hot streams (streams that need to be cooled)',
        'Identify all cold streams (streams that need to be heated)',
        'Extract supply and target temperatures for each stream',
        'Calculate heat capacity flow rate (CP = mCp) for each stream',
        'Calculate total heat load for each stream',
        'Validate data consistency (heat balance)',
        'Apply shifted temperatures using deltaT_min',
        'Create stream data table for analysis'
      ],
      outputFormat: 'JSON with hot streams, cold streams, validation results, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'hotStreams', 'coldStreams', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        hotStreams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              supplyTemp: { type: 'number' },
              targetTemp: { type: 'number' },
              heatCapacityFlowRate: { type: 'number' },
              heatLoad: { type: 'number' }
            }
          }
        },
        coldStreams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              supplyTemp: { type: 'number' },
              targetTemp: { type: 'number' },
              heatCapacityFlowRate: { type: 'number' },
              heatLoad: { type: 'number' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'heat-integration', 'stream-extraction']
}));

// Task 2: Composite Curve Construction
export const compositeCurveTask = defineTask('composite-curve', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct composite curves',
  agent: {
    name: 'heat-integration-specialist',
    prompt: {
      role: 'heat integration specialist',
      task: 'Construct hot and cold composite curves',
      context: args,
      instructions: [
        'Identify temperature intervals from all stream temperatures',
        'Calculate cumulative heat loads for hot streams at each interval',
        'Calculate cumulative heat loads for cold streams at each interval',
        'Construct hot composite curve (T vs. cumulative H)',
        'Construct cold composite curve (T vs. cumulative H)',
        'Plot both curves on same diagram',
        'Identify overlap region (potential heat recovery)',
        'Generate composite curve visualization'
      ],
      outputFormat: 'JSON with composite curves data, visualization path, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'compositeCurves', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        compositeCurves: {
          type: 'object',
          properties: {
            hotCurve: { type: 'array' },
            coldCurve: { type: 'array' },
            temperatureIntervals: { type: 'array' }
          }
        },
        visualizationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'heat-integration', 'composite-curve']
}));

// Task 3: Pinch Analysis
export const pinchAnalysisTask = defineTask('pinch-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine pinch point and minimum utilities',
  agent: {
    name: 'heat-integration-specialist',
    prompt: {
      role: 'heat integration specialist',
      task: 'Determine pinch point and calculate minimum utility requirements',
      context: args,
      instructions: [
        'Shift composite curves to touch at pinch point',
        'Identify pinch temperature (shifted and actual)',
        'Calculate minimum hot utility requirement',
        'Calculate minimum cold utility requirement',
        'Calculate maximum heat recovery possible',
        'Compare with current utility consumption',
        'Calculate utility reduction potential',
        'Document pinch analysis results'
      ],
      outputFormat: 'JSON with pinch temperature, minimum utilities, heat recovery, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pinchTemperature', 'minimumHotUtility', 'minimumColdUtility', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pinchTemperature: { type: 'number' },
        pinchTemperatureShifted: { type: 'number' },
        minimumHotUtility: { type: 'number' },
        minimumColdUtility: { type: 'number' },
        maximumHeatRecovery: { type: 'number' },
        utilityReductionPercentage: { type: 'number' },
        minimumUtilities: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'heat-integration', 'pinch-analysis']
}));

// Task 4: Grand Composite Curve
export const grandCompositeCurveTask = defineTask('grand-composite-curve', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct grand composite curve',
  agent: {
    name: 'heat-integration-specialist',
    prompt: {
      role: 'heat integration specialist',
      task: 'Construct grand composite curve for utility targeting',
      context: args,
      instructions: [
        'Calculate net heat flow at each temperature interval',
        'Construct cascaded heat flow diagram',
        'Generate grand composite curve (T vs. net H)',
        'Identify pinch point on GCC',
        'Determine utility placement options',
        'Identify pockets (process-to-process heat exchange)',
        'Evaluate multiple utility levels',
        'Generate GCC visualization'
      ],
      outputFormat: 'JSON with grand composite curve data, utility targets, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'grandCompositeCurve', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        grandCompositeCurve: { type: 'array' },
        heatCascade: { type: 'array' },
        utilityTargets: { type: 'object' },
        pockets: { type: 'array' },
        visualizationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'heat-integration', 'grand-composite']
}));

// Task 5: HEN Design Above Pinch
export const henDesignAbovePinchTask = defineTask('hen-design-above-pinch', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design heat exchanger network above pinch',
  agent: {
    name: 'heat-integration-specialist',
    prompt: {
      role: 'heat exchanger network designer',
      task: 'Design heat exchanger network above the pinch point',
      context: args,
      instructions: [
        'Identify streams present above pinch',
        'Apply pinch design rules (no cooling above pinch)',
        'Match hot and cold streams based on CP inequality',
        'Design heat exchangers to cool hot streams',
        'Use hot utility only where necessary',
        'Minimize number of exchanger units',
        'Calculate exchanger duties and areas',
        'Create network grid diagram above pinch'
      ],
      outputFormat: 'JSON with HEN design, exchanger list, grid diagram, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'henDesign', 'exchangerCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        henDesign: {
          type: 'object',
          properties: {
            exchangers: { type: 'array' },
            heaters: { type: 'array' },
            totalDuty: { type: 'number' }
          }
        },
        exchangerCount: { type: 'number' },
        gridDiagramPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'heat-integration', 'hen-design']
}));

// Task 6: HEN Design Below Pinch
export const henDesignBelowPinchTask = defineTask('hen-design-below-pinch', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design heat exchanger network below pinch',
  agent: {
    name: 'heat-integration-specialist',
    prompt: {
      role: 'heat exchanger network designer',
      task: 'Design heat exchanger network below the pinch point',
      context: args,
      instructions: [
        'Identify streams present below pinch',
        'Apply pinch design rules (no heating below pinch)',
        'Match hot and cold streams based on CP inequality',
        'Design heat exchangers to heat cold streams',
        'Use cold utility only where necessary',
        'Minimize number of exchanger units',
        'Calculate exchanger duties and areas',
        'Create network grid diagram below pinch'
      ],
      outputFormat: 'JSON with HEN design, exchanger list, grid diagram, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'henDesign', 'exchangerCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        henDesign: {
          type: 'object',
          properties: {
            exchangers: { type: 'array' },
            coolers: { type: 'array' },
            totalDuty: { type: 'number' }
          }
        },
        exchangerCount: { type: 'number' },
        gridDiagramPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'heat-integration', 'hen-design']
}));

// Task 7: Operability Analysis
export const operabilityAnalysisTask = defineTask('operability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate heat integration vs. operability trade-offs',
  agent: {
    name: 'energy-efficiency-engineer',
    prompt: {
      role: 'process operability engineer',
      task: 'Evaluate operability implications of heat integration design',
      context: args,
      instructions: [
        'Assess startup and shutdown implications',
        'Evaluate flexibility for throughput changes',
        'Identify control challenges with integrated network',
        'Assess impact of equipment failures',
        'Evaluate maintenance accessibility',
        'Consider process disturbance propagation',
        'Recommend design modifications for operability',
        'Balance energy savings vs. operability'
      ],
      outputFormat: 'JSON with operability assessment, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'operabilityAssessment', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        operabilityAssessment: {
          type: 'object',
          properties: {
            startupImpact: { type: 'string' },
            flexibilityScore: { type: 'number' },
            controlChallenges: { type: 'array' },
            failureImpact: { type: 'string' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'heat-integration', 'operability']
}));

// Task 8: Process Modification Opportunities
export const processModificationTask = defineTask('process-modification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify process modification opportunities',
  agent: {
    name: 'heat-integration-specialist',
    prompt: {
      role: 'heat integration specialist',
      task: 'Identify process modifications to improve heat integration',
      context: args,
      instructions: [
        'Apply plus-minus principle at pinch',
        'Identify opportunities to shift streams across pinch',
        'Evaluate pressure/temperature modifications',
        'Consider reaction condition changes',
        'Assess column pressure optimization',
        'Evaluate heat pump/heat engine opportunities',
        'Quantify benefits of each modification',
        'Recommend prioritized modifications'
      ],
      outputFormat: 'JSON with modification opportunities, benefits, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'modifications', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        modifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              benefit: { type: 'string' },
              utilitySavings: { type: 'number' },
              implementation: { type: 'string' }
            }
          }
        },
        heatPumpOpportunities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'heat-integration', 'process-modification']
}));

// Task 9: Economic Analysis
export const economicAnalysisTask = defineTask('economic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform economic analysis of heat integration',
  agent: {
    name: 'heat-integration-specialist',
    prompt: {
      role: 'process economist',
      task: 'Perform economic analysis of heat integration project',
      context: args,
      instructions: [
        'Calculate annual utility cost savings',
        'Estimate capital cost for new exchangers',
        'Calculate payback period',
        'Perform NPV and IRR analysis',
        'Evaluate area-energy trade-offs',
        'Consider supertargeting optimization',
        'Assess sensitivity to utility prices',
        'Generate economic summary report'
      ],
      outputFormat: 'JSON with economic analysis, payback, NPV, IRR, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'economics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        economics: {
          type: 'object',
          properties: {
            annualSavings: { type: 'number' },
            capitalCost: { type: 'number' },
            paybackPeriod: { type: 'number' },
            npv: { type: 'number' },
            irr: { type: 'number' }
          }
        },
        sensitivityAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'heat-integration', 'economics']
}));
