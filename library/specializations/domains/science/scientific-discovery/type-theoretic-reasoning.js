/**
 * @process Type-Theoretic Reasoning
 * @description Use types including dependent types to enforce invariants
 * @category Scientific Discovery - Formal and Mathematical Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('type-theoretic-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Type-Theoretic Reasoning Analysis',
  agent: {
    name: 'assumption-auditor',
    skills: ['formal-logic-reasoner', 'type-system-validator'],
    prompt: {
      role: 'Scientific reasoning specialist in type theory and dependently typed systems',
      task: 'Apply type-theoretic reasoning using types including dependent types to enforce invariants and prove properties',
      context: args,
      instructions: [
        'Identify the type system appropriate for the problem',
        'Define types that capture the essential invariants',
        'Use dependent types to encode precise specifications',
        'Apply the Curry-Howard correspondence (proofs as programs)',
        'Construct well-typed terms that witness desired properties',
        'Use type checking to verify correctness by construction',
        'Apply refinement types where appropriate',
        'Document the type-level encoding of invariants',
        'Identify what properties are enforced statically vs dynamically',
        'Consider totality and termination requirements',
        'Extract certified programs from type-theoretic proofs'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            typeSystem: { type: 'string' },
            types: { type: 'array', items: { type: 'object' } },
            dependentTypes: { type: 'array', items: { type: 'string' } },
            invariants: { type: 'array', items: { type: 'string' } },
            proofTerms: { type: 'array', items: { type: 'object' } },
            typeChecks: { type: 'array', items: { type: 'object' } },
            curryHowardMapping: { type: 'object' },
            staticGuarantees: { type: 'array', items: { type: 'string' } }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              property: { type: 'string' },
              encodedInType: { type: 'string' },
              proofTerm: { type: 'string' },
              verified: { type: 'boolean' }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        wellTyped: { type: 'boolean' },
        invariantsEnforced: { type: 'array', items: { type: 'string' } },
        extractedProgram: { type: 'string' }
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
    reasoningType: 'Type-Theoretic Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    wellTyped: result.wellTyped,
    invariantsEnforced: result.invariantsEnforced,
    extractedProgram: result.extractedProgram
  };
}
