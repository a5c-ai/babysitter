---
name: GTM Strategy
description: Go-to-market planning and execution capabilities for product launches
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebSearch
---

# GTM Strategy Skill

## Overview

Specialized skill for go-to-market planning and execution capabilities. Enables product teams to plan effective launches, develop messaging, and coordinate cross-functional GTM activities.

## Capabilities

### Launch Planning
- Generate launch tier recommendations (T1/T2/T3)
- Create launch timeline milestones
- Build launch checklist templates
- Define launch success metrics
- Plan phased rollout strategies

### Messaging and Positioning
- Create messaging frameworks and positioning
- Develop value proposition statements
- Generate competitive differentiation points
- Create audience-specific messaging variants
- Build elevator pitch templates

### Channel Strategy
- Build channel strategy recommendations
- Identify optimal launch channels
- Create channel-specific content plans
- Define channel success metrics

### Sales Enablement
- Generate sales enablement materials structure
- Create competitive battlecard frameworks
- Build objection handling guides
- Develop pricing talk tracks
- Create demo flow recommendations

## Target Processes

This skill integrates with the following processes:
- `product-launch-gtm.js` - Primary GTM planning and execution
- `competitive-analysis.js` - Competitive positioning for launches
- `beta-program.js` - Beta-to-GA transition planning
- `stakeholder-alignment.js` - Launch communication coordination

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "product": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "description": { "type": "string" },
        "targetAudience": { "type": "array", "items": { "type": "string" } },
        "valueProposition": { "type": "string" },
        "keyFeatures": { "type": "array", "items": { "type": "string" } }
      }
    },
    "launchType": {
      "type": "string",
      "enum": ["new-product", "major-release", "feature-launch", "market-expansion"],
      "description": "Type of launch"
    },
    "launchTier": {
      "type": "string",
      "enum": ["T1", "T2", "T3"],
      "description": "Launch tier (T1=major, T2=medium, T3=minor)"
    },
    "targetDate": {
      "type": "string",
      "format": "date",
      "description": "Target launch date"
    },
    "competitiveContext": {
      "type": "object",
      "description": "Competitive landscape information"
    }
  },
  "required": ["product", "launchType"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "launchPlan": {
      "type": "object",
      "properties": {
        "tier": { "type": "string" },
        "timeline": { "type": "array", "items": { "type": "object" } },
        "milestones": { "type": "array", "items": { "type": "object" } },
        "checklist": { "type": "array", "items": { "type": "string" } }
      }
    },
    "messaging": {
      "type": "object",
      "properties": {
        "positioning": { "type": "string" },
        "valueProposition": { "type": "string" },
        "keyMessages": { "type": "array", "items": { "type": "string" } },
        "audienceVariants": { "type": "object" }
      }
    },
    "channelStrategy": {
      "type": "object",
      "properties": {
        "primaryChannels": { "type": "array", "items": { "type": "string" } },
        "contentPlan": { "type": "object" },
        "metrics": { "type": "object" }
      }
    },
    "salesEnablement": {
      "type": "object",
      "properties": {
        "battlecard": { "type": "object" },
        "objectionHandling": { "type": "array", "items": { "type": "object" } },
        "talkTracks": { "type": "array", "items": { "type": "object" } }
      }
    },
    "successMetrics": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "metric": { "type": "string" },
          "target": { "type": "string" },
          "timeframe": { "type": "string" }
        }
      }
    }
  }
}
```

## Usage Example

```javascript
const gtmPlan = await executeSkill('gtm-strategy', {
  product: {
    name: 'Advanced Analytics Suite',
    description: 'Enterprise analytics platform with AI-powered insights',
    targetAudience: ['Data Analysts', 'Business Intelligence Teams', 'C-Suite'],
    valueProposition: 'Get actionable insights 10x faster with AI-powered analytics',
    keyFeatures: ['Natural language queries', 'Automated insights', 'Real-time dashboards']
  },
  launchType: 'major-release',
  launchTier: 'T1',
  targetDate: '2026-03-15'
});
```

## Dependencies

- Marketing frameworks
- Channel templates
- Sales enablement templates
