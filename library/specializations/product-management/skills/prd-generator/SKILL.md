---
name: prd-generator
description: Generate comprehensive Product Requirements Documents from structured inputs. Apply company templates, create technical specifications, define success metrics, build launch checklists, and version PRD changes over time.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob
---

# PRD Generator Skill

Generate comprehensive Product Requirements Documents with templates, technical specs, success metrics, and launch readiness checklists.

## Overview

This skill provides comprehensive capabilities for creating and managing Product Requirements Documents throughout the product development lifecycle. It transforms feature specifications into structured PRDs ready for cross-functional review.

## Capabilities

### PRD Generation
- Generate PRD from feature specifications
- Apply company templates and formatting
- Create multiple PRD variants (detailed, executive summary)
- Support incremental PRD development

### Technical Specifications
- Generate technical requirements sections
- Define API contracts and data models
- Specify integration requirements
- Document technical constraints

### Success Metrics
- Define success criteria and KPIs
- Create metric specifications
- Set launch and long-term targets
- Specify measurement methodology

### Launch Planning
- Build launch checklists
- Define go/no-go criteria
- Create rollout plans
- Document rollback procedures

### Version Management
- Track PRD changes over time
- Maintain revision history
- Support collaborative editing
- Generate change summaries

## Prerequisites

### Template Requirements
```yaml
Supported templates:
- Standard PRD
- Technical PRD (API/Platform)
- Growth Feature PRD
- MVP/Experiment PRD
- Custom templates
```

### Input Format
```json
{
  "feature": {
    "name": "Feature name",
    "description": "Brief description",
    "problem_statement": "Problem being solved",
    "target_users": ["persona1", "persona2"]
  },
  "template": "standard",
  "sections": ["all"] // or specific sections
}
```

## Usage Patterns

### Standard PRD Template
```markdown
# Product Requirements Document

## Document Info
| Field | Value |
|-------|-------|
| Feature Name | [Name] |
| Author | [PM Name] |
| Created | [Date] |
| Status | [Draft/Review/Approved] |
| Version | [1.0] |

---

## 1. Overview

### 1.1 Problem Statement
[What problem are we solving? Why now?]

### 1.2 Opportunity
[Market opportunity, business impact]

### 1.3 Target Users
[Primary and secondary user personas]

---

## 2. Goals & Success Metrics

### 2.1 Objectives
| Objective | Metric | Target | Timeline |
|-----------|--------|--------|----------|
| [Objective 1] | [Metric] | [Target] | [When] |

### 2.2 Non-Goals
- [What we explicitly won't do]

---

## 3. User Stories & Requirements

### 3.1 User Stories
[List of user stories with acceptance criteria]

### 3.2 Functional Requirements
| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | [Requirement] | P0 | [Notes] |

### 3.3 Non-Functional Requirements
- Performance: [Requirements]
- Security: [Requirements]
- Accessibility: [Requirements]

---

## 4. Solution Design

### 4.1 User Experience
[UX flow description, wireframe links]

### 4.2 Technical Approach
[High-level technical approach]

### 4.3 Dependencies
| Dependency | Team | Status |
|------------|------|--------|
| [Dependency] | [Team] | [Status] |

---

## 5. Launch Plan

### 5.1 Rollout Strategy
[Phased rollout plan]

### 5.2 Go/No-Go Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

### 5.3 Rollback Plan
[How to rollback if needed]

---

## 6. Open Questions
| Question | Owner | Due Date | Resolution |
|----------|-------|----------|------------|
| [Question] | [Owner] | [Date] | [Resolution] |

---

## Appendix
### A. Research & Data
### B. Competitive Analysis
### C. Technical Specifications
### D. Revision History
```

### PRD Generation Example
```markdown
## Input: Feature Specification

**Feature**: Smart Search with AI Suggestions
**Problem**: Users struggle to find relevant content, leading to frustration and abandonment.
**Target Users**: All registered users, especially new users.

---

## Generated PRD

# Product Requirements Document: Smart Search with AI Suggestions

## Document Info
| Field | Value |
|-------|-------|
| Feature Name | Smart Search with AI Suggestions |
| Author | [Generated] |
| Created | 2026-01-24 |
| Status | Draft |
| Version | 0.1 |

---

## 1. Overview

### 1.1 Problem Statement

Users currently struggle to find relevant content in our application:
- **40% of searches return zero results** (Analytics, Q4 2025)
- **Average 3.2 search attempts** before finding desired content
- **25% abandonment rate** when first search fails

This friction leads to user frustration, reduced engagement, and increased churn.

### 1.2 Opportunity

By implementing AI-powered search suggestions:
- Reduce zero-result searches by 60%
- Improve search success rate to first-try resolution
- Increase content discovery and engagement
- Differentiate from competitors with smarter search UX

**Business Impact**: Estimated 15% improvement in D30 retention based on correlation analysis.

### 1.3 Target Users

**Primary**: New users (0-30 days)
- Unfamiliar with content organization
- Need guidance on what's available
- Highest abandonment on search failure

**Secondary**: Power users
- Expect efficient search
- Value time savings
- Will adopt advanced features

---

## 2. Goals & Success Metrics

### 2.1 Objectives

| Objective | Metric | Target | Timeline |
|-----------|--------|--------|----------|
| Reduce search friction | Zero-result rate | < 15% | Launch + 30d |
| Improve findability | First-try success | > 70% | Launch + 30d |
| Increase engagement | Search-to-content clicks | +25% | Launch + 60d |
| Improve retention | D30 retention (searchers) | +5% | Launch + 90d |

### 2.2 Non-Goals

- We will NOT replace the existing basic search (this is an enhancement)
- We will NOT personalize suggestions in V1 (future iteration)
- We will NOT support voice search in this release

---

## 3. User Stories & Requirements

### 3.1 User Stories

**US-001: Search Suggestions**
As a user searching for content,
I want to see relevant suggestions as I type,
So that I can find what I'm looking for faster.

**Acceptance Criteria**:
- [ ] Suggestions appear after 2 characters typed
- [ ] Maximum 5 suggestions displayed
- [ ] Suggestions update within 200ms of typing
- [ ] Clicking suggestion executes search

**US-002: Typo Correction**
As a user who makes typos,
I want the search to understand my intent,
So that I still find relevant results.

**Acceptance Criteria**:
- [ ] System suggests corrections for misspellings
- [ ] "Did you mean..." shown when no exact matches
- [ ] User can click to search corrected term

### 3.2 Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | Display up to 5 search suggestions | P0 | Ranked by relevance |
| FR-002 | Support keyboard navigation of suggestions | P0 | Arrow keys, Enter |
| FR-003 | Show suggestion type (content, category) | P1 | Visual indicator |
| FR-004 | Handle typos with fuzzy matching | P1 | Levenshtein distance < 2 |
| FR-005 | Cache popular suggestions | P2 | Performance optimization |

### 3.3 Non-Functional Requirements

**Performance**:
- Suggestions load in < 200ms (p95)
- Search index updates within 5 minutes of content changes

**Security**:
- Suggestions respect user permissions
- No PII in suggestion logs

**Accessibility**:
- WCAG 2.1 AA compliant
- Screen reader support for suggestions

---

## 4. Solution Design

### 4.1 User Experience

[Wireframe link: /designs/smart-search-v1]

**Flow**:
1. User clicks search box
2. Recent searches shown (if any)
3. User types, suggestions appear after 2 chars
4. Suggestions update with each keystroke
5. User selects suggestion or presses Enter
6. Results displayed with matched terms highlighted

### 4.2 Technical Approach

**Search Infrastructure**:
- Elasticsearch with suggestion capability
- Prefix matching with boosted scoring
- Typo tolerance via fuzzy matching

**API**:
- New endpoint: `GET /api/search/suggest?q={query}`
- Response time SLA: 200ms p95

### 4.3 Dependencies

| Dependency | Team | Status |
|------------|------|--------|
| Elasticsearch upgrade | Platform | Scheduled Q1 |
| Search UI components | Design System | Available |
| Analytics tracking | Data | Needs spec |

---

## 5. Launch Plan

### 5.1 Rollout Strategy

1. **Week 1**: Internal dogfooding (employees)
2. **Week 2**: 5% of users (random sample)
3. **Week 3**: 25% of users (if metrics positive)
4. **Week 4**: 100% rollout

### 5.2 Go/No-Go Criteria

- [ ] p95 latency < 200ms in staging
- [ ] Zero P0 bugs in 5% rollout
- [ ] Suggestion relevance > 80% (sampled review)
- [ ] No increase in error rates

### 5.3 Rollback Plan

1. Disable feature flag `smart_search_suggestions`
2. Revert to basic search (no code change needed)
3. Notify users of temporary change

---

## 6. Open Questions

| Question | Owner | Due Date | Resolution |
|----------|-------|----------|------------|
| ML model vs rule-based for V1? | [Tech Lead] | 2026-01-28 | |
| How to handle multi-language? | [PM] | 2026-01-30 | |

---

## Appendix

### A. Research & Data
- User interview synthesis: [Link]
- Search analytics dashboard: [Link]
- Competitive analysis: [Link]

### B. Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-01-24 | [Generated] | Initial draft |
```

## Integration with Babysitter SDK

### Task Definition Example
```javascript
const prdGenerationTask = defineTask({
  name: 'generate-prd',
  description: 'Generate PRD from feature specification',

  inputs: {
    feature: { type: 'object', required: true },
    template: { type: 'string', default: 'standard' },
    sections: { type: 'array', default: ['all'] },
    includeTechnical: { type: 'boolean', default: true }
  },

  outputs: {
    prd: { type: 'string' },
    metadata: { type: 'object' },
    openQuestions: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Generate PRD for ${inputs.feature.name}`,
      skill: {
        name: 'prd-generator',
        context: {
          operation: 'generate',
          feature: inputs.feature,
          template: inputs.template,
          sections: inputs.sections,
          includeTechnical: inputs.includeTechnical
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

## Output Formats

### PRD Export Options
```yaml
Formats:
  - Markdown (.md)
  - Google Docs (via API)
  - Confluence (via API)
  - Notion (via API)
  - PDF (via converter)
```

### Structured JSON Export
```json
{
  "prd": {
    "metadata": {
      "title": "Smart Search with AI Suggestions",
      "version": "0.1",
      "status": "draft",
      "created": "2026-01-24",
      "author": "PM Name"
    },
    "sections": {
      "overview": {...},
      "goals": {...},
      "requirements": {...},
      "design": {...},
      "launch": {...}
    }
  },
  "validation": {
    "completeness": 0.85,
    "missingSections": ["competitive_analysis"],
    "warnings": ["No wireframes linked"]
  }
}
```

## Best Practices

1. **Start with Problem**: Always anchor PRD in user/business problem
2. **Be Specific on Metrics**: Vague goals lead to vague outcomes
3. **Include Non-Goals**: Explicitly state what you won't do
4. **Link to Research**: Reference supporting data
5. **Define Success Clearly**: How will you know this worked?
6. **Plan for Failure**: Include rollback and contingency plans

## Common Pitfalls

1. **Solution-First Thinking**: Start with problem, not solution
2. **Missing Metrics**: Every PRD needs measurable goals
3. **Scope Creep**: Use non-goals to prevent creep
4. **Vague Requirements**: Be specific and testable
5. **Missing Dependencies**: Identify blockers early

## References

- [ChatPRD MCP Integration](https://www.chatprd.ai/resources/PRD-for-Claude-Code)
- [prd-dxt Plugin](https://github.com/Njengah/prd-dxt)
- [GitHub Project Manager MCP](https://github.com/Faresabdelghany/github-project-manager-mcp)
- [Notion MCP Server](https://github.com/makenotion/notion-mcp-server)
- [Product Manager Toolkit](https://github.com/alirezarezvani/claude-skills)
