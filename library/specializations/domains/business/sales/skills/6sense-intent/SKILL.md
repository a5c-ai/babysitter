---
name: 6sense-intent
description: 6sense intent data and anonymous buyer identification platform
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
  priority: P1
  integration-points:
    - 6sense API
---

# 6sense Intent

## Overview

The 6sense Intent skill provides access to 6sense's account identification and intent data platform, enabling anonymous buyer identification, intent topic tracking, account engagement scoring, and predictive analytics. This skill uncovers hidden demand and prioritizes accounts based on buying signals.

## Capabilities

### Anonymous Buyer Identification
- Identify anonymous website visitors by account
- Match visitor behavior to company profiles
- Track engagement across multiple sessions
- Build comprehensive account activity timelines

### Intent Topic Tracking
- Monitor accounts researching specific topics
- Track intent keyword matches and volume
- Identify buying stage based on research patterns
- Compare intent across competitors and categories

### Account Engagement Scoring
- Calculate multi-signal engagement scores
- Track score progression over time
- Identify score threshold triggers
- Segment accounts by engagement level

### Predictive Analytics
- Access predictive buying stage models
- Leverage AI-powered recommendations
- Forecast account conversion likelihood
- Identify lookalike accounts

## Usage

### In-Market Account Discovery
```
Identify accounts showing strong intent signals for target keywords and prioritize them for immediate outreach.
```

### Buying Stage Analysis
```
Analyze accounts by buying stage to align sales activities with prospect readiness.
```

### Predictive Targeting
```
Use predictive models to identify accounts most likely to convert and allocate resources accordingly.
```

## Enhances Processes

- lead-qualification-scoring
- account-expansion-upsell
- customer-health-monitoring

## Dependencies

- 6sense platform subscription
- Website tracking implementation
- CRM integration for account matching
