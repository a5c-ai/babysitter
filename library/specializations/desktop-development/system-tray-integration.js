/**
 * @process specializations/desktop-development/system-tray-integration
 * @description System Tray and Menu Bar Integration - Implement persistent system tray (Windows/Linux) or menu bar
 * (macOS) presence; add context menus, notifications, show/hide functionality.
 * @inputs { projectName: string, framework: string, targetPlatforms: array, trayFeatures: array, outputDir?: string }
 * @outputs { success: boolean, trayConfig: object, menuConfig: object, notificationSetup: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/system-tray-integration', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   targetPlatforms: ['windows', 'macos', 'linux'],
 *   trayFeatures: ['context-menu', 'notifications', 'show-hide', 'startup']
 * });
 *
 * @references
 * - Electron Tray: https://www.electronjs.org/docs/latest/api/tray
 * - Qt QSystemTrayIcon: https://doc.qt.io/qt-6/qsystemtrayicon.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    targetPlatforms = ['windows', 'macos', 'linux'],
    trayFeatures = ['context-menu', 'notifications', 'show-hide', 'startup'],
    outputDir = 'system-tray-integration'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting System Tray Integration: ${projectName}`);
  ctx.log('info', `Framework: ${framework}, Features: ${trayFeatures.join(', ')}`);

  // ============================================================================
  // PHASE 1: TRAY REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing tray integration requirements');

  const requirementsAnalysis = await ctx.task(trayRequirementsTask, {
    projectName,
    framework,
    targetPlatforms,
    trayFeatures,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: TRAY ICON AND ASSETS
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up tray icons and assets');

  const iconSetup = await ctx.task(setupTrayIconsTask, {
    projectName,
    framework,
    targetPlatforms,
    outputDir
  });

  artifacts.push(...iconSetup.artifacts);

  // ============================================================================
  // PHASE 3: TRAY IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing system tray');

  const trayImplementation = await ctx.task(implementSystemTrayTask, {
    projectName,
    framework,
    targetPlatforms,
    iconSetup,
    outputDir
  });

  artifacts.push(...trayImplementation.artifacts);

  // ============================================================================
  // PHASE 4: CONTEXT MENU IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing context menus');

  const contextMenuImpl = await ctx.task(implementContextMenuTask, {
    projectName,
    framework,
    targetPlatforms,
    trayFeatures,
    outputDir
  });

  artifacts.push(...contextMenuImpl.artifacts);

  // ============================================================================
  // PHASE 5: SHOW/HIDE FUNCTIONALITY
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing show/hide functionality');

  const showHideImpl = await ctx.task(implementShowHideTask, {
    projectName,
    framework,
    targetPlatforms,
    trayImplementation,
    outputDir
  });

  artifacts.push(...showHideImpl.artifacts);

  // ============================================================================
  // PHASE 6: NOTIFICATION INTEGRATION
  // ============================================================================

  let notificationSetup = null;
  if (trayFeatures.includes('notifications')) {
    ctx.log('info', 'Phase 6: Integrating tray notifications');

    notificationSetup = await ctx.task(integrateTrayNotificationsTask, {
      projectName,
      framework,
      targetPlatforms,
      trayImplementation,
      outputDir
    });

    artifacts.push(...notificationSetup.artifacts);
  }

  // ============================================================================
  // PHASE 7: STARTUP CONFIGURATION
  // ============================================================================

  let startupConfig = null;
  if (trayFeatures.includes('startup')) {
    ctx.log('info', 'Phase 7: Configuring auto-startup');

    startupConfig = await ctx.task(configureAutoStartupTask, {
      projectName,
      framework,
      targetPlatforms,
      outputDir
    });

    artifacts.push(...startupConfig.artifacts);
  }

  // ============================================================================
  // PHASE 8: PLATFORM-SPECIFIC ADAPTATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing platform-specific adaptations');

  const platformAdaptations = await ctx.task(implementPlatformAdaptationsTask, {
    projectName,
    framework,
    targetPlatforms,
    trayImplementation,
    contextMenuImpl,
    outputDir
  });

  artifacts.push(...platformAdaptations.artifacts);

  // ============================================================================
  // PHASE 9: DOCUMENTATION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating documentation and validating');

  const documentation = await ctx.task(generateTrayDocumentationTask, {
    projectName,
    framework,
    trayImplementation,
    contextMenuImpl,
    showHideImpl,
    notificationSetup,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const validation = await ctx.task(validateTrayIntegrationTask, {
    projectName,
    framework,
    targetPlatforms,
    trayFeatures,
    trayImplementation,
    contextMenuImpl,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  await ctx.breakpoint({
    question: `System Tray Integration Complete for ${projectName}! Validation score: ${validation.validationScore}/100. Approve implementation?`,
    title: 'System Tray Integration Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        framework,
        validationScore: validation.validationScore,
        featuresImplemented: trayFeatures.length,
        platformsSupported: targetPlatforms.length
      },
      files: documentation.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validationPassed,
    projectName,
    framework,
    trayConfig: {
      icons: iconSetup.icons,
      platforms: targetPlatforms
    },
    menuConfig: contextMenuImpl.menuStructure,
    showHide: showHideImpl.configuration,
    notificationSetup: notificationSetup ? {
      enabled: true,
      types: notificationSetup.notificationTypes
    } : null,
    startupConfig: startupConfig ? {
      enabled: true,
      platforms: startupConfig.supportedPlatforms
    } : null,
    validation: {
      score: validation.validationScore,
      passed: validationPassed
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/desktop-development/system-tray-integration',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const trayRequirementsTask = defineTask('tray-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Tray Requirements - ${args.projectName}`,
  agent: {
    name: 'tray-analyst',
    prompt: {
      role: 'System Tray Integration Analyst',
      task: 'Analyze system tray integration requirements',
      context: args,
      instructions: [
        '1. Analyze tray feature requirements',
        '2. Identify platform differences (tray vs menu bar)',
        '3. Document icon requirements per platform',
        '4. Assess context menu needs',
        '5. Identify notification requirements',
        '6. Document startup integration needs',
        '7. Assess accessibility requirements',
        '8. Document user preferences storage',
        '9. Identify platform limitations',
        '10. Generate requirements document'
      ],
      outputFormat: 'JSON with tray requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        platformDifferences: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'system-tray', 'requirements']
}));

export const setupTrayIconsTask = defineTask('setup-tray-icons', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Tray Icons - ${args.projectName}`,
  agent: {
    name: 'icon-designer',
    prompt: {
      role: 'Tray Icon Designer',
      task: 'Set up tray icons for all platforms',
      context: args,
      instructions: [
        '1. Define icon requirements per platform',
        '2. Create Windows tray icon specs (ICO, multiple sizes)',
        '3. Create macOS template icon specs (PNG, @1x, @2x)',
        '4. Create Linux icon specs (PNG)',
        '5. Design state icons (normal, active, alert)',
        '6. Handle dark/light mode icons',
        '7. Configure icon loading',
        '8. Set up icon switching logic',
        '9. Handle high DPI displays',
        '10. Generate icon configuration'
      ],
      outputFormat: 'JSON with icon setup'
    },
    outputSchema: {
      type: 'object',
      required: ['icons', 'artifacts'],
      properties: {
        icons: { type: 'object' },
        states: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'icons']
}));

export const implementSystemTrayTask = defineTask('implement-system-tray', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: System Tray Implementation - ${args.projectName}`,
  skill: {
    name: 'electron-tray-menu-builder',
  },
  agent: {
    name: 'system-tray-menu-manager',
    prompt: {
      role: 'System Tray Developer',
      task: 'Implement core system tray functionality',
      context: args,
      instructions: [
        '1. Create tray instance',
        '2. Configure tray icon',
        '3. Set up tray tooltip',
        '4. Handle tray click events',
        '5. Handle double-click behavior',
        '6. Implement tray balloon/notification',
        '7. Handle tray destroy/cleanup',
        '8. Implement tray state management',
        '9. Handle app lifecycle with tray',
        '10. Generate tray module'
      ],
      outputFormat: 'JSON with tray implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['trayModule', 'events', 'artifacts'],
      properties: {
        trayModule: { type: 'string' },
        events: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'system-tray']
}));

export const implementContextMenuTask = defineTask('implement-context-menu', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Context Menu - ${args.projectName}`,
  skill: {
    name: 'appkit-menu-bar-builder',
  },
  agent: {
    name: 'system-tray-menu-manager',
    prompt: {
      role: 'Context Menu Developer',
      task: 'Implement tray context menu',
      context: args,
      instructions: [
        '1. Design menu structure',
        '2. Create menu items (labels, actions)',
        '3. Add separators and grouping',
        '4. Implement submenus',
        '5. Add checkbox/radio items',
        '6. Configure keyboard shortcuts',
        '7. Handle menu item state',
        '8. Implement dynamic menu updates',
        '9. Handle menu click events',
        '10. Generate menu module'
      ],
      outputFormat: 'JSON with context menu implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['menuStructure', 'artifacts'],
      properties: {
        menuStructure: { type: 'object' },
        menuItems: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'context-menu']
}));

export const implementShowHideTask = defineTask('implement-show-hide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Show/Hide Functionality - ${args.projectName}`,
  agent: {
    name: 'window-developer',
    prompt: {
      role: 'Window Management Developer',
      task: 'Implement window show/hide from tray',
      context: args,
      instructions: [
        '1. Implement window minimize to tray',
        '2. Handle close button behavior',
        '3. Implement tray click to restore',
        '4. Handle window focus',
        '5. Implement dock/taskbar hiding',
        '6. Handle multiple windows',
        '7. Persist window position',
        '8. Handle tray-only mode',
        '9. Implement user preferences',
        '10. Generate show/hide module'
      ],
      outputFormat: 'JSON with show/hide implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        behaviors: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'window-management']
}));

export const integrateTrayNotificationsTask = defineTask('integrate-tray-notifications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Tray Notifications - ${args.projectName}`,
  agent: {
    name: 'notification-developer',
    prompt: {
      role: 'Notification Developer',
      task: 'Integrate notifications with system tray',
      context: args,
      instructions: [
        '1. Implement tray balloon notifications',
        '2. Configure notification actions',
        '3. Handle notification clicks',
        '4. Implement notification badges',
        '5. Handle do not disturb',
        '6. Configure sound/visual alerts',
        '7. Implement notification queue',
        '8. Handle notification persistence',
        '9. Configure platform-specific behavior',
        '10. Generate notification module'
      ],
      outputFormat: 'JSON with notification integration'
    },
    outputSchema: {
      type: 'object',
      required: ['notificationTypes', 'artifacts'],
      properties: {
        notificationTypes: { type: 'array', items: { type: 'string' } },
        badgeSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'notifications']
}));

export const configureAutoStartupTask = defineTask('configure-auto-startup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Auto-Startup - ${args.projectName}`,
  agent: {
    name: 'startup-developer',
    prompt: {
      role: 'Auto-Startup Developer',
      task: 'Configure application auto-startup',
      context: args,
      instructions: [
        '1. Implement Windows startup registry',
        '2. Configure macOS login items',
        '3. Set up Linux autostart (.desktop)',
        '4. Add startup toggle setting',
        '5. Handle minimized startup',
        '6. Configure startup delay',
        '7. Handle startup arguments',
        '8. Implement startup check',
        '9. Handle UAC/permissions',
        '10. Generate startup module'
      ],
      outputFormat: 'JSON with startup configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['supportedPlatforms', 'artifacts'],
      properties: {
        supportedPlatforms: { type: 'array', items: { type: 'string' } },
        startupMethods: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'auto-startup']
}));

export const implementPlatformAdaptationsTask = defineTask('implement-platform-adaptations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Platform Adaptations - ${args.projectName}`,
  agent: {
    name: 'platform-adapter',
    prompt: {
      role: 'Platform Adaptation Developer',
      task: 'Implement platform-specific tray adaptations',
      context: args,
      instructions: [
        '1. Adapt for Windows system tray',
        '2. Adapt for macOS menu bar',
        '3. Adapt for Linux indicators',
        '4. Handle platform icon formats',
        '5. Adapt menu for each platform',
        '6. Handle click behavior differences',
        '7. Adapt notification style',
        '8. Handle dark mode per platform',
        '9. Test platform behaviors',
        '10. Document platform differences'
      ],
      outputFormat: 'JSON with platform adaptations'
    },
    outputSchema: {
      type: 'object',
      required: ['adaptations', 'artifacts'],
      properties: {
        adaptations: { type: 'object' },
        platformNotes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'platform-adaptations']
}));

export const generateTrayDocumentationTask = defineTask('generate-tray-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9a: Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate system tray documentation',
      context: args,
      instructions: [
        '1. Document tray API',
        '2. Document context menu configuration',
        '3. Document show/hide behavior',
        '4. Document notification usage',
        '5. Document auto-startup setup',
        '6. Create platform-specific guides',
        '7. Document icon requirements',
        '8. Create troubleshooting guide',
        '9. Document user preferences',
        '10. Generate API reference'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['artifacts'],
      properties: {
        apiReferencePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'documentation']
}));

export const validateTrayIntegrationTask = defineTask('validate-tray-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9b: Validation - ${args.projectName}`,
  agent: {
    name: 'tray-validator',
    prompt: {
      role: 'System Tray Validator',
      task: 'Validate system tray integration',
      context: args,
      instructions: [
        '1. Verify tray creation',
        '2. Test icon display',
        '3. Verify context menu',
        '4. Test show/hide functionality',
        '5. Test notifications',
        '6. Verify auto-startup',
        '7. Test platform-specific behavior',
        '8. Calculate validation score',
        '9. Identify issues',
        '10. Generate recommendations'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        checks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'validation']
}));
