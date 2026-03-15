---
name: hypothesis-tracker
description: Hypothesis management skill for tracking business hypotheses through testing and validation
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
    - pandas
    - sqlite
    - markdown
    - jinja2
---

# Hypothesis Tracker

## Overview

The Hypothesis Tracker skill provides systematic capabilities for formulating, testing, and validating business hypotheses. It supports the scientific approach to business decisions by managing hypotheses through their lifecycle from formulation to resolution.

## Capabilities

- Hypothesis formulation assistance
- Test design specification
- Evidence collection and linking
- Confidence level tracking
- Hypothesis status management
- Invalidation criteria definition
- Learning documentation
- Hypothesis dashboard

## Used By Processes

- Hypothesis-Driven Analytics Process
- A/B Testing and Experimentation Framework
- Decision Documentation and Learning

## Usage

### Hypothesis Formulation

```python
# Create hypothesis
hypothesis = {
    "id": "HYP-2024-001",
    "title": "Price Elasticity Hypothesis",
    "statement": "A 10% price reduction will increase unit sales by more than 15%, resulting in higher total revenue",
    "context": {
        "business_question": "Should we reduce prices to grow market share?",
        "decision_at_stake": "Q2 pricing strategy",
        "stakeholders": ["VP Sales", "CFO", "Product Manager"]
    },
    "structure": {
        "independent_variable": "Price",
        "dependent_variable": "Unit sales, Total revenue",
        "mechanism": "Price elasticity of demand > 1.5",
        "conditions": "In current market conditions, for existing product line"
    },
    "created_by": "Product Manager",
    "created_date": "2024-01-15",
    "status": "Testing",
    "priority": "High"
}
```

### Falsification Criteria

```python
# Define what would disprove the hypothesis
falsification_criteria = {
    "hypothesis_id": "HYP-2024-001",
    "criteria": [
        {
            "type": "primary",
            "criterion": "Unit sales increase < 15% following 10% price reduction",
            "measurement": "Compare 30-day sales before/after price change",
            "threshold": 0.15
        },
        {
            "type": "secondary",
            "criterion": "Total revenue decreases despite volume increase",
            "measurement": "Revenue comparison pre/post",
            "threshold": 0
        },
        {
            "type": "validity_check",
            "criterion": "No confounding events (competitor action, seasonality)",
            "measurement": "Market monitoring, historical comparison"
        }
    ],
    "minimum_evidence": "Primary criterion must be tested with n>1000 transactions"
}
```

### Test Design

```python
# Define test approach
test_design = {
    "hypothesis_id": "HYP-2024-001",
    "test_type": "A/B Test",
    "design": {
        "control_group": "Existing price ($100)",
        "treatment_group": "Reduced price ($90)",
        "sample_size": {"control": 5000, "treatment": 5000},
        "duration": "30 days",
        "randomization": "Customer ID hash",
        "primary_metric": "Units sold",
        "secondary_metrics": ["Revenue", "Margin", "Customer acquisition"]
    },
    "statistical_plan": {
        "significance_level": 0.05,
        "power": 0.80,
        "minimum_detectable_effect": 0.12,
        "analysis_method": "Two-sample t-test"
    },
    "timeline": {
        "start_date": "2024-02-01",
        "end_date": "2024-03-02",
        "analysis_date": "2024-03-05"
    }
}
```

### Evidence Collection

```python
# Record evidence
evidence = {
    "hypothesis_id": "HYP-2024-001",
    "evidence_items": [
        {
            "id": "EV-001",
            "date": "2024-03-05",
            "type": "experiment_result",
            "source": "A/B Test Analysis",
            "finding": "Treatment group showed 18.2% increase in unit sales",
            "confidence_interval": [0.142, 0.222],
            "p_value": 0.001,
            "supports_hypothesis": True,
            "strength": "strong"
        },
        {
            "id": "EV-002",
            "date": "2024-03-05",
            "type": "experiment_result",
            "source": "A/B Test Analysis",
            "finding": "Total revenue increased 6.4% despite 10% price cut",
            "confidence_interval": [0.031, 0.097],
            "p_value": 0.02,
            "supports_hypothesis": True,
            "strength": "moderate"
        },
        {
            "id": "EV-003",
            "date": "2024-02-20",
            "type": "market_observation",
            "source": "Competitive Intelligence",
            "finding": "No competitor pricing changes during test period",
            "supports_hypothesis": True,
            "strength": "supporting_context"
        }
    ]
}
```

### Hypothesis Resolution

```python
# Resolve hypothesis
resolution = {
    "hypothesis_id": "HYP-2024-001",
    "resolution_date": "2024-03-10",
    "outcome": "Validated",
    "confidence": 0.95,
    "summary": "Hypothesis supported by A/B test results. 18.2% volume increase exceeded 15% threshold, revenue increased 6.4%.",
    "decision_recommendation": "Proceed with price reduction for full product line",
    "caveats": [
        "Results based on 30-day period, long-term effects unknown",
        "Test conducted in stable market, may not hold in competitive response"
    ],
    "learnings": [
        "Price elasticity approximately 1.8 for this product category",
        "Customer acquisition improved 12%, suggesting value perception impact"
    ],
    "follow_up_hypotheses": [
        "HYP-2024-002: Price reduction effect sustained over 6 months",
        "HYP-2024-003: Similar elasticity exists in adjacent product lines"
    ]
}
```

## Input Schema

```json
{
  "operation": "create|update|evidence|resolve|report",
  "hypothesis": {
    "title": "string",
    "statement": "string",
    "context": "object",
    "structure": "object"
  },
  "falsification_criteria": ["object"],
  "test_design": "object",
  "evidence": ["object"],
  "resolution": "object"
}
```

## Output Schema

```json
{
  "hypothesis": {
    "id": "string",
    "status": "string",
    "confidence": "number"
  },
  "evidence_summary": {
    "supporting": "number",
    "contradicting": "number",
    "neutral": "number"
  },
  "dashboard": {
    "active_hypotheses": "number",
    "pending_tests": "number",
    "validated_this_quarter": "number",
    "invalidated_this_quarter": "number"
  },
  "learnings": ["string"]
}
```

## Hypothesis Status Lifecycle

| Status | Description |
|--------|-------------|
| Draft | Being formulated |
| Ready | Falsification criteria defined |
| Testing | Active test in progress |
| Analyzing | Test complete, analyzing results |
| Validated | Evidence supports hypothesis |
| Invalidated | Evidence contradicts hypothesis |
| Inconclusive | Insufficient evidence either way |
| Archived | No longer relevant |

## Best Practices

1. Make hypotheses specific and testable
2. Define falsification criteria upfront
3. Distinguish correlation from causation
4. Document negative results - they're valuable
5. Link hypotheses to decisions they inform
6. Build on validated hypotheses with follow-ups
7. Review hypothesis portfolio regularly

## Integration Points

- Feeds into Experimentation Manager agent
- Connects with Causal Inference Engine for analysis
- Supports Decision Journal for knowledge capture
- Integrates with Decision Archivist for learning
