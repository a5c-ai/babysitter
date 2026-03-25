/**
 * @process education/tpack-integration
 * @description Building educator capacity in Technological Pedagogical Content Knowledge for effective technology integration in teaching
 * @inputs { educatorProfile: object, contentArea: string, technologyTools: array, learningContext: object }
 * @outputs { success: boolean, tpackPlan: object, integrationStrategies: array, professionalDevelopment: object, artifacts: array }
 * @recommendedSkills SK-EDU-012 (facilitation-workshop-delivery), SK-EDU-007 (lms-configuration-administration)
 * @recommendedAgents AG-EDU-006 (faculty-development-facilitator), AG-EDU-005 (learning-technology-administrator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    educatorProfile = {},
    contentArea = '',
    technologyTools = [],
    learningContext = {},
    outputDir = 'tpack-integration-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting TPACK Integration Training for ${contentArea}`);

  // ============================================================================
  // TPACK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Assessing current TPACK knowledge');
  const tpackAssessment = await ctx.task(tpackAssessmentTask, {
    educatorProfile,
    contentArea,
    technologyTools,
    outputDir
  });

  artifacts.push(...tpackAssessment.artifacts);

  // ============================================================================
  // CONTENT KNOWLEDGE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Analyzing content knowledge integration needs');
  const contentAnalysis = await ctx.task(contentKnowledgeAnalysisTask, {
    contentArea,
    learningContext,
    tpackAssessment: tpackAssessment.assessment,
    outputDir
  });

  artifacts.push(...contentAnalysis.artifacts);

  // ============================================================================
  // PEDAGOGICAL KNOWLEDGE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Developing pedagogical knowledge strategies');
  const pedagogicalDevelopment = await ctx.task(pedagogicalKnowledgeTask, {
    contentArea,
    learningContext,
    tpackAssessment: tpackAssessment.assessment,
    outputDir
  });

  artifacts.push(...pedagogicalDevelopment.artifacts);

  // ============================================================================
  // TECHNOLOGICAL KNOWLEDGE BUILDING
  // ============================================================================

  ctx.log('info', 'Building technological knowledge');
  const technologicalKnowledge = await ctx.task(technologicalKnowledgeTask, {
    technologyTools,
    educatorProfile,
    tpackAssessment: tpackAssessment.assessment,
    outputDir
  });

  artifacts.push(...technologicalKnowledge.artifacts);

  // ============================================================================
  // TPACK INTEGRATION STRATEGIES
  // ============================================================================

  ctx.log('info', 'Developing TPACK integration strategies');
  const integrationStrategies = await ctx.task(tpackIntegrationStrategiesTask, {
    contentArea,
    contentAnalysis: contentAnalysis.analysis,
    pedagogicalDevelopment: pedagogicalDevelopment.strategies,
    technologicalKnowledge: technologicalKnowledge.knowledge,
    learningContext,
    outputDir
  });

  artifacts.push(...integrationStrategies.artifacts);

  // ============================================================================
  // PROFESSIONAL DEVELOPMENT PLAN
  // ============================================================================

  ctx.log('info', 'Creating professional development plan');
  const pdPlan = await ctx.task(tpackPdPlanTask, {
    educatorProfile,
    tpackAssessment: tpackAssessment.assessment,
    integrationStrategies: integrationStrategies.strategies,
    outputDir
  });

  artifacts.push(...pdPlan.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring TPACK integration quality');
  const qualityScore = await ctx.task(tpackQualityScoringTask, {
    contentArea,
    tpackAssessment,
    contentAnalysis,
    pedagogicalDevelopment,
    technologicalKnowledge,
    integrationStrategies,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review TPACK plan
  await ctx.breakpoint({
    question: `TPACK integration complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'TPACK Integration Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        contentArea,
        totalStrategies: integrationStrategies.strategies?.length || 0,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    contentArea,
    qualityScore: overallScore,
    qualityMet,
    tpackPlan: {
      assessment: tpackAssessment.assessment,
      gaps: tpackAssessment.gaps
    },
    integrationStrategies: integrationStrategies.strategies,
    professionalDevelopment: pdPlan.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'education/tpack-integration',
      timestamp: startTime,
      contentArea,
      outputDir
    }
  };
}

// Task definitions
export const tpackAssessmentTask = defineTask('tpack-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess current TPACK knowledge',
  agent: {
    name: 'tpack-assessor',
    prompt: {
      role: 'TPACK assessment specialist',
      task: 'Assess educator TPACK knowledge levels',
      context: args,
      instructions: [
        'Assess Content Knowledge (CK) level',
        'Assess Pedagogical Knowledge (PK) level',
        'Assess Technological Knowledge (TK) level',
        'Assess PCK intersection',
        'Assess TCK intersection',
        'Assess TPK intersection',
        'Assess overall TPACK integration',
        'Identify knowledge gaps',
        'Generate TPACK assessment document'
      ],
      outputFormat: 'JSON with assessment, knowledgeLevels, gaps, strengths, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'gaps', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        knowledgeLevels: { type: 'object' },
        gaps: { type: 'array' },
        strengths: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tpack', 'assessment', 'knowledge']
}));

export const contentKnowledgeAnalysisTask = defineTask('content-knowledge-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze content knowledge integration needs',
  agent: {
    name: 'content-analyst',
    prompt: {
      role: 'content knowledge specialist',
      task: 'Analyze content knowledge for technology integration',
      context: args,
      instructions: [
        'Identify key content concepts',
        'Analyze content representations',
        'Identify difficult-to-teach concepts',
        'Find technology enhancement opportunities',
        'Map content to learning objectives',
        'Identify misconception points',
        'Plan content visualization needs',
        'Generate content analysis document'
      ],
      outputFormat: 'JSON with analysis, concepts, opportunities, visualizations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        concepts: { type: 'array' },
        opportunities: { type: 'array' },
        visualizations: { type: 'array' },
        misconceptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tpack', 'content-knowledge', 'analysis']
}));

export const pedagogicalKnowledgeTask = defineTask('pedagogical-knowledge', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop pedagogical knowledge strategies',
  agent: {
    name: 'pedagogy-specialist',
    prompt: {
      role: 'pedagogical knowledge specialist',
      task: 'Develop pedagogical strategies for technology integration',
      context: args,
      instructions: [
        'Identify appropriate teaching strategies',
        'Select assessment approaches',
        'Plan differentiation strategies',
        'Design student engagement methods',
        'Plan classroom management with technology',
        'Design formative assessment techniques',
        'Plan collaborative learning approaches',
        'Generate pedagogical strategies document'
      ],
      outputFormat: 'JSON with strategies, approaches, differentiation, engagement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: { type: 'array' },
        approaches: { type: 'array' },
        differentiation: { type: 'array' },
        engagement: { type: 'array' },
        management: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tpack', 'pedagogical-knowledge', 'strategies']
}));

export const technologicalKnowledgeTask = defineTask('technological-knowledge', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build technological knowledge',
  agent: {
    name: 'tech-specialist',
    prompt: {
      role: 'educational technology specialist',
      task: 'Build technological knowledge for teaching',
      context: args,
      instructions: [
        'Assess technology skill levels',
        'Identify priority tools to learn',
        'Plan technology skill building',
        'Create tool comparison guides',
        'Plan troubleshooting approaches',
        'Design digital citizenship integration',
        'Plan data privacy considerations',
        'Generate technology knowledge document'
      ],
      outputFormat: 'JSON with knowledge, skills, tools, priorities, training, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['knowledge', 'artifacts'],
      properties: {
        knowledge: { type: 'object' },
        skills: { type: 'array' },
        tools: { type: 'array' },
        priorities: { type: 'array' },
        training: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tpack', 'technological-knowledge', 'skills']
}));

export const tpackIntegrationStrategiesTask = defineTask('tpack-integration-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop TPACK integration strategies',
  agent: {
    name: 'integration-strategist',
    prompt: {
      role: 'TPACK integration specialist',
      task: 'Develop strategies integrating all TPACK domains',
      context: args,
      instructions: [
        'Design technology-enhanced lessons',
        'Create PCK integration examples',
        'Develop TCK integration strategies',
        'Plan TPK implementation approaches',
        'Design full TPACK integration activities',
        'Create lesson transformation examples',
        'Plan gradual integration approach',
        'Generate integration strategies document'
      ],
      outputFormat: 'JSON with strategies, lessons, examples, transformation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: { type: 'array' },
        lessons: { type: 'array' },
        examples: { type: 'array' },
        transformation: { type: 'array' },
        gradualApproach: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tpack', 'integration', 'strategies']
}));

export const tpackPdPlanTask = defineTask('tpack-pd-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create professional development plan',
  agent: {
    name: 'pd-planner',
    prompt: {
      role: 'professional development planner',
      task: 'Create TPACK professional development plan',
      context: args,
      instructions: [
        'Design learning pathway',
        'Create milestone checkpoints',
        'Plan practice opportunities',
        'Design peer collaboration activities',
        'Plan coaching/mentoring support',
        'Create resource recommendations',
        'Design progress monitoring',
        'Generate professional development plan'
      ],
      outputFormat: 'JSON with plan, pathway, milestones, practice, support, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        pathway: { type: 'array' },
        milestones: { type: 'array' },
        practice: { type: 'array' },
        support: { type: 'object' },
        monitoring: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'tpack', 'professional-development', 'planning']
}));

export const tpackQualityScoringTask = defineTask('tpack-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score TPACK integration quality',
  agent: {
    name: 'tpack-quality-auditor',
    prompt: {
      role: 'TPACK quality auditor',
      task: 'Assess TPACK integration quality',
      context: args,
      instructions: [
        'Evaluate assessment completeness (weight: 20%)',
        'Assess knowledge domain coverage (weight: 25%)',
        'Review integration strategy quality (weight: 30%)',
        'Evaluate PD plan feasibility (weight: 15%)',
        'Assess alignment with ISTE standards (weight: 10%)',
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
  labels: ['agent', 'tpack', 'quality-scoring', 'validation']
}));
