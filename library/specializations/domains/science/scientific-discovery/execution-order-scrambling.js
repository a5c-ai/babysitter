/**
 * @process domains/science/scientific-discovery/execution-order-scrambling
 * @description Execution Order Scrambling: Explore alternative valid orderings of process steps
 * @inputs {
 *   process: string,
 *   steps: array,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   alternativeOrderings: array,
 *   orderingConstraints: object,
 *   insights: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processDescription,
    steps = [],
    domain = 'general science',
    maxOrderings = 10
  } = inputs;

  const startTime = ctx.now();
  const alternativeOrderings = [];

  // Phase 1: Analyze Process Steps and Dependencies
  ctx.log('info', 'Analyzing process steps and dependencies');
  const stepAnalysis = await ctx.task(analyzeStepsTask, {
    processDescription,
    steps,
    domain
  });

  // Phase 2: Extract Ordering Constraints
  ctx.log('info', 'Extracting ordering constraints');
  const constraints = await ctx.task(extractConstraintsTask, {
    stepAnalysis,
    domain
  });

  // Phase 3: Generate Alternative Orderings
  ctx.log('info', 'Generating alternative valid orderings');
  const generatedOrderings = await ctx.task(generateOrderingsTask, {
    stepAnalysis,
    constraints,
    maxOrderings,
    domain
  });

  // Phase 4: Evaluate Each Ordering
  ctx.log('info', 'Evaluating alternative orderings');
  for (const ordering of generatedOrderings.orderings) {
    const evaluation = await ctx.task(evaluateOrderingTask, {
      processDescription,
      ordering,
      stepAnalysis,
      constraints,
      domain
    });

    alternativeOrderings.push({
      ordering,
      evaluation,
      timestamp: ctx.now()
    });
  }

  await ctx.breakpoint({
    question: `Generated and evaluated ${alternativeOrderings.length} orderings. Review findings?`,
    title: 'Execution Order Scrambling - Orderings Evaluated',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/alternative-orderings.json', format: 'json' },
        { path: 'artifacts/constraints.json', format: 'json' }
      ]
    }
  });

  // Phase 5: Identify Order-Sensitive vs Order-Invariant Aspects
  ctx.log('info', 'Identifying order sensitivity');
  const orderSensitivity = await ctx.task(analyzeOrderSensitivityTask, {
    alternativeOrderings,
    stepAnalysis,
    domain
  });

  // Phase 6: Discover Hidden Dependencies
  ctx.log('info', 'Discovering hidden dependencies');
  const hiddenDependencies = await ctx.task(discoverHiddenDependenciesTask, {
    alternativeOrderings,
    constraints,
    orderSensitivity,
    domain
  });

  // Phase 7: Synthesize Insights
  ctx.log('info', 'Synthesizing ordering insights');
  const synthesis = await ctx.task(synthesizeOrderingInsightsTask, {
    processDescription,
    alternativeOrderings,
    constraints,
    orderSensitivity,
    hiddenDependencies,
    domain
  });

  return {
    success: true,
    processId: 'domains/science/scientific-discovery/execution-order-scrambling',
    processDescription,
    domain,
    stepAnalysis,
    orderingConstraints: constraints,
    alternativeOrderings,
    orderSensitivity,
    hiddenDependencies,
    insights: synthesis.insights,
    synthesis,
    metadata: {
      totalSteps: steps.length,
      orderingsGenerated: alternativeOrderings.length,
      constraintsIdentified: constraints.constraints?.length || 0,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const analyzeStepsTask = defineTask('analyze-steps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Process Steps',
  agent: {
    name: 'step-analyst',
    prompt: {
      role: 'process analyst',
      task: 'Analyze the process steps and their characteristics',
      context: args,
      instructions: [
        'Document each step and its function',
        'Identify inputs and outputs of each step',
        'Determine resource requirements',
        'Identify side effects of each step',
        'Document preconditions and postconditions',
        'Identify which steps are atomic vs composite',
        'Map the information flow between steps'
      ],
      outputFormat: 'JSON with step details, inputs/outputs, preconditions/postconditions'
    },
    outputSchema: {
      type: 'object',
      required: ['steps', 'informationFlow'],
      properties: {
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              function: { type: 'string' },
              inputs: { type: 'array', items: { type: 'string' } },
              outputs: { type: 'array', items: { type: 'string' } },
              preconditions: { type: 'array', items: { type: 'string' } },
              postconditions: { type: 'array', items: { type: 'string' } },
              sideEffects: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        informationFlow: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'order-scrambling', 'step-analysis']
}));

export const extractConstraintsTask = defineTask('extract-constraints', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract Ordering Constraints',
  agent: {
    name: 'constraint-extractor',
    prompt: {
      role: 'constraint analyst',
      task: 'Extract all ordering constraints from the process',
      context: args,
      instructions: [
        'Identify hard constraints (must be satisfied)',
        'Identify soft constraints (preferences)',
        'Document causal dependencies',
        'Identify resource-based constraints',
        'Document temporal constraints',
        'Identify constraint sources and rationale',
        'Distinguish necessary from conventional constraints'
      ],
      outputFormat: 'JSON with constraints, types, sources, rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['constraints'],
      properties: {
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              hardness: { type: 'string' },
              before: { type: 'string' },
              after: { type: 'string' },
              rationale: { type: 'string' },
              source: { type: 'string' }
            }
          }
        },
        hardConstraints: { type: 'array', items: { type: 'string' } },
        softConstraints: { type: 'array', items: { type: 'string' } },
        conventionalVsNecessary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'order-scrambling', 'constraints']
}));

export const generateOrderingsTask = defineTask('generate-orderings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Alternative Orderings',
  agent: {
    name: 'ordering-generator',
    prompt: {
      role: 'combinatorial analyst',
      task: 'Generate alternative valid orderings of process steps',
      context: args,
      instructions: [
        'Generate orderings that satisfy hard constraints',
        'Explore orderings that violate soft constraints',
        'Include radical reorderings',
        'Generate parallel execution variants',
        'Include reversed orderings where possible',
        'Ensure diversity in generated orderings',
        'Rate each ordering by deviation from original'
      ],
      outputFormat: 'JSON with orderings, validity, deviation scores'
    },
    outputSchema: {
      type: 'object',
      required: ['orderings'],
      properties: {
        orderings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              sequence: { type: 'array', items: { type: 'string' } },
              parallelGroups: { type: 'array', items: { type: 'array' } },
              satisfiesHardConstraints: { type: 'boolean' },
              violatedSoftConstraints: { type: 'array', items: { type: 'string' } },
              deviationScore: { type: 'number' }
            }
          }
        },
        generationStrategy: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'order-scrambling', 'generation']
}));

export const evaluateOrderingTask = defineTask('evaluate-ordering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate Ordering: ${args.ordering.id}`,
  agent: {
    name: 'ordering-evaluator',
    prompt: {
      role: 'process evaluator',
      task: 'Evaluate the implications of an alternative ordering',
      context: args,
      instructions: [
        'Assess feasibility of the ordering',
        'Predict outcomes compared to original',
        'Identify advantages of this ordering',
        'Identify disadvantages and risks',
        'Estimate efficiency changes',
        'Note any emergent effects',
        'Rate overall viability'
      ],
      outputFormat: 'JSON with feasibility, outcomes, advantages, disadvantages, viability'
    },
    outputSchema: {
      type: 'object',
      required: ['feasibility', 'viability'],
      properties: {
        feasibility: { type: 'number', minimum: 0, maximum: 100 },
        predictedOutcomes: { type: 'array', items: { type: 'string' } },
        advantages: { type: 'array', items: { type: 'string' } },
        disadvantages: { type: 'array', items: { type: 'string' } },
        efficiencyChange: { type: 'string' },
        emergentEffects: { type: 'array', items: { type: 'string' } },
        viability: { type: 'number', minimum: 0, maximum: 100 }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'order-scrambling', 'evaluation']
}));

export const analyzeOrderSensitivityTask = defineTask('analyze-order-sensitivity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Order Sensitivity',
  agent: {
    name: 'sensitivity-analyst',
    prompt: {
      role: 'sensitivity analyst',
      task: 'Identify order-sensitive vs order-invariant aspects',
      context: args,
      instructions: [
        'Identify which outcomes depend on ordering',
        'Identify which outcomes are order-invariant',
        'Find steps that can be freely reordered',
        'Find steps with strict ordering requirements',
        'Document sensitivity gradients',
        'Identify critical ordering decisions',
        'Map the sensitivity landscape'
      ],
      outputFormat: 'JSON with sensitive aspects, invariant aspects, critical decisions'
    },
    outputSchema: {
      type: 'object',
      required: ['orderSensitiveAspects', 'orderInvariantAspects'],
      properties: {
        orderSensitiveAspects: { type: 'array', items: { type: 'object' } },
        orderInvariantAspects: { type: 'array', items: { type: 'string' } },
        freelyReorderableSteps: { type: 'array', items: { type: 'string' } },
        strictlyOrderedSteps: { type: 'array', items: { type: 'string' } },
        sensitivityGradients: { type: 'array', items: { type: 'object' } },
        criticalOrderingDecisions: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'order-scrambling', 'sensitivity']
}));

export const discoverHiddenDependenciesTask = defineTask('discover-hidden-dependencies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover Hidden Dependencies',
  agent: {
    name: 'dependency-discoverer',
    prompt: {
      role: 'dependency analyst',
      task: 'Discover hidden dependencies revealed by order scrambling',
      context: args,
      instructions: [
        'Identify dependencies not explicit in original process',
        'Find implicit assumptions about ordering',
        'Discover side-effect based dependencies',
        'Identify timing-sensitive dependencies',
        'Document dependencies revealed by failures',
        'Classify discovered dependencies',
        'Assess impact of hidden dependencies'
      ],
      outputFormat: 'JSON with hidden dependencies, classifications, impacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hiddenDependencies'],
      properties: {
        hiddenDependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dependency: { type: 'string' },
              type: { type: 'string' },
              discoveryMethod: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        implicitAssumptions: { type: 'array', items: { type: 'string' } },
        sideEffectDependencies: { type: 'array', items: { type: 'object' } },
        timingSensitivities: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'order-scrambling', 'dependencies']
}));

export const synthesizeOrderingInsightsTask = defineTask('synthesize-ordering-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Ordering Insights',
  agent: {
    name: 'insight-synthesizer',
    prompt: {
      role: 'process theorist',
      task: 'Synthesize insights from execution order scrambling',
      context: args,
      instructions: [
        'Integrate findings into coherent insights',
        'Document what was learned about process structure',
        'Identify optimal orderings discovered',
        'Document flexibility in process design',
        'Provide recommendations for process improvement',
        'Note open questions about ordering',
        'Create comprehensive synthesis'
      ],
      outputFormat: 'JSON with synthesis, insights, optimal orderings, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'insights'],
      properties: {
        synthesis: { type: 'string' },
        insights: { type: 'array', items: { type: 'string' } },
        processStructureLearnings: { type: 'array', items: { type: 'string' } },
        optimalOrderings: { type: 'array', items: { type: 'object' } },
        processFlexibility: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        openQuestions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'order-scrambling', 'synthesis']
}));
