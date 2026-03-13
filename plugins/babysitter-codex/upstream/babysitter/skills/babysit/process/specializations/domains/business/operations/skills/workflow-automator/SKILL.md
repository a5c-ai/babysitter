---
name: workflow-automator
description: Operational workflow automation skill with task sequencing, approval routing, and exception handling
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
metadata:
  specialization: operations
  domain: business
  category: workflow-automation
---

# Workflow Automator

## Overview

The Workflow Automator skill provides comprehensive capabilities for automating operational workflows. It supports task sequencing, approval routing, notification automation, exception handling, and audit trail generation.

## Capabilities

- Workflow design
- Task sequencing
- Approval routing configuration
- Notification automation
- Exception handling rules
- Escalation pathways
- Audit trail generation
- Integration with operational systems

## Used By Processes

- LEAN-005: Standard Work Documentation
- QMS-001: ISO 9001 Implementation
- CI-001: Operational Excellence Program Design

## Tools and Libraries

- Workflow platforms
- RPA tools
- Business process management systems
- Integration APIs

## Usage

```yaml
skill: workflow-automator
inputs:
  workflow_name: "Engineering Change Request"
  trigger:
    type: "form_submission"
    source: "ecr_form"
  steps:
    - name: "Initial Review"
      assignee_role: "Engineering Manager"
      action: "approve_reject"
      sla: 2  # business days
    - name: "Impact Assessment"
      assignee_role: "Cross-functional Team"
      action: "complete_assessment"
      sla: 5
    - name: "Final Approval"
      assignee_role: "Director"
      action: "approve_reject"
      sla: 2
  notifications:
    - event: "assignment"
      recipient: "assignee"
      method: ["email", "slack"]
    - event: "sla_warning"
      recipient: "assignee_manager"
      method: ["email"]
  escalation:
    - threshold: "sla_breach"
      action: "notify_director"
outputs:
  - workflow_definition
  - notification_templates
  - escalation_rules
  - audit_configuration
  - integration_specs
```

## Workflow Components

### Triggers
| Type | Description | Example |
|------|-------------|---------|
| Form submission | User completes form | ECR request |
| Schedule | Time-based | Daily report |
| Event | System event | Order received |
| Condition | Data condition | Inventory low |

### Actions
| Type | Description | Example |
|------|-------------|---------|
| Approval | Yes/No decision | Manager approval |
| Task | Work to complete | Update document |
| Notification | Send message | Alert stakeholder |
| Integration | System action | Update ERP |

### Routing Rules
| Type | Description | Use Case |
|------|-------------|----------|
| Sequential | One after another | Approval chain |
| Parallel | Multiple simultaneous | Concurrent reviews |
| Conditional | Based on data | Amount threshold |
| Dynamic | Based on rules | Skill-based |

## Exception Handling

```yaml
exceptions:
  - condition: "assignee_unavailable"
    action: "reassign_to_backup"
  - condition: "sla_breach"
    action: "escalate_to_manager"
  - condition: "rejection"
    action: "return_to_initiator"
  - condition: "system_error"
    action: "notify_admin_and_retry"
```

## SLA Management

| Stage | SLA | Warning | Escalation |
|-------|-----|---------|------------|
| Initial Review | 2 days | 1.5 days | 2.5 days |
| Assessment | 5 days | 4 days | 6 days |
| Approval | 2 days | 1.5 days | 2.5 days |

## Audit Trail Requirements

- Who performed action
- When action occurred
- What was the action
- Previous state
- New state
- Supporting documentation

## Integration Points

- Document management systems
- ERP systems
- Email/messaging platforms
- Identity management
