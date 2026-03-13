/**
 * @process specializations/domains/science/biomedical-engineering/clinical-evaluation-report
 * @description Clinical Evaluation Report Development - Develop clinical evaluation reports demonstrating
 * clinical safety and performance of medical devices per MEDDEV 2.7/1 and EU MDR requirements.
 * @inputs { deviceName: string, riskClass: string, intendedPurpose: string, equivalentDevices?: object[] }
 * @outputs { success: boolean, clinicalEvaluationPlan: object, cer: object, pmcfPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/clinical-evaluation-report', {
 *   deviceName: 'Coronary Drug-Eluting Stent',
 *   riskClass: 'Class III',
 *   intendedPurpose: 'Treatment of coronary artery stenosis',
 *   equivalentDevices: [{ name: 'Predicate DES', manufacturer: 'Example Corp' }]
 * });
 *
 * @references
 * - MEDDEV 2.7/1 Rev 4 Clinical Evaluation
 * - EU MDR 2017/745 Article 61 Clinical Evaluation
 * - MDCG 2020-13 Clinical Evaluation Assessment Report Template
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deviceName,
    riskClass,
    intendedPurpose,
    equivalentDevices = []
  } = inputs;

  // Phase 1: Clinical Evaluation Plan Development
  const clinicalEvaluationPlan = await ctx.task(cepDevelopmentTask, {
    deviceName,
    riskClass,
    intendedPurpose
  });

  // Phase 2: Literature Search and Review
  const literatureReview = await ctx.task(literatureReviewTask, {
    deviceName,
    intendedPurpose,
    clinicalEvaluationPlan
  });

  // Phase 3: Clinical Data Appraisal
  const dataAppraisal = await ctx.task(dataAppraisalTask, {
    deviceName,
    literatureReview
  });

  // Phase 4: Equivalent Device Analysis
  const equivalenceAnalysis = await ctx.task(equivalenceAnalysisTask, {
    deviceName,
    equivalentDevices,
    intendedPurpose
  });

  // Breakpoint: Review equivalence analysis
  await ctx.breakpoint({
    question: `Review equivalence analysis for ${deviceName}. Is equivalence adequately demonstrated?`,
    title: 'Equivalence Analysis Review',
    context: {
      runId: ctx.runId,
      deviceName,
      equivalenceConclusion: equivalenceAnalysis.conclusion,
      files: [{
        path: `artifacts/phase4-equivalence-analysis.json`,
        format: 'json',
        content: equivalenceAnalysis
      }]
    }
  });

  // Phase 5: Clinical Data Synthesis
  const dataSynthesis = await ctx.task(dataSynthesisTask, {
    deviceName,
    dataAppraisal,
    equivalenceAnalysis
  });

  // Phase 6: Benefit-Risk Analysis
  const benefitRiskAnalysis = await ctx.task(benefitRiskTask, {
    deviceName,
    riskClass,
    dataSynthesis
  });

  // Phase 7: CER Writing
  const cerWriting = await ctx.task(cerWritingTask, {
    deviceName,
    riskClass,
    intendedPurpose,
    clinicalEvaluationPlan,
    literatureReview,
    dataAppraisal,
    equivalenceAnalysis,
    dataSynthesis,
    benefitRiskAnalysis
  });

  // Phase 8: PMCF Plan Development
  const pmcfPlan = await ctx.task(pmcfPlanTask, {
    deviceName,
    riskClass,
    cerWriting,
    benefitRiskAnalysis
  });

  // Final Breakpoint: CER Approval
  await ctx.breakpoint({
    question: `Clinical Evaluation Report complete for ${deviceName}. Approve CER for regulatory submission?`,
    title: 'CER Approval',
    context: {
      runId: ctx.runId,
      deviceName,
      files: [
        { path: `artifacts/clinical-evaluation-report.json`, format: 'json', content: cerWriting }
      ]
    }
  });

  return {
    success: true,
    deviceName,
    clinicalEvaluationPlan: clinicalEvaluationPlan.plan,
    cer: cerWriting.cer,
    pmcfPlan: pmcfPlan.plan,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/clinical-evaluation-report',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const cepDevelopmentTask = defineTask('cep-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: CEP Development - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Evaluation Specialist',
      task: 'Develop Clinical Evaluation Plan',
      context: {
        deviceName: args.deviceName,
        riskClass: args.riskClass,
        intendedPurpose: args.intendedPurpose
      },
      instructions: [
        '1. Define scope and objectives',
        '2. Identify clinical claims',
        '3. Define GSPRs to be addressed',
        '4. Plan literature search strategy',
        '5. Define equivalence approach',
        '6. Plan clinical data routes',
        '7. Define appraisal criteria',
        '8. Plan benefit-risk methodology',
        '9. Define PMCF requirements',
        '10. Create CEP document'
      ],
      outputFormat: 'JSON object with CEP'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'scope', 'methodology'],
      properties: {
        plan: { type: 'object' },
        scope: { type: 'object' },
        methodology: { type: 'object' },
        gspr: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['clinical-evaluation', 'cep', 'regulatory']
}));

export const literatureReviewTask = defineTask('literature-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Literature Review - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Medical Literature Specialist',
      task: 'Conduct systematic literature review',
      context: {
        deviceName: args.deviceName,
        intendedPurpose: args.intendedPurpose,
        clinicalEvaluationPlan: args.clinicalEvaluationPlan
      },
      instructions: [
        '1. Define search protocol',
        '2. Search databases (PubMed, Embase, etc.)',
        '3. Apply inclusion/exclusion criteria',
        '4. Screen abstracts',
        '5. Full-text review',
        '6. Extract data',
        '7. Assess study quality',
        '8. Document search results',
        '9. Create PRISMA diagram',
        '10. Create literature review report'
      ],
      outputFormat: 'JSON object with literature review'
    },
    outputSchema: {
      type: 'object',
      required: ['searchProtocol', 'results', 'studies'],
      properties: {
        searchProtocol: { type: 'object' },
        results: { type: 'object' },
        studies: { type: 'array', items: { type: 'object' } },
        prisma: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['clinical-evaluation', 'literature', 'systematic-review']
}));

export const dataAppraisalTask = defineTask('data-appraisal', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Data Appraisal - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Data Analyst',
      task: 'Appraise clinical data quality',
      context: {
        deviceName: args.deviceName,
        literatureReview: args.literatureReview
      },
      instructions: [
        '1. Define appraisal criteria',
        '2. Assess study design quality',
        '3. Evaluate sample sizes',
        '4. Assess endpoint relevance',
        '5. Evaluate statistical methods',
        '6. Assess bias risk',
        '7. Determine data suitability',
        '8. Weight evidence',
        '9. Document appraisal',
        '10. Create appraisal report'
      ],
      outputFormat: 'JSON object with data appraisal'
    },
    outputSchema: {
      type: 'object',
      required: ['appraisalResults', 'qualityAssessment', 'weights'],
      properties: {
        appraisalResults: { type: 'array', items: { type: 'object' } },
        qualityAssessment: { type: 'object' },
        weights: { type: 'object' },
        suitability: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['clinical-evaluation', 'data-appraisal', 'quality']
}));

export const equivalenceAnalysisTask = defineTask('equivalence-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Equivalence Analysis - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Equivalence Assessment Specialist',
      task: 'Analyze device equivalence',
      context: {
        deviceName: args.deviceName,
        equivalentDevices: args.equivalentDevices,
        intendedPurpose: args.intendedPurpose
      },
      instructions: [
        '1. Identify equivalent devices',
        '2. Compare technical characteristics',
        '3. Compare biological characteristics',
        '4. Compare clinical characteristics',
        '5. Assess differences',
        '6. Justify data extrapolation',
        '7. Document access to data',
        '8. Assess level of equivalence',
        '9. Document gaps',
        '10. Create equivalence report'
      ],
      outputFormat: 'JSON object with equivalence analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['comparison', 'conclusion', 'gaps'],
      properties: {
        comparison: { type: 'object' },
        conclusion: { type: 'string' },
        gaps: { type: 'array', items: { type: 'string' } },
        justification: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['clinical-evaluation', 'equivalence', 'regulatory']
}));

export const dataSynthesisTask = defineTask('data-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Data Synthesis - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Evidence Synthesist',
      task: 'Synthesize clinical evidence',
      context: {
        deviceName: args.deviceName,
        dataAppraisal: args.dataAppraisal,
        equivalenceAnalysis: args.equivalenceAnalysis
      },
      instructions: [
        '1. Summarize safety data',
        '2. Summarize performance data',
        '3. Synthesize clinical benefits',
        '4. Address each GSPR',
        '5. Meta-analysis if appropriate',
        '6. Identify data gaps',
        '7. Draw conclusions',
        '8. Document limitations',
        '9. Support clinical claims',
        '10. Create synthesis report'
      ],
      outputFormat: 'JSON object with data synthesis'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'safety', 'performance'],
      properties: {
        synthesis: { type: 'object' },
        safety: { type: 'object' },
        performance: { type: 'object' },
        gsprCompliance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['clinical-evaluation', 'synthesis', 'evidence']
}));

export const benefitRiskTask = defineTask('benefit-risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Benefit-Risk Analysis - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Benefit-Risk Analyst',
      task: 'Conduct benefit-risk analysis',
      context: {
        deviceName: args.deviceName,
        riskClass: args.riskClass,
        dataSynthesis: args.dataSynthesis
      },
      instructions: [
        '1. Quantify clinical benefits',
        '2. Identify and characterize risks',
        '3. Apply benefit-risk framework',
        '4. Compare to alternatives',
        '5. Consider state of the art',
        '6. Assess acceptability',
        '7. Document methodology',
        '8. Draw conclusions',
        '9. Address uncertainties',
        '10. Create benefit-risk report'
      ],
      outputFormat: 'JSON object with benefit-risk analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'benefits', 'risks', 'conclusion'],
      properties: {
        analysis: { type: 'object' },
        benefits: { type: 'array', items: { type: 'object' } },
        risks: { type: 'array', items: { type: 'object' } },
        conclusion: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['clinical-evaluation', 'benefit-risk', 'regulatory']
}));

export const cerWritingTask = defineTask('cer-writing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: CER Writing - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Medical Writer',
      task: 'Write Clinical Evaluation Report',
      context: {
        deviceName: args.deviceName,
        riskClass: args.riskClass,
        intendedPurpose: args.intendedPurpose,
        clinicalEvaluationPlan: args.clinicalEvaluationPlan,
        literatureReview: args.literatureReview,
        dataAppraisal: args.dataAppraisal,
        equivalenceAnalysis: args.equivalenceAnalysis,
        dataSynthesis: args.dataSynthesis,
        benefitRiskAnalysis: args.benefitRiskAnalysis
      },
      instructions: [
        '1. Write executive summary',
        '2. Document scope and context',
        '3. Describe clinical background',
        '4. Document clinical data',
        '5. Present data appraisal',
        '6. Present data synthesis',
        '7. Document benefit-risk analysis',
        '8. Draw conclusions',
        '9. Define update triggers',
        '10. Create CER document'
      ],
      outputFormat: 'JSON object with CER'
    },
    outputSchema: {
      type: 'object',
      required: ['cer', 'executiveSummary', 'conclusions'],
      properties: {
        cer: { type: 'object' },
        executiveSummary: { type: 'string' },
        conclusions: { type: 'object' },
        updateTriggers: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['clinical-evaluation', 'cer', 'documentation']
}));

export const pmcfPlanTask = defineTask('pmcf-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: PMCF Plan - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'PMCF Specialist',
      task: 'Develop Post-Market Clinical Follow-up Plan',
      context: {
        deviceName: args.deviceName,
        riskClass: args.riskClass,
        cerWriting: args.cerWriting,
        benefitRiskAnalysis: args.benefitRiskAnalysis
      },
      instructions: [
        '1. Identify PMCF objectives',
        '2. Define methods and activities',
        '3. Plan registry studies',
        '4. Plan clinical investigations',
        '5. Define PMS data analysis',
        '6. Establish timelines',
        '7. Define endpoints',
        '8. Plan CER update',
        '9. Document rationale',
        '10. Create PMCF plan'
      ],
      outputFormat: 'JSON object with PMCF plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'objectives', 'methods'],
      properties: {
        plan: { type: 'object' },
        objectives: { type: 'array', items: { type: 'string' } },
        methods: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['clinical-evaluation', 'pmcf', 'regulatory']
}));
