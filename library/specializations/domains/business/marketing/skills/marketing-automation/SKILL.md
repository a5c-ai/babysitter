---
name: marketing-automation
description: Marketing automation platform operations and workflow design
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
  category: Digital Marketing
  skill-id: SK-006
  dependencies:
    - HubSpot API
    - Marketo API
    - Salesforce Marketing Cloud API
---

# Marketing Automation Platform Skill

## Overview

The Marketing Automation Platform skill provides marketing automation platform operations and workflow design capabilities. This skill enables sophisticated lead nurturing, behavioral automation, and marketing campaign orchestration.

## Capabilities

### Platform Operations
- HubSpot workflow builder
- Marketo smart campaign configuration
- Pardot automation setup
- Salesforce Marketing Cloud journeys
- Cross-platform orchestration

### Lead Nurturing
- Lead nurturing sequence design
- Drip campaign creation
- Lead scoring configuration
- Lifecycle stage automation
- Sales handoff workflows

### Personalization
- Behavioral trigger configuration
- Dynamic content personalization
- Segmentation-based targeting
- Real-time personalization
- Multi-channel coordination

### Testing and Optimization
- A/B testing automation
- Multivariate testing
- Send time optimization
- Subject line testing
- Workflow performance analysis

## Usage

### Automation Workflow
```javascript
const automationWorkflow = {
  platform: 'HubSpot',
  name: 'Lead Nurture - Demo Request',
  trigger: {
    event: 'form_submission',
    form: 'demo-request'
  },
  enrollment: {
    criteria: { lifecycleStage: 'lead', country: 'US' },
    suppressions: ['existing_customers', 'competitors']
  },
  steps: [
    { delay: '0h', action: 'send_email', template: 'demo-confirmation' },
    { delay: '2h', action: 'assign_owner', method: 'round-robin' },
    { delay: '24h', action: 'send_email', template: 'resource-followup', condition: 'not_replied' },
    { delay: '72h', action: 'send_email', template: 'case-study', condition: 'not_engaged' },
    { delay: '7d', action: 'update_property', property: 'nurture_status', value: 'completed' }
  ],
  exitCriteria: [
    { event: 'became_customer' },
    { event: 'replied_to_email' },
    { event: 'booked_meeting' }
  ],
  scoring: {
    emailOpen: 5,
    emailClick: 10,
    pageVisit: 3,
    contentDownload: 15
  }
};
```

## Process Integration

| Process | Integration Points |
|---------|-------------------|
| email-marketing-automation.js | Automation execution |
| ab-testing-program.js | Testing automation |
| campaign-performance-analysis.js | Performance tracking |

## Best Practices

1. **Journey Mapping**: Design automations around customer journeys
2. **Segmentation**: Target the right audiences
3. **Testing Culture**: Always test and optimize
4. **Deliverability Focus**: Maintain email sender reputation
5. **Sales Alignment**: Coordinate handoffs with sales

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Automation Coverage | Leads in nurture | >70% |
| Engagement Rate | Email engagement | >20% |
| Conversion Rate | Automation conversions | Improving |
| Deliverability | Email deliverability | >95% |

## Related Skills

- SK-013: Email Marketing (email operations)
- SK-015: Customer Data Platform (data activation)
- SK-018: CRM Integration (sales alignment)
