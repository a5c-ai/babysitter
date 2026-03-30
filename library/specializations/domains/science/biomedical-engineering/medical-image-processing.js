/**
 * @process specializations/domains/science/biomedical-engineering/medical-image-processing
 * @description Medical Image Processing Algorithm Development - Develop and validate medical image processing
 * algorithms for segmentation, registration, reconstruction, and analysis.
 * @inputs { algorithmName: string, imageModality: string, clinicalApplication: string, performanceRequirements: object }
 * @outputs { success: boolean, algorithmDesign: object, validationReport: object, clinicalUtility: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/medical-image-processing', {
 *   algorithmName: 'Lung Nodule Segmentation',
 *   imageModality: 'CT',
 *   clinicalApplication: 'Lung cancer screening',
 *   performanceRequirements: { diceCoefficient: '>0.85', sensitivity: '>90%' }
 * });
 *
 * @references
 * - ITK Software Guide: https://itk.org/
 * - FDA Guidance on Clinical Decision Support Software
 * - ACR-AAPM Technical Standards for Medical Imaging
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    algorithmName,
    imageModality,
    clinicalApplication,
    performanceRequirements
  } = inputs;

  // Phase 1: Algorithm Specification and Design
  const algorithmSpecification = await ctx.task(algorithmSpecificationTask, {
    algorithmName,
    imageModality,
    clinicalApplication,
    performanceRequirements
  });

  // Phase 2: Training Data Preparation
  const dataPreparation = await ctx.task(dataPreparationTask, {
    algorithmName,
    imageModality,
    algorithmSpecification
  });

  // Phase 3: Algorithm Implementation
  const algorithmImplementation = await ctx.task(algorithmImplementationTask, {
    algorithmName,
    algorithmSpecification,
    dataPreparation
  });

  // Phase 4: Performance Metric Definition
  const performanceMetrics = await ctx.task(performanceMetricTask, {
    algorithmName,
    clinicalApplication,
    performanceRequirements
  });

  // Breakpoint: Review algorithm implementation
  await ctx.breakpoint({
    question: `Review algorithm implementation for ${algorithmName}. Is the approach clinically appropriate?`,
    title: 'Algorithm Implementation Review',
    context: {
      runId: ctx.runId,
      algorithmName,
      approach: algorithmImplementation.approach,
      files: [{
        path: `artifacts/phase3-algorithm-implementation.json`,
        format: 'json',
        content: algorithmImplementation
      }]
    }
  });

  // Phase 5: Validation Dataset Curation
  const validationDataset = await ctx.task(validationDatasetTask, {
    algorithmName,
    imageModality,
    clinicalApplication
  });

  // Phase 6: Algorithm Verification and Validation
  const algorithmValidation = await ctx.task(algorithmValidationTask, {
    algorithmName,
    algorithmImplementation,
    performanceMetrics,
    validationDataset
  });

  // Phase 7: Clinical Utility Assessment
  const clinicalUtility = await ctx.task(clinicalUtilityTask, {
    algorithmName,
    clinicalApplication,
    algorithmValidation
  });

  // Phase 8: Algorithm Documentation
  const algorithmDocumentation = await ctx.task(algorithmDocumentationTask, {
    algorithmName,
    imageModality,
    clinicalApplication,
    algorithmSpecification,
    dataPreparation,
    algorithmImplementation,
    performanceMetrics,
    validationDataset,
    algorithmValidation,
    clinicalUtility
  });

  // Final Breakpoint: Algorithm Approval
  await ctx.breakpoint({
    question: `Image processing algorithm complete for ${algorithmName}. Performance: ${algorithmValidation.overallPerformance}. Approve for clinical integration?`,
    title: 'Algorithm Approval',
    context: {
      runId: ctx.runId,
      algorithmName,
      performance: algorithmValidation.overallPerformance,
      files: [
        { path: `artifacts/algorithm-documentation.json`, format: 'json', content: algorithmDocumentation }
      ]
    }
  });

  return {
    success: true,
    algorithmName,
    algorithmDesign: algorithmDocumentation.design,
    validationReport: algorithmValidation.report,
    clinicalUtility: clinicalUtility.assessment,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/medical-image-processing',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const algorithmSpecificationTask = defineTask('algorithm-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Algorithm Specification - ${args.algorithmName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Medical Imaging Scientist',
      task: 'Specify algorithm requirements and design',
      context: {
        algorithmName: args.algorithmName,
        imageModality: args.imageModality,
        clinicalApplication: args.clinicalApplication,
        performanceRequirements: args.performanceRequirements
      },
      instructions: [
        '1. Define algorithm objectives',
        '2. Specify input requirements',
        '3. Define output specifications',
        '4. Select algorithm approach',
        '5. Define preprocessing steps',
        '6. Specify performance targets',
        '7. Document clinical requirements',
        '8. Identify regulatory considerations',
        '9. Plan algorithm architecture',
        '10. Create specification document'
      ],
      outputFormat: 'JSON object with algorithm specification'
    },
    outputSchema: {
      type: 'object',
      required: ['specification', 'architecture', 'requirements'],
      properties: {
        specification: { type: 'object' },
        architecture: { type: 'object' },
        requirements: { type: 'object' },
        regulatory: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['image-processing', 'algorithm-design', 'medical-imaging']
}));

export const dataPreparationTask = defineTask('data-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Data Preparation - ${args.algorithmName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Medical Imaging Data Scientist',
      task: 'Prepare training data for algorithm development',
      context: {
        algorithmName: args.algorithmName,
        imageModality: args.imageModality,
        algorithmSpecification: args.algorithmSpecification
      },
      instructions: [
        '1. Define data requirements',
        '2. Collect imaging data',
        '3. Establish annotation protocol',
        '4. Create ground truth annotations',
        '5. Quality control annotations',
        '6. Data augmentation strategy',
        '7. Split train/validation/test',
        '8. Document data sources',
        '9. Address privacy/consent',
        '10. Create data documentation'
      ],
      outputFormat: 'JSON object with data preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['dataDescription', 'annotationProtocol', 'splits'],
      properties: {
        dataDescription: { type: 'object' },
        annotationProtocol: { type: 'object' },
        splits: { type: 'object' },
        augmentation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['image-processing', 'data-preparation', 'medical-imaging']
}));

export const algorithmImplementationTask = defineTask('algorithm-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Algorithm Implementation - ${args.algorithmName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Image Processing Engineer',
      task: 'Implement image processing algorithm',
      context: {
        algorithmName: args.algorithmName,
        algorithmSpecification: args.algorithmSpecification,
        dataPreparation: args.dataPreparation
      },
      instructions: [
        '1. Implement preprocessing pipeline',
        '2. Implement core algorithm',
        '3. Implement postprocessing',
        '4. Optimize for performance',
        '5. Unit testing',
        '6. Integration testing',
        '7. Document code',
        '8. Version control',
        '9. Create deployment package',
        '10. Document implementation'
      ],
      outputFormat: 'JSON object with algorithm implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'implementation', 'testing'],
      properties: {
        approach: { type: 'string' },
        implementation: { type: 'object' },
        testing: { type: 'object' },
        deployment: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['image-processing', 'implementation', 'medical-imaging']
}));

export const performanceMetricTask = defineTask('performance-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Performance Metrics - ${args.algorithmName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Algorithm Evaluation Specialist',
      task: 'Define performance metrics for evaluation',
      context: {
        algorithmName: args.algorithmName,
        clinicalApplication: args.clinicalApplication,
        performanceRequirements: args.performanceRequirements
      },
      instructions: [
        '1. Define primary metrics',
        '2. Define secondary metrics',
        '3. Establish thresholds',
        '4. Define statistical tests',
        '5. Plan subgroup analysis',
        '6. Define failure modes',
        '7. Establish benchmarks',
        '8. Document metric calculations',
        '9. Create evaluation protocol',
        '10. Document metrics specification'
      ],
      outputFormat: 'JSON object with performance metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'thresholds', 'evaluationProtocol'],
      properties: {
        metrics: { type: 'array', items: { type: 'object' } },
        thresholds: { type: 'object' },
        evaluationProtocol: { type: 'object' },
        benchmarks: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['image-processing', 'metrics', 'evaluation']
}));

export const validationDatasetTask = defineTask('validation-dataset', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Validation Dataset - ${args.algorithmName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Validation Data Specialist',
      task: 'Curate independent validation dataset',
      context: {
        algorithmName: args.algorithmName,
        imageModality: args.imageModality,
        clinicalApplication: args.clinicalApplication
      },
      instructions: [
        '1. Define validation requirements',
        '2. Collect independent data',
        '3. Ensure population diversity',
        '4. Expert annotations',
        '5. Multi-reader consensus',
        '6. Quality control',
        '7. Document data characteristics',
        '8. Maintain separation from training',
        '9. Address selection bias',
        '10. Create validation dataset documentation'
      ],
      outputFormat: 'JSON object with validation dataset'
    },
    outputSchema: {
      type: 'object',
      required: ['datasetDescription', 'demographics', 'annotations'],
      properties: {
        datasetDescription: { type: 'object' },
        demographics: { type: 'object' },
        annotations: { type: 'object' },
        qualityControl: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['image-processing', 'validation', 'dataset']
}));

export const algorithmValidationTask = defineTask('algorithm-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Algorithm Validation - ${args.algorithmName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Validation Scientist',
      task: 'Conduct algorithm verification and validation',
      context: {
        algorithmName: args.algorithmName,
        algorithmImplementation: args.algorithmImplementation,
        performanceMetrics: args.performanceMetrics,
        validationDataset: args.validationDataset
      },
      instructions: [
        '1. Execute validation protocol',
        '2. Calculate performance metrics',
        '3. Compare to thresholds',
        '4. Conduct subgroup analysis',
        '5. Analyze failure cases',
        '6. Statistical significance testing',
        '7. Compare to benchmarks',
        '8. Document limitations',
        '9. Create validation report',
        '10. Obtain validation approval'
      ],
      outputFormat: 'JSON object with algorithm validation'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'overallPerformance', 'subgroupAnalysis'],
      properties: {
        report: { type: 'object' },
        overallPerformance: { type: 'string' },
        subgroupAnalysis: { type: 'object' },
        failureCases: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['image-processing', 'validation', 'verification']
}));

export const clinicalUtilityTask = defineTask('clinical-utility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Clinical Utility - ${args.algorithmName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Affairs Specialist',
      task: 'Assess clinical utility of algorithm',
      context: {
        algorithmName: args.algorithmName,
        clinicalApplication: args.clinicalApplication,
        algorithmValidation: args.algorithmValidation
      },
      instructions: [
        '1. Define clinical workflow',
        '2. Assess time savings',
        '3. Evaluate diagnostic impact',
        '4. Plan reader studies',
        '5. Assess user acceptance',
        '6. Evaluate clinical outcomes',
        '7. Document limitations',
        '8. Plan clinical implementation',
        '9. Create clinical utility report',
        '10. Recommend clinical use'
      ],
      outputFormat: 'JSON object with clinical utility'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'workflow', 'recommendations'],
      properties: {
        assessment: { type: 'object' },
        workflow: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['image-processing', 'clinical-utility', 'medical-imaging']
}));

export const algorithmDocumentationTask = defineTask('algorithm-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation - ${args.algorithmName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation Manager',
      task: 'Compile algorithm documentation',
      context: {
        algorithmName: args.algorithmName,
        imageModality: args.imageModality,
        clinicalApplication: args.clinicalApplication,
        algorithmSpecification: args.algorithmSpecification,
        dataPreparation: args.dataPreparation,
        algorithmImplementation: args.algorithmImplementation,
        performanceMetrics: args.performanceMetrics,
        validationDataset: args.validationDataset,
        algorithmValidation: args.algorithmValidation,
        clinicalUtility: args.clinicalUtility
      },
      instructions: [
        '1. Compile algorithm design document',
        '2. Document validation results',
        '3. Create user documentation',
        '4. Document clinical utility',
        '5. Create regulatory submission content',
        '6. Document limitations',
        '7. Create maintenance plan',
        '8. Archive documentation',
        '9. Obtain approvals',
        '10. Create algorithm package'
      ],
      outputFormat: 'JSON object with algorithm documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'validationReport', 'regulatoryContent'],
      properties: {
        design: { type: 'object' },
        validationReport: { type: 'object' },
        regulatoryContent: { type: 'object' },
        userDocumentation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['image-processing', 'documentation', 'medical-imaging']
}));
