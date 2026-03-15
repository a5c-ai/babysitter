/**
 * @process specializations/game-development/gameplay-systems-implementation
 * @description Gameplay Systems Implementation Process - Implement core gameplay systems including player controllers,
 * game state management, AI behaviors, progression systems, save/load functionality, and debugging tools.
 * @inputs { projectName: string, systemsToImplement?: array, engine?: string, outputDir?: string }
 * @outputs { success: boolean, systemsImplemented: array, apiDocumentation: string, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/game-development/gameplay-systems-implementation', {
 *   projectName: 'Stellar Odyssey',
 *   systemsToImplement: ['player-controller', 'combat', 'inventory', 'progression'],
 *   engine: 'Unity'
 * });
 *
 * @references
 * - Game Programming Patterns by Robert Nystrom
 * - Game Engine Architecture by Jason Gregory
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    systemsToImplement = ['player-controller', 'game-state', 'save-load'],
    engine = 'Unity',
    architectureStyle = 'component-based',
    outputDir = 'gameplay-systems-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Gameplay Systems Implementation: ${projectName}`);
  ctx.log('info', `Systems: ${systemsToImplement.join(', ')}`);

  // Phase 1: Architecture Design
  const architectureDesign = await ctx.task(systemArchitectureTask, {
    projectName, systemsToImplement, engine, architectureStyle, outputDir
  });
  artifacts.push(...architectureDesign.artifacts);

  await ctx.breakpoint({
    question: `System architecture designed for ${projectName}. ${architectureDesign.componentCount} components across ${systemsToImplement.length} systems. Review architecture before implementation?`,
    title: 'Architecture Review',
    context: { runId: ctx.runId, components: architectureDesign.components }
  });

  // Phase 2: Implement systems in parallel where possible
  const implementedSystems = [];

  for (const system of systemsToImplement) {
    const systemImpl = await ctx.task(systemImplementationTask, {
      projectName, system, engine, architectureDesign, outputDir
    });
    artifacts.push(...systemImpl.artifacts);
    implementedSystems.push({ system, ...systemImpl });
  }

  // Phase 3: System Integration
  const systemIntegration = await ctx.task(systemIntegrationTask, {
    projectName, implementedSystems, outputDir
  });
  artifacts.push(...systemIntegration.artifacts);

  // Phase 4: Debug Tools
  const debugTools = await ctx.task(debugToolsTask, {
    projectName, implementedSystems, engine, outputDir
  });
  artifacts.push(...debugTools.artifacts);

  // Phase 5: Unit Testing
  const unitTesting = await ctx.task(gameplayUnitTestingTask, {
    projectName, implementedSystems, outputDir
  });
  artifacts.push(...unitTesting.artifacts);

  // Phase 6: API Documentation
  const apiDocumentation = await ctx.task(systemApiDocTask, {
    projectName, implementedSystems, architectureDesign, outputDir
  });
  artifacts.push(...apiDocumentation.artifacts);

  return {
    success: true,
    projectName,
    systemsImplemented: implementedSystems.map(s => s.system),
    apiDocumentation: apiDocumentation.docPath,
    testResults: { testsRun: unitTesting.testsRun, testsPassed: unitTesting.testsPassed },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/gameplay-systems-implementation', timestamp: startTime, outputDir }
  };
}

export const systemArchitectureTask = defineTask('system-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `System Architecture - ${args.projectName}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Lead Programmer', task: 'Design gameplay system architecture', context: args, instructions: ['1. Design component interfaces', '2. Define data flow', '3. Plan event systems', '4. Design state management'] },
    outputSchema: { type: 'object', required: ['components', 'componentCount', 'artifacts'], properties: { components: { type: 'array' }, componentCount: { type: 'number' }, dataFlow: { type: 'object' }, eventSystem: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'gameplay-systems', 'architecture']
}));

export const systemImplementationTask = defineTask('system-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement ${args.system} - ${args.projectName}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Gameplay Programmer', task: `Implement ${args.system} system`, context: args, instructions: ['1. Implement core components', '2. Add game feel and juice', '3. Implement edge cases', '4. Add debug logging'] },
    outputSchema: { type: 'object', required: ['implemented', 'components', 'artifacts'], properties: { implemented: { type: 'boolean' }, components: { type: 'array' }, codePaths: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'gameplay-systems', 'implementation']
}));

export const systemIntegrationTask = defineTask('system-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `System Integration - ${args.projectName}`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: { role: 'Lead Programmer', task: 'Integrate all gameplay systems', context: args, instructions: ['1. Connect system interfaces', '2. Verify event flow', '3. Test system interactions', '4. Fix integration issues'] },
    outputSchema: { type: 'object', required: ['integrationComplete', 'issues', 'artifacts'], properties: { integrationComplete: { type: 'boolean' }, issues: { type: 'array' }, interactions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'gameplay-systems', 'integration']
}));

export const debugToolsTask = defineTask('debug-tools', (args, taskCtx) => ({
  kind: 'agent',
  title: `Debug Tools - ${args.projectName}`,
  agent: {
    name: 'engine-tools-developer-agent',
    prompt: { role: 'Tools Programmer', task: 'Create debugging and cheat tools', context: args, instructions: ['1. Create debug console', '2. Add cheat commands', '3. Create state inspectors', '4. Add visualization tools'] },
    outputSchema: { type: 'object', required: ['toolsCreated', 'commands', 'artifacts'], properties: { toolsCreated: { type: 'array' }, commands: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'gameplay-systems', 'debug-tools']
}));

export const gameplayUnitTestingTask = defineTask('gameplay-unit-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Unit Testing - ${args.projectName}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Engineer', task: 'Write and run unit tests', context: args, instructions: ['1. Write unit tests for systems', '2. Test edge cases', '3. Add integration tests', '4. Generate coverage report'] },
    outputSchema: { type: 'object', required: ['testsRun', 'testsPassed', 'artifacts'], properties: { testsRun: { type: 'number' }, testsPassed: { type: 'number' }, coverage: { type: 'number' }, failedTests: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'gameplay-systems', 'testing']
}));

export const systemApiDocTask = defineTask('system-api-doc', (args, taskCtx) => ({
  kind: 'agent',
  title: `API Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-documentation-agent',
    prompt: { role: 'Technical Writer', task: 'Document system APIs', context: args, instructions: ['1. Document public APIs', '2. Create usage examples', '3. Document events and signals', '4. Create integration guide'] },
    outputSchema: { type: 'object', required: ['docPath', 'artifacts'], properties: { docPath: { type: 'string' }, apiEndpoints: { type: 'number' }, examples: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'gameplay-systems', 'documentation']
}));
