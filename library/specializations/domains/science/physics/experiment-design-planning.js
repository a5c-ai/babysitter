/**
 * @process Experiment Design and Planning
 * @description Systematic design of physics experiments to test hypotheses and measure physical quantities
 * @category Physics - Experimental Physics
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('experiment-design-planning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Experiment Design and Planning Analysis',
  agent: {
    name: 'experiment-designer',
    skills: ['geant4-detector-simulator', 'comsol-multiphysics-modeler'],
    prompt: {
      role: 'Experimental physicist specializing in experiment design and measurement methodology',
      task: 'Design a comprehensive physics experiment to address the given measurement objectives',
      context: args,
      instructions: [
        'Define clear measurement objectives and physics goals',
        'Specify precision requirements and target uncertainties',
        'Design the experimental apparatus and measurement systems',
        'Perform signal estimates and expected event rates',
        'Identify and estimate all background sources',
        'Plan calibration procedures and systematic studies',
        'Design the trigger and data acquisition strategy',
        'Assess resource requirements (time, budget, personnel)',
        'Perform safety assessment and identify hazards',
        'Create detailed experimental protocols and procedures',
        'Plan data analysis strategy and blinding procedures',
        'Identify potential systematic uncertainties and mitigation strategies'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            objectives: { type: 'array', items: { type: 'string' } },
            precisionRequirements: { type: 'object' },
            apparatusDesign: { type: 'object' },
            signalEstimates: { type: 'object' },
            backgroundEstimates: { type: 'array', items: { type: 'object' } },
            calibrationPlan: { type: 'array', items: { type: 'object' } },
            dataAcquisitionStrategy: { type: 'object' },
            resourceRequirements: { type: 'object' },
            safetyAssessment: { type: 'object' },
            systematicStudies: { type: 'array', items: { type: 'object' } }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              feasibility: { type: 'string' },
              expectedSensitivity: { type: 'string' }
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

  await ctx.breakpoint('Review experiment design and planning results');

  return {
    success: true,
    processType: 'Experiment Design and Planning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
