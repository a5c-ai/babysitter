/**
 * @file economic-forecasting-indicators.js
 * @description Monitoring and analyzing macroeconomic indicators including GDP, inflation, employment, and interest rates for business planning
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Economic Forecasting and Indicator Analysis Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.analysisperiod - Period for economic analysis
 * @param {Object} inputs.businessContext - Company business context and exposure
 * @param {Object} inputs.historicalIndicators - Historical economic indicator data
 * @param {Array} inputs.keyIndicators - Key indicators to monitor
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Economic analysis and forecasts
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Economic Indicator Collection
  const collectionResult = await ctx.task(collectEconomicIndicatorsTask, {
    keyIndicators: inputs.keyIndicators,
    historicalIndicators: inputs.historicalIndicators,
    analysisperiod: inputs.analysisperiod
  });
  results.steps.push({ name: 'indicator-collection', result: collectionResult });

  // Step 2: GDP and Growth Analysis
  const gdpResult = await ctx.task(analyzeGDPGrowthTask, {
    indicators: collectionResult,
    businessContext: inputs.businessContext
  });
  results.steps.push({ name: 'gdp-analysis', result: gdpResult });

  // Step 3: Inflation Analysis
  const inflationResult = await ctx.task(analyzeInflationTask, {
    indicators: collectionResult,
    businessContext: inputs.businessContext
  });
  results.steps.push({ name: 'inflation-analysis', result: inflationResult });

  // Step 4: Employment and Labor Market Analysis
  const laborResult = await ctx.task(analyzeLaborMarketTask, {
    indicators: collectionResult,
    businessContext: inputs.businessContext
  });
  results.steps.push({ name: 'labor-analysis', result: laborResult });

  // Breakpoint for economic review
  await ctx.breakpoint('economic-review', {
    message: 'Review economic indicator analysis before developing forecasts',
    data: { gdp: gdpResult, inflation: inflationResult, labor: laborResult }
  });

  // Step 5: Interest Rate and Monetary Policy Analysis
  const monetaryResult = await ctx.task(analyzeMonetaryPolicyTask, {
    indicators: collectionResult,
    inflationAnalysis: inflationResult
  });
  results.steps.push({ name: 'monetary-analysis', result: monetaryResult });

  // Step 6: Currency and Trade Analysis
  const tradeResult = await ctx.task(analyzeCurrencyAndTradeTask, {
    indicators: collectionResult,
    businessContext: inputs.businessContext
  });
  results.steps.push({ name: 'trade-analysis', result: tradeResult });

  // Step 7: Economic Scenario Development
  const scenarioResult = await ctx.task(developEconomicScenariosTask, {
    allIndicators: {
      gdp: gdpResult,
      inflation: inflationResult,
      labor: laborResult,
      monetary: monetaryResult,
      trade: tradeResult
    }
  });
  results.steps.push({ name: 'scenario-development', result: scenarioResult });

  // Breakpoint for scenario review
  await ctx.breakpoint('scenario-review', {
    message: 'Review economic scenarios before business impact analysis',
    data: scenarioResult
  });

  // Step 8: Business Impact Assessment
  const impactResult = await ctx.task(assessBusinessImpactTask, {
    economicScenarios: scenarioResult,
    businessContext: inputs.businessContext
  });
  results.steps.push({ name: 'business-impact', result: impactResult });

  results.outputs = {
    economicAnalysis: {
      gdp: gdpResult,
      inflation: inflationResult,
      labor: laborResult,
      monetary: monetaryResult,
      trade: tradeResult
    },
    scenarios: scenarioResult,
    businessImpact: impactResult
  };

  return results;
}

// Task definitions
export const collectEconomicIndicatorsTask = defineTask('collect-economic-indicators', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'economic-analysis' },
  agent: {
    name: 'economist',
    prompt: {
      system: 'You are an economist collecting and organizing economic indicator data.',
      user: `Collect economic indicators for ${args.analysisperiod}.

Key indicators: ${JSON.stringify(args.keyIndicators)}
Historical data: ${JSON.stringify(args.historicalIndicators)}

Collect:
1. Output and Growth
   - Real GDP growth rate
   - Industrial production
   - Manufacturing PMI
   - Services PMI
   - Capacity utilization

2. Inflation
   - Consumer Price Index (CPI)
   - Core CPI
   - Producer Price Index (PPI)
   - PCE Price Index
   - Wage inflation

3. Employment
   - Unemployment rate
   - Non-farm payrolls
   - Labor force participation
   - Job openings (JOLTS)
   - Weekly jobless claims

4. Monetary Policy
   - Federal funds rate
   - 10-year Treasury yield
   - 2-10 yield spread
   - Money supply (M2)
   - Fed balance sheet

5. Financial Markets
   - S&P 500 index
   - VIX volatility
   - Credit spreads
   - Dollar index

6. Consumer/Business
   - Consumer confidence
   - Business confidence
   - Retail sales
   - Housing starts

Output organized indicator database.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeGDPGrowthTask = defineTask('analyze-gdp-growth', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'economic-analysis' },
  agent: {
    name: 'growth-analyst',
    prompt: {
      system: 'You are an economist analyzing GDP and economic growth.',
      user: `Analyze GDP and economic growth.

Indicators: ${JSON.stringify(args.indicators)}
Business context: ${JSON.stringify(args.businessContext)}

Analyze:
1. GDP Components
   - Consumer spending
   - Business investment
   - Government spending
   - Net exports
   - Inventory changes

2. Growth Drivers
   - Consumption trends
   - Investment cycles
   - Government policy impact
   - Trade dynamics

3. Leading Indicators
   - PMI signals
   - Consumer confidence
   - Business sentiment
   - Financial conditions

4. Regional Analysis
   - US growth
   - Europe growth
   - China/Asia growth
   - Emerging markets

5. Sector Analysis
   - Manufacturing outlook
   - Services outlook
   - Construction outlook
   - Technology outlook

6. Growth Forecast
   - Near-term (0-6 months)
   - Medium-term (6-18 months)
   - Risks to forecast

Output GDP and growth analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeInflationTask = defineTask('analyze-inflation', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'economic-analysis' },
  agent: {
    name: 'inflation-analyst',
    prompt: {
      system: 'You are an economist analyzing inflation trends.',
      user: `Analyze inflation trends.

Indicators: ${JSON.stringify(args.indicators)}
Business context: ${JSON.stringify(args.businessContext)}

Analyze:
1. Inflation Components
   - Food prices
   - Energy prices
   - Core goods
   - Core services
   - Housing/rent

2. Inflation Drivers
   - Demand-pull factors
   - Cost-push factors
   - Wage pressures
   - Supply chain impacts
   - Commodity prices

3. Inflation Expectations
   - Market-based measures
   - Survey-based measures
   - Breakeven inflation

4. Fed Target Assessment
   - Current vs. target (2%)
   - Core PCE trajectory
   - Fed communication analysis

5. Business Impact
   - Input cost trends
   - Pricing power assessment
   - Margin implications
   - Contract escalations

6. Inflation Forecast
   - Near-term trajectory
   - Medium-term outlook
   - Risks (upside/downside)

Output inflation analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeLaborMarketTask = defineTask('analyze-labor-market', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'economic-analysis' },
  agent: {
    name: 'labor-economist',
    prompt: {
      system: 'You are an economist analyzing labor market conditions.',
      user: `Analyze labor market conditions.

Indicators: ${JSON.stringify(args.indicators)}
Business context: ${JSON.stringify(args.businessContext)}

Analyze:
1. Employment Levels
   - Payroll growth trends
   - Sectoral employment
   - Part-time vs. full-time
   - Hiring rates

2. Unemployment Analysis
   - Unemployment rate trends
   - Underemployment (U-6)
   - Long-term unemployment
   - NAIRU estimate

3. Labor Supply
   - Labor force participation
   - Demographics impact
   - Immigration effects
   - Skills availability

4. Labor Demand
   - Job openings
   - Quits rate
   - Hiring intentions
   - Skills gaps

5. Wage Trends
   - Average hourly earnings
   - Employment cost index
   - Wage growth by sector
   - Real wage growth

6. Business Implications
   - Talent availability
   - Wage pressure forecast
   - Benefits cost trends
   - Productivity outlook

Output labor market analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeMonetaryPolicyTask = defineTask('analyze-monetary-policy', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'economic-analysis' },
  agent: {
    name: 'monetary-analyst',
    prompt: {
      system: 'You are an economist analyzing monetary policy and interest rates.',
      user: `Analyze monetary policy and interest rates.

Indicators: ${JSON.stringify(args.indicators)}
Inflation analysis: ${JSON.stringify(args.inflationAnalysis)}

Analyze:
1. Federal Reserve Policy
   - Current stance
   - Recent communications
   - Dot plot analysis
   - Forward guidance

2. Interest Rate Environment
   - Fed funds rate
   - Short-term rates
   - Long-term rates
   - Real rates
   - Yield curve shape

3. Policy Tools
   - Rate decisions
   - Quantitative tightening/easing
   - Balance sheet policy
   - Forward guidance

4. Market Expectations
   - Fed funds futures
   - Expected rate path
   - Terminal rate estimate
   - Timing of changes

5. Global Central Banks
   - ECB policy
   - BOJ policy
   - BOE policy
   - Divergence analysis

6. Rate Forecast
   - Short-term rate outlook
   - Long-term rate outlook
   - Policy pivot timing
   - Risk scenarios

Output monetary policy analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeCurrencyAndTradeTask = defineTask('analyze-currency-trade', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'economic-analysis' },
  agent: {
    name: 'trade-economist',
    prompt: {
      system: 'You are an economist analyzing currency and trade dynamics.',
      user: `Analyze currency and trade dynamics.

Indicators: ${JSON.stringify(args.indicators)}
Business context: ${JSON.stringify(args.businessContext)}

Analyze:
1. Currency Trends
   - Dollar index trends
   - Major currency pairs
   - Emerging market currencies
   - Real effective exchange rates

2. Currency Drivers
   - Interest rate differentials
   - Growth differentials
   - Trade balances
   - Capital flows
   - Risk sentiment

3. Trade Analysis
   - Trade balance trends
   - Export/import volumes
   - Trade policy developments
   - Supply chain dynamics

4. Commodity Markets
   - Oil prices
   - Natural gas
   - Industrial metals
   - Agricultural commodities

5. Geopolitical Factors
   - Trade tensions
   - Sanctions impact
   - Regional developments
   - Policy uncertainty

6. Business Implications
   - FX exposure impact
   - Export competitiveness
   - Import costs
   - Hedging recommendations

Output currency and trade analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developEconomicScenariosTask = defineTask('develop-economic-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'scenario-planning' },
  agent: {
    name: 'scenario-economist',
    prompt: {
      system: 'You are an economist developing economic scenarios for business planning.',
      user: `Develop economic scenarios.

All indicator analysis: ${JSON.stringify(args.allIndicators)}

Develop scenarios:
1. Base Case (Most Likely)
   - GDP growth assumption
   - Inflation assumption
   - Interest rate assumption
   - Employment assumption
   - Currency assumption
   - Probability weighting

2. Upside Case (Strong Growth)
   - Growth acceleration drivers
   - Inflation implications
   - Policy response
   - Market implications
   - Probability weighting

3. Downside Case (Recession)
   - Recession triggers
   - Severity assessment
   - Policy response
   - Recovery timeline
   - Probability weighting

4. Stagflation Scenario
   - Inflation persistence
   - Growth weakness
   - Policy dilemma
   - Duration estimate

5. Scenario Comparison
   - Key metrics by scenario
   - Timing differences
   - Policy responses
   - Market implications

6. Scenario Indicators
   - Early warning signs
   - Monitoring triggers
   - Decision points

Output economic scenario framework.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const assessBusinessImpactTask = defineTask('assess-business-impact', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'business-analysis' },
  agent: {
    name: 'business-economist',
    prompt: {
      system: 'You are a business economist assessing economic impact on company performance.',
      user: `Assess business impact of economic scenarios.

Economic scenarios: ${JSON.stringify(args.economicScenarios)}
Business context: ${JSON.stringify(args.businessContext)}

Assess:
1. Revenue Impact
   - Volume sensitivity to GDP
   - Price sensitivity to inflation
   - Geographic exposure
   - Customer segment impact

2. Cost Impact
   - Labor cost sensitivity
   - Material cost sensitivity
   - Energy cost exposure
   - Currency impact on costs

3. Margin Impact
   - Pricing power assessment
   - Cost pass-through ability
   - Operating leverage effect

4. Capital Impact
   - Interest expense sensitivity
   - Borrowing cost impact
   - Investment return impact
   - Working capital needs

5. Strategic Implications
   - Growth investment timing
   - M&A environment
   - Competitive dynamics
   - Geographic strategy

6. Risk Mitigation
   - Hedging recommendations
   - Operational flexibility
   - Scenario planning actions
   - Contingency triggers

7. Planning Assumptions
   - Recommended planning assumptions
   - Sensitivity ranges
   - Update frequency

Output business impact assessment.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
