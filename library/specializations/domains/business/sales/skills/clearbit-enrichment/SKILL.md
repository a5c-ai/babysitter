---
name: clearbit-enrichment
description: Company and contact data enrichment via Clearbit APIs
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
    - Clearbit Enrichment API
    - Clearbit Reveal API
---

# Clearbit Enrichment

## Overview

The Clearbit Enrichment skill provides comprehensive company and contact data enrichment capabilities, enabling real-time lookups of firmographic data, contact information, technology stack details, and growth indicators. This skill transforms minimal data points into rich profiles for better qualification and routing.

## Capabilities

### Company Enrichment
- Retrieve detailed firmographic data (industry, size, revenue)
- Identify company technology stack and tools used
- Access funding history and growth metrics
- Map company hierarchy and subsidiaries

### Contact Enrichment
- Enrich contact profiles with professional information
- Verify and validate email addresses
- Retrieve social profiles and professional history
- Identify role and seniority information

### Real-Time Identification
- Identify anonymous website visitors via Reveal API
- Match IP addresses to company profiles
- Track visitor company engagement patterns
- Enable account-based targeting

### Data Quality
- Standardize company and contact data formats
- Validate and cleanse existing records
- Detect data changes and updates
- Maintain data freshness indicators

## Usage

### Lead Enrichment
```
Enrich a new lead with company firmographics, technology stack, and contact details to enable accurate scoring and routing.
```

### Account Identification
```
Use Reveal API to identify companies visiting the website and match them against target account lists.
```

### Data Standardization
```
Cleanse and standardize existing CRM records using Clearbit data as the source of truth.
```

## Enhances Processes

- lead-qualification-scoring
- lead-routing-assignment
- territory-design-assignment

## Dependencies

- Clearbit API key with appropriate credits
- Webhook endpoint for real-time enrichment
- CRM integration for data synchronization
