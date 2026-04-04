/**
 * @process Molecular Dynamics Simulation Setup
 * @description Configure and validate molecular dynamics simulations for materials and molecular systems
 * @category Physics - Computational Physics
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('molecular-dynamics-simulation-setup-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Molecular Dynamics Simulation Setup Analysis',
  agent: {
    name: 'md-simulation-specialist',
    skills: ['lammps-md-simulator', 'gromacs-biosim-runner'],
    prompt: {
      role: 'Computational physicist specializing in molecular dynamics simulations and materials modeling',
      task: 'Configure and validate a molecular dynamics simulation for the given physical system',
      context: args,
      instructions: [
        'Select appropriate force fields or interatomic potentials for the system',
        'Validate force field accuracy against experimental or ab initio data',
        'Prepare initial atomic configurations and system setup',
        'Define simulation box geometry and boundary conditions (periodic, fixed, etc.)',
        'Choose integration algorithm and determine appropriate timestep',
        'Select thermostat for temperature control (Nose-Hoover, Langevin, etc.)',
        'Select barostat for pressure control if NPT ensemble needed',
        'Plan equilibration protocol and criteria',
        'Validate simulation setup against known benchmarks',
        'Define observables and analysis quantities to compute',
        'Plan production run parameters and trajectory output',
        'Estimate computational resources and timeline'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            forceField: { type: 'object' },
            forceFieldValidation: { type: 'array', items: { type: 'object' } },
            initialConfiguration: { type: 'object' },
            boundaryConditions: { type: 'object' },
            integrationAlgorithm: { type: 'string' },
            timestep: { type: 'object' },
            thermostat: { type: 'object' },
            barostat: { type: 'object' },
            equilibrationProtocol: { type: 'array', items: { type: 'object' } },
            benchmarkValidation: { type: 'array', items: { type: 'object' } },
            observables: { type: 'array', items: { type: 'string' } },
            productionRunParameters: { type: 'object' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              simulationQuality: { type: 'string' },
              limitations: { type: 'string' }
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

  await ctx.breakpoint('Review molecular dynamics simulation setup results');

  return {
    success: true,
    processType: 'Molecular Dynamics Simulation Setup',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
