---
name: design-fmea-generator
description: Design Failure Mode and Effects Analysis (DFMEA) skill for systematic design risk identification
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
  skill-id: BME-SK-007
---

# Design FMEA Generator Skill

## Purpose

The Design FMEA Generator Skill facilitates systematic identification and evaluation of potential design failure modes for medical devices, supporting ISO 14971 risk management through structured DFMEA methodology.

## Capabilities

- DFMEA worksheet generation
- Failure mode brainstorming support
- Severity, Occurrence, Detection rating guidance
- RPN (Risk Priority Number) calculation
- Recommended action tracking
- Control plan linkage
- Failure mode categorization
- Root cause analysis templates
- Design mitigation recommendations
- DFMEA revision management
- Cross-reference to risk management file

## Usage Guidelines

### When to Use
- Initiating design risk analysis
- Evaluating design alternatives
- Supporting design reviews
- Updating risk assessments for design changes

### Prerequisites
- Design concept defined
- Functional requirements documented
- Intended use established
- Similar device failure data available

### Best Practices
- Conduct DFMEA early in design phase
- Include cross-functional team members
- Link to ISO 14971 risk management file
- Update with design iterations

## Process Integration

This skill integrates with the following processes:
- Medical Device Risk Management (ISO 14971)
- Design Control Process Implementation
- Design for Manufacturing and Assembly (DFMA)
- Verification and Validation Test Planning

## Dependencies

- AIAG FMEA templates
- ISO 14971 risk management framework
- Design documentation
- Historical failure data
- Industry failure mode databases

## Configuration

```yaml
design-fmea-generator:
  rating-scales:
    severity: 1-10
    occurrence: 1-10
    detection: 1-10
  risk-thresholds:
    rpn-action-limit: 100
    severity-critical: 9
  output-formats:
    - worksheet
    - summary-report
    - action-tracker
```

## Output Artifacts

- DFMEA worksheets
- Failure mode catalogs
- RPN summary reports
- Recommended action lists
- Control plan inputs
- Design review inputs
- Risk management file updates
- Mitigation tracking logs

## Quality Criteria

- All design functions analyzed
- Failure modes comprehensively identified
- Ratings consistently applied
- High RPN items addressed
- Actions tracked to completion
- Linkage to ISO 14971 maintained
