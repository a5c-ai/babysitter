/**
 * @process Fermi Order-of-Magnitude Reasoning
 * @description Rough quantitative estimates via decomposition
 * @category Scientific Discovery - Ampliative Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('fermi-order-magnitude-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fermi Order-of-Magnitude Reasoning Analysis',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'estimation-specialist',
    skills: ['bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Scientific reasoning specialist in Fermi estimation and order-of-magnitude reasoning',
      task: 'Apply Fermi order-of-magnitude reasoning to produce rough quantitative estimates by decomposing problems into estimable components',
      context: args,
      instructions: [
        'Identify the quantity to be estimated',
        'Decompose the problem into simpler, estimable factors',
        'Identify known quantities and reasonable assumptions',
        'Make educated guesses for unknown factors using anchoring',
        'Multiply factors together for the final estimate',
        'Express results as powers of 10 (order of magnitude)',
        'Assess uncertainty range (typically 1-2 orders of magnitude)',
        'Cross-check using alternative decomposition approaches',
        'Identify the most uncertain factors driving overall uncertainty',
        'Refine estimates by gathering more information on key factors',
        'Document assumptions and reasoning for each factor'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            targetQuantity: { type: 'string' },
            decomposition: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  factor: { type: 'string' },
                  estimate: { type: 'number' },
                  unit: { type: 'string' },
                  uncertainty: { type: 'string' },
                  reasoning: { type: 'string' }
                }
              }
            },
            knownQuantities: { type: 'object' },
            assumptions: { type: 'array', items: { type: 'string' } },
            alternativeApproaches: { type: 'array', items: { type: 'object' } },
            sensitivityAnalysis: { type: 'object' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quantity: { type: 'string' },
              pointEstimate: { type: 'number' },
              orderOfMagnitude: { type: 'number' },
              lowerBound: { type: 'number' },
              upperBound: { type: 'number' },
              unit: { type: 'string' }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        estimateQuality: { type: 'string' },
        keyUncertainties: { type: 'array', items: { type: 'string' } },
        recommendedRefinements: { type: 'array', items: { type: 'string' } }
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
    reasoningType: 'Fermi Order-of-Magnitude Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    estimateQuality: result.estimateQuality,
    keyUncertainties: result.keyUncertainties,
    recommendedRefinements: result.recommendedRefinements
  };
}
