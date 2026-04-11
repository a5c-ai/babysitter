/**
 * @process specializations/desktop-development/system-services-integration
 * @description System Services Integration - Integrate with OS-level services including clipboard, global shortcuts,
 * power management, screen capture, and system information APIs.
 * @inputs { projectName: string, framework: string, services: array, targetPlatforms: array, outputDir?: string }
 * @outputs { success: boolean, serviceModules: array, capabilities: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/system-services-integration', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   services: ['clipboard', 'global-shortcuts', 'power-monitor', 'screen-capture', 'system-info'],
 *   targetPlatforms: ['windows', 'macos', 'linux']
 * });
 *
 * @references
 * - Electron clipboard: https://www.electronjs.org/docs/latest/api/clipboard
 * - Electron globalShortcut: https://www.electronjs.org/docs/latest/api/global-shortcut
 * - Electron powerMonitor: https://www.electronjs.org/docs/latest/api/power-monitor
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    services = ['clipboard', 'global-shortcuts', 'power-monitor', 'screen-capture', 'system-info'],
    targetPlatforms = ['windows', 'macos', 'linux'],
    outputDir = 'system-services-integration'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting System Services Integration: ${projectName}`);

  // Phase 1: Services Requirements
  const requirements = await ctx.task(servicesRequirementsTask, { projectName, framework, services, targetPlatforms, outputDir });
  artifacts.push(...requirements.artifacts);

  // Implement each service
  const serviceModules = [];

  if (services.includes('clipboard')) {
    const clipboard = await ctx.task(implementClipboardTask, { projectName, framework, targetPlatforms, outputDir });
    artifacts.push(...clipboard.artifacts);
    serviceModules.push({ name: 'clipboard', ...clipboard });
  }

  if (services.includes('global-shortcuts')) {
    const shortcuts = await ctx.task(implementGlobalShortcutsTask, { projectName, framework, targetPlatforms, outputDir });
    artifacts.push(...shortcuts.artifacts);
    serviceModules.push({ name: 'global-shortcuts', ...shortcuts });
  }

  if (services.includes('power-monitor')) {
    const power = await ctx.task(implementPowerMonitorTask, { projectName, framework, targetPlatforms, outputDir });
    artifacts.push(...power.artifacts);
    serviceModules.push({ name: 'power-monitor', ...power });
  }

  if (services.includes('screen-capture')) {
    const screenCapture = await ctx.task(implementScreenCaptureTask, { projectName, framework, targetPlatforms, outputDir });
    artifacts.push(...screenCapture.artifacts);
    serviceModules.push({ name: 'screen-capture', ...screenCapture });
  }

  if (services.includes('system-info')) {
    const systemInfo = await ctx.task(implementSystemInfoTask, { projectName, framework, targetPlatforms, outputDir });
    artifacts.push(...systemInfo.artifacts);
    serviceModules.push({ name: 'system-info', ...systemInfo });
  }

  await ctx.breakpoint({
    question: `System services integrated: ${services.join(', ')}. ${serviceModules.length} modules created. Review implementation?`,
    title: 'System Services Review',
    context: { runId: ctx.runId, services: serviceModules.map(s => s.name) }
  });

  // Phase 7: Validation
  const validation = await ctx.task(validateServicesTask, { projectName, framework, services, serviceModules, targetPlatforms, outputDir });
  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  return {
    success: validationPassed,
    projectName,
    serviceModules: serviceModules.map(s => ({ name: s.name, modulePath: s.modulePath })),
    capabilities: Object.fromEntries(serviceModules.map(s => [s.name, s.capabilities || []])),
    validation: { score: validation.validationScore, passed: validationPassed },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/desktop-development/system-services-integration', timestamp: startTime }
  };
}

export const servicesRequirementsTask = defineTask('services-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Services Requirements - ${args.projectName}`,
  agent: {
    name: 'services-analyst',
    prompt: { role: 'System Services Analyst', task: 'Analyze system services requirements', context: args, instructions: ['1. Analyze service needs', '2. Document platform capabilities', '3. Assess permission requirements', '4. Document API limitations', '5. Assess security considerations', '6. Identify fallback strategies', '7. Document use cases', '8. Generate requirements document'] },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'system-services', 'requirements']
}));

export const implementClipboardTask = defineTask('implement-clipboard', (args, taskCtx) => ({
  kind: 'agent',
  title: `Clipboard Integration - ${args.projectName}`,
  skill: {
    name: 'electron-clipboard-handler',
  },
  agent: {
    name: 'system-integration-specialist',
    prompt: { role: 'Clipboard Developer', task: 'Implement clipboard integration', context: args, instructions: ['1. Implement text read/write', '2. Implement image read/write', '3. Implement HTML read/write', '4. Handle file clipboard', '5. Implement clipboard watching', '6. Handle rich content', '7. Implement clear operation', '8. Generate clipboard module'] },
    outputSchema: { type: 'object', required: ['modulePath', 'capabilities', 'artifacts'], properties: { modulePath: { type: 'string' }, capabilities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'system-services', 'clipboard']
}));

export const implementGlobalShortcutsTask = defineTask('implement-global-shortcuts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Global Shortcuts - ${args.projectName}`,
  skill: {
    name: 'global-shortcut-manager',
  },
  agent: {
    name: 'system-integration-specialist',
    prompt: { role: 'Global Shortcuts Developer', task: 'Implement global keyboard shortcuts', context: args, instructions: ['1. Register global shortcuts', '2. Handle shortcut conflicts', '3. Implement shortcut manager', '4. Handle platform differences', '5. Implement unregister on blur', '6. Add user customization', '7. Handle media keys', '8. Generate shortcuts module'] },
    outputSchema: { type: 'object', required: ['modulePath', 'capabilities', 'artifacts'], properties: { modulePath: { type: 'string' }, capabilities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'system-services', 'shortcuts']
}));

export const implementPowerMonitorTask = defineTask('implement-power-monitor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Power Monitor - ${args.projectName}`,
  agent: {
    name: 'power-developer',
    prompt: { role: 'Power Monitor Developer', task: 'Implement power monitoring', context: args, instructions: ['1. Monitor suspend/resume', '2. Monitor lock/unlock screen', '3. Monitor AC/battery status', '4. Implement power save blocker', '5. Handle shutdown events', '6. Monitor idle state', '7. Handle platform differences', '8. Generate power module'] },
    outputSchema: { type: 'object', required: ['modulePath', 'capabilities', 'artifacts'], properties: { modulePath: { type: 'string' }, capabilities: { type: 'array' }, events: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'system-services', 'power']
}));

export const implementScreenCaptureTask = defineTask('implement-screen-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Screen Capture - ${args.projectName}`,
  skill: {
    name: 'desktop-capture-api',
  },
  agent: {
    name: 'system-integration-specialist',
    prompt: { role: 'Screen Capture Developer', task: 'Implement screen capture functionality', context: args, instructions: ['1. Implement screen capture', '2. Implement window capture', '3. Get screen sources list', '4. Handle permission requests', '5. Implement region selection', '6. Handle multi-monitor', '7. Implement video capture', '8. Generate capture module'] },
    outputSchema: { type: 'object', required: ['modulePath', 'capabilities', 'artifacts'], properties: { modulePath: { type: 'string' }, capabilities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'system-services', 'screen-capture']
}));

export const implementSystemInfoTask = defineTask('implement-system-info', (args, taskCtx) => ({
  kind: 'agent',
  title: `System Info - ${args.projectName}`,
  agent: {
    name: 'sysinfo-developer',
    prompt: { role: 'System Info Developer', task: 'Implement system information retrieval', context: args, instructions: ['1. Get OS information', '2. Get hardware info', '3. Get display information', '4. Get memory information', '5. Get network interfaces', '6. Get app paths', '7. Get locale information', '8. Generate system info module'] },
    outputSchema: { type: 'object', required: ['modulePath', 'capabilities', 'artifacts'], properties: { modulePath: { type: 'string' }, capabilities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'system-services', 'system-info']
}));

export const validateServicesTask = defineTask('validate-services', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Services - ${args.projectName}`,
  agent: {
    name: 'services-validator',
    prompt: { role: 'Services Validator', task: 'Validate system services integration', context: args, instructions: ['1. Test each service', '2. Verify platform compatibility', '3. Test permissions', '4. Verify error handling', '5. Test edge cases', '6. Calculate validation score', '7. Identify issues', '8. Generate recommendations'] },
    outputSchema: { type: 'object', required: ['validationScore', 'artifacts'], properties: { validationScore: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'system-services', 'validation']
}));
