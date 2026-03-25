/**
 * @process specializations/domains/science/physics/perturbation-theory-analysis
 * @description Apply perturbation methods to solve complex physical problems where exact solutions are intractable,
 * including systematic expansion calculations, convergence analysis, and comparison with non-perturbative methods.
 * @inputs { problemName: string, unperturbedSystem: object, perturbation: object, expansionOrders?: number, comparisonMethods?: string[] }
 * @outputs { success: boolean, perturbativeResults: object, convergenceAnalysis: object, comparisonReport: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/physics/perturbation-theory-analysis', {
 *   problemName: 'Anharmonic Oscillator',
 *   unperturbedSystem: { hamiltonian: 'H0 = p^2/2m + kx^2/2', solutions: 'known' },
 *   perturbation: { term: 'lambda * x^4', parameter: 'lambda' },
 *   expansionOrders: 3,
 *   comparisonMethods: ['numerical', 'variational']
 * });
 *
 * @references
 * - Bender & Orszag, Advanced Mathematical Methods for Scientists and Engineers
 * - Sakurai, Modern Quantum Mechanics (perturbation theory chapter)
 * - Weinberg, Lectures on Quantum Mechanics
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemName,
    unperturbedSystem,
    perturbation,
    expansionOrders = 3,
    comparisonMethods = []
  } = inputs;

  // Phase 1: Unperturbed System Analysis
  const unperturbedAnalysis = await ctx.task(unperturbedAnalysisTask, {
    problemName,
    unperturbedSystem
  });

  // Quality Gate: Unperturbed solutions must be available
  if (!unperturbedAnalysis.solutionsAvailable) {
    return {
      success: false,
      error: 'Unperturbed system solutions not available or incomplete',
      phase: 'unperturbed-analysis',
      perturbativeResults: null
    };
  }

  // Breakpoint: Review unperturbed system
  await ctx.breakpoint({
    question: `Review unperturbed system for ${problemName}. Are the zeroth-order solutions correctly identified?`,
    title: 'Unperturbed System Review',
    context: {
      runId: ctx.runId,
      problemName,
      unperturbedSolutions: unperturbedAnalysis.solutions,
      files: [{
        path: `artifacts/phase1-unperturbed-analysis.json`,
        format: 'json',
        content: unperturbedAnalysis
      }]
    }
  });

  // Phase 2: Perturbation Setup
  const perturbationSetup = await ctx.task(perturbationSetupTask, {
    problemName,
    unperturbedAnalysis,
    perturbation
  });

  // Phase 3: First-Order Corrections
  const firstOrderCorrections = await ctx.task(firstOrderTask, {
    problemName,
    unperturbedAnalysis,
    perturbationSetup
  });

  // Phase 4: Higher-Order Corrections
  const higherOrderCorrections = await ctx.task(higherOrderTask, {
    problemName,
    unperturbedAnalysis,
    perturbationSetup,
    firstOrderCorrections,
    maxOrder: expansionOrders
  });

  // Phase 5: Convergence Analysis
  const convergenceAnalysis = await ctx.task(convergenceAnalysisTask, {
    problemName,
    perturbationSetup,
    firstOrderCorrections,
    higherOrderCorrections
  });

  // Quality Gate: Check convergence
  if (!convergenceAnalysis.isConvergent && convergenceAnalysis.divergenceType !== 'asymptotic') {
    await ctx.breakpoint({
      question: `Perturbation series for ${problemName} shows divergence. Review convergence analysis and decide how to proceed.`,
      title: 'Convergence Warning',
      context: {
        runId: ctx.runId,
        convergenceAnalysis,
        recommendation: 'Consider resummation methods or alternative approaches'
      }
    });
  }

  // Phase 6: Non-Perturbative Comparison (if methods specified)
  let comparisonResults = null;
  if (comparisonMethods.length > 0) {
    comparisonResults = await ctx.task(comparisonTask, {
      problemName,
      perturbativeResults: higherOrderCorrections,
      comparisonMethods,
      perturbationSetup
    });
  }

  // Phase 7: Results Synthesis
  const synthesis = await ctx.task(synthesisTask, {
    problemName,
    unperturbedAnalysis,
    perturbationSetup,
    firstOrderCorrections,
    higherOrderCorrections,
    convergenceAnalysis,
    comparisonResults
  });

  // Final Breakpoint: Results Approval
  await ctx.breakpoint({
    question: `Perturbation analysis complete for ${problemName}. Approve results for publication/use?`,
    title: 'Perturbation Analysis Approval',
    context: {
      runId: ctx.runId,
      problemName,
      convergent: convergenceAnalysis.isConvergent,
      files: [
        { path: `artifacts/perturbation-results.json`, format: 'json', content: synthesis.results },
        { path: `artifacts/analysis-report.md`, format: 'markdown', content: synthesis.report }
      ]
    }
  });

  return {
    success: true,
    problemName,
    perturbativeResults: {
      zerothOrder: unperturbedAnalysis.solutions,
      firstOrder: firstOrderCorrections.corrections,
      higherOrders: higherOrderCorrections.corrections,
      fullExpansion: synthesis.results.fullExpansion
    },
    convergenceAnalysis: {
      isConvergent: convergenceAnalysis.isConvergent,
      radiusOfConvergence: convergenceAnalysis.radius,
      divergenceType: convergenceAnalysis.divergenceType,
      validityRange: convergenceAnalysis.validityRange
    },
    comparisonReport: comparisonResults,
    recommendations: synthesis.recommendations,
    metadata: {
      processId: 'specializations/domains/science/physics/perturbation-theory-analysis',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const unperturbedAnalysisTask = defineTask('unperturbed-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Unperturbed System Analysis - ${args.problemName}`,
  agent: {
    name: 'perturbation-theory-analyst',
    skills: ['scipy-optimization-toolkit', 'pyscf-quantum-chemistry'],
    prompt: {
      role: 'Theoretical Physicist with expertise in exactly solvable systems',
      task: 'Analyze the unperturbed system and document its exact solutions',
      context: {
        problemName: args.problemName,
        unperturbedSystem: args.unperturbedSystem
      },
      instructions: [
        '1. Write the unperturbed Hamiltonian/Lagrangian H_0 explicitly',
        '2. Identify the exact solutions (eigenstates, eigenvalues for quantum; trajectories for classical)',
        '3. Document the complete set of quantum numbers or labels for states',
        '4. Verify orthonormality and completeness of the basis',
        '5. Identify any degeneracies in the spectrum',
        '6. Document symmetries of the unperturbed system',
        '7. Compute relevant matrix elements in the unperturbed basis',
        '8. Identify the energy scale and natural units',
        '9. Document any special properties (harmonic, integrable, etc.)',
        '10. Prepare the framework for perturbative corrections'
      ],
      outputFormat: 'JSON object with complete unperturbed system analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['solutionsAvailable', 'solutions', 'spectrum'],
      properties: {
        hamiltonian: {
          type: 'object',
          properties: {
            expression: { type: 'string' },
            parameters: { type: 'array', items: { type: 'string' } }
          }
        },
        solutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              wavefunction: { type: 'string' },
              energy: { type: 'string' },
              quantumNumbers: { type: 'object' }
            }
          }
        },
        spectrum: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['discrete', 'continuous', 'mixed'] },
            groundStateEnergy: { type: 'string' },
            excitationGap: { type: 'string' },
            degeneracies: { type: 'array', items: { type: 'string' } }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            verified: { type: 'boolean' },
            completenessRelation: { type: 'string' }
          }
        },
        symmetries: { type: 'array', items: { type: 'string' } },
        matrixElements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              operator: { type: 'string' },
              expression: { type: 'string' }
            }
          }
        },
        solutionsAvailable: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['physics', 'perturbation-theory', 'unperturbed-system']
}));

export const perturbationSetupTask = defineTask('perturbation-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Perturbation Setup - ${args.problemName}`,
  agent: {
    name: 'perturbation-theory-analyst',
    skills: ['scipy-optimization-toolkit', 'pyscf-quantum-chemistry'],
    prompt: {
      role: 'Theoretical Physicist with expertise in perturbation theory methodology',
      task: 'Set up the perturbation expansion framework',
      context: {
        problemName: args.problemName,
        unperturbedAnalysis: args.unperturbedAnalysis,
        perturbation: args.perturbation
      },
      instructions: [
        '1. Write the perturbation Hamiltonian H\' explicitly',
        '2. Identify the small parameter lambda for expansion',
        '3. Determine the regime of validity (lambda << 1 conditions)',
        '4. Choose appropriate perturbation formalism (Rayleigh-Schrodinger, Brillouin-Wigner, etc.)',
        '5. Handle degeneracies appropriately (degenerate perturbation theory if needed)',
        '6. Set up the formal expansion: E = E_0 + lambda*E_1 + lambda^2*E_2 + ...',
        '7. Identify selection rules from symmetry',
        '8. Compute key matrix elements <n|H\'|m>',
        '9. Identify any infrared or ultraviolet divergences',
        '10. Document the bookkeeping scheme for higher orders'
      ],
      outputFormat: 'JSON object with perturbation setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['perturbationHamiltonian', 'expansionParameter', 'formalism'],
      properties: {
        perturbationHamiltonian: {
          type: 'object',
          properties: {
            expression: { type: 'string' },
            orderInLambda: { type: 'number' }
          }
        },
        expansionParameter: {
          type: 'object',
          properties: {
            symbol: { type: 'string' },
            physicalMeaning: { type: 'string' },
            validityCondition: { type: 'string' }
          }
        },
        formalism: {
          type: 'string',
          enum: ['rayleigh-schrodinger', 'brillouin-wigner', 'time-dependent', 'adiabatic', 'other']
        },
        degeneracyHandling: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            method: { type: 'string' },
            degenerateSubspaces: { type: 'array', items: { type: 'string' } }
          }
        },
        matrixElements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bra: { type: 'string' },
              ket: { type: 'string' },
              value: { type: 'string' }
            }
          }
        },
        selectionRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { type: 'string' },
              vanishingElements: { type: 'string' }
            }
          }
        },
        potentialDivergences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              source: { type: 'string' },
              regularization: { type: 'string' }
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
  labels: ['physics', 'perturbation-theory', 'setup']
}));

export const firstOrderTask = defineTask('first-order-corrections', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: First-Order Corrections - ${args.problemName}`,
  agent: {
    name: 'perturbation-theory-analyst',
    skills: ['scipy-optimization-toolkit', 'pyscf-quantum-chemistry'],
    prompt: {
      role: 'Theoretical Physicist with expertise in perturbation calculations',
      task: 'Compute first-order perturbative corrections',
      context: {
        problemName: args.problemName,
        unperturbedAnalysis: args.unperturbedAnalysis,
        perturbationSetup: args.perturbationSetup
      },
      instructions: [
        '1. Compute first-order energy corrections E_n^(1) = <n|H\'|n>',
        '2. Compute first-order wavefunction corrections |n^(1)> = sum_{m!=n} <m|H\'|n>/(E_n-E_m) |m>',
        '3. Handle degenerate cases using appropriate diagonalization',
        '4. Verify perturbation is small: |E^(1)| << |E^(0)|',
        '5. Check normalization of perturbed wavefunctions',
        '6. Compute first-order corrections to observables',
        '7. Identify any level crossings or avoided crossings',
        '8. Document any simplifications from selection rules',
        '9. Verify consistency with symmetry constraints',
        '10. Estimate the expected accuracy of first-order results'
      ],
      outputFormat: 'JSON object with first-order corrections'
    },
    outputSchema: {
      type: 'object',
      required: ['corrections', 'energyCorrections', 'wavefunctionCorrections'],
      properties: {
        energyCorrections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              state: { type: 'string' },
              E0: { type: 'string' },
              E1: { type: 'string' },
              derivation: { type: 'string' }
            }
          }
        },
        wavefunctionCorrections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              state: { type: 'string' },
              correction: { type: 'string' },
              nonzeroTerms: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        observableCorrections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              observable: { type: 'string' },
              correction: { type: 'string' }
            }
          }
        },
        degenerateCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subspace: { type: 'string' },
              perturbationMatrix: { type: 'string' },
              eigenvalues: { type: 'array', items: { type: 'string' } },
              eigenvectors: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        corrections: {
          type: 'object',
          properties: {
            order: { type: 'number' },
            results: { type: 'object' }
          }
        },
        validityCheck: {
          type: 'object',
          properties: {
            smallnessVerified: { type: 'boolean' },
            ratio: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['physics', 'perturbation-theory', 'first-order']
}));

export const higherOrderTask = defineTask('higher-order-corrections', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Higher-Order Corrections - ${args.problemName}`,
  agent: {
    name: 'perturbation-theory-analyst',
    skills: ['scipy-optimization-toolkit', 'pyscf-quantum-chemistry'],
    prompt: {
      role: 'Theoretical Physicist with expertise in high-order perturbation calculations',
      task: 'Compute higher-order perturbative corrections systematically',
      context: {
        problemName: args.problemName,
        unperturbedAnalysis: args.unperturbedAnalysis,
        perturbationSetup: args.perturbationSetup,
        firstOrderCorrections: args.firstOrderCorrections,
        maxOrder: args.maxOrder
      },
      instructions: [
        '1. Apply recursive formulas for n-th order corrections',
        '2. Compute second-order energy corrections E_n^(2)',
        '3. Track intermediate state sums carefully',
        '4. Compute corrections up to specified order',
        '5. Identify and handle secular terms if present',
        '6. Apply any available resummation techniques',
        '7. Document the growth of correction terms with order',
        '8. Identify dominant contributions at each order',
        '9. Check for signs of divergence in the series',
        '10. Provide partial sums at each order'
      ],
      outputFormat: 'JSON object with higher-order corrections'
    },
    outputSchema: {
      type: 'object',
      required: ['corrections', 'maxOrderComputed'],
      properties: {
        corrections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              order: { type: 'number' },
              energyCorrections: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    state: { type: 'string' },
                    correction: { type: 'string' }
                  }
                }
              },
              wavefunctionCorrections: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        partialSums: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              state: { type: 'string' },
              orderSums: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        secularTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              order: { type: 'number' },
              term: { type: 'string' },
              treatment: { type: 'string' }
            }
          }
        },
        resummation: {
          type: 'object',
          properties: {
            applied: { type: 'boolean' },
            method: { type: 'string' },
            result: { type: 'string' }
          }
        },
        maxOrderComputed: { type: 'number' },
        seriesBehavior: {
          type: 'object',
          properties: {
            growthRate: { type: 'string' },
            dominantTerms: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['physics', 'perturbation-theory', 'higher-order']
}));

export const convergenceAnalysisTask = defineTask('convergence-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Convergence Analysis - ${args.problemName}`,
  agent: {
    name: 'perturbation-theory-analyst',
    skills: ['scipy-optimization-toolkit', 'pyscf-quantum-chemistry'],
    prompt: {
      role: 'Mathematical Physicist with expertise in asymptotic analysis and series convergence',
      task: 'Analyze the convergence properties of the perturbation series',
      context: {
        problemName: args.problemName,
        perturbationSetup: args.perturbationSetup,
        firstOrderCorrections: args.firstOrderCorrections,
        higherOrderCorrections: args.higherOrderCorrections
      },
      instructions: [
        '1. Apply ratio test to determine radius of convergence',
        '2. Analyze the large-order behavior of coefficients',
        '3. Identify if series is convergent, asymptotic, or divergent',
        '4. Estimate optimal truncation order for asymptotic series',
        '5. Compute error bounds for truncated series',
        '6. Identify any Borel summability properties',
        '7. Look for factorial growth indicating instantons/tunneling',
        '8. Determine the Stokes phenomenon if applicable',
        '9. Recommend resummation methods if series is divergent',
        '10. Define the range of lambda where results are reliable'
      ],
      outputFormat: 'JSON object with convergence analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['isConvergent', 'radius', 'validityRange'],
      properties: {
        isConvergent: { type: 'boolean' },
        divergenceType: {
          type: 'string',
          enum: ['convergent', 'asymptotic', 'factorially-divergent', 'power-divergent', 'unknown']
        },
        radius: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            method: { type: 'string' },
            confidence: { type: 'string' }
          }
        },
        ratioTest: {
          type: 'object',
          properties: {
            ratios: { type: 'array', items: { type: 'string' } },
            limit: { type: 'string' }
          }
        },
        largeOrderBehavior: {
          type: 'object',
          properties: {
            coefficientGrowth: { type: 'string' },
            leadingBehavior: { type: 'string' },
            physicalInterpretation: { type: 'string' }
          }
        },
        optimalTruncation: {
          type: 'object',
          properties: {
            order: { type: 'number' },
            error: { type: 'string' }
          }
        },
        borelAnalysis: {
          type: 'object',
          properties: {
            isSummable: { type: 'boolean' },
            singularities: { type: 'array', items: { type: 'string' } },
            interpretation: { type: 'string' }
          }
        },
        validityRange: {
          type: 'object',
          properties: {
            parameterRange: { type: 'string' },
            accuracyEstimate: { type: 'string' }
          }
        },
        resummationRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              applicability: { type: 'string' },
              expectedImprovement: { type: 'string' }
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
  labels: ['physics', 'perturbation-theory', 'convergence', 'asymptotic']
}));

export const comparisonTask = defineTask('non-perturbative-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Non-Perturbative Comparison - ${args.problemName}`,
  agent: {
    name: 'perturbation-theory-analyst',
    skills: ['scipy-optimization-toolkit', 'pyscf-quantum-chemistry'],
    prompt: {
      role: 'Computational Physicist with expertise in numerical and variational methods',
      task: 'Compare perturbative results with non-perturbative methods',
      context: {
        problemName: args.problemName,
        perturbativeResults: args.perturbativeResults,
        comparisonMethods: args.comparisonMethods,
        perturbationSetup: args.perturbationSetup
      },
      instructions: [
        '1. For each comparison method, outline the approach',
        '2. Compute or reference non-perturbative results',
        '3. Compare energies, wavefunctions, and observables',
        '4. Quantify the discrepancy between methods',
        '5. Identify regimes where perturbation theory excels or fails',
        '6. Analyze the source of any discrepancies',
        '7. Benchmark computational cost vs accuracy trade-offs',
        '8. Identify complementary information from each method',
        '9. Recommend best method for different use cases',
        '10. Document insights about the physical system from comparison'
      ],
      outputFormat: 'JSON object with comparison results'
    },
    outputSchema: {
      type: 'object',
      required: ['comparisons', 'recommendations'],
      properties: {
        comparisons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              description: { type: 'string' },
              results: {
                type: 'object',
                properties: {
                  energies: { type: 'array', items: { type: 'string' } },
                  observables: { type: 'object' }
                }
              },
              discrepancy: {
                type: 'object',
                properties: {
                  absolute: { type: 'string' },
                  relative: { type: 'string' },
                  dependenceOnLambda: { type: 'string' }
                }
              },
              computationalCost: { type: 'string' }
            }
          }
        },
        regimeAnalysis: {
          type: 'object',
          properties: {
            perturbationExcels: { type: 'array', items: { type: 'string' } },
            perturbationFails: { type: 'array', items: { type: 'string' } },
            crossoverRegion: { type: 'string' }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              useCase: { type: 'string' },
              recommendedMethod: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        physicalInsights: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['physics', 'perturbation-theory', 'comparison', 'numerical-methods']
}));

export const synthesisTask = defineTask('results-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Results Synthesis - ${args.problemName}`,
  agent: {
    name: 'perturbation-theory-analyst',
    skills: ['scipy-optimization-toolkit', 'pyscf-quantum-chemistry'],
    prompt: {
      role: 'Theoretical Physicist and Technical Writer',
      task: 'Synthesize perturbation analysis results into comprehensive documentation',
      context: {
        problemName: args.problemName,
        unperturbedAnalysis: args.unperturbedAnalysis,
        perturbationSetup: args.perturbationSetup,
        firstOrderCorrections: args.firstOrderCorrections,
        higherOrderCorrections: args.higherOrderCorrections,
        convergenceAnalysis: args.convergenceAnalysis,
        comparisonResults: args.comparisonResults
      },
      instructions: [
        '1. Summarize the problem and perturbation approach',
        '2. Present the full perturbation expansion clearly',
        '3. Highlight key physical results and insights',
        '4. Document the validity range and accuracy',
        '5. Provide practical formulas for applications',
        '6. Discuss limitations and caveats',
        '7. Include recommendations for users',
        '8. Generate publication-ready expressions',
        '9. Create both JSON results and markdown report',
        '10. Suggest follow-up calculations or improvements'
      ],
      outputFormat: 'JSON object with synthesized results and report'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'report', 'recommendations'],
      properties: {
        results: {
          type: 'object',
          properties: {
            fullExpansion: {
              type: 'object',
              properties: {
                energy: { type: 'string' },
                wavefunction: { type: 'string' },
                observables: { type: 'object' }
              }
            },
            numericalValues: { type: 'object' },
            validityRange: { type: 'string' }
          }
        },
        report: {
          type: 'string',
          description: 'Complete analysis report in markdown format'
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        practicalFormulas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quantity: { type: 'string' },
              formula: { type: 'string' },
              accuracy: { type: 'string' }
            }
          }
        },
        followUpSuggestions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['physics', 'perturbation-theory', 'synthesis', 'documentation']
}));
