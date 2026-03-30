/**
 * @process specializations/network-programming/socks5-proxy
 * @description SOCKS5 Proxy Server - Build a SOCKS5 proxy server with authentication, UDP support,
 * IPv6 compatibility, and connection tracking.
 * @inputs { projectName: string, language: string, features?: object }
 * @outputs { success: boolean, proxyConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/socks5-proxy', {
 *   projectName: 'Secure SOCKS5 Proxy',
 *   language: 'Rust',
 *   features: { authentication: true, udpRelay: true, ipv6: true, logging: true }
 * });
 *
 * @references
 * - RFC 1928 SOCKS5: https://datatracker.ietf.org/doc/html/rfc1928
 * - RFC 1929 Username/Password Auth: https://datatracker.ietf.org/doc/html/rfc1929
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, language = 'Rust', features = { authentication: true, udpRelay: true, ipv6: true }, outputDir = 'socks5-proxy' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting SOCKS5 Proxy: ${projectName}`);

  const phases = [
    { name: 'protocol-spec', task: protocolSpecTask },
    { name: 'handshake', task: handshakeTask },
    { name: 'authentication', task: authenticationTask },
    { name: 'connect-command', task: connectCommandTask },
    { name: 'bind-command', task: bindCommandTask },
    { name: 'udp-relay', task: udpRelayTask },
    { name: 'ipv6-support', task: ipv6SupportTask },
    { name: 'connection-tracking', task: connectionTrackingTask },
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
    proxyConfig: { features, language },
    implementation: results,
    testResults: { totalTests: results.testing.totalTests, passedTests: results.testing.passedTests },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/socks5-proxy', timestamp: startTime }
  };
}

export const protocolSpecTask = defineTask('protocol-spec', (args, taskCtx) => ({
  kind: 'agent', title: `Protocol Spec - ${args.projectName}`,
  skill: { name: 'proxy-server' },
  agent: { name: 'proxy-expert', prompt: { role: 'Protocol Analyst', task: 'Analyze SOCKS5 protocol', context: args, instructions: ['1. RFC 1928 analysis', '2. Message formats', '3. State machine', '4. Error handling'] }, outputSchema: { type: 'object', required: ['specification', 'artifacts'], properties: { specification: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'socks5', 'spec']
}));

export const handshakeTask = defineTask('handshake', (args, taskCtx) => ({
  kind: 'agent', title: `Handshake - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: { name: 'proxy-expert', prompt: { role: 'Handshake Engineer', task: 'Implement SOCKS5 handshake', context: args, instructions: ['1. Method negotiation', '2. Version validation', '3. Auth method selection', '4. Error responses'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'socks5', 'handshake']
}));

export const authenticationTask = defineTask('authentication', (args, taskCtx) => ({
  kind: 'agent', title: `Authentication - ${args.projectName}`,
  skill: { name: 'proxy-server' },
  agent: { name: 'proxy-expert', prompt: { role: 'Authentication Engineer', task: 'Implement authentication', context: args, instructions: ['1. Username/password auth', '2. GSSAPI support', '3. No auth option', '4. Auth failure handling'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'socks5', 'auth']
}));

export const connectCommandTask = defineTask('connect-command', (args, taskCtx) => ({
  kind: 'agent', title: `CONNECT Command - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: { name: 'proxy-expert', prompt: { role: 'Connect Engineer', task: 'Implement CONNECT command', context: args, instructions: ['1. Address parsing', '2. DNS resolution', '3. Connection establishment', '4. Data relay'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'socks5', 'connect']
}));

export const bindCommandTask = defineTask('bind-command', (args, taskCtx) => ({
  kind: 'agent', title: `BIND Command - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: { name: 'proxy-expert', prompt: { role: 'Bind Engineer', task: 'Implement BIND command', context: args, instructions: ['1. Bind request handling', '2. Port allocation', '3. Accept connection', '4. Data forwarding'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'socks5', 'bind']
}));

export const udpRelayTask = defineTask('udp-relay', (args, taskCtx) => ({
  kind: 'agent', title: `UDP Relay - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: { name: 'proxy-expert', prompt: { role: 'UDP Relay Engineer', task: 'Implement UDP ASSOCIATE', context: args, instructions: ['1. UDP socket setup', '2. Datagram encapsulation', '3. Fragmentation handling', '4. Association timeout'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'socks5', 'udp']
}));

export const ipv6SupportTask = defineTask('ipv6-support', (args, taskCtx) => ({
  kind: 'agent', title: `IPv6 Support - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: { name: 'proxy-expert', prompt: { role: 'IPv6 Engineer', task: 'Implement IPv6 support', context: args, instructions: ['1. IPv6 address handling', '2. Dual-stack support', '3. Address type detection', '4. Happy Eyeballs'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'socks5', 'ipv6']
}));

export const connectionTrackingTask = defineTask('connection-tracking', (args, taskCtx) => ({
  kind: 'agent', title: `Connection Tracking - ${args.projectName}`,
  skill: { name: 'proxy-server' },
  agent: { name: 'proxy-expert', prompt: { role: 'Tracking Engineer', task: 'Implement connection tracking', context: args, instructions: ['1. Connection registry', '2. Statistics collection', '3. Bandwidth tracking', '4. Connection limits'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'socks5', 'tracking']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Test Engineer', task: 'Create SOCKS5 tests', context: args, instructions: ['1. Protocol tests', '2. Auth tests', '3. UDP tests', '4. IPv6 tests'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'socks5', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'QA Engineer', task: 'Validate SOCKS5 proxy', context: args, instructions: ['1. RFC compliance', '2. Check auth', '3. Validate tests', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'socks5', 'validation']
}));
