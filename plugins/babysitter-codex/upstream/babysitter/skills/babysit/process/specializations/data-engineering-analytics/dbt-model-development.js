/**
 * @process specializations/data-engineering-analytics/dbt-model-development
 * @description dbt Model Development - Guide the complete development lifecycle of dbt models from staging through intermediate to marts layers,
 * following naming conventions, implementing tests, creating documentation, and conducting thorough code reviews.
 * @specialization Data Engineering & Analytics
 * @category Data Transformation
 * @inputs { modelName: string, modelType: string, layer: string, sourceTables?: array, businessRequirements?: string, targetWarehouse?: string, materialStrategy?: string, reviewRequired?: boolean }
 * @outputs { success: boolean, model: object, tests: array, documentation: object, codeReview: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/data-engineering-analytics/dbt-model-development', {
 *   modelName: 'fct_orders',
 *   modelType: 'fact',
 *   layer: 'marts',
 *   sourceTables: ['stg_orders', 'stg_customers', 'stg_products'],
 *   businessRequirements: 'Create a fact table tracking all order transactions with customer and product details',
 *   targetWarehouse: 'Snowflake',
 *   materialStrategy: 'incremental',
 *   reviewRequired: true,
 *   testingLevel: 'comprehensive',
 *   documentationStyle: 'descriptive'
 * });
 *
 * @references
 * - dbt Best Practices: https://docs.getdbt.com/guides/best-practices
 * - dbt Style Guide: https://github.com/dbt-labs/corp/blob/main/dbt_style_guide.md
 * - dbt Model Layers: https://docs.getdbt.com/guides/best-practices/how-we-structure/1-guide-overview
 * - dbt Testing: https://docs.getdbt.com/docs/build/tests
 * - dbt Documentation: https://docs.getdbt.com/docs/collaborate/documentation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    modelName,
    modelType = 'base',
    layer,
    sourceTables = [],
    businessRequirements = '',
    targetWarehouse = 'Snowflake',
    materialStrategy = 'view',
    reviewRequired = true,
    testingLevel = 'comprehensive',
    documentationStyle = 'descriptive',
    enableIncrementalStrategy = false,
    performanceOptimization = true,
    outputDir = 'dbt-model-development'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Validate required inputs
  if (!modelName || !layer) {
    return {
      success: false,
      error: 'Model name and layer are required',
      metadata: {
        processId: 'specializations/data-engineering-analytics/dbt-model-development',
        timestamp: startTime
      }
    };
  }

  // Validate layer is one of: staging, intermediate, marts
  const validLayers = ['staging', 'intermediate', 'marts'];
  if (!validLayers.includes(layer)) {
    return {
      success: false,
      error: `Invalid layer "${layer}". Must be one of: ${validLayers.join(', ')}`,
      metadata: {
        processId: 'specializations/data-engineering-analytics/dbt-model-development',
        timestamp: startTime
      }
    };
  }

  ctx.log('info', `Starting dbt Model Development: ${modelName}`);
  ctx.log('info', `Layer: ${layer}, Type: ${modelType}`);
  ctx.log('info', `Target Warehouse: ${targetWarehouse}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS AND MODEL DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing requirements and designing model structure');

  const modelDesign = await ctx.task(modelDesignTask, {
    modelName,
    modelType,
    layer,
    sourceTables,
    businessRequirements,
    targetWarehouse,
    outputDir
  });

  artifacts.push(...modelDesign.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: Model design created for "${modelName}" in ${layer} layer. Design includes ${modelDesign.columnCount} columns, ${modelDesign.dependencies.length} dependencies. Review design?`,
    title: 'Model Design Review',
    context: {
      runId: ctx.runId,
      modelName,
      layer,
      modelType,
      design: {
        columns: modelDesign.columns,
        dependencies: modelDesign.dependencies,
        businessLogic: modelDesign.businessLogic,
        grain: modelDesign.grain
      },
      files: modelDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 2: NAMING CONVENTION VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Validating naming conventions');

  const namingValidation = await ctx.task(namingConventionTask, {
    modelName,
    layer,
    modelType,
    modelDesign,
    outputDir
  });

  artifacts.push(...namingValidation.artifacts);

  if (!namingValidation.compliant) {
    await ctx.breakpoint({
      question: `Naming Convention Warning: Model name "${modelName}" does not follow best practices. Suggested name: "${namingValidation.suggestedName}". Violations: ${namingValidation.violations.join(', ')}. Continue anyway?`,
      title: 'Naming Convention Issues',
      context: {
        runId: ctx.runId,
        currentName: modelName,
        suggestedName: namingValidation.suggestedName,
        violations: namingValidation.violations,
        namingRules: namingValidation.rules,
        files: namingValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: STAGING LAYER DEVELOPMENT (if layer === 'staging')
  // ============================================================================

  let stagingModel = null;
  if (layer === 'staging') {
    ctx.log('info', 'Phase 3: Developing staging layer model');

    stagingModel = await ctx.task(stagingModelDevelopmentTask, {
      modelName,
      modelDesign,
      sourceTables,
      targetWarehouse,
      outputDir
    });

    artifacts.push(...stagingModel.artifacts);
  }

  // ============================================================================
  // PHASE 4: INTERMEDIATE LAYER DEVELOPMENT (if layer === 'intermediate')
  // ============================================================================

  let intermediateModel = null;
  if (layer === 'intermediate') {
    ctx.log('info', 'Phase 4: Developing intermediate layer model with business logic');

    intermediateModel = await ctx.task(intermediateModelDevelopmentTask, {
      modelName,
      modelDesign,
      sourceTables,
      targetWarehouse,
      businessRequirements,
      outputDir
    });

    artifacts.push(...intermediateModel.artifacts);
  }

  // ============================================================================
  // PHASE 5: MARTS LAYER DEVELOPMENT (if layer === 'marts')
  // ============================================================================

  let martsModel = null;
  if (layer === 'marts') {
    ctx.log('info', 'Phase 5: Developing marts layer model (dimensional/denormalized)');

    martsModel = await ctx.task(martsModelDevelopmentTask, {
      modelName,
      modelType,
      modelDesign,
      sourceTables,
      targetWarehouse,
      materialStrategy,
      enableIncrementalStrategy,
      outputDir
    });

    artifacts.push(...martsModel.artifacts);
  }

  // Consolidate model output
  const modelOutput = stagingModel || intermediateModel || martsModel;

  await ctx.breakpoint({
    question: `Model Development Complete: "${modelName}" SQL model created with ${modelOutput.lineCount} lines of code. Model includes ${modelOutput.transformations.length} transformations. Review SQL code?`,
    title: 'Model Code Review',
    context: {
      runId: ctx.runId,
      modelName,
      layer,
      sqlPath: modelOutput.sqlPath,
      lineCount: modelOutput.lineCount,
      transformations: modelOutput.transformations,
      dependencies: modelOutput.dependencies,
      files: [
        { path: modelOutput.sqlPath, format: 'sql', label: 'Model SQL' },
        ...modelOutput.artifacts.map(a => ({ path: a.path, format: a.format || 'sql' }))
      ]
    }
  });

  // ============================================================================
  // PHASE 6: MATERIALIZATION CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Configuring model materialization strategy');

  const materializationConfig = await ctx.task(materializationConfigTask, {
    modelName,
    layer,
    materialStrategy,
    enableIncrementalStrategy,
    targetWarehouse,
    modelOutput,
    performanceOptimization,
    outputDir
  });

  artifacts.push(...materializationConfig.artifacts);

  // ============================================================================
  // PHASE 7: TEST DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating comprehensive data tests');

  const testDevelopment = await ctx.task(testDevelopmentTask, {
    modelName,
    layer,
    modelDesign,
    modelOutput,
    testingLevel,
    outputDir
  });

  artifacts.push(...testDevelopment.artifacts);

  await ctx.breakpoint({
    question: `Phase 7 Complete: ${testDevelopment.totalTests} tests created - Schema tests: ${testDevelopment.schemaTests}, Data quality tests: ${testDevelopment.dataQualityTests}, Custom tests: ${testDevelopment.customTests}. Review test coverage?`,
    title: 'Test Coverage Review',
    context: {
      runId: ctx.runId,
      modelName,
      testCoverage: {
        totalTests: testDevelopment.totalTests,
        schemaTests: testDevelopment.schemaTests,
        dataQualityTests: testDevelopment.dataQualityTests,
        customTests: testDevelopment.customTests,
        coveragePercentage: testDevelopment.coveragePercentage
      },
      testCategories: testDevelopment.testCategories,
      files: testDevelopment.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 8: DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating model documentation');

  const documentation = await ctx.task(documentationGenerationTask, {
    modelName,
    layer,
    modelType,
    modelDesign,
    modelOutput,
    businessRequirements,
    documentationStyle,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 9: PERFORMANCE OPTIMIZATION (if enabled)
  // ============================================================================

  let performanceOptimizations = null;
  if (performanceOptimization) {
    ctx.log('info', 'Phase 9: Applying performance optimizations');

    performanceOptimizations = await ctx.task(performanceOptimizationTask, {
      modelName,
      layer,
      targetWarehouse,
      modelOutput,
      materializationConfig,
      outputDir
    });

    artifacts.push(...performanceOptimizations.artifacts);
  }

  // ============================================================================
  // PHASE 10: CODE REVIEW (if required)
  // ============================================================================

  let codeReview = null;
  if (reviewRequired) {
    ctx.log('info', 'Phase 10: Conducting comprehensive code review');

    codeReview = await ctx.task(codeReviewTask, {
      modelName,
      layer,
      modelOutput,
      testDevelopment,
      documentation,
      materializationConfig,
      namingValidation,
      outputDir
    });

    artifacts.push(...codeReview.artifacts);

    const reviewScore = codeReview.overallScore;
    const reviewPassed = reviewScore >= 80;

    if (!reviewPassed) {
      await ctx.breakpoint({
        question: `Code Review Warning: Model "${modelName}" scored ${reviewScore}/100 (below threshold of 80). ${codeReview.issues.length} issue(s) found. Review and address issues?`,
        title: 'Code Review Issues',
        context: {
          runId: ctx.runId,
          modelName,
          reviewScore,
          passedChecks: codeReview.passedChecks,
          issues: codeReview.issues,
          recommendations: codeReview.recommendations,
          files: codeReview.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 11: INTEGRATION VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Validating model integration and dependencies');

  const integrationValidation = await ctx.task(integrationValidationTask, {
    modelName,
    layer,
    modelOutput,
    sourceTables,
    outputDir
  });

  artifacts.push(...integrationValidation.artifacts);

  // ============================================================================
  // PHASE 12: DEPLOYMENT CHECKLIST
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating deployment checklist and handoff documentation');

  const deploymentChecklist = await ctx.task(deploymentChecklistTask, {
    modelName,
    layer,
    modelOutput,
    testDevelopment,
    documentation,
    codeReview,
    integrationValidation,
    materializationConfig,
    outputDir
  });

  artifacts.push(...deploymentChecklist.artifacts);

  // ============================================================================
  // FINAL BREAKPOINT: MODEL DEVELOPMENT COMPLETE
  // ============================================================================

  const finalScore = codeReview ? codeReview.overallScore : 100;
  const deploymentReady = finalScore >= 80 && integrationValidation.passed;

  await ctx.breakpoint({
    question: `dbt Model Development Complete for "${modelName}"! Code Review Score: ${finalScore}/100. ${testDevelopment.totalTests} tests, ${documentation.coveragePercentage}% documentation coverage. ${deploymentReady ? 'Ready for deployment' : 'Requires fixes before deployment'}. Review deliverables?`,
    title: 'Model Development Complete',
    context: {
      runId: ctx.runId,
      summary: {
        modelName,
        layer,
        modelType,
        deploymentReady,
        codeReviewScore: finalScore,
        lineCount: modelOutput.lineCount,
        totalTests: testDevelopment.totalTests,
        documentationCoverage: documentation.coveragePercentage,
        materializationStrategy: materializationConfig.strategy,
        dependencies: modelOutput.dependencies,
        performanceOptimized: performanceOptimization
      },
      deploymentChecklist: deploymentChecklist.items,
      files: [
        { path: modelOutput.sqlPath, format: 'sql', label: 'Model SQL' },
        { path: testDevelopment.yamlPath, format: 'yaml', label: 'Tests Configuration' },
        { path: documentation.yamlPath, format: 'yaml', label: 'Documentation' },
        { path: deploymentChecklist.checklistPath, format: 'markdown', label: 'Deployment Checklist' },
        ...(codeReview ? [{ path: codeReview.reportPath, format: 'markdown', label: 'Code Review Report' }] : [])
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: deploymentReady,
    modelName,
    layer,
    modelType,
    model: {
      sqlPath: modelOutput.sqlPath,
      lineCount: modelOutput.lineCount,
      transformations: modelOutput.transformations,
      dependencies: modelOutput.dependencies,
      materializationStrategy: materializationConfig.strategy,
      incrementalEnabled: materializationConfig.incrementalEnabled,
      partitioning: materializationConfig.partitioning,
      clustering: materializationConfig.clustering
    },
    tests: {
      totalTests: testDevelopment.totalTests,
      schemaTests: testDevelopment.schemaTests,
      dataQualityTests: testDevelopment.dataQualityTests,
      customTests: testDevelopment.customTests,
      coveragePercentage: testDevelopment.coveragePercentage,
      yamlPath: testDevelopment.yamlPath
    },
    documentation: {
      coveragePercentage: documentation.coveragePercentage,
      modelDescription: documentation.modelDescription,
      columnsCovered: documentation.columnsCovered,
      yamlPath: documentation.yamlPath
    },
    codeReview: codeReview ? {
      overallScore: codeReview.overallScore,
      passedChecks: codeReview.passedChecks,
      issues: codeReview.issues,
      recommendations: codeReview.recommendations,
      reportPath: codeReview.reportPath
    } : null,
    integrationValidation: {
      passed: integrationValidation.passed,
      dependenciesValid: integrationValidation.dependenciesValid,
      circularDependencies: integrationValidation.circularDependencies,
      warnings: integrationValidation.warnings
    },
    performanceOptimizations: performanceOptimizations ? {
      applied: true,
      optimizations: performanceOptimizations.optimizations,
      estimatedImprovement: performanceOptimizations.estimatedImprovement
    } : { applied: false },
    deploymentChecklist: deploymentChecklist.items,
    deploymentReady,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/data-engineering-analytics/dbt-model-development',
      timestamp: startTime,
      targetWarehouse,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Model Design
export const modelDesignTask = defineTask('model-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Model Design - ${args.modelName}`,
  agent: {
    name: 'dbt-architect',
    prompt: {
      role: 'Senior Analytics Engineer specializing in dbt model architecture',
      task: 'Design the structure and logic for the dbt model',
      context: {
        modelName: args.modelName,
        modelType: args.modelType,
        layer: args.layer,
        sourceTables: args.sourceTables,
        businessRequirements: args.businessRequirements,
        targetWarehouse: args.targetWarehouse,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze business requirements and translate to data model design',
        '2. Identify all required columns with data types and descriptions',
        '3. Define model grain (one row represents what?)',
        '4. Determine dependencies on source tables and upstream models',
        '5. Design transformation logic and business rules',
        '6. Identify primary keys and unique identifiers',
        '7. Plan joins, aggregations, and calculations',
        '8. Consider slowly changing dimensions (SCD) if applicable',
        '9. Design for testability and maintainability',
        '10. Document design decisions and rationale',
        '11. Create model design specification document',
        '12. Generate column-level design with transformations'
      ],
      outputFormat: 'JSON with columns, grain, dependencies, businessLogic, primaryKeys, transformations, designDoc, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['columns', 'grain', 'dependencies', 'businessLogic', 'columnCount', 'artifacts'],
      properties: {
        columns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              dataType: { type: 'string' },
              description: { type: 'string' },
              source: { type: 'string' },
              transformation: { type: 'string' },
              testable: { type: 'boolean' }
            }
          }
        },
        grain: { type: 'string' },
        dependencies: { type: 'array', items: { type: 'string' } },
        businessLogic: { type: 'string' },
        primaryKeys: { type: 'array', items: { type: 'string' } },
        transformations: { type: 'array', items: { type: 'string' } },
        columnCount: { type: 'number' },
        scdType: { type: 'string' },
        designDoc: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'model-design', 'architecture', 'data-engineering']
}));

// Phase 2: Naming Convention Validation
export const namingConventionTask = defineTask('naming-convention', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Naming Convention Validation - ${args.modelName}`,
  agent: {
    name: 'dbt-standards-validator',
    prompt: {
      role: 'dbt Standards and Governance Specialist',
      task: 'Validate model naming conventions against dbt best practices',
      context: {
        modelName: args.modelName,
        layer: args.layer,
        modelType: args.modelType,
        modelDesign: args.modelDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Check layer-specific naming prefix (stg_, int_, fct_, dim_)',
        '2. Validate snake_case format',
        '3. Check for appropriate model type suffix if applicable',
        '4. Verify semantic naming clarity',
        '5. Validate against dbt style guide naming rules',
        '6. Check for reserved words and conflicts',
        '7. Verify name length is reasonable (<50 characters)',
        '8. Check consistency with existing project naming',
        '9. Generate suggested name if violations found',
        '10. Document naming conventions and rules',
        '11. Provide specific violation details',
        '12. Generate naming convention guide'
      ],
      outputFormat: 'JSON with compliant, suggestedName, violations, rules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['compliant', 'violations', 'rules', 'artifacts'],
      properties: {
        compliant: { type: 'boolean' },
        suggestedName: { type: 'string' },
        violations: { type: 'array', items: { type: 'string' } },
        rules: {
          type: 'object',
          properties: {
            staging: { type: 'string' },
            intermediate: { type: 'string' },
            marts: { type: 'string' }
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
  labels: ['dbt', 'naming', 'standards', 'validation']
}));

// Phase 3: Staging Model Development
export const stagingModelDevelopmentTask = defineTask('staging-model-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Staging Model Development - ${args.modelName}`,
  agent: {
    name: 'staging-developer',
    prompt: {
      role: 'Analytics Engineer specializing in staging model development',
      task: 'Develop staging layer SQL model with light transformations',
      context: {
        modelName: args.modelName,
        modelDesign: args.modelDesign,
        sourceTables: args.sourceTables,
        targetWarehouse: args.targetWarehouse,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create SQL file following dbt structure',
        '2. Use source() function to reference raw tables',
        '3. Apply naming conventions: rename columns to snake_case',
        '4. Cast data types to standard types',
        '5. Add surrogate keys using dbt_utils.generate_surrogate_key() if needed',
        '6. Standardize timestamps to UTC',
        '7. Apply basic cleaning (trim, lowercase, etc.)',
        '8. Remove system columns not needed downstream',
        '9. Add basic computed columns (e.g., full_name)',
        '10. Use CTEs for readability',
        '11. Add SQL comments explaining transformations',
        '12. Format SQL with consistent indentation and style'
      ],
      outputFormat: 'JSON with sqlPath, sqlContent, lineCount, transformations, dependencies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sqlPath', 'lineCount', 'transformations', 'dependencies', 'artifacts'],
      properties: {
        sqlPath: { type: 'string' },
        sqlContent: { type: 'string' },
        lineCount: { type: 'number' },
        transformations: { type: 'array', items: { type: 'string' } },
        dependencies: { type: 'array', items: { type: 'string' } },
        ctesUsed: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'staging', 'sql', 'development']
}));

// Phase 4: Intermediate Model Development
export const intermediateModelDevelopmentTask = defineTask('intermediate-model-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Intermediate Model Development - ${args.modelName}`,
  agent: {
    name: 'transformation-developer',
    prompt: {
      role: 'Analytics Engineer specializing in intermediate model business logic',
      task: 'Develop intermediate layer SQL model with complex business logic',
      context: {
        modelName: args.modelName,
        modelDesign: args.modelDesign,
        sourceTables: args.sourceTables,
        targetWarehouse: args.targetWarehouse,
        businessRequirements: args.businessRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create SQL file with complex joins and transformations',
        '2. Use ref() function to reference staging models',
        '3. Implement business logic and calculations',
        '4. Apply data quality rules and filtering',
        '5. Handle joins between multiple staging models',
        '6. Implement deduplication logic if needed',
        '7. Create unified entity views (e.g., unified customer)',
        '8. Apply business rules from requirements',
        '9. Use window functions for advanced analytics',
        '10. Structure SQL with clear CTEs for each logical step',
        '11. Add comprehensive SQL comments',
        '12. Optimize query performance where possible'
      ],
      outputFormat: 'JSON with sqlPath, sqlContent, lineCount, transformations, dependencies, businessRules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sqlPath', 'lineCount', 'transformations', 'dependencies', 'artifacts'],
      properties: {
        sqlPath: { type: 'string' },
        sqlContent: { type: 'string' },
        lineCount: { type: 'number' },
        transformations: { type: 'array', items: { type: 'string' } },
        dependencies: { type: 'array', items: { type: 'string' } },
        businessRules: { type: 'array', items: { type: 'string' } },
        ctesUsed: { type: 'number' },
        joinsCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'intermediate', 'sql', 'business-logic']
}));

// Phase 5: Marts Model Development
export const martsModelDevelopmentTask = defineTask('marts-model-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Marts Model Development - ${args.modelName}`,
  agent: {
    name: 'dimensional-modeler',
    prompt: {
      role: 'Dimensional Modeling Expert and Senior Analytics Engineer',
      task: 'Develop marts layer SQL model (fact or dimension table)',
      context: {
        modelName: args.modelName,
        modelType: args.modelType,
        modelDesign: args.modelDesign,
        sourceTables: args.sourceTables,
        targetWarehouse: args.targetWarehouse,
        materialStrategy: args.materialStrategy,
        enableIncrementalStrategy: args.enableIncrementalStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create SQL for fact or dimension table',
        '2. Use ref() to reference intermediate/staging models',
        '3. For fact tables: include all measures and foreign keys',
        '4. For dimension tables: include all descriptive attributes',
        '5. Implement grain at the correct level',
        '6. Add surrogate keys for dimensions',
        '7. Implement SCD Type 2 if required',
        '8. If incremental: add incremental logic with unique_key',
        '9. Apply business calculations and metrics',
        '10. Add date/time spine joins if needed',
        '11. Structure SQL with clear CTEs',
        '12. Optimize for query performance and BI tool consumption'
      ],
      outputFormat: 'JSON with sqlPath, sqlContent, lineCount, transformations, dependencies, grain, incrementalLogic, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sqlPath', 'lineCount', 'transformations', 'dependencies', 'artifacts'],
      properties: {
        sqlPath: { type: 'string' },
        sqlContent: { type: 'string' },
        lineCount: { type: 'number' },
        transformations: { type: 'array', items: { type: 'string' } },
        dependencies: { type: 'array', items: { type: 'string' } },
        grain: { type: 'string' },
        incrementalLogic: { type: 'boolean' },
        uniqueKey: { type: 'string' },
        measures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'marts', 'dimensional', 'sql']
}));

// Phase 6: Materialization Configuration
export const materializationConfigTask = defineTask('materialization-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Materialization Configuration - ${args.modelName}`,
  agent: {
    name: 'materialization-specialist',
    prompt: {
      role: 'dbt Performance Engineer specializing in materialization strategies',
      task: 'Configure optimal materialization strategy for the model',
      context: {
        modelName: args.modelName,
        layer: args.layer,
        materialStrategy: args.materialStrategy,
        enableIncrementalStrategy: args.enableIncrementalStrategy,
        targetWarehouse: args.targetWarehouse,
        modelOutput: args.modelOutput,
        performanceOptimization: args.performanceOptimization,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Determine optimal materialization (view, table, incremental, ephemeral)',
        '2. Configure model-level config in schema YAML or model config block',
        '3. If incremental: configure strategy (merge, delete+insert, insert_overwrite)',
        '4. Set unique_key for incremental models',
        '5. Configure partition_by for large tables',
        '6. Configure cluster_by for query optimization',
        '7. Set appropriate tags for model organization',
        '8. Configure pre-hook and post-hook if needed',
        '9. Set model-specific grants and permissions',
        '10. Document materialization rationale',
        '11. Generate config YAML snippet',
        '12. Provide performance tuning recommendations'
      ],
      outputFormat: 'JSON with strategy, incrementalEnabled, uniqueKey, partitioning, clustering, configYaml, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'configYaml', 'artifacts'],
      properties: {
        strategy: { type: 'string' },
        incrementalEnabled: { type: 'boolean' },
        incrementalStrategy: { type: 'string' },
        uniqueKey: { type: 'string' },
        partitioning: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            field: { type: 'string' },
            granularity: { type: 'string' }
          }
        },
        clustering: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            keys: { type: 'array', items: { type: 'string' } }
          }
        },
        configYaml: { type: 'string' },
        rationale: { type: 'string' },
        performanceTips: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'materialization', 'performance', 'optimization']
}));

// Phase 7: Test Development
export const testDevelopmentTask = defineTask('test-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Test Development - ${args.modelName}`,
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'Data Quality Engineer specializing in dbt testing',
      task: 'Create comprehensive tests for the dbt model',
      context: {
        modelName: args.modelName,
        layer: args.layer,
        modelDesign: args.modelDesign,
        modelOutput: args.modelOutput,
        testingLevel: args.testingLevel,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Add schema tests: not_null for required columns',
        '2. Add unique tests for primary keys',
        '3. Add relationships tests for foreign keys',
        '4. Add accepted_values tests for categorical columns',
        '5. Use dbt_expectations for advanced tests (row_count, value ranges)',
        '6. Create custom singular tests for complex business rules',
        '7. Add data quality tests: no duplicates, valid dates, positive amounts',
        '8. Test for referential integrity',
        '9. Add row count comparison tests if applicable',
        '10. Configure test severity (warn vs error)',
        '11. Generate tests YAML file',
        '12. Calculate test coverage percentage'
      ],
      outputFormat: 'JSON with totalTests, schemaTests, dataQualityTests, customTests, coveragePercentage, testCategories, yamlPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'schemaTests', 'dataQualityTests', 'coveragePercentage', 'yamlPath', 'artifacts'],
      properties: {
        totalTests: { type: 'number' },
        schemaTests: { type: 'number' },
        dataQualityTests: { type: 'number' },
        customTests: { type: 'number' },
        relationshipTests: { type: 'number' },
        coveragePercentage: { type: 'number' },
        testCategories: { type: 'array', items: { type: 'string' } },
        yamlPath: { type: 'string' },
        yamlContent: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'testing', 'quality', 'validation']
}));

// Phase 8: Documentation Generation
export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation Generation - ${args.modelName}`,
  agent: {
    name: 'documentation-writer',
    prompt: {
      role: 'Technical Documentation Specialist for Analytics',
      task: 'Create comprehensive documentation for the dbt model',
      context: {
        modelName: args.modelName,
        layer: args.layer,
        modelType: args.modelType,
        modelDesign: args.modelDesign,
        modelOutput: args.modelOutput,
        businessRequirements: args.businessRequirements,
        documentationStyle: args.documentationStyle,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Write clear model description with business context',
        '2. Document model grain explicitly',
        '3. Add column descriptions for all columns',
        '4. Document column transformations and calculations',
        '5. Explain business logic and rules',
        '6. Add data lineage information',
        '7. Document refresh frequency and SLAs',
        '8. Include example queries or use cases',
        '9. Add metadata tags for discoverability',
        '10. Link to related models or documentation',
        '11. Generate documentation YAML file',
        '12. Calculate documentation coverage percentage'
      ],
      outputFormat: 'JSON with coveragePercentage, modelDescription, columnsCovered, yamlPath, yamlContent, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['coveragePercentage', 'modelDescription', 'columnsCovered', 'yamlPath', 'artifacts'],
      properties: {
        coveragePercentage: { type: 'number' },
        modelDescription: { type: 'string' },
        columnsCovered: { type: 'number' },
        totalColumns: { type: 'number' },
        grain: { type: 'string' },
        yamlPath: { type: 'string' },
        yamlContent: { type: 'string' },
        exampleQueries: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'documentation', 'catalog']
}));

// Phase 9: Performance Optimization
export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Performance Optimization - ${args.modelName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Database Performance Engineer specializing in query optimization',
      task: 'Apply performance optimizations to the dbt model',
      context: {
        modelName: args.modelName,
        layer: args.layer,
        targetWarehouse: args.targetWarehouse,
        modelOutput: args.modelOutput,
        materializationConfig: args.materializationConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze SQL for performance bottlenecks',
        '2. Optimize JOIN operations (order, type)',
        '3. Add appropriate WHERE filters early in CTEs',
        '4. Use column pruning (select only needed columns)',
        '5. Optimize window functions and partitioning',
        '6. Configure appropriate indexes/clustering',
        '7. Add partition pruning for large tables',
        '8. Optimize aggregations and GROUP BY',
        '9. Consider query result caching',
        '10. Add query hints if warehouse-specific',
        '11. Document optimization techniques applied',
        '12. Estimate performance improvement percentage'
      ],
      outputFormat: 'JSON with optimizations, estimatedImprovement, sqlChanges, configChanges, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'estimatedImprovement', 'artifacts'],
      properties: {
        optimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        estimatedImprovement: { type: 'string' },
        sqlChanges: { type: 'array', items: { type: 'string' } },
        configChanges: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'performance', 'optimization', 'sql']
}));

// Phase 10: Code Review
export const codeReviewTask = defineTask('code-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Code Review - ${args.modelName}`,
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'Senior Analytics Engineer conducting code review',
      task: 'Perform comprehensive code review of the dbt model',
      context: {
        modelName: args.modelName,
        layer: args.layer,
        modelOutput: args.modelOutput,
        testDevelopment: args.testDevelopment,
        documentation: args.documentation,
        materializationConfig: args.materializationConfig,
        namingValidation: args.namingValidation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review SQL code quality and readability',
        '2. Check adherence to dbt style guide',
        '3. Validate naming conventions compliance',
        '4. Review test coverage adequacy (target >80%)',
        '5. Check documentation completeness (target >90%)',
        '6. Validate materialization strategy appropriateness',
        '7. Review for SQL anti-patterns',
        '8. Check for potential performance issues',
        '9. Validate dependencies and ref() usage',
        '10. Review for security concerns (e.g., no hardcoded values)',
        '11. Check for code maintainability',
        '12. Generate code review score (0-100) and detailed report'
      ],
      outputFormat: 'JSON with overallScore, passedChecks, issues, recommendations, categoryScores, reportPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'passedChecks', 'issues', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        passedChecks: {
          type: 'array',
          items: { type: 'string' }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' },
              issue: { type: 'string' },
              lineNumber: { type: 'number' },
              recommendation: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        categoryScores: {
          type: 'object',
          properties: {
            codeQuality: { type: 'number' },
            testCoverage: { type: 'number' },
            documentation: { type: 'number' },
            performance: { type: 'number' },
            maintainability: { type: 'number' }
          }
        },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'code-review', 'quality', 'standards']
}));

// Phase 11: Integration Validation
export const integrationValidationTask = defineTask('integration-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Integration Validation - ${args.modelName}`,
  agent: {
    name: 'integration-validator',
    prompt: {
      role: 'dbt Integration Specialist',
      task: 'Validate model integration with existing dbt project',
      context: {
        modelName: args.modelName,
        layer: args.layer,
        modelOutput: args.modelOutput,
        sourceTables: args.sourceTables,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate all dependencies exist (source() and ref() calls)',
        '2. Check for circular dependencies in DAG',
        '3. Verify model can be compiled by dbt',
        '4. Check for naming conflicts with existing models',
        '5. Validate source configurations exist',
        '6. Check model fits in project structure',
        '7. Validate selectors and tags are valid',
        '8. Check compatibility with project dbt version',
        '9. Verify package dependencies are available',
        '10. Generate dependency graph visualization',
        '11. Run dbt parse to validate model',
        '12. Create integration validation report'
      ],
      outputFormat: 'JSON with passed, dependenciesValid, circularDependencies, warnings, dagVisualization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'dependenciesValid', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        dependenciesValid: { type: 'boolean' },
        circularDependencies: { type: 'boolean' },
        warnings: { type: 'array', items: { type: 'string' } },
        errors: { type: 'array', items: { type: 'string' } },
        upstreamModels: { type: 'array', items: { type: 'string' } },
        downstreamImpact: { type: 'string' },
        dagVisualization: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'integration', 'validation', 'dependencies']
}));

// Phase 12: Deployment Checklist
export const deploymentChecklistTask = defineTask('deployment-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Deployment Checklist - ${args.modelName}`,
  agent: {
    name: 'deployment-specialist',
    prompt: {
      role: 'DevOps Engineer specializing in dbt deployments',
      task: 'Generate deployment checklist and handoff documentation',
      context: {
        modelName: args.modelName,
        layer: args.layer,
        modelOutput: args.modelOutput,
        testDevelopment: args.testDevelopment,
        documentation: args.documentation,
        codeReview: args.codeReview,
        integrationValidation: args.integrationValidation,
        materializationConfig: args.materializationConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create comprehensive pre-deployment checklist',
        '2. Document model files and locations',
        '3. List all dependencies that must exist',
        '4. Document required database permissions',
        '5. Create deployment commands (dbt run, test)',
        '6. Document rollback procedures',
        '7. List post-deployment validation steps',
        '8. Document monitoring and alerting requirements',
        '9. Create handoff documentation for team',
        '10. Document expected runtime and resource usage',
        '11. List stakeholders to notify',
        '12. Generate deployment runbook'
      ],
      outputFormat: 'JSON with items, deploymentCommands, rollbackProcedure, validationSteps, checklistPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['items', 'deploymentCommands', 'checklistPath', 'artifacts'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              item: { type: 'string' },
              completed: { type: 'boolean' },
              required: { type: 'boolean' }
            }
          }
        },
        deploymentCommands: { type: 'array', items: { type: 'string' } },
        rollbackProcedure: { type: 'string' },
        validationSteps: { type: 'array', items: { type: 'string' } },
        requiredPermissions: { type: 'array', items: { type: 'string' } },
        dependencies: { type: 'array', items: { type: 'string' } },
        estimatedRuntime: { type: 'string' },
        checklistPath: { type: 'string' },
        runbookPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'deployment', 'checklist', 'operations']
}));
