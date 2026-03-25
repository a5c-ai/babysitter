---
name: qbr-preparation-assistant
description: Quarterly Business Review preparation and facilitation skill with agenda and materials generation
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: supplier-management
  priority: standard
---

# QBR Preparation Assistant

## Overview

The QBR Preparation Assistant streamlines Quarterly Business Review preparation and facilitation. It automates agenda generation, compiles performance summaries, creates trend visualizations, and tracks follow-up actions to ensure productive supplier review meetings.

## Capabilities

- **QBR Agenda Generation**: Structured meeting agenda creation
- **Performance Summary Compilation**: Automated scorecard and metrics aggregation
- **Trend Analysis Visualization**: Performance charts and graphs
- **Issue and Action Log Aggregation**: Outstanding item compilation
- **Innovation Pipeline Tracking**: Joint innovation initiative status
- **Forecast Alignment Review**: Demand-supply alignment assessment
- **Discussion Guide Creation**: Talking points and key questions
- **Follow-Up Action Tracking**: Action item assignment and monitoring

## Input Schema

```yaml
qbr_preparation_request:
  supplier_id: string
  review_period:
    quarter: string
    year: integer
  performance_data:
    scorecards: array
    kpi_history: object
    issues_log: array
    action_items: array
  strategic_topics: array
  innovation_updates: array
  forecast_data: object
  attendees: array
  meeting_date: date
```

## Output Schema

```yaml
qbr_preparation_output:
  agenda:
    meeting_details: object
    sections: array
      - topic: string
        duration: integer
        presenter: string
        materials: array
  performance_summary:
    executive_summary: string
    scorecard_summary: object
    trend_analysis: object
    key_achievements: array
    areas_of_concern: array
  issue_log:
    open_items: array
    closed_items: array
    escalations: array
  innovation_status:
    active_initiatives: array
    pipeline: array
    completed: array
  discussion_guide:
    key_questions: array
    talking_points: array
    decision_items: array
  action_tracker:
    previous_actions: array
    new_actions: array
  presentation_deck: object
```

## Usage

### QBR Package Generation

```
Input: Supplier ID, Q4 2025 performance data
Process: Compile metrics, trends, issues, innovations
Output: Complete QBR package with presentation and materials
```

### Performance Trend Analysis

```
Input: 4 quarters of scorecard data
Process: Visualize trends, identify patterns
Output: Trend charts with commentary
```

### Action Item Follow-Up

```
Input: Previous QBR action items
Process: Track status, compile updates
Output: Action item status report with accountability
```

## Integration Points

- **Supplier Management Systems**: Scorecard and performance data
- **Project Management**: Action item tracking
- **Presentation Tools**: Slide deck generation
- **Tools/Libraries**: Data visualization, document templates

## Process Dependencies

- Quarterly Business Review (QBR) Facilitation
- Supplier Performance Scorecard
- Supplier Development Program

## Best Practices

1. Begin preparation 2 weeks before QBR date
2. Validate performance data with supplier before meeting
3. Focus on forward-looking discussion, not just review
4. Ensure appropriate executive participation
5. Distribute pre-read materials in advance
6. Follow up on action items within 48 hours
