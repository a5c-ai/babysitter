/**
 * @file income-tax-provision-asc740.js
 * @description Calculating current and deferred tax expense, identifying permanent and temporary differences, and preparing tax provision workpapers
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Income Tax Provision and ASC 740 Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.reportingPeriod - Period for tax provision
 * @param {Object} inputs.financialStatements - Pre-tax financial statements
 * @param {Object} inputs.priorPeriodTax - Prior period tax data
 * @param {Object} inputs.taxRates - Applicable tax rates by jurisdiction
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Tax provision and ASC 740 workpapers
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Pre-Tax Income Analysis
  const preTaxResult = await ctx.task(analyzePreTaxIncomeTask, {
    financialStatements: inputs.financialStatements,
    reportingPeriod: inputs.reportingPeriod
  });
  results.steps.push({ name: 'pretax-analysis', result: preTaxResult });

  // Step 2: Identify Permanent Differences
  const permanentResult = await ctx.task(identifyPermanentDifferencesTask, {
    preTaxIncome: preTaxResult,
    financialStatements: inputs.financialStatements
  });
  results.steps.push({ name: 'permanent-differences', result: permanentResult });

  // Step 3: Identify Temporary Differences
  const temporaryResult = await ctx.task(identifyTemporaryDifferencesTask, {
    financialStatements: inputs.financialStatements,
    priorPeriodTax: inputs.priorPeriodTax
  });
  results.steps.push({ name: 'temporary-differences', result: temporaryResult });

  // Breakpoint for difference review
  await ctx.breakpoint('difference-review', {
    message: 'Review permanent and temporary differences before calculating provision',
    data: { permanent: permanentResult, temporary: temporaryResult }
  });

  // Step 4: Calculate Current Tax Expense
  const currentTaxResult = await ctx.task(calculateCurrentTaxTask, {
    preTaxIncome: preTaxResult,
    permanentDifferences: permanentResult,
    temporaryDifferences: temporaryResult,
    taxRates: inputs.taxRates
  });
  results.steps.push({ name: 'current-tax', result: currentTaxResult });

  // Step 5: Calculate Deferred Tax
  const deferredTaxResult = await ctx.task(calculateDeferredTaxTask, {
    temporaryDifferences: temporaryResult,
    taxRates: inputs.taxRates,
    priorPeriodTax: inputs.priorPeriodTax
  });
  results.steps.push({ name: 'deferred-tax', result: deferredTaxResult });

  // Step 6: Valuation Allowance Assessment
  const valuationResult = await ctx.task(assessValuationAllowanceTask, {
    deferredTaxAssets: deferredTaxResult,
    financialStatements: inputs.financialStatements
  });
  results.steps.push({ name: 'valuation-allowance', result: valuationResult });

  // Breakpoint for valuation allowance review
  await ctx.breakpoint('valuation-review', {
    message: 'Review valuation allowance assessment',
    data: valuationResult
  });

  // Step 7: Uncertain Tax Positions (ASC 740-10)
  const utpResult = await ctx.task(analyzeUncertainTaxPositionsTask, {
    taxPositions: inputs.taxPositions,
    reportingPeriod: inputs.reportingPeriod
  });
  results.steps.push({ name: 'uncertain-tax-positions', result: utpResult });

  // Step 8: Tax Rate Reconciliation
  const rateReconciliationResult = await ctx.task(prepareRateReconciliationTask, {
    preTaxIncome: preTaxResult,
    currentTax: currentTaxResult,
    deferredTax: deferredTaxResult,
    taxRates: inputs.taxRates
  });
  results.steps.push({ name: 'rate-reconciliation', result: rateReconciliationResult });

  // Step 9: Prepare Disclosures
  const disclosuresResult = await ctx.task(prepareTaxDisclosuresTask, {
    currentTax: currentTaxResult,
    deferredTax: deferredTaxResult,
    valuationAllowance: valuationResult,
    uncertainPositions: utpResult,
    rateReconciliation: rateReconciliationResult
  });
  results.steps.push({ name: 'tax-disclosures', result: disclosuresResult });

  results.outputs = {
    taxProvision: {
      currentTax: currentTaxResult,
      deferredTax: deferredTaxResult,
      totalProvision: currentTaxResult.amount + deferredTaxResult.amount
    },
    disclosures: disclosuresResult,
    workpapers: results.steps
  };

  return results;
}

// Task definitions
export const analyzePreTaxIncomeTask = defineTask('analyze-pretax-income', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'tax-accounting' },
  agent: {
    name: 'tax-accountant',
    prompt: {
      system: 'You are a tax accountant analyzing pre-tax book income for tax provision.',
      user: `Analyze pre-tax income for ${args.reportingPeriod}.

Financial statements: ${JSON.stringify(args.financialStatements)}

Analyze:
1. Pre-Tax Book Income
   - Consolidated pre-tax income
   - By legal entity
   - By jurisdiction
   - Domestic vs. foreign

2. Income Categories
   - Operating income
   - Interest income/expense
   - Dividend income
   - Capital gains/losses
   - Other income/expense

3. Intercompany Eliminations
   - Intercompany transactions
   - Elimination entries
   - Tax impact of eliminations

4. Book-Tax Basis Differences
   - Initial identification
   - Categorization
   - Tracking requirements

5. Jurisdictional Allocation
   - Apportionment factors
   - Transfer pricing considerations
   - Tax nexus analysis

6. Special Items
   - Discontinued operations
   - Extraordinary items
   - OCI items with tax impact

Output pre-tax income analysis by jurisdiction.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const identifyPermanentDifferencesTask = defineTask('identify-permanent-differences', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'tax-accounting' },
  agent: {
    name: 'tax-accountant',
    prompt: {
      system: 'You are a tax accountant identifying permanent book-tax differences.',
      user: `Identify permanent differences.

Pre-tax income: ${JSON.stringify(args.preTaxIncome)}
Financial statements: ${JSON.stringify(args.financialStatements)}

Identify:
1. Non-Deductible Expenses
   - Fines and penalties
   - Political contributions
   - Entertainment expenses (portion)
   - Executive compensation limits (162(m))
   - Life insurance premiums
   - Stock-based compensation (certain)

2. Tax-Exempt Income
   - Municipal bond interest
   - Life insurance proceeds
   - Certain dividend income (DRD)

3. Tax Credits
   - Research and development credit
   - Foreign tax credit
   - Other business credits

4. Other Permanent Items
   - Meals and entertainment
   - Goodwill impairment
   - Certain litigation settlements
   - Non-deductible acquisition costs

5. Calculation
   For each permanent difference:
   - Book amount
   - Tax amount
   - Difference
   - Tax impact

6. Summary
   - Total permanent differences
   - Impact on effective tax rate
   - Recurring vs. non-recurring

Output permanent differences schedule.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const identifyTemporaryDifferencesTask = defineTask('identify-temporary-differences', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'tax-accounting' },
  agent: {
    name: 'tax-accountant',
    prompt: {
      system: 'You are a tax accountant identifying temporary differences for deferred taxes.',
      user: `Identify temporary differences.

Financial statements: ${JSON.stringify(args.financialStatements)}
Prior period tax: ${JSON.stringify(args.priorPeriodTax)}

Identify:
1. Asset-Related Differences
   - Accounts receivable (bad debt)
   - Inventory valuation
   - Prepaid expenses
   - Fixed assets (depreciation methods)
   - Intangible assets
   - Investments

2. Liability-Related Differences
   - Accrued expenses
   - Deferred revenue
   - Warranty reserves
   - Compensation accruals
   - Restructuring reserves
   - Lease liabilities

3. Carryforward Items
   - Net operating loss carryforwards
   - Capital loss carryforwards
   - Tax credit carryforwards
   - Foreign tax credit carryforwards

4. For Each Difference
   - Book basis
   - Tax basis
   - Cumulative temporary difference
   - Change from prior period
   - DTA or DTL

5. Reversal Patterns
   - Expected reversal periods
   - Indefinite-lived differences
   - Rate change considerations

6. Summary Schedule
   - Beginning balance
   - Current period change
   - Ending balance
   - By category

Output temporary differences schedule.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const calculateCurrentTaxTask = defineTask('calculate-current-tax', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'tax-accounting' },
  agent: {
    name: 'tax-provision-specialist',
    prompt: {
      system: 'You are a tax provision specialist calculating current income tax expense.',
      user: `Calculate current tax expense.

Pre-tax income: ${JSON.stringify(args.preTaxIncome)}
Permanent differences: ${JSON.stringify(args.permanentDifferences)}
Temporary differences: ${JSON.stringify(args.temporaryDifferences)}
Tax rates: ${JSON.stringify(args.taxRates)}

Calculate:
1. Taxable Income
   Pre-tax book income
   + Permanent differences (unfavorable)
   - Permanent differences (favorable)
   + Temporary differences (unfavorable)
   - Temporary differences (favorable)
   = Taxable income

2. Federal Current Tax
   - Taxable income
   - Federal rate
   - Federal current tax expense
   - Federal tax credits

3. State Current Tax
   By state:
   - Apportioned taxable income
   - State rate
   - State current tax expense
   - State deduction for federal

4. Foreign Current Tax
   By jurisdiction:
   - Foreign taxable income
   - Local tax rate
   - Withholding taxes
   - Foreign tax credits

5. Total Current Tax
   - Federal
   - State
   - Foreign
   - Total current provision

6. Journal Entry
   Dr. Current Tax Expense
   Cr. Income Tax Payable

Output current tax calculation.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const calculateDeferredTaxTask = defineTask('calculate-deferred-tax', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'tax-accounting' },
  agent: {
    name: 'deferred-tax-specialist',
    prompt: {
      system: 'You are a tax specialist calculating deferred tax assets and liabilities.',
      user: `Calculate deferred taxes.

Temporary differences: ${JSON.stringify(args.temporaryDifferences)}
Tax rates: ${JSON.stringify(args.taxRates)}
Prior period: ${JSON.stringify(args.priorPeriodTax)}

Calculate:
1. Deferred Tax Assets
   For each deductible temporary difference:
   - Temporary difference amount
   - Applicable tax rate
   - Deferred tax asset

   Categories:
   - Accrued liabilities
   - Bad debt reserves
   - NOL carryforwards
   - Tax credit carryforwards
   - Other DTAs

2. Deferred Tax Liabilities
   For each taxable temporary difference:
   - Temporary difference amount
   - Applicable tax rate
   - Deferred tax liability

   Categories:
   - Depreciation differences
   - Intangible amortization
   - Revenue recognition
   - Other DTLs

3. Net Deferred Tax Position
   - Total DTAs
   - Total DTLs
   - Net DTA or DTL

4. Deferred Tax Expense
   - Ending deferred tax balance
   - Beginning deferred tax balance
   - Deferred tax expense/(benefit)

5. Classification
   - Current vs. non-current
   - Jurisdiction netting
   - Balance sheet presentation

6. Journal Entry
   Dr/Cr Deferred Tax Asset/Liability
   Cr/Dr Deferred Tax Expense

Output deferred tax calculation.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const assessValuationAllowanceTask = defineTask('assess-valuation-allowance', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'tax-accounting' },
  agent: {
    name: 'tax-provision-specialist',
    prompt: {
      system: 'You are a tax specialist assessing the need for valuation allowance on deferred tax assets.',
      user: `Assess valuation allowance need.

Deferred tax assets: ${JSON.stringify(args.deferredTaxAssets)}
Financial statements: ${JSON.stringify(args.financialStatements)}

Assess:
1. Positive Evidence
   - Historical profitability
   - Existing contracts/backlog
   - Strong earnings history
   - Reversing taxable temporary differences
   - Tax planning strategies

2. Negative Evidence
   - Cumulative losses
   - History of NOL/credit expiration
   - Losses expected in future
   - Carryforward limitation periods
   - Unsettled circumstances

3. More-Likely-Than-Not Assessment
   - Weight of evidence
   - Objective vs. subjective evidence
   - Reliability of evidence

4. Valuation Allowance Calculation
   - DTAs requiring allowance
   - Amount of allowance
   - By jurisdiction
   - By DTA type

5. Changes in Valuation Allowance
   - Beginning balance
   - Increases
   - Decreases
   - Ending balance
   - P&L vs. OCI allocation

6. Documentation
   - Basis for conclusion
   - Evidence considered
   - Management judgment
   - Consistency with prior periods

Output valuation allowance assessment.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeUncertainTaxPositionsTask = defineTask('analyze-uncertain-positions', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'tax-accounting' },
  agent: {
    name: 'utp-specialist',
    prompt: {
      system: 'You are a tax specialist analyzing uncertain tax positions under ASC 740-10.',
      user: `Analyze uncertain tax positions for ${args.reportingPeriod}.

Tax positions: ${JSON.stringify(args.taxPositions)}

Analyze:
1. Position Identification
   - New positions taken
   - Existing positions
   - Positions settled
   - Positions lapsed

2. Recognition Step
   For each position:
   - Technical merits
   - More-likely-than-not threshold
   - Recognition conclusion

3. Measurement Step
   If recognized:
   - Possible outcomes
   - Probability weighting
   - Largest amount >50% likely
   - Amount to recognize

4. UTB Rollforward
   - Beginning balance
   - Additions for current year
   - Additions for prior years
   - Reductions (settlements)
   - Reductions (statute lapse)
   - Ending balance

5. Interest and Penalties
   - Interest accrual
   - Penalty assessment
   - Classification policy
   - Current period expense

6. Disclosure Requirements
   - Tabular reconciliation
   - Positions affecting ETR
   - Reasonably possible changes
   - Statute of limitations

Output UTP analysis and rollforward.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareRateReconciliationTask = defineTask('prepare-rate-reconciliation', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'tax-accounting' },
  agent: {
    name: 'tax-provision-specialist',
    prompt: {
      system: 'You are a tax specialist preparing the effective tax rate reconciliation.',
      user: `Prepare rate reconciliation.

Pre-tax income: ${JSON.stringify(args.preTaxIncome)}
Current tax: ${JSON.stringify(args.currentTax)}
Deferred tax: ${JSON.stringify(args.deferredTax)}
Tax rates: ${JSON.stringify(args.taxRates)}

Prepare:
1. Statutory Rate Application
   - Pre-tax book income
   - Statutory rate (federal)
   - Tax at statutory rate

2. State Tax Effect
   - State tax expense
   - Net of federal benefit
   - Effective state rate

3. Permanent Differences
   - Non-deductible expenses
   - Tax-exempt income
   - Rate impact of each

4. Tax Credits
   - R&D credit
   - Foreign tax credit
   - Other credits
   - Rate impact

5. Foreign Rate Differential
   - Foreign income
   - Local vs. US rate differential
   - GILTI/FDII impact

6. Other Items
   - Valuation allowance changes
   - Rate changes
   - Prior year adjustments
   - Other discrete items

7. Reconciliation Summary
   Statutory rate: XX%
   +/- State taxes
   +/- Permanent differences
   +/- Tax credits
   +/- Foreign rate differential
   +/- Other
   = Effective tax rate: XX%

Output rate reconciliation.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareTaxDisclosuresTask = defineTask('prepare-tax-disclosures', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-reporting' },
  agent: {
    name: 'tax-disclosure-specialist',
    prompt: {
      system: 'You are a tax disclosure specialist preparing ASC 740 footnote disclosures.',
      user: `Prepare tax disclosures.

Current tax: ${JSON.stringify(args.currentTax)}
Deferred tax: ${JSON.stringify(args.deferredTax)}
Valuation allowance: ${JSON.stringify(args.valuationAllowance)}
Uncertain positions: ${JSON.stringify(args.uncertainPositions)}
Rate reconciliation: ${JSON.stringify(args.rateReconciliation)}

Prepare disclosures:
1. Income Tax Expense Components
   - Current (federal, state, foreign)
   - Deferred (federal, state, foreign)
   - Total provision

2. Effective Tax Rate Reconciliation
   - Tabular reconciliation
   - Percentage and dollar amounts
   - Significant items explained

3. Deferred Tax Assets and Liabilities
   - Gross DTAs by category
   - Gross DTLs by category
   - Valuation allowance
   - Net deferred tax position

4. Valuation Allowance
   - Beginning balance
   - Changes during period
   - Ending balance

5. Uncertain Tax Positions
   - UTB rollforward
   - Impact on ETR if recognized
   - Reasonably possible changes
   - Interest and penalties policy

6. Tax Carryforwards
   - NOL carryforwards by jurisdiction
   - Tax credit carryforwards
   - Expiration years

7. Other Required Disclosures
   - Undistributed foreign earnings
   - Tax holidays
   - Tax examinations

Format disclosures per ASC 740 requirements.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
