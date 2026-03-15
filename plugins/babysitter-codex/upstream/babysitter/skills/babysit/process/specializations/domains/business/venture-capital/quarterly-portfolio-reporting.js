/**
 * @process venture-capital/quarterly-portfolio-reporting
 * @description Systematic collection and analysis of portfolio company KPIs, financial performance, and milestone progress with standardized dashboards and LP reporting
 * @inputs { fundName: string, portfolioCompanies: array, reportingPeriod: string, lpRequirements: object }
 * @outputs { success: boolean, portfolioMetrics: object, companyReports: array, lpReport: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    fundName,
    portfolioCompanies = [],
    reportingPeriod = 'Q4 2025',
    lpRequirements = {},
    outputDir = 'quarterly-reporting-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Data Collection and Validation
  ctx.log('info', 'Collecting portfolio company data');
  const dataCollection = await ctx.task(dataCollectionTask, {
    portfolioCompanies,
    reportingPeriod,
    outputDir
  });

  if (!dataCollection.success) {
    return {
      success: false,
      error: 'Data collection failed',
      details: dataCollection,
      metadata: { processId: 'venture-capital/quarterly-portfolio-reporting', timestamp: startTime }
    };
  }

  artifacts.push(...dataCollection.artifacts);

  // Task 2: KPI Analysis
  ctx.log('info', 'Analyzing portfolio KPIs');
  const kpiAnalysis = await ctx.task(kpiAnalysisTask, {
    portfolioData: dataCollection.data,
    reportingPeriod,
    outputDir
  });

  artifacts.push(...kpiAnalysis.artifacts);

  // Task 3: Financial Performance Analysis
  ctx.log('info', 'Analyzing financial performance');
  const financialAnalysis = await ctx.task(financialPerformanceTask, {
    portfolioData: dataCollection.data,
    reportingPeriod,
    outputDir
  });

  artifacts.push(...financialAnalysis.artifacts);

  // Task 4: Milestone Tracking
  ctx.log('info', 'Tracking milestone progress');
  const milestoneTracking = await ctx.task(milestoneTrackingTask, {
    portfolioData: dataCollection.data,
    reportingPeriod,
    outputDir
  });

  artifacts.push(...milestoneTracking.artifacts);

  // Task 5: Portfolio Valuation Update
  ctx.log('info', 'Updating portfolio valuations');
  const valuationUpdate = await ctx.task(valuationUpdateTask, {
    portfolioData: dataCollection.data,
    financialAnalysis,
    reportingPeriod,
    outputDir
  });

  artifacts.push(...valuationUpdate.artifacts);

  // Task 6: Company Summary Reports
  ctx.log('info', 'Generating company summary reports');
  const companySummaries = await ctx.task(companySummaryTask, {
    portfolioData: dataCollection.data,
    kpiAnalysis,
    financialAnalysis,
    milestoneTracking,
    valuationUpdate,
    outputDir
  });

  artifacts.push(...companySummaries.artifacts);

  // Breakpoint: Review portfolio data
  await ctx.breakpoint({
    question: `Portfolio data collected for ${portfolioCompanies.length} companies. ${kpiAnalysis.onTrack} on track, ${kpiAnalysis.needsAttention} need attention. Review analysis?`,
    title: 'Quarterly Portfolio Reporting',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        companiesReported: dataCollection.companiesReported,
        onTrack: kpiAnalysis.onTrack,
        needsAttention: kpiAnalysis.needsAttention,
        totalNAV: valuationUpdate.totalNAV,
        quarterlyChange: valuationUpdate.quarterlyChange
      }
    }
  });

  // Task 7: LP Report Generation
  ctx.log('info', 'Generating LP report');
  const lpReport = await ctx.task(lpReportTask, {
    fundName,
    reportingPeriod,
    kpiAnalysis,
    financialAnalysis,
    milestoneTracking,
    valuationUpdate,
    companySummaries,
    lpRequirements,
    outputDir
  });

  artifacts.push(...lpReport.artifacts);

  // Task 8: Dashboard Generation
  ctx.log('info', 'Generating portfolio dashboard');
  const dashboardGeneration = await ctx.task(dashboardTask, {
    fundName,
    reportingPeriod,
    kpiAnalysis,
    financialAnalysis,
    valuationUpdate,
    outputDir
  });

  artifacts.push(...dashboardGeneration.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    portfolioMetrics: {
      totalNAV: valuationUpdate.totalNAV,
      quarterlyChange: valuationUpdate.quarterlyChange,
      totalInvested: valuationUpdate.totalInvested,
      moic: valuationUpdate.moic,
      irr: valuationUpdate.irr
    },
    kpiSummary: {
      onTrack: kpiAnalysis.onTrack,
      needsAttention: kpiAnalysis.needsAttention,
      outperforming: kpiAnalysis.outperforming
    },
    companyReports: companySummaries.reports,
    lpReport: {
      reportPath: lpReport.reportPath,
      keyHighlights: lpReport.keyHighlights
    },
    dashboard: dashboardGeneration.dashboardPath,
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/quarterly-portfolio-reporting',
      timestamp: startTime,
      fundName,
      reportingPeriod
    }
  };
}

// Task 1: Data Collection
export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect portfolio company data',
  agent: {
    name: 'data-collector',
    prompt: {
      role: 'portfolio operations analyst',
      task: 'Collect and validate portfolio company data',
      context: args,
      instructions: [
        'Request standardized reporting from companies',
        'Collect financial statements and KPIs',
        'Gather board materials and updates',
        'Validate data completeness and accuracy',
        'Flag missing or inconsistent data',
        'Normalize data formats',
        'Create data quality report',
        'Document collection status'
      ],
      outputFormat: 'JSON with collected data and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'data', 'companiesReported', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        data: { type: 'array' },
        companiesReported: { type: 'number' },
        missingData: { type: 'array' },
        dataQuality: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'portfolio', 'data-collection']
}));

// Task 2: KPI Analysis
export const kpiAnalysisTask = defineTask('kpi-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze portfolio KPIs',
  agent: {
    name: 'kpi-analyst',
    prompt: {
      role: 'portfolio analytics specialist',
      task: 'Analyze portfolio company KPIs',
      context: args,
      instructions: [
        'Calculate key metrics for each company',
        'Compare to prior periods and targets',
        'Identify companies on track vs off track',
        'Analyze growth rates and trends',
        'Compare to industry benchmarks',
        'Identify outperformers and laggards',
        'Create KPI summary dashboard',
        'Flag companies needing attention'
      ],
      outputFormat: 'JSON with KPI analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['onTrack', 'needsAttention', 'analysis', 'artifacts'],
      properties: {
        onTrack: { type: 'number' },
        needsAttention: { type: 'number' },
        outperforming: { type: 'number' },
        analysis: { type: 'array' },
        trends: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'portfolio', 'kpis']
}));

// Task 3: Financial Performance Analysis
export const financialPerformanceTask = defineTask('financial-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze financial performance',
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'portfolio finance analyst',
      task: 'Analyze portfolio financial performance',
      context: args,
      instructions: [
        'Analyze revenue growth and trends',
        'Review burn rate and runway',
        'Assess gross margin trends',
        'Analyze unit economics changes',
        'Review cash position and needs',
        'Compare actuals to projections',
        'Identify follow-on funding needs',
        'Create financial summary'
      ],
      outputFormat: 'JSON with financial analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'byCompany', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        byCompany: { type: 'array' },
        fundingNeeds: { type: 'array' },
        alerts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'portfolio', 'financials']
}));

// Task 4: Milestone Tracking
export const milestoneTrackingTask = defineTask('milestone-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Track milestone progress',
  agent: {
    name: 'milestone-tracker',
    prompt: {
      role: 'portfolio operations manager',
      task: 'Track portfolio company milestone progress',
      context: args,
      instructions: [
        'Review milestones by company',
        'Track progress against plan',
        'Identify completed milestones',
        'Flag delayed or at-risk milestones',
        'Update milestone timelines',
        'Document blockers and dependencies',
        'Create milestone summary',
        'Plan upcoming milestone reviews'
      ],
      outputFormat: 'JSON with milestone tracking and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['completed', 'inProgress', 'atRisk', 'artifacts'],
      properties: {
        completed: { type: 'array' },
        inProgress: { type: 'array' },
        atRisk: { type: 'array' },
        upcoming: { type: 'array' },
        byCompany: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'portfolio', 'milestones']
}));

// Task 5: Valuation Update
export const valuationUpdateTask = defineTask('valuation-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update portfolio valuations',
  agent: {
    name: 'valuation-analyst',
    prompt: {
      role: 'portfolio valuation specialist',
      task: 'Update portfolio company valuations',
      context: args,
      instructions: [
        'Review valuation methodology by company',
        'Update for recent financing events',
        'Adjust for performance changes',
        'Apply fair value adjustments',
        'Calculate unrealized gains/losses',
        'Update fund NAV',
        'Calculate MOIC and IRR',
        'Document valuation rationale'
      ],
      outputFormat: 'JSON with valuation updates and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalNAV', 'quarterlyChange', 'moic', 'artifacts'],
      properties: {
        totalNAV: { type: 'number' },
        quarterlyChange: { type: 'number' },
        totalInvested: { type: 'number' },
        moic: { type: 'number' },
        irr: { type: 'number' },
        byCompany: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'portfolio', 'valuation']
}));

// Task 6: Company Summary Reports
export const companySummaryTask = defineTask('company-summaries', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate company summaries',
  agent: {
    name: 'summary-generator',
    prompt: {
      role: 'portfolio reporting analyst',
      task: 'Generate individual company summary reports',
      context: args,
      instructions: [
        'Create standardized summary for each company',
        'Include key metrics and KPIs',
        'Document quarterly highlights',
        'Include management commentary',
        'Add valuation and ownership',
        'Include risk assessment',
        'Document board engagement',
        'Format per reporting standards'
      ],
      outputFormat: 'JSON with company reports and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'artifacts'],
      properties: {
        reports: { type: 'array' },
        highlights: { type: 'array' },
        concerns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'portfolio', 'summaries']
}));

// Task 7: LP Report Generation
export const lpReportTask = defineTask('lp-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate LP report',
  agent: {
    name: 'lp-report-generator',
    prompt: {
      role: 'LP relations manager',
      task: 'Generate quarterly LP report',
      context: args,
      instructions: [
        'Create executive summary',
        'Present fund performance metrics',
        'Include portfolio overview',
        'Add company-by-company summaries',
        'Include market commentary',
        'Document capital account activity',
        'Add forward outlook',
        'Format per ILPA standards'
      ],
      outputFormat: 'JSON with LP report path and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyHighlights', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyHighlights: { type: 'array' },
        fundMetrics: { type: 'object' },
        sections: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'portfolio', 'lp-reporting']
}));

// Task 8: Dashboard Generation
export const dashboardTask = defineTask('dashboard-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate portfolio dashboard',
  agent: {
    name: 'dashboard-generator',
    prompt: {
      role: 'portfolio data visualization specialist',
      task: 'Generate portfolio performance dashboard',
      context: args,
      instructions: [
        'Create fund-level metrics dashboard',
        'Add portfolio composition charts',
        'Include performance attribution',
        'Create company KPI views',
        'Add valuation trend charts',
        'Include risk heatmap',
        'Create interactive elements',
        'Export dashboard data'
      ],
      outputFormat: 'JSON with dashboard path and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboardPath', 'metrics', 'artifacts'],
      properties: {
        dashboardPath: { type: 'string' },
        metrics: { type: 'object' },
        charts: { type: 'array' },
        interactiveElements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'portfolio', 'dashboard']
}));
