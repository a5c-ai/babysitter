---
name: salesforce-connector
description: Bi-directional Salesforce CRM integration for sales data management
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
  priority: P0
  integration-points:
    - Salesforce REST API
    - Bulk API 2.0
    - Streaming API
---

# Salesforce Connector

## Overview

The Salesforce Connector skill provides comprehensive bi-directional integration with Salesforce CRM, enabling automated data retrieval, manipulation, and synchronization. This skill handles SOQL queries, CRUD operations on standard and custom objects, bulk data operations with governor limit awareness, and real-time event processing.

## Capabilities

### Data Operations
- Execute SOQL queries for data retrieval
- Perform CRUD operations on Leads, Contacts, Accounts, and Opportunities
- Access and map custom objects and fields
- Handle bulk data operations while respecting governor limits
- Extract data from reports and dashboards

### Real-Time Integration
- Process webhook events in real-time
- Subscribe to platform events and change data capture
- Handle streaming API connections for live updates

### Advanced Features
- Field-level security awareness
- Record type handling
- Multi-org support
- Sandbox vs production environment management
- OAuth 2.0 authentication flow management

## Usage

### Basic Query Execution
```
Execute a SOQL query to retrieve all open opportunities for a specific account, including related contact information and activity history.
```

### Bulk Data Operations
```
Perform a bulk update of lead status for all leads from a specific campaign, ensuring proper handling of governor limits.
```

### Real-Time Event Processing
```
Set up a listener for opportunity stage changes and trigger appropriate follow-up actions based on the new stage.
```

## Enhances Processes

- crm-data-quality
- lead-routing-assignment
- opportunity-stage-management
- pipeline-review-forecast

## Dependencies

- Salesforce Connected App with appropriate OAuth scopes
- API-enabled Salesforce edition
- Proper user permissions for accessed objects
