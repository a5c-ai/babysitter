---
name: use-related-risk-analyzer
description: Use-related risk analysis skill for identifying hazards associated with user interaction per IEC 62366-1
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
  skill-id: BME-SK-009
---

# Use-Related Risk Analyzer Skill

## Purpose

The Use-Related Risk Analyzer Skill identifies and evaluates hazards associated with user interaction with medical devices, implementing IEC 62366-1 usability engineering methodology and supporting human factors risk analysis.

## Capabilities

- Use scenario identification
- Task analysis decomposition
- Use error categorization (perception, cognition, action)
- Known use problems database search
- Risk mitigation strategy development
- Training vs. design solution recommendations
- User interface risk analysis
- Critical task identification
- Use error root cause analysis
- Usability test planning support
- IFU effectiveness evaluation

## Usage Guidelines

### When to Use
- Conducting use-related risk analysis
- Planning usability engineering activities
- Designing user interfaces
- Evaluating training effectiveness

### Prerequisites
- User profiles defined
- Use environments characterized
- Intended use documented
- Use scenarios identified

### Best Practices
- Integrate with ISO 14971 risk management
- Prioritize inherently safe design
- Test with representative users
- Validate critical tasks

## Process Integration

This skill integrates with the following processes:
- Human Factors Engineering and Usability
- Medical Device Risk Management (ISO 14971)
- Verification and Validation Test Planning
- Design Control Process Implementation

## Dependencies

- IEC 62366-1 standard
- FDA Human Factors guidance
- AAMI HE75 guidelines
- Known problems databases
- User interface standards

## Configuration

```yaml
use-related-risk-analyzer:
  user-profiles:
    - healthcare-professional
    - patient
    - caregiver
    - lay-user
  error-categories:
    - perception-error
    - cognition-error
    - action-error
  use-environments:
    - clinical
    - home
    - emergency
```

## Output Artifacts

- Use-related risk analysis documents
- Task analysis worksheets
- Use error catalogs
- Critical task lists
- Mitigation recommendations
- Usability test specifications
- Training requirements
- IFU content recommendations

## Quality Criteria

- All user groups and scenarios analyzed
- Use errors systematically identified
- Critical tasks properly validated
- Mitigation strategies prioritize safe design
- Training addresses residual use risks
- Analysis integrates with ISO 14971
