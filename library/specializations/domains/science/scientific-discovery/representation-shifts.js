/**
 * @process domains/science/scientific-discovery/representation-shifts
 * @description Representation Shifts: Switch between equations, diagrams, simulations, narratives
 * @inputs {
 *   concept: string,
 *   initialRepresentation: object,
 *   targetRepresentations: array,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   representations: object,
 *   insights: array,
 *   synthesizedUnderstanding: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    concept,
    initialRepresentation = null,
    targetRepresentations = ['mathematical', 'diagrammatic', 'simulation', 'narrative'],
    domain = 'general science',
    synthesizeInsights = true
  } = inputs;

  const representations = {};
  const shiftInsights = [];
  const startTime = ctx.now();

  // Phase 1: Establish Base Understanding
  ctx.log('info', 'Establishing base understanding of the concept');
  const baseUnderstanding = await ctx.task(establishBaseTask, {
    concept,
    initialRepresentation,
    domain
  });

  // Phase 2: Generate Each Representation Type
  ctx.log('info', 'Generating multiple representations');

  for (const repType of targetRepresentations) {
    const representation = await ctx.task(generateRepresentationTask, {
      concept,
      baseUnderstanding,
      representationType: repType,
      existingRepresentations: representations,
      domain
    });

    representations[repType] = representation;

    // Phase 3: Analyze Insights from Each Shift
    const insight = await ctx.task(analyzeShiftInsightTask, {
      concept,
      fromRepresentation: Object.keys(representations).length > 1
        ? representations[Object.keys(representations)[Object.keys(representations).length - 2]]
        : baseUnderstanding,
      toRepresentation: representation,
      representationType: repType,
      domain
    });

    shiftInsights.push({
      representationType: repType,
      insight,
      timestamp: ctx.now()
    });
  }

  await ctx.breakpoint({
    question: `Generated ${targetRepresentations.length} representations. Review before synthesis?`,
    title: 'Representation Shifts - Representations Complete',
    context: {
      runId: ctx.runId,
      files: targetRepresentations.map(rep => ({
        path: `artifacts/representation-${rep}.json`,
        format: 'json'
      }))
    }
  });

  // Phase 4: Cross-Representation Analysis
  ctx.log('info', 'Performing cross-representation analysis');
  const crossAnalysis = await ctx.task(crossRepresentationAnalysisTask, {
    concept,
    representations,
    shiftInsights,
    domain
  });

  // Phase 5: Identify Representation-Specific Affordances
  ctx.log('info', 'Identifying affordances of each representation');
  const affordanceAnalysis = await ctx.task(analyzeAffordancesTask, {
    concept,
    representations,
    domain
  });

  // Phase 6: Synthesize Understanding (if requested)
  let synthesizedUnderstanding = null;
  if (synthesizeInsights) {
    ctx.log('info', 'Synthesizing multi-representational understanding');
    synthesizedUnderstanding = await ctx.task(synthesizeUnderstandingTask, {
      concept,
      representations,
      shiftInsights,
      crossAnalysis,
      affordanceAnalysis,
      domain
    });
  }

  return {
    success: true,
    processId: 'domains/science/scientific-discovery/representation-shifts',
    concept,
    domain,
    baseUnderstanding,
    representations,
    shiftInsights,
    crossAnalysis,
    affordanceAnalysis,
    synthesizedUnderstanding,
    metadata: {
      representationCount: targetRepresentations.length,
      representationTypes: targetRepresentations,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const establishBaseTask = defineTask('establish-base', (args, taskCtx) => ({
  kind: 'agent',
  title: `Establish Base Understanding: ${args.concept}`,
  agent: {
    name: 'concept-analyst',
    prompt: {
      role: 'conceptual analyst',
      task: 'Establish a foundational understanding of the concept',
      context: args,
      instructions: [
        'Identify core components and relationships',
        'Define key properties and behaviors',
        'Establish boundary conditions and constraints',
        'Identify underlying principles and laws',
        'Note ambiguities or areas of uncertainty',
        'Document prerequisites and dependencies',
        'Create a comprehensive conceptual map'
      ],
      outputFormat: 'JSON with core components, relationships, properties, principles'
    },
    outputSchema: {
      type: 'object',
      required: ['coreComponents', 'relationships', 'properties'],
      properties: {
        coreComponents: { type: 'array', items: { type: 'object' } },
        relationships: { type: 'array', items: { type: 'object' } },
        properties: { type: 'array', items: { type: 'object' } },
        principles: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } },
        ambiguities: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'representation-shifts', 'base-understanding']
}));

export const generateRepresentationTask = defineTask('generate-representation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate ${args.representationType} Representation`,
  agent: {
    name: 'representation-generator',
    prompt: {
      role: 'multi-modal scientific communicator',
      task: `Generate a ${args.representationType} representation of the concept`,
      context: args,
      instructions: [
        `Create a ${args.representationType} representation`,
        'Capture all essential aspects of the concept',
        'Highlight aspects best revealed by this representation type',
        'Note what aspects are difficult to represent in this form',
        'Ensure internal consistency',
        'Make the representation as complete as possible',
        'Document translation choices and rationale'
      ],
      outputFormat: 'JSON with representation content, highlights, limitations'
    },
    outputSchema: {
      type: 'object',
      required: ['type', 'content', 'highlights'],
      properties: {
        type: { type: 'string' },
        content: { type: 'object' },
        highlights: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        translationChoices: { type: 'array', items: { type: 'object' } },
        notableFeatures: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'representation-shifts', 'generation', args.representationType]
}));

export const analyzeShiftInsightTask = defineTask('analyze-shift-insight', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Shift Insight: ${args.representationType}`,
  agent: {
    name: 'insight-analyst',
    prompt: {
      role: 'cognitive scientist and epistemologist',
      task: 'Analyze insights gained from shifting to this representation',
      context: args,
      instructions: [
        'Identify what becomes visible in the new representation',
        'Note what was hidden in previous representations',
        'Identify new questions raised by this representation',
        'Detect conceptual connections not previously apparent',
        'Assess cognitive affordances of this shift',
        'Document any conceptual reframings',
        'Identify potential misconceptions this representation might cause'
      ],
      outputFormat: 'JSON with insights, revelations, new questions, reframings'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'revelations'],
      properties: {
        insights: { type: 'array', items: { type: 'string' } },
        revelations: { type: 'array', items: { type: 'string' } },
        hiddenAspects: { type: 'array', items: { type: 'string' } },
        newQuestions: { type: 'array', items: { type: 'string' } },
        connections: { type: 'array', items: { type: 'object' } },
        reframings: { type: 'array', items: { type: 'string' } },
        potentialMisconceptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'representation-shifts', 'insight-analysis']
}));

export const crossRepresentationAnalysisTask = defineTask('cross-representation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cross-Representation Analysis',
  agent: {
    name: 'cross-representation-analyst',
    prompt: {
      role: 'multi-modal reasoning specialist',
      task: 'Analyze relationships and tensions between representations',
      context: args,
      instructions: [
        'Compare how each representation captures the concept',
        'Identify consistencies across representations',
        'Identify apparent inconsistencies or tensions',
        'Analyze complementary aspects of different representations',
        'Map which aspects are captured by which representations',
        'Identify the minimal representation set for full coverage',
        'Note synergies between representation types'
      ],
      outputFormat: 'JSON with consistencies, tensions, complementarities, coverage map'
    },
    outputSchema: {
      type: 'object',
      required: ['consistencies', 'tensions', 'complementarities'],
      properties: {
        consistencies: { type: 'array', items: { type: 'object' } },
        tensions: { type: 'array', items: { type: 'object' } },
        complementarities: { type: 'array', items: { type: 'object' } },
        coverageMap: { type: 'object' },
        minimalRepresentationSet: { type: 'array', items: { type: 'string' } },
        synergies: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'representation-shifts', 'cross-analysis']
}));

export const analyzeAffordancesTask = defineTask('analyze-affordances', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Representation Affordances',
  agent: {
    name: 'affordance-analyst',
    prompt: {
      role: 'cognitive scientist',
      task: 'Analyze the cognitive and operational affordances of each representation',
      context: args,
      instructions: [
        'Identify what operations each representation enables',
        'Determine what inferences are easy/hard in each form',
        'Assess communication effectiveness of each representation',
        'Identify target audiences for each representation',
        'Evaluate computational tractability',
        'Assess potential for manipulation and exploration',
        'Recommend optimal use cases for each representation'
      ],
      outputFormat: 'JSON with affordances per representation, use case recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['affordancesByRepresentation'],
      properties: {
        affordancesByRepresentation: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              enabledOperations: { type: 'array', items: { type: 'string' } },
              easyInferences: { type: 'array', items: { type: 'string' } },
              hardInferences: { type: 'array', items: { type: 'string' } },
              targetAudience: { type: 'array', items: { type: 'string' } },
              computationalTractability: { type: 'string' },
              recommendedUseCases: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        overallRecommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'representation-shifts', 'affordance-analysis']
}));

export const synthesizeUnderstandingTask = defineTask('synthesize-understanding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Multi-Representational Understanding',
  agent: {
    name: 'understanding-synthesizer',
    prompt: {
      role: 'integrative scientist',
      task: 'Synthesize insights from all representations into unified understanding',
      context: args,
      instructions: [
        'Integrate insights from all representations',
        'Resolve any tensions or apparent contradictions',
        'Create a meta-representation that captures the synthesis',
        'Document what was learned from representation shifts',
        'Identify the richest understanding gained',
        'Recommend the optimal representation strategy',
        'Generate a comprehensive summary'
      ],
      outputFormat: 'JSON with synthesized understanding, meta-representation, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'metaRepresentation', 'keyLearnings'],
      properties: {
        synthesis: { type: 'string' },
        metaRepresentation: { type: 'object' },
        keyLearnings: { type: 'array', items: { type: 'string' } },
        tensionResolutions: { type: 'array', items: { type: 'object' } },
        optimalStrategy: { type: 'object' },
        comprehensiveSummary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'representation-shifts', 'synthesis']
}));
