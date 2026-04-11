/**
 * @process specializations/code-migration-modernization/build-system-modernization
 * @description Build System Modernization - Process for modernizing build systems from legacy tools
 * to modern build tools (e.g., Ant to Gradle, Make to Bazel), improving build performance, and
 * implementing CI/CD best practices.
 * @inputs { projectName: string, currentBuildSystem?: object, targetBuildSystem?: string, cicdRequirements?: object }
 * @outputs { success: boolean, buildAnalysis: object, modernizedBuild: object, cicdIntegration: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/build-system-modernization', {
 *   projectName: 'Build Modernization',
 *   currentBuildSystem: { tool: 'Maven', version: '3.6' },
 *   targetBuildSystem: 'Gradle',
 *   cicdRequirements: { platform: 'GitHub Actions', parallelization: true }
 * });
 *
 * @references
 * - Gradle Migration Guide: https://docs.gradle.org/current/userguide/migrating_from_maven.html
 * - Bazel Migration: https://bazel.build/migrate/maven
 * - Modern Build Tools: https://www.thoughtworks.com/radar/tools
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    currentBuildSystem = {},
    targetBuildSystem = 'Gradle',
    cicdRequirements = {},
    outputDir = 'build-modernization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Build System Modernization for ${projectName}`);

  // ============================================================================
  // PHASE 1: BUILD SYSTEM ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing current build system');
  const buildAnalysis = await ctx.task(buildSystemAnalysisTask, {
    projectName,
    currentBuildSystem,
    outputDir
  });

  artifacts.push(...buildAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: TARGET BUILD DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing target build system');
  const targetDesign = await ctx.task(targetBuildDesignTask, {
    projectName,
    buildAnalysis,
    targetBuildSystem,
    cicdRequirements,
    outputDir
  });

  artifacts.push(...targetDesign.artifacts);

  // Breakpoint: Build design review
  await ctx.breakpoint({
    question: `Target build design complete for ${projectName}. Tool: ${targetBuildSystem}. Expected build time improvement: ${targetDesign.expectedImprovement}. Approve design?`,
    title: 'Build System Design Review',
    context: {
      runId: ctx.runId,
      projectName,
      targetDesign,
      recommendation: 'Review build structure and dependencies'
    }
  });

  // ============================================================================
  // PHASE 3: BUILD SCRIPT MIGRATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Migrating build scripts');
  const buildMigration = await ctx.task(buildScriptMigrationTask, {
    projectName,
    buildAnalysis,
    targetDesign,
    targetBuildSystem,
    outputDir
  });

  artifacts.push(...buildMigration.artifacts);

  // ============================================================================
  // PHASE 4: DEPENDENCY MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Updating dependency management');
  const dependencyManagement = await ctx.task(dependencyManagementTask, {
    projectName,
    buildAnalysis,
    buildMigration,
    targetBuildSystem,
    outputDir
  });

  artifacts.push(...dependencyManagement.artifacts);

  // ============================================================================
  // PHASE 5: BUILD VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Validating build');
  const buildValidation = await ctx.task(buildValidationTask, {
    projectName,
    buildMigration,
    dependencyManagement,
    outputDir
  });

  artifacts.push(...buildValidation.artifacts);

  // Quality Gate: Build success
  if (!buildValidation.buildSuccess) {
    await ctx.breakpoint({
      question: `Build validation failed for ${projectName}. Errors: ${buildValidation.errors.length}. Review and fix build issues?`,
      title: 'Build Validation Failed',
      context: {
        runId: ctx.runId,
        projectName,
        errors: buildValidation.errors,
        recommendation: 'Fix build errors before CI/CD setup'
      }
    });
  }

  // ============================================================================
  // PHASE 6: CI/CD INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up CI/CD integration');
  const cicdIntegration = await ctx.task(cicdIntegrationTask, {
    projectName,
    buildMigration,
    cicdRequirements,
    outputDir
  });

  artifacts.push(...cicdIntegration.artifacts);

  // ============================================================================
  // PHASE 7: PERFORMANCE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Optimizing build performance');
  const performanceOptimization = await ctx.task(buildPerformanceOptimizationTask, {
    projectName,
    buildMigration,
    buildValidation,
    outputDir
  });

  artifacts.push(...performanceOptimization.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Build system modernization complete for ${projectName}. Build time: ${performanceOptimization.currentBuildTime} (was ${buildAnalysis.buildTime}). CI/CD ready: ${cicdIntegration.ready}. Approve?`,
    title: 'Build Modernization Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        from: currentBuildSystem.tool,
        to: targetBuildSystem,
        buildTimeImprovement: performanceOptimization.improvement,
        cicdReady: cicdIntegration.ready
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    buildAnalysis: {
      currentTool: buildAnalysis.tool,
      buildTime: buildAnalysis.buildTime,
      moduleCount: buildAnalysis.moduleCount
    },
    modernizedBuild: {
      tool: targetBuildSystem,
      buildTime: performanceOptimization.currentBuildTime,
      improvement: performanceOptimization.improvement
    },
    cicdIntegration: {
      platform: cicdIntegration.platform,
      ready: cicdIntegration.ready,
      pipelineConfig: cicdIntegration.pipelineConfig
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/build-system-modernization',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const buildSystemAnalysisTask = defineTask('build-system-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Build System Analysis - ${args.projectName}`,
  agent: {
    name: 'build-pipeline-modernizer',
    prompt: {
      role: 'Build Engineer',
      task: 'Analyze current build system',
      context: args,
      instructions: [
        '1. Identify build tool and version',
        '2. Analyze build configuration',
        '3. Map dependencies',
        '4. Measure build time',
        '5. Identify plugins used',
        '6. Document custom tasks',
        '7. Analyze module structure',
        '8. Identify pain points',
        '9. Document build artifacts',
        '10. Generate analysis report'
      ],
      outputFormat: 'JSON with tool, buildTime, moduleCount, dependencies, plugins, painPoints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tool', 'buildTime', 'moduleCount', 'artifacts'],
      properties: {
        tool: { type: 'string' },
        buildTime: { type: 'string' },
        moduleCount: { type: 'number' },
        dependencies: { type: 'array', items: { type: 'object' } },
        plugins: { type: 'array', items: { type: 'string' } },
        painPoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['build-modernization', 'analysis', 'current-state']
}));

export const targetBuildDesignTask = defineTask('target-build-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Target Build Design - ${args.projectName}`,
  agent: {
    name: 'build-pipeline-modernizer',
    prompt: {
      role: 'Build Architect',
      task: 'Design target build system',
      context: args,
      instructions: [
        '1. Design module structure',
        '2. Plan dependency management',
        '3. Design build caching strategy',
        '4. Plan parallelization',
        '5. Design artifact publishing',
        '6. Plan plugin migration',
        '7. Design test integration',
        '8. Plan incremental builds',
        '9. Estimate improvement',
        '10. Generate design document'
      ],
      outputFormat: 'JSON with structure, cachingStrategy, parallelization, expectedImprovement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'expectedImprovement', 'artifacts'],
      properties: {
        structure: { type: 'object' },
        cachingStrategy: { type: 'string' },
        parallelization: { type: 'boolean' },
        expectedImprovement: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['build-modernization', 'design', 'architecture']
}));

export const buildScriptMigrationTask = defineTask('build-script-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Build Script Migration - ${args.projectName}`,
  agent: {
    name: 'build-pipeline-modernizer',
    prompt: {
      role: 'Build Developer',
      task: 'Migrate build scripts',
      context: args,
      instructions: [
        '1. Create new build files',
        '2. Migrate configurations',
        '3. Convert custom tasks',
        '4. Migrate plugins',
        '5. Update scripts',
        '6. Configure outputs',
        '7. Set up test tasks',
        '8. Configure packaging',
        '9. Test migration',
        '10. Document changes'
      ],
      outputFormat: 'JSON with migratedModules, customTasks, plugins, buildFiles, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['migratedModules', 'buildFiles', 'artifacts'],
      properties: {
        migratedModules: { type: 'number' },
        customTasks: { type: 'array', items: { type: 'object' } },
        plugins: { type: 'array', items: { type: 'string' } },
        buildFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['build-modernization', 'migration', 'scripts']
}));

export const dependencyManagementTask = defineTask('dependency-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Dependency Management - ${args.projectName}`,
  agent: {
    name: 'dependency-modernization-agent',
    prompt: {
      role: 'Dependency Engineer',
      task: 'Update dependency management',
      context: args,
      instructions: [
        '1. Configure dependency resolution',
        '2. Set up version catalogs',
        '3. Configure repositories',
        '4. Handle transitive dependencies',
        '5. Set up dependency locking',
        '6. Configure exclusions',
        '7. Set up BOM imports',
        '8. Validate all dependencies',
        '9. Optimize resolution',
        '10. Document configuration'
      ],
      outputFormat: 'JSON with configuredDependencies, versionCatalog, repositories, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuredDependencies', 'repositories', 'artifacts'],
      properties: {
        configuredDependencies: { type: 'number' },
        versionCatalog: { type: 'boolean' },
        repositories: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['build-modernization', 'dependencies', 'management']
}));

export const buildValidationTask = defineTask('build-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Build Validation - ${args.projectName}`,
  agent: {
    name: 'regression-detector',
    prompt: {
      role: 'Build Engineer',
      task: 'Validate modernized build',
      context: args,
      instructions: [
        '1. Run full build',
        '2. Verify all modules compile',
        '3. Run tests',
        '4. Verify artifacts',
        '5. Check packaging',
        '6. Validate dependencies',
        '7. Test clean builds',
        '8. Verify incremental builds',
        '9. Document results',
        '10. Generate validation report'
      ],
      outputFormat: 'JSON with buildSuccess, testsPass, artifactsValid, errors, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['buildSuccess', 'testsPass', 'artifacts'],
      properties: {
        buildSuccess: { type: 'boolean' },
        testsPass: { type: 'boolean' },
        artifactsValid: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['build-modernization', 'validation', 'testing']
}));

export const cicdIntegrationTask = defineTask('cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: CI/CD Integration - ${args.projectName}`,
  agent: {
    name: 'build-pipeline-modernizer',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Set up CI/CD integration',
      context: args,
      instructions: [
        '1. Create pipeline configuration',
        '2. Configure build caching',
        '3. Set up parallelization',
        '4. Configure test reporting',
        '5. Set up artifact publishing',
        '6. Configure notifications',
        '7. Set up quality gates',
        '8. Configure environments',
        '9. Test pipeline',
        '10. Document CI/CD setup'
      ],
      outputFormat: 'JSON with platform, ready, pipelineConfig, caching, parallelization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['platform', 'ready', 'pipelineConfig', 'artifacts'],
      properties: {
        platform: { type: 'string' },
        ready: { type: 'boolean' },
        pipelineConfig: { type: 'object' },
        caching: { type: 'boolean' },
        parallelization: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['build-modernization', 'cicd', 'automation']
}));

export const buildPerformanceOptimizationTask = defineTask('build-performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Build Performance Optimization - ${args.projectName}`,
  agent: {
    name: 'build-pipeline-modernizer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Optimize build performance',
      context: args,
      instructions: [
        '1. Enable build caching',
        '2. Configure parallel execution',
        '3. Optimize dependency resolution',
        '4. Enable incremental compilation',
        '5. Configure daemon mode',
        '6. Optimize test execution',
        '7. Measure build time',
        '8. Compare with baseline',
        '9. Calculate improvement',
        '10. Document optimizations'
      ],
      outputFormat: 'JSON with currentBuildTime, improvement, optimizationsApplied, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['currentBuildTime', 'improvement', 'artifacts'],
      properties: {
        currentBuildTime: { type: 'string' },
        improvement: { type: 'string' },
        optimizationsApplied: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['build-modernization', 'performance', 'optimization']
}));
