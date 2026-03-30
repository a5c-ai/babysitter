---
name: vendor-risk-scorer
description: Comprehensive supplier risk scoring skill with multi-dimensional risk assessment
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
  priority: medium
---

# Vendor Risk Scorer

## Overview

The Vendor Risk Scorer provides comprehensive supplier risk assessment across multiple dimensions including financial, operational, geopolitical, compliance, and cyber security risks. It calculates weighted risk scores and assigns risk ratings to support informed supplier management decisions.

## Capabilities

- **Financial Risk Assessment**: Credit ratings, D&B scores, payment behavior
- **Operational Risk Evaluation**: Capacity, quality systems, business continuity
- **Geopolitical Risk Scoring**: Country risk, trade sanctions, political stability
- **Compliance Risk Assessment**: Regulatory, ESG, industry standards
- **Cyber Security Risk Evaluation**: Information security posture
- **Concentration Risk Analysis**: Dependency and single-source risk
- **Weighted Risk Score Calculation**: Configurable risk weighting
- **Risk Rating Assignment and Trending**: Rating levels and trajectory

## Input Schema

```yaml
risk_scoring_request:
  supplier_id: string
  risk_data:
    financial:
      credit_rating: string
      duns_score: integer
      payment_history: object
      revenue_trend: string
    operational:
      capacity_utilization: float
      quality_certifications: array
      bcp_status: string
    geopolitical:
      country: string
      sanctions_status: string
      political_stability: float
    compliance:
      regulatory_violations: array
      esg_rating: string
      audit_findings: array
    cyber:
      security_certifications: array
      incident_history: array
  concentration_data:
    spend_percentage: float
    alternative_suppliers: integer
    switching_cost: string
  weighting_profile: object
```

## Output Schema

```yaml
risk_scoring_output:
  supplier_id: string
  assessment_date: date
  category_scores:
    financial_risk:
      score: float
      factors: array
      trend: string
    operational_risk:
      score: float
      factors: array
      trend: string
    geopolitical_risk:
      score: float
      factors: array
      trend: string
    compliance_risk:
      score: float
      factors: array
      trend: string
    cyber_risk:
      score: float
      factors: array
      trend: string
    concentration_risk:
      score: float
      factors: array
  composite_risk_score: float
  risk_rating: string             # Low, Medium, High, Critical
  risk_drivers: array
  mitigation_recommendations: array
  monitoring_frequency: string
```

## Usage

### Comprehensive Risk Assessment

```
Input: Supplier financial, operational, compliance data
Process: Score each risk dimension, calculate composite
Output: Overall risk rating with driver analysis
```

### Financial Risk Monitoring

```
Input: Updated D&B data, credit rating changes
Process: Recalculate financial risk component
Output: Updated financial risk score with alerts
```

### Concentration Risk Analysis

```
Input: Spend data, alternative supplier availability
Process: Assess single-source and dependency risks
Output: Concentration risk score with mitigation options
```

## Integration Points

- **Risk Data Providers**: D&B, Resilinc, EcoVadis
- **Credit Agencies**: Credit rating feeds
- **Compliance Databases**: Sanctions lists, regulatory databases
- **Tools/Libraries**: Risk frameworks, scoring algorithms

## Process Dependencies

- Supply Chain Risk Assessment
- Supplier Risk Monitoring and Early Warning
- Supplier Evaluation and Selection

## Best Practices

1. Establish clear risk appetite thresholds
2. Validate risk data sources regularly
3. Include supplier self-assessment where appropriate
4. Escalate high-risk ratings promptly
5. Document risk mitigation actions
6. Review risk weightings based on business priorities
