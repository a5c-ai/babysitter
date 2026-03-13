/**
 * @process specializations/code-migration-modernization/framework-upgrade
 * @description Framework Upgrade Process - Systematic process for upgrading application frameworks
 * to newer versions while minimizing disruption, managing breaking changes, and ensuring stability.
 * @inputs { projectName: string, currentFramework?: object, targetVersion?: string, testSuite?: object }
 * @outputs { success: boolean, upgradePath: object, impactAssessment: object, migratedCode: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/framework-upgrade', {
 *   projectName: 'React App Upgrade',
 *   currentFramework: { name: 'React', version: '16.8' },
 *   targetVersion: '18.2',
 *   testSuite: { path: './tests', coverage: 75 }
 * });
 *
 * @references
 * - React Upgrade Guide: https://react.dev/blog/2022/03/08/react-18-upgrade-guide
 * - Angular Update Guide: https://update.angular.io/
 * - Spring Boot Migration: https://github.com/spring-projects/spring-boot/wiki
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    currentFramework = {},
    targetVersion = '',
    testSuite = {},
    outputDir = 'framework-upgrade-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Framework Upgrade for ${projectName}`);

  // ============================================================================
  // PHASE 1: UPGRADE PATH ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing upgrade path');
  const upgradePathAnalysis = await ctx.task(upgradePathAnalysisTask, {
    projectName,
    currentFramework,
    targetVersion,
    outputDir
  });

  artifacts.push(...upgradePathAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: IMPACT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing impact');
  const impactAssessment = await ctx.task(impactAssessmentTask, {
    projectName,
    currentFramework,
    upgradePathAnalysis,
    outputDir
  });

  artifacts.push(...impactAssessment.artifacts);

  // Breakpoint: Impact review
  await ctx.breakpoint({
    question: `Impact assessment complete for ${projectName}. Breaking changes: ${impactAssessment.breakingChanges.length}. Affected files: ${impactAssessment.affectedFiles}. Proceed with upgrade?`,
    title: 'Framework Upgrade Impact Review',
    context: {
      runId: ctx.runId,
      projectName,
      impactAssessment,
      recommendation: 'Review breaking changes and ensure test coverage before proceeding'
    }
  });

  // ============================================================================
  // PHASE 3: TEST SUITE PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Preparing test suite');
  const testPreparation = await ctx.task(testSuitePreparationTask, {
    projectName,
    testSuite,
    impactAssessment,
    outputDir
  });

  artifacts.push(...testPreparation.artifacts);

  // ============================================================================
  // PHASE 4: DEPENDENCY UPDATES
  // ============================================================================

  ctx.log('info', 'Phase 4: Updating dependencies');
  const dependencyUpdates = await ctx.task(dependencyUpdatesTask, {
    projectName,
    currentFramework,
    upgradePathAnalysis,
    outputDir
  });

  artifacts.push(...dependencyUpdates.artifacts);

  // ============================================================================
  // PHASE 5: CODE MIGRATION (Iterative)
  // ============================================================================

  ctx.log('info', 'Phase 5: Migrating code');
  const codeMigration = await ctx.task(codeMigrationTask, {
    projectName,
    impactAssessment,
    upgradePathAnalysis,
    outputDir
  });

  artifacts.push(...codeMigration.artifacts);

  // ============================================================================
  // PHASE 6: TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Testing and validating');
  const testingValidation = await ctx.task(testingValidationTask, {
    projectName,
    testPreparation,
    codeMigration,
    outputDir
  });

  artifacts.push(...testingValidation.artifacts);

  // Quality Gate: Test results
  if (!testingValidation.allPassed) {
    await ctx.breakpoint({
      question: `Tests failed after upgrade for ${projectName}. Failed: ${testingValidation.failedCount}. Review failures and fix before proceeding?`,
      title: 'Framework Upgrade Test Failures',
      context: {
        runId: ctx.runId,
        projectName,
        failures: testingValidation.failures,
        recommendation: 'Fix failing tests before staging deployment'
      }
    });
  }

  // ============================================================================
  // PHASE 7: STAGING DEPLOYMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Deploying to staging');
  const stagingDeployment = await ctx.task(stagingDeploymentTask, {
    projectName,
    codeMigration,
    testingValidation,
    outputDir
  });

  artifacts.push(...stagingDeployment.artifacts);

  // ============================================================================
  // PHASE 8: PRODUCTION DEPLOYMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Deploying to production');
  const productionDeployment = await ctx.task(productionDeploymentTask, {
    projectName,
    stagingDeployment,
    outputDir
  });

  artifacts.push(...productionDeployment.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Framework upgrade complete for ${projectName}. From ${currentFramework.name} ${currentFramework.version} to ${targetVersion}. All tests passing: ${testingValidation.allPassed}. Approve?`,
    title: 'Framework Upgrade Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        from: `${currentFramework.name} ${currentFramework.version}`,
        to: `${currentFramework.name} ${targetVersion}`,
        codeChanges: codeMigration.filesModified,
        testsPass: testingValidation.allPassed
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    upgradePath: upgradePathAnalysis,
    impactAssessment: {
      breakingChanges: impactAssessment.breakingChanges,
      affectedFiles: impactAssessment.affectedFiles,
      effort: impactAssessment.estimatedEffort
    },
    migratedCode: {
      filesModified: codeMigration.filesModified,
      automatedChanges: codeMigration.automatedChanges,
      manualChanges: codeMigration.manualChanges
    },
    testResults: {
      allPassed: testingValidation.allPassed,
      passed: testingValidation.passedCount,
      failed: testingValidation.failedCount
    },
    deployment: {
      staging: stagingDeployment.success,
      production: productionDeployment.success
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/framework-upgrade',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const upgradePathAnalysisTask = defineTask('upgrade-path-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Upgrade Path Analysis - ${args.projectName}`,
  agent: {
    name: 'framework-upgrade-specialist',
    prompt: {
      role: 'Framework Migration Specialist',
      task: 'Analyze upgrade path between framework versions',
      context: args,
      instructions: [
        '1. Identify current and target versions',
        '2. Review changelogs for breaking changes',
        '3. Determine upgrade path (direct vs incremental)',
        '4. Identify deprecated APIs',
        '5. Document migration guides',
        '6. Identify codemods available',
        '7. Estimate upgrade effort',
        '8. Document prerequisites',
        '9. Identify risk areas',
        '10. Generate upgrade path document'
      ],
      outputFormat: 'JSON with upgradePath, breakingChanges, deprecatedApis, codemods, estimatedEffort, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['upgradePath', 'breakingChanges', 'artifacts'],
      properties: {
        upgradePath: { type: 'array', items: { type: 'string' } },
        breakingChanges: { type: 'array', items: { type: 'object' } },
        deprecatedApis: { type: 'array', items: { type: 'object' } },
        codemods: { type: 'array', items: { type: 'string' } },
        estimatedEffort: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['framework-upgrade', 'analysis', 'planning']
}));

export const impactAssessmentTask = defineTask('impact-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Impact Assessment - ${args.projectName}`,
  agent: {
    name: 'framework-upgrade-specialist',
    prompt: {
      role: 'Code Impact Analyst',
      task: 'Assess impact of framework upgrade on codebase',
      context: args,
      instructions: [
        '1. Identify affected code areas',
        '2. Map deprecated API usage',
        '3. Assess third-party library compatibility',
        '4. Evaluate configuration changes',
        '5. Identify affected components',
        '6. Estimate change scope',
        '7. Identify testing needs',
        '8. Document dependencies',
        '9. Assess risk level',
        '10. Generate impact report'
      ],
      outputFormat: 'JSON with breakingChanges, affectedFiles, affectedComponents, estimatedEffort, riskLevel, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['breakingChanges', 'affectedFiles', 'artifacts'],
      properties: {
        breakingChanges: { type: 'array', items: { type: 'object' } },
        affectedFiles: { type: 'number' },
        affectedComponents: { type: 'array', items: { type: 'string' } },
        estimatedEffort: { type: 'string' },
        riskLevel: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['framework-upgrade', 'impact', 'assessment']
}));

export const testSuitePreparationTask = defineTask('test-suite-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Test Suite Preparation - ${args.projectName}`,
  agent: {
    name: 'regression-detector',
    prompt: {
      role: 'QA Engineer',
      task: 'Prepare test suite for framework upgrade',
      context: args,
      instructions: [
        '1. Ensure comprehensive test coverage',
        '2. Add tests for affected areas',
        '3. Set up continuous integration',
        '4. Prepare regression test suite',
        '5. Update test configurations',
        '6. Add compatibility tests',
        '7. Set up test reporting',
        '8. Prepare rollback tests',
        '9. Document test plan',
        '10. Generate test readiness report'
      ],
      outputFormat: 'JSON with testCount, coverage, newTests, testConfig, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'coverage', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        coverage: { type: 'number' },
        newTests: { type: 'number' },
        testConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['framework-upgrade', 'testing', 'preparation']
}));

export const dependencyUpdatesTask = defineTask('dependency-updates', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Dependency Updates - ${args.projectName}`,
  agent: {
    name: 'dependency-modernization-agent',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Update framework and related dependencies',
      context: args,
      instructions: [
        '1. Update framework version',
        '2. Update related dependencies',
        '3. Resolve version conflicts',
        '4. Test compatibility',
        '5. Update lock files',
        '6. Document changes',
        '7. Run initial build',
        '8. Fix build errors',
        '9. Update configurations',
        '10. Generate dependency report'
      ],
      outputFormat: 'JSON with updatedDependencies, conflicts, resolved, buildSuccess, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['updatedDependencies', 'buildSuccess', 'artifacts'],
      properties: {
        updatedDependencies: { type: 'array', items: { type: 'object' } },
        conflicts: { type: 'array', items: { type: 'object' } },
        resolved: { type: 'boolean' },
        buildSuccess: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['framework-upgrade', 'dependencies', 'updates']
}));

export const codeMigrationTask = defineTask('code-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Code Migration - ${args.projectName}`,
  agent: {
    name: 'code-transformation-executor',
    prompt: {
      role: 'Senior Developer',
      task: 'Migrate code to new framework version',
      context: args,
      instructions: [
        '1. Apply automated migrations (codemods)',
        '2. Update deprecated API usage',
        '3. Modify configurations',
        '4. Fix breaking changes',
        '5. Update imports',
        '6. Modernize patterns',
        '7. Fix type errors',
        '8. Update coding standards',
        '9. Document changes',
        '10. Generate migration report'
      ],
      outputFormat: 'JSON with filesModified, automatedChanges, manualChanges, remainingIssues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'automatedChanges', 'artifacts'],
      properties: {
        filesModified: { type: 'number' },
        automatedChanges: { type: 'number' },
        manualChanges: { type: 'number' },
        remainingIssues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['framework-upgrade', 'migration', 'code']
}));

export const testingValidationTask = defineTask('testing-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Testing and Validation - ${args.projectName}`,
  agent: {
    name: 'regression-detector',
    prompt: {
      role: 'QA Lead',
      task: 'Test and validate upgraded codebase',
      context: args,
      instructions: [
        '1. Run unit tests',
        '2. Execute integration tests',
        '3. Perform manual testing',
        '4. Validate performance',
        '5. Check for regressions',
        '6. Verify functionality',
        '7. Test edge cases',
        '8. Validate configurations',
        '9. Document results',
        '10. Generate test report'
      ],
      outputFormat: 'JSON with allPassed, passedCount, failedCount, failures, performanceImpact, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'passedCount', 'failedCount', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        failures: { type: 'array', items: { type: 'object' } },
        performanceImpact: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['framework-upgrade', 'testing', 'validation']
}));

export const stagingDeploymentTask = defineTask('staging-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Staging Deployment - ${args.projectName}`,
  agent: {
    name: 'cutover-coordinator',
    prompt: {
      role: 'Release Engineer',
      task: 'Deploy upgraded application to staging',
      context: args,
      instructions: [
        '1. Deploy to staging environment',
        '2. Perform full regression testing',
        '3. Test with production-like data',
        '4. Gather feedback',
        '5. Validate integrations',
        '6. Test performance',
        '7. Verify monitoring',
        '8. Document observations',
        '9. Assess readiness',
        '10. Generate staging report'
      ],
      outputFormat: 'JSON with success, testResults, issues, readyForProduction, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'readyForProduction', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testResults: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } },
        readyForProduction: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['framework-upgrade', 'staging', 'deployment']
}));

export const productionDeploymentTask = defineTask('production-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Production Deployment - ${args.projectName}`,
  agent: {
    name: 'cutover-coordinator',
    prompt: {
      role: 'Production Engineer',
      task: 'Deploy upgraded application to production',
      context: args,
      instructions: [
        '1. Plan deployment window',
        '2. Execute deployment',
        '3. Monitor for issues',
        '4. Validate functionality',
        '5. Run smoke tests',
        '6. Verify metrics',
        '7. Monitor error rates',
        '8. Be ready for rollback',
        '9. Document completion',
        '10. Generate deployment report'
      ],
      outputFormat: 'JSON with success, deploymentTime, issues, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'deploymentTime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        deploymentTime: { type: 'string' },
        issues: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['framework-upgrade', 'production', 'deployment']
}));
