# ATDD/TDD Methodology

**Test-Driven Development with Acceptance Test-Driven Development**

A combined approach that uses acceptance tests (ATDD) at the feature level to drive unit-level test-driven development (TDD), ensuring both external quality (building the right thing) and internal quality (building it right).

## Overview

This methodology implements a dual-layer testing approach:

### ATDD (Acceptance Test-Driven Development)
- **Outside-in**: Start with customer/stakeholder perspective
- **Acceptance criteria**: Define what "done" means
- **Executable specifications**: Tests become living documentation
- **Business validation**: Ensures we're building the right thing

### TDD (Test-Driven Development)
- **Red-Green-Refactor**: Classic TDD cycle
- **Unit-level**: Focus on implementation details
- **Design emergence**: Tests drive better code design
- **Continuous feedback**: Ensures we're building it right

## Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ATDD LAYER (Outside-in)                   │
├─────────────────────────────────────────────────────────────┤
│ 1. Define Acceptance Criteria                               │
│    └─ Collaborate with stakeholders                         │
│    └─ Define "done" criteria (Given-When-Then)              │
│                                                              │
│ 2. Create Acceptance Tests                                  │
│    └─ Write executable acceptance tests                     │
│    └─ Tests should FAIL initially (feature not built yet)   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    TDD LAYER (Inside-out)                    │
├─────────────────────────────────────────────────────────────┤
│ Repeat until acceptance tests pass:                         │
│                                                              │
│   3. RED: Write Unit Test                                   │
│      └─ Minimal test for next piece of functionality        │
│      └─ Test should FAIL                                    │
│                                                              │
│   4. GREEN: Implement Code                                  │
│      └─ Write simplest code to make test pass              │
│      └─ All tests should PASS                               │
│                                                              │
│   5. REFACTOR: Improve Design                               │
│      └─ Clean up code (remove duplication, improve clarity) │
│      └─ All tests should still PASS                         │
│                                                              │
│   6. Check Acceptance Tests                                 │
│      └─ Do acceptance tests pass yet?                       │
│      └─ If not, repeat TDD cycle                            │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ 7. Verify Acceptance (Final)                                │
│    └─ All acceptance criteria met                           │
│    └─ Feature complete                                      │
└─────────────────────────────────────────────────────────────┘
```

## Key Principles

### ATDD Principles
1. **Customer collaboration**: Acceptance criteria defined with stakeholders
2. **Executable specifications**: Tests are specifications
3. **Black-box testing**: Test from user perspective
4. **Clear definition of done**: Acceptance criteria define completion

### TDD Principles
1. **Test first**: Always write test before code
2. **Small steps**: Minimal tests, minimal code
3. **Red-Green-Refactor**: Strict cycle discipline
4. **Design emerges**: Let tests guide design
5. **No premature optimization**: Simplest code that works
6. **YAGNI**: You Aren't Gonna Need It

## When to Use

### Ideal For
- **New features**: Well-defined requirements that need thorough testing
- **API development**: Clear contracts that can be tested
- **Business logic**: Complex rules that need validation
- **Quality-critical code**: Systems where correctness is paramount
- **Legacy refactoring**: Adding tests before modifying code

### Works Well With
- **BDD/Specification by Example**: ATDD scenarios come from BDD specifications
- **Spec-Driven Development**: Acceptance criteria from specifications
- **Continuous Integration**: Automated test execution
- **Pair Programming**: Collaborative test writing and implementation

### Less Suitable For
- **Exploratory development**: Requirements unclear or rapidly changing
- **Prototyping**: Quick experiments without long-term quality needs
- **UI-heavy work**: Visual design exploration
- **Performance optimization**: Focus on metrics rather than behavior

## Usage

### Basic Example

```javascript
import { runProcess } from '@a5c-ai/babysitter-sdk';

const result = await runProcess('methodologies/atdd-tdd', {
  feature: 'User authentication with JWT tokens',
  acceptanceCriteria: [
    'Users can register with email and password',
    'Users can login and receive a JWT token',
    'Invalid credentials are rejected',
    'JWT tokens expire after 1 hour'
  ],
  testFramework: 'jest',
  iterationCount: 15
});
```

### Advanced Example with Integration Tests

```javascript
const result = await runProcess('methodologies/atdd-tdd', {
  feature: 'Shopping cart checkout process',
  acceptanceCriteria: [
    'Given a cart with items, when user checks out, then order is created',
    'Given payment fails, when user checks out, then error is shown and cart preserved',
    'Given inventory insufficient, when user checks out, then items are marked unavailable'
  ],
  testFramework: 'jest',
  iterationCount: 20,
  includeIntegrationTests: true,
  existingCode: {
    cartService: './src/services/cart.js',
    paymentGateway: './src/gateways/payment.js',
    inventoryService: './src/services/inventory.js'
  }
});

console.log(`Feature: ${result.feature}`);
console.log(`Success: ${result.success}`);
console.log(`TDD Cycles: ${result.tddCycles.totalCycles}`);
console.log(`Unit Tests: ${result.unitTests.totalTests}`);
console.log(`Coverage: ${result.coverage.coverage}%`);
```

## Inputs

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `feature` | string | Yes | - | Feature or user story to implement |
| `acceptanceCriteria` | array | No | `[]` | Pre-defined acceptance criteria (Given-When-Then format) |
| `testFramework` | string | No | `'jest'` | Test framework to use (jest, mocha, vitest, etc.) |
| `iterationCount` | number | No | `10` | Maximum TDD iterations before stopping |
| `includeIntegrationTests` | boolean | No | `true` | Create integration tests after unit tests pass |
| `existingCode` | object | No | `null` | Existing codebase context for integration |

## Outputs

The process returns a comprehensive result object:

```javascript
{
  success: boolean,                    // All acceptance tests passing
  feature: string,                     // Feature name
  testFramework: string,               // Test framework used

  acceptanceCriteria: {
    criteria: [],                      // Acceptance criteria definitions
    scenarios: [],                     // Test scenarios
    priorities: {}                     // Must-have, should-have, nice-to-have
  },

  acceptanceTests: {
    tests: [],                         // Acceptance test cases
    initialRun: {},                    // Initial test run (should fail)
    finalRun: {},                      // Final test run (should pass)
    allPassed: boolean                 // All acceptance tests passed
  },

  tddCycles: {
    totalCycles: number,               // Number of Red-Green-Refactor cycles
    cycles: [],                        // Detailed cycle information
    completedSuccessfully: boolean     // Reached acceptance test success
  },

  unitTests: {
    tests: [],                         // All unit tests created
    totalTests: number                 // Count of unit tests
  },

  integrationTests: {                  // Optional
    tests: [],                         // Integration test cases
    results: {}                        // Integration test results
  },

  implementation: {
    files: [],                         // Implementation files
    totalFiles: number                 // Count of implementation files
  },

  coverage: {
    coverage: number,                  // Overall coverage percentage
    lineCoverage: number,              // Line coverage
    branchCoverage: number,            // Branch coverage
    filesCoverage: [],                 // Per-file coverage
    gaps: [],                          // Coverage gaps
    recommendations: []                // Coverage improvement recommendations
  },

  artifacts: {
    acceptanceCriteria: string,        // Path to criteria document
    acceptanceTests: string,           // Path to acceptance tests
    unitTests: string,                 // Path to unit tests
    integrationTests: string,          // Path to integration tests
    implementation: string,            // Path to implementation
    summary: string,                   // Path to summary
    coverage: string                   // Path to coverage report
  }
}
```

## Tasks

The methodology uses these agent tasks:

1. **defineAcceptanceCriteriaTask** - Define customer-facing acceptance criteria
2. **createAcceptanceTestsTask** - Convert criteria to executable tests
3. **runAcceptanceTestsTask** - Execute acceptance test suite
4. **createUnitTestTask** - Write minimal failing unit test (Red)
5. **implementCodeTask** - Write simplest code to pass test (Green)
6. **refactorCodeTask** - Improve design while maintaining tests (Refactor)
7. **runUnitTestsTask** - Execute unit test suite
8. **createIntegrationTestsTask** - Create integration tests
9. **runIntegrationTestsTask** - Execute integration tests
10. **calculateCoverageTask** - Analyze test coverage metrics

## Examples

See the `examples/` directory for sample inputs:

- **examples/user-authentication.json** - JWT authentication feature
- **examples/shopping-cart.json** - E-commerce cart checkout
- **examples/file-upload.json** - File upload with validation
- **examples/api-endpoint.json** - RESTful API endpoint

## Test Frameworks Supported

- **Jest** - JavaScript testing framework (default)
- **Mocha** - Flexible JavaScript test framework
- **Vitest** - Vite-native testing framework
- **JUnit** - Java testing framework
- **pytest** - Python testing framework
- **RSpec** - Ruby testing framework

## Benefits

### ATDD Benefits
- ✅ **Shared understanding** - Stakeholders, developers, testers align on requirements
- ✅ **Living documentation** - Tests document expected behavior
- ✅ **Early defect detection** - Issues found before implementation
- ✅ **Customer confidence** - Tests validate from customer perspective

### TDD Benefits
- ✅ **Better design** - Tests drive modular, testable code
- ✅ **Comprehensive tests** - High code coverage naturally
- ✅ **Confidence to refactor** - Tests catch regressions
- ✅ **Faster debugging** - Failing tests pinpoint issues
- ✅ **Documentation** - Tests show how code should be used

### Combined Benefits
- ✅ **Two-layer quality** - External (right thing) + Internal (built right)
- ✅ **Continuous validation** - Feedback at every level
- ✅ **Traceability** - Unit tests trace to acceptance criteria
- ✅ **Regression safety** - Comprehensive test suite

## Best Practices

### ATDD Best Practices
1. **Collaborate early** - Involve stakeholders in criteria definition
2. **Use Given-When-Then** - Clear scenario structure
3. **Make criteria testable** - Specific, measurable outcomes
4. **One criterion per test** - Independent, focused tests
5. **Test from user perspective** - Black-box, behavior-focused

### TDD Best Practices
1. **Write minimal tests** - One assertion per test
2. **Simplest code first** - No premature optimization
3. **Refactor frequently** - Keep code clean continuously
4. **Fast test execution** - Tests should run quickly
5. **Independent tests** - No test interdependencies
6. **Descriptive names** - Clear test intent from name

### Red-Green-Refactor Discipline
1. **Red**: Write test that fails (and fails for the right reason)
2. **Green**: Make it pass with minimal code
3. **Refactor**: Clean up while tests remain green
4. **Never skip**: Follow cycle strictly

## Integration Points

- **BDD workflows** - Acceptance criteria from Gherkin scenarios
- **Spec-Kit** - Constitution principles guide test quality
- **CI/CD pipelines** - Automated test execution
- **Code review** - Tests reviewed alongside implementation
- **Documentation** - Tests serve as executable docs

## Troubleshooting

### Tests Pass Too Easily
- **Symptom**: Tests pass without implementation
- **Cause**: Tests not correctly written or feature already exists
- **Solution**: Review test assertions, ensure testing actual behavior

### Stuck in TDD Loop
- **Symptom**: Many iterations without acceptance tests passing
- **Cause**: Missing functionality or incorrect approach
- **Solution**: Review acceptance criteria, consider different implementation strategy

### Low Code Coverage
- **Symptom**: Coverage below expected threshold
- **Cause**: Edge cases not tested, error paths missed
- **Solution**: Add tests for uncovered branches, boundary conditions

### Refactoring Breaks Tests
- **Symptom**: Tests fail after refactoring
- **Cause**: Tests coupled to implementation details
- **Solution**: Test behavior, not implementation; make tests more resilient

## References

### TDD
- **Book**: "Test Driven Development: By Example" by Kent Beck
- **Article**: [Wikipedia - Test-Driven Development](https://en.wikipedia.org/wiki/Test-driven_development)
- **Resource**: [TDD Best Practices](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

### ATDD
- **Article**: [Wikipedia - Acceptance Test-Driven Development](https://en.wikipedia.org/wiki/Acceptance_test-driven_development)
- **Resource**: [Agile Alliance - ATDD](https://agilealliance.org/glossary/atdd/)
- **Article**: [TDD vs BDD vs ATDD](https://www.browserstack.com/guide/tdd-vs-bdd-vs-atdd)

### Combined Resources
- **Book**: "Growing Object-Oriented Software, Guided by Tests" by Steve Freeman & Nat Pryce
- **Book**: "ATDD by Example: A Practical Guide to Acceptance Test-Driven Development" by Markus Gärtner
- **Article**: [Outside-In TDD](https://www.thoughtworks.com/insights/blog/acceptance-test-driven-development-atdd-overview)

## License

Part of the Babysitter SDK Orchestration Framework.

---

**Created**: 2026-01-23
**Version**: 1.0.0
**Process ID**: `methodologies/atdd-tdd`
