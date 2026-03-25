---
name: xactly-compensation
description: Xactly incentive compensation management for sales performance
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
    - Xactly API
---

# Xactly Compensation

## Overview

The Xactly Compensation skill provides integration with Xactly's incentive compensation management platform for commission calculation, plan modeling, quota attainment tracking, and sales performance management analytics. This skill ensures accurate, transparent compensation administration.

## Capabilities

### Commission Calculation
- Calculate commissions based on plan rules
- Handle complex crediting scenarios
- Process accelerators and bonuses
- Manage draws and adjustments

### Plan Modeling
- Model compensation plan scenarios
- Simulate plan changes impact
- Compare plan alternatives
- Optimize plan design

### Quota Attainment Tracking
- Track individual and team attainment
- Monitor progress against targets
- Calculate payout projections
- Identify attainment risks

### SPM Analytics
- Access performance analytics dashboards
- Track key performance indicators
- Benchmark against historical data
- Generate compensation reports

## Usage

### Compensation Calculation
```
Calculate commission earnings for a sales rep based on closed deals and plan rules.
```

### Plan Modeling
```
Model the impact of a proposed plan change on rep earnings and company costs.
```

### Attainment Review
```
Review quota attainment across the team and identify reps at risk of missing target.
```

## Enhances Processes

- compensation-plan-design
- quota-setting-allocation
- territory-design-assignment

## Dependencies

- Xactly subscription
- Compensation plan configuration
- CRM integration for deal data
