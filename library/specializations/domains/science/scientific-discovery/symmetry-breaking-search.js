/**
 * @process domains/science/scientific-discovery/symmetry-breaking-search
 * @description Symmetry Breaking Search: Start with maximal symmetry; introduce specific breaks
 * @inputs {
 *   system: string,
 *   domain: string,
 *   targetProperties: array
 * }
 * @outputs {
 *   success: boolean,
 *   symmetryAnalysis: object,
 *   breakingSequence: array,
 *   insights: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    system,
    domain = 'general science',
    targetProperties = []
  } = inputs;

  const startTime = ctx.now();
  const breakingSequence = [];

  // Phase 1: Identify Maximal Symmetry State
  ctx.log('info', 'Identifying maximal symmetry state');
  const maximalSymmetry = await ctx.task(identifyMaximalSymmetryTask, {
    system,
    domain
  });

  // Phase 2: Catalog All Symmetries
  ctx.log('info', 'Cataloging all symmetries');
  const symmetryCatalog = await ctx.task(catalogSymmetriesTask, {
    maximalSymmetry,
    system,
    domain
  });

  // Phase 3: Analyze Property-Symmetry Relationships
  ctx.log('info', 'Analyzing property-symmetry relationships');
  const propertySymmetryRelations = await ctx.task(analyzePropertySymmetryTask, {
    symmetryCatalog,
    targetProperties,
    domain
  });

  await ctx.breakpoint({
    question: 'Symmetry analysis complete. Review before breaking sequence design?',
    title: 'Symmetry Breaking - Analysis Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/maximal-symmetry.json', format: 'json' },
        { path: 'artifacts/symmetry-catalog.json', format: 'json' }
      ]
    }
  });

  // Phase 4: Design Symmetry Breaking Sequence
  ctx.log('info', 'Designing symmetry breaking sequence');
  const breakingDesign = await ctx.task(designBreakingSequenceTask, {
    maximalSymmetry,
    symmetryCatalog,
    propertySymmetryRelations,
    targetProperties,
    domain
  });

  // Phase 5: Execute Breaking Sequence
  ctx.log('info', 'Executing symmetry breaking sequence');
  let currentState = maximalSymmetry.state;

  for (const step of breakingDesign.sequence) {
    const breakResult = await ctx.task(executeBreakingStepTask, {
      currentState,
      step,
      symmetryCatalog,
      domain
    });

    currentState = breakResult.newState;
    breakingSequence.push({
      step,
      result: breakResult,
      remainingSymmetries: breakResult.remainingSymmetries,
      emergentProperties: breakResult.emergentProperties,
      timestamp: ctx.now()
    });
  }

  // Phase 6: Analyze Breaking Results
  ctx.log('info', 'Analyzing symmetry breaking results');
  const breakingAnalysis = await ctx.task(analyzeBreakingResultsTask, {
    maximalSymmetry,
    breakingSequence,
    targetProperties,
    domain
  });

  // Phase 7: Identify Alternative Breaking Paths
  ctx.log('info', 'Identifying alternative breaking paths');
  const alternativePaths = await ctx.task(identifyAlternativePathsTask, {
    symmetryCatalog,
    breakingSequence,
    breakingAnalysis,
    domain
  });

  // Phase 8: Synthesize Insights
  ctx.log('info', 'Synthesizing symmetry breaking insights');
  const synthesis = await ctx.task(synthesizeSymmetryInsightsTask, {
    system,
    maximalSymmetry,
    symmetryCatalog,
    breakingSequence,
    breakingAnalysis,
    alternativePaths,
    domain
  });

  return {
    success: true,
    processId: 'domains/science/scientific-discovery/symmetry-breaking-search',
    system,
    domain,
    maximalSymmetry,
    symmetryCatalog,
    propertySymmetryRelations,
    symmetryAnalysis: breakingAnalysis,
    breakingSequence,
    alternativePaths,
    insights: synthesis.insights,
    synthesis,
    metadata: {
      symmetriesIdentified: symmetryCatalog.symmetries?.length || 0,
      breakingSteps: breakingSequence.length,
      targetPropertiesAchieved: breakingAnalysis.achievedProperties?.length || 0,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const identifyMaximalSymmetryTask = defineTask('identify-maximal-symmetry', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Maximal Symmetry State',
  agent: {
    name: 'symmetry-theorist',
    prompt: {
      role: 'symmetry and group theory specialist',
      task: 'Identify the maximally symmetric state of the system',
      context: args,
      instructions: [
        'Identify the highest symmetry the system could have',
        'Define the symmetry group of the maximal state',
        'Document all transformations that leave maximal state invariant',
        'Describe the physical/conceptual meaning of maximal symmetry',
        'Identify constraints that might reduce maximal symmetry',
        'Document the mathematical structure of the symmetry',
        'Create representation of maximal symmetric state'
      ],
      outputFormat: 'JSON with maximal state, symmetry group, transformations'
    },
    outputSchema: {
      type: 'object',
      required: ['state', 'symmetryGroup', 'transformations'],
      properties: {
        state: { type: 'object' },
        symmetryGroup: { type: 'object' },
        transformations: { type: 'array', items: { type: 'object' } },
        physicalMeaning: { type: 'string' },
        constraints: { type: 'array', items: { type: 'string' } },
        mathematicalStructure: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'symmetry-breaking', 'maximal-symmetry']
}));

export const catalogSymmetriesTask = defineTask('catalog-symmetries', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Catalog All Symmetries',
  agent: {
    name: 'symmetry-cataloger',
    prompt: {
      role: 'mathematical physicist',
      task: 'Create a complete catalog of symmetries and their relationships',
      context: args,
      instructions: [
        'List all symmetries present in maximal state',
        'Classify symmetries by type (continuous, discrete, etc.)',
        'Map subgroup relationships between symmetries',
        'Identify symmetry generators',
        'Document conserved quantities for each symmetry',
        'Map the lattice of symmetry subgroups',
        'Identify independent vs dependent symmetries'
      ],
      outputFormat: 'JSON with symmetries, classifications, relationships, lattice'
    },
    outputSchema: {
      type: 'object',
      required: ['symmetries', 'subgroupLattice'],
      properties: {
        symmetries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              generator: { type: 'object' },
              conservedQuantity: { type: 'string' }
            }
          }
        },
        classifications: { type: 'object' },
        subgroupLattice: { type: 'object' },
        generators: { type: 'array', items: { type: 'object' } },
        dependencies: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'symmetry-breaking', 'catalog']
}));

export const analyzePropertySymmetryTask = defineTask('analyze-property-symmetry', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Property-Symmetry Relationships',
  agent: {
    name: 'property-analyst',
    prompt: {
      role: 'theoretical physicist',
      task: 'Analyze which symmetries must break for which properties',
      context: args,
      instructions: [
        'Map which symmetries forbid which properties',
        'Identify symmetry-property relations',
        'Determine minimal breaking required for each property',
        'Identify properties that require multiple breakings',
        'Find incompatible property combinations',
        'Map the property-symmetry correspondence',
        'Identify universal vs contingent relations'
      ],
      outputFormat: 'JSON with property-symmetry map, minimal breakings, incompatibilities'
    },
    outputSchema: {
      type: 'object',
      required: ['propertySymmetryMap', 'minimalBreakings'],
      properties: {
        propertySymmetryMap: { type: 'object' },
        forbiddingRelations: { type: 'array', items: { type: 'object' } },
        minimalBreakings: { type: 'array', items: { type: 'object' } },
        multipleBreakingRequired: { type: 'array', items: { type: 'object' } },
        incompatibleProperties: { type: 'array', items: { type: 'object' } },
        universalRelations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'symmetry-breaking', 'property-analysis']
}));

export const designBreakingSequenceTask = defineTask('design-breaking-sequence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Symmetry Breaking Sequence',
  agent: {
    name: 'breaking-designer',
    prompt: {
      role: 'theoretical physicist and designer',
      task: 'Design optimal sequence of symmetry breakings',
      context: args,
      instructions: [
        'Design sequence to achieve target properties',
        'Minimize number of breaking steps',
        'Order breakings for clarity and insight',
        'Consider physical realizability of each breaking',
        'Document the breaking mechanism for each step',
        'Identify what emerges at each breaking',
        'Create clear specification of breaking sequence'
      ],
      outputFormat: 'JSON with breaking sequence, mechanisms, emergent properties'
    },
    outputSchema: {
      type: 'object',
      required: ['sequence'],
      properties: {
        sequence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stepNumber: { type: 'number' },
              symmetryToBreak: { type: 'string' },
              mechanism: { type: 'string' },
              expectedEmergence: { type: 'array', items: { type: 'string' } },
              realizability: { type: 'string' }
            }
          }
        },
        rationale: { type: 'string' },
        minimality: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'symmetry-breaking', 'design']
}));

export const executeBreakingStepTask = defineTask('execute-breaking-step', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute Breaking Step: ${args.step.symmetryToBreak}`,
  agent: {
    name: 'breaking-executor',
    prompt: {
      role: 'theoretical physicist',
      task: 'Execute a symmetry breaking step and analyze results',
      context: args,
      instructions: [
        'Apply the symmetry breaking transformation',
        'Compute the new state after breaking',
        'Identify remaining symmetries',
        'Document emergent properties from this breaking',
        'Analyze the broken symmetry consequences',
        'Identify any unexpected effects',
        'Document the transition details'
      ],
      outputFormat: 'JSON with new state, remaining symmetries, emergent properties'
    },
    outputSchema: {
      type: 'object',
      required: ['newState', 'remainingSymmetries', 'emergentProperties'],
      properties: {
        newState: { type: 'object' },
        remainingSymmetries: { type: 'array', items: { type: 'string' } },
        brokenSymmetry: { type: 'object' },
        emergentProperties: { type: 'array', items: { type: 'string' } },
        consequences: { type: 'array', items: { type: 'string' } },
        unexpectedEffects: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'symmetry-breaking', 'execution']
}));

export const analyzeBreakingResultsTask = defineTask('analyze-breaking-results', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Symmetry Breaking Results',
  agent: {
    name: 'results-analyst',
    prompt: {
      role: 'theoretical analyst',
      task: 'Analyze the complete symmetry breaking sequence results',
      context: args,
      instructions: [
        'Assess which target properties were achieved',
        'Analyze the overall breaking trajectory',
        'Identify emergent structure from breakings',
        'Assess efficiency of the breaking sequence',
        'Document the final symmetry state',
        'Compare to predictions',
        'Identify surprising results'
      ],
      outputFormat: 'JSON with achieved properties, trajectory analysis, surprises'
    },
    outputSchema: {
      type: 'object',
      required: ['achievedProperties', 'trajectoryAnalysis'],
      properties: {
        achievedProperties: { type: 'array', items: { type: 'string' } },
        unachievedProperties: { type: 'array', items: { type: 'string' } },
        trajectoryAnalysis: { type: 'object' },
        emergentStructure: { type: 'object' },
        efficiency: { type: 'string' },
        finalSymmetryState: { type: 'object' },
        surprises: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'symmetry-breaking', 'results-analysis']
}));

export const identifyAlternativePathsTask = defineTask('identify-alternative-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Alternative Breaking Paths',
  agent: {
    name: 'path-explorer',
    prompt: {
      role: 'combinatorial analyst',
      task: 'Identify alternative symmetry breaking paths',
      context: args,
      instructions: [
        'Identify alternative breaking sequences',
        'Compare different paths to same end state',
        'Analyze path-dependent vs path-independent properties',
        'Identify minimal alternative paths',
        'Document trade-offs between paths',
        'Find paths with different intermediate states',
        'Assess physical realizability of alternatives'
      ],
      outputFormat: 'JSON with alternative paths, comparisons, trade-offs'
    },
    outputSchema: {
      type: 'object',
      required: ['alternativePaths'],
      properties: {
        alternativePaths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'array', items: { type: 'string' } },
              intermediateStates: { type: 'array', items: { type: 'object' } },
              finalState: { type: 'object' },
              realizability: { type: 'string' }
            }
          }
        },
        pathComparisons: { type: 'array', items: { type: 'object' } },
        pathDependentProperties: { type: 'array', items: { type: 'string' } },
        pathIndependentProperties: { type: 'array', items: { type: 'string' } },
        tradeOffs: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'symmetry-breaking', 'alternatives']
}));

export const synthesizeSymmetryInsightsTask = defineTask('synthesize-symmetry-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Symmetry Breaking Insights',
  agent: {
    name: 'insight-synthesizer',
    prompt: {
      role: 'theoretical physicist',
      task: 'Synthesize insights from symmetry breaking analysis',
      context: args,
      instructions: [
        'Summarize key findings from symmetry breaking',
        'Extract principles about symmetry-property relations',
        'Document insights about emergence from breaking',
        'Discuss implications for system understanding',
        'Provide recommendations for design',
        'Note universal patterns observed',
        'Create comprehensive synthesis'
      ],
      outputFormat: 'JSON with synthesis, insights, principles, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'insights'],
      properties: {
        synthesis: { type: 'string' },
        insights: { type: 'array', items: { type: 'string' } },
        symmetryPropertyPrinciples: { type: 'array', items: { type: 'string' } },
        emergenceInsights: { type: 'array', items: { type: 'string' } },
        systemUnderstanding: { type: 'string' },
        designRecommendations: { type: 'array', items: { type: 'string' } },
        universalPatterns: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'symmetry-breaking', 'synthesis']
}));
