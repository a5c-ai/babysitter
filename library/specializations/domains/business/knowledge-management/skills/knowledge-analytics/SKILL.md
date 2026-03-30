---
name: knowledge-analytics
description: Knowledge base analytics, usage reporting, and effectiveness measurement
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: knowledge-management
  domain: business
  category: Analytics
  skill-id: SK-019
---

# Knowledge Analytics Skill

## Overview

The Knowledge Analytics skill provides comprehensive capabilities for measuring, analyzing, and reporting on knowledge management effectiveness. This skill enables organizations to understand how knowledge is being used, identify gaps, and continuously improve their knowledge management initiatives through data-driven insights.

## Capabilities

### Page View and Engagement Tracking
- Configure page view tracking and analytics
- Implement engagement metrics (time on page, scroll depth)
- Track user journeys through knowledge content
- Monitor content interaction patterns

### Search Analytics and Query Analysis
- Analyze search query patterns and trends
- Track zero-result searches and failed queries
- Monitor click-through rates on search results
- Identify search refinement patterns

### Content Effectiveness Scoring
- Design content effectiveness metrics
- Implement quality scoring algorithms
- Track content resolution rates
- Measure time-to-answer metrics

### Knowledge Gap Identification
- Analyze search gaps and unmet needs
- Identify missing content areas
- Map topic coverage and density
- Generate content recommendations

### User Journey Analysis
- Track knowledge-seeking journeys
- Identify common navigation patterns
- Analyze entry and exit points
- Measure journey completion rates

### Contribution Metrics
- Track content creation and updates
- Monitor contributor activity
- Measure review and approval cycles
- Identify top contributors

### Time-to-Knowledge Measurement
- Define and track time-to-knowledge KPIs
- Measure search-to-solution duration
- Track content discovery efficiency
- Monitor self-service resolution rates

### ROI Calculation for Knowledge Initiatives
- Design ROI measurement frameworks
- Calculate cost avoidance metrics
- Measure productivity improvements
- Track support ticket deflection

### Dashboard and Report Generation
- Build analytics dashboards
- Generate scheduled reports
- Create executive summaries
- Design self-service analytics

### Trend Analysis and Forecasting
- Analyze usage trends over time
- Forecast content demand
- Predict knowledge needs
- Track seasonal patterns

## Dependencies

- Google Analytics / GA4
- Mixpanel
- Amplitude
- Heap Analytics
- Confluence Analytics API
- SharePoint Analytics
- Custom data warehouses
- BI tools (Tableau, Power BI, Looker)

## Process Integration

This skill integrates with:

- **knowledge-base-content.js**: Content effectiveness and metrics design
- **search-optimization.js**: Search analytics and query optimization

## Usage

### Configure Analytics Tracking

```yaml
task: Set up knowledge base analytics
skill: knowledge-analytics
parameters:
  platform: google-analytics
  tracking:
    page_views: true
    engagement_time: true
    scroll_depth: true
    search_queries: true
  custom_dimensions:
    - content_type
    - topic_category
    - content_owner
```

### Generate Content Effectiveness Report

```yaml
task: Analyze content effectiveness
skill: knowledge-analytics
parameters:
  time_range: 90d
  metrics:
    - views
    - unique_visitors
    - avg_time_on_page
    - bounce_rate
    - helpful_votes
  segmentation: content_type
  output: content-effectiveness-report.pdf
```

### Search Analytics Analysis

```yaml
task: Analyze search performance
skill: knowledge-analytics
parameters:
  data_source: search-logs
  analysis:
    - zero_result_queries
    - low_click_queries
    - refinement_patterns
    - popular_queries
  time_range: 30d
  recommendations: true
```

### Knowledge Gap Analysis

```yaml
task: Identify knowledge gaps
skill: knowledge-analytics
parameters:
  sources:
    - search_logs
    - support_tickets
    - user_feedback
  gap_types:
    - missing_content
    - outdated_content
    - low_quality_content
  output: gap-analysis-report.md
```

### ROI Calculation

```yaml
task: Calculate knowledge management ROI
skill: knowledge-analytics
parameters:
  metrics:
    - ticket_deflection
    - time_saved
    - cost_avoidance
    - productivity_gain
  baseline_period: previous_year
  cost_inputs:
    avg_support_ticket_cost: 50
    avg_employee_hourly_rate: 75
```

## Key Performance Indicators (KPIs)

### Usage KPIs

| KPI | Description | Benchmark |
|-----|-------------|-----------|
| Monthly Active Users | Unique users accessing KB | Growth > 5% MoM |
| Page Views per Session | Average pages viewed | > 2.5 |
| Search Usage Rate | % users using search | > 60% |
| Return Visitor Rate | % returning users | > 40% |

### Content KPIs

| KPI | Description | Benchmark |
|-----|-------------|-----------|
| Content Freshness | % content updated in 90d | > 30% |
| Content Coverage | Topics with content | > 85% |
| Helpful Rating | % positive feedback | > 80% |
| Time to Resolution | Avg time to find answer | < 3 min |

### Search KPIs

| KPI | Description | Benchmark |
|-----|-------------|-----------|
| Zero-Result Rate | % searches with no results | < 5% |
| Search Success Rate | % searches leading to click | > 70% |
| Refinement Rate | % queries requiring refinement | < 20% |
| Top-3 Click Rate | % clicking top 3 results | > 60% |

### Business Impact KPIs

| KPI | Description | Benchmark |
|-----|-------------|-----------|
| Ticket Deflection Rate | % tickets avoided | > 20% |
| Self-Service Rate | % issues resolved via KB | > 50% |
| Onboarding Time Reduction | Time saved in onboarding | > 30% |
| Knowledge Reuse Rate | % content reused | > 40% |

## Dashboard Templates

### Executive Dashboard
- Total users and growth trends
- Top content and topics
- Search effectiveness summary
- Business impact metrics
- ROI summary

### Content Owner Dashboard
- Content performance metrics
- Update recommendations
- Gap analysis for owned content
- Comparison to similar content

### Search Analytics Dashboard
- Query volume and trends
- Zero-result analysis
- Click-through patterns
- Suggested query improvements

## Best Practices

1. **Define clear objectives** - Align metrics with business goals
2. **Establish baselines** - Measure current state before improvements
3. **Segment data** - Analyze by user role, content type, and topic
4. **Combine quantitative and qualitative** - Use surveys alongside analytics
5. **Automate reporting** - Schedule regular reports for stakeholders
6. **Act on insights** - Create feedback loops for continuous improvement
7. **Respect privacy** - Aggregate data and anonymize where needed
8. **Track trends** - Focus on trends rather than absolute numbers

## Related Skills

- **search-engine** (SK-005): Search analytics integration
- **content-curation** (SK-010): Content quality metrics
- **confluence-km** (SK-001): Platform-specific analytics

## Related Agents

- **knowledge-analyst** (AG-010): Analytics interpretation and recommendations
- **knowledge-architect** (AG-001): Strategic alignment of metrics
- **km-content-strategist** (AG-005): Content performance optimization
