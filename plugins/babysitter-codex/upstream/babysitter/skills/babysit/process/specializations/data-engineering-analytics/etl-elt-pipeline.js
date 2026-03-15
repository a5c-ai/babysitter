/**
 * @process specializations/data-engineering-analytics/etl-elt-pipeline
 * @description ETL/ELT Pipeline Setup - Design and implement a comprehensive data pipeline from source to destination,
 * including source connection, ingestion layer, transformation logic, data quality gates, orchestration, and monitoring.
 * Supports both batch and streaming data patterns with comprehensive validation and error handling.
 * @inputs { pipelineName: string, sources?: array, destinations?: array, pipelineType?: string, transformationLogic?: object, dataQualityRules?: object, orchestration?: object }
 * @outputs { success: boolean, pipelineConfig: object, dataFlows: array, qualityGates: array, monitoring: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/data-engineering-analytics/etl-elt-pipeline', {
 *   pipelineName: 'Customer Analytics Pipeline',
 *   sources: [
 *     { type: 'postgresql', name: 'transactional-db', connection: 'prod-db' },
 *     { type: 'kafka', name: 'events-stream', topics: ['user-events', 'product-views'] },
 *     { type: 's3', name: 'logs-bucket', path: 's3://logs/clickstream/' }
 *   ],
 *   destinations: [
 *     { type: 'snowflake', name: 'analytics-warehouse', schema: 'customer_analytics' },
 *     { type: 'redshift', name: 'reporting-db', schema: 'reports' }
 *   ],
 *   pipelineType: 'hybrid', // 'batch', 'streaming', or 'hybrid'
 *   transformationLogic: {
 *     stages: ['extract', 'clean', 'enrich', 'aggregate', 'load'],
 *     dbtModels: true,
 *     customTransformations: ['user-segmentation', 'revenue-attribution']
 *   },
 *   dataQualityRules: {
 *     schemaValidation: true,
 *     nullChecks: true,
 *     rangeChecks: true,
 *     referentialIntegrity: true,
 *     customRules: ['email-format', 'positive-revenue']
 *   },
 *   orchestration: {
 *     tool: 'airflow', // 'airflow', 'dagster', 'prefect', 'step-functions'
 *     schedule: 'hourly',
 *     retryPolicy: { maxRetries: 3, backoff: 'exponential' }
 *   }
 * });
 *
 * @references
 * - ETL Best Practices: https://docs.airbyte.com/understanding-airbyte/
 * - Data Quality: https://www.datakitchen.io/data-quality-fundamentals
 * - Apache Airflow: https://airflow.apache.org/docs/
 * - Dagster: https://docs.dagster.io/
 * - dbt (data build tool): https://docs.getdbt.com/
 * - Great Expectations: https://greatexpectations.io/
 * - Data Engineering Best Practices: https://github.com/DataTalksClub/data-engineering-zoomcamp
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    pipelineName,
    sources = [],
    destinations = [],
    pipelineType = 'batch', // 'batch', 'streaming', 'hybrid'
    transformationLogic = {},
    dataQualityRules = {},
    orchestration = { tool: 'airflow', schedule: 'daily' },
    monitoringConfig = {},
    outputDir = 'etl-elt-pipeline'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ETL/ELT Pipeline Setup: ${pipelineName}`);
  ctx.log('info', `Pipeline Type: ${pipelineType}`);
  ctx.log('info', `Sources: ${sources.length}, Destinations: ${destinations.length}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS AND ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing pipeline requirements and designing architecture');

  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    pipelineName,
    sources,
    destinations,
    pipelineType,
    transformationLogic,
    dataQualityRules,
    orchestration,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // Quality Gate: Requirements must be clear and feasible
  await ctx.breakpoint({
    question: `Phase 1 Complete: Pipeline architecture designed for ${pipelineName}. Type: ${pipelineType}. Data sources: ${sources.length}, Destinations: ${destinations.length}. Estimated complexity: ${requirementsAnalysis.complexity}. Proceed with implementation?`,
    title: 'Requirements Analysis Review',
    context: {
      runId: ctx.runId,
      pipelineName,
      pipelineType,
      complexity: requirementsAnalysis.complexity,
      dataFlows: requirementsAnalysis.dataFlows,
      estimatedVolume: requirementsAnalysis.estimatedDataVolume,
      files: requirementsAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: SOURCE SYSTEM CONNECTIVITY SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up source system connections and authentication');

  const sourceConnectivity = await ctx.task(sourceConnectivityTask, {
    pipelineName,
    sources,
    requirementsAnalysis,
    outputDir
  });

  artifacts.push(...sourceConnectivity.artifacts);

  // ============================================================================
  // PHASE 3: DESTINATION SYSTEM SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring destination systems and schema design');

  const destinationSetup = await ctx.task(destinationSetupTask, {
    pipelineName,
    destinations,
    requirementsAnalysis,
    outputDir
  });

  artifacts.push(...destinationSetup.artifacts);

  // ============================================================================
  // PHASE 4: DATA INGESTION LAYER DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing data ingestion layer for batch and/or streaming');

  const ingestionLayer = await ctx.task(ingestionLayerTask, {
    pipelineName,
    pipelineType,
    sources,
    destinations,
    requirementsAnalysis,
    sourceConnectivity,
    outputDir
  });

  artifacts.push(...ingestionLayer.artifacts);

  // ============================================================================
  // PHASE 5: STAGING AREA CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up staging area for raw data landing');

  const stagingArea = await ctx.task(stagingAreaTask, {
    pipelineName,
    pipelineType,
    requirementsAnalysis,
    ingestionLayer,
    outputDir
  });

  artifacts.push(...stagingArea.artifacts);

  // ============================================================================
  // PHASE 6: DATA TRANSFORMATION LOGIC DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing data transformation logic and business rules');

  const transformationDevelopment = await ctx.task(transformationDevelopmentTask, {
    pipelineName,
    pipelineType,
    transformationLogic,
    requirementsAnalysis,
    stagingArea,
    destinationSetup,
    outputDir
  });

  artifacts.push(...transformationDevelopment.artifacts);

  // Quality Gate: Transformation logic must be validated
  await ctx.breakpoint({
    question: `Phase 6 Complete: ${transformationDevelopment.transformationCount} transformations developed. Includes: ${transformationDevelopment.transformationTypes.join(', ')}. Review transformation logic?`,
    title: 'Transformation Logic Review',
    context: {
      runId: ctx.runId,
      transformationCount: transformationDevelopment.transformationCount,
      transformationTypes: transformationDevelopment.transformationTypes,
      lineage: transformationDevelopment.dataLineage,
      files: transformationDevelopment.artifacts.map(a => ({ path: a.path, format: a.format || 'sql' }))
    }
  });

  // ============================================================================
  // PHASE 7: DATA QUALITY VALIDATION FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing data quality validation framework');

  const dataQualityFramework = await ctx.task(dataQualityFrameworkTask, {
    pipelineName,
    dataQualityRules,
    requirementsAnalysis,
    transformationDevelopment,
    outputDir
  });

  artifacts.push(...dataQualityFramework.artifacts);

  // ============================================================================
  // PHASE 8: DATA QUALITY GATES CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Configuring data quality gates and validation checkpoints');

  const qualityGatesConfig = await ctx.task(qualityGatesConfigTask, {
    pipelineName,
    dataQualityRules,
    dataQualityFramework,
    transformationDevelopment,
    outputDir
  });

  artifacts.push(...qualityGatesConfig.artifacts);

  // ============================================================================
  // PHASE 9: ERROR HANDLING AND RETRY LOGIC
  // ============================================================================

  ctx.log('info', 'Phase 9: Implementing error handling, retry logic, and dead letter queues');

  const errorHandling = await ctx.task(errorHandlingTask, {
    pipelineName,
    pipelineType,
    requirementsAnalysis,
    orchestration,
    outputDir
  });

  artifacts.push(...errorHandling.artifacts);

  // ============================================================================
  // PHASE 10: ORCHESTRATION SETUP
  // ============================================================================

  ctx.log('info', `Phase 10: Setting up pipeline orchestration with ${orchestration.tool}`);

  const orchestrationSetup = await ctx.task(orchestrationSetupTask, {
    pipelineName,
    pipelineType,
    orchestration,
    requirementsAnalysis,
    ingestionLayer,
    transformationDevelopment,
    qualityGatesConfig,
    errorHandling,
    outputDir
  });

  artifacts.push(...orchestrationSetup.artifacts);

  // ============================================================================
  // PHASE 11: INCREMENTAL LOADING STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 11: Implementing incremental loading and change data capture');

  const incrementalLoading = await ctx.task(incrementalLoadingTask, {
    pipelineName,
    pipelineType,
    sources,
    requirementsAnalysis,
    transformationDevelopment,
    outputDir
  });

  artifacts.push(...incrementalLoading.artifacts);

  // ============================================================================
  // PHASE 12: MONITORING AND ALERTING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 12: Setting up pipeline monitoring, logging, and alerting');

  const monitoringSetup = await ctx.task(monitoringSetupTask, {
    pipelineName,
    pipelineType,
    monitoringConfig,
    orchestrationSetup,
    qualityGatesConfig,
    outputDir
  });

  artifacts.push(...monitoringSetup.artifacts);

  // ============================================================================
  // PHASE 13: DATA LINEAGE AND METADATA MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 13: Implementing data lineage tracking and metadata management');

  const lineageManagement = await ctx.task(lineageManagementTask, {
    pipelineName,
    sources,
    destinations,
    transformationDevelopment,
    requirementsAnalysis,
    outputDir
  });

  artifacts.push(...lineageManagement.artifacts);

  // ============================================================================
  // PHASE 14: PERFORMANCE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Optimizing pipeline performance and resource utilization');

  const performanceOptimization = await ctx.task(performanceOptimizationTask, {
    pipelineName,
    pipelineType,
    requirementsAnalysis,
    ingestionLayer,
    transformationDevelopment,
    orchestrationSetup,
    outputDir
  });

  artifacts.push(...performanceOptimization.artifacts);

  // ============================================================================
  // PHASE 15: SECURITY AND COMPLIANCE
  // ============================================================================

  ctx.log('info', 'Phase 15: Implementing security controls and compliance measures');

  const securityCompliance = await ctx.task(securityComplianceTask, {
    pipelineName,
    sources,
    destinations,
    requirementsAnalysis,
    transformationDevelopment,
    outputDir
  });

  artifacts.push(...securityCompliance.artifacts);

  // ============================================================================
  // PHASE 16: TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 16: Implementing comprehensive pipeline testing framework');

  const testingFramework = await ctx.task(testingFrameworkTask, {
    pipelineName,
    pipelineType,
    requirementsAnalysis,
    sourceConnectivity,
    transformationDevelopment,
    qualityGatesConfig,
    outputDir
  });

  artifacts.push(...testingFramework.artifacts);

  // ============================================================================
  // PHASE 17: DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 17: Generating comprehensive pipeline documentation');

  const documentation = await ctx.task(documentationGenerationTask, {
    pipelineName,
    pipelineType,
    requirementsAnalysis,
    sourceConnectivity,
    destinationSetup,
    ingestionLayer,
    transformationDevelopment,
    dataQualityFramework,
    qualityGatesConfig,
    orchestrationSetup,
    monitoringSetup,
    lineageManagement,
    securityCompliance,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 18: PIPELINE VALIDATION AND DRY RUN
  // ============================================================================

  ctx.log('info', 'Phase 18: Validating pipeline configuration and executing dry run');

  const validationResult = await ctx.task(pipelineValidationTask, {
    pipelineName,
    pipelineType,
    requirementsAnalysis,
    sourceConnectivity,
    destinationSetup,
    transformationDevelopment,
    qualityGatesConfig,
    orchestrationSetup,
    testingFramework,
    outputDir
  });

  artifacts.push(...validationResult.artifacts);

  const pipelineScore = validationResult.overallScore;
  const validationPassed = pipelineScore >= 75;

  // Quality Gate: Pipeline must meet quality criteria
  if (!validationPassed) {
    await ctx.breakpoint({
      question: `Phase 18 Warning: Pipeline validation score: ${pipelineScore}/100 (below threshold of 75). ${validationResult.failedChecks.length} check(s) failed. Review and fix issues before deployment?`,
      title: 'Pipeline Validation Issues',
      context: {
        runId: ctx.runId,
        validationScore: pipelineScore,
        passedChecks: validationResult.passedChecks,
        failedChecks: validationResult.failedChecks,
        recommendations: validationResult.recommendations,
        files: validationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 19: DEPLOYMENT PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 19: Preparing pipeline for deployment and creating deployment plan');

  const deploymentPrep = await ctx.task(deploymentPrepTask, {
    pipelineName,
    pipelineType,
    requirementsAnalysis,
    orchestrationSetup,
    validationResult,
    documentation,
    outputDir
  });

  artifacts.push(...deploymentPrep.artifacts);

  // ============================================================================
  // PHASE 20: FINAL REVIEW AND HANDOFF
  // ============================================================================

  ctx.log('info', 'Phase 20: Final review and handoff preparation');

  const finalReview = await ctx.task(finalReviewTask, {
    pipelineName,
    pipelineType,
    requirementsAnalysis,
    sourceConnectivity,
    destinationSetup,
    transformationDevelopment,
    qualityGatesConfig,
    orchestrationSetup,
    monitoringSetup,
    documentation,
    validationResult,
    deploymentPrep,
    outputDir
  });

  artifacts.push(...finalReview.artifacts);

  // Final Breakpoint: Pipeline Approval
  await ctx.breakpoint({
    question: `ETL/ELT Pipeline Setup Complete for ${pipelineName}! Validation score: ${pipelineScore}/100. Pipeline includes ${transformationDevelopment.transformationCount} transformations, ${qualityGatesConfig.totalGates} quality gates, ${sources.length} sources, ${destinations.length} destinations. Review deliverables and approve for deployment?`,
    title: 'Pipeline Setup Complete - Final Approval',
    context: {
      runId: ctx.runId,
      summary: {
        pipelineName,
        pipelineType,
        validationScore: pipelineScore,
        sourceCount: sources.length,
        destinationCount: destinations.length,
        transformationCount: transformationDevelopment.transformationCount,
        qualityGatesCount: qualityGatesConfig.totalGates,
        orchestrationTool: orchestration.tool,
        schedule: orchestration.schedule,
        monitoringEnabled: monitoringSetup.metricsEnabled,
        securityCompliant: securityCompliance.compliant
      },
      dataFlows: requirementsAnalysis.dataFlows,
      nextSteps: finalReview.nextSteps,
      deploymentChecklist: deploymentPrep.deploymentChecklist,
      files: [
        { path: documentation.readmePath, format: 'markdown', label: 'Pipeline Overview' },
        { path: documentation.architecturePath, format: 'markdown', label: 'Architecture Documentation' },
        { path: documentation.runbookPath, format: 'markdown', label: 'Operations Runbook' },
        { path: documentation.dataLineagePath, format: 'markdown', label: 'Data Lineage' },
        { path: validationResult.reportPath, format: 'json', label: 'Validation Report' },
        { path: deploymentPrep.deploymentPlanPath, format: 'markdown', label: 'Deployment Plan' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validationPassed && pipelineScore >= 75,
    pipelineName,
    pipelineType,
    pipelineConfig: {
      sources: sourceConnectivity.connections,
      destinations: destinationSetup.schemas,
      ingestion: ingestionLayer.ingestionConfig,
      staging: stagingArea.stagingConfig,
      transformations: transformationDevelopment.transformations,
      orchestration: orchestrationSetup.dagConfig,
      schedule: orchestration.schedule
    },
    dataFlows: requirementsAnalysis.dataFlows,
    qualityGates: qualityGatesConfig.gates,
    monitoring: {
      metricsEnabled: monitoringSetup.metricsEnabled,
      dashboardUrl: monitoringSetup.dashboardUrl,
      alerts: monitoringSetup.alerts,
      logAggregation: monitoringSetup.logAggregation
    },
    dataQuality: {
      framework: dataQualityFramework.framework,
      rules: dataQualityFramework.rules,
      gates: qualityGatesConfig.gates,
      validationCount: dataQualityFramework.validationCount
    },
    performance: {
      estimatedThroughput: performanceOptimization.estimatedThroughput,
      optimizations: performanceOptimization.optimizations,
      resourceRequirements: performanceOptimization.resourceRequirements
    },
    security: {
      compliant: securityCompliance.compliant,
      controls: securityCompliance.controls,
      encryption: securityCompliance.encryption,
      accessControl: securityCompliance.accessControl
    },
    lineage: {
      trackingEnabled: lineageManagement.trackingEnabled,
      tool: lineageManagement.tool,
      lineagePath: lineageManagement.lineagePath
    },
    testing: {
      framework: testingFramework.framework,
      testCount: testingFramework.testCount,
      coverage: testingFramework.coverage
    },
    documentation: {
      readme: documentation.readmePath,
      architecture: documentation.architecturePath,
      runbook: documentation.runbookPath,
      dataLineage: documentation.dataLineagePath,
      troubleshooting: documentation.troubleshootingPath
    },
    validation: {
      overallScore: pipelineScore,
      passedChecks: validationResult.passedChecks,
      failedChecks: validationResult.failedChecks,
      recommendations: validationResult.recommendations
    },
    deployment: {
      ready: deploymentPrep.deploymentReady,
      plan: deploymentPrep.deploymentPlanPath,
      checklist: deploymentPrep.deploymentChecklist,
      estimatedDowntime: deploymentPrep.estimatedDowntime
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/data-engineering-analytics/etl-elt-pipeline',
      timestamp: startTime,
      pipelineType,
      sources: sources.map(s => s.name),
      destinations: destinations.map(d => d.name)
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Requirements Analysis and Architecture Design
export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Analysis - ${args.pipelineName}`,
  agent: {
    name: 'data-architect',
    prompt: {
      role: 'Senior Data Architect with expertise in ETL/ELT pipeline design',
      task: 'Analyze requirements and design comprehensive pipeline architecture',
      context: {
        pipelineName: args.pipelineName,
        sources: args.sources,
        destinations: args.destinations,
        pipelineType: args.pipelineType,
        transformationLogic: args.transformationLogic,
        dataQualityRules: args.dataQualityRules,
        orchestration: args.orchestration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze source systems: types, schemas, volumes, update frequencies',
        '2. Analyze destination systems: capabilities, constraints, performance requirements',
        '3. Define data flows from each source to each destination',
        '4. Determine ETL vs ELT approach based on transformation complexity and volume',
        '5. Assess batch vs streaming requirements based on latency needs',
        '6. Estimate data volumes and growth projections',
        '7. Identify data quality requirements and validation rules',
        '8. Define SLA requirements (freshness, completeness, accuracy)',
        '9. Assess integration complexity (low, medium, high, very-high)',
        '10. Identify dependencies and external systems',
        '11. Design high-level architecture diagram',
        '12. Generate requirements analysis report'
      ],
      outputFormat: 'JSON with architecture design, data flows, complexity assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['dataFlows', 'complexity', 'estimatedDataVolume', 'artifacts'],
      properties: {
        dataFlows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              destination: { type: 'string' },
              frequency: { type: 'string' },
              volume: { type: 'string' },
              latencyRequirement: { type: 'string' },
              transformations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        complexity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'very-high']
        },
        estimatedDataVolume: {
          type: 'object',
          properties: {
            daily: { type: 'string' },
            monthly: { type: 'string' },
            growth: { type: 'string' }
          }
        },
        slaRequirements: {
          type: 'object',
          properties: {
            freshnessTarget: { type: 'string' },
            completenessTarget: { type: 'number' },
            accuracyTarget: { type: 'number' }
          }
        },
        architectureDecisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              rationale: { type: 'string' },
              alternatives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dependencies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-engineering', 'etl-elt', 'requirements-analysis', 'architecture']
}));

// Phase 2: Source System Connectivity Setup
export const sourceConnectivityTask = defineTask('source-connectivity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Source Connectivity - ${args.pipelineName}`,
  agent: {
    name: 'data-integration-engineer',
    prompt: {
      role: 'Data Integration Engineer',
      task: 'Set up connectivity to all source systems with authentication and validation',
      context: {
        pipelineName: args.pipelineName,
        sources: args.sources,
        requirementsAnalysis: args.requirementsAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each source system, configure connection parameters',
        '2. Set up authentication (credentials, API keys, service accounts)',
        '3. Configure network connectivity (VPN, private link, firewall rules)',
        '4. Test source system connectivity and permissions',
        '5. Configure connection pooling and timeout settings',
        '6. Set up schema discovery and metadata extraction',
        '7. Implement connection health checks and monitoring',
        '8. Document connection strings and configuration (mask secrets)',
        '9. Configure CDC (Change Data Capture) if applicable',
        '10. Set up source system query optimization',
        '11. Implement rate limiting and backpressure handling',
        '12. Generate source connectivity configuration'
      ],
      outputFormat: 'JSON with connection configurations for all sources'
    },
    outputSchema: {
      type: 'object',
      required: ['connections', 'artifacts'],
      properties: {
        connections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceName: { type: 'string' },
              sourceType: { type: 'string' },
              connectionConfig: { type: 'object' },
              authMethod: { type: 'string' },
              healthCheckEndpoint: { type: 'string' },
              cdcEnabled: { type: 'boolean' },
              schemaDiscovered: { type: 'boolean' }
            }
          }
        },
        connectivityTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceName: { type: 'string' },
              testType: { type: 'string' },
              status: { type: 'string', enum: ['passed', 'failed', 'warning'] },
              message: { type: 'string' }
            }
          }
        },
        schemaMetadata: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceName: { type: 'string' },
              tables: { type: 'array', items: { type: 'string' } },
              totalColumns: { type: 'number' },
              primaryKeys: { type: 'array' }
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
  labels: ['data-engineering', 'etl-elt', 'source-connectivity', 'integration']
}));

// Phase 3: Destination System Setup
export const destinationSetupTask = defineTask('destination-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Destination Setup - ${args.pipelineName}`,
  agent: {
    name: 'data-warehouse-engineer',
    prompt: {
      role: 'Data Warehouse Engineer',
      task: 'Configure destination systems with schema design and optimization',
      context: {
        pipelineName: args.pipelineName,
        destinations: args.destinations,
        requirementsAnalysis: args.requirementsAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design target schemas for each destination system',
        '2. Create database schemas, tables, and indexes',
        '3. Configure partitioning and clustering strategies',
        '4. Set up connection parameters and authentication',
        '5. Configure write optimization (batch size, concurrency)',
        '6. Design slowly changing dimension (SCD) strategies if applicable',
        '7. Set up data retention and archival policies',
        '8. Configure compression and encoding strategies',
        '9. Set up access control and permissions',
        '10. Implement table/view creation scripts',
        '11. Configure destination monitoring and alerts',
        '12. Generate destination setup documentation'
      ],
      outputFormat: 'JSON with destination schemas and configurations'
    },
    outputSchema: {
      type: 'object',
      required: ['schemas', 'artifacts'],
      properties: {
        schemas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              destinationName: { type: 'string' },
              destinationType: { type: 'string' },
              schemaName: { type: 'string' },
              tables: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    tableName: { type: 'string' },
                    columns: { type: 'array' },
                    primaryKey: { type: 'array', items: { type: 'string' } },
                    partitionKey: { type: 'string' },
                    clusterKey: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              scdType: { type: 'string' }
            }
          }
        },
        optimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              destinationName: { type: 'string' },
              optimization: { type: 'string' },
              estimatedImpact: { type: 'string' }
            }
          }
        },
        retentionPolicies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tableName: { type: 'string' },
              retentionDays: { type: 'number' },
              archivalStrategy: { type: 'string' }
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
  labels: ['data-engineering', 'etl-elt', 'destination-setup', 'schema-design']
}));

// Phase 4: Data Ingestion Layer Design
export const ingestionLayerTask = defineTask('ingestion-layer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Ingestion Layer - ${args.pipelineName}`,
  agent: {
    name: 'ingestion-engineer',
    prompt: {
      role: 'Data Ingestion Engineer',
      task: 'Design and implement data ingestion layer for batch and/or streaming patterns',
      context: {
        pipelineName: args.pipelineName,
        pipelineType: args.pipelineType,
        sources: args.sources,
        destinations: args.destinations,
        requirementsAnalysis: args.requirementsAnalysis,
        sourceConnectivity: args.sourceConnectivity,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design ingestion pattern based on pipeline type (batch/streaming/hybrid)',
        '2. For batch: configure extraction schedules and full/incremental logic',
        '3. For streaming: set up Kafka/Kinesis consumers with proper offset management',
        '4. Configure data extraction queries with optimization',
        '5. Implement parallel ingestion for large datasets',
        '6. Set up data serialization (Avro, Parquet, JSON)',
        '7. Configure compression for data transfer',
        '8. Implement checkpointing and resume capability',
        '9. Set up ingestion monitoring and metrics',
        '10. Configure backpressure handling and throttling',
        '11. Implement data validation at ingestion point',
        '12. Generate ingestion configuration and code'
      ],
      outputFormat: 'JSON with ingestion configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['ingestionConfig', 'ingestionPattern', 'artifacts'],
      properties: {
        ingestionConfig: {
          type: 'object',
          properties: {
            pattern: { type: 'string', enum: ['batch', 'streaming', 'hybrid'] },
            batchConfig: {
              type: 'object',
              properties: {
                schedule: { type: 'string' },
                extractionMode: { type: 'string', enum: ['full', 'incremental'] },
                parallelism: { type: 'number' },
                batchSize: { type: 'number' }
              }
            },
            streamingConfig: {
              type: 'object',
              properties: {
                consumer: { type: 'string' },
                consumerGroup: { type: 'string' },
                offsetStrategy: { type: 'string' },
                processingGuarantee: { type: 'string', enum: ['at-least-once', 'exactly-once'] }
              }
            }
          }
        },
        ingestionPattern: { type: 'string' },
        extractionQueries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceName: { type: 'string' },
              query: { type: 'string' },
              optimized: { type: 'boolean' }
            }
          }
        },
        serialization: {
          type: 'object',
          properties: {
            format: { type: 'string' },
            compression: { type: 'string' },
            schemaEvolution: { type: 'boolean' }
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
  labels: ['data-engineering', 'etl-elt', 'ingestion', 'extraction']
}));

// Phase 5: Staging Area Configuration
export const stagingAreaTask = defineTask('staging-area', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Staging Area - ${args.pipelineName}`,
  agent: {
    name: 'data-platform-engineer',
    prompt: {
      role: 'Data Platform Engineer',
      task: 'Set up staging area for raw data landing and temporary storage',
      context: {
        pipelineName: args.pipelineName,
        pipelineType: args.pipelineType,
        requirementsAnalysis: args.requirementsAnalysis,
        ingestionLayer: args.ingestionLayer,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design staging storage layer (S3, ADLS, GCS, database staging tables)',
        '2. Configure staging directory/table structure',
        '3. Set up data partitioning in staging area',
        '4. Configure staging data retention policies',
        '5. Implement staging data validation and schema checks',
        '6. Set up staging area monitoring and space alerts',
        '7. Configure staging to production promotion logic',
        '8. Implement staging data cleanup and archival',
        '9. Set up staging area access controls',
        '10. Configure staging data format and compression',
        '11. Implement staging metadata tracking',
        '12. Generate staging configuration'
      ],
      outputFormat: 'JSON with staging area configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['stagingConfig', 'artifacts'],
      properties: {
        stagingConfig: {
          type: 'object',
          properties: {
            storageType: { type: 'string' },
            location: { type: 'string' },
            structure: { type: 'object' },
            partitioning: { type: 'object' },
            retentionDays: { type: 'number' }
          }
        },
        stagingTables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tableName: { type: 'string' },
              sourceSystem: { type: 'string' },
              schema: { type: 'object' },
              loadType: { type: 'string', enum: ['append', 'overwrite', 'upsert'] }
            }
          }
        },
        validationRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ruleName: { type: 'string' },
              ruleType: { type: 'string' },
              action: { type: 'string', enum: ['warn', 'fail', 'quarantine'] }
            }
          }
        },
        cleanupPolicy: {
          type: 'object',
          properties: {
            automaticCleanup: { type: 'boolean' },
            retentionDays: { type: 'number' },
            archivalEnabled: { type: 'boolean' }
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
  labels: ['data-engineering', 'etl-elt', 'staging', 'storage']
}));

// Phase 6: Data Transformation Logic Development
export const transformationDevelopmentTask = defineTask('transformation-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Transformation Development - ${args.pipelineName}`,
  agent: {
    name: 'analytics-engineer',
    prompt: {
      role: 'Analytics Engineer with expertise in SQL and dbt',
      task: 'Develop comprehensive data transformation logic and business rules',
      context: {
        pipelineName: args.pipelineName,
        pipelineType: args.pipelineType,
        transformationLogic: args.transformationLogic,
        requirementsAnalysis: args.requirementsAnalysis,
        stagingArea: args.stagingArea,
        destinationSetup: args.destinationSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design transformation layer structure (staging -> intermediate -> final)',
        '2. Develop data cleaning transformations (nulls, duplicates, formatting)',
        '3. Implement data enrichment logic (lookups, calculations, derived fields)',
        '4. Create aggregation and summarization transformations',
        '5. Implement business logic and calculations',
        '6. Set up dbt models if applicable (sources, staging, intermediate, marts)',
        '7. Implement slowly changing dimensions (SCD) logic',
        '8. Create data denormalization for analytics use cases',
        '9. Implement data lineage tracking in transformations',
        '10. Optimize transformation queries for performance',
        '11. Document transformation logic and business rules',
        '12. Generate transformation code (SQL, Python, Spark)'
      ],
      outputFormat: 'JSON with transformation specifications and code'
    },
    outputSchema: {
      type: 'object',
      required: ['transformationCount', 'transformationTypes', 'transformations', 'artifacts'],
      properties: {
        transformationCount: { type: 'number' },
        transformationTypes: {
          type: 'array',
          items: { type: 'string' }
        },
        transformations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              layer: { type: 'string', enum: ['staging', 'intermediate', 'final'] },
              dependencies: { type: 'array', items: { type: 'string' } },
              businessLogic: { type: 'string' },
              sourceObjects: { type: 'array', items: { type: 'string' } },
              targetObject: { type: 'string' }
            }
          }
        },
        dbtModels: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            modelCount: { type: 'number' },
            testCount: { type: 'number' }
          }
        },
        dataLineage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              transformations: { type: 'array', items: { type: 'string' } },
              destination: { type: 'string' }
            }
          }
        },
        optimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              transformation: { type: 'string' },
              optimization: { type: 'string' },
              estimatedImpact: { type: 'string' }
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
  labels: ['data-engineering', 'etl-elt', 'transformation', 'analytics-engineering']
}));

// Phase 7: Data Quality Validation Framework
export const dataQualityFrameworkTask = defineTask('data-quality-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Data Quality Framework - ${args.pipelineName}`,
  agent: {
    name: 'data-quality-engineer',
    prompt: {
      role: 'Data Quality Engineer',
      task: 'Implement comprehensive data quality validation framework',
      context: {
        pipelineName: args.pipelineName,
        dataQualityRules: args.dataQualityRules,
        requirementsAnalysis: args.requirementsAnalysis,
        transformationDevelopment: args.transformationDevelopment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select data quality framework (Great Expectations, Soda, dbt tests, custom)',
        '2. Define data quality dimensions (completeness, accuracy, consistency, timeliness)',
        '3. Implement schema validation rules',
        '4. Create null value checks with thresholds',
        '5. Implement range and boundary checks',
        '6. Set up uniqueness and duplicate detection',
        '7. Implement referential integrity checks',
        '8. Create custom business rule validations',
        '9. Set up data freshness checks',
        '10. Implement statistical anomaly detection',
        '11. Configure quality validation execution points',
        '12. Generate data quality test suite'
      ],
      outputFormat: 'JSON with data quality framework configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'validationCount', 'rules', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            version: { type: 'string' },
            configPath: { type: 'string' }
          }
        },
        validationCount: { type: 'number' },
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ruleName: { type: 'string' },
              dimension: { type: 'string' },
              table: { type: 'string' },
              column: { type: 'string' },
              validationType: { type: 'string' },
              threshold: { type: 'number' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        qualityDimensions: {
          type: 'object',
          properties: {
            completeness: { type: 'array', items: { type: 'string' } },
            accuracy: { type: 'array', items: { type: 'string' } },
            consistency: { type: 'array', items: { type: 'string' } },
            timeliness: { type: 'array', items: { type: 'string' } },
            validity: { type: 'array', items: { type: 'string' } }
          }
        },
        executionPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              validations: { type: 'array', items: { type: 'string' } }
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
  labels: ['data-engineering', 'etl-elt', 'data-quality', 'validation']
}));

// Phase 8: Data Quality Gates Configuration
export const qualityGatesConfigTask = defineTask('quality-gates-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Quality Gates - ${args.pipelineName}`,
  agent: {
    name: 'pipeline-quality-engineer',
    prompt: {
      role: 'Pipeline Quality Engineer',
      task: 'Configure data quality gates and validation checkpoints throughout pipeline',
      context: {
        pipelineName: args.pipelineName,
        dataQualityRules: args.dataQualityRules,
        dataQualityFramework: args.dataQualityFramework,
        transformationDevelopment: args.transformationDevelopment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define quality gate checkpoints in pipeline (ingestion, staging, transformation, load)',
        '2. Set up pre-load quality gates to prevent bad data from entering warehouse',
        '3. Configure post-load quality gates for data verification',
        '4. Define pass/fail criteria for each quality gate',
        '5. Implement warning thresholds vs failure thresholds',
        '6. Set up quality gate actions (block pipeline, quarantine data, alert)',
        '7. Configure quality gate bypass procedures for emergencies',
        '8. Implement quality score calculation across dimensions',
        '9. Set up quality gate reporting and dashboards',
        '10. Configure quality gate notifications and escalations',
        '11. Document quality gate procedures and override policies',
        '12. Generate quality gates configuration'
      ],
      outputFormat: 'JSON with quality gates configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['totalGates', 'gates', 'artifacts'],
      properties: {
        totalGates: { type: 'number' },
        gates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gateId: { type: 'string' },
              gateName: { type: 'string' },
              stage: { type: 'string' },
              validations: { type: 'array', items: { type: 'string' } },
              passCriteria: { type: 'object' },
              failureAction: { type: 'string', enum: ['block', 'warn', 'quarantine'] },
              criticalGate: { type: 'boolean' }
            }
          }
        },
        thresholds: {
          type: 'object',
          properties: {
            warningThreshold: { type: 'number' },
            failureThreshold: { type: 'number' },
            criticalThreshold: { type: 'number' }
          }
        },
        quarantineConfig: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            location: { type: 'string' },
            retentionDays: { type: 'number' }
          }
        },
        bypassProcedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              approvalRequired: { type: 'boolean' },
              procedure: { type: 'string' }
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
  labels: ['data-engineering', 'etl-elt', 'quality-gates', 'validation']
}));

// Phase 9: Error Handling and Retry Logic
export const errorHandlingTask = defineTask('error-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Error Handling - ${args.pipelineName}`,
  agent: {
    name: 'reliability-engineer',
    prompt: {
      role: 'Pipeline Reliability Engineer',
      task: 'Implement comprehensive error handling, retry logic, and dead letter queues',
      context: {
        pipelineName: args.pipelineName,
        pipelineType: args.pipelineType,
        requirementsAnalysis: args.requirementsAnalysis,
        orchestration: args.orchestration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify failure scenarios (connection failures, data quality failures, timeouts)',
        '2. Implement retry logic with exponential backoff',
        '3. Configure maximum retry attempts per failure type',
        '4. Set up dead letter queues for unrecoverable failures',
        '5. Implement circuit breaker patterns for external dependencies',
        '6. Configure error logging with context and debugging information',
        '7. Set up error notification and alerting',
        '8. Implement partial failure handling (continue vs abort)',
        '9. Configure error recovery procedures',
        '10. Set up error metrics and monitoring',
        '11. Document error codes and troubleshooting guides',
        '12. Generate error handling configuration'
      ],
      outputFormat: 'JSON with error handling configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['retryPolicy', 'errorHandlers', 'artifacts'],
      properties: {
        retryPolicy: {
          type: 'object',
          properties: {
            maxRetries: { type: 'number' },
            backoffStrategy: { type: 'string', enum: ['exponential', 'linear', 'fixed'] },
            initialDelay: { type: 'string' },
            maxDelay: { type: 'string' }
          }
        },
        errorHandlers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              errorType: { type: 'string' },
              retryable: { type: 'boolean' },
              maxRetries: { type: 'number' },
              action: { type: 'string', enum: ['retry', 'dlq', 'alert', 'abort'] }
            }
          }
        },
        deadLetterQueue: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            location: { type: 'string' },
            retentionDays: { type: 'number' },
            reprocessingEnabled: { type: 'boolean' }
          }
        },
        circuitBreaker: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            failureThreshold: { type: 'number' },
            resetTimeout: { type: 'string' }
          }
        },
        notifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              errorSeverity: { type: 'string' },
              channels: { type: 'array', items: { type: 'string' } },
              recipients: { type: 'array', items: { type: 'string' } }
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
  labels: ['data-engineering', 'etl-elt', 'error-handling', 'reliability']
}));

// Phase 10: Orchestration Setup
export const orchestrationSetupTask = defineTask('orchestration-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Orchestration Setup - ${args.pipelineName}`,
  agent: {
    name: 'orchestration-engineer',
    prompt: {
      role: 'Data Orchestration Engineer',
      task: `Set up pipeline orchestration and scheduling using ${args.orchestration.tool}`,
      context: {
        pipelineName: args.pipelineName,
        pipelineType: args.pipelineType,
        orchestration: args.orchestration,
        requirementsAnalysis: args.requirementsAnalysis,
        ingestionLayer: args.ingestionLayer,
        transformationDevelopment: args.transformationDevelopment,
        qualityGatesConfig: args.qualityGatesConfig,
        errorHandling: args.errorHandling,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Set up ${args.orchestration.tool} environment and dependencies`,
        '2. Create DAG/workflow definition with all pipeline stages',
        '3. Configure task dependencies and execution order',
        '4. Implement scheduling based on requirements (cron, event-driven)',
        '5. Set up parallel task execution for independent operations',
        '6. Configure task timeouts and SLA monitoring',
        '7. Implement sensor tasks for data availability checks',
        '8. Set up variable management and parameterization',
        '9. Configure retry logic integration',
        '10. Set up alerting and failure notifications',
        '11. Implement backfill capabilities for historical data',
        '12. Generate orchestration DAG/workflow code'
      ],
      outputFormat: 'JSON with orchestration configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['dagConfig', 'schedule', 'artifacts'],
      properties: {
        dagConfig: {
          type: 'object',
          properties: {
            dagId: { type: 'string' },
            tool: { type: 'string' },
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  taskId: { type: 'string' },
                  taskType: { type: 'string' },
                  dependencies: { type: 'array', items: { type: 'string' } },
                  timeout: { type: 'string' },
                  retries: { type: 'number' }
                }
              }
            },
            parallelTasks: { type: 'array', items: { type: 'array' } }
          }
        },
        schedule: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['cron', 'interval', 'event-driven', 'manual'] },
            expression: { type: 'string' },
            timezone: { type: 'string' },
            catchup: { type: 'boolean' }
          }
        },
        slaConfig: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            slaThreshold: { type: 'string' },
            alertOnMiss: { type: 'boolean' }
          }
        },
        sensors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sensorName: { type: 'string' },
              sensorType: { type: 'string' },
              checkCondition: { type: 'string' }
            }
          }
        },
        backfillConfig: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            startDate: { type: 'string' },
            endDate: { type: 'string' }
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
  labels: ['data-engineering', 'etl-elt', 'orchestration', args.orchestration.tool]
}));

// Phase 11: Incremental Loading Strategy
export const incrementalLoadingTask = defineTask('incremental-loading', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Incremental Loading - ${args.pipelineName}`,
  agent: {
    name: 'data-optimization-engineer',
    prompt: {
      role: 'Data Pipeline Optimization Engineer',
      task: 'Implement incremental loading strategy and change data capture',
      context: {
        pipelineName: args.pipelineName,
        pipelineType: args.pipelineType,
        sources: args.sources,
        requirementsAnalysis: args.requirementsAnalysis,
        transformationDevelopment: args.transformationDevelopment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify incremental loading strategy per source (timestamp, CDC, log-based)',
        '2. Implement high-water mark tracking for timestamp-based incremental',
        '3. Set up Change Data Capture (CDC) if applicable',
        '4. Configure merge/upsert logic for incremental updates',
        '5. Implement deleted records handling',
        '6. Set up incremental metadata tracking',
        '7. Configure full refresh schedule alongside incremental',
        '8. Implement data deduplication logic',
        '9. Set up incremental validation checks',
        '10. Optimize incremental query performance',
        '11. Document incremental loading patterns',
        '12. Generate incremental loading configuration'
      ],
      outputFormat: 'JSON with incremental loading configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['incrementalStrategy', 'artifacts'],
      properties: {
        incrementalStrategy: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceName: { type: 'string' },
              table: { type: 'string' },
              strategy: { type: 'string', enum: ['timestamp', 'cdc', 'log-based', 'full-refresh'] },
              incrementalKey: { type: 'string' },
              cdcConfig: { type: 'object' },
              mergeLogic: { type: 'string' }
            }
          }
        },
        highWatermarkTracking: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            storageLocation: { type: 'string' },
            updateFrequency: { type: 'string' }
          }
        },
        cdcConfiguration: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            tool: { type: 'string' },
            captureDeletes: { type: 'boolean' },
            captureUpdates: { type: 'boolean' }
          }
        },
        fullRefreshSchedule: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            frequency: { type: 'string' },
            tables: { type: 'array', items: { type: 'string' } }
          }
        },
        deduplication: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            dedupeKeys: { type: 'array', items: { type: 'string' } },
            strategy: { type: 'string' }
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
  labels: ['data-engineering', 'etl-elt', 'incremental-loading', 'cdc']
}));

// Phase 12: Monitoring and Alerting Setup
export const monitoringSetupTask = defineTask('monitoring-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Monitoring and Alerting - ${args.pipelineName}`,
  agent: {
    name: 'observability-engineer',
    prompt: {
      role: 'Data Pipeline Observability Engineer',
      task: 'Set up comprehensive pipeline monitoring, logging, and alerting',
      context: {
        pipelineName: args.pipelineName,
        pipelineType: args.pipelineType,
        monitoringConfig: args.monitoringConfig,
        orchestrationSetup: args.orchestrationSetup,
        qualityGatesConfig: args.qualityGatesConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up pipeline execution metrics (duration, success rate, failure rate)',
        '2. Configure data quality metrics tracking',
        '3. Implement data freshness monitoring',
        '4. Set up data volume and throughput metrics',
        '5. Configure resource utilization monitoring',
        '6. Set up log aggregation and centralized logging',
        '7. Create monitoring dashboards (Grafana, Datadog, etc.)',
        '8. Configure alerts for pipeline failures',
        '9. Set up data quality alerts with thresholds',
        '10. Implement SLA breach alerting',
        '11. Configure on-call escalation procedures',
        '12. Generate monitoring configuration'
      ],
      outputFormat: 'JSON with monitoring configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['metricsEnabled', 'alerts', 'artifacts'],
      properties: {
        metricsEnabled: { type: 'boolean' },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metricName: { type: 'string' },
              metricType: { type: 'string' },
              aggregation: { type: 'string' },
              dimensions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dashboardUrl: { type: 'string' },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dashboardName: { type: 'string' },
              widgets: { type: 'array', items: { type: 'string' } },
              refreshInterval: { type: 'string' }
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
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              channels: { type: 'array', items: { type: 'string' } },
              escalationPolicy: { type: 'string' }
            }
          }
        },
        logAggregation: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            platform: { type: 'string' },
            retentionDays: { type: 'number' },
            indexing: { type: 'boolean' }
          }
        },
        slaMonitoring: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            freshnessThreshold: { type: 'string' },
            completenessThreshold: { type: 'number' }
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
  labels: ['data-engineering', 'etl-elt', 'monitoring', 'observability']
}));

// Phase 13: Data Lineage and Metadata Management
export const lineageManagementTask = defineTask('lineage-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Lineage and Metadata - ${args.pipelineName}`,
  agent: {
    name: 'metadata-engineer',
    prompt: {
      role: 'Data Governance and Metadata Engineer',
      task: 'Implement data lineage tracking and metadata management',
      context: {
        pipelineName: args.pipelineName,
        sources: args.sources,
        destinations: args.destinations,
        transformationDevelopment: args.transformationDevelopment,
        requirementsAnalysis: args.requirementsAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select lineage tracking tool (OpenLineage, DataHub, Apache Atlas)',
        '2. Instrument pipeline to emit lineage events',
        '3. Track column-level lineage through transformations',
        '4. Document data sources and their business context',
        '5. Track transformation logic in metadata',
        '6. Set up business glossary and data dictionary',
        '7. Implement data classification and tagging',
        '8. Track data ownership and stewardship',
        '9. Document data quality rules in metadata',
        '10. Set up lineage visualization',
        '11. Implement impact analysis capabilities',
        '12. Generate lineage documentation'
      ],
      outputFormat: 'JSON with lineage and metadata configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['trackingEnabled', 'tool', 'artifacts'],
      properties: {
        trackingEnabled: { type: 'boolean' },
        tool: { type: 'string' },
        lineageConfig: {
          type: 'object',
          properties: {
            granularity: { type: 'string', enum: ['table', 'column', 'both'] },
            captureTransformations: { type: 'boolean' },
            captureQuality: { type: 'boolean' }
          }
        },
        lineagePath: { type: 'string' },
        metadata: {
          type: 'object',
          properties: {
            businessGlossary: { type: 'boolean' },
            dataDictionary: { type: 'boolean' },
            dataClassification: { type: 'boolean' },
            ownershipTracking: { type: 'boolean' }
          }
        },
        visualization: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            url: { type: 'string' }
          }
        },
        impactAnalysis: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            downstream: { type: 'boolean' },
            upstream: { type: 'boolean' }
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
  labels: ['data-engineering', 'etl-elt', 'lineage', 'metadata', 'governance']
}));

// Phase 14: Performance Optimization
export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Performance Optimization - ${args.pipelineName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Data Pipeline Performance Engineer',
      task: 'Optimize pipeline performance and resource utilization',
      context: {
        pipelineName: args.pipelineName,
        pipelineType: args.pipelineType,
        requirementsAnalysis: args.requirementsAnalysis,
        ingestionLayer: args.ingestionLayer,
        transformationDevelopment: args.transformationDevelopment,
        orchestrationSetup: args.orchestrationSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze pipeline bottlenecks and execution times',
        '2. Optimize extraction queries with proper indexing',
        '3. Configure parallel processing for large datasets',
        '4. Optimize transformation queries (pushdown, partitioning)',
        '5. Implement data partitioning and bucketing strategies',
        '6. Configure connection pooling and batch sizing',
        '7. Optimize memory and CPU resource allocation',
        '8. Implement caching for reference data',
        '9. Configure compression and serialization optimization',
        '10. Set up auto-scaling for variable workloads',
        '11. Calculate estimated throughput and latency',
        '12. Generate optimization recommendations'
      ],
      outputFormat: 'JSON with performance optimization configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedThroughput', 'optimizations', 'artifacts'],
      properties: {
        estimatedThroughput: {
          type: 'object',
          properties: {
            recordsPerHour: { type: 'string' },
            gbPerHour: { type: 'string' },
            endToEndLatency: { type: 'string' }
          }
        },
        optimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optimization: { type: 'string' },
              component: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              estimatedImprovement: { type: 'string' }
            }
          }
        },
        parallelization: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            parallelDegree: { type: 'number' },
            partitionStrategy: { type: 'string' }
          }
        },
        resourceRequirements: {
          type: 'object',
          properties: {
            cpu: { type: 'string' },
            memory: { type: 'string' },
            storage: { type: 'string' },
            estimatedCost: { type: 'string' }
          }
        },
        autoScaling: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            minWorkers: { type: 'number' },
            maxWorkers: { type: 'number' },
            scalingMetric: { type: 'string' }
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
  labels: ['data-engineering', 'etl-elt', 'performance', 'optimization']
}));

// Phase 15: Security and Compliance
export const securityComplianceTask = defineTask('security-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Security and Compliance - ${args.pipelineName}`,
  agent: {
    name: 'security-engineer',
    prompt: {
      role: 'Data Security and Compliance Engineer',
      task: 'Implement security controls and compliance measures for data pipeline',
      context: {
        pipelineName: args.pipelineName,
        sources: args.sources,
        destinations: args.destinations,
        requirementsAnalysis: args.requirementsAnalysis,
        transformationDevelopment: args.transformationDevelopment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement encryption at rest for staging and destination data',
        '2. Configure encryption in transit for all data transfers',
        '3. Set up secrets management (AWS Secrets Manager, Vault)',
        '4. Implement data masking and anonymization for PII',
        '5. Configure role-based access control (RBAC)',
        '6. Set up audit logging for all pipeline operations',
        '7. Implement data retention and deletion policies',
        '8. Configure compliance controls (GDPR, HIPAA, SOC2)',
        '9. Set up data classification and sensitivity tagging',
        '10. Implement security scanning for vulnerabilities',
        '11. Document security controls and compliance measures',
        '12. Generate security configuration'
      ],
      outputFormat: 'JSON with security and compliance configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['compliant', 'controls', 'artifacts'],
      properties: {
        compliant: { type: 'boolean' },
        controls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              controlName: { type: 'string' },
              controlType: { type: 'string' },
              implemented: { type: 'boolean' },
              framework: { type: 'string' }
            }
          }
        },
        encryption: {
          type: 'object',
          properties: {
            atRest: { type: 'boolean' },
            inTransit: { type: 'boolean' },
            keyManagement: { type: 'string' }
          }
        },
        accessControl: {
          type: 'object',
          properties: {
            rbacEnabled: { type: 'boolean' },
            roles: { type: 'array', items: { type: 'string' } },
            leastPrivilege: { type: 'boolean' }
          }
        },
        piiProtection: {
          type: 'object',
          properties: {
            identificationEnabled: { type: 'boolean' },
            maskingEnabled: { type: 'boolean' },
            anonymizationEnabled: { type: 'boolean' },
            piiFields: { type: 'array', items: { type: 'string' } }
          }
        },
        auditLogging: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            retentionDays: { type: 'number' },
            immutable: { type: 'boolean' }
          }
        },
        complianceFrameworks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              framework: { type: 'string' },
              compliant: { type: 'boolean' },
              controls: { type: 'array', items: { type: 'string' } }
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
  labels: ['data-engineering', 'etl-elt', 'security', 'compliance']
}));

// Phase 16: Testing and Validation
export const testingFrameworkTask = defineTask('testing-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Testing Framework - ${args.pipelineName}`,
  agent: {
    name: 'qa-engineer',
    prompt: {
      role: 'Data Pipeline QA Engineer',
      task: 'Implement comprehensive pipeline testing framework',
      context: {
        pipelineName: args.pipelineName,
        pipelineType: args.pipelineType,
        requirementsAnalysis: args.requirementsAnalysis,
        sourceConnectivity: args.sourceConnectivity,
        transformationDevelopment: args.transformationDevelopment,
        qualityGatesConfig: args.qualityGatesConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design testing strategy (unit, integration, end-to-end)',
        '2. Create unit tests for transformation logic',
        '3. Implement integration tests for source/destination connectivity',
        '4. Set up end-to-end tests with sample datasets',
        '5. Create data quality test cases',
        '6. Implement schema evolution tests',
        '7. Set up performance and load testing',
        '8. Create regression test suite',
        '9. Implement test data generation and fixtures',
        '10. Set up CI/CD pipeline for automated testing',
        '11. Calculate test coverage metrics',
        '12. Generate testing framework configuration'
      ],
      outputFormat: 'JSON with testing framework configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'testCount', 'coverage', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            testRunner: { type: 'string' }
          }
        },
        testCount: { type: 'number' },
        testSuites: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              suiteName: { type: 'string' },
              testType: { type: 'string', enum: ['unit', 'integration', 'e2e', 'performance'] },
              testCount: { type: 'number' },
              automated: { type: 'boolean' }
            }
          }
        },
        coverage: {
          type: 'object',
          properties: {
            transformationCoverage: { type: 'number' },
            dataQualityCoverage: { type: 'number' },
            integrationCoverage: { type: 'number' }
          }
        },
        testData: {
          type: 'object',
          properties: {
            fixturesCreated: { type: 'boolean' },
            syntheticDataGeneration: { type: 'boolean' },
            sampleDatasets: { type: 'array', items: { type: 'string' } }
          }
        },
        cicdIntegration: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            automatedTesting: { type: 'boolean' },
            deploymentGating: { type: 'boolean' }
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
  labels: ['data-engineering', 'etl-elt', 'testing', 'qa']
}));

// Phase 17: Documentation Generation
export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 17: Documentation - ${args.pipelineName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Data Engineering Technical Writer',
      task: 'Generate comprehensive pipeline documentation',
      context: {
        pipelineName: args.pipelineName,
        pipelineType: args.pipelineType,
        requirementsAnalysis: args.requirementsAnalysis,
        sourceConnectivity: args.sourceConnectivity,
        destinationSetup: args.destinationSetup,
        ingestionLayer: args.ingestionLayer,
        transformationDevelopment: args.transformationDevelopment,
        dataQualityFramework: args.dataQualityFramework,
        qualityGatesConfig: args.qualityGatesConfig,
        orchestrationSetup: args.orchestrationSetup,
        monitoringSetup: args.monitoringSetup,
        lineageManagement: args.lineageManagement,
        securityCompliance: args.securityCompliance,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create comprehensive README with pipeline overview',
        '2. Document pipeline architecture with diagrams',
        '3. Document source systems and connection details',
        '4. Document destination schemas and data models',
        '5. Document transformation logic and business rules',
        '6. Create data lineage documentation',
        '7. Document data quality rules and gates',
        '8. Create operations runbook with procedures',
        '9. Document monitoring and alerting setup',
        '10. Create troubleshooting guide',
        '11. Document security and compliance controls',
        '12. Generate all documentation artifacts'
      ],
      outputFormat: 'JSON with documentation file paths'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'architecturePath', 'runbookPath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        architecturePath: { type: 'string' },
        runbookPath: { type: 'string' },
        dataLineagePath: { type: 'string' },
        troubleshootingPath: { type: 'string' },
        securityDocPath: { type: 'string' },
        transformationDocPath: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              filePath: { type: 'string' },
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
  labels: ['data-engineering', 'etl-elt', 'documentation']
}));

// Phase 18: Pipeline Validation and Dry Run
export const pipelineValidationTask = defineTask('pipeline-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 18: Pipeline Validation - ${args.pipelineName}`,
  agent: {
    name: 'validation-engineer',
    prompt: {
      role: 'Pipeline Validation Engineer',
      task: 'Validate complete pipeline configuration and execute dry run',
      context: {
        pipelineName: args.pipelineName,
        pipelineType: args.pipelineType,
        requirementsAnalysis: args.requirementsAnalysis,
        sourceConnectivity: args.sourceConnectivity,
        destinationSetup: args.destinationSetup,
        transformationDevelopment: args.transformationDevelopment,
        qualityGatesConfig: args.qualityGatesConfig,
        orchestrationSetup: args.orchestrationSetup,
        testingFramework: args.testingFramework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate all source connections are functional',
        '2. Validate destination schemas are properly created',
        '3. Validate transformation logic syntax and dependencies',
        '4. Validate data quality rules are properly configured',
        '5. Validate orchestration DAG/workflow is valid',
        '6. Execute dry run with sample data',
        '7. Validate end-to-end data flow',
        '8. Check for configuration inconsistencies',
        '9. Validate security and access controls',
        '10. Run automated test suite',
        '11. Calculate overall validation score (0-100)',
        '12. Generate validation report with recommendations'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'passedChecks', 'failedChecks', 'artifacts'],
      properties: {
        overallScore: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        passedChecks: {
          type: 'array',
          items: { type: 'string' }
        },
        failedChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        warnings: {
          type: 'array',
          items: { type: 'string' }
        },
        dryRunResults: {
          type: 'object',
          properties: {
            executed: { type: 'boolean' },
            success: { type: 'boolean' },
            recordsProcessed: { type: 'number' },
            duration: { type: 'string' },
            issues: { type: 'array', items: { type: 'string' } }
          }
        },
        recommendations: {
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
  labels: ['data-engineering', 'etl-elt', 'validation', 'testing']
}));

// Phase 19: Deployment Preparation
export const deploymentPrepTask = defineTask('deployment-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 19: Deployment Preparation - ${args.pipelineName}`,
  agent: {
    name: 'deployment-engineer',
    prompt: {
      role: 'Data Pipeline Deployment Engineer',
      task: 'Prepare pipeline for production deployment',
      context: {
        pipelineName: args.pipelineName,
        pipelineType: args.pipelineType,
        requirementsAnalysis: args.requirementsAnalysis,
        orchestrationSetup: args.orchestrationSetup,
        validationResult: args.validationResult,
        documentation: args.documentation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create deployment plan with rollout strategy',
        '2. Prepare production environment configurations',
        '3. Set up production secrets and credentials',
        '4. Create deployment checklist',
        '5. Prepare rollback procedures',
        '6. Schedule deployment window',
        '7. Identify deployment dependencies',
        '8. Prepare communication plan for stakeholders',
        '9. Set up production monitoring and alerting',
        '10. Prepare post-deployment verification tests',
        '11. Estimate deployment downtime if applicable',
        '12. Generate deployment guide'
      ],
      outputFormat: 'JSON with deployment preparation details'
    },
    outputSchema: {
      type: 'object',
      required: ['deploymentReady', 'deploymentPlanPath', 'deploymentChecklist', 'artifacts'],
      properties: {
        deploymentReady: { type: 'boolean' },
        deploymentPlanPath: { type: 'string' },
        deploymentStrategy: {
          type: 'object',
          properties: {
            approach: { type: 'string', enum: ['big-bang', 'phased', 'blue-green', 'canary'] },
            phases: { type: 'array', items: { type: 'string' } },
            rollbackPlan: { type: 'string' }
          }
        },
        deploymentChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              completed: { type: 'boolean' },
              responsible: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        deploymentWindow: {
          type: 'object',
          properties: {
            scheduledDate: { type: 'string' },
            startTime: { type: 'string' },
            estimatedDuration: { type: 'string' }
          }
        },
        estimatedDowntime: { type: 'string' },
        verificationTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              testType: { type: 'string' },
              passCriteria: { type: 'string' }
            }
          }
        },
        communicationPlan: {
          type: 'object',
          properties: {
            stakeholders: { type: 'array', items: { type: 'string' } },
            notificationChannels: { type: 'array', items: { type: 'string' } },
            statusUpdateFrequency: { type: 'string' }
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
  labels: ['data-engineering', 'etl-elt', 'deployment', 'preparation']
}));

// Phase 20: Final Review and Handoff
export const finalReviewTask = defineTask('final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 20: Final Review - ${args.pipelineName}`,
  agent: {
    name: 'data-engineering-lead',
    prompt: {
      role: 'Data Engineering Team Lead',
      task: 'Conduct final review and prepare for pipeline handoff',
      context: {
        pipelineName: args.pipelineName,
        pipelineType: args.pipelineType,
        requirementsAnalysis: args.requirementsAnalysis,
        sourceConnectivity: args.sourceConnectivity,
        destinationSetup: args.destinationSetup,
        transformationDevelopment: args.transformationDevelopment,
        qualityGatesConfig: args.qualityGatesConfig,
        orchestrationSetup: args.orchestrationSetup,
        monitoringSetup: args.monitoringSetup,
        documentation: args.documentation,
        validationResult: args.validationResult,
        deploymentPrep: args.deploymentPrep,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review all pipeline components and configurations',
        '2. Verify data quality and validation framework',
        '3. Review security and compliance controls',
        '4. Verify monitoring and alerting setup',
        '5. Review documentation completeness',
        '6. Verify test coverage and validation results',
        '7. Create handoff checklist for operations team',
        '8. Define next steps and action items',
        '9. Identify training needs',
        '10. Define success criteria for first production run',
        '11. Schedule knowledge transfer sessions',
        '12. Generate final review report'
      ],
      outputFormat: 'JSON with final review and next steps'
    },
    outputSchema: {
      type: 'object',
      required: ['nextSteps', 'artifacts'],
      properties: {
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              priority: { type: 'string', enum: ['immediate', 'high', 'medium', 'low'] },
              estimatedDuration: { type: 'string' }
            }
          }
        },
        handoffChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              completed: { type: 'boolean' },
              responsible: { type: 'string' }
            }
          }
        },
        successCriteria: {
          type: 'array',
          items: { type: 'string' }
        },
        trainingNeeds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              audience: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        knowledgeTransfer: {
          type: 'object',
          properties: {
            sessionsScheduled: { type: 'boolean' },
            sessions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  topic: { type: 'string' },
                  date: { type: 'string' },
                  attendees: { type: 'array', items: { type: 'string' } }
                }
              }
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
  labels: ['data-engineering', 'etl-elt', 'final-review', 'handoff']
}));
