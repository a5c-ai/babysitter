/**
 * @file lease-accounting-asc842.js
 * @description Proper accounting treatment for operating and finance leases including right-of-use assets and lease liabilities
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Lease Accounting and ASC 842 Implementation Process
 * @param {Object} inputs - Process inputs
 * @param {Object} inputs.leaseContract - Lease contract details
 * @param {string} inputs.reportingPeriod - Period for lease accounting
 * @param {Object} inputs.incrementalBorrowingRate - Entity's incremental borrowing rate
 * @param {Object} inputs.existingLeaseData - Existing lease portfolio data
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Lease accounting entries and schedules
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Lease Identification and Classification
  const identificationResult = await ctx.task(identifyAndClassifyLeaseTask, {
    leaseContract: inputs.leaseContract,
    existingLeaseData: inputs.existingLeaseData
  });
  results.steps.push({ name: 'lease-identification', result: identificationResult });

  // Step 2: Determine Lease Term
  const leaseTermResult = await ctx.task(determineLeaseTermTask, {
    leaseContract: inputs.leaseContract,
    identificationResult: identificationResult
  });
  results.steps.push({ name: 'lease-term', result: leaseTermResult });

  // Step 3: Calculate Lease Payments
  const paymentsResult = await ctx.task(calculateLeasePaymentsTask, {
    leaseContract: inputs.leaseContract,
    leaseTerm: leaseTermResult
  });
  results.steps.push({ name: 'lease-payments', result: paymentsResult });

  // Breakpoint for payment calculation review
  await ctx.breakpoint('payment-review', {
    message: 'Review lease payment calculations before present value computation',
    data: { term: leaseTermResult, payments: paymentsResult }
  });

  // Step 4: Calculate Present Value
  const presentValueResult = await ctx.task(calculatePresentValueTask, {
    leasePayments: paymentsResult,
    incrementalBorrowingRate: inputs.incrementalBorrowingRate,
    leaseClassification: identificationResult.classification
  });
  results.steps.push({ name: 'present-value', result: presentValueResult });

  // Step 5: Initial Recognition
  const recognitionResult = await ctx.task(performInitialRecognitionTask, {
    presentValue: presentValueResult,
    leaseClassification: identificationResult.classification,
    leaseContract: inputs.leaseContract
  });
  results.steps.push({ name: 'initial-recognition', result: recognitionResult });

  // Step 6: Subsequent Measurement
  const measurementResult = await ctx.task(performSubsequentMeasurementTask, {
    initialRecognition: recognitionResult,
    reportingPeriod: inputs.reportingPeriod,
    leaseClassification: identificationResult.classification
  });
  results.steps.push({ name: 'subsequent-measurement', result: measurementResult });

  // Breakpoint for accounting review
  await ctx.breakpoint('accounting-review', {
    message: 'Review lease accounting entries and amortization schedules',
    data: { recognition: recognitionResult, measurement: measurementResult }
  });

  // Step 7: Prepare Disclosures
  const disclosuresResult = await ctx.task(prepareLeaseDisclosuresTask, {
    allLeaseData: {
      identification: identificationResult,
      recognition: recognitionResult,
      measurement: measurementResult
    },
    reportingPeriod: inputs.reportingPeriod
  });
  results.steps.push({ name: 'disclosures', result: disclosuresResult });

  results.outputs = {
    leaseAccounting: measurementResult,
    disclosures: disclosuresResult,
    amortizationSchedule: presentValueResult.amortizationSchedule,
    classification: identificationResult.classification
  };

  return results;
}

// Task definitions
export const identifyAndClassifyLeaseTask = defineTask('identify-classify-lease', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'lease-accounting' },
  agent: {
    name: 'lease-accountant',
    prompt: {
      system: 'You are a lease accounting specialist applying ASC 842 for lease identification and classification.',
      user: `Identify and classify the lease under ASC 842.

Lease contract: ${JSON.stringify(args.leaseContract)}
Existing lease data: ${JSON.stringify(args.existingLeaseData)}

Perform:
1. Lease Identification
   Evaluate if contract contains a lease:
   - Is there an identified asset?
   - Does lessee have right to control use?
   - Does lessee obtain substantially all economic benefits?
   - Does lessee have right to direct use?

2. Lease vs. Service Evaluation
   - Determine if arrangement is lease or service
   - Evaluate embedded lease components

3. Lease Classification (Finance vs. Operating)
   Evaluate finance lease criteria:
   - Transfer of ownership
   - Purchase option reasonably certain
   - Lease term is major part of economic life (75% rule)
   - Present value is substantially all of fair value (90% rule)
   - Asset is specialized

4. Component Separation
   - Identify lease components
   - Identify non-lease components
   - Determine allocation approach or practical expedient

5. Short-Term Lease Evaluation
   - Lease term 12 months or less
   - No purchase option reasonably certain
   - Policy election

Document classification determination with support.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const determineLeaseTermTask = defineTask('determine-lease-term', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'lease-accounting' },
  agent: {
    name: 'lease-accountant',
    prompt: {
      system: 'You are a lease accounting specialist determining lease terms under ASC 842.',
      user: `Determine the lease term under ASC 842.

Lease contract: ${JSON.stringify(args.leaseContract)}
Identification result: ${JSON.stringify(args.identificationResult)}

Determine:
1. Non-Cancellable Period
   - Initial term per contract
   - Notice requirements

2. Extension Options
   - Optional extension periods
   - Assessment of reasonably certain to exercise
   - Economic factors
   - Lessee-specific factors

3. Termination Options
   - Optional termination periods
   - Assessment of reasonably certain NOT to exercise

4. Lessor Options
   - Lessor extension options
   - Lessor termination options

5. Lease Term Determination
   - Non-cancellable period
   - Plus: Periods covered by extension options reasonably certain
   - Plus: Periods covered by termination options reasonably certain not to exercise
   - Plus: Periods after lessor option if lessor controlled

6. Reassessment Triggers
   - Significant events or changes
   - Option exercise dates

Document lease term with supporting analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const calculateLeasePaymentsTask = defineTask('calculate-lease-payments', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'lease-accounting' },
  agent: {
    name: 'lease-accountant',
    prompt: {
      system: 'You are a lease accounting specialist calculating lease payments under ASC 842.',
      user: `Calculate lease payments to include in lease liability.

Lease contract: ${JSON.stringify(args.leaseContract)}
Lease term: ${JSON.stringify(args.leaseTerm)}

Include in lease payments:
1. Fixed Payments
   - Base rent
   - Less: Lease incentives receivable

2. Variable Payments Based on Index/Rate
   - CPI adjustments
   - Market rate adjustments
   - Initial index/rate at commencement

3. Exercise Price of Purchase Option
   - If reasonably certain to exercise

4. Termination Penalties
   - If lease term reflects termination

5. Residual Value Guarantees
   - Amounts probable of being owed

6. Do NOT Include
   - Variable payments not based on index/rate
   - Non-lease components (unless practical expedient)

Build payment schedule:
- Payment dates
- Payment amounts by type
- Total payments by period

Output detailed payment schedule for present value calculation.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const calculatePresentValueTask = defineTask('calculate-present-value', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'lease-accounting' },
  agent: {
    name: 'lease-accountant',
    prompt: {
      system: 'You are a lease accounting specialist calculating present value of lease payments.',
      user: `Calculate present value of lease payments.

Lease payments: ${JSON.stringify(args.leasePayments)}
Incremental borrowing rate: ${JSON.stringify(args.incrementalBorrowingRate)}
Lease classification: ${args.leaseClassification}

Calculate:
1. Discount Rate Determination
   - Rate implicit in lease (if determinable)
   - Otherwise: Incremental borrowing rate
   - Document rate selection

2. Present Value Calculation
   - Discount each payment to commencement date
   - Sum of present values = Lease liability

3. Build Amortization Schedule
   For each period:
   - Beginning liability balance
   - Interest expense (liability x rate)
   - Lease payment
   - Principal reduction
   - Ending liability balance

4. Current vs. Non-Current Split
   - Current: Principal portion due in 12 months
   - Non-current: Remainder

5. Classification-Specific Calculations
   Finance Lease:
   - Separate interest and amortization
   Operating Lease:
   - Single lease expense (unless different pattern)
   - ROU asset adjustment for straight-line

Output present value, amortization schedule, and classification details.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const performInitialRecognitionTask = defineTask('initial-recognition', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'lease-accounting' },
  agent: {
    name: 'lease-accountant',
    prompt: {
      system: 'You are a lease accounting specialist performing initial recognition of leases under ASC 842.',
      user: `Perform initial recognition of the lease.

Present value calculation: ${JSON.stringify(args.presentValue)}
Lease classification: ${args.leaseClassification}
Lease contract: ${JSON.stringify(args.leaseContract)}

Initial Recognition:
1. Right-of-Use Asset
   Components:
   - Lease liability (present value)
   - Lease payments made before commencement
   - Initial direct costs
   - Less: Lease incentives received

2. Lease Liability
   - Present value of lease payments

3. Journal Entry - Commencement Date
   Finance Lease:
   Dr. ROU Asset - Finance Lease
   Cr. Lease Liability - Finance Lease

   Operating Lease:
   Dr. ROU Asset - Operating Lease
   Cr. Lease Liability - Operating Lease

4. Additional Entries (if applicable)
   - Prepaid rent reclassification
   - Initial direct costs
   - Lease incentives

5. Balance Sheet Presentation
   - ROU asset classification
   - Liability current/non-current split

Document all initial recognition entries with amounts.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const performSubsequentMeasurementTask = defineTask('subsequent-measurement', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'lease-accounting' },
  agent: {
    name: 'lease-accountant',
    prompt: {
      system: 'You are a lease accounting specialist performing subsequent measurement of leases.',
      user: `Perform subsequent measurement for period ${args.reportingPeriod}.

Initial recognition: ${JSON.stringify(args.initialRecognition)}
Lease classification: ${args.leaseClassification}

Subsequent Measurement:
1. Finance Lease
   Lease Liability:
   - Increase for interest (effective interest method)
   - Decrease for payments made

   ROU Asset:
   - Amortize over shorter of lease term or useful life
   - Test for impairment

   Journal Entry:
   Dr. Interest Expense
   Dr. Amortization Expense
   Cr. Accumulated Amortization - ROU Asset
   Cr. Lease Liability
   Cr. Cash

2. Operating Lease
   Lease Liability:
   - Increase for interest (effective interest method)
   - Decrease for payments made

   ROU Asset:
   - Calculated as lease liability plus prepaid/minus accrued
   - Results in straight-line lease expense

   Journal Entry:
   Dr. Lease Expense (single line, straight-line)
   Cr. Lease Liability (principal portion)
   Cr. ROU Asset (balancing amount)
   Cr. Cash

3. Variable Lease Payments
   - Expense as incurred

4. Remeasurement Events
   - Changes in lease term assessment
   - Changes in purchase option assessment
   - Changes in residual value guarantees

Calculate period expense and balance sheet amounts.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareLeaseDisclosuresTask = defineTask('prepare-lease-disclosures', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-reporting' },
  agent: {
    name: 'disclosure-specialist',
    prompt: {
      system: 'You are a disclosure specialist preparing ASC 842 lease disclosures.',
      user: `Prepare ASC 842 lease disclosures for period ${args.reportingPeriod}.

Lease data: ${JSON.stringify(args.allLeaseData)}

Prepare required disclosures:
1. Lease Cost Table
   - Finance lease cost (amortization + interest)
   - Operating lease cost
   - Short-term lease cost
   - Variable lease cost
   - Sublease income

2. Supplemental Balance Sheet Information
   - Finance lease ROU assets
   - Finance lease liabilities (current/non-current)
   - Operating lease ROU assets
   - Operating lease liabilities (current/non-current)

3. Supplemental Cash Flow Information
   - Cash paid for finance lease interest
   - Cash paid for finance lease principal
   - Cash paid for operating leases
   - ROU assets obtained for new leases

4. Weighted-Average Information
   - Weighted-average remaining lease term (finance)
   - Weighted-average remaining lease term (operating)
   - Weighted-average discount rate (finance)
   - Weighted-average discount rate (operating)

5. Maturity Analysis
   - Undiscounted cash flows by year (5 years + thereafter)
   - Reconciliation to lease liability
   - By classification (finance/operating)

6. Qualitative Disclosures
   - General lease description
   - Variable lease payment terms
   - Extension and termination options
   - Residual value guarantees
   - Restrictions and covenants
   - Sale-leaseback transactions

Format disclosures per ASC 842 requirements.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
