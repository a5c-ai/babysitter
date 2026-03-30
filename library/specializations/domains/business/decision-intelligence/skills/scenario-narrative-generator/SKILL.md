---
name: scenario-narrative-generator
description: Scenario narrative generation skill for creating vivid, consistent future scenario descriptions
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
  priority: medium
  tools-libraries:
    - LLM APIs
    - jinja2
    - markdown
---

# Scenario Narrative Generator

## Overview

The Scenario Narrative Generator skill creates vivid, internally consistent narratives for strategic scenarios. It transforms driving forces and uncertainties into compelling stories that help stakeholders envision alternative futures and test strategic options.

## Capabilities

- Driving forces integration
- Consistency checking across scenario elements
- Narrative arc construction
- Key event identification
- Implication extraction
- Headline generation
- Persona-in-scenario development
- Scenario comparison tables

## Used By Processes

- Strategic Scenario Development
- War Gaming and Competitive Response Modeling
- What-If Analysis Framework

## Usage

### Scenario Framework

```python
# Define scenario framework
scenario_framework = {
    "focus_question": "What will the enterprise software market look like in 2030?",
    "time_horizon": "2030",
    "critical_uncertainties": [
        {
            "name": "AI Adoption Rate",
            "dimension": "Technology",
            "poles": ["Rapid AI Integration", "Gradual AI Adoption"]
        },
        {
            "name": "Regulatory Environment",
            "dimension": "Political",
            "poles": ["Tech-Friendly Regulation", "Restrictive Regulation"]
        }
    ],
    "scenario_matrix": {
        "scenarios": [
            {"name": "AI Explosion", "position": ["Rapid AI", "Tech-Friendly"]},
            {"name": "Regulated Innovation", "position": ["Rapid AI", "Restrictive"]},
            {"name": "Steady Progress", "position": ["Gradual AI", "Tech-Friendly"]},
            {"name": "Digital Caution", "position": ["Gradual AI", "Restrictive"]}
        ]
    }
}
```

### Scenario Elements

```python
# Define scenario elements
scenario_elements = {
    "scenario_name": "AI Explosion",
    "driving_forces": {
        "technology": "AI capabilities advance rapidly, with AGI breakthroughs",
        "economy": "Massive productivity gains fuel economic growth",
        "society": "Workforce disruption creates social tension",
        "regulation": "Governments adopt innovation-friendly policies"
    },
    "key_events": [
        {"year": 2025, "event": "First enterprise AGI deployment"},
        {"year": 2026, "event": "50% of software written by AI"},
        {"year": 2027, "event": "Major productivity leap in white-collar work"},
        {"year": 2028, "event": "Traditional software vendors consolidate"},
        {"year": 2029, "event": "New AI-native competitors dominate"},
        {"year": 2030, "event": "Enterprise software market unrecognizable"}
    ],
    "stakeholder_impacts": {
        "customers": "Expect AI-first solutions, willing to pay premium for automation",
        "competitors": "AI-native startups disrupt incumbents",
        "employees": "Massive reskilling required",
        "investors": "Flight to AI leaders, traditional valuations collapse"
    }
}
```

### Narrative Generation

```python
# Generate narrative
narrative_config = {
    "scenario_name": "AI Explosion",
    "style": "journalist_from_the_future",
    "length": "1500_words",
    "structure": {
        "headline": True,
        "opening_hook": True,
        "timeline_narrative": True,
        "stakeholder_vignettes": True,
        "implications_summary": True
    },
    "persona": {
        "include": True,
        "name": "Sarah Chen",
        "role": "CIO of a mid-size manufacturer",
        "journey": "How her company navigated this world"
    }
}
```

### Consistency Check

```python
# Check narrative consistency
consistency_check = {
    "checks": [
        {
            "type": "causal_logic",
            "elements": ["rapid_ai", "workforce_disruption"],
            "result": "consistent",
            "note": "AI adoption logically leads to job displacement"
        },
        {
            "type": "timeline",
            "elements": ["AGI_2025", "software_dominance_2026"],
            "result": "plausible",
            "note": "12-month gap is tight but possible given premise"
        },
        {
            "type": "contradiction",
            "elements": ["innovation_friendly_regulation", "strict_ai_oversight"],
            "result": "inconsistent",
            "note": "Resolve: clarify regulation is permissive on development, focused on safety"
        }
    ]
}
```

### Comparison Table

```python
# Generate comparison table
comparison_config = {
    "scenarios": ["AI Explosion", "Regulated Innovation", "Steady Progress", "Digital Caution"],
    "dimensions": [
        "Market Size 2030",
        "Number of Major Vendors",
        "AI Penetration Rate",
        "Regulatory Burden",
        "Workforce Impact",
        "Key Success Factors",
        "Strategic Implications"
    ]
}
```

## Input Schema

```json
{
  "scenario_framework": {
    "focus_question": "string",
    "time_horizon": "string",
    "critical_uncertainties": ["object"],
    "scenario_matrix": "object"
  },
  "scenario_elements": {
    "driving_forces": "object",
    "key_events": ["object"],
    "stakeholder_impacts": "object"
  },
  "narrative_config": {
    "style": "string",
    "length": "string",
    "structure": "object",
    "persona": "object"
  }
}
```

## Output Schema

```json
{
  "narrative": {
    "headline": "string",
    "body": "string (markdown)",
    "word_count": "number"
  },
  "persona_story": {
    "name": "string",
    "journey": "string"
  },
  "key_events_timeline": ["object"],
  "implications": {
    "strategic": ["string"],
    "operational": ["string"],
    "capability_gaps": ["string"]
  },
  "comparison_table": "object",
  "consistency_report": "object"
}
```

## Narrative Styles

| Style | Characteristics | Best For |
|-------|-----------------|----------|
| Journalist | News article from the future | Vivid, accessible |
| Historian | Looking back at changes | Analytical, comprehensive |
| Day-in-the-Life | Personal experience | Emotional, relatable |
| Strategic Briefing | Executive summary | Time-efficient, action-oriented |

## Best Practices

1. Make scenarios vivid and memorable with specific details
2. Ensure internal consistency within each scenario
3. Make scenarios sufficiently different from each other
4. Balance plausibility with challenge to conventional thinking
5. Include both opportunities and threats
6. Use personas to make abstract futures tangible
7. Connect scenarios to strategic decisions

## Scenario Quality Criteria

| Criterion | Description |
|-----------|-------------|
| Plausibility | Could this happen given current trends? |
| Consistency | Do elements logically fit together? |
| Relevance | Does it address the focus question? |
| Differentiation | Is it distinct from other scenarios? |
| Usability | Can stakeholders engage with it? |
| Challenge | Does it stretch conventional thinking? |

## Integration Points

- Feeds into War Game Orchestrator for competitive scenarios
- Connects with System Dynamics Modeler for quantification
- Supports Scenario Planner agent
- Integrates with Strategic Options Analyst for strategy testing
