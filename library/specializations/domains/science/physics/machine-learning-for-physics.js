/**
 * @process Machine Learning for Physics
 * @description Apply machine learning techniques to physics problems including classification, regression, and discovery
 * @category Physics - Data Analysis
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('machine-learning-for-physics-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Machine Learning for Physics Analysis',
  agent: {
    name: 'physics-ml-developer',
    skills: ['tensorflow-physics-ml', 'scikit-hep-analysis'],
    prompt: {
      role: 'Physicist specializing in machine learning applications in physics research',
      task: 'Apply machine learning techniques to solve the given physics problem',
      context: args,
      instructions: [
        'Define the ML problem formulation (classification, regression, clustering, etc.)',
        'Identify relevant physics-motivated features and inputs',
        'Prepare training, validation, and test datasets appropriately',
        'Address class imbalance if present in classification problems',
        'Select appropriate ML models (BDT, neural network, etc.)',
        'Train models with appropriate hyperparameter optimization',
        'Validate model performance using appropriate metrics',
        'Ensure model predictions respect physical constraints and symmetries',
        'Interpret model behavior and feature importance',
        'Assess systematic uncertainties from ML model choices',
        'Deploy models in physics analysis workflows',
        'Document model architecture, training, and performance'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            problemFormulation: { type: 'object' },
            features: { type: 'array', items: { type: 'object' } },
            datasets: { type: 'object' },
            modelSelection: { type: 'object' },
            trainingDetails: { type: 'object' },
            hyperparameterOptimization: { type: 'object' },
            performanceMetrics: { type: 'object' },
            physicsValidation: { type: 'array', items: { type: 'object' } },
            interpretation: { type: 'object' },
            systematicUncertainties: { type: 'array', items: { type: 'object' } }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              performanceImprovement: { type: 'string' },
              physicsInterpretation: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 }
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

  await ctx.breakpoint('Review machine learning for physics results');

  return {
    success: true,
    processType: 'Machine Learning for Physics',
    analysis: result.analysis,
    conclusions: result.conclusions,
    recommendations: result.recommendations,
    confidence: result.confidence
  };
}
