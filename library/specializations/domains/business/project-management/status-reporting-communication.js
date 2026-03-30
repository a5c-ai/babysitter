/**
 * @process specializations/domains/business/project-management/status-reporting-communication
 * @description Status Reporting and Communication Management - Create and deliver project status reports,
 * dashboards, and communications tailored to different stakeholder audiences and needs.
 * @inputs { projectName: string, projectData: object, stakeholders: array, reportingPeriod: string }
 * @outputs { success: boolean, statusReport: object, dashboard: object, communications: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/status-reporting-communication', {
 *   projectName: 'Cloud Migration Program',
 *   projectData: { schedule: {...}, budget: {...}, risks: [...], milestones: [...] },
 *   stakeholders: [{ name: 'Executive Sponsor', type: 'executive' }, { name: 'PMO', type: 'management' }],
 *   reportingPeriod: 'Week 12'
 * });
 *
 * @references
 * - PMI Project Communications Management: https://www.pmi.org/learning/library/project-communications-management-plan-7948
 * - Effective Status Reporting: https://www.pmi.org/learning/library/project-status-reports-best-practices-5627
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    projectData,
    stakeholders = [],
    reportingPeriod,
    previousReports = [],
    communicationMatrix = {}
  } = inputs;

  // Phase 1: Data Collection and Validation
  const dataCollection = await ctx.task(dataCollectionTask, {
    projectName,
    projectData,
    reportingPeriod
  });

  // Quality Gate: Sufficient data for reporting
  if (!dataCollection.isComplete || dataCollection.completeness < 70) {
    await ctx.breakpoint({
      question: `Data collection only ${dataCollection.completeness}% complete for ${projectName}. Proceed with available data or gather more?`,
      title: 'Data Completeness Warning',
      context: {
        runId: ctx.runId,
        completeness: dataCollection.completeness,
        missingData: dataCollection.missingItems,
        recommendation: 'Gather missing data for accurate reporting'
      }
    });
  }

  // Phase 2: Progress Analysis
  const progressAnalysis = await ctx.task(progressAnalysisTask, {
    projectName,
    dataCollection,
    previousReports,
    reportingPeriod
  });

  // Breakpoint: Review progress analysis
  await ctx.breakpoint({
    question: `Progress analysis complete for ${projectName}. Overall health: ${progressAnalysis.overallHealth}. Review before generating reports?`,
    title: 'Progress Analysis Review',
    context: {
      runId: ctx.runId,
      projectName,
      health: progressAnalysis.overallHealth,
      scheduleStatus: progressAnalysis.scheduleStatus,
      budgetStatus: progressAnalysis.budgetStatus,
      files: [{
        path: `artifacts/phase2-progress-analysis.json`,
        format: 'json',
        content: progressAnalysis
      }]
    }
  });

  // Phase 3: Variance Analysis
  const varianceAnalysis = await ctx.task(varianceAnalysisTask, {
    projectName,
    progressAnalysis,
    projectData
  });

  // Phase 4: Risk and Issue Status
  const riskIssueStatus = await ctx.task(riskIssueStatusTask, {
    projectName,
    projectData,
    progressAnalysis
  });

  // Phase 5: Accomplishments and Next Steps
  const accomplishmentsNextSteps = await ctx.task(accomplishmentsNextStepsTask, {
    projectName,
    progressAnalysis,
    reportingPeriod
  });

  // Phase 6: Executive Summary Generation
  const executiveSummary = await ctx.task(executiveSummaryTask, {
    projectName,
    progressAnalysis,
    varianceAnalysis,
    riskIssueStatus,
    accomplishmentsNextSteps,
    reportingPeriod
  });

  // Phase 7: Detailed Status Report
  const detailedReport = await ctx.task(detailedStatusReportTask, {
    projectName,
    dataCollection,
    progressAnalysis,
    varianceAnalysis,
    riskIssueStatus,
    accomplishmentsNextSteps,
    reportingPeriod
  });

  // Phase 8: Dashboard Generation
  const dashboard = await ctx.task(dashboardGenerationTask, {
    projectName,
    progressAnalysis,
    varianceAnalysis,
    riskIssueStatus,
    projectData
  });

  // Phase 9: Stakeholder-Specific Communications
  const stakeholderCommunications = await ctx.task(stakeholderCommunicationsTask, {
    projectName,
    stakeholders,
    executiveSummary,
    detailedReport,
    progressAnalysis,
    communicationMatrix
  });

  // Phase 10: Report Compilation and Distribution Plan
  const reportCompilation = await ctx.task(reportCompilationTask, {
    projectName,
    executiveSummary,
    detailedReport,
    dashboard,
    stakeholderCommunications,
    reportingPeriod
  });

  // Final Quality Gate
  const completenessScore = reportCompilation.completenessScore || 0;
  const ready = completenessScore >= 80;

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Status reporting complete for ${projectName} - ${reportingPeriod}. Health: ${progressAnalysis.overallHealth}. Reports ready for distribution?`,
    title: 'Status Report Distribution Approval',
    context: {
      runId: ctx.runId,
      projectName,
      period: reportingPeriod,
      overallHealth: progressAnalysis.overallHealth,
      reportsGenerated: 3,
      files: [
        { path: `artifacts/status-report-${reportingPeriod}.json`, format: 'json', content: detailedReport },
        { path: `artifacts/status-report-${reportingPeriod}.md`, format: 'markdown', content: reportCompilation.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    reportingPeriod,
    completenessScore,
    ready,
    statusReport: {
      executiveSummary: executiveSummary.summary,
      detailedReport: detailedReport.report,
      markdown: reportCompilation.markdown,
      overallHealth: progressAnalysis.overallHealth
    },
    dashboard: {
      metrics: dashboard.metrics,
      charts: dashboard.charts,
      kpis: dashboard.kpis
    },
    communications: stakeholderCommunications.communications,
    analysis: {
      scheduleVariance: varianceAnalysis.scheduleVariance,
      costVariance: varianceAnalysis.costVariance,
      scopeStatus: progressAnalysis.scopeStatus,
      riskStatus: riskIssueStatus.overallRiskStatus
    },
    accomplishments: accomplishmentsNextSteps.accomplishments,
    nextSteps: accomplishmentsNextSteps.nextSteps,
    recommendations: reportCompilation.recommendations,
    metadata: {
      processId: 'specializations/domains/business/project-management/status-reporting-communication',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Data Collection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Controller',
      task: 'Collect and validate project data for status reporting',
      context: {
        projectName: args.projectName,
        projectData: args.projectData,
        reportingPeriod: args.reportingPeriod
      },
      instructions: [
        '1. Gather schedule performance data',
        '2. Collect cost and budget data',
        '3. Compile milestone status',
        '4. Gather risk and issue updates',
        '5. Collect resource utilization data',
        '6. Gather quality metrics',
        '7. Compile deliverable status',
        '8. Validate data accuracy',
        '9. Identify missing data items',
        '10. Calculate data completeness'
      ],
      outputFormat: 'JSON object with collected data'
    },
    outputSchema: {
      type: 'object',
      required: ['isComplete', 'completeness', 'data'],
      properties: {
        data: {
          type: 'object',
          properties: {
            schedule: { type: 'object' },
            budget: { type: 'object' },
            milestones: { type: 'array' },
            risks: { type: 'array' },
            issues: { type: 'array' },
            resources: { type: 'object' },
            quality: { type: 'object' },
            deliverables: { type: 'array' }
          }
        },
        isComplete: { type: 'boolean' },
        completeness: { type: 'number', minimum: 0, maximum: 100 },
        missingItems: { type: 'array', items: { type: 'string' } },
        dataQuality: { type: 'string', enum: ['high', 'medium', 'low'] }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reporting', 'data-collection', 'status']
}));

export const progressAnalysisTask = defineTask('progress-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Progress Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Analyst',
      task: 'Analyze overall project progress',
      context: {
        projectName: args.projectName,
        dataCollection: args.dataCollection,
        previousReports: args.previousReports,
        reportingPeriod: args.reportingPeriod
      },
      instructions: [
        '1. Calculate schedule performance index (SPI)',
        '2. Calculate cost performance index (CPI)',
        '3. Assess milestone achievement rate',
        '4. Evaluate scope completion percentage',
        '5. Analyze trend from previous periods',
        '6. Determine overall project health (RAG)',
        '7. Identify areas of concern',
        '8. Assess team performance',
        '9. Evaluate stakeholder satisfaction',
        '10. Summarize progress narrative'
      ],
      outputFormat: 'JSON object with progress analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['overallHealth', 'scheduleStatus', 'budgetStatus'],
      properties: {
        overallHealth: { type: 'string', enum: ['green', 'yellow', 'red'] },
        scheduleStatus: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['on-track', 'at-risk', 'behind'] },
            spi: { type: 'number' },
            percentComplete: { type: 'number' },
            daysVariance: { type: 'number' }
          }
        },
        budgetStatus: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['on-track', 'at-risk', 'over-budget'] },
            cpi: { type: 'number' },
            percentSpent: { type: 'number' },
            costVariance: { type: 'number' }
          }
        },
        scopeStatus: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            deliverablesComplete: { type: 'number' },
            deliverablesTotal: { type: 'number' }
          }
        },
        milestoneStatus: {
          type: 'object',
          properties: {
            achieved: { type: 'number' },
            upcoming: { type: 'number' },
            atRisk: { type: 'number' }
          }
        },
        trend: { type: 'string', enum: ['improving', 'stable', 'declining'] },
        areasOfConcern: { type: 'array', items: { type: 'string' } },
        progressNarrative: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reporting', 'progress', 'analysis']
}));

export const varianceAnalysisTask = defineTask('variance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Variance Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Controller',
      task: 'Analyze schedule and cost variances',
      context: {
        projectName: args.projectName,
        progressAnalysis: args.progressAnalysis,
        projectData: args.projectData
      },
      instructions: [
        '1. Calculate schedule variance (SV)',
        '2. Calculate cost variance (CV)',
        '3. Identify variance root causes',
        '4. Assess variance trends',
        '5. Evaluate impact on project completion',
        '6. Calculate estimate at completion (EAC)',
        '7. Calculate variance at completion (VAC)',
        '8. Identify corrective actions needed',
        '9. Assess forecast accuracy',
        '10. Document variance explanations'
      ],
      outputFormat: 'JSON object with variance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['scheduleVariance', 'costVariance'],
      properties: {
        scheduleVariance: {
          type: 'object',
          properties: {
            sv: { type: 'number' },
            svPercent: { type: 'number' },
            rootCauses: { type: 'array', items: { type: 'string' } },
            trend: { type: 'string' }
          }
        },
        costVariance: {
          type: 'object',
          properties: {
            cv: { type: 'number' },
            cvPercent: { type: 'number' },
            rootCauses: { type: 'array', items: { type: 'string' } },
            trend: { type: 'string' }
          }
        },
        eac: { type: 'number' },
        etc: { type: 'number' },
        vac: { type: 'number' },
        tcpi: { type: 'number' },
        correctiveActions: { type: 'array', items: { type: 'string' } },
        varianceExplanations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reporting', 'variance', 'evm']
}));

export const riskIssueStatusTask = defineTask('risk-issue-status', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Risk and Issue Status - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Manager',
      task: 'Summarize risk and issue status for reporting',
      context: {
        projectName: args.projectName,
        projectData: args.projectData,
        progressAnalysis: args.progressAnalysis
      },
      instructions: [
        '1. Summarize active risks by priority',
        '2. Identify new risks this period',
        '3. Document risk status changes',
        '4. Summarize open issues',
        '5. Identify critical/escalated issues',
        '6. Document issue resolution progress',
        '7. Assess overall risk exposure',
        '8. Identify risks requiring attention',
        '9. Document risk responses in progress',
        '10. Provide risk/issue recommendations'
      ],
      outputFormat: 'JSON object with risk and issue status'
    },
    outputSchema: {
      type: 'object',
      required: ['overallRiskStatus', 'risks', 'issues'],
      properties: {
        overallRiskStatus: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        risks: {
          type: 'object',
          properties: {
            totalActive: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' },
            newThisPeriod: { type: 'number' },
            closedThisPeriod: { type: 'number' }
          }
        },
        topRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              priority: { type: 'string' },
              status: { type: 'string' },
              response: { type: 'string' }
            }
          }
        },
        issues: {
          type: 'object',
          properties: {
            totalOpen: { type: 'number' },
            critical: { type: 'number' },
            newThisPeriod: { type: 'number' },
            resolvedThisPeriod: { type: 'number' }
          }
        },
        criticalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              status: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reporting', 'risks', 'issues']
}));

export const accomplishmentsNextStepsTask = defineTask('accomplishments-next-steps', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Accomplishments and Next Steps - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Manager',
      task: 'Document accomplishments and plan next steps',
      context: {
        projectName: args.projectName,
        progressAnalysis: args.progressAnalysis,
        reportingPeriod: args.reportingPeriod
      },
      instructions: [
        '1. List key accomplishments this period',
        '2. Document milestones achieved',
        '3. Highlight team achievements',
        '4. Document deliverables completed',
        '5. Identify decisions made',
        '6. Plan activities for next period',
        '7. Identify upcoming milestones',
        '8. Document planned decisions',
        '9. Identify dependencies for next period',
        '10. Document resource needs'
      ],
      outputFormat: 'JSON object with accomplishments and next steps'
    },
    outputSchema: {
      type: 'object',
      required: ['accomplishments', 'nextSteps'],
      properties: {
        accomplishments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              accomplishment: { type: 'string' },
              category: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        milestonesAchieved: { type: 'array', items: { type: 'string' } },
        deliverablesCompleted: { type: 'array', items: { type: 'string' } },
        decisionsMade: { type: 'array', items: { type: 'string' } },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' }
            }
          }
        },
        upcomingMilestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              date: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        decisionsNeeded: { type: 'array', items: { type: 'string' } },
        resourceNeeds: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reporting', 'accomplishments', 'planning']
}));

export const executiveSummaryTask = defineTask('executive-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Executive Summary - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Project Manager',
      task: 'Create executive summary for leadership',
      context: {
        projectName: args.projectName,
        progressAnalysis: args.progressAnalysis,
        varianceAnalysis: args.varianceAnalysis,
        riskIssueStatus: args.riskIssueStatus,
        accomplishmentsNextSteps: args.accomplishmentsNextSteps,
        reportingPeriod: args.reportingPeriod
      },
      instructions: [
        '1. Create concise project health summary',
        '2. Highlight key metrics (RAG status)',
        '3. Summarize major accomplishments',
        '4. Identify top risks/issues requiring attention',
        '5. State any escalations or decisions needed',
        '6. Provide brief forecast',
        '7. Keep to one page/screen',
        '8. Use executive-friendly language',
        '9. Include key numbers and percentages',
        '10. End with clear call to action if needed'
      ],
      outputFormat: 'JSON object with executive summary'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'healthIndicator'],
      properties: {
        summary: { type: 'string' },
        healthIndicator: { type: 'string', enum: ['green', 'yellow', 'red'] },
        keyMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              value: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        topAccomplishments: { type: 'array', items: { type: 'string' } },
        attentionNeeded: { type: 'array', items: { type: 'string' } },
        escalations: { type: 'array', items: { type: 'string' } },
        decisionsNeeded: { type: 'array', items: { type: 'string' } },
        forecast: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reporting', 'executive-summary', 'communication']
}));

export const detailedStatusReportTask = defineTask('detailed-status-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Detailed Status Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Controller',
      task: 'Create detailed project status report',
      context: {
        projectName: args.projectName,
        dataCollection: args.dataCollection,
        progressAnalysis: args.progressAnalysis,
        varianceAnalysis: args.varianceAnalysis,
        riskIssueStatus: args.riskIssueStatus,
        accomplishmentsNextSteps: args.accomplishmentsNextSteps,
        reportingPeriod: args.reportingPeriod
      },
      instructions: [
        '1. Include complete project status summary',
        '2. Detail schedule performance',
        '3. Detail cost/budget performance',
        '4. Include milestone status table',
        '5. Document risk register summary',
        '6. Document issue log summary',
        '7. Include resource utilization',
        '8. Document quality metrics',
        '9. Include change log',
        '10. Provide detailed action items'
      ],
      outputFormat: 'JSON object with detailed report'
    },
    outputSchema: {
      type: 'object',
      required: ['report'],
      properties: {
        report: {
          type: 'object',
          properties: {
            header: { type: 'object' },
            summary: { type: 'string' },
            scheduleSection: { type: 'object' },
            budgetSection: { type: 'object' },
            milestoneTable: { type: 'array' },
            riskSummary: { type: 'object' },
            issueSummary: { type: 'object' },
            resourceSection: { type: 'object' },
            qualitySection: { type: 'object' },
            changeLog: { type: 'array' },
            actionItems: { type: 'array' }
          }
        },
        reportDate: { type: 'string' },
        preparedBy: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reporting', 'detailed-report', 'status']
}));

export const dashboardGenerationTask = defineTask('dashboard-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Dashboard Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Visualization Specialist',
      task: 'Generate project dashboard data and visualizations',
      context: {
        projectName: args.projectName,
        progressAnalysis: args.progressAnalysis,
        varianceAnalysis: args.varianceAnalysis,
        riskIssueStatus: args.riskIssueStatus,
        projectData: args.projectData
      },
      instructions: [
        '1. Define key performance indicators (KPIs)',
        '2. Create RAG status indicators',
        '3. Generate schedule trend data',
        '4. Generate cost trend data',
        '5. Create milestone tracker data',
        '6. Generate risk heat map data',
        '7. Create resource utilization charts',
        '8. Generate burndown/burnup data',
        '9. Create comparison charts',
        '10. Document dashboard layout'
      ],
      outputFormat: 'JSON object with dashboard data'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'kpis'],
      properties: {
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'string' },
              status: { type: 'string' },
              trend: { type: 'string' }
            }
          }
        },
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kpi: { type: 'string' },
              target: { type: 'string' },
              actual: { type: 'string' },
              variance: { type: 'string' }
            }
          }
        },
        charts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              chartType: { type: 'string' },
              title: { type: 'string' },
              data: { type: 'object' }
            }
          }
        },
        ragStatus: {
          type: 'object',
          properties: {
            overall: { type: 'string' },
            schedule: { type: 'string' },
            budget: { type: 'string' },
            scope: { type: 'string' },
            risk: { type: 'string' }
          }
        },
        dashboardLayout: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reporting', 'dashboard', 'visualization']
}));

export const stakeholderCommunicationsTask = defineTask('stakeholder-communications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Stakeholder Communications - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Communications Manager',
      task: 'Create tailored communications for different stakeholders',
      context: {
        projectName: args.projectName,
        stakeholders: args.stakeholders,
        executiveSummary: args.executiveSummary,
        detailedReport: args.detailedReport,
        progressAnalysis: args.progressAnalysis,
        communicationMatrix: args.communicationMatrix
      },
      instructions: [
        '1. Identify stakeholder communication needs',
        '2. Create executive briefing (1-pager)',
        '3. Create team update',
        '4. Create sponsor update',
        '5. Create PMO report',
        '6. Tailor message tone and detail',
        '7. Include relevant attachments per audience',
        '8. Set communication channel per stakeholder',
        '9. Plan communication timing',
        '10. Document distribution list'
      ],
      outputFormat: 'JSON object with stakeholder communications'
    },
    outputSchema: {
      type: 'object',
      required: ['communications'],
      properties: {
        communications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              audience: { type: 'string' },
              type: { type: 'string' },
              channel: { type: 'string' },
              content: { type: 'string' },
              attachments: { type: 'array', items: { type: 'string' } },
              recipients: { type: 'array', items: { type: 'string' } },
              timing: { type: 'string' }
            }
          }
        },
        distributionPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reporting', 'communication', 'stakeholders']
}));

export const reportCompilationTask = defineTask('report-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Report Compilation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer',
      task: 'Compile final status report package',
      context: {
        projectName: args.projectName,
        executiveSummary: args.executiveSummary,
        detailedReport: args.detailedReport,
        dashboard: args.dashboard,
        stakeholderCommunications: args.stakeholderCommunications,
        reportingPeriod: args.reportingPeriod
      },
      instructions: [
        '1. Compile all report components',
        '2. Create unified markdown document',
        '3. Ensure consistent formatting',
        '4. Add table of contents',
        '5. Include report metadata',
        '6. Add distribution instructions',
        '7. Calculate completeness score',
        '8. Document any gaps',
        '9. Provide recommendations',
        '10. Add version control'
      ],
      outputFormat: 'JSON object with compiled report'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'completenessScore'],
      properties: {
        markdown: { type: 'string' },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        tableOfContents: { type: 'array', items: { type: 'string' } },
        reportMetadata: {
          type: 'object',
          properties: {
            project: { type: 'string' },
            period: { type: 'string' },
            preparedBy: { type: 'string' },
            preparedDate: { type: 'string' },
            version: { type: 'string' }
          }
        },
        distributionList: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['reporting', 'compilation', 'documentation']
}));
