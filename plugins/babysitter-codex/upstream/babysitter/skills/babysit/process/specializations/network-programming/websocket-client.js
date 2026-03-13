/**
 * @process specializations/network-programming/websocket-client
 * @description WebSocket Client Library - Build a robust WebSocket client with automatic reconnection, heartbeat,
 * message queuing, event handling, and support for binary and text messages.
 * @inputs { projectName: string, language: string, features?: object }
 * @outputs { success: boolean, clientConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/websocket-client', {
 *   projectName: 'Resilient WebSocket Client',
 *   language: 'TypeScript',
 *   features: { autoReconnect: true, heartbeat: true, messageQueue: true }
 * });
 *
 * @references
 * - WebSocket RFC 6455: https://www.rfc-editor.org/rfc/rfc6455
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, language = 'TypeScript', features = { autoReconnect: true, heartbeat: true, messageQueue: true }, outputDir = 'websocket-client' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting WebSocket Client: ${projectName}`);

  const phases = [
    { name: 'connection', task: connectionTask },
    { name: 'handshake', task: handshakeTask },
    { name: 'messaging', task: messagingTask },
    { name: 'reconnection', task: reconnectionTask },
    { name: 'heartbeat', task: heartbeatTask },
    { name: 'message-queue', task: messageQueueTask },
    { name: 'event-handling', task: eventHandlingTask },
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
    clientConfig: { features, language },
    implementation: results,
    testResults: { totalTests: results.testing.totalTests, passedTests: results.testing.passedTests },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/websocket-client', timestamp: startTime }
  };
}

export const connectionTask = defineTask('connection', (args, taskCtx) => ({
  kind: 'agent', title: `Connection - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Connection Engineer', task: 'Implement connection handling', context: args, instructions: ['1. TCP connection', '2. TLS support', '3. Proxy support', '4. Connection options'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket-client', 'connection']
}));

export const handshakeTask = defineTask('handshake', (args, taskCtx) => ({
  kind: 'agent', title: `Handshake - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Handshake Engineer', task: 'Implement client handshake', context: args, instructions: ['1. Generate Sec-WebSocket-Key', '2. Send upgrade request', '3. Validate response', '4. Handle headers'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket-client', 'handshake']
}));

export const messagingTask = defineTask('messaging', (args, taskCtx) => ({
  kind: 'agent', title: `Messaging - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Messaging Engineer', task: 'Implement message handling', context: args, instructions: ['1. Send text messages', '2. Send binary messages', '3. Receive messages', '4. Handle fragmentation'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket-client', 'messaging']
}));

export const reconnectionTask = defineTask('reconnection', (args, taskCtx) => ({
  kind: 'agent', title: `Reconnection - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Reconnection Engineer', task: 'Implement auto-reconnection', context: args, instructions: ['1. Detect disconnection', '2. Exponential backoff', '3. Max retry attempts', '4. Reconnection events'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket-client', 'reconnection']
}));

export const heartbeatTask = defineTask('heartbeat', (args, taskCtx) => ({
  kind: 'agent', title: `Heartbeat - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Heartbeat Engineer', task: 'Implement heartbeat mechanism', context: args, instructions: ['1. Send pings', '2. Handle pongs', '3. Detect timeout', '4. Configure intervals'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket-client', 'heartbeat']
}));

export const messageQueueTask = defineTask('message-queue', (args, taskCtx) => ({
  kind: 'agent', title: `Message Queue - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Queue Engineer', task: 'Implement message queuing', context: args, instructions: ['1. Queue during disconnect', '2. Flush on reconnect', '3. Queue limits', '4. Priority messages'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket-client', 'queue']
}));

export const eventHandlingTask = defineTask('event-handling', (args, taskCtx) => ({
  kind: 'agent', title: `Event Handling - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Event Engineer', task: 'Implement event system', context: args, instructions: ['1. Event emitter', '2. Standard events', '3. Custom events', '4. Event ordering'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket-client', 'events']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Test Engineer', task: 'Create client tests', context: args, instructions: ['1. Connection tests', '2. Message tests', '3. Reconnection tests', '4. Integration tests'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket-client', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'QA Engineer', task: 'Validate client', context: args, instructions: ['1. Verify features', '2. Check tests', '3. Validate API', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket-client', 'validation']
}));
