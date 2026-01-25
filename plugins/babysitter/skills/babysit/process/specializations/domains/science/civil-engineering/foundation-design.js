/**
 * @process civil-engineering/foundation-design
 * @description Design of shallow and deep foundation systems including spread footings, mat foundations, driven piles, and drilled shafts
 * @inputs { projectId: string, geotechnicalReport: object, structuralLoads: object, foundationType: string }
 * @outputs { success: boolean, foundationDesign: object, foundationPlans: array, pileSpecifications: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    geotechnicalReport,
    structuralLoads,
    foundationType = 'shallow',
    soilConditions,
    groundwaterLevel,
    designCode = 'ACI318-19',
    outputDir = 'foundation-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Foundation Type Selection
  ctx.log('info', 'Starting foundation design: Type selection and analysis');
  const foundationSelection = await ctx.task(foundationSelectionTask, {
    projectId,
    geotechnicalReport,
    structuralLoads,
    foundationType,
    outputDir
  });

  if (!foundationSelection.success) {
    return {
      success: false,
      error: 'Foundation type selection failed',
      details: foundationSelection,
      metadata: { processId: 'civil-engineering/foundation-design', timestamp: startTime }
    };
  }

  artifacts.push(...foundationSelection.artifacts);

  // Task 2: Bearing Capacity Analysis
  ctx.log('info', 'Performing bearing capacity analysis');
  const bearingAnalysis = await ctx.task(bearingCapacityTask, {
    projectId,
    geotechnicalReport,
    foundationSelection,
    groundwaterLevel,
    outputDir
  });

  artifacts.push(...bearingAnalysis.artifacts);

  // Task 3: Settlement Analysis
  ctx.log('info', 'Performing settlement analysis');
  const settlementAnalysis = await ctx.task(settlementAnalysisTask, {
    projectId,
    geotechnicalReport,
    structuralLoads,
    foundationSelection,
    outputDir
  });

  artifacts.push(...settlementAnalysis.artifacts);

  // Branch based on foundation type
  let shallowFoundationDesign = null;
  let deepFoundationDesign = null;

  if (foundationSelection.selectedType === 'shallow' || foundationSelection.selectedType === 'mat') {
    // Task 4a: Shallow Foundation Design
    ctx.log('info', 'Designing shallow foundations');
    shallowFoundationDesign = await ctx.task(shallowFoundationTask, {
      projectId,
      structuralLoads,
      bearingAnalysis,
      settlementAnalysis,
      designCode,
      outputDir
    });

    artifacts.push(...shallowFoundationDesign.artifacts);
  } else {
    // Task 4b: Deep Foundation Design
    ctx.log('info', 'Designing deep foundations');
    deepFoundationDesign = await ctx.task(deepFoundationTask, {
      projectId,
      geotechnicalReport,
      structuralLoads,
      foundationSelection,
      outputDir
    });

    artifacts.push(...deepFoundationDesign.artifacts);
  }

  // Breakpoint: Review foundation design
  await ctx.breakpoint({
    question: `Foundation design complete for ${projectId}. Type: ${foundationSelection.selectedType}. Review design calculations?`,
    title: 'Foundation Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        foundationType: foundationSelection.selectedType,
        allowableBearing: bearingAnalysis.allowableBearing,
        estimatedSettlement: settlementAnalysis.totalSettlement,
        foundationCount: shallowFoundationDesign?.footingCount || deepFoundationDesign?.pileCount
      }
    }
  });

  // Task 5: Pile Cap Design (if deep foundations)
  let pileCapDesign = null;
  if (deepFoundationDesign) {
    ctx.log('info', 'Designing pile caps');
    pileCapDesign = await ctx.task(pileCapDesignTask, {
      projectId,
      deepFoundationDesign,
      structuralLoads,
      designCode,
      outputDir
    });

    artifacts.push(...pileCapDesign.artifacts);
  }

  // Task 6: Grade Beam Design
  ctx.log('info', 'Designing grade beams');
  const gradeBeamDesign = await ctx.task(gradeBeamDesignTask, {
    projectId,
    foundationSelection,
    shallowFoundationDesign,
    deepFoundationDesign,
    designCode,
    outputDir
  });

  artifacts.push(...gradeBeamDesign.artifacts);

  // Task 7: Foundation Plans
  ctx.log('info', 'Generating foundation plans');
  const foundationPlans = await ctx.task(foundationPlansTask, {
    projectId,
    foundationSelection,
    shallowFoundationDesign,
    deepFoundationDesign,
    pileCapDesign,
    gradeBeamDesign,
    outputDir
  });

  artifacts.push(...foundationPlans.artifacts);

  // Task 8: Foundation Specifications
  ctx.log('info', 'Developing foundation specifications');
  const foundationSpecs = await ctx.task(foundationSpecsTask, {
    projectId,
    foundationSelection,
    shallowFoundationDesign,
    deepFoundationDesign,
    outputDir
  });

  artifacts.push(...foundationSpecs.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    foundationDesign: {
      type: foundationSelection.selectedType,
      bearingCapacity: bearingAnalysis.allowableBearing,
      estimatedSettlement: settlementAnalysis.totalSettlement,
      shallowFoundations: shallowFoundationDesign?.designs,
      deepFoundations: deepFoundationDesign?.designs,
      pileCaps: pileCapDesign?.designs,
      gradeBeams: gradeBeamDesign.designs
    },
    foundationPlans: foundationPlans.plans,
    pileSpecifications: deepFoundationDesign?.specifications,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/foundation-design',
      timestamp: startTime,
      projectId,
      designCode,
      outputDir
    }
  };
}

// Task 1: Foundation Type Selection
export const foundationSelectionTask = defineTask('foundation-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select foundation type',
  skill: { name: 'bearing-capacity-calculator' },
  agent: {
    name: 'foundation-engineer',
    prompt: {
      role: 'senior geotechnical engineer',
      task: 'Evaluate and select appropriate foundation type',
      context: args,
      instructions: [
        'Review geotechnical recommendations',
        'Evaluate soil bearing capacity',
        'Consider structural load requirements',
        'Evaluate shallow foundation feasibility',
        'Evaluate deep foundation alternatives',
        'Consider groundwater and construction constraints',
        'Perform cost comparison',
        'Recommend optimal foundation type'
      ],
      outputFormat: 'JSON with foundation selection, rationale, alternatives'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'selectedType', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        selectedType: { type: 'string' },
        alternatives: { type: 'array' },
        selectionRationale: { type: 'string' },
        costComparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'foundation', 'selection']
}));

// Task 2: Bearing Capacity Analysis
export const bearingCapacityTask = defineTask('bearing-capacity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform bearing capacity analysis',
  skill: { name: 'bearing-capacity-calculator' },
  agent: {
    name: 'foundation-engineer',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Calculate bearing capacity for foundations',
      context: args,
      instructions: [
        'Calculate ultimate bearing capacity (Terzaghi, Meyerhof)',
        'Apply appropriate factors of safety',
        'Consider groundwater effects',
        'Account for eccentric and inclined loads',
        'Calculate bearing capacity for different footing sizes',
        'Consider layered soil conditions',
        'Develop bearing capacity charts',
        'Document all calculations and assumptions'
      ],
      outputFormat: 'JSON with bearing capacity values, calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['ultimateBearing', 'allowableBearing', 'artifacts'],
      properties: {
        ultimateBearing: { type: 'number' },
        allowableBearing: { type: 'number' },
        factorOfSafety: { type: 'number' },
        bearingParameters: { type: 'object' },
        groundwaterCorrection: { type: 'number' },
        bearingCharts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'foundation', 'bearing-capacity']
}));

// Task 3: Settlement Analysis
export const settlementAnalysisTask = defineTask('settlement-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform settlement analysis',
  skill: { name: 'settlement-calculator' },
  agent: {
    name: 'foundation-engineer',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Calculate foundation settlements',
      context: args,
      instructions: [
        'Calculate immediate settlement',
        'Calculate consolidation settlement',
        'Calculate secondary compression if applicable',
        'Estimate time rate of settlement',
        'Calculate differential settlements',
        'Check against allowable limits',
        'Consider structural tolerance',
        'Recommend settlement mitigation if needed'
      ],
      outputFormat: 'JSON with settlement components, total settlement, time rate'
    },
    outputSchema: {
      type: 'object',
      required: ['totalSettlement', 'artifacts'],
      properties: {
        immediateSettlement: { type: 'number' },
        consolidationSettlement: { type: 'number' },
        secondarySettlement: { type: 'number' },
        totalSettlement: { type: 'number' },
        differentialSettlement: { type: 'number' },
        timeToSettle: { type: 'number' },
        allowableSettlement: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'foundation', 'settlement']
}));

// Task 4a: Shallow Foundation Design
export const shallowFoundationTask = defineTask('shallow-foundation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design shallow foundations',
  skill: { name: 'concrete-design-calculator' },
  agent: {
    name: 'foundation-engineer',
    prompt: {
      role: 'structural engineer',
      task: 'Design shallow foundation elements',
      context: args,
      instructions: [
        'Size spread footings for column loads',
        'Design continuous footings for walls',
        'Design combined footings where needed',
        'Calculate footing reinforcement (flexure)',
        'Check one-way and two-way shear',
        'Check development length at column',
        'Design mat foundation if selected',
        'Create footing schedule and details'
      ],
      outputFormat: 'JSON with footing designs, sizes, reinforcement'
    },
    outputSchema: {
      type: 'object',
      required: ['footingCount', 'designs', 'artifacts'],
      properties: {
        footingCount: { type: 'number' },
        designs: { type: 'object' },
        footingSchedule: { type: 'array' },
        reinforcementDetails: { type: 'object' },
        concreteVolume: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'foundation', 'shallow']
}));

// Task 4b: Deep Foundation Design
export const deepFoundationTask = defineTask('deep-foundation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design deep foundations',
  skill: { name: 'pile-capacity-analyzer' },
  agent: {
    name: 'foundation-engineer',
    prompt: {
      role: 'geotechnical/structural engineer',
      task: 'Design deep foundation elements',
      context: args,
      instructions: [
        'Select pile or drilled shaft type',
        'Calculate axial capacity (skin friction + end bearing)',
        'Determine pile length requirements',
        'Calculate lateral capacity if needed',
        'Determine number of piles per group',
        'Consider group effects',
        'Specify installation method',
        'Create pile layout and schedule'
      ],
      outputFormat: 'JSON with pile designs, capacities, specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['pileCount', 'designs', 'specifications', 'artifacts'],
      properties: {
        pileType: { type: 'string' },
        pileCount: { type: 'number' },
        designs: { type: 'object' },
        axialCapacity: { type: 'number' },
        lateralCapacity: { type: 'number' },
        pileLength: { type: 'number' },
        specifications: { type: 'object' },
        pileSchedule: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'foundation', 'deep']
}));

// Task 5: Pile Cap Design
export const pileCapDesignTask = defineTask('pile-cap-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design pile caps',
  skill: { name: 'concrete-design-calculator' },
  agent: {
    name: 'foundation-engineer',
    prompt: {
      role: 'structural engineer',
      task: 'Design pile caps per ACI 318',
      context: args,
      instructions: [
        'Determine pile cap geometry',
        'Calculate pile cap thickness',
        'Design for flexure in both directions',
        'Check one-way shear',
        'Check two-way (punching) shear at column',
        'Check pile embedment',
        'Design reinforcement',
        'Create pile cap details'
      ],
      outputFormat: 'JSON with pile cap designs, details'
    },
    outputSchema: {
      type: 'object',
      required: ['designs', 'artifacts'],
      properties: {
        designs: { type: 'object' },
        pileCapSchedule: { type: 'array' },
        reinforcementDetails: { type: 'object' },
        concreteVolume: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'foundation', 'pile-caps']
}));

// Task 6: Grade Beam Design
export const gradeBeamDesignTask = defineTask('grade-beam-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design grade beams',
  skill: { name: 'concrete-design-calculator' },
  agent: {
    name: 'reinforced-concrete-designer',
    prompt: {
      role: 'structural engineer',
      task: 'Design grade beams and tie beams',
      context: args,
      instructions: [
        'Determine grade beam layout',
        'Size grade beams for loads and spans',
        'Design flexural reinforcement',
        'Design shear reinforcement',
        'Connect to pile caps or footings',
        'Design for soil pressure if applicable',
        'Create grade beam schedule',
        'Detail connections'
      ],
      outputFormat: 'JSON with grade beam designs, details'
    },
    outputSchema: {
      type: 'object',
      required: ['designs', 'artifacts'],
      properties: {
        designs: { type: 'object' },
        gradeBeamSchedule: { type: 'array' },
        reinforcementDetails: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'foundation', 'grade-beams']
}));

// Task 7: Foundation Plans
export const foundationPlansTask = defineTask('foundation-plans', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate foundation plans',
  skill: { name: 'revit-api-interface' },
  agent: {
    name: 'structural-drafter',
    prompt: {
      role: 'structural CAD technician',
      task: 'Generate foundation plan drawings',
      context: args,
      instructions: [
        'Create foundation layout plan',
        'Show footing or pile locations',
        'Show grade beam layout',
        'Dimension all elements',
        'Create foundation sections',
        'Show reinforcement details',
        'Include notes and specifications',
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
  labels: ['agent', 'civil-engineering', 'foundation', 'drawings']
}));

// Task 8: Foundation Specifications
export const foundationSpecsTask = defineTask('foundation-specifications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop foundation specifications',
  skill: { name: 'csi-specification-writer' },
  agent: {
    name: 'specifications-writer',
    prompt: {
      role: 'construction specifications writer',
      task: 'Develop foundation construction specifications',
      context: args,
      instructions: [
        'Specify concrete materials and strengths',
        'Specify reinforcement requirements',
        'Define excavation and backfill requirements',
        'Specify pile driving or drilling requirements',
        'Define inspection and testing requirements',
        'Specify tolerances',
        'Include quality control requirements',
        'Reference applicable standards'
      ],
      outputFormat: 'JSON with specification sections'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications', 'artifacts'],
      properties: {
        specifications: { type: 'object' },
        concreteSpecs: { type: 'object' },
        reinforcementSpecs: { type: 'object' },
        pileSpecs: { type: 'object' },
        inspectionRequirements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'foundation', 'specifications']
}));
