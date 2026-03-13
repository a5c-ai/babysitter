/**
 * @process specializations/domains/science/biomedical-engineering/aiml-medical-device
 * @description AI/ML Medical Device Development - Develop and validate AI/ML-based medical devices following
 * FDA's AI/ML framework and Good Machine Learning Practice (GMLP) principles.
 * @inputs { deviceName: string, mlProblemType: string, intendedUse: string, dataDescription: object }
 * @outputs { success: boolean, algorithmDescription: object, mlPerformanceReport: object, pccp: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/aiml-medical-device', {
 *   deviceName: 'Diabetic Retinopathy Screening AI',
 *   mlProblemType: 'Image Classification',
 *   intendedUse: 'Automated detection of diabetic retinopathy from fundus images',
 *   dataDescription: { dataType: 'Fundus photographs', dataSize: '100000 images' }
 * });
 *
 * @references
 * - FDA AI/ML-Based Software as a Medical Device (SaMD) Action Plan
 * - GMLP Guiding Principles: https://www.fda.gov/medical-devices/software-medical-device-samd/good-machine-learning-practice-medical-device-development-guiding-principles
 * - FDA Predetermined Change Control Plan Guidance
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deviceName,
    mlProblemType,
    intendedUse,
    dataDescription
  } = inputs;

  // Phase 1: Problem Formulation
  const problemFormulation = await ctx.task(problemFormulationTask, {
    deviceName,
    mlProblemType,
    intendedUse
  });

  // Phase 2: Training Data Collection and Curation
  const dataCollection = await ctx.task(dataCollectionTask, {
    deviceName,
    dataDescription,
    problemFormulation
  });

  // Phase 3: Algorithm Development
  const algorithmDevelopment = await ctx.task(algorithmDevelopmentTask, {
    deviceName,
    mlProblemType,
    dataCollection,
    problemFormulation
  });

  // Breakpoint: Review algorithm design
  await ctx.breakpoint({
    question: `Review algorithm design for ${deviceName}. Is the ML architecture appropriate for the problem?`,
    title: 'Algorithm Design Review',
    context: {
      runId: ctx.runId,
      deviceName,
      algorithmType: algorithmDevelopment.algorithmType,
      files: [{
        path: `artifacts/phase3-algorithm-development.json`,
        format: 'json',
        content: algorithmDevelopment
      }]
    }
  });

  // Phase 4: Model Performance Evaluation
  const performanceEvaluation = await ctx.task(performanceEvaluationTask, {
    deviceName,
    algorithmDevelopment,
    dataCollection
  });

  // Phase 5: Bias and Fairness Assessment
  const biasFairnessAssessment = await ctx.task(biasFairnessTask, {
    deviceName,
    algorithmDevelopment,
    performanceEvaluation,
    dataCollection
  });

  // Phase 6: Clinical Validation Planning
  const clinicalValidation = await ctx.task(clinicalValidationTask, {
    deviceName,
    intendedUse,
    performanceEvaluation
  });

  // Phase 7: Predetermined Change Control Plan (PCCP)
  const pccpDevelopment = await ctx.task(pccpDevelopmentTask, {
    deviceName,
    algorithmDevelopment,
    performanceEvaluation
  });

  // Phase 8: AI/ML Documentation
  const aimlDocumentation = await ctx.task(aimlDocumentationTask, {
    deviceName,
    mlProblemType,
    intendedUse,
    problemFormulation,
    dataCollection,
    algorithmDevelopment,
    performanceEvaluation,
    biasFairnessAssessment,
    clinicalValidation,
    pccpDevelopment
  });

  // Final Breakpoint: AI/ML Device Approval
  await ctx.breakpoint({
    question: `AI/ML development complete for ${deviceName}. Performance: ${performanceEvaluation.overallPerformance}. Approve for regulatory submission?`,
    title: 'AI/ML Device Approval',
    context: {
      runId: ctx.runId,
      deviceName,
      overallPerformance: performanceEvaluation.overallPerformance,
      files: [
        { path: `artifacts/aiml-documentation.json`, format: 'json', content: aimlDocumentation }
      ]
    }
  });

  return {
    success: true,
    deviceName,
    algorithmDescription: algorithmDevelopment.description,
    mlPerformanceReport: performanceEvaluation.report,
    pccp: pccpDevelopment.pccp,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/aiml-medical-device',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const problemFormulationTask = defineTask('problem-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Problem Formulation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Product Manager with healthcare expertise',
      task: 'Formulate ML problem and intended use',
      context: {
        deviceName: args.deviceName,
        mlProblemType: args.mlProblemType,
        intendedUse: args.intendedUse
      },
      instructions: [
        '1. Define clinical need and problem statement',
        '2. Specify intended use and indications',
        '3. Define target population',
        '4. Define intended users',
        '5. Specify input data requirements',
        '6. Define output specifications',
        '7. Define performance objectives',
        '8. Identify clinical workflow integration',
        '9. Document assumptions and limitations',
        '10. Create problem formulation document'
      ],
      outputFormat: 'JSON object with problem formulation'
    },
    outputSchema: {
      type: 'object',
      required: ['formulation', 'intendedUse', 'performanceObjectives'],
      properties: {
        formulation: { type: 'object' },
        intendedUse: { type: 'object' },
        performanceObjectives: { type: 'array', items: { type: 'object' } },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aiml', 'problem-formulation', 'medical-device']
}));

export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Data Collection - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Data Scientist',
      task: 'Plan and document training data collection and curation',
      context: {
        deviceName: args.deviceName,
        dataDescription: args.dataDescription,
        problemFormulation: args.problemFormulation
      },
      instructions: [
        '1. Define data requirements',
        '2. Identify data sources',
        '3. Establish data collection protocols',
        '4. Define labeling/annotation procedures',
        '5. Assess data quality requirements',
        '6. Plan data preprocessing',
        '7. Address data privacy (HIPAA, GDPR)',
        '8. Document data governance',
        '9. Plan train/validation/test splits',
        '10. Create data management plan'
      ],
      outputFormat: 'JSON object with data collection plan'
    },
    outputSchema: {
      type: 'object',
      required: ['dataManagementPlan', 'dataQuality', 'dataSplits'],
      properties: {
        dataManagementPlan: { type: 'object' },
        dataQuality: { type: 'object' },
        dataSplits: { type: 'object' },
        privacyCompliance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aiml', 'data-collection', 'medical-device']
}));

export const algorithmDevelopmentTask = defineTask('algorithm-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Algorithm Development - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Engineer',
      task: 'Develop and train ML algorithm',
      context: {
        deviceName: args.deviceName,
        mlProblemType: args.mlProblemType,
        dataCollection: args.dataCollection,
        problemFormulation: args.problemFormulation
      },
      instructions: [
        '1. Select algorithm architecture',
        '2. Define model hyperparameters',
        '3. Implement training pipeline',
        '4. Establish experiment tracking',
        '5. Train model iterations',
        '6. Implement cross-validation',
        '7. Document model selection',
        '8. Implement inference pipeline',
        '9. Document algorithm specifications',
        '10. Create algorithm description document'
      ],
      outputFormat: 'JSON object with algorithm development'
    },
    outputSchema: {
      type: 'object',
      required: ['description', 'algorithmType', 'trainingDetails'],
      properties: {
        description: { type: 'object' },
        algorithmType: { type: 'string' },
        trainingDetails: { type: 'object' },
        hyperparameters: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aiml', 'algorithm-development', 'medical-device']
}));

export const performanceEvaluationTask = defineTask('performance-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Performance Evaluation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Evaluation Specialist',
      task: 'Evaluate model performance comprehensively',
      context: {
        deviceName: args.deviceName,
        algorithmDevelopment: args.algorithmDevelopment,
        dataCollection: args.dataCollection
      },
      instructions: [
        '1. Define evaluation metrics',
        '2. Evaluate on held-out test set',
        '3. Calculate sensitivity/specificity',
        '4. Generate ROC/PR curves',
        '5. Evaluate across subgroups',
        '6. Assess generalization',
        '7. Compare to clinical standards',
        '8. Document performance limitations',
        '9. Establish performance bounds',
        '10. Create performance evaluation report'
      ],
      outputFormat: 'JSON object with performance evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'metrics', 'overallPerformance'],
      properties: {
        report: { type: 'object' },
        metrics: { type: 'object' },
        overallPerformance: { type: 'string' },
        subgroupAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aiml', 'performance-evaluation', 'medical-device']
}));

export const biasFairnessTask = defineTask('bias-fairness-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Bias and Fairness - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AI Ethics Specialist',
      task: 'Assess model bias and fairness',
      context: {
        deviceName: args.deviceName,
        algorithmDevelopment: args.algorithmDevelopment,
        performanceEvaluation: args.performanceEvaluation,
        dataCollection: args.dataCollection
      },
      instructions: [
        '1. Define protected attributes',
        '2. Analyze data representation',
        '3. Evaluate performance parity',
        '4. Calculate fairness metrics',
        '5. Identify potential biases',
        '6. Assess historical bias in data',
        '7. Document mitigation strategies',
        '8. Plan ongoing monitoring',
        '9. Document limitations',
        '10. Create bias assessment report'
      ],
      outputFormat: 'JSON object with bias assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'fairnessMetrics', 'mitigations'],
      properties: {
        assessment: { type: 'object' },
        fairnessMetrics: { type: 'object' },
        mitigations: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aiml', 'bias-fairness', 'medical-device']
}));

export const clinicalValidationTask = defineTask('clinical-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Clinical Validation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Affairs Specialist',
      task: 'Plan clinical validation of AI/ML device',
      context: {
        deviceName: args.deviceName,
        intendedUse: args.intendedUse,
        performanceEvaluation: args.performanceEvaluation
      },
      instructions: [
        '1. Define clinical validation objectives',
        '2. Design clinical study protocol',
        '3. Define patient population',
        '4. Establish clinical endpoints',
        '5. Define comparison to standard of care',
        '6. Plan reader studies if applicable',
        '7. Plan prospective validation',
        '8. Define clinical acceptance criteria',
        '9. Document IRB requirements',
        '10. Create clinical validation plan'
      ],
      outputFormat: 'JSON object with clinical validation'
    },
    outputSchema: {
      type: 'object',
      required: ['validationPlan', 'studyDesign', 'endpoints'],
      properties: {
        validationPlan: { type: 'object' },
        studyDesign: { type: 'object' },
        endpoints: { type: 'array', items: { type: 'object' } },
        irbRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aiml', 'clinical-validation', 'medical-device']
}));

export const pccpDevelopmentTask = defineTask('pccp-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: PCCP Development - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Regulatory AI/ML Specialist',
      task: 'Develop Predetermined Change Control Plan',
      context: {
        deviceName: args.deviceName,
        algorithmDevelopment: args.algorithmDevelopment,
        performanceEvaluation: args.performanceEvaluation
      },
      instructions: [
        '1. Define modification protocol',
        '2. Specify types of anticipated changes',
        '3. Define performance monitoring',
        '4. Establish re-training criteria',
        '5. Define validation requirements for changes',
        '6. Establish performance guardrails',
        '7. Define update deployment process',
        '8. Plan user communication',
        '9. Document change control procedures',
        '10. Create PCCP document'
      ],
      outputFormat: 'JSON object with PCCP'
    },
    outputSchema: {
      type: 'object',
      required: ['pccp', 'anticipatedChanges', 'validationRequirements'],
      properties: {
        pccp: { type: 'object' },
        anticipatedChanges: { type: 'array', items: { type: 'object' } },
        validationRequirements: { type: 'object' },
        performanceGuardrails: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aiml', 'pccp', 'regulatory']
}));

export const aimlDocumentationTask = defineTask('aiml-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: AI/ML Documentation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AI/ML Documentation Specialist',
      task: 'Compile comprehensive AI/ML documentation',
      context: {
        deviceName: args.deviceName,
        mlProblemType: args.mlProblemType,
        intendedUse: args.intendedUse,
        problemFormulation: args.problemFormulation,
        dataCollection: args.dataCollection,
        algorithmDevelopment: args.algorithmDevelopment,
        performanceEvaluation: args.performanceEvaluation,
        biasFairnessAssessment: args.biasFairnessAssessment,
        clinicalValidation: args.clinicalValidation,
        pccpDevelopment: args.pccpDevelopment
      },
      instructions: [
        '1. Compile algorithm description',
        '2. Document data management',
        '3. Include performance evaluation',
        '4. Include bias assessment',
        '5. Document clinical validation',
        '6. Include PCCP',
        '7. Document GMLP compliance',
        '8. Create model card',
        '9. Prepare regulatory submission content',
        '10. Create AI/ML documentation package'
      ],
      outputFormat: 'JSON object with AI/ML documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'modelCard', 'submissionContent'],
      properties: {
        documentation: { type: 'object' },
        modelCard: { type: 'object' },
        submissionContent: { type: 'object' },
        gmlpCompliance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['aiml', 'documentation', 'regulatory']
}));
