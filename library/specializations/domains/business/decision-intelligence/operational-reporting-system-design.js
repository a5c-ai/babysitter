/**
 * @process specializations/domains/business/decision-intelligence/operational-reporting-system-design
 * @description Operational Reporting System Design - Development of automated operational reporting systems
 * including data pipelines, report templates, distribution schedules, and exception alerting.
 * @inputs { projectName: string, operationalAreas: array, reportingRequirements: object, existingSystems?: array, stakeholders?: array }
 * @outputs { success: boolean, reportingArchitecture: object, dataFlows: object, reportCatalog: array, distributionPlan: object, alertingConfig: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/operational-reporting-system-design', {
 *   projectName: 'Supply Chain Operational Reporting',
 *   operationalAreas: ['Inventory', 'Fulfillment', 'Logistics', 'Quality'],
 *   reportingRequirements: { frequency: 'daily', format: 'PDF', distribution: 'email' }
 * });
 *
 * @references
 * - Kimball Data Warehouse Toolkit: https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/books/
 * - Enterprise Reporting Best Practices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    operationalAreas = [],
    reportingRequirements = {},
    existingSystems = [],
    stakeholders = [],
    outputDir = 'operational-reporting-output'
  } = inputs;

  // Phase 1: Reporting Requirements Analysis
  const requirementsAnalysis = await ctx.task(reportingRequirementsTask, {
    projectName,
    operationalAreas,
    reportingRequirements,
    stakeholders
  });

  // Phase 2: Data Pipeline Architecture
  const pipelineArchitecture = await ctx.task(dataPipelineArchitectureTask, {
    projectName,
    requirementsAnalysis,
    existingSystems,
    operationalAreas
  });

  // Phase 3: Report Template Design
  const reportTemplates = await ctx.task(reportTemplateDesignTask, {
    projectName,
    requirementsAnalysis,
    operationalAreas
  });

  // Phase 4: Distribution and Scheduling
  const distributionPlan = await ctx.task(distributionSchedulingTask, {
    projectName,
    reportTemplates,
    stakeholders,
    reportingRequirements
  });

  // Phase 5: Exception Alerting Configuration
  const alertingConfig = await ctx.task(exceptionAlertingTask, {
    projectName,
    requirementsAnalysis,
    pipelineArchitecture,
    stakeholders
  });

  // Breakpoint: Review reporting system design
  await ctx.breakpoint({
    question: `Review operational reporting system design for ${projectName}. Ready for implementation?`,
    title: 'Reporting System Design Review',
    context: {
      runId: ctx.runId,
      projectName,
      reportCount: reportTemplates.reports?.length || 0,
      alertCount: alertingConfig.alerts?.length || 0
    }
  });

  // Phase 6: Implementation Plan
  const implementationPlan = await ctx.task(reportingImplementationTask, {
    projectName,
    pipelineArchitecture,
    reportTemplates,
    distributionPlan,
    alertingConfig
  });

  return {
    success: true,
    projectName,
    requirementsAnalysis,
    reportingArchitecture: pipelineArchitecture,
    dataFlows: pipelineArchitecture.dataFlows,
    reportCatalog: reportTemplates.reports,
    distributionPlan,
    alertingConfig,
    implementationPlan,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/operational-reporting-system-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const reportingRequirementsTask = defineTask('reporting-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reporting Requirements Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Business Intelligence Requirements Analyst',
      task: 'Analyze operational reporting requirements and stakeholder needs',
      context: args,
      instructions: [
        '1. Interview stakeholders to understand reporting needs',
        '2. Document report content requirements by operational area',
        '3. Define frequency and timing requirements',
        '4. Identify format and delivery preferences',
        '5. Document filter and parameter requirements',
        '6. Define drill-down and detail requirements',
        '7. Identify exception thresholds and alerts',
        '8. Prioritize reports by business criticality'
      ],
      outputFormat: 'JSON object with reporting requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'stakeholders', 'priorities'],
      properties: {
        reports: { type: 'array' },
        stakeholders: { type: 'array' },
        frequencies: { type: 'object' },
        formats: { type: 'array' },
        priorities: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'reporting', 'requirements']
}));

export const dataPipelineArchitectureTask = defineTask('data-pipeline-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Pipeline Architecture - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Engineering Architect',
      task: 'Design data pipeline architecture for operational reporting',
      context: args,
      instructions: [
        '1. Design end-to-end data flow architecture',
        '2. Define ETL/ELT processes and transformations',
        '3. Plan data staging and processing layers',
        '4. Design incremental and batch processing',
        '5. Plan data quality and validation checkpoints',
        '6. Define error handling and recovery procedures',
        '7. Design monitoring and observability',
        '8. Plan scalability and performance optimization'
      ],
      outputFormat: 'JSON object with pipeline architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'dataFlows', 'processes'],
      properties: {
        architecture: { type: 'object' },
        dataFlows: { type: 'array' },
        processes: { type: 'array' },
        validation: { type: 'object' },
        monitoring: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'reporting', 'data-pipeline']
}));

export const reportTemplateDesignTask = defineTask('report-template-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Report Template Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Report Design and Visualization Specialist',
      task: 'Design report templates for operational reporting',
      context: args,
      instructions: [
        '1. Design report layouts and structure',
        '2. Define data visualizations and charts',
        '3. Create consistent styling and branding',
        '4. Design parameterization and filtering',
        '5. Plan drill-through and linked reports',
        '6. Define conditional formatting rules',
        '7. Design summary and detail sections',
        '8. Create mobile-friendly report versions'
      ],
      outputFormat: 'JSON object with report templates'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'templates', 'visualizations'],
      properties: {
        reports: { type: 'array' },
        templates: { type: 'array' },
        visualizations: { type: 'array' },
        styling: { type: 'object' },
        parameters: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'reporting', 'templates']
}));

export const distributionSchedulingTask = defineTask('distribution-scheduling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Distribution and Scheduling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Report Distribution Specialist',
      task: 'Design report distribution and scheduling system',
      context: args,
      instructions: [
        '1. Define distribution channels (email, portal, API)',
        '2. Create scheduling configurations',
        '3. Design subscription management',
        '4. Plan burst reporting for large distributions',
        '5. Define access control and security',
        '6. Design archive and retention policies',
        '7. Plan delivery confirmation and tracking',
        '8. Define escalation for failed deliveries'
      ],
      outputFormat: 'JSON object with distribution plan'
    },
    outputSchema: {
      type: 'object',
      required: ['channels', 'schedules', 'subscriptions'],
      properties: {
        channels: { type: 'array' },
        schedules: { type: 'array' },
        subscriptions: { type: 'array' },
        security: { type: 'object' },
        retention: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'reporting', 'distribution']
}));

export const exceptionAlertingTask = defineTask('exception-alerting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Exception Alerting Configuration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Alerting and Monitoring Specialist',
      task: 'Design exception alerting system for operational reports',
      context: args,
      instructions: [
        '1. Define exception thresholds and triggers',
        '2. Design alert severity levels',
        '3. Configure notification channels',
        '4. Define escalation procedures',
        '5. Plan alert grouping and suppression',
        '6. Design acknowledgment workflows',
        '7. Create alert documentation and runbooks',
        '8. Plan alert effectiveness review process'
      ],
      outputFormat: 'JSON object with alerting configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['alerts', 'thresholds', 'escalation'],
      properties: {
        alerts: { type: 'array' },
        thresholds: { type: 'object' },
        escalation: { type: 'object' },
        notifications: { type: 'array' },
        suppression: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'reporting', 'alerting']
}));

export const reportingImplementationTask = defineTask('reporting-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reporting System Implementation Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'BI Implementation Project Manager',
      task: 'Create implementation plan for operational reporting system',
      context: args,
      instructions: [
        '1. Define implementation phases',
        '2. Create detailed task breakdown',
        '3. Identify dependencies and critical path',
        '4. Estimate resources and timeline',
        '5. Plan testing and validation',
        '6. Design user training program',
        '7. Create rollout and migration plan',
        '8. Define success criteria and metrics'
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
        testing: { type: 'object' },
        training: { type: 'object' },
        successCriteria: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'reporting', 'implementation']
}));
