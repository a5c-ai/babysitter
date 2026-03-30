/**
 * @process social-sciences/survey-research-design
 * @description Develop comprehensive survey instruments including questionnaire design, sampling strategies, mode selection, and response optimization using tailored design methods
 * @inputs { researchObjectives: array, targetPopulation: object, constraints: object, outputDir: string }
 * @outputs { success: boolean, surveyInstrument: object, samplingPlan: object, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-003 (survey-design-administration), SK-SS-009 (psychometric-assessment), SK-SS-014 (research-ethics-irb)
 * @recommendedAgents AG-SS-003 (survey-research-director), AG-SS-007 (measurement-psychometrics-expert), AG-SS-010 (research-ethics-coordinator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchObjectives = [],
    targetPopulation = {},
    constraints = {},
    outputDir = 'survey-design-output',
    targetResponseRate = 60,
    targetMarginOfError = 5
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Survey Research Design process');

  // ============================================================================
  // PHASE 1: RESEARCH OBJECTIVES ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing research objectives for survey design');
  const objectivesAnalysis = await ctx.task(objectivesAnalysisTask, {
    researchObjectives,
    targetPopulation,
    outputDir
  });

  artifacts.push(...objectivesAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: QUESTIONNAIRE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing questionnaire items');
  const questionnaireDesign = await ctx.task(questionnaireDesignTask, {
    objectivesAnalysis,
    researchObjectives,
    outputDir
  });

  artifacts.push(...questionnaireDesign.artifacts);

  // ============================================================================
  // PHASE 3: SAMPLING STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing sampling strategy');
  const samplingStrategy = await ctx.task(samplingStrategyTask, {
    targetPopulation,
    targetMarginOfError,
    constraints,
    outputDir
  });

  artifacts.push(...samplingStrategy.artifacts);

  // ============================================================================
  // PHASE 4: MODE SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Selecting survey administration mode');
  const modeSelection = await ctx.task(modeSelectionTask, {
    targetPopulation,
    constraints,
    questionnaireDesign,
    outputDir
  });

  artifacts.push(...modeSelection.artifacts);

  // ============================================================================
  // PHASE 5: RESPONSE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing response optimization strategies');
  const responseOptimization = await ctx.task(responseOptimizationTask, {
    modeSelection,
    targetPopulation,
    targetResponseRate,
    outputDir
  });

  artifacts.push(...responseOptimization.artifacts);

  // ============================================================================
  // PHASE 6: PILOT TESTING PLAN
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing pilot testing plan');
  const pilotPlan = await ctx.task(pilotTestingPlanTask, {
    questionnaireDesign,
    samplingStrategy,
    modeSelection,
    outputDir
  });

  artifacts.push(...pilotPlan.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring survey design quality');
  const qualityScore = await ctx.task(surveyQualityScoringTask, {
    objectivesAnalysis,
    questionnaireDesign,
    samplingStrategy,
    modeSelection,
    responseOptimization,
    pilotPlan,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const surveyScore = qualityScore.overallScore;
  const qualityMet = surveyScore >= 80;

  // Breakpoint: Review survey design
  await ctx.breakpoint({
    question: `Survey design complete. Quality score: ${surveyScore}/100. ${qualityMet ? 'Design meets quality standards!' : 'Design may need refinement.'} Review and approve?`,
    title: 'Survey Research Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        surveyScore,
        qualityMet,
        totalQuestions: questionnaireDesign.totalQuestions,
        samplingMethod: samplingStrategy.method,
        requiredSampleSize: samplingStrategy.requiredSampleSize,
        surveyMode: modeSelection.selectedMode
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: surveyScore,
    qualityMet,
    surveyInstrument: {
      totalQuestions: questionnaireDesign.totalQuestions,
      sections: questionnaireDesign.sections,
      estimatedDuration: questionnaireDesign.estimatedDuration,
      instrumentPath: questionnaireDesign.instrumentPath
    },
    samplingPlan: {
      method: samplingStrategy.method,
      requiredSampleSize: samplingStrategy.requiredSampleSize,
      samplingFrame: samplingStrategy.samplingFrame,
      marginOfError: samplingStrategy.marginOfError
    },
    modeSelection: {
      mode: modeSelection.selectedMode,
      rationale: modeSelection.rationale
    },
    responseOptimization: {
      strategies: responseOptimization.strategies,
      expectedResponseRate: responseOptimization.expectedResponseRate
    },
    pilotPlan: pilotPlan.planPath,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/survey-research-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Research Objectives Analysis
export const objectivesAnalysisTask = defineTask('objectives-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze research objectives for survey design',
  agent: {
    name: 'survey-methodologist',
    prompt: {
      role: 'senior survey research methodologist',
      task: 'Analyze research objectives to determine survey design requirements',
      context: args,
      instructions: [
        'Review and clarify research objectives',
        'Identify key constructs to be measured',
        'Determine measurement requirements for each objective',
        'Identify descriptive vs analytical research goals',
        'Assess need for cross-sectional vs longitudinal design',
        'Identify key subgroup comparisons needed',
        'Document information gaps and operationalization needs',
        'Generate objectives-to-measurement matrix'
      ],
      outputFormat: 'JSON with objectivesClarity, constructs, measurementRequirements, designType, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['constructs', 'measurementRequirements', 'artifacts'],
      properties: {
        objectivesClarity: { type: 'number' },
        constructs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              construct: { type: 'string' },
              definition: { type: 'string' },
              measurementApproach: { type: 'string' }
            }
          }
        },
        measurementRequirements: { type: 'array' },
        designType: { type: 'string' },
        subgroupComparisons: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'survey-design', 'objectives-analysis']
}));

// Task 2: Questionnaire Design
export const questionnaireDesignTask = defineTask('questionnaire-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design questionnaire items',
  agent: {
    name: 'questionnaire-designer',
    prompt: {
      role: 'expert questionnaire designer',
      task: 'Design comprehensive questionnaire with well-crafted items',
      context: args,
      instructions: [
        'Design questions for each construct using best practices',
        'Use established scales where available (validated measures)',
        'Avoid double-barreled questions',
        'Avoid leading or loaded questions',
        'Design appropriate response scales (Likert, semantic differential)',
        'Include filter/skip logic where appropriate',
        'Design demographic questions',
        'Order questions logically (funnel approach)',
        'Include attention checks and quality indicators',
        'Estimate completion time',
        'Generate draft questionnaire document'
      ],
      outputFormat: 'JSON with totalQuestions, sections, questionTypes, estimatedDuration, instrumentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalQuestions', 'sections', 'artifacts'],
      properties: {
        totalQuestions: { type: 'number' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              questionCount: { type: 'number' },
              constructs: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        questionTypes: { type: 'object' },
        estimatedDuration: { type: 'string' },
        attentionChecks: { type: 'number' },
        instrumentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'survey-design', 'questionnaire']
}));

// Task 3: Sampling Strategy
export const samplingStrategyTask = defineTask('sampling-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop sampling strategy',
  agent: {
    name: 'sampling-specialist',
    prompt: {
      role: 'survey sampling statistician',
      task: 'Develop comprehensive sampling strategy for target population',
      context: args,
      instructions: [
        'Define target population clearly',
        'Identify available sampling frame(s)',
        'Select sampling method (simple random, stratified, cluster, multistage)',
        'Calculate required sample size for target margin of error',
        'Account for expected response rate',
        'Design stratification scheme if using stratified sampling',
        'Plan oversampling for key subgroups if needed',
        'Document coverage and sampling errors',
        'Calculate design effect if using complex sampling',
        'Generate sampling plan document'
      ],
      outputFormat: 'JSON with method, requiredSampleSize, samplingFrame, marginOfError, designEffect, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'requiredSampleSize', 'marginOfError', 'artifacts'],
      properties: {
        method: { type: 'string' },
        requiredSampleSize: { type: 'number' },
        samplingFrame: { type: 'string' },
        marginOfError: { type: 'number' },
        confidenceLevel: { type: 'number' },
        designEffect: { type: 'number' },
        stratification: {
          type: 'object',
          properties: {
            variables: { type: 'array', items: { type: 'string' } },
            allocations: { type: 'object' }
          }
        },
        coverageIssues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'survey-design', 'sampling']
}));

// Task 4: Mode Selection
export const modeSelectionTask = defineTask('mode-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select survey administration mode',
  agent: {
    name: 'mode-selection-specialist',
    prompt: {
      role: 'survey administration expert',
      task: 'Select optimal survey administration mode based on population and constraints',
      context: args,
      instructions: [
        'Evaluate web/online survey suitability',
        'Evaluate telephone survey suitability (CATI)',
        'Evaluate mail survey suitability',
        'Evaluate in-person interview suitability',
        'Consider mixed-mode designs',
        'Assess mode effects on response quality',
        'Consider sensitive question handling by mode',
        'Evaluate cost-effectiveness of each mode',
        'Consider population internet/phone access',
        'Document mode selection rationale'
      ],
      outputFormat: 'JSON with selectedMode, rationale, modeComparison, mixedModeDesign, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedMode', 'rationale', 'artifacts'],
      properties: {
        selectedMode: { type: 'string' },
        rationale: { type: 'string' },
        modeComparison: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mode: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              cost: { type: 'string' }
            }
          }
        },
        mixedModeDesign: { type: 'object' },
        modeEffects: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'survey-design', 'mode-selection']
}));

// Task 5: Response Optimization
export const responseOptimizationTask = defineTask('response-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop response optimization strategies',
  agent: {
    name: 'response-optimization-specialist',
    prompt: {
      role: 'survey response expert',
      task: 'Develop strategies to maximize response rate and data quality',
      context: args,
      instructions: [
        'Design pre-notification strategy',
        'Develop compelling invitation/cover letter',
        'Plan reminder/follow-up schedule',
        'Design incentive strategy (if applicable)',
        'Optimize survey length and burden',
        'Design respondent-friendly formatting',
        'Plan for nonresponse bias assessment',
        'Develop refusal conversion strategies',
        'Design paradata collection for quality monitoring',
        'Estimate expected response rate'
      ],
      outputFormat: 'JSON with strategies, expectedResponseRate, reminderSchedule, incentiveDesign, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'expectedResponseRate', 'artifacts'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strategy: { type: 'string' },
              description: { type: 'string' },
              expectedImpact: { type: 'string' }
            }
          }
        },
        expectedResponseRate: { type: 'number' },
        reminderSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              contact: { type: 'string' },
              timing: { type: 'string' },
              mode: { type: 'string' }
            }
          }
        },
        incentiveDesign: { type: 'object' },
        nonresponseBiasAssessment: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'survey-design', 'response-optimization']
}));

// Task 6: Pilot Testing Plan
export const pilotTestingPlanTask = defineTask('pilot-testing-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop pilot testing plan',
  agent: {
    name: 'pilot-testing-specialist',
    prompt: {
      role: 'survey pretesting expert',
      task: 'Develop comprehensive pilot testing plan for the survey',
      context: args,
      instructions: [
        'Design cognitive interviewing protocol',
        'Plan expert review process',
        'Design pilot survey administration',
        'Plan for item analysis and reliability testing',
        'Design field test with representative sample',
        'Plan for timing and completion rate assessment',
        'Design feedback collection from pilot respondents',
        'Plan for questionnaire revision process',
        'Document criteria for moving to full deployment',
        'Generate pilot testing protocol document'
      ],
      outputFormat: 'JSON with pilotPhases, cognitiveInterviewProtocol, pilotSampleSize, evaluationCriteria, planPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pilotPhases', 'evaluationCriteria', 'artifacts'],
      properties: {
        pilotPhases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              method: { type: 'string' },
              sampleSize: { type: 'number' },
              objectives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        cognitiveInterviewProtocol: { type: 'string' },
        pilotSampleSize: { type: 'number' },
        evaluationCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              threshold: { type: 'string' }
            }
          }
        },
        planPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'survey-design', 'pilot-testing']
}));

// Task 7: Survey Quality Scoring
export const surveyQualityScoringTask = defineTask('survey-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score survey design quality',
  agent: {
    name: 'survey-quality-assessor',
    prompt: {
      role: 'senior survey methodologist and reviewer',
      task: 'Assess overall survey design quality and completeness',
      context: args,
      instructions: [
        'Evaluate objectives-measurement alignment (weight: 15%)',
        'Assess questionnaire design quality (weight: 25%)',
        'Evaluate sampling strategy rigor (weight: 20%)',
        'Assess mode selection appropriateness (weight: 15%)',
        'Evaluate response optimization plan (weight: 15%)',
        'Assess pilot testing plan completeness (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify critical gaps and weaknesses',
        'Provide specific recommendations for improvement'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, strengths, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            objectivesAlignment: { type: 'number' },
            questionnaireDesign: { type: 'number' },
            samplingStrategy: { type: 'number' },
            modeSelection: { type: 'number' },
            responseOptimization: { type: 'number' },
            pilotPlan: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'survey-design', 'quality-scoring']
}));
