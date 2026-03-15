/**
 * @process specializations/ai-agents-conversational/multi-modal-agent
 * @description Multi-Modal Agent Development - Process for building agents that can process and generate
 * multiple modalities including text, images, audio, and video with unified reasoning capabilities.
 * @inputs { agentName?: string, modalities?: array, visionModels?: array, outputDir?: string }
 * @outputs { success: boolean, modalityHandlers: object, unifiedReasoning: object, multiModalPipeline: object, integrationTests: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/multi-modal-agent', {
 *   agentName: 'multi-modal-assistant',
 *   modalities: ['text', 'image', 'audio'],
 *   visionModels: ['gpt-4-vision', 'claude-3-vision']
 * });
 *
 * @references
 * - GPT-4 Vision: https://platform.openai.com/docs/guides/vision
 * - Claude Vision: https://docs.anthropic.com/claude/docs/vision
 * - Gemini Multi-Modal: https://ai.google.dev/docs/gemini_api_overview
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    agentName = 'multi-modal-agent',
    modalities = ['text', 'image'],
    visionModels = ['gpt-4-vision'],
    outputDir = 'multi-modal-output',
    enableVideoProcessing = false,
    enableRealTimeStreaming = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Multi-Modal Agent Development for ${agentName}`);

  // ============================================================================
  // PHASE 1: MODALITY HANDLERS
  // ============================================================================

  ctx.log('info', 'Phase 1: Implementing modality handlers');

  const modalityHandlers = await ctx.task(modalityHandlersTask, {
    agentName,
    modalities,
    outputDir
  });

  artifacts.push(...modalityHandlers.artifacts);

  // ============================================================================
  // PHASE 2: VISION PROCESSING
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up vision processing');

  const visionProcessing = await ctx.task(visionProcessingTask, {
    agentName,
    visionModels,
    outputDir
  });

  artifacts.push(...visionProcessing.artifacts);

  // ============================================================================
  // PHASE 3: AUDIO PROCESSING
  // ============================================================================

  let audioProcessing = null;
  if (modalities.includes('audio')) {
    ctx.log('info', 'Phase 3: Setting up audio processing');

    audioProcessing = await ctx.task(audioProcessingTask, {
      agentName,
      enableRealTimeStreaming,
      outputDir
    });

    artifacts.push(...audioProcessing.artifacts);
  }

  // ============================================================================
  // PHASE 4: VIDEO PROCESSING
  // ============================================================================

  let videoProcessing = null;
  if (enableVideoProcessing) {
    ctx.log('info', 'Phase 4: Setting up video processing');

    videoProcessing = await ctx.task(videoProcessingTask, {
      agentName,
      outputDir
    });

    artifacts.push(...videoProcessing.artifacts);
  }

  // ============================================================================
  // PHASE 5: UNIFIED REASONING
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing unified reasoning');

  const unifiedReasoning = await ctx.task(unifiedReasoningTask, {
    agentName,
    modalities,
    modalityHandlers: modalityHandlers.handlers,
    outputDir
  });

  artifacts.push(...unifiedReasoning.artifacts);

  // ============================================================================
  // PHASE 6: MULTI-MODAL PIPELINE
  // ============================================================================

  ctx.log('info', 'Phase 6: Building multi-modal pipeline');

  const multiModalPipeline = await ctx.task(multiModalPipelineTask, {
    agentName,
    modalities,
    visionProcessing: visionProcessing.config,
    audioProcessing: audioProcessing ? audioProcessing.config : null,
    videoProcessing: videoProcessing ? videoProcessing.config : null,
    unifiedReasoning: unifiedReasoning.config,
    outputDir
  });

  artifacts.push(...multiModalPipeline.artifacts);

  // ============================================================================
  // PHASE 7: INTEGRATION TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Running integration tests');

  const integrationTests = await ctx.task(multiModalTestingTask, {
    agentName,
    modalities,
    pipeline: multiModalPipeline.pipeline,
    outputDir
  });

  artifacts.push(...integrationTests.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Multi-modal agent ${agentName} complete. Modalities: ${modalities.join(', ')}. Review implementation?`,
    title: 'Multi-Modal Agent Review',
    context: {
      runId: ctx.runId,
      summary: {
        agentName,
        modalities,
        visionModels,
        enableVideoProcessing,
        testsPassed: integrationTests.passed
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'python' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    agentName,
    modalityHandlers: modalityHandlers.handlers,
    unifiedReasoning: unifiedReasoning.config,
    multiModalPipeline: multiModalPipeline.pipeline,
    integrationTests: integrationTests.results,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/multi-modal-agent',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const modalityHandlersTask = defineTask('modality-handlers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Modality Handlers - ${args.agentName}`,
  agent: {
    name: 'multimodal-agent-expert',  // AG-DOM-002: Builds vision-language agent capabilities
    prompt: {
      role: 'Modality Handler Developer',
      task: 'Implement handlers for each modality',
      context: args,
      instructions: [
        '1. Create text handler',
        '2. Create image handler',
        '3. Create audio handler if needed',
        '4. Create video handler if needed',
        '5. Implement preprocessing',
        '6. Add encoding/decoding',
        '7. Create unified interface',
        '8. Save modality handlers'
      ],
      outputFormat: 'JSON with modality handlers'
    },
    outputSchema: {
      type: 'object',
      required: ['handlers', 'artifacts'],
      properties: {
        handlers: { type: 'object' },
        handlersCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multi-modal', 'handlers']
}));

export const visionProcessingTask = defineTask('vision-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Vision Processing - ${args.agentName}`,
  agent: {
    name: 'vision-developer',
    prompt: {
      role: 'Vision Processing Developer',
      task: 'Setup image and vision processing',
      context: args,
      instructions: [
        '1. Configure vision models',
        '2. Implement image preprocessing',
        '3. Add image understanding',
        '4. Implement OCR if needed',
        '5. Add object detection',
        '6. Implement image generation',
        '7. Add quality filtering',
        '8. Save vision configuration'
      ],
      outputFormat: 'JSON with vision processing'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        visionCodePath: { type: 'string' },
        supportedFormats: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multi-modal', 'vision']
}));

export const audioProcessingTask = defineTask('audio-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Audio Processing - ${args.agentName}`,
  agent: {
    name: 'audio-developer',
    prompt: {
      role: 'Audio Processing Developer',
      task: 'Setup audio processing capabilities',
      context: args,
      instructions: [
        '1. Implement audio input',
        '2. Add speech recognition',
        '3. Implement audio understanding',
        '4. Add music/sound recognition',
        '5. Implement audio generation',
        '6. Add speech synthesis',
        '7. Handle streaming audio',
        '8. Save audio configuration'
      ],
      outputFormat: 'JSON with audio processing'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        audioCodePath: { type: 'string' },
        supportedFormats: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multi-modal', 'audio']
}));

export const videoProcessingTask = defineTask('video-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Video Processing - ${args.agentName}`,
  agent: {
    name: 'video-developer',
    prompt: {
      role: 'Video Processing Developer',
      task: 'Setup video processing capabilities',
      context: args,
      instructions: [
        '1. Implement video input',
        '2. Add frame extraction',
        '3. Implement video understanding',
        '4. Add temporal reasoning',
        '5. Implement action recognition',
        '6. Add video summarization',
        '7. Handle streaming video',
        '8. Save video configuration'
      ],
      outputFormat: 'JSON with video processing'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        videoCodePath: { type: 'string' },
        supportedFormats: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multi-modal', 'video']
}));

export const unifiedReasoningTask = defineTask('unified-reasoning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Unified Reasoning - ${args.agentName}`,
  agent: {
    name: 'reasoning-developer',
    prompt: {
      role: 'Unified Reasoning Developer',
      task: 'Implement unified multi-modal reasoning',
      context: args,
      instructions: [
        '1. Design reasoning architecture',
        '2. Implement cross-modal attention',
        '3. Add modality fusion',
        '4. Implement joint understanding',
        '5. Add reasoning chains',
        '6. Handle missing modalities',
        '7. Add explanation generation',
        '8. Save reasoning configuration'
      ],
      outputFormat: 'JSON with unified reasoning'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        reasoningCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multi-modal', 'reasoning']
}));

export const multiModalPipelineTask = defineTask('multi-modal-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Multi-Modal Pipeline - ${args.agentName}`,
  agent: {
    name: 'pipeline-developer',
    prompt: {
      role: 'Multi-Modal Pipeline Developer',
      task: 'Build end-to-end multi-modal pipeline',
      context: args,
      instructions: [
        '1. Integrate all modality handlers',
        '2. Connect to reasoning engine',
        '3. Implement routing logic',
        '4. Add error handling',
        '5. Optimize latency',
        '6. Add caching',
        '7. Implement fallbacks',
        '8. Save pipeline configuration'
      ],
      outputFormat: 'JSON with multi-modal pipeline'
    },
    outputSchema: {
      type: 'object',
      required: ['pipeline', 'artifacts'],
      properties: {
        pipeline: { type: 'object' },
        pipelineCodePath: { type: 'string' },
        architecture: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multi-modal', 'pipeline']
}));

export const multiModalTestingTask = defineTask('multi-modal-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Multi-Modal Agent - ${args.agentName}`,
  agent: {
    name: 'testing-developer',
    prompt: {
      role: 'Multi-Modal Testing Developer',
      task: 'Test multi-modal agent capabilities',
      context: args,
      instructions: [
        '1. Create test cases per modality',
        '2. Test cross-modal understanding',
        '3. Test modality combinations',
        '4. Validate reasoning quality',
        '5. Test edge cases',
        '6. Measure latency',
        '7. Generate test report',
        '8. Save test results'
      ],
      outputFormat: 'JSON with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'passed', 'artifacts'],
      properties: {
        results: { type: 'array' },
        passed: { type: 'boolean' },
        coverage: { type: 'object' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multi-modal', 'testing']
}));
