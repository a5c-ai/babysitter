/**
 * @process specializations/domains/science/mathematics/pde-solver-selection
 * @description Guide selection of appropriate numerical methods for partial differential equations
 * based on problem characteristics (elliptic, parabolic, hyperbolic), boundary conditions, and accuracy requirements.
 * @inputs { pdeDescription: string, pdeEquation?: string, boundaryConditions?: object, domain?: object, accuracyRequirements?: object }
 * @outputs { success: boolean, pdeClassification: object, recommendedMethods: array, discretizationAdvice: object, solverRecommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/pde-solver-selection', {
 *   pdeDescription: 'Heat diffusion in 2D rectangular domain',
 *   pdeEquation: 'u_t = alpha * (u_xx + u_yy)',
 *   boundaryConditions: { type: 'Dirichlet', values: 'fixed temperature on all boundaries' },
 *   domain: { shape: 'rectangle', dimensions: [1, 1] },
 *   accuracyRequirements: { spatialOrder: 2, temporalOrder: 2, relativeTolerance: 1e-6 }
 * });
 *
 * @references
 * - LeVeque, Finite Difference Methods for Ordinary and Partial Differential Equations
 * - Morton & Mayers, Numerical Solution of PDEs
 * - Hughes, The Finite Element Method
 * - Trefethen, Spectral Methods in MATLAB
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    pdeDescription,
    pdeEquation = '',
    boundaryConditions = {},
    domain = {},
    accuracyRequirements = { spatialOrder: 2, temporalOrder: 2, relativeTolerance: 1e-6 }
  } = inputs;

  // Phase 1: Classify PDE Type and Characteristics
  const pdeClassification = await ctx.task(pdeClassificationTask, {
    pdeDescription,
    pdeEquation,
    boundaryConditions
  });

  // Quality Gate: PDE must be classifiable
  if (!pdeClassification.type) {
    return {
      success: false,
      error: 'Unable to classify PDE type',
      phase: 'classification',
      recommendedMethods: null
    };
  }

  // Breakpoint: Review PDE classification
  await ctx.breakpoint({
    question: `PDE classified as ${pdeClassification.type}. Is this correct?`,
    title: 'PDE Classification Review',
    context: {
      runId: ctx.runId,
      pdeDescription,
      classification: pdeClassification,
      files: [{
        path: `artifacts/phase1-classification.json`,
        format: 'json',
        content: pdeClassification
      }]
    }
  });

  // Phase 2: Assess Boundary Condition Types
  const boundaryAnalysis = await ctx.task(boundaryAnalysisTask, {
    pdeClassification,
    boundaryConditions,
    domain
  });

  // Phase 3: Recommend Discretization Methods
  const discretizationRecommendation = await ctx.task(discretizationRecommendationTask, {
    pdeClassification,
    boundaryAnalysis,
    domain,
    accuracyRequirements
  });

  // Phase 4: Suggest Appropriate Solvers
  const solverSelection = await ctx.task(solverSelectionTask, {
    pdeClassification,
    discretizationRecommendation,
    domain,
    accuracyRequirements
  });

  // Phase 5: Estimate Computational Requirements
  const computationalEstimate = await ctx.task(computationalEstimateTask, {
    pdeClassification,
    discretizationRecommendation,
    solverSelection,
    domain,
    accuracyRequirements
  });

  // Final Breakpoint: Selection Complete
  await ctx.breakpoint({
    question: `PDE solver selection complete. Primary recommendation: ${solverSelection.primaryRecommendation}. Review?`,
    title: 'Solver Selection Complete',
    context: {
      runId: ctx.runId,
      pdeDescription,
      pdeType: pdeClassification.type,
      recommendedMethod: discretizationRecommendation.primaryMethod,
      recommendedSolver: solverSelection.primaryRecommendation,
      files: [
        { path: `artifacts/solver-selection.json`, format: 'json', content: { discretizationRecommendation, solverSelection } }
      ]
    }
  });

  return {
    success: true,
    pdeDescription,
    pdeClassification: {
      type: pdeClassification.type,
      characteristics: pdeClassification.characteristics,
      wellPosedness: pdeClassification.wellPosedness
    },
    boundaryConditionAnalysis: boundaryAnalysis,
    recommendedMethods: discretizationRecommendation.methods,
    discretizationAdvice: {
      spatialDiscretization: discretizationRecommendation.spatialMethod,
      temporalDiscretization: discretizationRecommendation.temporalMethod,
      gridRequirements: discretizationRecommendation.gridRequirements,
      stabilityConditions: discretizationRecommendation.stabilityConditions
    },
    solverRecommendations: solverSelection.recommendations,
    computationalRequirements: computationalEstimate,
    metadata: {
      processId: 'specializations/domains/science/mathematics/pde-solver-selection',
      accuracyRequirements,
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const pdeClassificationTask = defineTask('pde-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Classify PDE Type and Characteristics`,
  agent: {
    name: 'pde-expert',
    skills: ['pde-solver-library', 'sympy-computer-algebra', 'numerical-linear-algebra-toolkit'],
    prompt: {
      role: 'PDE Expert specializing in mathematical physics and numerical methods',
      task: 'Classify the given PDE and determine its mathematical characteristics',
      context: {
        pdeDescription: args.pdeDescription,
        pdeEquation: args.pdeEquation,
        boundaryConditions: args.boundaryConditions
      },
      instructions: [
        '1. Identify the type of PDE (elliptic, parabolic, hyperbolic, mixed)',
        '2. Determine the order of the PDE',
        '3. Identify if linear or nonlinear',
        '4. Determine if homogeneous or inhomogeneous',
        '5. Analyze characteristic curves/surfaces',
        '6. Assess well-posedness (existence, uniqueness, stability)',
        '7. Identify any special structure (conservation laws, symmetries)',
        '8. Determine if time-dependent or steady-state',
        '9. Identify coefficient properties (constant, variable, smooth)',
        '10. Note any singular or degenerate regions'
      ],
      outputFormat: 'JSON object with PDE classification'
    },
    outputSchema: {
      type: 'object',
      required: ['type', 'order', 'characteristics'],
      properties: {
        type: { type: 'string', enum: ['elliptic', 'parabolic', 'hyperbolic', 'mixed', 'degenerate'] },
        order: { type: 'number' },
        linear: { type: 'boolean' },
        homogeneous: { type: 'boolean' },
        timeDependent: { type: 'boolean' },
        characteristics: {
          type: 'object',
          properties: {
            characteristicType: { type: 'string' },
            characteristicEquation: { type: 'string' },
            domainOfDependence: { type: 'string' }
          }
        },
        wellPosedness: {
          type: 'object',
          properties: {
            existence: { type: 'boolean' },
            uniqueness: { type: 'boolean' },
            stability: { type: 'boolean' },
            notes: { type: 'string' }
          }
        },
        coefficients: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['constant', 'variable', 'nonlinear'] },
            smoothness: { type: 'string' }
          }
        },
        specialStructure: { type: 'array', items: { type: 'string' } },
        singularRegions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'pde-solver', 'classification']
}));

export const boundaryAnalysisTask = defineTask('boundary-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Assess Boundary Condition Types`,
  agent: {
    name: 'pde-expert',
    skills: ['pde-solver-library', 'sympy-computer-algebra', 'numerical-linear-algebra-toolkit'],
    prompt: {
      role: 'Boundary Value Problem Expert',
      task: 'Analyze boundary conditions and their implications for numerical methods',
      context: {
        pdeClassification: args.pdeClassification,
        boundaryConditions: args.boundaryConditions,
        domain: args.domain
      },
      instructions: [
        '1. Classify boundary condition types (Dirichlet, Neumann, Robin, periodic)',
        '2. Assess compatibility with PDE type',
        '3. Check for corner/edge singularities',
        '4. Analyze far-field conditions for unbounded domains',
        '5. Identify any interface conditions',
        '6. Assess smoothness requirements at boundaries',
        '7. Check boundary condition compatibility at corners',
        '8. Identify any moving boundary issues',
        '9. Analyze initial conditions for time-dependent problems',
        '10. Document discretization implications'
      ],
      outputFormat: 'JSON object with boundary condition analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['boundaryTypes', 'compatibility'],
      properties: {
        boundaryTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              boundary: { type: 'string' },
              type: { type: 'string', enum: ['Dirichlet', 'Neumann', 'Robin', 'periodic', 'outflow', 'symmetry'] },
              specification: { type: 'string' }
            }
          }
        },
        compatibility: {
          type: 'object',
          properties: {
            compatible: { type: 'boolean' },
            issues: { type: 'array', items: { type: 'string' } }
          }
        },
        singularities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              type: { type: 'string' },
              treatment: { type: 'string' }
            }
          }
        },
        initialConditions: { type: 'object' },
        discretizationImplications: { type: 'array', items: { type: 'string' } },
        cornerTreatment: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'pde-solver', 'boundary-conditions']
}));

export const discretizationRecommendationTask = defineTask('discretization-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Recommend Discretization Methods`,
  agent: {
    name: 'numerical-analyst',
    skills: ['pde-solver-library', 'numerical-linear-algebra-toolkit', 'benchmark-suite-manager'],
    prompt: {
      role: 'Numerical Methods Expert for PDEs',
      task: 'Recommend appropriate discretization methods for the PDE',
      context: {
        pdeClassification: args.pdeClassification,
        boundaryAnalysis: args.boundaryAnalysis,
        domain: args.domain,
        accuracyRequirements: args.accuracyRequirements
      },
      instructions: [
        '1. Recommend spatial discretization method (FD, FE, FV, spectral)',
        '2. Recommend temporal discretization if time-dependent (explicit, implicit, IMEX)',
        '3. Specify grid/mesh requirements',
        '4. Determine stability conditions (CFL, von Neumann)',
        '5. Recommend basis functions if FEM',
        '6. Specify quadrature requirements',
        '7. Address adaptive refinement strategies',
        '8. Consider multi-grid possibilities',
        '9. Recommend schemes meeting accuracy requirements',
        '10. Provide method comparisons for this problem type'
      ],
      outputFormat: 'JSON object with discretization recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryMethod', 'spatialMethod', 'methods'],
      properties: {
        primaryMethod: { type: 'string' },
        spatialMethod: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['finite-difference', 'finite-element', 'finite-volume', 'spectral', 'meshless'] },
            order: { type: 'number' },
            scheme: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        temporalMethod: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['explicit', 'implicit', 'semi-implicit', 'IMEX'] },
            scheme: { type: 'string' },
            order: { type: 'number' }
          }
        },
        gridRequirements: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            resolution: { type: 'string' },
            refinement: { type: 'string' }
          }
        },
        stabilityConditions: {
          type: 'object',
          properties: {
            cfl: { type: 'string' },
            vonNeumann: { type: 'string' },
            constraints: { type: 'array', items: { type: 'string' } }
          }
        },
        methods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              suitability: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        adaptiveStrategy: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'pde-solver', 'discretization']
}));

export const solverSelectionTask = defineTask('solver-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Suggest Appropriate Solvers`,
  agent: {
    name: 'numerical-analyst',
    skills: ['numerical-linear-algebra-toolkit', 'pde-solver-library', 'benchmark-suite-manager'],
    prompt: {
      role: 'Linear/Nonlinear Solver Expert',
      task: 'Recommend appropriate solvers for the discretized system',
      context: {
        pdeClassification: args.pdeClassification,
        discretizationRecommendation: args.discretizationRecommendation,
        domain: args.domain,
        accuracyRequirements: args.accuracyRequirements
      },
      instructions: [
        '1. Recommend linear solver for resulting systems (direct, iterative)',
        '2. Recommend preconditioners for iterative methods',
        '3. Address nonlinear solver needs (Newton, fixed-point)',
        '4. Recommend multigrid strategies if applicable',
        '5. Consider domain decomposition approaches',
        '6. Address time-stepping solver coupling',
        '7. Recommend software libraries and tools',
        '8. Provide convergence criteria recommendations',
        '9. Address parallel solver considerations',
        '10. Provide solver comparison for this problem'
      ],
      outputFormat: 'JSON object with solver recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryRecommendation', 'recommendations'],
      properties: {
        primaryRecommendation: { type: 'string' },
        linearSolver: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['direct', 'iterative', 'hybrid'] },
            method: { type: 'string' },
            preconditioner: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        nonlinearSolver: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            lineSearch: { type: 'string' },
            convergenceCriteria: { type: 'string' }
          }
        },
        multigrid: {
          type: 'object',
          properties: {
            applicable: { type: 'boolean' },
            type: { type: 'string' },
            levels: { type: 'number' }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              solver: { type: 'string' },
              suitability: { type: 'string' },
              library: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        softwareRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              software: { type: 'string' },
              language: { type: 'string' },
              features: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        parallelConsiderations: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'pde-solver', 'solver-selection']
}));

export const computationalEstimateTask = defineTask('computational-estimate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Estimate Computational Requirements`,
  agent: {
    name: 'numerical-analyst',
    skills: ['benchmark-suite-manager', 'numerical-linear-algebra-toolkit', 'pde-solver-library'],
    prompt: {
      role: 'Scientific Computing Resource Analyst',
      task: 'Estimate computational requirements for the recommended approach',
      context: {
        pdeClassification: args.pdeClassification,
        discretizationRecommendation: args.discretizationRecommendation,
        solverSelection: args.solverSelection,
        domain: args.domain,
        accuracyRequirements: args.accuracyRequirements
      },
      instructions: [
        '1. Estimate memory requirements for mesh/grid storage',
        '2. Estimate memory for solution and intermediate arrays',
        '3. Estimate FLOP count per time step or iteration',
        '4. Estimate total runtime based on problem size',
        '5. Consider I/O requirements for large problems',
        '6. Assess parallelization efficiency',
        '7. Estimate scaling with problem size',
        '8. Identify computational bottlenecks',
        '9. Recommend hardware requirements',
        '10. Provide resource planning guidelines'
      ],
      outputFormat: 'JSON object with computational estimates'
    },
    outputSchema: {
      type: 'object',
      required: ['memoryEstimate', 'computeEstimate'],
      properties: {
        memoryEstimate: {
          type: 'object',
          properties: {
            mesh: { type: 'string' },
            solution: { type: 'string' },
            solver: { type: 'string' },
            total: { type: 'string' }
          }
        },
        computeEstimate: {
          type: 'object',
          properties: {
            flopsPerStep: { type: 'string' },
            totalSteps: { type: 'string' },
            estimatedRuntime: { type: 'string' }
          }
        },
        scalingAnalysis: {
          type: 'object',
          properties: {
            memoryScaling: { type: 'string' },
            timeScaling: { type: 'string' },
            parallelEfficiency: { type: 'string' }
          }
        },
        hardwareRecommendation: {
          type: 'object',
          properties: {
            minMemory: { type: 'string' },
            recommendedCores: { type: 'number' },
            gpuBenefit: { type: 'boolean' }
          }
        },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        optimizationSuggestions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'pde-solver', 'computational-requirements']
}));
