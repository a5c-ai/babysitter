/**
 * @process specializations/desktop-development/security-hardening
 * @description Desktop Security Hardening - Implement security measures including content security policy,
 * sandboxing, secure IPC, context isolation, and protection against common desktop app vulnerabilities.
 * @inputs { projectName: string, framework: string, securityFeatures: array, targetPlatforms: array, outputDir?: string }
 * @outputs { success: boolean, securityConfig: object, hardeningScore: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/security-hardening', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   securityFeatures: ['csp', 'sandboxing', 'context-isolation', 'secure-ipc', 'preload-scripts'],
 *   targetPlatforms: ['windows', 'macos', 'linux']
 * });
 *
 * @references
 * - Electron Security: https://www.electronjs.org/docs/latest/tutorial/security
 * - OWASP Desktop Security: https://owasp.org/www-project-desktop-app-security-top-10/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    securityFeatures = ['csp', 'sandboxing', 'context-isolation', 'secure-ipc', 'preload-scripts'],
    targetPlatforms = ['windows', 'macos', 'linux'],
    outputDir = 'security-hardening'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Desktop Security Hardening: ${projectName}`);

  // Phase 1: Security Audit
  const audit = await ctx.task(securityAuditTask, { projectName, framework, targetPlatforms, outputDir });
  artifacts.push(...audit.artifacts);

  await ctx.breakpoint({
    question: `Security audit complete. Found ${audit.vulnerabilities.length} vulnerabilities. Risk level: ${audit.riskLevel}. Proceed with hardening?`,
    title: 'Security Audit Review',
    context: { runId: ctx.runId, vulnerabilities: audit.vulnerabilities, riskLevel: audit.riskLevel }
  });

  // Phase 2: Content Security Policy
  let cspConfig = null;
  if (securityFeatures.includes('csp')) {
    cspConfig = await ctx.task(implementCspTask, { projectName, framework, outputDir });
    artifacts.push(...cspConfig.artifacts);
  }

  // Phase 3: Context Isolation
  let contextIsolation = null;
  if (securityFeatures.includes('context-isolation')) {
    contextIsolation = await ctx.task(implementContextIsolationTask, { projectName, framework, outputDir });
    artifacts.push(...contextIsolation.artifacts);
  }

  // Phase 4: Sandboxing
  let sandboxing = null;
  if (securityFeatures.includes('sandboxing')) {
    sandboxing = await ctx.task(implementSandboxingTask, { projectName, framework, targetPlatforms, outputDir });
    artifacts.push(...sandboxing.artifacts);
  }

  // Phase 5: Secure IPC
  let secureIpc = null;
  if (securityFeatures.includes('secure-ipc')) {
    secureIpc = await ctx.task(implementSecureIpcTask, { projectName, framework, outputDir });
    artifacts.push(...secureIpc.artifacts);
  }

  // Phase 6: Preload Scripts Security
  let preloadSecurity = null;
  if (securityFeatures.includes('preload-scripts')) {
    preloadSecurity = await ctx.task(implementPreloadSecurityTask, { projectName, framework, outputDir });
    artifacts.push(...preloadSecurity.artifacts);
  }

  // Phase 7: Additional Security Measures
  const additionalSecurity = await ctx.task(implementAdditionalSecurityTask, { projectName, framework, targetPlatforms, outputDir });
  artifacts.push(...additionalSecurity.artifacts);

  // Phase 8: Security Validation
  const validation = await ctx.task(validateSecurityTask, { projectName, framework, securityFeatures, audit, cspConfig, contextIsolation, sandboxing, secureIpc, outputDir });
  artifacts.push(...validation.artifacts);

  const validationPassed = validation.hardeningScore >= 80;

  await ctx.breakpoint({
    question: `Security Hardening Complete! Score: ${validation.hardeningScore}/100. Vulnerabilities mitigated: ${validation.mitigatedCount}/${audit.vulnerabilities.length}. Approve?`,
    title: 'Security Hardening Complete',
    context: { runId: ctx.runId, hardeningScore: validation.hardeningScore, mitigatedCount: validation.mitigatedCount }
  });

  return {
    success: validationPassed,
    projectName,
    securityConfig: {
      csp: cspConfig?.policy,
      contextIsolation: contextIsolation?.enabled,
      sandboxing: sandboxing?.enabled,
      secureIpc: secureIpc?.configured
    },
    hardeningScore: validation.hardeningScore,
    vulnerabilities: { initial: audit.vulnerabilities.length, mitigated: validation.mitigatedCount },
    validation: { score: validation.hardeningScore, passed: validationPassed },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/desktop-development/security-hardening', timestamp: startTime }
  };
}

export const securityAuditTask = defineTask('security-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security Audit - ${args.projectName}`,
  skill: {
    name: 'electron-ipc-security-audit',
  },
  agent: {
    name: 'desktop-security-auditor',
    prompt: { role: 'Desktop Security Auditor', task: 'Conduct security audit', context: args, instructions: ['1. Scan for common vulnerabilities', '2. Check Electron/framework settings', '3. Review IPC channels', '4. Check for nodeIntegration issues', '5. Review remote module usage', '6. Check for CSP violations', '7. Assess risk level', '8. Generate audit report'] },
    outputSchema: { type: 'object', required: ['vulnerabilities', 'riskLevel', 'artifacts'], properties: { vulnerabilities: { type: 'array' }, riskLevel: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'security', 'audit']
}));

export const implementCspTask = defineTask('implement-csp', (args, taskCtx) => ({
  kind: 'agent',
  title: `Content Security Policy - ${args.projectName}`,
  agent: {
    name: 'csp-developer',
    prompt: { role: 'CSP Developer', task: 'Implement Content Security Policy', context: args, instructions: ['1. Define CSP directives', '2. Configure script-src', '3. Configure style-src', '4. Configure connect-src', '5. Block unsafe-inline', '6. Configure nonce/hash', '7. Set CSP header', '8. Generate CSP configuration'] },
    outputSchema: { type: 'object', required: ['policy', 'artifacts'], properties: { policy: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'security', 'csp']
}));

export const implementContextIsolationTask = defineTask('implement-context-isolation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Context Isolation - ${args.projectName}`,
  skill: {
    name: 'electron-main-preload-generator',
  },
  agent: {
    name: 'electron-architect',
    prompt: { role: 'Context Isolation Developer', task: 'Implement context isolation', context: args, instructions: ['1. Enable contextIsolation', '2. Disable nodeIntegration', '3. Configure preload script', '4. Use contextBridge', '5. Expose safe APIs only', '6. Validate exposed APIs', '7. Handle legacy code', '8. Generate isolation configuration'] },
    outputSchema: { type: 'object', required: ['enabled', 'artifacts'], properties: { enabled: { type: 'boolean' }, exposedApis: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'security', 'context-isolation']
}));

export const implementSandboxingTask = defineTask('implement-sandboxing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sandboxing - ${args.projectName}`,
  skill: {
    name: 'sandbox-entitlements-auditor',
  },
  agent: {
    name: 'desktop-security-auditor',
    prompt: { role: 'Sandbox Developer', task: 'Implement process sandboxing', context: args, instructions: ['1. Enable renderer sandbox', '2. Configure sandbox flags', '3. Handle sandbox limitations', '4. Configure utility processes', '5. Handle native modules', '6. Configure platform-specific sandbox', '7. Test sandbox restrictions', '8. Generate sandbox configuration'] },
    outputSchema: { type: 'object', required: ['enabled', 'artifacts'], properties: { enabled: { type: 'boolean' }, restrictions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'security', 'sandboxing']
}));

export const implementSecureIpcTask = defineTask('implement-secure-ipc', (args, taskCtx) => ({
  kind: 'agent',
  title: `Secure IPC - ${args.projectName}`,
  agent: {
    name: 'ipc-security-developer',
    prompt: { role: 'IPC Security Developer', task: 'Implement secure IPC patterns', context: args, instructions: ['1. Use ipcRenderer.invoke', '2. Validate IPC inputs', '3. Use typed channels', '4. Restrict channel access', '5. Sanitize data', '6. Implement rate limiting', '7. Log IPC usage', '8. Generate secure IPC module'] },
    outputSchema: { type: 'object', required: ['configured', 'artifacts'], properties: { configured: { type: 'boolean' }, channels: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'security', 'ipc']
}));

export const implementPreloadSecurityTask = defineTask('implement-preload-security', (args, taskCtx) => ({
  kind: 'agent',
  title: `Preload Security - ${args.projectName}`,
  skill: {
    name: 'electron-main-preload-generator',
  },
  agent: {
    name: 'electron-architect',
    prompt: { role: 'Preload Security Developer', task: 'Implement secure preload scripts', context: args, instructions: ['1. Use contextBridge.exposeInMainWorld', '2. Expose minimal API surface', '3. Validate all inputs', '4. Avoid exposing Node.js', '5. Use typed API definitions', '6. Implement wrapper functions', '7. Add security comments', '8. Generate secure preload'] },
    outputSchema: { type: 'object', required: ['exposedApis', 'artifacts'], properties: { exposedApis: { type: 'array' }, preloadPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'security', 'preload']
}));

export const implementAdditionalSecurityTask = defineTask('implement-additional-security', (args, taskCtx) => ({
  kind: 'agent',
  title: `Additional Security - ${args.projectName}`,
  agent: {
    name: 'security-developer',
    prompt: { role: 'Security Developer', task: 'Implement additional security measures', context: args, instructions: ['1. Disable remote module', '2. Configure webSecurity', '3. Implement permission handling', '4. Configure navigation handling', '5. Block new window creation', '6. Implement update security', '7. Configure CORS', '8. Generate security configuration'] },
    outputSchema: { type: 'object', required: ['measures', 'artifacts'], properties: { measures: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'security', 'additional']
}));

export const validateSecurityTask = defineTask('validate-security', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Security - ${args.projectName}`,
  agent: {
    name: 'update-security-analyst',
    prompt: { role: 'Security Validator', task: 'Validate security hardening', context: args, instructions: ['1. Re-scan for vulnerabilities', '2. Verify CSP enforcement', '3. Test context isolation', '4. Verify sandbox', '5. Test IPC security', '6. Calculate hardening score', '7. Count mitigated issues', '8. Generate security report'] },
    outputSchema: { type: 'object', required: ['hardeningScore', 'mitigatedCount', 'artifacts'], properties: { hardeningScore: { type: 'number' }, mitigatedCount: { type: 'number' }, remainingIssues: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'security', 'validation']
}));
