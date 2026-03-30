---
name: stakeholder-preference-elicitor
description: Stakeholder preference elicitation skill for structured value and weight gathering
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: decision-intelligence
  domain: business
  category: collaboration
  priority: medium
  tools-libraries:
    - custom forms
    - pandas
    - statistical aggregation
---

# Stakeholder Preference Elicitor

## Overview

The Stakeholder Preference Elicitor skill provides structured methods for gathering value judgments and weights from decision stakeholders. It supports multiple elicitation techniques, consistency checking, and preference aggregation for group decisions.

## Capabilities

- Swing weight elicitation
- Direct rating collection
- Trade-off questioning
- Consistency checking
- Preference aggregation
- Disagreement identification
- Facilitation guidance
- Preference documentation

## Used By Processes

- Multi-Criteria Decision Analysis (MCDA)
- Structured Decision Making Process
- KPI Framework Development

## Usage

### Elicitation Session Setup

```python
# Configure elicitation session
session_config = {
    "decision": "Enterprise Software Selection",
    "criteria": [
        {"name": "Total Cost of Ownership", "unit": "USD", "direction": "minimize"},
        {"name": "Implementation Time", "unit": "months", "direction": "minimize"},
        {"name": "Functionality Fit", "unit": "percent", "direction": "maximize"},
        {"name": "Vendor Stability", "unit": "score", "direction": "maximize"},
        {"name": "Integration Capability", "unit": "score", "direction": "maximize"}
    ],
    "stakeholders": [
        {"id": "S1", "name": "CIO", "role": "Decision Maker", "weight": 0.3},
        {"id": "S2", "name": "CFO", "role": "Decision Maker", "weight": 0.3},
        {"id": "S3", "name": "IT Director", "role": "Technical Expert", "weight": 0.2},
        {"id": "S4", "name": "Business Lead", "role": "User Representative", "weight": 0.2}
    ],
    "elicitation_method": "swing_weights"
}
```

### Swing Weight Elicitation

```python
# Swing weight process
swing_weight_protocol = {
    "step_1_ranges": {
        "description": "Define worst and best levels for each criterion",
        "ranges": {
            "Total Cost of Ownership": {"worst": 2000000, "best": 500000},
            "Implementation Time": {"worst": 24, "best": 6},
            "Functionality Fit": {"worst": 60, "best": 95},
            "Vendor Stability": {"worst": 3, "best": 9},
            "Integration Capability": {"worst": 2, "best": 10}
        }
    },
    "step_2_reference": {
        "description": "Imagine all criteria at worst level. Which would you most want to swing to best?",
        "responses": {
            "S1": "Functionality Fit",
            "S2": "Total Cost of Ownership",
            "S3": "Integration Capability",
            "S4": "Functionality Fit"
        }
    },
    "step_3_relative_weights": {
        "description": "If most important swing = 100, rate the value of other swings",
        "responses": {
            "S1": {
                "Functionality Fit": 100,
                "Total Cost of Ownership": 80,
                "Integration Capability": 60,
                "Implementation Time": 40,
                "Vendor Stability": 30
            }
            # ... other stakeholders
        }
    }
}
```

### Trade-off Questions

```python
# Trade-off elicitation
tradeoff_questions = {
    "format": "matching",
    "questions": [
        {
            "id": "TQ1",
            "question": "You can have software with 95% functionality fit. How much extra cost would you accept to maintain this level vs. 75% fit?",
            "criteria_pair": ["Functionality Fit", "Total Cost of Ownership"],
            "anchors": {"Functionality Fit": {"from": 75, "to": 95}}
        },
        {
            "id": "TQ2",
            "question": "Implementation in 6 months vs 12 months: how much more would you pay for the faster option?",
            "criteria_pair": ["Implementation Time", "Total Cost of Ownership"],
            "anchors": {"Implementation Time": {"from": 12, "to": 6}}
        }
    ]
}
```

### Consistency Check

```python
# Check for consistency
consistency_check = {
    "method": "transitivity",
    "checks": [
        {
            "stakeholder": "S1",
            "issue": "weight_inconsistency",
            "details": "Cost weight (80) + Fit weight (100) implies Cost > Time, but trade-off suggests otherwise",
            "severity": "warning",
            "recommendation": "Revisit cost vs. time comparison"
        }
    ],
    "overall_consistency": 0.85
}
```

### Group Aggregation

```python
# Aggregate preferences
aggregation_config = {
    "method": "weighted_geometric_mean",
    "stakeholder_weights": {"S1": 0.3, "S2": 0.3, "S3": 0.2, "S4": 0.2},
    "individual_weights": {
        "S1": {"TCO": 0.26, "Time": 0.13, "Fit": 0.32, "Stability": 0.10, "Integration": 0.19},
        "S2": {"TCO": 0.35, "Time": 0.15, "Fit": 0.25, "Stability": 0.15, "Integration": 0.10},
        # ... etc.
    },
    "aggregated_weights": {
        "TCO": 0.29,
        "Time": 0.14,
        "Fit": 0.28,
        "Stability": 0.12,
        "Integration": 0.17
    },
    "disagreement_metrics": {
        "highest_variance_criterion": "Total Cost of Ownership",
        "coefficient_of_variation": 0.15
    }
}
```

## Input Schema

```json
{
  "session_config": {
    "decision": "string",
    "criteria": ["object"],
    "stakeholders": ["object"],
    "method": "string"
  },
  "elicitation_data": {
    "method": "swing|direct|tradeoff|pairwise",
    "responses": "object"
  },
  "aggregation_config": {
    "method": "geometric_mean|arithmetic_mean|majority",
    "stakeholder_weights": "object"
  }
}
```

## Output Schema

```json
{
  "individual_weights": {
    "stakeholder_id": {
      "criterion": "number"
    }
  },
  "aggregated_weights": {
    "criterion": "number"
  },
  "consistency": {
    "individual_scores": "object",
    "issues": ["object"]
  },
  "disagreement_analysis": {
    "high_variance_criteria": ["string"],
    "stakeholder_clusters": "object",
    "discussion_points": ["string"]
  },
  "documentation": {
    "methodology": "string",
    "assumptions": ["string"],
    "limitations": ["string"]
  }
}
```

## Elicitation Methods

| Method | Best For | Complexity |
|--------|----------|------------|
| Swing Weights | Trading off criteria | Medium |
| Direct Rating | Quick assessment | Low |
| Pairwise Comparison | Systematic comparison | High |
| Trade-off | Understanding value | Medium |
| Point Allocation | Intuitive weights | Low |

## Best Practices

1. Explain criteria clearly before elicitation
2. Use concrete examples and scenarios
3. Check for consistency and discuss discrepancies
4. Allow stakeholders to revise after seeing group results
5. Document reasoning, not just numbers
6. Consider cognitive biases (anchoring, order effects)
7. Use multiple methods for important decisions

## Common Biases

| Bias | Description | Mitigation |
|------|-------------|------------|
| Anchoring | Over-reliance on first information | Randomize order |
| Availability | Weight by memorable events | Use structured data |
| Overconfidence | Narrow probability ranges | Calibration training |
| Order Effects | Influenced by question sequence | Vary order across stakeholders |

## Integration Points

- Feeds into AHP Calculator for weight processing
- Connects with MCDA Facilitator agent
- Supports Consistency Validator for quality checks
- Integrates with Decision Documentation for audit trail
