/**
 * @process Monte Carlo Simulation Implementation
 * @description Implement and validate Monte Carlo methods for statistical physics and particle transport
 * @category Physics - Computational Physics
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('monte-carlo-simulation-implementation-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monte Carlo Simulation Implementation Analysis',
  agent: {
    name: 'monte-carlo-specialist',
    skills: ['monte-carlo-physics-simulator', 'geant4-detector-simulator'],
    prompt: {
      role: 'Computational physicist specializing in Monte Carlo methods and statistical simulations',
      task: 'Design and implement Monte Carlo simulation methods for the given physical problem',
      context: args,
      instructions: [
        'Select appropriate Monte Carlo algorithm (Metropolis, kinetic MC, MCMC, etc.)',
        'Design efficient sampling strategies for the configuration space',
        'Implement acceptance-rejection criteria correctly',
        'Develop variance reduction techniques (importance sampling, etc.)',
        'Handle boundary conditions and constraints appropriately',
        'Design move sets and transition probabilities satisfying detailed balance',
        'Implement measurement and observable calculations',
        'Validate against analytical solutions or known benchmark results',
        'Estimate statistical uncertainties using appropriate methods',
        'Analyze autocorrelation times and ensure adequate sampling',
        'Optimize computational performance (parallel strategies, etc.)',
        'Document algorithm details and convergence criteria'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            algorithmType: { type: 'string' },
            samplingStrategy: { type: 'object' },
            acceptanceRejection: { type: 'object' },
            varianceReduction: { type: 'array', items: { type: 'object' } },
            boundaryConditions: { type: 'object' },
            moveSet: { type: 'array', items: { type: 'object' } },
            observables: { type: 'array', items: { type: 'object' } },
            validation: { type: 'array', items: { type: 'object' } },
            uncertaintyEstimates: { type: 'object' },
            autocorrelationAnalysis: { type: 'object' },
            performanceBenchmarks: { type: 'object' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              statisticalUncertainty: { type: 'string' },
              convergence: { type: 'string' }
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

  await ctx.breakpoint('Review Monte Carlo simulation implementation results');

  return {
    success: true,
    processType: 'Monte Carlo Simulation Implementation',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
