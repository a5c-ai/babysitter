/**
 * @file variance-analysis-reporting.js
 * @description Systematic analysis of budget-to-actual variances with root cause identification, trend analysis, and actionable recommendations for management
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Variance Analysis and Reporting Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.reportingPeriod - Period being analyzed (e.g., "2024-Q1", "2024-01")
 * @param {Object} inputs.actualResults - Actual financial results for the period
 * @param {Object} inputs.budgetData - Budget/plan data for comparison
 * @param {Object} inputs.priorPeriodActuals - Prior period actuals for trend analysis
 * @param {Object} inputs.priorYearActuals - Prior year same period actuals
 * @param {number} inputs.materialityThreshold - Threshold for material variance analysis
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Comprehensive variance analysis report
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Data Validation and Preparation
  const dataResult = await ctx.task(validateAndPrepareDataTask, {
    actualResults: inputs.actualResults,
    budgetData: inputs.budgetData,
    priorPeriodActuals: inputs.priorPeriodActuals,
    priorYearActuals: inputs.priorYearActuals
  });
  results.steps.push({ name: 'data-validation', result: dataResult });

  // Step 2: Calculate All Variances
  const calculationResult = await ctx.task(calculateVariancesTask, {
    preparedData: dataResult,
    materialityThreshold: inputs.materialityThreshold
  });
  results.steps.push({ name: 'variance-calculation', result: calculationResult });

  // Step 3: Identify Material Variances
  const materialResult = await ctx.task(identifyMaterialVariancesTask, {
    variances: calculationResult,
    materialityThreshold: inputs.materialityThreshold
  });
  results.steps.push({ name: 'material-variance-identification', result: materialResult });

  // Step 4: Root Cause Analysis
  const rootCauseResult = await ctx.task(performRootCauseAnalysisTask, {
    materialVariances: materialResult,
    reportingPeriod: inputs.reportingPeriod
  });
  results.steps.push({ name: 'root-cause-analysis', result: rootCauseResult });

  // Breakpoint for analyst review of root causes
  await ctx.breakpoint('root-cause-review', {
    message: 'Review root cause analysis before gathering management input',
    data: rootCauseResult
  });

  // Step 5: Trend Analysis
  const trendResult = await ctx.task(performTrendAnalysisTask, {
    currentVariances: calculationResult,
    historicalData: {
      priorPeriod: inputs.priorPeriodActuals,
      priorYear: inputs.priorYearActuals
    }
  });
  results.steps.push({ name: 'trend-analysis', result: trendResult });

  // Step 6: Develop Actionable Recommendations
  const recommendationsResult = await ctx.task(developRecommendationsTask, {
    rootCauses: rootCauseResult,
    trends: trendResult,
    materialVariances: materialResult
  });
  results.steps.push({ name: 'recommendations', result: recommendationsResult });

  // Breakpoint for management review
  await ctx.breakpoint('management-review', {
    message: 'Review variance analysis and recommendations with management',
    data: { rootCauses: rootCauseResult, recommendations: recommendationsResult }
  });

  // Step 7: Prepare Final Report
  const reportResult = await ctx.task(prepareFinalReportTask, {
    reportingPeriod: inputs.reportingPeriod,
    variances: calculationResult,
    materialVariances: materialResult,
    rootCauses: rootCauseResult,
    trends: trendResult,
    recommendations: recommendationsResult
  });
  results.steps.push({ name: 'final-report', result: reportResult });

  results.outputs = {
    varianceReport: reportResult,
    reportingPeriod: inputs.reportingPeriod,
    keyFindings: materialResult,
    actionItems: recommendationsResult
  };

  return results;
}

// Task definitions
export const validateAndPrepareDataTask = defineTask('validate-prepare-data', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-reporting' },
  agent: {
    name: 'data-analyst',
    prompt: {
      system: 'You are a financial data analyst responsible for validating and preparing data for variance analysis.',
      user: `Validate and prepare data for variance analysis.

Actual results: ${JSON.stringify(args.actualResults)}
Budget data: ${JSON.stringify(args.budgetData)}
Prior period actuals: ${JSON.stringify(args.priorPeriodActuals)}
Prior year actuals: ${JSON.stringify(args.priorYearActuals)}

Perform:
1. Validate data completeness for all periods
2. Reconcile totals to source systems
3. Normalize account structures across periods
4. Identify and flag any data quality issues
5. Adjust for any reclassifications or restatements
6. Create aligned datasets ready for comparison
7. Document any data limitations or caveats

Output clean, validated datasets structured for variance calculation.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const calculateVariancesTask = defineTask('calculate-variances', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-analysis' },
  agent: {
    name: 'variance-analyst',
    prompt: {
      system: 'You are a financial analyst specializing in variance calculations and financial comparison analysis.',
      user: `Calculate comprehensive variances across all financial dimensions.

Prepared data: ${JSON.stringify(args.preparedData)}
Materiality threshold: ${args.materialityThreshold}

Calculate:
1. Budget-to-Actual variances ($ and %)
2. Prior period variances ($ and %)
3. Prior year variances ($ and %)
4. YTD variances vs budget and prior year
5. Full-year forecast variance vs budget

For each line item:
- Absolute variance amount
- Percentage variance
- Favorable/unfavorable indicator
- Cumulative impact on key metrics

Organize by:
- P&L line items (revenue, gross margin, operating expenses, etc.)
- Balance sheet categories
- Cash flow components
- Key performance metrics`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const identifyMaterialVariancesTask = defineTask('identify-material-variances', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-analysis' },
  agent: {
    name: 'materiality-analyst',
    prompt: {
      system: 'You are a financial analyst who identifies and prioritizes material variances for management attention.',
      user: `Identify material variances requiring detailed analysis.

All variances: ${JSON.stringify(args.variances)}
Materiality threshold: ${args.materialityThreshold}

Apply materiality criteria:
1. Absolute dollar threshold
2. Percentage threshold
3. Strategic importance regardless of amount
4. Recurring vs one-time nature
5. Trend direction (improving vs deteriorating)

For each material variance:
- Document the variance details
- Assess business significance
- Prioritize for root cause analysis
- Identify responsible business owner
- Note any prior period patterns

Output prioritized list of material variances for deep-dive analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const performRootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'business-analysis' },
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      system: 'You are a business analyst specializing in root cause analysis for financial variances.',
      user: `Perform root cause analysis on material variances for ${args.reportingPeriod}.

Material variances: ${JSON.stringify(args.materialVariances)}

For each material variance, determine:
1. Primary root cause category:
   - Volume/quantity changes
   - Price/rate changes
   - Mix changes
   - Timing differences
   - One-time items
   - Operational issues
   - External factors

2. Contributing factors and their relative impact

3. Whether the variance is:
   - Controllable vs uncontrollable
   - Recurring vs non-recurring
   - Favorable trend vs unfavorable trend

4. Supporting evidence and data

5. Business owner accountability

Use the 5 Whys technique where appropriate to get to true root causes.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const performTrendAnalysisTask = defineTask('trend-analysis', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-analysis' },
  agent: {
    name: 'trend-analyst',
    prompt: {
      system: 'You are a financial analyst specializing in trend analysis and pattern recognition.',
      user: `Perform trend analysis on financial variances.

Current period variances: ${JSON.stringify(args.currentVariances)}
Historical data: ${JSON.stringify(args.historicalData)}

Analyze:
1. Multi-period variance trends (improving/deteriorating)
2. Seasonality patterns in variances
3. Correlation between related variances
4. Year-over-year patterns
5. Sequential period patterns
6. Leading indicators of future variances

Identify:
- Persistent variance patterns requiring structural fixes
- Seasonal adjustments needed in planning
- Early warning indicators
- Positive trends to maintain
- Negative trends requiring intervention

Visualize trends and provide statistical measures where relevant.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developRecommendationsTask = defineTask('develop-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'business-advisory' },
  agent: {
    name: 'advisory-analyst',
    prompt: {
      system: 'You are a financial advisor who develops actionable recommendations based on variance analysis.',
      user: `Develop actionable recommendations based on variance analysis findings.

Root causes: ${JSON.stringify(args.rootCauses)}
Trends: ${JSON.stringify(args.trends)}
Material variances: ${JSON.stringify(args.materialVariances)}

For each significant finding, recommend:
1. Immediate corrective actions
2. Process improvements
3. Planning/budgeting adjustments
4. Monitoring and controls
5. Escalation requirements

Each recommendation should include:
- Specific action to take
- Responsible party
- Timeline for implementation
- Expected impact/benefit
- Resources required
- Success metrics

Prioritize recommendations by:
- Financial impact
- Ease of implementation
- Strategic importance
- Risk mitigation value`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareFinalReportTask = defineTask('prepare-final-report', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'executive-reporting' },
  agent: {
    name: 'report-writer',
    prompt: {
      system: 'You are a financial reporting specialist who creates clear, actionable variance analysis reports for management.',
      user: `Prepare final variance analysis report for ${args.reportingPeriod}.

Variances: ${JSON.stringify(args.variances)}
Material variances: ${JSON.stringify(args.materialVariances)}
Root causes: ${JSON.stringify(args.rootCauses)}
Trends: ${JSON.stringify(args.trends)}
Recommendations: ${JSON.stringify(args.recommendations)}

Create report with:
1. Executive Summary
   - Key takeaways
   - Bottom-line impact
   - Critical action items

2. Financial Performance Summary
   - P&L variance summary
   - Key metrics vs targets
   - YTD performance

3. Material Variance Deep Dives
   - Variance details
   - Root cause analysis
   - Trend context
   - Recommendations

4. Trend Analysis Section
   - Visual trend charts
   - Pattern insights
   - Forward-looking indicators

5. Action Plan
   - Prioritized recommendations
   - Owners and deadlines
   - Expected outcomes

6. Appendices
   - Detailed variance schedules
   - Supporting data
   - Methodology notes

Format for executive readability with clear visualizations.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
