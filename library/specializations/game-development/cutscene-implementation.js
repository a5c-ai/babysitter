/**
 * @process specializations/game-development/cutscene-implementation
 * @description Cutscene Implementation Process - Create and integrate cinematics including in-engine cutscenes,
 * pre-rendered videos, camera systems, sequencer tools, and interactive narrative sequences.
 * @inputs { projectName: string, cutsceneType?: string, cutsceneList?: array, outputDir?: string }
 * @outputs { success: boolean, cutscenes: array, cinematicDoc: string, testResults: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    cutsceneType = 'in-engine',
    cutsceneList = [],
    interactiveSequences = false,
    engine = 'Unity',
    outputDir = 'cutscene-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Cutscene Implementation: ${projectName}`);

  // Phase 1: Cutscene System Setup
  const systemSetup = await ctx.task(cutsceneSystemTask, { projectName, cutsceneType, engine, outputDir });
  artifacts.push(...systemSetup.artifacts);

  // Phase 2: Camera System
  const cameraSystem = await ctx.task(cinematicCameraTask, { projectName, systemSetup, outputDir });
  artifacts.push(...cameraSystem.artifacts);

  // Phase 3: Sequencer Setup
  const sequencer = await ctx.task(sequencerSetupTask, { projectName, engine, outputDir });
  artifacts.push(...sequencer.artifacts);

  // Phase 4: Cutscene Creation
  const cutsceneCreation = await ctx.task(cutsceneCreationTask, { projectName, cutsceneList, sequencer, outputDir });
  artifacts.push(...cutsceneCreation.artifacts);

  // Phase 5: Interactive Sequences (if applicable)
  if (interactiveSequences) {
    const interactive = await ctx.task(interactiveSequencesTask, { projectName, outputDir });
    artifacts.push(...interactive.artifacts);
  }

  // Phase 6: Cutscene Integration
  const integration = await ctx.task(cutsceneIntegrationTask, { projectName, cutsceneCreation, outputDir });
  artifacts.push(...integration.artifacts);

  // Phase 7: Cutscene Testing
  const testing = await ctx.task(cutsceneTestingTask, { projectName, cutsceneCreation, outputDir });
  artifacts.push(...testing.artifacts);

  await ctx.breakpoint({
    question: `Cutscene implementation complete for ${projectName}. ${cutsceneCreation.cutsceneCount} cutscenes. Total duration: ${cutsceneCreation.totalDuration}. Review?`,
    title: 'Cutscene Implementation Review',
    context: { runId: ctx.runId, cutsceneCreation, testing }
  });

  return {
    success: true,
    projectName,
    cutscenes: cutsceneCreation.cutscenes,
    cinematicDoc: systemSetup.docPath,
    testResults: { passRate: testing.passRate, issues: testing.issues },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/cutscene-implementation', timestamp: startTime, outputDir }
  };
}

export const cutsceneSystemTask = defineTask('cutscene-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cutscene System - ${args.projectName}`,
  agent: {
    name: 'animator-agent',
    prompt: { role: 'Cinematic Designer', task: 'Set up cutscene system', context: args, instructions: ['1. Design cutscene architecture', '2. Set up skip and pause', '3. Create transition system', '4. Document system'] },
    outputSchema: { type: 'object', required: ['docPath', 'system', 'artifacts'], properties: { docPath: { type: 'string' }, system: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'cutscenes', 'system']
}));

export const cinematicCameraTask = defineTask('cinematic-camera', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cinematic Camera - ${args.projectName}`,
  agent: {
    name: 'animator-agent',
    prompt: { role: 'Cinematic Designer', task: 'Set up cinematic cameras', context: args, instructions: ['1. Create camera rigs', '2. Set up dolly and crane', '3. Add camera shake', '4. Create transitions'] },
    outputSchema: { type: 'object', required: ['cameraRigs', 'artifacts'], properties: { cameraRigs: { type: 'array' }, transitions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'cutscenes', 'camera']
}));

export const sequencerSetupTask = defineTask('sequencer-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sequencer Setup - ${args.projectName}`,
  agent: {
    name: 'tools-programmer-agent',
    prompt: { role: 'Tools Programmer', task: 'Set up sequencer tools', context: args, instructions: ['1. Configure timeline', '2. Add animation tracks', '3. Add audio tracks', '4. Create templates'] },
    outputSchema: { type: 'object', required: ['sequencerReady', 'trackTypes', 'artifacts'], properties: { sequencerReady: { type: 'boolean' }, trackTypes: { type: 'array' }, templates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'cutscenes', 'sequencer']
}));

export const cutsceneCreationTask = defineTask('cutscene-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cutscene Creation - ${args.projectName}`,
  agent: {
    name: 'animator-agent',
    prompt: { role: 'Cinematic Designer', task: 'Create cutscenes', context: args, instructions: ['1. Block out scenes', '2. Direct performances', '3. Add camera work', '4. Sync audio'] },
    outputSchema: { type: 'object', required: ['cutscenes', 'cutsceneCount', 'totalDuration', 'artifacts'], properties: { cutscenes: { type: 'array' }, cutsceneCount: { type: 'number' }, totalDuration: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'cutscenes', 'creation']
}));

export const interactiveSequencesTask = defineTask('interactive-sequences', (args, taskCtx) => ({
  kind: 'agent',
  title: `Interactive Sequences - ${args.projectName}`,
  agent: {
    name: 'animator-agent',
    prompt: { role: 'Cinematic Designer', task: 'Create interactive sequences', context: args, instructions: ['1. Design QTE sequences', '2. Add player choices', '3. Create branching paths', '4. Test interactions'] },
    outputSchema: { type: 'object', required: ['sequences', 'artifacts'], properties: { sequences: { type: 'array' }, qteCount: { type: 'number' }, branchPoints: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'cutscenes', 'interactive']
}));

export const cutsceneIntegrationTask = defineTask('cutscene-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cutscene Integration - ${args.projectName}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Gameplay Programmer', task: 'Integrate cutscenes', context: args, instructions: ['1. Add trigger points', '2. Handle game state', '3. Connect to progression', '4. Test transitions'] },
    outputSchema: { type: 'object', required: ['integrated', 'triggerPoints', 'artifacts'], properties: { integrated: { type: 'boolean' }, triggerPoints: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'cutscenes', 'integration']
}));

export const cutsceneTestingTask = defineTask('cutscene-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cutscene Testing - ${args.projectName}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Engineer', task: 'Test cutscenes', context: args, instructions: ['1. Test playback', '2. Test skip functionality', '3. Test triggers', '4. Check performance'] },
    outputSchema: { type: 'object', required: ['passRate', 'issues', 'artifacts'], properties: { passRate: { type: 'number' }, issues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'cutscenes', 'testing']
}));
