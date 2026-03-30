/**
 * @process specializations/mobile-development/ios-push-notifications
 * @description iOS Push Notifications Setup with APNs - Configure push notifications for iOS apps using Apple Push
 * Notification service (APNs) with proper certificate management, rich notifications, and notification handling.
 * @inputs { appName: string, notificationTypes?: array, richNotifications?: boolean, actionCategories?: array, silent?: boolean }
 * @outputs { success: boolean, configuration: object, capabilities: array, testPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/ios-push-notifications', {
 *   appName: 'MyiOSApp',
 *   notificationTypes: ['alert', 'badge', 'sound'],
 *   richNotifications: true,
 *   actionCategories: ['MESSAGE_REPLY', 'REMINDER_ACTIONS'],
 *   silent: true
 * });
 *
 * @references
 * - APNs Documentation: https://developer.apple.com/documentation/usernotifications
 * - Push Notification Setup: https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server
 * - Notification Service Extension: https://developer.apple.com/documentation/usernotifications/unnotificationserviceextension
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    notificationTypes = ['alert', 'badge', 'sound'],
    richNotifications = false,
    actionCategories = [],
    silent = false,
    grouping = true,
    outputDir = 'ios-push-notifications'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting iOS Push Notifications Setup: ${appName}`);
  ctx.log('info', `Types: ${notificationTypes.join(', ')}, Rich: ${richNotifications}`);

  // ============================================================================
  // PHASE 1: APNS OVERVIEW AND PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning APNs implementation');

  const apnsPlanning = await ctx.task(apnsPlanningTask, {
    appName,
    notificationTypes,
    richNotifications,
    actionCategories,
    outputDir
  });

  artifacts.push(...apnsPlanning.artifacts);

  // ============================================================================
  // PHASE 2: CERTIFICATE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Managing APNs certificates and keys');

  const certificateManagement = await ctx.task(certificateManagementTask, {
    appName,
    outputDir
  });

  artifacts.push(...certificateManagement.artifacts);

  // ============================================================================
  // PHASE 3: XCODE CAPABILITIES
  // ============================================================================

  ctx.log('info', 'Phase 3: Enabling Push Notification capability in Xcode');

  const xcodeCapabilities = await ctx.task(xcodeCapabilitiesTask, {
    appName,
    outputDir
  });

  artifacts.push(...xcodeCapabilities.artifacts);

  // ============================================================================
  // PHASE 4: DEVICE TOKEN REGISTRATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing device token registration');

  const tokenRegistration = await ctx.task(tokenRegistrationTask, {
    appName,
    outputDir
  });

  artifacts.push(...tokenRegistration.artifacts);

  // ============================================================================
  // PHASE 5: USER PERMISSION HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 5: Handling user permission requests');

  const permissionHandling = await ctx.task(permissionHandlingTask, {
    appName,
    notificationTypes,
    outputDir
  });

  artifacts.push(...permissionHandling.artifacts);

  // ============================================================================
  // PHASE 6: NOTIFICATION PAYLOAD PARSING
  // ============================================================================

  ctx.log('info', 'Phase 6: Parsing notification payloads');

  const payloadParsing = await ctx.task(payloadParsingTask, {
    appName,
    outputDir
  });

  artifacts.push(...payloadParsing.artifacts);

  // ============================================================================
  // PHASE 7: FOREGROUND/BACKGROUND HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 7: Handling notifications in foreground and background');

  const notificationHandling = await ctx.task(notificationHandlingTask, {
    appName,
    silent,
    outputDir
  });

  artifacts.push(...notificationHandling.artifacts);

  // ============================================================================
  // PHASE 8: NOTIFICATION ACTIONS AND CATEGORIES
  // ============================================================================

  if (actionCategories.length > 0) {
    ctx.log('info', 'Phase 8: Defining notification actions and categories');

    const actionsSetup = await ctx.task(actionsSetupTask, {
      appName,
      actionCategories,
      outputDir
    });

    artifacts.push(...actionsSetup.artifacts);
  }

  // ============================================================================
  // PHASE 9: RICH NOTIFICATIONS
  // ============================================================================

  let richNotificationSetup = null;
  if (richNotifications) {
    ctx.log('info', 'Phase 9: Implementing rich notifications with service extension');

    richNotificationSetup = await ctx.task(richNotificationsTask, {
      appName,
      outputDir
    });

    artifacts.push(...richNotificationSetup.artifacts);
  }

  // ============================================================================
  // PHASE 10: NOTIFICATION GROUPING
  // ============================================================================

  if (grouping) {
    ctx.log('info', 'Phase 10: Implementing notification grouping');

    const groupingSetup = await ctx.task(groupingSetupTask, {
      appName,
      outputDir
    });

    artifacts.push(...groupingSetup.artifacts);
  }

  // Quality Gate: Configuration Review
  await ctx.breakpoint({
    question: `Push notification setup configured for ${appName}. Types: ${notificationTypes.join(', ')}, Rich: ${richNotifications}. Review configuration?`,
    title: 'Push Notification Configuration Review',
    context: {
      runId: ctx.runId,
      appName,
      notificationTypes,
      richNotifications,
      actionCategories,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: 'swift' }))
    }
  });

  // ============================================================================
  // PHASE 11: SILENT NOTIFICATIONS
  // ============================================================================

  if (silent) {
    ctx.log('info', 'Phase 11: Configuring silent/background push notifications');

    const silentNotifications = await ctx.task(silentNotificationsTask, {
      appName,
      outputDir
    });

    artifacts.push(...silentNotifications.artifacts);
  }

  // ============================================================================
  // PHASE 12: LOCAL NOTIFICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 12: Implementing local notifications integration');

  const localNotifications = await ctx.task(localNotificationsTask, {
    appName,
    outputDir
  });

  artifacts.push(...localNotifications.artifacts);

  // ============================================================================
  // PHASE 13: NOTIFICATION CENTER INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Integrating with Notification Center');

  const notificationCenter = await ctx.task(notificationCenterTask, {
    appName,
    outputDir
  });

  artifacts.push(...notificationCenter.artifacts);

  // ============================================================================
  // PHASE 14: SERVER-SIDE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 14: Documenting server-side setup');

  const serverSetup = await ctx.task(serverSetupTask, {
    appName,
    outputDir
  });

  artifacts.push(...serverSetup.artifacts);

  // ============================================================================
  // PHASE 15: TESTING STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 15: Creating testing strategy for push notifications');

  const testingStrategy = await ctx.task(testingStrategyTask, {
    appName,
    notificationTypes,
    richNotifications,
    actionCategories,
    outputDir
  });

  artifacts.push(...testingStrategy.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    appName,
    configuration: {
      notificationTypes,
      richNotifications,
      actionCategories,
      silent,
      grouping
    },
    capabilities: xcodeCapabilities.capabilities,
    certificates: certificateManagement.certificateInfo,
    permissions: permissionHandling.permissionFlow,
    richNotifications: richNotificationSetup ? {
      serviceExtension: richNotificationSetup.extensionName,
      contentTypes: richNotificationSetup.supportedTypes
    } : null,
    testPlan: testingStrategy.testPlan,
    serverSetup: serverSetup.documentation,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/mobile-development/ios-push-notifications',
      timestamp: startTime,
      notificationTypes,
      richNotifications
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const apnsPlanningTask = defineTask('apns-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: APNs Planning - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Push Notification Specialist',
      task: 'Plan APNs implementation architecture',
      context: {
        appName: args.appName,
        notificationTypes: args.notificationTypes,
        richNotifications: args.richNotifications,
        actionCategories: args.actionCategories,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document notification requirements',
        '2. Define notification types and categories',
        '3. Plan user permission flow',
        '4. Design notification payload structure',
        '5. Plan rich notification content',
        '6. Define action categories and buttons',
        '7. Plan background processing needs',
        '8. Document server integration requirements',
        '9. Create implementation timeline',
        '10. Generate planning document'
      ],
      outputFormat: 'JSON with APNs planning'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        requirements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'push-notifications', 'planning']
}));

export const certificateManagementTask = defineTask('certificate-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Certificate Management - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Certificate Specialist',
      task: 'Manage APNs certificates and authentication keys',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document APNs key vs certificate options',
        '2. Create APNs authentication key in Developer Portal',
        '3. Configure App ID with Push capability',
        '4. Document key ID and team ID',
        '5. Set up certificate rotation strategy',
        '6. Configure development vs production environments',
        '7. Document secure key storage',
        '8. Create provisioning profile with Push',
        '9. Validate certificate configuration',
        '10. Document certificate management process'
      ],
      outputFormat: 'JSON with certificate management'
    },
    outputSchema: {
      type: 'object',
      required: ['certificateInfo', 'artifacts'],
      properties: {
        certificateInfo: { type: 'object' },
        keyType: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'push-notifications', 'certificates']
}));

export const xcodeCapabilitiesTask = defineTask('xcode-capabilities', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Xcode Capabilities - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Developer',
      task: 'Enable Push Notification capability in Xcode',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Enable Push Notifications capability',
        '2. Enable Background Modes if needed',
        '3. Configure Remote notifications background mode',
        '4. Set up entitlements file',
        '5. Configure APS Environment entitlement',
        '6. Verify provisioning profile settings',
        '7. Configure debug/release settings',
        '8. Document capability setup steps',
        '9. Validate entitlements',
        '10. Generate capability configuration report'
      ],
      outputFormat: 'JSON with Xcode capabilities'
    },
    outputSchema: {
      type: 'object',
      required: ['capabilities', 'artifacts'],
      properties: {
        capabilities: { type: 'array', items: { type: 'string' } },
        entitlements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'push-notifications', 'xcode']
}));

export const tokenRegistrationTask = defineTask('token-registration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Token Registration - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Push Notification Developer',
      task: 'Implement device token registration',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Call registerForRemoteNotifications()',
        '2. Implement didRegisterForRemoteNotificationsWithDeviceToken',
        '3. Handle didFailToRegisterForRemoteNotificationsWithError',
        '4. Convert device token to string',
        '5. Send token to backend server',
        '6. Handle token refresh',
        '7. Store token locally for reference',
        '8. Implement retry logic for token upload',
        '9. Handle sandbox vs production tokens',
        '10. Document token registration flow'
      ],
      outputFormat: 'JSON with token registration'
    },
    outputSchema: {
      type: 'object',
      required: ['registrationFlow', 'artifacts'],
      properties: {
        registrationFlow: { type: 'object' },
        delegateMethods: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'push-notifications', 'device-token']
}));

export const permissionHandlingTask = defineTask('permission-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Permission Handling - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Push Notification Developer',
      task: 'Handle user permission requests',
      context: {
        appName: args.appName,
        notificationTypes: args.notificationTypes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create UNUserNotificationCenter.current()',
        '2. Request authorization with options',
        '3. Handle authorization status cases',
        '4. Implement pre-permission priming UI',
        '5. Handle provisional authorization (iOS 12+)',
        '6. Check current notification settings',
        '7. Handle settings changes',
        '8. Guide user to settings if denied',
        '9. Track permission analytics',
        '10. Document permission flow'
      ],
      outputFormat: 'JSON with permission handling'
    },
    outputSchema: {
      type: 'object',
      required: ['permissionFlow', 'artifacts'],
      properties: {
        permissionFlow: { type: 'object' },
        authorizationOptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'push-notifications', 'permissions']
}));

export const payloadParsingTask = defineTask('payload-parsing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Payload Parsing - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Push Notification Developer',
      task: 'Parse notification payloads',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define notification payload model',
        '2. Parse aps dictionary',
        '3. Extract alert, badge, sound',
        '4. Parse custom data fields',
        '5. Handle content-available flag',
        '6. Parse mutable-content flag',
        '7. Extract category identifier',
        '8. Handle localized strings',
        '9. Create payload validation',
        '10. Document payload structure'
      ],
      outputFormat: 'JSON with payload parsing'
    },
    outputSchema: {
      type: 'object',
      required: ['payloadModel', 'artifacts'],
      properties: {
        payloadModel: { type: 'object' },
        parsers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'push-notifications', 'payload']
}));

export const notificationHandlingTask = defineTask('notification-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Notification Handling - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Push Notification Developer',
      task: 'Handle notifications in foreground and background',
      context: {
        appName: args.appName,
        silent: args.silent,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement UNUserNotificationCenterDelegate',
        '2. Handle willPresent notification (foreground)',
        '3. Configure foreground presentation options',
        '4. Handle didReceive response (tap handling)',
        '5. Implement deep linking from notification',
        '6. Handle notification dismissal',
        '7. Track notification engagement',
        '8. Implement notification routing',
        '9. Handle edge cases (app launch, background)',
        '10. Document handling patterns'
      ],
      outputFormat: 'JSON with notification handling'
    },
    outputSchema: {
      type: 'object',
      required: ['delegateMethods', 'artifacts'],
      properties: {
        delegateMethods: { type: 'array', items: { type: 'string' } },
        handlingFlow: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'push-notifications', 'handling']
}));

export const actionsSetupTask = defineTask('actions-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Actions Setup - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Push Notification Developer',
      task: 'Define notification actions and categories',
      context: {
        appName: args.appName,
        actionCategories: args.actionCategories,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create UNNotificationAction definitions',
        '2. Configure action options (foreground, destructive)',
        '3. Create UNTextInputNotificationAction',
        '4. Define UNNotificationCategory',
        '5. Register categories with notification center',
        '6. Handle action responses',
        '7. Implement text input handling',
        '8. Configure action icons (iOS 15+)',
        '9. Test action interactions',
        '10. Document action categories'
      ],
      outputFormat: 'JSON with actions setup'
    },
    outputSchema: {
      type: 'object',
      required: ['categories', 'actions', 'artifacts'],
      properties: {
        categories: { type: 'array', items: { type: 'object' } },
        actions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'push-notifications', 'actions']
}));

export const richNotificationsTask = defineTask('rich-notifications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Rich Notifications - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Rich Notification Specialist',
      task: 'Implement rich notifications with service extension',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Notification Service Extension target',
        '2. Implement UNNotificationServiceExtension',
        '3. Override didReceive method',
        '4. Download and attach media (images, video)',
        '5. Modify notification content',
        '6. Handle service extension timeout',
        '7. Configure App Groups for shared data',
        '8. Create Notification Content Extension (optional)',
        '9. Test rich notification rendering',
        '10. Document rich notification setup'
      ],
      outputFormat: 'JSON with rich notifications'
    },
    outputSchema: {
      type: 'object',
      required: ['extensionName', 'supportedTypes', 'artifacts'],
      properties: {
        extensionName: { type: 'string' },
        supportedTypes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'push-notifications', 'rich-notifications']
}));

export const groupingSetupTask = defineTask('grouping-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Notification Grouping - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Push Notification Developer',
      task: 'Implement notification grouping',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure thread identifiers',
        '2. Set up summary formats',
        '3. Implement notification summary',
        '4. Configure group-based sound/badge',
        '5. Handle group expansion',
        '6. Implement custom group summaries',
        '7. Configure hidden preview summaries',
        '8. Test grouping behavior',
        '9. Optimize group organization',
        '10. Document grouping patterns'
      ],
      outputFormat: 'JSON with grouping setup'
    },
    outputSchema: {
      type: 'object',
      required: ['groupingConfig', 'artifacts'],
      properties: {
        groupingConfig: { type: 'object' },
        threadIdentifiers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'push-notifications', 'grouping']
}));

export const silentNotificationsTask = defineTask('silent-notifications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Silent Notifications - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Background Processing Specialist',
      task: 'Configure silent/background push notifications',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Enable Remote notifications background mode',
        '2. Configure content-available payload',
        '3. Implement application(_:didReceiveRemoteNotification:fetchCompletionHandler:)',
        '4. Handle background fetch completion',
        '5. Manage background execution time',
        '6. Implement data refresh logic',
        '7. Handle rate limiting',
        '8. Test background wake scenarios',
        '9. Monitor background execution',
        '10. Document silent notification patterns'
      ],
      outputFormat: 'JSON with silent notifications'
    },
    outputSchema: {
      type: 'object',
      required: ['backgroundConfig', 'artifacts'],
      properties: {
        backgroundConfig: { type: 'object' },
        backgroundModes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'push-notifications', 'silent', 'background']
}));

export const localNotificationsTask = defineTask('local-notifications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Local Notifications - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Notification Developer',
      task: 'Implement local notifications integration',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create UNMutableNotificationContent',
        '2. Configure notification triggers (time, calendar, location)',
        '3. Create UNNotificationRequest',
        '4. Schedule local notifications',
        '5. Cancel pending notifications',
        '6. Update scheduled notifications',
        '7. Handle local notification delivery',
        '8. Integrate with push notification handling',
        '9. Test notification scheduling',
        '10. Document local notification usage'
      ],
      outputFormat: 'JSON with local notifications'
    },
    outputSchema: {
      type: 'object',
      required: ['triggerTypes', 'artifacts'],
      properties: {
        triggerTypes: { type: 'array', items: { type: 'string' } },
        schedulingMethods: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'notifications', 'local']
}));

export const notificationCenterTask = defineTask('notification-center', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Notification Center - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Notification Developer',
      task: 'Integrate with Notification Center',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Query pending notifications',
        '2. Query delivered notifications',
        '3. Remove specific notifications',
        '4. Update notification badges',
        '5. Clear notification center',
        '6. Handle notification center settings',
        '7. Implement notification management UI',
        '8. Monitor notification delivery',
        '9. Handle notification center changes',
        '10. Document notification center APIs'
      ],
      outputFormat: 'JSON with notification center'
    },
    outputSchema: {
      type: 'object',
      required: ['centerAPIs', 'artifacts'],
      properties: {
        centerAPIs: { type: 'array', items: { type: 'string' } },
        managementMethods: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'notifications', 'notification-center']
}));

export const serverSetupTask = defineTask('server-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Server Setup - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'Backend Push Notification Specialist',
      task: 'Document server-side setup for APNs',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document APNs HTTP/2 API',
        '2. Create server authentication guide',
        '3. Document payload format',
        '4. Create send notification examples',
        '5. Document error handling',
        '6. Create rate limiting guidance',
        '7. Document feedback service',
        '8. Create multi-environment setup',
        '9. Document device token management',
        '10. Create server integration guide'
      ],
      outputFormat: 'JSON with server setup'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'artifacts'],
      properties: {
        documentation: { type: 'object' },
        apiEndpoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'push-notifications', 'server']
}));

export const testingStrategyTask = defineTask('testing-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Testing Strategy - ${args.appName}`,
  skill: { name: 'mobile-testing' },
  agent: {
    name: 'mobile-qa-expert',
    prompt: {
      role: 'iOS Test Engineer',
      task: 'Create testing strategy for push notifications',
      context: {
        appName: args.appName,
        notificationTypes: args.notificationTypes,
        richNotifications: args.richNotifications,
        actionCategories: args.actionCategories,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create push notification test plan',
        '2. Document simulator testing with payload files',
        '3. Set up device testing procedures',
        '4. Create automated UI tests for notifications',
        '5. Test permission flows',
        '6. Test action handling',
        '7. Test rich notification rendering',
        '8. Test background handling',
        '9. Create test notification payloads',
        '10. Document debugging techniques'
      ],
      outputFormat: 'JSON with testing strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['testPlan', 'artifacts'],
      properties: {
        testPlan: { type: 'object' },
        testCases: { type: 'array', items: { type: 'object' } },
        testPayloads: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'push-notifications', 'testing']
}));
