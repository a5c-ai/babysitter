/**
 * @process specializations/network-programming/layer4-load-balancer
 * @description Layer 4 Load Balancer Implementation - Build a TCP/UDP load balancer with connection tracking,
 * health checking, multiple load balancing algorithms, and session persistence.
 * @inputs { projectName: string, language: string, algorithms?: array, features?: object }
 * @outputs { success: boolean, lbConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/layer4-load-balancer', {
 *   projectName: 'High-Performance L4 Load Balancer',
 *   language: 'C',
 *   algorithms: ['round-robin', 'least-connections', 'ip-hash'],
 *   features: { healthCheck: true, sessionPersistence: true, haMode: true }
 * });
 *
 * @references
 * - HAProxy: https://www.haproxy.org/
 * - IPVS: http://www.linuxvirtualserver.org/software/ipvs.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, language = 'C', algorithms = ['round-robin', 'least-connections'], features = { healthCheck: true, sessionPersistence: true }, outputDir = 'layer4-load-balancer' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting L4 Load Balancer: ${projectName}`);

  const phases = [
    { name: 'architecture', task: architectureTask },
    { name: 'connection-handling', task: connectionHandlingTask },
    { name: 'algorithms', task: algorithmsTask },
    { name: 'backend-management', task: backendManagementTask },
    { name: 'health-checking', task: healthCheckingTask },
    { name: 'session-persistence', task: sessionPersistenceTask },
    { name: 'ha-mode', task: haModeTask },
    { name: 'testing', task: testSuiteTask }
  ];

  const results = {};
  for (const phase of phases) {
    const result = await ctx.task(phase.task, { projectName, language, algorithms, features, outputDir });
    results[phase.name] = result;
    artifacts.push(...result.artifacts);
  }

  const validation = await ctx.task(validationTask, { projectName, algorithms, features, results, outputDir });
  artifacts.push(...validation.artifacts);

  return {
    success: validation.overallScore >= 80, projectName,
    lbConfig: { algorithms, features },
    implementation: results,
    testResults: { totalTests: results.testing.totalTests, passedTests: results.testing.passedTests },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/layer4-load-balancer', timestamp: startTime }
  };
}

export const architectureTask = defineTask('architecture', (args, taskCtx) => ({
  kind: 'agent', title: `Architecture - ${args.projectName}`,
  skill: { name: 'load-balancer' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'Systems Architect', task: 'Design L4 LB architecture', context: args, instructions: ['1. NAT vs DSR design', '2. Connection tracking', '3. Data plane design', '4. Control plane design'] }, outputSchema: { type: 'object', required: ['design', 'artifacts'], properties: { design: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'l4']
}));

export const connectionHandlingTask = defineTask('connection-handling', (args, taskCtx) => ({
  kind: 'agent', title: `Connection Handling - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: { name: 'hpc-network-expert', prompt: { role: 'Connection Engineer', task: 'Implement connection handling', context: args, instructions: ['1. Accept connections', '2. Forward to backend', '3. NAT translation', '4. Connection tracking'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'connection']
}));

export const algorithmsTask = defineTask('algorithms', (args, taskCtx) => ({
  kind: 'agent', title: `Algorithms - ${args.projectName}`,
  skill: { name: 'load-balancer' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'Algorithm Engineer', task: 'Implement LB algorithms', context: args, instructions: ['1. Round robin', '2. Least connections', '3. IP hash', '4. Weighted algorithms'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'algorithms']
}));

export const backendManagementTask = defineTask('backend-management', (args, taskCtx) => ({
  kind: 'agent', title: `Backend Management - ${args.projectName}`,
  skill: { name: 'load-balancer' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'Backend Engineer', task: 'Manage backend servers', context: args, instructions: ['1. Add/remove backends', '2. Weight configuration', '3. Drain mode', '4. Dynamic updates'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'backend']
}));

export const healthCheckingTask = defineTask('health-checking', (args, taskCtx) => ({
  kind: 'agent', title: `Health Checking - ${args.projectName}`,
  skill: { name: 'event-loop' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'Health Check Engineer', task: 'Implement health checks', context: args, instructions: ['1. TCP health check', '2. HTTP health check', '3. Check intervals', '4. Failure thresholds'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'health']
}));

export const sessionPersistenceTask = defineTask('session-persistence', (args, taskCtx) => ({
  kind: 'agent', title: `Session Persistence - ${args.projectName}`,
  skill: { name: 'load-balancer' },
  agent: { name: 'load-balancer-expert', prompt: { role: 'Session Engineer', task: 'Implement session persistence', context: args, instructions: ['1. Source IP persistence', '2. Persistence timeout', '3. Shared state', '4. Failover handling'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'session']
}));

export const haModeTask = defineTask('ha-mode', (args, taskCtx) => ({
  kind: 'agent', title: `HA Mode - ${args.projectName}`,
  skill: { name: 'load-balancer' },
  agent: { name: 'hpc-network-expert', prompt: { role: 'HA Engineer', task: 'Implement high availability', context: args, instructions: ['1. Active/passive mode', '2. Health monitoring', '3. Failover mechanism', '4. State synchronization'] }, outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'ha']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent', title: `Test Suite - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'Test Engineer', task: 'Create LB tests', context: args, instructions: ['1. Algorithm tests', '2. Failover tests', '3. Load tests', '4. HA tests'] }, outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent', title: `Validation - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: { name: 'network-testing-expert', prompt: { role: 'QA Engineer', task: 'Validate load balancer', context: args, instructions: ['1. Verify algorithms', '2. Check failover', '3. Validate tests', '4. Calculate score'] }, outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['network', 'load-balancer', 'validation']
}));
