/**
 * @process specializations/domains/science/physics/symmetry-conservation-analysis
 * @description Identify and exploit symmetries in physical systems using group theory and Noether's theorem,
 * including classification of states, derivation of selection rules, and simplification of calculations.
 * @inputs { systemName: string, physicalDomain: string, hamiltonian?: string, lagrangian?: string, knownSymmetries?: string[] }
 * @outputs { success: boolean, symmetryClassification: object, conservedQuantities: object, selectionRules: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/physics/symmetry-conservation-analysis', {
 *   systemName: 'Hydrogen Atom',
 *   physicalDomain: 'Quantum Mechanics',
 *   hamiltonian: 'H = p^2/2m - e^2/r',
 *   knownSymmetries: ['SO(3) rotational', 'time translation']
 * });
 *
 * @references
 * - Georgi, Lie Algebras in Particle Physics
 * - Tung, Group Theory in Physics
 * - Noether, Invariante Variationsprobleme (1918)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName,
    physicalDomain,
    hamiltonian = '',
    lagrangian = '',
    knownSymmetries = []
  } = inputs;

  // Phase 1: System Characterization
  const systemCharacterization = await ctx.task(systemCharacterizationTask, {
    systemName,
    physicalDomain,
    hamiltonian,
    lagrangian
  });

  // Phase 2: Continuous Symmetry Identification
  const continuousSymmetries = await ctx.task(continuousSymmetriesTask, {
    systemName,
    systemCharacterization,
    knownSymmetries
  });

  // Breakpoint: Review identified continuous symmetries
  await ctx.breakpoint({
    question: `Review continuous symmetries for ${systemName}. Are all relevant symmetries identified?`,
    title: 'Continuous Symmetries Review',
    context: {
      runId: ctx.runId,
      symmetries: continuousSymmetries.symmetries,
      files: [{
        path: `artifacts/phase2-continuous-symmetries.json`,
        format: 'json',
        content: continuousSymmetries
      }]
    }
  });

  // Phase 3: Discrete Symmetry Identification
  const discreteSymmetries = await ctx.task(discreteSymmetriesTask, {
    systemName,
    systemCharacterization,
    knownSymmetries
  });

  // Phase 4: Noether Theorem Application
  const noetherAnalysis = await ctx.task(noetherAnalysisTask, {
    systemName,
    continuousSymmetries,
    systemCharacterization
  });

  // Quality Gate: Verify conservation laws
  if (!noetherAnalysis.conservedQuantities || noetherAnalysis.conservedQuantities.length === 0) {
    await ctx.breakpoint({
      question: `No conserved quantities derived for ${systemName}. This may indicate no continuous symmetries. Proceed?`,
      title: 'Conservation Law Warning',
      context: {
        runId: ctx.runId,
        noetherAnalysis,
        recommendation: 'Verify system has continuous symmetries or focus on discrete symmetry analysis'
      }
    });
  }

  // Phase 5: Group Theory Analysis
  const groupTheoryAnalysis = await ctx.task(groupTheoryAnalysisTask, {
    systemName,
    continuousSymmetries,
    discreteSymmetries
  });

  // Phase 6: State Classification
  const stateClassification = await ctx.task(stateClassificationTask, {
    systemName,
    groupTheoryAnalysis,
    physicalDomain
  });

  // Phase 7: Selection Rules Derivation
  const selectionRules = await ctx.task(selectionRulesTask, {
    systemName,
    groupTheoryAnalysis,
    stateClassification
  });

  // Phase 8: Calculation Simplification
  const simplificationStrategies = await ctx.task(simplificationTask, {
    systemName,
    groupTheoryAnalysis,
    selectionRules,
    conservedQuantities: noetherAnalysis.conservedQuantities
  });

  // Final Breakpoint: Analysis Approval
  await ctx.breakpoint({
    question: `Symmetry analysis complete for ${systemName}. Approve results for use?`,
    title: 'Symmetry Analysis Approval',
    context: {
      runId: ctx.runId,
      systemName,
      files: [
        { path: `artifacts/symmetry-analysis.json`, format: 'json', content: groupTheoryAnalysis },
        { path: `artifacts/selection-rules.json`, format: 'json', content: selectionRules }
      ]
    }
  });

  return {
    success: true,
    systemName,
    physicalDomain,
    symmetryClassification: {
      continuous: continuousSymmetries.symmetries,
      discrete: discreteSymmetries.symmetries,
      lieAlgebra: groupTheoryAnalysis.lieAlgebra,
      representationTheory: groupTheoryAnalysis.representations
    },
    conservedQuantities: noetherAnalysis.conservedQuantities,
    selectionRules: selectionRules.rules,
    stateClassification: stateClassification.classification,
    simplificationStrategies: simplificationStrategies.strategies,
    metadata: {
      processId: 'specializations/domains/science/physics/symmetry-conservation-analysis',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const systemCharacterizationTask = defineTask('system-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: System Characterization - ${args.systemName}`,
  agent: {
    name: 'theoretical-model-developer',
    skills: ['pyscf-quantum-chemistry', 'qiskit-quantum-simulator'],
    prompt: {
      role: 'Theoretical Physicist with expertise in symmetry analysis',
      task: 'Characterize the physical system for symmetry analysis',
      context: {
        systemName: args.systemName,
        physicalDomain: args.physicalDomain,
        hamiltonian: args.hamiltonian,
        lagrangian: args.lagrangian
      },
      instructions: [
        '1. Write the system Hamiltonian and/or Lagrangian explicitly',
        '2. Identify the configuration space and phase space',
        '3. Identify all dynamical variables and parameters',
        '4. Determine the type of physical system (classical, quantum, field theory)',
        '5. Identify any gauge freedoms present',
        '6. Document boundary conditions and constraints',
        '7. Identify the natural scales and units',
        '8. Note any special structure (harmonic, integrable, etc.)',
        '9. Identify potential symmetry-breaking terms',
        '10. Prepare system for systematic symmetry search'
      ],
      outputFormat: 'JSON object with system characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['hamiltonian', 'systemType', 'dynamicalVariables'],
      properties: {
        hamiltonian: { type: 'string' },
        lagrangian: { type: 'string' },
        systemType: { type: 'string', enum: ['classical-mechanics', 'quantum-mechanics', 'classical-field', 'quantum-field', 'statistical'] },
        dynamicalVariables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              domain: { type: 'string' }
            }
          }
        },
        configurationSpace: {
          type: 'object',
          properties: {
            dimension: { type: 'number' },
            topology: { type: 'string' },
            manifold: { type: 'string' }
          }
        },
        gaugeFreedoms: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } },
        specialStructure: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['physics', 'symmetry', 'system-characterization']
}));

export const continuousSymmetriesTask = defineTask('continuous-symmetries', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Continuous Symmetry Identification - ${args.systemName}`,
  agent: {
    name: 'theoretical-model-developer',
    skills: ['pyscf-quantum-chemistry', 'qiskit-quantum-simulator'],
    prompt: {
      role: 'Theoretical Physicist with expertise in Lie groups and continuous symmetries',
      task: 'Identify all continuous symmetries of the physical system',
      context: {
        systemName: args.systemName,
        systemCharacterization: args.systemCharacterization,
        knownSymmetries: args.knownSymmetries
      },
      instructions: [
        '1. Test for spacetime symmetries (translations, rotations, boosts)',
        '2. Test for internal symmetries (gauge, global phase, etc.)',
        '3. Identify the Lie group structure of each symmetry',
        '4. Compute infinitesimal generators for each symmetry',
        '5. Verify invariance of Lagrangian/Hamiltonian under transformations',
        '6. Identify any hidden symmetries (e.g., Runge-Lenz for Kepler)',
        '7. Determine if symmetries are exact or approximate',
        '8. Compute the dimension of each symmetry group',
        '9. Identify any central extensions or anomalies',
        '10. Document the full continuous symmetry group'
      ],
      outputFormat: 'JSON object with continuous symmetries'
    },
    outputSchema: {
      type: 'object',
      required: ['symmetries'],
      properties: {
        symmetries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              lieGroup: { type: 'string' },
              dimension: { type: 'number' },
              type: { type: 'string', enum: ['spacetime', 'internal', 'hidden', 'gauge'] },
              generators: { type: 'array', items: { type: 'string' } },
              transformation: { type: 'string' },
              isExact: { type: 'boolean' },
              breakingTerms: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalSymmetryGroup: {
          type: 'object',
          properties: {
            structure: { type: 'string' },
            totalDimension: { type: 'number' },
            semidirectProduct: { type: 'boolean' }
          }
        },
        anomalies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symmetry: { type: 'string' },
              anomalyType: { type: 'string' },
              consequence: { type: 'string' }
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
  labels: ['physics', 'symmetry', 'continuous', 'lie-groups']
}));

export const discreteSymmetriesTask = defineTask('discrete-symmetries', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Discrete Symmetry Identification - ${args.systemName}`,
  agent: {
    name: 'theoretical-model-developer',
    skills: ['pyscf-quantum-chemistry', 'qiskit-quantum-simulator'],
    prompt: {
      role: 'Theoretical Physicist with expertise in discrete symmetries',
      task: 'Identify all discrete symmetries of the physical system',
      context: {
        systemName: args.systemName,
        systemCharacterization: args.systemCharacterization,
        knownSymmetries: args.knownSymmetries
      },
      instructions: [
        '1. Test for parity (P) symmetry - spatial inversion',
        '2. Test for time reversal (T) symmetry',
        '3. Test for charge conjugation (C) if applicable',
        '4. Test for combined CPT symmetry',
        '5. Identify point group symmetries (rotations, reflections)',
        '6. Test for particle exchange symmetry',
        '7. Identify any lattice translation symmetries',
        '8. Compute eigenvalues of discrete symmetry operators',
        '9. Identify any broken discrete symmetries',
        '10. Document the full discrete symmetry group'
      ],
      outputFormat: 'JSON object with discrete symmetries'
    },
    outputSchema: {
      type: 'object',
      required: ['symmetries'],
      properties: {
        symmetries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              group: { type: 'string' },
              operation: { type: 'string' },
              eigenvalues: { type: 'array', items: { type: 'string' } },
              isConserved: { type: 'boolean' },
              breakingMechanism: { type: 'string' }
            }
          }
        },
        parity: {
          type: 'object',
          properties: {
            conserved: { type: 'boolean' },
            operator: { type: 'string' },
            eigenvalues: { type: 'array', items: { type: 'string' } }
          }
        },
        timeReversal: {
          type: 'object',
          properties: {
            conserved: { type: 'boolean' },
            antiunitaryOperator: { type: 'string' },
            kramersDegeneracy: { type: 'boolean' }
          }
        },
        pointGroup: {
          type: 'object',
          properties: {
            group: { type: 'string' },
            elements: { type: 'array', items: { type: 'string' } },
            characterTable: { type: 'object' }
          }
        },
        totalDiscreteGroup: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['physics', 'symmetry', 'discrete', 'parity', 'time-reversal']
}));

export const noetherAnalysisTask = defineTask('noether-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Noether Theorem Application - ${args.systemName}`,
  agent: {
    name: 'theoretical-model-developer',
    skills: ['pyscf-quantum-chemistry', 'qiskit-quantum-simulator'],
    prompt: {
      role: 'Theoretical Physicist with expertise in Noether theorem and conservation laws',
      task: 'Apply Noether theorem to derive conserved quantities',
      context: {
        systemName: args.systemName,
        continuousSymmetries: args.continuousSymmetries,
        systemCharacterization: args.systemCharacterization
      },
      instructions: [
        '1. For each continuous symmetry, identify the infinitesimal transformation',
        '2. Compute the Noether current j^mu for field theories',
        '3. Derive the conserved charge Q = integral of j^0',
        '4. For mechanics, derive conserved quantities from Lagrangian',
        '5. Verify conservation: dQ/dt = 0 or d_mu j^mu = 0',
        '6. Express conserved quantities in phase space variables',
        '7. Compute Poisson brackets {Q, H} = 0 (classical) or [Q, H] = 0 (quantum)',
        '8. Identify the physical interpretation of each conserved quantity',
        '9. Handle any boundary terms or surface contributions',
        '10. Document the complete set of conservation laws'
      ],
      outputFormat: 'JSON object with Noether analysis and conserved quantities'
    },
    outputSchema: {
      type: 'object',
      required: ['conservedQuantities'],
      properties: {
        conservedQuantities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              symbol: { type: 'string' },
              symmetry: { type: 'string' },
              expression: { type: 'string' },
              noetherCurrent: { type: 'string' },
              physicalInterpretation: { type: 'string' },
              verificationMethod: { type: 'string' }
            }
          }
        },
        noetherCurrents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symmetry: { type: 'string' },
              current: { type: 'string' },
              conservationEquation: { type: 'string' }
            }
          }
        },
        poissonBrackets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              q1: { type: 'string' },
              q2: { type: 'string' },
              result: { type: 'string' }
            }
          }
        },
        boundaryTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              treatment: { type: 'string' }
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
  labels: ['physics', 'symmetry', 'noether', 'conservation-laws']
}));

export const groupTheoryAnalysisTask = defineTask('group-theory-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Group Theory Analysis - ${args.systemName}`,
  agent: {
    name: 'theoretical-model-developer',
    skills: ['pyscf-quantum-chemistry', 'qiskit-quantum-simulator'],
    prompt: {
      role: 'Mathematical Physicist with expertise in group theory and representation theory',
      task: 'Perform detailed group theory analysis of the symmetry structure',
      context: {
        systemName: args.systemName,
        continuousSymmetries: args.continuousSymmetries,
        discreteSymmetries: args.discreteSymmetries
      },
      instructions: [
        '1. Identify the complete symmetry group (continuous x discrete)',
        '2. Compute the Lie algebra for continuous symmetries',
        '3. Find commutation/anticommutation relations between generators',
        '4. Identify all irreducible representations',
        '5. Compute Casimir operators and their eigenvalues',
        '6. Construct character tables for finite groups',
        '7. Identify branching rules for subgroup chains',
        '8. Compute Clebsch-Gordan coefficients if needed',
        '9. Identify tensor product decompositions',
        '10. Document the group structure for state classification'
      ],
      outputFormat: 'JSON object with group theory analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['lieAlgebra', 'representations'],
      properties: {
        symmetryGroup: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            structure: { type: 'string' },
            order: { type: 'string' },
            isCompact: { type: 'boolean' }
          }
        },
        lieAlgebra: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            dimension: { type: 'number' },
            generators: { type: 'array', items: { type: 'string' } },
            commutationRelations: { type: 'array', items: { type: 'string' } },
            structureConstants: { type: 'string' }
          }
        },
        casimirOperators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              operator: { type: 'string' },
              expression: { type: 'string' },
              eigenvalueFormula: { type: 'string' }
            }
          }
        },
        representations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              dimension: { type: 'number' },
              labels: { type: 'array', items: { type: 'string' } },
              casimirEigenvalues: { type: 'object' }
            }
          }
        },
        branchingRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fromGroup: { type: 'string' },
              toSubgroup: { type: 'string' },
              decomposition: { type: 'string' }
            }
          }
        },
        tensorProducts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rep1: { type: 'string' },
              rep2: { type: 'string' },
              decomposition: { type: 'string' }
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
  labels: ['physics', 'symmetry', 'group-theory', 'representation-theory']
}));

export const stateClassificationTask = defineTask('state-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: State Classification - ${args.systemName}`,
  agent: {
    name: 'theoretical-model-developer',
    skills: ['pyscf-quantum-chemistry', 'qiskit-quantum-simulator'],
    prompt: {
      role: 'Theoretical Physicist with expertise in quantum mechanics and spectroscopy',
      task: 'Classify states by symmetry quantum numbers',
      context: {
        systemName: args.systemName,
        groupTheoryAnalysis: args.groupTheoryAnalysis,
        physicalDomain: args.physicalDomain
      },
      instructions: [
        '1. Identify good quantum numbers from symmetry operators',
        '2. Label states by irreducible representations',
        '3. Determine degeneracy patterns from symmetry',
        '4. Construct symmetry-adapted basis states',
        '5. Identify multiplet structures',
        '6. Determine which states can mix under perturbations',
        '7. Classify ground state and excited states',
        '8. Identify topological classification if applicable',
        '9. Document spectroscopic notation conventions',
        '10. Create comprehensive state labeling scheme'
      ],
      outputFormat: 'JSON object with state classification'
    },
    outputSchema: {
      type: 'object',
      required: ['classification', 'quantumNumbers'],
      properties: {
        quantumNumbers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              symbol: { type: 'string' },
              associatedSymmetry: { type: 'string' },
              allowedValues: { type: 'string' }
            }
          }
        },
        classification: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              state: { type: 'string' },
              representation: { type: 'string' },
              quantumNumbers: { type: 'object' },
              degeneracy: { type: 'number' },
              spectroscopicNotation: { type: 'string' }
            }
          }
        },
        multiplets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              representation: { type: 'string' },
              states: { type: 'array', items: { type: 'string' } },
              splittingPattern: { type: 'string' }
            }
          }
        },
        degeneracyStructure: {
          type: 'object',
          properties: {
            essentialDegeneracies: { type: 'array', items: { type: 'string' } },
            accidentalDegeneracies: { type: 'array', items: { type: 'string' } }
          }
        },
        symmetryAdaptedBasis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              basisState: { type: 'string' },
              transformationProperties: { type: 'string' }
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
  labels: ['physics', 'symmetry', 'state-classification', 'quantum-numbers']
}));

export const selectionRulesTask = defineTask('selection-rules', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Selection Rules Derivation - ${args.systemName}`,
  agent: {
    name: 'theoretical-model-developer',
    skills: ['pyscf-quantum-chemistry', 'qiskit-quantum-simulator'],
    prompt: {
      role: 'Theoretical Physicist with expertise in transition amplitudes and spectroscopy',
      task: 'Derive selection rules from symmetry principles',
      context: {
        systemName: args.systemName,
        groupTheoryAnalysis: args.groupTheoryAnalysis,
        stateClassification: args.stateClassification
      },
      instructions: [
        '1. Identify relevant transition operators (dipole, quadrupole, etc.)',
        '2. Determine transformation properties of operators under symmetry',
        '3. Apply Wigner-Eckart theorem to derive selection rules',
        '4. Compute which transitions are allowed vs forbidden',
        '5. Identify superselection rules from exact symmetries',
        '6. Determine relative transition strengths using Clebsch-Gordan coefficients',
        '7. Identify polarization selection rules',
        '8. Document exceptions and weakly allowed transitions',
        '9. Compare with experimental spectroscopic data if available',
        '10. Create comprehensive selection rule table'
      ],
      outputFormat: 'JSON object with selection rules'
    },
    outputSchema: {
      type: 'object',
      required: ['rules'],
      properties: {
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              transitionType: { type: 'string' },
              operator: { type: 'string' },
              quantumNumber: { type: 'string' },
              rule: { type: 'string' },
              allowedChanges: { type: 'array', items: { type: 'string' } },
              forbiddenChanges: { type: 'array', items: { type: 'string' } },
              symmetryOrigin: { type: 'string' }
            }
          }
        },
        wignerEckart: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              operator: { type: 'string' },
              tensorRank: { type: 'string' },
              matrixElementFormula: { type: 'string' },
              reducedMatrixElement: { type: 'string' }
            }
          }
        },
        superselectionRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quantumNumber: { type: 'string' },
              rule: { type: 'string' },
              physicalConsequence: { type: 'string' }
            }
          }
        },
        transitionTable: {
          type: 'object',
          properties: {
            allowedTransitions: { type: 'array', items: { type: 'string' } },
            forbiddenTransitions: { type: 'array', items: { type: 'string' } },
            weaklyAllowed: { type: 'array', items: { type: 'string' } }
          }
        },
        polarizationRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              polarization: { type: 'string' },
              selectionRule: { type: 'string' }
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
  labels: ['physics', 'symmetry', 'selection-rules', 'spectroscopy']
}));

export const simplificationTask = defineTask('calculation-simplification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Calculation Simplification - ${args.systemName}`,
  agent: {
    name: 'theoretical-model-developer',
    skills: ['pyscf-quantum-chemistry', 'qiskit-quantum-simulator'],
    prompt: {
      role: 'Theoretical Physicist with expertise in computational techniques',
      task: 'Develop strategies to simplify calculations using symmetry',
      context: {
        systemName: args.systemName,
        groupTheoryAnalysis: args.groupTheoryAnalysis,
        selectionRules: args.selectionRules,
        conservedQuantities: args.conservedQuantities
      },
      instructions: [
        '1. Identify block-diagonal structures in Hamiltonian from symmetry',
        '2. Use conservation laws to reduce degrees of freedom',
        '3. Exploit selection rules to eliminate zero matrix elements',
        '4. Identify symmetry-related quantities that need only one calculation',
        '5. Use group theory to relate different matrix elements',
        '6. Identify recursion relations from symmetry',
        '7. Simplify integrals using symmetry properties',
        '8. Reduce parameter space using dimensional analysis',
        '9. Document computational speedups from symmetry exploitation',
        '10. Provide practical implementation recommendations'
      ],
      outputFormat: 'JSON object with simplification strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              symmetryUsed: { type: 'string' },
              description: { type: 'string' },
              speedupFactor: { type: 'string' },
              implementation: { type: 'string' }
            }
          }
        },
        blockDiagonalization: {
          type: 'object',
          properties: {
            blocks: { type: 'array', items: { type: 'string' } },
            blockSizes: { type: 'array', items: { type: 'number' } },
            labelingScheme: { type: 'string' }
          }
        },
        zeroElements: {
          type: 'object',
          properties: {
            vanishingConditions: { type: 'array', items: { type: 'string' } },
            fractionZero: { type: 'string' }
          }
        },
        relatedQuantities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quantities: { type: 'array', items: { type: 'string' } },
              relation: { type: 'string' },
              independentCalculations: { type: 'number' }
            }
          }
        },
        recursionRelations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              relation: { type: 'string' },
              origin: { type: 'string' }
            }
          }
        },
        computationalBenefits: {
          type: 'object',
          properties: {
            memoryReduction: { type: 'string' },
            timeReduction: { type: 'string' },
            parallelizationOpportunities: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['physics', 'symmetry', 'computational', 'simplification']
}));
