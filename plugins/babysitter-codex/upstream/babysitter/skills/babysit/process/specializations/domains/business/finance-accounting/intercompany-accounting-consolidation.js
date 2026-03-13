/**
 * @file intercompany-accounting-consolidation.js
 * @description Managing intercompany transactions, eliminations, and consolidation of multi-entity financial results for group reporting
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Intercompany Accounting and Consolidation Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.reportingPeriod - Period for consolidation
 * @param {Array} inputs.entities - List of entities to consolidate
 * @param {Object} inputs.entityFinancials - Financial statements for each entity
 * @param {Object} inputs.intercompanyTransactions - Intercompany transaction data
 * @param {Object} inputs.ownershipStructure - Group ownership structure
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Consolidated financial statements
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Validate Entity Financial Packages
  const validationResult = await ctx.task(validateEntityPackagesTask, {
    entities: inputs.entities,
    entityFinancials: inputs.entityFinancials,
    reportingPeriod: inputs.reportingPeriod
  });
  results.steps.push({ name: 'entity-validation', result: validationResult });

  // Step 2: Intercompany Transaction Matching
  const matchingResult = await ctx.task(matchIntercompanyTransactionsTask, {
    intercompanyTransactions: inputs.intercompanyTransactions,
    entities: inputs.entities
  });
  results.steps.push({ name: 'ic-matching', result: matchingResult });

  // Breakpoint for unmatched items review
  await ctx.breakpoint('matching-review', {
    message: 'Review unmatched intercompany transactions before proceeding',
    data: matchingResult
  });

  // Step 3: Currency Translation
  const translationResult = await ctx.task(performCurrencyTranslationTask, {
    entityFinancials: validationResult,
    reportingCurrency: inputs.reportingCurrency,
    exchangeRates: inputs.exchangeRates
  });
  results.steps.push({ name: 'currency-translation', result: translationResult });

  // Step 4: Prepare Elimination Entries
  const eliminationsResult = await ctx.task(prepareEliminationEntriesTask, {
    matchedTransactions: matchingResult,
    entityFinancials: translationResult,
    ownershipStructure: inputs.ownershipStructure
  });
  results.steps.push({ name: 'elimination-entries', result: eliminationsResult });

  // Step 5: Calculate Minority Interest
  const minorityInterestResult = await ctx.task(calculateMinorityInterestTask, {
    entityFinancials: translationResult,
    ownershipStructure: inputs.ownershipStructure,
    eliminations: eliminationsResult
  });
  results.steps.push({ name: 'minority-interest', result: minorityInterestResult });

  // Breakpoint for elimination review
  await ctx.breakpoint('elimination-review', {
    message: 'Review elimination entries and minority interest calculations',
    data: { eliminations: eliminationsResult, minorityInterest: minorityInterestResult }
  });

  // Step 6: Perform Consolidation
  const consolidationResult = await ctx.task(performConsolidationTask, {
    entityFinancials: translationResult,
    eliminations: eliminationsResult,
    minorityInterest: minorityInterestResult
  });
  results.steps.push({ name: 'consolidation', result: consolidationResult });

  // Step 7: Validate Consolidated Financials
  const consolidationValidationResult = await ctx.task(validateConsolidationTask, {
    consolidatedFinancials: consolidationResult,
    entityFinancials: translationResult,
    eliminations: eliminationsResult
  });
  results.steps.push({ name: 'consolidation-validation', result: consolidationValidationResult });

  // Step 8: Prepare Consolidation Workpapers
  const workpapersResult = await ctx.task(prepareWorkpapersTask, {
    consolidatedFinancials: consolidationResult,
    allSteps: results.steps,
    reportingPeriod: inputs.reportingPeriod
  });
  results.steps.push({ name: 'workpapers', result: workpapersResult });

  results.outputs = {
    consolidatedFinancials: consolidationResult,
    eliminationEntries: eliminationsResult,
    workpapers: workpapersResult,
    reportingPeriod: inputs.reportingPeriod
  };

  return results;
}

// Task definitions
export const validateEntityPackagesTask = defineTask('validate-entity-packages', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'consolidation-accounting' },
  agent: {
    name: 'consolidation-accountant',
    prompt: {
      system: 'You are a consolidation accountant responsible for validating entity financial packages for consolidation.',
      user: `Validate entity financial packages for period ${args.reportingPeriod}.

Entities: ${JSON.stringify(args.entities)}
Entity financials: ${JSON.stringify(args.entityFinancials)}

Validate for each entity:
1. Completeness
   - All required financial statements received
   - Chart of accounts mapping complete
   - Intercompany schedules provided

2. Accuracy
   - Trial balance balances
   - Financial statements tie to trial balance
   - Intercompany balances match records

3. Consistency
   - Accounting policies aligned with group
   - Reporting period matches
   - Currency properly identified

4. Timeliness
   - Submitted by deadline
   - Prior period adjustments identified

5. Intercompany Data
   - All IC transactions reported
   - IC partner identified
   - IC accounts properly tagged

Document any exceptions and follow up items.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const matchIntercompanyTransactionsTask = defineTask('match-ic-transactions', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'consolidation-accounting' },
  agent: {
    name: 'ic-accountant',
    prompt: {
      system: 'You are an intercompany accountant responsible for matching and reconciling intercompany transactions.',
      user: `Match intercompany transactions across entities.

Intercompany transactions: ${JSON.stringify(args.intercompanyTransactions)}
Entities: ${JSON.stringify(args.entities)}

Perform:
1. Balance Matching
   - Match IC receivables with IC payables
   - Identify differences by entity pair

2. Transaction Matching
   - Match IC revenue with IC cost
   - Match IC dividend declarations with receipts
   - Match IC capital transactions

3. Difference Analysis
   - Timing differences
   - Currency differences
   - Recording differences
   - Unrecorded transactions

4. Dispute Resolution
   - Identify disputed items
   - Determine correct treatment
   - Assign resolution responsibility

5. Documentation
   - Matched items summary
   - Unmatched items with reasons
   - Recommended adjustments

Output matching status and unresolved items for review.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const performCurrencyTranslationTask = defineTask('currency-translation', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'consolidation-accounting' },
  agent: {
    name: 'currency-accountant',
    prompt: {
      system: 'You are an accountant specializing in foreign currency translation for consolidation.',
      user: `Perform currency translation for consolidation.

Entity financials: ${JSON.stringify(args.entityFinancials)}
Reporting currency: ${args.reportingCurrency}
Exchange rates: ${JSON.stringify(args.exchangeRates)}

For each foreign entity:
1. Determine Functional Currency
   - Evaluate functional currency indicators
   - Document functional currency determination

2. Translate Financial Statements
   - Assets and liabilities at period-end rate
   - Equity at historical rates
   - Income statement at average rate
   - Calculate cumulative translation adjustment (CTA)

3. Remeasurement (if needed)
   - Monetary items at current rate
   - Non-monetary items at historical rate
   - Remeasurement gain/loss to P&L

4. Intercompany Translation
   - Translate IC balances consistently
   - Handle IC loans designated as net investment

5. Documentation
   - Exchange rates used
   - Translation calculations
   - CTA rollforward

Output translated financials ready for consolidation.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareEliminationEntriesTask = defineTask('prepare-eliminations', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'consolidation-accounting' },
  agent: {
    name: 'elimination-accountant',
    prompt: {
      system: 'You are a consolidation accountant preparing elimination entries for group consolidation.',
      user: `Prepare elimination entries for consolidation.

Matched IC transactions: ${JSON.stringify(args.matchedTransactions)}
Entity financials: ${JSON.stringify(args.entityFinancials)}
Ownership structure: ${JSON.stringify(args.ownershipStructure)}

Prepare elimination entries for:
1. Investment Elimination
   - Parent investment in subsidiary
   - Subsidiary equity
   - Goodwill/bargain purchase
   - Push-down adjustments

2. Intercompany Balances
   - Receivables/payables
   - Loans
   - Other intercompany accounts

3. Intercompany Transactions
   - Revenue/expense
   - Dividends
   - Interest income/expense
   - Management fees
   - Royalties

4. Intercompany Profit Elimination
   - Inventory profit
   - Fixed asset profit
   - Deferred gain on IC sales

5. Other Eliminations
   - IC guarantees
   - IC commitments

For each elimination:
- Entry description
- Debit/credit accounts
- Amounts
- Supporting reference`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const calculateMinorityInterestTask = defineTask('calculate-minority-interest', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'consolidation-accounting' },
  agent: {
    name: 'nci-accountant',
    prompt: {
      system: 'You are a consolidation accountant calculating non-controlling interest for consolidated financials.',
      user: `Calculate non-controlling interest (minority interest).

Entity financials: ${JSON.stringify(args.entityFinancials)}
Ownership structure: ${JSON.stringify(args.ownershipStructure)}
Eliminations: ${JSON.stringify(args.eliminations)}

Calculate:
1. NCI Share of Net Assets
   - Fair value of NCI at acquisition
   - NCI share of post-acquisition equity changes
   - NCI share of OCI

2. NCI Share of Earnings
   - NCI percentage by subsidiary
   - Subsidiary net income
   - NCI share of net income
   - Adjustments for IC profit eliminations

3. NCI Reconciliation
   - Beginning NCI balance
   - NCI share of earnings
   - NCI share of OCI
   - Dividends to NCI
   - Changes in ownership
   - Ending NCI balance

4. Presentation
   - NCI in equity (balance sheet)
   - NCI in net income (income statement)
   - NCI in comprehensive income

Document calculations and present NCI schedules.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const performConsolidationTask = defineTask('perform-consolidation', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'consolidation-accounting' },
  agent: {
    name: 'consolidation-manager',
    prompt: {
      system: 'You are a consolidation manager performing the final consolidation of group financial statements.',
      user: `Perform consolidation of all entities.

Entity financials (translated): ${JSON.stringify(args.entityFinancials)}
Elimination entries: ${JSON.stringify(args.eliminations)}
Non-controlling interest: ${JSON.stringify(args.minorityInterest)}

Perform:
1. Sum Entity Balances
   - Add all entity trial balances
   - Line by line summation

2. Post Eliminations
   - Apply all elimination entries
   - Track elimination impact by category

3. Apply NCI Allocations
   - Present NCI separately in equity
   - Present NCI share of income

4. Generate Consolidated Statements
   - Consolidated income statement
   - Consolidated balance sheet
   - Consolidated cash flow statement
   - Consolidated statement of comprehensive income
   - Consolidated statement of equity

5. Supporting Schedules
   - Goodwill rollforward
   - Intangibles rollforward
   - CTA rollforward
   - NCI rollforward

Output complete consolidated financial statements.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const validateConsolidationTask = defineTask('validate-consolidation', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'consolidation-accounting' },
  agent: {
    name: 'consolidation-reviewer',
    prompt: {
      system: 'You are a senior consolidation accountant responsible for validating consolidated financial statements.',
      user: `Validate consolidated financial statements.

Consolidated financials: ${JSON.stringify(args.consolidatedFinancials)}
Entity financials: ${JSON.stringify(args.entityFinancials)}
Eliminations: ${JSON.stringify(args.eliminations)}

Validate:
1. Consolidation Proof
   - Sum of entities equals consolidated plus eliminations
   - By financial statement line
   - Document any unexplained differences

2. Balance Sheet Integrity
   - Assets = Liabilities + Equity
   - All IC balances eliminated
   - NCI properly presented

3. Income Statement Integrity
   - All IC revenue/expense eliminated
   - NCI share of income properly calculated
   - Comprehensive income ties

4. Cash Flow Statement
   - Operating, investing, financing sections foot
   - Changes in cash reconcile to balance sheet
   - IC cash flows eliminated

5. Intercompany Elimination Proof
   - All IC balances net to zero
   - No residual IC amounts

6. Reconciliations
   - Consolidated equity to prior period
   - Goodwill rollforward
   - Translation adjustment rollforward

Document validation results and any exceptions.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareWorkpapersTask = defineTask('prepare-workpapers', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'consolidation-accounting' },
  agent: {
    name: 'workpaper-preparer',
    prompt: {
      system: 'You are an accountant responsible for preparing consolidation workpapers for audit and documentation purposes.',
      user: `Prepare consolidation workpapers for period ${args.reportingPeriod}.

Consolidated financials: ${JSON.stringify(args.consolidatedFinancials)}
All consolidation steps: ${JSON.stringify(args.allSteps)}

Prepare workpapers:
1. Consolidation Schedule
   - Entity columns with all entities
   - Elimination columns
   - Consolidated column
   - Line by line detail

2. Elimination Entry Support
   - Each elimination entry documented
   - Purpose and calculation
   - Reference to matching/validation

3. Currency Translation Workpapers
   - Exchange rates
   - Translation calculations by entity
   - CTA calculation

4. Intercompany Reconciliation
   - IC matching schedules
   - Unresolved items tracking

5. NCI Calculation Support
   - Ownership percentages
   - NCI calculations
   - NCI rollforward

6. Consolidation Adjustments
   - Non-elimination adjustments
   - Top-side entries
   - Reclassifications

7. Analytical Review
   - Period-over-period comparison
   - Key ratio analysis
   - Flux analysis

Organize for audit review with proper cross-references.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
