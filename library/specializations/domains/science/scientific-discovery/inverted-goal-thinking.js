/**
 * @process domains/science/scientific-discovery/inverted-goal-thinking
 * @description Inverted Goal Thinking: Optimize for opposite of actual goal to map design space
 * @inputs {
 *   actualGoal: string,
 *   context: string,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   invertedOptimization: object,
 *   designSpaceMap: object,
 *   insights: array,
 *   refinedGoalUnderstanding: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    actualGoal,
    context = '',
    domain = 'general science',
    explorationDepth = 'medium'
  } = inputs;

  const startTime = ctx.now();

  // Phase 1: Analyze the Actual Goal
  ctx.log('info', 'Analyzing the actual goal structure');
  const goalAnalysis = await ctx.task(analyzeGoalTask, {
    actualGoal,
    context,
    domain
  });

  // Phase 2: Construct Inverted Goal
  ctx.log('info', 'Constructing inverted goal');
  const invertedGoal = await ctx.task(constructInvertedGoalTask, {
    actualGoal,
    goalAnalysis,
    domain
  });

  // Phase 3: Optimize for Inverted Goal
  ctx.log('info', 'Optimizing for inverted goal');
  const invertedOptimization = await ctx.task(optimizeInvertedGoalTask, {
    invertedGoal,
    goalAnalysis,
    domain,
    explorationDepth
  });

  await ctx.breakpoint({
    question: 'Inverted optimization complete. Review inverted solutions before design space mapping?',
    title: 'Inverted Goal Thinking - Inverted Optimization Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/goal-analysis.json', format: 'json' },
        { path: 'artifacts/inverted-optimization.json', format: 'json' }
      ]
    }
  });

  // Phase 4: Analyze Anti-Patterns from Inverted Solutions
  ctx.log('info', 'Analyzing anti-patterns from inverted solutions');
  const antiPatterns = await ctx.task(analyzeAntiPatternsTask, {
    invertedOptimization,
    actualGoal,
    domain
  });

  // Phase 5: Map Design Space Boundaries
  ctx.log('info', 'Mapping design space boundaries');
  const designSpaceMap = await ctx.task(mapDesignSpaceTask, {
    actualGoal,
    invertedGoal,
    invertedOptimization,
    antiPatterns,
    domain
  });

  // Phase 6: Identify Failure Modes and Constraints
  ctx.log('info', 'Identifying failure modes and constraints');
  const failureModes = await ctx.task(identifyFailureModesTask, {
    invertedOptimization,
    designSpaceMap,
    actualGoal,
    domain
  });

  // Phase 7: Extract Insights for Actual Goal
  ctx.log('info', 'Extracting insights for actual goal optimization');
  const goalInsights = await ctx.task(extractGoalInsightsTask, {
    actualGoal,
    invertedOptimization,
    antiPatterns,
    designSpaceMap,
    failureModes,
    domain
  });

  // Phase 8: Refine Understanding of Actual Goal
  ctx.log('info', 'Refining understanding of actual goal');
  const refinedGoalUnderstanding = await ctx.task(refineGoalUnderstandingTask, {
    actualGoal,
    goalAnalysis,
    goalInsights,
    designSpaceMap,
    domain
  });

  return {
    success: true,
    processId: 'domains/science/scientific-discovery/inverted-goal-thinking',
    actualGoal,
    domain,
    goalAnalysis,
    invertedGoal,
    invertedOptimization,
    antiPatterns,
    designSpaceMap,
    failureModes,
    insights: goalInsights.insights,
    refinedGoalUnderstanding,
    metadata: {
      explorationDepth,
      antiPatternsIdentified: antiPatterns.patterns.length,
      failureModesIdentified: failureModes.modes.length,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const analyzeGoalTask = defineTask('analyze-goal', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Actual Goal',
  agent: {
    name: 'goal-analyst',
    prompt: {
      role: 'goal and optimization specialist',
      task: 'Analyze the structure and components of the actual goal',
      context: args,
      instructions: [
        'Decompose the goal into sub-goals and criteria',
        'Identify implicit assumptions in the goal',
        'Define success metrics and their ranges',
        'Identify constraints and boundary conditions',
        'Map dependencies between goal components',
        'Identify potential trade-offs within the goal',
        'Document what the goal optimizes for'
      ],
      outputFormat: 'JSON with goal structure, metrics, constraints, dependencies'
    },
    outputSchema: {
      type: 'object',
      required: ['goalStructure', 'metrics', 'constraints'],
      properties: {
        goalStructure: { type: 'object' },
        subGoals: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'array', items: { type: 'object' } },
        constraints: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        dependencies: { type: 'array', items: { type: 'object' } },
        tradeOffs: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'inverted-goal', 'analysis']
}));

export const constructInvertedGoalTask = defineTask('construct-inverted-goal', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct Inverted Goal',
  agent: {
    name: 'goal-inverter',
    prompt: {
      role: 'contrarian strategist',
      task: 'Construct the logical opposite of the actual goal',
      context: args,
      instructions: [
        'Negate each component of the actual goal',
        'Define what it means to fail at the goal',
        'Create metrics for maximizing failure',
        'Identify anti-success criteria',
        'Ensure the inversion is meaningful and complete',
        'Document the inversion logic used',
        'Consider multiple types of inversion if applicable'
      ],
      outputFormat: 'JSON with inverted goal structure, anti-metrics, inversion logic'
    },
    outputSchema: {
      type: 'object',
      required: ['invertedGoal', 'inversionLogic'],
      properties: {
        invertedGoal: { type: 'object' },
        antiSubGoals: { type: 'array', items: { type: 'object' } },
        antiMetrics: { type: 'array', items: { type: 'object' } },
        failureCriteria: { type: 'array', items: { type: 'string' } },
        inversionLogic: { type: 'string' },
        inversionTypes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'inverted-goal', 'construction']
}));

export const optimizeInvertedGoalTask = defineTask('optimize-inverted-goal', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize for Inverted Goal',
  agent: {
    name: 'inverted-optimizer',
    prompt: {
      role: 'optimization specialist',
      task: 'Find solutions that optimally achieve the inverted goal',
      context: args,
      instructions: [
        'Search for designs that maximize goal failure',
        'Identify strategies that worst serve the actual goal',
        'Find optimal anti-solutions',
        'Document the characteristics of worst solutions',
        'Explore the space of failure thoroughly',
        'Identify what makes solutions maximally bad',
        'Rate solutions by their failure achievement'
      ],
      outputFormat: 'JSON with inverted solutions, failure characteristics, rankings'
    },
    outputSchema: {
      type: 'object',
      required: ['invertedSolutions', 'failureCharacteristics'],
      properties: {
        invertedSolutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              solution: { type: 'object' },
              failureScore: { type: 'number' },
              failureMechanisms: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        failureCharacteristics: { type: 'array', items: { type: 'string' } },
        worstStrategies: { type: 'array', items: { type: 'string' } },
        failureSpace: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'inverted-goal', 'optimization']
}));

export const analyzeAntiPatternsTask = defineTask('analyze-anti-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Anti-Patterns',
  agent: {
    name: 'anti-pattern-analyst',
    prompt: {
      role: 'pattern analyst',
      task: 'Extract anti-patterns from inverted optimization',
      context: args,
      instructions: [
        'Identify recurring patterns in failure solutions',
        'Abstract anti-patterns that lead to goal failure',
        'Categorize anti-patterns by type',
        'Document how each anti-pattern causes failure',
        'Identify subtle anti-patterns that might be hidden',
        'Rank anti-patterns by severity',
        'Note anti-patterns that might accidentally appear in good solutions'
      ],
      outputFormat: 'JSON with anti-patterns, categories, severity rankings'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              failureMechanism: { type: 'string' },
              severity: { type: 'number' },
              subtlety: { type: 'string' }
            }
          }
        },
        categories: { type: 'array', items: { type: 'string' } },
        subtleAntiPatterns: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'inverted-goal', 'anti-patterns']
}));

export const mapDesignSpaceTask = defineTask('map-design-space', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map Design Space',
  agent: {
    name: 'design-space-mapper',
    prompt: {
      role: 'design space explorer',
      task: 'Map the design space using information from inverted optimization',
      context: args,
      instructions: [
        'Define boundaries of the design space',
        'Identify regions of good vs bad solutions',
        'Map the gradient from success to failure',
        'Identify critical thresholds and transitions',
        'Document design dimensions and their ranges',
        'Identify unexplored regions',
        'Create a navigable map of the solution space'
      ],
      outputFormat: 'JSON with design space map, boundaries, regions, transitions'
    },
    outputSchema: {
      type: 'object',
      required: ['dimensions', 'boundaries', 'regions'],
      properties: {
        dimensions: { type: 'array', items: { type: 'object' } },
        boundaries: { type: 'array', items: { type: 'object' } },
        regions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              characteristics: { type: 'array', items: { type: 'string' } },
              quality: { type: 'string' }
            }
          }
        },
        transitions: { type: 'array', items: { type: 'object' } },
        criticalThresholds: { type: 'array', items: { type: 'object' } },
        unexploredRegions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'inverted-goal', 'design-space']
}));

export const identifyFailureModesTask = defineTask('identify-failure-modes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Failure Modes',
  agent: {
    name: 'failure-mode-analyst',
    prompt: {
      role: 'failure analysis specialist',
      task: 'Identify distinct failure modes from inverted analysis',
      context: args,
      instructions: [
        'Categorize distinct ways the goal can fail',
        'Identify root causes of each failure mode',
        'Document early warning signs for each mode',
        'Assess likelihood and severity of each mode',
        'Identify cascading failure possibilities',
        'Map relationships between failure modes',
        'Propose prevention strategies'
      ],
      outputFormat: 'JSON with failure modes, causes, warnings, prevention'
    },
    outputSchema: {
      type: 'object',
      required: ['modes'],
      properties: {
        modes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              rootCauses: { type: 'array', items: { type: 'string' } },
              earlyWarnings: { type: 'array', items: { type: 'string' } },
              likelihood: { type: 'string' },
              severity: { type: 'string' },
              prevention: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        cascadingFailures: { type: 'array', items: { type: 'object' } },
        modeRelationships: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'inverted-goal', 'failure-modes']
}));

export const extractGoalInsightsTask = defineTask('extract-goal-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract Insights for Actual Goal',
  agent: {
    name: 'insight-extractor',
    prompt: {
      role: 'strategic insight generator',
      task: 'Extract insights for achieving the actual goal from inverted analysis',
      context: args,
      instructions: [
        'Derive positive strategies from anti-patterns (do opposite)',
        'Identify what to avoid from failure analysis',
        'Extract design principles from design space map',
        'Generate actionable recommendations',
        'Identify non-obvious success factors',
        'Document the most valuable insights',
        'Prioritize insights by impact'
      ],
      outputFormat: 'JSON with insights, strategies, recommendations, priorities'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'strategies'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              source: { type: 'string' },
              impact: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        strategies: { type: 'array', items: { type: 'string' } },
        thingsToAvoid: { type: 'array', items: { type: 'string' } },
        designPrinciples: { type: 'array', items: { type: 'string' } },
        nonObviousFactors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'inverted-goal', 'insights']
}));

export const refineGoalUnderstandingTask = defineTask('refine-goal-understanding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine Goal Understanding',
  agent: {
    name: 'goal-refiner',
    prompt: {
      role: 'goal refinement specialist',
      task: 'Refine understanding of the actual goal based on all analysis',
      context: args,
      instructions: [
        'Integrate all insights into refined goal understanding',
        'Clarify previously implicit aspects of the goal',
        'Identify goal aspects that matter most',
        'Refine success criteria based on design space',
        'Update constraints based on failure analysis',
        'Create enhanced goal specification',
        'Document what was learned about the goal'
      ],
      outputFormat: 'JSON with refined goal, enhanced criteria, learnings'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedGoal', 'enhancedCriteria', 'learnings'],
      properties: {
        refinedGoal: { type: 'object' },
        enhancedCriteria: { type: 'array', items: { type: 'object' } },
        clarifiedAspects: { type: 'array', items: { type: 'string' } },
        criticalFactors: { type: 'array', items: { type: 'string' } },
        refinedConstraints: { type: 'array', items: { type: 'string' } },
        learnings: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'inverted-goal', 'refinement']
}));
