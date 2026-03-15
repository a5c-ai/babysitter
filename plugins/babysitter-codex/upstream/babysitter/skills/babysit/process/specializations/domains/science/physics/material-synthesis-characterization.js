/**
 * @process Material Synthesis and Characterization
 * @description Synthesize new materials and characterize their structural and physical properties
 * @category Physics - Condensed Matter Physics
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('material-synthesis-characterization-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Material Synthesis and Characterization Analysis',
  agent: {
    name: 'materials-synthesizer',
    skills: ['vasp-dft-calculator', 'aflow-materials-discovery', 'spinw-magnetic-simulator'],
    prompt: {
      role: 'Condensed matter physicist specializing in materials synthesis and characterization',
      task: 'Plan and execute material synthesis and comprehensive characterization',
      context: args,
      instructions: [
        'Plan synthesis routes based on target material and properties',
        'Select appropriate synthesis method (solid state, solution, CVD, MBE, etc.)',
        'Optimize synthesis conditions (temperature, pressure, atmosphere, etc.)',
        'Perform crystal growth for single crystals or thin film deposition',
        'Characterize crystal structure using X-ray diffraction (XRD)',
        'Examine microstructure using electron microscopy (TEM, SEM)',
        'Measure electronic transport properties (resistivity, Hall effect)',
        'Characterize magnetic properties (susceptibility, magnetization)',
        'Measure optical properties (absorption, reflectance)',
        'Correlate structure with measured properties',
        'Document synthesis protocols for reproducibility',
        'Assess sample quality and homogeneity'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            synthesisRoute: { type: 'object' },
            synthesisMethod: { type: 'string' },
            synthesisConditions: { type: 'object' },
            crystalGrowth: { type: 'object' },
            structuralCharacterization: { type: 'object' },
            microscopy: { type: 'object' },
            transportProperties: { type: 'object' },
            magneticProperties: { type: 'object' },
            opticalProperties: { type: 'object' },
            structurePropertyCorrelation: { type: 'array', items: { type: 'object' } },
            sampleQuality: { type: 'object' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              measuredProperty: { type: 'string' },
              structuralCorrelation: { type: 'string' }
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

  await ctx.breakpoint('Review material synthesis and characterization results');

  return {
    success: true,
    processType: 'Material Synthesis and Characterization',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
