---
name: investor-updates
description: Generate structured investor update communications
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
metadata:
  specialization: entrepreneurship
  domain: business
  category: Investor Relations
  skill-id: SK-016
---

# Investor Update Generator Skill

## Overview

The Investor Update Generator skill provides capabilities for generating structured, professional investor update communications. It enables startups to maintain strong investor relationships through consistent, informative updates that follow best practices from accelerators like Y Combinator and established investor relations frameworks.

## Capabilities

### Core Functions
- **Template Application**: Apply proven investor update templates (YC, a]6z, etc.)
- **Metrics Dashboard Generation**: Generate key metrics dashboards and visualizations
- **Wins/Challenges/Asks Format**: Create structured updates with wins, challenges, and asks
- **Engagement Tracking**: Track investor engagement with updates
- **Cadence Scheduling**: Schedule and manage update cadence
- **Tier Personalization**: Personalize updates for different investor tiers
- **Board Material Generation**: Generate board meeting materials
- **Response Tracking**: Track and manage investor responses and offers to help

### Advanced Features
- Automated metrics pull from analytics
- Comparison to previous period metrics
- Narrative tone calibration
- Call-to-action optimization
- A/B testing subject lines
- Investor segmentation
- Help request matching
- Annual summary generation

## Usage

### Input Requirements
- Reporting period (monthly, quarterly)
- Key metrics and KPIs
- Major accomplishments
- Challenges and obstacles
- Specific asks for help
- Investor tier classifications
- Previous update content (for comparison)

### Output Deliverables
- Formatted investor update email
- Metrics dashboard/charts
- Wins/challenges/asks summary
- Personalized versions by tier
- Board presentation slides
- Help request tracking

### Process Integration
This skill integrates with the following processes:
- `investor-update-communication.js` - Primary integration for all phases
- `board-meeting-presentation.js` - Board update materials
- `series-a-fundraising.js` - Pre-raise relationship building
- `due-diligence-preparation.js` - Historical update compilation

### Example Invocation
```
Skill: investor-updates
Context: Monthly investor update for seed-stage startup
Input:
  - Period: January 2026
  - MRR: $45K (+15% MoM)
  - New Customers: 8
  - Churn: 2%
  - Runway: 14 months
  - Wins: [Major customer signed, Key hire made]
  - Challenges: [Sales cycle length, Engineering capacity]
  - Asks: [Intro to VP Sales candidates, Customer intros in healthcare]
Output:
  - Formatted email with YC template
  - Metrics visualization
  - Personalized asks by investor expertise
  - Subject line options
  - Send schedule recommendation
```

## Dependencies

- Email template libraries
- Metrics visualization tools
- Email tracking integration
- Investor database
- Calendar/scheduling integration

## Best Practices

1. Send updates consistently (monthly recommended, quarterly minimum)
2. Lead with metrics, even if they're not great
3. Be transparent about challenges - investors appreciate honesty
4. Make specific, actionable asks for help
5. Keep updates concise (5-minute read maximum)
6. Include a clear metrics dashboard at the top
7. Personalize asks based on investor expertise and network
8. Follow up on previous asks and offers to help
9. Send updates even when news is mixed or negative
10. Track which investors engage and respond
11. Use updates to build relationship capital before the next raise
12. Thank investors who provided help or introductions
