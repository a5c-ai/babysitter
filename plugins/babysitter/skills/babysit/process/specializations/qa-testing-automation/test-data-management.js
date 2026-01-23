/**
 * @process qa-testing-automation/test-data-management
 * @description Test Data Management System - Comprehensive solution for test data generation, storage, versioning,
 * synthetic data creation, privacy/masking, environment-specific management, and cleanup with proper governance
 * @category Test Data Management
 * @priority High
 * @complexity High
 * @inputs { projectName: string, environments: array, dataSources: object, privacyRequirements: object, testTypes: array, dataVolume: string }
 * @outputs { success: boolean, dataStrategy: object, dataGenerators: object, dataRepositories: object, privacyCompliance: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('qa-testing-automation/test-data-management', {
 *   projectName: 'E-Commerce Platform',
 *   environments: ['dev', 'test', 'staging', 'prod-mirror'],
 *   dataSources: {
 *     databases: ['PostgreSQL', 'MongoDB'],
 *     apis: ['payment-api', 'inventory-api'],
 *     files: ['csv', 'json', 'xml']
 *   },
 *   privacyRequirements: {
 *     gdpr: true,
 *     pii: ['email', 'phone', 'address', 'ssn'],
 *     dataRetention: '90 days'
 *   },
 *   testTypes: ['unit', 'integration', 'e2e', 'performance', 'security'],
 *   dataVolume: 'medium'
 * });
 *
 * @references
 * - Test Data Management: https://www.ministryoftesting.com/articles/test-data-management
 * - Synthetic Data Generation: https://sdv.dev/
 * - Data Masking: https://www.redgate.com/products/dba/data-masker
 * - Faker Libraries: https://fakerjs.dev/
 * - GDPR Compliance: https://gdpr-info.eu/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    environments = ['dev', 'test', 'staging'],
    dataSources = {},
    privacyRequirements = {},
    testTypes = ['unit', 'integration', 'e2e'],
    dataVolume = 'medium',
    outputDir = 'test-data-management',
    retentionPolicy = '90 days',
    versionControl = true,
    syntheticDataEnabled = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Test Data Management System Setup: ${projectName}`);
  ctx.log('info', `Environments: ${environments.join(', ')}`);
  ctx.log('info', `Test Types: ${testTypes.join(', ')}`);
  ctx.log('info', `Privacy Requirements: ${JSON.stringify(privacyRequirements)}`);

  // ============================================================================
  // PHASE 1: DATA REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing test data requirements');

  const dataRequirementsResult = await ctx.task(dataRequirementsAnalysisTask, {
    projectName,
    testTypes,
    dataSources,
    environments,
    dataVolume,
    outputDir
  });

  artifacts.push(...dataRequirementsResult.artifacts);

  await ctx.checkpoint({
    title: 'Phase 1: Data Requirements Analysis Complete',
    message: `Identified ${dataRequirementsResult.entityCount} entities requiring test data. ${dataRequirementsResult.complexRelationships} complex relationships detected.`,
    context: {
      runId: ctx.runId,
      entities: dataRequirementsResult.entities,
      relationships: dataRequirementsResult.relationships,
      estimatedRecords: dataRequirementsResult.estimatedRecords,
      files: dataRequirementsResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: DATA STRATEGY DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining comprehensive test data strategy');

  const dataStrategyResult = await ctx.task(dataStrategyDefinitionTask, {
    projectName,
    dataRequirementsResult,
    environments,
    testTypes,
    syntheticDataEnabled,
    versionControl,
    outputDir
  });

  artifacts.push(...dataStrategyResult.artifacts);

  await ctx.checkpoint({
    title: 'Phase 2: Data Strategy Defined',
    message: `Strategy defined: ${dataStrategyResult.approach}. Data sources: ${dataStrategyResult.dataSources.join(', ')}. Version control: ${versionControl ? 'Enabled' : 'Disabled'}`,
    context: {
      runId: ctx.runId,
      strategy: dataStrategyResult,
      files: dataStrategyResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 3: PRIVACY AND COMPLIANCE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up data privacy and compliance controls');

  const privacyComplianceResult = await ctx.task(privacyComplianceSetupTask, {
    projectName,
    privacyRequirements,
    dataRequirementsResult,
    environments,
    retentionPolicy,
    outputDir
  });

  artifacts.push(...privacyComplianceResult.artifacts);

  // Quality Gate: Privacy compliance must be verified
  const privacyScore = privacyComplianceResult.complianceScore;
  if (privacyScore < 90) {
    await ctx.breakpoint({
      question: `Phase 3 Warning: Privacy compliance score is ${privacyScore}/100. This is below the recommended threshold of 90. ${privacyComplianceResult.violations.length} potential violation(s) detected. Review and address before proceeding?`,
      title: 'Privacy Compliance Review Required',
      context: {
        runId: ctx.runId,
        complianceScore: privacyScore,
        violations: privacyComplianceResult.violations,
        recommendations: privacyComplianceResult.recommendations,
        files: privacyComplianceResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: SYNTHETIC DATA GENERATION SETUP
  // ============================================================================

  if (syntheticDataEnabled) {
    ctx.log('info', 'Phase 4: Setting up synthetic data generation');

    const syntheticDataResult = await ctx.task(syntheticDataGenerationSetupTask, {
      projectName,
      dataRequirementsResult,
      privacyComplianceResult,
      dataVolume,
      outputDir
    });

    artifacts.push(...syntheticDataResult.artifacts);

    await ctx.checkpoint({
      title: 'Phase 4: Synthetic Data Generation Configured',
      message: `${syntheticDataResult.generatorCount} data generators created. Supports ${syntheticDataResult.dataTypes.length} data types. Faker library integrated: ${syntheticDataResult.fakerEnabled}`,
      context: {
        runId: ctx.runId,
        generators: syntheticDataResult.generators,
        dataTypes: syntheticDataResult.dataTypes,
        files: syntheticDataResult.artifacts.map(a => ({ path: a.path, format: a.format || 'code' }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: DATA MASKING AND ANONYMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing data masking and anonymization');

  const dataMaskingResult = await ctx.task(dataMaskingImplementationTask, {
    projectName,
    privacyRequirements,
    dataRequirementsResult,
    privacyComplianceResult,
    outputDir
  });

  artifacts.push(...dataMaskingResult.artifacts);

  await ctx.checkpoint({
    title: 'Phase 5: Data Masking Implemented',
    message: `${dataMaskingResult.maskingRulesCount} masking rules created. PII fields protected: ${dataMaskingResult.protectedFields.length}. Masking techniques: ${dataMaskingResult.techniques.join(', ')}`,
    context: {
      runId: ctx.runId,
      maskingRules: dataMaskingResult.maskingRules,
      protectedFields: dataMaskingResult.protectedFields,
      files: dataMaskingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'code' }))
    }
  });

  // ============================================================================
  // PHASE 6: DATA REPOSITORY SETUP
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up test data repositories');

  const dataRepositoryResult = await ctx.task(dataRepositorySetupTask, {
    projectName,
    environments,
    dataRequirementsResult,
    dataStrategyResult,
    versionControl,
    outputDir
  });

  artifacts.push(...dataRepositoryResult.artifacts);

  await ctx.checkpoint({
    title: 'Phase 6: Data Repositories Configured',
    message: `${dataRepositoryResult.repositoryCount} repositories created. Storage type: ${dataRepositoryResult.storageType}. Version control: ${dataRepositoryResult.versionControlEnabled}`,
    context: {
      runId: ctx.runId,
      repositories: dataRepositoryResult.repositories,
      storageType: dataRepositoryResult.storageType,
      files: dataRepositoryResult.artifacts.map(a => ({ path: a.path, format: a.format || 'code' }))
    }
  });

  // ============================================================================
  // PHASE 7: ENVIRONMENT-SPECIFIC DATA MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Configuring environment-specific data management');

  const environmentDataTasks = environments.map(env =>
    () => ctx.task(environmentDataConfigTask, {
      projectName,
      environment: env,
      dataRequirementsResult,
      dataStrategyResult,
      dataRepositoryResult,
      outputDir
    })
  );

  const environmentDataResults = await ctx.parallel.all(environmentDataTasks);

  artifacts.push(...environmentDataResults.flatMap(r => r.artifacts));

  await ctx.checkpoint({
    title: 'Phase 7: Environment-Specific Data Configured',
    message: `Data management configured for ${environments.length} environment(s). Each environment has isolated data sets and configurations.`,
    context: {
      runId: ctx.runId,
      environments: environmentDataResults.map(r => ({
        environment: r.environment,
        dataSetCount: r.dataSetCount,
        isolationLevel: r.isolationLevel
      })),
      files: environmentDataResults.flatMap(r => r.artifacts).map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 8: DATA SEEDING AND INITIALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating data seeding and initialization scripts');

  const dataSeedingResult = await ctx.task(dataSeedingSetupTask, {
    projectName,
    dataRequirementsResult,
    dataRepositoryResult,
    environmentDataResults,
    dataSources,
    outputDir
  });

  artifacts.push(...dataSeedingResult.artifacts);

  await ctx.checkpoint({
    title: 'Phase 8: Data Seeding Scripts Created',
    message: `${dataSeedingResult.seedScriptCount} seeding scripts created. Supports ${dataSeedingResult.databaseTypes.join(', ')}. Initialization time: ~${dataSeedingResult.estimatedInitTime}`,
    context: {
      runId: ctx.runId,
      seedScripts: dataSeedingResult.seedScripts,
      databaseTypes: dataSeedingResult.databaseTypes,
      files: dataSeedingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'code' }))
    }
  });

  // ============================================================================
  // PHASE 9: DATA VERSIONING AND STATE MANAGEMENT
  // ============================================================================

  if (versionControl) {
    ctx.log('info', 'Phase 9: Implementing data versioning and state management');

    const dataVersioningResult = await ctx.task(dataVersioningSetupTask, {
      projectName,
      dataRepositoryResult,
      environmentDataResults,
      outputDir
    });

    artifacts.push(...dataVersioningResult.artifacts);

    await ctx.checkpoint({
      title: 'Phase 9: Data Versioning Configured',
      message: `Version control system: ${dataVersioningResult.versioningSystem}. Snapshot support: ${dataVersioningResult.snapshotEnabled}. Rollback capability: ${dataVersioningResult.rollbackEnabled}`,
      context: {
        runId: ctx.runId,
        versioningSystem: dataVersioningResult.versioningSystem,
        features: dataVersioningResult.features,
        files: dataVersioningResult.artifacts.map(a => ({ path: a.path, format: a.format || 'code' }))
      }
    });
  }

  // ============================================================================
  // PHASE 10: DATA CLEANUP AND LIFECYCLE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Setting up data cleanup and lifecycle management');

  const dataCleanupResult = await ctx.task(dataCleanupSetupTask, {
    projectName,
    retentionPolicy,
    environments,
    dataRepositoryResult,
    privacyComplianceResult,
    outputDir
  });

  artifacts.push(...dataCleanupResult.artifacts);

  await ctx.checkpoint({
    title: 'Phase 10: Data Cleanup Configured',
    message: `Retention policy: ${retentionPolicy}. Automated cleanup: ${dataCleanupResult.automatedCleanup}. ${dataCleanupResult.cleanupStrategies.length} cleanup strategy(ies) implemented.`,
    context: {
      runId: ctx.runId,
      cleanupStrategies: dataCleanupResult.cleanupStrategies,
      retentionPolicy,
      files: dataCleanupResult.artifacts.map(a => ({ path: a.path, format: a.format || 'code' }))
    }
  });

  // ============================================================================
  // PHASE 11: DATA ACCESS API AND UTILITIES
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating data access API and utility functions');

  const dataAccessResult = await ctx.task(dataAccessApiTask, {
    projectName,
    dataRepositoryResult,
    environmentDataResults,
    testTypes,
    outputDir
  });

  artifacts.push(...dataAccessResult.artifacts);

  await ctx.checkpoint({
    title: 'Phase 11: Data Access API Created',
    message: `${dataAccessResult.apiMethodCount} API methods created. Builder patterns: ${dataAccessResult.builderPatternsEnabled}. Fluent interface: ${dataAccessResult.fluentInterfaceEnabled}`,
    context: {
      runId: ctx.runId,
      apiMethods: dataAccessResult.apiMethods,
      features: dataAccessResult.features,
      files: dataAccessResult.artifacts.map(a => ({ path: a.path, format: a.format || 'code' }))
    }
  });

  // ============================================================================
  // PHASE 12: TEST DATA FACTORIES
  // ============================================================================

  ctx.log('info', 'Phase 12: Implementing test data factory patterns');

  const dataFactoryResult = await ctx.task(testDataFactoryTask, {
    projectName,
    dataRequirementsResult,
    dataAccessResult,
    testTypes,
    outputDir
  });

  artifacts.push(...dataFactoryResult.artifacts);

  await ctx.checkpoint({
    title: 'Phase 12: Test Data Factories Created',
    message: `${dataFactoryResult.factoryCount} factory classes created. Supports ${dataFactoryResult.patterns.join(', ')} patterns. Sample tests included: ${dataFactoryResult.sampleTestsIncluded}`,
    context: {
      runId: ctx.runId,
      factories: dataFactoryResult.factories,
      patterns: dataFactoryResult.patterns,
      files: dataFactoryResult.artifacts.map(a => ({ path: a.path, format: a.format || 'code' }))
    }
  });

  // ============================================================================
  // PHASE 13: PERFORMANCE AND SCALABILITY TESTING
  // ============================================================================

  ctx.log('info', 'Phase 13: Testing data management system performance');

  const performanceTestResult = await ctx.task(dataManagementPerformanceTestTask, {
    projectName,
    dataRepositoryResult,
    dataAccessResult,
    dataVolume,
    outputDir
  });

  artifacts.push(...performanceTestResult.artifacts);

  // Quality Gate: Performance must meet requirements
  const performanceScore = performanceTestResult.performanceScore;
  if (performanceScore < 80) {
    await ctx.breakpoint({
      question: `Phase 13 Warning: Performance score is ${performanceScore}/100. Data generation time: ${performanceTestResult.generationTime}ms, Query time: ${performanceTestResult.queryTime}ms. Performance may need optimization. Continue?`,
      title: 'Performance Review Required',
      context: {
        runId: ctx.runId,
        performanceScore,
        metrics: performanceTestResult.metrics,
        bottlenecks: performanceTestResult.bottlenecks,
        files: performanceTestResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 14: DOCUMENTATION AND USAGE GUIDES
  // ============================================================================

  ctx.log('info', 'Phase 14: Generating comprehensive documentation');

  const documentationResult = await ctx.task(dataManagementDocumentationTask, {
    projectName,
    dataStrategyResult,
    privacyComplianceResult,
    dataRepositoryResult,
    dataAccessResult,
    dataFactoryResult,
    environmentDataResults,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);

  await ctx.checkpoint({
    title: 'Phase 14: Documentation Complete',
    message: `Documentation generated: ${documentationResult.documentCount} documents. Includes getting started guide, API reference, best practices, and troubleshooting.`,
    context: {
      runId: ctx.runId,
      documents: documentationResult.documents,
      files: documentationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 15: VALIDATION AND QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 15: Validating test data management system');

  const validationResult = await ctx.task(dataManagementValidationTask, {
    projectName,
    dataStrategyResult,
    privacyComplianceResult,
    dataRepositoryResult,
    dataAccessResult,
    performanceTestResult,
    documentationResult,
    outputDir
  });

  artifacts.push(...validationResult.artifacts);

  const overallScore = validationResult.overallScore;
  const qualityMet = overallScore >= 85;

  // Final Quality Gate
  if (!qualityMet) {
    await ctx.breakpoint({
      question: `Phase 15 Warning: Overall system quality score is ${overallScore}/100. ${validationResult.failedCriteria.length} quality criteria not met: ${validationResult.failedCriteria.join(', ')}. Review and address before finalizing?`,
      title: 'System Validation Issues',
      context: {
        runId: ctx.runId,
        overallScore,
        passedCriteria: validationResult.passedCriteria,
        failedCriteria: validationResult.failedCriteria,
        recommendations: validationResult.recommendations,
        files: validationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
      }
    });
  }

  // ============================================================================
  // PHASE 16: FINAL REVIEW AND HANDOFF
  // ============================================================================

  ctx.log('info', 'Phase 16: Final system review and team handoff');

  const finalReviewResult = await ctx.task(finalReviewHandoffTask, {
    projectName,
    dataStrategyResult,
    privacyComplianceResult,
    dataRepositoryResult,
    dataAccessResult,
    validationResult,
    documentationResult,
    outputDir
  });

  artifacts.push(...finalReviewResult.artifacts);

  // Final Breakpoint: System approval
  await ctx.breakpoint({
    question: `Test Data Management System Complete! Overall score: ${overallScore}/100. Quality criteria met: ${qualityMet}. ${dataRepositoryResult.repositoryCount} repositories, ${dataFactoryResult.factoryCount} factories, ${environments.length} environments configured. System ready for team adoption. Review and approve?`,
    title: 'System Setup Complete - Final Approval',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        overallScore,
        qualityMet,
        privacyCompliant: privacyScore >= 90,
        performanceScore,
        repositoryCount: dataRepositoryResult.repositoryCount,
        factoryCount: dataFactoryResult.factoryCount,
        environments: environments.length,
        syntheticDataEnabled,
        versionControlEnabled: versionControl
      },
      nextSteps: finalReviewResult.nextSteps,
      trainingResources: finalReviewResult.trainingResources,
      files: [
        { path: documentationResult.gettingStartedPath, format: 'markdown', label: 'Getting Started Guide' },
        { path: documentationResult.apiReferencePath, format: 'markdown', label: 'API Reference' },
        { path: documentationResult.bestPracticesPath, format: 'markdown', label: 'Best Practices' },
        { path: validationResult.reportPath, format: 'markdown', label: 'Validation Report' },
        { path: finalReviewResult.handoffPath, format: 'markdown', label: 'Team Handoff Document' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: qualityMet && privacyScore >= 90,
    projectName,
    overallScore,
    dataStrategy: {
      approach: dataStrategyResult.approach,
      dataSources: dataStrategyResult.dataSources,
      versionControl: versionControl,
      syntheticDataEnabled
    },
    privacyCompliance: {
      complianceScore: privacyScore,
      gdprCompliant: privacyComplianceResult.gdprCompliant,
      maskingEnabled: dataMaskingResult.maskingEnabled,
      retentionPolicy
    },
    dataGenerators: syntheticDataEnabled ? {
      generatorCount: artifacts.filter(a => a.type === 'generator').length,
      dataTypes: dataRequirementsResult.dataTypes,
      fakerIntegrated: true
    } : null,
    dataRepositories: {
      repositoryCount: dataRepositoryResult.repositoryCount,
      storageType: dataRepositoryResult.storageType,
      versionControlEnabled: dataRepositoryResult.versionControlEnabled,
      environments: environments.length
    },
    dataAccess: {
      apiMethodCount: dataAccessResult.apiMethodCount,
      builderPatternsEnabled: dataAccessResult.builderPatternsEnabled,
      fluentInterfaceEnabled: dataAccessResult.fluentInterfaceEnabled
    },
    dataFactories: {
      factoryCount: dataFactoryResult.factoryCount,
      patterns: dataFactoryResult.patterns
    },
    performance: {
      performanceScore,
      generationTime: performanceTestResult.generationTime,
      queryTime: performanceTestResult.queryTime,
      scalabilityTested: performanceTestResult.scalabilityTested
    },
    documentation: {
      documentCount: documentationResult.documentCount,
      gettingStartedPath: documentationResult.gettingStartedPath,
      apiReferencePath: documentationResult.apiReferencePath
    },
    validation: {
      overallScore,
      qualityMet,
      passedCriteria: validationResult.passedCriteria,
      failedCriteria: validationResult.failedCriteria
    },
    artifacts,
    duration,
    metadata: {
      processId: 'qa-testing-automation/test-data-management',
      timestamp: startTime,
      environments,
      testTypes,
      dataVolume
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Data Requirements Analysis
export const dataRequirementsAnalysisTask = defineTask('data-requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Data Requirements Analysis - ${args.projectName}`,
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'Test Data Analyst and Domain Modeler',
      task: 'Analyze test data requirements across all test types and identify data entities, relationships, and volume needs',
      context: {
        projectName: args.projectName,
        testTypes: args.testTypes,
        dataSources: args.dataSources,
        environments: args.environments,
        dataVolume: args.dataVolume,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all data entities needed for testing (users, products, orders, etc.)',
        '2. Map data entities to test types (which entities needed for unit vs e2e)',
        '3. Define entity relationships and dependencies',
        '4. Identify complex relationships (many-to-many, hierarchical)',
        '5. Define data attributes and types for each entity',
        '6. Identify required data states (active, inactive, pending, etc.)',
        '7. Estimate data volume needs per entity based on test requirements',
        '8. Identify edge cases and boundary conditions requiring test data',
        '9. Map data entities to existing data sources',
        '10. Identify data generation vs data copying strategies',
        '11. Create entity relationship diagram',
        '12. Document data requirements specification'
      ],
      outputFormat: 'JSON with entities, relationships, dataTypes, estimatedRecords, complexRelationships count, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['entityCount', 'entities', 'relationships', 'estimatedRecords', 'artifacts'],
      properties: {
        entityCount: { type: 'number' },
        entities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              attributes: { type: 'array', items: { type: 'string' } },
              testTypes: { type: 'array', items: { type: 'string' } },
              volumeEstimate: { type: 'number' },
              states: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              type: { type: 'string' },
              cardinality: { type: 'string' }
            }
          }
        },
        dataTypes: { type: 'array', items: { type: 'string' } },
        estimatedRecords: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        complexRelationships: { type: 'number' },
        edgeCases: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-data-management', 'requirements-analysis']
}));

// Phase 2: Data Strategy Definition
export const dataStrategyDefinitionTask = defineTask('data-strategy-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Data Strategy Definition - ${args.projectName}`,
  agent: {
    name: 'data-strategist',
    prompt: {
      role: 'Test Data Management Architect',
      task: 'Define comprehensive test data management strategy including sourcing, generation, storage, and lifecycle',
      context: {
        projectName: args.projectName,
        dataRequirementsResult: args.dataRequirementsResult,
        environments: args.environments,
        testTypes: args.testTypes,
        syntheticDataEnabled: args.syntheticDataEnabled,
        versionControl: args.versionControl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define data sourcing strategy: synthetic generation, production copy, manual creation',
        '2. Determine data storage approach: files (JSON/CSV), database, in-memory, cloud',
        '3. Define data isolation strategy per environment',
        '4. Plan data sharing vs duplication strategy',
        '5. Design data versioning and snapshot approach',
        '6. Define data refresh and update strategies',
        '7. Plan for data dependencies and ordering',
        '8. Define data validation and quality checks',
        '9. Design data discovery and search mechanisms',
        '10. Plan for data subset creation for different test scenarios',
        '11. Define performance and scalability considerations',
        '12. Create comprehensive data strategy document'
      ],
      outputFormat: 'JSON with approach, dataSources, storageStrategy, isolationLevel, versioningApproach, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'dataSources', 'storageStrategy', 'artifacts'],
      properties: {
        approach: {
          type: 'string',
          enum: ['synthetic-first', 'production-copy', 'hybrid', 'manual']
        },
        dataSources: { type: 'array', items: { type: 'string' } },
        storageStrategy: {
          type: 'object',
          properties: {
            primaryStorage: { type: 'string' },
            backupStorage: { type: 'string' },
            format: { type: 'string' }
          }
        },
        isolationLevel: {
          type: 'string',
          enum: ['environment', 'test-suite', 'test-case', 'shared']
        },
        versioningApproach: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            strategy: { type: 'string' },
            snapshotFrequency: { type: 'string' }
          }
        },
        refreshStrategy: { type: 'string' },
        validationStrategy: { type: 'string' },
        scalabilityPlan: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-data-management', 'strategy']
}));

// Phase 3: Privacy and Compliance Setup
export const privacyComplianceSetupTask = defineTask('privacy-compliance-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Privacy & Compliance Setup - ${args.projectName}`,
  agent: {
    name: 'privacy-engineer',
    prompt: {
      role: 'Privacy Engineer and Compliance Specialist',
      task: 'Implement privacy controls, data protection measures, and compliance validation for test data',
      context: {
        projectName: args.projectName,
        privacyRequirements: args.privacyRequirements,
        dataRequirementsResult: args.dataRequirementsResult,
        environments: args.environments,
        retentionPolicy: args.retentionPolicy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all PII (Personally Identifiable Information) fields',
        '2. Map GDPR/CCPA/HIPAA requirements to data fields',
        '3. Define data classification: public, internal, confidential, restricted',
        '4. Design data masking/anonymization rules for PII',
        '5. Implement consent tracking for test data',
        '6. Define data retention and deletion policies',
        '7. Create audit logging for data access',
        '8. Implement data encryption at rest and in transit',
        '9. Define access control and permissions per environment',
        '10. Create compliance validation checklist',
        '11. Generate privacy impact assessment',
        '12. Document compliance controls and procedures'
      ],
      outputFormat: 'JSON with complianceScore, piiFields, maskingRequired, gdprCompliant, violations, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceScore', 'piiFields', 'gdprCompliant', 'violations', 'artifacts'],
      properties: {
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        piiFields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              entity: { type: 'string' },
              field: { type: 'string' },
              classification: { type: 'string' },
              maskingRequired: { type: 'boolean' }
            }
          }
        },
        gdprCompliant: { type: 'boolean' },
        ccpaCompliant: { type: 'boolean' },
        hipaaCompliant: { type: 'boolean' },
        dataClassification: {
          type: 'object',
          properties: {
            public: { type: 'number' },
            internal: { type: 'number' },
            confidential: { type: 'number' },
            restricted: { type: 'number' }
          }
        },
        retentionPolicies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dataType: { type: 'string' },
              retentionPeriod: { type: 'string' },
              deletionMethod: { type: 'string' }
            }
          }
        },
        violations: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        auditLoggingEnabled: { type: 'boolean' },
        encryptionEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-data-management', 'privacy', 'compliance']
}));

// Phase 4: Synthetic Data Generation Setup
export const syntheticDataGenerationSetupTask = defineTask('synthetic-data-generation-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Synthetic Data Generation - ${args.projectName}`,
  agent: {
    name: 'data-generator-engineer',
    prompt: {
      role: 'Synthetic Data Engineer',
      task: 'Create synthetic data generators using Faker.js and custom algorithms for realistic test data',
      context: {
        projectName: args.projectName,
        dataRequirementsResult: args.dataRequirementsResult,
        privacyComplianceResult: args.privacyComplianceResult,
        dataVolume: args.dataVolume,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Install and configure Faker.js or similar library',
        '2. Create generator for each entity identified in requirements',
        '3. Implement generators for common data types: names, emails, addresses, phone, dates',
        '4. Create custom generators for domain-specific data',
        '5. Implement realistic data distribution and patterns',
        '6. Add support for data relationships and referential integrity',
        '7. Implement seeded random generation for reproducibility',
        '8. Create generators respecting data constraints and validations',
        '9. Add support for edge cases and boundary values',
        '10. Implement bulk generation for performance testing',
        '11. Create generator configuration files',
        '12. Document generator usage and customization'
      ],
      outputFormat: 'JSON with generatorCount, generators, dataTypes, fakerEnabled, reproducible, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['generatorCount', 'generators', 'dataTypes', 'fakerEnabled', 'artifacts'],
      properties: {
        generatorCount: { type: 'number' },
        generators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              entity: { type: 'string' },
              filePath: { type: 'string' },
              supportedVolumes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dataTypes: { type: 'array', items: { type: 'string' } },
        fakerEnabled: { type: 'boolean' },
        reproducible: { type: 'boolean' },
        customGenerators: { type: 'number' },
        supportsRelationships: { type: 'boolean' },
        supportsBulkGeneration: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-data-management', 'synthetic-data', 'generation']
}));

// Phase 5: Data Masking Implementation
export const dataMaskingImplementationTask = defineTask('data-masking-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Data Masking & Anonymization - ${args.projectName}`,
  agent: {
    name: 'masking-engineer',
    prompt: {
      role: 'Data Masking Specialist',
      task: 'Implement data masking and anonymization techniques to protect sensitive information',
      context: {
        projectName: args.projectName,
        privacyRequirements: args.privacyRequirements,
        dataRequirementsResult: args.dataRequirementsResult,
        privacyComplianceResult: args.privacyComplianceResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all fields requiring masking from privacy compliance result',
        '2. Implement masking techniques: substitution, shuffling, nulling, encryption',
        '3. Create masking rules for each PII field type',
        '4. Email masking: preserve format but anonymize (test+user123@example.com)',
        '5. Phone masking: preserve format but randomize digits',
        '6. Name masking: replace with fake names maintaining gender/culture',
        '7. Address masking: real format but fake addresses',
        '8. SSN/Credit Card: tokenization or format-preserving encryption',
        '9. Implement reversible vs irreversible masking options',
        '10. Create masking utilities and helper functions',
        '11. Add masking validation to ensure no real PII leaks',
        '12. Document masking rules and usage examples'
      ],
      outputFormat: 'JSON with maskingRulesCount, maskingRules, protectedFields, techniques, reversible, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['maskingRulesCount', 'maskingRules', 'protectedFields', 'techniques', 'artifacts'],
      properties: {
        maskingRulesCount: { type: 'number' },
        maskingRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              technique: { type: 'string' },
              reversible: { type: 'boolean' },
              example: { type: 'string' }
            }
          }
        },
        protectedFields: { type: 'array', items: { type: 'string' } },
        techniques: { type: 'array', items: { type: 'string' } },
        reversible: { type: 'boolean' },
        maskingEnabled: { type: 'boolean' },
        validationEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-data-management', 'masking', 'anonymization']
}));

// Phase 6: Data Repository Setup
export const dataRepositorySetupTask = defineTask('data-repository-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Data Repository Setup - ${args.projectName}`,
  agent: {
    name: 'repository-architect',
    prompt: {
      role: 'Data Repository Architect',
      task: 'Design and implement test data repositories with proper organization and access patterns',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        dataRequirementsResult: args.dataRequirementsResult,
        dataStrategyResult: args.dataStrategyResult,
        versionControl: args.versionControl,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design repository structure: fixtures/, seeds/, generators/, snapshots/',
        '2. Organize by entity type: users/, products/, orders/',
        '3. Create environment-specific directories: dev/, test/, staging/',
        '4. Implement file-based storage (JSON, CSV, YAML) for fixtures',
        '5. Set up database seeders if database storage chosen',
        '6. Create repository access layer with CRUD operations',
        '7. Implement search and filter capabilities',
        '8. Add support for data templates and variants',
        '9. Implement data validation on load',
        '10. Set up version control integration if enabled',
        '11. Create repository index for fast lookups',
        '12. Document repository structure and conventions'
      ],
      outputFormat: 'JSON with repositoryCount, repositories, storageType, versionControlEnabled, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['repositoryCount', 'repositories', 'storageType', 'versionControlEnabled', 'artifacts'],
      properties: {
        repositoryCount: { type: 'number' },
        repositories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              entities: { type: 'array', items: { type: 'string' } },
              storageFormat: { type: 'string' }
            }
          }
        },
        storageType: {
          type: 'string',
          enum: ['file-based', 'database', 'in-memory', 'cloud', 'hybrid']
        },
        versionControlEnabled: { type: 'boolean' },
        organizationStructure: { type: 'string' },
        searchEnabled: { type: 'boolean' },
        validationEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-data-management', 'repository']
}));

// Phase 7: Environment-Specific Data Configuration
export const environmentDataConfigTask = defineTask('environment-data-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Environment Data Config - ${args.environment}`,
  agent: {
    name: 'environment-config-engineer',
    prompt: {
      role: 'Environment Configuration Specialist',
      task: `Configure test data management for ${args.environment} environment`,
      context: {
        projectName: args.projectName,
        environment: args.environment,
        dataRequirementsResult: args.dataRequirementsResult,
        dataStrategyResult: args.dataStrategyResult,
        dataRepositoryResult: args.dataRepositoryResult,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Create environment-specific configuration for ${args.environment}`,
        '2. Define data isolation boundaries',
        '3. Set up environment-specific data volumes',
        '4. Configure environment-specific data sources',
        '5. Define data refresh frequencies',
        '6. Set up environment-specific credentials/secrets',
        '7. Configure data cleanup policies per environment',
        '8. Define test data subsets for this environment',
        '9. Set up connection strings and endpoints',
        '10. Create environment initialization scripts',
        '11. Define environment-specific validation rules',
        '12. Document environment configuration'
      ],
      outputFormat: 'JSON with environment, dataSetCount, isolationLevel, configuration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['environment', 'dataSetCount', 'isolationLevel', 'configuration', 'artifacts'],
      properties: {
        environment: { type: 'string' },
        dataSetCount: { type: 'number' },
        isolationLevel: {
          type: 'string',
          enum: ['full', 'partial', 'shared']
        },
        configuration: {
          type: 'object',
          properties: {
            dataVolume: { type: 'string' },
            refreshFrequency: { type: 'string' },
            cleanupPolicy: { type: 'string' },
            dataSources: { type: 'array', items: { type: 'string' } }
          }
        },
        dataSubsets: { type: 'array', items: { type: 'string' } },
        initScriptPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-data-management', 'environment-config']
}));

// Phase 8: Data Seeding Setup
export const dataSeedingSetupTask = defineTask('data-seeding-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Data Seeding Scripts - ${args.projectName}`,
  agent: {
    name: 'seeding-engineer',
    prompt: {
      role: 'Database Seeding Engineer',
      task: 'Create database seeding scripts and data initialization utilities',
      context: {
        projectName: args.projectName,
        dataRequirementsResult: args.dataRequirementsResult,
        dataRepositoryResult: args.dataRepositoryResult,
        environmentDataResults: args.environmentDataResults,
        dataSources: args.dataSources,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create seeding scripts for each database type',
        '2. Implement SQL seeders for relational databases',
        '3. Implement NoSQL seeders for MongoDB, etc.',
        '4. Create API seeders for external services',
        '5. Implement ordered seeding respecting dependencies',
        '6. Add idempotent seeding (safe to run multiple times)',
        '7. Create seed data from fixtures/generators',
        '8. Implement incremental vs full seeding options',
        '9. Add progress tracking and logging',
        '10. Create rollback/cleanup scripts',
        '11. Optimize for performance (batch inserts)',
        '12. Document seeding procedures and commands'
      ],
      outputFormat: 'JSON with seedScriptCount, seedScripts, databaseTypes, estimatedInitTime, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['seedScriptCount', 'seedScripts', 'databaseTypes', 'estimatedInitTime', 'artifacts'],
      properties: {
        seedScriptCount: { type: 'number' },
        seedScripts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              database: { type: 'string' },
              entities: { type: 'array', items: { type: 'string' } },
              filePath: { type: 'string' }
            }
          }
        },
        databaseTypes: { type: 'array', items: { type: 'string' } },
        estimatedInitTime: { type: 'string' },
        idempotent: { type: 'boolean' },
        supportsIncremental: { type: 'boolean' },
        rollbackScripts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-data-management', 'seeding']
}));

// Phase 9: Data Versioning Setup
export const dataVersioningSetupTask = defineTask('data-versioning-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Data Versioning - ${args.projectName}`,
  agent: {
    name: 'versioning-engineer',
    prompt: {
      role: 'Data Versioning Specialist',
      task: 'Implement data versioning and state management with snapshot and rollback capabilities',
      context: {
        projectName: args.projectName,
        dataRepositoryResult: args.dataRepositoryResult,
        environmentDataResults: args.environmentDataResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Choose versioning system: Git, custom snapshot system, database migrations',
        '2. Implement snapshot creation for data states',
        '3. Create versioning metadata: version number, timestamp, author, changes',
        '4. Implement diff tracking between versions',
        '5. Create rollback mechanism to previous versions',
        '6. Implement tag system for named snapshots (e.g., "baseline", "pre-migration")',
        '7. Add branching support for parallel test data versions',
        '8. Create version history and changelog',
        '9. Implement version cleanup and pruning',
        '10. Add comparison tools between versions',
        '11. Create version management CLI commands',
        '12. Document versioning workflows and best practices'
      ],
      outputFormat: 'JSON with versioningSystem, snapshotEnabled, rollbackEnabled, features, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['versioningSystem', 'snapshotEnabled', 'rollbackEnabled', 'features', 'artifacts'],
      properties: {
        versioningSystem: {
          type: 'string',
          enum: ['git', 'custom-snapshot', 'database-migration', 'hybrid']
        },
        snapshotEnabled: { type: 'boolean' },
        rollbackEnabled: { type: 'boolean' },
        features: {
          type: 'array',
          items: { type: 'string' }
        },
        taggingSupport: { type: 'boolean' },
        branchingSupport: { type: 'boolean' },
        diffTrackingEnabled: { type: 'boolean' },
        maxVersionsRetained: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-data-management', 'versioning']
}));

// Phase 10: Data Cleanup Setup
export const dataCleanupSetupTask = defineTask('data-cleanup-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Data Cleanup & Lifecycle - ${args.projectName}`,
  agent: {
    name: 'cleanup-engineer',
    prompt: {
      role: 'Data Lifecycle Manager',
      task: 'Implement data cleanup, retention policies, and lifecycle management',
      context: {
        projectName: args.projectName,
        retentionPolicy: args.retentionPolicy,
        environments: args.environments,
        dataRepositoryResult: args.dataRepositoryResult,
        privacyComplianceResult: args.privacyComplianceResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement retention policy enforcement',
        '2. Create cleanup scripts for test data deletion',
        '3. Implement per-test cleanup (teardown)',
        '4. Create per-suite cleanup strategies',
        '5. Implement scheduled cleanup jobs',
        '6. Add soft delete vs hard delete options',
        '7. Create orphaned data detection and cleanup',
        '8. Implement database transaction rollback strategies',
        '9. Add cleanup verification and validation',
        '10. Create cleanup audit logs',
        '11. Implement emergency full reset procedures',
        '12. Document cleanup procedures and schedules'
      ],
      outputFormat: 'JSON with automatedCleanup, cleanupStrategies, retentionPolicyEnforced, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['automatedCleanup', 'cleanupStrategies', 'retentionPolicyEnforced', 'artifacts'],
      properties: {
        automatedCleanup: { type: 'boolean' },
        cleanupStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              trigger: { type: 'string' },
              scope: { type: 'string' },
              schedule: { type: 'string' }
            }
          }
        },
        retentionPolicyEnforced: { type: 'boolean' },
        softDeleteEnabled: { type: 'boolean' },
        orphanedDataDetection: { type: 'boolean' },
        auditLoggingEnabled: { type: 'boolean' },
        emergencyResetEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-data-management', 'cleanup', 'lifecycle']
}));

// Phase 11: Data Access API
export const dataAccessApiTask = defineTask('data-access-api', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Data Access API - ${args.projectName}`,
  agent: {
    name: 'api-developer',
    prompt: {
      role: 'Test Data API Developer',
      task: 'Create fluent data access API and utilities for easy test data consumption',
      context: {
        projectName: args.projectName,
        dataRepositoryResult: args.dataRepositoryResult,
        environmentDataResults: args.environmentDataResults,
        testTypes: args.testTypes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design fluent API: TestData.user().withEmail("test@example.com").build()',
        '2. Implement builder pattern for complex data construction',
        '3. Create query methods: findBy, where, filter',
        '4. Implement CRUD operations: create, read, update, delete',
        '5. Add convenience methods: createUser(), getProduct(), etc.',
        '6. Implement data presets: validUser, expiredCard, etc.',
        '7. Add chaining support for relationships',
        '8. Create async/await compatible API',
        '9. Implement data validation before save',
        '10. Add error handling and meaningful error messages',
        '11. Create TypeScript types/interfaces',
        '12. Document API with JSDoc and usage examples'
      ],
      outputFormat: 'JSON with apiMethodCount, apiMethods, builderPatternsEnabled, fluentInterfaceEnabled, features, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['apiMethodCount', 'apiMethods', 'builderPatternsEnabled', 'fluentInterfaceEnabled', 'artifacts'],
      properties: {
        apiMethodCount: { type: 'number' },
        apiMethods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              example: { type: 'string' }
            }
          }
        },
        builderPatternsEnabled: { type: 'boolean' },
        fluentInterfaceEnabled: { type: 'boolean' },
        features: { type: 'array', items: { type: 'string' } },
        presetsCount: { type: 'number' },
        typeScriptEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-data-management', 'api']
}));

// Phase 12: Test Data Factories
export const testDataFactoryTask = defineTask('test-data-factory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Test Data Factories - ${args.projectName}`,
  agent: {
    name: 'factory-developer',
    prompt: {
      role: 'Test Data Factory Engineer',
      task: 'Implement factory pattern for test data creation with fixtures and traits',
      context: {
        projectName: args.projectName,
        dataRequirementsResult: args.dataRequirementsResult,
        dataAccessResult: args.dataAccessResult,
        testTypes: args.testTypes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create factory class for each entity',
        '2. Implement Factory pattern: UserFactory.create(), ProductFactory.createMany(10)',
        '3. Add traits: UserFactory.create({ trait: "admin" })',
        '4. Implement sequences for unique values',
        '5. Add state methods: .active(), .pending(), .expired()',
        '6. Create associations: OrderFactory.create({ user: userInstance })',
        '7. Implement lazy vs eager associations',
        '8. Add callback hooks: afterCreate, beforeBuild',
        '9. Create factory configurations for different scenarios',
        '10. Add factory inheritance and composition',
        '11. Create sample tests demonstrating factory usage',
        '12. Document factory patterns and examples'
      ],
      outputFormat: 'JSON with factoryCount, factories, patterns, sampleTestsIncluded, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['factoryCount', 'factories', 'patterns', 'sampleTestsIncluded', 'artifacts'],
      properties: {
        factoryCount: { type: 'number' },
        factories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              entity: { type: 'string' },
              filePath: { type: 'string' },
              traitsCount: { type: 'number' }
            }
          }
        },
        patterns: {
          type: 'array',
          items: { type: 'string' }
        },
        sampleTestsIncluded: { type: 'boolean' },
        supportsAssociations: { type: 'boolean' },
        supportsSequences: { type: 'boolean' },
        callbackHooksEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-data-management', 'factories']
}));

// Phase 13: Performance Testing
export const dataManagementPerformanceTestTask = defineTask('data-management-performance-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Performance Testing - ${args.projectName}`,
  agent: {
    name: 'performance-tester',
    prompt: {
      role: 'Performance Testing Engineer',
      task: 'Test data management system performance and identify bottlenecks',
      context: {
        projectName: args.projectName,
        dataRepositoryResult: args.dataRepositoryResult,
        dataAccessResult: args.dataAccessResult,
        dataVolume: args.dataVolume,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test data generation performance for various volumes',
        '2. Test data loading/query performance',
        '3. Test data seeding performance',
        '4. Test concurrent data access',
        '5. Test memory usage under load',
        '6. Identify performance bottlenecks',
        '7. Test scalability: small, medium, large data volumes',
        '8. Benchmark against performance targets',
        '9. Test cleanup performance',
        '10. Measure repository operations (CRUD) latency',
        '11. Generate performance report',
        '12. Provide optimization recommendations'
      ],
      outputFormat: 'JSON with performanceScore, generationTime, queryTime, scalabilityTested, metrics, bottlenecks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['performanceScore', 'generationTime', 'queryTime', 'scalabilityTested', 'metrics', 'artifacts'],
      properties: {
        performanceScore: { type: 'number', minimum: 0, maximum: 100 },
        generationTime: { type: 'number', description: 'Milliseconds' },
        queryTime: { type: 'number', description: 'Milliseconds' },
        seedingTime: { type: 'number', description: 'Milliseconds' },
        scalabilityTested: { type: 'boolean' },
        metrics: {
          type: 'object',
          properties: {
            throughput: { type: 'string' },
            latency: { type: 'string' },
            memoryUsage: { type: 'string' },
            concurrentAccess: { type: 'number' }
          }
        },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-data-management', 'performance']
}));

// Phase 14: Documentation
export const dataManagementDocumentationTask = defineTask('data-management-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Create comprehensive documentation for test data management system',
      context: {
        projectName: args.projectName,
        dataStrategyResult: args.dataStrategyResult,
        privacyComplianceResult: args.privacyComplianceResult,
        dataRepositoryResult: args.dataRepositoryResult,
        dataAccessResult: args.dataAccessResult,
        dataFactoryResult: args.dataFactoryResult,
        environmentDataResults: args.environmentDataResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Getting Started guide with quick examples',
        '2. Document data strategy and architecture',
        '3. Write API reference for all data access methods',
        '4. Document factory patterns and usage',
        '5. Create privacy and compliance guidelines',
        '6. Document data generation strategies',
        '7. Write environment configuration guide',
        '8. Create data seeding and cleanup procedures',
        '9. Document versioning and rollback workflows',
        '10. Create troubleshooting guide',
        '11. Write best practices and anti-patterns',
        '12. Include code examples and recipes'
      ],
      outputFormat: 'JSON with documentCount, documents, gettingStartedPath, apiReferencePath, bestPracticesPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentCount', 'documents', 'gettingStartedPath', 'apiReferencePath', 'artifacts'],
      properties: {
        documentCount: { type: 'number' },
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              path: { type: 'string' },
              sections: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        gettingStartedPath: { type: 'string' },
        apiReferencePath: { type: 'string' },
        bestPracticesPath: { type: 'string' },
        troubleshootingPath: { type: 'string' },
        examplesIncluded: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-data-management', 'documentation']
}));

// Phase 15: Validation
export const dataManagementValidationTask = defineTask('data-management-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: System Validation - ${args.projectName}`,
  agent: {
    name: 'system-validator',
    prompt: {
      role: 'QA System Validator and Auditor',
      task: 'Validate test data management system against quality criteria',
      context: {
        projectName: args.projectName,
        dataStrategyResult: args.dataStrategyResult,
        privacyComplianceResult: args.privacyComplianceResult,
        dataRepositoryResult: args.dataRepositoryResult,
        dataAccessResult: args.dataAccessResult,
        performanceTestResult: args.performanceTestResult,
        documentationResult: args.documentationResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate data strategy completeness and coherence',
        '2. Verify privacy compliance meets all requirements',
        '3. Validate data repositories are properly organized',
        '4. Verify API usability and completeness',
        '5. Check performance meets acceptable thresholds',
        '6. Validate documentation completeness',
        '7. Verify all environments are properly configured',
        '8. Check data versioning works correctly',
        '9. Validate cleanup and lifecycle management',
        '10. Score system on 10 quality criteria (0-10 each)',
        '11. Calculate overall score (0-100)',
        '12. Generate comprehensive validation report'
      ],
      outputFormat: 'JSON with overallScore, passedCriteria, failedCriteria, recommendations, reportPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'passedCriteria', 'failedCriteria', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        criteriaScores: {
          type: 'object',
          properties: {
            strategyCompleteness: { type: 'number' },
            privacyCompliance: { type: 'number' },
            repositoryOrganization: { type: 'number' },
            apiUsability: { type: 'number' },
            performance: { type: 'number' },
            documentation: { type: 'number' },
            environmentConfig: { type: 'number' },
            versioning: { type: 'number' },
            lifecycle: { type: 'number' },
            scalability: { type: 'number' }
          }
        },
        passedCriteria: { type: 'array', items: { type: 'string' } },
        failedCriteria: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-data-management', 'validation']
}));

// Phase 16: Final Review and Handoff
export const finalReviewHandoffTask = defineTask('final-review-handoff', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Final Review - ${args.projectName}`,
  agent: {
    name: 'project-lead',
    prompt: {
      role: 'QA Project Lead',
      task: 'Conduct final review and prepare team handoff for test data management system',
      context: {
        projectName: args.projectName,
        dataStrategyResult: args.dataStrategyResult,
        privacyComplianceResult: args.privacyComplianceResult,
        dataRepositoryResult: args.dataRepositoryResult,
        dataAccessResult: args.dataAccessResult,
        validationResult: args.validationResult,
        documentationResult: args.documentationResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review all system components and deliverables',
        '2. Verify system is production-ready',
        '3. Create team onboarding checklist',
        '4. Prepare training materials and workshops',
        '5. Define next steps for team adoption',
        '6. Create maintenance and support plan',
        '7. Identify knowledge transfer sessions needed',
        '8. Prepare demo scenarios',
        '9. Create quick reference guides',
        '10. Define system evolution roadmap',
        '11. Prepare handoff documentation',
        '12. List training resources'
      ],
      outputFormat: 'JSON with nextSteps, trainingResources, onboardingChecklist, handoffPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['nextSteps', 'trainingResources', 'handoffPath', 'artifacts'],
      properties: {
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        trainingResources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              type: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        onboardingChecklist: { type: 'array', items: { type: 'string' } },
        maintenancePlan: { type: 'string' },
        handoffPath: { type: 'string' },
        demoScenarios: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'test-data-management', 'handoff']
}));
