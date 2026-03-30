/**
 * @process Statistical Reasoning
 * @description Population inference from samples using estimators
 * @category Scientific Discovery - Ampliative Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('statistical-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Statistical Reasoning Analysis',
  agent: {
    name: 'statistical-consultant',
    skills: ['statistical-test-selector', 'regression-analyzer', 'power-analysis-calculator'],
    prompt: {
      role: 'Scientific reasoning specialist in statistical inference and estimation theory',
      task: 'Apply statistical reasoning to infer population characteristics from sample data using appropriate estimators',
      context: args,
      instructions: [
        'Identify the population and sampling method',
        'Assess sample representativeness and potential biases',
        'Choose appropriate statistical estimators (point and interval)',
        'Calculate sample statistics and their standard errors',
        'Construct confidence intervals with appropriate coverage',
        'Perform hypothesis tests where relevant',
        'Check assumptions underlying statistical methods',
        'Assess statistical power and effect sizes',
        'Consider multiple testing corrections if needed',
        'Interpret results in context of practical significance',
        'Document limitations and sources of uncertainty'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            population: { type: 'string' },
            samplingMethod: { type: 'string' },
            sampleSize: { type: 'number' },
            sampleStatistics: { type: 'object' },
            estimators: { type: 'array', items: { type: 'object' } },
            confidenceIntervals: { type: 'array', items: { type: 'object' } },
            hypothesisTests: { type: 'array', items: { type: 'object' } },
            assumptions: { type: 'array', items: { type: 'string' } },
            biases: { type: 'array', items: { type: 'string' } }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              estimate: { type: 'number' },
              confidenceInterval: { type: 'object' },
              statisticalSignificance: { type: 'boolean' },
              practicalSignificance: { type: 'string' }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        overallSignificance: { type: 'string' },
        effectSize: { type: 'string' },
        statisticalPower: { type: 'number' }
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
    reasoningType: 'Statistical Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    overallSignificance: result.overallSignificance,
    effectSize: result.effectSize,
    statisticalPower: result.statisticalPower
  };
}
