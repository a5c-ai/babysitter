---
name: user-story-generator
description: Generate and validate user stories from various inputs including requirements, research, and feature descriptions. Apply INVEST criteria validation, create acceptance criteria, split large stories, and convert between story formats.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob
---

# User Story Generator Skill

Generate well-formed user stories with INVEST validation, acceptance criteria, and story splitting from requirements and research inputs.

## Overview

This skill provides comprehensive capabilities for creating and managing user stories throughout the product development lifecycle. It transforms requirements, research insights, and feature descriptions into actionable user stories ready for development.

## Capabilities

### Story Generation
- Generate user stories from requirements descriptions
- Convert feature specs to user stories
- Create stories from research insights
- Transform job stories to user stories and vice versa

### INVEST Validation
- Independent: Story is self-contained
- Negotiable: Details can be discussed
- Valuable: Delivers user value
- Estimable: Team can estimate effort
- Small: Fits in a sprint
- Testable: Has clear acceptance criteria

### Acceptance Criteria
- Generate Given-When-Then criteria
- Create verification checklists
- Define edge cases and error conditions
- Specify non-functional requirements

### Story Splitting
- Split large stories into smaller ones
- Maintain value in each split
- Preserve story relationships
- Track split lineage

### Story Estimation
- Estimate story points based on complexity
- Suggest t-shirt sizing
- Identify estimation risks
- Compare to reference stories

## Prerequisites

### Input Formats
```
Supported inputs:
- Feature specifications (.md, .docx)
- Requirements documents
- Research synthesis outputs
- JTBD statements
- User feedback
```

## Usage Patterns

### User Story Format
```markdown
## Standard User Story Format

**As a** [user type/persona],
**I want** [goal/desire],
**So that** [benefit/value].

### Acceptance Criteria
- [ ] Given [context], when [action], then [result]
- [ ] Given [context], when [action], then [result]

### Notes
- [Additional context]
- [Technical considerations]
```

### User Story Generation Example
```markdown
## Input: Feature Requirement

**Feature**: Advanced Search Filters
**Description**: Users need to filter search results by date, category, and price range.

---

## Generated User Stories

### Story 1: Date Filter
**As a** shopper,
**I want to** filter search results by date range,
**So that** I can find recently added items.

**Acceptance Criteria**:
- [ ] Given I am on search results, when I select a date range, then results show only items added within that range
- [ ] Given I have a date filter applied, when I clear the filter, then all results are shown again
- [ ] Given I select an invalid date range (end before start), when I apply, then I see an error message

**Story Points**: 3
**Priority**: P1

---

### Story 2: Category Filter
**As a** shopper,
**I want to** filter search results by category,
**So that** I can narrow down to relevant items.

**Acceptance Criteria**:
- [ ] Given I am on search results, when I select one or more categories, then only matching items show
- [ ] Given multiple categories selected, when I view results, then items from any selected category appear (OR logic)
- [ ] Given I am on search results, when categories load, then I see a count of items per category

**Story Points**: 5
**Priority**: P1

---

### Story 3: Price Range Filter
**As a** budget-conscious shopper,
**I want to** filter search results by price range,
**So that** I only see items I can afford.

**Acceptance Criteria**:
- [ ] Given I am on search results, when I set min and max price, then only items in that range show
- [ ] Given I set only min price, when I apply filter, then items at or above that price show
- [ ] Given I set only max price, when I apply filter, then items at or below that price show
- [ ] Given I enter non-numeric values, when I try to apply, then I see a validation error

**Story Points**: 3
**Priority**: P2
```

### INVEST Validation Template
```markdown
## INVEST Validation Checklist

### Story: [Story Title]

| Criterion | Pass | Notes |
|-----------|------|-------|
| **Independent** | [ ] | Can be delivered without other stories |
| **Negotiable** | [ ] | Implementation details are flexible |
| **Valuable** | [ ] | Delivers value to user or business |
| **Estimable** | [ ] | Team can estimate with confidence |
| **Small** | [ ] | Can be completed in one sprint |
| **Testable** | [ ] | Has clear acceptance criteria |

### Validation Result
- **Score**: 5/6
- **Issues**: Story too large (not Small)
- **Recommendation**: Split into smaller stories
```

### Story Splitting Patterns
```markdown
## Story Splitting Techniques

### 1. Split by Workflow Steps
Original: "User can complete checkout"
Split into:
- User can add items to cart
- User can enter shipping address
- User can enter payment info
- User can review and confirm order

### 2. Split by Business Rules
Original: "User can apply discount codes"
Split into:
- User can apply percentage discount
- User can apply fixed amount discount
- User can apply free shipping code

### 3. Split by Data Variations
Original: "User can export report"
Split into:
- User can export report as CSV
- User can export report as PDF
- User can export report as Excel

### 4. Split by Operations (CRUD)
Original: "User can manage their profile"
Split into:
- User can view their profile
- User can edit their profile
- User can upload profile photo
- User can delete their account

### 5. Split by Platform
Original: "User can view dashboard"
Split into:
- User can view dashboard on web
- User can view dashboard on mobile app
- User can view dashboard on tablet
```

### Job Story to User Story Conversion
```markdown
## Job Story Format
When [situation],
I want to [motivation],
So I can [expected outcome].

## Conversion Example

### Job Story
When I'm preparing for my weekly team meeting,
I want to quickly see project status updates,
So I can discuss blockers and celebrate wins.

### Converted User Stories

**Story 1**: Dashboard Overview
As a team lead,
I want to see a summary of all project statuses on one page,
So that I can quickly prepare for team meetings.

**Story 2**: Recent Activity Feed
As a team lead,
I want to see recent updates and changes to projects,
So that I know what happened since my last check.

**Story 3**: Blocker Highlighting
As a team lead,
I want blocked items to be visually highlighted,
So that I can prioritize discussion of blockers in meetings.
```

## Integration with Babysitter SDK

### Task Definition Example
```javascript
const storyGenerationTask = defineTask({
  name: 'generate-user-stories',
  description: 'Generate user stories from requirements',

  inputs: {
    requirements: { type: 'string', required: true },
    persona: { type: 'string', default: 'user' },
    validateInvest: { type: 'boolean', default: true },
    includeAcceptanceCriteria: { type: 'boolean', default: true },
    estimatePoints: { type: 'boolean', default: false }
  },

  outputs: {
    stories: { type: 'array' },
    validationResults: { type: 'array' },
    splitSuggestions: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: 'Generate user stories from requirements',
      skill: {
        name: 'user-story-generator',
        context: {
          operation: 'generate',
          requirements: inputs.requirements,
          persona: inputs.persona,
          validateInvest: inputs.validateInvest,
          includeAcceptanceCriteria: inputs.includeAcceptanceCriteria,
          estimatePoints: inputs.estimatePoints
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

### Story Export Format (JSON)
```json
{
  "stories": [
    {
      "id": "US-001",
      "title": "Date Filter for Search",
      "persona": "shopper",
      "want": "filter search results by date range",
      "benefit": "can find recently added items",
      "acceptanceCriteria": [
        {
          "given": "I am on search results",
          "when": "I select a date range",
          "then": "results show only items added within that range"
        }
      ],
      "investValidation": {
        "independent": true,
        "negotiable": true,
        "valuable": true,
        "estimable": true,
        "small": true,
        "testable": true,
        "score": 6
      },
      "estimate": {
        "storyPoints": 3,
        "tshirtSize": "S"
      },
      "priority": "P1",
      "epic": "Search Improvements"
    }
  ],
  "metadata": {
    "generated": "2026-01-24",
    "source": "feature-spec.md",
    "totalStories": 3,
    "totalPoints": 11
  }
}
```

### Story Map Export
```markdown
# Story Map: Search Improvements

## User Journey: Find Products

### Discovery
| Step | Stories |
|------|---------|
| Search | US-001: Basic search |
| Filter | US-002: Date filter, US-003: Category filter, US-004: Price filter |
| Sort | US-005: Sort by relevance, US-006: Sort by price |

### Evaluation
| Step | Stories |
|------|---------|
| View Details | US-007: Product details |
| Compare | US-008: Side-by-side comparison |

### Release Plan
| Release | Stories | Points |
|---------|---------|--------|
| MVP | US-001, US-002, US-007 | 11 |
| R2 | US-003, US-004, US-005 | 11 |
| R3 | US-006, US-008 | 8 |
```

## Best Practices

1. **Focus on Value**: Every story should deliver value to the user
2. **Keep Stories Small**: If estimate > 8 points, consider splitting
3. **Write Testable Criteria**: Each criterion should be verifiable
4. **Avoid Technical Details**: Focus on what, not how
5. **Include Context**: Provide enough detail for the team
6. **Maintain Traceability**: Link stories to requirements/research

## Common Pitfalls

1. **Technical Stories**: "Refactor database" - frame as user benefit
2. **Too Large**: Break down epic-sized stories
3. **Too Small**: Don't create tasks disguised as stories
4. **Missing Acceptance Criteria**: Always include testable criteria
5. **Vague Value Statement**: Be specific about the benefit

## References

- [Agile Product Owner Claude Skill](https://github.com/alirezarezvani/claude-skills)
- [Product Manager Prompts - User Story Templates](https://github.com/deanpeters/product-manager-prompts)
- [PRD Specialist Plugin](https://github.com/ccplugins/awesome-claude-code-plugins)
- [CCPM - PRD to Story Workflow](https://github.com/automazeio/ccpm)
