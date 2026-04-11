/**
 * @process specializations/mobile-development/mobile-security-implementation
 * @description Mobile App Security Implementation - Comprehensive security including data encryption,
 * secure storage, certificate pinning, biometric authentication, and vulnerability protection.
 * @inputs { appName: string, platforms: array, securityLevel?: string, compliance?: array }
 * @outputs { success: boolean, securityReport: object, implementations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/mobile-security-implementation', {
 *   appName: 'MyApp',
 *   platforms: ['ios', 'android'],
 *   securityLevel: 'high',
 *   compliance: ['OWASP-MASVS', 'GDPR', 'PCI-DSS']
 * });
 *
 * @references
 * - OWASP MASVS: https://owasp.org/www-project-mobile-application-security/
 * - iOS Security: https://developer.apple.com/documentation/security
 * - Android Security: https://developer.android.com/topic/security/best-practices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    platforms = ['ios', 'android'],
    securityLevel = 'high',
    compliance = ['OWASP-MASVS'],
    outputDir = 'security-implementation'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Security Implementation: ${appName}`);
  ctx.log('info', `Security Level: ${securityLevel}, Compliance: ${compliance.join(', ')}`);

  const phases = [
    { name: 'security-assessment', title: 'Security Assessment' },
    { name: 'data-encryption', title: 'Data Encryption Implementation' },
    { name: 'secure-storage', title: 'Secure Storage (Keychain/Keystore)' },
    { name: 'network-security', title: 'Network Security and TLS' },
    { name: 'certificate-pinning', title: 'Certificate Pinning' },
    { name: 'biometric-auth', title: 'Biometric Authentication' },
    { name: 'token-management', title: 'Token and Session Management' },
    { name: 'input-validation', title: 'Input Validation and Sanitization' },
    { name: 'code-obfuscation', title: 'Code Obfuscation' },
    { name: 'root-jailbreak-detection', title: 'Root/Jailbreak Detection' },
    { name: 'tamper-detection', title: 'Tamper Detection' },
    { name: 'logging-security', title: 'Secure Logging Implementation' },
    { name: 'vulnerability-scanning', title: 'Vulnerability Scanning' },
    { name: 'penetration-testing', title: 'Penetration Testing' },
    { name: 'compliance-validation', title: 'Compliance Validation' }
  ];

  for (const phase of phases) {
    ctx.log('info', `Processing: ${phase.title}`);
    const result = await ctx.task(createSecurityTask(phase.name, phase.title), {
      appName, platforms, securityLevel, compliance, outputDir
    });
    artifacts.push(...result.artifacts);
  }

  await ctx.breakpoint({
    question: `Security implementation complete for ${appName}. Ready for security audit?`,
    title: 'Security Review',
    context: { runId: ctx.runId, appName, securityLevel, compliance }
  });

  const endTime = ctx.now();
  return {
    success: true,
    appName,
    platforms,
    securityLevel,
    compliance,
    securityReport: { status: 'implemented', phases: phases.length },
    implementations: phases.map(p => p.title),
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/mobile-development/mobile-security-implementation', timestamp: startTime }
  };
}

function createSecurityTask(name, title) {
  return (args, taskCtx) => ({
    kind: 'agent',
    title: `${title} - ${args.appName}`,
    skill: { name: 'secure-storage' },
    agent: {
      name: 'cross-platform-architect',
      prompt: {
        role: 'Mobile Security Engineer',
        task: `Implement ${title.toLowerCase()} for mobile security`,
        context: args,
        instructions: [
          `1. Assess ${title.toLowerCase()} requirements`,
          `2. Implement for ${args.platforms.join(' and ')}`,
          `3. Follow ${args.compliance.join(', ')} guidelines`,
          `4. Test security implementation`,
          `5. Document security measures`
        ],
        outputFormat: 'JSON with security details'
      },
      outputSchema: {
        type: 'object',
        required: ['implementation', 'artifacts'],
        properties: { implementation: { type: 'object' }, vulnerabilities: { type: 'array' }, artifacts: { type: 'array' } }
      }
    },
    io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
    labels: ['mobile', 'security', name]
  });
}

export const securityAssessmentTask = createSecurityTask('security-assessment', 'Security Assessment');
export const dataEncryptionTask = createSecurityTask('data-encryption', 'Data Encryption Implementation');
export const secureStorageTask = createSecurityTask('secure-storage', 'Secure Storage (Keychain/Keystore)');
export const networkSecurityTask = createSecurityTask('network-security', 'Network Security and TLS');
export const certificatePinningTask = createSecurityTask('certificate-pinning', 'Certificate Pinning');
export const biometricAuthTask = createSecurityTask('biometric-auth', 'Biometric Authentication');
export const tokenManagementTask = createSecurityTask('token-management', 'Token and Session Management');
export const inputValidationTask = createSecurityTask('input-validation', 'Input Validation and Sanitization');
export const codeObfuscationTask = createSecurityTask('code-obfuscation', 'Code Obfuscation');
export const rootJailbreakTask = createSecurityTask('root-jailbreak-detection', 'Root/Jailbreak Detection');
export const tamperDetectionTask = createSecurityTask('tamper-detection', 'Tamper Detection');
export const loggingSecurityTask = createSecurityTask('logging-security', 'Secure Logging Implementation');
export const vulnerabilityScanningTask = createSecurityTask('vulnerability-scanning', 'Vulnerability Scanning');
export const penetrationTestingTask = createSecurityTask('penetration-testing', 'Penetration Testing');
export const complianceValidationTask = createSecurityTask('compliance-validation', 'Compliance Validation');
