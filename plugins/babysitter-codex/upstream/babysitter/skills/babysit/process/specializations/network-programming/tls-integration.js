/**
 * @process specializations/network-programming/tls-integration
 * @description TLS Integration for Socket Server - Add TLS/SSL encryption to an existing socket server with proper
 * certificate management, cipher suite configuration, session resumption, and security testing.
 * @inputs { projectName: string, language: string, tlsLibrary?: string, tlsVersion?: string, certificates?: object }
 * @outputs { success: boolean, tlsConfig: object, implementation: object, securityAudit: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/tls-integration', {
 *   projectName: 'Secure API Server',
 *   language: 'Go',
 *   tlsLibrary: 'crypto/tls',
 *   tlsVersion: '1.3',
 *   certificates: {
 *     certPath: '/etc/ssl/server.crt',
 *     keyPath: '/etc/ssl/server.key'
 *   }
 * });
 *
 * @references
 * - OpenSSL: https://www.openssl.org/docs/
 * - Mozilla SSL Config: https://ssl-config.mozilla.org/
 * - TLS 1.3 RFC: https://www.rfc-editor.org/rfc/rfc8446
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'C',
    tlsLibrary = 'OpenSSL',
    tlsVersion = '1.3',
    certificates = {},
    cipherSuites = 'modern',
    outputDir = 'tls-integration'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting TLS Integration: ${projectName}`);
  ctx.log('info', `Library: ${tlsLibrary}, TLS Version: ${tlsVersion}`);

  // Phase 1: TLS Library Selection
  const librarySelection = await ctx.task(librarySelectionTask, { projectName, language, tlsLibrary, tlsVersion, outputDir });
  artifacts.push(...librarySelection.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: Selected ${tlsLibrary} for TLS ${tlsVersion}. Proceed with certificate setup?`,
    title: 'TLS Library Selection Review',
    context: { runId: ctx.runId, library: librarySelection.library }
  });

  // Phase 2: Certificate Generation/Obtaining
  const certificateSetup = await ctx.task(certificateSetupTask, { projectName, certificates, outputDir });
  artifacts.push(...certificateSetup.artifacts);

  // Phase 3: TLS Context Initialization
  const tlsContext = await ctx.task(tlsContextTask, { projectName, language, tlsLibrary, librarySelection, outputDir });
  artifacts.push(...tlsContext.artifacts);

  // Phase 4: Handshake Implementation
  const handshakeImplementation = await ctx.task(handshakeTask, { projectName, language, tlsLibrary, tlsContext, outputDir });
  artifacts.push(...handshakeImplementation.artifacts);

  // Phase 5: Socket Wrapping
  const socketWrapping = await ctx.task(socketWrappingTask, { projectName, language, tlsLibrary, handshakeImplementation, outputDir });
  artifacts.push(...socketWrapping.artifacts);

  // Phase 6: Cipher Suite Configuration
  const cipherConfig = await ctx.task(cipherConfigTask, { projectName, tlsVersion, cipherSuites, tlsContext, outputDir });
  artifacts.push(...cipherConfig.artifacts);

  await ctx.breakpoint({
    question: `Phase 6 Complete: Cipher suites configured (${cipherSuites} profile). Proceed with certificate validation?`,
    title: 'Cipher Configuration Review',
    context: { runId: ctx.runId, ciphers: cipherConfig.enabledCiphers }
  });

  // Phase 7: Certificate Validation
  const certValidation = await ctx.task(certValidationTask, { projectName, language, tlsLibrary, outputDir });
  artifacts.push(...certValidation.artifacts);

  // Phase 8: Session Resumption
  const sessionResumption = await ctx.task(sessionResumptionTask, { projectName, language, tlsVersion, outputDir });
  artifacts.push(...sessionResumption.artifacts);

  // Phase 9: Security Testing
  const securityTesting = await ctx.task(securityTestingTask, { projectName, tlsVersion, cipherConfig, outputDir });
  artifacts.push(...securityTesting.artifacts);

  // Phase 10: Documentation and Validation
  const [documentation, validation] = await ctx.parallel.all([
    () => ctx.task(documentationTask, { projectName, librarySelection, certificateSetup, tlsContext, cipherConfig, sessionResumption, outputDir }),
    () => ctx.task(validationTask, { projectName, securityTesting, outputDir })
  ]);
  artifacts.push(...documentation.artifacts, ...validation.artifacts);

  await ctx.breakpoint({
    question: `TLS Integration Complete for ${projectName}! Security score: ${securityTesting.securityScore}/100. Validation: ${validation.overallScore}/100. Review?`,
    title: 'TLS Integration Complete',
    context: { runId: ctx.runId, securityScore: securityTesting.securityScore, validationScore: validation.overallScore }
  });

  return {
    success: validation.overallScore >= 80 && securityTesting.securityScore >= 80,
    projectName,
    tlsConfig: { library: tlsLibrary, version: tlsVersion, cipherSuites: cipherConfig.enabledCiphers },
    implementation: {
      tlsContext: tlsContext.implementation,
      handshake: handshakeImplementation.implementation,
      socketWrapping: socketWrapping.implementation,
      sessionResumption: sessionResumption.implementation
    },
    securityAudit: {
      securityScore: securityTesting.securityScore,
      vulnerabilities: securityTesting.vulnerabilities,
      recommendations: securityTesting.recommendations
    },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/network-programming/tls-integration', timestamp: startTime }
  };
}

export const librarySelectionTask = defineTask('library-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `TLS Library Selection - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'Security Architect',
      task: 'Select and configure TLS library',
      context: args,
      instructions: ['1. Evaluate TLS library options', '2. Verify TLS version support', '3. Check platform compatibility', '4. Document library setup']
    },
    outputSchema: {
      type: 'object',
      required: ['library', 'configuration', 'artifacts'],
      properties: { library: { type: 'object' }, configuration: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'tls', 'security']
}));

export const certificateSetupTask = defineTask('certificate-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Certificate Setup - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'Certificate Engineer',
      task: 'Generate or configure certificates',
      context: args,
      instructions: ['1. Generate or obtain certificates', '2. Configure certificate paths', '3. Set up certificate chain', '4. Document certificate management']
    },
    outputSchema: {
      type: 'object',
      required: ['certificates', 'artifacts'],
      properties: { certificates: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'tls', 'certificates']
}));

export const tlsContextTask = defineTask('tls-context', (args, taskCtx) => ({
  kind: 'agent',
  title: `TLS Context - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'TLS Implementation Engineer',
      task: 'Initialize TLS context',
      context: args,
      instructions: ['1. Create TLS context', '2. Load certificates', '3. Configure protocol versions', '4. Set security options']
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'tls', 'context']
}));

export const handshakeTask = defineTask('handshake', (args, taskCtx) => ({
  kind: 'agent',
  title: `TLS Handshake - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'TLS Handshake Engineer',
      task: 'Implement TLS handshake handling',
      context: args,
      instructions: ['1. Implement server handshake', '2. Handle handshake errors', '3. Add SNI support', '4. Implement ALPN negotiation']
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'tls', 'handshake']
}));

export const socketWrappingTask = defineTask('socket-wrapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Socket Wrapping - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'TLS Socket Engineer',
      task: 'Wrap socket operations with TLS',
      context: args,
      instructions: ['1. Wrap read operations', '2. Wrap write operations', '3. Handle partial TLS records', '4. Implement shutdown']
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'tls', 'socket']
}));

export const cipherConfigTask = defineTask('cipher-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cipher Configuration - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'Cipher Suite Engineer',
      task: 'Configure cipher suites and protocols',
      context: args,
      instructions: ['1. Select secure cipher suites', '2. Disable weak ciphers', '3. Configure forward secrecy', '4. Document cipher selection']
    },
    outputSchema: {
      type: 'object',
      required: ['enabledCiphers', 'artifacts'],
      properties: { enabledCiphers: { type: 'array' }, disabledCiphers: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'tls', 'cipher']
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
      instructions: ['1. Validate certificate chain', '2. Check certificate expiry', '3. Verify hostname', '4. Handle validation errors']
    },
    outputSchema: {
      type: 'object',
      required: ['validationRules', 'artifacts'],
      properties: { validationRules: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'tls', 'validation']
}));

export const sessionResumptionTask = defineTask('session-resumption', (args, taskCtx) => ({
  kind: 'agent',
  title: `Session Resumption - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'TLS Session Engineer',
      task: 'Implement session resumption support',
      context: args,
      instructions: ['1. Implement session tickets', '2. Configure session cache', '3. Handle 0-RTT if TLS 1.3', '4. Add session metrics']
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: { implementation: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'tls', 'session']
}));

export const securityTestingTask = defineTask('security-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security Testing - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'Security Testing Engineer',
      task: 'Conduct TLS security testing',
      context: args,
      instructions: ['1. Test cipher strength', '2. Check for vulnerabilities', '3. Verify protocol compliance', '4. Generate security report']
    },
    outputSchema: {
      type: 'object',
      required: ['securityScore', 'vulnerabilities', 'recommendations', 'artifacts'],
      properties: { securityScore: { type: 'number' }, vulnerabilities: { type: 'array' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'tls', 'security-testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Documentation - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate TLS integration documentation',
      context: args,
      instructions: ['1. Document TLS configuration', '2. Create certificate management guide', '3. Document security settings', '4. Create troubleshooting guide']
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'artifacts'],
      properties: { readmePath: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'tls', 'documentation']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validation - ${args.projectName}`,
  skill: { name: 'tls-security' },
  agent: {
    name: 'network-security-expert',
    prompt: {
      role: 'QA Engineer',
      task: 'Validate TLS integration',
      context: args,
      instructions: ['1. Verify TLS functionality', '2. Check security compliance', '3. Validate documentation', '4. Calculate validation score']
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'passedChecks', 'artifacts'],
      properties: { overallScore: { type: 'number' }, passedChecks: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['network', 'tls', 'validation']
}));
