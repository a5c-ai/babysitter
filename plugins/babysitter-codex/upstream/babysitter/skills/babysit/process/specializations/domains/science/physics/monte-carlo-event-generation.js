/**
 * @process Monte Carlo Event Generation
 * @description Generate simulated particle physics events for analysis development and systematic studies
 * @category Physics - Particle Physics
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('monte-carlo-event-generation-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monte Carlo Event Generation Analysis',
  agent: {
    name: 'mc-generator-specialist',
    skills: ['pythia-event-generator', 'madgraph-amplitude-calculator'],
    prompt: {
      role: 'Particle physicist specializing in Monte Carlo event generation and simulation',
      task: 'Configure and validate Monte Carlo event generation for physics analysis',
      context: args,
      instructions: [
        'Select appropriate event generators (Pythia, Sherpa, Herwig, MadGraph, etc.)',
        'Configure hard process generation (matrix element calculation)',
        'Set up parton distribution functions (PDFs) appropriately',
        'Configure parton shower and hadronization models',
        'Implement underlying event and pile-up simulation',
        'Validate generated cross sections against theoretical predictions',
        'Validate kinematic distributions against measured data',
        'Interface with detector simulation (GEANT4, etc.)',
        'Plan and produce large-scale Monte Carlo samples',
        'Assess generator systematic uncertainties (scale variations, PDF, etc.)',
        'Document generator settings and versions completely',
        'Estimate computational resources for sample production'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            generatorChoice: { type: 'object' },
            hardProcessConfig: { type: 'object' },
            pdfSettings: { type: 'object' },
            partonShowerConfig: { type: 'object' },
            underlyingEventConfig: { type: 'object' },
            crossSectionValidation: { type: 'array', items: { type: 'object' } },
            kinematicValidation: { type: 'array', items: { type: 'object' } },
            detectorSimulation: { type: 'object' },
            sampleProduction: { type: 'object' },
            systematicUncertainties: { type: 'array', items: { type: 'object' } },
            documentation: { type: 'object' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              validationStatus: { type: 'string' },
              systematicUncertainty: { type: 'string' }
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

  await ctx.breakpoint('Review Monte Carlo event generation results');

  return {
    success: true,
    processType: 'Monte Carlo Event Generation',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
