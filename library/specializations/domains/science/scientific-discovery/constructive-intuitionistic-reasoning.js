/**
 * @process Constructive Intuitionistic Reasoning
 * @description Proofs must provide explicit witnesses or constructions
 * @category Scientific Discovery - Formal and Mathematical Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('constructive-intuitionistic-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Constructive Intuitionistic Reasoning Analysis',
  agent: {
    name: 'assumption-auditor',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Scientific reasoning specialist in constructive mathematics and intuitionistic logic',
      task: 'Apply constructive intuitionistic reasoning requiring explicit witnesses and constructions for all existence claims',
      context: args,
      instructions: [
        'Identify existence claims that require explicit witnesses',
        'Reject proofs by contradiction that do not provide constructions',
        'Build explicit constructive proofs with computable content',
        'For each existential statement, provide a witness or construction method',
        'Apply the Brouwer-Heyting-Kolmogorov interpretation',
        'Avoid use of law of excluded middle unless constructively justified',
        'Ensure all disjunctions have explicit case constructions',
        'Document the computational content of the proof',
        'Verify that all functions defined are computable',
        'Identify classical principles that cannot be used constructively',
        'Assess whether the proof yields an algorithm or effective procedure'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            existenceClaims: { type: 'array', items: { type: 'string' } },
            witnesses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  claim: { type: 'string' },
                  witness: { type: 'string' },
                  construction: { type: 'string' }
                }
              }
            },
            constructiveSteps: { type: 'array', items: { type: 'object' } },
            classicalPrinciplesAvoided: { type: 'array', items: { type: 'string' } },
            computationalContent: { type: 'string' },
            effectiveProcedure: { type: 'boolean' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              witness: { type: 'string' },
              constructive: { type: 'boolean' }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        fullyConstructive: { type: 'boolean' },
        extractedAlgorithm: { type: 'string' }
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

  return {
    success: true,
    reasoningType: 'Constructive Intuitionistic Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    fullyConstructive: result.fullyConstructive,
    extractedAlgorithm: result.extractedAlgorithm
  };
}
