/**
 * @process education/teaching-effectiveness-workshop
 * @description Developing professional development workshops to enhance pedagogical skills using evidence-based teaching practices
 * @inputs { workshopTopic: string, targetAudience: object, learningOutcomes: array, duration: string, constraints: object }
 * @outputs { success: boolean, workshopDesign: object, materials: array, facilitatorGuide: object, artifacts: array }
 * @recommendedSkills SK-EDU-012 (facilitation-workshop-delivery), SK-EDU-002 (learning-objectives-writing), SK-EDU-014 (learning-transfer-design)
 * @recommendedAgents AG-EDU-006 (faculty-development-facilitator), AG-EDU-001 (instructional-design-lead)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    workshopTopic = 'Teaching Effectiveness',
    targetAudience = {},
    learningOutcomes = [],
    duration = '3 hours',
    constraints = {},
    outputDir = 'workshop-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Teaching Effectiveness Workshop Design: ${workshopTopic}`);

  // ============================================================================
  // NEEDS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Conducting faculty needs assessment');
  const needsAssessment = await ctx.task(facultyNeedsAssessmentTask, {
    workshopTopic,
    targetAudience,
    learningOutcomes,
    outputDir
  });

  artifacts.push(...needsAssessment.artifacts);

  // ============================================================================
  // WORKSHOP DESIGN
  // ============================================================================

  ctx.log('info', 'Designing workshop structure');
  const workshopDesign = await ctx.task(workshopDesignTask, {
    workshopTopic,
    needsAssessment: needsAssessment.assessment,
    learningOutcomes,
    duration,
    outputDir
  });

  artifacts.push(...workshopDesign.artifacts);

  // ============================================================================
  // ACTIVITY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Developing workshop activities');
  const activityDevelopment = await ctx.task(workshopActivityDevelopmentTask, {
    workshopTopic,
    workshopDesign: workshopDesign.design,
    targetAudience,
    outputDir
  });

  artifacts.push(...activityDevelopment.artifacts);

  // ============================================================================
  // MATERIALS CREATION
  // ============================================================================

  ctx.log('info', 'Creating workshop materials');
  const materialsCreation = await ctx.task(workshopMaterialsCreationTask, {
    workshopTopic,
    workshopDesign: workshopDesign.design,
    activities: activityDevelopment.activities,
    outputDir
  });

  artifacts.push(...materialsCreation.artifacts);

  // ============================================================================
  // FACILITATOR GUIDE
  // ============================================================================

  ctx.log('info', 'Creating facilitator guide');
  const facilitatorGuide = await ctx.task(facilitatorGuideCreationTask, {
    workshopTopic,
    workshopDesign: workshopDesign.design,
    activities: activityDevelopment.activities,
    materials: materialsCreation.materials,
    outputDir
  });

  artifacts.push(...facilitatorGuide.artifacts);

  // ============================================================================
  // EVALUATION PLAN
  // ============================================================================

  ctx.log('info', 'Creating workshop evaluation plan');
  const evaluationPlan = await ctx.task(workshopEvaluationPlanTask, {
    workshopTopic,
    learningOutcomes,
    workshopDesign: workshopDesign.design,
    outputDir
  });

  artifacts.push(...evaluationPlan.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring workshop design quality');
  const qualityScore = await ctx.task(workshopQualityScoringTask, {
    workshopTopic,
    needsAssessment,
    workshopDesign,
    activityDevelopment,
    materialsCreation,
    facilitatorGuide,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review workshop design
  await ctx.breakpoint({
    question: `Workshop design complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'Teaching Effectiveness Workshop Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        workshopTopic,
        duration,
        totalActivities: activityDevelopment.activities?.length || 0,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration_ms = endTime - startTime;

  return {
    success: true,
    workshopTopic,
    qualityScore: overallScore,
    qualityMet,
    workshopDesign: workshopDesign.design,
    materials: materialsCreation.materials,
    facilitatorGuide: facilitatorGuide.guide,
    evaluationPlan: evaluationPlan.plan,
    artifacts,
    duration: duration_ms,
    metadata: {
      processId: 'education/teaching-effectiveness-workshop',
      timestamp: startTime,
      workshopTopic,
      outputDir
    }
  };
}

// Task definitions
export const facultyNeedsAssessmentTask = defineTask('faculty-needs-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct faculty needs assessment',
  agent: {
    name: 'needs-assessor',
    prompt: {
      role: 'faculty development specialist',
      task: 'Assess faculty professional development needs',
      context: args,
      instructions: [
        'Analyze target audience teaching experience',
        'Identify common teaching challenges',
        'Determine skill gaps related to topic',
        'Consider institutional context',
        'Identify prior professional development',
        'Document motivation factors',
        'Assess technology proficiency',
        'Generate needs assessment document'
      ],
      outputFormat: 'JSON with assessment, challenges, gaps, motivations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        challenges: { type: 'array' },
        gaps: { type: 'array' },
        motivations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'workshop', 'needs-assessment', 'faculty']
}));

export const workshopDesignTask = defineTask('workshop-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design workshop structure',
  agent: {
    name: 'workshop-designer',
    prompt: {
      role: 'professional development designer',
      task: 'Design engaging workshop structure',
      context: args,
      instructions: [
        'Create workshop agenda',
        'Design opening/engagement activity',
        'Structure content delivery sections',
        'Plan interactive practice activities',
        'Design reflection opportunities',
        'Plan closing and action planning',
        'Balance presentation and participation',
        'Generate workshop design document'
      ],
      outputFormat: 'JSON with design, agenda, sections, timing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'agenda', 'artifacts'],
      properties: {
        design: { type: 'object' },
        agenda: { type: 'array' },
        sections: { type: 'array' },
        timing: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'workshop', 'design', 'structure']
}));

export const workshopActivityDevelopmentTask = defineTask('workshop-activity-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop workshop activities',
  agent: {
    name: 'activity-developer',
    prompt: {
      role: 'experiential learning specialist',
      task: 'Develop engaging workshop activities',
      context: args,
      instructions: [
        'Design interactive learning activities',
        'Create discussion protocols',
        'Develop case studies or scenarios',
        'Design collaborative exercises',
        'Create reflection activities',
        'Develop application exercises',
        'Design peer feedback activities',
        'Generate activity documentation'
      ],
      outputFormat: 'JSON with activities, protocols, cases, instructions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'artifacts'],
      properties: {
        activities: { type: 'array' },
        protocols: { type: 'array' },
        cases: { type: 'array' },
        instructions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'workshop', 'activities', 'development']
}));

export const workshopMaterialsCreationTask = defineTask('workshop-materials-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create workshop materials',
  agent: {
    name: 'materials-creator',
    prompt: {
      role: 'instructional materials developer',
      task: 'Create workshop participant materials',
      context: args,
      instructions: [
        'Create presentation slides',
        'Develop participant handouts',
        'Create activity worksheets',
        'Design resource list',
        'Create action planning template',
        'Develop job aids for transfer',
        'Compile reading materials',
        'Generate materials package'
      ],
      outputFormat: 'JSON with materials, slides, handouts, worksheets, resources, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['materials', 'artifacts'],
      properties: {
        materials: { type: 'array' },
        slides: { type: 'object' },
        handouts: { type: 'array' },
        worksheets: { type: 'array' },
        resources: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'workshop', 'materials', 'creation']
}));

export const facilitatorGuideCreationTask = defineTask('facilitator-guide-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create facilitator guide',
  agent: {
    name: 'facilitator-guide-creator',
    prompt: {
      role: 'workshop facilitation specialist',
      task: 'Create comprehensive facilitator guide',
      context: args,
      instructions: [
        'Write detailed facilitation instructions',
        'Include timing notes for each section',
        'Provide discussion facilitation tips',
        'Include troubleshooting guidance',
        'Add room setup instructions',
        'Include materials preparation checklist',
        'Provide adaptation suggestions',
        'Generate facilitator guide document'
      ],
      outputFormat: 'JSON with guide, instructions, tips, checklist, adaptations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guide', 'artifacts'],
      properties: {
        guide: { type: 'object' },
        instructions: { type: 'array' },
        tips: { type: 'array' },
        checklist: { type: 'array' },
        adaptations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'workshop', 'facilitator-guide', 'creation']
}));

export const workshopEvaluationPlanTask = defineTask('workshop-evaluation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create workshop evaluation plan',
  agent: {
    name: 'evaluation-planner',
    prompt: {
      role: 'program evaluation specialist',
      task: 'Create workshop evaluation plan',
      context: args,
      instructions: [
        'Design participant satisfaction survey',
        'Create learning assessment measures',
        'Plan follow-up evaluation',
        'Design observation protocol',
        'Create data collection plan',
        'Plan analysis approach',
        'Design reporting format',
        'Generate evaluation plan document'
      ],
      outputFormat: 'JSON with plan, surveys, assessments, followUp, reporting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        surveys: { type: 'array' },
        assessments: { type: 'array' },
        followUp: { type: 'object' },
        reporting: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'workshop', 'evaluation', 'planning']
}));

export const workshopQualityScoringTask = defineTask('workshop-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score workshop design quality',
  agent: {
    name: 'workshop-quality-auditor',
    prompt: {
      role: 'professional development quality auditor',
      task: 'Assess workshop design quality',
      context: args,
      instructions: [
        'Evaluate needs alignment (weight: 20%)',
        'Assess design engagement (weight: 25%)',
        'Review activity quality (weight: 25%)',
        'Evaluate materials completeness (weight: 15%)',
        'Assess facilitator guide quality (weight: 15%)',
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
  labels: ['agent', 'workshop', 'quality-scoring', 'validation']
}));
