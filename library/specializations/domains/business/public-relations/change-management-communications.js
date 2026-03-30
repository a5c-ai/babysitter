/**
 * @process specializations/domains/business/public-relations/change-management-communications
 * @description Plan and execute communications supporting organizational changes including leader preparation, employee messaging, feedback mechanisms, and progress updates
 * @specialization Public Relations and Communications
 * @category Internal Communications
 * @inputs { change: object, organization: object, stakeholders: object[], timeline: object }
 * @outputs { success: boolean, commsPlan: object, leaderToolkit: object, feedbackSystem: object, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    change,
    organization,
    stakeholders = [],
    timeline = {},
    targetQuality = 85
  } = inputs;

  // Phase 1: Change Impact Assessment
  await ctx.breakpoint({
    question: 'Starting change management communications. Assess change impact?',
    title: 'Phase 1: Impact Assessment',
    context: {
      runId: ctx.runId,
      phase: 'impact-assessment',
      changeType: change.type
    }
  });

  const impactAssessment = await ctx.task(assessChangeImpactTask, {
    change,
    organization,
    stakeholders
  });

  // Phase 2: Stakeholder Analysis (Change)
  await ctx.breakpoint({
    question: 'Impact assessed. Analyze stakeholder change readiness?',
    title: 'Phase 2: Stakeholder Analysis',
    context: {
      runId: ctx.runId,
      phase: 'stakeholder-analysis'
    }
  });

  const stakeholderAnalysis = await ctx.task(analyzeChangeStakeholdersTask, {
    stakeholders,
    impactAssessment,
    change
  });

  // Phase 3: Communications Strategy Development
  await ctx.breakpoint({
    question: 'Stakeholders analyzed. Develop communications strategy?',
    title: 'Phase 3: Communications Strategy',
    context: {
      runId: ctx.runId,
      phase: 'communications-strategy'
    }
  });

  const commsStrategy = await ctx.task(developChangeCommsStrategyTask, {
    change,
    impactAssessment,
    stakeholderAnalysis,
    timeline
  });

  // Phase 4: Message Development
  await ctx.breakpoint({
    question: 'Strategy developed. Develop change messages?',
    title: 'Phase 4: Message Development',
    context: {
      runId: ctx.runId,
      phase: 'message-development'
    }
  });

  const messageFramework = await ctx.task(developChangeMessagesTask, {
    change,
    commsStrategy,
    stakeholderAnalysis
  });

  // Phase 5: Leader Preparation
  await ctx.breakpoint({
    question: 'Messages developed. Prepare leaders for change communication?',
    title: 'Phase 5: Leader Preparation',
    context: {
      runId: ctx.runId,
      phase: 'leader-preparation'
    }
  });

  const leaderToolkit = await ctx.task(prepareLeadersTask, {
    messageFramework,
    change,
    commsStrategy
  });

  // Phase 6: Communications Timeline
  await ctx.breakpoint({
    question: 'Leaders prepared. Create detailed communications timeline?',
    title: 'Phase 6: Communications Timeline',
    context: {
      runId: ctx.runId,
      phase: 'communications-timeline'
    }
  });

  const commsTimeline = await ctx.task(createCommsTimelineTask, {
    change,
    timeline,
    commsStrategy,
    messageFramework
  });

  // Phase 7: Feedback Mechanisms
  await ctx.breakpoint({
    question: 'Timeline created. Design feedback mechanisms?',
    title: 'Phase 7: Feedback Mechanisms',
    context: {
      runId: ctx.runId,
      phase: 'feedback-mechanisms'
    }
  });

  const feedbackSystem = await ctx.task(designFeedbackSystemTask, {
    change,
    stakeholderAnalysis,
    commsStrategy
  });

  // Phase 8: Quality Validation
  await ctx.breakpoint({
    question: 'Validate change management communications quality?',
    title: 'Phase 8: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateChangeCommsTask, {
    impactAssessment,
    stakeholderAnalysis,
    commsStrategy,
    messageFramework,
    leaderToolkit,
    commsTimeline,
    feedbackSystem,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      commsPlan: {
        strategy: commsStrategy,
        messages: messageFramework,
        timeline: commsTimeline,
        impactAssessment: impactAssessment.summary
      },
      leaderToolkit,
      feedbackSystem,
      stakeholderAnalysis: stakeholderAnalysis.summary,
      quality,
      targetQuality,
      metadata: {
        processId: 'specializations/domains/business/public-relations/change-management-communications',
        timestamp: ctx.now(),
        changeType: change.type
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
        processId: 'specializations/domains/business/public-relations/change-management-communications',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const assessChangeImpactTask = defineTask('assess-change-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Change Impact',
  agent: {
    name: 'change-impact-assessor',
    prompt: {
      role: 'Change management communications specialist assessing impact',
      task: 'Assess change impact for communications planning',
      context: args,
      instructions: [
        'Identify what is changing',
        'Assess scope and scale of change',
        'Identify impacted populations',
        'Assess impact severity by group',
        'Identify resistance factors',
        'Assess organizational readiness',
        'Identify communications challenges',
        'Determine change urgency and timeline'
      ],
      outputFormat: 'JSON with changeDescription, scope, impactedGroups, impactSeverity, resistanceFactors, readinessAssessment, commsChallenges, urgency, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['changeDescription', 'impactedGroups', 'summary'],
      properties: {
        changeDescription: { type: 'object' },
        scope: { type: 'object' },
        impactedGroups: { type: 'array', items: { type: 'object' } },
        impactSeverity: { type: 'object' },
        resistanceFactors: { type: 'array', items: { type: 'object' } },
        readinessAssessment: { type: 'object' },
        commsChallenges: { type: 'array', items: { type: 'string' } },
        urgency: { type: 'string' },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'change-impact']
}));

export const analyzeChangeStakeholdersTask = defineTask('analyze-change-stakeholders', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Change Stakeholders',
  agent: {
    name: 'change-stakeholder-analyst',
    prompt: {
      role: 'Stakeholder analysis specialist for change management',
      task: 'Analyze stakeholder readiness and needs for change',
      context: args,
      instructions: [
        'Segment stakeholders by impact level',
        'Assess current awareness by group',
        'Evaluate desire/motivation for change',
        'Assess knowledge gaps',
        'Identify change champions',
        'Identify resisters and concerns',
        'Map stakeholder influence networks',
        'Define stakeholder communication needs'
      ],
      outputFormat: 'JSON with stakeholderSegments, awarenessLevels, motivationAssessment, knowledgeGaps, champions, resisters, influenceNetworks, commNeeds, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholderSegments', 'commNeeds', 'summary'],
      properties: {
        stakeholderSegments: { type: 'array', items: { type: 'object' } },
        awarenessLevels: { type: 'object' },
        motivationAssessment: { type: 'object' },
        knowledgeGaps: { type: 'object' },
        champions: { type: 'array', items: { type: 'object' } },
        resisters: { type: 'array', items: { type: 'object' } },
        influenceNetworks: { type: 'array', items: { type: 'object' } },
        commNeeds: { type: 'object' },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'stakeholder-analysis']
}));

export const developChangeCommsStrategyTask = defineTask('develop-change-comms-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Change Communications Strategy',
  agent: {
    name: 'change-comms-strategist',
    prompt: {
      role: 'Change communications strategist developing approach',
      task: 'Develop comprehensive change communications strategy',
      context: args,
      instructions: [
        'Define communications objectives',
        'Establish guiding principles',
        'Define phased approach aligned with change',
        'Select channel strategy',
        'Define spokesperson strategy',
        'Plan two-way communication approach',
        'Define success metrics',
        'Identify risks and mitigation'
      ],
      outputFormat: 'JSON with objectives, principles, phasedApproach, channelStrategy, spokespersons, twoWayApproach, successMetrics, risksMitigation'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'phasedApproach', 'channelStrategy'],
      properties: {
        objectives: { type: 'array', items: { type: 'object' } },
        principles: { type: 'array', items: { type: 'string' } },
        phasedApproach: { type: 'object' },
        channelStrategy: { type: 'object' },
        spokespersons: { type: 'array', items: { type: 'object' } },
        twoWayApproach: { type: 'object' },
        successMetrics: { type: 'array', items: { type: 'object' } },
        risksMitigation: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'change-comms-strategy']
}));

export const developChangeMessagesTask = defineTask('develop-change-messages', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Change Messages',
  agent: {
    name: 'change-message-developer',
    prompt: {
      role: 'Change communications writer developing messages',
      task: 'Develop change communications messages',
      context: args,
      instructions: [
        'Develop core change narrative',
        'Create key messages for each phase',
        'Develop stakeholder-specific messages',
        'Create FAQ and anticipated questions',
        'Develop "what it means for you" messages',
        'Create progress update templates',
        'Develop success story templates',
        'Create resistance response messages'
      ],
      outputFormat: 'JSON with coreNarrative, phaseMessages, stakeholderMessages, faq, whatItMeans, progressTemplates, successStoryTemplates, resistanceResponses'
    },
    outputSchema: {
      type: 'object',
      required: ['coreNarrative', 'phaseMessages', 'faq'],
      properties: {
        coreNarrative: { type: 'object' },
        phaseMessages: { type: 'array', items: { type: 'object' } },
        stakeholderMessages: { type: 'object' },
        faq: { type: 'array', items: { type: 'object' } },
        whatItMeans: { type: 'object' },
        progressTemplates: { type: 'array', items: { type: 'object' } },
        successStoryTemplates: { type: 'array', items: { type: 'object' } },
        resistanceResponses: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'change-messages']
}));

export const prepareLeadersTask = defineTask('prepare-leaders', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare Leaders for Change Communication',
  agent: {
    name: 'leader-preparer',
    prompt: {
      role: 'Leadership communications specialist preparing leaders',
      task: 'Prepare leaders to communicate change effectively',
      context: args,
      instructions: [
        'Create leader briefing package',
        'Develop talking points for each phase',
        'Create team meeting facilitation guides',
        'Develop one-on-one conversation guides',
        'Create difficult question handling guidance',
        'Develop emotion management techniques',
        'Create leader FAQ',
        'Plan leader coaching and support'
      ],
      outputFormat: 'JSON with briefingPackage, talkingPoints, meetingGuides, oneOnOneGuides, difficultQuestions, emotionManagement, leaderFaq, coachingSupport'
    },
    outputSchema: {
      type: 'object',
      required: ['briefingPackage', 'talkingPoints', 'meetingGuides'],
      properties: {
        briefingPackage: { type: 'object' },
        talkingPoints: { type: 'array', items: { type: 'object' } },
        meetingGuides: { type: 'array', items: { type: 'object' } },
        oneOnOneGuides: { type: 'array', items: { type: 'object' } },
        difficultQuestions: { type: 'array', items: { type: 'object' } },
        emotionManagement: { type: 'object' },
        leaderFaq: { type: 'array', items: { type: 'object' } },
        coachingSupport: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'leader-preparation']
}));

export const createCommsTimelineTask = defineTask('create-comms-timeline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Communications Timeline',
  agent: {
    name: 'comms-timeline-creator',
    prompt: {
      role: 'Communications planning specialist creating timeline',
      task: 'Create detailed change communications timeline',
      context: args,
      instructions: [
        'Map communications to change milestones',
        'Schedule pre-announcement activities',
        'Plan announcement day communications',
        'Schedule ongoing communications cadence',
        'Plan milestone and progress communications',
        'Schedule feedback collection points',
        'Plan celebration and reinforcement',
        'Create communication responsibility matrix'
      ],
      outputFormat: 'JSON with milestoneMaping, preAnnouncement, announcementDay, ongoingCadence, milestoneComms, feedbackSchedule, celebrations, responsibilityMatrix'
    },
    outputSchema: {
      type: 'object',
      required: ['milestoneMaping', 'announcementDay', 'ongoingCadence'],
      properties: {
        milestoneMaping: { type: 'array', items: { type: 'object' } },
        preAnnouncement: { type: 'array', items: { type: 'object' } },
        announcementDay: { type: 'object' },
        ongoingCadence: { type: 'object' },
        milestoneComms: { type: 'array', items: { type: 'object' } },
        feedbackSchedule: { type: 'array', items: { type: 'object' } },
        celebrations: { type: 'array', items: { type: 'object' } },
        responsibilityMatrix: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'comms-timeline']
}));

export const designFeedbackSystemTask = defineTask('design-feedback-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Feedback System',
  agent: {
    name: 'feedback-system-designer',
    prompt: {
      role: 'Employee feedback specialist designing mechanisms',
      task: 'Design feedback mechanisms for change communications',
      context: args,
      instructions: [
        'Design formal feedback channels',
        'Create informal feedback mechanisms',
        'Plan pulse surveys',
        'Design town hall Q&A process',
        'Create anonymous feedback options',
        'Design leader feedback collection',
        'Create feedback analysis approach',
        'Plan feedback response process'
      ],
      outputFormat: 'JSON with formalChannels, informalMechanisms, pulseSurveys, townHallProcess, anonymousOptions, leaderFeedback, analysisApproach, responseProcess'
    },
    outputSchema: {
      type: 'object',
      required: ['formalChannels', 'pulseSurveys', 'responseProcess'],
      properties: {
        formalChannels: { type: 'array', items: { type: 'object' } },
        informalMechanisms: { type: 'array', items: { type: 'object' } },
        pulseSurveys: { type: 'object' },
        townHallProcess: { type: 'object' },
        anonymousOptions: { type: 'array', items: { type: 'object' } },
        leaderFeedback: { type: 'object' },
        analysisApproach: { type: 'object' },
        responseProcess: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'feedback-system']
}));

export const validateChangeCommsTask = defineTask('validate-change-comms', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Change Communications Quality',
  agent: {
    name: 'change-comms-validator',
    prompt: {
      role: 'Change communications quality assessor',
      task: 'Validate change management communications quality',
      context: args,
      instructions: [
        'Assess impact assessment completeness',
        'Evaluate stakeholder analysis depth',
        'Review strategy alignment with change',
        'Assess message clarity and completeness',
        'Evaluate leader toolkit adequacy',
        'Review timeline feasibility',
        'Assess feedback system robustness',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, impactScore, stakeholderScore, strategyScore, messageScore, leaderScore, timelineScore, feedbackScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        impactScore: { type: 'number' },
        stakeholderScore: { type: 'number' },
        strategyScore: { type: 'number' },
        messageScore: { type: 'number' },
        leaderScore: { type: 'number' },
        timelineScore: { type: 'number' },
        feedbackScore: { type: 'number' },
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
