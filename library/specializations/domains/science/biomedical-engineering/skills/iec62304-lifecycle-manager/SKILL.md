---
name: iec62304-lifecycle-manager
description: Medical device software lifecycle management skill implementing IEC 62304 requirements
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
  category: Medical Device Software
  skill-id: BME-SK-019
---

# IEC 62304 Lifecycle Manager Skill

## Purpose

The IEC 62304 Lifecycle Manager Skill supports medical device software lifecycle management per IEC 62304, ensuring proper classification, documentation, and maintenance of software as a medical device (SaMD) and software in medical devices (SiMD).

## Capabilities

- Software safety classification (Class A, B, C)
- Software development plan template generation
- SOUP (Software of Unknown Provenance) management
- Software architecture documentation templates
- Anomaly and problem tracking
- Configuration management guidance
- Maintenance planning
- Software requirements specification templates
- Unit/integration test planning
- Release documentation
- Change control workflows

## Usage Guidelines

### When to Use
- Planning medical device software projects
- Classifying software safety levels
- Managing SOUP components
- Preparing for regulatory submissions

### Prerequisites
- Device intended use defined
- Software scope identified
- Hazard analysis completed
- Development team resources available

### Best Practices
- Classify software based on hazard analysis
- Document all SOUP with risk assessments
- Maintain comprehensive change control
- Plan maintenance activities from project start

## Process Integration

This skill integrates with the following processes:
- Software Development Lifecycle (IEC 62304)
- Software Verification and Validation
- AI/ML Medical Device Development
- Medical Device Risk Management (ISO 14971)

## Dependencies

- IEC 62304 standard
- AAMI TIR45 guidance
- Configuration management tools
- Issue tracking systems
- Development environments

## Configuration

```yaml
iec62304-lifecycle-manager:
  safety-classes:
    - Class-A
    - Class-B
    - Class-C
  lifecycle-phases:
    - planning
    - requirements
    - architecture
    - detailed-design
    - implementation
    - verification
    - release
    - maintenance
  document-types:
    - development-plan
    - requirements-spec
    - architecture-doc
    - test-plans
    - release-notes
```

## Output Artifacts

- Software development plans
- Safety classification rationale
- SOUP management documentation
- Architecture documents
- Requirements specifications
- Anomaly management reports
- Configuration management plans
- Maintenance plans

## Quality Criteria

- Safety classification justified by hazard analysis
- Documentation appropriate for safety class
- SOUP properly evaluated and controlled
- Configuration management comprehensive
- Anomaly management effective
- Maintenance activities planned
