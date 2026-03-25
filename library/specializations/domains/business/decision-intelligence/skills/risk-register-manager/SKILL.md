---
name: risk-register-manager
description: Risk register management skill for systematic risk identification, assessment, and tracking
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: decision-intelligence
  domain: business
  category: risk
  priority: medium
  tools-libraries:
    - pandas
    - numpy
    - jinja2
---

# Risk Register Manager

## Overview

The Risk Register Manager skill provides comprehensive capabilities for systematic risk identification, assessment, mitigation planning, and ongoing tracking. It supports the full risk management lifecycle from initial identification through monitoring and closure.

## Capabilities

- Risk identification and categorization
- Probability and impact scoring
- Risk matrix generation
- Risk prioritization (P*I ranking)
- Mitigation strategy tracking
- Residual risk calculation
- Risk trend analysis
- Risk report generation

## Used By Processes

- Decision Quality Assessment
- Monte Carlo Simulation for Decision Support
- Strategic Scenario Development

## Usage

### Risk Identification

```python
# Define a risk
risk_entry = {
    "id": "RISK-001",
    "title": "Key Supplier Bankruptcy",
    "description": "Primary component supplier faces financial difficulties, risking supply continuity",
    "category": "Supply Chain",
    "subcategory": "Supplier Risk",
    "identified_by": "Procurement Manager",
    "identification_date": "2024-01-15",
    "status": "Open",
    "triggers": [
        "Supplier credit rating downgrade",
        "Delayed deliveries > 2 weeks",
        "News of financial restructuring"
    ],
    "affected_objectives": ["Production Continuity", "Cost Control"]
}
```

### Risk Assessment

```python
# Assess risk
risk_assessment = {
    "risk_id": "RISK-001",
    "probability": {
        "score": 3,  # 1-5 scale
        "rationale": "Supplier shows signs of financial stress; industry downturn",
        "confidence": "medium"
    },
    "impact": {
        "financial": {"score": 4, "estimate": 2500000},
        "schedule": {"score": 3, "estimate_days": 45},
        "reputation": {"score": 2},
        "overall": 4
    },
    "risk_score": 12,  # P x I
    "risk_level": "High",
    "velocity": "Medium",  # How quickly it could materialize
    "assessment_date": "2024-01-20"
}
```

### Mitigation Planning

```python
# Define mitigation strategies
mitigation_plan = {
    "risk_id": "RISK-001",
    "response_strategy": "Mitigate",  # Accept, Mitigate, Transfer, Avoid
    "actions": [
        {
            "id": "MIT-001-A",
            "description": "Qualify secondary supplier",
            "owner": "Procurement Director",
            "due_date": "2024-03-01",
            "status": "In Progress",
            "cost": 50000,
            "effectiveness": 0.6  # Expected risk reduction
        },
        {
            "id": "MIT-001-B",
            "description": "Increase safety stock to 8 weeks",
            "owner": "Supply Chain Manager",
            "due_date": "2024-02-15",
            "status": "Not Started",
            "cost": 200000,
            "effectiveness": 0.3
        }
    ],
    "residual_probability": 2,
    "residual_impact": 3,
    "residual_score": 6
}
```

### Risk Matrix Configuration

```python
# Configure risk matrix
matrix_config = {
    "probability_scale": {
        1: {"label": "Rare", "range": "< 10%"},
        2: {"label": "Unlikely", "range": "10-25%"},
        3: {"label": "Possible", "range": "25-50%"},
        4: {"label": "Likely", "range": "50-75%"},
        5: {"label": "Almost Certain", "range": "> 75%"}
    },
    "impact_scale": {
        1: {"label": "Negligible", "financial": "< $10K"},
        2: {"label": "Minor", "financial": "$10K - $100K"},
        3: {"label": "Moderate", "financial": "$100K - $1M"},
        4: {"label": "Major", "financial": "$1M - $10M"},
        5: {"label": "Severe", "financial": "> $10M"}
    },
    "risk_levels": {
        "Low": {"range": [1, 4], "color": "green"},
        "Medium": {"range": [5, 9], "color": "yellow"},
        "High": {"range": [10, 16], "color": "orange"},
        "Critical": {"range": [17, 25], "color": "red"}
    }
}
```

## Input Schema

```json
{
  "operation": "create|update|assess|report",
  "risk": {
    "id": "string",
    "title": "string",
    "description": "string",
    "category": "string"
  },
  "assessment": {
    "probability": "object",
    "impact": "object"
  },
  "mitigation": {
    "strategy": "string",
    "actions": ["object"]
  },
  "report_options": {
    "format": "matrix|list|dashboard",
    "filters": "object"
  }
}
```

## Output Schema

```json
{
  "risk_register": [
    {
      "id": "string",
      "title": "string",
      "category": "string",
      "inherent_score": "number",
      "residual_score": "number",
      "status": "string",
      "owner": "string",
      "next_review": "string"
    }
  ],
  "summary_statistics": {
    "total_risks": "number",
    "by_level": "object",
    "by_category": "object",
    "trend": "object"
  },
  "risk_matrix": "object",
  "top_risks": ["object"],
  "overdue_mitigations": ["object"],
  "report_path": "string"
}
```

## Best Practices

1. Review and update risk register regularly (monthly minimum)
2. Assign clear ownership for each risk
3. Document rationale for probability and impact scores
4. Track both inherent and residual risk
5. Include positive risks (opportunities)
6. Escalate critical risks promptly
7. Learn from risks that materialized

## Risk Response Strategies

| Strategy | When to Use | Example |
|----------|-------------|---------|
| Avoid | High P, High I, feasible to eliminate | Cancel risky project phase |
| Mitigate | Reduce P or I is cost-effective | Add quality controls |
| Transfer | Impact can be shifted | Insurance, contracts |
| Accept | Low priority or unavoidable | Budget contingency |

## Integration Points

- Feeds into Monte Carlo Engine for quantitative analysis
- Connects with Value at Risk Calculator for financial risk
- Supports Risk Analyst agent
- Integrates with Decision Visualization for risk matrices
