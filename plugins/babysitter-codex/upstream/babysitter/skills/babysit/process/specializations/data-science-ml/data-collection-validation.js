/**
 * @process data-science-ml/data-collection-validation
 * @description Orchestrate data ingestion from multiple sources with validation, quality checks, and versioning
 * @inputs { dataSources: array, targetQuality: number, schemaPath?: string, validationRules?: array, versioningEnabled?: boolean }
 * @outputs { success: boolean, qualityScore: number, datasetVersion: string, validationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('data-science-ml/data-collection-validation', {
 *   dataSources: [
 *     { type: 'csv', path: 'data/raw/customers.csv', name: 'customers' },
 *     { type: 'database', connection: 'postgres://...', query: 'SELECT * FROM orders', name: 'orders' }
 *   ],
 *   targetQuality: 85,
 *   schemaPath: 'schemas/data_schema.json',
 *   validationRules: ['no_missing_primary_keys', 'valid_email_format', 'positive_amounts'],
 *   versioningEnabled: true
 * });
 *
 * @references
 * - Great Expectations: https://greatexpectations.io/
 * - DVC (Data Version Control): https://dvc.org/
 * - MLOps Principles: https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dataSources = [],
    targetQuality = 85,
    schemaPath = null,
    validationRules = [],
    versioningEnabled = true,
    outputDir = 'data-pipeline-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const validationResults = {};

  // ============================================================================
  // PHASE 1: DATA SOURCE DISCOVERY AND ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovering and assessing data sources');

  const sourceAssessment = await ctx.task(dataSourceDiscoveryTask, {
    dataSources,
    outputDir
  });

  if (!sourceAssessment.success || sourceAssessment.accessibleSources.length === 0) {
    return {
      success: false,
      error: 'No accessible data sources found',
      details: sourceAssessment,
      metadata: { processId: 'data-science-ml/data-collection-validation', timestamp: startTime }
    };
  }

  artifacts.push(...sourceAssessment.artifacts);

  // ============================================================================
  // PHASE 2: SCHEMA VALIDATION AND INFERENCE
  // ============================================================================

  ctx.log('info', 'Phase 2: Schema validation and inference');

  const schemaValidation = await ctx.task(schemaValidationTask, {
    dataSources: sourceAssessment.accessibleSources,
    schemaPath,
    outputDir
  });

  artifacts.push(...schemaValidation.artifacts);
  validationResults.schema = schemaValidation;

  // Quality Gate: Schema must be valid or inferrable
  if (!schemaValidation.schemaValid && !schemaValidation.schemaInferred) {
    await ctx.breakpoint({
      question: `Schema validation failed for some sources. ${schemaValidation.errors.length} errors found. Review and approve to continue?`,
      title: 'Schema Validation Issues',
      context: {
        runId: ctx.runId,
        errors: schemaValidation.errors,
        files: schemaValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: PARALLEL DATA INGESTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Ingesting data from all sources in parallel');

  const ingestionTasks = sourceAssessment.accessibleSources.map(source =>
    () => ctx.task(dataIngestionTask, {
      source,
      schema: schemaValidation.schemas[source.name],
      outputDir
    })
  );

  const ingestionResults = await ctx.parallel.all(ingestionTasks);

  // Aggregate ingestion results
  const failedIngestions = ingestionResults.filter(r => !r.success);
  if (failedIngestions.length > 0) {
    ctx.log('warn', `${failedIngestions.length} data source(s) failed to ingest`);
  }

  const successfulIngestions = ingestionResults.filter(r => r.success);
  artifacts.push(...successfulIngestions.flatMap(r => r.artifacts));

  if (successfulIngestions.length === 0) {
    return {
      success: false,
      error: 'All data ingestion tasks failed',
      failedSources: failedIngestions.map(f => ({ source: f.source, error: f.error })),
      metadata: { processId: 'data-science-ml/data-collection-validation', timestamp: startTime }
    };
  }

  // ============================================================================
  // PHASE 4: PARALLEL DATA QUALITY CHECKS
  // ============================================================================

  ctx.log('info', 'Phase 4: Running comprehensive data quality checks');

  const [
    completenessCheck,
    consistencyCheck,
    validityCheck,
    uniquenessCheck,
    timelinessCheck
  ] = await ctx.parallel.all([
    () => ctx.task(completenessCheckTask, {
      ingestionResults: successfulIngestions,
      validationRules,
      outputDir
    }),
    () => ctx.task(consistencyCheckTask, {
      ingestionResults: successfulIngestions,
      validationRules,
      outputDir
    }),
    () => ctx.task(validityCheckTask, {
      ingestionResults: successfulIngestions,
      schemas: schemaValidation.schemas,
      validationRules,
      outputDir
    }),
    () => ctx.task(uniquenessCheckTask, {
      ingestionResults: successfulIngestions,
      validationRules,
      outputDir
    }),
    () => ctx.task(timelinessCheckTask, {
      ingestionResults: successfulIngestions,
      outputDir
    })
  ]);

  validationResults.completeness = completenessCheck;
  validationResults.consistency = consistencyCheck;
  validationResults.validity = validityCheck;
  validationResults.uniqueness = uniquenessCheck;
  validationResults.timeliness = timelinessCheck;

  artifacts.push(
    ...completenessCheck.artifacts,
    ...consistencyCheck.artifacts,
    ...validityCheck.artifacts,
    ...uniquenessCheck.artifacts,
    ...timelinessCheck.artifacts
  );

  // ============================================================================
  // PHASE 5: OVERALL QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 5: Computing overall data quality score');

  const qualityScore = await ctx.task(qualityScoringTask, {
    validationResults: {
      completeness: completenessCheck,
      consistency: consistencyCheck,
      validity: validityCheck,
      uniqueness: uniquenessCheck,
      timeliness: timelinessCheck
    },
    targetQuality,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= targetQuality;

  // Quality Gate: Quality threshold
  if (!qualityMet) {
    await ctx.breakpoint({
      question: `Data quality score: ${overallScore}/${targetQuality}. Quality target not met. Review issues and approve to continue?`,
      title: 'Data Quality Below Target',
      context: {
        runId: ctx.runId,
        overallScore,
        targetQuality,
        criticalIssues: qualityScore.criticalIssues,
        recommendations: qualityScore.recommendations,
        files: qualityScore.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: DATA PROFILING AND STATISTICS
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating data profile and statistics');

  const dataProfile = await ctx.task(dataProfilingTask, {
    ingestionResults: successfulIngestions,
    schemas: schemaValidation.schemas,
    outputDir
  });

  artifacts.push(...dataProfile.artifacts);

  // ============================================================================
  // PHASE 7: DATA VERSIONING (if enabled)
  // ============================================================================

  let datasetVersion = null;
  let versioningResult = null;

  if (versioningEnabled) {
    ctx.log('info', 'Phase 7: Versioning dataset with DVC');

    versioningResult = await ctx.task(dataVersioningTask, {
      ingestionResults: successfulIngestions,
      qualityScore: overallScore,
      validationResults,
      dataProfile,
      outputDir
    });

    datasetVersion = versioningResult.version;
    artifacts.push(...versioningResult.artifacts);
  }

  // ============================================================================
  // PHASE 8: QUALITY REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive quality report');

  const qualityReport = await ctx.task(qualityReportGenerationTask, {
    dataSources,
    sourceAssessment,
    schemaValidation,
    ingestionResults: successfulIngestions,
    validationResults,
    qualityScore,
    dataProfile,
    versioningResult,
    targetQuality,
    outputDir
  });

  artifacts.push(...qualityReport.artifacts);

  // ============================================================================
  // PHASE 9: REMEDIATION RECOMMENDATIONS (if quality not met)
  // ============================================================================

  let remediationPlan = null;
  if (!qualityMet) {
    ctx.log('info', 'Phase 9: Generating remediation plan for quality issues');

    remediationPlan = await ctx.task(remediationPlanningTask, {
      qualityScore,
      validationResults,
      dataProfile,
      targetQuality,
      outputDir
    });

    artifacts.push(...remediationPlan.artifacts);
  }

  // ============================================================================
  // FINAL BREAKPOINT: REVIEW AND APPROVAL
  // ============================================================================

  await ctx.breakpoint({
    question: `Data collection and validation complete. Quality: ${overallScore}/${targetQuality}. ${qualityMet ? 'Quality target met!' : 'Quality target not met.'} ${datasetVersion ? `Version: ${datasetVersion}` : ''} Approve pipeline result?`,
    title: 'Data Pipeline Completion Review',
    context: {
      runId: ctx.runId,
      qualityScore: overallScore,
      targetQuality,
      qualityMet,
      datasetVersion,
      sourcesIngested: successfulIngestions.length,
      totalSources: dataSources.length,
      files: [
        { path: qualityReport.reportPath, format: 'markdown' },
        { path: `${outputDir}/quality-scorecard.json`, format: 'json' },
        ...artifacts.slice(0, 5).map(a => ({ path: a.path, format: a.format || 'json' }))
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: qualityMet,
    overallQualityScore: overallScore,
    targetQuality,
    qualityMet,
    datasetVersion,
    sourcesIngested: successfulIngestions.length,
    totalSources: dataSources.length,
    validationResults: {
      schema: {
        valid: schemaValidation.schemaValid,
        errors: schemaValidation.errors.length
      },
      completeness: {
        score: completenessCheck.score,
        missingValuePercentage: completenessCheck.overallMissingPercentage
      },
      consistency: {
        score: consistencyCheck.score,
        inconsistenciesFound: consistencyCheck.totalInconsistencies
      },
      validity: {
        score: validityCheck.score,
        invalidRecordsPercentage: validityCheck.invalidRecordsPercentage
      },
      uniqueness: {
        score: uniquenessCheck.score,
        duplicatesFound: uniquenessCheck.totalDuplicates
      },
      timeliness: {
        score: timelinessCheck.score,
        dataFreshness: timelinessCheck.freshnessStatus
      }
    },
    dataProfile: {
      totalRecords: dataProfile.totalRecords,
      totalColumns: dataProfile.totalColumns,
      numericColumns: dataProfile.numericColumns.length,
      categoricalColumns: dataProfile.categoricalColumns.length
    },
    artifacts,
    remediationPlan: remediationPlan ? remediationPlan.actionItems : null,
    duration,
    metadata: {
      processId: 'data-science-ml/data-collection-validation',
      timestamp: startTime,
      versioningEnabled,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Task 1: Data Source Discovery and Assessment
 */
export const dataSourceDiscoveryTask = defineTask('data-source-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover and assess data sources',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data engineer specializing in data ingestion and ETL',
      task: 'Assess accessibility and readiness of data sources for ingestion',
      context: {
        dataSources: args.dataSources,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each data source, verify accessibility (file exists, database connection, API reachable)',
        '2. Check authentication and permissions',
        '3. Estimate data volume and size',
        '4. Identify data format and structure',
        '5. Assess data freshness (last modified timestamp)',
        '6. Detect any immediate blockers (corrupted files, connection errors)',
        '7. Categorize sources as accessible, partially accessible, or inaccessible',
        '8. Generate source assessment report',
        '9. Save metadata for each source'
      ],
      outputFormat: 'JSON with success, accessibleSources, inaccessibleSources, assessmentSummary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'accessibleSources', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        accessibleSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              path: { type: 'string' },
              accessible: { type: 'boolean' },
              estimatedSize: { type: 'string' },
              estimatedRows: { type: 'number' },
              lastModified: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        inaccessibleSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              error: { type: 'string' }
            }
          }
        },
        assessmentSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-collection', 'discovery', 'assessment']
}));

/**
 * Task 2: Schema Validation and Inference
 */
export const schemaValidationTask = defineTask('schema-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate and infer data schemas',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data engineer specializing in data quality and schema management',
      task: 'Validate data against expected schema or infer schema from data sources',
      context: {
        dataSources: args.dataSources,
        schemaPath: args.schemaPath,
        outputDir: args.outputDir
      },
      instructions: [
        '1. If schema provided, load and parse schema definition',
        '2. If no schema provided, infer schema from data samples',
        '3. For each data source, validate column names, data types, and constraints',
        '4. Check for required columns, primary keys, foreign keys',
        '5. Identify schema mismatches, type inconsistencies, missing columns',
        '6. Generate schema documentation in JSON format',
        '7. Provide schema validation report with errors and warnings',
        '8. Recommend schema corrections if needed',
        '9. Save validated/inferred schemas for each source'
      ],
      outputFormat: 'JSON with schemaValid, schemaInferred, schemas, errors, warnings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schemaValid', 'schemas', 'artifacts'],
      properties: {
        schemaValid: { type: 'boolean' },
        schemaInferred: { type: 'boolean' },
        schemas: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              columns: { type: 'array' },
              primaryKey: { type: 'string' },
              constraints: { type: 'object' }
            }
          }
        },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              error: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        warnings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-collection', 'schema', 'validation']
}));

/**
 * Task 3: Data Ingestion
 */
export const dataIngestionTask = defineTask('data-ingestion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Ingest data from ${args.source.name}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data engineer specializing in ETL and data pipelines',
      task: 'Ingest data from source and convert to standardized format',
      context: {
        source: args.source,
        schema: args.schema,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Connect to data source using appropriate connector (file reader, DB client, API client)',
        '2. Read data incrementally if large dataset',
        '3. Parse data according to schema',
        '4. Handle encoding issues, date formats, numeric formats',
        '5. Convert to standardized format (Parquet or CSV)',
        '6. Save ingested data to output directory',
        '7. Generate ingestion metadata (rows ingested, bytes processed, duration)',
        '8. Handle errors gracefully and log issues',
        '9. Return success status with ingestion statistics'
      ],
      outputFormat: 'JSON with success, source, rowsIngested, outputPath, bytesProcessed, duration, errors, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'source', 'rowsIngested', 'outputPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        source: { type: 'string' },
        rowsIngested: { type: 'number' },
        outputPath: { type: 'string' },
        bytesProcessed: { type: 'number' },
        duration: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-collection', 'ingestion', `source-${args.source.name}`]
}));

/**
 * Task 4: Completeness Check
 */
export const completenessCheckTask = defineTask('completeness-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check data completeness',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data quality analyst specializing in data completeness assessment',
      task: 'Assess data completeness by checking for missing values and incomplete records',
      context: {
        ingestionResults: args.ingestionResults,
        validationRules: args.validationRules,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each ingested dataset, count missing values per column',
        '2. Calculate missing value percentage for each column',
        '3. Identify columns with >50% missing values (critical)',
        '4. Check for completely empty columns',
        '5. Analyze missing value patterns (random, systematic, correlated)',
        '6. Compute overall completeness score (0-100) based on missing data percentage',
        '7. Generate completeness report with recommendations',
        '8. Save missing value heatmap/matrix if applicable'
      ],
      outputFormat: 'JSON with score, overallMissingPercentage, columnAnalysis, criticalColumns, patterns, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'overallMissingPercentage', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        overallMissingPercentage: { type: 'number' },
        columnAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              column: { type: 'string' },
              missingCount: { type: 'number' },
              missingPercentage: { type: 'number' },
              criticality: { type: 'string' }
            }
          }
        },
        criticalColumns: { type: 'array', items: { type: 'string' } },
        patterns: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-quality', 'completeness', 'validation']
}));

/**
 * Task 5: Consistency Check
 */
export const consistencyCheckTask = defineTask('consistency-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check data consistency',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data quality analyst specializing in data consistency validation',
      task: 'Validate data consistency across sources and within datasets',
      context: {
        ingestionResults: args.ingestionResults,
        validationRules: args.validationRules,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Check referential integrity across related datasets (foreign keys)',
        '2. Validate data type consistency (no type mismatches)',
        '3. Check format consistency (dates, phone numbers, addresses)',
        '4. Verify cross-field consistency (e.g., end_date > start_date)',
        '5. Detect contradictory values',
        '6. Check for duplicate records with different values',
        '7. Compute consistency score (0-100)',
        '8. Generate consistency violation report with examples'
      ],
      outputFormat: 'JSON with score, totalInconsistencies, violationsByType, examples, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'totalInconsistencies', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        totalInconsistencies: { type: 'number' },
        violationsByType: {
          type: 'object',
          properties: {
            referentialIntegrity: { type: 'number' },
            typeInconsistency: { type: 'number' },
            formatInconsistency: { type: 'number' },
            crossFieldViolation: { type: 'number' }
          }
        },
        examples: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-quality', 'consistency', 'validation']
}));

/**
 * Task 6: Validity Check
 */
export const validityCheckTask = defineTask('validity-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check data validity',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data quality analyst specializing in data validity rules',
      task: 'Validate data values against business rules and constraints',
      context: {
        ingestionResults: args.ingestionResults,
        schemas: args.schemas,
        validationRules: args.validationRules,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate data against schema constraints (NOT NULL, CHECK constraints)',
        '2. Check domain validity (values within allowed ranges)',
        '3. Validate format rules (email format, phone format, regex patterns)',
        '4. Check business rules from validationRules parameter',
        '5. Detect outliers and anomalous values',
        '6. Validate enum/categorical values against allowed sets',
        '7. Compute validity score (0-100) based on invalid records percentage',
        '8. Generate validity violation report with rule breaches'
      ],
      outputFormat: 'JSON with score, invalidRecordsPercentage, violationsByRule, outliers, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'invalidRecordsPercentage', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        invalidRecordsPercentage: { type: 'number' },
        violationsByRule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { type: 'string' },
              violations: { type: 'number' },
              examples: { type: 'array' }
            }
          }
        },
        outliers: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-quality', 'validity', 'validation']
}));

/**
 * Task 7: Uniqueness Check
 */
export const uniquenessCheckTask = defineTask('uniqueness-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check data uniqueness',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data quality analyst specializing in duplicate detection',
      task: 'Detect duplicate records and ensure uniqueness constraints',
      context: {
        ingestionResults: args.ingestionResults,
        validationRules: args.validationRules,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify primary key columns and check for duplicates',
        '2. Detect exact duplicate rows (all columns identical)',
        '3. Find fuzzy duplicates (similar but not exact)',
        '4. Check uniqueness constraints from validation rules',
        '5. Count duplicate records per source',
        '6. Analyze duplicate patterns (which fields cause duplicates)',
        '7. Compute uniqueness score (0-100) based on duplicate percentage',
        '8. Generate deduplication recommendations'
      ],
      outputFormat: 'JSON with score, totalDuplicates, duplicatesByType, duplicateExamples, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'totalDuplicates', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        totalDuplicates: { type: 'number' },
        duplicatesByType: {
          type: 'object',
          properties: {
            exactDuplicates: { type: 'number' },
            fuzzyDuplicates: { type: 'number' },
            primaryKeyViolations: { type: 'number' }
          }
        },
        duplicateExamples: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-quality', 'uniqueness', 'deduplication']
}));

/**
 * Task 8: Timeliness Check
 */
export const timelinessCheckTask = defineTask('timeliness-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check data timeliness',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data quality analyst specializing in data freshness assessment',
      task: 'Assess data timeliness and freshness',
      context: {
        ingestionResults: args.ingestionResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Check data source last modified timestamps',
        '2. Analyze timestamp columns in data for recency',
        '3. Identify stale data (older than expected)',
        '4. Check for future dates (data quality issue)',
        '5. Compute data freshness metrics (most recent record, oldest record, median age)',
        '6. Assess if data is current enough for intended use',
        '7. Compute timeliness score (0-100) based on freshness',
        '8. Generate timeliness report with freshness recommendations'
      ],
      outputFormat: 'JSON with score, freshnessStatus, oldestRecord, newestRecord, medianAge, staleDataCount, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'freshnessStatus', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        freshnessStatus: { type: 'string', enum: ['fresh', 'acceptable', 'stale', 'very-stale'] },
        oldestRecord: { type: 'string' },
        newestRecord: { type: 'string' },
        medianAge: { type: 'string' },
        staleDataCount: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-quality', 'timeliness', 'freshness']
}));

/**
 * Task 9: Quality Scoring
 */
export const qualityScoringTask = defineTask('quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute overall quality score',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior data quality engineer',
      task: 'Compute weighted overall data quality score from individual dimension scores',
      context: {
        validationResults: args.validationResults,
        targetQuality: args.targetQuality,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Aggregate scores from all quality dimensions (completeness, consistency, validity, uniqueness, timeliness)',
        '2. Apply weighted scoring: Completeness (25%), Validity (25%), Consistency (20%), Uniqueness (20%), Timeliness (10%)',
        '3. Compute overall quality score (0-100)',
        '4. Identify critical issues that impact score significantly',
        '5. Compare against target quality threshold',
        '6. Generate prioritized recommendations for improvement',
        '7. Create quality scorecard with dimension breakdown',
        '8. Save comprehensive quality assessment report'
      ],
      outputFormat: 'JSON with overallScore, dimensionScores, criticalIssues, warnings, recommendations, qualityMet, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'dimensionScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        dimensionScores: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            consistency: { type: 'number' },
            validity: { type: 'number' },
            uniqueness: { type: 'number' },
            timeliness: { type: 'number' }
          }
        },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        qualityMet: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-quality', 'scoring', 'assessment']
}));

/**
 * Task 10: Data Profiling
 */
export const dataProfilingTask = defineTask('data-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate data profile',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'data analyst specializing in exploratory data analysis',
      task: 'Generate comprehensive data profile with statistics and distributions',
      context: {
        ingestionResults: args.ingestionResults,
        schemas: args.schemas,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compute summary statistics for all columns (count, mean, std, min, max, percentiles)',
        '2. Analyze distributions (histograms for numeric, frequency tables for categorical)',
        '3. Identify data types and cardinality',
        '4. Detect potential relationships between columns (correlations)',
        '5. Generate data profile report with visualizations',
        '6. Create data dictionary with column descriptions',
        '7. Save profile artifacts (HTML report, JSON metadata)',
        '8. Provide insights about data characteristics'
      ],
      outputFormat: 'JSON with totalRecords, totalColumns, numericColumns, categoricalColumns, statistics, correlations, insights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalRecords', 'totalColumns', 'artifacts'],
      properties: {
        totalRecords: { type: 'number' },
        totalColumns: { type: 'number' },
        numericColumns: { type: 'array', items: { type: 'string' } },
        categoricalColumns: { type: 'array', items: { type: 'string' } },
        statistics: { type: 'object' },
        correlations: { type: 'array' },
        insights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-profiling', 'statistics', 'eda']
}));

/**
 * Task 11: Data Versioning
 */
export const dataVersioningTask = defineTask('data-versioning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Version dataset with DVC',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MLOps engineer specializing in data version control',
      task: 'Version the ingested and validated dataset using DVC or similar tool',
      context: {
        ingestionResults: args.ingestionResults,
        qualityScore: args.qualityScore,
        validationResults: args.validationResults,
        dataProfile: args.dataProfile,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Initialize or use existing DVC repository',
        '2. Add ingested datasets to DVC tracking',
        '3. Generate version tag based on timestamp and quality score',
        '4. Create metadata file with version info, quality metrics, and provenance',
        '5. Commit DVC changes with descriptive message',
        '6. Tag the dataset version',
        '7. Generate dataset card/documentation',
        '8. Save version manifest with lineage information'
      ],
      outputFormat: 'JSON with version, commitHash, versionTag, datasetCard, lineage, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['version', 'artifacts'],
      properties: {
        version: { type: 'string' },
        commitHash: { type: 'string' },
        versionTag: { type: 'string' },
        datasetCard: { type: 'string' },
        lineage: {
          type: 'object',
          properties: {
            sources: { type: 'array' },
            timestamp: { type: 'string' },
            qualityScore: { type: 'number' }
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
  labels: ['data-versioning', 'dvc', 'mlops']
}));

/**
 * Task 12: Quality Report Generation
 */
export const qualityReportGenerationTask = defineTask('quality-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate quality report',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'technical writer and data quality specialist',
      task: 'Generate comprehensive, executive-ready data quality report',
      context: {
        dataSources: args.dataSources,
        sourceAssessment: args.sourceAssessment,
        schemaValidation: args.schemaValidation,
        ingestionResults: args.ingestionResults,
        validationResults: args.validationResults,
        qualityScore: args.qualityScore,
        dataProfile: args.dataProfile,
        versioningResult: args.versioningResult,
        targetQuality: args.targetQuality,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary with key findings and quality score',
        '2. Document data sources and ingestion summary',
        '3. Present schema validation results',
        '4. Summarize quality assessment across all dimensions',
        '5. Highlight critical issues and data quality problems',
        '6. Include data profile insights',
        '7. Present versioning information if applicable',
        '8. Provide actionable recommendations',
        '9. Format as professional Markdown report',
        '10. Save report and supporting artifacts'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reporting', 'documentation', 'quality']
}));

/**
 * Task 13: Remediation Planning
 */
export const remediationPlanningTask = defineTask('remediation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate remediation plan',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior data engineer specializing in data quality improvement',
      task: 'Generate prioritized remediation plan to improve data quality',
      context: {
        qualityScore: args.qualityScore,
        validationResults: args.validationResults,
        dataProfile: args.dataProfile,
        targetQuality: args.targetQuality,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze all quality issues identified across dimensions',
        '2. Prioritize issues by severity and impact on quality score',
        '3. Generate specific, actionable remediation steps',
        '4. Estimate effort and complexity for each remediation',
        '5. Recommend data cleaning strategies (imputation, deduplication, correction)',
        '6. Suggest pipeline improvements to prevent issues',
        '7. Provide code examples or references where helpful',
        '8. Create prioritized action item checklist',
        '9. Estimate expected quality improvement for each action'
      ],
      outputFormat: 'JSON with actionItems, pipelineImprovements, estimatedImpact, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['actionItems', 'artifacts'],
      properties: {
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              issue: { type: 'string' },
              remediation: { type: 'string' },
              estimatedEffort: { type: 'string' },
              expectedImprovement: { type: 'number' },
              codeExample: { type: 'string' }
            }
          }
        },
        pipelineImprovements: { type: 'array', items: { type: 'string' } },
        estimatedImpact: {
          type: 'object',
          properties: {
            currentScore: { type: 'number' },
            projectedScore: { type: 'number' },
            confidence: { type: 'string' }
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
  labels: ['remediation', 'planning', 'quality-improvement']
}));
