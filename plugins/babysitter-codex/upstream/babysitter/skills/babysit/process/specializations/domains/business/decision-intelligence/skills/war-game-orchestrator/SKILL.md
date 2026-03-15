---
name: war-game-orchestrator
description: Business war game orchestration skill for competitive response simulation and strategic testing
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: decision-intelligence
  domain: business
  category: collaboration
  priority: lower
  tools-libraries:
    - custom workflows
    - collaboration tools
    - documentation generators
---

# War Game Orchestrator

## Overview

The War Game Orchestrator skill provides capabilities for designing, facilitating, and analyzing business war games. It enables organizations to stress-test strategies, anticipate competitive responses, and develop more robust strategic plans through simulated competitive interactions.

## Capabilities

- Team role assignment
- Scenario briefing generation
- Move and countermove tracking
- Timeline management
- Debrief facilitation
- Insight extraction
- Documentation and replay
- Learning synthesis

## Used By Processes

- War Gaming and Competitive Response Modeling
- Strategic Scenario Development
- Competitive Battlecard Development

## Usage

### War Game Design

```python
# Configure war game
war_game_config = {
    "name": "Market Entry Defense",
    "objective": "Test our response strategy to potential competitor entry",
    "scenario": {
        "context": "New competitor preparing to enter our core market with disruptive pricing",
        "time_frame": "Next 18 months simulated in 3 rounds",
        "market_conditions": "Moderate growth, price-sensitive customers"
    },
    "teams": [
        {
            "name": "Home Team",
            "role": "Our Company",
            "objective": "Defend market share while maintaining profitability",
            "participants": ["CEO", "VP Sales", "VP Product", "CFO"],
            "resources": {"budget": 10000000, "constraints": ["No price below cost"]}
        },
        {
            "name": "Red Team",
            "role": "New Entrant",
            "objective": "Capture 15% market share within 18 months",
            "participants": ["Strategy Consultant", "Former Competitor Exec", "Market Analyst"],
            "resources": {"budget": 50000000, "constraints": ["Must achieve profitability by Year 3"]}
        },
        {
            "name": "Market Team",
            "role": "Customers and Market",
            "objective": "Respond realistically to team moves",
            "participants": ["Customer Advisory Board Rep", "Industry Analyst"]
        }
    ],
    "rounds": [
        {"name": "Round 1", "time_period": "Months 1-6", "focus": "Initial moves"},
        {"name": "Round 2", "time_period": "Months 7-12", "focus": "Response and counter-response"},
        {"name": "Round 3", "time_period": "Months 13-18", "focus": "Sustained competition"}
    ],
    "duration": "Full day (8 hours)"
}
```

### Team Briefings

```python
# Generate team briefing
home_team_briefing = {
    "team": "Home Team",
    "your_role": "You are the leadership team of Incumbent Corp",
    "your_position": {
        "market_share": 0.45,
        "revenue": 200000000,
        "profit_margin": 0.25,
        "customer_base": 500,
        "brand_strength": "Strong, but seen as expensive",
        "product_portfolio": ["Enterprise Suite", "SMB Lite", "Professional"]
    },
    "intelligence_on_competitor": {
        "known": ["Well-funded startup", "Hiring aggressively", "Cloud-native technology"],
        "rumored": ["Targeting enterprise segment", "Freemium model consideration"],
        "unknown": ["Launch timing", "Initial pricing", "Channel strategy"]
    },
    "your_objective": "Maintain at least 40% market share while keeping margin above 20%",
    "available_moves": [
        "Pricing changes",
        "New product launch",
        "Marketing campaigns",
        "Partnership announcements",
        "Acquisition offers",
        "Contract incentives"
    ],
    "constraints": [
        "Board has approved up to $10M defensive spending",
        "Cannot reduce prices below 15% margin",
        "Must maintain service levels"
    ]
}
```

### Move Tracking

```python
# Track moves and outcomes
game_log = {
    "round": 1,
    "moves": [
        {
            "sequence": 1,
            "team": "Red Team",
            "move": {
                "type": "Product Launch",
                "details": "Launch cloud-native enterprise product at 30% below incumbent pricing",
                "investment": 5000000,
                "target_segment": "Mid-market enterprises"
            },
            "rationale": "Establish beachhead in price-sensitive segment"
        },
        {
            "sequence": 2,
            "team": "Market Team",
            "response": {
                "customer_reaction": "High interest, 15% of prospects request demos",
                "market_shift": "Price expectations decrease 10%",
                "media_coverage": "Positive coverage of new entrant"
            }
        },
        {
            "sequence": 3,
            "team": "Home Team",
            "move": {
                "type": "Defensive Bundle",
                "details": "Launch loyalty program with 20% discount for 3-year commitments",
                "investment": 3000000,
                "target_segment": "Existing customers in target segment"
            },
            "rationale": "Lock in existing customers before they evaluate competitor"
        }
    ],
    "round_outcomes": {
        "home_team_market_share": 0.43,
        "red_team_market_share": 0.05,
        "home_team_margin": 0.23,
        "key_events": ["Three major accounts considering switch", "One partnership announced"]
    }
}
```

### Debrief and Insights

```python
# Debrief structure
debrief = {
    "game_summary": {
        "final_market_shares": {"Home Team": 0.38, "Red Team": 0.12, "Others": 0.50},
        "home_team_margin": 0.18,
        "home_team_result": "Objective partially met (share < 40%, margin close to target)"
    },
    "key_insights": [
        {
            "insight": "Speed of response critical - 6-month delay in Round 1 response cost 3% share",
            "evidence": "Comparison of Round 1 vs Round 2 response effectiveness",
            "implication": "Pre-plan defensive moves before competitor launches"
        },
        {
            "insight": "Existing customer retention more cost-effective than winning competitive deals",
            "evidence": "Cost per retained customer vs cost per competitive win",
            "implication": "Prioritize retention program investment"
        },
        {
            "insight": "Product innovation narrative more effective than pure price response",
            "evidence": "Market Team feedback on customer decision factors",
            "implication": "Lead with value, not price in competitive messaging"
        }
    ],
    "strategic_recommendations": [
        "Develop pre-approved response playbook for competitor entry scenarios",
        "Accelerate cloud-native product roadmap",
        "Strengthen customer success program for at-risk accounts",
        "Establish competitive intelligence monitoring system"
    ],
    "follow_up_actions": [
        {"action": "Develop response playbook", "owner": "Strategy", "due": "30 days"},
        {"action": "Customer retention program design", "owner": "Customer Success", "due": "45 days"}
    ]
}
```

## Input Schema

```json
{
  "operation": "design|brief|track|debrief|report",
  "war_game_config": {
    "name": "string",
    "objective": "string",
    "scenario": "object",
    "teams": ["object"],
    "rounds": ["object"]
  },
  "game_log": {
    "round": "number",
    "moves": ["object"],
    "outcomes": "object"
  },
  "debrief": "object"
}
```

## Output Schema

```json
{
  "briefings": {
    "team_name": "string (markdown)"
  },
  "game_state": {
    "current_round": "number",
    "market_positions": "object",
    "pending_moves": ["object"]
  },
  "debrief_report": {
    "summary": "string",
    "insights": ["object"],
    "recommendations": ["string"],
    "actions": ["object"]
  },
  "full_documentation": "string (markdown)"
}
```

## War Game Formats

| Format | Duration | Best For |
|--------|----------|----------|
| Tabletop | 2-4 hours | Quick strategy testing |
| Full Day | 6-8 hours | Comprehensive competitive simulation |
| Multi-Day | 2-3 days | Complex market dynamics |
| Digital | Async | Distributed teams, extended scenarios |

## Best Practices

1. Assign Red Team to people who can think like competitors
2. Include Market Team for realistic customer responses
3. Provide sufficient intelligence to make informed moves
4. Enforce time limits to simulate real-world pressure
5. Capture all moves and rationale for learning
6. Focus debrief on insights, not winning/losing
7. Convert insights to actionable recommendations

## Integration Points

- Receives scenarios from Scenario Narrative Generator
- Connects with Competitive Intelligence Tracker for background
- Supports War Game Facilitator agent
- Integrates with Decision Journal for learning capture
