# PRD Generator Skill

## Overview

The PRD Generator skill creates comprehensive Product Requirements Documents from feature specifications and structured inputs. It applies standardized templates, generates technical specifications, defines success metrics, and produces launch-ready documentation.

## Purpose

Product Requirements Documents are essential artifacts that align cross-functional teams on what to build and why. This skill enables:

- **Consistent Documentation**: Apply standard templates across products
- **Complete Coverage**: Ensure all necessary sections are addressed
- **Rapid Drafting**: Generate first drafts quickly from specifications
- **Iterative Refinement**: Update PRDs as requirements evolve

## Use Cases

### 1. New Feature PRD
Generate comprehensive PRD for new feature development.

### 2. MVP Definition
Create lightweight PRD for minimum viable product experiments.

### 3. Technical PRD
Generate detailed technical specifications for API/platform features.

### 4. PRD Review Preparation
Ensure PRD completeness before stakeholder review.

## Processes That Use This Skill

- **Feature Definition and PRD** (`feature-definition-prd.js`)
- **Product Launch GTM** (`product-launch-gtm.js`)
- **Beta Program Management** (`beta-program.js`)
- **Quarterly Roadmap** (`quarterly-roadmap.js`)

## PRD Templates

### Standard PRD
Full-featured PRD for major product initiatives.

| Section | Content |
|---------|---------|
| Overview | Problem, opportunity, users |
| Goals | Objectives, metrics, non-goals |
| Requirements | User stories, functional/non-functional |
| Design | UX, technical approach, dependencies |
| Launch | Rollout, go/no-go, rollback |
| Appendix | Research, competitive analysis |

### Technical PRD
Focused on API/platform development.

| Section | Content |
|---------|---------|
| Overview | Problem, API consumers |
| API Specification | Endpoints, schemas, authentication |
| Data Model | Entities, relationships |
| Integration | Dependencies, migration |
| Performance | SLAs, scaling requirements |

### MVP PRD
Lightweight PRD for experiments.

| Section | Content |
|---------|---------|
| Hypothesis | What we're testing |
| Success Criteria | How we'll measure |
| Minimum Scope | What's included |
| Out of Scope | What's excluded |
| Timeline | Duration and milestones |

## Input Specification

```json
{
  "feature": {
    "name": "Smart Search",
    "description": "AI-powered search suggestions",
    "problem_statement": "Users struggle to find content",
    "target_users": ["new_users", "power_users"],
    "business_impact": "Improve retention by 5%"
  },
  "template": "standard",
  "options": {
    "includeTechnical": true,
    "generateUserStories": true,
    "includeCompetitive": false
  }
}
```

## Output Specification

```json
{
  "prd": {
    "content": "[Markdown PRD content]",
    "format": "markdown"
  },
  "metadata": {
    "title": "Smart Search PRD",
    "version": "0.1",
    "wordCount": 2500,
    "sections": ["overview", "goals", "requirements", "design", "launch"]
  },
  "validation": {
    "completeness": 0.90,
    "warnings": ["Missing wireframe links"],
    "suggestions": ["Add competitive analysis"]
  },
  "openQuestions": [
    {
      "question": "ML model vs rule-based?",
      "owner": null,
      "dueDate": null
    }
  ]
}
```

## Workflow

### Phase 1: Input Analysis
1. Parse feature specification
2. Identify target template
3. Extract key information
4. Note gaps in input

### Phase 2: Section Generation
1. Generate overview from problem statement
2. Create goals and metrics
3. Develop requirements from features
4. Draft design approach
5. Build launch plan

### Phase 3: Enhancement
1. Add user stories if requested
2. Include technical specifications
3. Generate success metrics
4. Create launch checklist

### Phase 4: Validation
1. Check section completeness
2. Identify missing elements
3. Flag open questions
4. Generate suggestions

### Phase 5: Output
1. Format document
2. Apply template styling
3. Include metadata
4. Export to requested format

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `template` | standard | PRD template to use |
| `includeTechnical` | true | Include technical specs |
| `generateUserStories` | true | Generate user stories |
| `includeMetrics` | true | Include success metrics |
| `outputFormat` | markdown | Export format |

## Integration with Other Skills

- **user-story-generator**: Generate stories for requirements section
- **prioritization-calculator**: Include priority scores
- **product-analytics**: Pull metrics for goals section
- **competitive-intel**: Add competitive analysis

## PRD Sections Deep Dive

### Problem Statement
```markdown
## Problem Statement

[What] Users currently struggle to find relevant content.
[Evidence] 40% of searches return zero results.
[Impact] This leads to frustration and churn.
[Why Now] Competitor X just launched smart search.
```

### Goals & Metrics
```markdown
## Goals

| Objective | Metric | Current | Target | Timeline |
|-----------|--------|---------|--------|----------|
| Reduce friction | Zero-result rate | 40% | <15% | L+30d |
| Improve success | First-try success | 45% | >70% | L+30d |
```

### Requirements
```markdown
## Functional Requirements

| ID | Requirement | Priority | Acceptance |
|----|-------------|----------|------------|
| FR-001 | Show suggestions | P0 | Max 5, <200ms |
| FR-002 | Handle typos | P1 | Fuzzy match |
```

### Launch Plan
```markdown
## Launch Plan

### Rollout
1. Week 1: 5% (experiment)
2. Week 2: 25% (validation)
3. Week 3: 100% (full rollout)

### Go/No-Go
- [ ] P95 latency < 200ms
- [ ] Zero P0 bugs
- [ ] Relevance > 80%
```

## Best Practices

### 1. Start with Why
Always anchor the PRD in user/business problem.

### 2. Be Measurable
Every goal should have a specific metric and target.

### 3. Scope Clearly
Use non-goals to prevent scope creep.

### 4. Plan for Failure
Include rollback and contingency plans.

### 5. Link to Evidence
Reference research, data, and competitive analysis.

## Troubleshooting

### Common Issues

1. **Incomplete Input**: Prompt for missing information
2. **Vague Requirements**: Request specific acceptance criteria
3. **Missing Metrics**: Suggest relevant KPIs
4. **Scope Unclear**: Recommend non-goals section

### Quality Checklist

- [ ] Problem statement is clear and evidence-based
- [ ] Goals have specific, measurable targets
- [ ] Requirements are testable
- [ ] Dependencies identified
- [ ] Launch plan includes rollback
- [ ] Open questions tracked

## Examples

### Input
```json
{
  "feature": {
    "name": "Dark Mode",
    "description": "System-wide dark color theme",
    "problem": "Users report eye strain in low light",
    "users": ["mobile_users", "night_users"]
  }
}
```

### Output (Excerpt)
```markdown
# PRD: Dark Mode

## Problem Statement
Users experience eye strain when using the app in low-light
environments. 35% of support tickets about "eye strain" mention
wanting a dark mode option.

## Goals
| Metric | Target |
|--------|--------|
| Adoption rate | >30% of MAU within 90 days |
| Support tickets (eye strain) | -50% |

## Non-Goals
- We will NOT auto-switch based on time (V2)
- We will NOT support custom themes (V2)
```

## References

- [ChatPRD MCP](https://www.chatprd.ai/resources/PRD-for-Claude-Code)
- [prd-dxt Plugin](https://github.com/Njengah/prd-dxt)
- [GitHub Project Manager MCP](https://github.com/Faresabdelghany/github-project-manager-mcp)
- [Notion MCP Server](https://github.com/makenotion/notion-mcp-server)
- [Product Manager Toolkit](https://github.com/alirezarezvani/claude-skills)
- Process: `feature-definition-prd.js`, `product-launch-gtm.js`
