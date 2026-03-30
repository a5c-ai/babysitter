---
name: apollo-prospecting
description: Apollo.io prospecting and engagement data integration
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
  priority: P2
  integration-points:
    - Apollo.io API
---

# Apollo Prospecting

## Overview

The Apollo Prospecting skill provides integration with Apollo.io for prospecting, contact database access, email sequence engagement metrics, and buying intent signals. This skill combines data enrichment with sales engagement capabilities for streamlined outbound workflows.

## Capabilities

### Contact Database Search
- Search Apollo's extensive contact database
- Filter by company, title, industry, and location
- Access verified email addresses
- Export contacts for outreach campaigns

### Sequence Engagement Metrics
- Track email open and click rates
- Monitor reply rates by sequence and template
- Analyze optimal send times
- Measure sequence completion rates

### Intent Signals
- Access buying intent data
- Track account engagement scores
- Monitor content consumption patterns
- Identify sales-ready accounts

### Account Scoring
- Leverage Apollo's account scoring algorithms
- Prioritize accounts by fit and intent
- Track score changes over time
- Combine with custom scoring models

## Usage

### Prospecting Campaign
```
Build a targeted prospect list based on ICP criteria and enroll them in an appropriate outreach sequence.
```

### Engagement Analysis
```
Analyze sequence performance to identify best-performing messages and optimal engagement patterns.
```

### Account Prioritization
```
Score and prioritize accounts based on combined fit and intent signals for focused outreach.
```

## Enhances Processes

- lead-routing-assignment
- lead-qualification-scoring

## Dependencies

- Apollo.io subscription with API access
- Email integration for sequence tracking
- CRM sync configuration
