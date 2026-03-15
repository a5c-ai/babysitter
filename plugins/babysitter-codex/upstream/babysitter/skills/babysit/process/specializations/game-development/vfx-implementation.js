/**
 * @process specializations/game-development/vfx-implementation
 * @description Visual Effects Implementation Process - Create and integrate visual effects including particle systems,
 * shaders, post-processing, environmental effects, and performance optimization for visual effects.
 * @inputs { projectName: string, vfxStyle?: string, effectCategories?: array, outputDir?: string }
 * @outputs { success: boolean, vfxList: array, performanceReport: object, integrationDoc: string, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    vfxStyle = 'stylized',
    effectCategories = ['combat', 'environment', 'ui'],
    engine = 'Unity',
    performanceBudget = { particles: 5000, drawCalls: 100 },
    outputDir = 'vfx-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting VFX Implementation: ${projectName}`);

  // Phase 1: VFX Direction
  const direction = await ctx.task(vfxDirectionTask, { projectName, vfxStyle, effectCategories, outputDir });
  artifacts.push(...direction.artifacts);

  // Phase 2: Particle System Setup
  const particleSystems = await ctx.task(particleSystemsTask, { projectName, direction, engine, outputDir });
  artifacts.push(...particleSystems.artifacts);

  // Phase 3: Shader Development
  const shaders = await ctx.task(shaderDevelopmentTask, { projectName, direction, engine, outputDir });
  artifacts.push(...shaders.artifacts);

  // Phase 4: Combat Effects
  const combatEffects = await ctx.task(combatEffectsTask, { projectName, particleSystems, shaders, outputDir });
  artifacts.push(...combatEffects.artifacts);

  // Phase 5: Environmental Effects
  const envEffects = await ctx.task(environmentalEffectsTask, { projectName, particleSystems, shaders, outputDir });
  artifacts.push(...envEffects.artifacts);

  // Phase 6: Post-Processing
  const postProcessing = await ctx.task(postProcessingTask, { projectName, direction, outputDir });
  artifacts.push(...postProcessing.artifacts);

  // Phase 7: VFX Optimization
  const optimization = await ctx.task(vfxOptimizationTask, { projectName, performanceBudget, combatEffects, envEffects, outputDir });
  artifacts.push(...optimization.artifacts);

  await ctx.breakpoint({
    question: `VFX implementation complete for ${projectName}. ${combatEffects.effectCount + envEffects.effectCount} effects created. Performance: ${optimization.withinBudget ? 'Within budget' : 'Needs work'}. Review?`,
    title: 'VFX Implementation Review',
    context: { runId: ctx.runId, combatEffects, envEffects, optimization }
  });

  return {
    success: true,
    projectName,
    vfxList: [...combatEffects.effects, ...envEffects.effects],
    performanceReport: optimization.performanceReport,
    integrationDoc: direction.docPath,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/vfx-implementation', timestamp: startTime, outputDir }
  };
}

export const vfxDirectionTask = defineTask('vfx-direction', (args, taskCtx) => ({
  kind: 'agent',
  title: `VFX Direction - ${args.projectName}`,
  agent: {
    name: 'vfx-artist-agent',
    prompt: { role: 'VFX Lead', task: 'Define VFX direction', context: args, instructions: ['1. Define VFX style guide', '2. Create reference boards', '3. Define color language', '4. Plan effect library'] },
    outputSchema: { type: 'object', required: ['docPath', 'styleGuide', 'artifacts'], properties: { docPath: { type: 'string' }, styleGuide: { type: 'object' }, references: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'vfx', 'direction']
}));

export const particleSystemsTask = defineTask('particle-systems', (args, taskCtx) => ({
  kind: 'agent',
  title: `Particle Systems - ${args.projectName}`,
  agent: {
    name: 'vfx-artist-agent',
    prompt: { role: 'VFX Artist', task: 'Set up particle systems', context: args, instructions: ['1. Create base particle templates', '2. Build modular components', '3. Create spawning systems', '4. Optimize particle counts'] },
    outputSchema: { type: 'object', required: ['templates', 'modules', 'artifacts'], properties: { templates: { type: 'array' }, modules: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'vfx', 'particles']
}));

export const shaderDevelopmentTask = defineTask('shader-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Shader Development - ${args.projectName}`,
  agent: {
    name: 'shader-developer-agent',
    prompt: { role: 'Shader Programmer', task: 'Develop VFX shaders', context: args, instructions: ['1. Create dissolve shaders', '2. Build distortion effects', '3. Create glow shaders', '4. Optimize for performance'] },
    outputSchema: { type: 'object', required: ['shaders', 'artifacts'], properties: { shaders: { type: 'array' }, shaderCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'vfx', 'shaders']
}));

export const combatEffectsTask = defineTask('combat-effects', (args, taskCtx) => ({
  kind: 'agent',
  title: `Combat Effects - ${args.projectName}`,
  agent: {
    name: 'vfx-artist-agent',
    prompt: { role: 'VFX Artist', task: 'Create combat VFX', context: args, instructions: ['1. Create weapon effects', '2. Build impact effects', '3. Create spell/ability VFX', '4. Add hit reactions'] },
    outputSchema: { type: 'object', required: ['effects', 'effectCount', 'artifacts'], properties: { effects: { type: 'array' }, effectCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'vfx', 'combat']
}));

export const environmentalEffectsTask = defineTask('environmental-effects', (args, taskCtx) => ({
  kind: 'agent',
  title: `Environmental Effects - ${args.projectName}`,
  agent: {
    name: 'vfx-artist-agent',
    prompt: { role: 'VFX Artist', task: 'Create environmental VFX', context: args, instructions: ['1. Create weather effects', '2. Build ambient particles', '3. Create water effects', '4. Add atmospheric effects'] },
    outputSchema: { type: 'object', required: ['effects', 'effectCount', 'artifacts'], properties: { effects: { type: 'array' }, effectCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'vfx', 'environment']
}));

export const postProcessingTask = defineTask('post-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Post-Processing - ${args.projectName}`,
  agent: {
    name: 'vfx-artist-agent',
    prompt: { role: 'VFX Artist', task: 'Set up post-processing', context: args, instructions: ['1. Configure bloom and glow', '2. Set up color grading', '3. Add screen effects', '4. Create camera effects'] },
    outputSchema: { type: 'object', required: ['effects', 'profiles', 'artifacts'], properties: { effects: { type: 'array' }, profiles: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'vfx', 'post-processing']
}));

export const vfxOptimizationTask = defineTask('vfx-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `VFX Optimization - ${args.projectName}`,
  agent: {
    name: 'tech-artist-agent',
    prompt: { role: 'Tech Artist', task: 'Optimize VFX performance', context: args, instructions: ['1. Profile particle systems', '2. Optimize shaders', '3. Implement LOD for effects', '4. Reduce overdraw'] },
    outputSchema: { type: 'object', required: ['withinBudget', 'performanceReport', 'artifacts'], properties: { withinBudget: { type: 'boolean' }, performanceReport: { type: 'object' }, optimizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'vfx', 'optimization']
}));
