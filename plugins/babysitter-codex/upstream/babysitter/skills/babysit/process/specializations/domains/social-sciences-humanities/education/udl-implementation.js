/**
 * @process education/udl-implementation
 * @description Applying Universal Design for Learning principles to provide multiple means of engagement, representation, and action/expression for diverse learners
 * @inputs { courseName: string, learnerProfile: object, contentOutline: object, constraints: object }
 * @outputs { success: boolean, udlPlan: object, engagementStrategies: array, representationStrategies: array, actionExpressionStrategies: array, artifacts: array }
 * @recommendedSkills SK-EDU-006 (multimedia-learning-design), SK-EDU-010 (accessibility-compliance-auditing), SK-EDU-014 (learning-transfer-design)
 * @recommendedAgents AG-EDU-008 (accessibility-udl-specialist), AG-EDU-010 (learning-experience-designer)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    courseName = 'Course',
    learnerProfile = {},
    contentOutline = {},
    constraints = {},
    outputDir = 'udl-implementation-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting UDL Implementation for ${courseName}`);

  // ============================================================================
  // LEARNER VARIABILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Analyzing learner variability');
  const learnerAnalysis = await ctx.task(learnerVariabilityAnalysisTask, {
    courseName,
    learnerProfile,
    outputDir
  });

  artifacts.push(...learnerAnalysis.artifacts);

  // ============================================================================
  // ENGAGEMENT STRATEGIES (WHY OF LEARNING)
  // ============================================================================

  ctx.log('info', 'Developing engagement strategies (Principle 1)');
  const engagementStrategies = await ctx.task(engagementStrategiesTask, {
    courseName,
    learnerAnalysis: learnerAnalysis.analysis,
    contentOutline,
    outputDir
  });

  artifacts.push(...engagementStrategies.artifacts);

  // ============================================================================
  // REPRESENTATION STRATEGIES (WHAT OF LEARNING)
  // ============================================================================

  ctx.log('info', 'Developing representation strategies (Principle 2)');
  const representationStrategies = await ctx.task(representationStrategiesTask, {
    courseName,
    learnerAnalysis: learnerAnalysis.analysis,
    contentOutline,
    outputDir
  });

  artifacts.push(...representationStrategies.artifacts);

  // ============================================================================
  // ACTION AND EXPRESSION STRATEGIES (HOW OF LEARNING)
  // ============================================================================

  ctx.log('info', 'Developing action and expression strategies (Principle 3)');
  const actionExpressionStrategies = await ctx.task(actionExpressionStrategiesTask, {
    courseName,
    learnerAnalysis: learnerAnalysis.analysis,
    contentOutline,
    constraints,
    outputDir
  });

  artifacts.push(...actionExpressionStrategies.artifacts);

  // ============================================================================
  // UDL IMPLEMENTATION PLAN
  // ============================================================================

  ctx.log('info', 'Creating UDL implementation plan');
  const implementationPlan = await ctx.task(udlImplementationPlanTask, {
    courseName,
    engagementStrategies: engagementStrategies.strategies,
    representationStrategies: representationStrategies.strategies,
    actionExpressionStrategies: actionExpressionStrategies.strategies,
    constraints,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // ============================================================================
  // BARRIER ANALYSIS AND REMOVAL
  // ============================================================================

  ctx.log('info', 'Analyzing and addressing learning barriers');
  const barrierAnalysis = await ctx.task(barrierAnalysisTask, {
    courseName,
    learnerAnalysis: learnerAnalysis.analysis,
    implementationPlan: implementationPlan.plan,
    outputDir
  });

  artifacts.push(...barrierAnalysis.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring UDL implementation quality');
  const qualityScore = await ctx.task(udlQualityScoringTask, {
    courseName,
    engagementStrategies,
    representationStrategies,
    actionExpressionStrategies,
    implementationPlan,
    barrierAnalysis,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review UDL implementation
  await ctx.breakpoint({
    question: `UDL implementation complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'UDL Implementation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        courseName,
        engagementStrategiesCount: engagementStrategies.strategies?.length || 0,
        representationStrategiesCount: representationStrategies.strategies?.length || 0,
        actionExpressionStrategiesCount: actionExpressionStrategies.strategies?.length || 0,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    courseName,
    qualityScore: overallScore,
    qualityMet,
    udlPlan: implementationPlan.plan,
    engagementStrategies: engagementStrategies.strategies,
    representationStrategies: representationStrategies.strategies,
    actionExpressionStrategies: actionExpressionStrategies.strategies,
    barrierRemoval: barrierAnalysis.removalStrategies,
    artifacts,
    duration,
    metadata: {
      processId: 'education/udl-implementation',
      timestamp: startTime,
      courseName,
      outputDir
    }
  };
}

// Task 1: Learner Variability Analysis
export const learnerVariabilityAnalysisTask = defineTask('learner-variability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze learner variability',
  agent: {
    name: 'learner-analyst',
    prompt: {
      role: 'UDL learner variability specialist',
      task: 'Analyze learner variability to inform UDL implementation',
      context: args,
      instructions: [
        'Analyze affective network variability (motivation, interest)',
        'Analyze recognition network variability (perception, comprehension)',
        'Analyze strategic network variability (planning, execution)',
        'Identify potential learning barriers',
        'Document learner strengths and challenges',
        'Consider cultural and linguistic diversity',
        'Document technology access variability',
        'Create learner variability profile',
        'Generate learner analysis document'
      ],
      outputFormat: 'JSON with analysis, affectiveVariability, recognitionVariability, strategicVariability, barriers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        affectiveVariability: { type: 'array' },
        recognitionVariability: { type: 'array' },
        strategicVariability: { type: 'array' },
        barriers: { type: 'array' },
        strengths: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'udl', 'learner-variability', 'analysis']
}));

// Task 2: Engagement Strategies (Principle 1)
export const engagementStrategiesTask = defineTask('engagement-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop engagement strategies (Principle 1)',
  agent: {
    name: 'engagement-designer',
    prompt: {
      role: 'UDL engagement specialist',
      task: 'Develop multiple means of engagement following UDL Principle 1',
      context: args,
      instructions: [
        'Provide options for recruiting interest (7.1, 7.2, 7.3)',
        'Provide options for sustaining effort (8.1, 8.2, 8.3, 8.4)',
        'Provide options for self-regulation (9.1, 9.2, 9.3)',
        'Design choice and autonomy opportunities',
        'Plan relevance and authenticity connections',
        'Design collaborative learning options',
        'Create mastery-oriented feedback strategies',
        'Develop self-assessment tools',
        'Generate engagement strategies document'
      ],
      outputFormat: 'JSON with strategies, recruitingInterest, sustainingEffort, selfRegulation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: { type: 'array' },
        recruitingInterest: { type: 'array' },
        sustainingEffort: { type: 'array' },
        selfRegulation: { type: 'array' },
        choiceOptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'udl', 'engagement', 'principle1']
}));

// Task 3: Representation Strategies (Principle 2)
export const representationStrategiesTask = defineTask('representation-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop representation strategies (Principle 2)',
  agent: {
    name: 'representation-designer',
    prompt: {
      role: 'UDL representation specialist',
      task: 'Develop multiple means of representation following UDL Principle 2',
      context: args,
      instructions: [
        'Provide options for perception (1.1, 1.2, 1.3)',
        'Provide options for language and symbols (2.1, 2.2, 2.3, 2.4, 2.5)',
        'Provide options for comprehension (3.1, 3.2, 3.3, 3.4)',
        'Design multimodal content presentation',
        'Create alternative formats for information',
        'Plan vocabulary and symbol support',
        'Design background knowledge activation',
        'Create visual representations',
        'Generate representation strategies document'
      ],
      outputFormat: 'JSON with strategies, perception, languageSymbols, comprehension, multimodal, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: { type: 'array' },
        perception: { type: 'array' },
        languageSymbols: { type: 'array' },
        comprehension: { type: 'array' },
        multimodal: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'udl', 'representation', 'principle2']
}));

// Task 4: Action and Expression Strategies (Principle 3)
export const actionExpressionStrategiesTask = defineTask('action-expression-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop action and expression strategies (Principle 3)',
  agent: {
    name: 'action-expression-designer',
    prompt: {
      role: 'UDL action and expression specialist',
      task: 'Develop multiple means of action and expression following UDL Principle 3',
      context: args,
      instructions: [
        'Provide options for physical action (4.1, 4.2)',
        'Provide options for expression and communication (5.1, 5.2, 5.3)',
        'Provide options for executive functions (6.1, 6.2, 6.3, 6.4)',
        'Design alternative response formats',
        'Create scaffolded expression options',
        'Plan assistive technology integration',
        'Design goal-setting supports',
        'Create planning and organization tools',
        'Generate action and expression strategies document'
      ],
      outputFormat: 'JSON with strategies, physicalAction, expressionCommunication, executiveFunctions, alternatives, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: { type: 'array' },
        physicalAction: { type: 'array' },
        expressionCommunication: { type: 'array' },
        executiveFunctions: { type: 'array' },
        alternatives: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'udl', 'action-expression', 'principle3']
}));

// Task 5: UDL Implementation Plan
export const udlImplementationPlanTask = defineTask('udl-implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create UDL implementation plan',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'UDL implementation specialist',
      task: 'Create comprehensive UDL implementation plan',
      context: args,
      instructions: [
        'Integrate all three UDL principles',
        'Map strategies to course content',
        'Create implementation timeline',
        'Identify resource requirements',
        'Plan technology integration',
        'Create teacher/facilitator guide',
        'Design progress monitoring approach',
        'Document implementation priorities',
        'Generate implementation plan document'
      ],
      outputFormat: 'JSON with plan, timeline, resources, technology, facilitatorGuide, monitoring, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        timeline: { type: 'object' },
        resources: { type: 'array' },
        technology: { type: 'array' },
        facilitatorGuide: { type: 'object' },
        monitoring: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'udl', 'implementation', 'planning']
}));

// Task 6: Barrier Analysis
export const barrierAnalysisTask = defineTask('barrier-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze and address learning barriers',
  agent: {
    name: 'barrier-analyst',
    prompt: {
      role: 'learning barrier specialist',
      task: 'Analyze potential barriers and develop removal strategies',
      context: args,
      instructions: [
        'Identify curriculum barriers',
        'Identify assessment barriers',
        'Identify technology barriers',
        'Identify physical environment barriers',
        'Develop barrier removal strategies',
        'Prioritize barrier removal by impact',
        'Create accommodation recommendations',
        'Design universal solutions vs individual accommodations',
        'Generate barrier analysis document'
      ],
      outputFormat: 'JSON with barriers, removalStrategies, accommodations, universalSolutions, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['barriers', 'removalStrategies', 'artifacts'],
      properties: {
        barriers: { type: 'array' },
        removalStrategies: { type: 'array' },
        accommodations: { type: 'array' },
        universalSolutions: { type: 'array' },
        priorities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'udl', 'barriers', 'analysis']
}));

// Task 7: Quality Scoring
export const udlQualityScoringTask = defineTask('udl-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score UDL implementation quality',
  agent: {
    name: 'udl-quality-auditor',
    prompt: {
      role: 'UDL quality auditor',
      task: 'Assess UDL implementation quality',
      context: args,
      instructions: [
        'Evaluate engagement strategies coverage (weight: 25%)',
        'Assess representation strategies coverage (weight: 25%)',
        'Review action/expression strategies coverage (weight: 25%)',
        'Evaluate implementation plan feasibility (weight: 15%)',
        'Assess barrier removal effectiveness (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify UDL coverage gaps',
        'Provide improvement recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: { type: 'object' },
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
  labels: ['agent', 'udl', 'quality-scoring', 'validation']
}));
