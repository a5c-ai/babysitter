/**
 * @file capital-investment-appraisal.js
 * @description Evaluating capital expenditure proposals using NPV, IRR, payback period, and strategic alignment criteria
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Capital Investment Appraisal Process
 * @param {Object} inputs - Process inputs
 * @param {Object} inputs.investmentProposal - Details of the proposed investment
 * @param {Object} inputs.projectCashFlows - Projected cash flows for the investment
 * @param {Object} inputs.corporateHurdleRates - Company hurdle rates and thresholds
 * @param {Object} inputs.strategicPriorities - Corporate strategic priorities
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Investment appraisal results and recommendation
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Investment Definition and Scoping
  const scopingResult = await ctx.task(defineInvestmentScopeTask, {
    investmentProposal: inputs.investmentProposal,
    strategicPriorities: inputs.strategicPriorities
  });
  results.steps.push({ name: 'investment-scoping', result: scopingResult });

  // Step 2: Cash Flow Analysis
  const cashFlowResult = await ctx.task(analyzeCashFlowsTask, {
    projectCashFlows: inputs.projectCashFlows,
    investmentProposal: inputs.investmentProposal
  });
  results.steps.push({ name: 'cash-flow-analysis', result: cashFlowResult });

  // Step 3: Financial Metrics Calculation
  const metricsResult = await ctx.task(calculateFinancialMetricsTask, {
    cashFlows: cashFlowResult,
    hurdleRates: inputs.corporateHurdleRates
  });
  results.steps.push({ name: 'financial-metrics', result: metricsResult });

  // Breakpoint for metrics review
  await ctx.breakpoint('metrics-review', {
    message: 'Review financial metrics before risk and strategic analysis',
    data: metricsResult
  });

  // Step 4: Risk Analysis
  const riskResult = await ctx.task(analyzeInvestmentRiskTask, {
    cashFlows: cashFlowResult,
    metrics: metricsResult,
    investmentProposal: inputs.investmentProposal
  });
  results.steps.push({ name: 'risk-analysis', result: riskResult });

  // Step 5: Strategic Alignment Assessment
  const strategicResult = await ctx.task(assessStrategicAlignmentTask, {
    investmentProposal: inputs.investmentProposal,
    strategicPriorities: inputs.strategicPriorities,
    metrics: metricsResult
  });
  results.steps.push({ name: 'strategic-assessment', result: strategicResult });

  // Step 6: Comparative Analysis
  const comparativeResult = await ctx.task(performComparativeAnalysisTask, {
    currentProposal: {
      metrics: metricsResult,
      risk: riskResult,
      strategic: strategicResult
    },
    hurdleRates: inputs.corporateHurdleRates
  });
  results.steps.push({ name: 'comparative-analysis', result: comparativeResult });

  // Breakpoint for comprehensive review
  await ctx.breakpoint('comprehensive-review', {
    message: 'Review complete investment analysis before final recommendation',
    data: {
      metrics: metricsResult,
      risk: riskResult,
      strategic: strategicResult,
      comparative: comparativeResult
    }
  });

  // Step 7: Investment Recommendation
  const recommendationResult = await ctx.task(prepareInvestmentRecommendationTask, {
    allAnalysis: {
      scoping: scopingResult,
      cashFlows: cashFlowResult,
      metrics: metricsResult,
      risk: riskResult,
      strategic: strategicResult,
      comparative: comparativeResult
    },
    hurdleRates: inputs.corporateHurdleRates
  });
  results.steps.push({ name: 'recommendation', result: recommendationResult });

  results.outputs = {
    financialMetrics: metricsResult,
    riskAssessment: riskResult,
    recommendation: recommendationResult,
    investmentProposal: inputs.investmentProposal
  };

  return results;
}

// Task definitions
export const defineInvestmentScopeTask = defineTask('define-investment-scope', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'capital-planning' },
  agent: {
    name: 'investment-analyst',
    prompt: {
      system: 'You are a capital planning analyst defining investment scope and requirements.',
      user: `Define investment scope and requirements.

Investment proposal: ${JSON.stringify(args.investmentProposal)}
Strategic priorities: ${JSON.stringify(args.strategicPriorities)}

Define:
1. Investment Overview
   - Project description
   - Business case summary
   - Sponsoring department
   - Project champion

2. Investment Type
   - Growth/expansion
   - Maintenance/replacement
   - Regulatory/compliance
   - Cost reduction
   - Strategic/R&D

3. Capital Requirements
   - Initial investment amount
   - Investment timing
   - Working capital needs
   - Contingency allowance

4. Project Timeline
   - Construction/implementation period
   - Operational start date
   - Economic life
   - Terminal value considerations

5. Key Assumptions
   - Revenue assumptions
   - Cost assumptions
   - Volume assumptions
   - Pricing assumptions

6. Dependencies
   - Other projects required
   - Infrastructure needs
   - Resource requirements
   - Regulatory approvals

7. Success Criteria
   - Financial targets
   - Operational targets
   - Strategic objectives

Output investment scope definition.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeCashFlowsTask = defineTask('analyze-cash-flows', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-analysis' },
  agent: {
    name: 'cash-flow-analyst',
    prompt: {
      system: 'You are a financial analyst analyzing investment cash flows.',
      user: `Analyze project cash flows.

Project cash flows: ${JSON.stringify(args.projectCashFlows)}
Investment proposal: ${JSON.stringify(args.investmentProposal)}

Analyze:
1. Initial Investment
   - Capital expenditure
   - Installation/setup costs
   - Working capital investment
   - Opportunity costs
   - Total initial outflow

2. Operating Cash Flows
   For each year:
   - Revenue/savings generated
   - Operating costs
   - Incremental overhead
   - EBITDA
   - Depreciation/amortization
   - Taxes
   - After-tax operating cash flow

3. Terminal Cash Flows
   - Salvage/residual value
   - Working capital recovery
   - Site restoration costs
   - Terminal value

4. Incremental Analysis
   - Incremental revenues
   - Incremental costs
   - Cannibalization effects
   - Synergies

5. Tax Analysis
   - Depreciation schedules
   - Tax shields
   - Tax credits/incentives
   - Effective tax rate

6. Cash Flow Summary
   - Year-by-year cash flows
   - Cumulative cash flows
   - Free cash flow profile

7. Assumptions Validation
   - Reasonableness check
   - Comparison to similar projects
   - Key assumptions sensitivity

Output detailed cash flow analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const calculateFinancialMetricsTask = defineTask('calculate-financial-metrics', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'capital-budgeting' },
  agent: {
    name: 'metrics-analyst',
    prompt: {
      system: 'You are a financial analyst calculating capital budgeting metrics.',
      user: `Calculate investment appraisal metrics.

Cash flows: ${JSON.stringify(args.cashFlows)}
Hurdle rates: ${JSON.stringify(args.hurdleRates)}

Calculate:
1. Net Present Value (NPV)
   - Discount rate used
   - Present value of each cash flow
   - Total NPV
   - NPV interpretation

2. Internal Rate of Return (IRR)
   - IRR calculation
   - Comparison to hurdle rate
   - IRR interpretation
   - Multiple IRR check

3. Modified IRR (MIRR)
   - Reinvestment rate assumption
   - MIRR calculation
   - Comparison to IRR

4. Payback Period
   - Simple payback (years)
   - Payback interpretation
   - Comparison to target

5. Discounted Payback
   - Discounted cash flows
   - Discounted payback period
   - Interpretation

6. Profitability Index
   - PV of benefits / PV of costs
   - Interpretation
   - Ranking metric

7. Return on Investment
   - Average accounting return
   - Cash-on-cash return
   - Return metrics

8. Summary Dashboard
   - All metrics summary
   - Pass/fail vs. thresholds
   - Overall financial attractiveness

Output comprehensive financial metrics.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeInvestmentRiskTask = defineTask('analyze-investment-risk', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'risk-analysis' },
  agent: {
    name: 'risk-analyst',
    prompt: {
      system: 'You are a risk analyst evaluating investment risk.',
      user: `Analyze investment risk.

Cash flows: ${JSON.stringify(args.cashFlows)}
Metrics: ${JSON.stringify(args.metrics)}
Investment proposal: ${JSON.stringify(args.investmentProposal)}

Analyze:
1. Sensitivity Analysis
   Key variables:
   - Revenue/volume sensitivity
   - Pricing sensitivity
   - Cost sensitivity
   - Discount rate sensitivity
   - Capital cost sensitivity
   Impact on NPV and IRR

2. Scenario Analysis
   - Base case
   - Best case (+20% improvement)
   - Worst case (-20% deterioration)
   - NPV/IRR for each scenario

3. Breakeven Analysis
   - Breakeven revenue
   - Breakeven volume
   - Breakeven price
   - Breakeven cost

4. Monte Carlo Results (if available)
   - NPV distribution
   - Probability of positive NPV
   - Expected NPV
   - Value at risk

5. Risk Identification
   - Market/demand risk
   - Technology risk
   - Execution risk
   - Regulatory risk
   - Competitive risk
   - Input cost risk

6. Risk Mitigation
   - Mitigation strategies
   - Contingency plans
   - Stage-gating options
   - Exit strategies

7. Risk-Adjusted Return
   - Risk premium consideration
   - Risk-adjusted NPV
   - Real options value

Output risk analysis and assessment.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const assessStrategicAlignmentTask = defineTask('assess-strategic-alignment', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'strategic-planning' },
  agent: {
    name: 'strategy-analyst',
    prompt: {
      system: 'You are a strategic planning analyst assessing investment alignment with corporate strategy.',
      user: `Assess strategic alignment.

Investment proposal: ${JSON.stringify(args.investmentProposal)}
Strategic priorities: ${JSON.stringify(args.strategicPriorities)}
Metrics: ${JSON.stringify(args.metrics)}

Assess:
1. Strategic Fit
   - Alignment with corporate strategy
   - Support for strategic initiatives
   - Core vs. non-core business
   - Strategic importance score

2. Competitive Position
   - Impact on market position
   - Competitive advantage gained
   - Barriers to competition
   - Differentiation benefits

3. Growth Contribution
   - Revenue growth impact
   - Market share impact
   - New market access
   - Product line expansion

4. Capability Building
   - New capabilities acquired
   - Knowledge/skills gained
   - Technology advancement
   - Organizational development

5. Synergies
   - Synergies with existing operations
   - Cross-selling opportunities
   - Shared resources
   - Platform opportunities

6. Option Value
   - Future investment options
   - Strategic flexibility
   - Learning opportunities
   - Real options perspective

7. Strategic Scoring
   - Scoring against strategic criteria
   - Weighted strategic score
   - Strategic priority ranking

Output strategic alignment assessment.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const performComparativeAnalysisTask = defineTask('comparative-analysis', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'capital-planning' },
  agent: {
    name: 'portfolio-analyst',
    prompt: {
      system: 'You are a capital planning analyst comparing investment alternatives.',
      user: `Perform comparative analysis.

Current proposal: ${JSON.stringify(args.currentProposal)}
Hurdle rates: ${JSON.stringify(args.hurdleRates)}

Compare:
1. Hurdle Rate Comparison
   - NPV vs. hurdle rate
   - IRR vs. hurdle rate
   - Payback vs. target
   - Pass/fail assessment

2. Alternative Analysis
   - Status quo option
   - Alternative approaches
   - Timing alternatives
   - Scale alternatives

3. Opportunity Cost
   - Capital constraints
   - Competing projects
   - Opportunity cost of capital
   - Resource allocation impact

4. Make vs. Buy Analysis
   - Internal development
   - External acquisition
   - Partnership options
   - Lease vs. buy

5. Benchmark Comparison
   - Similar historical projects
   - Industry benchmarks
   - Expected vs. actual performance

6. Portfolio Fit
   - Risk diversification
   - Cash flow timing
   - Resource requirements
   - Strategic portfolio balance

7. Ranking
   - Financial ranking
   - Strategic ranking
   - Risk-adjusted ranking
   - Overall priority

Output comparative analysis results.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareInvestmentRecommendationTask = defineTask('prepare-investment-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'capital-planning' },
  agent: {
    name: 'investment-advisor',
    prompt: {
      system: 'You are a capital planning advisor preparing investment recommendations.',
      user: `Prepare investment recommendation.

All analysis: ${JSON.stringify(args.allAnalysis)}
Hurdle rates: ${JSON.stringify(args.hurdleRates)}

Prepare:
1. Executive Summary
   - Investment overview
   - Key metrics summary
   - Recommendation

2. Financial Summary
   - NPV and IRR
   - Payback period
   - Comparison to thresholds
   - Financial attractiveness rating

3. Risk Assessment Summary
   - Key risks identified
   - Risk mitigation plan
   - Sensitivity results
   - Risk-adjusted view

4. Strategic Value
   - Strategic alignment score
   - Qualitative benefits
   - Option value
   - Strategic importance

5. Recommendation
   - Approve / Reject / Defer
   - Confidence level
   - Key conditions
   - Monitoring requirements

6. Implementation Guidance
   - Phasing recommendation
   - Key milestones
   - Success metrics
   - Review points

7. Approval Package
   - Summary for approval
   - Supporting documentation
   - Approval authority required
   - Budget allocation

Output investment recommendation package.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
