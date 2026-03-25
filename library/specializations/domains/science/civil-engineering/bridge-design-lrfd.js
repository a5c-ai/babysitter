/**
 * @process civil-engineering/bridge-design-lrfd
 * @description Bridge design process using AASHTO LRFD specifications including superstructure design, substructure design, and load rating
 * @inputs { projectId: string, bridgeType: string, spanLengths: array, trafficData: object, geotechnicalData: object }
 * @outputs { success: boolean, bridgeDesignReport: object, structuralDrawings: array, loadRating: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    bridgeType,
    spanLengths,
    trafficData,
    geotechnicalData,
    roadwayWidth,
    designSpeed,
    designCode = 'AASHTO-LRFD-9th',
    outputDir = 'bridge-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Bridge Type Selection and Geometry
  ctx.log('info', 'Starting bridge design: Type selection and geometry');
  const bridgeGeometry = await ctx.task(bridgeGeometryTask, {
    projectId,
    bridgeType,
    spanLengths,
    roadwayWidth,
    designSpeed,
    outputDir
  });

  if (!bridgeGeometry.success) {
    return {
      success: false,
      error: 'Bridge geometry determination failed',
      details: bridgeGeometry,
      metadata: { processId: 'civil-engineering/bridge-design-lrfd', timestamp: startTime }
    };
  }

  artifacts.push(...bridgeGeometry.artifacts);

  // Task 2: Load Analysis
  ctx.log('info', 'Performing bridge load analysis');
  const loadAnalysis = await ctx.task(bridgeLoadAnalysisTask, {
    projectId,
    bridgeGeometry,
    trafficData,
    designCode,
    outputDir
  });

  artifacts.push(...loadAnalysis.artifacts);

  // Task 3: Superstructure Design
  ctx.log('info', 'Designing bridge superstructure');
  const superstructureDesign = await ctx.task(superstructureDesignTask, {
    projectId,
    bridgeType,
    bridgeGeometry,
    loadAnalysis,
    outputDir
  });

  artifacts.push(...superstructureDesign.artifacts);

  // Task 4: Deck Design
  ctx.log('info', 'Designing bridge deck');
  const deckDesign = await ctx.task(deckDesignTask, {
    projectId,
    bridgeGeometry,
    superstructureDesign,
    loadAnalysis,
    outputDir
  });

  artifacts.push(...deckDesign.artifacts);

  // Task 5: Substructure Design
  ctx.log('info', 'Designing bridge substructure');
  const substructureDesign = await ctx.task(substructureDesignTask, {
    projectId,
    bridgeGeometry,
    loadAnalysis,
    geotechnicalData,
    outputDir
  });

  artifacts.push(...substructureDesign.artifacts);

  // Task 6: Foundation Design
  ctx.log('info', 'Designing bridge foundations');
  const foundationDesign = await ctx.task(bridgeFoundationTask, {
    projectId,
    substructureDesign,
    geotechnicalData,
    loadAnalysis,
    outputDir
  });

  artifacts.push(...foundationDesign.artifacts);

  // Breakpoint: Review bridge design
  await ctx.breakpoint({
    question: `Bridge design complete for ${projectId}. Total length: ${bridgeGeometry.totalLength}ft. Review design and proceed to load rating?`,
    title: 'Bridge Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        bridgeType: bridgeType,
        totalLength: bridgeGeometry.totalLength,
        numberOfSpans: spanLengths.length,
        girderType: superstructureDesign.girderType,
        deckThickness: deckDesign.thickness,
        abutmentType: substructureDesign.abutmentType,
        foundationType: foundationDesign.type
      }
    }
  });

  // Task 7: Bearing Design
  ctx.log('info', 'Designing bridge bearings');
  const bearingDesign = await ctx.task(bearingDesignTask, {
    projectId,
    superstructureDesign,
    substructureDesign,
    loadAnalysis,
    outputDir
  });

  artifacts.push(...bearingDesign.artifacts);

  // Task 8: Load Rating
  ctx.log('info', 'Performing bridge load rating');
  const loadRating = await ctx.task(loadRatingTask, {
    projectId,
    superstructureDesign,
    deckDesign,
    loadAnalysis,
    designCode,
    outputDir
  });

  artifacts.push(...loadRating.artifacts);

  // Task 9: Bridge Design Report
  ctx.log('info', 'Generating bridge design report');
  const designReport = await ctx.task(bridgeReportTask, {
    projectId,
    bridgeGeometry,
    loadAnalysis,
    superstructureDesign,
    deckDesign,
    substructureDesign,
    foundationDesign,
    bearingDesign,
    loadRating,
    outputDir
  });

  artifacts.push(...designReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    bridgeDesignReport: {
      geometry: bridgeGeometry.geometry,
      superstructure: superstructureDesign.design,
      deck: deckDesign.design,
      substructure: substructureDesign.design,
      foundations: foundationDesign.design,
      bearings: bearingDesign.design
    },
    structuralDrawings: designReport.drawings,
    loadRating: loadRating.rating,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/bridge-design-lrfd',
      timestamp: startTime,
      projectId,
      designCode,
      outputDir
    }
  };
}

// Task 1: Bridge Geometry
export const bridgeGeometryTask = defineTask('bridge-geometry', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine bridge type and geometry',
  agent: {
    name: 'bridge-engineer',
    prompt: {
      role: 'senior bridge engineer',
      task: 'Establish bridge geometry and type selection',
      context: args,
      instructions: [
        'Confirm bridge type selection based on span lengths',
        'Establish horizontal and vertical alignment',
        'Determine roadway cross-section',
        'Define barrier and railing requirements',
        'Establish girder spacing and layout',
        'Define skew angle if applicable',
        'Determine expansion joint locations',
        'Create bridge geometry drawings'
      ],
      outputFormat: 'JSON with geometry, layout, cross-section details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'geometry', 'totalLength', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        geometry: { type: 'object' },
        totalLength: { type: 'number' },
        numberOfSpans: { type: 'number' },
        girderSpacing: { type: 'number' },
        skewAngle: { type: 'number' },
        crossSection: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'bridge', 'geometry']
}));

// Task 2: Bridge Load Analysis
export const bridgeLoadAnalysisTask = defineTask('bridge-load-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform bridge load analysis',
  agent: {
    name: 'bridge-engineer',
    prompt: {
      role: 'bridge engineer',
      task: 'Calculate bridge loads per AASHTO LRFD',
      context: args,
      instructions: [
        'Calculate dead loads (DC and DW)',
        'Apply HL-93 live load (truck, tandem, lane)',
        'Calculate dynamic load allowance (impact)',
        'Calculate pedestrian loads if applicable',
        'Calculate wind loads per AASHTO',
        'Calculate thermal loads',
        'Develop load combinations (Strength, Service, Fatigue)',
        'Create load envelope diagrams'
      ],
      outputFormat: 'JSON with load summary, combinations, envelopes'
    },
    outputSchema: {
      type: 'object',
      required: ['deadLoads', 'liveLoads', 'loadCombinations', 'artifacts'],
      properties: {
        deadLoads: { type: 'object' },
        liveLoads: { type: 'object' },
        dynamicAllowance: { type: 'number' },
        windLoads: { type: 'object' },
        loadCombinations: { type: 'array' },
        loadEnvelopes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'bridge', 'loads']
}));

// Task 3: Superstructure Design
export const superstructureDesignTask = defineTask('superstructure-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design bridge superstructure',
  agent: {
    name: 'bridge-engineer',
    prompt: {
      role: 'bridge engineer',
      task: 'Design bridge superstructure elements',
      context: args,
      instructions: [
        'Select girder type (steel, prestressed concrete, etc.)',
        'Design girders for flexure and shear',
        'Check service limit states (stress, deflection)',
        'Check fatigue limit state for steel',
        'Design diaphragms and cross-frames',
        'Check stability during construction',
        'Design splice locations if needed',
        'Generate girder details and schedules'
      ],
      outputFormat: 'JSON with girder design, member sizes, details'
    },
    outputSchema: {
      type: 'object',
      required: ['girderType', 'design', 'artifacts'],
      properties: {
        girderType: { type: 'string' },
        design: { type: 'object' },
        girderSchedule: { type: 'array' },
        diaphragmDesign: { type: 'object' },
        spliceDesign: { type: 'object' },
        deflectionCheck: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'bridge', 'superstructure']
}));

// Task 4: Deck Design
export const deckDesignTask = defineTask('deck-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design bridge deck',
  agent: {
    name: 'bridge-engineer',
    prompt: {
      role: 'bridge engineer',
      task: 'Design bridge deck per AASHTO LRFD',
      context: args,
      instructions: [
        'Determine deck thickness using empirical or strip method',
        'Design deck reinforcement for negative and positive moments',
        'Check punching shear at concentrated loads',
        'Design deck overhang for barrier impact',
        'Design construction joints',
        'Specify concrete strength and cover',
        'Design wearing surface requirements',
        'Create deck reinforcement plans'
      ],
      outputFormat: 'JSON with deck design, reinforcement, details'
    },
    outputSchema: {
      type: 'object',
      required: ['thickness', 'design', 'artifacts'],
      properties: {
        thickness: { type: 'number' },
        design: { type: 'object' },
        reinforcement: {
          type: 'object',
          properties: {
            transverse: { type: 'object' },
            longitudinal: { type: 'object' }
          }
        },
        overhangDesign: { type: 'object' },
        concreteSpecification: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'bridge', 'deck']
}));

// Task 5: Substructure Design
export const substructureDesignTask = defineTask('substructure-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design bridge substructure',
  agent: {
    name: 'bridge-engineer',
    prompt: {
      role: 'bridge engineer',
      task: 'Design bridge substructure elements',
      context: args,
      instructions: [
        'Design abutments (end bents)',
        'Design intermediate piers/bents',
        'Calculate substructure loads',
        'Check stability (sliding, overturning, bearing)',
        'Design pier caps and columns',
        'Check slenderness and P-delta effects',
        'Design for vessel collision if applicable',
        'Create substructure details'
      ],
      outputFormat: 'JSON with abutment and pier designs, details'
    },
    outputSchema: {
      type: 'object',
      required: ['abutmentType', 'design', 'artifacts'],
      properties: {
        abutmentType: { type: 'string' },
        pierType: { type: 'string' },
        design: { type: 'object' },
        abutmentDesign: { type: 'object' },
        pierDesign: { type: 'object' },
        stabilityChecks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'bridge', 'substructure']
}));

// Task 6: Bridge Foundation Design
export const bridgeFoundationTask = defineTask('bridge-foundation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design bridge foundations',
  agent: {
    name: 'foundation-engineer',
    prompt: {
      role: 'geotechnical/bridge engineer',
      task: 'Design bridge foundations',
      context: args,
      instructions: [
        'Evaluate foundation options (spread footing, piles, drilled shafts)',
        'Calculate bearing capacity',
        'Design pile or drilled shaft layout',
        'Calculate lateral capacity for vessel collision or scour',
        'Design pile caps or footings',
        'Check settlement under service loads',
        'Consider scour depth requirements',
        'Design seismic foundation requirements'
      ],
      outputFormat: 'JSON with foundation design, details, capacities'
    },
    outputSchema: {
      type: 'object',
      required: ['type', 'design', 'artifacts'],
      properties: {
        type: { type: 'string' },
        design: { type: 'object' },
        bearingCapacity: { type: 'number' },
        pileDesign: { type: 'object' },
        scourDesign: { type: 'object' },
        settlementCheck: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'bridge', 'foundation']
}));

// Task 7: Bearing Design
export const bearingDesignTask = defineTask('bearing-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design bridge bearings',
  agent: {
    name: 'bridge-engineer',
    prompt: {
      role: 'bridge engineer',
      task: 'Design bridge bearings per AASHTO LRFD',
      context: args,
      instructions: [
        'Select bearing type (elastomeric, pot, spherical, etc.)',
        'Calculate bearing reactions and movements',
        'Design elastomeric bearing pads',
        'Check bearing pad compression and rotation',
        'Design bearing anchorage',
        'Specify bearing layout and orientation',
        'Create bearing schedule and details',
        'Design bearing seats'
      ],
      outputFormat: 'JSON with bearing design, schedule, details'
    },
    outputSchema: {
      type: 'object',
      required: ['bearingType', 'design', 'artifacts'],
      properties: {
        bearingType: { type: 'string' },
        design: { type: 'object' },
        bearingSchedule: { type: 'array' },
        movements: { type: 'object' },
        anchorageDesign: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'bridge', 'bearings']
}));

// Task 8: Load Rating
export const loadRatingTask = defineTask('load-rating', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform bridge load rating',
  agent: {
    name: 'bridge-engineer',
    prompt: {
      role: 'bridge load rating engineer',
      task: 'Perform bridge load rating per AASHTO MBE',
      context: args,
      instructions: [
        'Calculate inventory and operating rating factors',
        'Rate for HL-93 design load',
        'Rate for legal loads (Type 3, 3S2, 3-3)',
        'Rate for state legal loads if applicable',
        'Rate for permit vehicles',
        'Identify controlling members and limit states',
        'Document posting requirements if needed',
        'Generate load rating summary'
      ],
      outputFormat: 'JSON with rating factors, controlling elements, posting needs'
    },
    outputSchema: {
      type: 'object',
      required: ['rating', 'artifacts'],
      properties: {
        rating: {
          type: 'object',
          properties: {
            inventoryRating: { type: 'number' },
            operatingRating: { type: 'number' },
            legalLoads: { type: 'object' },
            permitLoads: { type: 'object' }
          }
        },
        controllingMember: { type: 'string' },
        controllingLimitState: { type: 'string' },
        postingRequired: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'bridge', 'load-rating']
}));

// Task 9: Bridge Design Report
export const bridgeReportTask = defineTask('bridge-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate bridge design report',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'bridge engineer',
      task: 'Generate comprehensive bridge design report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document bridge geometry and layout',
        'Present load analysis summary',
        'Document superstructure design',
        'Document deck design',
        'Document substructure and foundation design',
        'Include bearing design',
        'Present load rating results',
        'Include material quantities',
        'Generate drawing list'
      ],
      outputFormat: 'JSON with report path, drawings, quantities'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'drawings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        drawings: { type: 'array' },
        materialQuantities: { type: 'object' },
        keyFindings: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'bridge', 'reporting']
}));
