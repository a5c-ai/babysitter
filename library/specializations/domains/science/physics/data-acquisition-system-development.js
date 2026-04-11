/**
 * @process Data Acquisition System Development
 * @description Design and implement data acquisition systems for physics experiments
 * @category Physics - Experimental Physics
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('data-acquisition-system-development-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Data Acquisition System Development Analysis',
  agent: {
    name: 'daq-engineer',
    skills: ['labview-instrument-controller', 'epics-control-system', 'bluesky-data-collection'],
    prompt: {
      role: 'Experimental physicist specializing in data acquisition systems and detector electronics',
      task: 'Design and plan a data acquisition system for the given physics experiment',
      context: args,
      instructions: [
        'Specify data rates, bandwidth, and storage requirements',
        'Define trigger requirements and event selection criteria',
        'Design detector readout electronics architecture',
        'Implement multi-level trigger logic and algorithms',
        'Plan data flow from front-end to storage',
        'Develop real-time monitoring and quality control systems',
        'Design event building and data formatting',
        'Implement deadtime management and monitoring',
        'Plan system commissioning and validation procedures',
        'Document DAQ system specifications and performance',
        'Design fault tolerance and error handling',
        'Plan scalability for data rate increases'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            dataRateSpecs: { type: 'object' },
            triggerRequirements: { type: 'object' },
            readoutArchitecture: { type: 'object' },
            triggerLevels: { type: 'array', items: { type: 'object' } },
            dataFlow: { type: 'object' },
            monitoringSystems: { type: 'array', items: { type: 'object' } },
            eventBuilding: { type: 'object' },
            deadtimeManagement: { type: 'object' },
            commissioningPlan: { type: 'array', items: { type: 'string' } },
            faultTolerance: { type: 'object' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              performance: { type: 'string' },
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

  await ctx.breakpoint('Review data acquisition system development results');

  return {
    success: true,
    processType: 'Data Acquisition System Development',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
