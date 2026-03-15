---
name: market-sizing
description: Automated TAM/SAM/SOM calculations with methodology documentation
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - WebSearch
  - WebFetch
metadata:
  specialization: entrepreneurship
  domain: business
  category: Market Analysis
  skill-id: SK-003
---

# Market Sizing Calculator Skill

## Overview

The Market Sizing Calculator skill provides automated Total Addressable Market (TAM), Serviceable Addressable Market (SAM), and Serviceable Obtainable Market (SOM) calculations with comprehensive methodology documentation. This skill enables startups to create investor-ready market size analyses using both top-down and bottom-up approaches.

## Capabilities

### Core Functions
- **TAM Calculation**: Calculate Total Addressable Market using industry data and market research
- **SAM Calculation**: Calculate Serviceable Addressable Market based on segment and geographic focus
- **SOM Calculation**: Calculate Serviceable Obtainable Market based on realistic capture rates
- **Top-Down Analysis**: Apply top-down methodology using industry reports and market data
- **Bottom-Up Analysis**: Apply bottom-up methodology using customer counts and pricing
- **Market Data Sourcing**: Source and cite market data from reputable sources
- **Narrative Generation**: Generate market sizing narratives suitable for investor presentations
- **Growth Projections**: Create market growth projections with CAGR calculations
- **Assumption Validation**: Validate and document market size assumptions

### Advanced Features
- Multi-segment market analysis
- Geographic market breakdowns
- Competitor market share estimation
- Market timing analysis
- Industry trend correlation
- Sensitivity analysis on key assumptions

## Usage

### Input Requirements
- Industry or market category
- Target customer segments
- Geographic focus areas
- Pricing model and price points
- Competitive landscape overview
- Growth rate assumptions

### Output Deliverables
- TAM/SAM/SOM calculations with methodology
- Supporting data sources and citations
- Market growth projections
- Assumption documentation
- Investor-ready market sizing slides
- Sensitivity analysis tables

### Process Integration
This skill integrates with the following processes:
- `market-sizing-analysis.js` - Primary integration for all phases
- `investor-pitch-deck.js` - Market opportunity slides
- `business-plan-document.js` - Market analysis section
- `series-a-fundraising.js` - Market size due diligence

### Example Invocation
```
Skill: market-sizing
Context: B2B SaaS for construction project management
Input:
  - Industry: Construction Technology
  - Segment: Mid-market general contractors
  - Geography: North America
  - Price Point: $500/month per user
  - Target Users: Project managers and superintendents
Output:
  - TAM: $X billion (methodology and sources)
  - SAM: $X billion (segment calculation)
  - SOM: $X million (Year 1-3 capture)
  - Growth projections with CAGR
```

## Dependencies

- Market data sources (industry reports, government statistics)
- Industry benchmarks and sizing frameworks
- Financial calculation libraries
- Data visualization capabilities

## Best Practices

1. Always use multiple methodologies (top-down and bottom-up) and triangulate
2. Document all assumptions clearly with sources
3. Use conservative estimates for investor credibility
4. Include market growth rates and timing considerations
5. Show clear logic path from TAM to SAM to SOM
6. Cite reputable, recent data sources (within 2 years)
7. Address potential market risks and constraints
