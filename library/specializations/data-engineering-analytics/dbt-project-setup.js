/**
 * @process specializations/data-engineering-analytics/dbt-project-setup
 * @description dbt Project Setup - Initialize and configure a complete dbt (data build tool) project with proper folder structure,
 * sources, staging/marts layers, testing, documentation, and CI/CD integration following dbt best practices.
 * @specialization Data Engineering & Analytics
 * @category Data Transformation
 * @inputs { projectName: string, dataWarehouse: string, sourceDatabases?: array, modelingApproach?: string, cicdPlatform?: string, deploymentEnvironments?: array }
 * @outputs { success: boolean, projectStructure: object, configuration: object, models: array, tests: array, documentation: object, cicd: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/data-engineering-analytics/dbt-project-setup', {
 *   projectName: 'analytics_dbt',
 *   dataWarehouse: 'Snowflake',
 *   sourceDatabases: ['production_db', 'crm_db', 'events_db'],
 *   modelingApproach: 'kimball',
 *   cicdPlatform: 'GitHub Actions',
 *   deploymentEnvironments: ['dev', 'staging', 'prod'],
 *   includePackages: ['dbt_utils', 'dbt_expectations'],
 *   testingStrategy: 'comprehensive'
 * });
 *
 * @references
 * - dbt Documentation: https://docs.getdbt.com/
 * - dbt Best Practices: https://docs.getdbt.com/guides/best-practices
 * - dbt Style Guide: https://github.com/dbt-labs/corp/blob/main/dbt_style_guide.md
 * - dbt Project Structure: https://docs.getdbt.com/reference/project-configs/project-structure
 * - dbt Cloud CI/CD: https://docs.getdbt.com/docs/deploy/continuous-integration
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    dataWarehouse,
    sourceDatabases = [],
    modelingApproach = 'dimensional',
    cicdPlatform = 'GitHub Actions',
    deploymentEnvironments = ['dev', 'staging', 'prod'],
    includePackages = ['dbt_utils'],
    testingStrategy = 'comprehensive',
    documentationStyle = 'descriptive',
    outputDir = 'dbt-project-setup'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting dbt Project Setup: ${projectName}`);
  ctx.log('info', `Data Warehouse: ${dataWarehouse}`);
  ctx.log('info', `Source Databases: ${sourceDatabases.join(', ')}`);
  ctx.log('info', `Modeling Approach: ${modelingApproach}`);

  // ============================================================================
  // PHASE 1: PROJECT INITIALIZATION AND STRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 1: Initializing dbt project and folder structure');

  const projectInit = await ctx.task(projectInitializationTask, {
    projectName,
    dataWarehouse,
    modelingApproach,
    includePackages,
    outputDir
  });

  artifacts.push(...projectInit.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: dbt project "${projectName}" initialized with ${projectInit.folderCount} folders and ${projectInit.configFiles.length} configuration files. Review project structure?`,
    title: 'Project Initialization Complete',
    context: {
      runId: ctx.runId,
      projectName,
      dataWarehouse,
      folderStructure: projectInit.folderStructure,
      configFiles: projectInit.configFiles,
      files: projectInit.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 2: PROFILES AND CONNECTION CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring database connections and profiles');

  const profilesConfig = await ctx.task(profilesConfigurationTask, {
    projectName,
    dataWarehouse,
    deploymentEnvironments,
    outputDir
  });

  artifacts.push(...profilesConfig.artifacts);

  // ============================================================================
  // PHASE 3: SOURCE CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining source configurations and schema documentation');

  const sourceTasks = sourceDatabases.map(sourceDb =>
    () => ctx.task(sourceConfigurationTask, {
      projectName,
      sourceDatabase: sourceDb,
      dataWarehouse,
      outputDir
    })
  );

  const sourceConfigs = await ctx.parallel.all(sourceTasks);
  artifacts.push(...sourceConfigs.flatMap(s => s.artifacts));

  await ctx.breakpoint({
    question: `Phase 3 Complete: Configured ${sourceDatabases.length} source database(s) with ${sourceConfigs.reduce((sum, s) => sum + s.tableCount, 0)} total tables. Review source configurations?`,
    title: 'Source Configuration Review',
    context: {
      runId: ctx.runId,
      sources: sourceConfigs.map(s => ({
        database: s.sourceDatabase,
        schemaCount: s.schemaCount,
        tableCount: s.tableCount,
        testsConfigured: s.freshnessTests
      })),
      files: sourceConfigs.flatMap(s => s.artifacts).map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 4: STAGING LAYER SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating staging layer models and transformations');

  const stagingLayer = await ctx.task(stagingLayerTask, {
    projectName,
    sourceConfigs,
    dataWarehouse,
    outputDir
  });

  artifacts.push(...stagingLayer.artifacts);

  // ============================================================================
  // PHASE 5: INTERMEDIATE LAYER SETUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating intermediate layer for business logic');

  const intermediateLayer = await ctx.task(intermediateLayerTask, {
    projectName,
    stagingLayer,
    modelingApproach,
    outputDir
  });

  artifacts.push(...intermediateLayer.artifacts);

  // ============================================================================
  // PHASE 6: MARTS LAYER SETUP
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating marts layer (dimensional/denormalized models)');

  const martsLayer = await ctx.task(martsLayerTask, {
    projectName,
    intermediateLayer,
    stagingLayer,
    modelingApproach,
    outputDir
  });

  artifacts.push(...martsLayer.artifacts);

  await ctx.breakpoint({
    question: `Phase 6 Complete: Data models created across 3 layers - Staging (${stagingLayer.modelCount} models), Intermediate (${intermediateLayer.modelCount} models), Marts (${martsLayer.modelCount} models). Review model architecture?`,
    title: 'Data Model Architecture Review',
    context: {
      runId: ctx.runId,
      modelArchitecture: {
        staging: {
          modelCount: stagingLayer.modelCount,
          materialization: stagingLayer.materialization
        },
        intermediate: {
          modelCount: intermediateLayer.modelCount,
          materialization: intermediateLayer.materialization
        },
        marts: {
          modelCount: martsLayer.modelCount,
          materialization: martsLayer.materialization,
          domains: martsLayer.domains
        }
      },
      files: [
        ...stagingLayer.artifacts.map(a => ({ path: a.path, format: 'sql', label: 'Staging Model' })),
        ...intermediateLayer.artifacts.map(a => ({ path: a.path, format: 'sql', label: 'Intermediate Model' })),
        ...martsLayer.artifacts.map(a => ({ path: a.path, format: 'sql', label: 'Marts Model' }))
      ].slice(0, 20)
    }
  });

  // ============================================================================
  // PHASE 7: MACROS AND UTILITY FUNCTIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating custom macros and utility functions');

  const macros = await ctx.task(macrosSetupTask, {
    projectName,
    dataWarehouse,
    modelingApproach,
    outputDir
  });

  artifacts.push(...macros.artifacts);

  // ============================================================================
  // PHASE 8: TESTING CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Configuring comprehensive data testing strategy');

  const testingConfig = await ctx.task(testingConfigurationTask, {
    projectName,
    stagingLayer,
    intermediateLayer,
    martsLayer,
    sourceConfigs,
    testingStrategy,
    outputDir
  });

  artifacts.push(...testingConfig.artifacts);

  await ctx.breakpoint({
    question: `Phase 8 Complete: Testing configured with ${testingConfig.totalTests} tests across ${testingConfig.testCategories.length} categories (schema, data quality, relationships, custom). Proceed with documentation?`,
    title: 'Testing Configuration Review',
    context: {
      runId: ctx.runId,
      testingMetrics: {
        totalTests: testingConfig.totalTests,
        schemaTests: testingConfig.schemaTests,
        dataQualityTests: testingConfig.dataQualityTests,
        relationshipTests: testingConfig.relationshipTests,
        customTests: testingConfig.customTests,
        coverage: testingConfig.coveragePercentage
      },
      testCategories: testingConfig.testCategories,
      files: testingConfig.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 9: DOCUMENTATION SETUP
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive project documentation');

  const documentation = await ctx.task(documentationSetupTask, {
    projectName,
    sourceConfigs,
    stagingLayer,
    intermediateLayer,
    martsLayer,
    macros,
    testingConfig,
    documentationStyle,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 10: PACKAGE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Configuring dbt packages and dependencies');

  const packageConfig = await ctx.task(packageManagementTask, {
    projectName,
    includePackages,
    dataWarehouse,
    outputDir
  });

  artifacts.push(...packageConfig.artifacts);

  // ============================================================================
  // PHASE 11: ENVIRONMENT CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Setting up multi-environment configurations');

  const environmentTasks = deploymentEnvironments.map(env =>
    () => ctx.task(environmentConfigurationTask, {
      projectName,
      environment: env,
      dataWarehouse,
      outputDir
    })
  );

  const environmentConfigs = await ctx.parallel.all(environmentTasks);
  artifacts.push(...environmentConfigs.flatMap(e => e.artifacts));

  // ============================================================================
  // PHASE 12: CI/CD INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Integrating dbt with CI/CD pipeline');

  const cicdIntegration = await ctx.task(cicdIntegrationTask, {
    projectName,
    cicdPlatform,
    deploymentEnvironments,
    dataWarehouse,
    testingConfig,
    outputDir
  });

  artifacts.push(...cicdIntegration.artifacts);

  await ctx.breakpoint({
    question: `Phase 12 Complete: CI/CD pipeline configured for ${cicdPlatform} with ${cicdIntegration.jobCount} jobs across ${deploymentEnvironments.length} environments. Includes: dbt run, test, docs, freshness checks. Review CI/CD configuration?`,
    title: 'CI/CD Integration Review',
    context: {
      runId: ctx.runId,
      cicdPlatform,
      cicdConfiguration: {
        jobCount: cicdIntegration.jobCount,
        environments: deploymentEnvironments,
        features: cicdIntegration.features,
        slimCI: cicdIntegration.slimCI,
        scheduledRuns: cicdIntegration.scheduledRuns
      },
      files: cicdIntegration.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 13: DATA QUALITY FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 13: Implementing advanced data quality framework');

  const dataQuality = await ctx.task(dataQualityFrameworkTask, {
    projectName,
    stagingLayer,
    intermediateLayer,
    martsLayer,
    testingStrategy,
    outputDir
  });

  artifacts.push(...dataQuality.artifacts);

  // ============================================================================
  // PHASE 14: PERFORMANCE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Optimizing dbt models for performance');

  const optimization = await ctx.task(performanceOptimizationTask, {
    projectName,
    dataWarehouse,
    stagingLayer,
    intermediateLayer,
    martsLayer,
    outputDir
  });

  artifacts.push(...optimization.artifacts);

  // ============================================================================
  // PHASE 15: PROJECT VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Validating dbt project configuration and best practices');

  const validation = await ctx.task(projectValidationTask, {
    projectName,
    projectInit,
    sourceConfigs,
    stagingLayer,
    intermediateLayer,
    martsLayer,
    testingConfig,
    documentation,
    cicdIntegration,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  const projectScore = validation.overallScore;
  const validationPassed = projectScore >= 80;

  if (!validationPassed) {
    await ctx.breakpoint({
      question: `Phase 15 Warning: Project validation score: ${projectScore}/100 (below threshold of 80). ${validation.issues.length} issue(s) found. Review and address issues?`,
      title: 'Project Validation Issues',
      context: {
        runId: ctx.runId,
        validationScore: projectScore,
        passedChecks: validation.passedChecks,
        issues: validation.issues,
        recommendations: validation.recommendations,
        files: validation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 16: SETUP GUIDE AND HANDOFF DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 16: Creating setup guide and handoff documentation');

  const setupGuide = await ctx.task(setupGuideTask, {
    projectName,
    dataWarehouse,
    sourceDatabases,
    projectInit,
    profilesConfig,
    environmentConfigs,
    packageConfig,
    cicdIntegration,
    validation,
    outputDir
  });

  artifacts.push(...setupGuide.artifacts);

  // ============================================================================
  // FINAL BREAKPOINT: PROJECT COMPLETE
  // ============================================================================

  await ctx.breakpoint({
    question: `dbt Project Setup Complete for "${projectName}"! Validation score: ${projectScore}/100. Project includes ${stagingLayer.modelCount + intermediateLayer.modelCount + martsLayer.modelCount} models, ${testingConfig.totalTests} tests, and complete CI/CD integration. Review deliverables and approve for deployment?`,
    title: 'dbt Project Setup Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        dataWarehouse,
        validationScore: projectScore,
        totalModels: stagingLayer.modelCount + intermediateLayer.modelCount + martsLayer.modelCount,
        modelsByLayer: {
          staging: stagingLayer.modelCount,
          intermediate: intermediateLayer.modelCount,
          marts: martsLayer.modelCount
        },
        totalTests: testingConfig.totalTests,
        sourceDatabases: sourceDatabases.length,
        environments: deploymentEnvironments.length,
        cicdConfigured: cicdIntegration.configured,
        documentationGenerated: documentation.docsGenerated,
        packagesInstalled: packageConfig.packagesCount
      },
      quickStart: setupGuide.quickStartSteps,
      nextSteps: setupGuide.nextSteps,
      files: [
        { path: setupGuide.setupGuidePath, format: 'markdown', label: 'Setup Guide' },
        { path: setupGuide.architecturePath, format: 'markdown', label: 'Architecture Overview' },
        { path: documentation.docsPath, format: 'markdown', label: 'Project Documentation' },
        { path: validation.reportPath, format: 'json', label: 'Validation Report' },
        { path: cicdIntegration.pipelineConfigPath, format: 'yaml', label: 'CI/CD Configuration' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validationPassed && projectScore >= 80,
    projectName,
    dataWarehouse,
    projectStructure: {
      folders: projectInit.folderStructure,
      configFiles: projectInit.configFiles,
      totalModels: stagingLayer.modelCount + intermediateLayer.modelCount + martsLayer.modelCount
    },
    configuration: {
      profiles: profilesConfig.profilesConfigured,
      environments: environmentConfigs.map(e => e.environment),
      packages: packageConfig.packages,
      connectionType: dataWarehouse
    },
    models: {
      staging: {
        count: stagingLayer.modelCount,
        materialization: stagingLayer.materialization,
        models: stagingLayer.models
      },
      intermediate: {
        count: intermediateLayer.modelCount,
        materialization: intermediateLayer.materialization,
        models: intermediateLayer.models
      },
      marts: {
        count: martsLayer.modelCount,
        materialization: martsLayer.materialization,
        domains: martsLayer.domains,
        models: martsLayer.models
      }
    },
    sources: {
      databases: sourceDatabases,
      totalTables: sourceConfigs.reduce((sum, s) => sum + s.tableCount, 0),
      freshnessChecks: sourceConfigs.every(s => s.freshnessTests)
    },
    tests: {
      totalTests: testingConfig.totalTests,
      schemaTests: testingConfig.schemaTests,
      dataQualityTests: testingConfig.dataQualityTests,
      relationshipTests: testingConfig.relationshipTests,
      customTests: testingConfig.customTests,
      coveragePercentage: testingConfig.coveragePercentage,
      strategy: testingStrategy
    },
    documentation: {
      docsGenerated: documentation.docsGenerated,
      docsPath: documentation.docsPath,
      modelsCoverage: documentation.modelsCoverage,
      sourcesCoverage: documentation.sourcesCoverage,
      style: documentationStyle
    },
    cicd: {
      platform: cicdPlatform,
      configured: cicdIntegration.configured,
      jobCount: cicdIntegration.jobCount,
      features: cicdIntegration.features,
      slimCI: cicdIntegration.slimCI,
      pipelineConfigPath: cicdIntegration.pipelineConfigPath
    },
    optimization: {
      materializations: optimization.materializations,
      incremental: optimization.incrementalModels,
      partitioning: optimization.partitioningStrategy,
      clustering: optimization.clusteringStrategy,
      estimatedPerformanceGain: optimization.estimatedGain
    },
    dataQuality: {
      frameworkImplemented: dataQuality.frameworkImplemented,
      qualityMetrics: dataQuality.metrics,
      alerting: dataQuality.alerting
    },
    validation: {
      overallScore: projectScore,
      passedChecks: validation.passedChecks,
      issues: validation.issues,
      recommendations: validation.recommendations,
      bestPracticesScore: validation.bestPracticesScore
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/data-engineering-analytics/dbt-project-setup',
      timestamp: startTime,
      dataWarehouse,
      modelingApproach,
      deploymentEnvironments
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Project Initialization
export const projectInitializationTask = defineTask('project-initialization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Project Initialization - ${args.projectName}`,
  agent: {
    name: 'dbt-architect',
    prompt: {
      role: 'Senior Analytics Engineer specializing in dbt project architecture',
      task: 'Initialize dbt project with proper folder structure and configuration',
      context: {
        projectName: args.projectName,
        dataWarehouse: args.dataWarehouse,
        modelingApproach: args.modelingApproach,
        includePackages: args.includePackages,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Initialize dbt project using `dbt init` command structure',
        '2. Create standard folder structure: models/, macros/, tests/, snapshots/, analyses/, seeds/',
        '3. Create model subfolders: staging/, intermediate/, marts/',
        '4. Create domain-specific folders in marts/ based on modeling approach',
        '5. Generate dbt_project.yml with project configuration',
        '6. Configure model materializations by layer (views for staging, tables for marts)',
        '7. Set up model selection patterns and tagging strategy',
        '8. Configure naming conventions and model prefixes',
        '9. Create .gitignore for dbt-specific files (target/, logs/, dbt_packages/)',
        '10. Generate packages.yml for dbt package dependencies',
        '11. Create README.md with project overview',
        '12. Document folder structure and organization principles'
      ],
      outputFormat: 'JSON with folder structure, config files, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['folderStructure', 'configFiles', 'folderCount', 'artifacts'],
      properties: {
        folderStructure: {
          type: 'object',
          properties: {
            root: { type: 'string' },
            models: { type: 'array', items: { type: 'string' } },
            macros: { type: 'string' },
            tests: { type: 'string' },
            snapshots: { type: 'string' },
            analyses: { type: 'string' },
            seeds: { type: 'string' }
          }
        },
        configFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              path: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        folderCount: { type: 'number' },
        namingConventions: {
          type: 'object',
          properties: {
            staging: { type: 'string' },
            intermediate: { type: 'string' },
            marts: { type: 'string' }
          }
        },
        materializationDefaults: {
          type: 'object',
          properties: {
            staging: { type: 'string' },
            intermediate: { type: 'string' },
            marts: { type: 'string' }
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
  labels: ['dbt', 'analytics', 'project-initialization', 'data-engineering']
}));

// Phase 2: Profiles Configuration
export const profilesConfigurationTask = defineTask('profiles-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Profiles Configuration - ${args.projectName}`,
  agent: {
    name: 'dbt-engineer',
    prompt: {
      role: 'Analytics Engineer with expertise in data warehouse connections',
      task: 'Configure database connection profiles for all environments',
      context: {
        projectName: args.projectName,
        dataWarehouse: args.dataWarehouse,
        deploymentEnvironments: args.deploymentEnvironments,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Create profiles.yml for ${args.dataWarehouse} connection`,
        '2. Configure connection parameters for each environment (dev, staging, prod)',
        '3. Set up environment-specific schemas and databases',
        '4. Configure authentication methods (OAuth, key-pair, user/password)',
        '5. Set up connection retry and timeout parameters',
        '6. Configure thread count for parallel execution',
        '7. Set up target-specific variables and configurations',
        '8. Document environment variable requirements (credentials)',
        '9. Create .env.example template for required environment variables',
        '10. Configure connection pooling and session parameters',
        '11. Set up query tags for monitoring and tracking',
        '12. Generate connection testing documentation'
      ],
      outputFormat: 'JSON with profiles configuration and connection details'
    },
    outputSchema: {
      type: 'object',
      required: ['profilesConfigured', 'connectionType', 'environments', 'artifacts'],
      properties: {
        profilesConfigured: { type: 'boolean' },
        connectionType: { type: 'string' },
        environments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              target: { type: 'string' },
              schema: { type: 'string' },
              threads: { type: 'number' }
            }
          }
        },
        authenticationMethod: { type: 'string' },
        requiredEnvVars: {
          type: 'array',
          items: { type: 'string' }
        },
        connectionParameters: {
          type: 'object',
          properties: {
            timeout: { type: 'number' },
            retries: { type: 'number' },
            keepalive: { type: 'boolean' }
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
  labels: ['dbt', 'analytics', 'profiles', 'connection-config']
}));

// Phase 3: Source Configuration (per database)
export const sourceConfigurationTask = defineTask('source-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Source Configuration - ${args.sourceDatabase}`,
  agent: {
    name: 'data-catalog-engineer',
    prompt: {
      role: 'Data Catalog Engineer specializing in source documentation',
      task: `Document and configure source data from ${args.sourceDatabase}`,
      context: {
        projectName: args.projectName,
        sourceDatabase: args.sourceDatabase,
        dataWarehouse: args.dataWarehouse,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Create source YAML file for ${args.sourceDatabase}`,
        '2. Document all source schemas and tables',
        '3. Add table and column descriptions',
        '4. Configure source freshness checks (warn_after, error_after)',
        '5. Document primary keys and unique identifiers',
        '6. Add data type information for each column',
        '7. Configure loaded_at_field for freshness tracking',
        '8. Document data update frequency and SLAs',
        '9. Add source-level tags for categorization',
        '10. Configure source-specific tests (not_null, unique)',
        '11. Document data lineage and upstream systems',
        '12. Create source overview documentation'
      ],
      outputFormat: 'JSON with source configuration details'
    },
    outputSchema: {
      type: 'object',
      required: ['sourceDatabase', 'schemaCount', 'tableCount', 'freshnessTests', 'artifacts'],
      properties: {
        sourceDatabase: { type: 'string' },
        schemaCount: { type: 'number' },
        tableCount: { type: 'number' },
        schemas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              tables: { type: 'array', items: { type: 'string' } },
              tableCount: { type: 'number' }
            }
          }
        },
        freshnessTests: { type: 'boolean' },
        freshnessConfig: {
          type: 'object',
          properties: {
            warnAfter: { type: 'string' },
            errorAfter: { type: 'string' }
          }
        },
        documentationCoverage: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'analytics', 'sources', 'data-catalog']
}));

// Phase 4: Staging Layer Setup
export const stagingLayerTask = defineTask('staging-layer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Staging Layer Setup - ${args.projectName}`,
  agent: {
    name: 'staging-engineer',
    prompt: {
      role: 'Analytics Engineer specializing in staging model development',
      task: 'Create staging layer models with light transformations',
      context: {
        projectName: args.projectName,
        sourceConfigs: args.sourceConfigs,
        dataWarehouse: args.dataWarehouse,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create staging models (stg_) for each source table',
        '2. Apply naming convention: stg_<source>__<table>',
        '3. Implement light transformations: renaming, type casting, basic cleaning',
        '4. Add surrogate keys using dbt_utils.generate_surrogate_key()',
        '5. Standardize timestamp columns to UTC',
        '6. Remove duplicate records if necessary',
        '7. Add basic computed columns (e.g., full_name from first + last)',
        '8. Configure staging models as views for efficiency',
        '9. Create staging model YAML with column documentation',
        '10. Add basic tests (not_null, unique) for primary keys',
        '11. Use source() function to reference raw tables',
        '12. Create staging layer README documenting conventions'
      ],
      outputFormat: 'JSON with staging models and configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['modelCount', 'materialization', 'models', 'artifacts'],
      properties: {
        modelCount: { type: 'number' },
        materialization: { type: 'string' },
        models: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              sourceTable: { type: 'string' },
              columns: { type: 'number' },
              transformations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        conventions: {
          type: 'object',
          properties: {
            namingPattern: { type: 'string' },
            surrogateKeyPrefix: { type: 'string' },
            timestampStandard: { type: 'string' }
          }
        },
        testCoverage: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'analytics', 'staging', 'data-modeling']
}));

// Phase 5: Intermediate Layer Setup
export const intermediateLayerTask = defineTask('intermediate-layer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Intermediate Layer Setup - ${args.projectName}`,
  agent: {
    name: 'transformation-engineer',
    prompt: {
      role: 'Analytics Engineer specializing in business logic transformations',
      task: 'Create intermediate layer with business logic and transformations',
      context: {
        projectName: args.projectName,
        stagingLayer: args.stagingLayer,
        modelingApproach: args.modelingApproach,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create intermediate models (int_) for complex business logic',
        '2. Apply naming convention: int_<domain>__<description>',
        '3. Implement joins between staging models',
        '4. Apply business logic and calculations',
        '5. Create unified customer/entity views',
        '6. Implement data quality rules and filtering',
        '7. Handle slowly changing dimensions (SCD) if needed',
        '8. Create reusable intermediate components',
        '9. Configure as ephemeral or view based on usage',
        '10. Add comprehensive column documentation',
        '11. Implement relationship tests between entities',
        '12. Create intermediate layer documentation'
      ],
      outputFormat: 'JSON with intermediate models and logic'
    },
    outputSchema: {
      type: 'object',
      required: ['modelCount', 'materialization', 'models', 'artifacts'],
      properties: {
        modelCount: { type: 'number' },
        materialization: { type: 'string' },
        models: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              domain: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              businessLogic: { type: 'string' }
            }
          }
        },
        reusableComponents: {
          type: 'array',
          items: { type: 'string' }
        },
        testCoverage: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'analytics', 'intermediate', 'business-logic']
}));

// Phase 6: Marts Layer Setup
export const martsLayerTask = defineTask('marts-layer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Marts Layer Setup - ${args.projectName}`,
  agent: {
    name: 'dimensional-modeler',
    prompt: {
      role: 'Dimensional Modeling Expert and Senior Analytics Engineer',
      task: 'Create marts layer with dimensional/denormalized models',
      context: {
        projectName: args.projectName,
        intermediateLayer: args.intermediateLayer,
        stagingLayer: args.stagingLayer,
        modelingApproach: args.modelingApproach,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Organize marts by business domain (marketing, finance, product, etc.)',
        '2. Create fact tables (fct_) for measurable business events',
        '3. Create dimension tables (dim_) for descriptive attributes',
        '4. Apply naming convention: fct_<event> and dim_<entity>',
        '5. Implement star schema or data vault based on modeling approach',
        '6. Add metrics and KPIs in fact tables',
        '7. Create one big table (OBT) models if needed for BI tools',
        '8. Configure marts as tables or incremental models',
        '9. Implement SCD Type 2 for dimension historization if needed',
        '10. Add comprehensive business glossary documentation',
        '11. Implement advanced data quality tests',
        '12. Create marts layer user guide for analysts'
      ],
      outputFormat: 'JSON with marts models organized by domain'
    },
    outputSchema: {
      type: 'object',
      required: ['modelCount', 'materialization', 'domains', 'models', 'artifacts'],
      properties: {
        modelCount: { type: 'number' },
        materialization: { type: 'string' },
        domains: {
          type: 'array',
          items: { type: 'string' }
        },
        models: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['fact', 'dimension', 'obt'] },
              domain: { type: 'string' },
              grain: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        factTables: { type: 'number' },
        dimensionTables: { type: 'number' },
        incrementalModels: { type: 'number' },
        testCoverage: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'analytics', 'marts', 'dimensional-modeling']
}));

// Phase 7: Macros Setup
export const macrosSetupTask = defineTask('macros-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Macros Setup - ${args.projectName}`,
  agent: {
    name: 'macro-developer',
    prompt: {
      role: 'dbt Macro Developer specializing in reusable SQL functions',
      task: 'Create custom macros and utility functions for the project',
      context: {
        projectName: args.projectName,
        dataWarehouse: args.dataWarehouse,
        modelingApproach: args.modelingApproach,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create custom macros for common transformations',
        '2. Implement date/time utility macros (fiscal calendar, date spine)',
        '3. Create data quality check macros',
        '4. Implement surrogate key generation macros',
        '5. Create warehouse-specific optimization macros',
        '6. Implement custom test macros for business rules',
        '7. Create documentation generation helpers',
        '8. Implement schema generation macros',
        '9. Add macros for data masking/anonymization',
        '10. Create macro documentation with examples',
        '11. Implement macro unit tests where applicable',
        '12. Create macro usage guide'
      ],
      outputFormat: 'JSON with macro definitions and documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['macroCount', 'categories', 'artifacts'],
      properties: {
        macroCount: { type: 'number' },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              macros: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        customTests: {
          type: 'array',
          items: { type: 'string' }
        },
        utilityFunctions: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'analytics', 'macros', 'utilities']
}));

// Phase 8: Testing Configuration
export const testingConfigurationTask = defineTask('testing-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Testing Configuration - ${args.projectName}`,
  agent: {
    name: 'data-quality-engineer',
    prompt: {
      role: 'Data Quality Engineer specializing in dbt testing',
      task: 'Configure comprehensive data testing strategy',
      context: {
        projectName: args.projectName,
        stagingLayer: args.stagingLayer,
        intermediateLayer: args.intermediateLayer,
        martsLayer: args.martsLayer,
        sourceConfigs: args.sourceConfigs,
        testingStrategy: args.testingStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Add schema tests: not_null, unique, accepted_values, relationships',
        '2. Implement dbt_expectations tests for advanced validation',
        '3. Create custom singular tests for complex business rules',
        '4. Add source freshness tests',
        '5. Implement row count and referential integrity tests',
        '6. Add data quality tests: range checks, pattern matching',
        '7. Create tests for key metrics and KPIs',
        '8. Implement cross-table consistency tests',
        '9. Add tests for SCD implementation',
        '10. Configure test severity (warn vs error)',
        '11. Create test documentation and coverage reports',
        '12. Implement automated test execution strategy'
      ],
      outputFormat: 'JSON with testing configuration and coverage'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'schemaTests', 'dataQualityTests', 'testCategories', 'coveragePercentage', 'artifacts'],
      properties: {
        totalTests: { type: 'number' },
        schemaTests: { type: 'number' },
        dataQualityTests: { type: 'number' },
        relationshipTests: { type: 'number' },
        customTests: { type: 'number' },
        testCategories: {
          type: 'array',
          items: { type: 'string' }
        },
        coveragePercentage: { type: 'number' },
        testsByModel: {
          type: 'object',
          properties: {
            staging: { type: 'number' },
            intermediate: { type: 'number' },
            marts: { type: 'number' }
          }
        },
        severityConfig: {
          type: 'object',
          properties: {
            errors: { type: 'number' },
            warnings: { type: 'number' }
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
  labels: ['dbt', 'analytics', 'testing', 'data-quality']
}));

// Phase 9: Documentation Setup
export const documentationSetupTask = defineTask('documentation-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Documentation Setup - ${args.projectName}`,
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'Technical Documentation Specialist for Analytics',
      task: 'Generate comprehensive dbt project documentation',
      context: {
        projectName: args.projectName,
        sourceConfigs: args.sourceConfigs,
        stagingLayer: args.stagingLayer,
        intermediateLayer: args.intermediateLayer,
        martsLayer: args.martsLayer,
        macros: args.macros,
        testingConfig: args.testingConfig,
        documentationStyle: args.documentationStyle,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Add model descriptions to all YAML files',
        '2. Document column descriptions with business context',
        '3. Add data lineage documentation',
        '4. Create business glossary for key terms',
        '5. Document data grain for all models',
        '6. Add metric definitions and calculations',
        '7. Create data dictionary',
        '8. Document SLAs and refresh schedules',
        '9. Add examples and use cases for marts models',
        '10. Configure dbt docs generation',
        '11. Create project overview documentation',
        '12. Generate data catalog with searchable documentation'
      ],
      outputFormat: 'JSON with documentation configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['docsGenerated', 'docsPath', 'modelsCoverage', 'sourcesCoverage', 'artifacts'],
      properties: {
        docsGenerated: { type: 'boolean' },
        docsPath: { type: 'string' },
        modelsCoverage: { type: 'number' },
        sourcesCoverage: { type: 'number' },
        columnsCoverage: { type: 'number' },
        businessGlossaryTerms: { type: 'number' },
        documentedModels: {
          type: 'object',
          properties: {
            staging: { type: 'number' },
            intermediate: { type: 'number' },
            marts: { type: 'number' }
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
  labels: ['dbt', 'analytics', 'documentation', 'data-catalog']
}));

// Phase 10: Package Management
export const packageManagementTask = defineTask('package-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Package Management - ${args.projectName}`,
  agent: {
    name: 'package-manager',
    prompt: {
      role: 'dbt Package Management Specialist',
      task: 'Configure dbt packages and dependencies',
      context: {
        projectName: args.projectName,
        includePackages: args.includePackages,
        dataWarehouse: args.dataWarehouse,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure packages.yml with required packages',
        '2. Add dbt_utils for common utility functions',
        '3. Add dbt_expectations for advanced testing',
        '4. Add warehouse-specific packages (dbt_snowflake_utils, etc.)',
        '5. Add dbt_project_evaluator for project health checks',
        '6. Add audit_helper for model comparisons',
        '7. Configure package versions and dependencies',
        '8. Document package usage and benefits',
        '9. Create package update strategy',
        '10. Add custom package configurations',
        '11. Document macro namespacing from packages',
        '12. Create package management guide'
      ],
      outputFormat: 'JSON with package configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['packagesCount', 'packages', 'artifacts'],
      properties: {
        packagesCount: { type: 'number' },
        packages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        warehouseSpecific: {
          type: 'array',
          items: { type: 'string' }
        },
        updateStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'analytics', 'packages', 'dependencies']
}));

// Phase 11: Environment Configuration (per environment)
export const environmentConfigurationTask = defineTask('environment-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Environment Configuration - ${args.environment} - ${args.projectName}`,
  agent: {
    name: 'environment-engineer',
    prompt: {
      role: 'DevOps Engineer specializing in multi-environment setup',
      task: `Configure ${args.environment} environment for dbt`,
      context: {
        projectName: args.projectName,
        environment: args.environment,
        dataWarehouse: args.dataWarehouse,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Configure ${args.environment}-specific profiles.yml target`,
        '2. Set up environment-specific schemas',
        '3. Configure environment variables',
        '4. Set up thread count based on environment',
        '5. Configure query tags for environment tracking',
        '6. Set up environment-specific materializations',
        '7. Configure target-specific post-hooks',
        '8. Set up environment isolation and access controls',
        '9. Configure logging and monitoring',
        '10. Document environment setup procedures',
        '11. Create environment validation checklist',
        '12. Generate environment configuration guide'
      ],
      outputFormat: 'JSON with environment configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['environment', 'configured', 'artifacts'],
      properties: {
        environment: { type: 'string' },
        configured: { type: 'boolean' },
        target: { type: 'string' },
        schema: { type: 'string' },
        threads: { type: 'number' },
        queryTags: {
          type: 'object',
          properties: {
            environment: { type: 'string' },
            project: { type: 'string' }
          }
        },
        envVars: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'analytics', 'environment', args.environment]
}));

// Phase 12: CI/CD Integration
export const cicdIntegrationTask = defineTask('cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: CI/CD Integration - ${args.projectName}`,
  agent: {
    name: 'cicd-engineer',
    prompt: {
      role: 'DevOps Engineer specializing in dbt CI/CD',
      task: 'Integrate dbt with CI/CD pipeline',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        deploymentEnvironments: args.deploymentEnvironments,
        dataWarehouse: args.dataWarehouse,
        testingConfig: args.testingConfig,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Create ${args.cicdPlatform} workflow for dbt`,
        '2. Configure dbt deps installation step',
        '3. Set up dbt compile for syntax validation',
        '4. Configure dbt run for model execution',
        '5. Set up dbt test for data quality checks',
        '6. Configure dbt source freshness checks',
        '7. Set up dbt docs generate and serve',
        '8. Implement slim CI for modified models only',
        '9. Configure environment-specific deployments',
        '10. Set up scheduled dbt runs (dbt Cloud or Airflow)',
        '11. Configure failure notifications and alerting',
        '12. Create CI/CD troubleshooting guide'
      ],
      outputFormat: 'JSON with CI/CD configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'jobCount', 'features', 'pipelineConfigPath', 'artifacts'],
      properties: {
        configured: { type: 'boolean' },
        platform: { type: 'string' },
        jobCount: { type: 'number' },
        features: {
          type: 'array',
          items: { type: 'string' }
        },
        slimCI: { type: 'boolean' },
        scheduledRuns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              environment: { type: 'string' },
              schedule: { type: 'string' },
              commands: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        pipelineConfigPath: { type: 'string' },
        docsDeployment: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            url: { type: 'string' }
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
  labels: ['dbt', 'analytics', 'cicd', 'automation']
}));

// Phase 13: Data Quality Framework
export const dataQualityFrameworkTask = defineTask('data-quality-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Data Quality Framework - ${args.projectName}`,
  agent: {
    name: 'quality-architect',
    prompt: {
      role: 'Data Quality Architect',
      task: 'Implement advanced data quality framework',
      context: {
        projectName: args.projectName,
        stagingLayer: args.stagingLayer,
        intermediateLayer: args.intermediateLayer,
        martsLayer: args.martsLayer,
        testingStrategy: args.testingStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement data quality dimensions (accuracy, completeness, consistency)',
        '2. Create data quality scorecards and metrics',
        '3. Set up anomaly detection tests',
        '4. Implement data profiling for key models',
        '5. Create data quality dashboards',
        '6. Set up quality gate thresholds',
        '7. Implement trend analysis for quality metrics',
        '8. Create alerting for quality degradation',
        '9. Document data quality standards',
        '10. Create quality incident response procedures',
        '11. Implement quality metadata tracking',
        '12. Generate data quality reports'
      ],
      outputFormat: 'JSON with data quality framework'
    },
    outputSchema: {
      type: 'object',
      required: ['frameworkImplemented', 'metrics', 'artifacts'],
      properties: {
        frameworkImplemented: { type: 'boolean' },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string' },
              metric: { type: 'string' },
              threshold: { type: 'number' }
            }
          }
        },
        qualityGates: {
          type: 'array',
          items: { type: 'string' }
        },
        alerting: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            channels: { type: 'array', items: { type: 'string' } }
          }
        },
        dashboards: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'analytics', 'data-quality', 'monitoring']
}));

// Phase 14: Performance Optimization
export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Performance Optimization - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Performance Optimization Engineer',
      task: 'Optimize dbt models for performance and cost',
      context: {
        projectName: args.projectName,
        dataWarehouse: args.dataWarehouse,
        stagingLayer: args.stagingLayer,
        intermediateLayer: args.intermediateLayer,
        martsLayer: args.martsLayer,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify models for incremental materialization',
        '2. Configure incremental strategies (merge, insert_overwrite, delete+insert)',
        '3. Set up partitioning for large tables',
        '4. Configure clustering keys for query optimization',
        '5. Implement model-specific timeouts',
        '6. Optimize model dependencies and DAG',
        '7. Configure pre-hooks and post-hooks for optimization',
        '8. Implement model pruning strategies',
        '9. Set up query result caching',
        '10. Configure warehouse/compute sizing recommendations',
        '11. Create performance monitoring and profiling',
        '12. Generate performance optimization guide'
      ],
      outputFormat: 'JSON with optimization configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['materializations', 'incrementalModels', 'estimatedGain', 'artifacts'],
      properties: {
        materializations: {
          type: 'object',
          properties: {
            tables: { type: 'number' },
            views: { type: 'number' },
            incremental: { type: 'number' },
            ephemeral: { type: 'number' }
          }
        },
        incrementalModels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              model: { type: 'string' },
              strategy: { type: 'string' },
              uniqueKey: { type: 'string' }
            }
          }
        },
        partitioningStrategy: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              model: { type: 'string' },
              partitionBy: { type: 'string' }
            }
          }
        },
        clusteringStrategy: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              model: { type: 'string' },
              clusterBy: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        estimatedGain: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dbt', 'analytics', 'performance', 'optimization']
}));

// Phase 15: Project Validation
export const projectValidationTask = defineTask('project-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Project Validation - ${args.projectName}`,
  agent: {
    name: 'project-validator',
    prompt: {
      role: 'dbt Project Quality Assurance Specialist',
      task: 'Validate dbt project against best practices and standards',
      context: {
        projectName: args.projectName,
        projectInit: args.projectInit,
        sourceConfigs: args.sourceConfigs,
        stagingLayer: args.stagingLayer,
        intermediateLayer: args.intermediateLayer,
        martsLayer: args.martsLayer,
        testingConfig: args.testingConfig,
        documentation: args.documentation,
        cicdIntegration: args.cicdIntegration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate project structure follows dbt best practices',
        '2. Check naming conventions consistency',
        '3. Validate all sources have freshness checks',
        '4. Check model documentation coverage (target >90%)',
        '5. Validate test coverage (target >80%)',
        '6. Check for circular dependencies',
        '7. Validate materialization strategies',
        '8. Check for unused models or sources',
        '9. Validate macro usage and custom tests',
        '10. Check CI/CD configuration completeness',
        '11. Run dbt project evaluator checks',
        '12. Generate comprehensive validation report'
      ],
      outputFormat: 'JSON with validation results and score'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'passedChecks', 'issues', 'recommendations', 'artifacts'],
      properties: {
        overallScore: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        bestPracticesScore: { type: 'number' },
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
              recommendation: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        coverage: {
          type: 'object',
          properties: {
            documentation: { type: 'number' },
            testing: { type: 'number' },
            sources: { type: 'number' }
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
  labels: ['dbt', 'analytics', 'validation', 'quality-assurance']
}));

// Phase 16: Setup Guide Generation
export const setupGuideTask = defineTask('setup-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Setup Guide - ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Writer specializing in dbt documentation',
      task: 'Create comprehensive setup guide and handoff documentation',
      context: {
        projectName: args.projectName,
        dataWarehouse: args.dataWarehouse,
        sourceDatabases: args.sourceDatabases,
        projectInit: args.projectInit,
        profilesConfig: args.profilesConfig,
        environmentConfigs: args.environmentConfigs,
        packageConfig: args.packageConfig,
        cicdIntegration: args.cicdIntegration,
        validation: args.validation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create comprehensive README with project overview',
        '2. Document prerequisites and dependencies',
        '3. Create step-by-step setup instructions',
        '4. Document environment configuration process',
        '5. Create quick start guide',
        '6. Document common dbt commands and workflows',
        '7. Create troubleshooting guide',
        '8. Document model development guidelines',
        '9. Create contribution guide for team',
        '10. Document CI/CD workflow',
        '11. Create architecture overview',
        '12. Generate complete handoff documentation'
      ],
      outputFormat: 'JSON with documentation paths and quick start guide'
    },
    outputSchema: {
      type: 'object',
      required: ['setupGuidePath', 'architecturePath', 'quickStartSteps', 'nextSteps', 'artifacts'],
      properties: {
        setupGuidePath: { type: 'string' },
        architecturePath: { type: 'string' },
        troubleshootingGuidePath: { type: 'string' },
        contributionGuidePath: { type: 'string' },
        quickStartSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              command: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              priority: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        commonCommands: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              command: { type: 'string' },
              purpose: { type: 'string' }
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
  labels: ['dbt', 'analytics', 'documentation', 'setup-guide']
}));
