---
name: content-management
description: CMS operations and content optimization tools
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
  category: Content Marketing
  skill-id: SK-011
  dependencies:
    - WordPress API
    - Contentful API
    - HubSpot CMS API
---

# Content Management Skill

## Overview

The Content Management skill provides CMS operations and content optimization capabilities. This skill enables efficient content creation, publishing, and multi-channel distribution through integrated CMS platforms.

## Capabilities

### CMS Operations
- WordPress API operations
- Contentful content management
- HubSpot CMS configuration
- Headless CMS integration
- Multi-site management

### Content Publishing
- Content scheduling and publishing
- Multi-channel publishing
- Content versioning
- Workflow management
- Approval processes

### Content Optimization
- SEO metadata management
- Image optimization
- Mobile optimization
- Performance optimization
- Accessibility compliance

### Governance
- Editorial workflow management
- Content calendaring
- Author management
- Taxonomy and tagging
- Content lifecycle management

## Usage

### CMS Configuration
```javascript
const cmsConfig = {
  platform: 'Contentful',
  spaces: {
    marketing: {
      contentTypes: ['blogPost', 'landingPage', 'caseStudy', 'whitepaper'],
      environments: ['development', 'staging', 'production']
    }
  },
  workflow: {
    stages: ['draft', 'review', 'approved', 'published', 'archived'],
    roles: {
      author: ['create', 'edit-own'],
      editor: ['edit-all', 'review'],
      publisher: ['publish', 'archive']
    },
    automation: {
      reviewNotification: true,
      publishScheduling: true,
      expirationAlerts: true
    }
  },
  publishing: {
    channels: ['website', 'blog', 'resource-center', 'email'],
    scheduling: {
      enabled: true,
      timezone: 'America/New_York',
      reviewBuffer: '24h'
    }
  },
  seo: {
    metaFields: ['title', 'description', 'keywords', 'ogImage'],
    validation: {
      titleLength: { min: 30, max: 60 },
      descriptionLength: { min: 120, max: 160 }
    }
  }
};
```

## Process Integration

| Process | Integration Points |
|---------|-------------------|
| content-production-workflow.js | Publishing workflow |
| editorial-calendar-management.js | Content scheduling |
| content-performance-optimization.js | Content updates |

## Best Practices

1. **Workflow Clarity**: Define clear content workflows
2. **Metadata Discipline**: Always complete SEO metadata
3. **Version Control**: Maintain content versioning
4. **Multi-Channel**: Plan for all distribution channels
5. **Performance**: Optimize for speed and mobile

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Publishing Velocity | Content published per week | Meeting plan |
| Workflow Efficiency | Draft to publish time | <5 days |
| SEO Compliance | Content with complete SEO | 100% |
| Page Performance | Load time | <3 seconds |

## Related Skills

- SK-012: Content Optimization (content quality)
- SK-009: Social Media Management (distribution)
- SK-017: Marketing Project Management (planning)
