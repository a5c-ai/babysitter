/**
 * @process Scientific Paper Preparation
 * @description Prepare physics research for publication in peer-reviewed journals
 * @category Physics - Publication and Dissemination
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('scientific-paper-preparation-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scientific Paper Preparation Analysis',
  agent: {
    name: 'physics-paper-writer',
    skills: ['latex-physics-documenter', 'paraview-scientific-visualizer'],
    prompt: {
      role: 'Physicist with expertise in scientific writing and publication',
      task: 'Guide the preparation of a physics research paper for publication',
      context: args,
      instructions: [
        'Structure paper with clear scientific narrative and logical flow',
        'Write compelling abstract summarizing key results',
        'Craft introduction placing work in scientific context',
        'Describe methods with sufficient detail for reproducibility',
        'Present results clearly with appropriate figures and tables',
        'Prepare publication-quality figures following journal guidelines',
        'Write discussion interpreting results and comparing with literature',
        'Formulate clear conclusions and future directions',
        'Ensure precise physics terminology and notation',
        'Prepare supplementary materials as needed',
        'Format according to target journal requirements',
        'Plan strategy for addressing potential reviewer comments'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            paperStructure: { type: 'object' },
            abstractElements: { type: 'array', items: { type: 'string' } },
            introductionOutline: { type: 'array', items: { type: 'string' } },
            methodsChecklist: { type: 'array', items: { type: 'string' } },
            resultsOrganization: { type: 'array', items: { type: 'object' } },
            figuresList: { type: 'array', items: { type: 'object' } },
            discussionPoints: { type: 'array', items: { type: 'string' } },
            conclusionElements: { type: 'array', items: { type: 'string' } },
            supplementaryMaterials: { type: 'array', items: { type: 'string' } },
            targetJournal: { type: 'object' },
            potentialReviewerConcerns: { type: 'array', items: { type: 'object' } }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              section: { type: 'string' },
              priority: { type: 'string' }
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

  await ctx.breakpoint('Review scientific paper preparation results');

  return {
    success: true,
    processType: 'Scientific Paper Preparation',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
