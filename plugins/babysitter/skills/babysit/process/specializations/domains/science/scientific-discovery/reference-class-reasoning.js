/**
 * @process Reference Class Reasoning
 * @description Predict using base-rate distributions from similar past projects
 * @category Scientific Discovery - Ampliative Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('reference-class-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reference Class Reasoning Analysis',
  skill: { name: 'bayesian-inference-engine' },
  agent: {
    name: 'reference-class-analyst',
    skills: ['bayesian-inference-engine', 'statistical-test-selector'],
    prompt: {
      role: 'Scientific reasoning specialist in reference class forecasting and base-rate reasoning',
      task: 'Apply reference class reasoning to make predictions using base-rate distributions from similar past cases or projects',
      context: args,
      instructions: [
        'Identify the specific case or project to be predicted',
        'Select appropriate reference classes of similar past cases',
        'Address the reference class problem: choose neither too broad nor too narrow',
        'Gather base-rate statistics from the reference class',
        'Adjust for known differences between the case and reference class',
        'Avoid the planning fallacy by anchoring on outside view',
        'Balance inside view (specific features) with outside view (base rates)',
        'Calculate prediction intervals based on reference class distribution',
        'Consider multiple reference classes and their implications',
        'Document the reference class selection rationale',
        'Assess confidence based on reference class quality and relevance'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            targetCase: { type: 'object' },
            referenceClasses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  className: { type: 'string' },
                  size: { type: 'number' },
                  relevance: { type: 'number' },
                  baseRates: { type: 'object' }
                }
              }
            },
            baseRateStatistics: {
              type: 'object',
              properties: {
                mean: { type: 'number' },
                median: { type: 'number' },
                standardDeviation: { type: 'number' },
                distribution: { type: 'string' }
              }
            },
            adjustments: { type: 'array', items: { type: 'object' } },
            insideViewFactors: { type: 'array', items: { type: 'string' } },
            outsideViewAnchor: { type: 'number' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              prediction: { type: 'string' },
              pointEstimate: { type: 'number' },
              predictionInterval: { type: 'object' },
              confidenceLevel: { type: 'number' },
              referenceClassUsed: { type: 'string' }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        predictionBasis: { type: 'string' },
        planningFallacyAdjustment: { type: 'number' },
        referenceClassQuality: { type: 'string' }
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
    reasoningType: 'Reference Class Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    predictionBasis: result.predictionBasis,
    planningFallacyAdjustment: result.planningFallacyAdjustment,
    referenceClassQuality: result.referenceClassQuality
  };
}
