/**
 * @process specializations/domains/business/decision-intelligence/competitive-battlecard-development
 * @description Competitive Battlecard Development - Creation of sales enablement battlecards with competitor
 * profiles, differentiation points, objection handling, and win strategies.
 * @inputs { projectName: string, competitors: array, products: array, salesTeamContext?: object, existingMaterials?: array }
 * @outputs { success: boolean, battlecards: array, objectionLibrary: object, winStrategies: object, enablementPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/competitive-battlecard-development', {
 *   projectName: 'Q1 Competitive Battlecard Refresh',
 *   competitors: ['Competitor A', 'Competitor B'],
 *   products: ['Product X', 'Product Y'],
 *   salesTeamContext: { regions: ['NA', 'EMEA'], segments: ['Enterprise', 'SMB'] }
 * });
 *
 * @references
 * - Klue Competitive Enablement: https://klue.com/
 * - Crayon Competitive Intelligence: https://www.crayon.co/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    competitors = [],
    products = [],
    salesTeamContext = {},
    existingMaterials = [],
    outputDir = 'battlecard-output'
  } = inputs;

  // Phase 1: Competitive Research
  const competitiveResearch = await ctx.task(competitiveResearchTask, {
    projectName,
    competitors,
    products,
    existingMaterials
  });

  // Phase 2: Differentiation Analysis
  const differentiationAnalysis = await ctx.task(differentiationAnalysisTask, {
    projectName,
    competitors,
    products,
    competitiveResearch
  });

  // Phase 3: Objection Library Development
  const objectionLibrary = await ctx.task(objectionLibraryTask, {
    projectName,
    competitors,
    differentiationAnalysis,
    salesTeamContext
  });

  // Phase 4: Win/Loss Intelligence Integration
  const winLossIntelligence = await ctx.task(winLossIntegrationTask, {
    projectName,
    competitors,
    existingMaterials
  });

  // Phase 5: Battlecard Content Creation
  const battlecardContent = await ctx.task(battlecardContentTask, {
    projectName,
    competitors,
    competitiveResearch,
    differentiationAnalysis,
    objectionLibrary,
    winLossIntelligence
  });

  // Breakpoint: Review battlecard content
  await ctx.breakpoint({
    question: `Review battlecard content for ${projectName}. Is the positioning accurate and compelling?`,
    title: 'Battlecard Content Review',
    context: {
      runId: ctx.runId,
      projectName,
      battlecardCount: battlecardContent.battlecards?.length || 0,
      objectionCount: objectionLibrary.objections?.length || 0
    }
  });

  // Phase 6: Win Strategy Development
  const winStrategies = await ctx.task(winStrategyTask, {
    projectName,
    competitors,
    differentiationAnalysis,
    winLossIntelligence,
    battlecardContent
  });

  // Phase 7: Sales Enablement Plan
  const enablementPlan = await ctx.task(enablementPlanTask, {
    projectName,
    battlecardContent,
    salesTeamContext,
    winStrategies
  });

  // Phase 8: Maintenance and Update Process
  const maintenanceProcess = await ctx.task(maintenanceProcessTask, {
    projectName,
    battlecardContent,
    competitors
  });

  return {
    success: true,
    projectName,
    competitiveResearch,
    differentiationAnalysis,
    battlecards: battlecardContent.battlecards,
    objectionLibrary,
    winStrategies,
    enablementPlan,
    maintenanceProcess,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/competitive-battlecard-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const competitiveResearchTask = defineTask('competitive-research', (args, taskCtx) => ({
  kind: 'agent',
  title: `Competitive Research - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Competitive Intelligence Analyst',
      task: 'Conduct comprehensive competitive research for battlecard development',
      context: args,
      instructions: [
        '1. Research competitor products and features',
        '2. Analyze pricing and packaging strategies',
        '3. Document target market and positioning',
        '4. Identify strengths and weaknesses',
        '5. Research recent news and announcements',
        '6. Analyze customer reviews and sentiment',
        '7. Document technology and platform details',
        '8. Identify key partnerships and integrations'
      ],
      outputFormat: 'JSON object with competitive research'
    },
    outputSchema: {
      type: 'object',
      required: ['profiles', 'features', 'positioning'],
      properties: {
        profiles: { type: 'array' },
        features: { type: 'object' },
        pricing: { type: 'object' },
        positioning: { type: 'object' },
        strengths: { type: 'object' },
        weaknesses: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'battlecards', 'research']
}));

export const differentiationAnalysisTask = defineTask('differentiation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Differentiation Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Marketing Strategist',
      task: 'Analyze competitive differentiation and positioning',
      context: args,
      instructions: [
        '1. Create feature comparison matrices',
        '2. Identify unique differentiators',
        '3. Analyze competitive gaps and advantages',
        '4. Define value proposition differences',
        '5. Map customer benefit differences',
        '6. Identify price-value positioning',
        '7. Document technical differentiators',
        '8. Create differentiation messaging'
      ],
      outputFormat: 'JSON object with differentiation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['comparisons', 'differentiators', 'messaging'],
      properties: {
        comparisons: { type: 'array' },
        differentiators: { type: 'array' },
        advantages: { type: 'object' },
        gaps: { type: 'object' },
        messaging: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'battlecards', 'differentiation']
}));

export const objectionLibraryTask = defineTask('objection-library', (args, taskCtx) => ({
  kind: 'agent',
  title: `Objection Library Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Sales Enablement Specialist',
      task: 'Develop comprehensive objection handling library',
      context: args,
      instructions: [
        '1. Catalog common competitive objections',
        '2. Create objection response frameworks',
        '3. Develop proof points and evidence',
        '4. Create customer reference stories',
        '5. Design objection handling talk tracks',
        '6. Categorize by competitor and scenario',
        '7. Create quick reference formats',
        '8. Validate with top performers'
      ],
      outputFormat: 'JSON object with objection library'
    },
    outputSchema: {
      type: 'object',
      required: ['objections', 'responses', 'proofPoints'],
      properties: {
        objections: { type: 'array' },
        responses: { type: 'object' },
        proofPoints: { type: 'array' },
        references: { type: 'array' },
        talkTracks: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'battlecards', 'objections']
}));

export const winLossIntegrationTask = defineTask('win-loss-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Win/Loss Intelligence Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Win/Loss Analyst',
      task: 'Integrate win/loss intelligence into battlecard content',
      context: args,
      instructions: [
        '1. Analyze win/loss data by competitor',
        '2. Identify common win themes and patterns',
        '3. Document loss reasons and patterns',
        '4. Extract successful strategies and tactics',
        '5. Identify buyer persona preferences',
        '6. Document competitive displacement stories',
        '7. Analyze deal stage competitive dynamics',
        '8. Create win rate benchmarks by competitor'
      ],
      outputFormat: 'JSON object with win/loss intelligence'
    },
    outputSchema: {
      type: 'object',
      required: ['winPatterns', 'lossPatterns', 'strategies'],
      properties: {
        winPatterns: { type: 'array' },
        lossPatterns: { type: 'array' },
        strategies: { type: 'array' },
        winRates: { type: 'object' },
        displacementStories: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'battlecards', 'win-loss']
}));

export const battlecardContentTask = defineTask('battlecard-content', (args, taskCtx) => ({
  kind: 'agent',
  title: `Battlecard Content Creation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Competitive Content Developer',
      task: 'Create comprehensive battlecard content',
      context: args,
      instructions: [
        '1. Design battlecard structure and format',
        '2. Create competitor overview sections',
        '3. Develop quick facts and statistics',
        '4. Write differentiation messaging',
        '5. Create trap questions to ask',
        '6. Develop counter-messaging',
        '7. Include relevant proof points',
        '8. Design visual elements and layouts'
      ],
      outputFormat: 'JSON object with battlecard content'
    },
    outputSchema: {
      type: 'object',
      required: ['battlecards', 'templates', 'content'],
      properties: {
        battlecards: { type: 'array' },
        templates: { type: 'object' },
        content: { type: 'object' },
        visualElements: { type: 'array' },
        trapQuestions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'battlecards', 'content']
}));

export const winStrategyTask = defineTask('win-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Win Strategy Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Competitive Strategy Specialist',
      task: 'Develop win strategies for each competitive scenario',
      context: args,
      instructions: [
        '1. Define win strategies by competitor',
        '2. Create deal stage-specific tactics',
        '3. Develop persona-based approaches',
        '4. Design proof point strategies',
        '5. Create reference and demo strategies',
        '6. Define pricing and commercial strategies',
        '7. Develop partner and ecosystem strategies',
        '8. Create competitive displacement playbooks'
      ],
      outputFormat: 'JSON object with win strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'tactics', 'playbooks'],
      properties: {
        strategies: { type: 'array' },
        tactics: { type: 'object' },
        playbooks: { type: 'array' },
        pricingStrategies: { type: 'object' },
        displacementPlays: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'battlecards', 'strategy']
}));

export const enablementPlanTask = defineTask('enablement-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sales Enablement Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Sales Enablement Manager',
      task: 'Create sales enablement plan for battlecard rollout',
      context: args,
      instructions: [
        '1. Design training curriculum',
        '2. Create role-play scenarios',
        '3. Plan certification program',
        '4. Design reinforcement activities',
        '5. Create quick reference guides',
        '6. Plan communication and launch',
        '7. Define success metrics',
        '8. Design feedback collection process'
      ],
      outputFormat: 'JSON object with enablement plan'
    },
    outputSchema: {
      type: 'object',
      required: ['training', 'certification', 'launch'],
      properties: {
        training: { type: 'object' },
        certification: { type: 'object' },
        rolePlays: { type: 'array' },
        launch: { type: 'object' },
        metrics: { type: 'array' },
        feedback: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'battlecards', 'enablement']
}));

export const maintenanceProcessTask = defineTask('maintenance-process', (args, taskCtx) => ({
  kind: 'agent',
  title: `Maintenance and Update Process - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Competitive Intelligence Program Manager',
      task: 'Define battlecard maintenance and update process',
      context: args,
      instructions: [
        '1. Define update triggers and cadence',
        '2. Create intelligence monitoring alerts',
        '3. Design review and approval workflow',
        '4. Plan field feedback integration',
        '5. Define version control process',
        '6. Create distribution and notification system',
        '7. Design effectiveness measurement',
        '8. Plan continuous improvement process'
      ],
      outputFormat: 'JSON object with maintenance process'
    },
    outputSchema: {
      type: 'object',
      required: ['triggers', 'workflow', 'distribution'],
      properties: {
        triggers: { type: 'array' },
        cadence: { type: 'object' },
        workflow: { type: 'object' },
        versionControl: { type: 'object' },
        distribution: { type: 'object' },
        measurement: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'battlecards', 'maintenance']
}));
