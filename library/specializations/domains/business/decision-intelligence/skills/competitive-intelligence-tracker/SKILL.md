---
name: competitive-intelligence-tracker
description: Competitive intelligence collection and analysis skill for systematic competitor monitoring
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
    - feedparser
    - beautifulsoup4
    - pandas
    - custom scrapers
---

# Competitive Intelligence Tracker

## Overview

The Competitive Intelligence Tracker skill provides systematic capabilities for monitoring, collecting, and analyzing competitive intelligence. It enables organizations to track competitor activities, market positioning, and strategic moves for informed decision-making.

## Capabilities

- Competitor profile management
- News and event monitoring
- Product/pricing change tracking
- SWOT analysis automation
- Competitive positioning maps
- Market share tracking
- Battlecard generation
- Alert configuration

## Used By Processes

- Competitor Monitoring System Setup
- Competitive Battlecard Development
- Industry Trend Analysis

## Usage

### Competitor Profile

```python
# Define competitor profile
competitor_profile = {
    "id": "COMP-001",
    "name": "Acme Corporation",
    "website": "https://www.acme.com",
    "profile": {
        "description": "Global leader in industrial automation solutions",
        "founded": 1985,
        "headquarters": "Chicago, IL",
        "employees": {"estimate": 15000, "source": "LinkedIn", "date": "2024-01"},
        "revenue": {"estimate": 2500000000, "source": "Annual Report", "year": 2023},
        "public_private": "Public",
        "ticker": "ACME"
    },
    "products": [
        {
            "name": "AutomationPro",
            "category": "Industrial Software",
            "positioning": "Enterprise",
            "pricing_model": "Subscription",
            "price_range": {"min": 50000, "max": 500000, "unit": "annual"}
        }
    ],
    "leadership": [
        {"name": "John Smith", "title": "CEO", "since": "2020"},
        {"name": "Jane Doe", "title": "CTO", "since": "2018"}
    ],
    "segments": ["Manufacturing", "Energy", "Transportation"],
    "geographies": ["North America", "Europe", "Asia Pacific"]
}
```

### Monitoring Configuration

```python
# Configure monitoring
monitoring_config = {
    "competitor_id": "COMP-001",
    "sources": [
        {"type": "news", "keywords": ["Acme Corporation", "AutomationPro"], "frequency": "daily"},
        {"type": "sec_filings", "ticker": "ACME", "forms": ["10-K", "10-Q", "8-K"]},
        {"type": "patents", "assignee": "Acme Corporation", "frequency": "weekly"},
        {"type": "job_postings", "company": "Acme", "platforms": ["LinkedIn", "Indeed"]},
        {"type": "social_media", "handles": ["@AcmeCorp"], "platforms": ["Twitter", "LinkedIn"]},
        {"type": "pricing", "urls": ["https://www.acme.com/pricing"], "frequency": "weekly"}
    ],
    "alerts": [
        {"event": "leadership_change", "severity": "high"},
        {"event": "product_launch", "severity": "high"},
        {"event": "pricing_change", "severity": "medium"},
        {"event": "acquisition", "severity": "high"},
        {"event": "layoffs", "severity": "medium"}
    ]
}
```

### SWOT Analysis

```python
# Competitor SWOT
swot_analysis = {
    "competitor_id": "COMP-001",
    "date": "2024-01-15",
    "strengths": [
        {"item": "Strong brand recognition", "evidence": "Industry surveys", "impact": "high"},
        {"item": "Deep technical expertise", "evidence": "Patent portfolio", "impact": "high"},
        {"item": "Global distribution network", "evidence": "Partner count", "impact": "medium"}
    ],
    "weaknesses": [
        {"item": "Legacy technology stack", "evidence": "Customer feedback", "impact": "medium"},
        {"item": "High pricing", "evidence": "Win/loss data", "impact": "high"},
        {"item": "Slow innovation cycle", "evidence": "Release frequency", "impact": "medium"}
    ],
    "opportunities": [
        {"item": "Cloud migration trend", "evidence": "Market research", "impact": "high"},
        {"item": "Emerging markets expansion", "evidence": "No presence in SEA", "impact": "medium"}
    ],
    "threats": [
        {"item": "New market entrants", "evidence": "Startup funding", "impact": "medium"},
        {"item": "Customer consolidation", "evidence": "M&A activity", "impact": "high"}
    ]
}
```

### Battlecard Content

```python
# Generate battlecard
battlecard_config = {
    "competitor_id": "COMP-001",
    "our_product": "OurSolution",
    "sections": [
        "quick_overview",
        "head_to_head_comparison",
        "win_themes",
        "landmines",
        "objection_handling",
        "customer_references"
    ],
    "target_audience": "sales",
    "format": "one_page"
}
```

## Input Schema

```json
{
  "operation": "profile|monitor|analyze|battlecard|alert",
  "competitor_profile": {
    "id": "string",
    "name": "string",
    "profile": "object",
    "products": ["object"]
  },
  "monitoring_config": {
    "sources": ["object"],
    "alerts": ["object"],
    "frequency": "string"
  },
  "analysis_request": {
    "type": "swot|positioning|market_share",
    "parameters": "object"
  }
}
```

## Output Schema

```json
{
  "competitor_profile": "object",
  "intelligence_feed": [
    {
      "date": "string",
      "source": "string",
      "type": "string",
      "title": "string",
      "summary": "string",
      "relevance_score": "number",
      "action_required": "boolean"
    }
  ],
  "swot_analysis": "object",
  "positioning_map": {
    "dimensions": ["string", "string"],
    "competitors": [
      {"name": "string", "x": "number", "y": "number"}
    ]
  },
  "battlecard": "markdown string",
  "alerts_triggered": ["object"]
}
```

## Intelligence Sources

| Source | Data Type | Update Frequency |
|--------|-----------|------------------|
| News | Events, announcements | Real-time |
| SEC Filings | Financial, strategy | Quarterly |
| Patents | Innovation direction | Weekly |
| Job Postings | Hiring focus, expansion | Daily |
| Social Media | Messaging, sentiment | Real-time |
| Pricing Pages | Pricing strategy | Weekly |
| Review Sites | Customer sentiment | Weekly |
| Trade Shows | Product roadmap | Event-based |

## Best Practices

1. Maintain ethical boundaries - use public information only
2. Verify intelligence from multiple sources
3. Date-stamp all information
4. Distinguish facts from analysis/opinion
5. Update profiles regularly (quarterly minimum)
6. Focus on actionable intelligence
7. Share insights with relevant teams promptly

## Integration Points

- Feeds into Competitive Analyst agent
- Connects with Market Research Aggregator for context
- Supports Data Storytelling for presentations
- Integrates with War Game Orchestrator for simulations
