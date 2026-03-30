---
name: crm-integration
description: Deep integration with CRM platforms for customer data and actions
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
  id: SK-010
---

# CRM Integration Skill

## Overview

The CRM Integration skill provides deep integration capabilities with major Customer Relationship Management platforms including Salesforce, HubSpot, and Microsoft Dynamics. This skill enables automated customer data access, record management, activity logging, and workflow triggering across CRM systems to support customer success and support operations.

## Capabilities

### Customer Record Management
- Query customer records and account history
- Create and update accounts, contacts, and opportunities
- Retrieve customer interaction timelines
- Access relationship hierarchies and org charts
- Manage custom fields and record types

### Activity and Interaction Logging
- Log activities and customer interactions automatically
- Track touchpoint history across channels
- Record meeting notes and call summaries
- Document customer communications
- Sync interaction data from external systems

### Health Data Synchronization
- Sync customer health scores to CRM records
- Update risk indicators and health trends
- Propagate health alerts to account teams
- Maintain health score history
- Correlate health data with CRM activities

### Reporting and Dashboards
- Generate CRM reports for customer segments
- Build account health dashboards
- Create pipeline and renewal reports
- Extract customer analytics data
- Produce executive summary views

### Workflow Automation
- Trigger CRM workflows and automations
- Initiate approval processes
- Execute playbook actions
- Manage task assignments
- Coordinate multi-step processes

### Multi-Platform Support
- Salesforce integration (REST and SOAP APIs)
- HubSpot integration (CRM and Marketing)
- Microsoft Dynamics 365 integration
- Custom CRM adapter framework
- API authentication management

## Usage

### Basic Customer Query
```yaml
skill: crm-integration
action: query-customer
parameters:
  platform: salesforce
  account_id: "0015000000ABC123"
  include:
    - contacts
    - opportunities
    - activities
    - health_score
```

### Log Customer Interaction
```yaml
skill: crm-integration
action: log-activity
parameters:
  platform: hubspot
  contact_id: "123456"
  activity_type: call
  subject: "Quarterly check-in call"
  description: "Discussed product roadmap and upcoming renewal"
  outcome: positive
```

### Sync Health Score
```yaml
skill: crm-integration
action: sync-health-score
parameters:
  platform: salesforce
  account_id: "0015000000ABC123"
  health_score: 78
  risk_level: medium
  indicators:
    engagement: declining
    support_tickets: elevated
    nps_response: promoter
```

### Trigger Workflow
```yaml
skill: crm-integration
action: trigger-workflow
parameters:
  platform: dynamics
  workflow_name: "At-Risk Account Playbook"
  record_id: "account-guid-123"
  context:
    trigger_reason: "Health score dropped below 60"
    assigned_csm: "user-guid-456"
```

## Process Integration

This skill integrates with the following customer experience processes:

| Process | Integration Points |
|---------|-------------------|
| customer-onboarding.js | Customer record creation, milestone tracking, activity logging |
| customer-health-scoring.js | Health score sync, risk indicator updates, alert propagation |
| qbr-preparation.js | Customer data retrieval, activity history, renewal pipeline |
| churn-prevention.js | Risk account identification, intervention tracking, save workflow |

## Dependencies

- CRM platform API credentials (OAuth 2.0 or API keys)
- Network access to CRM endpoints
- Rate limiting awareness for API quotas
- Field mapping configuration per CRM instance
- Custom object schema definitions

## Best Practices

1. **Authentication Security**: Store CRM credentials securely and use refresh tokens appropriately
2. **Rate Limiting**: Implement exponential backoff for API rate limits
3. **Data Validation**: Validate data before CRM updates to prevent field errors
4. **Bulk Operations**: Use bulk APIs for large data syncs to improve performance
5. **Error Handling**: Implement comprehensive error handling for API failures
6. **Audit Trail**: Maintain logs of all CRM modifications for compliance

## Shared Potential

This skill is a strong candidate for extraction to a shared library with applicability to:
- Sales Operations
- Marketing Automation
- Revenue Operations
- Account Management
