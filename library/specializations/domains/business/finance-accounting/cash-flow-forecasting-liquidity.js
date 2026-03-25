/**
 * @file cash-flow-forecasting-liquidity.js
 * @description Daily, weekly, and monthly cash forecasting with working capital optimization and liquidity stress testing
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Cash Flow Forecasting and Liquidity Management Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.forecastPeriod - Period for the forecast
 * @param {Object} inputs.currentCashPosition - Current cash balances by account
 * @param {Object} inputs.historicalCashFlows - Historical cash flow data
 * @param {Object} inputs.operatingBudget - Operating budget for cash projections
 * @param {Object} inputs.debtFacilities - Available credit facilities and terms
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Cash forecast and liquidity analysis
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Current Position Analysis
  const positionResult = await ctx.task(analyzeCashPositionTask, {
    currentCashPosition: inputs.currentCashPosition,
    debtFacilities: inputs.debtFacilities
  });
  results.steps.push({ name: 'position-analysis', result: positionResult });

  // Step 2: Cash Receipt Forecasting
  const receiptsResult = await ctx.task(forecastCashReceiptsTask, {
    historicalCashFlows: inputs.historicalCashFlows,
    operatingBudget: inputs.operatingBudget,
    forecastPeriod: inputs.forecastPeriod
  });
  results.steps.push({ name: 'receipts-forecast', result: receiptsResult });

  // Step 3: Cash Disbursement Forecasting
  const disbursementsResult = await ctx.task(forecastCashDisbursementsTask, {
    historicalCashFlows: inputs.historicalCashFlows,
    operatingBudget: inputs.operatingBudget,
    forecastPeriod: inputs.forecastPeriod
  });
  results.steps.push({ name: 'disbursements-forecast', result: disbursementsResult });

  // Step 4: Consolidated Cash Forecast
  const forecastResult = await ctx.task(consolidateCashForecastTask, {
    currentPosition: positionResult,
    receipts: receiptsResult,
    disbursements: disbursementsResult
  });
  results.steps.push({ name: 'consolidated-forecast', result: forecastResult });

  // Breakpoint for forecast review
  await ctx.breakpoint('forecast-review', {
    message: 'Review cash forecast before working capital analysis',
    data: forecastResult
  });

  // Step 5: Working Capital Optimization
  const workingCapitalResult = await ctx.task(optimizeWorkingCapitalTask, {
    cashForecast: forecastResult,
    operatingBudget: inputs.operatingBudget
  });
  results.steps.push({ name: 'working-capital-optimization', result: workingCapitalResult });

  // Step 6: Liquidity Stress Testing
  const stressTestResult = await ctx.task(performLiquidityStressTestTask, {
    cashForecast: forecastResult,
    debtFacilities: inputs.debtFacilities
  });
  results.steps.push({ name: 'stress-testing', result: stressTestResult });

  // Breakpoint for stress test review
  await ctx.breakpoint('stress-test-review', {
    message: 'Review liquidity stress test results and mitigation strategies',
    data: stressTestResult
  });

  // Step 7: Cash Management Recommendations
  const recommendationsResult = await ctx.task(developCashRecommendationsTask, {
    forecast: forecastResult,
    workingCapital: workingCapitalResult,
    stressTest: stressTestResult
  });
  results.steps.push({ name: 'recommendations', result: recommendationsResult });

  results.outputs = {
    cashForecast: forecastResult,
    workingCapitalAnalysis: workingCapitalResult,
    stressTestResults: stressTestResult,
    recommendations: recommendationsResult
  };

  return results;
}

// Task definitions
export const analyzeCashPositionTask = defineTask('analyze-cash-position', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'treasury-management' },
  agent: {
    name: 'treasury-analyst',
    prompt: {
      system: 'You are a treasury analyst analyzing cash positions and liquidity.',
      user: `Analyze current cash position and available liquidity.

Current cash position: ${JSON.stringify(args.currentCashPosition)}
Debt facilities: ${JSON.stringify(args.debtFacilities)}

Analyze:
1. Cash Position by Account
   - Operating accounts
   - Concentration accounts
   - Investment accounts
   - Restricted cash
   - Foreign currency positions

2. Bank Balances vs. Book Balances
   - Outstanding deposits
   - Outstanding disbursements
   - Float analysis

3. Available Liquidity
   - Cash on hand
   - Marketable securities
   - Undrawn credit facilities
   - Other liquidity sources
   - Total available liquidity

4. Facility Status
   - Drawn amounts
   - Available capacity
   - Maturity dates
   - Covenant status

5. Restricted Amounts
   - Compensating balances
   - Escrow accounts
   - Regulatory requirements
   - Contract requirements

6. Currency Exposure
   - Cash by currency
   - FX hedging status
   - Repatriation considerations

Output comprehensive liquidity summary.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const forecastCashReceiptsTask = defineTask('forecast-cash-receipts', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'treasury-management' },
  agent: {
    name: 'cash-forecaster',
    prompt: {
      system: 'You are a treasury analyst forecasting cash receipts.',
      user: `Forecast cash receipts for ${args.forecastPeriod}.

Historical cash flows: ${JSON.stringify(args.historicalCashFlows)}
Operating budget: ${JSON.stringify(args.operatingBudget)}

Forecast receipt categories:
1. Customer Collections
   - Projected sales by period
   - Collection patterns (DSO analysis)
   - Customer payment terms
   - Seasonal variations
   - Large customer timing

2. Other Operating Receipts
   - Royalty income
   - Licensing income
   - Service revenue
   - Rental income

3. Financing Receipts
   - Loan proceeds
   - Equity infusions
   - Credit facility draws

4. Investment Receipts
   - Investment maturities
   - Dividend income
   - Interest income
   - Asset sale proceeds

5. Timing Analysis
   - Day of week patterns
   - Month-end patterns
   - Holiday impacts
   - Processing delays

6. Risk Factors
   - Collection risks
   - Customer concentrations
   - Economic factors

Build daily/weekly/monthly receipt forecast.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const forecastCashDisbursementsTask = defineTask('forecast-cash-disbursements', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'treasury-management' },
  agent: {
    name: 'cash-forecaster',
    prompt: {
      system: 'You are a treasury analyst forecasting cash disbursements.',
      user: `Forecast cash disbursements for ${args.forecastPeriod}.

Historical cash flows: ${JSON.stringify(args.historicalCashFlows)}
Operating budget: ${JSON.stringify(args.operatingBudget)}

Forecast disbursement categories:
1. Vendor Payments
   - Scheduled payables
   - Payment terms analysis
   - Early payment discounts
   - Large vendor timing

2. Payroll
   - Regular payroll cycles
   - Bonus payments
   - Commission payments
   - Benefits and taxes

3. Operating Expenses
   - Rent and utilities
   - Insurance premiums
   - Professional services
   - Travel and entertainment

4. Debt Service
   - Principal payments
   - Interest payments
   - Fee payments
   - Covenant-triggered payments

5. Capital Expenditures
   - Approved projects
   - Milestone payments
   - Equipment purchases

6. Tax Payments
   - Estimated taxes
   - Payroll taxes
   - Property taxes
   - Other taxes

7. Dividends
   - Declared dividends
   - Dividend timing

8. Timing Analysis
   - Check clearing patterns
   - ACH timing
   - Wire transfer timing
   - International payments

Build daily/weekly/monthly disbursement forecast.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const consolidateCashForecastTask = defineTask('consolidate-cash-forecast', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'treasury-management' },
  agent: {
    name: 'treasury-manager',
    prompt: {
      system: 'You are a treasury manager consolidating cash forecasts.',
      user: `Consolidate cash forecast from components.

Current position: ${JSON.stringify(args.currentPosition)}
Receipts forecast: ${JSON.stringify(args.receipts)}
Disbursements forecast: ${JSON.stringify(args.disbursements)}

Build consolidated forecast:
1. Daily Forecast (13 weeks)
   - Opening balance
   - Receipts by category
   - Disbursements by category
   - Net cash flow
   - Closing balance

2. Weekly Summary
   - Week-by-week cash flow
   - Cumulative position
   - Minimum daily balance

3. Monthly Forecast (12 months)
   - Monthly cash flows
   - Seasonal patterns
   - Year-over-year comparison

4. Forecast Confidence
   - Certainty levels by line item
   - Committed vs. uncommitted
   - Forecast accuracy history

5. Facility Utilization
   - Projected draws/repayments
   - Available capacity over time
   - Facility cost optimization

6. Key Metrics
   - Days cash on hand
   - Minimum cash coverage
   - Peak funding needs
   - Average daily balance

7. Variance Analysis
   - Actual vs. prior forecast
   - Forecast accuracy tracking
   - Variance explanations

Output comprehensive cash forecast report.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const optimizeWorkingCapitalTask = defineTask('optimize-working-capital', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'working-capital-management' },
  agent: {
    name: 'working-capital-analyst',
    prompt: {
      system: 'You are a working capital analyst identifying optimization opportunities.',
      user: `Analyze and optimize working capital.

Cash forecast: ${JSON.stringify(args.cashForecast)}
Operating budget: ${JSON.stringify(args.operatingBudget)}

Analyze and optimize:
1. Receivables Management
   - Current DSO vs. benchmark
   - Aging analysis
   - Collection improvement opportunities
   - Credit policy optimization
   - Factoring/securitization options

2. Inventory Management
   - Current DIO vs. benchmark
   - Slow-moving inventory
   - Safety stock optimization
   - Supplier lead time improvements

3. Payables Management
   - Current DPO vs. benchmark
   - Payment term negotiation
   - Early payment discount analysis
   - Dynamic discounting opportunities
   - Supply chain finance options

4. Cash Conversion Cycle
   - Current CCC calculation
   - CCC trend analysis
   - Improvement targets
   - Industry comparison

5. Cash Flow Impact
   - Working capital cash flow
   - Seasonal requirements
   - Growth working capital needs

6. Optimization Recommendations
   - Quick wins
   - Medium-term improvements
   - Strategic initiatives
   - ROI analysis for each

Output working capital analysis and recommendations.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const performLiquidityStressTestTask = defineTask('liquidity-stress-test', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'treasury-management' },
  agent: {
    name: 'risk-analyst',
    prompt: {
      system: 'You are a treasury risk analyst performing liquidity stress testing.',
      user: `Perform liquidity stress testing.

Cash forecast: ${JSON.stringify(args.cashForecast)}
Debt facilities: ${JSON.stringify(args.debtFacilities)}

Stress test scenarios:
1. Revenue Decline Scenario
   - 20% revenue decline
   - Delayed collections
   - Impact on cash position
   - Mitigation actions

2. Operating Cost Increase
   - Cost overruns
   - Unexpected expenses
   - Emergency capital needs
   - Cash impact analysis

3. Credit Facility Loss
   - Facility unavailability
   - Covenant breach scenario
   - Alternative funding needs
   - Survival analysis

4. Customer Concentration Risk
   - Top customer loss
   - Collection delays
   - Cash flow impact

5. Combined Stress Scenario
   - Multiple adverse events
   - Cumulative cash impact
   - Survival period analysis

For each scenario:
- Cash flow projections
- Minimum cash point
- Days until crisis
- Liquidity gap amount
- Mitigation strategies
- Contingency actions

6. Contingency Funding Plan
   - Liquidity sources ranking
   - Activation triggers
   - Implementation timeline
   - Communication plan

Output stress test results and contingency plans.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developCashRecommendationsTask = defineTask('develop-cash-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'treasury-management' },
  agent: {
    name: 'treasury-manager',
    prompt: {
      system: 'You are a treasury manager developing cash management recommendations.',
      user: `Develop cash management recommendations.

Forecast: ${JSON.stringify(args.forecast)}
Working capital analysis: ${JSON.stringify(args.workingCapital)}
Stress test results: ${JSON.stringify(args.stressTest)}

Develop recommendations:
1. Short-Term Actions (0-30 days)
   - Daily cash positioning
   - Investment recommendations
   - Borrowing recommendations
   - Payment timing

2. Medium-Term Actions (1-6 months)
   - Working capital improvements
   - Facility management
   - Currency hedging
   - Investment strategy

3. Long-Term Strategy (6+ months)
   - Capital structure optimization
   - Facility renewals/refinancing
   - Cash pooling structures
   - Technology investments

4. Risk Mitigation
   - Liquidity buffer recommendations
   - Facility headroom targets
   - Hedging recommendations
   - Insurance coverage

5. Performance Metrics
   - KPIs to track
   - Targets to achieve
   - Monitoring frequency
   - Reporting requirements

6. Policy Recommendations
   - Investment policy updates
   - Cash management policy
   - Delegation of authority
   - Reporting requirements

Output actionable recommendations with priorities.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
