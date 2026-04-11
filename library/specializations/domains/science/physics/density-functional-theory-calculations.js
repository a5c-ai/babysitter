/**
 * @process Density Functional Theory Calculations
 * @description Perform DFT calculations for electronic structure and materials properties
 * @category Physics - Computational Physics
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('density-functional-theory-calculations-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Density Functional Theory Calculations Analysis',
  agent: {
    name: 'dft-specialist',
    skills: ['vasp-dft-calculator', 'quantum-espresso-runner', 'wannier90-tight-binding'],
    prompt: {
      role: 'Computational physicist specializing in density functional theory and electronic structure calculations',
      task: 'Perform DFT calculations to determine electronic structure and materials properties',
      context: args,
      instructions: [
        'Select appropriate exchange-correlation functional (LDA, GGA, hybrid, meta-GGA)',
        'Choose basis set approach (plane waves, localized basis, augmented methods)',
        'Determine appropriate k-point sampling for Brillouin zone integration',
        'Set plane-wave cutoff energy or basis set quality',
        'Perform crystal structure optimization if needed',
        'Calculate electronic band structure and density of states',
        'Compute relevant materials properties (elastic, optical, magnetic)',
        'Assess DFT limitations and accuracy for the given system',
        'Apply corrections if needed (DFT+U, van der Waals, spin-orbit)',
        'Validate results against experimental data or higher-level theory',
        'Document computational parameters and methodology',
        'Estimate computational resource requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            functionalChoice: { type: 'object' },
            basisSetApproach: { type: 'object' },
            kPointSampling: { type: 'object' },
            energyCutoff: { type: 'object' },
            structureOptimization: { type: 'object' },
            bandStructure: { type: 'object' },
            densityOfStates: { type: 'object' },
            materialsProperties: { type: 'array', items: { type: 'object' } },
            corrections: { type: 'array', items: { type: 'object' } },
            validation: { type: 'array', items: { type: 'object' } },
            computationalParameters: { type: 'object' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              calculatedValue: { type: 'string' },
              accuracy: { type: 'string' }
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

  await ctx.breakpoint('Review density functional theory calculation results');

  return {
    success: true,
    processType: 'Density Functional Theory Calculations',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
