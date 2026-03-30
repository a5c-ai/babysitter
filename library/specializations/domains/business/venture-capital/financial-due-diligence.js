/**
 * @process venture-capital/financial-due-diligence
 * @description Detailed analysis of historical financial performance, quality of earnings, unit economics, cohort analysis, projection validation, and cash runway assessment
 * @inputs { companyName: string, financialData: object, projections: object, roundDetails: object }
 * @outputs { success: boolean, financialAnalysis: object, unitEconomics: object, projectionAssessment: object, runwayAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    financialData = {},
    projections = {},
    roundDetails = {},
    outputDir = 'financial-dd-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Historical Financial Analysis
  ctx.log('info', 'Analyzing historical financial performance');
  const historicalAnalysis = await ctx.task(historicalFinancialTask, {
    companyName,
    financialData,
    outputDir
  });

  if (!historicalAnalysis.success) {
    return {
      success: false,
      error: 'Historical financial analysis failed',
      details: historicalAnalysis,
      metadata: { processId: 'venture-capital/financial-due-diligence', timestamp: startTime }
    };
  }

  artifacts.push(...historicalAnalysis.artifacts);

  // Task 2: Quality of Earnings Analysis
  ctx.log('info', 'Assessing quality of earnings');
  const qoeAnalysis = await ctx.task(qualityOfEarningsTask, {
    companyName,
    financialData,
    historicalAnalysis: historicalAnalysis.analysis,
    outputDir
  });

  artifacts.push(...qoeAnalysis.artifacts);

  // Task 3: Unit Economics Analysis
  ctx.log('info', 'Analyzing unit economics');
  const unitEconomics = await ctx.task(unitEconomicsTask, {
    companyName,
    financialData,
    outputDir
  });

  artifacts.push(...unitEconomics.artifacts);

  // Task 4: Cohort Analysis
  ctx.log('info', 'Performing cohort analysis');
  const cohortAnalysis = await ctx.task(cohortAnalysisTask, {
    companyName,
    financialData,
    unitEconomics: unitEconomics.metrics,
    outputDir
  });

  artifacts.push(...cohortAnalysis.artifacts);

  // Task 5: Projection Validation
  ctx.log('info', 'Validating financial projections');
  const projectionValidation = await ctx.task(projectionValidationTask, {
    companyName,
    historicalAnalysis: historicalAnalysis.analysis,
    projections,
    unitEconomics: unitEconomics.metrics,
    outputDir
  });

  artifacts.push(...projectionValidation.artifacts);

  // Task 6: Cash Runway Assessment
  ctx.log('info', 'Assessing cash runway');
  const runwayAssessment = await ctx.task(runwayAssessmentTask, {
    companyName,
    financialData,
    projections,
    roundDetails,
    outputDir
  });

  artifacts.push(...runwayAssessment.artifacts);

  // Breakpoint: Review financial DD findings
  await ctx.breakpoint({
    question: `Financial DD complete for ${companyName}. Runway: ${runwayAssessment.months} months. Unit economics healthy: ${unitEconomics.healthy}. Review findings?`,
    title: 'Financial Due Diligence Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        revenueGrowth: historicalAnalysis.revenueGrowth,
        qoeScore: qoeAnalysis.score,
        ltv: unitEconomics.metrics.ltv,
        cac: unitEconomics.metrics.cac,
        ltvCacRatio: unitEconomics.metrics.ltvCacRatio,
        runway: runwayAssessment.months,
        projectionCredibility: projectionValidation.credibilityScore
      }
    }
  });

  // Task 7: Generate Financial DD Report
  ctx.log('info', 'Generating financial due diligence report');
  const ddReport = await ctx.task(financialDDReportTask, {
    companyName,
    historicalAnalysis,
    qoeAnalysis,
    unitEconomics,
    cohortAnalysis,
    projectionValidation,
    runwayAssessment,
    outputDir
  });

  artifacts.push(...ddReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    financialAnalysis: {
      revenue: historicalAnalysis.analysis.revenue,
      growth: historicalAnalysis.revenueGrowth,
      margins: historicalAnalysis.analysis.margins,
      qoeScore: qoeAnalysis.score,
      adjustments: qoeAnalysis.adjustments
    },
    unitEconomics: {
      ltv: unitEconomics.metrics.ltv,
      cac: unitEconomics.metrics.cac,
      ltvCacRatio: unitEconomics.metrics.ltvCacRatio,
      paybackPeriod: unitEconomics.metrics.paybackPeriod,
      grossMargin: unitEconomics.metrics.grossMargin,
      healthy: unitEconomics.healthy
    },
    cohortInsights: cohortAnalysis.insights,
    projectionAssessment: {
      credibilityScore: projectionValidation.credibilityScore,
      assumptions: projectionValidation.keyAssumptions,
      risks: projectionValidation.risks,
      adjustedProjections: projectionValidation.adjusted
    },
    runwayAnalysis: {
      currentCash: runwayAssessment.currentCash,
      monthlyBurn: runwayAssessment.monthlyBurn,
      runway: runwayAssessment.months,
      postRoundRunway: runwayAssessment.postRoundRunway
    },
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/financial-due-diligence',
      timestamp: startTime,
      companyName
    }
  };
}

// Task 1: Historical Financial Analysis
export const historicalFinancialTask = defineTask('historical-financial', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze historical financials',
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'financial analyst',
      task: 'Analyze historical financial performance',
      context: args,
      instructions: [
        'Review 3+ years of historical P&L statements',
        'Analyze revenue growth rates and trends',
        'Calculate gross and net margin trends',
        'Review operating expense categories',
        'Analyze balance sheet health',
        'Review cash flow statements',
        'Identify unusual items or one-time events',
        'Compare to industry benchmarks'
      ],
      outputFormat: 'JSON with financial analysis, metrics, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analysis', 'revenueGrowth', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analysis: { type: 'object' },
        revenueGrowth: { type: 'number' },
        margins: { type: 'object' },
        trends: { type: 'object' },
        benchmarks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'financial-analysis', 'historical']
}));

// Task 2: Quality of Earnings Analysis
export const qualityOfEarningsTask = defineTask('quality-of-earnings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess quality of earnings',
  agent: {
    name: 'qoe-analyst',
    prompt: {
      role: 'quality of earnings specialist',
      task: 'Assess quality and sustainability of earnings',
      context: args,
      instructions: [
        'Identify non-recurring revenue items',
        'Analyze revenue recognition policies',
        'Review deferred revenue and billings',
        'Assess cost capitalization practices',
        'Identify related party transactions',
        'Review working capital normalization',
        'Calculate adjusted EBITDA',
        'Assign quality of earnings score'
      ],
      outputFormat: 'JSON with QoE score, adjustments, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'adjustments', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        adjustments: { type: 'array' },
        adjustedEbitda: { type: 'number' },
        concerns: { type: 'array' },
        revenueQuality: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'qoe', 'earnings-quality']
}));

// Task 3: Unit Economics Analysis
export const unitEconomicsTask = defineTask('unit-economics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze unit economics',
  agent: {
    name: 'unit-economics-analyst',
    prompt: {
      role: 'SaaS/unit economics analyst',
      task: 'Calculate and analyze unit economics',
      context: args,
      instructions: [
        'Calculate Customer Acquisition Cost (CAC)',
        'Calculate Customer Lifetime Value (LTV)',
        'Compute LTV/CAC ratio',
        'Calculate CAC payback period',
        'Analyze gross margin per customer',
        'Review contribution margin',
        'Segment unit economics by cohort/channel',
        'Assess unit economics trajectory'
      ],
      outputFormat: 'JSON with unit economics metrics and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'healthy', 'artifacts'],
      properties: {
        metrics: {
          type: 'object',
          properties: {
            ltv: { type: 'number' },
            cac: { type: 'number' },
            ltvCacRatio: { type: 'number' },
            paybackPeriod: { type: 'number' },
            grossMargin: { type: 'number' }
          }
        },
        healthy: { type: 'boolean' },
        bySegment: { type: 'object' },
        trajectory: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'unit-economics', 'saas-metrics']
}));

// Task 4: Cohort Analysis
export const cohortAnalysisTask = defineTask('cohort-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform cohort analysis',
  agent: {
    name: 'cohort-analyst',
    prompt: {
      role: 'customer analytics specialist',
      task: 'Perform detailed cohort analysis',
      context: args,
      instructions: [
        'Segment customers into monthly/quarterly cohorts',
        'Calculate retention curves by cohort',
        'Analyze revenue retention (net dollar retention)',
        'Calculate cohort LTV and payback',
        'Identify cohort performance trends',
        'Analyze expansion and contraction patterns',
        'Compare recent vs older cohort performance',
        'Identify cohort quality indicators'
      ],
      outputFormat: 'JSON with cohort analysis, insights, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['cohorts', 'insights', 'artifacts'],
      properties: {
        cohorts: { type: 'array' },
        retentionCurves: { type: 'object' },
        ndr: { type: 'number' },
        insights: { type: 'array' },
        trends: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'cohort-analysis', 'retention']
}));

// Task 5: Projection Validation
export const projectionValidationTask = defineTask('projection-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate financial projections',
  agent: {
    name: 'projection-analyst',
    prompt: {
      role: 'financial planning analyst',
      task: 'Validate company financial projections',
      context: args,
      instructions: [
        'Review management projection assumptions',
        'Compare projections to historical performance',
        'Validate revenue growth assumptions',
        'Assess hiring and expense plans',
        'Test projection sensitivity to key drivers',
        'Build downside and upside scenarios',
        'Compare to comparable company benchmarks',
        'Assign credibility score to projections'
      ],
      outputFormat: 'JSON with projection assessment, scenarios, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['credibilityScore', 'keyAssumptions', 'artifacts'],
      properties: {
        credibilityScore: { type: 'number', minimum: 0, maximum: 100 },
        keyAssumptions: { type: 'array' },
        risks: { type: 'array' },
        scenarios: { type: 'object' },
        adjusted: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'projections', 'validation']
}));

// Task 6: Cash Runway Assessment
export const runwayAssessmentTask = defineTask('runway-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess cash runway',
  agent: {
    name: 'runway-analyst',
    prompt: {
      role: 'treasury and cash management analyst',
      task: 'Assess current and projected cash runway',
      context: args,
      instructions: [
        'Calculate current cash position',
        'Analyze monthly cash burn rate',
        'Project runway at current burn',
        'Model runway with growth investment',
        'Calculate post-round runway scenarios',
        'Identify burn rate drivers',
        'Assess path to profitability',
        'Recommend cash management strategies'
      ],
      outputFormat: 'JSON with runway analysis, scenarios, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['currentCash', 'monthlyBurn', 'months', 'artifacts'],
      properties: {
        currentCash: { type: 'number' },
        monthlyBurn: { type: 'number' },
        months: { type: 'number' },
        postRoundRunway: { type: 'number' },
        scenarios: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'runway', 'cash-management']
}));

// Task 7: Financial DD Report Generation
export const financialDDReportTask = defineTask('financial-dd-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate financial DD report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'VC investment analyst',
      task: 'Generate comprehensive financial due diligence report',
      context: args,
      instructions: [
        'Create executive summary of findings',
        'Present historical financial analysis',
        'Document quality of earnings assessment',
        'Include unit economics analysis',
        'Present cohort analysis findings',
        'Document projection validation',
        'Include runway analysis',
        'Format as investment committee ready document'
      ],
      outputFormat: 'JSON with report path, key findings, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        executiveSummary: { type: 'string' },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'due-diligence', 'financial-reporting']
}));
