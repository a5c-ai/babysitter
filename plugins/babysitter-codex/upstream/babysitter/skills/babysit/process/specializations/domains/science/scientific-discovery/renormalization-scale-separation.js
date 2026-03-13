/**
 * @process scientific-discovery/renormalization-scale-separation
 * @description Renormalization and Scale Separation process (Physics) - Separate behaviors at different scales and manage infinities through renormalization
 * @inputs { physicalSystem: string, observedScales: array, couplings: array, outputDir: string }
 * @outputs { success: boolean, separatedScales: array, effectiveTheory: object, runningCouplings: array, universality: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    physicalSystem = '',
    observedScales = [],
    couplings = [],
    outputDir = 'renormalization-output',
    regulatizationScheme = 'dimensional'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Renormalization and Scale Separation Process');

  // ============================================================================
  // PHASE 1: SCALE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying scales in the system');
  const scaleIdentification = await ctx.task(scaleIdentificationTask, {
    physicalSystem,
    observedScales,
    outputDir
  });

  artifacts.push(...scaleIdentification.artifacts);

  // ============================================================================
  // PHASE 2: DIVERGENCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing divergences and infinities');
  const divergenceAnalysis = await ctx.task(divergenceAnalysisTask, {
    physicalSystem,
    scales: scaleIdentification.scales,
    outputDir
  });

  artifacts.push(...divergenceAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: REGULARIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Regularizing divergent quantities');
  const regularization = await ctx.task(regularizationTask, {
    divergences: divergenceAnalysis.divergences,
    regulatizationScheme,
    outputDir
  });

  artifacts.push(...regularization.artifacts);

  // ============================================================================
  // PHASE 4: RENORMALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Renormalizing parameters');
  const renormalization = await ctx.task(renormalizationTask, {
    regularizedQuantities: regularization.regularizedQuantities,
    couplings,
    physicalSystem,
    outputDir
  });

  artifacts.push(...renormalization.artifacts);

  // Breakpoint: Review renormalization
  await ctx.breakpoint({
    question: `Renormalization complete. ${renormalization.renormalizedParameters.length} parameters renormalized. Proceed with RG flow analysis?`,
    title: 'Renormalization Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        physicalSystem,
        divergencesFound: divergenceAnalysis.divergences.length,
        parametersRenormalized: renormalization.renormalizedParameters.length
      }
    }
  });

  // ============================================================================
  // PHASE 5: RENORMALIZATION GROUP FLOW
  // ============================================================================

  ctx.log('info', 'Phase 5: Deriving renormalization group equations');
  const rgFlow = await ctx.task(rgFlowTask, {
    renormalizedParameters: renormalization.renormalizedParameters,
    scales: scaleIdentification.scales,
    outputDir
  });

  artifacts.push(...rgFlow.artifacts);

  // ============================================================================
  // PHASE 6: FIXED POINT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing fixed points of RG flow');
  const fixedPointAnalysis = await ctx.task(fixedPointTask, {
    betaFunctions: rgFlow.betaFunctions,
    couplings,
    outputDir
  });

  artifacts.push(...fixedPointAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: EFFECTIVE THEORY CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Constructing effective theory at each scale');
  const effectiveTheory = await ctx.task(effectiveTheoryTask, {
    scales: scaleIdentification.scales,
    rgFlow: rgFlow.betaFunctions,
    fixedPoints: fixedPointAnalysis.fixedPoints,
    physicalSystem,
    outputDir
  });

  artifacts.push(...effectiveTheory.artifacts);

  // ============================================================================
  // PHASE 8: UNIVERSALITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Analyzing universality and critical behavior');
  const universalityAnalysis = await ctx.task(universalityTask, {
    fixedPoints: fixedPointAnalysis.fixedPoints,
    criticalExponents: fixedPointAnalysis.criticalExponents,
    physicalSystem,
    outputDir
  });

  artifacts.push(...universalityAnalysis.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Scale separation analysis complete. ${fixedPointAnalysis.fixedPoints.length} fixed points found. Universality class: ${universalityAnalysis.universalityClass}. Review findings?`,
    title: 'Renormalization Analysis Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        scalesSeparated: scaleIdentification.scales.length,
        fixedPointCount: fixedPointAnalysis.fixedPoints.length,
        universalityClass: universalityAnalysis.universalityClass
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    physicalSystem,
    separatedScales: scaleIdentification.scales,
    renormalization: {
      divergences: divergenceAnalysis.divergences,
      renormalizedParameters: renormalization.renormalizedParameters,
      counterterms: renormalization.counterterms
    },
    rgFlow: {
      betaFunctions: rgFlow.betaFunctions,
      runningCouplings: rgFlow.runningCouplings
    },
    fixedPoints: fixedPointAnalysis.fixedPoints,
    criticalExponents: fixedPointAnalysis.criticalExponents,
    effectiveTheory: effectiveTheory.theory,
    universality: {
      universalityClass: universalityAnalysis.universalityClass,
      universalQuantities: universalityAnalysis.universalQuantities
    },
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/renormalization-scale-separation',
      timestamp: startTime,
      outputDir,
      regulatizationScheme
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Scale Identification
export const scaleIdentificationTask = defineTask('scale-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify scales in the system',
  agent: {
    name: 'scale-analyst',
    prompt: {
      role: 'physicist identifying scales in physical systems',
      task: 'Identify all relevant scales in the physical system',
      context: args,
      instructions: [
        'Identify all length scales in the problem',
        'Identify all energy/momentum scales',
        'Identify time scales',
        'Order scales by magnitude',
        'Identify large scale separations (hierarchies)',
        'Note UV (ultraviolet/short distance) scales',
        'Note IR (infrared/long distance) scales',
        'Identify intermediate scales',
        'Note dynamically generated scales',
        'Document physical meaning of each scale',
        'Save scale analysis to output directory'
      ],
      outputFormat: 'JSON with scales (array with name, type, value, physical meaning), hierarchies, uvScale, irScale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scales', 'artifacts'],
      properties: {
        scales: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              value: { type: 'string' },
              physicalMeaning: { type: 'string' },
              origin: { type: 'string' }
            }
          }
        },
        hierarchies: { type: 'array', items: { type: 'string' } },
        uvScale: { type: 'string' },
        irScale: { type: 'string' },
        dynamicallyGenerated: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'renormalization', 'physics', 'scale-identification']
}));

// Task 2: Divergence Analysis
export const divergenceAnalysisTask = defineTask('divergence-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze divergences and infinities',
  agent: {
    name: 'divergence-analyst',
    prompt: {
      role: 'theoretical physicist analyzing divergences',
      task: 'Identify and classify divergences in the theory',
      context: args,
      instructions: [
        'Identify UV divergences (high energy/momentum)',
        'Identify IR divergences (low energy/momentum)',
        'Classify divergences by degree (logarithmic, linear, quadratic)',
        'Identify which quantities are divergent',
        'Trace physical origin of each divergence',
        'Determine if divergences are real or artifacts',
        'Identify superficial degree of divergence',
        'Check power counting',
        'Note which diagrams/terms are divergent',
        'Save divergence analysis to output directory'
      ],
      outputFormat: 'JSON with divergences (array with type, degree, quantity, origin), powerCounting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['divergences', 'artifacts'],
      properties: {
        divergences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              degree: { type: 'string' },
              affectedQuantity: { type: 'string' },
              origin: { type: 'string' },
              diagram: { type: 'string' }
            }
          }
        },
        powerCounting: { type: 'object' },
        superficialDegree: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'renormalization', 'physics', 'divergence-analysis']
}));

// Task 3: Regularization
export const regularizationTask = defineTask('regularization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Regularize divergent quantities',
  agent: {
    name: 'regularization-specialist',
    prompt: {
      role: 'physicist implementing regularization',
      task: 'Regularize divergent quantities using appropriate scheme',
      context: args,
      instructions: [
        'Choose appropriate regularization scheme',
        'Dimensional regularization: work in d = 4-epsilon dimensions',
        'Cutoff regularization: introduce momentum cutoff Lambda',
        'Pauli-Villars: introduce heavy regulator fields',
        'Apply regularization to each divergent quantity',
        'Express divergences in terms of regulator (epsilon or Lambda)',
        'Identify poles in epsilon (for dimensional reg)',
        'Preserve symmetries if possible',
        'Document regularization procedure',
        'Save regularized quantities to output directory'
      ],
      outputFormat: 'JSON with regularizedQuantities (array with original, regularized, regulator dependence), scheme, symmetryPreservation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['regularizedQuantities', 'scheme', 'artifacts'],
      properties: {
        regularizedQuantities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              originalQuantity: { type: 'string' },
              regularizedForm: { type: 'string' },
              regulatorDependence: { type: 'string' },
              poleStructure: { type: 'string' }
            }
          }
        },
        scheme: { type: 'string' },
        regulator: { type: 'string' },
        symmetryPreservation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'renormalization', 'physics', 'regularization']
}));

// Task 4: Renormalization
export const renormalizationTask = defineTask('renormalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Renormalize parameters',
  agent: {
    name: 'renormalization-specialist',
    prompt: {
      role: 'theoretical physicist performing renormalization',
      task: 'Renormalize bare parameters to absorb divergences',
      context: args,
      instructions: [
        'Define renormalized parameters in terms of bare parameters',
        'g_bare = Z_g * g_renormalized',
        'Calculate renormalization constants (Z factors)',
        'Introduce counterterms to cancel divergences',
        'Choose renormalization conditions (MS, MS-bar, on-shell)',
        'Express physical quantities in terms of renormalized parameters',
        'Verify cancellation of divergences',
        'Document renormalization scale (mu)',
        'Check renormalizability',
        'Save renormalized parameters to output directory'
      ],
      outputFormat: 'JSON with renormalizedParameters, counterterms, zFactors, renormalizationConditions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['renormalizedParameters', 'counterterms', 'artifacts'],
      properties: {
        renormalizedParameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              bareParameter: { type: 'string' },
              renormalizedParameter: { type: 'string' },
              zFactor: { type: 'string' },
              relation: { type: 'string' }
            }
          }
        },
        counterterms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              coefficient: { type: 'string' }
            }
          }
        },
        zFactors: { type: 'object' },
        renormalizationConditions: { type: 'array', items: { type: 'string' } },
        renormalizationScale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'renormalization', 'physics', 'renormalization']
}));

// Task 5: RG Flow
export const rgFlowTask = defineTask('rg-flow', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Derive renormalization group equations',
  agent: {
    name: 'rg-flow-specialist',
    prompt: {
      role: 'physicist deriving RG equations',
      task: 'Derive renormalization group (RG) equations describing scale evolution',
      context: args,
      instructions: [
        'Derive beta functions: beta(g) = mu * dg/dmu',
        'Physical quantities must be independent of renormalization scale',
        'Use Callan-Symanzik equation',
        'Calculate anomalous dimensions',
        'Derive running of all couplings with scale',
        'Identify direction of flow (UV vs IR)',
        'Solve RG equations for running couplings',
        'Note asymptotic behavior (asymptotic freedom, etc.)',
        'Document Landau poles if present',
        'Save RG flow analysis to output directory'
      ],
      outputFormat: 'JSON with betaFunctions, anomalousDimensions, runningCouplings, asymptoticBehavior, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['betaFunctions', 'runningCouplings', 'artifacts'],
      properties: {
        betaFunctions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              coupling: { type: 'string' },
              betaFunction: { type: 'string' },
              oneLoop: { type: 'string' },
              twoLoop: { type: 'string' }
            }
          }
        },
        anomalousDimensions: { type: 'object' },
        runningCouplings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              coupling: { type: 'string' },
              runningForm: { type: 'string' },
              uvBehavior: { type: 'string' },
              irBehavior: { type: 'string' }
            }
          }
        },
        asymptoticBehavior: { type: 'object' },
        landauPoles: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'renormalization', 'physics', 'rg-flow']
}));

// Task 6: Fixed Point Analysis
export const fixedPointTask = defineTask('fixed-point-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze fixed points of RG flow',
  agent: {
    name: 'fixed-point-analyst',
    prompt: {
      role: 'physicist analyzing RG fixed points',
      task: 'Analyze fixed points of the renormalization group flow',
      context: args,
      instructions: [
        'Find fixed points: beta(g*) = 0',
        'Classify fixed points as UV or IR',
        'Analyze stability of each fixed point',
        'Calculate critical exponents at fixed points',
        'Linearize RG flow near fixed points',
        'Identify relevant, irrelevant, and marginal operators',
        'Calculate eigenvalues of stability matrix',
        'Identify UV-stable and IR-stable fixed points',
        'Document basin of attraction for each fixed point',
        'Save fixed point analysis to output directory'
      ],
      outputFormat: 'JSON with fixedPoints, criticalExponents, stabilityAnalysis, relevantOperators, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['fixedPoints', 'criticalExponents', 'artifacts'],
      properties: {
        fixedPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              couplingValues: { type: 'object' },
              type: { type: 'string' },
              stability: { type: 'string' },
              basinOfAttraction: { type: 'string' }
            }
          }
        },
        criticalExponents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fixedPointId: { type: 'string' },
              exponent: { type: 'string' },
              value: { type: 'number' },
              physicalMeaning: { type: 'string' }
            }
          }
        },
        stabilityMatrix: { type: 'object' },
        relevantOperators: { type: 'array', items: { type: 'string' } },
        irrelevantOperators: { type: 'array', items: { type: 'string' } },
        marginalOperators: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'renormalization', 'physics', 'fixed-points']
}));

// Task 7: Effective Theory Construction
export const effectiveTheoryTask = defineTask('effective-theory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct effective theory at each scale',
  agent: {
    name: 'effective-theory-builder',
    prompt: {
      role: 'physicist constructing effective field theories',
      task: 'Construct effective theories valid at different scales',
      context: args,
      instructions: [
        'Integrate out high-energy degrees of freedom',
        'Construct effective Lagrangian at low energies',
        'Identify relevant operators at each scale',
        'Match theories at scale boundaries',
        'Calculate Wilson coefficients',
        'Order operators by dimension',
        'Truncate to desired accuracy',
        'Document what physics is captured vs lost',
        'Note limitations of effective description',
        'Save effective theory to output directory'
      ],
      outputFormat: 'JSON with theory (lagrangian, operators, validity), wilsonCoefficients, matching, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['theory', 'artifacts'],
      properties: {
        theory: {
          type: 'object',
          properties: {
            effectiveLagrangian: { type: 'string' },
            operators: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  operator: { type: 'string' },
                  dimension: { type: 'number' },
                  coefficient: { type: 'string' }
                }
              }
            },
            validityRange: { type: 'object' },
            degreesOfFreedom: { type: 'array', items: { type: 'string' } }
          }
        },
        wilsonCoefficients: { type: 'object' },
        matching: { type: 'object' },
        integratedOutFields: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'renormalization', 'physics', 'effective-theory']
}));

// Task 8: Universality Analysis
export const universalityTask = defineTask('universality-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze universality and critical behavior',
  agent: {
    name: 'universality-analyst',
    prompt: {
      role: 'physicist analyzing universal behavior',
      task: 'Analyze universality class and universal critical behavior',
      context: args,
      instructions: [
        'Identify universality class from fixed point structure',
        'Determine which quantities are universal',
        'Calculate universal amplitude ratios',
        'Identify scaling functions',
        'Note which microscopic details are irrelevant',
        'Compare with known universality classes',
        'Document critical phenomena if applicable',
        'Identify universal scaling laws',
        'Note finite-size scaling if relevant',
        'Save universality analysis to output directory'
      ],
      outputFormat: 'JSON with universalityClass, universalQuantities, scalingFunctions, comparisonWithKnown, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['universalityClass', 'universalQuantities', 'artifacts'],
      properties: {
        universalityClass: { type: 'string' },
        universalQuantities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quantity: { type: 'string' },
              value: { type: 'string' },
              isUniversal: { type: 'boolean' }
            }
          }
        },
        scalingFunctions: { type: 'array' },
        amplitudeRatios: { type: 'object' },
        irrelevantDetails: { type: 'array', items: { type: 'string' } },
        comparisonWithKnown: {
          type: 'object',
          properties: {
            matches: { type: 'array', items: { type: 'string' } },
            differences: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'scientific-discovery', 'renormalization', 'physics', 'universality']
}));
