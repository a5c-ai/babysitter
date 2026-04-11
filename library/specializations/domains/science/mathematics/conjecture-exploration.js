/**
 * @process specializations/domains/science/mathematics/conjecture-exploration
 * @description Systematic exploration and testing of mathematical conjectures through computational experiments.
 * Generates test cases, searches for counterexamples, and identifies patterns supporting or refuting conjectures.
 * @inputs { conjectureStatement: string, parameterSpace?: object, testingStrategy?: string, maxIterations?: number }
 * @outputs { success: boolean, explorationResults: object, patterns: array, evidenceStrength: number, counterexamples: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/conjecture-exploration', {
 *   conjectureStatement: 'Every even number greater than 2 can be expressed as the sum of two primes',
 *   parameterSpace: { min: 4, max: 10000, step: 2 },
 *   testingStrategy: 'exhaustive',
 *   maxIterations: 5000
 * });
 *
 * @references
 * - Experimental Mathematics: https://www.expmath.org/
 * - OEIS (Online Encyclopedia of Integer Sequences): https://oeis.org/
 * - Wolfram MathWorld: https://mathworld.wolfram.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    conjectureStatement,
    parameterSpace = {},
    testingStrategy = 'adaptive',
    maxIterations = 1000
  } = inputs;

  // Phase 1: Formalize Conjecture Statement
  const conjectureFormalization = await ctx.task(conjectureFormalizationTask, {
    conjectureStatement,
    parameterSpace
  });

  // Quality Gate: Conjecture must be formalizable
  if (!conjectureFormalization.formalizedConjecture) {
    return {
      success: false,
      error: 'Unable to formalize conjecture statement',
      phase: 'formalization',
      explorationResults: null
    };
  }

  // Breakpoint: Review formalized conjecture
  await ctx.breakpoint({
    question: `Review formalized conjecture: "${conjectureFormalization.formalizedConjecture}". Is this correctly interpreted?`,
    title: 'Conjecture Formalization Review',
    context: {
      runId: ctx.runId,
      original: conjectureStatement,
      formalized: conjectureFormalization.formalizedConjecture,
      parameters: conjectureFormalization.identifiedParameters
    }
  });

  // Phase 2: Generate Test Cases
  const testCaseGeneration = await ctx.task(testCaseGenerationTask, {
    formalizedConjecture: conjectureFormalization.formalizedConjecture,
    parameterSpace: conjectureFormalization.parameterSpace,
    testingStrategy,
    maxIterations
  });

  // Phase 3: Execute Computational Verification
  const computationalVerification = await ctx.task(computationalVerificationTask, {
    formalizedConjecture: conjectureFormalization.formalizedConjecture,
    testCases: testCaseGeneration.testCases,
    verificationMethod: testCaseGeneration.recommendedMethod
  });

  // Quality Gate: Check if counterexamples were found
  if (computationalVerification.counterexamplesFound.length > 0) {
    await ctx.breakpoint({
      question: `Found ${computationalVerification.counterexamplesFound.length} potential counterexamples! Review and verify these results?`,
      title: 'Counterexamples Found',
      context: {
        runId: ctx.runId,
        counterexamples: computationalVerification.counterexamplesFound,
        recommendation: 'Verify counterexamples manually before concluding'
      }
    });
  }

  // Phase 4: Search for Counterexamples (focused search)
  const counterexampleSearch = await ctx.task(counterexampleSearchTask, {
    formalizedConjecture: conjectureFormalization.formalizedConjecture,
    preliminaryResults: computationalVerification,
    parameterSpace: conjectureFormalization.parameterSpace
  });

  // Phase 5: Pattern Analysis and Documentation
  const patternAnalysis = await ctx.task(patternAnalysisTask, {
    conjectureStatement,
    formalizedConjecture: conjectureFormalization.formalizedConjecture,
    verificationResults: computationalVerification,
    counterexampleSearch
  });

  // Final Breakpoint: Exploration Complete
  await ctx.breakpoint({
    question: `Conjecture exploration complete. Evidence strength: ${patternAnalysis.evidenceStrength}/100. Approve findings?`,
    title: 'Exploration Complete',
    context: {
      runId: ctx.runId,
      conjectureStatement,
      evidenceStrength: patternAnalysis.evidenceStrength,
      patternsFound: patternAnalysis.patterns,
      files: [
        { path: `artifacts/exploration-report.json`, format: 'json', content: patternAnalysis },
        { path: `artifacts/test-results.json`, format: 'json', content: computationalVerification }
      ]
    }
  });

  return {
    success: true,
    conjectureStatement,
    formalizedConjecture: conjectureFormalization.formalizedConjecture,
    explorationResults: {
      testCasesRun: computationalVerification.testCasesRun,
      verificationRate: computationalVerification.verificationRate,
      computationTime: computationalVerification.computationTime
    },
    patterns: patternAnalysis.patterns,
    evidenceStrength: patternAnalysis.evidenceStrength,
    counterexamples: counterexampleSearch.confirmedCounterexamples,
    relatedConjectures: patternAnalysis.relatedConjectures,
    recommendations: patternAnalysis.recommendations,
    metadata: {
      processId: 'specializations/domains/science/mathematics/conjecture-exploration',
      testingStrategy,
      maxIterations,
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const conjectureFormalizationTask = defineTask('conjecture-formalization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Formalize Conjecture Statement`,
  agent: {
    name: 'conjecture-analyst',
    skills: ['sympy-computer-algebra', 'counterexample-generator', 'sage-math-interface'],
    prompt: {
      role: 'Mathematical Logician specializing in conjecture formalization',
      task: 'Formalize the conjecture statement into a precise mathematical form',
      context: {
        conjectureStatement: args.conjectureStatement,
        parameterSpace: args.parameterSpace
      },
      instructions: [
        '1. Parse the natural language conjecture into formal mathematical notation',
        '2. Identify all quantifiers (universal, existential) and their domains',
        '3. Identify free and bound variables',
        '4. Define the parameter space for testing',
        '5. Identify any implicit assumptions or conditions',
        '6. Express the conjecture in first-order logic form',
        '7. Identify related theorems and known results',
        '8. Determine testability and computational complexity',
        '9. Identify edge cases and boundary conditions',
        '10. Provide equivalent formulations if applicable'
      ],
      outputFormat: 'JSON object with formalized conjecture'
    },
    outputSchema: {
      type: 'object',
      required: ['formalizedConjecture', 'identifiedParameters', 'parameterSpace'],
      properties: {
        formalizedConjecture: { type: 'string' },
        firstOrderLogic: { type: 'string' },
        identifiedParameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              domain: { type: 'string' },
              constraints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        parameterSpace: {
          type: 'object',
          properties: {
            dimensions: { type: 'number' },
            ranges: { type: 'object' },
            constraints: { type: 'array', items: { type: 'string' } }
          }
        },
        implicitAssumptions: { type: 'array', items: { type: 'string' } },
        relatedResults: { type: 'array', items: { type: 'string' } },
        computationalComplexity: { type: 'string' },
        equivalentFormulations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'conjecture-exploration', 'formalization']
}));

export const testCaseGenerationTask = defineTask('test-case-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Generate Test Cases`,
  agent: {
    name: 'conjecture-analyst',
    skills: ['counterexample-generator', 'sympy-computer-algebra', 'combinatorial-enumeration'],
    prompt: {
      role: 'Computational Mathematician specializing in experimental mathematics',
      task: 'Generate comprehensive test cases for conjecture exploration',
      context: {
        formalizedConjecture: args.formalizedConjecture,
        parameterSpace: args.parameterSpace,
        testingStrategy: args.testingStrategy,
        maxIterations: args.maxIterations
      },
      instructions: [
        '1. Design test case generation strategy based on parameter space',
        '2. Include systematic sampling of the parameter space',
        '3. Focus on boundary cases and edge conditions',
        '4. Include random sampling for diverse coverage',
        '5. Prioritize regions likely to contain counterexamples',
        '6. Generate test cases for special values (0, 1, primes, powers, etc.)',
        '7. Include stress tests with large values',
        '8. Consider symmetry and invariants to reduce redundant tests',
        '9. Estimate computational resources needed',
        '10. Recommend verification method (symbolic, numerical, hybrid)'
      ],
      outputFormat: 'JSON object with test cases and generation strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['testCases', 'generationStrategy', 'recommendedMethod'],
      properties: {
        testCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              parameters: { type: 'object' },
              category: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        generationStrategy: {
          type: 'object',
          properties: {
            systematic: { type: 'number' },
            random: { type: 'number' },
            boundary: { type: 'number' },
            special: { type: 'number' }
          }
        },
        recommendedMethod: { type: 'string', enum: ['symbolic', 'numerical', 'hybrid'] },
        estimatedComputationTime: { type: 'string' },
        coverageEstimate: { type: 'number' },
        specialCases: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'conjecture-exploration', 'test-generation']
}));

export const computationalVerificationTask = defineTask('computational-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Execute Computational Verification`,
  agent: {
    name: 'conjecture-analyst',
    skills: ['sage-math-interface', 'sympy-computer-algebra', 'graph-algorithm-library'],
    prompt: {
      role: 'Computational Verification Expert',
      task: 'Execute computational verification of test cases',
      context: {
        formalizedConjecture: args.formalizedConjecture,
        testCases: args.testCases,
        verificationMethod: args.verificationMethod
      },
      instructions: [
        '1. Design computational verification algorithm',
        '2. Execute verification for each test case',
        '3. Record pass/fail status with detailed results',
        '4. Identify and flag potential counterexamples',
        '5. Track computation time and resource usage',
        '6. Handle numerical precision issues appropriately',
        '7. Implement early termination on counterexample discovery',
        '8. Aggregate results and compute statistics',
        '9. Document any verification failures or anomalies',
        '10. Provide confidence metrics for results'
      ],
      outputFormat: 'JSON object with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['testCasesRun', 'verificationRate', 'counterexamplesFound'],
      properties: {
        testCasesRun: { type: 'number' },
        testCasesPassed: { type: 'number' },
        testCasesFailed: { type: 'number' },
        verificationRate: { type: 'number', minimum: 0, maximum: 100 },
        counterexamplesFound: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameters: { type: 'object' },
              expected: { type: 'string' },
              actual: { type: 'string' },
              verified: { type: 'boolean' }
            }
          }
        },
        computationTime: { type: 'string' },
        resourceUsage: { type: 'object' },
        anomalies: { type: 'array', items: { type: 'string' } },
        confidenceMetrics: {
          type: 'object',
          properties: {
            coverageConfidence: { type: 'number' },
            resultConfidence: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'conjecture-exploration', 'computation']
}));

export const counterexampleSearchTask = defineTask('counterexample-focused-search', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Focused Counterexample Search`,
  agent: {
    name: 'conjecture-analyst',
    skills: ['counterexample-generator', 'sympy-computer-algebra', 'sage-math-interface'],
    prompt: {
      role: 'Counterexample Specialist in Mathematical Research',
      task: 'Conduct focused search for counterexamples to the conjecture',
      context: {
        formalizedConjecture: args.formalizedConjecture,
        preliminaryResults: args.preliminaryResults,
        parameterSpace: args.parameterSpace
      },
      instructions: [
        '1. Analyze preliminary results to identify weak points',
        '2. Design targeted search strategies for likely counterexample regions',
        '3. Apply heuristics from similar conjectures',
        '4. Search in unexplored regions of parameter space',
        '5. Apply probabilistic methods for large search spaces',
        '6. Verify any potential counterexamples thoroughly',
        '7. Document search methodology and coverage',
        '8. Assess completeness of counterexample search',
        '9. Identify regions that remain unexplored',
        '10. Provide confidence estimate for conjecture truth'
      ],
      outputFormat: 'JSON object with counterexample search results'
    },
    outputSchema: {
      type: 'object',
      required: ['searchPerformed', 'confirmedCounterexamples', 'searchCompleteness'],
      properties: {
        searchPerformed: { type: 'boolean' },
        searchStrategies: { type: 'array', items: { type: 'string' } },
        regionsSearched: { type: 'array', items: { type: 'string' } },
        confirmedCounterexamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameters: { type: 'object' },
              verification: { type: 'string' },
              implications: { type: 'string' }
            }
          }
        },
        potentialCounterexamples: { type: 'array', items: { type: 'object' } },
        searchCompleteness: { type: 'number', minimum: 0, maximum: 100 },
        unexploredRegions: { type: 'array', items: { type: 'string' } },
        conjectureConfidence: { type: 'number', minimum: 0, maximum: 100 }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'conjecture-exploration', 'counterexamples']
}));

export const patternAnalysisTask = defineTask('pattern-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Pattern Analysis and Documentation`,
  agent: {
    name: 'proof-strategist',
    skills: ['combinatorial-enumeration', 'sympy-computer-algebra', 'graph-algorithm-library'],
    prompt: {
      role: 'Mathematical Pattern Analyst',
      task: 'Analyze exploration results to identify patterns and document findings',
      context: {
        conjectureStatement: args.conjectureStatement,
        formalizedConjecture: args.formalizedConjecture,
        verificationResults: args.verificationResults,
        counterexampleSearch: args.counterexampleSearch
      },
      instructions: [
        '1. Identify patterns in verification results',
        '2. Look for regularities and structures in the data',
        '3. Identify potential refinements to the conjecture',
        '4. Connect findings to related conjectures and theorems',
        '5. Assess overall evidence strength for the conjecture',
        '6. Identify potential proof strategies suggested by patterns',
        '7. Document any surprising or unexpected findings',
        '8. Suggest directions for further exploration',
        '9. Generate comprehensive exploration report',
        '10. Provide recommendations for next steps'
      ],
      outputFormat: 'JSON object with pattern analysis and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'evidenceStrength', 'recommendations'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              confidence: { type: 'number' },
              supportingEvidence: { type: 'array', items: { type: 'string' } },
              implications: { type: 'string' }
            }
          }
        },
        evidenceStrength: { type: 'number', minimum: 0, maximum: 100 },
        conjectureStatus: { type: 'string', enum: ['supported', 'refuted', 'inconclusive', 'refined'] },
        relatedConjectures: { type: 'array', items: { type: 'string' } },
        potentialProofStrategies: { type: 'array', items: { type: 'string' } },
        refinedConjecture: { type: 'string' },
        surprisingFindings: { type: 'array', items: { type: 'string' } },
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
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'conjecture-exploration', 'pattern-analysis']
}));
