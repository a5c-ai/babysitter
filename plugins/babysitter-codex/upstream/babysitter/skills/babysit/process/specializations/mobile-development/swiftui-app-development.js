/**
 * @process specializations/mobile-development/swiftui-app-development
 * @description SwiftUI App Development from Design - Build native iOS application using SwiftUI from design specifications
 * following Apple Human Interface Guidelines with proper architecture, accessibility, and testing.
 * @inputs { appName: string, designFiles?: string, features?: array, apiSpecs?: object, architecture?: string }
 * @outputs { success: boolean, projectPath: string, screens: array, components: array, tests: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/swiftui-app-development', {
 *   appName: 'MyiOSApp',
 *   designFiles: 'figma://file/abc123',
 *   features: ['authentication', 'profile', 'feed', 'settings'],
 *   apiSpecs: { baseUrl: 'https://api.example.com' },
 *   architecture: 'MVVM'
 * });
 *
 * @references
 * - SwiftUI Documentation: https://developer.apple.com/documentation/swiftui/
 * - Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
 * - Combine Framework: https://developer.apple.com/documentation/combine
 * - Swift Concurrency: https://docs.swift.org/swift-book/LanguageGuide/Concurrency.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    designFiles = '',
    features = [],
    apiSpecs = {},
    architecture = 'MVVM',
    minIOSVersion = '16.0',
    outputDir = 'swiftui-app'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting SwiftUI App Development: ${appName}`);
  ctx.log('info', `Architecture: ${architecture}, Features: ${features.length}`);

  // ============================================================================
  // PHASE 1: DESIGN ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing designs and creating view hierarchy');

  const designAnalysis = await ctx.task(designAnalysisTask, {
    appName,
    designFiles,
    features,
    outputDir
  });

  artifacts.push(...designAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: XCODE PROJECT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up Xcode project with SwiftUI');

  const projectSetup = await ctx.task(projectSetupTask, {
    appName,
    minIOSVersion,
    architecture,
    outputDir
  });

  artifacts.push(...projectSetup.artifacts);

  // ============================================================================
  // PHASE 3: NAVIGATION STRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating app navigation structure');

  const navigationStructure = await ctx.task(navigationStructureTask, {
    appName,
    designAnalysis,
    features,
    outputDir
  });

  artifacts.push(...navigationStructure.artifacts);

  // ============================================================================
  // PHASE 4: DATA MODELS AND VIEW MODELS
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining data models and view models');

  const modelsSetup = await ctx.task(modelsSetupTask, {
    appName,
    architecture,
    features,
    apiSpecs,
    outputDir
  });

  artifacts.push(...modelsSetup.artifacts);

  // ============================================================================
  // PHASE 5: SWIFTUI VIEWS IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing SwiftUI views following designs');

  const viewsImplementation = await ctx.task(viewsImplementationTask, {
    appName,
    designAnalysis,
    navigationStructure,
    modelsSetup,
    outputDir
  });

  artifacts.push(...viewsImplementation.artifacts);

  // ============================================================================
  // PHASE 6: REUSABLE COMPONENTS
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating reusable SwiftUI components');

  const reusableComponents = await ctx.task(reusableComponentsTask, {
    appName,
    designAnalysis,
    outputDir
  });

  artifacts.push(...reusableComponents.artifacts);

  // ============================================================================
  // PHASE 7: STATE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing state management patterns');

  const stateManagement = await ctx.task(stateManagementTask, {
    appName,
    architecture,
    modelsSetup,
    outputDir
  });

  artifacts.push(...stateManagement.artifacts);

  // ============================================================================
  // PHASE 8: NETWORK LAYER
  // ============================================================================

  ctx.log('info', 'Phase 8: Integrating network layer');

  const networkLayer = await ctx.task(networkLayerTask, {
    appName,
    apiSpecs,
    outputDir
  });

  artifacts.push(...networkLayer.artifacts);

  // ============================================================================
  // PHASE 9: PERSISTENCE LAYER
  // ============================================================================

  ctx.log('info', 'Phase 9: Adding data persistence');

  const persistenceLayer = await ctx.task(persistenceLayerTask, {
    appName,
    modelsSetup,
    outputDir
  });

  artifacts.push(...persistenceLayer.artifacts);

  // ============================================================================
  // PHASE 10: ACCESSIBILITY
  // ============================================================================

  ctx.log('info', 'Phase 10: Implementing accessibility features');

  const accessibilitySetup = await ctx.task(accessibilitySetupTask, {
    appName,
    viewsImplementation,
    reusableComponents,
    outputDir
  });

  artifacts.push(...accessibilitySetup.artifacts);

  // Quality Gate: Design Implementation Review
  await ctx.breakpoint({
    question: `SwiftUI views implemented for ${appName}. ${viewsImplementation.screens.length} screens, ${reusableComponents.components.length} components. Review implementation?`,
    title: 'Design Implementation Review',
    context: {
      runId: ctx.runId,
      appName,
      screens: viewsImplementation.screens,
      components: reusableComponents.components,
      accessibilityScore: accessibilitySetup.complianceScore,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: 'swift' }))
    }
  });

  // ============================================================================
  // PHASE 11: ANIMATIONS AND TRANSITIONS
  // ============================================================================

  ctx.log('info', 'Phase 11: Adding animations and transitions');

  const animationsSetup = await ctx.task(animationsSetupTask, {
    appName,
    viewsImplementation,
    outputDir
  });

  artifacts.push(...animationsSetup.artifacts);

  // ============================================================================
  // PHASE 12: DEVICE ADAPTATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Handling different device sizes and orientations');

  const deviceAdaptation = await ctx.task(deviceAdaptationTask, {
    appName,
    viewsImplementation,
    outputDir
  });

  artifacts.push(...deviceAdaptation.artifacts);

  // ============================================================================
  // PHASE 13: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 13: Writing unit and UI tests');

  const testingSuite = await ctx.task(testingSuiteTask, {
    appName,
    modelsSetup,
    viewsImplementation,
    outputDir
  });

  artifacts.push(...testingSuite.artifacts);

  // ============================================================================
  // PHASE 14: PERFORMANCE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Optimizing performance with Instruments');

  const performanceOptimization = await ctx.task(performanceOptimizationTask, {
    appName,
    viewsImplementation,
    outputDir
  });

  artifacts.push(...performanceOptimization.artifacts);

  // ============================================================================
  // PHASE 15: APP STORE ASSETS
  // ============================================================================

  ctx.log('info', 'Phase 15: Preparing App Store submission assets');

  const appStoreAssets = await ctx.task(appStoreAssetsTask, {
    appName,
    outputDir
  });

  artifacts.push(...appStoreAssets.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    appName,
    projectPath: projectSetup.projectPath,
    architecture,
    screens: viewsImplementation.screens,
    components: reusableComponents.components,
    navigation: navigationStructure.structure,
    models: modelsSetup.models,
    tests: {
      unitTests: testingSuite.unitTestCount,
      uiTests: testingSuite.uiTestCount,
      coverage: testingSuite.coverage
    },
    accessibility: {
      score: accessibilitySetup.complianceScore,
      features: accessibilitySetup.features
    },
    performance: performanceOptimization.metrics,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/mobile-development/swiftui-app-development',
      timestamp: startTime,
      minIOSVersion,
      architecture
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const designAnalysisTask = defineTask('design-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Design Analysis - ${args.appName}`,
  skill: { name: 'swift-swiftui' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS UI/UX Developer',
      task: 'Analyze designs and create view hierarchy',
      context: {
        appName: args.appName,
        designFiles: args.designFiles,
        features: args.features,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze Figma/Sketch design files',
        '2. Create view hierarchy document',
        '3. Identify reusable components',
        '4. Map design tokens to SwiftUI styles',
        '5. Document navigation flows',
        '6. Identify animations and transitions',
        '7. Note accessibility requirements',
        '8. Create component specifications',
        '9. Document design system elements',
        '10. Generate design analysis report'
      ],
      outputFormat: 'JSON with design analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['viewHierarchy', 'components', 'artifacts'],
      properties: {
        viewHierarchy: { type: 'object' },
        components: { type: 'array', items: { type: 'string' } },
        designTokens: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'swiftui', 'design']
}));

export const projectSetupTask = defineTask('project-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Xcode Project Setup - ${args.appName}`,
  skill: { name: 'swift-swiftui' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'Senior iOS Developer',
      task: 'Set up Xcode project with SwiftUI',
      context: {
        appName: args.appName,
        minIOSVersion: args.minIOSVersion,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Xcode project with SwiftUI App lifecycle',
        '2. Configure project settings and build configurations',
        '3. Set up folder structure following architecture',
        '4. Configure Info.plist with required permissions',
        '5. Set up asset catalogs',
        '6. Configure code signing',
        '7. Set up SwiftLint for code quality',
        '8. Configure build schemes (Debug, Release)',
        '9. Set up environment configurations',
        '10. Initialize git repository'
      ],
      outputFormat: 'JSON with project setup details'
    },
    outputSchema: {
      type: 'object',
      required: ['projectPath', 'artifacts'],
      properties: {
        projectPath: { type: 'string' },
        bundleId: { type: 'string' },
        schemes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'xcode', 'setup']
}));

export const navigationStructureTask = defineTask('navigation-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Navigation Structure - ${args.appName}`,
  skill: { name: 'swift-swiftui' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Navigation Specialist',
      task: 'Create app navigation structure with NavigationStack and TabView',
      context: {
        appName: args.appName,
        designAnalysis: args.designAnalysis,
        features: args.features,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create NavigationStack for hierarchical navigation',
        '2. Set up TabView for main sections',
        '3. Implement navigation path management',
        '4. Configure deep linking routes',
        '5. Create navigation coordinator if needed',
        '6. Set up sheet and fullScreenCover presentations',
        '7. Implement navigation bar customization',
        '8. Configure toolbar items',
        '9. Set up navigation state persistence',
        '10. Document navigation patterns'
      ],
      outputFormat: 'JSON with navigation structure'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'artifacts'],
      properties: {
        structure: { type: 'object' },
        routes: { type: 'array', items: { type: 'string' } },
        deepLinks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'navigation', 'swiftui']
}));

export const modelsSetupTask = defineTask('models-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Models Setup - ${args.appName}`,
  skill: { name: 'swift-swiftui' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Data Architect',
      task: 'Define data models and view models',
      context: {
        appName: args.appName,
        architecture: args.architecture,
        features: args.features,
        apiSpecs: args.apiSpecs,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create data models with Codable conformance',
        '2. Define view models following MVVM pattern',
        '3. Implement ObservableObject for reactive updates',
        '4. Create model validation logic',
        '5. Define model relationships',
        '6. Implement mock data for previews',
        '7. Create model transformers/mappers',
        '8. Set up model caching strategy',
        '9. Define model protocols and interfaces',
        '10. Document data flow'
      ],
      outputFormat: 'JSON with models setup'
    },
    outputSchema: {
      type: 'object',
      required: ['models', 'viewModels', 'artifacts'],
      properties: {
        models: { type: 'array', items: { type: 'string' } },
        viewModels: { type: 'array', items: { type: 'string' } },
        dataFlow: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'models', 'mvvm']
}));

export const viewsImplementationTask = defineTask('views-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Views Implementation - ${args.appName}`,
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'SwiftUI Developer',
      task: 'Implement SwiftUI views following designs',
      context: {
        appName: args.appName,
        designAnalysis: args.designAnalysis,
        navigationStructure: args.navigationStructure,
        modelsSetup: args.modelsSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create main screen views',
        '2. Implement layout with VStack, HStack, ZStack',
        '3. Apply design tokens to views',
        '4. Connect views to view models',
        '5. Implement data binding with @Binding',
        '6. Add SwiftUI previews for each view',
        '7. Implement loading and error states',
        '8. Add pull-to-refresh where needed',
        '9. Implement search functionality',
        '10. Create view modifiers for common styles'
      ],
      outputFormat: 'JSON with views implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['screens', 'artifacts'],
      properties: {
        screens: { type: 'array', items: { type: 'string' } },
        viewModifiers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'swiftui', 'views']
}));

export const reusableComponentsTask = defineTask('reusable-components', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Reusable Components - ${args.appName}`,
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'SwiftUI Component Developer',
      task: 'Create reusable SwiftUI components',
      context: {
        appName: args.appName,
        designAnalysis: args.designAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create custom Button styles',
        '2. Build reusable Card component',
        '3. Create custom TextField component',
        '4. Build LoadingView component',
        '5. Create EmptyStateView component',
        '6. Build Avatar component',
        '7. Create Badge component',
        '8. Build custom List row components',
        '9. Create image loading component',
        '10. Document component APIs'
      ],
      outputFormat: 'JSON with reusable components'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'artifacts'],
      properties: {
        components: { type: 'array', items: { type: 'string' } },
        componentAPIs: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'swiftui', 'components']
}));

export const stateManagementTask = defineTask('state-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: State Management - ${args.appName}`,
  skill: { name: 'swift-swiftui' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS State Management Specialist',
      task: 'Implement @State, @Binding, @ObservedObject patterns',
      context: {
        appName: args.appName,
        architecture: args.architecture,
        modelsSetup: args.modelsSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement @State for local view state',
        '2. Use @Binding for two-way data binding',
        '3. Implement @ObservedObject for view models',
        '4. Set up @EnvironmentObject for shared state',
        '5. Integrate with Combine for reactive data flow',
        '6. Implement state persistence',
        '7. Create state restoration logic',
        '8. Handle state updates with async/await',
        '9. Implement error state handling',
        '10. Document state management patterns'
      ],
      outputFormat: 'JSON with state management'
    },
    outputSchema: {
      type: 'object',
      required: ['statePatterns', 'artifacts'],
      properties: {
        statePatterns: { type: 'array', items: { type: 'string' } },
        environmentObjects: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'state-management', 'combine']
}));

export const networkLayerTask = defineTask('network-layer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Network Layer - ${args.appName}`,
  skill: { name: 'swift-swiftui' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Networking Specialist',
      task: 'Integrate network layer with URLSession',
      context: {
        appName: args.appName,
        apiSpecs: args.apiSpecs,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create URLSession-based network client',
        '2. Implement request/response models',
        '3. Add authentication header handling',
        '4. Implement error handling and parsing',
        '5. Create API service layer',
        '6. Add request retry logic',
        '7. Implement caching strategy',
        '8. Add network reachability monitoring',
        '9. Create mock services for testing',
        '10. Document API integration'
      ],
      outputFormat: 'JSON with network layer'
    },
    outputSchema: {
      type: 'object',
      required: ['services', 'artifacts'],
      properties: {
        services: { type: 'array', items: { type: 'string' } },
        endpoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'networking', 'urlsession']
}));

export const persistenceLayerTask = defineTask('persistence-layer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Persistence Layer - ${args.appName}`,
  skill: { name: 'swift-swiftui' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Data Persistence Specialist',
      task: 'Add data persistence with UserDefaults and optionally Core Data',
      context: {
        appName: args.appName,
        modelsSetup: args.modelsSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement UserDefaults wrapper',
        '2. Create secure storage with Keychain',
        '3. Set up file-based caching',
        '4. Implement data migration utilities',
        '5. Create persistence protocols',
        '6. Add offline data support',
        '7. Implement data synchronization',
        '8. Create cleanup utilities',
        '9. Add data export functionality',
        '10. Document persistence patterns'
      ],
      outputFormat: 'JSON with persistence layer'
    },
    outputSchema: {
      type: 'object',
      required: ['storageTypes', 'artifacts'],
      properties: {
        storageTypes: { type: 'array', items: { type: 'string' } },
        dataModels: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'persistence', 'storage']
}));

export const accessibilitySetupTask = defineTask('accessibility-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Accessibility Setup - ${args.appName}`,
  agent: {
    name: 'ios-accessibility-specialist',
    prompt: {
      role: 'iOS Accessibility Specialist',
      task: 'Implement accessibility features for VoiceOver and Dynamic Type',
      context: {
        appName: args.appName,
        viewsImplementation: args.viewsImplementation,
        reusableComponents: args.reusableComponents,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Add accessibility labels and hints',
        '2. Configure accessibility traits',
        '3. Implement Dynamic Type support',
        '4. Add VoiceOver navigation optimization',
        '5. Implement accessibility actions',
        '6. Configure focus management',
        '7. Add high contrast support',
        '8. Test with Accessibility Inspector',
        '9. Create accessibility documentation',
        '10. Generate compliance report'
      ],
      outputFormat: 'JSON with accessibility setup'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'complianceScore', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        complianceScore: { type: 'number' },
        violations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'accessibility', 'voiceover']
}));

export const animationsSetupTask = defineTask('animations-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Animations Setup - ${args.appName}`,
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'SwiftUI Animation Specialist',
      task: 'Add animations and transitions',
      context: {
        appName: args.appName,
        viewsImplementation: args.viewsImplementation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement view transitions with matchedGeometryEffect',
        '2. Add spring animations for natural feel',
        '3. Create custom transition modifiers',
        '4. Implement loading animations',
        '5. Add micro-interactions',
        '6. Configure animation timing curves',
        '7. Implement gesture-driven animations',
        '8. Add Lottie animations if needed',
        '9. Respect reduce motion preference',
        '10. Document animation patterns'
      ],
      outputFormat: 'JSON with animations setup'
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
  labels: ['mobile', 'ios', 'animations', 'swiftui']
}));

export const deviceAdaptationTask = defineTask('device-adaptation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Device Adaptation - ${args.appName}`,
  skill: { name: 'swift-swiftui' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Device Adaptation Specialist',
      task: 'Handle different device sizes and orientations',
      context: {
        appName: args.appName,
        viewsImplementation: args.viewsImplementation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement adaptive layouts with GeometryReader',
        '2. Support landscape orientation where appropriate',
        '3. Create iPad-specific layouts',
        '4. Handle safe area insets',
        '5. Implement responsive font scaling',
        '6. Create size class adaptations',
        '7. Handle notch and Dynamic Island',
        '8. Test on multiple device sizes',
        '9. Add Split View support for iPad',
        '10. Document device adaptations'
      ],
      outputFormat: 'JSON with device adaptation'
    },
    outputSchema: {
      type: 'object',
      required: ['adaptations', 'artifacts'],
      properties: {
        adaptations: { type: 'array', items: { type: 'string' } },
        supportedDevices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'responsive', 'adaptation']
}));

export const testingSuiteTask = defineTask('testing-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Testing Suite - ${args.appName}`,
  skill: { name: 'mobile-testing' },
  agent: {
    name: 'mobile-qa-expert',
    prompt: {
      role: 'iOS Test Engineer',
      task: 'Write unit and UI tests with XCTest',
      context: {
        appName: args.appName,
        modelsSetup: args.modelsSetup,
        viewsImplementation: args.viewsImplementation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up XCTest target',
        '2. Write unit tests for view models',
        '3. Test data models and transformations',
        '4. Write integration tests for services',
        '5. Create UI tests for critical flows',
        '6. Test accessibility with UI tests',
        '7. Configure code coverage',
        '8. Create test utilities and mocks',
        '9. Set up snapshot tests',
        '10. Configure CI test pipeline'
      ],
      outputFormat: 'JSON with testing suite'
    },
    outputSchema: {
      type: 'object',
      required: ['unitTestCount', 'uiTestCount', 'coverage', 'artifacts'],
      properties: {
        unitTestCount: { type: 'number' },
        uiTestCount: { type: 'number' },
        coverage: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'testing', 'xctest']
}));

export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Performance Optimization - ${args.appName}`,
  skill: { name: 'mobile-perf' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Performance Engineer',
      task: 'Optimize performance with Instruments',
      context: {
        appName: args.appName,
        viewsImplementation: args.viewsImplementation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Profile with Time Profiler',
        '2. Analyze memory with Allocations',
        '3. Check for memory leaks',
        '4. Optimize view rendering',
        '5. Reduce view body computations',
        '6. Implement lazy loading',
        '7. Optimize image loading',
        '8. Profile network requests',
        '9. Optimize app launch time',
        '10. Create performance report'
      ],
      outputFormat: 'JSON with performance metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'artifacts'],
      properties: {
        metrics: { type: 'object' },
        optimizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'performance', 'instruments']
}));

export const appStoreAssetsTask = defineTask('appstore-assets', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: App Store Assets - ${args.appName}`,
  skill: { name: 'swift-swiftui' },
  agent: {
    name: 'ios-native-expert',
    prompt: {
      role: 'iOS Release Manager',
      task: 'Prepare App Store submission assets',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure app icons for all sizes',
        '2. Create launch screen storyboard',
        '3. Prepare screenshot sizes',
        '4. Configure app privacy details',
        '5. Set up export compliance',
        '6. Configure in-app purchases if needed',
        '7. Prepare app preview video specs',
        '8. Configure capabilities and entitlements',
        '9. Create release notes template',
        '10. Document submission checklist'
      ],
      outputFormat: 'JSON with App Store assets'
    },
    outputSchema: {
      type: 'object',
      required: ['assets', 'checklist', 'artifacts'],
      properties: {
        assets: { type: 'array', items: { type: 'string' } },
        checklist: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'ios', 'appstore', 'release']
}));
