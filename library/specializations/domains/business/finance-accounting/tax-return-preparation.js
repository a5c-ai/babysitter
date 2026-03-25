/**
 * @file tax-return-preparation.js
 * @description Preparing and filing federal, state, and local income tax returns with supporting schedules and documentation
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Tax Return Preparation and Filing Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.taxYear - Tax year for return preparation
 * @param {Object} inputs.financialData - Financial data for tax year
 * @param {Object} inputs.priorYearReturn - Prior year tax return data
 * @param {Object} inputs.entityStructure - Legal entity structure
 * @param {Array} inputs.filingRequirements - Required tax filings by jurisdiction
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Completed tax returns ready for filing
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Tax Return Planning
  const planningResult = await ctx.task(planTaxReturnProcessTask, {
    taxYear: inputs.taxYear,
    filingRequirements: inputs.filingRequirements,
    entityStructure: inputs.entityStructure
  });
  results.steps.push({ name: 'return-planning', result: planningResult });

  // Step 2: Gather and Organize Data
  const dataResult = await ctx.task(gatherTaxDataTask, {
    financialData: inputs.financialData,
    priorYearReturn: inputs.priorYearReturn,
    taxYear: inputs.taxYear
  });
  results.steps.push({ name: 'data-gathering', result: dataResult });

  // Step 3: Book-to-Tax Adjustments
  const adjustmentsResult = await ctx.task(prepareBookTaxAdjustmentsTask, {
    financialData: dataResult,
    priorYearReturn: inputs.priorYearReturn
  });
  results.steps.push({ name: 'book-tax-adjustments', result: adjustmentsResult });

  // Breakpoint for adjustments review
  await ctx.breakpoint('adjustments-review', {
    message: 'Review book-to-tax adjustments before preparing returns',
    data: adjustmentsResult
  });

  // Step 4: Federal Return Preparation
  const federalResult = await ctx.task(prepareFederalReturnTask, {
    taxableIncome: adjustmentsResult,
    financialData: dataResult,
    taxYear: inputs.taxYear
  });
  results.steps.push({ name: 'federal-return', result: federalResult });

  // Step 5: State Return Preparation
  const stateResult = await ctx.task(prepareStateReturnsTask, {
    federalReturn: federalResult,
    filingRequirements: inputs.filingRequirements,
    entityStructure: inputs.entityStructure
  });
  results.steps.push({ name: 'state-returns', result: stateResult });

  // Step 6: Supporting Schedules
  const schedulesResult = await ctx.task(prepareSupportingSchedulesTask, {
    federalReturn: federalResult,
    stateReturns: stateResult,
    financialData: dataResult
  });
  results.steps.push({ name: 'supporting-schedules', result: schedulesResult });

  // Breakpoint for return review
  await ctx.breakpoint('return-review', {
    message: 'Review all tax returns before final preparation',
    data: {
      federal: federalResult,
      state: stateResult,
      schedules: schedulesResult
    }
  });

  // Step 7: Tax Payment Calculations
  const paymentResult = await ctx.task(calculateTaxPaymentsTask, {
    federalReturn: federalResult,
    stateReturns: stateResult,
    priorYearReturn: inputs.priorYearReturn
  });
  results.steps.push({ name: 'tax-payments', result: paymentResult });

  // Step 8: Quality Review and Finalization
  const reviewResult = await ctx.task(performQualityReviewTask, {
    allReturns: {
      federal: federalResult,
      state: stateResult,
      schedules: schedulesResult
    },
    priorYearReturn: inputs.priorYearReturn
  });
  results.steps.push({ name: 'quality-review', result: reviewResult });

  // Step 9: Filing Preparation
  const filingResult = await ctx.task(prepareForFilingTask, {
    reviewedReturns: reviewResult,
    filingRequirements: inputs.filingRequirements,
    taxYear: inputs.taxYear
  });
  results.steps.push({ name: 'filing-preparation', result: filingResult });

  results.outputs = {
    federalReturn: federalResult,
    stateReturns: stateResult,
    taxPayments: paymentResult,
    filingPackage: filingResult,
    taxYear: inputs.taxYear
  };

  return results;
}

// Task definitions
export const planTaxReturnProcessTask = defineTask('plan-tax-return-process', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'tax-compliance' },
  agent: {
    name: 'tax-manager',
    prompt: {
      system: 'You are a tax manager planning the tax return preparation process.',
      user: `Plan tax return process for tax year ${args.taxYear}.

Filing requirements: ${JSON.stringify(args.filingRequirements)}
Entity structure: ${JSON.stringify(args.entityStructure)}

Plan:
1. Filing Requirements
   - Federal returns required
   - State returns required
   - Local returns required
   - Information returns required

2. Due Dates
   - Original due dates
   - Extension dates
   - Estimated payment dates

3. Entity Returns
   - Consolidated return scope
   - Separate company returns
   - Pass-through returns
   - Foreign filings

4. Data Requirements
   - Trial balance data
   - Fixed asset data
   - Intercompany data
   - State apportionment data

5. Timeline
   - Data collection deadline
   - First draft deadline
   - Review deadline
   - Filing deadline

6. Resource Allocation
   - Internal team assignments
   - External preparer coordination
   - Specialist needs

7. Extension Strategy
   - Extension requirements
   - Payment with extension
   - Filing priorities

Output tax return planning schedule.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const gatherTaxDataTask = defineTask('gather-tax-data', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'tax-compliance' },
  agent: {
    name: 'tax-analyst',
    prompt: {
      system: 'You are a tax analyst gathering and organizing data for tax return preparation.',
      user: `Gather tax data for tax year ${args.taxYear}.

Financial data: ${JSON.stringify(args.financialData)}
Prior year return: ${JSON.stringify(args.priorYearReturn)}

Gather:
1. Financial Statement Data
   - Audited financial statements
   - Trial balance detail
   - General ledger support

2. Income Data
   - Revenue by type
   - Interest income
   - Dividend income
   - Capital gains/losses
   - Other income

3. Expense Data
   - Cost of goods sold
   - Operating expenses by category
   - Interest expense
   - Depreciation/amortization
   - Other deductions

4. Balance Sheet Data
   - Asset schedules
   - Liability schedules
   - Equity changes

5. Entity Data
   - Ownership information
   - Related party transactions
   - Intercompany balances

6. Carryforward Data
   - NOL carryforwards
   - Credit carryforwards
   - Capital loss carryforwards

7. Information Returns
   - 1099 data
   - K-1 data
   - Foreign filings data

Output organized tax data package.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareBookTaxAdjustmentsTask = defineTask('prepare-book-tax-adjustments', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'tax-compliance' },
  agent: {
    name: 'tax-accountant',
    prompt: {
      system: 'You are a tax accountant preparing book-to-tax adjustments.',
      user: `Prepare book-to-tax adjustments.

Financial data: ${JSON.stringify(args.financialData)}
Prior year return: ${JSON.stringify(args.priorYearReturn)}

Prepare:
1. Schedule M-1/M-3 Adjustments
   Income adjustments:
   - Tax-exempt income
   - Deferred income items
   - Other income differences

   Expense adjustments:
   - Non-deductible expenses
   - Timing differences
   - Section 263A adjustments

2. Depreciation Differences
   - Book depreciation
   - Tax depreciation (MACRS)
   - Section 179 expensing
   - Bonus depreciation
   - Depreciation adjustment

3. Compensation Adjustments
   - Stock compensation
   - Deferred compensation
   - Section 162(m) limitations
   - Golden parachute payments

4. Accrual Adjustments
   - Bad debt methods
   - Vacation accrual
   - Bonus accrual
   - Other accruals

5. Other Adjustments
   - Meals and entertainment
   - Political/lobbying expenses
   - Fines and penalties
   - Related party items

6. Adjustment Summary
   - Book income
   - Total adjustments
   - Taxable income
   - M-1/M-3 reconciliation

Output book-tax adjustment schedule.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareFederalReturnTask = defineTask('prepare-federal-return', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'tax-compliance' },
  agent: {
    name: 'federal-tax-preparer',
    prompt: {
      system: 'You are a tax professional preparing federal income tax returns.',
      user: `Prepare federal income tax return for tax year ${args.taxYear}.

Taxable income: ${JSON.stringify(args.taxableIncome)}
Financial data: ${JSON.stringify(args.financialData)}

Prepare:
1. Form 1120 (or applicable form)
   - Gross receipts
   - Cost of goods sold
   - Gross profit
   - Deductions
   - Taxable income before NOL
   - NOL deduction
   - Taxable income
   - Tax computation

2. Schedule C - Dividends
   - Dividend income
   - Dividends received deduction

3. Schedule J - Tax Computation
   - Tax calculation
   - Credits
   - Net tax

4. Schedule K - Other Information
   - Accounting methods
   - Ownership information
   - Other required questions

5. Schedule L - Balance Sheet
   - Beginning of year
   - End of year

6. Schedule M-1/M-3 - Reconciliation
   - Book to tax reconciliation
   - All adjustments

7. Other Required Schedules
   - Form 4562 - Depreciation
   - Form 4797 - Sales of property
   - Other applicable forms

Output completed federal return.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareStateReturnsTask = defineTask('prepare-state-returns', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'tax-compliance' },
  agent: {
    name: 'state-tax-preparer',
    prompt: {
      system: 'You are a tax professional preparing state income tax returns.',
      user: `Prepare state income tax returns.

Federal return: ${JSON.stringify(args.federalReturn)}
Filing requirements: ${JSON.stringify(args.filingRequirements)}
Entity structure: ${JSON.stringify(args.entityStructure)}

For each state:
1. Starting Point
   - Federal taxable income
   - State modifications

2. State Additions
   - State tax deducted
   - Federal depreciation differences
   - Interest on state obligations
   - Other state additions

3. State Subtractions
   - US government interest
   - Foreign dividend gross-up
   - State depreciation bonus
   - Other state subtractions

4. Apportionment
   - Sales factor
   - Payroll factor
   - Property factor
   - Weighted apportionment
   - Single sales factor (if applicable)

5. State Taxable Income
   - Apportioned income
   - State-specific adjustments
   - NOL deductions

6. Tax Calculation
   - Tax rate
   - Gross tax
   - Credits
   - Net tax due

7. Composite/Withholding
   - Pass-through withholding
   - Composite return requirements

Output state return package.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareSupportingSchedulesTask = defineTask('prepare-supporting-schedules', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'tax-compliance' },
  agent: {
    name: 'tax-analyst',
    prompt: {
      system: 'You are a tax analyst preparing supporting schedules for tax returns.',
      user: `Prepare supporting schedules.

Federal return: ${JSON.stringify(args.federalReturn)}
State returns: ${JSON.stringify(args.stateReturns)}
Financial data: ${JSON.stringify(args.financialData)}

Prepare:
1. Fixed Asset Schedules
   - Asset detail
   - Book depreciation
   - Tax depreciation
   - Reconciliation

2. NOL Schedule
   - Carryforward summary
   - Current year utilization
   - Remaining carryforward
   - Expiration tracking

3. Tax Credit Schedules
   - R&D credit calculation
   - Foreign tax credit
   - Other credits
   - Carryforward tracking

4. Related Party Schedules
   - Related party transactions
   - Transfer pricing documentation
   - Intercompany eliminations

5. State Apportionment
   - Factor calculations by state
   - Supporting detail

6. Workpapers
   - Income reconciliation
   - Expense reconciliation
   - Balance sheet support

7. Disclosure Schedules
   - Schedule UTP (if required)
   - Form 8886 (reportable transactions)
   - Other disclosures

Output supporting schedule package.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const calculateTaxPaymentsTask = defineTask('calculate-tax-payments', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'tax-compliance' },
  agent: {
    name: 'tax-payment-analyst',
    prompt: {
      system: 'You are a tax analyst calculating tax payments and refunds.',
      user: `Calculate tax payments.

Federal return: ${JSON.stringify(args.federalReturn)}
State returns: ${JSON.stringify(args.stateReturns)}
Prior year return: ${JSON.stringify(args.priorYearReturn)}

Calculate:
1. Federal Payment/Refund
   - Total tax liability
   - Estimated payments made
   - Extension payment
   - Prior year overpayment
   - Tax due/(refund)

2. State Payments/Refunds
   By state:
   - Total tax liability
   - Estimated payments
   - Extension payment
   - Tax due/(refund)

3. Interest and Penalties
   - Underpayment analysis
   - Interest calculations
   - Penalty assessments
   - Abatement requests

4. Payment Instructions
   - Payment amounts
   - Payment methods
   - Due dates
   - Account information

5. Refund Processing
   - Refund amounts
   - Direct deposit information
   - Application to next year

6. Estimated Tax Planning
   - Next year estimates
   - Safe harbor analysis
   - Quarterly amounts

Output payment calculation summary.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const performQualityReviewTask = defineTask('perform-quality-review', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'tax-compliance' },
  agent: {
    name: 'tax-reviewer',
    prompt: {
      system: 'You are a senior tax professional performing quality review of tax returns.',
      user: `Perform quality review of tax returns.

All returns: ${JSON.stringify(args.allReturns)}
Prior year return: ${JSON.stringify(args.priorYearReturn)}

Review:
1. Mathematical Accuracy
   - Calculations verified
   - Schedule tie-outs
   - Crossfooting verified

2. Prior Year Comparison
   - Year-over-year changes
   - Unexplained variances
   - Carryforward accuracy

3. Return Completeness
   - All required forms included
   - All schedules complete
   - Signatures ready

4. Technical Review
   - Positions properly supported
   - Elections properly made
   - Disclosures complete

5. Data Accuracy
   - Source document verification
   - Financial statement tie-out
   - M-1/M-3 reconciliation

6. Consistency
   - Federal to state consistency
   - Entity consistency
   - Year-over-year consistency

7. Review Notes
   - Issues identified
   - Questions for preparer
   - Items to discuss with client

Output review findings and sign-off.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareForFilingTask = defineTask('prepare-for-filing', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'tax-compliance' },
  agent: {
    name: 'filing-coordinator',
    prompt: {
      system: 'You are a tax filing coordinator preparing returns for submission.',
      user: `Prepare returns for filing.

Reviewed returns: ${JSON.stringify(args.reviewedReturns)}
Filing requirements: ${JSON.stringify(args.filingRequirements)}
Tax year: ${args.taxYear}

Prepare:
1. Filing Package Assembly
   - Final return copies
   - All schedules attached
   - Supporting documentation

2. E-Filing Preparation
   - E-file authorization forms
   - Electronic filing setup
   - Validation checks

3. Paper Filing (if required)
   - Printed returns
   - Mailing addresses
   - Certified mail tracking

4. Signature Requirements
   - Signature pages
   - Officer/partner signatures
   - Power of attorney

5. Filing Checklist
   - All returns accounted for
   - Due dates confirmed
   - Filing method confirmed

6. Copies and Retention
   - Client copies
   - Firm copies
   - Retention schedule

7. Post-Filing
   - Confirmation tracking
   - Acceptance verification
   - Record keeping

Output filing-ready package.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
