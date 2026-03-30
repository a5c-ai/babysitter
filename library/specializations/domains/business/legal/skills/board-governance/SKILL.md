---
name: board-governance
description: Support board of directors governance and meeting management
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
  skill-id: SK-020
---

# Board Governance Skill

## Overview

The Board Governance Skill supports board of directors governance and meeting management. It provides comprehensive capabilities for managing board operations, from agenda preparation to resolution tracking, ensuring effective corporate governance and compliance with fiduciary duties.

## Capabilities

- Generate board meeting agendas with appropriate structure and content
- Prepare board presentation materials and executive summaries
- Draft board resolutions with proper legal language
- Track board action items and follow-up requirements
- Manage committee workflows and reporting
- Document board minutes with accurate records
- Support director onboarding and orientation programs
- Track governance compliance requirements
- Coordinate board calendar and scheduling
- Manage consent agenda items
- Track director attendance and participation
- Generate governance reports for stakeholders

## Use Cases

### Board Meeting Preparation
Prepare comprehensive board meeting materials including agendas, presentations, and supporting documentation for effective board deliberation.

### Resolution Management
Draft, track, and maintain board and committee resolutions with proper corporate formalities and execution requirements.

### Committee Coordination
Manage committee workflows including audit, compensation, nominating, and governance committees with appropriate reporting structures.

### Governance Compliance
Monitor and track compliance with corporate governance requirements, bylaws, and best practices.

### Director Management
Support director onboarding, training, and ongoing education programs to ensure effective board composition.

## Process Integration

This skill integrates with the following processes:
- Board Governance Framework (all phases)
- Corporate Records Management (minutes and resolutions)
- Corporate Policy Management (governance policies)

## Dependencies

- Board portal systems (Diligent, Nasdaq Boardvantage)
- Document management and collaboration tools
- Compliance tracking systems
- Calendar and scheduling integration
- Corporate records databases

## Configuration

```yaml
board-governance:
  meeting-types:
    - regular
    - special
    - annual
    - committee
  committees:
    - audit
    - compensation
    - nominating-governance
    - executive
  document-templates:
    - agenda
    - minutes
    - resolution
    - consent-agenda
  compliance-frameworks:
    - sarbanes-oxley
    - dodd-frank
    - state-corporate-law
```

## Usage

### Basic Invocation
```
Use the board-governance skill to prepare materials for the upcoming quarterly board meeting.
```

### With Parameters
```
Use the board-governance skill to:
- meeting-type: regular
- date: 2026-02-15
- committees-reporting: [audit, compensation]
- action: prepare-agenda
```

## Output Artifacts

- Board meeting agendas
- Board minutes and records
- Board and committee resolutions
- Director onboarding materials
- Governance compliance reports
- Committee charters and guidelines
- Board calendar and schedules
- Action item tracking reports

## Quality Criteria

- Agendas follow proper corporate governance structure
- Minutes accurately reflect board deliberations and actions
- Resolutions contain appropriate legal language and formalities
- All materials comply with applicable governance requirements
- Documentation maintains appropriate confidentiality
- Records support audit and regulatory examination needs
