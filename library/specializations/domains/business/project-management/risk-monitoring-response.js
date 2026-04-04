/**
 * @process specializations/domains/business/project-management/risk-monitoring-response
 * @description Risk Monitoring and Response Execution - Monitor identified risks, track risk triggers,
 * execute response plans, and continuously assess emerging risks throughout the project.
 * @inputs { projectName: string, riskRegister: array, responseStrategies: array, triggers: array }
 * @outputs { success: boolean, monitoringPlan: object, responseActions: array, riskStatus: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/risk-monitoring-response', {
 *   projectName: 'System Integration',
 *   riskRegister: [{ id: 'R001', title: 'Vendor delay', probability: 0.4, impact: 0.8 }],
 *   responseStrategies: [{ riskId: 'R001', strategy: 'mitigate', actions: [...] }],
 *   triggers: [{ riskId: 'R001', condition: 'Delivery > 5 days late' }]
 * });
 *
 * @references
 * - PMI Risk Management: https://www.pmi.org/pmbok-guide-standards/foundational/pmbok
 * - ISO 31000 Risk Management: https://www.iso.org/iso-31000-risk-management.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    riskRegister = [],
    responseStrategies = [],
    triggers = [],
    monitoringFrequency = 'weekly',
    stakeholders = []
  } = inputs;

  // Phase 1: Risk Monitoring Framework
  const monitoringFramework = await ctx.task(riskMonitoringFrameworkTask, {
    projectName,
    riskRegister,
    monitoringFrequency
  });

  // Phase 2: Trigger Monitoring Setup
  const triggerMonitoring = await ctx.task(triggerMonitoringTask, {
    projectName,
    riskRegister,
    triggers,
    framework: monitoringFramework
  });

  // Phase 3: Risk Status Assessment
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    projectName,
    riskRegister,
    triggers,
    currentStatus: {}
  });

  // Breakpoint: Review triggered risks
  const triggeredRisks = riskAssessment.triggeredRisks || [];
  if (triggeredRisks.length > 0) {
    await ctx.breakpoint({
      question: `${triggeredRisks.length} risks triggered for ${projectName}. Review and authorize response execution?`,
      title: 'Triggered Risk Review',
      context: {
        runId: ctx.runId,
        triggeredCount: triggeredRisks.length,
        files: [{
          path: `artifacts/triggered-risks.json`,
          format: 'json',
          content: triggeredRisks
        }]
      }
    });
  }

  // Phase 4: Response Execution Planning
  const responseExecution = await ctx.task(responseExecutionTask, {
    projectName,
    triggeredRisks,
    responseStrategies
  });

  // Phase 5: Emerging Risk Identification
  const emergingRisks = await ctx.task(emergingRiskTask, {
    projectName,
    riskRegister,
    projectStatus: riskAssessment.projectStatus
  });

  // Phase 6: Risk Register Update
  const registerUpdate = await ctx.task(registerUpdateTask, {
    projectName,
    riskRegister,
    triggeredRisks,
    emergingRisks,
    responseExecution
  });

  // Phase 7: Risk Metrics and Trending
  const riskMetrics = await ctx.task(riskMetricsTask, {
    projectName,
    riskRegister: registerUpdate.updatedRegister,
    historicalData: riskAssessment.historicalData
  });

  // Phase 8: Risk Reporting
  const riskReporting = await ctx.task(riskReportingTask, {
    projectName,
    riskAssessment,
    responseExecution,
    emergingRisks,
    metrics: riskMetrics,
    stakeholders
  });

  // Phase 9: Risk Documentation
  const riskDocumentation = await ctx.task(riskDocumentationTask, {
    projectName,
    monitoringFramework,
    riskAssessment,
    responseExecution,
    emergingRisks,
    metrics: riskMetrics,
    reporting: riskReporting
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Risk monitoring cycle complete for ${projectName}. ${registerUpdate.updatedRegister?.length || 0} risks tracked, ${emergingRisks.newRisks?.length || 0} new risks identified. Approve cycle completion?`,
    title: 'Risk Monitoring Approval',
    context: {
      runId: ctx.runId,
      projectName,
      files: [
        { path: `artifacts/risk-monitoring.json`, format: 'json', content: riskDocumentation },
        { path: `artifacts/risk-monitoring.md`, format: 'markdown', content: riskDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    monitoringPlan: monitoringFramework,
    riskStatus: riskAssessment,
    responseActions: responseExecution.executedResponses,
    emergingRisks: emergingRisks.newRisks,
    updatedRegister: registerUpdate.updatedRegister,
    metrics: riskMetrics,
    documentation: riskDocumentation,
    metadata: {
      processId: 'specializations/domains/business/project-management/risk-monitoring-response',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const riskMonitoringFrameworkTask = defineTask('risk-monitoring-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Risk Monitoring Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Manager',
      task: 'Establish risk monitoring framework',
      context: {
        projectName: args.projectName,
        riskRegister: args.riskRegister,
        monitoringFrequency: args.monitoringFrequency
      },
      instructions: [
        '1. Define monitoring objectives',
        '2. Establish monitoring schedule',
        '3. Define key risk indicators (KRIs)',
        '4. Create monitoring checklists',
        '5. Define data collection methods',
        '6. Establish reporting frequency',
        '7. Define escalation criteria',
        '8. Assign monitoring responsibilities',
        '9. Create monitoring dashboard design',
        '10. Compile monitoring framework'
      ],
      outputFormat: 'JSON object with monitoring framework'
    },
    outputSchema: {
      type: 'object',
      required: ['framework'],
      properties: {
        framework: { type: 'object' },
        schedule: { type: 'object' },
        kris: { type: 'array' },
        checklists: { type: 'array' },
        responsibilities: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'monitoring', 'framework']
}));

export const triggerMonitoringTask = defineTask('trigger-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Trigger Monitoring - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Analyst',
      task: 'Set up risk trigger monitoring',
      context: {
        projectName: args.projectName,
        riskRegister: args.riskRegister,
        triggers: args.triggers,
        framework: args.framework
      },
      instructions: [
        '1. Map triggers to risks',
        '2. Define trigger thresholds',
        '3. Create trigger alerts',
        '4. Establish monitoring methods',
        '5. Define data sources',
        '6. Set up automated tracking',
        '7. Create trigger dashboard',
        '8. Define notification process',
        '9. Document trigger procedures',
        '10. Compile trigger monitoring plan'
      ],
      outputFormat: 'JSON object with trigger monitoring setup'
    },
    outputSchema: {
      type: 'object',
      required: ['triggerMonitoring'],
      properties: {
        triggerMonitoring: { type: 'object' },
        triggerMap: { type: 'array' },
        alerts: { type: 'array' },
        dataSources: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'trigger', 'monitoring']
}));

export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Risk Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Assessor',
      task: 'Assess current risk status',
      context: {
        projectName: args.projectName,
        riskRegister: args.riskRegister,
        triggers: args.triggers,
        currentStatus: args.currentStatus
      },
      instructions: [
        '1. Review each risk',
        '2. Check trigger conditions',
        '3. Update probability assessments',
        '4. Update impact assessments',
        '5. Calculate risk scores',
        '6. Identify triggered risks',
        '7. Assess risk trends',
        '8. Document status changes',
        '9. Flag critical risks',
        '10. Compile assessment results'
      ],
      outputFormat: 'JSON object with risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['riskStatuses', 'triggeredRisks'],
      properties: {
        riskStatuses: { type: 'array' },
        triggeredRisks: { type: 'array' },
        criticalRisks: { type: 'array' },
        trends: { type: 'object' },
        projectStatus: { type: 'object' },
        historicalData: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'assessment', 'status']
}));

export const responseExecutionTask = defineTask('response-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Response Execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Response Coordinator',
      task: 'Plan response execution for triggered risks',
      context: {
        projectName: args.projectName,
        triggeredRisks: args.triggeredRisks,
        responseStrategies: args.responseStrategies
      },
      instructions: [
        '1. Match triggered risks to responses',
        '2. Activate response plans',
        '3. Assign response owners',
        '4. Set execution timeline',
        '5. Allocate resources',
        '6. Define success criteria',
        '7. Plan contingency actions',
        '8. Coordinate stakeholders',
        '9. Track execution progress',
        '10. Document execution plan'
      ],
      outputFormat: 'JSON object with response execution plan'
    },
    outputSchema: {
      type: 'object',
      required: ['executedResponses'],
      properties: {
        executedResponses: { type: 'array' },
        executionTimeline: { type: 'object' },
        resourceAllocation: { type: 'array' },
        contingencyActions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'response', 'execution']
}));

export const emergingRiskTask = defineTask('emerging-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Emerging Risks - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Identifier',
      task: 'Identify emerging risks',
      context: {
        projectName: args.projectName,
        riskRegister: args.riskRegister,
        projectStatus: args.projectStatus
      },
      instructions: [
        '1. Analyze project environment',
        '2. Review recent changes',
        '3. Assess external factors',
        '4. Identify new threats',
        '5. Identify new opportunities',
        '6. Assess secondary risks',
        '7. Evaluate residual risks',
        '8. Document new risks',
        '9. Perform initial assessment',
        '10. Recommend response strategies'
      ],
      outputFormat: 'JSON object with emerging risks'
    },
    outputSchema: {
      type: 'object',
      required: ['newRisks'],
      properties: {
        newRisks: { type: 'array' },
        threats: { type: 'array' },
        opportunities: { type: 'array' },
        secondaryRisks: { type: 'array' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'emerging', 'identification']
}));

export const registerUpdateTask = defineTask('register-update', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Register Update - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Administrator',
      task: 'Update risk register',
      context: {
        projectName: args.projectName,
        riskRegister: args.riskRegister,
        triggeredRisks: args.triggeredRisks,
        emergingRisks: args.emergingRisks,
        responseExecution: args.responseExecution
      },
      instructions: [
        '1. Update risk statuses',
        '2. Add new risks',
        '3. Close resolved risks',
        '4. Update assessments',
        '5. Record response actions',
        '6. Update risk owners',
        '7. Revise response plans',
        '8. Document lessons learned',
        '9. Archive closed risks',
        '10. Compile updated register'
      ],
      outputFormat: 'JSON object with updated register'
    },
    outputSchema: {
      type: 'object',
      required: ['updatedRegister'],
      properties: {
        updatedRegister: { type: 'array' },
        addedRisks: { type: 'array' },
        closedRisks: { type: 'array' },
        changes: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'register', 'update']
}));

export const riskMetricsTask = defineTask('risk-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Risk Metrics - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Analyst',
      task: 'Calculate risk metrics and trends',
      context: {
        projectName: args.projectName,
        riskRegister: args.riskRegister,
        historicalData: args.historicalData
      },
      instructions: [
        '1. Calculate total risk exposure',
        '2. Compute risk scores',
        '3. Analyze risk trends',
        '4. Calculate response effectiveness',
        '5. Measure KRI performance',
        '6. Compare to baselines',
        '7. Identify patterns',
        '8. Create visualizations',
        '9. Generate insights',
        '10. Compile metrics report'
      ],
      outputFormat: 'JSON object with risk metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics'],
      properties: {
        metrics: { type: 'object' },
        totalExposure: { type: 'number' },
        trends: { type: 'object' },
        kriPerformance: { type: 'array' },
        insights: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'metrics', 'analytics']
}));

export const riskReportingTask = defineTask('risk-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Risk Reporting - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Reporter',
      task: 'Generate risk reports',
      context: {
        projectName: args.projectName,
        riskAssessment: args.riskAssessment,
        responseExecution: args.responseExecution,
        emergingRisks: args.emergingRisks,
        metrics: args.metrics,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Create executive summary',
        '2. Generate detailed status report',
        '3. Create risk heat map',
        '4. Summarize triggered risks',
        '5. Report response status',
        '6. Highlight emerging risks',
        '7. Present metrics dashboard',
        '8. Add recommendations',
        '9. Tailor for stakeholders',
        '10. Compile report package'
      ],
      outputFormat: 'JSON object with risk reports'
    },
    outputSchema: {
      type: 'object',
      required: ['reports'],
      properties: {
        reports: { type: 'object' },
        executiveSummary: { type: 'string' },
        detailedReport: { type: 'object' },
        heatMap: { type: 'object' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'reporting', 'stakeholder']
}));

export const riskDocumentationTask = defineTask('risk-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Risk Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation Specialist',
      task: 'Compile risk monitoring documentation',
      context: {
        projectName: args.projectName,
        monitoringFramework: args.monitoringFramework,
        riskAssessment: args.riskAssessment,
        responseExecution: args.responseExecution,
        emergingRisks: args.emergingRisks,
        metrics: args.metrics,
        reporting: args.reporting
      },
      instructions: [
        '1. Compile all documentation',
        '2. Create monitoring summary',
        '3. Document all changes',
        '4. Generate markdown report',
        '5. Add lessons learned',
        '6. Include recommendations',
        '7. Create appendices',
        '8. Add visualizations',
        '9. Document version control',
        '10. Finalize documentation'
      ],
      outputFormat: 'JSON object with risk documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'markdown'],
      properties: {
        documentation: { type: 'object' },
        markdown: { type: 'string' },
        lessonsLearned: { type: 'array' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['risk', 'documentation', 'deliverable']
}));
