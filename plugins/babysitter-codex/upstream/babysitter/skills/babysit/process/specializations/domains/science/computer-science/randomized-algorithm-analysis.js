/**
 * @process computer-science/randomized-algorithm-analysis
 * @description Design and analyze algorithms using randomization for efficiency or simplicity with probability analysis
 * @inputs { algorithmDescription: string, randomizationType: string, performanceGoals: object }
 * @outputs { success: boolean, algorithmSpecification: object, probabilityAnalysis: object, expectedComplexity: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    algorithmDescription,
    randomizationType = 'auto',
    performanceGoals = {},
    requireDerandomization = false,
    outputDir = 'randomized-algorithm-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Randomized Algorithm Analysis');

  // ============================================================================
  // PHASE 1: ALGORITHM TYPE CLASSIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Classifying randomized algorithm type');
  const typeClassification = await ctx.task(algorithmTypeClassificationTask, {
    algorithmDescription,
    randomizationType,
    outputDir
  });

  artifacts.push(...typeClassification.artifacts);

  // ============================================================================
  // PHASE 2: EXPECTED RUNNING TIME ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing expected running time');
  const expectedTimeAnalysis = await ctx.task(expectedRunningTimeAnalysisTask, {
    algorithmDescription,
    typeClassification,
    outputDir
  });

  artifacts.push(...expectedTimeAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: ERROR PROBABILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Bounding error probability');
  const errorProbabilityAnalysis = await ctx.task(errorProbabilityAnalysisTask, {
    algorithmDescription,
    typeClassification,
    outputDir
  });

  artifacts.push(...errorProbabilityAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: PROBABILISTIC BOUNDS APPLICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Applying Chernoff bounds and concentration inequalities');
  const probabilisticBounds = await ctx.task(probabilisticBoundsTask, {
    algorithmDescription,
    typeClassification,
    expectedTimeAnalysis,
    errorProbabilityAnalysis,
    outputDir
  });

  artifacts.push(...probabilisticBounds.artifacts);

  // ============================================================================
  // PHASE 5: CONFIDENCE INTERVAL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Computing complexity bounds with confidence intervals');
  const confidenceIntervals = await ctx.task(confidenceIntervalAnalysisTask, {
    algorithmDescription,
    expectedTimeAnalysis,
    probabilisticBounds,
    outputDir
  });

  artifacts.push(...confidenceIntervals.artifacts);

  // ============================================================================
  // PHASE 6: RANDOM NUMBER GENERATION REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 6: Specifying random number generation requirements');
  const rngRequirements = await ctx.task(rngRequirementsTask, {
    algorithmDescription,
    typeClassification,
    outputDir
  });

  artifacts.push(...rngRequirements.artifacts);

  // ============================================================================
  // PHASE 7: DERANDOMIZATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing derandomization strategies');
  const derandomization = await ctx.task(derandomizationAnalysisTask, {
    algorithmDescription,
    typeClassification,
    requireDerandomization,
    outputDir
  });

  artifacts.push(...derandomization.artifacts);

  // ============================================================================
  // PHASE 8: ALGORITHM SPECIFICATION DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating complete algorithm specification');
  const algorithmSpecification = await ctx.task(algorithmSpecificationTask, {
    algorithmDescription,
    typeClassification,
    expectedTimeAnalysis,
    errorProbabilityAnalysis,
    probabilisticBounds,
    confidenceIntervals,
    rngRequirements,
    derandomization,
    outputDir
  });

  artifacts.push(...algorithmSpecification.artifacts);

  // Breakpoint: Review randomized algorithm analysis
  await ctx.breakpoint({
    question: `Randomized algorithm analysis complete. Type: ${typeClassification.algorithmType}. Expected time: ${expectedTimeAnalysis.expectedComplexity}. Review analysis?`,
    title: 'Randomized Algorithm Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        algorithmType: typeClassification.algorithmType,
        expectedComplexity: expectedTimeAnalysis.expectedComplexity,
        errorProbability: errorProbabilityAnalysis.errorBound,
        derandomizable: derandomization.derandomizable
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    algorithmDescription,
    algorithmSpecification: {
      algorithmType: typeClassification.algorithmType,
      description: algorithmSpecification.description,
      pseudocode: algorithmSpecification.pseudocode,
      documentPath: algorithmSpecification.documentPath
    },
    probabilityAnalysis: {
      errorProbability: errorProbabilityAnalysis.errorBound,
      successProbability: errorProbabilityAnalysis.successProbability,
      boundsUsed: probabilisticBounds.boundsApplied,
      derivation: probabilisticBounds.derivation
    },
    expectedComplexity: {
      expectedTime: expectedTimeAnalysis.expectedComplexity,
      worstCaseTime: expectedTimeAnalysis.worstCaseComplexity,
      highProbabilityBound: confidenceIntervals.highProbabilityBound,
      confidenceLevel: confidenceIntervals.confidenceLevel
    },
    rngRequirements: {
      randomBitsNeeded: rngRequirements.randomBitsNeeded,
      distributionType: rngRequirements.distributionType,
      seedingRequirements: rngRequirements.seedingRequirements
    },
    derandomization: {
      derandomizable: derandomization.derandomizable,
      technique: derandomization.technique,
      derandomizedComplexity: derandomization.derandomizedComplexity
    },
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/randomized-algorithm-analysis',
      timestamp: startTime,
      randomizationType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Algorithm Type Classification
export const algorithmTypeClassificationTask = defineTask('algorithm-type-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classify randomized algorithm type',
  agent: {
    name: 'randomized-algorithms-expert',
    skills: ['probabilistic-analysis-toolkit', 'recurrence-solver'],
    prompt: {
      role: 'randomized algorithms specialist',
      task: 'Classify the randomized algorithm type and characterize its randomization',
      context: args,
      instructions: [
        'Determine if algorithm is Las Vegas or Monte Carlo',
        'Las Vegas: always correct, expected polynomial time',
        'Monte Carlo: bounded error probability, worst-case polynomial time',
        'Identify one-sided vs two-sided error for Monte Carlo',
        'Characterize where randomization is used in algorithm',
        'Identify random choices and their probability distributions',
        'Classify randomization purpose (simplicity, efficiency, impossibility breaking)',
        'Generate classification report'
      ],
      outputFormat: 'JSON with algorithmType, errorType, randomizationPoints, distributions, purpose, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithmType', 'artifacts'],
      properties: {
        algorithmType: { type: 'string', enum: ['las-vegas', 'monte-carlo-one-sided', 'monte-carlo-two-sided'] },
        errorType: { type: 'string', enum: ['none', 'false-positive', 'false-negative', 'both'] },
        randomizationPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              purpose: { type: 'string' },
              distribution: { type: 'string' }
            }
          }
        },
        distributions: { type: 'array', items: { type: 'string' } },
        purpose: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'randomized-algorithm', 'classification']
}));

// Task 2: Expected Running Time Analysis
export const expectedRunningTimeAnalysisTask = defineTask('expected-running-time-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze expected running time',
  agent: {
    name: 'randomized-algorithms-expert',
    skills: ['probabilistic-analysis-toolkit', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'probabilistic analysis specialist',
      task: 'Analyze expected running time of the randomized algorithm',
      context: args,
      instructions: [
        'Define random variables for running time components',
        'Compute expected value of running time E[T(n)]',
        'Use linearity of expectation where applicable',
        'Handle indicator random variables for counting',
        'Compute variance if needed for concentration bounds',
        'Compare expected time to worst-case deterministic algorithms',
        'Document derivation step by step',
        'Generate expected time analysis report'
      ],
      outputFormat: 'JSON with expectedComplexity, worstCaseComplexity, derivation, randomVariables, varianceAnalysis, comparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['expectedComplexity', 'derivation', 'artifacts'],
      properties: {
        expectedComplexity: { type: 'string' },
        worstCaseComplexity: { type: 'string' },
        derivation: { type: 'string' },
        randomVariables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              description: { type: 'string' },
              expectation: { type: 'string' }
            }
          }
        },
        varianceAnalysis: {
          type: 'object',
          properties: {
            variance: { type: 'string' },
            standardDeviation: { type: 'string' }
          }
        },
        comparison: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'randomized-algorithm', 'expected-time']
}));

// Task 3: Error Probability Analysis
export const errorProbabilityAnalysisTask = defineTask('error-probability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Bound error probability',
  agent: {
    name: 'randomized-algorithms-expert',
    skills: ['probabilistic-analysis-toolkit'],
    prompt: {
      role: 'probability theory specialist',
      task: 'Analyze and bound error probability for Monte Carlo algorithms',
      context: args,
      instructions: [
        'Identify error events in the algorithm',
        'Compute probability of each error event',
        'Apply union bound for multiple error sources',
        'Derive overall error probability bound',
        'Compute success probability = 1 - error probability',
        'Analyze probability amplification through repetition',
        'Document error analysis completely',
        'Generate error probability report'
      ],
      outputFormat: 'JSON with errorEvents, errorBound, successProbability, unionBoundApplication, amplificationAnalysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['errorBound', 'successProbability', 'artifacts'],
      properties: {
        errorEvents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event: { type: 'string' },
              probability: { type: 'string' }
            }
          }
        },
        errorBound: { type: 'string' },
        successProbability: { type: 'string' },
        unionBoundApplication: { type: 'string' },
        amplificationAnalysis: {
          type: 'object',
          properties: {
            repetitions: { type: 'string' },
            improvedErrorBound: { type: 'string' },
            costOfAmplification: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'randomized-algorithm', 'error-probability']
}));

// Task 4: Probabilistic Bounds Application
export const probabilisticBoundsTask = defineTask('probabilistic-bounds', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply Chernoff bounds and concentration inequalities',
  agent: {
    name: 'randomized-algorithms-expert',
    skills: ['probabilistic-analysis-toolkit', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'probabilistic methods specialist',
      task: 'Apply concentration inequalities to bound algorithm behavior',
      context: args,
      instructions: [
        'Identify opportunities for Markov inequality',
        'Apply Chebyshev inequality where variance is known',
        'Use Chernoff bounds for sums of independent random variables',
        'Apply Hoeffding bounds for bounded random variables',
        'Consider McDiarmid inequality for functions with bounded differences',
        'Derive tail probability bounds',
        'Document which bounds apply and why',
        'Generate concentration bounds analysis'
      ],
      outputFormat: 'JSON with boundsApplied, tailProbabilities, derivation, conditions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['boundsApplied', 'derivation', 'artifacts'],
      properties: {
        boundsApplied: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bound: { type: 'string', enum: ['markov', 'chebyshev', 'chernoff', 'hoeffding', 'mcdiarmid', 'azuma'] },
              application: { type: 'string' },
              result: { type: 'string' }
            }
          }
        },
        tailProbabilities: {
          type: 'object',
          properties: {
            upperTail: { type: 'string' },
            lowerTail: { type: 'string' }
          }
        },
        derivation: { type: 'string' },
        conditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'randomized-algorithm', 'concentration-bounds']
}));

// Task 5: Confidence Interval Analysis
export const confidenceIntervalAnalysisTask = defineTask('confidence-interval-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute complexity bounds with confidence intervals',
  agent: {
    name: 'randomized-algorithms-expert',
    skills: ['probabilistic-analysis-toolkit'],
    prompt: {
      role: 'statistical analysis specialist',
      task: 'Derive high-probability complexity bounds with confidence intervals',
      context: args,
      instructions: [
        'Define confidence level (typically 1 - 1/n or 1 - 1/poly(n))',
        'Derive high-probability upper bound on running time',
        'Express bound as "with probability at least p, T(n) <= f(n)"',
        'Compute bounds for various confidence levels',
        'Compare high-probability bound to expected value',
        'Document how confidence level affects bound',
        'Generate confidence interval report'
      ],
      outputFormat: 'JSON with highProbabilityBound, confidenceLevel, confidenceIntervals, expectedVsHighProbability, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['highProbabilityBound', 'confidenceLevel', 'artifacts'],
      properties: {
        highProbabilityBound: { type: 'string' },
        confidenceLevel: { type: 'string' },
        confidenceIntervals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              probability: { type: 'string' },
              bound: { type: 'string' }
            }
          }
        },
        expectedVsHighProbability: { type: 'string' },
        interpretation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'randomized-algorithm', 'confidence-intervals']
}));

// Task 6: RNG Requirements
export const rngRequirementsTask = defineTask('rng-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify random number generation requirements',
  agent: {
    name: 'randomized-algorithms-expert',
    skills: ['probabilistic-analysis-toolkit'],
    prompt: {
      role: 'randomness and cryptography specialist',
      task: 'Specify random number generation requirements for the algorithm',
      context: args,
      instructions: [
        'Count total random bits needed',
        'Specify required probability distributions',
        'Determine if true randomness is needed or pseudorandomness suffices',
        'Specify seeding requirements for reproducibility',
        'Consider cryptographic vs non-cryptographic RNG needs',
        'Document any assumptions about randomness quality',
        'Note practical RNG recommendations',
        'Generate RNG requirements specification'
      ],
      outputFormat: 'JSON with randomBitsNeeded, distributionType, trueRandomnessRequired, seedingRequirements, rngRecommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['randomBitsNeeded', 'distributionType', 'artifacts'],
      properties: {
        randomBitsNeeded: { type: 'string' },
        distributionType: { type: 'array', items: { type: 'string' } },
        trueRandomnessRequired: { type: 'boolean' },
        pseudorandomSuffices: { type: 'boolean' },
        seedingRequirements: { type: 'string' },
        cryptographicRngNeeded: { type: 'boolean' },
        rngRecommendations: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'randomized-algorithm', 'rng']
}));

// Task 7: Derandomization Analysis
export const derandomizationAnalysisTask = defineTask('derandomization-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design derandomization strategies',
  agent: {
    name: 'randomized-algorithms-expert',
    skills: ['probabilistic-analysis-toolkit', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'derandomization specialist',
      task: 'Analyze derandomization strategies for the randomized algorithm',
      context: args,
      instructions: [
        'Determine if algorithm can be derandomized',
        'Consider method of conditional expectations',
        'Evaluate pairwise independence applicability',
        'Consider k-wise independence for stronger results',
        'Analyze use of pseudorandom generators',
        'Evaluate expander-based derandomization',
        'Compare complexity of derandomized version',
        'Document derandomization approach if feasible'
      ],
      outputFormat: 'JSON with derandomizable, technique, derandomizedComplexity, complexityOverhead, pseudorandomApproach, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['derandomizable', 'artifacts'],
      properties: {
        derandomizable: { type: 'boolean' },
        technique: { type: 'string', enum: ['conditional-expectations', 'pairwise-independence', 'k-wise-independence', 'prg', 'expanders', 'not-applicable'] },
        derandomizedComplexity: { type: 'string' },
        complexityOverhead: { type: 'string' },
        pseudorandomApproach: { type: 'string' },
        feasibilityAnalysis: { type: 'string' },
        tradeoffs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'randomized-algorithm', 'derandomization']
}));

// Task 8: Algorithm Specification
export const algorithmSpecificationTask = defineTask('algorithm-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate complete algorithm specification',
  agent: {
    name: 'randomized-algorithms-expert',
    skills: ['latex-proof-formatter', 'probabilistic-analysis-toolkit'],
    prompt: {
      role: 'technical documentation specialist',
      task: 'Create comprehensive randomized algorithm specification document',
      context: args,
      instructions: [
        'Write executive summary of algorithm and analysis',
        'Document algorithm type and classification',
        'Include complete pseudocode',
        'Present expected running time analysis',
        'Document error probability bounds',
        'Include concentration bound derivations',
        'Specify RNG requirements',
        'Document derandomization options if available',
        'Format as professional technical specification'
      ],
      outputFormat: 'JSON with description, pseudocode, documentPath, keySummary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['description', 'pseudocode', 'documentPath', 'artifacts'],
      properties: {
        description: { type: 'string' },
        pseudocode: { type: 'string' },
        documentPath: { type: 'string' },
        keySummary: {
          type: 'object',
          properties: {
            algorithmType: { type: 'string' },
            expectedTime: { type: 'string' },
            errorBound: { type: 'string' },
            highProbabilityBound: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'randomized-algorithm', 'specification']
}));
