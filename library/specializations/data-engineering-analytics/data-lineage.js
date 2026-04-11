/**
 * @process data-engineering-analytics/data-lineage
 * @description Implement comprehensive data lineage mapping with automated extraction (OpenLineage/SQLLineage), graph visualization, impact analysis, and documentation
 * @inputs { dataSources: array, lineageTool?: string, graphFormat?: string, includeColumnLineage?: boolean, impactAnalysisEnabled?: boolean, visualizationTool?: string }
 * @outputs { success: boolean, lineageGraph: object, entities: object, relationships: array, impactAnalysis: object, documentation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('data-engineering-analytics/data-lineage', {
 *   dataSources: [
 *     { type: 'database', connection: 'postgres://...', schemas: ['public', 'analytics'] },
 *     { type: 'dbt', projectPath: '/path/to/dbt/project' },
 *     { type: 'airflow', dagFolder: '/path/to/dags' },
 *     { type: 'spark', jobsPath: '/path/to/spark/jobs' }
 *   ],
 *   lineageTool: 'openlineage',
 *   graphFormat: 'neo4j',
 *   includeColumnLineage: true,
 *   impactAnalysisEnabled: true,
 *   visualizationTool: 'graphviz',
 *   outputFormat: 'interactive-html'
 * });
 *
 * @references
 * - OpenLineage: https://openlineage.io/
 * - SQLLineage: https://github.com/reata/sqllineage
 * - Apache Atlas: https://atlas.apache.org/
 * - Amundsen: https://www.amundsen.io/
 * - DataHub: https://datahubproject.io/
 * - dbt Lineage: https://docs.getdbt.com/docs/collaborate/data-lineage
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataSources = [],
    lineageTool = 'openlineage',
    graphFormat = 'networkx',
    includeColumnLineage = true,
    impactAnalysisEnabled = true,
    visualizationTool = 'graphviz',
    outputFormat = 'interactive-html',
    outputDir = 'data-lineage-output',
    lineageScope = 'full',
    metadataStore = null,
    autoRefresh = false,
    refreshInterval = '1h'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const relationships = [];

  ctx.log('info', `Starting Data Lineage Mapping with ${dataSources.length} data sources`);
  ctx.log('info', `Lineage Tool: ${lineageTool}, Graph Format: ${graphFormat}`);
  ctx.log('info', `Column Lineage: ${includeColumnLineage}, Impact Analysis: ${impactAnalysisEnabled}`);

  // ============================================================================
  // PHASE 1: DATA SOURCE DISCOVERY AND PROFILING
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovering and profiling data sources');

  const sourceDiscovery = await ctx.task(dataSourceDiscoveryTask, {
    dataSources,
    lineageScope,
    outputDir
  });

  if (!sourceDiscovery.success || sourceDiscovery.discoveredSources.length === 0) {
    return {
      success: false,
      error: 'No data sources discovered for lineage mapping',
      details: sourceDiscovery,
      metadata: { processId: 'data-engineering-analytics/data-lineage', timestamp: startTime }
    };
  }

  artifacts.push(...sourceDiscovery.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: Discovered ${sourceDiscovery.discoveredSources.length} data sources with ${sourceDiscovery.totalEntities} entities (tables, views, models). Proceed with lineage extraction?`,
    title: 'Data Source Discovery Complete',
    context: {
      runId: ctx.runId,
      sourcesDiscovered: sourceDiscovery.discoveredSources.length,
      totalEntities: sourceDiscovery.totalEntities,
      sourceTypes: sourceDiscovery.sourceTypes,
      entityBreakdown: sourceDiscovery.entityBreakdown,
      files: sourceDiscovery.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 2: LINEAGE EXTRACTION (Table-Level)
  // ============================================================================

  ctx.log('info', 'Phase 2: Extracting table-level lineage from all sources');

  const lineageExtractionTasks = sourceDiscovery.discoveredSources.map(source =>
    () => ctx.task(lineageExtractionTask, {
      source,
      lineageTool,
      includeColumnLineage: false,
      outputDir
    })
  );

  const tableLineageResults = await ctx.parallel.all(lineageExtractionTasks);

  for (const result of tableLineageResults) {
    relationships.push(...result.relationships);
    artifacts.push(...result.artifacts);
  }

  const totalTableRelationships = relationships.length;

  ctx.log('info', `Extracted ${totalTableRelationships} table-level lineage relationships`);

  // ============================================================================
  // PHASE 3: COLUMN-LEVEL LINEAGE EXTRACTION (if enabled)
  // ============================================================================

  let columnLineageResults = null;
  if (includeColumnLineage) {
    ctx.log('info', 'Phase 3: Extracting column-level lineage');

    const columnLineageTasks = sourceDiscovery.discoveredSources.map(source =>
      () => ctx.task(columnLineageExtractionTask, {
        source,
        lineageTool,
        outputDir
      })
    );

    columnLineageResults = await ctx.parallel.all(columnLineageTasks);

    for (const result of columnLineageResults) {
      relationships.push(...result.columnRelationships);
      artifacts.push(...result.artifacts);
    }

    ctx.log('info', `Extracted ${columnLineageResults.reduce((sum, r) => sum + r.columnRelationships.length, 0)} column-level relationships`);
  }

  await ctx.breakpoint({
    question: `Phase 3 Complete: Extracted ${totalTableRelationships} table-level and ${includeColumnLineage ? columnLineageResults.reduce((sum, r) => sum + r.columnRelationships.length, 0) : 0} column-level lineage relationships. Review extraction results?`,
    title: 'Lineage Extraction Complete',
    context: {
      runId: ctx.runId,
      tableRelationships: totalTableRelationships,
      columnRelationships: includeColumnLineage ? columnLineageResults.reduce((sum, r) => sum + r.columnRelationships.length, 0) : 0,
      relationshipTypes: [...new Set(relationships.map(r => r.type))],
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 4: LINEAGE GRAPH CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Building comprehensive lineage graph');

  const graphConstruction = await ctx.task(graphConstructionTask, {
    sourceDiscovery,
    relationships,
    graphFormat,
    includeColumnLineage,
    outputDir
  });

  artifacts.push(...graphConstruction.artifacts);

  const lineageGraph = graphConstruction.graph;

  // ============================================================================
  // PHASE 5: GRAPH ENRICHMENT AND METADATA
  // ============================================================================

  ctx.log('info', 'Phase 5: Enriching lineage graph with metadata and context');

  const graphEnrichment = await ctx.task(graphEnrichmentTask, {
    lineageGraph,
    sourceDiscovery,
    relationships,
    metadataStore,
    outputDir
  });

  artifacts.push(...graphEnrichment.artifacts);

  // ============================================================================
  // PHASE 6: LINEAGE VALIDATION AND QUALITY CHECKS
  // ============================================================================

  ctx.log('info', 'Phase 6: Validating lineage graph and performing quality checks');

  const lineageValidation = await ctx.task(lineageValidationTask, {
    lineageGraph: graphEnrichment.enrichedGraph,
    relationships,
    sourceDiscovery,
    outputDir
  });

  artifacts.push(...lineageValidation.artifacts);

  if (lineageValidation.issues.length > 0) {
    ctx.log('warn', `Found ${lineageValidation.issues.length} lineage quality issues`);
  }

  // ============================================================================
  // PHASE 7: IMPACT ANALYSIS (if enabled)
  // ============================================================================

  let impactAnalysisResults = null;
  if (impactAnalysisEnabled) {
    ctx.log('info', 'Phase 7: Performing impact analysis on lineage graph');

    impactAnalysisResults = await ctx.task(impactAnalysisTask, {
      lineageGraph: graphEnrichment.enrichedGraph,
      relationships,
      sourceDiscovery,
      outputDir
    });

    artifacts.push(...impactAnalysisResults.artifacts);

    await ctx.breakpoint({
      question: `Phase 7 Complete: Impact analysis generated for ${impactAnalysisResults.entitiesAnalyzed} entities. Found ${impactAnalysisResults.criticalPaths} critical data paths and ${impactAnalysisResults.highImpactEntities} high-impact entities. Review impact analysis?`,
      title: 'Impact Analysis Complete',
      context: {
        runId: ctx.runId,
        entitiesAnalyzed: impactAnalysisResults.entitiesAnalyzed,
        criticalPaths: impactAnalysisResults.criticalPaths,
        highImpactEntities: impactAnalysisResults.highImpactEntities,
        impactScores: impactAnalysisResults.topImpactScores,
        files: impactAnalysisResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: LINEAGE VISUALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating lineage visualizations');

  const visualization = await ctx.task(lineageVisualizationTask, {
    lineageGraph: graphEnrichment.enrichedGraph,
    relationships,
    visualizationTool,
    outputFormat,
    includeColumnLineage,
    impactAnalysisResults,
    outputDir
  });

  artifacts.push(...visualization.artifacts);

  // ============================================================================
  // PHASE 9: DATA FLOW ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 9: Analyzing data flows and transformation paths');

  const dataFlowAnalysis = await ctx.task(dataFlowAnalysisTask, {
    lineageGraph: graphEnrichment.enrichedGraph,
    relationships,
    sourceDiscovery,
    outputDir
  });

  artifacts.push(...dataFlowAnalysis.artifacts);

  // ============================================================================
  // PHASE 10: DEPENDENCY MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 10: Mapping upstream and downstream dependencies');

  const dependencyMapping = await ctx.task(dependencyMappingTask, {
    lineageGraph: graphEnrichment.enrichedGraph,
    relationships,
    sourceDiscovery,
    outputDir
  });

  artifacts.push(...dependencyMapping.artifacts);

  // ============================================================================
  // PHASE 11: LINEAGE DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating comprehensive lineage documentation');

  const documentation = await ctx.task(lineageDocumentationTask, {
    lineageGraph: graphEnrichment.enrichedGraph,
    sourceDiscovery,
    relationships,
    lineageValidation,
    impactAnalysisResults,
    dataFlowAnalysis,
    dependencyMapping,
    visualization,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 12: METADATA STORE INTEGRATION (if configured)
  // ============================================================================

  let metadataIntegration = null;
  if (metadataStore) {
    ctx.log('info', 'Phase 12: Integrating lineage with metadata store');

    metadataIntegration = await ctx.task(metadataStoreIntegrationTask, {
      lineageGraph: graphEnrichment.enrichedGraph,
      relationships,
      metadataStore,
      outputDir
    });

    artifacts.push(...metadataIntegration.artifacts);
  }

  // ============================================================================
  // PHASE 13: LINEAGE API AND QUERY INTERFACE
  // ============================================================================

  ctx.log('info', 'Phase 13: Setting up lineage query API and interface');

  const queryInterface = await ctx.task(lineageQueryInterfaceTask, {
    lineageGraph: graphEnrichment.enrichedGraph,
    relationships,
    graphFormat,
    outputDir
  });

  artifacts.push(...queryInterface.artifacts);

  // ============================================================================
  // PHASE 14: AUTO-REFRESH SETUP (if enabled)
  // ============================================================================

  let autoRefreshSetup = null;
  if (autoRefresh) {
    ctx.log('info', 'Phase 14: Configuring automatic lineage refresh');

    autoRefreshSetup = await ctx.task(autoRefreshSetupTask, {
      dataSources,
      lineageTool,
      refreshInterval,
      graphFormat,
      outputDir
    });

    artifacts.push(...autoRefreshSetup.artifacts);
  }

  // ============================================================================
  // PHASE 15: LINEAGE REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Generating final lineage analysis report');

  const lineageReport = await ctx.task(lineageReportGenerationTask, {
    sourceDiscovery,
    lineageGraph: graphEnrichment.enrichedGraph,
    relationships,
    lineageValidation,
    impactAnalysisResults,
    dataFlowAnalysis,
    dependencyMapping,
    visualization,
    queryInterface,
    outputDir
  });

  artifacts.push(...lineageReport.artifacts);

  // ============================================================================
  // FINAL BREAKPOINT: REVIEW AND APPROVAL
  // ============================================================================

  await ctx.breakpoint({
    question: `Data Lineage Mapping complete! Mapped ${sourceDiscovery.totalEntities} entities with ${relationships.length} relationships across ${sourceDiscovery.discoveredSources.length} sources. ${impactAnalysisEnabled ? `Impact analysis identified ${impactAnalysisResults.highImpactEntities} high-impact entities.` : ''} Review deliverables?`,
    title: 'Data Lineage Mapping Complete',
    context: {
      runId: ctx.runId,
      summary: {
        totalSources: sourceDiscovery.discoveredSources.length,
        totalEntities: sourceDiscovery.totalEntities,
        totalRelationships: relationships.length,
        tableRelationships: totalTableRelationships,
        columnRelationships: includeColumnLineage ? relationships.length - totalTableRelationships : 0,
        columnLineageEnabled: includeColumnLineage,
        impactAnalysisEnabled,
        validationScore: lineageValidation.validationScore,
        qualityIssues: lineageValidation.issues.length
      },
      visualization: {
        format: outputFormat,
        tool: visualizationTool,
        interactiveUrl: visualization.interactiveUrl,
        staticImages: visualization.staticImages
      },
      impactAnalysis: impactAnalysisEnabled ? {
        criticalPaths: impactAnalysisResults.criticalPaths,
        highImpactEntities: impactAnalysisResults.highImpactEntities,
        entitiesAnalyzed: impactAnalysisResults.entitiesAnalyzed
      } : null,
      documentation: {
        reportPath: lineageReport.reportPath,
        dataDictionary: documentation.dataDictionaryPath,
        apiDocs: queryInterface.apiDocsPath
      },
      files: [
        { path: lineageReport.reportPath, format: 'markdown', label: 'Lineage Report' },
        { path: visualization.mainVisualizationPath, format: 'html', label: 'Interactive Lineage Graph' },
        { path: documentation.dataDictionaryPath, format: 'markdown', label: 'Data Dictionary' },
        { path: queryInterface.apiDocsPath, format: 'markdown', label: 'Query API Documentation' },
        { path: `${outputDir}/lineage-graph.json`, format: 'json', label: 'Lineage Graph Data' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: lineageValidation.validationScore >= 70,
    lineageGraph: {
      format: graphFormat,
      nodes: graphEnrichment.enrichedGraph.nodeCount,
      edges: graphEnrichment.enrichedGraph.edgeCount,
      graphPath: graphConstruction.graphPath,
      metadata: graphEnrichment.metadata
    },
    entities: {
      total: sourceDiscovery.totalEntities,
      byType: sourceDiscovery.entityBreakdown,
      bySources: sourceDiscovery.discoveredSources.map(s => ({
        source: s.name,
        type: s.type,
        entityCount: s.entityCount
      }))
    },
    relationships: relationships.map(r => ({
      source: r.source,
      target: r.target,
      type: r.type,
      transformationType: r.transformationType,
      columnLevel: r.columnLevel || false
    })),
    columnLineage: includeColumnLineage ? {
      enabled: true,
      totalMappings: columnLineageResults.reduce((sum, r) => sum + r.columnRelationships.length, 0),
      coverage: columnLineageResults.reduce((sum, r) => sum + r.coveragePercentage, 0) / columnLineageResults.length
    } : { enabled: false },
    impactAnalysis: impactAnalysisEnabled ? {
      enabled: true,
      entitiesAnalyzed: impactAnalysisResults.entitiesAnalyzed,
      criticalPaths: impactAnalysisResults.criticalPaths,
      highImpactEntities: impactAnalysisResults.highImpactEntities,
      topImpactScores: impactAnalysisResults.topImpactScores,
      changeImpactMap: impactAnalysisResults.changeImpactMap
    } : { enabled: false },
    dataFlows: {
      totalFlows: dataFlowAnalysis.totalFlows,
      endToEndPaths: dataFlowAnalysis.endToEndPaths,
      transformationStages: dataFlowAnalysis.transformationStages,
      flowComplexity: dataFlowAnalysis.complexity
    },
    dependencies: {
      upstreamMap: dependencyMapping.upstreamMap,
      downstreamMap: dependencyMapping.downstreamMap,
      orphanedEntities: dependencyMapping.orphanedEntities,
      circularDependencies: dependencyMapping.circularDependencies
    },
    validation: {
      validationScore: lineageValidation.validationScore,
      passedChecks: lineageValidation.passedChecks,
      issues: lineageValidation.issues.map(i => ({
        severity: i.severity,
        type: i.type,
        description: i.description,
        affectedEntities: i.affectedEntities
      })),
      recommendations: lineageValidation.recommendations
    },
    visualization: {
      format: outputFormat,
      tool: visualizationTool,
      interactiveUrl: visualization.interactiveUrl,
      staticImages: visualization.staticImages,
      viewTypes: visualization.viewTypes
    },
    documentation: {
      reportPath: lineageReport.reportPath,
      dataDictionary: documentation.dataDictionaryPath,
      flowDiagrams: documentation.flowDiagrams,
      apiDocumentation: queryInterface.apiDocsPath,
      coverage: documentation.documentationCoverage
    },
    queryInterface: {
      enabled: true,
      apiEndpoint: queryInterface.apiEndpoint,
      supportedQueries: queryInterface.supportedQueries,
      exampleQueries: queryInterface.exampleQueries
    },
    metadataIntegration: metadataStore ? {
      enabled: true,
      store: metadataStore.type,
      synced: metadataIntegration.synced,
      syncedEntities: metadataIntegration.syncedEntities
    } : { enabled: false },
    autoRefresh: autoRefresh ? {
      enabled: true,
      interval: refreshInterval,
      schedulerType: autoRefreshSetup.schedulerType,
      nextRefresh: autoRefreshSetup.nextRefresh
    } : { enabled: false },
    artifacts,
    metadata: {
      processId: 'data-engineering-analytics/data-lineage',
      timestamp: startTime,
      duration,
      lineageTool,
      graphFormat,
      includeColumnLineage,
      impactAnalysisEnabled,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Task 1: Data Source Discovery
 */
export const dataSourceDiscoveryTask = defineTask('data-source-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover and profile data sources for lineage',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data lineage engineer specializing in source discovery and cataloging',
      task: 'Discover, profile, and catalog data sources for lineage mapping',
      context: {
        dataSources: args.dataSources,
        lineageScope: args.lineageScope,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each data source, establish connectivity and validate access',
        '2. Discover all entities (tables, views, materialized views, models, datasets)',
        '3. Extract metadata: schema names, table names, column definitions',
        '4. Identify data source types (database, dbt, Airflow, Spark, data warehouse)',
        '5. Catalog entity types and categorize by purpose',
        '6. Detect transformation logic locations (SQL, dbt models, Spark jobs)',
        '7. Count total entities and create entity breakdown by type',
        '8. Identify lineage-relevant artifacts (SQL files, config files, DAGs)',
        '9. Generate source catalog with metadata',
        '10. Create source discovery report with statistics'
      ],
      outputFormat: 'JSON with success, discoveredSources, totalEntities, entityBreakdown, sourceTypes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'discoveredSources', 'totalEntities', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        discoveredSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              connection: { type: 'string' },
              entityCount: { type: 'number' },
              schemas: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalEntities: { type: 'number' },
        entityBreakdown: {
          type: 'object',
          properties: {
            tables: { type: 'number' },
            views: { type: 'number' },
            materializedViews: { type: 'number' },
            models: { type: 'number' }
          }
        },
        sourceTypes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-lineage', 'discovery', 'cataloging']
}));

/**
 * Task 2: Lineage Extraction (Table-Level)
 */
export const lineageExtractionTask = defineTask('lineage-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Extract table-level lineage from ${args.source.name}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'lineage extraction specialist with expertise in SQL parsing and metadata analysis',
      task: 'Extract table-level lineage relationships from data source',
      context: {
        source: args.source,
        lineageTool: args.lineageTool,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Use appropriate lineage extraction method based on source type',
        '2. For SQL: Parse CREATE VIEW, INSERT, UPDATE, MERGE statements using SQLLineage',
        '3. For dbt: Extract lineage from ref() and source() functions in models',
        '4. For Airflow: Parse DAG definitions and task dependencies',
        '5. For Spark: Analyze DataFrame transformations and write operations',
        '6. For OpenLineage: Collect lineage events from instrumented pipelines',
        '7. Identify source-to-target relationships for each entity',
        '8. Capture transformation types (SELECT, JOIN, UNION, AGGREGATE, etc.)',
        '9. Extract metadata: query text, transformation logic, dependencies',
        '10. Deduplicate and normalize lineage relationships',
        '11. Validate extracted lineage for completeness',
        '12. Save lineage relationships with metadata'
      ],
      outputFormat: 'JSON with relationships, sourceEntity, transformations, metadata, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['relationships', 'extractedCount', 'artifacts'],
      properties: {
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              target: { type: 'string' },
              type: { type: 'string' },
              transformationType: { type: 'string' },
              queryText: { type: 'string' },
              metadata: { type: 'object' }
            }
          }
        },
        extractedCount: { type: 'number' },
        sourceEntity: { type: 'string' },
        extractionMethod: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-lineage', 'extraction', 'table-level']
}));

/**
 * Task 3: Column-Level Lineage Extraction
 */
export const columnLineageExtractionTask = defineTask('column-lineage-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Extract column-level lineage from ${args.source.name}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'column lineage specialist with SQL AST parsing expertise',
      task: 'Extract fine-grained column-level lineage mappings',
      context: {
        source: args.source,
        lineageTool: args.lineageTool,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Parse SQL SELECT statements to map source columns to target columns',
        '2. Identify column transformations (CAST, CONCAT, CASE, calculations)',
        '3. Track column aliases and renaming',
        '4. Map columns through JOIN operations',
        '5. Track aggregate function sources (SUM, AVG, COUNT, etc.)',
        '6. Identify derived columns and their source columns',
        '7. Handle complex expressions and nested queries',
        '8. Extract column lineage from dbt models and macros',
        '9. Map column flows through intermediate transformations',
        '10. Calculate column lineage coverage percentage',
        '11. Validate column-level mappings for accuracy',
        '12. Generate column lineage relationship graph'
      ],
      outputFormat: 'JSON with columnRelationships, coveragePercentage, transformations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['columnRelationships', 'coveragePercentage', 'artifacts'],
      properties: {
        columnRelationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceTable: { type: 'string' },
              sourceColumn: { type: 'string' },
              targetTable: { type: 'string' },
              targetColumn: { type: 'string' },
              transformationType: { type: 'string' },
              expression: { type: 'string' },
              columnLevel: { type: 'boolean' }
            }
          }
        },
        coveragePercentage: { type: 'number' },
        totalColumnMappings: { type: 'number' },
        unmappedColumns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-lineage', 'column-level', 'extraction']
}));

/**
 * Task 4: Graph Construction
 */
export const graphConstructionTask = defineTask('graph-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build lineage graph from extracted relationships',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'graph database engineer specializing in lineage graphs',
      task: 'Construct comprehensive lineage graph from relationships',
      context: {
        sourceDiscovery: args.sourceDiscovery,
        relationships: args.relationships,
        graphFormat: args.graphFormat,
        includeColumnLineage: args.includeColumnLineage,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Initialize graph structure based on format (NetworkX, Neo4j, TinkerPop)',
        '2. Create nodes for all entities (tables, views, models, columns)',
        '3. Add node properties: name, type, source, schema, metadata',
        '4. Create edges from lineage relationships',
        '5. Add edge properties: transformation type, query text, confidence',
        '6. Build hierarchical structure (column nodes under table nodes)',
        '7. Add relationship directionality (upstream/downstream)',
        '8. Calculate graph statistics (node count, edge count, density)',
        '9. Identify connected components and isolated subgraphs',
        '10. Validate graph integrity (no orphan edges, valid node references)',
        '11. Export graph in specified format (JSON, GraphML, Cypher)',
        '12. Generate graph metadata and summary statistics'
      ],
      outputFormat: 'JSON with graph, nodeCount, edgeCount, graphPath, statistics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['graph', 'nodeCount', 'edgeCount', 'graphPath', 'artifacts'],
      properties: {
        graph: {
          type: 'object',
          properties: {
            nodes: { type: 'array' },
            edges: { type: 'array' },
            metadata: { type: 'object' }
          }
        },
        nodeCount: { type: 'number' },
        edgeCount: { type: 'number' },
        graphPath: { type: 'string' },
        statistics: {
          type: 'object',
          properties: {
            density: { type: 'number' },
            connectedComponents: { type: 'number' },
            averageDegree: { type: 'number' }
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
  labels: ['data-lineage', 'graph', 'construction']
}));

/**
 * Task 5: Graph Enrichment
 */
export const graphEnrichmentTask = defineTask('graph-enrichment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Enrich lineage graph with metadata and context',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'metadata engineer specializing in data cataloging',
      task: 'Enrich lineage graph with metadata, business context, and data quality information',
      context: {
        lineageGraph: args.lineageGraph,
        sourceDiscovery: args.sourceDiscovery,
        relationships: args.relationships,
        metadataStore: args.metadataStore,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Add table metadata: row counts, size, last modified, owner',
        '2. Add column metadata: data types, constraints, nullability',
        '3. Enrich with business context: descriptions, glossary terms, tags',
        '4. Add data quality scores and freshness information',
        '5. Include usage statistics: query frequency, users, dashboards',
        '6. Add data classification: PII, sensitive data, retention policies',
        '7. Include SLA information and criticality scores',
        '8. Add transformation complexity metrics',
        '9. Enrich from external metadata store if configured',
        '10. Calculate entity importance scores based on downstream impact',
        '11. Add temporal information: refresh schedules, latency',
        '12. Generate enriched graph with complete metadata'
      ],
      outputFormat: 'JSON with enrichedGraph, enrichmentCoverage, metadata, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['enrichedGraph', 'enrichmentCoverage', 'metadata', 'artifacts'],
      properties: {
        enrichedGraph: {
          type: 'object',
          properties: {
            nodeCount: { type: 'number' },
            edgeCount: { type: 'number' },
            enrichedNodes: { type: 'number' },
            metadata: { type: 'object' }
          }
        },
        enrichmentCoverage: { type: 'number' },
        metadata: {
          type: 'object',
          properties: {
            businessContext: { type: 'number' },
            dataQuality: { type: 'number' },
            usageStats: { type: 'number' }
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
  labels: ['data-lineage', 'enrichment', 'metadata']
}));

/**
 * Task 6: Lineage Validation
 */
export const lineageValidationTask = defineTask('lineage-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate lineage graph quality and completeness',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data quality engineer specializing in lineage validation',
      task: 'Validate lineage graph for quality, completeness, and accuracy',
      context: {
        lineageGraph: args.lineageGraph,
        relationships: args.relationships,
        sourceDiscovery: args.sourceDiscovery,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Check for orphaned nodes (no incoming or outgoing edges)',
        '2. Validate relationship consistency (all referenced nodes exist)',
        '3. Detect circular dependencies and infinite loops',
        '4. Verify column lineage completeness',
        '5. Check for broken lineage paths',
        '6. Validate transformation logic consistency',
        '7. Identify missing or incomplete metadata',
        '8. Check for duplicate relationships',
        '9. Validate entity naming conventions',
        '10. Assess lineage coverage percentage',
        '11. Generate quality score (0-100)',
        '12. Provide remediation recommendations for issues'
      ],
      outputFormat: 'JSON with validationScore, passedChecks, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'passedChecks', 'issues', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        passedChecks: { type: 'array', items: { type: 'string' } },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              affectedEntities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        coverageMetrics: {
          type: 'object',
          properties: {
            entityCoverage: { type: 'number' },
            relationshipCoverage: { type: 'number' },
            metadataCoverage: { type: 'number' }
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
  labels: ['data-lineage', 'validation', 'quality']
}));

/**
 * Task 7: Impact Analysis
 */
export const impactAnalysisTask = defineTask('impact-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform impact analysis on lineage graph',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'impact analysis specialist with graph algorithms expertise',
      task: 'Analyze lineage graph to determine change impact and entity criticality',
      context: {
        lineageGraph: args.lineageGraph,
        relationships: args.relationships,
        sourceDiscovery: args.sourceDiscovery,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate downstream impact for each entity (BFS traversal)',
        '2. Calculate upstream dependencies for each entity',
        '3. Identify critical data paths (most dependencies)',
        '4. Compute entity impact scores using PageRank algorithm',
        '5. Identify high-impact entities (affect many downstream consumers)',
        '6. Detect bottleneck entities (many paths converge)',
        '7. Calculate blast radius for potential changes',
        '8. Identify entities with no downstream consumers (potential for deprecation)',
        '9. Map change propagation paths',
        '10. Create what-if analysis scenarios',
        '11. Generate impact analysis report for top entities',
        '12. Provide recommendations for managing high-impact entities'
      ],
      outputFormat: 'JSON with entitiesAnalyzed, criticalPaths, highImpactEntities, topImpactScores, changeImpactMap, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['entitiesAnalyzed', 'criticalPaths', 'highImpactEntities', 'artifacts'],
      properties: {
        entitiesAnalyzed: { type: 'number' },
        criticalPaths: { type: 'number' },
        highImpactEntities: { type: 'number' },
        topImpactScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              entity: { type: 'string' },
              impactScore: { type: 'number' },
              downstreamCount: { type: 'number' },
              upstreamCount: { type: 'number' }
            }
          }
        },
        changeImpactMap: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              directImpact: { type: 'number' },
              indirectImpact: { type: 'number' },
              totalImpact: { type: 'number' },
              affectedEntities: { type: 'array', items: { type: 'string' } }
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
  labels: ['data-lineage', 'impact-analysis', 'graph-algorithms']
}));

/**
 * Task 8: Lineage Visualization
 */
export const lineageVisualizationTask = defineTask('lineage-visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate lineage visualizations',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data visualization specialist with graph visualization expertise',
      task: 'Create interactive and static lineage visualizations',
      context: {
        lineageGraph: args.lineageGraph,
        relationships: args.relationships,
        visualizationTool: args.visualizationTool,
        outputFormat: args.outputFormat,
        includeColumnLineage: args.includeColumnLineage,
        impactAnalysisResults: args.impactAnalysisResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate interactive HTML lineage graph using D3.js or vis.js',
        '2. Create hierarchical layout with proper spacing',
        '3. Apply color coding by entity type and criticality',
        '4. Add interactive features: zoom, pan, node selection, filtering',
        '5. Create node tooltips with metadata',
        '6. Generate static visualizations using Graphviz (PNG, SVG)',
        '7. Create focused views: entity-centric, domain-specific',
        '8. Generate column-level lineage diagrams if enabled',
        '9. Create impact analysis visualizations (heat maps)',
        '10. Add data flow animations',
        '11. Generate printable reports with diagrams',
        '12. Create embeddable visualization components'
      ],
      outputFormat: 'JSON with interactiveUrl, staticImages, mainVisualizationPath, viewTypes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interactiveUrl', 'mainVisualizationPath', 'viewTypes', 'artifacts'],
      properties: {
        interactiveUrl: { type: 'string' },
        mainVisualizationPath: { type: 'string' },
        staticImages: { type: 'array', items: { type: 'string' } },
        viewTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        interactive: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-lineage', 'visualization', 'interactive']
}));

/**
 * Task 9: Data Flow Analysis
 */
export const dataFlowAnalysisTask = defineTask('data-flow-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze data flows and transformation paths',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data flow analyst specializing in pipeline analysis',
      task: 'Analyze end-to-end data flows and transformation sequences',
      context: {
        lineageGraph: args.lineageGraph,
        relationships: args.relationships,
        sourceDiscovery: args.sourceDiscovery,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all source systems (data entry points)',
        '2. Identify all target systems (final destinations)',
        '3. Trace end-to-end paths from sources to targets',
        '4. Map transformation stages in each flow',
        '5. Calculate flow complexity (number of transformations)',
        '6. Identify common transformation patterns',
        '7. Detect data flow bottlenecks',
        '8. Map data freshness and latency through flows',
        '9. Identify parallel vs sequential flows',
        '10. Calculate flow efficiency metrics',
        '11. Generate flow diagrams for critical paths',
        '12. Document data flow architecture'
      ],
      outputFormat: 'JSON with totalFlows, endToEndPaths, transformationStages, complexity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalFlows', 'endToEndPaths', 'transformationStages', 'artifacts'],
      properties: {
        totalFlows: { type: 'number' },
        endToEndPaths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              target: { type: 'string' },
              stages: { type: 'number' },
              complexity: { type: 'string' }
            }
          }
        },
        transformationStages: {
          type: 'object',
          properties: {
            staging: { type: 'number' },
            intermediate: { type: 'number' },
            final: { type: 'number' }
          }
        },
        complexity: {
          type: 'object',
          properties: {
            simple: { type: 'number' },
            moderate: { type: 'number' },
            complex: { type: 'number' }
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
  labels: ['data-lineage', 'data-flow', 'analysis']
}));

/**
 * Task 10: Dependency Mapping
 */
export const dependencyMappingTask = defineTask('dependency-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map upstream and downstream dependencies',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'dependency analysis specialist',
      task: 'Create comprehensive upstream and downstream dependency maps',
      context: {
        lineageGraph: args.lineageGraph,
        relationships: args.relationships,
        sourceDiscovery: args.sourceDiscovery,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each entity, identify all upstream dependencies (sources)',
        '2. For each entity, identify all downstream dependents (consumers)',
        '3. Calculate dependency depth (levels of upstream/downstream)',
        '4. Create dependency maps with counts',
        '5. Identify orphaned entities (no dependencies)',
        '6. Detect circular dependencies',
        '7. Calculate fan-in (number of sources) and fan-out (number of targets)',
        '8. Identify tightly coupled entities',
        '9. Map critical dependency chains',
        '10. Generate dependency matrices',
        '11. Create dependency visualization graphs',
        '12. Document dependency architecture patterns'
      ],
      outputFormat: 'JSON with upstreamMap, downstreamMap, orphanedEntities, circularDependencies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['upstreamMap', 'downstreamMap', 'artifacts'],
      properties: {
        upstreamMap: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              directUpstream: { type: 'array', items: { type: 'string' } },
              totalUpstream: { type: 'number' },
              depth: { type: 'number' }
            }
          }
        },
        downstreamMap: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              directDownstream: { type: 'array', items: { type: 'string' } },
              totalDownstream: { type: 'number' },
              depth: { type: 'number' }
            }
          }
        },
        orphanedEntities: { type: 'array', items: { type: 'string' } },
        circularDependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cycle: { type: 'array', items: { type: 'string' } },
              length: { type: 'number' }
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
  labels: ['data-lineage', 'dependencies', 'mapping']
}));

/**
 * Task 11: Lineage Documentation
 */
export const lineageDocumentationTask = defineTask('lineage-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive lineage documentation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'technical writer specializing in data documentation',
      task: 'Create comprehensive lineage documentation and data dictionary',
      context: {
        lineageGraph: args.lineageGraph,
        sourceDiscovery: args.sourceDiscovery,
        relationships: args.relationships,
        lineageValidation: args.lineageValidation,
        impactAnalysisResults: args.impactAnalysisResults,
        dataFlowAnalysis: args.dataFlowAnalysis,
        dependencyMapping: args.dependencyMapping,
        visualization: args.visualization,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary of lineage coverage',
        '2. Document all entities with descriptions and metadata',
        '3. Create data dictionary with table and column definitions',
        '4. Document transformation logic for key flows',
        '5. Create lineage diagrams for critical data paths',
        '6. Document impact analysis findings',
        '7. Create dependency documentation',
        '8. Document data flow architecture',
        '9. Include validation results and quality metrics',
        '10. Add usage guidelines and query examples',
        '11. Create troubleshooting guide',
        '12. Generate comprehensive markdown documentation'
      ],
      outputFormat: 'JSON with dataDictionaryPath, flowDiagrams, documentationCoverage, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dataDictionaryPath', 'documentationCoverage', 'artifacts'],
      properties: {
        dataDictionaryPath: { type: 'string' },
        flowDiagrams: { type: 'array', items: { type: 'string' } },
        documentationCoverage: { type: 'number' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              path: { type: 'string' }
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
  labels: ['data-lineage', 'documentation', 'data-dictionary']
}));

/**
 * Task 12: Metadata Store Integration
 */
export const metadataStoreIntegrationTask = defineTask('metadata-store-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate lineage with metadata store',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'metadata integration engineer',
      task: 'Sync lineage data with external metadata store',
      context: {
        lineageGraph: args.lineageGraph,
        relationships: args.relationships,
        metadataStore: args.metadataStore,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Connect to metadata store (Apache Atlas, DataHub, Amundsen)',
        '2. Map lineage entities to metadata store entities',
        '3. Sync entity metadata and properties',
        '4. Push lineage relationships to store',
        '5. Update entity classifications and tags',
        '6. Sync business glossary terms',
        '7. Update data quality metrics',
        '8. Push impact analysis results',
        '9. Validate sync completeness',
        '10. Handle sync conflicts and errors',
        '11. Configure bi-directional sync if needed',
        '12. Generate sync report and audit log'
      ],
      outputFormat: 'JSON with synced, syncedEntities, syncedRelationships, conflicts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['synced', 'syncedEntities', 'artifacts'],
      properties: {
        synced: { type: 'boolean' },
        syncedEntities: { type: 'number' },
        syncedRelationships: { type: 'number' },
        conflicts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              entity: { type: 'string' },
              issue: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        syncTimestamp: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-lineage', 'metadata-store', 'integration']
}));

/**
 * Task 13: Lineage Query Interface
 */
export const lineageQueryInterfaceTask = defineTask('lineage-query-interface', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup lineage query API and interface',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API developer specializing in graph query interfaces',
      task: 'Create query API for lineage exploration and analysis',
      context: {
        lineageGraph: args.lineageGraph,
        relationships: args.relationships,
        graphFormat: args.graphFormat,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design REST API for lineage queries',
        '2. Implement query endpoints: get upstream, get downstream, find path',
        '3. Create search functionality (entity search, full-text)',
        '4. Implement filtering by entity type, source, tags',
        '5. Add pagination and result limits',
        '6. Create impact analysis query endpoint',
        '7. Implement column lineage query if available',
        '8. Add query performance optimization',
        '9. Generate OpenAPI/Swagger documentation',
        '10. Create example queries and use cases',
        '11. Implement query caching for performance',
        '12. Create client libraries or code examples'
      ],
      outputFormat: 'JSON with apiEndpoint, supportedQueries, exampleQueries, apiDocsPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['apiEndpoint', 'supportedQueries', 'apiDocsPath', 'artifacts'],
      properties: {
        apiEndpoint: { type: 'string' },
        supportedQueries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              endpoint: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        exampleQueries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              query: { type: 'string' },
              response: { type: 'object' }
            }
          }
        },
        apiDocsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-lineage', 'api', 'query-interface']
}));

/**
 * Task 14: Auto-Refresh Setup
 */
export const autoRefreshSetupTask = defineTask('auto-refresh-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure automatic lineage refresh',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'automation engineer specializing in data pipeline orchestration',
      task: 'Setup automated lineage refresh and synchronization',
      context: {
        dataSources: args.dataSources,
        lineageTool: args.lineageTool,
        refreshInterval: args.refreshInterval,
        graphFormat: args.graphFormat,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design refresh workflow and scheduling strategy',
        '2. Configure scheduler (Airflow, cron, dbt Cloud)',
        '3. Create incremental refresh logic (detect changes)',
        '4. Implement full refresh fallback',
        '5. Add error handling and retry logic',
        '6. Configure notifications for refresh failures',
        '7. Implement refresh validation checks',
        '8. Add lineage versioning and history tracking',
        '9. Configure refresh monitoring and alerts',
        '10. Create refresh logs and audit trail',
        '11. Document refresh process and troubleshooting',
        '12. Generate scheduler configuration files'
      ],
      outputFormat: 'JSON with schedulerType, refreshSchedule, nextRefresh, configuration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schedulerType', 'refreshSchedule', 'nextRefresh', 'artifacts'],
      properties: {
        schedulerType: { type: 'string' },
        refreshSchedule: { type: 'string' },
        nextRefresh: { type: 'string' },
        configuration: {
          type: 'object',
          properties: {
            incremental: { type: 'boolean' },
            retryAttempts: { type: 'number' },
            notificationChannels: { type: 'array', items: { type: 'string' } }
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
  labels: ['data-lineage', 'automation', 'refresh']
}));

/**
 * Task 15: Lineage Report Generation
 */
export const lineageReportGenerationTask = defineTask('lineage-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate final lineage analysis report',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data analyst and technical writer',
      task: 'Generate comprehensive lineage analysis report for stakeholders',
      context: {
        sourceDiscovery: args.sourceDiscovery,
        lineageGraph: args.lineageGraph,
        relationships: args.relationships,
        lineageValidation: args.lineageValidation,
        impactAnalysisResults: args.impactAnalysisResults,
        dataFlowAnalysis: args.dataFlowAnalysis,
        dependencyMapping: args.dependencyMapping,
        visualization: args.visualization,
        queryInterface: args.queryInterface,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary with key findings',
        '2. Document lineage coverage and completeness',
        '3. Present entity and relationship statistics',
        '4. Include impact analysis highlights',
        '5. Document critical data paths and flows',
        '6. Present validation results and quality scores',
        '7. Include visualization screenshots and links',
        '8. Document high-impact entities and dependencies',
        '9. Add recommendations for lineage improvements',
        '10. Include API usage guide and examples',
        '11. Document known limitations and gaps',
        '12. Create actionable next steps'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyFindings, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: {
          type: 'array',
          items: { type: 'string' }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string' },
              recommendation: { type: 'string' },
              expectedImpact: { type: 'string' }
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
  labels: ['data-lineage', 'reporting', 'documentation']
}));
