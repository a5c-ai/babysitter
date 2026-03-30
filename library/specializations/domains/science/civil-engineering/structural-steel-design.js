/**
 * @process civil-engineering/structural-steel-design
 * @description Design of structural steel members and connections per AISC 360 including beams, columns, bracing, and moment frames
 * @inputs { projectId: string, loadAnalysis: object, structuralLayout: object, steelGrade: string }
 * @outputs { success: boolean, memberDesigns: object, connectionDesigns: array, steelDetailings: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    loadAnalysis,
    structuralLayout,
    steelGrade = 'A992',
    connectionType = 'LRFD',
    designCode = 'AISC360-22',
    seismicProvisions = false,
    outputDir = 'steel-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Design Criteria and Material Properties
  ctx.log('info', 'Starting structural steel design: Establishing design criteria');
  const designCriteria = await ctx.task(steelDesignCriteriaTask, {
    projectId,
    steelGrade,
    connectionType,
    designCode,
    seismicProvisions,
    outputDir
  });

  if (!designCriteria.success) {
    return {
      success: false,
      error: 'Design criteria establishment failed',
      details: designCriteria,
      metadata: { processId: 'civil-engineering/structural-steel-design', timestamp: startTime }
    };
  }

  artifacts.push(...designCriteria.artifacts);

  // Task 2: Beam Design
  ctx.log('info', 'Designing steel beams');
  const beamDesign = await ctx.task(steelBeamDesignTask, {
    projectId,
    loadAnalysis,
    structuralLayout,
    designCriteria,
    outputDir
  });

  artifacts.push(...beamDesign.artifacts);

  // Task 3: Column Design
  ctx.log('info', 'Designing steel columns');
  const columnDesign = await ctx.task(steelColumnDesignTask, {
    projectId,
    loadAnalysis,
    structuralLayout,
    designCriteria,
    outputDir
  });

  artifacts.push(...columnDesign.artifacts);

  // Task 4: Bracing System Design
  ctx.log('info', 'Designing bracing systems');
  const bracingDesign = await ctx.task(bracingDesignTask, {
    projectId,
    loadAnalysis,
    structuralLayout,
    designCriteria,
    outputDir
  });

  artifacts.push(...bracingDesign.artifacts);

  // Task 5: Moment Frame Design
  ctx.log('info', 'Designing moment frames');
  const momentFrameDesign = await ctx.task(momentFrameDesignTask, {
    projectId,
    loadAnalysis,
    structuralLayout,
    designCriteria,
    seismicProvisions,
    outputDir
  });

  artifacts.push(...momentFrameDesign.artifacts);

  // Task 6: Connection Design
  ctx.log('info', 'Designing steel connections');
  const connectionDesign = await ctx.task(connectionDesignTask, {
    projectId,
    beamDesign,
    columnDesign,
    bracingDesign,
    momentFrameDesign,
    designCriteria,
    outputDir
  });

  artifacts.push(...connectionDesign.artifacts);

  // Breakpoint: Review steel design
  await ctx.breakpoint({
    question: `Structural steel design complete for ${projectId}. Review member sizes and connection designs?`,
    title: 'Structural Steel Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        beamsDesigned: beamDesign.beamCount,
        columnsDesigned: columnDesign.columnCount,
        bracingMembers: bracingDesign.memberCount,
        connections: connectionDesign.connectionCount,
        totalSteelWeight: beamDesign.weight + columnDesign.weight + bracingDesign.weight
      }
    }
  });

  // Task 7: Steel Detailing
  ctx.log('info', 'Generating steel details');
  const steelDetailing = await ctx.task(steelDetailingTask, {
    projectId,
    beamDesign,
    columnDesign,
    bracingDesign,
    momentFrameDesign,
    connectionDesign,
    outputDir
  });

  artifacts.push(...steelDetailing.artifacts);

  // Task 8: Material Takeoff
  ctx.log('info', 'Generating material takeoff');
  const materialTakeoff = await ctx.task(materialTakeoffTask, {
    projectId,
    beamDesign,
    columnDesign,
    bracingDesign,
    connectionDesign,
    outputDir
  });

  artifacts.push(...materialTakeoff.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    memberDesigns: {
      beams: beamDesign.designs,
      columns: columnDesign.designs,
      bracing: bracingDesign.designs,
      momentFrames: momentFrameDesign.designs
    },
    connectionDesigns: connectionDesign.connections,
    steelDetailings: steelDetailing.details,
    materialQuantities: materialTakeoff.quantities,
    totalWeight: materialTakeoff.totalWeight,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/structural-steel-design',
      timestamp: startTime,
      projectId,
      designCode,
      outputDir
    }
  };
}

// Task 1: Design Criteria and Material Properties
export const steelDesignCriteriaTask = defineTask('steel-design-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish steel design criteria',
  agent: {
    name: 'structural-steel-designer',
    prompt: {
      role: 'senior structural engineer',
      task: 'Establish design criteria per AISC 360',
      context: args,
      instructions: [
        'Define steel material grades and specifications',
        'Determine Fy and Fu for specified grades',
        'Establish design methodology (LRFD or ASD)',
        'Define resistance factors (phi) or safety factors (omega)',
        'Specify bolt grades and types (A325, A490)',
        'Specify weld electrode classifications',
        'Define deflection and drift limits',
        'Document seismic design requirements if applicable'
      ],
      outputFormat: 'JSON with design criteria, material properties, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'materialProperties', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        materialProperties: {
          type: 'object',
          properties: {
            Fy: { type: 'number' },
            Fu: { type: 'number' },
            E: { type: 'number' },
            G: { type: 'number' }
          }
        },
        designFactors: { type: 'object' },
        boltSpecifications: { type: 'object' },
        weldSpecifications: { type: 'object' },
        serviceabilityLimits: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'steel-design', 'criteria']
}));

// Task 2: Steel Beam Design
export const steelBeamDesignTask = defineTask('steel-beam-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design steel beams',
  agent: {
    name: 'structural-steel-designer',
    prompt: {
      role: 'structural engineer',
      task: 'Design steel beams per AISC 360',
      context: args,
      instructions: [
        'Determine beam loads and load combinations',
        'Select beam sizes based on moment capacity',
        'Check flexural strength (compact, noncompact, slender)',
        'Check lateral-torsional buckling (Lb, Lp, Lr)',
        'Check shear strength',
        'Check web local yielding and crippling at supports',
        'Check deflection serviceability',
        'Check vibration for floor beams',
        'Design composite beams where applicable',
        'Generate beam schedule'
      ],
      outputFormat: 'JSON with beam designs, calculations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['beamCount', 'designs', 'weight', 'artifacts'],
      properties: {
        beamCount: { type: 'number' },
        designs: { type: 'object' },
        beamSchedule: { type: 'array' },
        weight: { type: 'number' },
        utilizationRatios: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'steel-design', 'beams']
}));

// Task 3: Steel Column Design
export const steelColumnDesignTask = defineTask('steel-column-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design steel columns',
  agent: {
    name: 'structural-steel-designer',
    prompt: {
      role: 'structural engineer',
      task: 'Design steel columns per AISC 360',
      context: args,
      instructions: [
        'Determine axial loads and moments',
        'Calculate effective length factors (K)',
        'Determine slenderness ratios (KL/r)',
        'Calculate critical buckling stress (Fcr)',
        'Check compressive strength',
        'Check combined axial and flexure (interaction)',
        'Consider P-delta effects',
        'Select column sizes and orientations',
        'Design base plates',
        'Generate column schedule'
      ],
      outputFormat: 'JSON with column designs, calculations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['columnCount', 'designs', 'weight', 'artifacts'],
      properties: {
        columnCount: { type: 'number' },
        designs: { type: 'object' },
        columnSchedule: { type: 'array' },
        basePlateDesigns: { type: 'array' },
        weight: { type: 'number' },
        utilizationRatios: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'steel-design', 'columns']
}));

// Task 4: Bracing System Design
export const bracingDesignTask = defineTask('bracing-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design bracing systems',
  agent: {
    name: 'seismic-design-specialist',
    prompt: {
      role: 'structural engineer',
      task: 'Design steel bracing systems per AISC 360',
      context: args,
      instructions: [
        'Determine bracing configuration (X, V, chevron, etc.)',
        'Calculate bracing forces from lateral loads',
        'Design tension-only or tension-compression bracing',
        'Check slenderness requirements for braces',
        'Design brace connections to gusset plates',
        'Check gusset plate yielding and buckling',
        'Consider seismic requirements (SCBF, OCBF)',
        'Design collector elements',
        'Generate bracing schedule'
      ],
      outputFormat: 'JSON with bracing designs, calculations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['memberCount', 'designs', 'weight', 'artifacts'],
      properties: {
        memberCount: { type: 'number' },
        bracingType: { type: 'string' },
        designs: { type: 'object' },
        bracingSchedule: { type: 'array' },
        gussetPlates: { type: 'array' },
        weight: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'steel-design', 'bracing']
}));

// Task 5: Moment Frame Design
export const momentFrameDesignTask = defineTask('moment-frame-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design moment frames',
  agent: {
    name: 'seismic-design-specialist',
    prompt: {
      role: 'structural engineer',
      task: 'Design steel moment frames per AISC 360 and AISC 341',
      context: args,
      instructions: [
        'Determine moment frame type (OMF, IMF, SMF)',
        'Calculate frame forces and moments',
        'Design beam-column members',
        'Check strong-column weak-beam ratio',
        'Design moment connections',
        'Check panel zone shear',
        'Check story drift limits',
        'Design continuity plates and doubler plates',
        'Document seismic detailing requirements',
        'Generate moment frame elevations'
      ],
      outputFormat: 'JSON with moment frame designs, calculations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['designs', 'artifacts'],
      properties: {
        frameType: { type: 'string' },
        designs: { type: 'object' },
        driftCheck: { type: 'object' },
        panelZoneDesigns: { type: 'array' },
        seismicDetails: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'steel-design', 'moment-frames']
}));

// Task 6: Connection Design
export const connectionDesignTask = defineTask('connection-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design steel connections',
  agent: {
    name: 'structural-steel-designer',
    prompt: {
      role: 'structural connection engineer',
      task: 'Design steel connections per AISC 360',
      context: args,
      instructions: [
        'Design shear connections (single plate, double angle, shear tab)',
        'Design moment connections (directly welded, end plate, bolted flange plate)',
        'Design brace connections and gusset plates',
        'Check bolt shear, bearing, and tension',
        'Check weld sizes and strengths',
        'Check block shear and rupture',
        'Design column splices',
        'Design beam-to-girder connections',
        'Create connection details and schedules'
      ],
      outputFormat: 'JSON with connection designs, calculations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['connectionCount', 'connections', 'artifacts'],
      properties: {
        connectionCount: { type: 'number' },
        connections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              capacity: { type: 'number' },
              demand: { type: 'number' }
            }
          }
        },
        connectionSchedule: { type: 'array' },
        standardConnections: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'steel-design', 'connections']
}));

// Task 7: Steel Detailing
export const steelDetailingTask = defineTask('steel-detailing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate steel details',
  agent: {
    name: 'structural-steel-designer',
    prompt: {
      role: 'steel detailer',
      task: 'Generate steel fabrication and erection details',
      context: args,
      instructions: [
        'Create framing plans with member marks',
        'Create beam and column details',
        'Create connection details',
        'Create bracing and gusset details',
        'Dimension all elements and connections',
        'Show bolt and weld symbols per AWS',
        'Create erection drawings',
        'Create piece marks and assembly marks',
        'Generate detail sheets'
      ],
      outputFormat: 'JSON with details, drawings list, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['details', 'artifacts'],
      properties: {
        details: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              detailNumber: { type: 'string' },
              description: { type: 'string' },
              scale: { type: 'string' }
            }
          }
        },
        framingPlans: { type: 'array' },
        connectionDetails: { type: 'array' },
        erectionDrawings: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'steel-design', 'detailing']
}));

// Task 8: Material Takeoff
export const materialTakeoffTask = defineTask('material-takeoff', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate material takeoff',
  agent: {
    name: 'cost-estimator',
    prompt: {
      role: 'steel estimator',
      task: 'Generate steel material takeoff',
      context: args,
      instructions: [
        'List all structural steel members by type and size',
        'Calculate member weights by section',
        'Tabulate connection materials (bolts, welds)',
        'Calculate plate material quantities',
        'Include miscellaneous steel (angles, channels)',
        'Calculate total tonnage',
        'Organize by floor and area',
        'Generate material summary report',
        'Include waste and erection allowances'
      ],
      outputFormat: 'JSON with quantities, weights, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['quantities', 'totalWeight', 'artifacts'],
      properties: {
        quantities: {
          type: 'object',
          properties: {
            beams: { type: 'object' },
            columns: { type: 'object' },
            bracing: { type: 'object' },
            plates: { type: 'object' },
            connections: { type: 'object' }
          }
        },
        totalWeight: { type: 'number' },
        weightByFloor: { type: 'object' },
        boltQuantities: { type: 'object' },
        weldQuantities: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'steel-design', 'takeoff']
}));
