/**
 * @process Inductive Reasoning
 * @description Infer general patterns from observations
 * @category Scientific Discovery - Ampliative Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('inductive-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Inductive Reasoning Analysis',
  agent: {
    name: 'hypothesis-architect',
    skills: ['hypothesis-generator', 'statistical-test-selector'],
    prompt: {
      role: 'Scientific reasoning specialist in inductive inference and pattern generalization',
      task: 'Apply inductive reasoning to infer general patterns and principles from specific observations',
      context: args,
      instructions: [
        'Collect and organize all available observations and data',
        'Identify recurring patterns, regularities, and similarities',
        'Formulate candidate generalizations from observed patterns',
        'Assess the strength of inductive support (sample size, diversity)',
        'Consider the problem of induction and its limitations',
        'Apply enumerative induction where appropriate',
        'Use eliminative induction to rule out alternatives',
        'Check for counterexamples to proposed generalizations',
        'Assess the projectibility of predicates (grue problem)',
        'Document the inductive leap from particulars to generals',
        'Quantify confidence based on evidence strength'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            observations: { type: 'array', items: { type: 'object' } },
            patterns: { type: 'array', items: { type: 'string' } },
            sampleSize: { type: 'number' },
            sampleDiversity: { type: 'string' },
            candidateGeneralizations: { type: 'array', items: { type: 'string' } },
            counterexamples: { type: 'array', items: { type: 'string' } },
            inductiveStrength: { type: 'string' },
            limitations: { type: 'array', items: { type: 'string' } }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              generalization: { type: 'string' },
              supportingEvidence: { type: 'number' },
              counterevidence: { type: 'number' },
              inductiveStrength: { type: 'string', enum: ['strong', 'moderate', 'weak'] }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        patternStrength: { type: 'string' },
        generalizationReliability: { type: 'string' }
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
    reasoningType: 'Inductive Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    patternStrength: result.patternStrength,
    generalizationReliability: result.generalizationReliability
  };
}
