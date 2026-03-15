---
name: uat-test-generator
description: Generate UAT test cases from requirements and acceptance criteria with traceability
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: business-analysis
  domain: business
  id: SK-012
  category: Testing
---

# UAT Test Case Generator

## Overview

The UAT Test Case Generator skill provides specialized capabilities for generating User Acceptance Testing test cases from requirements and acceptance criteria. This skill enables systematic test case development, test data specification, traceability maintenance, and export to test management tools.

## Capabilities

### Acceptance Criteria to Test Case Conversion
- Convert acceptance criteria to test cases
- Parse Given-When-Then format into test steps
- Handle complex acceptance criteria with multiple scenarios
- Generate positive and negative test cases

### Test Scenario Generation
- Generate test scenarios with expected results
- Create end-to-end user journey tests
- Develop boundary condition tests
- Build error handling scenarios

### Test Data Requirements
- Create test data requirements specifications
- Define data setup and teardown procedures
- Identify data dependencies between tests
- Generate sample test data sets

### Requirements Traceability
- Map test cases to requirements
- Maintain bidirectional traceability
- Calculate requirements coverage by test
- Identify untested requirements

### Defect Logging Templates
- Generate defect logging templates
- Define severity and priority classifications
- Create reproduction steps formats
- Establish expected vs actual result documentation

### Test Coverage Metrics
- Calculate test coverage metrics
- Measure requirements coverage percentage
- Track test execution coverage
- Report coverage gaps

### Test Management Tool Export
- Export to Excel/CSV formats
- Generate Jira Xray import format
- Create Azure Test Plans format
- Support TestRail import

## Usage

### Generate Test Cases
```
Generate UAT test cases from these acceptance criteria:
[Acceptance criteria in Given-When-Then format]

Include positive and negative scenarios.
```

### Create Test Scenarios
```
Create end-to-end test scenarios for:
[User story or feature description]

Generate complete user journey tests.
```

### Define Test Data
```
Define test data requirements for these test cases:
[Test case list]

Include data setup, dependencies, and sample values.
```

### Calculate Coverage
```
Calculate test coverage for:
Requirements: [Requirements list]
Test Cases: [Test case list]

Identify coverage gaps and missing tests.
```

## Process Integration

This skill integrates with the following business analysis processes:
- uat-planning.js - Core UAT planning activities
- user-story-development.js - Story to test conversion
- requirements-traceability.js - Test traceability

## Dependencies

- Test templates and formats
- Traceability data structures
- Test management export formats
- Coverage calculation algorithms

## UAT Test Case Reference

### Test Case Template
```
Test Case ID: TC-XXX
Title: [Descriptive test title]
Requirement ID: REQ-XXX
Priority: High/Medium/Low

Preconditions:
- [Precondition 1]
- [Precondition 2]

Test Steps:
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1    | [Action] | [Expected] |
| 2    | [Action] | [Expected] |

Test Data:
- [Data item 1]: [Value]
- [Data item 2]: [Value]

Postconditions:
- [State after test]
```

### Given-When-Then to Test Case Mapping
| GWT Element | Test Case Element |
|-------------|-------------------|
| Given | Preconditions |
| When | Test Steps (Actions) |
| Then | Expected Results |
| And | Additional steps or conditions |

### Test Case Types for UAT
| Type | Purpose | Examples |
|------|---------|----------|
| Positive | Verify correct behavior | Valid input, happy path |
| Negative | Verify error handling | Invalid input, edge cases |
| Boundary | Test limits | Min/max values, empty inputs |
| Integration | End-to-end flow | Complete user journeys |
| Regression | Verify unchanged behavior | Existing functionality |

### Defect Report Template
```
Defect ID: DEF-XXX
Title: [Brief description]
Test Case: TC-XXX
Requirement: REQ-XXX

Severity: Critical/High/Medium/Low
Priority: P1/P2/P3/P4

Environment:
- Browser/Device: [Details]
- Environment: UAT/QA/Staging

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Attachments:
- [Screenshots, logs, etc.]
```

### Coverage Metrics
| Metric | Formula | Target |
|--------|---------|--------|
| Requirements Coverage | Tested Reqs / Total Reqs | 100% |
| Test Execution | Executed Tests / Total Tests | 100% |
| Pass Rate | Passed Tests / Executed Tests | 95%+ |
| Defect Detection | Defects Found / Total Defects | High |

### Test Prioritization Criteria
| Priority | Criteria | Testing Approach |
|----------|----------|------------------|
| P1 - Critical | Core functionality, regulatory | Must test every release |
| P2 - High | Important features, frequent use | Test in full regression |
| P3 - Medium | Secondary features | Test in major releases |
| P4 - Low | Edge cases, rare scenarios | Test periodically |
