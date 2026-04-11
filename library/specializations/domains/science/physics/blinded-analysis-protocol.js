/**
 * @process Blinded Analysis Protocol
 * @description Implement blinded analysis procedures to avoid experimenter bias in measurements
 * @category Physics - Data Analysis
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('blinded-analysis-protocol-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Blinded Analysis Protocol Analysis',
  agent: {
    name: 'blinded-analysis-coordinator',
    skills: ['root-data-analyzer', 'iminuit-statistical-fitter'],
    prompt: {
      role: 'Physicist specializing in blinded analysis methodology and bias prevention',
      task: 'Design and implement a blinded analysis protocol for the given measurement',
      context: args,
      instructions: [
        'Design blinding strategy appropriate for the measurement type',
        'Choose blinding method (hidden signal region, offset blinding, etc.)',
        'Implement blinding in analysis code with secure procedures',
        'Define clear pre-unblinding validation criteria',
        'Document complete analysis procedure before looking at blinded data',
        'Perform all systematic studies and validation in blinded state',
        'Conduct internal review of analysis while blinded',
        'Define unblinding criteria that must be satisfied',
        'Plan controlled unblinding procedure with witnesses',
        'Document any post-unblinding changes with justification',
        'Ensure reproducibility of the unblinding process',
        'Archive blinded analysis state for verification'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            blindingStrategy: { type: 'object' },
            blindingMethod: { type: 'string' },
            implementationDetails: { type: 'object' },
            validationCriteria: { type: 'array', items: { type: 'object' } },
            systematicStudies: { type: 'array', items: { type: 'object' } },
            internalReview: { type: 'object' },
            unblindingCriteria: { type: 'array', items: { type: 'string' } },
            unblindingProcedure: { type: 'object' },
            postUnblindingChanges: { type: 'array', items: { type: 'object' } },
            archiveDetails: { type: 'object' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              blindingStatus: { type: 'string' },
              biasControl: { type: 'string' }
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

  await ctx.breakpoint('Review blinded analysis protocol results');

  return {
    success: true,
    processType: 'Blinded Analysis Protocol',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
