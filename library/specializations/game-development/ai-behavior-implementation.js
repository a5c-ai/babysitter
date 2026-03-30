/**
 * @process specializations/game-development/ai-behavior-implementation
 * @description AI and Behavior System Implementation Process - Design and implement game AI including behavior trees,
 * decision making systems, pathfinding, NPC behaviors, and difficulty adaptation systems.
 * @inputs { projectName: string, aiType?: string, behaviors?: array, outputDir?: string }
 * @outputs { success: boolean, aiSystemDoc: string, behaviors: array, testResults: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    aiType = 'behavior-tree',
    behaviors = ['patrol', 'combat', 'flee'],
    pathfindingRequired = true,
    difficultyAdaptation = false,
    outputDir = 'ai-behavior-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting AI Behavior Implementation: ${projectName}`);

  // Phase 1: AI Architecture Design
  const architecture = await ctx.task(aiArchitectureTask, { projectName, aiType, behaviors, outputDir });
  artifacts.push(...architecture.artifacts);

  // Phase 2: Behavior Tree Implementation
  const behaviorTrees = await ctx.task(behaviorTreeTask, { projectName, behaviors, architecture, outputDir });
  artifacts.push(...behaviorTrees.artifacts);

  // Phase 3: Pathfinding Setup
  if (pathfindingRequired) {
    const pathfinding = await ctx.task(pathfindingTask, { projectName, outputDir });
    artifacts.push(...pathfinding.artifacts);
  }

  // Phase 4: Combat AI
  const combatAI = await ctx.task(combatAITask, { projectName, behaviorTrees, outputDir });
  artifacts.push(...combatAI.artifacts);

  // Phase 5: NPC Behaviors
  const npcBehaviors = await ctx.task(npcBehaviorsTask, { projectName, behaviorTrees, outputDir });
  artifacts.push(...npcBehaviors.artifacts);

  // Phase 6: Difficulty Adaptation
  if (difficultyAdaptation) {
    const adaptation = await ctx.task(difficultyAdaptationTask, { projectName, combatAI, outputDir });
    artifacts.push(...adaptation.artifacts);
  }

  // Phase 7: AI Testing
  const testing = await ctx.task(aiTestingTask, { projectName, behaviorTrees, combatAI, outputDir });
  artifacts.push(...testing.artifacts);

  await ctx.breakpoint({
    question: `AI implementation complete for ${projectName}. ${behaviorTrees.treeCount} behavior trees. Test pass: ${testing.passRate}%. Review AI systems?`,
    title: 'AI Implementation Review',
    context: { runId: ctx.runId, behaviorTrees, combatAI, testing }
  });

  return {
    success: true,
    projectName,
    aiSystemDoc: architecture.docPath,
    behaviors: behaviorTrees.behaviors,
    testResults: { passRate: testing.passRate, issues: testing.issues },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/ai-behavior-implementation', timestamp: startTime, outputDir }
  };
}

export const aiArchitectureTask = defineTask('ai-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `AI Architecture - ${args.projectName}`,
  agent: {
    name: 'ai-programmer-agent',
    prompt: { role: 'AI Programmer', task: 'Design AI architecture', context: args, instructions: ['1. Design AI system architecture', '2. Define behavior interfaces', '3. Plan state management', '4. Create AI documentation'] },
    outputSchema: { type: 'object', required: ['docPath', 'architecture', 'artifacts'], properties: { docPath: { type: 'string' }, architecture: { type: 'object' }, interfaces: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'ai', 'architecture']
}));

export const behaviorTreeTask = defineTask('behavior-tree', (args, taskCtx) => ({
  kind: 'agent',
  title: `Behavior Trees - ${args.projectName}`,
  agent: {
    name: 'ai-programmer-agent',
    prompt: { role: 'AI Programmer', task: 'Implement behavior trees', context: args, instructions: ['1. Create behavior tree system', '2. Implement standard nodes', '3. Create reusable behaviors', '4. Build editor tools'] },
    outputSchema: { type: 'object', required: ['treeCount', 'behaviors', 'artifacts'], properties: { treeCount: { type: 'number' }, behaviors: { type: 'array' }, nodes: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'ai', 'behavior-tree']
}));

export const pathfindingTask = defineTask('pathfinding', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pathfinding - ${args.projectName}`,
  agent: {
    name: 'ai-programmer-agent',
    prompt: { role: 'AI Programmer', task: 'Implement pathfinding system', context: args, instructions: ['1. Set up navmesh generation', '2. Implement A* or similar', '3. Add dynamic obstacles', '4. Optimize pathfinding'] },
    outputSchema: { type: 'object', required: ['navmeshReady', 'algorithm', 'artifacts'], properties: { navmeshReady: { type: 'boolean' }, algorithm: { type: 'string' }, dynamicObstacles: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'ai', 'pathfinding']
}));

export const combatAITask = defineTask('combat-ai', (args, taskCtx) => ({
  kind: 'agent',
  title: `Combat AI - ${args.projectName}`,
  agent: {
    name: 'ai-programmer-agent',
    prompt: { role: 'AI Programmer', task: 'Implement combat AI', context: args, instructions: ['1. Implement threat assessment', '2. Create attack patterns', '3. Add defensive behaviors', '4. Tune combat difficulty'] },
    outputSchema: { type: 'object', required: ['combatBehaviors', 'difficultyLevels', 'artifacts'], properties: { combatBehaviors: { type: 'array' }, difficultyLevels: { type: 'array' }, attackPatterns: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'ai', 'combat']
}));

export const npcBehaviorsTask = defineTask('npc-behaviors', (args, taskCtx) => ({
  kind: 'agent',
  title: `NPC Behaviors - ${args.projectName}`,
  agent: {
    name: 'ai-programmer-agent',
    prompt: { role: 'AI Programmer', task: 'Implement NPC behaviors', context: args, instructions: ['1. Create daily routines', '2. Implement interactions', '3. Add ambient behaviors', '4. Create dialogue triggers'] },
    outputSchema: { type: 'object', required: ['npcTypes', 'routines', 'artifacts'], properties: { npcTypes: { type: 'array' }, routines: { type: 'array' }, interactions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'ai', 'npc']
}));

export const difficultyAdaptationTask = defineTask('difficulty-adaptation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Difficulty Adaptation - ${args.projectName}`,
  agent: {
    name: 'ai-programmer-agent',
    prompt: { role: 'AI Programmer', task: 'Implement dynamic difficulty', context: args, instructions: ['1. Track player performance', '2. Design adaptation algorithm', '3. Adjust AI parameters', '4. Test adaptation'] },
    outputSchema: { type: 'object', required: ['adaptationSystem', 'parameters', 'artifacts'], properties: { adaptationSystem: { type: 'object' }, parameters: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'ai', 'difficulty']
}));

export const aiTestingTask = defineTask('ai-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `AI Testing - ${args.projectName}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Engineer', task: 'Test AI systems', context: args, instructions: ['1. Test all behaviors', '2. Verify pathfinding', '3. Test edge cases', '4. Check performance'] },
    outputSchema: { type: 'object', required: ['passRate', 'issues', 'artifacts'], properties: { passRate: { type: 'number' }, issues: { type: 'array' }, performance: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'ai', 'testing']
}));
