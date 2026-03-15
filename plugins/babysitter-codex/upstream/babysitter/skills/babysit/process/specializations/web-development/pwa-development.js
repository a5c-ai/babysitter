/**
 * @process specializations/web-development/pwa-development
 * @description Progressive Web App (PWA) Development - Process for converting web applications into PWAs with service workers,
 * offline functionality, app manifest, push notifications, and installation capabilities.
 * @inputs { projectName: string, framework?: string, features?: object, offlineStrategy?: string, pushNotifications?: boolean }
 * @outputs { success: boolean, serviceWorkerConfig: object, manifestConfig: object, offlineSupport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/web-development/pwa-development', {
 *   projectName: 'MyPWA',
 *   framework: 'react',
 *   features: { offline: true, push: true, backgroundSync: true },
 *   offlineStrategy: 'cache-first',
 *   pushNotifications: true
 * });
 *
 * @references
 * - PWA Documentation: https://web.dev/progressive-web-apps/
 * - Workbox: https://developers.google.com/web/tools/workbox
 * - Service Worker API: https://developer.mozilla.org/docs/Web/API/Service_Worker_API
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'react',
    features = { offline: true, push: false, backgroundSync: false },
    offlineStrategy = 'cache-first',
    pushNotifications = false,
    outputDir = 'pwa-development'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting PWA Development: ${projectName}`);
  ctx.log('info', `Framework: ${framework}, Offline Strategy: ${offlineStrategy}`);

  // ============================================================================
  // PHASE 1: PWA REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing PWA requirements');

  const requirements = await ctx.task(requirementsAnalysisTask, {
    projectName,
    framework,
    features,
    offlineStrategy,
    pushNotifications,
    outputDir
  });

  artifacts.push(...requirements.artifacts);

  // ============================================================================
  // PHASE 2: WEB APP MANIFEST
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating Web App Manifest');

  const manifestSetup = await ctx.task(manifestSetupTask, {
    projectName,
    requirements,
    outputDir
  });

  artifacts.push(...manifestSetup.artifacts);

  // ============================================================================
  // PHASE 3: SERVICE WORKER CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring Service Worker with Workbox');

  const serviceWorkerSetup = await ctx.task(serviceWorkerSetupTask, {
    projectName,
    framework,
    offlineStrategy,
    features,
    outputDir
  });

  artifacts.push(...serviceWorkerSetup.artifacts);

  // ============================================================================
  // PHASE 4: CACHING STRATEGIES
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing caching strategies');

  const cachingSetup = await ctx.task(cachingStrategiesTask, {
    projectName,
    offlineStrategy,
    serviceWorkerSetup,
    outputDir
  });

  artifacts.push(...cachingSetup.artifacts);

  // ============================================================================
  // PHASE 5: OFFLINE SUPPORT
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing offline support');

  const offlineSupport = await ctx.task(offlineSupportTask, {
    projectName,
    features,
    cachingSetup,
    outputDir
  });

  artifacts.push(...offlineSupport.artifacts);

  // ============================================================================
  // PHASE 6: PUSH NOTIFICATIONS
  // ============================================================================

  if (pushNotifications) {
    ctx.log('info', 'Phase 6: Setting up push notifications');

    const pushSetup = await ctx.task(pushNotificationsTask, {
      projectName,
      serviceWorkerSetup,
      outputDir
    });

    artifacts.push(...pushSetup.artifacts);
  }

  // ============================================================================
  // PHASE 7: INSTALLATION PROMPTS
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing installation prompts');

  const installationSetup = await ctx.task(installationPromptsTask, {
    projectName,
    framework,
    outputDir
  });

  artifacts.push(...installationSetup.artifacts);

  // ============================================================================
  // PHASE 8: PWA TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Setting up PWA testing');

  const testingSetup = await ctx.task(pwaTestingTask, {
    projectName,
    serviceWorkerSetup,
    manifestSetup,
    outputDir
  });

  artifacts.push(...testingSetup.artifacts);

  // Quality Gate
  await ctx.breakpoint({
    question: `PWA configuration complete for ${projectName}. Service Worker with ${offlineStrategy} strategy, ${features.offline ? 'offline support enabled' : 'offline support disabled'}. Approve configuration?`,
    title: 'PWA Configuration Review',
    context: {
      runId: ctx.runId,
      manifestConfig: manifestSetup.manifest,
      cachingStrategies: cachingSetup.strategies,
      lighthouseScore: testingSetup.estimatedScore,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'javascript' }))
    }
  });

  // ============================================================================
  // PHASE 9: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating PWA documentation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    manifestSetup,
    serviceWorkerSetup,
    cachingSetup,
    offlineSupport,
    installationSetup,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    serviceWorkerConfig: serviceWorkerSetup.config,
    manifestConfig: manifestSetup.manifest,
    cachingStrategies: cachingSetup.strategies,
    offlineSupport: offlineSupport.features,
    installationPrompt: installationSetup.promptConfig,
    testing: {
      lighthouseConfig: testingSetup.lighthouseConfig,
      estimatedScore: testingSetup.estimatedScore
    },
    documentation: documentation.docs,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/web-development/pwa-development',
      timestamp: startTime,
      framework,
      offlineStrategy
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requirementsAnalysisTask = defineTask('pwa-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: PWA Requirements - ${args.projectName}`,
  agent: {
    name: 'performance-auditor-agent',
    prompt: {
      role: 'PWA Architect',
      task: 'Analyze PWA requirements',
      context: args,
      instructions: [
        '1. Analyze application for PWA suitability',
        '2. Identify cacheable resources',
        '3. Define offline requirements',
        '4. Assess notification needs',
        '5. Plan installation experience',
        '6. Identify background sync needs',
        '7. Plan asset optimization',
        '8. Define update strategy',
        '9. Assess browser support requirements',
        '10. Document PWA requirements'
      ],
      outputFormat: 'JSON with PWA requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        cacheableResources: { type: 'array' },
        offlinePages: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'pwa', 'requirements']
}));

export const manifestSetupTask = defineTask('pwa-manifest', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Web App Manifest - ${args.projectName}`,
  agent: {
    name: 'pwa-developer',
    prompt: {
      role: 'PWA Developer',
      task: 'Create Web App Manifest',
      context: args,
      instructions: [
        '1. Create manifest.json with app metadata',
        '2. Configure app name and short_name',
        '3. Set up icons for all sizes',
        '4. Configure theme and background colors',
        '5. Set display mode (standalone, fullscreen)',
        '6. Configure start URL',
        '7. Set up shortcuts for quick actions',
        '8. Configure share target if needed',
        '9. Set up screenshots for store listing',
        '10. Document manifest configuration'
      ],
      outputFormat: 'JSON with manifest configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['manifest', 'icons', 'artifacts'],
      properties: {
        manifest: { type: 'object' },
        icons: { type: 'array' },
        screenshots: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'pwa', 'manifest']
}));

export const serviceWorkerSetupTask = defineTask('service-worker-setup', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 3: Service Worker Setup - ${args.projectName}`,
  skill: {
    name: 'caching-skill',
    prompt: {
      role: 'Service Worker Specialist',
      task: 'Configure Service Worker with Workbox',
      context: args,
      instructions: [
        '1. Install and configure Workbox',
        '2. Set up service worker registration',
        '3. Configure precaching for critical assets',
        '4. Set up runtime caching strategies',
        '5. Implement cache versioning',
        '6. Configure skip waiting and claim clients',
        '7. Set up navigation preload',
        '8. Implement update flow',
        '9. Configure error handling',
        '10. Document service worker setup'
      ],
      outputFormat: 'JSON with service worker configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'registration', 'artifacts'],
      properties: {
        config: { type: 'object' },
        registration: { type: 'object' },
        workboxConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'pwa', 'service-worker', 'workbox']
}));

export const cachingStrategiesTask = defineTask('caching-strategies', (args, taskCtx) => ({
  kind: 'skill',
  title: `Phase 4: Caching Strategies - ${args.projectName}`,
  skill: {
    name: 'caching-skill',
    prompt: {
      role: 'PWA Caching Specialist',
      task: 'Implement caching strategies',
      context: args,
      instructions: [
        '1. Configure Cache First for static assets',
        '2. Set up Network First for API calls',
        '3. Implement Stale While Revalidate',
        '4. Configure cache expiration policies',
        '5. Set up cache size limits',
        '6. Implement cache cleanup',
        '7. Configure route-specific strategies',
        '8. Set up cache broadcast updates',
        '9. Implement cache warming',
        '10. Document caching patterns'
      ],
      outputFormat: 'JSON with caching configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'expiration', 'artifacts'],
      properties: {
        strategies: { type: 'array', items: { type: 'object' } },
        expiration: { type: 'object' },
        routes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'pwa', 'caching']
}));

export const offlineSupportTask = defineTask('offline-support', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Offline Support - ${args.projectName}`,
  agent: {
    name: 'offline-specialist',
    prompt: {
      role: 'Offline Support Specialist',
      task: 'Implement offline functionality',
      context: args,
      instructions: [
        '1. Create offline fallback page',
        '2. Implement network status detection',
        '3. Create offline UI indicators',
        '4. Implement data sync queue',
        '5. Set up IndexedDB for offline data',
        '6. Configure background sync',
        '7. Implement conflict resolution',
        '8. Create offline-first patterns',
        '9. Set up data persistence',
        '10. Document offline capabilities'
      ],
      outputFormat: 'JSON with offline support configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'fallbackPages', 'artifacts'],
      properties: {
        features: { type: 'object' },
        fallbackPages: { type: 'array' },
        syncConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'pwa', 'offline']
}));

export const pushNotificationsTask = defineTask('push-notifications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Push Notifications - ${args.projectName}`,
  agent: {
    name: 'push-notifications-specialist',
    prompt: {
      role: 'Push Notifications Specialist',
      task: 'Set up push notifications',
      context: args,
      instructions: [
        '1. Configure push subscription',
        '2. Set up VAPID keys',
        '3. Implement permission request flow',
        '4. Create notification templates',
        '5. Set up notification actions',
        '6. Implement notification click handling',
        '7. Configure notification badges',
        '8. Set up notification grouping',
        '9. Implement silent push',
        '10. Document push setup'
      ],
      outputFormat: 'JSON with push notification configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['pushConfig', 'permissions', 'artifacts'],
      properties: {
        pushConfig: { type: 'object' },
        permissions: { type: 'object' },
        templates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'pwa', 'push-notifications']
}));

export const installationPromptsTask = defineTask('installation-prompts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Installation Prompts - ${args.projectName}`,
  agent: {
    name: 'pwa-ux-specialist',
    prompt: {
      role: 'PWA UX Specialist',
      task: 'Implement installation prompts',
      context: args,
      instructions: [
        '1. Intercept beforeinstallprompt event',
        '2. Create custom install UI',
        '3. Implement install button component',
        '4. Track install analytics',
        '5. Handle post-install flow',
        '6. Create iOS install instructions',
        '7. Implement install banner',
        '8. Configure install timing',
        '9. A/B test install prompts',
        '10. Document installation UX'
      ],
      outputFormat: 'JSON with installation configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['promptConfig', 'components', 'artifacts'],
      properties: {
        promptConfig: { type: 'object' },
        components: { type: 'array' },
        analytics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'pwa', 'installation']
}));

export const pwaTestingTask = defineTask('pwa-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: PWA Testing - ${args.projectName}`,
  agent: {
    name: 'pwa-testing-specialist',
    prompt: {
      role: 'PWA Testing Specialist',
      task: 'Set up PWA testing',
      context: args,
      instructions: [
        '1. Configure Lighthouse CI',
        '2. Set up PWA audit automation',
        '3. Create service worker tests',
        '4. Test offline functionality',
        '5. Test installation flow',
        '6. Verify manifest configuration',
        '7. Test caching strategies',
        '8. Performance testing',
        '9. Cross-browser testing',
        '10. Document testing procedures'
      ],
      outputFormat: 'JSON with testing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['lighthouseConfig', 'estimatedScore', 'artifacts'],
      properties: {
        lighthouseConfig: { type: 'object' },
        estimatedScore: { type: 'number' },
        testSuites: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'pwa', 'testing', 'lighthouse']
}));

export const documentationTask = defineTask('pwa-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: PWA Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate PWA documentation',
      context: args,
      instructions: [
        '1. Create PWA setup guide',
        '2. Document manifest configuration',
        '3. Create service worker guide',
        '4. Document caching strategies',
        '5. Create offline usage guide',
        '6. Document push notifications',
        '7. Create installation guide',
        '8. Document testing procedures',
        '9. Create troubleshooting guide',
        '10. Generate API documentation'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['docs', 'artifacts'],
      properties: {
        docs: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['web', 'pwa', 'documentation']
}));
