---
name: decision-journal
description: Decision documentation and learning skill for capturing decision context, rationale, and outcomes
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: decision-intelligence
  domain: business
  category: knowledge-management
  priority: high
  tools-libraries:
    - markdown
    - sqlite
    - pandas
    - jinja2
---

# Decision Journal

## Overview

The Decision Journal skill provides systematic capabilities for documenting decisions, tracking outcomes, and extracting organizational learning. It creates a searchable archive of decision context, rationale, and results to improve future decision-making and build institutional knowledge.

## Capabilities

- Decision record creation (date, context, options, choice, rationale)
- Outcome tracking and hindsight analysis
- Decision pattern identification
- Calibration tracking over time
- Searchable decision archive
- Lessons learned extraction
- Decision audit trail
- Report generation

## Used By Processes

- Decision Documentation and Learning
- Cognitive Bias Debiasing Process
- Decision Quality Assessment

## Usage

### Decision Record

```python
# Create decision record
decision_record = {
    "metadata": {
        "id": "DEC-2024-0042",
        "title": "Market Expansion into Southeast Asia",
        "date": "2024-01-15",
        "decision_maker": "Executive Committee",
        "stakeholders": ["CEO", "CFO", "VP International", "Regional Directors"],
        "category": "Strategic",
        "tags": ["expansion", "international", "growth"]
    },
    "context": {
        "situation": "Company has saturated domestic market with 35% share. Growth targets require new markets.",
        "time_horizon": "5 years",
        "constraints": ["$50M investment cap", "Must leverage existing product line", "Partner preference over greenfield"],
        "urgency": "Medium - 12-month window before competitor moves"
    },
    "options_considered": [
        {
            "name": "Enter Vietnam first",
            "pros": ["Fastest growing economy", "Favorable demographics", "Existing distributor relationship"],
            "cons": ["Regulatory complexity", "IP protection concerns"],
            "expected_outcomes": {"NPV": 25000000, "probability_success": 0.65}
        },
        {
            "name": "Enter Singapore as hub",
            "pros": ["Strong IP protection", "Gateway to ASEAN", "Talent availability"],
            "cons": ["Higher costs", "Smaller direct market"],
            "expected_outcomes": {"NPV": 18000000, "probability_success": 0.80}
        },
        {
            "name": "Defer 1 year",
            "pros": ["More market intelligence", "Economic uncertainty resolution"],
            "cons": ["Competitor advantage", "Momentum loss"],
            "expected_outcomes": {"NPV": 15000000, "probability_success": 0.75}
        }
    ],
    "decision": {
        "choice": "Enter Singapore as hub",
        "rationale": "Higher probability of success outweighs NPV difference. Hub strategy enables sequential expansion with lower risk.",
        "key_assumptions": [
            "Singapore cost structure remains competitive",
            "ASEAN trade agreements stable",
            "Partner availability in year 2-3"
        ],
        "dissenting_views": ["CFO preferred Vietnam for higher NPV potential"]
    },
    "implementation": {
        "key_milestones": [
            {"date": "2024-Q2", "milestone": "Entity established"},
            {"date": "2024-Q4", "milestone": "First local hire"},
            {"date": "2025-Q2", "milestone": "First revenue"}
        ],
        "success_metrics": ["Revenue", "Market share", "Partner pipeline"],
        "review_dates": ["2024-07-15", "2025-01-15", "2025-07-15"]
    }
}
```

### Outcome Tracking

```python
# Record outcome
outcome_record = {
    "decision_id": "DEC-2024-0042",
    "review_date": "2025-01-15",
    "actual_outcomes": {
        "milestones_met": 2,
        "milestones_total": 3,
        "revenue": 2500000,
        "market_share": 0.02,
        "unexpected_events": ["COVID variant impact Q3", "Key competitor exited"]
    },
    "assessment": {
        "outcome_vs_expected": "Better than expected",
        "decision_quality_vs_outcome": "Good decision, good outcome",
        "key_learnings": [
            "Hub strategy provided flexibility during disruption",
            "Underestimated talent availability"
        ],
        "would_decide_differently": False,
        "process_improvements": ["Include pandemic scenarios in future expansion decisions"]
    }
}
```

### Pattern Analysis

```python
# Query patterns
pattern_query = {
    "analysis_type": "calibration",
    "filters": {
        "category": "Strategic",
        "date_range": ["2022-01-01", "2024-12-31"],
        "decision_maker": "Executive Committee"
    },
    "metrics": [
        "probability_calibration",
        "npv_accuracy",
        "timeline_accuracy",
        "success_rate_by_category"
    ]
}
```

## Input Schema

```json
{
  "operation": "create|update|outcome|query|report",
  "decision_record": {
    "metadata": "object",
    "context": "object",
    "options_considered": ["object"],
    "decision": "object",
    "implementation": "object"
  },
  "outcome_record": {
    "decision_id": "string",
    "actual_outcomes": "object",
    "assessment": "object"
  },
  "query": {
    "filters": "object",
    "analysis_type": "string"
  }
}
```

## Output Schema

```json
{
  "decision_record": {
    "id": "string",
    "created": "string",
    "status": "string"
  },
  "query_results": {
    "decisions": ["object"],
    "patterns": {
      "calibration": {
        "overconfidence_rate": "number",
        "npv_bias": "number",
        "timeline_bias": "number"
      },
      "success_factors": ["string"],
      "common_mistakes": ["string"]
    }
  },
  "report_path": "string"
}
```

## Decision Quality Framework

The skill supports the 6-element DQ framework:
1. **Appropriate Frame**: Problem defined correctly?
2. **Creative Alternatives**: Good options generated?
3. **Meaningful Information**: Relevant data gathered?
4. **Clear Values**: Objectives articulated?
5. **Sound Reasoning**: Logic applied correctly?
6. **Commitment to Action**: Resources allocated?

## Best Practices

1. Record decisions at the time they're made (not retrospectively)
2. Document dissenting views and rejected options
3. Be explicit about assumptions and uncertainties
4. Separate decision quality from outcome quality
5. Review outcomes systematically on schedule
6. Extract lessons without hindsight bias
7. Share learnings across the organization

## Integration Points

- Feeds into Decision Quality Assessor agent
- Connects with Hypothesis Tracker for hypothesis outcomes
- Supports Decision Archivist agent
- Integrates with Calibration Trainer for accuracy improvement
