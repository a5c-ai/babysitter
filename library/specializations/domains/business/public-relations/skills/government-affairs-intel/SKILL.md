---
name: government-affairs-intel
description: Legislative tracking and government affairs monitoring for public policy communications and regulatory awareness
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: public-relations
  domain: business
  category: Stakeholder Communications
  skill-id: SK-014
---

# Government Affairs Intelligence Skill

## Overview

The Government Affairs Intelligence skill provides comprehensive legislative tracking, regulatory monitoring, and government affairs intelligence capabilities. This skill enables PR and public affairs teams to stay informed about policy developments, track legislation, and coordinate effective government relations communications.

## Capabilities

### Legislative Tracking
- FiscalNote integration for bill tracking
- Quorum legislative monitoring
- Multi-jurisdictional bill tracking
- Amendment and revision monitoring
- Sponsor and co-sponsor tracking
- Committee assignment monitoring
- Vote tracking and predictions
- Bill status timeline visualization

### Regulatory Alert Monitoring
- Federal Register monitoring
- Agency rulemaking tracking
- Proposed rule alerts
- Final rule notifications
- Comment period deadline tracking
- Regulatory calendar management
- State regulatory tracking
- International regulatory awareness

### Policy Analysis Tools
- Policy impact assessment frameworks
- Stakeholder impact mapping
- Cost-benefit analysis templates
- Policy position comparison
- Legislative language analysis
- Regulatory burden assessment
- Industry impact projections

### Legislator Database
- Comprehensive legislator profiles
- Committee membership tracking
- Voting history analysis
- Policy position documentation
- Staff contact management
- District/state information
- Relationship history logging

### Hearing and Event Tracking
- Congressional hearing schedule
- State legislative calendars
- Regulatory hearing alerts
- Public meeting notifications
- Industry event tracking
- Testimony opportunity identification

### Comment Period Management
- Comment deadline tracking
- Draft comment templates
- Submission workflow management
- Coalition comment coordination
- Comment tracking and analysis
- Response monitoring

### Compliance and Disclosure
- Lobby disclosure requirements
- LD-1 and LD-2 reporting
- Gift and travel compliance
- State lobby registration
- Foreign agent registration
- Grassroots disclosure requirements

### Political Risk Assessment
- Policy change impact analysis
- Political landscape mapping
- Election outcome scenario planning
- Administration priority tracking
- Geopolitical risk monitoring
- Stakeholder sentiment analysis

### Advocacy Campaign Coordination
- Grassroots campaign management
- Action alert creation
- Contact mobilization tools
- Campaign effectiveness tracking
- Coalition communication coordination
- Advocacy metrics reporting

## Integration Points

### Process Integration
- government-affairs-communications.js - All phases
- stakeholder-mapping.js - Government stakeholders
- reputation-risk-identification.js - Political risk assessment

### Skill Dependencies
- SK-012: Stakeholder CRM (contact management)
- SK-001: Media Monitoring (policy media coverage)

### Agent Integration
- AG-009: Government Affairs Communications Expert (primary)
- AG-008: Stakeholder Engagement Expert (coalition building)

## Usage

### Legislative Monitoring
```
Invoke government-affairs-intel skill to:
1. Set up tracking for bills affecting [industry]
2. Monitor committee activity for relevant legislation
3. Generate legislative landscape briefing
```

### Regulatory Engagement
```
Invoke government-affairs-intel skill to:
1. Track open comment periods for [agency]
2. Draft comment submission for proposed rule
3. Monitor regulatory calendar for upcoming deadlines
```

### Political Analysis
```
Invoke government-affairs-intel skill to:
1. Assess political risk for [policy issue]
2. Map stakeholder positions on legislation
3. Generate legislator briefing for advocacy meeting
```

## Configuration

### Required Integrations
- FiscalNote API
- Quorum API
- Government data feeds (congress.gov, Federal Register)

### Optional Integrations
- CRM systems for relationship tracking
- News monitoring services
- PAC management systems
- Advocacy software platforms

## Data Sources

### Federal
- Congress.gov
- Federal Register
- GovTrack
- OpenSecrets
- FEC data

### State
- State legislature tracking services
- NCSL resources
- State regulatory databases

### International
- EU regulatory databases
- International trade data
- Country-specific legislative trackers

## Compliance Features

### Lobby Disclosure
- Activity tracking for reporting
- Automated disclosure reminders
- Report generation assistance
- Contribution tracking

### Gift and Ethics
- Gift rule compliance checking
- Ethics guideline reference
- Travel reporting support
- Training requirement tracking

## Best Practices

1. Set up comprehensive monitoring before issues emerge
2. Track both bills and regulatory activity
3. Maintain current contact information for key staffers
4. Document all interactions for compliance
5. Coordinate messaging across advocacy coalition
6. Monitor opposition activity and messaging
7. Integrate government affairs with broader communications strategy
8. Anticipate policy changes through trend analysis

---

**Version**: 1.0.0
**Created**: 2026-01-24
**Status**: Active
