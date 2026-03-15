---
name: churnzero-signals
description: ChurnZero churn prediction and engagement signal monitoring
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
    - ChurnZero API
---

# ChurnZero Signals

## Overview

The ChurnZero Signals skill provides integration with ChurnZero for real-time usage data, churn risk scoring, playbook automation, and NPS/CSAT data access. This skill enables proactive churn prevention and customer engagement optimization.

## Capabilities

### Real-Time Usage Data
- Access live product usage metrics
- Track feature adoption patterns
- Monitor login frequency and duration
- Identify usage decline trends

### Churn Risk Scoring
- Retrieve churn risk scores
- Access scoring model components
- Track risk score changes
- Identify high-risk triggers

### Playbook Automation
- Trigger automated playbooks
- Track playbook execution
- Measure playbook effectiveness
- Customize playbook actions

### NPS & CSAT Data
- Access survey responses
- Track sentiment trends
- Segment by satisfaction level
- Correlate with usage patterns

## Usage

### Risk Assessment
```
Identify accounts with elevated churn risk scores and understand the contributing factors.
```

### Usage Analysis
```
Analyze product usage patterns to identify accounts requiring adoption assistance.
```

### Sentiment Monitoring
```
Track NPS and CSAT trends across the customer base to identify satisfaction patterns.
```

## Enhances Processes

- customer-health-monitoring
- deal-risk-assessment

## Dependencies

- ChurnZero subscription
- Product usage integration
- Survey configuration
