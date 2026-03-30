---
name: entity-management
description: Track and manage subsidiary and entity information
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: legal
  domain: business
  category: Corporate Governance
  skill-id: SK-023
---

# Entity Management Skill

## Overview

The Entity Management Skill tracks and manages subsidiary and entity information across the corporate family. It provides comprehensive capabilities for maintaining entity hierarchies, managing compliance requirements, and ensuring proper governance across multiple jurisdictions and entity types.

## Capabilities

- Maintain entity hierarchy and organizational structure
- Track entity formation documents and amendments
- Monitor compliance requirements by jurisdiction
- Manage registered agent relationships and changes
- Track annual filing deadlines and requirements
- Support entity dissolution and wind-down procedures
- Generate entity reports and organizational charts
- Track officer and director information across entities
- Manage foreign qualifications and withdrawals
- Monitor business license requirements
- Track inter-company agreements and relationships
- Support entity restructuring and reorganization

## Use Cases

### Entity Hierarchy Management
Maintain accurate organizational structure showing parent-subsidiary relationships and ownership percentages.

### Compliance Calendar
Track and manage filing deadlines, annual reports, franchise taxes, and other compliance requirements across jurisdictions.

### Registered Agent Management
Coordinate registered agent services and manage address changes and agent transitions.

### Entity Formation
Support new entity formation including jurisdiction selection, document preparation, and initial compliance.

### Entity Dissolution
Manage entity wind-down procedures including withdrawals, dissolutions, and final compliance requirements.

## Process Integration

This skill integrates with the following processes:
- Entity Management (all phases)
- Corporate Records Management (entity records)
- Board Governance Framework (subsidiary governance)
- Contract Lifecycle Management (entity verification)

## Dependencies

- Entity management systems (Diligent, CT Corporation, CSC)
- Corporate filing APIs and services
- Registered agent networks
- Jurisdiction databases
- Calendar and deadline tracking
- Document management systems

## Configuration

```yaml
entity-management:
  entity-types:
    - corporation
    - llc
    - partnership
    - lp
    - foreign-entity
    - branch
    - joint-venture
  jurisdictions:
    domestic:
      - delaware
      - nevada
      - california
    international:
      - uk
      - ireland
      - singapore
  compliance-types:
    - annual-report
    - franchise-tax
    - business-license
    - foreign-qualification
  officer-roles:
    - president
    - secretary
    - treasurer
    - ceo
    - cfo
    - director
```

## Usage

### Basic Invocation
```
Use the entity-management skill to generate a compliance calendar for all subsidiaries.
```

### With Parameters
```
Use the entity-management skill to:
- action: formation-checklist
- entity-type: llc
- formation-state: Delaware
- foreign-qualifications: [California, New York, Texas]
- members:
    - name: "Parent Corp"
      percentage: 100
```

## Output Artifacts

- Entity hierarchy charts and diagrams
- Entity profile documents
- Compliance calendars and deadline reports
- Registered agent records
- Formation and qualification documents
- Dissolution checklists and records
- Officer and director matrices
- Jurisdiction requirement summaries
- Inter-company agreement inventories
- Entity restructuring plans

## Quality Criteria

- Entity hierarchy accurately reflects ownership
- All compliance deadlines are tracked and met
- Registered agent information is current
- Formation documents are properly maintained
- Officer and director records are accurate
- Foreign qualifications match business activities
- Good standing maintained across jurisdictions
- Entity changes documented with audit trail
