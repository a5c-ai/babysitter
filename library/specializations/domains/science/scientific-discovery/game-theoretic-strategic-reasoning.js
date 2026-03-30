/**
 * @process specializations/domains/science/scientific-discovery/game-theoretic-strategic-reasoning
 * @description Game-Theoretic Strategic Reasoning - Reason systematically when outcomes depend on
 * others' choices, applying Nash equilibria, dominant strategies, mechanism design, and multi-agent
 * decision theory to scientific discovery, collaboration dynamics, and competitive research scenarios.
 * @inputs { scenario: string, agents: object[], payoffStructure?: object, constraints?: object, objectives?: string[] }
 * @outputs { success: boolean, equilibria: object[], strategies: object[], predictions: object[], recommendations: object[] }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/game-theoretic-strategic-reasoning', {
 *   scenario: 'Research collaboration vs competition for priority',
 *   agents: [{ name: 'Lab A', resources: 'high', reputation: 'established' }, { name: 'Lab B', resources: 'medium', reputation: 'emerging' }],
 *   payoffStructure: { collaboration: { shared_credit: 0.6, speed_bonus: 0.3 }, competition: { winner_takes_all: 0.9, loser: 0.1 } },
 *   objectives: ['Maximize discovery impact', 'Ensure fair attribution', 'Optimize resource utilization']
 * });
 *
 * @references
 * - Game Theory and Strategy: https://plato.stanford.edu/entries/game-theory/
 * - Nash Equilibrium: https://www.nobelprize.org/prizes/economic-sciences/1994/nash/facts/
 * - Multi-Agent Systems: https://www.sciencedirect.com/topics/computer-science/multi-agent-system
 * - Mechanism Design Theory: https://www.nobelprize.org/prizes/economic-sciences/2007/summary/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    scenario,
    agents,
    payoffStructure = {},
    constraints = {},
    objectives = []
  } = inputs;

  // Phase 1: Game Structure Analysis
  const gameAnalysis = await ctx.task(gameStructureAnalysisTask, {
    scenario,
    agents,
    payoffStructure,
    constraints
  });

  // Quality Gate: Game structure must be well-defined
  if (!gameAnalysis.gameType || !gameAnalysis.players || gameAnalysis.players.length < 2) {
    return {
      success: false,
      error: 'Invalid game structure - requires at least 2 players with defined strategies',
      phase: 'game-structure-analysis',
      equilibria: null
    };
  }

  // Phase 2: Strategy Space Enumeration
  const strategySpace = await ctx.task(strategySpaceEnumerationTask, {
    scenario,
    gameAnalysis,
    agents,
    constraints
  });

  // Phase 3: Payoff Matrix Construction
  const payoffMatrix = await ctx.task(payoffMatrixConstructionTask, {
    scenario,
    gameAnalysis,
    strategySpace,
    payoffStructure
  });

  // Phase 4: Dominant Strategy Analysis
  const dominantStrategies = await ctx.task(dominantStrategyAnalysisTask, {
    payoffMatrix,
    players: gameAnalysis.players,
    strategySpace
  });

  // Phase 5: Nash Equilibrium Identification
  const nashEquilibria = await ctx.task(nashEquilibriumIdentificationTask, {
    payoffMatrix,
    strategySpace,
    dominantStrategies,
    gameType: gameAnalysis.gameType
  });

  // Breakpoint: Review equilibrium analysis
  await ctx.breakpoint({
    question: `Review Nash equilibria for "${scenario}". Found ${nashEquilibria.equilibria?.length || 0} equilibria. Are assumptions valid?`,
    title: 'Equilibrium Analysis Review',
    context: {
      runId: ctx.runId,
      scenario,
      equilibria: nashEquilibria.equilibria,
      dominantStrategies: dominantStrategies.strategies,
      files: [{
        path: 'artifacts/equilibrium-analysis.json',
        format: 'json',
        content: { nashEquilibria, dominantStrategies }
      }]
    }
  });

  // Phase 6: Mixed Strategy Analysis
  const mixedStrategies = await ctx.task(mixedStrategyAnalysisTask, {
    payoffMatrix,
    nashEquilibria,
    strategySpace,
    gameType: gameAnalysis.gameType
  });

  // Phase 7: Dynamic Game Analysis (if applicable)
  const dynamicAnalysis = await ctx.task(dynamicGameAnalysisTask, {
    scenario,
    gameAnalysis,
    nashEquilibria,
    agents,
    constraints
  });

  // Phase 8: Coalition and Cooperation Analysis
  const coalitionAnalysis = await ctx.task(coalitionAnalysisTask, {
    scenario,
    agents,
    payoffMatrix,
    nashEquilibria,
    objectives
  });

  // Phase 9: Behavioral and Bounded Rationality Considerations
  const behavioralAnalysis = await ctx.task(behavioralAnalysisTask, {
    scenario,
    agents,
    nashEquilibria,
    coalitionAnalysis,
    constraints
  });

  // Phase 10: Strategic Recommendations Generation
  const recommendations = await ctx.task(strategicRecommendationsTask, {
    scenario,
    objectives,
    nashEquilibria,
    mixedStrategies,
    dynamicAnalysis,
    coalitionAnalysis,
    behavioralAnalysis,
    agents
  });

  // Quality Gate: Recommendations must be actionable
  if (!recommendations.recommendations || recommendations.recommendations.length === 0) {
    return {
      success: false,
      error: 'Failed to generate actionable strategic recommendations',
      phase: 'recommendations-generation',
      equilibria: nashEquilibria.equilibria
    };
  }

  // Final Breakpoint: Strategic Analysis Approval
  await ctx.breakpoint({
    question: `Game-theoretic analysis complete for "${scenario}". Review strategic recommendations and approve?`,
    title: 'Strategic Analysis Approval',
    context: {
      runId: ctx.runId,
      scenario,
      equilibriaCount: nashEquilibria.equilibria?.length || 0,
      topRecommendation: recommendations.recommendations[0],
      files: [
        { path: 'artifacts/strategic-analysis-report.json', format: 'json', content: recommendations },
        { path: 'artifacts/strategic-analysis-report.md', format: 'markdown', content: recommendations.markdown }
      ]
    }
  });

  return {
    success: true,
    scenario,
    gameStructure: {
      type: gameAnalysis.gameType,
      players: gameAnalysis.players,
      informationStructure: gameAnalysis.informationStructure
    },
    equilibria: nashEquilibria.equilibria,
    strategies: {
      dominant: dominantStrategies.strategies,
      mixed: mixedStrategies.strategies,
      dynamic: dynamicAnalysis.strategies
    },
    predictions: {
      likelyOutcomes: nashEquilibria.predictions,
      behavioralAdjustments: behavioralAnalysis.adjustedPredictions,
      coalitionFormation: coalitionAnalysis.likelyCoalitions
    },
    recommendations: recommendations.recommendations,
    analysis: {
      payoffMatrix: payoffMatrix.matrix,
      coalitions: coalitionAnalysis.coalitions,
      behavioralFactors: behavioralAnalysis.factors
    },
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/game-theoretic-strategic-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const gameStructureAnalysisTask = defineTask('game-structure-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Game Structure Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Game Theory Expert specializing in multi-agent strategic interactions',
      task: 'Analyze the game structure of the strategic scenario',
      context: {
        scenario: args.scenario,
        agents: args.agents,
        payoffStructure: args.payoffStructure,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify the type of game (simultaneous/sequential, zero-sum/non-zero-sum, cooperative/non-cooperative)',
        '2. Define all players and their characteristics (capabilities, resources, information)',
        '3. Analyze the information structure (perfect/imperfect information, complete/incomplete)',
        '4. Determine if the game is repeated or one-shot',
        '5. Identify commitment possibilities and credible threats',
        '6. Analyze timing structure and move order if sequential',
        '7. Determine if there are binding agreements possible',
        '8. Identify any external constraints or rules governing the game',
        '9. Assess whether payoffs are observable and verifiable',
        '10. Document key assumptions about rationality and common knowledge'
      ],
      outputFormat: 'JSON object with comprehensive game structure analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['gameType', 'players', 'informationStructure'],
      properties: {
        gameType: {
          type: 'object',
          properties: {
            timing: { type: 'string', enum: ['simultaneous', 'sequential', 'repeated'] },
            sumType: { type: 'string', enum: ['zero-sum', 'constant-sum', 'variable-sum'] },
            cooperation: { type: 'string', enum: ['cooperative', 'non-cooperative', 'mixed'] },
            repetition: { type: 'string', enum: ['one-shot', 'finitely-repeated', 'infinitely-repeated'] }
          }
        },
        players: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              capabilities: { type: 'array', items: { type: 'string' } },
              resources: { type: 'object' },
              objectives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        informationStructure: {
          type: 'object',
          properties: {
            informationType: { type: 'string', enum: ['perfect', 'imperfect'] },
            completeness: { type: 'string', enum: ['complete', 'incomplete'] },
            observability: { type: 'object' },
            commonKnowledge: { type: 'array', items: { type: 'string' } }
          }
        },
        commitmentMechanisms: { type: 'array', items: { type: 'string' } },
        externalConstraints: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-theory', 'strategic-reasoning', 'structure-analysis']
}));

export const strategySpaceEnumerationTask = defineTask('strategy-space-enumeration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Strategy Space Enumeration',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Strategic Analysis Expert in game-theoretic reasoning',
      task: 'Enumerate and categorize all possible strategies for each player',
      context: {
        scenario: args.scenario,
        gameAnalysis: args.gameAnalysis,
        agents: args.agents,
        constraints: args.constraints
      },
      instructions: [
        '1. For each player, enumerate all pure strategies available',
        '2. Categorize strategies by type (aggressive, defensive, cooperative, mixed)',
        '3. Identify dominated strategies that are never optimal',
        '4. Determine strategy constraints based on resources and capabilities',
        '5. Identify conditional or contingent strategies',
        '6. Map strategies to potential outcomes',
        '7. Assess strategy feasibility given constraints',
        '8. Identify strategic complements and substitutes',
        '9. Document strategy interdependencies',
        '10. Create strategy profiles for key scenarios'
      ],
      outputFormat: 'JSON object with complete strategy space enumeration'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'dominatedStrategies'],
      properties: {
        strategies: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                strategyId: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string', enum: ['aggressive', 'defensive', 'cooperative', 'neutral', 'mixed'] },
                requirements: { type: 'array', items: { type: 'string' } },
                feasibility: { type: 'number', minimum: 0, maximum: 1 }
              }
            }
          }
        },
        dominatedStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strategyId: { type: 'string' },
              dominatedBy: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        strategyProfiles: { type: 'array', items: { type: 'object' } },
        interdependencies: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-theory', 'strategy-enumeration', 'strategic-reasoning']
}));

export const payoffMatrixConstructionTask = defineTask('payoff-matrix-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Payoff Matrix Construction',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Quantitative Game Theory Analyst',
      task: 'Construct comprehensive payoff matrices for all strategy combinations',
      context: {
        scenario: args.scenario,
        gameAnalysis: args.gameAnalysis,
        strategySpace: args.strategySpace,
        payoffStructure: args.payoffStructure
      },
      instructions: [
        '1. Construct payoff matrix for each pair of strategy profiles',
        '2. Quantify payoffs using appropriate scale (utility, monetary, ordinal)',
        '3. Account for uncertainty in payoff estimation',
        '4. Include payoffs for all players in each cell',
        '5. Document assumptions underlying payoff calculations',
        '6. Consider both direct and indirect payoffs (reputation, future opportunities)',
        '7. Normalize payoffs if necessary for comparison',
        '8. Identify Pareto-optimal and Pareto-dominated outcomes',
        '9. Calculate social welfare for each outcome',
        '10. Document sensitivity of payoffs to key parameters'
      ],
      outputFormat: 'JSON object with complete payoff matrix and analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'paretoOptimal'],
      properties: {
        matrix: {
          type: 'object',
          description: 'Payoff matrix indexed by strategy profile'
        },
        paretoOptimal: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              profile: { type: 'string' },
              payoffs: { type: 'object' }
            }
          }
        },
        socialWelfare: { type: 'object' },
        payoffAssumptions: { type: 'array', items: { type: 'string' } },
        sensitivity: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-theory', 'payoff-analysis', 'matrix-construction']
}));

export const dominantStrategyAnalysisTask = defineTask('dominant-strategy-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Dominant Strategy Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Game Theory Strategist specializing in equilibrium analysis',
      task: 'Identify dominant, dominated, and rationalizable strategies',
      context: {
        payoffMatrix: args.payoffMatrix,
        players: args.players,
        strategySpace: args.strategySpace
      },
      instructions: [
        '1. Identify strictly dominant strategies for each player',
        '2. Identify weakly dominant strategies',
        '3. Perform iterated elimination of dominated strategies (IEDS)',
        '4. Identify rationalizable strategies after elimination',
        '5. Determine if dominant strategy equilibrium exists',
        '6. Analyze conditions under which strategies become dominant',
        '7. Identify strategy dominance relationships',
        '8. Document order of elimination in IEDS',
        '9. Assess robustness of dominance to payoff uncertainty',
        '10. Identify conditional dominance based on beliefs'
      ],
      outputFormat: 'JSON object with dominant strategy analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'eliminationSequence'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              player: { type: 'string' },
              strategy: { type: 'string' },
              dominanceType: { type: 'string', enum: ['strictly-dominant', 'weakly-dominant', 'rationalizable', 'dominated'] },
              conditions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        eliminationSequence: { type: 'array', items: { type: 'object' } },
        dominantStrategyEquilibrium: {
          type: 'object',
          properties: {
            exists: { type: 'boolean' },
            profile: { type: 'object' }
          }
        },
        rationalizableStrategies: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-theory', 'dominance-analysis', 'strategic-reasoning']
}));

export const nashEquilibriumIdentificationTask = defineTask('nash-equilibrium-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Nash Equilibrium Identification',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Equilibrium Analysis Expert in game-theoretic reasoning',
      task: 'Identify all Nash equilibria and their properties',
      context: {
        payoffMatrix: args.payoffMatrix,
        strategySpace: args.strategySpace,
        dominantStrategies: args.dominantStrategies,
        gameType: args.gameType
      },
      instructions: [
        '1. Identify all pure strategy Nash equilibria',
        '2. Verify equilibria using best response analysis',
        '3. Classify equilibria by stability (strict, weak)',
        '4. Assess Pareto efficiency of each equilibrium',
        '5. Identify equilibrium selection criteria (risk dominance, payoff dominance)',
        '6. Analyze equilibrium uniqueness or multiplicity',
        '7. Calculate equilibrium payoffs for all players',
        '8. Assess equilibrium robustness to small perturbations',
        '9. Identify focal points among multiple equilibria',
        '10. Generate predictions based on equilibrium analysis'
      ],
      outputFormat: 'JSON object with complete Nash equilibrium analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['equilibria', 'predictions'],
      properties: {
        equilibria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              profile: { type: 'object' },
              payoffs: { type: 'object' },
              stability: { type: 'string', enum: ['strict', 'weak'] },
              paretoEfficient: { type: 'boolean' },
              riskDominant: { type: 'boolean' },
              payoffDominant: { type: 'boolean' }
            }
          }
        },
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              outcome: { type: 'string' },
              probability: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        },
        selectionCriteria: { type: 'array', items: { type: 'string' } },
        focalPoints: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-theory', 'nash-equilibrium', 'equilibrium-analysis']
}));

export const mixedStrategyAnalysisTask = defineTask('mixed-strategy-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Mixed Strategy Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Probabilistic Strategy Analyst in game theory',
      task: 'Analyze mixed strategy equilibria and optimal randomization',
      context: {
        payoffMatrix: args.payoffMatrix,
        nashEquilibria: args.nashEquilibria,
        strategySpace: args.strategySpace,
        gameType: args.gameType
      },
      instructions: [
        '1. Identify mixed strategy Nash equilibria',
        '2. Calculate optimal probability distributions over pure strategies',
        '3. Verify indifference conditions for mixed equilibria',
        '4. Analyze support of mixed strategies',
        '5. Calculate expected payoffs under mixed strategies',
        '6. Assess stability of mixed equilibria',
        '7. Compare pure and mixed equilibrium payoffs',
        '8. Identify conditions favoring mixed vs pure strategies',
        '9. Analyze correlation possibilities in mixed strategies',
        '10. Document interpretation of mixing in the specific context'
      ],
      outputFormat: 'JSON object with mixed strategy equilibrium analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'expectedPayoffs'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              player: { type: 'string' },
              distribution: { type: 'object' },
              support: { type: 'array', items: { type: 'string' } },
              expectedPayoff: { type: 'number' }
            }
          }
        },
        mixedEquilibria: { type: 'array', items: { type: 'object' } },
        expectedPayoffs: { type: 'object' },
        stabilityAnalysis: { type: 'object' },
        interpretation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-theory', 'mixed-strategies', 'probabilistic-analysis']
}));

export const dynamicGameAnalysisTask = defineTask('dynamic-game-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Dynamic Game Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Dynamic Game Theory Expert specializing in sequential reasoning',
      task: 'Analyze dynamic and repeated game aspects',
      context: {
        scenario: args.scenario,
        gameAnalysis: args.gameAnalysis,
        nashEquilibria: args.nashEquilibria,
        agents: args.agents,
        constraints: args.constraints
      },
      instructions: [
        '1. Construct extensive form game tree if sequential',
        '2. Apply backward induction for subgame perfect equilibria',
        '3. Identify credible vs non-credible threats',
        '4. Analyze reputation effects in repeated games',
        '5. Calculate folk theorem outcomes for repeated games',
        '6. Identify trigger strategies and punishment mechanisms',
        '7. Analyze discount factor effects on cooperation',
        '8. Identify commitment devices and their effectiveness',
        '9. Analyze learning dynamics and strategy evolution',
        '10. Generate dynamic strategy recommendations'
      ],
      outputFormat: 'JSON object with dynamic game analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'subgamePerfectEquilibria'],
      properties: {
        subgamePerfectEquilibria: { type: 'array', items: { type: 'object' } },
        credibleThreats: { type: 'array', items: { type: 'object' } },
        reputationEffects: { type: 'object' },
        folkTheoremOutcomes: { type: 'array', items: { type: 'object' } },
        triggerStrategies: { type: 'array', items: { type: 'object' } },
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              conditions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        learningDynamics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-theory', 'dynamic-games', 'sequential-reasoning']
}));

export const coalitionAnalysisTask = defineTask('coalition-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Coalition and Cooperation Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Cooperative Game Theory Expert specializing in coalition formation',
      task: 'Analyze coalition formation possibilities and cooperative outcomes',
      context: {
        scenario: args.scenario,
        agents: args.agents,
        payoffMatrix: args.payoffMatrix,
        nashEquilibria: args.nashEquilibria,
        objectives: args.objectives
      },
      instructions: [
        '1. Identify all possible coalitions and their values',
        '2. Calculate Shapley values for fair division',
        '3. Identify core allocations if they exist',
        '4. Analyze stability of coalition structures',
        '5. Identify blocking coalitions',
        '6. Calculate bargaining solutions (Nash, Kalai-Smorodinsky)',
        '7. Analyze conditions for coalition formation',
        '8. Identify coalition-proof equilibria',
        '9. Assess incentive compatibility of cooperative agreements',
        '10. Predict likely coalition structures'
      ],
      outputFormat: 'JSON object with coalition and cooperation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['coalitions', 'likelyCoalitions'],
      properties: {
        coalitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              members: { type: 'array', items: { type: 'string' } },
              value: { type: 'number' },
              stability: { type: 'string', enum: ['stable', 'unstable', 'conditionally-stable'] },
              formationConditions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        shapleyValues: { type: 'object' },
        coreAllocations: { type: 'array', items: { type: 'object' } },
        bargainingSolutions: { type: 'object' },
        blockingCoalitions: { type: 'array', items: { type: 'object' } },
        likelyCoalitions: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-theory', 'cooperative-games', 'coalition-formation']
}));

export const behavioralAnalysisTask = defineTask('behavioral-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Behavioral and Bounded Rationality Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Behavioral Game Theory Expert',
      task: 'Analyze behavioral factors and bounded rationality effects',
      context: {
        scenario: args.scenario,
        agents: args.agents,
        nashEquilibria: args.nashEquilibria,
        coalitionAnalysis: args.coalitionAnalysis,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify relevant behavioral biases (loss aversion, fairness preferences, etc.)',
        '2. Analyze level-k thinking and cognitive hierarchy models',
        '3. Assess impact of fairness and reciprocity on outcomes',
        '4. Consider bounded rationality and satisficing behavior',
        '5. Analyze role of emotions and affect in decision-making',
        '6. Consider framing effects on strategy choices',
        '7. Analyze social preferences (altruism, spite, inequality aversion)',
        '8. Assess impact of cognitive limitations on equilibrium selection',
        '9. Generate behaviorally-adjusted predictions',
        '10. Identify strategies robust to behavioral deviations'
      ],
      outputFormat: 'JSON object with behavioral analysis and adjusted predictions'
    },
    outputSchema: {
      type: 'object',
      required: ['factors', 'adjustedPredictions'],
      properties: {
        factors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              affectedPlayers: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        levelKAnalysis: { type: 'object' },
        fairnessConsiderations: { type: 'object' },
        adjustedPredictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              outcome: { type: 'string' },
              adjustedProbability: { type: 'number' },
              behavioralRationale: { type: 'string' }
            }
          }
        },
        robustStrategies: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-theory', 'behavioral-economics', 'bounded-rationality']
}));

export const strategicRecommendationsTask = defineTask('strategic-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Strategic Recommendations Generation',
  agent: {
    name: 'decision-theorist',
    skills: ['formal-logic-reasoner', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Strategic Advisory Expert synthesizing game-theoretic insights',
      task: 'Generate actionable strategic recommendations from the analysis',
      context: {
        scenario: args.scenario,
        objectives: args.objectives,
        nashEquilibria: args.nashEquilibria,
        mixedStrategies: args.mixedStrategies,
        dynamicAnalysis: args.dynamicAnalysis,
        coalitionAnalysis: args.coalitionAnalysis,
        behavioralAnalysis: args.behavioralAnalysis,
        agents: args.agents
      },
      instructions: [
        '1. Synthesize all analyses into coherent strategic recommendations',
        '2. Prioritize recommendations by impact and feasibility',
        '3. Provide recommendations for each player/stakeholder',
        '4. Include contingency recommendations for different scenarios',
        '5. Highlight cooperation opportunities and their conditions',
        '6. Identify risks and mitigation strategies',
        '7. Provide timing recommendations for strategic moves',
        '8. Include recommendations for commitment and signaling',
        '9. Address behavioral considerations in recommendations',
        '10. Generate summary report with key insights'
      ],
      outputFormat: 'JSON object with strategic recommendations and summary'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'markdown'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              player: { type: 'string' },
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              conditions: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } },
              timing: { type: 'string' }
            }
          }
        },
        cooperationOpportunities: { type: 'array', items: { type: 'object' } },
        contingencyPlans: { type: 'array', items: { type: 'object' } },
        keyInsights: { type: 'array', items: { type: 'string' } },
        markdown: { type: 'string', description: 'Complete analysis report in markdown format' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-theory', 'strategic-recommendations', 'decision-support']
}));
