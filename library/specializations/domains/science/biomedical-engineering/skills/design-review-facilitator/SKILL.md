---
name: design-review-facilitator
description: Design review planning and execution skill for structured design phase gate reviews per 21 CFR 820.30
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
  category: Design Control
  skill-id: BME-SK-006
---

# Design Review Facilitator Skill

## Purpose

The Design Review Facilitator Skill supports planning and execution of structured design phase gate reviews for medical devices, ensuring compliance with 21 CFR 820.30 and effective cross-functional evaluation.

## Capabilities

- Design review agenda generation
- Review checklist by phase (input, output, verification, validation, transfer)
- Action item tracking
- Review record documentation
- Cross-functional reviewer identification
- Risk review integration
- Design stage gate criteria definition
- Review meeting facilitation support
- Decision documentation templates
- Follow-up tracking automation
- Review metrics and trending

## Usage Guidelines

### When to Use
- Planning design phase gate reviews
- Conducting formal design reviews
- Documenting review outcomes
- Tracking design review action items

### Prerequisites
- Design phase deliverables prepared
- Review team identified
- Review criteria established
- Risk management updates available

### Best Practices
- Include all required functions in reviews
- Document all decisions and rationale
- Track action items to closure
- Integrate risk review at each phase gate

## Process Integration

This skill integrates with the following processes:
- Design Control Process Implementation
- Verification and Validation Test Planning
- Design for Manufacturing and Assembly (DFMA)
- Medical Device Risk Management (ISO 14971)

## Dependencies

- Design documentation systems
- Meeting management tools
- Action item tracking systems
- Risk management databases
- Review templates per FDA guidance

## Configuration

```yaml
design-review-facilitator:
  review-phases:
    - design-input-review
    - design-output-review
    - verification-review
    - validation-review
    - design-transfer-review
  required-functions:
    - engineering
    - quality
    - regulatory
    - manufacturing
    - clinical
  decision-types:
    - approved
    - approved-with-conditions
    - not-approved
```

## Output Artifacts

- Design review agendas
- Phase-specific checklists
- Review meeting minutes
- Action item logs
- Decision records
- Review summary reports
- Attendance records
- Follow-up status reports

## Quality Criteria

- All required functions participate in reviews
- Review records meet 21 CFR 820.30 requirements
- Action items tracked to closure
- Decisions clearly documented with rationale
- Risk considerations integrated
- Phase gate criteria objectively assessed
