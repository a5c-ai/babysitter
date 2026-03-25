---
name: conga-cpq
description: Conga CPQ Configure-Price-Quote integration for complex pricing
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: sales
  domain: business
  priority: P2
  integration-points:
    - Conga CPQ API
---

# Conga CPQ

## Overview

The Conga CPQ skill provides integration with Conga's Configure-Price-Quote solution for complex product configuration, dynamic pricing rules, quote document generation, and approval workflow management. This skill ensures accurate, compliant quotes for sophisticated product offerings.

## Capabilities

### Product Configuration
- Configure complex product bundles
- Handle product dependencies and rules
- Validate configuration completeness
- Support guided selling workflows

### Dynamic Pricing
- Apply pricing rules and tiers
- Calculate volume and term discounts
- Handle currency and localization
- Enforce margin thresholds

### Quote Document Generation
- Generate professional quote documents
- Include terms and conditions
- Support multiple output formats
- Maintain version control

### Approval Workflows
- Trigger approval processes
- Route based on deal criteria
- Track approval status
- Handle escalation rules

## Usage

### Quote Configuration
```
Configure a complex product bundle with appropriate options and pricing for a specific customer scenario.
```

### Approval Management
```
Submit a quote requiring discount approval and track progress through the approval chain.
```

### Document Generation
```
Generate a formal quote document with all configured products, pricing, and terms.
```

## Enhances Processes

- value-selling-roi
- compensation-plan-design
- quota-setting-allocation

## Dependencies

- Conga CPQ subscription
- Product catalog configuration
- CRM integration (typically Salesforce)
