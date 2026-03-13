---
name: support-platform-integration
description: Integration with support and ticketing platforms
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: customer-experience
  domain: business
  category: Integration
  id: SK-011
---

# Support Platform Integration Skill

## Overview

The Support Platform Integration skill provides comprehensive integration capabilities with major support and ticketing platforms including Zendesk, Freshdesk, and ServiceNow. This skill enables automated ticket management, workflow execution, conversation history access, and knowledge base synchronization to streamline support operations.

## Capabilities

### Ticket Management
- Create, update, and query tickets
- Set ticket priority and severity levels
- Assign tickets to agents or teams
- Update ticket status and resolution
- Manage ticket custom fields and tags
- Link related tickets and parent/child relationships

### Workflow and Automation
- Manage ticket workflows and state transitions
- Trigger platform automations and triggers
- Execute macros and response templates
- Initiate escalation workflows
- Coordinate multi-step resolution processes

### Conversation History Access
- Access complete customer conversation history
- Retrieve ticket thread and comments
- Pull customer interaction timeline
- Search historical tickets by criteria
- Export conversation transcripts

### Automation and Macros
- Trigger predefined automations
- Execute response macros
- Apply ticket routing rules
- Initiate SLA countdown triggers
- Manage auto-response configurations

### Analytics and Reporting
- Generate support analytics reports
- Extract ticket volume and trend data
- Pull agent performance metrics
- Calculate SLA compliance statistics
- Create custom report exports

### Knowledge Base Synchronization
- Sync knowledge base articles
- Create and update KB content
- Manage article categories and tags
- Track article usage and feedback
- Maintain version history

### Multi-Platform Support
- Zendesk Support and Guide integration
- Freshdesk and Freshservice integration
- ServiceNow ITSM integration
- Jira Service Management integration
- Custom ticketing system adapters

## Usage

### Create Support Ticket
```yaml
skill: support-platform-integration
action: create-ticket
parameters:
  platform: zendesk
  ticket:
    subject: "Unable to access dashboard after password reset"
    description: "Customer reports 403 error when accessing main dashboard"
    requester_email: "customer@example.com"
    priority: high
    type: incident
    tags:
      - access-issue
      - dashboard
    custom_fields:
      product_area: analytics
      customer_tier: enterprise
```

### Query Ticket History
```yaml
skill: support-platform-integration
action: query-tickets
parameters:
  platform: freshdesk
  filters:
    requester_id: "123456"
    status: [open, pending, resolved]
    created_after: "2025-01-01"
  include:
    - conversations
    - satisfaction_rating
    - time_entries
  limit: 50
```

### Execute Macro
```yaml
skill: support-platform-integration
action: execute-macro
parameters:
  platform: zendesk
  ticket_id: "987654"
  macro_id: "escalate_to_tier2"
  comment: "Escalating per customer request for senior engineer"
```

### Sync Knowledge Article
```yaml
skill: support-platform-integration
action: sync-kb-article
parameters:
  platform: servicenow
  article:
    title: "How to Reset Two-Factor Authentication"
    category: "Account Security"
    content_markdown: |
      ## Steps to Reset 2FA
      1. Navigate to Security Settings
      2. Click "Reset 2FA"
      ...
    status: published
    visibility: public
```

### Generate Support Report
```yaml
skill: support-platform-integration
action: generate-report
parameters:
  platform: zendesk
  report_type: sla_compliance
  date_range:
    start: "2025-01-01"
    end: "2025-01-31"
  group_by: team
  metrics:
    - first_response_time
    - resolution_time
    - breach_count
```

## Process Integration

This skill integrates with the following customer experience processes:

| Process | Integration Points |
|---------|-------------------|
| ticket-triage-routing.js | Ticket creation, priority assignment, routing automation |
| escalation-management.js | Workflow transitions, tier assignments, escalation tracking |
| sla-management.js | SLA timer management, breach alerts, compliance reporting |
| itil-incident-management.js | Incident tickets, major incident workflows, PIR tracking |

## Dependencies

- Support platform API credentials (API tokens or OAuth)
- Webhook configuration for real-time events
- Rate limiting awareness for API quotas
- Custom field mapping configurations
- Agent and team ID mappings

## Best Practices

1. **Idempotency**: Design operations to be safely retryable
2. **Webhook Reliability**: Implement webhook verification and retry handling
3. **Rate Limiting**: Monitor API usage and implement throttling
4. **Data Privacy**: Filter PII from logs and external syncs
5. **Bulk Operations**: Use batch APIs for high-volume operations
6. **Testing**: Use sandbox environments for integration testing

## Shared Potential

This skill is a strong candidate for extraction to a shared library with applicability to:
- DevOps/SRE (incident management)
- IT Operations
- Internal Helpdesk
- Product Support
