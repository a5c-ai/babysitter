---
name: pre-mortem-facilitator
description: Pre-mortem analysis skill for prospective hindsight and failure mode identification
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
    - custom workflows
    - markdown
    - collaboration tools
---

# Pre-mortem Facilitator

## Overview

The Pre-mortem Facilitator skill provides structured capabilities for conducting pre-mortem analyses. Using prospective hindsight, it helps teams identify potential failure modes before implementation, enabling proactive risk mitigation and more robust decision-making.

## Capabilities

- Pre-mortem session structuring
- Failure mode collection
- Frequency and impact assessment
- Mitigation strategy brainstorming
- Action item generation
- Bias challenge integration
- Documentation and tracking
- Follow-up scheduling

## Used By Processes

- Cognitive Bias Debiasing Process
- Decision Quality Assessment
- Structured Decision Making Process

## Usage

### Session Setup

```python
# Configure pre-mortem session
session_config = {
    "decision": "Launch of New Product Line",
    "decision_summary": "Expand into adjacent market with modified existing product",
    "investment": 5000000,
    "timeline": "18 months",
    "success_criteria": [
        "Achieve $10M revenue in year 1",
        "Capture 5% market share by year 2",
        "Maintain 40% gross margin"
    ],
    "participants": [
        {"name": "Project Lead", "role": "facilitator"},
        {"name": "Product Manager", "perspective": "product"},
        {"name": "Sales Director", "perspective": "market"},
        {"name": "Finance Lead", "perspective": "financial"},
        {"name": "Operations Lead", "perspective": "execution"},
        {"name": "External Advisor", "perspective": "devils_advocate"}
    ],
    "session_duration": 90  # minutes
}
```

### Pre-mortem Scenario

```python
# The hypothetical failure scenario
failure_scenario = {
    "date": "18 months from now",
    "headline": "Product Launch Fails to Meet Revenue Targets",
    "narrative": """
    It is now 18 months after the product launch. Despite significant investment
    and effort, the product has achieved only $3M in revenue (30% of target)
    and 1.5% market share. The project is being reviewed for discontinuation.

    Your task: Write down all the reasons why this failure occurred.
    Be specific and think about what went wrong from your perspective.
    """,
    "instructions": [
        "Work independently for 10 minutes",
        "Write down every reason you can think of",
        "Be specific - name names, dates, decisions",
        "Consider both internal and external factors",
        "Don't filter - capture all ideas"
    ]
}
```

### Failure Mode Collection

```python
# Collected failure modes
failure_modes = {
    "product": [
        {
            "id": "FM-001",
            "description": "Product features didn't meet customer needs in target segment",
            "contributor": "Product Manager",
            "category": "Product-Market Fit",
            "root_cause": "Insufficient customer research before development"
        },
        {
            "id": "FM-002",
            "description": "Quality issues led to negative reviews and returns",
            "contributor": "Operations Lead",
            "category": "Product Quality",
            "root_cause": "Rushed timeline compressed QA testing"
        }
    ],
    "market": [
        {
            "id": "FM-003",
            "description": "Competitor launched similar product at 30% lower price",
            "contributor": "Sales Director",
            "category": "Competitive Response",
            "root_cause": "Underestimated competitor agility"
        }
    ],
    "execution": [
        {
            "id": "FM-004",
            "description": "Key talent left mid-project, causing knowledge loss",
            "contributor": "Project Lead",
            "category": "Team",
            "root_cause": "No succession planning or documentation"
        }
    ],
    "external": [
        {
            "id": "FM-005",
            "description": "Economic downturn reduced customer budgets",
            "contributor": "Finance Lead",
            "category": "Economic",
            "root_cause": "No contingency for demand scenarios"
        }
    ]
}
```

### Risk Assessment

```python
# Assess each failure mode
risk_assessment = {
    "FM-001": {
        "likelihood": 0.4,  # estimated probability
        "impact": "high",
        "impact_score": 4,
        "detectability": "low",  # how easily we'd see it coming
        "risk_priority": 6.4,  # likelihood * impact * (1/detectability)
    },
    "FM-002": {
        "likelihood": 0.3,
        "impact": "high",
        "impact_score": 4,
        "detectability": "medium",
        "risk_priority": 3.6
    }
    # ... assess all failure modes
}
```

### Mitigation Actions

```python
# Define mitigations
mitigation_actions = [
    {
        "failure_mode_ids": ["FM-001"],
        "action": "Conduct additional customer discovery with 20 target segment customers",
        "owner": "Product Manager",
        "due_date": "Before development start",
        "resources_needed": "Research budget $50K",
        "success_indicator": "Validated feature prioritization from customer feedback"
    },
    {
        "failure_mode_ids": ["FM-002"],
        "action": "Extend QA timeline by 4 weeks, add beta testing phase",
        "owner": "Operations Lead",
        "due_date": "Update in project plan",
        "resources_needed": "Schedule adjustment",
        "success_indicator": "Defect rate < 1% at launch"
    },
    {
        "failure_mode_ids": ["FM-003"],
        "action": "Develop competitive response playbook with pricing scenarios",
        "owner": "Sales Director",
        "due_date": "30 days before launch",
        "resources_needed": "Competitive intelligence input",
        "success_indicator": "Response plan for 3 competitor scenarios"
    }
]
```

## Input Schema

```json
{
  "session_config": {
    "decision": "string",
    "investment": "number",
    "timeline": "string",
    "success_criteria": ["string"],
    "participants": ["object"]
  },
  "failure_scenario": {
    "narrative": "string",
    "instructions": ["string"]
  },
  "failure_modes": ["object"],
  "risk_assessment": "object",
  "mitigations": ["object"]
}
```

## Output Schema

```json
{
  "session_summary": {
    "decision": "string",
    "date": "string",
    "participants": "number",
    "failure_modes_identified": "number"
  },
  "failure_modes": [
    {
      "id": "string",
      "description": "string",
      "category": "string",
      "likelihood": "number",
      "impact": "string",
      "risk_priority": "number"
    }
  ],
  "top_risks": ["object"],
  "mitigation_plan": [
    {
      "action": "string",
      "owner": "string",
      "due_date": "string",
      "addresses": ["string"]
    }
  ],
  "follow_up": {
    "next_review_date": "string",
    "unaddressed_risks": ["string"]
  }
}
```

## Pre-mortem Benefits

| Benefit | Mechanism |
|---------|-----------|
| Overcomes overconfidence | Assumes failure, forcing critical thinking |
| Surfaces hidden concerns | Safe space to voice doubts |
| Identifies blind spots | Multiple perspectives |
| Enables proactive action | Time to mitigate before commitment |
| Builds team alignment | Shared understanding of risks |

## Best Practices

1. Conduct before final commitment, not after
2. Make the failure scenario vivid and specific
3. Ensure psychological safety for honest input
4. Include diverse perspectives (skeptics welcome)
5. Focus on actionable failure modes
6. Convert insights to concrete mitigations
7. Follow up to ensure actions are completed

## Facilitation Tips

- Use independent writing before group discussion
- Encourage specificity ("John missed the deadline" vs. "delays occurred")
- Separate idea generation from evaluation
- Give equal airtime to all participants
- Document everything, even unlikely scenarios
- End with concrete next steps

## Integration Points

- Feeds into Risk Register Manager for tracking
- Connects with Decision Quality Assessor for process evaluation
- Supports Debiasing Coach agent
- Integrates with Decision Journal for documentation
