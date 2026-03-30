/**
 * @file transfer-pricing-documentation.js
 * @description Developing and maintaining transfer pricing policies, benchmarking studies, and contemporaneous documentation for intercompany transactions
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Transfer Pricing Documentation Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.fiscalYear - Fiscal year for documentation
 * @param {Object} inputs.intercompanyTransactions - Intercompany transaction data
 * @param {Object} inputs.entityStructure - Legal entity and ownership structure
 * @param {Object} inputs.functionalAnalysis - Functional analysis data
 * @param {Object} inputs.priorYearDocumentation - Prior year TP documentation
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Transfer pricing documentation package
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Intercompany Transaction Analysis
  const transactionResult = await ctx.task(analyzeIntercompanyTransactionsTask, {
    intercompanyTransactions: inputs.intercompanyTransactions,
    entityStructure: inputs.entityStructure,
    fiscalYear: inputs.fiscalYear
  });
  results.steps.push({ name: 'transaction-analysis', result: transactionResult });

  // Step 2: Functional Analysis
  const functionalResult = await ctx.task(performFunctionalAnalysisTask, {
    transactions: transactionResult,
    functionalAnalysis: inputs.functionalAnalysis,
    entityStructure: inputs.entityStructure
  });
  results.steps.push({ name: 'functional-analysis', result: functionalResult });

  // Breakpoint for functional analysis review
  await ctx.breakpoint('functional-review', {
    message: 'Review functional analysis before selecting transfer pricing methods',
    data: functionalResult
  });

  // Step 3: Economic Analysis and Method Selection
  const methodResult = await ctx.task(selectTransferPricingMethodsTask, {
    functionalAnalysis: functionalResult,
    transactions: transactionResult
  });
  results.steps.push({ name: 'method-selection', result: methodResult });

  // Step 4: Benchmarking Study
  const benchmarkResult = await ctx.task(conductBenchmarkingStudyTask, {
    transactions: transactionResult,
    methods: methodResult,
    fiscalYear: inputs.fiscalYear
  });
  results.steps.push({ name: 'benchmarking-study', result: benchmarkResult });

  // Breakpoint for benchmarking review
  await ctx.breakpoint('benchmarking-review', {
    message: 'Review benchmarking results before arm\'s length analysis',
    data: benchmarkResult
  });

  // Step 5: Arm's Length Analysis
  const armsLengthResult = await ctx.task(performArmsLengthAnalysisTask, {
    actualResults: transactionResult,
    benchmarkResults: benchmarkResult,
    methods: methodResult
  });
  results.steps.push({ name: 'arms-length-analysis', result: armsLengthResult });

  // Step 6: Prepare Master File
  const masterFileResult = await ctx.task(prepareMasterFileTask, {
    entityStructure: inputs.entityStructure,
    transactions: transactionResult,
    functionalAnalysis: functionalResult,
    fiscalYear: inputs.fiscalYear
  });
  results.steps.push({ name: 'master-file', result: masterFileResult });

  // Step 7: Prepare Local Files
  const localFileResult = await ctx.task(prepareLocalFilesTask, {
    transactions: transactionResult,
    benchmarking: benchmarkResult,
    armsLengthAnalysis: armsLengthResult,
    entityStructure: inputs.entityStructure
  });
  results.steps.push({ name: 'local-files', result: localFileResult });

  // Step 8: Country-by-Country Reporting
  const cbcrResult = await ctx.task(prepareCbCReportTask, {
    entityStructure: inputs.entityStructure,
    financialData: inputs.intercompanyTransactions,
    fiscalYear: inputs.fiscalYear
  });
  results.steps.push({ name: 'cbcr', result: cbcrResult });

  results.outputs = {
    masterFile: masterFileResult,
    localFiles: localFileResult,
    cbcReport: cbcrResult,
    benchmarkingStudy: benchmarkResult,
    fiscalYear: inputs.fiscalYear
  };

  return results;
}

// Task definitions
export const analyzeIntercompanyTransactionsTask = defineTask('analyze-ic-transactions', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'transfer-pricing' },
  agent: {
    name: 'tp-analyst',
    prompt: {
      system: 'You are a transfer pricing analyst analyzing intercompany transactions.',
      user: `Analyze intercompany transactions for fiscal year ${args.fiscalYear}.

Intercompany transactions: ${JSON.stringify(args.intercompanyTransactions)}
Entity structure: ${JSON.stringify(args.entityStructure)}

Analyze:
1. Transaction Identification
   - Tangible goods transactions
   - Services transactions
   - Intangible property transactions
   - Financial transactions
   - Cost sharing arrangements

2. Transaction Details
   For each transaction type:
   - Parties involved
   - Nature of transaction
   - Volume/amount
   - Pricing mechanism
   - Terms and conditions

3. Transaction Categories
   - Manufacturing/distribution
   - Management services
   - Technical services
   - Royalties/licensing
   - Interest charges
   - Guarantees

4. Materiality Assessment
   - Transaction volumes
   - Profit impact
   - Risk assessment
   - Documentation priority

5. Related Party Matrix
   - Entity relationships
   - Transaction flows
   - Value chain mapping

6. Prior Year Comparison
   - Changes from prior year
   - New transaction types
   - Volume changes

Output intercompany transaction analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const performFunctionalAnalysisTask = defineTask('perform-functional-analysis', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'transfer-pricing' },
  agent: {
    name: 'tp-economist',
    prompt: {
      system: 'You are a transfer pricing economist performing functional analysis.',
      user: `Perform functional analysis for intercompany transactions.

Transactions: ${JSON.stringify(args.transactions)}
Functional analysis data: ${JSON.stringify(args.functionalAnalysis)}
Entity structure: ${JSON.stringify(args.entityStructure)}

Analyze for each entity:
1. Functions Performed
   - Manufacturing/production
   - Research and development
   - Sales and marketing
   - Distribution/logistics
   - Management/administration
   - Quality control
   - Procurement

2. Assets Employed
   - Tangible assets
   - Intangible assets
   - Human capital
   - Working capital

3. Risks Assumed
   - Market risk
   - Credit risk
   - Inventory risk
   - Foreign exchange risk
   - Product liability risk
   - R&D risk

4. Characterization
   - Entrepreneur vs. routine
   - Full-fledged manufacturer
   - Contract manufacturer
   - Limited risk distributor
   - Commissionaire
   - Service provider type

5. Value Chain Analysis
   - Key value drivers
   - Profit allocation rationale
   - Routine vs. residual returns

6. Comparability Factors
   - Industry characteristics
   - Contractual terms
   - Economic circumstances
   - Business strategies

Output functional analysis documentation.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const selectTransferPricingMethodsTask = defineTask('select-tp-methods', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'transfer-pricing' },
  agent: {
    name: 'tp-economist',
    prompt: {
      system: 'You are a transfer pricing economist selecting appropriate pricing methods.',
      user: `Select transfer pricing methods.

Functional analysis: ${JSON.stringify(args.functionalAnalysis)}
Transactions: ${JSON.stringify(args.transactions)}

For each transaction type, select method:
1. Traditional Transaction Methods
   - Comparable Uncontrolled Price (CUP)
   - Resale Price Method (RPM)
   - Cost Plus Method (CPM)

2. Transactional Profit Methods
   - Transactional Net Margin Method (TNMM)
   - Profit Split Method

3. Method Selection Criteria
   - Comparability analysis
   - Availability of data
   - Reliability of method
   - Consistency with functional analysis

4. Best Method Analysis
   For each transaction:
   - Methods considered
   - Methods rejected with rationale
   - Selected method
   - Selection rationale

5. Profit Level Indicator
   - Operating margin
   - Berry ratio
   - Return on assets
   - Return on capital employed
   - Other PLI selection rationale

6. Tested Party Selection
   - Entity to be tested
   - Selection rationale
   - Data availability

Output method selection documentation.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const conductBenchmarkingStudyTask = defineTask('conduct-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'transfer-pricing' },
  agent: {
    name: 'benchmarking-analyst',
    prompt: {
      system: 'You are a transfer pricing analyst conducting benchmarking studies.',
      user: `Conduct benchmarking study for fiscal year ${args.fiscalYear}.

Transactions: ${JSON.stringify(args.transactions)}
Methods: ${JSON.stringify(args.methods)}

Conduct:
1. Search Strategy
   - Database selection
   - Geographic scope
   - Time period
   - Industry codes

2. Quantitative Screening
   - Revenue thresholds
   - Employee thresholds
   - Independence criteria
   - Financial data availability

3. Qualitative Screening
   - Business description review
   - Functional comparability
   - Reject criteria

4. Comparability Adjustments
   - Working capital adjustments
   - Accounting differences
   - Risk adjustments
   - Country risk adjustments

5. Statistical Analysis
   - Quartile analysis
   - Median calculation
   - Interquartile range
   - Weighted average (if applicable)

6. Final Comparable Set
   - Accepted comparables
   - Brief descriptions
   - Financial data
   - Arm's length range

7. Documentation
   - Search parameters
   - Rejection log
   - Adjustment calculations
   - Database screenshots

Output benchmarking study results.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const performArmsLengthAnalysisTask = defineTask('arms-length-analysis', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'transfer-pricing' },
  agent: {
    name: 'tp-analyst',
    prompt: {
      system: 'You are a transfer pricing analyst performing arm\'s length testing.',
      user: `Perform arm's length analysis.

Actual results: ${JSON.stringify(args.actualResults)}
Benchmark results: ${JSON.stringify(args.benchmarkResults)}
Methods: ${JSON.stringify(args.methods)}

Analyze:
1. Tested Party Results
   - Profit level indicator calculated
   - Single year vs. multi-year average
   - Adjustments applied

2. Arm's Length Range
   - Interquartile range
   - Full range (if justified)
   - Point in range selection

3. Comparison
   - Tested party result vs. range
   - Within/outside range determination
   - Distance from median/quartiles

4. Conclusions
   For each transaction:
   - Arm's length status
   - Supporting rationale
   - Risk areas identified

5. Adjustment Analysis
   If outside range:
   - Adjustment calculation
   - Adjustment target (median or other)
   - Income adjustment amount

6. Year-over-Year Analysis
   - Current vs. prior year
   - Trend analysis
   - Consistency assessment

7. Risk Assessment
   - Audit risk areas
   - Documentation gaps
   - Improvement recommendations

Output arm's length analysis conclusions.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareMasterFileTask = defineTask('prepare-master-file', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'transfer-pricing' },
  agent: {
    name: 'tp-documentation-specialist',
    prompt: {
      system: 'You are a transfer pricing specialist preparing OECD-compliant Master File documentation.',
      user: `Prepare Master File for fiscal year ${args.fiscalYear}.

Entity structure: ${JSON.stringify(args.entityStructure)}
Transactions: ${JSON.stringify(args.transactions)}
Functional analysis: ${JSON.stringify(args.functionalAnalysis)}

Prepare OECD Master File sections:
1. Organizational Structure
   - Legal ownership chart
   - Geographic locations
   - Operating structure

2. Business Description
   - Business overview
   - Key drivers of profit
   - Supply chain description
   - Major service arrangements
   - Geographic markets

3. Intangibles
   - Important intangibles
   - Intangible owners
   - Related party agreements
   - Transfer pricing policies
   - Intangible transfers

4. Financial Activities
   - Group financing arrangements
   - Group treasury functions
   - Transfer pricing policies for financing

5. Financial and Tax Positions
   - Consolidated financial statements
   - Unilateral APAs
   - Other rulings

6. Global Transfer Pricing Policies
   - Policy framework
   - Documentation of policies

Output OECD-compliant Master File.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareLocalFilesTask = defineTask('prepare-local-files', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'transfer-pricing' },
  agent: {
    name: 'tp-documentation-specialist',
    prompt: {
      system: 'You are a transfer pricing specialist preparing Local File documentation.',
      user: `Prepare Local Files for relevant jurisdictions.

Transactions: ${JSON.stringify(args.transactions)}
Benchmarking: ${JSON.stringify(args.benchmarking)}
Arms length analysis: ${JSON.stringify(args.armsLengthAnalysis)}
Entity structure: ${JSON.stringify(args.entityStructure)}

For each jurisdiction:
1. Local Entity
   - Management structure
   - Organization chart
   - Business activities
   - Key competitors

2. Controlled Transactions
   - Transaction descriptions
   - Amounts
   - Related parties
   - Contractual arrangements

3. Functional Analysis
   - Local entity functions
   - Assets employed
   - Risks assumed

4. Transfer Pricing Analysis
   - Method selection
   - Comparability analysis
   - Benchmarking results
   - Financial information

5. Financial Data
   - Audited financials
   - Segmented data
   - Allocation keys

6. Country-Specific Requirements
   - Local filing requirements
   - Specific disclosures
   - Language requirements
   - Penalty thresholds

Output jurisdiction-specific Local Files.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareCbCReportTask = defineTask('prepare-cbcr', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'transfer-pricing' },
  agent: {
    name: 'cbcr-specialist',
    prompt: {
      system: 'You are a transfer pricing specialist preparing Country-by-Country Reports.',
      user: `Prepare Country-by-Country Report for fiscal year ${args.fiscalYear}.

Entity structure: ${JSON.stringify(args.entityStructure)}
Financial data: ${JSON.stringify(args.financialData)}

Prepare:
1. Table 1: Overview by Tax Jurisdiction
   For each jurisdiction:
   - Revenue (related party)
   - Revenue (unrelated party)
   - Profit before tax
   - Income tax paid (cash)
   - Income tax accrued
   - Stated capital
   - Accumulated earnings
   - Number of employees
   - Tangible assets (non-cash)

2. Table 2: Entity Listing
   For each constituent entity:
   - Name
   - Tax jurisdiction of organization
   - Tax jurisdiction of residence
   - Main business activities

3. Table 3: Additional Information
   - Brief description of activities
   - Data sources
   - Currency and exchange rates
   - Explanatory notes

4. Filing Requirements
   - Filing jurisdiction
   - Filing deadline
   - Notification requirements
   - Exchange relationships

5. Data Quality
   - Reconciliation to financials
   - Consistency checks
   - Prior year comparison

Output Country-by-Country Report.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
