/**
 * @process specializations/domains/science/mathematics/convex-analysis-verification
 * @description Verify convexity properties of optimization problems to enable efficient solution methods.
 * Includes checking convexity of objective and constraints, and identifying hidden convex structure.
 * @inputs { problemFormulation: object, objectiveFunction?: string, constraints?: array }
 * @outputs { success: boolean, convexityAnalysis: object, reformulations: array, solverRecommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/convex-analysis-verification', {
 *   problemFormulation: { objective: 'minimize x^2 + y^2', constraints: ['x + y >= 1', 'x >= 0', 'y >= 0'] },
 *   objectiveFunction: 'x^2 + y^2',
 *   constraints: ['x + y >= 1', 'x >= 0', 'y >= 0']
 * });
 *
 * @references
 * - Boyd & Vandenberghe, Convex Optimization
 * - Rockafellar, Convex Analysis
 * - Nesterov, Introductory Lectures on Convex Optimization
 * - Grant & Boyd, CVX: Matlab Software for Disciplined Convex Programming
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemFormulation,
    objectiveFunction = '',
    constraints = []
  } = inputs;

  // Phase 1: Check Objective Convexity (Hessian Analysis)
  const objectiveConvexity = await ctx.task(objectiveConvexityTask, {
    problemFormulation,
    objectiveFunction
  });

  // Quality Gate: Objective analysis must complete
  if (!objectiveConvexity.analysisComplete) {
    return {
      success: false,
      error: 'Unable to analyze objective convexity',
      phase: 'objective-convexity',
      convexityAnalysis: null
    };
  }

  // Breakpoint: Review objective convexity
  await ctx.breakpoint({
    question: `Objective function is ${objectiveConvexity.convex ? 'convex' : 'not convex'}. Review analysis?`,
    title: 'Objective Convexity Review',
    context: {
      runId: ctx.runId,
      objective: objectiveFunction,
      convex: objectiveConvexity.convex,
      method: objectiveConvexity.method,
      files: [{
        path: `artifacts/phase1-objective-convexity.json`,
        format: 'json',
        content: objectiveConvexity
      }]
    }
  });

  // Phase 2: Verify Constraint Set Convexity
  const constraintConvexity = await ctx.task(constraintConvexityTask, {
    problemFormulation,
    constraints
  });

  // Phase 3: Identify Reformulations to Convex Form
  const convexReformulation = await ctx.task(convexReformulationTask, {
    objectiveConvexity,
    constraintConvexity,
    problemFormulation
  });

  // Phase 4: Recommend Appropriate Solvers
  const solverRecommendation = await ctx.task(solverRecommendationTask, {
    objectiveConvexity,
    constraintConvexity,
    convexReformulation
  });

  // Phase 5: Document Convexity Analysis
  const convexityDocumentation = await ctx.task(convexityDocumentationTask, {
    objectiveConvexity,
    constraintConvexity,
    convexReformulation,
    solverRecommendation
  });

  // Final Breakpoint: Analysis Complete
  const isConvex = objectiveConvexity.convex && constraintConvexity.allConvex;
  await ctx.breakpoint({
    question: `Convexity analysis complete. Problem is ${isConvex ? 'convex' : 'non-convex'}. ${convexReformulation.reformulationPossible ? 'Convex reformulation available.' : ''} Review?`,
    title: 'Convexity Analysis Complete',
    context: {
      runId: ctx.runId,
      problemIsConvex: isConvex,
      reformulationAvailable: convexReformulation.reformulationPossible,
      recommendedSolver: solverRecommendation.primaryRecommendation,
      files: [
        { path: `artifacts/convexity-analysis.json`, format: 'json', content: convexityDocumentation }
      ]
    }
  });

  return {
    success: true,
    convexityAnalysis: {
      problemIsConvex: isConvex,
      objectiveConvex: objectiveConvexity.convex,
      constraintSetConvex: constraintConvexity.allConvex,
      convexityType: objectiveConvexity.convexityType,
      hessianAnalysis: objectiveConvexity.hessianAnalysis
    },
    constraintAnalysis: {
      convexConstraints: constraintConvexity.convexConstraints,
      nonConvexConstraints: constraintConvexity.nonConvexConstraints,
      linearConstraints: constraintConvexity.linearConstraints
    },
    reformulations: convexReformulation.reformulations,
    solverRecommendations: solverRecommendation.recommendations,
    documentation: convexityDocumentation.document,
    metadata: {
      processId: 'specializations/domains/science/mathematics/convex-analysis-verification',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const objectiveConvexityTask = defineTask('objective-convexity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Check Objective Convexity (Hessian Analysis)`,
  agent: {
    name: 'optimization-expert',
    skills: ['sympy-computer-algebra', 'cvxpy-optimization-modeling', 'numerical-linear-algebra-toolkit'],
    prompt: {
      role: 'Convex Analysis Expert',
      task: 'Analyze the convexity of the objective function',
      context: {
        problemFormulation: args.problemFormulation,
        objectiveFunction: args.objectiveFunction
      },
      instructions: [
        '1. Parse the objective function',
        '2. Compute the gradient symbolically',
        '3. Compute the Hessian matrix symbolically',
        '4. Analyze eigenvalues of the Hessian',
        '5. Determine if Hessian is positive semi-definite (convex)',
        '6. Determine if Hessian is negative semi-definite (concave)',
        '7. Identify convexity domain if not globally convex',
        '8. Check for quasi-convexity if not convex',
        '9. Classify convexity type (strictly, strongly, etc.)',
        '10. Document convexity verification method'
      ],
      outputFormat: 'JSON object with objective convexity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysisComplete', 'convex', 'method'],
      properties: {
        analysisComplete: { type: 'boolean' },
        convex: { type: 'boolean' },
        concave: { type: 'boolean' },
        convexityType: { type: 'string', enum: ['strictly-convex', 'strongly-convex', 'convex', 'quasi-convex', 'non-convex'] },
        method: { type: 'string' },
        hessianAnalysis: {
          type: 'object',
          properties: {
            hessian: { type: 'string' },
            eigenvalueCondition: { type: 'string' },
            positiveSemiDefinite: { type: 'boolean' }
          }
        },
        gradient: { type: 'string' },
        convexityDomain: { type: 'string' },
        strongConvexityParameter: { type: 'number' },
        lipschitzConstant: { type: 'number' },
        evidence: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'convex-analysis', 'objective']
}));

export const constraintConvexityTask = defineTask('constraint-convexity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Verify Constraint Set Convexity`,
  agent: {
    name: 'optimization-expert',
    skills: ['sympy-computer-algebra', 'cvxpy-optimization-modeling', 'numerical-linear-algebra-toolkit'],
    prompt: {
      role: 'Constraint Set Analysis Expert',
      task: 'Verify convexity of all constraints',
      context: {
        problemFormulation: args.problemFormulation,
        constraints: args.constraints
      },
      instructions: [
        '1. Parse each constraint function',
        '2. For inequality g(x) <= 0, check if g is convex',
        '3. For inequality g(x) >= 0, check if g is concave',
        '4. Verify equality constraints are affine (linear)',
        '5. Check sublevel sets are convex',
        '6. Verify feasible region is a convex set',
        '7. Identify any non-convex constraints',
        '8. Check constraint qualification conditions',
        '9. Assess if non-convex constraints can be relaxed',
        '10. Document constraint-by-constraint analysis'
      ],
      outputFormat: 'JSON object with constraint convexity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['allConvex', 'constraintAnalysis'],
      properties: {
        allConvex: { type: 'boolean' },
        feasibleSetConvex: { type: 'boolean' },
        constraintAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              type: { type: 'string', enum: ['equality', 'inequality'] },
              functionConvex: { type: 'boolean' },
              constraintConvex: { type: 'boolean' },
              method: { type: 'string' }
            }
          }
        },
        convexConstraints: { type: 'array', items: { type: 'string' } },
        nonConvexConstraints: { type: 'array', items: { type: 'string' } },
        linearConstraints: { type: 'array', items: { type: 'string' } },
        affineConstraints: { type: 'array', items: { type: 'string' } },
        constraintQualification: {
          type: 'object',
          properties: {
            slaterCondition: { type: 'boolean' },
            licq: { type: 'boolean' },
            notes: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'convex-analysis', 'constraints']
}));

export const convexReformulationTask = defineTask('convex-reformulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Identify Reformulations to Convex Form`,
  agent: {
    name: 'optimization-expert',
    skills: ['cvxpy-optimization-modeling', 'sympy-computer-algebra', 'numerical-linear-algebra-toolkit'],
    prompt: {
      role: 'Convex Reformulation Specialist',
      task: 'Identify reformulations that could make the problem convex',
      context: {
        objectiveConvexity: args.objectiveConvexity,
        constraintConvexity: args.constraintConvexity,
        problemFormulation: args.problemFormulation
      },
      instructions: [
        '1. Identify hidden convex structure',
        '2. Check for perspective reformulations',
        '3. Consider epigraph reformulations',
        '4. Check for log-sum-exp transformations',
        '5. Consider change of variables (e.g., log transform)',
        '6. Identify disciplined convex programming rules',
        '7. Check for SDP relaxations',
        '8. Consider second-order cone reformulations',
        '9. Assess quality of convex relaxations',
        '10. Document reformulation approaches'
      ],
      outputFormat: 'JSON object with reformulation options'
    },
    outputSchema: {
      type: 'object',
      required: ['reformulationPossible', 'reformulations'],
      properties: {
        reformulationPossible: { type: 'boolean' },
        hiddenConvexStructure: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              structure: { type: 'string' },
              exploitable: { type: 'boolean' }
            }
          }
        },
        reformulations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              originalForm: { type: 'string' },
              reformulatedForm: { type: 'string' },
              preservesOptimum: { type: 'boolean' },
              relaxation: { type: 'boolean' }
            }
          }
        },
        dcpCompatible: { type: 'boolean' },
        recommendedReformulation: { type: 'string' },
        relaxationQuality: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'convex-analysis', 'reformulation']
}));

export const solverRecommendationTask = defineTask('solver-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Recommend Appropriate Solvers`,
  agent: {
    name: 'optimization-expert',
    skills: ['cvxpy-optimization-modeling', 'benchmark-suite-manager', 'numerical-linear-algebra-toolkit'],
    prompt: {
      role: 'Optimization Solver Expert',
      task: 'Recommend appropriate solvers based on convexity analysis',
      context: {
        objectiveConvexity: args.objectiveConvexity,
        constraintConvexity: args.constraintConvexity,
        convexReformulation: args.convexReformulation
      },
      instructions: [
        '1. Match problem structure to solver capabilities',
        '2. Recommend interior point methods for convex problems',
        '3. Consider first-order methods for large-scale convex',
        '4. Recommend global optimization for non-convex',
        '5. Consider SDP solvers if applicable',
        '6. Recommend conic solvers for SOCP problems',
        '7. Consider commercial vs open-source options',
        '8. Assess solver scalability',
        '9. Recommend algorithm parameters',
        '10. Document solver selection rationale'
      ],
      outputFormat: 'JSON object with solver recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryRecommendation', 'recommendations'],
      properties: {
        primaryRecommendation: { type: 'string' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              solver: { type: 'string' },
              algorithm: { type: 'string' },
              suitability: { type: 'string', enum: ['excellent', 'good', 'fair'] },
              convexRequired: { type: 'boolean' },
              scalability: { type: 'string' },
              license: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        algorithmParameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              recommendedValue: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        convergenceGuarantees: { type: 'string' },
        expectedComplexity: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'convex-analysis', 'solvers']
}));

export const convexityDocumentationTask = defineTask('convexity-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Document Convexity Analysis`,
  agent: {
    name: 'optimization-expert',
    skills: ['latex-math-formatter', 'sympy-computer-algebra', 'cvxpy-optimization-modeling'],
    prompt: {
      role: 'Mathematical Documentation Specialist',
      task: 'Document the convexity analysis comprehensively',
      context: {
        objectiveConvexity: args.objectiveConvexity,
        constraintConvexity: args.constraintConvexity,
        convexReformulation: args.convexReformulation,
        solverRecommendation: args.solverRecommendation
      },
      instructions: [
        '1. Summarize convexity findings',
        '2. Document mathematical derivations',
        '3. Explain Hessian analysis results',
        '4. Document constraint analysis',
        '5. Explain reformulation approaches',
        '6. Justify solver recommendations',
        '7. Note any assumptions made',
        '8. Provide references for methods used',
        '9. Create actionable recommendations',
        '10. Generate comprehensive report'
      ],
      outputFormat: 'JSON object with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'summary'],
      properties: {
        document: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            objectiveAnalysis: { type: 'string' },
            constraintAnalysis: { type: 'string' },
            reformulationAnalysis: { type: 'string' },
            solverRecommendations: { type: 'string' }
          }
        },
        summary: {
          type: 'object',
          properties: {
            problemIsConvex: { type: 'boolean' },
            canBeReformulated: { type: 'boolean' },
            recommendedApproach: { type: 'string' }
          }
        },
        mathematicalDerivations: { type: 'string' },
        assumptions: { type: 'array', items: { type: 'string' } },
        references: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'convex-analysis', 'documentation']
}));
