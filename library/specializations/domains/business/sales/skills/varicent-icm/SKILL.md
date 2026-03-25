---
name: varicent-icm
description: Varicent incentive compensation management platform
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
    - Varicent API
---

# Varicent ICM

## Overview

The Varicent ICM skill provides integration with Varicent's (formerly IBM) incentive compensation management platform for plan administration, commission calculations, territory management, and performance analytics. This skill ensures enterprise-grade compensation management with robust audit capabilities.

## Capabilities

### Plan Administration
- Manage compensation plan configurations
- Handle plan versioning and effective dates
- Configure rate tables and tiers
- Maintain participant assignments

### Commission Calculations
- Execute commission calculations
- Process complex crediting rules
- Handle adjustments and corrections
- Generate payment files

### Territory Management
- Define and manage territories
- Assign accounts to territories
- Track territory changes
- Handle overlay and split rules

### Performance Analytics
- Generate performance reports
- Track attainment metrics
- Analyze plan effectiveness
- Support audit requirements

## Usage

### Plan Configuration
```
Configure a new compensation plan with appropriate rate tables, accelerators, and crediting rules.
```

### Commission Processing
```
Execute commission calculations for a pay period and generate payment files for processing.
```

### Territory Updates
```
Update territory assignments based on organizational changes and track impact on compensation.
```

## Enhances Processes

- compensation-plan-design
- quota-setting-allocation

## Dependencies

- Varicent subscription
- Plan design completion
- Integration with payroll systems
