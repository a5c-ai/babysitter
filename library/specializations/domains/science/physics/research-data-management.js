/**
 * @process Research Data Management
 * @description Manage research data throughout its lifecycle for reproducibility and sharing
 * @category Physics - Publication and Dissemination
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('research-data-management-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research Data Management Analysis',
  agent: {
    name: 'research-data-manager',
    skills: ['latex-physics-documenter', 'paraview-scientific-visualizer'],
    prompt: {
      role: 'Research data specialist with expertise in physics data management and FAIR principles',
      task: 'Develop and implement a comprehensive research data management plan',
      context: args,
      instructions: [
        'Design data organization and directory structure',
        'Establish naming conventions for files and datasets',
        'Implement version control for code and analysis scripts',
        'Create comprehensive metadata documentation',
        'Design data dictionaries describing all variables',
        'Implement data quality control procedures',
        'Select appropriate data repositories for archiving',
        'Ensure data meets FAIR principles (Findable, Accessible, Interoperable, Reusable)',
        'Plan for data anonymization if human subjects involved',
        'Establish data access policies and licensing',
        'Obtain DOIs for published datasets',
        'Plan long-term data preservation strategy'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            dataOrganization: { type: 'object' },
            namingConventions: { type: 'array', items: { type: 'string' } },
            versionControl: { type: 'object' },
            metadataSchema: { type: 'object' },
            dataDictionary: { type: 'array', items: { type: 'object' } },
            qualityControl: { type: 'array', items: { type: 'object' } },
            repositorySelection: { type: 'array', items: { type: 'object' } },
            fairAssessment: { type: 'object' },
            accessPolicy: { type: 'object' },
            licensing: { type: 'object' },
            preservationPlan: { type: 'object' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              fairCompliance: { type: 'string' },
              implementation: { type: 'string' }
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

  await ctx.breakpoint('Review research data management results');

  return {
    success: true,
    processType: 'Research Data Management',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
