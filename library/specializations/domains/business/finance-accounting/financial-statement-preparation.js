/**
 * @file financial-statement-preparation.js
 * @description Preparation of GAAP/IFRS-compliant financial statements including balance sheet, income statement, cash flow statement, and statement of stockholders' equity
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Financial Statement Preparation Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.reportingPeriod - Period for financial statements
 * @param {string} inputs.accountingFramework - GAAP or IFRS
 * @param {Object} inputs.trialBalance - Adjusted trial balance
 * @param {Object} inputs.priorPeriodStatements - Prior period financial statements for comparison
 * @param {Object} inputs.disclosureRequirements - Required footnote disclosures
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Complete set of financial statements
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Trial Balance Review and Validation
  const trialBalanceResult = await ctx.task(reviewTrialBalanceTask, {
    trialBalance: inputs.trialBalance,
    accountingFramework: inputs.accountingFramework
  });
  results.steps.push({ name: 'trial-balance-review', result: trialBalanceResult });

  // Step 2: Prepare Income Statement
  const incomeStatementResult = await ctx.task(prepareIncomeStatementTask, {
    trialBalance: trialBalanceResult,
    reportingPeriod: inputs.reportingPeriod,
    accountingFramework: inputs.accountingFramework,
    priorPeriod: inputs.priorPeriodStatements?.incomeStatement
  });
  results.steps.push({ name: 'income-statement', result: incomeStatementResult });

  // Step 3: Prepare Balance Sheet
  const balanceSheetResult = await ctx.task(prepareBalanceSheetTask, {
    trialBalance: trialBalanceResult,
    reportingPeriod: inputs.reportingPeriod,
    accountingFramework: inputs.accountingFramework,
    priorPeriod: inputs.priorPeriodStatements?.balanceSheet
  });
  results.steps.push({ name: 'balance-sheet', result: balanceSheetResult });

  // Step 4: Prepare Statement of Stockholders' Equity
  const equityStatementResult = await ctx.task(prepareEquityStatementTask, {
    trialBalance: trialBalanceResult,
    netIncome: incomeStatementResult.netIncome,
    reportingPeriod: inputs.reportingPeriod,
    priorPeriod: inputs.priorPeriodStatements?.equityStatement
  });
  results.steps.push({ name: 'equity-statement', result: equityStatementResult });

  // Step 5: Prepare Cash Flow Statement
  const cashFlowResult = await ctx.task(prepareCashFlowStatementTask, {
    incomeStatement: incomeStatementResult,
    balanceSheet: balanceSheetResult,
    priorPeriodBalanceSheet: inputs.priorPeriodStatements?.balanceSheet,
    accountingFramework: inputs.accountingFramework
  });
  results.steps.push({ name: 'cash-flow-statement', result: cashFlowResult });

  // Breakpoint for statement review
  await ctx.breakpoint('statement-review', {
    message: 'Review all financial statements for accuracy and completeness before preparing disclosures',
    data: {
      incomeStatement: incomeStatementResult,
      balanceSheet: balanceSheetResult,
      equityStatement: equityStatementResult,
      cashFlow: cashFlowResult
    }
  });

  // Step 6: Prepare Footnote Disclosures
  const disclosuresResult = await ctx.task(prepareDisclosuresTask, {
    financialStatements: {
      incomeStatement: incomeStatementResult,
      balanceSheet: balanceSheetResult,
      equityStatement: equityStatementResult,
      cashFlow: cashFlowResult
    },
    disclosureRequirements: inputs.disclosureRequirements,
    accountingFramework: inputs.accountingFramework
  });
  results.steps.push({ name: 'footnote-disclosures', result: disclosuresResult });

  // Step 7: Cross-Reference and Tie-Out
  const tieOutResult = await ctx.task(performTieOutTask, {
    financialStatements: {
      incomeStatement: incomeStatementResult,
      balanceSheet: balanceSheetResult,
      equityStatement: equityStatementResult,
      cashFlow: cashFlowResult
    },
    disclosures: disclosuresResult
  });
  results.steps.push({ name: 'tie-out-verification', result: tieOutResult });

  // Breakpoint for final approval
  await ctx.breakpoint('final-approval', {
    message: 'Final review and approval of complete financial statement package',
    data: { statements: results.steps, tieOut: tieOutResult }
  });

  // Step 8: Finalize and Format
  const finalResult = await ctx.task(finalizeStatementsTask, {
    allStatements: {
      incomeStatement: incomeStatementResult,
      balanceSheet: balanceSheetResult,
      equityStatement: equityStatementResult,
      cashFlow: cashFlowResult,
      disclosures: disclosuresResult
    },
    reportingPeriod: inputs.reportingPeriod,
    accountingFramework: inputs.accountingFramework
  });
  results.steps.push({ name: 'finalize-statements', result: finalResult });

  results.outputs = {
    financialStatements: finalResult,
    reportingPeriod: inputs.reportingPeriod,
    accountingFramework: inputs.accountingFramework
  };

  return results;
}

// Task definitions
export const reviewTrialBalanceTask = defineTask('review-trial-balance', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'accounting-operations' },
  agent: {
    name: 'senior-accountant',
    prompt: {
      system: 'You are a senior accountant responsible for reviewing and validating trial balances for financial statement preparation.',
      user: `Review and validate the adjusted trial balance for financial statement preparation.

Trial balance: ${JSON.stringify(args.trialBalance)}
Accounting framework: ${args.accountingFramework}

Perform:
1. Validation Checks
   - Verify debits equal credits
   - Check for unusual balances
   - Identify any negative balances that should be positive
   - Review intercompany accounts

2. Classification Review
   - Verify proper account classification
   - Ensure current vs non-current distinction
   - Check operating vs non-operating items
   - Review contra accounts

3. Mapping to Financial Statements
   - Map accounts to financial statement line items
   - Identify any unmapped accounts
   - Verify mapping consistency with ${args.accountingFramework}

4. Comparative Analysis
   - Significant balance changes
   - New accounts
   - Closed accounts

Output validated trial balance ready for financial statement preparation.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareIncomeStatementTask = defineTask('prepare-income-statement', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-reporting' },
  agent: {
    name: 'financial-reporting-specialist',
    prompt: {
      system: 'You are a financial reporting specialist who prepares income statements in compliance with accounting standards.',
      user: `Prepare the income statement for ${args.reportingPeriod}.

Validated trial balance: ${JSON.stringify(args.trialBalance)}
Accounting framework: ${args.accountingFramework}
Prior period comparison: ${JSON.stringify(args.priorPeriod)}

Prepare income statement including:
1. Revenue Section
   - Net revenues by category
   - Revenue recognition notes

2. Cost of Revenue
   - Cost of goods sold
   - Cost of services

3. Gross Profit
   - Calculate and present gross margin

4. Operating Expenses
   - Selling expenses
   - General and administrative
   - Research and development
   - Depreciation and amortization (if presented separately)

5. Operating Income
   - Calculate operating margin

6. Other Income/Expense
   - Interest income
   - Interest expense
   - Other income/expense items
   - Foreign exchange gains/losses

7. Income Before Taxes

8. Income Tax Provision
   - Current tax
   - Deferred tax

9. Net Income
   - Calculate net margin

10. Earnings Per Share (if applicable)
    - Basic EPS
    - Diluted EPS

Format per ${args.accountingFramework} requirements with comparative periods.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareBalanceSheetTask = defineTask('prepare-balance-sheet', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-reporting' },
  agent: {
    name: 'financial-reporting-specialist',
    prompt: {
      system: 'You are a financial reporting specialist who prepares balance sheets in compliance with accounting standards.',
      user: `Prepare the balance sheet as of ${args.reportingPeriod}.

Validated trial balance: ${JSON.stringify(args.trialBalance)}
Accounting framework: ${args.accountingFramework}
Prior period comparison: ${JSON.stringify(args.priorPeriod)}

Prepare balance sheet including:
1. Current Assets
   - Cash and cash equivalents
   - Short-term investments
   - Accounts receivable (net)
   - Inventory
   - Prepaid expenses
   - Other current assets

2. Non-Current Assets
   - Property, plant and equipment (net)
   - Intangible assets
   - Goodwill
   - Long-term investments
   - Deferred tax assets
   - Other non-current assets

3. Total Assets

4. Current Liabilities
   - Accounts payable
   - Accrued expenses
   - Short-term debt
   - Current portion of long-term debt
   - Deferred revenue
   - Other current liabilities

5. Non-Current Liabilities
   - Long-term debt
   - Deferred tax liabilities
   - Pension obligations
   - Other long-term liabilities

6. Total Liabilities

7. Stockholders' Equity
   - Common stock
   - Additional paid-in capital
   - Retained earnings
   - Accumulated other comprehensive income
   - Treasury stock

8. Total Liabilities and Stockholders' Equity

Verify: Total Assets = Total Liabilities + Equity

Format per ${args.accountingFramework} requirements with comparative periods.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareEquityStatementTask = defineTask('prepare-equity-statement', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-reporting' },
  agent: {
    name: 'financial-reporting-specialist',
    prompt: {
      system: 'You are a financial reporting specialist who prepares statements of stockholders equity.',
      user: `Prepare the statement of stockholders' equity for ${args.reportingPeriod}.

Trial balance: ${JSON.stringify(args.trialBalance)}
Net income for period: ${args.netIncome}
Prior period equity: ${JSON.stringify(args.priorPeriod)}

Prepare statement showing:
1. Beginning Balances
   - By equity component

2. Changes During Period
   - Net income
   - Other comprehensive income items
   - Common stock issuances
   - Stock-based compensation
   - Treasury stock purchases
   - Dividends declared
   - Other equity transactions

3. Ending Balances
   - By equity component

Present in columnar format:
- Common Stock
- Additional Paid-in Capital
- Retained Earnings
- AOCI
- Treasury Stock
- Total Equity

Ensure ending balances tie to balance sheet equity section.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareCashFlowStatementTask = defineTask('prepare-cash-flow-statement', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-reporting' },
  agent: {
    name: 'financial-reporting-specialist',
    prompt: {
      system: 'You are a financial reporting specialist who prepares cash flow statements using the indirect method.',
      user: `Prepare the cash flow statement for the period.

Income statement: ${JSON.stringify(args.incomeStatement)}
Current balance sheet: ${JSON.stringify(args.balanceSheet)}
Prior period balance sheet: ${JSON.stringify(args.priorPeriodBalanceSheet)}
Accounting framework: ${args.accountingFramework}

Prepare using indirect method:
1. Operating Activities
   - Net income
   - Adjustments for non-cash items:
     - Depreciation and amortization
     - Stock-based compensation
     - Deferred taxes
     - Other non-cash items
   - Changes in working capital:
     - Accounts receivable
     - Inventory
     - Prepaid expenses
     - Accounts payable
     - Accrued expenses
     - Deferred revenue
   - Net cash from operating activities

2. Investing Activities
   - Capital expenditures
   - Acquisitions
   - Investment purchases/sales
   - Proceeds from asset sales
   - Net cash from investing activities

3. Financing Activities
   - Debt issuances/repayments
   - Stock issuances
   - Treasury stock purchases
   - Dividend payments
   - Net cash from financing activities

4. Reconciliation
   - Beginning cash balance
   - Net change in cash
   - FX effects on cash
   - Ending cash balance

Verify: Ending cash ties to balance sheet cash.

Include supplemental disclosures:
- Interest paid
- Income taxes paid
- Non-cash transactions`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareDisclosuresTask = defineTask('prepare-disclosures', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-reporting' },
  agent: {
    name: 'disclosure-specialist',
    prompt: {
      system: 'You are a financial reporting specialist who prepares footnote disclosures for financial statements.',
      user: `Prepare footnote disclosures for the financial statements.

Financial statements: ${JSON.stringify(args.financialStatements)}
Disclosure requirements: ${JSON.stringify(args.disclosureRequirements)}
Accounting framework: ${args.accountingFramework}

Prepare standard disclosures:
1. Summary of Significant Accounting Policies
   - Revenue recognition
   - Inventory valuation
   - Property and equipment
   - Intangibles and goodwill
   - Leases
   - Income taxes
   - Stock-based compensation

2. Revenue Disclosures
   - Disaggregation of revenue
   - Contract balances
   - Performance obligations

3. Balance Sheet Details
   - Receivables and allowances
   - Inventory components
   - Property, plant and equipment
   - Intangible assets
   - Accrued expenses detail

4. Debt and Commitments
   - Debt schedule and terms
   - Lease commitments
   - Purchase obligations

5. Income Taxes
   - Rate reconciliation
   - Deferred tax components
   - Uncertain tax positions

6. Equity
   - Stock-based compensation
   - EPS calculation
   - Treasury stock

7. Fair Value Measurements
   - Fair value hierarchy
   - Level 3 rollforward

8. Contingencies and Commitments

9. Related Party Transactions

10. Subsequent Events

Format per ${args.accountingFramework} requirements.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const performTieOutTask = defineTask('perform-tie-out', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-reporting' },
  agent: {
    name: 'tie-out-specialist',
    prompt: {
      system: 'You are a financial reporting specialist responsible for verifying that all financial statement components tie together.',
      user: `Perform comprehensive tie-out of all financial statements.

Financial statements: ${JSON.stringify(args.financialStatements)}
Disclosures: ${JSON.stringify(args.disclosures)}

Verify:
1. Internal Statement Ties
   - Balance sheet balances (A = L + E)
   - Cash flow reconciles to cash change
   - Equity statement ties to balance sheet equity
   - Net income ties between statements

2. Statement-to-Disclosure Ties
   - Revenue on face ties to revenue footnote
   - Debt on face ties to debt footnote
   - All footnote totals tie to face amounts

3. Period-over-Period Ties
   - Beginning balances tie to prior ending
   - Rollforwards foot properly

4. Mathematical Accuracy
   - All columns foot properly
   - All crossfoots balance
   - Percentages calculate correctly

5. Comparative Consistency
   - Prior period amounts match prior filings
   - Reclassifications properly presented

Document all ties verified and any exceptions found.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const finalizeStatementsTask = defineTask('finalize-statements', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-reporting' },
  agent: {
    name: 'reporting-manager',
    prompt: {
      system: 'You are a reporting manager responsible for finalizing and formatting financial statements for publication.',
      user: `Finalize and format the complete financial statement package.

All statements: ${JSON.stringify(args.allStatements)}
Reporting period: ${args.reportingPeriod}
Accounting framework: ${args.accountingFramework}

Finalize:
1. Formatting
   - Apply standard formatting
   - Ensure consistent presentation
   - Add appropriate headers and footers
   - Include report date

2. Table of Contents
   - List all statements and footnotes
   - Page number references

3. Auditor's Report Placeholder (if applicable)

4. Management Certification

5. Final Review Checklist
   - All tie-outs complete
   - All required disclosures included
   - Proper accounting standard references
   - Consistent rounding

6. Version Control
   - Mark as final version
   - Lock from editing
   - Document approval chain

Output complete financial statement package ready for distribution.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
