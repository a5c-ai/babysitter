/**
 * @process specializations/network-programming/layer7-load-balancer
 * @description Layer 7 Load Balancer Implementation - Build an HTTP-aware load balancer with URL-based routing,
 * header manipulation, SSL termination, session affinity, and advanced health checking.
 * @inputs { projectName: string, language: string, features?: object }
 * @outputs { success: boolean, lbConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/layer7-load-balancer', {
 *   projectName: 'Application Load Balancer',
 *   language: 'Go',
 *   features: { sslTermination: true, urlRouting: true, headerManipulation: true, rateLimit: true }
 * });
 *
 * @references
 * - NGINX: https://nginx.org/en/docs/
 * - Envoy Proxy: https://www.envoyproxy.io/docs/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, language = 'Go', features = { sslTermination: true, urlRouting: true, headerManipulation: true }, outputDir = 'layer7-load-balancer' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting L7 Load Balancer: ${projectName}`);

  const phases = [
    { name: 'architecture', task: architectureTask },
    { name: 'http-parsing', task: httpParsingTask },
    { name: 'ssl-termination', task: sslTerminationTask },
    { name: 'url-routing', task: urlRoutingTask },
    { name: 'header-manipulation', task: headerManipulationTask },
    { name: 'session-affinity', task: sessionAffinityTask },
    { name: 'rate-limiting', task: rateLimitingTask },
    { name: 'health-checking', task: healthCheckingTask },
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
    lbConfig: { features, language },
    implementation: results,
    testResults: { totalTests: results.testing.totalTests, passedTests: results.testing.passedTests },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/layer7-load-balancer', timestamp: startTime }
  };
}

export const architectureTask = defineTask('architecture', (args, taskCtx) => ({
  kind: 'agent', title: `Architecture - ${args.projectName}`,
  skill: { name: 'load-balancer' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'Systems Architect', task: 'Design L7 LB architecture', context: args, instructions: ['1. HTTP processing pipeline', '2. Connection pooling', '3. SSL/TLS handling', '4. Routing engine design'] }, outputSchema: { type: 'object', required: ['design', 'artifacts'], properties: { design: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'l7']
}));

export const httpParsingTask = defineTask('http-parsing', (args, taskCtx) => ({
  kind: 'agent', title: `HTTP Parsing - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'HTTP Engineer', task: 'Implement HTTP parsing', context: args, instructions: ['1. Request parsing', '2. Response parsing', '3. Chunked encoding', '4. HTTP/2 support'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'http']
}));

export const sslTerminationTask = defineTask('ssl-termination', (args, taskCtx) => ({
  kind: 'agent', title: `SSL Termination - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'SSL Engineer', task: 'Implement SSL termination', context: args, instructions: ['1. Certificate management', '2. SNI support', '3. OCSP stapling', '4. TLS 1.3 support'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'ssl']
}));

export const urlRoutingTask = defineTask('url-routing', (args, taskCtx) => ({
  kind: 'agent', title: `URL Routing - ${args.projectName}`,
  skill: { name: 'load-balancer' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'Routing Engineer', task: 'Implement URL-based routing', context: args, instructions: ['1. Path matching', '2. Regex routing', '3. Host-based routing', '4. Query param routing'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'routing']
}));

export const headerManipulationTask = defineTask('header-manipulation', (args, taskCtx) => ({
  kind: 'agent', title: `Header Manipulation - ${args.projectName}`,
  skill: { name: 'http-protocol' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'Header Engineer', task: 'Implement header manipulation', context: args, instructions: ['1. Add/remove headers', '2. X-Forwarded headers', '3. CORS handling', '4. Security headers'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'headers']
}));

export const sessionAffinityTask = defineTask('session-affinity', (args, taskCtx) => ({
  kind: 'agent', title: `Session Affinity - ${args.projectName}`,
  skill: { name: 'load-balancer' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'Session Engineer', task: 'Implement session affinity', context: args, instructions: ['1. Cookie-based affinity', '2. IP hash affinity', '3. Header-based affinity', '4. Sticky sessions'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'session']
}));

export const rateLimitingTask = defineTask('rate-limiting', (args, taskCtx) => ({
  kind: 'agent', title: `Rate Limiting - ${args.projectName}`,
  skill: { name: 'load-balancer' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'Rate Limit Engineer', task: 'Implement rate limiting', context: args, instructions: ['1. Token bucket', '2. Sliding window', '3. Per-client limits', '4. Burst handling'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'ratelimit']
}));

export const healthCheckingTask = defineTask('health-checking', (args, taskCtx) => ({
  kind: 'agent', title: `Health Checking - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'Health Check Engineer', task: 'Implement health checks', context: args, instructions: ['1. HTTP health checks', '2. Custom health endpoints', '3. Active/passive checks', '4. Circuit breaker'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'health']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Test Engineer', task: 'Create LB tests', context: args, instructions: ['1. Routing tests', '2. SSL tests', '3. Performance tests', '4. Failover tests'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'QA Engineer', task: 'Validate load balancer', context: args, instructions: ['1. Verify routing', '2. Check SSL', '3. Validate tests', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'validation']
}));
