/**
 * @process data-engineering-analytics/obt-creation
 * @description One Big Table (OBT) Creation - Design and implement denormalized One Big Table (OBT) structures
 * by joining fact and dimension tables, optimizing for analytical query performance, implementing appropriate
 * denormalization strategies, and identifying optimal use cases for OBT patterns in data warehouse architecture.
 * @inputs { projectName: string, sourceSchema?: string, targetSchema?: string, performanceGoals?: object, dataVolume?: string }
 * @outputs { success: boolean, obtDesign: object, performanceProfile: object, joinStrategy: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('data-engineering-analytics/obt-creation', {
 *   projectName: 'Sales Analytics OBT',
 *   sourceSchema: 'star_schema',
 *   targetSchema: 'obt_analytics',
 *   performanceGoals: { queryTimeReduction: 80, targetLatency: '100ms' },
 *   dataVolume: 'large', // 'small', 'medium', 'large', 'xlarge'
 *   refreshStrategy: 'incremental', // 'full', 'incremental', 'streaming'
 *   storageOptimization: 'columnar', // 'columnar', 'row-based', 'hybrid'
 *   aggregationLevel: 'transaction' // 'transaction', 'daily', 'weekly', 'monthly'
 * });
 *
 * @references
 * - One Big Table Pattern: https://www.holistics.io/blog/the-one-big-table-gambit/
 * - Denormalization Best Practices: https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/
 * - Columnar Storage Optimization: https://docs.snowflake.com/en/user-guide/tables-clustering-micropartitions
 * - BigQuery Denormalized Tables: https://cloud.google.com/bigquery/docs/best-practices-performance-patterns
 * - Performance Optimization: https://www.databricks.com/blog/2022/05/20/five-simple-steps-for-implementing-a-star-schema-in-databricks-with-delta-lake.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sourceSchema = 'dimensional_model',
    targetSchema = 'obt_analytics',
    performanceGoals = {},
    dataVolume = 'medium',
    refreshStrategy = 'incremental',
    storageOptimization = 'columnar',
    aggregationLevel = 'transaction',
    outputDir = 'obt-creation-output',
    enablePartitioning = true,
    enableClustering = true,
    compressionLevel = 'standard',
    materializationStrategy = 'materialized_view',
    includeSCD = true,
    optimizeForBI = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting OBT Creation for ${projectName}`);
  ctx.log('info', `Source: ${sourceSchema}, Target: ${targetSchema}, Data Volume: ${dataVolume}`);

  // Task 1: Source Schema Analysis
  ctx.log('info', 'Analyzing source dimensional model schema');
  const schemaAnalysisResult = await ctx.task(analyzeSourceSchemaTask, {
    projectName,
    sourceSchema,
    dataVolume,
    includeSCD,
    outputDir
  });

  if (!schemaAnalysisResult.success) {
    return {
      success: false,
      error: 'Source schema analysis failed',
      details: schemaAnalysisResult,
      metadata: { processId: 'data-engineering-analytics/obt-creation', timestamp: startTime }
    };
  }

  artifacts.push(...schemaAnalysisResult.artifacts);

  ctx.log('info', `Schema analysis complete - ${schemaAnalysisResult.factTables.length} fact tables, ${schemaAnalysisResult.dimensions.length} dimensions identified`);

  // Task 2: Use Case Identification
  ctx.log('info', 'Identifying optimal use cases for OBT pattern');
  const useCaseResult = await ctx.task(identifyUseCasesTask, {
    projectName,
    schemaAnalysis: schemaAnalysisResult,
    performanceGoals,
    dataVolume,
    optimizeForBI,
    outputDir
  });

  artifacts.push(...useCaseResult.artifacts);

  ctx.log('info', `Use case identification complete - ${useCaseResult.useCases.length} OBT candidates identified`);

  // Breakpoint: Review use cases
  await ctx.breakpoint({
    question: `OBT use cases identified for ${projectName}. Found ${useCaseResult.useCases.length} candidate tables. Review use cases and recommendations?`,
    title: 'OBT Use Case Review',
    context: {
      runId: ctx.runId,
      files: useCaseResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        useCaseCount: useCaseResult.useCases.length,
        recommendedCases: useCaseResult.recommended.length,
        estimatedPerformanceGain: useCaseResult.estimatedGain,
        complexityLevel: useCaseResult.complexity
      }
    }
  });

  // Task 3: Denormalization Strategy Design
  ctx.log('info', 'Designing denormalization strategy');
  const denormStrategyResult = await ctx.task(designDenormalizationStrategyTask, {
    projectName,
    schemaAnalysis: schemaAnalysisResult,
    useCases: useCaseResult.useCases,
    dataVolume,
    storageOptimization,
    includeSCD,
    outputDir
  });

  artifacts.push(...denormStrategyResult.artifacts);

  ctx.log('info', `Denormalization strategy designed - ${denormStrategyResult.joinPaths.length} join paths identified`);

  // Task 4: Join Strategy Optimization
  ctx.log('info', 'Optimizing fact and dimension join strategy');
  const joinStrategyResult = await ctx.task(optimizeJoinStrategyTask, {
    projectName,
    denormStrategy: denormStrategyResult,
    schemaAnalysis: schemaAnalysisResult,
    dataVolume,
    aggregationLevel,
    outputDir
  });

  artifacts.push(...joinStrategyResult.artifacts);

  ctx.log('info', `Join strategy optimized - ${joinStrategyResult.optimizedJoins.length} optimized join patterns`);

  // Breakpoint: Review denormalization and join strategy
  await ctx.breakpoint({
    question: `Denormalization and join strategy designed. ${denormStrategyResult.joinPaths.length} join paths with ${joinStrategyResult.optimizedJoins.length} optimizations. Review strategy?`,
    title: 'Denormalization Strategy Review',
    context: {
      runId: ctx.runId,
      files: [...denormStrategyResult.artifacts, ...joinStrategyResult.artifacts].map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        joinPaths: denormStrategyResult.joinPaths.length,
        optimizedJoins: joinStrategyResult.optimizedJoins.length,
        denormalizationLevel: denormStrategyResult.level,
        estimatedRowExpansion: denormStrategyResult.expansionFactor
      }
    }
  });

  // Task 5: OBT Schema Design
  ctx.log('info', 'Designing OBT schema structure');
  const obtSchemaResult = await ctx.task(designOBTSchemaTask, {
    projectName,
    denormStrategy: denormStrategyResult,
    joinStrategy: joinStrategyResult,
    targetSchema,
    storageOptimization,
    aggregationLevel,
    outputDir
  });

  artifacts.push(...obtSchemaResult.artifacts);

  ctx.log('info', `OBT schema designed - ${obtSchemaResult.tables.length} OBT tables with ${obtSchemaResult.totalColumns} total columns`);

  // Task 6: Performance Optimization
  ctx.log('info', 'Implementing performance optimization strategies');
  const performanceOptResult = await ctx.task(implementPerformanceOptimizationTask, {
    projectName,
    obtSchema: obtSchemaResult,
    performanceGoals,
    enablePartitioning,
    enableClustering,
    compressionLevel,
    storageOptimization,
    dataVolume,
    outputDir
  });

  artifacts.push(...performanceOptResult.artifacts);

  ctx.log('info', `Performance optimization complete - Partitioning: ${performanceOptResult.partitioningStrategy}, Clustering: ${performanceOptResult.clusteringStrategy}`);

  // Breakpoint: Review performance optimization
  await ctx.breakpoint({
    question: `Performance optimization strategies implemented. Estimated query improvement: ${performanceOptResult.estimatedImprovement}%. Review optimization plan?`,
    title: 'Performance Optimization Review',
    context: {
      runId: ctx.runId,
      files: performanceOptResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        partitioning: performanceOptResult.partitioningStrategy,
        clustering: performanceOptResult.clusteringStrategy,
        compression: compressionLevel,
        estimatedImprovement: performanceOptResult.estimatedImprovement,
        storageImpact: performanceOptResult.storageImpact
      }
    }
  });

  // Task 7: Materialization Strategy
  ctx.log('info', 'Designing OBT materialization and refresh strategy');
  const materializationResult = await ctx.task(designMaterializationStrategyTask, {
    projectName,
    obtSchema: obtSchemaResult,
    refreshStrategy,
    materializationStrategy,
    dataVolume,
    performanceGoals,
    outputDir
  });

  artifacts.push(...materializationResult.artifacts);

  ctx.log('info', `Materialization strategy designed - Strategy: ${materializationResult.strategy}, Refresh: ${materializationResult.refreshFrequency}`);

  // Task 8: DDL Generation
  ctx.log('info', 'Generating DDL scripts for OBT implementation');
  const ddlResult = await ctx.task(generateOBTDDLTask, {
    projectName,
    obtSchema: obtSchemaResult,
    performanceOpt: performanceOptResult,
    materialization: materializationResult,
    targetSchema,
    storageOptimization,
    outputDir
  });

  artifacts.push(...ddlResult.artifacts);

  ctx.log('info', `DDL generation complete - ${ddlResult.scriptCount} SQL scripts generated`);

  // Task 9: ETL/ELT Pipeline Design
  ctx.log('info', 'Designing ETL/ELT pipeline for OBT population');
  const pipelineResult = await ctx.task(designOBTPipelineTask, {
    projectName,
    obtSchema: obtSchemaResult,
    joinStrategy: joinStrategyResult,
    materialization: materializationResult,
    refreshStrategy,
    dataVolume,
    outputDir
  });

  artifacts.push(...pipelineResult.artifacts);

  ctx.log('info', `Pipeline design complete - ${pipelineResult.stages.length} pipeline stages, ${pipelineResult.jobCount} jobs`);

  // Task 10: Query Optimization Patterns
  ctx.log('info', 'Generating query optimization patterns and examples');
  const queryOptResult = await ctx.task(generateQueryPatternsTask, {
    projectName,
    obtSchema: obtSchemaResult,
    useCases: useCaseResult.useCases,
    performanceOpt: performanceOptResult,
    optimizeForBI,
    outputDir
  });

  artifacts.push(...queryOptResult.artifacts);

  ctx.log('info', `Query patterns generated - ${queryOptResult.patternCount} optimization patterns`);

  // Breakpoint: Review implementation plan
  await ctx.breakpoint({
    question: `OBT implementation plan complete. ${obtSchemaResult.tables.length} tables, ${pipelineResult.stages.length} pipeline stages, ${queryOptResult.patternCount} query patterns. Review implementation?`,
    title: 'Implementation Plan Review',
    context: {
      runId: ctx.runId,
      files: [
        ...ddlResult.artifacts,
        ...pipelineResult.artifacts,
        ...queryOptResult.artifacts
      ].map(a => ({ path: a.path, format: a.format || 'sql' })),
      summary: {
        obtTables: obtSchemaResult.tables.length,
        totalColumns: obtSchemaResult.totalColumns,
        pipelineStages: pipelineResult.stages.length,
        estimatedBuildTime: pipelineResult.estimatedDuration,
        estimatedStorage: performanceOptResult.estimatedStorage
      }
    }
  });

  // Task 11: Validation and Testing Strategy
  ctx.log('info', 'Designing validation and testing strategy');
  const validationResult = await ctx.task(designValidationStrategyTask, {
    projectName,
    obtSchema: obtSchemaResult,
    sourceSchema: schemaAnalysisResult,
    performanceGoals,
    outputDir
  });

  artifacts.push(...validationResult.artifacts);

  ctx.log('info', `Validation strategy designed - ${validationResult.testCount} tests, ${validationResult.validationRules.length} validation rules`);

  // Task 12: Documentation Generation
  ctx.log('info', 'Generating comprehensive OBT documentation');
  const documentationResult = await ctx.task(generateOBTDocumentationTask, {
    projectName,
    obtSchema: obtSchemaResult,
    denormStrategy: denormStrategyResult,
    joinStrategy: joinStrategyResult,
    performanceOpt: performanceOptResult,
    materialization: materializationResult,
    pipeline: pipelineResult,
    queryPatterns: queryOptResult,
    validation: validationResult,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);

  ctx.log('info', `Documentation generated - ${documentationResult.documentCount} documents`);

  // Final Breakpoint: Sign-off
  await ctx.breakpoint({
    question: `OBT creation complete for ${projectName}. ${obtSchemaResult.tables.length} OBT tables designed with estimated ${performanceOptResult.estimatedImprovement}% query performance improvement. Ready for implementation?`,
    title: 'Final OBT Design Sign-off',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        projectName,
        obtTables: obtSchemaResult.tables.length,
        totalColumns: obtSchemaResult.totalColumns,
        denormalizationLevel: denormStrategyResult.level,
        estimatedPerformanceGain: performanceOptResult.estimatedImprovement,
        estimatedStorageIncrease: performanceOptResult.storageImpact,
        refreshStrategy: materializationResult.refreshFrequency,
        pipelineStages: pipelineResult.stages.length,
        validationTests: validationResult.testCount,
        artifactCount: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    obtDesign: {
      tables: obtSchemaResult.tables,
      totalColumns: obtSchemaResult.totalColumns,
      denormalizationLevel: denormStrategyResult.level,
      storageOptimization: storageOptimization
    },
    joinStrategy: {
      joinPaths: denormStrategyResult.joinPaths,
      optimizedJoins: joinStrategyResult.optimizedJoins,
      joinComplexity: joinStrategyResult.complexity
    },
    performanceProfile: {
      estimatedImprovement: performanceOptResult.estimatedImprovement,
      partitioning: performanceOptResult.partitioningStrategy,
      clustering: performanceOptResult.clusteringStrategy,
      compression: compressionLevel,
      estimatedStorage: performanceOptResult.estimatedStorage,
      storageImpact: performanceOptResult.storageImpact
    },
    materialization: {
      strategy: materializationResult.strategy,
      refreshFrequency: materializationResult.refreshFrequency,
      incrementalSupported: materializationResult.incrementalSupported
    },
    pipeline: {
      stages: pipelineResult.stages.length,
      jobCount: pipelineResult.jobCount,
      estimatedDuration: pipelineResult.estimatedDuration
    },
    validation: {
      testCount: validationResult.testCount,
      validationRules: validationResult.validationRules.length,
      coverageLevel: validationResult.coverage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'data-engineering-analytics/obt-creation',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Source Schema Analysis
export const analyzeSourceSchemaTask = defineTask('analyze-source-schema', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze source dimensional model schema',
  agent: {
    name: 'schema-analyst',
    prompt: {
      role: 'data warehouse architect',
      task: 'Analyze source dimensional model to prepare for OBT creation',
      context: args,
      instructions: [
        'Identify all fact tables in the source schema',
        'Catalog all dimension tables and their relationships',
        'Analyze fact-dimension foreign key relationships',
        'Document dimension cardinality and row counts',
        'Identify role-playing dimensions',
        'Analyze SCD Type 2 dimensions if includeSCD is true',
        'Document dimension hierarchies and attributes',
        'Estimate data volumes and growth patterns',
        'Identify complex many-to-many relationships',
        'Analyze query patterns on current schema',
        'Document performance bottlenecks',
        'Save schema analysis to output directory'
      ],
      outputFormat: 'JSON with fact tables, dimensions, relationships, cardinality, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'factTables', 'dimensions', 'relationships', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        factTables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              rowCount: { type: 'number' },
              measures: { type: 'array', items: { type: 'string' } },
              foreignKeys: { type: 'array', items: { type: 'string' } },
              grainLevel: { type: 'string' }
            }
          }
        },
        dimensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              rowCount: { type: 'number' },
              cardinality: { type: 'string', enum: ['low', 'medium', 'high'] },
              scdType: { type: 'string' },
              attributes: { type: 'array', items: { type: 'string' } },
              hierarchies: { type: 'array' },
              isRolePlaying: { type: 'boolean' }
            }
          }
        },
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factTable: { type: 'string' },
              dimension: { type: 'string' },
              joinType: { type: 'string' },
              cardinality: { type: 'string' }
            }
          }
        },
        dataVolume: {
          type: 'object',
          properties: {
            totalRows: { type: 'number' },
            estimatedSize: { type: 'string' },
            growthRate: { type: 'string' }
          }
        },
        performanceBottlenecks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obt', 'schema-analysis', 'dimensional-model']
}));

// Task 2: Use Case Identification
export const identifyUseCasesTask = defineTask('identify-use-cases', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify optimal use cases for OBT pattern',
  agent: {
    name: 'use-case-analyst',
    prompt: {
      role: 'analytics architect',
      task: 'Identify and evaluate use cases where OBT pattern provides optimal benefits',
      context: args,
      instructions: [
        'Analyze query patterns and BI workloads',
        'Identify reporting scenarios with frequent fact-dimension joins',
        'Evaluate cases where OBT provides significant performance gains',
        'Consider data volume impact on OBT viability',
        'Identify self-service analytics use cases',
        'OBT is ideal for:',
        '  - Reporting workloads with consistent dimension joins',
        '  - BI tools requiring simple, denormalized structures',
        '  - Query performance optimization for complex joins',
        '  - Self-service analytics requiring user-friendly schemas',
        '  - Columnar databases (BigQuery, Snowflake, Redshift)',
        'OBT is NOT recommended for:',
        '  - Frequently changing dimension structures',
        '  - Extremely high cardinality dimensions',
        '  - Real-time transactional processing',
        '  - Ad-hoc, unpredictable query patterns',
        'Evaluate storage vs performance tradeoffs',
        'Assess maintenance complexity',
        'Prioritize use cases by business value',
        'Document recommendations with rationale',
        'Save use case analysis to output directory'
      ],
      outputFormat: 'JSON with use cases, recommendations, estimated gains, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['useCases', 'recommended', 'artifacts'],
      properties: {
        useCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              baseFact: { type: 'string' },
              includedDimensions: { type: 'array', items: { type: 'string' } },
              queryPattern: { type: 'string' },
              expectedBenefit: { type: 'string', enum: ['high', 'medium', 'low'] },
              complexity: { type: 'string', enum: ['high', 'medium', 'low'] },
              estimatedRowCount: { type: 'number' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        recommended: { type: 'array', items: { type: 'string' } },
        notRecommended: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              useCase: { type: 'string' },
              reason: { type: 'string' },
              alternative: { type: 'string' }
            }
          }
        },
        estimatedGain: { type: 'string' },
        complexity: { type: 'string' },
        tradeoffs: {
          type: 'object',
          properties: {
            storageIncrease: { type: 'string' },
            performanceGain: { type: 'string' },
            maintenanceOverhead: { type: 'string' }
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
  labels: ['agent', 'obt', 'use-case-analysis', 'recommendations']
}));

// Task 3: Denormalization Strategy Design
export const designDenormalizationStrategyTask = defineTask('design-denormalization-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design denormalization strategy',
  agent: {
    name: 'denormalization-architect',
    prompt: {
      role: 'data warehouse optimization specialist',
      task: 'Design comprehensive denormalization strategy for OBT creation',
      context: args,
      instructions: [
        'Define denormalization approach for each use case',
        'Determine which dimensions to fully denormalize',
        'Identify dimension attributes to include in OBT',
        'Handle role-playing dimensions (flatten or duplicate)',
        'Strategy for SCD Type 2 dimensions:',
        '  - Option 1: Include only current records (current_flag = true)',
        '  - Option 2: Include all history with effective dates',
        '  - Option 3: Separate OBT for current vs historical',
        'Design handling of many-to-many relationships',
        'Decide on dimension hierarchy flattening',
        'Plan for NULL handling in outer joins',
        'Define column naming conventions for denormalized attributes',
        'Estimate row expansion factor',
        'Calculate storage requirements',
        'Assess data redundancy levels',
        'Design incremental refresh strategy',
        'Document denormalization rationale',
        'Save denormalization strategy to output directory'
      ],
      outputFormat: 'JSON with denormalization approach, join paths, expansion factor, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['level', 'joinPaths', 'expansionFactor', 'artifacts'],
      properties: {
        level: { type: 'string', enum: ['full', 'selective', 'minimal'] },
        joinPaths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              obtTable: { type: 'string' },
              baseFact: { type: 'string' },
              dimensions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    dimensionName: { type: 'string' },
                    joinType: { type: 'string', enum: ['inner', 'left', 'cross'] },
                    includedAttributes: { type: 'array', items: { type: 'string' } },
                    scdStrategy: { type: 'string' }
                  }
                }
              },
              estimatedRows: { type: 'number' }
            }
          }
        },
        expansionFactor: { type: 'number' },
        redundancyLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
        scdHandling: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            currentOnly: { type: 'boolean' },
            includeHistory: { type: 'boolean' }
          }
        },
        namingConventions: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            prefix: { type: 'string' },
            suffix: { type: 'string' }
          }
        },
        estimatedStorage: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obt', 'denormalization', 'design']
}));

// Task 4: Join Strategy Optimization
export const optimizeJoinStrategyTask = defineTask('optimize-join-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize fact and dimension join strategy',
  agent: {
    name: 'join-optimizer',
    prompt: {
      role: 'query optimization specialist',
      task: 'Optimize join strategy for efficient OBT population',
      context: args,
      instructions: [
        'Design optimal join order based on cardinality',
        'Identify broadcast vs shuffle joins',
        'Optimize for MPP/columnar database architectures',
        'Plan for dimension key lookup efficiency',
        'Handle missing dimension keys (NULL foreign keys)',
        'Strategy for role-playing dimensions:',
        '  - Multiple joins to same dimension table',
        '  - CTEs for dimension role disambiguation',
        '  - Naming strategy for role-playing attributes',
        'Optimize for aggregation level (transaction, daily, etc.)',
        'Design join strategies for large data volumes',
        'Plan for incremental join processing',
        'Implement late-arriving dimension handling',
        'Optimize join predicates and filters',
        'Consider join elimination opportunities',
        'Design parallel processing strategy',
        'Document join optimization techniques',
        'Generate optimized SQL patterns',
        'Save join strategy to output directory'
      ],
      outputFormat: 'JSON with optimized joins, join order, SQL patterns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedJoins', 'joinOrder', 'artifacts'],
      properties: {
        optimizedJoins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              obtTable: { type: 'string' },
              joinSequence: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    step: { type: 'number' },
                    dimensionName: { type: 'string' },
                    joinType: { type: 'string' },
                    joinCondition: { type: 'string' },
                    estimatedRows: { type: 'number' },
                    optimizationHint: { type: 'string' }
                  }
                }
              },
              parallelizationStrategy: { type: 'string' }
            }
          }
        },
        joinOrder: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        complexity: { type: 'string', enum: ['high', 'medium', 'low'] },
        rolePlayingStrategy: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            namingPattern: { type: 'string' }
          }
        },
        nullHandling: { type: 'string' },
        incrementalStrategy: { type: 'string' },
        sqlPatterns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obt', 'join-optimization', 'performance']
}));

// Task 5: OBT Schema Design
export const designOBTSchemaTask = defineTask('design-obt-schema', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design OBT schema structure',
  agent: {
    name: 'obt-schema-designer',
    prompt: {
      role: 'data warehouse architect',
      task: 'Design comprehensive OBT schema with all columns and data types',
      context: args,
      instructions: [
        'Design OBT table structure for each use case',
        'Include all fact measures with appropriate data types',
        'Flatten and include selected dimension attributes',
        'Design column naming to avoid conflicts',
        'Include surrogate keys from fact and dimension tables',
        'Add business keys for traceability',
        'Include audit columns: load_date, source_system, batch_id',
        'Design for storage optimization (columnar)',
        'Consider data type optimization (precision, scale)',
        'Add derived/calculated columns if beneficial',
        'Include time dimension attributes for partitioning',
        'Design for BI tool compatibility',
        'Ensure columns are properly documented',
        'Calculate total column count per OBT',
        'Estimate storage requirements per table',
        'Design primary key or unique constraints',
        'Plan for data quality flags',
        'Save OBT schema designs to output directory'
      ],
      outputFormat: 'JSON with OBT tables, columns, data types, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tables', 'totalColumns', 'artifacts'],
      properties: {
        tables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tableName: { type: 'string' },
              baseFact: { type: 'string' },
              columns: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    columnName: { type: 'string' },
                    dataType: { type: 'string' },
                    sourceTable: { type: 'string' },
                    sourceColumn: { type: 'string' },
                    columnType: { type: 'string', enum: ['measure', 'dimension-attribute', 'key', 'audit'] },
                    description: { type: 'string' },
                    nullable: { type: 'boolean' }
                  }
                }
              },
              columnCount: { type: 'number' },
              estimatedRowCount: { type: 'number' },
              estimatedSize: { type: 'string' },
              primaryKey: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalColumns: { type: 'number' },
        namingConventions: {
          type: 'object',
          properties: {
            tablePrefix: { type: 'string' },
            columnPattern: { type: 'string' }
          }
        },
        dataTypeOptimizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obt', 'schema-design', 'data-modeling']
}));

// Task 6: Performance Optimization
export const implementPerformanceOptimizationTask = defineTask('implement-performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement performance optimization strategies',
  agent: {
    name: 'performance-optimizer',
    prompt: {
      role: 'database performance engineer',
      task: 'Design and implement comprehensive performance optimization for OBT',
      context: args,
      instructions: [
        'Design partitioning strategy (if enablePartitioning):',
        '  - Partition by time dimension (date, month, year)',
        '  - Consider range, list, or hash partitioning',
        '  - Optimize partition size (not too small, not too large)',
        '  - Plan for partition pruning in queries',
        'Design clustering strategy (if enableClustering):',
        '  - Cluster by frequently filtered columns',
        '  - Consider multi-column clustering',
        '  - Optimize for query patterns',
        '  - Platform-specific clustering (Snowflake, BigQuery)',
        'Implement compression strategy:',
        '  - Columnar compression (automatic in modern warehouses)',
        '  - Choose compression level (standard, high, aggressive)',
        '  - Consider compression ratio vs query performance',
        'Design indexing strategy (if applicable):',
        '  - Bitmap indexes for low cardinality',
        '  - B-tree indexes for high cardinality',
        '  - Consider index maintenance overhead',
        'Implement statistics collection',
        'Design query optimization hints',
        'Plan for vacuum and analyze operations',
        'Estimate storage requirements with compression',
        'Calculate expected query performance improvements',
        'Document optimization tradeoffs',
        'Save performance optimization plan to output directory'
      ],
      outputFormat: 'JSON with partitioning, clustering, compression, performance estimates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['partitioningStrategy', 'clusteringStrategy', 'estimatedImprovement', 'artifacts'],
      properties: {
        partitioningStrategy: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            partitionColumn: { type: 'string' },
            partitionType: { type: 'string', enum: ['range', 'list', 'hash'] },
            partitionGranularity: { type: 'string' },
            estimatedPartitions: { type: 'number' }
          }
        },
        clusteringStrategy: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            clusterKeys: { type: 'array', items: { type: 'string' } },
            clusterType: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        compressionStrategy: {
          type: 'object',
          properties: {
            level: { type: 'string' },
            expectedRatio: { type: 'string' },
            algorithm: { type: 'string' }
          }
        },
        indexingStrategy: {
          type: 'object',
          properties: {
            indexes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  indexName: { type: 'string' },
                  columns: { type: 'array', items: { type: 'string' } },
                  indexType: { type: 'string' }
                }
              }
            }
          }
        },
        estimatedImprovement: { type: 'number' },
        estimatedStorage: { type: 'string' },
        storageImpact: { type: 'string' },
        maintenanceRequirements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obt', 'performance-optimization', 'tuning']
}));

// Task 7: Materialization Strategy
export const designMaterializationStrategyTask = defineTask('design-materialization-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design OBT materialization and refresh strategy',
  agent: {
    name: 'materialization-architect',
    prompt: {
      role: 'data pipeline architect',
      task: 'Design optimal materialization and refresh strategy for OBT',
      context: args,
      instructions: [
        'Evaluate materialization options:',
        '  - Materialized View: Automatic refresh, query rewrite',
        '  - Physical Table: Full control, manual refresh',
        '  - Cached Result: Temporary, fast access',
        '  - Incremental Table: Append-only, efficient updates',
        'Design refresh strategy based on refreshStrategy:',
        '  - Full: Complete rebuild, simple but resource-intensive',
        '  - Incremental: Delta processing, efficient but complex',
        '  - Streaming: Real-time updates, most complex',
        'Determine refresh frequency:',
        '  - Real-time: Continuous or micro-batches',
        '  - Near real-time: Every 5-15 minutes',
        '  - Hourly: Typical for operational reporting',
        '  - Daily: Standard for analytical workloads',
        '  - Weekly/Monthly: For historical analysis',
        'Design incremental update logic:',
        '  - Identify changed records in fact tables',
        '  - Track dimension changes (SCD Type 2)',
        '  - Implement watermark-based processing',
        '  - Handle late-arriving data',
        'Plan for full refresh scenarios:',
        '  - Schema changes',
        '  - Data quality issues',
        '  - Periodic validation',
        'Design refresh orchestration',
        'Estimate refresh duration and resource requirements',
        'Plan for zero-downtime refresh (blue/green)',
        'Save materialization strategy to output directory'
      ],
      outputFormat: 'JSON with strategy, refresh frequency, incremental logic, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'refreshFrequency', 'incrementalSupported', 'artifacts'],
      properties: {
        strategy: {
          type: 'string',
          enum: ['materialized_view', 'physical_table', 'cached_result', 'incremental_table']
        },
        refreshFrequency: { type: 'string' },
        refreshType: { type: 'string', enum: ['full', 'incremental', 'streaming'] },
        incrementalSupported: { type: 'boolean' },
        incrementalLogic: {
          type: 'object',
          properties: {
            watermarkColumn: { type: 'string' },
            changeDetectionMethod: { type: 'string' },
            deltaProcessing: { type: 'string' }
          }
        },
        fullRefreshTriggers: { type: 'array', items: { type: 'string' } },
        refreshOrchestration: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            schedule: { type: 'string' },
            dependencies: { type: 'array', items: { type: 'string' } }
          }
        },
        estimatedRefreshDuration: { type: 'string' },
        resourceRequirements: { type: 'string' },
        zeroDowntimeSupported: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obt', 'materialization', 'refresh-strategy']
}));

// Task 8: DDL Generation
export const generateOBTDDLTask = defineTask('generate-obt-ddl', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate DDL scripts for OBT implementation',
  agent: {
    name: 'ddl-generator',
    prompt: {
      role: 'database engineer',
      task: 'Generate comprehensive DDL scripts for OBT creation',
      context: args,
      instructions: [
        'Generate CREATE TABLE statements for all OBT tables',
        'Include all columns with appropriate data types',
        'Add table comments with descriptions',
        'Add column comments with source mappings',
        'Implement partitioning DDL (if enabled)',
        'Implement clustering DDL (if enabled)',
        'Add compression settings',
        'Generate CREATE MATERIALIZED VIEW statements (if applicable)',
        'Create supporting indexes',
        'Add data quality constraints where appropriate',
        'Generate DDL for target database platform',
        'Create separate files for each OBT table',
        'Generate master deployment script',
        'Include rollback scripts',
        'Add performance tuning DDL (statistics, analyze)',
        'Include security/grants DDL',
        'Save all DDL scripts to output directory'
      ],
      outputFormat: 'JSON with DDL files, script count, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scriptCount', 'ddlFiles', 'artifacts'],
      properties: {
        scriptCount: { type: 'number' },
        ddlFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fileName: { type: 'string' },
              filePath: { type: 'string' },
              objectType: { type: 'string' },
              tableName: { type: 'string' }
            }
          }
        },
        deploymentScript: { type: 'string' },
        rollbackScript: { type: 'string' },
        totalObjects: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obt', 'ddl', 'database']
}));

// Task 9: ETL/ELT Pipeline Design
export const designOBTPipelineTask = defineTask('design-obt-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design ETL/ELT pipeline for OBT population',
  agent: {
    name: 'pipeline-architect',
    prompt: {
      role: 'data pipeline engineer',
      task: 'Design comprehensive ETL/ELT pipeline for OBT population and refresh',
      context: args,
      instructions: [
        'Design multi-stage pipeline architecture',
        'Stage 1: Data extraction from source tables',
        'Stage 2: Dimension lookup and join processing',
        'Stage 3: Measure calculation and aggregation',
        'Stage 4: OBT population with optimized inserts',
        'Stage 5: Post-processing (statistics, validation)',
        'Design SQL for OBT population with optimized joins',
        'Implement incremental refresh logic (if applicable)',
        'Design full refresh workflow',
        'Add data quality checks at each stage',
        'Implement error handling and retry logic',
        'Design parallel processing for large volumes',
        'Plan for late-arriving dimension handling',
        'Add logging and monitoring',
        'Design pipeline orchestration (Airflow, dbt, etc.)',
        'Estimate pipeline execution time',
        'Create pipeline DAG/workflow diagram',
        'Generate pipeline configuration files',
        'Save pipeline design to output directory'
      ],
      outputFormat: 'JSON with pipeline stages, SQL scripts, job count, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stages', 'jobCount', 'estimatedDuration', 'artifacts'],
      properties: {
        stages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stageNumber: { type: 'number' },
              stageName: { type: 'string' },
              description: { type: 'string' },
              sqlScript: { type: 'string' },
              estimatedDuration: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        jobCount: { type: 'number' },
        estimatedDuration: { type: 'string' },
        incrementalRefreshSQL: { type: 'string' },
        fullRefreshSQL: { type: 'string' },
        dataQualityChecks: { type: 'array', items: { type: 'string' } },
        orchestrationTool: { type: 'string' },
        parallelizationStrategy: { type: 'string' },
        errorHandling: {
          type: 'object',
          properties: {
            retryPolicy: { type: 'string' },
            errorNotification: { type: 'string' }
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
  labels: ['agent', 'obt', 'etl-pipeline', 'data-integration']
}));

// Task 10: Query Optimization Patterns
export const generateQueryPatternsTask = defineTask('generate-query-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate query optimization patterns and examples',
  agent: {
    name: 'query-specialist',
    prompt: {
      role: 'SQL optimization expert',
      task: 'Generate optimized query patterns and examples for OBT usage',
      context: args,
      instructions: [
        'Generate example queries for common use cases',
        'Demonstrate query simplification vs dimensional model',
        'Show before/after query comparisons',
        'Leverage partitioning in WHERE clauses',
        'Leverage clustering keys in filters',
        'Demonstrate aggregation patterns',
        'Show time-series query patterns',
        'Demonstrate join elimination (no joins needed in OBT)',
        'Provide BI tool optimization tips',
        'Generate query templates for analysts',
        'Document query performance best practices',
        'Include anti-patterns to avoid',
        'Provide query cost estimation guidance',
        'Generate queries optimized for specific BI tools (if optimizeForBI)',
        'Save query patterns and examples to output directory'
      ],
      outputFormat: 'JSON with query patterns, examples, best practices, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patternCount', 'queryExamples', 'artifacts'],
      properties: {
        patternCount: { type: 'number' },
        queryExamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              useCase: { type: 'string' },
              description: { type: 'string' },
              dimensionalModelQuery: { type: 'string' },
              obtQuery: { type: 'string' },
              performanceImprovement: { type: 'string' }
            }
          }
        },
        bestPractices: { type: 'array', items: { type: 'string' } },
        antiPatterns: { type: 'array', items: { type: 'string' } },
        biToolOptimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              optimizations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        queryTemplates: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obt', 'query-optimization', 'sql']
}));

// Task 11: Validation and Testing Strategy
export const designValidationStrategyTask = defineTask('design-validation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design validation and testing strategy',
  agent: {
    name: 'validation-architect',
    prompt: {
      role: 'data quality engineer',
      task: 'Design comprehensive validation and testing strategy for OBT',
      context: args,
      instructions: [
        'Design data quality validation rules',
        'Row count reconciliation: OBT vs source fact tables',
        'Measure aggregation validation: sum, count, avg',
        'Dimension attribute validation: no missing values',
        'Referential integrity checks',
        'Data type and format validation',
        'NULL value analysis and validation',
        'Duplicate detection tests',
        'Performance benchmark tests',
        'Query performance comparison: dimensional model vs OBT',
        'Load performance testing',
        'Data freshness validation',
        'Incremental refresh validation',
        'End-to-end pipeline testing',
        'BI tool integration testing',
        'Generate validation SQL scripts',
        'Design automated testing framework',
        'Save validation strategy and test scripts to output directory'
      ],
      outputFormat: 'JSON with test count, validation rules, test scripts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'validationRules', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        validationRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ruleName: { type: 'string' },
              ruleType: { type: 'string' },
              description: { type: 'string' },
              sqlCheck: { type: 'string' },
              expectedResult: { type: 'string' }
            }
          }
        },
        testCategories: {
          type: 'object',
          properties: {
            dataQuality: { type: 'number' },
            performance: { type: 'number' },
            reconciliation: { type: 'number' },
            integration: { type: 'number' }
          }
        },
        coverage: { type: 'string', enum: ['comprehensive', 'standard', 'basic'] },
        testScripts: { type: 'array', items: { type: 'string' } },
        automationFramework: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obt', 'validation', 'testing']
}));

// Task 12: Documentation Generation
export const generateOBTDocumentationTask = defineTask('generate-obt-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive OBT documentation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'technical writer and data architect',
      task: 'Generate comprehensive documentation for OBT implementation',
      context: args,
      instructions: [
        'Create OBT design document with:',
        '  - Executive summary and business justification',
        '  - OBT architecture overview',
        '  - Denormalization strategy and rationale',
        '  - Schema design and column mappings',
        '  - Performance optimization strategies',
        '  - Refresh and materialization approach',
        '  - Use cases and benefits',
        'Create data dictionary:',
        '  - All OBT tables and columns',
        '  - Data types and descriptions',
        '  - Source table and column mappings',
        '  - Business definitions',
        'Create query guide:',
        '  - How to query OBT tables',
        '  - Example queries for common use cases',
        '  - Performance best practices',
        '  - Query patterns and templates',
        'Create operations guide:',
        '  - Refresh procedures',
        '  - Monitoring and alerting',
        '  - Troubleshooting',
        '  - Maintenance tasks',
        'Create BI developer guide:',
        '  - Connecting BI tools to OBT',
        '  - Creating reports and dashboards',
        '  - Performance optimization tips',
        'Include diagrams: architecture, data flow, ERD',
        'Document tradeoffs and limitations',
        'Provide migration guide from dimensional model',
        'Format as professional Markdown documentation',
        'Save all documentation to output directory'
      ],
      outputFormat: 'JSON with documentation files, document count, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentCount', 'documentationFiles', 'artifacts'],
      properties: {
        documentCount: { type: 'number' },
        documentationFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fileName: { type: 'string' },
              filePath: { type: 'string' },
              docType: { type: 'string' }
            }
          }
        },
        keyTopics: { type: 'array', items: { type: 'string' } },
        diagramCount: { type: 'number' },
        exampleCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obt', 'documentation', 'knowledge-sharing']
}));
