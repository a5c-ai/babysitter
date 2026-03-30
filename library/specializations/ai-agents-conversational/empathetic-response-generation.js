/**
 * @process specializations/ai-agents-conversational/empathetic-response-generation
 * @description Empathetic Response Generation - Process for implementing empathetic response capabilities
 * in conversational AI including emotion detection, sentiment analysis, and contextual empathy.
 * @inputs { systemName?: string, emotionModel?: string, empathyLevel?: string, outputDir?: string }
 * @outputs { success: boolean, emotionDetection: object, empathyEngine: object, responseStrategies: array, evaluationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/empathetic-response-generation', {
 *   systemName: 'supportive-assistant',
 *   emotionModel: 'goemotion',
 *   empathyLevel: 'high'
 * });
 *
 * @references
 * - GoEmotions: https://arxiv.org/abs/2005.00547
 * - EmpatheticDialogues: https://arxiv.org/abs/1811.00207
 * - Emotion Recognition: https://huggingface.co/models?search=emotion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName = 'empathetic-response',
    emotionModel = 'goemotion',
    empathyLevel = 'moderate',
    outputDir = 'empathetic-response-output',
    enableContextualEmpathy = true,
    enableEmotionTracking = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Empathetic Response Generation for ${systemName}`);

  // ============================================================================
  // PHASE 1: EMOTION DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up emotion detection');

  const emotionDetection = await ctx.task(emotionDetectionTask, {
    systemName,
    emotionModel,
    outputDir
  });

  artifacts.push(...emotionDetection.artifacts);

  // ============================================================================
  // PHASE 2: SENTIMENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing sentiment analysis');

  const sentimentAnalysis = await ctx.task(sentimentAnalysisTask, {
    systemName,
    outputDir
  });

  artifacts.push(...sentimentAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: EMPATHY ENGINE
  // ============================================================================

  ctx.log('info', 'Phase 3: Building empathy engine');

  const empathyEngine = await ctx.task(empathyEngineTask, {
    systemName,
    emotionDetection: emotionDetection.config,
    sentimentAnalysis: sentimentAnalysis.config,
    empathyLevel,
    outputDir
  });

  artifacts.push(...empathyEngine.artifacts);

  // ============================================================================
  // PHASE 4: RESPONSE STRATEGIES
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating response strategies');

  const responseStrategies = await ctx.task(responseStrategiesTask, {
    systemName,
    empathyLevel,
    outputDir
  });

  artifacts.push(...responseStrategies.artifacts);

  // ============================================================================
  // PHASE 5: CONTEXTUAL EMPATHY
  // ============================================================================

  let contextualEmpathy = null;
  if (enableContextualEmpathy) {
    ctx.log('info', 'Phase 5: Implementing contextual empathy');

    contextualEmpathy = await ctx.task(contextualEmpathyTask, {
      systemName,
      empathyEngine: empathyEngine.engine,
      outputDir
    });

    artifacts.push(...contextualEmpathy.artifacts);
  }

  // ============================================================================
  // PHASE 6: EMOTION TRACKING
  // ============================================================================

  let emotionTracking = null;
  if (enableEmotionTracking) {
    ctx.log('info', 'Phase 6: Setting up emotion tracking');

    emotionTracking = await ctx.task(emotionTrackingTask, {
      systemName,
      emotionDetection: emotionDetection.config,
      outputDir
    });

    artifacts.push(...emotionTracking.artifacts);
  }

  // ============================================================================
  // PHASE 7: EMPATHY EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Evaluating empathy quality');

  const empathyEvaluation = await ctx.task(empathyEvaluationTask, {
    systemName,
    empathyEngine: empathyEngine.engine,
    responseStrategies: responseStrategies.strategies,
    outputDir
  });

  artifacts.push(...empathyEvaluation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Empathetic response system ${systemName} complete. Empathy score: ${empathyEvaluation.results.empathyScore}. Review implementation?`,
    title: 'Empathetic Response Review',
    context: {
      runId: ctx.runId,
      summary: {
        systemName,
        emotionModel,
        empathyLevel,
        empathyScore: empathyEvaluation.results.empathyScore
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'python' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    emotionDetection: emotionDetection.config,
    empathyEngine: empathyEngine.engine,
    responseStrategies: responseStrategies.strategies,
    evaluationResults: empathyEvaluation.results,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/empathetic-response-generation',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const emotionDetectionTask = defineTask('emotion-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Emotion Detection - ${args.systemName}`,
  agent: {
    name: 'persona-designer',  // AG-CAI-005: Creates chatbot personas and brand voice guidelines
    prompt: {
      role: 'Emotion Detection Developer',
      task: 'Setup emotion detection system',
      context: args,
      instructions: [
        '1. Select emotion model',
        '2. Configure emotion categories',
        '3. Implement detection pipeline',
        '4. Add intensity scoring',
        '5. Handle mixed emotions',
        '6. Add confidence thresholds',
        '7. Test detection accuracy',
        '8. Save emotion detection config'
      ],
      outputFormat: 'JSON with emotion detection'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        emotionCategories: { type: 'array' },
        detectionCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'empathy', 'emotion']
}));

export const sentimentAnalysisTask = defineTask('sentiment-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Sentiment Analysis - ${args.systemName}`,
  agent: {
    name: 'sentiment-developer',
    prompt: {
      role: 'Sentiment Analysis Developer',
      task: 'Implement sentiment analysis',
      context: args,
      instructions: [
        '1. Configure sentiment model',
        '2. Implement polarity detection',
        '3. Add aspect-based sentiment',
        '4. Track sentiment changes',
        '5. Add subjectivity detection',
        '6. Handle sarcasm/irony',
        '7. Test accuracy',
        '8. Save sentiment config'
      ],
      outputFormat: 'JSON with sentiment analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        sentimentCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'empathy', 'sentiment']
}));

export const empathyEngineTask = defineTask('empathy-engine', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Empathy Engine - ${args.systemName}`,
  agent: {
    name: 'empathy-developer',
    prompt: {
      role: 'Empathy Engine Developer',
      task: 'Build empathy processing engine',
      context: args,
      instructions: [
        '1. Integrate emotion detection',
        '2. Add empathy reasoning',
        '3. Implement response modulation',
        '4. Add validation logic',
        '5. Create empathy templates',
        '6. Implement acknowledgment patterns',
        '7. Add support escalation',
        '8. Save empathy engine'
      ],
      outputFormat: 'JSON with empathy engine'
    },
    outputSchema: {
      type: 'object',
      required: ['engine', 'artifacts'],
      properties: {
        engine: { type: 'object' },
        empathyCodePath: { type: 'string' },
        templates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'empathy', 'engine']
}));

export const responseStrategiesTask = defineTask('response-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Response Strategies - ${args.systemName}`,
  agent: {
    name: 'strategy-developer',
    prompt: {
      role: 'Response Strategy Developer',
      task: 'Create empathetic response strategies',
      context: args,
      instructions: [
        '1. Define strategy types',
        '2. Create acknowledgment strategies',
        '3. Add validation strategies',
        '4. Create reframing strategies',
        '5. Add support strategies',
        '6. Define escalation triggers',
        '7. Create strategy selector',
        '8. Save response strategies'
      ],
      outputFormat: 'JSON with response strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: { type: 'array' },
        strategyCodePath: { type: 'string' },
        selector: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'empathy', 'strategies']
}));

export const contextualEmpathyTask = defineTask('contextual-empathy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Contextual Empathy - ${args.systemName}`,
  agent: {
    name: 'context-developer',
    prompt: {
      role: 'Contextual Empathy Developer',
      task: 'Implement context-aware empathy',
      context: args,
      instructions: [
        '1. Track conversation context',
        '2. Build user emotional profile',
        '3. Adapt empathy to context',
        '4. Handle topic sensitivity',
        '5. Add memory of user state',
        '6. Implement progressive empathy',
        '7. Add context switching',
        '8. Save contextual empathy'
      ],
      outputFormat: 'JSON with contextual empathy'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        contextCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'empathy', 'context']
}));

export const emotionTrackingTask = defineTask('emotion-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Emotion Tracking - ${args.systemName}`,
  agent: {
    name: 'tracking-developer',
    prompt: {
      role: 'Emotion Tracking Developer',
      task: 'Setup emotion tracking over conversations',
      context: args,
      instructions: [
        '1. Track emotions per turn',
        '2. Build emotion timeline',
        '3. Detect emotional shifts',
        '4. Track effectiveness',
        '5. Add analytics',
        '6. Create emotion dashboard',
        '7. Add alerts for concerns',
        '8. Save tracking config'
      ],
      outputFormat: 'JSON with emotion tracking'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        trackingCodePath: { type: 'string' },
        dashboardConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'empathy', 'tracking']
}));

export const empathyEvaluationTask = defineTask('empathy-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate Empathy - ${args.systemName}`,
  agent: {
    name: 'empathy-evaluator',
    prompt: {
      role: 'Empathy Evaluation Specialist',
      task: 'Evaluate empathetic response quality',
      context: args,
      instructions: [
        '1. Create evaluation dataset',
        '2. Run empathy tests',
        '3. Evaluate appropriateness',
        '4. Check naturalness',
        '5. Test edge cases',
        '6. Calculate empathy scores',
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
            empathyScore: { type: 'number' },
            appropriatenessScore: { type: 'number' },
            naturalnessScore: { type: 'number' }
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
  labels: ['agent', 'empathy', 'evaluation']
}));
