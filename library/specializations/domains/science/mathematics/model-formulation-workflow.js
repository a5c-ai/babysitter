/**
 * @process specializations/domains/science/mathematics/model-formulation-workflow
 * @description Systematic workflow for developing mathematical models from real-world systems.
 * Includes dimensional analysis, assumption documentation, and derivation of governing equations.
 * @inputs { systemDescription: string, modelingGoal?: string, knownPhysics?: array, observations?: object }
 * @outputs { success: boolean, mathematicalModel: object, assumptions: array, governingEquations: array, validation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/model-formulation-workflow', {
 *   systemDescription: 'Population dynamics of predator-prey interaction in closed ecosystem',
 *   modelingGoal: 'Predict population oscillations and steady states',
 *   knownPhysics: ['conservation of biomass', 'carrying capacity limits'],
 *   observations: { preyGrowthRate: 0.5, predationRate: 0.02 }
 * });
 *
 * @references
 * - Lin & Segel, Mathematics Applied to Deterministic Problems in Natural Sciences
 * - Edelstein-Keshet, Mathematical Models in Biology
 * - Fowler, Mathematical Models in the Applied Sciences
 * - Gershenfeld, The Nature of Mathematical Modeling
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemDescription,
    modelingGoal = '',
    knownPhysics = [],
    observations = {}
  } = inputs;

  // Phase 1: Document System Variables and Parameters
  const systemDocumentation = await ctx.task(systemDocumentationTask, {
    systemDescription,
    modelingGoal,
    observations
  });

  // Quality Gate: System must be documentable
  if (!systemDocumentation.variables || systemDocumentation.variables.length === 0) {
    return {
      success: false,
      error: 'Unable to identify system variables',
      phase: 'system-documentation',
      mathematicalModel: null
    };
  }

  // Breakpoint: Review system documentation
  await ctx.breakpoint({
    question: `Identified ${systemDocumentation.variables.length} variables and ${systemDocumentation.parameters.length} parameters. Review?`,
    title: 'System Documentation Review',
    context: {
      runId: ctx.runId,
      systemDescription,
      variables: systemDocumentation.variables,
      parameters: systemDocumentation.parameters,
      files: [{
        path: `artifacts/phase1-system-documentation.json`,
        format: 'json',
        content: systemDocumentation
      }]
    }
  });

  // Phase 2: State and Justify Assumptions
  const assumptionDocumentation = await ctx.task(assumptionDocumentationTask, {
    systemDescription,
    systemDocumentation,
    knownPhysics,
    modelingGoal
  });

  // Phase 3: Apply Dimensional Analysis
  const dimensionalAnalysis = await ctx.task(dimensionalAnalysisTask, {
    systemDocumentation,
    assumptionDocumentation,
    knownPhysics
  });

  // Phase 4: Derive Governing Equations
  const equationDerivation = await ctx.task(equationDerivationTask, {
    systemDocumentation,
    assumptionDocumentation,
    dimensionalAnalysis,
    knownPhysics,
    modelingGoal
  });

  // Phase 5: Validate Against Known Limits
  const limitValidation = await ctx.task(limitValidationTask, {
    equationDerivation,
    assumptionDocumentation,
    dimensionalAnalysis,
    observations
  });

  // Final Breakpoint: Model Formulation Complete
  await ctx.breakpoint({
    question: `Mathematical model formulation complete. ${equationDerivation.equations.length} governing equations derived. Validate model?`,
    title: 'Model Formulation Complete',
    context: {
      runId: ctx.runId,
      systemDescription,
      equations: equationDerivation.equations,
      validationPassed: limitValidation.allChecksPassed,
      files: [
        { path: `artifacts/mathematical-model.json`, format: 'json', content: equationDerivation },
        { path: `artifacts/model-validation.json`, format: 'json', content: limitValidation }
      ]
    }
  });

  return {
    success: true,
    systemDescription,
    mathematicalModel: {
      variables: systemDocumentation.variables,
      parameters: systemDocumentation.parameters,
      equations: equationDerivation.equations,
      dimensionlessGroups: dimensionalAnalysis.dimensionlessGroups
    },
    assumptions: assumptionDocumentation.assumptions,
    governingEquations: equationDerivation.equations,
    dimensionalAnalysis: {
      dimensionMatrix: dimensionalAnalysis.dimensionMatrix,
      piGroups: dimensionalAnalysis.piGroups,
      characteristicScales: dimensionalAnalysis.characteristicScales
    },
    validation: {
      limitChecks: limitValidation.limitChecks,
      consistencyChecks: limitValidation.consistencyChecks,
      allPassed: limitValidation.allChecksPassed
    },
    modelDocumentation: equationDerivation.documentation,
    metadata: {
      processId: 'specializations/domains/science/mathematics/model-formulation-workflow',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const systemDocumentationTask = defineTask('system-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Document System Variables and Parameters`,
  agent: {
    name: 'applied-mathematician',
    skills: ['sympy-computer-algebra', 'latex-math-formatter', 'scientific-literature-search'],
    prompt: {
      role: 'Mathematical Modeling Expert',
      task: 'Document all variables and parameters for the system being modeled',
      context: {
        systemDescription: args.systemDescription,
        modelingGoal: args.modelingGoal,
        observations: args.observations
      },
      instructions: [
        '1. Identify all state variables (quantities that change over time/space)',
        '2. Identify independent variables (time, space coordinates)',
        '3. Identify system parameters (constants, rates)',
        '4. Assign symbols to all quantities',
        '5. Document physical meaning of each quantity',
        '6. Specify units and dimensions for each quantity',
        '7. Identify typical values and ranges',
        '8. Distinguish between measured and derived quantities',
        '9. Identify control variables if applicable',
        '10. Create comprehensive variable glossary'
      ],
      outputFormat: 'JSON object with system documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['variables', 'parameters', 'independentVariables'],
      properties: {
        variables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              name: { type: 'string' },
              meaning: { type: 'string' },
              units: { type: 'string' },
              dimensions: { type: 'string' },
              typicalValue: { type: 'string' },
              range: { type: 'object' }
            }
          }
        },
        parameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              name: { type: 'string' },
              meaning: { type: 'string' },
              units: { type: 'string' },
              value: { type: 'string' },
              source: { type: 'string' }
            }
          }
        },
        independentVariables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              name: { type: 'string' },
              domain: { type: 'string' }
            }
          }
        },
        controlVariables: { type: 'array', items: { type: 'object' } },
        glossary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'model-formulation', 'documentation']
}));

export const assumptionDocumentationTask = defineTask('assumption-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: State and Justify Assumptions`,
  agent: {
    name: 'applied-mathematician',
    skills: ['sympy-computer-algebra', 'latex-math-formatter', 'scientific-literature-search'],
    prompt: {
      role: 'Scientific Modeling Specialist',
      task: 'State and justify all modeling assumptions',
      context: {
        systemDescription: args.systemDescription,
        systemDocumentation: args.systemDocumentation,
        knownPhysics: args.knownPhysics,
        modelingGoal: args.modelingGoal
      },
      instructions: [
        '1. List all simplifying assumptions',
        '2. Provide physical/mathematical justification for each',
        '3. Identify which phenomena are neglected',
        '4. State conditions under which assumptions are valid',
        '5. Quantify approximation errors where possible',
        '6. Identify which assumptions are critical vs minor',
        '7. Document conservation laws assumed',
        '8. State constitutive relations used',
        '9. Document boundary and initial condition assumptions',
        '10. Rank assumptions by importance and sensitivity'
      ],
      outputFormat: 'JSON object with assumption documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['assumptions', 'conservationLaws'],
      properties: {
        assumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              statement: { type: 'string' },
              justification: { type: 'string' },
              validityConditions: { type: 'string' },
              criticality: { type: 'string', enum: ['critical', 'important', 'minor'] },
              neglectedEffects: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        conservationLaws: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              law: { type: 'string' },
              mathematicalForm: { type: 'string' },
              applicability: { type: 'string' }
            }
          }
        },
        constitutiveRelations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              relation: { type: 'string' },
              equation: { type: 'string' },
              validity: { type: 'string' }
            }
          }
        },
        boundaryConditions: { type: 'array', items: { type: 'string' } },
        initialConditions: { type: 'array', items: { type: 'string' } },
        assumptionHierarchy: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'model-formulation', 'assumptions']
}));

export const dimensionalAnalysisTask = defineTask('dimensional-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Apply Dimensional Analysis`,
  agent: {
    name: 'applied-mathematician',
    skills: ['sympy-computer-algebra', 'numerical-linear-algebra-toolkit', 'latex-math-formatter'],
    prompt: {
      role: 'Dimensional Analysis Expert',
      task: 'Apply dimensional analysis to identify dimensionless groups and scales',
      context: {
        systemDocumentation: args.systemDocumentation,
        assumptionDocumentation: args.assumptionDocumentation,
        knownPhysics: args.knownPhysics
      },
      instructions: [
        '1. List all dimensional quantities with their dimensions',
        '2. Construct the dimension matrix',
        '3. Apply Buckingham Pi theorem',
        '4. Identify all independent dimensionless groups',
        '5. Name recognized dimensionless numbers (Re, Pr, etc.)',
        '6. Identify characteristic scales (length, time, velocity)',
        '7. Nondimensionalize the key variables',
        '8. Identify dominant balances',
        '9. Determine scaling regimes',
        '10. Document physical interpretation of dimensionless groups'
      ],
      outputFormat: 'JSON object with dimensional analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['dimensionMatrix', 'piGroups', 'characteristicScales'],
      properties: {
        dimensionMatrix: {
          type: 'object',
          properties: {
            quantities: { type: 'array', items: { type: 'string' } },
            baseDimensions: { type: 'array', items: { type: 'string' } },
            matrix: { type: 'array', items: { type: 'array' } }
          }
        },
        piGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              expression: { type: 'string' },
              physicalMeaning: { type: 'string' },
              typicalValue: { type: 'string' }
            }
          }
        },
        characteristicScales: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quantity: { type: 'string' },
              scale: { type: 'string' },
              expression: { type: 'string' }
            }
          }
        },
        dimensionlessGroups: { type: 'array', items: { type: 'string' } },
        nondimensionalVariables: { type: 'array', items: { type: 'object' } },
        dominantBalances: { type: 'array', items: { type: 'string' } },
        scalingRegimes: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'model-formulation', 'dimensional-analysis']
}));

export const equationDerivationTask = defineTask('equation-derivation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Derive Governing Equations`,
  agent: {
    name: 'applied-mathematician',
    skills: ['sympy-computer-algebra', 'pde-solver-library', 'latex-math-formatter'],
    prompt: {
      role: 'Mathematical Physics Expert',
      task: 'Derive governing equations for the mathematical model',
      context: {
        systemDocumentation: args.systemDocumentation,
        assumptionDocumentation: args.assumptionDocumentation,
        dimensionalAnalysis: args.dimensionalAnalysis,
        knownPhysics: args.knownPhysics,
        modelingGoal: args.modelingGoal
      },
      instructions: [
        '1. Start from conservation principles where applicable',
        '2. Apply constitutive relations',
        '3. Derive differential equations governing the system',
        '4. Include boundary conditions',
        '5. Include initial conditions for time-dependent problems',
        '6. Write equations in both dimensional and dimensionless form',
        '7. Classify equation type (ODE, PDE, algebraic, integral)',
        '8. Identify equation properties (linear, nonlinear, order)',
        '9. Document derivation steps',
        '10. Verify dimensional consistency'
      ],
      outputFormat: 'JSON object with governing equations'
    },
    outputSchema: {
      type: 'object',
      required: ['equations', 'boundaryConditions', 'initialConditions'],
      properties: {
        equations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              dimensionalForm: { type: 'string' },
              dimensionlessForm: { type: 'string' },
              type: { type: 'string' },
              order: { type: 'number' },
              linear: { type: 'boolean' },
              derivation: { type: 'string' }
            }
          }
        },
        boundaryConditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              type: { type: 'string' },
              equation: { type: 'string' }
            }
          }
        },
        initialConditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              condition: { type: 'string' }
            }
          }
        },
        auxiliaryRelations: { type: 'array', items: { type: 'string' } },
        systemClassification: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            wellPosed: { type: 'boolean' },
            stiffness: { type: 'string' }
          }
        },
        documentation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'model-formulation', 'equations']
}));

export const limitValidationTask = defineTask('limit-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Validate Against Known Limits`,
  agent: {
    name: 'applied-mathematician',
    skills: ['sympy-computer-algebra', 'benchmark-suite-manager', 'scientific-literature-search'],
    prompt: {
      role: 'Model Validation Expert',
      task: 'Validate the mathematical model against known limiting cases',
      context: {
        equationDerivation: args.equationDerivation,
        assumptionDocumentation: args.assumptionDocumentation,
        dimensionalAnalysis: args.dimensionalAnalysis,
        observations: args.observations
      },
      instructions: [
        '1. Identify asymptotic limits to test',
        '2. Check behavior as parameters approach 0 or infinity',
        '3. Verify conservation properties',
        '4. Check steady-state solutions',
        '5. Verify known analytical solutions where available',
        '6. Check dimensional consistency of all equations',
        '7. Verify boundary condition satisfaction',
        '8. Check physical plausibility of solutions',
        '9. Compare with limiting cases from literature',
        '10. Document all validation checks'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['limitChecks', 'consistencyChecks', 'allChecksPassed'],
      properties: {
        limitChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              limit: { type: 'string' },
              expectedBehavior: { type: 'string' },
              modelBehavior: { type: 'string' },
              passed: { type: 'boolean' }
            }
          }
        },
        consistencyChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              result: { type: 'string' },
              passed: { type: 'boolean' }
            }
          }
        },
        conservationChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quantity: { type: 'string' },
              conserved: { type: 'boolean' }
            }
          }
        },
        steadyStateSolutions: { type: 'array', items: { type: 'object' } },
        knownSolutionComparisons: { type: 'array', items: { type: 'object' } },
        allChecksPassed: { type: 'boolean' },
        failedChecks: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'model-formulation', 'validation']
}));
