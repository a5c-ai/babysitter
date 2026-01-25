/**
 * @process chemical-engineering/crystallization-process-design
 * @description Design crystallization and precipitation systems for product purification and solid-liquid separation
 * @inputs { processName: string, soluteProperties: object, solventSystem: object, productRequirements: object, outputDir: string }
 * @outputs { success: boolean, crystallizerDesign: object, operatingProcedure: object, downstreamDesign: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    soluteProperties,
    solventSystem,
    productRequirements,
    crystallizationMethod = 'cooling',
    outputDir = 'crystallization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Characterize Solubility and Metastable Zone
  ctx.log('info', 'Starting crystallization design: Characterizing solubility');
  const solubilityResult = await ctx.task(solubilityCharacterizationTask, {
    processName,
    soluteProperties,
    solventSystem,
    outputDir
  });

  if (!solubilityResult.success) {
    return {
      success: false,
      error: 'Solubility characterization failed',
      details: solubilityResult,
      metadata: { processId: 'chemical-engineering/crystallization-process-design', timestamp: startTime }
    };
  }

  artifacts.push(...solubilityResult.artifacts);

  // Task 2: Select Crystallization Method
  ctx.log('info', 'Selecting crystallization method');
  const methodSelectionResult = await ctx.task(crystallizationMethodTask, {
    processName,
    solubilityData: solubilityResult.data,
    productRequirements,
    crystallizationMethod,
    outputDir
  });

  artifacts.push(...methodSelectionResult.artifacts);

  // Task 3: Design Crystallizer Equipment
  ctx.log('info', 'Designing crystallizer equipment');
  const crystallizerDesignResult = await ctx.task(crystallizerDesignTask, {
    processName,
    method: methodSelectionResult.method,
    solubilityData: solubilityResult.data,
    productRequirements,
    outputDir
  });

  artifacts.push(...crystallizerDesignResult.artifacts);

  // Task 4: Control Crystal Size Distribution
  ctx.log('info', 'Designing crystal size distribution control');
  const csdControlResult = await ctx.task(csdControlTask, {
    processName,
    crystallizerDesign: crystallizerDesignResult.design,
    productRequirements,
    method: methodSelectionResult.method,
    outputDir
  });

  artifacts.push(...csdControlResult.artifacts);

  // Task 5: Design Solid-Liquid Separation
  ctx.log('info', 'Designing solid-liquid separation');
  const separationResult = await ctx.task(solidLiquidSeparationTask, {
    processName,
    crystalProperties: csdControlResult.expectedCSD,
    productRequirements,
    outputDir
  });

  artifacts.push(...separationResult.artifacts);

  // Breakpoint: Review crystallization design
  await ctx.breakpoint({
    question: `Crystallization design complete for ${processName}. Method: ${methodSelectionResult.method.type}. Yield: ${crystallizerDesignResult.design.expectedYield}%. Mean crystal size: ${csdControlResult.expectedCSD.meanSize} um. Review design?`,
    title: 'Crystallization Process Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        method: methodSelectionResult.method.type,
        crystallizerType: crystallizerDesignResult.design.type,
        expectedYield: crystallizerDesignResult.design.expectedYield,
        meanCrystalSize: csdControlResult.expectedCSD.meanSize,
        separationMethod: separationResult.design.method
      }
    }
  });

  // Task 6: Address Polymorphism and Purity
  ctx.log('info', 'Addressing polymorphism and purity requirements');
  const polymorphismResult = await ctx.task(polymorphismPurityTask, {
    processName,
    soluteProperties,
    crystallizerDesign: crystallizerDesignResult.design,
    productRequirements,
    outputDir
  });

  artifacts.push(...polymorphismResult.artifacts);

  // Task 7: Develop Operating Procedure
  ctx.log('info', 'Developing operating procedure');
  const procedureResult = await ctx.task(operatingProcedureTask, {
    processName,
    crystallizerDesign: crystallizerDesignResult.design,
    csdControl: csdControlResult,
    polymorphismControl: polymorphismResult.controls,
    outputDir
  });

  artifacts.push(...procedureResult.artifacts);

  // Task 8: Create Validation Plan
  ctx.log('info', 'Creating product purity validation plan');
  const validationResult = await ctx.task(validationPlanTask, {
    processName,
    productRequirements,
    crystallizerDesign: crystallizerDesignResult.design,
    expectedCSD: csdControlResult.expectedCSD,
    outputDir
  });

  artifacts.push(...validationResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    crystallizerDesign: crystallizerDesignResult.design,
    operatingProcedure: procedureResult.procedure,
    downstreamDesign: separationResult.design,
    csdControl: csdControlResult,
    validationPlan: validationResult.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/crystallization-process-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Solubility Characterization
export const solubilityCharacterizationTask = defineTask('solubility-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize solubility and metastable zone',
  skill: { name: 'thermodynamic-model-selector' },
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'crystallization scientist',
      task: 'Characterize solubility and metastable zone width',
      context: args,
      instructions: [
        'Measure solubility curve vs. temperature',
        'Determine metastable zone width (MSZW)',
        'Characterize nucleation kinetics',
        'Measure induction times',
        'Assess solvent effects on solubility',
        'Identify suitable supersaturation range',
        'Create phase diagram',
        'Document solubility data'
      ],
      outputFormat: 'JSON with solubility data, MSZW, phase diagram, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'data', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            solubilityCurve: { type: 'array' },
            metastableZoneWidth: { type: 'number' },
            nucleationKinetics: { type: 'object' },
            phaseDiagramPath: { type: 'string' }
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
  labels: ['agent', 'chemical-engineering', 'crystallization', 'solubility']
}));

// Task 2: Crystallization Method Selection
export const crystallizationMethodTask = defineTask('crystallization-method', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select crystallization method',
  skill: { name: 'crystallizer-designer' },
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'crystallization process engineer',
      task: 'Select optimal crystallization method',
      context: args,
      instructions: [
        'Evaluate cooling crystallization (steep solubility curve)',
        'Evaluate evaporative crystallization (flat solubility curve)',
        'Evaluate anti-solvent crystallization',
        'Evaluate reactive/precipitation crystallization',
        'Consider melt crystallization if applicable',
        'Assess batch vs. continuous operation',
        'Select method with rationale',
        'Document method selection'
      ],
      outputFormat: 'JSON with method selection, rationale, operating conditions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'method', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        method: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            mode: { type: 'string' },
            drivingForce: { type: 'string' }
          }
        },
        rationale: { type: 'string' },
        alternatives: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'crystallization', 'method-selection']
}));

// Task 3: Crystallizer Design
export const crystallizerDesignTask = defineTask('crystallizer-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design crystallizer equipment',
  skill: { name: 'crystallizer-designer' },
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'crystallizer design engineer',
      task: 'Design crystallizer equipment',
      context: args,
      instructions: [
        'Select crystallizer type (batch tank, DTB, Oslo, FC, etc.)',
        'Size crystallizer volume for required throughput',
        'Design cooling/heating system',
        'Design agitation system',
        'Specify materials of construction',
        'Calculate expected yield and residence time',
        'Design fines dissolution system if needed',
        'Document crystallizer design'
      ],
      outputFormat: 'JSON with crystallizer design, sizing, expected performance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'design', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        design: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            volume: { type: 'number' },
            agitatorType: { type: 'string' },
            coolingArea: { type: 'number' },
            expectedYield: { type: 'number' },
            residenceTime: { type: 'number' }
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
  labels: ['agent', 'chemical-engineering', 'crystallization', 'equipment-design']
}));

// Task 4: Crystal Size Distribution Control
export const csdControlTask = defineTask('csd-control', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design crystal size distribution control',
  skill: { name: 'crystallizer-designer' },
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'crystal size distribution engineer',
      task: 'Design system to control crystal size distribution',
      context: args,
      instructions: [
        'Define target CSD (mean size, span)',
        'Design supersaturation control strategy',
        'Specify cooling/addition rate profiles',
        'Design seeding strategy if needed',
        'Design fines destruction if needed',
        'Design classified product removal if needed',
        'Specify online CSD monitoring',
        'Document CSD control strategy'
      ],
      outputFormat: 'JSON with CSD control strategy, expected CSD, monitoring, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'expectedCSD', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        controlStrategy: {
          type: 'object',
          properties: {
            supersaturationControl: { type: 'string' },
            seeding: { type: 'object' },
            finesDestruction: { type: 'boolean' },
            coolingProfile: { type: 'string' }
          }
        },
        expectedCSD: {
          type: 'object',
          properties: {
            meanSize: { type: 'number' },
            span: { type: 'number' },
            d10: { type: 'number' },
            d50: { type: 'number' },
            d90: { type: 'number' }
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
  labels: ['agent', 'chemical-engineering', 'crystallization', 'csd-control']
}));

// Task 5: Solid-Liquid Separation
export const solidLiquidSeparationTask = defineTask('solid-liquid-separation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design downstream solid-liquid separation',
  skill: { name: 'crystallizer-designer' },
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'solid-liquid separation engineer',
      task: 'Design solid-liquid separation for crystal slurry',
      context: args,
      instructions: [
        'Select separation method (filtration, centrifugation)',
        'Size filtration or centrifuge equipment',
        'Design washing system for purity',
        'Specify cake handling and discharge',
        'Design mother liquor handling',
        'Specify drying if required',
        'Calculate separation efficiency',
        'Document separation design'
      ],
      outputFormat: 'JSON with separation design, equipment sizing, efficiency, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'design', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        design: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            equipmentType: { type: 'string' },
            area: { type: 'number' },
            washingSystem: { type: 'object' },
            efficiency: { type: 'number' }
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
  labels: ['agent', 'chemical-engineering', 'crystallization', 'separation']
}));

// Task 6: Polymorphism and Purity
export const polymorphismPurityTask = defineTask('polymorphism-purity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Address polymorphism and purity requirements',
  skill: { name: 'crystallizer-designer' },
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'polymorphism and purity specialist',
      task: 'Address polymorphism control and product purity',
      context: args,
      instructions: [
        'Identify polymorphic forms if applicable',
        'Design conditions to obtain desired polymorph',
        'Specify seeding with correct polymorph',
        'Assess impurity incorporation mechanisms',
        'Design washing for impurity removal',
        'Specify analytical methods for polymorph ID',
        'Design stability studies',
        'Document polymorph control strategy'
      ],
      outputFormat: 'JSON with polymorph control, purity assessment, analytical methods, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'controls', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        polymorphs: {
          type: 'object',
          properties: {
            identified: { type: 'array' },
            targetForm: { type: 'string' },
            controlMethod: { type: 'string' }
          }
        },
        controls: {
          type: 'object',
          properties: {
            polymorphControl: { type: 'object' },
            purityControl: { type: 'object' },
            analyticalMethods: { type: 'array' }
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
  labels: ['agent', 'chemical-engineering', 'crystallization', 'polymorphism']
}));

// Task 7: Operating Procedure Development
export const operatingProcedureTask = defineTask('operating-procedure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop operating procedure for crystal quality',
  skill: { name: 'crystallizer-designer' },
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'crystallization operations engineer',
      task: 'Develop operating procedure for consistent crystal quality',
      context: args,
      instructions: [
        'Define batch recipe or continuous operating parameters',
        'Specify temperature/concentration profiles',
        'Define seeding procedure and timing',
        'Specify sampling and in-process testing',
        'Define endpoint criteria',
        'Develop troubleshooting guide',
        'Create operator training materials',
        'Document operating procedure'
      ],
      outputFormat: 'JSON with operating procedure, batch recipe, troubleshooting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'procedure', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        procedure: {
          type: 'object',
          properties: {
            steps: { type: 'array' },
            profiles: { type: 'object' },
            seedingProcedure: { type: 'object' },
            endpointCriteria: { type: 'object' }
          }
        },
        troubleshooting: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'crystallization', 'operations']
}));

// Task 8: Validation Plan
export const validationPlanTask = defineTask('validation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create product purity validation plan',
  skill: { name: 'crystallizer-designer' },
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'process validation engineer',
      task: 'Create validation plan for crystallization process',
      context: args,
      instructions: [
        'Define critical quality attributes',
        'Identify critical process parameters',
        'Design validation protocol',
        'Specify acceptance criteria',
        'Plan validation batches',
        'Define sampling and testing plan',
        'Plan stability studies',
        'Document validation plan'
      ],
      outputFormat: 'JSON with validation plan, acceptance criteria, testing plan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'plan', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        plan: {
          type: 'object',
          properties: {
            criticalQualityAttributes: { type: 'array' },
            criticalProcessParameters: { type: 'array' },
            acceptanceCriteria: { type: 'object' },
            testingPlan: { type: 'object' },
            validationBatches: { type: 'number' }
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
  labels: ['agent', 'chemical-engineering', 'crystallization', 'validation']
}));
