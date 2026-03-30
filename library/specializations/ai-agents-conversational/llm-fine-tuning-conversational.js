/**
 * @process specializations/ai-agents-conversational/llm-fine-tuning-conversational
 * @description LLM Fine-Tuning for Conversational AI - Process for fine-tuning language models for
 * conversational applications including data preparation, training pipelines, and model evaluation.
 * @inputs { modelName?: string, baseModel?: string, trainingData?: object, outputDir?: string }
 * @outputs { success: boolean, fineTunedModel: object, trainingMetrics: object, evaluationResults: object, deploymentConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/llm-fine-tuning-conversational', {
 *   modelName: 'customer-support-llm',
 *   baseModel: 'llama-3-8b',
 *   trainingData: { conversationsPath: './data/conversations' }
 * });
 *
 * @references
 * - OpenAI Fine-Tuning: https://platform.openai.com/docs/guides/fine-tuning
 * - LoRA: https://huggingface.co/docs/peft/main/en/conceptual_guides/lora
 * - Axolotl: https://github.com/OpenAccess-AI-Collective/axolotl
 * - Unsloth: https://github.com/unslothai/unsloth
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    modelName = 'fine-tuned-conversational',
    baseModel = 'llama-3-8b',
    trainingData = {},
    outputDir = 'fine-tuning-output',
    useLoRA = true,
    quantization = '4bit'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting LLM Fine-Tuning for ${modelName}`);

  // ============================================================================
  // PHASE 1: DATA PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Preparing training data');

  const dataPreparation = await ctx.task(dataPreparationTask, {
    modelName,
    trainingData,
    outputDir
  });

  artifacts.push(...dataPreparation.artifacts);

  // ============================================================================
  // PHASE 2: DATA QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Validating data quality');

  const dataValidation = await ctx.task(dataValidationTask, {
    modelName,
    preparedData: dataPreparation.data,
    outputDir
  });

  artifacts.push(...dataValidation.artifacts);

  // ============================================================================
  // PHASE 3: TRAINING CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring training');

  const trainingConfig = await ctx.task(trainingConfigurationTask, {
    modelName,
    baseModel,
    useLoRA,
    quantization,
    dataStats: dataPreparation.stats,
    outputDir
  });

  artifacts.push(...trainingConfig.artifacts);

  // ============================================================================
  // PHASE 4: MODEL TRAINING
  // ============================================================================

  ctx.log('info', 'Phase 4: Training model');

  const training = await ctx.task(modelTrainingTask, {
    modelName,
    baseModel,
    trainingConfig: trainingConfig.config,
    trainingDataPath: dataPreparation.dataPath,
    outputDir
  });

  artifacts.push(...training.artifacts);

  // ============================================================================
  // PHASE 5: MODEL EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Evaluating model');

  const evaluation = await ctx.task(modelEvaluationTask, {
    modelName,
    trainedModelPath: training.modelPath,
    evaluationData: dataPreparation.evalData,
    outputDir
  });

  artifacts.push(...evaluation.artifacts);

  // ============================================================================
  // PHASE 6: MODEL MERGING AND EXPORT
  // ============================================================================

  ctx.log('info', 'Phase 6: Merging and exporting model');

  const modelExport = await ctx.task(modelMergingTask, {
    modelName,
    baseModel,
    adapterPath: training.adapterPath,
    useLoRA,
    outputDir
  });

  artifacts.push(...modelExport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Fine-tuning ${modelName} complete. Evaluation score: ${evaluation.results.overallScore}. Review trained model?`,
    title: 'Fine-Tuning Review',
    context: {
      runId: ctx.runId,
      summary: {
        modelName,
        baseModel,
        useLoRA,
        trainingLoss: training.metrics.finalLoss,
        evaluationScore: evaluation.results.overallScore
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    modelName,
    fineTunedModel: {
      path: modelExport.modelPath,
      baseModel,
      useLoRA,
      quantization
    },
    trainingMetrics: training.metrics,
    evaluationResults: evaluation.results,
    deploymentConfig: modelExport.deploymentConfig,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/llm-fine-tuning-conversational',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const dataPreparationTask = defineTask('data-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prepare Training Data - ${args.modelName}`,
  agent: {
    name: 'fine-tuning-specialist',  // AG-DOM-003: Manages LLM fine-tuning pipelines
    prompt: {
      role: 'Fine-Tuning Data Preparer',
      task: 'Prepare training data for fine-tuning',
      context: args,
      instructions: [
        '1. Load conversation data',
        '2. Format to training format',
        '3. Create train/eval splits',
        '4. Tokenize and validate',
        '5. Remove duplicates',
        '6. Balance dataset',
        '7. Calculate statistics',
        '8. Save prepared data'
      ],
      outputFormat: 'JSON with prepared data'
    },
    outputSchema: {
      type: 'object',
      required: ['data', 'dataPath', 'artifacts'],
      properties: {
        data: { type: 'object' },
        dataPath: { type: 'string' },
        evalData: { type: 'object' },
        stats: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fine-tuning', 'data']
}));

export const dataValidationTask = defineTask('data-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Data Quality - ${args.modelName}`,
  agent: {
    name: 'data-validator',
    prompt: {
      role: 'Data Quality Validator',
      task: 'Validate training data quality',
      context: args,
      instructions: [
        '1. Check data format',
        '2. Validate token lengths',
        '3. Check for quality issues',
        '4. Identify problematic samples',
        '5. Validate label consistency',
        '6. Check for PII',
        '7. Generate quality report',
        '8. Save validation results'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['isValid', 'artifacts'],
      properties: {
        isValid: { type: 'boolean' },
        issues: { type: 'array' },
        qualityScore: { type: 'number' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fine-tuning', 'validation']
}));

export const trainingConfigurationTask = defineTask('training-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Training - ${args.modelName}`,
  agent: {
    name: 'training-configurator',
    prompt: {
      role: 'Training Configuration Expert',
      task: 'Configure fine-tuning hyperparameters',
      context: args,
      instructions: [
        '1. Select LoRA/full fine-tune',
        '2. Configure learning rate',
        '3. Set batch size',
        '4. Configure gradient accumulation',
        '5. Set epochs and warmup',
        '6. Configure quantization',
        '7. Setup checkpointing',
        '8. Save training config'
      ],
      outputFormat: 'JSON with training configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        configPath: { type: 'string' },
        estimatedTime: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fine-tuning', 'config']
}));

export const modelTrainingTask = defineTask('model-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `Train Model - ${args.modelName}`,
  agent: {
    name: 'model-trainer',
    prompt: {
      role: 'Model Trainer',
      task: 'Execute model fine-tuning',
      context: args,
      instructions: [
        '1. Load base model',
        '2. Apply LoRA adapters if enabled',
        '3. Load training data',
        '4. Start training loop',
        '5. Monitor metrics',
        '6. Save checkpoints',
        '7. Handle early stopping',
        '8. Save trained model'
      ],
      outputFormat: 'JSON with training results'
    },
    outputSchema: {
      type: 'object',
      required: ['modelPath', 'metrics', 'artifacts'],
      properties: {
        modelPath: { type: 'string' },
        adapterPath: { type: 'string' },
        metrics: {
          type: 'object',
          properties: {
            finalLoss: { type: 'number' },
            epochs: { type: 'number' }
          }
        },
        trainingLogPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fine-tuning', 'training']
}));

export const modelEvaluationTask = defineTask('model-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate Model - ${args.modelName}`,
  agent: {
    name: 'model-evaluator',
    prompt: {
      role: 'Model Evaluator',
      task: 'Evaluate fine-tuned model',
      context: args,
      instructions: [
        '1. Load fine-tuned model',
        '2. Run on evaluation set',
        '3. Calculate perplexity',
        '4. Run conversational tests',
        '5. Compare to baseline',
        '6. Check for regressions',
        '7. Generate evaluation report',
        '8. Save evaluation results'
      ],
      outputFormat: 'JSON with evaluation results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            overallScore: { type: 'number' },
            perplexity: { type: 'number' },
            conversationalQuality: { type: 'number' }
          }
        },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fine-tuning', 'evaluation']
}));

export const modelMergingTask = defineTask('model-merging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Merge and Export Model - ${args.modelName}`,
  agent: {
    name: 'model-exporter',
    prompt: {
      role: 'Model Export Specialist',
      task: 'Merge adapters and export model',
      context: args,
      instructions: [
        '1. Merge LoRA adapters if used',
        '2. Export to GGUF/safetensors',
        '3. Quantize for deployment',
        '4. Create model card',
        '5. Setup inference config',
        '6. Test exported model',
        '7. Create deployment config',
        '8. Save exported model'
      ],
      outputFormat: 'JSON with exported model'
    },
    outputSchema: {
      type: 'object',
      required: ['modelPath', 'deploymentConfig', 'artifacts'],
      properties: {
        modelPath: { type: 'string' },
        deploymentConfig: { type: 'object' },
        modelCardPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fine-tuning', 'export']
}));
