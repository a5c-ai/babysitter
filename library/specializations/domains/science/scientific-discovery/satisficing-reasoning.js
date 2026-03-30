/**
 * @process Satisficing Reasoning
 * @description Seek "good enough" solutions given resource limits; accept thresholds rather than optimal
 * @category Scientific Discovery - Practical Reasoning
 * @inputs {{ context: object, problem: string, constraints: object, thresholds: object }}
 * @outputs {{ analysis: object, satisficingSolution: object, acceptabilityAssessment: object, recommendations: array }}
 * @example
 * // Input: Decision problem with resource constraints and acceptability thresholds
 * // Output: Good enough solution meeting minimum requirements within constraints
 * @references
 * - Simon, H.A. (1956). Rational choice and the structure of the environment
 * - Gigerenzer, G. & Selten, R. (2002). Bounded Rationality: The Adaptive Toolbox
 * - Schwartz, B. (2004). The Paradox of Choice
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Phase 1: Resource and Constraint Analysis
const analyzeResourceConstraintsTask = defineTask('satisficing-analyze-constraints', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Resource and Constraint Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'satisficing-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Bounded rationality and resource analysis specialist',
      task: 'Analyze the available resources, time constraints, and cognitive limitations affecting the decision',
      context: args,
      instructions: [
        'Identify all available resources (time, money, information, cognitive capacity)',
        'Document hard constraints that cannot be violated',
        'Assess opportunity costs of extended search',
        'Estimate marginal value of additional search effort',
        'Identify diminishing returns thresholds',
        'Catalog information availability and acquisition costs',
        'Assess decision urgency and time pressure',
        'Document environmental uncertainty and volatility'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        resourceInventory: {
          type: 'object',
          properties: {
            timeAvailable: { type: 'object' },
            budgetConstraints: { type: 'object' },
            informationAccess: { type: 'object' },
            cognitiveCapacity: { type: 'object' }
          }
        },
        constraintAnalysis: {
          type: 'object',
          properties: {
            hardConstraints: { type: 'array' },
            softConstraints: { type: 'array' },
            tradeoffSpace: { type: 'object' }
          }
        },
        searchCostAnalysis: {
          type: 'object',
          properties: {
            marginalSearchCost: { type: 'number' },
            expectedMarginalBenefit: { type: 'number' },
            optimalStoppingPoint: { type: 'object' }
          }
        },
        confidence: { type: 'number' }
      },
      required: ['resourceInventory', 'constraintAnalysis', 'searchCostAnalysis']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 2: Aspiration Level Setting
const setAspirationLevelsTask = defineTask('satisficing-set-aspirations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Aspiration Level Setting',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'satisficing-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Aspiration level and threshold specialist',
      task: 'Establish appropriate aspiration levels and acceptability thresholds for each criterion',
      context: args,
      instructions: [
        'Identify all relevant decision criteria and objectives',
        'Set minimum acceptable thresholds for each criterion',
        'Define "good enough" standards based on context',
        'Calibrate aspirations to environmental possibilities',
        'Account for reference points and anchoring effects',
        'Consider adaptive aspiration adjustment mechanisms',
        'Establish priority ordering among criteria',
        'Define deal-breakers and must-have requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        criteriaIdentification: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              importance: { type: 'string' },
              measurementMethod: { type: 'string' }
            }
          }
        },
        aspirationLevels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              minimumThreshold: { type: 'number' },
              goodEnoughLevel: { type: 'number' },
              idealLevel: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        },
        priorityStructure: {
          type: 'object',
          properties: {
            mustHaveRequirements: { type: 'array' },
            niceToHaveFeatures: { type: 'array' },
            lexicographicOrdering: { type: 'array' }
          }
        },
        adaptationRules: { type: 'object' },
        confidence: { type: 'number' }
      },
      required: ['criteriaIdentification', 'aspirationLevels', 'priorityStructure']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 3: Sequential Search Strategy
const designSearchStrategyTask = defineTask('satisficing-search-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Sequential Search Strategy Design',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'satisficing-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Search strategy and stopping rule specialist',
      task: 'Design an efficient sequential search strategy with appropriate stopping rules',
      context: args,
      instructions: [
        'Define the search space and alternative generation method',
        'Establish search order (random, structured, opportunistic)',
        'Design screening heuristics for quick elimination',
        'Specify evaluation depth for promising alternatives',
        'Set stopping rules based on aspiration levels',
        'Incorporate time-based stopping conditions',
        'Plan for aspiration level adjustment during search',
        'Design early termination conditions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        searchSpaceDefinition: {
          type: 'object',
          properties: {
            boundaries: { type: 'object' },
            generationMethod: { type: 'string' },
            estimatedSize: { type: 'number' }
          }
        },
        searchProtocol: {
          type: 'object',
          properties: {
            searchOrder: { type: 'string' },
            samplingStrategy: { type: 'string' },
            evaluationDepth: { type: 'object' }
          }
        },
        stoppingRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ruleType: { type: 'string' },
              condition: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        adaptationMechanisms: { type: 'object' },
        confidence: { type: 'number' }
      },
      required: ['searchSpaceDefinition', 'searchProtocol', 'stoppingRules']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 4: Alternative Generation and Screening
const generateAndScreenAlternativesTask = defineTask('satisficing-generate-screen', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Alternative Generation and Screening',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'satisficing-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Alternative generation and screening specialist',
      task: 'Generate alternatives and apply fast screening heuristics to identify promising candidates',
      context: args,
      instructions: [
        'Generate alternatives according to search strategy',
        'Apply take-the-best and elimination heuristics',
        'Screen against must-have requirements first',
        'Eliminate alternatives failing minimum thresholds',
        'Identify alternatives meeting aspiration levels',
        'Track search progress and resource consumption',
        'Document rejected alternatives and reasons',
        'Flag near-miss alternatives for potential reconsideration'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        generatedAlternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternativeId: { type: 'string' },
              description: { type: 'string' },
              quickAssessment: { type: 'object' }
            }
          }
        },
        screeningResults: {
          type: 'object',
          properties: {
            passed: { type: 'array' },
            eliminated: { type: 'array' },
            nearMisses: { type: 'array' }
          }
        },
        searchProgress: {
          type: 'object',
          properties: {
            alternativesExamined: { type: 'number' },
            resourcesConsumed: { type: 'object' },
            stoppingConditionStatus: { type: 'object' }
          }
        },
        confidence: { type: 'number' }
      },
      required: ['generatedAlternatives', 'screeningResults', 'searchProgress']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 5: Satisficing Evaluation
const evaluateSatisficingTask = defineTask('satisficing-evaluate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Satisficing Evaluation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'satisficing-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Satisficing evaluation and acceptability specialist',
      task: 'Evaluate promising alternatives against aspiration levels to identify satisficing solutions',
      context: args,
      instructions: [
        'Evaluate each promising alternative against all criteria',
        'Compare performance to aspiration levels',
        'Determine which alternatives satisfy all minimum requirements',
        'Identify first alternative meeting good enough thresholds',
        'Assess robustness of satisficing determination',
        'Consider whether to continue search or stop',
        'Document margin above minimum thresholds',
        'Evaluate trade-offs among satisficing alternatives'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        alternativeEvaluations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternativeId: { type: 'string' },
              criteriaScores: { type: 'object' },
              meetsMinimum: { type: 'boolean' },
              meetsGoodEnough: { type: 'boolean' },
              marginAboveThreshold: { type: 'object' }
            }
          }
        },
        satisficingCandidates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternativeId: { type: 'string' },
              overallAcceptability: { type: 'string' },
              strengths: { type: 'array' },
              weaknesses: { type: 'array' }
            }
          }
        },
        stoppingDecision: {
          type: 'object',
          properties: {
            shouldStop: { type: 'boolean' },
            rationale: { type: 'string' },
            aspirationAdjustment: { type: 'object' }
          }
        },
        confidence: { type: 'number' }
      },
      required: ['alternativeEvaluations', 'satisficingCandidates', 'stoppingDecision']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 6: Aspiration Adaptation
const adaptAspirationsTask = defineTask('satisficing-adapt-aspirations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Aspiration Level Adaptation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'satisficing-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Adaptive aspiration and expectation adjustment specialist',
      task: 'Adjust aspiration levels based on search experience and environmental feedback',
      context: args,
      instructions: [
        'Analyze distribution of alternatives encountered',
        'Compare aspiration levels to market/environmental realities',
        'Determine if aspirations are too high (nothing satisfices)',
        'Determine if aspirations are too low (too easy to satisfy)',
        'Calculate appropriate aspiration adjustments',
        'Implement gradual adaptation rather than sudden changes',
        'Maintain some aspiration stickiness for stability',
        'Balance adaptation with commitment to standards'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        searchFeedback: {
          type: 'object',
          properties: {
            alternativeQualityDistribution: { type: 'object' },
            gapToAspirations: { type: 'object' },
            trendAnalysis: { type: 'object' }
          }
        },
        aspirationDiagnosis: {
          type: 'object',
          properties: {
            calibrationStatus: { type: 'string' },
            problematicCriteria: { type: 'array' },
            adjustmentDirection: { type: 'string' }
          }
        },
        recommendedAdjustments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              currentLevel: { type: 'number' },
              adjustedLevel: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        },
        confidence: { type: 'number' }
      },
      required: ['searchFeedback', 'aspirationDiagnosis', 'recommendedAdjustments']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 7: Satisficing vs Optimizing Comparison
const compareSatisficingOptimizingTask = defineTask('satisficing-compare-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Satisficing vs Optimizing Comparison',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'satisficing-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Decision strategy comparison specialist',
      task: 'Compare satisficing approach to optimization and assess appropriateness for this context',
      context: args,
      instructions: [
        'Estimate cost of continued search toward optimum',
        'Assess value at risk from settling for satisficing solution',
        'Evaluate regret potential for satisficing choice',
        'Consider decision reversibility and correction costs',
        'Assess psychological and resource costs of maximizing',
        'Evaluate environmental stability and decision shelf-life',
        'Compare expected outcomes under each strategy',
        'Recommend appropriate strategy for context'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        strategyComparison: {
          type: 'object',
          properties: {
            satisficingEstimate: {
              type: 'object',
              properties: {
                expectedOutcome: { type: 'number' },
                searchCost: { type: 'number' },
                timeToDecision: { type: 'string' }
              }
            },
            optimizingEstimate: {
              type: 'object',
              properties: {
                expectedOutcome: { type: 'number' },
                searchCost: { type: 'number' },
                timeToDecision: { type: 'string' }
              }
            }
          }
        },
        contextualFactors: {
          type: 'object',
          properties: {
            decisionImportance: { type: 'string' },
            reversibility: { type: 'string' },
            environmentalStability: { type: 'string' },
            resourceAvailability: { type: 'string' }
          }
        },
        strategyRecommendation: {
          type: 'object',
          properties: {
            recommendedStrategy: { type: 'string' },
            rationale: { type: 'string' },
            confidenceLevel: { type: 'number' }
          }
        },
        confidence: { type: 'number' }
      },
      required: ['strategyComparison', 'contextualFactors', 'strategyRecommendation']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 8: Solution Selection and Commitment
const selectSolutionTask = defineTask('satisficing-select-solution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Satisficing Solution Selection',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'satisficing-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Decision selection and commitment specialist',
      task: 'Select the satisficing solution and establish commitment to the choice',
      context: args,
      instructions: [
        'Review all satisficing candidates identified',
        'Apply any tie-breaking criteria if multiple candidates',
        'Make final selection based on stopping rule',
        'Document rationale for selection',
        'Establish commitment mechanisms to prevent regret-driven reversal',
        'Plan implementation steps',
        'Set conditions for revisiting decision if needed',
        'Design monitoring for solution adequacy'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        selectedSolution: {
          type: 'object',
          properties: {
            alternativeId: { type: 'string' },
            description: { type: 'string' },
            keyFeatures: { type: 'array' },
            performanceSummary: { type: 'object' }
          }
        },
        selectionRationale: {
          type: 'object',
          properties: {
            whyThisAlternative: { type: 'string' },
            tieBreakingCriteria: { type: 'string' },
            stoppingRuleTriggered: { type: 'string' }
          }
        },
        commitmentPlan: {
          type: 'object',
          properties: {
            implementationSteps: { type: 'array' },
            regretMitigationStrategies: { type: 'array' },
            revisionConditions: { type: 'array' }
          }
        },
        confidence: { type: 'number' }
      },
      required: ['selectedSolution', 'selectionRationale', 'commitmentPlan']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// Phase 9: Synthesis and Recommendations
const synthesizeResultsTask = defineTask('satisficing-synthesize', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Satisficing Analysis Synthesis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'satisficing-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Satisficing reasoning synthesis specialist',
      task: 'Synthesize all satisficing reasoning results into comprehensive conclusions',
      context: args,
      instructions: [
        'Summarize the satisficing process and outcomes',
        'Highlight key trade-offs accepted in the solution',
        'Document resource savings from satisficing approach',
        'Assess solution quality relative to aspirations',
        'Identify potential regret sources and mitigations',
        'Provide actionable recommendations',
        'Suggest when to revisit the decision',
        'Document lessons learned for future satisficing'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        satisficingOutcome: {
          type: 'object',
          properties: {
            finalSolution: { type: 'object' },
            acceptedTradeoffs: { type: 'array' },
            resourceSavings: { type: 'object' }
          }
        },
        qualityAssessment: {
          type: 'object',
          properties: {
            solutionAdequacy: { type: 'string' },
            marginOfSafety: { type: 'object' },
            potentialRegrets: { type: 'array' }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        lessonsLearned: { type: 'array' },
        confidence: { type: 'number' }
      },
      required: ['satisficingOutcome', 'qualityAssessment', 'recommendations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

/**
 * Main satisficing reasoning process
 */
export async function process(inputs, ctx) {
  // Phase 1: Analyze resource constraints
  const constraintAnalysis = await ctx.task(analyzeResourceConstraintsTask, {
    problem: inputs.problem,
    context: inputs.context,
    constraints: inputs.constraints
  });

  // Phase 2: Set aspiration levels
  const aspirationLevels = await ctx.task(setAspirationLevelsTask, {
    problem: inputs.problem,
    context: inputs.context,
    thresholds: inputs.thresholds,
    constraintAnalysis
  });

  // Phase 3: Design search strategy
  const searchStrategy = await ctx.task(designSearchStrategyTask, {
    problem: inputs.problem,
    constraintAnalysis,
    aspirationLevels
  });

  // Quality gate: Search strategy review
  await ctx.breakpoint('search-strategy-review', {
    question: 'Is the sequential search strategy appropriate for finding satisficing solutions?',
    context: { searchStrategy, aspirationLevels, constraintAnalysis }
  });

  // Phase 4: Generate and screen alternatives
  const screeningResults = await ctx.task(generateAndScreenAlternativesTask, {
    problem: inputs.problem,
    searchStrategy,
    aspirationLevels
  });

  // Phase 5: Evaluate for satisficing
  const satisficingEvaluation = await ctx.task(evaluateSatisficingTask, {
    screeningResults,
    aspirationLevels,
    constraintAnalysis
  });

  // Phase 6: Adapt aspirations if needed
  let currentAspirations = aspirationLevels;
  if (!satisficingEvaluation.stoppingDecision.shouldStop) {
    const adaptedAspirations = await ctx.task(adaptAspirationsTask, {
      satisficingEvaluation,
      aspirationLevels,
      searchProgress: screeningResults.searchProgress
    });
    currentAspirations = adaptedAspirations;
  }

  // Phase 7: Compare strategies
  const strategyComparison = await ctx.task(compareSatisficingOptimizingTask, {
    satisficingEvaluation,
    constraintAnalysis,
    currentAspirations
  });

  // Quality gate: Strategy appropriateness
  await ctx.breakpoint('strategy-review', {
    question: 'Is satisficing the appropriate decision strategy for this context?',
    context: { strategyComparison, satisficingEvaluation }
  });

  // Phase 8: Select solution
  const selectedSolution = await ctx.task(selectSolutionTask, {
    satisficingEvaluation,
    strategyComparison,
    constraintAnalysis
  });

  // Phase 9: Synthesize results
  const synthesis = await ctx.task(synthesizeResultsTask, {
    constraintAnalysis,
    aspirationLevels: currentAspirations,
    satisficingEvaluation,
    selectedSolution,
    strategyComparison
  });

  return {
    success: true,
    reasoningType: 'Satisficing Reasoning',
    analysis: {
      constraintAnalysis,
      aspirationLevels: currentAspirations,
      searchStrategy,
      satisficingEvaluation,
      strategyComparison
    },
    satisficingSolution: selectedSolution,
    acceptabilityAssessment: synthesis.qualityAssessment,
    conclusions: [
      `Identified satisficing solution meeting ${satisficingEvaluation.satisficingCandidates.length} aspiration criteria`,
      `Search examined ${screeningResults.searchProgress.alternativesExamined} alternatives`,
      `Strategy recommendation: ${strategyComparison.strategyRecommendation.recommendedStrategy}`,
      `Solution adequacy: ${synthesis.qualityAssessment.solutionAdequacy}`
    ],
    recommendations: synthesis.recommendations,
    confidence: synthesis.confidence
  };
}
