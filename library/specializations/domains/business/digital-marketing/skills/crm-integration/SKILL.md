---
name: crm-integration
description: CRM data synchronization and lead management across marketing and sales platforms
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: digital-marketing
  domain: business
  category: Marketing Automation
  skill-id: SK-016
  dependencies:
    - Salesforce API
    - HubSpot CRM API
---

# CRM Integration Skill

## Overview

The CRM Integration skill provides comprehensive capabilities for synchronizing data between marketing automation platforms and CRM systems, managing lead routing, and ensuring seamless handoffs between marketing and sales teams. This skill enables effective lead lifecycle management and attribution tracking across the customer journey.

## Capabilities

### Salesforce Marketing Cloud Connector
- Marketing Cloud to Sales Cloud sync
- Journey Builder integration
- Contact and lead synchronization
- Campaign member management
- Custom object mapping
- Real-time data sync configuration
- Error handling and retry logic
- Field mapping validation

### HubSpot CRM Synchronization
- Bi-directional contact sync
- Company and deal synchronization
- Marketing event tracking
- Form submission routing
- List membership sync
- Property mapping configuration
- Workflow triggers from CRM events
- Integration health monitoring

### Lead Routing Configuration
- Round-robin assignment rules
- Territory-based routing
- Score-based assignment
- Capacity-based distribution
- Time-zone aware routing
- Escalation rules setup
- Backup assignment logic
- SLA tracking integration

### Contact Property Mapping
- Standard field mapping
- Custom field synchronization
- Data transformation rules
- Default value configuration
- Required field validation
- Multi-value field handling
- Picklist value mapping
- Date/time format conversion

### Deal Stage Automation
- Stage progression triggers
- Automated notifications
- Task creation on stage change
- Email sequence triggers
- Revenue forecasting updates
- Win/loss analysis automation
- Pipeline velocity tracking
- Stage duration monitoring

### Sales Handoff Workflows
- MQL to SQL transition rules
- Sales notification configuration
- Lead assignment automation
- Contextual data packaging
- Meeting scheduling integration
- Follow-up task creation
- Handoff SLA tracking
- Feedback loop automation

### Pipeline Reporting
- Pipeline stage analysis
- Conversion rate tracking
- Revenue attribution
- Velocity metrics
- Forecast accuracy
- Win rate by source
- Deal size analysis
- Time-in-stage reporting

### Attribution Data Sync
- Multi-touch attribution data
- First-touch source tracking
- Campaign influence tracking
- Revenue attribution sync
- ROI calculation data
- Channel contribution metrics
- Conversion path data
- Attribution model sync

### Custom Object Management
- Custom object creation
- Relationship configuration
- Record type management
- Page layout customization
- Validation rule setup
- Trigger configuration
- Data migration support
- Schema documentation

## Usage

### Lead Routing Configuration
```javascript
const leadRoutingConfig = {
  routingType: 'score-based',
  rules: [
    {
      condition: 'leadScore >= 80',
      assignment: 'enterprise-team',
      method: 'round-robin'
    },
    {
      condition: 'leadScore >= 50 && leadScore < 80',
      assignment: 'mid-market-team',
      method: 'capacity-based'
    },
    {
      condition: 'leadScore < 50',
      assignment: 'nurture-queue',
      method: 'auto-enroll'
    }
  ],
  escalation: {
    timeout: '4h',
    action: 'reassign-to-manager'
  },
  notifications: {
    newLead: true,
    reassignment: true,
    escalation: true
  }
};
```

### Field Mapping Configuration
```javascript
const fieldMapping = {
  source: 'hubspot',
  destination: 'salesforce',
  mappings: [
    {
      sourceField: 'email',
      destField: 'Email',
      type: 'direct'
    },
    {
      sourceField: 'company',
      destField: 'Company',
      type: 'direct'
    },
    {
      sourceField: 'lifecyclestage',
      destField: 'Lead_Status__c',
      type: 'transform',
      transformRules: {
        'subscriber': 'New',
        'lead': 'Open',
        'marketingqualifiedlead': 'MQL',
        'salesqualifiedlead': 'SQL',
        'opportunity': 'Working',
        'customer': 'Closed Won'
      }
    },
    {
      sourceField: 'hs_lead_score',
      destField: 'Lead_Score__c',
      type: 'direct',
      defaultValue: 0
    }
  ],
  syncDirection: 'bidirectional',
  conflictResolution: 'most-recent-wins'
};
```

### Attribution Sync Configuration
```javascript
const attributionSync = {
  model: 'multi-touch',
  touchpoints: [
    'first-touch',
    'lead-creation',
    'opportunity-creation',
    'closed-won'
  ],
  dataSync: {
    campaigns: true,
    sources: true,
    mediums: true,
    content: true,
    revenue: true
  },
  syncFrequency: 'real-time',
  lookbackWindow: '90d'
};
```

### Sales Handoff Workflow
```javascript
const salesHandoff = {
  trigger: {
    type: 'score-threshold',
    value: 75
  },
  actions: [
    {
      type: 'update-lifecycle',
      value: 'SQL'
    },
    {
      type: 'assign-owner',
      method: 'territory-based'
    },
    {
      type: 'create-task',
      taskType: 'follow-up-call',
      dueIn: '24h',
      priority: 'high'
    },
    {
      type: 'send-notification',
      channel: 'slack',
      template: 'new-sql-alert'
    },
    {
      type: 'enroll-sequence',
      sequence: 'sales-outreach-sequence'
    }
  ],
  sla: {
    firstContact: '4h',
    escalation: 'manager'
  }
};
```

## Process Integration

This skill integrates with the following digital marketing processes:

| Process | Integration Points |
|---------|-------------------|
| lead-scoring.js | Score sync, MQL triggers, routing rules |
| marketing-automation-workflow.js | Workflow triggers, contact sync, attribution |
| attribution-measurement.js | Revenue attribution, campaign influence, ROI tracking |

## Best Practices

1. **Data Hygiene**: Implement deduplication rules before sync to prevent duplicate records
2. **Field Mapping**: Document all field mappings and transformation rules thoroughly
3. **Error Handling**: Configure robust error handling with retry logic and alerting
4. **Sync Frequency**: Balance real-time needs with API limits and system performance
5. **Testing**: Always test integrations in sandbox environments before production
6. **Monitoring**: Set up dashboards to monitor sync health and data quality
7. **SLA Tracking**: Define and track SLAs for lead response times
8. **Feedback Loops**: Create mechanisms for sales to provide feedback on lead quality
9. **Attribution**: Ensure attribution data flows correctly across systems
10. **Documentation**: Maintain up-to-date documentation of all integration configurations

## Common Integration Patterns

### HubSpot to Salesforce
```
HubSpot Contact -> Salesforce Lead
HubSpot Company -> Salesforce Account
HubSpot Deal -> Salesforce Opportunity
HubSpot Form Submission -> Salesforce Campaign Member
```

### Salesforce to HubSpot
```
Salesforce Lead Status -> HubSpot Lifecycle Stage
Salesforce Opportunity Stage -> HubSpot Deal Stage
Salesforce Campaign -> HubSpot Campaign
Salesforce Task/Activity -> HubSpot Engagement
```

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Sync Success Rate | Percentage of successful syncs | >99.5% |
| Lead Response Time | Time from MQL to first sales contact | <4 hours |
| Data Quality Score | Completeness and accuracy of synced data | >95% |
| Attribution Coverage | Percentage of revenue with attribution data | >90% |
| Handoff Completion | Successful marketing to sales handoffs | >98% |
| Integration Uptime | System availability | >99.9% |

## Related Skills

- SK-006: Email Marketing Platforms (contact sync, engagement data)
- SK-007: Marketing Automation (workflow integration)
- SK-017: BI and Reporting (pipeline reporting)
