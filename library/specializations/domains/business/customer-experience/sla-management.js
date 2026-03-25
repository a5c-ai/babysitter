/**
 * @process customer-experience/sla-management
 * @description Process for tracking, alerting, and ensuring compliance with service level agreements across all support channels
 * @inputs { tickets: array, slaDefinitions: object, customerTiers: object, reportingPeriod: object }
 * @outputs { success: boolean, slaReport: object, complianceMetrics: object, alerts: array, recommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    tickets = [],
    slaDefinitions = {},
    customerTiers = {},
    reportingPeriod = {},
    outputDir = 'sla-management-output',
    alertThresholds = {}
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting SLA Management and Monitoring Process');

  // ============================================================================
  // PHASE 1: SLA POLICY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing SLA policies and definitions');
  const policyAnalysis = await ctx.task(policyAnalysisTask, {
    slaDefinitions,
    customerTiers,
    outputDir
  });

  artifacts.push(...policyAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: TICKET SLA TRACKING
  // ============================================================================

  ctx.log('info', 'Phase 2: Tracking ticket SLA status');
  const slaTracking = await ctx.task(slaTrackingTask, {
    tickets,
    slaDefinitions,
    customerTiers,
    reportingPeriod,
    outputDir
  });

  artifacts.push(...slaTracking.artifacts);

  // ============================================================================
  // PHASE 3: COMPLIANCE CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Calculating SLA compliance metrics');
  const complianceCalculation = await ctx.task(complianceCalculationTask, {
    slaTracking,
    slaDefinitions,
    reportingPeriod,
    outputDir
  });

  artifacts.push(...complianceCalculation.artifacts);

  // ============================================================================
  // PHASE 4: BREACH ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing SLA breaches and patterns');
  const breachAnalysis = await ctx.task(breachAnalysisTask, {
    slaTracking,
    complianceCalculation,
    outputDir
  });

  artifacts.push(...breachAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: RISK ALERT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Generating at-risk SLA alerts');
  const alertGeneration = await ctx.task(alertGenerationTask, {
    slaTracking,
    alertThresholds,
    outputDir
  });

  artifacts.push(...alertGeneration.artifacts);

  // ============================================================================
  // PHASE 6: TREND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing SLA performance trends');
  const trendAnalysis = await ctx.task(trendAnalysisTask, {
    complianceCalculation,
    breachAnalysis,
    reportingPeriod,
    outputDir
  });

  artifacts.push(...trendAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: IMPROVEMENT RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating improvement recommendations');
  const recommendations = await ctx.task(recommendationsTask, {
    complianceCalculation,
    breachAnalysis,
    trendAnalysis,
    outputDir
  });

  artifacts.push(...recommendations.artifacts);

  // ============================================================================
  // PHASE 8: SLA REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive SLA report');
  const slaReport = await ctx.task(slaReportTask, {
    policyAnalysis,
    slaTracking,
    complianceCalculation,
    breachAnalysis,
    trendAnalysis,
    recommendations,
    reportingPeriod,
    outputDir
  });

  artifacts.push(...slaReport.artifacts);

  const complianceRate = complianceCalculation.overallCompliance;
  const complianceMet = complianceRate >= 95;

  await ctx.breakpoint({
    question: `SLA report complete. Overall compliance: ${complianceRate}%. ${complianceMet ? 'Target met!' : 'Below target.'} Active alerts: ${alertGeneration.alerts?.length || 0}. Review and distribute?`,
    title: 'SLA Management Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        complianceRate,
        complianceMet,
        totalTickets: tickets.length,
        breaches: breachAnalysis.totalBreaches,
        atRiskTickets: alertGeneration.alerts?.length || 0,
        recommendationCount: recommendations.items?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    complianceRate,
    complianceMet,
    slaReport: slaReport.report,
    complianceMetrics: {
      overall: complianceCalculation.overallCompliance,
      byPriority: complianceCalculation.byPriority,
      byTier: complianceCalculation.byTier,
      byChannel: complianceCalculation.byChannel
    },
    breachAnalysis: {
      totalBreaches: breachAnalysis.totalBreaches,
      byCategory: breachAnalysis.byCategory,
      rootCauses: breachAnalysis.rootCauses
    },
    alerts: alertGeneration.alerts,
    trends: trendAnalysis.trends,
    recommendations: recommendations.items,
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/sla-management',
      timestamp: startTime,
      reportingPeriod,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const policyAnalysisTask = defineTask('policy-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze SLA policies and definitions',
  agent: {
    name: 'policy-analyst',
    prompt: {
      role: 'SLA policy specialist',
      task: 'Analyze and document current SLA policies across customer tiers and channels',
      context: args,
      instructions: [
        'Document SLA targets by customer tier',
        'Map response time commitments by priority',
        'Map resolution time commitments',
        'Document escalation time policies',
        'Identify business hours vs 24/7 coverage',
        'Document exclusions and exceptions',
        'Compare policies to industry benchmarks',
        'Identify policy gaps or inconsistencies',
        'Generate policy analysis report'
      ],
      outputFormat: 'JSON with policies, targets, exclusions, benchmarks, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['policies', 'targets', 'artifacts'],
      properties: {
        policies: { type: 'object' },
        targets: { type: 'object' },
        exclusions: { type: 'array', items: { type: 'string' } },
        benchmarks: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sla-management', 'policy']
}));

export const slaTrackingTask = defineTask('sla-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Track ticket SLA status',
  agent: {
    name: 'sla-tracker',
    prompt: {
      role: 'SLA tracking specialist',
      task: 'Track SLA status for all tickets in the reporting period',
      context: args,
      instructions: [
        'Calculate response time for each ticket',
        'Calculate resolution time for resolved tickets',
        'Determine SLA status (met, at-risk, breached)',
        'Track time remaining for open tickets',
        'Identify paused or stopped clock periods',
        'Calculate business hours elapsed',
        'Flag at-risk tickets approaching breach',
        'Document any SLA exclusions applied',
        'Generate SLA tracking report'
      ],
      outputFormat: 'JSON with ticketStatuses, metrics, atRisk, breached, exclusions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ticketStatuses', 'metrics', 'artifacts'],
      properties: {
        ticketStatuses: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'object' },
        atRisk: { type: 'array', items: { type: 'object' } },
        breached: { type: 'array', items: { type: 'object' } },
        exclusions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sla-management', 'tracking']
}));

export const complianceCalculationTask = defineTask('compliance-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate SLA compliance metrics',
  agent: {
    name: 'compliance-calculator',
    prompt: {
      role: 'SLA metrics analyst',
      task: 'Calculate comprehensive SLA compliance metrics across all dimensions',
      context: args,
      instructions: [
        'Calculate overall SLA compliance percentage',
        'Calculate compliance by priority level',
        'Calculate compliance by customer tier',
        'Calculate compliance by channel',
        'Calculate response time compliance separately',
        'Calculate resolution time compliance separately',
        'Compare to previous periods',
        'Identify outliers and anomalies',
        'Generate compliance metrics report'
      ],
      outputFormat: 'JSON with overallCompliance, byPriority, byTier, byChannel, responseCompliance, resolutionCompliance, comparisons, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallCompliance', 'byPriority', 'byTier', 'artifacts'],
      properties: {
        overallCompliance: { type: 'number', minimum: 0, maximum: 100 },
        byPriority: { type: 'object' },
        byTier: { type: 'object' },
        byChannel: { type: 'object' },
        responseCompliance: { type: 'number' },
        resolutionCompliance: { type: 'number' },
        comparisons: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sla-management', 'compliance']
}));

export const breachAnalysisTask = defineTask('breach-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze SLA breaches and patterns',
  agent: {
    name: 'breach-analyst',
    prompt: {
      role: 'SLA breach analyst',
      task: 'Analyze SLA breaches to identify patterns and root causes',
      context: args,
      instructions: [
        'Categorize breaches by type and severity',
        'Identify breach patterns by time of day/week',
        'Analyze breaches by team and agent',
        'Identify systemic vs one-off breaches',
        'Conduct root cause analysis',
        'Calculate breach impact on customers',
        'Identify contributing factors',
        'Document preventable vs unavoidable breaches',
        'Generate breach analysis report'
      ],
      outputFormat: 'JSON with totalBreaches, byCategory, patterns, rootCauses, impact, preventable, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalBreaches', 'byCategory', 'rootCauses', 'artifacts'],
      properties: {
        totalBreaches: { type: 'number' },
        byCategory: { type: 'object' },
        patterns: { type: 'array', items: { type: 'object' } },
        rootCauses: { type: 'array', items: { type: 'object' } },
        impact: { type: 'object' },
        preventable: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sla-management', 'breach-analysis']
}));

export const alertGenerationTask = defineTask('alert-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate at-risk SLA alerts',
  agent: {
    name: 'alert-generator',
    prompt: {
      role: 'SLA alert specialist',
      task: 'Generate proactive alerts for tickets at risk of SLA breach',
      context: args,
      instructions: [
        'Identify tickets approaching SLA thresholds',
        'Calculate breach probability for each ticket',
        'Prioritize alerts by urgency and customer impact',
        'Determine alert recipients and channels',
        'Create actionable alert messages',
        'Set escalation triggers',
        'Document alert thresholds used',
        'Track alert effectiveness',
        'Generate alert package'
      ],
      outputFormat: 'JSON with alerts, priorities, recipients, escalations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alerts', 'priorities', 'artifacts'],
      properties: {
        alerts: { type: 'array', items: { type: 'object' } },
        priorities: { type: 'object' },
        recipients: { type: 'array', items: { type: 'object' } },
        escalations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sla-management', 'alerts']
}));

export const trendAnalysisTask = defineTask('trend-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze SLA performance trends',
  agent: {
    name: 'trend-analyst',
    prompt: {
      role: 'performance trend analyst',
      task: 'Analyze SLA performance trends over time',
      context: args,
      instructions: [
        'Calculate compliance trends over time',
        'Identify improving or declining metrics',
        'Analyze seasonal patterns',
        'Compare performance across teams',
        'Identify leading indicators',
        'Project future performance',
        'Correlate with operational changes',
        'Document significant inflection points',
        'Generate trend analysis report'
      ],
      outputFormat: 'JSON with trends, projections, patterns, correlations, insights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['trends', 'projections', 'artifacts'],
      properties: {
        trends: { type: 'object' },
        projections: { type: 'object' },
        patterns: { type: 'array', items: { type: 'object' } },
        correlations: { type: 'array', items: { type: 'object' } },
        insights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sla-management', 'trends']
}));

export const recommendationsTask = defineTask('recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate improvement recommendations',
  agent: {
    name: 'improvement-advisor',
    prompt: {
      role: 'SLA improvement specialist',
      task: 'Generate actionable recommendations to improve SLA performance',
      context: args,
      instructions: [
        'Identify quick wins for immediate improvement',
        'Recommend process changes',
        'Suggest staffing or skill adjustments',
        'Recommend tool or automation investments',
        'Propose training programs',
        'Suggest policy adjustments if needed',
        'Prioritize recommendations by impact',
        'Estimate improvement potential',
        'Generate recommendations report'
      ],
      outputFormat: 'JSON with items, quickWins, processChanges, investments, training, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['items', 'artifacts'],
      properties: {
        items: { type: 'array', items: { type: 'object' } },
        quickWins: { type: 'array', items: { type: 'object' } },
        processChanges: { type: 'array', items: { type: 'object' } },
        investments: { type: 'array', items: { type: 'object' } },
        training: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sla-management', 'recommendations']
}));

export const slaReportTask = defineTask('sla-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive SLA report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'SLA reporting specialist',
      task: 'Generate comprehensive SLA performance report for stakeholders',
      context: args,
      instructions: [
        'Create executive summary',
        'Present key compliance metrics',
        'Include breach analysis highlights',
        'Show trend visualizations',
        'Document alerts and actions taken',
        'Present improvement recommendations',
        'Include appendix with detailed data',
        'Format for stakeholder audience',
        'Generate comprehensive report'
      ],
      outputFormat: 'JSON with report, executiveSummary, visualizations, appendix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'executiveSummary', 'artifacts'],
      properties: {
        report: { type: 'object' },
        executiveSummary: { type: 'string' },
        visualizations: { type: 'array', items: { type: 'object' } },
        appendix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sla-management', 'reporting']
}));
