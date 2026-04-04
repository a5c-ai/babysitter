/**
 * @process domains/science/scientific-discovery/scale-zooming
 * @description Scale Zooming: Move between micro and macro scales; local and global views
 * @inputs {
 *   phenomenon: string,
 *   initialScale: string,
 *   scales: array,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   scaleAnalyses: object,
 *   crossScalePatterns: array,
 *   emergentProperties: array,
 *   synthesizedView: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    phenomenon,
    initialScale = 'meso',
    scales = ['micro', 'meso', 'macro', 'global'],
    domain = 'general science',
    analyzeEmergence = true
  } = inputs;

  const scaleAnalyses = {};
  const crossScalePatterns = [];
  const emergentProperties = [];
  const startTime = ctx.now();

  // Phase 1: Establish Multi-Scale Framework
  ctx.log('info', 'Establishing multi-scale framework');
  const framework = await ctx.task(establishFrameworkTask, {
    phenomenon,
    scales,
    domain
  });

  // Phase 2: Analyze at Each Scale
  ctx.log('info', 'Analyzing phenomenon at each scale');
  for (const scale of scales) {
    const scaleAnalysis = await ctx.task(analyzeAtScaleTask, {
      phenomenon,
      scale,
      framework,
      previousScales: Object.keys(scaleAnalyses),
      domain
    });

    scaleAnalyses[scale] = scaleAnalysis;
  }

  await ctx.breakpoint({
    question: `Analyzed ${scales.length} scales. Review scale analyses before cross-scale analysis?`,
    title: 'Scale Zooming - Scale Analyses Complete',
    context: {
      runId: ctx.runId,
      files: scales.map(scale => ({
        path: `artifacts/scale-${scale}-analysis.json`,
        format: 'json'
      }))
    }
  });

  // Phase 3: Identify Cross-Scale Patterns
  ctx.log('info', 'Identifying cross-scale patterns');
  const crossScaleAnalysis = await ctx.task(identifyCrossScalePatternsTask, {
    phenomenon,
    scaleAnalyses,
    framework,
    domain
  });

  crossScalePatterns.push(...crossScaleAnalysis.patterns);

  // Phase 4: Analyze Emergent Properties
  if (analyzeEmergence) {
    ctx.log('info', 'Analyzing emergent properties across scales');
    const emergenceAnalysis = await ctx.task(analyzeEmergenceTask, {
      phenomenon,
      scaleAnalyses,
      crossScalePatterns,
      domain
    });

    emergentProperties.push(...emergenceAnalysis.emergentProperties);
  }

  // Phase 5: Identify Scale-Dependent vs Scale-Invariant Features
  ctx.log('info', 'Identifying scale-dependent and scale-invariant features');
  const scaleInvarianceAnalysis = await ctx.task(analyzeScaleInvarianceTask, {
    phenomenon,
    scaleAnalyses,
    crossScalePatterns,
    domain
  });

  // Phase 6: Map Upward and Downward Causation
  ctx.log('info', 'Mapping causal relationships across scales');
  const causalMapping = await ctx.task(mapCrossScaleCausationTask, {
    phenomenon,
    scaleAnalyses,
    emergentProperties,
    domain
  });

  // Phase 7: Synthesize Multi-Scale Understanding
  ctx.log('info', 'Synthesizing multi-scale understanding');
  const synthesizedView = await ctx.task(synthesizeMultiScaleViewTask, {
    phenomenon,
    framework,
    scaleAnalyses,
    crossScalePatterns,
    emergentProperties,
    scaleInvarianceAnalysis,
    causalMapping,
    domain
  });

  await ctx.breakpoint({
    question: 'Multi-scale analysis complete. Review synthesized view?',
    title: 'Scale Zooming - Final Results',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/cross-scale-patterns.json', format: 'json' },
        { path: 'artifacts/emergent-properties.json', format: 'json' },
        { path: 'artifacts/synthesized-view.md', format: 'markdown' }
      ]
    }
  });

  return {
    success: true,
    processId: 'domains/science/scientific-discovery/scale-zooming',
    phenomenon,
    domain,
    framework,
    scaleAnalyses,
    crossScalePatterns,
    emergentProperties,
    scaleInvarianceAnalysis,
    causalMapping,
    synthesizedView,
    metadata: {
      scalesAnalyzed: scales,
      scaleCount: scales.length,
      crossScalePatternsFound: crossScalePatterns.length,
      emergentPropertiesFound: emergentProperties.length,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const establishFrameworkTask = defineTask('establish-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish Multi-Scale Framework',
  agent: {
    name: 'scale-framework-architect',
    prompt: {
      role: 'multi-scale systems scientist',
      task: 'Establish a framework for analyzing the phenomenon across scales',
      context: args,
      instructions: [
        'Define the scale hierarchy for this phenomenon',
        'Specify the boundaries between scales',
        'Identify the characteristic lengths/times for each scale',
        'Define the entities and interactions at each scale',
        'Establish the coarse-graining procedures between scales',
        'Identify potential coupling mechanisms between scales',
        'Note any known scale separations or overlaps'
      ],
      outputFormat: 'JSON with scale definitions, boundaries, coupling mechanisms'
    },
    outputSchema: {
      type: 'object',
      required: ['scaleDefinitions', 'boundaries', 'couplingMechanisms'],
      properties: {
        scaleDefinitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scale: { type: 'string' },
              characteristicLength: { type: 'string' },
              characteristicTime: { type: 'string' },
              entities: { type: 'array', items: { type: 'string' } },
              interactions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        boundaries: { type: 'array', items: { type: 'object' } },
        couplingMechanisms: { type: 'array', items: { type: 'object' } },
        coarseGrainingProcedures: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-zooming', 'framework']
}));

export const analyzeAtScaleTask = defineTask('analyze-at-scale', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze at ${args.scale} Scale`,
  agent: {
    name: 'scale-analyst',
    prompt: {
      role: 'scale-specific analyst',
      task: `Analyze the phenomenon at the ${args.scale} scale`,
      context: args,
      instructions: [
        `Focus exclusively on the ${args.scale} scale perspective`,
        'Identify relevant entities and their properties',
        'Describe interactions and dynamics at this scale',
        'Identify key patterns and regularities',
        'Note boundary conditions and constraints',
        'Document what is visible and what is averaged out',
        'Identify scale-specific phenomena'
      ],
      outputFormat: 'JSON with entities, interactions, patterns, constraints, phenomena'
    },
    outputSchema: {
      type: 'object',
      required: ['scale', 'entities', 'interactions', 'patterns'],
      properties: {
        scale: { type: 'string' },
        entities: { type: 'array', items: { type: 'object' } },
        interactions: { type: 'array', items: { type: 'object' } },
        patterns: { type: 'array', items: { type: 'string' } },
        dynamics: { type: 'object' },
        constraints: { type: 'array', items: { type: 'string' } },
        visibleFeatures: { type: 'array', items: { type: 'string' } },
        averagedOutFeatures: { type: 'array', items: { type: 'string' } },
        scaleSpecificPhenomena: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-zooming', 'scale-analysis', args.scale]
}));

export const identifyCrossScalePatternsTask = defineTask('identify-cross-scale-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Cross-Scale Patterns',
  agent: {
    name: 'cross-scale-pattern-finder',
    prompt: {
      role: 'multi-scale pattern analyst',
      task: 'Identify patterns that span multiple scales',
      context: args,
      instructions: [
        'Compare patterns observed at different scales',
        'Identify self-similar structures (fractals, power laws)',
        'Find patterns that repeat across scale levels',
        'Identify scale-bridging mechanisms',
        'Note patterns that transform predictably across scales',
        'Identify hierarchical organizations',
        'Document pattern preservation and breakdown across scales'
      ],
      outputFormat: 'JSON with cross-scale patterns, self-similarities, hierarchies'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              scalesInvolved: { type: 'array', items: { type: 'string' } },
              patternType: { type: 'string' },
              transformation: { type: 'string' }
            }
          }
        },
        selfSimilarities: { type: 'array', items: { type: 'object' } },
        hierarchies: { type: 'array', items: { type: 'object' } },
        scaleBridgingMechanisms: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-zooming', 'cross-scale-patterns']
}));

export const analyzeEmergenceTask = defineTask('analyze-emergence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Emergent Properties',
  agent: {
    name: 'emergence-analyst',
    prompt: {
      role: 'complexity scientist',
      task: 'Analyze emergent properties that arise across scales',
      context: args,
      instructions: [
        'Identify properties that emerge at larger scales',
        'Trace the origins of emergent properties',
        'Distinguish weak vs strong emergence',
        'Identify the conditions for emergence',
        'Document the scale at which each property emerges',
        'Analyze whether emergence is predictable from lower scales',
        'Identify any downward causation from emergent properties'
      ],
      outputFormat: 'JSON with emergent properties, origins, emergence conditions'
    },
    outputSchema: {
      type: 'object',
      required: ['emergentProperties'],
      properties: {
        emergentProperties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              property: { type: 'string' },
              emergenceScale: { type: 'string' },
              originScale: { type: 'string' },
              emergenceType: { type: 'string' },
              conditions: { type: 'array', items: { type: 'string' } },
              predictability: { type: 'string' }
            }
          }
        },
        downwardCausation: { type: 'array', items: { type: 'object' } },
        emergenceConditions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-zooming', 'emergence']
}));

export const analyzeScaleInvarianceTask = defineTask('analyze-scale-invariance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Scale Invariance',
  agent: {
    name: 'scale-invariance-analyst',
    prompt: {
      role: 'theoretical physicist',
      task: 'Identify scale-invariant and scale-dependent features',
      context: args,
      instructions: [
        'Identify features that remain unchanged across scales',
        'Identify features that change with scale',
        'Look for power-law relationships',
        'Identify any scaling exponents',
        'Analyze universality classes if applicable',
        'Document scale-dependent parameters',
        'Identify any characteristic scales or crossovers'
      ],
      outputFormat: 'JSON with invariant features, dependent features, scaling laws'
    },
    outputSchema: {
      type: 'object',
      required: ['scaleInvariantFeatures', 'scaleDependentFeatures'],
      properties: {
        scaleInvariantFeatures: { type: 'array', items: { type: 'object' } },
        scaleDependentFeatures: { type: 'array', items: { type: 'object' } },
        powerLaws: { type: 'array', items: { type: 'object' } },
        scalingExponents: { type: 'array', items: { type: 'object' } },
        characteristicScales: { type: 'array', items: { type: 'object' } },
        crossovers: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-zooming', 'scale-invariance']
}));

export const mapCrossScaleCausationTask = defineTask('map-cross-scale-causation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map Cross-Scale Causation',
  agent: {
    name: 'causal-mapper',
    prompt: {
      role: 'causal inference specialist',
      task: 'Map causal relationships that span scales',
      context: args,
      instructions: [
        'Identify upward causation (micro to macro)',
        'Identify downward causation (macro to micro)',
        'Map constraint propagation across scales',
        'Identify feedback loops spanning scales',
        'Document causal chains across scale hierarchies',
        'Identify any causal bottlenecks',
        'Assess causal completeness at each scale'
      ],
      outputFormat: 'JSON with upward causation, downward causation, feedback loops'
    },
    outputSchema: {
      type: 'object',
      required: ['upwardCausation', 'downwardCausation'],
      properties: {
        upwardCausation: { type: 'array', items: { type: 'object' } },
        downwardCausation: { type: 'array', items: { type: 'object' } },
        constraintPropagation: { type: 'array', items: { type: 'object' } },
        feedbackLoops: { type: 'array', items: { type: 'object' } },
        causalChains: { type: 'array', items: { type: 'object' } },
        causalBottlenecks: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-zooming', 'causation']
}));

export const synthesizeMultiScaleViewTask = defineTask('synthesize-multi-scale-view', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Multi-Scale View',
  agent: {
    name: 'multi-scale-synthesizer',
    prompt: {
      role: 'systems scientist',
      task: 'Synthesize a unified multi-scale understanding',
      context: args,
      instructions: [
        'Integrate insights from all scales into coherent picture',
        'Explain how scales connect and interact',
        'Highlight the most important cross-scale relationships',
        'Identify the optimal scale for different questions',
        'Create a unified model that respects all scale levels',
        'Note any irreducible multi-scale aspects',
        'Provide practical recommendations for multi-scale analysis'
      ],
      outputFormat: 'JSON with synthesis, unified model, scale recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'unifiedModel', 'keyInsights'],
      properties: {
        synthesis: { type: 'string' },
        unifiedModel: { type: 'object' },
        keyInsights: { type: 'array', items: { type: 'string' } },
        scaleConnections: { type: 'array', items: { type: 'object' } },
        optimalScaleMap: { type: 'object' },
        irreducibleAspects: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-zooming', 'synthesis']
}));
