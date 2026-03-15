/**
 * @file month-end-close-process.js
 * @description Structured process for completing monthly financial close including transaction cutoffs, reconciliations, adjusting entries, and management reporting within defined timelines
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Month-End Close Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.closePeriod - Period being closed (e.g., "2024-01")
 * @param {Date} inputs.closeDeadline - Target close completion date
 * @param {Object} inputs.priorPeriodBalances - Prior period ending balances
 * @param {Object} inputs.subLedgerData - Sub-ledger data for reconciliation
 * @param {Array} inputs.recurringEntries - Standard recurring journal entries
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Completed close package with financial statements
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Pre-Close Preparation and Cutoff Procedures
  const cutoffResult = await ctx.task(performCutoffProceduresTask, {
    closePeriod: inputs.closePeriod,
    closeDeadline: inputs.closeDeadline
  });
  results.steps.push({ name: 'cutoff-procedures', result: cutoffResult });

  // Step 2: Sub-Ledger Close and Reconciliation
  const subLedgerResult = await ctx.task(closeSubLedgersTask, {
    closePeriod: inputs.closePeriod,
    subLedgerData: inputs.subLedgerData
  });
  results.steps.push({ name: 'sub-ledger-close', result: subLedgerResult });

  // Step 3: Process Recurring Entries
  const recurringResult = await ctx.task(processRecurringEntriesTask, {
    closePeriod: inputs.closePeriod,
    recurringEntries: inputs.recurringEntries
  });
  results.steps.push({ name: 'recurring-entries', result: recurringResult });

  // Step 4: Account Reconciliations
  const reconciliationResult = await ctx.task(performReconciliationsTask, {
    closePeriod: inputs.closePeriod,
    priorPeriodBalances: inputs.priorPeriodBalances,
    subLedgerData: inputs.subLedgerData
  });
  results.steps.push({ name: 'account-reconciliations', result: reconciliationResult });

  // Breakpoint for reconciliation review
  await ctx.breakpoint('reconciliation-review', {
    message: 'Review account reconciliations and identify any unreconciled items',
    data: reconciliationResult
  });

  // Step 5: Adjusting Journal Entries
  const adjustingResult = await ctx.task(prepareAdjustingEntriesTask, {
    closePeriod: inputs.closePeriod,
    reconciliationResults: reconciliationResult
  });
  results.steps.push({ name: 'adjusting-entries', result: adjustingResult });

  // Step 6: Intercompany Reconciliation and Elimination
  const intercompanyResult = await ctx.task(reconcileIntercompanyTask, {
    closePeriod: inputs.closePeriod,
    subLedgerData: inputs.subLedgerData
  });
  results.steps.push({ name: 'intercompany-reconciliation', result: intercompanyResult });

  // Step 7: Financial Statement Preparation
  const financialsResult = await ctx.task(prepareFinancialStatementsTask, {
    closePeriod: inputs.closePeriod,
    adjustingEntries: adjustingResult,
    intercompanyEliminations: intercompanyResult
  });
  results.steps.push({ name: 'financial-statements', result: financialsResult });

  // Breakpoint for controller review
  await ctx.breakpoint('controller-review', {
    message: 'Controller review of financial statements before finalization',
    data: financialsResult
  });

  // Step 8: Management Reporting
  const reportingResult = await ctx.task(prepareManagementReportsTask, {
    closePeriod: inputs.closePeriod,
    financialStatements: financialsResult
  });
  results.steps.push({ name: 'management-reporting', result: reportingResult });

  // Step 9: Close Documentation and Sign-off
  const signoffResult = await ctx.task(completeCloseDocumentationTask, {
    closePeriod: inputs.closePeriod,
    allResults: results.steps
  });
  results.steps.push({ name: 'close-documentation', result: signoffResult });

  results.outputs = {
    financialStatements: financialsResult,
    managementReports: reportingResult,
    closeDocumentation: signoffResult,
    closePeriod: inputs.closePeriod
  };

  return results;
}

// Task definitions
export const performCutoffProceduresTask = defineTask('perform-cutoff-procedures', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'accounting-operations' },
  agent: {
    name: 'close-coordinator',
    prompt: {
      system: 'You are an accounting manager responsible for ensuring proper period cutoff procedures.',
      user: `Execute pre-close cutoff procedures for period ${args.closePeriod}.

Close deadline: ${args.closeDeadline}

Cutoff procedures:
1. Revenue Cutoff
   - Verify all revenue transactions are recorded in correct period
   - Review pending sales orders and shipments
   - Ensure delivery/service completion criteria met
   - Document cutoff testing

2. Expense Cutoff
   - Verify receipt of goods/services
   - Review pending invoices
   - Accrue for goods/services received but not invoiced
   - Document cutoff testing

3. Cash Cutoff
   - Reconcile bank activity through period end
   - Identify outstanding deposits in transit
   - Identify outstanding checks

4. Inventory Cutoff
   - Verify physical counts if applicable
   - Review goods in transit
   - Ensure proper costing

5. Communicate deadlines
   - Notify all departments of cutoff dates
   - Confirm submission deadlines
   - Escalate any known issues

Document all cutoff procedures performed and results.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const closeSubLedgersTask = defineTask('close-sub-ledgers', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'accounting-operations' },
  agent: {
    name: 'sub-ledger-accountant',
    prompt: {
      system: 'You are a staff accountant responsible for sub-ledger close activities.',
      user: `Close all sub-ledgers for period ${args.closePeriod}.

Sub-ledger data: ${JSON.stringify(args.subLedgerData)}

Close activities by sub-ledger:
1. Accounts Receivable
   - Post all invoices and credits
   - Apply cash receipts
   - Review aging and collectability
   - Calculate bad debt reserve

2. Accounts Payable
   - Process all approved invoices
   - Match to receipts and POs
   - Apply vendor credits
   - Review aging

3. Fixed Assets
   - Capitalize additions
   - Process disposals/retirements
   - Calculate depreciation
   - Reconcile to GL

4. Inventory
   - Post all inventory transactions
   - Update standard costs if applicable
   - Calculate reserves
   - Reconcile to GL

5. Payroll
   - Verify all payroll processed
   - Accrue unpaid wages
   - Reconcile payroll registers

Post all sub-ledger entries to general ledger.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const processRecurringEntriesTask = defineTask('process-recurring-entries', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'accounting-operations' },
  agent: {
    name: 'journal-entry-accountant',
    prompt: {
      system: 'You are a staff accountant responsible for processing standard recurring journal entries.',
      user: `Process recurring journal entries for period ${args.closePeriod}.

Recurring entries template: ${JSON.stringify(args.recurringEntries)}

Process:
1. Review standard recurring entries
   - Amortization entries
   - Prepaid expense recognition
   - Deferred revenue recognition
   - Accrued expenses
   - Intercompany allocations

2. Update amounts as needed
   - Verify amounts still accurate
   - Adjust for any changes
   - Document any modifications

3. Post entries
   - Enter all recurring entries
   - Verify debits equal credits
   - Attach supporting documentation

4. Document
   - List all entries posted
   - Note any entries skipped/modified
   - Flag any unusual items

Ensure all entries are properly approved before posting.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const performReconciliationsTask = defineTask('perform-reconciliations', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'accounting-operations' },
  agent: {
    name: 'reconciliation-accountant',
    prompt: {
      system: 'You are an accountant specializing in account reconciliations and balance verification.',
      user: `Perform account reconciliations for period ${args.closePeriod}.

Prior period balances: ${JSON.stringify(args.priorPeriodBalances)}
Sub-ledger data: ${JSON.stringify(args.subLedgerData)}

Reconcile key accounts:
1. Cash and Bank Accounts
   - Bank reconciliations
   - Outstanding items
   - Unusual reconciling items

2. Accounts Receivable
   - Sub-ledger to GL reconciliation
   - Aging analysis
   - Reserve adequacy

3. Inventory
   - Sub-ledger to GL reconciliation
   - Valuation review
   - Reserve adequacy

4. Prepaid Expenses
   - Schedule rollforward
   - Amortization accuracy

5. Fixed Assets
   - Sub-ledger to GL reconciliation
   - Depreciation recalculation

6. Accounts Payable
   - Sub-ledger to GL reconciliation
   - Aging analysis

7. Accrued Liabilities
   - Detailed support for accruals
   - Rollforward analysis

8. Debt
   - Loan balance reconciliation
   - Interest calculation verification

Document all reconciliations with explanations for any differences.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareAdjustingEntriesTask = defineTask('prepare-adjusting-entries', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'accounting-operations' },
  agent: {
    name: 'adjusting-entry-accountant',
    prompt: {
      system: 'You are a senior accountant responsible for preparing adjusting journal entries.',
      user: `Prepare adjusting journal entries for period ${args.closePeriod}.

Reconciliation results: ${JSON.stringify(args.reconciliationResults)}

Identify and prepare entries for:
1. Reconciliation Adjustments
   - Correct any reconciliation differences
   - Clear stale items

2. Accruals
   - Revenue accruals
   - Expense accruals
   - Payroll accruals

3. Estimates
   - Bad debt expense
   - Inventory reserves
   - Warranty reserves

4. Corrections
   - Prior period corrections
   - Reclassifications

5. Allocations
   - Cost allocations
   - Overhead absorption

For each entry:
- Prepare journal entry with account details
- Document purpose and calculation
- Attach supporting documentation
- Obtain required approvals

Summarize total adjustments by category.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const reconcileIntercompanyTask = defineTask('reconcile-intercompany', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'accounting-operations' },
  agent: {
    name: 'intercompany-accountant',
    prompt: {
      system: 'You are an accountant specializing in intercompany accounting and eliminations.',
      user: `Reconcile intercompany accounts for period ${args.closePeriod}.

Sub-ledger data: ${JSON.stringify(args.subLedgerData)}

Perform:
1. Intercompany Reconciliation
   - Match intercompany receivables and payables
   - Identify and resolve differences
   - Document unmatched items

2. Intercompany Revenue/Expense
   - Verify intercompany transactions net to zero
   - Identify any margin in intercompany sales
   - Document transfer pricing compliance

3. Prepare Eliminations
   - Intercompany receivable/payable elimination
   - Intercompany revenue/expense elimination
   - Intercompany profit in inventory elimination
   - Investment/equity eliminations

4. Consolidation Adjustments
   - Currency translation adjustments
   - Minority interest calculations
   - Goodwill/intangibles adjustments

Document all eliminations with supporting calculations.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareFinancialStatementsTask = defineTask('prepare-financial-statements', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-reporting' },
  agent: {
    name: 'financial-reporting-accountant',
    prompt: {
      system: 'You are a financial reporting accountant responsible for preparing accurate financial statements.',
      user: `Prepare financial statements for period ${args.closePeriod}.

Adjusting entries: ${JSON.stringify(args.adjustingEntries)}
Intercompany eliminations: ${JSON.stringify(args.intercompanyEliminations)}

Prepare:
1. Income Statement
   - Revenue by category
   - Cost of goods sold
   - Gross profit
   - Operating expenses by category
   - Operating income
   - Other income/expense
   - Pre-tax income
   - Tax provision
   - Net income

2. Balance Sheet
   - Current assets
   - Non-current assets
   - Current liabilities
   - Non-current liabilities
   - Stockholders' equity
   - Verify balance sheet balances

3. Cash Flow Statement
   - Operating activities (indirect method)
   - Investing activities
   - Financing activities
   - Reconcile to cash change

4. Supporting Schedules
   - Detailed account schedules
   - Rollforward schedules
   - Flux analysis

5. Validation
   - Ensure all statements tie together
   - Verify period-over-period changes reconcile
   - Check for any unusual items

Format according to company standards.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareManagementReportsTask = defineTask('prepare-management-reports', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'management-reporting' },
  agent: {
    name: 'management-reporting-analyst',
    prompt: {
      system: 'You are a management reporting analyst who prepares insightful reports for business leaders.',
      user: `Prepare management reports for period ${args.closePeriod}.

Financial statements: ${JSON.stringify(args.financialStatements)}

Prepare:
1. Executive Summary
   - Key financial highlights
   - Performance vs budget/forecast
   - Key variance explanations

2. Business Unit Reports
   - P&L by business unit/segment
   - KPIs by business unit
   - Variance analysis

3. Operational Metrics
   - Key performance indicators
   - Trend analysis
   - Benchmarking data

4. Cash Flow Analysis
   - Cash position summary
   - Working capital metrics
   - Liquidity analysis

5. Forward Look
   - Updated forecast implications
   - Key risks and opportunities
   - Action items

Format for executive readability with clear visualizations.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const completeCloseDocumentationTask = defineTask('complete-close-documentation', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'accounting-operations' },
  agent: {
    name: 'close-coordinator',
    prompt: {
      system: 'You are the close coordinator responsible for documenting and completing the close process.',
      user: `Complete close documentation for period ${args.closePeriod}.

All close activities: ${JSON.stringify(args.allResults)}

Complete:
1. Close Checklist
   - Verify all tasks completed
   - Document completion dates
   - Note any exceptions

2. Sign-off Package
   - Reconciliation certifications
   - Journal entry approvals
   - Financial statement sign-offs

3. Issue Log
   - Document any issues encountered
   - Resolution status
   - Lessons learned

4. Metrics
   - Close timeline adherence
   - Days to close
   - Number of adjusting entries
   - Reconciliation exceptions

5. Archive
   - Organize all supporting documentation
   - Ensure audit trail complete
   - Store per retention policy

6. Post-Close Meeting Prep
   - Summary of key items
   - Process improvement recommendations
   - Next period planning

Certify close completion with appropriate sign-offs.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
