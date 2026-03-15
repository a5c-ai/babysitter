/**
 * @process education/kirkpatrick-evaluation
 * @description Comprehensive training evaluation measuring reaction (satisfaction), learning (knowledge gain), behavior (transfer), and results (business impact)
 * @inputs { programName: string, programDescription: object, stakeholders: array, evaluationScope: string, constraints: object }
 * @outputs { success: boolean, evaluationPlan: object, instruments: array, analysisFramework: object, artifacts: array }
 * @recommendedSkills SK-EDU-001 (learning-needs-analysis), SK-EDU-009 (learning-analytics-interpretation), SK-EDU-003 (assessment-item-development)
 * @recommendedAgents AG-EDU-007 (learning-evaluation-analyst)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    programName = 'Training Program',
    programDescription = {},
    stakeholders = [],
    evaluationScope = 'full',
    constraints = {},
    outputDir = 'kirkpatrick-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Kirkpatrick Four-Level Evaluation for ${programName}`);

  // ============================================================================
  // LEVEL 1: REACTION EVALUATION
  // ============================================================================

  ctx.log('info', 'Designing Level 1: Reaction evaluation');
  const level1Design = await ctx.task(level1ReactionTask, {
    programName,
    programDescription,
    outputDir
  });

  artifacts.push(...level1Design.artifacts);

  // ============================================================================
  // LEVEL 2: LEARNING EVALUATION
  // ============================================================================

  ctx.log('info', 'Designing Level 2: Learning evaluation');
  const level2Design = await ctx.task(level2LearningTask, {
    programName,
    programDescription,
    outputDir
  });

  artifacts.push(...level2Design.artifacts);

  // ============================================================================
  // LEVEL 3: BEHAVIOR EVALUATION
  // ============================================================================

  ctx.log('info', 'Designing Level 3: Behavior evaluation');
  const level3Design = await ctx.task(level3BehaviorTask, {
    programName,
    programDescription,
    stakeholders,
    outputDir
  });

  artifacts.push(...level3Design.artifacts);

  // ============================================================================
  // LEVEL 4: RESULTS EVALUATION
  // ============================================================================

  ctx.log('info', 'Designing Level 4: Results evaluation');
  const level4Design = await ctx.task(level4ResultsTask, {
    programName,
    programDescription,
    stakeholders,
    constraints,
    outputDir
  });

  artifacts.push(...level4Design.artifacts);

  // ============================================================================
  // ROI ANALYSIS FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Developing ROI analysis framework');
  const roiFramework = await ctx.task(roiAnalysisTask, {
    programName,
    level4Design: level4Design.design,
    constraints,
    outputDir
  });

  artifacts.push(...roiFramework.artifacts);

  // ============================================================================
  // COMPREHENSIVE EVALUATION PLAN
  // ============================================================================

  ctx.log('info', 'Creating comprehensive evaluation plan');
  const evaluationPlan = await ctx.task(comprehensiveEvaluationPlanTask, {
    programName,
    levels: {
      level1: level1Design,
      level2: level2Design,
      level3: level3Design,
      level4: level4Design
    },
    roiFramework,
    evaluationScope,
    outputDir
  });

  artifacts.push(...evaluationPlan.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring evaluation design quality');
  const qualityScore = await ctx.task(kirkpatrickQualityScoringTask, {
    programName,
    level1Design,
    level2Design,
    level3Design,
    level4Design,
    roiFramework,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review evaluation plan
  await ctx.breakpoint({
    question: `Kirkpatrick evaluation design complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'Kirkpatrick Evaluation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        programName,
        evaluationScope,
        totalInstruments: evaluationPlan.plan?.instruments?.length || 0,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    programName,
    qualityScore: overallScore,
    qualityMet,
    evaluationPlan: evaluationPlan.plan,
    instruments: {
      level1: level1Design.instruments,
      level2: level2Design.instruments,
      level3: level3Design.instruments,
      level4: level4Design.instruments
    },
    analysisFramework: {
      dataAnalysis: evaluationPlan.analysisFramework,
      roi: roiFramework.framework
    },
    artifacts,
    duration,
    metadata: {
      processId: 'education/kirkpatrick-evaluation',
      timestamp: startTime,
      programName,
      evaluationScope,
      outputDir
    }
  };
}

// Task definitions
export const level1ReactionTask = defineTask('level1-reaction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Level 1: Reaction evaluation',
  agent: {
    name: 'reaction-evaluator',
    prompt: {
      role: 'training evaluation specialist',
      task: 'Design Level 1 (Reaction) evaluation instruments and process',
      context: args,
      instructions: [
        'Design participant satisfaction survey',
        'Create facilitator effectiveness questions',
        'Design content relevance measures',
        'Create engagement level questions',
        'Design environment/logistics questions',
        'Plan real-time feedback collection',
        'Design post-session evaluation',
        'Create focus group protocol',
        'Generate Level 1 evaluation document'
      ],
      outputFormat: 'JSON with design, instruments, surveys, timing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'instruments', 'artifacts'],
      properties: {
        design: { type: 'object' },
        instruments: { type: 'array' },
        surveys: { type: 'array' },
        timing: { type: 'object' },
        focusGroups: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kirkpatrick', 'level1', 'reaction']
}));

export const level2LearningTask = defineTask('level2-learning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Level 2: Learning evaluation',
  agent: {
    name: 'learning-evaluator',
    prompt: {
      role: 'learning assessment specialist',
      task: 'Design Level 2 (Learning) evaluation instruments and process',
      context: args,
      instructions: [
        'Design pre-test assessment',
        'Create post-test assessment',
        'Design knowledge check items',
        'Create skill demonstration rubrics',
        'Design attitude assessment',
        'Plan confidence assessment',
        'Create self-assessment tools',
        'Design comparative analysis approach',
        'Generate Level 2 evaluation document'
      ],
      outputFormat: 'JSON with design, instruments, prePost, skills, attitudes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'instruments', 'artifacts'],
      properties: {
        design: { type: 'object' },
        instruments: { type: 'array' },
        prePost: { type: 'object' },
        skills: { type: 'array' },
        attitudes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kirkpatrick', 'level2', 'learning']
}));

export const level3BehaviorTask = defineTask('level3-behavior', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Level 3: Behavior evaluation',
  agent: {
    name: 'behavior-evaluator',
    prompt: {
      role: 'behavior change specialist',
      task: 'Design Level 3 (Behavior) evaluation instruments and process',
      context: args,
      instructions: [
        'Design on-the-job observation protocol',
        'Create behavior checklist',
        'Design supervisor assessment',
        'Create peer assessment tool',
        'Design self-report measure',
        'Plan action plan tracking',
        'Create transfer support assessment',
        'Design follow-up survey',
        'Generate Level 3 evaluation document'
      ],
      outputFormat: 'JSON with design, instruments, observations, timing, transfer, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'instruments', 'artifacts'],
      properties: {
        design: { type: 'object' },
        instruments: { type: 'array' },
        observations: { type: 'array' },
        timing: { type: 'object' },
        transfer: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kirkpatrick', 'level3', 'behavior']
}));

export const level4ResultsTask = defineTask('level4-results', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Level 4: Results evaluation',
  agent: {
    name: 'results-evaluator',
    prompt: {
      role: 'organizational impact specialist',
      task: 'Design Level 4 (Results) evaluation instruments and process',
      context: args,
      instructions: [
        'Identify key performance indicators',
        'Design leading indicators tracking',
        'Create lagging indicators measurement',
        'Design organizational metric tracking',
        'Plan data collection methods',
        'Create attribution approach',
        'Design control group comparison',
        'Plan longitudinal tracking',
        'Generate Level 4 evaluation document'
      ],
      outputFormat: 'JSON with design, instruments, kpis, metrics, attribution, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'instruments', 'kpis', 'artifacts'],
      properties: {
        design: { type: 'object' },
        instruments: { type: 'array' },
        kpis: { type: 'array' },
        metrics: { type: 'array' },
        attribution: { type: 'object' },
        longitudinal: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kirkpatrick', 'level4', 'results']
}));

export const roiAnalysisTask = defineTask('roi-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop ROI analysis framework',
  agent: {
    name: 'roi-analyst',
    prompt: {
      role: 'training ROI specialist',
      task: 'Develop ROI analysis framework for training evaluation',
      context: args,
      instructions: [
        'Define benefit categories',
        'Create cost tracking structure',
        'Design benefit monetization approach',
        'Plan intangible benefits documentation',
        'Create ROI calculation formula',
        'Design break-even analysis',
        'Plan sensitivity analysis',
        'Create ROI reporting template',
        'Generate ROI framework document'
      ],
      outputFormat: 'JSON with framework, benefits, costs, calculation, reporting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        benefits: { type: 'array' },
        costs: { type: 'array' },
        calculation: { type: 'object' },
        reporting: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kirkpatrick', 'roi', 'analysis']
}));

export const comprehensiveEvaluationPlanTask = defineTask('comprehensive-evaluation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create comprehensive evaluation plan',
  agent: {
    name: 'evaluation-planner',
    prompt: {
      role: 'evaluation program manager',
      task: 'Create comprehensive Kirkpatrick evaluation plan',
      context: args,
      instructions: [
        'Integrate all four evaluation levels',
        'Create evaluation timeline',
        'Compile all instruments',
        'Design data collection workflow',
        'Create analysis framework',
        'Design reporting structure',
        'Plan stakeholder communication',
        'Create evaluation management plan',
        'Generate comprehensive evaluation document'
      ],
      outputFormat: 'JSON with plan, timeline, instruments, workflow, analysisFramework, reporting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'timeline', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        timeline: { type: 'object' },
        instruments: { type: 'array' },
        workflow: { type: 'object' },
        analysisFramework: { type: 'object' },
        reporting: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kirkpatrick', 'evaluation-plan', 'comprehensive']
}));

export const kirkpatrickQualityScoringTask = defineTask('kirkpatrick-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score Kirkpatrick evaluation quality',
  agent: {
    name: 'kirkpatrick-quality-auditor',
    prompt: {
      role: 'training evaluation quality auditor',
      task: 'Assess Kirkpatrick evaluation design quality',
      context: args,
      instructions: [
        'Evaluate Level 1 design completeness (weight: 15%)',
        'Assess Level 2 assessment validity (weight: 25%)',
        'Review Level 3 behavior measurement (weight: 25%)',
        'Evaluate Level 4 results tracking (weight: 25%)',
        'Assess ROI framework quality (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify quality issues',
        'Provide improvement recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kirkpatrick', 'quality-scoring', 'validation']
}));
