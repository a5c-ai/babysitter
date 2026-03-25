/**
 * @process MS-023: Materials Database Curation
 * @description Comprehensive materials database development including data collection,
 * validation, standardization, schema design, and quality assurance for materials informatics
 * @inputs {
 *   databaseScope: string, // property database, processing database, failure database
 *   materialClasses: string[],
 *   dataTypes: string[], // experimental, computational, literature
 *   propertyCategories: string[], // mechanical, thermal, electrical, etc.
 *   standardsCompliance: string[], // ASTM, ISO, MMPDS
 *   dataFormat: string, // JSON, XML, MatML, CSV
 *   projectContext: string
 * }
 * @outputs {
 *   databaseSchema: object,
 *   dataQualityReport: object,
 *   curatedDatasets: object,
 *   metadataStandards: object,
 *   accessProtocols: object,
 *   artifacts: string[]
 * }
 * @example
 * {
 *   "databaseScope": "mechanical-properties",
 *   "materialClasses": ["aluminum-alloys", "titanium-alloys", "nickel-superalloys"],
 *   "dataTypes": ["experimental", "literature"],
 *   "propertyCategories": ["tensile", "fatigue", "creep"],
 *   "standardsCompliance": ["MMPDS", "ASTM"],
 *   "dataFormat": "JSON"
 * }
 * @references MMPDS, MatML Standard, ICME Data Standards, Materials Genome Initiative
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    databaseScope,
    materialClasses,
    dataTypes,
    propertyCategories,
    standardsCompliance,
    dataFormat,
    projectContext
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Phase 1: Requirements and Scope Definition
  ctx.log('info', 'Phase 1: Defining database requirements and scope');
  const scopeDefinition = await ctx.task(defineScope, {
    databaseScope,
    materialClasses,
    dataTypes,
    propertyCategories,
    standardsCompliance,
    projectContext
  });
  artifacts.push(...(scopeDefinition.artifacts || []));

  // Phase 2: Schema Design
  ctx.log('info', 'Phase 2: Designing database schema');
  const schemaDesign = await ctx.task(designSchema, {
    scopeRequirements: scopeDefinition.requirements,
    materialClasses,
    propertyCategories,
    dataFormat,
    metadataRequirements: inputs.metadataRequirements,
    relationshipTypes: inputs.relationshipTypes
  });
  artifacts.push(...(schemaDesign.artifacts || []));

  // Phase 3: Data Source Identification
  ctx.log('info', 'Phase 3: Identifying and cataloging data sources');
  const dataSourceIdentification = await ctx.task(identifyDataSources, {
    materialClasses,
    propertyCategories,
    dataTypes,
    standardsCompliance,
    existingSources: inputs.existingSources
  });
  artifacts.push(...(dataSourceIdentification.artifacts || []));

  // Phase 4: Data Collection Protocol
  ctx.log('info', 'Phase 4: Developing data collection protocol');
  const collectionProtocol = await ctx.task(developCollectionProtocol, {
    dataSources: dataSourceIdentification.sources,
    schema: schemaDesign.schema,
    qualityRequirements: inputs.qualityRequirements,
    standardsCompliance
  });
  artifacts.push(...(collectionProtocol.artifacts || []));

  // Phase 5: Data Extraction and Transformation
  ctx.log('info', 'Phase 5: Extracting and transforming data');
  const dataExtraction = await ctx.task(extractTransformData, {
    dataSources: dataSourceIdentification.sources,
    schema: schemaDesign.schema,
    collectionProtocol: collectionProtocol.protocol,
    transformationRules: inputs.transformationRules
  });
  artifacts.push(...(dataExtraction.artifacts || []));

  // Phase 6: Data Validation
  ctx.log('info', 'Phase 6: Validating extracted data');
  const dataValidation = await ctx.task(validateData, {
    extractedData: dataExtraction.data,
    schema: schemaDesign.schema,
    validationRules: inputs.validationRules,
    physicalConstraints: inputs.physicalConstraints,
    standardsCompliance
  });
  artifacts.push(...(dataValidation.artifacts || []));

  // Quality Gate: Review data quality
  await ctx.breakpoint({
    question: 'Review data quality report. Are validation results acceptable for database inclusion?',
    title: 'Data Quality Review',
    context: {
      runId: ctx.runId,
      summary: {
        totalRecords: dataExtraction.recordCount,
        validRecords: dataValidation.validCount,
        invalidRecords: dataValidation.invalidCount,
        qualityScore: dataValidation.qualityScore
      },
      files: artifacts
    }
  });

  // Phase 7: Data Standardization
  ctx.log('info', 'Phase 7: Standardizing data formats and units');
  const dataStandardization = await ctx.task(standardizeData, {
    validatedData: dataValidation.validData,
    unitConversions: inputs.unitConversions,
    terminologyStandards: inputs.terminologyStandards,
    dataFormat
  });
  artifacts.push(...(dataStandardization.artifacts || []));

  // Phase 8: Uncertainty Quantification
  ctx.log('info', 'Phase 8: Quantifying data uncertainty');
  const uncertaintyQuantification = await ctx.task(quantifyUncertainty, {
    standardizedData: dataStandardization.data,
    measurementUncertainty: inputs.measurementUncertainty,
    dataProvenance: dataExtraction.provenance,
    statisticalMethods: inputs.statisticalMethods
  });
  artifacts.push(...(uncertaintyQuantification.artifacts || []));

  // Phase 9: Database Population
  ctx.log('info', 'Phase 9: Populating database with curated data');
  const databasePopulation = await ctx.task(populateDatabase, {
    curatedData: uncertaintyQuantification.dataWithUncertainty,
    schema: schemaDesign.schema,
    indexingStrategy: inputs.indexingStrategy,
    accessControls: inputs.accessControls
  });
  artifacts.push(...(databasePopulation.artifacts || []));

  // Phase 10: Documentation and Access Protocols
  ctx.log('info', 'Phase 10: Creating documentation and access protocols');
  const accessDocumentation = await ctx.task(createAccessProtocols, {
    database: databasePopulation.database,
    schema: schemaDesign.schema,
    apiRequirements: inputs.apiRequirements,
    userDocumentation: inputs.userDocumentation
  });
  artifacts.push(...(accessDocumentation.artifacts || []));

  const endTime = ctx.now();

  return {
    success: true,
    databaseSchema: {
      schemaDefinition: schemaDesign.schema,
      entityRelationships: schemaDesign.relationships,
      propertyDefinitions: schemaDesign.propertyDefs,
      metadataFields: schemaDesign.metadata,
      formatSpecification: schemaDesign.formatSpec
    },
    dataQualityReport: {
      validationResults: dataValidation.results,
      qualityMetrics: dataValidation.metrics,
      qualityScore: dataValidation.qualityScore,
      issuesFound: dataValidation.issues,
      remediationActions: dataValidation.remediation
    },
    curatedDatasets: {
      materialRecords: databasePopulation.recordCount,
      propertyData: databasePopulation.propertyStats,
      dataProvenance: dataExtraction.provenance,
      uncertainty: uncertaintyQuantification.summary,
      coverage: databasePopulation.coverageReport
    },
    metadataStandards: {
      terminologyStandards: dataStandardization.terminology,
      unitStandards: dataStandardization.units,
      provenanceTracking: dataStandardization.provenance,
      citationFormat: dataStandardization.citations
    },
    accessProtocols: {
      apiSpecification: accessDocumentation.api,
      queryInterface: accessDocumentation.queryInterface,
      exportFormats: accessDocumentation.exportFormats,
      accessControls: accessDocumentation.accessControls,
      userGuide: accessDocumentation.userGuide
    },
    artifacts,
    metadata: {
      processId: 'MS-023',
      startTime,
      endTime,
      duration: endTime - startTime
    }
  };
}

export const defineScope = defineTask('define-scope', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Database Scope Definition',
  agent: {
    name: 'database-scope-analyst',
    prompt: {
      role: 'Materials informatics specialist for database scoping',
      task: `Define scope and requirements for ${args.databaseScope} database`,
      context: args,
      instructions: [
        'Analyze database scope and objectives',
        'Define material class coverage requirements',
        'Identify required property categories and parameters',
        'Specify data quality requirements',
        'Determine standards compliance needs',
        'Identify stakeholder requirements',
        'Define interoperability requirements',
        'Document scope boundaries and exclusions'
      ],
      outputFormat: 'JSON with scope requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        scopeBoundaries: { type: 'object' },
        stakeholderNeeds: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scope', 'requirements', 'materials-informatics']
}));

export const designSchema = defineTask('design-schema', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Database Schema Design',
  agent: {
    name: 'schema-design-engineer',
    prompt: {
      role: 'Database architect for materials data systems',
      task: 'Design database schema for materials data',
      context: args,
      instructions: [
        'Design entity-relationship model for materials data',
        'Define property data structures and types',
        'Specify metadata requirements and fields',
        'Design for hierarchical material classifications',
        'Include processing-structure-property relationships',
        'Support uncertainty and statistical data',
        'Ensure schema extensibility',
        'Document schema in standard format (MatML, JSON Schema)'
      ],
      outputFormat: 'JSON with database schema'
    },
    outputSchema: {
      type: 'object',
      required: ['schema', 'relationships', 'propertyDefs', 'metadata', 'formatSpec', 'artifacts'],
      properties: {
        schema: { type: 'object' },
        relationships: { type: 'array' },
        propertyDefs: { type: 'object' },
        metadata: { type: 'object' },
        formatSpec: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'schema', 'design', 'materials-informatics']
}));

export const identifyDataSources = defineTask('identify-data-sources', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Data Source Identification',
  agent: {
    name: 'data-source-analyst',
    prompt: {
      role: 'Materials data specialist for source identification',
      task: 'Identify and catalog data sources for database',
      context: args,
      instructions: [
        'Survey handbooks and reference publications (MMPDS, etc.)',
        'Identify relevant journal literature',
        'Catalog institutional test data repositories',
        'Identify computational databases (Materials Project, etc.)',
        'Evaluate data source quality and reliability',
        'Assess data licensing and access restrictions',
        'Prioritize sources by coverage and quality',
        'Document source metadata and provenance'
      ],
      outputFormat: 'JSON with data sources catalog'
    },
    outputSchema: {
      type: 'object',
      required: ['sources', 'artifacts'],
      properties: {
        sources: { type: 'array' },
        sourceCatalog: { type: 'object' },
        qualityAssessment: { type: 'object' },
        accessRestrictions: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-sources', 'catalog', 'materials-informatics']
}));

export const developCollectionProtocol = defineTask('develop-collection-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Data Collection Protocol Development',
  agent: {
    name: 'collection-protocol-developer',
    prompt: {
      role: 'Data management specialist for collection protocols',
      task: 'Develop data collection and extraction protocol',
      context: args,
      instructions: [
        'Define data extraction procedures for each source type',
        'Specify required metadata capture',
        'Establish data entry standards and templates',
        'Define quality checks during collection',
        'Establish provenance tracking requirements',
        'Create data validation checklists',
        'Define handling of missing or uncertain data',
        'Document collection workflow and responsibilities'
      ],
      outputFormat: 'JSON with collection protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'artifacts'],
      properties: {
        protocol: { type: 'object' },
        procedures: { type: 'array' },
        templates: { type: 'object' },
        qualityChecks: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'collection', 'protocol', 'materials-informatics']
}));

export const extractTransformData = defineTask('extract-transform-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Data Extraction and Transformation',
  agent: {
    name: 'data-extraction-specialist',
    prompt: {
      role: 'Data engineer for materials data ETL',
      task: 'Extract and transform data from identified sources',
      context: args,
      instructions: [
        'Execute extraction from each data source',
        'Apply transformation rules to raw data',
        'Map source fields to schema fields',
        'Handle unit conversions during extraction',
        'Capture full provenance information',
        'Flag data requiring manual review',
        'Generate extraction logs and statistics',
        'Track data lineage throughout process'
      ],
      outputFormat: 'JSON with extracted data and provenance'
    },
    outputSchema: {
      type: 'object',
      required: ['data', 'provenance', 'recordCount', 'artifacts'],
      properties: {
        data: { type: 'object' },
        provenance: { type: 'object' },
        recordCount: { type: 'number' },
        extractionLog: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'etl', 'extraction', 'materials-informatics']
}));

export const validateData = defineTask('validate-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Data Validation',
  agent: {
    name: 'data-validation-specialist',
    prompt: {
      role: 'Data quality specialist for materials databases',
      task: 'Validate extracted data against quality criteria',
      context: args,
      instructions: [
        'Validate data against schema constraints',
        'Check physical plausibility of property values',
        'Verify consistency across related properties',
        'Check for duplicate records',
        'Validate against standard test method requirements',
        'Flag outliers for review',
        'Calculate quality metrics and scores',
        'Generate validation report with issues'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'validData', 'validCount', 'invalidCount', 'qualityScore', 'metrics', 'issues', 'remediation', 'artifacts'],
      properties: {
        results: { type: 'object' },
        validData: { type: 'object' },
        validCount: { type: 'number' },
        invalidCount: { type: 'number' },
        qualityScore: { type: 'number' },
        metrics: { type: 'object' },
        issues: { type: 'array' },
        remediation: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'validation', 'quality', 'materials-informatics']
}));

export const standardizeData = defineTask('standardize-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Data Standardization',
  agent: {
    name: 'data-standardization-specialist',
    prompt: {
      role: 'Data standards specialist for materials data',
      task: 'Standardize data formats, units, and terminology',
      context: args,
      instructions: [
        'Convert all units to standard SI or specified units',
        'Apply standard terminology and naming conventions',
        'Standardize material designations',
        'Normalize test condition descriptions',
        'Apply citation format standards',
        'Ensure provenance format consistency',
        'Generate standardization mapping documentation',
        'Create terminology glossary'
      ],
      outputFormat: 'JSON with standardized data'
    },
    outputSchema: {
      type: 'object',
      required: ['data', 'terminology', 'units', 'provenance', 'citations', 'artifacts'],
      properties: {
        data: { type: 'object' },
        terminology: { type: 'object' },
        units: { type: 'object' },
        provenance: { type: 'object' },
        citations: { type: 'object' },
        mappingDocs: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'standardization', 'terminology', 'materials-informatics']
}));

export const quantifyUncertainty = defineTask('quantify-uncertainty', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Uncertainty Quantification',
  agent: {
    name: 'uncertainty-quantification-specialist',
    prompt: {
      role: 'Statistician for materials data uncertainty',
      task: 'Quantify and document uncertainty in materials data',
      context: args,
      instructions: [
        'Assess measurement uncertainty from test methods',
        'Quantify material variability (batch, heat)',
        'Propagate uncertainty through calculations',
        'Apply statistical methods for uncertainty estimation',
        'Document uncertainty sources and magnitudes',
        'Calculate confidence intervals',
        'Handle missing uncertainty information',
        'Generate uncertainty metadata fields'
      ],
      outputFormat: 'JSON with uncertainty-quantified data'
    },
    outputSchema: {
      type: 'object',
      required: ['dataWithUncertainty', 'summary', 'artifacts'],
      properties: {
        dataWithUncertainty: { type: 'object' },
        uncertaintySources: { type: 'array' },
        confidenceIntervals: { type: 'object' },
        summary: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'uncertainty', 'statistics', 'materials-informatics']
}));

export const populateDatabase = defineTask('populate-database', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Database Population',
  agent: {
    name: 'database-population-engineer',
    prompt: {
      role: 'Database engineer for materials data loading',
      task: 'Populate database with curated materials data',
      context: args,
      instructions: [
        'Load curated data into database structure',
        'Create indexes for efficient querying',
        'Implement data integrity constraints',
        'Set up access controls and permissions',
        'Generate coverage reports by material and property',
        'Verify data integrity after loading',
        'Create backup and recovery procedures',
        'Document database population results'
      ],
      outputFormat: 'JSON with populated database info'
    },
    outputSchema: {
      type: 'object',
      required: ['database', 'recordCount', 'propertyStats', 'coverageReport', 'artifacts'],
      properties: {
        database: { type: 'object' },
        recordCount: { type: 'number' },
        propertyStats: { type: 'object' },
        coverageReport: { type: 'object' },
        integrityReport: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'database', 'population', 'materials-informatics']
}));

export const createAccessProtocols = defineTask('create-access-protocols', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Access Protocol Creation',
  agent: {
    name: 'access-protocol-developer',
    prompt: {
      role: 'API developer for materials database access',
      task: 'Create access protocols and documentation',
      context: args,
      instructions: [
        'Design API specification for data access',
        'Create query interface documentation',
        'Define export format options',
        'Implement access control policies',
        'Create user guide and tutorials',
        'Document data citation requirements',
        'Establish usage tracking and metrics',
        'Create administrator documentation'
      ],
      outputFormat: 'JSON with access protocols and documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['api', 'queryInterface', 'exportFormats', 'accessControls', 'userGuide', 'artifacts'],
      properties: {
        api: { type: 'object' },
        queryInterface: { type: 'object' },
        exportFormats: { type: 'array' },
        accessControls: { type: 'object' },
        userGuide: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api', 'documentation', 'materials-informatics']
}));
