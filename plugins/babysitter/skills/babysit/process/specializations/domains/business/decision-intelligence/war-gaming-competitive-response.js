/**
 * @process specializations/domains/business/decision-intelligence/war-gaming-competitive-response
 * @description War Gaming and Competitive Response Modeling - Structured exercises to anticipate competitor responses
 * and test strategic options through simulation and role-playing.
 * @inputs { projectName: string, strategicContext: object, competitors: array, strategicOptions: array, participants?: array }
 * @outputs { success: boolean, warGameDesign: object, scenarioOutcomes: array, competitorResponses: object, strategicInsights: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/war-gaming-competitive-response', {
 *   projectName: 'Product Launch War Game',
 *   strategicContext: { action: 'New product launch', market: 'Enterprise Software' },
 *   competitors: ['Competitor A', 'Competitor B'],
 *   strategicOptions: ['Premium pricing', 'Aggressive pricing', 'Phased rollout']
 * });
 *
 * @references
 * - Academy of Competitive Intelligence: https://www.academyci.com/books/
 * - Business War Gaming: Mark Chussil
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    strategicContext = {},
    competitors = [],
    strategicOptions = [],
    participants = [],
    outputDir = 'war-gaming-output'
  } = inputs;

  // Phase 1: War Game Design
  const warGameDesign = await ctx.task(warGameDesignTask, {
    projectName,
    strategicContext,
    competitors,
    strategicOptions
  });

  // Phase 2: Competitor Profiling
  const competitorProfiling = await ctx.task(competitorProfilingTask, {
    projectName,
    competitors,
    strategicContext
  });

  // Phase 3: Scenario Development
  const scenariosDevelopment = await ctx.task(warGameScenariosTask, {
    projectName,
    strategicOptions,
    competitorProfiling,
    strategicContext
  });

  // Phase 4: Response Modeling
  const responseModeling = await ctx.task(responseModelingTask, {
    projectName,
    competitorProfiling,
    scenariosDevelopment,
    strategicOptions
  });

  // Breakpoint: Review war game setup
  await ctx.breakpoint({
    question: `Review war game design for ${projectName}. Is the scenario setup realistic?`,
    title: 'War Game Design Review',
    context: {
      runId: ctx.runId,
      projectName,
      competitorCount: competitors.length,
      optionsCount: strategicOptions.length
    }
  });

  // Phase 5: War Game Execution
  const gameExecution = await ctx.task(gameExecutionTask, {
    projectName,
    warGameDesign,
    scenariosDevelopment,
    responseModeling,
    participants
  });

  // Phase 6: Outcome Analysis
  const outcomeAnalysis = await ctx.task(outcomeAnalysisTask, {
    projectName,
    gameExecution,
    strategicOptions
  });

  // Phase 7: Strategic Insights
  const strategicInsights = await ctx.task(warGameInsightsTask, {
    projectName,
    outcomeAnalysis,
    responseModeling,
    strategicContext
  });

  // Phase 8: Recommendations
  const recommendations = await ctx.task(warGameRecommendationsTask, {
    projectName,
    strategicInsights,
    outcomeAnalysis
  });

  return {
    success: true,
    projectName,
    warGameDesign,
    competitorProfiling,
    scenarios: scenariosDevelopment,
    competitorResponses: responseModeling,
    scenarioOutcomes: outcomeAnalysis.outcomes,
    strategicInsights,
    recommendations,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/war-gaming-competitive-response',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const warGameDesignTask = defineTask('war-game-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `War Game Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'War Game Designer',
      task: 'Design war gaming exercise structure',
      context: args,
      instructions: [
        '1. Define war game objectives',
        '2. Design game structure and rounds',
        '3. Define team roles and assignments',
        '4. Create rules of engagement',
        '5. Design decision points',
        '6. Plan facilitation approach',
        '7. Define success metrics',
        '8. Create preparation materials'
      ],
      outputFormat: 'JSON object with war game design'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'structure', 'roles'],
      properties: {
        objectives: { type: 'array' },
        structure: { type: 'object' },
        rounds: { type: 'array' },
        roles: { type: 'array' },
        rules: { type: 'array' },
        facilitation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'war-gaming', 'design']
}));

export const competitorProfilingTask = defineTask('competitor-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Competitor Profiling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Competitive Profiling Expert',
      task: 'Develop detailed competitor profiles for war gaming',
      context: args,
      instructions: [
        '1. Analyze competitor strategic priorities',
        '2. Profile decision-making style',
        '3. Identify likely response patterns',
        '4. Assess competitive capabilities',
        '5. Understand organizational culture',
        '6. Identify key decision makers',
        '7. Analyze historical responses',
        '8. Create competitor playbooks'
      ],
      outputFormat: 'JSON object with competitor profiles'
    },
    outputSchema: {
      type: 'object',
      required: ['profiles', 'responsePatterns', 'playbooks'],
      properties: {
        profiles: { type: 'array' },
        priorities: { type: 'object' },
        decisionStyle: { type: 'object' },
        responsePatterns: { type: 'object' },
        capabilities: { type: 'object' },
        playbooks: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'war-gaming', 'profiling']
}));

export const warGameScenariosTask = defineTask('war-game-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scenario Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'War Game Scenario Developer',
      task: 'Develop war game scenarios',
      context: args,
      instructions: [
        '1. Define market conditions scenarios',
        '2. Create strategic move sequences',
        '3. Design competitor response triggers',
        '4. Define round-by-round scenarios',
        '5. Create unexpected event cards',
        '6. Design escalation scenarios',
        '7. Plan scenario branching',
        '8. Create scenario briefings'
      ],
      outputFormat: 'JSON object with scenarios'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'sequences', 'events'],
      properties: {
        scenarios: { type: 'array' },
        marketConditions: { type: 'object' },
        sequences: { type: 'array' },
        triggers: { type: 'object' },
        events: { type: 'array' },
        briefings: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'war-gaming', 'scenarios']
}));

export const responseModelingTask = defineTask('response-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Response Modeling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Competitive Response Modeler',
      task: 'Model likely competitive responses',
      context: args,
      instructions: [
        '1. Map strategic options to likely responses',
        '2. Model response timing',
        '3. Estimate response intensity',
        '4. Identify response options per competitor',
        '5. Model multi-round dynamics',
        '6. Identify retaliation patterns',
        '7. Model coalition responses',
        '8. Create response probability estimates'
      ],
      outputFormat: 'JSON object with response modeling'
    },
    outputSchema: {
      type: 'object',
      required: ['responses', 'timing', 'probabilities'],
      properties: {
        responses: { type: 'object' },
        timing: { type: 'object' },
        intensity: { type: 'object' },
        dynamics: { type: 'object' },
        retaliation: { type: 'object' },
        probabilities: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'war-gaming', 'responses']
}));

export const gameExecutionTask = defineTask('game-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `War Game Execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'War Game Facilitator',
      task: 'Execute war gaming exercise',
      context: args,
      instructions: [
        '1. Brief participants on scenarios',
        '2. Facilitate decision rounds',
        '3. Document team decisions',
        '4. Reveal competitor responses',
        '5. Manage game dynamics',
        '6. Capture key debates',
        '7. Document surprising findings',
        '8. Summarize round outcomes'
      ],
      outputFormat: 'JSON object with game execution'
    },
    outputSchema: {
      type: 'object',
      required: ['rounds', 'decisions', 'outcomes'],
      properties: {
        rounds: { type: 'array' },
        decisions: { type: 'object' },
        responses: { type: 'object' },
        debates: { type: 'array' },
        surprises: { type: 'array' },
        outcomes: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'war-gaming', 'execution']
}));

export const outcomeAnalysisTask = defineTask('outcome-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Outcome Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'War Game Analyst',
      task: 'Analyze war game outcomes',
      context: args,
      instructions: [
        '1. Analyze outcome patterns',
        '2. Compare strategic options results',
        '3. Identify winning strategies',
        '4. Analyze response effectiveness',
        '5. Identify vulnerability points',
        '6. Assess option robustness',
        '7. Identify unexpected outcomes',
        '8. Create outcome summary'
      ],
      outputFormat: 'JSON object with outcome analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['outcomes', 'patterns', 'rankings'],
      properties: {
        outcomes: { type: 'array' },
        patterns: { type: 'array' },
        optionResults: { type: 'object' },
        rankings: { type: 'array' },
        vulnerabilities: { type: 'array' },
        unexpected: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'war-gaming', 'analysis']
}));

export const warGameInsightsTask = defineTask('war-game-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: `Strategic Insights - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Strategic Insights Synthesizer',
      task: 'Synthesize strategic insights from war game',
      context: args,
      instructions: [
        '1. Identify key strategic insights',
        '2. Document competitor behavior learning',
        '3. Identify effective counter-strategies',
        '4. Document blind spots discovered',
        '5. Identify robust vs risky options',
        '6. Document timing insights',
        '7. Identify capability gaps',
        '8. Create insight synthesis'
      ],
      outputFormat: 'JSON object with strategic insights'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'learning', 'counterStrategies'],
      properties: {
        insights: { type: 'array' },
        competitorLearning: { type: 'object' },
        counterStrategies: { type: 'array' },
        blindSpots: { type: 'array' },
        learning: { type: 'array' },
        timingInsights: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'war-gaming', 'insights']
}));

export const warGameRecommendationsTask = defineTask('war-game-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Recommendations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'War Game Recommendation Specialist',
      task: 'Develop recommendations from war game',
      context: args,
      instructions: [
        '1. Recommend preferred strategic option',
        '2. Define contingent responses',
        '3. Identify early warning signals',
        '4. Recommend preparation activities',
        '5. Define trigger points',
        '6. Recommend capability investments',
        '7. Create strategic action plan',
        '8. Define follow-up activities'
      ],
      outputFormat: 'JSON object with recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'contingencies', 'actionPlan'],
      properties: {
        recommendations: { type: 'array' },
        preferredOption: { type: 'string' },
        contingencies: { type: 'array' },
        earlyWarnings: { type: 'array' },
        preparations: { type: 'array' },
        actionPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'war-gaming', 'recommendations']
}));
