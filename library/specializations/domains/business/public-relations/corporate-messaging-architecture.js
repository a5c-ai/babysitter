/**
 * @process specializations/domains/business/public-relations/corporate-messaging-architecture
 * @description Develop structured messaging framework including core narrative, key messages, proof points, audience adaptations, and channel optimization guidelines
 * @specialization Public Relations and Communications
 * @category Corporate Communications
 * @inputs { organization: object, brandStrategy: object, targetAudiences: object[], competitorPositioning: object }
 * @outputs { success: boolean, messagingArchitecture: object, audienceAdaptations: object[], channelGuidelines: object, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization,
    brandStrategy = {},
    targetAudiences = [],
    competitorPositioning = {},
    existingMessaging = {},
    targetQuality = 90
  } = inputs;

  // Phase 1: Organizational Context Analysis
  await ctx.breakpoint({
    question: 'Starting messaging architecture development. Analyze organizational context?',
    title: 'Phase 1: Context Analysis',
    context: {
      runId: ctx.runId,
      phase: 'context-analysis',
      organization: organization.name
    }
  });

  const [contextAnalysis, competitorAnalysis] = await Promise.all([
    ctx.task(analyzeOrganizationalContextTask, {
      organization,
      brandStrategy,
      existingMessaging
    }),
    ctx.task(analyzeCompetitorMessagingTask, {
      competitorPositioning,
      organization
    })
  ]);

  // Phase 2: Core Narrative Development
  await ctx.breakpoint({
    question: 'Context analyzed. Develop core narrative and positioning?',
    title: 'Phase 2: Core Narrative',
    context: {
      runId: ctx.runId,
      phase: 'core-narrative'
    }
  });

  const coreNarrative = await ctx.task(developCoreNarrativeTask, {
    contextAnalysis,
    competitorAnalysis,
    brandStrategy,
    organization
  });

  // Phase 3: Key Messages Development
  await ctx.breakpoint({
    question: 'Core narrative defined. Develop key messages and proof points?',
    title: 'Phase 3: Key Messages',
    context: {
      runId: ctx.runId,
      phase: 'key-messages'
    }
  });

  const [keyMessages, proofPoints] = await Promise.all([
    ctx.task(developKeyMessagesTask, {
      coreNarrative,
      organization,
      brandStrategy
    }),
    ctx.task(developProofPointsTask, {
      coreNarrative,
      organization
    })
  ]);

  // Phase 4: Audience Adaptation
  await ctx.breakpoint({
    question: 'Key messages developed. Create audience-specific adaptations?',
    title: 'Phase 4: Audience Adaptation',
    context: {
      runId: ctx.runId,
      phase: 'audience-adaptation',
      audienceCount: targetAudiences.length
    }
  });

  const audienceAdaptations = await ctx.task(createAudienceAdaptationsTask, {
    coreNarrative,
    keyMessages,
    proofPoints,
    targetAudiences
  });

  // Phase 5: Channel Optimization Guidelines
  await ctx.breakpoint({
    question: 'Audience adaptations created. Develop channel optimization guidelines?',
    title: 'Phase 5: Channel Guidelines',
    context: {
      runId: ctx.runId,
      phase: 'channel-guidelines'
    }
  });

  const channelGuidelines = await ctx.task(developChannelGuidelinesTask, {
    coreNarrative,
    keyMessages,
    audienceAdaptations
  });

  // Phase 6: Message Hierarchy and Structure
  await ctx.breakpoint({
    question: 'Channel guidelines developed. Create message hierarchy and structure?',
    title: 'Phase 6: Message Hierarchy',
    context: {
      runId: ctx.runId,
      phase: 'message-hierarchy'
    }
  });

  const messageHierarchy = await ctx.task(createMessageHierarchyTask, {
    coreNarrative,
    keyMessages,
    proofPoints,
    audienceAdaptations
  });

  // Phase 7: Usage Guidelines and Governance
  await ctx.breakpoint({
    question: 'Hierarchy created. Develop usage guidelines and governance?',
    title: 'Phase 7: Usage Guidelines',
    context: {
      runId: ctx.runId,
      phase: 'usage-guidelines'
    }
  });

  const usageGuidelines = await ctx.task(developUsageGuidelinesTask, {
    messageHierarchy,
    channelGuidelines,
    organization
  });

  // Phase 8: Quality Validation
  await ctx.breakpoint({
    question: 'Validate messaging architecture quality?',
    title: 'Phase 8: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateMessagingQualityTask, {
    coreNarrative,
    keyMessages,
    proofPoints,
    audienceAdaptations,
    channelGuidelines,
    messageHierarchy,
    usageGuidelines,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      messagingArchitecture: {
        coreNarrative,
        keyMessages: keyMessages.messages,
        proofPoints: proofPoints.points,
        messageHierarchy,
        usageGuidelines
      },
      audienceAdaptations: audienceAdaptations.adaptations,
      channelGuidelines,
      quality,
      targetQuality,
      differentiators: competitorAnalysis.differentiators,
      metadata: {
        processId: 'specializations/domains/business/public-relations/corporate-messaging-architecture',
        timestamp: ctx.now(),
        organization: organization.name,
        audienceCount: targetAudiences.length
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
        processId: 'specializations/domains/business/public-relations/corporate-messaging-architecture',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const analyzeOrganizationalContextTask = defineTask('analyze-org-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Organizational Context',
  agent: {
    name: 'org-context-analyst',
    prompt: {
      role: 'Strategic communications consultant analyzing organizational positioning',
      task: 'Analyze organizational context for messaging development',
      context: args,
      instructions: [
        'Review organizational mission, vision, and values',
        'Analyze brand strategy and positioning',
        'Assess existing messaging and its effectiveness',
        'Identify organizational strengths and differentiators',
        'Understand market position and competitive landscape',
        'Identify key stakeholder expectations',
        'Document organizational voice and tone preferences',
        'Identify messaging constraints and sensitivities'
      ],
      outputFormat: 'JSON with missionVisionValues, brandAnalysis, existingMessagingAssessment, strengths, differentiators, stakeholderExpectations, voiceTone, constraints'
    },
    outputSchema: {
      type: 'object',
      required: ['missionVisionValues', 'strengths', 'differentiators'],
      properties: {
        missionVisionValues: { type: 'object' },
        brandAnalysis: { type: 'object' },
        existingMessagingAssessment: { type: 'object' },
        strengths: { type: 'array', items: { type: 'string' } },
        differentiators: { type: 'array', items: { type: 'string' } },
        stakeholderExpectations: { type: 'array', items: { type: 'object' } },
        voiceTone: { type: 'object' },
        constraints: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'context-analysis']
}));

export const analyzeCompetitorMessagingTask = defineTask('analyze-competitor-messaging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Competitor Messaging',
  agent: {
    name: 'competitor-messaging-analyst',
    prompt: {
      role: 'Competitive intelligence specialist analyzing competitor positioning',
      task: 'Analyze competitor messaging and identify differentiation opportunities',
      context: args,
      instructions: [
        'Map competitor positioning statements',
        'Analyze competitor key messages',
        'Identify common industry messaging themes',
        'Find whitespace in competitor messaging',
        'Identify overused claims and cliches',
        'Assess competitor proof point strategies',
        'Identify differentiation opportunities',
        'Map competitor tone and voice'
      ],
      outputFormat: 'JSON with competitorPositions, commonThemes, whitespace, overusedClaims, differentiators, competitorTones'
    },
    outputSchema: {
      type: 'object',
      required: ['competitorPositions', 'differentiators'],
      properties: {
        competitorPositions: { type: 'array', items: { type: 'object' } },
        commonThemes: { type: 'array', items: { type: 'string' } },
        whitespace: { type: 'array', items: { type: 'string' } },
        overusedClaims: { type: 'array', items: { type: 'string' } },
        differentiators: { type: 'array', items: { type: 'string' } },
        competitorTones: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'competitor-analysis']
}));

export const developCoreNarrativeTask = defineTask('develop-core-narrative', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Core Narrative',
  agent: {
    name: 'core-narrative-developer',
    prompt: {
      role: 'Brand storyteller crafting organizational narratives',
      task: 'Develop compelling core narrative and positioning statement',
      context: args,
      instructions: [
        'Craft overarching organizational narrative (the story)',
        'Develop positioning statement (who we are, what we do, why it matters)',
        'Create elevator pitch versions (30 sec, 60 sec, 2 min)',
        'Define value proposition statement',
        'Articulate unique selling proposition',
        'Create narrative arc that connects past, present, future',
        'Ensure authenticity and believability',
        'Test differentiation from competitors'
      ],
      outputFormat: 'JSON with narrative, positioningStatement, elevatorPitches (30sec, 60sec, 2min), valueProposition, usp, narrativeArc'
    },
    outputSchema: {
      type: 'object',
      required: ['narrative', 'positioningStatement', 'valueProposition'],
      properties: {
        narrative: { type: 'string' },
        positioningStatement: { type: 'string' },
        elevatorPitches: { type: 'object' },
        valueProposition: { type: 'string' },
        usp: { type: 'string' },
        narrativeArc: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'core-narrative']
}));

export const developKeyMessagesTask = defineTask('develop-key-messages', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Key Messages',
  agent: {
    name: 'key-message-developer',
    prompt: {
      role: 'Strategic messaging specialist crafting key messages',
      task: 'Develop strategic key messages aligned with core narrative',
      context: args,
      instructions: [
        'Develop 3-5 primary key messages',
        'Ensure messages support core narrative',
        'Create memorable, quotable message statements',
        'Ensure messages are differentiating',
        'Test messages for clarity and impact',
        'Create supporting sub-messages for each',
        'Ensure consistency across message set',
        'Validate messages against brand voice'
      ],
      outputFormat: 'JSON with messages array (message, subMessages, category, priority), messageMap, consistencyNotes'
    },
    outputSchema: {
      type: 'object',
      required: ['messages'],
      properties: {
        messages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              subMessages: { type: 'array', items: { type: 'string' } },
              category: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        messageMap: { type: 'object' },
        consistencyNotes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'key-messages']
}));

export const developProofPointsTask = defineTask('develop-proof-points', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Proof Points',
  agent: {
    name: 'proof-point-developer',
    prompt: {
      role: 'Evidence-based communications specialist developing proof points',
      task: 'Develop proof points to support key messages',
      context: args,
      instructions: [
        'Identify data and statistics supporting each message',
        'Gather customer testimonials and case studies',
        'Document awards, recognition, and certifications',
        'Compile third-party validation (analysts, media)',
        'Identify expert quotes and endorsements',
        'Create quantifiable metrics and results',
        'Develop before/after comparisons',
        'Map proof points to specific messages'
      ],
      outputFormat: 'JSON with points array (type, content, supportedMessage, source, strength), proofPointMap, gaps'
    },
    outputSchema: {
      type: 'object',
      required: ['points', 'proofPointMap'],
      properties: {
        points: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              content: { type: 'string' },
              supportedMessage: { type: 'string' },
              source: { type: 'string' },
              strength: { type: 'string' }
            }
          }
        },
        proofPointMap: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'proof-points']
}));

export const createAudienceAdaptationsTask = defineTask('create-audience-adaptations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Audience Adaptations',
  agent: {
    name: 'audience-adapter',
    prompt: {
      role: 'Audience communications specialist tailoring messages',
      task: 'Create audience-specific message adaptations',
      context: args,
      instructions: [
        'Adapt core narrative for each target audience',
        'Tailor key messages to audience needs and concerns',
        'Select relevant proof points for each audience',
        'Adjust tone and language for audience preferences',
        'Identify audience-specific benefits and value',
        'Create audience personas with messaging implications',
        'Define what each audience cares about most',
        'Map messages to audience journey stages'
      ],
      outputFormat: 'JSON with adaptations array (audience, adaptedNarrative, adaptedMessages, relevantProofPoints, tone, keyBenefits, journeyMapping)'
    },
    outputSchema: {
      type: 'object',
      required: ['adaptations'],
      properties: {
        adaptations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              audience: { type: 'string' },
              adaptedNarrative: { type: 'string' },
              adaptedMessages: { type: 'array', items: { type: 'object' } },
              relevantProofPoints: { type: 'array', items: { type: 'string' } },
              tone: { type: 'string' },
              keyBenefits: { type: 'array', items: { type: 'string' } },
              journeyMapping: { type: 'object' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'audience-adaptation']
}));

export const developChannelGuidelinesTask = defineTask('develop-channel-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Channel Guidelines',
  agent: {
    name: 'channel-guideline-developer',
    prompt: {
      role: 'Multi-channel communications specialist optimizing for platforms',
      task: 'Develop channel-specific messaging guidelines',
      context: args,
      instructions: [
        'Define guidelines for corporate website',
        'Create social media messaging guidelines per platform',
        'Develop media/PR messaging guidelines',
        'Create sales and marketing collateral guidelines',
        'Define internal communications guidelines',
        'Create investor communications guidelines',
        'Develop event and speaking guidelines',
        'Include character limits and format requirements'
      ],
      outputFormat: 'JSON with channels object (website, social, media, sales, internal, investor, events), formatRequirements, dosAndDonts'
    },
    outputSchema: {
      type: 'object',
      required: ['channels'],
      properties: {
        channels: {
          type: 'object',
          properties: {
            website: { type: 'object' },
            social: { type: 'object' },
            media: { type: 'object' },
            sales: { type: 'object' },
            internal: { type: 'object' },
            investor: { type: 'object' },
            events: { type: 'object' }
          }
        },
        formatRequirements: { type: 'object' },
        dosAndDonts: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'channel-guidelines']
}));

export const createMessageHierarchyTask = defineTask('create-message-hierarchy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Message Hierarchy',
  agent: {
    name: 'message-hierarchy-creator',
    prompt: {
      role: 'Information architecture specialist organizing messaging',
      task: 'Create structured message hierarchy and framework',
      context: args,
      instructions: [
        'Create tiered message hierarchy (core, primary, supporting)',
        'Map message relationships and dependencies',
        'Define message priority and usage rules',
        'Create message selection decision tree',
        'Develop message combination guidelines',
        'Map messages to use cases and scenarios',
        'Create quick reference message card',
        'Define message refresh and update protocols'
      ],
      outputFormat: 'JSON with hierarchy (core, primary, supporting), relationships, priorityRules, decisionTree, combinationGuidelines, useCaseMapping, quickReference, refreshProtocols'
    },
    outputSchema: {
      type: 'object',
      required: ['hierarchy', 'priorityRules'],
      properties: {
        hierarchy: { type: 'object' },
        relationships: { type: 'array', items: { type: 'object' } },
        priorityRules: { type: 'array', items: { type: 'object' } },
        decisionTree: { type: 'object' },
        combinationGuidelines: { type: 'array', items: { type: 'string' } },
        useCaseMapping: { type: 'object' },
        quickReference: { type: 'object' },
        refreshProtocols: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'message-hierarchy']
}));

export const developUsageGuidelinesTask = defineTask('develop-usage-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Usage Guidelines',
  agent: {
    name: 'usage-guideline-developer',
    prompt: {
      role: 'Brand governance specialist creating usage guidelines',
      task: 'Develop messaging usage guidelines and governance',
      context: args,
      instructions: [
        'Define who can use which messages',
        'Create approval workflows for messaging',
        'Define customization boundaries',
        'Create training requirements',
        'Develop compliance checklist',
        'Define messaging update process',
        'Create feedback and improvement mechanism',
        'Define metrics for messaging effectiveness'
      ],
      outputFormat: 'JSON with usageRights, approvalWorkflow, customizationBoundaries, trainingRequirements, complianceChecklist, updateProcess, feedbackMechanism, effectivenessMetrics'
    },
    outputSchema: {
      type: 'object',
      required: ['usageRights', 'approvalWorkflow'],
      properties: {
        usageRights: { type: 'object' },
        approvalWorkflow: { type: 'object' },
        customizationBoundaries: { type: 'object' },
        trainingRequirements: { type: 'array', items: { type: 'string' } },
        complianceChecklist: { type: 'array', items: { type: 'string' } },
        updateProcess: { type: 'object' },
        feedbackMechanism: { type: 'object' },
        effectivenessMetrics: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'usage-guidelines']
}));

export const validateMessagingQualityTask = defineTask('validate-messaging-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Messaging Architecture Quality',
  agent: {
    name: 'messaging-quality-validator',
    prompt: {
      role: 'Communications quality assessor validating messaging frameworks',
      task: 'Validate messaging architecture quality and completeness',
      context: args,
      instructions: [
        'Assess core narrative clarity and impact',
        'Evaluate key message differentiation',
        'Validate proof point credibility and coverage',
        'Assess audience adaptation appropriateness',
        'Evaluate channel guideline completeness',
        'Check hierarchy logic and usability',
        'Assess governance practicality',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, narrativeScore, messageScore, proofPointScore, adaptationScore, channelScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        narrativeScore: { type: 'number' },
        messageScore: { type: 'number' },
        proofPointScore: { type: 'number' },
        adaptationScore: { type: 'number' },
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
