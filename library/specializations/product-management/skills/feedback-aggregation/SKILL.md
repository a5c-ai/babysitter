---
name: Customer Feedback Aggregation
description: Aggregate and analyze customer feedback from multiple sources for product insights
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# Customer Feedback Aggregation Skill

## Overview

Specialized skill for aggregating and analyzing customer feedback from multiple sources. Enables product teams to synthesize voice-of-customer data into actionable insights for product decisions.

## Capabilities

### Data Collection
- Parse support tickets for feature requests
- Analyze NPS/CSAT verbatim responses
- Extract themes from sales call notes
- Monitor app store reviews
- Aggregate feedback from Intercom/Zendesk
- Process customer interview transcripts

### Analysis
- Calculate feature request frequency
- Track sentiment trends over time
- Identify emerging themes and patterns
- Segment feedback by customer type
- Correlate feedback with customer attributes
- Detect urgency and impact signals

### Synthesis
- Generate feedback summary reports
- Create feature request rankings
- Build customer pain point matrices
- Generate insight recommendations
- Create feedback-to-feature mapping

## Target Processes

This skill integrates with the following processes:
- `jtbd-analysis.js` - Voice of customer for jobs analysis
- `feature-definition-prd.js` - Customer-driven requirements
- `rice-prioritization.js` - Reach and impact scoring
- `customer-advisory-board.js` - CAB feedback synthesis

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "sources": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["support-tickets", "nps-verbatim", "sales-calls", "app-reviews", "interviews", "surveys"] },
          "data": { "type": "array", "items": { "type": "object" } },
          "dateRange": { "type": "object" }
        }
      },
      "description": "Feedback data sources"
    },
    "analysisScope": {
      "type": "string",
      "enum": ["all", "feature-requests", "pain-points", "sentiment", "trends"],
      "description": "Focus area for analysis"
    },
    "segmentation": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Dimensions to segment feedback by"
    },
    "timeRange": {
      "type": "object",
      "properties": {
        "start": { "type": "string", "format": "date" },
        "end": { "type": "string", "format": "date" }
      }
    }
  },
  "required": ["sources"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "summary": {
      "type": "object",
      "properties": {
        "totalFeedbackItems": { "type": "number" },
        "sourceBreakdown": { "type": "object" },
        "dateRange": { "type": "object" },
        "overallSentiment": { "type": "string" }
      }
    },
    "themes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "theme": { "type": "string" },
          "frequency": { "type": "number" },
          "sentiment": { "type": "string" },
          "examples": { "type": "array", "items": { "type": "string" } },
          "segments": { "type": "object" }
        }
      }
    },
    "featureRequests": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "feature": { "type": "string" },
          "requestCount": { "type": "number" },
          "customerSegments": { "type": "array", "items": { "type": "string" } },
          "urgencyScore": { "type": "number" },
          "impactEstimate": { "type": "string" },
          "representativeQuotes": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "painPoints": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "painPoint": { "type": "string" },
          "severity": { "type": "string" },
          "frequency": { "type": "number" },
          "customerImpact": { "type": "string" }
        }
      }
    },
    "trends": {
      "type": "object",
      "properties": {
        "emerging": { "type": "array", "items": { "type": "string" } },
        "declining": { "type": "array", "items": { "type": "string" } },
        "sentimentTrend": { "type": "string" }
      }
    },
    "recommendations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "recommendation": { "type": "string" },
          "priority": { "type": "string" },
          "evidence": { "type": "array", "items": { "type": "string" } }
        }
      }
    }
  }
}
```

## Usage Example

```javascript
const feedbackAnalysis = await executeSkill('feedback-aggregation', {
  sources: [
    {
      type: 'support-tickets',
      data: supportTickets,
      dateRange: { start: '2026-01-01', end: '2026-01-24' }
    },
    {
      type: 'nps-verbatim',
      data: npsResponses
    },
    {
      type: 'app-reviews',
      data: appStoreReviews
    }
  ],
  analysisScope: 'all',
  segmentation: ['plan_type', 'company_size', 'tenure']
});
```

## Dependencies

- NLP capabilities
- Support platform APIs (Intercom, Zendesk)
- App store APIs
