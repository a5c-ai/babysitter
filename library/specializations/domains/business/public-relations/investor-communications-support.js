/**
 * @process specializations/domains/business/public-relations/investor-communications-support
 * @description Partner with IR on earnings communications, corporate announcements, and executive presentations that align corporate narrative with financial messaging
 * @specialization Public Relations and Communications
 * @category Stakeholder Communications
 * @inputs { organization: object, financialData: object, corporateNarrative: object, upcomingEvents: object[] }
 * @outputs { success: boolean, communicationsPackage: object, presentationSupport: object, alignmentGuidelines: object, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization,
    financialData,
    corporateNarrative = {},
    upcomingEvents = [],
    investorTargets = [],
    targetQuality = 90
  } = inputs;

  // Phase 1: Narrative Alignment Assessment
  await ctx.breakpoint({
    question: 'Starting investor communications support. Assess narrative alignment?',
    title: 'Phase 1: Narrative Alignment',
    context: {
      runId: ctx.runId,
      phase: 'narrative-alignment',
      organization: organization.name
    }
  });

  const narrativeAlignment = await ctx.task(assessNarrativeAlignmentTask, {
    corporateNarrative,
    financialData,
    organization
  });

  // Phase 2: Earnings Communications Development
  await ctx.breakpoint({
    question: 'Alignment assessed. Develop earnings communications?',
    title: 'Phase 2: Earnings Communications',
    context: {
      runId: ctx.runId,
      phase: 'earnings-communications'
    }
  });

  const earningsCommunications = await ctx.task(developEarningsCommunicationsTask, {
    financialData,
    narrativeAlignment,
    corporateNarrative
  });

  // Phase 3: Corporate Announcement Support
  await ctx.breakpoint({
    question: 'Earnings comms developed. Create corporate announcement templates?',
    title: 'Phase 3: Corporate Announcements',
    context: {
      runId: ctx.runId,
      phase: 'corporate-announcements'
    }
  });

  const corporateAnnouncements = await ctx.task(createAnnouncementTemplatesTask, {
    narrativeAlignment,
    organization
  });

  // Phase 4: Executive Presentation Support
  await ctx.breakpoint({
    question: 'Templates created. Develop executive presentation support?',
    title: 'Phase 4: Presentation Support',
    context: {
      runId: ctx.runId,
      phase: 'presentation-support',
      eventCount: upcomingEvents.length
    }
  });

  const presentationSupport = await ctx.task(developPresentationSupportTask, {
    upcomingEvents,
    narrativeAlignment,
    financialData
  });

  // Phase 5: Q&A Preparation
  await ctx.breakpoint({
    question: 'Presentation support ready. Prepare investor Q&A?',
    title: 'Phase 5: Q&A Preparation',
    context: {
      runId: ctx.runId,
      phase: 'qa-preparation'
    }
  });

  const qaPreparation = await ctx.task(prepareInvestorQaTask, {
    financialData,
    corporateNarrative,
    narrativeAlignment
  });

  // Phase 6: Investor Targeting Support
  await ctx.breakpoint({
    question: 'Q&A prepared. Support investor targeting?',
    title: 'Phase 6: Investor Targeting',
    context: {
      runId: ctx.runId,
      phase: 'investor-targeting'
    }
  });

  const investorTargeting = await ctx.task(supportInvestorTargetingTask, {
    investorTargets,
    narrativeAlignment,
    organization
  });

  // Phase 7: Multi-Channel Coordination
  await ctx.breakpoint({
    question: 'Targeting supported. Coordinate multi-channel delivery?',
    title: 'Phase 7: Multi-Channel Coordination',
    context: {
      runId: ctx.runId,
      phase: 'multi-channel'
    }
  });

  const channelCoordination = await ctx.task(coordinateChannelsTask, {
    earningsCommunications,
    corporateAnnouncements,
    presentationSupport
  });

  // Phase 8: Quality Validation
  await ctx.breakpoint({
    question: 'Validate investor communications quality?',
    title: 'Phase 8: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateInvestorCommsTask, {
    narrativeAlignment,
    earningsCommunications,
    corporateAnnouncements,
    presentationSupport,
    qaPreparation,
    channelCoordination,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      communicationsPackage: {
        earningsCommunications,
        corporateAnnouncements: corporateAnnouncements.templates,
        qaPreparation,
        channelCoordination
      },
      presentationSupport,
      alignmentGuidelines: narrativeAlignment,
      investorTargeting,
      quality,
      targetQuality,
      metadata: {
        processId: 'specializations/domains/business/public-relations/investor-communications-support',
        timestamp: ctx.now(),
        organization: organization.name
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
        processId: 'specializations/domains/business/public-relations/investor-communications-support',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const assessNarrativeAlignmentTask = defineTask('assess-narrative-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Narrative Alignment',
  agent: {
    name: 'narrative-alignment-assessor',
    prompt: {
      role: 'Investor communications specialist assessing narrative consistency',
      task: 'Assess alignment between corporate and financial narratives',
      context: args,
      instructions: [
        'Review corporate narrative and key messages',
        'Analyze financial story and investment thesis',
        'Identify alignment points between narratives',
        'Identify gaps or inconsistencies',
        'Define integrated messaging framework',
        'Create corporate-to-financial message bridges',
        'Ensure regulatory compliance of messaging',
        'Define message governance guidelines'
      ],
      outputFormat: 'JSON with alignmentPoints, gaps, integratedFramework, messageBridges, complianceNotes, governanceGuidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['alignmentPoints', 'integratedFramework'],
      properties: {
        alignmentPoints: { type: 'array', items: { type: 'object' } },
        gaps: { type: 'array', items: { type: 'object' } },
        integratedFramework: { type: 'object' },
        messageBridges: { type: 'array', items: { type: 'object' } },
        complianceNotes: { type: 'array', items: { type: 'string' } },
        governanceGuidelines: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'narrative-alignment']
}));

export const developEarningsCommunicationsTask = defineTask('develop-earnings-communications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Earnings Communications',
  agent: {
    name: 'earnings-comms-developer',
    prompt: {
      role: 'Investor communications writer developing earnings materials',
      task: 'Develop earnings communications materials',
      context: args,
      instructions: [
        'Draft earnings press release template',
        'Create earnings call script support',
        'Develop earnings presentation narrative',
        'Create social media content for earnings',
        'Develop employee communications about earnings',
        'Create media Q&A for earnings',
        'Ensure consistency with corporate messaging',
        'Include forward-looking statement guidance'
      ],
      outputFormat: 'JSON with pressRelease, callScript, presentationNarrative, socialContent, employeeComms, mediaQa, forwardLookingGuidance'
    },
    outputSchema: {
      type: 'object',
      required: ['pressRelease', 'callScript', 'presentationNarrative'],
      properties: {
        pressRelease: { type: 'object' },
        callScript: { type: 'object' },
        presentationNarrative: { type: 'object' },
        socialContent: { type: 'array', items: { type: 'object' } },
        employeeComms: { type: 'object' },
        mediaQa: { type: 'array', items: { type: 'object' } },
        forwardLookingGuidance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'earnings-communications']
}));

export const createAnnouncementTemplatesTask = defineTask('create-announcement-templates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Corporate Announcement Templates',
  agent: {
    name: 'announcement-template-creator',
    prompt: {
      role: 'Corporate communications specialist creating announcement templates',
      task: 'Create templates for corporate announcements',
      context: args,
      instructions: [
        'Create M&A announcement template',
        'Develop executive leadership change template',
        'Create strategic initiative announcement template',
        'Develop partnership announcement template',
        'Create dividend/capital return announcement template',
        'Develop guidance update template',
        'Ensure Reg FD compliance',
        'Create social media announcement templates'
      ],
      outputFormat: 'JSON with templates array (type, pressRelease, socialMedia, employeeComms, compliance), regulatoryChecklist'
    },
    outputSchema: {
      type: 'object',
      required: ['templates'],
      properties: {
        templates: { type: 'array', items: { type: 'object' } },
        regulatoryChecklist: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'announcement-templates']
}));

export const developPresentationSupportTask = defineTask('develop-presentation-support', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Executive Presentation Support',
  agent: {
    name: 'presentation-support-developer',
    prompt: {
      role: 'Executive presentation specialist developing investor materials',
      task: 'Develop support for executive investor presentations',
      context: args,
      instructions: [
        'Review upcoming investor events',
        'Develop presentation narrative framework',
        'Create speaking notes and talking points',
        'Develop slide narrative guidance',
        'Create visual storytelling recommendations',
        'Prepare speaker briefings',
        'Develop presentation Q&A preparation',
        'Create post-presentation follow-up materials'
      ],
      outputFormat: 'JSON with events array (event, narrative, speakingNotes, slideGuidance, visualRecommendations, speakerBriefing, qaPrep, followUp)'
    },
    outputSchema: {
      type: 'object',
      required: ['events'],
      properties: {
        events: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'presentation-support']
}));

export const prepareInvestorQaTask = defineTask('prepare-investor-qa', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare Investor Q&A',
  agent: {
    name: 'investor-qa-preparer',
    prompt: {
      role: 'Investor relations specialist preparing Q&A materials',
      task: 'Prepare comprehensive investor Q&A',
      context: args,
      instructions: [
        'Anticipate analyst questions on financials',
        'Prepare strategic direction questions',
        'Develop competitive positioning Q&A',
        'Prepare market opportunity Q&A',
        'Create management/governance Q&A',
        'Develop ESG/sustainability Q&A',
        'Prepare sensitive topic responses',
        'Ensure message discipline guidance'
      ],
      outputFormat: 'JSON with qaCategories object (financial, strategic, competitive, market, management, esg, sensitive), messageDiscipline, bridgingTechniques'
    },
    outputSchema: {
      type: 'object',
      required: ['qaCategories', 'messageDiscipline'],
      properties: {
        qaCategories: { type: 'object' },
        messageDiscipline: { type: 'object' },
        bridgingTechniques: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'investor-qa']
}));

export const supportInvestorTargetingTask = defineTask('support-investor-targeting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Support Investor Targeting',
  agent: {
    name: 'investor-targeting-supporter',
    prompt: {
      role: 'Investor outreach specialist supporting targeting efforts',
      task: 'Support investor targeting with communications materials',
      context: args,
      instructions: [
        'Develop investor profile communications needs',
        'Create tailored messaging for investor types',
        'Develop meeting materials by investor type',
        'Create follow-up communication templates',
        'Develop investor event participation strategy',
        'Create roadshow communications support',
        'Develop investor day planning support',
        'Define success metrics for outreach'
      ],
      outputFormat: 'JSON with investorProfiles, tailoredMessaging, meetingMaterials, followUpTemplates, eventStrategy, roadshowSupport, investorDayPlanning, metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['investorProfiles', 'tailoredMessaging'],
      properties: {
        investorProfiles: { type: 'array', items: { type: 'object' } },
        tailoredMessaging: { type: 'object' },
        meetingMaterials: { type: 'array', items: { type: 'object' } },
        followUpTemplates: { type: 'array', items: { type: 'object' } },
        eventStrategy: { type: 'object' },
        roadshowSupport: { type: 'object' },
        investorDayPlanning: { type: 'object' },
        metrics: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'investor-targeting']
}));

export const coordinateChannelsTask = defineTask('coordinate-channels', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Coordinate Multi-Channel Delivery',
  agent: {
    name: 'channel-coordinator',
    prompt: {
      role: 'Communications operations specialist coordinating delivery',
      task: 'Coordinate multi-channel investor communications delivery',
      context: args,
      instructions: [
        'Plan wire service distribution',
        'Coordinate website posting timing',
        'Plan social media coordination',
        'Coordinate media distribution',
        'Plan employee communications timing',
        'Coordinate with investor relations on timing',
        'Define approval workflow',
        'Create distribution checklist'
      ],
      outputFormat: 'JSON with wireDistribution, websitePosting, socialMediaTiming, mediaDistribution, employeeTiming, irCoordination, approvalWorkflow, distributionChecklist'
    },
    outputSchema: {
      type: 'object',
      required: ['wireDistribution', 'approvalWorkflow', 'distributionChecklist'],
      properties: {
        wireDistribution: { type: 'object' },
        websitePosting: { type: 'object' },
        socialMediaTiming: { type: 'object' },
        mediaDistribution: { type: 'object' },
        employeeTiming: { type: 'object' },
        irCoordination: { type: 'object' },
        approvalWorkflow: { type: 'object' },
        distributionChecklist: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'channel-coordination']
}));

export const validateInvestorCommsTask = defineTask('validate-investor-comms', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Investor Communications Quality',
  agent: {
    name: 'investor-comms-validator',
    prompt: {
      role: 'Investor communications quality assessor',
      task: 'Validate investor communications quality',
      context: args,
      instructions: [
        'Assess narrative alignment quality',
        'Evaluate earnings communications completeness',
        'Review announcement template coverage',
        'Assess presentation support quality',
        'Evaluate Q&A preparation thoroughness',
        'Review channel coordination effectiveness',
        'Assess regulatory compliance',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, alignmentScore, earningsScore, announcementScore, presentationScore, qaScore, channelScore, complianceScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        alignmentScore: { type: 'number' },
        earningsScore: { type: 'number' },
        announcementScore: { type: 'number' },
        presentationScore: { type: 'number' },
        qaScore: { type: 'number' },
        channelScore: { type: 'number' },
        complianceScore: { type: 'number' },
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
