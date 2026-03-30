/**
 * @process data-engineering-analytics/data-catalog
 * @description Comprehensive data catalog setup covering metadata management, platform selection (DataHub/Amundsen/Alation), data discovery, lineage visualization, and business glossary
 * @inputs { platform?: string, dataSources: array, requirements?: object, enableLineage?: boolean, enableGlossary?: boolean, cloudProvider?: string }
 * @outputs { success: boolean, platform: string, catalogConfig: object, lineageGraph: object, glossary: object, discoveryMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('data-engineering-analytics/data-catalog', {
 *   platform: 'datahub', // 'datahub', 'amundsen', 'alation', or null for evaluation
 *   dataSources: [
 *     { type: 'snowflake', connection: 'account.region.snowflakecomputing.com', databases: ['analytics', 'raw'] },
 *     { type: 'postgres', host: 'localhost', databases: ['app_db'] },
 *     { type: 's3', bucket: 'data-lake', prefix: 'datasets/' },
 *     { type: 'kafka', brokers: ['kafka1:9092'], topics: ['events'] }
 *   ],
 *   requirements: {
 *     users: 50,
 *     dataSets: 1000,
 *     searchVolume: 'high',
 *     integrations: ['tableau', 'looker', 'dbt', 'airflow'],
 *     authentication: 'sso',
 *     complianceRequirements: ['gdpr', 'ccpa']
 *   },
 *   enableLineage: true,
 *   enableGlossary: true,
 *   cloudProvider: 'aws'
 * });
 *
 * @references
 * - DataHub: https://datahubproject.io/
 * - Amundsen: https://www.amundsen.io/
 * - Alation: https://www.alation.com/
 * - Apache Atlas: https://atlas.apache.org/
 * - Data Catalog Best Practices: https://cloud.google.com/architecture/data-catalog-best-practices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    platform = null, // null for evaluation, or specific: 'datahub', 'amundsen', 'alation'
    dataSources = [],
    requirements = {},
    enableLineage = true,
    enableGlossary = true,
    enableDataQualityIntegration = true,
    enableAccessControl = true,
    cloudProvider = 'aws',
    deploymentMode = 'kubernetes', // 'kubernetes', 'docker-compose', 'cloud-managed'
    outputDir = 'data-catalog-setup'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  if (dataSources.length === 0) {
    return {
      success: false,
      error: 'No data sources provided. At least one data source is required.',
      metadata: { processId: 'data-engineering-analytics/data-catalog', timestamp: startTime }
    };
  }

  ctx.log('info', 'Starting Data Catalog Setup');

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing data catalog requirements');

  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    requirements,
    dataSources,
    cloudProvider,
    outputDir
  });

  if (!requirementsAnalysis.success) {
    return {
      success: false,
      error: 'Requirements analysis failed',
      details: requirementsAnalysis,
      metadata: { processId: 'data-engineering-analytics/data-catalog', timestamp: startTime }
    };
  }

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: PLATFORM SELECTION (if not specified)
  // ============================================================================

  let selectedPlatform = platform;
  let platformEvaluation = null;

  if (!selectedPlatform) {
    ctx.log('info', 'Phase 2: Evaluating data catalog platforms');
    platformEvaluation = await ctx.task(platformSelectionTask, {
      requirements: requirementsAnalysis.analyzedRequirements,
      dataSources,
      cloudProvider,
      deploymentMode,
      outputDir
    });

    selectedPlatform = platformEvaluation.recommendedPlatform;
    artifacts.push(...platformEvaluation.artifacts);
  } else {
    ctx.log('info', `Using specified platform: ${selectedPlatform}`);
  }

  // ============================================================================
  // PHASE 3: ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing data catalog architecture');

  const architectureDesign = await ctx.task(architectureDesignTask, {
    platform: selectedPlatform,
    requirements: requirementsAnalysis.analyzedRequirements,
    dataSources,
    cloudProvider,
    deploymentMode,
    outputDir
  });

  artifacts.push(...architectureDesign.artifacts);

  // ============================================================================
  // PHASE 4: DATA SOURCE CONNECTORS SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Configuring data source connectors');

  const connectorsSetup = await ctx.task(dataSourceConnectorsTask, {
    platform: selectedPlatform,
    dataSources,
    architecture: architectureDesign.architecture,
    outputDir
  });

  artifacts.push(...connectorsSetup.artifacts);

  // ============================================================================
  // PHASE 5: METADATA MANAGEMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up metadata management framework');

  const metadataManagement = await ctx.task(metadataManagementTask, {
    platform: selectedPlatform,
    dataSources,
    connectors: connectorsSetup.connectors,
    architecture: architectureDesign.architecture,
    outputDir
  });

  artifacts.push(...metadataManagement.artifacts);

  // ============================================================================
  // PHASE 6: DATA LINEAGE IMPLEMENTATION (if enabled)
  // ============================================================================

  let lineageSetup = null;
  if (enableLineage) {
    ctx.log('info', 'Phase 6: Implementing data lineage tracking');

    lineageSetup = await ctx.task(dataLineageTask, {
      platform: selectedPlatform,
      dataSources,
      connectors: connectorsSetup.connectors,
      requirements: requirementsAnalysis.analyzedRequirements,
      outputDir
    });

    artifacts.push(...lineageSetup.artifacts);
  }

  // ============================================================================
  // PHASE 7: BUSINESS GLOSSARY SETUP (if enabled)
  // ============================================================================

  let glossarySetup = null;
  if (enableGlossary) {
    ctx.log('info', 'Phase 7: Creating business glossary');

    glossarySetup = await ctx.task(businessGlossaryTask, {
      platform: selectedPlatform,
      dataSources,
      metadataSchema: metadataManagement.schema,
      requirements: requirementsAnalysis.analyzedRequirements,
      outputDir
    });

    artifacts.push(...glossarySetup.artifacts);
  }

  // ============================================================================
  // PHASE 8: SEARCH AND DISCOVERY CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Configuring search and discovery capabilities');

  const searchDiscovery = await ctx.task(searchDiscoveryTask, {
    platform: selectedPlatform,
    metadataManagement,
    glossarySetup,
    requirements: requirementsAnalysis.analyzedRequirements,
    outputDir
  });

  artifacts.push(...searchDiscovery.artifacts);

  // ============================================================================
  // PHASE 9: ACCESS CONTROL AND SECURITY (if enabled)
  // ============================================================================

  let accessControlSetup = null;
  if (enableAccessControl) {
    ctx.log('info', 'Phase 9: Configuring access control and security');

    accessControlSetup = await ctx.task(accessControlTask, {
      platform: selectedPlatform,
      dataSources,
      requirements: requirementsAnalysis.analyzedRequirements,
      cloudProvider,
      outputDir
    });

    artifacts.push(...accessControlSetup.artifacts);
  }

  // ============================================================================
  // PHASE 10: DATA QUALITY INTEGRATION (if enabled)
  // ============================================================================

  let dataQualityIntegration = null;
  if (enableDataQualityIntegration) {
    ctx.log('info', 'Phase 10: Integrating data quality metrics');

    dataQualityIntegration = await ctx.task(dataQualityIntegrationTask, {
      platform: selectedPlatform,
      dataSources,
      metadataManagement,
      outputDir
    });

    artifacts.push(...dataQualityIntegration.artifacts);
  }

  // ============================================================================
  // PHASE 11: DEPLOYMENT CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating deployment configuration');

  const deploymentConfig = await ctx.task(deploymentConfigurationTask, {
    platform: selectedPlatform,
    architecture: architectureDesign.architecture,
    connectors: connectorsSetup.connectors,
    cloudProvider,
    deploymentMode,
    outputDir
  });

  artifacts.push(...deploymentConfig.artifacts);

  // ============================================================================
  // PHASE 12: INTEGRATION WITH BI TOOLS AND ORCHESTRATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Configuring integrations with BI and orchestration tools');

  const toolIntegrations = await ctx.task(toolIntegrationsTask, {
    platform: selectedPlatform,
    architecture: architectureDesign.architecture,
    requirements: requirementsAnalysis.analyzedRequirements,
    outputDir
  });

  artifacts.push(...toolIntegrations.artifacts);

  // ============================================================================
  // PHASE 13: MONITORING AND OBSERVABILITY
  // ============================================================================

  ctx.log('info', 'Phase 13: Setting up monitoring and observability');

  const monitoringSetup = await ctx.task(monitoringSetupTask, {
    platform: selectedPlatform,
    architecture: architectureDesign.architecture,
    deploymentConfig: deploymentConfig.configuration,
    outputDir
  });

  artifacts.push(...monitoringSetup.artifacts);

  // ============================================================================
  // PHASE 14: DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Generating comprehensive documentation');

  const documentation = await ctx.task(documentationGenerationTask, {
    platform: selectedPlatform,
    platformEvaluation,
    requirements: requirementsAnalysis.analyzedRequirements,
    architectureDesign,
    connectorsSetup,
    metadataManagement,
    lineageSetup,
    glossarySetup,
    searchDiscovery,
    accessControlSetup,
    dataQualityIntegration,
    deploymentConfig,
    toolIntegrations,
    monitoringSetup,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // BREAKPOINT: REVIEW COMPLETE SETUP
  // ============================================================================

  await ctx.breakpoint({
    question: `Data Catalog setup complete for ${selectedPlatform}. Review the architecture, configuration, and deployment plan?`,
    title: 'Data Catalog Setup Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        platform: selectedPlatform,
        cloudProvider,
        deploymentMode,
        dataSourcesConfigured: connectorsSetup.connectors.length,
        lineageEnabled: enableLineage,
        glossaryEnabled: enableGlossary,
        estimatedSetupTime: documentation.implementationPlan?.estimatedTimeline || 'N/A'
      }
    }
  });

  // ============================================================================
  // PHASE 15: IMPLEMENTATION CHECKLIST
  // ============================================================================

  ctx.log('info', 'Phase 15: Generating implementation checklist');

  const implementationChecklist = await ctx.task(implementationChecklistTask, {
    platform: selectedPlatform,
    architectureDesign,
    connectorsSetup,
    deploymentConfig,
    monitoringSetup,
    outputDir
  });

  artifacts.push(...implementationChecklist.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    platform: selectedPlatform,
    platformEvaluation,
    catalogConfig: {
      architecture: architectureDesign.architecture,
      connectors: connectorsSetup.connectors,
      metadata: metadataManagement.schema,
      search: searchDiscovery.configuration,
      security: accessControlSetup?.configuration || null
    },
    lineageGraph: lineageSetup ? {
      enabled: true,
      sources: lineageSetup.trackedSources,
      edges: lineageSetup.lineageEdges,
      visualizationUrl: lineageSetup.visualizationUrl
    } : { enabled: false },
    glossary: glossarySetup ? {
      enabled: true,
      terms: glossarySetup.terms.length,
      categories: glossarySetup.categories,
      customFields: glossarySetup.customFields
    } : { enabled: false },
    discoveryMetrics: {
      searchable: searchDiscovery.searchableAssets,
      indexed: searchDiscovery.indexedCount,
      searchScoreMethod: searchDiscovery.rankingMethod
    },
    dataQualityIntegration: dataQualityIntegration ? {
      enabled: true,
      metrics: dataQualityIntegration.metrics,
      integrationPoints: dataQualityIntegration.integrationPoints
    } : { enabled: false },
    deployment: {
      mode: deploymentMode,
      cloudProvider,
      configuration: deploymentConfig.configuration,
      estimatedCost: deploymentConfig.estimatedCost
    },
    integrations: toolIntegrations.configuredIntegrations,
    monitoring: monitoringSetup.configuration,
    implementationChecklist: implementationChecklist.checklist,
    artifacts,
    duration,
    metadata: {
      processId: 'data-engineering-analytics/data-catalog',
      timestamp: startTime,
      platform: selectedPlatform,
      deploymentMode,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Task 1: Requirements Analysis
 */
export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze data catalog requirements',
  agent: {
    name: 'requirements-analyst',
    prompt: {
      role: 'senior data catalog architect',
      task: 'Gather and analyze comprehensive data catalog requirements',
      context: args,
      instructions: [
        'Analyze organizational data landscape and discovery needs',
        'Determine number of users and expected usage patterns',
        'Identify data sources to be cataloged (databases, data lakes, warehouses, APIs)',
        'Assess search and discovery requirements',
        'Define metadata standards and governance needs',
        'Identify data lineage tracking requirements',
        'Assess business glossary and taxonomy needs',
        'Determine integration requirements (BI tools, orchestration, data quality)',
        'Identify compliance and security requirements',
        'Define success criteria and adoption metrics',
        'Document technical constraints and infrastructure requirements',
        'Save comprehensive requirements document'
      ],
      outputFormat: 'JSON with analyzed requirements, key metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analyzedRequirements', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analyzedRequirements: {
          type: 'object',
          properties: {
            users: { type: 'number' },
            dataSets: { type: 'number' },
            dataSourceTypes: { type: 'array', items: { type: 'string' } },
            searchVolume: { type: 'string' },
            lineageRequirement: { type: 'string' },
            glossaryRequirement: { type: 'string' },
            integrations: { type: 'array', items: { type: 'string' } },
            complianceRequirements: { type: 'array', items: { type: 'string' } },
            technicalConstraints: { type: 'object' }
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
  labels: ['agent', 'data-catalog', 'requirements', 'analysis']
}));

/**
 * Task 2: Platform Selection
 */
export const platformSelectionTask = defineTask('platform-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate and select data catalog platform',
  agent: {
    name: 'platform-evaluator',
    prompt: {
      role: 'data platform architect',
      task: 'Evaluate DataHub, Amundsen, and Alation against requirements',
      context: args,
      instructions: [
        'Evaluate LinkedIn DataHub: architecture, features, extensibility, community',
        'Evaluate Lyft Amundsen: architecture, search capabilities, UI/UX',
        'Evaluate Alation: enterprise features, pricing, managed service',
        'Compare Apache Atlas for Hadoop/big data environments',
        'Assess platform scalability and performance',
        'Evaluate metadata model flexibility',
        'Compare lineage tracking capabilities',
        'Assess search and discovery features',
        'Evaluate integration ecosystem',
        'Compare deployment complexity and operational overhead',
        'Analyze total cost of ownership (open-source vs commercial)',
        'Score each platform against requirements',
        'Provide recommendation with detailed justification',
        'Create comparison matrix and decision document'
      ],
      outputFormat: 'JSON with platform comparison, scores, recommendation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedPlatform', 'platformComparison', 'artifacts'],
      properties: {
        recommendedPlatform: { type: 'string', enum: ['datahub', 'amundsen', 'alation', 'atlas'] },
        platformComparison: {
          type: 'object',
          properties: {
            datahub: { type: 'object', properties: { score: { type: 'number' }, pros: { type: 'array' }, cons: { type: 'array' } } },
            amundsen: { type: 'object', properties: { score: { type: 'number' }, pros: { type: 'array' }, cons: { type: 'array' } } },
            alation: { type: 'object', properties: { score: { type: 'number' }, pros: { type: 'array' }, cons: { type: 'array' } } },
            atlas: { type: 'object', properties: { score: { type: 'number' }, pros: { type: 'array' }, cons: { type: 'array' } } }
          }
        },
        justification: { type: 'string' },
        comparisonMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-catalog', 'platform-selection', 'evaluation']
}));

/**
 * Task 3: Architecture Design
 */
export const architectureDesignTask = defineTask('architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design data catalog architecture',
  agent: {
    name: 'data-architect',
    prompt: {
      role: 'principal data catalog architect',
      task: 'Design comprehensive data catalog architecture',
      context: args,
      instructions: [
        'Design overall system architecture for selected platform',
        'Plan metadata storage backend (database, graph database)',
        'Design search infrastructure (Elasticsearch, OpenSearch)',
        'Plan ingestion pipeline architecture for metadata extraction',
        'Design caching and performance optimization layers',
        'Plan API gateway and service mesh architecture',
        'Design frontend architecture and customizations',
        'Plan high availability and disaster recovery',
        'Design network architecture and security zones',
        'Plan scalability strategy for growth',
        'Create architecture diagrams (C4 model, component diagrams)',
        'Document design decisions and trade-offs',
        'Define infrastructure requirements (compute, storage, network)'
      ],
      outputFormat: 'JSON with architecture design, components, diagrams, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'artifacts'],
      properties: {
        architecture: {
          type: 'object',
          properties: {
            components: { type: 'array', items: { type: 'object' } },
            metadataBackend: { type: 'object' },
            searchInfrastructure: { type: 'object' },
            ingestionPipeline: { type: 'object' },
            apiGateway: { type: 'object' },
            frontend: { type: 'object' },
            highAvailability: { type: 'object' },
            networkDesign: { type: 'object' }
          }
        },
        designDecisions: { type: 'array', items: { type: 'string' } },
        infrastructureRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-catalog', 'architecture', 'design']
}));

/**
 * Task 4: Data Source Connectors Setup
 */
export const dataSourceConnectorsTask = defineTask('data-source-connectors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure data source connectors',
  agent: {
    name: 'data-engineer',
    prompt: {
      role: 'data integration engineer',
      task: 'Configure connectors for all data sources to ingest metadata',
      context: args,
      instructions: [
        'For each data source, select appropriate connector (JDBC, API, custom)',
        'Configure connection parameters and credentials',
        'Set up authentication and authorization',
        'Configure metadata extraction rules and filters',
        'Define ingestion schedule and frequency',
        'Configure incremental vs full metadata sync',
        'Set up error handling and retry logic',
        'Configure data source-specific extractors (schemas, tables, columns, views)',
        'Generate connector configuration files',
        'Create secrets management setup for credentials',
        'Document connector setup for each data source',
        'Provide testing and validation procedures'
      ],
      outputFormat: 'JSON with connectors array, configurations, credentials setup, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['connectors', 'artifacts'],
      properties: {
        connectors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              sourceType: { type: 'string' },
              configPath: { type: 'string' },
              schedule: { type: 'string' },
              extractionRules: { type: 'object' }
            }
          }
        },
        credentialsSetup: { type: 'object' },
        ingestionSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-catalog', 'connectors', 'ingestion']
}));

/**
 * Task 5: Metadata Management
 */
export const metadataManagementTask = defineTask('metadata-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup metadata management framework',
  agent: {
    name: 'metadata-architect',
    prompt: {
      role: 'metadata management specialist',
      task: 'Design and implement comprehensive metadata management framework',
      context: args,
      instructions: [
        'Define metadata model and schema extensions',
        'Configure technical metadata capture (schema, table, column, data types)',
        'Set up business metadata fields (descriptions, owners, tags)',
        'Configure operational metadata tracking (usage, performance, freshness)',
        'Define custom metadata attributes for organization needs',
        'Set up metadata versioning and change tracking',
        'Configure metadata quality rules and validation',
        'Design metadata enrichment workflows',
        'Set up automated metadata tagging and classification',
        'Configure metadata propagation across systems',
        'Create metadata standards and governance policies',
        'Document metadata model and field definitions',
        'Generate metadata management guide'
      ],
      outputFormat: 'JSON with schema, metadata standards, enrichment rules, governance policies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schema', 'artifacts'],
      properties: {
        schema: {
          type: 'object',
          properties: {
            technicalMetadata: { type: 'array' },
            businessMetadata: { type: 'array' },
            operationalMetadata: { type: 'array' },
            customAttributes: { type: 'array' }
          }
        },
        metadataStandards: { type: 'object' },
        enrichmentRules: { type: 'array' },
        governancePolicies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-catalog', 'metadata', 'governance']
}));

/**
 * Task 6: Data Lineage
 */
export const dataLineageTask = defineTask('data-lineage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement data lineage tracking',
  agent: {
    name: 'lineage-engineer',
    prompt: {
      role: 'data lineage specialist',
      task: 'Implement comprehensive data lineage tracking and visualization',
      context: args,
      instructions: [
        'Configure lineage extraction from ETL/ELT tools (Airflow, dbt, Spark)',
        'Set up query log parsing for lineage inference',
        'Configure API-based lineage ingestion',
        'Implement column-level lineage tracking',
        'Set up cross-system lineage connections',
        'Configure lineage graph storage and indexing',
        'Implement lineage impact analysis capabilities',
        'Set up upstream/downstream dependency tracking',
        'Configure lineage visualization and UI',
        'Implement lineage search and filtering',
        'Create lineage validation and quality checks',
        'Document lineage extraction methods',
        'Generate lineage setup and troubleshooting guide'
      ],
      outputFormat: 'JSON with lineage configuration, tracked sources, visualization config, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['lineageConfiguration', 'artifacts'],
      properties: {
        lineageConfiguration: {
          type: 'object',
          properties: {
            extractionMethods: { type: 'array' },
            granularity: { type: 'string' },
            refreshFrequency: { type: 'string' }
          }
        },
        trackedSources: { type: 'array', items: { type: 'string' } },
        lineageEdges: { type: 'number' },
        visualizationUrl: { type: 'string' },
        impactAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-catalog', 'lineage', 'tracking']
}));

/**
 * Task 7: Business Glossary
 */
export const businessGlossaryTask = defineTask('business-glossary', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create business glossary',
  agent: {
    name: 'glossary-specialist',
    prompt: {
      role: 'business glossary and taxonomy expert',
      task: 'Create comprehensive business glossary with terms, definitions, and relationships',
      context: args,
      instructions: [
        'Analyze data sources to identify key business concepts',
        'Define glossary structure and hierarchy',
        'Create initial set of business terms from domain knowledge',
        'Define term relationships (synonyms, related terms, parent/child)',
        'Set up term ownership and stewardship',
        'Configure term approval workflows',
        'Create term templates with standard fields',
        'Set up term-to-asset linking mechanisms',
        'Configure glossary search and browsing',
        'Implement term versioning and change history',
        'Create glossary governance policies',
        'Generate glossary documentation and user guide',
        'Provide term maintenance and contribution guidelines'
      ],
      outputFormat: 'JSON with terms, categories, relationships, governance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['terms', 'artifacts'],
      properties: {
        terms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              definition: { type: 'string' },
              category: { type: 'string' },
              owner: { type: 'string' },
              synonyms: { type: 'array' },
              relatedTerms: { type: 'array' }
            }
          }
        },
        categories: { type: 'array', items: { type: 'string' } },
        relationships: { type: 'object' },
        customFields: { type: 'array' },
        governance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-catalog', 'glossary', 'taxonomy']
}));

/**
 * Task 8: Search and Discovery
 */
export const searchDiscoveryTask = defineTask('search-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure search and discovery',
  agent: {
    name: 'search-engineer',
    prompt: {
      role: 'search and information retrieval specialist',
      task: 'Configure powerful search and discovery capabilities',
      context: args,
      instructions: [
        'Configure Elasticsearch/OpenSearch indexes for metadata',
        'Set up full-text search across all metadata fields',
        'Configure faceted search and filtering',
        'Implement relevance ranking and scoring',
        'Set up search suggestions and auto-complete',
        'Configure fuzzy matching and typo tolerance',
        'Implement advanced query capabilities',
        'Set up search analytics and tracking',
        'Configure personalized search results',
        'Implement asset recommendation engine',
        'Set up search performance optimization',
        'Configure search result previews and snippets',
        'Document search capabilities and query syntax'
      ],
      outputFormat: 'JSON with search configuration, indexed assets, ranking, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'artifacts'],
      properties: {
        configuration: {
          type: 'object',
          properties: {
            searchEngine: { type: 'string' },
            indexes: { type: 'array' },
            facets: { type: 'array' },
            rankingMethod: { type: 'string' }
          }
        },
        searchableAssets: { type: 'number' },
        indexedCount: { type: 'number' },
        rankingMethod: { type: 'string' },
        performanceMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-catalog', 'search', 'discovery']
}));

/**
 * Task 9: Access Control
 */
export const accessControlTask = defineTask('access-control', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure access control and security',
  agent: {
    name: 'security-architect',
    prompt: {
      role: 'data security and access control specialist',
      task: 'Implement comprehensive access control and security for data catalog',
      context: args,
      instructions: [
        'Design authentication strategy (SSO, LDAP, OAuth)',
        'Configure user and group management',
        'Implement role-based access control (RBAC)',
        'Set up metadata-level permissions',
        'Configure asset-level access controls',
        'Implement field-level security for sensitive metadata',
        'Set up audit logging for all access',
        'Configure data classification and labeling',
        'Implement PII detection and masking in catalog',
        'Set up compliance controls (GDPR, CCPA)',
        'Configure encryption for data in transit and at rest',
        'Create security policies and procedures',
        'Document access control model and administration'
      ],
      outputFormat: 'JSON with security configuration, policies, access model, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'artifacts'],
      properties: {
        configuration: {
          type: 'object',
          properties: {
            authentication: { type: 'object' },
            rbac: { type: 'object' },
            encryption: { type: 'object' },
            auditLogging: { type: 'object' }
          }
        },
        policies: { type: 'array' },
        accessModel: { type: 'object' },
        complianceControls: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-catalog', 'security', 'access-control']
}));

/**
 * Task 10: Data Quality Integration
 */
export const dataQualityIntegrationTask = defineTask('data-quality-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate data quality metrics',
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'data quality and catalog integration specialist',
      task: 'Integrate data quality metrics into catalog for visibility',
      context: args,
      instructions: [
        'Configure integration with data quality tools (Great Expectations, dbt)',
        'Set up quality metric ingestion pipeline',
        'Define quality score display in catalog UI',
        'Configure quality alerts and notifications',
        'Set up quality trend tracking',
        'Implement quality-based asset ranking',
        'Configure quality dimension visualization',
        'Set up quality rule documentation in catalog',
        'Implement quality issue tracking',
        'Configure automated quality checks for new assets',
        'Create quality dashboard integration',
        'Document quality integration architecture',
        'Provide quality metric interpretation guide'
      ],
      outputFormat: 'JSON with integration configuration, metrics, integration points, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationPoints', 'artifacts'],
      properties: {
        integrationPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              metricTypes: { type: 'array' },
              ingestionMethod: { type: 'string' }
            }
          }
        },
        metrics: { type: 'array', items: { type: 'string' } },
        displayConfiguration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-catalog', 'data-quality', 'integration']
}));

/**
 * Task 11: Deployment Configuration
 */
export const deploymentConfigurationTask = defineTask('deployment-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate deployment configuration',
  agent: {
    name: 'devops-engineer',
    prompt: {
      role: 'DevOps engineer and infrastructure specialist',
      task: 'Generate complete deployment configuration for data catalog',
      context: args,
      instructions: [
        'Generate Kubernetes manifests (deployments, services, ingress, configmaps)',
        'Create Helm charts for streamlined deployment',
        'Generate Docker Compose configuration for local/dev environments',
        'Configure persistent storage (volumes, storage classes)',
        'Set up horizontal pod autoscaling (HPA)',
        'Configure resource requests and limits',
        'Set up health checks and readiness probes',
        'Configure environment-specific settings (dev, staging, prod)',
        'Generate CI/CD pipeline configuration',
        'Create infrastructure as code (Terraform/CloudFormation)',
        'Configure backup and disaster recovery',
        'Document deployment procedures and rollback',
        'Generate cost estimation for cloud deployment'
      ],
      outputFormat: 'JSON with configuration files, deployment steps, cost estimate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'artifacts'],
      properties: {
        configuration: {
          type: 'object',
          properties: {
            kubernetes: { type: 'object' },
            helm: { type: 'object' },
            docker: { type: 'object' },
            storage: { type: 'object' },
            autoscaling: { type: 'object' }
          }
        },
        deploymentSteps: { type: 'array', items: { type: 'string' } },
        estimatedCost: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-catalog', 'deployment', 'kubernetes']
}));

/**
 * Task 12: Tool Integrations
 */
export const toolIntegrationsTask = defineTask('tool-integrations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure BI and orchestration tool integrations',
  agent: {
    name: 'integration-engineer',
    prompt: {
      role: 'integration engineer specializing in data tools',
      task: 'Configure integrations with BI tools, orchestration, and other data platforms',
      context: args,
      instructions: [
        'Configure Tableau integration for metadata sync',
        'Set up Looker/LookML metadata extraction',
        'Configure Power BI integration',
        'Set up Apache Airflow DAG metadata ingestion',
        'Configure dbt project integration and documentation',
        'Set up Jupyter notebook integration',
        'Configure Slack/Teams notifications',
        'Set up API integrations for custom tools',
        'Configure reverse metadata propagation (catalog to tools)',
        'Set up usage analytics collection',
        'Create integration testing procedures',
        'Document integration setup for each tool',
        'Provide troubleshooting guides'
      ],
      outputFormat: 'JSON with configured integrations, setup guides, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuredIntegrations', 'artifacts'],
      properties: {
        configuredIntegrations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              integrationType: { type: 'string' },
              configPath: { type: 'string' },
              features: { type: 'array' }
            }
          }
        },
        setupGuides: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-catalog', 'integrations', 'bi-tools']
}));

/**
 * Task 13: Monitoring Setup
 */
export const monitoringSetupTask = defineTask('monitoring-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup monitoring and observability',
  agent: {
    name: 'sre-engineer',
    prompt: {
      role: 'SRE and monitoring specialist',
      task: 'Set up comprehensive monitoring and observability for data catalog',
      context: args,
      instructions: [
        'Configure application performance monitoring (APM)',
        'Set up infrastructure monitoring (CPU, memory, disk, network)',
        'Configure log aggregation and analysis',
        'Set up metrics collection (Prometheus/Grafana)',
        'Configure ingestion pipeline monitoring',
        'Set up search performance tracking',
        'Configure user activity and adoption metrics',
        'Set up alerting rules and thresholds',
        'Configure notification channels',
        'Create operational dashboards',
        'Set up distributed tracing',
        'Define SLAs and SLIs',
        'Create runbooks for common issues',
        'Document monitoring architecture'
      ],
      outputFormat: 'JSON with monitoring configuration, dashboards, alerts, runbooks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'artifacts'],
      properties: {
        configuration: {
          type: 'object',
          properties: {
            apm: { type: 'object' },
            infrastructure: { type: 'object' },
            logs: { type: 'object' },
            metrics: { type: 'object' },
            tracing: { type: 'object' }
          }
        },
        dashboards: { type: 'array' },
        alertingRules: { type: 'array' },
        runbooks: { type: 'array' },
        slas: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-catalog', 'monitoring', 'observability']
}));

/**
 * Task 14: Documentation Generation
 */
export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive documentation',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer and data catalog specialist',
      task: 'Create comprehensive data catalog documentation',
      context: args,
      instructions: [
        'Create executive summary with catalog overview',
        'Document platform selection rationale (if applicable)',
        'Provide detailed architecture documentation',
        'Document all configured data source connectors',
        'Create metadata management guide',
        'Document lineage tracking capabilities',
        'Create business glossary user guide',
        'Document search and discovery features',
        'Provide security and access control documentation',
        'Create deployment and operations guide',
        'Document integrations with BI and orchestration tools',
        'Create user onboarding and training materials',
        'Document best practices for catalog adoption',
        'Create administrator guide',
        'Provide troubleshooting and FAQ',
        'Create implementation roadmap with phases',
        'Format as professional Markdown documentation'
      ],
      outputFormat: 'JSON with documentation paths, implementation plan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationPath', 'implementationPlan', 'artifacts'],
      properties: {
        documentationPath: { type: 'string' },
        implementationPlan: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  duration: { type: 'string' },
                  tasks: { type: 'array' },
                  deliverables: { type: 'array' }
                }
              }
            },
            estimatedTimeline: { type: 'string' }
          }
        },
        keyDocuments: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-catalog', 'documentation', 'technical-writing']
}));

/**
 * Task 15: Implementation Checklist
 */
export const implementationChecklistTask = defineTask('implementation-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate implementation checklist',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'technical project manager',
      task: 'Create detailed implementation checklist for data catalog setup',
      context: args,
      instructions: [
        'Break down implementation into actionable tasks',
        'Organize tasks by phase and dependency',
        'Assign effort estimates to each task',
        'Identify critical path items',
        'Include verification/testing steps',
        'Add rollback procedures for each phase',
        'Create pre-requisites checklist',
        'Document success criteria for each phase',
        'Include stakeholder approval gates',
        'Add communication and training tasks',
        'Create post-deployment validation checklist',
        'Include adoption and change management tasks',
        'Format as interactive Markdown checklist'
      ],
      outputFormat: 'JSON with implementation checklist, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['checklist', 'artifacts'],
      properties: {
        checklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              tasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    task: { type: 'string' },
                    effort: { type: 'string' },
                    dependencies: { type: 'array' },
                    successCriteria: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        criticalPath: { type: 'array', items: { type: 'string' } },
        estimatedDuration: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-catalog', 'implementation', 'checklist']
}));
