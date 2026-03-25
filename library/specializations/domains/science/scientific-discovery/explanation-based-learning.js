/**
 * @process Explanation-Based Learning
 * @description Generalize reusable rules from expert solutions
 * @category Scientific Discovery - Ampliative Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('explanation-based-learning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Explanation-Based Learning Analysis',
  agent: {
    name: 'hypothesis-architect',
    skills: ['hypothesis-generator', 'analogy-mapper', 'semantic-scholar-search'],
    prompt: {
      role: 'Scientific reasoning specialist in explanation-based learning and knowledge compilation',
      task: 'Apply explanation-based learning to analyze expert solutions and generalize reusable rules and principles',
      context: args,
      instructions: [
        'Analyze the training example or expert solution provided',
        'Identify the domain theory and background knowledge',
        'Construct an explanation of why the solution works',
        'Trace the causal chain from conditions to outcomes',
        'Identify the relevant features that enable the solution',
        'Generalize the explanation to create reusable rules',
        'Determine the operationality criteria for the learned rules',
        'Compile the explanation into efficient, applicable knowledge',
        'Identify the scope and applicability of generalized rules',
        'Test the generalized rules on new examples',
        'Document the explanation structure and learning outcome'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            trainingExample: { type: 'object' },
            domainTheory: { type: 'array', items: { type: 'string' } },
            explanation: {
              type: 'object',
              properties: {
                proofTree: { type: 'array', items: { type: 'object' } },
                causalChain: { type: 'array', items: { type: 'string' } },
                relevantFeatures: { type: 'array', items: { type: 'string' } }
              }
            },
            generalization: {
              type: 'object',
              properties: {
                generalizedRule: { type: 'string' },
                preconditions: { type: 'array', items: { type: 'string' } },
                effects: { type: 'array', items: { type: 'string' } }
              }
            },
            operationalityCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              learnedRule: { type: 'string' },
              applicabilityScope: { type: 'string' },
              efficiency: { type: 'string' },
              transferability: { type: 'string', enum: ['high', 'moderate', 'low'] }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        generalizationQuality: { type: 'string' },
        compiledKnowledge: { type: 'array', items: { type: 'string' } },
        learningEfficiency: { type: 'string' }
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
    reasoningType: 'Explanation-Based Learning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    generalizationQuality: result.generalizationQuality,
    compiledKnowledge: result.compiledKnowledge,
    learningEfficiency: result.learningEfficiency
  };
}
