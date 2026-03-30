/**
 * @process specializations/network-programming/realtime-messaging-system
 * @description Real-Time Messaging System - Build a scalable real-time messaging system with pub/sub, presence
 * detection, message history, delivery guarantees, and horizontal scaling support.
 * @inputs { projectName: string, language: string, features?: object }
 * @outputs { success: boolean, systemConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/realtime-messaging-system', {
 *   projectName: 'Enterprise Messaging Platform',
 *   language: 'Go',
 *   features: { pubSub: true, presence: true, history: true, scaling: 'redis' }
 * });
 *
 * @references
 * - Phoenix Channels: https://hexdocs.pm/phoenix/channels.html
 * - Socket.IO: https://socket.io/docs/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, language = 'Go', features = { pubSub: true, presence: true, history: true, scaling: 'redis' }, outputDir = 'realtime-messaging-system' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Real-Time Messaging System: ${projectName}`);

  const phases = [
    { name: 'architecture', task: architectureTask },
    { name: 'connection-layer', task: connectionLayerTask },
    { name: 'pub-sub', task: pubSubTask },
    { name: 'channels', task: channelsTask },
    { name: 'presence', task: presenceTask },
    { name: 'message-history', task: historyTask },
    { name: 'delivery-guarantees', task: deliveryTask },
    { name: 'scaling', task: scalingTask },
    { name: 'testing', task: testSuiteTask }
  ];

  const results = {};
  for (const phase of phases) {
    const result = await ctx.task(phase.task, { projectName, language, features, outputDir });
    results[phase.name] = result;
    artifacts.push(...result.artifacts);
  }

  const validation = await ctx.task(validationTask, { projectName, features, results, outputDir });
  artifacts.push(...validation.artifacts);

  return {
    success: validation.overallScore >= 80, projectName,
    systemConfig: { features, language },
    implementation: results,
    testResults: { totalTests: results.testing.totalTests, passedTests: results.testing.passedTests },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/realtime-messaging-system', timestamp: startTime }
  };
}

export const architectureTask = defineTask('architecture', (args, taskCtx) => ({
  kind: 'agent', title: `Architecture - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Systems Architect', task: 'Design messaging architecture', context: args, instructions: ['1. Design components', '2. Define data flows', '3. Plan scaling', '4. Document architecture'] }, outputSchema: { type: 'object', required: ['design', 'artifacts'], properties: { design: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'messaging', 'architecture']
}));

export const connectionLayerTask = defineTask('connection-layer', (args, taskCtx) => ({
  kind: 'agent', title: `Connection Layer - ${args.projectName}`,
  skill: { name: 'grpc-protocol' },
  agent: { name: 'realtime-expert', prompt: { role: 'Connection Engineer', task: 'Build connection layer', context: args, instructions: ['1. WebSocket support', '2. Long-polling fallback', '3. Connection tracking', '4. Authentication'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'messaging', 'connection']
}));

export const pubSubTask = defineTask('pub-sub', (args, taskCtx) => ({
  kind: 'agent', title: `Pub/Sub - ${args.projectName}`,
  skill: { name: 'dns-protocol' },
  agent: { name: 'realtime-expert', prompt: { role: 'Pub/Sub Engineer', task: 'Implement pub/sub system', context: args, instructions: ['1. Topic management', '2. Subscription handling', '3. Message routing', '4. Pattern matching'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'messaging', 'pubsub']
}));

export const channelsTask = defineTask('channels', (args, taskCtx) => ({
  kind: 'agent', title: `Channels - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Channel Engineer', task: 'Implement channel system', context: args, instructions: ['1. Channel creation', '2. Join/leave handling', '3. Channel authorization', '4. Private channels'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'messaging', 'channels']
}));

export const presenceTask = defineTask('presence', (args, taskCtx) => ({
  kind: 'agent', title: `Presence - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Presence Engineer', task: 'Implement presence tracking', context: args, instructions: ['1. Track online users', '2. Join/leave events', '3. User metadata', '4. Presence sync'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'messaging', 'presence']
}));

export const historyTask = defineTask('history', (args, taskCtx) => ({
  kind: 'agent', title: `Message History - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'History Engineer', task: 'Implement message history', context: args, instructions: ['1. Store messages', '2. Retrieve history', '3. Pagination', '4. Retention policies'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'messaging', 'history']
}));

export const deliveryTask = defineTask('delivery', (args, taskCtx) => ({
  kind: 'agent', title: `Delivery Guarantees - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Delivery Engineer', task: 'Implement delivery guarantees', context: args, instructions: ['1. At-least-once delivery', '2. Message acknowledgments', '3. Retry mechanism', '4. Ordering guarantees'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'messaging', 'delivery']
}));

export const scalingTask = defineTask('scaling', (args, taskCtx) => ({
  kind: 'agent', title: `Horizontal Scaling - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Scaling Engineer', task: 'Implement horizontal scaling', context: args, instructions: ['1. Redis pub/sub', '2. Node coordination', '3. State sharing', '4. Load balancing'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'messaging', 'scaling']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Test Engineer', task: 'Create messaging tests', context: args, instructions: ['1. Unit tests', '2. Integration tests', '3. Load tests', '4. Chaos tests'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'messaging', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'QA Engineer', task: 'Validate system', context: args, instructions: ['1. Verify features', '2. Check scaling', '3. Validate tests', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'messaging', 'validation']
}));
