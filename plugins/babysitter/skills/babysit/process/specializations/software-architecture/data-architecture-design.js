/**
 * @process specializations/software-architecture/data-architecture-design
 * @description Data Architecture Design - Design comprehensive data architecture including data models,
 * storage technologies, data flow patterns, governance policies, security measures, and migration strategies
 * with quality gates and iterative refinement.
 * @inputs { projectName: string, requirements?: object, existingArchitecture?: object, constraints?: object }
 * @outputs { success: boolean, dataModels: object, storageArchitecture: object, dataFlow: object, governance: object, security: object, migrationPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/software-architecture/data-architecture-design', {
 *   projectName: 'E-Commerce Platform',
 *   requirements: { dataVolumeTB: 5, transactionsPerSecond: 10000, analyticsRequirements: true },
 *   existingArchitecture: { databases: ['PostgreSQL', 'MongoDB'], dataWarehouse: 'Snowflake' },
 *   constraints: { budget: '$100K/year', compliance: ['GDPR', 'PCI-DSS'], timeline: '6 months' }
 * });
 *
 * @references
 * - Designing Data-Intensive Applications by Martin Kleppmann: https://dataintensive.net/
 * - Data Architecture: A Primer for the Data Scientist: https://www.oreilly.com/library/view/data-architecture-a/9780128025109/
 * - The Data Warehouse Toolkit by Ralph Kimball: https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/books/
 * - Data Modeling Made Simple by Steve Hoberman: https://www.dataversity.net/data-modeling-made-simple/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    requirements = {},
    existingArchitecture = {},
    constraints = {}
  } = inputs;

  // Phase 1: Data Requirements Analysis
  const dataRequirements = await ctx.task(dataRequirementsAnalysisTask, {
    projectName,
    requirements,
    existingArchitecture,
    constraints
  });

  // Quality Gate: Must identify all data domains and entities
  if (!dataRequirements.dataDomains || dataRequirements.dataDomains.length === 0) {
    return {
      success: false,
      error: 'No data domains identified. Cannot proceed without understanding data domains.',
      phase: 'data-requirements-analysis',
      dataRequirements: null
    };
  }

  // Breakpoint: Review data requirements
  await ctx.breakpoint({
    question: `Review data requirements for ${projectName}. Identified ${dataRequirements.dataDomains.length} data domains and ${dataRequirements.entities.length} entities. Are requirements complete?`,
    title: 'Data Requirements Review',
    context: {
      runId: ctx.runId,
      projectName,
      requirements: dataRequirements,
      files: [{
        path: 'artifacts/phase1-data-requirements.json',
        format: 'json',
        content: dataRequirements
      }, {
        path: 'artifacts/phase1-data-requirements-report.md',
        format: 'markdown',
        content: dataRequirements.requirementsReport
      }]
    }
  });

  // Phase 2: Conceptual Data Model Design
  const conceptualModel = await ctx.task(conceptualDataModelTask, {
    projectName,
    dataRequirements,
    existingArchitecture
  });

  // Phase 3: Logical Data Model Design
  const logicalModel = await ctx.task(logicalDataModelTask, {
    projectName,
    conceptualModel,
    dataRequirements,
    requirements
  });

  // Breakpoint: Review data models
  await ctx.breakpoint({
    question: `Review data models for ${projectName}. Conceptual model defines ${conceptualModel.entities.length} entities. Logical model includes ${logicalModel.tables?.length || logicalModel.collections?.length || 0} tables/collections. Approve?`,
    title: 'Data Models Review',
    context: {
      runId: ctx.runId,
      projectName,
      conceptualModel,
      logicalModel,
      files: [{
        path: 'artifacts/phase2-conceptual-model.json',
        format: 'json',
        content: conceptualModel
      }, {
        path: 'artifacts/phase3-logical-model.json',
        format: 'json',
        content: logicalModel
      }, {
        path: 'artifacts/phase3-logical-model-diagram.md',
        format: 'markdown',
        content: logicalModel.diagram
      }]
    }
  });

  // Phase 4: Storage Technology Selection (Parallel evaluation of candidates)
  const storageCandidates = await ctx.task(storageSelectionTask, {
    projectName,
    logicalModel,
    dataRequirements,
    requirements,
    constraints
  });

  const detailedStorageEvaluations = await ctx.parallel.all(
    storageCandidates.candidates.slice(0, 3).map((candidate, index) =>
      () => ctx.task(storageEvaluationTask, {
        projectName,
        candidateIndex: index + 1,
        candidate,
        logicalModel,
        dataRequirements,
        requirements,
        constraints
      })
    )
  );

  // Phase 5: Storage Architecture Design
  const storageArchitecture = await ctx.task(storageArchitectureTask, {
    projectName,
    storageCandidates,
    detailedStorageEvaluations,
    logicalModel,
    dataRequirements,
    constraints
  });

  // Quality Gate: Storage architecture must address scalability, availability, and consistency
  const requiredAttributes = ['scalability', 'availability', 'consistency'];
  const missingAttributes = requiredAttributes.filter(
    attr => !storageArchitecture.qualityAttributes?.[attr]
  );

  if (missingAttributes.length > 0) {
    await ctx.breakpoint({
      question: `Storage architecture missing quality attributes: ${missingAttributes.join(', ')}. Should we refine the architecture?`,
      title: 'Storage Architecture Quality Gate Warning',
      context: {
        runId: ctx.runId,
        projectName,
        missingAttributes,
        recommendation: 'Define scalability, availability, and consistency strategies'
      }
    });
  }

  // Breakpoint: Review storage architecture
  await ctx.breakpoint({
    question: `Review storage architecture for ${projectName}. Recommended: ${storageArchitecture.recommendation.primaryDatabase} with ${storageArchitecture.recommendation.additionalStores?.length || 0} additional stores. Approve?`,
    title: 'Storage Architecture Review',
    context: {
      runId: ctx.runId,
      projectName,
      architecture: storageArchitecture,
      files: [{
        path: 'artifacts/phase5-storage-architecture.json',
        format: 'json',
        content: storageArchitecture
      }, {
        path: 'artifacts/phase5-storage-architecture-diagram.md',
        format: 'markdown',
        content: storageArchitecture.architectureDiagram
      }]
    }
  });

  // Phase 6: Physical Data Model Design
  const physicalModel = await ctx.task(physicalDataModelTask, {
    projectName,
    logicalModel,
    storageArchitecture,
    dataRequirements,
    requirements
  });

  // Phase 7: Data Flow Design
  const dataFlow = await ctx.task(dataFlowDesignTask, {
    projectName,
    physicalModel,
    storageArchitecture,
    dataRequirements,
    requirements
  });

  // Phase 8: Data Integration Architecture
  const dataIntegration = await ctx.task(dataIntegrationTask, {
    projectName,
    dataFlow,
    storageArchitecture,
    existingArchitecture,
    requirements
  });

  // Phase 9: Data Governance Design
  const dataGovernance = await ctx.task(dataGovernanceTask, {
    projectName,
    physicalModel,
    storageArchitecture,
    dataRequirements,
    constraints
  });

  // Phase 10: Data Security Design
  const dataSecurity = await ctx.task(dataSecurityTask, {
    projectName,
    physicalModel,
    storageArchitecture,
    dataGovernance,
    constraints
  });

  // Quality Gate: Security must address compliance requirements
  if (constraints.compliance && constraints.compliance.length > 0) {
    const addressedCompliance = dataSecurity.complianceControls?.map(c => c.standard) || [];
    const missingCompliance = constraints.compliance.filter(
      c => !addressedCompliance.includes(c)
    );

    if (missingCompliance.length > 0) {
      await ctx.breakpoint({
        question: `Security design missing compliance controls for: ${missingCompliance.join(', ')}. Should we add these controls?`,
        title: 'Compliance Gap Warning',
        context: {
          runId: ctx.runId,
          projectName,
          missingCompliance,
          recommendation: 'Add compliance controls for all required standards'
        }
      });
    }
  }

  // Breakpoint: Review governance and security
  await ctx.breakpoint({
    question: `Review data governance and security for ${projectName}. Governance policies: ${dataGovernance.policies?.length || 0}. Security controls: ${dataSecurity.controls?.length || 0}. Approve?`,
    title: 'Governance and Security Review',
    context: {
      runId: ctx.runId,
      projectName,
      governance: dataGovernance,
      security: dataSecurity,
      files: [{
        path: 'artifacts/phase9-data-governance.json',
        format: 'json',
        content: dataGovernance
      }, {
        path: 'artifacts/phase10-data-security.json',
        format: 'json',
        content: dataSecurity
      }]
    }
  });

  // Phase 11: Data Migration Strategy (if existing architecture)
  let dataMigration = null;
  if (existingArchitecture && Object.keys(existingArchitecture).length > 0) {
    dataMigration = await ctx.task(dataMigrationTask, {
      projectName,
      existingArchitecture,
      physicalModel,
      storageArchitecture,
      dataRequirements,
      constraints
    });

    // Quality Gate: Migration must have rollback strategy
    if (!dataMigration.rollbackStrategy) {
      await ctx.breakpoint({
        question: `Migration plan lacks rollback strategy. Should we develop one before proceeding?`,
        title: 'Migration Rollback Missing',
        context: {
          runId: ctx.runId,
          projectName,
          migration: dataMigration,
          recommendation: 'Always include rollback strategy for data migrations'
        }
      });
    }
  }

  // Phase 12: Performance Optimization Strategy
  const performanceStrategy = await ctx.task(performanceOptimizationTask, {
    projectName,
    physicalModel,
    storageArchitecture,
    dataFlow,
    requirements
  });

  // Phase 13: Disaster Recovery and Backup Strategy
  const drStrategy = await ctx.task(disasterRecoveryTask, {
    projectName,
    storageArchitecture,
    dataRequirements,
    constraints
  });

  // Phase 14: Implementation Roadmap
  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    projectName,
    physicalModel,
    storageArchitecture,
    dataFlow,
    dataIntegration,
    dataGovernance,
    dataSecurity,
    dataMigration,
    performanceStrategy,
    drStrategy,
    constraints
  });

  // Phase 15: Risk Analysis
  const riskAnalysis = await ctx.task(dataArchitectureRiskAnalysisTask, {
    projectName,
    storageArchitecture,
    dataMigration,
    implementationRoadmap,
    constraints
  });

  // Quality Gate: Critical risks must have mitigation plans
  const criticalRisksWithoutMitigation = riskAnalysis.risks.filter(
    risk => risk.severity === 'critical' && !risk.mitigationPlan
  );

  if (criticalRisksWithoutMitigation.length > 0) {
    await ctx.breakpoint({
      question: `${criticalRisksWithoutMitigation.length} critical risks lack mitigation plans. Should we develop mitigation strategies before proceeding?`,
      title: 'Critical Risk Warning',
      context: {
        runId: ctx.runId,
        projectName,
        criticalRisks: criticalRisksWithoutMitigation,
        recommendation: 'Develop mitigation strategies for all critical risks'
      }
    });
  }

  // Final Breakpoint: Architecture Design Approval
  await ctx.breakpoint({
    question: `Data Architecture Design complete for ${projectName}. Storage: ${storageArchitecture.recommendation.primaryDatabase}. Timeline: ${implementationRoadmap.timeline.totalDuration}. Cost: ${implementationRoadmap.cost.total}. Approve to proceed?`,
    title: 'Data Architecture Design Approval',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        storageArchitecture: storageArchitecture.recommendation,
        dataDomains: dataRequirements.dataDomains.length,
        entities: conceptualModel.entities.length,
        estimatedTimeline: implementationRoadmap.timeline.totalDuration,
        estimatedCost: implementationRoadmap.cost.total
      },
      files: [
        { path: 'artifacts/final-data-architecture.json', format: 'json', content: storageArchitecture },
        { path: 'artifacts/final-data-architecture.md', format: 'markdown', content: implementationRoadmap.architectureDocument },
        { path: 'artifacts/implementation-roadmap.md', format: 'markdown', content: implementationRoadmap.roadmapMarkdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    dataModels: {
      conceptual: conceptualModel,
      logical: logicalModel,
      physical: physicalModel
    },
    storageArchitecture: storageArchitecture,
    dataFlow: dataFlow,
    dataIntegration: dataIntegration,
    governance: dataGovernance,
    security: dataSecurity,
    migrationPlan: dataMigration,
    performanceStrategy: performanceStrategy,
    disasterRecovery: drStrategy,
    implementationPlan: implementationRoadmap,
    risks: riskAnalysis,
    nextSteps: implementationRoadmap.phases,
    metadata: {
      processId: 'specializations/software-architecture/data-architecture-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const dataRequirementsAnalysisTask = defineTask('data-requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Data Requirements Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Architect with expertise in requirements elicitation and analysis',
      task: 'Analyze and document comprehensive data requirements for the system',
      context: {
        projectName: args.projectName,
        requirements: args.requirements,
        existingArchitecture: args.existingArchitecture,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify data domains (customer, product, order, inventory, analytics, etc.)',
        '2. List core entities and their attributes within each domain',
        '3. Identify data sources (internal systems, external APIs, file uploads, IoT devices)',
        '4. Document data volume requirements (current and projected growth)',
        '5. Define data velocity requirements (batch, real-time, streaming)',
        '6. Specify data variety (structured, semi-structured, unstructured)',
        '7. Identify data quality requirements (accuracy, completeness, consistency, timeliness)',
        '8. Define data retention and archival requirements',
        '9. Document compliance and regulatory requirements (GDPR, HIPAA, PCI-DSS, etc.)',
        '10. Identify key data consumers and their access patterns (OLTP, OLAP, analytics, ML)'
      ],
      outputFormat: 'JSON object with comprehensive data requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['dataDomains', 'entities', 'dataSources'],
      properties: {
        dataDomains: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              businessImportance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              entities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        entities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              domain: { type: 'string' },
              description: { type: 'string' },
              keyAttributes: { type: 'array', items: { type: 'string' } },
              estimatedRecordCount: { type: 'string' },
              growthRate: { type: 'string' }
            }
          }
        },
        dataSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['database', 'api', 'file', 'stream', 'iot', 'manual'] },
              frequency: { type: 'string' },
              volume: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        volumeRequirements: {
          type: 'object',
          properties: {
            currentDataVolume: { type: 'string' },
            projectedGrowth: { type: 'string' },
            peakLoad: { type: 'string' }
          }
        },
        velocityRequirements: {
          type: 'object',
          properties: {
            batchProcessing: { type: 'boolean' },
            realTimeProcessing: { type: 'boolean' },
            streamProcessing: { type: 'boolean' },
            latencyRequirements: { type: 'string' }
          }
        },
        varietyRequirements: {
          type: 'object',
          properties: {
            structured: { type: 'boolean' },
            semiStructured: { type: 'boolean' },
            unstructured: { type: 'boolean' },
            dataTypes: { type: 'array', items: { type: 'string' } }
          }
        },
        qualityRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string', enum: ['accuracy', 'completeness', 'consistency', 'timeliness', 'validity'] },
              target: { type: 'string' },
              measurement: { type: 'string' }
            }
          }
        },
        retentionRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dataType: { type: 'string' },
              hotStorage: { type: 'string' },
              warmStorage: { type: 'string' },
              coldStorage: { type: 'string' },
              deletionPolicy: { type: 'string' }
            }
          }
        },
        complianceRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              requirements: { type: 'array', items: { type: 'string' } },
              dataTypes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        accessPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              consumer: { type: 'string' },
              workloadType: { type: 'string', enum: ['OLTP', 'OLAP', 'analytics', 'reporting', 'ml', 'api'] },
              queries: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string' },
              concurrentUsers: { type: 'number' }
            }
          }
        },
        requirementsReport: {
          type: 'string',
          description: 'Comprehensive requirements report in markdown format'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-architecture', 'planning', 'requirements', 'analysis']
}));

export const conceptualDataModelTask = defineTask('conceptual-data-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Conceptual Data Model Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Modeler with expertise in conceptual modeling and entity-relationship diagrams',
      task: 'Design high-level conceptual data model showing entities and relationships',
      context: {
        projectName: args.projectName,
        dataRequirements: args.dataRequirements,
        existingArchitecture: args.existingArchitecture
      },
      instructions: [
        '1. Identify core business entities from requirements',
        '2. Define entity descriptions and business meaning',
        '3. Identify relationships between entities (one-to-one, one-to-many, many-to-many)',
        '4. Define relationship cardinality and optionality',
        '5. Identify entity supertypes and subtypes (generalization/specialization)',
        '6. Define key attributes for each entity',
        '7. Identify entity constraints and business rules',
        '8. Create entity-relationship diagram (ERD) in text/mermaid format',
        '9. Document assumptions and design decisions',
        '10. Validate model with domain experts'
      ],
      outputFormat: 'JSON object with conceptual data model'
    },
    outputSchema: {
      type: 'object',
      required: ['entities', 'relationships', 'diagram'],
      properties: {
        entities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              domain: { type: 'string' },
              keyAttributes: { type: 'array', items: { type: 'string' } },
              supertype: { type: 'string' },
              subtypes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              fromEntity: { type: 'string' },
              toEntity: { type: 'string' },
              cardinality: { type: 'string', enum: ['one-to-one', 'one-to-many', 'many-to-many'] },
              fromOptional: { type: 'boolean' },
              toOptional: { type: 'boolean' },
              description: { type: 'string' }
            }
          }
        },
        businessRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { type: 'string' },
              entities: { type: 'array', items: { type: 'string' } },
              rationale: { type: 'string' }
            }
          }
        },
        diagram: {
          type: 'string',
          description: 'Entity-relationship diagram in mermaid or text format'
        },
        designDecisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              rationale: { type: 'string' },
              alternatives: { type: 'array', items: { type: 'string' } }
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
  labels: ['data-architecture', 'planning', 'conceptual-model', 'erd']
}));

export const logicalDataModelTask = defineTask('logical-data-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Logical Data Model Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Modeler with expertise in logical modeling and normalization',
      task: 'Design detailed logical data model with attributes, keys, and normalized structure',
      context: {
        projectName: args.projectName,
        conceptualModel: args.conceptualModel,
        dataRequirements: args.dataRequirements,
        requirements: args.requirements
      },
      instructions: [
        '1. Convert conceptual entities to logical tables/collections',
        '2. Define all attributes with data types and constraints',
        '3. Identify primary keys and alternate keys',
        '4. Define foreign key relationships',
        '5. Apply normalization (typically 3NF for OLTP, denormalized for OLAP)',
        '6. Resolve many-to-many relationships with junction tables',
        '7. Define indexes for query optimization',
        '8. Document referential integrity constraints',
        '9. Create detailed logical schema diagram',
        '10. Provide data dictionary with all tables/columns'
      ],
      outputFormat: 'JSON object with logical data model'
    },
    outputSchema: {
      type: 'object',
      required: ['tables', 'keys', 'diagram'],
      properties: {
        tables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              attributes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    dataType: { type: 'string' },
                    nullable: { type: 'boolean' },
                    defaultValue: { type: 'string' },
                    description: { type: 'string' },
                    constraints: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              estimatedRows: { type: 'string' }
            }
          }
        },
        collections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              schema: { type: 'object' },
              estimatedDocuments: { type: 'string' }
            }
          }
        },
        keys: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              table: { type: 'string' },
              keyType: { type: 'string', enum: ['primary', 'foreign', 'unique', 'composite'] },
              columns: { type: 'array', items: { type: 'string' } },
              referencedTable: { type: 'string' },
              referencedColumns: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        indexes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              table: { type: 'string' },
              columns: { type: 'array', items: { type: 'string' } },
              unique: { type: 'boolean' },
              type: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        normalization: {
          type: 'object',
          properties: {
            level: { type: 'string' },
            rationale: { type: 'string' },
            denormalizations: { type: 'array', items: { type: 'string' } }
          }
        },
        dataDictionary: {
          type: 'string',
          description: 'Complete data dictionary in markdown format'
        },
        diagram: {
          type: 'string',
          description: 'Logical schema diagram in mermaid or text format'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-architecture', 'planning', 'logical-model', 'schema']
}));

export const storageSelectionTask = defineTask('storage-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Storage Technology Selection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Database Architect with expertise in storage technology selection',
      task: 'Identify and evaluate candidate storage technologies for the data architecture',
      context: {
        projectName: args.projectName,
        logicalModel: args.logicalModel,
        dataRequirements: args.dataRequirements,
        requirements: args.requirements,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify candidate relational databases (PostgreSQL, MySQL, SQL Server, Oracle)',
        '2. Identify candidate NoSQL databases (MongoDB, Cassandra, DynamoDB, Redis)',
        '3. Identify candidate data warehouses (Snowflake, BigQuery, Redshift)',
        '4. Evaluate graph databases if relationship-heavy (Neo4j, Amazon Neptune)',
        '5. Evaluate time-series databases if applicable (InfluxDB, TimescaleDB)',
        '6. Assess object storage for unstructured data (S3, Azure Blob, GCS)',
        '7. Evaluate search engines if needed (Elasticsearch, OpenSearch)',
        '8. Consider caching layers (Redis, Memcached)',
        '9. Score each candidate against requirements (ACID, CAP theorem, scalability)',
        '10. Recommend top 3 candidates for detailed evaluation'
      ],
      outputFormat: 'JSON object with storage technology candidates'
    },
    outputSchema: {
      type: 'object',
      required: ['candidates', 'evaluationCriteria'],
      properties: {
        candidates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['relational', 'nosql-document', 'nosql-keyvalue', 'nosql-columnar', 'nosql-graph', 'warehouse', 'timeseries', 'search', 'object-storage', 'cache'] },
              vendor: { type: 'string' },
              deployment: { type: 'string', enum: ['cloud-managed', 'self-hosted', 'hybrid'] },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              useCases: { type: 'array', items: { type: 'string' } },
              capTheorem: { type: 'string', enum: ['CP', 'AP', 'CA'] },
              acidCompliance: { type: 'boolean' },
              scalability: { type: 'string', enum: ['vertical', 'horizontal', 'both'] },
              licensingCost: { type: 'string' }
            }
          }
        },
        evaluationCriteria: {
          type: 'object',
          properties: {
            primaryCriteria: { type: 'array', items: { type: 'string' } },
            weights: { type: 'object' },
            tradeoffs: { type: 'string' }
          }
        },
        polyglotPersistence: {
          type: 'object',
          properties: {
            recommended: { type: 'boolean' },
            rationale: { type: 'string' },
            architecture: { type: 'string' }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Top 3 candidates for detailed evaluation'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-architecture', 'planning', 'storage-selection', 'evaluation']
}));

export const storageEvaluationTask = defineTask('storage-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4.${args.candidateIndex}: Storage Evaluation - ${args.candidate.name}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Database Engineer with deep expertise in storage systems',
      task: 'Perform detailed evaluation of storage technology candidate',
      context: {
        projectName: args.projectName,
        candidateIndex: args.candidateIndex,
        candidate: args.candidate,
        logicalModel: args.logicalModel,
        dataRequirements: args.dataRequirements,
        requirements: args.requirements,
        constraints: args.constraints
      },
      instructions: [
        '1. Evaluate data model fit (how well logical model maps to storage model)',
        '2. Assess performance for expected workloads (OLTP, OLAP, mixed)',
        '3. Evaluate scalability (vertical, horizontal, auto-scaling)',
        '4. Assess high availability and disaster recovery capabilities',
        '5. Evaluate consistency guarantees (ACID, eventual consistency)',
        '6. Assess operational complexity (setup, maintenance, monitoring)',
        '7. Evaluate security features (encryption, access control, auditing)',
        '8. Estimate total cost of ownership (licensing, compute, storage, data transfer)',
        '9. Assess ecosystem and tooling (ORMs, migration tools, monitoring)',
        '10. Identify risks and limitations'
      ],
      outputFormat: 'JSON object with detailed storage evaluation'
    },
    outputSchema: {
      type: 'object',
      required: ['technologyName', 'fitScore', 'costEstimate'],
      properties: {
        technologyName: { type: 'string' },
        dataModelFit: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            strengths: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } },
            adaptations: { type: 'array', items: { type: 'string' } }
          }
        },
        performance: {
          type: 'object',
          properties: {
            readThroughput: { type: 'string' },
            writeThroughput: { type: 'string' },
            latency: { type: 'string' },
            queryOptimization: { type: 'array', items: { type: 'string' } },
            benchmarks: { type: 'string' }
          }
        },
        scalability: {
          type: 'object',
          properties: {
            verticalScaling: { type: 'string' },
            horizontalScaling: { type: 'string' },
            autoScaling: { type: 'boolean' },
            maxCapacity: { type: 'string' }
          }
        },
        availability: {
          type: 'object',
          properties: {
            replication: { type: 'string' },
            failover: { type: 'string' },
            backupRestore: { type: 'string' },
            sla: { type: 'string' }
          }
        },
        consistency: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            guarantees: { type: 'array', items: { type: 'string' } },
            tradeoffs: { type: 'string' }
          }
        },
        operationalComplexity: {
          type: 'object',
          properties: {
            setup: { type: 'string', enum: ['simple', 'moderate', 'complex'] },
            maintenance: { type: 'string', enum: ['low', 'medium', 'high'] },
            monitoring: { type: 'array', items: { type: 'string' } },
            expertiseRequired: { type: 'string' }
          }
        },
        security: {
          type: 'object',
          properties: {
            encryptionAtRest: { type: 'boolean' },
            encryptionInTransit: { type: 'boolean' },
            accessControl: { type: 'string' },
            auditing: { type: 'boolean' },
            compliance: { type: 'array', items: { type: 'string' } }
          }
        },
        costEstimate: {
          type: 'object',
          properties: {
            setupCost: { type: 'string' },
            monthlyOperational: { type: 'string' },
            yearlyTotal: { type: 'string' },
            breakdown: { type: 'object' },
            costOptimizations: { type: 'array', items: { type: 'string' } }
          }
        },
        ecosystem: {
          type: 'object',
          properties: {
            orms: { type: 'array', items: { type: 'string' } },
            migrationTools: { type: 'array', items: { type: 'string' } },
            monitoringTools: { type: 'array', items: { type: 'string' } },
            community: { type: 'string' }
          }
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              mitigation: { type: 'string' }
            }
          }
        },
        fitScore: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Overall fit score for this storage technology'
        },
        recommendation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-architecture', 'planning', 'storage-evaluation', `candidate-${args.candidateIndex}`]
}));

export const storageArchitectureTask = defineTask('storage-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Storage Architecture Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Architect with expertise in polyglot persistence and storage architecture',
      task: 'Design comprehensive storage architecture based on evaluated technologies',
      context: {
        projectName: args.projectName,
        storageCandidates: args.storageCandidates,
        detailedStorageEvaluations: args.detailedStorageEvaluations,
        logicalModel: args.logicalModel,
        dataRequirements: args.dataRequirements,
        constraints: args.constraints
      },
      instructions: [
        '1. Select primary database for transactional workloads',
        '2. Design polyglot persistence architecture if needed (multiple storage types)',
        '3. Define which data domains go to which storage systems',
        '4. Design data replication strategy across stores',
        '5. Design caching architecture (read-through, write-through, cache-aside)',
        '6. Define data partitioning and sharding strategy',
        '7. Design backup and disaster recovery architecture',
        '8. Define monitoring and alerting strategy',
        '9. Create architecture diagram showing all storage components',
        '10. Document trade-offs and design decisions'
      ],
      outputFormat: 'JSON object with storage architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'architecture', 'qualityAttributes'],
      properties: {
        recommendation: {
          type: 'object',
          properties: {
            primaryDatabase: { type: 'string' },
            rationale: { type: 'string' },
            additionalStores: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  technology: { type: 'string' },
                  purpose: { type: 'string' },
                  dataDomains: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        architecture: {
          type: 'object',
          properties: {
            components: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  technology: { type: 'string' },
                  purpose: { type: 'string' },
                  dataVolume: { type: 'string' },
                  accessPattern: { type: 'string' }
                }
              }
            },
            dataFlow: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from: { type: 'string' },
                  to: { type: 'string' },
                  method: { type: 'string' },
                  frequency: { type: 'string' }
                }
              }
            }
          }
        },
        replicationStrategy: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            synchronization: { type: 'string', enum: ['synchronous', 'asynchronous', 'hybrid'] },
            conflictResolution: { type: 'string' },
            tools: { type: 'array', items: { type: 'string' } }
          }
        },
        cachingArchitecture: {
          type: 'object',
          properties: {
            technology: { type: 'string' },
            pattern: { type: 'string', enum: ['cache-aside', 'read-through', 'write-through', 'write-behind'] },
            ttl: { type: 'string' },
            evictionPolicy: { type: 'string' },
            cachedData: { type: 'array', items: { type: 'string' } }
          }
        },
        partitioningStrategy: {
          type: 'object',
          properties: {
            method: { type: 'string', enum: ['horizontal', 'vertical', 'functional', 'none'] },
            partitionKey: { type: 'string' },
            shardCount: { type: 'number' },
            rebalancing: { type: 'string' }
          }
        },
        qualityAttributes: {
          type: 'object',
          properties: {
            scalability: {
              type: 'object',
              properties: {
                approach: { type: 'string' },
                capacity: { type: 'string' },
                autoScaling: { type: 'boolean' }
              }
            },
            availability: {
              type: 'object',
              properties: {
                targetSLA: { type: 'string' },
                redundancy: { type: 'string' },
                failoverTime: { type: 'string' }
              }
            },
            consistency: {
              type: 'object',
              properties: {
                model: { type: 'string' },
                tradeoffs: { type: 'string' }
              }
            }
          }
        },
        monitoring: {
          type: 'object',
          properties: {
            metrics: { type: 'array', items: { type: 'string' } },
            tools: { type: 'array', items: { type: 'string' } },
            alerts: { type: 'array', items: { type: 'string' } }
          }
        },
        architectureDiagram: {
          type: 'string',
          description: 'Storage architecture diagram in mermaid or text format'
        },
        designDecisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              rationale: { type: 'string' },
              tradeoffs: { type: 'string' },
              alternatives: { type: 'array', items: { type: 'string' } }
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
  labels: ['data-architecture', 'planning', 'storage-architecture', 'design']
}));

export const physicalDataModelTask = defineTask('physical-data-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Physical Data Model Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Database Engineer with expertise in physical database design and optimization',
      task: 'Design physical data model optimized for target storage technologies',
      context: {
        projectName: args.projectName,
        logicalModel: args.logicalModel,
        storageArchitecture: args.storageArchitecture,
        dataRequirements: args.dataRequirements,
        requirements: args.requirements
      },
      instructions: [
        '1. Map logical model to physical storage structures (tables, collections, key-spaces)',
        '2. Define physical data types specific to target databases',
        '3. Design indexes (B-tree, hash, full-text, spatial) for query optimization',
        '4. Design partitioning and sharding keys',
        '5. Define tablespaces and storage allocation',
        '6. Design compression strategies',
        '7. Optimize for target workloads (OLTP vs OLAP)',
        '8. Define storage parameters and tuning configurations',
        '9. Create DDL scripts for database creation',
        '10. Document physical design decisions and optimizations'
      ],
      outputFormat: 'JSON object with physical data model'
    },
    outputSchema: {
      type: 'object',
      required: ['physicalStructures', 'indexes', 'ddlScripts'],
      properties: {
        physicalStructures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['table', 'collection', 'keyspace', 'bucket'] },
              database: { type: 'string' },
              columns: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    physicalType: { type: 'string' },
                    size: { type: 'string' },
                    nullable: { type: 'boolean' },
                    defaultValue: { type: 'string' }
                  }
                }
              },
              partitioning: {
                type: 'object',
                properties: {
                  method: { type: 'string' },
                  key: { type: 'string' },
                  partitions: { type: 'number' }
                }
              },
              compression: {
                type: 'object',
                properties: {
                  enabled: { type: 'boolean' },
                  algorithm: { type: 'string' },
                  ratio: { type: 'string' }
                }
              },
              storageEstimate: { type: 'string' }
            }
          }
        },
        indexes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              table: { type: 'string' },
              columns: { type: 'array', items: { type: 'string' } },
              type: { type: 'string', enum: ['btree', 'hash', 'fulltext', 'spatial', 'gin', 'gist'] },
              unique: { type: 'boolean' },
              partial: { type: 'boolean' },
              condition: { type: 'string' },
              storageEstimate: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        optimization: {
          type: 'object',
          properties: {
            denormalizations: { type: 'array', items: { type: 'string' } },
            materializedViews: { type: 'array', items: { type: 'string' } },
            readReplicas: { type: 'number' },
            cachingStrategy: { type: 'string' }
          }
        },
        storageConfiguration: {
          type: 'object',
          properties: {
            tablespaces: { type: 'array', items: { type: 'string' } },
            bufferPool: { type: 'string' },
            ioParameters: { type: 'object' }
          }
        },
        ddlScripts: {
          type: 'object',
          properties: {
            createTables: { type: 'string' },
            createIndexes: { type: 'string' },
            createPartitions: { type: 'string' },
            createConstraints: { type: 'string' }
          }
        },
        storageEstimate: {
          type: 'object',
          properties: {
            totalSize: { type: 'string' },
            dataSize: { type: 'string' },
            indexSize: { type: 'string' },
            growthProjection: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-architecture', 'planning', 'physical-model', 'optimization']
}));

export const dataFlowDesignTask = defineTask('data-flow-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Data Flow Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Engineer with expertise in ETL/ELT pipelines and data flow design',
      task: 'Design comprehensive data flow architecture from sources to targets',
      context: {
        projectName: args.projectName,
        physicalModel: args.physicalModel,
        storageArchitecture: args.storageArchitecture,
        dataRequirements: args.dataRequirements,
        requirements: args.requirements
      },
      instructions: [
        '1. Map data sources to target storage systems',
        '2. Design data ingestion pipelines (batch, streaming, real-time)',
        '3. Define data transformation logic (cleansing, validation, enrichment)',
        '4. Design ETL/ELT workflows',
        '5. Define data lineage and traceability',
        '6. Design error handling and retry mechanisms',
        '7. Plan for data quality checks and validation',
        '8. Design data orchestration and scheduling',
        '9. Create data flow diagrams',
        '10. Specify tools and technologies (Airflow, Kafka, Spark, etc.)'
      ],
      outputFormat: 'JSON object with data flow design'
    },
    outputSchema: {
      type: 'object',
      required: ['dataFlows', 'pipelines', 'diagram'],
      properties: {
        dataFlows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              source: { type: 'string' },
              target: { type: 'string' },
              flowType: { type: 'string', enum: ['batch', 'streaming', 'real-time', 'event-driven'] },
              frequency: { type: 'string' },
              volumePerExecution: { type: 'string' },
              latencyRequirement: { type: 'string' }
            }
          }
        },
        pipelines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['ETL', 'ELT', 'streaming', 'CDC'] },
              stages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    stage: { type: 'string' },
                    description: { type: 'string' },
                    technology: { type: 'string' },
                    transformations: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              schedule: { type: 'string' },
              sla: { type: 'string' },
              errorHandling: { type: 'string' }
            }
          }
        },
        transformations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['cleansing', 'validation', 'enrichment', 'aggregation', 'join', 'filter'] },
              logic: { type: 'string' },
              dataQualityRules: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dataLineage: {
          type: 'object',
          properties: {
            tracking: { type: 'string' },
            tool: { type: 'string' },
            granularity: { type: 'string', enum: ['column-level', 'table-level', 'pipeline-level'] }
          }
        },
        orchestration: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            scheduling: { type: 'string' },
            dependencies: { type: 'array', items: { type: 'string' } },
            monitoring: { type: 'string' }
          }
        },
        qualityGates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pipeline: { type: 'string' },
              checks: { type: 'array', items: { type: 'string' } },
              failureAction: { type: 'string' }
            }
          }
        },
        technologies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              technology: { type: 'string' },
              purpose: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        diagram: {
          type: 'string',
          description: 'Data flow diagram in mermaid or text format'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-architecture', 'planning', 'data-flow', 'etl']
}));

export const dataIntegrationTask = defineTask('data-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Data Integration Architecture - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Integration Architect with expertise in data integration patterns',
      task: 'Design data integration architecture with existing systems and external services',
      context: {
        projectName: args.projectName,
        dataFlow: args.dataFlow,
        storageArchitecture: args.storageArchitecture,
        existingArchitecture: args.existingArchitecture,
        requirements: args.requirements
      },
      instructions: [
        '1. Identify integration points with existing systems',
        '2. Design API integration patterns (REST, GraphQL, gRPC)',
        '3. Design event-driven integration (Kafka, RabbitMQ, EventBridge)',
        '4. Plan for change data capture (CDC) from legacy systems',
        '5. Design data synchronization mechanisms',
        '6. Define data contracts and schemas',
        '7. Plan for schema evolution and versioning',
        '8. Design integration testing strategy',
        '9. Define monitoring and alerting for integrations',
        '10. Document integration architecture and patterns'
      ],
      outputFormat: 'JSON object with data integration architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationPoints', 'patterns'],
      properties: {
        integrationPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              type: { type: 'string', enum: ['source', 'target', 'bidirectional'] },
              protocol: { type: 'string' },
              frequency: { type: 'string' },
              dataVolume: { type: 'string' },
              latency: { type: 'string' }
            }
          }
        },
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string', enum: ['API', 'event-driven', 'batch-file', 'CDC', 'streaming', 'message-queue'] },
              useCases: { type: 'array', items: { type: 'string' } },
              technology: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        dataContracts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              format: { type: 'string', enum: ['JSON', 'XML', 'Avro', 'Protobuf', 'CSV'] },
              schema: { type: 'string' },
              versioning: { type: 'string' }
            }
          }
        },
        synchronization: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            conflictResolution: { type: 'string' },
            consistencyModel: { type: 'string' }
          }
        },
        monitoring: {
          type: 'object',
          properties: {
            metrics: { type: 'array', items: { type: 'string' } },
            alerts: { type: 'array', items: { type: 'string' } },
            logging: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-architecture', 'planning', 'integration', 'interoperability']
}));

export const dataGovernanceTask = defineTask('data-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Data Governance Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Governance Specialist with expertise in data management policies',
      task: 'Design comprehensive data governance framework and policies',
      context: {
        projectName: args.projectName,
        physicalModel: args.physicalModel,
        storageArchitecture: args.storageArchitecture,
        dataRequirements: args.dataRequirements,
        constraints: args.constraints
      },
      instructions: [
        '1. Define data ownership and stewardship roles',
        '2. Design data classification scheme (public, internal, confidential, restricted)',
        '3. Define data quality standards and metrics',
        '4. Design metadata management strategy',
        '5. Define data lifecycle management policies',
        '6. Design master data management (MDM) approach',
        '7. Define data lineage and audit requirements',
        '8. Plan for data privacy and consent management',
        '9. Design data catalog and discovery tools',
        '10. Define governance processes and workflows'
      ],
      outputFormat: 'JSON object with data governance design'
    },
    outputSchema: {
      type: 'object',
      required: ['policies', 'roles', 'standards'],
      properties: {
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              dataDomains: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dataClassification: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              criteria: { type: 'string' },
              handling: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        policies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              policy: { type: 'string' },
              description: { type: 'string' },
              scope: { type: 'string' },
              enforcement: { type: 'string' }
            }
          }
        },
        qualityStandards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string' },
              metrics: { type: 'array', items: { type: 'string' } },
              targets: { type: 'object' },
              measurement: { type: 'string' }
            }
          }
        },
        metadataManagement: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            technical: { type: 'array', items: { type: 'string' } },
            business: { type: 'array', items: { type: 'string' } },
            operational: { type: 'array', items: { type: 'string' } }
          }
        },
        lifecycleManagement: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dataType: { type: 'string' },
              stages: { type: 'array', items: { type: 'string' } },
              retention: { type: 'string' },
              disposal: { type: 'string' }
            }
          }
        },
        masterDataManagement: {
          type: 'object',
          properties: {
            approach: { type: 'string', enum: ['centralized', 'distributed', 'hybrid'] },
            goldenRecords: { type: 'array', items: { type: 'string' } },
            tool: { type: 'string' }
          }
        },
        dataCatalog: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            features: { type: 'array', items: { type: 'string' } },
            searchability: { type: 'string' }
          }
        },
        standards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              description: { type: 'string' },
              applicability: { type: 'string' }
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
  labels: ['data-architecture', 'planning', 'governance', 'policy']
}));

export const dataSecurityTask = defineTask('data-security', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Data Security Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Security Architect with expertise in data protection and compliance',
      task: 'Design comprehensive data security architecture and controls',
      context: {
        projectName: args.projectName,
        physicalModel: args.physicalModel,
        storageArchitecture: args.storageArchitecture,
        dataGovernance: args.dataGovernance,
        constraints: args.constraints
      },
      instructions: [
        '1. Design encryption strategy (at-rest, in-transit, client-side)',
        '2. Define access control model (RBAC, ABAC, row-level security)',
        '3. Design authentication and authorization mechanisms',
        '4. Plan for data masking and tokenization',
        '5. Design audit logging and monitoring',
        '6. Define key management strategy',
        '7. Plan for data anonymization and pseudonymization',
        '8. Design compliance controls (GDPR, HIPAA, PCI-DSS, etc.)',
        '9. Define security testing and vulnerability management',
        '10. Create threat model and risk mitigation strategies'
      ],
      outputFormat: 'JSON object with data security design'
    },
    outputSchema: {
      type: 'object',
      required: ['controls', 'encryption', 'accessControl'],
      properties: {
        encryption: {
          type: 'object',
          properties: {
            atRest: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                algorithm: { type: 'string' },
                keyManagement: { type: 'string' },
                scope: { type: 'array', items: { type: 'string' } }
              }
            },
            inTransit: {
              type: 'object',
              properties: {
                protocol: { type: 'string' },
                certificateManagement: { type: 'string' }
              }
            },
            clientSide: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                useCases: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        accessControl: {
          type: 'object',
          properties: {
            model: { type: 'string', enum: ['RBAC', 'ABAC', 'MAC', 'hybrid'] },
            roles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string' },
                  permissions: { type: 'array', items: { type: 'string' } },
                  dataAccess: { type: 'string' }
                }
              }
            },
            rowLevelSecurity: { type: 'boolean' },
            columnLevelSecurity: { type: 'boolean' }
          }
        },
        authentication: {
          type: 'object',
          properties: {
            mechanisms: { type: 'array', items: { type: 'string' } },
            mfa: { type: 'boolean' },
            sso: { type: 'boolean' },
            identityProvider: { type: 'string' }
          }
        },
        dataMasking: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            techniques: { type: 'array', items: { type: 'string' } },
            sensitiveFields: { type: 'array', items: { type: 'string' } }
          }
        },
        tokenization: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            useCases: { type: 'array', items: { type: 'string' } },
            tokenVault: { type: 'string' }
          }
        },
        auditLogging: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            events: { type: 'array', items: { type: 'string' } },
            retention: { type: 'string' },
            monitoring: { type: 'string' }
          }
        },
        keyManagement: {
          type: 'object',
          properties: {
            service: { type: 'string' },
            rotation: { type: 'string' },
            backup: { type: 'string' }
          }
        },
        privacyControls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              control: { type: 'string' },
              technique: { type: 'string', enum: ['anonymization', 'pseudonymization', 'aggregation', 'suppression'] },
              dataTypes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        complianceControls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              requirements: { type: 'array', items: { type: 'string' } },
              controls: { type: 'array', items: { type: 'string' } },
              validation: { type: 'string' }
            }
          }
        },
        controls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              control: { type: 'string' },
              type: { type: 'string', enum: ['preventive', 'detective', 'corrective'] },
              implementation: { type: 'string' }
            }
          }
        },
        threatModel: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              threat: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              mitigation: { type: 'string' }
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
  labels: ['data-architecture', 'planning', 'security', 'compliance']
}));

export const dataMigrationTask = defineTask('data-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Data Migration Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Migration Specialist with expertise in large-scale data migrations',
      task: 'Design comprehensive data migration strategy from existing to new architecture',
      context: {
        projectName: args.projectName,
        existingArchitecture: args.existingArchitecture,
        physicalModel: args.physicalModel,
        storageArchitecture: args.storageArchitecture,
        dataRequirements: args.dataRequirements,
        constraints: args.constraints
      },
      instructions: [
        '1. Assess current data state and quality',
        '2. Design migration approach (big-bang, phased, parallel run)',
        '3. Plan data cleansing and transformation',
        '4. Design schema mapping and conversion logic',
        '5. Plan for data validation and reconciliation',
        '6. Design downtime minimization strategy',
        '7. Plan for rollback and contingency',
        '8. Define cutover plan and checklist',
        '9. Design post-migration validation',
        '10. Create migration timeline and resource plan'
      ],
      outputFormat: 'JSON object with data migration strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'phases', 'rollbackStrategy'],
      properties: {
        currentStateAssessment: {
          type: 'object',
          properties: {
            dataVolume: { type: 'string' },
            dataQualityScore: { type: 'number' },
            issues: { type: 'array', items: { type: 'string' } },
            dependencies: { type: 'array', items: { type: 'string' } }
          }
        },
        approach: {
          type: 'object',
          properties: {
            strategy: { type: 'string', enum: ['big-bang', 'phased', 'parallel-run', 'trickle'] },
            rationale: { type: 'string' },
            downtimeEstimate: { type: 'string' }
          }
        },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              description: { type: 'string' },
              dataScope: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dataTransformation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceEntity: { type: 'string' },
              targetEntity: { type: 'string' },
              mapping: { type: 'string' },
              transformations: { type: 'array', items: { type: 'string' } },
              dataQualityRules: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        validation: {
          type: 'object',
          properties: {
            preMigration: { type: 'array', items: { type: 'string' } },
            postMigration: { type: 'array', items: { type: 'string' } },
            reconciliation: { type: 'string' },
            acceptanceCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        downtimeMinimization: {
          type: 'object',
          properties: {
            techniques: { type: 'array', items: { type: 'string' } },
            estimatedDowntime: { type: 'string' },
            maintenanceWindow: { type: 'string' }
          }
        },
        rollbackStrategy: {
          type: 'object',
          properties: {
            triggers: { type: 'array', items: { type: 'string' } },
            procedure: { type: 'string' },
            dataBackup: { type: 'string' },
            recoveryTime: { type: 'string' }
          }
        },
        cutoverPlan: {
          type: 'object',
          properties: {
            checklist: { type: 'array', items: { type: 'string' } },
            timeline: { type: 'string' },
            communication: { type: 'array', items: { type: 'string' } },
            stakeholders: { type: 'array', items: { type: 'string' } }
          }
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              mitigation: { type: 'string' },
              contingency: { type: 'string' }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            milestones: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-architecture', 'planning', 'migration', 'transition']
}));

export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Performance Optimization Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Database Performance Engineer with expertise in query optimization',
      task: 'Design performance optimization strategy for data architecture',
      context: {
        projectName: args.projectName,
        physicalModel: args.physicalModel,
        storageArchitecture: args.storageArchitecture,
        dataFlow: args.dataFlow,
        requirements: args.requirements
      },
      instructions: [
        '1. Define performance requirements and SLAs',
        '2. Design query optimization strategies',
        '3. Plan for connection pooling and resource management',
        '4. Design read replica and caching strategies',
        '5. Plan for query result caching',
        '6. Define monitoring and profiling approach',
        '7. Design load testing strategy',
        '8. Plan for capacity planning and scaling',
        '9. Identify performance bottlenecks and solutions',
        '10. Create performance tuning guidelines'
      ],
      outputFormat: 'JSON object with performance optimization strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['performanceTargets', 'optimizations', 'monitoring'],
      properties: {
        performanceTargets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              measurement: { type: 'string' }
            }
          }
        },
        optimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optimization: { type: 'string' },
              technique: { type: 'string' },
              expectedImprovement: { type: 'string' },
              implementation: { type: 'string' }
            }
          }
        },
        queryOptimization: {
          type: 'object',
          properties: {
            indexStrategy: { type: 'string' },
            queryRewriting: { type: 'array', items: { type: 'string' } },
            executionPlans: { type: 'string' }
          }
        },
        caching: {
          type: 'object',
          properties: {
            layers: { type: 'array', items: { type: 'string' } },
            strategies: { type: 'array', items: { type: 'string' } },
            invalidation: { type: 'string' }
          }
        },
        resourceManagement: {
          type: 'object',
          properties: {
            connectionPooling: { type: 'string' },
            resourceLimits: { type: 'object' },
            throttling: { type: 'string' }
          }
        },
        monitoring: {
          type: 'object',
          properties: {
            metrics: { type: 'array', items: { type: 'string' } },
            tools: { type: 'array', items: { type: 'string' } },
            alerts: { type: 'array', items: { type: 'string' } },
            profiling: { type: 'string' }
          }
        },
        loadTesting: {
          type: 'object',
          properties: {
            scenarios: { type: 'array', items: { type: 'string' } },
            tools: { type: 'array', items: { type: 'string' } },
            frequency: { type: 'string' }
          }
        },
        capacityPlanning: {
          type: 'object',
          properties: {
            currentCapacity: { type: 'string' },
            growthProjection: { type: 'string' },
            scalingStrategy: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-architecture', 'planning', 'performance', 'optimization']
}));

export const disasterRecoveryTask = defineTask('disaster-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Disaster Recovery and Backup Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Infrastructure Architect with expertise in disaster recovery and business continuity',
      task: 'Design disaster recovery and backup strategy for data architecture',
      context: {
        projectName: args.projectName,
        storageArchitecture: args.storageArchitecture,
        dataRequirements: args.dataRequirements,
        constraints: args.constraints
      },
      instructions: [
        '1. Define RPO (Recovery Point Objective) and RTO (Recovery Time Objective)',
        '2. Design backup strategy (full, incremental, differential)',
        '3. Plan backup frequency and retention',
        '4. Design disaster recovery architecture (multi-region, multi-AZ)',
        '5. Plan for data replication and synchronization',
        '6. Design failover and failback procedures',
        '7. Plan for backup testing and restoration drills',
        '8. Design monitoring and alerting for DR systems',
        '9. Document disaster recovery runbooks',
        '10. Estimate DR infrastructure costs'
      ],
      outputFormat: 'JSON object with disaster recovery strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['rpo', 'rto', 'backupStrategy', 'drArchitecture'],
      properties: {
        rpo: { type: 'string', description: 'Recovery Point Objective' },
        rto: { type: 'string', description: 'Recovery Time Objective' },
        backupStrategy: {
          type: 'object',
          properties: {
            types: { type: 'array', items: { type: 'string' } },
            frequency: {
              type: 'object',
              properties: {
                full: { type: 'string' },
                incremental: { type: 'string' },
                differential: { type: 'string' }
              }
            },
            retention: {
              type: 'object',
              properties: {
                daily: { type: 'string' },
                weekly: { type: 'string' },
                monthly: { type: 'string' },
                yearly: { type: 'string' }
              }
            },
            storage: { type: 'string' }
          }
        },
        drArchitecture: {
          type: 'object',
          properties: {
            approach: { type: 'string', enum: ['backup-restore', 'pilot-light', 'warm-standby', 'hot-standby', 'multi-site-active-active'] },
            regions: { type: 'array', items: { type: 'string' } },
            replication: { type: 'string' },
            automation: { type: 'string' }
          }
        },
        failoverProcedure: {
          type: 'object',
          properties: {
            triggers: { type: 'array', items: { type: 'string' } },
            steps: { type: 'array', items: { type: 'string' } },
            duration: { type: 'string' },
            automation: { type: 'boolean' }
          }
        },
        failbackProcedure: {
          type: 'object',
          properties: {
            steps: { type: 'array', items: { type: 'string' } },
            dataReconciliation: { type: 'string' },
            validation: { type: 'string' }
          }
        },
        testing: {
          type: 'object',
          properties: {
            frequency: { type: 'string' },
            scenarios: { type: 'array', items: { type: 'string' } },
            documentation: { type: 'string' }
          }
        },
        monitoring: {
          type: 'object',
          properties: {
            metrics: { type: 'array', items: { type: 'string' } },
            alerts: { type: 'array', items: { type: 'string' } }
          }
        },
        runbooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              procedure: { type: 'string' },
              contacts: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        costEstimate: {
          type: 'object',
          properties: {
            backup: { type: 'string' },
            replication: { type: 'string' },
            drInfrastructure: { type: 'string' },
            total: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-architecture', 'planning', 'disaster-recovery', 'backup']
}));

export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Implementation Roadmap - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Architecture Program Manager with expertise in implementation planning',
      task: 'Create detailed implementation roadmap for data architecture',
      context: {
        projectName: args.projectName,
        physicalModel: args.physicalModel,
        storageArchitecture: args.storageArchitecture,
        dataFlow: args.dataFlow,
        dataIntegration: args.dataIntegration,
        dataGovernance: args.dataGovernance,
        dataSecurity: args.dataSecurity,
        dataMigration: args.dataMigration,
        performanceStrategy: args.performanceStrategy,
        drStrategy: args.drStrategy,
        constraints: args.constraints
      },
      instructions: [
        '1. Break implementation into phases with clear milestones',
        '2. Define deliverables and success criteria for each phase',
        '3. Estimate effort and timeline for each phase',
        '4. Identify dependencies and critical path',
        '5. Define required team roles and skills',
        '6. Plan for iterative development and validation',
        '7. Identify risks and mitigation strategies',
        '8. Estimate total project cost (infrastructure, tools, personnel)',
        '9. Create comprehensive architecture documentation',
        '10. Generate visual roadmap and timeline'
      ],
      outputFormat: 'JSON object with implementation roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'cost'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              description: { type: 'string' },
              duration: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              team: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            startDate: { type: 'string' },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  milestone: { type: 'string' },
                  phase: { type: 'string' },
                  targetDate: { type: 'string' },
                  criticalPath: { type: 'boolean' }
                }
              }
            }
          }
        },
        cost: {
          type: 'object',
          properties: {
            infrastructure: { type: 'string' },
            tools: { type: 'string' },
            personnel: { type: 'string' },
            migration: { type: 'string' },
            contingency: { type: 'string' },
            total: { type: 'string' },
            breakdown: { type: 'array', items: { type: 'object' } }
          }
        },
        team: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              allocation: { type: 'string' },
              skills: { type: 'array', items: { type: 'string' } },
              phases: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              impact: { type: 'string' },
              probability: { type: 'string' },
              mitigation: { type: 'string' },
              contingency: { type: 'string' }
            }
          }
        },
        architectureDocument: {
          type: 'string',
          description: 'Complete data architecture document in markdown format'
        },
        roadmapMarkdown: {
          type: 'string',
          description: 'Implementation roadmap in markdown format with timeline visualization'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-architecture', 'planning', 'roadmap', 'project-management']
}));

export const dataArchitectureRiskAnalysisTask = defineTask('data-architecture-risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Data Architecture Risk Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Analyst specializing in data architecture and infrastructure risks',
      task: 'Analyze risks specific to the data architecture and implementation plan',
      context: {
        projectName: args.projectName,
        storageArchitecture: args.storageArchitecture,
        dataMigration: args.dataMigration,
        implementationRoadmap: args.implementationRoadmap,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify architectural risks (scalability limits, single points of failure)',
        '2. Assess data quality and integrity risks',
        '3. Evaluate performance and scalability risks',
        '4. Identify security and compliance risks',
        '5. Assess migration and transition risks',
        '6. Evaluate vendor lock-in and technology risks',
        '7. Identify operational and maintenance risks',
        '8. Assess cost and budget risks',
        '9. For each risk, provide severity, probability, impact, and mitigation plan',
        '10. Prioritize critical risks requiring immediate attention'
      ],
      outputFormat: 'JSON object with comprehensive risk analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'criticalRisks', 'overallRiskLevel'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              category: { type: 'string', enum: ['architecture', 'data-quality', 'performance', 'security', 'compliance', 'migration', 'technology', 'operational', 'cost', 'timeline'] },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              probability: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string' },
              mitigationPlan: { type: 'string' },
              contingencyPlan: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        criticalRisks: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of critical risks requiring immediate attention'
        },
        overallRiskLevel: {
          type: 'string',
          enum: ['high', 'medium', 'low']
        },
        riskMitigationTimeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              mitigationDeadline: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-architecture', 'planning', 'risk-analysis', 'risk-management']
}));
