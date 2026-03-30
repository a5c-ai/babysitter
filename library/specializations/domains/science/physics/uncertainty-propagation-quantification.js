/**
 * @process Uncertainty Propagation and Quantification
 * @description Systematically propagate uncertainties through analysis chains and quantify final uncertainties
 * @category Physics - Data Analysis
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('uncertainty-propagation-quantification-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Uncertainty Propagation and Quantification Analysis',
  agent: {
    name: 'uncertainty-propagator',
    skills: ['emcee-mcmc-sampler', 'pymc-bayesian-modeler'],
    prompt: {
      role: 'Physicist specializing in uncertainty quantification and error analysis',
      task: 'Systematically propagate and quantify uncertainties for the given physics measurement',
      context: args,
      instructions: [
        'Identify all sources of uncertainty in the measurement chain',
        'Classify uncertainties as statistical or systematic',
        'Implement error propagation methods appropriate for each step',
        'Handle correlated uncertainties using covariance matrices',
        'Apply linear error propagation where appropriate',
        'Use Monte Carlo methods for non-linear propagation',
        'Perform sensitivity analysis to identify dominant uncertainties',
        'Validate uncertainty estimates through closure tests',
        'Combine uncertainties correctly (addition in quadrature, covariance)',
        'Document complete uncertainty budget with all contributions',
        'Report results with appropriate significant figures',
        'Identify opportunities for uncertainty reduction'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            uncertaintySources: { type: 'array', items: { type: 'object' } },
            propagationMethods: { type: 'array', items: { type: 'object' } },
            correlations: { type: 'object' },
            linearPropagation: { type: 'object' },
            monteCarloResults: { type: 'object' },
            sensitivityAnalysis: { type: 'array', items: { type: 'object' } },
            validationTests: { type: 'array', items: { type: 'object' } },
            uncertaintyBudget: { type: 'array', items: { type: 'object' } },
            totalUncertainty: { type: 'object' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              uncertainty: { type: 'string' },
              dominantSources: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 }
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

  await ctx.breakpoint('Review uncertainty propagation and quantification results');

  return {
    success: true,
    processType: 'Uncertainty Propagation and Quantification',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
