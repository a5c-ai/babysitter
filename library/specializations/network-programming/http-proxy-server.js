/**
 * @process specializations/network-programming/http-proxy-server
 * @description HTTP Proxy Server - Build a full-featured HTTP proxy with forward/reverse modes, caching,
 * content filtering, authentication, and logging capabilities.
 * @inputs { projectName: string, language: string, proxyMode?: string, features?: object }
 * @outputs { success: boolean, proxyConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/http-proxy-server', {
 *   projectName: 'Enterprise HTTP Proxy',
 *   language: 'Go',
 *   proxyMode: 'both',
 *   features: { caching: true, filtering: true, authentication: true, logging: true }
 * });
 *
 * @references
 * - Squid Proxy: http://www.squid-cache.org/Doc/
 * - mitmproxy: https://docs.mitmproxy.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, language = 'Go', proxyMode = 'both', features = { caching: true, filtering: true, authentication: true }, outputDir = 'http-proxy-server' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting HTTP Proxy Server: ${projectName}`);

  const phases = [
    { name: 'architecture', task: architectureTask },
    { name: 'forward-proxy', task: forwardProxyTask },
    { name: 'reverse-proxy', task: reverseProxyTask },
    { name: 'connect-tunnel', task: connectTunnelTask },
    { name: 'caching', task: cachingTask },
    { name: 'content-filtering', task: contentFilteringTask },
    { name: 'authentication', task: authenticationTask },
    { name: 'logging', task: loggingTask },
    { name: 'testing', task: testSuiteTask }
  ];

  const results = {};
  for (const phase of phases) {
    const result = await ctx.task(phase.task, { projectName, language, proxyMode, features, outputDir });
    results[phase.name] = result;
    artifacts.push(...result.artifacts);
  }

  const validation = await ctx.task(validationTask, { projectName, proxyMode, features, results, outputDir });
  artifacts.push(...validation.artifacts);

  return {
    success: validation.overallScore >= 80, projectName,
    proxyConfig: { proxyMode, features, language },
    implementation: results,
    testResults: { totalTests: results.testing.totalTests, passedTests: results.testing.passedTests },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/http-proxy-server', timestamp: startTime }
  };
}

export const architectureTask = defineTask('architecture', (args, taskCtx) => ({
  kind: 'agent', title: `Architecture - ${args.projectName}`,
  skill: { name: 'proxy-server' },
  agent: { name: 'proxy-expert', prompt: { role: 'Systems Architect', task: 'Design proxy architecture', context: args, instructions: ['1. Request pipeline', '2. Connection handling', '3. Cache architecture', '4. Filter chain design'] }, outputSchema: { type: 'object', required: ['design', 'artifacts'], properties: { design: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'proxy', 'architecture']
}));

export const forwardProxyTask = defineTask('forward-proxy', (args, taskCtx) => ({
  kind: 'agent', title: `Forward Proxy - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'proxy-expert', prompt: { role: 'Forward Proxy Engineer', task: 'Implement forward proxy', context: args, instructions: ['1. Request forwarding', '2. DNS resolution', '3. Upstream connection', '4. Error handling'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'proxy', 'forward']
}));

export const reverseProxyTask = defineTask('reverse-proxy', (args, taskCtx) => ({
  kind: 'agent', title: `Reverse Proxy - ${args.projectName}`,
  skill: { name: 'proxy-server' },
  agent: { name: 'proxy-expert', prompt: { role: 'Reverse Proxy Engineer', task: 'Implement reverse proxy', context: args, instructions: ['1. Backend routing', '2. Load balancing', '3. Header rewriting', '4. Path rewriting'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'proxy', 'reverse']
}));

export const connectTunnelTask = defineTask('connect-tunnel', (args, taskCtx) => ({
  kind: 'agent', title: `CONNECT Tunnel - ${args.projectName}`,
  skill: { name: 'proxy-server' },
  agent: { name: 'proxy-expert', prompt: { role: 'Tunnel Engineer', task: 'Implement CONNECT tunnel', context: args, instructions: ['1. CONNECT handling', '2. TLS passthrough', '3. Tunnel management', '4. Timeout handling'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'proxy', 'tunnel']
}));

export const cachingTask = defineTask('caching', (args, taskCtx) => ({
  kind: 'agent', title: `Caching - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'proxy-expert', prompt: { role: 'Cache Engineer', task: 'Implement caching', context: args, instructions: ['1. Cache storage', '2. Cache-Control headers', '3. Validation/revalidation', '4. Cache eviction'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'proxy', 'caching']
}));

export const contentFilteringTask = defineTask('content-filtering', (args, taskCtx) => ({
  kind: 'agent', title: `Content Filtering - ${args.projectName}`,
  skill: { name: 'proxy-server' },
  agent: { name: 'proxy-expert', prompt: { role: 'Filter Engineer', task: 'Implement content filtering', context: args, instructions: ['1. URL filtering', '2. Content type filtering', '3. Body inspection', '4. Blocklist/allowlist'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'proxy', 'filtering']
}));

export const authenticationTask = defineTask('authentication', (args, taskCtx) => ({
  kind: 'agent', title: `Authentication - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'proxy-expert', prompt: { role: 'Authentication Engineer', task: 'Implement authentication', context: args, instructions: ['1. Basic auth', '2. Digest auth', '3. LDAP integration', '4. OAuth support'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'proxy', 'auth']
}));

export const loggingTask = defineTask('logging', (args, taskCtx) => ({
  kind: 'agent', title: `Logging - ${args.projectName}`,
  skill: { name: 'proxy-server' },
  agent: { name: 'proxy-expert', prompt: { role: 'Logging Engineer', task: 'Implement logging', context: args, instructions: ['1. Access logs', '2. Error logs', '3. Log formats', '4. Log rotation'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'proxy', 'logging']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Test Engineer', task: 'Create proxy tests', context: args, instructions: ['1. Forward tests', '2. Reverse tests', '3. Cache tests', '4. Auth tests'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'proxy', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'QA Engineer', task: 'Validate proxy', context: args, instructions: ['1. Verify modes', '2. Check caching', '3. Validate tests', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'proxy', 'validation']
}));
