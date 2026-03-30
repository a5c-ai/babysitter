---
name: gainsight-cs
description: Gainsight customer success platform for health monitoring
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
    - Gainsight API
---

# Gainsight Customer Success

## Overview

The Gainsight CS skill provides integration with Gainsight's customer success platform for health score retrieval, timeline activity access, success plan management, and risk/opportunity signal monitoring. This skill enables proactive customer management and expansion identification.

## Capabilities

### Health Score Access
- Retrieve composite health scores
- Access individual score components
- Track health trends over time
- Identify score threshold breaches

### Timeline Activity
- Access customer timeline entries
- Track touchpoints and interactions
- Monitor milestone completions
- Review historical engagement

### Success Plan Management
- Create and manage success plans
- Track objective completion
- Monitor action item progress
- Align stakeholder expectations

### Risk & Opportunity Signals
- Identify at-risk accounts
- Surface expansion opportunities
- Track signal triggers
- Prioritize intervention actions

## Usage

### Account Health Review
```
Pull comprehensive health data for an account including scores, trends, and recent activity.
```

### Risk Identification
```
Identify accounts with declining health scores or triggered risk signals requiring attention.
```

### Expansion Opportunity
```
Surface accounts with strong health and expansion signals for upsell outreach.
```

## Enhances Processes

- customer-health-monitoring
- account-expansion-upsell
- strategic-account-planning
- qbr-process

## Dependencies

- Gainsight subscription
- Health score configuration
- CRM and product usage integrations
