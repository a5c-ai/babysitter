/**
 * @process Counterexample-Guided Reasoning
 * @description Iterative loop of abstraction, checking, and refinement
 * @category Scientific Discovery - Formal and Mathematical Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('counterexample-guided-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Counterexample-Guided Reasoning Analysis',
  agent: {
    name: 'assumption-auditor',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Scientific reasoning specialist in counterexample-guided abstraction refinement (CEGAR)',
      task: 'Apply counterexample-guided reasoning through iterative abstraction, checking, and refinement loops',
      context: args,
      instructions: [
        'Define the property to be verified or hypothesis to be tested',
        'Create an initial abstraction of the system or problem',
        'Check if the property holds in the abstract model',
        'If verification succeeds, conclude the property holds',
        'If a counterexample is found, check if it is spurious',
        'Analyze the counterexample to identify abstraction weaknesses',
        'Refine the abstraction to eliminate spurious counterexamples',
        'Iterate until property is proved or real counterexample found',
        'Document the abstraction-refinement history',
        'Track convergence and termination of the CEGAR loop',
        'Identify the minimal abstraction sufficient for verification'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            property: { type: 'string' },
            abstractionLevels: { type: 'array', items: { type: 'object' } },
            cegarIterations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  iteration: { type: 'number' },
                  abstraction: { type: 'string' },
                  checkResult: { type: 'string' },
                  counterexample: { type: 'string' },
                  spurious: { type: 'boolean' },
                  refinement: { type: 'string' }
                }
              }
            },
            finalAbstraction: { type: 'string' },
            convergenceStatus: { type: 'string' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              property: { type: 'string' },
              verified: { type: 'boolean' },
              counterexample: { type: 'string' },
              iterationsRequired: { type: 'number' }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        propertyVerified: { type: 'boolean' },
        realCounterexampleFound: { type: 'boolean' },
        refinementSteps: { type: 'number' }
      },
      required: ['analysis', 'conclusions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

export async function process(inputs, ctx) {
  const result = await ctx.task(analyzeTask, {
    problem: inputs.problem,
    context: inputs.context
  });

  return {
    success: true,
    reasoningType: 'Counterexample-Guided Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    propertyVerified: result.propertyVerified,
    realCounterexampleFound: result.realCounterexampleFound,
    refinementSteps: result.refinementSteps
  };
}
