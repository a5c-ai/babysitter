/**
 * @process digital-marketing/marketing-performance-dashboard
 * @description Process for developing and maintaining marketing performance dashboards that provide actionable insights to stakeholders across the organization
 * @inputs { stakeholderRequirements: object, dataSources: array, kpiDefinitions: object, outputDir: string }
 * @outputs { success: boolean, marketingDashboards: array, documentation: object, trainingMaterials: array, alertConfigurations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    stakeholderRequirements = {},
    dataSources = [],
    kpiDefinitions = {},
    outputDir = 'dashboard-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Marketing Performance Dashboard Development process');

  // Task 1: Gather Dashboard Requirements
  ctx.log('info', 'Phase 1: Gathering dashboard requirements from stakeholders');
  const requirementsGathering = await ctx.task(requirementsGatheringTask, {
    stakeholderRequirements,
    outputDir
  });
  artifacts.push(...requirementsGathering.artifacts);

  // Task 2: Define KPIs and Metrics
  ctx.log('info', 'Phase 2: Defining KPIs and metrics to track');
  const kpiDefinition = await ctx.task(kpiDefinitionTask, {
    requirementsGathering,
    kpiDefinitions,
    outputDir
  });
  artifacts.push(...kpiDefinition.artifacts);

  // Task 3: Identify Data Sources and Integrations
  ctx.log('info', 'Phase 3: Identifying data sources and integrations');
  const dataSourceMapping = await ctx.task(dataSourceMappingTask, {
    dataSources,
    kpiDefinition,
    outputDir
  });
  artifacts.push(...dataSourceMapping.artifacts);

  // Task 4: Design Dashboard Layout
  ctx.log('info', 'Phase 4: Designing dashboard layout and visualizations');
  const dashboardDesign = await ctx.task(dashboardDesignTask, {
    requirementsGathering,
    kpiDefinition,
    outputDir
  });
  artifacts.push(...dashboardDesign.artifacts);

  // Task 5: Build Dashboards
  ctx.log('info', 'Phase 5: Building dashboards in BI platform');
  const dashboardBuild = await ctx.task(dashboardBuildTask, {
    dashboardDesign,
    dataSourceMapping,
    outputDir
  });
  artifacts.push(...dashboardBuild.artifacts);

  // Task 6: Configure Data Refresh
  ctx.log('info', 'Phase 6: Configuring data refresh schedules');
  const refreshConfiguration = await ctx.task(refreshConfigurationTask, {
    dashboardBuild,
    dataSourceMapping,
    outputDir
  });
  artifacts.push(...refreshConfiguration.artifacts);

  // Task 7: Set Up Alerts
  ctx.log('info', 'Phase 7: Setting up alerts and anomaly detection');
  const alertSetup = await ctx.task(alertSetupTask, {
    kpiDefinition,
    dashboardBuild,
    outputDir
  });
  artifacts.push(...alertSetup.artifacts);

  // Task 8: Test Dashboard Accuracy
  ctx.log('info', 'Phase 8: Testing dashboard accuracy and performance');
  const dashboardTesting = await ctx.task(dashboardTestingTask, {
    dashboardBuild,
    kpiDefinition,
    outputDir
  });
  artifacts.push(...dashboardTesting.artifacts);

  // Breakpoint: Review dashboards
  await ctx.breakpoint({
    question: `Dashboard development complete. ${dashboardBuild.dashboardCount} dashboards built. ${dashboardTesting.passedTests}/${dashboardTesting.totalTests} accuracy tests passed. Review and approve?`,
    title: 'Marketing Dashboard Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        dashboardCount: dashboardBuild.dashboardCount,
        kpiCount: kpiDefinition.kpiCount,
        dataSourceCount: dataSourceMapping.sourceCount,
        testsPassed: dashboardTesting.passedTests
      }
    }
  });

  // Task 9: Train Stakeholders
  ctx.log('info', 'Phase 9: Creating training materials for stakeholders');
  const trainingMaterials = await ctx.task(stakeholderTrainingTask, {
    dashboardBuild,
    requirementsGathering,
    outputDir
  });
  artifacts.push(...trainingMaterials.artifacts);

  // Task 10: Maintain and Update
  ctx.log('info', 'Phase 10: Creating maintenance and update plan');
  const maintenancePlan = await ctx.task(maintenanceUpdateTask, {
    dashboardBuild,
    dataSourceMapping,
    outputDir
  });
  artifacts.push(...maintenancePlan.artifacts);

  // Task 11: Iterate Based on Feedback
  ctx.log('info', 'Phase 11: Creating feedback and iteration framework');
  const iterationFramework = await ctx.task(feedbackIterationTask, {
    dashboardBuild,
    requirementsGathering,
    outputDir
  });
  artifacts.push(...iterationFramework.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    marketingDashboards: dashboardBuild.dashboards,
    documentation: dashboardBuild.documentation,
    trainingMaterials: trainingMaterials.materials,
    alertConfigurations: alertSetup.alerts,
    kpiDefinitions: kpiDefinition.kpis,
    dataSourceIntegrations: dataSourceMapping.integrations,
    maintenancePlan: maintenancePlan.plan,
    iterationFramework: iterationFramework.framework,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/marketing-performance-dashboard',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const requirementsGatheringTask = defineTask('requirements-gathering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather dashboard requirements from stakeholders',
  agent: {
    name: 'requirements-analyst',
    prompt: {
      role: 'business intelligence analyst',
      task: 'Gather comprehensive dashboard requirements from stakeholders',
      context: args,
      instructions: [
        'Identify key stakeholders',
        'Document reporting needs by role',
        'Define data granularity requirements',
        'Identify refresh frequency needs',
        'Document drill-down requirements',
        'Define access control needs',
        'Document export requirements',
        'Create requirements specification'
      ],
      outputFormat: 'JSON with requirements, stakeholders, reportingNeeds, accessControl, specification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        stakeholders: { type: 'array', items: { type: 'object' } },
        reportingNeeds: { type: 'object' },
        accessControl: { type: 'object' },
        specification: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dashboards', 'requirements']
}));

export const kpiDefinitionTask = defineTask('kpi-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define KPIs and metrics to track',
  agent: {
    name: 'kpi-specialist',
    prompt: {
      role: 'marketing analytics specialist',
      task: 'Define KPIs and metrics for marketing dashboards',
      context: args,
      instructions: [
        'Define primary marketing KPIs',
        'Create metric calculation formulas',
        'Set benchmark targets',
        'Define metric hierarchies',
        'Create metric glossary',
        'Document data dependencies',
        'Define comparison periods',
        'Create KPI documentation'
      ],
      outputFormat: 'JSON with kpis, kpiCount, formulas, benchmarks, glossary, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'kpiCount', 'artifacts'],
      properties: {
        kpis: { type: 'array', items: { type: 'object' } },
        kpiCount: { type: 'number' },
        formulas: { type: 'object' },
        benchmarks: { type: 'object' },
        glossary: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dashboards', 'kpis', 'metrics']
}));

export const dataSourceMappingTask = defineTask('data-source-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify data sources and integrations',
  agent: {
    name: 'data-integration-specialist',
    prompt: {
      role: 'data integration specialist',
      task: 'Map data sources and configure integrations',
      context: args,
      instructions: [
        'Inventory available data sources',
        'Map metrics to data sources',
        'Plan data integration approach',
        'Configure data connectors',
        'Define data transformation rules',
        'Plan data quality checks',
        'Document integration architecture',
        'Create data dictionary'
      ],
      outputFormat: 'JSON with integrations, sourceCount, dataMapping, connectors, transformations, dataDictionary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['integrations', 'sourceCount', 'artifacts'],
      properties: {
        integrations: { type: 'array', items: { type: 'object' } },
        sourceCount: { type: 'number' },
        dataMapping: { type: 'object' },
        connectors: { type: 'array', items: { type: 'object' } },
        transformations: { type: 'object' },
        dataDictionary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dashboards', 'data-sources', 'integration']
}));

export const dashboardDesignTask = defineTask('dashboard-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design dashboard layout and visualizations',
  agent: {
    name: 'dashboard-designer',
    prompt: {
      role: 'dashboard UX designer',
      task: 'Design dashboard layouts and visualization types',
      context: args,
      instructions: [
        'Design executive summary dashboard',
        'Create channel-specific views',
        'Design drill-down navigation',
        'Select appropriate visualizations',
        'Design mobile-friendly layouts',
        'Create filter designs',
        'Plan interactive elements',
        'Document design specifications'
      ],
      outputFormat: 'JSON with designs, layouts, visualizations, navigation, specifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['designs', 'artifacts'],
      properties: {
        designs: { type: 'array', items: { type: 'object' } },
        layouts: { type: 'object' },
        visualizations: { type: 'array', items: { type: 'object' } },
        navigation: { type: 'object' },
        specifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dashboards', 'design', 'visualization']
}));

export const dashboardBuildTask = defineTask('dashboard-build', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build dashboards in BI platform',
  agent: {
    name: 'dashboard-builder',
    prompt: {
      role: 'BI developer',
      task: 'Build dashboards in business intelligence platform',
      context: args,
      instructions: [
        'Set up dashboard workspace',
        'Connect data sources',
        'Build data models',
        'Create visualizations',
        'Implement filters and controls',
        'Configure permissions',
        'Optimize performance',
        'Document dashboard build'
      ],
      outputFormat: 'JSON with dashboards, dashboardCount, dataModels, permissions, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboards', 'dashboardCount', 'documentation', 'artifacts'],
      properties: {
        dashboards: { type: 'array', items: { type: 'object' } },
        dashboardCount: { type: 'number' },
        dataModels: { type: 'array', items: { type: 'object' } },
        permissions: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dashboards', 'build', 'bi-platform']
}));

export const refreshConfigurationTask = defineTask('refresh-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure data refresh schedules',
  agent: {
    name: 'refresh-specialist',
    prompt: {
      role: 'data refresh specialist',
      task: 'Configure data refresh schedules and automation',
      context: args,
      instructions: [
        'Define refresh frequencies',
        'Configure incremental refreshes',
        'Set up refresh schedules',
        'Configure failure handling',
        'Set up refresh monitoring',
        'Optimize refresh performance',
        'Document refresh configuration',
        'Create refresh documentation'
      ],
      outputFormat: 'JSON with configuration, schedules, monitoring, failureHandling, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        schedules: { type: 'array', items: { type: 'object' } },
        monitoring: { type: 'object' },
        failureHandling: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dashboards', 'refresh', 'scheduling']
}));

export const alertSetupTask = defineTask('alert-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up alerts and anomaly detection',
  agent: {
    name: 'alert-specialist',
    prompt: {
      role: 'analytics alert specialist',
      task: 'Configure alerts and anomaly detection for dashboards',
      context: args,
      instructions: [
        'Define alert thresholds',
        'Configure metric alerts',
        'Set up anomaly detection',
        'Configure alert routing',
        'Define alert frequency',
        'Set up escalation rules',
        'Test alert functionality',
        'Document alert configuration'
      ],
      outputFormat: 'JSON with alerts, thresholds, anomalyDetection, routing, escalation, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alerts', 'artifacts'],
      properties: {
        alerts: { type: 'array', items: { type: 'object' } },
        thresholds: { type: 'object' },
        anomalyDetection: { type: 'object' },
        routing: { type: 'object' },
        escalation: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dashboards', 'alerts', 'anomaly-detection']
}));

export const dashboardTestingTask = defineTask('dashboard-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test dashboard accuracy and performance',
  agent: {
    name: 'dashboard-tester',
    prompt: {
      role: 'BI QA specialist',
      task: 'Test dashboard accuracy and performance',
      context: args,
      instructions: [
        'Validate data accuracy',
        'Test calculation formulas',
        'Verify filter functionality',
        'Test cross-filtering',
        'Measure load performance',
        'Test mobile responsiveness',
        'Verify permissions',
        'Document test results'
      ],
      outputFormat: 'JSON with results, passedTests, totalTests, issues, performance, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'passedTests', 'totalTests', 'artifacts'],
      properties: {
        results: { type: 'array', items: { type: 'object' } },
        passedTests: { type: 'number' },
        totalTests: { type: 'number' },
        issues: { type: 'array', items: { type: 'object' } },
        performance: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dashboards', 'testing', 'qa']
}));

export const stakeholderTrainingTask = defineTask('stakeholder-training', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create training materials for stakeholders',
  agent: {
    name: 'training-developer',
    prompt: {
      role: 'training materials developer',
      task: 'Create dashboard training materials for stakeholders',
      context: args,
      instructions: [
        'Create user guides',
        'Develop training videos outlines',
        'Create quick reference cards',
        'Develop FAQ documentation',
        'Plan training sessions',
        'Create self-service resources',
        'Document common use cases',
        'Create onboarding materials'
      ],
      outputFormat: 'JSON with materials, userGuides, trainingPlan, faqs, useCases, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['materials', 'artifacts'],
      properties: {
        materials: { type: 'array', items: { type: 'object' } },
        userGuides: { type: 'array', items: { type: 'object' } },
        trainingPlan: { type: 'object' },
        faqs: { type: 'array', items: { type: 'object' } },
        useCases: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dashboards', 'training', 'documentation']
}));

export const maintenanceUpdateTask = defineTask('maintenance-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create maintenance and update plan',
  agent: {
    name: 'maintenance-planner',
    prompt: {
      role: 'dashboard maintenance specialist',
      task: 'Create maintenance and update plan for dashboards',
      context: args,
      instructions: [
        'Define maintenance schedule',
        'Plan regular reviews',
        'Create update procedures',
        'Define change management',
        'Plan version control',
        'Set up monitoring',
        'Create backup procedures',
        'Document maintenance plan'
      ],
      outputFormat: 'JSON with plan, schedule, procedures, changeManagement, monitoring, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        schedule: { type: 'object' },
        procedures: { type: 'object' },
        changeManagement: { type: 'object' },
        monitoring: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dashboards', 'maintenance']
}));

export const feedbackIterationTask = defineTask('feedback-iteration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create feedback and iteration framework',
  agent: {
    name: 'iteration-specialist',
    prompt: {
      role: 'dashboard optimization specialist',
      task: 'Create framework for ongoing feedback and iteration',
      context: args,
      instructions: [
        'Create feedback collection process',
        'Define iteration cadence',
        'Plan enhancement prioritization',
        'Create request tracking system',
        'Define success metrics',
        'Plan usage analytics',
        'Create improvement roadmap',
        'Document iteration playbook'
      ],
      outputFormat: 'JSON with framework, feedbackProcess, prioritization, roadmap, successMetrics, playbook, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        feedbackProcess: { type: 'object' },
        prioritization: { type: 'object' },
        roadmap: { type: 'object' },
        successMetrics: { type: 'object' },
        playbook: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'dashboards', 'feedback', 'iteration']
}));
