/**
 * @process specializations/data-engineering-analytics/incremental-model
 * @description Incremental Model Setup - Design and implement incremental models for efficient large-scale data processing,
 * covering incremental strategies (append-only, merge, delete+insert), unique keys, partitioning, clustering, backfill strategies,
 * and performance optimization for data warehouse workloads.
 * @specialization Data Engineering & Analytics
 * @category Data Transformation
 * @inputs { projectName: string, dataWarehouse: string, modelName: string, sourceModel?: string, incrementalStrategy?: string, updateFrequency?: string, dataVolume?: string }
 * @outputs { success: boolean, modelConfiguration: object, incrementalStrategy: object, partitionConfig: object, backfillPlan: object, performance: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/data-engineering-analytics/incremental-model', {
 *   projectName: 'analytics_dbt',
 *   dataWarehouse: 'Snowflake',
 *   modelName: 'fct_orders',
 *   sourceModel: 'stg_orders',
 *   incrementalStrategy: 'merge',
 *   updateFrequency: 'hourly',
 *   dataVolume: 'large',
 *   uniqueKey: ['order_id'],
 *   partitionBy: { field: 'order_date', granularity: 'day' },
 *   backfillRequired: true
 * });
 *
 * @references
 * - dbt Incremental Models: https://docs.getdbt.com/docs/build/incremental-models
 * - dbt Incremental Strategies: https://docs.getdbt.com/docs/build/incremental-strategy
 * - Snowflake Incremental Models: https://docs.getdbt.com/reference/resource-configs/snowflake-configs#merge-behavior-incremental-models
 * - BigQuery Incremental Models: https://docs.getdbt.com/reference/resource-configs/bigquery-configs#merge-behavior-incremental-models
 * - dbt Performance Best Practices: https://docs.getdbt.com/best-practices/how-we-build-our-metrics/3-optimize-performance
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    dataWarehouse,
    modelName,
    sourceModel,
    incrementalStrategy = 'merge',
    updateFrequency = 'daily',
    dataVolume = 'medium',
    uniqueKey = [],
    partitionBy = null,
    clusterBy = [],
    backfillRequired = false,
    outputDir = 'incremental-model-setup'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Incremental Model Setup: ${modelName}`);
  ctx.log('info', `Data Warehouse: ${dataWarehouse}`);
  ctx.log('info', `Incremental Strategy: ${incrementalStrategy}`);
  ctx.log('info', `Update Frequency: ${updateFrequency}`);

  // ============================================================================
  // PHASE 1: INCREMENTAL STRATEGY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing and selecting optimal incremental strategy');

  const strategyAnalysis = await ctx.task(incrementalStrategyAnalysisTask, {
    projectName,
    dataWarehouse,
    modelName,
    sourceModel,
    incrementalStrategy,
    dataVolume,
    updateFrequency,
    uniqueKey,
    outputDir
  });

  artifacts.push(...strategyAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: Incremental strategy "${strategyAnalysis.selectedStrategy}" selected for ${modelName}. Strategy supports: ${strategyAnalysis.capabilities.join(', ')}. Review strategy selection?`,
    title: 'Incremental Strategy Analysis',
    context: {
      runId: ctx.runId,
      modelName,
      selectedStrategy: strategyAnalysis.selectedStrategy,
      capabilities: strategyAnalysis.capabilities,
      tradeoffs: strategyAnalysis.tradeoffs,
      recommendedFor: strategyAnalysis.recommendedFor,
      files: strategyAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: UNIQUE KEY CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring unique keys and deduplication strategy');

  const uniqueKeyConfig = await ctx.task(uniqueKeyConfigurationTask, {
    projectName,
    modelName,
    sourceModel,
    uniqueKey,
    selectedStrategy: strategyAnalysis.selectedStrategy,
    dataWarehouse,
    outputDir
  });

  artifacts.push(...uniqueKeyConfig.artifacts);

  // ============================================================================
  // PHASE 3: INCREMENTAL FILTER LOGIC
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing incremental filter logic and watermarking');

  const filterLogic = await ctx.task(incrementalFilterLogicTask, {
    projectName,
    modelName,
    sourceModel,
    updateFrequency,
    dataWarehouse,
    outputDir
  });

  artifacts.push(...filterLogic.artifacts);

  await ctx.breakpoint({
    question: `Phase 3 Complete: Incremental filter configured with ${filterLogic.filterStrategy} strategy. Watermark field: ${filterLogic.watermarkField}. Lookback period: ${filterLogic.lookbackPeriod}. Proceed with partitioning?`,
    title: 'Incremental Filter Logic Review',
    context: {
      runId: ctx.runId,
      filterStrategy: filterLogic.filterStrategy,
      watermarkField: filterLogic.watermarkField,
      lookbackPeriod: filterLogic.lookbackPeriod,
      filterSQL: filterLogic.filterSQL,
      files: filterLogic.artifacts.map(a => ({ path: a.path, format: 'sql' }))
    }
  });

  // ============================================================================
  // PHASE 4: PARTITIONING STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing table partitioning strategy');

  const partitionStrategy = await ctx.task(partitioningStrategyTask, {
    projectName,
    modelName,
    dataWarehouse,
    partitionBy,
    dataVolume,
    updateFrequency,
    outputDir
  });

  artifacts.push(...partitionStrategy.artifacts);

  // ============================================================================
  // PHASE 5: CLUSTERING CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Configuring clustering keys for query optimization');

  const clusteringConfig = await ctx.task(clusteringConfigurationTask, {
    projectName,
    modelName,
    dataWarehouse,
    clusterBy,
    uniqueKey: uniqueKeyConfig.uniqueKey,
    partitionConfig: partitionStrategy,
    outputDir
  });

  artifacts.push(...clusteringConfig.artifacts);

  await ctx.breakpoint({
    question: `Phase 5 Complete: Partitioning configured on [${partitionStrategy.partitionField}], clustering on [${clusteringConfig.clusterKeys.join(', ')}]. Estimated query performance gain: ${clusteringConfig.estimatedGain}. Review optimization configuration?`,
    title: 'Partitioning and Clustering Review',
    context: {
      runId: ctx.runId,
      partitioning: {
        enabled: partitionStrategy.enabled,
        field: partitionStrategy.partitionField,
        granularity: partitionStrategy.granularity,
        pruningStrategy: partitionStrategy.pruningStrategy
      },
      clustering: {
        enabled: clusteringConfig.enabled,
        keys: clusteringConfig.clusterKeys,
        estimatedGain: clusteringConfig.estimatedGain
      },
      files: [
        ...partitionStrategy.artifacts.map(a => ({ path: a.path, format: 'markdown' })),
        ...clusteringConfig.artifacts.map(a => ({ path: a.path, format: 'markdown' }))
      ]
    }
  });

  // ============================================================================
  // PHASE 6: MODEL IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing incremental model with dbt');

  const modelImplementation = await ctx.task(modelImplementationTask, {
    projectName,
    modelName,
    sourceModel,
    strategyAnalysis,
    uniqueKeyConfig,
    filterLogic,
    partitionStrategy,
    clusteringConfig,
    dataWarehouse,
    outputDir
  });

  artifacts.push(...modelImplementation.artifacts);

  // ============================================================================
  // PHASE 7: INCREMENTAL TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating comprehensive tests for incremental model');

  const testingSuite = await ctx.task(incrementalTestingTask, {
    projectName,
    modelName,
    uniqueKeyConfig,
    filterLogic,
    strategyAnalysis,
    outputDir
  });

  artifacts.push(...testingSuite.artifacts);

  await ctx.breakpoint({
    question: `Phase 7 Complete: Incremental model implemented with ${testingSuite.totalTests} tests covering: uniqueness, completeness, idempotency, and performance. Review model and tests?`,
    title: 'Model Implementation and Testing',
    context: {
      runId: ctx.runId,
      modelPath: modelImplementation.modelPath,
      testCount: testingSuite.totalTests,
      testCategories: testingSuite.testCategories,
      modelConfig: modelImplementation.modelConfig,
      files: [
        { path: modelImplementation.modelPath, format: 'sql', label: 'Incremental Model' },
        { path: modelImplementation.schemaPath, format: 'yaml', label: 'Model Schema & Tests' },
        ...testingSuite.artifacts.map(a => ({ path: a.path, format: 'sql', label: 'Custom Test' }))
      ]
    }
  });

  // ============================================================================
  // PHASE 8: BACKFILL STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 8: Designing backfill and historical data load strategy');

  const backfillStrategy = await ctx.task(backfillStrategyTask, {
    projectName,
    modelName,
    backfillRequired,
    dataVolume,
    partitionStrategy,
    filterLogic,
    dataWarehouse,
    outputDir
  });

  artifacts.push(...backfillStrategy.artifacts);

  if (backfillRequired) {
    await ctx.breakpoint({
      question: `Phase 8 Complete: Backfill strategy designed for ${backfillStrategy.backfillScope}. Approach: ${backfillStrategy.approach}. Estimated duration: ${backfillStrategy.estimatedDuration}. ${backfillStrategy.batchCount} batches planned. Review backfill plan?`,
      title: 'Backfill Strategy Review',
      context: {
        runId: ctx.runId,
        backfillScope: backfillStrategy.backfillScope,
        approach: backfillStrategy.approach,
        batchCount: backfillStrategy.batchCount,
        estimatedDuration: backfillStrategy.estimatedDuration,
        batches: backfillStrategy.batches,
        rollbackPlan: backfillStrategy.rollbackPlan,
        files: backfillStrategy.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: PERFORMANCE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Optimizing incremental model performance');

  const performanceOptimization = await ctx.task(performanceOptimizationTask, {
    projectName,
    modelName,
    modelImplementation,
    strategyAnalysis,
    partitionStrategy,
    clusteringConfig,
    dataWarehouse,
    dataVolume,
    outputDir
  });

  artifacts.push(...performanceOptimization.artifacts);

  // ============================================================================
  // PHASE 10: MONITORING AND OBSERVABILITY
  // ============================================================================

  ctx.log('info', 'Phase 10: Setting up monitoring and observability');

  const monitoring = await ctx.task(monitoringSetupTask, {
    projectName,
    modelName,
    updateFrequency,
    performanceOptimization,
    testingSuite,
    outputDir
  });

  artifacts.push(...monitoring.artifacts);

  await ctx.breakpoint({
    question: `Phase 10 Complete: Performance optimizations applied with estimated ${performanceOptimization.estimatedSpeedupFactor}x speedup. Monitoring configured with ${monitoring.metricCount} metrics and ${monitoring.alertCount} alerts. Review optimization results?`,
    title: 'Performance and Monitoring Review',
    context: {
      runId: ctx.runId,
      optimization: {
        estimatedSpeedupFactor: performanceOptimization.estimatedSpeedupFactor,
        costSavingsPercent: performanceOptimization.costSavingsPercent,
        optimizations: performanceOptimization.appliedOptimizations
      },
      monitoring: {
        metricCount: monitoring.metricCount,
        alertCount: monitoring.alertCount,
        dashboardUrl: monitoring.dashboardUrl,
        metrics: monitoring.metrics
      },
      files: [
        ...performanceOptimization.artifacts.map(a => ({ path: a.path, format: 'markdown' })),
        ...monitoring.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
      ]
    }
  });

  // ============================================================================
  // PHASE 11: VALIDATION AND TESTING
  // ============================================================================

  ctx.log('info', 'Phase 11: Validating incremental model configuration');

  const validation = await ctx.task(incrementalModelValidationTask, {
    projectName,
    modelName,
    modelImplementation,
    strategyAnalysis,
    uniqueKeyConfig,
    filterLogic,
    partitionStrategy,
    clusteringConfig,
    testingSuite,
    backfillStrategy,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  const validationScore = validation.overallScore;
  const validationPassed = validationScore >= 85;

  if (!validationPassed) {
    await ctx.breakpoint({
      question: `Phase 11 Warning: Validation score: ${validationScore}/100 (below threshold of 85). ${validation.issues.length} issue(s) found. Review and address issues?`,
      title: 'Incremental Model Validation Issues',
      context: {
        runId: ctx.runId,
        validationScore,
        passedChecks: validation.passedChecks,
        issues: validation.issues,
        recommendations: validation.recommendations,
        files: validation.artifacts.map(a => ({ path: a.path, format: 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 12: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating comprehensive incremental model documentation');

  const documentation = await ctx.task(documentationGenerationTask, {
    projectName,
    modelName,
    strategyAnalysis,
    uniqueKeyConfig,
    filterLogic,
    partitionStrategy,
    clusteringConfig,
    modelImplementation,
    testingSuite,
    backfillStrategy,
    performanceOptimization,
    monitoring,
    validation,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // FINAL BREAKPOINT: SETUP COMPLETE
  // ============================================================================

  await ctx.breakpoint({
    question: `Incremental Model Setup Complete for "${modelName}"! Validation score: ${validationScore}/100. Model uses ${strategyAnalysis.selectedStrategy} strategy with ${partitionStrategy.enabled ? 'partitioning' : 'no partitioning'} and ${clusteringConfig.enabled ? 'clustering' : 'no clustering'}. Expected performance gain: ${performanceOptimization.estimatedSpeedupFactor}x. Review deliverables?`,
    title: 'Incremental Model Setup Complete',
    context: {
      runId: ctx.runId,
      summary: {
        modelName,
        dataWarehouse,
        validationScore,
        strategy: strategyAnalysis.selectedStrategy,
        uniqueKeyCount: uniqueKeyConfig.uniqueKey.length,
        partitioning: partitionStrategy.enabled ? partitionStrategy.partitionField : 'disabled',
        clustering: clusteringConfig.enabled ? clusteringConfig.clusterKeys.join(', ') : 'disabled',
        testCount: testingSuite.totalTests,
        backfillRequired: backfillRequired,
        estimatedSpeedup: performanceOptimization.estimatedSpeedupFactor,
        costSavings: performanceOptimization.costSavingsPercent
      },
      quickStart: documentation.quickStartSteps,
      runCommands: documentation.runCommands,
      files: [
        { path: documentation.overviewPath, format: 'markdown', label: 'Model Overview' },
        { path: modelImplementation.modelPath, format: 'sql', label: 'Incremental Model SQL' },
        { path: modelImplementation.schemaPath, format: 'yaml', label: 'Model Configuration' },
        { path: documentation.operationalGuidePath, format: 'markdown', label: 'Operational Guide' },
        { path: validation.reportPath, format: 'json', label: 'Validation Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validationPassed && validationScore >= 85,
    projectName,
    modelName,
    dataWarehouse,
    modelConfiguration: {
      modelPath: modelImplementation.modelPath,
      schemaPath: modelImplementation.schemaPath,
      materialization: 'incremental',
      config: modelImplementation.modelConfig
    },
    incrementalStrategy: {
      strategy: strategyAnalysis.selectedStrategy,
      capabilities: strategyAnalysis.capabilities,
      uniqueKey: uniqueKeyConfig.uniqueKey,
      filterStrategy: filterLogic.filterStrategy,
      watermarkField: filterLogic.watermarkField,
      lookbackPeriod: filterLogic.lookbackPeriod
    },
    partitionConfig: {
      enabled: partitionStrategy.enabled,
      field: partitionStrategy.partitionField,
      granularity: partitionStrategy.granularity,
      pruningStrategy: partitionStrategy.pruningStrategy
    },
    clusteringConfig: {
      enabled: clusteringConfig.enabled,
      keys: clusteringConfig.clusterKeys,
      estimatedGain: clusteringConfig.estimatedGain
    },
    backfillPlan: {
      required: backfillRequired,
      scope: backfillStrategy.backfillScope,
      approach: backfillStrategy.approach,
      batchCount: backfillStrategy.batchCount,
      estimatedDuration: backfillStrategy.estimatedDuration,
      batches: backfillStrategy.batches
    },
    testing: {
      totalTests: testingSuite.totalTests,
      testCategories: testingSuite.testCategories,
      coveragePercentage: testingSuite.coveragePercentage
    },
    performance: {
      estimatedSpeedupFactor: performanceOptimization.estimatedSpeedupFactor,
      costSavingsPercent: performanceOptimization.costSavingsPercent,
      appliedOptimizations: performanceOptimization.appliedOptimizations,
      benchmarkResults: performanceOptimization.benchmarkResults
    },
    monitoring: {
      metricCount: monitoring.metricCount,
      alertCount: monitoring.alertCount,
      dashboardUrl: monitoring.dashboardUrl,
      metrics: monitoring.metrics
    },
    validation: {
      overallScore: validationScore,
      passedChecks: validation.passedChecks,
      issues: validation.issues,
      recommendations: validation.recommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/data-engineering-analytics/incremental-model',
      timestamp: startTime,
      updateFrequency,
      dataVolume
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Incremental Strategy Analysis
export const incrementalStrategyAnalysisTask = defineTask('incremental-strategy-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Incremental Strategy Analysis - ${args.modelName}`,
  agent: {
    name: 'incremental-strategy-architect',
    prompt: {
      role: 'Senior Analytics Engineer specializing in incremental data processing',
      task: 'Analyze requirements and select optimal incremental strategy',
      context: {
        projectName: args.projectName,
        dataWarehouse: args.dataWarehouse,
        modelName: args.modelName,
        sourceModel: args.sourceModel,
        incrementalStrategy: args.incrementalStrategy,
        dataVolume: args.dataVolume,
        updateFrequency: args.updateFrequency,
        uniqueKey: args.uniqueKey,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate incremental strategy options available for the data warehouse',
        '2. APPEND-ONLY strategy: insert new rows only, no updates/deletes, fastest',
        '3. MERGE strategy: upsert pattern, handles updates and deletes, most flexible',
        '4. DELETE+INSERT strategy: atomic replace of matching rows, simple and predictable',
        '5. INSERT_OVERWRITE strategy: partition-level replacement (BigQuery)',
        '6. Analyze data characteristics: insert-only vs update/delete patterns',
        '7. Consider data volume impact on strategy performance',
        '8. Evaluate complexity vs performance tradeoffs',
        '9. Assess unique key requirements for each strategy',
        '10. Document strategy capabilities and limitations',
        '11. Recommend optimal strategy based on requirements',
        '12. Create strategy comparison guide and save to output directory'
      ],
      outputFormat: 'JSON with selected strategy, capabilities, tradeoffs, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedStrategy', 'capabilities', 'tradeoffs', 'recommendedFor', 'artifacts'],
      properties: {
        selectedStrategy: {
          type: 'string',
          enum: ['append', 'merge', 'delete+insert', 'insert_overwrite']
        },
        capabilities: {
          type: 'array',
          items: { type: 'string' }
        },
        tradeoffs: {
          type: 'object',
          properties: {
            performance: { type: 'string' },
            complexity: { type: 'string' },
            storageEfficiency: { type: 'string' },
            updateSupport: { type: 'boolean' },
            deleteSupport: { type: 'boolean' }
          }
        },
        recommendedFor: {
          type: 'array',
          items: { type: 'string' }
        },
        strategyComparison: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strategy: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              useCases: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        warehouseSpecificNotes: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'incremental', 'strategy', 'data-engineering']
}));

// Phase 2: Unique Key Configuration
export const uniqueKeyConfigurationTask = defineTask('unique-key-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Unique Key Configuration - ${args.modelName}`,
  agent: {
    name: 'unique-key-engineer',
    prompt: {
      role: 'Data Engineer specializing in data deduplication and key design',
      task: 'Configure unique keys and deduplication strategy for incremental model',
      context: {
        projectName: args.projectName,
        modelName: args.modelName,
        sourceModel: args.sourceModel,
        uniqueKey: args.uniqueKey,
        selectedStrategy: args.selectedStrategy,
        dataWarehouse: args.dataWarehouse,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify natural unique key(s) from business requirements',
        '2. For composite keys: combine multiple columns (e.g., [order_id, line_item_id])',
        '3. Validate unique key uniqueness using source data analysis',
        '4. Consider surrogate key generation if no natural key exists',
        '5. Document unique key selection rationale',
        '6. Configure unique_key in dbt model config',
        '7. For merge strategy: define how conflicts are resolved (most recent wins)',
        '8. For delete+insert: ensure unique key covers full grain of model',
        '9. Add unique key validation tests',
        '10. Document edge cases (null keys, duplicate handling)',
        '11. Create deduplication logic if source has duplicates',
        '12. Save unique key configuration and validation guide'
      ],
      outputFormat: 'JSON with unique key configuration and validation strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['uniqueKey', 'keyType', 'deduplicationStrategy', 'artifacts'],
      properties: {
        uniqueKey: {
          type: 'array',
          items: { type: 'string' }
        },
        keyType: {
          type: 'string',
          enum: ['natural', 'surrogate', 'composite']
        },
        keySelectionRationale: { type: 'string' },
        deduplicationStrategy: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            approach: { type: 'string' },
            tieBreaker: { type: 'string' },
            nullHandling: { type: 'string' }
          }
        },
        conflictResolution: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            timestampField: { type: 'string' },
            rule: { type: 'string' }
          }
        },
        validationChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              sql: { type: 'string' }
            }
          }
        },
        edgeCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              handling: { type: 'string' }
            }
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
  labels: ['dbt', 'incremental', 'unique-key', 'deduplication']
}));

// Phase 3: Incremental Filter Logic
export const incrementalFilterLogicTask = defineTask('incremental-filter-logic', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Incremental Filter Logic - ${args.modelName}`,
  agent: {
    name: 'filter-logic-engineer',
    prompt: {
      role: 'Analytics Engineer specializing in incremental data processing',
      task: 'Design incremental filter logic and watermarking strategy',
      context: {
        projectName: args.projectName,
        modelName: args.modelName,
        sourceModel: args.sourceModel,
        updateFrequency: args.updateFrequency,
        dataWarehouse: args.dataWarehouse,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify watermark field for incremental filtering (created_at, updated_at, event_timestamp)',
        '2. Use is_incremental() macro to conditionally filter on incremental runs',
        '3. Design WHERE clause: watermark_field > (select max(watermark_field) from {{ this }})',
        '4. Add lookback period for late-arriving data (e.g., 3 hours, 1 day)',
        '5. Handle first run vs incremental run logic',
        '6. Consider time zone handling and UTC standardization',
        '7. For hourly updates: filter on hour-level granularity',
        '8. For daily updates: filter on day-level granularity',
        '9. Add safety checks to prevent full table scans',
        '10. Document filter logic and edge cases',
        '11. Create filter performance optimization guide',
        '12. Generate filter SQL examples and save to output directory'
      ],
      outputFormat: 'JSON with filter strategy, watermark configuration, and SQL'
    },
    outputSchema: {
      type: 'object',
      required: ['filterStrategy', 'watermarkField', 'lookbackPeriod', 'filterSQL', 'artifacts'],
      properties: {
        filterStrategy: {
          type: 'string',
          enum: ['watermark', 'partition-based', 'timestamp-range', 'custom']
        },
        watermarkField: { type: 'string' },
        watermarkDataType: { type: 'string' },
        lookbackPeriod: { type: 'string' },
        lookbackRationale: { type: 'string' },
        filterSQL: { type: 'string' },
        firstRunLogic: { type: 'string' },
        incrementalRunLogic: { type: 'string' },
        timeZoneHandling: {
          type: 'object',
          properties: {
            sourceTimeZone: { type: 'string' },
            targetTimeZone: { type: 'string' },
            conversionRequired: { type: 'boolean' }
          }
        },
        lateArrivingDataHandling: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            maxLateness: { type: 'string' },
            reprocessingLogic: { type: 'string' }
          }
        },
        edgeCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              handling: { type: 'string' }
            }
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
  labels: ['dbt', 'incremental', 'filter-logic', 'watermarking']
}));

// Phase 4: Partitioning Strategy
export const partitioningStrategyTask = defineTask('partitioning-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Partitioning Strategy - ${args.modelName}`,
  agent: {
    name: 'partitioning-architect',
    prompt: {
      role: 'Data Warehouse Architect specializing in table partitioning',
      task: 'Design optimal table partitioning strategy',
      context: {
        projectName: args.projectName,
        modelName: args.modelName,
        dataWarehouse: args.dataWarehouse,
        partitionBy: args.partitionBy,
        dataVolume: args.dataVolume,
        updateFrequency: args.updateFrequency,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate partitioning benefits for the data warehouse platform',
        '2. Snowflake: supports clustering, not traditional partitioning',
        '3. BigQuery: supports date/timestamp/integer range partitioning',
        '4. Redshift: supports distribution and sort keys',
        '5. Databricks: supports partitioning on columns',
        '6. Select partition field (typically date/timestamp column)',
        '7. Choose partition granularity: day, month, year (day most common)',
        '8. Document partition pruning benefits and query patterns',
        '9. Configure partition expiration/retention policies if supported',
        '10. Add partition field to model configuration',
        '11. Consider partition skew and data distribution',
        '12. Create partitioning best practices guide and save to output directory'
      ],
      outputFormat: 'JSON with partitioning configuration and strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['enabled', 'partitionField', 'granularity', 'pruningStrategy', 'artifacts'],
      properties: {
        enabled: { type: 'boolean' },
        partitionField: { type: 'string' },
        partitionDataType: { type: 'string' },
        granularity: {
          type: 'string',
          enum: ['hour', 'day', 'month', 'year', 'integer-range', 'not-applicable']
        },
        warehouseImplementation: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            method: { type: 'string' },
            config: { type: 'object' }
          }
        },
        pruningStrategy: { type: 'string' },
        retentionPolicy: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            retentionDays: { type: 'number' },
            expirationStrategy: { type: 'string' }
          }
        },
        benefits: {
          type: 'object',
          properties: {
            queryPerformance: { type: 'string' },
            costReduction: { type: 'string' },
            dataManagement: { type: 'string' }
          }
        },
        partitionSkewAnalysis: {
          type: 'object',
          properties: {
            riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
            mitigation: { type: 'string' }
          }
        },
        queryPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              partitionPruning: { type: 'boolean' }
            }
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
  labels: ['dbt', 'incremental', 'partitioning', 'optimization']
}));

// Phase 5: Clustering Configuration
export const clusteringConfigurationTask = defineTask('clustering-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Clustering Configuration - ${args.modelName}`,
  agent: {
    name: 'clustering-engineer',
    prompt: {
      role: 'Performance Engineer specializing in data warehouse optimization',
      task: 'Configure clustering keys for query optimization',
      context: {
        projectName: args.projectName,
        modelName: args.modelName,
        dataWarehouse: args.dataWarehouse,
        clusterBy: args.clusterBy,
        uniqueKey: args.uniqueKey,
        partitionConfig: args.partitionConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate clustering support for the data warehouse',
        '2. Snowflake: supports automatic clustering on up to 4 columns',
        '3. BigQuery: supports clustering on up to 4 columns',
        '4. Redshift: uses sort keys (compound or interleaved)',
        '5. Select clustering keys based on query WHERE/JOIN patterns',
        '6. Prioritize high-cardinality columns used in filters',
        '7. Consider column order: most frequently filtered first',
        '8. Balance clustering depth vs maintenance costs',
        '9. Document expected query performance gains',
        '10. Add clustering configuration to model config',
        '11. Create clustering maintenance and monitoring guide',
        '12. Generate clustering best practices documentation'
      ],
      outputFormat: 'JSON with clustering configuration and benefits'
    },
    outputSchema: {
      type: 'object',
      required: ['enabled', 'clusterKeys', 'estimatedGain', 'artifacts'],
      properties: {
        enabled: { type: 'boolean' },
        clusterKeys: {
          type: 'array',
          items: { type: 'string' }
        },
        keySelectionRationale: { type: 'string' },
        keyOrder: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              priority: { type: 'number' },
              reason: { type: 'string' }
            }
          }
        },
        warehouseImplementation: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            method: { type: 'string' },
            config: { type: 'object' }
          }
        },
        estimatedGain: { type: 'string' },
        queryPatternAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              queryPattern: { type: 'string' },
              clusteringBenefit: { type: 'string' }
            }
          }
        },
        maintenanceCost: {
          type: 'object',
          properties: {
            automaticReclustering: { type: 'boolean' },
            estimatedCost: { type: 'string' }
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
  labels: ['dbt', 'incremental', 'clustering', 'performance']
}));

// Phase 6: Model Implementation
export const modelImplementationTask = defineTask('model-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Model Implementation - ${args.modelName}`,
  agent: {
    name: 'model-developer',
    prompt: {
      role: 'Senior dbt Developer',
      task: 'Implement incremental model with full configuration',
      context: {
        projectName: args.projectName,
        modelName: args.modelName,
        sourceModel: args.sourceModel,
        strategyAnalysis: args.strategyAnalysis,
        uniqueKeyConfig: args.uniqueKeyConfig,
        filterLogic: args.filterLogic,
        partitionStrategy: args.partitionStrategy,
        clusteringConfig: args.clusteringConfig,
        dataWarehouse: args.dataWarehouse,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create dbt model SQL file with proper structure',
        '2. Add model config block with materialization=incremental',
        '3. Configure incremental_strategy from strategy analysis',
        '4. Add unique_key configuration',
        '5. Add partition and clustering configuration',
        '6. Implement incremental filter logic using is_incremental() macro',
        '7. Write main SELECT query from source model',
        '8. Add column-level transformations and business logic',
        '9. Include proper CTEs for readability',
        '10. Add inline comments explaining incremental logic',
        '11. Create schema YAML with model documentation and tests',
        '12. Save model SQL and schema files to models directory'
      ],
      outputFormat: 'JSON with model file paths and configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['modelPath', 'schemaPath', 'modelConfig', 'artifacts'],
      properties: {
        modelPath: { type: 'string' },
        schemaPath: { type: 'string' },
        modelConfig: {
          type: 'object',
          properties: {
            materialized: { type: 'string' },
            incremental_strategy: { type: 'string' },
            unique_key: { type: 'array', items: { type: 'string' } },
            partition_by: { type: 'object' },
            cluster_by: { type: 'array', items: { type: 'string' } },
            on_schema_change: { type: 'string' }
          }
        },
        modelSQL: { type: 'string' },
        schemaYAML: { type: 'string' },
        linesOfCode: { type: 'number' },
        dependencies: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'incremental', 'model-implementation', 'development']
}));

// Phase 7: Incremental Testing
export const incrementalTestingTask = defineTask('incremental-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Incremental Testing - ${args.modelName}`,
  agent: {
    name: 'test-engineer',
    prompt: {
      role: 'Data Quality Engineer specializing in incremental model testing',
      task: 'Create comprehensive test suite for incremental model',
      context: {
        projectName: args.projectName,
        modelName: args.modelName,
        uniqueKeyConfig: args.uniqueKeyConfig,
        filterLogic: args.filterLogic,
        strategyAnalysis: args.strategyAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Add unique test on unique_key columns',
        '2. Add not_null tests on unique_key and critical columns',
        '3. Create idempotency test: run twice, compare results',
        '4. Create completeness test: verify no missing data',
        '5. Add freshness test on watermark field',
        '6. Create duplicate detection test',
        '7. Add referential integrity tests to source',
        '8. Create late-arriving data test',
        '9. Add incremental vs full refresh comparison test',
        '10. Create performance benchmark test',
        '11. Add schema change handling tests',
        '12. Document test coverage and save test files'
      ],
      outputFormat: 'JSON with test configuration and coverage'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'testCategories', 'coveragePercentage', 'artifacts'],
      properties: {
        totalTests: { type: 'number' },
        testCategories: {
          type: 'array',
          items: { type: 'string' }
        },
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              testType: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['error', 'warn'] }
            }
          }
        },
        coveragePercentage: { type: 'number' },
        idempotencyTest: {
          type: 'object',
          properties: {
            implemented: { type: 'boolean' },
            approach: { type: 'string' }
          }
        },
        performanceBenchmark: {
          type: 'object',
          properties: {
            implemented: { type: 'boolean' },
            baselineMetrics: { type: 'object' }
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
  labels: ['dbt', 'incremental', 'testing', 'data-quality']
}));

// Phase 8: Backfill Strategy
export const backfillStrategyTask = defineTask('backfill-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Backfill Strategy - ${args.modelName}`,
  agent: {
    name: 'backfill-architect',
    prompt: {
      role: 'Data Operations Engineer specializing in data migrations',
      task: 'Design backfill and historical data load strategy',
      context: {
        projectName: args.projectName,
        modelName: args.modelName,
        backfillRequired: args.backfillRequired,
        dataVolume: args.dataVolume,
        partitionStrategy: args.partitionStrategy,
        filterLogic: args.filterLogic,
        dataWarehouse: args.dataWarehouse,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess backfill requirements and historical data scope',
        '2. Choose backfill approach: full-refresh once, or batched incremental loads',
        '3. For large volumes: design batch processing strategy (by date ranges)',
        '4. Calculate optimal batch size based on warehouse capacity',
        '5. Design batch ordering: oldest-to-newest or newest-to-oldest',
        '6. Create backfill execution plan with dbt commands',
        '7. Add monitoring and progress tracking',
        '8. Design rollback strategy in case of failure',
        '9. Plan for validation after backfill completion',
        '10. Document backfill duration estimates',
        '11. Create backfill scripts and automation',
        '12. Generate comprehensive backfill runbook'
      ],
      outputFormat: 'JSON with backfill plan and execution strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['backfillScope', 'approach', 'batchCount', 'estimatedDuration', 'artifacts'],
      properties: {
        backfillScope: { type: 'string' },
        approach: {
          type: 'string',
          enum: ['full-refresh-once', 'batched-incremental', 'partition-backfill', 'no-backfill']
        },
        batchCount: { type: 'number' },
        batchSize: { type: 'string' },
        batches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              batchId: { type: 'number' },
              dateRange: { type: 'string' },
              command: { type: 'string' },
              estimatedDuration: { type: 'string' }
            }
          }
        },
        estimatedDuration: { type: 'string' },
        executionOrder: { type: 'string' },
        monitoring: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            metrics: { type: 'array', items: { type: 'string' } }
          }
        },
        rollbackPlan: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            steps: { type: 'array', items: { type: 'string' } }
          }
        },
        validation: {
          type: 'object',
          properties: {
            postBackfillChecks: { type: 'array', items: { type: 'string' } },
            dataReconciliation: { type: 'string' }
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
  labels: ['dbt', 'incremental', 'backfill', 'data-operations']
}));

// Phase 9: Performance Optimization
export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Performance Optimization - ${args.modelName}`,
  agent: {
    name: 'performance-optimizer',
    prompt: {
      role: 'Performance Engineer specializing in data warehouse optimization',
      task: 'Optimize incremental model for maximum performance',
      context: {
        projectName: args.projectName,
        modelName: args.modelName,
        modelImplementation: args.modelImplementation,
        strategyAnalysis: args.strategyAnalysis,
        partitionStrategy: args.partitionStrategy,
        clusteringConfig: args.clusteringConfig,
        dataWarehouse: args.dataWarehouse,
        dataVolume: args.dataVolume,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Optimize incremental filter for minimal data scanning',
        '2. Add appropriate indexes for merge operations',
        '3. Optimize JOIN order and conditions',
        '4. Consider materialized CTEs for complex logic',
        '5. Minimize column count in intermediate steps',
        '6. Use warehouse-specific optimization hints',
        '7. Configure appropriate warehouse size/compute',
        '8. Add pre-hooks and post-hooks for optimization',
        '9. Benchmark query performance: incremental vs full refresh',
        '10. Document expected runtime and cost savings',
        '11. Create performance tuning guide',
        '12. Generate optimization recommendations report'
      ],
      outputFormat: 'JSON with optimization results and benchmarks'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedSpeedupFactor', 'costSavingsPercent', 'appliedOptimizations', 'artifacts'],
      properties: {
        estimatedSpeedupFactor: { type: 'number' },
        costSavingsPercent: { type: 'number' },
        appliedOptimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optimization: { type: 'string' },
              impact: { type: 'string' },
              implementation: { type: 'string' }
            }
          }
        },
        benchmarkResults: {
          type: 'object',
          properties: {
            fullRefreshTime: { type: 'string' },
            incrementalRunTime: { type: 'string' },
            speedupFactor: { type: 'number' },
            dataScanned: { type: 'object' }
          }
        },
        warehouseSizing: {
          type: 'object',
          properties: {
            recommended: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        furtherOptimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optimization: { type: 'string' },
              potentialGain: { type: 'string' },
              complexity: { type: 'string' }
            }
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
  labels: ['dbt', 'incremental', 'performance', 'optimization']
}));

// Phase 10: Monitoring Setup
export const monitoringSetupTask = defineTask('monitoring-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Monitoring Setup - ${args.modelName}`,
  agent: {
    name: 'monitoring-engineer',
    prompt: {
      role: 'SRE Engineer specializing in data pipeline observability',
      task: 'Set up monitoring and observability for incremental model',
      context: {
        projectName: args.projectName,
        modelName: args.modelName,
        updateFrequency: args.updateFrequency,
        performanceOptimization: args.performanceOptimization,
        testingSuite: args.testingSuite,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure dbt model execution time tracking',
        '2. Set up freshness monitoring on model output',
        '3. Add row count change monitoring',
        '4. Monitor incremental vs full data volume',
        '5. Track test failure alerts',
        '6. Set up query performance dashboards',
        '7. Configure cost monitoring per run',
        '8. Add data quality metric tracking',
        '9. Set up alerting for anomalies (row count spikes, runtime increases)',
        '10. Create operational dashboard',
        '11. Document monitoring thresholds and escalation',
        '12. Generate monitoring runbook and alert guide'
      ],
      outputFormat: 'JSON with monitoring configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['metricCount', 'alertCount', 'metrics', 'artifacts'],
      properties: {
        metricCount: { type: 'number' },
        alertCount: { type: 'number' },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              type: { type: 'string' },
              threshold: { type: 'object' },
              alerting: { type: 'boolean' }
            }
          }
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alertName: { type: 'string' },
              condition: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
              notification: { type: 'string' }
            }
          }
        },
        dashboardUrl: { type: 'string' },
        freshnessCheck: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            warnAfter: { type: 'string' },
            errorAfter: { type: 'string' }
          }
        },
        anomalyDetection: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            methods: { type: 'array', items: { type: 'string' } }
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
  labels: ['dbt', 'incremental', 'monitoring', 'observability']
}));

// Phase 11: Incremental Model Validation
export const incrementalModelValidationTask = defineTask('incremental-model-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Model Validation - ${args.modelName}`,
  agent: {
    name: 'validation-specialist',
    prompt: {
      role: 'Data Quality Specialist',
      task: 'Validate incremental model configuration and best practices',
      context: {
        projectName: args.projectName,
        modelName: args.modelName,
        modelImplementation: args.modelImplementation,
        strategyAnalysis: args.strategyAnalysis,
        uniqueKeyConfig: args.uniqueKeyConfig,
        filterLogic: args.filterLogic,
        partitionStrategy: args.partitionStrategy,
        clusteringConfig: args.clusteringConfig,
        testingSuite: args.testingSuite,
        backfillStrategy: args.backfillStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate incremental strategy is appropriate for use case',
        '2. Check unique_key is properly configured and tested',
        '3. Verify incremental filter logic handles edge cases',
        '4. Validate partition configuration follows best practices',
        '5. Check clustering keys align with query patterns',
        '6. Verify test coverage meets minimum threshold (>80%)',
        '7. Check idempotency: multiple runs produce same result',
        '8. Validate late-arriving data handling',
        '9. Check documentation completeness',
        '10. Verify backfill strategy is sound',
        '11. Validate monitoring and alerting setup',
        '12. Generate comprehensive validation report with score'
      ],
      outputFormat: 'JSON with validation results and recommendations'
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
            strategyConfiguration: { type: 'number' },
            uniqueKeySetup: { type: 'number' },
            filterLogic: { type: 'number' },
            partitioning: { type: 'number' },
            clustering: { type: 'number' },
            testing: { type: 'number' },
            documentation: { type: 'number' },
            monitoring: { type: 'number' }
          }
        },
        passedChecks: {
          type: 'array',
          items: { type: 'string' }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        bestPracticesCompliance: {
          type: 'object',
          properties: {
            dbtBestPractices: { type: 'number' },
            warehouseBestPractices: { type: 'number' },
            performanceOptimization: { type: 'number' }
          }
        },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'incremental', 'validation', 'quality-assurance']
}));

// Phase 12: Documentation Generation
export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Documentation - ${args.modelName}`,
  agent: {
    name: 'documentation-writer',
    prompt: {
      role: 'Technical Writer specializing in data engineering',
      task: 'Generate comprehensive incremental model documentation',
      context: {
        projectName: args.projectName,
        modelName: args.modelName,
        strategyAnalysis: args.strategyAnalysis,
        uniqueKeyConfig: args.uniqueKeyConfig,
        filterLogic: args.filterLogic,
        partitionStrategy: args.partitionStrategy,
        clusteringConfig: args.clusteringConfig,
        modelImplementation: args.modelImplementation,
        testingSuite: args.testingSuite,
        backfillStrategy: args.backfillStrategy,
        performanceOptimization: args.performanceOptimization,
        monitoring: args.monitoring,
        validation: args.validation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create model overview with purpose and business context',
        '2. Document incremental strategy and rationale',
        '3. Explain unique key selection and deduplication logic',
        '4. Document incremental filter logic and watermarking',
        '5. Describe partitioning and clustering strategy',
        '6. Document backfill procedures',
        '7. List all tests and data quality checks',
        '8. Create operational runbook with common scenarios',
        '9. Document monitoring metrics and alerting',
        '10. Add troubleshooting guide for common issues',
        '11. Create quick start guide with dbt commands',
        '12. Generate comprehensive markdown documentation'
      ],
      outputFormat: 'JSON with documentation file paths'
    },
    outputSchema: {
      type: 'object',
      required: ['overviewPath', 'operationalGuidePath', 'quickStartSteps', 'runCommands', 'artifacts'],
      properties: {
        overviewPath: { type: 'string' },
        operationalGuidePath: { type: 'string' },
        troubleshootingGuidePath: { type: 'string' },
        quickStartSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        runCommands: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              command: { type: 'string' },
              purpose: { type: 'string' },
              example: { type: 'string' }
            }
          }
        },
        commonIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              solution: { type: 'string' }
            }
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
  labels: ['dbt', 'incremental', 'documentation', 'knowledge-sharing']
}));
