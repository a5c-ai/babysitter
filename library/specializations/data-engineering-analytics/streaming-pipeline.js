/**
 * @process specializations/data-engineering-analytics/streaming-pipeline
 * @description Streaming Data Pipeline Setup - Complete workflow for designing and implementing
 * production-ready streaming data pipelines with Kafka/Kinesis setup, stream processing frameworks,
 * windowing, state management, and comprehensive monitoring.
 * @inputs { projectName: string, streamingPlatform?: string, processingFramework?: string, requirements?: object }
 * @outputs { success: boolean, pipelineConfig: object, manifests: array, monitoring: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/data-engineering-analytics/streaming-pipeline', {
 *   projectName: 'Real-time Analytics Pipeline',
 *   streamingPlatform: 'kafka',
 *   processingFramework: 'flink',
 *   requirements: {
 *     throughput: '100000 events/sec',
 *     latency: 'sub-second',
 *     dataRetention: '7 days',
 *     stateBackend: 'rocksdb',
 *     monitoring: true,
 *     schemas: true,
 *     exactlyOnce: true
 *   }
 * });
 *
 * @references
 * - Apache Kafka Documentation: https://kafka.apache.org/documentation/
 * - AWS Kinesis: https://docs.aws.amazon.com/kinesis/
 * - Apache Flink: https://flink.apache.org/
 * - Apache Spark Streaming: https://spark.apache.org/streaming/
 * - Kafka Streams: https://kafka.apache.org/documentation/streams/
 * - Stream Processing Patterns: https://www.confluent.io/blog/event-streaming-patterns/
 * - State Management in Flink: https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/fault-tolerance/state/
 * - Exactly-Once Semantics: https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    streamingPlatform = 'kafka', // 'kafka', 'kinesis', 'pulsar'
    processingFramework = 'flink', // 'flink', 'spark', 'kafka-streams'
    requirements = {
      throughput: '50000 events/sec',
      latency: 'sub-second',
      dataRetention: '7 days',
      stateBackend: 'rocksdb',
      monitoring: true,
      schemas: true,
      exactlyOnce: true,
      backpressure: true,
      windowing: true,
      multiAZ: true,
      autoScaling: true
    },
    cloudProvider = 'aws', // 'aws', 'gcp', 'azure', 'on-premise'
    environment = 'production', // 'development', 'staging', 'production'
    outputDir = 'streaming-pipeline-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let pipelineConfig = {};
  let manifests = [];
  let monitoring = {};

  ctx.log('info', `Starting Streaming Pipeline Setup for ${projectName}`);
  ctx.log('info', `Platform: ${streamingPlatform}, Framework: ${processingFramework}, Cloud: ${cloudProvider}`);

  // ============================================================================
  // PHASE 1: STREAMING PIPELINE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing streaming pipeline architecture');

  const pipelineDesign = await ctx.task(pipelineDesignTask, {
    projectName,
    streamingPlatform,
    processingFramework,
    requirements,
    cloudProvider,
    environment,
    outputDir
  });

  if (!pipelineDesign.success) {
    return {
      success: false,
      error: 'Failed to complete pipeline design',
      details: pipelineDesign,
      metadata: {
        processId: 'specializations/data-engineering-analytics/streaming-pipeline',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...pipelineDesign.artifacts);
  pipelineConfig.design = pipelineDesign;

  // Quality Gate: Review pipeline design
  await ctx.breakpoint({
    question: `Phase 1 Review: Pipeline will handle ${pipelineDesign.estimatedThroughput} events/sec with ${pipelineDesign.latency} latency. Estimated cost: $${pipelineDesign.estimatedMonthlyCost}/month. Approve design?`,
    title: 'Pipeline Design Approval',
    context: {
      runId: ctx.runId,
      pipelineDesign,
      files: [{
        path: `${outputDir}/phase1-pipeline-design.json`,
        format: 'json',
        content: JSON.stringify(pipelineDesign, null, 2)
      }]
    }
  });

  // ============================================================================
  // PHASE 2: MESSAGING INFRASTRUCTURE SETUP
  // ============================================================================

  ctx.log('info', `Phase 2: Setting up ${streamingPlatform} messaging infrastructure`);

  const messagingSetup = await ctx.task(messagingInfrastructureTask, {
    projectName,
    streamingPlatform,
    pipelineDesign,
    requirements,
    cloudProvider,
    outputDir
  });

  if (!messagingSetup.success) {
    return {
      success: false,
      error: 'Failed to setup messaging infrastructure',
      details: messagingSetup,
      metadata: {
        processId: 'specializations/data-engineering-analytics/streaming-pipeline',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...messagingSetup.artifacts);
  manifests.push(...messagingSetup.manifests);
  pipelineConfig.messaging = messagingSetup;

  ctx.log('info', `Messaging infrastructure ready: ${messagingSetup.clusterEndpoint}`);
  ctx.log('info', `Topics/Streams created: ${messagingSetup.topicsCount}`);

  // ============================================================================
  // PHASE 3: SCHEMA REGISTRY AND DATA GOVERNANCE
  // ============================================================================

  if (requirements.schemas) {
    ctx.log('info', 'Phase 3: Setting up schema registry and data governance');

    const schemaRegistry = await ctx.task(schemaRegistryTask, {
      projectName,
      streamingPlatform,
      messagingSetup,
      cloudProvider,
      outputDir
    });

    if (!schemaRegistry.success) {
      ctx.log('warn', 'Schema registry setup failed, but continuing');
    } else {
      artifacts.push(...schemaRegistry.artifacts);
      manifests.push(...schemaRegistry.manifests);
      pipelineConfig.schemaRegistry = schemaRegistry;
      ctx.log('info', `Schema registry configured: ${schemaRegistry.registryUrl}`);
    }
  }

  // ============================================================================
  // PHASE 4: STREAM PROCESSING FRAMEWORK SETUP
  // ============================================================================

  ctx.log('info', `Phase 4: Setting up ${processingFramework} stream processing framework`);

  const processingSetup = await ctx.task(streamProcessingSetupTask, {
    projectName,
    processingFramework,
    pipelineDesign,
    messagingSetup,
    requirements,
    cloudProvider,
    outputDir
  });

  if (!processingSetup.success) {
    return {
      success: false,
      error: 'Failed to setup stream processing framework',
      details: processingSetup,
      metadata: {
        processId: 'specializations/data-engineering-analytics/streaming-pipeline',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...processingSetup.artifacts);
  manifests.push(...processingSetup.manifests);
  pipelineConfig.processing = processingSetup;

  ctx.log('info', `Processing framework ready: ${processingSetup.clusterSize} workers`);

  // ============================================================================
  // PHASE 5: STATE MANAGEMENT CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Configuring state management and checkpointing');

  const stateManagement = await ctx.task(stateManagementTask, {
    projectName,
    processingFramework,
    processingSetup,
    requirements,
    cloudProvider,
    outputDir
  });

  if (!stateManagement.success) {
    return {
      success: false,
      error: 'Failed to configure state management',
      details: stateManagement,
      metadata: {
        processId: 'specializations/data-engineering-analytics/streaming-pipeline',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...stateManagement.artifacts);
  manifests.push(...stateManagement.manifests);
  pipelineConfig.stateManagement = stateManagement;

  ctx.log('info', `State backend: ${stateManagement.stateBackend}, Checkpoint interval: ${stateManagement.checkpointInterval}`);

  // Quality Gate: Review state management configuration
  await ctx.breakpoint({
    question: `Phase 5 Review: State management configured with ${stateManagement.stateBackend} backend. Exactly-once: ${stateManagement.exactlyOnceEnabled}. Proceed?`,
    title: 'State Management Review',
    context: {
      runId: ctx.runId,
      stateManagement,
      files: [{
        path: `${outputDir}/phase5-state-management.json`,
        format: 'json',
        content: JSON.stringify(stateManagement, null, 2)
      }]
    }
  });

  // ============================================================================
  // PHASE 6: WINDOWING AND TIME SEMANTICS
  // ============================================================================

  if (requirements.windowing) {
    ctx.log('info', 'Phase 6: Configuring windowing strategies and time semantics');

    const windowingConfig = await ctx.task(windowingConfigTask, {
      projectName,
      processingFramework,
      processingSetup,
      requirements,
      outputDir
    });

    if (!windowingConfig.success) {
      ctx.log('warn', 'Windowing configuration failed, but continuing');
    } else {
      artifacts.push(...windowingConfig.artifacts);
      manifests.push(...windowingConfig.manifests);
      pipelineConfig.windowing = windowingConfig;
      ctx.log('info', `Windowing configured: ${windowingConfig.windowTypes.join(', ')}`);
    }
  }

  // ============================================================================
  // PHASE 7: DATA CONNECTORS AND INTEGRATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up data connectors and integrations');

  const [sourceConnectors, sinkConnectors] = await ctx.parallel.all([
    ctx.task(sourceConnectorsTask, {
      projectName,
      streamingPlatform,
      processingFramework,
      messagingSetup,
      cloudProvider,
      outputDir
    }),
    ctx.task(sinkConnectorsTask, {
      projectName,
      streamingPlatform,
      processingFramework,
      messagingSetup,
      cloudProvider,
      outputDir
    })
  ]);

  if (!sourceConnectors.success || !sinkConnectors.success) {
    ctx.log('warn', 'Some connectors failed, but continuing');
  } else {
    artifacts.push(...sourceConnectors.artifacts, ...sinkConnectors.artifacts);
    manifests.push(...sourceConnectors.manifests, ...sinkConnectors.manifests);
    pipelineConfig.connectors = { sourceConnectors, sinkConnectors };
    ctx.log('info', `Connectors configured: ${sourceConnectors.connectorCount} sources, ${sinkConnectors.connectorCount} sinks`);
  }

  // ============================================================================
  // PHASE 8: BACKPRESSURE AND FLOW CONTROL
  // ============================================================================

  if (requirements.backpressure) {
    ctx.log('info', 'Phase 8: Configuring backpressure handling and flow control');

    const backpressureConfig = await ctx.task(backpressureConfigTask, {
      projectName,
      streamingPlatform,
      processingFramework,
      processingSetup,
      requirements,
      outputDir
    });

    if (!backpressureConfig.success) {
      ctx.log('warn', 'Backpressure configuration failed, but continuing');
    } else {
      artifacts.push(...backpressureConfig.artifacts);
      manifests.push(...backpressureConfig.manifests);
      pipelineConfig.backpressure = backpressureConfig;
      ctx.log('info', 'Backpressure handling configured');
    }
  }

  // ============================================================================
  // PHASE 9: MONITORING AND OBSERVABILITY
  // ============================================================================

  ctx.log('info', 'Phase 9: Setting up streaming pipeline monitoring');

  const [metricsMonitoring, lagMonitoring, performanceMonitoring] = await ctx.parallel.all([
    ctx.task(metricsMonitoringTask, {
      projectName,
      streamingPlatform,
      processingFramework,
      messagingSetup,
      processingSetup,
      cloudProvider,
      outputDir
    }),
    ctx.task(lagMonitoringTask, {
      projectName,
      streamingPlatform,
      messagingSetup,
      requirements,
      outputDir
    }),
    ctx.task(performanceMonitoringTask, {
      projectName,
      processingFramework,
      processingSetup,
      requirements,
      outputDir
    })
  ]);

  if (!metricsMonitoring.success || !lagMonitoring.success || !performanceMonitoring.success) {
    ctx.log('warn', 'Some monitoring setup failed, but continuing');
  }

  artifacts.push(
    ...metricsMonitoring.artifacts,
    ...lagMonitoring.artifacts,
    ...performanceMonitoring.artifacts
  );
  manifests.push(
    ...metricsMonitoring.manifests,
    ...lagMonitoring.manifests,
    ...performanceMonitoring.manifests
  );
  monitoring = { metricsMonitoring, lagMonitoring, performanceMonitoring };

  ctx.log('info', 'Monitoring stack configured with metrics, lag tracking, and performance monitoring');

  // ============================================================================
  // PHASE 10: ALERTING AND INCIDENT RESPONSE
  // ============================================================================

  ctx.log('info', 'Phase 10: Configuring alerting rules and incident response');

  const alertingConfig = await ctx.task(alertingConfigTask, {
    projectName,
    streamingPlatform,
    processingFramework,
    monitoring,
    requirements,
    outputDir
  });

  if (!alertingConfig.success) {
    ctx.log('warn', 'Alerting configuration failed, but continuing');
  } else {
    artifacts.push(...alertingConfig.artifacts);
    manifests.push(...alertingConfig.manifests);
    pipelineConfig.alerting = alertingConfig;
    ctx.log('info', `Alerting configured: ${alertingConfig.alertRulesCount} rules`);
  }

  // ============================================================================
  // PHASE 11: AUTO-SCALING CONFIGURATION
  // ============================================================================

  if (requirements.autoScaling) {
    ctx.log('info', 'Phase 11: Configuring auto-scaling policies');

    const autoScalingConfig = await ctx.task(autoScalingConfigTask, {
      projectName,
      streamingPlatform,
      processingFramework,
      messagingSetup,
      processingSetup,
      requirements,
      cloudProvider,
      outputDir
    });

    if (!autoScalingConfig.success) {
      ctx.log('warn', 'Auto-scaling configuration failed, but continuing');
    } else {
      artifacts.push(...autoScalingConfig.artifacts);
      manifests.push(...autoScalingConfig.manifests);
      pipelineConfig.autoScaling = autoScalingConfig;
      ctx.log('info', 'Auto-scaling configured for dynamic workload management');
    }
  }

  // ============================================================================
  // PHASE 12: DISASTER RECOVERY AND HIGH AVAILABILITY
  // ============================================================================

  ctx.log('info', 'Phase 12: Configuring disaster recovery and high availability');

  const drConfig = await ctx.task(disasterRecoveryTask, {
    projectName,
    streamingPlatform,
    processingFramework,
    messagingSetup,
    stateManagement,
    requirements,
    cloudProvider,
    outputDir
  });

  if (!drConfig.success) {
    ctx.log('warn', 'DR configuration failed, but continuing');
  } else {
    artifacts.push(...drConfig.artifacts);
    manifests.push(...drConfig.manifests);
    pipelineConfig.disasterRecovery = drConfig;
    ctx.log('info', `DR configured: Multi-AZ=${drConfig.multiAZ}, Backup interval=${drConfig.backupInterval}`);
  }

  // ============================================================================
  // PHASE 13: PIPELINE TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Testing and validating streaming pipeline');

  const pipelineValidation = await ctx.task(pipelineValidationTask, {
    projectName,
    streamingPlatform,
    processingFramework,
    pipelineConfig,
    requirements,
    outputDir
  });

  if (!pipelineValidation.success) {
    ctx.log('error', 'Pipeline validation failed');

    await ctx.breakpoint({
      question: `Phase 13 Alert: Pipeline validation failed with ${pipelineValidation.failedTests} failed tests. Review issues before proceeding?`,
      title: 'Pipeline Validation Failed',
      context: {
        runId: ctx.runId,
        validation: pipelineValidation,
        files: [{
          path: `${outputDir}/phase13-validation-report.json`,
          format: 'json',
          content: JSON.stringify(pipelineValidation, null, 2)
        }]
      }
    });
  }

  artifacts.push(...pipelineValidation.artifacts);

  // ============================================================================
  // PHASE 14: DOCUMENTATION AND RUNBOOKS
  // ============================================================================

  ctx.log('info', 'Phase 14: Generating documentation and operational runbooks');

  const documentation = await ctx.task(documentationGenerationTask, {
    projectName,
    streamingPlatform,
    processingFramework,
    pipelineConfig,
    monitoring,
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
    (pipelineDesign.designScore || 0) +
    (messagingSetup.score || 0) +
    (processingSetup.score || 0) +
    (stateManagement.score || 0) +
    (pipelineValidation.validationScore || 0)
  ) / 5;

  const qualityThreshold = environment === 'production' ? 85 : 75;

  ctx.log('info', `Overall pipeline quality score: ${overallScore.toFixed(1)}/100`);

  await ctx.breakpoint({
    question: `Final Review: Streaming pipeline ${projectName} is ready. Overall quality score: ${overallScore.toFixed(1)}/100 (threshold: ${qualityThreshold}). Ready to handoff?`,
    title: 'Final Pipeline Review and Handoff',
    context: {
      runId: ctx.runId,
      overallScore,
      qualityThreshold,
      pipelineConfig,
      monitoring,
      files: [
        {
          path: `${outputDir}/pipeline-summary.json`,
          format: 'json',
          content: JSON.stringify({
            pipelineConfig,
            monitoring,
            manifests: manifests.length,
            artifacts: artifacts.length
          }, null, 2)
        },
        {
          path: `${outputDir}/operational-runbook.md`,
          format: 'markdown',
          content: documentation.runbook || 'Runbook generation pending'
        }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  ctx.log('info', `Streaming pipeline setup completed in ${duration}ms`);
  ctx.log('info', `Platform: ${streamingPlatform}, Framework: ${processingFramework}`);
  ctx.log('info', `Throughput capacity: ${pipelineDesign.estimatedThroughput}`);
  ctx.log('info', `Quality Score: ${overallScore.toFixed(1)}/100`);

  return {
    success: true,
    projectName,
    pipelineConfig,
    manifests,
    monitoring,
    artifacts,
    overallScore,
    qualityThreshold,
    summary: {
      streamingPlatform,
      processingFramework,
      cloudProvider,
      environment,
      throughputCapacity: pipelineDesign.estimatedThroughput,
      latency: pipelineDesign.latency,
      topicsCount: messagingSetup.topicsCount || 0,
      connectorsCount: (sourceConnectors?.connectorCount || 0) + (sinkConnectors?.connectorCount || 0),
      stateBackend: stateManagement.stateBackend,
      exactlyOnceEnabled: stateManagement.exactlyOnceEnabled,
      estimatedMonthlyCost: pipelineDesign.estimatedMonthlyCost,
      manifestsGenerated: manifests.length,
      artifactsCreated: artifacts.length,
      qualityScore: overallScore,
      monitoringEnabled: requirements.monitoring,
      autoScalingEnabled: requirements.autoScaling,
      schemaRegistryEnabled: requirements.schemas
    },
    metadata: {
      processId: 'specializations/data-engineering-analytics/streaming-pipeline',
      processSlug: 'streaming-pipeline',
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

export const pipelineDesignTask = defineTask('pipeline-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Streaming Pipeline: ${args.projectName}`,
  agent: {
    name: 'streaming-architect',
    prompt: {
      role: 'Senior Data Engineer specialized in streaming architectures',
      task: 'Design a production-ready streaming data pipeline architecture',
      context: args,
      instructions: [
        'Analyze requirements for throughput, latency, and data retention',
        `Design pipeline using ${args.streamingPlatform} and ${args.processingFramework}`,
        'Calculate cluster sizing for messaging and processing layers',
        'Design topic/stream partitioning strategy',
        'Plan data flow and transformation stages',
        'Design state management and checkpointing strategy',
        'Plan windowing and aggregation patterns',
        'Design error handling and dead-letter queues',
        'Plan monitoring and alerting strategy',
        'Estimate infrastructure costs',
        'Create architecture diagram',
        'Document design decisions and trade-offs'
      ],
      outputFormat: 'JSON with success, designScore, estimatedThroughput, latency, estimatedMonthlyCost, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'designScore', 'estimatedThroughput', 'latency', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        designScore: { type: 'number', minimum: 0, maximum: 100 },
        estimatedThroughput: { type: 'string' },
        latency: { type: 'string' },
        partitionCount: { type: 'number' },
        replicationFactor: { type: 'number' },
        processingParallelism: { type: 'number' },
        dataRetention: { type: 'string' },
        estimatedMonthlyCost: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['streaming', 'pipeline-design', 'architecture', args.streamingPlatform]
}));

export const messagingInfrastructureTask = defineTask('messaging-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Messaging Infrastructure: ${args.projectName}`,
  agent: {
    name: 'messaging-engineer',
    prompt: {
      role: 'Data Engineer specialized in distributed messaging systems',
      task: `Setup and configure ${args.streamingPlatform} messaging infrastructure`,
      context: args,
      instructions: [
        `Deploy ${args.streamingPlatform} cluster (Kafka/Kinesis/Pulsar)`,
        'Configure brokers/shards with high availability',
        'Set up multi-AZ deployment for fault tolerance',
        'Create topics/streams with appropriate partitioning',
        'Configure replication factors and ISR',
        'Set up retention policies and compaction',
        'Configure security (TLS, SASL, ACLs)',
        'Optimize broker/shard configurations for throughput',
        'Set up monitoring and JMX metrics (Kafka)',
        'Test producer and consumer connectivity',
        'Generate infrastructure manifests (Terraform/CloudFormation)',
        'Document cluster configuration'
      ],
      outputFormat: 'JSON with success, score, clusterEndpoint, topicsCount, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'clusterEndpoint', 'topicsCount', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        clusterEndpoint: { type: 'string' },
        clusterArn: { type: 'string' },
        topicsCount: { type: 'number' },
        brokerCount: { type: 'number' },
        replicationFactor: { type: 'number' },
        securityEnabled: { type: 'boolean' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['streaming', 'messaging', args.streamingPlatform, args.cloudProvider]
}));

export const schemaRegistryTask = defineTask('schema-registry', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Schema Registry: ${args.projectName}`,
  agent: {
    name: 'schema-engineer',
    prompt: {
      role: 'Data Engineer specialized in data governance',
      task: 'Setup schema registry for data governance and compatibility',
      context: args,
      instructions: [
        'Deploy Schema Registry (Confluent/AWS Glue/Pulsar)',
        'Configure schema compatibility modes (backward/forward/full)',
        'Register initial schemas (Avro/Protobuf/JSON Schema)',
        'Set up schema versioning and evolution policies',
        'Configure schema validation for producers/consumers',
        'Set up schema registry security and access control',
        'Create schema documentation',
        'Test schema registration and compatibility checks',
        'Generate schema registry manifests',
        'Document schema management procedures'
      ],
      outputFormat: 'JSON with success, registryUrl, schemasCount, compatibilityMode, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'registryUrl', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        registryUrl: { type: 'string' },
        schemasCount: { type: 'number' },
        compatibilityMode: { type: 'string' },
        schemaFormat: { type: 'string' },
        validationEnabled: { type: 'boolean' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['streaming', 'schema-registry', 'data-governance']
}));

export const streamProcessingSetupTask = defineTask('stream-processing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Stream Processing Framework: ${args.projectName}`,
  agent: {
    name: 'processing-engineer',
    prompt: {
      role: 'Data Engineer specialized in stream processing',
      task: `Deploy and configure ${args.processingFramework} stream processing framework`,
      context: args,
      instructions: [
        `Deploy ${args.processingFramework} cluster (Flink/Spark/Kafka Streams)`,
        'Configure job manager and task managers (Flink)',
        'Set up parallelism and task slots',
        'Configure resource allocation (CPU, memory)',
        'Set up high availability with ZooKeeper/K8s HA',
        'Configure job submission and deployment modes',
        'Set up libraries and dependencies',
        'Configure network buffers and backpressure',
        'Set up savepoint and checkpoint directories',
        'Test job deployment and execution',
        'Generate processing framework manifests',
        'Document framework configuration'
      ],
      outputFormat: 'JSON with success, score, clusterSize, parallelism, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'clusterSize', 'parallelism', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        clusterSize: { type: 'number' },
        parallelism: { type: 'number' },
        taskSlots: { type: 'number' },
        jobManagerEndpoint: { type: 'string' },
        highAvailabilityEnabled: { type: 'boolean' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['streaming', 'processing', args.processingFramework]
}));

export const stateManagementTask = defineTask('state-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure State Management: ${args.projectName}`,
  agent: {
    name: 'state-management-specialist',
    prompt: {
      role: 'Stream Processing Engineer specialized in state management',
      task: 'Configure state backends, checkpointing, and exactly-once semantics',
      context: args,
      instructions: [
        `Configure state backend (RocksDB/Memory/FileSystem)`,
        'Set up checkpointing interval and strategy',
        'Configure checkpoint storage (S3/GCS/HDFS)',
        'Enable exactly-once or at-least-once semantics',
        'Configure state TTL for cleanup',
        'Set up incremental checkpoints for RocksDB',
        'Configure checkpoint retention and cleanup',
        'Set up savepoints for manual recovery',
        'Configure state migration and compatibility',
        'Test checkpoint and recovery mechanisms',
        'Generate state management configurations',
        'Document state management best practices'
      ],
      outputFormat: 'JSON with success, score, stateBackend, checkpointInterval, exactlyOnceEnabled, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'stateBackend', 'checkpointInterval', 'exactlyOnceEnabled', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        stateBackend: { type: 'string' },
        checkpointInterval: { type: 'string' },
        checkpointStorage: { type: 'string' },
        exactlyOnceEnabled: { type: 'boolean' },
        incrementalCheckpoints: { type: 'boolean' },
        stateTTLEnabled: { type: 'boolean' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['streaming', 'state-management', 'checkpointing']
}));

export const windowingConfigTask = defineTask('windowing-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Windowing: ${args.projectName}`,
  agent: {
    name: 'windowing-specialist',
    prompt: {
      role: 'Stream Processing Engineer specialized in windowing',
      task: 'Configure windowing strategies and time semantics',
      context: args,
      instructions: [
        'Define window types (tumbling, sliding, session, global)',
        'Configure event time vs processing time semantics',
        'Set up watermark generation strategies',
        'Configure allowed lateness for late data',
        'Define window triggers (event time, processing time, count)',
        'Set up window aggregation functions',
        'Configure side outputs for late data',
        'Test windowing with sample data',
        'Generate windowing code examples',
        'Document windowing patterns and best practices'
      ],
      outputFormat: 'JSON with success, windowTypes, timeSemantics, watermarkStrategy, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'windowTypes', 'timeSemantics', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        windowTypes: { type: 'array', items: { type: 'string' } },
        timeSemantics: { type: 'string' },
        watermarkStrategy: { type: 'string' },
        allowedLateness: { type: 'string' },
        lateDataHandling: { type: 'string' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['streaming', 'windowing', 'time-semantics']
}));

export const sourceConnectorsTask = defineTask('source-connectors', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Source Connectors: ${args.projectName}`,
  agent: {
    name: 'connector-engineer',
    prompt: {
      role: 'Data Engineer specialized in data integration',
      task: 'Setup source connectors for data ingestion',
      context: args,
      instructions: [
        'Identify source systems (databases, APIs, files, IoT)',
        'Deploy Kafka Connect or equivalent connectors',
        'Configure source connectors (JDBC, Debezium CDC, S3, etc.)',
        'Set up connector tasks and parallelism',
        'Configure data transformation (SMTs/UDFs)',
        'Set up schema conversion and mapping',
        'Configure error handling and retries',
        'Test data ingestion from sources',
        'Generate connector configurations',
        'Document connector setup and troubleshooting'
      ],
      outputFormat: 'JSON with success, connectorCount, connectorTypes, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'connectorCount', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        connectorCount: { type: 'number' },
        connectorTypes: { type: 'array', items: { type: 'string' } },
        cdcEnabled: { type: 'boolean' },
        transformationsEnabled: { type: 'boolean' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['streaming', 'connectors', 'source', 'ingestion']
}));

export const sinkConnectorsTask = defineTask('sink-connectors', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Sink Connectors: ${args.projectName}`,
  agent: {
    name: 'sink-engineer',
    prompt: {
      role: 'Data Engineer specialized in data egress',
      task: 'Setup sink connectors for data delivery',
      context: args,
      instructions: [
        'Identify sink systems (databases, data lakes, warehouses, APIs)',
        'Deploy sink connectors (JDBC, S3, Elasticsearch, etc.)',
        'Configure sink tasks and parallelism',
        'Set up batching and flushing policies',
        'Configure data transformation and formatting',
        'Set up partitioning and bucketing for data lakes',
        'Configure error handling and dead-letter queues',
        'Test data delivery to sinks',
        'Generate sink connector configurations',
        'Document sink setup and best practices'
      ],
      outputFormat: 'JSON with success, connectorCount, connectorTypes, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'connectorCount', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        connectorCount: { type: 'number' },
        connectorTypes: { type: 'array', items: { type: 'string' } },
        batchingEnabled: { type: 'boolean' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['streaming', 'connectors', 'sink', 'delivery']
}));

export const backpressureConfigTask = defineTask('backpressure-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Backpressure: ${args.projectName}`,
  agent: {
    name: 'backpressure-specialist',
    prompt: {
      role: 'Stream Processing Engineer specialized in flow control',
      task: 'Configure backpressure handling and flow control mechanisms',
      context: args,
      instructions: [
        'Configure network buffer sizes for backpressure',
        'Set up credit-based flow control (Flink)',
        'Configure consumer backpressure (Kafka)',
        'Set up rate limiting and throttling',
        'Configure overflow strategies (buffer/drop/fail)',
        'Set up backpressure monitoring and alerts',
        'Configure operator chaining for optimization',
        'Test backpressure behavior under load',
        'Generate backpressure configurations',
        'Document backpressure handling strategies'
      ],
      outputFormat: 'JSON with success, bufferSizes, flowControlEnabled, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'flowControlEnabled', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        flowControlEnabled: { type: 'boolean' },
        bufferSizes: { type: 'object' },
        rateLimitingEnabled: { type: 'boolean' },
        overflowStrategy: { type: 'string' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['streaming', 'backpressure', 'flow-control']
}));

export const metricsMonitoringTask = defineTask('metrics-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Metrics Monitoring: ${args.projectName}`,
  agent: {
    name: 'monitoring-engineer',
    prompt: {
      role: 'SRE specialized in streaming pipeline monitoring',
      task: 'Setup comprehensive metrics monitoring for streaming pipeline',
      context: args,
      instructions: [
        'Deploy Prometheus or CloudWatch for metrics collection',
        'Configure JMX exporters for Kafka/Flink metrics',
        'Set up Grafana dashboards for visualization',
        'Monitor throughput metrics (records/sec, bytes/sec)',
        'Monitor latency metrics (end-to-end, processing)',
        'Monitor resource utilization (CPU, memory, disk)',
        'Monitor partition/shard metrics',
        'Set up custom business metrics',
        'Configure metrics retention and aggregation',
        'Generate monitoring manifests and dashboards'
      ],
      outputFormat: 'JSON with success, metricsEndpoint, dashboardUrls, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        metricsEndpoint: { type: 'string' },
        dashboardUrls: { type: 'array', items: { type: 'string' } },
        metricsCollected: { type: 'array', items: { type: 'string' } },
        retentionPeriod: { type: 'string' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['streaming', 'monitoring', 'metrics']
}));

export const lagMonitoringTask = defineTask('lag-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Lag Monitoring: ${args.projectName}`,
  agent: {
    name: 'lag-monitoring-specialist',
    prompt: {
      role: 'Data Engineer specialized in streaming health monitoring',
      task: 'Setup consumer lag monitoring and alerting',
      context: args,
      instructions: [
        'Deploy Burrow or Kafka Lag Exporter',
        'Configure lag monitoring for all consumer groups',
        'Set up lag alerting thresholds',
        'Monitor partition lag and offset commit patterns',
        'Set up lag trend analysis',
        'Configure lag-based auto-scaling triggers',
        'Create lag visualization dashboards',
        'Test lag monitoring with delayed consumers',
        'Generate lag monitoring configurations',
        'Document lag monitoring and remediation'
      ],
      outputFormat: 'JSON with success, lagMonitoringTool, alertThresholds, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        lagMonitoringTool: { type: 'string' },
        alertThresholds: { type: 'object' },
        consumerGroupsMonitored: { type: 'number' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['streaming', 'monitoring', 'lag']
}));

export const performanceMonitoringTask = defineTask('performance-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Performance Monitoring: ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Engineer specialized in stream processing',
      task: 'Setup performance monitoring for stream processing jobs',
      context: args,
      instructions: [
        'Monitor job/task execution metrics',
        'Track checkpoint duration and size',
        'Monitor backpressure indicators',
        'Track state backend performance',
        'Monitor GC pauses and memory pressure',
        'Set up performance profiling and flame graphs',
        'Monitor network and I/O metrics',
        'Track operator-level metrics',
        'Create performance dashboards',
        'Document performance tuning guidelines'
      ],
      outputFormat: 'JSON with success, performanceMetrics, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'performanceMetrics', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        performanceMetrics: { type: 'array', items: { type: 'string' } },
        profilingEnabled: { type: 'boolean' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['streaming', 'monitoring', 'performance']
}));

export const alertingConfigTask = defineTask('alerting-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Alerting: ${args.projectName}`,
  agent: {
    name: 'alerting-engineer',
    prompt: {
      role: 'SRE specialized in alerting and incident response',
      task: 'Configure alerting rules and incident response for streaming pipeline',
      context: args,
      instructions: [
        'Set up AlertManager or CloudWatch Alarms',
        'Configure alerts for high lag (>threshold)',
        'Alert on pipeline failures and restarts',
        'Alert on high backpressure or low throughput',
        'Configure alerts for checkpoint failures',
        'Set up alerts for resource exhaustion',
        'Configure alert routing and escalation',
        'Set up PagerDuty/Slack integrations',
        'Create runbooks for common alerts',
        'Test alert firing and notification delivery'
      ],
      outputFormat: 'JSON with success, alertRulesCount, notificationChannels, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'alertRulesCount', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        alertRulesCount: { type: 'number' },
        notificationChannels: { type: 'array', items: { type: 'string' } },
        escalationPolicies: { type: 'array' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['streaming', 'alerting', 'incident-response']
}));

export const autoScalingConfigTask = defineTask('auto-scaling-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Auto-Scaling: ${args.projectName}`,
  agent: {
    name: 'autoscaling-engineer',
    prompt: {
      role: 'Platform Engineer specialized in auto-scaling',
      task: 'Configure auto-scaling for dynamic workload management',
      context: args,
      instructions: [
        'Set up cluster auto-scaling (Kafka/processing framework)',
        'Configure consumer group scaling based on lag',
        'Set up partition scaling for Kafka topics',
        'Configure processing job parallelism auto-scaling',
        'Set up scaling policies and thresholds',
        'Configure scale-up and scale-down cooldown periods',
        'Test auto-scaling behavior under varying load',
        'Set up cost-aware scaling policies',
        'Generate auto-scaling configurations',
        'Document auto-scaling behavior and limits'
      ],
      outputFormat: 'JSON with success, scalingPolicies, minInstances, maxInstances, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'scalingPolicies', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        scalingPolicies: { type: 'array' },
        minInstances: { type: 'number' },
        maxInstances: { type: 'number' },
        scalingMetrics: { type: 'array', items: { type: 'string' } },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['streaming', 'auto-scaling', args.cloudProvider]
}));

export const disasterRecoveryTask = defineTask('disaster-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Disaster Recovery: ${args.projectName}`,
  agent: {
    name: 'dr-specialist',
    prompt: {
      role: 'SRE specialized in disaster recovery',
      task: 'Configure disaster recovery and high availability for streaming pipeline',
      context: args,
      instructions: [
        'Set up multi-AZ deployment for fault tolerance',
        'Configure cross-region replication (MirrorMaker/Kinesis)',
        'Set up automated backup of state and checkpoints',
        'Configure topic/stream replication',
        'Set up failover procedures and testing',
        'Configure RTO and RPO targets',
        'Create disaster recovery runbooks',
        'Test recovery procedures',
        'Generate DR configurations',
        'Document DR strategy and procedures'
      ],
      outputFormat: 'JSON with success, multiAZ, crossRegionEnabled, backupInterval, rto, rpo, manifests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'multiAZ', 'manifests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        multiAZ: { type: 'boolean' },
        crossRegionEnabled: { type: 'boolean' },
        backupInterval: { type: 'string' },
        rto: { type: 'string' },
        rpo: { type: 'string' },
        replicationFactor: { type: 'number' },
        manifests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['streaming', 'disaster-recovery', 'high-availability']
}));

export const pipelineValidationTask = defineTask('pipeline-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Pipeline: ${args.projectName}`,
  agent: {
    name: 'pipeline-validator',
    prompt: {
      role: 'QA Engineer specialized in streaming pipeline validation',
      task: 'Validate streaming pipeline setup and run integration tests',
      context: args,
      instructions: [
        'Test end-to-end data flow from source to sink',
        'Validate exactly-once or at-least-once semantics',
        'Test checkpoint and recovery mechanisms',
        'Validate windowing and aggregation correctness',
        'Test late data handling',
        'Validate backpressure handling under load',
        'Test failure scenarios (broker/worker failures)',
        'Validate monitoring and alerting',
        'Test auto-scaling behavior',
        'Generate validation report with test results'
      ],
      outputFormat: 'JSON with success, validationScore, testsPassed, testsFailed, findings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'validationScore', 'testsPassed', 'testsFailed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        testsSkipped: { type: 'number' },
        findings: { type: 'array' },
        endToEndLatency: { type: 'string' },
        throughputAchieved: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['streaming', 'validation', 'testing']
}));

export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Documentation: ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Writer specialized in streaming pipeline documentation',
      task: 'Generate comprehensive pipeline documentation and operational runbooks',
      context: args,
      instructions: [
        'Create pipeline architecture documentation',
        'Document data flow and transformations',
        'Generate operational runbooks (monitoring, scaling, troubleshooting)',
        'Create incident response procedures',
        'Document checkpoint and recovery procedures',
        'Create performance tuning guide',
        'Document monitoring and alerting setup',
        'Create onboarding guide for developers',
        'Generate troubleshooting guides',
        'Create capacity planning recommendations'
      ],
      outputFormat: 'JSON with success, runbook (markdown), architecture (markdown), operationalGuides, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'runbook', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        runbook: { type: 'string' },
        architecture: { type: 'string' },
        operationalGuides: { type: 'array' },
        troubleshootingGuides: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['streaming', 'documentation', 'runbooks']
}));
