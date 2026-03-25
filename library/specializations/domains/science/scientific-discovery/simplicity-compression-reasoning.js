/**
 * @process Simplicity Compression Reasoning
 * @description Prefer simpler hypotheses balancing fit against complexity
 * @category Scientific Discovery - Ampliative Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('simplicity-compression-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Simplicity Compression Reasoning Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'complexity-analyst',
    skills: ['hypothesis-generator', 'bayesian-inference-engine'],
    prompt: {
      role: 'Scientific reasoning specialist in Occams razor, minimum description length, and complexity theory',
      task: 'Apply simplicity and compression-based reasoning to prefer simpler hypotheses while balancing goodness of fit against model complexity',
      context: args,
      instructions: [
        'Identify candidate hypotheses or models of varying complexity',
        'Measure the complexity of each hypothesis (parameters, description length)',
        'Assess the goodness of fit for each hypothesis',
        'Apply Occams razor: prefer simpler explanations, all else equal',
        'Calculate minimum description length (MDL) where applicable',
        'Consider Kolmogorov complexity as a theoretical benchmark',
        'Balance model complexity against predictive accuracy',
        'Apply regularization principles to avoid overfitting',
        'Identify the simplest hypothesis adequate for the data',
        'Document trade-offs between simplicity and explanatory power',
        'Assess robustness of simpler models to new data'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            hypotheses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  hypothesis: { type: 'string' },
                  complexity: { type: 'number' },
                  fit: { type: 'number' },
                  descriptionLength: { type: 'number' }
                }
              }
            },
            complexityMetrics: { type: 'object' },
            mdlScores: { type: 'object' },
            simplicityRanking: { type: 'array', items: { type: 'string' } },
            overfittingRisk: { type: 'object' },
            tradeoffAnalysis: { type: 'string' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesis: { type: 'string' },
              simplicityScore: { type: 'number' },
              fitScore: { type: 'number' },
              overallScore: { type: 'number' },
              recommendation: { type: 'string' }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        simplestAdequateHypothesis: { type: 'string' },
        complexityReduction: { type: 'number' },
        generalizationExpected: { type: 'string' }
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
    reasoningType: 'Simplicity Compression Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    simplestAdequateHypothesis: result.simplestAdequateHypothesis,
    complexityReduction: result.complexityReduction,
    generalizationExpected: result.generalizationExpected
  };
}
