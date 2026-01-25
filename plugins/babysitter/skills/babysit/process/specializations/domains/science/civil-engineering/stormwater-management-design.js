/**
 * @process civil-engineering/stormwater-management-design
 * @description Design of stormwater management systems including hydrology analysis, detention design, conveyance systems, and LID/green infrastructure
 * @inputs { projectId: string, siteCharacteristics: object, watershedData: object, regulatoryRequirements: object }
 * @outputs { success: boolean, stormwaterDesign: object, drainagePlans: array, detentionDesign: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    siteCharacteristics,
    watershedData,
    regulatoryRequirements,
    soilData,
    designStorms,
    lidRequirements,
    outputDir = 'stormwater-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Hydrologic Analysis
  ctx.log('info', 'Starting stormwater management design: Hydrologic analysis');
  const hydrologicAnalysis = await ctx.task(hydrologicAnalysisTask, {
    projectId,
    siteCharacteristics,
    watershedData,
    designStorms,
    outputDir
  });

  if (!hydrologicAnalysis.success) {
    return {
      success: false,
      error: 'Hydrologic analysis failed',
      details: hydrologicAnalysis,
      metadata: { processId: 'civil-engineering/stormwater-management-design', timestamp: startTime }
    };
  }

  artifacts.push(...hydrologicAnalysis.artifacts);

  // Task 2: Pre/Post Development Comparison
  ctx.log('info', 'Comparing pre and post development conditions');
  const prePostComparison = await ctx.task(prePostComparisonTask, {
    projectId,
    hydrologicAnalysis,
    siteCharacteristics,
    regulatoryRequirements,
    outputDir
  });

  artifacts.push(...prePostComparison.artifacts);

  // Task 3: Water Quality Requirements
  ctx.log('info', 'Analyzing water quality requirements');
  const waterQualityAnalysis = await ctx.task(waterQualityTask, {
    projectId,
    siteCharacteristics,
    regulatoryRequirements,
    lidRequirements,
    outputDir
  });

  artifacts.push(...waterQualityAnalysis.artifacts);

  // Task 4: LID/Green Infrastructure Design
  ctx.log('info', 'Designing LID and green infrastructure');
  const lidDesign = await ctx.task(lidDesignTask, {
    projectId,
    siteCharacteristics,
    soilData,
    waterQualityAnalysis,
    lidRequirements,
    outputDir
  });

  artifacts.push(...lidDesign.artifacts);

  // Task 5: Detention/Retention Design
  ctx.log('info', 'Designing detention/retention facilities');
  const detentionDesign = await ctx.task(detentionDesignTask, {
    projectId,
    hydrologicAnalysis,
    prePostComparison,
    regulatoryRequirements,
    outputDir
  });

  artifacts.push(...detentionDesign.artifacts);

  // Breakpoint: Review stormwater design
  await ctx.breakpoint({
    question: `Stormwater design complete for ${projectId}. Peak flow reduction: ${prePostComparison.peakReduction}%. Review design?`,
    title: 'Stormwater Management Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        preDevPeakFlow: hydrologicAnalysis.preDevPeakFlow,
        postDevPeakFlow: hydrologicAnalysis.postDevPeakFlow,
        peakReduction: prePostComparison.peakReduction,
        detentionVolume: detentionDesign.requiredVolume,
        lidArea: lidDesign.totalArea
      }
    }
  });

  // Task 6: Conveyance System Design
  ctx.log('info', 'Designing conveyance systems');
  const conveyanceDesign = await ctx.task(conveyanceDesignTask, {
    projectId,
    hydrologicAnalysis,
    siteCharacteristics,
    outputDir
  });

  artifacts.push(...conveyanceDesign.artifacts);

  // Task 7: Erosion and Sediment Control
  ctx.log('info', 'Designing erosion and sediment control');
  const escDesign = await ctx.task(escDesignTask, {
    projectId,
    siteCharacteristics,
    conveyanceDesign,
    outputDir
  });

  artifacts.push(...escDesign.artifacts);

  // Task 8: Drainage Plans
  ctx.log('info', 'Generating drainage plans');
  const drainagePlans = await ctx.task(drainagePlansTask, {
    projectId,
    conveyanceDesign,
    detentionDesign,
    lidDesign,
    escDesign,
    outputDir
  });

  artifacts.push(...drainagePlans.artifacts);

  // Task 9: Stormwater Management Report
  ctx.log('info', 'Generating stormwater management report');
  const stormwaterReport = await ctx.task(stormwaterReportTask, {
    projectId,
    hydrologicAnalysis,
    prePostComparison,
    waterQualityAnalysis,
    lidDesign,
    detentionDesign,
    conveyanceDesign,
    escDesign,
    regulatoryRequirements,
    outputDir
  });

  artifacts.push(...stormwaterReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    stormwaterDesign: {
      hydrology: hydrologicAnalysis.results,
      prePostComparison: prePostComparison.results,
      waterQuality: waterQualityAnalysis.design,
      lid: lidDesign.design,
      conveyance: conveyanceDesign.design,
      escPlan: escDesign.plan
    },
    drainagePlans: drainagePlans.plans,
    detentionDesign: detentionDesign.design,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/stormwater-management-design',
      timestamp: startTime,
      projectId,
      outputDir
    }
  };
}

// Task 1: Hydrologic Analysis
export const hydrologicAnalysisTask = defineTask('hydrologic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform hydrologic analysis',
  agent: {
    name: 'hydrology-analyst',
    prompt: {
      role: 'water resources engineer',
      task: 'Perform hydrologic analysis for stormwater design',
      context: args,
      instructions: [
        'Delineate drainage areas',
        'Determine curve numbers or runoff coefficients',
        'Calculate time of concentration',
        'Determine design storm rainfall depths',
        'Calculate peak flows using Rational or SCS method',
        'Develop runoff hydrographs',
        'Analyze pre-development conditions',
        'Analyze post-development conditions'
      ],
      outputFormat: 'JSON with hydrologic calculations, peak flows'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'preDevPeakFlow', 'postDevPeakFlow', 'results', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        results: { type: 'object' },
        drainageAreas: { type: 'array' },
        curveNumbers: { type: 'object' },
        timeOfConcentration: { type: 'number' },
        preDevPeakFlow: { type: 'number' },
        postDevPeakFlow: { type: 'number' },
        hydrographs: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'stormwater', 'hydrology']
}));

// Task 2: Pre/Post Development Comparison
export const prePostComparisonTask = defineTask('pre-post-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare pre and post development conditions',
  agent: {
    name: 'hydrology-analyst',
    prompt: {
      role: 'water resources engineer',
      task: 'Compare pre and post development hydrology',
      context: args,
      instructions: [
        'Compare impervious area changes',
        'Compare peak flow changes',
        'Compare runoff volume changes',
        'Determine detention requirements',
        'Identify water quality volume',
        'Verify regulatory compliance',
        'Calculate required peak flow reduction',
        'Document comparison results'
      ],
      outputFormat: 'JSON with pre/post comparison, requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'peakReduction', 'artifacts'],
      properties: {
        results: { type: 'object' },
        imperviousChange: { type: 'number' },
        peakFlowIncrease: { type: 'number' },
        peakReduction: { type: 'number' },
        volumeIncrease: { type: 'number' },
        detentionRequired: { type: 'boolean' },
        waterQualityVolume: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'stormwater', 'comparison']
}));

// Task 3: Water Quality Analysis
export const waterQualityTask = defineTask('water-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze water quality requirements',
  agent: {
    name: 'stormwater-management-specialist',
    prompt: {
      role: 'water resources engineer',
      task: 'Determine water quality treatment requirements',
      context: args,
      instructions: [
        'Identify regulatory water quality requirements',
        'Calculate water quality volume (WQv)',
        'Identify pollutants of concern',
        'Determine removal efficiency requirements',
        'Select appropriate BMPs',
        'Calculate BMP sizing',
        'Verify treatment train effectiveness',
        'Document water quality design'
      ],
      outputFormat: 'JSON with water quality requirements, BMP selection'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        waterQualityVolume: { type: 'number' },
        pollutantsOfConcern: { type: 'array' },
        removalTargets: { type: 'object' },
        selectedBMPs: { type: 'array' },
        treatmentTrain: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'stormwater', 'water-quality']
}));

// Task 4: LID/Green Infrastructure Design
export const lidDesignTask = defineTask('lid-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design LID and green infrastructure',
  agent: {
    name: 'stormwater-management-specialist',
    prompt: {
      role: 'water resources/landscape engineer',
      task: 'Design low impact development features',
      context: args,
      instructions: [
        'Evaluate site opportunities for LID',
        'Design bioretention facilities',
        'Design permeable pavement areas',
        'Design rain gardens',
        'Design green roofs if applicable',
        'Size infiltration practices',
        'Calculate runoff volume managed',
        'Create LID details'
      ],
      outputFormat: 'JSON with LID design, sizing, details'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'totalArea', 'artifacts'],
      properties: {
        design: { type: 'object' },
        totalArea: { type: 'number' },
        bioretention: { type: 'array' },
        permeablePavement: { type: 'object' },
        rainGardens: { type: 'array' },
        volumeManaged: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'stormwater', 'lid']
}));

// Task 5: Detention/Retention Design
export const detentionDesignTask = defineTask('detention-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design detention/retention facilities',
  agent: {
    name: 'stormwater-management-specialist',
    prompt: {
      role: 'water resources engineer',
      task: 'Design stormwater detention facilities',
      context: args,
      instructions: [
        'Determine required detention volume',
        'Route inflow hydrographs through pond',
        'Design outlet structure',
        'Size principal spillway (riser, barrel)',
        'Design emergency spillway',
        'Establish pond grading',
        'Design dam embankment if applicable',
        'Calculate pond stage-storage-discharge'
      ],
      outputFormat: 'JSON with detention design, outlet structure'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'requiredVolume', 'artifacts'],
      properties: {
        design: { type: 'object' },
        requiredVolume: { type: 'number' },
        providedVolume: { type: 'number' },
        stageStorageDischarge: { type: 'object' },
        outletStructure: { type: 'object' },
        emergencySpillway: { type: 'object' },
        pondGrading: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'stormwater', 'detention']
}));

// Task 6: Conveyance System Design
export const conveyanceDesignTask = defineTask('conveyance-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design conveyance systems',
  agent: {
    name: 'hydraulic-engineer',
    prompt: {
      role: 'civil engineer',
      task: 'Design storm drain conveyance system',
      context: args,
      instructions: [
        'Design storm drain pipe network',
        'Size pipes using Manning equation',
        'Design inlet structures',
        'Calculate hydraulic grade line',
        'Design open channels',
        'Design culvert crossings',
        'Check outlet velocities and erosion',
        'Create pipe schedule'
      ],
      outputFormat: 'JSON with conveyance design, pipe schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        pipeNetwork: { type: 'array' },
        inletDesign: { type: 'array' },
        hglAnalysis: { type: 'object' },
        channelDesign: { type: 'array' },
        culvertDesign: { type: 'array' },
        pipeSchedule: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'stormwater', 'conveyance']
}));

// Task 7: Erosion and Sediment Control
export const escDesignTask = defineTask('esc-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design erosion and sediment control',
  agent: {
    name: 'environmental-compliance-specialist',
    prompt: {
      role: 'civil/environmental engineer',
      task: 'Design erosion and sediment control plan',
      context: args,
      instructions: [
        'Identify disturbed areas by phase',
        'Design sediment basins and traps',
        'Design silt fence locations',
        'Design inlet protection',
        'Specify stabilization measures',
        'Design construction sequencing',
        'Specify inspection and maintenance',
        'Create ESC plan'
      ],
      outputFormat: 'JSON with ESC plan, BMPs'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        sedimentBasins: { type: 'array' },
        siltFence: { type: 'object' },
        inletProtection: { type: 'array' },
        stabilizationMeasures: { type: 'array' },
        constructionSequence: { type: 'array' },
        maintenanceSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'stormwater', 'esc']
}));

// Task 8: Drainage Plans
export const drainagePlansTask = defineTask('drainage-plans', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate drainage plans',
  agent: {
    name: 'highway-design-engineer',
    prompt: {
      role: 'civil CAD technician',
      task: 'Generate drainage and grading plans',
      context: args,
      instructions: [
        'Create drainage area plan',
        'Create storm drain plan and profile',
        'Create detention pond plan',
        'Create outlet structure details',
        'Create LID details',
        'Create ESC plan',
        'Create drainage details',
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
  labels: ['agent', 'civil-engineering', 'stormwater', 'plans']
}));

// Task 9: Stormwater Management Report
export const stormwaterReportTask = defineTask('stormwater-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate stormwater management report',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'water resources engineer',
      task: 'Generate comprehensive stormwater management report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document site conditions',
        'Present hydrologic analysis',
        'Document pre/post comparison',
        'Present water quality design',
        'Document LID design',
        'Present detention design',
        'Document conveyance system',
        'Include ESC plan summary',
        'Demonstrate regulatory compliance'
      ],
      outputFormat: 'JSON with report path, compliance summary'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'complianceSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        complianceSummary: { type: 'object' },
        keyFindings: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'stormwater', 'reporting']
}));
