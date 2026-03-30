/**
 * @process specializations/domains/science/mathematics/symbolic-simplification
 * @description Simplify complex mathematical expressions using computer algebra systems.
 * Includes algebraic simplification, trigonometric identities, and pattern recognition.
 * @inputs { expression: string, simplificationGoals?: array, domain?: string, assumptions?: array }
 * @outputs { success: boolean, simplifiedExpression: string, equivalentForms: array, simplificationSteps: array, verificationResult: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/symbolic-simplification', {
 *   expression: '(x^2 - 1)/(x - 1) + sin(x)^2 + cos(x)^2',
 *   simplificationGoals: ['algebraic', 'trigonometric'],
 *   domain: 'real',
 *   assumptions: ['x != 1']
 * });
 *
 * @references
 * - SymPy Documentation: https://docs.sympy.org/
 * - Mathematica Language Guide: https://reference.wolfram.com/language/
 * - Maxima Manual: https://maxima.sourceforge.io/docs/manual/
 * - Bronstein, Symbolic Integration I
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    expression,
    simplificationGoals = ['algebraic'],
    domain = 'real',
    assumptions = []
  } = inputs;

  // Phase 1: Parse Mathematical Expression
  const expressionParsing = await ctx.task(expressionParsingTask, {
    expression,
    domain,
    assumptions
  });

  // Quality Gate: Expression must be parseable
  if (!expressionParsing.parsedExpression) {
    return {
      success: false,
      error: 'Unable to parse mathematical expression',
      phase: 'parsing',
      simplifiedExpression: null
    };
  }

  // Breakpoint: Review parsed expression
  await ctx.breakpoint({
    question: `Expression parsed. Structure identified: ${expressionParsing.structure}. Continue with simplification?`,
    title: 'Expression Parsing Review',
    context: {
      runId: ctx.runId,
      originalExpression: expression,
      parsedStructure: expressionParsing.structure,
      files: [{
        path: `artifacts/phase1-parsed.json`,
        format: 'json',
        content: expressionParsing
      }]
    }
  });

  // Phase 2: Apply Simplification Rules
  const simplificationApplication = await ctx.task(simplificationApplicationTask, {
    parsedExpression: expressionParsing.parsedExpression,
    simplificationGoals,
    domain,
    assumptions
  });

  // Phase 3: Identify Patterns and Structures
  const patternRecognition = await ctx.task(patternRecognitionTask, {
    parsedExpression: expressionParsing.parsedExpression,
    simplifiedExpression: simplificationApplication.simplifiedExpression,
    domain
  });

  // Phase 4: Generate Equivalent Forms
  const equivalentFormsGeneration = await ctx.task(equivalentFormsGenerationTask, {
    simplifiedExpression: simplificationApplication.simplifiedExpression,
    patternRecognition,
    simplificationGoals
  });

  // Phase 5: Verify Simplification Correctness
  const verificationResult = await ctx.task(simplificationVerificationTask, {
    originalExpression: expression,
    simplifiedExpression: simplificationApplication.simplifiedExpression,
    equivalentForms: equivalentFormsGeneration.forms,
    assumptions,
    domain
  });

  // Final Breakpoint: Simplification Complete
  await ctx.breakpoint({
    question: `Simplification complete. Original: "${expression}" -> Simplified: "${simplificationApplication.simplifiedExpression}". Verified: ${verificationResult.verified}. Accept result?`,
    title: 'Simplification Complete',
    context: {
      runId: ctx.runId,
      original: expression,
      simplified: simplificationApplication.simplifiedExpression,
      verified: verificationResult.verified,
      files: [
        { path: `artifacts/simplification-result.json`, format: 'json', content: { simplificationApplication, verificationResult } }
      ]
    }
  });

  return {
    success: true,
    originalExpression: expression,
    simplifiedExpression: simplificationApplication.simplifiedExpression,
    equivalentForms: equivalentFormsGeneration.forms,
    simplificationSteps: simplificationApplication.steps,
    patterns: patternRecognition.patterns,
    verificationResult: {
      verified: verificationResult.verified,
      method: verificationResult.method,
      testCases: verificationResult.testCases
    },
    metadata: {
      processId: 'specializations/domains/science/mathematics/symbolic-simplification',
      domain,
      simplificationGoals,
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const expressionParsingTask = defineTask('expression-parsing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Parse Mathematical Expression`,
  agent: {
    name: 'symbolic-computation-expert',
    skills: ['sympy-computer-algebra', 'sage-math-interface', 'latex-math-formatter'],
    prompt: {
      role: 'Symbolic Mathematics Expert',
      task: 'Parse and analyze the mathematical expression',
      context: {
        expression: args.expression,
        domain: args.domain,
        assumptions: args.assumptions
      },
      instructions: [
        '1. Parse the expression into an abstract syntax tree',
        '2. Identify all variables and constants',
        '3. Identify mathematical operations',
        '4. Classify expression type (polynomial, rational, transcendental)',
        '5. Identify domain restrictions',
        '6. Note any singularities or discontinuities',
        '7. Determine expression complexity',
        '8. Identify subexpressions for targeted simplification',
        '9. Check syntactic correctness',
        '10. Document expression structure'
      ],
      outputFormat: 'JSON object with parsed expression'
    },
    outputSchema: {
      type: 'object',
      required: ['parsedExpression', 'structure', 'variables'],
      properties: {
        parsedExpression: { type: 'string' },
        structure: { type: 'string' },
        variables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        constants: { type: 'array', items: { type: 'string' } },
        operations: { type: 'array', items: { type: 'string' } },
        expressionType: { type: 'string' },
        domainRestrictions: { type: 'array', items: { type: 'string' } },
        singularities: { type: 'array', items: { type: 'string' } },
        complexity: {
          type: 'object',
          properties: {
            depth: { type: 'number' },
            terms: { type: 'number' },
            operations: { type: 'number' }
          }
        },
        subexpressions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'symbolic-computation', 'parsing']
}));

export const simplificationApplicationTask = defineTask('simplification-application', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Apply Simplification Rules`,
  agent: {
    name: 'symbolic-computation-expert',
    skills: ['sympy-computer-algebra', 'sage-math-interface', 'latex-math-formatter'],
    prompt: {
      role: 'Computer Algebra Simplification Expert',
      task: 'Apply simplification rules to the expression',
      context: {
        parsedExpression: args.parsedExpression,
        simplificationGoals: args.simplificationGoals,
        domain: args.domain,
        assumptions: args.assumptions
      },
      instructions: [
        '1. Apply algebraic simplification (combine like terms)',
        '2. Factor or expand as appropriate',
        '3. Cancel common factors',
        '4. Apply trigonometric identities',
        '5. Simplify exponentials and logarithms',
        '6. Rationalize denominators if beneficial',
        '7. Apply assumptions to simplify',
        '8. Reduce to canonical form',
        '9. Document each simplification step',
        '10. Assess if further simplification is possible'
      ],
      outputFormat: 'JSON object with simplified expression'
    },
    outputSchema: {
      type: 'object',
      required: ['simplifiedExpression', 'steps'],
      properties: {
        simplifiedExpression: { type: 'string' },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              operation: { type: 'string' },
              before: { type: 'string' },
              after: { type: 'string' },
              rule: { type: 'string' }
            }
          }
        },
        rulesApplied: { type: 'array', items: { type: 'string' } },
        simplificationAchieved: {
          type: 'object',
          properties: {
            termReduction: { type: 'number' },
            complexityReduction: { type: 'number' }
          }
        },
        furtherSimplificationPossible: { type: 'boolean' },
        canonicalForm: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'symbolic-computation', 'simplification']
}));

export const patternRecognitionTask = defineTask('pattern-recognition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Identify Patterns and Structures`,
  agent: {
    name: 'symbolic-computation-expert',
    skills: ['sage-math-interface', 'sympy-computer-algebra', 'special-functions-library'],
    prompt: {
      role: 'Mathematical Pattern Recognition Expert',
      task: 'Identify mathematical patterns and special structures',
      context: {
        parsedExpression: args.parsedExpression,
        simplifiedExpression: args.simplifiedExpression,
        domain: args.domain
      },
      instructions: [
        '1. Identify polynomial patterns (factored forms, special products)',
        '2. Recognize trigonometric identities',
        '3. Identify exponential/logarithmic patterns',
        '4. Recognize hyperbolic function patterns',
        '5. Identify series or summation patterns',
        '6. Recognize special functions (Bessel, gamma, etc.)',
        '7. Identify symmetries',
        '8. Recognize combinatorial patterns',
        '9. Identify recursive structures',
        '10. Document pattern implications'
      ],
      outputFormat: 'JSON object with pattern recognition results'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'specialStructures'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              location: { type: 'string' },
              implication: { type: 'string' }
            }
          }
        },
        specialStructures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              structure: { type: 'string' },
              type: { type: 'string' },
              simplificationOpportunity: { type: 'string' }
            }
          }
        },
        symmetries: { type: 'array', items: { type: 'string' } },
        recognizedIdentities: { type: 'array', items: { type: 'string' } },
        specialFunctions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'symbolic-computation', 'patterns']
}));

export const equivalentFormsGenerationTask = defineTask('equivalent-forms', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Generate Equivalent Forms`,
  agent: {
    name: 'symbolic-computation-expert',
    skills: ['sympy-computer-algebra', 'sage-math-interface', 'latex-math-formatter'],
    prompt: {
      role: 'Expression Transformation Expert',
      task: 'Generate useful equivalent forms of the expression',
      context: {
        simplifiedExpression: args.simplifiedExpression,
        patternRecognition: args.patternRecognition,
        simplificationGoals: args.simplificationGoals
      },
      instructions: [
        '1. Generate expanded form',
        '2. Generate factored form',
        '3. Generate partial fraction decomposition',
        '4. Generate trigonometric alternatives',
        '5. Generate exponential form if applicable',
        '6. Generate power series expansion',
        '7. Generate forms optimized for computation',
        '8. Generate forms optimized for differentiation',
        '9. Rank forms by usefulness',
        '10. Document transformation rules used'
      ],
      outputFormat: 'JSON object with equivalent forms'
    },
    outputSchema: {
      type: 'object',
      required: ['forms'],
      properties: {
        forms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              form: { type: 'string' },
              type: { type: 'string' },
              useCase: { type: 'string' },
              complexity: { type: 'number' }
            }
          }
        },
        expandedForm: { type: 'string' },
        factoredForm: { type: 'string' },
        partialFractions: { type: 'string' },
        seriesExpansion: {
          type: 'object',
          properties: {
            series: { type: 'string' },
            point: { type: 'string' },
            terms: { type: 'number' }
          }
        },
        recommendedForm: {
          type: 'object',
          properties: {
            form: { type: 'string' },
            reason: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'symbolic-computation', 'equivalent-forms']
}));

export const simplificationVerificationTask = defineTask('simplification-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Verify Simplification Correctness`,
  agent: {
    name: 'symbolic-computation-expert',
    skills: ['sympy-computer-algebra', 'benchmark-suite-manager', 'floating-point-analysis'],
    prompt: {
      role: 'Mathematical Verification Expert',
      task: 'Verify that simplification preserves mathematical equivalence',
      context: {
        originalExpression: args.originalExpression,
        simplifiedExpression: args.simplifiedExpression,
        equivalentForms: args.equivalentForms,
        assumptions: args.assumptions,
        domain: args.domain
      },
      instructions: [
        '1. Test numerical equality at random points',
        '2. Verify symbolic equivalence if possible',
        '3. Check boundary cases',
        '4. Verify domain preservation',
        '5. Check behavior at singularities',
        '6. Verify limit behavior',
        '7. Test derivative equality',
        '8. Document verification methodology',
        '9. Assess confidence in equivalence',
        '10. Note any conditional equivalence'
      ],
      outputFormat: 'JSON object with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'method', 'confidence'],
      properties: {
        verified: { type: 'boolean' },
        method: { type: 'string' },
        testCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              point: { type: 'string' },
              original: { type: 'number' },
              simplified: { type: 'number' },
              match: { type: 'boolean' }
            }
          }
        },
        symbolicVerification: {
          type: 'object',
          properties: {
            performed: { type: 'boolean' },
            result: { type: 'string' }
          }
        },
        boundaryChecks: { type: 'array', items: { type: 'object' } },
        domainPreserved: { type: 'boolean' },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        conditionalEquivalence: { type: 'string' },
        warnings: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'symbolic-computation', 'verification']
}));
