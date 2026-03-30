---
name: crm-integration
description: CRM data synchronization and sales-marketing alignment operations
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: marketing
  domain: business
  category: Marketing Analytics
  skill-id: SK-018
---

# CRM Integration Skill

## Overview

The CRM Integration Skill provides comprehensive capabilities for CRM data synchronization, sales-marketing alignment, and revenue attribution tracking. This skill enables seamless integration with major CRM platforms including Salesforce, HubSpot CRM, and Microsoft Dynamics 365, supporting lead management, contact synchronization, and pipeline reporting.

## Capabilities

### Salesforce CRM Connector
- Object configuration and custom fields
- Flow and process builder automation
- Apex trigger development support
- SOQL query construction
- Report and dashboard creation
- Permission set management
- Data loader operations
- API integration configuration

### HubSpot CRM Synchronization
- Contact and company properties
- Deal pipeline configuration
- Workflow automation setup
- Custom object configuration
- List and segment synchronization
- Form and landing page integration
- Sequence enrollment automation
- API webhook configuration

### Dynamics 365 Integration
- Entity customization
- Business process flows
- Power Automate integration
- Dataverse operations
- Custom connector development
- Security role configuration
- Dashboard and chart creation
- Plugin development support

### Lead Routing Configuration
- Round-robin assignment rules
- Territory-based routing
- Lead scoring threshold routing
- Account-based lead routing
- Real-time lead notification
- SLA monitoring and alerts
- Lead queue management
- Escalation rule configuration

### Contact Property Mapping
- Field mapping configuration
- Data transformation rules
- Validation rule setup
- Picklist value synchronization
- Multi-object relationship mapping
- Historical data migration
- Incremental sync configuration
- Conflict resolution rules

### Deal Stage Automation
- Stage progression rules
- Probability assignment
- Required field enforcement
- Stage duration tracking
- Forecast category mapping
- Close date automation
- Win/loss analysis triggers
- Revenue recognition rules

### Pipeline Reporting
- Pipeline stage analysis
- Velocity metrics tracking
- Conversion rate reporting
- Forecast accuracy analysis
- Pipeline coverage reporting
- Win rate trending
- Average deal size tracking
- Sales cycle duration analysis

### Attribution Data Sync
- First-touch attribution
- Multi-touch attribution models
- Campaign influence tracking
- Marketing source capture
- UTM parameter mapping
- Revenue attribution rollup
- ROI calculation automation
- Custom attribution model support

### Revenue Attribution Tracking
- Closed-won revenue allocation
- Campaign ROI calculation
- Marketing-influenced pipeline
- Revenue by source reporting
- Customer acquisition cost
- Lifetime value integration
- Cohort revenue analysis
- Attribution model comparison

## Process Integration

This skill integrates with the following marketing processes:

- **attribution-modeling-setup.js** - Revenue attribution and campaign influence
- **marketing-roi-analysis.js** - ROI calculation and pipeline reporting
- **customer-journey-analytics.js** - Sales touchpoint integration

## Dependencies

- Salesforce REST API / Bulk API
- HubSpot CRM API
- Microsoft Dynamics 365 Web API
- Marketing automation platform APIs
- Data warehouse connectors
- ETL/ELT tools

## Usage

### Salesforce Integration Setup

```yaml
skill: crm-integration
action: configure-salesforce
parameters:
  connection:
    auth_type: oauth2
    instance_url: "https://company.salesforce.com"
    api_version: "58.0"
  sync_configuration:
    objects:
      - name: Lead
        direction: bidirectional
        sync_fields:
          - FirstName
          - LastName
          - Email
          - Company
          - LeadSource
          - Marketing_Campaign__c
          - Lead_Score__c
        triggers:
          - on_create
          - on_update
      - name: Opportunity
        direction: crm_to_marketing
        sync_fields:
          - Name
          - Amount
          - StageName
          - CloseDate
          - Primary_Campaign__c
```

### Lead Routing Configuration

```yaml
skill: crm-integration
action: configure-lead-routing
parameters:
  platform: salesforce
  routing_rules:
    - name: "Enterprise Leads"
      criteria:
        Company_Size__c: ">= 1000"
        Annual_Revenue__c: ">= 10000000"
      assignment:
        type: queue
        queue_name: "Enterprise Sales Queue"
        notification: immediate
    - name: "SMB Leads"
      criteria:
        Company_Size__c: "< 100"
      assignment:
        type: round_robin
        user_pool: "SMB_Sales_Team"
        notification: digest
    - name: "Default"
      criteria: null
      assignment:
        type: queue
        queue_name: "General Sales Queue"
```

### Attribution Tracking Setup

```yaml
skill: crm-integration
action: configure-attribution
parameters:
  platform: hubspot
  attribution_model:
    type: multi-touch
    models:
      - first_touch:
          weight: 0.4
      - lead_creation:
          weight: 0.2
      - opportunity_creation:
          weight: 0.2
      - closed_won:
          weight: 0.2
  campaign_mapping:
    utm_source: "Traffic Source"
    utm_medium: "Marketing Channel"
    utm_campaign: "Campaign Name"
    utm_content: "Ad Variant"
  revenue_fields:
    deal_amount: Amount
    close_date: CloseDate
    influenced_revenue: Marketing_Influenced_Revenue__c
```

### Pipeline Reporting Configuration

```yaml
skill: crm-integration
action: create-pipeline-report
parameters:
  platform: salesforce
  report_name: "Marketing-Influenced Pipeline"
  filters:
    - field: StageName
      operator: not_equals
      value: "Closed Lost"
    - field: Marketing_Touch_Count__c
      operator: greater_than
      value: 0
  groupings:
    - field: LeadSource
    - field: StageName
  metrics:
    - field: Amount
      aggregation: sum
      label: "Pipeline Value"
    - field: Id
      aggregation: count
      label: "Deal Count"
    - formula: "SUM(Amount) / COUNT(Id)"
      label: "Average Deal Size"
  schedule:
    frequency: weekly
    recipients:
      - marketing-leadership@company.com
```

### Data Synchronization

```yaml
skill: crm-integration
action: sync-contacts
parameters:
  source: hubspot
  destination: salesforce
  mapping:
    hubspot_property: salesforce_field
    email: Email
    firstname: FirstName
    lastname: LastName
    company: Company
    phone: Phone
    lifecyclestage: Lead_Status__c
    hs_lead_status: Status
  sync_rules:
    direction: bidirectional
    conflict_resolution: most_recent
    frequency: real-time
    batch_size: 100
  filters:
    - property: lifecyclestage
      values: [subscriber, lead, marketingqualifiedlead, salesqualifiedlead]
```

## Best Practices

1. **Data Hygiene**: Implement deduplication and validation rules
2. **Field Mapping**: Document all field mappings and transformations
3. **Sync Frequency**: Balance real-time needs with API limits
4. **Error Handling**: Configure alerts for sync failures
5. **Testing**: Use sandbox environments for integration testing
6. **Attribution**: Define attribution models before implementation
7. **Privacy**: Ensure GDPR/CCPA compliance in data syncing
8. **Documentation**: Maintain integration documentation and data dictionary

## Related Skills

- SK-005: Marketing Analytics Platform
- SK-014: BI and Dashboard Platform
- SK-015: Customer Data Platform

## Related Agents

- AG-008: Marketing Analytics Director
- AG-011: Marketing Operations Manager
