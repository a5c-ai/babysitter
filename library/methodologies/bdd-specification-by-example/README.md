# BDD/Specification by Example

## Overview

Behavior-Driven Development (BDD), also known as Specification by Example, is a collaborative approach that captures requirements as concrete examples illustrating how the system should behave in specific scenarios. These examples become executable specifications that serve as both documentation and automated tests.

**Creators**: Dan North (BDD, 2006), Gojko Adzic (Specification by Example)

### Key Principles

- **Shared Understanding**: Business and development teams use the same words
- **Outside-In Development**: Start with what users see and experience
- **Living Documentation**: Requirements stay current because they're also tests
- **Three-Step Process**: Discovery → Formulation → Automation
- **Concrete Examples**: Abstract requirements illustrated with specific scenarios
- **Executable Specifications**: Tests that verify behavior

## Methodology

### Three-Step Iterative Process

#### 1. Discovery
Collaborative exploration using Example Mapping to:
- Identify business rules
- Generate concrete examples
- Capture questions and edge cases
- Validate scope
- Build shared understanding

#### 2. Formulation
Convert examples to structured Gherkin scenarios:
- Given-When-Then format
- Declarative language
- Scenario outlines for data-driven tests
- Reusable steps
- Clear tags and organization

#### 3. Automation
Implement executable specifications:
- Step definitions
- Test automation
- Page object patterns
- Test data management
- Continuous execution

## Process Workflow

```
Discovery Workshop
    ↓
[Review Examples & Rules]
    ↓
Gherkin Formulation
    ↓
[Review Scenarios]
    ↓
Step Definition Generation
    ↓
[Review Steps]
    ↓
Test Automation
    ↓
Living Documentation
    ↓
[Final Review]
```

## Usage

### Basic Usage

```javascript
import { runProcess } from '@a5c-ai/babysitter-sdk';

const result = await runProcess('methodologies/bdd-specification-by-example', {
  projectName: 'E-commerce Platform',
  feature: 'Shopping cart checkout process',
  stakeholders: ['Product Owner', 'Developer', 'QA', 'UX Designer'],
  testFramework: 'cucumber',
  generateTests: true,
  createDocumentation: true
});
```

### Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `projectName` | string | Yes | - | Project name |
| `feature` | string | Yes | - | Feature to analyze |
| `stakeholders` | array | No | `['Product Owner', 'Developer', 'QA']` | Stakeholder roles |
| `testFramework` | string | No | `'cucumber'` | cucumber, specflow, behave, cypress |
| `developmentPhase` | string | No | `'greenfield'` | greenfield or brownfield |
| `generateTests` | boolean | No | `true` | Auto-generate test automation |
| `createDocumentation` | boolean | No | `true` | Generate living documentation |
| `existingFeatures` | array | No | `[]` | Existing feature context |
| `existingScenarios` | array | No | `[]` | Existing scenarios to consider |
| `existingSteps` | array | No | `[]` | Existing step definitions library |

### Output Structure

```javascript
{
  success: boolean,
  projectName: string,
  feature: string,
  discovery: {
    story: { title, description, businessValue, acceptanceCriteria },
    rules: [{ id, description, rationale }],
    examples: [{ id, ruleId, title, context, action, outcome, type }],
    questions: [{ id, question, answer, priority }],
    scope: { inScope, outOfScope }
  },
  gherkin: {
    featureFile: string,
    scenarios: [{ id, title, type, tags, given, when, then, examples }],
    totalSteps: number,
    uniqueSteps: [{ text, type, usageCount }]
  },
  scenarioAnalysis: {
    qualityScore: number,
    issues: [],
    recommendations: [],
    coverage: { examplesCovered, examplesTotal, coveragePercentage }
  },
  stepDefinitions: {
    stepDefinitionsCode: string,
    steps: [{ id, text, type, regex, functionName, parameters, complexity }],
    newSteps: number,
    reusedSteps: number
  },
  automation: {
    stepImplementations: [],
    testData: { testData, fixtures, factories },
    execution: { total, passed, failed, pending, results }
  },
  documentation: {
    featureDocumentation: string,
    coverageReport: {},
    behaviorCatalog: [],
    traceability: {}
  },
  artifacts: {
    discovery: 'artifacts/bdd/discovery/',
    features: 'artifacts/bdd/features/',
    stepDefinitions: 'artifacts/bdd/step-definitions/',
    automation: 'artifacts/bdd/automation/',
    documentation: 'artifacts/bdd/docs/'
  }
}
```

## Examples

### Example 1: E-commerce Checkout

```javascript
const result = await runProcess('methodologies/bdd-specification-by-example', {
  projectName: 'ShopNow',
  feature: 'Guest checkout with multiple payment methods',
  stakeholders: ['Product Manager', 'Developer', 'QA', 'Payment Team'],
  testFramework: 'cucumber',
  developmentPhase: 'brownfield',
  existingFeatures: ['user-authentication', 'shopping-cart']
});
```

**Discovery Output**:
- 8 business rules identified
- 15 concrete examples (happy path, edge cases, errors)
- 3 questions clarified
- Clear scope boundaries

**Gherkin Output**:
- 15 scenarios (12 scenarios + 3 scenario outlines)
- 45 total steps, 22 unique steps
- Quality score: 92/100
- Tags: @checkout, @payment, @guest, @smoke, @regression

**Automation Output**:
- 22 step definitions (15 new, 7 reused)
- 3 page objects created
- Test execution: 15/15 passing
- Living documentation generated

### Example 2: User Registration

```javascript
const result = await runProcess('methodologies/bdd-specification-by-example', {
  projectName: 'SocialApp',
  feature: 'User registration with email verification',
  testFramework: 'cypress',
  generateTests: true,
  createDocumentation: true
});
```

**Discovery Output**:
- 5 business rules
- 12 examples covering various scenarios
- Email validation rules
- Password strength requirements
- Rate limiting behavior

**Gherkin Output**:
```gherkin
Feature: User Registration
  As a new user
  I want to create an account
  So that I can access the platform

  Background:
    Given the registration page is displayed
    And no user is currently logged in

  Scenario: Successful registration with valid details
    Given I am on the registration page
    When I enter valid email "user@example.com"
    And I enter strong password "SecurePass123!"
    And I confirm the password
    And I accept terms and conditions
    And I click register button
    Then I should see "Verification email sent"
    And I should receive a verification email
    And my account should be created in pending state

  Scenario Outline: Registration fails with invalid email
    Given I am on the registration page
    When I enter email "<email>"
    And I enter valid password details
    And I click register button
    Then I should see error "<error>"
    And my account should not be created

    Examples:
      | email              | error                    |
      | invalid.email      | Invalid email format     |
      | user@              | Invalid email format     |
      | @example.com       | Invalid email format     |
      | existing@email.com | Email already registered |
```

### Example 3: API Feature

```javascript
const result = await runProcess('methodologies/bdd-specification-by-example', {
  projectName: 'Payment API',
  feature: 'Process refund with validation',
  testFramework: 'cucumber',
  stakeholders: ['API Developer', 'QA', 'Business Analyst'],
  generateTests: true
});
```

**Discovery Output**:
- API contract rules
- Validation scenarios
- Error handling examples
- Idempotency requirements

## Tasks

### Discovery Workshop Task
**Purpose**: Collaborative exploration using Example Mapping
**Output**: Stories, rules, examples, questions, scope
**Approach**: Multi-stakeholder perspective, concrete examples

### Clarify Questions Task
**Purpose**: Address open questions from discovery
**Output**: Answers, additional examples, assumptions
**Approach**: Domain expertise, consistency checking

### Gherkin Formulation Task
**Purpose**: Convert examples to Given-When-Then scenarios
**Output**: Feature files, scenarios, step inventory
**Approach**: Declarative language, reusable steps, best practices

### Analyze Scenario Quality Task
**Purpose**: Assess scenario quality and coverage
**Output**: Quality score, issues, recommendations
**Approach**: Best practices validation, coverage analysis

### Step Definition Task
**Purpose**: Generate step definition stubs
**Output**: Step definitions code, regex patterns
**Approach**: Framework-specific conventions, reusability

### Analyze Step Reuse Task
**Purpose**: Identify reusable steps and duplicates
**Output**: Reuse metrics, recommendations
**Approach**: Pattern matching, consolidation opportunities

### Implement Step Task
**Purpose**: Implement step with working code
**Output**: Implementation code, page objects, helpers
**Approach**: Testing patterns, error handling, idempotency

### Generate Test Data Task
**Purpose**: Create test data and fixtures
**Output**: Test data sets, fixtures, factories
**Approach**: Realistic data, boundary values, privacy

### Execute Tests Task
**Purpose**: Run automated tests
**Output**: Execution results, pass/fail metrics
**Approach**: Framework execution, result analysis

### Generate Living Documentation Task
**Purpose**: Create feature documentation from scenarios
**Output**: Feature docs, coverage report, behavior catalog
**Approach**: Stakeholder-readable, test-linked, visual

### Generate Traceability Task
**Purpose**: Link requirements to scenarios to tests
**Output**: Traceability matrix, coverage gaps
**Approach**: Bidirectional mapping, gap analysis

## Integration Points

### With Spec-Driven Development
BDD provides detailed acceptance criteria that complement spec-driven development:
```javascript
// First: Create specification
const spec = await runProcess('methodologies/spec-driven-development', { ... });

// Then: Add BDD scenarios for each user story
for (const story of spec.specification.userStories) {
  const bdd = await runProcess('methodologies/bdd-specification-by-example', {
    feature: story.title,
    stakeholders: ['Product Owner', 'Developer', 'QA']
  });
}
```

### With Example Mapping
Use Example Mapping methodology for discovery phase:
```javascript
// Example Mapping workshop
const mapping = await runProcess('methodologies/example-mapping', { ... });

// Convert to BDD scenarios
const bdd = await runProcess('methodologies/bdd-specification-by-example', {
  feature: mapping.story,
  existingExamples: mapping.examples
});
```

### With ATDD/TDD
BDD scenarios drive test-driven development:
```javascript
const bdd = await runProcess('methodologies/bdd-specification-by-example', {
  generateTests: true
});

// Use scenarios for ATDD
const atdd = await runProcess('methodologies/atdd', {
  acceptanceCriteria: bdd.gherkin.scenarios
});
```

## Best Practices

### Discovery Workshop
1. Include diverse stakeholders (business, dev, QA, UX)
2. Use Example Mapping format (story, rules, examples, questions)
3. Focus on concrete examples, not abstract requirements
4. Identify edge cases and error scenarios
5. Time-box discussions (15-25 minutes per story)
6. Capture questions immediately

### Gherkin Writing
1. Use declarative language (what, not how)
2. Write scenarios from user perspective
3. Keep scenarios independent and isolated
4. One scenario = one behavior
5. Use scenario outlines for data-driven tests
6. Tag appropriately (@smoke, @regression, @slow)
7. Make scenarios readable by non-technical stakeholders

### Step Definitions
1. Create reusable, focused steps
2. Use regex for parameter capture
3. Follow Page Object Model pattern
4. Keep step implementations simple
5. Extract complex logic to helper functions
6. Make steps idempotent
7. Add meaningful assertion messages

### Test Automation
1. Run tests frequently (CI/CD)
2. Keep tests fast and reliable
3. Isolate test data
4. Clean up after tests
5. Handle async operations properly
6. Make tests deterministic
7. Monitor for flaky tests

### Living Documentation
1. Keep documentation in sync with tests
2. Make it accessible to all stakeholders
3. Include visual diagrams
4. Link to test results
5. Highlight test status
6. Update automatically
7. Version with code

## Test Frameworks

### Cucumber (JavaScript/TypeScript)
```javascript
const result = await runProcess('methodologies/bdd-specification-by-example', {
  testFramework: 'cucumber',
  // Generates .feature files and .js step definitions
});
```

### SpecFlow (.NET/C#)
```javascript
const result = await runProcess('methodologies/bdd-specification-by-example', {
  testFramework: 'specflow',
  // Generates .feature files and .cs step definitions
});
```

### Behave (Python)
```javascript
const result = await runProcess('methodologies/bdd-specification-by-example', {
  testFramework: 'behave',
  // Generates .feature files and .py step definitions
});
```

### Cypress (JavaScript)
```javascript
const result = await runProcess('methodologies/bdd-specification-by-example', {
  testFramework: 'cypress',
  // Generates .feature files and cypress test specs
});
```

## Common Patterns

### Outside-In Development
Start with acceptance tests (outside) and work inward:
1. Write feature/scenario (acceptance test)
2. Run test (red)
3. Write unit tests for components (TDD)
4. Implement components
5. Integration
6. Acceptance test passes (green)

### Example Mapping Workshop
Visual collaborative technique:
- Story (yellow card)
- Rules (blue cards)
- Examples (green cards)
- Questions (red cards)

### Scenario Structure
```gherkin
Scenario: <Clear, concise title from user perspective>
  Given <Context/Preconditions>
  And <More context>
  When <Action/Event>
  And <More actions>
  Then <Expected outcome>
  And <More expectations>
```

### Scenario Outline Pattern
```gherkin
Scenario Outline: <Title with parameters>
  Given <context with <parameter>>
  When <action with <parameter>>
  Then <outcome with <parameter>>

  Examples:
    | parameter | expected |
    | value1    | result1  |
    | value2    | result2  |
```

## Quality Metrics

The process tracks quality metrics:

- **Scenario Quality Score**: 0-100 based on best practices
- **Example Coverage**: % of discovery examples covered by scenarios
- **Step Reusability**: % of steps reused vs. total steps
- **Test Success Rate**: % of passing scenarios
- **Traceability Completeness**: % of rules linked to tested scenarios
- **Documentation Freshness**: Last update vs. code changes

## Artifacts Generated

### Discovery Phase
- `artifacts/bdd/discovery/example-map.md` - Visual example map
- `artifacts/bdd/discovery/rules.json` - Business rules
- `artifacts/bdd/discovery/questions.json` - Questions and answers

### Formulation Phase
- `artifacts/bdd/features/feature.feature` - Gherkin feature file
- `artifacts/bdd/analysis/scenario-quality.md` - Quality analysis

### Automation Phase
- `artifacts/bdd/step-definitions/steps.*` - Step definitions
- `artifacts/bdd/automation/page-objects/` - Page object models
- `artifacts/bdd/automation/test-data/` - Test data and fixtures
- `artifacts/bdd/automation/test-report.html` - Test execution report

### Documentation Phase
- `artifacts/bdd/docs/feature-documentation.md` - Living documentation
- `artifacts/bdd/docs/traceability-matrix.md` - Requirements traceability
- `artifacts/bdd/docs/coverage-report.md` - Test coverage analysis

## References

### Official Resources
- [Cucumber BDD Guide](https://cucumber.io/docs/bdd/)
- [Cucumber Documentation](https://cucumber.io/docs/cucumber/)
- [SpecFlow Documentation](https://specflow.org/documentation/)
- [Behave Documentation](https://behave.readthedocs.io/)

### Books
- **"Specification by Example"** by Gojko Adzic
- **"The Cucumber Book"** by Matt Wynne & Aslak Hellesoy
- **"BDD in Action"** by John Ferguson Smart
- **"Discovery: Explore behaviour using examples"** by Gáspár Nagy & Seb Rose

### Articles & Guides
- [BDD on Wikipedia](https://en.wikipedia.org/wiki/Behavior-driven_development)
- [Monday.com BDD Guide 2026](https://monday.com/blog/rnd/behavior-driven-development/)
- [BrainHub BDD 2025](https://brainhub.eu/library/behavior-driven-development)
- [Dan North's Blog - Introducing BDD](https://dannorth.net/introducing-bdd/)
- [Gojko Adzic - Specification by Example](https://gojko.net/books/specification-by-example/)

### Tools
- [Cucumber](https://cucumber.io/) - BDD framework for multiple languages
- [SpecFlow](https://specflow.org/) - BDD for .NET
- [Behave](https://behave.readthedocs.io/) - BDD for Python
- [Cypress Cucumber Preprocessor](https://github.com/badeball/cypress-cucumber-preprocessor) - Gherkin for Cypress
- [Example Mapping](https://cucumber.io/blog/bdd/example-mapping-introduction/) - Discovery workshop technique

## Troubleshooting

### Low Quality Score
- Review scenario independence
- Check for imperative language
- Ensure proper Given-When-Then structure
- Verify stakeholder readability

### Poor Step Reusability
- Make steps more generic
- Extract common patterns
- Use proper parameterization
- Review step naming conventions

### Failing Tests
- Check test data validity
- Verify environment setup
- Review async handling
- Check for test dependencies

### Documentation Out of Sync
- Run documentation generation after changes
- Set up automated regeneration
- Review CI/CD integration
- Check artifact paths

## License

Part of the Babysitter SDK orchestration framework.
