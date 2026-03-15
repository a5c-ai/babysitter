# User Story Generator Skill

## Overview

The User Story Generator skill transforms requirements, research insights, and feature descriptions into well-formed user stories. It applies INVEST criteria validation, generates acceptance criteria, and supports story splitting for sprint planning.

## Purpose

Writing effective user stories is a critical skill that bridges product requirements and development execution. This skill enables:

- **Consistent Story Format**: Apply standard user story structure
- **Quality Validation**: Ensure stories meet INVEST criteria
- **Clear Acceptance**: Generate testable acceptance criteria
- **Appropriate Sizing**: Split stories for sprint fit

## Use Cases

### 1. Requirements Translation
Convert feature specifications into development-ready user stories.

### 2. Research to Backlog
Transform user research insights into actionable backlog items.

### 3. Sprint Preparation
Validate and split stories for sprint planning.

### 4. Story Quality Review
Evaluate existing stories against INVEST criteria.

## Processes That Use This Skill

- **Feature Definition and PRD** (`feature-definition-prd.js`)
- **User Story Mapping** (`user-story-mapping.js`)
- **JTBD Analysis** (`jtbd-analysis.js`)
- **MoSCoW Prioritization** (`moscow-prioritization.js`)

## Story Formats

### User Story
```
As a [persona],
I want [goal],
So that [benefit].
```

### Job Story
```
When [situation],
I want to [motivation],
So I can [outcome].
```

### Acceptance Criteria (Given-When-Then)
```
Given [context/precondition],
When [action/trigger],
Then [expected result].
```

## Input Specification

```json
{
  "source": "feature_spec",
  "content": "Users need the ability to filter search results by multiple criteria including date range, category, and price.",
  "persona": "shopper",
  "generateAcceptanceCriteria": true,
  "validateInvest": true,
  "estimatePoints": true,
  "referenceStories": [
    {"title": "Basic search", "points": 3}
  ]
}
```

## Output Specification

```json
{
  "stories": [
    {
      "id": "US-001",
      "title": "Filter by date range",
      "story": {
        "persona": "shopper",
        "want": "filter search results by date range",
        "benefit": "find recently added items"
      },
      "acceptanceCriteria": [
        {
          "given": "search results displayed",
          "when": "date range selected",
          "then": "results filtered by date"
        }
      ],
      "investScore": 6,
      "storyPoints": 3,
      "priority": "P1"
    }
  ],
  "summary": {
    "totalStories": 3,
    "totalPoints": 11,
    "averageInvestScore": 5.7
  }
}
```

## Workflow

### Phase 1: Input Analysis
1. Parse source document
2. Identify user personas
3. Extract requirements
4. Note constraints

### Phase 2: Story Generation
1. Create story statements
2. Apply persona context
3. Articulate value/benefit
4. Add context notes

### Phase 3: Criteria Creation
1. Identify happy path
2. Define edge cases
3. Specify error conditions
4. Add non-functional requirements

### Phase 4: Validation
1. Apply INVEST criteria
2. Check story size
3. Verify testability
4. Suggest improvements

### Phase 5: Estimation
1. Compare to reference stories
2. Assess complexity factors
3. Assign story points
4. Flag estimation risks

## INVEST Criteria

| Criterion | Question | Pass Criteria |
|-----------|----------|---------------|
| Independent | Can be delivered alone? | No blocking dependencies |
| Negotiable | Details flexible? | Implementation not prescribed |
| Valuable | Delivers user value? | Clear benefit stated |
| Estimable | Can estimate effort? | Understood by team |
| Small | Fits in sprint? | < 8 story points |
| Testable | Can verify done? | Clear acceptance criteria |

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `validateInvest` | true | Run INVEST validation |
| `generateAC` | true | Generate acceptance criteria |
| `estimatePoints` | false | Include point estimates |
| `splitThreshold` | 8 | Points threshold for split suggestion |
| `outputFormat` | json | Export format |

## Integration with Other Skills

- **user-research-synthesis**: Generate stories from research insights
- **prioritization-calculator**: Prioritize generated stories
- **prd-generator**: Include stories in PRD documents
- **persona-development**: Apply consistent personas

## Story Splitting Patterns

### By Workflow
```
Original: "Complete checkout"
Split:
1. Add to cart
2. Enter shipping
3. Enter payment
4. Confirm order
```

### By Data Type
```
Original: "Export report"
Split:
1. Export as CSV
2. Export as PDF
3. Export as Excel
```

### By User Type
```
Original: "View dashboard"
Split:
1. Admin dashboard
2. User dashboard
3. Guest dashboard
```

### By Operation
```
Original: "Manage profile"
Split:
1. View profile
2. Edit profile
3. Delete account
```

## Best Practices

### 1. Focus on User Value
Frame every story around user benefit, not technical implementation.

### 2. Keep Stories Independent
Avoid dependencies between stories when possible.

### 3. Write Testable Criteria
Each acceptance criterion should be verifiable.

### 4. Right-Size Stories
Aim for 1-8 story points; split larger stories.

### 5. Include Context
Provide enough detail for developers to understand intent.

## Troubleshooting

### Common Issues

1. **Stories Too Large**: Apply splitting patterns
2. **Missing Value**: Revisit user research for benefits
3. **Untestable Criteria**: Add specific, measurable conditions
4. **Dependent Stories**: Reframe or combine related work

### Quality Checklist

- [ ] Story follows As a/I want/So that format
- [ ] Persona is specific and defined
- [ ] Benefit clearly stated
- [ ] At least 3 acceptance criteria
- [ ] INVEST score >= 5
- [ ] Story points assigned
- [ ] No technical implementation details

## Examples

### From Requirement to Story

**Requirement**: "Users should be able to save items for later"

**Generated Story**:
```
As a returning shopper,
I want to save items to a wishlist,
So that I can find them easily when I'm ready to buy.

Acceptance Criteria:
- Given I'm viewing a product, when I click "Save", then the item appears in my wishlist
- Given I have items in my wishlist, when I view the wishlist, then I see all saved items
- Given an item is in my wishlist, when I click "Remove", then it's removed from the list
```

### From Job Story to User Story

**Job Story**:
```
When I'm reviewing my team's work before a deadline,
I want to see what tasks are incomplete,
So I can follow up on blockers.
```

**User Stories**:
```
1. As a team lead, I want to filter tasks by status, so that I can focus on incomplete work.
2. As a team lead, I want to see task due dates, so that I can identify deadline risks.
3. As a team lead, I want to see who is assigned to each task, so that I know who to follow up with.
```

## References

- [Agile Product Owner Skill](https://github.com/alirezarezvani/claude-skills)
- [Product Manager Prompts](https://github.com/deanpeters/product-manager-prompts)
- [PRD Specialist Plugin](https://github.com/ccplugins/awesome-claude-code-plugins)
- [CCPM Framework](https://github.com/automazeio/ccpm)
- Process: `feature-definition-prd.js`, `user-story-mapping.js`
