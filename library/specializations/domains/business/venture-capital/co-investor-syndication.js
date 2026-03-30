/**
 * @process venture-capital/co-investor-syndication
 * @description Building and maintaining relationships with co-investment partners, coordinating syndicated investments, and managing lead/follow dynamics in deals
 * @inputs { fundName: string, dealInfo: object, syndicationStrategy: string, targetCoInvestors: array }
 * @outputs { success: boolean, syndicationPlan: object, coInvestorOutreach: array, termAlignment: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    fundName,
    dealInfo = {},
    syndicationStrategy = 'lead',
    targetCoInvestors = [],
    outputDir = 'syndication-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Co-Investor Universe Analysis
  ctx.log('info', 'Analyzing potential co-investor universe');
  const coInvestorAnalysis = await ctx.task(coInvestorUniverseTask, {
    fundName,
    dealInfo,
    targetCoInvestors,
    outputDir
  });

  if (!coInvestorAnalysis.success) {
    return {
      success: false,
      error: 'Co-investor analysis failed',
      details: coInvestorAnalysis,
      metadata: { processId: 'venture-capital/co-investor-syndication', timestamp: startTime }
    };
  }

  artifacts.push(...coInvestorAnalysis.artifacts);

  // Task 2: Syndication Structure Design
  ctx.log('info', 'Designing syndication structure');
  const syndicationStructure = await ctx.task(syndicationStructureTask, {
    dealInfo,
    syndicationStrategy,
    coInvestorUniverse: coInvestorAnalysis.coInvestors,
    outputDir
  });

  artifacts.push(...syndicationStructure.artifacts);

  // Task 3: Lead/Follow Dynamics Assessment
  ctx.log('info', 'Assessing lead/follow dynamics');
  const dynamicsAssessment = await ctx.task(leadFollowDynamicsTask, {
    fundName,
    dealInfo,
    syndicationStrategy,
    coInvestorProfiles: coInvestorAnalysis.profiles,
    outputDir
  });

  artifacts.push(...dynamicsAssessment.artifacts);

  // Task 4: Term Sheet Alignment
  ctx.log('info', 'Aligning term sheet preferences');
  const termAlignment = await ctx.task(termAlignmentTask, {
    dealInfo,
    syndicationStructure: syndicationStructure.structure,
    coInvestorPreferences: coInvestorAnalysis.preferences,
    outputDir
  });

  artifacts.push(...termAlignment.artifacts);

  // Task 5: Outreach Campaign Development
  ctx.log('info', 'Developing co-investor outreach campaign');
  const outreachCampaign = await ctx.task(coInvestorOutreachTask, {
    dealInfo,
    prioritizedCoInvestors: coInvestorAnalysis.prioritized,
    syndicationStructure: syndicationStructure.structure,
    outputDir
  });

  artifacts.push(...outreachCampaign.artifacts);

  // Breakpoint: Review syndication plan
  await ctx.breakpoint({
    question: `Syndication plan complete. ${coInvestorAnalysis.prioritized.length} co-investors identified. Review outreach strategy?`,
    title: 'Co-Investor Syndication Plan',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        targetRaise: syndicationStructure.structure.targetRaise,
        leadAllocation: syndicationStructure.structure.leadAllocation,
        followAllocation: syndicationStructure.structure.followAllocation,
        priorityCoInvestors: coInvestorAnalysis.prioritized.length
      }
    }
  });

  // Task 6: Relationship Tracking Setup
  ctx.log('info', 'Setting up relationship tracking');
  const relationshipTracking = await ctx.task(relationshipTrackingTask, {
    fundName,
    coInvestors: coInvestorAnalysis.coInvestors,
    outreachPlan: outreachCampaign.plan,
    outputDir
  });

  artifacts.push(...relationshipTracking.artifacts);

  // Task 7: Generate Syndication Package
  ctx.log('info', 'Generating syndication package');
  const syndicationPackage = await ctx.task(syndicationPackageTask, {
    fundName,
    dealInfo,
    syndicationStructure,
    termAlignment,
    outreachCampaign,
    outputDir
  });

  artifacts.push(...syndicationPackage.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    syndicationPlan: {
      structure: syndicationStructure.structure,
      dynamics: dynamicsAssessment.dynamics,
      timeline: syndicationStructure.timeline
    },
    coInvestorOutreach: outreachCampaign.outreachList,
    termAlignment: termAlignment.alignedTerms,
    relationshipPlan: relationshipTracking.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/co-investor-syndication',
      timestamp: startTime,
      fundName,
      dealInfo: { company: dealInfo.companyName, round: dealInfo.roundType }
    }
  };
}

// Task 1: Co-Investor Universe Analysis
export const coInvestorUniverseTask = defineTask('co-investor-universe', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze co-investor universe',
  agent: {
    name: 'syndication-analyst',
    prompt: {
      role: 'VC syndication specialist',
      task: 'Analyze and prioritize potential co-investors for the deal',
      context: args,
      instructions: [
        'Identify VCs with matching investment thesis and stage',
        'Analyze historical co-investment patterns',
        'Review sector expertise and portfolio overlap',
        'Assess check size preferences and capacity',
        'Evaluate relationship strength and history',
        'Research decision-making speed and process',
        'Identify potential conflicts or competing portfolio companies',
        'Prioritize by fit, relationship, and likelihood to participate'
      ],
      outputFormat: 'JSON with co-investor list, profiles, priorities, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'coInvestors', 'prioritized', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        coInvestors: { type: 'array' },
        profiles: { type: 'array' },
        prioritized: { type: 'array' },
        preferences: { type: 'object' },
        conflicts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'syndication', 'co-investors']
}));

// Task 2: Syndication Structure Design
export const syndicationStructureTask = defineTask('syndication-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design syndication structure',
  agent: {
    name: 'deal-structurer',
    prompt: {
      role: 'VC deal partner',
      task: 'Design optimal syndication structure for the round',
      context: args,
      instructions: [
        'Determine target round size and ownership',
        'Allocate lead investor share and rights',
        'Structure follow-on investor allocations',
        'Design pro-rata and super pro-rata provisions',
        'Plan for insider vs new investor participation',
        'Consider strategic vs financial investor mix',
        'Model dilution scenarios',
        'Create timeline for syndication completion'
      ],
      outputFormat: 'JSON with syndication structure, allocations, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'allocations', 'artifacts'],
      properties: {
        structure: {
          type: 'object',
          properties: {
            targetRaise: { type: 'number' },
            leadAllocation: { type: 'number' },
            followAllocation: { type: 'number' }
          }
        },
        allocations: { type: 'array' },
        timeline: { type: 'object' },
        scenarios: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'deal-structure', 'allocation']
}));

// Task 3: Lead/Follow Dynamics Assessment
export const leadFollowDynamicsTask = defineTask('lead-follow-dynamics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess lead/follow dynamics',
  agent: {
    name: 'dynamics-analyst',
    prompt: {
      role: 'VC deal partner',
      task: 'Assess and optimize lead/follow dynamics for the syndicate',
      context: args,
      instructions: [
        'Evaluate fund positioning as lead or follow',
        'Assess lead investor responsibilities and rights',
        'Analyze follow investor expectations',
        'Consider board seat allocation',
        'Evaluate information rights distribution',
        'Plan governance and voting arrangements',
        'Address potential lead/follow conflicts',
        'Document roles and responsibilities'
      ],
      outputFormat: 'JSON with dynamics assessment, roles, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dynamics', 'roles', 'artifacts'],
      properties: {
        dynamics: { type: 'object' },
        roles: { type: 'array' },
        governanceStructure: { type: 'object' },
        potentialConflicts: { type: 'array' },
        mitigationStrategies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'lead-follow', 'governance']
}));

// Task 4: Term Sheet Alignment
export const termAlignmentTask = defineTask('term-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Align term sheet preferences',
  agent: {
    name: 'terms-negotiator',
    prompt: {
      role: 'VC legal and deal specialist',
      task: 'Align term preferences across syndicate members',
      context: args,
      instructions: [
        'Document lead investor term preferences',
        'Gather follow investor requirements',
        'Identify term conflicts and gaps',
        'Negotiate liquidation preference alignment',
        'Align on anti-dilution provisions',
        'Coordinate protective provision requirements',
        'Plan for future round participation rights',
        'Create consensus term framework'
      ],
      outputFormat: 'JSON with aligned terms, conflicts, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alignedTerms', 'conflicts', 'artifacts'],
      properties: {
        alignedTerms: { type: 'object' },
        conflicts: { type: 'array' },
        resolutions: { type: 'array' },
        openIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'terms', 'negotiation']
}));

// Task 5: Co-Investor Outreach Campaign
export const coInvestorOutreachTask = defineTask('co-investor-outreach', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop co-investor outreach',
  agent: {
    name: 'outreach-coordinator',
    prompt: {
      role: 'VC investor relations manager',
      task: 'Develop and execute co-investor outreach campaign',
      context: args,
      instructions: [
        'Create tiered outreach sequence by priority',
        'Prepare deal teaser and investment memo',
        'Schedule partner introductions and meetings',
        'Prepare data room access and NDAs',
        'Plan management presentation sessions',
        'Create FAQ document for common questions',
        'Design follow-up and commitment tracking',
        'Set deadline management approach'
      ],
      outputFormat: 'JSON with outreach plan, materials, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['outreachList', 'plan', 'artifacts'],
      properties: {
        outreachList: { type: 'array' },
        plan: { type: 'object' },
        materials: { type: 'array' },
        timeline: { type: 'object' },
        trackingMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'outreach', 'syndication']
}));

// Task 6: Relationship Tracking Setup
export const relationshipTrackingTask = defineTask('relationship-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup relationship tracking',
  agent: {
    name: 'relationship-manager',
    prompt: {
      role: 'VC operations manager',
      task: 'Setup ongoing co-investor relationship tracking and management',
      context: args,
      instructions: [
        'Create co-investor relationship database entries',
        'Document historical deal sharing patterns',
        'Track reciprocity and deal flow balance',
        'Plan regular check-in cadence',
        'Document preferences and decision criteria',
        'Create deal sharing alert system',
        'Plan co-investor events and gatherings',
        'Design relationship health scoring'
      ],
      outputFormat: 'JSON with relationship tracking plan and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'relationships', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        relationships: { type: 'array' },
        checkInSchedule: { type: 'object' },
        reciprocityTracking: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'relationships', 'tracking']
}));

// Task 7: Syndication Package Generation
export const syndicationPackageTask = defineTask('syndication-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate syndication package',
  agent: {
    name: 'package-creator',
    prompt: {
      role: 'VC deal team lead',
      task: 'Generate comprehensive syndication package',
      context: args,
      instructions: [
        'Compile deal summary and thesis',
        'Include syndication structure and allocations',
        'Add term sheet framework',
        'Document co-investor requirements',
        'Include outreach materials and templates',
        'Add timeline and milestones',
        'Include data room table of contents',
        'Create executive briefing document'
      ],
      outputFormat: 'JSON with package path, contents, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['packagePath', 'contents', 'artifacts'],
      properties: {
        packagePath: { type: 'string' },
        contents: { type: 'array' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'syndication', 'documentation']
}));
