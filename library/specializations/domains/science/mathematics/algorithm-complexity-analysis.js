/**
 * @process specializations/domains/science/mathematics/algorithm-complexity-analysis
 * @description Perform rigorous time and space complexity analysis of mathematical algorithms.
 * Includes asymptotic analysis, average-case analysis, and comparison with alternative approaches.
 * @inputs { algorithm: string, algorithmCode?: string, inputCharacteristics?: object, analysisDepth?: string }
 * @outputs { success: boolean, timeComplexity: object, spaceComplexity: object, comparisons: array, recommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/algorithm-complexity-analysis', {
 *   algorithm: 'Matrix multiplication using Strassen algorithm',
 *   algorithmCode: 'def strassen(A, B): ...',
 *   inputCharacteristics: { matrixType: 'dense', size: 'n x n' },
 *   analysisDepth: 'comprehensive'
 * });
 *
 * @references
 * - Cormen et al., Introduction to Algorithms
 * - Knuth, The Art of Computer Programming
 * - Sedgewick & Flajolet, An Introduction to the Analysis of Algorithms
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    algorithm,
    algorithmCode = '',
    inputCharacteristics = {},
    analysisDepth = 'standard'
  } = inputs;

  // Phase 1: Derive Big-O Time Complexity
  const timeComplexityAnalysis = await ctx.task(timeComplexityTask, {
    algorithm,
    algorithmCode,
    inputCharacteristics,
    analysisDepth
  });

  // Quality Gate: Time complexity must be derivable
  if (!timeComplexityAnalysis.bigO) {
    return {
      success: false,
      error: 'Unable to derive time complexity',
      phase: 'time-complexity',
      timeComplexity: null
    };
  }

  // Breakpoint: Review time complexity
  await ctx.breakpoint({
    question: `Time complexity analysis: O(${timeComplexityAnalysis.bigO}). Review derivation?`,
    title: 'Time Complexity Review',
    context: {
      runId: ctx.runId,
      algorithm,
      bigO: timeComplexityAnalysis.bigO,
      derivation: timeComplexityAnalysis.derivation
    }
  });

  // Phase 2: Analyze Space Requirements
  const spaceComplexityAnalysis = await ctx.task(spaceComplexityTask, {
    algorithm,
    algorithmCode,
    inputCharacteristics,
    timeComplexityAnalysis
  });

  // Phase 3: Compute Average-Case Complexity
  const averageCaseAnalysis = await ctx.task(averageCaseTask, {
    algorithm,
    algorithmCode,
    inputCharacteristics,
    worstCaseTime: timeComplexityAnalysis.bigO
  });

  // Phase 4: Compare with Alternative Algorithms
  const algorithmComparison = await ctx.task(algorithmComparisonTask, {
    algorithm,
    timeComplexity: timeComplexityAnalysis,
    spaceComplexity: spaceComplexityAnalysis,
    averageCase: averageCaseAnalysis,
    inputCharacteristics
  });

  // Phase 5: Identify Optimization Opportunities
  const optimizationAnalysis = await ctx.task(optimizationAnalysisTask, {
    algorithm,
    algorithmCode,
    timeComplexity: timeComplexityAnalysis,
    spaceComplexity: spaceComplexityAnalysis,
    comparisons: algorithmComparison,
    inputCharacteristics
  });

  // Final Breakpoint: Analysis Complete
  await ctx.breakpoint({
    question: `Complexity analysis complete for "${algorithm}". Review comprehensive results?`,
    title: 'Complexity Analysis Complete',
    context: {
      runId: ctx.runId,
      algorithm,
      timeComplexity: timeComplexityAnalysis.bigO,
      spaceComplexity: spaceComplexityAnalysis.bigO,
      optimizations: optimizationAnalysis.opportunities,
      files: [
        { path: `artifacts/complexity-analysis.json`, format: 'json', content: { timeComplexityAnalysis, spaceComplexityAnalysis, averageCaseAnalysis } }
      ]
    }
  });

  return {
    success: true,
    algorithm,
    timeComplexity: {
      bigO: timeComplexityAnalysis.bigO,
      bigOmega: timeComplexityAnalysis.bigOmega,
      bigTheta: timeComplexityAnalysis.bigTheta,
      tightBound: timeComplexityAnalysis.tightBound,
      derivation: timeComplexityAnalysis.derivation,
      recurrence: timeComplexityAnalysis.recurrence
    },
    spaceComplexity: {
      bigO: spaceComplexityAnalysis.bigO,
      auxiliary: spaceComplexityAnalysis.auxiliarySpace,
      total: spaceComplexityAnalysis.totalSpace,
      breakdown: spaceComplexityAnalysis.breakdown
    },
    averageCase: {
      expected: averageCaseAnalysis.expectedComplexity,
      distribution: averageCaseAnalysis.inputDistribution,
      variance: averageCaseAnalysis.variance
    },
    comparisons: algorithmComparison.alternatives,
    recommendations: optimizationAnalysis.recommendations,
    optimizationOpportunities: optimizationAnalysis.opportunities,
    metadata: {
      processId: 'specializations/domains/science/mathematics/algorithm-complexity-analysis',
      analysisDepth,
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const timeComplexityTask = defineTask('time-complexity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Derive Big-O Time Complexity`,
  agent: {
    name: 'numerical-analyst',
    skills: ['sympy-computer-algebra', 'graph-algorithm-library', 'combinatorial-enumeration'],
    prompt: {
      role: 'Algorithm Analysis Expert specializing in complexity theory',
      task: 'Derive the time complexity of the given algorithm',
      context: {
        algorithm: args.algorithm,
        algorithmCode: args.algorithmCode,
        inputCharacteristics: args.inputCharacteristics,
        analysisDepth: args.analysisDepth
      },
      instructions: [
        '1. Identify the primary input size parameter(s)',
        '2. Count primitive operations in each code block',
        '3. Analyze loop structures and their iteration counts',
        '4. Identify and solve recurrence relations if recursive',
        '5. Determine best-case time complexity (big-Omega)',
        '6. Determine worst-case time complexity (big-O)',
        '7. Determine tight bound if possible (big-Theta)',
        '8. Identify the dominant term and lower-order terms',
        '9. Consider amortized analysis if applicable',
        '10. Provide step-by-step derivation'
      ],
      outputFormat: 'JSON object with time complexity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['bigO', 'derivation'],
      properties: {
        bigO: { type: 'string', description: 'Worst-case time complexity' },
        bigOmega: { type: 'string', description: 'Best-case time complexity' },
        bigTheta: { type: 'string', description: 'Tight bound if exists' },
        tightBound: { type: 'boolean' },
        derivation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              operation: { type: 'string' },
              count: { type: 'string' },
              justification: { type: 'string' }
            }
          }
        },
        recurrence: {
          type: 'object',
          properties: {
            equation: { type: 'string' },
            solution: { type: 'string' },
            method: { type: 'string' }
          }
        },
        dominantTerm: { type: 'string' },
        lowerOrderTerms: { type: 'array', items: { type: 'string' } },
        amortizedComplexity: { type: 'string' },
        inputSizeParameters: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'complexity-analysis', 'time-complexity']
}));

export const spaceComplexityTask = defineTask('space-complexity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Analyze Space Requirements`,
  agent: {
    name: 'numerical-analyst',
    skills: ['sympy-computer-algebra', 'graph-algorithm-library'],
    prompt: {
      role: 'Algorithm Space Analysis Expert',
      task: 'Analyze the space complexity of the given algorithm',
      context: {
        algorithm: args.algorithm,
        algorithmCode: args.algorithmCode,
        inputCharacteristics: args.inputCharacteristics,
        timeComplexityAnalysis: args.timeComplexityAnalysis
      },
      instructions: [
        '1. Identify all data structures used by the algorithm',
        '2. Calculate space for input storage',
        '3. Calculate auxiliary space (additional space beyond input)',
        '4. Analyze stack space for recursive algorithms',
        '5. Consider in-place vs out-of-place operations',
        '6. Analyze temporary variables and intermediate results',
        '7. Determine worst-case space complexity',
        '8. Identify space-time tradeoffs',
        '9. Consider cache and memory hierarchy effects',
        '10. Provide breakdown of space usage by component'
      ],
      outputFormat: 'JSON object with space complexity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['bigO', 'auxiliarySpace', 'totalSpace'],
      properties: {
        bigO: { type: 'string', description: 'Space complexity' },
        auxiliarySpace: { type: 'string', description: 'Extra space beyond input' },
        totalSpace: { type: 'string', description: 'Total space including input' },
        breakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              space: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        stackSpace: { type: 'string' },
        heapSpace: { type: 'string' },
        inPlace: { type: 'boolean' },
        spaceTimeTradeoffs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tradeoff: { type: 'string' },
              spaceChange: { type: 'string' },
              timeChange: { type: 'string' }
            }
          }
        },
        memoryAccessPattern: { type: 'string' },
        cacheConsiderations: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'complexity-analysis', 'space-complexity']
}));

export const averageCaseTask = defineTask('average-case', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Compute Average-Case Complexity`,
  agent: {
    name: 'numerical-analyst',
    skills: ['sympy-computer-algebra', 'combinatorial-enumeration'],
    prompt: {
      role: 'Probabilistic Algorithm Analysis Expert',
      task: 'Compute the average-case complexity of the algorithm',
      context: {
        algorithm: args.algorithm,
        algorithmCode: args.algorithmCode,
        inputCharacteristics: args.inputCharacteristics,
        worstCaseTime: args.worstCaseTime
      },
      instructions: [
        '1. Define the input distribution model',
        '2. Identify probabilistic assumptions',
        '3. Compute expected number of operations',
        '4. Calculate variance in running time',
        '5. Determine probability of worst-case occurrence',
        '6. Analyze typical vs pathological inputs',
        '7. Consider smoothed complexity if applicable',
        '8. Compare average to worst-case complexity',
        '9. Identify inputs that achieve average performance',
        '10. Provide confidence intervals for expected time'
      ],
      outputFormat: 'JSON object with average-case analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['expectedComplexity', 'inputDistribution'],
      properties: {
        expectedComplexity: { type: 'string' },
        inputDistribution: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            assumptions: { type: 'array', items: { type: 'string' } }
          }
        },
        variance: { type: 'string' },
        standardDeviation: { type: 'string' },
        worstCaseProbability: { type: 'string' },
        confidenceIntervals: {
          type: 'object',
          properties: {
            ci90: { type: 'string' },
            ci95: { type: 'string' },
            ci99: { type: 'string' }
          }
        },
        typicalInputs: { type: 'array', items: { type: 'string' } },
        pathologicalInputs: { type: 'array', items: { type: 'string' } },
        smoothedComplexity: { type: 'string' },
        derivation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'complexity-analysis', 'average-case']
}));

export const algorithmComparisonTask = defineTask('algorithm-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Compare with Alternative Algorithms`,
  agent: {
    name: 'numerical-analyst',
    skills: ['sympy-computer-algebra', 'graph-algorithm-library', 'combinatorial-enumeration'],
    prompt: {
      role: 'Algorithm Design Expert',
      task: 'Compare the algorithm with alternative approaches',
      context: {
        algorithm: args.algorithm,
        timeComplexity: args.timeComplexity,
        spaceComplexity: args.spaceComplexity,
        averageCase: args.averageCase,
        inputCharacteristics: args.inputCharacteristics
      },
      instructions: [
        '1. Identify alternative algorithms for the same problem',
        '2. Compare time complexities (worst, average, best)',
        '3. Compare space complexities',
        '4. Analyze practical performance differences',
        '5. Consider implementation complexity',
        '6. Evaluate cache efficiency and memory access patterns',
        '7. Assess parallelization potential',
        '8. Consider input-dependent performance',
        '9. Evaluate stability and numerical properties',
        '10. Provide recommendations based on use case'
      ],
      outputFormat: 'JSON object with algorithm comparisons'
    },
    outputSchema: {
      type: 'object',
      required: ['alternatives', 'comparisonMatrix'],
      properties: {
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              timeComplexity: { type: 'string' },
              spaceComplexity: { type: 'string' },
              advantages: { type: 'array', items: { type: 'string' } },
              disadvantages: { type: 'array', items: { type: 'string' } },
              bestFor: { type: 'string' }
            }
          }
        },
        comparisonMatrix: {
          type: 'object',
          properties: {
            timeComparison: { type: 'object' },
            spaceComparison: { type: 'object' },
            practicalPerformance: { type: 'object' }
          }
        },
        recommendedAlgorithm: {
          type: 'object',
          properties: {
            forSmallInputs: { type: 'string' },
            forLargeInputs: { type: 'string' },
            forMemoryConstrained: { type: 'string' },
            forParallel: { type: 'string' }
          }
        },
        crossoverPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              inputSize: { type: 'string' },
              algorithms: { type: 'array', items: { type: 'string' } }
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
  labels: ['mathematics', 'complexity-analysis', 'algorithm-comparison']
}));

export const optimizationAnalysisTask = defineTask('optimization-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Identify Optimization Opportunities`,
  agent: {
    name: 'numerical-analyst',
    skills: ['sympy-computer-algebra', 'graph-algorithm-library'],
    prompt: {
      role: 'Algorithm Optimization Specialist',
      task: 'Identify optimization opportunities for the algorithm',
      context: {
        algorithm: args.algorithm,
        algorithmCode: args.algorithmCode,
        timeComplexity: args.timeComplexity,
        spaceComplexity: args.spaceComplexity,
        comparisons: args.comparisons,
        inputCharacteristics: args.inputCharacteristics
      },
      instructions: [
        '1. Identify algorithmic bottlenecks',
        '2. Suggest asymptotic improvements if possible',
        '3. Identify constant factor optimizations',
        '4. Recommend data structure improvements',
        '5. Suggest memoization or dynamic programming opportunities',
        '6. Identify parallelization opportunities',
        '7. Recommend cache-friendly modifications',
        '8. Suggest early termination conditions',
        '9. Identify preprocessing opportunities',
        '10. Provide prioritized optimization recommendations'
      ],
      outputFormat: 'JSON object with optimization opportunities'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'recommendations'],
      properties: {
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              type: { type: 'string', enum: ['asymptotic', 'constant-factor', 'memory', 'cache', 'parallel'] },
              potentialImprovement: { type: 'string' },
              implementation: { type: 'string' },
              tradeoffs: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string' }
            }
          }
        },
        memoizationOpportunities: { type: 'array', items: { type: 'string' } },
        parallelizationStrategy: { type: 'string' },
        preprocessingBenefits: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'complexity-analysis', 'optimization']
}));
