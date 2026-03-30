/**
 * @process Bayesian Probabilistic Reasoning
 * @description Represent beliefs as probabilities and update via Bayes' rule
 * @category Scientific Discovery - Ampliative Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('bayesian-probabilistic-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Bayesian Probabilistic Reasoning Analysis',
  agent: {
    name: 'bayesian-analyst',
    skills: ['bayesian-inference-engine', 'statistical-test-selector', 'scientific-figure-generator'],
    prompt: {
      role: 'Scientific reasoning specialist in Bayesian inference and probabilistic reasoning',
      task: 'Apply Bayesian probabilistic reasoning to represent beliefs as probabilities and update them via Bayes rule',
      context: args,
      instructions: [
        'Identify hypotheses and their prior probabilities',
        'Specify the likelihood function P(evidence|hypothesis)',
        'Apply Bayes theorem to compute posterior probabilities',
        'Update beliefs sequentially as new evidence arrives',
        'Compare posterior probabilities across competing hypotheses',
        'Calculate Bayes factors for hypothesis comparison',
        'Assess sensitivity to prior choices',
        'Use appropriate prior distributions (informative vs uninformative)',
        'Consider hierarchical Bayesian models if appropriate',
        'Document the probabilistic model and assumptions',
        'Quantify uncertainty in posterior estimates'
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
            priors: { type: 'object' },
            likelihoods: { type: 'object' },
            evidence: { type: 'array', items: { type: 'string' } },
            posteriors: { type: 'object' },
            bayesFactors: { type: 'object' },
            updateSequence: { type: 'array', items: { type: 'object' } },
            priorSensitivity: { type: 'string' },
            modelAssumptions: { type: 'array', items: { type: 'string' } }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hypothesis: { type: 'string' },
              priorProbability: { type: 'number' },
              posteriorProbability: { type: 'number' },
              bayesFactor: { type: 'number' },
              evidenceStrength: { type: 'string' }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        mostProbableHypothesis: { type: 'string' },
        posteriorUncertainty: { type: 'number' },
        evidentialSupport: { type: 'string' }
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
    reasoningType: 'Bayesian Probabilistic Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    mostProbableHypothesis: result.mostProbableHypothesis,
    posteriorUncertainty: result.posteriorUncertainty,
    evidentialSupport: result.evidentialSupport
  };
}
