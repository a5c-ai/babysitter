/**
 * @process Quantum Field Theory Calculations
 * @description Perform QFT calculations for particle physics, condensed matter, and other applications
 * @category Physics - Theoretical Physics
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('quantum-field-theory-calculations-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantum Field Theory Calculations',
  agent: {
    name: 'qft-calculator',
    skills: ['madgraph-amplitude-calculator', 'pythia-event-generator'],
    prompt: {
      role: 'Theoretical physicist specializing in quantum field theory and particle physics calculations',
      task: 'Perform quantum field theory calculations for the given problem',
      context: args,
      instructions: [
        'Identify the relevant quantum field theory and its field content',
        'Write down the Lagrangian density and identify interaction terms',
        'Set up Feynman rules from the Lagrangian (propagators, vertices)',
        'Identify relevant processes and draw Feynman diagrams',
        'Compute tree-level amplitudes using Feynman rules',
        'Calculate loop corrections systematically when required',
        'Apply regularization schemes (dimensional, cutoff, etc.)',
        'Perform renormalization and identify running couplings',
        'Evaluate cross sections and decay rates from amplitudes',
        'Estimate theoretical uncertainties (scale variation, missing orders)',
        'Compare predictions with experimental measurements when available',
        'Document the calculation methodology and all approximations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            theory: { type: 'string' },
            lagrangian: { type: 'string' },
            feynmanRules: { type: 'array', items: { type: 'object' } },
            feynmanDiagrams: { type: 'array', items: { type: 'string' } },
            treeLevelAmplitudes: { type: 'array', items: { type: 'object' } },
            loopCorrections: { type: 'array', items: { type: 'object' } },
            regularizationScheme: { type: 'string' },
            renormalizationDetails: { type: 'object' },
            crossSections: { type: 'array', items: { type: 'object' } },
            decayRates: { type: 'array', items: { type: 'object' } }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              calculation: { type: 'string' },
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

  await ctx.breakpoint('Review quantum field theory calculation results');

  return {
    success: true,
    processType: 'Quantum Field Theory Calculations',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
