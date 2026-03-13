/**
 * @process specializations/ai-agents-conversational/intent-classification-system
 * @description Intent Classification System Development - Process for building robust intent classification systems
 * including training data creation, model selection, few-shot/zero-shot approaches, and confidence threshold tuning.
 * @inputs { projectName?: string, intents?: array, approach?: string, modelType?: string, outputDir?: string }
 * @outputs { success: boolean, model: object, trainingDataset: object, evaluationMetrics: object, apiEndpoints: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/intent-classification-system', {
 *   projectName: 'support-intent-classifier',
 *   intents: ['billing_inquiry', 'technical_support', 'account_management', 'general_question'],
 *   approach: 'fine-tuned',
 *   modelType: 'bert'
 * });
 *
 * @references
 * - Hugging Face Transformers: https://huggingface.co/docs/transformers/
 * - SetFit: https://github.com/huggingface/setfit
 * - Rasa NLU: https://rasa.com/docs/rasa/nlu-training-data/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'intent-classifier',
    intents = [],
    approach = 'fine-tuned',
    modelType = 'bert',
    outputDir = 'intent-classification-output',
    confidenceThreshold = 0.7,
    enableFallback = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Intent Classification System Development for ${projectName}`);

  // ============================================================================
  // PHASE 1: INTENT TAXONOMY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing intent taxonomy');

  const taxonomy = await ctx.task(intentTaxonomyTask, {
    projectName,
    intents,
    outputDir
  });

  artifacts.push(...taxonomy.artifacts);

  // ============================================================================
  // PHASE 2: TRAINING DATA CREATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating training data');

  const trainingData = await ctx.task(trainingDataCreationTask, {
    projectName,
    intents: taxonomy.refinedIntents,
    approach,
    outputDir
  });

  artifacts.push(...trainingData.artifacts);

  // ============================================================================
  // PHASE 3: MODEL SELECTION AND CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Selecting and configuring model');

  const modelConfig = await ctx.task(modelSelectionTask, {
    projectName,
    approach,
    modelType,
    datasetSize: trainingData.datasetSize,
    outputDir
  });

  artifacts.push(...modelConfig.artifacts);

  // ============================================================================
  // PHASE 4: MODEL TRAINING
  // ============================================================================

  ctx.log('info', 'Phase 4: Training model');

  const training = await ctx.task(modelTrainingTask, {
    projectName,
    modelConfig: modelConfig.config,
    trainingData: trainingData.dataset,
    approach,
    outputDir
  });

  artifacts.push(...training.artifacts);

  // ============================================================================
  // PHASE 5: EVALUATION AND THRESHOLD TUNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Evaluating and tuning thresholds');

  const evaluation = await ctx.task(evaluationThresholdTask, {
    projectName,
    model: training.model,
    testData: trainingData.testSet,
    confidenceThreshold,
    enableFallback,
    outputDir
  });

  artifacts.push(...evaluation.artifacts);

  // Quality Gate
  await ctx.breakpoint({
    question: `Intent classifier ${projectName} trained. Accuracy: ${evaluation.metrics.accuracy}%, F1: ${evaluation.metrics.f1}. Approve for deployment?`,
    title: 'Model Evaluation Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        intentCount: taxonomy.refinedIntents.length,
        accuracy: evaluation.metrics.accuracy,
        f1: evaluation.metrics.f1,
        optimalThreshold: evaluation.optimalThreshold
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 6: API ENDPOINT CREATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating API endpoints');

  const apiEndpoints = await ctx.task(apiEndpointCreationTask, {
    projectName,
    model: training.model,
    confidenceThreshold: evaluation.optimalThreshold,
    enableFallback,
    outputDir
  });

  artifacts.push(...apiEndpoints.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    model: training.model,
    trainingDataset: trainingData.dataset,
    evaluationMetrics: evaluation.metrics,
    apiEndpoints: apiEndpoints.endpoints,
    confidenceThreshold: evaluation.optimalThreshold,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/intent-classification-system',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const intentTaxonomyTask = defineTask('intent-taxonomy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Intent Taxonomy - ${args.projectName}`,
  agent: {
    name: 'nlu-specialist',  // AG-CI-003: Implements NLU pipelines with intent classification and slot filling
    prompt: {
      role: 'NLU Architect',
      task: 'Design intent taxonomy for classification',
      context: args,
      instructions: [
        '1. Review and refine provided intents',
        '2. Identify overlapping or ambiguous intents',
        '3. Create hierarchical intent structure if needed',
        '4. Define out-of-scope/fallback intent',
        '5. Document intent definitions and boundaries',
        '6. Create intent examples for clarity',
        '7. Identify potential multi-intent scenarios',
        '8. Save intent taxonomy'
      ],
      outputFormat: 'JSON with intent taxonomy'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedIntents', 'artifacts'],
      properties: {
        refinedIntents: { type: 'array' },
        hierarchy: { type: 'object' },
        definitions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'intent', 'taxonomy']
}));

export const trainingDataCreationTask = defineTask('training-data-creation', (args, taskCtx) => ({
  kind: 'skill',
  title: `Create Training Data - ${args.projectName}`,
  skill: {
    name: 'intent-classifier-prompts',  // SK-CI-002: Intent classification prompt templates and few-shot examples
    prompt: {
      role: 'NLU Data Engineer',
      task: 'Create training dataset for intent classification',
      context: args,
      instructions: [
        '1. Generate training examples for each intent',
        '2. Include diverse phrasings and variations',
        '3. Add typos and informal language variations',
        '4. Balance dataset across intents',
        '5. Create train/validation/test splits',
        '6. Add negative examples for out-of-scope',
        '7. Validate data quality',
        '8. Save dataset in appropriate format'
      ],
      outputFormat: 'JSON with training dataset'
    },
    outputSchema: {
      type: 'object',
      required: ['dataset', 'datasetSize', 'artifacts'],
      properties: {
        dataset: { type: 'object' },
        datasetSize: { type: 'number' },
        testSet: { type: 'object' },
        splits: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'intent', 'training-data']
}));

export const modelSelectionTask = defineTask('model-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Select Model - ${args.projectName}`,
  agent: {
    name: 'ml-engineer',
    prompt: {
      role: 'ML Engineer',
      task: 'Select and configure model for intent classification',
      context: args,
      instructions: [
        '1. Evaluate model options (BERT, SetFit, LLM-based)',
        '2. Consider dataset size constraints',
        '3. Evaluate few-shot vs fine-tuning needs',
        '4. Select appropriate base model',
        '5. Configure hyperparameters',
        '6. Set up training configuration',
        '7. Document model architecture',
        '8. Save model configuration'
      ],
      outputFormat: 'JSON with model configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        modelName: { type: 'string' },
        hyperparameters: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'intent', 'model-selection']
}));

export const modelTrainingTask = defineTask('model-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `Train Model - ${args.projectName}`,
  agent: {
    name: 'ml-trainer',
    prompt: {
      role: 'ML Trainer',
      task: 'Train intent classification model',
      context: args,
      instructions: [
        '1. Prepare data loaders',
        '2. Initialize model with config',
        '3. Train model on training set',
        '4. Monitor training metrics',
        '5. Apply early stopping if needed',
        '6. Save best checkpoint',
        '7. Log training history',
        '8. Export trained model'
      ],
      outputFormat: 'JSON with trained model'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'artifacts'],
      properties: {
        model: { type: 'object' },
        modelPath: { type: 'string' },
        trainingHistory: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'intent', 'training']
}));

export const evaluationThresholdTask = defineTask('evaluation-threshold', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate and Tune - ${args.projectName}`,
  agent: {
    name: 'ml-evaluator',
    prompt: {
      role: 'ML Evaluator',
      task: 'Evaluate model and tune confidence threshold',
      context: args,
      instructions: [
        '1. Evaluate model on test set',
        '2. Calculate accuracy, precision, recall, F1',
        '3. Generate confusion matrix',
        '4. Analyze per-intent performance',
        '5. Tune confidence threshold for optimal fallback',
        '6. Calculate coverage vs accuracy tradeoff',
        '7. Generate evaluation report',
        '8. Save evaluation results'
      ],
      outputFormat: 'JSON with evaluation metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'optimalThreshold', 'artifacts'],
      properties: {
        metrics: {
          type: 'object',
          properties: {
            accuracy: { type: 'number' },
            precision: { type: 'number' },
            recall: { type: 'number' },
            f1: { type: 'number' }
          }
        },
        confusionMatrix: { type: 'array' },
        optimalThreshold: { type: 'number' },
        perIntentMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'intent', 'evaluation']
}));

export const apiEndpointCreationTask = defineTask('api-endpoint-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create API Endpoints - ${args.projectName}`,
  agent: {
    name: 'api-developer',
    prompt: {
      role: 'API Developer',
      task: 'Create API endpoints for intent classification',
      context: args,
      instructions: [
        '1. Create prediction endpoint',
        '2. Add confidence scores to response',
        '3. Implement fallback logic',
        '4. Add batch prediction endpoint',
        '5. Implement input validation',
        '6. Add rate limiting',
        '7. Create API documentation',
        '8. Save API implementation'
      ],
      outputFormat: 'JSON with API endpoints'
    },
    outputSchema: {
      type: 'object',
      required: ['endpoints', 'artifacts'],
      properties: {
        endpoints: { type: 'array' },
        apiCodePath: { type: 'string' },
        documentation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'intent', 'api']
}));
