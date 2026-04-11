/**
 * @process domains/science/scientific-discovery/metaphoric-world-simulation
 * @description Metaphoric World Simulation: Build full "toy universe" from a metaphor, simulate it
 * @inputs {
 *   targetPhenomenon: string,
 *   metaphor: string,
 *   simulationDepth: string,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   toyUniverse: object,
 *   simulationResults: object,
 *   insights: array,
 *   mappingAnalysis: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    targetPhenomenon,
    metaphor,
    simulationDepth = 'medium',
    domain = 'general science',
    iterations = 3
  } = inputs;

  const startTime = ctx.now();
  const simulationHistory = [];

  // Phase 1: Analyze and Elaborate the Metaphor
  ctx.log('info', 'Analyzing and elaborating the metaphor');
  const metaphorAnalysis = await ctx.task(analyzeMetaphorTask, {
    targetPhenomenon,
    metaphor,
    domain
  });

  // Phase 2: Construct the Toy Universe
  ctx.log('info', 'Constructing toy universe from metaphor');
  const toyUniverse = await ctx.task(constructToyUniverseTask, {
    targetPhenomenon,
    metaphor,
    metaphorAnalysis,
    simulationDepth,
    domain
  });

  await ctx.breakpoint({
    question: 'Toy universe constructed. Review before simulation?',
    title: 'Metaphoric World - Universe Construction Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/metaphor-analysis.json', format: 'json' },
        { path: 'artifacts/toy-universe.json', format: 'json' }
      ]
    }
  });

  // Phase 3: Run Simulations
  ctx.log('info', 'Running simulations in toy universe');
  for (let i = 0; i < iterations; i++) {
    const simulation = await ctx.task(runSimulationTask, {
      toyUniverse,
      iteration: i + 1,
      previousResults: simulationHistory,
      targetPhenomenon,
      domain
    });

    simulationHistory.push({
      iteration: i + 1,
      results: simulation,
      timestamp: ctx.now()
    });
  }

  // Phase 4: Analyze Emergent Behaviors
  ctx.log('info', 'Analyzing emergent behaviors from simulations');
  const emergentBehaviors = await ctx.task(analyzeEmergentBehaviorsTask, {
    toyUniverse,
    simulationHistory,
    targetPhenomenon,
    domain
  });

  // Phase 5: Map Back to Target Phenomenon
  ctx.log('info', 'Mapping simulation insights back to target phenomenon');
  const mappingAnalysis = await ctx.task(mapBackToTargetTask, {
    targetPhenomenon,
    metaphor,
    toyUniverse,
    simulationHistory,
    emergentBehaviors,
    domain
  });

  // Phase 6: Validate Mapping Integrity
  ctx.log('info', 'Validating mapping integrity');
  const validationResults = await ctx.task(validateMappingTask, {
    targetPhenomenon,
    mappingAnalysis,
    metaphorAnalysis,
    domain
  });

  // Phase 7: Extract Insights and Hypotheses
  ctx.log('info', 'Extracting insights and generating hypotheses');
  const insightsAndHypotheses = await ctx.task(extractInsightsTask, {
    targetPhenomenon,
    metaphor,
    toyUniverse,
    simulationHistory,
    emergentBehaviors,
    mappingAnalysis,
    validationResults,
    domain
  });

  return {
    success: true,
    processId: 'domains/science/scientific-discovery/metaphoric-world-simulation',
    targetPhenomenon,
    metaphor,
    metaphorAnalysis,
    toyUniverse,
    simulationResults: simulationHistory,
    emergentBehaviors,
    mappingAnalysis,
    validationResults,
    insights: insightsAndHypotheses.insights,
    hypotheses: insightsAndHypotheses.hypotheses,
    metadata: {
      simulationIterations: iterations,
      simulationDepth,
      mappingValidity: validationResults.overallValidity,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const analyzeMetaphorTask = defineTask('analyze-metaphor', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Metaphor Structure',
  agent: {
    name: 'metaphor-analyst',
    prompt: {
      role: 'cognitive linguist and conceptual analyst',
      task: 'Analyze the metaphor and identify mappable structures',
      context: args,
      instructions: [
        'Decompose the metaphor into its structural elements',
        'Identify the source domain entities and relationships',
        'Map structural correspondences to target phenomenon',
        'Identify what the metaphor highlights and hides',
        'Find the generative potential of the metaphor',
        'Identify entailments and inferences the metaphor suggests',
        'Note limitations and potential misleading aspects'
      ],
      outputFormat: 'JSON with metaphor structure, mappings, entailments, limitations'
    },
    outputSchema: {
      type: 'object',
      required: ['sourceDomain', 'structuralElements', 'mappings'],
      properties: {
        sourceDomain: { type: 'object' },
        structuralElements: { type: 'array', items: { type: 'object' } },
        mappings: { type: 'array', items: { type: 'object' } },
        highlights: { type: 'array', items: { type: 'string' } },
        hides: { type: 'array', items: { type: 'string' } },
        entailments: { type: 'array', items: { type: 'string' } },
        generativePotential: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metaphoric-world', 'metaphor-analysis']
}));

export const constructToyUniverseTask = defineTask('construct-toy-universe', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct Toy Universe',
  agent: {
    name: 'universe-constructor',
    prompt: {
      role: 'theoretical modeler and world-builder',
      task: 'Construct a complete toy universe based on the metaphor',
      context: args,
      instructions: [
        'Define the fundamental entities of the toy universe',
        'Specify the laws and rules governing the universe',
        'Define initial conditions and boundary conditions',
        'Create the dynamics and interaction rules',
        'Ensure internal consistency',
        'Include mechanisms for emergent behavior',
        'Make the universe simulatable'
      ],
      outputFormat: 'JSON with entities, laws, initial conditions, dynamics, parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['entities', 'laws', 'dynamics'],
      properties: {
        entities: { type: 'array', items: { type: 'object' } },
        laws: { type: 'array', items: { type: 'object' } },
        initialConditions: { type: 'object' },
        boundaryConditions: { type: 'object' },
        dynamics: { type: 'object' },
        interactionRules: { type: 'array', items: { type: 'object' } },
        parameters: { type: 'object' },
        emergenceMechanisms: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metaphoric-world', 'construction']
}));

export const runSimulationTask = defineTask('run-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run Simulation: Iteration ${args.iteration}`,
  agent: {
    name: 'universe-simulator',
    prompt: {
      role: 'computational scientist',
      task: 'Simulate the evolution of the toy universe',
      context: args,
      instructions: [
        'Apply the laws and dynamics to evolve the universe',
        'Track the behavior of all entities',
        'Record significant events and state changes',
        'Monitor for emergent patterns',
        'Document any unexpected behaviors',
        'Measure key observables over time',
        'Note system stability and equilibria'
      ],
      outputFormat: 'JSON with simulation timeline, events, observables, patterns'
    },
    outputSchema: {
      type: 'object',
      required: ['timeline', 'events', 'finalState'],
      properties: {
        timeline: { type: 'array', items: { type: 'object' } },
        events: { type: 'array', items: { type: 'object' } },
        observables: { type: 'object' },
        emergentPatterns: { type: 'array', items: { type: 'string' } },
        unexpectedBehaviors: { type: 'array', items: { type: 'string' } },
        equilibria: { type: 'array', items: { type: 'object' } },
        finalState: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metaphoric-world', 'simulation']
}));

export const analyzeEmergentBehaviorsTask = defineTask('analyze-emergent-behaviors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Emergent Behaviors',
  agent: {
    name: 'emergence-analyst',
    prompt: {
      role: 'complexity scientist',
      task: 'Analyze emergent behaviors observed in simulations',
      context: args,
      instructions: [
        'Identify all emergent behaviors across simulations',
        'Classify emergence types (weak, strong, computational)',
        'Trace the origins of each emergent behavior',
        'Identify critical parameters for emergence',
        'Analyze robustness of emergent patterns',
        'Look for phase transitions and bifurcations',
        'Document unexpected emergent properties'
      ],
      outputFormat: 'JSON with emergent behaviors, classifications, origins, parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['emergentBehaviors'],
      properties: {
        emergentBehaviors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              behavior: { type: 'string' },
              type: { type: 'string' },
              origin: { type: 'string' },
              criticalParameters: { type: 'array', items: { type: 'string' } },
              robustness: { type: 'string' }
            }
          }
        },
        phaseTransitions: { type: 'array', items: { type: 'object' } },
        bifurcations: { type: 'array', items: { type: 'object' } },
        unexpectedProperties: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metaphoric-world', 'emergence']
}));

export const mapBackToTargetTask = defineTask('map-back-to-target', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map Insights to Target Phenomenon',
  agent: {
    name: 'mapping-specialist',
    prompt: {
      role: 'analogical reasoner',
      task: 'Map simulation insights back to the target phenomenon',
      context: args,
      instructions: [
        'Map each emergent behavior to potential target phenomenon behavior',
        'Translate simulation parameters to real-world parameters',
        'Identify predictions for the target phenomenon',
        'Note where the mapping breaks down',
        'Identify testable hypotheses',
        'Assess the fidelity of the mapping',
        'Document novel insights about the target'
      ],
      outputFormat: 'JSON with mappings, predictions, hypotheses, limitations'
    },
    outputSchema: {
      type: 'object',
      required: ['behaviorMappings', 'predictions', 'hypotheses'],
      properties: {
        behaviorMappings: { type: 'array', items: { type: 'object' } },
        parameterMappings: { type: 'array', items: { type: 'object' } },
        predictions: { type: 'array', items: { type: 'object' } },
        hypotheses: { type: 'array', items: { type: 'object' } },
        mappingBreakdowns: { type: 'array', items: { type: 'string' } },
        novelInsights: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metaphoric-world', 'mapping']
}));

export const validateMappingTask = defineTask('validate-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Mapping Integrity',
  agent: {
    name: 'mapping-validator',
    prompt: {
      role: 'critical analyst',
      task: 'Validate the integrity of the metaphor-to-reality mapping',
      context: args,
      instructions: [
        'Check structural preservation in mappings',
        'Identify false analogies and overgeneralizations',
        'Assess predictive validity where possible',
        'Test for counterexamples to the mapping',
        'Evaluate the scope of valid application',
        'Identify conditions where mapping fails',
        'Rate overall mapping validity'
      ],
      outputFormat: 'JSON with validation results, validity score, warnings'
    },
    outputSchema: {
      type: 'object',
      required: ['validationResults', 'overallValidity'],
      properties: {
        validationResults: { type: 'array', items: { type: 'object' } },
        overallValidity: { type: 'number', minimum: 0, maximum: 100 },
        falseAnalogies: { type: 'array', items: { type: 'string' } },
        overgeneralizations: { type: 'array', items: { type: 'string' } },
        counterexamples: { type: 'array', items: { type: 'string' } },
        validScope: { type: 'string' },
        failureConditions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metaphoric-world', 'validation']
}));

export const extractInsightsTask = defineTask('extract-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract Insights and Hypotheses',
  agent: {
    name: 'insight-extractor',
    prompt: {
      role: 'scientific theorist',
      task: 'Extract valuable insights and formulate testable hypotheses',
      context: args,
      instructions: [
        'Synthesize key insights from the entire process',
        'Formulate specific, testable hypotheses',
        'Rank insights by novelty and importance',
        'Identify new research questions raised',
        'Suggest experimental tests for hypotheses',
        'Document limitations and caveats',
        'Recommend next steps for investigation'
      ],
      outputFormat: 'JSON with insights, hypotheses, research questions, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'hypotheses'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              novelty: { type: 'string' },
              importance: { type: 'string' },
              confidence: { type: 'number' }
            }
          }
        },
        hypotheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesis: { type: 'string' },
              testability: { type: 'string' },
              suggestedTest: { type: 'string' }
            }
          }
        },
        researchQuestions: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'metaphoric-world', 'insights']
}));
