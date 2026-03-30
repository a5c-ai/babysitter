---
name: requirements-traceability-manager
description: Design control traceability skill for managing user needs, design inputs, design outputs, and verification/validation linkages
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
  skill-id: BME-SK-005
---

# Requirements Traceability Manager Skill

## Purpose

The Requirements Traceability Manager Skill ensures comprehensive traceability throughout the medical device design control process, linking user needs to design inputs, design outputs, and verification/validation activities per 21 CFR 820.30.

## Capabilities

- Bidirectional traceability matrix generation
- Requirements coverage analysis
- Gap identification in V&V coverage
- Design change impact analysis
- Traceability report generation
- DHF (Design History File) completeness checking
- User needs to design input mapping
- Design output to verification linking
- Risk control to requirements tracing
- Regulatory requirement coverage tracking
- Orphan requirement identification

## Usage Guidelines

### When to Use
- Establishing design control traceability
- Conducting V&V coverage analysis
- Assessing design change impacts
- Preparing for regulatory audits

### Prerequisites
- User needs documented
- Design inputs established
- Design outputs defined
- V&V protocols available

### Best Practices
- Establish traceability from project inception
- Update matrices with every design change
- Verify bidirectional completeness regularly
- Integrate with requirements management tools

## Process Integration

This skill integrates with the following processes:
- Design Control Process Implementation
- Verification and Validation Test Planning
- Software Development Lifecycle (IEC 62304)
- Medical Device Risk Management (ISO 14971)

## Dependencies

- Requirements management tools (Jama Connect, Polarion, DOORS)
- Design documentation systems
- Test management platforms
- Change control systems

## Configuration

```yaml
requirements-traceability-manager:
  traceability-levels:
    - user-needs
    - design-inputs
    - design-outputs
    - verification
    - validation
    - risk-controls
  matrix-types:
    - forward
    - backward
    - bidirectional
  coverage-metrics:
    - requirement-coverage
    - test-coverage
    - risk-coverage
```

## Output Artifacts

- Bidirectional traceability matrices
- Requirements coverage reports
- Gap analysis documents
- Impact assessment reports
- DHF completeness checklists
- Orphan requirement lists
- V&V coverage summaries
- Change impact analyses

## Quality Criteria

- Complete bidirectional traceability established
- All user needs traced to design inputs
- All design inputs traced to design outputs
- V&V activities cover all requirements
- Risk controls properly traced
- No orphan requirements exist
