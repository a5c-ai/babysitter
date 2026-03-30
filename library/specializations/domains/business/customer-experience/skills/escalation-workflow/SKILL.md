---
name: escalation-workflow
description: Automated escalation path determination and workflow execution
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: customer-experience
  domain: business
  category: Support Operations
  id: SK-014
---

# Escalation Workflow Skill

## Overview

The Escalation Workflow skill provides automated escalation path determination, notification generation, and workflow execution for support and customer success operations. This skill ensures that complex or high-priority issues are routed to appropriate escalation tiers with proper documentation, tracking, and SLA monitoring.

## Capabilities

### Escalation Level Determination
- Evaluate issue severity and impact
- Apply escalation rules and criteria
- Determine appropriate escalation tier
- Consider customer segment and priority
- Factor in historical escalation patterns
- Calculate escalation urgency scores

### Notification Generation
- Generate escalation alerts to relevant parties
- Create escalation handoff documentation
- Produce management notification summaries
- Send customer escalation confirmations
- Trigger on-call and pager integrations
- Compose executive briefing communications

### Progress and Aging Tracking
- Track escalation progress through stages
- Monitor escalation age and elapsed time
- Generate aging alerts and reminders
- Track owner assignments and transitions
- Maintain escalation audit trails
- Report on stuck or stalled escalations

### Escalation Metrics Calculation
- Calculate escalation rates by category
- Measure mean time to escalation resolution
- Track escalation volume trends
- Analyze escalation causes and patterns
- Generate escalation performance dashboards
- Benchmark against escalation targets

### Handoff Documentation
- Generate structured handoff briefs
- Document troubleshooting steps completed
- Capture customer communication history
- Compile relevant technical details
- Include reproduction steps and evidence
- Create executive summary for stakeholders

### SLA Monitoring
- Track escalation-specific SLAs
- Generate SLA breach warnings
- Monitor response time compliance
- Calculate time remaining to breach
- Trigger escalation for SLA risks
- Report SLA performance by tier

### De-escalation Support
- Generate de-escalation recommendations
- Track resolution criteria completion
- Document de-escalation decisions
- Notify stakeholders of de-escalation
- Archive escalation records
- Update customer on resolution

## Usage

### Determine Escalation Level
```yaml
skill: escalation-workflow
action: determine-escalation
parameters:
  issue:
    id: "TICKET-12345"
    severity: high
    impact: multiple_customers
    duration_hours: 4
    current_tier: 1
  customer:
    segment: enterprise
    health_score: 45
    contract_value: 500000
  context:
    previous_escalations: 2
    customer_sentiment: frustrated
```

### Generate Escalation Notification
```yaml
skill: escalation-workflow
action: generate-notification
parameters:
  escalation_id: "ESC-2025-001"
  notification_type: tier2_handoff
  recipients:
    - role: tier2_lead
    - role: account_csm
    - role: support_manager
  include:
    - issue_summary
    - customer_context
    - troubleshooting_history
    - recommended_actions
  urgency: high
```

### Track Escalation Progress
```yaml
skill: escalation-workflow
action: track-progress
parameters:
  escalation_id: "ESC-2025-001"
  update:
    status: in_progress
    owner: "engineer@company.com"
    actions_taken:
      - "Reviewed logs and identified memory leak"
      - "Applied temporary workaround"
    next_steps: "Deploy patch in next maintenance window"
    estimated_resolution: "2025-01-25T10:00:00Z"
```

### Calculate Escalation Metrics
```yaml
skill: escalation-workflow
action: calculate-metrics
parameters:
  date_range:
    start: "2025-01-01"
    end: "2025-01-31"
  dimensions:
    - escalation_tier
    - issue_category
    - customer_segment
  metrics:
    - escalation_count
    - mttr_escalations
    - escalation_rate
    - sla_compliance
```

### Generate De-escalation Recommendation
```yaml
skill: escalation-workflow
action: recommend-deescalation
parameters:
  escalation_id: "ESC-2025-001"
  resolution:
    root_cause: "Memory leak in v2.3.4"
    fix_applied: "Patch deployed v2.3.5"
    customer_confirmation: true
    monitoring_period_complete: true
  recommendation:
    action: de-escalate
    rationale: "Issue resolved, customer confirmed, stable for 48 hours"
```

## Process Integration

This skill integrates with the following customer experience processes:

| Process | Integration Points |
|---------|-------------------|
| escalation-management.js | Core escalation workflow, tier routing, stakeholder notification |
| itil-incident-management.js | Major incident escalation, P1 workflows, bridge management |
| ticket-triage-routing.js | Initial escalation triggers, priority-based escalation |
| sla-management.js | SLA breach escalation, response time alerts, compliance tracking |

## Escalation Tier Model

The skill supports configurable escalation tier models:

| Tier | Criteria | Response Target | Stakeholders |
|------|----------|-----------------|--------------|
| Tier 1 | Standard issues | 4 hours | Support Agent |
| Tier 2 | Complex technical | 2 hours | Senior Engineer |
| Tier 3 | Critical/Multi-customer | 1 hour | Engineering Lead, CSM |
| Tier 4 | Business critical | 30 minutes | Director, VP, Executive |

## Dependencies

- Escalation rules engine configuration
- Notification system integration (email, Slack, PagerDuty)
- Ticketing system integration for status sync
- On-call schedule access
- Customer segment and priority data
- SLA configuration definitions

## Best Practices

1. **Clear Criteria**: Define explicit escalation criteria to avoid subjective decisions
2. **Documentation**: Ensure thorough handoff documentation at each tier transition
3. **Customer Communication**: Keep customers informed throughout escalation
4. **Root Cause Tracking**: Document root causes to improve future triage
5. **Metrics Review**: Regularly review escalation metrics for process improvement
6. **Runbook Integration**: Link to relevant runbooks and troubleshooting guides

## Shared Potential

This skill has applicability to related domains:
- IT Service Management
- DevOps/SRE Incident Response
- Security Incident Response
- Operations Management
