/**
 * @process Detector Calibration and Characterization
 * @description Calibrate and characterize detector response for accurate physics measurements
 * @category Physics - Experimental Physics
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('detector-calibration-characterization-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detector Calibration and Characterization Analysis',
  agent: {
    name: 'detector-calibrator',
    skills: ['root-data-analyzer', 'bluesky-data-collection', 'pymeasure-automation'],
    prompt: {
      role: 'Experimental physicist specializing in detector calibration and performance characterization',
      task: 'Design and implement comprehensive detector calibration and characterization procedures',
      context: args,
      instructions: [
        'Design calibration procedures using appropriate calibration standards',
        'Perform energy calibration using known reference sources or processes',
        'Calibrate position and spatial response of the detector',
        'Perform timing calibration and synchronization',
        'Characterize detector resolution (energy, position, time)',
        'Measure detector efficiency as function of relevant parameters',
        'Study detector response linearity and dynamic range',
        'Monitor calibration stability over time and conditions',
        'Develop calibration correction algorithms and lookup tables',
        'Validate calibration using known physics processes',
        'Quantify calibration uncertainties and their propagation',
        'Document calibration procedures and quality criteria'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            calibrationProcedures: { type: 'array', items: { type: 'object' } },
            energyCalibration: { type: 'object' },
            positionCalibration: { type: 'object' },
            timingCalibration: { type: 'object' },
            resolutionCharacterization: { type: 'object' },
            efficiencyMeasurements: { type: 'array', items: { type: 'object' } },
            linearityStudy: { type: 'object' },
            stabilityMonitoring: { type: 'object' },
            correctionAlgorithms: { type: 'array', items: { type: 'object' } },
            validationResults: { type: 'array', items: { type: 'object' } }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              calibrationQuality: { type: 'string' },
              uncertainty: { type: 'string' }
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

  await ctx.breakpoint('Review detector calibration and characterization results');

  return {
    success: true,
    processType: 'Detector Calibration and Characterization',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
