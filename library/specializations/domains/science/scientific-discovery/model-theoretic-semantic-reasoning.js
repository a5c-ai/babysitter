/**
 * @process Model-Theoretic Semantic Reasoning
 * @description Reason by constructing models satisfying theories
 * @category Scientific Discovery - Formal and Mathematical Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('model-theoretic-semantic-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model-Theoretic Semantic Reasoning Analysis',
  agent: {
    name: 'assumption-auditor',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Scientific reasoning specialist in model theory and semantic analysis',
      task: 'Apply model-theoretic semantic reasoning by constructing and analyzing models that satisfy given theories',
      context: args,
      instructions: [
        'Identify the formal language and its signature',
        'Specify the theory (set of axioms/sentences) to be satisfied',
        'Construct a model (domain + interpretations) satisfying the theory',
        'Verify the model satisfies each axiom',
        'Check for consistency by exhibiting a model',
        'Identify consequences that hold in all models of the theory',
        'Use compactness and Lowenheim-Skolem theorems where applicable',
        'Distinguish between semantic and syntactic entailment',
        'Explore different models to understand theory variations',
        'Identify categorical vs non-categorical theories',
        'Document model construction and satisfaction checking'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            language: { type: 'object' },
            theory: { type: 'array', items: { type: 'string' } },
            model: {
              type: 'object',
              properties: {
                domain: { type: 'string' },
                interpretations: { type: 'object' }
              }
            },
            satisfactionChecks: { type: 'array', items: { type: 'object' } },
            semanticConsequences: { type: 'array', items: { type: 'string' } },
            consistencyStatus: { type: 'string' },
            categoricity: { type: 'string' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              semanticStatus: { type: 'string', enum: ['valid', 'satisfiable', 'unsatisfiable'] },
              modelEvidence: { type: 'string' }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        theoryConsistent: { type: 'boolean' },
        modelConstructed: { type: 'boolean' }
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
    reasoningType: 'Model-Theoretic Semantic Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    theoryConsistent: result.theoryConsistent,
    modelConstructed: result.modelConstructed
  };
}
