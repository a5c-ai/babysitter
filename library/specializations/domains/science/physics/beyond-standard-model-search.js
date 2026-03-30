/**
 * @process Beyond Standard Model Search
 * @description Design and execute searches for new physics beyond the Standard Model
 * @category Physics - Particle Physics
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('beyond-standard-model-search-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Beyond Standard Model Search Analysis',
  agent: {
    name: 'bsm-search-analyst',
    skills: ['madgraph-amplitude-calculator', 'root-data-analyzer', 'scikit-hep-analysis'],
    prompt: {
      role: 'Particle physicist specializing in BSM physics searches and new particle discovery',
      task: 'Design and execute a search for physics beyond the Standard Model',
      context: args,
      instructions: [
        'Identify target BSM signal signatures and models',
        'Study signal phenomenology and expected event topology',
        'Develop signal selection criteria and discriminating variables',
        'Estimate Standard Model background processes',
        'Validate background estimation in control regions',
        'Optimize search sensitivity (expected limit or discovery significance)',
        'Evaluate systematic uncertainties on signal and background',
        'Perform statistical analysis (profile likelihood, CLs method)',
        'Calculate exclusion limits or discovery significance',
        'Interpret results in context of BSM models (SUSY, extra dimensions, etc.)',
        'Compare with results from other experiments',
        'Document search strategy and results comprehensively'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            bsmSignature: { type: 'object' },
            signalPhenomenology: { type: 'object' },
            selectionCriteria: { type: 'array', items: { type: 'object' } },
            discriminatingVariables: { type: 'array', items: { type: 'object' } },
            backgroundEstimates: { type: 'array', items: { type: 'object' } },
            controlRegions: { type: 'array', items: { type: 'object' } },
            sensitivityOptimization: { type: 'object' },
            systematicUncertainties: { type: 'array', items: { type: 'object' } },
            statisticalAnalysis: { type: 'object' },
            results: { type: 'object' },
            bsmInterpretation: { type: 'object' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              exclusionLimit: { type: 'string' },
              significance: { type: 'string' }
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

  await ctx.breakpoint('Review beyond Standard Model search results');

  return {
    success: true,
    processType: 'Beyond Standard Model Search',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
