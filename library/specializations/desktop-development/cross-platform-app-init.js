/**
 * @process specializations/desktop-development/cross-platform-app-init
 * @description Cross-Platform Desktop App Initialization - Set up new desktop application project with chosen framework
 * (Electron, Qt, Flutter, MAUI); configure build system, project structure, dependencies, and basic application scaffold.
 * @inputs { projectName: string, framework: string, targetPlatforms: array, language?: string, uiFramework?: string, outputDir?: string }
 * @outputs { success: boolean, projectPath: string, framework: string, configFiles: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/cross-platform-app-init', {
 *   projectName: 'MyDesktopApp',
 *   framework: 'Electron',
 *   targetPlatforms: ['windows', 'macos', 'linux'],
 *   language: 'TypeScript',
 *   uiFramework: 'React'
 * });
 *
 * @references
 * - Electron Quick Start: https://www.electronjs.org/docs/latest/tutorial/quick-start
 * - Qt Getting Started: https://doc.qt.io/qt-6/gettingstarted.html
 * - Flutter Desktop: https://flutter.dev/desktop
 * - .NET MAUI: https://docs.microsoft.com/en-us/dotnet/maui/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'Electron',
    targetPlatforms = ['windows', 'macos', 'linux'],
    language = 'TypeScript',
    uiFramework = 'React',
    packageManager = 'npm',
    outputDir = 'desktop-app-init'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Cross-Platform Desktop App Initialization: ${projectName}`);
  ctx.log('info', `Framework: ${framework}, Language: ${language}, UI: ${uiFramework}`);
  ctx.log('info', `Target Platforms: ${targetPlatforms.join(', ')}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS AND FRAMEWORK VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing requirements and validating framework selection');

  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    projectName,
    framework,
    targetPlatforms,
    language,
    uiFramework,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: Framework ${framework} validated for ${targetPlatforms.length} platforms. Compatibility score: ${requirementsAnalysis.compatibilityScore}/100. Proceed with project setup?`,
    title: 'Framework Validation Review',
    context: {
      runId: ctx.runId,
      framework,
      targetPlatforms,
      compatibilityScore: requirementsAnalysis.compatibilityScore,
      recommendations: requirementsAnalysis.recommendations,
      files: requirementsAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: PROJECT STRUCTURE CREATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating project structure and directory layout');

  const projectStructure = await ctx.task(createProjectStructureTask, {
    projectName,
    framework,
    targetPlatforms,
    language,
    uiFramework,
    outputDir
  });

  artifacts.push(...projectStructure.artifacts);

  // ============================================================================
  // PHASE 3: DEPENDENCY CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring dependencies and package management');

  const dependencyConfig = await ctx.task(configureDependenciesTask, {
    projectName,
    framework,
    language,
    uiFramework,
    packageManager,
    projectStructure,
    outputDir
  });

  artifacts.push(...dependencyConfig.artifacts);

  // ============================================================================
  // PHASE 4: BUILD SYSTEM SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up build system and toolchain');

  const buildSystemSetup = await ctx.task(setupBuildSystemTask, {
    projectName,
    framework,
    targetPlatforms,
    language,
    projectStructure,
    outputDir
  });

  artifacts.push(...buildSystemSetup.artifacts);

  // ============================================================================
  // PHASE 5: APPLICATION SCAFFOLD GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Generating application scaffold and boilerplate');

  const scaffoldGeneration = await ctx.task(generateScaffoldTask, {
    projectName,
    framework,
    targetPlatforms,
    language,
    uiFramework,
    projectStructure,
    outputDir
  });

  artifacts.push(...scaffoldGeneration.artifacts);

  await ctx.breakpoint({
    question: `Phase 5 Complete: Application scaffold generated with ${scaffoldGeneration.filesCreated} files. Main entry point: ${scaffoldGeneration.mainEntryPoint}. Review scaffold structure?`,
    title: 'Scaffold Generation Review',
    context: {
      runId: ctx.runId,
      filesCreated: scaffoldGeneration.filesCreated,
      mainEntryPoint: scaffoldGeneration.mainEntryPoint,
      components: scaffoldGeneration.components,
      files: scaffoldGeneration.artifacts.map(a => ({ path: a.path, format: a.format || 'code' }))
    }
  });

  // ============================================================================
  // PHASE 6: PLATFORM-SPECIFIC CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Configuring platform-specific settings');

  const platformConfigTasks = targetPlatforms.map(platform =>
    () => ctx.task(configurePlatformTask, {
      projectName,
      framework,
      platform,
      language,
      projectStructure,
      outputDir
    })
  );

  const platformConfigs = await ctx.parallel.all(platformConfigTasks);

  artifacts.push(...platformConfigs.flatMap(c => c.artifacts));

  // ============================================================================
  // PHASE 7: DEVELOPMENT ENVIRONMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up development environment and tooling');

  const devEnvSetup = await ctx.task(setupDevEnvironmentTask, {
    projectName,
    framework,
    language,
    uiFramework,
    projectStructure,
    outputDir
  });

  artifacts.push(...devEnvSetup.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating project documentation');

  const documentation = await ctx.task(generateDocumentationTask, {
    projectName,
    framework,
    targetPlatforms,
    language,
    uiFramework,
    projectStructure,
    dependencyConfig,
    buildSystemSetup,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 9: VALIDATION AND VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Validating project setup and running initial build');

  const validation = await ctx.task(validateProjectSetupTask, {
    projectName,
    framework,
    targetPlatforms,
    projectStructure,
    dependencyConfig,
    buildSystemSetup,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  await ctx.breakpoint({
    question: `Project Initialization Complete for ${projectName}! Validation score: ${validation.validationScore}/100. ${validationPassed ? 'All checks passed!' : 'Some issues need attention.'} Approve project setup?`,
    title: 'Project Initialization Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        framework,
        targetPlatforms,
        language,
        uiFramework,
        validationScore: validation.validationScore,
        filesCreated: scaffoldGeneration.filesCreated,
        buildSystemReady: buildSystemSetup.buildSystemReady
      },
      nextSteps: validation.nextSteps,
      files: [
        { path: documentation.readmePath, format: 'markdown', label: 'Project README' },
        { path: documentation.setupGuidePath, format: 'markdown', label: 'Setup Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validationPassed,
    projectName,
    projectPath: projectStructure.projectPath,
    framework,
    language,
    uiFramework,
    targetPlatforms,
    configFiles: {
      packageConfig: dependencyConfig.packageConfigPath,
      buildConfig: buildSystemSetup.buildConfigPath,
      platformConfigs: platformConfigs.map(c => c.configPath)
    },
    scaffold: {
      filesCreated: scaffoldGeneration.filesCreated,
      mainEntryPoint: scaffoldGeneration.mainEntryPoint,
      components: scaffoldGeneration.components
    },
    validation: {
      score: validation.validationScore,
      passed: validationPassed,
      checks: validation.checks
    },
    documentation: {
      readme: documentation.readmePath,
      setupGuide: documentation.setupGuidePath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/desktop-development/cross-platform-app-init',
      timestamp: startTime,
      framework,
      targetPlatforms
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Analysis - ${args.projectName}`,
  agent: {
    name: 'electron-architect',
    prompt: {
      role: 'Senior Desktop Application Architect',
      task: 'Analyze requirements and validate framework selection for cross-platform desktop application',
      context: args,
      instructions: [
        '1. Validate framework choice against target platforms',
        '2. Assess language and UI framework compatibility',
        '3. Identify framework-specific requirements and constraints',
        '4. Evaluate development team skill requirements',
        '5. Assess performance implications for each platform',
        '6. Identify native feature requirements and framework capabilities',
        '7. Calculate compatibility score (0-100)',
        '8. Provide recommendations for optimal configuration',
        '9. Document framework limitations and workarounds',
        '10. Generate requirements analysis report'
      ],
      outputFormat: 'JSON with compatibility analysis and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['compatibilityScore', 'recommendations', 'artifacts'],
      properties: {
        compatibilityScore: { type: 'number', minimum: 0, maximum: 100 },
        frameworkValidation: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            platformSupport: { type: 'array', items: { type: 'string' } },
            limitations: { type: 'array', items: { type: 'string' } }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        skillRequirements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'cross-platform', 'requirements-analysis']
}));

export const createProjectStructureTask = defineTask('create-project-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Create Project Structure - ${args.projectName}`,
  agent: {
    name: 'project-scaffolder',
    prompt: {
      role: 'Desktop Application Project Scaffolder',
      task: 'Create optimal project structure for cross-platform desktop application',
      context: args,
      instructions: [
        '1. Create root project directory with appropriate naming',
        '2. Define directory structure based on framework conventions',
        '3. Create source directories (src/, lib/, assets/)',
        '4. Create platform-specific directories if needed',
        '5. Create build and output directories',
        '6. Create test directory structure',
        '7. Create documentation directory',
        '8. Set up configuration file locations',
        '9. Create .gitignore with appropriate patterns',
        '10. Document directory structure and purpose'
      ],
      outputFormat: 'JSON with project structure details'
    },
    outputSchema: {
      type: 'object',
      required: ['projectPath', 'directories', 'artifacts'],
      properties: {
        projectPath: { type: 'string' },
        directories: { type: 'array', items: { type: 'string' } },
        structure: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'project-structure']
}));

export const configureDependenciesTask = defineTask('configure-dependencies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Configure Dependencies - ${args.projectName}`,
  agent: {
    name: 'dependency-manager',
    prompt: {
      role: 'Desktop Application Dependency Manager',
      task: 'Configure project dependencies and package management',
      context: args,
      instructions: [
        '1. Create package configuration file (package.json, pubspec.yaml, etc.)',
        '2. Add core framework dependencies',
        '3. Add UI framework dependencies',
        '4. Add development dependencies (TypeScript, linters, formatters)',
        '5. Add testing dependencies',
        '6. Add build tool dependencies',
        '7. Configure dependency versions and ranges',
        '8. Set up peer dependencies if needed',
        '9. Configure scripts for common tasks',
        '10. Document dependency purposes'
      ],
      outputFormat: 'JSON with dependency configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['packageConfigPath', 'dependencies', 'artifacts'],
      properties: {
        packageConfigPath: { type: 'string' },
        dependencies: { type: 'object' },
        devDependencies: { type: 'object' },
        scripts: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'dependencies']
}));

export const setupBuildSystemTask = defineTask('setup-build-system', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Setup Build System - ${args.projectName}`,
  agent: {
    name: 'build-engineer',
    prompt: {
      role: 'Desktop Application Build Engineer',
      task: 'Configure build system and toolchain for cross-platform builds',
      context: args,
      instructions: [
        '1. Configure build tool (electron-builder, webpack, CMake, etc.)',
        '2. Set up platform-specific build configurations',
        '3. Configure code compilation/transpilation',
        '4. Set up asset bundling and optimization',
        '5. Configure development build (fast, with source maps)',
        '6. Configure production build (optimized, minified)',
        '7. Set up incremental builds for development',
        '8. Configure build output directories',
        '9. Set up environment variable handling',
        '10. Document build commands and options'
      ],
      outputFormat: 'JSON with build system configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['buildConfigPath', 'buildSystemReady', 'artifacts'],
      properties: {
        buildConfigPath: { type: 'string' },
        buildSystemReady: { type: 'boolean' },
        buildCommands: { type: 'object' },
        platformBuilds: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'build-system']
}));

export const generateScaffoldTask = defineTask('generate-scaffold', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Generate Application Scaffold - ${args.projectName}`,
  skill: {
    name: 'electron-main-preload-generator',
  },
  agent: {
    name: 'app-scaffolder',
    prompt: {
      role: 'Desktop Application Scaffolder',
      task: 'Generate application scaffold and boilerplate code',
      context: args,
      instructions: [
        '1. Create main entry point file',
        '2. Create main window/application component',
        '3. Set up application lifecycle handling',
        '4. Create basic UI layout/shell',
        '5. Set up routing/navigation if applicable',
        '6. Create sample components demonstrating patterns',
        '7. Set up state management foundation',
        '8. Create configuration loading mechanism',
        '9. Set up logging infrastructure',
        '10. Add placeholder assets (icons, splash screen)'
      ],
      outputFormat: 'JSON with scaffold details'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'mainEntryPoint', 'artifacts'],
      properties: {
        filesCreated: { type: 'number' },
        mainEntryPoint: { type: 'string' },
        components: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'scaffold']
}));

export const configurePlatformTask = defineTask('configure-platform', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Configure Platform - ${args.platform} - ${args.projectName}`,
  agent: {
    name: 'cross-platform-abstraction-architect',
    prompt: {
      role: 'Platform Configuration Specialist',
      task: `Configure platform-specific settings for ${args.platform}`,
      context: args,
      instructions: [
        `1. Create ${args.platform}-specific configuration files`,
        '2. Configure platform icons and assets',
        '3. Set up platform-specific build settings',
        '4. Configure platform permissions/entitlements',
        '5. Set up platform-specific features',
        '6. Configure installer/packaging settings',
        '7. Set up code signing placeholders',
        '8. Configure platform-specific dependencies',
        '9. Document platform requirements',
        '10. Create platform build scripts'
      ],
      outputFormat: 'JSON with platform configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['platform', 'configPath', 'artifacts'],
      properties: {
        platform: { type: 'string' },
        configPath: { type: 'string' },
        settings: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'platform-config', args.platform]
}));

export const setupDevEnvironmentTask = defineTask('setup-dev-environment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Setup Development Environment - ${args.projectName}`,
  agent: {
    name: 'dev-environment-specialist',
    prompt: {
      role: 'Development Environment Specialist',
      task: 'Configure development environment and tooling',
      context: args,
      instructions: [
        '1. Configure linting (ESLint, lint-staged)',
        '2. Set up code formatting (Prettier)',
        '3. Configure TypeScript/language settings',
        '4. Set up hot reload/live reload',
        '5. Configure debugging (launch.json for VS Code)',
        '6. Set up editor configuration (.editorconfig)',
        '7. Configure pre-commit hooks (Husky)',
        '8. Set up environment variable templates',
        '9. Configure development proxy if needed',
        '10. Document development workflow'
      ],
      outputFormat: 'JSON with dev environment configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['toolsConfigured', 'artifacts'],
      properties: {
        toolsConfigured: { type: 'array', items: { type: 'string' } },
        configFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'dev-environment']
}));

export const generateDocumentationTask = defineTask('generate-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Generate Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate comprehensive project documentation',
      context: args,
      instructions: [
        '1. Create README.md with project overview',
        '2. Document prerequisites and system requirements',
        '3. Create setup guide with step-by-step instructions',
        '4. Document available scripts and commands',
        '5. Create architecture overview',
        '6. Document folder structure',
        '7. Create development workflow guide',
        '8. Document building for each platform',
        '9. Create troubleshooting section',
        '10. Add contribution guidelines'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'setupGuidePath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        setupGuidePath: { type: 'string' },
        architecturePath: { type: 'string' },
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

export const validateProjectSetupTask = defineTask('validate-project-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Validate Project Setup - ${args.projectName}`,
  agent: {
    name: 'qa-validator',
    prompt: {
      role: 'Project Setup Validator',
      task: 'Validate project setup and run initial verification',
      context: args,
      instructions: [
        '1. Verify all required files exist',
        '2. Validate configuration file syntax',
        '3. Check dependency declarations',
        '4. Verify build system configuration',
        '5. Run dependency installation check',
        '6. Attempt initial build/compile',
        '7. Verify platform configurations',
        '8. Check documentation completeness',
        '9. Calculate validation score',
        '10. Generate next steps for development'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'checks', 'nextSteps', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        checks: { type: 'array', items: { type: 'object' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } },
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
