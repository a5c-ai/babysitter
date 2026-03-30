/**
 * @process domains/science/scientific-discovery/scale-invariance-reasoning
 * @description Scale Invariance Reasoning: Seek laws invariant under scale changes
 * @inputs {
 *   phenomenon: string,
 *   scales: array,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   invariantLaws: array,
 *   scalingRelations: array,
 *   insights: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    phenomenon,
    scales = [],
    domain = 'general science'
  } = inputs;

  const startTime = ctx.now();

  // Phase 1: Identify Candidate Quantities
  ctx.log('info', 'Identifying candidate quantities for scale analysis');
  const quantities = await ctx.task(identifyQuantitiesTask, {
    phenomenon,
    scales,
    domain
  });

  // Phase 2: Test Scale Transformations
  ctx.log('info', 'Testing scale transformations');
  const scaleTransformations = await ctx.task(testScaleTransformationsTask, {
    phenomenon,
    quantities,
    scales,
    domain
  });

  // Phase 3: Identify Scale-Invariant Laws
  ctx.log('info', 'Identifying scale-invariant laws');
  const invariantLaws = await ctx.task(identifyInvariantLawsTask, {
    scaleTransformations,
    quantities,
    domain
  });

  await ctx.breakpoint({
    question: 'Scale invariance analysis complete. Review before scaling relations?',
    title: 'Scale Invariance - Invariants Identified',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/quantities.json', format: 'json' },
        { path: 'artifacts/invariant-laws.json', format: 'json' }
      ]
    }
  });

  // Phase 4: Derive Scaling Relations
  ctx.log('info', 'Deriving scaling relations');
  const scalingRelations = await ctx.task(deriveScalingRelationsTask, {
    invariantLaws,
    quantities,
    domain
  });

  // Phase 5: Identify Universality Classes
  ctx.log('info', 'Identifying universality classes');
  const universalityClasses = await ctx.task(identifyUniversalityClassesTask, {
    invariantLaws,
    scalingRelations,
    domain
  });

  // Phase 6: Test Predictions
  ctx.log('info', 'Testing scale invariance predictions');
  const predictionTests = await ctx.task(testPredictionsTask, {
    invariantLaws,
    scalingRelations,
    phenomenon,
    domain
  });

  // Phase 7: Synthesize Insights
  ctx.log('info', 'Synthesizing scale invariance insights');
  const synthesis = await ctx.task(synthesizeScaleInsightsTask, {
    phenomenon,
    quantities,
    invariantLaws,
    scalingRelations,
    universalityClasses,
    predictionTests,
    domain
  });

  return {
    success: true,
    processId: 'domains/science/scientific-discovery/scale-invariance-reasoning',
    phenomenon,
    domain,
    quantities,
    scaleTransformations,
    invariantLaws: invariantLaws.laws,
    scalingRelations: scalingRelations.relations,
    universalityClasses,
    predictionTests,
    insights: synthesis.insights,
    synthesis,
    metadata: {
      quantitiesAnalyzed: quantities.quantities?.length || 0,
      invariantLawsFound: invariantLaws.laws?.length || 0,
      scalingRelationsFound: scalingRelations.relations?.length || 0,
      universalityClassesIdentified: universalityClasses.classes?.length || 0,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const identifyQuantitiesTask = defineTask('identify-quantities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Candidate Quantities',
  agent: {
    name: 'quantity-identifier',
    prompt: {
      role: 'dimensional analyst',
      task: 'Identify quantities relevant for scale analysis',
      context: args,
      instructions: [
        'List all measurable quantities in the phenomenon',
        'Identify their dimensions and units',
        'Determine characteristic scales for each quantity',
        'Identify dimensionless combinations',
        'Document how quantities change with scale',
        'Identify conserved quantities',
        'Find natural scaling variables'
      ],
      outputFormat: 'JSON with quantities, dimensions, characteristic scales'
    },
    outputSchema: {
      type: 'object',
      required: ['quantities', 'dimensionlessCombinations'],
      properties: {
        quantities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              dimensions: { type: 'object' },
              units: { type: 'string' },
              characteristicScale: { type: 'object' }
            }
          }
        },
        dimensionlessCombinations: { type: 'array', items: { type: 'object' } },
        conservedQuantities: { type: 'array', items: { type: 'string' } },
        scalingVariables: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-invariance', 'quantities']
}));

export const testScaleTransformationsTask = defineTask('test-scale-transformations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test Scale Transformations',
  agent: {
    name: 'transformation-tester',
    prompt: {
      role: 'scaling analyst',
      task: 'Test how the system transforms under scale changes',
      context: args,
      instructions: [
        'Apply scaling transformations to quantities',
        'Document how relationships change under scaling',
        'Identify transformations that preserve relationships',
        'Find scaling exponents',
        'Test for power-law behavior',
        'Identify scale-dependent vs scale-free behaviors',
        'Document transformation results'
      ],
      outputFormat: 'JSON with transformations, preserved relationships, exponents'
    },
    outputSchema: {
      type: 'object',
      required: ['transformations', 'preservedRelationships'],
      properties: {
        transformations: { type: 'array', items: { type: 'object' } },
        preservedRelationships: { type: 'array', items: { type: 'object' } },
        changedRelationships: { type: 'array', items: { type: 'object' } },
        scalingExponents: { type: 'array', items: { type: 'object' } },
        powerLawBehaviors: { type: 'array', items: { type: 'object' } },
        scaleFreeAspects: { type: 'array', items: { type: 'string' } },
        scaleDependentAspects: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-invariance', 'transformations']
}));

export const identifyInvariantLawsTask = defineTask('identify-invariant-laws', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Scale-Invariant Laws',
  agent: {
    name: 'invariant-finder',
    prompt: {
      role: 'theoretical physicist',
      task: 'Identify laws that are invariant under scale changes',
      context: args,
      instructions: [
        'Find relationships invariant under scaling',
        'Formulate scale-invariant laws',
        'Determine the symmetry group of invariance',
        'Identify the form of invariant equations',
        'Document any anomalous scaling',
        'Find quasi-scale-invariant laws',
        'Assess the range of scale invariance'
      ],
      outputFormat: 'JSON with invariant laws, symmetry groups, ranges'
    },
    outputSchema: {
      type: 'object',
      required: ['laws'],
      properties: {
        laws: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              formulation: { type: 'string' },
              symmetryGroup: { type: 'string' },
              rangeOfValidity: { type: 'object' },
              anomalousScaling: { type: 'boolean' }
            }
          }
        },
        quasiInvariantLaws: { type: 'array', items: { type: 'object' } },
        invarianceRanges: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-invariance', 'laws']
}));

export const deriveScalingRelationsTask = defineTask('derive-scaling-relations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Derive Scaling Relations',
  agent: {
    name: 'scaling-deriver',
    prompt: {
      role: 'mathematical physicist',
      task: 'Derive scaling relations from invariant laws',
      context: args,
      instructions: [
        'Derive how quantities scale with characteristic scale',
        'Find scaling relations between quantities',
        'Identify critical exponents',
        'Derive scaling functions',
        'Find data collapse conditions',
        'Identify hyperscaling relations',
        'Document derivation steps'
      ],
      outputFormat: 'JSON with scaling relations, exponents, functions'
    },
    outputSchema: {
      type: 'object',
      required: ['relations'],
      properties: {
        relations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              relation: { type: 'string' },
              exponents: { type: 'object' },
              scalingFunction: { type: 'string' },
              derivation: { type: 'string' }
            }
          }
        },
        criticalExponents: { type: 'array', items: { type: 'object' } },
        dataCollapseConditions: { type: 'array', items: { type: 'object' } },
        hyperscalingRelations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-invariance', 'relations']
}));

export const identifyUniversalityClassesTask = defineTask('identify-universality-classes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Universality Classes',
  agent: {
    name: 'universality-analyst',
    prompt: {
      role: 'statistical physicist',
      task: 'Identify universality classes for the phenomenon',
      context: args,
      instructions: [
        'Identify which universality class the system belongs to',
        'Find systems in the same universality class',
        'Document universal and non-universal properties',
        'Identify the relevant variables for universality',
        'Compare with known universality classes',
        'Identify crossover phenomena',
        'Document universality class characteristics'
      ],
      outputFormat: 'JSON with universality classes, universal properties, crossovers'
    },
    outputSchema: {
      type: 'object',
      required: ['classes'],
      properties: {
        classes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              characteristics: { type: 'array', items: { type: 'string' } },
              universalProperties: { type: 'array', items: { type: 'string' } },
              nonUniversalProperties: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        relatedSystems: { type: 'array', items: { type: 'string' } },
        relevantVariables: { type: 'array', items: { type: 'string' } },
        crossoverPhenomena: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-invariance', 'universality']
}));

export const testPredictionsTask = defineTask('test-predictions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test Scale Invariance Predictions',
  agent: {
    name: 'prediction-tester',
    prompt: {
      role: 'experimental physicist',
      task: 'Test predictions from scale invariance analysis',
      context: args,
      instructions: [
        'Generate testable predictions from scaling laws',
        'Test predictions against known data or simulations',
        'Assess prediction accuracy',
        'Identify where scaling predictions break down',
        'Document confirmation and falsification',
        'Identify predictions for new scales',
        'Assess overall predictive power'
      ],
      outputFormat: 'JSON with predictions, tests, accuracy, breakdowns'
    },
    outputSchema: {
      type: 'object',
      required: ['predictions', 'testResults'],
      properties: {
        predictions: { type: 'array', items: { type: 'object' } },
        testResults: { type: 'array', items: { type: 'object' } },
        accuracy: { type: 'object' },
        breakdowns: { type: 'array', items: { type: 'object' } },
        confirmations: { type: 'array', items: { type: 'string' } },
        falsifications: { type: 'array', items: { type: 'string' } },
        newScalePredictions: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-invariance', 'testing']
}));

export const synthesizeScaleInsightsTask = defineTask('synthesize-scale-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Scale Invariance Insights',
  agent: {
    name: 'insight-synthesizer',
    prompt: {
      role: 'theoretical physicist',
      task: 'Synthesize insights from scale invariance analysis',
      context: args,
      instructions: [
        'Summarize key scale invariance findings',
        'Extract general principles from analysis',
        'Document the power of scale invariance approach',
        'Identify limitations and caveats',
        'Provide recommendations for application',
        'Note connections to other phenomena',
        'Create comprehensive synthesis'
      ],
      outputFormat: 'JSON with synthesis, insights, principles, connections'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'insights'],
      properties: {
        synthesis: { type: 'string' },
        insights: { type: 'array', items: { type: 'string' } },
        generalPrinciples: { type: 'array', items: { type: 'string' } },
        approachPower: { type: 'string' },
        limitations: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        phenomenaConnections: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-invariance', 'synthesis']
}));
