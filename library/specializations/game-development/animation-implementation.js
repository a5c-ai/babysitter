/**
 * @process specializations/game-development/animation-implementation
 * @description Animation System Implementation Process - Implement animation systems including state machines,
 * blend trees, IK systems, procedural animation, and animation optimization.
 * @inputs { projectName: string, animationType?: string, characterTypes?: array, outputDir?: string }
 * @outputs { success: boolean, animationSystems: array, animationList: array, documentation: string, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    animationType = '3d-skeletal',
    characterTypes = ['player', 'enemy', 'npc'],
    ikRequired = true,
    proceduralAnimRequired = false,
    outputDir = 'animation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Animation Implementation: ${projectName}`);

  // Phase 1: Animation System Architecture
  const architecture = await ctx.task(animArchitectureTask, { projectName, animationType, characterTypes, outputDir });
  artifacts.push(...architecture.artifacts);

  // Phase 2: State Machine Setup
  const stateMachines = await ctx.task(animStateMachineTask, { projectName, characterTypes, outputDir });
  artifacts.push(...stateMachines.artifacts);

  // Phase 3: Blend Tree Implementation
  const blendTrees = await ctx.task(blendTreeTask, { projectName, stateMachines, outputDir });
  artifacts.push(...blendTrees.artifacts);

  // Phase 4: IK Systems
  if (ikRequired) {
    const ikSystems = await ctx.task(ikSystemsTask, { projectName, characterTypes, outputDir });
    artifacts.push(...ikSystems.artifacts);
  }

  // Phase 5: Procedural Animation
  if (proceduralAnimRequired) {
    const procedural = await ctx.task(proceduralAnimTask, { projectName, outputDir });
    artifacts.push(...procedural.artifacts);
  }

  // Phase 6: Animation Integration
  const integration = await ctx.task(animIntegrationTask, { projectName, stateMachines, blendTrees, outputDir });
  artifacts.push(...integration.artifacts);

  // Phase 7: Animation Optimization
  const optimization = await ctx.task(animOptimizationTask, { projectName, integration, outputDir });
  artifacts.push(...optimization.artifacts);

  await ctx.breakpoint({
    question: `Animation implementation complete for ${projectName}. ${stateMachines.stateCount} animation states. ${blendTrees.treeCount} blend trees. Review?`,
    title: 'Animation Implementation Review',
    context: { runId: ctx.runId, stateMachines, blendTrees, optimization }
  });

  return {
    success: true,
    projectName,
    animationSystems: architecture.systems,
    animationList: integration.animations,
    documentation: architecture.docPath,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/animation-implementation', timestamp: startTime, outputDir }
  };
}

export const animArchitectureTask = defineTask('anim-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Animation Architecture - ${args.projectName}`,
  agent: {
    name: 'animator-agent',
    prompt: { role: 'Animation Programmer', task: 'Design animation architecture', context: args, instructions: ['1. Design animation system', '2. Define animation layers', '3. Plan state machine structure', '4. Document architecture'] },
    outputSchema: { type: 'object', required: ['systems', 'docPath', 'artifacts'], properties: { systems: { type: 'array' }, docPath: { type: 'string' }, layers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'animation', 'architecture']
}));

export const animStateMachineTask = defineTask('anim-state-machine', (args, taskCtx) => ({
  kind: 'agent',
  title: `State Machines - ${args.projectName}`,
  agent: {
    name: 'animator-agent',
    prompt: { role: 'Animation Programmer', task: 'Implement animation state machines', context: args, instructions: ['1. Create locomotion states', '2. Add combat states', '3. Create transitions', '4. Add conditional parameters'] },
    outputSchema: { type: 'object', required: ['stateCount', 'stateMachines', 'artifacts'], properties: { stateCount: { type: 'number' }, stateMachines: { type: 'array' }, transitions: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'animation', 'state-machine']
}));

export const blendTreeTask = defineTask('blend-tree', (args, taskCtx) => ({
  kind: 'agent',
  title: `Blend Trees - ${args.projectName}`,
  agent: {
    name: 'animator-agent',
    prompt: { role: 'Animation Programmer', task: 'Create animation blend trees', context: args, instructions: ['1. Create locomotion blend trees', '2. Build directional movement', '3. Add speed blending', '4. Create additive layers'] },
    outputSchema: { type: 'object', required: ['treeCount', 'blendTrees', 'artifacts'], properties: { treeCount: { type: 'number' }, blendTrees: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'animation', 'blend-tree']
}));

export const ikSystemsTask = defineTask('ik-systems', (args, taskCtx) => ({
  kind: 'agent',
  title: `IK Systems - ${args.projectName}`,
  agent: {
    name: 'animator-agent',
    prompt: { role: 'Animation Programmer', task: 'Implement IK systems', context: args, instructions: ['1. Set up foot IK', '2. Implement hand IK', '3. Create look-at system', '4. Add aim IK'] },
    outputSchema: { type: 'object', required: ['ikSystems', 'artifacts'], properties: { ikSystems: { type: 'array' }, footIK: { type: 'boolean' }, handIK: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'animation', 'ik']
}));

export const proceduralAnimTask = defineTask('procedural-anim', (args, taskCtx) => ({
  kind: 'agent',
  title: `Procedural Animation - ${args.projectName}`,
  agent: {
    name: 'animator-agent',
    prompt: { role: 'Animation Programmer', task: 'Implement procedural animation', context: args, instructions: ['1. Create ragdoll physics', '2. Add secondary motion', '3. Implement jiggle physics', '4. Create dynamic reactions'] },
    outputSchema: { type: 'object', required: ['proceduralSystems', 'artifacts'], properties: { proceduralSystems: { type: 'array' }, ragdoll: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'animation', 'procedural']
}));

export const animIntegrationTask = defineTask('anim-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Animation Integration - ${args.projectName}`,
  agent: {
    name: 'animator-agent',
    prompt: { role: 'Animation Programmer', task: 'Integrate animations with gameplay', context: args, instructions: ['1. Connect to gameplay events', '2. Add animation events', '3. Sync with audio', '4. Test all animations'] },
    outputSchema: { type: 'object', required: ['animations', 'integrated', 'artifacts'], properties: { animations: { type: 'array' }, integrated: { type: 'boolean' }, events: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'animation', 'integration']
}));

export const animOptimizationTask = defineTask('anim-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Animation Optimization - ${args.projectName}`,
  agent: {
    name: 'tech-artist-agent',
    prompt: { role: 'Tech Artist', task: 'Optimize animation systems', context: args, instructions: ['1. Optimize bone counts', '2. Implement LOD', '3. Optimize transitions', '4. Profile performance'] },
    outputSchema: { type: 'object', required: ['optimizations', 'performance', 'artifacts'], properties: { optimizations: { type: 'array' }, performance: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'animation', 'optimization']
}));
