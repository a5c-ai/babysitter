/**
 * @process specializations/network-programming/websocket-server
 * @description WebSocket Server Implementation - Build a WebSocket server compliant with RFC 6455 with handshake,
 * frame parsing, ping/pong, message fragmentation, subprotocol negotiation, and connection management.
 * @inputs { projectName: string, language: string, features?: object }
 * @outputs { success: boolean, serverConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/websocket-server', {
 *   projectName: 'Real-time WebSocket Server',
 *   language: 'Node.js',
 *   features: { compression: true, subprotocols: ['graphql-ws'], maxConnections: 10000 }
 * });
 *
 * @references
 * - WebSocket RFC 6455: https://www.rfc-editor.org/rfc/rfc6455
 * - WebSocket Compression: https://www.rfc-editor.org/rfc/rfc7692
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, language = 'Node.js', features = { compression: true, subprotocols: [], maxConnections: 10000 }, outputDir = 'websocket-server' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting WebSocket Server: ${projectName}`);

  const phases = [
    { name: 'handshake', task: handshakeTask },
    { name: 'frame-parser', task: frameParserTask },
    { name: 'frame-writer', task: frameWriterTask },
    { name: 'ping-pong', task: pingPongTask },
    { name: 'fragmentation', task: fragmentationTask },
    { name: 'compression', task: compressionTask },
    { name: 'subprotocols', task: subprotocolsTask },
    { name: 'connection-mgmt', task: connectionMgmtTask },
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
    serverConfig: { features, protocol: 'ws' },
    implementation: results,
    testResults: { totalTests: results.testing.totalTests, passedTests: results.testing.passedTests },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/websocket-server', timestamp: startTime }
  };
}

export const handshakeTask = defineTask('handshake', (args, taskCtx) => ({
  kind: 'agent', title: `Handshake - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'WebSocket Engineer', task: 'Implement WebSocket handshake', context: args, instructions: ['1. Parse upgrade request', '2. Validate Sec-WebSocket-Key', '3. Generate accept key', '4. Send handshake response'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket', 'handshake']
}));

export const frameParserTask = defineTask('frame-parser', (args, taskCtx) => ({
  kind: 'agent', title: `Frame Parser - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Frame Parser Engineer', task: 'Implement frame parsing', context: args, instructions: ['1. Parse frame header', '2. Handle masking', '3. Parse payload', '4. Validate frames'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket', 'parser']
}));

export const frameWriterTask = defineTask('frame-writer', (args, taskCtx) => ({
  kind: 'agent', title: `Frame Writer - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Frame Writer Engineer', task: 'Implement frame writing', context: args, instructions: ['1. Write frame header', '2. Handle large payloads', '3. Support all opcodes', '4. Optimize writes'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket', 'writer']
}));

export const pingPongTask = defineTask('ping-pong', (args, taskCtx) => ({
  kind: 'agent', title: `Ping/Pong - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Keep-Alive Engineer', task: 'Implement ping/pong', context: args, instructions: ['1. Send ping frames', '2. Handle pong responses', '3. Detect dead connections', '4. Configure intervals'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket', 'keepalive']
}));

export const fragmentationTask = defineTask('fragmentation', (args, taskCtx) => ({
  kind: 'agent', title: `Fragmentation - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Fragmentation Engineer', task: 'Implement message fragmentation', context: args, instructions: ['1. Handle continuation frames', '2. Reassemble fragments', '3. Validate fragment sequence', '4. Handle interleaved control'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket', 'fragmentation']
}));

export const compressionTask = defineTask('compression', (args, taskCtx) => ({
  kind: 'agent', title: `Compression - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Compression Engineer', task: 'Implement permessage-deflate', context: args, instructions: ['1. Negotiate extension', '2. Compress messages', '3. Decompress messages', '4. Handle context takeover'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket', 'compression']
}));

export const subprotocolsTask = defineTask('subprotocols', (args, taskCtx) => ({
  kind: 'agent', title: `Subprotocols - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Subprotocol Engineer', task: 'Implement subprotocol negotiation', context: args, instructions: ['1. Parse client subprotocols', '2. Select matching subprotocol', '3. Configure handlers', '4. Document subprotocols'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket', 'subprotocols']
}));

export const connectionMgmtTask = defineTask('connection-mgmt', (args, taskCtx) => ({
  kind: 'agent', title: `Connection Management - ${args.projectName}`,
  skill: { name: 'event-loop' },
  agent: { name: 'realtime-expert', prompt: { role: 'Connection Engineer', task: 'Implement connection management', context: args, instructions: ['1. Track connections', '2. Handle close frames', '3. Implement graceful shutdown', '4. Add connection limits'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket', 'connection']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'Test Engineer', task: 'Create WebSocket tests', context: args, instructions: ['1. Test handshake', '2. Test frames', '3. Test compression', '4. Run Autobahn'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'websocket' },
  agent: { name: 'realtime-expert', prompt: { role: 'QA Engineer', task: 'Validate WebSocket server', context: args, instructions: ['1. RFC compliance', '2. Autobahn results', '3. Validate tests', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'websocket', 'validation']
}));
