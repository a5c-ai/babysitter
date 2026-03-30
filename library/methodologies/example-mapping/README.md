# Example Mapping Methodology

**Creator**: Matt Wynne (Cucumber Ltd)
**Year**: Modern BDD practice (2015)
**Category**: Requirements / BDD / Testing
**Process ID**: `methodologies/example-mapping`

## Overview

Example Mapping is a simple, collaborative workshop technique for exploring and understanding requirements before development. It uses a structured approach with colored cards to break down user stories into testable examples.

This methodology bridges the gap between high-level user stories and detailed acceptance criteria, making stories ready for test-driven development and BDD practices.

## The Four Colors

Example Mapping uses four colored cards to organize information:

- **🔵 Blue Card** - **User Story** (one per session)
  - The feature or requirement being mapped
  - Typically in "As a [role], I want [feature], so that [benefit]" format

- **🟡 Yellow Cards** - **Rules/Acceptance Criteria**
  - Business rules that apply to the story
  - Constraints and validation logic
  - What makes the story "done"

- **🟢 Green Cards** - **Examples**
  - Concrete scenarios illustrating each rule
  - Given-When-Then format
  - Happy paths, edge cases, and error cases

- **🔴 Red Cards** - **Questions**
  - Unknowns that need clarification
  - Assumptions to validate
  - Risks and dependencies

## Key Principles

1. **25-Minute Timebox**: If mapping takes longer, the story is probably too big
2. **Conversation Over Documentation**: Collaborative exploration is key
3. **Outside-In**: Start with story → identify rules → illustrate with examples
4. **Ready Indicator**: Story is ready when questions are resolved and examples cover all rules

## Process Flow

### 1. Story Analysis (Blue Card)
- Parse and understand the user story
- Identify persona, feature, and benefit
- Assess complexity and scope
- Determine if splitting is needed

### 2. Rule Extraction (Yellow Cards)
- Identify business rules and acceptance criteria
- Categorize rules (validation, business logic, constraints, etc.)
- Prioritize must-have vs. nice-to-have rules
- Consider edge cases and error handling

### 3. Example Generation (Green Cards)
- Create concrete examples for each rule
- Cover happy paths, edge cases, and error scenarios
- Use specific, realistic data
- Ensure all rules have example coverage

### 4. Question Identification (Red Cards)
- Capture unknowns and assumptions
- Identify technical and business questions
- Note dependencies and risks
- Prioritize blocking questions

### 5. Gherkin Generation
- Convert examples to Given-When-Then scenarios
- Create scenario outlines for data-driven tests
- Generate complete .feature files
- Add appropriate tags (@smoke, @regression, etc.)

### 6. Readiness Assessment
- Verify all questions are resolved
- Confirm complete rule coverage
- Check if within timebox
- Determine if story needs splitting
- Issue final ready/not-ready decision

## Usage

### Basic Example

```javascript
import { process } from './example-mapping.js';

const result = await process({
  userStory: `As a customer, I want to search for products by name,
              so that I can quickly find what I'm looking for`,
  timeboxMinutes: 25,
  sessionMode: 'collaborative'
}, ctx);

console.log(`Story Ready: ${result.isReady}`);
console.log(`Rules: ${result.ruleCount}`);
console.log(`Examples: ${result.exampleCount}`);
console.log(`Questions: ${result.unresolvedQuestions} unresolved`);
console.log(`Gherkin Scenarios: ${result.scenarioCount}`);
```

### With Existing Context

```javascript
const result = await process({
  userStory: `As a user, I want to reset my password via email,
              so that I can regain access to my account`,
  timeboxMinutes: 25,
  sessionMode: 'collaborative',
  existingContext: {
    existingFeatures: ['email service', 'user authentication'],
    securityPolicies: ['password complexity rules', 'rate limiting'],
    relatedStories: ['user registration', 'email verification']
  },
  stakeholders: [
    { role: 'product-owner', name: 'Alice' },
    { role: 'security-lead', name: 'Bob' },
    { role: 'developer', name: 'Charlie' }
  ]
}, ctx);
```

### Inputs

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `userStory` | string | ✅ Yes | - | The user story to map |
| `timeboxMinutes` | number | No | 25 | Session time limit |
| `sessionMode` | string | No | 'collaborative' | 'collaborative', 'solo', or 'async' |
| `existingContext` | object | No | null | Domain knowledge, related stories |
| `stakeholders` | array | No | [] | Stakeholder information for questions |

### Outputs

```javascript
{
  success: true,
  sessionDurationMinutes: 22,
  withinTimebox: true,
  story: {
    original: "As a...",
    analysis: { complexityScore: 5, scope: {...}, ... }
  },
  rules: [
    { id: 'rule-1', description: '...', category: 'validation', ... }
  ],
  ruleCount: 4,
  examples: [
    { id: 'ex-1', title: '...', type: 'happy-path', given: [...], when: '...', then: [...] }
  ],
  exampleCount: 12,
  questions: [
    { id: 'q-1', question: '...', type: 'business', priority: 'high', blocking: true }
  ],
  questionCount: 3,
  unresolvedQuestions: 1,
  gherkinScenarios: [
    { id: 'sc-1', name: '...', type: 'scenario', steps: [...], tags: ['@smoke'] }
  ],
  scenarioCount: 8,
  coverageCheck: [...],
  readiness: {
    isReady: true,
    readinessScore: 92,
    criteria: { questionsResolved: true, completeCoverage: true, ... },
    recommendations: [...]
  },
  isReady: true,
  artifacts: {
    storyAnalysis: 'artifacts/example-mapping/story-analysis.json',
    rules: 'artifacts/example-mapping/rules.md',
    examples: 'artifacts/example-mapping/examples.json',
    questions: 'artifacts/example-mapping/questions.md',
    gherkin: 'artifacts/example-mapping/scenarios.feature',
    readinessReport: 'artifacts/example-mapping/readiness-report.md',
    summary: 'artifacts/example-mapping/summary.json'
  }
}
```

## Integration Points

### Perfect Precursor to Other Methodologies

1. **Spec-Driven Development**
   - Example Mapping outputs feed directly into specification creation
   - Gherkin scenarios become executable specifications
   - Rules become acceptance criteria in SPECIFICATION.md

2. **TDD/ATDD**
   - Examples drive test creation
   - Gherkin scenarios become acceptance tests
   - Red-Green-Refactor cycle uses examples as test cases

3. **BDD/Specification by Example**
   - Example Mapping is the workshop phase
   - Outputs are ready for Cucumber/SpecFlow/Behave
   - Scenarios are executable documentation

4. **Agile/Scrum**
   - Use in Sprint Planning or backlog refinement
   - Helps with story estimation
   - Identifies stories that need splitting

5. **GSD Execution**
   - Map examples before implementation planning
   - Use readiness assessment to gate development
   - Integrate with phase discussions

## Success Criteria

A successful Example Mapping session produces:

- ✅ Clear understanding of the story scope
- ✅ 3-8 business rules identified
- ✅ Multiple examples per rule (happy path + edge cases)
- ✅ All critical questions answered or documented
- ✅ Complete Gherkin scenarios ready for automation
- ✅ Session completed within timebox (usually 25 minutes)
- ✅ Team consensus on story readiness

## Signs a Story Needs Splitting

If Example Mapping reveals:

- ❌ More than 8 rules
- ❌ Session exceeds timebox significantly
- ❌ Too many unknowns and red cards
- ❌ Multiple distinct features in one story
- ❌ Complexity score above 8/10
- ❌ Unable to reach consensus

→ **Split the story** and map each piece separately

## Best Practices

### Do's
- ✅ Keep sessions timeboxed (25 minutes)
- ✅ Use concrete, specific examples (not abstract)
- ✅ Include multiple perspectives (product, dev, test)
- ✅ Capture questions immediately (don't debate endlessly)
- ✅ Focus on understanding, not perfect documentation
- ✅ Split stories that exceed timebox

### Don'ts
- ❌ Don't skip the workshop and do it alone
- ❌ Don't try to answer all questions in session
- ❌ Don't write full Gherkin during the workshop
- ❌ Don't map multiple stories in one session
- ❌ Don't force stories that don't fit

## Example Session Output

### User Story
> As a customer, I want to apply discount codes at checkout, so that I can save money on my purchase

### Rules (Yellow Cards)
1. ✅ Valid codes reduce order total by code percentage
2. ✅ Expired codes are rejected with error message
3. ✅ One code per order (no stacking)
4. ✅ Minimum order value may apply
5. ✅ Code is case-insensitive

### Examples (Green Cards)

**Rule 1: Valid code reduces total**
- Given: Cart total is $100, code "SAVE20" gives 20% off
- When: Customer applies "SAVE20"
- Then: New total is $80, discount shows $20 off

**Rule 2: Expired code rejected**
- Given: Code "OLD10" expired yesterday
- When: Customer applies "OLD10"
- Then: Error shown "Code expired", total unchanged

**Rule 3: No stacking codes**
- Given: Code "FIRST15" already applied
- When: Customer tries to apply "SECOND10"
- Then: Error shown "Only one code allowed", original code remains

### Questions (Red Cards)
1. ❓ What happens if code brings total below $0? (blocking)
2. ❓ Do codes apply to shipping costs? (high priority)
3. ❓ Can codes be used with sale items? (medium priority)

### Gherkin Output

```gherkin
Feature: Discount Code Application
  As a customer
  I want to apply discount codes at checkout
  So that I can save money on my purchase

Background:
  Given I am on the checkout page
  And my cart contains items

Scenario: Apply valid discount code
  Given my cart total is $100.00
  When I enter discount code "SAVE20"
  And I click "Apply"
  Then my new total should be $80.00
  And I should see "Discount: -$20.00"

Scenario: Reject expired discount code
  Given discount code "OLD10" expired on "2025-01-01"
  When I enter discount code "OLD10"
  And I click "Apply"
  Then I should see error "This discount code has expired"
  And my cart total should remain unchanged

Scenario: Prevent stacking multiple codes
  Given I have applied discount code "FIRST15"
  When I enter discount code "SECOND10"
  And I click "Apply"
  Then I should see error "Only one discount code allowed per order"
  And discount code "FIRST15" should remain applied
```

## References

### Original Sources
- [Cucumber Blog: Example Mapping Introduction](https://cucumber.io/blog/bdd/example-mapping-introduction/)
- [Matt Wynne's Example Mapping Video](https://www.youtube.com/watch?v=VwvrGfWmG_U)
- [Example Mapping Webinar](https://cucumber.io/blog/bdd/example-mapping-webinar/)

### Related Reading
- [BDD and Example Mapping](https://cucumber.io/blog/bdd/)
- [Specification by Example (book) - Gojko Adzic](https://gojko.net/books/specification-by-example/)
- [The BDD Books - Discovery, Formulation, Automation](https://bddbooks.com/)

### Community Resources
- [Example Mapping Template](https://cucumber.io/blog/example-mapping/)
- [Example Mapping Facilitation Guide](https://johnfergusonsmart.com/example-mapping-bdd/)

## License

This methodology implementation is part of the Babysitter SDK orchestration framework.

Creator credit: Matt Wynne and Cucumber Ltd for the Example Mapping technique.
