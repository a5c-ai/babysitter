---
name: chorus-analytics
description: Chorus.ai conversation intelligence for meeting insights and analytics
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
    - Chorus API (ZoomInfo)
---

# Chorus Analytics

## Overview

The Chorus Analytics skill provides integration with Chorus.ai (now part of ZoomInfo) for conversation intelligence, enabling access to meeting intelligence data, deal momentum indicators, rep performance analytics, and keyword tracking. This skill captures and analyzes sales interactions to drive performance improvement.

## Capabilities

### Meeting Intelligence
- Access meeting transcriptions and summaries
- Extract key moments and action items
- Track participant engagement levels
- Identify next step commitments

### Deal Momentum Indicators
- Monitor conversation frequency and patterns
- Track stakeholder involvement progression
- Measure deal engagement velocity
- Identify stalled deal warning signs

### Rep Performance Analytics
- Compare rep metrics against benchmarks
- Track skill development over time
- Identify top performer behaviors
- Generate performance scorecards

### Keyword & Topic Tracking
- Track specific keyword mentions
- Monitor topic discussion patterns
- Identify emerging themes and concerns
- Alert on critical topic discussions

## Usage

### Deal Momentum Review
```
Analyze conversation patterns for a specific deal to assess momentum and identify acceleration opportunities.
```

### Performance Benchmarking
```
Compare a rep's conversation metrics against top performers to identify skill gaps.
```

### Topic Analysis
```
Track discussions of specific features or objections across all recent sales conversations.
```

## Enhances Processes

- win-loss-analysis
- new-hire-onboarding-ramp
- sales-playbook-development

## Dependencies

- Chorus.ai/ZoomInfo subscription
- Meeting recording integration
- CRM synchronization
