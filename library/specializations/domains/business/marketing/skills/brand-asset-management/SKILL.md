---
name: brand-asset-management
description: Digital asset management and brand guideline enforcement tools
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
  category: Brand Strategy
  skill-id: SK-003
  dependencies:
    - Brandfolder API
    - Bynder API
---

# Brand Asset Management Skill

## Overview

The Brand Asset Management skill provides digital asset management and brand guideline enforcement capabilities. This skill enables centralized brand asset storage, distribution, and compliance monitoring across the organization.

## Capabilities

### Asset Management
- Brandfolder asset management
- Bynder DAM integration
- Asset version control
- Metadata and tagging
- Search and discovery

### Brand Guidelines
- Brand guideline documentation
- Digital style guide hosting
- Usage rules and restrictions
- Approval workflows
- Compliance checking

### Template Management
- Template library management
- Customizable branded templates
- Lock and edit controls
- Multi-format outputs
- Self-service access

### Distribution and Analytics
- Asset usage tracking
- Download analytics
- User access management
- Digital rights management
- Brand portal administration

## Usage

### DAM Configuration
```javascript
const damConfig = {
  platform: 'Brandfolder',
  structure: {
    collections: [
      { name: 'Logos', access: 'all-employees' },
      { name: 'Product Images', access: 'marketing-sales' },
      { name: 'Executive Photos', access: 'comms-only' },
      { name: 'Templates', access: 'all-employees' },
      { name: 'Campaign Assets', access: 'marketing' }
    ]
  },
  governance: {
    approval: { required: ['new-logos', 'executive-photos'] },
    expiration: { campaigns: '90-days', seasonal: '1-year' },
    restrictions: ['competitor-mentions', 'outdated-messaging']
  },
  guidelines: {
    logoUsage: { clearSpace: true, minSize: true, colorVariants: true },
    colorPalette: { primary: true, secondary: true, extended: true },
    typography: { fonts: true, hierarchy: true, webFonts: true },
    photography: { style: true, subjects: true, treatments: true }
  },
  analytics: {
    tracking: ['downloads', 'views', 'searches', 'shares'],
    reporting: 'monthly',
    alerts: ['high-usage', 'outdated-assets']
  }
};
```

## Process Integration

| Process | Integration Points |
|---------|-------------------|
| brand-guidelines-creation.js | Guidelines hosting |
| brand-architecture-design.js | Asset structure |
| campaign-creative-development.js | Asset access |

## Best Practices

1. **Central Repository**: Maintain single source of truth
2. **Clear Organization**: Intuitive folder and tagging structure
3. **Access Controls**: Appropriate permissions by role
4. **Version Management**: Clear versioning and archiving
5. **Usage Analytics**: Track and optimize asset utilization

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Adoption | Employees using DAM | >80% |
| Search Success | Successful asset finds | >90% |
| Compliance | Brand-compliant usage | >95% |
| Asset Currency | Assets up to date | 100% |

## Related Skills

- SK-004: Brand Tracking (brand health)
- SK-016: Creative Testing (creative assets)
- SK-011: Content Management (content assets)
