/**
 * @process specializations/domains/science/mathematics/optimization-problem-formulation
 * @description Translate real-world optimization problems into mathematical programming formulations.
 * Identifies decision variables, objective functions, and constraints from problem descriptions.
 * @inputs { problemDescription: string, objectives?: array, constraints?: array, decisionVariableHints?: array }
 * @outputs { success: boolean, formulation: object, problemClassification: object, solverRecommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/optimization-problem-formulation', {
 *   problemDescription: 'Schedule nurses to minimize labor cost while ensuring adequate coverage for all shifts and respecting labor regulations',
 *   objectives: ['minimize total labor cost', 'maximize employee satisfaction'],
 *   constraints: ['24/7 coverage required', 'max 40 hours per week per nurse', 'minimum rest between shifts']
 * });
 *
 * @references
 * - Boyd & Vandenberghe, Convex Optimization
 * - Bertsimas & Tsitsiklis, Introduction to Linear Optimization
 * - Williams, Model Building in Mathematical Programming
 * - AMPL Book: https://ampl.com/resources/the-ampl-book/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemDescription,
    objectives = [],
    constraints = [],
    decisionVariableHints = []
  } = inputs;

  // Phase 1: Extract Decision Variables
  const variableExtraction = await ctx.task(variableExtractionTask, {
    problemDescription,
    decisionVariableHints
  });

  // Quality Gate: Decision variables must be identifiable
  if (!variableExtraction.decisionVariables || variableExtraction.decisionVariables.length === 0) {
    return {
      success: false,
      error: 'Unable to identify decision variables',
      phase: 'variable-extraction',
      formulation: null
    };
  }

  // Breakpoint: Review decision variables
  await ctx.breakpoint({
    question: `Identified ${variableExtraction.decisionVariables.length} decision variables. Are these correct?`,
    title: 'Decision Variables Review',
    context: {
      runId: ctx.runId,
      problemDescription,
      decisionVariables: variableExtraction.decisionVariables,
      files: [{
        path: `artifacts/phase1-variables.json`,
        format: 'json',
        content: variableExtraction
      }]
    }
  });

  // Phase 2: Formulate Objective Function
  const objectiveFormulation = await ctx.task(objectiveFormulationTask, {
    problemDescription,
    objectives,
    decisionVariables: variableExtraction.decisionVariables
  });

  // Phase 3: Identify and Encode Constraints
  const constraintEncoding = await ctx.task(constraintEncodingTask, {
    problemDescription,
    constraints,
    decisionVariables: variableExtraction.decisionVariables,
    objectiveFormulation
  });

  // Phase 4: Classify Problem Structure
  const problemClassification = await ctx.task(problemClassificationTask, {
    decisionVariables: variableExtraction.decisionVariables,
    objectiveFormulation,
    constraintEncoding
  });

  // Phase 5: Generate Model in Standard Form
  const standardFormGeneration = await ctx.task(standardFormGenerationTask, {
    problemDescription,
    variableExtraction,
    objectiveFormulation,
    constraintEncoding,
    problemClassification
  });

  // Final Breakpoint: Formulation Complete
  await ctx.breakpoint({
    question: `Optimization problem formulated as ${problemClassification.problemClass}. Review formulation?`,
    title: 'Formulation Complete',
    context: {
      runId: ctx.runId,
      problemDescription,
      problemClass: problemClassification.problemClass,
      objectiveCount: objectiveFormulation.objectives.length,
      constraintCount: constraintEncoding.constraints.length,
      files: [
        { path: `artifacts/formulation.json`, format: 'json', content: standardFormGeneration },
        { path: `artifacts/formulation.mod`, format: 'text', content: standardFormGeneration.amplModel }
      ]
    }
  });

  return {
    success: true,
    problemDescription,
    formulation: {
      decisionVariables: variableExtraction.decisionVariables,
      objectiveFunction: objectiveFormulation.objectives,
      constraints: constraintEncoding.constraints,
      bounds: variableExtraction.bounds
    },
    problemClassification: {
      problemClass: problemClassification.problemClass,
      convexity: problemClassification.convexity,
      linearity: problemClassification.linearity,
      integrality: problemClassification.integrality
    },
    standardForm: standardFormGeneration.standardForm,
    modelCode: {
      ampl: standardFormGeneration.amplModel,
      pyomo: standardFormGeneration.pyomoModel,
      mathematical: standardFormGeneration.mathematicalNotation
    },
    solverRecommendations: problemClassification.solverRecommendations,
    metadata: {
      processId: 'specializations/domains/science/mathematics/optimization-problem-formulation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const variableExtractionTask = defineTask('variable-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Extract Decision Variables`,
  agent: {
    name: 'optimization-expert',
    skills: ['sympy-computer-algebra', 'latex-math-formatter', 'cvxpy-optimization-modeling'],
    prompt: {
      role: 'Operations Research Expert specializing in optimization modeling',
      task: 'Extract decision variables from the problem description',
      context: {
        problemDescription: args.problemDescription,
        decisionVariableHints: args.decisionVariableHints
      },
      instructions: [
        '1. Identify all decisions that need to be made',
        '2. Define decision variables with clear notation (x, y, z)',
        '3. Specify variable domains (continuous, integer, binary)',
        '4. Identify index sets for vector/matrix variables',
        '5. Define upper and lower bounds',
        '6. Distinguish decision variables from parameters',
        '7. Identify auxiliary variables if needed',
        '8. Consider variable scaling for numerical stability',
        '9. Document the meaning of each variable',
        '10. Organize variables by type'
      ],
      outputFormat: 'JSON object with decision variables'
    },
    outputSchema: {
      type: 'object',
      required: ['decisionVariables'],
      properties: {
        decisionVariables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              symbol: { type: 'string' },
              meaning: { type: 'string' },
              domain: { type: 'string', enum: ['continuous', 'integer', 'binary'] },
              indexSets: { type: 'array', items: { type: 'string' } },
              dimensions: { type: 'string' }
            }
          }
        },
        bounds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              lower: { type: 'string' },
              upper: { type: 'string' }
            }
          }
        },
        parameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              meaning: { type: 'string' },
              indexSets: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        auxiliaryVariables: { type: 'array', items: { type: 'object' } },
        indexSets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              elements: { type: 'string' }
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
  labels: ['mathematics', 'optimization', 'variable-extraction']
}));

export const objectiveFormulationTask = defineTask('objective-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Formulate Objective Function`,
  agent: {
    name: 'optimization-expert',
    skills: ['cvxpy-optimization-modeling', 'sympy-computer-algebra', 'latex-math-formatter'],
    prompt: {
      role: 'Mathematical Optimization Expert',
      task: 'Formulate the objective function for the optimization problem',
      context: {
        problemDescription: args.problemDescription,
        objectives: args.objectives,
        decisionVariables: args.decisionVariables
      },
      instructions: [
        '1. Identify the primary objective (minimize or maximize)',
        '2. Express objective as function of decision variables',
        '3. Identify if single or multi-objective problem',
        '4. Handle multi-objective via weighting, lexicographic, or Pareto',
        '5. Check if objective is linear, quadratic, or nonlinear',
        '6. Assess convexity/concavity of objective',
        '7. Identify coefficients and parameters',
        '8. Consider scaling of objective terms',
        '9. Write objective in mathematical notation',
        '10. Document objective formulation rationale'
      ],
      outputFormat: 'JSON object with objective formulation'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'primaryObjective'],
      properties: {
        primaryObjective: {
          type: 'object',
          properties: {
            sense: { type: 'string', enum: ['minimize', 'maximize'] },
            expression: { type: 'string' },
            mathematical: { type: 'string' },
            type: { type: 'string', enum: ['linear', 'quadratic', 'nonlinear'] }
          }
        },
        objectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              sense: { type: 'string' },
              expression: { type: 'string' },
              weight: { type: 'number' },
              priority: { type: 'number' }
            }
          }
        },
        multiObjectiveHandling: {
          type: 'object',
          properties: {
            method: { type: 'string', enum: ['single', 'weighted-sum', 'lexicographic', 'epsilon-constraint', 'pareto'] },
            parameters: { type: 'object' }
          }
        },
        convexityAssessment: {
          type: 'object',
          properties: {
            convex: { type: 'boolean' },
            evidence: { type: 'string' }
          }
        },
        coefficients: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'optimization', 'objective-function']
}));

export const constraintEncodingTask = defineTask('constraint-encoding', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Identify and Encode Constraints`,
  agent: {
    name: 'optimization-expert',
    skills: ['cvxpy-optimization-modeling', 'sympy-computer-algebra', 'numerical-linear-algebra-toolkit'],
    prompt: {
      role: 'Constraint Programming Expert',
      task: 'Identify and encode all constraints for the optimization problem',
      context: {
        problemDescription: args.problemDescription,
        constraints: args.constraints,
        decisionVariables: args.decisionVariables,
        objectiveFormulation: args.objectiveFormulation
      },
      instructions: [
        '1. Extract all explicit constraints from problem description',
        '2. Identify implicit constraints (non-negativity, integrality)',
        '3. Classify constraints by type (equality, inequality)',
        '4. Express each constraint mathematically',
        '5. Identify linear vs nonlinear constraints',
        '6. Assess convexity of constraint sets',
        '7. Handle logical constraints (if-then, either-or)',
        '8. Linearize nonlinear constraints if possible',
        '9. Identify big-M values for logical constraints',
        '10. Document constraint formulation'
      ],
      outputFormat: 'JSON object with encoded constraints'
    },
    outputSchema: {
      type: 'object',
      required: ['constraints'],
      properties: {
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: ['equality', 'inequality-leq', 'inequality-geq'] },
              expression: { type: 'string' },
              rhs: { type: 'string' },
              indexSets: { type: 'array', items: { type: 'string' } },
              linearity: { type: 'string', enum: ['linear', 'quadratic', 'nonlinear'] },
              convex: { type: 'boolean' }
            }
          }
        },
        boundConstraints: { type: 'array', items: { type: 'object' } },
        logicalConstraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              original: { type: 'string' },
              linearization: { type: 'string' },
              bigM: { type: 'number' }
            }
          }
        },
        feasibilityNotes: { type: 'array', items: { type: 'string' } },
        redundantConstraints: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'optimization', 'constraints']
}));

export const problemClassificationTask = defineTask('problem-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Classify Problem Structure`,
  agent: {
    name: 'optimization-expert',
    skills: ['cvxpy-optimization-modeling', 'benchmark-suite-manager', 'sympy-computer-algebra'],
    prompt: {
      role: 'Optimization Problem Classification Expert',
      task: 'Classify the optimization problem and recommend appropriate solvers',
      context: {
        decisionVariables: args.decisionVariables,
        objectiveFormulation: args.objectiveFormulation,
        constraintEncoding: args.constraintEncoding
      },
      instructions: [
        '1. Determine problem class (LP, QP, MILP, MIQP, NLP, etc.)',
        '2. Assess linearity of objective and constraints',
        '3. Determine convexity of the problem',
        '4. Identify integer and binary variables',
        '5. Check for special structure (network flow, assignment, etc.)',
        '6. Estimate problem size and complexity',
        '7. Identify decomposition opportunities',
        '8. Recommend appropriate solver classes',
        '9. Estimate solution difficulty',
        '10. Suggest reformulations if beneficial'
      ],
      outputFormat: 'JSON object with problem classification'
    },
    outputSchema: {
      type: 'object',
      required: ['problemClass', 'convexity', 'solverRecommendations'],
      properties: {
        problemClass: { type: 'string' },
        linearity: { type: 'string', enum: ['linear', 'quadratic', 'nonlinear'] },
        convexity: {
          type: 'object',
          properties: {
            convex: { type: 'boolean' },
            quasiconvex: { type: 'boolean' },
            evidence: { type: 'string' }
          }
        },
        integrality: {
          type: 'object',
          properties: {
            hasBinary: { type: 'boolean' },
            hasInteger: { type: 'boolean' },
            continuous: { type: 'boolean' }
          }
        },
        specialStructure: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              structure: { type: 'string' },
              exploitable: { type: 'boolean' }
            }
          }
        },
        problemSize: {
          type: 'object',
          properties: {
            variables: { type: 'number' },
            constraints: { type: 'number' },
            nonzeros: { type: 'number' }
          }
        },
        solverRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              solver: { type: 'string' },
              suitability: { type: 'string', enum: ['excellent', 'good', 'fair'] },
              openSource: { type: 'boolean' },
              rationale: { type: 'string' }
            }
          }
        },
        solutionDifficulty: { type: 'string', enum: ['easy', 'moderate', 'hard', 'very-hard'] },
        reformulationSuggestions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'optimization', 'classification']
}));

export const standardFormGenerationTask = defineTask('standard-form-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Generate Model in Standard Form`,
  agent: {
    name: 'optimization-expert',
    skills: ['cvxpy-optimization-modeling', 'latex-math-formatter', 'sympy-computer-algebra'],
    prompt: {
      role: 'Mathematical Programming Model Developer',
      task: 'Generate the optimization model in standard form and modeling languages',
      context: {
        problemDescription: args.problemDescription,
        variableExtraction: args.variableExtraction,
        objectiveFormulation: args.objectiveFormulation,
        constraintEncoding: args.constraintEncoding,
        problemClassification: args.problemClassification
      },
      instructions: [
        '1. Write complete mathematical formulation',
        '2. Convert to standard form if needed (min, Ax <= b, x >= 0)',
        '3. Generate AMPL model code',
        '4. Generate Pyomo model code',
        '5. Add comments explaining the model',
        '6. Include data section templates',
        '7. Add solver directives',
        '8. Include solution reporting',
        '9. Document any model assumptions',
        '10. Provide verification suggestions'
      ],
      outputFormat: 'JSON object with standard form and model code'
    },
    outputSchema: {
      type: 'object',
      required: ['standardForm', 'mathematicalNotation', 'amplModel'],
      properties: {
        standardForm: {
          type: 'object',
          properties: {
            objective: { type: 'string' },
            equalityConstraints: { type: 'string' },
            inequalityConstraints: { type: 'string' },
            bounds: { type: 'string' },
            integrality: { type: 'string' }
          }
        },
        mathematicalNotation: { type: 'string' },
        amplModel: { type: 'string' },
        pyomoModel: { type: 'string' },
        dataTemplate: { type: 'string' },
        verificationSuggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              method: { type: 'string' }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'optimization', 'model-generation']
}));
