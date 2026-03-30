---
name: Persona Development
description: Create and maintain user personas from research data for product targeting
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# Persona Development Skill

## Overview

Specialized skill for creating and maintaining user personas from research data. Enables product teams to develop rich, data-driven personas that guide product decisions and marketing strategies.

## Capabilities

### Persona Creation
- Generate persona profiles from research data
- Identify persona segments from analytics data
- Create jobs-to-be-done per persona
- Synthesize interview data into persona attributes
- Define demographic and psychographic profiles

### Persona Management
- Update personas with new research findings
- Version and track persona evolution
- Validate personas against behavioral data
- Identify emerging persona segments
- Retire outdated personas

### Persona Application
- Map personas to product features
- Calculate persona TAM/SAM estimates
- Generate persona comparison matrices
- Create persona-based user journeys
- Prioritize features by persona impact

## Target Processes

This skill integrates with the following processes:
- `user-story-mapping.js` - Persona-driven story mapping
- `jtbd-analysis.js` - Jobs per persona analysis
- `feature-definition-prd.js` - Persona targeting in PRDs
- `product-launch-gtm.js` - Persona-based launch targeting

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "mode": {
      "type": "string",
      "enum": ["create", "update", "analyze", "map"],
      "description": "Operation mode"
    },
    "researchData": {
      "type": "object",
      "properties": {
        "interviews": { "type": "array", "items": { "type": "object" } },
        "surveys": { "type": "array", "items": { "type": "object" } },
        "analytics": { "type": "object" },
        "supportTickets": { "type": "array", "items": { "type": "object" } }
      },
      "description": "Research data sources for persona creation"
    },
    "existingPersonas": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "description": { "type": "string" },
          "attributes": { "type": "object" }
        }
      }
    },
    "segmentationCriteria": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Criteria for persona segmentation"
    },
    "productFeatures": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Features to map to personas"
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
    "personas": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "tagline": { "type": "string" },
          "demographics": {
            "type": "object",
            "properties": {
              "role": { "type": "string" },
              "industry": { "type": "string" },
              "companySize": { "type": "string" },
              "experience": { "type": "string" }
            }
          },
          "psychographics": {
            "type": "object",
            "properties": {
              "goals": { "type": "array", "items": { "type": "string" } },
              "frustrations": { "type": "array", "items": { "type": "string" } },
              "motivations": { "type": "array", "items": { "type": "string" } },
              "behaviors": { "type": "array", "items": { "type": "string" } }
            }
          },
          "jobs": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "job": { "type": "string" },
                "importance": { "type": "string" },
                "currentSolution": { "type": "string" }
              }
            }
          },
          "quotes": { "type": "array", "items": { "type": "string" } },
          "marketSize": {
            "type": "object",
            "properties": {
              "tam": { "type": "string" },
              "sam": { "type": "string" },
              "som": { "type": "string" }
            }
          }
        }
      }
    },
    "featureMapping": {
      "type": "object",
      "description": "Mapping of features to personas with priority"
    },
    "comparisonMatrix": {
      "type": "object",
      "description": "Comparison of personas across key dimensions"
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
const personas = await executeSkill('persona-development', {
  mode: 'create',
  researchData: {
    interviews: [
      { id: 'int-1', role: 'Product Manager', painPoints: ['...'], goals: ['...'] },
      { id: 'int-2', role: 'Developer', painPoints: ['...'], goals: ['...'] }
    ],
    analytics: {
      userSegments: ['enterprise', 'smb', 'startup'],
      behaviorPatterns: ['power-user', 'casual', 'admin']
    }
  },
  segmentationCriteria: ['role', 'company_size', 'use_case']
});
```

## Dependencies

- Research data formats
- Segmentation algorithms
