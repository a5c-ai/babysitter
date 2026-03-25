/**
 * @process civil-engineering/reinforced-concrete-design
 * @description Design of reinforced concrete structural elements per ACI 318 including beams, columns, slabs, walls, and foundations
 * @inputs { projectId: string, loadAnalysis: object, structuralLayout: object, concreteStrength: number, steelGrade: string }
 * @outputs { success: boolean, designCalculations: object, reinforcementSchedules: array, structuralDrawings: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    loadAnalysis,
    structuralLayout,
    concreteStrength = 4000,
    steelGrade = 'Grade 60',
    exposureClass = 'C1',
    designCode = 'ACI318-19',
    outputDir = 'rc-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Design Criteria and Material Properties
  ctx.log('info', 'Starting reinforced concrete design: Establishing design criteria');
  const designCriteria = await ctx.task(designCriteriaTask, {
    projectId,
    concreteStrength,
    steelGrade,
    exposureClass,
    designCode,
    outputDir
  });

  if (!designCriteria.success) {
    return {
      success: false,
      error: 'Design criteria establishment failed',
      details: designCriteria,
      metadata: { processId: 'civil-engineering/reinforced-concrete-design', timestamp: startTime }
    };
  }

  artifacts.push(...designCriteria.artifacts);

  // Task 2: Beam Design
  ctx.log('info', 'Designing reinforced concrete beams');
  const beamDesign = await ctx.task(beamDesignTask, {
    projectId,
    loadAnalysis,
    structuralLayout,
    designCriteria,
    outputDir
  });

  artifacts.push(...beamDesign.artifacts);

  // Task 3: Column Design
  ctx.log('info', 'Designing reinforced concrete columns');
  const columnDesign = await ctx.task(columnDesignTask, {
    projectId,
    loadAnalysis,
    structuralLayout,
    designCriteria,
    outputDir
  });

  artifacts.push(...columnDesign.artifacts);

  // Task 4: Slab Design
  ctx.log('info', 'Designing reinforced concrete slabs');
  const slabDesign = await ctx.task(slabDesignTask, {
    projectId,
    loadAnalysis,
    structuralLayout,
    designCriteria,
    outputDir
  });

  artifacts.push(...slabDesign.artifacts);

  // Task 5: Shear Wall Design
  ctx.log('info', 'Designing reinforced concrete shear walls');
  const shearWallDesign = await ctx.task(shearWallDesignTask, {
    projectId,
    loadAnalysis,
    structuralLayout,
    designCriteria,
    outputDir
  });

  artifacts.push(...shearWallDesign.artifacts);

  // Task 6: Foundation Design
  ctx.log('info', 'Designing reinforced concrete foundations');
  const foundationDesign = await ctx.task(foundationDesignTask, {
    projectId,
    loadAnalysis,
    structuralLayout,
    designCriteria,
    outputDir
  });

  artifacts.push(...foundationDesign.artifacts);

  // Task 7: Detailing and Development Lengths
  ctx.log('info', 'Developing reinforcement details');
  const detailing = await ctx.task(detailingTask, {
    projectId,
    beamDesign,
    columnDesign,
    slabDesign,
    shearWallDesign,
    foundationDesign,
    designCriteria,
    outputDir
  });

  artifacts.push(...detailing.artifacts);

  // Breakpoint: Review concrete design
  await ctx.breakpoint({
    question: `Reinforced concrete design complete for ${projectId}. Review design calculations and reinforcement schedules?`,
    title: 'Reinforced Concrete Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        beamsDesigned: beamDesign.beamCount,
        columnsDesigned: columnDesign.columnCount,
        slabArea: slabDesign.totalArea,
        foundationType: foundationDesign.foundationType,
        totalConcreteVolume: beamDesign.concreteVolume + columnDesign.concreteVolume + slabDesign.concreteVolume,
        totalReinforcementWeight: detailing.totalReinforcementWeight
      }
    }
  });

  // Task 8: Reinforcement Schedules
  ctx.log('info', 'Generating reinforcement schedules');
  const reinforcementSchedules = await ctx.task(reinforcementSchedulesTask, {
    projectId,
    beamDesign,
    columnDesign,
    slabDesign,
    shearWallDesign,
    foundationDesign,
    detailing,
    outputDir
  });

  artifacts.push(...reinforcementSchedules.artifacts);

  // Task 9: Structural Drawings
  ctx.log('info', 'Generating structural drawings');
  const structuralDrawings = await ctx.task(structuralDrawingsTask, {
    projectId,
    beamDesign,
    columnDesign,
    slabDesign,
    shearWallDesign,
    foundationDesign,
    detailing,
    reinforcementSchedules,
    outputDir
  });

  artifacts.push(...structuralDrawings.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    designCalculations: {
      beams: beamDesign.calculations,
      columns: columnDesign.calculations,
      slabs: slabDesign.calculations,
      shearWalls: shearWallDesign.calculations,
      foundations: foundationDesign.calculations
    },
    reinforcementSchedules: reinforcementSchedules.schedules,
    structuralDrawings: structuralDrawings.drawings,
    materialQuantities: {
      concreteVolume: beamDesign.concreteVolume + columnDesign.concreteVolume + slabDesign.concreteVolume + foundationDesign.concreteVolume,
      reinforcementWeight: detailing.totalReinforcementWeight
    },
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/reinforced-concrete-design',
      timestamp: startTime,
      projectId,
      designCode,
      outputDir
    }
  };
}

// Task 1: Design Criteria and Material Properties
export const designCriteriaTask = defineTask('design-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish design criteria and material properties',
  agent: {
    name: 'reinforced-concrete-designer',
    prompt: {
      role: 'senior structural engineer',
      task: 'Establish design criteria per ACI 318',
      context: args,
      instructions: [
        'Define concrete compressive strength (fc\')',
        'Define reinforcement yield strength (fy)',
        'Determine exposure class and durability requirements',
        'Calculate concrete modulus of elasticity',
        'Determine cover requirements based on exposure',
        'Define strength reduction factors (phi factors)',
        'Document material specifications',
        'Establish deflection and crack width limits'
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
            fcPrime: { type: 'number' },
            fy: { type: 'number' },
            Es: { type: 'number' },
            Ec: { type: 'number' },
            n: { type: 'number' }
          }
        },
        coverRequirements: { type: 'object' },
        strengthReductionFactors: { type: 'object' },
        serviceabilityLimits: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'rc-design', 'criteria']
}));

// Task 2: Beam Design
export const beamDesignTask = defineTask('beam-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design reinforced concrete beams',
  agent: {
    name: 'reinforced-concrete-designer',
    prompt: {
      role: 'structural engineer',
      task: 'Design reinforced concrete beams per ACI 318',
      context: args,
      instructions: [
        'Determine beam sizes based on span and loading',
        'Calculate factored moments and shears',
        'Design flexural reinforcement (As required)',
        'Check minimum and maximum reinforcement ratios',
        'Design shear reinforcement (stirrups)',
        'Check torsion requirements where applicable',
        'Check deflection serviceability',
        'Check crack width control',
        'Design for construction joints'
      ],
      outputFormat: 'JSON with beam designs, calculations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['beamCount', 'calculations', 'concreteVolume', 'artifacts'],
      properties: {
        beamCount: { type: 'number' },
        calculations: { type: 'object' },
        beamSchedule: { type: 'array' },
        concreteVolume: { type: 'number' },
        reinforcementWeight: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'rc-design', 'beams']
}));

// Task 3: Column Design
export const columnDesignTask = defineTask('column-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design reinforced concrete columns',
  agent: {
    name: 'reinforced-concrete-designer',
    prompt: {
      role: 'structural engineer',
      task: 'Design reinforced concrete columns per ACI 318',
      context: args,
      instructions: [
        'Determine column sizes and layout',
        'Calculate factored axial loads and moments',
        'Develop P-M interaction diagrams',
        'Design longitudinal reinforcement',
        'Check slenderness effects (second-order analysis)',
        'Design transverse reinforcement (ties or spirals)',
        'Check special seismic detailing if required',
        'Design column-beam joints',
        'Generate column schedules'
      ],
      outputFormat: 'JSON with column designs, interaction diagrams, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['columnCount', 'calculations', 'concreteVolume', 'artifacts'],
      properties: {
        columnCount: { type: 'number' },
        calculations: { type: 'object' },
        columnSchedule: { type: 'array' },
        interactionDiagrams: { type: 'array' },
        concreteVolume: { type: 'number' },
        reinforcementWeight: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'rc-design', 'columns']
}));

// Task 4: Slab Design
export const slabDesignTask = defineTask('slab-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design reinforced concrete slabs',
  agent: {
    name: 'reinforced-concrete-designer',
    prompt: {
      role: 'structural engineer',
      task: 'Design reinforced concrete slabs per ACI 318',
      context: args,
      instructions: [
        'Determine slab system type (one-way, two-way, flat plate, etc.)',
        'Check minimum thickness for deflection control',
        'Calculate factored moments using appropriate method',
        'Design flexural reinforcement in both directions',
        'Check punching shear at columns',
        'Design shear reinforcement if required',
        'Design for openings and concentrated loads',
        'Determine construction joint locations',
        'Generate slab reinforcement plans'
      ],
      outputFormat: 'JSON with slab designs, calculations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalArea', 'calculations', 'concreteVolume', 'artifacts'],
      properties: {
        totalArea: { type: 'number' },
        slabType: { type: 'string' },
        calculations: { type: 'object' },
        slabThickness: { type: 'number' },
        punchingShearChecks: { type: 'object' },
        concreteVolume: { type: 'number' },
        reinforcementWeight: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'rc-design', 'slabs']
}));

// Task 5: Shear Wall Design
export const shearWallDesignTask = defineTask('shear-wall-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design reinforced concrete shear walls',
  agent: {
    name: 'seismic-design-specialist',
    prompt: {
      role: 'structural engineer',
      task: 'Design reinforced concrete shear walls per ACI 318',
      context: args,
      instructions: [
        'Determine shear wall layout and dimensions',
        'Calculate in-plane shear demands',
        'Design horizontal (shear) reinforcement',
        'Design vertical (flexural) reinforcement',
        'Check combined axial, shear, and flexure',
        'Design boundary elements where required',
        'Check wall slenderness and stability',
        'Design wall-to-floor connections',
        'Check seismic detailing requirements'
      ],
      outputFormat: 'JSON with shear wall designs, calculations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['wallCount', 'calculations', 'artifacts'],
      properties: {
        wallCount: { type: 'number' },
        calculations: { type: 'object' },
        wallSchedule: { type: 'array' },
        boundaryElements: { type: 'array' },
        concreteVolume: { type: 'number' },
        reinforcementWeight: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'rc-design', 'shear-walls']
}));

// Task 6: Foundation Design
export const foundationDesignTask = defineTask('foundation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design reinforced concrete foundations',
  agent: {
    name: 'foundation-engineer',
    prompt: {
      role: 'structural engineer',
      task: 'Design reinforced concrete foundations per ACI 318',
      context: args,
      instructions: [
        'Determine foundation type based on soil and loads',
        'Calculate bearing pressures and foundation sizing',
        'Design spread footings (flexure and shear)',
        'Check one-way and two-way shear',
        'Design combined footings and mat foundations',
        'Design grade beams and tie beams',
        'Check development of column reinforcement',
        'Design pile caps where required',
        'Generate foundation plans and details'
      ],
      outputFormat: 'JSON with foundation designs, calculations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['foundationType', 'calculations', 'concreteVolume', 'artifacts'],
      properties: {
        foundationType: { type: 'string' },
        calculations: { type: 'object' },
        foundationSchedule: { type: 'array' },
        bearingCapacityChecks: { type: 'object' },
        concreteVolume: { type: 'number' },
        reinforcementWeight: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'rc-design', 'foundations']
}));

// Task 7: Detailing and Development Lengths
export const detailingTask = defineTask('detailing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop reinforcement details',
  agent: {
    name: 'reinforced-concrete-designer',
    prompt: {
      role: 'structural detailing engineer',
      task: 'Develop reinforcement details per ACI 318',
      context: args,
      instructions: [
        'Calculate development lengths for all bar sizes',
        'Design lap splices and mechanical splices',
        'Detail hooks and bends per ACI 318',
        'Design bar cutoffs and terminations',
        'Detail beam-column joints',
        'Detail wall-to-floor connections',
        'Specify bundled bar arrangements',
        'Check bar spacing and cover',
        'Create standard detail sheets'
      ],
      outputFormat: 'JSON with detailing requirements, development lengths, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalReinforcementWeight', 'developmentLengths', 'artifacts'],
      properties: {
        totalReinforcementWeight: { type: 'number' },
        developmentLengths: { type: 'object' },
        spliceDetails: { type: 'object' },
        standardDetails: { type: 'array' },
        barBendSchedule: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'rc-design', 'detailing']
}));

// Task 8: Reinforcement Schedules
export const reinforcementSchedulesTask = defineTask('reinforcement-schedules', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate reinforcement schedules',
  agent: {
    name: 'reinforced-concrete-designer',
    prompt: {
      role: 'structural detailing engineer',
      task: 'Generate comprehensive reinforcement schedules',
      context: args,
      instructions: [
        'Create beam reinforcement schedule',
        'Create column reinforcement schedule',
        'Create slab reinforcement schedule',
        'Create wall reinforcement schedule',
        'Create foundation reinforcement schedule',
        'Include bar marks, sizes, lengths, quantities',
        'Calculate total reinforcement quantities by size',
        'Generate bar bending schedules',
        'Create material takeoff summary'
      ],
      outputFormat: 'JSON with reinforcement schedules, quantities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schedules', 'artifacts'],
      properties: {
        schedules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              schedule: { type: 'array' }
            }
          }
        },
        barQuantities: { type: 'object' },
        totalWeight: { type: 'number' },
        barBendingSchedule: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'rc-design', 'schedules']
}));

// Task 9: Structural Drawings
export const structuralDrawingsTask = defineTask('structural-drawings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate structural drawings',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'structural CAD technician',
      task: 'Generate structural drawings for reinforced concrete',
      context: args,
      instructions: [
        'Create foundation plans with reinforcement',
        'Create floor framing plans',
        'Create slab reinforcement plans',
        'Create beam sections and elevations',
        'Create column schedules and sections',
        'Create wall elevations and sections',
        'Create structural details',
        'Include dimensions and annotations',
        'Generate drawing list and title sheet'
      ],
      outputFormat: 'JSON with drawing list, file paths, artifacts'
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
              drawingNumber: { type: 'string' },
              title: { type: 'string' },
              scale: { type: 'string' },
              path: { type: 'string' }
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
  labels: ['agent', 'civil-engineering', 'rc-design', 'drawings']
}));
