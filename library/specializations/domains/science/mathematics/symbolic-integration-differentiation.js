/**
 * @process specializations/domains/science/mathematics/symbolic-integration-differentiation
 * @description Perform symbolic integration and differentiation with verification.
 * Handles special functions, definite integrals, and generates step-by-step solutions.
 * @inputs { expression: string, operation: string, variable?: string, limits?: object, assumptions?: array }
 * @outputs { success: boolean, result: string, steps: array, verification: object, specialCases: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/symbolic-integration-differentiation', {
 *   expression: 'x^2 * exp(-x)',
 *   operation: 'integrate',
 *   variable: 'x',
 *   limits: { lower: 0, upper: 'infinity' },
 *   assumptions: ['x > 0']
 * });
 *
 * @references
 * - Bronstein, Symbolic Integration I
 * - Geddes et al., Algorithms for Computer Algebra
 * - Risch Algorithm: https://en.wikipedia.org/wiki/Risch_algorithm
 * - NIST Digital Library of Mathematical Functions
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    expression,
    operation,
    variable = 'x',
    limits = null,
    assumptions = []
  } = inputs;

  // Phase 1: Parse Integral/Derivative Expression
  const expressionParsing = await ctx.task(expressionParsingTask, {
    expression,
    operation,
    variable,
    limits,
    assumptions
  });

  // Quality Gate: Expression must be parseable
  if (!expressionParsing.parsedExpression) {
    return {
      success: false,
      error: 'Unable to parse expression',
      phase: 'parsing',
      result: null
    };
  }

  // Breakpoint: Review parsed expression
  await ctx.breakpoint({
    question: `Expression parsed for ${operation}. Continue with symbolic computation?`,
    title: 'Expression Parsing Review',
    context: {
      runId: ctx.runId,
      expression,
      operation,
      variable,
      files: [{
        path: `artifacts/phase1-parsed.json`,
        format: 'json',
        content: expressionParsing
      }]
    }
  });

  // Phase 2: Apply Symbolic Computation
  const symbolicComputation = await ctx.task(symbolicComputationTask, {
    parsedExpression: expressionParsing.parsedExpression,
    operation,
    variable,
    limits,
    assumptions
  });

  // Phase 3: Verify Result Correctness
  const resultVerification = await ctx.task(resultVerificationTask, {
    originalExpression: expression,
    result: symbolicComputation.result,
    operation,
    variable,
    limits,
    assumptions
  });

  // Quality Gate: Check verification
  if (!resultVerification.verified) {
    await ctx.breakpoint({
      question: `Result verification failed. Review potential issues?`,
      title: 'Verification Warning',
      context: {
        runId: ctx.runId,
        issues: resultVerification.issues,
        recommendation: 'Check special cases and assumptions'
      }
    });
  }

  // Phase 4: Handle Special Cases
  const specialCaseHandling = await ctx.task(specialCaseHandlingTask, {
    expression,
    result: symbolicComputation.result,
    operation,
    variable,
    limits,
    assumptions
  });

  // Phase 5: Generate Step-by-Step Solution
  const stepByStepSolution = await ctx.task(stepByStepSolutionTask, {
    expression,
    result: symbolicComputation.result,
    operation,
    variable,
    limits,
    computationSteps: symbolicComputation.steps
  });

  // Final Breakpoint: Computation Complete
  await ctx.breakpoint({
    question: `${operation === 'integrate' ? 'Integration' : 'Differentiation'} complete. Result: ${symbolicComputation.result}. Accept result?`,
    title: 'Symbolic Computation Complete',
    context: {
      runId: ctx.runId,
      expression,
      result: symbolicComputation.result,
      verified: resultVerification.verified,
      files: [
        { path: `artifacts/solution.json`, format: 'json', content: { symbolicComputation, stepByStepSolution } }
      ]
    }
  });

  return {
    success: true,
    expression,
    operation,
    variable,
    result: symbolicComputation.result,
    steps: stepByStepSolution.steps,
    verification: {
      verified: resultVerification.verified,
      method: resultVerification.method,
      testResults: resultVerification.testResults
    },
    specialCases: specialCaseHandling.cases,
    alternativeForms: symbolicComputation.alternativeForms,
    metadata: {
      processId: 'specializations/domains/science/mathematics/symbolic-integration-differentiation',
      operation,
      definite: limits !== null,
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const expressionParsingTask = defineTask('expression-parsing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Parse ${args.operation === 'integrate' ? 'Integral' : 'Derivative'} Expression`,
  agent: {
    name: 'symbolic-computation-expert',
    skills: ['sympy-computer-algebra', 'sage-math-interface', 'special-functions-library'],
    prompt: {
      role: 'Symbolic Calculus Expert',
      task: 'Parse and analyze the expression for symbolic computation',
      context: {
        expression: args.expression,
        operation: args.operation,
        variable: args.variable,
        limits: args.limits,
        assumptions: args.assumptions
      },
      instructions: [
        '1. Parse the mathematical expression',
        '2. Identify the variable of integration/differentiation',
        '3. Classify expression type (polynomial, rational, transcendental)',
        '4. Identify special functions present',
        '5. Determine if definite or indefinite',
        '6. Parse integration limits if definite',
        '7. Identify potential singularities',
        '8. Assess integrability/differentiability',
        '9. Note domain restrictions',
        '10. Identify applicable techniques'
      ],
      outputFormat: 'JSON object with parsed expression'
    },
    outputSchema: {
      type: 'object',
      required: ['parsedExpression', 'expressionType', 'applicableTechniques'],
      properties: {
        parsedExpression: { type: 'string' },
        expressionType: { type: 'string' },
        specialFunctions: { type: 'array', items: { type: 'string' } },
        definite: { type: 'boolean' },
        limits: {
          type: 'object',
          properties: {
            lower: { type: 'string' },
            upper: { type: 'string' }
          }
        },
        singularities: { type: 'array', items: { type: 'string' } },
        integrable: { type: 'boolean' },
        domainRestrictions: { type: 'array', items: { type: 'string' } },
        applicableTechniques: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'symbolic-computation', 'parsing']
}));

export const symbolicComputationTask = defineTask('symbolic-computation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Apply Symbolic ${args.operation === 'integrate' ? 'Integration' : 'Differentiation'}`,
  agent: {
    name: 'symbolic-computation-expert',
    skills: ['sympy-computer-algebra', 'sage-math-interface', 'special-functions-library'],
    prompt: {
      role: 'Computer Algebra System Expert',
      task: `Perform symbolic ${args.operation} on the expression`,
      context: {
        parsedExpression: args.parsedExpression,
        operation: args.operation,
        variable: args.variable,
        limits: args.limits,
        assumptions: args.assumptions
      },
      instructions: [
        '1. Select appropriate technique (substitution, parts, partial fractions)',
        '2. Apply the symbolic computation',
        '3. Handle special functions appropriately',
        '4. Apply limits if definite integral',
        '5. Simplify the result',
        '6. Add constant of integration if indefinite',
        '7. Generate alternative forms',
        '8. Document technique used',
        '9. Handle improper integrals',
        '10. Express in standard form'
      ],
      outputFormat: 'JSON object with computation result'
    },
    outputSchema: {
      type: 'object',
      required: ['result', 'technique', 'steps'],
      properties: {
        result: { type: 'string' },
        technique: { type: 'string' },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              action: { type: 'string' },
              expression: { type: 'string' }
            }
          }
        },
        alternativeForms: { type: 'array', items: { type: 'string' } },
        constantOfIntegration: { type: 'boolean' },
        specialFunctionResult: { type: 'boolean' },
        convergence: {
          type: 'object',
          properties: {
            converges: { type: 'boolean' },
            condition: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'symbolic-computation', 'calculus']
}));

export const resultVerificationTask = defineTask('result-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Verify Result Correctness`,
  agent: {
    name: 'symbolic-computation-expert',
    skills: ['sympy-computer-algebra', 'benchmark-suite-manager', 'floating-point-analysis'],
    prompt: {
      role: 'Mathematical Verification Expert',
      task: 'Verify the symbolic computation result is correct',
      context: {
        originalExpression: args.originalExpression,
        result: args.result,
        operation: args.operation,
        variable: args.variable,
        limits: args.limits,
        assumptions: args.assumptions
      },
      instructions: [
        '1. For integrals: differentiate result and compare',
        '2. For derivatives: verify using limit definition or rules',
        '3. Test numerical values at random points',
        '4. Check boundary conditions',
        '5. Verify special case values',
        '6. Check dimensional consistency',
        '7. Verify behavior at limits',
        '8. Test against known results',
        '9. Document verification method',
        '10. Assess confidence level'
      ],
      outputFormat: 'JSON object with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'method'],
      properties: {
        verified: { type: 'boolean' },
        method: { type: 'string' },
        reverseOperation: {
          type: 'object',
          properties: {
            performed: { type: 'boolean' },
            result: { type: 'string' },
            matches: { type: 'boolean' }
          }
        },
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testPoint: { type: 'string' },
              expected: { type: 'number' },
              computed: { type: 'number' },
              matches: { type: 'boolean' }
            }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'symbolic-computation', 'verification']
}));

export const specialCaseHandlingTask = defineTask('special-case-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Handle Special Cases`,
  agent: {
    name: 'symbolic-computation-expert',
    skills: ['special-functions-library', 'sympy-computer-algebra', 'sage-math-interface'],
    prompt: {
      role: 'Special Functions Expert',
      task: 'Handle special cases and edge conditions',
      context: {
        expression: args.expression,
        result: args.result,
        operation: args.operation,
        variable: args.variable,
        limits: args.limits,
        assumptions: args.assumptions
      },
      instructions: [
        '1. Identify boundary cases',
        '2. Handle improper integrals',
        '3. Address singularities',
        '4. Handle branch cuts for complex functions',
        '5. Identify parameter-dependent cases',
        '6. Handle piecewise results',
        '7. Document convergence conditions',
        '8. Note principal value if needed',
        '9. Handle multivalued functions',
        '10. Document all special cases'
      ],
      outputFormat: 'JSON object with special cases'
    },
    outputSchema: {
      type: 'object',
      required: ['cases'],
      properties: {
        cases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              case: { type: 'string' },
              condition: { type: 'string' },
              result: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        improperIntegral: {
          type: 'object',
          properties: {
            isImproper: { type: 'boolean' },
            type: { type: 'string' },
            convergence: { type: 'string' }
          }
        },
        singularities: { type: 'array', items: { type: 'object' } },
        principalValue: { type: 'boolean' },
        piecewiseResult: { type: 'boolean' },
        convergenceConditions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'symbolic-computation', 'special-cases']
}));

export const stepByStepSolutionTask = defineTask('step-by-step-solution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Generate Step-by-Step Solution`,
  agent: {
    name: 'symbolic-computation-expert',
    skills: ['latex-math-formatter', 'sympy-computer-algebra', 'sage-math-interface'],
    prompt: {
      role: 'Mathematics Education Expert',
      task: 'Generate a clear step-by-step solution',
      context: {
        expression: args.expression,
        result: args.result,
        operation: args.operation,
        variable: args.variable,
        limits: args.limits,
        computationSteps: args.computationSteps
      },
      instructions: [
        '1. Start with the original problem statement',
        '2. Explain the chosen technique and why',
        '3. Show each transformation step clearly',
        '4. Explain substitutions used',
        '5. Show intermediate results',
        '6. Apply limits step by step if definite',
        '7. Show simplification steps',
        '8. Present final answer clearly',
        '9. Include LaTeX formatting',
        '10. Add explanatory notes'
      ],
      outputFormat: 'JSON object with step-by-step solution'
    },
    outputSchema: {
      type: 'object',
      required: ['steps', 'finalAnswer'],
      properties: {
        problemStatement: { type: 'string' },
        techniqueExplanation: { type: 'string' },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stepNumber: { type: 'number' },
              description: { type: 'string' },
              expression: { type: 'string' },
              latex: { type: 'string' },
              explanation: { type: 'string' }
            }
          }
        },
        finalAnswer: { type: 'string' },
        finalAnswerLatex: { type: 'string' },
        notes: { type: 'array', items: { type: 'string' } },
        commonMistakes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'symbolic-computation', 'step-by-step']
}));
