---
name: investor-relations-platform
description: Investor communications and financial disclosure management for public company stakeholder relations
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
  skill-id: SK-016
---

# Investor Relations Platform Skill

## Overview

The Investor Relations Platform skill provides comprehensive capabilities for managing investor communications, financial disclosures, and shareholder engagement. This skill enables IR teams to coordinate earnings communications, manage investor targeting, and maintain regulatory compliance while building strong investor relationships.

## Capabilities

### IR Website Management
- Q4 platform integration
- Notified IR website management
- Irwin investor relations tools
- Press release posting automation
- SEC filing publication
- Event calendar management
- Stock information display
- Email alert management
- IR contact form handling

### Earnings Communications
- Earnings call coordination
- Script development assistance
- Q&A preparation
- Webcast platform management
- Replay distribution
- Transcript management
- Earnings deck coordination

### Financial Calendar Management
- Earnings date scheduling
- Conference participation tracking
- Investor day planning
- Annual meeting coordination
- Quiet period management
- Disclosure deadline tracking

### SEC Filing Coordination
- 8-K filing preparation
- 10-K/10-Q coordination
- Proxy statement support
- Form 4 tracking
- Material event assessment
- Filing checklist management
- EDGAR submission support

### Investor Targeting and CRM
- Investor identification
- Ownership tracking
- Targeting list development
- Meeting scheduling
- Relationship tracking
- Investment thesis monitoring
- Activist investor monitoring

### Earnings Transcript Analysis
- Transcript processing
- Sentiment analysis
- Q&A pattern identification
- Competitive comparison
- Message consistency tracking
- Analyst question tracking

### Peer Benchmarking
- Peer group definition
- Valuation comparison
- Disclosure benchmarking
- Communication practice comparison
- Governance comparison
- ESG rating comparison

### Analyst Coverage
- Analyst estimate tracking
- Coverage monitoring
- Target price tracking
- Rating change alerts
- Consensus management
- Earnings surprise analysis

### Shareholder Identification
- 13F filing analysis
- Ownership change detection
- Geographic distribution
- Investment style analysis
- Holding period analysis
- Voting pattern analysis

### Investor Day Management
- Event planning support
- Registration management
- Content coordination
- Webcast production
- Follow-up management
- Feedback collection

## Integration Points

### Process Integration
- investor-communications-support.js - All phases
- annual-report-production.js - IR sections
- stakeholder-mapping.js - Investor stakeholders

### Skill Dependencies
- SK-004: Press Release Distribution (earnings releases)
- SK-012: Stakeholder CRM (investor contacts)
- SK-009: PR Analytics (IR metrics)

### Agent Integration
- AG-011: Investor Communications Expert (primary)
- AG-005: Corporate Communications Strategist (messaging alignment)

## Usage

### Earnings Cycle
```
Invoke investor-relations-platform skill to:
1. Prepare earnings call materials
2. Coordinate earnings release distribution
3. Manage post-earnings investor outreach
```

### Investor Engagement
```
Invoke investor-relations-platform skill to:
1. Generate investor targeting list
2. Track investor meeting history
3. Analyze shareholder composition changes
```

### Compliance and Disclosure
```
Invoke investor-relations-platform skill to:
1. Prepare 8-K for material event
2. Track disclosure obligations
3. Monitor quiet period compliance
```

## Configuration

### Required Integrations
- Q4 API or equivalent IR platform
- Notified API
- Stock quote feeds
- EDGAR filing systems

### Optional Integrations
- CRM systems
- Webcast platforms
- Proxy solicitation services
- ESG rating providers
- Financial data services

## Compliance Features

### Regulation FD
- Disclosure monitoring
- Selective disclosure prevention
- Material information tracking
- Public disclosure verification

### Quiet Period Management
- Calendar integration
- Communication restrictions
- Exception handling
- Period tracking

### Record Keeping
- Communication logging
- Meeting documentation
- Disclosure records
- Audit trail maintenance

## Key Metrics

### Stock Performance
- Stock price tracking
- Trading volume analysis
- Relative performance
- Volatility monitoring

### Ownership Metrics
- Institutional ownership %
- Retail ownership %
- Index inclusion
- Short interest

### Communication Metrics
- Website traffic
- Earnings call participation
- Investor meeting count
- Analyst coverage count

### Perception Metrics
- Analyst sentiment
- Investor feedback
- Governance ratings
- ESG scores

## Event Types Supported

### Regular Events
- Quarterly earnings calls
- Annual shareholder meeting
- Investor conferences
- Non-deal roadshows

### Special Events
- Investor day
- Analyst day
- Capital markets day
- Strategic update calls

### Situational Events
- M&A announcements
- Leadership transitions
- Activist situations
- Crisis communications

## Best Practices

1. Maintain consistent disclosure practices
2. Proactively manage investor expectations
3. Build relationships before you need them
4. Know your shareholder base thoroughly
5. Prepare extensively for all investor interactions
6. Coordinate closely with legal and finance
7. Monitor peer communication practices
8. Track and respond to analyst concerns
9. Document all material investor communications

---

**Version**: 1.0.0
**Created**: 2026-01-24
**Status**: Active
