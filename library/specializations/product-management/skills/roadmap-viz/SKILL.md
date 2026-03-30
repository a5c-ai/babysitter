---
name: Roadmap Visualization
description: Generate roadmap visualizations and planning artifacts for product planning
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# Roadmap Visualization Skill

## Overview

Specialized skill for generating roadmap visualizations and planning artifacts. Enables product teams to create clear, stakeholder-appropriate roadmap views in various formats.

## Capabilities

### Roadmap Views
- Generate Now/Next/Later roadmap views
- Create timeline-based roadmap visualizations
- Build stakeholder-specific roadmap versions
- Create Gantt-style planning charts
- Generate dependency graphs
- Build resource allocation views

### Output Formats
- Markdown tables and lists
- Mermaid diagram syntax
- CSV for spreadsheet import
- JSON for tool integration
- ASCII timeline visualizations

### Customization
- Filter by theme, team, or priority
- Adjust time horizons
- Show/hide dependencies
- Customize detail levels per audience
- Apply confidence indicators

## Target Processes

This skill integrates with the following processes:
- `quarterly-roadmap.js` - Primary roadmap planning and visualization
- `product-vision-strategy.js` - Strategic roadmap views
- `stakeholder-alignment.js` - Stakeholder-specific roadmap presentations
- `product-council-review.js` - Review-ready roadmap artifacts

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "viewType": {
      "type": "string",
      "enum": ["now-next-later", "timeline", "gantt", "dependency", "resource"],
      "description": "Type of roadmap view to generate"
    },
    "initiatives": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "theme": { "type": "string" },
          "timeframe": { "type": "string" },
          "priority": { "type": "string" },
          "dependencies": { "type": "array", "items": { "type": "string" } },
          "team": { "type": "string" },
          "confidence": { "type": "string", "enum": ["high", "medium", "low"] }
        }
      }
    },
    "timeHorizon": {
      "type": "string",
      "description": "Time range for roadmap (e.g., 'Q1-Q4 2026')"
    },
    "audience": {
      "type": "string",
      "enum": ["executive", "engineering", "sales", "customer", "internal"],
      "description": "Target audience for roadmap view"
    },
    "outputFormat": {
      "type": "string",
      "enum": ["markdown", "mermaid", "csv", "json", "ascii"],
      "default": "markdown"
    }
  },
  "required": ["viewType", "initiatives"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "visualization": {
      "type": "string",
      "description": "Rendered roadmap in requested format"
    },
    "summary": {
      "type": "object",
      "properties": {
        "totalInitiatives": { "type": "number" },
        "byTimeframe": { "type": "object" },
        "byTheme": { "type": "object" },
        "byPriority": { "type": "object" }
      }
    },
    "dependencies": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "from": { "type": "string" },
          "to": { "type": "string" },
          "type": { "type": "string" }
        }
      }
    },
    "riskFlags": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Potential scheduling or dependency risks"
    }
  }
}
```

## Usage Example

```javascript
const roadmap = await executeSkill('roadmap-viz', {
  viewType: 'now-next-later',
  initiatives: [
    { id: 'init-1', name: 'Core Platform Upgrade', theme: 'Platform', timeframe: 'now', priority: 'P0' },
    { id: 'init-2', name: 'Mobile App Launch', theme: 'Growth', timeframe: 'next', priority: 'P1' },
    { id: 'init-3', name: 'AI Features', theme: 'Innovation', timeframe: 'later', priority: 'P2' }
  ],
  timeHorizon: 'Q1-Q4 2026',
  audience: 'executive',
  outputFormat: 'markdown'
});
```

## Dependencies

- Visualization libraries
- Export format handlers
