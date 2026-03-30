/**
 * @process specializations/web-development/owasp-security-audit
 * @description OWASP Security Audit - Process for conducting security audits based on OWASP Top 10 and implementing security best practices.
 * @inputs { projectName: string, scope?: string }
 * @outputs { success: boolean, auditReport: object, vulnerabilities: array, artifacts: array }
 * @references - OWASP: https://owasp.org/www-project-top-ten/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { projectName, scope = 'full', outputDir = 'owasp-security-audit' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting OWASP Security Audit: ${projectName}`);

  const vulnerabilityScan = await ctx.task(vulnerabilityScanTask, { projectName, scope, outputDir });
  artifacts.push(...vulnerabilityScan.artifacts);

  const owaspChecks = await ctx.task(owaspChecksTask, { projectName, outputDir });
  artifacts.push(...owaspChecks.artifacts);

  const remediationPlan = await ctx.task(remediationPlanTask, { projectName, outputDir });
  artifacts.push(...remediationPlan.artifacts);

  const securityHardening = await ctx.task(securityHardeningTask, { projectName, outputDir });
  artifacts.push(...securityHardening.artifacts);

  await ctx.breakpoint({ question: `OWASP security audit complete for ${projectName}. Approve?`, title: 'Security Audit Review', context: { runId: ctx.runId, vulnerabilities: vulnerabilityScan.vulnerabilities } });

  const documentation = await ctx.task(documentationTask, { projectName, outputDir });
  artifacts.push(...documentation.artifacts);

  return { success: true, projectName, auditReport: vulnerabilityScan.report, vulnerabilities: vulnerabilityScan.vulnerabilities, artifacts, duration: ctx.now() - startTime, metadata: { processId: 'specializations/web-development/owasp-security-audit', timestamp: startTime } };
}

export const vulnerabilityScanTask = defineTask('vulnerability-scan', (args, taskCtx) => ({ kind: 'agent', title: `Vulnerability Scan - ${args.projectName}`, agent: { name: 'security-scanner', prompt: { role: 'Security Scanner', task: 'Scan for vulnerabilities', context: args, instructions: ['1. Run SAST tools', '2. Scan dependencies', '3. Check for secrets', '4. Analyze configurations', '5. Scan for XSS', '6. Check SQL injection', '7. Test CSRF', '8. Analyze authentication', '9. Check authorization', '10. Document findings'], outputFormat: 'JSON with vulnerabilities' }, outputSchema: { type: 'object', required: ['report', 'vulnerabilities', 'artifacts'], properties: { report: { type: 'object' }, vulnerabilities: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'security', 'scan'] }));

export const owaspChecksTask = defineTask('owasp-checks', (args, taskCtx) => ({ kind: 'agent', title: `OWASP Checks - ${args.projectName}`, agent: { name: 'owasp-specialist', prompt: { role: 'OWASP Specialist', task: 'Check OWASP Top 10', context: args, instructions: ['1. Check broken access control', '2. Test cryptographic failures', '3. Check injection', '4. Test insecure design', '5. Check security misconfiguration', '6. Test vulnerable components', '7. Check auth failures', '8. Test data integrity', '9. Check logging failures', '10. Test SSRF'], outputFormat: 'JSON with OWASP checks' }, outputSchema: { type: 'object', required: ['checks', 'artifacts'], properties: { checks: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'security', 'owasp'] }));

export const remediationPlanTask = defineTask('remediation-plan', (args, taskCtx) => ({ kind: 'agent', title: `Remediation Plan - ${args.projectName}`, agent: { name: 'security-remediation-specialist', prompt: { role: 'Security Remediation Specialist', task: 'Create remediation plan', context: args, instructions: ['1. Prioritize vulnerabilities', '2. Create fix strategies', '3. Estimate effort', '4. Identify quick wins', '5. Plan infrastructure fixes', '6. Plan code fixes', '7. Plan config fixes', '8. Identify dependencies', '9. Create timeline', '10. Document plan'], outputFormat: 'JSON with remediation plan' }, outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'security', 'remediation'] }));

export const securityHardeningTask = defineTask('security-hardening', (args, taskCtx) => ({ kind: 'agent', title: `Security Hardening - ${args.projectName}`, agent: { name: 'security-hardening-specialist', prompt: { role: 'Security Hardening Specialist', task: 'Implement security hardening', context: args, instructions: ['1. Configure security headers', '2. Implement CSP', '3. Set up HSTS', '4. Configure CORS', '5. Implement rate limiting', '6. Set up WAF', '7. Configure logging', '8. Implement monitoring', '9. Set up alerts', '10. Document hardening'], outputFormat: 'JSON with hardening' }, outputSchema: { type: 'object', required: ['measures', 'artifacts'], properties: { measures: { type: 'array' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'security', 'hardening'] }));

export const documentationTask = defineTask('security-documentation', (args, taskCtx) => ({ kind: 'agent', title: `Documentation - ${args.projectName}`, agent: { name: 'technical-writer-agent', prompt: { role: 'Technical Writer', task: 'Generate security documentation', context: args, instructions: ['1. Create README', '2. Document audit findings', '3. Create remediation guide', '4. Document hardening', '5. Create security checklist', '6. Document testing', '7. Create incident response', '8. Document best practices', '9. Create examples', '10. Generate reports'], outputFormat: 'JSON with documentation' }, outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } } }, io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['web', 'security', 'documentation'] }));
