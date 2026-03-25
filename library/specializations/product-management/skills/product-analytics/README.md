# Product Analytics Skill

## Overview

The Product Analytics skill provides deep integration with product analytics platforms for data-driven product decisions. It enables metric definition, funnel analysis, retention tracking, and dashboard configuration using data from Amplitude, Mixpanel, Heap, and other platforms.

## Purpose

Product managers need quick access to analytics data without SQL expertise or platform-specific knowledge. This skill enables:

- **Self-Service Analytics**: Query data without engineering support
- **Standardized Metrics**: Consistent metric definitions across teams
- **Automated Reporting**: Generate recurring analytics reports
- **Dashboard Management**: Configure and maintain product dashboards

## Use Cases

### 1. Funnel Optimization
Analyze conversion funnels to identify drop-off points and optimization opportunities.

### 2. Retention Analysis
Track cohort retention to understand user engagement over time.

### 3. Feature Adoption Tracking
Measure how users adopt new features after launch.

### 4. A/B Test Analysis
Calculate experiment results and statistical significance.

## Processes That Use This Skill

- **Metrics Dashboard Definition** (`metrics-dashboard.js`)
- **Conversion Funnel Analysis** (`conversion-funnel-analysis.js`)
- **Retention Cohort Analysis** (`retention-cohort-analysis.js`)
- **Product-Market Fit Assessment** (`product-market-fit.js`)

## Supported Platforms

| Platform | Connection | Capabilities |
|----------|------------|--------------|
| Amplitude | API Key | Funnels, retention, events, cohorts |
| Mixpanel | Service Account | Funnels, retention, flows, insights |
| Heap | API Access | Events, funnels, users |
| Google Analytics 4 | BigQuery Export | Events, conversions, audiences |
| PostHog | API Key | Events, funnels, feature flags |

## Input Specification

### Funnel Query
```json
{
  "queryType": "funnel",
  "platform": "amplitude",
  "config": {
    "events": [
      {"event_type": "signup_started"},
      {"event_type": "signup_completed"},
      {"event_type": "first_action"}
    ],
    "conversion_window": "7 days",
    "date_range": {
      "start": "2026-01-01",
      "end": "2026-01-24"
    },
    "segments": ["platform", "utm_source"]
  }
}
```

### Retention Query
```json
{
  "queryType": "retention",
  "platform": "mixpanel",
  "config": {
    "cohort_event": "signup_completed",
    "return_event": "any_active",
    "periods": [1, 7, 14, 30, 60, 90],
    "cohort_grouping": "week",
    "date_range": {
      "start": "2025-10-01",
      "end": "2026-01-24"
    }
  }
}
```

## Output Specification

### Funnel Results
```json
{
  "funnel_name": "Signup to Activation",
  "period": "2026-01-01 to 2026-01-24",
  "steps": [
    {"step": 1, "event": "signup_started", "users": 10000, "rate": 1.0},
    {"step": 2, "event": "signup_completed", "users": 6500, "rate": 0.65},
    {"step": 3, "event": "first_action", "users": 2100, "rate": 0.32}
  ],
  "overall_conversion": 0.21,
  "segments": {
    "platform": {
      "web": {"conversion": 0.18, "users": 5000},
      "ios": {"conversion": 0.25, "users": 3000},
      "android": {"conversion": 0.19, "users": 2000}
    }
  },
  "insights": [
    "iOS has 39% higher conversion than web",
    "Biggest drop-off is signup completion (35%)"
  ]
}
```

### Retention Results
```json
{
  "analysis_type": "retention",
  "cohort_size": "weekly",
  "periods": ["D1", "D7", "D14", "D30", "D60", "D90"],
  "matrix": [
    {
      "cohort": "2025-W50",
      "size": 1000,
      "retention": {
        "D1": 0.45,
        "D7": 0.30,
        "D14": 0.25,
        "D30": 0.20,
        "D60": 0.15,
        "D90": 0.12
      }
    }
  ],
  "benchmarks": {
    "D1": 0.40,
    "D7": 0.25,
    "D30": 0.15
  },
  "vs_benchmark": {
    "D1": "+12%",
    "D7": "+20%",
    "D30": "+33%"
  }
}
```

## Workflow

### Phase 1: Query Definition
1. Select analytics platform
2. Define query parameters
3. Specify date range and filters
4. Choose segmentation dimensions

### Phase 2: Data Retrieval
1. Authenticate with platform
2. Execute query
3. Handle pagination
4. Validate data completeness

### Phase 3: Analysis
1. Calculate derived metrics
2. Generate comparisons
3. Identify anomalies
4. Extract insights

### Phase 4: Output Generation
1. Format results
2. Create visualizations
3. Generate recommendations
4. Export to desired format

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `platform` | amplitude | Analytics platform to query |
| `timezone` | UTC | Timezone for date calculations |
| `includeHistorical` | true | Include historical comparison |
| `confidenceLevel` | 0.95 | Statistical confidence level |
| `outputFormat` | json | Output format (json, markdown) |

## Metric Definitions

### Standard Metrics

| Metric | Definition | Typical Query |
|--------|------------|---------------|
| DAU | Daily Active Users | Unique users with any event/day |
| WAU | Weekly Active Users | Unique users with any event/week |
| MAU | Monthly Active Users | Unique users with any event/month |
| Retention D7 | 7-day retention | Users active on day 7 after signup |
| Conversion Rate | Funnel completion | Step N users / Step 1 users |

### Custom Metric Template
```json
{
  "metric_name": "Activation Rate",
  "definition": "Users who complete key action within 7 days of signup",
  "calculation": {
    "numerator": {
      "event": "key_action_completed",
      "conditions": {"within_days_of_signup": 7}
    },
    "denominator": {
      "event": "signup_completed"
    }
  },
  "segments": ["platform", "signup_source"],
  "target": 0.40,
  "alert_threshold": 0.35
}
```

## Integration with Other Skills

- **prioritization-calculator**: Use reach data for RICE scoring
- **ab-test-design**: Pull experiment results
- **user-research-synthesis**: Correlate with qualitative findings
- **metrics-dashboard**: Configure dashboard widgets

## Best Practices

### 1. Define Metrics Before Querying
Document metric definitions to ensure consistency.

### 2. Use Consistent Date Ranges
Align date ranges across comparisons for accuracy.

### 3. Segment by Default
Always include key segments (platform, user type) in queries.

### 4. Validate Against Source
Spot-check results against platform UI.

### 5. Document Filters
Record all filters applied to queries for reproducibility.

## Troubleshooting

### Common Issues

1. **Missing Data**: Check event tracking implementation
2. **Date Misalignment**: Verify timezone settings
3. **Segment Mismatch**: Ensure consistent segment definitions
4. **Rate Limits**: Implement query batching for large requests

### Data Quality Checks

- [ ] Event volumes within expected range
- [ ] No duplicate events
- [ ] User IDs properly attributed
- [ ] Bot traffic filtered
- [ ] Internal users excluded

## Examples

### Funnel Analysis
```
Query: Signup funnel, last 30 days, by platform

Results:
- Web: 18% conversion (5000 users)
- iOS: 25% conversion (3000 users)
- Android: 19% conversion (2000 users)

Insight: iOS performs 39% better than web. Investigate web-specific friction.
```

### Retention Analysis
```
Query: Weekly cohorts, D30 retention

Results:
- Average D30: 20%
- Best cohort (W50): 25%
- Worst cohort (W48): 15%

Insight: W50 had new onboarding flow. Validate and roll out.
```

## References

- [Mixpanel MCP Server](https://docs.mixpanel.com/docs/features/mcp)
- [Analytics Reporter Plugin](https://github.com/ccplugins/awesome-claude-code-plugins)
- [Data Scientist Plugin](https://github.com/ccplugins/awesome-claude-code-plugins)
- [cc-metrics Tool](https://github.com/lasswellt/cc-metrics)
- Process: `metrics-dashboard.js`, `conversion-funnel-analysis.js`, `retention-cohort-analysis.js`
