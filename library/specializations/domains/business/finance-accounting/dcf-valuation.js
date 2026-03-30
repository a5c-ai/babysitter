/**
 * @file dcf-valuation.js
 * @description Building comprehensive DCF models including free cash flow projections, WACC calculation, terminal value estimation, and sensitivity analysis
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Discounted Cash Flow (DCF) Valuation Process
 * @param {Object} inputs - Process inputs
 * @param {Object} inputs.targetCompany - Company being valued
 * @param {Object} inputs.historicalFinancials - Historical financial data
 * @param {Object} inputs.projections - Management projections or assumptions
 * @param {Object} inputs.marketData - Market data for WACC calculation
 * @param {string} inputs.valuationDate - As-of date for valuation
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} DCF valuation results
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Historical Financial Analysis
  const historicalResult = await ctx.task(analyzeHistoricalFinancialsTask, {
    targetCompany: inputs.targetCompany,
    historicalFinancials: inputs.historicalFinancials
  });
  results.steps.push({ name: 'historical-analysis', result: historicalResult });

  // Step 2: Revenue and Growth Projections
  const revenueResult = await ctx.task(projectRevenueTask, {
    historicalAnalysis: historicalResult,
    managementProjections: inputs.projections,
    targetCompany: inputs.targetCompany
  });
  results.steps.push({ name: 'revenue-projections', result: revenueResult });

  // Step 3: Cost Structure and Margin Projections
  const costResult = await ctx.task(projectCostsTask, {
    revenueProjections: revenueResult,
    historicalAnalysis: historicalResult
  });
  results.steps.push({ name: 'cost-projections', result: costResult });

  // Breakpoint for projection review
  await ctx.breakpoint('projection-review', {
    message: 'Review revenue and cost projections before building free cash flow',
    data: { revenue: revenueResult, costs: costResult }
  });

  // Step 4: Free Cash Flow Projections
  const fcfResult = await ctx.task(projectFreeCashFlowTask, {
    revenueProjections: revenueResult,
    costProjections: costResult,
    historicalAnalysis: historicalResult
  });
  results.steps.push({ name: 'fcf-projections', result: fcfResult });

  // Step 5: WACC Calculation
  const waccResult = await ctx.task(calculateWACCTask, {
    marketData: inputs.marketData,
    targetCompany: inputs.targetCompany,
    valuationDate: inputs.valuationDate
  });
  results.steps.push({ name: 'wacc-calculation', result: waccResult });

  // Step 6: Terminal Value Estimation
  const terminalValueResult = await ctx.task(estimateTerminalValueTask, {
    fcfProjections: fcfResult,
    wacc: waccResult,
    targetCompany: inputs.targetCompany
  });
  results.steps.push({ name: 'terminal-value', result: terminalValueResult });

  // Breakpoint for WACC and terminal value review
  await ctx.breakpoint('valuation-inputs-review', {
    message: 'Review WACC and terminal value assumptions before calculating enterprise value',
    data: { wacc: waccResult, terminalValue: terminalValueResult }
  });

  // Step 7: Enterprise Value Calculation
  const enterpriseValueResult = await ctx.task(calculateEnterpriseValueTask, {
    fcfProjections: fcfResult,
    terminalValue: terminalValueResult,
    wacc: waccResult,
    valuationDate: inputs.valuationDate
  });
  results.steps.push({ name: 'enterprise-value', result: enterpriseValueResult });

  // Step 8: Equity Value Derivation
  const equityValueResult = await ctx.task(deriveEquityValueTask, {
    enterpriseValue: enterpriseValueResult,
    targetCompany: inputs.targetCompany
  });
  results.steps.push({ name: 'equity-value', result: equityValueResult });

  // Step 9: Sensitivity Analysis
  const sensitivityResult = await ctx.task(performSensitivityAnalysisTask, {
    dcfModel: {
      fcf: fcfResult,
      wacc: waccResult,
      terminalValue: terminalValueResult,
      enterpriseValue: enterpriseValueResult
    }
  });
  results.steps.push({ name: 'sensitivity-analysis', result: sensitivityResult });

  results.outputs = {
    enterpriseValue: enterpriseValueResult,
    equityValue: equityValueResult,
    sensitivityAnalysis: sensitivityResult,
    valuationDate: inputs.valuationDate
  };

  return results;
}

// Task definitions
export const analyzeHistoricalFinancialsTask = defineTask('analyze-historical-financials', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-analysis' },
  agent: {
    name: 'valuation-analyst',
    prompt: {
      system: 'You are a valuation analyst analyzing historical financials for DCF modeling.',
      user: `Analyze historical financials for DCF valuation.

Target company: ${JSON.stringify(args.targetCompany)}
Historical financials: ${JSON.stringify(args.historicalFinancials)}

Analyze:
1. Revenue Analysis
   - Revenue by segment/geography
   - Historical growth rates
   - Revenue drivers
   - Seasonality patterns

2. Profitability Analysis
   - Gross margin trends
   - Operating margin trends
   - EBITDA margin trends
   - Net margin trends
   - Margin drivers

3. Balance Sheet Analysis
   - Working capital trends
   - Fixed asset intensity
   - Capital structure
   - Returns on capital

4. Cash Flow Analysis
   - Operating cash flow
   - Capital expenditure patterns
   - Free cash flow conversion
   - Cash flow quality

5. Key Ratios
   - Growth rates (CAGR)
   - Margin percentages
   - Return metrics (ROE, ROIC)
   - Asset turnover
   - Working capital days

6. Normalization Adjustments
   - Non-recurring items
   - Accounting changes
   - Restructuring costs
   - M&A impacts

Output historical financial analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const projectRevenueTask = defineTask('project-revenue', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-modeling' },
  agent: {
    name: 'projection-analyst',
    prompt: {
      system: 'You are a financial analyst developing revenue projections for DCF valuation.',
      user: `Develop revenue projections.

Historical analysis: ${JSON.stringify(args.historicalAnalysis)}
Management projections: ${JSON.stringify(args.managementProjections)}
Target company: ${JSON.stringify(args.targetCompany)}

Project revenue:
1. Revenue Build-Up
   By segment/product/geography:
   - Volume assumptions
   - Pricing assumptions
   - Market share assumptions
   - New product launches

2. Growth Rate Assumptions
   - Near-term growth (Years 1-3)
   - Medium-term growth (Years 4-5)
   - Convergence to steady state

3. Market Analysis
   - Total addressable market
   - Market growth rates
   - Competitive dynamics
   - Penetration assumptions

4. Revenue Drivers
   - Customer acquisition
   - Customer retention
   - ARPU/contract value
   - Capacity utilization

5. Risk Factors
   - Downside scenarios
   - Competition risk
   - Market risk
   - Execution risk

6. Projection Period
   - 5-10 year explicit forecast
   - Justify projection length
   - Path to steady state

Output detailed revenue projections by year.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const projectCostsTask = defineTask('project-costs', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-modeling' },
  agent: {
    name: 'projection-analyst',
    prompt: {
      system: 'You are a financial analyst projecting cost structure for DCF valuation.',
      user: `Project cost structure and margins.

Revenue projections: ${JSON.stringify(args.revenueProjections)}
Historical analysis: ${JSON.stringify(args.historicalAnalysis)}

Project costs:
1. Cost of Revenue
   - Variable costs
   - Fixed cost components
   - Gross margin trajectory
   - Scale benefits

2. Operating Expenses
   - R&D expense
   - Sales and marketing
   - General and administrative
   - Operating leverage

3. Margin Projections
   - Gross margin by year
   - Operating margin by year
   - EBITDA margin by year
   - Margin expansion assumptions

4. Fixed vs. Variable
   - Fixed cost base
   - Variable cost ratios
   - Step function costs
   - Semi-variable costs

5. Cost Drivers
   - Inflation assumptions
   - Headcount growth
   - Wage inflation
   - Productivity improvements

6. Normalization
   - One-time costs
   - Investment period costs
   - Steady-state cost structure

Output detailed cost projections and margin forecast.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const projectFreeCashFlowTask = defineTask('project-free-cash-flow', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-modeling' },
  agent: {
    name: 'dcf-modeler',
    prompt: {
      system: 'You are a DCF modeler building free cash flow projections.',
      user: `Project unlevered free cash flow.

Revenue projections: ${JSON.stringify(args.revenueProjections)}
Cost projections: ${JSON.stringify(args.costProjections)}
Historical analysis: ${JSON.stringify(args.historicalAnalysis)}

Build FCF projections:
1. EBIT Calculation
   - Revenue
   - Cost of revenue
   - Operating expenses
   - Operating income (EBIT)

2. Tax Adjustment
   - EBIT
   - Tax rate assumption
   - NOPAT (EBIT * (1 - tax rate))

3. Depreciation and Amortization
   - D&A from historical trends
   - Link to capex
   - Intangible amortization

4. Capital Expenditures
   - Maintenance capex
   - Growth capex
   - Capex as % of revenue
   - Capex/D&A ratio

5. Working Capital Changes
   - Days sales outstanding
   - Days inventory outstanding
   - Days payables outstanding
   - Net working capital change

6. Unlevered Free Cash Flow
   NOPAT
   + Depreciation & Amortization
   - Capital Expenditures
   - Change in Working Capital
   = Unlevered Free Cash Flow

7. FCF Schedule
   - Year-by-year FCF
   - FCF conversion analysis
   - Mid-year convention adjustment

Output detailed FCF projections.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const calculateWACCTask = defineTask('calculate-wacc', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'corporate-finance' },
  agent: {
    name: 'wacc-analyst',
    prompt: {
      system: 'You are a corporate finance analyst calculating weighted average cost of capital.',
      user: `Calculate WACC as of ${args.valuationDate}.

Market data: ${JSON.stringify(args.marketData)}
Target company: ${JSON.stringify(args.targetCompany)}

Calculate WACC components:
1. Cost of Equity (CAPM)
   - Risk-free rate (source and rationale)
   - Beta (raw, adjusted, relevered)
   - Equity risk premium
   - Size premium (if applicable)
   - Country risk premium (if applicable)
   - Cost of equity calculation

2. Beta Analysis
   - Historical beta
   - Industry beta
   - Unlevered beta
   - Target capital structure beta

3. Cost of Debt
   - Current debt yield
   - Credit spread
   - Synthetic rating approach
   - Pre-tax cost of debt
   - After-tax cost of debt

4. Capital Structure
   - Market value of equity
   - Market value of debt
   - Target capital structure
   - Weights for WACC

5. WACC Calculation
   WACC = (E/V * Re) + (D/V * Rd * (1-T))
   - Show calculation
   - Sensitivities to inputs

6. Validation
   - Comparison to peers
   - Reasonableness check
   - Sensitivity to assumptions

Output detailed WACC calculation.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const estimateTerminalValueTask = defineTask('estimate-terminal-value', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'valuation' },
  agent: {
    name: 'valuation-analyst',
    prompt: {
      system: 'You are a valuation analyst estimating terminal value.',
      user: `Estimate terminal value.

FCF projections: ${JSON.stringify(args.fcfProjections)}
WACC: ${JSON.stringify(args.wacc)}
Target company: ${JSON.stringify(args.targetCompany)}

Calculate terminal value:
1. Perpetuity Growth Method
   Terminal Value = FCF(n+1) / (WACC - g)
   - Terminal year FCF
   - Perpetual growth rate assumption
   - Justification for growth rate
   - Terminal value calculation

2. Exit Multiple Method
   Terminal Value = EBITDA(n) * Exit Multiple
   - Terminal year EBITDA
   - Exit multiple assumption
   - Comparable transaction support
   - Terminal value calculation

3. Growth Rate Considerations
   - GDP growth
   - Inflation
   - Industry growth
   - Company-specific factors
   - Sustainable growth analysis

4. Steady State Assumptions
   - Reinvestment rate
   - Return on invested capital
   - Growth/ROIC relationship
   - Capital intensity

5. Sanity Checks
   - Implied exit multiple (if using perpetuity)
   - Implied perpetual growth (if using multiple)
   - Terminal value as % of total
   - Reasonableness assessment

6. Method Selection
   - Primary method
   - Cross-check method
   - Weighted average if appropriate

Output terminal value with supporting analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const calculateEnterpriseValueTask = defineTask('calculate-enterprise-value', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'valuation' },
  agent: {
    name: 'dcf-modeler',
    prompt: {
      system: 'You are a DCF modeler calculating enterprise value.',
      user: `Calculate enterprise value as of ${args.valuationDate}.

FCF projections: ${JSON.stringify(args.fcfProjections)}
Terminal value: ${JSON.stringify(args.terminalValue)}
WACC: ${JSON.stringify(args.wacc)}

Calculate enterprise value:
1. Present Value of FCF
   - Discount each year's FCF
   - Apply mid-year convention
   - Sum of PV of projected FCF

2. Present Value of Terminal Value
   - Discount terminal value
   - Apply appropriate convention
   - PV of terminal value

3. Enterprise Value
   - PV of projected FCF
   - + PV of terminal value
   - = Enterprise Value

4. Value Attribution
   - % from projection period
   - % from terminal value
   - Year-by-year contribution

5. Implied Multiples
   - EV/Revenue (current year)
   - EV/EBITDA (current year)
   - EV/FCF
   - Compare to market

6. Valuation Summary
   - Enterprise value range
   - Key value drivers
   - Model sensitivities

Output enterprise value calculation.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const deriveEquityValueTask = defineTask('derive-equity-value', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'valuation' },
  agent: {
    name: 'valuation-analyst',
    prompt: {
      system: 'You are a valuation analyst deriving equity value from enterprise value.',
      user: `Derive equity value.

Enterprise value: ${JSON.stringify(args.enterpriseValue)}
Target company: ${JSON.stringify(args.targetCompany)}

Calculate equity value:
1. Bridge from EV to Equity
   Enterprise Value
   - Total debt
   - Preferred equity
   - Minority interest
   + Cash and equivalents
   + Non-operating assets
   +/- Other adjustments
   = Equity Value

2. Debt and Debt-Like Items
   - Short-term debt
   - Long-term debt
   - Capital leases
   - Pension obligations
   - Other debt-like items

3. Cash and Investments
   - Cash and equivalents
   - Marketable securities
   - Trapped cash considerations

4. Non-Operating Assets
   - Excess real estate
   - Non-core investments
   - Tax assets

5. Per Share Value
   - Equity value
   - Diluted shares outstanding
   - Options/warrants (treasury method)
   - Convertible securities
   - Equity value per share

6. Valuation Summary
   - Enterprise value
   - Equity value
   - Per share value
   - Premium/discount to market

Output equity value derivation.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const performSensitivityAnalysisTask = defineTask('dcf-sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-analysis' },
  agent: {
    name: 'sensitivity-analyst',
    prompt: {
      system: 'You are a financial analyst performing sensitivity analysis on DCF valuations.',
      user: `Perform sensitivity analysis on DCF model.

DCF model components: ${JSON.stringify(args.dcfModel)}

Perform analyses:
1. WACC/Growth Sensitivity
   - Matrix: WACC vs. perpetual growth
   - Range: WACC +/- 100bps
   - Range: Growth +/- 50bps
   - Enterprise value for each combination

2. Revenue/Margin Sensitivity
   - Matrix: Revenue growth vs. EBITDA margin
   - Impact on enterprise value
   - Identify value drivers

3. Single Variable Sensitivity
   - Revenue growth rate
   - EBITDA margin
   - WACC
   - Terminal growth rate
   - Tax rate
   - Capex/Revenue

4. Scenario Analysis
   - Base case value
   - Upside case (+20% key drivers)
   - Downside case (-20% key drivers)
   - Management case vs. analyst case

5. Football Field
   - DCF range
   - Comparable company range
   - Precedent transaction range
   - 52-week trading range

6. Key Takeaways
   - Most sensitive variables
   - Value range
   - Investment recommendation implications

Output comprehensive sensitivity analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
