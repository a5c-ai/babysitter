/**
 * @process specializations/domains/science/scientific-discovery/decision-theoretic-reasoning
 * @description Decision-Theoretic Reasoning Process - Combine beliefs (probabilities) with
 * utilities (preferences) to choose actions that maximize expected utility under uncertainty.
 * @inputs { domain: string, decision: object, alternatives: object[], uncertainties?: object[], preferences?: object }
 * @outputs { success: boolean, optimalAction: object, expectedUtilities: object[], analysis: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/decision-theoretic-reasoning', {
 *   domain: 'Medical Treatment',
 *   decision: { description: 'Choose treatment for patient with condition X' },
 *   alternatives: [{ name: 'surgery' }, { name: 'medication' }, { name: 'watchful_waiting' }],
 *   uncertainties: [{ name: 'treatment_response', states: ['positive', 'neutral', 'negative'] }]
 * });
 *
 * @references
 * - von Neumann & Morgenstern (1944). Theory of Games and Economic Behavior
 * - Savage (1954). The Foundations of Statistics
 * - Jeffrey (1983). The Logic of Decision
 * - Peterson (2017). An Introduction to Decision Theory
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain,
    decision,
    alternatives,
    uncertainties = [],
    preferences = {}
  } = inputs;

  // Phase 1: Decision Problem Structuring
  const problemStructuring = await ctx.task(problemStructuringTask, {
    domain,
    decision,
    alternatives,
    uncertainties
  });

  // Phase 2: State Space Definition
  const stateSpace = await ctx.task(stateSpaceDefinitionTask, {
    problemStructuring,
    uncertainties,
    domain
  });

  // Phase 3: Probability Assessment
  const probabilityAssessment = await ctx.task(probabilityAssessmentTask, {
    stateSpace,
    uncertainties,
    domain
  });

  // Phase 4: Utility Assessment
  const utilityAssessment = await ctx.task(utilityAssessmentTask, {
    alternatives,
    stateSpace,
    preferences,
    domain
  });

  // Quality Gate: Utilities must be specified
  if (!utilityAssessment.utilities || Object.keys(utilityAssessment.utilities).length === 0) {
    return {
      success: false,
      error: 'Failed to assess utilities for outcomes',
      phase: 'utility-assessment',
      optimalAction: null
    };
  }

  // Phase 5: Expected Utility Calculation
  const expectedUtility = await ctx.task(expectedUtilityCalculationTask, {
    alternatives,
    stateSpace,
    probabilityAssessment,
    utilityAssessment
  });

  // Phase 6: Dominance Analysis
  const dominanceAnalysis = await ctx.task(dominanceAnalysisTask, {
    alternatives,
    expectedUtility,
    utilityAssessment
  });

  // Phase 7: Sensitivity Analysis
  const sensitivityAnalysis = await ctx.task(decisionSensitivityTask, {
    expectedUtility,
    probabilityAssessment,
    utilityAssessment,
    alternatives
  });

  // Breakpoint: Review expected utilities
  await ctx.breakpoint({
    question: `Decision analysis complete. Top choice: ${expectedUtility.optimalAction} with EU=${expectedUtility.maxEU.toFixed(3)}. Review sensitivity analysis?`,
    title: 'Decision Analysis Review',
    context: {
      runId: ctx.runId,
      domain,
      alternatives: expectedUtility.ranking.slice(0, 3)
    }
  });

  // Phase 8: Information Value Analysis
  const informationValue = await ctx.task(informationValueTask, {
    expectedUtility,
    stateSpace,
    probabilityAssessment,
    domain
  });

  // Phase 9: Risk Analysis
  const riskAnalysis = await ctx.task(riskAnalysisTask, {
    alternatives,
    expectedUtility,
    utilityAssessment,
    stateSpace
  });

  // Phase 10: Decision Recommendation
  const recommendation = await ctx.task(decisionRecommendationTask, {
    expectedUtility,
    dominanceAnalysis,
    sensitivityAnalysis,
    informationValue,
    riskAnalysis,
    domain
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Recommendation: ${recommendation.recommendedAction}. Confidence: ${recommendation.confidence}. Accept recommendation?`,
    title: 'Final Decision Review',
    context: {
      runId: ctx.runId,
      domain,
      files: [
        { path: 'artifacts/decision-analysis.json', format: 'json', content: expectedUtility },
        { path: 'artifacts/recommendation.json', format: 'json', content: recommendation }
      ]
    }
  });

  return {
    success: true,
    domain,
    decision: problemStructuring.formalDecision,
    optimalAction: {
      action: expectedUtility.optimalAction,
      expectedUtility: expectedUtility.maxEU,
      rank: 1
    },
    expectedUtilities: expectedUtility.ranking,
    analysis: {
      probabilities: probabilityAssessment,
      utilities: utilityAssessment,
      dominance: dominanceAnalysis,
      sensitivity: sensitivityAnalysis,
      informationValue: informationValue,
      risk: riskAnalysis
    },
    recommendation: recommendation,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/decision-theoretic-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const problemStructuringTask = defineTask('problem-structuring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Decision Problem Structuring - ${args.domain}`,
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'formal-logic-reasoner', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in decision analysis and problem structuring',
      task: 'Structure the decision problem formally',
      context: {
        domain: args.domain,
        decision: args.decision,
        alternatives: args.alternatives,
        uncertainties: args.uncertainties
      },
      instructions: [
        '1. Clarify the decision to be made',
        '2. Identify the decision maker and stakeholders',
        '3. Define decision objectives and values',
        '4. Enumerate all alternatives (actions/options)',
        '5. Identify key uncertainties affecting outcomes',
        '6. Define time frame and decision context',
        '7. Identify constraints on alternatives',
        '8. Check for missing alternatives',
        '9. Frame problem as decision tree or influence diagram',
        '10. Document problem structure'
      ],
      outputFormat: 'JSON object with structured decision problem'
    },
    outputSchema: {
      type: 'object',
      required: ['formalDecision', 'alternatives', 'uncertainties'],
      properties: {
        formalDecision: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            decisionMaker: { type: 'string' },
            objectives: { type: 'array', items: { type: 'string' } },
            timeFrame: { type: 'string' }
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
        uncertainties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              nature: { type: 'string', enum: ['aleatory', 'epistemic', 'mixed'] }
            }
          }
        },
        constraints: {
          type: 'array',
          items: { type: 'string' }
        },
        frameworkType: {
          type: 'string',
          enum: ['decision-tree', 'influence-diagram', 'decision-matrix']
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-theory', 'structuring', 'framing']
}));

export const stateSpaceDefinitionTask = defineTask('state-space-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'State Space Definition',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'formal-logic-reasoner', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in probability theory and state space modeling',
      task: 'Define the state space of uncertain outcomes',
      context: {
        problemStructuring: args.problemStructuring,
        uncertainties: args.uncertainties,
        domain: args.domain
      },
      instructions: [
        '1. Define states for each uncertainty',
        '2. Ensure states are mutually exclusive',
        '3. Ensure states are collectively exhaustive',
        '4. Create joint state space if multiple uncertainties',
        '5. Identify state dependencies',
        '6. Define outcomes for each action-state combination',
        '7. Assess state observability',
        '8. Consider state temporal dynamics',
        '9. Document state space structure',
        '10. Validate state space completeness'
      ],
      outputFormat: 'JSON object with state space definition'
    },
    outputSchema: {
      type: 'object',
      required: ['states', 'jointStates'],
      properties: {
        states: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              uncertainty: { type: 'string' },
              states: { type: 'array', items: { type: 'string' } },
              exclusive: { type: 'boolean' },
              exhaustive: { type: 'boolean' }
            }
          }
        },
        jointStates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              combination: { type: 'object' },
              description: { type: 'string' }
            }
          }
        },
        outcomes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              state: { type: 'string' },
              outcome: { type: 'string' }
            }
          }
        },
        stateDependencies: {
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
  labels: ['decision-theory', 'state-space', 'probability']
}));

export const probabilityAssessmentTask = defineTask('probability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Probability Assessment',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'formal-logic-reasoner', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in probability elicitation and Bayesian analysis',
      task: 'Assess probabilities for uncertain states',
      context: {
        stateSpace: args.stateSpace,
        uncertainties: args.uncertainties,
        domain: args.domain
      },
      instructions: [
        '1. Assess prior probabilities for each state',
        '2. Use appropriate elicitation methods',
        '3. Consider base rates and reference classes',
        '4. Account for available evidence',
        '5. Assess conditional probabilities if needed',
        '6. Check probability coherence (sum to 1)',
        '7. Document probability sources and confidence',
        '8. Consider probability ranges for uncertainty',
        '9. Identify most uncertain probabilities',
        '10. Validate probability assessments'
      ],
      outputFormat: 'JSON object with probability assessments'
    },
    outputSchema: {
      type: 'object',
      required: ['probabilities', 'coherent'],
      properties: {
        probabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              state: { type: 'string' },
              probability: { type: 'number' },
              source: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              range: {
                type: 'object',
                properties: {
                  low: { type: 'number' },
                  high: { type: 'number' }
                }
              }
            }
          }
        },
        conditionalProbabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event: { type: 'string' },
              givenEvent: { type: 'string' },
              probability: { type: 'number' }
            }
          }
        },
        coherent: { type: 'boolean' },
        mostUncertain: {
          type: 'array',
          items: { type: 'string' }
        },
        methodology: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-theory', 'probability', 'elicitation']
}));

export const utilityAssessmentTask = defineTask('utility-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Utility Assessment',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'formal-logic-reasoner', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in utility theory and preference elicitation',
      task: 'Assess utilities for outcomes',
      context: {
        alternatives: args.alternatives,
        stateSpace: args.stateSpace,
        preferences: args.preferences,
        domain: args.domain
      },
      instructions: [
        '1. Identify relevant attributes/criteria for evaluation',
        '2. Assess utility for each outcome (action-state pair)',
        '3. Use appropriate elicitation method (direct, lottery, etc.)',
        '4. Normalize utilities to standard scale (0-1 or 0-100)',
        '5. Check for utility function consistency',
        '6. Assess risk attitude (risk averse/neutral/seeking)',
        '7. Handle multi-attribute utility if needed',
        '8. Document utility function form',
        '9. Identify most sensitive utility assessments',
        '10. Validate utility coherence'
      ],
      outputFormat: 'JSON object with utility assessments'
    },
    outputSchema: {
      type: 'object',
      required: ['utilities', 'riskAttitude'],
      properties: {
        utilities: {
          type: 'object',
          description: 'Utility for each action-state combination'
        },
        attributes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              attribute: { type: 'string' },
              weight: { type: 'number' },
              scale: { type: 'object' }
            }
          }
        },
        riskAttitude: {
          type: 'string',
          enum: ['risk-averse', 'risk-neutral', 'risk-seeking']
        },
        utilityFunction: {
          type: 'object',
          properties: {
            form: { type: 'string' },
            parameters: { type: 'object' }
          }
        },
        elicitationMethod: { type: 'string' },
        sensitivities: {
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
  labels: ['decision-theory', 'utility', 'preferences']
}));

export const expectedUtilityCalculationTask = defineTask('expected-utility-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Expected Utility Calculation',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'formal-logic-reasoner', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in decision theory and expected utility computation',
      task: 'Calculate expected utility for each alternative',
      context: {
        alternatives: args.alternatives,
        stateSpace: args.stateSpace,
        probabilityAssessment: args.probabilityAssessment,
        utilityAssessment: args.utilityAssessment
      },
      instructions: [
        '1. For each alternative, compute EU = Sum(P(s) * U(a,s))',
        '2. List utility contribution from each state',
        '3. Rank alternatives by expected utility',
        '4. Identify the optimal action (max EU)',
        '5. Compute EU differences between alternatives',
        '6. Assess significance of EU differences',
        '7. Handle ties appropriately',
        '8. Document calculation steps',
        '9. Compute variance of utility if relevant',
        '10. Identify clear winners vs close calls'
      ],
      outputFormat: 'JSON object with expected utility calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['ranking', 'optimalAction', 'maxEU'],
      properties: {
        ranking: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              expectedUtility: { type: 'number' },
              rank: { type: 'number' },
              variance: { type: 'number' }
            }
          }
        },
        optimalAction: { type: 'string' },
        maxEU: { type: 'number' },
        euDifferences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action1: { type: 'string' },
              action2: { type: 'string' },
              difference: { type: 'number' },
              significant: { type: 'boolean' }
            }
          }
        },
        contributions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              state: { type: 'string' },
              probability: { type: 'number' },
              utility: { type: 'number' },
              contribution: { type: 'number' }
            }
          }
        },
        closeCalls: {
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
  labels: ['decision-theory', 'expected-utility', 'optimization']
}));

export const dominanceAnalysisTask = defineTask('dominance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Dominance Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'formal-logic-reasoner', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in decision analysis and dominance principles',
      task: 'Analyze dominance relationships between alternatives',
      context: {
        alternatives: args.alternatives,
        expectedUtility: args.expectedUtility,
        utilityAssessment: args.utilityAssessment
      },
      instructions: [
        '1. Check for strict dominance (better in all states)',
        '2. Check for weak dominance (at least as good, sometimes better)',
        '3. Check for stochastic dominance (better cumulative distribution)',
        '4. Identify dominated alternatives to eliminate',
        '5. Identify dominant alternatives',
        '6. Create dominance graph/ordering',
        '7. Identify Pareto-optimal set if multi-objective',
        '8. Assess dominance robustness',
        '9. Document dominance relationships',
        '10. Simplify choice set using dominance'
      ],
      outputFormat: 'JSON object with dominance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['dominanceRelations', 'dominatedActions'],
      properties: {
        dominanceRelations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dominant: { type: 'string' },
              dominated: { type: 'string' },
              type: { type: 'string', enum: ['strict', 'weak', 'stochastic'] }
            }
          }
        },
        dominatedActions: {
          type: 'array',
          items: { type: 'string' }
        },
        dominantActions: {
          type: 'array',
          items: { type: 'string' }
        },
        admissibleSet: {
          type: 'array',
          items: { type: 'string' }
        },
        dominanceGraph: { type: 'object' },
        simplifiedChoice: {
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
  labels: ['decision-theory', 'dominance', 'elimination']
}));

export const decisionSensitivityTask = defineTask('decision-sensitivity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Decision Sensitivity Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'formal-logic-reasoner', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in sensitivity analysis for decisions',
      task: 'Analyze sensitivity of optimal decision to parameter changes',
      context: {
        expectedUtility: args.expectedUtility,
        probabilityAssessment: args.probabilityAssessment,
        utilityAssessment: args.utilityAssessment,
        alternatives: args.alternatives
      },
      instructions: [
        '1. Identify parameters to vary (probabilities, utilities)',
        '2. Compute decision switching points',
        '3. Perform one-way sensitivity analysis',
        '4. Perform two-way sensitivity analysis if relevant',
        '5. Create tornado diagram data',
        '6. Identify most sensitive parameters',
        '7. Identify robust decisions (insensitive to parameters)',
        '8. Compute ranges where decision is stable',
        '9. Assess parameter uncertainty impact',
        '10. Summarize sensitivity findings'
      ],
      outputFormat: 'JSON object with sensitivity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['sensitiveParameters', 'switchingPoints'],
      properties: {
        sensitiveParameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              sensitivityIndex: { type: 'number' },
              impact: { type: 'string' }
            }
          }
        },
        switchingPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              switchValue: { type: 'number' },
              fromAction: { type: 'string' },
              toAction: { type: 'string' }
            }
          }
        },
        stableRanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              optimalAction: { type: 'string' },
              range: { type: 'object' }
            }
          }
        },
        tornadoData: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              lowEU: { type: 'number' },
              highEU: { type: 'number' },
              swing: { type: 'number' }
            }
          }
        },
        robustDecisions: {
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
  labels: ['decision-theory', 'sensitivity', 'robustness']
}));

export const informationValueTask = defineTask('information-value', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Value of Information Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'formal-logic-reasoner', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in value of information and decision optimization',
      task: 'Calculate value of additional information',
      context: {
        expectedUtility: args.expectedUtility,
        stateSpace: args.stateSpace,
        probabilityAssessment: args.probabilityAssessment,
        domain: args.domain
      },
      instructions: [
        '1. Calculate Expected Value of Perfect Information (EVPI)',
        '2. Calculate EVPI for each uncertainty individually',
        '3. Assess value of sample information (EVSI) if applicable',
        '4. Identify highest-value information to gather',
        '5. Compare information value to acquisition cost',
        '6. Assess diminishing returns from more information',
        '7. Identify when enough information exists',
        '8. Recommend information gathering strategy',
        '9. Calculate opportunity cost of waiting for info',
        '10. Summarize information value analysis'
      ],
      outputFormat: 'JSON object with information value analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['EVPI', 'partialEVPI'],
      properties: {
        EVPI: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            interpretation: { type: 'string' },
            significantGain: { type: 'boolean' }
          }
        },
        partialEVPI: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              uncertainty: { type: 'string' },
              value: { type: 'number' },
              priority: { type: 'number' }
            }
          }
        },
        EVSI: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              informationSource: { type: 'string' },
              value: { type: 'number' },
              cost: { type: 'number' },
              netValue: { type: 'number' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        sufficientInformation: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-theory', 'information-value', 'evpi']
}));

export const riskAnalysisTask = defineTask('risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Risk Analysis',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'formal-logic-reasoner', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in risk analysis and decision making under uncertainty',
      task: 'Analyze risk characteristics of alternatives',
      context: {
        alternatives: args.alternatives,
        expectedUtility: args.expectedUtility,
        utilityAssessment: args.utilityAssessment,
        stateSpace: args.stateSpace
      },
      instructions: [
        '1. Calculate risk metrics for each alternative (variance, downside risk)',
        '2. Assess worst-case outcomes for each alternative',
        '3. Assess best-case outcomes for each alternative',
        '4. Calculate probability of negative outcomes',
        '5. Identify risk-return tradeoffs',
        '6. Consider risk attitude in evaluation',
        '7. Apply alternative decision criteria (maximin, minimax regret)',
        '8. Identify risk-dominant alternatives',
        '9. Assess tail risks and black swans',
        '10. Summarize risk profile of each alternative'
      ],
      outputFormat: 'JSON object with risk analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['riskProfiles', 'alternativeCriteria'],
      properties: {
        riskProfiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              expectedUtility: { type: 'number' },
              variance: { type: 'number' },
              standardDeviation: { type: 'number' },
              worstCase: { type: 'number' },
              bestCase: { type: 'number' },
              downsideRisk: { type: 'number' },
              probabilityOfLoss: { type: 'number' }
            }
          }
        },
        alternativeCriteria: {
          type: 'object',
          properties: {
            maximin: {
              type: 'object',
              properties: {
                optimalAction: { type: 'string' },
                value: { type: 'number' }
              }
            },
            minimaxRegret: {
              type: 'object',
              properties: {
                optimalAction: { type: 'string' },
                maxRegret: { type: 'number' }
              }
            },
            hurwicz: {
              type: 'object',
              properties: {
                alpha: { type: 'number' },
                optimalAction: { type: 'string' }
              }
            }
          }
        },
        riskReturnTradeoffs: {
          type: 'array',
          items: { type: 'object' }
        },
        tailRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              scenario: { type: 'string' },
              probability: { type: 'number' },
              impact: { type: 'number' }
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
  labels: ['decision-theory', 'risk', 'uncertainty']
}));

export const decisionRecommendationTask = defineTask('decision-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Decision Recommendation',
  agent: {
    name: 'decision-theorist',
    skills: ['bayesian-inference-engine', 'formal-logic-reasoner', 'statistical-test-selector'],
    prompt: {
      role: 'Expert in decision advisory and synthesis',
      task: 'Synthesize analysis into decision recommendation',
      context: {
        expectedUtility: args.expectedUtility,
        dominanceAnalysis: args.dominanceAnalysis,
        sensitivityAnalysis: args.sensitivityAnalysis,
        informationValue: args.informationValue,
        riskAnalysis: args.riskAnalysis,
        domain: args.domain
      },
      instructions: [
        '1. Synthesize findings from all analyses',
        '2. Formulate primary recommendation',
        '3. Assess recommendation confidence',
        '4. Identify conditions for recommendation validity',
        '5. Provide contingent recommendations',
        '6. Highlight key uncertainties and risks',
        '7. Recommend information gathering if valuable',
        '8. Document reasoning chain',
        '9. Identify decision review triggers',
        '10. Provide executive summary'
      ],
      outputFormat: 'JSON object with recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedAction', 'confidence', 'rationale'],
      properties: {
        recommendedAction: { type: 'string' },
        confidence: {
          type: 'string',
          enum: ['high', 'moderate', 'low']
        },
        rationale: { type: 'string' },
        conditions: {
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
        keyUncertainties: {
          type: 'array',
          items: { type: 'string' }
        },
        informationRecommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        reviewTriggers: {
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
  labels: ['decision-theory', 'recommendation', 'synthesis']
}));
