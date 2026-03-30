/**
 * @process Case-Based Reasoning
 * @description Retrieve similar past cases and adapt solutions
 * @category Scientific Discovery - Ampliative Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('case-based-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Case-Based Reasoning Analysis',
  agent: {
    name: 'analogical-reasoner',
    skills: ['analogy-mapper', 'hypothesis-generator', 'semantic-scholar-search'],
    prompt: {
      role: 'Scientific reasoning specialist in case-based reasoning and experiential learning',
      task: 'Apply case-based reasoning to retrieve similar past cases and adapt their solutions to the current problem',
      context: args,
      instructions: [
        'Characterize the current problem with relevant features',
        'Search the case library for similar past cases',
        'Compute similarity metrics between current and retrieved cases',
        'Rank retrieved cases by relevance and similarity',
        'Analyze the most similar cases and their solutions',
        'Identify differences between past and current situations',
        'Adapt past solutions to fit the current context',
        'Evaluate the adapted solution for applicability',
        'Learn from the outcome to improve the case library',
        'Document the retrieval, adaptation, and reuse process',
        'Consider combining insights from multiple cases'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            currentProblem: {
              type: 'object',
              properties: {
                features: { type: 'array', items: { type: 'string' } },
                constraints: { type: 'array', items: { type: 'string' } },
                goals: { type: 'array', items: { type: 'string' } }
              }
            },
            retrievedCases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  caseId: { type: 'string' },
                  description: { type: 'string' },
                  similarity: { type: 'number' },
                  solution: { type: 'string' },
                  outcome: { type: 'string' }
                }
              }
            },
            similarityMetrics: { type: 'object' },
            adaptationRequired: { type: 'array', items: { type: 'string' } },
            adaptedSolution: { type: 'object' }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              basedOnCase: { type: 'string' },
              adaptations: { type: 'array', items: { type: 'string' } },
              expectedOutcome: { type: 'string' }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        bestMatchCase: { type: 'string' },
        adaptationComplexity: { type: 'string' },
        solutionReliability: { type: 'string' }
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
    reasoningType: 'Case-Based Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    bestMatchCase: result.bestMatchCase,
    adaptationComplexity: result.adaptationComplexity,
    solutionReliability: result.solutionReliability
  };
}
