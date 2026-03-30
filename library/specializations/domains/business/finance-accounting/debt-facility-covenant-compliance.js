/**
 * @file debt-facility-covenant-compliance.js
 * @description Managing debt agreements, monitoring covenant compliance, preparing compliance certificates, and optimizing capital structure
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Debt Facility Management and Covenant Compliance Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.reportingPeriod - Period for compliance testing
 * @param {Object} inputs.debtAgreements - Details of all debt agreements
 * @param {Object} inputs.financialStatements - Current period financial statements
 * @param {Object} inputs.priorPeriodCovenants - Prior period covenant calculations
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Covenant compliance results and certificates
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Debt Portfolio Review
  const portfolioResult = await ctx.task(reviewDebtPortfolioTask, {
    debtAgreements: inputs.debtAgreements,
    reportingPeriod: inputs.reportingPeriod
  });
  results.steps.push({ name: 'portfolio-review', result: portfolioResult });

  // Step 2: Covenant Identification
  const covenantResult = await ctx.task(identifyCovenantsTask, {
    debtAgreements: inputs.debtAgreements
  });
  results.steps.push({ name: 'covenant-identification', result: covenantResult });

  // Step 3: Covenant Calculations
  const calculationResult = await ctx.task(calculateCovenantsTask, {
    covenants: covenantResult,
    financialStatements: inputs.financialStatements,
    debtAgreements: inputs.debtAgreements
  });
  results.steps.push({ name: 'covenant-calculations', result: calculationResult });

  // Breakpoint for calculation review
  await ctx.breakpoint('calculation-review', {
    message: 'Review covenant calculations before compliance testing',
    data: calculationResult
  });

  // Step 4: Compliance Testing
  const complianceResult = await ctx.task(testComplianceTask, {
    calculations: calculationResult,
    covenants: covenantResult
  });
  results.steps.push({ name: 'compliance-testing', result: complianceResult });

  // Step 5: Trend Analysis and Forecasting
  const trendResult = await ctx.task(analyzeCovenantTrendsTask, {
    currentCompliance: complianceResult,
    priorPeriodCovenants: inputs.priorPeriodCovenants
  });
  results.steps.push({ name: 'trend-analysis', result: trendResult });

  // Breakpoint if any covenant at risk
  if (complianceResult.atRiskCovenants?.length > 0) {
    await ctx.breakpoint('covenant-alert', {
      message: 'ALERT: Covenants at risk of breach - review and develop mitigation plan',
      data: { compliance: complianceResult, trends: trendResult }
    });
  }

  // Step 6: Compliance Certificate Preparation
  const certificateResult = await ctx.task(prepareComplianceCertificateTask, {
    complianceResults: complianceResult,
    financialStatements: inputs.financialStatements,
    reportingPeriod: inputs.reportingPeriod
  });
  results.steps.push({ name: 'compliance-certificate', result: certificateResult });

  // Step 7: Capital Structure Optimization
  const optimizationResult = await ctx.task(optimizeCapitalStructureTask, {
    debtPortfolio: portfolioResult,
    covenantHeadroom: complianceResult,
    financialStatements: inputs.financialStatements
  });
  results.steps.push({ name: 'capital-optimization', result: optimizationResult });

  results.outputs = {
    covenantCompliance: complianceResult,
    complianceCertificate: certificateResult,
    trendAnalysis: trendResult,
    capitalOptimization: optimizationResult
  };

  return results;
}

// Task definitions
export const reviewDebtPortfolioTask = defineTask('review-debt-portfolio', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'debt-management' },
  agent: {
    name: 'treasury-analyst',
    prompt: {
      system: 'You are a treasury analyst managing the debt portfolio.',
      user: `Review debt portfolio for ${args.reportingPeriod}.

Debt agreements: ${JSON.stringify(args.debtAgreements)}

Review:
1. Facility Summary
   For each facility:
   - Lender/agent
   - Facility type
   - Commitment amount
   - Outstanding balance
   - Available capacity
   - Maturity date

2. Interest Rate Analysis
   - Fixed vs. floating breakdown
   - Current interest rates
   - Rate reset dates
   - Hedging in place

3. Amortization Schedule
   - Principal payment schedule
   - Bullet maturities
   - Cash flow impact

4. Security and Guarantees
   - Collateral pledged
   - Guarantor structure
   - Release conditions

5. Key Dates
   - Payment dates
   - Reporting dates
   - Compliance certificate due dates
   - Maturity dates
   - Option exercise dates

6. Relationship Management
   - Bank group composition
   - Syndicate positions
   - Key contacts

Output comprehensive debt portfolio summary.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const identifyCovenantsTask = defineTask('identify-covenants', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'debt-management' },
  agent: {
    name: 'covenant-analyst',
    prompt: {
      system: 'You are a covenant analyst identifying and tracking debt covenants.',
      user: `Identify all covenants from debt agreements.

Debt agreements: ${JSON.stringify(args.debtAgreements)}

Identify covenants:
1. Financial Covenants
   - Leverage ratios (Debt/EBITDA)
   - Interest coverage (EBITDA/Interest)
   - Fixed charge coverage
   - Minimum liquidity
   - Minimum net worth
   - Maximum capital expenditures

2. Covenant Definitions
   For each covenant:
   - Exact definition from agreement
   - Calculation methodology
   - Adjustments/add-backs allowed
   - Measurement period
   - Threshold/limit

3. Testing Frequency
   - Quarterly covenants
   - Annual covenants
   - Event-driven covenants

4. Negative Covenants
   - Limitations on debt
   - Limitations on liens
   - Limitations on investments
   - Limitations on restricted payments
   - Limitations on asset sales
   - Limitations on transactions with affiliates

5. Affirmative Covenants
   - Reporting requirements
   - Insurance requirements
   - Maintenance of properties
   - Compliance with laws

6. Events of Default
   - Covenant breach
   - Payment default
   - Cross-default provisions
   - Material adverse change

Document all covenants with requirements.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const calculateCovenantsTask = defineTask('calculate-covenants', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'debt-management' },
  agent: {
    name: 'covenant-analyst',
    prompt: {
      system: 'You are a covenant analyst calculating financial covenants.',
      user: `Calculate covenant ratios.

Covenants: ${JSON.stringify(args.covenants)}
Financial statements: ${JSON.stringify(args.financialStatements)}
Debt agreements: ${JSON.stringify(args.debtAgreements)}

Calculate each financial covenant:
1. Leverage Ratio (Total Debt / EBITDA)
   - Total funded debt calculation
   - EBITDA calculation
     - Net income
     - + Interest expense
     - + Tax expense
     - + Depreciation
     - + Amortization
     - +/- Permitted adjustments
   - Trailing twelve month calculation
   - Ratio result

2. Interest Coverage (EBITDA / Interest Expense)
   - Interest expense calculation
   - Cash vs. PIK interest
   - EBITDA (from above)
   - Ratio result

3. Fixed Charge Coverage
   - EBITDA
   - Fixed charges (interest, scheduled principal, rent, etc.)
   - Ratio result

4. Minimum Liquidity
   - Cash and equivalents
   - Available revolver capacity
   - Total liquidity

5. Other Ratio Calculations
   - As required by specific agreements
   - Apply agreement-specific definitions

For each calculation:
- Show detailed build-up
- Identify data sources
- Document any judgments
- Pro forma adjustments

Output detailed covenant calculations.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const testComplianceTask = defineTask('test-compliance', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'debt-management' },
  agent: {
    name: 'compliance-analyst',
    prompt: {
      system: 'You are a compliance analyst testing covenant compliance.',
      user: `Test covenant compliance.

Calculations: ${JSON.stringify(args.calculations)}
Covenants: ${JSON.stringify(args.covenants)}

Test compliance:
1. Financial Covenant Testing
   For each financial covenant:
   - Calculated ratio/amount
   - Required threshold
   - Compliance status (Pass/Fail)
   - Headroom (cushion to breach)
   - Headroom percentage

2. Headroom Analysis
   - Dollars of EBITDA cushion
   - Revenue decline to breach
   - Cost increase to breach
   - Debt increase to breach

3. At-Risk Assessment
   - Covenants with <10% headroom
   - Covenants with <20% headroom
   - Deteriorating trends
   - Risk rating for each

4. Pro Forma Testing
   - Impact of planned transactions
   - Acquisition impact
   - Disposition impact
   - Refinancing impact

5. Negative Covenant Compliance
   - Basket utilization tracking
   - Permitted debt capacity
   - Permitted investment capacity
   - Restricted payment capacity

6. Cure and Waiver Options
   - Equity cure provisions
   - Amendment possibilities
   - Waiver requirements

Output comprehensive compliance test results.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeCovenantTrendsTask = defineTask('analyze-covenant-trends', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-analysis' },
  agent: {
    name: 'trend-analyst',
    prompt: {
      system: 'You are a financial analyst analyzing covenant trends and forecasting compliance.',
      user: `Analyze covenant trends and forecast compliance.

Current compliance: ${JSON.stringify(args.currentCompliance)}
Prior period covenants: ${JSON.stringify(args.priorPeriodCovenants)}

Analyze:
1. Historical Trend Analysis
   - Covenant ratios over time
   - Headroom trends
   - Seasonal patterns
   - Correlation with business cycles

2. Variance Analysis
   - Current vs. prior period
   - Current vs. budget
   - Variance drivers

3. Forward Projections
   - Based on budget/forecast
   - Projected covenant levels
   - Projected headroom
   - Quarters at risk

4. Sensitivity Analysis
   - EBITDA sensitivity
   - Revenue sensitivity
   - Cost sensitivity
   - Debt level sensitivity

5. Scenario Analysis
   - Base case compliance
   - Downside case compliance
   - Stress test compliance
   - Break-even scenarios

6. Early Warning Indicators
   - Leading indicators
   - Trigger points
   - Monitoring recommendations

7. Mitigation Strategies
   - Actions to improve ratios
   - Timing considerations
   - Implementation recommendations

Output trend analysis and projections.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareComplianceCertificateTask = defineTask('prepare-compliance-certificate', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'debt-management' },
  agent: {
    name: 'treasury-manager',
    prompt: {
      system: 'You are a treasury manager preparing covenant compliance certificates.',
      user: `Prepare compliance certificate for ${args.reportingPeriod}.

Compliance results: ${JSON.stringify(args.complianceResults)}
Financial statements: ${JSON.stringify(args.financialStatements)}

Prepare certificate:
1. Officer's Certificate
   - Certification statement
   - Officer signature blocks
   - Date

2. Financial Statements Attachment
   - Balance sheet
   - Income statement
   - Cash flow statement
   - Certification that financials are accurate

3. Covenant Calculations
   - Detailed calculation schedule
   - Each covenant shown
   - Threshold vs. actual
   - Compliance confirmation

4. Definitions Schedule
   - Key term definitions
   - Calculation methodology
   - Adjustments applied

5. Supporting Schedules
   - EBITDA calculation
   - Debt schedule
   - Interest expense detail
   - Other required schedules

6. Representations
   - No default exists
   - No material adverse change
   - Accurate and complete information

7. Other Required Information
   - Basket utilization
   - Material events
   - Pending litigation
   - Other agreement requirements

Format per credit agreement requirements.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const optimizeCapitalStructureTask = defineTask('optimize-capital-structure', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'corporate-finance' },
  agent: {
    name: 'capital-structure-analyst',
    prompt: {
      system: 'You are a corporate finance analyst optimizing capital structure.',
      user: `Analyze capital structure optimization opportunities.

Debt portfolio: ${JSON.stringify(args.debtPortfolio)}
Covenant headroom: ${JSON.stringify(args.covenantHeadroom)}
Financial statements: ${JSON.stringify(args.financialStatements)}

Analyze:
1. Current Capital Structure
   - Debt composition
   - Equity book value
   - Market capitalization (if public)
   - Enterprise value
   - Leverage metrics

2. Cost of Capital
   - Cost of debt
   - Cost of equity
   - Weighted average cost of capital
   - Comparison to peers

3. Optimization Opportunities
   - Refinancing opportunities
   - Interest rate savings
   - Maturity extension
   - Covenant relief
   - Debt capacity

4. Debt Capacity Analysis
   - Available capacity
   - Target leverage
   - Rating agency considerations
   - Investor considerations

5. Near-Term Actions
   - Maturity management
   - Interest rate management
   - Prepayment opportunities
   - Facility amendments

6. Strategic Considerations
   - M&A financing needs
   - Capital return capacity
   - Growth financing
   - Balance sheet flexibility

7. Recommendations
   - Priority actions
   - Implementation timeline
   - Expected benefits
   - Risks and considerations

Output capital structure optimization recommendations.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
