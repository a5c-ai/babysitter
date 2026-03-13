---
name: heatmap-analysis
description: Analyze user interaction heatmaps for attention patterns and click behavior
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - WebFetch
---

# Heatmap Analysis Skill

## Purpose

Analyze user interaction heatmaps to identify attention patterns, click concentrations, and scroll depth insights for UX optimization.

## Capabilities

- Parse heatmap data from analytics platforms
- Identify attention hotspots and cold zones
- Analyze click concentration patterns
- Measure scroll depth and engagement
- Generate attention flow visualizations
- Compare heatmaps across variants

## Target Processes

- user-research.js
- user-journey-mapping.js
- usability-testing.js
- information-architecture.js

## Integration Points

- Hotjar API
- Crazy Egg API
- Microsoft Clarity
- Custom heatmap data formats

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "dataSource": {
      "type": "string",
      "enum": ["hotjar", "crazyegg", "clarity", "custom"],
      "description": "Heatmap data source"
    },
    "heatmapType": {
      "type": "string",
      "enum": ["click", "move", "scroll", "attention"],
      "default": "click"
    },
    "dataPath": {
      "type": "string",
      "description": "Path to heatmap data file or API endpoint"
    },
    "pageUrl": {
      "type": "string",
      "description": "URL of the analyzed page"
    },
    "segmentation": {
      "type": "object",
      "properties": {
        "device": { "type": "string" },
        "dateRange": { "type": "object" }
      }
    },
    "thresholds": {
      "type": "object",
      "properties": {
        "hotspot": { "type": "number", "default": 0.7 },
        "coldZone": { "type": "number", "default": 0.1 }
      }
    }
  },
  "required": ["dataSource", "dataPath"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "hotspots": {
      "type": "array",
      "description": "High-engagement areas"
    },
    "coldZones": {
      "type": "array",
      "description": "Low-engagement areas"
    },
    "scrollDepth": {
      "type": "object",
      "description": "Scroll depth percentiles"
    },
    "clickPatterns": {
      "type": "array",
      "description": "Click concentration analysis"
    },
    "recommendations": {
      "type": "array",
      "description": "UX improvement recommendations"
    },
    "visualizationPath": {
      "type": "string",
      "description": "Path to generated visualization"
    }
  }
}
```

## Usage Example

```javascript
const result = await skill.execute({
  dataSource: 'hotjar',
  heatmapType: 'click',
  dataPath: './heatmap-export.json',
  pageUrl: 'https://example.com/landing',
  thresholds: { hotspot: 0.7, coldZone: 0.1 }
});
```
