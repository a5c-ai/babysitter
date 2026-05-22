---
name: permit-application-generator
description: Permit application preparation skill for building, environmental, and DOT permits
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
  category: Documentation
  skill-id: CIV-SK-037
graph:
  domains: [domain:civil-engineering]
  skillAreas: [skill-area:mathematical-reasoning, skill-area:computational-geometry, skill-area:data-analysis]
  roles: [role:systems-integration-engineer, role:research-engineer]
---

# Permit Application Generator Skill

## Purpose

The Permit Application Generator Skill prepares permit applications including building permits, environmental permits, and DOT permits with required supporting documentation.

## Capabilities

- Building permit forms
- Environmental permit forms
- DOT permit applications
- Supporting document checklist
- Fee calculation
- Submittal package assembly
- Agency form completion
- Application tracking

## Usage Guidelines

### When to Use
- Preparing permit applications
- Assembling permit packages
- Tracking permit status
- Responding to comments

### Prerequisites
- Design documents complete
- Supporting studies available
- Fees calculated
- Agency requirements known

### Best Practices
- Complete all required forms
- Include all attachments
- Track submittal dates
- Respond promptly to comments

## Process Integration

This skill integrates with:
- Permit Application Preparation

## Configuration

```yaml
permit-application-generator:
  permit-types:
    - building
    - environmental
    - DOT
    - utility
  outputs:
    - forms
    - checklists
    - packages
    - tracking-logs
```

## Output Artifacts

- Permit applications
- Supporting documents
- Submittal checklists
- Fee summaries
