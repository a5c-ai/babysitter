---
name: user-story-writer
description: Generate and validate user stories from requirements with INVEST validation and acceptance criteria
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: business-analysis
  domain: business
  id: SK-006
  category: Agile Requirements
---

# User Story Writer

## Overview

The User Story Writer skill provides specialized capabilities for creating, validating, and managing user stories from business requirements. This skill enables conversion of traditional requirements into agile user stories with proper structure, validation against INVEST criteria, and comprehensive acceptance criteria.

## Capabilities

### BRD to User Story Conversion
- Convert Business Requirements Document requirements to user stories
- Extract user personas from requirement context
- Identify value propositions for each story
- Maintain traceability to source requirements

### INVEST Criteria Validation
- Validate user stories against INVEST criteria
- Score each criterion: Independent, Negotiable, Valuable, Estimable, Small, Testable
- Generate improvement suggestions for non-compliant stories
- Create validation reports

### Acceptance Criteria Generation
- Generate acceptance criteria using Given-When-Then format (Gherkin)
- Ensure criteria are testable and specific
- Cover happy path and edge cases
- Link criteria to user story goals

### Epic Story Splitting
- Split epic stories into smaller, deliverable stories
- Maintain story coherence and value
- Create story hierarchies (Epic > Feature > Story)
- Preserve acceptance criteria through splits

### Story Point Estimation
- Estimate story points using historical data patterns
- Apply relative sizing techniques
- Factor in complexity, uncertainty, and effort
- Generate estimation confidence levels

### Story Mapping
- Create user story maps for release planning
- Organize by user activities and tasks
- Define release slices (MVP, v1, v2)
- Visualize story dependencies

### Job Story Conversion
- Convert between user stories and job stories
- Apply Jobs-to-be-Done framework
- Focus on situation, motivation, and outcome
- Support both formats interchangeably

## Usage

### Convert Requirements to User Stories
```
Convert these requirements to user stories:
[BRD requirements list]

Include persona identification and acceptance criteria for each story.
```

### Validate User Stories
```
Validate these user stories against INVEST criteria:
[User story list]

Provide scores and improvement recommendations.
```

### Split Epic Story
```
Split this epic into smaller user stories:
[Epic description]

Maintain value delivery and generate acceptance criteria for each.
```

### Create Story Map
```
Create a story map for this product:
[Product description and user activities]

Organize by user journey and define release slices.
```

## Process Integration

This skill integrates with the following business analysis processes:
- user-story-development.js - Core user story creation
- requirements-elicitation-workshop.js - Story identification during elicitation
- brd-creation.js - Requirements to stories conversion

## Dependencies

- Story templates and formats
- INVEST scoring algorithms
- Estimation models and historical data
- Story mapping visualization

## User Story Frameworks Reference

### Standard User Story Format
```
As a [type of user],
I want [some goal],
So that [some reason/benefit].
```

### Job Story Format
```
When [situation],
I want to [motivation],
So I can [expected outcome].
```

### INVEST Criteria
| Criterion | Description | Validation Question |
|-----------|-------------|---------------------|
| Independent | Can be developed in any order | Does this story depend on other stories? |
| Negotiable | Details can be refined | Is there room for discussion? |
| Valuable | Delivers user/business value | What value does this provide? |
| Estimable | Can be sized | Can we estimate the effort? |
| Small | Fits in a sprint | Can it be completed in one sprint? |
| Testable | Has clear acceptance criteria | How will we know it's done? |

### Given-When-Then Format
```
Given [precondition/context]
When [action/trigger]
Then [expected outcome]
And [additional outcome]
```

### Story Splitting Patterns
1. **Workflow steps**: Split by process steps
2. **Business rules**: One rule per story
3. **Happy/Unhappy paths**: Separate error handling
4. **Input options**: Different input methods
5. **Data variations**: Different data types
6. **Interfaces**: Different UI implementations
7. **Operations**: CRUD operations separately
8. **Performance**: Separate performance optimization

### Story Point Scale (Fibonacci)
| Points | Description |
|--------|-------------|
| 1 | Trivial, well-understood |
| 2 | Small, minor complexity |
| 3 | Medium, some unknowns |
| 5 | Medium-large, notable complexity |
| 8 | Large, significant unknowns |
| 13 | Very large, should consider splitting |
| 21+ | Epic, must be split |
