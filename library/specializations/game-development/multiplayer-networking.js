/**
 * @process specializations/game-development/multiplayer-networking
 * @description Multiplayer Networking Implementation Process - Build networked multiplayer systems with client-server
 * architecture, state synchronization, lag compensation, matchmaking, and network edge case handling.
 * @inputs { projectName: string, networkArchitecture?: string, playerCount?: number, latencyTarget?: number, outputDir?: string }
 * @outputs { success: boolean, networkSystemPath: string, testResults: object, documentationPath: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/game-development/multiplayer-networking', {
 *   projectName: 'Stellar Odyssey',
 *   networkArchitecture: 'client-server',
 *   playerCount: 16,
 *   latencyTarget: 100
 * });
 *
 * @references
 * - Multiplayer Game Programming by Joshua Glazer
 * - Gaffer on Games - Networking Articles
 * - Overwatch Gameplay Architecture and Netcode (GDC)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    networkArchitecture = 'client-server',
    playerCount = 8,
    latencyTarget = 150,
    serverAuthoritative = true,
    matchmakingRequired = true,
    outputDir = 'multiplayer-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Multiplayer Networking: ${projectName}`);
  ctx.log('info', `Architecture: ${networkArchitecture}, Players: ${playerCount}`);

  // Phase 1: Network Architecture Design
  const architectureDesign = await ctx.task(networkArchitectureTask, {
    projectName, networkArchitecture, playerCount, serverAuthoritative, outputDir
  });
  artifacts.push(...architectureDesign.artifacts);

  // Phase 2: Connection and Matchmaking
  const connectionSystem = await ctx.task(connectionMatchmakingTask, {
    projectName, matchmakingRequired, playerCount, outputDir
  });
  artifacts.push(...connectionSystem.artifacts);

  // Phase 3: State Synchronization
  const stateSynchronization = await ctx.task(stateSyncTask, {
    projectName, architectureDesign, serverAuthoritative, outputDir
  });
  artifacts.push(...stateSynchronization.artifacts);

  // Phase 4: Lag Compensation
  const lagCompensation = await ctx.task(lagCompensationTask, {
    projectName, latencyTarget, serverAuthoritative, outputDir
  });
  artifacts.push(...lagCompensation.artifacts);

  // Phase 5: Edge Case Handling
  const edgeCaseHandling = await ctx.task(networkEdgeCasesTask, {
    projectName, architectureDesign, outputDir
  });
  artifacts.push(...edgeCaseHandling.artifacts);

  // Phase 6: Network Testing
  const networkTesting = await ctx.task(networkTestingTask, {
    projectName, latencyTarget, playerCount, outputDir
  });
  artifacts.push(...networkTesting.artifacts);

  await ctx.breakpoint({
    question: `Network testing complete for ${projectName}. Pass rate: ${networkTesting.passRate}%. Latency under ${latencyTarget}ms: ${networkTesting.latencyTestPassed}. Review results?`,
    title: 'Network Testing Review',
    context: { runId: ctx.runId, networkTesting }
  });

  // Phase 7: Optimization
  const optimization = await ctx.task(networkOptimizationTask, {
    projectName, networkTesting, latencyTarget, outputDir
  });
  artifacts.push(...optimization.artifacts);

  // Phase 8: Documentation
  const documentation = await ctx.task(networkDocumentationTask, {
    projectName, architectureDesign, connectionSystem, stateSynchronization, lagCompensation, outputDir
  });
  artifacts.push(...documentation.artifacts);

  return {
    success: true,
    projectName,
    networkSystemPath: architectureDesign.systemPath,
    testResults: { passRate: networkTesting.passRate, latencyPassed: networkTesting.latencyTestPassed },
    documentationPath: documentation.docPath,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/multiplayer-networking', timestamp: startTime, outputDir }
  };
}

export const networkArchitectureTask = defineTask('network-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Network Architecture - ${args.projectName}`,
  agent: {
    name: 'network-programmer-agent',
    prompt: { role: 'Network Engineer', task: 'Design network architecture', context: args, instructions: ['1. Design client-server topology', '2. Define message protocols', '3. Design replication model', '4. Plan server authority'] },
    outputSchema: { type: 'object', required: ['systemPath', 'protocols', 'artifacts'], properties: { systemPath: { type: 'string' }, protocols: { type: 'array' }, replicationModel: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'multiplayer', 'architecture']
}));

export const connectionMatchmakingTask = defineTask('connection-matchmaking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Connection & Matchmaking - ${args.projectName}`,
  agent: {
    name: 'network-programmer-agent',
    prompt: { role: 'Network Engineer', task: 'Implement connection and matchmaking', context: args, instructions: ['1. Implement connection handling', '2. Build matchmaking system', '3. Add lobby management', '4. Handle reconnection'] },
    outputSchema: { type: 'object', required: ['implemented', 'features', 'artifacts'], properties: { implemented: { type: 'boolean' }, features: { type: 'array' }, lobbySupport: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'multiplayer', 'matchmaking']
}));

export const stateSyncTask = defineTask('state-sync', (args, taskCtx) => ({
  kind: 'agent',
  title: `State Synchronization - ${args.projectName}`,
  agent: {
    name: 'network-programmer-agent',
    prompt: { role: 'Network Engineer', task: 'Implement state synchronization', context: args, instructions: ['1. Implement delta compression', '2. Build snapshot system', '3. Add interpolation', '4. Optimize bandwidth'] },
    outputSchema: { type: 'object', required: ['syncMethods', 'bandwidth', 'artifacts'], properties: { syncMethods: { type: 'array' }, bandwidth: { type: 'object' }, updateRate: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'multiplayer', 'state-sync']
}));

export const lagCompensationTask = defineTask('lag-compensation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Lag Compensation - ${args.projectName}`,
  agent: {
    name: 'network-programmer-agent',
    prompt: { role: 'Network Engineer', task: 'Implement lag compensation', context: args, instructions: ['1. Add client-side prediction', '2. Implement server reconciliation', '3. Add entity interpolation', '4. Build rollback system'] },
    outputSchema: { type: 'object', required: ['techniques', 'latencyHandled', 'artifacts'], properties: { techniques: { type: 'array' }, latencyHandled: { type: 'number' }, rollbackFrames: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'multiplayer', 'lag-compensation']
}));

export const networkEdgeCasesTask = defineTask('network-edge-cases', (args, taskCtx) => ({
  kind: 'agent',
  title: `Edge Case Handling - ${args.projectName}`,
  agent: {
    name: 'network-programmer-agent',
    prompt: { role: 'Network Engineer', task: 'Handle network edge cases', context: args, instructions: ['1. Handle disconnections', '2. Manage timeouts', '3. Handle packet loss', '4. Prevent cheating'] },
    outputSchema: { type: 'object', required: ['edgeCasesHandled', 'artifacts'], properties: { edgeCasesHandled: { type: 'array' }, antiCheatMeasures: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'multiplayer', 'edge-cases']
}));

export const networkTestingTask = defineTask('network-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Network Testing - ${args.projectName}`,
  agent: {
    name: 'game-qa-agent',
    prompt: { role: 'QA Engineer', task: 'Test network systems', context: args, instructions: ['1. Test with simulated latency', '2. Test packet loss scenarios', '3. Load test player count', '4. Measure performance'] },
    outputSchema: { type: 'object', required: ['passRate', 'latencyTestPassed', 'artifacts'], properties: { passRate: { type: 'number' }, latencyTestPassed: { type: 'boolean' }, maxLatency: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'multiplayer', 'testing']
}));

export const networkOptimizationTask = defineTask('network-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Network Optimization - ${args.projectName}`,
  agent: {
    name: 'network-programmer-agent',
    prompt: { role: 'Network Engineer', task: 'Optimize network performance', context: args, instructions: ['1. Reduce bandwidth usage', '2. Optimize update rates', '3. Improve compression', '4. Fine-tune prediction'] },
    outputSchema: { type: 'object', required: ['optimizations', 'improvements', 'artifacts'], properties: { optimizations: { type: 'array' }, improvements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'multiplayer', 'optimization']
}));

export const networkDocumentationTask = defineTask('network-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Network Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-documentation-agent',
    prompt: { role: 'Technical Writer', task: 'Document networking architecture', context: args, instructions: ['1. Document architecture', '2. Create protocol specifications', '3. Document APIs', '4. Create troubleshooting guide'] },
    outputSchema: { type: 'object', required: ['docPath', 'artifacts'], properties: { docPath: { type: 'string' }, sections: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'multiplayer', 'documentation']
}));
