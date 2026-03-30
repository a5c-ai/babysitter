/**
 * @process Deductive Reasoning
 * @description Truth-preserving inference where valid conclusions must follow from premises
 * @category Scientific Discovery - Formal and Mathematical Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('deductive-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Deductive Reasoning Analysis',
  agent: {
    name: 'assumption-auditor',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Scientific reasoning specialist in formal logic and deductive inference',
      task: 'Apply deductive reasoning to analyze the problem and derive logically valid conclusions from given premises',
      context: args,
      instructions: [
        'Identify and clearly state all premises in the problem',
        'Verify the logical form and validity of each premise',
        'Apply truth-preserving inference rules (modus ponens, modus tollens, syllogisms)',
        'Construct a formal proof chain from premises to conclusions',
        'Ensure each step follows necessarily from previous steps',
        'Document the logical structure of the argument',
        'Identify any hidden assumptions or implicit premises',
        'Check for logical fallacies or invalid inference patterns',
        'Draw only conclusions that are logically entailed by the premises',
        'Assess the soundness of the argument (validity + truth of premises)',
        'Identify limitations of the deductive analysis'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            premises: { type: 'array', items: { type: 'string' } },
            inferenceRules: { type: 'array', items: { type: 'string' } },
            proofSteps: { type: 'array', items: { type: 'object' } },
            logicalForm: { type: 'string' },
            hiddenAssumptions: { type: 'array', items: { type: 'string' } },
            fallaciesDetected: { type: 'array', items: { type: 'string' } }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              derivation: { type: 'string' },
              certainty: { type: 'string', enum: ['necessary', 'contingent'] }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        validity: { type: 'boolean' },
        soundness: { type: 'string', enum: ['sound', 'valid-but-unsound', 'invalid'] }
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
    reasoningType: 'Deductive Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    validity: result.validity,
    soundness: result.soundness
  };
}
