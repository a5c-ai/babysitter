/**
 * @process specializations/domains/science/scientific-discovery/optimization-reasoning
 * @description Optimization Reasoning Process - Choose best feasible solutions relative
 * to objectives using mathematical optimization, heuristics, and meta-heuristics.
 * @inputs { domain: string, objective: object, variables: object[], constraints?: object[], method?: string }
 * @outputs { success: boolean, optimalSolution: object, objectiveValue: number, analysis: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/optimization-reasoning', {
 *   domain: 'Resource Allocation',
 *   objective: { type: 'maximize', function: 'profit' },
 *   variables: [{ name: 'product_A', type: 'continuous', bounds: [0, 100] }],
 *   constraints: [{ expression: 'labor_A + labor_B <= 40', type: 'inequality' }]
 * });
 *
 * @references
 * - Boyd & Vandenberghe (2004). Convex Optimization
 * - Nocedal & Wright (2006). Numerical Optimization
 * - Talbi (2009). Metaheuristics: From Design to Implementation
 * - Rardin (2016). Optimization in Operations Research
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain,
    objective,
    variables,
    constraints = [],
    method = 'auto'
  } = inputs;

  // Phase 1: Problem Classification
  const problemClassification = await ctx.task(problemClassificationTask, {
    domain,
    objective,
    variables,
    constraints
  });

  // Phase 2: Model Formulation
  const modelFormulation = await ctx.task(modelFormulationTask, {
    problemClassification,
    objective,
    variables,
    constraints
  });

  // Phase 3: Feasibility Analysis
  const feasibilityAnalysis = await ctx.task(feasibilityAnalysisTask, {
    modelFormulation,
    constraints
  });

  // Quality Gate: Problem must be feasible
  if (!feasibilityAnalysis.isFeasible) {
    return {
      success: false,
      error: 'Optimization problem is infeasible',
      analysis: feasibilityAnalysis,
      optimalSolution: null
    };
  }

  // Phase 4: Method Selection
  const methodSelection = await ctx.task(methodSelectionTask, {
    problemClassification,
    modelFormulation,
    requestedMethod: method
  });

  // Phase 5: Exact Optimization (if applicable)
  const exactOptimization = await ctx.task(exactOptimizationTask, {
    modelFormulation,
    methodSelection,
    problemClassification
  });

  // Phase 6: Heuristic Optimization
  const heuristicOptimization = await ctx.task(heuristicOptimizationTask, {
    modelFormulation,
    methodSelection,
    exactOptimization
  });

  // Phase 7: Solution Comparison
  const solutionComparison = await ctx.task(solutionComparisonTask, {
    exactOptimization,
    heuristicOptimization,
    objective
  });

  // Breakpoint: Review solutions
  await ctx.breakpoint({
    question: `Optimization complete. Best objective: ${solutionComparison.bestSolution.objectiveValue}. Review solutions and sensitivity?`,
    title: 'Optimization Review',
    context: {
      runId: ctx.runId,
      domain,
      bestMethod: solutionComparison.bestMethod,
      objectiveValue: solutionComparison.bestSolution.objectiveValue
    }
  });

  // Phase 8: Sensitivity Analysis
  const sensitivityAnalysis = await ctx.task(optimizationSensitivityTask, {
    bestSolution: solutionComparison.bestSolution,
    modelFormulation,
    constraints
  });

  // Phase 9: Bound Analysis
  const boundAnalysis = await ctx.task(boundAnalysisTask, {
    solutionComparison,
    modelFormulation,
    problemClassification
  });

  // Phase 10: Solution Validation
  const solutionValidation = await ctx.task(solutionValidationTask, {
    bestSolution: solutionComparison.bestSolution,
    modelFormulation,
    constraints,
    domain
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Validation complete. Solution feasible: ${solutionValidation.isFeasible}. Optimality gap: ${boundAnalysis.optimalityGap}%. Accept solution?`,
    title: 'Final Optimization Review',
    context: {
      runId: ctx.runId,
      domain,
      files: [
        { path: 'artifacts/solution.json', format: 'json', content: solutionComparison.bestSolution },
        { path: 'artifacts/sensitivity.json', format: 'json', content: sensitivityAnalysis }
      ]
    }
  });

  return {
    success: true,
    domain,
    optimalSolution: solutionComparison.bestSolution.variables,
    objectiveValue: solutionComparison.bestSolution.objectiveValue,
    analysis: {
      problemType: problemClassification.problemType,
      method: solutionComparison.bestMethod,
      feasibility: feasibilityAnalysis,
      sensitivity: sensitivityAnalysis,
      bounds: boundAnalysis
    },
    validation: solutionValidation,
    alternativeSolutions: solutionComparison.alternativeSolutions,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/optimization-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const problemClassificationTask = defineTask('problem-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimization Problem Classification - ${args.domain}`,
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'optimization-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in mathematical optimization and problem classification',
      task: 'Classify the optimization problem type',
      context: {
        domain: args.domain,
        objective: args.objective,
        variables: args.variables,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify variable types (continuous, integer, binary, mixed)',
        '2. Analyze objective function properties (linear, quadratic, nonlinear)',
        '3. Analyze constraint types (linear, nonlinear, equality, inequality)',
        '4. Determine convexity/concavity',
        '5. Classify problem (LP, QP, MILP, NLP, convex, non-convex)',
        '6. Assess problem size and complexity',
        '7. Identify special structure (network, assignment, etc.)',
        '8. Determine computational complexity class',
        '9. Identify applicable solution methods',
        '10. Document classification'
      ],
      outputFormat: 'JSON object with problem classification'
    },
    outputSchema: {
      type: 'object',
      required: ['problemType', 'variableTypes', 'objectiveType'],
      properties: {
        problemType: {
          type: 'string',
          enum: ['LP', 'QP', 'MILP', 'MIQP', 'NLP', 'MINLP', 'convex', 'non-convex']
        },
        variableTypes: {
          type: 'object',
          properties: {
            continuous: { type: 'number' },
            integer: { type: 'number' },
            binary: { type: 'number' }
          }
        },
        objectiveType: {
          type: 'object',
          properties: {
            direction: { type: 'string', enum: ['minimize', 'maximize'] },
            form: { type: 'string', enum: ['linear', 'quadratic', 'polynomial', 'nonlinear'] },
            convex: { type: 'boolean' }
          }
        },
        constraintTypes: {
          type: 'object',
          properties: {
            linear: { type: 'number' },
            nonlinear: { type: 'number' },
            equality: { type: 'number' },
            inequality: { type: 'number' }
          }
        },
        specialStructure: { type: 'string' },
        complexity: { type: 'string' },
        applicableMethods: {
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
  labels: ['optimization', 'classification', 'problem-type']
}));

export const modelFormulationTask = defineTask('model-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimization Model Formulation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'optimization-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in mathematical modeling and optimization',
      task: 'Formulate the optimization model mathematically',
      context: {
        problemClassification: args.problemClassification,
        objective: args.objective,
        variables: args.variables,
        constraints: args.constraints
      },
      instructions: [
        '1. Define decision variables with domains',
        '2. Formulate objective function mathematically',
        '3. Formulate constraints mathematically',
        '4. Add bound constraints on variables',
        '5. Check for redundant constraints',
        '6. Normalize/scale if needed',
        '7. Identify parameters vs variables',
        '8. Document model assumptions',
        '9. Verify model completeness',
        '10. Express in standard form'
      ],
      outputFormat: 'JSON object with formulated model'
    },
    outputSchema: {
      type: 'object',
      required: ['variables', 'objective', 'constraints'],
      properties: {
        variables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              lowerBound: { type: 'number' },
              upperBound: { type: 'number' }
            }
          }
        },
        objective: {
          type: 'object',
          properties: {
            direction: { type: 'string' },
            expression: { type: 'string' },
            coefficients: { type: 'object' }
          }
        },
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              expression: { type: 'string' },
              type: { type: 'string', enum: ['<=', '>=', '='] },
              rhs: { type: 'number' }
            }
          }
        },
        parameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'number' }
            }
          }
        },
        standardForm: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['optimization', 'formulation', 'modeling']
}));

export const feasibilityAnalysisTask = defineTask('feasibility-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Feasibility Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'optimization-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in constraint analysis and feasibility',
      task: 'Analyze feasibility of the optimization problem',
      context: {
        modelFormulation: args.modelFormulation,
        constraints: args.constraints
      },
      instructions: [
        '1. Check if feasible region is non-empty',
        '2. Identify conflicting constraints',
        '3. Check bound consistency',
        '4. Analyze constraint system rank',
        '5. Identify redundant constraints',
        '6. Find a feasible point if exists',
        '7. Characterize feasible region',
        '8. Identify binding constraints likely',
        '9. Check for unboundedness',
        '10. Document feasibility analysis'
      ],
      outputFormat: 'JSON object with feasibility analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['isFeasible'],
      properties: {
        isFeasible: { type: 'boolean' },
        feasiblePoint: { type: 'object' },
        conflictingConstraints: {
          type: 'array',
          items: { type: 'object' }
        },
        redundantConstraints: {
          type: 'array',
          items: { type: 'string' }
        },
        feasibleRegion: {
          type: 'object',
          properties: {
            bounded: { type: 'boolean' },
            convex: { type: 'boolean' },
            vertices: { type: 'number' }
          }
        },
        unbounded: { type: 'boolean' },
        infeasibilityReason: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['optimization', 'feasibility', 'constraints']
}));

export const methodSelectionTask = defineTask('method-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimization Method Selection',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'optimization-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in optimization algorithms and solver selection',
      task: 'Select appropriate optimization methods',
      context: {
        problemClassification: args.problemClassification,
        modelFormulation: args.modelFormulation,
        requestedMethod: args.requestedMethod
      },
      instructions: [
        '1. Match problem type to suitable algorithms',
        '2. Consider exact vs heuristic methods',
        '3. Assess computational requirements',
        '4. Consider solution quality guarantees',
        '5. Select primary and backup methods',
        '6. Configure algorithm parameters',
        '7. Consider warm-starting options',
        '8. Assess convergence expectations',
        '9. Plan method hierarchy',
        '10. Document method selection rationale'
      ],
      outputFormat: 'JSON object with method selection'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryMethod', 'methods'],
      properties: {
        primaryMethod: { type: 'string' },
        methods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['exact', 'heuristic', 'metaheuristic'] },
              parameters: { type: 'object' },
              guarantees: { type: 'string' }
            }
          }
        },
        exactMethods: {
          type: 'array',
          items: { type: 'string' }
        },
        heuristicMethods: {
          type: 'array',
          items: { type: 'string' }
        },
        rationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['optimization', 'method-selection', 'algorithms']
}));

export const exactOptimizationTask = defineTask('exact-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Exact Optimization',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'optimization-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in exact optimization algorithms',
      task: 'Apply exact optimization methods',
      context: {
        modelFormulation: args.modelFormulation,
        methodSelection: args.methodSelection,
        problemClassification: args.problemClassification
      },
      instructions: [
        '1. Apply simplex/interior point for LP',
        '2. Apply branch and bound for MILP',
        '3. Apply active set/SQP for NLP',
        '4. Track optimization progress',
        '5. Handle numerical issues',
        '6. Compute optimality conditions',
        '7. Verify KKT conditions if applicable',
        '8. Record solution and certificate',
        '9. Assess solution optimality',
        '10. Document solver output'
      ],
      outputFormat: 'JSON object with exact optimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['solution', 'status'],
      properties: {
        solution: {
          type: 'object',
          properties: {
            variables: { type: 'object' },
            objectiveValue: { type: 'number' }
          }
        },
        status: {
          type: 'string',
          enum: ['optimal', 'feasible', 'infeasible', 'unbounded', 'timeout', 'error']
        },
        optimalityGap: { type: 'number' },
        dualSolution: { type: 'object' },
        kktConditions: {
          type: 'object',
          properties: {
            satisfied: { type: 'boolean' },
            violations: { type: 'array', items: { type: 'string' } }
          }
        },
        solverStats: {
          type: 'object',
          properties: {
            iterations: { type: 'number' },
            time: { type: 'string' },
            method: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['optimization', 'exact', 'solver']
}));

export const heuristicOptimizationTask = defineTask('heuristic-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Heuristic Optimization',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'optimization-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in metaheuristics and heuristic optimization',
      task: 'Apply heuristic/metaheuristic optimization methods',
      context: {
        modelFormulation: args.modelFormulation,
        methodSelection: args.methodSelection,
        exactOptimization: args.exactOptimization
      },
      instructions: [
        '1. Apply selected metaheuristics (GA, SA, PSO, etc.)',
        '2. Configure search parameters',
        '3. Run multiple starts for robustness',
        '4. Track best solution found',
        '5. Monitor convergence',
        '6. Apply local search improvement',
        '7. Compare with exact solution if available',
        '8. Assess solution quality',
        '9. Record search history',
        '10. Document heuristic results'
      ],
      outputFormat: 'JSON object with heuristic optimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['solutions', 'bestSolution'],
      properties: {
        bestSolution: {
          type: 'object',
          properties: {
            variables: { type: 'object' },
            objectiveValue: { type: 'number' }
          }
        },
        solutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              variables: { type: 'object' },
              objectiveValue: { type: 'number' }
            }
          }
        },
        convergenceHistory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              iteration: { type: 'number' },
              bestValue: { type: 'number' }
            }
          }
        },
        searchStats: {
          type: 'object',
          properties: {
            iterations: { type: 'number' },
            evaluations: { type: 'number' },
            time: { type: 'string' }
          }
        },
        diversityMeasure: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['optimization', 'heuristic', 'metaheuristic']
}));

export const solutionComparisonTask = defineTask('solution-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Solution Comparison',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'optimization-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in solution analysis and comparison',
      task: 'Compare and select the best solution',
      context: {
        exactOptimization: args.exactOptimization,
        heuristicOptimization: args.heuristicOptimization,
        objective: args.objective
      },
      instructions: [
        '1. Compare solutions by objective value',
        '2. Verify feasibility of all solutions',
        '3. Select best overall solution',
        '4. Identify alternative good solutions',
        '5. Assess solution diversity',
        '6. Compare computational costs',
        '7. Assess solution reliability',
        '8. Document comparison metrics',
        '9. Identify best method',
        '10. Summarize comparison'
      ],
      outputFormat: 'JSON object with solution comparison'
    },
    outputSchema: {
      type: 'object',
      required: ['bestSolution', 'bestMethod'],
      properties: {
        bestSolution: {
          type: 'object',
          properties: {
            variables: { type: 'object' },
            objectiveValue: { type: 'number' },
            method: { type: 'string' },
            feasible: { type: 'boolean' }
          }
        },
        bestMethod: { type: 'string' },
        alternativeSolutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variables: { type: 'object' },
              objectiveValue: { type: 'number' },
              gapFromBest: { type: 'number' }
            }
          }
        },
        methodComparison: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              objectiveValue: { type: 'number' },
              time: { type: 'string' },
              quality: { type: 'string' }
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
  labels: ['optimization', 'comparison', 'selection']
}));

export const optimizationSensitivityTask = defineTask('optimization-sensitivity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimization Sensitivity Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'optimization-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in sensitivity analysis for optimization',
      task: 'Analyze sensitivity of optimal solution',
      context: {
        bestSolution: args.bestSolution,
        modelFormulation: args.modelFormulation,
        constraints: args.constraints
      },
      instructions: [
        '1. Compute shadow prices / dual values',
        '2. Compute reduced costs for variables',
        '3. Determine allowable ranges for RHS',
        '4. Determine allowable ranges for objective coefficients',
        '5. Identify binding constraints',
        '6. Assess stability of optimal basis',
        '7. Perform parametric analysis if useful',
        '8. Identify most sensitive parameters',
        '9. Assess impact of uncertainty',
        '10. Document sensitivity results'
      ],
      outputFormat: 'JSON object with sensitivity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['shadowPrices', 'reducedCosts'],
      properties: {
        shadowPrices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              shadowPrice: { type: 'number' },
              interpretation: { type: 'string' }
            }
          }
        },
        reducedCosts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              reducedCost: { type: 'number' }
            }
          }
        },
        bindingConstraints: {
          type: 'array',
          items: { type: 'string' }
        },
        allowableRanges: {
          type: 'object',
          properties: {
            rhs: { type: 'array', items: { type: 'object' } },
            objectiveCoefficients: { type: 'array', items: { type: 'object' } }
          }
        },
        sensitiveParameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              sensitivity: { type: 'number' }
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
  labels: ['optimization', 'sensitivity', 'duality']
}));

export const boundAnalysisTask = defineTask('bound-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimality Bound Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'optimization-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in optimization bounds and certificates',
      task: 'Analyze optimality bounds and gaps',
      context: {
        solutionComparison: args.solutionComparison,
        modelFormulation: args.modelFormulation,
        problemClassification: args.problemClassification
      },
      instructions: [
        '1. Compute lower/upper bounds on optimal',
        '2. Use relaxations (LP, Lagrangian)',
        '3. Calculate optimality gap',
        '4. Assess bound tightness',
        '5. Identify sources of gap',
        '6. Suggest gap-closing strategies',
        '7. Assess solution optimality confidence',
        '8. Compare to theoretical bounds',
        '9. Document bound analysis',
        '10. Provide optimality certificate if possible'
      ],
      outputFormat: 'JSON object with bound analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['optimalityGap', 'bounds'],
      properties: {
        bounds: {
          type: 'object',
          properties: {
            lower: { type: 'number' },
            upper: { type: 'number' },
            method: { type: 'string' }
          }
        },
        optimalityGap: { type: 'number' },
        gapInterpretation: { type: 'string' },
        relaxationBounds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              relaxation: { type: 'string' },
              bound: { type: 'number' }
            }
          }
        },
        optimalityCertificate: {
          type: 'object',
          properties: {
            certified: { type: 'boolean' },
            certificate: { type: 'string' }
          }
        },
        gapClosingStrategies: {
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
  labels: ['optimization', 'bounds', 'optimality']
}));

export const solutionValidationTask = defineTask('solution-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Solution Validation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'optimization-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Expert in solution verification and validation',
      task: 'Validate the optimal solution',
      context: {
        bestSolution: args.bestSolution,
        modelFormulation: args.modelFormulation,
        constraints: args.constraints,
        domain: args.domain
      },
      instructions: [
        '1. Verify variable bounds satisfaction',
        '2. Check all constraints satisfied',
        '3. Recompute objective value',
        '4. Check numerical precision',
        '5. Assess practical feasibility',
        '6. Validate against domain knowledge',
        '7. Check for numerical artifacts',
        '8. Assess solution interpretability',
        '9. Document any issues',
        '10. Provide validation verdict'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['isFeasible', 'isValid'],
      properties: {
        isFeasible: { type: 'boolean' },
        isValid: { type: 'boolean' },
        boundViolations: {
          type: 'array',
          items: { type: 'object' }
        },
        constraintViolations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              violation: { type: 'number' }
            }
          }
        },
        recomputedObjective: { type: 'number' },
        objectiveError: { type: 'number' },
        practicalFeasibility: {
          type: 'object',
          properties: {
            feasible: { type: 'boolean' },
            issues: { type: 'array', items: { type: 'string' } }
          }
        },
        domainValidation: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            notes: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['optimization', 'validation', 'verification']
}));
