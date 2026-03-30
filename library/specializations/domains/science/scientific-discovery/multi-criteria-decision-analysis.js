/**
 * @process specializations/domains/science/scientific-discovery/multi-criteria-decision-analysis
 * @description Multi-Criteria Decision Analysis (MCDA) Process - Decide with multiple
 * objectives using weighted scoring, Pareto frontiers, and value function approaches.
 * @inputs { domain: string, alternatives: object[], criteria: object[], preferences?: object, stakeholders?: string[] }
 * @outputs { success: boolean, ranking: object[], paretoFrontier: object[], analysis: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/multi-criteria-decision-analysis', {
 *   domain: 'Site Selection',
 *   alternatives: [{ name: 'Site A' }, { name: 'Site B' }, { name: 'Site C' }],
 *   criteria: [{ name: 'cost', type: 'minimize' }, { name: 'capacity', type: 'maximize' }, { name: 'accessibility', type: 'maximize' }],
 *   stakeholders: ['Finance', 'Operations', 'Community']
 * });
 *
 * @references
 * - Keeney & Raiffa (1976). Decisions with Multiple Objectives
 * - Belton & Stewart (2002). Multiple Criteria Decision Analysis
 * - Greco et al. (2016). Multiple Criteria Decision Analysis: State of the Art Surveys
 * - Saaty (1980). The Analytic Hierarchy Process
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain,
    alternatives,
    criteria,
    preferences = {},
    stakeholders = []
  } = inputs;

  // Phase 1: Problem Structuring
  const problemStructuring = await ctx.task(mcdaProblemStructuringTask, {
    domain,
    alternatives,
    criteria,
    stakeholders
  });

  // Phase 2: Criteria Weighting
  const criteriaWeighting = await ctx.task(criteriaWeightingTask, {
    criteria: problemStructuring.criteria,
    preferences,
    stakeholders,
    domain
  });

  // Phase 3: Performance Assessment
  const performanceAssessment = await ctx.task(performanceAssessmentTask, {
    alternatives: problemStructuring.alternatives,
    criteria: problemStructuring.criteria,
    domain
  });

  // Phase 4: Value Function Construction
  const valueFunctions = await ctx.task(valueFunctionConstructionTask, {
    criteria: problemStructuring.criteria,
    performanceAssessment,
    preferences
  });

  // Phase 5: Score Normalization
  const normalizedScores = await ctx.task(scoreNormalizationTask, {
    performanceAssessment,
    valueFunctions,
    criteria: problemStructuring.criteria
  });

  // Phase 6: Weighted Aggregation
  const weightedAggregation = await ctx.task(weightedAggregationTask, {
    normalizedScores,
    criteriaWeighting,
    alternatives: problemStructuring.alternatives
  });

  // Breakpoint: Review initial ranking
  await ctx.breakpoint({
    question: `Initial MCDA ranking complete. Top alternative: ${weightedAggregation.ranking[0].alternative}. Review criteria weights and scores?`,
    title: 'MCDA Ranking Review',
    context: {
      runId: ctx.runId,
      domain,
      topThree: weightedAggregation.ranking.slice(0, 3)
    }
  });

  // Phase 7: Pareto Analysis
  const paretoAnalysis = await ctx.task(paretoAnalysisTask, {
    alternatives: problemStructuring.alternatives,
    criteria: problemStructuring.criteria,
    performanceAssessment
  });

  // Phase 8: Sensitivity Analysis
  const sensitivityAnalysis = await ctx.task(mcdaSensitivityTask, {
    weightedAggregation,
    criteriaWeighting,
    normalizedScores
  });

  // Phase 9: Outranking Analysis (ELECTRE-style)
  const outrankingAnalysis = await ctx.task(outrankingAnalysisTask, {
    alternatives: problemStructuring.alternatives,
    criteria: problemStructuring.criteria,
    performanceAssessment,
    criteriaWeighting
  });

  // Phase 10: Stakeholder Analysis
  const stakeholderAnalysis = await ctx.task(stakeholderAnalysisTask, {
    weightedAggregation,
    criteriaWeighting,
    stakeholders,
    domain
  });

  // Phase 11: Recommendation Synthesis
  const recommendation = await ctx.task(mcdaRecommendationTask, {
    weightedAggregation,
    paretoAnalysis,
    sensitivityAnalysis,
    outrankingAnalysis,
    stakeholderAnalysis,
    domain
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `MCDA complete. Recommendation: ${recommendation.recommendedAlternative}. Confidence: ${recommendation.confidence}. Accept?`,
    title: 'Final MCDA Review',
    context: {
      runId: ctx.runId,
      domain,
      files: [
        { path: 'artifacts/mcda-ranking.json', format: 'json', content: weightedAggregation },
        { path: 'artifacts/pareto-analysis.json', format: 'json', content: paretoAnalysis }
      ]
    }
  });

  return {
    success: true,
    domain,
    ranking: weightedAggregation.ranking,
    paretoFrontier: paretoAnalysis.paretoFrontier,
    analysis: {
      weights: criteriaWeighting,
      scores: normalizedScores,
      pareto: paretoAnalysis,
      sensitivity: sensitivityAnalysis,
      outranking: outrankingAnalysis,
      stakeholders: stakeholderAnalysis
    },
    recommendation: recommendation,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/multi-criteria-decision-analysis',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const mcdaProblemStructuringTask = defineTask('mcda-problem-structuring', (args, taskCtx) => ({
  kind: 'agent',
  title: `MCDA Problem Structuring - ${args.domain}`,
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in multi-criteria decision analysis and problem structuring',
      task: 'Structure the multi-criteria decision problem',
      context: {
        domain: args.domain,
        alternatives: args.alternatives,
        criteria: args.criteria,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Define decision context and objectives',
        '2. Validate and refine alternatives list',
        '3. Validate and refine criteria hierarchy',
        '4. Classify criteria (benefit/cost, quantitative/qualitative)',
        '5. Identify criteria dependencies',
        '6. Define measurement scales for each criterion',
        '7. Identify stakeholders and their perspectives',
        '8. Check for redundant or conflicting criteria',
        '9. Establish criteria hierarchy if nested',
        '10. Document problem structure'
      ],
      outputFormat: 'JSON object with structured MCDA problem'
    },
    outputSchema: {
      type: 'object',
      required: ['alternatives', 'criteria'],
      properties: {
        decisionContext: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            objectives: { type: 'array', items: { type: 'string' } },
            constraints: { type: 'array', items: { type: 'string' } }
          }
        },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              feasible: { type: 'boolean' }
            }
          }
        },
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['benefit', 'cost'] },
              measurementType: { type: 'string', enum: ['quantitative', 'qualitative'] },
              scale: { type: 'object' },
              parent: { type: 'string' }
            }
          }
        },
        criteriaHierarchy: { type: 'object' },
        stakeholderMapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              priorityCriteria: { type: 'array', items: { type: 'string' } }
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
  labels: ['mcda', 'structuring', 'criteria']
}));

export const criteriaWeightingTask = defineTask('criteria-weighting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Criteria Weighting',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in weight elicitation and preference modeling',
      task: 'Determine weights for decision criteria',
      context: {
        criteria: args.criteria,
        preferences: args.preferences,
        stakeholders: args.stakeholders,
        domain: args.domain
      },
      instructions: [
        '1. Select weighting method (AHP, swing weights, trade-off, etc.)',
        '2. Elicit criteria importance from preferences',
        '3. Apply pairwise comparisons if using AHP',
        '4. Check consistency of judgments',
        '5. Normalize weights to sum to 1',
        '6. Aggregate stakeholder weights if multiple',
        '7. Document weight derivation',
        '8. Identify weight uncertainty ranges',
        '9. Validate weights with stakeholders',
        '10. Perform consistency checks'
      ],
      outputFormat: 'JSON object with criteria weights'
    },
    outputSchema: {
      type: 'object',
      required: ['weights', 'method'],
      properties: {
        weights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              weight: { type: 'number' },
              rank: { type: 'number' }
            }
          }
        },
        method: { type: 'string' },
        pairwiseMatrix: { type: 'object' },
        consistencyRatio: { type: 'number' },
        consistencyAcceptable: { type: 'boolean' },
        stakeholderWeights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              weights: { type: 'object' }
            }
          }
        },
        aggregationMethod: { type: 'string' },
        weightRanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              min: { type: 'number' },
              max: { type: 'number' }
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
  labels: ['mcda', 'weighting', 'ahp']
}));

export const performanceAssessmentTask = defineTask('performance-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Alternative Performance Assessment',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in performance measurement and evaluation',
      task: 'Assess performance of alternatives on each criterion',
      context: {
        alternatives: args.alternatives,
        criteria: args.criteria,
        domain: args.domain
      },
      instructions: [
        '1. Measure/estimate performance for each alternative-criterion pair',
        '2. Use appropriate measurement method per criterion type',
        '3. Handle missing data appropriately',
        '4. Assess uncertainty in performance estimates',
        '5. Convert qualitative assessments to scores',
        '6. Document data sources and assumptions',
        '7. Validate performance data',
        '8. Create performance matrix',
        '9. Identify best/worst performers per criterion',
        '10. Check for performance outliers'
      ],
      outputFormat: 'JSON object with performance assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['performanceMatrix'],
      properties: {
        performanceMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              criterion: { type: 'string' },
              rawScore: { type: 'any' },
              unit: { type: 'string' },
              uncertainty: { type: 'object' }
            }
          }
        },
        dataSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              source: { type: 'string' },
              reliability: { type: 'string' }
            }
          }
        },
        bestPerformers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              alternative: { type: 'string' },
              score: { type: 'any' }
            }
          }
        },
        worstPerformers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              alternative: { type: 'string' },
              score: { type: 'any' }
            }
          }
        },
        missingData: {
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
  labels: ['mcda', 'performance', 'measurement']
}));

export const valueFunctionConstructionTask = defineTask('value-function-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Value Function Construction',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in value function elicitation and utility theory',
      task: 'Construct value functions for each criterion',
      context: {
        criteria: args.criteria,
        performanceAssessment: args.performanceAssessment,
        preferences: args.preferences
      },
      instructions: [
        '1. Determine value function type for each criterion',
        '2. Define anchor points (best=1, worst=0)',
        '3. Elicit intermediate value points',
        '4. Fit appropriate functional form (linear, exponential, etc.)',
        '5. Check for diminishing/increasing marginal value',
        '6. Handle non-monotonic preferences if present',
        '7. Validate value function shapes',
        '8. Consider risk attitudes in function shape',
        '9. Document elicitation methodology',
        '10. Verify value function consistency'
      ],
      outputFormat: 'JSON object with value functions'
    },
    outputSchema: {
      type: 'object',
      required: ['valueFunctions'],
      properties: {
        valueFunctions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              functionType: { type: 'string', enum: ['linear', 'exponential', 'logarithmic', 'step', 'piecewise', 'custom'] },
              parameters: { type: 'object' },
              anchorPoints: {
                type: 'object',
                properties: {
                  worst: { type: 'any' },
                  best: { type: 'any' }
                }
              },
              intermediatePoints: { type: 'array', items: { type: 'object' } },
              marginalValue: { type: 'string', enum: ['increasing', 'constant', 'decreasing'] }
            }
          }
        },
        elicitationMethod: { type: 'string' },
        consistencyChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              passed: { type: 'boolean' }
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
  labels: ['mcda', 'value-function', 'utility']
}));

export const scoreNormalizationTask = defineTask('score-normalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score Normalization',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in score normalization and scaling',
      task: 'Normalize performance scores to common scale',
      context: {
        performanceAssessment: args.performanceAssessment,
        valueFunctions: args.valueFunctions,
        criteria: args.criteria
      },
      instructions: [
        '1. Apply value functions to convert raw scores',
        '2. Normalize to 0-1 scale',
        '3. Handle cost criteria (reverse direction)',
        '4. Apply appropriate normalization method',
        '5. Preserve relative differences appropriately',
        '6. Handle extreme values/outliers',
        '7. Document normalization transformations',
        '8. Validate normalized scores',
        '9. Check for scale compatibility',
        '10. Create normalized performance matrix'
      ],
      outputFormat: 'JSON object with normalized scores'
    },
    outputSchema: {
      type: 'object',
      required: ['normalizedMatrix'],
      properties: {
        normalizedMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              criterion: { type: 'string' },
              rawScore: { type: 'any' },
              normalizedScore: { type: 'number' }
            }
          }
        },
        normalizationMethod: { type: 'string' },
        transformations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              transformation: { type: 'string' }
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
  labels: ['mcda', 'normalization', 'scaling']
}));

export const weightedAggregationTask = defineTask('weighted-aggregation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Weighted Score Aggregation',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in multi-attribute aggregation methods',
      task: 'Aggregate weighted scores to rank alternatives',
      context: {
        normalizedScores: args.normalizedScores,
        criteriaWeighting: args.criteriaWeighting,
        alternatives: args.alternatives
      },
      instructions: [
        '1. Apply weighted sum method (WSM)',
        '2. Calculate overall score for each alternative',
        '3. Rank alternatives by overall score',
        '4. Calculate score contributions per criterion',
        '5. Identify score gaps between alternatives',
        '6. Consider alternative aggregation methods (WPM, TOPSIS)',
        '7. Compare rankings across methods',
        '8. Identify close competitions',
        '9. Document aggregation methodology',
        '10. Assess ranking robustness'
      ],
      outputFormat: 'JSON object with aggregated ranking'
    },
    outputSchema: {
      type: 'object',
      required: ['ranking'],
      properties: {
        ranking: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              overallScore: { type: 'number' },
              rank: { type: 'number' },
              criterionContributions: { type: 'object' }
            }
          }
        },
        aggregationMethod: { type: 'string' },
        scoreGaps: {
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
        alternativeRankings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              ranking: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        closeCompetitions: {
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
  labels: ['mcda', 'aggregation', 'ranking']
}));

export const paretoAnalysisTask = defineTask('pareto-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Pareto Frontier Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in Pareto optimality and multi-objective analysis',
      task: 'Identify Pareto-optimal alternatives',
      context: {
        alternatives: args.alternatives,
        criteria: args.criteria,
        performanceAssessment: args.performanceAssessment
      },
      instructions: [
        '1. Identify Pareto-dominant relationships',
        '2. Find Pareto frontier (non-dominated set)',
        '3. Identify dominated alternatives',
        '4. Calculate dominance counts',
        '5. Visualize Pareto frontier (description for 2D/3D)',
        '6. Assess frontier coverage',
        '7. Identify knee points on frontier',
        '8. Analyze trade-offs on frontier',
        '9. Compare Pareto ranking to weighted ranking',
        '10. Document Pareto analysis'
      ],
      outputFormat: 'JSON object with Pareto analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['paretoFrontier', 'dominatedAlternatives'],
      properties: {
        paretoFrontier: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              scores: { type: 'object' },
              isKneePoint: { type: 'boolean' }
            }
          }
        },
        dominatedAlternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              dominatedBy: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dominanceCounts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              dominates: { type: 'number' },
              dominatedBy: { type: 'number' }
            }
          }
        },
        tradeOffs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              tradeOff: { type: 'object' }
            }
          }
        },
        frontierDescription: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcda', 'pareto', 'multi-objective']
}));

export const mcdaSensitivityTask = defineTask('mcda-sensitivity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'MCDA Sensitivity Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in MCDA sensitivity and robustness analysis',
      task: 'Analyze sensitivity of ranking to weight changes',
      context: {
        weightedAggregation: args.weightedAggregation,
        criteriaWeighting: args.criteriaWeighting,
        normalizedScores: args.normalizedScores
      },
      instructions: [
        '1. Perform one-at-a-time weight sensitivity',
        '2. Find weight switching points',
        '3. Calculate weight stability intervals',
        '4. Assess ranking robustness',
        '5. Identify critical criteria (high sensitivity)',
        '6. Create sensitivity graphs (description)',
        '7. Analyze weight change scenarios',
        '8. Assess minimum regret weights',
        '9. Identify robust alternatives',
        '10. Document sensitivity findings'
      ],
      outputFormat: 'JSON object with sensitivity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['sensitivityResults', 'robustness'],
      properties: {
        sensitivityResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              currentWeight: { type: 'number' },
              switchingPoints: { type: 'array', items: { type: 'object' } },
              stabilityInterval: { type: 'object' },
              sensitivity: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        criticalCriteria: {
          type: 'array',
          items: { type: 'string' }
        },
        robustness: {
          type: 'object',
          properties: {
            topAlternative: { type: 'string' },
            isRobust: { type: 'boolean' },
            robustnessScore: { type: 'number' }
          }
        },
        robustAlternatives: {
          type: 'array',
          items: { type: 'string' }
        },
        scenarioAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              weightChanges: { type: 'object' },
              newRanking: { type: 'array', items: { type: 'string' } }
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
  labels: ['mcda', 'sensitivity', 'robustness']
}));

export const outrankingAnalysisTask = defineTask('outranking-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Outranking Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in outranking methods (ELECTRE, PROMETHEE)',
      task: 'Perform outranking analysis for comparison',
      context: {
        alternatives: args.alternatives,
        criteria: args.criteria,
        performanceAssessment: args.performanceAssessment,
        criteriaWeighting: args.criteriaWeighting
      },
      instructions: [
        '1. Calculate concordance indices for all pairs',
        '2. Calculate discordance indices',
        '3. Build outranking relations',
        '4. Apply ELECTRE-style thresholds',
        '5. Build outranking graph',
        '6. Identify kernel (winning alternatives)',
        '7. Compare with weighted sum ranking',
        '8. Identify incomparable alternatives',
        '9. Compute net outranking flows (PROMETHEE style)',
        '10. Synthesize outranking results'
      ],
      outputFormat: 'JSON object with outranking analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['concordanceMatrix', 'outrankingRanking'],
      properties: {
        concordanceMatrix: { type: 'object' },
        discordanceMatrix: { type: 'object' },
        outrankingRelations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              outranks: { type: 'boolean' },
              concordance: { type: 'number' },
              discordance: { type: 'number' }
            }
          }
        },
        kernel: {
          type: 'array',
          items: { type: 'string' }
        },
        outrankingRanking: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              netFlow: { type: 'number' },
              rank: { type: 'number' }
            }
          }
        },
        incomparablePairs: {
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
  labels: ['mcda', 'outranking', 'electre']
}));

export const stakeholderAnalysisTask = defineTask('stakeholder-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Stakeholder Perspective Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in stakeholder analysis and conflict resolution',
      task: 'Analyze rankings from different stakeholder perspectives',
      context: {
        weightedAggregation: args.weightedAggregation,
        criteriaWeighting: args.criteriaWeighting,
        stakeholders: args.stakeholders,
        domain: args.domain
      },
      instructions: [
        '1. Apply stakeholder-specific weights',
        '2. Generate ranking for each stakeholder',
        '3. Identify consensus alternatives',
        '4. Identify conflict areas',
        '5. Analyze stakeholder trade-offs',
        '6. Find compromise solutions',
        '7. Calculate social welfare metrics',
        '8. Identify Condorcet winners if any',
        '9. Assess stakeholder satisfaction',
        '10. Recommend negotiation strategies'
      ],
      outputFormat: 'JSON object with stakeholder analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholderRankings', 'consensus'],
      properties: {
        stakeholderRankings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              ranking: { type: 'array', items: { type: 'string' } },
              topChoice: { type: 'string' }
            }
          }
        },
        consensus: {
          type: 'object',
          properties: {
            consensusAlternatives: { type: 'array', items: { type: 'string' } },
            consensusLevel: { type: 'string', enum: ['strong', 'moderate', 'weak', 'none'] }
          }
        },
        conflicts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholders: { type: 'array', items: { type: 'string' } },
              conflict: { type: 'string' }
            }
          }
        },
        compromiseSolutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              averageSatisfaction: { type: 'number' }
            }
          }
        },
        condorcetWinner: { type: 'string' },
        negotiationStrategies: {
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
  labels: ['mcda', 'stakeholders', 'consensus']
}));

export const mcdaRecommendationTask = defineTask('mcda-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'MCDA Recommendation Synthesis',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in decision synthesis and recommendation',
      task: 'Synthesize MCDA results into recommendation',
      context: {
        weightedAggregation: args.weightedAggregation,
        paretoAnalysis: args.paretoAnalysis,
        sensitivityAnalysis: args.sensitivityAnalysis,
        outrankingAnalysis: args.outrankingAnalysis,
        stakeholderAnalysis: args.stakeholderAnalysis,
        domain: args.domain
      },
      instructions: [
        '1. Compare rankings from different methods',
        '2. Identify consistent top performers',
        '3. Formulate primary recommendation',
        '4. Assess recommendation confidence',
        '5. Document key trade-offs',
        '6. Provide contingent recommendations',
        '7. Highlight critical assumptions',
        '8. Suggest implementation considerations',
        '9. Identify decision review triggers',
        '10. Create executive summary'
      ],
      outputFormat: 'JSON object with recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedAlternative', 'confidence'],
      properties: {
        recommendedAlternative: { type: 'string' },
        confidence: {
          type: 'string',
          enum: ['high', 'moderate', 'low']
        },
        rationale: { type: 'string' },
        methodAgreement: {
          type: 'object',
          properties: {
            agreeing: { type: 'array', items: { type: 'string' } },
            disagreeing: { type: 'array', items: { type: 'string' } }
          }
        },
        keyTradeOffs: {
          type: 'array',
          items: { type: 'string' }
        },
        contingentRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        criticalAssumptions: {
          type: 'array',
          items: { type: 'string' }
        },
        implementationNotes: {
          type: 'array',
          items: { type: 'string' }
        },
        executiveSummary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcda', 'recommendation', 'synthesis']
}));
