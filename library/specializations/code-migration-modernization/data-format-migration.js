/**
 * @process specializations/code-migration-modernization/data-format-migration
 * @description Data Format Migration - Process for migrating data between formats (XML to JSON, CSV to
 * database, legacy formats to modern standards) with proper validation and transformation pipelines.
 * @inputs { projectName: string, sourceFormat?: object, targetFormat?: object, dataVolume?: string, validationRules?: array }
 * @outputs { success: boolean, formatAnalysis: object, transformationRules: array, migratedData: object, validationReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/data-format-migration', {
 *   projectName: 'Config XML to JSON Migration',
 *   sourceFormat: { type: 'XML', schema: 'config.xsd' },
 *   targetFormat: { type: 'JSON', schema: 'config.json-schema' },
 *   dataVolume: '10GB',
 *   validationRules: ['schema-compliance', 'data-integrity', 'encoding']
 * });
 *
 * @references
 * - JSON Schema: https://json-schema.org/
 * - Apache NiFi: https://nifi.apache.org/
 * - Data Transformation Patterns: https://www.enterpriseintegrationpatterns.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sourceFormat = {},
    targetFormat = {},
    dataVolume = '',
    validationRules = [],
    outputDir = 'data-format-migration-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Data Format Migration for ${projectName}`);

  // ============================================================================
  // PHASE 1: FORMAT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing data formats');
  const formatAnalysis = await ctx.task(formatAnalysisTask, {
    projectName,
    sourceFormat,
    targetFormat,
    outputDir
  });

  artifacts.push(...formatAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: TRANSFORMATION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing transformation');
  const transformationDesign = await ctx.task(transformationDesignTask, {
    projectName,
    formatAnalysis,
    sourceFormat,
    targetFormat,
    outputDir
  });

  artifacts.push(...transformationDesign.artifacts);

  // Breakpoint: Transformation review
  await ctx.breakpoint({
    question: `Transformation design complete for ${projectName}. Rules: ${transformationDesign.ruleCount}. Complexity: ${transformationDesign.complexity}. Approve transformation mapping?`,
    title: 'Transformation Design Review',
    context: {
      runId: ctx.runId,
      projectName,
      transformationDesign,
      recommendation: 'Review transformation rules with sample data'
    }
  });

  // ============================================================================
  // PHASE 3: PIPELINE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing transformation pipeline');
  const pipelineDevelopment = await ctx.task(pipelineDevelopmentTask, {
    projectName,
    transformationDesign,
    dataVolume,
    outputDir
  });

  artifacts.push(...pipelineDevelopment.artifacts);

  // ============================================================================
  // PHASE 4: SAMPLE VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Validating with sample data');
  const sampleValidation = await ctx.task(sampleValidationTask, {
    projectName,
    pipelineDevelopment,
    validationRules,
    outputDir
  });

  artifacts.push(...sampleValidation.artifacts);

  // Quality Gate: Sample validation
  if (!sampleValidation.allPassed) {
    await ctx.breakpoint({
      question: `Sample validation failed for ${projectName}. Failed checks: ${sampleValidation.failedCount}. Review and fix transformation?`,
      title: 'Sample Validation Failed',
      context: {
        runId: ctx.runId,
        projectName,
        failures: sampleValidation.failures,
        recommendation: 'Fix transformation rules before full migration'
      }
    });
  }

  // ============================================================================
  // PHASE 5: FULL MIGRATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Executing full migration');
  const fullMigration = await ctx.task(fullMigrationTask, {
    projectName,
    pipelineDevelopment,
    dataVolume,
    outputDir
  });

  artifacts.push(...fullMigration.artifacts);

  // ============================================================================
  // PHASE 6: VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Validating migrated data');
  const validation = await ctx.task(dataValidationTask, {
    projectName,
    fullMigration,
    validationRules,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Data format migration complete for ${projectName}. Records migrated: ${fullMigration.recordCount}. Validation passed: ${validation.allPassed}. Approve migration?`,
    title: 'Data Format Migration Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        from: sourceFormat.type,
        to: targetFormat.type,
        records: fullMigration.recordCount,
        validationPassed: validation.allPassed
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    formatAnalysis,
    transformationRules: transformationDesign.rules,
    migratedData: {
      recordCount: fullMigration.recordCount,
      dataVolume: fullMigration.outputVolume
    },
    validationReport: validation,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/data-format-migration',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const formatAnalysisTask = defineTask('format-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Format Analysis - ${args.projectName}`,
  agent: {
    name: 'data-integrity-validator',
    prompt: {
      role: 'Data Engineer',
      task: 'Analyze source and target data formats',
      context: args,
      instructions: [
        '1. Analyze source format structure',
        '2. Document source schema',
        '3. Analyze target format requirements',
        '4. Map data types',
        '5. Identify transformation needs',
        '6. Document encoding requirements',
        '7. Identify edge cases',
        '8. Assess complexity',
        '9. Document constraints',
        '10. Generate format analysis'
      ],
      outputFormat: 'JSON with sourceSchema, targetSchema, typeMapping, complexity, constraints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sourceSchema', 'targetSchema', 'complexity', 'artifacts'],
      properties: {
        sourceSchema: { type: 'object' },
        targetSchema: { type: 'object' },
        typeMapping: { type: 'array', items: { type: 'object' } },
        complexity: { type: 'string' },
        constraints: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-format', 'analysis', 'schema']
}));

export const transformationDesignTask = defineTask('transformation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Transformation Design - ${args.projectName}`,
  agent: {
    name: 'code-transformation-executor',
    prompt: {
      role: 'ETL Architect',
      task: 'Design data transformation rules',
      context: args,
      instructions: [
        '1. Define field mappings',
        '2. Design type conversions',
        '3. Handle nested structures',
        '4. Define default values',
        '5. Design error handling',
        '6. Handle missing data',
        '7. Define validation rules',
        '8. Design enrichment rules',
        '9. Document edge cases',
        '10. Generate transformation spec'
      ],
      outputFormat: 'JSON with ruleCount, rules, complexity, edgeCases, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ruleCount', 'rules', 'complexity', 'artifacts'],
      properties: {
        ruleCount: { type: 'number' },
        rules: { type: 'array', items: { type: 'object' } },
        complexity: { type: 'string' },
        edgeCases: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-format', 'transformation', 'design']
}));

export const pipelineDevelopmentTask = defineTask('pipeline-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Pipeline Development - ${args.projectName}`,
  agent: {
    name: 'code-transformation-executor',
    prompt: {
      role: 'Data Engineer',
      task: 'Develop transformation pipeline',
      context: args,
      instructions: [
        '1. Implement transformation logic',
        '2. Build parsing components',
        '3. Implement serialization',
        '4. Add error handling',
        '5. Implement batching',
        '6. Add progress tracking',
        '7. Implement logging',
        '8. Add checkpointing',
        '9. Test pipeline',
        '10. Document implementation'
      ],
      outputFormat: 'JSON with pipelineReady, components, batchSize, checkpointing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pipelineReady', 'components', 'artifacts'],
      properties: {
        pipelineReady: { type: 'boolean' },
        components: { type: 'array', items: { type: 'object' } },
        batchSize: { type: 'number' },
        checkpointing: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-format', 'pipeline', 'development']
}));

export const sampleValidationTask = defineTask('sample-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Sample Validation - ${args.projectName}`,
  agent: {
    name: 'data-integrity-validator',
    prompt: {
      role: 'QA Engineer',
      task: 'Validate transformation with sample data',
      context: args,
      instructions: [
        '1. Select representative samples',
        '2. Run transformation',
        '3. Validate output format',
        '4. Check data accuracy',
        '5. Validate edge cases',
        '6. Check error handling',
        '7. Verify encoding',
        '8. Validate schema',
        '9. Document results',
        '10. Generate validation report'
      ],
      outputFormat: 'JSON with allPassed, passedCount, failedCount, failures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'passedCount', 'failedCount', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        failures: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-format', 'validation', 'sample']
}));

export const fullMigrationTask = defineTask('full-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Full Migration - ${args.projectName}`,
  agent: {
    name: 'code-transformation-executor',
    prompt: {
      role: 'Data Migration Engineer',
      task: 'Execute full data migration',
      context: args,
      instructions: [
        '1. Start migration pipeline',
        '2. Process all data',
        '3. Track progress',
        '4. Handle errors',
        '5. Log statistics',
        '6. Monitor performance',
        '7. Verify completeness',
        '8. Calculate output volume',
        '9. Generate completion report',
        '10. Document results'
      ],
      outputFormat: 'JSON with recordCount, outputVolume, errors, duration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recordCount', 'outputVolume', 'artifacts'],
      properties: {
        recordCount: { type: 'number' },
        outputVolume: { type: 'string' },
        errors: { type: 'array', items: { type: 'object' } },
        duration: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-format', 'migration', 'execution']
}));

export const dataValidationTask = defineTask('data-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Data Validation - ${args.projectName}`,
  agent: {
    name: 'data-integrity-validator',
    prompt: {
      role: 'Data Quality Engineer',
      task: 'Validate migrated data',
      context: args,
      instructions: [
        '1. Validate schema compliance',
        '2. Check record counts',
        '3. Verify data integrity',
        '4. Validate checksums',
        '5. Check referential integrity',
        '6. Validate business rules',
        '7. Compare samples',
        '8. Check encoding',
        '9. Generate quality metrics',
        '10. Create validation report'
      ],
      outputFormat: 'JSON with allPassed, schemaValid, recordCountMatch, integrityValid, qualityMetrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'schemaValid', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        schemaValid: { type: 'boolean' },
        recordCountMatch: { type: 'boolean' },
        integrityValid: { type: 'boolean' },
        qualityMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['data-format', 'validation', 'quality']
}));
