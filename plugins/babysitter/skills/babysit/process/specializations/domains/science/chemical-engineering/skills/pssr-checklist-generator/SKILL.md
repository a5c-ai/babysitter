---
name: pssr-checklist-generator
description: Pre-Startup Safety Review checklist generation skill for startup readiness verification
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: chemical-engineering
  domain: science
  category: Commissioning
  skill-id: CE-SK-027
---

# PSSR Checklist Generator Skill

## Purpose

The PSSR Checklist Generator Skill creates comprehensive Pre-Startup Safety Review checklists to ensure all safety, operational, and regulatory requirements are met before process startup.

## Capabilities

- Checklist customization by project type
- PSM element coverage verification
- MOC integration
- Training verification
- Procedure completion tracking
- P&ID verification
- Instrument loop check tracking
- Action item management
- Approval workflow

## Usage Guidelines

### When to Use
- Preparing for process startup
- After management of change
- Following turnaround completion
- New unit commissioning

### Prerequisites
- Design documentation complete
- Construction substantially complete
- Operating procedures available
- Training completed

### Best Practices
- Customize for specific project
- Involve cross-functional team
- Track all action items
- Document approvals

## Process Integration

This skill integrates with:
- Process Startup Procedure Development
- Performance Testing and Validation
- Control Strategy Development

## Configuration

```yaml
pssr-checklist-generator:
  checklist-categories:
    - construction
    - procedures
    - training
    - safety
    - environmental
    - documentation
  regulatory-frameworks:
    - OSHA-PSM
    - EPA-RMP
```

## Output Artifacts

- PSSR checklists
- Action item lists
- Verification records
- Approval documentation
- Startup authorization
