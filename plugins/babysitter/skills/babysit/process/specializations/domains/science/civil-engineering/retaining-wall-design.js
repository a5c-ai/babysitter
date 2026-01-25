/**
 * @process civil-engineering/retaining-wall-design
 * @description Design of earth retaining structures including gravity walls, cantilever walls, MSE walls, and soil nail walls
 * @inputs { projectId: string, wallType: string, retainedHeight: number, soilProperties: object, surchargeLoads: object }
 * @outputs { success: boolean, wallDesign: object, structuralDrawings: array, constructionSpecs: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    wallType,
    retainedHeight,
    soilProperties,
    surchargeLoads,
    groundwaterLevel,
    seismicCoefficient,
    designCode = 'AASHTO',
    outputDir = 'retaining-wall-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Wall Type Selection and Geometry
  ctx.log('info', 'Starting retaining wall design: Type selection and geometry');
  const wallGeometry = await ctx.task(wallGeometryTask, {
    projectId,
    wallType,
    retainedHeight,
    soilProperties,
    outputDir
  });

  if (!wallGeometry.success) {
    return {
      success: false,
      error: 'Wall geometry determination failed',
      details: wallGeometry,
      metadata: { processId: 'civil-engineering/retaining-wall-design', timestamp: startTime }
    };
  }

  artifacts.push(...wallGeometry.artifacts);

  // Task 2: Earth Pressure Analysis
  ctx.log('info', 'Calculating earth pressures');
  const earthPressures = await ctx.task(earthPressureTask, {
    projectId,
    wallGeometry,
    soilProperties,
    surchargeLoads,
    groundwaterLevel,
    seismicCoefficient,
    outputDir
  });

  artifacts.push(...earthPressures.artifacts);

  // Task 3: External Stability Analysis
  ctx.log('info', 'Performing external stability analysis');
  const externalStability = await ctx.task(externalStabilityTask, {
    projectId,
    wallGeometry,
    earthPressures,
    soilProperties,
    outputDir
  });

  artifacts.push(...externalStability.artifacts);

  // Task 4: Internal Stability / Structural Design
  ctx.log('info', 'Performing structural design');
  const structuralDesign = await ctx.task(structuralDesignTask, {
    projectId,
    wallType,
    wallGeometry,
    earthPressures,
    designCode,
    outputDir
  });

  artifacts.push(...structuralDesign.artifacts);

  // Task 5: Global Stability Check
  ctx.log('info', 'Checking global stability');
  const globalStability = await ctx.task(globalStabilityTask, {
    projectId,
    wallGeometry,
    soilProperties,
    earthPressures,
    outputDir
  });

  artifacts.push(...globalStability.artifacts);

  // Breakpoint: Review wall design
  await ctx.breakpoint({
    question: `Retaining wall design complete for ${projectId}. Wall type: ${wallType}, Height: ${retainedHeight}ft. Review design?`,
    title: 'Retaining Wall Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        wallType: wallType,
        retainedHeight: retainedHeight,
        slidingFOS: externalStability.slidingFOS,
        overturningFOS: externalStability.overturningFOS,
        bearingFOS: externalStability.bearingFOS,
        globalFOS: globalStability.factorOfSafety
      }
    }
  });

  // Task 6: Drainage Design
  ctx.log('info', 'Designing drainage system');
  const drainageDesign = await ctx.task(drainageDesignTask, {
    projectId,
    wallGeometry,
    groundwaterLevel,
    outputDir
  });

  artifacts.push(...drainageDesign.artifacts);

  // Task 7: Structural Drawings
  ctx.log('info', 'Generating structural drawings');
  const structuralDrawings = await ctx.task(wallDrawingsTask, {
    projectId,
    wallGeometry,
    structuralDesign,
    drainageDesign,
    outputDir
  });

  artifacts.push(...structuralDrawings.artifacts);

  // Task 8: Construction Specifications
  ctx.log('info', 'Developing construction specifications');
  const constructionSpecs = await ctx.task(wallSpecsTask, {
    projectId,
    wallType,
    wallGeometry,
    structuralDesign,
    drainageDesign,
    outputDir
  });

  artifacts.push(...constructionSpecs.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    wallDesign: {
      type: wallType,
      geometry: wallGeometry.geometry,
      earthPressures: earthPressures.pressures,
      externalStability: externalStability.results,
      structuralDesign: structuralDesign.design,
      globalStability: globalStability.results,
      drainage: drainageDesign.design
    },
    structuralDrawings: structuralDrawings.drawings,
    constructionSpecs: constructionSpecs.specifications,
    stabilityFactors: {
      sliding: externalStability.slidingFOS,
      overturning: externalStability.overturningFOS,
      bearing: externalStability.bearingFOS,
      global: globalStability.factorOfSafety
    },
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/retaining-wall-design',
      timestamp: startTime,
      projectId,
      designCode,
      outputDir
    }
  };
}

// Task 1: Wall Geometry
export const wallGeometryTask = defineTask('wall-geometry', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine wall geometry',
  agent: {
    name: 'retaining-structure-designer',
    prompt: {
      role: 'structural/geotechnical engineer',
      task: 'Define retaining wall geometry',
      context: args,
      instructions: [
        'Determine wall type based on height and conditions',
        'Establish wall cross-section dimensions',
        'Define base width and embedment depth',
        'Determine stem thickness and batter',
        'Define key dimensions if applicable',
        'Establish backfill geometry',
        'Document geometry assumptions',
        'Create preliminary wall section'
      ],
      outputFormat: 'JSON with wall geometry, dimensions, cross-section'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'geometry', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        geometry: {
          type: 'object',
          properties: {
            height: { type: 'number' },
            baseWidth: { type: 'number' },
            stemThickness: { type: 'number' },
            toeLength: { type: 'number' },
            heelLength: { type: 'number' },
            embedmentDepth: { type: 'number' }
          }
        },
        wallType: { type: 'string' },
        backfillSlope: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'retaining-wall', 'geometry']
}));

// Task 2: Earth Pressure Analysis
export const earthPressureTask = defineTask('earth-pressure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate earth pressures',
  agent: {
    name: 'retaining-structure-designer',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Calculate lateral earth pressures on wall',
      context: args,
      instructions: [
        'Calculate active earth pressure (Rankine or Coulomb)',
        'Calculate passive earth pressure at toe',
        'Include surcharge pressure effects',
        'Include hydrostatic pressure if applicable',
        'Calculate seismic earth pressure increment',
        'Determine pressure distribution diagram',
        'Calculate resultant forces and locations',
        'Document calculation method and assumptions'
      ],
      outputFormat: 'JSON with earth pressures, resultant forces'
    },
    outputSchema: {
      type: 'object',
      required: ['pressures', 'artifacts'],
      properties: {
        pressures: {
          type: 'object',
          properties: {
            activePressure: { type: 'number' },
            passivePressure: { type: 'number' },
            surchargePressure: { type: 'number' },
            seismicIncrement: { type: 'number' }
          }
        },
        Ka: { type: 'number' },
        Kp: { type: 'number' },
        resultantForce: { type: 'number' },
        pointOfApplication: { type: 'number' },
        pressureDiagram: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'retaining-wall', 'earth-pressure']
}));

// Task 3: External Stability Analysis
export const externalStabilityTask = defineTask('external-stability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform external stability analysis',
  agent: {
    name: 'retaining-structure-designer',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Check external stability of retaining wall',
      context: args,
      instructions: [
        'Check sliding stability (FOS >= 1.5)',
        'Check overturning stability (FOS >= 2.0)',
        'Check bearing capacity (FOS >= 2.5)',
        'Calculate eccentricity of base reaction',
        'Verify middle-third rule for soil foundations',
        'Check seismic load cases',
        'Identify controlling stability mode',
        'Revise geometry if needed'
      ],
      outputFormat: 'JSON with stability factors, controlling case'
    },
    outputSchema: {
      type: 'object',
      required: ['slidingFOS', 'overturningFOS', 'bearingFOS', 'results', 'artifacts'],
      properties: {
        slidingFOS: { type: 'number' },
        overturningFOS: { type: 'number' },
        bearingFOS: { type: 'number' },
        eccentricity: { type: 'number' },
        baseReaction: { type: 'object' },
        results: { type: 'object' },
        controllingCase: { type: 'string' },
        adequate: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'retaining-wall', 'external-stability']
}));

// Task 4: Structural Design
export const structuralDesignTask = defineTask('structural-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform structural design',
  agent: {
    name: 'reinforced-concrete-designer',
    prompt: {
      role: 'structural engineer',
      task: 'Design wall structural elements',
      context: args,
      instructions: [
        'Design stem for flexure and shear',
        'Design toe for flexure and shear',
        'Design heel for flexure and shear',
        'Design reinforcement for all elements',
        'Check concrete stresses',
        'Design construction joints',
        'Design expansion joints',
        'Create reinforcement details'
      ],
      outputFormat: 'JSON with structural design, reinforcement'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        stemDesign: {
          type: 'object',
          properties: {
            thickness: { type: 'number' },
            reinforcement: { type: 'string' },
            momentCapacity: { type: 'number' }
          }
        },
        footingDesign: { type: 'object' },
        reinforcementSchedule: { type: 'array' },
        concreteQuantity: { type: 'number' },
        steelQuantity: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'retaining-wall', 'structural']
}));

// Task 5: Global Stability Check
export const globalStabilityTask = defineTask('global-stability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check global stability',
  agent: {
    name: 'retaining-structure-designer',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Perform global slope stability analysis',
      context: args,
      instructions: [
        'Analyze deep-seated failure surfaces',
        'Include wall weight in analysis',
        'Analyze surfaces through and below wall',
        'Calculate factor of safety for global stability',
        'Check for weak foundation layers',
        'Recommend ground improvement if needed',
        'Document analysis method',
        'Identify critical global surface'
      ],
      outputFormat: 'JSON with global FOS, critical surface'
    },
    outputSchema: {
      type: 'object',
      required: ['factorOfSafety', 'results', 'artifacts'],
      properties: {
        factorOfSafety: { type: 'number' },
        results: { type: 'object' },
        criticalSurface: { type: 'object' },
        adequate: { type: 'boolean' },
        groundImprovementNeeded: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'retaining-wall', 'global-stability']
}));

// Task 6: Drainage Design
export const drainageDesignTask = defineTask('drainage-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design drainage system',
  agent: {
    name: 'retaining-structure-designer',
    prompt: {
      role: 'civil engineer',
      task: 'Design wall drainage system',
      context: args,
      instructions: [
        'Design filter drain behind wall',
        'Specify drain aggregate gradation',
        'Design weep holes',
        'Design perforated drain pipe',
        'Design drain outlet',
        'Specify geotextile filter fabric',
        'Design surface drainage',
        'Create drainage details'
      ],
      outputFormat: 'JSON with drainage design, details'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        drainType: { type: 'string' },
        filterRequirements: { type: 'object' },
        weepHoleSpacing: { type: 'number' },
        drainPipeSize: { type: 'number' },
        outletDesign: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'retaining-wall', 'drainage']
}));

// Task 7: Wall Drawings
export const wallDrawingsTask = defineTask('wall-drawings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate structural drawings',
  agent: {
    name: 'structural-drafter',
    prompt: {
      role: 'structural CAD technician',
      task: 'Generate retaining wall drawings',
      context: args,
      instructions: [
        'Create wall plan view',
        'Create typical wall section',
        'Create wall elevations',
        'Detail reinforcement',
        'Detail drainage system',
        'Detail expansion and control joints',
        'Include notes and specifications',
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
              drawingNumber: { type: 'string' },
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
  labels: ['agent', 'civil-engineering', 'retaining-wall', 'drawings']
}));

// Task 8: Construction Specifications
export const wallSpecsTask = defineTask('wall-specifications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop construction specifications',
  agent: {
    name: 'specifications-writer',
    prompt: {
      role: 'construction specifications writer',
      task: 'Develop retaining wall construction specifications',
      context: args,
      instructions: [
        'Specify excavation requirements',
        'Specify foundation preparation',
        'Specify concrete materials and placement',
        'Specify reinforcement requirements',
        'Specify backfill materials and compaction',
        'Specify drainage installation',
        'Define quality control requirements',
        'Reference applicable standards'
      ],
      outputFormat: 'JSON with specification sections'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications', 'artifacts'],
      properties: {
        specifications: { type: 'object' },
        excavationSpecs: { type: 'object' },
        concreteSpecs: { type: 'object' },
        backfillSpecs: { type: 'object' },
        drainageSpecs: { type: 'object' },
        qcRequirements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'retaining-wall', 'specifications']
}));
