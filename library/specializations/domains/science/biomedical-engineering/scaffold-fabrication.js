/**
 * @process specializations/domains/science/biomedical-engineering/scaffold-fabrication
 * @description Scaffold Fabrication and Characterization - Design, fabricate, and characterize tissue
 * engineering scaffolds using various techniques including electrospinning, 3D printing, and freeze-drying.
 * @inputs { scaffoldName: string, targetTissue: string, fabricationMethod: string, materialRequirements: object }
 * @outputs { success: boolean, scaffoldSpecifications: object, characterizationReports: object, biocompatibilityData: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/scaffold-fabrication', {
 *   scaffoldName: 'Cartilage Repair Scaffold',
 *   targetTissue: 'Articular cartilage',
 *   fabricationMethod: '3D Bioprinting',
 *   materialRequirements: { material: 'PCL/Collagen', poreSize: '200-400um' }
 * });
 *
 * @references
 * - Lanza R. Principles of Tissue Engineering (5th Edition)
 * - ISO 13485 Medical Devices Quality Management
 * - FDA Guidance on Combination Products
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    scaffoldName,
    targetTissue,
    fabricationMethod,
    materialRequirements
  } = inputs;

  // Phase 1: Scaffold Design Specification
  const designSpecification = await ctx.task(designSpecificationTask, {
    scaffoldName,
    targetTissue,
    materialRequirements
  });

  // Phase 2: Fabrication Method Selection
  const methodOptimization = await ctx.task(fabricationMethodTask, {
    scaffoldName,
    fabricationMethod,
    designSpecification
  });

  // Phase 3: Pore Architecture Characterization
  const poreCharacterization = await ctx.task(poreCharacterizationTask, {
    scaffoldName,
    methodOptimization,
    materialRequirements
  });

  // Phase 4: Mechanical Property Testing
  const mechanicalTesting = await ctx.task(mechanicalTestingTask, {
    scaffoldName,
    targetTissue,
    poreCharacterization
  });

  // Breakpoint: Review mechanical properties
  await ctx.breakpoint({
    question: `Review mechanical properties for ${scaffoldName}. Do properties match target tissue requirements?`,
    title: 'Mechanical Properties Review',
    context: {
      runId: ctx.runId,
      scaffoldName,
      mechanicalResults: mechanicalTesting.results,
      files: [{
        path: `artifacts/phase4-mechanical-testing.json`,
        format: 'json',
        content: mechanicalTesting
      }]
    }
  });

  // Phase 5: Degradation Rate Evaluation
  const degradationEvaluation = await ctx.task(degradationEvaluationTask, {
    scaffoldName,
    materialRequirements,
    targetTissue
  });

  // Phase 6: Surface Characterization
  const surfaceCharacterization = await ctx.task(surfaceCharacterizationTask, {
    scaffoldName,
    methodOptimization
  });

  // Phase 7: Biocompatibility Assessment
  const biocompatibilityAssessment = await ctx.task(biocompatibilityTask, {
    scaffoldName,
    targetTissue,
    materialRequirements
  });

  // Phase 8: Scaffold Specifications Documentation
  const scaffoldDocumentation = await ctx.task(scaffoldDocumentationTask, {
    scaffoldName,
    targetTissue,
    fabricationMethod,
    designSpecification,
    methodOptimization,
    poreCharacterization,
    mechanicalTesting,
    degradationEvaluation,
    surfaceCharacterization,
    biocompatibilityAssessment
  });

  // Final Breakpoint: Scaffold Approval
  await ctx.breakpoint({
    question: `Scaffold fabrication complete for ${scaffoldName}. Approve specifications for tissue construct development?`,
    title: 'Scaffold Approval',
    context: {
      runId: ctx.runId,
      scaffoldName,
      files: [
        { path: `artifacts/scaffold-specifications.json`, format: 'json', content: scaffoldDocumentation }
      ]
    }
  });

  return {
    success: true,
    scaffoldName,
    scaffoldSpecifications: scaffoldDocumentation.specifications,
    characterizationReports: {
      pore: poreCharacterization.report,
      mechanical: mechanicalTesting.report,
      degradation: degradationEvaluation.report,
      surface: surfaceCharacterization.report
    },
    biocompatibilityData: biocompatibilityAssessment.data,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/scaffold-fabrication',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const designSpecificationTask = defineTask('design-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Design Specification - ${args.scaffoldName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Tissue Engineering Specialist',
      task: 'Define scaffold design specifications',
      context: {
        scaffoldName: args.scaffoldName,
        targetTissue: args.targetTissue,
        materialRequirements: args.materialRequirements
      },
      instructions: [
        '1. Define target tissue properties',
        '2. Specify required pore size and porosity',
        '3. Define mechanical property targets',
        '4. Specify degradation rate requirements',
        '5. Define surface chemistry requirements',
        '6. Specify overall dimensions',
        '7. Define biocompatibility requirements',
        '8. Consider cell seeding requirements',
        '9. Document design rationale',
        '10. Create design specification document'
      ],
      outputFormat: 'JSON object with design specification'
    },
    outputSchema: {
      type: 'object',
      required: ['specification', 'targetProperties', 'requirements'],
      properties: {
        specification: { type: 'object' },
        targetProperties: { type: 'object' },
        requirements: { type: 'array', items: { type: 'object' } },
        rationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tissue-engineering', 'scaffold-design', 'specifications']
}));

export const fabricationMethodTask = defineTask('fabrication-method', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Fabrication Method - ${args.scaffoldName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Fabrication Process Engineer',
      task: 'Optimize scaffold fabrication method',
      context: {
        scaffoldName: args.scaffoldName,
        fabricationMethod: args.fabricationMethod,
        designSpecification: args.designSpecification
      },
      instructions: [
        '1. Select fabrication technique',
        '2. Optimize process parameters',
        '3. Develop fabrication protocol',
        '4. Establish quality controls',
        '5. Validate process reproducibility',
        '6. Document equipment requirements',
        '7. Define material preparation',
        '8. Establish batch records',
        '9. Train operators',
        '10. Create fabrication SOP'
      ],
      outputFormat: 'JSON object with fabrication method'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'parameters', 'protocol'],
      properties: {
        method: { type: 'string' },
        parameters: { type: 'object' },
        protocol: { type: 'object' },
        qualityControls: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tissue-engineering', 'fabrication', 'process']
}));

export const poreCharacterizationTask = defineTask('pore-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Pore Characterization - ${args.scaffoldName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Characterization Specialist',
      task: 'Characterize scaffold pore architecture',
      context: {
        scaffoldName: args.scaffoldName,
        methodOptimization: args.methodOptimization,
        materialRequirements: args.materialRequirements
      },
      instructions: [
        '1. Measure pore size distribution',
        '2. Calculate porosity',
        '3. Assess pore interconnectivity',
        '4. Conduct micro-CT imaging',
        '5. Perform SEM analysis',
        '6. Calculate surface area',
        '7. Assess pore morphology',
        '8. Compare to specifications',
        '9. Statistical analysis',
        '10. Create characterization report'
      ],
      outputFormat: 'JSON object with pore characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'poreSize', 'porosity'],
      properties: {
        report: { type: 'object' },
        poreSize: { type: 'object' },
        porosity: { type: 'number' },
        interconnectivity: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tissue-engineering', 'characterization', 'pore-structure']
}));

export const mechanicalTestingTask = defineTask('mechanical-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Mechanical Testing - ${args.scaffoldName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Biomechanics Engineer',
      task: 'Conduct mechanical property testing',
      context: {
        scaffoldName: args.scaffoldName,
        targetTissue: args.targetTissue,
        poreCharacterization: args.poreCharacterization
      },
      instructions: [
        '1. Define test methods',
        '2. Conduct compression testing',
        '3. Conduct tensile testing',
        '4. Test in wet/dry conditions',
        '5. Measure elastic modulus',
        '6. Measure yield strength',
        '7. Compare to native tissue',
        '8. Statistical analysis',
        '9. Assess fatigue if needed',
        '10. Create mechanical test report'
      ],
      outputFormat: 'JSON object with mechanical testing'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'results', 'comparison'],
      properties: {
        report: { type: 'object' },
        results: { type: 'object' },
        comparison: { type: 'object' },
        statistics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tissue-engineering', 'mechanical-testing', 'biomechanics']
}));

export const degradationEvaluationTask = defineTask('degradation-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Degradation Evaluation - ${args.scaffoldName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Degradation Study Specialist',
      task: 'Evaluate scaffold degradation rate',
      context: {
        scaffoldName: args.scaffoldName,
        materialRequirements: args.materialRequirements,
        targetTissue: args.targetTissue
      },
      instructions: [
        '1. Design degradation study',
        '2. Select degradation medium',
        '3. Conduct in vitro degradation',
        '4. Monitor mass loss',
        '5. Analyze molecular weight changes',
        '6. Assess pH changes',
        '7. Characterize degradation products',
        '8. Correlate with tissue regeneration',
        '9. Statistical analysis',
        '10. Create degradation report'
      ],
      outputFormat: 'JSON object with degradation evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'degradationRate', 'products'],
      properties: {
        report: { type: 'object' },
        degradationRate: { type: 'object' },
        products: { type: 'array', items: { type: 'string' } },
        timeline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tissue-engineering', 'degradation', 'characterization']
}));

export const surfaceCharacterizationTask = defineTask('surface-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Surface Characterization - ${args.scaffoldName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Surface Science Specialist',
      task: 'Characterize scaffold surface properties',
      context: {
        scaffoldName: args.scaffoldName,
        methodOptimization: args.methodOptimization
      },
      instructions: [
        '1. Analyze surface chemistry (XPS, FTIR)',
        '2. Measure contact angle',
        '3. Assess surface roughness',
        '4. Analyze surface topography',
        '5. Evaluate protein adsorption',
        '6. Assess surface charge',
        '7. Consider surface modification',
        '8. Document surface properties',
        '9. Compare to requirements',
        '10. Create surface characterization report'
      ],
      outputFormat: 'JSON object with surface characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'chemistry', 'wettability'],
      properties: {
        report: { type: 'object' },
        chemistry: { type: 'object' },
        wettability: { type: 'object' },
        roughness: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tissue-engineering', 'surface', 'characterization']
}));

export const biocompatibilityTask = defineTask('biocompatibility-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Biocompatibility - ${args.scaffoldName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Biocompatibility Scientist',
      task: 'Assess scaffold biocompatibility',
      context: {
        scaffoldName: args.scaffoldName,
        targetTissue: args.targetTissue,
        materialRequirements: args.materialRequirements
      },
      instructions: [
        '1. Plan biocompatibility testing',
        '2. Conduct cytotoxicity testing',
        '3. Assess cell attachment',
        '4. Evaluate cell proliferation',
        '5. Assess cell differentiation',
        '6. Test with target cell type',
        '7. Evaluate ECM production',
        '8. Consider in vivo testing',
        '9. Statistical analysis',
        '10. Create biocompatibility report'
      ],
      outputFormat: 'JSON object with biocompatibility assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['data', 'cellResponse', 'cytotoxicity'],
      properties: {
        data: { type: 'object' },
        cellResponse: { type: 'object' },
        cytotoxicity: { type: 'object' },
        recommendation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tissue-engineering', 'biocompatibility', 'cell-testing']
}));

export const scaffoldDocumentationTask = defineTask('scaffold-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation - ${args.scaffoldName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation Manager',
      task: 'Compile scaffold specifications documentation',
      context: {
        scaffoldName: args.scaffoldName,
        targetTissue: args.targetTissue,
        fabricationMethod: args.fabricationMethod,
        designSpecification: args.designSpecification,
        methodOptimization: args.methodOptimization,
        poreCharacterization: args.poreCharacterization,
        mechanicalTesting: args.mechanicalTesting,
        degradationEvaluation: args.degradationEvaluation,
        surfaceCharacterization: args.surfaceCharacterization,
        biocompatibilityAssessment: args.biocompatibilityAssessment
      },
      instructions: [
        '1. Compile specifications',
        '2. Document fabrication process',
        '3. Include characterization data',
        '4. Document biocompatibility',
        '5. Create batch records template',
        '6. Establish QC specifications',
        '7. Document storage conditions',
        '8. Create technical file',
        '9. Obtain approvals',
        '10. Archive documentation'
      ],
      outputFormat: 'JSON object with scaffold documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications', 'technicalFile', 'qcSpecs'],
      properties: {
        specifications: { type: 'object' },
        technicalFile: { type: 'object' },
        qcSpecs: { type: 'object' },
        approvals: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['tissue-engineering', 'documentation', 'specifications']
}));
