/**
 * @process specializations/domains/business/decision-intelligence/executive-dashboard-development
 * @description Executive Dashboard Development - Design and implementation of executive-level dashboards
 * displaying KPIs, strategic metrics, and performance indicators with drill-down capabilities and alerting.
 * @inputs { projectName: string, businessObjectives: array, stakeholders: array, existingDataSources?: array, kpiRequirements?: object }
 * @outputs { success: boolean, dashboardDesign: object, kpiFramework: object, implementationPlan: object, alertingConfig: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/executive-dashboard-development', {
 *   projectName: 'CEO Strategic Dashboard',
 *   businessObjectives: ['Revenue Growth', 'Market Share', 'Customer Satisfaction'],
 *   stakeholders: ['CEO', 'CFO', 'COO'],
 *   kpiRequirements: { updateFrequency: 'daily', drillDownLevels: 3 }
 * });
 *
 * @references
 * - Storytelling with Data: https://www.storytellingwithdata.com/books
 * - Information Dashboard Design: Stephen Few
 * - Gartner BI Magic Quadrant: https://www.gartner.com/en/information-technology/glossary/business-intelligence-bi
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    businessObjectives = [],
    stakeholders = [],
    existingDataSources = [],
    kpiRequirements = {},
    outputDir = 'executive-dashboard-output'
  } = inputs;

  // Phase 1: Stakeholder Requirements Analysis
  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    projectName,
    businessObjectives,
    stakeholders,
    kpiRequirements
  });

  // Quality Gate: Requirements must be clearly defined
  if (!requirementsAnalysis.requirements || requirementsAnalysis.requirements.length === 0) {
    return {
      success: false,
      error: 'Dashboard requirements not clearly defined',
      phase: 'requirements-analysis',
      dashboardDesign: null
    };
  }

  // Breakpoint: Review requirements with stakeholders
  await ctx.breakpoint({
    question: `Review dashboard requirements for ${projectName}. Are these aligned with executive needs?`,
    title: 'Dashboard Requirements Review',
    context: {
      runId: ctx.runId,
      projectName,
      requirements: requirementsAnalysis.requirements,
      stakeholderNeeds: requirementsAnalysis.stakeholderNeeds
    }
  });

  // Phase 2: KPI Framework Definition
  const kpiFramework = await ctx.task(kpiFrameworkDefinitionTask, {
    projectName,
    businessObjectives,
    requirements: requirementsAnalysis.requirements,
    existingDataSources
  });

  // Phase 3: Data Source Assessment
  const dataSourceAssessment = await ctx.task(dataSourceAssessmentTask, {
    projectName,
    kpiFramework,
    existingDataSources,
    requirements: requirementsAnalysis.requirements
  });

  // Phase 4: Dashboard Architecture Design
  const dashboardArchitecture = await ctx.task(dashboardArchitectureTask, {
    projectName,
    kpiFramework,
    dataSourceAssessment,
    stakeholders,
    kpiRequirements
  });

  // Phase 5: Visual Design Specification
  const visualDesign = await ctx.task(visualDesignTask, {
    projectName,
    dashboardArchitecture,
    kpiFramework,
    stakeholders
  });

  // Phase 6: Drill-Down Configuration
  const drillDownConfig = await ctx.task(drillDownConfigurationTask, {
    projectName,
    dashboardArchitecture,
    kpiFramework,
    dataSourceAssessment
  });

  // Phase 7: Alerting and Notification Setup
  const alertingConfig = await ctx.task(alertingConfigurationTask, {
    projectName,
    kpiFramework,
    stakeholders,
    dashboardArchitecture
  });

  // Phase 8: Implementation Plan
  const implementationPlan = await ctx.task(implementationPlanTask, {
    projectName,
    dashboardArchitecture,
    visualDesign,
    drillDownConfig,
    alertingConfig,
    dataSourceAssessment
  });

  // Final Breakpoint: Approval
  await ctx.breakpoint({
    question: `Executive Dashboard design complete for ${projectName}. Ready for implementation?`,
    title: 'Dashboard Design Approval',
    context: {
      runId: ctx.runId,
      projectName,
      kpiCount: kpiFramework.kpis?.length || 0,
      dashboardSections: dashboardArchitecture.sections?.length || 0,
      alertCount: alertingConfig.alerts?.length || 0
    }
  });

  return {
    success: true,
    projectName,
    dashboardDesign: {
      architecture: dashboardArchitecture,
      visualDesign,
      drillDownConfig
    },
    kpiFramework,
    dataSourceAssessment,
    alertingConfig,
    implementationPlan,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/executive-dashboard-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Executive Dashboard Requirements Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Business Intelligence Consultant specializing in executive dashboards',
      task: 'Analyze stakeholder requirements and business objectives for executive dashboard development',
      context: {
        projectName: args.projectName,
        businessObjectives: args.businessObjectives,
        stakeholders: args.stakeholders,
        kpiRequirements: args.kpiRequirements
      },
      instructions: [
        '1. Interview stakeholders to understand their decision-making needs',
        '2. Identify key questions executives need answered daily/weekly/monthly',
        '3. Map business objectives to measurable outcomes',
        '4. Define dashboard access requirements and security levels',
        '5. Determine refresh frequency and real-time data needs',
        '6. Identify mobile and remote access requirements',
        '7. Document user personas and their specific needs',
        '8. Define success criteria for the dashboard implementation'
      ],
      outputFormat: 'JSON object with structured requirements analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'stakeholderNeeds'],
      properties: {
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              stakeholder: { type: 'string' },
              category: { type: 'string' }
            }
          }
        },
        stakeholderNeeds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              primaryQuestions: { type: 'array', items: { type: 'string' } },
              decisionTypes: { type: 'array', items: { type: 'string' } },
              accessFrequency: { type: 'string' }
            }
          }
        },
        securityRequirements: { type: 'array', items: { type: 'string' } },
        accessRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'dashboard', 'requirements-analysis']
}));

export const kpiFrameworkDefinitionTask = defineTask('kpi-framework-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `KPI Framework Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'KPI and Performance Management Expert',
      task: 'Define comprehensive KPI framework aligned with business objectives',
      context: {
        projectName: args.projectName,
        businessObjectives: args.businessObjectives,
        requirements: args.requirements,
        existingDataSources: args.existingDataSources
      },
      instructions: [
        '1. Map each business objective to specific, measurable KPIs',
        '2. Define leading and lagging indicators',
        '3. Establish KPI hierarchies (strategic, tactical, operational)',
        '4. Define calculation methodologies and data sources for each KPI',
        '5. Set benchmark targets and thresholds (red/yellow/green)',
        '6. Identify KPI interdependencies and correlations',
        '7. Define time periods and comparison baselines',
        '8. Create KPI documentation with business context'
      ],
      outputFormat: 'JSON object with comprehensive KPI framework'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'hierarchies', 'targets'],
      properties: {
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              calculation: { type: 'string' },
              dataSource: { type: 'string' },
              type: { type: 'string', enum: ['leading', 'lagging'] },
              level: { type: 'string', enum: ['strategic', 'tactical', 'operational'] },
              frequency: { type: 'string' }
            }
          }
        },
        hierarchies: { type: 'object' },
        targets: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              green: { type: 'number' },
              yellow: { type: 'number' },
              red: { type: 'number' }
            }
          }
        },
        dependencies: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'kpi', 'framework']
}));

export const dataSourceAssessmentTask = defineTask('data-source-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Source Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Engineering and Integration Specialist',
      task: 'Assess data sources for dashboard implementation',
      context: args,
      instructions: [
        '1. Inventory all required data sources for KPIs',
        '2. Assess data quality, availability, and reliability',
        '3. Identify data integration requirements and challenges',
        '4. Define ETL/ELT pipeline requirements',
        '5. Evaluate real-time vs batch processing needs',
        '6. Identify data governance and compliance requirements',
        '7. Assess data latency and freshness requirements',
        '8. Recommend data architecture improvements'
      ],
      outputFormat: 'JSON object with data source assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['dataSources', 'integrationRequirements', 'dataQuality'],
      properties: {
        dataSources: { type: 'array' },
        integrationRequirements: { type: 'object' },
        dataQuality: { type: 'object' },
        pipelineRequirements: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'data-assessment', 'integration']
}));

export const dashboardArchitectureTask = defineTask('dashboard-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dashboard Architecture Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dashboard Architecture and UX Expert',
      task: 'Design executive dashboard information architecture',
      context: args,
      instructions: [
        '1. Define dashboard sections and layout structure',
        '2. Organize KPIs into logical groupings',
        '3. Design navigation and information hierarchy',
        '4. Plan drill-down paths and progressive disclosure',
        '5. Define interactivity and filter capabilities',
        '6. Design for different screen sizes and devices',
        '7. Plan caching and performance optimization',
        '8. Define user personalization options'
      ],
      outputFormat: 'JSON object with dashboard architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['sections', 'layout', 'navigation'],
      properties: {
        sections: { type: 'array' },
        layout: { type: 'object' },
        navigation: { type: 'object' },
        interactivity: { type: 'object' },
        personalization: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'dashboard', 'architecture']
}));

export const visualDesignTask = defineTask('visual-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Visual Design Specification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Visualization and Dashboard Design Expert',
      task: 'Create visual design specifications for executive dashboard',
      context: args,
      instructions: [
        '1. Select appropriate chart types for each KPI',
        '2. Define color palette and visual hierarchy',
        '3. Design consistent styling and branding',
        '4. Apply data visualization best practices',
        '5. Design status indicators and alert visualizations',
        '6. Create mockups for key dashboard views',
        '7. Define animation and transition specifications',
        '8. Ensure accessibility compliance'
      ],
      outputFormat: 'JSON object with visual design specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['chartSpecifications', 'colorPalette', 'styleGuide'],
      properties: {
        chartSpecifications: { type: 'array' },
        colorPalette: { type: 'object' },
        styleGuide: { type: 'object' },
        mockups: { type: 'array' },
        accessibilityCompliance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'visualization', 'design']
}));

export const drillDownConfigurationTask = defineTask('drill-down-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Drill-Down Configuration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Intelligence Analyst',
      task: 'Configure drill-down paths and analytical capabilities',
      context: args,
      instructions: [
        '1. Define drill-down hierarchies for each KPI',
        '2. Map drill paths from strategic to operational views',
        '3. Configure cross-filtering relationships',
        '4. Define slice-and-dice dimensions',
        '5. Set up comparative analysis capabilities',
        '6. Configure trend analysis and time comparisons',
        '7. Define export and sharing capabilities',
        '8. Plan for ad-hoc analysis requirements'
      ],
      outputFormat: 'JSON object with drill-down configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['drillHierarchies', 'crossFilters', 'dimensions'],
      properties: {
        drillHierarchies: { type: 'array' },
        crossFilters: { type: 'object' },
        dimensions: { type: 'array' },
        comparativeAnalysis: { type: 'object' },
        exportOptions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'drill-down', 'analytics']
}));

export const alertingConfigurationTask = defineTask('alerting-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Alerting and Notification Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Alerting and Notification Systems Specialist',
      task: 'Configure alerting and notification system for executive dashboard',
      context: args,
      instructions: [
        '1. Define alert triggers based on KPI thresholds',
        '2. Configure alert severity levels and escalation paths',
        '3. Set up notification channels (email, SMS, push, Slack)',
        '4. Define alert grouping and suppression rules',
        '5. Configure alert acknowledgment and resolution workflows',
        '6. Set up scheduled report delivery',
        '7. Define exception-based alerting patterns',
        '8. Plan alert fatigue mitigation strategies'
      ],
      outputFormat: 'JSON object with alerting configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['alerts', 'notificationChannels', 'escalationPaths'],
      properties: {
        alerts: { type: 'array' },
        notificationChannels: { type: 'array' },
        escalationPaths: { type: 'object' },
        scheduledReports: { type: 'array' },
        suppressionRules: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'alerting', 'notifications']
}));

export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implementation Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'BI Project Manager and Implementation Lead',
      task: 'Create detailed implementation plan for executive dashboard',
      context: args,
      instructions: [
        '1. Define implementation phases and milestones',
        '2. Create detailed task breakdown and dependencies',
        '3. Estimate effort and timeline for each phase',
        '4. Identify resource requirements and skill needs',
        '5. Define testing and validation approach',
        '6. Plan user training and change management',
        '7. Define rollout strategy (pilot, phased, big bang)',
        '8. Create risk mitigation and contingency plans'
      ],
      outputFormat: 'JSON object with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'resources'],
      properties: {
        phases: { type: 'array' },
        timeline: { type: 'object' },
        resources: { type: 'object' },
        testingPlan: { type: 'object' },
        trainingPlan: { type: 'object' },
        rolloutStrategy: { type: 'object' },
        riskMitigation: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'implementation', 'planning']
}));
