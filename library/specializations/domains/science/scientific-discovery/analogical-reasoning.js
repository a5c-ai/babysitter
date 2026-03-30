/**
 * @process Analogical Reasoning
 * @description Transfer relational structure from known domains to novel ones
 * @category Scientific Discovery - Ampliative Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('analogical-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analogical Reasoning Analysis',
  agent: {
    name: 'analogical-reasoner',
    skills: ['analogy-mapper', 'semantic-scholar-search', 'hypothesis-generator'],
    prompt: {
      role: 'Scientific reasoning specialist in analogical inference and structural mapping',
      task: 'Apply analogical reasoning to transfer relational structure and insights from familiar source domains to novel target domains',
      context: args,
      instructions: [
        'Identify the source domain with known structure and relations',
        'Identify the target domain requiring insight',
        'Map structural correspondences between source and target',
        'Apply structure-mapping theory principles',
        'Identify systematic relational correspondences',
        'Transfer inferences from source to target based on mapping',
        'Assess the strength of the analogy (surface vs structural similarity)',
        'Check for disanalogies and limitations of transfer',
        'Consider multiple source analogies if available',
        'Evaluate predictive power of analogical inferences',
        'Document the analogical mapping and transferred conclusions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            sourceDomain: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                entities: { type: 'array', items: { type: 'string' } },
                relations: { type: 'array', items: { type: 'string' } },
                knownFacts: { type: 'array', items: { type: 'string' } }
              }
            },
            targetDomain: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                entities: { type: 'array', items: { type: 'string' } },
                relations: { type: 'array', items: { type: 'string' } }
              }
            },
            structuralMapping: { type: 'array', items: { type: 'object' } },
            surfaceSimilarity: { type: 'number' },
            structuralSimilarity: { type: 'number' },
            disanalogies: { type: 'array', items: { type: 'string' } },
            transferredInferences: { type: 'array', items: { type: 'string' } }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              inference: { type: 'string' },
              sourceJustification: { type: 'string' },
              transferStrength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
              caveats: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        analogyStrength: { type: 'string' },
        predictiveValue: { type: 'string' },
        limitationsNoted: { type: 'array', items: { type: 'string' } }
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
    reasoningType: 'Analogical Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    analogyStrength: result.analogyStrength,
    predictiveValue: result.predictiveValue,
    limitationsNoted: result.limitationsNoted
  };
}
