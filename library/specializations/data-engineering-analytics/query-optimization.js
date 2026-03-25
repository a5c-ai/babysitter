/**
 * @process specializations/data-engineering-analytics/query-optimization
 * @description Query Performance Optimization - Comprehensive query performance analysis and optimization covering profiling,
 * indexing strategies, partitioning, query rewriting, materialized views, and caching for optimal database performance.
 * @specialization Data Engineering & Analytics
 * @category Query Optimization
 * @inputs { database: string, workloadType?: string, querySet?: array, performanceTargets?: object, enableAutoOptimization?: boolean }
 * @outputs { success: boolean, profilingResults: object, optimizationPlan: object, implementations: array, performanceGains: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/data-engineering-analytics/query-optimization', {
 *   database: 'PostgreSQL',
 *   workloadType: 'OLAP',
 *   querySet: ['SELECT * FROM orders WHERE ...', 'SELECT customer_id, SUM(amount) ...'],
 *   performanceTargets: {
 *     p95Latency: 500,
 *     throughput: 1000,
 *     cacheHitRate: 0.8
 *   },
 *   enableAutoOptimization: true,
 *   optimizationAreas: ['indexing', 'partitioning', 'materialization', 'caching']
 * });
 *
 * @references
 * - Query Optimization Best Practices: https://use-the-index-luke.com/
 * - PostgreSQL Performance: https://wiki.postgresql.org/wiki/Performance_Optimization
 * - MySQL Query Optimization: https://dev.mysql.com/doc/refman/8.0/en/optimization.html
 * - SQL Server Performance: https://docs.microsoft.com/en-us/sql/relational-databases/performance/
 * - Database Indexing Strategies: https://planet.postgresql.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    database,
    workloadType = 'mixed', // 'OLAP', 'OLTP', 'mixed'
    querySet = [],
    performanceTargets = {
      p95Latency: 1000, // milliseconds
      throughput: 500, // queries per second
      cacheHitRate: 0.7
    },
    enableAutoOptimization = false,
    optimizationAreas = ['indexing', 'partitioning', 'materialization', 'caching', 'rewriting'],
    outputDir = 'query-optimization'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Query Performance Optimization for ${database}`);
  ctx.log('info', `Workload Type: ${workloadType}`);
  ctx.log('info', `Optimization Areas: ${optimizationAreas.join(', ')}`);
  ctx.log('info', `Query Set: ${querySet.length} queries to analyze`);

  // ============================================================================
  // PHASE 1: QUERY PROFILING AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Profiling queries and analyzing execution patterns');

  const profilingResults = await ctx.task(queryProfilingTask, {
    database,
    workloadType,
    querySet,
    performanceTargets,
    outputDir
  });

  artifacts.push(...profilingResults.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: Profiled ${profilingResults.queriesAnalyzed} queries. Identified ${profilingResults.slowQueries} slow queries and ${profilingResults.bottlenecks.length} performance bottlenecks. Review profiling results?`,
    title: 'Query Profiling Complete',
    context: {
      runId: ctx.runId,
      database,
      profilingMetrics: {
        queriesAnalyzed: profilingResults.queriesAnalyzed,
        slowQueries: profilingResults.slowQueries,
        avgExecutionTime: profilingResults.avgExecutionTime,
        p95Latency: profilingResults.p95Latency,
        p99Latency: profilingResults.p99Latency
      },
      bottlenecks: profilingResults.bottlenecks,
      files: profilingResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 2: EXECUTION PLAN ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing query execution plans');

  const executionPlanAnalysis = await ctx.task(executionPlanAnalysisTask, {
    database,
    querySet,
    profilingResults,
    outputDir
  });

  artifacts.push(...executionPlanAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: INDEXING STRATEGY DEVELOPMENT
  // ============================================================================

  let indexingStrategy = null;
  if (optimizationAreas.includes('indexing')) {
    ctx.log('info', 'Phase 3: Developing indexing strategy');

    indexingStrategy = await ctx.task(indexingStrategyTask, {
      database,
      workloadType,
      executionPlanAnalysis,
      profilingResults,
      outputDir
    });

    artifacts.push(...indexingStrategy.artifacts);

    await ctx.breakpoint({
      question: `Phase 3 Complete: Developed indexing strategy with ${indexingStrategy.recommendedIndexes.length} index recommendations. Estimated performance gain: ${indexingStrategy.estimatedGain}. Review indexing recommendations?`,
      title: 'Indexing Strategy Review',
      context: {
        runId: ctx.runId,
        indexingMetrics: {
          recommendedIndexes: indexingStrategy.recommendedIndexes.length,
          coveringIndexes: indexingStrategy.coveringIndexes,
          compositeIndexes: indexingStrategy.compositeIndexes,
          estimatedGain: indexingStrategy.estimatedGain,
          estimatedStorageImpact: indexingStrategy.storageImpact
        },
        topRecommendations: indexingStrategy.recommendedIndexes.slice(0, 10),
        files: indexingStrategy.artifacts.map(a => ({ path: a.path, format: a.format || 'sql' }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: PARTITIONING STRATEGY
  // ============================================================================

  let partitioningStrategy = null;
  if (optimizationAreas.includes('partitioning')) {
    ctx.log('info', 'Phase 4: Designing partitioning strategy');

    partitioningStrategy = await ctx.task(partitioningStrategyTask, {
      database,
      workloadType,
      executionPlanAnalysis,
      profilingResults,
      outputDir
    });

    artifacts.push(...partitioningStrategy.artifacts);
  }

  // ============================================================================
  // PHASE 5: QUERY REWRITING AND OPTIMIZATION
  // ============================================================================

  let queryRewriting = null;
  if (optimizationAreas.includes('rewriting')) {
    ctx.log('info', 'Phase 5: Rewriting queries for optimal performance');

    queryRewriting = await ctx.task(queryRewritingTask, {
      database,
      workloadType,
      querySet,
      executionPlanAnalysis,
      profilingResults,
      outputDir
    });

    artifacts.push(...queryRewriting.artifacts);

    await ctx.breakpoint({
      question: `Phase 5 Complete: Rewrote ${queryRewriting.rewrittenQueries} queries. Average performance improvement: ${queryRewriting.avgImprovement}. Review query optimizations?`,
      title: 'Query Rewriting Review',
      context: {
        runId: ctx.runId,
        rewritingMetrics: {
          rewrittenQueries: queryRewriting.rewrittenQueries,
          avgImprovement: queryRewriting.avgImprovement,
          maxImprovement: queryRewriting.maxImprovement,
          optimizationPatterns: queryRewriting.patternsApplied
        },
        topOptimizations: queryRewriting.optimizations.slice(0, 5),
        files: queryRewriting.artifacts.map(a => ({ path: a.path, format: 'sql' }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: MATERIALIZED VIEWS STRATEGY
  // ============================================================================

  let materializationStrategy = null;
  if (optimizationAreas.includes('materialization')) {
    ctx.log('info', 'Phase 6: Designing materialized views strategy');

    materializationStrategy = await ctx.task(materializationStrategyTask, {
      database,
      workloadType,
      querySet,
      executionPlanAnalysis,
      profilingResults,
      outputDir
    });

    artifacts.push(...materializationStrategy.artifacts);
  }

  // ============================================================================
  // PHASE 7: CACHING STRATEGY
  // ============================================================================

  let cachingStrategy = null;
  if (optimizationAreas.includes('caching')) {
    ctx.log('info', 'Phase 7: Developing caching strategy');

    cachingStrategy = await ctx.task(cachingStrategyTask, {
      database,
      workloadType,
      querySet,
      profilingResults,
      performanceTargets,
      outputDir
    });

    artifacts.push(...cachingStrategy.artifacts);

    await ctx.breakpoint({
      question: `Phase 7 Complete: Developed ${cachingStrategy.cachingLayers.length}-tier caching strategy. Projected cache hit rate: ${cachingStrategy.projectedHitRate}. Review caching recommendations?`,
      title: 'Caching Strategy Review',
      context: {
        runId: ctx.runId,
        cachingMetrics: {
          cachingLayers: cachingStrategy.cachingLayers.length,
          projectedHitRate: cachingStrategy.projectedHitRate,
          cacheableQueries: cachingStrategy.cacheableQueries,
          estimatedLatencyReduction: cachingStrategy.estimatedLatencyReduction
        },
        cachingLayers: cachingStrategy.cachingLayers,
        files: cachingStrategy.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: DATABASE CONFIGURATION TUNING
  // ============================================================================

  ctx.log('info', 'Phase 8: Tuning database configuration parameters');

  const configurationTuning = await ctx.task(configurationTuningTask, {
    database,
    workloadType,
    profilingResults,
    performanceTargets,
    outputDir
  });

  artifacts.push(...configurationTuning.artifacts);

  // ============================================================================
  // PHASE 9: STATISTICS AND MAINTENANCE
  // ============================================================================

  ctx.log('info', 'Phase 9: Configuring statistics collection and maintenance');

  const statisticsMaintenance = await ctx.task(statisticsMaintenanceTask, {
    database,
    executionPlanAnalysis,
    indexingStrategy,
    outputDir
  });

  artifacts.push(...statisticsMaintenance.artifacts);

  // ============================================================================
  // PHASE 10: PERFORMANCE MONITORING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 10: Setting up performance monitoring and alerting');

  const performanceMonitoring = await ctx.task(performanceMonitoringTask, {
    database,
    performanceTargets,
    optimizationAreas,
    outputDir
  });

  artifacts.push(...performanceMonitoring.artifacts);

  // ============================================================================
  // PHASE 11: OPTIMIZATION PLAN GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating comprehensive optimization plan');

  const optimizationPlan = await ctx.task(optimizationPlanTask, {
    database,
    workloadType,
    profilingResults,
    executionPlanAnalysis,
    indexingStrategy,
    partitioningStrategy,
    queryRewriting,
    materializationStrategy,
    cachingStrategy,
    configurationTuning,
    statisticsMaintenance,
    performanceMonitoring,
    performanceTargets,
    outputDir
  });

  artifacts.push(...optimizationPlan.artifacts);

  // ============================================================================
  // PHASE 12: IMPLEMENTATION AUTOMATION (if enabled)
  // ============================================================================

  let implementationResults = null;
  if (enableAutoOptimization) {
    ctx.log('info', 'Phase 12: Implementing automated optimizations');

    await ctx.breakpoint({
      question: `Ready to implement automated optimizations. This will apply ${optimizationPlan.autoApplicableOptimizations} safe optimizations. Proceed with implementation?`,
      title: 'Automated Optimization Confirmation',
      context: {
        runId: ctx.runId,
        optimizationsToApply: optimizationPlan.autoApplicableOptimizations,
        manualReview: optimizationPlan.manualReviewRequired,
        rollbackPlan: optimizationPlan.rollbackAvailable
      }
    });

    implementationResults = await ctx.task(implementationTask, {
      database,
      optimizationPlan,
      indexingStrategy,
      partitioningStrategy,
      materializationStrategy,
      cachingStrategy,
      configurationTuning,
      outputDir
    });

    artifacts.push(...implementationResults.artifacts);
  }

  // ============================================================================
  // PHASE 13: VALIDATION AND BENCHMARKING
  // ============================================================================

  ctx.log('info', 'Phase 13: Validating optimizations and benchmarking performance');

  const validation = await ctx.task(validationTask, {
    database,
    querySet,
    profilingResults,
    optimizationPlan,
    implementationResults,
    performanceTargets,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  // ============================================================================
  // PHASE 14: DOCUMENTATION AND RUNBOOKS
  // ============================================================================

  ctx.log('info', 'Phase 14: Generating documentation and operational runbooks');

  const documentation = await ctx.task(documentationTask, {
    database,
    workloadType,
    profilingResults,
    executionPlanAnalysis,
    indexingStrategy,
    partitioningStrategy,
    queryRewriting,
    materializationStrategy,
    cachingStrategy,
    configurationTuning,
    statisticsMaintenance,
    performanceMonitoring,
    optimizationPlan,
    implementationResults,
    validation,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // FINAL BREAKPOINT: OPTIMIZATION COMPLETE
  // ============================================================================

  const performanceGain = validation.performanceGain || optimizationPlan.estimatedGain;

  await ctx.breakpoint({
    question: `Query Performance Optimization Complete for ${database}! ${validation.implementedOptimizations || optimizationPlan.totalOptimizations} optimizations planned/applied. Estimated performance gain: ${performanceGain}. Review final results?`,
    title: 'Query Optimization Complete',
    context: {
      runId: ctx.runId,
      summary: {
        database,
        workloadType,
        queriesAnalyzed: profilingResults.queriesAnalyzed,
        performanceGain,
        optimizations: {
          indexing: indexingStrategy?.recommendedIndexes.length || 0,
          partitioning: partitioningStrategy?.partitionedTables || 0,
          queryRewrites: queryRewriting?.rewrittenQueries || 0,
          materializedViews: materializationStrategy?.recommendedViews || 0,
          caching: cachingStrategy ? 'Configured' : 'N/A'
        },
        implemented: enableAutoOptimization,
        validated: validation.validated,
        meetsTargets: validation.meetsTargets
      },
      performanceComparison: validation.performanceComparison,
      nextSteps: documentation.nextSteps,
      files: [
        { path: documentation.summaryPath, format: 'markdown', label: 'Optimization Summary' },
        { path: optimizationPlan.planPath, format: 'markdown', label: 'Optimization Plan' },
        { path: validation.reportPath, format: 'json', label: 'Validation Report' },
        { path: documentation.runbookPath, format: 'markdown', label: 'Operations Runbook' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    database,
    workloadType,
    profilingResults: {
      queriesAnalyzed: profilingResults.queriesAnalyzed,
      slowQueries: profilingResults.slowQueries,
      avgExecutionTime: profilingResults.avgExecutionTime,
      p95Latency: profilingResults.p95Latency,
      p99Latency: profilingResults.p99Latency,
      bottlenecks: profilingResults.bottlenecks
    },
    optimizationPlan: {
      totalOptimizations: optimizationPlan.totalOptimizations,
      estimatedGain: optimizationPlan.estimatedGain,
      autoApplicableOptimizations: optimizationPlan.autoApplicableOptimizations,
      manualReviewRequired: optimizationPlan.manualReviewRequired,
      planPath: optimizationPlan.planPath
    },
    implementations: {
      indexing: indexingStrategy ? {
        recommendedIndexes: indexingStrategy.recommendedIndexes.length,
        coveringIndexes: indexingStrategy.coveringIndexes,
        estimatedGain: indexingStrategy.estimatedGain
      } : null,
      partitioning: partitioningStrategy ? {
        partitionedTables: partitioningStrategy.partitionedTables,
        partitioningScheme: partitioningStrategy.scheme,
        estimatedGain: partitioningStrategy.estimatedGain
      } : null,
      queryRewriting: queryRewriting ? {
        rewrittenQueries: queryRewriting.rewrittenQueries,
        avgImprovement: queryRewriting.avgImprovement,
        patternsApplied: queryRewriting.patternsApplied
      } : null,
      materialization: materializationStrategy ? {
        recommendedViews: materializationStrategy.recommendedViews,
        refreshStrategy: materializationStrategy.refreshStrategy,
        estimatedGain: materializationStrategy.estimatedGain
      } : null,
      caching: cachingStrategy ? {
        cachingLayers: cachingStrategy.cachingLayers.length,
        projectedHitRate: cachingStrategy.projectedHitRate,
        estimatedLatencyReduction: cachingStrategy.estimatedLatencyReduction
      } : null,
      configuration: {
        parametersOptimized: configurationTuning.parametersOptimized,
        tuningRecommendations: configurationTuning.recommendations.length
      }
    },
    performanceGains: {
      estimated: optimizationPlan.estimatedGain,
      actual: validation.performanceGain || null,
      meetsTargets: validation.meetsTargets,
      performanceComparison: validation.performanceComparison
    },
    monitoring: {
      configured: performanceMonitoring.configured,
      metrics: performanceMonitoring.metrics,
      alerts: performanceMonitoring.alerts.length,
      dashboards: performanceMonitoring.dashboards
    },
    implemented: enableAutoOptimization,
    validated: validation.validated,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/data-engineering-analytics/query-optimization',
      timestamp: startTime,
      database,
      workloadType,
      optimizationAreas
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Query Profiling
export const queryProfilingTask = defineTask('query-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Query Profiling - ${args.database}`,
  agent: {
    name: 'query-profiler',
    prompt: {
      role: 'Database Performance Engineer specializing in query profiling',
      task: 'Profile queries and identify performance bottlenecks',
      context: {
        database: args.database,
        workloadType: args.workloadType,
        querySet: args.querySet,
        performanceTargets: args.performanceTargets,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze query set for performance characteristics',
        '2. Profile execution times and resource consumption',
        '3. Identify slow queries (above target latency)',
        '4. Calculate query execution statistics (avg, p50, p95, p99)',
        '5. Identify most frequent queries',
        '6. Analyze query complexity and patterns',
        '7. Identify performance bottlenecks (CPU, I/O, memory, network)',
        '8. Detect anti-patterns (SELECT *, N+1 queries, missing WHERE)',
        '9. Analyze table scan vs index scan ratios',
        '10. Generate query performance heatmap',
        '11. Create profiling report with visualizations',
        '12. Prioritize optimization opportunities by impact'
      ],
      outputFormat: 'JSON with profiling results and bottleneck analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['queriesAnalyzed', 'slowQueries', 'avgExecutionTime', 'bottlenecks', 'artifacts'],
      properties: {
        queriesAnalyzed: { type: 'number' },
        slowQueries: { type: 'number' },
        avgExecutionTime: { type: 'number' },
        p50Latency: { type: 'number' },
        p95Latency: { type: 'number' },
        p99Latency: { type: 'number' },
        maxExecutionTime: { type: 'number' },
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              affectedQueries: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        antiPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              occurrences: { type: 'number' },
              impact: { type: 'string' }
            }
          }
        },
        queryDistribution: {
          type: 'object',
          properties: {
            select: { type: 'number' },
            insert: { type: 'number' },
            update: { type: 'number' },
            delete: { type: 'number' }
          }
        },
        topSlowQueries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              queryId: { type: 'string' },
              executionTime: { type: 'number' },
              frequency: { type: 'number' },
              impact: { type: 'number' }
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
  labels: ['query-optimization', 'profiling', 'performance', 'data-engineering']
}));

// Phase 2: Execution Plan Analysis
export const executionPlanAnalysisTask = defineTask('execution-plan-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Execution Plan Analysis - ${args.database}`,
  agent: {
    name: 'plan-analyzer',
    prompt: {
      role: 'Database Query Optimizer specializing in execution plans',
      task: 'Analyze query execution plans for optimization opportunities',
      context: {
        database: args.database,
        querySet: args.querySet,
        profilingResults: args.profilingResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate EXPLAIN plans for all queries',
        '2. Analyze execution plan nodes and operations',
        '3. Identify full table scans and sequential scans',
        '4. Detect missing index usage opportunities',
        '5. Analyze join operations and join order',
        '6. Identify expensive operations (sorts, hash, nested loops)',
        '7. Analyze filter and predicate pushdown',
        '8. Detect subquery optimization opportunities',
        '9. Identify cartesian products and cross joins',
        '10. Analyze row count estimates vs actual',
        '11. Detect statistics staleness issues',
        '12. Generate execution plan optimization recommendations'
      ],
      outputFormat: 'JSON with execution plan analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['plansAnalyzed', 'tableScans', 'indexScans', 'optimizationOpportunities', 'artifacts'],
      properties: {
        plansAnalyzed: { type: 'number' },
        tableScans: { type: 'number' },
        indexScans: { type: 'number' },
        indexOnlyScans: { type: 'number' },
        expensiveOperations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              operation: { type: 'string' },
              count: { type: 'number' },
              avgCost: { type: 'number' }
            }
          }
        },
        joinAnalysis: {
          type: 'object',
          properties: {
            nestedLoops: { type: 'number' },
            hashJoins: { type: 'number' },
            mergeJoins: { type: 'number' },
            crossJoins: { type: 'number' }
          }
        },
        optimizationOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              queryId: { type: 'string' },
              description: { type: 'string' },
              estimatedImpact: { type: 'string', enum: ['high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        statisticsIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              table: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
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
  labels: ['query-optimization', 'execution-plans', 'performance', 'data-engineering']
}));

// Phase 3: Indexing Strategy
export const indexingStrategyTask = defineTask('indexing-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Indexing Strategy - ${args.database}`,
  agent: {
    name: 'index-architect',
    prompt: {
      role: 'Database Indexing Specialist',
      task: 'Design comprehensive indexing strategy',
      context: {
        database: args.database,
        workloadType: args.workloadType,
        executionPlanAnalysis: args.executionPlanAnalysis,
        profilingResults: args.profilingResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify columns frequently used in WHERE clauses',
        '2. Analyze JOIN conditions for index opportunities',
        '3. Identify columns used in ORDER BY and GROUP BY',
        '4. Design covering indexes for high-frequency queries',
        '5. Create composite indexes for multi-column predicates',
        '6. Analyze index selectivity and cardinality',
        '7. Identify redundant and unused indexes for removal',
        '8. Design partial/filtered indexes for specific conditions',
        '9. Plan index maintenance strategy',
        '10. Calculate index storage requirements',
        '11. Estimate query performance improvements',
        '12. Generate index creation scripts (CREATE INDEX statements)',
        '13. Document index naming conventions',
        '14. Create index monitoring and maintenance plan'
      ],
      outputFormat: 'JSON with indexing recommendations and DDL scripts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedIndexes', 'estimatedGain', 'artifacts'],
      properties: {
        recommendedIndexes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              indexName: { type: 'string' },
              tableName: { type: 'string' },
              columns: { type: 'array', items: { type: 'string' } },
              indexType: { type: 'string' },
              unique: { type: 'boolean' },
              covering: { type: 'boolean' },
              partial: { type: 'boolean' },
              estimatedImpact: { type: 'string' },
              affectedQueries: { type: 'number' },
              storageEstimate: { type: 'string' },
              ddl: { type: 'string' }
            }
          }
        },
        coveringIndexes: { type: 'number' },
        compositeIndexes: { type: 'number' },
        partialIndexes: { type: 'number' },
        redundantIndexes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              indexName: { type: 'string' },
              reason: { type: 'string' },
              replacedBy: { type: 'string' }
            }
          }
        },
        unusedIndexes: {
          type: 'array',
          items: { type: 'string' }
        },
        estimatedGain: { type: 'string' },
        storageImpact: { type: 'string' },
        maintenancePlan: {
          type: 'object',
          properties: {
            rebuildFrequency: { type: 'string' },
            statisticsUpdateFrequency: { type: 'string' },
            monitoringMetrics: { type: 'array', items: { type: 'string' } }
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
  labels: ['query-optimization', 'indexing', 'performance', 'data-engineering']
}));

// Phase 4: Partitioning Strategy
export const partitioningStrategyTask = defineTask('partitioning-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Partitioning Strategy - ${args.database}`,
  agent: {
    name: 'partitioning-specialist',
    prompt: {
      role: 'Database Partitioning Expert',
      task: 'Design table partitioning strategy for performance',
      context: {
        database: args.database,
        workloadType: args.workloadType,
        executionPlanAnalysis: args.executionPlanAnalysis,
        profilingResults: args.profilingResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify large tables benefiting from partitioning',
        '2. Analyze query access patterns for partition key selection',
        '3. Choose partitioning scheme: range, list, hash, or composite',
        '4. Design partition boundaries based on data distribution',
        '5. Implement partition pruning strategies',
        '6. Plan partition maintenance (add, drop, merge)',
        '7. Configure partition-wise joins',
        '8. Design local vs global index strategy',
        '9. Calculate storage distribution across partitions',
        '10. Estimate query performance improvements',
        '11. Generate partition DDL scripts',
        '12. Create partition management procedures',
        '13. Document partition retention policies',
        '14. Plan partition archival and purging strategy'
      ],
      outputFormat: 'JSON with partitioning recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['partitionedTables', 'scheme', 'estimatedGain', 'artifacts'],
      properties: {
        partitionedTables: { type: 'number' },
        scheme: { type: 'string' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tableName: { type: 'string' },
              partitionType: { type: 'string', enum: ['range', 'list', 'hash', 'composite'] },
              partitionKey: { type: 'array', items: { type: 'string' } },
              partitionCount: { type: 'number' },
              partitionPruningPotential: { type: 'string' },
              estimatedImpact: { type: 'string' },
              ddl: { type: 'string' }
            }
          }
        },
        partitionMaintenance: {
          type: 'object',
          properties: {
            automated: { type: 'boolean' },
            frequency: { type: 'string' },
            retentionPolicy: { type: 'string' }
          }
        },
        indexStrategy: {
          type: 'object',
          properties: {
            localIndexes: { type: 'number' },
            globalIndexes: { type: 'number' }
          }
        },
        estimatedGain: { type: 'string' },
        storageImpact: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['query-optimization', 'partitioning', 'performance', 'data-engineering']
}));

// Phase 5: Query Rewriting
export const queryRewritingTask = defineTask('query-rewriting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Query Rewriting - ${args.database}`,
  agent: {
    name: 'query-optimizer',
    prompt: {
      role: 'SQL Query Optimization Expert',
      task: 'Rewrite queries for optimal performance',
      context: {
        database: args.database,
        workloadType: args.workloadType,
        querySet: args.querySet,
        executionPlanAnalysis: args.executionPlanAnalysis,
        profilingResults: args.profilingResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify queries with poor execution plans',
        '2. Rewrite subqueries as JOINs where beneficial',
        '3. Replace correlated subqueries with window functions',
        '4. Optimize UNION to UNION ALL where appropriate',
        '5. Rewrite OR conditions to IN or UNION for better index usage',
        '6. Add missing WHERE clause filters',
        '7. Optimize GROUP BY and aggregate functions',
        '8. Rewrite DISTINCT to GROUP BY for efficiency',
        '9. Optimize ORDER BY placement and eliminate unnecessary sorts',
        '10. Apply predicate pushdown optimizations',
        '11. Rewrite complex views as CTEs or temp tables',
        '12. Eliminate SELECT * and specify required columns',
        '13. Compare before/after execution plans',
        '14. Generate optimized query versions with comments'
      ],
      outputFormat: 'JSON with query optimizations'
    },
    outputSchema: {
      type: 'object',
      required: ['rewrittenQueries', 'avgImprovement', 'optimizations', 'artifacts'],
      properties: {
        rewrittenQueries: { type: 'number' },
        avgImprovement: { type: 'string' },
        maxImprovement: { type: 'string' },
        patternsApplied: {
          type: 'array',
          items: { type: 'string' }
        },
        optimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              queryId: { type: 'string' },
              originalQuery: { type: 'string' },
              optimizedQuery: { type: 'string' },
              optimizationPattern: { type: 'string' },
              beforeExecutionTime: { type: 'number' },
              afterExecutionTime: { type: 'number' },
              improvement: { type: 'string' },
              explanation: { type: 'string' }
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
  labels: ['query-optimization', 'query-rewriting', 'performance', 'data-engineering']
}));

// Phase 6: Materialization Strategy
export const materializationStrategyTask = defineTask('materialization-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Materialization Strategy - ${args.database}`,
  agent: {
    name: 'materialization-architect',
    prompt: {
      role: 'Materialized View Design Specialist',
      task: 'Design materialized views strategy for query acceleration',
      context: {
        database: args.database,
        workloadType: args.workloadType,
        querySet: args.querySet,
        executionPlanAnalysis: args.executionPlanAnalysis,
        profilingResults: args.profilingResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify expensive queries suitable for materialization',
        '2. Analyze query patterns for common aggregations',
        '3. Design materialized views for frequent JOINs',
        '4. Create pre-aggregated summary tables',
        '5. Design incremental refresh strategy',
        '6. Choose refresh method: complete, fast, force',
        '7. Schedule refresh frequency based on data freshness requirements',
        '8. Design indexes on materialized views',
        '9. Calculate storage requirements',
        '10. Estimate refresh overhead',
        '11. Implement query rewrite to use materialized views',
        '12. Generate materialized view DDL',
        '13. Create refresh procedures and schedules',
        '14. Document maintenance and monitoring procedures'
      ],
      outputFormat: 'JSON with materialization recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedViews', 'refreshStrategy', 'estimatedGain', 'artifacts'],
      properties: {
        recommendedViews: { type: 'number' },
        refreshStrategy: { type: 'string' },
        views: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              viewName: { type: 'string' },
              baseQuery: { type: 'string' },
              refreshMethod: { type: 'string', enum: ['complete', 'fast', 'incremental'] },
              refreshFrequency: { type: 'string' },
              affectedQueries: { type: 'number' },
              storageEstimate: { type: 'string' },
              estimatedSpeedup: { type: 'string' },
              ddl: { type: 'string' }
            }
          }
        },
        refreshSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              viewName: { type: 'string' },
              schedule: { type: 'string' },
              estimatedDuration: { type: 'string' }
            }
          }
        },
        estimatedGain: { type: 'string' },
        storageOverhead: { type: 'string' },
        refreshOverhead: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['query-optimization', 'materialized-views', 'performance', 'data-engineering']
}));

// Phase 7: Caching Strategy
export const cachingStrategyTask = defineTask('caching-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Caching Strategy - ${args.database}`,
  agent: {
    name: 'caching-architect',
    prompt: {
      role: 'Database Caching Specialist',
      task: 'Design multi-tier caching strategy',
      context: {
        database: args.database,
        workloadType: args.workloadType,
        querySet: args.querySet,
        profilingResults: args.profilingResults,
        performanceTargets: args.performanceTargets,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify cacheable queries (deterministic, high frequency)',
        '2. Design application-level caching strategy (Redis, Memcached)',
        '3. Configure database query result caching',
        '4. Design cache key strategies',
        '5. Implement cache invalidation policies',
        '6. Set TTL (Time To Live) for cached data',
        '7. Design cache warming strategies',
        '8. Configure cache size and eviction policies',
        '9. Implement cache-aside vs write-through patterns',
        '10. Design distributed caching for scalability',
        '11. Calculate projected cache hit rates',
        '12. Estimate latency reduction',
        '13. Configure cache monitoring and metrics',
        '14. Generate caching implementation guide'
      ],
      outputFormat: 'JSON with caching strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['cachingLayers', 'projectedHitRate', 'estimatedLatencyReduction', 'artifacts'],
      properties: {
        cachingLayers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              layer: { type: 'string' },
              technology: { type: 'string' },
              cacheSize: { type: 'string' },
              ttl: { type: 'string' },
              evictionPolicy: { type: 'string' }
            }
          }
        },
        cacheableQueries: { type: 'number' },
        projectedHitRate: { type: 'string' },
        estimatedLatencyReduction: { type: 'string' },
        invalidationStrategy: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            triggers: { type: 'array', items: { type: 'string' } }
          }
        },
        warmingStrategy: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            schedule: { type: 'string' },
            queries: { type: 'array', items: { type: 'string' } }
          }
        },
        configuration: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              value: { type: 'string' },
              rationale: { type: 'string' }
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
  labels: ['query-optimization', 'caching', 'performance', 'data-engineering']
}));

// Phase 8: Configuration Tuning
export const configurationTuningTask = defineTask('configuration-tuning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Configuration Tuning - ${args.database}`,
  agent: {
    name: 'config-tuner',
    prompt: {
      role: 'Database Configuration Expert',
      task: 'Tune database configuration parameters for optimal performance',
      context: {
        database: args.database,
        workloadType: args.workloadType,
        profilingResults: args.profilingResults,
        performanceTargets: args.performanceTargets,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze current database configuration',
        '2. Tune memory allocation (shared buffers, work_mem, etc.)',
        '3. Configure connection pool settings',
        '4. Optimize checkpoint and WAL settings',
        '5. Configure query planner parameters',
        '6. Tune parallel query execution settings',
        '7. Configure autovacuum parameters',
        '8. Optimize background writer settings',
        '9. Configure logging and statistics collection',
        '10. Tune lock and timeout settings',
        '11. Configure network buffer sizes',
        '12. Generate configuration file with tuned parameters',
        '13. Document rationale for each change',
        '14. Create configuration validation checklist'
      ],
      outputFormat: 'JSON with configuration recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['parametersOptimized', 'recommendations', 'artifacts'],
      properties: {
        parametersOptimized: { type: 'number' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              currentValue: { type: 'string' },
              recommendedValue: { type: 'string' },
              impact: { type: 'string' },
              rationale: { type: 'string' },
              requiresRestart: { type: 'boolean' }
            }
          }
        },
        categories: {
          type: 'object',
          properties: {
            memory: { type: 'number' },
            connections: { type: 'number' },
            checkpoints: { type: 'number' },
            planner: { type: 'number' },
            parallelism: { type: 'number' },
            maintenance: { type: 'number' }
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
  labels: ['query-optimization', 'configuration', 'performance', 'data-engineering']
}));

// Phase 9: Statistics Maintenance
export const statisticsMaintenanceTask = defineTask('statistics-maintenance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Statistics Maintenance - ${args.database}`,
  agent: {
    name: 'statistics-manager',
    prompt: {
      role: 'Database Statistics Specialist',
      task: 'Configure statistics collection and maintenance',
      context: {
        database: args.database,
        executionPlanAnalysis: args.executionPlanAnalysis,
        indexingStrategy: args.indexingStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify tables with stale statistics',
        '2. Configure automatic statistics collection',
        '3. Set statistics target for critical columns',
        '4. Design statistics update schedule',
        '5. Configure histogram generation',
        '6. Set sampling rate for large tables',
        '7. Identify columns needing extended statistics',
        '8. Configure multi-column statistics',
        '9. Design statistics validation procedures',
        '10. Create statistics refresh procedures',
        '11. Generate statistics update scripts',
        '12. Document statistics maintenance strategy',
        '13. Set up statistics health monitoring',
        '14. Create alerting for stale statistics'
      ],
      outputFormat: 'JSON with statistics maintenance plan'
    },
    outputSchema: {
      type: 'object',
      required: ['maintenanceSchedule', 'artifacts'],
      properties: {
        tablesWithStaleStats: { type: 'number' },
        maintenanceSchedule: {
          type: 'object',
          properties: {
            frequency: { type: 'string' },
            automated: { type: 'boolean' },
            schedule: { type: 'string' }
          }
        },
        statisticsConfiguration: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              table: { type: 'string' },
              column: { type: 'string' },
              statisticsTarget: { type: 'number' },
              extended: { type: 'boolean' }
            }
          }
        },
        procedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              schedule: { type: 'string' }
            }
          }
        },
        monitoring: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            metrics: { type: 'array', items: { type: 'string' } }
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
  labels: ['query-optimization', 'statistics', 'maintenance', 'data-engineering']
}));

// Phase 10: Performance Monitoring
export const performanceMonitoringTask = defineTask('performance-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Performance Monitoring - ${args.database}`,
  agent: {
    name: 'monitoring-engineer',
    prompt: {
      role: 'Database Monitoring Specialist',
      task: 'Set up comprehensive performance monitoring and alerting',
      context: {
        database: args.database,
        performanceTargets: args.performanceTargets,
        optimizationAreas: args.optimizationAreas,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure query performance monitoring',
        '2. Set up slow query logging',
        '3. Configure execution plan tracking',
        '4. Monitor index usage statistics',
        '5. Track table and index bloat',
        '6. Monitor cache hit rates',
        '7. Configure connection and lock monitoring',
        '8. Set up wait event tracking',
        '9. Monitor resource utilization (CPU, memory, I/O)',
        '10. Create performance dashboards',
        '11. Configure alerting rules based on targets',
        '12. Set up trend analysis and anomaly detection',
        '13. Configure automated performance reports',
        '14. Document monitoring procedures and escalation'
      ],
      outputFormat: 'JSON with monitoring configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'metrics', 'alerts', 'artifacts'],
      properties: {
        configured: { type: 'boolean' },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              threshold: { type: 'string' },
              alerting: { type: 'boolean' }
            }
          }
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              condition: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
              notification: { type: 'string' }
            }
          }
        },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              metrics: { type: 'array', items: { type: 'string' } },
              refreshInterval: { type: 'string' }
            }
          }
        },
        slowQueryLogging: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            threshold: { type: 'number' },
            logPath: { type: 'string' }
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
  labels: ['query-optimization', 'monitoring', 'alerting', 'data-engineering']
}));

// Phase 11: Optimization Plan
export const optimizationPlanTask = defineTask('optimization-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Optimization Plan Generation - ${args.database}`,
  agent: {
    name: 'optimization-planner',
    prompt: {
      role: 'Database Optimization Project Manager',
      task: 'Generate comprehensive optimization implementation plan',
      context: args,
      instructions: [
        '1. Consolidate all optimization recommendations',
        '2. Prioritize optimizations by impact and effort',
        '3. Identify dependencies between optimizations',
        '4. Create phased implementation plan',
        '5. Estimate effort and timeline for each optimization',
        '6. Identify auto-applicable vs manual-review optimizations',
        '7. Design rollback procedures for each change',
        '8. Calculate total expected performance gain',
        '9. Estimate resource requirements',
        '10. Create risk assessment for each optimization',
        '11. Design validation and testing procedures',
        '12. Generate implementation checklist',
        '13. Create comprehensive optimization report',
        '14. Document success criteria and KPIs'
      ],
      outputFormat: 'JSON with comprehensive optimization plan'
    },
    outputSchema: {
      type: 'object',
      required: ['totalOptimizations', 'estimatedGain', 'planPath', 'artifacts'],
      properties: {
        totalOptimizations: { type: 'number' },
        estimatedGain: { type: 'string' },
        autoApplicableOptimizations: { type: 'number' },
        manualReviewRequired: { type: 'number' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              optimizations: { type: 'array', items: { type: 'string' } },
              estimatedDuration: { type: 'string' },
              estimatedImpact: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        priorityOptimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optimization: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'string' },
              effort: { type: 'string' },
              risk: { type: 'string' }
            }
          }
        },
        rollbackAvailable: { type: 'boolean' },
        rollbackProcedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optimization: { type: 'string' },
              rollbackSteps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              measurement: { type: 'string' }
            }
          }
        },
        planPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['query-optimization', 'planning', 'project-management', 'data-engineering']
}));

// Phase 12: Implementation
export const implementationTask = defineTask('implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Automated Implementation - ${args.database}`,
  agent: {
    name: 'implementation-engineer',
    prompt: {
      role: 'Database Implementation Engineer',
      task: 'Implement safe automated optimizations',
      context: args,
      instructions: [
        '1. Review auto-applicable optimizations from plan',
        '2. Create database backup before changes',
        '3. Implement index creation in priority order',
        '4. Apply configuration changes (non-restart first)',
        '5. Update statistics on affected tables',
        '6. Deploy materialized views with refresh schedules',
        '7. Implement caching configurations',
        '8. Apply safe query rewrites',
        '9. Validate each change after implementation',
        '10. Monitor performance impact',
        '11. Document all changes made',
        '12. Create rollback scripts',
        '13. Generate implementation report',
        '14. Notify of manual review items'
      ],
      outputFormat: 'JSON with implementation results'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'successful', 'failed', 'artifacts'],
      properties: {
        implemented: { type: 'number' },
        successful: { type: 'number' },
        failed: { type: 'number' },
        skipped: { type: 'number' },
        changes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              status: { type: 'string', enum: ['success', 'failed', 'skipped'] },
              error: { type: 'string' },
              rollbackScript: { type: 'string' }
            }
          }
        },
        backupCreated: { type: 'boolean' },
        backupLocation: { type: 'string' },
        rollbackReady: { type: 'boolean' },
        manualActionsRequired: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              reason: { type: 'string' },
              instructions: { type: 'string' }
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
  labels: ['query-optimization', 'implementation', 'automation', 'data-engineering']
}));

// Phase 13: Validation
export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Validation and Benchmarking - ${args.database}`,
  agent: {
    name: 'validation-engineer',
    prompt: {
      role: 'Performance Validation Specialist',
      task: 'Validate optimizations and benchmark performance improvements',
      context: args,
      instructions: [
        '1. Re-run profiling on optimized queries',
        '2. Compare before/after execution times',
        '3. Measure actual vs estimated performance gains',
        '4. Validate all queries return correct results',
        '5. Check performance targets are met',
        '6. Measure cache hit rates',
        '7. Verify index usage in execution plans',
        '8. Benchmark query throughput',
        '9. Test under concurrent load',
        '10. Validate monitoring and alerting',
        '11. Generate performance comparison report',
        '12. Document any regressions',
        '13. Create recommendations for further optimization',
        '14. Generate validation scorecard'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validated', 'performanceGain', 'meetsTargets', 'artifacts'],
      properties: {
        validated: { type: 'boolean' },
        implementedOptimizations: { type: 'number' },
        performanceGain: { type: 'string' },
        meetsTargets: { type: 'boolean' },
        performanceComparison: {
          type: 'object',
          properties: {
            beforeAvgLatency: { type: 'number' },
            afterAvgLatency: { type: 'number' },
            beforeP95Latency: { type: 'number' },
            afterP95Latency: { type: 'number' },
            throughputIncrease: { type: 'string' },
            cacheHitRate: { type: 'number' }
          }
        },
        targetComparison: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              actual: { type: 'string' },
              met: { type: 'boolean' }
            }
          }
        },
        regressions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        furtherOptimizations: {
          type: 'array',
          items: { type: 'string' }
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
  labels: ['query-optimization', 'validation', 'benchmarking', 'data-engineering']
}));

// Phase 14: Documentation
export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Documentation Generation - ${args.database}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive optimization documentation',
      context: args,
      instructions: [
        '1. Create executive summary of optimization results',
        '2. Document all optimizations implemented',
        '3. Provide before/after performance comparisons',
        '4. Document indexing strategy and indexes created',
        '5. Explain partitioning decisions',
        '6. Document query rewrites with explanations',
        '7. Describe materialized views and refresh schedules',
        '8. Document caching configuration',
        '9. Explain configuration changes',
        '10. Create operational runbook',
        '11. Document monitoring and alerting setup',
        '12. Provide troubleshooting guide',
        '13. Create maintenance procedures',
        '14. Document rollback procedures',
        '15. Generate next steps and recommendations'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['summaryPath', 'runbookPath', 'nextSteps', 'artifacts'],
      properties: {
        summaryPath: { type: 'string' },
        runbookPath: { type: 'string' },
        troubleshootingGuidePath: { type: 'string' },
        maintenanceGuidePath: { type: 'string' },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              priority: { type: 'string' },
              effort: { type: 'string' }
            }
          }
        },
        documentation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              path: { type: 'string' },
              format: { type: 'string' }
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
  labels: ['query-optimization', 'documentation', 'runbooks', 'data-engineering']
}));
