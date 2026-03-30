/**
 * @file industry-competitive-analysis.js
 * @description Analyzing industry dynamics, competitive positioning, market trends, and their implications for financial planning and strategy
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Industry and Competitive Analysis Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.industry - Industry being analyzed
 * @param {Object} inputs.companyProfile - Company profile and positioning
 * @param {Array} inputs.competitors - Key competitors to analyze
 * @param {Object} inputs.marketData - Market data and trends
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Industry and competitive analysis
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Industry Structure Analysis
  const structureResult = await ctx.task(analyzeIndustryStructureTask, {
    industry: inputs.industry,
    marketData: inputs.marketData
  });
  results.steps.push({ name: 'industry-structure', result: structureResult });

  // Step 2: Market Size and Growth Analysis
  const marketResult = await ctx.task(analyzeMarketSizeGrowthTask, {
    industry: inputs.industry,
    marketData: inputs.marketData
  });
  results.steps.push({ name: 'market-analysis', result: marketResult });

  // Step 3: Porter's Five Forces Analysis
  const fivesForcesResult = await ctx.task(analyzePortersFiveForcesTask, {
    industry: inputs.industry,
    structureAnalysis: structureResult
  });
  results.steps.push({ name: 'five-forces', result: fivesForcesResult });

  // Breakpoint for industry review
  await ctx.breakpoint('industry-review', {
    message: 'Review industry analysis before competitive assessment',
    data: { structure: structureResult, market: marketResult, forces: fivesForcesResult }
  });

  // Step 4: Competitor Analysis
  const competitorResult = await ctx.task(analyzeCompetitorsTask, {
    competitors: inputs.competitors,
    companyProfile: inputs.companyProfile,
    industry: inputs.industry
  });
  results.steps.push({ name: 'competitor-analysis', result: competitorResult });

  // Step 5: Competitive Positioning
  const positioningResult = await ctx.task(assessCompetitivePositioningTask, {
    companyProfile: inputs.companyProfile,
    competitorAnalysis: competitorResult,
    industryStructure: structureResult
  });
  results.steps.push({ name: 'competitive-positioning', result: positioningResult });

  // Step 6: Industry Trends and Disruption
  const trendsResult = await ctx.task(analyzeIndustryTrendsTask, {
    industry: inputs.industry,
    marketData: inputs.marketData
  });
  results.steps.push({ name: 'industry-trends', result: trendsResult });

  // Breakpoint for comprehensive review
  await ctx.breakpoint('comprehensive-review', {
    message: 'Review complete competitive analysis before strategic implications',
    data: { competitors: competitorResult, positioning: positioningResult, trends: trendsResult }
  });

  // Step 7: Strategic Implications
  const strategicResult = await ctx.task(developStrategicImplicationsTask, {
    industryAnalysis: {
      structure: structureResult,
      market: marketResult,
      forces: fivesForcesResult,
      trends: trendsResult
    },
    competitiveAnalysis: {
      competitors: competitorResult,
      positioning: positioningResult
    },
    companyProfile: inputs.companyProfile
  });
  results.steps.push({ name: 'strategic-implications', result: strategicResult });

  // Step 8: Financial Planning Implications
  const financialResult = await ctx.task(assessFinancialPlanningImplicationsTask, {
    industryAnalysis: results.steps,
    companyProfile: inputs.companyProfile
  });
  results.steps.push({ name: 'financial-implications', result: financialResult });

  results.outputs = {
    industryAnalysis: {
      structure: structureResult,
      market: marketResult,
      fiveForces: fivesForcesResult,
      trends: trendsResult
    },
    competitiveAnalysis: {
      competitors: competitorResult,
      positioning: positioningResult
    },
    strategicImplications: strategicResult,
    financialImplications: financialResult
  };

  return results;
}

// Task definitions
export const analyzeIndustryStructureTask = defineTask('analyze-industry-structure', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'industry-analysis' },
  agent: {
    name: 'industry-analyst',
    prompt: {
      system: 'You are an industry analyst examining industry structure and dynamics.',
      user: `Analyze industry structure for ${args.industry}.

Market data: ${JSON.stringify(args.marketData)}

Analyze:
1. Industry Definition
   - Industry boundaries
   - Sub-segments
   - Adjacent industries
   - Value chain position

2. Market Participants
   - Major players
   - Market shares
   - Concentration ratios
   - New entrants

3. Business Models
   - Predominant models
   - Emerging models
   - Monetization strategies
   - Value proposition types

4. Industry Life Cycle
   - Current stage
   - Growth trajectory
   - Maturity indicators
   - Consolidation status

5. Value Chain Structure
   - Key activities
   - Value distribution
   - Vertical integration
   - Outsourcing trends

6. Regulatory Environment
   - Key regulations
   - Regulatory trends
   - Compliance requirements
   - Political factors

Output industry structure analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeMarketSizeGrowthTask = defineTask('analyze-market-size-growth', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'market-analysis' },
  agent: {
    name: 'market-analyst',
    prompt: {
      system: 'You are a market analyst assessing market size and growth.',
      user: `Analyze market size and growth for ${args.industry}.

Market data: ${JSON.stringify(args.marketData)}

Analyze:
1. Total Addressable Market
   - Global TAM
   - Regional breakdown
   - Segment breakdown
   - Calculation methodology

2. Serviceable Markets
   - SAM (Serviceable Addressable)
   - SOM (Serviceable Obtainable)
   - Geographic focus
   - Segment focus

3. Historical Growth
   - Revenue growth rates
   - Volume growth rates
   - Price trends
   - Growth drivers

4. Growth Projections
   - Short-term forecast (1-2 years)
   - Medium-term forecast (3-5 years)
   - Long-term outlook (5+ years)
   - Forecast methodology

5. Growth Drivers
   - Demand drivers
   - Technology enablers
   - Regulatory catalysts
   - Economic factors

6. Market Segments
   - Segment sizes
   - Segment growth rates
   - Attractive segments
   - Emerging segments

Output market size and growth analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzePortersFiveForcesTask = defineTask('analyze-five-forces', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'competitive-strategy' },
  agent: {
    name: 'strategy-analyst',
    prompt: {
      system: 'You are a strategy analyst conducting Porter\'s Five Forces analysis.',
      user: `Conduct Five Forces analysis for ${args.industry}.

Structure analysis: ${JSON.stringify(args.structureAnalysis)}

Analyze each force:
1. Threat of New Entrants
   - Barriers to entry
   - Capital requirements
   - Economies of scale
   - Brand loyalty
   - Access to distribution
   - Regulatory barriers
   Force strength: High/Medium/Low

2. Bargaining Power of Suppliers
   - Supplier concentration
   - Input differentiation
   - Switching costs
   - Forward integration threat
   - Importance to supplier
   Force strength: High/Medium/Low

3. Bargaining Power of Buyers
   - Buyer concentration
   - Purchase volumes
   - Product differentiation
   - Switching costs
   - Backward integration threat
   Force strength: High/Medium/Low

4. Threat of Substitutes
   - Substitute availability
   - Relative price/performance
   - Switching costs
   - Buyer propensity to switch
   Force strength: High/Medium/Low

5. Competitive Rivalry
   - Number of competitors
   - Industry growth rate
   - Fixed costs/value added
   - Product differentiation
   - Exit barriers
   Force strength: High/Medium/Low

6. Overall Assessment
   - Industry attractiveness
   - Profit potential
   - Strategic implications

Output Five Forces analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeCompetitorsTask = defineTask('analyze-competitors', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'competitive-intelligence' },
  agent: {
    name: 'competitive-analyst',
    prompt: {
      system: 'You are a competitive intelligence analyst profiling key competitors.',
      user: `Analyze competitors in ${args.industry}.

Competitors: ${JSON.stringify(args.competitors)}
Company profile: ${JSON.stringify(args.companyProfile)}

For each competitor:
1. Company Overview
   - Business description
   - History and milestones
   - Ownership structure
   - Geographic presence

2. Financial Performance
   - Revenue and growth
   - Profitability metrics
   - Market share
   - Financial health

3. Strategic Focus
   - Stated strategy
   - Recent initiatives
   - Investment priorities
   - M&A activity

4. Product/Service Portfolio
   - Key offerings
   - Product differentiation
   - Pricing strategy
   - Innovation pipeline

5. Strengths and Weaknesses
   - Competitive advantages
   - Core competencies
   - Vulnerabilities
   - Resource gaps

6. Likely Future Moves
   - Strategic direction
   - Competitive responses
   - Market expansion
   - Investment areas

Output competitor profiles and comparison.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const assessCompetitivePositioningTask = defineTask('assess-competitive-positioning', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'competitive-strategy' },
  agent: {
    name: 'positioning-analyst',
    prompt: {
      system: 'You are a strategy analyst assessing competitive positioning.',
      user: `Assess competitive positioning.

Company profile: ${JSON.stringify(args.companyProfile)}
Competitor analysis: ${JSON.stringify(args.competitorAnalysis)}
Industry structure: ${JSON.stringify(args.industryStructure)}

Assess:
1. Market Position
   - Market share ranking
   - Position stability
   - Share trends
   - Segment leadership

2. Competitive Advantages
   - Cost advantages
   - Differentiation
   - Focus/niche
   - Sustainability

3. Value Proposition
   - Customer value delivery
   - Unique selling points
   - Brand positioning
   - Price-value position

4. Capability Comparison
   - Operations capabilities
   - Technology capabilities
   - Distribution capabilities
   - Innovation capabilities

5. Strategic Group Analysis
   - Strategic groups identified
   - Company's group membership
   - Group dynamics
   - Mobility barriers

6. Positioning Map
   - Key dimensions
   - Company position
   - Competitor positions
   - White space opportunities

7. Gap Analysis
   - Competitive gaps
   - Capability gaps
   - Investment needs

Output competitive positioning assessment.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeIndustryTrendsTask = defineTask('analyze-industry-trends', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'trend-analysis' },
  agent: {
    name: 'trends-analyst',
    prompt: {
      system: 'You are an analyst identifying and assessing industry trends.',
      user: `Analyze industry trends for ${args.industry}.

Market data: ${JSON.stringify(args.marketData)}

Analyze:
1. Technology Trends
   - Emerging technologies
   - Digital transformation
   - Automation/AI impact
   - Technology adoption curves

2. Customer Trends
   - Changing preferences
   - Buying behavior shifts
   - Demographics impact
   - Experience expectations

3. Business Model Innovation
   - New business models
   - Disruptive entrants
   - Platform dynamics
   - Subscription/recurring models

4. Regulatory Trends
   - Regulatory direction
   - Compliance requirements
   - Policy impacts
   - ESG considerations

5. Macro Trends
   - Economic factors
   - Globalization/localization
   - Sustainability
   - Workforce changes

6. Disruption Assessment
   - Disruption risks
   - Disruption timeline
   - Impact severity
   - Response strategies

7. Opportunity Identification
   - Emerging opportunities
   - Timing considerations
   - Required capabilities

Output industry trends analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developStrategicImplicationsTask = defineTask('develop-strategic-implications', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'strategic-planning' },
  agent: {
    name: 'strategy-advisor',
    prompt: {
      system: 'You are a strategy advisor developing strategic implications from competitive analysis.',
      user: `Develop strategic implications.

Industry analysis: ${JSON.stringify(args.industryAnalysis)}
Competitive analysis: ${JSON.stringify(args.competitiveAnalysis)}
Company profile: ${JSON.stringify(args.companyProfile)}

Develop:
1. Strategic Opportunities
   - Growth opportunities
   - Market expansion
   - Product development
   - M&A opportunities

2. Strategic Threats
   - Competitive threats
   - Disruption risks
   - Market risks
   - Regulatory risks

3. Strategic Options
   - Organic growth paths
   - Inorganic options
   - Partnership opportunities
   - Defensive moves

4. Competitive Response
   - Likely competitor reactions
   - Pre-emptive moves
   - Response strategies

5. Resource Requirements
   - Capability investments
   - Capital requirements
   - Talent needs
   - Technology investments

6. Strategic Recommendations
   - Priority initiatives
   - Timing considerations
   - Risk mitigation
   - Success metrics

Output strategic implications and recommendations.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const assessFinancialPlanningImplicationsTask = defineTask('financial-planning-implications', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'financial-planning' },
  agent: {
    name: 'fp-analyst',
    prompt: {
      system: 'You are a financial planning analyst translating competitive analysis into financial planning inputs.',
      user: `Assess financial planning implications.

Industry analysis: ${JSON.stringify(args.industryAnalysis)}
Company profile: ${JSON.stringify(args.companyProfile)}

Assess implications for:
1. Revenue Planning
   - Market growth assumptions
   - Share trajectory assumptions
   - Pricing assumptions
   - Product mix assumptions

2. Margin Planning
   - Industry margin benchmarks
   - Cost structure comparison
   - Margin improvement potential
   - Competitive pricing pressure

3. Investment Planning
   - Required investments
   - R&D requirements
   - Capital expenditure needs
   - M&A budget

4. Working Capital
   - Industry benchmarks
   - Optimization opportunities
   - Growth requirements

5. Risk Assessment
   - Revenue risks
   - Margin risks
   - Competitive risks
   - Planning sensitivities

6. Planning Assumptions
   - Recommended assumptions
   - Scenario definitions
   - Sensitivity ranges

7. Financial Targets
   - Revenue targets
   - Margin targets
   - Return targets
   - Benchmark comparison

Output financial planning implications.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
