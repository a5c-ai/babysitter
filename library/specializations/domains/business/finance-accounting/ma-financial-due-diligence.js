/**
 * @file ma-financial-due-diligence.js
 * @description Comprehensive financial analysis of acquisition targets including quality of earnings, working capital analysis, and deal structuring
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * M&A Financial Due Diligence Process
 * @param {Object} inputs - Process inputs
 * @param {Object} inputs.targetCompany - Target company information
 * @param {Object} inputs.targetFinancials - Target's financial statements
 * @param {Object} inputs.dealTerms - Proposed deal terms
 * @param {Object} inputs.managementData - Management-provided data and projections
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Due diligence findings and recommendations
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Due Diligence Planning
  const planningResult = await ctx.task(planDueDiligenceTask, {
    targetCompany: inputs.targetCompany,
    dealTerms: inputs.dealTerms
  });
  results.steps.push({ name: 'dd-planning', result: planningResult });

  // Step 2: Quality of Earnings Analysis
  const qoeResult = await ctx.task(analyzeQualityOfEarningsTask, {
    targetFinancials: inputs.targetFinancials,
    managementData: inputs.managementData
  });
  results.steps.push({ name: 'quality-of-earnings', result: qoeResult });

  // Breakpoint for QoE review
  await ctx.breakpoint('qoe-review', {
    message: 'Review quality of earnings findings before continuing with detailed analysis',
    data: qoeResult
  });

  // Step 3: Working Capital Analysis
  const workingCapitalResult = await ctx.task(analyzeWorkingCapitalTask, {
    targetFinancials: inputs.targetFinancials,
    managementData: inputs.managementData
  });
  results.steps.push({ name: 'working-capital', result: workingCapitalResult });

  // Step 4: Net Debt Analysis
  const netDebtResult = await ctx.task(analyzeNetDebtTask, {
    targetFinancials: inputs.targetFinancials,
    dealTerms: inputs.dealTerms
  });
  results.steps.push({ name: 'net-debt', result: netDebtResult });

  // Step 5: Revenue and Customer Analysis
  const revenueResult = await ctx.task(analyzeRevenueAndCustomersTask, {
    targetFinancials: inputs.targetFinancials,
    managementData: inputs.managementData
  });
  results.steps.push({ name: 'revenue-analysis', result: revenueResult });

  // Step 6: Cost Structure Analysis
  const costResult = await ctx.task(analyzeCostStructureTask, {
    targetFinancials: inputs.targetFinancials,
    managementData: inputs.managementData
  });
  results.steps.push({ name: 'cost-analysis', result: costResult });

  // Breakpoint for comprehensive review
  await ctx.breakpoint('comprehensive-review', {
    message: 'Review all financial due diligence findings before deal structuring',
    data: {
      qoe: qoeResult,
      workingCapital: workingCapitalResult,
      netDebt: netDebtResult,
      revenue: revenueResult,
      cost: costResult
    }
  });

  // Step 7: Synergy Assessment
  const synergyResult = await ctx.task(assessSynergiesTask, {
    targetFinancials: inputs.targetFinancials,
    costAnalysis: costResult,
    dealTerms: inputs.dealTerms
  });
  results.steps.push({ name: 'synergy-assessment', result: synergyResult });

  // Step 8: Deal Structuring Recommendations
  const structuringResult = await ctx.task(recommendDealStructureTask, {
    qoeFindings: qoeResult,
    workingCapital: workingCapitalResult,
    netDebt: netDebtResult,
    synergies: synergyResult,
    dealTerms: inputs.dealTerms
  });
  results.steps.push({ name: 'deal-structuring', result: structuringResult });

  // Step 9: Due Diligence Report
  const reportResult = await ctx.task(prepareDDReportTask, {
    allFindings: results.steps,
    targetCompany: inputs.targetCompany,
    dealTerms: inputs.dealTerms
  });
  results.steps.push({ name: 'dd-report', result: reportResult });

  results.outputs = {
    ddReport: reportResult,
    qoeAnalysis: qoeResult,
    workingCapitalTarget: workingCapitalResult,
    dealRecommendations: structuringResult
  };

  return results;
}

// Task definitions
export const planDueDiligenceTask = defineTask('plan-due-diligence', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'ma-advisory' },
  agent: {
    name: 'dd-manager',
    prompt: {
      system: 'You are an M&A due diligence manager planning financial due diligence engagements.',
      user: `Plan financial due diligence engagement.

Target company: ${JSON.stringify(args.targetCompany)}
Deal terms: ${JSON.stringify(args.dealTerms)}

Plan:
1. Scope Definition
   - Key areas of focus
   - Time period covered
   - Materiality thresholds
   - Out-of-scope items

2. Information Requests
   - Financial statements
   - Trial balances
   - General ledger detail
   - Customer data
   - Vendor data
   - Employee data
   - Contracts

3. Key Focus Areas
   Based on deal and target:
   - Highest risk areas
   - Value drivers
   - Deal-specific concerns
   - Industry-specific issues

4. Timeline
   - Phase 1: Initial review
   - Phase 2: Detailed analysis
   - Phase 3: Management discussions
   - Phase 4: Report preparation

5. Team Resources
   - Team composition
   - Specialist needs
   - External advisors

6. Communication Plan
   - Reporting cadence
   - Issue escalation
   - Management access

Output due diligence plan.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeQualityOfEarningsTask = defineTask('analyze-quality-of-earnings', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-due-diligence' },
  agent: {
    name: 'qoe-analyst',
    prompt: {
      system: 'You are a financial due diligence analyst performing quality of earnings analysis.',
      user: `Perform quality of earnings analysis.

Target financials: ${JSON.stringify(args.targetFinancials)}
Management data: ${JSON.stringify(args.managementData)}

Analyze:
1. Revenue Quality
   - Revenue recognition policies
   - Recurring vs. non-recurring
   - Customer concentration
   - Contract analysis
   - Revenue adjustments

2. EBITDA Adjustments
   - Non-recurring expenses
   - Run-rate adjustments
   - Owner-related expenses
   - Related party transactions
   - Pro forma adjustments

3. Cost Normalization
   - One-time costs
   - Below/above market contracts
   - Under/over investment
   - Restructuring costs

4. Earnings Quality
   - Sustainable earnings base
   - Adjusted EBITDA
   - Normalized net income
   - Cash flow conversion

5. Accounting Analysis
   - Critical accounting policies
   - Aggressive vs. conservative
   - Estimates and judgments
   - Audit findings

6. Trend Analysis
   - Monthly/quarterly trends
   - Seasonality
   - Margin trends
   - Growth sustainability

7. Summary of Adjustments
   - Reported EBITDA
   - Each adjustment (+/-)
   - Adjusted EBITDA
   - Management vs. DD view

Output quality of earnings analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeWorkingCapitalTask = defineTask('analyze-working-capital', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-due-diligence' },
  agent: {
    name: 'working-capital-analyst',
    prompt: {
      system: 'You are a financial analyst analyzing working capital for M&A transactions.',
      user: `Analyze working capital.

Target financials: ${JSON.stringify(args.targetFinancials)}
Management data: ${JSON.stringify(args.managementData)}

Analyze:
1. Working Capital Components
   - Accounts receivable
   - Inventory
   - Prepaid expenses
   - Accounts payable
   - Accrued expenses
   - Deferred revenue

2. Historical Trends
   - Monthly working capital
   - Seasonal patterns
   - Growth impact
   - 12-month average

3. Normalization Adjustments
   - Non-operating items
   - One-time items
   - Related party items
   - Cash vs. non-cash

4. Working Capital Target
   - Methodology selection
   - Calculation of target
   - Seasonal adjustment
   - Growth adjustment

5. Peg Definition
   - Items included/excluded
   - Measurement date
   - Adjustment mechanisms

6. Closing Mechanics
   - Estimated closing WC
   - Target comparison
   - Adjustment calculation
   - True-up process

7. Risk Areas
   - Collectability of receivables
   - Inventory valuation
   - Accrual adequacy
   - Deferred revenue risks

Output working capital analysis and target.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeNetDebtTask = defineTask('analyze-net-debt', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-due-diligence' },
  agent: {
    name: 'debt-analyst',
    prompt: {
      system: 'You are a financial analyst analyzing net debt for M&A transactions.',
      user: `Analyze net debt position.

Target financials: ${JSON.stringify(args.targetFinancials)}
Deal terms: ${JSON.stringify(args.dealTerms)}

Analyze:
1. Debt Components
   - Short-term debt
   - Long-term debt
   - Capital leases
   - Related party debt
   - Other borrowings

2. Debt-Like Items
   - Unfunded pension obligations
   - Deferred compensation
   - Litigation reserves
   - Environmental liabilities
   - Tax obligations
   - Restructuring liabilities

3. Cash Components
   - Cash and equivalents
   - Restricted cash
   - Trapped cash
   - Excess cash analysis

4. Net Debt Calculation
   - Total debt
   - Plus debt-like items
   - Less cash
   - Net debt position

5. Change of Control Analysis
   - Debt acceleration provisions
   - Prepayment penalties
   - Transaction bonuses
   - Severance obligations

6. Pro Forma Adjustments
   - Transaction fees
   - Deal-related costs
   - Refinancing impact

7. Closing Mechanics
   - Net debt definition
   - Measurement timing
   - Adjustment mechanism

Output net debt analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeRevenueAndCustomersTask = defineTask('analyze-revenue-customers', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'commercial-due-diligence' },
  agent: {
    name: 'revenue-analyst',
    prompt: {
      system: 'You are an analyst performing revenue and customer due diligence.',
      user: `Analyze revenue and customer base.

Target financials: ${JSON.stringify(args.targetFinancials)}
Management data: ${JSON.stringify(args.managementData)}

Analyze:
1. Revenue Breakdown
   - By product/service
   - By customer segment
   - By geography
   - By contract type

2. Customer Analysis
   - Top customer concentration
   - Customer tenure
   - Customer churn/retention
   - Customer acquisition cost

3. Contract Analysis
   - Contract terms
   - Renewal rates
   - Price escalation
   - Change of control provisions

4. Revenue Quality
   - Recurring vs. non-recurring
   - Contracted vs. at-will
   - Backlog analysis
   - Pipeline analysis

5. Pricing Analysis
   - Pricing trends
   - Competitive positioning
   - Discounting practices
   - Price realization

6. Growth Drivers
   - New customer acquisition
   - Existing customer expansion
   - Price increases
   - New products

7. Risks
   - Customer concentration risk
   - Contract renewal risk
   - Competitive threats
   - Market trends

Output revenue and customer analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeCostStructureTask = defineTask('analyze-cost-structure', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-due-diligence' },
  agent: {
    name: 'cost-analyst',
    prompt: {
      system: 'You are a financial analyst analyzing cost structure for M&A transactions.',
      user: `Analyze cost structure.

Target financials: ${JSON.stringify(args.targetFinancials)}
Management data: ${JSON.stringify(args.managementData)}

Analyze:
1. Cost Categories
   - Cost of goods sold
   - Personnel costs
   - Facilities costs
   - Technology costs
   - Marketing costs
   - Administrative costs

2. Fixed vs. Variable
   - Fixed cost base
   - Variable cost ratios
   - Operating leverage
   - Break-even analysis

3. Vendor Analysis
   - Key supplier relationships
   - Contract terms
   - Concentration risk
   - Price trends

4. Personnel Analysis
   - Headcount by function
   - Compensation levels
   - Benefit costs
   - Turnover rates

5. Cost Trends
   - Historical cost trends
   - Margin progression
   - Cost savings initiatives
   - Investment areas

6. Benchmarking
   - Cost ratios vs. industry
   - Efficiency metrics
   - Productivity measures

7. Run-Rate Costs
   - Current run-rate
   - Required investments
   - Stranded costs
   - Dis-synergies

Output cost structure analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const assessSynergiesTask = defineTask('assess-synergies', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'ma-advisory' },
  agent: {
    name: 'synergy-analyst',
    prompt: {
      system: 'You are an M&A analyst assessing deal synergies.',
      user: `Assess deal synergies.

Target financials: ${JSON.stringify(args.targetFinancials)}
Cost analysis: ${JSON.stringify(args.costAnalysis)}
Deal terms: ${JSON.stringify(args.dealTerms)}

Assess:
1. Cost Synergies
   - Headcount reductions
   - Facility consolidation
   - Procurement savings
   - Technology consolidation
   - Administrative savings
   - Public company cost savings

2. Revenue Synergies
   - Cross-selling opportunities
   - Geographic expansion
   - Product bundling
   - Pricing power

3. Synergy Quantification
   For each synergy:
   - Run-rate amount
   - One-time cost to achieve
   - Timeline to achieve
   - Risk/probability

4. Implementation Planning
   - Quick wins (Year 1)
   - Medium-term (Year 2)
   - Long-term (Year 3+)
   - Integration requirements

5. Dis-Synergies
   - Customer attrition risk
   - Key employee departures
   - Cultural integration
   - System integration costs

6. Net Synergy Value
   - Gross synergies
   - Less: Costs to achieve
   - Less: Dis-synergies
   - Net present value

7. Risk Assessment
   - Achievability assessment
   - Sensitivity analysis
   - Conservative vs. optimistic

Output synergy assessment.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const recommendDealStructureTask = defineTask('recommend-deal-structure', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'ma-advisory' },
  agent: {
    name: 'deal-advisor',
    prompt: {
      system: 'You are an M&A advisor recommending deal structure based on due diligence findings.',
      user: `Recommend deal structure.

QoE findings: ${JSON.stringify(args.qoeFindings)}
Working capital: ${JSON.stringify(args.workingCapital)}
Net debt: ${JSON.stringify(args.netDebt)}
Synergies: ${JSON.stringify(args.synergies)}
Deal terms: ${JSON.stringify(args.dealTerms)}

Recommend:
1. Purchase Price Adjustments
   - EBITDA adjustments impact
   - Implied price adjustment
   - Multiple reconsideration

2. Working Capital Mechanism
   - Working capital target
   - Collar/threshold
   - True-up timing
   - Dispute resolution

3. Net Debt Definition
   - Items included
   - Items excluded
   - Measurement date
   - Estimation process

4. Earnout Considerations
   - Bridge valuation gaps
   - Metric selection
   - Term and structure
   - Risk allocation

5. Indemnification
   - Key risk areas
   - Basket and cap
   - Escrow recommendation
   - Survival periods

6. Closing Conditions
   - Key conditions
   - Regulatory requirements
   - Third-party consents

7. Other Deal Terms
   - Representations and warranties
   - Non-compete provisions
   - Transition services
   - Key employee retention

Output deal structure recommendations.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareDDReportTask = defineTask('prepare-dd-report', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'ma-advisory' },
  agent: {
    name: 'dd-manager',
    prompt: {
      system: 'You are a due diligence manager preparing comprehensive DD reports.',
      user: `Prepare due diligence report.

All findings: ${JSON.stringify(args.allFindings)}
Target company: ${JSON.stringify(args.targetCompany)}
Deal terms: ${JSON.stringify(args.dealTerms)}

Prepare report:
1. Executive Summary
   - Key findings
   - Deal impact
   - Recommendations
   - Risk areas

2. Quality of Earnings
   - Summary of adjustments
   - Adjusted EBITDA
   - Key concerns

3. Working Capital
   - Analysis summary
   - Target recommendation
   - Risk areas

4. Net Debt
   - Analysis summary
   - Definition recommendations
   - Debt-like items

5. Revenue and Commercial
   - Revenue quality
   - Customer analysis
   - Growth outlook

6. Cost Structure
   - Cost analysis
   - Synergy opportunities
   - Integration considerations

7. Deal Structuring
   - Price implications
   - Mechanism recommendations
   - Protection suggestions

8. Red Flags and Risks
   - Key risk areas
   - Mitigation recommendations
   - Deal breaker issues (if any)

9. Appendices
   - Detailed schedules
   - Supporting analysis
   - Management discussion notes

Output comprehensive DD report.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
