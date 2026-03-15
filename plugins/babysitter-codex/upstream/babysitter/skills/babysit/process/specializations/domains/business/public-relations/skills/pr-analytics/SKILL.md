---
name: pr-analytics
description: PR measurement and reporting automation following Barcelona Principles with comprehensive analytics and visualization capabilities
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: public-relations
  domain: business
  category: Measurement and Analytics
  skill-id: SK-009
---

# PR Analytics and Reporting Skill

## Overview

The PR Analytics and Reporting skill provides comprehensive measurement and reporting automation following Barcelona Principles 3.0 and the AMEC Integrated Evaluation Framework. This skill enables PR professionals to calculate, visualize, and report on PR metrics with industry-standard methodologies.

## Capabilities

### AMEC Framework Implementation
- Full AMEC Integrated Evaluation Framework implementation
- Input-Activity-Output-Outtake-Outcome-Impact measurement chain
- Standardized metric definitions and calculations
- Framework alignment documentation

### Barcelona Principles 3.0 Metrics
- Goal-setting and measurement alignment
- Measuring communication outcomes (not just outputs)
- Quantitative and qualitative analysis integration
- Organizational performance impact measurement
- AVE deprecation and alternative metrics guidance

### Media Quality Analysis
- Media quality score calculation algorithms
- Outlet tier weighting systems
- Message pull-through analysis
- Tone and sentiment scoring
- Spokesperson presence tracking
- Visual media evaluation

### Share of Voice Reporting
- Competitive share of voice calculation
- Industry benchmark comparisons
- Trend analysis over time
- Volume vs. quality SOV metrics
- Topic-specific SOV breakdown

### Sentiment Analysis
- Multi-tier sentiment classification
- Sentiment trend visualization
- Entity-level sentiment extraction
- Context-aware sentiment scoring
- Cross-platform sentiment aggregation

### Dashboard and Visualization
- Tableau integration for data visualization
- Power BI dashboard templates
- Executive summary report generation
- Real-time metrics dashboards
- Custom KPI tracking interfaces

### Automated Reporting
- Scheduled report generation
- Multi-stakeholder report variants
- Automated insight extraction
- Trend alerts and notifications
- Historical comparison reporting

## Integration Points

### Process Integration
- pr-measurement-framework.js - All phases
- media-coverage-analysis.js - All phases
- reputation-monitoring.js - Metrics phases
- marketing-performance-dashboard.js - PR sections

### Skill Dependencies
- SK-001: Media Monitoring (data source)
- SK-002: Social Listening (social metrics)
- SK-006: Reputation Intelligence (reputation data)

### Agent Integration
- AG-010: PR Measurement Analyst (primary)
- AG-001: Media Relations Strategist (strategic context)

## Usage

### Basic Metric Calculation
```
Invoke pr-analytics skill to:
1. Calculate media quality scores for recent coverage
2. Generate share of voice report vs. competitors
3. Produce sentiment trend analysis for the quarter
```

### Dashboard Generation
```
Invoke pr-analytics skill to:
1. Configure executive PR dashboard
2. Set up automated weekly reporting
3. Create campaign-specific measurement views
```

### Framework Application
```
Invoke pr-analytics skill to:
1. Align metrics to Barcelona Principles 3.0
2. Implement AMEC framework for new campaign
3. Develop measurement methodology documentation
```

## Configuration

### Required Integrations
- BI platform APIs (Tableau, Power BI)
- Media monitoring data exports
- Social listening data feeds
- CRM/marketing automation data

### Optional Integrations
- Google Analytics
- Adobe Analytics
- Salesforce reporting
- Custom data warehouses

## Output Formats

- Executive PDF reports
- Interactive dashboards
- Data exports (CSV, Excel)
- API data feeds
- Presentation-ready visualizations

## Best Practices

1. Always align metrics to business objectives
2. Use Barcelona Principles as the foundation
3. Combine quantitative and qualitative measures
4. Provide context and benchmarks with all metrics
5. Document methodology for transparency
6. Automate routine reporting to focus on insights
7. Customize reports for different stakeholder needs

---

**Version**: 1.0.0
**Created**: 2026-01-24
**Status**: Active
