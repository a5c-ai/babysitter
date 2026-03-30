---
name: pipedrive-connector
description: Pipedrive CRM integration optimized for SMB sales teams
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
    - Pipedrive REST API
---

# Pipedrive Connector

## Overview

The Pipedrive Connector skill provides integration with Pipedrive CRM, a sales-focused CRM designed for small and medium businesses. This skill enables deal and pipeline management, activity tracking, lead inbox operations, and custom field handling with an emphasis on simplicity and sales velocity.

## Capabilities

### Deal & Pipeline Management
- Create, update, and track deals across pipelines
- Manage multiple pipelines and stages
- Calculate deal probability and weighted values
- Track deal rotting and activity alerts

### Activity Management
- Schedule and track calls, meetings, and tasks
- Automate activity creation based on triggers
- Monitor activity completion rates
- Link activities to deals and contacts

### Lead Management
- Process leads from the lead inbox
- Convert leads to deals with proper mapping
- Track lead sources and attribution
- Manage lead qualification criteria

### Custom Field Handling
- Access and update custom fields
- Handle different field types (text, numeric, date, enum)
- Manage field visibility and requirements
- Support calculated field logic

## Usage

### Pipeline Overview
```
Retrieve all deals in the active pipeline with their current stage, value, and days since last activity.
```

### Activity Automation
```
Create follow-up activities for all deals that have been idle for more than 7 days without customer contact.
```

### Lead Processing
```
Process incoming leads from the lead inbox, enriching data and routing to appropriate pipeline stages.
```

## Enhances Processes

- opportunity-stage-management
- pipeline-review-forecast

## Dependencies

- Pipedrive API token
- Appropriate Pipedrive subscription tier
- API rate limit compliance
