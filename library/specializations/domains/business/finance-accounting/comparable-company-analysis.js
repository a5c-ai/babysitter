/**
 * @file comparable-company-analysis.js
 * @description Valuation using public company trading multiples including peer selection, metric normalization, and multiple application
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Comparable Company Analysis Process
 * @param {Object} inputs - Process inputs
 * @param {Object} inputs.targetCompany - Company being valued
 * @param {Object} inputs.targetFinancials - Target company financial data
 * @param {Object} inputs.marketData - Current market data
 * @param {string} inputs.valuationDate - As-of date for valuation
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Comparable company valuation results
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Define Selection Criteria
  const criteriaResult = await ctx.task(defineSelectionCriteriaTask, {
    targetCompany: inputs.targetCompany,
    targetFinancials: inputs.targetFinancials
  });
  results.steps.push({ name: 'selection-criteria', result: criteriaResult });

  // Step 2: Identify Peer Companies
  const peerResult = await ctx.task(identifyPeerCompaniesTask, {
    targetCompany: inputs.targetCompany,
    selectionCriteria: criteriaResult,
    marketData: inputs.marketData
  });
  results.steps.push({ name: 'peer-identification', result: peerResult });

  // Breakpoint for peer review
  await ctx.breakpoint('peer-review', {
    message: 'Review and approve peer company selection before gathering data',
    data: peerResult
  });

  // Step 3: Gather Peer Financial Data
  const peerDataResult = await ctx.task(gatherPeerDataTask, {
    peerCompanies: peerResult,
    valuationDate: inputs.valuationDate
  });
  results.steps.push({ name: 'peer-data-gathering', result: peerDataResult });

  // Step 4: Normalize Financial Metrics
  const normalizedResult = await ctx.task(normalizeMetricsTask, {
    peerData: peerDataResult,
    targetFinancials: inputs.targetFinancials
  });
  results.steps.push({ name: 'metric-normalization', result: normalizedResult });

  // Step 5: Calculate Trading Multiples
  const multiplesResult = await ctx.task(calculateTradingMultiplesTask, {
    normalizedData: normalizedResult,
    marketData: inputs.marketData,
    valuationDate: inputs.valuationDate
  });
  results.steps.push({ name: 'trading-multiples', result: multiplesResult });

  // Breakpoint for multiple review
  await ctx.breakpoint('multiples-review', {
    message: 'Review trading multiples before applying to target company',
    data: multiplesResult
  });

  // Step 6: Benchmark and Select Multiples
  const benchmarkResult = await ctx.task(benchmarkAndSelectMultiplesTask, {
    tradingMultiples: multiplesResult,
    targetCompany: inputs.targetCompany
  });
  results.steps.push({ name: 'multiple-selection', result: benchmarkResult });

  // Step 7: Apply Multiples to Target
  const valuationResult = await ctx.task(applyMultiplesToTargetTask, {
    selectedMultiples: benchmarkResult,
    targetFinancials: inputs.targetFinancials,
    normalizedData: normalizedResult
  });
  results.steps.push({ name: 'valuation-application', result: valuationResult });

  // Step 8: Prepare Valuation Summary
  const summaryResult = await ctx.task(prepareValuationSummaryTask, {
    valuationResults: valuationResult,
    multiplesAnalysis: multiplesResult,
    targetCompany: inputs.targetCompany,
    valuationDate: inputs.valuationDate
  });
  results.steps.push({ name: 'valuation-summary', result: summaryResult });

  results.outputs = {
    peerAnalysis: multiplesResult,
    valuationRange: valuationResult,
    summary: summaryResult,
    valuationDate: inputs.valuationDate
  };

  return results;
}

// Task definitions
export const defineSelectionCriteriaTask = defineTask('define-selection-criteria', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'valuation' },
  agent: {
    name: 'comp-analyst',
    prompt: {
      system: 'You are a valuation analyst defining comparable company selection criteria.',
      user: `Define peer company selection criteria.

Target company: ${JSON.stringify(args.targetCompany)}
Target financials: ${JSON.stringify(args.targetFinancials)}

Define criteria:
1. Industry Classification
   - Primary SIC/NAICS codes
   - Sub-industry focus
   - Business model similarity

2. Business Characteristics
   - Products/services offered
   - Customer segments
   - Geographic markets
   - Distribution channels

3. Financial Profile
   - Revenue range
   - Growth profile
   - Profitability range
   - Capital intensity

4. Size Parameters
   - Market capitalization range
   - Revenue range
   - Enterprise value range

5. Geographic Focus
   - Domestic vs. international
   - Regional considerations
   - Currency considerations

6. Stage of Development
   - Mature vs. growth stage
   - Profitability status
   - Investment phase

7. Priority Ranking
   - Must-have criteria
   - Nice-to-have criteria
   - Flexibility parameters

Output selection criteria framework.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const identifyPeerCompaniesTask = defineTask('identify-peer-companies', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'equity-research' },
  agent: {
    name: 'peer-analyst',
    prompt: {
      system: 'You are an analyst identifying comparable public companies.',
      user: `Identify peer companies for comparable analysis.

Target company: ${JSON.stringify(args.targetCompany)}
Selection criteria: ${JSON.stringify(args.selectionCriteria)}
Market data: ${JSON.stringify(args.marketData)}

Identify peers:
1. Initial Universe
   - Industry competitors
   - Companies with similar business models
   - Companies mentioned by target in filings
   - Analyst-identified peers

2. Screening Process
   - Apply selection criteria
   - Filter by size
   - Filter by geography
   - Filter by business mix

3. Peer Assessment
   For each potential peer:
   - Company overview
   - Business description
   - Financial profile
   - Comparability score
   - Key differences from target

4. Final Peer Group
   - Primary peers (most comparable)
   - Secondary peers (somewhat comparable)
   - Rationale for inclusion/exclusion

5. Peer Group Characteristics
   - Average/median size
   - Average/median growth
   - Average/median profitability
   - Geographic mix

6. Limitations
   - Comparability limitations
   - Data availability issues
   - Recent events affecting peers

Output peer company list with rationale.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const gatherPeerDataTask = defineTask('gather-peer-data', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-research' },
  agent: {
    name: 'data-analyst',
    prompt: {
      system: 'You are a financial data analyst gathering peer company information.',
      user: `Gather financial data for peer companies as of ${args.valuationDate}.

Peer companies: ${JSON.stringify(args.peerCompanies)}

Gather for each peer:
1. Market Data
   - Current stock price
   - Shares outstanding (basic and diluted)
   - Market capitalization
   - Enterprise value components

2. Income Statement Data
   - Revenue (LTM and forward)
   - Gross profit and margin
   - EBITDA (LTM and forward)
   - EBIT
   - Net income

3. Balance Sheet Data
   - Total debt
   - Cash and equivalents
   - Minority interest
   - Preferred equity

4. Cash Flow Data
   - Operating cash flow
   - Capital expenditures
   - Free cash flow

5. Growth Metrics
   - Historical revenue growth
   - Projected revenue growth
   - EBITDA growth

6. Quality Metrics
   - Revenue quality
   - Earnings quality
   - Recent one-time items

7. Data Sources
   - Public filings
   - Consensus estimates
   - Data providers

Output comprehensive peer data set.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const normalizeMetricsTask = defineTask('normalize-metrics', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-analysis' },
  agent: {
    name: 'normalization-analyst',
    prompt: {
      system: 'You are a financial analyst normalizing metrics for comparability.',
      user: `Normalize financial metrics for peer comparison.

Peer data: ${JSON.stringify(args.peerData)}
Target financials: ${JSON.stringify(args.targetFinancials)}

Normalize:
1. EBITDA Adjustments
   For each company:
   - Stock-based compensation
   - Restructuring charges
   - Acquisition-related costs
   - Non-recurring items
   - Adjusted EBITDA

2. Revenue Normalization
   - One-time revenue items
   - Accounting differences
   - Pro forma adjustments

3. Balance Sheet Adjustments
   - Operating leases
   - Pension obligations
   - Minority interest treatment
   - Excess cash identification

4. Calendarization
   - Align fiscal year ends
   - LTM calculations
   - NTM estimates

5. Currency Adjustments
   - Convert to common currency
   - FX rate assumptions

6. Pro Forma Adjustments
   - Recent acquisitions
   - Recent divestitures
   - Pending transactions

7. Documentation
   - All adjustments made
   - Rationale for each
   - Data sources

Output normalized financial data.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const calculateTradingMultiplesTask = defineTask('calculate-trading-multiples', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'valuation' },
  agent: {
    name: 'multiples-analyst',
    prompt: {
      system: 'You are a valuation analyst calculating trading multiples.',
      user: `Calculate trading multiples as of ${args.valuationDate}.

Normalized data: ${JSON.stringify(args.normalizedData)}
Market data: ${JSON.stringify(args.marketData)}

Calculate multiples:
1. Enterprise Value Multiples
   - EV/Revenue (LTM)
   - EV/Revenue (NTM)
   - EV/EBITDA (LTM)
   - EV/EBITDA (NTM)
   - EV/EBIT

2. Equity Multiples
   - P/E (LTM)
   - P/E (NTM)
   - Price/Book
   - Price/Sales

3. Growth-Adjusted Multiples
   - PEG ratio
   - EV/EBITDA/Growth

4. Profitability Metrics
   - Gross margin
   - EBITDA margin
   - Net margin
   - Return on equity

5. Statistical Summary
   For each multiple:
   - Mean
   - Median
   - High
   - Low
   - Standard deviation

6. Outlier Analysis
   - Identify outliers
   - Rationale for inclusion/exclusion
   - Adjusted statistics

Output trading multiples analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const benchmarkAndSelectMultiplesTask = defineTask('benchmark-select-multiples', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'valuation' },
  agent: {
    name: 'valuation-analyst',
    prompt: {
      system: 'You are a valuation analyst selecting appropriate multiples for valuation.',
      user: `Benchmark and select multiples for valuation.

Trading multiples: ${JSON.stringify(args.tradingMultiples)}
Target company: ${JSON.stringify(args.targetCompany)}

Analyze and select:
1. Multiple Relevance
   For each multiple:
   - Appropriateness for industry
   - Data quality/availability
   - Sensitivity to accounting
   - Relevance for target

2. Target Positioning
   - Growth vs. peers
   - Profitability vs. peers
   - Size vs. peers
   - Risk profile vs. peers
   - Appropriate multiple range

3. Premium/Discount Analysis
   Factors warranting premium:
   - Superior growth
   - Higher margins
   - Market leadership
   - Better management

   Factors warranting discount:
   - Lower growth
   - Lower margins
   - Execution risk
   - Smaller scale

4. Selected Multiple Ranges
   - Primary multiple and range
   - Secondary multiple and range
   - Rationale for selections

5. Weighting
   - Weight for each multiple
   - Justification for weights

6. Cross-Check
   - Reasonableness of ranges
   - Consistency across methods

Output selected multiples with rationale.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const applyMultiplesToTargetTask = defineTask('apply-multiples-to-target', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'valuation' },
  agent: {
    name: 'valuation-analyst',
    prompt: {
      system: 'You are a valuation analyst applying selected multiples to derive value.',
      user: `Apply selected multiples to target company.

Selected multiples: ${JSON.stringify(args.selectedMultiples)}
Target financials: ${JSON.stringify(args.targetFinancials)}
Normalized data: ${JSON.stringify(args.normalizedData)}

Apply multiples:
1. Enterprise Value Calculation
   For each selected multiple:
   - Target metric (revenue, EBITDA, etc.)
   - Multiple range (low, mid, high)
   - Implied EV (low, mid, high)

2. Equity Value Bridge
   - Enterprise value
   - Less: Total debt
   - Less: Minority interest
   - Less: Preferred equity
   - Plus: Cash and equivalents
   - Equity value

3. Per Share Value
   - Equity value
   - Diluted shares outstanding
   - Per share value range

4. Valuation Summary
   By methodology:
   - EV/Revenue implied value
   - EV/EBITDA implied value
   - P/E implied value (if applicable)
   - Weighted average value

5. Valuation Range
   - Low value
   - Mid value
   - High value
   - Range drivers

6. Implied Metrics
   - What the market would pay
   - Premium/discount to peers
   - Comparison to market price (if public)

Output valuation range with support.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareValuationSummaryTask = defineTask('prepare-comps-summary', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'valuation' },
  agent: {
    name: 'valuation-analyst',
    prompt: {
      system: 'You are a valuation analyst preparing comparable company analysis summary.',
      user: `Prepare valuation summary as of ${args.valuationDate}.

Valuation results: ${JSON.stringify(args.valuationResults)}
Multiples analysis: ${JSON.stringify(args.multiplesAnalysis)}
Target company: ${JSON.stringify(args.targetCompany)}

Prepare summary:
1. Executive Summary
   - Valuation range
   - Key assumptions
   - Primary conclusions

2. Peer Group Analysis
   - Peer group composition
   - Selection rationale
   - Key comparability factors

3. Trading Multiples Summary
   - Multiple statistics
   - Peer rankings
   - Historical context

4. Target Positioning
   - Benchmark analysis
   - Premium/discount factors
   - Selected multiple ranges

5. Valuation Matrix
   - Value by methodology
   - Sensitivity ranges
   - Weighted conclusion

6. Limitations
   - Comparability limitations
   - Market conditions
   - Information limitations

7. Recommendations
   - Valuation conclusion
   - Confidence level
   - Additional analyses suggested

Output comprehensive comps analysis summary.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
