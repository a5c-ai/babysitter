/**
 * @process specializations/web-development/mfa-implementation
 * @description Multi-Factor Authentication (MFA) Implementation - Process for implementing MFA with TOTP, SMS verification,
 * email codes, backup codes, and recovery options.
 * @inputs { projectName: string, methods?: array, features?: object }
 * @outputs { success: boolean, mfaMethods: array, config: object, artifacts: array }
 *
 * @references
 * - TOTP RFC 6238: https://datatracker.ietf.org/doc/html/rfc6238
 * - WebAuthn: https://webauthn.guide/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    methods = ['totp', 'email'],
    features = { backupCodes: true, webauthn: false },
    outputDir = 'mfa-implementation'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MFA Implementation: ${projectName}`);

  const mfaSetup = await ctx.task(mfaSetupTask, { projectName, methods, outputDir });
  artifacts.push(...mfaSetup.artifacts);

  const totpSetup = await ctx.task(totpSetupTask, { projectName, outputDir });
  artifacts.push(...totpSetup.artifacts);

  const smsEmailSetup = await ctx.task(smsEmailSetupTask, { projectName, methods, outputDir });
  artifacts.push(...smsEmailSetup.artifacts);

  const backupCodesSetup = await ctx.task(backupCodesSetupTask, { projectName, features, outputDir });
  artifacts.push(...backupCodesSetup.artifacts);

  const recoverySetup = await ctx.task(recoverySetupTask, { projectName, outputDir });
  artifacts.push(...recoverySetup.artifacts);

  await ctx.breakpoint({
    question: `MFA implementation complete for ${projectName}. ${methods.length} methods configured. Approve?`,
    title: 'MFA Review',
    context: { runId: ctx.runId, methods: mfaSetup.configuredMethods }
  });

  const documentation = await ctx.task(documentationTask, { projectName, mfaSetup, outputDir });
  artifacts.push(...documentation.artifacts);

  return {
    success: true,
    projectName,
    mfaMethods: mfaSetup.configuredMethods,
    config: mfaSetup.config,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/web-development/mfa-implementation', timestamp: startTime }
  };
}

export const mfaSetupTask = defineTask('mfa-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `MFA Setup - ${args.projectName}`,
  agent: {
    name: 'mfa-developer',
    prompt: { role: 'MFA Developer', task: 'Set up MFA infrastructure', context: args,
      instructions: ['1. Install MFA libraries', '2. Configure MFA storage', '3. Set up enrollment flow', '4. Configure verification', '5. Set up remember device', '6. Configure rate limiting', '7. Set up audit logging', '8. Configure UI components', '9. Set up utilities', '10. Document setup'],
      outputFormat: 'JSON with MFA setup'
    },
    outputSchema: { type: 'object', required: ['config', 'configuredMethods', 'artifacts'], properties: { config: { type: 'object' }, configuredMethods: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'mfa', 'setup']
}));

export const totpSetupTask = defineTask('totp-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `TOTP Setup - ${args.projectName}`,
  agent: {
    name: 'totp-specialist',
    prompt: { role: 'TOTP Specialist', task: 'Implement TOTP authentication', context: args,
      instructions: ['1. Generate TOTP secrets', '2. Create QR code generation', '3. Implement verification', '4. Set up time drift handling', '5. Configure secret storage', '6. Create enrollment flow', '7. Implement recovery', '8. Set up authenticator app support', '9. Configure testing', '10. Document TOTP'],
      outputFormat: 'JSON with TOTP setup'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'mfa', 'totp']
}));

export const smsEmailSetupTask = defineTask('sms-email-mfa', (args, taskCtx) => ({
  kind: 'agent',
  title: `SMS/Email MFA - ${args.projectName}`,
  agent: {
    name: 'sms-email-mfa-specialist',
    prompt: { role: 'SMS/Email MFA Specialist', task: 'Implement SMS and email verification', context: args,
      instructions: ['1. Configure SMS provider', '2. Set up email templates', '3. Implement code generation', '4. Set up code expiration', '5. Configure rate limiting', '6. Implement verification', '7. Set up resend logic', '8. Configure fallback', '9. Handle delivery failures', '10. Document SMS/Email'],
      outputFormat: 'JSON with SMS/Email setup'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'mfa', 'sms', 'email']
}));

export const backupCodesSetupTask = defineTask('backup-codes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Backup Codes - ${args.projectName}`,
  agent: {
    name: 'backup-codes-specialist',
    prompt: { role: 'Backup Codes Specialist', task: 'Implement backup codes', context: args,
      instructions: ['1. Generate secure codes', '2. Implement code storage', '3. Set up code usage tracking', '4. Create regeneration flow', '5. Configure code format', '6. Implement verification', '7. Set up download/print', '8. Configure warnings', '9. Handle low codes', '10. Document backup codes'],
      outputFormat: 'JSON with backup codes setup'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'mfa', 'backup-codes']
}));

export const recoverySetupTask = defineTask('mfa-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Recovery Setup - ${args.projectName}`,
  agent: {
    name: 'recovery-specialist',
    prompt: { role: 'Recovery Specialist', task: 'Implement MFA recovery', context: args,
      instructions: ['1. Create recovery flow', '2. Implement identity verification', '3. Set up admin recovery', '4. Configure recovery email', '5. Implement security questions', '6. Set up cooldown periods', '7. Configure audit logging', '8. Implement notifications', '9. Set up fraud detection', '10. Document recovery'],
      outputFormat: 'JSON with recovery setup'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'mfa', 'recovery']
}));

export const documentationTask = defineTask('mfa-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: { role: 'Technical Writer', task: 'Generate MFA documentation', context: args,
      instructions: ['1. Create README', '2. Document setup flow', '3. Create user guides', '4. Document methods', '5. Create recovery guide', '6. Document integration', '7. Create testing guide', '8. Document security', '9. Create troubleshooting', '10. Generate examples'],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'documentation']
}));
