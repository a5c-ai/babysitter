---
name: marketing-project-management
description: Marketing workflow and project management integration
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
  category: Campaign Management
  skill-id: SK-017
  dependencies:
    - Asana API
    - Monday.com API
    - Workfront API
---

# Marketing Project Management Platform Skill

## Overview

The Marketing Project Management Platform skill provides marketing workflow and project management integration capabilities. This skill enables efficient campaign coordination, resource management, and marketing operations optimization.

## Capabilities

### Project Management
- Asana project management
- Monday.com workflow automation
- Workfront campaign management
- Wrike task coordination
- Cross-platform integration

### Campaign Planning
- Campaign calendar coordination
- Timeline and milestone tracking
- Resource allocation
- Dependency management
- Critical path analysis

### Workflow Automation
- Approval workflow automation
- Creative brief management
- Review and feedback processes
- Status updates and notifications
- Template standardization

### Operations
- Budget tracking
- Resource capacity planning
- Vendor management coordination
- Cross-functional collaboration
- Performance reporting

## Usage

### Campaign Project Setup
```javascript
const campaignProject = {
  platform: 'Asana',
  project: {
    name: 'Q1 2026 Product Launch Campaign',
    type: 'integrated-campaign',
    owner: 'Campaign Manager',
    dates: {
      planning: '2025-12-01 to 2025-12-31',
      production: '2026-01-01 to 2026-01-31',
      launch: '2026-02-01',
      execution: '2026-02-01 to 2026-03-31'
    }
  },
  workstreams: [
    {
      name: 'Strategy & Planning',
      tasks: ['Brief creation', 'Audience definition', 'Channel selection', 'Budget allocation']
    },
    {
      name: 'Creative Development',
      tasks: ['Creative brief', 'Concept development', 'Design production', 'Review & approval']
    },
    {
      name: 'Media & Channels',
      tasks: ['Media planning', 'Channel setup', 'Launch execution', 'Optimization']
    },
    {
      name: 'Measurement',
      tasks: ['Tracking setup', 'Dashboard creation', 'Weekly reporting', 'Post-campaign analysis']
    }
  ],
  resources: {
    internal: ['Brand Manager', 'Digital Manager', 'Content Lead', 'Designer'],
    external: ['Creative Agency', 'Media Agency', 'Production Vendor']
  },
  approvals: {
    creative: ['Brand Director', 'Legal'],
    budget: ['VP Marketing', 'Finance'],
    launch: ['CMO']
  },
  templates: {
    brief: 'campaign-brief-template',
    status: 'weekly-status-template',
    postMortem: 'campaign-review-template'
  }
};
```

## Process Integration

| Process | Integration Points |
|---------|-------------------|
| integrated-campaign-planning.js | Campaign coordination |
| editorial-calendar-management.js | Content scheduling |
| content-production-workflow.js | Production management |

## Best Practices

1. **Standardize Templates**: Use consistent project templates
2. **Clear Ownership**: Define roles and responsibilities
3. **Realistic Timelines**: Build in buffer for reviews
4. **Status Visibility**: Keep stakeholders informed
5. **Post-Mortems**: Learn from every campaign

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| On-Time Delivery | Campaigns launched on schedule | >90% |
| Resource Utilization | Team capacity usage | 80-90% |
| Approval Cycle | Brief to launch time | Improving |
| Budget Accuracy | Actual vs. planned | Within 5% |

## Related Skills

- SK-003: Brand Asset Management (asset management)
- SK-011: Content Management (content workflow)
- SK-014: BI Dashboards (reporting)
