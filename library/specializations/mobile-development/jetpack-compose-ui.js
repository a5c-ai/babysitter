/**
 * @process specializations/mobile-development/jetpack-compose-ui
 * @description Jetpack Compose UI Development - Build modern Android UI using Jetpack Compose with Material Design 3,
 * proper state management, accessibility, and testing following Google's best practices.
 * @inputs { appName: string, designSystem?: object, features?: array, navigation?: string, stateManagement?: string }
 * @outputs { success: boolean, composables: array, screens: array, theme: object, tests: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/jetpack-compose-ui', {
 *   appName: 'MyAndroidApp',
 *   designSystem: { colors: {}, typography: {}, shapes: {} },
 *   features: ['home', 'profile', 'settings'],
 *   navigation: 'compose-navigation',
 *   stateManagement: 'viewmodel'
 * });
 *
 * @references
 * - Jetpack Compose: https://developer.android.com/jetpack/compose
 * - Material Design 3: https://m3.material.io/
 * - Compose Navigation: https://developer.android.com/jetpack/compose/navigation
 * - Compose Testing: https://developer.android.com/jetpack/compose/testing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    designSystem = {},
    features = [],
    navigation = 'compose-navigation',
    stateManagement = 'viewmodel',
    minSdkVersion = 24,
    outputDir = 'jetpack-compose-ui'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Jetpack Compose UI Development: ${appName}`);
  ctx.log('info', `Features: ${features.length}, Navigation: ${navigation}`);

  // ============================================================================
  // PHASE 1: PROJECT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up Compose in Android project');

  const projectSetup = await ctx.task(projectSetupTask, {
    appName,
    minSdkVersion,
    outputDir
  });

  artifacts.push(...projectSetup.artifacts);

  // ============================================================================
  // PHASE 2: MATERIAL 3 THEME
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating Material 3 theme');

  const themeSetup = await ctx.task(themeSetupTask, {
    appName,
    designSystem,
    outputDir
  });

  artifacts.push(...themeSetup.artifacts);

  // ============================================================================
  // PHASE 3: NAVIGATION SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up Compose Navigation');

  const navigationSetup = await ctx.task(navigationSetupTask, {
    appName,
    navigation,
    features,
    outputDir
  });

  artifacts.push(...navigationSetup.artifacts);

  // ============================================================================
  // PHASE 4: BASE COMPOSABLES
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating reusable base composables');

  const baseComposables = await ctx.task(baseComposablesTask, {
    appName,
    themeSetup,
    outputDir
  });

  artifacts.push(...baseComposables.artifacts);

  // ============================================================================
  // PHASE 5: SCREEN COMPOSABLES
  // ============================================================================

  ctx.log('info', 'Phase 5: Building screen composables');

  const screenComposables = await ctx.task(screenComposablesTask, {
    appName,
    features,
    navigationSetup,
    baseComposables,
    outputDir
  });

  artifacts.push(...screenComposables.artifacts);

  // ============================================================================
  // PHASE 6: STATE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing state management with ViewModel');

  const stateSetup = await ctx.task(stateSetupTask, {
    appName,
    stateManagement,
    features,
    outputDir
  });

  artifacts.push(...stateSetup.artifacts);

  // ============================================================================
  // PHASE 7: STATE HOISTING PATTERNS
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing state hoisting patterns');

  const stateHoisting = await ctx.task(stateHoistingTask, {
    appName,
    screenComposables,
    stateSetup,
    outputDir
  });

  artifacts.push(...stateHoisting.artifacts);

  // ============================================================================
  // PHASE 8: LISTS AND LAZY LOADING
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing LazyColumn and LazyRow');

  const lazyComponents = await ctx.task(lazyComponentsTask, {
    appName,
    outputDir
  });

  artifacts.push(...lazyComponents.artifacts);

  // ============================================================================
  // PHASE 9: ANIMATIONS
  // ============================================================================

  ctx.log('info', 'Phase 9: Adding Compose animations');

  const animations = await ctx.task(animationsTask, {
    appName,
    screenComposables,
    outputDir
  });

  artifacts.push(...animations.artifacts);

  // ============================================================================
  // PHASE 10: ACCESSIBILITY
  // ============================================================================

  ctx.log('info', 'Phase 10: Implementing accessibility with semantics');

  const accessibility = await ctx.task(accessibilityTask, {
    appName,
    baseComposables,
    screenComposables,
    outputDir
  });

  artifacts.push(...accessibility.artifacts);

  // Quality Gate: UI Implementation Review
  await ctx.breakpoint({
    question: `Compose UI implemented for ${appName}. ${screenComposables.screens.length} screens, ${baseComposables.composables.length} composables. Review implementation?`,
    title: 'Compose UI Review',
    context: {
      runId: ctx.runId,
      appName,
      screens: screenComposables.screens,
      composables: baseComposables.composables,
      accessibilityScore: accessibility.complianceScore,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: 'kotlin' }))
    }
  });

  // ============================================================================
  // PHASE 11: PREVIEWS
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating @Preview composables');

  const previews = await ctx.task(previewsTask, {
    appName,
    baseComposables,
    screenComposables,
    themeSetup,
    outputDir
  });

  artifacts.push(...previews.artifacts);

  // ============================================================================
  // PHASE 12: UI TESTING
  // ============================================================================

  ctx.log('info', 'Phase 12: Writing Compose UI tests');

  const uiTests = await ctx.task(uiTestsTask, {
    appName,
    baseComposables,
    screenComposables,
    outputDir
  });

  artifacts.push(...uiTests.artifacts);

  // ============================================================================
  // PHASE 13: PERFORMANCE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Optimizing Compose performance');

  const performance = await ctx.task(performanceTask, {
    appName,
    screenComposables,
    outputDir
  });

  artifacts.push(...performance.artifacts);

  // ============================================================================
  // PHASE 14: INTEROPERABILITY
  // ============================================================================

  ctx.log('info', 'Phase 14: Ensuring interoperability with View system');

  const interop = await ctx.task(interopTask, {
    appName,
    outputDir
  });

  artifacts.push(...interop.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    appName,
    composables: baseComposables.composables,
    screens: screenComposables.screens,
    theme: themeSetup.theme,
    navigation: navigationSetup.routes,
    state: {
      pattern: stateManagement,
      viewModels: stateSetup.viewModels
    },
    accessibility: {
      score: accessibility.complianceScore,
      features: accessibility.features
    },
    tests: {
      testCount: uiTests.testCount,
      coverage: uiTests.coverage
    },
    performance: performance.optimizations,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/mobile-development/jetpack-compose-ui',
      timestamp: startTime,
      minSdkVersion,
      navigation
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const projectSetupTask = defineTask('project-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Project Setup - ${args.appName}`,
  skill: { name: 'kotlin-compose' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Compose Developer',
      task: 'Set up Compose in Android project',
      context: {
        appName: args.appName,
        minSdkVersion: args.minSdkVersion,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure build.gradle with Compose compiler',
        '2. Add Compose BOM for version management',
        '3. Add Material 3 dependencies',
        '4. Configure compose compiler options',
        '5. Set up Kotlin compiler extension version',
        '6. Add navigation-compose dependency',
        '7. Add lifecycle-runtime-compose',
        '8. Configure compose test dependencies',
        '9. Set up compose compiler metrics',
        '10. Document project configuration'
      ],
      outputFormat: 'JSON with project setup'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencies', 'artifacts'],
      properties: {
        dependencies: { type: 'object' },
        composeVersion: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'compose', 'setup']
}));

export const themeSetupTask = defineTask('theme-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Theme Setup - ${args.appName}`,
  skill: { name: 'kotlin-compose' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Material Design Specialist',
      task: 'Create Material 3 theme for Compose',
      context: {
        appName: args.appName,
        designSystem: args.designSystem,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define color scheme with Material Theme Builder',
        '2. Create light and dark color schemes',
        '3. Define typography scale',
        '4. Create custom shapes',
        '5. Build MaterialTheme composable',
        '6. Add dynamic color support (Android 12+)',
        '7. Create theme preview utilities',
        '8. Define custom color extensions',
        '9. Add dimension tokens',
        '10. Document theme usage'
      ],
      outputFormat: 'JSON with theme setup'
    },
    outputSchema: {
      type: 'object',
      required: ['theme', 'artifacts'],
      properties: {
        theme: { type: 'object' },
        colorSchemes: { type: 'object' },
        typography: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'compose', 'material3', 'theming']
}));

export const navigationSetupTask = defineTask('navigation-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Navigation Setup - ${args.appName}`,
  skill: { name: 'kotlin-compose' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Navigation Specialist',
      task: 'Set up Compose Navigation',
      context: {
        appName: args.appName,
        navigation: args.navigation,
        features: args.features,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create NavHost with rememberNavController',
        '2. Define navigation routes as sealed class',
        '3. Implement composable destinations',
        '4. Configure navigation arguments',
        '5. Set up deep links',
        '6. Implement navigation transitions',
        '7. Create navigation extensions',
        '8. Handle back stack management',
        '9. Implement bottom navigation',
        '10. Document navigation patterns'
      ],
      outputFormat: 'JSON with navigation setup'
    },
    outputSchema: {
      type: 'object',
      required: ['routes', 'navGraph', 'artifacts'],
      properties: {
        routes: { type: 'array', items: { type: 'string' } },
        navGraph: { type: 'object' },
        deepLinks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'compose', 'navigation']
}));

export const baseComposablesTask = defineTask('base-composables', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Base Composables - ${args.appName}`,
  skill: { name: 'kotlin-compose' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Compose UI Developer',
      task: 'Create reusable base composables',
      context: {
        appName: args.appName,
        themeSetup: args.themeSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Button composable variants',
        '2. Create TextField composable with validation',
        '3. Create Card composable',
        '4. Create LoadingIndicator composable',
        '5. Create ErrorView composable',
        '6. Create EmptyState composable',
        '7. Create Avatar composable',
        '8. Create TopAppBar variants',
        '9. Create common modifiers',
        '10. Document composable APIs'
      ],
      outputFormat: 'JSON with base composables'
    },
    outputSchema: {
      type: 'object',
      required: ['composables', 'artifacts'],
      properties: {
        composables: { type: 'array', items: { type: 'string' } },
        modifiers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'compose', 'components']
}));

export const screenComposablesTask = defineTask('screen-composables', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Screen Composables - ${args.appName}`,
  skill: { name: 'kotlin-compose' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Compose Screen Developer',
      task: 'Build screen composables for each feature',
      context: {
        appName: args.appName,
        features: args.features,
        navigationSetup: args.navigationSetup,
        baseComposables: args.baseComposables,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create screen composables for each feature',
        '2. Implement Scaffold with TopAppBar',
        '3. Add BottomBar navigation if needed',
        '4. Implement screen content layouts',
        '5. Connect to navigation',
        '6. Handle screen state',
        '7. Add pull-to-refresh where needed',
        '8. Implement FAB actions',
        '9. Handle loading and error states',
        '10. Create screen-specific modifiers'
      ],
      outputFormat: 'JSON with screen composables'
    },
    outputSchema: {
      type: 'object',
      required: ['screens', 'artifacts'],
      properties: {
        screens: { type: 'array', items: { type: 'string' } },
        scaffolds: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'compose', 'screens']
}));

export const stateSetupTask = defineTask('state-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: State Management - ${args.appName}`,
  skill: { name: 'kotlin-compose' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android State Management Specialist',
      task: 'Implement state management with ViewModel',
      context: {
        appName: args.appName,
        stateManagement: args.stateManagement,
        features: args.features,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create ViewModel for each feature',
        '2. Define UI state as data class',
        '3. Use StateFlow for state exposure',
        '4. Implement UiEvent sealed class',
        '5. Handle side effects with Channels',
        '6. Use collectAsStateWithLifecycle',
        '7. Implement state restoration',
        '8. Create ViewModelFactory if needed',
        '9. Handle configuration changes',
        '10. Document state management patterns'
      ],
      outputFormat: 'JSON with state setup'
    },
    outputSchema: {
      type: 'object',
      required: ['viewModels', 'stateClasses', 'artifacts'],
      properties: {
        viewModels: { type: 'array', items: { type: 'string' } },
        stateClasses: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'compose', 'viewmodel', 'state']
}));

export const stateHoistingTask = defineTask('state-hoisting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: State Hoisting - ${args.appName}`,
  skill: { name: 'kotlin-compose' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Compose State Specialist',
      task: 'Implement state hoisting patterns',
      context: {
        appName: args.appName,
        screenComposables: args.screenComposables,
        stateSetup: args.stateSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement unidirectional data flow',
        '2. Hoist state to appropriate level',
        '3. Pass state down as parameters',
        '4. Pass events up as lambdas',
        '5. Create stateless composables',
        '6. Use remember for local state',
        '7. Implement rememberSaveable',
        '8. Create state holders when needed',
        '9. Document state ownership',
        '10. Create state hoisting examples'
      ],
      outputFormat: 'JSON with state hoisting'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'artifacts'],
      properties: {
        patterns: { type: 'array', items: { type: 'string' } },
        stateHolders: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'compose', 'state-hoisting']
}));

export const lazyComponentsTask = defineTask('lazy-components', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Lazy Components - ${args.appName}`,
  skill: { name: 'kotlin-compose' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Compose Performance Developer',
      task: 'Implement LazyColumn and LazyRow',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create LazyColumn implementations',
        '2. Create LazyRow implementations',
        '3. Implement LazyVerticalGrid',
        '4. Configure item keys for performance',
        '5. Implement sticky headers',
        '6. Add pagination support',
        '7. Implement pull-to-refresh',
        '8. Add scroll state management',
        '9. Optimize item composables',
        '10. Document lazy component patterns'
      ],
      outputFormat: 'JSON with lazy components'
    },
    outputSchema: {
      type: 'object',
      required: ['lazyLists', 'artifacts'],
      properties: {
        lazyLists: { type: 'array', items: { type: 'string' } },
        paginationSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'compose', 'lazy-loading']
}));

export const animationsTask = defineTask('animations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Animations - ${args.appName}`,
  skill: { name: 'kotlin-compose' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Compose Animation Specialist',
      task: 'Add Compose animations',
      context: {
        appName: args.appName,
        screenComposables: args.screenComposables,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement animateContentSize',
        '2. Use AnimatedVisibility',
        '3. Create crossfade transitions',
        '4. Implement animateFloatAsState',
        '5. Use updateTransition for complex animations',
        '6. Create infinite animations for loading',
        '7. Implement gesture animations',
        '8. Add navigation transitions',
        '9. Optimize animation performance',
        '10. Document animation patterns'
      ],
      outputFormat: 'JSON with animations'
    },
    outputSchema: {
      type: 'object',
      required: ['animations', 'artifacts'],
      properties: {
        animations: { type: 'array', items: { type: 'string' } },
        transitions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'compose', 'animations']
}));

export const accessibilityTask = defineTask('accessibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Accessibility - ${args.appName}`,
  skill: { name: 'accessibility-testing' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Accessibility Specialist',
      task: 'Implement accessibility with semantics',
      context: {
        appName: args.appName,
        baseComposables: args.baseComposables,
        screenComposables: args.screenComposables,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Add contentDescription to images',
        '2. Implement semantics for custom components',
        '3. Configure traversal order',
        '4. Add state descriptions',
        '5. Implement custom actions',
        '6. Configure heading semantics',
        '7. Add live regions for updates',
        '8. Test with TalkBack',
        '9. Implement touch target sizing',
        '10. Document accessibility features'
      ],
      outputFormat: 'JSON with accessibility'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'complianceScore', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        complianceScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'compose', 'accessibility']
}));

export const previewsTask = defineTask('previews', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Previews - ${args.appName}`,
  skill: { name: 'kotlin-compose' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Compose Preview Developer',
      task: 'Create @Preview composables',
      context: {
        appName: args.appName,
        baseComposables: args.baseComposables,
        screenComposables: args.screenComposables,
        themeSetup: args.themeSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create previews for all composables',
        '2. Add light and dark theme previews',
        '3. Create multi-device previews',
        '4. Add font scale previews',
        '5. Create preview parameter providers',
        '6. Add interactive previews',
        '7. Create locale previews',
        '8. Add screen size previews',
        '9. Create preview wrapper composables',
        '10. Document preview patterns'
      ],
      outputFormat: 'JSON with previews'
    },
    outputSchema: {
      type: 'object',
      required: ['previews', 'artifacts'],
      properties: {
        previews: { type: 'array', items: { type: 'string' } },
        previewProviders: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'compose', 'previews']
}));

export const uiTestsTask = defineTask('ui-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: UI Tests - ${args.appName}`,
  skill: { name: 'mobile-testing' },
  agent: {
    name: 'mobile-qa-expert',
    prompt: {
      role: 'Compose Testing Specialist',
      task: 'Write Compose UI tests',
      context: {
        appName: args.appName,
        baseComposables: args.baseComposables,
        screenComposables: args.screenComposables,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up ComposeTestRule',
        '2. Write tests for base composables',
        '3. Write tests for screen composables',
        '4. Test user interactions',
        '5. Test state changes',
        '6. Test navigation flows',
        '7. Use semantic matchers',
        '8. Test accessibility',
        '9. Create test utilities',
        '10. Configure test coverage'
      ],
      outputFormat: 'JSON with UI tests'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'coverage', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        coverage: { type: 'number' },
        testFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'compose', 'testing']
}));

export const performanceTask = defineTask('performance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Performance - ${args.appName}`,
  skill: { name: 'mobile-perf' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Compose Performance Engineer',
      task: 'Optimize Compose performance',
      context: {
        appName: args.appName,
        screenComposables: args.screenComposables,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze recomposition with Layout Inspector',
        '2. Use remember correctly',
        '3. Implement derivedStateOf',
        '4. Optimize expensive computations',
        '5. Use key() for stable identity',
        '6. Implement Stable/Immutable annotations',
        '7. Profile with compose compiler metrics',
        '8. Optimize image loading',
        '9. Reduce overdraw',
        '10. Document performance optimizations'
      ],
      outputFormat: 'JSON with performance optimizations'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'artifacts'],
      properties: {
        optimizations: { type: 'array', items: { type: 'string' } },
        metrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'compose', 'performance']
}));

export const interopTask = defineTask('interop', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Interoperability - ${args.appName}`,
  skill: { name: 'kotlin-compose' },
  agent: {
    name: 'android-native-expert',
    prompt: {
      role: 'Android Interoperability Developer',
      task: 'Ensure interoperability with View system',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Use ComposeView in XML layouts',
        '2. Embed Views in Compose with AndroidView',
        '3. Handle ViewBinding with Compose',
        '4. Migrate Fragment screens to Compose',
        '5. Integrate with existing ViewModels',
        '6. Handle themes between systems',
        '7. Manage navigation interop',
        '8. Create migration utilities',
        '9. Document interop patterns',
        '10. Create migration guide'
      ],
      outputFormat: 'JSON with interoperability'
    },
    outputSchema: {
      type: 'object',
      required: ['interopPatterns', 'artifacts'],
      properties: {
        interopPatterns: { type: 'array', items: { type: 'string' } },
        migrationGuide: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'android', 'compose', 'interoperability']
}));
