---
name: data-storytelling
description: Narrative generation skill for transforming analytical insights into compelling business stories
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: decision-intelligence
  domain: business
  category: visualization
  priority: medium
  shared-candidate: true
  tools-libraries:
    - openai/anthropic APIs
    - jinja2
    - markdown
---

# Data Storytelling

## Overview

The Data Storytelling skill transforms analytical insights into compelling, actionable business narratives. It bridges the gap between complex analysis and executive decision-making by generating clear, contextual, and persuasive communications tailored to different audiences.

## Capabilities

- Insight prioritization and selection
- Narrative structure generation
- Chart annotation automation
- Key takeaway extraction
- Executive summary generation
- Recommendation framing
- Action item identification
- Audience-appropriate language adaptation

## Used By Processes

- Insight-to-Action Process
- Executive Dashboard Development
- Decision Documentation and Learning

## Usage

### Insight Input

```python
# Analytical insights to narrate
insights = {
    "context": {
        "analysis_type": "quarterly_performance",
        "period": "Q3 2024",
        "audience": "executive_leadership",
        "objective": "investment_decision"
    },
    "key_findings": [
        {
            "metric": "Revenue",
            "value": 12500000,
            "change": 0.15,
            "benchmark": "above_target",
            "significance": "high",
            "drivers": ["new_product_launch", "market_expansion"]
        },
        {
            "metric": "Customer Acquisition Cost",
            "value": 185,
            "change": 0.22,
            "benchmark": "above_target",
            "significance": "medium",
            "drivers": ["increased_competition", "channel_mix_shift"]
        }
    ],
    "supporting_data": {
        "visualizations": ["revenue_trend.png", "cac_breakdown.png"],
        "tables": ["segment_performance.csv"]
    }
}
```

### Narrative Configuration

```python
# Narrative structure configuration
narrative_config = {
    "structure": "situation_complication_resolution",
    "tone": "professional",
    "length": "executive_summary",  # or "detailed_report"
    "format": "markdown",
    "sections": [
        "headline",
        "key_takeaways",
        "context",
        "analysis",
        "recommendations",
        "next_steps"
    ],
    "emphasis": "actionable_recommendations"
}
```

### Audience Adaptation

```python
# Audience-specific settings
audience_profiles = {
    "executive_leadership": {
        "detail_level": "high_level",
        "jargon": "minimal",
        "focus": "strategic_implications",
        "format_preference": "bullet_points",
        "time_available": "2_minutes"
    },
    "technical_team": {
        "detail_level": "detailed",
        "jargon": "acceptable",
        "focus": "methodology_and_data",
        "format_preference": "full_narrative",
        "time_available": "15_minutes"
    },
    "board_of_directors": {
        "detail_level": "summary",
        "jargon": "none",
        "focus": "business_impact",
        "format_preference": "visual_heavy",
        "time_available": "5_minutes"
    }
}
```

## Narrative Structures

| Structure | Best For | Flow |
|-----------|----------|------|
| SCR (Situation-Complication-Resolution) | Problem-solving | Context -> Challenge -> Solution |
| Pyramid | Executive updates | Conclusion -> Supporting points -> Details |
| Before-After-Bridge | Change proposals | Current state -> Future state -> How to get there |
| STAR | Case studies | Situation -> Task -> Action -> Result |
| What-So What-Now What | Quick insights | Finding -> Implication -> Action |

## Input Schema

```json
{
  "insights": {
    "context": "object",
    "key_findings": ["object"],
    "supporting_data": "object"
  },
  "narrative_config": {
    "structure": "string",
    "tone": "string",
    "length": "string",
    "sections": ["string"]
  },
  "audience": {
    "profile": "string",
    "detail_level": "string",
    "time_available": "string"
  }
}
```

## Output Schema

```json
{
  "narrative": {
    "headline": "string",
    "executive_summary": "string",
    "sections": {
      "section_name": "string (markdown)"
    },
    "key_takeaways": ["string"],
    "recommendations": ["string"],
    "next_steps": [
      {
        "action": "string",
        "owner": "string",
        "timeline": "string"
      }
    ]
  },
  "annotations": {
    "visualization_id": "string annotation"
  },
  "metadata": {
    "word_count": "number",
    "reading_time": "string",
    "complexity_score": "number"
  }
}
```

## Best Practices

1. Lead with the most important insight (inverted pyramid)
2. Use specific numbers, not vague descriptors
3. Connect data to business outcomes
4. Include clear calls to action
5. Acknowledge limitations and uncertainties
6. Use active voice and strong verbs
7. Test narrative with representative audience member

## Annotation Guidelines

For chart annotations:
- Highlight the key insight, not just describe the data
- Use arrows and callouts sparingly
- Provide context (comparisons, benchmarks)
- Include "so what" implications

## Integration Points

- Receives insights from all analysis skills
- Connects with Decision Visualization for annotated charts
- Feeds into Decision Journal for documentation
- Supports Insight Translator agent for communication
