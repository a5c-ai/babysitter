/**
 * @process specializations/desktop-development/desktop-build-pipeline
 * @description Desktop Build Pipeline Setup - Configure CI/CD pipeline for building desktop applications across multiple
 * platforms (Windows, macOS, Linux); set up automated builds, testing, and artifact generation.
 * @inputs { projectName: string, cicdPlatform: string, targetPlatforms: array, framework: string, testingStrategy?: object, outputDir?: string }
 * @outputs { success: boolean, pipelineConfig: object, buildMatrix: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/desktop-development/desktop-build-pipeline', {
 *   projectName: 'MyDesktopApp',
 *   cicdPlatform: 'GitHub Actions',
 *   targetPlatforms: ['windows', 'macos', 'linux'],
 *   framework: 'Electron',
 *   testingStrategy: { unit: true, e2e: true }
 * });
 *
 * @references
 * - GitHub Actions: https://docs.github.com/en/actions
 * - electron-builder CI: https://www.electron.build/configuration/publish#how-to-ci
 * - Azure Pipelines: https://azure.microsoft.com/en-us/services/devops/pipelines/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    cicdPlatform = 'GitHub Actions',
    targetPlatforms = ['windows', 'macos', 'linux'],
    framework = 'Electron',
    testingStrategy = { unit: true, integration: true, e2e: false },
    artifactRetention = 30,
    outputDir = 'build-pipeline-setup'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Desktop Build Pipeline Setup: ${projectName}`);
  ctx.log('info', `CI/CD Platform: ${cicdPlatform}, Framework: ${framework}`);
  ctx.log('info', `Target Platforms: ${targetPlatforms.join(', ')}`);

  // ============================================================================
  // PHASE 1: PIPELINE REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing pipeline requirements');

  const requirementsAnalysis = await ctx.task(pipelineRequirementsTask, {
    projectName,
    cicdPlatform,
    targetPlatforms,
    framework,
    testingStrategy,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: Pipeline requirements analyzed. Build matrix: ${requirementsAnalysis.buildMatrix.length} configurations. Proceed with pipeline design?`,
    title: 'Pipeline Requirements Review',
    context: {
      runId: ctx.runId,
      cicdPlatform,
      buildMatrix: requirementsAnalysis.buildMatrix,
      estimatedBuildTime: requirementsAnalysis.estimatedBuildTime,
      files: requirementsAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: BUILD MATRIX CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring build matrix for multi-platform builds');

  const buildMatrixConfig = await ctx.task(configureBuildMatrixTask, {
    projectName,
    cicdPlatform,
    targetPlatforms,
    framework,
    requirementsAnalysis,
    outputDir
  });

  artifacts.push(...buildMatrixConfig.artifacts);

  // ============================================================================
  // PHASE 3: TEST STAGE CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring test stages');

  const testStageConfig = await ctx.task(configureTestStagesTask, {
    projectName,
    cicdPlatform,
    framework,
    testingStrategy,
    buildMatrixConfig,
    outputDir
  });

  artifacts.push(...testStageConfig.artifacts);

  // ============================================================================
  // PHASE 4: BUILD STAGE CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Configuring build stages for each platform');

  const buildStageTasks = targetPlatforms.map(platform =>
    () => ctx.task(configurePlatformBuildTask, {
      projectName,
      cicdPlatform,
      platform,
      framework,
      buildMatrixConfig,
      outputDir
    })
  );

  const buildStageConfigs = await ctx.parallel.all(buildStageTasks);

  artifacts.push(...buildStageConfigs.flatMap(c => c.artifacts));

  // ============================================================================
  // PHASE 5: ARTIFACT MANAGEMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up artifact management');

  const artifactManagement = await ctx.task(setupArtifactManagementTask, {
    projectName,
    cicdPlatform,
    targetPlatforms,
    framework,
    artifactRetention,
    outputDir
  });

  artifacts.push(...artifactManagement.artifacts);

  // ============================================================================
  // PHASE 6: CACHING CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Configuring build caching');

  const cachingConfig = await ctx.task(configureCachingTask, {
    projectName,
    cicdPlatform,
    framework,
    targetPlatforms,
    outputDir
  });

  artifacts.push(...cachingConfig.artifacts);

  // ============================================================================
  // PHASE 7: PIPELINE FILE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating pipeline configuration files');

  const pipelineGeneration = await ctx.task(generatePipelineFilesTask, {
    projectName,
    cicdPlatform,
    targetPlatforms,
    framework,
    buildMatrixConfig,
    testStageConfig,
    buildStageConfigs,
    artifactManagement,
    cachingConfig,
    outputDir
  });

  artifacts.push(...pipelineGeneration.artifacts);

  await ctx.breakpoint({
    question: `Phase 7 Complete: Pipeline files generated. Main config: ${pipelineGeneration.mainConfigPath}. Review pipeline configuration?`,
    title: 'Pipeline Generation Review',
    context: {
      runId: ctx.runId,
      mainConfigPath: pipelineGeneration.mainConfigPath,
      stages: pipelineGeneration.stages,
      files: pipelineGeneration.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 8: DOCUMENTATION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating documentation and validating pipeline');

  const documentation = await ctx.task(generatePipelineDocumentationTask, {
    projectName,
    cicdPlatform,
    targetPlatforms,
    framework,
    pipelineGeneration,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const validation = await ctx.task(validatePipelineTask, {
    projectName,
    cicdPlatform,
    pipelineGeneration,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  const validationPassed = validation.validationScore >= 80;

  await ctx.breakpoint({
    question: `Desktop Build Pipeline Setup Complete for ${projectName}! Validation score: ${validation.validationScore}/100. ${validationPassed ? 'Pipeline is ready!' : 'Some issues need attention.'} Approve pipeline?`,
    title: 'Pipeline Setup Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        cicdPlatform,
        targetPlatforms,
        framework,
        validationScore: validation.validationScore,
        totalStages: pipelineGeneration.stages.length,
        cachingEnabled: cachingConfig.cachingEnabled
      },
      nextSteps: validation.nextSteps,
      files: [
        { path: pipelineGeneration.mainConfigPath, format: 'yaml', label: 'Pipeline Configuration' },
        { path: documentation.readmePath, format: 'markdown', label: 'Pipeline Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validationPassed,
    projectName,
    cicdPlatform,
    pipelineConfig: {
      mainConfigPath: pipelineGeneration.mainConfigPath,
      stages: pipelineGeneration.stages,
      triggers: pipelineGeneration.triggers
    },
    buildMatrix: buildMatrixConfig.matrix,
    targetPlatforms,
    testing: {
      stages: testStageConfig.stages,
      strategy: testingStrategy
    },
    artifacts: {
      management: artifactManagement.configuration,
      retention: artifactRetention
    },
    caching: cachingConfig.strategies,
    validation: {
      score: validation.validationScore,
      passed: validationPassed,
      checks: validation.checks
    },
    documentation: {
      readme: documentation.readmePath
    },
    processArtifacts: artifacts,
    duration,
    metadata: {
      processId: 'specializations/desktop-development/desktop-build-pipeline',
      timestamp: startTime,
      cicdPlatform,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const pipelineRequirementsTask = defineTask('pipeline-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Pipeline Requirements - ${args.projectName}`,
  agent: {
    name: 'desktop-ci-architect',
    prompt: {
      role: 'Desktop DevOps Architect',
      task: 'Analyze requirements for desktop application CI/CD pipeline',
      context: args,
      instructions: [
        '1. Analyze target platforms and build requirements',
        '2. Define build matrix (OS versions, architectures)',
        '3. Identify runner requirements for each platform',
        '4. Assess testing requirements and stages',
        '5. Estimate build times per platform',
        '6. Identify dependencies and prerequisites',
        '7. Define artifact types (installers, binaries, symbols)',
        '8. Assess code signing requirements',
        '9. Identify caching opportunities',
        '10. Generate requirements document'
      ],
      outputFormat: 'JSON with pipeline requirements analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['buildMatrix', 'estimatedBuildTime', 'artifacts'],
      properties: {
        buildMatrix: { type: 'array', items: { type: 'object' } },
        estimatedBuildTime: { type: 'string' },
        runnerRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'build-pipeline', 'requirements']
}));

export const configureBuildMatrixTask = defineTask('configure-build-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Configure Build Matrix - ${args.projectName}`,
  agent: {
    name: 'electron-builder-packager',
    prompt: {
      role: 'Desktop Build Engineer',
      task: 'Configure build matrix for multi-platform desktop builds',
      context: args,
      instructions: [
        '1. Define matrix dimensions (OS, architecture, Node version, etc.)',
        '2. Configure Windows build matrix (x64, arm64 if needed)',
        '3. Configure macOS build matrix (x64, arm64 for Apple Silicon)',
        '4. Configure Linux build matrix (x64, distributions)',
        '5. Set up matrix include/exclude rules',
        '6. Define matrix fail-fast strategy',
        '7. Configure conditional builds',
        '8. Optimize matrix for build time vs coverage',
        '9. Document matrix configuration',
        '10. Generate matrix configuration'
      ],
      outputFormat: 'JSON with build matrix configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'artifacts'],
      properties: {
        matrix: { type: 'object' },
        dimensions: { type: 'array', items: { type: 'string' } },
        totalConfigurations: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'build-matrix']
}));

export const configureTestStagesTask = defineTask('configure-test-stages', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Configure Test Stages - ${args.projectName}`,
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Desktop Test Engineer',
      task: 'Configure testing stages in the build pipeline',
      context: args,
      instructions: [
        '1. Configure unit test stage',
        '2. Configure integration test stage',
        '3. Configure E2E test stage if enabled',
        '4. Set up test parallelization',
        '5. Configure test coverage collection',
        '6. Set up test result publishing',
        '7. Configure test failure handling',
        '8. Set up platform-specific test configurations',
        '9. Configure test caching',
        '10. Document test stages'
      ],
      outputFormat: 'JSON with test stage configurations'
    },
    outputSchema: {
      type: 'object',
      required: ['stages', 'artifacts'],
      properties: {
        stages: { type: 'array', items: { type: 'object' } },
        coverage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'testing']
}));

export const configurePlatformBuildTask = defineTask('configure-platform-build', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Configure ${args.platform} Build - ${args.projectName}`,
  agent: {
    name: 'platform-build-engineer',
    prompt: {
      role: 'Platform Build Engineer',
      task: `Configure build stage for ${args.platform}`,
      context: args,
      instructions: [
        `1. Configure ${args.platform} runner selection`,
        '2. Set up build environment and dependencies',
        '3. Configure code signing step (placeholder)',
        '4. Configure packaging step (installer generation)',
        '5. Set up platform-specific environment variables',
        '6. Configure build output artifacts',
        '7. Set up platform-specific caching',
        '8. Configure notarization for macOS',
        '9. Set up build notifications',
        '10. Document platform build configuration'
      ],
      outputFormat: 'JSON with platform build configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['platform', 'buildSteps', 'artifacts'],
      properties: {
        platform: { type: 'string' },
        runner: { type: 'string' },
        buildSteps: { type: 'array', items: { type: 'object' } },
        outputArtifacts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'platform-build', args.platform]
}));

export const setupArtifactManagementTask = defineTask('setup-artifact-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Setup Artifact Management - ${args.projectName}`,
  agent: {
    name: 'artifact-manager',
    prompt: {
      role: 'Build Artifact Manager',
      task: 'Configure artifact management for desktop builds',
      context: args,
      instructions: [
        '1. Define artifact types (installers, portables, symbols)',
        '2. Configure artifact naming conventions',
        '3. Set up artifact upload steps',
        '4. Configure artifact retention policies',
        '5. Set up artifact download for dependent jobs',
        '6. Configure release artifact publishing',
        '7. Set up debug symbol storage',
        '8. Configure artifact compression',
        '9. Set up artifact integrity verification',
        '10. Document artifact management'
      ],
      outputFormat: 'JSON with artifact management configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        artifactTypes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'artifact-management']
}));

export const configureCachingTask = defineTask('configure-caching', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Configure Caching - ${args.projectName}`,
  agent: {
    name: 'cache-optimizer',
    prompt: {
      role: 'Build Cache Optimizer',
      task: 'Configure build caching for faster pipeline execution',
      context: args,
      instructions: [
        '1. Configure dependency caching (node_modules, etc.)',
        '2. Set up build artifact caching',
        '3. Configure Electron/framework cache',
        '4. Set up native module cache',
        '5. Configure cache key strategies',
        '6. Set up cache restoration order',
        '7. Configure cache size limits',
        '8. Set up cache invalidation rules',
        '9. Estimate cache impact on build time',
        '10. Document caching strategy'
      ],
      outputFormat: 'JSON with caching configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['cachingEnabled', 'strategies', 'artifacts'],
      properties: {
        cachingEnabled: { type: 'boolean' },
        strategies: { type: 'array', items: { type: 'object' } },
        estimatedSavings: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'caching']
}));

export const generatePipelineFilesTask = defineTask('generate-pipeline-files', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Generate Pipeline Files - ${args.projectName}`,
  skill: {
    name: 'electron-builder-config',
  },
  agent: {
    name: 'release-manager',
    prompt: {
      role: 'CI/CD Pipeline Generator',
      task: 'Generate complete pipeline configuration files',
      context: args,
      instructions: [
        '1. Generate main pipeline configuration file',
        '2. Create workflow triggers (push, PR, release)',
        '3. Generate job definitions for all stages',
        '4. Create reusable workflow templates',
        '5. Generate environment configurations',
        '6. Create secret references',
        '7. Generate build scripts',
        '8. Create helper scripts',
        '9. Generate pipeline visualization',
        '10. Validate generated configuration'
      ],
      outputFormat: 'JSON with generated pipeline details'
    },
    outputSchema: {
      type: 'object',
      required: ['mainConfigPath', 'stages', 'triggers', 'artifacts'],
      properties: {
        mainConfigPath: { type: 'string' },
        stages: { type: 'array', items: { type: 'object' } },
        triggers: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['desktop-development', 'pipeline-generation']
}));

export const generatePipelineDocumentationTask = defineTask('generate-pipeline-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8a: Generate Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'DevOps Documentation Writer',
      task: 'Generate pipeline documentation',
      context: args,
      instructions: [
        '1. Create pipeline overview documentation',
        '2. Document workflow triggers and conditions',
        '3. Document build matrix and configurations',
        '4. Create troubleshooting guide',
        '5. Document environment variables and secrets',
        '6. Create artifact documentation',
        '7. Document caching strategy',
        '8. Create maintenance guide',
        '9. Document monitoring and notifications',
        '10. Generate quick reference guide'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        troubleshootingPath: { type: 'string' },
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

export const validatePipelineTask = defineTask('validate-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8b: Validate Pipeline - ${args.projectName}`,
  agent: {
    name: 'pipeline-validator',
    prompt: {
      role: 'CI/CD Pipeline Validator',
      task: 'Validate pipeline configuration and completeness',
      context: args,
      instructions: [
        '1. Validate pipeline syntax',
        '2. Check job dependencies and ordering',
        '3. Verify artifact handling',
        '4. Validate caching configuration',
        '5. Check secret references',
        '6. Verify platform coverage',
        '7. Validate test coverage',
        '8. Check for common issues',
        '9. Calculate validation score',
        '10. Generate recommendations'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'checks', 'nextSteps', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        checks: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
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
