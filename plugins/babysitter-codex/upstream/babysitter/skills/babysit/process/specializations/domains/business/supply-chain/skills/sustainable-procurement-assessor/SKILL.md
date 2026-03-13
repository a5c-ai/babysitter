---
name: sustainable-procurement-assessor
description: Sustainability assessment skill for procurement practices and supplier evaluation
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: supply-chain
  domain: business
  category: sustainability
  priority: future
---

# Sustainable Procurement Assessor

## Overview

The Sustainable Procurement Assessor provides comprehensive sustainability assessment capabilities for procurement practices and supplier evaluation. It evaluates environmental, social, and governance (ESG) factors and supports sustainable sourcing initiatives.

## Capabilities

- **Environmental Impact Scoring**: Carbon, water, waste footprint assessment
- **Social Responsibility Assessment**: Labor practices, community impact
- **Ethical Sourcing Verification**: Conflict minerals, fair trade compliance
- **Circular Economy Evaluation**: Recyclability, end-of-life considerations
- **ESG Questionnaire Scoring**: Standardized sustainability assessment
- **Certification Tracking**: ISO 14001, SA8000, other certifications
- **Sustainability Improvement Planning**: Development roadmap creation
- **Reporting Framework Alignment**: GRI, CDP, SASB compliance

## Input Schema

```yaml
sustainability_assessment_request:
  supplier_id: string
  assessment_scope:
    environmental: boolean
    social: boolean
    governance: boolean
    circular_economy: boolean
  supplier_data:
    certifications: array
    esg_questionnaire: object
    audit_results: array
    self_disclosure: object
  external_data:
    esg_ratings: object           # EcoVadis, CDP, etc.
    news_screening: array
    sanctions_check: object
  reporting_requirements:
    frameworks: array             # GRI, CDP, SASB
    disclosure_items: array
```

## Output Schema

```yaml
sustainability_assessment_output:
  supplier_id: string
  assessment_date: date
  sustainability_scores:
    overall: float
    environmental:
      score: float
      carbon_footprint: object
      water_usage: object
      waste_management: object
    social:
      score: float
      labor_practices: object
      health_safety: object
      community_impact: object
    governance:
      score: float
      ethics_compliance: object
      transparency: object
  certifications:
    current: array
    expired: array
    recommended: array
  circular_economy_assessment:
    recyclability_score: float
    material_efficiency: float
    end_of_life_program: boolean
  risk_flags:
    high_risk_areas: array
    improvement_required: array
  improvement_plan:
    recommendations: array
    timeline: object
    targets: array
  reporting_data:
    gri_metrics: object
    cdp_disclosure: object
    sasb_metrics: object
  benchmark_comparison: object
```

## Usage

### Comprehensive ESG Assessment

```
Input: Supplier questionnaire, certifications, external ratings
Process: Score across ESG dimensions
Output: Complete sustainability assessment
```

### Certification Gap Analysis

```
Input: Current certifications, industry requirements
Process: Compare against standards and peers
Output: Certification roadmap
```

### Reporting Data Preparation

```
Input: Supplier sustainability data, reporting framework
Process: Map data to disclosure requirements
Output: Framework-aligned reporting data
```

## Integration Points

- **ESG Data Providers**: EcoVadis, CDP, Sustainalytics
- **Certification Bodies**: ISO, SA8000 registrars
- **Reporting Platforms**: GRI, CDP reporting tools
- **Tools/Libraries**: ESG frameworks, sustainability databases

## Process Dependencies

- Sustainable Procurement Assessment
- Supplier Evaluation and Selection
- Supplier Performance Scorecard

## Best Practices

1. Use recognized ESG frameworks and standards
2. Verify supplier self-disclosures where possible
3. Consider industry-specific sustainability factors
4. Set improvement targets collaboratively
5. Integrate sustainability into sourcing decisions
6. Report progress transparently
