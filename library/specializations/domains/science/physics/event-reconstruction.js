/**
 * @process Event Reconstruction
 * @description Reconstruct physics objects and events from raw detector data
 * @category Physics - Particle Physics
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('event-reconstruction-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Event Reconstruction Analysis',
  agent: {
    name: 'event-reconstructor',
    skills: ['root-data-analyzer', 'geant4-detector-simulator', 'delphes-fast-simulator'],
    prompt: {
      role: 'Particle physicist specializing in event reconstruction and detector data analysis',
      task: 'Develop event reconstruction algorithms to convert raw detector data into physics objects',
      context: args,
      instructions: [
        'Design track reconstruction algorithms for charged particles',
        'Implement vertex finding and fitting algorithms',
        'Develop calorimeter clustering and energy calibration',
        'Implement particle identification algorithms (electrons, muons, photons, hadrons)',
        'Design jet reconstruction and calibration procedures',
        'Develop tau lepton reconstruction algorithms if applicable',
        'Implement missing transverse energy reconstruction',
        'Optimize reconstruction performance (efficiency, resolution, fake rate)',
        'Validate reconstruction with simulation (matching to truth)',
        'Validate reconstruction with data using known physics processes',
        'Document reconstruction algorithm parameters and performance',
        'Assess systematic uncertainties from reconstruction'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            trackReconstruction: { type: 'object' },
            vertexReconstruction: { type: 'object' },
            calorimeterClustering: { type: 'object' },
            particleIdentification: { type: 'array', items: { type: 'object' } },
            jetReconstruction: { type: 'object' },
            tauReconstruction: { type: 'object' },
            missingEnergyReconstruction: { type: 'object' },
            performanceMetrics: { type: 'object' },
            simulationValidation: { type: 'array', items: { type: 'object' } },
            dataValidation: { type: 'array', items: { type: 'object' } },
            systematicUncertainties: { type: 'array', items: { type: 'object' } }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              reconstructionEfficiency: { type: 'string' },
              resolution: { type: 'string' }
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

  await ctx.breakpoint('Review event reconstruction results');

  return {
    success: true,
    processType: 'Event Reconstruction',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
