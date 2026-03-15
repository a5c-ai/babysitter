/**
 * @process specializations/mobile-development/firebase-cloud-messaging
 * @description Firebase Cloud Messaging Integration (Android) - Set up push notifications using Firebase Cloud Messaging
 * with proper notification handling, topic subscriptions, and message handling.
 * @inputs { appName: string, notificationTypes?: array, topicSubscriptions?: array, dataMessages?: boolean }
 * @outputs { success: boolean, configuration: object, handlers: array, testing: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/firebase-cloud-messaging', {
 *   appName: 'MyAndroidApp',
 *   notificationTypes: ['alert', 'data'],
 *   topicSubscriptions: ['news', 'updates'],
 *   dataMessages: true
 * });
 *
 * @references
 * - FCM Documentation: https://firebase.google.com/docs/cloud-messaging
 * - Android FCM: https://firebase.google.com/docs/cloud-messaging/android/client
 * - FCM Topics: https://firebase.google.com/docs/cloud-messaging/android/topic-messaging
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    notificationTypes = ['alert', 'data'],
    topicSubscriptions = [],
    dataMessages = true,
    analyticsIntegration = true,
    outputDir = 'fcm-integration'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Firebase Cloud Messaging Integration: ${appName}`);
  ctx.log('info', `Notification Types: ${notificationTypes.join(', ')}`);

  // ============================================================================
  // PHASE 1: FIREBASE PROJECT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up Firebase project');

  const firebaseSetup = await ctx.task(firebaseSetupTask, {
    appName,
    outputDir
  });

  artifacts.push(...firebaseSetup.artifacts);

  // ============================================================================
  // PHASE 2: FCM DEPENDENCIES
  // ============================================================================

  ctx.log('info', 'Phase 2: Adding FCM dependencies');

  const fcmDependencies = await ctx.task(fcmDependenciesTask, {
    appName,
    analyticsIntegration,
    outputDir
  });

  artifacts.push(...fcmDependencies.artifacts);

  // ============================================================================
  // PHASE 3: FIREBASE MESSAGING SERVICE
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing FirebaseMessagingService');

  const messagingService = await ctx.task(messagingServiceTask, {
    appName,
    notificationTypes,
    dataMessages,
    outputDir
  });

  artifacts.push(...messagingService.artifacts);

  // ============================================================================
  // PHASE 4: TOKEN MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing token management');

  const tokenManagement = await ctx.task(tokenManagementTask, {
    appName,
    outputDir
  });

  artifacts.push(...tokenManagement.artifacts);

  // ============================================================================
  // PHASE 5: NOTIFICATION CHANNEL SETUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up notification channels');

  const notificationChannels = await ctx.task(notificationChannelsTask, {
    appName,
    notificationTypes,
    outputDir
  });

  artifacts.push(...notificationChannels.artifacts);

  // ============================================================================
  // PHASE 6: NOTIFICATION HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing notification handling');

  const notificationHandling = await ctx.task(notificationHandlingTask, {
    appName,
    notificationTypes,
    outputDir
  });

  artifacts.push(...notificationHandling.artifacts);

  // ============================================================================
  // PHASE 7: DATA MESSAGE HANDLING
  // ============================================================================

  if (dataMessages) {
    ctx.log('info', 'Phase 7: Implementing data message handling');

    const dataMessageHandling = await ctx.task(dataMessageHandlingTask, {
      appName,
      outputDir
    });

    artifacts.push(...dataMessageHandling.artifacts);
  }

  // ============================================================================
  // PHASE 8: TOPIC SUBSCRIPTIONS
  // ============================================================================

  if (topicSubscriptions.length > 0) {
    ctx.log('info', 'Phase 8: Implementing topic subscriptions');

    const topicSetup = await ctx.task(topicSetupTask, {
      appName,
      topicSubscriptions,
      outputDir
    });

    artifacts.push(...topicSetup.artifacts);
  }

  // ============================================================================
  // PHASE 9: BACKGROUND HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 9: Handling background/killed state notifications');

  const backgroundHandling = await ctx.task(backgroundHandlingTask, {
    appName,
    outputDir
  });

  artifacts.push(...backgroundHandling.artifacts);

  // Quality Gate: FCM Configuration Review
  await ctx.breakpoint({
    question: `FCM configured for ${appName}. Notification types: ${notificationTypes.join(', ')}. Topics: ${topicSubscriptions.length}. Review configuration?`,
    title: 'FCM Configuration Review',
    context: {
      runId: ctx.runId,
      appName,
      notificationTypes,
      topicSubscriptions,
      dataMessages,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: 'kotlin' }))
    }
  });

  // ============================================================================
  // PHASE 10: DEEP LINKING
  // ============================================================================

  ctx.log('info', 'Phase 10: Implementing deep linking from notifications');

  const deepLinking = await ctx.task(deepLinkingTask, {
    appName,
    outputDir
  });

  artifacts.push(...deepLinking.artifacts);

  // ============================================================================
  // PHASE 11: PERMISSION HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 11: Handling notification permissions (Android 13+)');

  const permissionHandling = await ctx.task(permissionHandlingTask, {
    appName,
    outputDir
  });

  artifacts.push(...permissionHandling.artifacts);

  // ============================================================================
  // PHASE 12: SERVER INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Documenting server-side integration');

  const serverIntegration = await ctx.task(serverIntegrationTask, {
    appName,
    outputDir
  });

  artifacts.push(...serverIntegration.artifacts);

  // ============================================================================
  // PHASE 13: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 13: Creating testing strategy');

  const testingStrategy = await ctx.task(testingStrategyTask, {
    appName,
    notificationTypes,
    topicSubscriptions,
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
      topicSubscriptions,
      dataMessages,
      analyticsIntegration
    },
    handlers: {
      messagingService: messagingService.serviceName,
      notificationHandler: notificationHandling.handlerName,
      dataHandler: dataMessages ? 'DataMessageHandler' : null
    },
    channels: notificationChannels.channels,
    topics: topicSubscriptions,
    deepLinking: deepLinking.configuration,
    testing: testingStrategy.testPlan,
    serverDocs: serverIntegration.documentation,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/mobile-development/firebase-cloud-messaging',
      timestamp: startTime,
      notificationTypes,
      topicSubscriptions
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const firebaseSetupTask = defineTask('firebase-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Firebase Setup - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Firebase Specialist',
      task: 'Set up Firebase project for FCM',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Firebase project in console',
        '2. Register Android app with package name',
        '3. Download google-services.json',
        '4. Add google-services plugin to build.gradle',
        '5. Configure project-level build.gradle',
        '6. Verify Firebase initialization',
        '7. Enable Cloud Messaging in Firebase console',
        '8. Configure FCM settings',
        '9. Document project configuration',
        '10. Generate setup report'
      ],
      outputFormat: 'JSON with Firebase setup'
    },
    outputSchema: {
      type: 'object',
      required: ['projectId', 'artifacts'],
      properties: {
        projectId: { type: 'string' },
        appId: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'firebase', 'setup']
}));

export const fcmDependenciesTask = defineTask('fcm-dependencies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: FCM Dependencies - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Build Configuration Specialist',
      task: 'Add FCM dependencies to project',
      context: {
        appName: args.appName,
        analyticsIntegration: args.analyticsIntegration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Add Firebase BOM',
        '2. Add firebase-messaging dependency',
        '3. Add firebase-analytics if enabled',
        '4. Configure Kotlin extensions',
        '5. Add coroutines for async operations',
        '6. Configure proguard rules',
        '7. Add test dependencies',
        '8. Sync project dependencies',
        '9. Verify dependency resolution',
        '10. Document dependencies'
      ],
      outputFormat: 'JSON with FCM dependencies'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencies', 'artifacts'],
      properties: {
        dependencies: { type: 'object' },
        bomVersion: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'firebase', 'fcm', 'dependencies']
}));

export const messagingServiceTask = defineTask('messaging-service', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Messaging Service - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android FCM Developer',
      task: 'Implement FirebaseMessagingService',
      context: {
        appName: args.appName,
        notificationTypes: args.notificationTypes,
        dataMessages: args.dataMessages,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create FirebaseMessagingService subclass',
        '2. Override onNewToken method',
        '3. Override onMessageReceived method',
        '4. Register service in AndroidManifest.xml',
        '5. Handle message priority',
        '6. Configure service lifecycle',
        '7. Add logging for debugging',
        '8. Handle service destruction',
        '9. Implement error handling',
        '10. Document service implementation'
      ],
      outputFormat: 'JSON with messaging service'
    },
    outputSchema: {
      type: 'object',
      required: ['serviceName', 'artifacts'],
      properties: {
        serviceName: { type: 'string' },
        methods: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'firebase', 'fcm', 'service']
}));

export const tokenManagementTask = defineTask('token-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Token Management - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android FCM Developer',
      task: 'Implement FCM token management',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Get current FCM token',
        '2. Handle token refresh in onNewToken',
        '3. Send token to backend server',
        '4. Store token locally',
        '5. Implement token deletion',
        '6. Handle token errors',
        '7. Implement retry logic',
        '8. Track token changes',
        '9. Handle user logout',
        '10. Document token management'
      ],
      outputFormat: 'JSON with token management'
    },
    outputSchema: {
      type: 'object',
      required: ['tokenMethods', 'artifacts'],
      properties: {
        tokenMethods: { type: 'array', items: { type: 'string' } },
        storage: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'firebase', 'fcm', 'token']
}));

export const notificationChannelsTask = defineTask('notification-channels', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Notification Channels - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Notification Specialist',
      task: 'Set up notification channels (Android 8+)',
      context: {
        appName: args.appName,
        notificationTypes: args.notificationTypes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create NotificationChannel for each type',
        '2. Configure channel importance',
        '3. Set notification sound',
        '4. Configure vibration pattern',
        '5. Set notification light',
        '6. Configure lock screen visibility',
        '7. Create channel groups',
        '8. Handle channel updates',
        '9. Initialize channels in Application',
        '10. Document channel configuration'
      ],
      outputFormat: 'JSON with notification channels'
    },
    outputSchema: {
      type: 'object',
      required: ['channels', 'artifacts'],
      properties: {
        channels: { type: 'array', items: { type: 'object' } },
        groups: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'notifications', 'channels']
}));

export const notificationHandlingTask = defineTask('notification-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Notification Handling - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Notification Developer',
      task: 'Implement notification display and handling',
      context: {
        appName: args.appName,
        notificationTypes: args.notificationTypes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Build notifications with NotificationCompat.Builder',
        '2. Configure notification content',
        '3. Add notification actions',
        '4. Implement expandable notifications',
        '5. Add progress notifications',
        '6. Handle notification clicks',
        '7. Implement notification grouping',
        '8. Configure notification icons',
        '9. Handle notification dismissal',
        '10. Document notification patterns'
      ],
      outputFormat: 'JSON with notification handling'
    },
    outputSchema: {
      type: 'object',
      required: ['handlerName', 'artifacts'],
      properties: {
        handlerName: { type: 'string' },
        notificationTypes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'notifications', 'handling']
}));

export const dataMessageHandlingTask = defineTask('data-message-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Data Message Handling - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android FCM Developer',
      task: 'Implement data message handling',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Parse data payload from RemoteMessage',
        '2. Handle data-only messages',
        '3. Process data in background',
        '4. Trigger local operations',
        '5. Sync data with local database',
        '6. Handle message priorities',
        '7. Implement message deduplication',
        '8. Handle message ordering',
        '9. Log data message processing',
        '10. Document data message patterns'
      ],
      outputFormat: 'JSON with data message handling'
    },
    outputSchema: {
      type: 'object',
      required: ['dataHandlers', 'artifacts'],
      properties: {
        dataHandlers: { type: 'array', items: { type: 'string' } },
        dataTypes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'fcm', 'data-messages']
}));

export const topicSetupTask = defineTask('topic-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Topic Subscriptions - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android FCM Developer',
      task: 'Implement topic subscriptions',
      context: {
        appName: args.appName,
        topicSubscriptions: args.topicSubscriptions,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Subscribe to topics with subscribeToTopic',
        '2. Unsubscribe from topics',
        '3. Handle subscription success/failure',
        '4. Store subscription state locally',
        '5. Sync subscriptions with user preferences',
        '6. Implement bulk subscription',
        '7. Handle topic naming conventions',
        '8. Track topic analytics',
        '9. Create subscription UI',
        '10. Document topic management'
      ],
      outputFormat: 'JSON with topic setup'
    },
    outputSchema: {
      type: 'object',
      required: ['topics', 'artifacts'],
      properties: {
        topics: { type: 'array', items: { type: 'string' } },
        subscriptionMethods: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'fcm', 'topics']
}));

export const backgroundHandlingTask = defineTask('background-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Background Handling - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Background Processing Specialist',
      task: 'Handle notifications when app is in background/killed',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Handle system tray notifications',
        '2. Process click_action in manifest',
        '3. Handle notification data in Activity',
        '4. Implement getIntent() data extraction',
        '5. Handle cold start from notification',
        '6. Manage pending intents',
        '7. Configure launch modes',
        '8. Handle multi-instance scenarios',
        '9. Test background scenarios',
        '10. Document background patterns'
      ],
      outputFormat: 'JSON with background handling'
    },
    outputSchema: {
      type: 'object',
      required: ['handlers', 'artifacts'],
      properties: {
        handlers: { type: 'array', items: { type: 'string' } },
        intentFilters: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'fcm', 'background']
}));

export const deepLinkingTask = defineTask('deep-linking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Deep Linking - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Navigation Developer',
      task: 'Implement deep linking from notifications',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure deep link URIs',
        '2. Add intent filters in manifest',
        '3. Handle deep links in Activity',
        '4. Navigate to correct screen',
        '5. Pass notification data to destination',
        '6. Handle deep link with navigation component',
        '7. Test deep link scenarios',
        '8. Handle invalid deep links',
        '9. Track deep link analytics',
        '10. Document deep linking'
      ],
      outputFormat: 'JSON with deep linking'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        deepLinks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'fcm', 'deep-linking']
}));

export const permissionHandlingTask = defineTask('permission-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Permission Handling - ${args.appName}`,
  skill: { name: 'push-notifications' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Permissions Specialist',
      task: 'Handle notification permissions (Android 13+)',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Add POST_NOTIFICATIONS permission to manifest',
        '2. Check permission status',
        '3. Request permission at runtime',
        '4. Handle permission grant/denial',
        '5. Guide user to settings if denied',
        '6. Implement permission rationale dialog',
        '7. Handle permission for older Android versions',
        '8. Track permission analytics',
        '9. Test permission flows',
        '10. Document permission handling'
      ],
      outputFormat: 'JSON with permission handling'
    },
    outputSchema: {
      type: 'object',
      required: ['permissionFlow', 'artifacts'],
      properties: {
        permissionFlow: { type: 'object' },
        runtimePermissions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'permissions', 'notifications']
}));

export const serverIntegrationTask = defineTask('server-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Server Integration - ${args.appName}`,
  skill: { name: 'firebase-integration' },
  agent: {
    name: 'cross-platform-architect',
    prompt: {
      role: 'Backend FCM Integration Specialist',
      task: 'Document server-side FCM integration',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document FCM HTTP v1 API',
        '2. Create service account setup guide',
        '3. Document access token generation',
        '4. Create message payload examples',
        '5. Document topic messaging',
        '6. Create multicast messaging guide',
        '7. Document error handling',
        '8. Create rate limiting guidance',
        '9. Document FCM Analytics',
        '10. Create integration checklist'
      ],
      outputFormat: 'JSON with server integration'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'artifacts'],
      properties: {
        documentation: { type: 'object' },
        endpoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'fcm', 'server']
}));

export const testingStrategyTask = defineTask('testing-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Testing Strategy - ${args.appName}`,
  agent: {
    name: 'mobile-qa-expert',
    prompt: {
      role: 'Android Test Engineer',
      task: 'Create testing strategy for FCM',
      context: {
        appName: args.appName,
        notificationTypes: args.notificationTypes,
        topicSubscriptions: args.topicSubscriptions,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create FCM test plan',
        '2. Test with Firebase console',
        '3. Test with Postman/curl',
        '4. Write unit tests for handlers',
        '5. Test notification display',
        '6. Test background scenarios',
        '7. Test deep linking',
        '8. Test topic subscriptions',
        '9. Create test notification payloads',
        '10. Document testing procedures'
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
  labels: ['mobile', 'android', 'fcm', 'testing']
}));
