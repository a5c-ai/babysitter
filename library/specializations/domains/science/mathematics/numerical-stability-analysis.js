/**
 * @process specializations/domains/science/mathematics/numerical-stability-analysis
 * @description Analyze numerical algorithms for stability, convergence, and error propagation.
 * Includes condition number analysis, floating-point error bounds, and stability assessment for various input ranges.
 * @inputs { algorithm: string, algorithmCode?: string, inputDomain?: object, precisionRequirements?: object }
 * @outputs { success: boolean, stabilityAnalysis: object, conditionNumbers: object, errorBounds: object, recommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/numerical-stability-analysis', {
 *   algorithm: 'Gaussian elimination with partial pivoting',
 *   algorithmCode: 'def gaussian_elimination(A, b): ...',
 *   inputDomain: { matrixSize: [2, 1000], conditionRange: [1, 1e6] },
 *   precisionRequirements: { relativeTolerance: 1e-10, absoluteTolerance: 1e-15 }
 * });
 *
 * @references
 * - Higham, Accuracy and Stability of Numerical Algorithms
 * - Golub & Van Loan, Matrix Computations
 * - IEEE 754 Floating-Point Standard
 * - Trefethen & Bau, Numerical Linear Algebra
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    algorithm,
    algorithmCode = '',
    inputDomain = {},
    precisionRequirements = { relativeTolerance: 1e-10, absoluteTolerance: 1e-15 }
  } = inputs;

  // Phase 1: Identify Potential Numerical Instabilities
  const instabilityIdentification = await ctx.task(instabilityIdentificationTask, {
    algorithm,
    algorithmCode,
    inputDomain
  });

  // Quality Gate: Algorithm must be analyzable
  if (!instabilityIdentification.operationsAnalyzed) {
    return {
      success: false,
      error: 'Unable to analyze algorithm operations',
      phase: 'instability-identification',
      stabilityAnalysis: null
    };
  }

  // Breakpoint: Review identified instabilities
  await ctx.breakpoint({
    question: `Identified ${instabilityIdentification.potentialInstabilities.length} potential instabilities in "${algorithm}". Review findings?`,
    title: 'Instability Identification Review',
    context: {
      runId: ctx.runId,
      algorithm,
      potentialInstabilities: instabilityIdentification.potentialInstabilities,
      files: [{
        path: `artifacts/phase1-instability-identification.json`,
        format: 'json',
        content: instabilityIdentification
      }]
    }
  });

  // Phase 2: Compute Condition Numbers
  const conditionAnalysis = await ctx.task(conditionAnalysisTask, {
    algorithm,
    algorithmCode,
    inputDomain,
    operationsAnalysis: instabilityIdentification
  });

  // Phase 3: Analyze Floating-Point Error Accumulation
  const errorAccumulationAnalysis = await ctx.task(errorAccumulationTask, {
    algorithm,
    algorithmCode,
    operationsAnalysis: instabilityIdentification,
    conditionAnalysis,
    precisionRequirements
  });

  // Phase 4: Test Boundary Cases
  const boundaryTesting = await ctx.task(boundaryTestingTask, {
    algorithm,
    algorithmCode,
    inputDomain,
    conditionAnalysis,
    potentialInstabilities: instabilityIdentification.potentialInstabilities
  });

  // Quality Gate: Check for critical stability issues
  const criticalIssues = boundaryTesting.testResults.filter(r => r.severity === 'critical');
  if (criticalIssues.length > 0) {
    await ctx.breakpoint({
      question: `Found ${criticalIssues.length} critical stability issues. These require immediate attention. Review?`,
      title: 'Critical Stability Issues',
      context: {
        runId: ctx.runId,
        criticalIssues,
        recommendation: 'Consider alternative algorithms or stabilization techniques'
      }
    });
  }

  // Phase 5: Recommend Stable Reformulations
  const stabilityRecommendations = await ctx.task(stabilityRecommendationsTask, {
    algorithm,
    instabilityIdentification,
    conditionAnalysis,
    errorAccumulationAnalysis,
    boundaryTesting,
    precisionRequirements
  });

  // Final Breakpoint: Analysis Complete
  await ctx.breakpoint({
    question: `Numerical stability analysis complete for "${algorithm}". Stability score: ${stabilityRecommendations.overallStabilityScore}/100. Review findings?`,
    title: 'Stability Analysis Complete',
    context: {
      runId: ctx.runId,
      algorithm,
      stabilityScore: stabilityRecommendations.overallStabilityScore,
      recommendations: stabilityRecommendations.recommendations,
      files: [
        { path: `artifacts/stability-analysis.json`, format: 'json', content: stabilityRecommendations },
        { path: `artifacts/error-analysis.json`, format: 'json', content: errorAccumulationAnalysis }
      ]
    }
  });

  return {
    success: true,
    algorithm,
    stabilityAnalysis: {
      overallScore: stabilityRecommendations.overallStabilityScore,
      stabilityType: stabilityRecommendations.stabilityType,
      criticalRegions: boundaryTesting.criticalRegions,
      stabilityClassification: stabilityRecommendations.stabilityClassification
    },
    conditionNumbers: {
      theoretical: conditionAnalysis.theoreticalCondition,
      empirical: conditionAnalysis.empiricalCondition,
      worstCase: conditionAnalysis.worstCaseCondition
    },
    errorBounds: {
      forwardError: errorAccumulationAnalysis.forwardErrorBound,
      backwardError: errorAccumulationAnalysis.backwardErrorBound,
      roundoffAccumulation: errorAccumulationAnalysis.roundoffAccumulation
    },
    recommendations: stabilityRecommendations.recommendations,
    alternativeAlgorithms: stabilityRecommendations.alternativeAlgorithms,
    boundaryTestResults: boundaryTesting.testResults,
    metadata: {
      processId: 'specializations/domains/science/mathematics/numerical-stability-analysis',
      precisionRequirements,
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const instabilityIdentificationTask = defineTask('instability-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Identify Potential Numerical Instabilities`,
  agent: {
    name: 'numerical-analyst',
    skills: ['floating-point-analysis', 'numerical-linear-algebra-toolkit', 'sympy-computer-algebra'],
    prompt: {
      role: 'Numerical Analyst specializing in algorithm stability',
      task: 'Identify potential numerical instabilities in the given algorithm',
      context: {
        algorithm: args.algorithm,
        algorithmCode: args.algorithmCode,
        inputDomain: args.inputDomain
      },
      instructions: [
        '1. Analyze the algorithm structure and identify all arithmetic operations',
        '2. Identify subtractive cancellation risks (subtraction of nearly equal numbers)',
        '3. Identify potential overflow and underflow conditions',
        '4. Find division operations that could involve near-zero divisors',
        '5. Identify accumulation points where errors can grow',
        '6. Analyze loop structures for error propagation',
        '7. Identify operations with high condition numbers',
        '8. Flag recursive operations that may amplify errors',
        '9. Assess matrix operations for ill-conditioning risks',
        '10. Document the operation dependency graph'
      ],
      outputFormat: 'JSON object with instability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['operationsAnalyzed', 'potentialInstabilities'],
      properties: {
        operationsAnalyzed: { type: 'boolean' },
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              operation: { type: 'string' },
              type: { type: 'string' },
              location: { type: 'string' },
              riskLevel: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        potentialInstabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              location: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              trigger: { type: 'string' }
            }
          }
        },
        subtractiveCancellationRisks: { type: 'array', items: { type: 'string' } },
        overflowRisks: { type: 'array', items: { type: 'string' } },
        underflowRisks: { type: 'array', items: { type: 'string' } },
        divisionRisks: { type: 'array', items: { type: 'string' } },
        operationDependencyGraph: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'numerical-analysis', 'stability', 'instability-identification']
}));

export const conditionAnalysisTask = defineTask('condition-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Compute Condition Numbers`,
  agent: {
    name: 'numerical-analyst',
    skills: ['numerical-linear-algebra-toolkit', 'floating-point-analysis', 'sympy-computer-algebra'],
    prompt: {
      role: 'Numerical Linear Algebra Expert',
      task: 'Analyze condition numbers and sensitivity of the algorithm',
      context: {
        algorithm: args.algorithm,
        algorithmCode: args.algorithmCode,
        inputDomain: args.inputDomain,
        operationsAnalysis: args.operationsAnalysis
      },
      instructions: [
        '1. Define the mathematical problem being solved',
        '2. Compute theoretical condition number for the problem',
        '3. Analyze condition number dependence on input parameters',
        '4. Identify worst-case condition scenarios',
        '5. Compute condition numbers for sub-operations',
        '6. Assess relative vs absolute conditioning',
        '7. Analyze condition number growth with problem size',
        '8. Identify input regions with poor conditioning',
        '9. Compare algorithm condition to problem condition',
        '10. Provide condition number interpretation guidelines'
      ],
      outputFormat: 'JSON object with condition number analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['theoreticalCondition', 'algorithmCondition'],
      properties: {
        theoreticalCondition: {
          type: 'object',
          properties: {
            formula: { type: 'string' },
            typical: { type: 'string' },
            worstCase: { type: 'string' }
          }
        },
        algorithmCondition: {
          type: 'object',
          properties: {
            formula: { type: 'string' },
            amplificationFactor: { type: 'number' }
          }
        },
        empiricalCondition: {
          type: 'object',
          properties: {
            samples: { type: 'number' },
            mean: { type: 'number' },
            max: { type: 'number' }
          }
        },
        worstCaseCondition: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            inputCharacteristics: { type: 'string' }
          }
        },
        conditionGrowth: {
          type: 'object',
          properties: {
            withSize: { type: 'string' },
            asymptotic: { type: 'string' }
          }
        },
        poorlyConditionedRegions: { type: 'array', items: { type: 'string' } },
        interpretationGuidelines: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'numerical-analysis', 'condition-numbers']
}));

export const errorAccumulationTask = defineTask('error-accumulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Analyze Floating-Point Error Accumulation`,
  agent: {
    name: 'numerical-analyst',
    skills: ['floating-point-analysis', 'numerical-linear-algebra-toolkit', 'benchmark-suite-manager'],
    prompt: {
      role: 'Floating-Point Arithmetic Expert',
      task: 'Analyze floating-point error accumulation in the algorithm',
      context: {
        algorithm: args.algorithm,
        algorithmCode: args.algorithmCode,
        operationsAnalysis: args.operationsAnalysis,
        conditionAnalysis: args.conditionAnalysis,
        precisionRequirements: args.precisionRequirements
      },
      instructions: [
        '1. Model roundoff error for each arithmetic operation',
        '2. Track error propagation through the algorithm',
        '3. Compute forward error bounds',
        '4. Compute backward error bounds',
        '5. Analyze cumulative roundoff error growth',
        '6. Identify error amplification points',
        '7. Compare single vs double precision behavior',
        '8. Assess if precision requirements can be met',
        '9. Identify operations requiring extended precision',
        '10. Provide error budget breakdown'
      ],
      outputFormat: 'JSON object with error accumulation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['forwardErrorBound', 'backwardErrorBound', 'roundoffAccumulation'],
      properties: {
        forwardErrorBound: {
          type: 'object',
          properties: {
            bound: { type: 'string' },
            units: { type: 'string' },
            confidence: { type: 'string' }
          }
        },
        backwardErrorBound: {
          type: 'object',
          properties: {
            bound: { type: 'string' },
            interpretation: { type: 'string' }
          }
        },
        roundoffAccumulation: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            growthRate: { type: 'string' },
            totalOperations: { type: 'number' }
          }
        },
        errorPropagation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              errorContribution: { type: 'string' },
              cumulative: { type: 'string' }
            }
          }
        },
        precisionAssessment: {
          type: 'object',
          properties: {
            singlePrecision: { type: 'string' },
            doublePrecision: { type: 'string' },
            extendedNeeded: { type: 'boolean' }
          }
        },
        errorBudget: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              contribution: { type: 'string' }
            }
          }
        },
        meetsRequirements: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'numerical-analysis', 'error-analysis', 'floating-point']
}));

export const boundaryTestingTask = defineTask('boundary-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Test Boundary Cases`,
  agent: {
    name: 'numerical-analyst',
    skills: ['benchmark-suite-manager', 'floating-point-analysis', 'numerical-linear-algebra-toolkit'],
    prompt: {
      role: 'Numerical Testing Specialist',
      task: 'Test algorithm behavior at boundary and extreme cases',
      context: {
        algorithm: args.algorithm,
        algorithmCode: args.algorithmCode,
        inputDomain: args.inputDomain,
        conditionAnalysis: args.conditionAnalysis,
        potentialInstabilities: args.potentialInstabilities
      },
      instructions: [
        '1. Design test cases for domain boundaries',
        '2. Test near-singular and singular inputs',
        '3. Test with very large and very small values',
        '4. Test at identified instability trigger points',
        '5. Test with special values (0, 1, -1, NaN, Inf)',
        '6. Test condition number extremes',
        '7. Compare with known analytical solutions',
        '8. Test scaling invariance',
        '9. Test with random perturbations',
        '10. Document failure modes and safe operating regions'
      ],
      outputFormat: 'JSON object with boundary test results'
    },
    outputSchema: {
      type: 'object',
      required: ['testResults', 'criticalRegions', 'safeOperatingRegion'],
      properties: {
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testCase: { type: 'string' },
              input: { type: 'string' },
              expected: { type: 'string' },
              actual: { type: 'string' },
              passed: { type: 'boolean' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              notes: { type: 'string' }
            }
          }
        },
        criticalRegions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              region: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        safeOperatingRegion: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            constraints: { type: 'array', items: { type: 'string' } }
          }
        },
        failureModes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mode: { type: 'string' },
              trigger: { type: 'string' },
              consequence: { type: 'string' }
            }
          }
        },
        scalingBehavior: { type: 'string' },
        specialValueHandling: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'numerical-analysis', 'boundary-testing']
}));

export const stabilityRecommendationsTask = defineTask('stability-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Recommend Stable Reformulations`,
  agent: {
    name: 'numerical-analyst',
    skills: ['numerical-linear-algebra-toolkit', 'floating-point-analysis', 'benchmark-suite-manager'],
    prompt: {
      role: 'Numerical Algorithm Design Expert',
      task: 'Recommend stable reformulations and alternative algorithms',
      context: {
        algorithm: args.algorithm,
        instabilityIdentification: args.instabilityIdentification,
        conditionAnalysis: args.conditionAnalysis,
        errorAccumulationAnalysis: args.errorAccumulationAnalysis,
        boundaryTesting: args.boundaryTesting,
        precisionRequirements: args.precisionRequirements
      },
      instructions: [
        '1. Synthesize all analysis results into stability assessment',
        '2. Classify overall algorithm stability (stable, conditionally stable, unstable)',
        '3. Recommend reformulations to improve stability',
        '4. Suggest alternative algorithms with better stability',
        '5. Recommend preconditioning or scaling strategies',
        '6. Suggest error compensation techniques',
        '7. Recommend precision requirements',
        '8. Provide implementation guidelines for stability',
        '9. Suggest monitoring and validation strategies',
        '10. Provide overall stability score and summary'
      ],
      outputFormat: 'JSON object with stability recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['overallStabilityScore', 'stabilityClassification', 'recommendations'],
      properties: {
        overallStabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        stabilityType: { type: 'string', enum: ['forward-stable', 'backward-stable', 'mixed-stable', 'conditionally-stable', 'unstable'] },
        stabilityClassification: {
          type: 'object',
          properties: {
            classification: { type: 'string' },
            conditions: { type: 'array', items: { type: 'string' } },
            limitations: { type: 'array', items: { type: 'string' } }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              implementation: { type: 'string' },
              expectedImprovement: { type: 'string' }
            }
          }
        },
        reformulations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              stabilityImprovement: { type: 'string' },
              tradeoffs: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        alternativeAlgorithms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              algorithm: { type: 'string' },
              stability: { type: 'string' },
              complexity: { type: 'string' },
              applicability: { type: 'string' }
            }
          }
        },
        precisionRecommendation: { type: 'string' },
        implementationGuidelines: { type: 'array', items: { type: 'string' } },
        validationStrategy: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'numerical-analysis', 'stability-recommendations']
}));
