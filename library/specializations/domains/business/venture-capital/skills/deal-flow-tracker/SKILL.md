---
name: deal-flow-tracker
description: CRM integration for tracking deals through pipeline stages with automated status updates
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: venture-capital
  domain: business
  skill-id: vc-skill-001
---

# Deal Flow Tracker

## Overview

The Deal Flow Tracker skill provides comprehensive CRM integration for venture capital firms to track deals through various pipeline stages. It enables automated status updates, pipeline velocity analysis, and deal progression monitoring across the investment lifecycle.

## Capabilities

### Pipeline Stage Management
- Track deals across customizable pipeline stages (Sourced, First Meeting, DD, IC, Term Sheet, Closing, Portfolio)
- Automated stage transition triggers based on activities and milestones
- Stage duration tracking and bottleneck identification
- Multi-fund deal tracking with fund-specific pipelines

### CRM Integration
- Integrate with Affinity, Salesforce, HubSpot, and other VC-specific CRMs
- Bi-directional sync of deal data and contact information
- Activity logging (emails, meetings, calls) associated with deals
- Relationship intelligence from communication patterns

### Status Updates and Notifications
- Automated status update generation based on deal activity
- Configurable notification rules for stage changes
- Partner/associate assignment and coverage tracking
- Follow-up reminder scheduling

### Reporting and Analytics
- Pipeline velocity metrics (time in stage, conversion rates)
- Deal flow source attribution and ROI analysis
- Partner productivity and coverage metrics
- Historical pipeline trend analysis

## Usage

### Track New Deal
```
Input: Company information, source, initial assessment
Process: Create deal record, assign stage, set up tracking
Output: Deal ID, initial pipeline position, assigned coverage
```

### Update Deal Status
```
Input: Deal ID, new stage or activity update
Process: Record transition, calculate metrics, notify stakeholders
Output: Updated deal record, transition history, notifications sent
```

### Generate Pipeline Report
```
Input: Date range, filters (stage, partner, sector)
Process: Aggregate deal data, calculate metrics
Output: Pipeline summary, velocity metrics, conversion funnel
```

### Analyze Deal Flow Sources
```
Input: Time period, source categories
Process: Attribution analysis, ROI calculation
Output: Source effectiveness report, recommendations
```

## Integration Points

- **Investor Network Mapper**: Link deal sources to network relationships
- **Deal Scoring Engine**: Incorporate scores into pipeline prioritization
- **Meeting Scheduler**: Coordinate deal-related meetings
- **IC Memo Generator**: Pull deal data for memo generation

## Best Practices

1. Maintain consistent stage definitions across the firm
2. Log all significant deal interactions for accurate velocity tracking
3. Review pipeline weekly to identify stale deals
4. Use source attribution consistently for accurate ROI analysis
5. Set up automated alerts for deals exceeding stage time thresholds
