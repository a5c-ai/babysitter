/**
 * @process specializations/game-development/audio-design-integration
 * @description Audio Design and Integration Process - Design and integrate game audio including sound effects,
 * music composition, voice acting, audio mixing, spatial audio, and dynamic audio systems.
 * @inputs { projectName: string, audioStyle?: string, voiceActingRequired?: boolean, outputDir?: string }
 * @outputs { success: boolean, audioAssetList: array, mixDocument: string, integrationGuide: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/game-development/audio-design-integration', {
 *   projectName: 'Stellar Odyssey',
 *   audioStyle: 'orchestral-cinematic',
 *   voiceActingRequired: true
 * });
 *
 * @references
 * - A Composer's Guide to Game Music by Winifred Phillips
 * - Game Audio Implementation by Richard Stevens
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    audioStyle = 'cinematic',
    voiceActingRequired = false,
    spatialAudioRequired = true,
    dynamicMusicRequired = true,
    audioMiddleware = 'wwise',
    outputDir = 'audio-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Audio Design and Integration: ${projectName}`);

  // Phase 1: Audio Direction
  const audioDirection = await ctx.task(audioDirectionTask, {
    projectName, audioStyle, spatialAudioRequired, outputDir
  });
  artifacts.push(...audioDirection.artifacts);

  // Phase 2: Sound Design
  const soundDesign = await ctx.task(soundDesignTask, {
    projectName, audioDirection, outputDir
  });
  artifacts.push(...soundDesign.artifacts);

  // Phase 3: Music Composition
  const musicComposition = await ctx.task(musicCompositionTask, {
    projectName, audioDirection, dynamicMusicRequired, outputDir
  });
  artifacts.push(...musicComposition.artifacts);

  // Phase 4: Voice Acting (if required)
  let voiceActing = null;
  if (voiceActingRequired) {
    voiceActing = await ctx.task(voiceActingTask, {
      projectName, outputDir
    });
    artifacts.push(...voiceActing.artifacts);
  }

  // Phase 5: Audio Integration
  const audioIntegration = await ctx.task(audioIntegrationTask, {
    projectName, soundDesign, musicComposition, voiceActing, audioMiddleware, outputDir
  });
  artifacts.push(...audioIntegration.artifacts);

  // Phase 6: Spatial Audio Setup
  const spatialAudio = await ctx.task(spatialAudioTask, {
    projectName, spatialAudioRequired, audioMiddleware, outputDir
  });
  artifacts.push(...spatialAudio.artifacts);

  // Phase 7: Audio Mixing
  const audioMixing = await ctx.task(audioMixingTask, {
    projectName, soundDesign, musicComposition, voiceActing, outputDir
  });
  artifacts.push(...audioMixing.artifacts);

  await ctx.breakpoint({
    question: `Audio design and integration complete for ${projectName}. SFX: ${soundDesign.sfxCount}, Music tracks: ${musicComposition.trackCount}. Review audio mix?`,
    title: 'Audio Integration Review',
    context: { runId: ctx.runId, soundDesign, musicComposition, audioMixing }
  });

  return {
    success: true,
    projectName,
    audioAssetList: [...soundDesign.assets, ...musicComposition.tracks],
    mixDocument: audioMixing.mixDocPath,
    integrationGuide: audioIntegration.guidePath,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/audio-design-integration', timestamp: startTime, outputDir }
  };
}

export const audioDirectionTask = defineTask('audio-direction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audio Direction - ${args.projectName}`,
  agent: {
    name: 'audio-designer-agent',
    prompt: { role: 'Audio Director', task: 'Define audio direction', context: args, instructions: ['1. Define audio style and tone', '2. Create reference list', '3. Define technical requirements', '4. Create audio design document'] },
    outputSchema: { type: 'object', required: ['styleGuide', 'requirements', 'artifacts'], properties: { styleGuide: { type: 'object' }, requirements: { type: 'object' }, references: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'audio', 'direction']
}));

export const soundDesignTask = defineTask('sound-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sound Design - ${args.projectName}`,
  agent: {
    name: 'audio-designer-agent',
    prompt: { role: 'Sound Designer', task: 'Create sound effects', context: args, instructions: ['1. Design UI sounds', '2. Create gameplay SFX', '3. Design ambient sounds', '4. Create foley assets'] },
    outputSchema: { type: 'object', required: ['assets', 'sfxCount', 'artifacts'], properties: { assets: { type: 'array' }, sfxCount: { type: 'number' }, categories: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'audio', 'sound-design']
}));

export const musicCompositionTask = defineTask('music-composition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Music Composition - ${args.projectName}`,
  agent: {
    name: 'audio-designer-agent',
    prompt: { role: 'Composer', task: 'Compose game music', context: args, instructions: ['1. Compose main theme', '2. Create gameplay music', '3. Design adaptive music', '4. Create ambient tracks'] },
    outputSchema: { type: 'object', required: ['tracks', 'trackCount', 'artifacts'], properties: { tracks: { type: 'array' }, trackCount: { type: 'number' }, dynamicLayers: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'audio', 'music']
}));

export const voiceActingTask = defineTask('voice-acting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Voice Acting - ${args.projectName}`,
  agent: {
    name: 'audio-designer-agent',
    prompt: { role: 'VO Director', task: 'Direct voice acting', context: args, instructions: ['1. Cast voice actors', '2. Direct recording sessions', '3. Edit and process VO', '4. Organize VO assets'] },
    outputSchema: { type: 'object', required: ['voiceLines', 'characters', 'artifacts'], properties: { voiceLines: { type: 'number' }, characters: { type: 'array' }, totalMinutes: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'audio', 'voice-acting']
}));

export const audioIntegrationTask = defineTask('audio-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audio Integration - ${args.projectName}`,
  agent: {
    name: 'audio-programmer-agent',
    prompt: { role: 'Audio Programmer', task: 'Integrate audio into game', context: args, instructions: ['1. Set up audio middleware', '2. Implement audio triggers', '3. Create audio states', '4. Test integration'] },
    outputSchema: { type: 'object', required: ['integrated', 'guidePath', 'artifacts'], properties: { integrated: { type: 'boolean' }, guidePath: { type: 'string' }, audioEvents: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'audio', 'integration']
}));

export const spatialAudioTask = defineTask('spatial-audio', (args, taskCtx) => ({
  kind: 'agent',
  title: `Spatial Audio - ${args.projectName}`,
  agent: {
    name: 'audio-programmer-agent',
    prompt: { role: 'Audio Programmer', task: 'Implement spatial audio', context: args, instructions: ['1. Configure 3D audio', '2. Set up reverb zones', '3. Implement occlusion', '4. Test spatialization'] },
    outputSchema: { type: 'object', required: ['spatialSetup', 'artifacts'], properties: { spatialSetup: { type: 'object' }, reverbZones: { type: 'number' }, occlusionEnabled: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'audio', 'spatial-audio']
}));

export const audioMixingTask = defineTask('audio-mixing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audio Mixing - ${args.projectName}`,
  agent: {
    name: 'audio-programmer-agent',
    prompt: { role: 'Audio Engineer', task: 'Mix game audio', context: args, instructions: ['1. Balance audio levels', '2. Create mix buses', '3. Apply mastering', '4. Document mix settings'] },
    outputSchema: { type: 'object', required: ['mixDocPath', 'mixBuses', 'artifacts'], properties: { mixDocPath: { type: 'string' }, mixBuses: { type: 'array' }, masteringSettings: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'audio', 'mixing']
}));
