---
name: clari-forecasting
description: Clari revenue operations platform for AI-powered forecasting
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: sales
  domain: business
  priority: P0
  integration-points:
    - Clari API
---

# Clari Forecasting

## Overview

The Clari Forecasting skill provides integration with Clari's revenue operations platform, enabling access to AI-powered forecast data, pipeline inspection analytics, deal activity signals, and forecast scenario modeling. This skill transforms revenue forecasting from opinion-based to data-driven.

## Capabilities

### AI-Powered Forecasting
- Retrieve AI-generated forecast predictions
- Compare AI forecast vs rep/manager calls
- Track forecast accuracy over time
- Identify forecast bias patterns

### Pipeline Inspection
- Access detailed pipeline analytics
- Track pipeline changes week-over-week
- Monitor deal slippage and push patterns
- Analyze stage conversion rates

### Deal Activity Signals
- Track engagement activity on deals
- Monitor stakeholder involvement
- Identify deals at risk of stalling
- Measure momentum indicators

### Scenario Modeling
- Run forecast scenario simulations
- Model best/worst/likely outcomes
- Assess sensitivity to key deals
- Plan contingency strategies

## Usage

### Weekly Forecast Review
```
Pull the current AI forecast alongside manager calls, identifying significant variances and at-risk commits.
```

### Pipeline Health Analysis
```
Analyze pipeline coverage, velocity, and conversion rates to identify gaps requiring immediate attention.
```

### Deal Risk Assessment
```
Evaluate deals based on engagement signals and activity patterns to prioritize intervention.
```

## Enhances Processes

- revenue-forecasting-planning
- pipeline-review-forecast
- deal-risk-assessment

## Dependencies

- Clari platform subscription
- CRM integration (Salesforce, HubSpot, etc.)
- Historical data for AI model training
