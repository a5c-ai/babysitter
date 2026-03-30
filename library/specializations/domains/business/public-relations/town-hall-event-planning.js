/**
 * @process specializations/domains/business/public-relations/town-hall-event-planning
 * @description Design and facilitate company-wide meetings, town halls, and engagement events that reinforce culture, share updates, and enable two-way dialogue
 * @specialization Public Relations and Communications
 * @category Internal Communications
 * @inputs { eventPurpose: object, audience: object, executives: object[], contentTopics: string[] }
 * @outputs { success: boolean, eventPlan: object, contentPlan: object, facilitationGuide: object, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    eventPurpose,
    audience = {},
    executives = [],
    contentTopics = [],
    eventFormat = 'hybrid',
    targetQuality = 85
  } = inputs;

  // Phase 1: Event Strategy and Objectives
  await ctx.breakpoint({
    question: 'Starting town hall planning. Define event strategy and objectives?',
    title: 'Phase 1: Event Strategy',
    context: {
      runId: ctx.runId,
      phase: 'event-strategy',
      eventPurpose: eventPurpose.name
    }
  });

  const eventStrategy = await ctx.task(defineEventStrategyTask, {
    eventPurpose,
    audience,
    contentTopics
  });

  // Phase 2: Content Development
  await ctx.breakpoint({
    question: 'Strategy defined. Develop event content?',
    title: 'Phase 2: Content Development',
    context: {
      runId: ctx.runId,
      phase: 'content-development'
    }
  });

  const [contentPlan, executivePreperation] = await Promise.all([
    ctx.task(developEventContentTask, {
      eventStrategy,
      contentTopics,
      eventPurpose
    }),
    ctx.task(prepareExecutivesTask, {
      executives,
      contentPlan: eventStrategy,
      eventPurpose
    })
  ]);

  // Phase 3: Engagement Design
  await ctx.breakpoint({
    question: 'Content developed. Design engagement elements?',
    title: 'Phase 3: Engagement Design',
    context: {
      runId: ctx.runId,
      phase: 'engagement-design'
    }
  });

  const engagementDesign = await ctx.task(designEngagementElementsTask, {
    eventStrategy,
    audience,
    eventFormat
  });

  // Phase 4: Q&A Preparation
  await ctx.breakpoint({
    question: 'Engagement designed. Prepare Q&A session?',
    title: 'Phase 4: Q&A Preparation',
    context: {
      runId: ctx.runId,
      phase: 'qa-preparation'
    }
  });

  const qaPreparation = await ctx.task(prepareQaSessionTask, {
    contentTopics,
    executives,
    eventPurpose
  });

  // Phase 5: Production Planning
  await ctx.breakpoint({
    question: 'Q&A prepared. Plan production and logistics?',
    title: 'Phase 5: Production Planning',
    context: {
      runId: ctx.runId,
      phase: 'production-planning',
      eventFormat
    }
  });

  const productionPlan = await ctx.task(planProductionTask, {
    eventFormat,
    audience,
    engagementDesign
  });

  // Phase 6: Facilitation Guide
  await ctx.breakpoint({
    question: 'Production planned. Create facilitation guide?',
    title: 'Phase 6: Facilitation Guide',
    context: {
      runId: ctx.runId,
      phase: 'facilitation-guide'
    }
  });

  const facilitationGuide = await ctx.task(createFacilitationGuideTask, {
    eventStrategy,
    contentPlan,
    engagementDesign,
    qaPreparation,
    productionPlan
  });

  // Phase 7: Follow-up Planning
  await ctx.breakpoint({
    question: 'Guide created. Plan follow-up activities?',
    title: 'Phase 7: Follow-up Planning',
    context: {
      runId: ctx.runId,
      phase: 'follow-up-planning'
    }
  });

  const followUpPlan = await ctx.task(planFollowUpTask, {
    eventStrategy,
    contentPlan,
    engagementDesign
  });

  // Phase 8: Quality Validation
  await ctx.breakpoint({
    question: 'Validate town hall planning quality?',
    title: 'Phase 8: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateTownHallPlanTask, {
    eventStrategy,
    contentPlan,
    executivePreperation,
    engagementDesign,
    qaPreparation,
    productionPlan,
    facilitationGuide,
    followUpPlan,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      eventPlan: {
        strategy: eventStrategy,
        production: productionPlan,
        engagement: engagementDesign,
        followUp: followUpPlan
      },
      contentPlan: {
        content: contentPlan,
        executivePrep: executivePreperation,
        qaPrep: qaPreparation
      },
      facilitationGuide,
      quality,
      targetQuality,
      metadata: {
        processId: 'specializations/domains/business/public-relations/town-hall-event-planning',
        timestamp: ctx.now(),
        eventPurpose: eventPurpose.name,
        eventFormat
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
        processId: 'specializations/domains/business/public-relations/town-hall-event-planning',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const defineEventStrategyTask = defineTask('define-event-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Event Strategy',
  agent: {
    name: 'event-strategist',
    prompt: {
      role: 'Internal events specialist defining town hall strategy',
      task: 'Define town hall event strategy and objectives',
      context: args,
      instructions: [
        'Define primary and secondary objectives',
        'Establish key messages and themes',
        'Define desired outcomes and behaviors',
        'Plan event flow and structure',
        'Define cultural tone and atmosphere',
        'Establish success metrics',
        'Plan audience segmentation approach',
        'Define event differentiation (from typical meetings)'
      ],
      outputFormat: 'JSON with objectives, keyMessages, desiredOutcomes, eventFlow, culturalTone, successMetrics, audienceApproach, differentiation'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'keyMessages', 'eventFlow'],
      properties: {
        objectives: { type: 'array', items: { type: 'object' } },
        keyMessages: { type: 'array', items: { type: 'object' } },
        desiredOutcomes: { type: 'array', items: { type: 'object' } },
        eventFlow: { type: 'object' },
        culturalTone: { type: 'object' },
        successMetrics: { type: 'array', items: { type: 'object' } },
        audienceApproach: { type: 'object' },
        differentiation: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'event-strategy']
}));

export const developEventContentTask = defineTask('develop-event-content', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Event Content',
  agent: {
    name: 'event-content-developer',
    prompt: {
      role: 'Internal communications content specialist',
      task: 'Develop content for town hall event',
      context: args,
      instructions: [
        'Develop opening and welcome content',
        'Create business update content',
        'Develop employee recognition content',
        'Create forward-looking content',
        'Develop interactive segment content',
        'Create closing and call-to-action',
        'Develop visual and multimedia assets',
        'Create leave-behind materials'
      ],
      outputFormat: 'JSON with openingContent, businessUpdate, employeeRecognition, forwardLooking, interactiveContent, closingContent, visualAssets, leaveBehind'
    },
    outputSchema: {
      type: 'object',
      required: ['openingContent', 'businessUpdate', 'closingContent'],
      properties: {
        openingContent: { type: 'object' },
        businessUpdate: { type: 'object' },
        employeeRecognition: { type: 'object' },
        forwardLooking: { type: 'object' },
        interactiveContent: { type: 'object' },
        closingContent: { type: 'object' },
        visualAssets: { type: 'array', items: { type: 'object' } },
        leaveBehind: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'event-content']
}));

export const prepareExecutivesTask = defineTask('prepare-executives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare Executives',
  agent: {
    name: 'executive-preparer',
    prompt: {
      role: 'Executive communications coach preparing leaders',
      task: 'Prepare executives for town hall participation',
      context: args,
      instructions: [
        'Create executive briefing document',
        'Develop speaking notes and scripts',
        'Prepare key message cards',
        'Create anticipated Q&A preparation',
        'Plan rehearsal and run-through',
        'Develop delivery coaching points',
        'Prepare teleprompter/slide content',
        'Create backup and contingency plans'
      ],
      outputFormat: 'JSON with briefingDoc, speakingNotes, messageCards, qaPrep, rehearsalPlan, coachingPoints, teleprompterContent, contingencyPlans'
    },
    outputSchema: {
      type: 'object',
      required: ['briefingDoc', 'speakingNotes', 'qaPrep'],
      properties: {
        briefingDoc: { type: 'object' },
        speakingNotes: { type: 'array', items: { type: 'object' } },
        messageCards: { type: 'array', items: { type: 'object' } },
        qaPrep: { type: 'array', items: { type: 'object' } },
        rehearsalPlan: { type: 'object' },
        coachingPoints: { type: 'array', items: { type: 'string' } },
        teleprompterContent: { type: 'object' },
        contingencyPlans: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'executive-preparation']
}));

export const designEngagementElementsTask = defineTask('design-engagement-elements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Engagement Elements',
  agent: {
    name: 'engagement-designer',
    prompt: {
      role: 'Employee engagement specialist designing interactive elements',
      task: 'Design engagement elements for town hall',
      context: args,
      instructions: [
        'Design live polling activities',
        'Create Q&A submission mechanisms',
        'Design chat and reaction features',
        'Plan breakout or small group activities',
        'Design gamification elements',
        'Create recognition and celebration moments',
        'Plan networking opportunities',
        'Design post-event engagement'
      ],
      outputFormat: 'JSON with livePolling, qaSubmission, chatFeatures, breakoutActivities, gamification, recognitionMoments, networking, postEventEngagement'
    },
    outputSchema: {
      type: 'object',
      required: ['livePolling', 'qaSubmission'],
      properties: {
        livePolling: { type: 'array', items: { type: 'object' } },
        qaSubmission: { type: 'object' },
        chatFeatures: { type: 'object' },
        breakoutActivities: { type: 'array', items: { type: 'object' } },
        gamification: { type: 'array', items: { type: 'object' } },
        recognitionMoments: { type: 'array', items: { type: 'object' } },
        networking: { type: 'object' },
        postEventEngagement: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'engagement-design']
}));

export const prepareQaSessionTask = defineTask('prepare-qa-session', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare Q&A Session',
  agent: {
    name: 'qa-session-preparer',
    prompt: {
      role: 'Q&A facilitation specialist preparing sessions',
      task: 'Prepare Q&A session for town hall',
      context: args,
      instructions: [
        'Anticipate likely employee questions',
        'Prepare responses for sensitive questions',
        'Create question moderation approach',
        'Develop bridging and redirection techniques',
        'Plan question submission process',
        'Create question screening criteria',
        'Prepare "seed" questions if needed',
        'Define Q&A time management'
      ],
      outputFormat: 'JSON with anticipatedQuestions, sensitiveResponses, moderationApproach, bridgingTechniques, submissionProcess, screeningCriteria, seedQuestions, timeManagement'
    },
    outputSchema: {
      type: 'object',
      required: ['anticipatedQuestions', 'moderationApproach'],
      properties: {
        anticipatedQuestions: { type: 'array', items: { type: 'object' } },
        sensitiveResponses: { type: 'array', items: { type: 'object' } },
        moderationApproach: { type: 'object' },
        bridgingTechniques: { type: 'array', items: { type: 'string' } },
        submissionProcess: { type: 'object' },
        screeningCriteria: { type: 'array', items: { type: 'string' } },
        seedQuestions: { type: 'array', items: { type: 'object' } },
        timeManagement: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'qa-preparation']
}));

export const planProductionTask = defineTask('plan-production', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Production',
  agent: {
    name: 'production-planner',
    prompt: {
      role: 'Event production specialist planning logistics',
      task: 'Plan production and logistics for town hall',
      context: args,
      instructions: [
        'Define technical requirements',
        'Plan venue or virtual platform setup',
        'Create AV and production specifications',
        'Plan rehearsal schedule',
        'Define roles and responsibilities',
        'Create run-of-show document',
        'Plan contingency for technical issues',
        'Define recording and archiving approach'
      ],
      outputFormat: 'JSON with technicalRequirements, venueSetup, avSpecifications, rehearsalSchedule, rolesResponsibilities, runOfShow, contingencyPlans, recordingApproach'
    },
    outputSchema: {
      type: 'object',
      required: ['technicalRequirements', 'runOfShow'],
      properties: {
        technicalRequirements: { type: 'object' },
        venueSetup: { type: 'object' },
        avSpecifications: { type: 'object' },
        rehearsalSchedule: { type: 'object' },
        rolesResponsibilities: { type: 'array', items: { type: 'object' } },
        runOfShow: { type: 'array', items: { type: 'object' } },
        contingencyPlans: { type: 'array', items: { type: 'object' } },
        recordingApproach: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'production-planning']
}));

export const createFacilitationGuideTask = defineTask('create-facilitation-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Facilitation Guide',
  agent: {
    name: 'facilitation-guide-creator',
    prompt: {
      role: 'Event facilitation specialist creating guide',
      task: 'Create comprehensive facilitation guide',
      context: args,
      instructions: [
        'Create detailed event timeline',
        'Develop facilitator script',
        'Include cues and transitions',
        'Define interaction facilitation',
        'Include backup scripts',
        'Create energy management techniques',
        'Define time check protocols',
        'Include troubleshooting guidance'
      ],
      outputFormat: 'JSON with eventTimeline, facilitatorScript, cuesTransitions, interactionFacilitation, backupScripts, energyManagement, timeCheckProtocols, troubleshooting'
    },
    outputSchema: {
      type: 'object',
      required: ['eventTimeline', 'facilitatorScript'],
      properties: {
        eventTimeline: { type: 'array', items: { type: 'object' } },
        facilitatorScript: { type: 'array', items: { type: 'object' } },
        cuesTransitions: { type: 'array', items: { type: 'object' } },
        interactionFacilitation: { type: 'object' },
        backupScripts: { type: 'array', items: { type: 'object' } },
        energyManagement: { type: 'array', items: { type: 'string' } },
        timeCheckProtocols: { type: 'object' },
        troubleshooting: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'facilitation-guide']
}));

export const planFollowUpTask = defineTask('plan-follow-up', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Follow-up Activities',
  agent: {
    name: 'follow-up-planner',
    prompt: {
      role: 'Post-event communications specialist planning follow-up',
      task: 'Plan post-town hall follow-up activities',
      context: args,
      instructions: [
        'Plan post-event communications',
        'Define recording distribution',
        'Plan feedback collection',
        'Create summary and highlights',
        'Plan unanswered question response',
        'Define action item follow-through',
        'Plan impact measurement',
        'Create continuous improvement process'
      ],
      outputFormat: 'JSON with postEventComms, recordingDistribution, feedbackCollection, summaryHighlights, unansweredQuestions, actionFollowThrough, impactMeasurement, improvementProcess'
    },
    outputSchema: {
      type: 'object',
      required: ['postEventComms', 'feedbackCollection', 'impactMeasurement'],
      properties: {
        postEventComms: { type: 'object' },
        recordingDistribution: { type: 'object' },
        feedbackCollection: { type: 'object' },
        summaryHighlights: { type: 'object' },
        unansweredQuestions: { type: 'object' },
        actionFollowThrough: { type: 'object' },
        impactMeasurement: { type: 'object' },
        improvementProcess: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'follow-up-planning']
}));

export const validateTownHallPlanTask = defineTask('validate-town-hall-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Town Hall Plan Quality',
  agent: {
    name: 'town-hall-validator',
    prompt: {
      role: 'Internal events quality assessor',
      task: 'Validate town hall planning quality',
      context: args,
      instructions: [
        'Assess strategy clarity and objectives',
        'Evaluate content quality and relevance',
        'Review executive preparation adequacy',
        'Assess engagement element effectiveness',
        'Evaluate Q&A preparation thoroughness',
        'Review production planning completeness',
        'Assess facilitation guide quality',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, strategyScore, contentScore, execPrepScore, engagementScore, qaScore, productionScore, facilitationScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        strategyScore: { type: 'number' },
        contentScore: { type: 'number' },
        execPrepScore: { type: 'number' },
        engagementScore: { type: 'number' },
        qaScore: { type: 'number' },
        productionScore: { type: 'number' },
        facilitationScore: { type: 'number' },
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
