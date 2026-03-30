/**
 * @process specializations/web-development/content-security-policy
 * @description Content Security Policy - Process for implementing comprehensive CSP headers for XSS prevention and security hardening.
 * @inputs { projectName: string, strictness?: string }
 * @outputs { success: boolean, cspPolicy: object, directives: array, artifacts: array }
 * @references - CSP: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, strictness = 'strict', outputDir = 'content-security-policy' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Content Security Policy: ${projectName}`);

  const cspAnalysis = await ctx.task(cspAnalysisTask, { projectName, strictness, outputDir });
  artifacts.push(...cspAnalysis.artifacts);

  const directivesSetup = await ctx.task(directivesSetupTask, { projectName, outputDir });
  artifacts.push(...directivesSetup.artifacts);

  const nonceSetup = await ctx.task(nonceSetupTask, { projectName, outputDir });
  artifacts.push(...nonceSetup.artifacts);

  const reportingSetup = await ctx.task(reportingSetupTask, { projectName, outputDir });
  artifacts.push(...reportingSetup.artifacts);

  await ctx.breakpoint({ question: `CSP implementation complete for ${projectName}. Approve?`, title: 'CSP Review', context: { runId: ctx.runId, policy: cspAnalysis.policy } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, cspPolicy: cspAnalysis.policy, directives: directivesSetup.directives, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/content-security-policy', timestamp: startTime } };
}

export const cspAnalysisTask = defineTask('csp-analysis', (args, taskCtx) => ({ kind: 'agent', title: `CSP Analysis - ${args.projectName}`, agent: { name: 'csp-analyst', prompt: { role: 'CSP Analyst', task: 'Analyze CSP requirements', context: args, instructions: ['1. Audit inline scripts', '2. Analyze external resources', '3. Check third-party content', '4. Review iframe usage', '5. Analyze form actions', '6. Check object embeds', '7. Review font sources', '8. Analyze image sources', '9. Check style sources', '10. Document analysis'], outputFormat: 'JSON with CSP analysis' }, outputSchema: { type: 'object', required: ['policy', 'artifacts'], properties: { policy: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'security', 'csp', 'analysis'] }));

export const directivesSetupTask = defineTask('directives-setup', (args, taskCtx) => ({ kind: 'agent', title: `Directives Setup - ${args.projectName}`, agent: { name: 'csp-directives-specialist', prompt: { role: 'CSP Directives Specialist', task: 'Configure CSP directives', context: args, instructions: ['1. Configure default-src', '2. Set up script-src', '3. Configure style-src', '4. Set up img-src', '5. Configure font-src', '6. Set up connect-src', '7. Configure frame-src', '8. Set up object-src', '9. Configure base-uri', '10. Document directives'], outputFormat: 'JSON with directives' }, outputSchema: { type: 'object', required: ['directives', 'artifacts'], properties: { directives: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'security', 'csp', 'directives'] }));

export const nonceSetupTask = defineTask('nonce-setup', (args, taskCtx) => ({ kind: 'agent', title: `Nonce Setup - ${args.projectName}`, agent: { name: 'csp-nonce-specialist', prompt: { role: 'CSP Nonce Specialist', task: 'Configure nonces', context: args, instructions: ['1. Generate secure nonces', '2. Configure server-side', '3. Set up script nonces', '4. Configure style nonces', '5. Set up strict-dynamic', '6. Configure hash-based', '7. Set up inline handling', '8. Configure frameworks', '9. Set up testing', '10. Document nonces'], outputFormat: 'JSON with nonce setup' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'security', 'csp', 'nonce'] }));

export const reportingSetupTask = defineTask('reporting-setup', (args, taskCtx) => ({ kind: 'agent', title: `Reporting Setup - ${args.projectName}`, agent: { name: 'csp-reporting-specialist', prompt: { role: 'CSP Reporting Specialist', task: 'Configure CSP reporting', context: args, instructions: ['1. Configure report-uri', '2. Set up report-to', '3. Configure report-only mode', '4. Set up violation logging', '5. Configure alerting', '6. Set up dashboard', '7. Configure sampling', '8. Set up analytics', '9. Configure response', '10. Document reporting'], outputFormat: 'JSON with reporting' }, outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'security', 'csp', 'reporting'] }));

export const documentationTask = defineTask('csp-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate CSP documentation', context: args, instructions: ['1. Create README', '2. Document policy', '3. Create directives guide', '4. Document nonces', '5. Create reporting guide', '6. Document testing', '7. Create troubleshooting', '8. Document best practices', '9. Create examples', '10. Generate templates'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'security', 'documentation'] }));
