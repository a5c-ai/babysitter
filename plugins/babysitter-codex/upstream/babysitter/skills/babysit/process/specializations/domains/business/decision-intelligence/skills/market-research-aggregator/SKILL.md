---
name: market-research-aggregator
description: Market intelligence aggregation skill for synthesizing market data from multiple sources
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: decision-intelligence
  domain: business
  category: knowledge-management
  priority: medium
  tools-libraries:
    - pandas
    - requests
    - custom integrations
---

# Market Research Aggregator

## Overview

The Market Research Aggregator skill provides capabilities for collecting, synthesizing, and analyzing market intelligence from multiple sources. It enables systematic market sizing, trend identification, and opportunity assessment by combining data from various research providers and public sources.

## Capabilities

- Data source integration
- Market size estimation (TAM, SAM, SOM)
- Growth rate calculation
- Trend identification
- Segment analysis
- Geographic breakdown
- Confidence level assessment
- Source citation management

## Used By Processes

- Market Sizing and Opportunity Assessment
- Geographic Market Analysis
- Industry Trend Analysis

## Usage

### Market Definition

```python
# Define market to analyze
market_definition = {
    "name": "Enterprise Project Management Software",
    "description": "Software solutions for managing projects, resources, and portfolios in large organizations",
    "scope": {
        "product_types": ["On-premise", "Cloud-based", "Hybrid"],
        "customer_segments": ["Enterprise (>1000 employees)"],
        "excluded": ["SMB solutions", "Personal productivity tools"]
    },
    "geographic_scope": ["North America", "Europe", "Asia Pacific"],
    "time_frame": {"historical": "2019-2023", "forecast": "2024-2028"},
    "currency": "USD",
    "units": "Revenue"
}
```

### Data Sources

```python
# Configure data sources
data_sources = {
    "primary_research": [
        {
            "source": "Gartner",
            "report_name": "Market Share: Enterprise Project Management Software",
            "date": "2024-01",
            "data_type": "market_share",
            "reliability": "high"
        },
        {
            "source": "IDC",
            "report_name": "Worldwide Project Management Software Forecast",
            "date": "2023-12",
            "data_type": "market_forecast",
            "reliability": "high"
        }
    ],
    "secondary_research": [
        {
            "source": "Industry Association Reports",
            "reliability": "medium"
        },
        {
            "source": "Company Annual Reports",
            "reliability": "high"
        }
    ],
    "public_data": [
        {
            "source": "Government Statistics",
            "data_type": "industry_employment",
            "reliability": "high"
        }
    ]
}
```

### Market Sizing (TAM/SAM/SOM)

```python
# Market size calculation
market_sizing = {
    "tam": {
        "definition": "Total addressable market for all project management software globally",
        "methodology": "top_down",
        "calculation": {
            "total_enterprises": 500000,
            "adoption_rate": 0.85,
            "average_spend": 150000,
            "result": 63750000000
        },
        "sources": ["Gartner", "IDC"],
        "confidence": "high"
    },
    "sam": {
        "definition": "Serviceable addressable market in target geographies for enterprise segment",
        "methodology": "bottom_up",
        "calculation": {
            "target_enterprises": 75000,
            "product_fit_rate": 0.60,
            "average_spend": 200000,
            "result": 9000000000
        },
        "confidence": "medium"
    },
    "som": {
        "definition": "Serviceable obtainable market based on competitive position",
        "methodology": "competitive_analysis",
        "calculation": {
            "sam": 9000000000,
            "realistic_share": 0.05,
            "result": 450000000
        },
        "time_horizon": "5 years",
        "confidence": "medium"
    }
}
```

### Trend Analysis

```python
# Identify and track trends
trend_analysis = {
    "trends": [
        {
            "name": "AI-powered project management",
            "direction": "accelerating",
            "impact": "high",
            "timeline": "2024-2027",
            "evidence": [
                "75% of vendors adding AI features",
                "40% budget increase for AI capabilities"
            ],
            "implications": ["Feature differentiation", "Pricing pressure", "Skill requirements"]
        },
        {
            "name": "Consolidation of point solutions",
            "direction": "steady",
            "impact": "medium",
            "evidence": ["M&A activity up 30%", "Platform play preference"]
        }
    ],
    "methodology": "expert_consensus",
    "update_frequency": "quarterly"
}
```

## Input Schema

```json
{
  "operation": "define|collect|size|analyze|report",
  "market_definition": {
    "name": "string",
    "scope": "object",
    "geographic_scope": ["string"],
    "time_frame": "object"
  },
  "data_sources": {
    "primary": ["object"],
    "secondary": ["object"],
    "public": ["object"]
  },
  "analysis_request": {
    "type": "sizing|trends|segments|geography|competitive",
    "parameters": "object"
  }
}
```

## Output Schema

```json
{
  "market_overview": {
    "name": "string",
    "current_size": "number",
    "growth_rate": "number",
    "forecast_period": "string"
  },
  "market_sizing": {
    "TAM": {"value": "number", "confidence": "string"},
    "SAM": {"value": "number", "confidence": "string"},
    "SOM": {"value": "number", "confidence": "string"}
  },
  "segments": [
    {
      "name": "string",
      "size": "number",
      "growth_rate": "number",
      "share": "number"
    }
  ],
  "trends": ["object"],
  "data_quality": {
    "sources_used": "number",
    "data_freshness": "string",
    "confidence_overall": "string",
    "gaps_identified": ["string"]
  },
  "citations": ["object"]
}
```

## Market Sizing Methodologies

| Method | Approach | Best For |
|--------|----------|----------|
| Top-Down | Start with total market, narrow down | Mature markets with good data |
| Bottom-Up | Build from unit economics | New markets, specific segments |
| Value-Based | Based on customer value delivered | Innovative solutions |
| Competitive | Sum of competitor revenues | Markets with public companies |

## Best Practices

1. Use multiple sources and methodologies
2. Clearly document assumptions
3. Indicate confidence levels for all estimates
4. Update market data at least quarterly
5. Triangulate from multiple approaches
6. Account for market definition differences across sources
7. Track methodology changes over time for comparability

## Data Quality Assessment

| Dimension | Assessment Criteria |
|-----------|-------------------|
| Accuracy | Source reliability, methodology |
| Completeness | Coverage of market segments |
| Timeliness | Data recency |
| Consistency | Agreement across sources |
| Relevance | Alignment with market definition |

## Integration Points

- Feeds into Market Intelligence Analyst agent
- Connects with Competitive Intelligence Tracker for share data
- Supports Time Series Forecaster for projections
- Integrates with Decision Visualization for market maps
