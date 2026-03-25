---
name: totango-health
description: Totango customer health and engagement monitoring
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
    - Totango API
---

# Totango Health

## Overview

The Totango Health skill provides integration with Totango's customer success platform for SuccessBLOC data access, health indicators, campaign enrollment, and segment management. This skill enables systematic customer journey management and health monitoring.

## Capabilities

### SuccessBLOC Data
- Access SuccessBLOC configurations
- Retrieve module-specific metrics
- Track journey stage progression
- Monitor touchpoint completions

### Health Indicators
- Retrieve multi-dimensional health data
- Access usage and engagement metrics
- Track support ticket trends
- Monitor relationship health

### Campaign Management
- Enroll accounts in campaigns
- Track campaign progress
- Measure campaign effectiveness
- Automate journey triggers

### Segment Management
- Create and manage segments
- Apply dynamic segmentation rules
- Track segment membership changes
- Use segments for targeting

## Usage

### Health Dashboard
```
Retrieve health indicators for a portfolio of accounts to identify priorities and risks.
```

### Campaign Enrollment
```
Enroll at-risk accounts in a re-engagement campaign with appropriate touchpoint sequences.
```

### Segment Analysis
```
Analyze accounts by segment to identify patterns and optimize customer journey stages.
```

## Enhances Processes

- customer-health-monitoring
- account-expansion-upsell

## Dependencies

- Totango subscription
- Integration configurations
- SuccessBLOC setup
