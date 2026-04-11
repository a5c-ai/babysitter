/**
 * @process specializations/domains/science/physics/mathematical-model-derivation
 * @description Systematic derivation of mathematical models from first principles to describe physical systems,
 * including Hamiltonian/Lagrangian formulations, symmetry analysis, and validation against known cases.
 * @inputs { systemName: string, physicalDomain: string, degreesOfFreedom?: string[], constraints?: string[], knownLimits?: string[] }
 * @outputs { success: boolean, mathematicalModel: object, derivationNotebook: object, validationReport: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/physics/mathematical-model-derivation', {
 *   systemName: 'Coupled Harmonic Oscillators',
 *   physicalDomain: 'Classical Mechanics',
 *   degreesOfFreedom: ['position_1', 'position_2', 'momentum_1', 'momentum_2'],
 *   constraints: ['total_energy_conserved', 'periodic_boundary_conditions'],
 *   knownLimits: ['weak_coupling_limit', 'single_oscillator_limit']
 * });
 *
 * @references
 * - Goldstein, Classical Mechanics
 * - Landau & Lifshitz, Mechanics
 * - Arnold, Mathematical Methods of Classical Mechanics
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName,
    physicalDomain,
    degreesOfFreedom = [],
    constraints = [],
    knownLimits = []
  } = inputs;

  // Phase 1: System Definition and Degrees of Freedom
  const systemDefinition = await ctx.task(systemDefinitionTask, {
    systemName,
    physicalDomain,
    degreesOfFreedom,
    constraints
  });

  // Quality Gate: System must be well-defined
  if (!systemDefinition.generalizedCoordinates || systemDefinition.generalizedCoordinates.length === 0) {
    return {
      success: false,
      error: 'System degrees of freedom not properly defined',
      phase: 'system-definition',
      mathematicalModel: null
    };
  }

  // Breakpoint: Review system definition
  await ctx.breakpoint({
    question: `Review system definition for ${systemName}. Are the generalized coordinates and constraints correctly identified?`,
    title: 'System Definition Review',
    context: {
      runId: ctx.runId,
      systemName,
      generalizedCoordinates: systemDefinition.generalizedCoordinates,
      constraints: systemDefinition.constraints,
      files: [{
        path: `artifacts/phase1-system-definition.json`,
        format: 'json',
        content: systemDefinition
      }]
    }
  });

  // Phase 2: Lagrangian/Hamiltonian Formulation
  const formulation = await ctx.task(formulationTask, {
    systemName,
    physicalDomain,
    systemDefinition
  });

  // Phase 3: Symmetry and Conservation Law Analysis
  const symmetryAnalysis = await ctx.task(symmetryAnalysisTask, {
    systemName,
    formulation,
    systemDefinition
  });

  // Breakpoint: Review symmetries and conservation laws
  await ctx.breakpoint({
    question: `Review identified symmetries for ${systemName}. Are all relevant conservation laws derived?`,
    title: 'Symmetry Analysis Review',
    context: {
      runId: ctx.runId,
      symmetries: symmetryAnalysis.symmetries,
      conservedQuantities: symmetryAnalysis.conservedQuantities,
      files: [{
        path: `artifacts/phase3-symmetry-analysis.json`,
        format: 'json',
        content: symmetryAnalysis
      }]
    }
  });

  // Phase 4: Equations of Motion Derivation
  const equationsOfMotion = await ctx.task(equationsOfMotionTask, {
    systemName,
    formulation,
    symmetryAnalysis
  });

  // Phase 5: Approximations and Simplifications
  const approximations = await ctx.task(approximationsTask, {
    systemName,
    equationsOfMotion,
    constraints,
    physicalDomain
  });

  // Phase 6: Limiting Case Validation
  const limitingCaseValidation = await ctx.task(limitingCaseValidationTask, {
    systemName,
    equationsOfMotion,
    approximations,
    knownLimits
  });

  // Quality Gate: Must pass limiting case validation
  const validationPassed = limitingCaseValidation.allCasesPassed;
  if (!validationPassed) {
    await ctx.breakpoint({
      question: `Limiting case validation failed for ${systemName}. Review failed cases and decide whether to proceed.`,
      title: 'Validation Warning',
      context: {
        runId: ctx.runId,
        failedCases: limitingCaseValidation.failedCases,
        recommendation: 'Review derivation for errors or document known limitations'
      }
    });
  }

  // Phase 7: Documentation Generation
  const documentation = await ctx.task(documentationTask, {
    systemName,
    physicalDomain,
    systemDefinition,
    formulation,
    symmetryAnalysis,
    equationsOfMotion,
    approximations,
    limitingCaseValidation
  });

  // Final Breakpoint: Model Approval
  await ctx.breakpoint({
    question: `Mathematical model derivation complete for ${systemName}. Approve model for publication/use?`,
    title: 'Model Derivation Approval',
    context: {
      runId: ctx.runId,
      systemName,
      validationPassed,
      files: [
        { path: `artifacts/mathematical-model.json`, format: 'json', content: documentation.modelDocument },
        { path: `artifacts/derivation-notebook.md`, format: 'markdown', content: documentation.derivationNotebook }
      ]
    }
  });

  return {
    success: true,
    systemName,
    physicalDomain,
    mathematicalModel: {
      lagrangian: formulation.lagrangian,
      hamiltonian: formulation.hamiltonian,
      equationsOfMotion: equationsOfMotion.equations,
      conservedQuantities: symmetryAnalysis.conservedQuantities
    },
    derivationNotebook: documentation.derivationNotebook,
    validationReport: {
      limitingCases: limitingCaseValidation,
      approximationsValid: approximations.validityConditions
    },
    symmetries: symmetryAnalysis.symmetries,
    approximations: approximations.simplifications,
    metadata: {
      processId: 'specializations/domains/science/physics/mathematical-model-derivation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const systemDefinitionTask = defineTask('system-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: System Definition - ${args.systemName}`,
  agent: {
    name: 'theoretical-model-developer',
    skills: ['scipy-optimization-toolkit', 'latex-physics-documenter', 'qiskit-quantum-simulator'],
    prompt: {
      role: 'Theoretical Physicist with expertise in analytical mechanics',
      task: 'Define the physical system with its degrees of freedom and constraints',
      context: {
        systemName: args.systemName,
        physicalDomain: args.physicalDomain,
        suggestedDegreesOfFreedom: args.degreesOfFreedom,
        suggestedConstraints: args.constraints
      },
      instructions: [
        '1. Identify all physical components and their interactions in the system',
        '2. Define generalized coordinates (q_i) that completely describe the system configuration',
        '3. Identify holonomic and non-holonomic constraints',
        '4. Determine the number of true degrees of freedom (N - number of constraints)',
        '5. Define the configuration space and phase space dimensions',
        '6. Identify any external forces or potentials acting on the system',
        '7. Document boundary conditions if applicable',
        '8. Specify the relevant physical parameters and their typical ranges',
        '9. Identify any gauge freedoms or redundant descriptions',
        '10. Document assumptions about the physical regime (classical, relativistic, quantum)'
      ],
      outputFormat: 'JSON object with complete system definition'
    },
    outputSchema: {
      type: 'object',
      required: ['generalizedCoordinates', 'constraints', 'degreesOfFreedom'],
      properties: {
        generalizedCoordinates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              range: { type: 'string' },
              units: { type: 'string' }
            }
          }
        },
        conjugateMomenta: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              conjugateTo: { type: 'string' },
              expression: { type: 'string' }
            }
          }
        },
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['holonomic', 'non-holonomic', 'rheonomic', 'scleronomic'] },
              expression: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        degreesOfFreedom: { type: 'number' },
        configurationSpaceDimension: { type: 'number' },
        phaseSpaceDimension: { type: 'number' },
        externalForces: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              expression: { type: 'string' },
              isConservative: { type: 'boolean' }
            }
          }
        },
        physicalParameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              name: { type: 'string' },
              typicalValue: { type: 'string' },
              units: { type: 'string' }
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
  labels: ['physics', 'theoretical', 'model-derivation', 'system-definition']
}));

export const formulationTask = defineTask('lagrangian-hamiltonian', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Lagrangian/Hamiltonian Formulation - ${args.systemName}`,
  agent: {
    name: 'theoretical-model-developer',
    skills: ['scipy-optimization-toolkit', 'latex-physics-documenter'],
    prompt: {
      role: 'Theoretical Physicist with expertise in analytical mechanics and variational principles',
      task: 'Derive the Lagrangian and Hamiltonian formulations for the physical system',
      context: {
        systemName: args.systemName,
        physicalDomain: args.physicalDomain,
        systemDefinition: args.systemDefinition
      },
      instructions: [
        '1. Write the kinetic energy T in terms of generalized coordinates and velocities',
        '2. Write the potential energy V in terms of generalized coordinates',
        '3. Construct the Lagrangian L = T - V',
        '4. Verify the Lagrangian is properly defined (correct dimensions, gauge invariance)',
        '5. Compute conjugate momenta p_i = dL/dq_i_dot',
        '6. Perform Legendre transformation to obtain Hamiltonian H',
        '7. Express H in terms of (q, p) coordinates (canonical form)',
        '8. Identify any constraints in the Hamiltonian formulation',
        '9. Check for any singular Lagrangians (constraints from momenta definition)',
        '10. Document any gauge choices or coordinate system selections made'
      ],
      outputFormat: 'JSON object with Lagrangian and Hamiltonian formulations'
    },
    outputSchema: {
      type: 'object',
      required: ['lagrangian', 'hamiltonian'],
      properties: {
        kineticEnergy: {
          type: 'object',
          properties: {
            expression: { type: 'string' },
            matrixForm: { type: 'string' },
            derivation: { type: 'string' }
          }
        },
        potentialEnergy: {
          type: 'object',
          properties: {
            expression: { type: 'string' },
            derivation: { type: 'string' }
          }
        },
        lagrangian: {
          type: 'object',
          properties: {
            expression: { type: 'string' },
            simplifiedForm: { type: 'string' },
            dimensions: { type: 'string' }
          }
        },
        conjugateMomenta: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              coordinate: { type: 'string' },
              momentum: { type: 'string' },
              expression: { type: 'string' }
            }
          }
        },
        hamiltonian: {
          type: 'object',
          properties: {
            expression: { type: 'string' },
            canonicalForm: { type: 'string' },
            physicalInterpretation: { type: 'string' }
          }
        },
        legendreTransformation: {
          type: 'object',
          properties: {
            steps: { type: 'array', items: { type: 'string' } },
            invertibility: { type: 'string' }
          }
        },
        primaryConstraints: {
          type: 'array',
          items: { type: 'string' }
        },
        gaugeChoices: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['physics', 'theoretical', 'lagrangian', 'hamiltonian', 'analytical-mechanics']
}));

export const symmetryAnalysisTask = defineTask('symmetry-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Symmetry and Conservation Law Analysis - ${args.systemName}`,
  agent: {
    name: 'theoretical-model-developer',
    skills: ['pyscf-quantum-chemistry', 'qiskit-quantum-simulator'],
    prompt: {
      role: 'Theoretical Physicist with expertise in group theory and Noether theorem',
      task: 'Identify symmetries and derive conservation laws using Noether theorem',
      context: {
        systemName: args.systemName,
        formulation: args.formulation,
        systemDefinition: args.systemDefinition
      },
      instructions: [
        '1. Identify continuous symmetries (translations, rotations, boosts, gauge transformations)',
        '2. Identify discrete symmetries (parity, time reversal, particle exchange)',
        '3. Apply Noether theorem to derive conserved quantities for each continuous symmetry',
        '4. Verify conservation laws using Poisson brackets {Q, H} = 0',
        '5. Identify the Lie algebra structure of symmetry generators',
        '6. Compute Poisson brackets between conserved quantities',
        '7. Identify any hidden or dynamical symmetries',
        '8. Determine selection rules implied by symmetries',
        '9. Document any broken symmetries and their physical consequences',
        '10. Classify states/solutions by symmetry quantum numbers'
      ],
      outputFormat: 'JSON object with symmetry analysis and conservation laws'
    },
    outputSchema: {
      type: 'object',
      required: ['symmetries', 'conservedQuantities'],
      properties: {
        symmetries: {
          type: 'object',
          properties: {
            continuous: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  transformation: { type: 'string' },
                  generator: { type: 'string' },
                  lieGroup: { type: 'string' }
                }
              }
            },
            discrete: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  transformation: { type: 'string' },
                  eigenvalues: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        conservedQuantities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              symbol: { type: 'string' },
              expression: { type: 'string' },
              associatedSymmetry: { type: 'string' },
              noetherDerivation: { type: 'string' }
            }
          }
        },
        poissonBrackets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quantities: { type: 'array', items: { type: 'string' } },
              result: { type: 'string' }
            }
          }
        },
        lieAlgebra: {
          type: 'object',
          properties: {
            generators: { type: 'array', items: { type: 'string' } },
            commutationRelations: { type: 'array', items: { type: 'string' } },
            structure: { type: 'string' }
          }
        },
        selectionRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { type: 'string' },
              symmetryOrigin: { type: 'string' },
              physicalConsequence: { type: 'string' }
            }
          }
        },
        brokenSymmetries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symmetry: { type: 'string' },
              breakingMechanism: { type: 'string' },
              consequences: { type: 'string' }
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
  labels: ['physics', 'theoretical', 'symmetry', 'noether', 'conservation-laws']
}));

export const equationsOfMotionTask = defineTask('equations-of-motion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Equations of Motion Derivation - ${args.systemName}`,
  agent: {
    name: 'theoretical-model-developer',
    skills: ['scipy-optimization-toolkit', 'latex-physics-documenter'],
    prompt: {
      role: 'Theoretical Physicist with expertise in differential equations and dynamical systems',
      task: 'Derive and analyze the equations of motion for the physical system',
      context: {
        systemName: args.systemName,
        formulation: args.formulation,
        symmetryAnalysis: args.symmetryAnalysis
      },
      instructions: [
        '1. Apply Euler-Lagrange equations to derive equations of motion',
        '2. Alternatively, use Hamilton equations (dq/dt = dH/dp, dp/dt = -dH/dq)',
        '3. Simplify equations using identified conservation laws',
        '4. Identify fixed points and equilibrium solutions',
        '5. Linearize equations around equilibria to find normal modes',
        '6. Analyze stability of equilibrium points',
        '7. Identify any integrable cases and solve analytically if possible',
        '8. Determine characteristic time scales and frequencies',
        '9. Identify any chaos indicators (Lyapunov exponents if relevant)',
        '10. Document solution methods appropriate for these equations'
      ],
      outputFormat: 'JSON object with equations of motion and analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['equations', 'equilibria'],
      properties: {
        equations: {
          type: 'object',
          properties: {
            eulerLagrange: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  coordinate: { type: 'string' },
                  equation: { type: 'string' }
                }
              }
            },
            hamiltonEquations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  variable: { type: 'string' },
                  equation: { type: 'string' }
                }
              }
            },
            simplifiedForm: { type: 'array', items: { type: 'string' } }
          }
        },
        equilibria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              point: { type: 'string' },
              stability: { type: 'string', enum: ['stable', 'unstable', 'saddle', 'center', 'marginal'] },
              eigenvalues: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        normalModes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              frequency: { type: 'string' },
              eigenvector: { type: 'string' },
              physicalDescription: { type: 'string' }
            }
          }
        },
        analyticalSolutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              case: { type: 'string' },
              solution: { type: 'string' },
              conditions: { type: 'string' }
            }
          }
        },
        characteristicScales: {
          type: 'object',
          properties: {
            timeScales: { type: 'array', items: { type: 'string' } },
            lengthScales: { type: 'array', items: { type: 'string' } },
            frequencies: { type: 'array', items: { type: 'string' } }
          }
        },
        integrability: {
          type: 'object',
          properties: {
            isIntegrable: { type: 'boolean' },
            integralsOfMotion: { type: 'array', items: { type: 'string' } },
            notes: { type: 'string' }
          }
        },
        solutionMethods: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['physics', 'theoretical', 'equations-of-motion', 'dynamical-systems']
}));

export const approximationsTask = defineTask('approximations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Approximations and Simplifications - ${args.systemName}`,
  agent: {
    name: 'perturbation-theory-analyst',
    skills: ['scipy-optimization-toolkit', 'pyscf-quantum-chemistry'],
    prompt: {
      role: 'Theoretical Physicist with expertise in perturbation theory and asymptotic methods',
      task: 'Develop appropriate approximations and simplifications for the model',
      context: {
        systemName: args.systemName,
        equationsOfMotion: args.equationsOfMotion,
        constraints: args.constraints,
        physicalDomain: args.physicalDomain
      },
      instructions: [
        '1. Identify small parameters suitable for perturbative expansion',
        '2. Develop perturbation series to leading orders',
        '3. Identify adiabatic approximations if time scale separation exists',
        '4. Apply WKB approximation if applicable (semiclassical regime)',
        '5. Develop mean-field or variational approximations if useful',
        '6. Identify effective theories valid in limiting regimes',
        '7. Document validity conditions for each approximation',
        '8. Estimate errors and corrections from approximations',
        '9. Compare approximate solutions with exact results where available',
        '10. Recommend which approximations are most useful for typical applications'
      ],
      outputFormat: 'JSON object with approximations and their validity conditions'
    },
    outputSchema: {
      type: 'object',
      required: ['simplifications', 'validityConditions'],
      properties: {
        smallParameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              typicalValue: { type: 'string' },
              physicalMeaning: { type: 'string' }
            }
          }
        },
        simplifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              simplifiedEquations: { type: 'array', items: { type: 'string' } },
              conditions: { type: 'string' },
              errorEstimate: { type: 'string' }
            }
          }
        },
        perturbativeExpansions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quantity: { type: 'string' },
              expansionParameter: { type: 'string' },
              terms: { type: 'array', items: { type: 'string' } },
              convergenceRadius: { type: 'string' }
            }
          }
        },
        effectiveTheories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              validRegime: { type: 'string' },
              effectiveLagrangian: { type: 'string' },
              corrections: { type: 'string' }
            }
          }
        },
        validityConditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              approximation: { type: 'string' },
              condition: { type: 'string' },
              breakdown: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['physics', 'theoretical', 'approximations', 'perturbation-theory']
}));

export const limitingCaseValidationTask = defineTask('limiting-case-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Limiting Case Validation - ${args.systemName}`,
  agent: {
    name: 'theoretical-model-developer',
    skills: ['scipy-optimization-toolkit', 'latex-physics-documenter'],
    prompt: {
      role: 'Theoretical Physicist with expertise in model validation and limiting behavior',
      task: 'Validate the mathematical model against known limiting cases',
      context: {
        systemName: args.systemName,
        equationsOfMotion: args.equationsOfMotion,
        approximations: args.approximations,
        knownLimits: args.knownLimits
      },
      instructions: [
        '1. Identify all relevant limiting cases (weak coupling, strong coupling, classical limit, etc.)',
        '2. Take mathematical limits in the equations and verify expected behavior',
        '3. Compare limiting solutions with known exact results',
        '4. Check dimensional analysis and scaling behavior',
        '5. Verify that conservation laws hold in all limits',
        '6. Check correspondence with established theories in appropriate limits',
        '7. Document any discrepancies and their possible causes',
        '8. Identify the range of validity for the model',
        '9. Compare with experimental data where available',
        '10. Provide overall validation assessment with confidence level'
      ],
      outputFormat: 'JSON object with validation results for all limiting cases'
    },
    outputSchema: {
      type: 'object',
      required: ['limitingCases', 'allCasesPassed'],
      properties: {
        limitingCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              limitTaken: { type: 'string' },
              expectedResult: { type: 'string' },
              derivedResult: { type: 'string' },
              passed: { type: 'boolean' },
              notes: { type: 'string' }
            }
          }
        },
        dimensionalAnalysis: {
          type: 'object',
          properties: {
            passed: { type: 'boolean' },
            scalingRelations: { type: 'array', items: { type: 'string' } },
            dimensionlessParameters: { type: 'array', items: { type: 'string' } }
          }
        },
        conservationLawChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quantity: { type: 'string' },
              verified: { type: 'boolean' },
              method: { type: 'string' }
            }
          }
        },
        correspondenceChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theory: { type: 'string' },
              limit: { type: 'string' },
              agreement: { type: 'boolean' },
              notes: { type: 'string' }
            }
          }
        },
        experimentalComparison: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              experiment: { type: 'string' },
              quantity: { type: 'string' },
              modelPrediction: { type: 'string' },
              experimentalValue: { type: 'string' },
              agreement: { type: 'string' }
            }
          }
        },
        failedCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              case: { type: 'string' },
              reason: { type: 'string' },
              possibleFix: { type: 'string' }
            }
          }
        },
        rangeOfValidity: {
          type: 'object',
          properties: {
            parameters: { type: 'array', items: { type: 'string' } },
            validRegion: { type: 'string' },
            limitations: { type: 'array', items: { type: 'string' } }
          }
        },
        allCasesPassed: { type: 'boolean' },
        overallConfidence: { type: 'string', enum: ['high', 'medium', 'low'] }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['physics', 'theoretical', 'validation', 'limiting-cases']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Documentation Generation - ${args.systemName}`,
  agent: {
    name: 'physics-paper-writer',
    skills: ['latex-physics-documenter', 'paraview-scientific-visualizer'],
    prompt: {
      role: 'Physics Technical Writer with expertise in mathematical physics documentation',
      task: 'Generate comprehensive documentation for the mathematical model',
      context: {
        systemName: args.systemName,
        physicalDomain: args.physicalDomain,
        systemDefinition: args.systemDefinition,
        formulation: args.formulation,
        symmetryAnalysis: args.symmetryAnalysis,
        equationsOfMotion: args.equationsOfMotion,
        approximations: args.approximations,
        limitingCaseValidation: args.limitingCaseValidation
      },
      instructions: [
        '1. Create executive summary of the mathematical model',
        '2. Document the physical system and its degrees of freedom',
        '3. Present the Lagrangian/Hamiltonian formulation clearly',
        '4. Document all symmetries and conservation laws',
        '5. Present equations of motion and solution methods',
        '6. Document approximations with validity conditions',
        '7. Summarize validation results and confidence level',
        '8. Provide usage recommendations and typical applications',
        '9. Include references to relevant literature',
        '10. Generate both structured JSON and readable markdown formats'
      ],
      outputFormat: 'JSON object with model document and derivation notebook'
    },
    outputSchema: {
      type: 'object',
      required: ['modelDocument', 'derivationNotebook'],
      properties: {
        modelDocument: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            abstract: { type: 'string' },
            systemDescription: { type: 'object' },
            mathematicalFormulation: { type: 'object' },
            symmetriesAndConservation: { type: 'object' },
            equationsOfMotion: { type: 'object' },
            approximations: { type: 'object' },
            validation: { type: 'object' },
            applications: { type: 'array', items: { type: 'string' } },
            references: { type: 'array', items: { type: 'string' } }
          }
        },
        derivationNotebook: {
          type: 'string',
          description: 'Complete derivation in markdown format with LaTeX equations'
        },
        quickReference: {
          type: 'object',
          properties: {
            lagrangian: { type: 'string' },
            hamiltonian: { type: 'string' },
            conservedQuantities: { type: 'array', items: { type: 'string' } },
            keyEquations: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['physics', 'theoretical', 'documentation', 'model-derivation']
}));
