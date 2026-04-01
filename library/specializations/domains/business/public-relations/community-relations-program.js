/**
 * @process specializations/domains/business/public-relations/community-relations-program
 * @description Build and maintain relationships with local communities through outreach programs, partnerships, and transparent communications about organizational activities
 * @specialization Public Relations and Communications
 * @category Stakeholder Communications
 * @inputs { organization: object, communities: object[], existingPrograms: object[], localContext: object }
 * @outputs { success: boolean, communityStrategy: object, programPlan: object, engagementCalendar: object, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization,
    communities = [],
    existingPrograms = [],
    localContext = {},
    targetQuality = 85
  } = inputs;

  let lastFeedback_phase1Review = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    // No preceding task identified for re-run with feedback
    const phase1Review = await ctx.breakpoint({
    question: 'Starting community relations program development. Assess communities?',
    title: 'Phase 1: Community Assessment',
    context: {
      runId: ctx.runId,
      phase: 'community-assessment',
      communityCount: communities.length
    },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_phase1Review || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (phase1Review.approved) break;
    lastFeedback_phase1Review = phase1Review.response || phase1Review.feedback || 'Changes requested';
  }
  let communityAssessment = await ctx.task(assessCommunitiesTask, {
    communities,
    organization,
    localContext
  });

    let lastFeedback_phase2Review = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_phase2Review) {
      communityAssessment = await ctx.task(assessCommunitiesTask, { ...{
    communities,
    organization,
    localContext
  }, feedback: lastFeedback_phase2Review, attempt: attempt + 1 });
    }
  const phase2Review = await ctx.breakpoint({
    question: 'Communities assessed. Identify community stakeholders?',
    title: 'Phase 2: Community Stakeholders',
    context: {
      runId: ctx.runId,
      phase: 'stakeholder-identification'
    },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_phase2Review || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (phase2Review.approved) break;
    lastFeedback_phase2Review = phase2Review.response || phase2Review.feedback || 'Changes requested';
  }
  let communityStakeholders = await ctx.task(identifyCommunityStakeholdersTask, {
    communityAssessment,
    organization
  });

    let lastFeedback_phase3Review = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_phase3Review) {
      communityStakeholders = await ctx.task(identifyCommunityStakeholdersTask, { ...{
    communityAssessment,
    organization
  }, feedback: lastFeedback_phase3Review, attempt: attempt + 1 });
    }
  const phase3Review = await ctx.breakpoint({
    question: 'Stakeholders identified. Develop program strategy?',
    title: 'Phase 3: Program Strategy',
    context: {
      runId: ctx.runId,
      phase: 'program-strategy'
    },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_phase3Review || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (phase3Review.approved) break;
    lastFeedback_phase3Review = phase3Review.response || phase3Review.feedback || 'Changes requested';
  }
  let programStrategy = await ctx.task(developProgramStrategyTask, {
    communityAssessment,
    communityStakeholders,
    existingPrograms,
    organization
  });

    let lastFeedback_phase4Review = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_phase4Review) {
      programStrategy = await ctx.task(developProgramStrategyTask, { ...{
    communityAssessment,
    communityStakeholders,
    existingPrograms,
    organization
  }, feedback: lastFeedback_phase4Review, attempt: attempt + 1 });
    }
  const phase4Review = await ctx.breakpoint({
    question: 'Strategy developed. Plan community partnerships?',
    title: 'Phase 4: Partnership Planning',
    context: {
      runId: ctx.runId,
      phase: 'partnership-planning'
    },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_phase4Review || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (phase4Review.approved) break;
    lastFeedback_phase4Review = phase4Review.response || phase4Review.feedback || 'Changes requested';
  }
  let partnershipPlan = await ctx.task(planCommunityPartnershipsTask, {
    communityStakeholders,
    programStrategy,
    localContext
  });

    let lastFeedback_phase5Review = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_phase5Review) {
      partnershipPlan = await ctx.task(planCommunityPartnershipsTask, { ...{
    communityStakeholders,
    programStrategy,
    localContext
  }, feedback: lastFeedback_phase5Review, attempt: attempt + 1 });
    }
  const phase5Review = await ctx.breakpoint({
    question: 'Partnerships planned. Design outreach programs?',
    title: 'Phase 5: Outreach Programs',
    context: {
      runId: ctx.runId,
      phase: 'outreach-programs'
    },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_phase5Review || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (phase5Review.approved) break;
    lastFeedback_phase5Review = phase5Review.response || phase5Review.feedback || 'Changes requested';
  }
  let outreachPrograms = await ctx.task(designOutreachProgramsTask, {
    programStrategy,
    communityAssessment,
    partnershipPlan
  });

    let lastFeedback_phase6Review = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_phase6Review) {
      outreachPrograms = await ctx.task(designOutreachProgramsTask, { ...{
    programStrategy,
    communityAssessment,
    partnershipPlan
  }, feedback: lastFeedback_phase6Review, attempt: attempt + 1 });
    }
  const phase6Review = await ctx.breakpoint({
    question: 'Programs designed. Create community communications strategy?',
    title: 'Phase 6: Communications Strategy',
    context: {
      runId: ctx.runId,
      phase: 'communications-strategy'
    },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_phase6Review || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (phase6Review.approved) break;
    lastFeedback_phase6Review = phase6Review.response || phase6Review.feedback || 'Changes requested';
  }
  let communicationsStrategy = await ctx.task(createCommunityCommsTask, {
    communityStakeholders,
    programStrategy,
    outreachPrograms
  });

    let lastFeedback_phase7Review = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_phase7Review) {
      communicationsStrategy = await ctx.task(createCommunityCommsTask, { ...{
    communityStakeholders,
    programStrategy,
    outreachPrograms
  }, feedback: lastFeedback_phase7Review, attempt: attempt + 1 });
    }
  const phase7Review = await ctx.breakpoint({
    question: 'Strategy created. Build engagement calendar?',
    title: 'Phase 7: Engagement Calendar',
    context: {
      runId: ctx.runId,
      phase: 'engagement-calendar'
    },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_phase7Review || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (phase7Review.approved) break;
    lastFeedback_phase7Review = phase7Review.response || phase7Review.feedback || 'Changes requested';
  }
  let engagementCalendar = await ctx.task(buildEngagementCalendarTask, {
    outreachPrograms,
    partnershipPlan,
    communicationsStrategy,
    localContext
  });

    let lastFeedback_finalApproval = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_finalApproval) {
      engagementCalendar = await ctx.task(buildEngagementCalendarTask, { ...{
    outreachPrograms,
    partnershipPlan,
    communicationsStrategy,
    localContext
  }, feedback: lastFeedback_finalApproval, attempt: attempt + 1 });
    }
  const finalApproval = await ctx.breakpoint({
    question: 'Validate community relations program quality?',
    title: 'Phase 8: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_finalApproval || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (finalApproval.approved) break;
    lastFeedback_finalApproval = finalApproval.response || finalApproval.feedback || 'Changes requested';
  }
  const qualityResult = await ctx.task(validateCommunityProgramTask, {
    communityAssessment,
    communityStakeholders,
    programStrategy,
    partnershipPlan,
    outreachPrograms,
    communicationsStrategy,
    engagementCalendar,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      communityStrategy: {
        assessment: communityAssessment.summary,
        stakeholders: communityStakeholders,
        strategy: programStrategy,
        communications: communicationsStrategy
      },
      programPlan: {
        partnerships: partnershipPlan.partnerships,
        outreachPrograms: outreachPrograms.programs
      },
      engagementCalendar,
      quality,
      targetQuality,
      metadata: {
        processId: 'specializations/domains/business/public-relations/community-relations-program',
        timestamp: ctx.now(),
        organization: organization.name,
        communityCount: communities.length
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
        processId: 'specializations/domains/business/public-relations/community-relations-program',
        timestamp: ctx.now()
      }
    };
  }
}
  // Task Definitions

export const assessCommunitiesTask = defineTask('assess-communities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Communities',
  agent: {
    name: 'community-assessor',
    prompt: {
      role: 'Community relations specialist assessing local communities',
      task: 'Assess communities where organization operates',
      context: args,
      instructions: [
        'Profile each community (demographics, economics, culture)',
        'Assess community needs and priorities',
        'Identify community assets and strengths',
        'Understand community concerns about organization',
        'Map community decision-making structures',
        'Assess current community perception',
        'Identify community influencers',
        'Understand local media landscape'
      ],
      outputFormat: 'JSON with communities array (profile, needs, assets, concerns, decisionStructure, perception, influencers, localMedia), overallAssessment, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['communities', 'summary'],
      properties: {
        communities: { type: 'array', items: { type: 'object' } },
        overallAssessment: { type: 'object' },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'community-assessment']
}));

export const identifyCommunityStakeholdersTask = defineTask('identify-community-stakeholders', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Community Stakeholders',
  agent: {
    name: 'community-stakeholder-identifier',
    prompt: {
      role: 'Stakeholder mapping specialist for community relations',
      task: 'Identify key community stakeholders',
      context: args,
      instructions: [
        'Identify local government officials',
        'Map community organizations and nonprofits',
        'Identify educational institution leaders',
        'Map business community leaders',
        'Identify neighborhood associations',
        'Map faith-based organizations',
        'Identify environmental and advocacy groups',
        'Prioritize stakeholders by influence and engagement need'
      ],
      outputFormat: 'JSON with stakeholders array (name, type, role, influence, engagementPriority), localGovernment, nonprofits, education, business, neighborhoods, faithBased, advocacyGroups'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholders'],
      properties: {
        stakeholders: { type: 'array', items: { type: 'object' } },
        localGovernment: { type: 'array', items: { type: 'object' } },
        nonprofits: { type: 'array', items: { type: 'object' } },
        education: { type: 'array', items: { type: 'object' } },
        business: { type: 'array', items: { type: 'object' } },
        neighborhoods: { type: 'array', items: { type: 'object' } },
        faithBased: { type: 'array', items: { type: 'object' } },
        advocacyGroups: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'community-stakeholders']
}));

export const developProgramStrategyTask = defineTask('develop-program-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Program Strategy',
  agent: {
    name: 'community-program-strategist',
    prompt: {
      role: 'Community relations strategist developing program approach',
      task: 'Develop community relations program strategy',
      context: args,
      instructions: [
        'Define community relations objectives',
        'Align with corporate values and priorities',
        'Identify focus areas based on community needs',
        'Define resource allocation approach',
        'Set program goals and targets',
        'Determine engagement approach by community',
        'Define employee involvement strategy',
        'Create measurement framework'
      ],
      outputFormat: 'JSON with objectives, corporateAlignment, focusAreas, resourceAllocation, goals, engagementApproach, employeeInvolvement, measurementFramework'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'focusAreas', 'goals'],
      properties: {
        objectives: { type: 'array', items: { type: 'string' } },
        corporateAlignment: { type: 'object' },
        focusAreas: { type: 'array', items: { type: 'object' } },
        resourceAllocation: { type: 'object' },
        goals: { type: 'array', items: { type: 'object' } },
        engagementApproach: { type: 'object' },
        employeeInvolvement: { type: 'object' },
        measurementFramework: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'program-strategy']
}));

export const planCommunityPartnershipsTask = defineTask('plan-community-partnerships', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Community Partnerships',
  agent: {
    name: 'partnership-planner',
    prompt: {
      role: 'Community partnership specialist planning collaborations',
      task: 'Plan strategic community partnerships',
      context: args,
      instructions: [
        'Identify potential nonprofit partners',
        'Define partnership types and structures',
        'Plan educational institution partnerships',
        'Develop community foundation relationships',
        'Define mutual benefit and value exchange',
        'Plan partnership governance',
        'Define partnership communications',
        'Create partnership success metrics'
      ],
      outputFormat: 'JSON with partnerships array (partner, type, structure, valuExchange, governance), nonprofitPartners, educationalPartners, foundationRelationships, metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['partnerships'],
      properties: {
        partnerships: { type: 'array', items: { type: 'object' } },
        nonprofitPartners: { type: 'array', items: { type: 'object' } },
        educationalPartners: { type: 'array', items: { type: 'object' } },
        foundationRelationships: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'partnership-planning']
}));

export const designOutreachProgramsTask = defineTask('design-outreach-programs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Outreach Programs',
  agent: {
    name: 'outreach-program-designer',
    prompt: {
      role: 'Community outreach specialist designing programs',
      task: 'Design community outreach programs',
      context: args,
      instructions: [
        'Design volunteer programs for employees',
        'Create educational outreach initiatives',
        'Design community grants program',
        'Plan community event sponsorships',
        'Create open house and facility tour programs',
        'Design community advisory mechanisms',
        'Plan community investment initiatives',
        'Create community benefit programs'
      ],
      outputFormat: 'JSON with programs array (name, type, objectives, activities, resources, timeline), volunteerPrograms, educationalInitiatives, grantsProgram, sponsorships, openHouses, advisoryMechanisms'
    },
    outputSchema: {
      type: 'object',
      required: ['programs'],
      properties: {
        programs: { type: 'array', items: { type: 'object' } },
        volunteerPrograms: { type: 'array', items: { type: 'object' } },
        educationalInitiatives: { type: 'array', items: { type: 'object' } },
        grantsProgram: { type: 'object' },
        sponsorships: { type: 'array', items: { type: 'object' } },
        openHouses: { type: 'array', items: { type: 'object' } },
        advisoryMechanisms: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'outreach-programs']
}));

export const createCommunityCommsTask = defineTask('create-community-comms', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Community Communications Strategy',
  agent: {
    name: 'community-comms-creator',
    prompt: {
      role: 'Community communications specialist creating strategy',
      task: 'Create communications strategy for community relations',
      context: args,
      instructions: [
        'Define key messages for community audiences',
        'Create transparency communications approach',
        'Plan local media relations',
        'Design community newsletter or updates',
        'Create social media strategy for local engagement',
        'Plan community feedback mechanisms',
        'Develop crisis communications for community',
        'Define measurement approach'
      ],
      outputFormat: 'JSON with keyMessages, transparencyApproach, localMediaRelations, communityUpdates, socialMedia, feedbackMechanisms, crisisComms, measurement'
    },
    outputSchema: {
      type: 'object',
      required: ['keyMessages', 'transparencyApproach'],
      properties: {
        keyMessages: { type: 'array', items: { type: 'object' } },
        transparencyApproach: { type: 'object' },
        localMediaRelations: { type: 'object' },
        communityUpdates: { type: 'object' },
        socialMedia: { type: 'object' },
        feedbackMechanisms: { type: 'array', items: { type: 'object' } },
        crisisComms: { type: 'object' },
        measurement: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'community-communications']
}));

export const buildEngagementCalendarTask = defineTask('build-engagement-calendar', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build Engagement Calendar',
  agent: {
    name: 'engagement-calendar-builder',
    prompt: {
      role: 'Community engagement planner building activity calendar',
      task: 'Build comprehensive community engagement calendar',
      context: args,
      instructions: [
        'Schedule ongoing engagement activities',
        'Plan community events and participation',
        'Schedule stakeholder meetings',
        'Plan volunteer events',
        'Schedule communications touchpoints',
        'Plan grant and sponsorship cycles',
        'Align with local community calendars',
        'Create monthly and quarterly views'
      ],
      outputFormat: 'JSON with calendar array (date, activity, community, stakeholders, resources), monthlyView, quarterlyView, annualHighlights, resourcePlanning'
    },
    outputSchema: {
      type: 'object',
      required: ['calendar', 'monthlyView', 'quarterlyView'],
      properties: {
        calendar: { type: 'array', items: { type: 'object' } },
        monthlyView: { type: 'object' },
        quarterlyView: { type: 'object' },
        annualHighlights: { type: 'array', items: { type: 'object' } },
        resourcePlanning: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'engagement-calendar']
}));

export const validateCommunityProgramTask = defineTask('validate-community-program', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Community Program Quality',
  agent: {
    name: 'community-program-validator',
    prompt: {
      role: 'Community relations quality assessor',
      task: 'Validate community relations program quality',
      context: args,
      instructions: [
        'Assess community assessment thoroughness',
        'Evaluate stakeholder mapping completeness',
        'Review strategy alignment with needs',
        'Assess partnership plan viability',
        'Evaluate outreach program quality',
        'Review communications strategy effectiveness',
        'Assess calendar feasibility',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, assessmentScore, stakeholderScore, strategyScore, partnershipScore, outreachScore, commsScore, calendarScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        assessmentScore: { type: 'number' },
        stakeholderScore: { type: 'number' },
        strategyScore: { type: 'number' },
        partnershipScore: { type: 'number' },
        outreachScore: { type: 'number' },
        commsScore: { type: 'number' },
        calendarScore: { type: 'number' },
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
