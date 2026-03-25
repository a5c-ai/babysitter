/**
 * @file rolling-forecast-management.js
 * @description Continuous forecasting methodology that extends the planning horizon each period to maintain a constant forward-looking view of financial performance
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Rolling Forecast Management Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.currentPeriod - Current reporting period
 * @param {number} inputs.forecastHorizon - Number of periods to forecast (e.g., 12, 18, 24 months)
 * @param {Object} inputs.actualResults - Year-to-date actual financial results
 * @param {Object} inputs.priorForecast - Previous rolling forecast for comparison
 * @param {Object} inputs.businessDrivers - Key business drivers and KPIs
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Updated rolling forecast
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Gather and Validate Actual Results
  const actualsResult = await ctx.task(gatherActualsTask, {
    currentPeriod: inputs.currentPeriod,
    actualResults: inputs.actualResults,
    priorForecast: inputs.priorForecast
  });
  results.steps.push({ name: 'gather-actuals', result: actualsResult });

  // Step 2: Analyze Forecast-to-Actual Variances
  const varianceResult = await ctx.task(analyzeVariancesTask, {
    actuals: actualsResult,
    priorForecast: inputs.priorForecast
  });
  results.steps.push({ name: 'variance-analysis', result: varianceResult });

  // Breakpoint for variance review
  await ctx.breakpoint('variance-review', {
    message: 'Review forecast-to-actual variances and identify drivers before updating assumptions',
    data: varianceResult
  });

  // Step 3: Update Business Drivers and Assumptions
  const driversResult = await ctx.task(updateDriversTask, {
    businessDrivers: inputs.businessDrivers,
    varianceAnalysis: varianceResult,
    currentPeriod: inputs.currentPeriod
  });
  results.steps.push({ name: 'update-drivers', result: driversResult });

  // Step 4: Generate Driver-Based Forecast
  const forecastResult = await ctx.task(generateForecastTask, {
    updatedDrivers: driversResult,
    forecastHorizon: inputs.forecastHorizon,
    actualsToDate: actualsResult
  });
  results.steps.push({ name: 'generate-forecast', result: forecastResult });

  // Step 5: Scenario Analysis
  const scenarioResult = await ctx.task(runScenarioAnalysisTask, {
    baseForecast: forecastResult,
    businessDrivers: driversResult
  });
  results.steps.push({ name: 'scenario-analysis', result: scenarioResult });

  // Breakpoint for management review
  await ctx.breakpoint('management-review', {
    message: 'Review rolling forecast and scenarios before finalization',
    data: { forecast: forecastResult, scenarios: scenarioResult }
  });

  // Step 6: Finalize and Distribute Forecast
  const distributionResult = await ctx.task(finalizeAndDistributeTask, {
    forecast: forecastResult,
    scenarios: scenarioResult,
    currentPeriod: inputs.currentPeriod
  });
  results.steps.push({ name: 'finalize-distribute', result: distributionResult });

  results.outputs = {
    rollingForecast: forecastResult,
    scenarios: scenarioResult,
    forecastPeriod: inputs.currentPeriod,
    horizon: inputs.forecastHorizon
  };

  return results;
}

// Task definitions
export const gatherActualsTask = defineTask('gather-actuals', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-reporting' },
  agent: {
    name: 'reporting-analyst',
    prompt: {
      system: 'You are a financial reporting analyst responsible for gathering and validating actual financial results for forecasting purposes.',
      user: `Gather and validate actual results for period ${args.currentPeriod}.

Actual results provided: ${JSON.stringify(args.actualResults)}
Prior forecast for comparison: ${JSON.stringify(args.priorForecast)}

Tasks:
1. Validate completeness of actual results
2. Normalize any one-time items or adjustments
3. Identify any late-breaking actuals or estimates
4. Reconcile to official financial close
5. Flag any data quality issues
6. Prepare clean actuals dataset for forecasting

Output structured actual results ready for variance analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeVariancesTask = defineTask('analyze-forecast-variances', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-analysis' },
  agent: {
    name: 'fp-analyst',
    prompt: {
      system: 'You are an FP&A analyst specializing in variance analysis and root cause identification.',
      user: `Analyze variances between actuals and prior forecast.

Actual results: ${JSON.stringify(args.actuals)}
Prior forecast: ${JSON.stringify(args.priorForecast)}

Perform:
1. Calculate variance by line item (amount and %)
2. Identify favorable vs unfavorable variances
3. Determine root causes for material variances
4. Categorize variances (timing, volume, price, mix, etc.)
5. Assess which variances are one-time vs recurring
6. Identify trends and patterns
7. Recommend forecast adjustments based on learnings

Prioritize analysis on material variances and key business drivers.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const updateDriversTask = defineTask('update-business-drivers', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-planning' },
  agent: {
    name: 'planning-analyst',
    prompt: {
      system: 'You are a financial planning analyst who maintains and updates key business drivers for forecasting.',
      user: `Update business drivers and assumptions based on current period learnings.

Current drivers: ${JSON.stringify(args.businessDrivers)}
Variance analysis insights: ${JSON.stringify(args.varianceAnalysis)}
Current period: ${args.currentPeriod}

Update:
1. Revenue drivers (volume, price, mix, growth rates)
2. Cost drivers (unit costs, inflation, productivity)
3. Operational KPIs (conversion rates, churn, utilization)
4. Macro assumptions (FX rates, interest rates, commodity prices)
5. Timing assumptions (seasonality, project milestones)
6. Resource assumptions (headcount, capacity)

Document rationale for each driver change and data sources used.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const generateForecastTask = defineTask('generate-rolling-forecast', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-modeling' },
  agent: {
    name: 'forecast-modeler',
    prompt: {
      system: 'You are a financial modeler specializing in driver-based rolling forecasts.',
      user: `Generate rolling forecast for the next ${args.forecastHorizon} periods.

Updated drivers: ${JSON.stringify(args.updatedDrivers)}
Actuals to date: ${JSON.stringify(args.actualsToDate)}

Build forecast including:
1. Income statement by month/quarter
2. Balance sheet projections
3. Cash flow forecast
4. Key operational metrics
5. Headcount projections
6. Capital expenditure forecast
7. Working capital projections

Ensure:
- Drivers flow through consistently to financials
- Seasonality patterns are properly applied
- Phasing is realistic and achievable
- All three financial statements tie together`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const runScenarioAnalysisTask = defineTask('run-scenario-analysis', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-modeling' },
  agent: {
    name: 'scenario-analyst',
    prompt: {
      system: 'You are a financial analyst specializing in scenario planning and sensitivity analysis.',
      user: `Develop scenario analysis around the base forecast.

Base forecast: ${JSON.stringify(args.baseForecast)}
Key drivers: ${JSON.stringify(args.businessDrivers)}

Create scenarios:
1. Base case (current forecast)
2. Upside case (+10-20% on key drivers)
3. Downside case (-10-20% on key drivers)
4. Stress test (severe adverse conditions)

For each scenario:
- Define driver assumptions
- Generate P&L, balance sheet, and cash flow
- Calculate key metrics (revenue, EBITDA, cash position)
- Identify trigger points for management action
- Recommend contingency plans

Present scenarios in comparable format with variance analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const finalizeAndDistributeTask = defineTask('finalize-and-distribute', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'executive-reporting' },
  agent: {
    name: 'reporting-analyst',
    prompt: {
      system: 'You are a financial reporting analyst responsible for finalizing and distributing rolling forecasts to stakeholders.',
      user: `Finalize rolling forecast for period ${args.currentPeriod} and prepare distribution package.

Forecast: ${JSON.stringify(args.forecast)}
Scenarios: ${JSON.stringify(args.scenarios)}

Prepare:
1. Executive summary with key changes from prior forecast
2. Full-year outlook summary
3. Quarter-by-quarter projections
4. Key risk and opportunity highlights
5. Scenario comparison summary
6. Action items and recommendations
7. Detailed supporting schedules

Create distribution packages for:
- Executive leadership (high-level summary)
- Department heads (relevant details)
- Board/investors (if applicable)
- Finance team (full detail)

Include commentary on significant changes and drivers.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
