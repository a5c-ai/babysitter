/**
 * @process specializations/data-science-ml/feature-store
 * @description Feature Store Implementation and Management - Design, implement, and operationalize a feature store
 * for ML feature management with quality gates, validation, serving consistency, and iterative refinement.
 * @inputs { projectName: string, featureStoreType?: string, dataCharacteristics?: object, servingRequirements?: object }
 * @outputs { success: boolean, featureStore: object, features: array, pipelineDesign: object, operationalReadiness: object }
 *
 * @example
 * const result = await orchestrate('specializations/data-science-ml/feature-store', {
 *   projectName: 'Recommendation System',
 *   featureStoreType: 'online-offline',
 *   dataCharacteristics: { featureCount: 150, updateFrequency: 'realtime', dataVolume: '10TB' },
 *   servingRequirements: { latencyMs: 50, throughputQPS: 10000, consistency: 'eventual' }
 * });
 *
 * @references
 * - Feast Feature Store: https://docs.feast.dev/
 * - Feature Store for ML by Google: https://cloud.google.com/architecture/ml-feature-stores-best-practices
 * - Tecton Feature Platform: https://www.tecton.ai/
 * - AWS SageMaker Feature Store: https://aws.amazon.com/sagemaker/feature-store/
 * - Hopsworks Feature Store: https://www.hopsworks.ai/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    featureStoreType = 'online-offline',
    dataCharacteristics = {},
    servingRequirements = {},
    targetQuality = 85,
    maxIterations = 3,
    outputDir = 'feature-store-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // ============================================================================
  // PHASE 1: FEATURE STORE ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Feature Store Architecture Design');

  const architectureDesign = await ctx.task(featureStoreArchitectureTask, {
    projectName,
    featureStoreType,
    dataCharacteristics,
    servingRequirements,
    outputDir
  });

  artifacts.push(...architectureDesign.artifacts);

  // Quality Gate: Architecture must include core components
  const requiredComponents = ['feature-registry', 'storage-layer', 'serving-layer', 'ingestion-pipeline'];
  const missingComponents = requiredComponents.filter(
    component => !architectureDesign.components.some(c => c.name === component)
  );

  if (missingComponents.length > 0) {
    return {
      success: false,
      error: `Missing required feature store components: ${missingComponents.join(', ')}`,
      phase: 'architecture-design',
      architecture: null
    };
  }

  // Breakpoint: Review feature store architecture
  await ctx.breakpoint({
    question: `Review feature store architecture for ${projectName}. Type: ${featureStoreType}. Does the architecture meet scalability, latency, and consistency requirements?`,
    title: 'Feature Store Architecture Review',
    context: {
      runId: ctx.runId,
      projectName,
      architecture: architectureDesign,
      files: [
        { path: `${outputDir}/architecture-design.md`, format: 'markdown' },
        { path: `${outputDir}/architecture-diagram.md`, format: 'markdown' },
        { path: `${outputDir}/architecture-spec.json`, format: 'code', language: 'json' }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: FEATURE REGISTRY AND SCHEMA DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Feature Registry and Schema Design');

  const featureRegistryDesign = await ctx.task(featureRegistryDesignTask, {
    projectName,
    architectureDesign,
    dataCharacteristics,
    outputDir
  });

  artifacts.push(...featureRegistryDesign.artifacts);

  // Breakpoint: Review feature registry schema
  await ctx.breakpoint({
    question: `Review feature registry schema for ${projectName}. Total features: ${featureRegistryDesign.totalFeatures}. Feature groups: ${featureRegistryDesign.featureGroups.length}. Approve?`,
    title: 'Feature Registry Schema Review',
    context: {
      runId: ctx.runId,
      projectName,
      registry: featureRegistryDesign,
      files: [
        { path: `${outputDir}/feature-registry-schema.json`, format: 'code', language: 'json' },
        { path: `${outputDir}/feature-catalog.md`, format: 'markdown' }
      ]
    }
  });

  // ============================================================================
  // PHASE 3: STORAGE LAYER IMPLEMENTATION WITH ITERATIVE REFINEMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Storage Layer Implementation with Quality Convergence');

  let iteration = 0;
  let currentQuality = 0;
  let converged = false;
  const iterationResults = [];

  while (iteration < maxIterations && !converged) {
    iteration++;
    ctx.log('info', `Starting storage layer iteration ${iteration}`);

    // Step 1: Implement storage layer
    const storageImplementation = await ctx.task(storageLayerImplementationTask, {
      projectName,
      architectureDesign,
      featureRegistryDesign,
      featureStoreType,
      iteration,
      previousFeedback: iteration > 1 ? iterationResults[iteration - 2].feedback : null,
      outputDir
    });

    artifacts.push(...storageImplementation.artifacts);

    // Step 2: Parallel validation checks
    ctx.log('info', `Running storage validation checks for iteration ${iteration}`);

    const [
      performanceValidation,
      consistencyValidation,
      scalabilityValidation,
      reliabilityValidation
    ] = await ctx.parallel.all([
      () => ctx.task(storagePerformanceValidationTask, {
        projectName,
        storageImplementation,
        servingRequirements,
        outputDir
      }),
      () => ctx.task(storageConsistencyValidationTask, {
        projectName,
        storageImplementation,
        featureStoreType,
        outputDir
      }),
      () => ctx.task(storageScalabilityValidationTask, {
        projectName,
        storageImplementation,
        dataCharacteristics,
        outputDir
      }),
      () => ctx.task(storageReliabilityValidationTask, {
        projectName,
        storageImplementation,
        outputDir
      })
    ]);

    artifacts.push(
      ...performanceValidation.artifacts,
      ...consistencyValidation.artifacts,
      ...scalabilityValidation.artifacts,
      ...reliabilityValidation.artifacts
    );

    // Step 3: Quality scoring
    ctx.log('info', 'Scoring storage layer quality');
    const qualityScore = await ctx.task(storageQualityScoringTask, {
      projectName,
      architectureDesign,
      storageImplementation,
      validationChecks: {
        performance: performanceValidation,
        consistency: consistencyValidation,
        scalability: scalabilityValidation,
        reliability: reliabilityValidation
      },
      iteration,
      targetQuality,
      outputDir
    });

    artifacts.push(...qualityScore.artifacts);
    currentQuality = qualityScore.overallScore;

    // Store iteration results
    iterationResults.push({
      iteration,
      quality: currentQuality,
      storageImplementation,
      validationChecks: {
        performance: performanceValidation,
        consistency: consistencyValidation,
        scalability: scalabilityValidation,
        reliability: reliabilityValidation
      },
      qualityScore,
      feedback: qualityScore.recommendations
    });

    // Check convergence
    if (currentQuality >= targetQuality) {
      converged = true;
      ctx.log('info', `Quality target achieved: ${currentQuality}/${targetQuality}`);
    } else {
      ctx.log('warn', `Quality below target: ${currentQuality}/${targetQuality}`);

      // Breakpoint: Review iteration results before continuing
      if (iteration < maxIterations) {
        await ctx.breakpoint({
          question: `Storage layer iteration ${iteration} complete. Quality: ${currentQuality}/${targetQuality}. Continue to iteration ${iteration + 1} for refinement?`,
          title: `Storage Layer Iteration ${iteration} Review`,
          context: {
            runId: ctx.runId,
            files: [
              { path: `${outputDir}/storage-iteration-${iteration}-report.md`, format: 'markdown' },
              { path: `${outputDir}/storage-iteration-${iteration}-quality-score.json`, format: 'code', language: 'json' }
            ],
            summary: {
              iteration,
              currentQuality,
              targetQuality,
              converged,
              issuesFound: qualityScore.criticalIssues?.length || 0
            }
          }
        });
      }
    }
  }

  const finalStorageIteration = iterationResults[iteration - 1];

  // ============================================================================
  // PHASE 4: FEATURE INGESTION PIPELINE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Feature Ingestion Pipeline Design');

  const ingestionPipelineDesign = await ctx.task(ingestionPipelineDesignTask, {
    projectName,
    architectureDesign,
    featureRegistryDesign,
    storageImplementation: finalStorageIteration.storageImplementation,
    dataCharacteristics,
    outputDir
  });

  artifacts.push(...ingestionPipelineDesign.artifacts);

  // Breakpoint: Review ingestion pipeline
  await ctx.breakpoint({
    question: `Review feature ingestion pipeline for ${projectName}. Supports: ${ingestionPipelineDesign.ingestionModes.join(', ')}. Approve?`,
    title: 'Ingestion Pipeline Review',
    context: {
      runId: ctx.runId,
      projectName,
      pipeline: ingestionPipelineDesign,
      files: [
        { path: `${outputDir}/ingestion-pipeline-design.md`, format: 'markdown' },
        { path: `${outputDir}/ingestion-pipeline-spec.json`, format: 'code', language: 'json' }
      ]
    }
  });

  // ============================================================================
  // PHASE 5: FEATURE SERVING LAYER IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Feature Serving Layer Implementation');

  const servingLayerImplementation = await ctx.task(servingLayerImplementationTask, {
    projectName,
    architectureDesign,
    featureRegistryDesign,
    storageImplementation: finalStorageIteration.storageImplementation,
    servingRequirements,
    outputDir
  });

  artifacts.push(...servingLayerImplementation.artifacts);

  // Parallel serving validation checks
  ctx.log('info', 'Running serving layer validation checks');

  const [
    servingLatencyValidation,
    servingConsistencyValidation,
    servingScalabilityValidation
  ] = await ctx.parallel.all([
    () => ctx.task(servingLatencyValidationTask, {
      projectName,
      servingLayerImplementation,
      servingRequirements,
      outputDir
    }),
    () => ctx.task(servingConsistencyValidationTask, {
      projectName,
      servingLayerImplementation,
      storageImplementation: finalStorageIteration.storageImplementation,
      outputDir
    }),
    () => ctx.task(servingScalabilityValidationTask, {
      projectName,
      servingLayerImplementation,
      servingRequirements,
      outputDir
    })
  ]);

  artifacts.push(
    ...servingLatencyValidation.artifacts,
    ...servingConsistencyValidation.artifacts,
    ...servingScalabilityValidation.artifacts
  );

  // Breakpoint: Review serving layer
  await ctx.breakpoint({
    question: `Review feature serving layer for ${projectName}. Latency: ${servingLatencyValidation.measuredLatency}. Target: ${servingRequirements.latencyMs}ms. Approve?`,
    title: 'Serving Layer Review',
    context: {
      runId: ctx.runId,
      projectName,
      serving: servingLayerImplementation,
      validation: {
        latency: servingLatencyValidation,
        consistency: servingConsistencyValidation,
        scalability: servingScalabilityValidation
      },
      files: [
        { path: `${outputDir}/serving-layer-implementation.md`, format: 'markdown' },
        { path: `${outputDir}/serving-validation-report.json`, format: 'code', language: 'json' }
      ]
    }
  });

  // ============================================================================
  // PHASE 6: TRAINING-SERVING SKEW PREVENTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Training-Serving Skew Prevention');

  const skewPreventionDesign = await ctx.task(trainingServingSkewPreventionTask, {
    projectName,
    architectureDesign,
    featureRegistryDesign,
    storageImplementation: finalStorageIteration.storageImplementation,
    servingLayerImplementation,
    outputDir
  });

  artifacts.push(...skewPreventionDesign.artifacts);

  // ============================================================================
  // PHASE 7: FEATURE MONITORING AND OBSERVABILITY
  // ============================================================================

  ctx.log('info', 'Phase 7: Feature Monitoring and Observability');

  const monitoringDesign = await ctx.task(featureMonitoringDesignTask, {
    projectName,
    architectureDesign,
    featureRegistryDesign,
    servingLayerImplementation,
    outputDir
  });

  artifacts.push(...monitoringDesign.artifacts);

  // ============================================================================
  // PHASE 8: FEATURE VERSIONING AND LINEAGE
  // ============================================================================

  ctx.log('info', 'Phase 8: Feature Versioning and Lineage');

  const versioningDesign = await ctx.task(featureVersioningDesignTask, {
    projectName,
    architectureDesign,
    featureRegistryDesign,
    outputDir
  });

  artifacts.push(...versioningDesign.artifacts);

  // ============================================================================
  // PHASE 9: OPERATIONAL PROCEDURES AND RUNBOOKS
  // ============================================================================

  ctx.log('info', 'Phase 9: Operational Procedures and Runbooks');

  const operationalProcedures = await ctx.task(operationalProceduresTask, {
    projectName,
    architectureDesign,
    storageImplementation: finalStorageIteration.storageImplementation,
    servingLayerImplementation,
    ingestionPipelineDesign,
    monitoringDesign,
    outputDir
  });

  artifacts.push(...operationalProcedures.artifacts);

  // ============================================================================
  // PHASE 10: FINAL INTEGRATION AND END-TO-END TESTING
  // ============================================================================

  ctx.log('info', 'Phase 10: Final Integration and End-to-End Testing');

  const [
    integrationTesting,
    performanceTesting,
    failoverTesting
  ] = await ctx.parallel.all([
    () => ctx.task(integrationTestingTask, {
      projectName,
      architectureDesign,
      featureRegistryDesign,
      storageImplementation: finalStorageIteration.storageImplementation,
      servingLayerImplementation,
      ingestionPipelineDesign,
      outputDir
    }),
    () => ctx.task(performanceTestingTask, {
      projectName,
      servingLayerImplementation,
      servingRequirements,
      outputDir
    }),
    () => ctx.task(failoverTestingTask, {
      projectName,
      architectureDesign,
      storageImplementation: finalStorageIteration.storageImplementation,
      outputDir
    })
  ]);

  artifacts.push(
    ...integrationTesting.artifacts,
    ...performanceTesting.artifacts,
    ...failoverTesting.artifacts
  );

  // ============================================================================
  // PHASE 11: DOCUMENTATION AND DEPLOYMENT GUIDE
  // ============================================================================

  ctx.log('info', 'Phase 11: Documentation and Deployment Guide');

  const documentation = await ctx.task(featureStoreDocumentationTask, {
    projectName,
    architectureDesign,
    featureRegistryDesign,
    storageImplementation: finalStorageIteration.storageImplementation,
    servingLayerImplementation,
    ingestionPipelineDesign,
    monitoringDesign,
    versioningDesign,
    operationalProcedures,
    testingResults: {
      integration: integrationTesting,
      performance: performanceTesting,
      failover: failoverTesting
    },
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 12: FINAL REVIEW AND PRODUCTION READINESS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 12: Final Review and Production Readiness Assessment');

  const finalReview = await ctx.task(featureStoreFinalReviewTask, {
    projectName,
    architectureDesign,
    featureRegistryDesign,
    storageQuality: currentQuality,
    targetQuality,
    converged,
    storageIterations: iteration,
    servingLayerImplementation,
    ingestionPipelineDesign,
    monitoringDesign,
    versioningDesign,
    operationalProcedures,
    testingResults: {
      integration: integrationTesting,
      performance: performanceTesting,
      failover: failoverTesting
    },
    outputDir
  });

  artifacts.push(...finalReview.artifacts);

  // Quality Gate: All critical tests must pass
  const criticalTestsFailed = [
    integrationTesting.passed === false,
    performanceTesting.passed === false,
    failoverTesting.passed === false
  ].filter(Boolean).length;

  if (criticalTestsFailed > 0) {
    await ctx.breakpoint({
      question: `${criticalTestsFailed} critical test suite(s) failed. Should we address failures before production deployment?`,
      title: 'Critical Test Failures',
      context: {
        runId: ctx.runId,
        projectName,
        testFailures: {
          integration: !integrationTesting.passed,
          performance: !performanceTesting.passed,
          failover: !failoverTesting.passed
        },
        recommendation: 'Address all critical test failures before production deployment'
      }
    });
  }

  // Final breakpoint for approval
  await ctx.breakpoint({
    question: `Feature Store implementation complete for ${projectName}. Storage quality: ${currentQuality}/${targetQuality}. Production readiness: ${finalReview.productionReadiness}. ${finalReview.verdict}. Approve for production deployment?`,
    title: 'Feature Store Final Review',
    context: {
      runId: ctx.runId,
      projectName,
      files: [
        { path: `${outputDir}/final-report.md`, format: 'markdown' },
        { path: `${outputDir}/architecture-documentation.md`, format: 'markdown' },
        { path: `${outputDir}/deployment-guide.md`, format: 'markdown' },
        { path: `${outputDir}/operational-runbooks.md`, format: 'markdown' },
        { path: `${outputDir}/feature-store-spec.json`, format: 'code', language: 'json' }
      ],
      summary: {
        storageQuality: currentQuality,
        targetQuality,
        converged,
        storageIterations: iteration,
        totalFeatures: featureRegistryDesign.totalFeatures,
        featureGroups: featureRegistryDesign.featureGroups.length,
        productionReadiness: finalReview.productionReadiness,
        approved: finalReview.approved
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  // Return comprehensive results
  return {
    success: converged && finalReview.approved,
    projectName,
    featureStore: {
      architecture: architectureDesign,
      registry: featureRegistryDesign,
      storage: finalStorageIteration.storageImplementation,
      serving: servingLayerImplementation,
      ingestion: ingestionPipelineDesign,
      monitoring: monitoringDesign,
      versioning: versioningDesign
    },
    features: {
      total: featureRegistryDesign.totalFeatures,
      featureGroups: featureRegistryDesign.featureGroups,
      catalog: featureRegistryDesign.featureCatalog
    },
    quality: {
      storageQuality: currentQuality,
      targetQuality,
      converged,
      storageIterations: iteration
    },
    validation: {
      storage: finalStorageIteration.validationChecks,
      serving: {
        latency: servingLatencyValidation,
        consistency: servingConsistencyValidation,
        scalability: servingScalabilityValidation
      },
      skewPrevention: skewPreventionDesign,
      integration: integrationTesting,
      performance: performanceTesting,
      failover: failoverTesting
    },
    operational: {
      procedures: operationalProcedures,
      documentation: documentation
    },
    finalReview,
    artifacts,
    iterationResults,
    duration,
    metadata: {
      processId: 'specializations/data-science-ml/feature-store',
      timestamp: startTime,
      featureStoreType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Feature Store Architecture Design
export const featureStoreArchitectureTask = defineTask('feature-store-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design feature store architecture',
  description: 'Create comprehensive feature store system architecture',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML infrastructure architect specializing in feature store design',
      task: 'Design comprehensive feature store architecture for ML feature management',
      context: args,
      instructions: [
        'Design feature store type (online-only, offline-only, online-offline hybrid)',
        'Design feature registry (metadata storage, schema management, versioning)',
        'Design storage layer (online store: low-latency, offline store: analytical)',
        'Design ingestion pipeline (batch ingestion, streaming ingestion, backfill)',
        'Design serving layer (point lookup, batch retrieval, streaming features)',
        'Design feature transformation and materialization engine',
        'Design training-serving consistency mechanisms',
        'Design monitoring and observability infrastructure',
        'Design security and access control',
        'Select technologies for each component',
        'Create architecture diagram',
        'Document design rationale and trade-offs'
      ],
      outputFormat: 'JSON with architecture, components, technologies, dataFlow, designRationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'components', 'technologies', 'artifacts'],
      properties: {
        architecture: {
          type: 'object',
          properties: {
            featureStoreType: { type: 'string', enum: ['online-only', 'offline-only', 'online-offline'] },
            approach: { type: 'string' },
            designPrinciples: { type: 'array', items: { type: 'string' } }
          }
        },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              technologies: { type: 'array', items: { type: 'string' } },
              responsibilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        technologies: {
          type: 'object',
          properties: {
            onlineStore: { type: 'string' },
            offlineStore: { type: 'string' },
            registry: { type: 'string' },
            ingestion: { type: 'array', items: { type: 'string' } },
            serving: { type: 'string' },
            monitoring: { type: 'string' }
          }
        },
        dataFlow: {
          type: 'object',
          properties: {
            ingestionFlow: { type: 'array', items: { type: 'string' } },
            servingFlow: { type: 'array', items: { type: 'string' } },
            trainingFlow: { type: 'array', items: { type: 'string' } }
          }
        },
        scalability: {
          type: 'object',
          properties: {
            featureCount: { type: 'string' },
            throughput: { type: 'string' },
            latency: { type: 'string' },
            dataVolume: { type: 'string' }
          }
        },
        designRationale: { type: 'string' },
        tradeoffs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-store', 'architecture', 'design']
}));

// Task 2: Feature Registry Design
export const featureRegistryDesignTask = defineTask('feature-registry-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design feature registry and schema',
  description: 'Create feature registry schema and catalog',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data architect specializing in feature store schemas',
      task: 'Design comprehensive feature registry schema and catalog',
      context: args,
      instructions: [
        'Define feature entity schema (feature ID, name, type, description)',
        'Define feature group schema (logical grouping, entity relationships)',
        'Define feature metadata (owner, version, creation date, tags, SLA)',
        'Define feature statistics schema (min, max, mean, missing rate, distribution)',
        'Define feature lineage schema (data sources, transformations, dependencies)',
        'Define feature validation rules (data type, constraints, allowed values)',
        'Design versioning strategy for features and feature groups',
        'Design feature discovery and search mechanism',
        'Design feature deprecation and lifecycle management',
        'Create example feature catalog with common feature patterns',
        'Document schema design and governance policies'
      ],
      outputFormat: 'JSON with registrySchema, featureGroups, featureCatalog, governance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['registrySchema', 'featureGroups', 'featureCatalog', 'artifacts'],
      properties: {
        registrySchema: {
          type: 'object',
          properties: {
            featureSchema: { type: 'object' },
            featureGroupSchema: { type: 'object' },
            metadataSchema: { type: 'object' },
            statisticsSchema: { type: 'object' },
            lineageSchema: { type: 'object' }
          }
        },
        featureGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              entity: { type: 'string' },
              features: { type: 'array', items: { type: 'string' } },
              sources: { type: 'array', items: { type: 'string' } },
              updateFrequency: { type: 'string' }
            }
          }
        },
        featureCatalog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featureId: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              featureGroup: { type: 'string' },
              version: { type: 'string' },
              owner: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalFeatures: { type: 'number' },
        versioningStrategy: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            schemaEvolution: { type: 'string' },
            backwardCompatibility: { type: 'boolean' }
          }
        },
        governance: {
          type: 'object',
          properties: {
            approvalWorkflow: { type: 'string' },
            qualityStandards: { type: 'array', items: { type: 'string' } },
            documentationRequirements: { type: 'array', items: { type: 'string' } }
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

  labels: ['agent', 'feature-store', 'registry', 'schema']
}));

// Task 3: Storage Layer Implementation
export const storageLayerImplementationTask = defineTask('storage-layer-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement storage layer (iteration ${args.iteration})`,
  description: 'Implement feature store storage layer',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'distributed systems engineer',
      task: 'Implement feature store storage layer with online and offline stores',
      context: args,
      instructions: [
        'Implement online store for low-latency feature serving (Redis, DynamoDB, Cassandra)',
        'Implement offline store for training and batch analytics (S3, BigQuery, Snowflake)',
        'Implement data partitioning and sharding strategy for scalability',
        'Implement caching layer for frequently accessed features',
        'Implement data replication and consistency mechanisms',
        'Implement TTL and data retention policies',
        'Implement backup and disaster recovery mechanisms',
        'Generate infrastructure-as-code (Terraform, CloudFormation)',
        'Generate deployment scripts and configuration',
        'Document storage implementation and operational procedures',
        'If previous feedback provided, refine implementation accordingly'
      ],
      outputFormat: 'JSON with onlineStore, offlineStore, infrastructure, deployment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['onlineStore', 'offlineStore', 'infrastructure', 'artifacts'],
      properties: {
        onlineStore: {
          type: 'object',
          properties: {
            technology: { type: 'string' },
            configuration: { type: 'object' },
            partitioning: { type: 'string' },
            replication: { type: 'string' },
            caching: { type: 'string' },
            ttl: { type: 'string' }
          }
        },
        offlineStore: {
          type: 'object',
          properties: {
            technology: { type: 'string' },
            configuration: { type: 'object' },
            partitioning: { type: 'string' },
            compression: { type: 'string' },
            retention: { type: 'string' }
          }
        },
        consistency: {
          type: 'object',
          properties: {
            model: { type: 'string', enum: ['strong', 'eventual', 'causal'] },
            synchronization: { type: 'string' },
            conflictResolution: { type: 'string' }
          }
        },
        infrastructure: {
          type: 'object',
          properties: {
            iacTool: { type: 'string' },
            iacFiles: { type: 'array', items: { type: 'string' } },
            deploymentScripts: { type: 'array', items: { type: 'string' } }
          }
        },
        backup: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            frequency: { type: 'string' },
            retention: { type: 'string' },
            recoveryTime: { type: 'string' }
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

  labels: ['agent', 'feature-store', 'storage', 'implementation', `iteration-${args.iteration}`]
}));

// Task 4: Storage Performance Validation
export const storagePerformanceValidationTask = defineTask('storage-performance-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate storage performance',
  description: 'Test storage layer latency and throughput',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'performance engineer',
      task: 'Validate feature store storage performance',
      context: args,
      instructions: [
        'Design performance test scenarios (read, write, bulk operations)',
        'Test online store read latency (p50, p95, p99)',
        'Test online store write latency',
        'Test offline store query performance',
        'Test throughput under load (concurrent requests)',
        'Test performance with different feature sizes',
        'Test cache hit rates and effectiveness',
        'Identify performance bottlenecks',
        'Compare against SLA requirements',
        'Generate performance test report'
      ],
      outputFormat: 'JSON with performanceMetrics, bottlenecks, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['performanceMetrics', 'meetsRequirements', 'artifacts'],
      properties: {
        performanceMetrics: {
          type: 'object',
          properties: {
            onlineStoreReadLatency: {
              type: 'object',
              properties: {
                p50: { type: 'number' },
                p95: { type: 'number' },
                p99: { type: 'number' }
              }
            },
            onlineStoreWriteLatency: { type: 'object' },
            offlineStoreQueryTime: { type: 'object' },
            throughput: { type: 'object' },
            cacheHitRate: { type: 'number' }
          }
        },
        meetsRequirements: { type: 'boolean' },
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

  labels: ['agent', 'feature-store', 'validation', 'performance']
}));

// Task 5: Storage Consistency Validation
export const storageConsistencyValidationTask = defineTask('storage-consistency-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate storage consistency',
  description: 'Test data consistency between online and offline stores',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data quality engineer',
      task: 'Validate consistency between online and offline feature stores',
      context: args,
      instructions: [
        'Test data consistency between online and offline stores',
        'Test synchronization lag and delay',
        'Test consistency during concurrent writes',
        'Test consistency after failures and recovery',
        'Test eventual consistency guarantees',
        'Test conflict resolution mechanisms',
        'Identify consistency gaps or issues',
        'Measure consistency SLA compliance',
        'Generate consistency validation report'
      ],
      outputFormat: 'JSON with consistencyChecks, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['consistencyChecks', 'consistent', 'artifacts'],
      properties: {
        consistencyChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              result: { type: 'string', enum: ['pass', 'fail', 'warning'] },
              details: { type: 'string' }
            }
          }
        },
        synchronizationLag: { type: 'object' },
        consistent: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-store', 'validation', 'consistency']
}));

// Task 6: Storage Scalability Validation
export const storageScalabilityValidationTask = defineTask('storage-scalability-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate storage scalability',
  description: 'Test storage layer scalability and resource utilization',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'infrastructure engineer',
      task: 'Validate feature store storage scalability',
      context: args,
      instructions: [
        'Test horizontal scalability (adding nodes/shards)',
        'Test vertical scalability (resource increases)',
        'Test storage capacity planning for projected growth',
        'Test performance degradation under load',
        'Test auto-scaling mechanisms',
        'Test resource utilization (CPU, memory, disk, network)',
        'Identify scalability limits and bottlenecks',
        'Estimate costs at different scales',
        'Generate scalability test report'
      ],
      outputFormat: 'JSON with scalabilityTests, limits, costEstimates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scalabilityTests', 'scalable', 'artifacts'],
      properties: {
        scalabilityTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              result: { type: 'string', enum: ['pass', 'fail', 'warning'] },
              metrics: { type: 'object' }
            }
          }
        },
        scalable: { type: 'boolean' },
        limits: {
          type: 'object',
          properties: {
            maxFeatureCount: { type: 'string' },
            maxThroughput: { type: 'string' },
            maxDataVolume: { type: 'string' }
          }
        },
        resourceUtilization: { type: 'object' },
        costEstimates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-store', 'validation', 'scalability']
}));

// Task 7: Storage Reliability Validation
export const storageReliabilityValidationTask = defineTask('storage-reliability-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate storage reliability',
  description: 'Test storage layer fault tolerance and recovery',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'reliability engineer',
      task: 'Validate feature store storage reliability and fault tolerance',
      context: args,
      instructions: [
        'Test data durability guarantees',
        'Test backup and restore procedures',
        'Test failure scenarios (node failures, network partitions)',
        'Test disaster recovery procedures',
        'Test data integrity checks and validation',
        'Test monitoring and alerting effectiveness',
        'Calculate availability SLA (uptime percentage)',
        'Identify single points of failure',
        'Generate reliability test report'
      ],
      outputFormat: 'JSON with reliabilityTests, sla, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reliabilityTests', 'reliable', 'artifacts'],
      properties: {
        reliabilityTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              result: { type: 'string', enum: ['pass', 'fail', 'warning'] },
              details: { type: 'string' }
            }
          }
        },
        reliable: { type: 'boolean' },
        sla: {
          type: 'object',
          properties: {
            availability: { type: 'string' },
            durability: { type: 'string' },
            rto: { type: 'string' },
            rpo: { type: 'string' }
          }
        },
        risks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-store', 'validation', 'reliability']
}));

// Task 8: Storage Quality Scoring
export const storageQualityScoringTask = defineTask('storage-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Score storage quality (iteration ${args.iteration})`,
  description: 'Comprehensive quality assessment of storage layer',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior infrastructure architect and quality assurance specialist',
      task: 'Assess feature store storage quality across multiple dimensions',
      context: args,
      instructions: [
        'Evaluate performance: latency, throughput (weight: 30%)',
        'Evaluate consistency: online-offline sync, data accuracy (weight: 25%)',
        'Evaluate scalability: capacity, elasticity (weight: 20%)',
        'Evaluate reliability: durability, availability, fault tolerance (weight: 15%)',
        'Evaluate implementation: code quality, best practices (weight: 10%)',
        'Calculate weighted overall quality score (0-100)',
        'Identify critical issues requiring immediate attention',
        'Provide specific recommendations for improvement',
        'Assess progress towards target quality',
        'Generate quality scorecard'
      ],
      outputFormat: 'JSON with overallScore, componentScores, criticalIssues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            performance: { type: 'number' },
            consistency: { type: 'number' },
            scalability: { type: 'number' },
            reliability: { type: 'number' },
            implementation: { type: 'number' }
          }
        },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        progress: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-store', 'quality-scoring', `iteration-${args.iteration}`]
}));

// Task 9: Ingestion Pipeline Design
export const ingestionPipelineDesignTask = defineTask('ingestion-pipeline-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design feature ingestion pipeline',
  description: 'Create comprehensive ingestion pipeline for features',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data engineering architect',
      task: 'Design comprehensive feature ingestion pipeline',
      context: args,
      instructions: [
        'Design batch ingestion pipeline (scheduled, backfill)',
        'Design streaming ingestion pipeline (real-time, CDC)',
        'Design feature transformation and computation logic',
        'Design data validation and quality checks',
        'Design schema evolution and compatibility handling',
        'Design error handling and retry mechanisms',
        'Design monitoring and alerting for ingestion',
        'Design backfill and historical data loading',
        'Select ingestion technologies (Kafka, Spark, Flink, Airflow)',
        'Generate pipeline code and configuration',
        'Document ingestion procedures'
      ],
      outputFormat: 'JSON with batchPipeline, streamingPipeline, transformations, technologies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ingestionModes', 'pipelines', 'technologies', 'artifacts'],
      properties: {
        ingestionModes: {
          type: 'array',
          items: { type: 'string', enum: ['batch', 'streaming', 'backfill'] }
        },
        pipelines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mode: { type: 'string' },
              description: { type: 'string' },
              schedule: { type: 'string' },
              dataSource: { type: 'string' },
              transformations: { type: 'array', items: { type: 'string' } },
              validations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        transformations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              logic: { type: 'string' }
            }
          }
        },
        validation: {
          type: 'object',
          properties: {
            schemaValidation: { type: 'boolean' },
            dataQualityChecks: { type: 'array', items: { type: 'string' } },
            errorHandling: { type: 'string' }
          }
        },
        technologies: {
          type: 'object',
          properties: {
            orchestration: { type: 'string' },
            batchProcessing: { type: 'string' },
            streamProcessing: { type: 'string' },
            messaging: { type: 'string' }
          }
        },
        monitoring: {
          type: 'object',
          properties: {
            metrics: { type: 'array', items: { type: 'string' } },
            alerts: { type: 'array', items: { type: 'string' } }
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

  labels: ['agent', 'feature-store', 'ingestion', 'pipeline']
}));

// Task 10: Serving Layer Implementation
export const servingLayerImplementationTask = defineTask('serving-layer-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement feature serving layer',
  description: 'Implement serving API and retrieval logic',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'backend engineer specializing in low-latency APIs',
      task: 'Implement feature serving layer with low-latency retrieval',
      context: args,
      instructions: [
        'Implement point lookup API (get features for single entity)',
        'Implement batch retrieval API (get features for multiple entities)',
        'Implement streaming feature API (real-time feature updates)',
        'Implement feature caching and optimization',
        'Implement request batching and connection pooling',
        'Implement authentication and authorization',
        'Implement rate limiting and throttling',
        'Implement API versioning and backward compatibility',
        'Generate API client libraries (Python, Java)',
        'Generate OpenAPI/Swagger documentation',
        'Document serving API usage and best practices'
      ],
      outputFormat: 'JSON with apis, implementation, clientLibraries, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['apis', 'implementation', 'artifacts'],
      properties: {
        apis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              method: { type: 'string' },
              endpoint: { type: 'string' },
              requestFormat: { type: 'object' },
              responseFormat: { type: 'object' },
              latencySLA: { type: 'string' }
            }
          }
        },
        implementation: {
          type: 'object',
          properties: {
            framework: { type: 'string' },
            language: { type: 'string' },
            caching: { type: 'string' },
            optimization: { type: 'array', items: { type: 'string' } }
          }
        },
        security: {
          type: 'object',
          properties: {
            authentication: { type: 'string' },
            authorization: { type: 'string' },
            rateLimit: { type: 'string' }
          }
        },
        clientLibraries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              language: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        documentation: {
          type: 'object',
          properties: {
            openApiSpec: { type: 'string' },
            examples: { type: 'array', items: { type: 'string' } }
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

  labels: ['agent', 'feature-store', 'serving', 'api']
}));

// Task 11: Serving Latency Validation
export const servingLatencyValidationTask = defineTask('serving-latency-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate serving latency',
  description: 'Test feature serving API latency',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'performance engineer',
      task: 'Validate feature serving latency against SLA requirements',
      context: args,
      instructions: [
        'Test point lookup latency (p50, p95, p99)',
        'Test batch retrieval latency',
        'Test latency under concurrent load',
        'Test latency with cache hits vs cache misses',
        'Test latency across different network conditions',
        'Test latency for different feature sizes',
        'Compare measured latency against SLA',
        'Identify latency bottlenecks',
        'Generate latency test report with percentile distributions'
      ],
      outputFormat: 'JSON with latencyMetrics, meetsRequirements, bottlenecks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['latencyMetrics', 'meetsRequirements', 'artifacts'],
      properties: {
        latencyMetrics: {
          type: 'object',
          properties: {
            pointLookup: {
              type: 'object',
              properties: {
                p50: { type: 'number' },
                p95: { type: 'number' },
                p99: { type: 'number' }
              }
            },
            batchRetrieval: { type: 'object' },
            underLoad: { type: 'object' }
          }
        },
        measuredLatency: { type: 'string' },
        targetLatency: { type: 'string' },
        meetsRequirements: { type: 'boolean' },
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

  labels: ['agent', 'feature-store', 'validation', 'latency']
}));

// Task 12: Serving Consistency Validation
export const servingConsistencyValidationTask = defineTask('serving-consistency-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate serving consistency',
  description: 'Test consistency between serving and storage',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data quality engineer',
      task: 'Validate consistency between feature serving layer and storage',
      context: args,
      instructions: [
        'Test consistency of served features vs stored features',
        'Test cache consistency and invalidation',
        'Test consistency during feature updates',
        'Test consistency across replicas',
        'Test stale read scenarios',
        'Measure consistency lag',
        'Identify consistency issues',
        'Generate consistency validation report'
      ],
      outputFormat: 'JSON with consistencyChecks, consistent, issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['consistencyChecks', 'consistent', 'artifacts'],
      properties: {
        consistencyChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              result: { type: 'string', enum: ['pass', 'fail', 'warning'] },
              details: { type: 'string' }
            }
          }
        },
        consistent: { type: 'boolean' },
        consistencyLag: { type: 'string' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-store', 'validation', 'serving-consistency']
}));

// Task 13: Serving Scalability Validation
export const servingScalabilityValidationTask = defineTask('serving-scalability-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate serving scalability',
  description: 'Test serving layer scalability under load',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'infrastructure engineer',
      task: 'Validate feature serving scalability under load',
      context: args,
      instructions: [
        'Test throughput scalability (QPS capacity)',
        'Test horizontal scaling (adding serving nodes)',
        'Test load balancing effectiveness',
        'Test performance degradation under load',
        'Test auto-scaling mechanisms',
        'Test connection pooling and resource limits',
        'Compare capacity against requirements',
        'Estimate costs at different scales',
        'Generate scalability test report'
      ],
      outputFormat: 'JSON with scalabilityTests, capacity, meetsRequirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scalabilityTests', 'meetsRequirements', 'artifacts'],
      properties: {
        scalabilityTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              result: { type: 'string', enum: ['pass', 'fail', 'warning'] },
              metrics: { type: 'object' }
            }
          }
        },
        capacity: {
          type: 'object',
          properties: {
            maxQPS: { type: 'number' },
            maxConcurrentConnections: { type: 'number' }
          }
        },
        meetsRequirements: { type: 'boolean' },
        costEstimates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-store', 'validation', 'serving-scalability']
}));

// Task 14: Training-Serving Skew Prevention
export const trainingServingSkewPreventionTask = defineTask('training-serving-skew-prevention', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design training-serving skew prevention',
  description: 'Prevent inconsistencies between training and serving',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML engineer specializing in ML systems',
      task: 'Design mechanisms to prevent training-serving skew',
      context: args,
      instructions: [
        'Identify potential sources of training-serving skew',
        'Design shared feature transformation logic for training and serving',
        'Design feature materialization pipeline for offline training',
        'Design point-in-time correct feature retrieval',
        'Design feature validation tests (training vs serving)',
        'Design automated skew detection and alerting',
        'Document best practices for skew prevention',
        'Generate skew prevention checklist',
        'Create example code for consistent feature access'
      ],
      outputFormat: 'JSON with skewSources, preventionMechanisms, validation, bestPractices, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['skewSources', 'preventionMechanisms', 'validation', 'artifacts'],
      properties: {
        skewSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              risk: { type: 'string', enum: ['high', 'medium', 'low'] },
              prevention: { type: 'string' }
            }
          }
        },
        preventionMechanisms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mechanism: { type: 'string' },
              description: { type: 'string' },
              implementation: { type: 'string' }
            }
          }
        },
        validation: {
          type: 'object',
          properties: {
            tests: { type: 'array', items: { type: 'string' } },
            monitoring: { type: 'array', items: { type: 'string' } },
            alerts: { type: 'array', items: { type: 'string' } }
          }
        },
        bestPractices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-store', 'training-serving-skew', 'prevention']
}));

// Task 15: Feature Monitoring Design
export const featureMonitoringDesignTask = defineTask('feature-monitoring-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design feature monitoring and observability',
  description: 'Create comprehensive monitoring for feature store',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'observability engineer',
      task: 'Design comprehensive feature monitoring and observability',
      context: args,
      instructions: [
        'Design feature value monitoring (distribution drift, anomalies)',
        'Design feature freshness monitoring (staleness, update delays)',
        'Design feature availability monitoring (missing features, null rates)',
        'Design feature serving metrics (latency, throughput, errors)',
        'Design feature quality metrics (completeness, accuracy)',
        'Design alerting rules and thresholds',
        'Design dashboards and visualizations',
        'Select monitoring technologies (Prometheus, Grafana, DataDog)',
        'Generate monitoring configuration and rules',
        'Document monitoring procedures'
      ],
      outputFormat: 'JSON with metrics, alerts, dashboards, technologies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'alerts', 'dashboards', 'artifacts'],
      properties: {
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              aggregation: { type: 'string' }
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
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              action: { type: 'string' }
            }
          }
        },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              panels: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        driftDetection: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            threshold: { type: 'string' },
            frequency: { type: 'string' }
          }
        },
        technologies: {
          type: 'object',
          properties: {
            metrics: { type: 'string' },
            alerting: { type: 'string' },
            visualization: { type: 'string' }
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

  labels: ['agent', 'feature-store', 'monitoring', 'observability']
}));

// Task 16: Feature Versioning Design
export const featureVersioningDesignTask = defineTask('feature-versioning-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design feature versioning and lineage',
  description: 'Create versioning strategy and lineage tracking',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data governance engineer',
      task: 'Design feature versioning and lineage tracking',
      context: args,
      instructions: [
        'Design feature versioning strategy (semantic versioning, timestamps)',
        'Design backward compatibility guarantees',
        'Design schema evolution handling',
        'Design feature deprecation workflow',
        'Design lineage tracking (data sources, transformations, dependencies)',
        'Design version comparison and diff tools',
        'Design rollback mechanisms',
        'Document versioning policies and procedures',
        'Generate versioning implementation code'
      ],
      outputFormat: 'JSON with versioningStrategy, lineage, compatibility, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['versioningStrategy', 'lineage', 'compatibility', 'artifacts'],
      properties: {
        versioningStrategy: {
          type: 'object',
          properties: {
            scheme: { type: 'string' },
            format: { type: 'string' },
            autoIncrement: { type: 'boolean' }
          }
        },
        lineage: {
          type: 'object',
          properties: {
            tracking: { type: 'array', items: { type: 'string' } },
            storage: { type: 'string' },
            visualization: { type: 'string' }
          }
        },
        compatibility: {
          type: 'object',
          properties: {
            backwardCompatible: { type: 'boolean' },
            deprecationPolicy: { type: 'string' },
            migrationSupport: { type: 'boolean' }
          }
        },
        schemaEvolution: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            validation: { type: 'string' }
          }
        },
        rollback: {
          type: 'object',
          properties: {
            supported: { type: 'boolean' },
            procedure: { type: 'string' }
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

  labels: ['agent', 'feature-store', 'versioning', 'lineage']
}));

// Task 17: Operational Procedures
export const operationalProceduresTask = defineTask('operational-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create operational procedures and runbooks',
  description: 'Document operational procedures for feature store',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE engineer',
      task: 'Create comprehensive operational procedures and runbooks',
      context: args,
      instructions: [
        'Document feature onboarding procedure',
        'Document feature update and modification procedure',
        'Document feature deprecation and removal procedure',
        'Document incident response procedures',
        'Document backup and restore procedures',
        'Document scaling procedures',
        'Document troubleshooting guides for common issues',
        'Document on-call runbooks',
        'Document disaster recovery procedures',
        'Create operational checklists'
      ],
      outputFormat: 'JSON with procedures, runbooks, checklists, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'runbooks', 'artifacts'],
      properties: {
        procedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              requiredRoles: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        runbooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              scenario: { type: 'string' },
              troubleshootingSteps: { type: 'array', items: { type: 'string' } },
              escalationPath: { type: 'string' }
            }
          }
        },
        checklists: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              items: { type: 'array', items: { type: 'string' } }
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

  labels: ['agent', 'feature-store', 'operations', 'runbooks']
}));

// Task 18: Integration Testing
export const integrationTestingTask = defineTask('integration-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform end-to-end integration testing',
  description: 'Test complete feature store workflow',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA engineer',
      task: 'Perform comprehensive end-to-end integration testing',
      context: args,
      instructions: [
        'Test complete feature ingestion flow (source to storage)',
        'Test complete feature serving flow (storage to client)',
        'Test feature materialization for training',
        'Test feature registry operations (CRUD)',
        'Test feature versioning and rollback',
        'Test monitoring and alerting end-to-end',
        'Test failure scenarios and recovery',
        'Test cross-component integration',
        'Generate integration test report'
      ],
      outputFormat: 'JSON with tests, results, passed, issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tests', 'passed', 'artifacts'],
      properties: {
        tests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              result: { type: 'string', enum: ['pass', 'fail', 'skip'] },
              details: { type: 'string' }
            }
          }
        },
        passed: { type: 'boolean' },
        passRate: { type: 'number' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-store', 'testing', 'integration']
}));

// Task 19: Performance Testing
export const performanceTestingTask = defineTask('performance-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform performance testing',
  description: 'Test feature store performance under load',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'performance engineer',
      task: 'Perform comprehensive performance testing',
      context: args,
      instructions: [
        'Test serving latency under normal load',
        'Test serving latency under peak load',
        'Test serving throughput capacity',
        'Test ingestion throughput',
        'Test query performance on offline store',
        'Test resource utilization under load',
        'Compare results against SLA requirements',
        'Identify performance bottlenecks',
        'Generate performance test report'
      ],
      outputFormat: 'JSON with performanceMetrics, meetsRequirements, passed, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['performanceMetrics', 'passed', 'artifacts'],
      properties: {
        performanceMetrics: {
          type: 'object',
          properties: {
            servingLatency: { type: 'object' },
            servingThroughput: { type: 'object' },
            ingestionThroughput: { type: 'object' },
            queryPerformance: { type: 'object' }
          }
        },
        meetsRequirements: { type: 'boolean' },
        passed: { type: 'boolean' },
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

  labels: ['agent', 'feature-store', 'testing', 'performance']
}));

// Task 20: Failover Testing
export const failoverTestingTask = defineTask('failover-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform failover and disaster recovery testing',
  description: 'Test reliability and recovery mechanisms',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'reliability engineer',
      task: 'Perform failover and disaster recovery testing',
      context: args,
      instructions: [
        'Test node failure scenarios',
        'Test network partition scenarios',
        'Test backup and restore procedures',
        'Test disaster recovery procedures',
        'Test data consistency after recovery',
        'Test monitoring and alerting during failures',
        'Measure recovery time (RTO)',
        'Measure data loss (RPO)',
        'Generate failover test report'
      ],
      outputFormat: 'JSON with failoverTests, passed, rto, rpo, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['failoverTests', 'passed', 'artifacts'],
      properties: {
        failoverTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              result: { type: 'string', enum: ['pass', 'fail'] },
              details: { type: 'string' }
            }
          }
        },
        passed: { type: 'boolean' },
        rto: { type: 'string' },
        rpo: { type: 'string' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'feature-store', 'testing', 'failover']
}));

// Task 21: Feature Store Documentation
export const featureStoreDocumentationTask = defineTask('feature-store-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive documentation',
  description: 'Create complete feature store documentation',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'technical writer and ML engineer',
      task: 'Generate comprehensive feature store documentation',
      context: args,
      instructions: [
        'Create architecture overview document',
        'Create feature catalog and registry documentation',
        'Create API reference documentation',
        'Create user guide (feature onboarding, usage examples)',
        'Create operator guide (deployment, configuration, maintenance)',
        'Create troubleshooting guide',
        'Create performance tuning guide',
        'Create best practices and design patterns',
        'Create deployment guide (infrastructure setup, configuration)',
        'Format all documentation in professional Markdown'
      ],
      outputFormat: 'JSON with documents, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documents', 'artifacts'],
      properties: {
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              path: { type: 'string' },
              description: { type: 'string' }
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

  labels: ['agent', 'feature-store', 'documentation']
}));

// Task 22: Feature Store Final Review
export const featureStoreFinalReviewTask = defineTask('feature-store-final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final feature store review',
  description: 'Comprehensive final review and production readiness assessment',

  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'principal ML infrastructure architect',
      task: 'Conduct final comprehensive review of feature store implementation',
      context: args,
      instructions: [
        'Review architecture design and implementation quality',
        'Review storage layer quality and convergence',
        'Review serving layer performance and reliability',
        'Review ingestion pipeline completeness',
        'Review monitoring and observability coverage',
        'Review operational procedures and documentation',
        'Assess all testing results (integration, performance, failover)',
        'Assess production readiness across all dimensions',
        'Identify any blocking issues',
        'Provide production deployment recommendation',
        'Suggest follow-up tasks or improvements'
      ],
      outputFormat: 'JSON with verdict, approved, productionReadiness, confidence, strengths, concerns, blockingIssues, followUpTasks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'approved', 'productionReadiness', 'confidence', 'artifacts'],
      properties: {
        verdict: { type: 'string' },
        approved: { type: 'boolean' },
        productionReadiness: { type: 'string', enum: ['ready', 'needs-work', 'not-ready'] },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        strengths: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        blockingIssues: { type: 'array', items: { type: 'string' } },
        followUpTasks: { type: 'array', items: { type: 'string' } },
        readinessCriteria: {
          type: 'object',
          properties: {
            architecture: { type: 'boolean' },
            storage: { type: 'boolean' },
            serving: { type: 'boolean' },
            ingestion: { type: 'boolean' },
            monitoring: { type: 'boolean' },
            documentation: { type: 'boolean' },
            testing: { type: 'boolean' },
            operations: { type: 'boolean' }
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

  labels: ['agent', 'feature-store', 'final-review']
}));
