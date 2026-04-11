/**
 * @process specializations/desktop-development/native-notifications
 * @description Native Notifications Implementation - Implement platform-native notification systems for Windows
 * (Toast/Action Center), macOS (Notification Center), and Linux (libnotify/D-Bus).
 * @inputs { projectName: string, framework: string, notificationTypes: array, targetPlatforms: array, outputDir?: string }
 * @outputs { success: boolean, notificationModule: object, platformConfigs: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/native-notifications', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   notificationTypes: ['basic', 'action', 'progress', 'scheduled'],
 *   targetPlatforms: ['windows', 'macos', 'linux']
 * });
 *
 * @references
 * - Electron Notification: https://www.electronjs.org/docs/latest/api/notification
 * - Windows Toast Notifications: https://docs.microsoft.com/en-us/windows/apps/design/shell/tiles-and-notifications/toast-notifications
 * - macOS User Notifications: https://developer.apple.com/documentation/usernotifications
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    notificationTypes = ['basic', 'action', 'progress', 'scheduled'],
    targetPlatforms = ['windows', 'macos', 'linux'],
    outputDir = 'native-notifications'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Native Notifications Implementation: ${projectName}`);

  // Phase 1: Requirements Analysis
  const requirements = await ctx.task(notificationRequirementsTask, { projectName, framework, notificationTypes, targetPlatforms, outputDir });
  artifacts.push(...requirements.artifacts);

  // Phase 2: Core Notification Module
  const coreModule = await ctx.task(implementCoreNotificationTask, { projectName, framework, notificationTypes, outputDir });
  artifacts.push(...coreModule.artifacts);

  // Phase 3: Platform-specific implementations
  const platformTasks = targetPlatforms.map(platform =>
    () => ctx.task(implementPlatformNotificationTask, { projectName, framework, platform, notificationTypes, outputDir })
  );
  const platformConfigs = await ctx.parallel.all(platformTasks);
  artifacts.push(...platformConfigs.flatMap(c => c.artifacts));

  // Phase 4: Action Notifications
  let actionNotifications = null;
  if (notificationTypes.includes('action')) {
    actionNotifications = await ctx.task(implementActionNotificationsTask, { projectName, framework, targetPlatforms, outputDir });
    artifacts.push(...actionNotifications.artifacts);
  }

  // Phase 5: Progress Notifications
  let progressNotifications = null;
  if (notificationTypes.includes('progress')) {
    progressNotifications = await ctx.task(implementProgressNotificationsTask, { projectName, framework, targetPlatforms, outputDir });
    artifacts.push(...progressNotifications.artifacts);
  }

  // Phase 6: Scheduled Notifications
  let scheduledNotifications = null;
  if (notificationTypes.includes('scheduled')) {
    scheduledNotifications = await ctx.task(implementScheduledNotificationsTask, { projectName, framework, targetPlatforms, outputDir });
    artifacts.push(...scheduledNotifications.artifacts);
  }

  await ctx.breakpoint({
    question: `Notification types implemented: ${notificationTypes.join(', ')}. Platforms: ${targetPlatforms.join(', ')}. Review implementation?`,
    title: 'Notification Implementation Review',
    context: { runId: ctx.runId, notificationTypes, targetPlatforms }
  });

  // Phase 7: Permission Handling
  const permissions = await ctx.task(implementNotificationPermissionsTask, { projectName, framework, targetPlatforms, outputDir });
  artifacts.push(...permissions.artifacts);

  // Phase 8: Validation
  const validation = await ctx.task(validateNotificationsTask, { projectName, framework, notificationTypes, targetPlatforms, coreModule, platformConfigs, outputDir });
  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  return {
    success: validationPassed,
    projectName,
    notificationModule: { types: notificationTypes, core: coreModule.modulePath },
    platformConfigs: Object.fromEntries(platformConfigs.map(c => [c.platform, c.config])),
    features: { actions: !!actionNotifications, progress: !!progressNotifications, scheduled: !!scheduledNotifications },
    permissions: permissions.permissionHandling,
    validation: { score: validation.validationScore, passed: validationPassed },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/desktop-development/native-notifications', timestamp: startTime }
  };
}

export const notificationRequirementsTask = defineTask('notification-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Notification Requirements - ${args.projectName}`,
  agent: {
    name: 'notification-analyst',
    prompt: {
      role: 'Notification Systems Analyst',
      task: 'Analyze notification requirements',
      context: args,
      instructions: ['1. Analyze notification types needed', '2. Document platform capabilities', '3. Identify platform limitations', '4. Define notification content types', '5. Document permission requirements', '6. Assess sound/vibration needs', '7. Define notification categories', '8. Generate requirements document']
    },
    outputSchema: { type: 'object', required: ['requirements', 'artifacts'], properties: { requirements: { type: 'object' }, platformCapabilities: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'notifications', 'requirements']
}));

export const implementCoreNotificationTask = defineTask('implement-core-notification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Core Notification Module - ${args.projectName}`,
  skill: {
    name: 'native-notification-builder',
  },
  agent: {
    name: 'native-notification-api-integrator',
    prompt: {
      role: 'Notification Developer',
      task: 'Implement core notification module',
      context: args,
      instructions: ['1. Create notification service class', '2. Implement show/hide methods', '3. Handle notification events', '4. Implement notification queue', '5. Add notification ID management', '6. Implement notification updates', '7. Add event emitters', '8. Generate notification module']
    },
    outputSchema: { type: 'object', required: ['modulePath', 'methods', 'artifacts'], properties: { modulePath: { type: 'string' }, methods: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'notifications', 'core']
}));

export const implementPlatformNotificationTask = defineTask('implement-platform-notification', (args, taskCtx) => ({
  kind: 'agent',
  title: `${args.platform} Notifications - ${args.projectName}`,
  agent: {
    name: 'native-notification-api-integrator',
    prompt: {
      role: 'Platform Notification Developer',
      task: `Implement ${args.platform}-specific notifications`,
      context: args,
      instructions: [`1. Configure ${args.platform} notification API`, '2. Handle platform-specific features', '3. Configure notification appearance', '4. Handle click/dismiss events', '5. Configure sounds and badges', '6. Handle do not disturb', '7. Test platform behavior', '8. Generate platform module']
    },
    outputSchema: { type: 'object', required: ['platform', 'config', 'artifacts'], properties: { platform: { type: 'string' }, config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'notifications', args.platform]
}));

export const implementActionNotificationsTask = defineTask('implement-action-notifications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Action Notifications - ${args.projectName}`,
  agent: {
    name: 'action-notification-developer',
    prompt: {
      role: 'Action Notification Developer',
      task: 'Implement notifications with action buttons',
      context: args,
      instructions: ['1. Define action button types', '2. Implement action handlers', '3. Handle inline replies', '4. Configure action icons', '5. Handle action callbacks', '6. Implement action groups', '7. Handle quick actions', '8. Generate action notification module']
    },
    outputSchema: { type: 'object', required: ['actionTypes', 'artifacts'], properties: { actionTypes: { type: 'array' }, handlers: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'notifications', 'actions']
}));

export const implementProgressNotificationsTask = defineTask('implement-progress-notifications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Progress Notifications - ${args.projectName}`,
  agent: {
    name: 'progress-notification-developer',
    prompt: {
      role: 'Progress Notification Developer',
      task: 'Implement notifications with progress indicators',
      context: args,
      instructions: ['1. Implement progress bar notifications', '2. Handle progress updates', '3. Implement indeterminate progress', '4. Add cancel actions', '5. Handle completion states', '6. Configure progress appearance', '7. Handle error states', '8. Generate progress notification module']
    },
    outputSchema: { type: 'object', required: ['progressTypes', 'artifacts'], properties: { progressTypes: { type: 'array' }, updateMethods: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'notifications', 'progress']
}));

export const implementScheduledNotificationsTask = defineTask('implement-scheduled-notifications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scheduled Notifications - ${args.projectName}`,
  agent: {
    name: 'scheduled-notification-developer',
    prompt: {
      role: 'Scheduled Notification Developer',
      task: 'Implement scheduled and recurring notifications',
      context: args,
      instructions: ['1. Implement notification scheduling', '2. Handle recurring notifications', '3. Implement snooze functionality', '4. Handle timezone management', '5. Persist scheduled notifications', '6. Handle app restart', '7. Implement cancellation', '8. Generate scheduled notification module']
    },
    outputSchema: { type: 'object', required: ['schedulingMethods', 'artifacts'], properties: { schedulingMethods: { type: 'array' }, persistence: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'notifications', 'scheduled']
}));

export const implementNotificationPermissionsTask = defineTask('implement-notification-permissions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Notification Permissions - ${args.projectName}`,
  agent: {
    name: 'permissions-developer',
    prompt: {
      role: 'Permissions Developer',
      task: 'Implement notification permission handling',
      context: args,
      instructions: ['1. Check notification permission status', '2. Implement permission request', '3. Handle permission denial', '4. Guide user to settings', '5. Handle platform differences', '6. Implement permission caching', '7. Handle permission changes', '8. Generate permissions module']
    },
    outputSchema: { type: 'object', required: ['permissionHandling', 'artifacts'], properties: { permissionHandling: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'notifications', 'permissions']
}));

export const validateNotificationsTask = defineTask('validate-notifications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Notifications - ${args.projectName}`,
  agent: {
    name: 'notification-validator',
    prompt: {
      role: 'Notification Validator',
      task: 'Validate notification implementation',
      context: args,
      instructions: ['1. Verify all notification types', '2. Test platform implementations', '3. Verify action handling', '4. Test permission flow', '5. Check cross-platform consistency', '6. Calculate validation score', '7. Identify issues', '8. Generate recommendations']
    },
    outputSchema: { type: 'object', required: ['validationScore', 'artifacts'], properties: { validationScore: { type: 'number' }, checks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['desktop-development', 'notifications', 'validation']
}));
