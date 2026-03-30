---
name: dynamics365-connector
description: Microsoft Dynamics 365 Sales integration with Power Platform support
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
  priority: P1
  integration-points:
    - Dynamics 365 Web API
    - OData
---

# Dynamics 365 Connector

## Overview

The Dynamics 365 Connector skill provides comprehensive integration with Microsoft Dynamics 365 Sales, enabling entity data management, business process flow interaction, and seamless Power Platform integration. This skill leverages Azure AD authentication for secure enterprise-grade connectivity.

## Capabilities

### Entity Data Management
- Full CRUD operations on accounts, contacts, and opportunities
- Access leads, quotes, orders, and invoices
- Handle custom entities and relationships
- Manage entity metadata and option sets

### Business Process Flows
- Interact with active business process flows
- Move records through process stages
- Access stage requirements and validation rules
- Track process instance history

### Power Platform Integration
- Trigger Power Automate flows
- Access Dataverse tables
- Integrate with Power BI datasets
- Leverage AI Builder models

### Authentication & Security
- Azure AD authentication handling
- Role-based security awareness
- Business unit hierarchy respect
- Field-level security compliance

## Usage

### Opportunity Management
```
Retrieve all opportunities in the qualification stage with their associated accounts, contacts, and activity timeline.
```

### Business Process Advancement
```
Move an opportunity through its business process flow, validating stage requirements and triggering associated workflows.
```

### Cross-Platform Data Access
```
Query Dataverse tables to combine CRM data with custom business data for comprehensive account analysis.
```

## Enhances Processes

- crm-data-quality
- opportunity-stage-management
- strategic-account-planning

## Dependencies

- Azure AD app registration with appropriate permissions
- Dynamics 365 Sales license
- Web API endpoint access
