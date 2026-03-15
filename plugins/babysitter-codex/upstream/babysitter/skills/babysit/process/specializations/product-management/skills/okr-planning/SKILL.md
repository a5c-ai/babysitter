---
name: OKR Planning
description: Objectives and Key Results planning, tracking, and alignment capabilities
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# OKR Planning Skill

## Overview

Specialized skill for Objectives and Key Results planning and tracking. Enables product teams to set effective OKRs, track progress, and maintain alignment with organizational goals.

## Capabilities

### OKR Creation
- Generate OKRs from strategic objectives
- Validate KR measurability and specificity
- Ensure objectives are inspiring and ambitious
- Create nested/cascading OKR structures
- Define scoring criteria (0.0-1.0)

### Alignment
- Align team OKRs with company OKRs
- Map dependencies between team OKRs
- Identify coverage gaps in objectives
- Ensure vertical and horizontal alignment
- Create OKR cascade visualizations

### Tracking and Reporting
- Calculate OKR progress and scores
- Generate OKR review reports
- Identify at-risk objectives
- Track confidence levels over time
- Create weekly/monthly check-in templates

## Target Processes

This skill integrates with the following processes:
- `quarterly-roadmap.js` - OKR-driven roadmap planning
- `product-vision-strategy.js` - Strategic OKR alignment
- `metrics-dashboard.js` - KR metric tracking
- `stakeholder-alignment.js` - OKR communication

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "mode": {
      "type": "string",
      "enum": ["create", "review", "score", "align"],
      "description": "Operation mode"
    },
    "strategicContext": {
      "type": "object",
      "properties": {
        "companyObjectives": { "type": "array", "items": { "type": "string" } },
        "teamMission": { "type": "string" },
        "timeframe": { "type": "string" }
      }
    },
    "existingOKRs": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "objective": { "type": "string" },
          "keyResults": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "kr": { "type": "string" },
                "target": { "type": "string" },
                "current": { "type": "string" },
                "confidence": { "type": "number" }
              }
            }
          }
        }
      }
    },
    "inputGoals": {
      "type": "array",
      "items": { "type": "string" },
      "description": "High-level goals to convert to OKRs"
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
    "okrs": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "objective": { "type": "string" },
          "rationale": { "type": "string" },
          "keyResults": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "kr": { "type": "string" },
                "metric": { "type": "string" },
                "baseline": { "type": "string" },
                "target": { "type": "string" },
                "stretch": { "type": "string" },
                "measurable": { "type": "boolean" }
              }
            }
          },
          "alignedTo": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "alignment": {
      "type": "object",
      "properties": {
        "coverageScore": { "type": "number" },
        "gaps": { "type": "array", "items": { "type": "string" } },
        "dependencies": { "type": "array", "items": { "type": "object" } }
      }
    },
    "scorecard": {
      "type": "object",
      "properties": {
        "overallScore": { "type": "number" },
        "byObjective": { "type": "array", "items": { "type": "object" } },
        "atRisk": { "type": "array", "items": { "type": "string" } },
        "onTrack": { "type": "array", "items": { "type": "string" } }
      }
    },
    "recommendations": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

## Usage Example

```javascript
const okrs = await executeSkill('okr-planning', {
  mode: 'create',
  strategicContext: {
    companyObjectives: [
      'Achieve $10M ARR',
      'Expand to 3 new markets',
      'Reach 90% customer satisfaction'
    ],
    teamMission: 'Deliver product experiences that drive customer adoption',
    timeframe: 'Q2 2026'
  },
  inputGoals: [
    'Improve user onboarding experience',
    'Launch mobile application',
    'Reduce churn in enterprise segment'
  ]
});
```

## Dependencies

- OKR frameworks and best practices
- Scoring algorithms
