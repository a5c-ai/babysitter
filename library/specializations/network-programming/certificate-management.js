/**
 * @process specializations/network-programming/certificate-management
 * @description Certificate Lifecycle Management System - Build a system for managing TLS certificate lifecycle including
 * generation, renewal, revocation, storage, and monitoring with ACME/Let's Encrypt integration.
 * @inputs { projectName: string, language: string, acmeProvider?: string, storage?: string }
 * @outputs { success: boolean, systemConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/certificate-management', {
 *   projectName: 'Enterprise Cert Manager',
 *   language: 'Go',
 *   acmeProvider: 'letsencrypt',
 *   storage: 'vault'
 * });
 *
 * @references
 * - ACME Protocol: https://www.rfc-editor.org/rfc/rfc8555
 * - Let's Encrypt: https://letsencrypt.org/docs/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName, language = 'Go', acmeProvider = 'letsencrypt', storage = 'filesystem',
    autoRenewal = true, renewalThreshold = 30, outputDir = 'certificate-management'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Certificate Management System: ${projectName}`);

  // Phase 1: System Architecture Design
  const architecture = await ctx.task(architectureTask, { projectName, language, acmeProvider, storage, outputDir });
  artifacts.push(...architecture.artifacts);

  // Phase 2: ACME Client Implementation
  const acmeClient = await ctx.task(acmeClientTask, { projectName, language, acmeProvider, outputDir });
  artifacts.push(...acmeClient.artifacts);

  // Phase 3: Certificate Storage
  const certStorage = await ctx.task(certStorageTask, { projectName, language, storage, outputDir });
  artifacts.push(...certStorage.artifacts);

  // Phase 4: Certificate Generation
  const certGeneration = await ctx.task(certGenerationTask, { projectName, language, acmeClient, outputDir });
  artifacts.push(...certGeneration.artifacts);

  // Phase 5: Auto-Renewal System
  const autoRenewalSystem = await ctx.task(autoRenewalTask, { projectName, language, autoRenewal, renewalThreshold, outputDir });
  artifacts.push(...autoRenewalSystem.artifacts);

  // Phase 6: Revocation Management
  const revocationMgmt = await ctx.task(revocationMgmtTask, { projectName, language, outputDir });
  artifacts.push(...revocationMgmt.artifacts);

  // Phase 7: Monitoring and Alerting
  const monitoring = await ctx.task(monitoringTask, { projectName, language, outputDir });
  artifacts.push(...monitoring.artifacts);

  // Phase 8: API and CLI
  const apiCli = await ctx.task(apiCliTask, { projectName, language, outputDir });
  artifacts.push(...apiCli.artifacts);

  // Phase 9: Testing and Validation
  const [testSuite, validation] = await ctx.parallel.all([
    () => ctx.task(testSuiteTask, { projectName, language, outputDir }),
    () => ctx.task(validationTask, { projectName, outputDir })
  ]);
  artifacts.push(...testSuite.artifacts, ...validation.artifacts);

  await ctx.breakpoint({
    question: `Certificate Management System Complete for ${projectName}! Validation: ${validation.overallScore}/100. Review?`,
    title: 'Certificate Management Complete',
    context: { runId: ctx.runId, validationScore: validation.overallScore }
  });

  return {
    success: validation.overallScore >= 80,
    projectName,
    systemConfig: { acmeProvider, storage, autoRenewal, renewalThreshold },
    implementation: {
      acmeClient: acmeClient.implementation,
      storage: certStorage.implementation,
      renewal: autoRenewalSystem.implementation,
      revocation: revocationMgmt.implementation
    },
    testResults: { totalTests: testSuite.totalTests, passedTests: testSuite.passedTests },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/certificate-management', timestamp: startTime }
  };
}

export const architectureTask = defineTask('architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Architecture Design - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: { role: 'Systems Architect', task: 'Design certificate management architecture', context: args,
      instructions: ['1. Design system components', '2. Define data flows', '3. Plan integrations', '4. Document architecture'] },
    outputSchema: { type: 'object', required: ['design', 'artifacts'], properties: { design: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'certificates', 'architecture']
}));

export const acmeClientTask = defineTask('acme-client', (args, taskCtx) => ({
  kind: 'agent',
  title: `ACME Client - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: { role: 'ACME Protocol Engineer', task: 'Implement ACME client', context: args,
      instructions: ['1. Implement ACME account registration', '2. Implement challenges (HTTP-01, DNS-01)', '3. Handle certificate issuance', '4. Implement error handling'] },
    outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'certificates', 'acme']
}));

export const certStorageTask = defineTask('cert-storage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Certificate Storage - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: { role: 'Storage Engineer', task: 'Implement secure certificate storage', context: args,
      instructions: ['1. Implement storage backend', '2. Encrypt private keys', '3. Implement access control', '4. Add audit logging'] },
    outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'certificates', 'storage']
}));

export const certGenerationTask = defineTask('cert-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Certificate Generation - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: { role: 'Certificate Engineer', task: 'Implement certificate generation', context: args,
      instructions: ['1. Generate CSR', '2. Request certificate', '3. Validate issuance', '4. Store certificate'] },
    outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'certificates', 'generation']
}));

export const autoRenewalTask = defineTask('auto-renewal', (args, taskCtx) => ({
  kind: 'agent',
  title: `Auto-Renewal - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: { role: 'Certificate Renewal Engineer', task: 'Implement automatic renewal', context: args,
      instructions: ['1. Monitor expiration dates', '2. Trigger renewal before expiry', '3. Handle renewal failures', '4. Notify on renewal events'] },
    outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'certificates', 'renewal']
}));

export const revocationMgmtTask = defineTask('revocation-mgmt', (args, taskCtx) => ({
  kind: 'agent',
  title: `Revocation Management - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: { role: 'Revocation Engineer', task: 'Implement certificate revocation', context: args,
      instructions: ['1. Implement revocation API', '2. Notify ACME provider', '3. Update internal state', '4. Handle revocation events'] },
    outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'certificates', 'revocation']
}));

export const monitoringTask = defineTask('monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitoring - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: { role: 'Monitoring Engineer', task: 'Implement certificate monitoring', context: args,
      instructions: ['1. Monitor certificate expiry', '2. Track renewal status', '3. Set up alerting', '4. Create dashboard'] },
    outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'certificates', 'monitoring']
}));

export const apiCliTask = defineTask('api-cli', (args, taskCtx) => ({
  kind: 'agent',
  title: `API and CLI - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: { role: 'API Engineer', task: 'Build management API and CLI', context: args,
      instructions: ['1. Design REST API', '2. Implement CLI commands', '3. Add authentication', '4. Document API'] },
    outputSchema: { type: 'object', required: ['implementation', 'artifacts'], properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'certificates', 'api']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Suite - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: { role: 'Test Engineer', task: 'Create comprehensive tests', context: args,
      instructions: ['1. Test ACME workflow', '2. Test renewal', '3. Test revocation', '4. Test storage'] },
    outputSchema: { type: 'object', required: ['totalTests', 'passedTests', 'artifacts'], properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'certificates', 'testing']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validation - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: { role: 'QA Engineer', task: 'Validate implementation', context: args,
      instructions: ['1. Verify features', '2. Check security', '3. Validate tests', '4. Calculate score'] },
    outputSchema: { type: 'object', required: ['overallScore', 'passedChecks', 'artifacts'], properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'certificates', 'validation']
}));
