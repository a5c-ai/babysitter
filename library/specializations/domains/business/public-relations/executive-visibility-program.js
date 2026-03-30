/**
 * @process specializations/domains/business/public-relations/executive-visibility-program
 * @description Build thought leadership platforms for executives through speaking opportunities, bylined articles, media appearances, and social media presence
 * @specialization Public Relations and Communications
 * @category Corporate Communications
 * @inputs { executive: object, thoughtLeadershipGoals: object, targetAudiences: object[], existingPlatform: object }
 * @outputs { success: boolean, visibilityProgram: object, contentCalendar: object, speakingPipeline: object[], quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    executive,
    thoughtLeadershipGoals = {},
    targetAudiences = [],
    existingPlatform = {},
    industry,
    competitorExecutives = [],
    targetQuality = 85
  } = inputs;

  // Phase 1: Executive Assessment
  await ctx.breakpoint({
    question: 'Starting executive visibility program development. Assess executive profile and goals?',
    title: 'Phase 1: Executive Assessment',
    context: {
      runId: ctx.runId,
      phase: 'executive-assessment',
      executive: executive.name
    }
  });

  const [executiveAssessment, landscapeAnalysis] = await Promise.all([
    ctx.task(assessExecutiveProfileTask, {
      executive,
      thoughtLeadershipGoals,
      existingPlatform
    }),
    ctx.task(analyzeThoughtLeadershipLandscapeTask, {
      industry,
      competitorExecutives,
      targetAudiences
    })
  ]);

  // Phase 2: Positioning Strategy
  await ctx.breakpoint({
    question: 'Assessment complete. Develop thought leadership positioning?',
    title: 'Phase 2: Positioning Strategy',
    context: {
      runId: ctx.runId,
      phase: 'positioning-strategy'
    }
  });

  const positioningStrategy = await ctx.task(developPositioningStrategyTask, {
    executiveAssessment,
    landscapeAnalysis,
    thoughtLeadershipGoals
  });

  // Phase 3: Speaking Opportunities Pipeline
  await ctx.breakpoint({
    question: 'Positioning defined. Build speaking opportunities pipeline?',
    title: 'Phase 3: Speaking Pipeline',
    context: {
      runId: ctx.runId,
      phase: 'speaking-pipeline'
    }
  });

  const speakingPipeline = await ctx.task(buildSpeakingPipelineTask, {
    positioningStrategy,
    targetAudiences,
    industry,
    executiveAssessment
  });

  // Phase 4: Bylined Content Strategy
  await ctx.breakpoint({
    question: 'Speaking pipeline built. Develop bylined content strategy?',
    title: 'Phase 4: Bylined Content',
    context: {
      runId: ctx.runId,
      phase: 'bylined-content'
    }
  });

  const bylinedStrategy = await ctx.task(developBylinedStrategyTask, {
    positioningStrategy,
    targetAudiences,
    industry
  });

  // Phase 5: Media Visibility Plan
  await ctx.breakpoint({
    question: 'Bylined strategy developed. Plan media visibility?',
    title: 'Phase 5: Media Visibility',
    context: {
      runId: ctx.runId,
      phase: 'media-visibility'
    }
  });

  const mediaVisibilityPlan = await ctx.task(planMediaVisibilityTask, {
    executiveAssessment,
    positioningStrategy,
    industry
  });

  // Phase 6: Social Media Presence
  await ctx.breakpoint({
    question: 'Media plan ready. Develop social media presence strategy?',
    title: 'Phase 6: Social Media',
    context: {
      runId: ctx.runId,
      phase: 'social-media'
    }
  });

  const socialMediaStrategy = await ctx.task(developSocialMediaStrategyTask, {
    executive,
    positioningStrategy,
    existingPlatform
  });

  // Phase 7: Integrated Content Calendar
  await ctx.breakpoint({
    question: 'Social strategy developed. Create integrated content calendar?',
    title: 'Phase 7: Content Calendar',
    context: {
      runId: ctx.runId,
      phase: 'content-calendar'
    }
  });

  const contentCalendar = await ctx.task(createIntegratedCalendarTask, {
    speakingPipeline,
    bylinedStrategy,
    mediaVisibilityPlan,
    socialMediaStrategy
  });

  // Phase 8: Measurement Framework
  await ctx.breakpoint({
    question: 'Calendar created. Define measurement framework?',
    title: 'Phase 8: Measurement Framework',
    context: {
      runId: ctx.runId,
      phase: 'measurement-framework'
    }
  });

  const measurementFramework = await ctx.task(defineMeasurementFrameworkTask, {
    thoughtLeadershipGoals,
    positioningStrategy
  });

  // Phase 9: Quality Validation
  await ctx.breakpoint({
    question: 'Validate executive visibility program quality?',
    title: 'Phase 9: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateProgramQualityTask, {
    executiveAssessment,
    positioningStrategy,
    speakingPipeline,
    bylinedStrategy,
    mediaVisibilityPlan,
    socialMediaStrategy,
    contentCalendar,
    measurementFramework,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      visibilityProgram: {
        executiveProfile: executiveAssessment.profile,
        positioning: positioningStrategy,
        bylinedStrategy: bylinedStrategy.strategy,
        mediaVisibility: mediaVisibilityPlan,
        socialMediaStrategy,
        measurementFramework
      },
      contentCalendar,
      speakingPipeline: speakingPipeline.opportunities,
      quality,
      targetQuality,
      landscapeInsights: landscapeAnalysis.insights,
      metadata: {
        processId: 'specializations/domains/business/public-relations/executive-visibility-program',
        timestamp: ctx.now(),
        executive: executive.name
      }
    };
  } else {
    return {
      success: false,
      qualityGateFailed: true,
      quality,
      targetQuality,
      gaps: qualityResult.gaps,
      recommendations: qualityResult.recommendations,
      metadata: {
        processId: 'specializations/domains/business/public-relations/executive-visibility-program',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const assessExecutiveProfileTask = defineTask('assess-executive-profile', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Executive Profile',
  agent: {
    name: 'executive-profile-assessor',
    prompt: {
      role: 'Executive communications specialist assessing thought leadership potential',
      task: 'Assess executive profile and thought leadership readiness',
      context: args,
      instructions: [
        'Review executive background, expertise, and credentials',
        'Assess current visibility and brand awareness',
        'Identify unique expertise and perspective',
        'Evaluate communication skills and comfort with visibility',
        'Assess social media presence and engagement',
        'Identify media training needs',
        'Understand time availability for visibility activities',
        'Document existing relationships and platforms'
      ],
      outputFormat: 'JSON with profile, expertise, currentVisibility, uniquePerspective, communicationAssessment, socialPresence, trainingNeeds, availability, existingRelationships'
    },
    outputSchema: {
      type: 'object',
      required: ['profile', 'expertise', 'uniquePerspective'],
      properties: {
        profile: { type: 'object' },
        expertise: { type: 'array', items: { type: 'string' } },
        currentVisibility: { type: 'object' },
        uniquePerspective: { type: 'array', items: { type: 'string' } },
        communicationAssessment: { type: 'object' },
        socialPresence: { type: 'object' },
        trainingNeeds: { type: 'array', items: { type: 'string' } },
        availability: { type: 'object' },
        existingRelationships: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'executive-assessment']
}));

export const analyzeThoughtLeadershipLandscapeTask = defineTask('analyze-tl-landscape', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Thought Leadership Landscape',
  agent: {
    name: 'tl-landscape-analyst',
    prompt: {
      role: 'Competitive intelligence specialist analyzing executive thought leadership',
      task: 'Analyze thought leadership landscape and identify opportunities',
      context: args,
      instructions: [
        'Map competitor executive visibility programs',
        'Identify dominant thought leadership themes in industry',
        'Find whitespace topics and perspectives',
        'Identify key conferences and speaking venues',
        'Map influential publications for bylines',
        'Identify relevant awards and recognition',
        'Assess audience content consumption preferences',
        'Document emerging topics and trends'
      ],
      outputFormat: 'JSON with competitorPrograms, dominantThemes, whitespace, keyConferences, targetPublications, awards, audiencePreferences, emergingTopics, insights'
    },
    outputSchema: {
      type: 'object',
      required: ['dominantThemes', 'whitespace', 'insights'],
      properties: {
        competitorPrograms: { type: 'array', items: { type: 'object' } },
        dominantThemes: { type: 'array', items: { type: 'string' } },
        whitespace: { type: 'array', items: { type: 'string' } },
        keyConferences: { type: 'array', items: { type: 'object' } },
        targetPublications: { type: 'array', items: { type: 'object' } },
        awards: { type: 'array', items: { type: 'object' } },
        audiencePreferences: { type: 'object' },
        emergingTopics: { type: 'array', items: { type: 'string' } },
        insights: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'landscape-analysis']
}));

export const developPositioningStrategyTask = defineTask('develop-positioning-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Positioning Strategy',
  agent: {
    name: 'positioning-strategist',
    prompt: {
      role: 'Executive branding specialist developing thought leadership positioning',
      task: 'Develop distinctive thought leadership positioning for executive',
      context: args,
      instructions: [
        'Define thought leadership niche and territory',
        'Craft executive positioning statement',
        'Identify 3-5 core thought leadership topics',
        'Develop unique point of view for each topic',
        'Create signature concepts or frameworks',
        'Define authentic voice and style',
        'Establish credibility pillars',
        'Create differentiation from competitor executives'
      ],
      outputFormat: 'JSON with niche, positioningStatement, coreTopics, pointsOfView, signatureConcepts, voiceStyle, credibilityPillars, differentiation'
    },
    outputSchema: {
      type: 'object',
      required: ['niche', 'positioningStatement', 'coreTopics'],
      properties: {
        niche: { type: 'string' },
        positioningStatement: { type: 'string' },
        coreTopics: { type: 'array', items: { type: 'object' } },
        pointsOfView: { type: 'array', items: { type: 'object' } },
        signatureConcepts: { type: 'array', items: { type: 'object' } },
        voiceStyle: { type: 'object' },
        credibilityPillars: { type: 'array', items: { type: 'string' } },
        differentiation: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'positioning-strategy']
}));

export const buildSpeakingPipelineTask = defineTask('build-speaking-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build Speaking Opportunities Pipeline',
  agent: {
    name: 'speaking-pipeline-builder',
    prompt: {
      role: 'Speaker bureau specialist building executive speaking pipeline',
      task: 'Build pipeline of speaking opportunities for executive',
      context: args,
      instructions: [
        'Identify tier 1 industry conferences and events',
        'Research keynote and panel opportunities',
        'Identify corporate speaking engagements',
        'Find podcast guest opportunities',
        'Identify webinar and virtual event platforms',
        'Research academic and university speaking',
        'Develop CFP (call for proposals) calendar',
        'Create speaking opportunity scoring criteria'
      ],
      outputFormat: 'JSON with opportunities array (event, type, audience, deadline, fit, priority), cfpCalendar, scoringCriteria, submissionStrategy'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'cfpCalendar'],
      properties: {
        opportunities: { type: 'array', items: { type: 'object' } },
        cfpCalendar: { type: 'array', items: { type: 'object' } },
        scoringCriteria: { type: 'object' },
        submissionStrategy: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'speaking-pipeline']
}));

export const developBylinedStrategyTask = defineTask('develop-bylined-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Bylined Content Strategy',
  agent: {
    name: 'bylined-strategist',
    prompt: {
      role: 'Content strategist developing executive bylined article program',
      task: 'Develop strategy for bylined articles and thought leadership content',
      context: args,
      instructions: [
        'Identify target publications for bylines',
        'Develop article topic pipeline',
        'Create editorial calendar for submissions',
        'Define content formats (op-eds, features, how-tos)',
        'Establish ghostwriting and review process',
        'Create publication outreach strategy',
        'Develop content repurposing plan',
        'Define success metrics for bylined content'
      ],
      outputFormat: 'JSON with strategy, targetPublications, topicPipeline, editorialCalendar, contentFormats, process, outreachStrategy, repurposingPlan, metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'targetPublications', 'topicPipeline'],
      properties: {
        strategy: { type: 'object' },
        targetPublications: { type: 'array', items: { type: 'object' } },
        topicPipeline: { type: 'array', items: { type: 'object' } },
        editorialCalendar: { type: 'object' },
        contentFormats: { type: 'array', items: { type: 'object' } },
        process: { type: 'object' },
        outreachStrategy: { type: 'object' },
        repurposingPlan: { type: 'object' },
        metrics: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'bylined-strategy']
}));

export const planMediaVisibilityTask = defineTask('plan-media-visibility', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Media Visibility',
  agent: {
    name: 'media-visibility-planner',
    prompt: {
      role: 'Media relations specialist planning executive media visibility',
      task: 'Plan media visibility strategy for executive',
      context: args,
      instructions: [
        'Identify target media outlets and journalists',
        'Develop expert commentary positioning',
        'Create rapid response protocol for news commentary',
        'Plan feature profile opportunities',
        'Identify broadcast media opportunities',
        'Create media relationship building plan',
        'Develop interview preparation process',
        'Define spokesperson role boundaries'
      ],
      outputFormat: 'JSON with targetMedia, expertPositioning, rapidResponseProtocol, featureOpportunities, broadcastOpportunities, relationshipPlan, interviewProcess, spokesRoleBoundaries'
    },
    outputSchema: {
      type: 'object',
      required: ['targetMedia', 'expertPositioning'],
      properties: {
        targetMedia: { type: 'array', items: { type: 'object' } },
        expertPositioning: { type: 'object' },
        rapidResponseProtocol: { type: 'object' },
        featureOpportunities: { type: 'array', items: { type: 'object' } },
        broadcastOpportunities: { type: 'array', items: { type: 'object' } },
        relationshipPlan: { type: 'object' },
        interviewProcess: { type: 'object' },
        spokesRoleBoundaries: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'media-visibility']
}));

export const developSocialMediaStrategyTask = defineTask('develop-social-media-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Social Media Strategy',
  agent: {
    name: 'social-media-strategist',
    prompt: {
      role: 'Executive social media specialist developing platform strategy',
      task: 'Develop social media strategy for executive visibility',
      context: args,
      instructions: [
        'Audit and optimize existing social profiles',
        'Define platform priorities (LinkedIn, Twitter, etc.)',
        'Develop content pillars and themes',
        'Create posting cadence and schedule',
        'Define engagement strategy and protocols',
        'Develop authentic voice guidelines',
        'Create content creation and approval workflow',
        'Define metrics and growth targets'
      ],
      outputFormat: 'JSON with profileAudit, platformPriorities, contentPillars, postingSchedule, engagementStrategy, voiceGuidelines, workflow, metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['platformPriorities', 'contentPillars', 'postingSchedule'],
      properties: {
        profileAudit: { type: 'object' },
        platformPriorities: { type: 'array', items: { type: 'object' } },
        contentPillars: { type: 'array', items: { type: 'object' } },
        postingSchedule: { type: 'object' },
        engagementStrategy: { type: 'object' },
        voiceGuidelines: { type: 'object' },
        workflow: { type: 'object' },
        metrics: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'social-media-strategy']
}));

export const createIntegratedCalendarTask = defineTask('create-integrated-calendar', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Integrated Content Calendar',
  agent: {
    name: 'calendar-integrator',
    prompt: {
      role: 'Content operations specialist integrating executive visibility activities',
      task: 'Create integrated content and activity calendar',
      context: args,
      instructions: [
        'Integrate speaking engagements into calendar',
        'Schedule bylined article production and submission',
        'Plan social media content creation',
        'Coordinate media interview availability',
        'Schedule content repurposing activities',
        'Plan awards submission deadlines',
        'Include prep time for major activities',
        'Create monthly and quarterly views'
      ],
      outputFormat: 'JSON with calendar array (date, activity, type, status, prep), monthlyView, quarterlyView, resourceRequirements'
    },
    outputSchema: {
      type: 'object',
      required: ['calendar', 'monthlyView', 'quarterlyView'],
      properties: {
        calendar: { type: 'array', items: { type: 'object' } },
        monthlyView: { type: 'object' },
        quarterlyView: { type: 'object' },
        resourceRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'content-calendar']
}));

export const defineMeasurementFrameworkTask = defineTask('define-measurement-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Measurement Framework',
  agent: {
    name: 'measurement-framework-developer',
    prompt: {
      role: 'PR measurement specialist defining executive visibility metrics',
      task: 'Define measurement framework for executive visibility program',
      context: args,
      instructions: [
        'Define output metrics (volume of activities)',
        'Define outcome metrics (reach, engagement)',
        'Establish thought leadership perception metrics',
        'Define business impact indicators',
        'Create dashboard and reporting approach',
        'Set benchmark and targets',
        'Define measurement cadence',
        'Create ROI framework'
      ],
      outputFormat: 'JSON with outputMetrics, outcomeMetrics, perceptionMetrics, businessImpact, dashboard, benchmarks, targets, cadence, roiFramework'
    },
    outputSchema: {
      type: 'object',
      required: ['outputMetrics', 'outcomeMetrics', 'targets'],
      properties: {
        outputMetrics: { type: 'array', items: { type: 'object' } },
        outcomeMetrics: { type: 'array', items: { type: 'object' } },
        perceptionMetrics: { type: 'array', items: { type: 'object' } },
        businessImpact: { type: 'array', items: { type: 'object' } },
        dashboard: { type: 'object' },
        benchmarks: { type: 'object' },
        targets: { type: 'object' },
        cadence: { type: 'string' },
        roiFramework: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'measurement-framework']
}));

export const validateProgramQualityTask = defineTask('validate-program-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Program Quality',
  agent: {
    name: 'program-quality-validator',
    prompt: {
      role: 'Executive communications quality assessor',
      task: 'Validate executive visibility program quality',
      context: args,
      instructions: [
        'Assess positioning differentiation and clarity',
        'Evaluate speaking pipeline quality and fit',
        'Review bylined strategy feasibility',
        'Assess media visibility plan completeness',
        'Evaluate social media strategy appropriateness',
        'Review calendar integration and feasibility',
        'Assess measurement framework robustness',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, positioningScore, speakingScore, bylinedScore, mediaScore, socialScore, calendarScore, measurementScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        positioningScore: { type: 'number' },
        speakingScore: { type: 'number' },
        bylinedScore: { type: 'number' },
        mediaScore: { type: 'number' },
        socialScore: { type: 'number' },
        calendarScore: { type: 'number' },
        measurementScore: { type: 'number' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'quality-validation']
}));
