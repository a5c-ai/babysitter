/**
 * @process Mathematical Proof Reasoning
 * @description Deduction emphasizing proof structure and derivability
 * @category Scientific Discovery - Formal and Mathematical Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('mathematical-proof-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mathematical Proof Reasoning Analysis',
  agent: {
    name: 'assumption-auditor',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Scientific reasoning specialist in mathematical proof theory and formal derivation',
      task: 'Apply mathematical proof reasoning to construct rigorous proofs with emphasis on proof structure and derivability',
      context: args,
      instructions: [
        'Identify the theorem or proposition to be proved',
        'State all axioms, definitions, and previously proven lemmas available',
        'Determine the appropriate proof strategy (direct, contradiction, induction, etc.)',
        'Construct a formal proof with explicit derivation steps',
        'Ensure each step is justified by an axiom, definition, or inference rule',
        'Check for gaps in reasoning or unjustified leaps',
        'Verify the proof is complete and covers all cases',
        'Assess the elegance and efficiency of the proof structure',
        'Identify alternative proof approaches if applicable',
        'Document any assumptions about the underlying formal system',
        'Note the proof-theoretic strength required (e.g., which axioms are essential)'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            theorem: { type: 'string' },
            axioms: { type: 'array', items: { type: 'string' } },
            definitions: { type: 'array', items: { type: 'string' } },
            proofStrategy: { type: 'string' },
            proofSteps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  step: { type: 'number' },
                  statement: { type: 'string' },
                  justification: { type: 'string' }
                }
              }
            },
            lemmasUsed: { type: 'array', items: { type: 'string' } },
            proofGaps: { type: 'array', items: { type: 'string' } }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              proofComplete: { type: 'boolean' },
              derivabilityStatus: { type: 'string' }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        proofValidity: { type: 'boolean' },
        proofType: { type: 'string' }
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
    reasoningType: 'Mathematical Proof Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    proofValidity: result.proofValidity,
    proofType: result.proofType
  };
}
