/**
 * @process civil-engineering/water-distribution-design
 * @description Design of water distribution systems including pipe network analysis, pump station design, and storage facility design
 * @inputs { projectId: string, serviceArea: object, demandProjections: object, existingSystem: object }
 * @outputs { success: boolean, distributionDesign: object, networkModel: object, pumpStationDesign: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    serviceArea,
    demandProjections,
    existingSystem,
    waterSource,
    pressureRequirements,
    fireFlowRequirements,
    designStandard = 'AWWA',
    outputDir = 'water-distribution-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Demand Analysis
  ctx.log('info', 'Starting water distribution design: Demand analysis');
  const demandAnalysis = await ctx.task(demandAnalysisTask, {
    projectId,
    serviceArea,
    demandProjections,
    fireFlowRequirements,
    outputDir
  });

  if (!demandAnalysis.success) {
    return {
      success: false,
      error: 'Demand analysis failed',
      details: demandAnalysis,
      metadata: { processId: 'civil-engineering/water-distribution-design', timestamp: startTime }
    };
  }

  artifacts.push(...demandAnalysis.artifacts);

  // Task 2: Network Layout
  ctx.log('info', 'Developing network layout');
  const networkLayout = await ctx.task(networkLayoutTask, {
    projectId,
    serviceArea,
    existingSystem,
    demandAnalysis,
    outputDir
  });

  artifacts.push(...networkLayout.artifacts);

  // Task 3: Pipe Sizing
  ctx.log('info', 'Sizing distribution pipes');
  const pipeSizing = await ctx.task(pipeSizingTask, {
    projectId,
    networkLayout,
    demandAnalysis,
    pressureRequirements,
    fireFlowRequirements,
    outputDir
  });

  artifacts.push(...pipeSizing.artifacts);

  // Task 4: Hydraulic Modeling
  ctx.log('info', 'Performing hydraulic modeling');
  const hydraulicModel = await ctx.task(hydraulicModelTask, {
    projectId,
    networkLayout,
    pipeSizing,
    demandAnalysis,
    existingSystem,
    outputDir
  });

  artifacts.push(...hydraulicModel.artifacts);

  // Task 5: Storage Facility Design
  ctx.log('info', 'Designing storage facilities');
  const storageDesign = await ctx.task(storageDesignTask, {
    projectId,
    demandAnalysis,
    hydraulicModel,
    pressureRequirements,
    outputDir
  });

  artifacts.push(...storageDesign.artifacts);

  // Breakpoint: Review distribution design
  await ctx.breakpoint({
    question: `Water distribution design complete for ${projectId}. Peak demand: ${demandAnalysis.peakDemand} gpm. Review design?`,
    title: 'Water Distribution Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        peakDemand: demandAnalysis.peakDemand,
        averageDemand: demandAnalysis.averageDemand,
        pipeLength: pipeSizing.totalLength,
        storageVolume: storageDesign.totalVolume,
        minPressure: hydraulicModel.minPressure
      }
    }
  });

  // Task 6: Pump Station Design
  ctx.log('info', 'Designing pump stations');
  const pumpStationDesign = await ctx.task(pumpStationDesignTask, {
    projectId,
    demandAnalysis,
    hydraulicModel,
    waterSource,
    pressureRequirements,
    outputDir
  });

  artifacts.push(...pumpStationDesign.artifacts);

  // Task 7: Fire Flow Analysis
  ctx.log('info', 'Performing fire flow analysis');
  const fireFlowAnalysis = await ctx.task(fireFlowAnalysisTask, {
    projectId,
    hydraulicModel,
    fireFlowRequirements,
    outputDir
  });

  artifacts.push(...fireFlowAnalysis.artifacts);

  // Task 8: Distribution System Plans
  ctx.log('info', 'Generating distribution system plans');
  const distributionPlans = await ctx.task(distributionPlansTask, {
    projectId,
    networkLayout,
    pipeSizing,
    storageDesign,
    pumpStationDesign,
    outputDir
  });

  artifacts.push(...distributionPlans.artifacts);

  // Task 9: Water System Report
  ctx.log('info', 'Generating water system report');
  const waterReport = await ctx.task(waterReportTask, {
    projectId,
    demandAnalysis,
    pipeSizing,
    hydraulicModel,
    storageDesign,
    pumpStationDesign,
    fireFlowAnalysis,
    outputDir
  });

  artifacts.push(...waterReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    distributionDesign: {
      demands: demandAnalysis.demands,
      networkLayout: networkLayout.layout,
      pipeSizing: pipeSizing.design,
      storage: storageDesign.design,
      fireFlow: fireFlowAnalysis.results
    },
    networkModel: hydraulicModel.model,
    pumpStationDesign: pumpStationDesign.design,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/water-distribution-design',
      timestamp: startTime,
      projectId,
      designStandard,
      outputDir
    }
  };
}

// Task 1: Demand Analysis
export const demandAnalysisTask = defineTask('demand-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform water demand analysis',
  agent: {
    name: 'water-engineer',
    prompt: {
      role: 'water resources engineer',
      task: 'Analyze water demands for distribution system',
      context: args,
      instructions: [
        'Calculate average day demand',
        'Calculate maximum day demand',
        'Calculate peak hour demand',
        'Determine peaking factors',
        'Allocate demands to nodes',
        'Include fire flow requirements',
        'Project future demands',
        'Document demand calculations'
      ],
      outputFormat: 'JSON with demand analysis, projections'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'peakDemand', 'averageDemand', 'demands', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        demands: { type: 'object' },
        averageDemand: { type: 'number' },
        maxDayDemand: { type: 'number' },
        peakDemand: { type: 'number' },
        peakingFactors: { type: 'object' },
        nodeAllocations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'water', 'demand']
}));

// Task 2: Network Layout
export const networkLayoutTask = defineTask('network-layout', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop network layout',
  agent: {
    name: 'water-engineer',
    prompt: {
      role: 'water distribution engineer',
      task: 'Develop pipe network layout',
      context: args,
      instructions: [
        'Identify transmission main alignments',
        'Layout distribution mains',
        'Identify loop configurations',
        'Locate valve and hydrant positions',
        'Connect to existing system',
        'Identify pipe materials',
        'Consider constructability',
        'Create preliminary network layout'
      ],
      outputFormat: 'JSON with network layout, pipe alignments'
    },
    outputSchema: {
      type: 'object',
      required: ['layout', 'artifacts'],
      properties: {
        layout: { type: 'object' },
        transmissionMains: { type: 'array' },
        distributionMains: { type: 'array' },
        valveLocations: { type: 'array' },
        hydrantLocations: { type: 'array' },
        connectionPoints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'water', 'network']
}));

// Task 3: Pipe Sizing
export const pipeSizingTask = defineTask('pipe-sizing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Size distribution pipes',
  agent: {
    name: 'water-engineer',
    prompt: {
      role: 'water distribution engineer',
      task: 'Size water distribution pipes',
      context: args,
      instructions: [
        'Calculate pipe flows',
        'Size pipes for velocity criteria',
        'Check head loss using Hazen-Williams',
        'Verify pressure requirements',
        'Size for fire flow conditions',
        'Select minimum pipe sizes',
        'Specify pipe materials',
        'Create pipe schedule'
      ],
      outputFormat: 'JSON with pipe sizing, schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'totalLength', 'artifacts'],
      properties: {
        design: { type: 'object' },
        totalLength: { type: 'number' },
        pipeSchedule: { type: 'array' },
        velocities: { type: 'object' },
        headLosses: { type: 'object' },
        materialSpecifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'water', 'pipe-sizing']
}));

// Task 4: Hydraulic Modeling
export const hydraulicModelTask = defineTask('hydraulic-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform hydraulic modeling',
  agent: {
    name: 'hydraulic-engineer',
    prompt: {
      role: 'hydraulic modeler',
      task: 'Perform water distribution hydraulic analysis',
      context: args,
      instructions: [
        'Build hydraulic model (EPANET/WaterGEMS)',
        'Run steady-state analysis',
        'Analyze peak demand conditions',
        'Analyze fire flow scenarios',
        'Check pressure throughout system',
        'Verify velocities and head losses',
        'Perform extended period simulation',
        'Document model results'
      ],
      outputFormat: 'JSON with model results, pressure analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'minPressure', 'artifacts'],
      properties: {
        model: { type: 'object' },
        minPressure: { type: 'number' },
        maxPressure: { type: 'number' },
        pressureResults: { type: 'object' },
        velocityResults: { type: 'object' },
        epsSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'water', 'hydraulic-model']
}));

// Task 5: Storage Facility Design
export const storageDesignTask = defineTask('storage-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design storage facilities',
  agent: {
    name: 'water-engineer',
    prompt: {
      role: 'water storage engineer',
      task: 'Design water storage facilities',
      context: args,
      instructions: [
        'Calculate storage requirements (operational, fire, emergency)',
        'Determine tank type (ground, elevated)',
        'Size storage tanks',
        'Determine tank elevations',
        'Design inlet/outlet piping',
        'Design overflow and drain',
        'Specify tank materials',
        'Create tank details'
      ],
      outputFormat: 'JSON with storage design, tank specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'totalVolume', 'artifacts'],
      properties: {
        design: { type: 'object' },
        totalVolume: { type: 'number' },
        operationalStorage: { type: 'number' },
        fireStorage: { type: 'number' },
        emergencyStorage: { type: 'number' },
        tankDesigns: { type: 'array' },
        pipingDesign: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'water', 'storage']
}));

// Task 6: Pump Station Design
export const pumpStationDesignTask = defineTask('pump-station-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design pump stations',
  agent: {
    name: 'water-engineer',
    prompt: {
      role: 'pump station engineer',
      task: 'Design water pump stations',
      context: args,
      instructions: [
        'Determine pumping requirements (flow, head)',
        'Develop system head curve',
        'Select pump type and configuration',
        'Size pumps and motors',
        'Design pump controls (VFD, soft start)',
        'Design station piping and valves',
        'Design pump station building',
        'Specify instrumentation and controls'
      ],
      outputFormat: 'JSON with pump station design, specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        pumpSelection: { type: 'array' },
        systemHeadCurve: { type: 'object' },
        motorSizing: { type: 'array' },
        controlDesign: { type: 'object' },
        pipingDesign: { type: 'object' },
        buildingDesign: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'water', 'pump-station']
}));

// Task 7: Fire Flow Analysis
export const fireFlowAnalysisTask = defineTask('fire-flow-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform fire flow analysis',
  agent: {
    name: 'water-engineer',
    prompt: {
      role: 'water distribution engineer',
      task: 'Analyze fire flow capabilities',
      context: args,
      instructions: [
        'Determine required fire flows by location',
        'Run fire flow scenarios at hydrants',
        'Calculate available fire flow',
        'Verify residual pressures during fire flow',
        'Identify system deficiencies',
        'Recommend improvements',
        'Map fire flow availability',
        'Document fire flow analysis'
      ],
      outputFormat: 'JSON with fire flow analysis, results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: { type: 'object' },
        requiredFireFlows: { type: 'object' },
        availableFireFlows: { type: 'object' },
        residualPressures: { type: 'object' },
        deficiencies: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'water', 'fire-flow']
}));

// Task 8: Distribution System Plans
export const distributionPlansTask = defineTask('distribution-plans', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate distribution system plans',
  agent: {
    name: 'highway-design-engineer',
    prompt: {
      role: 'civil CAD technician',
      task: 'Generate water distribution system plans',
      context: args,
      instructions: [
        'Create water system plan',
        'Create pipe plan and profile sheets',
        'Create tank details',
        'Create pump station layout',
        'Create standard details',
        'Show valves and hydrants',
        'Include pipe schedule',
        'Create drawing index'
      ],
      outputFormat: 'JSON with drawing list, file paths'
    },
    outputSchema: {
      type: 'object',
      required: ['plans', 'artifacts'],
      properties: {
        plans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sheetNumber: { type: 'string' },
              title: { type: 'string' },
              scale: { type: 'string' }
            }
          }
        },
        drawingIndex: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'water', 'plans']
}));

// Task 9: Water System Report
export const waterReportTask = defineTask('water-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate water system report',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'water engineer',
      task: 'Generate comprehensive water system design report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document design criteria',
        'Present demand analysis',
        'Document pipe sizing',
        'Present hydraulic model results',
        'Document storage design',
        'Present pump station design',
        'Document fire flow analysis',
        'Include cost estimate'
      ],
      outputFormat: 'JSON with report path, key findings'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array' },
        costEstimate: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'water', 'reporting']
}));
