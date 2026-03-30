---
name: zoominfo-enrichment
description: B2B intelligence and contact data enrichment via ZoomInfo
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
    - ZoomInfo API
---

# ZoomInfo Enrichment

## Overview

The ZoomInfo Enrichment skill provides access to comprehensive B2B intelligence data, including contact and company search, intent signals, organizational charts, and technographic data. This skill enables deep account research and prospecting with industry-leading data coverage.

## Capabilities

### Contact & Company Search
- Search extensive B2B contact database
- Access direct dial and verified email addresses
- Filter by title, function, seniority, and location
- Retrieve detailed company profiles

### Intent Data Signals
- Access buyer intent topic tracking
- Monitor research and comparison activity
- Identify in-market accounts
- Track intent signal strength and recency

### Organizational Mapping
- Map complete org charts and reporting structures
- Identify decision-makers and influencers
- Track organizational changes and movements
- Understand buying committee composition

### Technographic Intelligence
- Identify installed technologies and vendors
- Track technology adoption and changes
- Analyze competitive displacement opportunities
- Map technology stack relationships

## Usage

### Account Research
```
Research a target account to map the buying committee, identify decision-makers, and understand their technology stack.
```

### Intent-Based Prospecting
```
Identify accounts showing strong intent signals for specific topics and retrieve key contacts for outreach.
```

### Competitive Intelligence
```
Find accounts using competitor products and identify contacts for competitive displacement campaigns.
```

## Enhances Processes

- lead-qualification-scoring
- strategic-account-planning
- account-expansion-upsell

## Dependencies

- ZoomInfo subscription with API access
- Appropriate credit allocation
- CRM integration for data sync
