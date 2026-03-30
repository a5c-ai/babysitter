/**
 * @process specializations/data-engineering-analytics/scd-implementation
 * @description Slowly Changing Dimension (SCD) Implementation - Implement Type 2 SCD patterns for historical tracking in data warehouses,
 * including merge logic, surrogate key generation, temporal tracking fields, versioning, late-arriving data handling, and comprehensive testing.
 * @specialization Data Engineering & Analytics
 * @category Data Warehousing
 * @inputs { projectName: string, dimensionTables: array, scdType?: string, targetPlatform?: string, sourceSystem?: object, testingStrategy?: string }
 * @outputs { success: boolean, scdConfiguration: object, mergeLogic: object, surrogateKeyStrategy: object, temporalTracking: object, tests: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/data-engineering-analytics/scd-implementation', {
 *   projectName: 'Customer Dimension SCD',
 *   dimensionTables: ['dim_customer', 'dim_product', 'dim_supplier'],
 *   scdType: 'type-2',
 *   targetPlatform: 'Snowflake',
 *   sourceSystem: { database: 'production_db', schema: 'public' },
 *   testingStrategy: 'comprehensive',
 *   includeType1Attributes: true,
 *   enableAuditLogging: true
 * });
 *
 * @references
 * - The Data Warehouse Toolkit (3rd Edition) - Ralph Kimball: https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/books/
 * - Slowly Changing Dimensions: https://en.wikipedia.org/wiki/Slowly_changing_dimension
 * - Kimball SCD Techniques: https://www.kimballgroup.com/2008/08/slowly-changing-dimensions/
 * - Type 2 SCD Best Practices: https://www.kimballgroup.com/2013/02/design-tip-152-slowly-changing-dimension-types-0-4-5-6/
 * - dbt Snapshots Documentation: https://docs.getdbt.com/docs/build/snapshots
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    dimensionTables = [],
    scdType = 'type-2',
    targetPlatform = 'Snowflake',
    sourceSystem = {},
    testingStrategy = 'comprehensive',
    includeType1Attributes = true,
    enableAuditLogging = true,
    outputDir = 'scd-implementation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting SCD Implementation: ${projectName}`);
  ctx.log('info', `SCD Type: ${scdType}`);
  ctx.log('info', `Target Platform: ${targetPlatform}`);
  ctx.log('info', `Dimension Tables: ${dimensionTables.join(', ')}`);

  // ============================================================================
  // PHASE 1: DIMENSION ANALYSIS AND SCD REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing dimensions and defining SCD requirements');

  const dimensionAnalysis = await ctx.task(dimensionAnalysisTask, {
    projectName,
    dimensionTables,
    scdType,
    sourceSystem,
    includeType1Attributes,
    outputDir
  });

  artifacts.push(...dimensionAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: Analyzed ${dimensionTables.length} dimension(s). ${dimensionAnalysis.type2AttributeCount} attributes require Type 2 tracking, ${dimensionAnalysis.type1AttributeCount} use Type 1. Review analysis?`,
    title: 'Dimension Analysis Complete',
    context: {
      runId: ctx.runId,
      dimensionCount: dimensionTables.length,
      scdType,
      dimensions: dimensionAnalysis.dimensions.map(d => ({
        table: d.tableName,
        businessKey: d.businessKey,
        type2Attributes: d.type2Attributes.length,
        type1Attributes: d.type1Attributes.length,
        changeFrequency: d.estimatedChangeFrequency
      })),
      files: dimensionAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: SURROGATE KEY STRATEGY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing surrogate key generation strategy');

  const surrogateKeyStrategy = await ctx.task(surrogateKeyStrategyTask, {
    projectName,
    dimensions: dimensionAnalysis.dimensions,
    targetPlatform,
    outputDir
  });

  artifacts.push(...surrogateKeyStrategy.artifacts);

  // ============================================================================
  // PHASE 3: TEMPORAL TRACKING DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing temporal tracking fields and logic');

  const temporalTracking = await ctx.task(temporalTrackingDesignTask, {
    projectName,
    dimensions: dimensionAnalysis.dimensions,
    scdType,
    enableAuditLogging,
    outputDir
  });

  artifacts.push(...temporalTracking.artifacts);

  await ctx.breakpoint({
    question: `Phase 3 Complete: Temporal tracking configured with ${temporalTracking.trackingFields.length} audit fields. Effective date strategy: ${temporalTracking.effectiveDateStrategy}. Review configuration?`,
    title: 'Temporal Tracking Design Complete',
    context: {
      runId: ctx.runId,
      trackingFields: temporalTracking.trackingFields,
      effectiveDateStrategy: temporalTracking.effectiveDateStrategy,
      expirationStrategy: temporalTracking.expirationStrategy,
      currentFlagLogic: temporalTracking.currentFlagLogic,
      versioningEnabled: temporalTracking.versioningEnabled,
      files: temporalTracking.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 4: SCD TYPE 2 MERGE LOGIC DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing Type 2 SCD merge logic and SQL patterns');

  const mergeTasks = dimensionAnalysis.dimensions.map(dimension =>
    () => ctx.task(scdMergeLogicTask, {
      projectName,
      dimension,
      surrogateKeyStrategy,
      temporalTracking,
      targetPlatform,
      outputDir
    })
  );

  const mergeLogicResults = await ctx.parallel.all(mergeTasks);
  artifacts.push(...mergeLogicResults.flatMap(m => m.artifacts));

  const totalMergePatterns = mergeLogicResults.reduce((sum, m) => sum + m.operationCount, 0);

  await ctx.breakpoint({
    question: `Phase 4 Complete: Designed merge logic for ${dimensionTables.length} dimension(s) with ${totalMergePatterns} total operations (INSERT new rows, UPDATE current rows, EXPIRE old rows). Review merge patterns?`,
    title: 'SCD Merge Logic Design Complete',
    context: {
      runId: ctx.runId,
      mergePatterns: mergeLogicResults.map(m => ({
        dimension: m.dimensionName,
        operations: m.operations,
        changeDetectionMethod: m.changeDetectionMethod,
        performanceOptimized: m.performanceOptimized
      })),
      files: mergeLogicResults.flatMap(m => m.artifacts).map(a => ({ path: a.path, format: 'sql' })).slice(0, 10)
    }
  });

  // ============================================================================
  // PHASE 5: DDL GENERATION FOR SCD TABLES
  // ============================================================================

  ctx.log('info', 'Phase 5: Generating DDL for dimension tables with SCD fields');

  const ddlGeneration = await ctx.task(scdDdlGenerationTask, {
    projectName,
    dimensions: dimensionAnalysis.dimensions,
    surrogateKeyStrategy,
    temporalTracking,
    targetPlatform,
    outputDir
  });

  artifacts.push(...ddlGeneration.artifacts);

  // ============================================================================
  // PHASE 6: INITIAL LOAD PROCEDURE
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating initial dimension load procedures');

  const initialLoad = await ctx.task(initialLoadProcedureTask, {
    projectName,
    dimensions: dimensionAnalysis.dimensions,
    surrogateKeyStrategy,
    temporalTracking,
    targetPlatform,
    sourceSystem,
    outputDir
  });

  artifacts.push(...initialLoad.artifacts);

  // ============================================================================
  // PHASE 7: INCREMENTAL UPDATE PROCEDURE
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating incremental SCD update procedures');

  const incrementalTasks = dimensionAnalysis.dimensions.map(dimension =>
    () => ctx.task(incrementalUpdateProcedureTask, {
      projectName,
      dimension,
      surrogateKeyStrategy,
      temporalTracking,
      mergeLogic: mergeLogicResults.find(m => m.dimensionName === dimension.tableName),
      targetPlatform,
      sourceSystem,
      outputDir
    })
  );

  const incrementalResults = await ctx.parallel.all(incrementalTasks);
  artifacts.push(...incrementalResults.flatMap(i => i.artifacts));

  await ctx.breakpoint({
    question: `Phase 7 Complete: Created incremental update procedures for ${dimensionTables.length} dimension(s). Includes change detection, row expiration, and new row insertion. Review procedures?`,
    title: 'Incremental Update Procedures Complete',
    context: {
      runId: ctx.runId,
      procedures: incrementalResults.map(i => ({
        dimension: i.dimensionName,
        updateStrategy: i.updateStrategy,
        changeDetection: i.changeDetectionMethod,
        performance: i.performanceMetrics
      })),
      files: incrementalResults.flatMap(i => i.artifacts).map(a => ({ path: a.path, format: 'sql' })).slice(0, 10)
    }
  });

  // ============================================================================
  // PHASE 8: LATE-ARRIVING DATA HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing late-arriving data handling');

  const lateArrivingData = await ctx.task(lateArrivingDataTask, {
    projectName,
    dimensions: dimensionAnalysis.dimensions,
    temporalTracking,
    targetPlatform,
    outputDir
  });

  artifacts.push(...lateArrivingData.artifacts);

  // ============================================================================
  // PHASE 9: DIMENSION LOOKUP FUNCTIONS
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating dimension lookup functions for fact table loads');

  const lookupFunctions = await ctx.task(dimensionLookupTask, {
    projectName,
    dimensions: dimensionAnalysis.dimensions,
    surrogateKeyStrategy,
    temporalTracking,
    targetPlatform,
    outputDir
  });

  artifacts.push(...lookupFunctions.artifacts);

  // ============================================================================
  // PHASE 10: DATA QUALITY AND VALIDATION TESTS
  // ============================================================================

  ctx.log('info', 'Phase 10: Creating comprehensive SCD validation tests');

  const validationTests = await ctx.task(scdValidationTestsTask, {
    projectName,
    dimensions: dimensionAnalysis.dimensions,
    temporalTracking,
    testingStrategy,
    targetPlatform,
    outputDir
  });

  artifacts.push(...validationTests.artifacts);

  await ctx.breakpoint({
    question: `Phase 10 Complete: Created ${validationTests.totalTests} validation tests across ${validationTests.testCategories.length} categories (uniqueness, temporal integrity, history tracking, audit). Review test suite?`,
    title: 'SCD Validation Tests Complete',
    context: {
      runId: ctx.runId,
      testMetrics: {
        totalTests: validationTests.totalTests,
        uniquenessTests: validationTests.uniquenessTests,
        temporalIntegrityTests: validationTests.temporalIntegrityTests,
        historyTrackingTests: validationTests.historyTrackingTests,
        auditTests: validationTests.auditTests,
        performanceTests: validationTests.performanceTests
      },
      testCategories: validationTests.testCategories,
      files: validationTests.artifacts.map(a => ({ path: a.path, format: a.format || 'sql' }))
    }
  });

  // ============================================================================
  // PHASE 11: PERFORMANCE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Optimizing SCD implementation for performance');

  const performanceOptimization = await ctx.task(scdPerformanceOptimizationTask, {
    projectName,
    dimensions: dimensionAnalysis.dimensions,
    mergeLogicResults,
    temporalTracking,
    targetPlatform,
    outputDir
  });

  artifacts.push(...performanceOptimization.artifacts);

  // ============================================================================
  // PHASE 12: MONITORING AND ALERTING
  // ============================================================================

  ctx.log('info', 'Phase 12: Setting up SCD monitoring and alerting');

  const monitoring = await ctx.task(scdMonitoringTask, {
    projectName,
    dimensions: dimensionAnalysis.dimensions,
    enableAuditLogging,
    targetPlatform,
    outputDir
  });

  artifacts.push(...monitoring.artifacts);

  // ============================================================================
  // PHASE 13: ORCHESTRATION AND SCHEDULING
  // ============================================================================

  ctx.log('info', 'Phase 13: Creating orchestration and scheduling workflows');

  const orchestration = await ctx.task(scdOrchestrationTask, {
    projectName,
    dimensions: dimensionAnalysis.dimensions,
    incrementalResults,
    targetPlatform,
    outputDir
  });

  artifacts.push(...orchestration.artifacts);

  // ============================================================================
  // PHASE 14: DOCUMENTATION AND RUNBOOKS
  // ============================================================================

  ctx.log('info', 'Phase 14: Generating comprehensive SCD documentation');

  const documentation = await ctx.task(scdDocumentationTask, {
    projectName,
    dimensionAnalysis,
    surrogateKeyStrategy,
    temporalTracking,
    mergeLogicResults,
    incrementalResults,
    lateArrivingData,
    validationTests,
    performanceOptimization,
    monitoring,
    orchestration,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 15: IMPLEMENTATION VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Validating SCD implementation completeness');

  const implementationValidation = await ctx.task(implementationValidationTask, {
    projectName,
    dimensionAnalysis,
    surrogateKeyStrategy,
    temporalTracking,
    mergeLogicResults,
    incrementalResults,
    validationTests,
    ddlGeneration,
    documentation,
    outputDir
  });

  artifacts.push(...implementationValidation.artifacts);

  const validationScore = implementationValidation.overallScore;
  const implementationValid = validationScore >= 85;

  if (!implementationValid) {
    await ctx.breakpoint({
      question: `Phase 15 Warning: Implementation validation score: ${validationScore}/100 (below threshold of 85). ${implementationValidation.issues.length} issue(s) found. Review and address issues?`,
      title: 'Implementation Validation Issues',
      context: {
        runId: ctx.runId,
        validationScore,
        passedChecks: implementationValidation.passedChecks,
        issues: implementationValidation.issues,
        recommendations: implementationValidation.recommendations,
        files: implementationValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // FINAL BREAKPOINT: IMPLEMENTATION COMPLETE
  // ============================================================================

  await ctx.breakpoint({
    question: `SCD Implementation Complete for "${projectName}"! Validation score: ${validationScore}/100. Implemented ${scdType} for ${dimensionTables.length} dimension(s) with ${validationTests.totalTests} validation tests. Ready for deployment?`,
    title: 'SCD Implementation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        scdType,
        targetPlatform,
        validationScore,
        dimensionsImplemented: dimensionTables.length,
        totalTests: validationTests.totalTests,
        surrogateKeyMethod: surrogateKeyStrategy.generationMethod,
        trackingFields: temporalTracking.trackingFields.length,
        mergePatterns: mergeLogicResults.length,
        optimizationsApplied: performanceOptimization.optimizationCount,
        monitoringEnabled: monitoring.monitoringEnabled,
        orchestrationConfigured: orchestration.orchestrationConfigured
      },
      deliverables: {
        ddlScripts: ddlGeneration.tableCount,
        initialLoadProcedures: initialLoad.procedureCount,
        incrementalUpdateProcedures: incrementalResults.length,
        lookupFunctions: lookupFunctions.functionCount,
        validationTests: validationTests.totalTests,
        documentationFiles: documentation.documentationFiles.length
      },
      quickStart: documentation.quickStartSteps,
      files: [
        { path: documentation.implementationGuidePath, format: 'markdown', label: 'Implementation Guide' },
        { path: documentation.runbookPath, format: 'markdown', label: 'Operations Runbook' },
        { path: documentation.testingGuidePath, format: 'markdown', label: 'Testing Guide' },
        { path: implementationValidation.reportPath, format: 'json', label: 'Validation Report' },
        { path: ddlGeneration.ddlScriptPath, format: 'sql', label: 'DDL Scripts' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: implementationValid && validationScore >= 85,
    projectName,
    scdType,
    targetPlatform,
    scdConfiguration: {
      dimensionTables: dimensionTables.length,
      dimensions: dimensionAnalysis.dimensions.map(d => ({
        tableName: d.tableName,
        businessKey: d.businessKey,
        type2AttributeCount: d.type2Attributes.length,
        type1AttributeCount: d.type1Attributes.length,
        scdType: d.scdType
      })),
      includeType1Attributes,
      enableAuditLogging
    },
    surrogateKeyStrategy: {
      generationMethod: surrogateKeyStrategy.generationMethod,
      keyDataType: surrogateKeyStrategy.keyDataType,
      sequenceGeneration: surrogateKeyStrategy.sequenceGeneration,
      performanceConsiderations: surrogateKeyStrategy.performanceConsiderations
    },
    temporalTracking: {
      trackingFields: temporalTracking.trackingFields,
      effectiveDateStrategy: temporalTracking.effectiveDateStrategy,
      expirationStrategy: temporalTracking.expirationStrategy,
      currentFlagLogic: temporalTracking.currentFlagLogic,
      versioningEnabled: temporalTracking.versioningEnabled,
      highWaterMark: temporalTracking.highWaterMark
    },
    mergeLogic: {
      patterns: mergeLogicResults.map(m => ({
        dimension: m.dimensionName,
        operations: m.operations,
        changeDetectionMethod: m.changeDetectionMethod,
        hashingUsed: m.hashingUsed,
        performanceOptimized: m.performanceOptimized
      })),
      totalOperations: totalMergePatterns
    },
    dataLoading: {
      initialLoad: {
        procedureCount: initialLoad.procedureCount,
        strategy: initialLoad.strategy
      },
      incrementalUpdate: {
        procedures: incrementalResults.map(i => ({
          dimension: i.dimensionName,
          updateStrategy: i.updateStrategy,
          scheduledFrequency: i.scheduledFrequency
        }))
      },
      lateArrivingData: {
        supported: lateArrivingData.supported,
        strategy: lateArrivingData.strategy,
        correctionProcedures: lateArrivingData.correctionProcedures
      }
    },
    lookupFunctions: {
      functionCount: lookupFunctions.functionCount,
      functions: lookupFunctions.functions.map(f => ({
        name: f.name,
        purpose: f.purpose,
        performanceOptimized: f.performanceOptimized
      }))
    },
    tests: {
      totalTests: validationTests.totalTests,
      testCategories: validationTests.testCategories,
      coverage: {
        uniqueness: validationTests.uniquenessTests,
        temporalIntegrity: validationTests.temporalIntegrityTests,
        historyTracking: validationTests.historyTrackingTests,
        audit: validationTests.auditTests,
        performance: validationTests.performanceTests
      },
      strategy: testingStrategy
    },
    performance: {
      optimizationCount: performanceOptimization.optimizationCount,
      indexingStrategy: performanceOptimization.indexingStrategy,
      partitioningRecommendations: performanceOptimization.partitioningRecommendations,
      clusteringKeys: performanceOptimization.clusteringKeys,
      estimatedImpact: performanceOptimization.estimatedImpact
    },
    monitoring: {
      monitoringEnabled: monitoring.monitoringEnabled,
      metricsTracked: monitoring.metricsTracked,
      alertsConfigured: monitoring.alertsConfigured,
      dashboards: monitoring.dashboards
    },
    orchestration: {
      orchestrationConfigured: orchestration.orchestrationConfigured,
      workflowEngine: orchestration.workflowEngine,
      schedules: orchestration.schedules,
      dependencies: orchestration.dependencies
    },
    documentation: {
      implementationGuide: documentation.implementationGuidePath,
      runbook: documentation.runbookPath,
      testingGuide: documentation.testingGuidePath,
      apiReference: documentation.apiReferencePath,
      totalFiles: documentation.documentationFiles.length
    },
    validation: {
      overallScore: validationScore,
      passedChecks: implementationValidation.passedChecks.length,
      issues: implementationValidation.issues.length,
      recommendations: implementationValidation.recommendations,
      bestPracticesCompliance: implementationValidation.bestPracticesCompliance
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/data-engineering-analytics/scd-implementation',
      timestamp: startTime,
      targetPlatform,
      scdType,
      dimensionCount: dimensionTables.length
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Dimension Analysis
export const dimensionAnalysisTask = defineTask('dimension-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Dimension Analysis - ${args.projectName}`,
  agent: {
    name: 'dimensional-analyst',
    prompt: {
      role: 'Senior Data Warehouse Architect specializing in dimensional modeling',
      task: 'Analyze dimension tables and define SCD requirements',
      context: {
        projectName: args.projectName,
        dimensionTables: args.dimensionTables,
        scdType: args.scdType,
        sourceSystem: args.sourceSystem,
        includeType1Attributes: args.includeType1Attributes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze each dimension table structure and business requirements',
        '2. Identify business key (natural key) for each dimension',
        '3. Classify attributes as Type 1 (overwrite) or Type 2 (track history)',
        '4. Document attribute volatility and change frequency',
        '5. Identify attributes that should be excluded from change detection',
        '6. Define grain of historical tracking (attribute-level vs row-level)',
        '7. Analyze source-to-target mapping for each dimension',
        '8. Identify data quality requirements and constraints',
        '9. Document business rules for dimension updates',
        '10. Estimate dimension growth and storage requirements',
        '11. Create dimension analysis report with recommendations',
        '12. Save analysis to output directory'
      ],
      outputFormat: 'JSON with dimension analysis, attribute classifications, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['dimensions', 'type2AttributeCount', 'type1AttributeCount', 'artifacts'],
      properties: {
        dimensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tableName: { type: 'string' },
              businessKey: { type: 'string' },
              surrogateKeyColumn: { type: 'string' },
              scdType: { type: 'string' },
              type2Attributes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    attributeName: { type: 'string' },
                    dataType: { type: 'string' },
                    volatility: { type: 'string', enum: ['high', 'medium', 'low'] },
                    businessRationale: { type: 'string' }
                  }
                }
              },
              type1Attributes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    attributeName: { type: 'string' },
                    dataType: { type: 'string' },
                    overwriteRationale: { type: 'string' }
                  }
                }
              },
              excludedAttributes: { type: 'array', items: { type: 'string' } },
              estimatedChangeFrequency: { type: 'string' },
              estimatedRowGrowth: { type: 'string' },
              sourceMapping: {
                type: 'object',
                properties: {
                  sourceTable: { type: 'string' },
                  sourceDatabase: { type: 'string' },
                  sourceSchema: { type: 'string' }
                }
              },
              dataQualityRules: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        type2AttributeCount: { type: 'number' },
        type1AttributeCount: { type: 'number' },
        totalDimensions: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-engineering', 'scd', 'dimension-analysis', 'type-2']
}));

// Phase 2: Surrogate Key Strategy
export const surrogateKeyStrategyTask = defineTask('surrogate-key-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Surrogate Key Strategy - ${args.projectName}`,
  agent: {
    name: 'key-architect',
    prompt: {
      role: 'Database Architect specializing in key generation strategies',
      task: 'Design surrogate key generation strategy for SCD implementation',
      context: {
        projectName: args.projectName,
        dimensions: args.dimensions,
        targetPlatform: args.targetPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select surrogate key generation method (IDENTITY, SEQUENCE, HASH, UUID)',
        '2. Recommend IDENTITY or SEQUENCE for most platforms (best performance)',
        '3. Define surrogate key data type (INTEGER, BIGINT, VARCHAR for composite keys)',
        '4. Design sequence generation patterns per dimension',
        '5. Plan for surrogate key uniqueness across all versions',
        '6. Design surrogate key lookup mechanisms for fact loading',
        '7. Create special surrogate keys: -1 (unknown), 0 (not applicable)',
        '8. Plan for surrogate key gaps and discontinuities',
        '9. Design business key + effective_date lookup pattern',
        '10. Consider performance implications of different key strategies',
        '11. Document surrogate key generation procedures',
        '12. Create surrogate key management guide'
      ],
      outputFormat: 'JSON with surrogate key strategy and implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['generationMethod', 'keyDataType', 'artifacts'],
      properties: {
        generationMethod: {
          type: 'string',
          enum: ['identity', 'sequence', 'hash', 'uuid', 'composite']
        },
        keyDataType: { type: 'string' },
        sequenceGeneration: {
          type: 'object',
          properties: {
            startValue: { type: 'number' },
            incrementBy: { type: 'number' },
            cacheSize: { type: 'number' },
            orderGuaranteed: { type: 'boolean' }
          }
        },
        specialKeys: {
          type: 'object',
          properties: {
            unknownKey: { type: 'number' },
            notApplicableKey: { type: 'number' },
            errorKey: { type: 'number' }
          }
        },
        lookupStrategy: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            indexRequired: { type: 'boolean' },
            temporalLookup: { type: 'boolean' }
          }
        },
        dimensionStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string' },
              sequenceName: { type: 'string' },
              keyColumn: { type: 'string' },
              businessKeyLookup: { type: 'string' }
            }
          }
        },
        performanceConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-engineering', 'scd', 'surrogate-keys', 'key-generation']
}));

// Phase 3: Temporal Tracking Design
export const temporalTrackingDesignTask = defineTask('temporal-tracking-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Temporal Tracking Design - ${args.projectName}`,
  agent: {
    name: 'temporal-architect',
    prompt: {
      role: 'Data Architect specializing in temporal data management',
      task: 'Design temporal tracking fields and logic for Type 2 SCD',
      context: {
        projectName: args.projectName,
        dimensions: args.dimensions,
        scdType: args.scdType,
        enableAuditLogging: args.enableAuditLogging,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define standard SCD Type 2 tracking fields:',
        '   - effective_date (TIMESTAMP): When this version became active',
        '   - expiration_date (TIMESTAMP): When this version expired (NULL for current)',
        '   - current_flag (BOOLEAN): TRUE for current version, FALSE for historical',
        '   - version_number (INTEGER): Version sequence for same business key',
        '2. Design effective_date strategy: source timestamp, load timestamp, or business date',
        '3. Design expiration_date strategy: 9999-12-31 vs NULL for current records',
        '4. Define current_flag logic: single TRUE per business key',
        '5. Design version_number incrementing logic',
        '6. Add audit fields if enabled:',
        '   - record_created_date, record_created_by',
        '   - record_updated_date, record_updated_by',
        '   - record_source_system',
        '7. Design high-water mark tracking for incremental loads',
        '8. Define temporal query patterns (point-in-time, period-based)',
        '9. Create temporal integrity constraints',
        '10. Document temporal field standards and conventions',
        '11. Create temporal query examples and best practices',
        '12. Generate temporal tracking specification'
      ],
      outputFormat: 'JSON with temporal tracking configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['trackingFields', 'effectiveDateStrategy', 'expirationStrategy', 'artifacts'],
      properties: {
        trackingFields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fieldName: { type: 'string' },
              dataType: { type: 'string' },
              purpose: { type: 'string' },
              nullable: { type: 'boolean' },
              defaultValue: { type: 'string' }
            }
          }
        },
        effectiveDateStrategy: {
          type: 'string',
          enum: ['source_timestamp', 'load_timestamp', 'business_date', 'transaction_date']
        },
        expirationStrategy: {
          type: 'string',
          enum: ['null_for_current', 'high_date_9999', 'high_timestamp']
        },
        currentFlagLogic: {
          type: 'object',
          properties: {
            trueValue: { type: 'string' },
            falseValue: { type: 'string' },
            uniquenessConstraint: { type: 'string' }
          }
        },
        versioningEnabled: { type: 'boolean' },
        versioningLogic: {
          type: 'object',
          properties: {
            startVersion: { type: 'number' },
            incrementBy: { type: 'number' },
            calculationMethod: { type: 'string' }
          }
        },
        auditFields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fieldName: { type: 'string' },
              dataType: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        highWaterMark: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            trackingTable: { type: 'string' },
            columnName: { type: 'string' }
          }
        },
        temporalQueryPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              useCase: { type: 'string' },
              exampleQuery: { type: 'string' }
            }
          }
        },
        integrityConstraints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-engineering', 'scd', 'temporal-tracking', 'type-2']
}));

// Phase 4: SCD Merge Logic (per dimension)
export const scdMergeLogicTask = defineTask('scd-merge-logic', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: SCD Merge Logic - ${args.dimension.tableName}`,
  agent: {
    name: 'merge-engineer',
    prompt: {
      role: 'Data Engineer specializing in SCD merge patterns',
      task: `Design Type 2 SCD merge logic for ${args.dimension.tableName}`,
      context: {
        projectName: args.projectName,
        dimension: args.dimension,
        surrogateKeyStrategy: args.surrogateKeyStrategy,
        temporalTracking: args.temporalTracking,
        targetPlatform: args.targetPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design 3-step SCD Type 2 merge process:',
        '   Step 1: EXPIRE old rows (UPDATE expiration_date, current_flag = FALSE)',
        '   Step 2: INSERT new rows (changed attributes)',
        '   Step 3: UPDATE Type 1 attributes (non-tracked changes)',
        '2. Implement change detection using:',
        '   - Column-by-column comparison for Type 2 attributes',
        '   - Hash comparison (MD5/SHA256) for performance',
        '   - Exclude audit fields from change detection',
        '3. Design MERGE/UPSERT statement for target platform:',
        '   - Snowflake: MERGE INTO with WHEN MATCHED/NOT MATCHED',
        '   - BigQuery: MERGE statement',
        '   - PostgreSQL: INSERT ON CONFLICT or MERGE (v15+)',
        '   - Redshift: Staging table + DELETE + INSERT',
        '4. Handle business key matching on source and target',
        '5. Set effective_date to current timestamp or source date',
        '6. Set expiration_date on expired rows',
        '7. Increment version_number for new versions',
        '8. Generate new surrogate key for new rows',
        '9. Preserve surrogate key for Type 1 updates',
        '10. Handle NULL values in change detection',
        '11. Optimize for performance (minimize table scans)',
        '12. Create SQL scripts with merge logic'
      ],
      outputFormat: 'JSON with merge operations and SQL scripts'
    },
    outputSchema: {
      type: 'object',
      required: ['dimensionName', 'operations', 'changeDetectionMethod', 'operationCount', 'artifacts'],
      properties: {
        dimensionName: { type: 'string' },
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              operationName: { type: 'string' },
              operationType: { type: 'string', enum: ['EXPIRE', 'INSERT', 'UPDATE'] },
              sqlTemplate: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        operationCount: { type: 'number' },
        changeDetectionMethod: {
          type: 'string',
          enum: ['column_comparison', 'hash_comparison', 'hybrid']
        },
        hashingUsed: { type: 'boolean' },
        hashAlgorithm: { type: 'string' },
        mergeStrategy: {
          type: 'string',
          enum: ['merge_statement', 'staging_table', 'cte_based']
        },
        businessKeyMatching: {
          type: 'object',
          properties: {
            sourceColumns: { type: 'array', items: { type: 'string' } },
            targetColumns: { type: 'array', items: { type: 'string' } },
            matchingLogic: { type: 'string' }
          }
        },
        performanceOptimized: { type: 'boolean' },
        optimizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-engineering', 'scd', 'merge-logic', 'type-2']
}));

// Phase 5: DDL Generation
export const scdDdlGenerationTask = defineTask('scd-ddl-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: DDL Generation - ${args.projectName}`,
  agent: {
    name: 'ddl-architect',
    prompt: {
      role: 'Database Engineer specializing in DDL design',
      task: 'Generate DDL for dimension tables with SCD Type 2 fields',
      context: {
        projectName: args.projectName,
        dimensions: args.dimensions,
        surrogateKeyStrategy: args.surrogateKeyStrategy,
        temporalTracking: args.temporalTracking,
        targetPlatform: args.targetPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate CREATE TABLE statements for each dimension with:',
        '   - Surrogate key (PRIMARY KEY) with IDENTITY/SEQUENCE',
        '   - Business key columns (natural key)',
        '   - Type 2 tracked attributes',
        '   - Type 1 attributes (if any)',
        '   - Temporal tracking fields (effective_date, expiration_date, current_flag, version)',
        '   - Audit fields (created_date, updated_date, source_system)',
        '2. Create indexes:',
        '   - Primary key index (surrogate key)',
        '   - Unique index on business_key + expiration_date (or current_flag)',
        '   - Index on current_flag for current row queries',
        '   - Index on effective_date and expiration_date for temporal queries',
        '   - Composite index on business_key + effective_date',
        '3. Add constraints:',
        '   - NOT NULL on business key and surrogate key',
        '   - CHECK constraint: current_flag = TRUE implies expiration_date IS NULL',
        '   - CHECK constraint: effective_date <= expiration_date',
        '4. Create sequences for surrogate key generation',
        '5. Add table and column comments/descriptions',
        '6. Platform-specific optimizations (clustering, partitioning)',
        '7. Create separate DDL files per dimension',
        '8. Generate consolidated DDL script for all dimensions',
        '9. Include DROP statements with IF EXISTS',
        '10. Add deployment order and dependencies',
        '11. Create DDL rollback scripts',
        '12. Document DDL standards and conventions'
      ],
      outputFormat: 'JSON with DDL scripts and table definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['tableCount', 'ddlScriptPath', 'artifacts'],
      properties: {
        tableCount: { type: 'number' },
        tables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tableName: { type: 'string' },
              columns: { type: 'number' },
              indexes: { type: 'number' },
              constraints: { type: 'number' },
              ddlScriptPath: { type: 'string' }
            }
          }
        },
        ddlScriptPath: { type: 'string' },
        indexCount: { type: 'number' },
        constraintCount: { type: 'number' },
        sequenceCount: { type: 'number' },
        platformSpecific: {
          type: 'object',
          properties: {
            clustering: { type: 'boolean' },
            partitioning: { type: 'boolean' },
            compressionUsed: { type: 'boolean' }
          }
        },
        deploymentOrder: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-engineering', 'scd', 'ddl', 'schema-design']
}));

// Phase 6: Initial Load Procedure
export const initialLoadProcedureTask = defineTask('initial-load-procedure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Initial Load Procedure - ${args.projectName}`,
  agent: {
    name: 'load-engineer',
    prompt: {
      role: 'ETL Engineer specializing in dimension loading',
      task: 'Create initial dimension load procedures for first-time population',
      context: {
        projectName: args.projectName,
        dimensions: args.dimensions,
        surrogateKeyStrategy: args.surrogateKeyStrategy,
        temporalTracking: args.temporalTracking,
        targetPlatform: args.targetPlatform,
        sourceSystem: args.sourceSystem,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create initial load procedure for each dimension:',
        '   - Load all records from source system',
        '   - Generate surrogate keys (IDENTITY or SEQUENCE)',
        '   - Set effective_date to load date or historical date',
        '   - Set expiration_date to NULL or 9999-12-31 (all current)',
        '   - Set current_flag = TRUE (all current)',
        '   - Set version_number = 1 (first version)',
        '   - Populate audit fields (created_date, created_by)',
        '2. Handle source-to-target column mapping',
        '3. Apply data type conversions and transformations',
        '4. Insert special dimension members (unknown, N/A, error)',
        '5. Implement data quality checks and validation',
        '6. Handle NULL values appropriately',
        '7. Log row counts and load statistics',
        '8. Implement error handling and rollback',
        '9. Create idempotent load procedures (can be re-run safely)',
        '10. Add pre-load and post-load validations',
        '11. Document initial load process and prerequisites',
        '12. Create initial load testing procedures'
      ],
      outputFormat: 'JSON with initial load procedures and documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['procedureCount', 'strategy', 'artifacts'],
      properties: {
        procedureCount: { type: 'number' },
        strategy: { type: 'string', enum: ['full_load', 'historical_load', 'snapshot'] },
        procedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimensionName: { type: 'string' },
              procedureName: { type: 'string' },
              sourceQuery: { type: 'string' },
              transformations: { type: 'array', items: { type: 'string' } },
              validations: { type: 'array', items: { type: 'string' } },
              scriptPath: { type: 'string' }
            }
          }
        },
        specialMembers: {
          type: 'object',
          properties: {
            unknownMember: { type: 'boolean' },
            notApplicableMember: { type: 'boolean' },
            errorMember: { type: 'boolean' }
          }
        },
        dataQualityChecks: { type: 'array', items: { type: 'string' } },
        errorHandling: {
          type: 'object',
          properties: {
            rollbackOnError: { type: 'boolean' },
            errorLogging: { type: 'boolean' },
            notificationOnFailure: { type: 'boolean' }
          }
        },
        idempotent: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-engineering', 'scd', 'initial-load', 'etl']
}));

// Phase 7: Incremental Update Procedure (per dimension)
export const incrementalUpdateProcedureTask = defineTask('incremental-update-procedure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Incremental Update - ${args.dimension.tableName}`,
  agent: {
    name: 'incremental-engineer',
    prompt: {
      role: 'ETL Engineer specializing in incremental SCD processing',
      task: `Create incremental update procedure for ${args.dimension.tableName}`,
      context: {
        projectName: args.projectName,
        dimension: args.dimension,
        surrogateKeyStrategy: args.surrogateKeyStrategy,
        temporalTracking: args.temporalTracking,
        mergeLogic: args.mergeLogic,
        targetPlatform: args.targetPlatform,
        sourceSystem: args.sourceSystem,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create incremental update stored procedure/script:',
        '   - Extract changed/new records from source (CDC or full comparison)',
        '   - Stage records in temporary staging table',
        '   - Identify changes: NEW, CHANGED, UNCHANGED, DELETED',
        '2. Process NEW records:',
        '   - Generate new surrogate key',
        '   - Set effective_date = current timestamp',
        '   - Set expiration_date = NULL (or high date)',
        '   - Set current_flag = TRUE',
        '   - Set version_number = 1',
        '   - INSERT into dimension table',
        '3. Process CHANGED records (Type 2):',
        '   - UPDATE existing current row: Set expiration_date = current timestamp, current_flag = FALSE',
        '   - INSERT new row: Generate new surrogate key, set effective_date = current timestamp',
        '   - Increment version_number',
        '4. Process Type 1 attribute changes:',
        '   - UPDATE current row with new values (preserve surrogate key)',
        '5. Handle DELETED records (if applicable):',
        '   - Option 1: Expire record (set expiration_date, current_flag = FALSE)',
        '   - Option 2: Mark as deleted with deleted_flag',
        '6. Use hash columns for efficient change detection',
        '7. Implement high-water mark tracking for incremental extraction',
        '8. Add row-level audit field updates (updated_date, updated_by)',
        '9. Implement comprehensive error handling',
        '10. Log processing statistics (rows processed, inserted, updated, expired)',
        '11. Add performance monitoring and profiling',
        '12. Create procedure documentation and runbook'
      ],
      outputFormat: 'JSON with incremental update procedure details'
    },
    outputSchema: {
      type: 'object',
      required: ['dimensionName', 'updateStrategy', 'changeDetectionMethod', 'artifacts'],
      properties: {
        dimensionName: { type: 'string' },
        procedureName: { type: 'string' },
        updateStrategy: {
          type: 'string',
          enum: ['cdc', 'full_comparison', 'timestamp_based', 'hybrid']
        },
        changeDetectionMethod: {
          type: 'string',
          enum: ['hash_comparison', 'column_comparison', 'cdc_log']
        },
        stagingTableUsed: { type: 'boolean' },
        operations: {
          type: 'object',
          properties: {
            insertNew: { type: 'boolean' },
            expireChanged: { type: 'boolean' },
            insertChangedVersion: { type: 'boolean' },
            updateType1: { type: 'boolean' },
            handleDeletes: { type: 'boolean' }
          }
        },
        highWaterMarkTracking: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            columnName: { type: 'string' },
            trackingTable: { type: 'string' }
          }
        },
        scheduledFrequency: { type: 'string' },
        performanceMetrics: {
          type: 'object',
          properties: {
            estimatedRunTime: { type: 'string' },
            avgRowsProcessed: { type: 'number' },
            indexesUsed: { type: 'array', items: { type: 'string' } }
          }
        },
        errorHandling: {
          type: 'object',
          properties: {
            transactionControl: { type: 'boolean' },
            errorLogging: { type: 'boolean' },
            rollbackStrategy: { type: 'string' }
          }
        },
        scriptPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-engineering', 'scd', 'incremental-update', 'etl']
}));

// Phase 8: Late-Arriving Data Handling
export const lateArrivingDataTask = defineTask('late-arriving-data', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Late-Arriving Data - ${args.projectName}`,
  agent: {
    name: 'late-arrival-specialist',
    prompt: {
      role: 'Senior ETL Architect specializing in temporal data challenges',
      task: 'Implement late-arriving dimension data handling',
      context: {
        projectName: args.projectName,
        dimensions: args.dimensions,
        temporalTracking: args.temporalTracking,
        targetPlatform: args.targetPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design late-arriving dimension handling strategy:',
        '   - Identify when dimension records arrive after fact records',
        '   - Detect temporal sequence violations',
        '2. Implement correction procedures for late arrivals:',
        '   - Insert new historical version with correct effective_date',
        '   - Adjust expiration_date of previous version',
        '   - Adjust version_numbers if necessary',
        '   - Update current_flag logic',
        '3. Handle inferred dimensions:',
        '   - Create placeholder dimension record when fact arrives first',
        '   - Mark as "inferred" with flag or special attribute',
        '   - Update inferred record when actual dimension data arrives',
        '4. Implement fact table correction (if needed):',
        '   - Update fact records to point to correct dimension key',
        '   - Maintain audit trail of dimension key changes',
        '5. Design temporal integrity checks:',
        '   - Detect overlapping date ranges for same business key',
        '   - Detect gaps in temporal coverage',
        '   - Validate effective_date < expiration_date',
        '6. Create late-arrival detection queries',
        '7. Implement alerting for late arrivals',
        '8. Document late-arrival correction procedures',
        '9. Create testing scenarios for late arrivals',
        '10. Design rollback procedures if corrections fail',
        '11. Implement logging and auditing of corrections',
        '12. Generate late-arrival handling runbook'
      ],
      outputFormat: 'JSON with late-arrival handling strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['supported', 'strategy', 'correctionProcedures', 'artifacts'],
      properties: {
        supported: { type: 'boolean' },
        strategy: {
          type: 'string',
          enum: ['correction_in_place', 'inferred_dimensions', 'temporal_adjustment', 'fact_correction']
        },
        correctionProcedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioName: { type: 'string' },
              description: { type: 'string' },
              correctionSteps: { type: 'array', items: { type: 'string' } },
              scriptPath: { type: 'string' }
            }
          }
        },
        inferredDimensions: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            inferredFlagColumn: { type: 'string' },
            updateProcedure: { type: 'string' }
          }
        },
        temporalIntegrityChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              checkName: { type: 'string' },
              checkQuery: { type: 'string' },
              severity: { type: 'string', enum: ['error', 'warning', 'info'] }
            }
          }
        },
        detectionQueries: { type: 'array', items: { type: 'string' } },
        alerting: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            alertChannels: { type: 'array', items: { type: 'string' } },
            alertThreshold: { type: 'string' }
          }
        },
        auditLogging: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-engineering', 'scd', 'late-arriving-data', 'temporal']
}));

// Phase 9: Dimension Lookup Functions
export const dimensionLookupTask = defineTask('dimension-lookup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Dimension Lookup - ${args.projectName}`,
  agent: {
    name: 'lookup-engineer',
    prompt: {
      role: 'ETL Engineer specializing in dimension key lookups',
      task: 'Create dimension lookup functions for fact table loading',
      context: {
        projectName: args.projectName,
        dimensions: args.dimensions,
        surrogateKeyStrategy: args.surrogateKeyStrategy,
        temporalTracking: args.temporalTracking,
        targetPlatform: args.targetPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create current dimension lookup function:',
        '   - Input: business key',
        '   - Output: surrogate key',
        '   - Logic: WHERE business_key = ? AND current_flag = TRUE',
        '2. Create point-in-time dimension lookup function:',
        '   - Input: business key, transaction date',
        '   - Output: surrogate key',
        '   - Logic: WHERE business_key = ? AND effective_date <= ? AND expiration_date > ?',
        '3. Create bulk lookup procedures for fact loading:',
        '   - Join staging fact table to dimension table',
        '   - Use business key and optional transaction date',
        '   - Handle missing dimensions (return unknown key -1)',
        '4. Optimize lookup performance:',
        '   - Use indexed columns (business key, current_flag, dates)',
        '   - Consider lookup caching for frequently used dimensions',
        '   - Use parallel lookups for independent dimensions',
        '5. Create lookup validation procedures:',
        '   - Detect missing dimension members',
        '   - Flag orphaned fact records',
        '   - Log lookup failures',
        '6. Handle special cases:',
        '   - NULL business keys -> return N/A key',
        '   - Invalid business keys -> return error key',
        '   - Multiple matches (error condition)',
        '7. Create lookup functions for each dimension',
        '8. Document lookup function usage and examples',
        '9. Create lookup performance tuning guide',
        '10. Implement lookup error handling',
        '11. Add lookup statistics and monitoring',
        '12. Generate lookup function reference documentation'
      ],
      outputFormat: 'JSON with lookup functions and procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['functionCount', 'functions', 'artifacts'],
      properties: {
        functionCount: { type: 'number' },
        functions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              dimension: { type: 'string' },
              purpose: { type: 'string' },
              lookupType: {
                type: 'string',
                enum: ['current', 'point_in_time', 'bulk', 'cached']
              },
              inputParameters: { type: 'array', items: { type: 'string' } },
              returnType: { type: 'string' },
              performanceOptimized: { type: 'boolean' },
              scriptPath: { type: 'string' }
            }
          }
        },
        bulkLookupProcedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              procedureName: { type: 'string' },
              description: { type: 'string' },
              dimensionsLookedUp: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        validationProcedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              validates: { type: 'string' }
            }
          }
        },
        specialCaseHandling: {
          type: 'object',
          properties: {
            nullKeyHandling: { type: 'string' },
            invalidKeyHandling: { type: 'string' },
            multipleMatchHandling: { type: 'string' }
          }
        },
        performanceOptimizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-engineering', 'scd', 'dimension-lookup', 'etl']
}));

// Phase 10: SCD Validation Tests
export const scdValidationTestsTask = defineTask('scd-validation-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Validation Tests - ${args.projectName}`,
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Data Quality Engineer specializing in SCD testing',
      task: 'Create comprehensive validation tests for SCD implementation',
      context: {
        projectName: args.projectName,
        dimensions: args.dimensions,
        temporalTracking: args.temporalTracking,
        testingStrategy: args.testingStrategy,
        targetPlatform: args.targetPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create UNIQUENESS tests:',
        '   - Test: Only one current row per business key (current_flag = TRUE)',
        '   - Test: Surrogate keys are unique across all rows',
        '   - Test: Business key + expiration_date is unique',
        '2. Create TEMPORAL INTEGRITY tests:',
        '   - Test: effective_date <= expiration_date (or expiration_date IS NULL)',
        '   - Test: No temporal gaps for same business key',
        '   - Test: No temporal overlaps for same business key',
        '   - Test: Current rows have NULL or high expiration_date',
        '   - Test: Historical rows have non-NULL expiration_date',
        '3. Create HISTORY TRACKING tests:',
        '   - Test: Version numbers are sequential for same business key',
        '   - Test: Version 1 has earliest effective_date',
        '   - Test: Changed attributes are properly tracked',
        '   - Test: Type 1 attributes updated on current row only',
        '4. Create AUDIT FIELD tests:',
        '   - Test: All rows have created_date populated',
        '   - Test: Updated rows have updated_date >= created_date',
        '   - Test: Source system field is populated',
        '5. Create REFERENTIAL INTEGRITY tests:',
        '   - Test: All business keys in fact tables exist in dimensions',
        '   - Test: Orphaned fact records detection',
        '6. Create DATA QUALITY tests:',
        '   - Test: Business keys are not NULL',
        '   - Test: Required attributes are not NULL',
        '   - Test: Data type and format validations',
        '7. Create PERFORMANCE tests:',
        '   - Test: Query performance for current row lookups',
        '   - Test: Query performance for point-in-time lookups',
        '   - Test: Index effectiveness',
        '8. Create functional test cases with sample data',
        '9. Create automated test execution scripts',
        '10. Document test coverage and test data requirements',
        '11. Create regression test suite',
        '12. Generate comprehensive testing guide'
      ],
      outputFormat: 'JSON with test suite and test scripts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'testCategories', 'uniquenessTests', 'temporalIntegrityTests', 'artifacts'],
      properties: {
        totalTests: { type: 'number' },
        testCategories: { type: 'array', items: { type: 'string' } },
        uniquenessTests: { type: 'number' },
        temporalIntegrityTests: { type: 'number' },
        historyTrackingTests: { type: 'number' },
        auditTests: { type: 'number' },
        dataQualityTests: { type: 'number' },
        performanceTests: { type: 'number' },
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              testQuery: { type: 'string' },
              expectedResult: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              automated: { type: 'boolean' }
            }
          }
        },
        functionalTestCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testCase: { type: 'string' },
              scenario: { type: 'string' },
              testData: { type: 'string' },
              expectedOutcome: { type: 'string' }
            }
          }
        },
        testExecutionScripts: { type: 'array', items: { type: 'string' } },
        regressionTestSuite: { type: 'string' },
        coverageReport: {
          type: 'object',
          properties: {
            dimensionsCovered: { type: 'number' },
            testCoverage: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-engineering', 'scd', 'testing', 'validation']
}));

// Phase 11: Performance Optimization
export const scdPerformanceOptimizationTask = defineTask('scd-performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Performance Optimization - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Optimization Engineer',
      task: 'Optimize SCD implementation for query and load performance',
      context: {
        projectName: args.projectName,
        dimensions: args.dimensions,
        mergeLogicResults: args.mergeLogicResults,
        temporalTracking: args.temporalTracking,
        targetPlatform: args.targetPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design comprehensive indexing strategy:',
        '   - Primary key index (surrogate key)',
        '   - Unique index on business_key + expiration_date',
        '   - Index on current_flag for current row queries',
        '   - Composite index on business_key + effective_date',
        '   - Covering indexes for common query patterns',
        '2. Implement table partitioning (if supported):',
        '   - Partition by effective_date or expiration_date',
        '   - Partition pruning for temporal queries',
        '3. Implement table clustering (Snowflake, BigQuery):',
        '   - Cluster on business_key and current_flag',
        '   - Optimize for dimension lookup patterns',
        '4. Optimize merge/update procedures:',
        '   - Use hash comparison instead of column-by-column',
        '   - Minimize full table scans',
        '   - Use staging tables for large updates',
        '   - Batch processing for large volumes',
        '5. Implement query optimization:',
        '   - Create materialized views for current dimensions',
        '   - Implement query result caching',
        '   - Optimize join order in fact loading',
        '6. Design data compression strategy',
        '7. Implement statistics collection and maintenance',
        '8. Create performance monitoring queries',
        '9. Document query patterns and best practices',
        '10. Create performance benchmarking procedures',
        '11. Identify and document performance bottlenecks',
        '12. Generate performance optimization guide'
      ],
      outputFormat: 'JSON with optimization recommendations and scripts'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizationCount', 'indexingStrategy', 'estimatedImpact', 'artifacts'],
      properties: {
        optimizationCount: { type: 'number' },
        indexingStrategy: {
          type: 'object',
          properties: {
            primaryIndexes: { type: 'array', items: { type: 'string' } },
            secondaryIndexes: { type: 'array', items: { type: 'string' } },
            coveringIndexes: { type: 'array', items: { type: 'string' } },
            compositeIndexes: { type: 'array', items: { type: 'string' } }
          }
        },
        partitioningRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string' },
              partitionColumn: { type: 'string' },
              partitionStrategy: { type: 'string' },
              benefit: { type: 'string' }
            }
          }
        },
        clusteringKeys: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string' },
              clusteringColumns: { type: 'array', items: { type: 'string' } },
              rationale: { type: 'string' }
            }
          }
        },
        mergeOptimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optimization: { type: 'string' },
              implementedIn: { type: 'array', items: { type: 'string' } },
              expectedGain: { type: 'string' }
            }
          }
        },
        queryOptimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              optimization: { type: 'string' },
              implementation: { type: 'string' }
            }
          }
        },
        materializedViews: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              viewName: { type: 'string' },
              purpose: { type: 'string' },
              refreshStrategy: { type: 'string' }
            }
          }
        },
        compressionStrategy: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            algorithm: { type: 'string' },
            estimatedSavings: { type: 'string' }
          }
        },
        performanceMonitoring: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              monitoringQuery: { type: 'string' },
              threshold: { type: 'string' }
            }
          }
        },
        estimatedImpact: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-engineering', 'scd', 'performance', 'optimization']
}));

// Phase 12: Monitoring and Alerting
export const scdMonitoringTask = defineTask('scd-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Monitoring & Alerting - ${args.projectName}`,
  agent: {
    name: 'monitoring-engineer',
    prompt: {
      role: 'DataOps Engineer specializing in monitoring',
      task: 'Set up monitoring and alerting for SCD processes',
      context: {
        projectName: args.projectName,
        dimensions: args.dimensions,
        enableAuditLogging: args.enableAuditLogging,
        targetPlatform: args.targetPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define key metrics to monitor:',
        '   - Dimension row counts (current vs historical)',
        '   - SCD processing metrics (rows inserted, updated, expired)',
        '   - Processing duration and performance',
        '   - Data quality metrics (temporal integrity violations)',
        '   - Late-arriving data occurrences',
        '   - Lookup performance metrics',
        '2. Create monitoring queries for each metric',
        '3. Design alerting thresholds and rules:',
        '   - Alert on temporal integrity violations',
        '   - Alert on excessive processing time',
        '   - Alert on high rate of dimension changes',
        '   - Alert on missing dimension lookups',
        '4. Implement audit logging tables:',
        '   - SCD processing log (timestamp, dimension, rows affected)',
        '   - Dimension change log (business key, change type, timestamp)',
        '   - Error log (error type, dimension, timestamp, details)',
        '5. Create operational dashboards:',
        '   - Dimension health dashboard',
        '   - SCD processing metrics dashboard',
        '   - Data quality metrics dashboard',
        '6. Set up notification channels (email, Slack, PagerDuty)',
        '7. Implement log retention and archival policies',
        '8. Create monitoring runbook with resolution steps',
        '9. Design SLA tracking and reporting',
        '10. Implement trend analysis queries',
        '11. Create alerting escalation procedures',
        '12. Generate monitoring and alerting documentation'
      ],
      outputFormat: 'JSON with monitoring configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoringEnabled', 'metricsTracked', 'alertsConfigured', 'artifacts'],
      properties: {
        monitoringEnabled: { type: 'boolean' },
        metricsTracked: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metricName: { type: 'string' },
              description: { type: 'string' },
              queryPath: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        alertsConfigured: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alertName: { type: 'string' },
              condition: { type: 'string' },
              threshold: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
              notificationChannel: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        auditLogging: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            processingLogTable: { type: 'string' },
            changeLogTable: { type: 'string' },
            errorLogTable: { type: 'string' },
            retentionDays: { type: 'number' }
          }
        },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dashboardName: { type: 'string' },
              purpose: { type: 'string' },
              metrics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        notificationChannels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channelType: { type: 'string' },
              configuration: { type: 'string' }
            }
          }
        },
        slaTracking: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            slaDefinitions: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-engineering', 'scd', 'monitoring', 'observability']
}));

// Phase 13: Orchestration and Scheduling
export const scdOrchestrationTask = defineTask('scd-orchestration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Orchestration - ${args.projectName}`,
  agent: {
    name: 'orchestration-engineer',
    prompt: {
      role: 'Data Orchestration Engineer',
      task: 'Create orchestration workflows for SCD processing',
      context: {
        projectName: args.projectName,
        dimensions: args.dimensions,
        incrementalResults: args.incrementalResults,
        targetPlatform: args.targetPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design workflow orchestration for SCD processing:',
        '   - Determine dimension load order (based on dependencies)',
        '   - Load independent dimensions in parallel',
        '   - Ensure dependent dimensions load after their dependencies',
        '2. Create DAG (Directed Acyclic Graph) for dimension loading:',
        '   - Node: Each dimension load task',
        '   - Edge: Dependency between dimensions',
        '3. Implement scheduling for different load patterns:',
        '   - Daily incremental loads',
        '   - Real-time/micro-batch loads',
        '   - Full refresh schedules',
        '4. Design orchestration for tools (choose based on environment):',
        '   - Apache Airflow: Create DAG files',
        '   - dbt: Create dbt models/snapshots',
        '   - Azure Data Factory: Create pipelines',
        '   - AWS Step Functions: Create state machines',
        '   - Prefect/Dagster: Create flows',
        '5. Implement error handling and retries:',
        '   - Retry failed dimension loads',
        '   - Alert on repeated failures',
        '   - Skip or pause dependent tasks on failure',
        '6. Add data quality gates between stages',
        '7. Implement idempotent workflows (safe to re-run)',
        '8. Add workflow monitoring and logging',
        '9. Create workflow documentation and diagrams',
        '10. Implement workflow testing procedures',
        '11. Design rollback and recovery procedures',
        '12. Generate orchestration runbook'
      ],
      outputFormat: 'JSON with orchestration configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['orchestrationConfigured', 'workflowEngine', 'schedules', 'artifacts'],
      properties: {
        orchestrationConfigured: { type: 'boolean' },
        workflowEngine: {
          type: 'string',
          enum: ['airflow', 'dbt', 'azure_data_factory', 'aws_step_functions', 'prefect', 'dagster', 'custom']
        },
        schedules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scheduleName: { type: 'string' },
              frequency: { type: 'string' },
              dimensions: { type: 'array', items: { type: 'string' } },
              loadType: { type: 'string', enum: ['incremental', 'full', 'snapshot'] }
            }
          }
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        parallelization: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            maxParallelTasks: { type: 'number' },
            independentGroups: { type: 'array', items: { type: 'array' } }
          }
        },
        errorHandling: {
          type: 'object',
          properties: {
            retryAttempts: { type: 'number' },
            retryDelay: { type: 'string' },
            failureActions: { type: 'array', items: { type: 'string' } }
          }
        },
        dataQualityGates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gateName: { type: 'string' },
              validations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        workflowFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fileName: { type: 'string' },
              filePath: { type: 'string' },
              workflowType: { type: 'string' }
            }
          }
        },
        idempotent: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-engineering', 'scd', 'orchestration', 'workflow']
}));

// Phase 14: Documentation
export const scdDocumentationTask = defineTask('scd-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Writer specializing in data engineering',
      task: 'Generate comprehensive SCD implementation documentation',
      context: {
        projectName: args.projectName,
        dimensionAnalysis: args.dimensionAnalysis,
        surrogateKeyStrategy: args.surrogateKeyStrategy,
        temporalTracking: args.temporalTracking,
        mergeLogicResults: args.mergeLogicResults,
        incrementalResults: args.incrementalResults,
        lateArrivingData: args.lateArrivingData,
        validationTests: args.validationTests,
        performanceOptimization: args.performanceOptimization,
        monitoring: args.monitoring,
        orchestration: args.orchestration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Implementation Guide with:',
        '   - SCD Type 2 overview and concepts',
        '   - Architecture diagram and data flow',
        '   - Dimension table specifications',
        '   - Surrogate key strategy documentation',
        '   - Temporal tracking field descriptions',
        '   - Merge logic explanation with examples',
        '   - Step-by-step implementation instructions',
        '2. Create Operations Runbook with:',
        '   - Initial load procedures',
        '   - Incremental load procedures',
        '   - Monitoring and alerting procedures',
        '   - Troubleshooting guide',
        '   - Error resolution procedures',
        '   - Late-arriving data handling',
        '   - Disaster recovery procedures',
        '3. Create Testing Guide with:',
        '   - Test strategy and approach',
        '   - Test data setup instructions',
        '   - Validation test descriptions',
        '   - Test execution procedures',
        '   - Expected results documentation',
        '4. Create Developer Guide with:',
        '   - Dimension lookup function usage',
        '   - Fact table loading patterns',
        '   - Query patterns and examples',
        '   - Best practices and conventions',
        '   - Performance optimization tips',
        '5. Create API/Function Reference:',
        '   - All stored procedures documented',
        '   - All functions documented',
        '   - Input parameters and return values',
        '   - Usage examples',
        '6. Create Quick Start Guide',
        '7. Create Data Dictionary for all SCD fields',
        '8. Create Change Management procedures',
        '9. Document all configuration settings',
        '10. Create architecture and entity-relationship diagrams',
        '11. Document all SQL scripts and their purposes',
        '12. Create comprehensive index/table of contents'
      ],
      outputFormat: 'JSON with documentation file paths and metadata'
    },
    outputSchema: {
      type: 'object',
      required: ['implementationGuidePath', 'runbookPath', 'testingGuidePath', 'documentationFiles', 'artifacts'],
      properties: {
        implementationGuidePath: { type: 'string' },
        runbookPath: { type: 'string' },
        testingGuidePath: { type: 'string' },
        developerGuidePath: { type: 'string' },
        apiReferencePath: { type: 'string' },
        quickStartPath: { type: 'string' },
        dataDictionaryPath: { type: 'string' },
        documentationFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fileName: { type: 'string' },
              filePath: { type: 'string' },
              docType: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        quickStartSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              description: { type: 'string' },
              commands: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        diagramsCreated: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-engineering', 'scd', 'documentation', 'knowledge-sharing']
}));

// Phase 15: Implementation Validation
export const implementationValidationTask = defineTask('implementation-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Implementation Validation - ${args.projectName}`,
  agent: {
    name: 'implementation-validator',
    prompt: {
      role: 'Senior Data Architect and Quality Assurance Specialist',
      task: 'Validate completeness and quality of SCD implementation',
      context: {
        projectName: args.projectName,
        dimensionAnalysis: args.dimensionAnalysis,
        surrogateKeyStrategy: args.surrogateKeyStrategy,
        temporalTracking: args.temporalTracking,
        mergeLogicResults: args.mergeLogicResults,
        incrementalResults: args.incrementalResults,
        validationTests: args.validationTests,
        ddlGeneration: args.ddlGeneration,
        documentation: args.documentation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate DDL completeness:',
        '   - All dimension tables have required SCD fields',
        '   - Surrogate keys properly configured',
        '   - Indexes created on appropriate columns',
        '   - Constraints properly defined',
        '2. Validate merge logic completeness:',
        '   - All dimensions have merge procedures',
        '   - Change detection properly implemented',
        '   - Type 1 and Type 2 logic correctly separated',
        '   - Error handling implemented',
        '3. Validate temporal tracking:',
        '   - All temporal fields present and correct type',
        '   - Effective/expiration date logic validated',
        '   - Current flag logic validated',
        '   - Version numbering validated',
        '4. Validate testing coverage:',
        '   - Uniqueness tests present',
        '   - Temporal integrity tests present',
        '   - History tracking tests present',
        '   - Minimum test coverage threshold met (80%+)',
        '5. Validate documentation completeness:',
        '   - Implementation guide present',
        '   - Runbook present',
        '   - Testing guide present',
        '   - All procedures documented',
        '6. Validate best practices compliance:',
        '   - Kimball dimensional modeling principles',
        '   - SCD Type 2 standard patterns',
        '   - Performance optimization applied',
        '   - Naming conventions followed',
        '7. Check for common SCD anti-patterns',
        '8. Validate orchestration and scheduling',
        '9. Validate monitoring and alerting setup',
        '10. Generate validation score (0-100)',
        '11. Identify gaps and missing components',
        '12. Create comprehensive validation report'
      ],
      outputFormat: 'JSON with validation results, score, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'passedChecks', 'issues', 'recommendations', 'artifacts'],
      properties: {
        overallScore: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        categoryScores: {
          type: 'object',
          properties: {
            ddlCompleteness: { type: 'number' },
            mergeLogic: { type: 'number' },
            temporalTracking: { type: 'number' },
            testCoverage: { type: 'number' },
            documentation: { type: 'number' },
            bestPractices: { type: 'number' },
            performance: { type: 'number' },
            monitoring: { type: 'number' }
          }
        },
        passedChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              checkName: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' },
              affectedComponents: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              recommendation: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        bestPracticesCompliance: {
          type: 'object',
          properties: {
            kimballPrinciples: { type: 'number' },
            scdStandardPatterns: { type: 'number' },
            performanceOptimization: { type: 'number' },
            namingConventions: { type: 'number' }
          }
        },
        antiPatternsDetected: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-engineering', 'scd', 'validation', 'quality-assurance']
}));
