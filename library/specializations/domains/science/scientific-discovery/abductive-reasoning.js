/**
 * @process Abductive Reasoning
 * @description Infer hidden mechanisms/causes from observations
 * @category Scientific Discovery - Ampliative Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('abductive-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Abductive Reasoning Analysis',
  agent: {
    name: 'hypothesis-architect',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Scientific reasoning specialist in abductive inference and explanatory reasoning',
      task: 'Apply abductive reasoning to infer the best explanation for observed phenomena by identifying hidden mechanisms and causes',
      context: args,
      instructions: [
        'Document the observations or phenomena requiring explanation',
        'Generate candidate explanatory hypotheses',
        'Apply inference to the best explanation (IBE) criteria',
        'Evaluate explanatory virtues: simplicity, scope, coherence, fruitfulness',
        'Assess how well each hypothesis explains the observations',
        'Consider unification power of explanations',
        'Check for alternative explanations and their plausibility',
        'Identify hidden mechanisms or causal structures',
        'Assess the probability that the explanation is correct',
        'Consider potential confounds and spurious explanations',
        'Document the abductive inference chain'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            observations: { type: 'array', items: { type: 'string' } },
            candidateExplanations: { type: 'array', items: { type: 'string' } },
            explanatoryVirtues: {
              type: 'object',
              properties: {
                simplicity: { type: 'object' },
                scope: { type: 'object' },
                coherence: { type: 'object' },
                fruitfulness: { type: 'object' }
              }
            },
            hiddenMechanisms: { type: 'array', items: { type: 'object' } },
            causalStructure: { type: 'object' },
            alternativeExplanations: { type: 'array', items: { type: 'string' } },
            confounds: { type: 'array', items: { type: 'string' } }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              explanation: { type: 'string' },
              explanatoryPower: { type: 'number' },
              mechanism: { type: 'string' },
              plausibility: { type: 'string', enum: ['high', 'moderate', 'low'] }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        bestExplanation: { type: 'string' },
        explanatoryGap: { type: 'string' },
        furtherInvestigation: { type: 'array', items: { type: 'string' } }
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
    reasoningType: 'Abductive Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    bestExplanation: result.bestExplanation,
    explanatoryGap: result.explanatoryGap,
    furtherInvestigation: result.furtherInvestigation
  };
}
