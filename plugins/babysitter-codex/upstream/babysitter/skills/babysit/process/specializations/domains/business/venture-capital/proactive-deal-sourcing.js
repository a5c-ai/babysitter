/**
 * @process venture-capital/proactive-deal-sourcing
 * @description Structured outreach to target companies, founders, and ecosystems including accelerators, incubators, universities, and industry conferences to generate proprietary deal flow
 * @inputs { fundName: string, investmentThesis: object, targetSectors: array, geographies: array }
 * @outputs { success: boolean, sourcingPlan: object, targetList: array, outreachCampaigns: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    fundName,
    investmentThesis = {},
    targetSectors = [],
    geographies = [],
    outputDir = 'deal-sourcing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Thesis Alignment and Target Definition
  ctx.log('info', 'Defining target company profiles based on investment thesis');
  const targetDefinition = await ctx.task(targetDefinitionTask, {
    fundName,
    investmentThesis,
    targetSectors,
    geographies,
    outputDir
  });

  if (!targetDefinition.success) {
    return {
      success: false,
      error: 'Target definition failed',
      details: targetDefinition,
      metadata: { processId: 'venture-capital/proactive-deal-sourcing', timestamp: startTime }
    };
  }

  artifacts.push(...targetDefinition.artifacts);

  // Task 2: Ecosystem Mapping
  ctx.log('info', 'Mapping relevant startup ecosystems');
  const ecosystemMapping = await ctx.task(ecosystemMappingTask, {
    targetSectors,
    geographies,
    targetProfiles: targetDefinition.targetProfiles,
    outputDir
  });

  artifacts.push(...ecosystemMapping.artifacts);

  // Task 3: Company Identification
  ctx.log('info', 'Identifying target companies matching criteria');
  const companyIdentification = await ctx.task(companyIdentificationTask, {
    targetProfiles: targetDefinition.targetProfiles,
    ecosystemMap: ecosystemMapping.ecosystemMap,
    outputDir
  });

  artifacts.push(...companyIdentification.artifacts);

  // Task 4: Founder Network Analysis
  ctx.log('info', 'Analyzing founder backgrounds and networks');
  const founderAnalysis = await ctx.task(founderNetworkAnalysisTask, {
    companies: companyIdentification.companies,
    outputDir
  });

  artifacts.push(...founderAnalysis.artifacts);

  // Task 5: Outreach Strategy Development
  ctx.log('info', 'Developing personalized outreach strategies');
  const outreachStrategy = await ctx.task(outreachStrategyTask, {
    companies: companyIdentification.companies,
    founderInsights: founderAnalysis.founderInsights,
    ecosystemMap: ecosystemMapping.ecosystemMap,
    outputDir
  });

  artifacts.push(...outreachStrategy.artifacts);

  // Task 6: Event and Conference Planning
  ctx.log('info', 'Planning event and conference participation');
  const eventPlanning = await ctx.task(eventPlanningTask, {
    targetSectors,
    geographies,
    ecosystemMap: ecosystemMapping.ecosystemMap,
    outputDir
  });

  artifacts.push(...eventPlanning.artifacts);

  // Breakpoint: Review sourcing plan
  await ctx.breakpoint({
    question: `Deal sourcing plan complete. ${companyIdentification.companies.length} target companies identified. Review outreach strategy?`,
    title: 'Proactive Deal Sourcing Plan',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        targetCompanies: companyIdentification.companies.length,
        ecosystemPartners: ecosystemMapping.partnerCount,
        outreachCampaigns: outreachStrategy.campaigns.length,
        upcomingEvents: eventPlanning.priorityEvents.length
      }
    }
  });

  // Task 7: Generate Sourcing Playbook
  ctx.log('info', 'Generating sourcing playbook');
  const sourcingPlaybook = await ctx.task(sourcingPlaybookTask, {
    fundName,
    targetDefinition,
    ecosystemMapping,
    companyIdentification,
    founderAnalysis,
    outreachStrategy,
    eventPlanning,
    outputDir
  });

  artifacts.push(...sourcingPlaybook.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    sourcingPlan: {
      targetProfiles: targetDefinition.targetProfiles,
      ecosystemStrategy: ecosystemMapping.strategy,
      outreachApproach: outreachStrategy.approach
    },
    targetList: companyIdentification.companies,
    outreachCampaigns: outreachStrategy.campaigns,
    eventCalendar: eventPlanning.priorityEvents,
    ecosystemPartners: ecosystemMapping.partners,
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/proactive-deal-sourcing',
      timestamp: startTime,
      fundName,
      targetSectors,
      geographies
    }
  };
}

// Task 1: Target Definition
export const targetDefinitionTask = defineTask('target-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define target company profiles',
  agent: {
    name: 'thesis-analyst',
    prompt: {
      role: 'VC investment strategist',
      task: 'Define ideal target company profiles aligned with investment thesis',
      context: args,
      instructions: [
        'Analyze investment thesis and fund strategy',
        'Define ideal company stage and revenue range',
        'Specify target business models and metrics',
        'Identify key technology and product characteristics',
        'Define founder profile preferences',
        'Set geographic and market focus criteria',
        'Create scoring rubric for target fit',
        'Document anti-portfolio characteristics to avoid'
      ],
      outputFormat: 'JSON with target profiles, criteria, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'targetProfiles', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        targetProfiles: { type: 'array' },
        criteria: { type: 'object' },
        scoringRubric: { type: 'object' },
        antiPatterns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'thesis', 'targeting']
}));

// Task 2: Ecosystem Mapping
export const ecosystemMappingTask = defineTask('ecosystem-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map startup ecosystems',
  agent: {
    name: 'ecosystem-mapper',
    prompt: {
      role: 'VC business development specialist',
      task: 'Map relevant startup ecosystems and partnership opportunities',
      context: args,
      instructions: [
        'Identify top accelerators and incubators in target sectors',
        'Map university entrepreneurship programs and tech transfer offices',
        'List relevant corporate venture arms and strategic partners',
        'Identify angel networks and syndicates',
        'Catalog startup communities and founder groups',
        'Map co-investor relationships and deal sharing patterns',
        'Identify thought leaders and influencers',
        'Prioritize partnership opportunities by deal flow potential'
      ],
      outputFormat: 'JSON with ecosystem map, partners, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ecosystemMap', 'partners', 'artifacts'],
      properties: {
        ecosystemMap: { type: 'object' },
        partners: { type: 'array' },
        partnerCount: { type: 'number' },
        strategy: { type: 'object' },
        priorityRelationships: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ecosystem', 'partnerships']
}));

// Task 3: Company Identification
export const companyIdentificationTask = defineTask('company-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify target companies',
  agent: {
    name: 'company-researcher',
    prompt: {
      role: 'VC research analyst',
      task: 'Identify and score companies matching target criteria',
      context: args,
      instructions: [
        'Search databases for companies matching target profiles',
        'Analyze recent funding announcements in target sectors',
        'Review accelerator cohorts and demo day companies',
        'Identify companies from industry publications and awards',
        'Score companies against fit criteria',
        'Research company stage, traction, and funding history',
        'Identify warm connection paths to each company',
        'Prioritize outreach targets by fit and accessibility'
      ],
      outputFormat: 'JSON with company list, scores, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['companies', 'artifacts'],
      properties: {
        companies: { type: 'array' },
        totalIdentified: { type: 'number' },
        highPriorityCount: { type: 'number' },
        bySource: { type: 'object' },
        bySector: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'research', 'company-identification']
}));

// Task 4: Founder Network Analysis
export const founderNetworkAnalysisTask = defineTask('founder-network-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze founder backgrounds and networks',
  agent: {
    name: 'founder-analyst',
    prompt: {
      role: 'VC talent analyst',
      task: 'Research founder backgrounds and identify connection paths',
      context: args,
      instructions: [
        'Research founder professional backgrounds',
        'Analyze previous company experience and exits',
        'Map educational backgrounds and alumni networks',
        'Identify mutual connections for warm introductions',
        'Assess founder-market fit indicators',
        'Research team composition and key hires',
        'Identify advisor and board member networks',
        'Score founders against success pattern indicators'
      ],
      outputFormat: 'JSON with founder insights, connections, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['founderInsights', 'connectionPaths', 'artifacts'],
      properties: {
        founderInsights: { type: 'array' },
        connectionPaths: { type: 'object' },
        warmIntros: { type: 'array' },
        founderPatterns: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'founders', 'networking']
}));

// Task 5: Outreach Strategy Development
export const outreachStrategyTask = defineTask('outreach-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop outreach strategies',
  agent: {
    name: 'outreach-strategist',
    prompt: {
      role: 'VC business development manager',
      task: 'Develop personalized outreach campaigns for target companies',
      context: args,
      instructions: [
        'Segment targets by outreach approach',
        'Design warm introduction request templates',
        'Create cold outreach sequences with personalization',
        'Develop thought leadership content strategy',
        'Plan social media engagement approach',
        'Design follow-up cadence and touchpoints',
        'Create value-add offerings for initial meetings',
        'Set up tracking and measurement framework'
      ],
      outputFormat: 'JSON with campaigns, templates, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['campaigns', 'approach', 'artifacts'],
      properties: {
        campaigns: { type: 'array' },
        approach: { type: 'object' },
        templates: { type: 'array' },
        cadence: { type: 'object' },
        metrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'outreach', 'business-development']
}));

// Task 6: Event and Conference Planning
export const eventPlanningTask = defineTask('event-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan event participation',
  agent: {
    name: 'event-planner',
    prompt: {
      role: 'VC marketing and events manager',
      task: 'Plan conference and event participation for deal sourcing',
      context: args,
      instructions: [
        'Identify key industry conferences and events',
        'Evaluate demo days and pitch competitions',
        'Plan accelerator and incubator engagement',
        'Schedule university campus visits',
        'Identify speaking and panel opportunities',
        'Plan hosted events and dinners',
        'Create pre-event company research checklist',
        'Design post-event follow-up workflows'
      ],
      outputFormat: 'JSON with event calendar, priorities, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['priorityEvents', 'eventCalendar', 'artifacts'],
      properties: {
        priorityEvents: { type: 'array' },
        eventCalendar: { type: 'array' },
        speakingOpportunities: { type: 'array' },
        hostedEvents: { type: 'array' },
        followUpWorkflows: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'events', 'conferences']
}));

// Task 7: Sourcing Playbook Generation
export const sourcingPlaybookTask = defineTask('sourcing-playbook', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate sourcing playbook',
  agent: {
    name: 'playbook-generator',
    prompt: {
      role: 'VC operations director',
      task: 'Generate comprehensive deal sourcing playbook',
      context: args,
      instructions: [
        'Compile all sourcing strategies into playbook',
        'Document target company profiles and criteria',
        'Include ecosystem partner engagement plans',
        'Add outreach templates and sequences',
        'Include event participation calendar',
        'Document measurement and tracking framework',
        'Add team responsibilities and workflows',
        'Format as actionable operational guide'
      ],
      outputFormat: 'JSON with playbook path, summary, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['playbookPath', 'summary', 'artifacts'],
      properties: {
        playbookPath: { type: 'string' },
        summary: { type: 'object' },
        keyStrategies: { type: 'array' },
        metrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'playbook', 'documentation']
}));
