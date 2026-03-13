---
name: hubspot-connector
description: HubSpot CRM and Marketing Hub integration for sales and marketing alignment
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
    - HubSpot API v3
---

# HubSpot Connector

## Overview

The HubSpot Connector skill enables seamless integration with HubSpot CRM and Marketing Hub, providing access to contact and company data, deal pipeline management, marketing automation data, and engagement tracking. This skill facilitates sales-marketing alignment through unified data access.

## Capabilities

### Contact & Company Management
- Synchronize contact and company data bi-directionally
- Manage contact properties and custom fields
- Handle list memberships and segmentation
- Track lifecycle stage progression

### Deal Pipeline Management
- Create, update, and track deals through pipeline stages
- Associate deals with contacts and companies
- Monitor deal properties and custom fields
- Calculate pipeline metrics and forecasts

### Marketing Integration
- Access marketing automation workflow data
- Retrieve email engagement metrics (opens, clicks, replies)
- Track form submissions and landing page visits
- Monitor content consumption patterns

### Sales Engagement
- Trigger and monitor email sequences
- Track sequence enrollment and performance
- Manage meeting scheduling links
- Access call and meeting activity logs

## Usage

### Contact Synchronization
```
Synchronize all contacts from a specific list with updated engagement scores and recent activity data.
```

### Deal Pipeline Analysis
```
Retrieve all deals in the pipeline with their associated contacts and companies, calculating stage-by-stage conversion rates.
```

### Sequence Performance Review
```
Pull engagement metrics for all active sales sequences, identifying top-performing templates and optimal send times.
```

## Enhances Processes

- sales-marketing-alignment
- lead-qualification-scoring
- lead-routing-assignment

## Dependencies

- HubSpot API key or OAuth app credentials
- Appropriate HubSpot subscription tier
- API rate limit awareness
