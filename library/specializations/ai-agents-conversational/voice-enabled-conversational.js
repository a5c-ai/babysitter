/**
 * @process specializations/ai-agents-conversational/voice-enabled-conversational
 * @description Voice-Enabled Conversational AI - Process for building voice-enabled conversational systems
 * including speech-to-text, text-to-speech, real-time voice processing, and voice UX design.
 * @inputs { systemName?: string, voiceProviders?: array, languages?: array, outputDir?: string }
 * @outputs { success: boolean, sttConfig: object, ttsConfig: object, voicePipeline: object, voiceUX: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/voice-enabled-conversational', {
 *   systemName: 'voice-assistant',
 *   voiceProviders: ['deepgram', 'elevenlabs'],
 *   languages: ['en-US', 'es-ES']
 * });
 *
 * @references
 * - Deepgram: https://developers.deepgram.com/docs
 * - ElevenLabs: https://docs.elevenlabs.io/
 * - OpenAI Whisper: https://platform.openai.com/docs/guides/speech-to-text
 * - LiveKit: https://docs.livekit.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName = 'voice-conversational',
    voiceProviders = ['deepgram', 'elevenlabs'],
    languages = ['en-US'],
    outputDir = 'voice-enabled-output',
    enableRealTime = true,
    enableVoiceCloning = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Voice-Enabled Conversational AI for ${systemName}`);

  // ============================================================================
  // PHASE 1: SPEECH-TO-TEXT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up speech-to-text');

  const sttSetup = await ctx.task(speechToTextTask, {
    systemName,
    voiceProviders,
    languages,
    enableRealTime,
    outputDir
  });

  artifacts.push(...sttSetup.artifacts);

  // ============================================================================
  // PHASE 2: TEXT-TO-SPEECH SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up text-to-speech');

  const ttsSetup = await ctx.task(textToSpeechTask, {
    systemName,
    voiceProviders,
    languages,
    enableVoiceCloning,
    outputDir
  });

  artifacts.push(...ttsSetup.artifacts);

  // ============================================================================
  // PHASE 3: VOICE PIPELINE INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Integrating voice pipeline');

  const voicePipeline = await ctx.task(voicePipelineTask, {
    systemName,
    sttConfig: sttSetup.config,
    ttsConfig: ttsSetup.config,
    enableRealTime,
    outputDir
  });

  artifacts.push(...voicePipeline.artifacts);

  // ============================================================================
  // PHASE 4: REAL-TIME PROCESSING
  // ============================================================================

  let realTimeProcessing = null;
  if (enableRealTime) {
    ctx.log('info', 'Phase 4: Setting up real-time processing');

    realTimeProcessing = await ctx.task(realTimeProcessingTask, {
      systemName,
      outputDir
    });

    artifacts.push(...realTimeProcessing.artifacts);
  }

  // ============================================================================
  // PHASE 5: VOICE UX DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing voice UX');

  const voiceUX = await ctx.task(voiceUXDesignTask, {
    systemName,
    languages,
    outputDir
  });

  artifacts.push(...voiceUX.artifacts);

  // ============================================================================
  // PHASE 6: VOICE QUALITY TESTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Testing voice quality');

  const voiceQuality = await ctx.task(voiceQualityTestingTask, {
    systemName,
    sttConfig: sttSetup.config,
    ttsConfig: ttsSetup.config,
    languages,
    outputDir
  });

  artifacts.push(...voiceQuality.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Voice-enabled system ${systemName} complete. Languages: ${languages.join(', ')}, Real-time: ${enableRealTime}. Review voice setup?`,
    title: 'Voice System Review',
    context: {
      runId: ctx.runId,
      summary: {
        systemName,
        voiceProviders,
        languages,
        enableRealTime,
        enableVoiceCloning,
        qualityScore: voiceQuality.score
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'python' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    sttConfig: sttSetup.config,
    ttsConfig: ttsSetup.config,
    voicePipeline: voicePipeline.pipeline,
    voiceUX: voiceUX.design,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/voice-enabled-conversational',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const speechToTextTask = defineTask('speech-to-text', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Speech-to-Text - ${args.systemName}`,
  agent: {
    name: 'voice-ai-specialist',  // AG-DOM-001: Integrates ASR/TTS for voice-enabled agents
    prompt: {
      role: 'Speech-to-Text Developer',
      task: 'Setup speech-to-text processing',
      context: args,
      instructions: [
        '1. Configure STT provider',
        '2. Setup language models',
        '3. Implement streaming transcription',
        '4. Add punctuation and formatting',
        '5. Handle disfluencies',
        '6. Configure word-level timestamps',
        '7. Add speaker diarization',
        '8. Save STT configuration'
      ],
      outputFormat: 'JSON with STT configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        sttCodePath: { type: 'string' },
        supportedLanguages: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'voice', 'stt']
}));

export const textToSpeechTask = defineTask('text-to-speech', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Text-to-Speech - ${args.systemName}`,
  agent: {
    name: 'tts-developer',
    prompt: {
      role: 'Text-to-Speech Developer',
      task: 'Setup text-to-speech synthesis',
      context: args,
      instructions: [
        '1. Configure TTS provider',
        '2. Select voice models',
        '3. Implement streaming synthesis',
        '4. Add SSML support',
        '5. Configure prosody controls',
        '6. Setup voice cloning if enabled',
        '7. Add audio post-processing',
        '8. Save TTS configuration'
      ],
      outputFormat: 'JSON with TTS configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        ttsCodePath: { type: 'string' },
        availableVoices: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'voice', 'tts']
}));

export const voicePipelineTask = defineTask('voice-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integrate Voice Pipeline - ${args.systemName}`,
  agent: {
    name: 'pipeline-developer',
    prompt: {
      role: 'Voice Pipeline Developer',
      task: 'Integrate end-to-end voice pipeline',
      context: args,
      instructions: [
        '1. Connect STT to LLM',
        '2. Connect LLM to TTS',
        '3. Implement turn-taking',
        '4. Handle interruptions',
        '5. Add echo cancellation',
        '6. Optimize latency',
        '7. Add fallback handling',
        '8. Save pipeline configuration'
      ],
      outputFormat: 'JSON with voice pipeline'
    },
    outputSchema: {
      type: 'object',
      required: ['pipeline', 'artifacts'],
      properties: {
        pipeline: { type: 'object' },
        pipelineCodePath: { type: 'string' },
        latencyMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'voice', 'pipeline']
}));

export const realTimeProcessingTask = defineTask('real-time-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Real-Time Processing - ${args.systemName}`,
  agent: {
    name: 'realtime-developer',
    prompt: {
      role: 'Real-Time Developer',
      task: 'Setup real-time voice processing',
      context: args,
      instructions: [
        '1. Setup WebSocket connections',
        '2. Implement audio streaming',
        '3. Configure LiveKit/WebRTC',
        '4. Optimize buffer sizes',
        '5. Handle network jitter',
        '6. Add reconnection logic',
        '7. Monitor latency',
        '8. Save real-time config'
      ],
      outputFormat: 'JSON with real-time configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        realTimeCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'voice', 'realtime']
}));

export const voiceUXDesignTask = defineTask('voice-ux-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Voice UX - ${args.systemName}`,
  agent: {
    name: 'voice-ux-designer',
    prompt: {
      role: 'Voice UX Designer',
      task: 'Design voice user experience',
      context: args,
      instructions: [
        '1. Design conversation flows',
        '2. Create voice prompts',
        '3. Design error handling',
        '4. Add confirmation patterns',
        '5. Design wake word handling',
        '6. Create voice personality',
        '7. Add accessibility features',
        '8. Save voice UX design'
      ],
      outputFormat: 'JSON with voice UX design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        voicePromptsPath: { type: 'string' },
        conversationFlows: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'voice', 'ux']
}));

export const voiceQualityTestingTask = defineTask('voice-quality-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Voice Quality - ${args.systemName}`,
  agent: {
    name: 'quality-tester',
    prompt: {
      role: 'Voice Quality Tester',
      task: 'Test voice system quality',
      context: args,
      instructions: [
        '1. Test STT accuracy',
        '2. Evaluate TTS naturalness',
        '3. Measure end-to-end latency',
        '4. Test with accents/dialects',
        '5. Test in noisy conditions',
        '6. Evaluate turn-taking',
        '7. Generate quality report',
        '8. Save test results'
      ],
      outputFormat: 'JSON with quality results'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'artifacts'],
      properties: {
        score: { type: 'number' },
        sttAccuracy: { type: 'number' },
        ttsNaturalness: { type: 'number' },
        latencyP95: { type: 'number' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'voice', 'quality']
}));
