---
name: revit-api-interface
description: Revit API interface skill for element extraction, creation, and automation
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: civil-engineering
  domain: science
  category: BIM Coordination
  skill-id: CIV-SK-016
---

# Revit API Interface Skill

## Purpose

The Revit API Interface Skill provides programmatic access to Revit models for element extraction, creation, schedule generation, and automation of structural workflows.

## Capabilities

- Extract element properties
- Create structural elements
- Generate schedules
- Apply structural parameters
- Export to analysis software
- Rebar detailing automation
- Family parameter management
- View and sheet automation

## Usage Guidelines

### When to Use
- Automating Revit workflows
- Extracting model data
- Creating structural elements
- Generating documentation

### Prerequisites
- Revit model available
- API access configured
- Element parameters defined
- Automation script developed

### Best Practices
- Test on model copies
- Validate data integrity
- Handle errors gracefully
- Document API usage

## Process Integration

This skill integrates with:
- BIM Coordination
- Reinforced Concrete Design
- Structural Steel Design

## Configuration

```yaml
revit-api-interface:
  operations:
    - extract
    - create
    - modify
    - export
  element-types:
    - structural-framing
    - structural-columns
    - walls
    - foundations
    - rebar
```

## Output Artifacts

- Element extractions
- Schedule exports
- Parameter reports
- Automation logs
