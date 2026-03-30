---
name: investor-crm
description: Manage investor pipeline and fundraising process
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
metadata:
  specialization: entrepreneurship
  domain: business
  category: Fundraising
  skill-id: SK-014
---

# Investor CRM Manager Skill

## Overview

The Investor CRM Manager skill provides comprehensive investor pipeline and fundraising process management capabilities. It enables startups to systematically build target investor lists, track pipeline stages, manage warm introductions, and maintain effective investor communications throughout the fundraising process.

## Capabilities

### Core Functions
- **Investor List Building**: Build and maintain target investor lists with relevant criteria
- **Pipeline Stage Tracking**: Track investors through fundraising pipeline stages
- **Warm Introduction Mapping**: Map and prioritize warm introduction paths
- **Outreach Template Generation**: Generate personalized outreach templates
- **Meeting Outcome Tracking**: Track meeting outcomes and follow-up items
- **Fundraise Progress Calculation**: Calculate and visualize fundraise progress metrics
- **Investor Report Generation**: Generate investor activity and pipeline reports
- **Follow-up Cadence Management**: Manage and automate follow-up communication cadence

### Advanced Features
- Investor fit scoring based on thesis and stage
- Introduction request drafting
- Meeting preparation briefs
- Term sheet comparison tracking
- Investor sentiment analysis
- Time-to-close predictions
- Network relationship mapping
- Post-raise relationship management

## Usage

### Input Requirements
- Company stage and sector
- Fundraising target amount
- Geographic preferences
- Existing investor network
- Warm connection inventory
- Fundraising timeline

### Output Deliverables
- Prioritized investor target list
- Pipeline status dashboard
- Introduction path recommendations
- Personalized outreach templates
- Meeting preparation materials
- Progress reports and metrics
- Follow-up task queues

### Process Integration
This skill integrates with the following processes:
- `pre-seed-fundraising.js` - Angel and seed investor pipeline
- `series-a-fundraising.js` - Institutional investor pipeline
- `investor-update-communication.js` - Ongoing investor relations
- `demo-day-presentation.js` - Demo day investor tracking

### Example Invocation
```
Skill: investor-crm
Context: Series Seed fundraising for fintech startup
Input:
  - Stage: Pre-seed/Seed
  - Sector: Fintech, B2B payments
  - Target: $2M
  - Geography: US, preferably SF/NYC
  - Existing Connections: [List of LinkedIn connections]
Output:
  - Target list: 50 investors ranked by fit
  - Warm intro paths for top 20
  - Outreach templates (cold, warm, follow-up)
  - Pipeline tracker template
  - Weekly progress report format
```

## Dependencies

- Investor database access (Crunchbase, PitchBook)
- CRM templates and tracking systems
- Email template libraries
- Network mapping capabilities
- Calendar integration

## Best Practices

1. Prioritize warm introductions over cold outreach (3x+ higher conversion)
2. Research each investor's thesis and recent investments before outreach
3. Track all interactions with timestamps and notes
4. Maintain consistent follow-up cadence (weekly during active raise)
5. Update pipeline status in real-time after each interaction
6. Segment investors by tier (A/B/C) based on fit and interest
7. Prepare investor-specific materials for each meeting
8. Track common objections and prepare responses
9. Keep detailed notes for future rounds
10. Maintain relationships even after receiving "no" responses
