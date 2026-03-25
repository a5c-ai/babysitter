---
name: gong-conversation-intelligence
description: Gong.io conversation analytics for sales insights and coaching
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
  priority: P0
  integration-points:
    - Gong API
---

# Gong Conversation Intelligence

## Overview

The Gong Conversation Intelligence skill provides access to Gong.io's conversation analytics platform, enabling call recording transcription access, deal risk signal extraction, competitor mention tracking, sentiment analysis, and coaching moment identification. This skill transforms sales conversations into actionable insights.

## Capabilities

### Call Transcription Access
- Retrieve full call transcriptions
- Access timestamped conversation segments
- Search across all recorded calls
- Filter by participant, topic, or keyword

### Deal Risk Signals
- Extract risk indicators from conversations
- Track competitor mentions and positioning
- Identify objection patterns
- Monitor decision criteria discussions

### Conversation Analytics
- Analyze talk ratio and listening patterns
- Measure question frequency and quality
- Track monologue duration and interruptions
- Assess conversation energy and engagement

### Coaching Opportunities
- Identify coaching moment highlights
- Track methodology adherence
- Compare rep performance patterns
- Generate personalized coaching recommendations

## Usage

### Competitive Intelligence
```
Search all recent calls for competitor mentions and extract context around competitive positioning discussions.
```

### Deal Review Preparation
```
Pull conversation highlights and risk signals for an upcoming deal review session.
```

### Rep Coaching Analysis
```
Analyze conversation patterns for a specific rep to identify areas for skill development.
```

## Enhances Processes

- win-loss-analysis
- competitive-battle-cards
- sales-methodology-training
- deal-risk-assessment

## Dependencies

- Gong platform subscription
- Call recording consent compliance
- CRM integration for deal context
