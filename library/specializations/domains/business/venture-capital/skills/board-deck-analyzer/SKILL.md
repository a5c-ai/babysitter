---
name: board-deck-analyzer
description: Analyzes board decks for trends, flag issues, prepare discussion points
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: venture-capital
  domain: business
  skill-id: vc-skill-036
---

# Board Deck Analyzer

## Overview

The Board Deck Analyzer skill reviews portfolio company board materials to identify trends, flag issues, and prepare board members for effective engagement. It enables consistent, thorough board preparation across the portfolio.

## Capabilities

### Deck Analysis
- Parse board deck content
- Extract key metrics and updates
- Identify significant changes
- Compare to prior periods

### Trend Identification
- Track metric trends across meetings
- Identify improving/declining patterns
- Spot concerning trajectories
- Highlight positive momentum

### Issue Flagging
- Flag missed targets and goals
- Identify cash/runway concerns
- Spot team and execution issues
- Highlight strategic concerns

### Discussion Preparation
- Generate discussion questions
- Prepare talking points
- Identify topics requiring attention
- Support pre-board preparation

## Usage

### Analyze Board Deck
```
Input: Board deck document
Process: Parse and analyze content
Output: Analysis summary, key findings
```

### Compare to Prior Periods
```
Input: Current deck, historical decks
Process: Trend analysis
Output: Trend report, change highlights
```

### Generate Discussion Points
```
Input: Deck analysis, concerns
Process: Develop questions and topics
Output: Discussion preparation document
```

### Flag Issues
```
Input: Board materials, thresholds
Process: Identify concerns
Output: Issue flags, priority ranking
```

## Analysis Categories

| Category | Key Elements |
|----------|--------------|
| Financial | Revenue, burn, runway, KPIs |
| Product | Roadmap, delivery, metrics |
| Team | Hiring, departures, org changes |
| Market | Competition, customers, pipeline |
| Strategy | Direction, pivots, priorities |

## Integration Points

- **Board Engagement Process**: Core preparation skill
- **KPI Aggregator**: Connect to historical metrics
- **Action Item Tracker**: Link to follow-up tracking
- **Board Member Assistant (Agent)**: Support board prep

## Common Flags

| Flag Type | Trigger |
|-----------|---------|
| Cash Concern | Runway < 12 months |
| Performance | Significant miss to plan |
| Team | Key departure or hiring delays |
| Market | Competitive threat |
| Strategy | Major pivot or change |

## Best Practices

1. Review decks well before board meetings
2. Track metrics consistently over time
3. Prepare specific, constructive questions
4. Focus on strategic value-add
5. Follow up on prior meeting items
