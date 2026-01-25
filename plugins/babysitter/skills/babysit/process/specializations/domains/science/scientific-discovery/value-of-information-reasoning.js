/**
 * @process Value of Information Reasoning
 * @description Prioritize which measurements reduce uncertainty most; compute VOI before acquiring data
 * @category Scientific Discovery - Practical Reasoning
 * @inputs {{ context: object, problem: string, decisionModel: object, informationSources: array }}
 * @outputs {{ analysis: object, voiAssessments: array, informationStrategy: object, recommendations: array }}
 * @example
 * // Input: Decision under uncertainty with potential information sources
 * // Output: Prioritized information acquisition strategy maximizing value
 * @references
 * - Howard, R.A. (1966). Information value theory
 * - Raiffa, H. & Schlaifer, R. (1961). Applied Statistical Decision Theory
 * - Keisler, J.M. et al. (2014). Value of information analysis: State of the practice
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Phase 1: Decision Structure Analysis
const analyzeDecisionStructureTask = defineTask('voi-analyze-decision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Decision Structure Analysis',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'voi-analyst',
    skills: ['bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Decision analysis and uncertainty quantification specialist',
      task: 'Analyze the decision structure including alternatives, uncertainties, and outcomes',
      context: args,
      instructions: [
        'Identify the decision alternatives available',
        'Map key uncertainties affecting outcomes',
        'Define the outcome space and value function',
        'Establish current prior probability distributions',
        'Identify value drivers and sensitivity factors',
        'Document decision timeline and information windows',
        'Assess decision reversibility and stakes',
        'Model the influence diagram structure'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        decisionAlternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternativeId: { type: 'string' },
              description: { type: 'string' },
              outcomeMapping: { type: 'object' }
            }
          }
        },
        uncertaintyStructure: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              uncertaintyId: { type: 'string' },
              description: { type: 'string' },
              priorDistribution: { type: 'object' },
              impactOnOutcomes: { type: 'object' }
            }
          }
        },
        valueFunction: {
          type: 'object',
          properties: {
            outcomeMetrics: { type: 'array' },
            utilityFunction: { type: 'object' },
            riskPreferences: { type: 'object' }
          }
        },
        decisionTiming: { type: 'object' },
        confidence: { type: 'number' }
      },
      required: ['decisionAlternatives', 'uncertaintyStructure', 'valueFunction']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 2: Prior Expected Value Calculation
const calculatePriorExpectedValueTask = defineTask('voi-prior-ev', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prior Expected Value Calculation',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'voi-analyst',
    skills: ['bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Expected value computation specialist',
      task: 'Calculate the expected value of the optimal decision under current prior beliefs',
      context: args,
      instructions: [
        'Calculate expected value for each alternative under priors',
        'Identify the optimal decision under current uncertainty',
        'Compute the expected value of the optimal decision',
        'Assess sensitivity of optimal choice to prior assumptions',
        'Document the prior expected value as baseline',
        'Identify which uncertainties most affect the optimal choice',
        'Calculate expected value of perfect information (EVPI)',
        'Determine upper bound on value of any information'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        alternativeExpectedValues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternativeId: { type: 'string' },
              expectedValue: { type: 'number' },
              variance: { type: 'number' }
            }
          }
        },
        priorOptimalDecision: {
          type: 'object',
          properties: {
            optimalAlternative: { type: 'string' },
            expectedValue: { type: 'number' },
            dominanceStatus: { type: 'string' }
          }
        },
        evpi: {
          type: 'object',
          properties: {
            totalEVPI: { type: 'number' },
            partialEVPI: { type: 'object' },
            interpretation: { type: 'string' }
          }
        },
        sensitivityAnalysis: { type: 'object' },
        confidence: { type: 'number' }
      },
      required: ['alternativeExpectedValues', 'priorOptimalDecision', 'evpi']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 3: Information Source Characterization
const characterizeInformationSourcesTask = defineTask('voi-characterize-sources', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Information Source Characterization',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'voi-analyst',
    skills: ['bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Information source and reliability specialist',
      task: 'Characterize available information sources including reliability, cost, and timing',
      context: args,
      instructions: [
        'Catalog all potential information sources',
        'Assess reliability and accuracy of each source',
        'Model the likelihood function for each information source',
        'Document acquisition costs (time, money, resources)',
        'Assess availability and timing constraints',
        'Identify dependencies between information sources',
        'Model sample size and precision trade-offs',
        'Consider ethical and practical constraints'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        informationSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceId: { type: 'string' },
              description: { type: 'string' },
              targetUncertainty: { type: 'string' },
              reliabilityMetrics: { type: 'object' },
              likelihoodFunction: { type: 'object' }
            }
          }
        },
        costStructure: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceId: { type: 'string' },
              monetaryCost: { type: 'number' },
              timeCost: { type: 'string' },
              opportunityCost: { type: 'number' }
            }
          }
        },
        constraints: {
          type: 'object',
          properties: {
            timingConstraints: { type: 'array' },
            budgetConstraints: { type: 'object' },
            ethicalConstraints: { type: 'array' }
          }
        },
        confidence: { type: 'number' }
      },
      required: ['informationSources', 'costStructure', 'constraints']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 4: Posterior Analysis
const analyzePosteriorsTask = defineTask('voi-posterior-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Posterior Distribution Analysis',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'voi-analyst',
    skills: ['bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Bayesian updating and posterior analysis specialist',
      task: 'Analyze how each potential information outcome would update beliefs',
      context: args,
      instructions: [
        'Model possible outcomes from each information source',
        'Calculate posterior distributions for each outcome',
        'Determine how posteriors affect optimal decisions',
        'Identify cases where information would change the decision',
        'Calculate probability of decision change for each source',
        'Assess posterior expected values conditional on information',
        'Model information cascades and sequential learning',
        'Document Bayesian update calculations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        posteriorAnalyses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceId: { type: 'string' },
              possibleOutcomes: { type: 'array' },
              posteriorDistributions: { type: 'object' },
              decisionChangeAnalysis: { type: 'object' }
            }
          }
        },
        decisionChangeProbabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceId: { type: 'string' },
              probabilityOfChange: { type: 'number' },
              criticalOutcomes: { type: 'array' }
            }
          }
        },
        sequentialLearningPaths: { type: 'array' },
        confidence: { type: 'number' }
      },
      required: ['posteriorAnalyses', 'decisionChangeProbabilities']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 5: Expected Value of Sample Information (EVSI)
const calculateEVSITask = defineTask('voi-calculate-evsi', (args, taskCtx) => ({
  kind: 'agent',
  title: 'EVSI Calculation',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'voi-analyst',
    skills: ['bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Expected value of sample information specialist',
      task: 'Calculate the expected value of sample information for each source',
      context: args,
      instructions: [
        'Calculate preposterior expected value for each source',
        'Compute EVSI as difference from prior expected value',
        'Account for imperfect information reliability',
        'Calculate net value of information (EVSI minus cost)',
        'Assess EVSI sensitivity to reliability assumptions',
        'Compare EVSI to EVPI to gauge information quality',
        'Calculate EVSI for different sample sizes if applicable',
        'Rank sources by net VOI'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        evsiCalculations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceId: { type: 'string' },
              preposteriorExpectedValue: { type: 'number' },
              evsi: { type: 'number' },
              cost: { type: 'number' },
              netVOI: { type: 'number' },
              evsiToEvpiRatio: { type: 'number' }
            }
          }
        },
        rankings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              sourceId: { type: 'string' },
              netVOI: { type: 'number' }
            }
          }
        },
        sensitivityResults: { type: 'object' },
        confidence: { type: 'number' }
      },
      required: ['evsiCalculations', 'rankings']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 6: Sequential Information Strategy
const designSequentialStrategyTask = defineTask('voi-sequential-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Sequential Information Strategy',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'voi-analyst',
    skills: ['bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Sequential decision and information strategy specialist',
      task: 'Design optimal sequential strategy for information acquisition',
      context: args,
      instructions: [
        'Identify optimal ordering of information sources',
        'Calculate value of information sequences',
        'Design stopping rules for information acquisition',
        'Model information value decay over time',
        'Account for option value of waiting',
        'Optimize timing of information acquisition',
        'Design adaptive strategy based on outcomes',
        'Balance exploration vs exploitation in information gathering'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        sequentialStrategy: {
          type: 'object',
          properties: {
            optimalSequence: { type: 'array' },
            contingencyBranches: { type: 'array' },
            stoppingRules: { type: 'array' }
          }
        },
        timingOptimization: {
          type: 'object',
          properties: {
            optimalTiming: { type: 'object' },
            waitingOptionValue: { type: 'number' },
            urgencyAssessment: { type: 'string' }
          }
        },
        adaptivePolicy: {
          type: 'object',
          properties: {
            policyDescription: { type: 'string' },
            decisionRules: { type: 'array' },
            expectedValue: { type: 'number' }
          }
        },
        confidence: { type: 'number' }
      },
      required: ['sequentialStrategy', 'timingOptimization', 'adaptivePolicy']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 7: Portfolio Value Optimization
const optimizeInformationPortfolioTask = defineTask('voi-portfolio-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Information Portfolio Optimization',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'voi-analyst',
    skills: ['bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Information portfolio optimization specialist',
      task: 'Optimize the portfolio of information sources subject to budget constraints',
      context: args,
      instructions: [
        'Formulate information portfolio optimization problem',
        'Account for complementarities between sources',
        'Account for redundancies between sources',
        'Apply budget and timing constraints',
        'Solve for optimal information portfolio',
        'Calculate marginal VOI for additional sources',
        'Assess portfolio robustness to assumption changes',
        'Compare portfolio to single-source strategies'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        portfolioProblem: {
          type: 'object',
          properties: {
            objectiveFunction: { type: 'string' },
            constraints: { type: 'array' },
            decisionVariables: { type: 'array' }
          }
        },
        optimalPortfolio: {
          type: 'object',
          properties: {
            selectedSources: { type: 'array' },
            totalCost: { type: 'number' },
            expectedNetValue: { type: 'number' }
          }
        },
        interactionEffects: {
          type: 'object',
          properties: {
            complementarities: { type: 'array' },
            redundancies: { type: 'array' },
            synergies: { type: 'object' }
          }
        },
        marginalAnalysis: { type: 'object' },
        confidence: { type: 'number' }
      },
      required: ['portfolioProblem', 'optimalPortfolio', 'interactionEffects']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 8: Implementation Planning
const planImplementationTask = defineTask('voi-implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Information Acquisition Implementation Plan',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'voi-analyst',
    skills: ['bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Information acquisition and implementation specialist',
      task: 'Develop practical plan for implementing the information acquisition strategy',
      context: args,
      instructions: [
        'Translate optimal strategy into actionable steps',
        'Define information quality requirements',
        'Establish data collection protocols',
        'Plan analysis and interpretation procedures',
        'Set decision triggers based on information outcomes',
        'Establish timeline and milestones',
        'Plan for contingencies and deviations',
        'Design feedback and learning mechanisms'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        implementationSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              action: { type: 'string' },
              source: { type: 'string' },
              timing: { type: 'string' },
              resources: { type: 'object' }
            }
          }
        },
        qualityRequirements: {
          type: 'object',
          properties: {
            accuracyThresholds: { type: 'object' },
            sampleSizes: { type: 'object' },
            validationProcedures: { type: 'array' }
          }
        },
        decisionTriggers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              action: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        contingencyPlans: { type: 'array' },
        confidence: { type: 'number' }
      },
      required: ['implementationSteps', 'qualityRequirements', 'decisionTriggers']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 9: Synthesis and Recommendations
const synthesizeResultsTask = defineTask('voi-synthesize', (args, taskCtx) => ({
  kind: 'agent',
  title: 'VOI Analysis Synthesis',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'voi-analyst',
    skills: ['bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Value of information synthesis specialist',
      task: 'Synthesize all VOI analysis results into comprehensive conclusions and recommendations',
      context: args,
      instructions: [
        'Summarize key VOI findings and insights',
        'Highlight highest-value information opportunities',
        'Document trade-offs in information strategy',
        'Assess overall value of proposed information acquisition',
        'Compare to acting on prior beliefs alone',
        'Provide clear recommendations for action',
        'Identify areas of uncertainty in the analysis',
        'Suggest refinements for future VOI analyses'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        voiSummary: {
          type: 'object',
          properties: {
            totalEVPI: { type: 'number' },
            achievableVOI: { type: 'number' },
            voiEfficiency: { type: 'number' },
            keyInsights: { type: 'array' }
          }
        },
        strategicRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              expectedBenefit: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        },
        uncertaintyAssessment: {
          type: 'object',
          properties: {
            analysisLimitations: { type: 'array' },
            sensitiveAssumptions: { type: 'array' },
            robustnessConclusion: { type: 'string' }
          }
        },
        confidence: { type: 'number' }
      },
      required: ['voiSummary', 'strategicRecommendations', 'uncertaintyAssessment']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

/**
 * Main value of information reasoning process
 */
export async function process(inputs, ctx) {
  // Phase 1: Analyze decision structure
  const decisionAnalysis = await ctx.task(analyzeDecisionStructureTask, {
    problem: inputs.problem,
    context: inputs.context,
    decisionModel: inputs.decisionModel
  });

  // Phase 2: Calculate prior expected value
  const priorAnalysis = await ctx.task(calculatePriorExpectedValueTask, {
    decisionAnalysis,
    context: inputs.context
  });

  // Phase 3: Characterize information sources
  const sourceCharacterization = await ctx.task(characterizeInformationSourcesTask, {
    informationSources: inputs.informationSources,
    decisionAnalysis,
    context: inputs.context
  });

  // Quality gate: VOI setup review
  await ctx.breakpoint('voi-setup-review', {
    question: 'Is the decision structure and information source characterization complete and accurate?',
    context: { decisionAnalysis, priorAnalysis, sourceCharacterization }
  });

  // Phase 4: Analyze posteriors
  const posteriorAnalysis = await ctx.task(analyzePosteriorsTask, {
    decisionAnalysis,
    sourceCharacterization,
    priorAnalysis
  });

  // Phase 5: Calculate EVSI
  const evsiResults = await ctx.task(calculateEVSITask, {
    posteriorAnalysis,
    priorAnalysis,
    sourceCharacterization
  });

  // Phase 6: Design sequential strategy
  const sequentialStrategy = await ctx.task(designSequentialStrategyTask, {
    evsiResults,
    sourceCharacterization,
    decisionAnalysis
  });

  // Phase 7: Optimize portfolio
  const portfolioOptimization = await ctx.task(optimizeInformationPortfolioTask, {
    evsiResults,
    sequentialStrategy,
    sourceCharacterization
  });

  // Quality gate: Strategy review
  await ctx.breakpoint('voi-strategy-review', {
    question: 'Is the information acquisition strategy optimal and practical?',
    context: { evsiResults, sequentialStrategy, portfolioOptimization }
  });

  // Phase 8: Plan implementation
  const implementationPlan = await ctx.task(planImplementationTask, {
    portfolioOptimization,
    sequentialStrategy,
    sourceCharacterization
  });

  // Phase 9: Synthesize results
  const synthesis = await ctx.task(synthesizeResultsTask, {
    decisionAnalysis,
    priorAnalysis,
    evsiResults,
    portfolioOptimization,
    implementationPlan
  });

  return {
    success: true,
    reasoningType: 'Value of Information Reasoning',
    analysis: {
      decisionAnalysis,
      priorAnalysis,
      sourceCharacterization,
      posteriorAnalysis,
      evsiResults
    },
    voiAssessments: evsiResults.evsiCalculations,
    informationStrategy: {
      sequentialStrategy,
      portfolioOptimization,
      implementationPlan
    },
    conclusions: [
      `Total EVPI: ${priorAnalysis.evpi.totalEVPI}`,
      `Achievable VOI: ${synthesis.voiSummary.achievableVOI}`,
      `VOI efficiency: ${(synthesis.voiSummary.voiEfficiency * 100).toFixed(1)}%`,
      `Top-ranked source: ${evsiResults.rankings[0]?.sourceId || 'N/A'}`
    ],
    recommendations: synthesis.strategicRecommendations,
    confidence: synthesis.confidence
  };
}
