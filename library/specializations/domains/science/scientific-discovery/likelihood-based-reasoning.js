/**
 * @process Likelihood-Based Reasoning
 * @description Compare hypotheses by how well they predict data
 * @category Scientific Discovery - Ampliative Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('likelihood-based-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Likelihood-Based Reasoning Analysis',
  agent: {
    name: 'bayesian-analyst',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Scientific reasoning specialist in likelihood theory and model comparison',
      task: 'Apply likelihood-based reasoning to compare hypotheses by evaluating how well they predict observed data',
      context: args,
      instructions: [
        'Identify competing hypotheses or models to compare',
        'Define the likelihood function for each hypothesis',
        'Calculate the likelihood of observed data under each hypothesis',
        'Compute likelihood ratios for pairwise comparisons',
        'Find maximum likelihood estimates of parameters',
        'Assess goodness of fit using likelihood-based criteria',
        'Apply information criteria (AIC, BIC) for model selection',
        'Consider likelihood profile analysis for uncertainty',
        'Check for model misspecification',
        'Interpret likelihood ratios and their evidential meaning',
        'Document assumptions underlying likelihood calculations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            hypotheses: { type: 'array', items: { type: 'string' } },
            likelihoodFunctions: { type: 'object' },
            observedData: { type: 'object' },
            likelihoods: { type: 'object' },
            likelihoodRatios: { type: 'object' },
            mleEstimates: { type: 'object' },
            informationCriteria: {
              type: 'object',
              properties: {
                AIC: { type: 'object' },
                BIC: { type: 'object' }
              }
            },
            goodnessOfFit: { type: 'object' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesis: { type: 'string' },
              logLikelihood: { type: 'number' },
              likelihoodRatio: { type: 'number' },
              AIC: { type: 'number' },
              ranking: { type: 'number' }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        bestModel: { type: 'string' },
        evidenceStrength: { type: 'string' },
        modelSelectionCriterion: { type: 'string' }
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
    reasoningType: 'Likelihood-Based Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    bestModel: result.bestModel,
    evidenceStrength: result.evidenceStrength,
    modelSelectionCriterion: result.modelSelectionCriterion
  };
}
