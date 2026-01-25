/**
 * @process specializations/domains/science/scientific-discovery/minimax-regret-reasoning
 * @description Minimax Regret Reasoning Process - Minimize worst-case regret rather than
 * utility, choosing actions that avoid largest potential disappointment across scenarios.
 * @inputs { domain: string, alternatives: object[], scenarios: object[], payoffMatrix?: object }
 * @outputs { success: boolean, minimaxRegretChoice: object, regretAnalysis: object, recommendations: object[] }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/minimax-regret-reasoning', {
 *   domain: 'Investment Strategy',
 *   alternatives: [{ name: 'aggressive' }, { name: 'moderate' }, { name: 'conservative' }],
 *   scenarios: [{ name: 'bull_market' }, { name: 'bear_market' }, { name: 'stable' }]
 * });
 *
 * @references
 * - Savage (1951). The Theory of Statistical Decision
 * - Loomes & Sugden (1982). Regret Theory
 * - Hayashi (2008). Regret Aversion and Opportunity Dependence
 * - Stoye (2011). Minimax Regret
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain,
    alternatives,
    scenarios,
    payoffMatrix = null
  } = inputs;

  // Phase 1: Problem Structuring
  const problemStructuring = await ctx.task(regretProblemStructuringTask, {
    domain,
    alternatives,
    scenarios
  });

  // Phase 2: Payoff Matrix Construction
  const payoffConstruction = await ctx.task(payoffMatrixConstructionTask, {
    alternatives,
    scenarios,
    payoffMatrix,
    domain
  });

  // Phase 3: Opportunity Cost Calculation
  const opportunityCost = await ctx.task(opportunityCostCalculationTask, {
    payoffConstruction,
    scenarios
  });

  // Phase 4: Regret Matrix Construction
  const regretMatrix = await ctx.task(regretMatrixConstructionTask, {
    payoffConstruction,
    opportunityCost
  });

  // Phase 5: Maximum Regret Analysis
  const maxRegretAnalysis = await ctx.task(maxRegretAnalysisTask, {
    regretMatrix,
    alternatives
  });

  // Phase 6: Minimax Regret Selection
  const minimaxSelection = await ctx.task(minimaxRegretSelectionTask, {
    maxRegretAnalysis,
    alternatives
  });

  // Breakpoint: Review regret analysis
  await ctx.breakpoint({
    question: `Minimax regret analysis complete. Choice: ${minimaxSelection.minimaxChoice} with max regret ${minimaxSelection.minimaxRegretValue}. Review regret matrix?`,
    title: 'Minimax Regret Review',
    context: {
      runId: ctx.runId,
      domain,
      minimaxChoice: minimaxSelection.minimaxChoice,
      maximRegret: minimaxSelection.minimaxRegretValue
    }
  });

  // Phase 7: Regret Distribution Analysis
  const regretDistribution = await ctx.task(regretDistributionTask, {
    regretMatrix,
    minimaxSelection
  });

  // Phase 8: Comparison with Other Criteria
  const criteriaComparison = await ctx.task(criteriaComparisonTask, {
    payoffConstruction,
    regretMatrix,
    minimaxSelection
  });

  // Phase 9: Robustness Analysis
  const robustnessAnalysis = await ctx.task(regretRobustnessTask, {
    regretMatrix,
    minimaxSelection,
    payoffConstruction
  });

  // Phase 10: Recommendation Synthesis
  const recommendation = await ctx.task(regretRecommendationTask, {
    minimaxSelection,
    regretDistribution,
    criteriaComparison,
    robustnessAnalysis,
    domain
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Analysis complete. Recommendation: ${recommendation.recommendedAlternative}. Confidence: ${recommendation.confidence}. Accept?`,
    title: 'Final Regret Analysis Review',
    context: {
      runId: ctx.runId,
      domain,
      files: [
        { path: 'artifacts/regret-matrix.json', format: 'json', content: regretMatrix },
        { path: 'artifacts/recommendation.json', format: 'json', content: recommendation }
      ]
    }
  });

  return {
    success: true,
    domain,
    minimaxRegretChoice: {
      alternative: minimaxSelection.minimaxChoice,
      maxRegret: minimaxSelection.minimaxRegretValue,
      worstScenario: minimaxSelection.worstScenario
    },
    regretAnalysis: {
      regretMatrix: regretMatrix.matrix,
      maxRegrets: maxRegretAnalysis.maxRegrets,
      distribution: regretDistribution
    },
    criteriaComparison: criteriaComparison,
    robustness: robustnessAnalysis,
    recommendations: recommendation.recommendations,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/minimax-regret-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const regretProblemStructuringTask = defineTask('regret-problem-structuring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Minimax Regret Problem Structuring - ${args.domain}`,
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in decision theory and regret analysis',
      task: 'Structure the decision problem for minimax regret analysis',
      context: {
        domain: args.domain,
        alternatives: args.alternatives,
        scenarios: args.scenarios
      },
      instructions: [
        '1. Clarify decision context and objectives',
        '2. Validate alternatives list',
        '3. Validate scenarios/states of nature',
        '4. Define payoff/outcome metric',
        '5. Establish scenario plausibility',
        '6. Identify decision maker risk attitude',
        '7. Document assumptions',
        '8. Assess completeness of scenario space',
        '9. Structure for regret computation',
        '10. Document problem formulation'
      ],
      outputFormat: 'JSON object with structured problem'
    },
    outputSchema: {
      type: 'object',
      required: ['alternatives', 'scenarios', 'payoffMetric'],
      properties: {
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              plausibility: { type: 'string' }
            }
          }
        },
        payoffMetric: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            units: { type: 'string' },
            direction: { type: 'string', enum: ['higher-better', 'lower-better'] }
          }
        },
        assumptions: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['regret', 'structuring', 'decision-theory']
}));

export const payoffMatrixConstructionTask = defineTask('payoff-matrix-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Payoff Matrix Construction',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in decision matrix construction and payoff estimation',
      task: 'Construct the payoff matrix for all alternative-scenario pairs',
      context: {
        alternatives: args.alternatives,
        scenarios: args.scenarios,
        payoffMatrix: args.payoffMatrix,
        domain: args.domain
      },
      instructions: [
        '1. Estimate/retrieve payoff for each alternative-scenario pair',
        '2. Build complete payoff matrix',
        '3. Validate payoff consistency',
        '4. Handle missing payoff estimates',
        '5. Document estimation methodology',
        '6. Identify best payoff in each scenario',
        '7. Assess payoff uncertainty',
        '8. Normalize if needed',
        '9. Document data sources',
        '10. Validate matrix completeness'
      ],
      outputFormat: 'JSON object with payoff matrix'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'bestInScenario'],
      properties: {
        matrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              scenario: { type: 'string' },
              payoff: { type: 'number' }
            }
          }
        },
        bestInScenario: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              bestAlternative: { type: 'string' },
              bestPayoff: { type: 'number' }
            }
          }
        },
        payoffRanges: {
          type: 'object',
          properties: {
            minimum: { type: 'number' },
            maximum: { type: 'number' }
          }
        },
        estimationMethod: { type: 'string' },
        uncertainties: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['regret', 'payoff', 'matrix']
}));

export const opportunityCostCalculationTask = defineTask('opportunity-cost-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Opportunity Cost Calculation',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in opportunity cost and counterfactual analysis',
      task: 'Calculate opportunity cost (best achievable) for each scenario',
      context: {
        payoffConstruction: args.payoffConstruction,
        scenarios: args.scenarios
      },
      instructions: [
        '1. For each scenario, identify maximum achievable payoff',
        '2. This is the opportunity cost benchmark',
        '3. Document which alternative achieves best in each scenario',
        '4. Assess uniqueness of best alternative per scenario',
        '5. Handle ties appropriately',
        '6. Document opportunity costs',
        '7. Analyze opportunity cost patterns',
        '8. Identify scenarios with large opportunity gaps',
        '9. Assess foregone opportunities',
        '10. Create opportunity cost summary'
      ],
      outputFormat: 'JSON object with opportunity costs'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunityCosts'],
      properties: {
        opportunityCosts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              maxPayoff: { type: 'number' },
              achievedBy: { type: 'string' },
              tie: { type: 'boolean' }
            }
          }
        },
        opportunityGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              gap: { type: 'number' }
            }
          }
        },
        patterns: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['regret', 'opportunity-cost', 'benchmark']
}));

export const regretMatrixConstructionTask = defineTask('regret-matrix-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Regret Matrix Construction',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in regret theory and decision analysis',
      task: 'Construct the regret matrix from payoffs and opportunity costs',
      context: {
        payoffConstruction: args.payoffConstruction,
        opportunityCost: args.opportunityCost
      },
      instructions: [
        '1. For each cell: regret = max_payoff(scenario) - actual_payoff',
        '2. Construct complete regret matrix',
        '3. Validate all regrets are non-negative',
        '4. Identify zero-regret cells (optimal choices)',
        '5. Identify high-regret cells',
        '6. Document regret patterns',
        '7. Compute regret statistics per alternative',
        '8. Visualize regret distribution',
        '9. Document regret calculation',
        '10. Validate regret matrix'
      ],
      outputFormat: 'JSON object with regret matrix'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix'],
      properties: {
        matrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              scenario: { type: 'string' },
              regret: { type: 'number' }
            }
          }
        },
        zeroRegretCells: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              scenario: { type: 'string' }
            }
          }
        },
        highRegretCells: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              scenario: { type: 'string' },
              regret: { type: 'number' }
            }
          }
        },
        regretStatistics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              meanRegret: { type: 'number' },
              maxRegret: { type: 'number' },
              minRegret: { type: 'number' }
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
  labels: ['regret', 'matrix', 'construction']
}));

export const maxRegretAnalysisTask = defineTask('max-regret-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Maximum Regret Analysis',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in worst-case regret analysis',
      task: 'Identify maximum regret for each alternative',
      context: {
        regretMatrix: args.regretMatrix,
        alternatives: args.alternatives
      },
      instructions: [
        '1. For each alternative, find maximum regret across scenarios',
        '2. Record the worst scenario for each alternative',
        '3. Rank alternatives by maximum regret',
        '4. Assess regret gap between alternatives',
        '5. Identify alternatives with similar max regret',
        '6. Analyze worst-case scenario patterns',
        '7. Compute max regret statistics',
        '8. Document max regret findings',
        '9. Identify regret-dominated alternatives',
        '10. Summarize max regret analysis'
      ],
      outputFormat: 'JSON object with max regret analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['maxRegrets', 'ranking'],
      properties: {
        maxRegrets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              maxRegret: { type: 'number' },
              worstScenario: { type: 'string' }
            }
          }
        },
        ranking: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              alternative: { type: 'string' },
              maxRegret: { type: 'number' }
            }
          }
        },
        regretGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank1: { type: 'string' },
              rank2: { type: 'string' },
              gap: { type: 'number' }
            }
          }
        },
        worstScenarioPatterns: {
          type: 'array',
          items: { type: 'string' }
        },
        regretDominated: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['regret', 'maximum', 'worst-case']
}));

export const minimaxRegretSelectionTask = defineTask('minimax-regret-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Minimax Regret Selection',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in minimax regret decision criterion',
      task: 'Apply minimax regret criterion to select alternative',
      context: {
        maxRegretAnalysis: args.maxRegretAnalysis,
        alternatives: args.alternatives
      },
      instructions: [
        '1. Identify alternative with minimum max-regret (minimax)',
        '2. This is the minimax regret optimal choice',
        '3. Handle ties if multiple alternatives have same minimax',
        '4. Document minimax selection reasoning',
        '5. Identify the worst scenario for minimax choice',
        '6. Compute minimax regret value',
        '7. Assess confidence in selection',
        '8. Compare close competitors',
        '9. Document selection',
        '10. Provide minimax recommendation'
      ],
      outputFormat: 'JSON object with minimax regret selection'
    },
    outputSchema: {
      type: 'object',
      required: ['minimaxChoice', 'minimaxRegretValue'],
      properties: {
        minimaxChoice: { type: 'string' },
        minimaxRegretValue: { type: 'number' },
        worstScenario: { type: 'string' },
        ties: {
          type: 'array',
          items: { type: 'string' }
        },
        tieBreaker: { type: 'string' },
        closeCompetitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              maxRegret: { type: 'number' },
              difference: { type: 'number' }
            }
          }
        },
        confidence: {
          type: 'string',
          enum: ['high', 'moderate', 'low']
        },
        reasoning: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['regret', 'minimax', 'selection']
}));

export const regretDistributionTask = defineTask('regret-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Regret Distribution Analysis',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in regret distribution and statistical analysis',
      task: 'Analyze the distribution of regret for each alternative',
      context: {
        regretMatrix: args.regretMatrix,
        minimaxSelection: args.minimaxSelection
      },
      instructions: [
        '1. Compute regret distribution per alternative',
        '2. Calculate mean, median, std dev of regret',
        '3. Analyze regret skewness',
        '4. Compare distributions across alternatives',
        '5. Identify alternatives with low average regret',
        '6. Identify alternatives with high regret variance',
        '7. Plot regret profiles (description)',
        '8. Assess regret concentration',
        '9. Compare minimax choice distribution',
        '10. Document distribution analysis'
      ],
      outputFormat: 'JSON object with regret distribution'
    },
    outputSchema: {
      type: 'object',
      required: ['distributions'],
      properties: {
        distributions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              mean: { type: 'number' },
              median: { type: 'number' },
              stdDev: { type: 'number' },
              max: { type: 'number' },
              min: { type: 'number' },
              skewness: { type: 'string' }
            }
          }
        },
        lowestMeanRegret: { type: 'string' },
        lowestVariance: { type: 'string' },
        profileComparison: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              profile: { type: 'string' }
            }
          }
        },
        minimaxVsMeanComparison: {
          type: 'object',
          properties: {
            minimaxChoice: { type: 'string' },
            meanOptimalChoice: { type: 'string' },
            differ: { type: 'boolean' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['regret', 'distribution', 'statistics']
}));

export const criteriaComparisonTask = defineTask('criteria-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Decision Criteria Comparison',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in decision criteria and comparative analysis',
      task: 'Compare minimax regret with other decision criteria',
      context: {
        payoffConstruction: args.payoffConstruction,
        regretMatrix: args.regretMatrix,
        minimaxSelection: args.minimaxSelection
      },
      instructions: [
        '1. Apply maximin (Wald) criterion',
        '2. Apply maximax (optimistic) criterion',
        '3. Apply Laplace (equal probability) criterion',
        '4. Apply Hurwicz criterion with varying alpha',
        '5. Compare recommendations across criteria',
        '6. Identify consensus choices',
        '7. Identify criteria-dependent choices',
        '8. Assess criteria appropriateness for context',
        '9. Document comparison findings',
        '10. Provide comparative recommendation'
      ],
      outputFormat: 'JSON object with criteria comparison'
    },
    outputSchema: {
      type: 'object',
      required: ['criteriaResults', 'consensus'],
      properties: {
        criteriaResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              optimalChoice: { type: 'string' },
              value: { type: 'number' }
            }
          }
        },
        consensus: {
          type: 'object',
          properties: {
            exists: { type: 'boolean' },
            consensusChoice: { type: 'string' },
            agreeingCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        hurwiczAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alpha: { type: 'number' },
              optimalChoice: { type: 'string' }
            }
          }
        },
        criteriaSensitivity: {
          type: 'string',
          enum: ['low', 'moderate', 'high']
        },
        appropriateness: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              appropriate: { type: 'boolean' },
              reason: { type: 'string' }
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
  labels: ['regret', 'criteria', 'comparison']
}));

export const regretRobustnessTask = defineTask('regret-robustness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Regret Robustness Analysis',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in sensitivity and robustness analysis',
      task: 'Analyze robustness of minimax regret selection',
      context: {
        regretMatrix: args.regretMatrix,
        minimaxSelection: args.minimaxSelection,
        payoffConstruction: args.payoffConstruction
      },
      instructions: [
        '1. Assess sensitivity to payoff estimates',
        '2. Identify payoff changes that alter selection',
        '3. Compute stability region for minimax choice',
        '4. Assess sensitivity to scenario set',
        '5. Test with added/removed scenarios',
        '6. Compute regret-based robustness measure',
        '7. Identify fragile aspects of selection',
        '8. Assess practical robustness',
        '9. Document robustness findings',
        '10. Provide robustness assessment'
      ],
      outputFormat: 'JSON object with robustness analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['robustnessScore', 'sensitivities'],
      properties: {
        robustnessScore: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        sensitivities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              sensitivity: { type: 'string', enum: ['high', 'medium', 'low'] },
              switchingValue: { type: 'number' }
            }
          }
        },
        stabilityRegion: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            margins: { type: 'object' }
          }
        },
        scenarioSensitivity: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioChange: { type: 'string' },
              newChoice: { type: 'string' },
              changesSelection: { type: 'boolean' }
            }
          }
        },
        fragileAspects: {
          type: 'array',
          items: { type: 'string' }
        },
        robustnessAssessment: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['regret', 'robustness', 'sensitivity']
}));

export const regretRecommendationTask = defineTask('regret-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Minimax Regret Recommendation',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in decision advisory and synthesis',
      task: 'Synthesize minimax regret analysis into recommendation',
      context: {
        minimaxSelection: args.minimaxSelection,
        regretDistribution: args.regretDistribution,
        criteriaComparison: args.criteriaComparison,
        robustnessAnalysis: args.robustnessAnalysis,
        domain: args.domain
      },
      instructions: [
        '1. Synthesize findings from all analyses',
        '2. Formulate primary recommendation',
        '3. Assess recommendation confidence',
        '4. Document key trade-offs',
        '5. Provide contingent recommendations',
        '6. Highlight scenarios of concern',
        '7. Compare with other criteria recommendations',
        '8. Suggest hedging if appropriate',
        '9. Document reasoning',
        '10. Create executive summary'
      ],
      outputFormat: 'JSON object with recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedAlternative', 'confidence', 'recommendations'],
      properties: {
        recommendedAlternative: { type: 'string' },
        confidence: {
          type: 'string',
          enum: ['high', 'moderate', 'low']
        },
        rationale: { type: 'string' },
        keyTradeOffs: {
          type: 'array',
          items: { type: 'string' }
        },
        scenariosOfConcern: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              regret: { type: 'number' },
              mitigation: { type: 'string' }
            }
          }
        },
        criteriaAgreement: {
          type: 'object',
          properties: {
            agreement: { type: 'boolean' },
            disagreements: { type: 'array', items: { type: 'string' } }
          }
        },
        hedgingStrategy: { type: 'string' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        executiveSummary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['regret', 'recommendation', 'synthesis']
}));
