/**
 * @process civil-engineering/hydraulic-structure-design
 * @description Design of hydraulic structures including culverts, channels, spillways, and energy dissipation structures
 * @inputs { projectId: string, structureType: string, designFlow: number, siteConditions: object, upstreamConditions: object }
 * @outputs { success: boolean, hydraulicDesign: object, structuralDesign: object, drawings: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    structureType,
    designFlow,
    siteConditions,
    upstreamConditions,
    downstreamConditions,
    geotechnicalData,
    designCode = 'FHWA-HDS',
    outputDir = 'hydraulic-structure-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Hydrologic and Hydraulic Analysis
  ctx.log('info', 'Starting hydraulic structure design: H&H analysis');
  const hhAnalysis = await ctx.task(hhAnalysisTask, {
    projectId,
    structureType,
    designFlow,
    upstreamConditions,
    downstreamConditions,
    outputDir
  });

  if (!hhAnalysis.success) {
    return {
      success: false,
      error: 'Hydrologic and hydraulic analysis failed',
      details: hhAnalysis,
      metadata: { processId: 'civil-engineering/hydraulic-structure-design', timestamp: startTime }
    };
  }

  artifacts.push(...hhAnalysis.artifacts);

  // Task 2: Structure Sizing
  ctx.log('info', 'Sizing hydraulic structure');
  const structureSizing = await ctx.task(structureSizingTask, {
    projectId,
    structureType,
    hhAnalysis,
    siteConditions,
    designCode,
    outputDir
  });

  artifacts.push(...structureSizing.artifacts);

  // Task 3: Inlet Design
  ctx.log('info', 'Designing inlet conditions');
  const inletDesign = await ctx.task(inletDesignTask, {
    projectId,
    structureType,
    structureSizing,
    upstreamConditions,
    outputDir
  });

  artifacts.push(...inletDesign.artifacts);

  // Task 4: Outlet Design and Energy Dissipation
  ctx.log('info', 'Designing outlet and energy dissipation');
  const outletDesign = await ctx.task(outletDesignTask, {
    projectId,
    structureType,
    structureSizing,
    hhAnalysis,
    downstreamConditions,
    outputDir
  });

  artifacts.push(...outletDesign.artifacts);

  // Task 5: Structural Design
  ctx.log('info', 'Performing structural design');
  const structuralDesign = await ctx.task(structuralDesignTask, {
    projectId,
    structureType,
    structureSizing,
    geotechnicalData,
    outputDir
  });

  artifacts.push(...structuralDesign.artifacts);

  // Breakpoint: Review hydraulic structure design
  await ctx.breakpoint({
    question: `Hydraulic structure design complete for ${projectId}. Structure type: ${structureType}. Review design?`,
    title: 'Hydraulic Structure Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        structureType: structureType,
        designFlow: designFlow,
        structureSize: structureSizing.size,
        headwaterElevation: hhAnalysis.headwater,
        outletVelocity: outletDesign.velocity,
        energyDissipatorType: outletDesign.dissipatorType
      }
    }
  });

  // Task 6: Scour Analysis
  ctx.log('info', 'Performing scour analysis');
  const scourAnalysis = await ctx.task(scourAnalysisTask, {
    projectId,
    structureSizing,
    hhAnalysis,
    geotechnicalData,
    outputDir
  });

  artifacts.push(...scourAnalysis.artifacts);

  // Task 7: Hydraulic Structure Drawings
  ctx.log('info', 'Generating hydraulic structure drawings');
  const structureDrawings = await ctx.task(structureDrawingsTask, {
    projectId,
    structureType,
    structureSizing,
    inletDesign,
    outletDesign,
    structuralDesign,
    outputDir
  });

  artifacts.push(...structureDrawings.artifacts);

  // Task 8: Hydraulic Design Report
  ctx.log('info', 'Generating hydraulic design report');
  const hydraulicReport = await ctx.task(hydraulicReportTask, {
    projectId,
    hhAnalysis,
    structureSizing,
    inletDesign,
    outletDesign,
    structuralDesign,
    scourAnalysis,
    outputDir
  });

  artifacts.push(...hydraulicReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    hydraulicDesign: {
      analysis: hhAnalysis.results,
      sizing: structureSizing.design,
      inlet: inletDesign.design,
      outlet: outletDesign.design,
      scour: scourAnalysis.results
    },
    structuralDesign: structuralDesign.design,
    drawings: structureDrawings.drawings,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/hydraulic-structure-design',
      timestamp: startTime,
      projectId,
      designCode,
      outputDir
    }
  };
}

// Task 1: Hydrologic and Hydraulic Analysis
export const hhAnalysisTask = defineTask('hh-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform hydrologic and hydraulic analysis',
  agent: {
    name: 'hydraulic-engineer',
    prompt: {
      role: 'hydraulic engineer',
      task: 'Perform H&H analysis for structure design',
      context: args,
      instructions: [
        'Verify design flow frequency and magnitude',
        'Analyze upstream water surface profile',
        'Analyze downstream tailwater conditions',
        'Determine flow regime (subcritical, supercritical)',
        'Calculate normal and critical depths',
        'Perform backwater analysis',
        'Determine headwater requirements',
        'Document H&H analysis'
      ],
      outputFormat: 'JSON with H&H analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'headwater', 'results', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        results: { type: 'object' },
        designFlow: { type: 'number' },
        headwater: { type: 'number' },
        tailwater: { type: 'number' },
        normalDepth: { type: 'number' },
        criticalDepth: { type: 'number' },
        flowRegime: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'hydraulic', 'analysis']
}));

// Task 2: Structure Sizing
export const structureSizingTask = defineTask('structure-sizing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Size hydraulic structure',
  agent: {
    name: 'hydraulic-engineer',
    prompt: {
      role: 'hydraulic engineer',
      task: 'Size hydraulic structure for design flow',
      context: args,
      instructions: [
        'Determine structure type and configuration',
        'Calculate required waterway area',
        'Select structure dimensions',
        'Analyze inlet control conditions',
        'Analyze outlet control conditions',
        'Determine controlling headwater',
        'Check freeboard requirements',
        'Verify capacity for design flow'
      ],
      outputFormat: 'JSON with structure sizing, capacity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'size', 'artifacts'],
      properties: {
        design: { type: 'object' },
        size: { type: 'string' },
        waterwayArea: { type: 'number' },
        inletControl: { type: 'object' },
        outletControl: { type: 'object' },
        controllingHeadwater: { type: 'number' },
        capacity: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'hydraulic', 'sizing']
}));

// Task 3: Inlet Design
export const inletDesignTask = defineTask('inlet-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design inlet conditions',
  agent: {
    name: 'hydraulic-engineer',
    prompt: {
      role: 'hydraulic engineer',
      task: 'Design structure inlet',
      context: args,
      instructions: [
        'Select inlet type (projecting, mitered, headwall)',
        'Design wingwalls and headwall',
        'Determine inlet efficiency',
        'Design approach channel transitions',
        'Check inlet velocities',
        'Design debris control if needed',
        'Detail inlet protection',
        'Create inlet details'
      ],
      outputFormat: 'JSON with inlet design, details'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        inletType: { type: 'string' },
        headwallDesign: { type: 'object' },
        wingwallDesign: { type: 'object' },
        inletEfficiency: { type: 'number' },
        approachTransition: { type: 'object' },
        debrisControl: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'hydraulic', 'inlet']
}));

// Task 4: Outlet Design and Energy Dissipation
export const outletDesignTask = defineTask('outlet-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design outlet and energy dissipation',
  agent: {
    name: 'hydraulic-engineer',
    prompt: {
      role: 'hydraulic engineer',
      task: 'Design outlet and energy dissipation',
      context: args,
      instructions: [
        'Calculate outlet velocity',
        'Determine need for energy dissipation',
        'Select dissipator type (riprap, basin, baffle)',
        'Design stilling basin if needed',
        'Size riprap apron',
        'Design outlet transitions',
        'Check downstream erosion potential',
        'Create outlet and dissipator details'
      ],
      outputFormat: 'JSON with outlet design, energy dissipator'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'velocity', 'dissipatorType', 'artifacts'],
      properties: {
        design: { type: 'object' },
        velocity: { type: 'number' },
        dissipatorType: { type: 'string' },
        stillingBasin: { type: 'object' },
        riprapDesign: { type: 'object' },
        outletTransition: { type: 'object' },
        erosionProtection: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'hydraulic', 'outlet']
}));

// Task 5: Structural Design
export const structuralDesignTask = defineTask('structural-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform structural design',
  agent: {
    name: 'structural-load-analyst',
    prompt: {
      role: 'structural engineer',
      task: 'Design structure for hydraulic and earth loads',
      context: args,
      instructions: [
        'Calculate earth loads on structure',
        'Calculate hydrostatic and hydrodynamic loads',
        'Calculate live loads (traffic)',
        'Design culvert barrel or channel lining',
        'Design headwalls and wingwalls',
        'Design foundation/cutoff walls',
        'Check flotation stability',
        'Create structural details'
      ],
      outputFormat: 'JSON with structural design, reinforcement'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        earthLoads: { type: 'object' },
        hydraulicLoads: { type: 'object' },
        barrelDesign: { type: 'object' },
        headwallDesign: { type: 'object' },
        foundationDesign: { type: 'object' },
        flotationCheck: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'hydraulic', 'structural']
}));

// Task 6: Scour Analysis
export const scourAnalysisTask = defineTask('scour-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform scour analysis',
  agent: {
    name: 'hydraulic-engineer',
    prompt: {
      role: 'hydraulic engineer',
      task: 'Analyze scour potential and protection',
      context: args,
      instructions: [
        'Calculate contraction scour',
        'Calculate local scour at structure',
        'Evaluate long-term degradation',
        'Determine total scour depth',
        'Design scour countermeasures',
        'Design riprap protection',
        'Specify foundation depth for scour',
        'Document scour analysis'
      ],
      outputFormat: 'JSON with scour analysis, countermeasures'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: { type: 'object' },
        contractionScour: { type: 'number' },
        localScour: { type: 'number' },
        degradation: { type: 'number' },
        totalScour: { type: 'number' },
        countermeasures: { type: 'array' },
        riprapProtection: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'hydraulic', 'scour']
}));

// Task 7: Structure Drawings
export const structureDrawingsTask = defineTask('structure-drawings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate hydraulic structure drawings',
  agent: {
    name: 'highway-design-engineer',
    prompt: {
      role: 'civil CAD technician',
      task: 'Generate hydraulic structure drawings',
      context: args,
      instructions: [
        'Create structure plan view',
        'Create structure profile',
        'Create cross-sections',
        'Detail inlet structure',
        'Detail outlet and energy dissipator',
        'Show reinforcement details',
        'Include hydraulic data table',
        'Create drawing index'
      ],
      outputFormat: 'JSON with drawing list, file paths'
    },
    outputSchema: {
      type: 'object',
      required: ['drawings', 'artifacts'],
      properties: {
        drawings: {
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
  labels: ['agent', 'civil-engineering', 'hydraulic', 'drawings']
}));

// Task 8: Hydraulic Design Report
export const hydraulicReportTask = defineTask('hydraulic-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate hydraulic design report',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'hydraulic engineer',
      task: 'Generate comprehensive hydraulic design report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document design criteria',
        'Present H&H analysis',
        'Document structure sizing',
        'Present inlet design',
        'Present outlet and energy dissipation',
        'Document structural design',
        'Present scour analysis',
        'Include design calculations'
      ],
      outputFormat: 'JSON with report path, key findings'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array' },
        designSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'hydraulic', 'reporting']
}));
