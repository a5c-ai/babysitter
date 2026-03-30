/**
 * @process data-engineering-analytics/dimensional-model
 * @description Dimensional Model Design - Design comprehensive dimensional data warehouse models including
 * business process selection, grain definition, dimension identification, fact table design, star/snowflake
 * schema patterns, and Slowly Changing Dimension (SCD) implementation following Kimball methodology.
 * @inputs { projectName: string, businessProcesses?: array, dataSource?: object, requirements?: object }
 * @outputs { success: boolean, businessProcess: object, grain: object, dimensions: array, factTables: array, schema: object, scdStrategy: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('data-engineering-analytics/dimensional-model', {
 *   projectName: 'Sales Analytics DW',
 *   businessProcesses: ['order_fulfillment', 'customer_service', 'inventory_management'],
 *   dataSource: { type: 'OLTP', database: 'sales_db', schema: 'public' },
 *   requirements: { realTimeUpdates: true, historicalTracking: 'full', queryPerformance: 'high' }
 * });
 *
 * @references
 * - The Data Warehouse Toolkit (3rd Edition) by Ralph Kimball: https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/books/
 * - Kimball Dimensional Modeling Techniques: https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/
 * - Star Schema: The Complete Reference by Christopher Adamson: https://www.oreilly.com/library/view/star-schema-the/9780071744324/
 * - Slowly Changing Dimensions: https://en.wikipedia.org/wiki/Slowly_changing_dimension
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    businessProcesses = [],
    dataSource = {},
    requirements = {},
    outputDir = 'dimensional-model-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Business Process Selection
  ctx.log('info', 'Starting dimensional model design: Business process selection');
  const businessProcessResult = await ctx.task(businessProcessSelectionTask, {
    projectName,
    businessProcesses,
    requirements,
    outputDir
  });

  if (!businessProcessResult.success) {
    return {
      success: false,
      error: 'Business process selection failed',
      details: businessProcessResult,
      metadata: { processId: 'data-engineering-analytics/dimensional-model', timestamp: startTime }
    };
  }

  artifacts.push(...businessProcessResult.artifacts);

  // Task 2: Source System Analysis
  ctx.log('info', 'Analyzing source systems and data availability');
  const sourceAnalysis = await ctx.task(sourceSystemAnalysisTask, {
    projectName,
    dataSource,
    selectedProcesses: businessProcessResult.selectedProcesses,
    outputDir
  });

  artifacts.push(...sourceAnalysis.artifacts);

  // Task 3: Grain Definition
  ctx.log('info', 'Defining dimensional model grain');
  const grainDefinition = await ctx.task(grainDefinitionTask, {
    projectName,
    selectedProcesses: businessProcessResult.selectedProcesses,
    sourceAnalysis,
    requirements,
    outputDir
  });

  artifacts.push(...grainDefinition.artifacts);

  // Task 4: Dimension Identification
  ctx.log('info', 'Identifying dimensions and dimension attributes');
  const dimensionIdentification = await ctx.task(dimensionIdentificationTask, {
    projectName,
    grainDefinition,
    sourceAnalysis,
    requirements,
    outputDir
  });

  artifacts.push(...dimensionIdentification.artifacts);

  // Task 5: Fact Table Design
  ctx.log('info', 'Designing fact tables with measures and foreign keys');
  const factTableDesign = await ctx.task(factTableDesignTask, {
    projectName,
    grainDefinition,
    dimensions: dimensionIdentification.dimensions,
    sourceAnalysis,
    requirements,
    outputDir
  });

  artifacts.push(...factTableDesign.artifacts);

  // Task 6: Schema Pattern Selection (Star vs Snowflake)
  ctx.log('info', 'Selecting and designing schema pattern');
  const schemaDesign = await ctx.task(schemaPatternDesignTask, {
    projectName,
    dimensions: dimensionIdentification.dimensions,
    factTables: factTableDesign.factTables,
    requirements,
    outputDir
  });

  artifacts.push(...schemaDesign.artifacts);

  // Task 7: SCD (Slowly Changing Dimension) Strategy
  ctx.log('info', 'Defining SCD implementation strategies');
  const scdStrategy = await ctx.task(scdStrategyTask, {
    projectName,
    dimensions: dimensionIdentification.dimensions,
    requirements,
    outputDir
  });

  artifacts.push(...scdStrategy.artifacts);

  // Task 8: Dimension Design Validation
  ctx.log('info', 'Validating dimensional model design');
  const validationResult = await ctx.task(dimensionalModelValidationTask, {
    projectName,
    grainDefinition,
    dimensions: dimensionIdentification.dimensions,
    factTables: factTableDesign.factTables,
    schema: schemaDesign,
    scdStrategy,
    outputDir
  });

  artifacts.push(...validationResult.artifacts);

  const designValid = validationResult.isValid;

  // Breakpoint: Review dimensional model design
  await ctx.breakpoint({
    question: `Dimensional model design complete for ${projectName}. Design valid: ${designValid}. Review model?`,
    title: 'Dimensional Model Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        projectName,
        selectedProcesses: businessProcessResult.selectedProcesses.length,
        grain: grainDefinition.grainStatement,
        dimensionCount: dimensionIdentification.dimensions.length,
        factTableCount: factTableDesign.factTables.length,
        schemaType: schemaDesign.schemaType,
        scdImplementations: scdStrategy.scdTypes,
        validationPassed: designValid,
        validationIssues: validationResult.issues?.length || 0
      }
    }
  });

  // Task 9: Generate DDL Scripts
  ctx.log('info', 'Generating DDL scripts for dimensional model');
  const ddlGeneration = await ctx.task(ddlGenerationTask, {
    projectName,
    dimensions: dimensionIdentification.dimensions,
    factTables: factTableDesign.factTables,
    schema: schemaDesign,
    scdStrategy,
    dataSource,
    outputDir
  });

  artifacts.push(...ddlGeneration.artifacts);

  // Task 10: Generate ETL Specification
  ctx.log('info', 'Generating ETL/ELT specification');
  const etlSpecification = await ctx.task(etlSpecificationTask, {
    projectName,
    sourceAnalysis,
    dimensions: dimensionIdentification.dimensions,
    factTables: factTableDesign.factTables,
    scdStrategy,
    requirements,
    outputDir
  });

  artifacts.push(...etlSpecification.artifacts);

  // Task 11: Generate Documentation
  ctx.log('info', 'Generating comprehensive dimensional model documentation');
  const documentation = await ctx.task(documentationGenerationTask, {
    projectName,
    businessProcessResult,
    grainDefinition,
    dimensionIdentification,
    factTableDesign,
    schemaDesign,
    scdStrategy,
    validationResult,
    sourceAnalysis,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    businessProcess: {
      selected: businessProcessResult.selectedProcesses,
      priorityRanking: businessProcessResult.priorityRanking
    },
    grain: {
      statement: grainDefinition.grainStatement,
      atomicity: grainDefinition.atomicity,
      timeFrame: grainDefinition.timeFrame
    },
    dimensions: dimensionIdentification.dimensions.map(dim => ({
      name: dim.name,
      type: dim.type,
      scdType: dim.scdType,
      attributeCount: dim.attributes?.length || 0,
      rolePlayingDimensions: dim.rolePlayingDimensions || []
    })),
    factTables: factTableDesign.factTables.map(fact => ({
      name: fact.name,
      type: fact.type,
      measureCount: fact.measures?.length || 0,
      dimensionCount: fact.dimensionKeys?.length || 0,
      grain: fact.grain
    })),
    schema: {
      type: schemaDesign.schemaType,
      starSchemas: schemaDesign.starSchemas || [],
      snowflakeSchemas: schemaDesign.snowflakeSchemas || [],
      constellations: schemaDesign.constellations || []
    },
    scdStrategy: {
      scdTypes: scdStrategy.scdTypes,
      implementationPatterns: scdStrategy.implementationPatterns,
      trackingFields: scdStrategy.trackingFields
    },
    validation: {
      isValid: validationResult.isValid,
      issuesFound: validationResult.issues?.length || 0,
      warningsFound: validationResult.warnings?.length || 0,
      recommendations: validationResult.recommendations || []
    },
    artifacts,
    duration,
    metadata: {
      processId: 'data-engineering-analytics/dimensional-model',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Business Process Selection
export const businessProcessSelectionTask = defineTask('business-process-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select and prioritize business processes for dimensional modeling',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'business intelligence architect',
      task: 'Analyze and select optimal business processes for dimensional modeling',
      context: args,
      instructions: [
        'Review provided business processes or identify from project requirements',
        'Evaluate each process based on: business value, data availability, complexity, stakeholder priority',
        'Apply Kimball\'s business process selection criteria',
        'Consider process scope: too broad vs too granular',
        'Identify cross-process analysis opportunities (constellation schemas)',
        'Recommend priority order for implementation (start with high-value, data-ready processes)',
        'Document business process matrix',
        'Identify key business events and metrics for each process',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with selected processes, priority ranking, business value assessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'selectedProcesses', 'priorityRanking', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        selectedProcesses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              businessValue: { type: 'string', enum: ['high', 'medium', 'low'] },
              complexity: { type: 'string', enum: ['high', 'medium', 'low'] },
              dataReadiness: { type: 'string', enum: ['ready', 'partial', 'not-ready'] },
              keyEvents: { type: 'array', items: { type: 'string' } },
              keyMetrics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        priorityRanking: { type: 'array', items: { type: 'string' } },
        processMatrix: { type: 'string' },
        constellationOpportunities: { type: 'array', items: { type: 'string' } },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dimensional-modeling', 'business-process', 'analysis']
}));

// Task 2: Source System Analysis
export const sourceSystemAnalysisTask = defineTask('source-system-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze source systems and data availability',
  agent: {
    name: 'data-engineer',
    prompt: {
      role: 'data engineer',
      task: 'Analyze source systems to understand data availability and quality',
      context: args,
      instructions: [
        'Identify all source systems for selected business processes',
        'Catalog available tables, views, and data entities',
        'Document data freshness, update frequency, and latency',
        'Assess data quality: completeness, consistency, accuracy',
        'Identify primary keys, foreign keys, and relationships',
        'Document business rules and transformations in source systems',
        'Map source fields to potential dimension attributes and fact measures',
        'Identify data gaps and recommend remediation',
        'Create source-to-target mapping framework',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with source systems, available data, quality assessment, field mappings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sourceSystems', 'dataQuality', 'fieldMappings', 'artifacts'],
      properties: {
        sourceSystems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              tables: { type: 'array', items: { type: 'string' } },
              updateFrequency: { type: 'string' },
              dataLatency: { type: 'string' }
            }
          }
        },
        dataQuality: {
          type: 'object',
          properties: {
            completenessScore: { type: 'number' },
            consistencyScore: { type: 'number' },
            accuracyScore: { type: 'number' },
            issues: { type: 'array', items: { type: 'string' } }
          }
        },
        fieldMappings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceField: { type: 'string' },
              sourceTable: { type: 'string' },
              targetType: { type: 'string', enum: ['dimension-attribute', 'fact-measure', 'key'] },
              transformationNeeded: { type: 'boolean' }
            }
          }
        },
        dataGaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dimensional-modeling', 'source-analysis', 'data-quality']
}));

// Task 3: Grain Definition
export const grainDefinitionTask = defineTask('grain-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define dimensional model grain',
  agent: {
    name: 'data-architect',
    prompt: {
      role: 'data warehouse architect',
      task: 'Define the grain (level of detail) for fact tables in dimensional model',
      context: args,
      instructions: [
        'Apply Kimball\'s grain declaration principle: "What does a single row in the fact table represent?"',
        'Define grain for each business process',
        'Choose between: transaction grain (most atomic), periodic snapshot, accumulating snapshot',
        'Ensure grain is at the lowest practical atomic level',
        'Consider query performance vs storage tradeoffs',
        'Document time dimensionality (transaction time, effective time, decision time)',
        'Validate grain supports all required business questions',
        'Ensure grain is consistent across related fact tables',
        'Document grain statement clearly (e.g., "One row per order line item per day")',
        'Identify any aggregated/summarized fact tables needed',
        'Save grain definitions to output directory'
      ],
      outputFormat: 'JSON with grain statement, grain type, time dimensionality, validation results, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['grainStatement', 'grainType', 'atomicity', 'artifacts'],
      properties: {
        grainStatement: { type: 'string' },
        grainType: {
          type: 'string',
          enum: ['transaction', 'periodic-snapshot', 'accumulating-snapshot', 'factless']
        },
        atomicity: { type: 'string', enum: ['atomic', 'aggregated', 'hybrid'] },
        timeFrame: {
          type: 'object',
          properties: {
            transactionTime: { type: 'boolean' },
            effectiveTime: { type: 'boolean' },
            decisionTime: { type: 'boolean' },
            granularity: { type: 'string' }
          }
        },
        businessQuestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              supportedByGrain: { type: 'boolean' }
            }
          }
        },
        tradeoffs: {
          type: 'object',
          properties: {
            storageImpact: { type: 'string' },
            queryPerformance: { type: 'string' },
            etlComplexity: { type: 'string' }
          }
        },
        aggregateTables: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dimensional-modeling', 'grain-definition', 'architecture']
}));

// Task 4: Dimension Identification
export const dimensionIdentificationTask = defineTask('dimension-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify dimensions and dimension attributes',
  agent: {
    name: 'data-modeler',
    prompt: {
      role: 'dimensional data modeler',
      task: 'Identify all dimensions and their attributes for the dimensional model',
      context: args,
      instructions: [
        'Identify dimensions based on business process context (Who, What, Where, When, Why, How)',
        'Design conformed dimensions for enterprise-wide consistency',
        'Identify dimension types: standard, junk (flags/indicators), degenerate (fact-embedded), role-playing',
        'Define dimension attributes: descriptive, hierarchical, audit fields',
        'Design dimension hierarchies (drill-down paths)',
        'Include surrogate keys for all dimensions',
        'Add audit columns: effective_date, expiration_date, current_flag, version_number',
        'Identify outrigger dimensions (normalized attributes)',
        'Design bridge tables for many-to-many relationships',
        'Include natural keys and business keys',
        'Plan for unknown/missing dimension members',
        'Document dimension attribute sources',
        'Consider dimension attribute cardinality',
        'Save dimension designs to output directory'
      ],
      outputFormat: 'JSON with dimensions array, dimension hierarchies, relationships, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dimensions', 'conformedDimensions', 'artifacts'],
      properties: {
        dimensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: {
                type: 'string',
                enum: ['standard', 'junk', 'degenerate', 'role-playing', 'outrigger', 'bridge']
              },
              businessKey: { type: 'string' },
              surrogateKey: { type: 'string' },
              attributes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    dataType: { type: 'string' },
                    description: { type: 'string' },
                    sourceField: { type: 'string' },
                    cardinality: { type: 'string' }
                  }
                }
              },
              hierarchies: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    levels: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              scdType: { type: 'string' },
              rolePlayingDimensions: { type: 'array', items: { type: 'string' } },
              auditFields: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        conformedDimensions: { type: 'array', items: { type: 'string' } },
        bridgeTables: { type: 'array', items: { type: 'object' } },
        dimensionRelationships: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dimensional-modeling', 'dimensions', 'design']
}));

// Task 5: Fact Table Design
export const factTableDesignTask = defineTask('fact-table-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design fact tables with measures and foreign keys',
  agent: {
    name: 'fact-designer',
    prompt: {
      role: 'data warehouse architect',
      task: 'Design fact tables including measures, foreign keys, and fact types',
      context: args,
      instructions: [
        'Design fact tables aligned with defined grain',
        'Include foreign keys to all relevant dimensions',
        'Identify fact measures: additive, semi-additive, non-additive',
        'Include degenerate dimensions (transaction numbers) directly in fact table',
        'Add audit columns: load_date, source_system_id, batch_id',
        'Design fact table types: transaction, periodic snapshot, accumulating snapshot, factless',
        'Consider factless fact tables for events without measures',
        'Include count measure for all fact tables',
        'Design aggregate fact tables for performance',
        'Plan for late-arriving facts and dimensions',
        'Document measure calculation rules and business logic',
        'Consider measure null handling and default values',
        'Identify derived/calculated measures',
        'Save fact table designs to output directory'
      ],
      outputFormat: 'JSON with fact tables, measures, foreign keys, business rules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['factTables', 'artifacts'],
      properties: {
        factTables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: {
                type: 'string',
                enum: ['transaction', 'periodic-snapshot', 'accumulating-snapshot', 'factless', 'aggregate']
              },
              grain: { type: 'string' },
              measures: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    dataType: { type: 'string' },
                    aggregationType: {
                      type: 'string',
                      enum: ['additive', 'semi-additive', 'non-additive']
                    },
                    description: { type: 'string' },
                    businessRule: { type: 'string' },
                    sourceField: { type: 'string' },
                    nullHandling: { type: 'string' }
                  }
                }
              },
              dimensionKeys: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    dimensionName: { type: 'string' },
                    foreignKey: { type: 'string' },
                    rolePlayingName: { type: 'string' }
                  }
                }
              },
              degenerateDimensions: { type: 'array', items: { type: 'string' } },
              auditFields: { type: 'array', items: { type: 'string' } },
              calculatedMeasures: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    formula: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        aggregateFactTables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              baseFactTable: { type: 'string' },
              aggregationLevel: { type: 'string' },
              droppedDimensions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        lateArrivingStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dimensional-modeling', 'fact-tables', 'design']
}));

// Task 6: Schema Pattern Design (Star vs Snowflake)
export const schemaPatternDesignTask = defineTask('schema-pattern-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design star or snowflake schema pattern',
  agent: {
    name: 'schema-designer',
    prompt: {
      role: 'data warehouse architect',
      task: 'Design optimal schema pattern (star, snowflake, or galaxy/constellation)',
      context: args,
      instructions: [
        'Evaluate star schema (denormalized dimensions) vs snowflake schema (normalized dimensions)',
        'Star schema benefits: simpler queries, better performance, easier for BI tools',
        'Snowflake benefits: reduced storage, easier maintenance for complex hierarchies',
        'Recommend star schema as default (Kimball best practice)',
        'Use snowflake only for dimensions with complex hierarchies and high cardinality',
        'Design galaxy/constellation schema for multiple fact tables sharing dimensions',
        'Document schema relationships and foreign key constraints',
        'Create schema diagrams showing fact-dimension relationships',
        'Plan for dimension outriggers only when necessary',
        'Ensure all foreign keys reference surrogate keys',
        'Document indexing strategy for fact and dimension tables',
        'Plan for referential integrity enforcement',
        'Save schema designs and diagrams to output directory'
      ],
      outputFormat: 'JSON with schema type, relationships, design rationale, diagrams, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schemaType', 'relationships', 'artifacts'],
      properties: {
        schemaType: {
          type: 'string',
          enum: ['star', 'snowflake', 'constellation', 'hybrid']
        },
        starSchemas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factTable: { type: 'string' },
              dimensions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        snowflakeSchemas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factTable: { type: 'string' },
              dimensions: { type: 'array', items: { type: 'string' } },
              normalizedDimensions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    dimensionName: { type: 'string' },
                    outriggers: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          }
        },
        constellations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              factTables: { type: 'array', items: { type: 'string' } },
              sharedDimensions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fromTable: { type: 'string' },
              toTable: { type: 'string' },
              foreignKey: { type: 'string' },
              primaryKey: { type: 'string' },
              cardinality: { type: 'string' }
            }
          }
        },
        designRationale: { type: 'string' },
        indexingStrategy: {
          type: 'object',
          properties: {
            factTableIndexes: { type: 'array', items: { type: 'string' } },
            dimensionTableIndexes: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'dimensional-modeling', 'schema-design', 'star-snowflake']
}));

// Task 7: SCD (Slowly Changing Dimension) Strategy
export const scdStrategyTask = defineTask('scd-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define SCD implementation strategies',
  agent: {
    name: 'scd-architect',
    prompt: {
      role: 'data warehouse architect',
      task: 'Define Slowly Changing Dimension (SCD) implementation strategies for all dimensions',
      context: args,
      instructions: [
        'Evaluate each dimension for change tracking requirements',
        'Select SCD type for each dimension:',
        '  - Type 0: Retain original (no changes allowed)',
        '  - Type 1: Overwrite (no history)',
        '  - Type 2: Add new row (full history) - MOST COMMON',
        '  - Type 3: Add new column (limited history)',
        '  - Type 4: Add mini-dimension or history table',
        '  - Type 6: Hybrid (combination of Type 1, 2, 3)',
        'For Type 2 (recommended): add effective_date, expiration_date, current_flag, version_number',
        'For Type 3: identify which attributes need previous value column',
        'For Type 4: design history table structure',
        'Consider business requirements for historical tracking',
        'Balance storage costs vs analytical needs',
        'Document SCD implementation patterns for ETL',
        'Design surrogate key generation strategy',
        'Plan for dimension member inserts, updates, and late arrivals',
        'Save SCD strategies to output directory'
      ],
      outputFormat: 'JSON with SCD types per dimension, implementation patterns, tracking fields, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scdTypes', 'implementationPatterns', 'artifacts'],
      properties: {
        scdTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimensionName: { type: 'string' },
              scdType: {
                type: 'string',
                enum: ['type-0', 'type-1', 'type-2', 'type-3', 'type-4', 'type-6']
              },
              rationale: { type: 'string' },
              attributes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    attributeName: { type: 'string' },
                    scdType: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        implementationPatterns: {
          type: 'object',
          properties: {
            type2Pattern: {
              type: 'object',
              properties: {
                trackingFields: { type: 'array', items: { type: 'string' } },
                expirationStrategy: { type: 'string' },
                currentFlagLogic: { type: 'string' }
              }
            },
            type3Pattern: {
              type: 'object',
              properties: {
                previousValueColumns: { type: 'array', items: { type: 'string' } }
              }
            },
            type4Pattern: {
              type: 'object',
              properties: {
                historyTableStructure: { type: 'object' }
              }
            }
          }
        },
        trackingFields: {
          type: 'object',
          properties: {
            effectiveDateField: { type: 'string' },
            expirationDateField: { type: 'string' },
            currentFlagField: { type: 'string' },
            versionNumberField: { type: 'string' },
            recordSourceField: { type: 'string' },
            recordLoadDateField: { type: 'string' }
          }
        },
        surrogateKeyStrategy: {
          type: 'object',
          properties: {
            generationMethod: { type: 'string', enum: ['sequence', 'identity', 'hash', 'uuid'] },
            keyFormat: { type: 'string' }
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
  labels: ['agent', 'dimensional-modeling', 'scd', 'history-tracking']
}));

// Task 8: Dimensional Model Validation
export const dimensionalModelValidationTask = defineTask('dimensional-model-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate dimensional model design',
  agent: {
    name: 'validation-architect',
    prompt: {
      role: 'senior data warehouse architect',
      task: 'Validate dimensional model against Kimball best practices and business requirements',
      context: args,
      instructions: [
        'Validate grain definition: clear, atomic, consistent',
        'Check all dimensions have surrogate keys',
        'Verify fact measures are properly classified (additive, semi-additive, non-additive)',
        'Ensure all foreign keys in fact tables reference valid dimensions',
        'Validate SCD implementations are appropriate for business needs',
        'Check for conformed dimensions across fact tables',
        'Verify dimension hierarchies are properly defined',
        'Validate schema follows star/snowflake best practices',
        'Check for missing dimensions or measures',
        'Ensure audit fields are included',
        'Validate naming conventions are consistent',
        'Check for potential performance issues',
        'Verify all business requirements are supported',
        'Validate against Kimball dimensional modeling patterns',
        'Generate validation report with issues, warnings, and recommendations',
        'Save validation results to output directory'
      ],
      outputFormat: 'JSON with validation status, issues, warnings, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isValid', 'artifacts'],
      properties: {
        isValid: { type: 'boolean' },
        validationChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              checkName: { type: 'string' },
              passed: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' },
              description: { type: 'string' },
              affectedObjects: { type: 'array', items: { type: 'string' } },
              recommendation: { type: 'string' }
            }
          }
        },
        warnings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              description: { type: 'string' },
              suggestion: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        bestPracticeCompliance: {
          type: 'object',
          properties: {
            kimballPrinciples: { type: 'number' },
            namingConventions: { type: 'number' },
            performanceOptimization: { type: 'number' },
            maintainability: { type: 'number' }
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
  labels: ['agent', 'dimensional-modeling', 'validation', 'quality-assurance']
}));

// Task 9: DDL Generation
export const ddlGenerationTask = defineTask('ddl-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate DDL scripts for dimensional model',
  agent: {
    name: 'ddl-generator',
    prompt: {
      role: 'database engineer',
      task: 'Generate DDL scripts to create dimensional model database objects',
      context: args,
      instructions: [
        'Generate CREATE TABLE statements for all dimensions with:',
        '  - Surrogate key (primary key)',
        '  - Business key (natural key)',
        '  - All dimension attributes with appropriate data types',
        '  - SCD tracking fields (effective_date, expiration_date, current_flag, version)',
        '  - Audit fields (created_date, updated_date, created_by)',
        'Generate CREATE TABLE statements for all fact tables with:',
        '  - Foreign keys to all dimensions',
        '  - All measures with appropriate data types and precision',
        '  - Degenerate dimensions',
        '  - Audit fields',
        'Create indexes on:',
        '  - All foreign keys in fact tables',
        '  - Surrogate keys and business keys in dimensions',
        '  - SCD tracking fields (current_flag, effective_date)',
        '  - Frequently queried dimension attributes',
        'Add foreign key constraints with appropriate ON DELETE/UPDATE actions',
        'Include comments/descriptions for tables and columns',
        'Generate scripts for target database platform (PostgreSQL, Snowflake, BigQuery, Redshift)',
        'Include separate files: create-dimensions.sql, create-facts.sql, create-indexes.sql, create-constraints.sql',
        'Save all DDL scripts to output directory'
      ],
      outputFormat: 'JSON with generated DDL files, database platform, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ddlFiles', 'databasePlatform', 'artifacts'],
      properties: {
        ddlFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fileName: { type: 'string' },
              filePath: { type: 'string' },
              objectType: { type: 'string', enum: ['dimension', 'fact', 'index', 'constraint', 'view'] },
              objectCount: { type: 'number' }
            }
          }
        },
        databasePlatform: { type: 'string' },
        totalTables: { type: 'number' },
        totalIndexes: { type: 'number' },
        totalConstraints: { type: 'number' },
        estimatedStorageSize: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dimensional-modeling', 'ddl', 'database']
}));

// Task 10: ETL Specification
export const etlSpecificationTask = defineTask('etl-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate ETL/ELT specification',
  agent: {
    name: 'etl-architect',
    prompt: {
      role: 'ETL architect',
      task: 'Design ETL/ELT specification for loading dimensional model',
      context: args,
      instructions: [
        'Design dimension load strategy:',
        '  - Initial dimension population',
        '  - Incremental dimension updates',
        '  - SCD Type 2 processing logic (expire old row, insert new row)',
        '  - Surrogate key lookup and assignment',
        '  - Unknown member handling (-1 key)',
        'Design fact table load strategy:',
        '  - Dimension key lookup process',
        '  - Late-arriving dimension handling',
        '  - Fact measure calculations and derivations',
        '  - Incremental vs full refresh approach',
        'Define data quality checks:',
        '  - Source data validation',
        '  - Referential integrity checks',
        '  - Business rule validation',
        '  - Reconciliation with source systems',
        'Design error handling and logging',
        'Define load frequency and scheduling',
        'Plan for data lineage tracking',
        'Design rollback and recovery procedures',
        'Document transformation rules',
        'Create ETL/ELT workflow diagrams',
        'Save ETL specification to output directory'
      ],
      outputFormat: 'JSON with ETL workflows, load strategies, data quality rules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dimensionLoads', 'factLoads', 'artifacts'],
      properties: {
        dimensionLoads: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimensionName: { type: 'string' },
              loadType: { type: 'string', enum: ['full', 'incremental'] },
              scdProcessing: { type: 'string' },
              sourceQuery: { type: 'string' },
              transformations: { type: 'array', items: { type: 'string' } },
              loadFrequency: { type: 'string' }
            }
          }
        },
        factLoads: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factTableName: { type: 'string' },
              loadType: { type: 'string', enum: ['full', 'incremental'] },
              sourceQuery: { type: 'string' },
              dimensionLookups: { type: 'array', items: { type: 'string' } },
              measureCalculations: { type: 'array', items: { type: 'object' } },
              loadFrequency: { type: 'string' }
            }
          }
        },
        dataQualityRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ruleName: { type: 'string' },
              ruleType: { type: 'string' },
              description: { type: 'string' },
              validationLogic: { type: 'string' },
              action: { type: 'string', enum: ['reject', 'correct', 'flag', 'alert'] }
            }
          }
        },
        errorHandling: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            errorLogging: { type: 'string' },
            alerting: { type: 'string' },
            recoveryProcedure: { type: 'string' }
          }
        },
        schedule: {
          type: 'object',
          properties: {
            dimensionLoadSchedule: { type: 'string' },
            factLoadSchedule: { type: 'string' },
            dependencies: { type: 'array', items: { type: 'string' } }
          }
        },
        lateArrivingDataStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dimensional-modeling', 'etl', 'data-integration']
}));

// Task 11: Documentation Generation
export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive dimensional model documentation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'technical writer and data architect',
      task: 'Generate comprehensive dimensional model documentation',
      context: args,
      instructions: [
        'Create dimensional model design document with:',
        '  - Executive summary',
        '  - Business process overview',
        '  - Grain definition',
        '  - Dimensional model diagram (star/snowflake schema)',
        '  - Dimension specifications (all attributes, hierarchies, SCD types)',
        '  - Fact table specifications (all measures, foreign keys)',
        '  - Schema design rationale',
        '  - SCD implementation guide',
        '  - ETL/ELT specifications',
        '  - Data quality rules',
        '  - Naming conventions',
        '  - Performance optimization strategies',
        '  - Maintenance procedures',
        '  - Query examples for common business questions',
        'Create data dictionary:',
        '  - All tables and columns with descriptions',
        '  - Data types, constraints, and defaults',
        '  - Business keys and surrogate keys',
        '  - Source system mappings',
        'Create BI developer guide:',
        '  - How to query the dimensional model',
        '  - Join patterns',
        '  - Common metrics and calculations',
        '  - Performance best practices',
        'Format as professional Markdown documentation',
        'Save all documentation to output directory'
      ],
      outputFormat: 'JSON with documentation files, key artifacts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationFiles', 'artifacts'],
      properties: {
        documentationFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fileName: { type: 'string' },
              filePath: { type: 'string' },
              docType: {
                type: 'string',
                enum: ['design-document', 'data-dictionary', 'bi-guide', 'etl-spec', 'diagram']
              }
            }
          }
        },
        keyFindings: { type: 'array', items: { type: 'string' } },
        designHighlights: { type: 'array', items: { type: 'string' } },
        implementationNotes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dimensional-modeling', 'documentation', 'knowledge-sharing']
}));
