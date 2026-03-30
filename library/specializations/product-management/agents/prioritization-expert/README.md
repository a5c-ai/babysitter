# Prioritization Expert Agent

## Overview

The Prioritization Expert agent is an autonomous PM agent specialized in product prioritization and resource allocation. It orchestrates prioritization frameworks (RICE, ICE, MoSCoW), analyzes tradeoffs, and produces defensible priority rankings for product development.

## Purpose

Prioritization is one of the most critical and contested activities in product management. This agent brings rigor and consistency to prioritization decisions by:

- **Applying Frameworks Consistently**: Same methodology across all items
- **Using Data**: Ground decisions in quantitative evidence
- **Documenting Rationale**: Make decision logic explicit and reviewable
- **Balancing Perspectives**: Consider multiple stakeholder viewpoints

## Capabilities

| Capability | Description |
|------------|-------------|
| RICE Scoring | Calculate and rank by Reach, Impact, Confidence, Effort |
| ICE Scoring | Quick prioritization for growth experiments |
| MoSCoW Categorization | Scope releases with fixed deadlines |
| Capacity Planning | Match priorities to team capacity |
| Tradeoff Analysis | Analyze and document competing priorities |
| Backlog Management | Rank and groom product backlogs |

## Required Skills

This agent requires the following skills to function:

1. **prioritization-calculator**: Calculate framework scores
2. **user-research-synthesis**: Understand user impact
3. **product-analytics**: Get quantitative reach/impact data

## Processes That Use This Agent

- **RICE Prioritization** (`rice-prioritization.js`)
- **MoSCoW Prioritization** (`moscow-prioritization.js`)
- **Quarterly Roadmap** (`quarterly-roadmap.js`)
- **Feature Definition and PRD** (`feature-definition-prd.js`)

## Workflow

### Phase 1: Context Analysis

```
Input: Business objectives, constraints, stakeholders
Output: Prioritization context and constraints

Steps:
1. Understand strategic objectives and OKRs
2. Identify key stakeholders and their priorities
3. Review team capacity and capabilities
4. Document constraints (time, budget, dependencies)
```

### Phase 2: Data Gathering

```
Input: Backlog items, analytics access, research
Output: Scored items with supporting data

Steps:
1. Pull reach estimates from analytics
2. Synthesize user research for impact
3. Collect engineering effort estimates
4. Map dependencies between items
```

### Phase 3: Scoring

```
Input: Items with data, selected framework
Output: Calculated scores

Steps:
1. Apply framework formula to each item
2. Normalize scores for comparison
3. Validate with team (calibration)
4. Flag outliers and anomalies
```

### Phase 4: Analysis

```
Input: Scored items, capacity constraints
Output: Rankings, tradeoffs, recommendations

Steps:
1. Rank items by score
2. Apply capacity constraints
3. Identify tradeoffs
4. Generate recommendations
```

### Phase 5: Communication

```
Input: Analysis results
Output: Stakeholder-ready presentation

Steps:
1. Prepare priority presentation
2. Document decision rationale
3. Address anticipated objections
4. Publish final priorities
```

## Input Specification

```json
{
  "task": "prioritize_backlog",
  "items": [
    {
      "id": "FEAT-001",
      "name": "Advanced Search",
      "description": "AI-powered search suggestions",
      "scores": {
        "reach": 10000,
        "impact": 2,
        "confidence": 0.8,
        "effort": 4
      },
      "metadata": {
        "theme": "core_experience",
        "requestedBy": "product",
        "dependencies": []
      }
    }
  ],
  "config": {
    "framework": "rice",
    "teamCapacity": 20,
    "strategicThemes": ["retention", "growth"],
    "mustHaveItems": ["FEAT-003"]
  }
}
```

## Output Specification

```json
{
  "success": true,
  "rankings": [
    {
      "rank": 1,
      "id": "FEAT-001",
      "name": "Advanced Search",
      "score": 4000,
      "scoreBreakdown": {
        "reach": 10000,
        "impact": 2,
        "confidence": 0.8,
        "effort": 4
      },
      "recommendation": "execute",
      "rationale": "High reach and impact, good confidence, reasonable effort"
    }
  ],
  "capacityAnalysis": {
    "totalCapacity": 20,
    "allocatedCapacity": 18,
    "utilization": 0.90,
    "fittingItems": ["FEAT-001", "FEAT-002", "FEAT-003"],
    "overflowItems": ["FEAT-004"]
  },
  "tradeoffs": [
    {
      "items": ["FEAT-002", "FEAT-004"],
      "description": "Both target same user segment, only capacity for one",
      "recommendation": "FEAT-002",
      "rationale": "Higher confidence and lower effort"
    }
  ],
  "recommendations": [
    {
      "action": "Defer FEAT-004 to next quarter",
      "rationale": "Capacity overflow, lower priority than alternatives"
    }
  ]
}
```

## Decision Logic

### Framework Selection

| Context | Recommended Framework |
|---------|----------------------|
| Quarterly planning | RICE |
| Growth experiments | ICE |
| Fixed-date release | MoSCoW |
| Complex tradeoffs | Weighted Scoring |

### Handling Uncertainty

| Confidence Level | Recommendation |
|------------------|----------------|
| High (0.8-1.0) | Proceed with execution |
| Medium (0.5-0.8) | Validate with small experiment |
| Low (<0.5) | Gather more data before committing |

### Conflict Resolution

| Conflict Type | Resolution Approach |
|--------------|---------------------|
| Sales vs. Product | Quantify both, align to strategy |
| Short vs. Long term | Allocate capacity percentage |
| Big bet vs. Safe bet | Balance portfolio risk |

## Integration

### With Other Agents

```
product-strategist ──> prioritization-expert ──> stakeholder-manager
       │                        │                        │
       └── strategic direction  └── priorities          └── communication
```

### With Skills

```
prioritization-expert
    ├── prioritization-calculator (scoring)
    ├── user-research-synthesis (impact data)
    └── product-analytics (reach data)
```

## Usage Example

### In Babysitter Process

```javascript
// rice-prioritization.js

const prioritizationResult = await ctx.task(prioritizeBacklogTask, {
  items: backlogItems,
  framework: 'rice',
  teamCapacity: 20,
  strategicThemes: ['retention', 'growth']
});

// Check results
if (prioritizationResult.capacityAnalysis.utilization > 1.0) {
  ctx.log('warn', 'Over capacity - need to descope or extend timeline');
}

// Output rankings for stakeholder review
ctx.output('rankings', prioritizationResult.rankings);
```

### Direct Agent Call

```javascript
const task = defineTask({
  name: 'quarterly-prioritization',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Q2 Feature Prioritization',
      agent: {
        name: 'prioritization-expert',
        prompt: {
          role: 'Senior Director of Product',
          task: 'Prioritize Q2 feature candidates and recommend roadmap',
          context: {
            quarter: 'Q2 2026',
            teamCapacity: 60,
            strategicFocus: 'retention and expansion'
          },
          instructions: [
            'Review all submitted feature requests',
            'Score using RICE framework',
            'Fit to available capacity',
            'Identify top 5 priorities with rationale',
            'Document tradeoffs for review meeting'
          ]
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Best Practices

1. **Calibrate Scores**: Hold team calibration sessions for consistency
2. **Use Real Data**: Prefer analytics over guesses for Reach
3. **Document Everything**: Record how scores were determined
4. **Review Regularly**: Update priorities as new information arrives
5. **Communicate Tradeoffs**: Make tradeoffs explicit to stakeholders
6. **Balance Horizons**: Include both short-term wins and long-term bets

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Missing scores | Incomplete input data | Flag items, use conservative defaults |
| Score inflation | Optimism bias | Calibrate with historical data |
| Capacity overflow | Too many priorities | Descope or extend timeline |
| Stakeholder conflict | Misaligned objectives | Escalate with data |

## Related Resources

- Skills: `prioritization-calculator/SKILL.md`
- Skills: `user-research-synthesis/SKILL.md`
- Skills: `product-analytics/SKILL.md`
- Processes: `rice-prioritization.js`, `moscow-prioritization.js`
- References: [RICE Prioritizer](https://github.com/alirezarezvani/claude-skills), [Sprint Prioritizer](https://github.com/ccplugins/awesome-claude-code-plugins)
