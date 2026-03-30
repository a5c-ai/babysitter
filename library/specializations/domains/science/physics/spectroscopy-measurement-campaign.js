/**
 * @process Spectroscopy Measurement Campaign
 * @description Perform comprehensive spectroscopic measurements to probe material properties
 * @category Physics - Condensed Matter Physics
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('spectroscopy-measurement-campaign-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Spectroscopy Measurement Campaign Analysis',
  agent: {
    name: 'spectroscopy-analyst',
    skills: ['spinw-magnetic-simulator', 'bluesky-data-collection'],
    prompt: {
      role: 'Condensed matter physicist specializing in spectroscopic techniques and materials characterization',
      task: 'Plan and execute a comprehensive spectroscopy measurement campaign',
      context: args,
      instructions: [
        'Select appropriate spectroscopic techniques for the physics questions',
        'Consider optical spectroscopy (UV-Vis, IR, Raman, photoluminescence)',
        'Consider electron spectroscopy (ARPES, XPS, EELS) if applicable',
        'Consider neutron or X-ray scattering spectroscopy if applicable',
        'Prepare samples with appropriate geometry and surface quality',
        'Plan measurement conditions (temperature, field, polarization)',
        'Collect spectra across relevant parameter ranges systematically',
        'Process raw spectroscopic data (background subtraction, normalization)',
        'Analyze spectra to extract physical quantities (gaps, lifetimes, etc.)',
        'Compare measured spectra with theoretical calculations',
        'Identify spectral features and their physical origin',
        'Document measurement protocols and analysis procedures'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            techniqueSelection: { type: 'array', items: { type: 'object' } },
            samplePreparation: { type: 'object' },
            measurementConditions: { type: 'object' },
            parameterRanges: { type: 'array', items: { type: 'object' } },
            dataProcessing: { type: 'array', items: { type: 'object' } },
            extractedQuantities: { type: 'array', items: { type: 'object' } },
            theoreticalComparison: { type: 'array', items: { type: 'object' } },
            spectralFeatures: { type: 'array', items: { type: 'object' } },
            documentation: { type: 'object' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              spectralEvidence: { type: 'string' },
              physicalInterpretation: { type: 'string' }
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

  await ctx.breakpoint('Review spectroscopy measurement campaign results');

  return {
    success: true,
    processType: 'Spectroscopy Measurement Campaign',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
