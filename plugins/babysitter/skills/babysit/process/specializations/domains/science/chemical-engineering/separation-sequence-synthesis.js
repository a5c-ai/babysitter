/**
 * @process chemical-engineering/separation-sequence-synthesis
 * @description Develop optimal separation sequences for multi-component mixtures considering energy, cost, and product purity
 * @inputs { processName: string, mixtureCharacterization: object, productRequirements: object, outputDir: string }
 * @outputs { success: boolean, optimalSequence: object, energyAnalysis: object, economicAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    mixtureCharacterization,
    productRequirements,
    economicData = {},
    outputDir = 'separation-sequence-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Characterize Mixture Components
  ctx.log('info', 'Starting separation sequence synthesis: Characterizing mixture');
  const characterizationResult = await ctx.task(mixtureCharacterizationTask, {
    processName,
    mixtureCharacterization,
    outputDir
  });

  if (!characterizationResult.success) {
    return {
      success: false,
      error: 'Mixture characterization failed',
      details: characterizationResult,
      metadata: { processId: 'chemical-engineering/separation-sequence-synthesis', timestamp: startTime }
    };
  }

  artifacts.push(...characterizationResult.artifacts);

  // Task 2: Identify Potential Separation Methods
  ctx.log('info', 'Identifying potential separation methods');
  const methodsResult = await ctx.task(separationMethodsTask, {
    processName,
    components: characterizationResult.components,
    productRequirements,
    outputDir
  });

  artifacts.push(...methodsResult.artifacts);

  // Task 3: Generate Alternative Sequences
  ctx.log('info', 'Generating alternative separation sequences');
  const sequencesResult = await ctx.task(sequenceGenerationTask, {
    processName,
    components: characterizationResult.components,
    separationMethods: methodsResult.methods,
    productRequirements,
    outputDir
  });

  artifacts.push(...sequencesResult.artifacts);

  // Task 4: Screen Alternatives Using Heuristics
  ctx.log('info', 'Screening alternatives using heuristics');
  const screeningResult = await ctx.task(heuristicScreeningTask, {
    processName,
    alternativeSequences: sequencesResult.sequences,
    components: characterizationResult.components,
    outputDir
  });

  artifacts.push(...screeningResult.artifacts);

  // Task 5: Optimize Promising Sequences
  ctx.log('info', 'Optimizing promising sequences');
  const optimizationResult = await ctx.task(sequenceOptimizationTask, {
    processName,
    shortlistedSequences: screeningResult.shortlistedSequences,
    components: characterizationResult.components,
    productRequirements,
    economicData,
    outputDir
  });

  artifacts.push(...optimizationResult.artifacts);

  // Breakpoint: Review sequence analysis
  await ctx.breakpoint({
    question: `Separation sequence analysis complete for ${processName}. ${sequencesResult.sequences.length} alternatives generated, ${screeningResult.shortlistedSequences.length} shortlisted. Best sequence energy: ${optimizationResult.bestSequence.energy} MW. Review analysis?`,
    title: 'Separation Sequence Synthesis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalAlternatives: sequencesResult.sequences.length,
        shortlisted: screeningResult.shortlistedSequences.length,
        bestSequenceEnergy: optimizationResult.bestSequence.energy,
        bestSequenceCost: optimizationResult.bestSequence.cost
      }
    }
  });

  // Task 6: Consider Heat Integration Opportunities
  ctx.log('info', 'Analyzing heat integration opportunities');
  const heatIntegrationResult = await ctx.task(heatIntegrationOpportunitiesTask, {
    processName,
    optimizedSequence: optimizationResult.bestSequence,
    allSequences: optimizationResult.rankedSequences,
    outputDir
  });

  artifacts.push(...heatIntegrationResult.artifacts);

  // Task 7: Generate Final Recommendation
  ctx.log('info', 'Generating final recommendation');
  const recommendationResult = await ctx.task(finalRecommendationTask, {
    processName,
    optimizedSequence: optimizationResult.bestSequence,
    heatIntegration: heatIntegrationResult,
    economicData,
    outputDir
  });

  artifacts.push(...recommendationResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    optimalSequence: optimizationResult.bestSequence,
    energyAnalysis: {
      totalEnergy: optimizationResult.bestSequence.energy,
      withHeatIntegration: heatIntegrationResult.integratedEnergy,
      savings: heatIntegrationResult.energySavings
    },
    economicAnalysis: {
      capitalCost: optimizationResult.bestSequence.capitalCost,
      operatingCost: optimizationResult.bestSequence.operatingCost,
      totalAnnualCost: optimizationResult.bestSequence.cost
    },
    recommendation: recommendationResult.recommendation,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/separation-sequence-synthesis',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Mixture Characterization
export const mixtureCharacterizationTask = defineTask('mixture-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize mixture components and properties',
  skill: { name: 'separation-sequence-synthesizer' },
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'thermodynamics engineer',
      task: 'Characterize multi-component mixture for separation',
      context: args,
      instructions: [
        'Identify all components in the mixture',
        'Determine component properties (MW, BP, density, etc.)',
        'Calculate relative volatilities',
        'Identify azeotropes and phase behavior',
        'Assess miscibility and solubility',
        'Identify separation-relevant property differences',
        'Characterize feed flow rate and composition',
        'Document mixture characterization'
      ],
      outputFormat: 'JSON with component properties, VLE data, azeotropes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'components', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              boilingPoint: { type: 'number' },
              relativeVolatility: { type: 'number' },
              composition: { type: 'number' }
            }
          }
        },
        azeotropes: { type: 'array' },
        vleData: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'separation-sequence', 'characterization']
}));

// Task 2: Separation Methods Identification
export const separationMethodsTask = defineTask('separation-methods', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify potential separation methods',
  skill: { name: 'separation-sequence-synthesizer' },
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'separation process engineer',
      task: 'Identify feasible separation methods for each split',
      context: args,
      instructions: [
        'Evaluate distillation for all splits',
        'Assess extractive distillation for close boilers',
        'Consider liquid-liquid extraction',
        'Evaluate membrane separation applicability',
        'Consider crystallization for solid products',
        'Assess adsorption/chromatography',
        'Identify special methods for azeotropes',
        'Document feasible methods for each split'
      ],
      outputFormat: 'JSON with separation methods per split, feasibility assessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'methods', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        methods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              split: { type: 'string' },
              feasibleMethods: { type: 'array' },
              preferredMethod: { type: 'string' },
              rationale: { type: 'string' }
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
  labels: ['agent', 'chemical-engineering', 'separation-sequence', 'methods']
}));

// Task 3: Sequence Generation
export const sequenceGenerationTask = defineTask('sequence-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate alternative separation sequences',
  skill: { name: 'separation-sequence-synthesizer' },
  agent: {
    name: 'distillation-specialist',
    prompt: {
      role: 'separation sequence engineer',
      task: 'Generate all feasible separation sequences',
      context: args,
      instructions: [
        'Apply combinatorial rules for sequence generation',
        'Generate direct sequence (lightest first)',
        'Generate indirect sequence (heaviest first)',
        'Generate all intermediate sequences',
        'Consider sloppy splits for energy savings',
        'Include thermal coupling options (Petlyuk)',
        'Include divided wall column options',
        'Document all generated sequences'
      ],
      outputFormat: 'JSON with all sequences, sequence diagrams, number of alternatives, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'sequences', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        sequences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              splits: { type: 'array' },
              columns: { type: 'number' }
            }
          }
        },
        totalAlternatives: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'separation-sequence', 'generation']
}));

// Task 4: Heuristic Screening
export const heuristicScreeningTask = defineTask('heuristic-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Screen alternatives using heuristics',
  skill: { name: 'separation-sequence-synthesizer' },
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'separation heuristics analyst',
      task: 'Screen sequences using established heuristics',
      context: args,
      instructions: [
        'Apply "remove corrosive/reactive first" heuristic',
        'Apply "easiest separation first" heuristic',
        'Apply "remove largest component first" heuristic',
        'Apply "favor equimolar splits" heuristic',
        'Apply "50/50 splits" heuristic',
        'Rank sequences by heuristic score',
        'Shortlist promising sequences',
        'Document screening rationale'
      ],
      outputFormat: 'JSON with heuristic scores, rankings, shortlisted sequences, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'shortlistedSequences', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        heuristicScores: { type: 'object' },
        rankings: { type: 'array' },
        shortlistedSequences: { type: 'array' },
        screeningRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'separation-sequence', 'heuristics']
}));

// Task 5: Sequence Optimization
export const sequenceOptimizationTask = defineTask('sequence-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize promising sequences',
  skill: { name: 'distillation-designer' },
  agent: {
    name: 'distillation-specialist',
    prompt: {
      role: 'separation optimization engineer',
      task: 'Rigorously optimize shortlisted sequences',
      context: args,
      instructions: [
        'Simulate each shortlisted sequence',
        'Optimize each column design',
        'Calculate energy consumption',
        'Estimate capital costs',
        'Calculate operating costs',
        'Compute total annualized cost',
        'Rank sequences by total cost',
        'Identify best sequence'
      ],
      outputFormat: 'JSON with optimized sequences, costs, energy, best sequence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'bestSequence', 'rankedSequences', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        bestSequence: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            description: { type: 'string' },
            energy: { type: 'number' },
            capitalCost: { type: 'number' },
            operatingCost: { type: 'number' },
            cost: { type: 'number' }
          }
        },
        rankedSequences: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'separation-sequence', 'optimization']
}));

// Task 6: Heat Integration Opportunities
export const heatIntegrationOpportunitiesTask = defineTask('heat-integration-opportunities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze heat integration opportunities',
  skill: { name: 'distillation-designer' },
  agent: {
    name: 'distillation-specialist',
    prompt: {
      role: 'heat integration engineer',
      task: 'Identify heat integration opportunities in separation sequence',
      context: args,
      instructions: [
        'Identify hot and cold streams in sequence',
        'Apply pinch analysis principles',
        'Evaluate column pressure optimization for integration',
        'Assess multi-effect configurations',
        'Evaluate vapor recompression options',
        'Calculate integrated energy consumption',
        'Estimate additional capital for integration',
        'Document integration opportunities'
      ],
      outputFormat: 'JSON with heat integration analysis, energy savings, capital impact, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'integratedEnergy', 'energySavings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        opportunities: { type: 'array' },
        integratedEnergy: { type: 'number' },
        energySavings: { type: 'number' },
        additionalCapital: { type: 'number' },
        recommendedIntegration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'separation-sequence', 'heat-integration']
}));

// Task 7: Final Recommendation
export const finalRecommendationTask = defineTask('final-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate final sequence recommendation',
  skill: { name: 'separation-sequence-synthesizer' },
  agent: {
    name: 'separation-process-engineer',
    prompt: {
      role: 'separation systems engineer',
      task: 'Generate final recommendation for separation sequence',
      context: args,
      instructions: [
        'Summarize analysis findings',
        'Present recommended sequence',
        'Document energy and cost comparison',
        'Include heat integration recommendations',
        'Highlight key design decisions',
        'Note flexibility and operability considerations',
        'Identify implementation risks',
        'Create final recommendation report'
      ],
      outputFormat: 'JSON with recommendation, comparison summary, implementation notes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'recommendation', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        recommendation: {
          type: 'object',
          properties: {
            sequence: { type: 'object' },
            rationale: { type: 'string' },
            energyConsumption: { type: 'number' },
            totalCost: { type: 'number' },
            implementationNotes: { type: 'array' }
          }
        },
        comparison: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'chemical-engineering', 'separation-sequence', 'recommendation']
}));
