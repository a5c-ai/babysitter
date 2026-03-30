---
name: supply-chain-risk-assessor
description: Comprehensive supply chain risk identification and assessment skill with heat mapping
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: risk-management
  priority: high
---

# Supply Chain Risk Assessor

## Overview

The Supply Chain Risk Assessor provides comprehensive risk identification, assessment, and visualization capabilities for supply chain risk management. It supports structured risk categorization, probability-impact analysis, heat mapping, and control effectiveness evaluation.

## Capabilities

- **Risk Category Taxonomy**: Financial, operational, geopolitical, compliance categorization
- **Probability and Impact Assessment**: Likelihood and consequence scoring
- **Risk Score Calculation and Ranking**: Prioritized risk listing
- **Heat Map Visualization**: Visual risk representation
- **Root Cause Analysis Integration**: Risk driver identification
- **Risk Appetite Alignment**: Threshold and tolerance management
- **Control Effectiveness Evaluation**: Mitigation effectiveness assessment
- **Risk Register Maintenance**: Centralized risk documentation

## Input Schema

```yaml
risk_assessment_request:
  scope:
    categories: array             # supplier, logistics, demand, etc.
    geography: array
    time_horizon: string
  risk_inputs:
    identified_risks: array
      - risk_name: string
        category: string
        description: string
        probability: float        # 1-5 scale
        impact: float             # 1-5 scale
        velocity: string          # slow, medium, fast
    historical_incidents: array
    external_factors: array
  controls:
    existing_controls: array
    control_effectiveness: object
  risk_appetite: object
```

## Output Schema

```yaml
risk_assessment_output:
  risk_register:
    risks: array
      - risk_id: string
        name: string
        category: string
        description: string
        probability: float
        impact: float
        risk_score: float
        risk_level: string        # Low, Medium, High, Critical
        root_causes: array
        controls: array
        control_effectiveness: string
        residual_risk: float
        owner: string
        mitigation_status: string
  heat_map:
    visualization_data: object
    distribution: object
  summary:
    total_risks: integer
    by_category: object
    by_level: object
    trends: object
  recommendations: array
  action_plan: array
```

## Usage

### Comprehensive Risk Assessment

```
Input: Supply chain scope, identified risks, historical incidents
Process: Score risks, calculate rankings, generate heat map
Output: Complete risk assessment with prioritized register
```

### Category-Specific Analysis

```
Input: Supplier category risks, control inventory
Process: Deep-dive risk analysis for supplier domain
Output: Supplier risk profile with mitigation priorities
```

### Control Effectiveness Review

```
Input: Current controls, incident data, audit findings
Process: Evaluate control performance, identify gaps
Output: Control effectiveness report with recommendations
```

## Integration Points

- **Risk Management Systems**: GRC platforms
- **Incident Management**: Historical event data
- **Supplier Systems**: Supplier risk inputs
- **Tools/Libraries**: Risk frameworks, FMEA templates, visualization

## Process Dependencies

- Supply Chain Risk Assessment
- Supplier Risk Monitoring and Early Warning
- Business Continuity and Contingency Planning

## Best Practices

1. Conduct comprehensive risk identification workshops
2. Use consistent probability-impact scales
3. Validate assessments with subject matter experts
4. Review and update risk register quarterly
5. Link risks to business objectives
6. Communicate risk status to leadership regularly
