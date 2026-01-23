/**
 * @process specializations/data-engineering-analytics/feature-store
 * @description Feature Store Setup for Data Engineering - Design and implement production-ready feature store
 * infrastructure with feature engineering pipelines, offline/online stores, feature serving, versioning,
 * and comprehensive monitoring. Supports Feast, Tecton, and cloud-native feature stores.
 * @inputs { projectName: string, platform?: string, features?: array, requirements?: object }
 * @outputs { success: boolean, featureStore: object, pipelines: array, infrastructure: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/data-engineering-analytics/feature-store', {
 *   projectName: 'E-commerce Feature Store',
 *   platform: 'feast',
 *   features: [
 *     { name: 'user_features', entity: 'user', updateFrequency: 'daily' },
 *     { name: 'product_features', entity: 'product', updateFrequency: 'hourly' },
 *     { name: 'realtime_events', entity: 'session', updateFrequency: 'streaming' }
 *   ],
 *   requirements: {
 *     onlineLatency: '10ms',
 *     offlineQueryTime: '5min',
 *     dataVolume: '100GB',
 *     featureCount: 500,
 *     monitoring: true,
 *     versioning: true
 *   }
 * });
 *
 * @references
 * - Feast Feature Store: https://docs.feast.dev/
 * - Tecton Feature Platform: https://docs.tecton.ai/
 * - AWS SageMaker Feature Store: https://docs.aws.amazon.com/sagemaker/latest/dg/feature-store.html
 * - GCP Vertex AI Feature Store: https://cloud.google.com/vertex-ai/docs/featurestore
 * - Feature Store Best Practices: https://www.featurestore.org/
 * - Feature Engineering at Scale: https://www.oreilly.com/library/view/feature-engineering-for/9781492053811/
 * - Training-Serving Skew Prevention: https://developers.google.com/machine-learning/guides/rules-of-ml/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    platform = 'feast', // 'feast', 'tecton', 'aws', 'gcp', 'azure'
    features = [],
    requirements = {
      onlineLatency: '10ms',
      offlineQueryTime: '5min',
      dataVolume: '100GB',
      featureCount: 500,
      monitoring: true,
      versioning: true,
      consistencyChecks: true,
      trainingServingConsistency: true
    },
    cloudProvider = 'aws', // 'aws', 'gcp', 'azure', 'on-premise'
    environment = 'production', // 'development', 'staging', 'production'
    outputDir = 'feature-store-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let featureStoreConfig = {};
  let pipelines = [];
  let infrastructure = {};

  ctx.log('info', `Starting Feature Store Setup for ${projectName}`);
  ctx.log('info', `Platform: ${platform}, Cloud: ${cloudProvider}, Environment: ${environment}`);

  // ============================================================================
  // PHASE 1: FEATURE STORE ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing feature store architecture');

  const architectureDesign = await ctx.task(featureStoreArchitectureTask, {
    projectName,
    platform,
    features,
    requirements,
    cloudProvider,
    environment,
    outputDir
  });

  if (!architectureDesign.success) {
    return {
      success: false,
      error: 'Failed to complete architecture design',
      details: architectureDesign,
      metadata: {
        processId: 'specializations/data-engineering-analytics/feature-store',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...architectureDesign.artifacts);
  featureStoreConfig.architecture = architectureDesign;

  // Quality Gate: Review architecture design
  await ctx.breakpoint({
    question: `Phase 1 Review: Feature store architecture designed for ${architectureDesign.featureCount} features. Platform: ${platform}. Online store: ${architectureDesign.onlineStore}, Offline store: ${architectureDesign.offlineStore}. Approve design?`,
    title: 'Architecture Design Approval',
    context: {
      runId: ctx.runId,
      architectureDesign,
      files: [{
        path: `${outputDir}/phase1-architecture-design.json`,
        format: 'json',
        content: JSON.stringify(architectureDesign, null, 2)
      }]
    }
  });

  // ============================================================================
  // PHASE 2: FEATURE REGISTRY SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up feature registry and schema');

  const featureRegistry = await ctx.task(featureRegistrySetupTask, {
    projectName,
    platform,
    features,
    architectureDesign,
    outputDir
  });

  if (!featureRegistry.success) {
    return {
      success: false,
      error: 'Failed to setup feature registry',
      details: featureRegistry,
      metadata: {
        processId: 'specializations/data-engineering-analytics/feature-store',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...featureRegistry.artifacts);
  featureStoreConfig.registry = featureRegistry;

  ctx.log('info', `Feature registry configured: ${featureRegistry.featureViewsCount} feature views, ${featureRegistry.entitiesCount} entities`);

  // ============================================================================
  // PHASE 3: ONLINE STORE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up online store for low-latency serving');

  const onlineStoreSetup = await ctx.task(onlineStoreSetupTask, {
    projectName,
    platform,
    architectureDesign,
    featureRegistry,
    requirements,
    cloudProvider,
    outputDir
  });

  if (!onlineStoreSetup.success) {
    return {
      success: false,
      error: 'Failed to setup online store',
      details: onlineStoreSetup,
      metadata: {
        processId: 'specializations/data-engineering-analytics/feature-store',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...onlineStoreSetup.artifacts);
  infrastructure.onlineStore = onlineStoreSetup;

  ctx.log('info', `Online store ready: ${onlineStoreSetup.technology}, Expected latency: ${onlineStoreSetup.expectedLatency}`);

  // ============================================================================
  // PHASE 4: OFFLINE STORE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up offline store for training and analytics');

  const offlineStoreSetup = await ctx.task(offlineStoreSetupTask, {
    projectName,
    platform,
    architectureDesign,
    featureRegistry,
    requirements,
    cloudProvider,
    outputDir
  });

  if (!offlineStoreSetup.success) {
    return {
      success: false,
      error: 'Failed to setup offline store',
      details: offlineStoreSetup,
      metadata: {
        processId: 'specializations/data-engineering-analytics/feature-store',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...offlineStoreSetup.artifacts);
  infrastructure.offlineStore = offlineStoreSetup;

  ctx.log('info', `Offline store ready: ${offlineStoreSetup.technology}, Storage: ${offlineStoreSetup.storageLocation}`);

  // Quality Gate: Review storage setup
  await ctx.breakpoint({
    question: `Phase 3-4 Review: Online store (${onlineStoreSetup.technology}) and offline store (${offlineStoreSetup.technology}) configured. Cost estimate: $${(onlineStoreSetup.estimatedMonthlyCost + offlineStoreSetup.estimatedMonthlyCost).toFixed(2)}/month. Approve?`,
    title: 'Storage Setup Review',
    context: {
      runId: ctx.runId,
      onlineStore: onlineStoreSetup,
      offlineStore: offlineStoreSetup,
      files: [
        {
          path: `${outputDir}/phase3-online-store-setup.json`,
          format: 'json',
          content: JSON.stringify(onlineStoreSetup, null, 2)
        },
        {
          path: `${outputDir}/phase4-offline-store-setup.json`,
          format: 'json',
          content: JSON.stringify(offlineStoreSetup, null, 2)
        }
      ]
    }
  });

  // ============================================================================
  // PHASE 5: FEATURE ENGINEERING PIPELINES
  // ============================================================================

  ctx.log('info', 'Phase 5: Building feature engineering pipelines');

  const [batchPipeline, streamingPipeline] = await ctx.parallel.all([
    ctx.task(batchFeaturePipelineTask, {
      projectName,
      platform,
      features: features.filter(f => f.updateFrequency !== 'streaming'),
      featureRegistry,
      architectureDesign,
      onlineStoreSetup,
      offlineStoreSetup,
      cloudProvider,
      outputDir
    }),
    ctx.task(streamingFeaturePipelineTask, {
      projectName,
      platform,
      features: features.filter(f => f.updateFrequency === 'streaming' || f.updateFrequency === 'realtime'),
      featureRegistry,
      architectureDesign,
      onlineStoreSetup,
      cloudProvider,
      outputDir
    })
  ]);

  if (!batchPipeline.success && !streamingPipeline.success) {
    return {
      success: false,
      error: 'Failed to setup feature engineering pipelines',
      details: { batchPipeline, streamingPipeline },
      metadata: {
        processId: 'specializations/data-engineering-analytics/feature-store',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...batchPipeline.artifacts, ...streamingPipeline.artifacts);
  pipelines.push(batchPipeline, streamingPipeline);

  ctx.log('info', `Pipelines configured: ${batchPipeline.pipelineCount} batch, ${streamingPipeline.pipelineCount} streaming`);

  // ============================================================================
  // PHASE 6: FEATURE SERVING LAYER
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up feature serving layer');

  const servingLayer = await ctx.task(servingLayerSetupTask, {
    projectName,
    platform,
    architectureDesign,
    featureRegistry,
    onlineStoreSetup,
    offlineStoreSetup,
    requirements,
    outputDir
  });

  if (!servingLayer.success) {
    return {
      success: false,
      error: 'Failed to setup serving layer',
      details: servingLayer,
      metadata: {
        processId: 'specializations/data-engineering-analytics/feature-store',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...servingLayer.artifacts);
  featureStoreConfig.serving = servingLayer;

  ctx.log('info', `Serving layer ready: ${servingLayer.endpointType}, API: ${servingLayer.apiEndpoint}`);

  // ============================================================================
  // PHASE 7: FEATURE VERSIONING AND LINEAGE
  // ============================================================================

  ctx.log('info', 'Phase 7: Configuring feature versioning and lineage tracking');

  const versioningSetup = await ctx.task(versioningSetupTask, {
    projectName,
    platform,
    featureRegistry,
    requirements,
    outputDir
  });

  if (!versioningSetup.success) {
    ctx.log('warn', 'Feature versioning setup failed, but continuing');
  } else {
    artifacts.push(...versioningSetup.artifacts);
    featureStoreConfig.versioning = versioningSetup;
    ctx.log('info', 'Feature versioning and lineage tracking configured');
  }

  // Quality Gate: Review pipelines and serving
  await ctx.breakpoint({
    question: `Phase 5-7 Review: ${batchPipeline.pipelineCount + streamingPipeline.pipelineCount} pipelines configured. Serving layer ready with ${servingLayer.apiCount} APIs. Versioning: ${versioningSetup.versioningStrategy}. Proceed?`,
    title: 'Pipelines and Serving Review',
    context: {
      runId: ctx.runId,
      pipelines: { batch: batchPipeline, streaming: streamingPipeline },
      serving: servingLayer,
      versioning: versioningSetup,
      files: [
        {
          path: `${outputDir}/phase5-pipelines-overview.json`,
          format: 'json',
          content: JSON.stringify({ batchPipeline, streamingPipeline }, null, 2)
        },
        {
          path: `${outputDir}/phase6-serving-layer.json`,
          format: 'json',
          content: JSON.stringify(servingLayer, null, 2)
        }
      ]
    }
  });

  // ============================================================================
  // PHASE 8: TRAINING-SERVING CONSISTENCY VALIDATION
  // ============================================================================

  if (requirements.trainingServingConsistency) {
    ctx.log('info', 'Phase 8: Validating training-serving consistency');

    const consistencyValidation = await ctx.task(consistencyValidationTask, {
      projectName,
      platform,
      featureRegistry,
      batchPipeline,
      streamingPipeline,
      servingLayer,
      outputDir
    });

    if (!consistencyValidation.success) {
      ctx.log('warn', 'Consistency validation failed, but continuing');
    } else {
      artifacts.push(...consistencyValidation.artifacts);
      featureStoreConfig.consistency = consistencyValidation;
      ctx.log('info', `Consistency validation: ${consistencyValidation.checksCount} checks, ${consistencyValidation.issuesFound} issues`);
    }
  }

  // ============================================================================
  // PHASE 9: FEATURE MONITORING AND OBSERVABILITY
  // ============================================================================

  if (requirements.monitoring) {
    ctx.log('info', 'Phase 9: Setting up feature monitoring and observability');

    const [featureMonitoring, qualityMonitoring, performanceMonitoring] = await ctx.parallel.all([
      ctx.task(featureMonitoringTask, {
        projectName,
        platform,
        featureRegistry,
        servingLayer,
        cloudProvider,
        outputDir
      }),
      ctx.task(qualityMonitoringTask, {
        projectName,
        platform,
        featureRegistry,
        pipelines,
        requirements,
        outputDir
      }),
      ctx.task(performanceMonitoringTask, {
        projectName,
        platform,
        onlineStoreSetup,
        offlineStoreSetup,
        servingLayer,
        requirements,
        outputDir
      })
    ]);

    if (!featureMonitoring.success || !qualityMonitoring.success || !performanceMonitoring.success) {
      ctx.log('warn', 'Some monitoring setup failed, but continuing');
    }

    artifacts.push(
      ...featureMonitoring.artifacts,
      ...qualityMonitoring.artifacts,
      ...performanceMonitoring.artifacts
    );

    featureStoreConfig.monitoring = {
      features: featureMonitoring,
      quality: qualityMonitoring,
      performance: performanceMonitoring
    };

    ctx.log('info', 'Monitoring stack configured with feature, quality, and performance tracking');
  }

  // ============================================================================
  // PHASE 10: ALERTING CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Configuring alerting rules');

  const alertingConfig = await ctx.task(alertingConfigTask, {
    projectName,
    platform,
    featureRegistry,
    monitoring: featureStoreConfig.monitoring,
    requirements,
    outputDir
  });

  if (!alertingConfig.success) {
    ctx.log('warn', 'Alerting configuration failed, but continuing');
  } else {
    artifacts.push(...alertingConfig.artifacts);
    featureStoreConfig.alerting = alertingConfig;
    ctx.log('info', `Alerting configured: ${alertingConfig.alertRulesCount} rules`);
  }

  // ============================================================================
  // PHASE 11: DATA QUALITY CHECKS
  // ============================================================================

  ctx.log('info', 'Phase 11: Setting up data quality checks');

  const qualityChecks = await ctx.task(qualityChecksTask, {
    projectName,
    platform,
    featureRegistry,
    pipelines,
    requirements,
    outputDir
  });

  if (!qualityChecks.success) {
    ctx.log('warn', 'Quality checks setup failed, but continuing');
  } else {
    artifacts.push(...qualityChecks.artifacts);
    featureStoreConfig.qualityChecks = qualityChecks;
    ctx.log('info', `Quality checks configured: ${qualityChecks.checksCount} checks`);
  }

  // ============================================================================
  // PHASE 12: BACKFILL AND HISTORICAL MATERIALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Configuring backfill and historical data materialization');

  const backfillSetup = await ctx.task(backfillSetupTask, {
    projectName,
    platform,
    featureRegistry,
    offlineStoreSetup,
    onlineStoreSetup,
    batchPipeline,
    outputDir
  });

  if (!backfillSetup.success) {
    ctx.log('warn', 'Backfill setup failed, but continuing');
  } else {
    artifacts.push(...backfillSetup.artifacts);
    featureStoreConfig.backfill = backfillSetup;
    ctx.log('info', 'Backfill and historical materialization configured');
  }

  // ============================================================================
  // PHASE 13: INFRASTRUCTURE PROVISIONING
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating infrastructure-as-code');

  const infrastructureProvisioning = await ctx.task(infrastructureProvisioningTask, {
    projectName,
    platform,
    architectureDesign,
    onlineStoreSetup,
    offlineStoreSetup,
    featureRegistry,
    pipelines,
    cloudProvider,
    environment,
    outputDir
  });

  if (!infrastructureProvisioning.success) {
    return {
      success: false,
      error: 'Failed to generate infrastructure code',
      details: infrastructureProvisioning,
      metadata: {
        processId: 'specializations/data-engineering-analytics/feature-store',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...infrastructureProvisioning.artifacts);
  infrastructure.provisioning = infrastructureProvisioning;

  ctx.log('info', `Infrastructure code generated: ${infrastructureProvisioning.manifestsCount} manifests`);

  // ============================================================================
  // PHASE 14: TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Testing feature store setup');

  const [integrationTests, performanceTests, consistencyTests] = await ctx.parallel.all([
    ctx.task(integrationTestsTask, {
      projectName,
      platform,
      featureRegistry,
      onlineStoreSetup,
      offlineStoreSetup,
      servingLayer,
      pipelines,
      outputDir
    }),
    ctx.task(performanceTestsTask, {
      projectName,
      platform,
      servingLayer,
      onlineStoreSetup,
      requirements,
      outputDir
    }),
    ctx.task(consistencyTestsTask, {
      projectName,
      platform,
      featureRegistry,
      onlineStoreSetup,
      offlineStoreSetup,
      servingLayer,
      outputDir
    })
  ]);

  if (!integrationTests.success || !performanceTests.success || !consistencyTests.success) {
    ctx.log('error', 'Some tests failed');

    await ctx.breakpoint({
      question: `Phase 14 Alert: Testing failed. Integration: ${integrationTests.testsPassed}/${integrationTests.totalTests}, Performance: ${performanceTests.testsPassed}/${performanceTests.totalTests}, Consistency: ${consistencyTests.testsPassed}/${consistencyTests.totalTests}. Review issues before proceeding?`,
      title: 'Testing Failed',
      context: {
        runId: ctx.runId,
        tests: { integrationTests, performanceTests, consistencyTests },
        files: [{
          path: `${outputDir}/phase14-test-report.json`,
          format: 'json',
          content: JSON.stringify({ integrationTests, performanceTests, consistencyTests }, null, 2)
        }]
      }
    });
  }

  artifacts.push(
    ...integrationTests.artifacts,
    ...performanceTests.artifacts,
    ...consistencyTests.artifacts
  );

  // ============================================================================
  // PHASE 15: DOCUMENTATION AND RUNBOOKS
  // ============================================================================

  ctx.log('info', 'Phase 15: Generating documentation and operational runbooks');

  const documentation = await ctx.task(documentationGenerationTask, {
    projectName,
    platform,
    architectureDesign,
    featureRegistry,
    featureStoreConfig,
    infrastructure,
    pipelines,
    cloudProvider,
    outputDir
  });

  if (!documentation.success) {
    ctx.log('warn', 'Documentation generation failed, but continuing');
  } else {
    artifacts.push(...documentation.artifacts);
  }

  // ============================================================================
  // FINAL QUALITY GATE AND HANDOFF
  // ============================================================================

  const overallScore = (
    (architectureDesign.designScore || 0) +
    (featureRegistry.score || 0) +
    (onlineStoreSetup.score || 0) +
    (offlineStoreSetup.score || 0) +
    (servingLayer.score || 0) +
    ((integrationTests.testsPassed / integrationTests.totalTests) * 100)
  ) / 6;

  const qualityThreshold = environment === 'production' ? 85 : 75;

  ctx.log('info', `Overall feature store quality score: ${overallScore.toFixed(1)}/100`);

  await ctx.breakpoint({
    question: `Final Review: Feature store ${projectName} is ready. Overall quality score: ${overallScore.toFixed(1)}/100 (threshold: ${qualityThreshold}). Features: ${featureRegistry.featureViewsCount}, Pipelines: ${pipelines.length}. Ready to handoff?`,
    title: 'Final Feature Store Review and Handoff',
    context: {
      runId: ctx.runId,
      overallScore,
      qualityThreshold,
      featureStoreConfig,
      infrastructure,
      files: [
        {
          path: `${outputDir}/feature-store-summary.json`,
          format: 'json',
          content: JSON.stringify({
            featureStoreConfig,
            infrastructure,
            pipelines: pipelines.length,
            artifacts: artifacts.length
          }, null, 2)
        },
        {
          path: `${outputDir}/operational-runbook.md`,
          format: 'markdown',
          content: documentation.runbook || 'Runbook generation pending'
        },
        {
          path: `${outputDir}/architecture-diagram.md`,
          format: 'markdown',
          content: documentation.architectureDiagram || 'Architecture diagram pending'
        }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  ctx.log('info', `Feature store setup completed in ${duration}ms`);
  ctx.log('info', `Platform: ${platform}, Features: ${featureRegistry.featureViewsCount}`);
  ctx.log('info', `Quality Score: ${overallScore.toFixed(1)}/100`);

  return {
    success: true,
    projectName,
    featureStore: featureStoreConfig,
    pipelines: [
      { type: 'batch', ...batchPipeline },
      { type: 'streaming', ...streamingPipeline }
    ],
    infrastructure,
    artifacts,
    overallScore,
    qualityThreshold,
    summary: {
      platform,
      cloudProvider,
      environment,
      featureViews: featureRegistry.featureViewsCount,
      entities: featureRegistry.entitiesCount,
      onlineStore: onlineStoreSetup.technology,
      offlineStore: offlineStoreSetup.technology,
      batchPipelines: batchPipeline.pipelineCount,
      streamingPipelines: streamingPipeline.pipelineCount,
      servingAPIs: servingLayer.apiCount,
      estimatedMonthlyCost: onlineStoreSetup.estimatedMonthlyCost + offlineStoreSetup.estimatedMonthlyCost,
      manifestsGenerated: infrastructureProvisioning.manifestsCount,
      artifactsCreated: artifacts.length,
      qualityScore: overallScore,
      monitoringEnabled: requirements.monitoring,
      versioningEnabled: requirements.versioning,
      testResults: {
        integration: `${integrationTests.testsPassed}/${integrationTests.totalTests}`,
        performance: `${performanceTests.testsPassed}/${performanceTests.totalTests}`,
        consistency: `${consistencyTests.testsPassed}/${consistencyTests.totalTests}`
      }
    },
    metadata: {
      processId: 'specializations/data-engineering-analytics/feature-store',
      processSlug: 'feature-store',
      category: 'data-engineering',
      specializationSlug: 'data-engineering-analytics',
      timestamp: startTime,
      duration,
      version: '1.0.0'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const featureStoreArchitectureTask = defineTask('feature-store-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Feature Store Architecture: ${args.projectName}`,
  agent: {
    name: 'data-architect',
    prompt: {
      role: 'Senior Data Engineer specialized in feature store architectures',
      task: 'Design production-ready feature store architecture',
      context: args,
      instructions: [
        'Analyze requirements for online serving latency, offline query performance, and data volume',
        `Design feature store architecture using ${args.platform} platform`,
        'Select online store technology (Redis, DynamoDB, Cassandra) for low-latency serving',
        'Select offline store technology (S3, BigQuery, Snowflake) for training and analytics',
        'Design feature registry for metadata and schema management',
        'Design feature materialization and transformation pipelines',
        'Design data ingestion patterns (batch, streaming, micro-batch)',
        'Design serving layer API (REST, gRPC, Python SDK)',
        'Plan feature versioning and lineage tracking',
        'Design monitoring and observability strategy',
        'Estimate infrastructure costs',
        'Create architecture diagram',
        'Document design decisions and trade-offs'
      ],
      outputFormat: 'JSON with success, designScore, featureCount, onlineStore, offlineStore, estimatedMonthlyCost, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'designScore', 'featureCount', 'onlineStore', 'offlineStore', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        designScore: { type: 'number', minimum: 0, maximum: 100 },
        featureCount: { type: 'number' },
        onlineStore: { type: 'string' },
        offlineStore: { type: 'string' },
        registryStore: { type: 'string' },
        materializationEngine: { type: 'string' },
        ingestionPatterns: { type: 'array', items: { type: 'string' } },
        servingPattern: { type: 'string' },
        estimatedMonthlyCost: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'architecture', 'design', args.platform]
}));

export const featureRegistrySetupTask = defineTask('feature-registry-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Feature Registry: ${args.projectName}`,
  agent: {
    name: 'feature-registry-engineer',
    prompt: {
      role: 'Data Engineer specialized in metadata management',
      task: `Setup and configure ${args.platform} feature registry`,
      context: args,
      instructions: [
        'Define feature entities (user, product, session, etc.)',
        'Define feature views (logical grouping of features)',
        'Define feature schemas (name, type, description, tags)',
        'Configure feature metadata (owner, SLA, update frequency)',
        'Configure feature statistics tracking',
        'Setup feature discovery and search',
        'Configure feature lineage tracking',
        'Setup feature validation rules',
        'Generate feature registry configuration files',
        'Create feature catalog documentation',
        'Test feature registration and retrieval'
      ],
      outputFormat: 'JSON with success, score, featureViewsCount, entitiesCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'featureViewsCount', 'entitiesCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        featureViewsCount: { type: 'number' },
        entitiesCount: { type: 'number' },
        dataSources: { type: 'array' },
        featureServices: { type: 'array' },
        registryLocation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'registry', args.platform]
}));

export const onlineStoreSetupTask = defineTask('online-store-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Online Store: ${args.projectName}`,
  agent: {
    name: 'online-store-engineer',
    prompt: {
      role: 'Data Engineer specialized in low-latency data stores',
      task: 'Setup and configure online store for low-latency feature serving',
      context: args,
      instructions: [
        'Select optimal online store technology (Redis, DynamoDB, Firestore, Cassandra)',
        'Configure online store for low-latency access (p99 < 10ms)',
        'Setup data partitioning and sharding strategy',
        'Configure replication for high availability',
        'Setup caching layers if needed',
        'Configure TTL and data retention policies',
        'Setup connection pooling and optimization',
        'Configure monitoring and metrics collection',
        'Generate infrastructure manifests',
        'Estimate costs based on data volume and request rate',
        'Document online store configuration'
      ],
      outputFormat: 'JSON with success, score, technology, expectedLatency, estimatedMonthlyCost, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'technology', 'expectedLatency', 'estimatedMonthlyCost', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        technology: { type: 'string' },
        configuration: { type: 'object' },
        expectedLatency: { type: 'string' },
        throughputCapacity: { type: 'string' },
        replication: { type: 'string' },
        ttl: { type: 'string' },
        estimatedMonthlyCost: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'online-store', args.cloudProvider]
}));

export const offlineStoreSetupTask = defineTask('offline-store-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Offline Store: ${args.projectName}`,
  agent: {
    name: 'offline-store-engineer',
    prompt: {
      role: 'Data Engineer specialized in analytical data stores',
      task: 'Setup and configure offline store for training and batch analytics',
      context: args,
      instructions: [
        'Select optimal offline store technology (S3 + Parquet, BigQuery, Snowflake, Redshift)',
        'Configure offline store for point-in-time correct retrieval',
        'Setup data partitioning strategy (date, entity)',
        'Configure compression and storage optimization',
        'Setup data retention and lifecycle policies',
        'Configure query optimization and indexing',
        'Setup access control and security',
        'Generate infrastructure manifests',
        'Estimate costs based on data volume',
        'Document offline store configuration'
      ],
      outputFormat: 'JSON with success, score, technology, storageLocation, estimatedMonthlyCost, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'technology', 'storageLocation', 'estimatedMonthlyCost', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        technology: { type: 'string' },
        configuration: { type: 'object' },
        storageLocation: { type: 'string' },
        partitioningStrategy: { type: 'string' },
        compression: { type: 'string' },
        retention: { type: 'string' },
        estimatedMonthlyCost: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'offline-store', args.cloudProvider]
}));

export const batchFeaturePipelineTask = defineTask('batch-feature-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Batch Feature Pipelines: ${args.projectName}`,
  agent: {
    name: 'pipeline-engineer',
    prompt: {
      role: 'Data Engineer specialized in batch data pipelines',
      task: 'Build batch feature engineering pipelines',
      context: args,
      instructions: [
        'Design batch feature computation jobs',
        'Implement feature transformations (aggregations, windows, joins)',
        'Setup scheduled materialization (daily, hourly)',
        'Configure data sources and connectors',
        'Implement data validation and quality checks',
        'Setup pipeline orchestration (Airflow, Prefect, Dagster)',
        'Configure offline store writes',
        'Configure online store materialization',
        'Setup monitoring and alerting',
        'Generate pipeline code and configuration',
        'Document pipeline architecture'
      ],
      outputFormat: 'JSON with success, pipelineCount, orchestrationTool, schedules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pipelineCount', 'orchestrationTool', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pipelineCount: { type: 'number' },
        orchestrationTool: { type: 'string' },
        computeEngine: { type: 'string' },
        schedules: { type: 'array' },
        transformations: { type: 'array' },
        validations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'batch-pipeline', args.platform]
}));

export const streamingFeaturePipelineTask = defineTask('streaming-feature-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Streaming Feature Pipelines: ${args.projectName}`,
  agent: {
    name: 'streaming-engineer',
    prompt: {
      role: 'Data Engineer specialized in streaming data pipelines',
      task: 'Build streaming feature engineering pipelines',
      context: args,
      instructions: [
        'Design streaming feature computation jobs',
        'Implement real-time feature transformations',
        'Setup streaming data sources (Kafka, Kinesis, Pub/Sub)',
        'Configure stream processing framework (Flink, Spark Streaming, Beam)',
        'Implement windowing and aggregations',
        'Setup online store writes for real-time features',
        'Configure exactly-once processing semantics',
        'Setup monitoring and alerting',
        'Generate pipeline code and configuration',
        'Document streaming architecture'
      ],
      outputFormat: 'JSON with success, pipelineCount, streamingFramework, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pipelineCount', 'streamingFramework', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pipelineCount: { type: 'number' },
        streamingFramework: { type: 'string' },
        messagingSystem: { type: 'string' },
        windowingStrategies: { type: 'array' },
        latency: { type: 'string' },
        throughput: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'streaming-pipeline', args.platform]
}));

export const servingLayerSetupTask = defineTask('serving-layer-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Serving Layer: ${args.projectName}`,
  agent: {
    name: 'serving-engineer',
    prompt: {
      role: 'Backend Engineer specialized in API design',
      task: 'Setup feature serving layer with APIs and SDKs',
      context: args,
      instructions: [
        'Design feature serving APIs (REST, gRPC)',
        'Implement online feature retrieval (get_online_features)',
        'Implement historical feature retrieval (get_historical_features)',
        'Implement feature service endpoints',
        'Configure caching and optimization',
        'Setup authentication and authorization',
        'Generate client SDKs (Python, Java, Go)',
        'Setup API documentation (OpenAPI/Swagger)',
        'Configure rate limiting and throttling',
        'Setup monitoring and logging',
        'Generate serving configuration'
      ],
      outputFormat: 'JSON with success, score, apiCount, endpointType, apiEndpoint, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'apiCount', 'endpointType', 'apiEndpoint', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        apiCount: { type: 'number' },
        endpointType: { type: 'string' },
        apiEndpoint: { type: 'string' },
        sdkLanguages: { type: 'array' },
        caching: { type: 'string' },
        authentication: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'serving', args.platform]
}));

export const versioningSetupTask = defineTask('versioning-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Feature Versioning: ${args.projectName}`,
  agent: {
    name: 'versioning-specialist',
    prompt: {
      role: 'Data Engineer specialized in data versioning',
      task: 'Setup feature versioning and lineage tracking',
      context: args,
      instructions: [
        'Configure feature versioning strategy (semantic, timestamp)',
        'Setup schema evolution and backward compatibility',
        'Configure feature lineage tracking (data sources, transformations)',
        'Setup version comparison and diff tools',
        'Configure feature rollback mechanisms',
        'Setup deprecation workflow',
        'Generate versioning configuration',
        'Document versioning policies'
      ],
      outputFormat: 'JSON with success, versioningStrategy, lineageTracking, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'versioningStrategy', 'lineageTracking', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        versioningStrategy: { type: 'string' },
        lineageTracking: { type: 'boolean' },
        schemaEvolution: { type: 'string' },
        backwardCompatibility: { type: 'boolean' },
        rollbackSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'versioning', 'lineage']
}));

export const consistencyValidationTask = defineTask('consistency-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Training-Serving Consistency: ${args.projectName}`,
  agent: {
    name: 'consistency-validator',
    prompt: {
      role: 'ML Engineer specialized in training-serving consistency',
      task: 'Validate consistency between training and serving pipelines',
      context: args,
      instructions: [
        'Identify potential sources of training-serving skew',
        'Validate feature transformations are identical',
        'Validate data types and schemas match',
        'Test point-in-time correctness',
        'Validate feature statistics consistency',
        'Setup automated consistency tests',
        'Generate consistency validation report',
        'Document best practices for skew prevention'
      ],
      outputFormat: 'JSON with success, checksCount, issuesFound, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'checksCount', 'issuesFound', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        checksCount: { type: 'number' },
        issuesFound: { type: 'number' },
        consistencyScore: { type: 'number' },
        skewRisks: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'consistency', 'validation']
}));

export const featureMonitoringTask = defineTask('feature-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Feature Monitoring: ${args.projectName}`,
  agent: {
    name: 'monitoring-engineer',
    prompt: {
      role: 'SRE specialized in observability',
      task: 'Setup comprehensive feature monitoring',
      context: args,
      instructions: [
        'Monitor feature value distributions and drift',
        'Monitor feature freshness and staleness',
        'Monitor feature availability and null rates',
        'Setup feature statistics tracking over time',
        'Configure drift detection algorithms',
        'Setup monitoring dashboards (Grafana, DataDog)',
        'Generate monitoring configuration',
        'Document monitoring procedures'
      ],
      outputFormat: 'JSON with success, metricsCount, dashboardUrl, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'metricsCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        metricsCount: { type: 'number' },
        dashboardUrl: { type: 'string' },
        driftDetection: { type: 'boolean' },
        freshnessChecks: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'monitoring', 'observability']
}));

export const qualityMonitoringTask = defineTask('quality-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Quality Monitoring: ${args.projectName}`,
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'Data Quality Engineer',
      task: 'Setup data quality monitoring for features',
      context: args,
      instructions: [
        'Monitor data completeness (missing values)',
        'Monitor data validity (schema conformance)',
        'Monitor data consistency (cross-feature checks)',
        'Monitor data timeliness (latency, delays)',
        'Setup quality score tracking',
        'Configure quality thresholds and alerts',
        'Generate quality monitoring configuration'
      ],
      outputFormat: 'JSON with success, qualityChecksCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'qualityChecksCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        qualityChecksCount: { type: 'number' },
        qualityDimensions: { type: 'array' },
        thresholds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'quality', 'monitoring']
}));

export const performanceMonitoringTask = defineTask('performance-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Performance Monitoring: ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer',
      task: 'Setup performance monitoring for feature store',
      context: args,
      instructions: [
        'Monitor online store latency (p50, p95, p99)',
        'Monitor offline store query performance',
        'Monitor serving API latency and throughput',
        'Monitor resource utilization (CPU, memory, storage)',
        'Monitor pipeline execution times',
        'Setup performance dashboards',
        'Configure performance alerts',
        'Generate performance monitoring configuration'
      ],
      outputFormat: 'JSON with success, performanceMetricsCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'performanceMetricsCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        performanceMetricsCount: { type: 'number' },
        latencyMonitoring: { type: 'boolean' },
        resourceMonitoring: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'performance', 'monitoring']
}));

export const alertingConfigTask = defineTask('alerting-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Alerting: ${args.projectName}`,
  agent: {
    name: 'alerting-engineer',
    prompt: {
      role: 'SRE specialized in alerting',
      task: 'Configure alerting rules for feature store',
      context: args,
      instructions: [
        'Configure alerts for feature drift',
        'Configure alerts for data quality issues',
        'Configure alerts for pipeline failures',
        'Configure alerts for performance degradation',
        'Configure alerts for staleness and freshness',
        'Setup notification channels (PagerDuty, Slack)',
        'Configure alert escalation',
        'Generate alerting configuration'
      ],
      outputFormat: 'JSON with success, alertRulesCount, notificationChannels, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'alertRulesCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        alertRulesCount: { type: 'number' },
        notificationChannels: { type: 'array' },
        escalationPolicies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'alerting']
}));

export const qualityChecksTask = defineTask('quality-checks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Quality Checks: ${args.projectName}`,
  agent: {
    name: 'quality-specialist',
    prompt: {
      role: 'Data Quality Specialist',
      task: 'Setup automated data quality checks',
      context: args,
      instructions: [
        'Define schema validation rules',
        'Define data range and constraint checks',
        'Define cross-feature consistency checks',
        'Define freshness and timeliness checks',
        'Configure validation in pipelines',
        'Setup quality check reports',
        'Generate quality check configuration'
      ],
      outputFormat: 'JSON with success, checksCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'checksCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        checksCount: { type: 'number' },
        checkTypes: { type: 'array' },
        validationRules: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'quality-checks']
}));

export const backfillSetupTask = defineTask('backfill-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Backfill: ${args.projectName}`,
  agent: {
    name: 'backfill-engineer',
    prompt: {
      role: 'Data Engineer specialized in historical data processing',
      task: 'Configure backfill and historical data materialization',
      context: args,
      instructions: [
        'Design backfill strategy for historical data',
        'Configure offline store backfill jobs',
        'Configure online store materialization from offline',
        'Setup incremental backfill procedures',
        'Configure point-in-time correctness',
        'Setup backfill monitoring',
        'Generate backfill scripts and documentation'
      ],
      outputFormat: 'JSON with success, backfillStrategy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'backfillStrategy', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        backfillStrategy: { type: 'string' },
        incrementalSupport: { type: 'boolean' },
        pointInTimeCorrect: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'backfill']
}));

export const infrastructureProvisioningTask = defineTask('infrastructure-provisioning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Infrastructure Code: ${args.projectName}`,
  agent: {
    name: 'infrastructure-engineer',
    prompt: {
      role: 'DevOps Engineer specialized in IaC',
      task: 'Generate infrastructure-as-code for feature store',
      context: args,
      instructions: [
        'Generate Terraform/CloudFormation for online store',
        'Generate Terraform/CloudFormation for offline store',
        'Generate Kubernetes manifests for serving layer',
        'Generate pipeline orchestration configuration',
        'Generate monitoring stack configuration',
        'Configure networking and security',
        'Generate deployment scripts',
        'Document infrastructure setup'
      ],
      outputFormat: 'JSON with success, manifestsCount, iacTool, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'manifestsCount', 'iacTool', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        manifestsCount: { type: 'number' },
        iacTool: { type: 'string' },
        deploymentScripts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'infrastructure', args.cloudProvider]
}));

export const integrationTestsTask = defineTask('integration-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run Integration Tests: ${args.projectName}`,
  agent: {
    name: 'qa-engineer',
    prompt: {
      role: 'QA Engineer',
      task: 'Run end-to-end integration tests',
      context: args,
      instructions: [
        'Test feature registration workflow',
        'Test feature materialization (offline)',
        'Test online store materialization',
        'Test feature serving APIs',
        'Test historical feature retrieval',
        'Test streaming ingestion',
        'Test monitoring and alerting',
        'Generate test report'
      ],
      outputFormat: 'JSON with success, totalTests, testsPassed, testsFailed, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalTests', 'testsPassed', 'testsFailed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalTests: { type: 'number' },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        failedTests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'testing', 'integration']
}));

export const performanceTestsTask = defineTask('performance-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run Performance Tests: ${args.projectName}`,
  agent: {
    name: 'performance-tester',
    prompt: {
      role: 'Performance Engineer',
      task: 'Run performance tests for feature serving',
      context: args,
      instructions: [
        'Test online feature serving latency',
        'Test serving throughput under load',
        'Test offline query performance',
        'Test concurrent request handling',
        'Test cache effectiveness',
        'Compare results against SLA requirements',
        'Generate performance test report'
      ],
      outputFormat: 'JSON with success, totalTests, testsPassed, testsFailed, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalTests', 'testsPassed', 'testsFailed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalTests: { type: 'number' },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        latencyP99: { type: 'string' },
        throughputQPS: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'testing', 'performance']
}));

export const consistencyTestsTask = defineTask('consistency-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run Consistency Tests: ${args.projectName}`,
  agent: {
    name: 'consistency-tester',
    prompt: {
      role: 'QA Engineer specialized in data consistency',
      task: 'Run consistency tests between online and offline stores',
      context: args,
      instructions: [
        'Test feature value consistency',
        'Test schema consistency',
        'Test timestamp consistency',
        'Test synchronization lag',
        'Test point-in-time correctness',
        'Generate consistency test report'
      ],
      outputFormat: 'JSON with success, totalTests, testsPassed, testsFailed, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalTests', 'testsPassed', 'testsFailed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalTests: { type: 'number' },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        consistencyScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'testing', 'consistency']
}));

export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Documentation: ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Writer specialized in data engineering',
      task: 'Generate comprehensive feature store documentation',
      context: args,
      instructions: [
        'Create architecture overview documentation',
        'Create feature catalog and registry docs',
        'Create pipeline documentation',
        'Create API reference documentation',
        'Create operational runbooks',
        'Create troubleshooting guides',
        'Create user guides and tutorials',
        'Create deployment guides'
      ],
      outputFormat: 'JSON with success, runbook, architectureDiagram, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'runbook', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        runbook: { type: 'string' },
        architectureDiagram: { type: 'string' },
        apiDocs: { type: 'string' },
        userGuide: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['feature-store', 'documentation']
}));
