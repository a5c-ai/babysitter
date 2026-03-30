---
name: startup-metrics
description: Build startup metrics dashboards with key KPIs
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
metadata:
  specialization: entrepreneurship
  domain: business
  category: Analytics
  skill-id: SK-018
---

# Startup Metrics Dashboard Skill

## Overview

The Startup Metrics Dashboard skill provides comprehensive capabilities for building and maintaining startup metrics dashboards with key KPIs. It enables startups to track critical performance indicators, generate investor-ready reports, and make data-driven decisions using established frameworks like AARRR (Pirate Metrics) and North Star metrics.

## Capabilities

### Core Functions
- **AARRR Pirate Metrics**: Calculate and track Acquisition, Activation, Retention, Referral, Revenue metrics
- **North Star Tracking**: Define and track North Star metrics and supporting indicators
- **MRR/ARR Dashboards**: Generate Monthly and Annual Recurring Revenue dashboards
- **Growth Rate Calculation**: Calculate and visualize growth rates (WoW, MoM, YoY)
- **Runway and Burn Tracking**: Track burn rate, runway, and cash position
- **Cohort Visualizations**: Create cohort retention and revenue visualizations
- **Investor Reports**: Generate investor-ready metrics reports
- **Threshold Alerts**: Set up and manage metric threshold alerts

### Advanced Features
- Predictive metrics modeling
- Benchmark comparisons by stage and sector
- Metric correlation analysis
- Leading vs lagging indicator tracking
- Scenario modeling for metrics
- Custom metric definitions
- Data source integrations
- Historical trend analysis

## Usage

### Input Requirements
- Business model type (SaaS, marketplace, etc.)
- Stage and funding status
- Available data sources
- Key business questions
- Reporting frequency
- Stakeholder requirements

### Output Deliverables
- Configured metrics dashboard
- North Star metric definition
- AARRR funnel visualization
- MRR/ARR tracking charts
- Cohort analysis tables
- Runway projections
- Investor-ready reports
- Alert configurations

### Process Integration
This skill integrates with the following processes:
- `financial-model-development.js` - Financial metrics integration
- `product-market-fit-assessment.js` - PMF metrics tracking
- `investor-update-communication.js` - Metrics reporting
- `growth-experiment-design.js` - Experiment metrics

### Example Invocation
```
Skill: startup-metrics
Context: B2B SaaS startup Series A metrics dashboard
Input:
  - Model: B2B SaaS, monthly subscriptions
  - Stage: Series A
  - Data Sources: Stripe, Mixpanel, HubSpot
  - North Star Candidate: Weekly Active Teams
Output:
  - Dashboard configuration
  - Metrics definitions:
    - MRR, ARR, growth rate
    - CAC, LTV, LTV:CAC ratio
    - Churn (logo and revenue)
    - NRR, GRR
    - Activation rate
    - Time to value
  - Cohort retention charts
  - 18-month runway projection
  - Weekly metrics email template
```

## Dependencies

- Analytics platform integrations
- Visualization libraries
- Financial data connections
- Alerting systems
- Report generation tools

## Best Practices

1. Define a clear North Star metric that aligns with business value
2. Track both leading indicators (predict future) and lagging indicators (confirm past)
3. Use cohort analysis to understand true retention patterns
4. Segment metrics by customer type, plan, or acquisition channel
5. Compare metrics to stage-appropriate benchmarks
6. Update dashboards in real-time or at minimum weekly
7. Make metrics accessible to the whole team
8. Focus on trends, not single data points
9. Document metric definitions to ensure consistency
10. Regularly review and retire metrics that don't drive decisions
11. Prepare investor-ready metrics views in advance
12. Track both absolute values and growth rates
