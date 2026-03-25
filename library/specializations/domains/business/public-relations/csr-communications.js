/**
 * @process specializations/domains/business/public-relations/csr-communications
 * @description Develop and communicate CSR initiatives, sustainability programs, and corporate citizenship activities to stakeholders authentically
 * @specialization Public Relations and Communications
 * @category Corporate Communications
 * @inputs { csrProgram: object, organization: object, stakeholders: object[], reportingRequirements: object }
 * @outputs { success: boolean, communicationsStrategy: object, contentPlan: object, reportingPlan: object, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    csrProgram,
    organization,
    stakeholders = [],
    reportingRequirements = {},
    existingCommunications = {},
    industryBenchmarks = {},
    targetQuality = 85
  } = inputs;

  // Phase 1: CSR Program Assessment
  await ctx.breakpoint({
    question: 'Starting CSR communications development. Assess CSR program and initiatives?',
    title: 'Phase 1: Program Assessment',
    context: {
      runId: ctx.runId,
      phase: 'program-assessment',
      organization: organization.name
    }
  });

  const [programAssessment, stakeholderAnalysis] = await Promise.all([
    ctx.task(assessCsrProgramTask, {
      csrProgram,
      organization,
      existingCommunications
    }),
    ctx.task(analyzeStakeholderExpectationsTask, {
      stakeholders,
      csrProgram
    })
  ]);

  // Phase 2: Authenticity and Materiality Assessment
  await ctx.breakpoint({
    question: 'Program assessed. Evaluate authenticity and materiality?',
    title: 'Phase 2: Authenticity Assessment',
    context: {
      runId: ctx.runId,
      phase: 'authenticity-assessment'
    }
  });

  const authenticityAssessment = await ctx.task(assessAuthenticityTask, {
    programAssessment,
    stakeholderAnalysis,
    organization
  });

  // Phase 3: Messaging Framework
  await ctx.breakpoint({
    question: 'Authenticity validated. Develop CSR messaging framework?',
    title: 'Phase 3: Messaging Framework',
    context: {
      runId: ctx.runId,
      phase: 'messaging-framework'
    }
  });

  const messagingFramework = await ctx.task(developCsrMessagingTask, {
    programAssessment,
    authenticityAssessment,
    stakeholderAnalysis
  });

  // Phase 4: Stakeholder Communications Strategy
  await ctx.breakpoint({
    question: 'Messaging developed. Create stakeholder communications strategy?',
    title: 'Phase 4: Stakeholder Strategy',
    context: {
      runId: ctx.runId,
      phase: 'stakeholder-strategy',
      stakeholderCount: stakeholders.length
    }
  });

  const stakeholderStrategy = await ctx.task(developStakeholderStrategyTask, {
    messagingFramework,
    stakeholderAnalysis,
    csrProgram
  });

  // Phase 5: Content Plan Development
  await ctx.breakpoint({
    question: 'Strategy defined. Develop content plan?',
    title: 'Phase 5: Content Plan',
    context: {
      runId: ctx.runId,
      phase: 'content-plan'
    }
  });

  const [contentPlan, storiesAndCaseStudies] = await Promise.all([
    ctx.task(developContentPlanTask, {
      messagingFramework,
      stakeholderStrategy,
      csrProgram
    }),
    ctx.task(developStoriesTask, {
      csrProgram,
      organization
    })
  ]);

  // Phase 6: Reporting and Transparency Plan
  await ctx.breakpoint({
    question: 'Content planned. Develop reporting and transparency plan?',
    title: 'Phase 6: Reporting Plan',
    context: {
      runId: ctx.runId,
      phase: 'reporting-plan',
      reportingRequirements
    }
  });

  const reportingPlan = await ctx.task(developReportingPlanTask, {
    csrProgram,
    reportingRequirements,
    industryBenchmarks
  });

  // Phase 7: Channel Optimization
  await ctx.breakpoint({
    question: 'Reporting planned. Optimize channel distribution?',
    title: 'Phase 7: Channel Optimization',
    context: {
      runId: ctx.runId,
      phase: 'channel-optimization'
    }
  });

  const channelStrategy = await ctx.task(optimizeChannelsTask, {
    contentPlan,
    stakeholderStrategy,
    messagingFramework
  });

  // Phase 8: Quality Validation
  await ctx.breakpoint({
    question: 'Validate CSR communications strategy quality?',
    title: 'Phase 8: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateCsrCommsQualityTask, {
    programAssessment,
    authenticityAssessment,
    messagingFramework,
    stakeholderStrategy,
    contentPlan,
    reportingPlan,
    channelStrategy,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      communicationsStrategy: {
        messaging: messagingFramework,
        stakeholderStrategy,
        channelStrategy,
        authenticityGuidelines: authenticityAssessment.guidelines
      },
      contentPlan: {
        plan: contentPlan,
        stories: storiesAndCaseStudies.stories
      },
      reportingPlan,
      quality,
      targetQuality,
      metadata: {
        processId: 'specializations/domains/business/public-relations/csr-communications',
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
        processId: 'specializations/domains/business/public-relations/csr-communications',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const assessCsrProgramTask = defineTask('assess-csr-program', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess CSR Program',
  agent: {
    name: 'csr-program-assessor',
    prompt: {
      role: 'CSR communications specialist assessing program communications potential',
      task: 'Assess CSR program for communications strategy development',
      context: args,
      instructions: [
        'Review all CSR initiatives and programs',
        'Assess program scope and impact',
        'Identify measurable outcomes and metrics',
        'Evaluate program alignment with business strategy',
        'Assess existing communications effectiveness',
        'Identify strong and weak program elements',
        'Document sustainable development goals alignment',
        'Identify unique differentiators'
      ],
      outputFormat: 'JSON with programs, impactAssessment, metrics, businessAlignment, existingCommsAssessment, strengths, weaknesses, sdgAlignment, differentiators'
    },
    outputSchema: {
      type: 'object',
      required: ['programs', 'impactAssessment', 'metrics'],
      properties: {
        programs: { type: 'array', items: { type: 'object' } },
        impactAssessment: { type: 'object' },
        metrics: { type: 'array', items: { type: 'object' } },
        businessAlignment: { type: 'object' },
        existingCommsAssessment: { type: 'object' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        sdgAlignment: { type: 'array', items: { type: 'object' } },
        differentiators: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'csr-assessment']
}));

export const analyzeStakeholderExpectationsTask = defineTask('analyze-stakeholder-expectations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Stakeholder Expectations',
  agent: {
    name: 'stakeholder-expectations-analyst',
    prompt: {
      role: 'Stakeholder engagement specialist analyzing CSR expectations',
      task: 'Analyze stakeholder expectations for CSR communications',
      context: args,
      instructions: [
        'Map stakeholder CSR information needs',
        'Identify priority issues for each stakeholder group',
        'Assess stakeholder skepticism levels',
        'Understand channel preferences by stakeholder',
        'Identify influential stakeholder voices',
        'Document regulatory and reporting expectations',
        'Assess investor ESG requirements',
        'Map employee engagement expectations'
      ],
      outputFormat: 'JSON with expectations array (stakeholder, needs, priorityIssues, skepticismLevel, channels), regulatoryExpectations, investorEsg, employeeExpectations'
    },
    outputSchema: {
      type: 'object',
      required: ['expectations'],
      properties: {
        expectations: { type: 'array', items: { type: 'object' } },
        regulatoryExpectations: { type: 'array', items: { type: 'object' } },
        investorEsg: { type: 'object' },
        employeeExpectations: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'stakeholder-expectations']
}));

export const assessAuthenticityTask = defineTask('assess-authenticity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Authenticity and Materiality',
  agent: {
    name: 'authenticity-assessor',
    prompt: {
      role: 'CSR authenticity expert assessing greenwashing risk',
      task: 'Assess authenticity and identify greenwashing risks',
      context: args,
      instructions: [
        'Evaluate program-action-communication alignment',
        'Assess evidence and proof point availability',
        'Identify potential greenwashing risks',
        'Review claims against industry standards',
        'Assess materiality of initiatives',
        'Evaluate transparency of reporting',
        'Identify credibility enhancers (third-party validation)',
        'Create authenticity guidelines'
      ],
      outputFormat: 'JSON with alignmentScore, evidenceAssessment, greenwashingRisks, claimsReview, materialityAssessment, transparencyScore, credibilityEnhancers, guidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['alignmentScore', 'greenwashingRisks', 'guidelines'],
      properties: {
        alignmentScore: { type: 'number' },
        evidenceAssessment: { type: 'object' },
        greenwashingRisks: { type: 'array', items: { type: 'object' } },
        claimsReview: { type: 'object' },
        materialityAssessment: { type: 'object' },
        transparencyScore: { type: 'number' },
        credibilityEnhancers: { type: 'array', items: { type: 'object' } },
        guidelines: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'authenticity-assessment']
}));

export const developCsrMessagingTask = defineTask('develop-csr-messaging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop CSR Messaging Framework',
  agent: {
    name: 'csr-messaging-developer',
    prompt: {
      role: 'CSR communications strategist developing messaging',
      task: 'Develop authentic CSR messaging framework',
      context: args,
      instructions: [
        'Create overarching CSR narrative',
        'Develop key messages for each program area',
        'Ensure messages are evidence-based',
        'Create stakeholder-specific message variations',
        'Develop proof points and evidence links',
        'Ensure humble, honest tone',
        'Create progression narrative (journey, not destination)',
        'Include accountability and transparency commitments'
      ],
      outputFormat: 'JSON with narrative, keyMessages, proofPoints, stakeholderVariations, toneGuidelines, progressionNarrative, accountabilityCommitments'
    },
    outputSchema: {
      type: 'object',
      required: ['narrative', 'keyMessages', 'toneGuidelines'],
      properties: {
        narrative: { type: 'string' },
        keyMessages: { type: 'array', items: { type: 'object' } },
        proofPoints: { type: 'array', items: { type: 'object' } },
        stakeholderVariations: { type: 'object' },
        toneGuidelines: { type: 'object' },
        progressionNarrative: { type: 'object' },
        accountabilityCommitments: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'csr-messaging']
}));

export const developStakeholderStrategyTask = defineTask('develop-stakeholder-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Stakeholder Communications Strategy',
  agent: {
    name: 'stakeholder-strategy-developer',
    prompt: {
      role: 'Stakeholder communications specialist for CSR',
      task: 'Develop stakeholder-specific communications strategy',
      context: args,
      instructions: [
        'Define communications approach for each stakeholder',
        'Match content types to stakeholder needs',
        'Define engagement cadence by stakeholder',
        'Create dialogue and feedback mechanisms',
        'Define employee engagement strategy',
        'Create investor ESG communications plan',
        'Define community engagement approach',
        'Plan supplier and partner communications'
      ],
      outputFormat: 'JSON with strategies array (stakeholder, approach, contentTypes, cadence, feedbackMechanism), employeeStrategy, investorStrategy, communityStrategy, partnerStrategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies'],
      properties: {
        strategies: { type: 'array', items: { type: 'object' } },
        employeeStrategy: { type: 'object' },
        investorStrategy: { type: 'object' },
        communityStrategy: { type: 'object' },
        partnerStrategy: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'stakeholder-strategy']
}));

export const developContentPlanTask = defineTask('develop-content-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Content Plan',
  agent: {
    name: 'csr-content-planner',
    prompt: {
      role: 'CSR content strategist developing communications plan',
      task: 'Develop comprehensive CSR content plan',
      context: args,
      instructions: [
        'Plan evergreen CSR content assets',
        'Create campaign content calendar',
        'Plan progress updates and milestone announcements',
        'Develop thought leadership content',
        'Plan social media content strategy',
        'Create employee communications content',
        'Plan website and digital content',
        'Define content production workflow'
      ],
      outputFormat: 'JSON with evergreenAssets, campaignCalendar, progressUpdates, thoughtLeadership, socialMedia, employeeComms, digitalContent, productionWorkflow'
    },
    outputSchema: {
      type: 'object',
      required: ['evergreenAssets', 'campaignCalendar'],
      properties: {
        evergreenAssets: { type: 'array', items: { type: 'object' } },
        campaignCalendar: { type: 'object' },
        progressUpdates: { type: 'array', items: { type: 'object' } },
        thoughtLeadership: { type: 'array', items: { type: 'object' } },
        socialMedia: { type: 'object' },
        employeeComms: { type: 'object' },
        digitalContent: { type: 'object' },
        productionWorkflow: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'content-plan']
}));

export const developStoriesTask = defineTask('develop-stories', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Stories and Case Studies',
  agent: {
    name: 'csr-storyteller',
    prompt: {
      role: 'CSR storyteller developing human interest content',
      task: 'Develop compelling stories and case studies',
      context: args,
      instructions: [
        'Identify compelling human stories within programs',
        'Develop case studies with measurable impact',
        'Create beneficiary testimonials (with consent)',
        'Document employee volunteer stories',
        'Create community impact narratives',
        'Develop partner collaboration stories',
        'Document journey and progress stories',
        'Create multimedia story opportunities'
      ],
      outputFormat: 'JSON with stories array (type, narrative, impact, stakeholder, multimedia), caseStudies, testimonials, journeyStories'
    },
    outputSchema: {
      type: 'object',
      required: ['stories', 'caseStudies'],
      properties: {
        stories: { type: 'array', items: { type: 'object' } },
        caseStudies: { type: 'array', items: { type: 'object' } },
        testimonials: { type: 'array', items: { type: 'object' } },
        journeyStories: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'csr-stories']
}));

export const developReportingPlanTask = defineTask('develop-reporting-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Reporting Plan',
  agent: {
    name: 'csr-reporting-planner',
    prompt: {
      role: 'CSR reporting specialist developing transparency plan',
      task: 'Develop CSR reporting and transparency plan',
      context: args,
      instructions: [
        'Plan annual CSR/sustainability report',
        'Define reporting framework alignment (GRI, SASB, TCFD)',
        'Create metrics and KPI reporting plan',
        'Plan progress tracking communications',
        'Define third-party assurance approach',
        'Create ESG disclosure plan',
        'Plan regulatory compliance reporting',
        'Define digital/interactive reporting approach'
      ],
      outputFormat: 'JSON with annualReport, frameworkAlignment, metricsReporting, progressTracking, assuranceApproach, esgDisclosure, regulatoryCompliance, digitalReporting'
    },
    outputSchema: {
      type: 'object',
      required: ['annualReport', 'frameworkAlignment', 'metricsReporting'],
      properties: {
        annualReport: { type: 'object' },
        frameworkAlignment: { type: 'array', items: { type: 'string' } },
        metricsReporting: { type: 'object' },
        progressTracking: { type: 'object' },
        assuranceApproach: { type: 'object' },
        esgDisclosure: { type: 'object' },
        regulatoryCompliance: { type: 'array', items: { type: 'object' } },
        digitalReporting: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'csr-reporting']
}));

export const optimizeChannelsTask = defineTask('optimize-channels', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize Channel Distribution',
  agent: {
    name: 'channel-optimizer',
    prompt: {
      role: 'Multi-channel communications specialist optimizing CSR distribution',
      task: 'Optimize channel strategy for CSR communications',
      context: args,
      instructions: [
        'Define owned channel strategy (website, blog)',
        'Plan social media approach by platform',
        'Develop media relations approach',
        'Plan employee communication channels',
        'Define investor relations integration',
        'Plan community outreach channels',
        'Create partner communication approach',
        'Define measurement by channel'
      ],
      outputFormat: 'JSON with ownedChannels, socialMedia, mediaRelations, employeeChannels, investorRelations, communityChannels, partnerChannels, channelMetrics'
    },
    outputSchema: {
      type: 'object',
      required: ['ownedChannels', 'socialMedia'],
      properties: {
        ownedChannels: { type: 'object' },
        socialMedia: { type: 'object' },
        mediaRelations: { type: 'object' },
        employeeChannels: { type: 'object' },
        investorRelations: { type: 'object' },
        communityChannels: { type: 'object' },
        partnerChannels: { type: 'object' },
        channelMetrics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'channel-optimization']
}));

export const validateCsrCommsQualityTask = defineTask('validate-csr-comms-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate CSR Communications Quality',
  agent: {
    name: 'csr-comms-quality-validator',
    prompt: {
      role: 'CSR communications quality assessor',
      task: 'Validate CSR communications strategy quality',
      context: args,
      instructions: [
        'Assess authenticity and greenwashing risk',
        'Evaluate messaging clarity and impact',
        'Review stakeholder coverage completeness',
        'Assess content plan feasibility',
        'Evaluate reporting plan robustness',
        'Review channel strategy effectiveness',
        'Assess evidence and proof point strength',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, authenticityScore, messagingScore, stakeholderScore, contentScore, reportingScore, channelScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        authenticityScore: { type: 'number' },
        messagingScore: { type: 'number' },
        stakeholderScore: { type: 'number' },
        contentScore: { type: 'number' },
        reportingScore: { type: 'number' },
        channelScore: { type: 'number' },
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
