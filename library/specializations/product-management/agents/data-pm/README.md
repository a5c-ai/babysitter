# Data-Driven PM Agent

## Overview

The Data-Driven PM agent is an autonomous PM agent specialized in product analytics, metrics, and experimentation. It transforms data into actionable product insights through funnel analysis, retention tracking, experiment design, and growth metrics management.

## Purpose

Data-driven decision making is essential for modern product management but requires specialized expertise. This agent enables:

- **Rigorous Analysis**: Apply statistical methods to product data
- **Actionable Insights**: Transform data into specific recommendations
- **Experiment Design**: Design valid experiments with proper methodology
- **Metric Governance**: Define and maintain consistent metric definitions

## Capabilities

| Capability | Description |
|------------|-------------|
| Metrics Definition | Define North Star and supporting metrics |
| Funnel Analysis | Analyze conversion funnels and drop-offs |
| Retention Analysis | Build cohort retention matrices and curves |
| Experiment Design | Design A/B tests with proper sample sizes |
| Growth Analysis | Analyze acquisition, activation, retention, revenue |
| Dashboard Design | Configure analytics dashboards |

## Required Skills

This agent requires the following skills to function:

1. **product-analytics**: Query and analyze product data
2. **prioritization-calculator**: Score opportunities by impact
3. **ab-test-design**: Design and analyze experiments

## Processes That Use This Agent

- **Metrics Dashboard Definition** (`metrics-dashboard.js`)
- **Conversion Funnel Analysis** (`conversion-funnel-analysis.js`)
- **Retention Cohort Analysis** (`retention-cohort-analysis.js`)
- **Product-Market Fit Assessment** (`product-market-fit.js`)

## Workflow

### Phase 1: Context Understanding

```
Input: Business question, available data
Output: Analysis plan

Steps:
1. Clarify business objective
2. Identify key metrics to analyze
3. Review available data sources
4. Plan analysis approach
```

### Phase 2: Data Collection

```
Input: Analysis plan, platform access
Output: Raw data

Steps:
1. Query analytics platform
2. Pull relevant events and metrics
3. Gather segmentation data
4. Validate data quality
```

### Phase 3: Analysis

```
Input: Raw data
Output: Calculated metrics and patterns

Steps:
1. Calculate core metrics
2. Segment by key dimensions
3. Identify patterns and anomalies
4. Compare to benchmarks/history
```

### Phase 4: Insight Generation

```
Input: Analysis results
Output: Insights and hypotheses

Steps:
1. Interpret findings
2. Correlate with qualitative data
3. Identify root causes
4. Prioritize opportunities
```

### Phase 5: Recommendations

```
Input: Insights
Output: Action plan

Steps:
1. Propose specific actions
2. Estimate expected impact
3. Suggest experiments
4. Document methodology
```

## Input Specification

### Funnel Analysis
```json
{
  "task": "funnel_analysis",
  "funnel": {
    "name": "Signup to Activation",
    "events": ["signup_started", "signup_completed", "first_action"],
    "conversionWindow": "7 days"
  },
  "dateRange": {"start": "2026-01-01", "end": "2026-01-24"},
  "segments": ["platform", "signup_source"]
}
```

### Retention Analysis
```json
{
  "task": "retention_analysis",
  "cohortDefinition": {
    "event": "signup_completed",
    "grouping": "week"
  },
  "retentionEvent": "any_active",
  "periods": [1, 7, 14, 30, 60, 90],
  "dateRange": {"start": "2025-10-01", "end": "2026-01-24"}
}
```

## Output Specification

### Funnel Results
```json
{
  "analysis": {
    "funnel_name": "Signup to Activation",
    "overall_conversion": 0.21,
    "steps": [
      {"step": 1, "users": 10000, "rate": 1.0},
      {"step": 2, "users": 6500, "rate": 0.65},
      {"step": 3, "users": 2100, "rate": 0.32}
    ],
    "biggest_dropoff": {"step": 3, "rate": 0.32}
  },
  "insights": [
    "50% drop-off at activation step",
    "iOS converts 39% better than web"
  ],
  "recommendations": [
    {"action": "Simplify activation flow", "impact": "+10%"}
  ]
}
```

### Retention Results
```json
{
  "analysis": {
    "averageRetention": {
      "D1": 0.45, "D7": 0.30, "D30": 0.20
    },
    "bestCohort": {"cohort": "W50", "D30": 0.25},
    "trend": "+5% D30 vs prior quarter"
  },
  "insights": [
    "D30 retention improved after onboarding changes",
    "Mobile users retain 20% better than web"
  ],
  "recommendations": [
    {"action": "Roll out onboarding changes to all users"}
  ]
}
```

## Analysis Types

### Funnel Analysis
Measure conversion through multi-step processes.

| Metric | Description |
|--------|-------------|
| Step Conversion | % converting from step N to N+1 |
| Overall Conversion | % completing all steps |
| Drop-off Rate | % not converting at each step |
| Time to Convert | Duration between steps |

### Retention Analysis
Measure user engagement over time.

| Metric | Description |
|--------|-------------|
| D1/D7/D30 Retention | % active on day N after signup |
| Rolling Retention | % active within N-day window |
| Churn Rate | % who stopped using product |
| Resurrection Rate | % returning after churn |

### Growth Metrics
Measure business growth drivers.

| Metric | Description |
|--------|-------------|
| Acquisition | New users by channel |
| Activation | Users reaching value moment |
| Retention | Users returning over time |
| Revenue | Monetization metrics |
| Referral | Viral/organic growth |

## Decision Logic

### Funnel Optimization
```
Priority = Users Lost * Feasibility

High Priority:
- Large absolute drop-off
- Clear improvement opportunity
- Low implementation effort
```

### Experiment Recommendation
```
A/B Test When:
- High traffic (>1000 users/variant)
- Measurable outcome
- Reversible change

Just Ship When:
- Low risk
- Obvious improvement
- Small impact area
```

## Integration

### With Other Agents

```
user-researcher ──> data-pm ──> prioritization-expert
      │                │                │
      └── qualitative  └── quantitative └── prioritized
```

### With Skills

```
data-pm
    ├── product-analytics (data queries)
    ├── prioritization-calculator (scoring)
    └── ab-test-design (experiments)
```

## Usage Example

### In Babysitter Process

```javascript
// conversion-funnel-analysis.js

const funnelResult = await ctx.task(funnelAnalysisTask, {
  funnel: {
    name: 'Checkout Funnel',
    events: ['cart_view', 'checkout_start', 'payment_entered', 'order_complete']
  },
  dateRange: { start: '2026-01-01', end: '2026-01-24' },
  segments: ['platform', 'payment_method']
});

// Use insights
if (funnelResult.analysis.biggest_dropoff.rate < 0.5) {
  ctx.log('alert', 'Major funnel drop-off detected');
}
```

### Direct Agent Call

```javascript
const task = defineTask({
  name: 'monthly-metrics-review',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'January Metrics Review',
      agent: {
        name: 'data-pm',
        prompt: {
          role: 'Senior Analytics PM',
          task: 'Generate monthly metrics review with insights',
          context: {
            month: 'January 2026',
            metrics: ['DAU', 'retention', 'conversion', 'revenue']
          },
          instructions: [
            'Pull key metrics for January',
            'Compare to December and January 2025',
            'Identify significant changes',
            'Generate top 5 insights',
            'Recommend focus areas for February'
          ]
        }
      }
    };
  }
});
```

## Best Practices

1. **Define Metrics Clearly**: Document exact calculation methodology
2. **Segment by Default**: Never just look at totals
3. **Validate Data Quality**: Check for tracking gaps
4. **Report Confidence**: Include uncertainty ranges
5. **Causation Requires Experiments**: Correlation is not causation
6. **Make it Reproducible**: Document queries and methodology

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Missing data | Tracking gaps | Validate tracking, note limitations |
| Small sample | Insufficient users | Wait longer, lower confidence |
| Conflicting signals | Multiple causes | Segment deeper, run experiment |

## Related Resources

- Skills: `product-analytics/SKILL.md`
- Skills: `prioritization-calculator/SKILL.md`
- Processes: `metrics-dashboard.js`, `conversion-funnel-analysis.js`, `retention-cohort-analysis.js`
- References: [Mixpanel MCP](https://docs.mixpanel.com/docs/features/mcp), [Analytics Reporter](https://github.com/ccplugins/awesome-claude-code-plugins)
