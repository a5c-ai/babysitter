/**
 * @file revenue-recognition-asc606.js
 * @description Implementing the five-step revenue recognition model for proper timing and amount of revenue recognition across various contract types
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Revenue Recognition and ASC 606 Compliance Process
 * @param {Object} inputs - Process inputs
 * @param {Object} inputs.contract - Contract details for revenue recognition analysis
 * @param {string} inputs.reportingPeriod - Period for revenue recognition
 * @param {Object} inputs.transactionData - Transaction data for the contract
 * @param {Object} inputs.historicalTreatment - Historical revenue recognition for similar contracts
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Revenue recognition analysis and journal entries
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Contract Identification (ASC 606 Step 1)
  const contractResult = await ctx.task(identifyContractTask, {
    contract: inputs.contract,
    historicalTreatment: inputs.historicalTreatment
  });
  results.steps.push({ name: 'contract-identification', result: contractResult });

  // Step 2: Performance Obligation Identification (ASC 606 Step 2)
  const obligationsResult = await ctx.task(identifyPerformanceObligationsTask, {
    contract: contractResult,
    transactionData: inputs.transactionData
  });
  results.steps.push({ name: 'performance-obligations', result: obligationsResult });

  // Breakpoint for obligation review
  await ctx.breakpoint('obligation-review', {
    message: 'Review identified performance obligations before determining transaction price',
    data: obligationsResult
  });

  // Step 3: Transaction Price Determination (ASC 606 Step 3)
  const transactionPriceResult = await ctx.task(determineTransactionPriceTask, {
    contract: contractResult,
    obligations: obligationsResult
  });
  results.steps.push({ name: 'transaction-price', result: transactionPriceResult });

  // Step 4: Allocate Transaction Price (ASC 606 Step 4)
  const allocationResult = await ctx.task(allocateTransactionPriceTask, {
    transactionPrice: transactionPriceResult,
    obligations: obligationsResult
  });
  results.steps.push({ name: 'price-allocation', result: allocationResult });

  // Breakpoint for allocation review
  await ctx.breakpoint('allocation-review', {
    message: 'Review transaction price allocation before recognizing revenue',
    data: allocationResult
  });

  // Step 5: Revenue Recognition (ASC 606 Step 5)
  const recognitionResult = await ctx.task(recognizeRevenueTask, {
    allocation: allocationResult,
    obligations: obligationsResult,
    reportingPeriod: inputs.reportingPeriod
  });
  results.steps.push({ name: 'revenue-recognition', result: recognitionResult });

  // Step 6: Prepare Journal Entries
  const journalEntriesResult = await ctx.task(prepareJournalEntriesTask, {
    recognition: recognitionResult,
    reportingPeriod: inputs.reportingPeriod
  });
  results.steps.push({ name: 'journal-entries', result: journalEntriesResult });

  // Step 7: Disclosure Preparation
  const disclosureResult = await ctx.task(prepareDisclosuresTask, {
    contract: contractResult,
    recognition: recognitionResult,
    reportingPeriod: inputs.reportingPeriod
  });
  results.steps.push({ name: 'disclosures', result: disclosureResult });

  results.outputs = {
    revenueRecognized: recognitionResult,
    journalEntries: journalEntriesResult,
    disclosures: disclosureResult,
    contract: contractResult
  };

  return results;
}

// Task definitions
export const identifyContractTask = defineTask('identify-contract', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'revenue-accounting' },
  agent: {
    name: 'revenue-accountant',
    prompt: {
      system: 'You are a revenue recognition specialist applying ASC 606 Step 1: Identify the Contract.',
      user: `Analyze and identify the contract for ASC 606 purposes.

Contract details: ${JSON.stringify(args.contract)}
Historical treatment: ${JSON.stringify(args.historicalTreatment)}

Evaluate contract existence criteria:
1. Contract Approval and Commitment
   - Parties have approved the contract
   - Parties are committed to perform obligations

2. Rights Identification
   - Each party's rights regarding goods/services

3. Payment Terms
   - Payment terms are identified

4. Commercial Substance
   - Contract has commercial substance
   - Risk, timing, or amount of cash flows will change

5. Collectability
   - Collection of consideration is probable

6. Contract Modifications
   - Any modifications to evaluate
   - Separate contract vs. modification accounting

7. Contract Combination
   - Evaluate if multiple contracts should be combined

Document conclusion on contract existence and any special considerations.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const identifyPerformanceObligationsTask = defineTask('identify-performance-obligations', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'revenue-accounting' },
  agent: {
    name: 'revenue-accountant',
    prompt: {
      system: 'You are a revenue recognition specialist applying ASC 606 Step 2: Identify Performance Obligations.',
      user: `Identify performance obligations in the contract.

Contract: ${JSON.stringify(args.contract)}
Transaction data: ${JSON.stringify(args.transactionData)}

For each promised good or service, evaluate:
1. Distinct Good or Service Analysis
   - Can the customer benefit from the good/service on its own?
   - Can the customer benefit with other readily available resources?

2. Separately Identifiable Analysis
   - Is the promise separately identifiable from other promises?
   - Are goods/services highly interdependent or interrelated?

3. Series Guidance
   - Do distinct goods/services qualify as a series?
   - Same pattern of transfer over time?
   - Same measure of progress?

4. Common Performance Obligation Types
   - Product delivery
   - Service performance
   - License grants
   - Warranties (assurance vs. service type)
   - Customer options (material rights)
   - Principal vs. agent considerations

List all identified performance obligations with supporting analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const determineTransactionPriceTask = defineTask('determine-transaction-price', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'revenue-accounting' },
  agent: {
    name: 'revenue-accountant',
    prompt: {
      system: 'You are a revenue recognition specialist applying ASC 606 Step 3: Determine the Transaction Price.',
      user: `Determine the transaction price for the contract.

Contract: ${JSON.stringify(args.contract)}
Performance obligations: ${JSON.stringify(args.obligations)}

Analyze transaction price components:
1. Fixed Consideration
   - Stated contract price
   - Contracted amounts

2. Variable Consideration
   - Discounts, rebates, refunds
   - Price concessions
   - Incentives, bonuses, penalties
   - Estimate using expected value or most likely amount
   - Apply constraint on variable consideration

3. Significant Financing Component
   - Time value of money if significant
   - Practical expedient evaluation (< 1 year)

4. Non-Cash Consideration
   - Fair value of non-cash consideration
   - Measurement date

5. Consideration Payable to Customer
   - Payments to customers
   - Reduction of transaction price vs. expense

Calculate total transaction price with supporting analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const allocateTransactionPriceTask = defineTask('allocate-transaction-price', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'revenue-accounting' },
  agent: {
    name: 'revenue-accountant',
    prompt: {
      system: 'You are a revenue recognition specialist applying ASC 606 Step 4: Allocate the Transaction Price.',
      user: `Allocate the transaction price to performance obligations.

Transaction price: ${JSON.stringify(args.transactionPrice)}
Performance obligations: ${JSON.stringify(args.obligations)}

Allocation approach:
1. Standalone Selling Price (SSP) Determination
   For each performance obligation:
   - Observable standalone selling price (if available)
   - Estimated SSP methods:
     - Adjusted market assessment
     - Expected cost plus margin
     - Residual approach (if criteria met)

2. Relative SSP Allocation
   - Calculate relative SSP percentages
   - Allocate transaction price proportionally

3. Special Allocation Situations
   - Discounts
     - Allocate to all obligations unless evidence of specific allocation
   - Variable consideration
     - Allocate entirely to specific obligation if criteria met
   - Changes in transaction price
     - Allocate consistently with initial allocation

4. Documentation
   - SSP determination methodology
   - Allocation calculations
   - Supporting evidence

Present allocation schedule with amounts per obligation.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const recognizeRevenueTask = defineTask('recognize-revenue', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'revenue-accounting' },
  agent: {
    name: 'revenue-accountant',
    prompt: {
      system: 'You are a revenue recognition specialist applying ASC 606 Step 5: Recognize Revenue.',
      user: `Determine when to recognize revenue for each performance obligation.

Price allocation: ${JSON.stringify(args.allocation)}
Performance obligations: ${JSON.stringify(args.obligations)}
Reporting period: ${args.reportingPeriod}

For each performance obligation:
1. Point in Time vs. Over Time
   Evaluate over time criteria:
   - Customer simultaneously receives and consumes benefits
   - Entity's performance creates or enhances customer-controlled asset
   - Entity's performance creates asset with no alternative use AND enforceable right to payment

2. Over Time Revenue Recognition
   If over time criteria met:
   - Select measure of progress (input or output method)
   - Calculate percentage complete
   - Recognize revenue based on progress

3. Point in Time Revenue Recognition
   If over time criteria not met:
   - Identify when control transfers
   - Consider indicators of control transfer:
     - Right to payment
     - Legal title
     - Physical possession
     - Risks and rewards
     - Customer acceptance

4. Calculate Revenue for Period
   - Revenue recognized this period
   - Cumulative revenue to date
   - Deferred revenue balance

Document recognition timing and amounts with support.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareJournalEntriesTask = defineTask('prepare-journal-entries', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'accounting-operations' },
  agent: {
    name: 'journal-entry-accountant',
    prompt: {
      system: 'You are an accountant responsible for preparing journal entries for revenue recognition.',
      user: `Prepare journal entries for revenue recognition.

Recognition analysis: ${JSON.stringify(args.recognition)}
Reporting period: ${args.reportingPeriod}

Prepare entries for:
1. Revenue Recognition
   Dr. Accounts Receivable / Contract Asset
   Cr. Revenue

2. Deferred Revenue
   - Initial recognition when payment received before performance
   - Release as performance obligations satisfied

3. Contract Assets
   - Revenue recognized before right to payment
   - Transfer to receivable when right to payment unconditional

4. Contract Costs
   - Incremental costs of obtaining contract
   - Costs to fulfill contract
   - Amortization of contract costs

5. Variable Consideration Adjustments
   - Updates to estimates
   - Constraint releases

For each entry:
- Account codes and descriptions
- Debit/credit amounts
- Support reference
- Period

Ensure entries properly reflect ASC 606 requirements.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareDisclosuresTask = defineTask('prepare-revenue-disclosures', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-reporting' },
  agent: {
    name: 'disclosure-specialist',
    prompt: {
      system: 'You are a disclosure specialist preparing ASC 606 revenue disclosures.',
      user: `Prepare ASC 606 revenue disclosures.

Contract: ${JSON.stringify(args.contract)}
Recognition: ${JSON.stringify(args.recognition)}
Reporting period: ${args.reportingPeriod}

Prepare required disclosures:
1. Disaggregation of Revenue
   - By geography
   - By product/service type
   - By timing (point in time vs. over time)
   - By customer type

2. Contract Balances
   - Accounts receivable
   - Contract assets
   - Contract liabilities (deferred revenue)
   - Reconciliation of changes

3. Performance Obligations
   - Description of obligations
   - Timing of satisfaction
   - Payment terms
   - Variable consideration
   - Significant judgments

4. Remaining Performance Obligations
   - Transaction price allocated to remaining obligations
   - When expected to recognize (time bands)
   - Practical expedients applied

5. Costs to Obtain and Fulfill Contracts
   - Assets recognized
   - Amortization method
   - Amortization expense

6. Significant Judgments
   - Methods used to recognize revenue
   - Methods used to determine SSP
   - Variable consideration estimates

Format disclosures per ASC 606 requirements.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
