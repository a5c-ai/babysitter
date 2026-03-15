---
name: product-analytics
description: Deep integration with product analytics platforms for metrics, funnels, retention, and experimentation. Query Amplitude/Mixpanel/Heap data, generate retention curves, calculate conversion metrics, and build dashboard configurations.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob
---

# Product Analytics Skill

Query and analyze product analytics data for metrics definition, funnel analysis, retention curves, and experiment tracking.

## Overview

This skill provides comprehensive capabilities for working with product analytics platforms. It enables data-driven product decisions through metric queries, funnel analysis, cohort retention tracking, and dashboard generation.

## Capabilities

### Analytics Platform Integration
- Query Amplitude, Mixpanel, Heap, GA4 data
- Execute custom event queries
- Pull predefined report data
- Sync metric definitions

### Funnel Analysis
- Define and calculate conversion funnels
- Identify drop-off points and friction
- Segment funnels by user attributes
- Compare funnel performance over time

### Retention Analysis
- Generate retention curves and matrices
- Calculate cohort retention rates
- Analyze retention by user segment
- Identify retention drivers and predictors

### Metric Definition
- Define North Star and supporting metrics
- Create event tracking specifications
- Document metric calculations
- Build metric hierarchies (trees)

### Dashboard Configuration
- Generate dashboard layouts
- Configure chart specifications
- Define alert thresholds
- Export dashboard configs

## Prerequisites

### Analytics Platform Access
```yaml
Supported Platforms:
  - Amplitude (API key required)
  - Mixpanel (service account)
  - Heap (API access)
  - Google Analytics 4 (BigQuery export)
  - Posthog (API key)
```

### Configuration
```json
{
  "platform": "amplitude",
  "credentials": {
    "api_key": "${AMPLITUDE_API_KEY}",
    "secret_key": "${AMPLITUDE_SECRET_KEY}"
  },
  "project_id": "123456",
  "timezone": "America/Los_Angeles"
}
```

## Usage Patterns

### Funnel Analysis Query
```markdown
## Funnel Definition

### Funnel: Signup to First Value

**Steps**:
1. Page View: /signup
2. Event: signup_started
3. Event: signup_completed
4. Event: first_action_completed

**Filters**:
- Platform: web
- Date range: last 30 days
- New users only

**Segmentation**:
- By traffic source
- By device type
```

### Funnel Query Example (Amplitude-style)
```python
# Funnel analysis query
funnel_config = {
    "events": [
        {"event_type": "signup_started"},
        {"event_type": "signup_completed"},
        {"event_type": "onboarding_completed"},
        {"event_type": "first_value_action"}
    ],
    "filters": {
        "platform": ["web", "ios", "android"],
        "date_range": {
            "start": "2026-01-01",
            "end": "2026-01-24"
        }
    },
    "conversion_window": "7 days",
    "group_by": ["platform", "utm_source"]
}

# Expected output format
funnel_results = {
    "overall": {
        "step_1": {"users": 10000, "rate": 1.0},
        "step_2": {"users": 6500, "rate": 0.65},
        "step_3": {"users": 4200, "rate": 0.65},
        "step_4": {"users": 2100, "rate": 0.50}
    },
    "overall_conversion": 0.21,
    "segments": {
        "web": {"conversion": 0.18},
        "ios": {"conversion": 0.25},
        "android": {"conversion": 0.19}
    }
}
```

### Retention Analysis
```markdown
## Retention Query

### Cohort Definition
- **Cohort by**: signup_date (weekly)
- **Retention event**: any_active_event
- **Time periods**: Day 1, 7, 14, 30, 60, 90

### Output: Retention Matrix

| Cohort Week | Users | D1 | D7 | D14 | D30 | D60 | D90 |
|-------------|-------|-----|-----|-----|-----|-----|-----|
| Jan 1-7 | 1000 | 45% | 30% | 25% | 20% | 15% | 12% |
| Jan 8-14 | 1200 | 48% | 32% | 27% | 22% | - | - |
| Jan 15-21 | 1100 | 46% | 31% | - | - | - | - |
```

### Retention Query Example
```python
# Retention analysis configuration
retention_config = {
    "cohort_definition": {
        "event": "signup_completed",
        "grouping": "week"
    },
    "retention_event": {
        "event_type": "any_active",
        "conditions": ["page_view", "feature_used", "content_created"]
    },
    "periods": [1, 7, 14, 30, 60, 90],
    "date_range": {
        "start": "2025-10-01",
        "end": "2026-01-24"
    },
    "segments": ["subscription_tier", "signup_source"]
}

# Expected output
retention_results = {
    "retention_matrix": [
        {
            "cohort": "2025-W40",
            "cohort_size": 1000,
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
    "averages": {
        "D1": 0.46,
        "D7": 0.31,
        "D14": 0.26,
        "D30": 0.21,
        "D60": 0.16,
        "D90": 0.13
    },
    "trends": {
        "D30_trend": "+2%",  # vs previous period
        "D7_trend": "-1%"
    }
}
```

### Metric Definition Specification
```markdown
## Metric Specification Template

### Metric: Weekly Active Users (WAU)

**Definition**: Unique users who performed at least one qualifying action in a 7-day period.

**Calculation**:
```sql
SELECT COUNT(DISTINCT user_id)
FROM events
WHERE event_type IN ('page_view', 'feature_used', 'content_created')
  AND event_timestamp >= CURRENT_DATE - INTERVAL '7 days'
```

**Qualifying Events**:
- page_view (any page)
- feature_used
- content_created
- content_shared

**Exclusions**:
- Bot traffic (user_agent filter)
- Internal users (email domain filter)

**Segments**:
- By platform (web, ios, android)
- By subscription tier
- By signup cohort

**Alerts**:
- Warning: >5% week-over-week decline
- Critical: >10% week-over-week decline
```

### Event Tracking Specification
```json
{
  "event_name": "feature_used",
  "description": "User interacted with a product feature",
  "category": "engagement",
  "properties": {
    "feature_name": {
      "type": "string",
      "required": true,
      "description": "Name of the feature used",
      "examples": ["search", "export", "share"]
    },
    "feature_version": {
      "type": "string",
      "required": false,
      "description": "Version of the feature"
    },
    "action": {
      "type": "string",
      "required": true,
      "enum": ["click", "view", "complete", "cancel"]
    },
    "duration_ms": {
      "type": "integer",
      "required": false,
      "description": "Time spent on feature"
    }
  },
  "user_properties": {
    "subscription_tier": "string",
    "signup_date": "date"
  }
}
```

## Integration with Babysitter SDK

### Task Definition Example
```javascript
const analyticsQueryTask = defineTask({
  name: 'analytics-query',
  description: 'Query product analytics data',

  inputs: {
    queryType: { type: 'string', required: true }, // funnel, retention, metric
    config: { type: 'object', required: true },
    platform: { type: 'string', default: 'amplitude' },
    dateRange: { type: 'object', required: true }
  },

  outputs: {
    results: { type: 'object' },
    visualizations: { type: 'array' },
    insights: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Run ${inputs.queryType} analysis`,
      skill: {
        name: 'product-analytics',
        context: {
          operation: inputs.queryType,
          config: inputs.config,
          platform: inputs.platform,
          dateRange: inputs.dateRange
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Dashboard Configuration

### Dashboard Specification
```json
{
  "dashboard_name": "Product Health Dashboard",
  "refresh_interval": "1h",
  "layout": {
    "columns": 3,
    "rows": 4
  },
  "widgets": [
    {
      "id": "wau_trend",
      "type": "line_chart",
      "position": {"row": 1, "col": 1, "width": 2},
      "metric": "weekly_active_users",
      "time_range": "90d",
      "comparison": "previous_period"
    },
    {
      "id": "retention_heatmap",
      "type": "heatmap",
      "position": {"row": 1, "col": 3, "width": 1},
      "metric": "cohort_retention",
      "periods": [1, 7, 30]
    },
    {
      "id": "funnel_chart",
      "type": "funnel",
      "position": {"row": 2, "col": 1, "width": 3},
      "funnel_id": "signup_to_activation",
      "segments": ["platform"]
    }
  ],
  "alerts": [
    {
      "metric": "weekly_active_users",
      "condition": "decrease_percent > 5",
      "severity": "warning",
      "notification": "slack"
    }
  ]
}
```

## Output Formats

### Funnel Analysis Report
```markdown
# Funnel Analysis Report: Signup to First Value

## Overview
- **Period**: January 1-24, 2026
- **Total Users**: 10,000
- **Overall Conversion**: 21%

## Step-by-Step Analysis

| Step | Event | Users | Conv Rate | Drop-off |
|------|-------|-------|-----------|----------|
| 1 | signup_started | 10,000 | 100% | - |
| 2 | signup_completed | 6,500 | 65% | 35% |
| 3 | onboarding_completed | 4,200 | 65% | 35% |
| 4 | first_value_action | 2,100 | 50% | 50% |

## Key Insights

1. **Biggest Drop-off**: Step 4 (onboarding to first value) - 50% drop
2. **Best Performing Segment**: iOS users (25% overall conversion)
3. **Opportunity**: Mobile onboarding flow optimization

## Recommendations

1. Simplify first value action guidance
2. Add progress indicators in onboarding
3. Implement re-engagement for drop-offs at step 3
```

## Best Practices

1. **Define Metrics Clearly**: Document calculation logic and edge cases
2. **Use Consistent Time Zones**: Align all queries to single timezone
3. **Segment Everything**: Always analyze by key user segments
4. **Validate Data Quality**: Check for tracking gaps and anomalies
5. **Version Event Schemas**: Track changes to event definitions
6. **Set Appropriate Alerts**: Avoid alert fatigue with meaningful thresholds

## References

- [Mixpanel MCP Server](https://docs.mixpanel.com/docs/features/mcp)
- [Analytics Reporter Plugin](https://github.com/ccplugins/awesome-claude-code-plugins)
- [Data Scientist Plugin](https://github.com/ccplugins/awesome-claude-code-plugins)
- [Performance Pattern Analyzer](https://github.com/ChrisRoyse/610ClaudeSubagents)
