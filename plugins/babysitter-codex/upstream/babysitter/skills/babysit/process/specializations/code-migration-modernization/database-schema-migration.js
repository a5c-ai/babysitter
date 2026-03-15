/**
 * @process specializations/code-migration-modernization/database-schema-migration
 * @description Database Schema Migration - Comprehensive process for migrating database schemas between
 * versions or platforms while ensuring data integrity, minimal downtime using expand-contract pattern,
 * and reversibility with proper validation.
 * @inputs { projectName: string, sourceDatabase?: object, targetDatabase?: object, migrationTool?: string, downtimeConstraint?: string }
 * @outputs { success: boolean, schemaAnalysis: object, migrationScripts: array, testResults: object, validationReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/database-schema-migration', {
 *   projectName: 'Order Service DB Migration',
 *   sourceDatabase: { type: 'Oracle', version: '12c', schema: 'orders' },
 *   targetDatabase: { type: 'PostgreSQL', version: '15', schema: 'orders_v2' },
 *   migrationTool: 'flyway',
 *   downtimeConstraint: 'zero-downtime'
 * });
 *
 * @references
 * - Flyway: https://flywaydb.org/
 * - Liquibase: https://www.liquibase.org/
 * - Database Refactoring: https://martinfowler.com/books/refactoringDatabases.html
 * - Expand and Contract Pattern: https://martinfowler.com/bliki/ParallelChange.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sourceDatabase = {},
    targetDatabase = {},
    migrationTool = 'flyway',
    downtimeConstraint = 'minimal',
    outputDir = 'schema-migration-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Database Schema Migration for ${projectName}`);

  // ============================================================================
  // PHASE 1: SCHEMA ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing database schemas');
  const schemaAnalysis = await ctx.task(schemaAnalysisTask, {
    projectName,
    sourceDatabase,
    targetDatabase,
    outputDir
  });

  artifacts.push(...schemaAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: MIGRATION SCRIPT DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing migration scripts');
  const migrationScripts = await ctx.task(migrationScriptDevelopmentTask, {
    projectName,
    schemaAnalysis,
    migrationTool,
    downtimeConstraint,
    outputDir
  });

  artifacts.push(...migrationScripts.artifacts);

  // Breakpoint: Script review
  await ctx.breakpoint({
    question: `Migration scripts developed for ${projectName}. Total scripts: ${migrationScripts.scriptCount}. Pattern: ${migrationScripts.pattern}. Review scripts before testing?`,
    title: 'Migration Script Review',
    context: {
      runId: ctx.runId,
      projectName,
      scripts: migrationScripts,
      files: migrationScripts.artifacts.map(a => ({ path: a.path, format: a.format || 'sql' }))
    }
  });

  // ============================================================================
  // PHASE 3: TEST ENVIRONMENT PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Preparing test environment');
  const testEnvironment = await ctx.task(testEnvironmentPreparationTask, {
    projectName,
    sourceDatabase,
    targetDatabase,
    outputDir
  });

  artifacts.push(...testEnvironment.artifacts);

  // ============================================================================
  // PHASE 4: TEST MIGRATION EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Executing test migration');
  const testMigration = await ctx.task(testMigrationExecutionTask, {
    projectName,
    migrationScripts,
    testEnvironment,
    outputDir
  });

  artifacts.push(...testMigration.artifacts);

  // Quality Gate: Test migration success
  if (!testMigration.success) {
    await ctx.breakpoint({
      question: `Test migration failed for ${projectName}. Errors: ${testMigration.errors.length}. Review errors and fix scripts before proceeding?`,
      title: 'Test Migration Failed',
      context: {
        runId: ctx.runId,
        projectName,
        errors: testMigration.errors,
        recommendation: 'Fix migration scripts and re-run test migration'
      }
    });
  }

  // ============================================================================
  // PHASE 5: DATA VALIDATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Planning data validation');
  const dataValidationPlan = await ctx.task(dataValidationPlanningTask, {
    projectName,
    schemaAnalysis,
    targetDatabase,
    outputDir
  });

  artifacts.push(...dataValidationPlan.artifacts);

  // ============================================================================
  // PHASE 6: PERFORMANCE TESTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Testing performance');
  const performanceTesting = await ctx.task(performanceTestingTask, {
    projectName,
    testEnvironment,
    testMigration,
    outputDir
  });

  artifacts.push(...performanceTesting.artifacts);

  // Quality Gate: Performance regression
  if (performanceTesting.hasRegression) {
    await ctx.breakpoint({
      question: `Performance regression detected in ${projectName}. Degraded queries: ${performanceTesting.degradedQueries.length}. Review and optimize before proceeding?`,
      title: 'Performance Regression Warning',
      context: {
        runId: ctx.runId,
        projectName,
        degradedQueries: performanceTesting.degradedQueries,
        recommendation: 'Add indexes or optimize queries before production migration'
      }
    });
  }

  // ============================================================================
  // PHASE 7: APPLICATION COMPATIBILITY TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Testing application compatibility');
  const compatibilityTesting = await ctx.task(applicationCompatibilityTestingTask, {
    projectName,
    testEnvironment,
    outputDir
  });

  artifacts.push(...compatibilityTesting.artifacts);

  // ============================================================================
  // PHASE 8: STAGING MIGRATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Running staging migration');
  const stagingMigration = await ctx.task(stagingMigrationTask, {
    projectName,
    migrationScripts,
    dataValidationPlan,
    outputDir
  });

  artifacts.push(...stagingMigration.artifacts);

  // ============================================================================
  // PHASE 9: PRODUCTION MIGRATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 9: Planning production migration');
  const productionPlan = await ctx.task(productionMigrationPlanningTask, {
    projectName,
    migrationScripts,
    stagingMigration,
    downtimeConstraint,
    outputDir
  });

  artifacts.push(...productionPlan.artifacts);

  // Final Breakpoint: Production migration approval
  await ctx.breakpoint({
    question: `Production migration plan ready for ${projectName}. Estimated downtime: ${productionPlan.estimatedDowntime}. Rollback plan: ${productionPlan.rollbackReady ? 'Ready' : 'Not Ready'}. Approve for production?`,
    title: 'Production Migration Approval',
    context: {
      runId: ctx.runId,
      projectName,
      productionPlan,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 10: PRODUCTION MIGRATION EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 10: Executing production migration');
  const productionExecution = await ctx.task(productionMigrationExecutionTask, {
    projectName,
    productionPlan,
    dataValidationPlan,
    outputDir
  });

  artifacts.push(...productionExecution.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: productionExecution.success,
    projectName,
    schemaAnalysis: {
      sourceSchema: schemaAnalysis.sourceSchema,
      targetSchema: schemaAnalysis.targetSchema,
      differences: schemaAnalysis.differences,
      complexity: schemaAnalysis.complexity
    },
    migrationScripts: {
      count: migrationScripts.scriptCount,
      pattern: migrationScripts.pattern,
      rollbackScripts: migrationScripts.rollbackScriptCount
    },
    testResults: {
      testMigrationSuccess: testMigration.success,
      performanceRegression: performanceTesting.hasRegression,
      compatibilityPassed: compatibilityTesting.passed
    },
    validationReport: {
      dataIntegrity: productionExecution.dataIntegrityValidated,
      rowCountsMatch: productionExecution.rowCountsMatch,
      checksumValidation: productionExecution.checksumValidation
    },
    productionMigration: {
      success: productionExecution.success,
      actualDowntime: productionExecution.actualDowntime,
      completedAt: productionExecution.completedAt
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/database-schema-migration',
      timestamp: startTime,
      migrationTool,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const schemaAnalysisTask = defineTask('schema-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Schema Analysis - ${args.projectName}`,
  agent: {
    name: 'database-migration-orchestrator',
    prompt: {
      role: 'Database Architect',
      task: 'Analyze source and target database schemas',
      context: args,
      instructions: [
        '1. Document source database schema completely',
        '2. Identify schema differences with target',
        '3. Map data types between platforms',
        '4. Identify constraints and relationships',
        '5. Document stored procedures and functions',
        '6. Identify triggers and views',
        '7. Map indexes and keys',
        '8. Assess migration complexity',
        '9. Identify potential issues',
        '10. Generate schema comparison report'
      ],
      outputFormat: 'JSON with sourceSchema, targetSchema, differences, complexity, dataTypeMappings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sourceSchema', 'differences', 'complexity', 'artifacts'],
      properties: {
        sourceSchema: { type: 'object' },
        targetSchema: { type: 'object' },
        differences: { type: 'array', items: { type: 'object' } },
        complexity: { type: 'string', enum: ['low', 'medium', 'high', 'very-high'] },
        dataTypeMappings: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schema-migration', 'analysis', 'database']
}));

export const migrationScriptDevelopmentTask = defineTask('migration-script-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Migration Script Development - ${args.projectName}`,
  agent: {
    name: 'database-migration-orchestrator',
    prompt: {
      role: 'Database Migration Developer',
      task: 'Develop migration scripts using expand-contract pattern',
      context: args,
      instructions: [
        '1. Write migration scripts (Flyway/Liquibase format)',
        '2. Use expand-contract pattern for zero downtime',
        '3. Include rollback scripts for each migration',
        '4. Version all scripts properly',
        '5. Handle data type conversions',
        '6. Migrate constraints safely',
        '7. Handle indexes and keys',
        '8. Migrate stored procedures',
        '9. Include validation queries',
        '10. Document script execution order'
      ],
      outputFormat: 'JSON with scriptCount, rollbackScriptCount, pattern, scripts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scriptCount', 'pattern', 'artifacts'],
      properties: {
        scriptCount: { type: 'number' },
        rollbackScriptCount: { type: 'number' },
        pattern: { type: 'string' },
        scripts: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schema-migration', 'scripts', 'development']
}));

export const testEnvironmentPreparationTask = defineTask('test-environment-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Test Environment Preparation - ${args.projectName}`,
  agent: {
    name: 'database-migration-orchestrator',
    prompt: {
      role: 'Database Engineer',
      task: 'Prepare test environment for migration testing',
      context: args,
      instructions: [
        '1. Clone production database to test',
        '2. Set up target database instance',
        '3. Anonymize data if needed',
        '4. Configure connection settings',
        '5. Set up monitoring',
        '6. Prepare comparison tools',
        '7. Document environment setup',
        '8. Verify environment health',
        '9. Set up backup procedures',
        '10. Generate environment report'
      ],
      outputFormat: 'JSON with sourceEnv, targetEnv, dataAnonymized, ready, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ready', 'artifacts'],
      properties: {
        sourceEnv: { type: 'object' },
        targetEnv: { type: 'object' },
        dataAnonymized: { type: 'boolean' },
        ready: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schema-migration', 'environment', 'testing']
}));

export const testMigrationExecutionTask = defineTask('test-migration-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Test Migration Execution - ${args.projectName}`,
  agent: {
    name: 'database-migration-orchestrator',
    prompt: {
      role: 'Database Migration Engineer',
      task: 'Execute migration in test environment',
      context: args,
      instructions: [
        '1. Run migrations in test environment',
        '2. Validate schema changes',
        '3. Check data integrity',
        '4. Measure execution time',
        '5. Identify any errors',
        '6. Test rollback scripts',
        '7. Validate constraints',
        '8. Check data completeness',
        '9. Document results',
        '10. Generate test report'
      ],
      outputFormat: 'JSON with success, executionTime, errors, rollbackTested, dataIntegrity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'executionTime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        executionTime: { type: 'string' },
        errors: { type: 'array', items: { type: 'object' } },
        rollbackTested: { type: 'boolean' },
        dataIntegrity: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schema-migration', 'testing', 'execution']
}));

export const dataValidationPlanningTask = defineTask('data-validation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Data Validation Planning - ${args.projectName}`,
  agent: {
    name: 'data-integrity-validator',
    prompt: {
      role: 'Data Quality Analyst',
      task: 'Plan data validation strategy',
      context: args,
      instructions: [
        '1. Define validation queries',
        '2. Set up row count comparisons',
        '3. Create checksum validation scripts',
        '4. Plan sample data verification',
        '5. Define business rule validations',
        '6. Plan referential integrity checks',
        '7. Set validation thresholds',
        '8. Plan automated validation',
        '9. Define acceptance criteria',
        '10. Create validation plan document'
      ],
      outputFormat: 'JSON with validationQueries, rowCountChecks, checksumScripts, acceptanceCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validationQueries', 'acceptanceCriteria', 'artifacts'],
      properties: {
        validationQueries: { type: 'array', items: { type: 'object' } },
        rowCountChecks: { type: 'array', items: { type: 'object' } },
        checksumScripts: { type: 'array', items: { type: 'string' } },
        acceptanceCriteria: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schema-migration', 'validation', 'planning']
}));

export const performanceTestingTask = defineTask('performance-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Performance Testing - ${args.projectName}`,
  agent: {
    name: 'data-integrity-validator',
    prompt: {
      role: 'Database Performance Engineer',
      task: 'Test query performance against new schema',
      context: args,
      instructions: [
        '1. Run queries against new schema',
        '2. Compare to baseline performance',
        '3. Identify slow queries',
        '4. Analyze query plans',
        '5. Check index usage',
        '6. Measure throughput',
        '7. Test under load',
        '8. Identify regressions',
        '9. Suggest optimizations',
        '10. Generate performance report'
      ],
      outputFormat: 'JSON with hasRegression, degradedQueries, improvements, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hasRegression', 'artifacts'],
      properties: {
        hasRegression: { type: 'boolean' },
        degradedQueries: { type: 'array', items: { type: 'object' } },
        improvements: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schema-migration', 'performance', 'testing']
}));

export const applicationCompatibilityTestingTask = defineTask('application-compatibility-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Application Compatibility Testing - ${args.projectName}`,
  agent: {
    name: 'data-integrity-validator',
    prompt: {
      role: 'Application Tester',
      task: 'Test application compatibility with new schema',
      context: args,
      instructions: [
        '1. Test application with new schema',
        '2. Verify all queries work',
        '3. Check ORM compatibility',
        '4. Validate transactions',
        '5. Test error handling',
        '6. Check connection pooling',
        '7. Test batch operations',
        '8. Validate reports',
        '9. Check integrations',
        '10. Generate compatibility report'
      ],
      outputFormat: 'JSON with passed, issues, ormCompatible, transactionsValid, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'object' } },
        ormCompatible: { type: 'boolean' },
        transactionsValid: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schema-migration', 'compatibility', 'application']
}));

export const stagingMigrationTask = defineTask('staging-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Staging Migration - ${args.projectName}`,
  agent: {
    name: 'database-migration-orchestrator',
    prompt: {
      role: 'Release Engineer',
      task: 'Run full migration in staging environment',
      context: args,
      instructions: [
        '1. Run full migration in staging',
        '2. Validate with production-like data',
        '3. Run integration tests',
        '4. Measure actual downtime',
        '5. Execute validation queries',
        '6. Test user scenarios',
        '7. Validate data integrity',
        '8. Test rollback procedure',
        '9. Document observations',
        '10. Generate staging report'
      ],
      outputFormat: 'JSON with success, actualDowntime, dataIntegrity, rollbackTested, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'actualDowntime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        actualDowntime: { type: 'string' },
        dataIntegrity: { type: 'boolean' },
        rollbackTested: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schema-migration', 'staging', 'validation']
}));

export const productionMigrationPlanningTask = defineTask('production-migration-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Production Migration Planning - ${args.projectName}`,
  agent: {
    name: 'cutover-coordinator',
    prompt: {
      role: 'Production Release Manager',
      task: 'Plan production migration execution',
      context: args,
      instructions: [
        '1. Schedule maintenance window',
        '2. Prepare rollback procedures',
        '3. Set up monitoring',
        '4. Brief support team',
        '5. Prepare communication plan',
        '6. Define go/no-go criteria',
        '7. Create execution checklist',
        '8. Plan verification steps',
        '9. Document escalation procedures',
        '10. Generate production plan'
      ],
      outputFormat: 'JSON with estimatedDowntime, maintenanceWindow, rollbackReady, checklist, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedDowntime', 'rollbackReady', 'artifacts'],
      properties: {
        estimatedDowntime: { type: 'string' },
        maintenanceWindow: { type: 'object' },
        rollbackReady: { type: 'boolean' },
        checklist: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schema-migration', 'production', 'planning']
}));

export const productionMigrationExecutionTask = defineTask('production-migration-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Production Migration Execution - ${args.projectName}`,
  agent: {
    name: 'database-migration-orchestrator',
    prompt: {
      role: 'Database Administrator',
      task: 'Execute production database migration',
      context: args,
      instructions: [
        '1. Execute migration scripts',
        '2. Monitor for errors',
        '3. Run validation queries',
        '4. Verify application functionality',
        '5. Check data integrity',
        '6. Validate row counts',
        '7. Run checksum validation',
        '8. Monitor performance',
        '9. Document completion',
        '10. Generate completion report'
      ],
      outputFormat: 'JSON with success, actualDowntime, dataIntegrityValidated, rowCountsMatch, checksumValidation, completedAt, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'actualDowntime', 'completedAt', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        actualDowntime: { type: 'string' },
        dataIntegrityValidated: { type: 'boolean' },
        rowCountsMatch: { type: 'boolean' },
        checksumValidation: { type: 'boolean' },
        completedAt: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['schema-migration', 'production', 'execution']
}));
