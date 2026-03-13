---
name: iso14971-risk-analyzer
description: Comprehensive risk management skill implementing ISO 14971:2019 methodology for medical device risk analysis
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: biomedical-engineering
  domain: science
  category: Risk Management
  skill-id: BME-SK-008
---

# ISO 14971 Risk Analyzer Skill

## Purpose

The ISO 14971 Risk Analyzer Skill implements comprehensive risk management methodology per ISO 14971:2019 for medical devices, supporting hazard identification, risk estimation, risk control, and benefit-risk analysis throughout the device lifecycle.

## Capabilities

- Hazard identification questionnaire generation
- Hazardous situation analysis templates
- Risk estimation matrix configuration
- Risk acceptability criteria setup
- Risk control measure tracking
- Residual risk evaluation
- Benefit-risk analysis documentation
- Risk management plan templates
- Risk management report generation
- Post-production risk monitoring
- Risk control verification tracking

## Usage Guidelines

### When to Use
- Establishing risk management plans
- Conducting hazard analyses
- Evaluating risk acceptability
- Documenting benefit-risk determinations

### Prerequisites
- Device intended use defined
- Reasonably foreseeable misuse identified
- Risk acceptability criteria established
- State of the art research completed

### Best Practices
- Begin risk management at concept phase
- Maintain risk management file throughout lifecycle
- Review risks at each design phase gate
- Integrate with post-market surveillance

## Process Integration

This skill integrates with the following processes:
- Medical Device Risk Management (ISO 14971)
- Human Factors Engineering and Usability
- 510(k) Premarket Submission Preparation
- EU MDR Technical Documentation

## Dependencies

- ISO 14971:2019 standard
- Risk matrix templates
- Hazard databases
- Safety standards (IEC 60601, IEC 62366)
- Post-market data sources

## Configuration

```yaml
iso14971-risk-analyzer:
  risk-categories:
    - clinical
    - electrical
    - mechanical
    - software
    - biocompatibility
    - sterility
    - usability
  probability-levels: 5
  severity-levels: 5
  acceptability-criteria:
    ALARP: true
    state-of-art: true
```

## Output Artifacts

- Risk management plans
- Hazard analysis worksheets
- Risk estimation matrices
- Risk control documents
- Residual risk evaluations
- Benefit-risk analyses
- Risk management reports
- Risk control verification records

## Quality Criteria

- All reasonably foreseeable hazards identified
- Risk estimation is systematic and documented
- Risk control measures are verified effective
- Residual risks are acceptable per criteria
- Benefit-risk analysis supports intended use
- Documentation meets ISO 14971:2019 requirements
