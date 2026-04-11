/**
 * @process Phase Transition Investigation
 * @description Investigate phase transitions and critical phenomena in materials and systems
 * @category Physics - Condensed Matter Physics
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('phase-transition-investigation-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase Transition Investigation Analysis',
  agent: {
    name: 'phase-transition-investigator',
    skills: ['quimb-tensor-network', 'monte-carlo-physics-simulator'],
    prompt: {
      role: 'Condensed matter physicist specializing in phase transitions and critical phenomena',
      task: 'Investigate phase transitions and critical behavior in the given physical system',
      context: args,
      instructions: [
        'Identify signatures of phase transition in preliminary data',
        'Classify transition type (first-order, continuous, topological)',
        'Design systematic temperature, pressure, or field studies',
        'Measure order parameter as function of control parameter',
        'Measure susceptibilities and response functions near transition',
        'Determine critical temperature/field with appropriate precision',
        'Extract critical exponents from power-law fits',
        'Compare critical exponents with universality class predictions',
        'Study finite-size effects if applicable',
        'Model phase transition mechanism (Landau theory, microscopic)',
        'Construct phase diagram if multiple phases present',
        'Document phase transition characteristics comprehensively'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            transitionSignatures: { type: 'array', items: { type: 'object' } },
            transitionType: { type: 'string' },
            systematicStudies: { type: 'array', items: { type: 'object' } },
            orderParameter: { type: 'object' },
            susceptibilities: { type: 'array', items: { type: 'object' } },
            criticalPoint: { type: 'object' },
            criticalExponents: { type: 'array', items: { type: 'object' } },
            universalityClass: { type: 'object' },
            finiteSizeEffects: { type: 'object' },
            theoreticalModel: { type: 'object' },
            phaseDiagram: { type: 'object' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              criticalBehavior: { type: 'string' },
              universalityComparison: { type: 'string' }
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

  await ctx.breakpoint('Review phase transition investigation results');

  return {
    success: true,
    processType: 'Phase Transition Investigation',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
