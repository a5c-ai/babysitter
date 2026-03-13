/**
 * @process specializations/mobile-development/react-native-app-setup
 * @description React Native App Setup and Configuration - Initialize and configure a production-ready React Native application
 * with best practices and essential libraries including navigation, state management, API integration, and testing infrastructure.
 * @inputs { projectName: string, targetPlatforms?: array, features?: object, designSystem?: object, useExpo?: boolean }
 * @outputs { success: boolean, projectPath: string, configuration: object, devSetupGuide: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/mobile-development/react-native-app-setup', {
 *   projectName: 'MyAwesomeApp',
 *   targetPlatforms: ['ios', 'android'],
 *   features: {
 *     navigation: 'react-navigation',
 *     stateManagement: 'redux-toolkit',
 *     apiClient: 'react-query'
 *   },
 *   designSystem: { theme: 'custom', components: 'react-native-paper' },
 *   useExpo: false
 * });
 *
 * @references
 * - React Native Documentation: https://reactnative.dev/
 * - React Navigation: https://reactnavigation.org/
 * - Redux Toolkit: https://redux-toolkit.js.org/
 * - React Native Testing Library: https://callstack.github.io/react-native-testing-library/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetPlatforms = ['ios', 'android'],
    features = {
      navigation: 'react-navigation',
      stateManagement: 'redux-toolkit',
      apiClient: 'axios'
    },
    designSystem = {},
    useExpo = false,
    typescript = true,
    testingFramework = 'jest',
    outputDir = 'react-native-setup'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting React Native App Setup: ${projectName}`);
  ctx.log('info', `Target Platforms: ${targetPlatforms.join(', ')}`);
  ctx.log('info', `Using Expo: ${useExpo}`);

  // ============================================================================
  // PHASE 1: PROJECT INITIALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Initializing React Native project');

  const projectInit = await ctx.task(projectInitTask, {
    projectName,
    targetPlatforms,
    useExpo,
    typescript,
    outputDir
  });

  artifacts.push(...projectInit.artifacts);

  // ============================================================================
  // PHASE 2: PROJECT STRUCTURE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up project structure and folder organization');

  const structureSetup = await ctx.task(projectStructureTask, {
    projectName,
    projectInit,
    features,
    outputDir
  });

  artifacts.push(...structureSetup.artifacts);

  // ============================================================================
  // PHASE 3: TYPESCRIPT AND LINTING CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring TypeScript, ESLint, and Prettier');

  const codeQualityConfig = await ctx.task(codeQualityTask, {
    projectName,
    typescript,
    outputDir
  });

  artifacts.push(...codeQualityConfig.artifacts);

  // ============================================================================
  // PHASE 4: NAVIGATION SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up navigation and routing');

  const navigationSetup = await ctx.task(navigationSetupTask, {
    projectName,
    navigationLibrary: features.navigation,
    targetPlatforms,
    outputDir
  });

  artifacts.push(...navigationSetup.artifacts);

  // ============================================================================
  // PHASE 5: STATE MANAGEMENT CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Configuring state management');

  const stateManagement = await ctx.task(stateManagementTask, {
    projectName,
    stateLibrary: features.stateManagement,
    outputDir
  });

  artifacts.push(...stateManagement.artifacts);

  // ============================================================================
  // PHASE 6: API CLIENT AND NETWORKING
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up API client and networking layer');

  const networkingSetup = await ctx.task(networkingSetupTask, {
    projectName,
    apiClient: features.apiClient,
    outputDir
  });

  artifacts.push(...networkingSetup.artifacts);

  // ============================================================================
  // PHASE 7: LOCAL STORAGE CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Configuring local storage and persistence');

  const storageConfig = await ctx.task(storageConfigTask, {
    projectName,
    outputDir
  });

  artifacts.push(...storageConfig.artifacts);

  // ============================================================================
  // PHASE 8: TESTING INFRASTRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 8: Setting up testing infrastructure');

  const testingSetup = await ctx.task(testingSetupTask, {
    projectName,
    testingFramework,
    outputDir
  });

  artifacts.push(...testingSetup.artifacts);

  // ============================================================================
  // PHASE 9: DEBUGGING TOOLS CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Configuring debugging tools');

  const debuggingConfig = await ctx.task(debuggingConfigTask, {
    projectName,
    useExpo,
    outputDir
  });

  artifacts.push(...debuggingConfig.artifacts);

  // ============================================================================
  // PHASE 10: ENVIRONMENT AND SECRETS MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Setting up environment variables and secrets management');

  const envConfig = await ctx.task(envConfigTask, {
    projectName,
    targetPlatforms,
    outputDir
  });

  artifacts.push(...envConfig.artifacts);

  // ============================================================================
  // PHASE 11: CODE SIGNING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 11: Configuring code signing for iOS and Android');

  const codeSigningSetup = await ctx.task(codeSigningTask, {
    projectName,
    targetPlatforms,
    outputDir
  });

  artifacts.push(...codeSigningSetup.artifacts);

  // Quality Gate: Review setup configuration
  await ctx.breakpoint({
    question: `React Native project setup complete for ${projectName}. Review configuration and approve?`,
    title: 'Project Setup Review',
    context: {
      runId: ctx.runId,
      projectName,
      targetPlatforms,
      features,
      typescript,
      useExpo,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'javascript' }))
    }
  });

  // ============================================================================
  // PHASE 12: DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating project documentation');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    projectInit,
    structureSetup,
    codeQualityConfig,
    navigationSetup,
    stateManagement,
    networkingSetup,
    testingSetup,
    envConfig,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    projectPath: projectInit.projectPath,
    configuration: {
      targetPlatforms,
      useExpo,
      typescript,
      navigation: features.navigation,
      stateManagement: features.stateManagement,
      apiClient: features.apiClient,
      testing: testingFramework
    },
    structure: structureSetup.folderStructure,
    dependencies: projectInit.dependencies,
    devDependencies: projectInit.devDependencies,
    scripts: projectInit.scripts,
    devSetupGuide: documentation.setupGuidePath,
    documentation: {
      readme: documentation.readmePath,
      setupGuide: documentation.setupGuidePath,
      conventions: documentation.conventionsPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/mobile-development/react-native-app-setup',
      timestamp: startTime,
      targetPlatforms,
      useExpo
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const projectInitTask = defineTask('project-init', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Project Initialization - ${args.projectName}`,
  skill: { name: 'react-native-dev' },
  agent: {
    name: 'react-native-expert',
    prompt: {
      role: 'Senior React Native Developer',
      task: 'Initialize React Native project with CLI or Expo',
      context: {
        projectName: args.projectName,
        targetPlatforms: args.targetPlatforms,
        useExpo: args.useExpo,
        typescript: args.typescript,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Initialize React Native project using CLI or Expo based on useExpo flag',
        '2. Configure package.json with project metadata',
        '3. Set up initial dependencies for cross-platform development',
        '4. Configure metro.config.js for bundler settings',
        '5. Set up babel.config.js with required presets and plugins',
        '6. Initialize git repository with .gitignore',
        '7. Configure app.json/app.config.js for Expo or native settings',
        '8. Set up initial npm scripts for development and building',
        '9. Document project initialization steps',
        '10. Generate project initialization report'
      ],
      outputFormat: 'JSON with project initialization details'
    },
    outputSchema: {
      type: 'object',
      required: ['projectPath', 'dependencies', 'artifacts'],
      properties: {
        projectPath: { type: 'string' },
        dependencies: { type: 'object' },
        devDependencies: { type: 'object' },
        scripts: { type: 'object' },
        configFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'react-native', 'setup', 'initialization']
}));

export const projectStructureTask = defineTask('project-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Project Structure Setup - ${args.projectName}`,
  skill: { name: 'react-native-dev' },
  agent: {
    name: 'react-native-expert',
    prompt: {
      role: 'React Native Architect',
      task: 'Set up scalable project folder structure',
      context: {
        projectName: args.projectName,
        projectInit: args.projectInit,
        features: args.features,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create feature-based or layer-based folder structure',
        '2. Set up src/ directory with organized subdirectories',
        '3. Create folders for components, screens, navigation, services',
        '4. Set up assets folder structure (images, fonts, icons)',
        '5. Create utils and helpers directory',
        '6. Set up hooks directory for custom hooks',
        '7. Create constants and config directories',
        '8. Set up types directory for TypeScript definitions',
        '9. Create index files for clean imports',
        '10. Document folder structure and conventions'
      ],
      outputFormat: 'JSON with folder structure details'
    },
    outputSchema: {
      type: 'object',
      required: ['folderStructure', 'artifacts'],
      properties: {
        folderStructure: { type: 'object' },
        conventions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'react-native', 'architecture', 'structure']
}));

export const codeQualityTask = defineTask('code-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Code Quality Configuration - ${args.projectName}`,
  skill: { name: 'react-native-dev' },
  agent: {
    name: 'react-native-expert',
    prompt: {
      role: 'Code Quality Engineer',
      task: 'Configure TypeScript, ESLint, and Prettier for code quality',
      context: {
        projectName: args.projectName,
        typescript: args.typescript,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure tsconfig.json with strict TypeScript settings',
        '2. Set up ESLint with React Native recommended rules',
        '3. Configure Prettier for code formatting',
        '4. Set up .eslintignore and .prettierignore',
        '5. Configure husky for pre-commit hooks',
        '6. Set up lint-staged for staged file linting',
        '7. Add npm scripts for linting and formatting',
        '8. Configure editor settings (.editorconfig)',
        '9. Set up path aliases in tsconfig',
        '10. Document code quality standards'
      ],
      outputFormat: 'JSON with code quality configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['eslintConfig', 'prettierConfig', 'artifacts'],
      properties: {
        eslintConfig: { type: 'object' },
        prettierConfig: { type: 'object' },
        tsconfigSettings: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'react-native', 'code-quality', 'typescript']
}));

export const navigationSetupTask = defineTask('navigation-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Navigation Setup - ${args.projectName}`,
  skill: { name: 'react-native-dev' },
  agent: {
    name: 'react-native-expert',
    prompt: {
      role: 'React Native Navigation Specialist',
      task: 'Set up React Navigation for app routing',
      context: {
        projectName: args.projectName,
        navigationLibrary: args.navigationLibrary,
        targetPlatforms: args.targetPlatforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Install React Navigation and required dependencies',
        '2. Configure NavigationContainer with proper setup',
        '3. Create stack navigator for screen navigation',
        '4. Set up tab navigator for bottom tabs',
        '5. Configure drawer navigator if needed',
        '6. Set up deep linking configuration',
        '7. Implement navigation types for TypeScript',
        '8. Create navigation utilities and hooks',
        '9. Set up navigation theme for styling',
        '10. Document navigation patterns and usage'
      ],
      outputFormat: 'JSON with navigation configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['navigators', 'artifacts'],
      properties: {
        navigators: { type: 'array', items: { type: 'string' } },
        deepLinkingConfig: { type: 'object' },
        navigationTheme: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'react-native', 'navigation']
}));

export const stateManagementTask = defineTask('state-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: State Management - ${args.projectName}`,
  skill: { name: 'react-native-dev' },
  agent: {
    name: 'react-native-expert',
    prompt: {
      role: 'React Native State Management Specialist',
      task: 'Configure state management solution',
      context: {
        projectName: args.projectName,
        stateLibrary: args.stateLibrary,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Install state management library (Redux Toolkit, Context API, Recoil)',
        '2. Set up store configuration with proper middleware',
        '3. Configure Redux DevTools integration',
        '4. Create base slices/reducers structure',
        '5. Set up typed hooks for state access',
        '6. Configure state persistence if needed',
        '7. Create example slice with async thunks',
        '8. Set up selectors for derived state',
        '9. Configure state hydration',
        '10. Document state management patterns'
      ],
      outputFormat: 'JSON with state management configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['storeConfig', 'artifacts'],
      properties: {
        storeConfig: { type: 'object' },
        slices: { type: 'array', items: { type: 'string' } },
        middleware: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'react-native', 'state-management']
}));

export const networkingSetupTask = defineTask('networking-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Networking Setup - ${args.projectName}`,
  skill: { name: 'react-native-dev' },
  agent: {
    name: 'react-native-expert',
    prompt: {
      role: 'React Native API Integration Specialist',
      task: 'Set up API client and networking layer',
      context: {
        projectName: args.projectName,
        apiClient: args.apiClient,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Install API client library (Axios or React Query)',
        '2. Configure base API client with interceptors',
        '3. Set up request/response interceptors for auth',
        '4. Configure error handling and retry logic',
        '5. Set up API service layer structure',
        '6. Configure caching strategy',
        '7. Implement request cancellation',
        '8. Set up network state detection',
        '9. Create typed API response handlers',
        '10. Document API integration patterns'
      ],
      outputFormat: 'JSON with networking configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['apiClientConfig', 'artifacts'],
      properties: {
        apiClientConfig: { type: 'object' },
        interceptors: { type: 'array', items: { type: 'string' } },
        services: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'react-native', 'networking', 'api']
}));

export const storageConfigTask = defineTask('storage-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Storage Configuration - ${args.projectName}`,
  skill: { name: 'offline-storage' },
  agent: {
    name: 'react-native-expert',
    prompt: {
      role: 'React Native Storage Specialist',
      task: 'Configure local storage and data persistence',
      context: {
        projectName: args.projectName,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Install AsyncStorage or MMKV for local storage',
        '2. Configure storage wrapper with typed access',
        '3. Set up secure storage for sensitive data',
        '4. Implement storage migration utilities',
        '5. Create storage hooks for easy access',
        '6. Configure storage encryption if needed',
        '7. Set up storage cleanup utilities',
        '8. Implement storage quota management',
        '9. Create storage testing utilities',
        '10. Document storage patterns and best practices'
      ],
      outputFormat: 'JSON with storage configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['storageConfig', 'artifacts'],
      properties: {
        storageConfig: { type: 'object' },
        storageTypes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'react-native', 'storage', 'persistence']
}));

export const testingSetupTask = defineTask('testing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Testing Setup - ${args.projectName}`,
  skill: { name: 'mobile-testing' },
  agent: {
    name: 'mobile-qa-expert',
    prompt: {
      role: 'React Native Testing Specialist',
      task: 'Set up comprehensive testing infrastructure',
      context: {
        projectName: args.projectName,
        testingFramework: args.testingFramework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure Jest for unit testing',
        '2. Set up React Native Testing Library',
        '3. Configure test coverage reporting',
        '4. Set up mocks for native modules',
        '5. Create test utilities and helpers',
        '6. Configure snapshot testing',
        '7. Set up integration test structure',
        '8. Configure E2E testing with Detox (optional)',
        '9. Add test npm scripts',
        '10. Document testing conventions and patterns'
      ],
      outputFormat: 'JSON with testing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['jestConfig', 'artifacts'],
      properties: {
        jestConfig: { type: 'object' },
        testUtilities: { type: 'array', items: { type: 'string' } },
        mocks: { type: 'array', items: { type: 'string' } },
        coverageThresholds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'react-native', 'testing', 'jest']
}));

export const debuggingConfigTask = defineTask('debugging-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Debugging Configuration - ${args.projectName}`,
  skill: { name: 'react-native-dev' },
  agent: {
    name: 'react-native-expert',
    prompt: {
      role: 'React Native Debugging Specialist',
      task: 'Configure debugging tools and utilities',
      context: {
        projectName: args.projectName,
        useExpo: args.useExpo,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure Flipper for debugging',
        '2. Set up Reactotron as alternative debugger',
        '3. Configure React DevTools integration',
        '4. Set up network request logging',
        '5. Configure Redux DevTools',
        '6. Set up console logging utilities',
        '7. Configure source maps for debugging',
        '8. Set up performance monitoring',
        '9. Configure crash reporting setup (basic)',
        '10. Document debugging workflows'
      ],
      outputFormat: 'JSON with debugging configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['debugTools', 'artifacts'],
      properties: {
        debugTools: { type: 'array', items: { type: 'string' } },
        flipperPlugins: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'react-native', 'debugging']
}));

export const envConfigTask = defineTask('env-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Environment Configuration - ${args.projectName}`,
  skill: { name: 'react-native-dev' },
  agent: {
    name: 'react-native-expert',
    prompt: {
      role: 'React Native Configuration Specialist',
      task: 'Set up environment variables and secrets management',
      context: {
        projectName: args.projectName,
        targetPlatforms: args.targetPlatforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Install react-native-config or similar',
        '2. Create .env files for different environments',
        '3. Configure TypeScript types for env variables',
        '4. Set up environment switching mechanism',
        '5. Configure build variants for environments',
        '6. Set up secure secrets handling',
        '7. Create environment validation',
        '8. Configure CI/CD environment injection',
        '9. Add .env files to .gitignore',
        '10. Document environment configuration'
      ],
      outputFormat: 'JSON with environment configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['envFiles', 'artifacts'],
      properties: {
        envFiles: { type: 'array', items: { type: 'string' } },
        envVariables: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'react-native', 'configuration', 'environment']
}));

export const codeSigningTask = defineTask('code-signing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Code Signing Setup - ${args.projectName}`,
  skill: { name: 'fastlane-cicd' },
  agent: {
    name: 'mobile-devops',
    prompt: {
      role: 'Mobile DevOps Engineer',
      task: 'Configure code signing for iOS and Android',
      context: {
        projectName: args.projectName,
        targetPlatforms: args.targetPlatforms,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document iOS code signing requirements',
        '2. Configure iOS provisioning profile setup',
        '3. Set up Android keystore generation',
        '4. Configure Gradle signing configs',
        '5. Set up Fastlane match for iOS (optional)',
        '6. Configure secure key storage',
        '7. Set up CI/CD code signing',
        '8. Document certificate management',
        '9. Create signing troubleshooting guide',
        '10. Generate code signing setup guide'
      ],
      outputFormat: 'JSON with code signing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['iosConfig', 'androidConfig', 'artifacts'],
      properties: {
        iosConfig: { type: 'object' },
        androidConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'react-native', 'code-signing', 'devops']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Documentation Generation - ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate comprehensive project documentation',
      context: {
        projectName: args.projectName,
        projectInit: args.projectInit,
        structureSetup: args.structureSetup,
        codeQualityConfig: args.codeQualityConfig,
        navigationSetup: args.navigationSetup,
        stateManagement: args.stateManagement,
        networkingSetup: args.networkingSetup,
        testingSetup: args.testingSetup,
        envConfig: args.envConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate README.md with project overview',
        '2. Create development setup guide',
        '3. Document project structure and conventions',
        '4. Create component development guidelines',
        '5. Document state management patterns',
        '6. Create API integration guide',
        '7. Document testing conventions',
        '8. Create troubleshooting guide',
        '9. Generate CI/CD pipeline templates',
        '10. Create contribution guidelines'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'setupGuidePath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        setupGuidePath: { type: 'string' },
        conventionsPath: { type: 'string' },
        troubleshootingPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mobile', 'react-native', 'documentation']
}));
