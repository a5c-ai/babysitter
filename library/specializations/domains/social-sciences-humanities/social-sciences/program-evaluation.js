/**
 * @process social-sciences/program-evaluation
 * @description Design and conduct formative, summative, and developmental evaluations of social programs including logic models, outcome measurement, and implementation fidelity assessment
 * @inputs { program: object, evaluationType: string, stakeholders: array, outputDir: string }
 * @outputs { success: boolean, evaluationFindings: object, recommendations: array, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-006 (program-evaluation), SK-SS-010 (mixed-methods-integration)
 * @recommendedAgents AG-SS-004 (program-evaluation-specialist), AG-SS-008 (mixed-methods-research-coordinator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    program = {},
    evaluationType = 'summative',
    stakeholders = [],
    outputDir = 'program-evaluation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Program Evaluation process');

  // ============================================================================
  // PHASE 1: EVALUATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning evaluation');
  const evaluationPlan = await ctx.task(evaluationPlanningTask, {
    program,
    evaluationType,
    stakeholders,
    outputDir
  });

  artifacts.push(...evaluationPlan.artifacts);

  // ============================================================================
  // PHASE 2: PROGRAM THEORY
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing program theory');
  const programTheory = await ctx.task(programTheoryTask, {
    program,
    evaluationPlan,
    outputDir
  });

  artifacts.push(...programTheory.artifacts);

  // ============================================================================
  // PHASE 3: IMPLEMENTATION ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing implementation fidelity');
  const implementationAssessment = await ctx.task(implementationFidelityTask, {
    program,
    programTheory,
    outputDir
  });

  artifacts.push(...implementationAssessment.artifacts);

  // ============================================================================
  // PHASE 4: OUTCOME MEASUREMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Measuring outcomes');
  const outcomeMeasurement = await ctx.task(outcomeMeasurementTask, {
    program,
    programTheory,
    evaluationType,
    outputDir
  });

  artifacts.push(...outcomeMeasurement.artifacts);

  // ============================================================================
  // PHASE 5: DATA ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing evaluation data');
  const dataAnalysis = await ctx.task(evaluationDataAnalysisTask, {
    implementationAssessment,
    outcomeMeasurement,
    outputDir
  });

  artifacts.push(...dataAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: FINDINGS AND RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing findings and recommendations');
  const findingsRecommendations = await ctx.task(evaluationFindingsTask, {
    evaluationPlan,
    programTheory,
    implementationAssessment,
    outcomeMeasurement,
    dataAnalysis,
    outputDir
  });

  artifacts.push(...findingsRecommendations.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring evaluation quality');
  const qualityScore = await ctx.task(evaluationQualityScoringTask, {
    evaluationPlan,
    programTheory,
    implementationAssessment,
    outcomeMeasurement,
    dataAnalysis,
    findingsRecommendations,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const evalScore = qualityScore.overallScore;
  const qualityMet = evalScore >= 80;

  // Breakpoint: Review program evaluation
  await ctx.breakpoint({
    question: `Program evaluation complete. Quality score: ${evalScore}/100. ${qualityMet ? 'Evaluation meets quality standards!' : 'Evaluation may need refinement.'} Review and approve?`,
    title: 'Program Evaluation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        evalScore,
        qualityMet,
        evaluationType,
        implementationFidelity: implementationAssessment.fidelityScore,
        outcomesAchieved: outcomeMeasurement.outcomesAchieved
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: evalScore,
    qualityMet,
    evaluationFindings: {
      implementation: implementationAssessment.findings,
      outcomes: outcomeMeasurement.outcomes,
      overallAssessment: findingsRecommendations.assessment
    },
    recommendations: findingsRecommendations.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/program-evaluation',
      timestamp: startTime,
      evaluationType,
      outputDir
    }
  };
}

// Task definitions follow similar pattern - abbreviated for space
export const evaluationPlanningTask = defineTask('evaluation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan evaluation',
  agent: {
    name: 'evaluation-planner',
    prompt: {
      role: 'program evaluator',
      task: 'Develop comprehensive evaluation plan',
      context: args,
      instructions: [
        'Define evaluation purpose and questions',
        'Identify key stakeholders and their needs',
        'Select evaluation design',
        'Plan data collection methods',
        'Develop evaluation timeline',
        'Plan stakeholder engagement',
        'Address ethical considerations',
        'Generate evaluation plan document'
      ],
      outputFormat: 'JSON with purpose, questions, design, methods, timeline, planPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['purpose', 'questions', 'design', 'artifacts'],
      properties: {
        purpose: { type: 'string' },
        questions: { type: 'array', items: { type: 'string' } },
        design: { type: 'string' },
        methods: { type: 'array', items: { type: 'string' } },
        timeline: { type: 'object' },
        planPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'program-evaluation', 'planning']
}));

export const programTheoryTask = defineTask('program-theory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop program theory',
  agent: {
    name: 'program-theorist',
    prompt: {
      role: 'program theory specialist',
      task: 'Develop program theory and logic model',
      context: args,
      instructions: [
        'Articulate program theory of change',
        'Develop comprehensive logic model',
        'Identify program components',
        'Specify expected outcomes at each level',
        'Identify assumptions',
        'Document contextual factors',
        'Create visual theory diagram',
        'Generate program theory documentation'
      ],
      outputFormat: 'JSON with theoryOfChange, logicModel, components, outcomes, assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['theoryOfChange', 'logicModel', 'artifacts'],
      properties: {
        theoryOfChange: { type: 'string' },
        logicModel: { type: 'object' },
        components: { type: 'array' },
        outcomes: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'program-evaluation', 'theory']
}));

export const implementationFidelityTask = defineTask('implementation-fidelity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess implementation fidelity',
  agent: {
    name: 'implementation-assessor',
    prompt: {
      role: 'implementation evaluation specialist',
      task: 'Assess program implementation fidelity',
      context: args,
      instructions: [
        'Define fidelity dimensions (adherence, dose, quality)',
        'Develop fidelity measures',
        'Assess program adherence to model',
        'Measure service delivery dose',
        'Assess quality of delivery',
        'Identify adaptations made',
        'Calculate overall fidelity score',
        'Generate implementation assessment report'
      ],
      outputFormat: 'JSON with fidelityScore, adherence, dose, quality, adaptations, findings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['fidelityScore', 'findings', 'artifacts'],
      properties: {
        fidelityScore: { type: 'number' },
        adherence: { type: 'object' },
        dose: { type: 'object' },
        quality: { type: 'object' },
        adaptations: { type: 'array', items: { type: 'string' } },
        findings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'program-evaluation', 'implementation']
}));

export const outcomeMeasurementTask = defineTask('outcome-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Measure outcomes',
  agent: {
    name: 'outcome-measurer',
    prompt: {
      role: 'outcome evaluation specialist',
      task: 'Measure program outcomes',
      context: args,
      instructions: [
        'Operationalize outcome constructs',
        'Select or develop outcome measures',
        'Collect outcome data',
        'Assess outcome achievement',
        'Compare to targets/benchmarks',
        'Analyze outcome patterns',
        'Document outcome evidence',
        'Generate outcome measurement report'
      ],
      outputFormat: 'JSON with outcomes, outcomesAchieved, outcomeData, comparison, patterns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['outcomes', 'outcomesAchieved', 'artifacts'],
      properties: {
        outcomes: { type: 'array' },
        outcomesAchieved: { type: 'number' },
        outcomeData: { type: 'object' },
        comparison: { type: 'object' },
        patterns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'program-evaluation', 'outcomes']
}));

export const evaluationDataAnalysisTask = defineTask('evaluation-data-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze evaluation data',
  agent: {
    name: 'evaluation-analyst',
    prompt: {
      role: 'evaluation data analyst',
      task: 'Analyze evaluation data',
      context: args,
      instructions: [
        'Integrate implementation and outcome data',
        'Conduct quantitative analyses',
        'Conduct qualitative analyses',
        'Link implementation to outcomes',
        'Identify moderating factors',
        'Assess unintended outcomes',
        'Triangulate findings',
        'Generate analysis report'
      ],
      outputFormat: 'JSON with quantitativeFindings, qualitativeFindings, implementationOutcomeLink, moderators, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['quantitativeFindings', 'qualitativeFindings', 'artifacts'],
      properties: {
        quantitativeFindings: { type: 'object' },
        qualitativeFindings: { type: 'object' },
        implementationOutcomeLink: { type: 'object' },
        moderators: { type: 'array', items: { type: 'string' } },
        unintendedOutcomes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'program-evaluation', 'analysis']
}));

export const evaluationFindingsTask = defineTask('evaluation-findings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop findings and recommendations',
  agent: {
    name: 'findings-developer',
    prompt: {
      role: 'evaluation specialist',
      task: 'Synthesize findings and develop recommendations',
      context: args,
      instructions: [
        'Synthesize all evaluation findings',
        'Develop overall assessment',
        'Identify key strengths',
        'Identify areas for improvement',
        'Develop actionable recommendations',
        'Prioritize recommendations',
        'Consider implementation feasibility',
        'Generate evaluation report'
      ],
      outputFormat: 'JSON with assessment, strengths, improvements, recommendations, reportPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'recommendations', 'artifacts'],
      properties: {
        assessment: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'program-evaluation', 'findings']
}));

export const evaluationQualityScoringTask = defineTask('evaluation-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score evaluation quality',
  agent: {
    name: 'evaluation-quality-reviewer',
    prompt: {
      role: 'evaluation methodologist',
      task: 'Assess program evaluation quality',
      context: args,
      instructions: [
        'Evaluate planning thoroughness (weight: 15%)',
        'Assess program theory quality (weight: 15%)',
        'Evaluate implementation assessment rigor (weight: 20%)',
        'Assess outcome measurement validity (weight: 20%)',
        'Evaluate data analysis quality (weight: 15%)',
        'Assess findings and recommendations (weight: 15%)',
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
        componentScores: { type: 'object' },
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
  labels: ['agent', 'program-evaluation', 'quality-scoring']
}));
