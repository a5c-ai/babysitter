/**
 * @process data-engineering-analytics/bi-dashboard
 * @description Comprehensive BI Dashboard Development process covering requirements gathering, data modeling, visualization design,
 * dashboard implementation across platforms (Tableau/Looker/PowerBI), testing, and deployment with best practices.
 * @inputs { projectName: string, platform: string, dataWarehouse: string, dashboardScope: string, userRoles: array }
 * @outputs { success: boolean, dashboardCount: number, qualityScore: number, performanceScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    platform = null, // null for evaluation, or specific: 'tableau', 'powerbi', 'looker', 'metabase', 'superset'
    dataWarehouse = 'snowflake', // 'snowflake', 'bigquery', 'redshift', 'databricks'
    dashboardScope = 'departmental', // 'executive', 'departmental', 'operational', 'analytical'
    userRoles = ['analyst', 'manager', 'executive'],
    enableInteractivity = true,
    enableMobileView = true,
    enableRealTime = false,
    accessControl = 'role-based', // 'none', 'role-based', 'row-level'
    performanceTarget = 'fast', // 'fast' (<3s), 'medium' (<5s), 'relaxed' (<10s)
    outputDir = 'bi-dashboard-output',
    includeTraining = true,
    deploymentMode = 'cloud' // 'cloud', 'on-premise', 'hybrid'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let qualityScore = 0;
  let performanceScore = 0;
  let dashboardCount = 0;

  ctx.log('info', `Starting BI Dashboard Development for ${projectName}`);
  ctx.log('info', `Platform: ${platform || 'TBD'}, Warehouse: ${dataWarehouse}, Scope: ${dashboardScope}`);
  ctx.log('info', `User Roles: ${userRoles.join(', ')}, Performance Target: ${performanceTarget}`);

  // Task 1: Requirements Gathering and Analysis
  ctx.log('info', 'Phase 1: Gathering and analyzing dashboard requirements');
  const requirementsResult = await ctx.task(requirementsGatheringTask, {
    projectName,
    dashboardScope,
    userRoles,
    dataWarehouse,
    enableInteractivity,
    enableMobileView,
    enableRealTime,
    outputDir
  });

  if (!requirementsResult.success) {
    return {
      success: false,
      error: 'Requirements gathering failed',
      details: requirementsResult,
      metadata: { processId: 'data-engineering-analytics/bi-dashboard', timestamp: startTime }
    };
  }

  artifacts.push(...requirementsResult.artifacts);
  dashboardCount = requirementsResult.dashboardsIdentified;

  ctx.log('info', `Requirements complete - ${dashboardCount} dashboards identified, ${requirementsResult.kpis.length} KPIs defined`);

  // Breakpoint: Review requirements
  await ctx.breakpoint({
    question: `Requirements gathering complete for ${projectName}. Identified ${dashboardCount} dashboards and ${requirementsResult.kpis.length} KPIs. Review requirements and user stories?`,
    title: 'Requirements Review',
    context: {
      runId: ctx.runId,
      requirements: {
        dashboardCount,
        kpiCount: requirementsResult.kpis.length,
        userRoles: requirementsResult.userRoles,
        functionalRequirements: requirementsResult.functionalRequirements.length,
        nonFunctionalRequirements: requirementsResult.nonFunctionalRequirements.length,
        prioritizedFeatures: requirementsResult.prioritizedFeatures.slice(0, 10)
      },
      files: requirementsResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 2: Platform Selection (if not specified)
  let selectedPlatform = platform;
  let platformEvaluation = null;

  if (!selectedPlatform) {
    ctx.log('info', 'Phase 2: Evaluating BI platforms');
    platformEvaluation = await ctx.task(platformSelectionTask, {
      projectName,
      requirements: requirementsResult.requirements,
      dataWarehouse,
      userRoles,
      dashboardScope,
      deploymentMode,
      outputDir
    });

    selectedPlatform = platformEvaluation.recommendedPlatform;
    artifacts.push(...platformEvaluation.artifacts);
    ctx.log('info', `Platform selected: ${selectedPlatform} (score: ${platformEvaluation.scores[selectedPlatform]})`);
  } else {
    ctx.log('info', `Using specified platform: ${selectedPlatform}`);
  }

  // Breakpoint: Platform selection review
  if (platformEvaluation) {
    await ctx.breakpoint({
      question: `Platform evaluation complete. Recommended: ${selectedPlatform}. Review platform comparison and selection rationale?`,
      title: 'Platform Selection Review',
      context: {
        runId: ctx.runId,
        platform: {
          selected: selectedPlatform,
          scores: platformEvaluation.scores,
          evaluation: platformEvaluation.evaluation,
          costEstimate: platformEvaluation.costEstimate
        },
        files: platformEvaluation.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
      }
    });
  }

  // Task 3: Data Modeling and Source Preparation
  ctx.log('info', 'Phase 3: Designing data models and preparing data sources');
  const dataModelingResult = await ctx.task(dataModelingTask, {
    projectName,
    platform: selectedPlatform,
    dataWarehouse,
    requirements: requirementsResult.requirements,
    kpis: requirementsResult.kpis,
    performanceTarget,
    outputDir
  });

  artifacts.push(...dataModelingResult.artifacts);

  ctx.log('info', `Data modeling complete - ${dataModelingResult.dataModels.length} models, ${dataModelingResult.metrics.length} metrics defined`);

  // Breakpoint: Data model review
  await ctx.breakpoint({
    question: `Data modeling complete. Created ${dataModelingResult.dataModels.length} data models and ${dataModelingResult.metrics.length} metrics. Review data architecture and calculations?`,
    title: 'Data Model Review',
    context: {
      runId: ctx.runId,
      dataModeling: {
        dataModels: dataModelingResult.dataModels.map(m => ({ name: m.name, tables: m.tables?.length || 0 })),
        metrics: dataModelingResult.metrics.length,
        dimensions: dataModelingResult.dimensions.length,
        relationships: dataModelingResult.relationships.length,
        performanceOptimizations: dataModelingResult.performanceOptimizations
      },
      files: dataModelingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 4: Visualization Design and UX Planning
  ctx.log('info', 'Phase 4: Designing visualizations and user experience');
  const visualDesignResult = await ctx.task(visualizationDesignTask, {
    projectName,
    platform: selectedPlatform,
    requirements: requirementsResult.requirements,
    kpis: requirementsResult.kpis,
    userRoles,
    enableInteractivity,
    enableMobileView,
    dashboardScope,
    outputDir
  });

  artifacts.push(...visualDesignResult.artifacts);

  ctx.log('info', `Visualization design complete - ${visualDesignResult.visualizations.length} visualizations designed`);

  // Breakpoint: Visualization design review
  await ctx.breakpoint({
    question: `Visualization design complete. Created ${visualDesignResult.visualizations.length} visualizations and ${visualDesignResult.wireframes.length} wireframes. Review design mockups and UX flows?`,
    title: 'Visualization Design Review',
    context: {
      runId: ctx.runId,
      design: {
        visualizations: visualDesignResult.visualizations.length,
        wireframes: visualDesignResult.wireframes.length,
        designSystem: visualDesignResult.designSystem,
        interactionPatterns: visualDesignResult.interactionPatterns,
        mobileOptimized: enableMobileView
      },
      files: visualDesignResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 5: Dashboard Implementation
  ctx.log('info', 'Phase 5: Implementing dashboards in ' + selectedPlatform);
  const implementationResult = await ctx.task(dashboardImplementationTask, {
    projectName,
    platform: selectedPlatform,
    dataWarehouse,
    dataModels: dataModelingResult.dataModels,
    visualDesign: visualDesignResult,
    requirements: requirementsResult.requirements,
    enableInteractivity,
    enableMobileView,
    enableRealTime,
    performanceTarget,
    outputDir
  });

  artifacts.push(...implementationResult.artifacts);

  ctx.log('info', `Implementation complete - ${implementationResult.dashboardsCreated} dashboards, ${implementationResult.worksheets.length} worksheets`);

  // Breakpoint: Implementation review
  await ctx.breakpoint({
    question: `Dashboard implementation complete. Created ${implementationResult.dashboardsCreated} dashboards with ${implementationResult.worksheets.length} worksheets. Review implementation and initial performance?`,
    title: 'Implementation Review',
    context: {
      runId: ctx.runId,
      implementation: {
        dashboardsCreated: implementationResult.dashboardsCreated,
        worksheets: implementationResult.worksheets.length,
        filters: implementationResult.filters.length,
        parameters: implementationResult.parameters.length,
        calculations: implementationResult.calculations.length,
        initialPerformance: implementationResult.performanceMetrics
      },
      files: implementationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 6: Access Control and Security Configuration
  if (accessControl !== 'none') {
    ctx.log('info', 'Phase 6: Configuring access control and security');
    const securityResult = await ctx.task(securityConfigurationTask, {
      projectName,
      platform: selectedPlatform,
      accessControl,
      userRoles,
      dashboards: implementationResult.dashboards,
      dataModels: dataModelingResult.dataModels,
      outputDir
    });

    artifacts.push(...securityResult.artifacts);

    ctx.log('info', `Security configured - ${securityResult.policies.length} policies, ${securityResult.userGroups.length} user groups`);

    // Breakpoint: Security review
    await ctx.breakpoint({
      question: `Security configuration complete. Defined ${securityResult.policies.length} access policies and ${securityResult.userGroups.length} user groups. Review security settings?`,
      title: 'Security Configuration Review',
      context: {
        runId: ctx.runId,
        security: {
          accessControl,
          policies: securityResult.policies.length,
          userGroups: securityResult.userGroups.length,
          rowLevelSecurity: securityResult.rowLevelSecurity,
          dataGovernance: securityResult.dataGovernance
        },
        files: securityResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
      }
    });
  }

  // Task 7: Performance Optimization
  ctx.log('info', 'Phase 7: Optimizing dashboard performance');
  const optimizationResult = await ctx.task(performanceOptimizationTask, {
    projectName,
    platform: selectedPlatform,
    dataWarehouse,
    dashboards: implementationResult.dashboards,
    dataModels: dataModelingResult.dataModels,
    performanceTarget,
    outputDir
  });

  artifacts.push(...optimizationResult.artifacts);
  performanceScore = optimizationResult.performanceScore;

  ctx.log('info', `Performance optimization complete - Score: ${performanceScore}/100, Avg load time: ${optimizationResult.avgLoadTime}s`);

  // Breakpoint: Performance review
  await ctx.breakpoint({
    question: `Performance optimization complete. Performance score: ${performanceScore}/100, Average load time: ${optimizationResult.avgLoadTime}s (target: ${performanceTarget}). Review optimization results?`,
    title: 'Performance Optimization Review',
    context: {
      runId: ctx.runId,
      performance: {
        score: performanceScore,
        avgLoadTime: optimizationResult.avgLoadTime,
        target: performanceTarget,
        optimizations: optimizationResult.optimizations,
        slowDashboards: optimizationResult.slowDashboards,
        recommendations: optimizationResult.recommendations
      },
      files: optimizationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 8: Testing and Quality Assurance
  ctx.log('info', 'Phase 8: Testing dashboards and validating quality');
  const testingResult = await ctx.task(dashboardTestingTask, {
    projectName,
    platform: selectedPlatform,
    dashboards: implementationResult.dashboards,
    requirements: requirementsResult.requirements,
    kpis: requirementsResult.kpis,
    userRoles,
    enableMobileView,
    outputDir
  });

  artifacts.push(...testingResult.artifacts);

  ctx.log('info', `Testing complete - ${testingResult.testsPassed}/${testingResult.testsRun} tests passed`);

  // Breakpoint: Testing review
  await ctx.breakpoint({
    question: `Dashboard testing complete. ${testingResult.testsPassed}/${testingResult.testsRun} tests passed. ${testingResult.testsFailed > 0 ? `Review and fix ${testingResult.testsFailed} failed tests?` : 'Proceed to deployment?'}`,
    title: 'Testing Results Review',
    context: {
      runId: ctx.runId,
      testing: {
        testsRun: testingResult.testsRun,
        testsPassed: testingResult.testsPassed,
        testsFailed: testingResult.testsFailed,
        dataValidation: testingResult.dataValidation,
        functionalTests: testingResult.functionalTests,
        usabilityTests: testingResult.usabilityTests,
        failedTests: testingResult.failedTests || []
      },
      files: testingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 9: Documentation Generation
  ctx.log('info', 'Phase 9: Generating comprehensive documentation');
  const documentationResult = await ctx.task(documentationGenerationTask, {
    projectName,
    platform: selectedPlatform,
    requirements: requirementsResult.requirements,
    dashboards: implementationResult.dashboards,
    dataModels: dataModelingResult.dataModels,
    visualDesign: visualDesignResult,
    userRoles,
    includeTraining,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);

  ctx.log('info', `Documentation complete - ${documentationResult.documents.length} documents generated`);

  // Breakpoint: Documentation review
  await ctx.breakpoint({
    question: `Documentation generation complete. Created ${documentationResult.documents.length} documents including user guides and technical documentation. Review documentation?`,
    title: 'Documentation Review',
    context: {
      runId: ctx.runId,
      documentation: {
        documents: documentationResult.documents.length,
        userGuides: documentationResult.userGuides.length,
        technicalDocs: documentationResult.technicalDocs.length,
        trainingMaterials: documentationResult.trainingMaterials?.length || 0,
        videoTutorials: documentationResult.videoScripts?.length || 0
      },
      files: documentationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 10: Deployment and Release
  ctx.log('info', 'Phase 10: Deploying dashboards to production');
  const deploymentResult = await ctx.task(dashboardDeploymentTask, {
    projectName,
    platform: selectedPlatform,
    deploymentMode,
    dashboards: implementationResult.dashboards,
    dataModels: dataModelingResult.dataModels,
    accessControl,
    outputDir
  });

  artifacts.push(...deploymentResult.artifacts);

  ctx.log('info', `Deployment complete - ${deploymentResult.dashboardsDeployed} dashboards deployed to ${deploymentResult.environment}`);

  // Breakpoint: Deployment verification
  await ctx.breakpoint({
    question: `Dashboards deployed to ${deploymentResult.environment}. ${deploymentResult.dashboardsDeployed} dashboards live, ${deploymentResult.users.length} users configured. Verify deployment and access?`,
    title: 'Deployment Verification',
    context: {
      runId: ctx.runId,
      deployment: {
        environment: deploymentResult.environment,
        dashboardsDeployed: deploymentResult.dashboardsDeployed,
        usersConfigured: deploymentResult.users.length,
        url: deploymentResult.url,
        healthCheck: deploymentResult.healthCheck,
        monitoring: deploymentResult.monitoring
      },
      files: deploymentResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 11: Quality Assessment and Final Validation
  ctx.log('info', 'Phase 11: Final quality assessment and validation');
  const qualityResult = await ctx.task(qualityAssessmentTask, {
    projectName,
    requirements: requirementsResult.requirements,
    implementation: implementationResult,
    testing: testingResult,
    performance: optimizationResult,
    documentation: documentationResult,
    deployment: deploymentResult,
    outputDir
  });

  qualityScore = qualityResult.score;
  artifacts.push(...qualityResult.artifacts);

  const meetsRequirements = qualityResult.requirementsCoverage >= 95;
  const performanceMet = performanceScore >= 85;

  ctx.log('info', `Quality assessment complete - Score: ${qualityScore}/100, Requirements coverage: ${qualityResult.requirementsCoverage}%`);

  // Final Quality Gate
  await ctx.breakpoint({
    question: `BI Dashboard Development complete for ${projectName}. Quality score: ${qualityScore}/100, Performance: ${performanceScore}/100, Requirements met: ${qualityResult.requirementsCoverage}%. ${meetsRequirements && performanceMet ? 'Ready for sign-off!' : 'Review findings and improvements.'} Sign off?`,
    title: 'Final Quality Assessment',
    context: {
      runId: ctx.runId,
      final: {
        qualityScore,
        performanceScore,
        requirementsCoverage: qualityResult.requirementsCoverage,
        dashboardsDeployed: deploymentResult.dashboardsDeployed,
        meetsRequirements,
        performanceMet,
        recommendations: qualityResult.recommendations,
        nextSteps: qualityResult.nextSteps
      },
      files: qualityResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  ctx.log('info', '='.repeat(80));
  ctx.log('info', 'BI DASHBOARD DEVELOPMENT COMPLETE');
  ctx.log('info', '='.repeat(80));
  ctx.log('info', `Project: ${projectName}`);
  ctx.log('info', `Platform: ${selectedPlatform} on ${dataWarehouse}`);
  ctx.log('info', `Dashboards Created: ${dashboardCount}`);
  ctx.log('info', `Quality Score: ${qualityScore}/100`);
  ctx.log('info', `Performance Score: ${performanceScore}/100`);
  ctx.log('info', `Requirements Coverage: ${qualityResult.requirementsCoverage}%`);
  ctx.log('info', `Artifacts Generated: ${artifacts.length}`);
  ctx.log('info', `Duration: ${Math.round(duration / 1000)}s`);
  ctx.log('info', '='.repeat(80));

  return {
    success: true,
    platform: selectedPlatform,
    platformEvaluation,
    dashboardCount,
    qualityScore,
    performanceScore,
    requirementsCoverage: qualityResult.requirementsCoverage,
    meetsRequirements,
    performanceMet,
    requirements: requirementsResult.requirements,
    dataModels: dataModelingResult.dataModels,
    dashboards: implementationResult.dashboards,
    deployment: deploymentResult,
    artifacts,
    duration,
    recommendations: qualityResult.recommendations,
    nextSteps: qualityResult.nextSteps,
    metadata: {
      processId: 'data-engineering-analytics/bi-dashboard',
      timestamp: startTime,
      platform: selectedPlatform,
      dataWarehouse,
      dashboardScope,
      outputDir
    }
  };
}

// Task 1: Requirements Gathering
export const requirementsGatheringTask = defineTask('requirements-gathering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather and analyze dashboard requirements',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business intelligence analyst',
      task: 'Gather comprehensive BI dashboard requirements',
      context: args,
      instructions: [
        'Interview stakeholders across all user roles to understand needs',
        'Identify key performance indicators (KPIs) and business metrics',
        'Document dashboard objectives and success criteria',
        'Define user personas and their specific requirements',
        'Gather functional requirements: filters, drill-downs, interactivity, exports',
        'Document non-functional requirements: performance, security, mobile support',
        'Identify data sources and data refresh requirements',
        'Define dashboard scope: executive, departmental, operational, analytical',
        'Prioritize features using MoSCoW method (Must have, Should have, Could have, Won\'t have)',
        'Document user stories with acceptance criteria',
        'Identify technical constraints and dependencies',
        'Create requirements traceability matrix',
        'Generate wireframes and mockups for key dashboards',
        'Save comprehensive requirements document'
      ],
      outputFormat: 'JSON with requirements, KPIs, user stories, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'requirements', 'kpis', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dashboardsIdentified: { type: 'number' },
        requirements: {
          type: 'object',
          properties: {
            businessObjectives: { type: 'array', items: { type: 'string' } },
            targetAudience: { type: 'array' },
            dataRefreshFrequency: { type: 'string' },
            expectedConcurrentUsers: { type: 'number' }
          }
        },
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              definition: { type: 'string' },
              calculation: { type: 'string' },
              target: { type: 'number' },
              owner: { type: 'string' }
            }
          }
        },
        userRoles: { type: 'array', items: { type: 'string' } },
        functionalRequirements: { type: 'array', items: { type: 'string' } },
        nonFunctionalRequirements: { type: 'array', items: { type: 'string' } },
        prioritizedFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              priority: { type: 'string', enum: ['must', 'should', 'could', 'wont'] }
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
  labels: ['agent', 'bi-dashboard', 'requirements', 'analysis']
}));

// Task 2: Platform Selection
export const platformSelectionTask = defineTask('platform-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate and select BI platform',
  agent: {
    name: 'platform-evaluator',
    prompt: {
      role: 'BI platform architect',
      task: 'Evaluate Tableau, PowerBI, Looker, Metabase, and Apache Superset against requirements',
      context: args,
      instructions: [
        'Evaluate Tableau: features, ease of use, pricing, scalability, integration',
        'Evaluate Microsoft PowerBI: features, Microsoft ecosystem integration, pricing, AI capabilities',
        'Evaluate Looker (Google): LookML, embedded analytics, pricing, data modeling',
        'Evaluate Metabase: open-source, simplicity, self-service, limitations',
        'Evaluate Apache Superset: open-source, Python ecosystem, visualization types, scalability',
        'Compare platforms across dimensions: visualization capabilities, data connectivity, ease of use, performance',
        'Assess pricing models: licensing, per-user costs, infrastructure costs',
        'Evaluate deployment options: cloud, on-premise, hybrid',
        'Consider data warehouse integration and optimization',
        'Assess mobile support and responsive design capabilities',
        'Evaluate collaboration features: sharing, commenting, embedding',
        'Consider learning curve and training requirements',
        'Analyze total cost of ownership (TCO) over 3 years',
        'Score each platform against requirements',
        'Provide detailed recommendation with justification',
        'Create comparison matrix and decision document'
      ],
      outputFormat: 'JSON with platform comparison, scores, recommendation, cost estimates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedPlatform', 'scores', 'evaluation', 'artifacts'],
      properties: {
        recommendedPlatform: { type: 'string', enum: ['tableau', 'powerbi', 'looker', 'metabase', 'superset'] },
        scores: {
          type: 'object',
          properties: {
            tableau: { type: 'number' },
            powerbi: { type: 'number' },
            looker: { type: 'number' },
            metabase: { type: 'number' },
            superset: { type: 'number' }
          }
        },
        evaluation: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              pros: { type: 'array' },
              cons: { type: 'array' },
              bestFor: { type: 'string' }
            }
          }
        },
        costEstimate: {
          type: 'object',
          properties: {
            yearOne: { type: 'number' },
            yearThree: { type: 'number' },
            breakdown: { type: 'object' }
          }
        },
        justification: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bi-dashboard', 'platform-selection', 'evaluation']
}));

// Task 3: Data Modeling
export const dataModelingTask = defineTask('data-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design data models for dashboards',
  agent: {
    name: 'data-modeler',
    prompt: {
      role: 'senior BI data modeler',
      task: 'Design optimized data models for dashboard implementation',
      context: args,
      instructions: [
        'Analyze requirements and KPIs to identify data needs',
        'Design dimensional models optimized for BI queries',
        'Define fact tables, dimension tables, and relationships',
        'Create calculated fields and metrics for KPIs',
        'Design aggregation tables for performance',
        'Implement slowly changing dimensions (SCD) where needed',
        'Define data granularity for each dashboard',
        'Create joins and relationships between tables',
        'Design filters and parameters architecture',
        'Optimize data models for query performance based on target',
        'Implement incremental refresh strategies',
        'Create data source connections for the selected platform',
        'Generate SQL views and materialized views if needed',
        'Document data lineage and business logic',
        'Create data dictionary and field definitions',
        'Generate ERD diagrams for data models'
      ],
      outputFormat: 'JSON with data models, metrics, relationships, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dataModels', 'metrics', 'artifacts'],
      properties: {
        dataModels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['live', 'extract', 'hybrid'] },
              tables: { type: 'array' },
              granularity: { type: 'string' }
            }
          }
        },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              definition: { type: 'string' },
              calculation: { type: 'string' },
              aggregation: { type: 'string' }
            }
          }
        },
        dimensions: { type: 'array' },
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              type: { type: 'string', enum: ['one-to-one', 'one-to-many', 'many-to-many'] }
            }
          }
        },
        performanceOptimizations: {
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
  labels: ['agent', 'bi-dashboard', 'data-modeling', 'schema-design']
}));

// Task 4: Visualization Design
export const visualizationDesignTask = defineTask('visualization-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design visualizations and user experience',
  agent: {
    name: 'ux-designer',
    prompt: {
      role: 'BI UX/UI designer and visualization expert',
      task: 'Design comprehensive visualization strategy and user experience',
      context: args,
      instructions: [
        'Select appropriate chart types for each KPI and metric',
        'Design dashboard layouts following best practices (F-pattern, Z-pattern)',
        'Create visual hierarchy with proper use of color, size, and position',
        'Design color palette following accessibility guidelines (WCAG 2.1)',
        'Create responsive layouts for desktop, tablet, and mobile (if enabled)',
        'Design interactive elements: filters, drill-downs, tooltips, actions',
        'Implement data storytelling principles',
        'Design dashboard navigation and user flows',
        'Create wireframes for each dashboard',
        'Design high-fidelity mockups with branding elements',
        'Establish design system: fonts, colors, spacing, components',
        'Design for different user roles with personalized views',
        'Implement progressive disclosure for complex data',
        'Design error states and empty states',
        'Create interaction patterns documentation',
        'Design export and sharing functionality'
      ],
      outputFormat: 'JSON with visualizations, wireframes, design system, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['visualizations', 'wireframes', 'designSystem', 'artifacts'],
      properties: {
        visualizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kpi: { type: 'string' },
              chartType: { type: 'string' },
              rationale: { type: 'string' },
              interactivity: { type: 'array' }
            }
          }
        },
        wireframes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dashboard: { type: 'string' },
              layout: { type: 'string' },
              components: { type: 'array' }
            }
          }
        },
        designSystem: {
          type: 'object',
          properties: {
            colorPalette: { type: 'array' },
            typography: { type: 'object' },
            spacing: { type: 'object' },
            components: { type: 'array' }
          }
        },
        interactionPatterns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bi-dashboard', 'visualization', 'ux-design']
}));

// Task 5: Dashboard Implementation
export const dashboardImplementationTask = defineTask('dashboard-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement dashboards in BI platform',
  agent: {
    name: 'bi-developer',
    prompt: {
      role: 'senior BI developer and dashboard specialist',
      task: `Implement dashboards in ${args.platform}`,
      context: args,
      instructions: [
        `Create data source connections in ${args.platform}`,
        'Build data models according to specifications',
        'Implement calculated fields and metrics',
        'Create individual visualizations (charts, tables, maps)',
        'Build dashboard layouts with proper positioning and sizing',
        'Implement filters and parameters',
        'Add interactive features: drill-downs, actions, tooltips',
        'Configure conditional formatting and alerts',
        'Implement cross-filtering and highlighting',
        'Add navigation between dashboards',
        'Configure real-time updates if required',
        'Optimize for mobile devices if enabled',
        'Implement error handling and data validation',
        'Add explanatory text and context to dashboards',
        'Configure data refresh schedules',
        'Test all interactive elements and calculations',
        'Document custom calculations and business logic',
        'Create implementation guide with screenshots'
      ],
      outputFormat: 'JSON with dashboards, worksheets, calculations, performance metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboardsCreated', 'dashboards', 'artifacts'],
      properties: {
        dashboardsCreated: { type: 'number' },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              worksheets: { type: 'array' },
              filters: { type: 'array' }
            }
          }
        },
        worksheets: { type: 'array' },
        filters: { type: 'array' },
        parameters: { type: 'array' },
        calculations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              formula: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        performanceMetrics: {
          type: 'object',
          properties: {
            avgLoadTime: { type: 'number' },
            slowestDashboard: { type: 'string' },
            queryCount: { type: 'number' }
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
  labels: ['agent', 'bi-dashboard', 'implementation', 'development']
}));

// Task 6: Security Configuration
export const securityConfigurationTask = defineTask('security-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure access control and security',
  agent: {
    name: 'security-engineer',
    prompt: {
      role: 'BI security specialist',
      task: 'Configure comprehensive security and access control',
      context: args,
      instructions: [
        'Design role-based access control (RBAC) strategy',
        'Create user groups aligned with organizational structure',
        'Define permissions for each user role: view, edit, share, publish',
        'Implement row-level security (RLS) if required',
        'Configure column-level security for sensitive data',
        'Set up data masking for PII and confidential information',
        'Implement single sign-on (SSO) integration',
        'Configure multi-factor authentication (MFA)',
        'Set up audit logging for dashboard access and changes',
        'Define data governance policies',
        'Implement content permissions and sharing rules',
        'Configure embedding and external sharing security',
        'Set up data refresh permissions',
        'Implement workspace and project-level security',
        'Create security documentation and procedures',
        'Generate compliance report for security requirements'
      ],
      outputFormat: 'JSON with security configuration, policies, user groups, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['policies', 'userGroups', 'artifacts'],
      properties: {
        policies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              rules: { type: 'array' }
            }
          }
        },
        userGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              permissions: { type: 'array' }
            }
          }
        },
        rowLevelSecurity: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            rules: { type: 'array' }
          }
        },
        dataGovernance: {
          type: 'object',
          properties: {
            dataMasking: { type: 'boolean' },
            auditLogging: { type: 'boolean' },
            ssoEnabled: { type: 'boolean' }
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
  labels: ['agent', 'bi-dashboard', 'security', 'access-control']
}));

// Task 7: Performance Optimization
export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize dashboard performance',
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'BI performance optimization specialist',
      task: 'Optimize dashboards to meet performance targets',
      context: args,
      instructions: [
        'Measure baseline performance for all dashboards',
        'Identify slow-loading dashboards and visualizations',
        'Optimize data models: reduce data volume, use aggregations',
        'Implement extracts instead of live connections where appropriate',
        'Create materialized views in data warehouse for complex calculations',
        'Optimize SQL queries generated by dashboard',
        'Implement incremental refresh for large datasets',
        'Use data blending and joins efficiently',
        'Reduce number of queries per dashboard',
        'Implement caching strategies',
        'Optimize filter performance with indexed fields',
        'Reduce dashboard complexity: limit worksheets, simplify calculations',
        'Configure query result caching',
        'Implement progressive loading for large dashboards',
        'Use LOD (Level of Detail) expressions efficiently',
        'Benchmark against performance targets',
        'Document optimization techniques applied',
        'Provide ongoing optimization recommendations'
      ],
      outputFormat: 'JSON with performance score, metrics, optimizations, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['performanceScore', 'avgLoadTime', 'optimizations', 'artifacts'],
      properties: {
        performanceScore: { type: 'number', minimum: 0, maximum: 100 },
        avgLoadTime: { type: 'number' },
        optimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dashboard: { type: 'string' },
              optimization: { type: 'string' },
              improvement: { type: 'string' }
            }
          }
        },
        slowDashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              loadTime: { type: 'number' },
              issue: { type: 'string' }
            }
          }
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
  labels: ['agent', 'bi-dashboard', 'performance', 'optimization']
}));

// Task 8: Dashboard Testing
export const dashboardTestingTask = defineTask('dashboard-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test dashboards and validate quality',
  agent: {
    name: 'qa-engineer',
    prompt: {
      role: 'BI quality assurance specialist',
      task: 'Comprehensive testing and validation of dashboards',
      context: args,
      instructions: [
        'Validate data accuracy: compare dashboard values with source data',
        'Test all calculations and metrics against business logic',
        'Verify KPIs match requirements and business definitions',
        'Test filters: single select, multi-select, date ranges, cascading',
        'Test interactive features: drill-downs, actions, parameter controls',
        'Validate cross-filtering and highlighting behavior',
        'Test navigation between dashboards',
        'Verify conditional formatting rules',
        'Test export functionality: PDF, PowerPoint, Excel, images',
        'Validate tooltips and hover information',
        'Test mobile responsiveness if enabled',
        'Perform cross-browser testing (Chrome, Firefox, Safari, Edge)',
        'Validate accessibility compliance (WCAG 2.1)',
        'Test with different user roles and permissions',
        'Perform load testing with expected concurrent users',
        'Verify error handling for missing data',
        'Test data refresh and update schedules',
        'Conduct user acceptance testing (UAT) with stakeholders',
        'Document all test cases and results'
      ],
      outputFormat: 'JSON with test results, validation summary, failed tests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['testsRun', 'testsPassed', 'testsFailed', 'artifacts'],
      properties: {
        testsRun: { type: 'number' },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        dataValidation: {
          type: 'object',
          properties: {
            metricsValidated: { type: 'number' },
            metricsAccurate: { type: 'number' },
            discrepancies: { type: 'array' }
          }
        },
        functionalTests: {
          type: 'object',
          properties: {
            filtersWorking: { type: 'boolean' },
            interactivityWorking: { type: 'boolean' },
            navigationWorking: { type: 'boolean' }
          }
        },
        usabilityTests: {
          type: 'object',
          properties: {
            accessibilityScore: { type: 'number' },
            mobileResponsive: { type: 'boolean' },
            userFeedback: { type: 'array' }
          }
        },
        failedTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
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
  labels: ['agent', 'bi-dashboard', 'testing', 'qa']
}));

// Task 9: Documentation Generation
export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive documentation',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer specializing in BI documentation',
      task: 'Create comprehensive documentation for dashboards',
      context: args,
      instructions: [
        'Create executive summary with dashboard overview',
        'Document business context and objectives for each dashboard',
        'Create user guides for each role with screenshots and step-by-step instructions',
        'Document KPI definitions and calculation logic',
        'Provide data dictionary with field descriptions',
        'Document filter usage and interactive features',
        'Create quick reference guides for common tasks',
        'Document data refresh schedules and data freshness',
        'Provide troubleshooting guide for common issues',
        'Document access request procedures',
        'Create FAQ section based on requirements',
        'Document best practices for dashboard usage',
        'Provide tips for data interpretation',
        'Create video tutorial scripts if training enabled',
        'Document mobile usage guidelines if enabled',
        'Create administrator guide for maintenance',
        'Document data lineage and sources',
        'Provide glossary of business terms',
        'Create training presentation materials if enabled'
      ],
      outputFormat: 'JSON with documentation paths, user guides, training materials, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documents', 'userGuides', 'technicalDocs', 'artifacts'],
      properties: {
        documents: { type: 'array', items: { type: 'string' } },
        userGuides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              documentPath: { type: 'string' }
            }
          }
        },
        technicalDocs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              documentPath: { type: 'string' }
            }
          }
        },
        trainingMaterials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        videoScripts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'bi-dashboard', 'documentation', 'training']
}));

// Task 10: Dashboard Deployment
export const dashboardDeploymentTask = defineTask('dashboard-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Deploy dashboards to production',
  agent: {
    name: 'deployment-engineer',
    prompt: {
      role: 'BI deployment specialist',
      task: 'Deploy dashboards to production environment',
      context: args,
      instructions: [
        'Prepare production environment',
        'Migrate data sources to production connections',
        'Update data source credentials securely',
        'Publish dashboards to production workspace/server',
        'Configure production data refresh schedules',
        'Set up user access and permissions in production',
        'Configure embedding if required',
        'Set up monitoring and alerting',
        'Configure backup and disaster recovery',
        'Implement version control for dashboard content',
        'Set up usage analytics and tracking',
        'Configure email subscriptions and alerts',
        'Test all dashboards in production environment',
        'Verify data refresh is working correctly',
        'Conduct smoke tests with users',
        'Set up health check monitoring',
        'Create rollback plan',
        'Document deployment procedures',
        'Provide production access URLs and credentials'
      ],
      outputFormat: 'JSON with deployment details, environment info, monitoring config, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['environment', 'dashboardsDeployed', 'url', 'artifacts'],
      properties: {
        environment: { type: 'string' },
        dashboardsDeployed: { type: 'number' },
        url: { type: 'string' },
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              role: { type: 'string' }
            }
          }
        },
        healthCheck: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            endpoint: { type: 'string' },
            lastCheck: { type: 'string' }
          }
        },
        monitoring: {
          type: 'object',
          properties: {
            usageTracking: { type: 'boolean' },
            performanceMonitoring: { type: 'boolean' },
            alertsConfigured: { type: 'boolean' }
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
  labels: ['agent', 'bi-dashboard', 'deployment', 'production']
}));

// Task 11: Quality Assessment
export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess overall quality and completeness',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'BI quality assurance manager',
      task: 'Perform final quality assessment of dashboard project',
      context: args,
      instructions: [
        'Verify all requirements have been met',
        'Calculate requirements coverage percentage',
        'Assess data accuracy and calculation correctness',
        'Evaluate visualization design quality',
        'Review user experience and usability',
        'Validate performance against targets',
        'Check documentation completeness',
        'Assess security implementation',
        'Verify deployment success',
        'Evaluate testing thoroughness',
        'Check accessibility compliance',
        'Assess scalability and maintainability',
        'Review user feedback from UAT',
        'Calculate overall quality score (0-100)',
        'Identify gaps and areas for improvement',
        'Provide actionable recommendations',
        'Define next steps and future enhancements',
        'Create executive summary report'
      ],
      outputFormat: 'JSON with quality score, coverage, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'requirementsCoverage', 'recommendations', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        requirementsCoverage: { type: 'number', minimum: 0, maximum: 100 },
        qualityBreakdown: {
          type: 'object',
          properties: {
            dataAccuracy: { type: 'number' },
            visualDesign: { type: 'number' },
            userExperience: { type: 'number' },
            performance: { type: 'number' },
            documentation: { type: 'number' },
            security: { type: 'number' }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              timeline: { type: 'string' }
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
  labels: ['agent', 'bi-dashboard', 'quality', 'assessment']
}));
