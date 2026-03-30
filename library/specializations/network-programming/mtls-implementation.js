/**
 * @process specializations/network-programming/mtls-implementation
 * @description Mutual TLS (mTLS) Implementation - Implement mutual TLS authentication where both client and server
 * verify certificates, including CA setup, client certificate validation, revocation checking, and certificate rotation.
 * @inputs { projectName: string, language: string, caConfig?: object, clientCertPolicy?: string }
 * @outputs { success: boolean, mtlsConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/mtls-implementation', {
 *   projectName: 'Zero Trust API Gateway',
 *   language: 'Go',
 *   caConfig: {
 *     rootCA: '/etc/ssl/ca.crt',
 *     intermediateCA: '/etc/ssl/intermediate.crt'
 *   },
 *   clientCertPolicy: 'require-and-verify'
 * });
 *
 * @references
 * - mTLS Best Practices: https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/
 * - X.509 Certificates: https://www.rfc-editor.org/rfc/rfc5280
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'Go',
    caConfig = {},
    clientCertPolicy = 'require-and-verify',
    revocationChecking = true,
    outputDir = 'mtls-implementation'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting mTLS Implementation: ${projectName}`);
  ctx.log('info', `Policy: ${clientCertPolicy}, Revocation Checking: ${revocationChecking}`);

  // Phase 1: CA Infrastructure Setup
  const caSetup = await ctx.task(caSetupTask, { projectName, caConfig, outputDir });
  artifacts.push(...caSetup.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: CA infrastructure configured. Root CA: ${caSetup.rootCA}. Proceed with server certificate configuration?`,
    title: 'CA Setup Review',
    context: { runId: ctx.runId, caSetup: caSetup.configuration }
  });

  // Phase 2: Server Certificate Configuration
  const serverCertConfig = await ctx.task(serverCertTask, { projectName, language, caSetup, outputDir });
  artifacts.push(...serverCertConfig.artifacts);

  // Phase 3: Client Certificate Configuration
  const clientCertConfig = await ctx.task(clientCertTask, { projectName, language, caSetup, clientCertPolicy, outputDir });
  artifacts.push(...clientCertConfig.artifacts);

  // Phase 4: Certificate Validation Implementation
  const certValidation = await ctx.task(certValidationTask, { projectName, language, clientCertPolicy, caSetup, outputDir });
  artifacts.push(...certValidation.artifacts);

  // Phase 5: Revocation Checking (CRL/OCSP)
  const revocationConfig = await ctx.task(revocationTask, { projectName, language, revocationChecking, caSetup, outputDir });
  artifacts.push(...revocationConfig.artifacts);

  await ctx.breakpoint({
    question: `Phase 5 Complete: Revocation checking configured (${revocationConfig.method}). Proceed with certificate rotation?`,
    title: 'Revocation Checking Review',
    context: { runId: ctx.runId, revocationMethod: revocationConfig.method }
  });

  // Phase 6: Certificate Rotation
  const certRotation = await ctx.task(certRotationTask, { projectName, language, outputDir });
  artifacts.push(...certRotation.artifacts);

  // Phase 7: Client Identity Extraction
  const identityExtraction = await ctx.task(identityExtractionTask, { projectName, language, outputDir });
  artifacts.push(...identityExtraction.artifacts);

  // Phase 8: Testing
  const testSuite = await ctx.task(testSuiteTask, { projectName, language, clientCertPolicy, outputDir });
  artifacts.push(...testSuite.artifacts);

  // Phase 9: Documentation and Validation
  const [documentation, validation] = await ctx.parallel.all([
    () => ctx.task(documentationTask, { projectName, caSetup, serverCertConfig, clientCertConfig, certValidation, revocationConfig, certRotation, outputDir }),
    () => ctx.task(validationTask, { projectName, testSuite, outputDir })
  ]);
  artifacts.push(...documentation.artifacts, ...validation.artifacts);

  await ctx.breakpoint({
    question: `mTLS Implementation Complete for ${projectName}! Validation: ${validation.overallScore}/100. Tests: ${testSuite.passedTests}/${testSuite.totalTests}. Review?`,
    title: 'mTLS Implementation Complete',
    context: { runId: ctx.runId, validationScore: validation.overallScore }
  });

  return {
    success: validation.overallScore >= 80,
    projectName,
    mtlsConfig: { clientCertPolicy, revocationChecking, revocationMethod: revocationConfig.method },
    implementation: {
      serverCert: serverCertConfig.implementation,
      clientCert: clientCertConfig.implementation,
      validation: certValidation.implementation,
      revocation: revocationConfig.implementation,
      rotation: certRotation.implementation
    },
    testResults: { totalTests: testSuite.totalTests, passedTests: testSuite.passedTests },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/mtls-implementation', timestamp: startTime }
  };
}

export const caSetupTask = defineTask('ca-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `CA Setup - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'PKI Infrastructure Engineer',
      task: 'Set up Certificate Authority infrastructure',
      context: args,
      instructions: ['1. Configure root CA', '2. Set up intermediate CA', '3. Configure trust store', '4. Document CA hierarchy']
    },
    outputSchema: {
      type: 'object',
      required: ['rootCA', 'configuration', 'artifacts'],
      properties: { rootCA: { type: 'string' }, configuration: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'mtls', 'pki']
}));

export const serverCertTask = defineTask('server-cert', (args, taskCtx) => ({
  kind: 'agent',
  title: `Server Certificate - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'Certificate Engineer',
      task: 'Configure server certificates',
      context: args,
      instructions: ['1. Generate or load server cert', '2. Configure certificate chain', '3. Set up private key handling', '4. Configure SNI']
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'mtls', 'server-cert']
}));

export const clientCertTask = defineTask('client-cert', (args, taskCtx) => ({
  kind: 'agent',
  title: `Client Certificate - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'Client Certificate Engineer',
      task: 'Configure client certificate requirements',
      context: args,
      instructions: ['1. Configure client cert policy', '2. Set up client CA trust', '3. Configure cert request handling', '4. Document requirements']
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'mtls', 'client-cert']
}));

export const certValidationTask = defineTask('cert-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Certificate Validation - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'Certificate Validation Engineer',
      task: 'Implement certificate validation',
      context: args,
      instructions: ['1. Validate certificate chain', '2. Check key usage', '3. Verify extended key usage', '4. Validate certificate fields']
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'mtls', 'validation']
}));

export const revocationTask = defineTask('revocation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Revocation Checking - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'Certificate Revocation Engineer',
      task: 'Implement revocation checking',
      context: args,
      instructions: ['1. Configure CRL checking', '2. Implement OCSP', '3. Set up OCSP stapling', '4. Handle revocation failures']
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'implementation', 'artifacts'],
      properties: { method: { type: 'string' }, implementation: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'mtls', 'revocation']
}));

export const certRotationTask = defineTask('cert-rotation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Certificate Rotation - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'Certificate Rotation Engineer',
      task: 'Implement certificate rotation',
      context: args,
      instructions: ['1. Design rotation strategy', '2. Implement hot reload', '3. Handle rotation triggers', '4. Add rotation monitoring']
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'mtls', 'rotation']
}));

export const identityExtractionTask = defineTask('identity-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Identity Extraction - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'Identity Engineer',
      task: 'Extract client identity from certificates',
      context: args,
      instructions: ['1. Extract Subject DN', '2. Extract SAN fields', '3. Map to application identity', '4. Integrate with authz']
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'mtls', 'identity']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Suite - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'mTLS Test Engineer',
      task: 'Create mTLS test suite',
      context: args,
      instructions: ['1. Test valid client certs', '2. Test invalid certs', '3. Test revoked certs', '4. Test cert rotation']
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passedTests', 'artifacts'],
      properties: { totalTests: { type: 'number' }, passedTests: { type: 'number' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'mtls', 'testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Documentation - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate mTLS documentation',
      context: args,
      instructions: ['1. Document CA setup', '2. Document client cert requirements', '3. Create rotation guide', '4. Create troubleshooting guide']
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'artifacts'],
      properties: { readmePath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'mtls', 'documentation']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validation - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'QA Engineer',
      task: 'Validate mTLS implementation',
      context: args,
      instructions: ['1. Verify security requirements', '2. Check test coverage', '3. Validate documentation', '4. Calculate score']
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'passedChecks', 'artifacts'],
      properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'mtls', 'validation']
}));
