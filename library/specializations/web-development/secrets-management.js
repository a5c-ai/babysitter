/**
 * @process specializations/web-development/secrets-management
 * @description Secrets Management - Process for implementing secure secrets management with environment variables, vaults, and rotation strategies.
 * @inputs { projectName: string, provider?: string }
 * @outputs { success: boolean, secretsConfig: object, policies: array, artifacts: array }
 * @references - OWASP Secrets: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, provider = 'vault', outputDir = 'secrets-management' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Secrets Management: ${projectName}`);

  const secretsAudit = await ctx.task(secretsAuditTask, { projectName, outputDir });
  artifacts.push(...secretsAudit.artifacts);

  const vaultSetup = await ctx.task(vaultSetupTask, { projectName, provider, outputDir });
  artifacts.push(...vaultSetup.artifacts);

  const rotationSetup = await ctx.task(rotationSetupTask, { projectName, outputDir });
  artifacts.push(...rotationSetup.artifacts);

  const accessControl = await ctx.task(accessControlTask, { projectName, outputDir });
  artifacts.push(...accessControl.artifacts);

  await ctx.breakpoint({ question: `Secrets management complete for ${projectName}. Approve?`, title: 'Secrets Review', context: { runId: ctx.runId, config: vaultSetup.config } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, secretsConfig: vaultSetup.config, policies: accessControl.policies, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/secrets-management', timestamp: startTime } };
}

export const secretsAuditTask = defineTask('secrets-audit', (args, taskCtx) => ({ kind: 'agent', title: `Secrets Audit - ${args.projectName}`, agent: { name: 'secrets-auditor', prompt: { role: 'Secrets Auditor', task: 'Audit secrets usage', context: args, instructions: ['1. Scan for hardcoded secrets', '2. Check .env files', '3. Review git history', '4. Check CI/CD secrets', '5. Audit environment vars', '6. Review config files', '7. Check Docker images', '8. Scan dependencies', '9. Check logs', '10. Document findings'], outputFormat: 'JSON with audit' }, outputSchema: { type: 'object', required: ['findings', 'artifacts'], properties: { findings: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'security', 'secrets', 'audit'] }));

export const vaultSetupTask = defineTask('vault-setup', (args, taskCtx) => ({ kind: 'agent', title: `Vault Setup - ${args.projectName}`, agent: { name: 'vault-specialist', prompt: { role: 'Vault Specialist', task: 'Configure secrets vault', context: args, instructions: ['1. Set up vault provider', '2. Configure authentication', '3. Set up secret paths', '4. Configure encryption', '5. Set up namespaces', '6. Configure policies', '7. Set up auditing', '8. Configure HA', '9. Set up backup', '10. Document vault'], outputFormat: 'JSON with vault setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'security', 'vault'] }));

export const rotationSetupTask = defineTask('rotation-setup', (args, taskCtx) => ({ kind: 'agent', title: `Rotation Setup - ${args.projectName}`, agent: { name: 'secrets-rotation-specialist', prompt: { role: 'Secrets Rotation Specialist', task: 'Configure secret rotation', context: args, instructions: ['1. Configure auto-rotation', '2. Set up rotation schedules', '3. Configure zero-downtime', '4. Set up notifications', '5. Configure database rotation', '6. Set up API key rotation', '7. Configure certificate rotation', '8. Set up emergency rotation', '9. Configure audit logging', '10. Document rotation'], outputFormat: 'JSON with rotation' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'security', 'rotation'] }));

export const accessControlTask = defineTask('access-control', (args, taskCtx) => ({ kind: 'agent', title: `Access Control - ${args.projectName}`, agent: { name: 'access-control-specialist', prompt: { role: 'Access Control Specialist', task: 'Configure access control', context: args, instructions: ['1. Define access policies', '2. Configure RBAC', '3. Set up service accounts', '4. Configure least privilege', '5. Set up approval workflows', '6. Configure time-based access', '7. Set up break-glass', '8. Configure MFA', '9. Set up audit trails', '10. Document policies'], outputFormat: 'JSON with access control' }, outputSchema: { type: 'object', required: ['policies', 'artifacts'], properties: { policies: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'security', 'access-control'] }));

export const documentationTask = defineTask('secrets-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate secrets documentation', context: args, instructions: ['1. Create README', '2. Document vault setup', '3. Create rotation guide', '4. Document access control', '5. Create emergency procedures', '6. Document audit logs', '7. Create troubleshooting', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'security', 'documentation'] }));
