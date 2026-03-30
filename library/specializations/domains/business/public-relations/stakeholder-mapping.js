/**
 * @process specializations/domains/business/public-relations/stakeholder-mapping
 * @description Identify and categorize stakeholders using the Stakeholder Salience Model (power, legitimacy, urgency) and develop engagement strategies for each priority group
 * @specialization Public Relations and Communications
 * @category Stakeholder Communications
 * @inputs { organization: object, existingStakeholders: object[], businessContext: object }
 * @outputs { success: boolean, stakeholderMap: object, salienceAnalysis: object, engagementStrategies: object[], quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization,
    existingStakeholders = [],
    businessContext = {},
    targetQuality = 85
  } = inputs;

  // Phase 1: Stakeholder Identification
  await ctx.breakpoint({
    question: 'Starting stakeholder mapping. Identify all stakeholder groups?',
    title: 'Phase 1: Stakeholder Identification',
    context: {
      runId: ctx.runId,
      phase: 'stakeholder-identification',
      organization: organization.name
    }
  });

  const stakeholderIdentification = await ctx.task(identifyStakeholdersTask, {
    organization,
    existingStakeholders,
    businessContext
  });

  // Phase 2: Salience Analysis (Power, Legitimacy, Urgency)
  await ctx.breakpoint({
    question: 'Stakeholders identified. Conduct salience analysis?',
    title: 'Phase 2: Salience Analysis',
    context: {
      runId: ctx.runId,
      phase: 'salience-analysis',
      stakeholderCount: stakeholderIdentification.stakeholders.length
    }
  });

  const salienceAnalysis = await ctx.task(conductSalienceAnalysisTask, {
    stakeholders: stakeholderIdentification.stakeholders,
    organization,
    businessContext
  });

  // Phase 3: Stakeholder Categorization
  await ctx.breakpoint({
    question: 'Salience analyzed. Categorize stakeholders by type?',
    title: 'Phase 3: Stakeholder Categorization',
    context: {
      runId: ctx.runId,
      phase: 'categorization'
    }
  });

  const categorization = await ctx.task(categorizeStakeholdersTask, {
    salienceAnalysis,
    stakeholderIdentification
  });

  // Phase 4: Relationship Assessment
  await ctx.breakpoint({
    question: 'Stakeholders categorized. Assess current relationships?',
    title: 'Phase 4: Relationship Assessment',
    context: {
      runId: ctx.runId,
      phase: 'relationship-assessment'
    }
  });

  const relationshipAssessment = await ctx.task(assessRelationshipsTask, {
    categorization,
    existingStakeholders,
    organization
  });

  // Phase 5: Interest and Influence Mapping
  await ctx.breakpoint({
    question: 'Relationships assessed. Map interests and influence?',
    title: 'Phase 5: Interest/Influence Mapping',
    context: {
      runId: ctx.runId,
      phase: 'interest-influence-mapping'
    }
  });

  const interestInfluenceMap = await ctx.task(mapInterestInfluenceTask, {
    categorization,
    salienceAnalysis,
    businessContext
  });

  // Phase 6: Engagement Strategy Development
  await ctx.breakpoint({
    question: 'Mapping complete. Develop engagement strategies?',
    title: 'Phase 6: Engagement Strategies',
    context: {
      runId: ctx.runId,
      phase: 'engagement-strategies'
    }
  });

  const engagementStrategies = await ctx.task(developEngagementStrategiesTask, {
    categorization,
    salienceAnalysis,
    relationshipAssessment,
    interestInfluenceMap
  });

  // Phase 7: Communication Plan per Stakeholder
  await ctx.breakpoint({
    question: 'Strategies developed. Create communication plans?',
    title: 'Phase 7: Communication Plans',
    context: {
      runId: ctx.runId,
      phase: 'communication-plans'
    }
  });

  const communicationPlans = await ctx.task(createCommunicationPlansTask, {
    engagementStrategies,
    categorization,
    organization
  });

  // Phase 8: Quality Validation
  await ctx.breakpoint({
    question: 'Validate stakeholder mapping quality?',
    title: 'Phase 8: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateStakeholderMappingTask, {
    stakeholderIdentification,
    salienceAnalysis,
    categorization,
    relationshipAssessment,
    interestInfluenceMap,
    engagementStrategies,
    communicationPlans,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      stakeholderMap: {
        stakeholders: stakeholderIdentification.stakeholders,
        categorization: categorization.categories,
        interestInfluenceMap
      },
      salienceAnalysis: {
        definitiveSakeholders: salienceAnalysis.definitive,
        dominantStakeholders: salienceAnalysis.dominant,
        dependentStakeholders: salienceAnalysis.dependent,
        dangerousStakeholders: salienceAnalysis.dangerous,
        dormantStakeholders: salienceAnalysis.dormant,
        discretionaryStakeholders: salienceAnalysis.discretionary,
        demandingStakeholders: salienceAnalysis.demanding
      },
      engagementStrategies: engagementStrategies.strategies,
      communicationPlans: communicationPlans.plans,
      relationshipAssessment: relationshipAssessment.summary,
      quality,
      targetQuality,
      metadata: {
        processId: 'specializations/domains/business/public-relations/stakeholder-mapping',
        timestamp: ctx.now(),
        organization: organization.name,
        totalStakeholders: stakeholderIdentification.stakeholders.length
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
        processId: 'specializations/domains/business/public-relations/stakeholder-mapping',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const identifyStakeholdersTask = defineTask('identify-stakeholders', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Stakeholders',
  agent: {
    name: 'stakeholder-identifier',
    prompt: {
      role: 'Stakeholder mapping specialist identifying organizational stakeholders',
      task: 'Comprehensively identify all stakeholder groups',
      context: args,
      instructions: [
        'Identify internal stakeholders (employees, management, board)',
        'Identify customer and client stakeholder groups',
        'Map investor and shareholder stakeholders',
        'Identify supplier and partner stakeholders',
        'Map regulatory and government stakeholders',
        'Identify media and influencer stakeholders',
        'Map community and local stakeholders',
        'Identify industry and association stakeholders',
        'Consider NGO and advocacy group stakeholders'
      ],
      outputFormat: 'JSON with stakeholders array (name, type, description, primaryInterests), internalStakeholders, externalStakeholders, groupings'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholders'],
      properties: {
        stakeholders: { type: 'array', items: { type: 'object' } },
        internalStakeholders: { type: 'array', items: { type: 'object' } },
        externalStakeholders: { type: 'array', items: { type: 'object' } },
        groupings: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'stakeholder-identification']
}));

export const conductSalienceAnalysisTask = defineTask('conduct-salience-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct Salience Analysis',
  agent: {
    name: 'salience-analyst',
    prompt: {
      role: 'Stakeholder analyst applying Mitchell-Agle-Wood Salience Model',
      task: 'Analyze stakeholder salience using power, legitimacy, urgency',
      context: args,
      instructions: [
        'Assess POWER for each stakeholder (ability to influence)',
        'Assess LEGITIMACY for each stakeholder (appropriateness of involvement)',
        'Assess URGENCY for each stakeholder (time sensitivity of claims)',
        'Classify Definitive stakeholders (all three attributes)',
        'Classify Expectant stakeholders (two attributes)',
        'Classify Latent stakeholders (one attribute)',
        'Identify Non-stakeholders (no attributes)',
        'Score each attribute on 1-5 scale'
      ],
      outputFormat: 'JSON with analysis array (stakeholder, power, legitimacy, urgency, classification), definitive, dominant, dependent, dangerous, dormant, discretionary, demanding'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'definitive'],
      properties: {
        analysis: { type: 'array', items: { type: 'object' } },
        definitive: { type: 'array', items: { type: 'object' } },
        dominant: { type: 'array', items: { type: 'object' } },
        dependent: { type: 'array', items: { type: 'object' } },
        dangerous: { type: 'array', items: { type: 'object' } },
        dormant: { type: 'array', items: { type: 'object' } },
        discretionary: { type: 'array', items: { type: 'object' } },
        demanding: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'salience-analysis']
}));

export const categorizeStakeholdersTask = defineTask('categorize-stakeholders', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Categorize Stakeholders',
  agent: {
    name: 'stakeholder-categorizer',
    prompt: {
      role: 'Stakeholder strategist categorizing for engagement',
      task: 'Categorize stakeholders by engagement priority and type',
      context: args,
      instructions: [
        'Create priority tiers (critical, important, monitor)',
        'Categorize by relationship type (supportive, neutral, opposing)',
        'Group by communication needs',
        'Identify key influencers within groups',
        'Map stakeholder networks and alliances',
        'Identify potential coalition partners',
        'Flag stakeholders requiring special attention',
        'Create stakeholder segments for communications'
      ],
      outputFormat: 'JSON with categories object (byPriority, byRelationship, byCommNeeds), influencers, networks, coalitionPartners, specialAttention, segments'
    },
    outputSchema: {
      type: 'object',
      required: ['categories'],
      properties: {
        categories: { type: 'object' },
        influencers: { type: 'array', items: { type: 'object' } },
        networks: { type: 'array', items: { type: 'object' } },
        coalitionPartners: { type: 'array', items: { type: 'object' } },
        specialAttention: { type: 'array', items: { type: 'object' } },
        segments: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'stakeholder-categorization']
}));

export const assessRelationshipsTask = defineTask('assess-relationships', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Current Relationships',
  agent: {
    name: 'relationship-assessor',
    prompt: {
      role: 'Relationship management specialist assessing stakeholder connections',
      task: 'Assess current relationship status with stakeholders',
      context: args,
      instructions: [
        'Assess relationship strength (strong, moderate, weak)',
        'Evaluate relationship quality and sentiment',
        'Identify relationship history and context',
        'Assess communication frequency and quality',
        'Identify relationship gaps and opportunities',
        'Evaluate trust levels',
        'Identify relationship risks',
        'Recommend relationship improvement priorities'
      ],
      outputFormat: 'JSON with assessments array (stakeholder, strength, quality, history, trustLevel, gaps, risks), summary, improvementPriorities'
    },
    outputSchema: {
      type: 'object',
      required: ['assessments', 'summary'],
      properties: {
        assessments: { type: 'array', items: { type: 'object' } },
        summary: { type: 'object' },
        improvementPriorities: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'relationship-assessment']
}));

export const mapInterestInfluenceTask = defineTask('map-interest-influence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map Interest and Influence',
  agent: {
    name: 'interest-influence-mapper',
    prompt: {
      role: 'Strategic stakeholder analyst creating interest/influence maps',
      task: 'Create interest-influence matrix for stakeholders',
      context: args,
      instructions: [
        'Assess level of interest in organization for each stakeholder',
        'Assess level of influence each stakeholder has',
        'Plot stakeholders on interest-influence matrix',
        'Identify Key Players (high interest, high influence)',
        'Identify Keep Satisfied (low interest, high influence)',
        'Identify Keep Informed (high interest, low influence)',
        'Identify Monitor (low interest, low influence)',
        'Define engagement implications for each quadrant'
      ],
      outputFormat: 'JSON with matrix array (stakeholder, interest, influence, quadrant), keyPlayers, keepSatisfied, keepInformed, monitor, engagementImplications'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'keyPlayers'],
      properties: {
        matrix: { type: 'array', items: { type: 'object' } },
        keyPlayers: { type: 'array', items: { type: 'object' } },
        keepSatisfied: { type: 'array', items: { type: 'object' } },
        keepInformed: { type: 'array', items: { type: 'object' } },
        monitor: { type: 'array', items: { type: 'object' } },
        engagementImplications: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'interest-influence']
}));

export const developEngagementStrategiesTask = defineTask('develop-engagement-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Engagement Strategies',
  agent: {
    name: 'engagement-strategist',
    prompt: {
      role: 'Stakeholder engagement specialist developing strategies',
      task: 'Develop engagement strategies for stakeholder groups',
      context: args,
      instructions: [
        'Define engagement approach per salience category',
        'Create strategies for Key Players (collaborate)',
        'Create strategies for Keep Satisfied (consult)',
        'Create strategies for Keep Informed (inform)',
        'Create strategies for Monitor (observe)',
        'Define engagement frequency and intensity',
        'Identify value exchange for each relationship',
        'Define engagement success metrics'
      ],
      outputFormat: 'JSON with strategies array (stakeholderGroup, approach, frequency, valueExchange, activities, metrics), overallFramework'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'overallFramework'],
      properties: {
        strategies: { type: 'array', items: { type: 'object' } },
        overallFramework: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'engagement-strategies']
}));

export const createCommunicationPlansTask = defineTask('create-communication-plans', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Communication Plans',
  agent: {
    name: 'communication-planner',
    prompt: {
      role: 'Communications planning specialist creating stakeholder comms plans',
      task: 'Create communication plans for priority stakeholder groups',
      context: args,
      instructions: [
        'Define communication objectives per stakeholder',
        'Select appropriate channels per stakeholder',
        'Define message themes and content types',
        'Set communication frequency',
        'Define feedback and dialogue mechanisms',
        'Assign communication ownership',
        'Create communication calendar',
        'Define communication measurement'
      ],
      outputFormat: 'JSON with plans array (stakeholder, objectives, channels, messages, frequency, feedback, owner, calendar, measurement)'
    },
    outputSchema: {
      type: 'object',
      required: ['plans'],
      properties: {
        plans: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'communication-plans']
}));

export const validateStakeholderMappingTask = defineTask('validate-stakeholder-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Stakeholder Mapping Quality',
  agent: {
    name: 'mapping-quality-validator',
    prompt: {
      role: 'Stakeholder analysis quality assessor',
      task: 'Validate stakeholder mapping quality and completeness',
      context: args,
      instructions: [
        'Assess stakeholder identification completeness',
        'Evaluate salience analysis rigor',
        'Review categorization logic',
        'Assess relationship assessment depth',
        'Evaluate interest-influence mapping accuracy',
        'Review engagement strategy appropriateness',
        'Assess communication plan feasibility',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, identificationScore, salienceScore, categorizationScore, relationshipScore, mappingScore, strategyScore, commsScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        identificationScore: { type: 'number' },
        salienceScore: { type: 'number' },
        categorizationScore: { type: 'number' },
        relationshipScore: { type: 'number' },
        mappingScore: { type: 'number' },
        strategyScore: { type: 'number' },
        commsScore: { type: 'number' },
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
