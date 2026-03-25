/**
 * @process specializations/technical-documentation/data-model-docs
 * @description Data Model and Schema Documentation - Comprehensive process for documenting entity relationships,
 * database schemas, data flow diagrams, API data models with automated schema visualization, ER diagrams,
 * and detailed field-level documentation following technical documentation best practices.
 * @inputs { projectName: string, schemaSource?: string, databases?: array, apiSpecs?: array, outputDir?: string }
 * @outputs { success: boolean, erDiagrams: array, schemaDocumentation: object, dataFlowDiagrams: array, dataDictionary: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/technical-documentation/data-model-docs', {
 *   projectName: 'E-Commerce Platform',
 *   schemaSource: 'database', // 'database', 'api', 'code', 'mixed'
 *   databases: [
 *     { type: 'PostgreSQL', connectionString: 'postgres://...', schemas: ['public', 'inventory'] },
 *     { type: 'MongoDB', connectionString: 'mongodb://...', databases: ['orders'] }
 *   ],
 *   apiSpecs: [
 *     { type: 'OpenAPI', path: './api-spec.yaml' },
 *     { type: 'GraphQL', path: './schema.graphql' }
 *   ],
 *   outputDir: 'docs/data-models'
 * });
 *
 * @references
 * - ER Diagram Best Practices: https://www.lucidchart.com/pages/er-diagrams
 * - Database Documentation Guidelines: https://www.postgresql.org/docs/current/ddl.html
 * - PlantUML ER Diagrams: https://plantuml.com/ie-diagram
 * - Mermaid ER Syntax: https://mermaid.js.org/syntax/entityRelationshipDiagram.html
 * - OpenAPI Schema Documentation: https://swagger.io/docs/specification/data-models/
 * - Data Dictionary Standards: https://dataedo.com/kb/data-documentation/data-dictionary-best-practices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    schemaSource = 'database', // 'database', 'api', 'code', 'mixed'
    databases = [],
    apiSpecs = [],
    codeRepositories = [],
    outputDir = 'data-model-docs-output',
    diagramFormat = 'mermaid', // 'mermaid', 'plantuml', 'graphviz', 'both'
    includeDataFlow = true,
    includeSampleData = false,
    includeRelationshipCardinality = true,
    includeConstraints = true,
    generateDataDictionary = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let erDiagrams = [];
  let schemaDocumentation = {};
  let dataFlowDiagrams = [];
  let dataDictionary = {};

  ctx.log('info', `Starting Data Model and Schema Documentation for ${projectName}`);
  ctx.log('info', `Schema Source: ${schemaSource}, Diagram Format: ${diagramFormat}`);

  // ============================================================================
  // PHASE 1: SCHEMA DISCOVERY AND EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovering and extracting schemas from sources');

  const schemaDiscovery = await ctx.task(schemaDiscoveryTask, {
    projectName,
    schemaSource,
    databases,
    apiSpecs,
    codeRepositories,
    outputDir
  });

  if (!schemaDiscovery.success) {
    return {
      success: false,
      error: 'Failed to discover schemas from provided sources',
      details: schemaDiscovery.error,
      phase: 'schema-discovery',
      metadata: {
        processId: 'specializations/technical-documentation/data-model-docs',
        timestamp: startTime,
        projectName
      }
    };
  }

  artifacts.push(...schemaDiscovery.artifacts);

  // Quality Gate: Must discover at least one schema
  if (!schemaDiscovery.entities || schemaDiscovery.entities.length === 0) {
    ctx.log('error', 'No entities/tables discovered from schema sources');
    return {
      success: false,
      error: 'No entities or tables discovered. Verify schema sources are accessible and contain valid schemas.',
      phase: 'schema-discovery',
      entitiesFound: 0,
      metadata: {
        processId: 'specializations/technical-documentation/data-model-docs',
        timestamp: startTime,
        projectName
      }
    };
  }

  ctx.log('info', `Discovered ${schemaDiscovery.entities.length} entities/tables from ${schemaDiscovery.sourcesProcessed} sources`);

  // ============================================================================
  // PHASE 2: RELATIONSHIP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing relationships between entities');

  const relationshipAnalysis = await ctx.task(relationshipAnalysisTask, {
    projectName,
    entities: schemaDiscovery.entities,
    schemaMetadata: schemaDiscovery.metadata,
    includeRelationshipCardinality,
    includeConstraints,
    outputDir
  });

  artifacts.push(...relationshipAnalysis.artifacts);

  ctx.log('info', `Identified ${relationshipAnalysis.relationships.length} relationships`);

  // Breakpoint: Review discovered schema and relationships
  await ctx.breakpoint({
    question: `Schema discovery complete for ${projectName}. Found ${schemaDiscovery.entities.length} entities and ${relationshipAnalysis.relationships.length} relationships. Review and approve to proceed with diagram generation?`,
    title: 'Schema Discovery Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName,
        entitiesDiscovered: schemaDiscovery.entities.length,
        relationshipsIdentified: relationshipAnalysis.relationships.length,
        sourcesProcessed: schemaDiscovery.sourcesProcessed,
        schemaSource
      }
    }
  });

  // ============================================================================
  // PHASE 3: ER DIAGRAM GENERATION (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 3: Generating Entity-Relationship diagrams');

  // Group entities by logical domain/schema for multiple diagrams
  const entityGroups = await ctx.task(entityGroupingTask, {
    projectName,
    entities: schemaDiscovery.entities,
    relationships: relationshipAnalysis.relationships,
    maxEntitiesPerDiagram: 15, // Split into multiple diagrams if too many entities
    outputDir
  });

  artifacts.push(...entityGroups.artifacts);

  ctx.log('info', `Grouped entities into ${entityGroups.groups.length} logical diagrams`);

  // Generate ER diagrams in parallel for each group
  const erDiagramTasks = entityGroups.groups.map((group, index) => ({
    name: `er-diagram-${group.name}`,
    task: erDiagramGenerationTask,
    args: {
      projectName,
      groupName: group.name,
      entities: group.entities,
      relationships: group.relationships,
      diagramFormat,
      includeRelationshipCardinality,
      includeConstraints,
      outputDir
    }
  }));

  erDiagrams = await ctx.parallel.all(
    erDiagramTasks.map(t => ctx.task(t.task, t.args))
  );

  erDiagrams.forEach(diagram => {
    artifacts.push(...diagram.artifacts);
  });

  const totalEntitiesDocumented = erDiagrams.reduce((sum, d) => sum + d.entityCount, 0);
  const totalRelationshipsDocumented = erDiagrams.reduce((sum, d) => sum + d.relationshipCount, 0);

  ctx.log('info', `Generated ${erDiagrams.length} ER diagrams covering ${totalEntitiesDocumented} entities and ${totalRelationshipsDocumented} relationships`);

  // ============================================================================
  // PHASE 4: SCHEMA DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Generating detailed schema documentation');

  const schemaDocsTask = await ctx.task(schemaDocumentationTask, {
    projectName,
    entities: schemaDiscovery.entities,
    relationships: relationshipAnalysis.relationships,
    schemaMetadata: schemaDiscovery.metadata,
    erDiagrams,
    includeConstraints,
    includeSampleData,
    outputDir
  });

  schemaDocumentation = schemaDocsTask;
  artifacts.push(...schemaDocsTask.artifacts);

  ctx.log('info', `Generated schema documentation for ${schemaDocumentation.documentedEntities} entities`);

  // ============================================================================
  // PHASE 5: DATA DICTIONARY GENERATION (OPTIONAL)
  // ============================================================================

  if (generateDataDictionary) {
    ctx.log('info', 'Phase 5: Generating comprehensive data dictionary');

    const dataDictionaryTask = await ctx.task(dataDictionaryGenerationTask, {
      projectName,
      entities: schemaDiscovery.entities,
      relationships: relationshipAnalysis.relationships,
      schemaMetadata: schemaDiscovery.metadata,
      includeBusinessDefinitions: true,
      includeDataTypes: true,
      includeConstraints,
      includeSampleData,
      outputDir
    });

    dataDictionary = dataDictionaryTask;
    artifacts.push(...dataDictionaryTask.artifacts);

    ctx.log('info', `Generated data dictionary with ${dataDictionary.totalFields} fields documented`);
  }

  // ============================================================================
  // PHASE 6: DATA FLOW DIAGRAMS (OPTIONAL)
  // ============================================================================

  if (includeDataFlow) {
    ctx.log('info', 'Phase 6: Generating data flow diagrams');

    const dataFlowTask = await ctx.task(dataFlowDiagramTask, {
      projectName,
      entities: schemaDiscovery.entities,
      relationships: relationshipAnalysis.relationships,
      schemaMetadata: schemaDiscovery.metadata,
      diagramFormat,
      outputDir
    });

    dataFlowDiagrams = dataFlowTask.diagrams;
    artifacts.push(...dataFlowTask.artifacts);

    ctx.log('info', `Generated ${dataFlowDiagrams.length} data flow diagrams`);
  }

  // ============================================================================
  // PHASE 7: COMPREHENSIVE DOCUMENTATION ASSEMBLY
  // ============================================================================

  ctx.log('info', 'Phase 7: Assembling comprehensive documentation package');

  const documentationAssembly = await ctx.task(documentationAssemblyTask, {
    projectName,
    schemaDiscovery,
    relationshipAnalysis,
    erDiagrams,
    schemaDocumentation,
    dataDictionary: generateDataDictionary ? dataDictionary : null,
    dataFlowDiagrams,
    artifacts,
    outputDir
  });

  artifacts.push(...documentationAssembly.artifacts);

  ctx.log('info', 'Documentation assembly complete');

  // ============================================================================
  // PHASE 8: QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating documentation quality and completeness');

  const qualityValidation = await ctx.task(documentationQualityValidationTask, {
    projectName,
    schemaDiscovery,
    relationshipAnalysis,
    erDiagrams,
    schemaDocumentation,
    dataDictionary: generateDataDictionary ? dataDictionary : null,
    dataFlowDiagrams,
    documentationAssembly,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const qualityScore = qualityValidation.overallScore;
  const qualityMet = qualityScore >= 85;

  ctx.log('info', `Quality validation complete. Score: ${qualityScore}/100`);

  // Breakpoint: Final review
  await ctx.breakpoint({
    question: `Data model documentation complete for ${projectName}. Quality score: ${qualityScore}/100. ${qualityMet ? 'Documentation meets quality standards!' : 'Documentation may need refinement.'} Generated ${erDiagrams.length} ER diagrams, documented ${schemaDocumentation.documentedEntities} entities${generateDataDictionary ? `, and created data dictionary with ${dataDictionary.totalFields} fields` : ''}. Review and approve?`,
    title: 'Data Model Documentation Final Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName,
        qualityScore,
        qualityMet,
        erDiagramCount: erDiagrams.length,
        entitiesDocumented: schemaDocumentation.documentedEntities,
        relationshipsDocumented: totalRelationshipsDocumented,
        dataFlowDiagramCount: dataFlowDiagrams.length,
        dataDictionaryFields: generateDataDictionary ? dataDictionary.totalFields : 0,
        totalArtifacts: artifacts.length,
        masterDocumentPath: documentationAssembly.masterDocumentPath
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    qualityScore,
    qualityMet,
    erDiagrams: erDiagrams.map(d => ({
      name: d.groupName,
      path: d.diagramPath,
      format: d.format,
      entityCount: d.entityCount,
      relationshipCount: d.relationshipCount
    })),
    schemaDocumentation: {
      path: schemaDocumentation.documentPath,
      documentedEntities: schemaDocumentation.documentedEntities,
      documentedFields: schemaDocumentation.documentedFields,
      documentedRelationships: schemaDocumentation.documentedRelationships
    },
    dataFlowDiagrams: dataFlowDiagrams.map(d => ({
      name: d.name,
      path: d.path,
      format: d.format,
      description: d.description
    })),
    dataDictionary: generateDataDictionary ? {
      path: dataDictionary.dictionaryPath,
      totalFields: dataDictionary.totalFields,
      totalEntities: dataDictionary.totalEntities
    } : null,
    masterDocument: documentationAssembly.masterDocumentPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/technical-documentation/data-model-docs',
      timestamp: startTime,
      projectName,
      schemaSource,
      diagramFormat,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Schema Discovery
export const schemaDiscoveryTask = defineTask('schema-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover and extract schemas from sources',
  agent: {
    name: 'schema-extractor',
    prompt: {
      role: 'database architect and data modeling specialist',
      task: 'Discover and extract database schemas, entity definitions, and metadata from provided sources (databases, API specs, code)',
      context: args,
      instructions: [
        'Connect to or read from provided schema sources (databases, API specs, code repositories)',
        'For database sources: Extract table/collection schemas, column/field definitions, data types, constraints',
        'For API specs (OpenAPI/GraphQL): Extract data models, schemas, request/response objects',
        'For code repositories: Extract ORM models, entity classes, data structures',
        'Identify entity names, field names, data types, nullable constraints, default values',
        'Extract primary keys, foreign keys, unique constraints, check constraints, indexes',
        'Document schema metadata: database/schema names, namespaces, versioning',
        'Normalize entity definitions to common format across different sources',
        'Handle multiple sources and merge/reconcile conflicting definitions',
        'Save raw schema data and normalized entity definitions to output directory',
        'Create schema discovery summary report'
      ],
      outputFormat: 'JSON with success (boolean), entities (array), metadata (object), sourcesProcessed (number), artifacts (array), error (string if failed)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'entities', 'sourcesProcessed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        entities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              schema: { type: 'string' },
              source: { type: 'string' },
              type: { type: 'string', enum: ['table', 'collection', 'model', 'type'] },
              fields: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    dataType: { type: 'string' },
                    nullable: { type: 'boolean' },
                    primaryKey: { type: 'boolean' },
                    foreignKey: { type: 'string' },
                    unique: { type: 'boolean' },
                    defaultValue: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              },
              primaryKey: { type: 'array', items: { type: 'string' } },
              indexes: { type: 'array' },
              constraints: { type: 'array' },
              description: { type: 'string' }
            }
          }
        },
        metadata: {
          type: 'object',
          properties: {
            databaseTypes: { type: 'array', items: { type: 'string' } },
            schemaVersions: { type: 'object' },
            extractionTimestamp: { type: 'string' }
          }
        },
        sourcesProcessed: { type: 'number' },
        error: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-model-docs', 'schema-discovery']
}));

// Task 2: Relationship Analysis
export const relationshipAnalysisTask = defineTask('relationship-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze relationships between entities',
  agent: {
    name: 'relationship-analyzer',
    prompt: {
      role: 'data modeling specialist',
      task: 'Analyze and identify relationships between entities including foreign keys, cardinality, and relationship types',
      context: args,
      instructions: [
        'Analyze entity definitions to identify relationships',
        'Identify explicit foreign key relationships from schema constraints',
        'Infer implicit relationships from naming conventions and data patterns',
        'Determine relationship cardinality: one-to-one, one-to-many, many-to-many',
        'Identify relationship types: composition, aggregation, association',
        'Document referential integrity constraints: CASCADE, SET NULL, RESTRICT',
        'Identify junction/bridge tables for many-to-many relationships',
        'Document relationship optionality (required vs optional)',
        'Create relationship metadata: naming, directionality, business rules',
        'Validate relationship consistency and detect anomalies',
        'Save relationship analysis to output directory'
      ],
      outputFormat: 'JSON with relationships (array), relationshipStatistics (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['relationships', 'artifacts'],
      properties: {
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              fromEntity: { type: 'string' },
              toEntity: { type: 'string' },
              fromField: { type: 'string' },
              toField: { type: 'string' },
              cardinality: { type: 'string', enum: ['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'] },
              type: { type: 'string', enum: ['composition', 'aggregation', 'association', 'dependency'] },
              optional: { type: 'boolean' },
              cascadeDelete: { type: 'boolean' },
              onDelete: { type: 'string' },
              onUpdate: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        relationshipStatistics: {
          type: 'object',
          properties: {
            totalRelationships: { type: 'number' },
            oneToOne: { type: 'number' },
            oneToMany: { type: 'number' },
            manyToMany: { type: 'number' },
            junctionTables: { type: 'number' }
          }
        },
        inferredRelationships: { type: 'number' },
        explicitRelationships: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-model-docs', 'relationship-analysis']
}));

// Task 3: Entity Grouping
export const entityGroupingTask = defineTask('entity-grouping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Group entities into logical diagram groups',
  agent: {
    name: 'entity-grouper',
    prompt: {
      role: 'data architect',
      task: 'Group entities into logical domains/modules for creating multiple focused ER diagrams rather than one overwhelming diagram',
      context: args,
      instructions: [
        'Analyze entities and relationships to identify logical groupings',
        'Group by database schema, bounded context, domain area, or functional module',
        'Ensure each group has manageable size (target max entities per diagram from args)',
        'Include related entities in same group to show complete relationship picture',
        'Create "overview" group showing high-level relationships between modules',
        'Name groups clearly based on business domain or technical area',
        'Document rationale for grouping decisions',
        'Ensure no entity is orphaned without relationships',
        'Save entity grouping metadata to output directory'
      ],
      outputFormat: 'JSON with groups (array), overviewGroup (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['groups', 'artifacts'],
      properties: {
        groups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              entities: { type: 'array', items: { type: 'string' } },
              relationships: { type: 'array' },
              domain: { type: 'string' }
            }
          }
        },
        overviewGroup: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            entities: { type: 'array', items: { type: 'string' } },
            relationships: { type: 'array' }
          }
        },
        groupingStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-model-docs', 'entity-grouping']
}));

// Task 4: ER Diagram Generation
export const erDiagramGenerationTask = defineTask('er-diagram-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Entity-Relationship diagram',
  agent: {
    name: 'er-diagram-generator',
    prompt: {
      role: 'technical documentation specialist and diagram creator',
      task: 'Generate professional Entity-Relationship diagram in specified format (Mermaid, PlantUML, or Graphviz)',
      context: args,
      instructions: [
        'Create ER diagram using specified diagram format (Mermaid, PlantUML, Graphviz)',
        'For Mermaid: Use erDiagram syntax with entity definitions and relationships',
        'For PlantUML: Use @startuml with entity, class, or object notation',
        'For Graphviz: Use DOT language with node and edge definitions',
        'Show all entities in group with entity names',
        'Show all fields with data types, PK/FK indicators, constraints',
        'Draw relationship lines with cardinality notation (1..1, 1..*, *..* etc)',
        'Use consistent notation: crow\'s foot, UML, or Chen notation',
        'Add legend explaining symbols and cardinality notation',
        'Include title and description',
        'Use colors/styling to distinguish entity types or domains',
        'Ensure diagram is readable and well-laid-out',
        'Save diagram source code to output directory',
        'Generate diagram rendering (PNG/SVG) if tooling available',
        'Create diagram metadata and description'
      ],
      outputFormat: 'JSON with diagramPath (string), diagramSource (string), format (string), groupName (string), entityCount (number), relationshipCount (number), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['diagramPath', 'diagramSource', 'format', 'groupName', 'entityCount', 'relationshipCount', 'artifacts'],
      properties: {
        diagramPath: { type: 'string' },
        diagramSource: { type: 'string' },
        renderedDiagramPath: { type: 'string' },
        format: { type: 'string', enum: ['mermaid', 'plantuml', 'graphviz'] },
        groupName: { type: 'string' },
        entityCount: { type: 'number' },
        relationshipCount: { type: 'number' },
        notationStyle: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-model-docs', 'er-diagram']
}));

// Task 5: Schema Documentation
export const schemaDocumentationTask = defineTask('schema-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate detailed schema documentation',
  agent: {
    name: 'schema-documenter',
    prompt: {
      role: 'technical writer and database documentation specialist',
      task: 'Create comprehensive schema documentation with entity descriptions, field details, constraints, and usage examples',
      context: args,
      instructions: [
        'Create detailed documentation for each entity/table',
        'For each entity document:',
        '  - Entity name and purpose',
        '  - Business description and use cases',
        '  - Field-by-field documentation with descriptions',
        '  - Data types with size/precision information',
        '  - Constraints: NOT NULL, UNIQUE, CHECK, DEFAULT',
        '  - Primary key and foreign key relationships',
        '  - Indexes and performance considerations',
        '  - Sample data or example records (if includeSampleData)',
        '  - Common queries and usage patterns',
        'Reference ER diagrams with embedded links',
        'Include relationship descriptions and cardinality explanations',
        'Add data validation rules and business rules',
        'Document data lineage and transformation rules if known',
        'Format as professional Markdown documentation',
        'Include table of contents with entity navigation',
        'Add glossary of technical terms',
        'Save comprehensive schema documentation to output directory'
      ],
      outputFormat: 'JSON with documentPath (string), documentedEntities (number), documentedFields (number), documentedRelationships (number), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'documentedEntities', 'documentedFields', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        documentedEntities: { type: 'number' },
        documentedFields: { type: 'number' },
        documentedRelationships: { type: 'number' },
        documentedConstraints: { type: 'number' },
        documentedIndexes: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-model-docs', 'schema-documentation']
}));

// Task 6: Data Dictionary Generation
export const dataDictionaryGenerationTask = defineTask('data-dictionary-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive data dictionary',
  agent: {
    name: 'data-dictionary-generator',
    prompt: {
      role: 'data governance specialist and technical writer',
      task: 'Create comprehensive data dictionary with business definitions, technical metadata, and data governance information',
      context: args,
      instructions: [
        'Create tabular data dictionary with following columns:',
        '  - Entity/Table Name',
        '  - Field/Column Name',
        '  - Data Type',
        '  - Length/Precision',
        '  - Nullable (Yes/No)',
        '  - Primary Key (Yes/No)',
        '  - Foreign Key (references)',
        '  - Default Value',
        '  - Business Definition (plain language)',
        '  - Technical Description',
        '  - Valid Values/Range',
        '  - Sample Data (if includeSampleData)',
        '  - Data Classification (PII, sensitive, public)',
        '  - Data Owner/Steward',
        'Group by entity with clear sections',
        'Add metadata: last updated, version, data dictionary owner',
        'Include indexes section showing all indexes',
        'Include constraints section showing all constraints',
        'Format as sortable/filterable Markdown tables or CSV',
        'Generate both human-readable and machine-readable formats',
        'Add business glossary linking technical fields to business terms',
        'Save data dictionary to output directory'
      ],
      outputFormat: 'JSON with dictionaryPath (string), totalEntities (number), totalFields (number), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['dictionaryPath', 'totalEntities', 'totalFields', 'artifacts'],
      properties: {
        dictionaryPath: { type: 'string' },
        csvPath: { type: 'string' },
        totalEntities: { type: 'number' },
        totalFields: { type: 'number' },
        piiFieldsCount: { type: 'number' },
        businessGlossaryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-model-docs', 'data-dictionary']
}));

// Task 7: Data Flow Diagram
export const dataFlowDiagramTask = defineTask('data-flow-diagram', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate data flow diagrams',
  agent: {
    name: 'data-flow-diagram-generator',
    prompt: {
      role: 'data architect and systems analyst',
      task: 'Create data flow diagrams showing how data moves through the system',
      context: args,
      instructions: [
        'Identify data flows between entities and systems',
        'Create data flow diagrams (DFD) at appropriate level:',
        '  - Context diagram (Level 0): System boundaries and external entities',
        '  - Level 1: Major processes and data stores',
        '  - Level 2: Detailed processes if needed',
        'Show data stores (databases/tables)',
        'Show processes that transform data',
        'Show external entities (users, external systems)',
        'Show data flows with arrows and flow names',
        'Use standard DFD notation (Yourdon/DeMarco or Gane/Sarson)',
        'For modern systems, show:',
        '  - API data flows',
        '  - Message queue flows',
        '  - ETL/data pipeline flows',
        '  - Real-time vs batch data flows',
        'Create diagrams using specified format (Mermaid flowchart, PlantUML activity)',
        'Include legend explaining notation',
        'Save data flow diagrams to output directory'
      ],
      outputFormat: 'JSON with diagrams (array with name, path, format, description), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['diagrams', 'artifacts'],
      properties: {
        diagrams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              format: { type: 'string' },
              level: { type: 'string', enum: ['context', 'level-1', 'level-2'] },
              description: { type: 'string' }
            }
          }
        },
        totalDataFlows: { type: 'number' },
        totalProcesses: { type: 'number' },
        totalDataStores: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-model-docs', 'data-flow-diagram']
}));

// Task 8: Documentation Assembly
export const documentationAssemblyTask = defineTask('documentation-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble comprehensive documentation package',
  agent: {
    name: 'documentation-assembler',
    prompt: {
      role: 'technical writer and information architect',
      task: 'Assemble all documentation artifacts into comprehensive, navigable documentation package',
      context: args,
      instructions: [
        'Create master documentation index/homepage',
        'Organize documentation with clear navigation structure:',
        '  - Overview and introduction',
        '  - Quick start / how to use this documentation',
        '  - ER Diagrams section (link to all diagrams)',
        '  - Schema Documentation section (link to detailed docs)',
        '  - Data Dictionary section',
        '  - Data Flow Diagrams section',
        '  - Appendices (glossary, references, metadata)',
        'Create table of contents with links to all sections',
        'Add documentation metadata: version, last updated, authors',
        'Include navigation breadcrumbs or sidebar structure',
        'Add search optimization (keywords, tags)',
        'Embed diagram images/links in appropriate sections',
        'Cross-reference related sections',
        'Add "how to read ER diagrams" guide for non-technical readers',
        'Include change log or version history',
        'Format as professional Markdown with proper heading hierarchy',
        'Save master documentation to output directory'
      ],
      outputFormat: 'JSON with masterDocumentPath (string), navigationStructure (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['masterDocumentPath', 'artifacts'],
      properties: {
        masterDocumentPath: { type: 'string' },
        readmePath: { type: 'string' },
        navigationStructure: {
          type: 'object',
          properties: {
            sections: { type: 'array', items: { type: 'string' } },
            totalPages: { type: 'number' }
          }
        },
        documentationVersion: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-model-docs', 'documentation-assembly']
}));

// Task 9: Documentation Quality Validation
export const documentationQualityValidationTask = defineTask('documentation-quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate documentation quality and completeness',
  agent: {
    name: 'documentation-quality-validator',
    prompt: {
      role: 'senior technical writer and documentation quality auditor',
      task: 'Assess documentation quality, completeness, accuracy, and adherence to technical documentation best practices',
      context: args,
      instructions: [
        'Evaluate ER diagram quality (weight: 20%)',
        '  - All entities shown?',
        '  - Relationships complete?',
        '  - Cardinality notation correct?',
        '  - Diagrams readable and well-formatted?',
        'Evaluate schema documentation completeness (weight: 25%)',
        '  - All entities documented?',
        '  - All fields described?',
        '  - Constraints documented?',
        '  - Examples provided?',
        'Evaluate data dictionary quality (weight: 20%)',
        '  - All fields included?',
        '  - Business definitions clear?',
        '  - Data types accurate?',
        '  - Classifications present?',
        'Evaluate data flow diagram relevance (weight: 15%)',
        '  - Data flows identified?',
        '  - Diagrams clear?',
        'Evaluate documentation organization (weight: 10%)',
        '  - Navigation clear?',
        '  - Structure logical?',
        '  - Cross-references work?',
        'Evaluate technical accuracy (weight: 10%)',
        '  - No contradictions?',
        '  - Metadata accurate?',
        '  - Diagrams match descriptions?',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and missing elements',
        'Provide specific improvement recommendations',
        'Assess compliance with documentation standards'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), completeness (object), gaps (array), recommendations (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            erDiagramQuality: { type: 'number' },
            schemaDocCompleteness: { type: 'number' },
            dataDictionaryQuality: { type: 'number' },
            dataFlowRelevance: { type: 'number' },
            documentationOrganization: { type: 'number' },
            technicalAccuracy: { type: 'number' }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            allEntitiesDocumented: { type: 'boolean' },
            allRelationshipsDocumented: { type: 'boolean' },
            allFieldsDescribed: { type: 'boolean' },
            constraintsDocumented: { type: 'boolean' },
            diagramsGenerated: { type: 'boolean' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-model-docs', 'quality-validation']
}));
