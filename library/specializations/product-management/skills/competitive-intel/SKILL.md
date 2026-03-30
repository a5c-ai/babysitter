---
name: Competitive Intelligence
description: Deep competitive analysis and market monitoring capabilities for product strategy
allowed-tools:
  - WebSearch
  - WebFetch
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# Competitive Intelligence Skill

## Overview

Specialized skill for deep competitive analysis and market monitoring capabilities. Enables product teams to maintain awareness of competitor activities, identify market opportunities, and inform strategic decisions.

## Capabilities

### Core Analysis Functions
- Analyze competitor websites, pricing, and positioning
- Track competitor feature releases and announcements
- Generate feature comparison matrices
- Monitor competitor reviews and ratings
- Extract competitor strengths and weaknesses
- Identify market gaps and white space opportunities
- Track industry analyst reports and mentions

### Research Methods
- Competitive website analysis and scraping
- Pricing structure comparison
- Feature parity assessment
- Market positioning analysis
- SWOT compilation for competitors
- Industry trend monitoring

### Output Artifacts
- Competitive landscape reports
- Feature comparison matrices
- Pricing comparison tables
- Market positioning maps
- Competitive battlecards
- White space opportunity reports
- Industry trend summaries

## Target Processes

This skill integrates with the following processes:
- `competitive-analysis.js` - Primary integration for full competitive analysis workflows
- `product-vision-strategy.js` - Strategic positioning and differentiation
- `product-launch-gtm.js` - Competitive positioning for launches
- `quarterly-roadmap.js` - Market opportunity identification

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "competitors": {
      "type": "array",
      "items": { "type": "string" },
      "description": "List of competitor names or domains to analyze"
    },
    "analysisScope": {
      "type": "string",
      "enum": ["pricing", "features", "positioning", "full"],
      "description": "Scope of competitive analysis"
    },
    "industryContext": {
      "type": "string",
      "description": "Industry or market context for analysis"
    },
    "focusAreas": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Specific areas to focus analysis on"
    }
  },
  "required": ["competitors", "analysisScope"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "competitorProfiles": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "positioning": { "type": "string" },
          "strengths": { "type": "array", "items": { "type": "string" } },
          "weaknesses": { "type": "array", "items": { "type": "string" } },
          "pricing": { "type": "object" },
          "features": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "featureMatrix": {
      "type": "object",
      "description": "Feature comparison matrix across competitors"
    },
    "marketGaps": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Identified market opportunities and white spaces"
    },
    "recommendations": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Strategic recommendations based on analysis"
    }
  }
}
```

## Usage Example

```javascript
const competitiveAnalysis = await executeSkill('competitive-intel', {
  competitors: ['CompetitorA', 'CompetitorB', 'CompetitorC'],
  analysisScope: 'full',
  industryContext: 'B2B SaaS project management',
  focusAreas: ['pricing', 'collaboration features', 'integrations']
});
```

## Dependencies

- Web scraping capabilities
- News monitoring APIs
- Industry data sources
