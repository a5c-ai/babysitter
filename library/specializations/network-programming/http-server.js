/**
 * @process specializations/network-programming/http-server
 * @description HTTP/1.1 Server Implementation - Build an HTTP/1.1 compliant server from scratch with request parsing,
 * response generation, keep-alive connections, chunked transfer encoding, compression, and virtual hosting.
 * @inputs { projectName: string, language: string, features?: object }
 * @outputs { success: boolean, serverConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/http-server', {
 *   projectName: 'Custom HTTP Server',
 *   language: 'Rust',
 *   features: { keepAlive: true, chunkedEncoding: true, gzip: true, virtualHosts: true }
 * });
 *
 * @references
 * - HTTP/1.1 RFC 7230-7235: https://www.rfc-editor.org/rfc/rfc7230
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName, language = 'C', features = { keepAlive: true, chunkedEncoding: true, gzip: true, virtualHosts: false },
    outputDir = 'http-server'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting HTTP/1.1 Server Implementation: ${projectName}`);

  // Phase 1: HTTP Protocol Analysis
  const protocolAnalysis = await ctx.task(protocolAnalysisTask, { projectName, features, outputDir });
  artifacts.push(...protocolAnalysis.artifacts);

  // Phase 2: Request Parser
  const requestParser = await ctx.task(requestParserTask, { projectName, language, outputDir });
  artifacts.push(...requestParser.artifacts);

  // Phase 3: Response Generator
  const responseGenerator = await ctx.task(responseGeneratorTask, { projectName, language, outputDir });
  artifacts.push(...responseGenerator.artifacts);

  // Phase 4: Connection Handler
  const connectionHandler = await ctx.task(connectionHandlerTask, { projectName, language, features, outputDir });
  artifacts.push(...connectionHandler.artifacts);

  // Phase 5: Keep-Alive and Pipelining
  const keepAliveHandler = await ctx.task(keepAliveTask, { projectName, language, features, outputDir });
  artifacts.push(...keepAliveHandler.artifacts);

  // Phase 6: Chunked Transfer Encoding
  const chunkedEncoding = await ctx.task(chunkedEncodingTask, { projectName, language, features, outputDir });
  artifacts.push(...chunkedEncoding.artifacts);

  // Phase 7: Content Compression
  const compression = await ctx.task(compressionTask, { projectName, language, features, outputDir });
  artifacts.push(...compression.artifacts);

  // Phase 8: Virtual Hosting
  const virtualHosting = await ctx.task(virtualHostingTask, { projectName, language, features, outputDir });
  artifacts.push(...virtualHosting.artifacts);

  // Phase 9: Static File Serving
  const staticFiles = await ctx.task(staticFilesTask, { projectName, language, outputDir });
  artifacts.push(...staticFiles.artifacts);

  // Phase 10: Testing and Validation
  const [testSuite, validation] = await ctx.parallel.all([
    () => ctx.task(testSuiteTask, { projectName, language, features, outputDir }),
    () => ctx.task(validationTask, { projectName, features, outputDir })
  ]);
  artifacts.push(...testSuite.artifacts, ...validation.artifacts);

  await ctx.breakpoint({
    question: `HTTP Server Complete for ${projectName}! Validation: ${validation.overallScore}/100. Review?`,
    title: 'HTTP Server Complete',
    context: { runId: ctx.runId, validationScore: validation.overallScore }
  });

  return {
    success: validation.overallScore >= 80,
    projectName,
    serverConfig: { features, httpVersion: '1.1' },
    implementation: {
      requestParser: requestParser.implementation,
      responseGenerator: responseGenerator.implementation,
      connectionHandler: connectionHandler.implementation,
      keepAlive: keepAliveHandler.implementation,
      chunkedEncoding: chunkedEncoding.implementation,
      compression: compression.implementation
    },
    testResults: { totalTests: testSuite.totalTests, passedTests: testSuite.passedTests },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/http-server', timestamp: startTime }
  };
}

export const protocolAnalysisTask = defineTask('protocol-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Protocol Analysis - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: {
    name: 'network-architect',
    prompt: { role: 'HTTP Protocol Analyst', task: 'Analyze HTTP/1.1 requirements', context: args,
      instructions: ['1. Analyze RFC requirements', '2. Document message formats', '3. List required headers', '4. Define compliance criteria'] },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'http', 'protocol']
}));

export const requestParserTask = defineTask('request-parser', (args, taskCtx) => ({
  kind: 'agent',
  title: `Request Parser - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: {
    name: 'network-architect',
    prompt: { role: 'HTTP Parser Engineer', task: 'Implement HTTP request parser', context: args,
      instructions: ['1. Parse request line', '2. Parse headers', '3. Handle body', '4. Validate requests'] },
    outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'http', 'parser']
}));

export const responseGeneratorTask = defineTask('response-generator', (args, taskCtx) => ({
  kind: 'agent',
  title: `Response Generator - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: {
    name: 'network-architect',
    prompt: { role: 'HTTP Response Engineer', task: 'Implement response generation', context: args,
      instructions: ['1. Generate status line', '2. Set headers', '3. Handle body', '4. Support all status codes'] },
    outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'http', 'response']
}));

export const connectionHandlerTask = defineTask('connection-handler', (args, taskCtx) => ({
  kind: 'agent',
  title: `Connection Handler - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: {
    name: 'network-architect',
    prompt: { role: 'Connection Handler Engineer', task: 'Implement HTTP connection handling', context: args,
      instructions: ['1. Accept connections', '2. Handle request/response cycle', '3. Manage timeouts', '4. Handle errors'] },
    outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'http', 'connection']
}));

export const keepAliveTask = defineTask('keep-alive', (args, taskCtx) => ({
  kind: 'agent',
  title: `Keep-Alive - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: {
    name: 'network-architect',
    prompt: { role: 'Keep-Alive Engineer', task: 'Implement keep-alive connections', context: args,
      instructions: ['1. Handle Connection header', '2. Implement keep-alive timeout', '3. Support pipelining', '4. Manage connection pool'] },
    outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'http', 'keep-alive']
}));

export const chunkedEncodingTask = defineTask('chunked-encoding', (args, taskCtx) => ({
  kind: 'agent',
  title: `Chunked Encoding - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: {
    name: 'network-architect',
    prompt: { role: 'Transfer Encoding Engineer', task: 'Implement chunked transfer encoding', context: args,
      instructions: ['1. Implement chunk encoder', '2. Implement chunk decoder', '3. Handle trailers', '4. Support streaming'] },
    outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'http', 'chunked']
}));

export const compressionTask = defineTask('compression', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compression - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: {
    name: 'network-architect',
    prompt: { role: 'Compression Engineer', task: 'Implement content compression', context: args,
      instructions: ['1. Implement gzip compression', '2. Handle Accept-Encoding', '3. Set Content-Encoding', '4. Optimize compression'] },
    outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'http', 'compression']
}));

export const virtualHostingTask = defineTask('virtual-hosting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Virtual Hosting - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: {
    name: 'network-architect',
    prompt: { role: 'Virtual Hosting Engineer', task: 'Implement virtual hosting', context: args,
      instructions: ['1. Handle Host header', '2. Route to virtual hosts', '3. Configure per-host settings', '4. Handle default host'] },
    outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'http', 'virtual-hosting']
}));

export const staticFilesTask = defineTask('static-files', (args, taskCtx) => ({
  kind: 'agent',
  title: `Static Files - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: {
    name: 'network-architect',
    prompt: { role: 'Static File Engineer', task: 'Implement static file serving', context: args,
      instructions: ['1. Map URLs to files', '2. Set content types', '3. Handle caching headers', '4. Implement range requests'] },
    outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'http', 'static-files']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Suite - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: {
    name: 'network-architect',
    prompt: { role: 'Test Engineer', task: 'Create HTTP server tests', context: args,
      instructions: ['1. Test request parsing', '2. Test response generation', '3. Test keep-alive', '4. Test compliance'] },
    outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'http', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validation - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: {
    name: 'network-architect',
    prompt: { role: 'QA Engineer', task: 'Validate HTTP server', context: args,
      instructions: ['1. Check RFC compliance', '2. Verify features', '3. Validate tests', '4. Calculate score'] },
    outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'http', 'validation']
}));
