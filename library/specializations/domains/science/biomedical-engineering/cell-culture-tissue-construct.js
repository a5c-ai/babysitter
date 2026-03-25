/**
 * @process specializations/domains/science/biomedical-engineering/cell-culture-tissue-construct
 * @description Cell Culture and Tissue Construct Development - Develop tissue constructs through cell seeding,
 * culture, and maturation on scaffolds using bioreactor systems.
 * @inputs { constructName: string, cellSource: string, scaffoldType: string, targetTissue: string }
 * @outputs { success: boolean, cultureProtocol: object, constructSpecifications: object, characterizationData: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/cell-culture-tissue-construct', {
 *   constructName: 'Engineered Cardiac Patch',
 *   cellSource: 'iPSC-derived cardiomyocytes',
 *   scaffoldType: 'Decellularized ECM',
 *   targetTissue: 'Cardiac muscle'
 * });
 *
 * @references
 * - Principles of Tissue Engineering (Lanza, Langer, Vacanti)
 * - FDA Guidance on Human Cells, Tissues, and Cellular and Tissue-Based Products
 * - ISO 13022 Medical products containing viable human cells
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    constructName,
    cellSource,
    scaffoldType,
    targetTissue
  } = inputs;

  // Phase 1: Cell Source Selection and Expansion
  const cellSourceSelection = await ctx.task(cellSourceTask, {
    constructName,
    cellSource,
    targetTissue
  });

  // Phase 2: Cell Seeding Optimization
  const seedingOptimization = await ctx.task(seedingOptimizationTask, {
    constructName,
    cellSourceSelection,
    scaffoldType
  });

  // Phase 3: Culture Condition Establishment
  const cultureConditions = await ctx.task(cultureConditionsTask, {
    constructName,
    cellSource,
    targetTissue
  });

  // Phase 4: Bioreactor System Design
  const bioreactorDesign = await ctx.task(bioreactorDesignTask, {
    constructName,
    targetTissue,
    cultureConditions
  });

  // Breakpoint: Review bioreactor design
  await ctx.breakpoint({
    question: `Review bioreactor design for ${constructName}. Are mechanical stimulation parameters appropriate?`,
    title: 'Bioreactor Design Review',
    context: {
      runId: ctx.runId,
      constructName,
      bioreactorParams: bioreactorDesign.parameters,
      files: [{
        path: `artifacts/phase4-bioreactor-design.json`,
        format: 'json',
        content: bioreactorDesign
      }]
    }
  });

  // Phase 5: Mechanical Conditioning Protocols
  const mechanicalConditioning = await ctx.task(mechanicalConditioningTask, {
    constructName,
    targetTissue,
    bioreactorDesign
  });

  // Phase 6: Tissue Maturation Monitoring
  const maturationMonitoring = await ctx.task(maturationMonitoringTask, {
    constructName,
    cultureConditions,
    mechanicalConditioning
  });

  // Phase 7: Construct Characterization
  const constructCharacterization = await ctx.task(constructCharacterizationTask, {
    constructName,
    targetTissue,
    maturationMonitoring
  });

  // Phase 8: Construct Documentation
  const constructDocumentation = await ctx.task(constructDocumentationTask, {
    constructName,
    cellSource,
    scaffoldType,
    targetTissue,
    cellSourceSelection,
    seedingOptimization,
    cultureConditions,
    bioreactorDesign,
    mechanicalConditioning,
    maturationMonitoring,
    constructCharacterization
  });

  // Final Breakpoint: Construct Approval
  await ctx.breakpoint({
    question: `Tissue construct development complete for ${constructName}. Approve for preclinical evaluation?`,
    title: 'Construct Approval',
    context: {
      runId: ctx.runId,
      constructName,
      files: [
        { path: `artifacts/construct-documentation.json`, format: 'json', content: constructDocumentation }
      ]
    }
  });

  return {
    success: true,
    constructName,
    cultureProtocol: constructDocumentation.protocol,
    constructSpecifications: constructDocumentation.specifications,
    characterizationData: constructCharacterization.data,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/cell-culture-tissue-construct',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const cellSourceTask = defineTask('cell-source-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Cell Source Selection - ${args.constructName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cell Biology Specialist',
      task: 'Select and expand cell source',
      context: {
        constructName: args.constructName,
        cellSource: args.cellSource,
        targetTissue: args.targetTissue
      },
      instructions: [
        '1. Define cell requirements',
        '2. Evaluate cell source options',
        '3. Establish cell isolation protocol',
        '4. Develop expansion protocol',
        '5. Define passage limits',
        '6. Establish cell banking',
        '7. Define QC release criteria',
        '8. Assess cell phenotype',
        '9. Document cell characterization',
        '10. Create cell source SOP'
      ],
      outputFormat: 'JSON object with cell source selection'
    },
    outputSchema: {
      type: 'object',
      required: ['cellSource', 'expansionProtocol', 'qcCriteria'],
      properties: {
        cellSource: { type: 'object' },
        expansionProtocol: { type: 'object' },
        qcCriteria: { type: 'array', items: { type: 'object' } },
        characterization: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tissue-engineering', 'cell-culture', 'cell-source']
}));

export const seedingOptimizationTask = defineTask('seeding-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Seeding Optimization - ${args.constructName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cell Seeding Specialist',
      task: 'Optimize cell seeding on scaffold',
      context: {
        constructName: args.constructName,
        cellSourceSelection: args.cellSourceSelection,
        scaffoldType: args.scaffoldType
      },
      instructions: [
        '1. Define seeding density targets',
        '2. Evaluate seeding methods',
        '3. Optimize seeding protocol',
        '4. Assess cell distribution',
        '5. Evaluate seeding efficiency',
        '6. Test static vs dynamic seeding',
        '7. Optimize timing and conditions',
        '8. Document seeding protocol',
        '9. Establish QC methods',
        '10. Create seeding SOP'
      ],
      outputFormat: 'JSON object with seeding optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'seedingDensity', 'efficiency'],
      properties: {
        protocol: { type: 'object' },
        seedingDensity: { type: 'object' },
        efficiency: { type: 'number' },
        distribution: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tissue-engineering', 'cell-seeding', 'optimization']
}));

export const cultureConditionsTask = defineTask('culture-conditions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Culture Conditions - ${args.constructName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cell Culture Scientist',
      task: 'Establish optimal culture conditions',
      context: {
        constructName: args.constructName,
        cellSource: args.cellSource,
        targetTissue: args.targetTissue
      },
      instructions: [
        '1. Define medium composition',
        '2. Optimize growth factors',
        '3. Define oxygen tension',
        '4. Establish feeding schedule',
        '5. Optimize pH and temperature',
        '6. Define culture duration',
        '7. Establish monitoring parameters',
        '8. Define medium change protocol',
        '9. Document culture conditions',
        '10. Create culture SOP'
      ],
      outputFormat: 'JSON object with culture conditions'
    },
    outputSchema: {
      type: 'object',
      required: ['conditions', 'medium', 'schedule'],
      properties: {
        conditions: { type: 'object' },
        medium: { type: 'object' },
        schedule: { type: 'object' },
        monitoring: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tissue-engineering', 'cell-culture', 'conditions']
}));

export const bioreactorDesignTask = defineTask('bioreactor-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Bioreactor Design - ${args.constructName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Bioreactor Engineer',
      task: 'Design bioreactor system for tissue maturation',
      context: {
        constructName: args.constructName,
        targetTissue: args.targetTissue,
        cultureConditions: args.cultureConditions
      },
      instructions: [
        '1. Define bioreactor requirements',
        '2. Select bioreactor type',
        '3. Design perfusion system',
        '4. Design mechanical stimulation',
        '5. Integrate sensors and controls',
        '6. Plan sterilization methods',
        '7. Define operational parameters',
        '8. Establish maintenance protocol',
        '9. Document bioreactor design',
        '10. Create bioreactor SOP'
      ],
      outputFormat: 'JSON object with bioreactor design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'parameters', 'controls'],
      properties: {
        design: { type: 'object' },
        parameters: { type: 'object' },
        controls: { type: 'object' },
        maintenance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tissue-engineering', 'bioreactor', 'design']
}));

export const mechanicalConditioningTask = defineTask('mechanical-conditioning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Mechanical Conditioning - ${args.constructName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Mechanobiology Specialist',
      task: 'Develop mechanical conditioning protocols',
      context: {
        constructName: args.constructName,
        targetTissue: args.targetTissue,
        bioreactorDesign: args.bioreactorDesign
      },
      instructions: [
        '1. Define physiological loading',
        '2. Design stimulation protocol',
        '3. Optimize strain magnitude',
        '4. Optimize strain frequency',
        '5. Design progression schedule',
        '6. Monitor construct response',
        '7. Adjust based on feedback',
        '8. Document protocol',
        '9. Define safety limits',
        '10. Create conditioning SOP'
      ],
      outputFormat: 'JSON object with mechanical conditioning'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'stimulationParams', 'schedule'],
      properties: {
        protocol: { type: 'object' },
        stimulationParams: { type: 'object' },
        schedule: { type: 'object' },
        safetyLimits: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tissue-engineering', 'mechanical-conditioning', 'bioreactor']
}));

export const maturationMonitoringTask = defineTask('maturation-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Maturation Monitoring - ${args.constructName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Tissue Maturation Specialist',
      task: 'Monitor tissue construct maturation',
      context: {
        constructName: args.constructName,
        cultureConditions: args.cultureConditions,
        mechanicalConditioning: args.mechanicalConditioning
      },
      instructions: [
        '1. Define maturation endpoints',
        '2. Establish monitoring schedule',
        '3. Monitor cell viability',
        '4. Monitor metabolic activity',
        '5. Assess ECM production',
        '6. Monitor mechanical development',
        '7. Track gene expression',
        '8. Non-destructive imaging',
        '9. Document maturation progress',
        '10. Create monitoring report'
      ],
      outputFormat: 'JSON object with maturation monitoring'
    },
    outputSchema: {
      type: 'object',
      required: ['endpoints', 'monitoringData', 'progress'],
      properties: {
        endpoints: { type: 'array', items: { type: 'object' } },
        monitoringData: { type: 'object' },
        progress: { type: 'object' },
        timeline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tissue-engineering', 'maturation', 'monitoring']
}));

export const constructCharacterizationTask = defineTask('construct-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Construct Characterization - ${args.constructName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Tissue Characterization Specialist',
      task: 'Characterize final tissue construct',
      context: {
        constructName: args.constructName,
        targetTissue: args.targetTissue,
        maturationMonitoring: args.maturationMonitoring
      },
      instructions: [
        '1. Conduct histological analysis',
        '2. Immunohistochemistry staining',
        '3. Mechanical property testing',
        '4. Biochemical analysis',
        '5. Gene expression profiling',
        '6. Compare to native tissue',
        '7. Assess functional properties',
        '8. Statistical analysis',
        '9. Document characterization',
        '10. Create characterization report'
      ],
      outputFormat: 'JSON object with construct characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['data', 'histology', 'functional'],
      properties: {
        data: { type: 'object' },
        histology: { type: 'object' },
        functional: { type: 'object' },
        comparison: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tissue-engineering', 'characterization', 'construct']
}));

export const constructDocumentationTask = defineTask('construct-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation - ${args.constructName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation Manager',
      task: 'Compile tissue construct documentation',
      context: {
        constructName: args.constructName,
        cellSource: args.cellSource,
        scaffoldType: args.scaffoldType,
        targetTissue: args.targetTissue,
        cellSourceSelection: args.cellSourceSelection,
        seedingOptimization: args.seedingOptimization,
        cultureConditions: args.cultureConditions,
        bioreactorDesign: args.bioreactorDesign,
        mechanicalConditioning: args.mechanicalConditioning,
        maturationMonitoring: args.maturationMonitoring,
        constructCharacterization: args.constructCharacterization
      },
      instructions: [
        '1. Compile culture protocol',
        '2. Document construct specifications',
        '3. Include characterization data',
        '4. Create batch record template',
        '5. Document QC specifications',
        '6. Include SOPs',
        '7. Document storage/handling',
        '8. Create technical file',
        '9. Obtain approvals',
        '10. Archive documentation'
      ],
      outputFormat: 'JSON object with construct documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'specifications', 'technicalFile'],
      properties: {
        protocol: { type: 'object' },
        specifications: { type: 'object' },
        technicalFile: { type: 'object' },
        approvals: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tissue-engineering', 'documentation', 'construct']
}));
