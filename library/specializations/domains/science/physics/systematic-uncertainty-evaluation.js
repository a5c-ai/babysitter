/**
 * @process Systematic Uncertainty Evaluation
 * @description Comprehensive assessment and quantification of systematic uncertainties in measurements
 * @category Physics - Experimental Physics
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('systematic-uncertainty-evaluation-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Systematic Uncertainty Evaluation Analysis',
  agent: {
    name: 'systematic-uncertainty-analyst',
    skills: ['root-data-analyzer', 'iminuit-statistical-fitter'],
    prompt: {
      role: 'Experimental physicist specializing in systematic uncertainty analysis and error quantification',
      task: 'Comprehensively assess and quantify all systematic uncertainties for the given measurement',
      context: args,
      instructions: [
        'Identify all potential sources of systematic uncertainty',
        'Categorize systematics by origin (detector, theory, analysis, external)',
        'Design dedicated systematic studies for each source',
        'Evaluate detector-related uncertainties (calibration, resolution, efficiency)',
        'Assess theoretical modeling uncertainties (MC generators, PDFs, scales)',
        'Quantify analysis method uncertainties (selection, fitting, unfolding)',
        'Evaluate external input uncertainties (luminosity, cross sections, branching ratios)',
        'Determine correlation structure between systematic sources',
        'Combine statistical and systematic uncertainties appropriately',
        'Build complete uncertainty covariance matrix',
        'Document the full systematic uncertainty budget',
        'Identify dominant systematics and potential reduction strategies'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            systematicSources: { type: 'array', items: { type: 'object' } },
            detectorSystematics: { type: 'array', items: { type: 'object' } },
            theorySystematics: { type: 'array', items: { type: 'object' } },
            analysisSystematics: { type: 'array', items: { type: 'object' } },
            externalSystematics: { type: 'array', items: { type: 'object' } },
            correlationMatrix: { type: 'object' },
            totalUncertainty: { type: 'object' },
            uncertaintyBudget: { type: 'array', items: { type: 'object' } },
            dominantSystematics: { type: 'array', items: { type: 'string' } }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              uncertaintyValue: { type: 'string' },
              reductionStrategy: { type: 'string' }
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

  await ctx.breakpoint('Review systematic uncertainty evaluation results');

  return {
    success: true,
    processType: 'Systematic Uncertainty Evaluation',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
