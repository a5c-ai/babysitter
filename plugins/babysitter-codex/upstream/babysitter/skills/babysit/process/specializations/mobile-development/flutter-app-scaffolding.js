/**
 * @process specializations/mobile-development/flutter-app-scaffolding
 * @description Flutter App Scaffolding and Architecture Setup - Create a scalable Flutter application with proper architecture
 * patterns, state management, dependency injection, and development tools following best practices.
 * @inputs { appName: string, stateManagement?: string, architecture?: string, targetPlatforms?: array, features?: object }
 * @outputs { success: boolean, projectPath: string, architecture: object, documentation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/flutter-app-scaffolding', {
 *   appName: 'MyFlutterApp',
 *   stateManagement: 'bloc',
 *   architecture: 'clean-architecture',
 *   targetPlatforms: ['ios', 'android'],
 *   features: {
 *     networking: 'dio',
 *     localStorage: 'hive',
 *     di: 'get_it'
 *   }
 * });
 *
 * @references
 * - Flutter Documentation: https://flutter.dev/docs
 * - Bloc Library: https://bloclibrary.dev/
 * - Clean Architecture: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
 * - GetIt: https://pub.dev/packages/get_it
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    appName,
    stateManagement = 'bloc',
    architecture = 'clean-architecture',
    targetPlatforms = ['ios', 'android'],
    features = {
      networking: 'dio',
      localStorage: 'hive',
      di: 'get_it'
    },
    codeGeneration = true,
    outputDir = 'flutter-scaffolding'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Flutter App Scaffolding: ${appName}`);
  ctx.log('info', `Architecture: ${architecture}, State Management: ${stateManagement}`);

  // ============================================================================
  // PHASE 1: PROJECT CREATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Creating Flutter project');

  const projectCreation = await ctx.task(projectCreationTask, {
    appName,
    targetPlatforms,
    outputDir
  });

  artifacts.push(...projectCreation.artifacts);

  // ============================================================================
  // PHASE 2: ARCHITECTURE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up architecture folder structure');

  const architectureSetup = await ctx.task(architectureSetupTask, {
    appName,
    architecture,
    projectCreation,
    outputDir
  });

  artifacts.push(...architectureSetup.artifacts);

  // ============================================================================
  // PHASE 3: DEPENDENCY CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring pubspec.yaml with dependencies');

  const dependencyConfig = await ctx.task(dependencyConfigTask, {
    appName,
    stateManagement,
    features,
    codeGeneration,
    outputDir
  });

  artifacts.push(...dependencyConfig.artifacts);

  // ============================================================================
  // PHASE 4: DEPENDENCY INJECTION SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up dependency injection');

  const diSetup = await ctx.task(diSetupTask, {
    appName,
    diLibrary: features.di,
    architecture,
    outputDir
  });

  artifacts.push(...diSetup.artifacts);

  // ============================================================================
  // PHASE 5: STATE MANAGEMENT CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Configuring state management');

  const stateConfig = await ctx.task(stateConfigTask, {
    appName,
    stateManagement,
    architecture,
    outputDir
  });

  artifacts.push(...stateConfig.artifacts);

  // ============================================================================
  // PHASE 6: ROUTING CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up routing and navigation');

  const routingSetup = await ctx.task(routingSetupTask, {
    appName,
    outputDir
  });

  artifacts.push(...routingSetup.artifacts);

  // ============================================================================
  // PHASE 7: NETWORK LAYER SETUP
  // ============================================================================

  ctx.log('info', 'Phase 7: Configuring network layer');

  const networkSetup = await ctx.task(networkSetupTask, {
    appName,
    networkingLibrary: features.networking,
    architecture,
    outputDir
  });

  artifacts.push(...networkSetup.artifacts);

  // ============================================================================
  // PHASE 8: LOCAL STORAGE CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Setting up local storage');

  const storageSetup = await ctx.task(storageSetupTask, {
    appName,
    storageLibrary: features.localStorage,
    outputDir
  });

  artifacts.push(...storageSetup.artifacts);

  // ============================================================================
  // PHASE 9: CODE GENERATION SETUP
  // ============================================================================

  if (codeGeneration) {
    ctx.log('info', 'Phase 9: Setting up code generation');

    const codeGenSetup = await ctx.task(codeGenSetupTask, {
      appName,
      stateManagement,
      outputDir
    });

    artifacts.push(...codeGenSetup.artifacts);
  }

  // ============================================================================
  // PHASE 10: TESTING FRAMEWORK SETUP
  // ============================================================================

  ctx.log('info', 'Phase 10: Configuring testing framework');

  const testingSetup = await ctx.task(testingSetupTask, {
    appName,
    architecture,
    outputDir
  });

  artifacts.push(...testingSetup.artifacts);

  // ============================================================================
  // PHASE 11: DESIGN SYSTEM FOUNDATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating design system foundation');

  const designSystem = await ctx.task(designSystemTask, {
    appName,
    outputDir
  });

  artifacts.push(...designSystem.artifacts);

  // Quality Gate: Architecture Review
  await ctx.breakpoint({
    question: `Flutter project scaffolding complete for ${appName}. Architecture: ${architecture}, State: ${stateManagement}. Review and approve?`,
    title: 'Architecture Review',
    context: {
      runId: ctx.runId,
      appName,
      architecture,
      stateManagement,
      features,
      folderStructure: architectureSetup.folderStructure,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'dart' }))
    }
  });

  // ============================================================================
  // PHASE 12: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating architecture documentation');

  const documentation = await ctx.task(documentationTask, {
    appName,
    architecture,
    stateManagement,
    features,
    architectureSetup,
    diSetup,
    stateConfig,
    networkSetup,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    appName,
    projectPath: projectCreation.projectPath,
    architecture: {
      pattern: architecture,
      stateManagement,
      di: features.di,
      layers: architectureSetup.layers
    },
    features: {
      networking: features.networking,
      localStorage: features.localStorage,
      codeGeneration
    },
    structure: architectureSetup.folderStructure,
    dependencies: dependencyConfig.dependencies,
    documentation: {
      adrPath: documentation.adrPath,
      architecturePath: documentation.architecturePath,
      guidelinesPath: documentation.guidelinesPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/mobile-development/flutter-app-scaffolding',
      timestamp: startTime,
      architecture,
      stateManagement
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const projectCreationTask = defineTask('project-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Project Creation - ${args.appName}`,
  skill: { name: 'flutter-dart' },
  agent: {
    name: 'flutter-expert',
    prompt: {
      role: 'Senior Flutter Developer',
      task: 'Create new Flutter project with flutter create',
      context: {
        appName: args.appName,
        targetPlatforms: args.targetPlatforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Run flutter create with appropriate options',
        '2. Configure project organization',
        '3. Set up analysis_options.yaml with strict linting',
        '4. Configure pubspec.yaml metadata',
        '5. Set up .gitignore for Flutter projects',
        '6. Configure IDE settings (VS Code, Android Studio)',
        '7. Set up launch configurations',
        '8. Initialize git repository',
        '9. Configure platform-specific settings',
        '10. Generate project creation report'
      ],
      outputFormat: 'JSON with project creation details'
    },
    outputSchema: {
      type: 'object',
      required: ['projectPath', 'artifacts'],
      properties: {
        projectPath: { type: 'string' },
        flutterVersion: { type: 'string' },
        dartVersion: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'flutter', 'setup', 'initialization']
}));

export const architectureSetupTask = defineTask('architecture-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Architecture Setup - ${args.appName}`,
  skill: { name: 'flutter-dart' },
  agent: {
    name: 'flutter-expert',
    prompt: {
      role: 'Flutter Architect',
      task: 'Set up architecture folder structure following chosen pattern',
      context: {
        appName: args.appName,
        architecture: args.architecture,
        projectCreation: args.projectCreation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create folder structure following architecture pattern',
        '2. For Clean Architecture: data, domain, presentation layers',
        '3. For MVVM: models, viewmodels, views folders',
        '4. Set up core module for shared utilities',
        '5. Create features directory for feature modules',
        '6. Set up dependency injection structure',
        '7. Create base classes and interfaces',
        '8. Set up constants and configuration',
        '9. Create utility classes and extensions',
        '10. Document folder structure conventions'
      ],
      outputFormat: 'JSON with architecture structure'
    },
    outputSchema: {
      type: 'object',
      required: ['folderStructure', 'layers', 'artifacts'],
      properties: {
        folderStructure: { type: 'object' },
        layers: { type: 'array', items: { type: 'string' } },
        baseClasses: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'flutter', 'architecture']
}));

export const dependencyConfigTask = defineTask('dependency-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Dependency Configuration - ${args.appName}`,
  skill: { name: 'flutter-dart' },
  agent: {
    name: 'flutter-expert',
    prompt: {
      role: 'Flutter Package Specialist',
      task: 'Configure pubspec.yaml with required dependencies',
      context: {
        appName: args.appName,
        stateManagement: args.stateManagement,
        features: args.features,
        codeGeneration: args.codeGeneration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Add state management dependencies (bloc, provider, riverpod)',
        '2. Add networking dependencies (dio, http)',
        '3. Add local storage dependencies (hive, sqflite)',
        '4. Add dependency injection packages (get_it, injectable)',
        '5. Add code generation dependencies (freezed, json_serializable)',
        '6. Add utility packages (equatable, dartz)',
        '7. Add dev dependencies for testing and generation',
        '8. Configure build_runner settings',
        '9. Add Flutter-specific linting packages',
        '10. Document all dependencies and their purposes'
      ],
      outputFormat: 'JSON with dependency configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencies', 'devDependencies', 'artifacts'],
      properties: {
        dependencies: { type: 'object' },
        devDependencies: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'flutter', 'dependencies']
}));

export const diSetupTask = defineTask('di-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Dependency Injection Setup - ${args.appName}`,
  skill: { name: 'flutter-dart' },
  agent: {
    name: 'flutter-expert',
    prompt: {
      role: 'Flutter DI Specialist',
      task: 'Set up dependency injection with GetIt or Injectable',
      context: {
        appName: args.appName,
        diLibrary: args.diLibrary,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure GetIt service locator',
        '2. Set up Injectable if using code generation',
        '3. Create injection container initialization',
        '4. Register singleton and factory services',
        '5. Set up lazy loading for heavy dependencies',
        '6. Configure environment-based injection',
        '7. Create module registration structure',
        '8. Set up testing injection configuration',
        '9. Create dependency injection documentation',
        '10. Generate DI setup report'
      ],
      outputFormat: 'JSON with DI configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['injectionConfig', 'artifacts'],
      properties: {
        injectionConfig: { type: 'object' },
        registeredServices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'flutter', 'dependency-injection']
}));

export const stateConfigTask = defineTask('state-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: State Management Configuration - ${args.appName}`,
  skill: { name: 'flutter-dart' },
  agent: {
    name: 'flutter-expert',
    prompt: {
      role: 'Flutter State Management Specialist',
      task: 'Configure state management solution',
      context: {
        appName: args.appName,
        stateManagement: args.stateManagement,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up state management package (Bloc, Provider, Riverpod)',
        '2. Create base state classes and templates',
        '3. Configure BlocObserver for logging (if Bloc)',
        '4. Set up state persistence configuration',
        '5. Create state management utilities',
        '6. Implement error handling patterns',
        '7. Set up state testing utilities',
        '8. Create example feature with state management',
        '9. Document state management patterns',
        '10. Generate state configuration report'
      ],
      outputFormat: 'JSON with state management configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['stateConfig', 'artifacts'],
      properties: {
        stateConfig: { type: 'object' },
        baseClasses: { type: 'array', items: { type: 'string' } },
        patterns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'flutter', 'state-management']
}));

export const routingSetupTask = defineTask('routing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Routing Setup - ${args.appName}`,
  skill: { name: 'flutter-dart' },
  agent: {
    name: 'flutter-expert',
    prompt: {
      role: 'Flutter Navigation Specialist',
      task: 'Set up routing and navigation with GoRouter or AutoRoute',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Install and configure routing package (GoRouter/AutoRoute)',
        '2. Create route definitions and paths',
        '3. Set up nested navigation structure',
        '4. Configure deep linking',
        '5. Implement route guards for authentication',
        '6. Set up navigation transitions',
        '7. Create navigation utilities and extensions',
        '8. Configure web URL handling',
        '9. Set up navigation testing utilities',
        '10. Document navigation patterns'
      ],
      outputFormat: 'JSON with routing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['routerConfig', 'routes', 'artifacts'],
      properties: {
        routerConfig: { type: 'object' },
        routes: { type: 'array', items: { type: 'string' } },
        deepLinkingEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'flutter', 'navigation', 'routing']
}));

export const networkSetupTask = defineTask('network-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Network Layer Setup - ${args.appName}`,
  skill: { name: 'flutter-dart' },
  agent: {
    name: 'flutter-expert',
    prompt: {
      role: 'Flutter Networking Specialist',
      task: 'Configure network layer with Dio',
      context: {
        appName: args.appName,
        networkingLibrary: args.networkingLibrary,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure Dio HTTP client',
        '2. Set up request interceptors',
        '3. Configure response interceptors',
        '4. Implement error handling and parsing',
        '5. Set up authentication interceptor',
        '6. Configure retry logic',
        '7. Set up request caching',
        '8. Create API client base class',
        '9. Implement logging interceptor',
        '10. Document network layer usage'
      ],
      outputFormat: 'JSON with network configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['networkConfig', 'interceptors', 'artifacts'],
      properties: {
        networkConfig: { type: 'object' },
        interceptors: { type: 'array', items: { type: 'string' } },
        baseUrl: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'flutter', 'networking', 'dio']
}));

export const storageSetupTask = defineTask('storage-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Local Storage Setup - ${args.appName}`,
  skill: { name: 'flutter-dart' },
  agent: {
    name: 'flutter-expert',
    prompt: {
      role: 'Flutter Storage Specialist',
      task: 'Configure local storage with Hive or Sqflite',
      context: {
        appName: args.appName,
        storageLibrary: args.storageLibrary,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure storage library (Hive/Sqflite)',
        '2. Set up database initialization',
        '3. Create storage adapters and type adapters',
        '4. Implement repository pattern for storage',
        '5. Set up secure storage for sensitive data',
        '6. Configure storage encryption',
        '7. Create storage migration utilities',
        '8. Set up caching layer',
        '9. Implement storage testing utilities',
        '10. Document storage patterns'
      ],
      outputFormat: 'JSON with storage configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['storageConfig', 'artifacts'],
      properties: {
        storageConfig: { type: 'object' },
        boxes: { type: 'array', items: { type: 'string' } },
        adapters: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'flutter', 'storage', 'persistence']
}));

export const codeGenSetupTask = defineTask('code-gen-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Code Generation Setup - ${args.appName}`,
  skill: { name: 'flutter-dart' },
  agent: {
    name: 'flutter-expert',
    prompt: {
      role: 'Flutter Code Generation Specialist',
      task: 'Set up code generation with Freezed and JsonSerializable',
      context: {
        appName: args.appName,
        stateManagement: args.stateManagement,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure build_runner',
        '2. Set up Freezed for immutable classes',
        '3. Configure JsonSerializable for JSON parsing',
        '4. Set up Injectable for DI code generation',
        '5. Create build.yaml configuration',
        '6. Set up code generation scripts',
        '7. Configure watch mode for development',
        '8. Create model templates with generation',
        '9. Set up generation cleanup utilities',
        '10. Document code generation workflow'
      ],
      outputFormat: 'JSON with code generation configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['buildConfig', 'generators', 'artifacts'],
      properties: {
        buildConfig: { type: 'object' },
        generators: { type: 'array', items: { type: 'string' } },
        scripts: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'flutter', 'code-generation']
}));

export const testingSetupTask = defineTask('testing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Testing Setup - ${args.appName}`,
  skill: { name: 'mobile-testing' },
  agent: {
    name: 'mobile-qa-expert',
    prompt: {
      role: 'Flutter Testing Specialist',
      task: 'Configure comprehensive testing framework',
      context: {
        appName: args.appName,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure flutter_test package',
        '2. Set up mockito for mocking',
        '3. Configure bloc_test if using Bloc',
        '4. Set up integration_test package',
        '5. Create test utilities and helpers',
        '6. Configure test coverage reporting',
        '7. Set up golden tests for widgets',
        '8. Create test fixtures and factories',
        '9. Configure CI test scripts',
        '10. Document testing conventions'
      ],
      outputFormat: 'JSON with testing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['testConfig', 'artifacts'],
      properties: {
        testConfig: { type: 'object' },
        testTypes: { type: 'array', items: { type: 'string' } },
        utilities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'flutter', 'testing']
}));

export const designSystemTask = defineTask('design-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Design System Foundation - ${args.appName}`,
  skill: { name: 'flutter-dart' },
  agent: {
    name: 'flutter-expert',
    prompt: {
      role: 'Flutter UI/UX Developer',
      task: 'Create design system foundation',
      context: {
        appName: args.appName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create theme configuration (colors, typography, spacing)',
        '2. Set up Material 3 theme',
        '3. Create custom theme extensions',
        '4. Set up dark mode support',
        '5. Create text styles and typography scale',
        '6. Define spacing and sizing constants',
        '7. Create base widget wrappers',
        '8. Set up icon configuration',
        '9. Create responsive utilities',
        '10. Document design system usage'
      ],
      outputFormat: 'JSON with design system configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['themeConfig', 'artifacts'],
      properties: {
        themeConfig: { type: 'object' },
        colors: { type: 'object' },
        typography: { type: 'object' },
        spacing: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'flutter', 'design-system', 'theming']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Documentation - ${args.appName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate architecture documentation and ADRs',
      context: {
        appName: args.appName,
        architecture: args.architecture,
        stateManagement: args.stateManagement,
        features: args.features,
        architectureSetup: args.architectureSetup,
        diSetup: args.diSetup,
        stateConfig: args.stateConfig,
        networkSetup: args.networkSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Architecture Decision Records (ADRs)',
        '2. Document folder structure and conventions',
        '3. Create state management guidelines',
        '4. Document dependency injection patterns',
        '5. Create network layer documentation',
        '6. Write testing guidelines',
        '7. Create code generation documentation',
        '8. Write feature development guide',
        '9. Create troubleshooting guide',
        '10. Generate README with project overview'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['adrPath', 'architecturePath', 'artifacts'],
      properties: {
        adrPath: { type: 'string' },
        architecturePath: { type: 'string' },
        guidelinesPath: { type: 'string' },
        readmePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'flutter', 'documentation', 'adr']
}));
