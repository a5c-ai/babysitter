---
name: Feature Flagging
description: Feature flag configuration and rollout planning for controlled releases
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# Feature Flagging Skill

## Overview

Specialized skill for feature flag configuration and rollout planning. Enables product teams to plan and manage controlled feature releases with proper targeting, monitoring, and rollback strategies.

## Capabilities

### Flag Design
- Generate feature flag specifications
- Design flag naming conventions
- Create flag documentation templates
- Define flag types (release, experiment, ops, permission)
- Plan flag dependencies and interactions

### Rollout Planning
- Design rollout percentage strategies
- Create flag targeting rules
- Plan canary and gradual rollouts
- Define geographic or segment-based rollouts
- Create rollout schedules

### Operations
- Generate kill switch procedures
- Track flag lifecycle and cleanup
- Monitor flag impact on metrics
- Plan flag deprecation
- Create incident response procedures

## Target Processes

This skill integrates with the following processes:
- `product-launch-gtm.js` - Feature flag rollout for launches
- `beta-program.js` - Beta feature flagging
- `conversion-funnel-analysis.js` - A/B test flag management

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "mode": {
      "type": "string",
      "enum": ["design", "rollout", "audit", "deprecate"],
      "description": "Operation mode"
    },
    "feature": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "description": { "type": "string" },
        "type": { "type": "string", "enum": ["release", "experiment", "ops", "permission"] },
        "owner": { "type": "string" },
        "impactLevel": { "type": "string", "enum": ["low", "medium", "high", "critical"] }
      }
    },
    "rolloutStrategy": {
      "type": "object",
      "properties": {
        "type": { "type": "string", "enum": ["percentage", "segment", "geographic", "gradual"] },
        "stages": { "type": "array", "items": { "type": "object" } },
        "criteria": { "type": "object" }
      }
    },
    "existingFlags": {
      "type": "array",
      "items": { "type": "object" },
      "description": "Existing flags for audit or cleanup"
    }
  },
  "required": ["mode"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "flagSpec": {
      "type": "object",
      "properties": {
        "key": { "type": "string" },
        "name": { "type": "string" },
        "description": { "type": "string" },
        "type": { "type": "string" },
        "defaultValue": { "type": "boolean" },
        "variations": { "type": "array", "items": { "type": "object" } },
        "targetingRules": { "type": "array", "items": { "type": "object" } },
        "prerequisites": { "type": "array", "items": { "type": "string" } }
      }
    },
    "rolloutPlan": {
      "type": "object",
      "properties": {
        "stages": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "stage": { "type": "string" },
              "percentage": { "type": "number" },
              "targeting": { "type": "object" },
              "duration": { "type": "string" },
              "successCriteria": { "type": "array", "items": { "type": "string" } },
              "rollbackTriggers": { "type": "array", "items": { "type": "string" } }
            }
          }
        },
        "metrics": { "type": "array", "items": { "type": "string" } },
        "alerts": { "type": "array", "items": { "type": "object" } }
      }
    },
    "killSwitch": {
      "type": "object",
      "properties": {
        "procedure": { "type": "array", "items": { "type": "string" } },
        "owner": { "type": "string" },
        "escalation": { "type": "array", "items": { "type": "string" } }
      }
    },
    "lifecycle": {
      "type": "object",
      "properties": {
        "createdDate": { "type": "string" },
        "plannedRemovalDate": { "type": "string" },
        "cleanupTasks": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

## Usage Example

```javascript
const flagPlan = await executeSkill('feature-flags', {
  mode: 'rollout',
  feature: {
    name: 'New Dashboard Experience',
    description: 'Redesigned analytics dashboard with AI insights',
    type: 'release',
    owner: 'product-team',
    impactLevel: 'high'
  },
  rolloutStrategy: {
    type: 'gradual',
    stages: [
      { name: 'internal', percentage: 100, duration: '3 days' },
      { name: 'beta', percentage: 10, duration: '1 week' },
      { name: 'early-adopters', percentage: 25, duration: '1 week' },
      { name: 'general', percentage: 100, duration: 'permanent' }
    ]
  }
});
```

## Dependencies

- Feature flag platforms (LaunchDarkly, Split, Flagsmith)
- Monitoring and alerting systems
