/**
 * @process specializations/code-migration-modernization/language-version-migration
 * @description Language Version Migration - Process for migrating codebases to newer programming
 * language versions (e.g., Python 2 to 3, Java 8 to 17) while maintaining functionality and
 * leveraging new language features.
 * @inputs { projectName: string, currentLanguage?: object, targetVersion?: string, migrationTools?: array }
 * @outputs { success: boolean, versionAnalysis: object, compatibilityReport: object, migratedCode: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/language-version-migration', {
 *   projectName: 'Python 2 to 3 Migration',
 *   currentLanguage: { name: 'Python', version: '2.7' },
 *   targetVersion: '3.11',
 *   migrationTools: ['2to3', 'python-modernize']
 * });
 *
 * @references
 * - Python 3 Porting Guide: https://docs.python.org/3/howto/pyporting.html
 * - Java Migration Guide: https://docs.oracle.com/en/java/javase/17/migrate/
 * - TypeScript Migration: https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    currentLanguage = {},
    targetVersion = '',
    migrationTools = [],
    outputDir = 'language-migration-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Language Version Migration for ${projectName}`);

  // ============================================================================
  // PHASE 1: VERSION GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing version gap');
  const versionGapAnalysis = await ctx.task(versionGapAnalysisTask, {
    projectName,
    currentLanguage,
    targetVersion,
    outputDir
  });

  artifacts.push(...versionGapAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: CODEBASE COMPATIBILITY SCAN
  // ============================================================================

  ctx.log('info', 'Phase 2: Scanning codebase compatibility');
  const compatibilityScan = await ctx.task(codebaseCompatibilityScanTask, {
    projectName,
    currentLanguage,
    targetVersion,
    versionGapAnalysis,
    outputDir
  });

  artifacts.push(...compatibilityScan.artifacts);

  // Breakpoint: Compatibility review
  await ctx.breakpoint({
    question: `Compatibility scan complete for ${projectName}. Issues found: ${compatibilityScan.issueCount}. Estimated migration effort: ${compatibilityScan.estimatedEffort}. Proceed with migration?`,
    title: 'Language Compatibility Review',
    context: {
      runId: ctx.runId,
      projectName,
      compatibilityScan,
      recommendation: 'Review compatibility issues before proceeding'
    }
  });

  // ============================================================================
  // PHASE 3: MIGRATION TOOL SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up migration tools');
  const toolSetup = await ctx.task(migrationToolSetupTask, {
    projectName,
    currentLanguage,
    targetVersion,
    migrationTools,
    outputDir
  });

  artifacts.push(...toolSetup.artifacts);

  // ============================================================================
  // PHASE 4: AUTOMATED MIGRATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Running automated migration');
  const automatedMigration = await ctx.task(automatedMigrationTask, {
    projectName,
    toolSetup,
    compatibilityScan,
    outputDir
  });

  artifacts.push(...automatedMigration.artifacts);

  // ============================================================================
  // PHASE 5: MANUAL FIXES
  // ============================================================================

  ctx.log('info', 'Phase 5: Applying manual fixes');
  const manualFixes = await ctx.task(manualFixesTask, {
    projectName,
    automatedMigration,
    compatibilityScan,
    versionGapAnalysis,
    outputDir
  });

  artifacts.push(...manualFixes.artifacts);

  // ============================================================================
  // PHASE 6: TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Testing and validating');
  const testingValidation = await ctx.task(languageTestingValidationTask, {
    projectName,
    targetVersion,
    manualFixes,
    outputDir
  });

  artifacts.push(...testingValidation.artifacts);

  // Quality Gate: Test results
  if (!testingValidation.allPassed) {
    await ctx.breakpoint({
      question: `Tests failed after migration for ${projectName}. Failed: ${testingValidation.failedCount}. Review and fix failures?`,
      title: 'Language Migration Test Failures',
      context: {
        runId: ctx.runId,
        projectName,
        failures: testingValidation.failures,
        recommendation: 'Fix failing tests before proceeding'
      }
    });
  }

  // ============================================================================
  // PHASE 7: RUNTIME ENVIRONMENT UPDATE
  // ============================================================================

  ctx.log('info', 'Phase 7: Updating runtime environment');
  const environmentUpdate = await ctx.task(runtimeEnvironmentUpdateTask, {
    projectName,
    targetVersion,
    testingValidation,
    outputDir
  });

  artifacts.push(...environmentUpdate.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Language version migration complete for ${projectName}. From ${currentLanguage.name} ${currentLanguage.version} to ${targetVersion}. Tests passing: ${testingValidation.allPassed}. Approve?`,
    title: 'Language Migration Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        from: `${currentLanguage.name} ${currentLanguage.version}`,
        to: `${currentLanguage.name} ${targetVersion}`,
        automatedChanges: automatedMigration.changesApplied,
        manualChanges: manualFixes.fixesApplied,
        testsPass: testingValidation.allPassed
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    versionAnalysis: versionGapAnalysis,
    compatibilityReport: {
      issueCount: compatibilityScan.issueCount,
      byCategory: compatibilityScan.byCategory,
      estimatedEffort: compatibilityScan.estimatedEffort
    },
    migratedCode: {
      automatedChanges: automatedMigration.changesApplied,
      manualFixes: manualFixes.fixesApplied,
      remainingIssues: manualFixes.remainingIssues
    },
    testResults: {
      allPassed: testingValidation.allPassed,
      passed: testingValidation.passedCount,
      failed: testingValidation.failedCount
    },
    environmentUpdate: environmentUpdate,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/language-version-migration',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const versionGapAnalysisTask = defineTask('version-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Version Gap Analysis - ${args.projectName}`,
  agent: {
    name: 'framework-upgrade-specialist',
    prompt: {
      role: 'Language Migration Specialist',
      task: 'Analyze gap between language versions',
      context: args,
      instructions: [
        '1. Document current language version',
        '2. Identify target version features',
        '3. Map breaking changes',
        '4. Identify deprecated features',
        '5. Document syntax changes',
        '6. Identify removed features',
        '7. Document new features to adopt',
        '8. Assess migration tools available',
        '9. Estimate migration complexity',
        '10. Generate gap analysis report'
      ],
      outputFormat: 'JSON with breakingChanges, deprecatedFeatures, newFeatures, syntaxChanges, complexity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['breakingChanges', 'deprecatedFeatures', 'artifacts'],
      properties: {
        breakingChanges: { type: 'array', items: { type: 'object' } },
        deprecatedFeatures: { type: 'array', items: { type: 'object' } },
        newFeatures: { type: 'array', items: { type: 'object' } },
        syntaxChanges: { type: 'array', items: { type: 'object' } },
        complexity: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['language-migration', 'analysis', 'gap']
}));

export const codebaseCompatibilityScanTask = defineTask('codebase-compatibility-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Codebase Compatibility Scan - ${args.projectName}`,
  agent: {
    name: 'framework-upgrade-specialist',
    prompt: {
      role: 'Code Analyst',
      task: 'Scan codebase for compatibility issues',
      context: args,
      instructions: [
        '1. Run compatibility checkers',
        '2. Identify deprecated feature usage',
        '3. Map syntax changes needed',
        '4. Identify library compatibility',
        '5. Count affected files',
        '6. Categorize issues by type',
        '7. Prioritize by severity',
        '8. Estimate migration effort',
        '9. Identify automation opportunities',
        '10. Generate compatibility report'
      ],
      outputFormat: 'JSON with issueCount, byCategory, affectedFiles, estimatedEffort, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['issueCount', 'byCategory', 'estimatedEffort', 'artifacts'],
      properties: {
        issueCount: { type: 'number' },
        byCategory: { type: 'object' },
        affectedFiles: { type: 'number' },
        estimatedEffort: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['language-migration', 'compatibility', 'scan']
}));

export const migrationToolSetupTask = defineTask('migration-tool-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Migration Tool Setup - ${args.projectName}`,
  agent: {
    name: 'code-transformation-executor',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Set up language migration tools',
      context: args,
      instructions: [
        '1. Configure migration tools',
        '2. Test on sample code',
        '3. Customize migration rules',
        '4. Set up backup procedures',
        '5. Configure logging',
        '6. Set up dry-run mode',
        '7. Prepare rollback scripts',
        '8. Test tool chain',
        '9. Document tool usage',
        '10. Generate tool setup report'
      ],
      outputFormat: 'JSON with toolsConfigured, customRules, testResults, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['toolsConfigured', 'testResults', 'artifacts'],
      properties: {
        toolsConfigured: { type: 'array', items: { type: 'string' } },
        customRules: { type: 'array', items: { type: 'object' } },
        testResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['language-migration', 'tools', 'setup']
}));

export const automatedMigrationTask = defineTask('automated-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Automated Migration - ${args.projectName}`,
  agent: {
    name: 'code-transformation-executor',
    prompt: {
      role: 'Migration Engineer',
      task: 'Run automated migration tools',
      context: args,
      instructions: [
        '1. Run migration tools',
        '2. Review automated changes',
        '3. Track changed files',
        '4. Log transformation details',
        '5. Handle errors gracefully',
        '6. Create migration log',
        '7. Identify manual fixes needed',
        '8. Verify syntax validity',
        '9. Generate diff reports',
        '10. Document automated changes'
      ],
      outputFormat: 'JSON with changesApplied, filesModified, errors, manualFixesNeeded, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['changesApplied', 'filesModified', 'artifacts'],
      properties: {
        changesApplied: { type: 'number' },
        filesModified: { type: 'number' },
        errors: { type: 'array', items: { type: 'object' } },
        manualFixesNeeded: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['language-migration', 'automated', 'transformation']
}));

export const manualFixesTask = defineTask('manual-fixes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Manual Fixes - ${args.projectName}`,
  agent: {
    name: 'code-transformation-executor',
    prompt: {
      role: 'Senior Developer',
      task: 'Apply manual fixes for migration issues',
      context: args,
      instructions: [
        '1. Address issues tools cannot fix',
        '2. Update deprecated patterns',
        '3. Modernize to use new features',
        '4. Apply code style updates',
        '5. Fix edge cases',
        '6. Update type hints/annotations',
        '7. Fix import statements',
        '8. Update exception handling',
        '9. Document changes',
        '10. Track remaining issues'
      ],
      outputFormat: 'JSON with fixesApplied, filesModified, remainingIssues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['fixesApplied', 'filesModified', 'artifacts'],
      properties: {
        fixesApplied: { type: 'number' },
        filesModified: { type: 'number' },
        remainingIssues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['language-migration', 'manual', 'fixes']
}));

export const languageTestingValidationTask = defineTask('language-testing-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Testing and Validation - ${args.projectName}`,
  agent: {
    name: 'regression-detector',
    prompt: {
      role: 'QA Engineer',
      task: 'Test migrated code with new language version',
      context: args,
      instructions: [
        '1. Run test suite with new version',
        '2. Fix failing tests',
        '3. Validate functionality',
        '4. Test performance',
        '5. Check memory usage',
        '6. Validate all features',
        '7. Run integration tests',
        '8. Test edge cases',
        '9. Document results',
        '10. Generate test report'
      ],
      outputFormat: 'JSON with allPassed, passedCount, failedCount, failures, performanceMetrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'passedCount', 'failedCount', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        failures: { type: 'array', items: { type: 'object' } },
        performanceMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['language-migration', 'testing', 'validation']
}));

export const runtimeEnvironmentUpdateTask = defineTask('runtime-environment-update', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Runtime Environment Update - ${args.projectName}`,
  agent: {
    name: 'framework-upgrade-specialist',
    prompt: {
      role: 'Platform Engineer',
      task: 'Update runtime environments for new language version',
      context: args,
      instructions: [
        '1. Update development environments',
        '2. Update CI/CD pipelines',
        '3. Update Docker images',
        '4. Update production runtime',
        '5. Update dependency specifications',
        '6. Update linter configurations',
        '7. Update documentation',
        '8. Configure IDE settings',
        '9. Test all environments',
        '10. Generate environment report'
      ],
      outputFormat: 'JSON with environmentsUpdated, pipelinesUpdated, dockerUpdated, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['environmentsUpdated', 'pipelinesUpdated', 'artifacts'],
      properties: {
        environmentsUpdated: { type: 'array', items: { type: 'string' } },
        pipelinesUpdated: { type: 'boolean' },
        dockerUpdated: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['language-migration', 'environment', 'runtime']
}));
