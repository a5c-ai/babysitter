---
name: software-vv-test-generator
description: Medical device software verification and validation test case generation skill
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: biomedical-engineering
  domain: science
  category: Medical Device Software
  skill-id: BME-SK-020
---

# Software V&V Test Generator Skill

## Purpose

The Software V&V Test Generator Skill creates comprehensive verification and validation test cases for medical device software, ensuring requirements coverage and regulatory compliance.

## Capabilities

- Requirements-based test case derivation
- Unit test framework setup (embedded and application)
- Integration test planning
- System test protocol generation
- Test coverage analysis (statement, branch, MC/DC)
- Traceability matrix generation
- Test report templates
- Boundary value analysis
- Equivalence partitioning
- Negative testing scenarios
- Regression test suite management

## Usage Guidelines

### When to Use
- Developing software test strategies
- Creating test cases from requirements
- Analyzing test coverage
- Preparing V&V documentation

### Prerequisites
- Software requirements documented
- Safety classification determined
- Test environment defined
- Acceptance criteria established

### Best Practices
- Achieve coverage appropriate for safety class
- Test both normal and abnormal conditions
- Maintain traceability to requirements
- Automate regression testing

## Process Integration

This skill integrates with the following processes:
- Software Verification and Validation
- Software Development Lifecycle (IEC 62304)
- AI/ML Medical Device Development
- Design Control Process Implementation

## Dependencies

- pytest, GoogleTest frameworks
- LDRA, VectorCAST tools
- Test management systems
- Coverage analysis tools
- CI/CD pipelines

## Configuration

```yaml
software-vv-test-generator:
  test-levels:
    - unit
    - integration
    - system
    - acceptance
  coverage-metrics:
    - statement
    - branch
    - MC-DC
    - condition
  test-types:
    - functional
    - boundary
    - negative
    - stress
    - performance
```

## Output Artifacts

- Test case specifications
- Test procedures
- Test scripts/automation
- Coverage reports
- Traceability matrices
- Test summary reports
- Defect reports
- Regression test suites

## Quality Criteria

- Test cases traceable to requirements
- Coverage meets safety class requirements
- Boundary conditions tested
- Negative scenarios included
- Automation maximized
- Reports support regulatory submission
