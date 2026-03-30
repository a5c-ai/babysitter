/**
 * @file foreign-exchange-risk-management.js
 * @description Identifying FX exposures, developing hedging strategies, executing FX derivatives, and monitoring hedge effectiveness
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Foreign Exchange Risk Management Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.reportingPeriod - Period for FX risk analysis
 * @param {Object} inputs.fxExposures - Current FX exposures by currency
 * @param {Object} inputs.existingHedges - Existing hedge portfolio
 * @param {Object} inputs.forecastedTransactions - Forecasted FX transactions
 * @param {Object} inputs.hedgingPolicy - Company FX hedging policy
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} FX risk management results
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: FX Exposure Identification
  const exposureResult = await ctx.task(identifyFXExposuresTask, {
    fxExposures: inputs.fxExposures,
    forecastedTransactions: inputs.forecastedTransactions,
    reportingPeriod: inputs.reportingPeriod
  });
  results.steps.push({ name: 'exposure-identification', result: exposureResult });

  // Step 2: FX Risk Assessment
  const riskResult = await ctx.task(assessFXRiskTask, {
    exposures: exposureResult,
    existingHedges: inputs.existingHedges
  });
  results.steps.push({ name: 'risk-assessment', result: riskResult });

  // Breakpoint for exposure review
  await ctx.breakpoint('exposure-review', {
    message: 'Review FX exposures and risk assessment before developing hedging strategy',
    data: { exposures: exposureResult, risks: riskResult }
  });

  // Step 3: Hedging Strategy Development
  const strategyResult = await ctx.task(developHedgingStrategyTask, {
    riskAssessment: riskResult,
    hedgingPolicy: inputs.hedgingPolicy,
    existingHedges: inputs.existingHedges
  });
  results.steps.push({ name: 'hedging-strategy', result: strategyResult });

  // Step 4: Hedge Execution Planning
  const executionResult = await ctx.task(planHedgeExecutionTask, {
    hedgingStrategy: strategyResult,
    hedgingPolicy: inputs.hedgingPolicy
  });
  results.steps.push({ name: 'execution-planning', result: executionResult });

  // Breakpoint for hedge approval
  await ctx.breakpoint('hedge-approval', {
    message: 'Review and approve proposed hedge transactions',
    data: executionResult
  });

  // Step 5: Hedge Accounting Documentation
  const hedgeAccountingResult = await ctx.task(documentHedgeAccountingTask, {
    hedgeTransactions: executionResult,
    exposures: exposureResult
  });
  results.steps.push({ name: 'hedge-accounting', result: hedgeAccountingResult });

  // Step 6: Hedge Effectiveness Testing
  const effectivenessResult = await ctx.task(testHedgeEffectivenessTask, {
    existingHedges: inputs.existingHedges,
    hedgeDocumentation: hedgeAccountingResult,
    reportingPeriod: inputs.reportingPeriod
  });
  results.steps.push({ name: 'effectiveness-testing', result: effectivenessResult });

  // Step 7: FX Reporting and Analysis
  const reportingResult = await ctx.task(prepareFXReportingTask, {
    exposures: exposureResult,
    hedges: strategyResult,
    effectiveness: effectivenessResult,
    reportingPeriod: inputs.reportingPeriod
  });
  results.steps.push({ name: 'fx-reporting', result: reportingResult });

  results.outputs = {
    fxExposureAnalysis: exposureResult,
    hedgingStrategy: strategyResult,
    hedgeAccounting: hedgeAccountingResult,
    effectivenessResults: effectivenessResult,
    fxReport: reportingResult
  };

  return results;
}

// Task definitions
export const identifyFXExposuresTask = defineTask('identify-fx-exposures', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'fx-risk-management' },
  agent: {
    name: 'fx-analyst',
    prompt: {
      system: 'You are an FX risk analyst identifying and quantifying foreign exchange exposures.',
      user: `Identify FX exposures for ${args.reportingPeriod}.

Current FX exposures: ${JSON.stringify(args.fxExposures)}
Forecasted transactions: ${JSON.stringify(args.forecastedTransactions)}

Identify exposures by type:
1. Transaction Exposure
   - Foreign currency receivables
   - Foreign currency payables
   - Forecasted sales in foreign currency
   - Forecasted purchases in foreign currency
   - Intercompany transactions

2. Translation Exposure
   - Foreign subsidiary assets
   - Foreign subsidiary liabilities
   - Foreign subsidiary equity
   - Net investment position

3. Economic Exposure
   - Competitive position impacts
   - Revenue sensitivity to FX
   - Cost structure sensitivity
   - Long-term strategic impacts

4. Exposure by Currency
   - EUR exposures
   - GBP exposures
   - JPY exposures
   - Other currency exposures

5. Exposure by Time Horizon
   - Current month
   - 1-3 months
   - 3-6 months
   - 6-12 months
   - Beyond 12 months

6. Exposure Certainty
   - Firm commitments
   - Highly probable forecasts
   - Possible transactions
   - Certainty percentages

Document all FX exposures with amounts and timing.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const assessFXRiskTask = defineTask('assess-fx-risk', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'fx-risk-management' },
  agent: {
    name: 'fx-risk-analyst',
    prompt: {
      system: 'You are an FX risk analyst assessing foreign exchange risk.',
      user: `Assess FX risk from identified exposures.

Exposures: ${JSON.stringify(args.exposures)}
Existing hedges: ${JSON.stringify(args.existingHedges)}

Risk assessment:
1. Net Exposure Calculation
   - Gross exposures by currency
   - Natural hedges/offsets
   - Existing hedge coverage
   - Net unhedged exposure

2. Value at Risk (VaR) Analysis
   - Historical FX volatility
   - VaR by currency
   - Aggregate portfolio VaR
   - Confidence intervals

3. Sensitivity Analysis
   - P&L impact per 1% rate change
   - P&L impact per 5% rate change
   - P&L impact per 10% rate change
   - Balance sheet impact

4. Scenario Analysis
   - Historical scenario replay
   - Hypothetical adverse scenarios
   - Stress test scenarios
   - Correlation breakdown scenarios

5. Cash Flow at Risk
   - Expected cash flows
   - Cash flow volatility
   - Worst case cash flows

6. Current Hedge Effectiveness
   - Hedge ratio by currency
   - Coverage vs. policy targets
   - Hedge tenor analysis

7. Risk Priorities
   - Highest risk currencies
   - Largest unhedged exposures
   - Most volatile exposures

Output comprehensive FX risk assessment.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developHedgingStrategyTask = defineTask('develop-hedging-strategy', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'fx-risk-management' },
  agent: {
    name: 'fx-strategist',
    prompt: {
      system: 'You are an FX hedging strategist developing currency risk management strategies.',
      user: `Develop FX hedging strategy.

Risk assessment: ${JSON.stringify(args.riskAssessment)}
Hedging policy: ${JSON.stringify(args.hedgingPolicy)}
Existing hedges: ${JSON.stringify(args.existingHedges)}

Develop strategy:
1. Hedging Objectives
   - Risk reduction targets
   - Hedge ratio targets by currency
   - Time horizon considerations
   - Budget rate protection

2. Instrument Selection
   - Forward contracts
   - FX options (puts, calls, collars)
   - Cross-currency swaps
   - Natural hedges
   - Instrument pros/cons for each exposure

3. Layered Hedging Approach
   - 0-3 month hedge ratios
   - 3-6 month hedge ratios
   - 6-12 month hedge ratios
   - Beyond 12 months

4. Hedge Tenor Optimization
   - Maturity matching
   - Rolling hedge program
   - Tenor diversification

5. Cost-Benefit Analysis
   - Hedging costs (forward points, premiums)
   - Risk reduction achieved
   - Cost optimization strategies

6. Execution Timing
   - Market timing considerations
   - Rate level triggers
   - Systematic vs. opportunistic

7. Policy Compliance
   - Alignment with hedging policy
   - Exceptions requiring approval
   - Reporting requirements

Output detailed hedging strategy recommendations.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const planHedgeExecutionTask = defineTask('plan-hedge-execution', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'fx-trading' },
  agent: {
    name: 'fx-trader',
    prompt: {
      system: 'You are an FX trading professional planning hedge execution.',
      user: `Plan hedge execution.

Hedging strategy: ${JSON.stringify(args.hedgingStrategy)}
Hedging policy: ${JSON.stringify(args.hedgingPolicy)}

Plan execution:
1. Transaction Details
   For each proposed hedge:
   - Instrument type
   - Notional amount
   - Currency pair
   - Tenor/maturity date
   - Direction (buy/sell)

2. Execution Method
   - Counterparty selection
   - Competitive quotes vs. direct
   - Electronic platform vs. voice
   - Order type (market, limit)

3. Pricing Considerations
   - Current market rates
   - Forward points
   - Option premiums
   - Bid-offer spreads

4. Execution Timeline
   - Urgency assessment
   - Market timing
   - Execution windows
   - Approval workflow

5. Counterparty Management
   - Credit line availability
   - ISDA documentation
   - Collateral requirements
   - Settlement instructions

6. Pre-Trade Compliance
   - Policy compliance check
   - Authority verification
   - Limit checks

7. Documentation Requirements
   - Trade confirmations
   - Hedge designation memo
   - Approval documentation

Output execution plan ready for approval.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const documentHedgeAccountingTask = defineTask('document-hedge-accounting', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'hedge-accounting' },
  agent: {
    name: 'hedge-accountant',
    prompt: {
      system: 'You are a hedge accounting specialist documenting hedging relationships under ASC 815.',
      user: `Document hedge accounting for FX hedges.

Hedge transactions: ${JSON.stringify(args.hedgeTransactions)}
Exposures: ${JSON.stringify(args.exposures)}

Prepare documentation:
1. Hedge Designation
   - Hedging relationship type (cash flow, fair value, net investment)
   - Hedged item description
   - Hedging instrument description
   - Risk being hedged

2. Risk Management Objective
   - Risk management strategy
   - Why hedging is appropriate
   - Expected effectiveness

3. Hedge Documentation
   For each hedging relationship:
   - Designation date
   - Hedged item details
   - Hedging instrument details
   - Hedge ratio
   - Effectiveness assessment method

4. Prospective Effectiveness
   - Method for assessing
   - Quantitative analysis
   - Critical terms match assessment

5. Measurement Approach
   - How hedge ineffectiveness will be measured
   - Hypothetical derivative method
   - Excluded components treatment

6. Cash Flow Hedge Documentation
   - Forecasted transaction details
   - Probability assessment
   - Expected timing

7. Documentation Maintenance
   - Ongoing documentation requirements
   - Changes in hedging relationship
   - De-designation procedures

Output complete hedge accounting documentation.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const testHedgeEffectivenessTask = defineTask('test-hedge-effectiveness', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'hedge-accounting' },
  agent: {
    name: 'hedge-accountant',
    prompt: {
      system: 'You are a hedge accounting specialist testing hedge effectiveness.',
      user: `Test hedge effectiveness for ${args.reportingPeriod}.

Existing hedges: ${JSON.stringify(args.existingHedges)}
Hedge documentation: ${JSON.stringify(args.hedgeDocumentation)}

Test effectiveness:
1. Retrospective Testing
   For each hedging relationship:
   - Calculate hedge ratio
   - Calculate cumulative gains/losses on hedge
   - Calculate cumulative changes in hedged item
   - Determine if highly effective (80-125%)

2. Dollar Offset Method
   - Change in fair value of hedging instrument
   - Change in fair value of hedged item
   - Ratio calculation
   - Pass/fail determination

3. Regression Analysis
   - Statistical correlation
   - R-squared
   - Slope coefficient
   - Significance testing

4. Hypothetical Derivative Method
   - Build hypothetical derivative
   - Compare actual vs. hypothetical
   - Calculate ineffectiveness

5. Ineffectiveness Calculation
   - Ineffective portion determination
   - P&L impact
   - Journal entry

6. Prospective Assessment
   - Expected future effectiveness
   - Critical terms review
   - Any changes affecting hedge

7. Documentation
   - Effectiveness test workpapers
   - Conclusions
   - Any failed hedges
   - Required disclosures

Output effectiveness test results and conclusions.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareFXReportingTask = defineTask('prepare-fx-reporting', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'treasury-reporting' },
  agent: {
    name: 'treasury-reporter',
    prompt: {
      system: 'You are a treasury analyst preparing FX risk management reports.',
      user: `Prepare FX reporting for ${args.reportingPeriod}.

Exposures: ${JSON.stringify(args.exposures)}
Hedges: ${JSON.stringify(args.hedges)}
Effectiveness results: ${JSON.stringify(args.effectiveness)}

Prepare reports:
1. Executive Summary
   - Key FX metrics
   - Hedge coverage summary
   - P&L impact summary
   - Key risks and actions

2. Exposure Report
   - Gross exposures by currency
   - Net exposures after hedges
   - Exposure trends
   - Policy compliance

3. Hedge Portfolio Report
   - Outstanding hedges
   - Hedge coverage ratios
   - Mark-to-market values
   - Maturity profile

4. P&L Analysis
   - FX gains/losses realized
   - Unrealized gains/losses
   - Hedge effectiveness gains/losses
   - OCI movements

5. Risk Metrics
   - VaR summary
   - Sensitivity analysis
   - Stress test results

6. Performance Attribution
   - Natural hedge benefit
   - Hedge program impact
   - Rate movements impact

7. Forward Looking
   - Projected exposures
   - Planned hedge activity
   - Market outlook
   - Recommendations

8. Disclosures
   - ASC 815 disclosures
   - Quantitative disclosures
   - Qualitative disclosures

Format for management and board reporting.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
