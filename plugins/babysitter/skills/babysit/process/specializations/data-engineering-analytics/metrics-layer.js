/**
 * @process specializations/data-engineering-analytics/metrics-layer
 * @description Metrics Layer Implementation - Comprehensive process for designing and implementing a semantic metrics layer
 * to centralize business logic, standardize metric definitions, and provide a consistent interface for analytics consumption.
 * Supports dbt metrics, Cube.js, Looker, and custom metric stores with version control, documentation, and governance.
 * @inputs { projectName: string, metricsScope: string, platform?: string, dataWarehouse?: string, targetCoverage?: number }
 * @outputs { success: boolean, metricsCount: number, semanticModels: array, qualityScore: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/data-engineering-analytics/metrics-layer', {
 *   projectName: 'E-commerce Analytics',
 *   metricsScope: 'business-wide', // 'department', 'product', 'business-wide'
 *   platform: 'dbt', // 'dbt', 'cube.js', 'looker', 'custom'
 *   dataWarehouse: 'snowflake', // 'snowflake', 'bigquery', 'redshift', 'databricks'
 *   targetCoverage: 90,
 *   businessDomains: ['sales', 'marketing', 'product', 'finance'],
 *   existingMetrics: 45,
 *   governanceLevel: 'high', // 'basic', 'medium', 'high'
 *   versionControl: true,
 *   enableCaching: true,
 *   accessControl: 'role-based'
 * });
 *
 * @references
 * - The Headless BI Architecture: https://cube.dev/blog/headless-bi
 * - dbt Metrics Documentation: https://docs.getdbt.com/docs/build/metrics
 * - Looker LookML: https://cloud.google.com/looker/docs/what-is-lookml
 * - Semantic Layer Best Practices: https://www.getdbt.com/analytics-engineering/semantic-layer/
 * - Metric Store Architecture: https://www.thoughtworks.com/radar/techniques/metric-store
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    metricsScope = 'business-wide', // 'department', 'product', 'business-wide'
    platform = 'dbt', // 'dbt', 'cube.js', 'looker', 'custom'
    dataWarehouse = 'snowflake',
    targetCoverage = 85, // percentage of business metrics covered
    businessDomains = ['sales', 'marketing', 'product', 'finance'],
    existingMetrics = 0,
    governanceLevel = 'medium', // 'basic', 'medium', 'high'
    versionControl = true,
    enableCaching = true,
    accessControl = 'role-based', // 'none', 'role-based', 'attribute-based'
    outputDir = 'metrics-layer-output',
    includeLineage = true,
    enableTesting = true,
    documentationLevel = 'comprehensive', // 'basic', 'standard', 'comprehensive'
    refreshStrategy = 'scheduled' // 'real-time', 'scheduled', 'on-demand'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let qualityScore = 0;
  const implementations = [];
  const semanticModels = [];
  let metricsCount = 0;

  ctx.log('info', `Starting Metrics Layer Implementation for ${projectName}`);
  ctx.log('info', `Scope: ${metricsScope}, Platform: ${platform}, Warehouse: ${dataWarehouse}`);
  ctx.log('info', `Target Coverage: ${targetCoverage}%, Governance: ${governanceLevel}`);

  // ============================================================================
  // PHASE 1: METRICS DISCOVERY AND CATALOGING
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovering and cataloging business metrics');

  const discoveryResult = await ctx.task(discoverBusinessMetricsTask, {
    projectName,
    metricsScope,
    businessDomains,
    existingMetrics,
    dataWarehouse,
    outputDir
  });

  artifacts.push(...discoveryResult.artifacts);
  metricsCount = discoveryResult.metricsIdentified;

  ctx.log('info', `Discovery complete - Identified ${metricsCount} metrics across ${discoveryResult.domains.length} domains`);
  ctx.log('info', `Metric types: ${discoveryResult.metricTypes.derived} derived, ${discoveryResult.metricTypes.base} base, ${discoveryResult.metricTypes.compound} compound`);

  // Quality Gate: Metrics catalog review
  await ctx.breakpoint({
    question: `Metrics discovery complete for ${projectName}. Identified ${metricsCount} metrics across ${discoveryResult.domains.length} business domains. Review metric catalog and business definitions?`,
    title: 'Metrics Catalog Review',
    context: {
      runId: ctx.runId,
      discovery: {
        totalMetrics: metricsCount,
        domains: discoveryResult.domains,
        metricTypes: discoveryResult.metricTypes,
        dimensions: discoveryResult.dimensions.length,
        conflicts: discoveryResult.conflicts.length,
        coverage: discoveryResult.estimatedCoverage
      },
      files: discoveryResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: SEMANTIC MODEL DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing semantic models and entity relationships');

  const semanticDesignResult = await ctx.task(designSemanticModelsTask, {
    projectName,
    metrics: discoveryResult.metrics,
    businessDomains,
    dataWarehouse,
    platform,
    includeLineage,
    outputDir
  });

  semanticModels.push(...semanticDesignResult.models);
  artifacts.push(...semanticDesignResult.artifacts);

  ctx.log('info', `Semantic design complete - ${semanticModels.length} models created with ${semanticDesignResult.entities.length} entities`);
  ctx.log('info', `Relationships mapped: ${semanticDesignResult.relationships.length}`);

  // Quality Gate: Semantic model review
  await ctx.breakpoint({
    question: `Semantic models designed. Created ${semanticModels.length} models with ${semanticDesignResult.entities.length} entities and ${semanticDesignResult.relationships.length} relationships. Review semantic layer architecture?`,
    title: 'Semantic Model Review',
    context: {
      runId: ctx.runId,
      semantic: {
        models: semanticModels.map(m => ({ name: m.name, entityCount: m.entities?.length || 0 })),
        entities: semanticDesignResult.entities.slice(0, 10),
        relationships: semanticDesignResult.relationships.slice(0, 15),
        hierarchies: semanticDesignResult.hierarchies
      },
      files: semanticDesignResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: METRIC DEFINITIONS AND BUSINESS LOGIC
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing metric definitions and business logic');

  const metricDefinitionsResult = await ctx.task(implementMetricDefinitionsTask, {
    projectName,
    platform,
    semanticModels,
    metrics: discoveryResult.metrics,
    dataWarehouse,
    enableCaching,
    refreshStrategy,
    outputDir
  });

  implementations.push({
    phase: 'Metric Definitions',
    result: metricDefinitionsResult
  });

  artifacts.push(...metricDefinitionsResult.artifacts);

  ctx.log('info', `Metric definitions implemented - ${metricDefinitionsResult.definitionsCreated} definitions`);
  ctx.log('info', `Business logic: ${metricDefinitionsResult.calculationLogic.length} calculations, ${metricDefinitionsResult.transformations.length} transformations`);

  // Quality Gate: Metric definitions review
  await ctx.breakpoint({
    question: `Metric definitions implemented using ${platform}. Created ${metricDefinitionsResult.definitionsCreated} definitions with business logic centralized. Review metric calculations and transformations?`,
    title: 'Metric Definitions Review',
    context: {
      runId: ctx.runId,
      definitions: {
        count: metricDefinitionsResult.definitionsCreated,
        platform: platform,
        calculations: metricDefinitionsResult.calculationLogic.length,
        transformations: metricDefinitionsResult.transformations.length,
        cachingEnabled: enableCaching,
        refreshStrategy: refreshStrategy,
        exampleMetrics: metricDefinitionsResult.exampleDefinitions.slice(0, 5)
      },
      files: metricDefinitionsResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: VERSION CONTROL AND CHANGE MANAGEMENT
  // ============================================================================

  if (versionControl) {
    ctx.log('info', 'Phase 4: Implementing version control and change management');

    const versionControlResult = await ctx.task(setupVersionControlTask, {
      projectName,
      platform,
      metricDefinitions: metricDefinitionsResult.definitions,
      semanticModels,
      governanceLevel,
      outputDir
    });

    implementations.push({
      phase: 'Version Control',
      result: versionControlResult
    });

    artifacts.push(...versionControlResult.artifacts);

    ctx.log('info', `Version control configured - Git repository initialized with ${versionControlResult.branches.length} branches`);
    ctx.log('info', `Change management: ${versionControlResult.workflows.length} workflows, ${versionControlResult.approvalGates.length} approval gates`);

    // Quality Gate: Version control review
    await ctx.breakpoint({
      question: `Version control and change management configured. Git repository initialized with branching strategy and ${versionControlResult.approvalGates.length} approval gates. Review version control setup?`,
      title: 'Version Control Review',
      context: {
        runId: ctx.runId,
        versionControl: {
          repositoryPath: versionControlResult.repositoryPath,
          branches: versionControlResult.branches,
          workflows: versionControlResult.workflows.map(w => w.name),
          approvalGates: versionControlResult.approvalGates,
          cicdIntegration: versionControlResult.cicdIntegration
        },
        files: versionControlResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: GOVERNANCE AND ACCESS CONTROL
  // ============================================================================

  if (accessControl !== 'none') {
    ctx.log('info', 'Phase 5: Implementing governance policies and access control');

    const governanceResult = await ctx.task(implementGovernanceTask, {
      projectName,
      platform,
      semanticModels,
      metrics: discoveryResult.metrics,
      accessControl,
      governanceLevel,
      businessDomains,
      outputDir
    });

    implementations.push({
      phase: 'Governance and Access Control',
      result: governanceResult
    });

    artifacts.push(...governanceResult.artifacts);

    ctx.log('info', `Governance implemented - ${governanceResult.policies.length} policies, ${governanceResult.roles.length} roles defined`);
    ctx.log('info', `Access control: ${governanceResult.permissions.length} permission rules configured`);

    // Quality Gate: Governance review
    await ctx.breakpoint({
      question: `Governance and access control implemented with ${governanceResult.policies.length} policies and ${governanceResult.roles.length} roles. Review governance framework and access permissions?`,
      title: 'Governance Review',
      context: {
        runId: ctx.runId,
        governance: {
          policies: governanceResult.policies.map(p => ({ name: p.name, type: p.type })),
          roles: governanceResult.roles,
          permissions: governanceResult.permissions.length,
          accessControl: accessControl,
          dataClassification: governanceResult.dataClassification,
          auditingEnabled: governanceResult.auditingEnabled
        },
        files: governanceResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: METRIC LINEAGE AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating metric lineage and comprehensive documentation');

  const documentationResult = await ctx.task(generateMetricDocumentationTask, {
    projectName,
    platform,
    semanticModels,
    metrics: discoveryResult.metrics,
    metricDefinitions: metricDefinitionsResult.definitions,
    includeLineage,
    documentationLevel,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);

  ctx.log('info', `Documentation generated - ${documentationResult.pages.length} documentation pages`);
  if (includeLineage) {
    ctx.log('info', `Lineage tracked: ${documentationResult.lineage.metricToTable} metric-to-table, ${documentationResult.lineage.metricToMetric} metric-to-metric dependencies`);
  }

  // Quality Gate: Documentation review
  await ctx.breakpoint({
    question: `Metric documentation generated with ${documentationResult.pages.length} pages${includeLineage ? ` and complete lineage tracking (${documentationResult.lineage.metricToTable} metric-to-table relationships)` : ''}. Review documentation completeness?`,
    title: 'Documentation Review',
    context: {
      runId: ctx.runId,
      documentation: {
        pages: documentationResult.pages.length,
        lineageTracked: includeLineage,
        lineageStats: includeLineage ? documentationResult.lineage : null,
        catalogUrl: documentationResult.catalogUrl,
        searchEnabled: documentationResult.searchEnabled,
        completeness: documentationResult.completeness
      },
      files: documentationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 7: METRIC TESTING AND VALIDATION
  // ============================================================================

  if (enableTesting) {
    ctx.log('info', 'Phase 7: Testing and validating metric definitions');

    const testingResult = await ctx.task(testMetricDefinitionsTask, {
      projectName,
      platform,
      metricDefinitions: metricDefinitionsResult.definitions,
      semanticModels,
      dataWarehouse,
      outputDir
    });

    implementations.push({
      phase: 'Metric Testing',
      result: testingResult
    });

    artifacts.push(...testingResult.artifacts);

    ctx.log('info', `Testing complete - ${testingResult.testsPassed}/${testingResult.testsRun} tests passed`);
    ctx.log('info', `Validation: ${testingResult.validationChecks.passed}/${testingResult.validationChecks.total} checks passed`);

    // Quality Gate: Testing results
    await ctx.breakpoint({
      question: `Metric testing complete. ${testingResult.testsPassed}/${testingResult.testsRun} tests passed, ${testingResult.validationChecks.passed}/${testingResult.validationChecks.total} validation checks passed. ${testingResult.testsFailed > 0 ? `Review and fix ${testingResult.testsFailed} failed tests?` : 'Proceed to deployment?'}`,
      title: 'Testing Results Review',
      context: {
        runId: ctx.runId,
        testing: {
          testsRun: testingResult.testsRun,
          testsPassed: testingResult.testsPassed,
          testsFailed: testingResult.testsFailed,
          validationChecks: testingResult.validationChecks,
          failedTests: testingResult.failedTests || [],
          coverage: testingResult.coverage
        },
        files: testingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: DEPLOYMENT AND INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Deploying metrics layer and integrating with BI tools');

  const deploymentResult = await ctx.task(deployMetricsLayerTask, {
    projectName,
    platform,
    dataWarehouse,
    semanticModels,
    metricDefinitions: metricDefinitionsResult.definitions,
    enableCaching,
    refreshStrategy,
    outputDir
  });

  implementations.push({
    phase: 'Deployment',
    result: deploymentResult
  });

  artifacts.push(...deploymentResult.artifacts);

  ctx.log('info', `Deployment complete - Metrics layer deployed to ${deploymentResult.environment}`);
  ctx.log('info', `Integrations: ${deploymentResult.integrations.length} BI tools connected`);

  // Quality Gate: Deployment verification
  await ctx.breakpoint({
    question: `Metrics layer deployed to ${deploymentResult.environment}. ${deploymentResult.integrations.length} BI tool integrations configured. Verify deployment and test integrations?`,
    title: 'Deployment Verification',
    context: {
      runId: ctx.runId,
      deployment: {
        environment: deploymentResult.environment,
        endpoint: deploymentResult.endpoint,
        integrations: deploymentResult.integrations.map(i => ({ tool: i.tool, status: i.status })),
        cacheStatus: deploymentResult.cacheStatus,
        healthCheck: deploymentResult.healthCheck,
        performance: deploymentResult.performance
      },
      files: deploymentResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 9: QUALITY VALIDATION AND FINAL ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Final quality validation and coverage assessment');

  const qualityResult = await ctx.task(validateMetricsLayerQualityTask, {
    projectName,
    metricsCount,
    semanticModels,
    implementations,
    targetCoverage,
    governanceLevel,
    documentationLevel,
    testingResults: enableTesting ? implementations.find(i => i.phase === 'Metric Testing')?.result : null,
    outputDir
  });

  qualityScore = qualityResult.score;
  artifacts.push(...qualityResult.artifacts);

  const coverage = qualityResult.coverage;
  const meetsTarget = coverage >= targetCoverage;

  ctx.log('info', `Quality assessment complete - Score: ${qualityScore}/100, Coverage: ${coverage}%`);
  ctx.log('info', `Completeness: Definitions ${qualityResult.completeness.definitions}%, Documentation ${qualityResult.completeness.documentation}%, Testing ${qualityResult.completeness.testing}%`);

  // Final Quality Gate
  await ctx.breakpoint({
    question: `Metrics layer implementation complete for ${projectName}. Quality score: ${qualityScore}/100, Coverage: ${coverage}% (target: ${targetCoverage}%). ${meetsTarget ? 'Target met!' : 'Below target.'} Review final results and sign off?`,
    title: 'Final Quality Assessment',
    context: {
      runId: ctx.runId,
      final: {
        qualityScore,
        coverage,
        targetCoverage,
        meetsTarget,
        metricsImplemented: metricsCount,
        semanticModelsCreated: semanticModels.length,
        completeness: qualityResult.completeness,
        recommendations: qualityResult.recommendations,
        nextSteps: qualityResult.nextSteps
      },
      files: qualityResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================

  const endTime = ctx.now();
  const duration = endTime - startTime;

  ctx.log('info', '='.repeat(80));
  ctx.log('info', 'METRICS LAYER IMPLEMENTATION COMPLETE');
  ctx.log('info', '='.repeat(80));
  ctx.log('info', `Project: ${projectName}`);
  ctx.log('info', `Platform: ${platform} on ${dataWarehouse}`);
  ctx.log('info', `Metrics Implemented: ${metricsCount}`);
  ctx.log('info', `Semantic Models: ${semanticModels.length}`);
  ctx.log('info', `Quality Score: ${qualityScore}/100`);
  ctx.log('info', `Coverage: ${coverage}% (target: ${targetCoverage}%)`);
  ctx.log('info', `Artifacts Generated: ${artifacts.length}`);
  ctx.log('info', `Duration: ${Math.round(duration / 1000)}s`);
  ctx.log('info', '='.repeat(80));

  return {
    success: true,
    metricsCount,
    semanticModels,
    qualityScore,
    coverage,
    meetsTarget,
    implementations,
    artifacts,
    summary: {
      projectName,
      platform,
      dataWarehouse,
      metricsScope,
      governanceLevel,
      startTime,
      endTime,
      duration
    },
    recommendations: qualityResult.recommendations,
    nextSteps: qualityResult.nextSteps,
    metadata: {
      processId: 'metrics-layer-implementation',
      version: '1.0.0',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const discoverBusinessMetricsTask = defineTask({
  id: 'discover-business-metrics',
  prompt: `You are a data engineering expert specializing in metrics layer design and semantic modeling.

Your task is to discover and catalog all business metrics for the {{projectName}} project.

**Context:**
- Metrics Scope: {{metricsScope}}
- Business Domains: {{businessDomains}}
- Existing Metrics Count: {{existingMetrics}}
- Data Warehouse: {{dataWarehouse}}

**Your responsibilities:**

1. **Metric Discovery:**
   - Interview stakeholders across {{businessDomains}} domains
   - Identify KPIs, operational metrics, and analytical metrics
   - Document metric names, descriptions, and business owners
   - Categorize metrics by type: base, derived, compound, and aggregate

2. **Business Definition Collection:**
   - Capture precise business definitions for each metric
   - Document calculation logic in business terms
   - Identify metric dimensions and filters
   - Record time grains (daily, weekly, monthly, etc.)

3. **Metric Analysis:**
   - Identify metric dependencies and relationships
   - Detect duplicate or conflicting metric definitions
   - Analyze metric usage patterns and priority
   - Estimate data source availability

4. **Coverage Assessment:**
   - Map metrics to business domains
   - Identify gaps in metric coverage
   - Prioritize metrics by business impact
   - Estimate implementation complexity

**Deliverables:**

Generate the following artifacts in {{outputDir}}/:

1. \`metrics-catalog.json\` - Complete catalog of discovered metrics with:
   - Metric ID, name, and business definition
   - Domain, owner, and priority
   - Metric type and calculation logic
   - Dimensions, filters, and time grains
   - Dependencies and related metrics

2. \`business-domains.json\` - Domain mapping with metrics grouped by area

3. \`metric-relationships.json\` - Dependency graph and relationships

4. \`conflicts-report.json\` - Identified conflicts and ambiguities

5. \`coverage-assessment.md\` - Coverage analysis and gap identification

**Output Format:**

Return a JSON object with:
{
  "metricsIdentified": <number>,
  "metrics": [array of metric objects],
  "domains": [array of domain objects],
  "metricTypes": { "base": <count>, "derived": <count>, "compound": <count> },
  "dimensions": [array of dimension objects],
  "conflicts": [array of conflict objects],
  "estimatedCoverage": <percentage>,
  "artifacts": [
    { "path": "{{outputDir}}/metrics-catalog.json", "label": "Metrics Catalog", "format": "json" },
    { "path": "{{outputDir}}/business-domains.json", "label": "Business Domains", "format": "json" },
    { "path": "{{outputDir}}/metric-relationships.json", "label": "Metric Relationships", "format": "json" },
    { "path": "{{outputDir}}/conflicts-report.json", "label": "Conflicts Report", "format": "json" },
    { "path": "{{outputDir}}/coverage-assessment.md", "label": "Coverage Assessment", "format": "markdown" }
  ]
}

Focus on comprehensive discovery with clear business definitions and accurate relationship mapping.`,
  actions: ['writeFile']
});

const designSemanticModelsTask = defineTask({
  id: 'design-semantic-models',
  prompt: `You are a semantic modeling expert specializing in metrics layer architecture.

Your task is to design semantic models for the {{projectName}} metrics layer.

**Context:**
- Platform: {{platform}}
- Data Warehouse: {{dataWarehouse}}
- Business Domains: {{businessDomains}}
- Metrics Discovered: {{metrics.length}}
- Include Lineage: {{includeLineage}}

**Metrics to Model:**
{{#each metrics}}
- {{this.name}} ({{this.type}}): {{this.definition}}
{{/each}}

**Your responsibilities:**

1. **Entity Identification:**
   - Identify core business entities (Customer, Product, Order, etc.)
   - Define entity attributes and properties
   - Establish primary and foreign keys
   - Map entities to data warehouse tables

2. **Relationship Mapping:**
   - Define relationships between entities (one-to-one, one-to-many, many-to-many)
   - Establish join paths and join conditions
   - Create dimension hierarchies (date, geography, product category)
   - Model fact-dimension relationships

3. **Semantic Model Design:**
   - Design semantic models for each business domain
   - Define measures (metrics) and dimensions
   - Establish metric aggregation rules
   - Create calculated measures and derived metrics

4. **Lineage Tracking (if enabled):**
   - Map metrics to source tables and columns
   - Track metric-to-metric dependencies
   - Document transformation lineage
   - Create end-to-end data flow diagrams

**Design Principles:**
- Follow dimensional modeling best practices
- Ensure semantic models are platform-appropriate ({{platform}})
- Optimize for query performance and usability
- Maintain consistency across domains

**Deliverables:**

Generate the following artifacts in {{outputDir}}/:

1. \`semantic-models/\` directory with model definitions for {{platform}}
2. \`entity-relationship-diagram.mermaid\` - ERD visualization
3. \`dimension-hierarchies.json\` - Hierarchy definitions
4. \`join-graph.json\` - Entity relationship and join paths
{{#if includeLineage}}
5. \`lineage-tracking.json\` - Complete lineage mapping
6. \`lineage-diagram.mermaid\` - Visual lineage representation
{{/if}}

**Output Format:**

Return a JSON object with:
{
  "models": [array of semantic model objects],
  "entities": [array of entity objects],
  "relationships": [array of relationship objects],
  "hierarchies": [array of hierarchy objects],
  "joinPaths": [array of join path objects],
  {{#if includeLineage}}
  "lineage": {
    "metricToTable": [array of mappings],
    "metricToMetric": [array of dependencies],
    "transformations": [array of transformation steps]
  },
  {{/if}}
  "artifacts": [array of artifact objects with path, label, format]
}

Design comprehensive semantic models that are intuitive, performant, and maintainable.`,
  actions: ['writeFile']
});

const implementMetricDefinitionsTask = defineTask({
  id: 'implement-metric-definitions',
  prompt: `You are a metrics platform expert specializing in {{platform}} implementations.

Your task is to implement metric definitions for the {{projectName}} metrics layer.

**Context:**
- Platform: {{platform}}
- Data Warehouse: {{dataWarehouse}}
- Semantic Models: {{semanticModels.length}}
- Metrics to Implement: {{metrics.length}}
- Enable Caching: {{enableCaching}}
- Refresh Strategy: {{refreshStrategy}}

**Semantic Models:**
{{#each semanticModels}}
- {{this.name}}: {{this.entities.length}} entities
{{/each}}

**Your responsibilities:**

1. **Metric Definition Implementation:**
   - Implement metrics using {{platform}} syntax
   - Define metric types (sum, average, count, ratio, etc.)
   - Specify aggregation logic and SQL expressions
   - Configure time grains and dimensions

2. **Business Logic Centralization:**
   - Centralize calculation logic in metric definitions
   - Implement complex business rules and transformations
   - Create reusable metric components
   - Establish metric dependencies

3. **Performance Optimization:**
   - Configure pre-aggregations for {{platform}}
   - Set up caching strategies (if {{enableCaching}})
   - Define refresh schedules for {{refreshStrategy}} strategy
   - Optimize query generation

4. **Platform-Specific Features:**
   {{#if (eq platform 'dbt')}}
   - Create dbt metrics YAML files
   - Define metric meta properties
   - Set up metric tests
   - Configure metric dependencies
   {{/if}}
   {{#if (eq platform 'cube.js')}}
   - Create Cube.js schema files
   - Define measures and dimensions
   - Configure pre-aggregations
   - Set up security contexts
   {{/if}}
   {{#if (eq platform 'looker')}}
   - Create LookML measure definitions
   - Define derived tables for complex metrics
   - Set up drill fields and links
   - Configure datagroups for caching
   {{/if}}

**Deliverables:**

Generate the following artifacts in {{outputDir}}/:

1. \`definitions/\` directory with {{platform}}-specific metric definitions
2. \`calculation-logic.json\` - Detailed calculation documentation
3. \`transformations.json\` - Business logic transformations
4. \`caching-config.{{platform}}\` - Caching configuration (if enabled)
5. \`example-definitions.json\` - Example metrics for documentation

**Output Format:**

Return a JSON object with:
{
  "definitionsCreated": <number>,
  "definitions": [array of definition file paths],
  "calculationLogic": [array of calculation objects],
  "transformations": [array of transformation objects],
  "cachingConfig": <caching configuration object>,
  "exampleDefinitions": [array of example metric definitions],
  "artifacts": [array of artifact objects with path, label, format]
}

Implement robust, well-documented metric definitions following {{platform}} best practices.`,
  actions: ['writeFile']
});

const setupVersionControlTask = defineTask({
  id: 'setup-version-control',
  prompt: `You are a DevOps expert specializing in metrics layer version control and change management.

Your task is to set up version control for the {{projectName}} metrics layer.

**Context:**
- Platform: {{platform}}
- Governance Level: {{governanceLevel}}
- Metric Definitions: {{metricDefinitions.length}}
- Semantic Models: {{semanticModels.length}}

**Your responsibilities:**

1. **Git Repository Setup:**
   - Initialize Git repository for metrics layer
   - Create .gitignore for {{platform}}
   - Set up repository structure and conventions
   - Configure Git LFS for large files (if needed)

2. **Branching Strategy:**
   - Implement Gitflow or trunk-based development
   - Define branch naming conventions
   - Set up protected branches (main, production)
   - Configure branch policies and merge requirements

3. **Change Management Workflows:**
   - Design metric change request process
   - Implement PR templates for metric changes
   - Set up code review requirements
   - Define approval workflows based on {{governanceLevel}}

4. **CI/CD Integration:**
   - Configure CI pipeline for validation
   - Set up automated testing on PRs
   - Implement automated deployment workflows
   - Configure staging and production environments

5. **Approval Gates:**
   {{#if (eq governanceLevel 'high')}}
   - Require 2+ approvals for metric changes
   - Mandate data steward approval
   - Implement breaking change detection
   - Set up impact analysis automation
   {{else if (eq governanceLevel 'medium')}}
   - Require 1+ approval for metric changes
   - Recommend data steward notification
   - Basic breaking change warnings
   {{else}}
   - Optional peer review
   - Basic validation checks
   {{/if}}

**Deliverables:**

Generate the following artifacts in {{outputDir}}/:

1. Initialize Git repository
2. \`.gitignore\` - Git ignore rules
3. \`branching-strategy.md\` - Branching documentation
4. \`.github/workflows/\` - CI/CD workflows
5. \`.github/PULL_REQUEST_TEMPLATE.md\` - PR template
6. \`CONTRIBUTING.md\` - Contribution guidelines
7. \`version-control-guide.md\` - Version control documentation

**Output Format:**

Return a JSON object with:
{
  "repositoryPath": "{{outputDir}}/metrics-repo",
  "branches": ["main", "develop", "staging"],
  "workflows": [array of workflow objects],
  "approvalGates": [array of approval gate definitions],
  "cicdIntegration": {
    "provider": "GitHub Actions",
    "pipelines": [array of pipeline names]
  },
  "artifacts": [array of artifact objects with path, label, format]
}

Implement enterprise-grade version control with appropriate governance for {{governanceLevel}} level.`,
  actions: ['writeFile', 'bash']
});

const implementGovernanceTask = defineTask({
  id: 'implement-governance',
  prompt: `You are a data governance expert specializing in metrics layer access control and policies.

Your task is to implement governance and access control for the {{projectName}} metrics layer.

**Context:**
- Platform: {{platform}}
- Access Control: {{accessControl}}
- Governance Level: {{governanceLevel}}
- Business Domains: {{businessDomains}}
- Metrics Count: {{metrics.length}}

**Your responsibilities:**

1. **Governance Policy Definition:**
   - Define metric ownership policies
   - Establish metric approval processes
   - Create metric deprecation procedures
   - Set up metric quality standards

2. **Role-Based Access Control (if {{accessControl}} = 'role-based'):**
   - Define user roles (Admin, Developer, Analyst, Viewer)
   - Map roles to permissions (read, write, approve, delete)
   - Assign roles to business domains
   - Implement row-level and column-level security

3. **Attribute-Based Access Control (if {{accessControl}} = 'attribute-based'):**
   - Define user attributes (department, level, clearance)
   - Create attribute-based policies
   - Implement dynamic access rules
   - Set up context-aware permissions

4. **Data Classification:**
   - Classify metrics by sensitivity (Public, Internal, Confidential, Restricted)
   - Tag metrics with data classifications
   - Implement access restrictions by classification
   - Set up data masking for sensitive metrics

5. **Audit and Compliance:**
   - Enable audit logging for metric access
   - Track metric changes and approvals
   - Generate compliance reports
   - Set up alerts for policy violations

6. **Platform-Specific Implementation:**
   {{#if (eq platform 'dbt')}}
   - Use dbt grants for access control
   - Implement dbt project structure by domain
   - Configure dbt Cloud permissions
   {{/if}}
   {{#if (eq platform 'cube.js')}}
   - Implement Cube.js security context
   - Configure row-level security
   - Set up JWT authentication
   {{/if}}
   {{#if (eq platform 'looker')}}
   - Configure Looker access grants
   - Set up model sets and permission sets
   - Implement content access controls
   {{/if}}

**Deliverables:**

Generate the following artifacts in {{outputDir}}/:

1. \`governance-policies.json\` - Governance policy definitions
2. \`roles-permissions.json\` - RBAC/ABAC configuration
3. \`data-classification.json\` - Metric classification tags
4. \`access-control-config.{{platform}}\` - Platform-specific access config
5. \`audit-config.json\` - Audit logging configuration
6. \`governance-guide.md\` - Governance documentation

**Output Format:**

Return a JSON object with:
{
  "policies": [array of policy objects],
  "roles": [array of role definitions],
  "permissions": [array of permission rules],
  "dataClassification": {
    "public": <count>,
    "internal": <count>,
    "confidential": <count>,
    "restricted": <count>
  },
  "auditingEnabled": true,
  "artifacts": [array of artifact objects with path, label, format]
}

Implement comprehensive governance aligned with {{governanceLevel}} requirements and {{accessControl}} model.`,
  actions: ['writeFile']
});

const generateMetricDocumentationTask = defineTask({
  id: 'generate-metric-documentation',
  prompt: `You are a technical writer specializing in metrics layer documentation.

Your task is to generate comprehensive documentation for the {{projectName}} metrics layer.

**Context:**
- Platform: {{platform}}
- Documentation Level: {{documentationLevel}}
- Metrics Count: {{metrics.length}}
- Semantic Models: {{semanticModels.length}}
- Include Lineage: {{includeLineage}}

**Your responsibilities:**

1. **Metric Catalog Documentation:**
   - Document each metric with business definition
   - Include calculation logic and examples
   - List dimensions, filters, and time grains
   - Document ownership and approval status

2. **Semantic Model Documentation:**
   - Document entity relationships and join paths
   - Explain dimension hierarchies
   - Provide model usage examples
   - Include ERD diagrams

3. **Usage Guides:**
   - Create getting started guide
   - Write query examples for common use cases
   - Document BI tool integration instructions
   - Provide troubleshooting guide

4. **Lineage Documentation (if {{includeLineage}}):**
   - Document metric-to-table lineage
   - Map metric dependencies
   - Visualize data flow
   - Explain transformation logic

5. **API Reference (if applicable):**
   - Document REST/GraphQL API endpoints
   - Provide request/response examples
   - Document authentication and authorization
   - Include rate limiting and error codes

6. **Searchable Catalog:**
   - Generate searchable metric catalog
   - Implement tagging and categorization
   - Create glossary of terms
   - Set up documentation website

**Documentation Level:**
{{#if (eq documentationLevel 'comprehensive')}}
- Complete business and technical documentation
- Interactive examples and tutorials
- Video walkthroughs
- FAQ and troubleshooting
{{else if (eq documentationLevel 'standard')}}
- Core documentation for all metrics
- Common use case examples
- Basic troubleshooting
{{else}}
- Essential metric definitions
- Quick reference guide
{{/if}}

**Deliverables:**

Generate the following artifacts in {{outputDir}}/:

1. \`docs/\` directory with complete documentation
2. \`docs/index.md\` - Documentation home page
3. \`docs/metrics-catalog.md\` - Metric catalog
4. \`docs/semantic-models.md\` - Model documentation
5. \`docs/getting-started.md\` - Getting started guide
6. \`docs/api-reference.md\` - API documentation
{{#if includeLineage}}
7. \`docs/lineage/\` - Lineage documentation and diagrams
{{/if}}
8. \`docs/glossary.md\` - Glossary of terms
9. \`mkdocs.yml\` - Documentation site configuration

**Output Format:**

Return a JSON object with:
{
  "pages": [array of documentation page objects],
  {{#if includeLineage}}
  "lineage": {
    "metricToTable": <count of relationships>,
    "metricToMetric": <count of dependencies>,
    "diagrams": [array of diagram paths]
  },
  {{/if}}
  "catalogUrl": "{{outputDir}}/docs/index.html",
  "searchEnabled": true,
  "completeness": <percentage>,
  "artifacts": [array of artifact objects with path, label, format]
}

Create clear, comprehensive documentation at {{documentationLevel}} level with excellent searchability.`,
  actions: ['writeFile']
});

const testMetricDefinitionsTask = defineTask({
  id: 'test-metric-definitions',
  prompt: `You are a data quality engineer specializing in metrics layer testing and validation.

Your task is to test and validate metric definitions for the {{projectName}} metrics layer.

**Context:**
- Platform: {{platform}}
- Data Warehouse: {{dataWarehouse}}
- Metric Definitions: {{metricDefinitions.length}}
- Semantic Models: {{semanticModels.length}}

**Your responsibilities:**

1. **Unit Tests for Metrics:**
   - Test individual metric calculations
   - Verify aggregation logic
   - Test dimension filtering
   - Validate time grain calculations

2. **Data Quality Tests:**
   - Test for null/missing values
   - Validate data type consistency
   - Check for referential integrity
   - Test metric value ranges

3. **Consistency Tests:**
   - Compare metrics across different time periods
   - Validate metric relationships and dependencies
   - Test metric reconciliation with source data
   - Verify metric to metric consistency

4. **Performance Tests:**
   - Test query performance for each metric
   - Validate caching effectiveness
   - Test with production-scale data volumes
   - Identify slow-running metrics

5. **Integration Tests:**
   - Test BI tool integrations
   - Validate API responses
   - Test access control rules
   - Verify end-to-end workflows

6. **Platform-Specific Tests:**
   {{#if (eq platform 'dbt')}}
   - Run dbt metric tests
   - Test dbt metric dependencies
   - Validate dbt compilation
   {{/if}}
   {{#if (eq platform 'cube.js')}}
   - Test Cube.js measures
   - Validate pre-aggregations
   - Test security contexts
   {{/if}}
   {{#if (eq platform 'looker')}}
   - Run LookML validator
   - Test Looker explores
   - Validate field references
   {{/if}}

**Test Framework:**
- Use {{platform}}-native testing where available
- Implement SQL-based data quality tests
- Create integration test suite
- Set up automated test execution

**Deliverables:**

Generate the following artifacts in {{outputDir}}/:

1. \`tests/\` directory with test definitions
2. \`test-results.json\` - Test execution results
3. \`validation-report.md\` - Validation findings
4. \`failed-tests.json\` - Failed test details
5. \`performance-benchmarks.json\` - Performance test results
6. \`test-coverage-report.json\` - Test coverage analysis

**Output Format:**

Return a JSON object with:
{
  "testsRun": <number>,
  "testsPassed": <number>,
  "testsFailed": <number>,
  "validationChecks": {
    "total": <number>,
    "passed": <number>,
    "failed": <number>
  },
  "failedTests": [array of failed test objects],
  "coverage": <percentage>,
  "performanceMetrics": {
    "averageQueryTime": <milliseconds>,
    "slowestMetrics": [array of slow metrics]
  },
  "artifacts": [array of artifact objects with path, label, format]
}

Implement thorough testing to ensure metric accuracy, performance, and reliability.`,
  actions: ['writeFile', 'bash']
});

const deployMetricsLayerTask = defineTask({
  id: 'deploy-metrics-layer',
  prompt: `You are a data platform engineer specializing in metrics layer deployment and operations.

Your task is to deploy the {{projectName}} metrics layer to production.

**Context:**
- Platform: {{platform}}
- Data Warehouse: {{dataWarehouse}}
- Semantic Models: {{semanticModels.length}}
- Metric Definitions: {{metricDefinitions.length}}
- Enable Caching: {{enableCaching}}
- Refresh Strategy: {{refreshStrategy}}

**Your responsibilities:**

1. **Deployment Preparation:**
   - Validate all metric definitions
   - Check dependencies and requirements
   - Prepare deployment manifests
   - Set up environment variables and secrets

2. **Platform Deployment:**
   {{#if (eq platform 'dbt')}}
   - Deploy dbt project to production
   - Run dbt deps and dbt compile
   - Execute dbt run for metric models
   - Set up dbt Cloud jobs or Airflow DAGs
   {{/if}}
   {{#if (eq platform 'cube.js')}}
   - Deploy Cube.js application
   - Configure Cube.js server
   - Set up Cube Store for pre-aggregations
   - Configure API endpoints
   {{/if}}
   {{#if (eq platform 'looker')}}
   - Deploy LookML project to production
   - Validate LookML deployment
   - Set up PDTs and datagroups
   - Configure Looker API access
   {{/if}}

3. **Caching Configuration (if {{enableCaching}}):**
   - Configure pre-aggregations
   - Set up cache warming schedules
   - Implement cache invalidation rules
   - Monitor cache hit rates

4. **Refresh Strategy Implementation:**
   {{#if (eq refreshStrategy 'real-time')}}
   - Configure streaming updates
   - Set up change data capture (CDC)
   - Implement near real-time refresh
   {{else if (eq refreshStrategy 'scheduled')}}
   - Set up scheduled refresh jobs
   - Configure refresh intervals
   - Implement incremental updates
   {{else}}
   - Configure on-demand refresh triggers
   - Set up manual refresh procedures
   {{/if}}

5. **BI Tool Integration:**
   - Connect Tableau, PowerBI, Looker, etc.
   - Configure ODBC/JDBC connections
   - Set up semantic layer endpoints
   - Validate BI tool connectivity

6. **Monitoring and Health Checks:**
   - Set up health check endpoints
   - Configure performance monitoring
   - Enable error tracking and alerting
   - Create operational dashboards

**Deliverables:**

Generate the following artifacts in {{outputDir}}/:

1. \`deployment-manifest.yaml\` - Deployment configuration
2. \`connection-strings.json\` - BI tool connection details
3. \`health-check-config.json\` - Health monitoring configuration
4. \`deployment-guide.md\` - Deployment documentation
5. \`integration-tests.sh\` - Post-deployment tests

**Output Format:**

Return a JSON object with:
{
  "environment": "production",
  "endpoint": "<metrics layer endpoint URL>",
  "integrations": [
    { "tool": "Tableau", "status": "connected", "connectionType": "REST API" },
    { "tool": "PowerBI", "status": "connected", "connectionType": "ODBC" }
  ],
  "cacheStatus": {
    "enabled": {{enableCaching}},
    "hitRate": <percentage>,
    "warmingSchedule": "<schedule>"
  },
  "healthCheck": {
    "status": "healthy",
    "endpoint": "<health check URL>",
    "checks": [array of health check results]
  },
  "performance": {
    "averageResponseTime": <milliseconds>,
    "throughput": <queries per second>
  },
  "artifacts": [array of artifact objects with path, label, format]
}

Deploy a production-ready metrics layer with proper monitoring, caching, and integrations.`,
  actions: ['writeFile', 'bash']
});

const validateMetricsLayerQualityTask = defineTask({
  id: 'validate-metrics-layer-quality',
  prompt: `You are a quality assurance expert specializing in metrics layer validation and assessment.

Your task is to perform final quality validation for the {{projectName}} metrics layer.

**Context:**
- Metrics Count: {{metricsCount}}
- Semantic Models: {{semanticModels.length}}
- Target Coverage: {{targetCoverage}}%
- Governance Level: {{governanceLevel}}
- Documentation Level: {{documentationLevel}}

**Implementation Summary:**
{{#each implementations}}
- {{this.phase}}: {{this.result.summary}}
{{/each}}

{{#if testingResults}}
**Testing Results:**
- Tests Run: {{testingResults.testsRun}}
- Tests Passed: {{testingResults.testsPassed}}
- Test Coverage: {{testingResults.coverage}}%
{{/if}}

**Your responsibilities:**

1. **Coverage Analysis:**
   - Calculate metric coverage by business domain
   - Assess semantic model completeness
   - Evaluate documentation coverage
   - Check test coverage

2. **Quality Scoring:**
   - Definition Quality: Completeness, accuracy, clarity
   - Implementation Quality: Code quality, performance, best practices
   - Documentation Quality: Completeness, accuracy, usability
   - Testing Quality: Coverage, test quality, validation thoroughness
   - Governance Quality: Policy compliance, access control, audit readiness

3. **Completeness Assessment:**
   - Verify all metric definitions are implemented
   - Check semantic models are complete
   - Validate documentation is comprehensive
   - Ensure testing is thorough

4. **Best Practices Validation:**
   - Check naming conventions compliance
   - Verify semantic modeling patterns
   - Validate calculation logic correctness
   - Assess performance optimization

5. **Recommendations:**
   - Identify areas for improvement
   - Suggest optimization opportunities
   - Recommend additional metrics
   - Propose next steps

**Quality Scoring (0-100):**
- Metric Definitions: 25 points
- Semantic Models: 20 points
- Documentation: 20 points
- Testing: 15 points
- Governance: 10 points
- Performance: 10 points

**Deliverables:**

Generate the following artifacts in {{outputDir}}/:

1. \`quality-assessment-report.json\` - Detailed quality scores
2. \`coverage-analysis.json\` - Coverage breakdown by domain
3. \`recommendations.md\` - Improvement recommendations
4. \`next-steps.md\` - Recommended next steps
5. \`final-scorecard.md\` - Executive summary

**Output Format:**

Return a JSON object with:
{
  "score": <0-100>,
  "coverage": <percentage>,
  "completeness": {
    "definitions": <percentage>,
    "semanticModels": <percentage>,
    "documentation": <percentage>,
    "testing": <percentage>,
    "governance": <percentage>
  },
  "qualityBreakdown": {
    "metricDefinitions": <score>,
    "semanticModels": <score>,
    "documentation": <score>,
    "testing": <score>,
    "governance": <score>,
    "performance": <score>
  },
  "recommendations": [array of recommendation strings],
  "nextSteps": [array of next step strings],
  "artifacts": [array of artifact objects with path, label, format]
}

Provide thorough quality assessment with actionable recommendations.`,
  actions: ['writeFile']
});
