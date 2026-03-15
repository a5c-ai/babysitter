/**
 * @process specializations/domains/science/scientific-discovery/robust-worst-case-reasoning
 * @description Robust Worst-Case Reasoning Process - Choose actions performing acceptably
 * under worst-case conditions using maximin, robust optimization, and adversarial analysis.
 * @inputs { domain: string, alternatives: object[], uncertainties: object[], performanceMatrix?: object, acceptabilityThreshold?: number }
 * @outputs { success: boolean, robustChoice: object, worstCaseAnalysis: object, recommendations: object[] }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/robust-worst-case-reasoning', {
 *   domain: 'Infrastructure Planning',
 *   alternatives: [{ name: 'design_A' }, { name: 'design_B' }],
 *   uncertainties: [{ name: 'earthquake_magnitude', range: [5, 9] }],
 *   acceptabilityThreshold: 0.8
 * });
 *
 * @references
 * - Wald (1945). Statistical Decision Functions
 * - Ben-Tal, El Ghaoui, Nemirovski (2009). Robust Optimization
 * - Bertsimas & Sim (2004). The Price of Robustness
 * - Sniedovich (2012). Black Swans, New Nostradamuses, and the Art of Risk Management
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain,
    alternatives,
    uncertainties,
    performanceMatrix = null,
    acceptabilityThreshold = 0.7
  } = inputs;

  // Phase 1: Problem Structuring
  const problemStructuring = await ctx.task(robustProblemStructuringTask, {
    domain,
    alternatives,
    uncertainties,
    acceptabilityThreshold
  });

  // Phase 2: Uncertainty Characterization
  const uncertaintyCharacterization = await ctx.task(uncertaintyCharacterizationTask, {
    uncertainties,
    domain
  });

  // Phase 3: Performance Evaluation
  const performanceEvaluation = await ctx.task(performanceEvaluationTask, {
    alternatives,
    uncertaintyCharacterization,
    performanceMatrix,
    domain
  });

  // Phase 4: Worst-Case Identification
  const worstCaseIdentification = await ctx.task(worstCaseIdentificationTask, {
    performanceEvaluation,
    uncertaintyCharacterization,
    alternatives
  });

  // Phase 5: Maximin Analysis
  const maximinAnalysis = await ctx.task(maximinAnalysisTask, {
    worstCaseIdentification,
    alternatives,
    acceptabilityThreshold
  });

  // Breakpoint: Review worst-case scenarios
  await ctx.breakpoint({
    question: `Worst-case analysis complete. Maximin choice: ${maximinAnalysis.maximinChoice}. Review scenarios?`,
    title: 'Worst-Case Review',
    context: {
      runId: ctx.runId,
      domain,
      maximinChoice: maximinAnalysis.maximinChoice,
      worstPerformance: maximinAnalysis.maximinValue
    }
  });

  // Phase 6: Robust Optimization
  const robustOptimization = await ctx.task(robustOptimizationTask, {
    performanceEvaluation,
    uncertaintyCharacterization,
    alternatives
  });

  // Phase 7: Adversarial Analysis
  const adversarialAnalysis = await ctx.task(adversarialAnalysisTask, {
    alternatives,
    uncertaintyCharacterization,
    performanceEvaluation
  });

  // Phase 8: Acceptability Analysis
  const acceptabilityAnalysis = await ctx.task(acceptabilityAnalysisTask, {
    performanceEvaluation,
    worstCaseIdentification,
    acceptabilityThreshold
  });

  // Phase 9: Robustness Metrics
  const robustnessMetrics = await ctx.task(robustnessMetricsTask, {
    performanceEvaluation,
    worstCaseIdentification,
    maximinAnalysis,
    robustOptimization
  });

  // Phase 10: Recommendation Synthesis
  const recommendation = await ctx.task(robustRecommendationTask, {
    maximinAnalysis,
    robustOptimization,
    adversarialAnalysis,
    acceptabilityAnalysis,
    robustnessMetrics,
    domain
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Robust analysis complete. Recommended: ${recommendation.recommendedAlternative}. Robustness: ${robustnessMetrics.overallRobustness}. Accept?`,
    title: 'Final Robust Analysis Review',
    context: {
      runId: ctx.runId,
      domain,
      files: [
        { path: 'artifacts/worst-case.json', format: 'json', content: worstCaseIdentification },
        { path: 'artifacts/recommendation.json', format: 'json', content: recommendation }
      ]
    }
  });

  return {
    success: true,
    domain,
    robustChoice: {
      alternative: recommendation.recommendedAlternative,
      maximinValue: maximinAnalysis.maximinValue,
      robustnessScore: robustnessMetrics.overallRobustness
    },
    worstCaseAnalysis: {
      scenarios: worstCaseIdentification.worstCases,
      maximinChoice: maximinAnalysis.maximinChoice,
      adversarial: adversarialAnalysis
    },
    acceptability: acceptabilityAnalysis,
    robustnessMetrics: robustnessMetrics,
    recommendations: recommendation.recommendations,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/robust-worst-case-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const robustProblemStructuringTask = defineTask('robust-problem-structuring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Robust Problem Structuring - ${args.domain}`,
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'robust-decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in robust decision making and worst-case analysis',
      task: 'Structure the robust decision problem',
      context: {
        domain: args.domain,
        alternatives: args.alternatives,
        uncertainties: args.uncertainties,
        acceptabilityThreshold: args.acceptabilityThreshold
      },
      instructions: [
        '1. Clarify decision context and objectives',
        '2. Enumerate alternatives and their characteristics',
        '3. Identify key uncertainties and their nature',
        '4. Define performance metric(s)',
        '5. Establish acceptability threshold',
        '6. Identify stakeholders and their risk attitudes',
        '7. Determine uncertainty set characterization',
        '8. Define worst-case semantics',
        '9. Document problem assumptions',
        '10. Structure for robust analysis'
      ],
      outputFormat: 'JSON object with structured problem'
    },
    outputSchema: {
      type: 'object',
      required: ['alternatives', 'uncertainties', 'performanceMetric'],
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
        uncertainties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['parametric', 'scenario', 'distributional'] }
            }
          }
        },
        performanceMetric: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            direction: { type: 'string', enum: ['maximize', 'minimize'] },
            scale: { type: 'string' }
          }
        },
        acceptabilityThreshold: { type: 'number' },
        riskAttitude: { type: 'string' },
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
  labels: ['robust', 'worst-case', 'structuring']
}));

export const uncertaintyCharacterizationTask = defineTask('uncertainty-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Uncertainty Characterization',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'robust-decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in uncertainty modeling and robust optimization',
      task: 'Characterize uncertainties for worst-case analysis',
      context: {
        uncertainties: args.uncertainties,
        domain: args.domain
      },
      instructions: [
        '1. Identify uncertainty types (interval, ellipsoidal, polyhedral)',
        '2. Define uncertainty sets for each uncertain parameter',
        '3. Assess uncertainty bounds',
        '4. Consider correlation between uncertainties',
        '5. Define scenario space if scenario-based',
        '6. Assess knowledge vs ignorance',
        '7. Consider adversarial vs stochastic interpretation',
        '8. Define budget of uncertainty (Bertsimas-Sim)',
        '9. Characterize extreme scenarios',
        '10. Document uncertainty model'
      ],
      outputFormat: 'JSON object with uncertainty characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['uncertaintySets', 'scenarios'],
      properties: {
        uncertaintySets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              setType: { type: 'string', enum: ['interval', 'ellipsoidal', 'polyhedral', 'discrete'] },
              bounds: { type: 'object' },
              nominal: { type: 'any' }
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
              parameterValues: { type: 'object' },
              plausibility: { type: 'string' }
            }
          }
        },
        correlations: {
          type: 'array',
          items: { type: 'object' }
        },
        budgetOfUncertainty: { type: 'number' },
        extremeScenarios: {
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
  labels: ['robust', 'uncertainty', 'modeling']
}));

export const performanceEvaluationTask = defineTask('performance-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Performance Evaluation Under Uncertainty',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'robust-decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in performance analysis under uncertainty',
      task: 'Evaluate alternative performance across uncertainty scenarios',
      context: {
        alternatives: args.alternatives,
        uncertaintyCharacterization: args.uncertaintyCharacterization,
        performanceMatrix: args.performanceMatrix,
        domain: args.domain
      },
      instructions: [
        '1. Compute/assess performance for each alternative-scenario pair',
        '2. Build performance matrix (alternatives x scenarios)',
        '3. Identify best and worst performance per alternative',
        '4. Compute performance range for each alternative',
        '5. Assess performance sensitivity to uncertainties',
        '6. Identify scenarios where each alternative excels/fails',
        '7. Compute performance statistics',
        '8. Handle missing performance data',
        '9. Document performance model',
        '10. Validate performance assessments'
      ],
      outputFormat: 'JSON object with performance evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['performanceMatrix', 'performanceRanges'],
      properties: {
        performanceMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              scenario: { type: 'string' },
              performance: { type: 'number' }
            }
          }
        },
        performanceRanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              minimum: { type: 'number' },
              maximum: { type: 'number' },
              range: { type: 'number' }
            }
          }
        },
        bestPerScenario: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              bestAlternative: { type: 'string' },
              performance: { type: 'number' }
            }
          }
        },
        sensitivityToUncertainty: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              sensitivity: { type: 'number' }
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
  labels: ['robust', 'performance', 'evaluation']
}));

export const worstCaseIdentificationTask = defineTask('worst-case-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Worst-Case Scenario Identification',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'robust-decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in worst-case analysis and scenario identification',
      task: 'Identify worst-case scenarios for each alternative',
      context: {
        performanceEvaluation: args.performanceEvaluation,
        uncertaintyCharacterization: args.uncertaintyCharacterization,
        alternatives: args.alternatives
      },
      instructions: [
        '1. Find worst-case scenario for each alternative',
        '2. Compute worst-case performance values',
        '3. Identify common worst-case scenarios',
        '4. Assess worst-case plausibility',
        '5. Identify catastrophic scenarios',
        '6. Rank alternatives by worst-case',
        '7. Identify vulnerability patterns',
        '8. Assess worst-case gap from nominal',
        '9. Document worst-case findings',
        '10. Characterize failure modes'
      ],
      outputFormat: 'JSON object with worst-case identification'
    },
    outputSchema: {
      type: 'object',
      required: ['worstCases', 'worstCaseRanking'],
      properties: {
        worstCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              worstScenario: { type: 'string' },
              worstPerformance: { type: 'number' },
              failureMode: { type: 'string' }
            }
          }
        },
        worstCaseRanking: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              alternative: { type: 'string' },
              worstPerformance: { type: 'number' }
            }
          }
        },
        commonWorstScenarios: {
          type: 'array',
          items: { type: 'string' }
        },
        catastrophicScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              affectedAlternatives: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string' }
            }
          }
        },
        vulnerabilityPatterns: {
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
  labels: ['robust', 'worst-case', 'scenarios']
}));

export const maximinAnalysisTask = defineTask('maximin-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Maximin Analysis',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'robust-decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in maximin decision criteria and Wald criterion',
      task: 'Apply maximin criterion to select robust alternative',
      context: {
        worstCaseIdentification: args.worstCaseIdentification,
        alternatives: args.alternatives,
        acceptabilityThreshold: args.acceptabilityThreshold
      },
      instructions: [
        '1. Apply maximin criterion (maximize minimum performance)',
        '2. Identify maximin-optimal alternative',
        '3. Compute maximin value (guaranteed worst-case)',
        '4. Compare maximin to acceptability threshold',
        '5. Identify ties in maximin analysis',
        '6. Apply lexicographic maximin if ties exist',
        '7. Assess conservatism of maximin choice',
        '8. Compare with other criteria (Laplace, Hurwicz)',
        '9. Document maximin reasoning',
        '10. Provide maximin recommendation'
      ],
      outputFormat: 'JSON object with maximin analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['maximinChoice', 'maximinValue'],
      properties: {
        maximinChoice: { type: 'string' },
        maximinValue: { type: 'number' },
        maximinRanking: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              minimumPerformance: { type: 'number' },
              rank: { type: 'number' }
            }
          }
        },
        meetsThreshold: { type: 'boolean' },
        ties: {
          type: 'array',
          items: { type: 'string' }
        },
        lexicographicResolution: { type: 'string' },
        alternativeCriteria: {
          type: 'object',
          properties: {
            laplace: { type: 'string' },
            hurwicz: { type: 'string' },
            optimismCoeff: { type: 'number' }
          }
        },
        conservatismAssessment: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robust', 'maximin', 'wald']
}));

export const robustOptimizationTask = defineTask('robust-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Robust Optimization',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'robust-decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in robust optimization theory',
      task: 'Apply robust optimization approaches',
      context: {
        performanceEvaluation: args.performanceEvaluation,
        uncertaintyCharacterization: args.uncertaintyCharacterization,
        alternatives: args.alternatives
      },
      instructions: [
        '1. Formulate robust counterpart problem',
        '2. Apply Ben-Tal / El Ghaoui robust optimization',
        '3. Consider adjustable robustness',
        '4. Apply Bertsimas-Sim budget approach',
        '5. Compute price of robustness',
        '6. Find robust-optimal solution',
        '7. Compare robust vs nominal optimal',
        '8. Assess trade-off curve',
        '9. Document robust optimization',
        '10. Provide robust solution'
      ],
      outputFormat: 'JSON object with robust optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['robustSolution', 'priceOfRobustness'],
      properties: {
        robustSolution: {
          type: 'object',
          properties: {
            alternative: { type: 'string' },
            guaranteedPerformance: { type: 'number' },
            nominalPerformance: { type: 'number' }
          }
        },
        priceOfRobustness: {
          type: 'number',
          description: 'Percentage loss in nominal performance for robustness'
        },
        robustOptimalValue: { type: 'number' },
        budgetAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              budget: { type: 'number' },
              guaranteedPerformance: { type: 'number' },
              priceOfRobustness: { type: 'number' }
            }
          }
        },
        tradeOffCurve: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              robustnessLevel: { type: 'number' },
              performance: { type: 'number' }
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
  labels: ['robust', 'optimization', 'counterpart']
}));

export const adversarialAnalysisTask = defineTask('adversarial-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Adversarial Analysis',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'robust-decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in adversarial reasoning and game theory',
      task: 'Analyze decisions from adversarial perspective',
      context: {
        alternatives: args.alternatives,
        uncertaintyCharacterization: args.uncertaintyCharacterization,
        performanceEvaluation: args.performanceEvaluation
      },
      instructions: [
        '1. Model uncertainty as adversarial agent',
        '2. Find adversarys best response to each alternative',
        '3. Compute game-theoretic equilibrium if applicable',
        '4. Identify exploitable weaknesses',
        '5. Assess strategic vulnerability',
        '6. Model multi-stage adversarial interaction',
        '7. Identify robust strategies against adversary',
        '8. Assess surprise potential',
        '9. Document adversarial insights',
        '10. Recommend adversarial-robust choice'
      ],
      outputFormat: 'JSON object with adversarial analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['adversarialResponses', 'strategicVulnerability'],
      properties: {
        adversarialResponses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              adversaryBestResponse: { type: 'string' },
              resultingPerformance: { type: 'number' }
            }
          }
        },
        strategicVulnerability: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              vulnerabilityScore: { type: 'number' },
              exploitableWeaknesses: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        equilibrium: {
          type: 'object',
          properties: {
            exists: { type: 'boolean' },
            strategy: { type: 'string' },
            value: { type: 'number' }
          }
        },
        robustStrategy: { type: 'string' },
        surprisePotential: {
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
  labels: ['robust', 'adversarial', 'game-theory']
}));

export const acceptabilityAnalysisTask = defineTask('acceptability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Acceptability Analysis',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'robust-decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in decision acceptability and threshold analysis',
      task: 'Analyze which alternatives meet acceptability criteria',
      context: {
        performanceEvaluation: args.performanceEvaluation,
        worstCaseIdentification: args.worstCaseIdentification,
        acceptabilityThreshold: args.acceptabilityThreshold
      },
      instructions: [
        '1. Identify acceptable alternatives (worst-case >= threshold)',
        '2. Compute margin above/below threshold',
        '3. Assess robustness of acceptability',
        '4. Identify conditionally acceptable alternatives',
        '5. Compute acceptability probability if stochastic',
        '6. Rank by acceptability margin',
        '7. Identify scenarios causing unacceptability',
        '8. Assess threshold sensitivity',
        '9. Document acceptability analysis',
        '10. Provide acceptability recommendation'
      ],
      outputFormat: 'JSON object with acceptability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['acceptableAlternatives', 'acceptabilityMargins'],
      properties: {
        acceptableAlternatives: {
          type: 'array',
          items: { type: 'string' }
        },
        unacceptableAlternatives: {
          type: 'array',
          items: { type: 'string' }
        },
        acceptabilityMargins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              margin: { type: 'number' },
              acceptable: { type: 'boolean' }
            }
          }
        },
        conditionallyAcceptable: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              condition: { type: 'string' }
            }
          }
        },
        unacceptabilityScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              scenarios: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        thresholdSensitivity: {
          type: 'object',
          properties: {
            critical: { type: 'boolean' },
            sensitiveRange: { type: 'object' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['robust', 'acceptability', 'threshold']
}));

export const robustnessMetricsTask = defineTask('robustness-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Robustness Metrics Computation',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'robust-decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in robustness measurement and metrics',
      task: 'Compute comprehensive robustness metrics',
      context: {
        performanceEvaluation: args.performanceEvaluation,
        worstCaseIdentification: args.worstCaseIdentification,
        maximinAnalysis: args.maximinAnalysis,
        robustOptimization: args.robustOptimization
      },
      instructions: [
        '1. Compute radius of stability for each alternative',
        '2. Calculate info-gap robustness measure',
        '3. Compute regret-based robustness',
        '4. Calculate performance variance as robustness',
        '5. Compute robustness to specific failures',
        '6. Create composite robustness score',
        '7. Rank alternatives by robustness',
        '8. Identify most robust alternative',
        '9. Assess robustness-performance trade-off',
        '10. Document robustness assessment'
      ],
      outputFormat: 'JSON object with robustness metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['overallRobustness', 'robustnessRanking'],
      properties: {
        robustnessMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              radiusOfStability: { type: 'number' },
              infoGapRobustness: { type: 'number' },
              performanceVariance: { type: 'number' },
              worstCaseGap: { type: 'number' },
              compositeScore: { type: 'number' }
            }
          }
        },
        robustnessRanking: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              alternative: { type: 'string' },
              compositeScore: { type: 'number' }
            }
          }
        },
        overallRobustness: { type: 'number' },
        mostRobust: { type: 'string' },
        robustnessPerformanceTradeOff: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternative: { type: 'string' },
              robustness: { type: 'number' },
              nominalPerformance: { type: 'number' }
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
  labels: ['robust', 'metrics', 'measurement']
}));

export const robustRecommendationTask = defineTask('robust-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Robust Decision Recommendation',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'robust-decision-analyst',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in robust decision making and advisory',
      task: 'Synthesize robust analysis into recommendation',
      context: {
        maximinAnalysis: args.maximinAnalysis,
        robustOptimization: args.robustOptimization,
        adversarialAnalysis: args.adversarialAnalysis,
        acceptabilityAnalysis: args.acceptabilityAnalysis,
        robustnessMetrics: args.robustnessMetrics,
        domain: args.domain
      },
      instructions: [
        '1. Synthesize findings from all analyses',
        '2. Identify recommended robust alternative',
        '3. Assess recommendation confidence',
        '4. Document trade-offs accepted',
        '5. Identify monitoring needs',
        '6. Provide contingent recommendations',
        '7. Highlight remaining vulnerabilities',
        '8. Suggest hedging strategies',
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
        acceptedTradeOffs: {
          type: 'array',
          items: { type: 'string' }
        },
        remainingVulnerabilities: {
          type: 'array',
          items: { type: 'string' }
        },
        hedgingStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strategy: { type: 'string' },
              addressesVulnerability: { type: 'string' }
            }
          }
        },
        monitoringRecommendations: {
          type: 'array',
          items: { type: 'string' }
        },
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
  labels: ['robust', 'recommendation', 'synthesis']
}));
