/**
 * @process Equational Algebraic Reasoning
 * @description Transform expressions using equalities and rewrite rules
 * @category Scientific Discovery - Formal and Mathematical Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('equational-algebraic-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Equational Algebraic Reasoning Analysis',
  agent: {
    name: 'assumption-auditor',
    skills: ['formal-logic-reasoner', 'symbolic-computation-engine'],
    prompt: {
      role: 'Scientific reasoning specialist in equational logic and algebraic manipulation',
      task: 'Apply equational algebraic reasoning to transform expressions using equalities and rewrite rules',
      context: args,
      instructions: [
        'Identify the algebraic structure and its signature (operations, constants)',
        'List all applicable equational axioms and identities',
        'Determine the term rewriting system and its properties',
        'Apply equational transformations step by step',
        'Use substitution, reflexivity, symmetry, and transitivity of equality',
        'Check confluence and termination of rewrite rules',
        'Identify normal forms when they exist',
        'Apply congruence closure for reasoning about equalities',
        'Document each transformation with its justifying equation',
        'Verify the algebraic laws used are valid in the structure',
        'Identify opportunities for simplification or canonicalization'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            algebraicStructure: { type: 'string' },
            signature: { type: 'object' },
            axioms: { type: 'array', items: { type: 'string' } },
            rewriteRules: { type: 'array', items: { type: 'object' } },
            transformationSteps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from: { type: 'string' },
                  to: { type: 'string' },
                  rule: { type: 'string' }
                }
              }
            },
            normalForm: { type: 'string' },
            confluent: { type: 'boolean' },
            terminating: { type: 'boolean' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              equation: { type: 'string' },
              derivable: { type: 'boolean' },
              derivationLength: { type: 'number' }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        equivalenceProved: { type: 'boolean' },
        simplificationAchieved: { type: 'boolean' }
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
    reasoningType: 'Equational Algebraic Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    equivalenceProved: result.equivalenceProved,
    simplificationAchieved: result.simplificationAchieved
  };
}
