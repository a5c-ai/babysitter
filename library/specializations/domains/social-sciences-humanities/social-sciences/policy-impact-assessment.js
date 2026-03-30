/**
 * @process social-sciences/policy-impact-assessment
 * @description Evaluate policy effects using program evaluation methods, cost-benefit analysis, stakeholder analysis, and evidence synthesis for evidence-based recommendations
 * @inputs { policy: object, evaluationContext: object, stakeholders: array, outputDir: string }
 * @outputs { success: boolean, impactFindings: object, recommendations: array, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-006 (program-evaluation), SK-SS-008 (systematic-review), SK-SS-012 (policy-communication)
 * @recommendedAgents AG-SS-004 (program-evaluation-specialist), AG-SS-006 (policy-research-analyst)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    policy = {},
    evaluationContext = {},
    stakeholders = [],
    outputDir = 'policy-assessment-output',
    evaluationType = 'summative'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Policy Impact Assessment process');

  // ============================================================================
  // PHASE 1: POLICY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing policy context');
  const policyAnalysis = await ctx.task(policyContextAnalysisTask, {
    policy,
    evaluationContext,
    outputDir
  });

  artifacts.push(...policyAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: LOGIC MODEL DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing logic model');
  const logicModel = await ctx.task(logicModelDevelopmentTask, {
    policy,
    policyAnalysis,
    outputDir
  });

  artifacts.push(...logicModel.artifacts);

  // ============================================================================
  // PHASE 3: STAKEHOLDER ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting stakeholder analysis');
  const stakeholderAnalysis = await ctx.task(stakeholderAnalysisTask, {
    policy,
    stakeholders,
    outputDir
  });

  artifacts.push(...stakeholderAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: IMPACT EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Evaluating policy impact');
  const impactEvaluation = await ctx.task(impactEvaluationTask, {
    policy,
    logicModel,
    evaluationType,
    outputDir
  });

  artifacts.push(...impactEvaluation.artifacts);

  // ============================================================================
  // PHASE 5: COST-BENEFIT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Conducting cost-benefit analysis');
  const costBenefit = await ctx.task(costBenefitAnalysisTask, {
    policy,
    impactEvaluation,
    outputDir
  });

  artifacts.push(...costBenefit.artifacts);

  // ============================================================================
  // PHASE 6: EVIDENCE SYNTHESIS AND RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 6: Synthesizing evidence and developing recommendations');
  const evidenceSynthesis = await ctx.task(policyEvidenceSynthesisTask, {
    policyAnalysis,
    logicModel,
    stakeholderAnalysis,
    impactEvaluation,
    costBenefit,
    outputDir
  });

  artifacts.push(...evidenceSynthesis.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring assessment quality');
  const qualityScore = await ctx.task(policyAssessmentQualityScoringTask, {
    policyAnalysis,
    logicModel,
    stakeholderAnalysis,
    impactEvaluation,
    costBenefit,
    evidenceSynthesis,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const assessmentScore = qualityScore.overallScore;
  const qualityMet = assessmentScore >= 80;

  // Breakpoint: Review policy assessment
  await ctx.breakpoint({
    question: `Policy impact assessment complete. Quality score: ${assessmentScore}/100. ${qualityMet ? 'Assessment meets quality standards!' : 'Assessment may need refinement.'} Review and approve?`,
    title: 'Policy Impact Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        assessmentScore,
        qualityMet,
        policyName: policy.name,
        overallImpact: impactEvaluation.overallAssessment,
        costBenefitRatio: costBenefit.ratio
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: assessmentScore,
    qualityMet,
    impactFindings: {
      overallAssessment: impactEvaluation.overallAssessment,
      outcomes: impactEvaluation.outcomes,
      unintendedConsequences: impactEvaluation.unintendedConsequences
    },
    costBenefit: {
      ratio: costBenefit.ratio,
      netBenefit: costBenefit.netBenefit,
      breakEven: costBenefit.breakEven
    },
    recommendations: evidenceSynthesis.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/policy-impact-assessment',
      timestamp: startTime,
      evaluationType,
      outputDir
    }
  };
}

// Task 1: Policy Context Analysis
export const policyContextAnalysisTask = defineTask('policy-context-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze policy context',
  agent: {
    name: 'policy-analyst',
    prompt: {
      role: 'public policy analyst',
      task: 'Analyze policy context and background',
      context: args,
      instructions: [
        'Document policy objectives and goals',
        'Identify policy instruments and mechanisms',
        'Analyze policy history and evolution',
        'Identify target population and coverage',
        'Analyze implementation context',
        'Identify relevant comparison policies',
        'Document data availability for evaluation',
        'Generate policy context report'
      ],
      outputFormat: 'JSON with objectives, instruments, targetPopulation, implementation, dataAvailability, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'instruments', 'targetPopulation', 'artifacts'],
      properties: {
        objectives: { type: 'array', items: { type: 'string' } },
        instruments: { type: 'array', items: { type: 'string' } },
        targetPopulation: { type: 'object' },
        implementation: { type: 'object' },
        history: { type: 'string' },
        dataAvailability: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'policy-assessment', 'context']
}));

// Task 2: Logic Model Development
export const logicModelDevelopmentTask = defineTask('logic-model-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop logic model',
  agent: {
    name: 'logic-model-developer',
    prompt: {
      role: 'program evaluation specialist',
      task: 'Develop theory of change and logic model',
      context: args,
      instructions: [
        'Identify inputs and resources',
        'Document activities and processes',
        'Specify outputs (immediate products)',
        'Identify short-term outcomes',
        'Identify medium-term outcomes',
        'Specify long-term impacts',
        'Identify assumptions and external factors',
        'Create visual logic model diagram',
        'Generate logic model documentation'
      ],
      outputFormat: 'JSON with inputs, activities, outputs, outcomes, impacts, assumptions, logicModelDiagram, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['inputs', 'activities', 'outputs', 'outcomes', 'artifacts'],
      properties: {
        inputs: { type: 'array', items: { type: 'string' } },
        activities: { type: 'array', items: { type: 'string' } },
        outputs: { type: 'array', items: { type: 'string' } },
        outcomes: {
          type: 'object',
          properties: {
            shortTerm: { type: 'array', items: { type: 'string' } },
            mediumTerm: { type: 'array', items: { type: 'string' } },
            longTerm: { type: 'array', items: { type: 'string' } }
          }
        },
        impacts: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        logicModelDiagram: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'policy-assessment', 'logic-model']
}));

// Task 3: Stakeholder Analysis
export const stakeholderAnalysisTask = defineTask('stakeholder-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder analysis',
  agent: {
    name: 'stakeholder-analyst',
    prompt: {
      role: 'stakeholder analysis specialist',
      task: 'Analyze stakeholders affected by policy',
      context: args,
      instructions: [
        'Identify all relevant stakeholders',
        'Categorize stakeholders by type and interest',
        'Assess stakeholder power and influence',
        'Analyze stakeholder positions on policy',
        'Identify winners and losers',
        'Assess distributional impacts',
        'Create stakeholder mapping',
        'Generate stakeholder analysis report'
      ],
      outputFormat: 'JSON with stakeholders, powerMapping, positions, distributionalImpacts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholders', 'distributionalImpacts', 'artifacts'],
      properties: {
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              type: { type: 'string' },
              interest: { type: 'string' },
              power: { type: 'string' }
            }
          }
        },
        powerMapping: { type: 'object' },
        positions: { type: 'object' },
        winnersLosers: { type: 'object' },
        distributionalImpacts: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'policy-assessment', 'stakeholder']
}));

// Task 4: Impact Evaluation
export const impactEvaluationTask = defineTask('impact-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate policy impact',
  agent: {
    name: 'impact-evaluator',
    prompt: {
      role: 'impact evaluation specialist',
      task: 'Evaluate policy impacts against logic model',
      context: args,
      instructions: [
        'Assess achievement of stated objectives',
        'Evaluate output achievement',
        'Assess outcome achievement',
        'Identify unintended consequences',
        'Analyze attribution vs contribution',
        'Assess effectiveness and efficiency',
        'Evaluate equity impacts',
        'Generate impact evaluation report'
      ],
      outputFormat: 'JSON with overallAssessment, outcomes, objectiveAchievement, unintendedConsequences, effectiveness, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallAssessment', 'outcomes', 'artifacts'],
      properties: {
        overallAssessment: { type: 'string' },
        objectiveAchievement: { type: 'object' },
        outcomes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              outcome: { type: 'string' },
              achieved: { type: 'boolean' },
              evidence: { type: 'string' }
            }
          }
        },
        unintendedConsequences: { type: 'array', items: { type: 'string' } },
        effectiveness: { type: 'object' },
        efficiency: { type: 'object' },
        equityImpacts: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'policy-assessment', 'impact']
}));

// Task 5: Cost-Benefit Analysis
export const costBenefitAnalysisTask = defineTask('cost-benefit-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct cost-benefit analysis',
  agent: {
    name: 'cost-benefit-analyst',
    prompt: {
      role: 'economic evaluation specialist',
      task: 'Conduct cost-benefit analysis of policy',
      context: args,
      instructions: [
        'Identify and quantify all costs',
        'Identify and monetize benefits',
        'Apply appropriate discount rate',
        'Calculate net present value',
        'Calculate benefit-cost ratio',
        'Determine break-even point',
        'Conduct sensitivity analysis',
        'Generate cost-benefit report'
      ],
      outputFormat: 'JSON with costs, benefits, npv, ratio, breakEven, netBenefit, sensitivityAnalysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['costs', 'benefits', 'ratio', 'artifacts'],
      properties: {
        costs: { type: 'object' },
        benefits: { type: 'object' },
        discountRate: { type: 'number' },
        npv: { type: 'number' },
        ratio: { type: 'number' },
        breakEven: { type: 'string' },
        netBenefit: { type: 'number' },
        sensitivityAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'policy-assessment', 'cost-benefit']
}));

// Task 6: Evidence Synthesis
export const policyEvidenceSynthesisTask = defineTask('policy-evidence-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize evidence and develop recommendations',
  agent: {
    name: 'policy-synthesizer',
    prompt: {
      role: 'policy evidence synthesizer',
      task: 'Synthesize evidence and develop policy recommendations',
      context: args,
      instructions: [
        'Integrate findings from all assessment components',
        'Assess overall policy effectiveness',
        'Identify key success factors',
        'Identify barriers and challenges',
        'Develop evidence-based recommendations',
        'Prioritize recommendations',
        'Consider implementation feasibility',
        'Generate policy brief'
      ],
      outputFormat: 'JSON with overallFindings, successFactors, barriers, recommendations, policyBrief, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallFindings', 'recommendations', 'artifacts'],
      properties: {
        overallFindings: { type: 'string' },
        successFactors: { type: 'array', items: { type: 'string' } },
        barriers: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              feasibility: { type: 'string' },
              evidence: { type: 'string' }
            }
          }
        },
        policyBrief: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'policy-assessment', 'synthesis']
}));

// Task 7: Quality Scoring
export const policyAssessmentQualityScoringTask = defineTask('policy-assessment-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score assessment quality',
  agent: {
    name: 'assessment-quality-reviewer',
    prompt: {
      role: 'policy evaluation methodologist',
      task: 'Assess policy impact assessment quality',
      context: args,
      instructions: [
        'Evaluate policy context analysis (weight: 10%)',
        'Assess logic model quality (weight: 15%)',
        'Evaluate stakeholder analysis thoroughness (weight: 15%)',
        'Assess impact evaluation rigor (weight: 25%)',
        'Evaluate cost-benefit analysis quality (weight: 20%)',
        'Assess evidence synthesis and recommendations (weight: 15%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            policyContext: { type: 'number' },
            logicModel: { type: 'number' },
            stakeholderAnalysis: { type: 'number' },
            impactEvaluation: { type: 'number' },
            costBenefit: { type: 'number' },
            evidenceSynthesis: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'policy-assessment', 'quality-scoring']
}));
