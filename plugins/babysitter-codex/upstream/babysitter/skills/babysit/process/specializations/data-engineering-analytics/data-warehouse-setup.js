/**
 * @process data-engineering-analytics/data-warehouse-setup
 * @description Comprehensive data warehouse setup covering platform selection, architecture design, security, optimization, and cost management
 * @inputs { platform: string, requirements: object, cloudProvider: string, enableOptimization: boolean }
 * @outputs { success: boolean, architecture: object, securityConfig: object, optimizationPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    platform = null, // null for evaluation, or specific: 'snowflake', 'bigquery', 'redshift'
    cloudProvider = 'aws', // 'aws', 'gcp', 'azure'
    requirements = {},
    enableOptimization = true,
    enableCostManagement = true,
    outputDir = 'data-warehouse-setup'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Requirements Gathering and Analysis
  ctx.log('info', 'Starting data warehouse setup: Requirements analysis');
  const requirementsResult = await ctx.task(requirementsAnalysisTask, {
    requirements,
    cloudProvider,
    outputDir
  });

  if (!requirementsResult.success) {
    return {
      success: false,
      error: 'Requirements analysis failed',
      details: requirementsResult,
      metadata: { processId: 'data-engineering-analytics/data-warehouse-setup', timestamp: startTime }
    };
  }

  artifacts.push(...requirementsResult.artifacts);

  // Task 2: Platform Selection (if not specified)
  let selectedPlatform = platform;
  let platformEvaluation = null;

  if (!selectedPlatform) {
    ctx.log('info', 'Evaluating data warehouse platforms');
    platformEvaluation = await ctx.task(platformSelectionTask, {
      requirements: requirementsResult.analyzedRequirements,
      cloudProvider,
      outputDir
    });

    selectedPlatform = platformEvaluation.recommendedPlatform;
    artifacts.push(...platformEvaluation.artifacts);
  } else {
    ctx.log('info', `Using specified platform: ${selectedPlatform}`);
  }

  // Task 3: Architecture Design
  ctx.log('info', 'Designing data warehouse architecture');
  const architectureDesign = await ctx.task(architectureDesignTask, {
    platform: selectedPlatform,
    requirements: requirementsResult.analyzedRequirements,
    cloudProvider,
    outputDir
  });

  artifacts.push(...architectureDesign.artifacts);

  // Task 4: Security Configuration
  ctx.log('info', 'Configuring security and compliance');
  const securityConfig = await ctx.task(securityConfigurationTask, {
    platform: selectedPlatform,
    architecture: architectureDesign.architecture,
    requirements: requirementsResult.analyzedRequirements,
    cloudProvider,
    outputDir
  });

  artifacts.push(...securityConfig.artifacts);

  // Task 5: Data Modeling and Schema Design
  ctx.log('info', 'Designing data models and schemas');
  const dataModelDesign = await ctx.task(dataModelingTask, {
    platform: selectedPlatform,
    architecture: architectureDesign.architecture,
    requirements: requirementsResult.analyzedRequirements,
    outputDir
  });

  artifacts.push(...dataModelDesign.artifacts);

  // Task 6: ETL/ELT Pipeline Architecture
  ctx.log('info', 'Designing ETL/ELT pipeline architecture');
  const pipelineArchitecture = await ctx.task(pipelineArchitectureTask, {
    platform: selectedPlatform,
    architecture: architectureDesign.architecture,
    dataModels: dataModelDesign.dataModels,
    requirements: requirementsResult.analyzedRequirements,
    outputDir
  });

  artifacts.push(...pipelineArchitecture.artifacts);

  // Task 7: Performance Optimization Strategy
  let optimizationPlan = null;
  if (enableOptimization) {
    ctx.log('info', 'Developing performance optimization strategy');
    optimizationPlan = await ctx.task(optimizationStrategyTask, {
      platform: selectedPlatform,
      architecture: architectureDesign.architecture,
      dataModels: dataModelDesign.dataModels,
      requirements: requirementsResult.analyzedRequirements,
      outputDir
    });

    artifacts.push(...optimizationPlan.artifacts);
  }

  // Task 8: Cost Management and Monitoring
  let costManagementPlan = null;
  if (enableCostManagement) {
    ctx.log('info', 'Setting up cost management and monitoring');
    costManagementPlan = await ctx.task(costManagementTask, {
      platform: selectedPlatform,
      architecture: architectureDesign.architecture,
      requirements: requirementsResult.analyzedRequirements,
      cloudProvider,
      outputDir
    });

    artifacts.push(...costManagementPlan.artifacts);
  }

  // Task 9: Infrastructure as Code (IaC) Generation
  ctx.log('info', 'Generating Infrastructure as Code');
  const iacGeneration = await ctx.task(iacGenerationTask, {
    platform: selectedPlatform,
    architecture: architectureDesign.architecture,
    securityConfig: securityConfig.configuration,
    dataModels: dataModelDesign.dataModels,
    cloudProvider,
    outputDir
  });

  artifacts.push(...iacGeneration.artifacts);

  // Task 10: Monitoring and Alerting Setup
  ctx.log('info', 'Configuring monitoring and alerting');
  const monitoringSetup = await ctx.task(monitoringSetupTask, {
    platform: selectedPlatform,
    architecture: architectureDesign.architecture,
    optimizationPlan,
    costManagementPlan,
    outputDir
  });

  artifacts.push(...monitoringSetup.artifacts);

  // Task 11: Documentation and Runbooks
  ctx.log('info', 'Generating comprehensive documentation');
  const documentation = await ctx.task(documentationGenerationTask, {
    platform: selectedPlatform,
    platformEvaluation,
    requirements: requirementsResult.analyzedRequirements,
    architectureDesign,
    securityConfig,
    dataModelDesign,
    pipelineArchitecture,
    optimizationPlan,
    costManagementPlan,
    iacGeneration,
    monitoringSetup,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Breakpoint: Review complete data warehouse setup
  await ctx.breakpoint({
    question: `Data warehouse setup complete for ${selectedPlatform}. Review the architecture, security configuration, and implementation plan?`,
    title: 'Data Warehouse Setup Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        platform: selectedPlatform,
        cloudProvider,
        architectureLayers: architectureDesign.architecture.layers,
        securityFeatures: securityConfig.configuration.features,
        estimatedMonthlyCost: costManagementPlan?.estimatedCosts?.monthly || 'N/A',
        implementationPhases: documentation.implementationPlan?.phases?.length || 0
      }
    }
  });

  // Task 12: Implementation Checklist
  ctx.log('info', 'Generating implementation checklist');
  const implementationChecklist = await ctx.task(implementationChecklistTask, {
    platform: selectedPlatform,
    architectureDesign,
    securityConfig,
    dataModelDesign,
    iacGeneration,
    monitoringSetup,
    outputDir
  });

  artifacts.push(...implementationChecklist.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    platform: selectedPlatform,
    cloudProvider,
    platformEvaluation,
    architecture: architectureDesign.architecture,
    securityConfig: securityConfig.configuration,
    dataModels: dataModelDesign.dataModels,
    pipelineArchitecture: pipelineArchitecture.architecture,
    optimizationPlan: optimizationPlan?.plan || null,
    costManagementPlan: costManagementPlan?.plan || null,
    iacFiles: iacGeneration.files,
    monitoringConfig: monitoringSetup.configuration,
    implementationChecklist: implementationChecklist.checklist,
    artifacts,
    duration,
    metadata: {
      processId: 'data-engineering-analytics/data-warehouse-setup',
      timestamp: startTime,
      platform: selectedPlatform,
      cloudProvider,
      outputDir
    }
  };
}

// Task 1: Requirements Analysis
export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze data warehouse requirements',
  agent: {
    name: 'requirements-analyst',
    prompt: {
      role: 'senior data architect',
      task: 'Gather and analyze comprehensive data warehouse requirements',
      context: args,
      instructions: [
        'Analyze business requirements and use cases',
        'Determine data volume requirements (current and projected)',
        'Identify data sources and ingestion patterns',
        'Define query patterns and concurrency requirements',
        'Assess compliance and regulatory requirements (GDPR, HIPAA, etc.)',
        'Identify performance and latency requirements',
        'Determine user roles and access patterns',
        'Assess integration requirements with existing systems',
        'Define disaster recovery and backup requirements',
        'Document budget constraints and cost targets',
        'Save comprehensive requirements document'
      ],
      outputFormat: 'JSON with analyzed requirements, key metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analyzedRequirements', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analyzedRequirements: {
          type: 'object',
          properties: {
            dataVolume: {
              type: 'object',
              properties: {
                currentTB: { type: 'number' },
                projectedTB: { type: 'number' },
                growthRate: { type: 'string' }
              }
            },
            queryPatterns: {
              type: 'object',
              properties: {
                analyticalQueries: { type: 'boolean' },
                realTimeQueries: { type: 'boolean' },
                concurrentUsers: { type: 'number' },
                avgQueryComplexity: { type: 'string' }
              }
            },
            compliance: { type: 'array', items: { type: 'string' } },
            integrations: { type: 'array', items: { type: 'string' } },
            performanceTargets: { type: 'object' },
            budgetConstraints: { type: 'object' }
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
  labels: ['agent', 'data-warehouse', 'requirements', 'analysis']
}));

// Task 2: Platform Selection
export const platformSelectionTask = defineTask('platform-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate and select data warehouse platform',
  agent: {
    name: 'platform-evaluator',
    prompt: {
      role: 'data platform architect',
      task: 'Evaluate Snowflake, BigQuery, and Redshift against requirements',
      context: args,
      instructions: [
        'Evaluate Snowflake: architecture, scalability, pricing, features',
        'Evaluate Google BigQuery: serverless model, ML integration, pricing',
        'Evaluate Amazon Redshift: performance, ecosystem, pricing',
        'Compare platforms across dimensions: performance, cost, scalability, ease of use',
        'Assess cloud provider alignment and existing infrastructure',
        'Consider data gravity and transfer costs',
        'Evaluate vendor lock-in and portability',
        'Compare query performance for typical workloads',
        'Analyze total cost of ownership (TCO)',
        'Score each platform against requirements',
        'Provide recommendation with detailed justification',
        'Create comparison matrix and decision document'
      ],
      outputFormat: 'JSON with platform comparison, scores, recommendation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedPlatform', 'platformComparison', 'artifacts'],
      properties: {
        recommendedPlatform: { type: 'string', enum: ['snowflake', 'bigquery', 'redshift'] },
        platformComparison: {
          type: 'object',
          properties: {
            snowflake: { type: 'object', properties: { score: { type: 'number' }, pros: { type: 'array' }, cons: { type: 'array' } } },
            bigquery: { type: 'object', properties: { score: { type: 'number' }, pros: { type: 'array' }, cons: { type: 'array' } } },
            redshift: { type: 'object', properties: { score: { type: 'number' }, pros: { type: 'array' }, cons: { type: 'array' } } }
          }
        },
        justification: { type: 'string' },
        comparisonMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-warehouse', 'platform-selection', 'evaluation']
}));

// Task 3: Architecture Design
export const architectureDesignTask = defineTask('architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design data warehouse architecture',
  agent: {
    name: 'data-architect',
    prompt: {
      role: 'principal data architect',
      task: 'Design comprehensive data warehouse architecture',
      context: args,
      instructions: [
        'Design layered architecture: raw/staging, transformed/cleansed, curated/consumption',
        'Define database and schema structure',
        'Design compute and storage separation strategy',
        'Plan warehouse sizing and resource allocation',
        'Define data partitioning and clustering strategies',
        'Design materialized views and aggregation layers',
        'Plan for slowly changing dimensions (SCD)',
        'Design for high availability and disaster recovery',
        'Define network architecture and connectivity',
        'Plan integration points with data sources and consumers',
        'Create architecture diagrams (C4 model)',
        'Document design decisions and trade-offs'
      ],
      outputFormat: 'JSON with architecture design, diagrams, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'artifacts'],
      properties: {
        architecture: {
          type: 'object',
          properties: {
            layers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  databases: { type: 'array' },
                  purpose: { type: 'string' }
                }
              }
            },
            computeConfiguration: { type: 'object' },
            storageStrategy: { type: 'object' },
            networkDesign: { type: 'object' },
            highAvailability: { type: 'object' },
            disasterRecovery: { type: 'object' }
          }
        },
        designDecisions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-warehouse', 'architecture', 'design']
}));

// Task 4: Security Configuration
export const securityConfigurationTask = defineTask('security-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure security and compliance',
  agent: {
    name: 'security-architect',
    prompt: {
      role: 'data security architect',
      task: 'Design comprehensive security and compliance configuration',
      context: args,
      instructions: [
        'Design identity and access management (IAM) strategy',
        'Configure role-based access control (RBAC)',
        'Implement row-level and column-level security',
        'Configure data encryption at rest and in transit',
        'Set up key management and rotation policies',
        'Configure network security (VPC, private endpoints, firewalls)',
        'Implement data masking and tokenization for PII',
        'Set up audit logging and compliance monitoring',
        'Configure MFA and SSO integration',
        'Implement data classification and tagging',
        'Define data retention and deletion policies',
        'Create security policies and procedures documentation',
        'Generate compliance checklist for regulations (GDPR, HIPAA, SOC2)',
        'Provide security best practices guide'
      ],
      outputFormat: 'JSON with security configuration, policies, compliance checklist, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'artifacts'],
      properties: {
        configuration: {
          type: 'object',
          properties: {
            iam: { type: 'object' },
            rbac: { type: 'object' },
            encryption: { type: 'object' },
            networkSecurity: { type: 'object' },
            dataProtection: { type: 'object' },
            auditLogging: { type: 'object' },
            features: { type: 'array', items: { type: 'string' } }
          }
        },
        complianceChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              regulation: { type: 'string' },
              requirements: { type: 'array' },
              implementationStatus: { type: 'string' }
            }
          }
        },
        securityPolicies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-warehouse', 'security', 'compliance']
}));

// Task 5: Data Modeling
export const dataModelingTask = defineTask('data-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design data models and schemas',
  agent: {
    name: 'data-modeler',
    prompt: {
      role: 'senior data modeler',
      task: 'Design comprehensive data models and schema structures',
      context: args,
      instructions: [
        'Design dimensional models (star schema, snowflake schema)',
        'Define fact tables with measures and foreign keys',
        'Design dimension tables with slowly changing dimensions',
        'Create bridge tables for many-to-many relationships',
        'Design aggregate tables for performance',
        'Define data types, constraints, and defaults',
        'Plan partitioning and clustering keys',
        'Design indexing strategy (if applicable)',
        'Create naming conventions and standards',
        'Generate DDL scripts for all objects',
        'Create data dictionary and lineage documentation',
        'Design sample queries for validation',
        'Generate ER diagrams and data flow diagrams'
      ],
      outputFormat: 'JSON with data models, DDL scripts, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dataModels', 'artifacts'],
      properties: {
        dataModels: {
          type: 'object',
          properties: {
            factTables: { type: 'array', items: { type: 'object' } },
            dimensionTables: { type: 'array', items: { type: 'object' } },
            aggregateTables: { type: 'array', items: { type: 'object' } },
            bridgeTables: { type: 'array', items: { type: 'object' } }
          }
        },
        ddlScripts: { type: 'array', items: { type: 'string' } },
        namingConventions: { type: 'object' },
        dataDictionary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-warehouse', 'data-modeling', 'schema-design']
}));

// Task 6: Pipeline Architecture
export const pipelineArchitectureTask = defineTask('pipeline-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design ETL/ELT pipeline architecture',
  agent: {
    name: 'pipeline-architect',
    prompt: {
      role: 'data pipeline architect',
      task: 'Design comprehensive ETL/ELT pipeline architecture',
      context: args,
      instructions: [
        'Choose ETL vs ELT approach based on platform capabilities',
        'Design data ingestion patterns (batch, streaming, CDC)',
        'Select orchestration tools (Airflow, dbt, platform-native)',
        'Design incremental loading strategies',
        'Plan data quality checks and validation',
        'Design error handling and retry logic',
        'Configure scheduling and dependencies',
        'Design transformation layers (SQL, Python, platform-specific)',
        'Plan for data lineage tracking',
        'Design testing strategy for pipelines',
        'Create pipeline architecture diagrams',
        'Generate sample pipeline code/configurations',
        'Document pipeline best practices'
      ],
      outputFormat: 'JSON with pipeline architecture, sample code, best practices, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'artifacts'],
      properties: {
        architecture: {
          type: 'object',
          properties: {
            approach: { type: 'string', enum: ['ETL', 'ELT', 'Hybrid'] },
            ingestionPatterns: { type: 'array', items: { type: 'string' } },
            orchestrationTool: { type: 'string' },
            transformationLayers: { type: 'array', items: { type: 'object' } },
            dataQuality: { type: 'object' },
            errorHandling: { type: 'object' }
          }
        },
        samplePipelines: { type: 'array', items: { type: 'object' } },
        bestPractices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-warehouse', 'pipeline', 'etl-elt']
}));

// Task 7: Optimization Strategy
export const optimizationStrategyTask = defineTask('optimization-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop performance optimization strategy',
  agent: {
    name: 'performance-optimizer',
    prompt: {
      role: 'data warehouse performance engineer',
      task: 'Design comprehensive performance optimization strategy',
      context: args,
      instructions: [
        'Analyze query patterns for optimization opportunities',
        'Design clustering and partitioning strategies',
        'Configure materialized views and caching',
        'Optimize table design for query patterns',
        'Design query result caching strategies',
        'Configure warehouse/cluster auto-suspend and auto-resume',
        'Plan for query performance monitoring',
        'Design workload management and resource allocation',
        'Optimize storage compression and encoding',
        'Create query optimization guidelines',
        'Generate performance tuning checklist',
        'Provide query rewriting examples',
        'Set up performance benchmarking plan'
      ],
      outputFormat: 'JSON with optimization plan, strategies, benchmarks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            clusteringStrategy: { type: 'object' },
            partitioningStrategy: { type: 'object' },
            materializationStrategy: { type: 'object' },
            cachingStrategy: { type: 'object' },
            workloadManagement: { type: 'object' },
            storageOptimization: { type: 'object' }
          }
        },
        optimizationGuidelines: { type: 'array', items: { type: 'string' } },
        queryExamples: { type: 'array', items: { type: 'object' } },
        performanceBenchmarks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-warehouse', 'optimization', 'performance']
}));

// Task 8: Cost Management
export const costManagementTask = defineTask('cost-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up cost management and monitoring',
  agent: {
    name: 'cost-optimizer',
    prompt: {
      role: 'FinOps engineer and data architect',
      task: 'Design comprehensive cost management and optimization strategy',
      context: args,
      instructions: [
        'Analyze pricing model for selected platform',
        'Estimate costs based on data volume and query patterns',
        'Design cost allocation and chargeback model',
        'Configure resource tagging for cost tracking',
        'Set up budget alerts and notifications',
        'Design auto-scaling policies for cost optimization',
        'Plan for storage tier optimization',
        'Configure query result cache to reduce compute',
        'Design warehouse/cluster sizing strategy',
        'Set up cost monitoring dashboards',
        'Create cost optimization playbook',
        'Generate monthly cost projections',
        'Provide cost reduction recommendations'
      ],
      outputFormat: 'JSON with cost management plan, estimates, monitoring config, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            costAllocation: { type: 'object' },
            budgetAlerts: { type: 'object' },
            autoScalingPolicies: { type: 'object' },
            storageOptimization: { type: 'object' },
            computeOptimization: { type: 'object' }
          }
        },
        estimatedCosts: {
          type: 'object',
          properties: {
            monthly: { type: 'number' },
            annual: { type: 'number' },
            breakdown: { type: 'object' }
          }
        },
        costOptimizationPlaybook: { type: 'array', items: { type: 'string' } },
        monitoringDashboards: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-warehouse', 'cost-management', 'finops']
}));

// Task 9: IaC Generation
export const iacGenerationTask = defineTask('iac-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Infrastructure as Code',
  agent: {
    name: 'iac-engineer',
    prompt: {
      role: 'DevOps engineer and infrastructure architect',
      task: 'Generate comprehensive Infrastructure as Code for data warehouse',
      context: args,
      instructions: [
        'Generate Terraform/CloudFormation for cloud infrastructure',
        'Create platform-specific IaC (Snowflake SQL, BigQuery DDL, Redshift SQL)',
        'Generate warehouse/dataset/database configurations',
        'Create IAM roles and policies as code',
        'Generate network configurations (VPC, subnets, endpoints)',
        'Create monitoring and alerting configurations',
        'Generate CI/CD pipeline configurations',
        'Create environment-specific variable files (dev, staging, prod)',
        'Include data warehouse objects (tables, views, procedures)',
        'Add comprehensive comments and documentation',
        'Create deployment scripts and README',
        'Follow IaC best practices (modules, variables, outputs)',
        'Generate testing configurations for IaC'
      ],
      outputFormat: 'JSON with IaC files, deployment scripts, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['files', 'artifacts'],
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        deploymentSteps: { type: 'array', items: { type: 'string' } },
        environments: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-warehouse', 'iac', 'terraform']
}));

// Task 10: Monitoring Setup
export const monitoringSetupTask = defineTask('monitoring-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure monitoring and alerting',
  agent: {
    name: 'monitoring-engineer',
    prompt: {
      role: 'SRE and monitoring specialist',
      task: 'Set up comprehensive monitoring and alerting for data warehouse',
      context: args,
      instructions: [
        'Configure platform-native monitoring and insights',
        'Set up query performance monitoring',
        'Configure storage and compute utilization monitoring',
        'Set up data pipeline monitoring',
        'Configure data quality monitoring',
        'Set up cost anomaly detection',
        'Configure security and access monitoring',
        'Create alerting rules and thresholds',
        'Set up notification channels (email, Slack, PagerDuty)',
        'Design monitoring dashboards',
        'Configure log aggregation and analysis',
        'Set up audit trail monitoring',
        'Create runbooks for common alerts',
        'Define SLAs and SLIs for monitoring'
      ],
      outputFormat: 'JSON with monitoring configuration, dashboards, alerts, runbooks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'artifacts'],
      properties: {
        configuration: {
          type: 'object',
          properties: {
            performanceMonitoring: { type: 'object' },
            resourceMonitoring: { type: 'object' },
            pipelineMonitoring: { type: 'object' },
            dataQualityMonitoring: { type: 'object' },
            costMonitoring: { type: 'object' },
            securityMonitoring: { type: 'object' }
          }
        },
        alertingRules: { type: 'array', items: { type: 'object' } },
        dashboards: { type: 'array', items: { type: 'object' } },
        runbooks: { type: 'array', items: { type: 'object' } },
        slas: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-warehouse', 'monitoring', 'alerting']
}));

// Task 11: Documentation Generation
export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive documentation',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer and data architect',
      task: 'Create comprehensive data warehouse documentation',
      context: args,
      instructions: [
        'Create executive summary with architecture overview',
        'Document platform selection rationale (if applicable)',
        'Provide detailed architecture documentation',
        'Document security configuration and compliance',
        'Create data model documentation with ER diagrams',
        'Document ETL/ELT pipeline architecture',
        'Provide performance optimization guide',
        'Document cost management strategies',
        'Create operational runbooks',
        'Document disaster recovery procedures',
        'Create user onboarding guide',
        'Document best practices and patterns',
        'Create implementation roadmap with phases',
        'Provide troubleshooting guide',
        'Format as professional Markdown documentation'
      ],
      outputFormat: 'JSON with documentation paths, implementation plan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationPath', 'implementationPlan', 'artifacts'],
      properties: {
        documentationPath: { type: 'string' },
        implementationPlan: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  duration: { type: 'string' },
                  tasks: { type: 'array' },
                  deliverables: { type: 'array' }
                }
              }
            },
            estimatedTimeline: { type: 'string' }
          }
        },
        keyDocuments: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-warehouse', 'documentation', 'technical-writing']
}));

// Task 12: Implementation Checklist
export const implementationChecklistTask = defineTask('implementation-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate implementation checklist',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'technical project manager',
      task: 'Create detailed implementation checklist for data warehouse setup',
      context: args,
      instructions: [
        'Break down implementation into actionable tasks',
        'Organize tasks by phase and dependency',
        'Assign effort estimates to each task',
        'Identify critical path items',
        'Include verification/testing steps',
        'Add rollback procedures for each phase',
        'Create pre-requisites checklist',
        'Document success criteria for each phase',
        'Include stakeholder approval gates',
        'Add communication and training tasks',
        'Create post-deployment validation checklist',
        'Format as interactive Markdown checklist'
      ],
      outputFormat: 'JSON with implementation checklist, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['checklist', 'artifacts'],
      properties: {
        checklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              tasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    task: { type: 'string' },
                    effort: { type: 'string' },
                    dependencies: { type: 'array' },
                    successCriteria: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        criticalPath: { type: 'array', items: { type: 'string' } },
        estimatedDuration: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-warehouse', 'implementation', 'checklist']
}));
