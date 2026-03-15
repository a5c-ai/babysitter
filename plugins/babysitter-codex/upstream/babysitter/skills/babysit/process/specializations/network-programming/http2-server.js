/**
 * @process specializations/network-programming/http2-server
 * @description HTTP/2 Server Implementation - Build an HTTP/2 compliant server with binary framing, multiplexed streams,
 * header compression (HPACK), flow control, server push, and stream prioritization.
 * @inputs { projectName: string, language: string, features?: object }
 * @outputs { success: boolean, serverConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/http2-server', {
 *   projectName: 'High-Performance HTTP/2 Server',
 *   language: 'Go',
 *   features: { serverPush: true, prioritization: true, maxConcurrentStreams: 100 }
 * });
 *
 * @references
 * - HTTP/2 RFC 7540: https://www.rfc-editor.org/rfc/rfc7540
 * - HPACK RFC 7541: https://www.rfc-editor.org/rfc/rfc7541
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName, language = 'Go', features = { serverPush: true, prioritization: true, maxConcurrentStreams: 100 },
    outputDir = 'http2-server'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting HTTP/2 Server Implementation: ${projectName}`);

  // Phase 1: HTTP/2 Protocol Analysis
  const protocolAnalysis = await ctx.task(protocolAnalysisTask, { projectName, features, outputDir });
  artifacts.push(...protocolAnalysis.artifacts);

  // Phase 2: Binary Framing Layer
  const framingLayer = await ctx.task(framingLayerTask, { projectName, language, outputDir });
  artifacts.push(...framingLayer.artifacts);

  // Phase 3: Stream Multiplexing
  const streamMultiplexing = await ctx.task(streamMultiplexingTask, { projectName, language, features, outputDir });
  artifacts.push(...streamMultiplexing.artifacts);

  // Phase 4: HPACK Header Compression
  const hpackCompression = await ctx.task(hpackCompressionTask, { projectName, language, outputDir });
  artifacts.push(...hpackCompression.artifacts);

  // Phase 5: Flow Control
  const flowControl = await ctx.task(flowControlTask, { projectName, language, outputDir });
  artifacts.push(...flowControl.artifacts);

  // Phase 6: Server Push
  const serverPush = await ctx.task(serverPushTask, { projectName, language, features, outputDir });
  artifacts.push(...serverPush.artifacts);

  // Phase 7: Stream Prioritization
  const prioritization = await ctx.task(prioritizationTask, { projectName, language, features, outputDir });
  artifacts.push(...prioritization.artifacts);

  // Phase 8: Connection Management
  const connectionMgmt = await ctx.task(connectionMgmtTask, { projectName, language, outputDir });
  artifacts.push(...connectionMgmt.artifacts);

  // Phase 9: Testing and Validation
  const [testSuite, validation] = await ctx.parallel.all([
    () => ctx.task(testSuiteTask, { projectName, language, features, outputDir }),
    () => ctx.task(validationTask, { projectName, features, outputDir })
  ]);
  artifacts.push(...testSuite.artifacts, ...validation.artifacts);

  await ctx.breakpoint({
    question: `HTTP/2 Server Complete for ${projectName}! Validation: ${validation.overallScore}/100. Review?`,
    title: 'HTTP/2 Server Complete',
    context: { runId: ctx.runId, validationScore: validation.overallScore }
  });

  return {
    success: validation.overallScore >= 80,
    projectName,
    serverConfig: { features, httpVersion: '2' },
    implementation: { framingLayer: framingLayer.implementation, streamMultiplexing: streamMultiplexing.implementation, hpack: hpackCompression.implementation, flowControl: flowControl.implementation, serverPush: serverPush.implementation, prioritization: prioritization.implementation },
    testResults: { totalTests: testSuite.totalTests, passedTests: testSuite.passedTests },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/http2-server', timestamp: startTime }
  };
}

export const protocolAnalysisTask = defineTask('protocol-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Protocol Analysis - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'network-architect', prompt: { role: 'HTTP/2 Protocol Analyst', task: 'Analyze HTTP/2 requirements', context: args, instructions: ['1. Analyze RFC 7540', '2. Document frame types', '3. List stream states', '4. Define compliance criteria'] }, outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http2', 'protocol']
}));

export const framingLayerTask = defineTask('framing-layer', (args, taskCtx) => ({
  kind: 'agent', title: `Framing Layer - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'hpc-network-expert', prompt: { role: 'HTTP/2 Framing Engineer', task: 'Implement binary framing', context: args, instructions: ['1. Implement frame parser', '2. Implement frame serializer', '3. Handle all frame types', '4. Validate frame format'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http2', 'framing']
}));

export const streamMultiplexingTask = defineTask('stream-multiplexing', (args, taskCtx) => ({
  kind: 'agent', title: `Stream Multiplexing - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'hpc-network-expert', prompt: { role: 'Stream Multiplexing Engineer', task: 'Implement stream multiplexing', context: args, instructions: ['1. Manage stream lifecycle', '2. Handle concurrent streams', '3. Implement stream state machine', '4. Handle stream errors'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http2', 'streams']
}));

export const hpackCompressionTask = defineTask('hpack-compression', (args, taskCtx) => ({
  kind: 'agent', title: `HPACK Compression - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'hpc-network-expert', prompt: { role: 'HPACK Engineer', task: 'Implement HPACK header compression', context: args, instructions: ['1. Implement static table', '2. Implement dynamic table', '3. Implement Huffman coding', '4. Handle header encoding/decoding'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http2', 'hpack']
}));

export const flowControlTask = defineTask('flow-control', (args, taskCtx) => ({
  kind: 'agent', title: `Flow Control - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'hpc-network-expert', prompt: { role: 'Flow Control Engineer', task: 'Implement HTTP/2 flow control', context: args, instructions: ['1. Track window sizes', '2. Handle WINDOW_UPDATE', '3. Implement backpressure', '4. Handle blocked streams'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http2', 'flow-control']
}));

export const serverPushTask = defineTask('server-push', (args, taskCtx) => ({
  kind: 'agent', title: `Server Push - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'hpc-network-expert', prompt: { role: 'Server Push Engineer', task: 'Implement server push', context: args, instructions: ['1. Implement PUSH_PROMISE', '2. Handle push responses', '3. Implement push cancellation', '4. Optimize push strategy'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http2', 'server-push']
}));

export const prioritizationTask = defineTask('prioritization', (args, taskCtx) => ({
  kind: 'agent', title: `Prioritization - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'hpc-network-expert', prompt: { role: 'Stream Priority Engineer', task: 'Implement stream prioritization', context: args, instructions: ['1. Implement dependency tree', '2. Handle weight allocation', '3. Implement priority scheduling', '4. Handle reprioritization'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http2', 'priority']
}));

export const connectionMgmtTask = defineTask('connection-mgmt', (args, taskCtx) => ({
  kind: 'agent', title: `Connection Management - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'hpc-network-expert', prompt: { role: 'Connection Engineer', task: 'Implement connection management', context: args, instructions: ['1. Handle connection preface', '2. Implement SETTINGS exchange', '3. Handle GOAWAY', '4. Implement ping/pong'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http2', 'connection']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'hpc-network-expert', prompt: { role: 'Test Engineer', task: 'Create HTTP/2 tests', context: args, instructions: ['1. Test framing', '2. Test streams', '3. Test HPACK', '4. Test flow control'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http2', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'hpc-network-expert', prompt: { role: 'QA Engineer', task: 'Validate HTTP/2 server', context: args, instructions: ['1. Check RFC compliance', '2. Run h2spec', '3. Validate tests', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'http2', 'validation']
}));
