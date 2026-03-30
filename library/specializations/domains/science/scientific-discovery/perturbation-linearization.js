/**
 * @process scientific-discovery/perturbation-linearization
 * @description Perturbation and Linearization process (Physics/Engineering) - Treat a system as a small deviation from a known solution
 * @inputs { nonlinearSystem: object, knownSolution: object, perturbationParameter: string, outputDir: string }
 * @outputs { success: boolean, linearizedSystem: object, corrections: array, validityRange: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    nonlinearSystem = {},
    knownSolution = {},
    perturbationParameter = 'epsilon',
    outputDir = 'perturbation-output',
    orderOfExpansion = 2,
    regularPerturbation = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Perturbation and Linearization Process');

  // ============================================================================
  // PHASE 1: SYSTEM ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing the nonlinear system');
  const systemAnalysis = await ctx.task(systemAnalysisTask, {
    nonlinearSystem,
    knownSolution,
    perturbationParameter,
    outputDir
  });

  artifacts.push(...systemAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: PERTURBATION SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up perturbation expansion');
  const perturbationSetup = await ctx.task(perturbationSetupTask, {
    nonlinearSystem,
    knownSolution,
    perturbationParameter,
    orderOfExpansion,
    regularPerturbation,
    outputDir
  });

  artifacts.push(...perturbationSetup.artifacts);

  // ============================================================================
  // PHASE 3: ZEROTH ORDER (UNPERTURBED) SOLUTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Verifying zeroth order solution');
  const zerothOrder = await ctx.task(zerothOrderTask, {
    knownSolution,
    nonlinearSystem,
    outputDir
  });

  artifacts.push(...zerothOrder.artifacts);

  // ============================================================================
  // PHASE 4: LINEARIZATION (FIRST ORDER)
  // ============================================================================

  ctx.log('info', 'Phase 4: Deriving linearized equations (first order)');
  const linearization = await ctx.task(linearizationTask, {
    nonlinearSystem,
    zerothOrderSolution: zerothOrder.solution,
    perturbationParameter,
    outputDir
  });

  artifacts.push(...linearization.artifacts);

  // Breakpoint: Review linearized system
  await ctx.breakpoint({
    question: `Linearized system derived with ${linearization.linearTerms.length} linear terms. Proceed with higher-order corrections?`,
    title: 'Linearization Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        perturbationParameter,
        linearTermCount: linearization.linearTerms.length,
        orderOfExpansion
      }
    }
  });

  // ============================================================================
  // PHASE 5: HIGHER ORDER CORRECTIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Computing higher order corrections');
  const higherOrderCorrections = await ctx.task(higherOrderTask, {
    nonlinearSystem,
    zerothOrderSolution: zerothOrder.solution,
    firstOrderSolution: linearization.firstOrderSolution,
    perturbationParameter,
    orderOfExpansion,
    outputDir
  });

  artifacts.push(...higherOrderCorrections.artifacts);

  // ============================================================================
  // PHASE 6: SECULAR TERM ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing secular terms');
  const secularAnalysis = await ctx.task(secularTermAnalysisTask, {
    corrections: higherOrderCorrections.corrections,
    perturbationParameter,
    regularPerturbation,
    outputDir
  });

  artifacts.push(...secularAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: VALIDITY RANGE DETERMINATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Determining validity range of perturbation expansion');
  const validityDetermination = await ctx.task(validityRangeTask, {
    corrections: higherOrderCorrections.corrections,
    secularTerms: secularAnalysis.secularTerms,
    perturbationParameter,
    orderOfExpansion,
    outputDir
  });

  artifacts.push(...validityDetermination.artifacts);

  // ============================================================================
  // PHASE 8: SOLUTION SYNTHESIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing perturbative solution');
  const solutionSynthesis = await ctx.task(solutionSynthesisTask, {
    zerothOrderSolution: zerothOrder.solution,
    firstOrderSolution: linearization.firstOrderSolution,
    higherOrderCorrections: higherOrderCorrections.corrections,
    perturbationParameter,
    validityRange: validityDetermination.validityRange,
    outputDir
  });

  artifacts.push(...solutionSynthesis.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Perturbation analysis complete. Solution valid for ${perturbationParameter} < ${validityDetermination.validityRange.upperBound}. ${secularAnalysis.secularTerms.length} secular terms found. Review final solution?`,
    title: 'Perturbation Analysis Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        ordersComputed: orderOfExpansion,
        validityUpperBound: validityDetermination.validityRange.upperBound,
        secularTermCount: secularAnalysis.secularTerms.length,
        convergent: solutionSynthesis.convergenceAssessment
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    perturbationParameter,
    linearizedSystem: linearization.linearizedSystem,
    solutions: {
      zerothOrder: zerothOrder.solution,
      firstOrder: linearization.firstOrderSolution,
      higherOrders: higherOrderCorrections.corrections
    },
    corrections: higherOrderCorrections.corrections,
    secularTerms: secularAnalysis.secularTerms,
    validityRange: validityDetermination.validityRange,
    synthesizedSolution: solutionSynthesis.completeSolution,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/perturbation-linearization',
      timestamp: startTime,
      outputDir,
      orderOfExpansion
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: System Analysis
export const systemAnalysisTask = defineTask('system-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze the nonlinear system',
  agent: {
    name: 'nonlinear-analyst',
    prompt: {
      role: 'physicist analyzing nonlinear systems',
      task: 'Analyze the nonlinear system to prepare for perturbation analysis',
      context: args,
      instructions: [
        'Identify all nonlinear terms in the system',
        'Classify nonlinearities (polynomial, transcendental, etc.)',
        'Identify the small parameter for perturbation',
        'Verify that known solution satisfies unperturbed system',
        'Identify the physical meaning of the perturbation',
        'Assess whether regular or singular perturbation is needed',
        'Identify potential sources of secular terms',
        'Note any resonance conditions',
        'Document scales in the problem',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with nonlinearTerms, perturbationAnalysis, scaleAnalysis, resonanceConditions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['nonlinearTerms', 'perturbationAnalysis', 'artifacts'],
      properties: {
        nonlinearTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              type: { type: 'string' },
              order: { type: 'number' }
            }
          }
        },
        perturbationAnalysis: {
          type: 'object',
          properties: {
            parameterIdentified: { type: 'boolean' },
            physicalMeaning: { type: 'string' },
            expectedSmallness: { type: 'string' },
            regularVsSingular: { type: 'string' }
          }
        },
        scaleAnalysis: { type: 'object' },
        resonanceConditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'perturbation', 'physics', 'system-analysis']
}));

// Task 2: Perturbation Setup
export const perturbationSetupTask = defineTask('perturbation-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up perturbation expansion',
  agent: {
    name: 'perturbation-setup-specialist',
    prompt: {
      role: 'applied mathematician setting up perturbation theory',
      task: 'Set up the formal perturbation expansion',
      context: args,
      instructions: [
        'Define the expansion: y = y_0 + epsilon*y_1 + epsilon^2*y_2 + ...',
        'Expand all variables in powers of perturbation parameter',
        'Substitute expansion into governing equations',
        'Collect terms at each order of epsilon',
        'Derive equations at each order',
        'Set up boundary/initial conditions at each order',
        'For singular perturbation, identify boundary layers',
        'Set up matched asymptotic expansions if needed',
        'Document assumptions',
        'Save perturbation setup to output directory'
      ],
      outputFormat: 'JSON with expansion, equationsAtEachOrder, boundaryConditions, singularFeatures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['expansion', 'equationsAtEachOrder', 'artifacts'],
      properties: {
        expansion: {
          type: 'object',
          properties: {
            form: { type: 'string' },
            variables: { type: 'array', items: { type: 'string' } },
            parameter: { type: 'string' },
            order: { type: 'number' }
          }
        },
        equationsAtEachOrder: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              order: { type: 'number' },
              equation: { type: 'string' },
              boundaryCondition: { type: 'string' }
            }
          }
        },
        singularFeatures: {
          type: 'object',
          properties: {
            hasBoundaryLayer: { type: 'boolean' },
            boundaryLayerLocation: { type: 'string' },
            innerVariable: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'perturbation', 'physics', 'expansion-setup']
}));

// Task 3: Zeroth Order Solution
export const zerothOrderTask = defineTask('zeroth-order', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify zeroth order solution',
  agent: {
    name: 'zeroth-order-solver',
    prompt: {
      role: 'physicist verifying base solution',
      task: 'Verify and document the zeroth order (unperturbed) solution',
      context: args,
      instructions: [
        'Verify known solution satisfies the unperturbed equation',
        'Document the zeroth order solution explicitly',
        'Identify key features of the unperturbed solution',
        'Check boundary/initial conditions are satisfied',
        'Identify symmetries of the zeroth order solution',
        'Note any special points (equilibria, fixed points)',
        'Document physical interpretation',
        'This forms the base for the perturbation expansion',
        'Save zeroth order analysis to output directory'
      ],
      outputFormat: 'JSON with solution (expression, verification, features), physicalInterpretation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['solution', 'artifacts'],
      properties: {
        solution: {
          type: 'object',
          properties: {
            expression: { type: 'string' },
            verified: { type: 'boolean' },
            verificationDetails: { type: 'string' },
            features: { type: 'array', items: { type: 'string' } },
            symmetries: { type: 'array', items: { type: 'string' } },
            specialPoints: { type: 'array', items: { type: 'string' } }
          }
        },
        physicalInterpretation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'perturbation', 'physics', 'zeroth-order']
}));

// Task 4: Linearization
export const linearizationTask = defineTask('linearization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Derive linearized equations',
  agent: {
    name: 'linearization-specialist',
    prompt: {
      role: 'physicist performing linearization',
      task: 'Derive the linearized (first order) equations around the zeroth order solution',
      context: args,
      instructions: [
        'Derive the equation for first-order correction y_1',
        'This is typically a linear equation (hence "linearization")',
        'Identify the linear operator acting on y_1',
        'Identify inhomogeneous terms (forcing)',
        'Solve the first-order equation',
        'Apply boundary/initial conditions',
        'Identify any resonance with zeroth-order solution',
        'Note if first-order solution contains secular terms',
        'Document physical interpretation of first correction',
        'Save linearized system to output directory'
      ],
      outputFormat: 'JSON with linearizedSystem, linearTerms, firstOrderSolution, secularCheck, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['linearizedSystem', 'firstOrderSolution', 'artifacts'],
      properties: {
        linearizedSystem: {
          type: 'object',
          properties: {
            linearOperator: { type: 'string' },
            inhomogeneousTerm: { type: 'string' },
            equation: { type: 'string' },
            boundaryCondition: { type: 'string' }
          }
        },
        linearTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              coefficient: { type: 'string' }
            }
          }
        },
        firstOrderSolution: {
          type: 'object',
          properties: {
            expression: { type: 'string' },
            method: { type: 'string' },
            hasSecularTerms: { type: 'boolean' }
          }
        },
        secularCheck: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'perturbation', 'physics', 'linearization']
}));

// Task 5: Higher Order Corrections
export const higherOrderTask = defineTask('higher-order', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute higher order corrections',
  agent: {
    name: 'higher-order-solver',
    prompt: {
      role: 'physicist computing higher-order perturbation terms',
      task: 'Compute corrections at second order and higher',
      context: args,
      instructions: [
        'Derive equations for y_2, y_3, ... up to requested order',
        'Note: higher orders have increasingly complex forcing terms',
        'Forcing comes from nonlinear interactions of lower-order terms',
        'Solve each order in sequence',
        'Track secular terms at each order',
        'Check for resonance conditions',
        'Document computational complexity increase with order',
        'Note diminishing corrections (if convergent)',
        'Save higher order corrections to output directory'
      ],
      outputFormat: 'JSON with corrections (array with order, equation, solution, secular), convergenceTrend, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['corrections', 'artifacts'],
      properties: {
        corrections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              order: { type: 'number' },
              equation: { type: 'string' },
              forcingTerm: { type: 'string' },
              solution: { type: 'string' },
              hasSecularTerms: { type: 'boolean' },
              secularTerms: { type: 'array', items: { type: 'string' } },
              magnitude: { type: 'string' }
            }
          }
        },
        convergenceTrend: { type: 'string' },
        resonanceConditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'perturbation', 'physics', 'higher-order']
}));

// Task 6: Secular Term Analysis
export const secularTermAnalysisTask = defineTask('secular-term-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze secular terms',
  agent: {
    name: 'secular-analyst',
    prompt: {
      role: 'physicist analyzing secular terms in perturbation theory',
      task: 'Analyze secular terms and determine if resummation is needed',
      context: args,
      instructions: [
        'Identify all secular terms (terms growing without bound)',
        'Common form: t*sin(wt) instead of sin(wt)',
        'Secular terms indicate breakdown of naive perturbation',
        'Identify physical origin of secular terms',
        'Determine if multiple-scales or Poincare-Lindstedt needed',
        'If singular perturbation, check matching conditions',
        'Suggest method to eliminate secular terms',
        'Assess impact on validity range',
        'Save secular term analysis to output directory'
      ],
      outputFormat: 'JSON with secularTerms (array with term, order, source, remedy), needsResummation, suggestedMethod, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['secularTerms', 'artifacts'],
      properties: {
        secularTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              order: { type: 'number' },
              growthRate: { type: 'string' },
              physicalSource: { type: 'string' },
              remedy: { type: 'string' }
            }
          }
        },
        needsResummation: { type: 'boolean' },
        suggestedMethod: { type: 'string' },
        validityImplication: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'perturbation', 'physics', 'secular-terms']
}));

// Task 7: Validity Range Determination
export const validityRangeTask = defineTask('validity-range', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine validity range',
  agent: {
    name: 'validity-analyst',
    prompt: {
      role: 'physicist determining perturbation validity',
      task: 'Determine the range of validity of the perturbation expansion',
      context: args,
      instructions: [
        'Estimate when higher-order terms become comparable to lower-order',
        'Validity requires: |epsilon*y_1| << |y_0|, etc.',
        'Account for secular term growth if present',
        'Estimate time scale of validity if time-dependent',
        'Estimate parameter range of validity',
        'Check convergence of the series',
        'Identify breakdown criteria',
        'Compare with known exact results if available',
        'Document confidence in validity estimate',
        'Save validity analysis to output directory'
      ],
      outputFormat: 'JSON with validityRange (upperBound, timeScale, breakdownCriteria, confidence), convergenceAnalysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validityRange', 'artifacts'],
      properties: {
        validityRange: {
          type: 'object',
          properties: {
            upperBound: { type: 'string' },
            lowerBound: { type: 'string' },
            timeScale: { type: 'string' },
            breakdownCriteria: { type: 'string' },
            confidence: { type: 'string' }
          }
        },
        convergenceAnalysis: {
          type: 'object',
          properties: {
            convergent: { type: 'boolean' },
            radiusOfConvergence: { type: 'string' },
            asymptoticVsConvergent: { type: 'string' }
          }
        },
        comparisonWithExact: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'perturbation', 'physics', 'validity']
}));

// Task 8: Solution Synthesis
export const solutionSynthesisTask = defineTask('solution-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize perturbative solution',
  agent: {
    name: 'solution-synthesizer',
    prompt: {
      role: 'physicist synthesizing final solution',
      task: 'Synthesize the complete perturbative solution',
      context: args,
      instructions: [
        'Assemble complete solution: y = y_0 + epsilon*y_1 + epsilon^2*y_2 + ...',
        'Write solution in most useful form',
        'Simplify where possible',
        'Express error estimate',
        'Provide truncated forms at various orders',
        'Compare with unperturbed solution',
        'Highlight key corrections to physics',
        'Provide computational formula if needed',
        'Assess overall convergence',
        'Save complete solution to output directory'
      ],
      outputFormat: 'JSON with completeSolution, truncatedForms, errorEstimate, convergenceAssessment, physicalCorrections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['completeSolution', 'convergenceAssessment', 'artifacts'],
      properties: {
        completeSolution: {
          type: 'object',
          properties: {
            expression: { type: 'string' },
            form: { type: 'string' },
            order: { type: 'number' }
          }
        },
        truncatedForms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              order: { type: 'number' },
              expression: { type: 'string' }
            }
          }
        },
        errorEstimate: { type: 'string' },
        convergenceAssessment: { type: 'string' },
        physicalCorrections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              correction: { type: 'string' },
              physicalMeaning: { type: 'string' },
              magnitude: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'perturbation', 'physics', 'solution-synthesis']
}));
