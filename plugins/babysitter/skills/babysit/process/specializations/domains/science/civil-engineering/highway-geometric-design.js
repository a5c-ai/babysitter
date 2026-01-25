/**
 * @process civil-engineering/highway-geometric-design
 * @description Geometric design of highways and roads per AASHTO Green Book including horizontal alignment, vertical alignment, and cross-sections
 * @inputs { projectId: string, designSpeed: number, terrainType: string, functionalClass: string, trafficData: object }
 * @outputs { success: boolean, geometricDesign: object, planProfileDrawings: array, crossSections: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    designSpeed,
    terrainType,
    functionalClass,
    trafficData,
    existingSurvey,
    rightOfWay,
    designCode = 'AASHTO-GreenBook',
    outputDir = 'highway-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Design Criteria Establishment
  ctx.log('info', 'Starting highway geometric design: Establishing design criteria');
  const designCriteria = await ctx.task(designCriteriaTask, {
    projectId,
    designSpeed,
    terrainType,
    functionalClass,
    trafficData,
    designCode,
    outputDir
  });

  if (!designCriteria.success) {
    return {
      success: false,
      error: 'Design criteria establishment failed',
      details: designCriteria,
      metadata: { processId: 'civil-engineering/highway-geometric-design', timestamp: startTime }
    };
  }

  artifacts.push(...designCriteria.artifacts);

  // Task 2: Horizontal Alignment Design
  ctx.log('info', 'Designing horizontal alignment');
  const horizontalAlignment = await ctx.task(horizontalAlignmentTask, {
    projectId,
    designCriteria,
    existingSurvey,
    rightOfWay,
    outputDir
  });

  artifacts.push(...horizontalAlignment.artifacts);

  // Task 3: Vertical Alignment Design
  ctx.log('info', 'Designing vertical alignment');
  const verticalAlignment = await ctx.task(verticalAlignmentTask, {
    projectId,
    designCriteria,
    horizontalAlignment,
    existingSurvey,
    outputDir
  });

  artifacts.push(...verticalAlignment.artifacts);

  // Task 4: Cross-Section Design
  ctx.log('info', 'Designing typical cross-sections');
  const crossSectionDesign = await ctx.task(crossSectionTask, {
    projectId,
    designCriteria,
    functionalClass,
    trafficData,
    outputDir
  });

  artifacts.push(...crossSectionDesign.artifacts);

  // Task 5: Superelevation Design
  ctx.log('info', 'Designing superelevation');
  const superelevation = await ctx.task(superelevationTask, {
    projectId,
    horizontalAlignment,
    designCriteria,
    designCode,
    outputDir
  });

  artifacts.push(...superelevation.artifacts);

  // Breakpoint: Review geometric design
  await ctx.breakpoint({
    question: `Highway geometric design complete for ${projectId}. Design speed: ${designSpeed} mph. Review alignment and cross-sections?`,
    title: 'Highway Geometric Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        designSpeed: designSpeed,
        totalLength: horizontalAlignment.totalLength,
        numberOfCurves: horizontalAlignment.curveCount,
        numberOfVPIs: verticalAlignment.vpiCount,
        laneWidth: crossSectionDesign.laneWidth,
        maxSuperelevation: superelevation.maxRate
      }
    }
  });

  // Task 6: Sight Distance Analysis
  ctx.log('info', 'Analyzing sight distances');
  const sightDistance = await ctx.task(sightDistanceTask, {
    projectId,
    horizontalAlignment,
    verticalAlignment,
    crossSectionDesign,
    designCriteria,
    outputDir
  });

  artifacts.push(...sightDistance.artifacts);

  // Task 7: Intersection Design
  ctx.log('info', 'Designing intersections');
  const intersectionDesign = await ctx.task(intersectionDesignTask, {
    projectId,
    horizontalAlignment,
    designCriteria,
    trafficData,
    outputDir
  });

  artifacts.push(...intersectionDesign.artifacts);

  // Task 8: Plan and Profile Drawings
  ctx.log('info', 'Generating plan and profile drawings');
  const planProfile = await ctx.task(planProfileTask, {
    projectId,
    horizontalAlignment,
    verticalAlignment,
    crossSectionDesign,
    superelevation,
    outputDir
  });

  artifacts.push(...planProfile.artifacts);

  // Task 9: Earthwork Quantities
  ctx.log('info', 'Calculating earthwork quantities');
  const earthwork = await ctx.task(earthworkTask, {
    projectId,
    horizontalAlignment,
    verticalAlignment,
    crossSectionDesign,
    existingSurvey,
    outputDir
  });

  artifacts.push(...earthwork.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    geometricDesign: {
      designCriteria: designCriteria.criteria,
      horizontalAlignment: horizontalAlignment.alignment,
      verticalAlignment: verticalAlignment.alignment,
      crossSection: crossSectionDesign.typicalSection,
      superelevation: superelevation.design,
      sightDistances: sightDistance.results
    },
    planProfileDrawings: planProfile.drawings,
    crossSections: crossSectionDesign.sections,
    earthworkQuantities: earthwork.quantities,
    intersections: intersectionDesign.designs,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/highway-geometric-design',
      timestamp: startTime,
      projectId,
      designCode,
      outputDir
    }
  };
}

// Task 1: Design Criteria
export const designCriteriaTask = defineTask('design-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish design criteria',
  skill: { name: 'highway-alignment-designer' },
  agent: {
    name: 'highway-design-engineer',
    prompt: {
      role: 'senior highway engineer',
      task: 'Establish geometric design criteria per AASHTO',
      context: args,
      instructions: [
        'Determine design speed based on functional class',
        'Establish minimum radius of curvature',
        'Determine stopping sight distance requirements',
        'Establish maximum grades',
        'Determine K-values for vertical curves',
        'Establish lane and shoulder widths',
        'Determine maximum superelevation rate',
        'Document all design criteria'
      ],
      outputFormat: 'JSON with design criteria parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'criteria', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        criteria: {
          type: 'object',
          properties: {
            designSpeed: { type: 'number' },
            minRadius: { type: 'number' },
            stoppingSightDistance: { type: 'number' },
            maxGrade: { type: 'number' },
            minKCrest: { type: 'number' },
            minKSag: { type: 'number' },
            maxSuper: { type: 'number' }
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
  labels: ['agent', 'civil-engineering', 'highway', 'design-criteria']
}));

// Task 2: Horizontal Alignment
export const horizontalAlignmentTask = defineTask('horizontal-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design horizontal alignment',
  skill: { name: 'highway-alignment-designer' },
  agent: {
    name: 'highway-design-engineer',
    prompt: {
      role: 'highway engineer',
      task: 'Design horizontal alignment',
      context: args,
      instructions: [
        'Establish PI (point of intersection) locations',
        'Design circular curves with appropriate radii',
        'Design spiral transition curves',
        'Calculate curve data (T, L, E, M)',
        'Check radius against design speed',
        'Verify alignment fits within ROW',
        'Calculate stationing',
        'Generate horizontal alignment table'
      ],
      outputFormat: 'JSON with alignment data, curve tables'
    },
    outputSchema: {
      type: 'object',
      required: ['alignment', 'totalLength', 'curveCount', 'artifacts'],
      properties: {
        alignment: { type: 'object' },
        totalLength: { type: 'number' },
        curveCount: { type: 'number' },
        curveTable: { type: 'array' },
        piCoordinates: { type: 'array' },
        stationing: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'highway', 'horizontal-alignment']
}));

// Task 3: Vertical Alignment
export const verticalAlignmentTask = defineTask('vertical-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design vertical alignment',
  skill: { name: 'highway-alignment-designer' },
  agent: {
    name: 'highway-design-engineer',
    prompt: {
      role: 'highway engineer',
      task: 'Design vertical alignment',
      context: args,
      instructions: [
        'Establish VPI (vertical point of intersection) locations',
        'Determine grades between VPIs',
        'Design crest vertical curves (K-values)',
        'Design sag vertical curves (K-values)',
        'Check headlight sight distance for sag curves',
        'Verify grades against maximum allowed',
        'Calculate high/low points on curves',
        'Generate vertical alignment table'
      ],
      outputFormat: 'JSON with profile data, vertical curve tables'
    },
    outputSchema: {
      type: 'object',
      required: ['alignment', 'vpiCount', 'artifacts'],
      properties: {
        alignment: { type: 'object' },
        vpiCount: { type: 'number' },
        verticalCurveTable: { type: 'array' },
        grades: { type: 'array' },
        highLowPoints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'highway', 'vertical-alignment']
}));

// Task 4: Cross-Section Design
export const crossSectionTask = defineTask('cross-section', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design typical cross-sections',
  skill: { name: 'civil3d-surface-analyzer' },
  agent: {
    name: 'highway-design-engineer',
    prompt: {
      role: 'highway engineer',
      task: 'Design typical highway cross-sections',
      context: args,
      instructions: [
        'Determine number of lanes',
        'Establish lane widths',
        'Design shoulder widths and types',
        'Establish normal crown slope',
        'Design ditch sections',
        'Establish cut and fill slopes',
        'Design clear zone requirements',
        'Create typical section drawings'
      ],
      outputFormat: 'JSON with typical section dimensions'
    },
    outputSchema: {
      type: 'object',
      required: ['typicalSection', 'laneWidth', 'sections', 'artifacts'],
      properties: {
        typicalSection: { type: 'object' },
        laneWidth: { type: 'number' },
        numberOfLanes: { type: 'number' },
        shoulderWidth: { type: 'number' },
        normalCrown: { type: 'number' },
        cutSlope: { type: 'string' },
        fillSlope: { type: 'string' },
        sections: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'highway', 'cross-section']
}));

// Task 5: Superelevation Design
export const superelevationTask = defineTask('superelevation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design superelevation',
  skill: { name: 'highway-alignment-designer' },
  agent: {
    name: 'highway-design-engineer',
    prompt: {
      role: 'highway engineer',
      task: 'Design superelevation for horizontal curves',
      context: args,
      instructions: [
        'Determine maximum superelevation rate',
        'Calculate required superelevation for each curve',
        'Design superelevation transition lengths',
        'Determine runoff and tangent runout lengths',
        'Calculate superelevation diagram',
        'Check for adverse cross slope',
        'Coordinate with spiral curves',
        'Generate superelevation tables'
      ],
      outputFormat: 'JSON with superelevation design, transition data'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'maxRate', 'artifacts'],
      properties: {
        design: { type: 'object' },
        maxRate: { type: 'number' },
        superelevationTable: { type: 'array' },
        transitionLengths: { type: 'object' },
        superelevationDiagram: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'highway', 'superelevation']
}));

// Task 6: Sight Distance Analysis
export const sightDistanceTask = defineTask('sight-distance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze sight distances',
  skill: { name: 'highway-alignment-designer' },
  agent: {
    name: 'highway-design-engineer',
    prompt: {
      role: 'highway engineer',
      task: 'Analyze and verify sight distances',
      context: args,
      instructions: [
        'Verify stopping sight distance on crest curves',
        'Verify headlight sight distance on sag curves',
        'Check horizontal sight distance on curves',
        'Identify sight distance obstructions',
        'Analyze passing sight distance where applicable',
        'Check decision sight distance at interchanges',
        'Recommend sight clearing if needed',
        'Document sight distance analysis'
      ],
      outputFormat: 'JSON with sight distance analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: { type: 'object' },
        stoppingSightDistance: { type: 'object' },
        passingSightDistance: { type: 'object' },
        horizontalSightDistance: { type: 'object' },
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
  labels: ['agent', 'civil-engineering', 'highway', 'sight-distance']
}));

// Task 7: Intersection Design
export const intersectionDesignTask = defineTask('intersection-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design intersections',
  skill: { name: 'highway-alignment-designer' },
  agent: {
    name: 'traffic-engineer',
    prompt: {
      role: 'highway engineer',
      task: 'Design at-grade intersections',
      context: args,
      instructions: [
        'Identify intersection locations',
        'Design intersection geometry',
        'Design turn lanes and tapers',
        'Design curb return radii',
        'Check intersection sight distance',
        'Design channelization',
        'Coordinate with signal design',
        'Generate intersection layouts'
      ],
      outputFormat: 'JSON with intersection designs'
    },
    outputSchema: {
      type: 'object',
      required: ['designs', 'artifacts'],
      properties: {
        designs: { type: 'array' },
        intersectionCount: { type: 'number' },
        turnLaneDesigns: { type: 'array' },
        channelizationDetails: { type: 'array' },
        sightDistanceChecks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'highway', 'intersection']
}));

// Task 8: Plan and Profile Drawings
export const planProfileTask = defineTask('plan-profile', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate plan and profile drawings',
  skill: { name: 'civil3d-surface-analyzer' },
  agent: {
    name: 'highway-drafter',
    prompt: {
      role: 'highway CAD technician',
      task: 'Generate plan and profile drawings',
      context: args,
      instructions: [
        'Create plan sheets showing horizontal alignment',
        'Create profile sheets showing vertical alignment',
        'Show existing and proposed grades',
        'Include curve data tables',
        'Show superelevation diagrams',
        'Include typical sections',
        'Add stationing and coordinates',
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
              stationRange: { type: 'string' }
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
  labels: ['agent', 'civil-engineering', 'highway', 'drawings']
}));

// Task 9: Earthwork Quantities
export const earthworkTask = defineTask('earthwork', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate earthwork quantities',
  skill: { name: 'civil3d-surface-analyzer' },
  agent: {
    name: 'highway-design-engineer',
    prompt: {
      role: 'highway engineer',
      task: 'Calculate earthwork quantities',
      context: args,
      instructions: [
        'Calculate cross-sectional areas at stations',
        'Calculate cut and fill volumes using average end area',
        'Determine mass haul diagram',
        'Optimize earthwork balance',
        'Calculate stripping quantities',
        'Identify borrow or waste requirements',
        'Generate quantity summary',
        'Create mass diagram'
      ],
      outputFormat: 'JSON with earthwork quantities, mass diagram'
    },
    outputSchema: {
      type: 'object',
      required: ['quantities', 'artifacts'],
      properties: {
        quantities: {
          type: 'object',
          properties: {
            totalCut: { type: 'number' },
            totalFill: { type: 'number' },
            stripping: { type: 'number' },
            borrow: { type: 'number' },
            waste: { type: 'number' }
          }
        },
        volumeByStation: { type: 'array' },
        massDiagram: { type: 'object' },
        balancePoint: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'highway', 'earthwork']
}));
