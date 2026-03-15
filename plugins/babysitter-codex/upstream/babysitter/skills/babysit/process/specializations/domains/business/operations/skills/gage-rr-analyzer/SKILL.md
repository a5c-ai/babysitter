---
name: gage-rr-analyzer
description: Measurement System Analysis (MSA) skill for Gage R&R studies with variance component analysis and measurement adequacy assessment
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: six-sigma-spc
---

# Gage R&R Analyzer

## Overview

The Gage R&R Analyzer skill provides comprehensive capabilities for conducting Measurement System Analysis (MSA) studies. It supports Gage R&R study design, ANOVA-based variance decomposition, and measurement system adequacy assessment following AIAG guidelines.

## Capabilities

- Gage R&R study design
- ANOVA variance decomposition
- Repeatability analysis
- Reproducibility analysis
- %GRR calculation
- Number of distinct categories
- Measurement bias and linearity
- Acceptance criteria evaluation

## Used By Processes

- SIX-004: Measurement System Analysis
- SIX-002: Statistical Process Control Implementation
- QMS-003: Quality Audit Management

## Tools and Libraries

- Minitab API
- Statistical analysis packages
- Calibration management systems
- Data collection tools

## Usage

```yaml
skill: gage-rr-analyzer
inputs:
  study_type: "crossed"  # crossed | nested
  operators: 3
  parts: 10
  trials: 3
  measurements:
    - operator: "A"
      part: 1
      trial: 1
      value: 10.2
    # ... additional measurements
  tolerance: 1.6  # USL - LSL
outputs:
  - variance_components
  - percent_grr
  - percent_tolerance
  - ndc
  - acceptance_decision
  - detailed_report
```

## Variance Components

| Component | Source | Description |
|-----------|--------|-------------|
| Part-to-Part | Process | Variation between parts |
| Repeatability | Equipment | Variation from repeated measurements |
| Reproducibility | Operator | Variation between operators |
| Part x Operator | Interaction | Operator effect varies by part |

## Acceptance Criteria (AIAG Guidelines)

| %GRR | Decision |
|------|----------|
| < 10% | Acceptable |
| 10% - 30% | Marginal, may be acceptable |
| > 30% | Unacceptable |

## Number of Distinct Categories (ndc)

```
ndc = 1.41 * (Part Variation / GRR)

Interpretation:
- ndc >= 5: Adequate measurement system
- ndc < 5: Measurement system needs improvement
```

## Study Design Requirements

| Study Type | Minimum Parts | Minimum Operators | Minimum Trials |
|------------|---------------|-------------------|----------------|
| Standard | 10 | 3 | 2-3 |
| Attribute | 30 | 3 | 3 |
| Destructive | Use nested design | 3 | 1 |

## Integration Points

- Calibration management systems
- Quality Management Systems
- Statistical analysis software
- Training management systems
