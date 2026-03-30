/**
 * @process specializations/network-programming/transparent-proxy
 * @description Transparent Proxy - Build a transparent/interception proxy using iptables/pf/WFP with
 * SSL interception, traffic analysis, and policy enforcement.
 * @inputs { projectName: string, language: string, platform?: string, features?: object }
 * @outputs { success: boolean, proxyConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/transparent-proxy', {
 *   projectName: 'Network Interception Proxy',
 *   language: 'C',
 *   platform: 'linux',
 *   features: { sslIntercept: true, tproxy: true, policyEngine: true }
 * });
 *
 * @references
 * - Linux TPROXY: https://www.kernel.org/doc/Documentation/networking/tproxy.txt
 * - iptables NAT: https://netfilter.org/documentation/HOWTO/NAT-HOWTO.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, language = 'C', platform = 'linux', features = { sslIntercept: true, tproxy: true, policyEngine: true }, outputDir = 'transparent-proxy' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Transparent Proxy: ${projectName}`);

  const phases = [
    { name: 'architecture', task: architectureTask },
    { name: 'packet-redirect', task: packetRedirectTask },
    { name: 'original-dest', task: originalDestTask },
    { name: 'ssl-intercept', task: sslInterceptTask },
    { name: 'ca-management', task: caManagementTask },
    { name: 'traffic-analysis', task: trafficAnalysisTask },
    { name: 'policy-engine', task: policyEngineTask },
    { name: 'logging', task: loggingTask },
    { name: 'testing', task: testSuiteTask }
  ];

  const results = {};
  for (const phase of phases) {
    const result = await ctx.task(phase.task, { projectName, language, platform, features, outputDir });
    results[phase.name] = result;
    artifacts.push(...result.artifacts);
  }

  const validation = await ctx.task(validationTask, { projectName, platform, features, results, outputDir });
  artifacts.push(...validation.artifacts);

  return {
    success: validation.overallScore >= 80, projectName,
    proxyConfig: { platform, features, language },
    implementation: results,
    testResults: { totalTests: results.testing.totalTests, passedTests: results.testing.passedTests },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/transparent-proxy', timestamp: startTime }
  };
}

export const architectureTask = defineTask('architecture', (args, taskCtx) => ({
  kind: 'agent', title: `Architecture - ${args.projectName}`,
  skill: { name: 'proxy-server' },
  agent: { name: 'proxy-expert', prompt: { role: 'Systems Architect', task: 'Design transparent proxy', context: args, instructions: ['1. Interception design', '2. Traffic flow', '3. SSL handling', '4. Platform specifics'] }, outputSchema: { type: 'object', required: ['design', 'artifacts'], properties: { design: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'transparent-proxy', 'architecture']
}));

export const packetRedirectTask = defineTask('packet-redirect', (args, taskCtx) => ({
  kind: 'agent', title: `Packet Redirect - ${args.projectName}`,
  skill: { name: 'network-simulation' },
  agent: { name: 'proxy-expert', prompt: { role: 'Redirect Engineer', task: 'Implement packet redirection', context: args, instructions: ['1. iptables rules', '2. TPROXY setup', '3. REDIRECT target', '4. Routing tables'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'transparent-proxy', 'redirect']
}));

export const originalDestTask = defineTask('original-dest', (args, taskCtx) => ({
  kind: 'agent', title: `Original Destination - ${args.projectName}`,
  skill: { name: 'network-simulation' },
  agent: { name: 'proxy-expert', prompt: { role: 'Destination Engineer', task: 'Get original destination', context: args, instructions: ['1. SO_ORIGINAL_DST', '2. IP_TRANSPARENT', '3. getsockopt handling', '4. NAT table lookup'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'transparent-proxy', 'dest']
}));

export const sslInterceptTask = defineTask('ssl-intercept', (args, taskCtx) => ({
  kind: 'agent', title: `SSL Intercept - ${args.projectName}`,
  skill: { name: 'proxy-server' },
  agent: { name: 'proxy-expert', prompt: { role: 'SSL Intercept Engineer', task: 'Implement SSL interception', context: args, instructions: ['1. MITM setup', '2. Dynamic cert generation', '3. SNI extraction', '4. HSTS handling'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'transparent-proxy', 'ssl']
}));

export const caManagementTask = defineTask('ca-management', (args, taskCtx) => ({
  kind: 'agent', title: `CA Management - ${args.projectName}`,
  skill: { name: 'proxy-server' },
  agent: { name: 'proxy-expert', prompt: { role: 'CA Engineer', task: 'Implement CA management', context: args, instructions: ['1. Root CA generation', '2. Cert signing', '3. Cert caching', '4. Client distribution'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'transparent-proxy', 'ca']
}));

export const trafficAnalysisTask = defineTask('traffic-analysis', (args, taskCtx) => ({
  kind: 'agent', title: `Traffic Analysis - ${args.projectName}`,
  skill: { name: 'network-simulation' },
  agent: { name: 'proxy-expert', prompt: { role: 'Traffic Analysis Engineer', task: 'Implement traffic analysis', context: args, instructions: ['1. Protocol detection', '2. Content inspection', '3. Metadata extraction', '4. Threat detection'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'transparent-proxy', 'analysis']
}));

export const policyEngineTask = defineTask('policy-engine', (args, taskCtx) => ({
  kind: 'agent', title: `Policy Engine - ${args.projectName}`,
  skill: { name: 'proxy-server' },
  agent: { name: 'proxy-expert', prompt: { role: 'Policy Engineer', task: 'Implement policy engine', context: args, instructions: ['1. Rule definition', '2. Policy evaluation', '3. Action execution', '4. Audit logging'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'transparent-proxy', 'policy']
}));

export const loggingTask = defineTask('logging', (args, taskCtx) => ({
  kind: 'agent', title: `Logging - ${args.projectName}`,
  skill: { name: 'proxy-server' },
  agent: { name: 'proxy-expert', prompt: { role: 'Logging Engineer', task: 'Implement logging', context: args, instructions: ['1. Connection logs', '2. Traffic logs', '3. Policy logs', '4. Performance metrics'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'transparent-proxy', 'logging']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Test Engineer', task: 'Create proxy tests', context: args, instructions: ['1. Interception tests', '2. SSL tests', '3. Policy tests', '4. Performance tests'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'transparent-proxy', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'QA Engineer', task: 'Validate proxy', context: args, instructions: ['1. Verify interception', '2. Check SSL', '3. Validate tests', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'transparent-proxy', 'validation']
}));
