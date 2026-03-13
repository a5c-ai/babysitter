/**
 * @process specializations/domains/business/public-relations/media-pitching-campaigns
 * @description Develop personalized story angles and pitches for target journalists, execute outreach, track responses, and coordinate follow-up activities
 * @specialization Public Relations and Communications
 * @category Media Relations
 * @inputs { storyAngle: object, mediaList: object[], campaign: object, timeline: object, assets: object[] }
 * @outputs { success: boolean, pitches: object[], outreachResults: object, coverage: object[], quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    storyAngle,
    mediaList = [],
    campaign = {},
    timeline = {},
    assets = [],
    exclusiveStrategy = null,
    targetQuality = 85
  } = inputs;

  // Phase 1: Story Angle Refinement
  await ctx.breakpoint({
    question: 'Starting media pitching campaign. Refine story angle for pitching?',
    title: 'Phase 1: Story Angle Refinement',
    context: {
      runId: ctx.runId,
      phase: 'angle-refinement',
      storyAngle
    }
  });

  const refinedAngle = await ctx.task(refineStoryAngleTask, {
    storyAngle,
    campaign,
    mediaList
  });

  // Phase 2: Media List Segmentation
  await ctx.breakpoint({
    question: 'Story angle refined. Segment media list for personalized outreach?',
    title: 'Phase 2: Media Segmentation',
    context: {
      runId: ctx.runId,
      phase: 'media-segmentation',
      totalContacts: mediaList.length
    }
  });

  const segmentedList = await ctx.task(segmentMediaListTask, {
    mediaList,
    refinedAngle,
    exclusiveStrategy
  });

  // Phase 3: Personalized Pitch Development
  await ctx.breakpoint({
    question: 'Media segmented. Develop personalized pitches for each segment?',
    title: 'Phase 3: Pitch Development',
    context: {
      runId: ctx.runId,
      phase: 'pitch-development',
      segments: segmentedList.segments.length
    }
  });

  const pitches = await ctx.task(developPersonalizedPitchesTask, {
    segmentedList,
    refinedAngle,
    assets,
    campaign
  });

  // Phase 4: Exclusive/Embargo Coordination
  if (exclusiveStrategy) {
    await ctx.breakpoint({
      question: 'Pitches developed. Execute exclusive/embargo strategy?',
      title: 'Phase 4: Exclusive Strategy',
      context: {
        runId: ctx.runId,
        phase: 'exclusive-strategy',
        exclusiveStrategy
      }
    });

    const exclusiveResult = await ctx.task(executeExclusiveStrategyTask, {
      exclusiveStrategy,
      pitches,
      segmentedList
    });

    pitches.exclusiveOutcome = exclusiveResult;
  }

  // Phase 5: Outreach Execution
  await ctx.breakpoint({
    question: 'Execute outreach campaign according to timeline?',
    title: 'Phase 5: Outreach Execution',
    context: {
      runId: ctx.runId,
      phase: 'outreach-execution',
      timeline,
      pitchCount: pitches.pitchList.length
    }
  });

  const outreachExecution = await ctx.task(executeOutreachTask, {
    pitches,
    timeline,
    segmentedList
  });

  // Phase 6: Response Tracking
  await ctx.breakpoint({
    question: 'Outreach in progress. Set up response tracking and monitoring?',
    title: 'Phase 6: Response Tracking',
    context: {
      runId: ctx.runId,
      phase: 'response-tracking'
    }
  });

  const responseTracking = await ctx.task(trackResponsesTask, {
    outreachExecution,
    mediaList: segmentedList
  });

  // Phase 7: Follow-up Coordination
  await ctx.breakpoint({
    question: 'Track follow-up activities and journalist requests?',
    title: 'Phase 7: Follow-up Coordination',
    context: {
      runId: ctx.runId,
      phase: 'follow-up',
      responsesReceived: responseTracking.responses.length
    }
  });

  const followUpPlan = await ctx.task(coordinateFollowUpTask, {
    responseTracking,
    pitches,
    assets,
    timeline
  });

  // Phase 8: Campaign Analysis
  await ctx.breakpoint({
    question: 'Analyze campaign performance and coverage secured?',
    title: 'Phase 8: Campaign Analysis',
    context: {
      runId: ctx.runId,
      phase: 'campaign-analysis',
      targetQuality
    }
  });

  const campaignAnalysis = await ctx.task(analyzeCampaignPerformanceTask, {
    outreachExecution,
    responseTracking,
    followUpPlan,
    targetQuality
  });

  const quality = campaignAnalysis.score;

  return {
    success: quality >= targetQuality,
    pitches: pitches.pitchList,
    outreachResults: {
      totalPitched: outreachExecution.totalPitched,
      delivered: outreachExecution.delivered,
      opened: responseTracking.opened,
      responded: responseTracking.responses.length,
      interested: responseTracking.interested,
      declined: responseTracking.declined
    },
    coverage: campaignAnalysis.coverageSecured,
    followUpStatus: followUpPlan.status,
    quality,
    targetQuality,
    metrics: campaignAnalysis.metrics,
    recommendations: campaignAnalysis.recommendations,
    metadata: {
      processId: 'specializations/domains/business/public-relations/media-pitching-campaigns',
      timestamp: ctx.now(),
      campaignId: campaign.id
    }
  };
}

// Task Definitions

export const refineStoryAngleTask = defineTask('refine-story-angle', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine Story Angle for Pitching',
  agent: {
    name: 'story-angle-refiner',
    prompt: {
      role: 'PR strategist specializing in media pitching and story development',
      task: 'Refine story angle for maximum media appeal and coverage potential',
      context: args,
      instructions: [
        'Analyze story angle for newsworthiness and timeliness',
        'Identify hooks that resonate with different media types',
        'Develop angle variations for different beats (business, tech, lifestyle)',
        'Create news hooks tied to current events or trends',
        'Identify data, research, or expert angles to strengthen pitch',
        'Define exclusive elements that add value for journalists',
        'Create visual story opportunities',
        'Develop human interest angles where applicable'
      ],
      outputFormat: 'JSON with primaryAngle, angleVariations, newsHooks, dataPoints, visualOpportunities, humanInterest'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryAngle', 'angleVariations'],
      properties: {
        primaryAngle: { type: 'object' },
        angleVariations: { type: 'array', items: { type: 'object' } },
        newsHooks: { type: 'array', items: { type: 'string' } },
        dataPoints: { type: 'array', items: { type: 'object' } },
        visualOpportunities: { type: 'array', items: { type: 'string' } },
        humanInterest: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'story-angle']
}));

export const segmentMediaListTask = defineTask('segment-media-list', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Segment Media List',
  agent: {
    name: 'media-list-segmenter',
    prompt: {
      role: 'Media relations specialist expert in journalist targeting',
      task: 'Segment media list for personalized pitch approach',
      context: args,
      instructions: [
        'Segment by outlet type (national, trade, regional, digital)',
        'Group by journalist beat and coverage interests',
        'Identify priority tier assignments',
        'Flag exclusive candidates based on relationship strength',
        'Note journalist preferences (email, phone, DM)',
        'Identify timing preferences by segment',
        'Create outreach sequence order',
        'Flag journalists requiring special handling'
      ],
      outputFormat: 'JSON with segments array (name, contacts, approach, timing, priority), exclusiveCandidates, outreachOrder'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'outreachOrder'],
      properties: {
        segments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              contacts: { type: 'array' },
              approach: { type: 'string' },
              timing: { type: 'object' },
              priority: { type: 'number' }
            }
          }
        },
        exclusiveCandidates: { type: 'array', items: { type: 'object' } },
        outreachOrder: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'media-segmentation']
}));

export const developPersonalizedPitchesTask = defineTask('develop-personalized-pitches', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Personalized Pitches',
  agent: {
    name: 'pitch-developer',
    prompt: {
      role: 'Media pitching expert crafting journalist-specific outreach',
      task: 'Develop personalized pitches for each media segment and key contacts',
      context: args,
      instructions: [
        'Create pitch template for each segment with customization points',
        'Write highly personalized pitches for priority journalists',
        'Tailor angle and hook to journalist\'s beat and interests',
        'Reference journalist\'s recent work where relevant',
        'Include compelling subject lines for email pitches',
        'Create concise, scannable pitch structure',
        'Include clear call-to-action and next steps',
        'Attach or link relevant assets and resources',
        'Create follow-up pitch variations'
      ],
      outputFormat: 'JSON with pitchList array (journalist, pitch, subjectLine, assets, followUp), templates, personalizedCount'
    },
    outputSchema: {
      type: 'object',
      required: ['pitchList', 'templates'],
      properties: {
        pitchList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              journalist: { type: 'object' },
              pitch: { type: 'string' },
              subjectLine: { type: 'string' },
              assets: { type: 'array' },
              followUp: { type: 'string' }
            }
          }
        },
        templates: { type: 'array', items: { type: 'object' } },
        personalizedCount: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'pitch-development']
}));

export const executeExclusiveStrategyTask = defineTask('execute-exclusive-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Exclusive Strategy',
  agent: {
    name: 'exclusive-coordinator',
    prompt: {
      role: 'Senior media relations manager handling exclusive arrangements',
      task: 'Coordinate exclusive or embargo strategy with priority outlets',
      context: args,
      instructions: [
        'Identify optimal exclusive candidate based on reach and fit',
        'Prepare exclusive pitch with enhanced access/information',
        'Define exclusive window and embargo terms',
        'Create exclusive agreement documentation',
        'Plan fallback strategy if exclusive is declined',
        'Coordinate timing with wide-release strategy',
        'Track exclusive acceptance/decline status',
        'Manage embargo compliance monitoring'
      ],
      outputFormat: 'JSON with exclusiveOffer, candidate, terms, fallback, status, embargoDetails'
    },
    outputSchema: {
      type: 'object',
      required: ['exclusiveOffer', 'candidate'],
      properties: {
        exclusiveOffer: { type: 'object' },
        candidate: { type: 'object' },
        terms: { type: 'object' },
        fallback: { type: 'object' },
        status: { type: 'string' },
        embargoDetails: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'exclusive-strategy']
}));

export const executeOutreachTask = defineTask('execute-outreach', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Outreach Campaign',
  agent: {
    name: 'outreach-executor',
    prompt: {
      role: 'Media outreach coordinator managing pitch delivery',
      task: 'Execute outreach campaign according to timeline and sequence',
      context: args,
      instructions: [
        'Schedule pitch delivery according to timeline',
        'Send pitches via preferred channels (email, phone, social)',
        'Track delivery status and confirmations',
        'Log all outreach activities with timestamps',
        'Handle bounces and delivery failures',
        'Coordinate simultaneous vs. staggered outreach',
        'Monitor for immediate responses',
        'Document outreach completion status'
      ],
      outputFormat: 'JSON with totalPitched, delivered, failed, pendingFollowUp, outreachLog, timeline'
    },
    outputSchema: {
      type: 'object',
      required: ['totalPitched', 'delivered'],
      properties: {
        totalPitched: { type: 'number' },
        delivered: { type: 'number' },
        failed: { type: 'number' },
        pendingFollowUp: { type: 'array', items: { type: 'object' } },
        outreachLog: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'outreach-execution']
}));

export const trackResponsesTask = defineTask('track-responses', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Track Responses and Interest',
  agent: {
    name: 'response-tracker',
    prompt: {
      role: 'Media relations coordinator tracking journalist engagement',
      task: 'Track and categorize journalist responses to pitches',
      context: args,
      instructions: [
        'Monitor for journalist responses across all channels',
        'Categorize responses: interested, need more info, declined, no response',
        'Track email open rates and click-through where available',
        'Log journalist questions and information requests',
        'Identify interview and briefing requests',
        'Track deadline requirements from interested journalists',
        'Note relationship sentiment and feedback',
        'Create priority response queue'
      ],
      outputFormat: 'JSON with responses array, interested, declined, noResponse, opened, informationRequests, interviewRequests'
    },
    outputSchema: {
      type: 'object',
      required: ['responses', 'interested', 'declined'],
      properties: {
        responses: { type: 'array', items: { type: 'object' } },
        interested: { type: 'number' },
        declined: { type: 'number' },
        noResponse: { type: 'number' },
        opened: { type: 'number' },
        informationRequests: { type: 'array', items: { type: 'object' } },
        interviewRequests: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'response-tracking']
}));

export const coordinateFollowUpTask = defineTask('coordinate-follow-up', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Coordinate Follow-up Activities',
  agent: {
    name: 'follow-up-coordinator',
    prompt: {
      role: 'Media relations manager coordinating journalist follow-up',
      task: 'Coordinate follow-up activities and journalist requests',
      context: args,
      instructions: [
        'Schedule follow-up outreach for non-responders',
        'Respond to journalist information requests',
        'Coordinate interview scheduling with spokespersons',
        'Provide requested assets and materials',
        'Track article/coverage development progress',
        'Handle fact-checking and verification requests',
        'Manage deadline coordination',
        'Document all follow-up interactions'
      ],
      outputFormat: 'JSON with status, scheduledFollowUps, interviewsScheduled, materialsProvided, pendingRequests, coverageInProgress'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'scheduledFollowUps'],
      properties: {
        status: { type: 'string' },
        scheduledFollowUps: { type: 'array', items: { type: 'object' } },
        interviewsScheduled: { type: 'array', items: { type: 'object' } },
        materialsProvided: { type: 'array', items: { type: 'object' } },
        pendingRequests: { type: 'array', items: { type: 'object' } },
        coverageInProgress: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'follow-up']
}));

export const analyzeCampaignPerformanceTask = defineTask('analyze-campaign-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Campaign Performance',
  agent: {
    name: 'campaign-analyst',
    prompt: {
      role: 'PR analytics specialist measuring campaign effectiveness',
      task: 'Analyze pitching campaign performance and coverage outcomes',
      context: args,
      instructions: [
        'Calculate pitch-to-response rate',
        'Measure pitch-to-coverage conversion rate',
        'Assess coverage quality and message pull-through',
        'Analyze outlet tier performance',
        'Evaluate personalization effectiveness',
        'Track share of voice impact',
        'Identify top-performing angles and pitches',
        'Provide overall campaign score (0-100)',
        'Generate recommendations for future campaigns'
      ],
      outputFormat: 'JSON with score, metrics object, coverageSecured array, topPerformers, lessons, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'metrics', 'coverageSecured'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        metrics: { type: 'object' },
        coverageSecured: { type: 'array', items: { type: 'object' } },
        topPerformers: { type: 'object' },
        lessons: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'campaign-analysis']
}));
