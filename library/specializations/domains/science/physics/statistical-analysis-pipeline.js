/**
 * @process Statistical Analysis Pipeline
 * @description Develop robust statistical analysis pipelines for physics data
 * @category Physics - Data Analysis
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('statistical-analysis-pipeline-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Statistical Analysis Pipeline Analysis',
  agent: {
    name: 'statistical-analyst',
    skills: ['root-data-analyzer', 'iminuit-statistical-fitter', 'scikit-hep-analysis'],
    prompt: {
      role: 'Physicist specializing in statistical data analysis and hypothesis testing',
      task: 'Develop a robust statistical analysis pipeline for the given physics measurement',
      context: args,
      instructions: [
        'Design analysis selection criteria to isolate signal from background',
        'Optimize selection cuts for maximum significance or precision',
        'Implement background estimation methods (data-driven, MC-based)',
        'Validate background estimates in control regions',
        'Perform signal extraction using appropriate fitting techniques',
        'Calculate statistical significance and p-values correctly',
        'Apply corrections for multiple testing (trials factor)',
        'Implement confidence interval construction (frequentist or Bayesian)',
        'Handle nuisance parameters and systematic uncertainties in fits',
        'Validate analysis on simulated data (closure tests)',
        'Produce final physics results with complete uncertainties',
        'Create publication-ready plots and tables'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            selectionCriteria: { type: 'array', items: { type: 'object' } },
            cutOptimization: { type: 'object' },
            backgroundEstimation: { type: 'array', items: { type: 'object' } },
            controlRegions: { type: 'array', items: { type: 'object' } },
            signalExtraction: { type: 'object' },
            significanceCalculation: { type: 'object' },
            confidenceIntervals: { type: 'object' },
            nuisanceParameters: { type: 'array', items: { type: 'object' } },
            closureTests: { type: 'array', items: { type: 'object' } },
            finalResults: { type: 'object' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              statisticalSignificance: { type: 'string' },
              measuredValue: { type: 'string' }
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

  await ctx.breakpoint('Review statistical analysis pipeline results');

  return {
    success: true,
    processType: 'Statistical Analysis Pipeline',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
