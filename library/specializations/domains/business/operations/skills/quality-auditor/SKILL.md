---
name: quality-auditor
description: Internal quality audit skill with planning, execution, findings documentation, and corrective action tracking
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: quality-management
---

# Quality Auditor

## Overview

The Quality Auditor skill provides comprehensive capabilities for planning and conducting internal quality audits. It supports audit program planning, checklist generation, findings classification, and corrective action tracking.

## Capabilities

- Audit program planning
- Audit checklist generation
- Finding classification (major/minor/observation)
- Nonconformance documentation
- Corrective action request (CAR) creation
- Root cause requirement
- Effectiveness verification
- Audit report generation

## Used By Processes

- QMS-003: Quality Audit Management
- QMS-001: ISO 9001 Implementation
- LEAN-002: 5S Implementation

## Tools and Libraries

- Audit management software
- QMS platforms
- Document management systems
- Corrective action tracking

## Usage

```yaml
skill: quality-auditor
inputs:
  audit_type: "internal"  # internal | supplier | process
  audit_scope: "Production processes against ISO 9001:2015"
  standard: "ISO 9001:2015"
  department: "Manufacturing"
  processes:
    - "Production control"
    - "Inspection and testing"
    - "Nonconforming product"
  previous_findings:
    - finding_id: "NC-2025-001"
      status: "closed"
    - finding_id: "NC-2025-002"
      status: "open"
outputs:
  - audit_plan
  - audit_checklist
  - audit_report
  - findings_list
  - corrective_actions
  - trend_analysis
```

## Audit Process

### Phase 1: Planning
1. Define scope and objectives
2. Select audit team
3. Develop audit plan
4. Create checklists
5. Notify auditee

### Phase 2: Execution
1. Opening meeting
2. Document review
3. Process observation
4. Personnel interviews
5. Evidence collection

### Phase 3: Reporting
1. Closing meeting
2. Finding classification
3. Report preparation
4. CAR issuance
5. Distribution

### Phase 4: Follow-up
1. Corrective action review
2. Root cause verification
3. Effectiveness verification
4. Close findings
5. Trend analysis

## Finding Classification

| Classification | Definition | Timeline |
|----------------|------------|----------|
| Major Nonconformance | System failure, high risk | 30 days |
| Minor Nonconformance | Isolated incident, low risk | 60 days |
| Observation | Improvement opportunity | No deadline |
| Positive Finding | Best practice | Document only |

## Corrective Action Requirements

1. **Immediate Correction** - Fix the specific issue
2. **Root Cause Analysis** - Determine why it occurred
3. **Corrective Action** - Prevent recurrence
4. **Implementation** - Execute the action
5. **Verification** - Confirm effectiveness

## Audit Checklist Categories

| Category | Example Questions |
|----------|-------------------|
| Documentation | Is the procedure current and approved? |
| Implementation | Is the process followed as documented? |
| Records | Are required records maintained? |
| Competence | Is personnel trained and competent? |
| Resources | Are adequate resources available? |

## Integration Points

- Quality Management Systems
- Document control systems
- Training management
- Risk management platforms
