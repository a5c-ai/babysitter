---
name: Code Coverage Analysis
description: Multi-language code coverage analysis, reporting, and quality gate enforcement
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Code Coverage Analysis Skill

## Overview

This skill provides expert-level capabilities for code coverage analysis across multiple languages, enabling coverage collection, report generation, and quality gate enforcement.

## Capabilities

### JavaScript/TypeScript Coverage
- Configure Istanbul/nyc for JavaScript coverage
- V8 coverage collection
- Source map support for TypeScript

### Python Coverage
- Configure coverage.py for Python coverage
- Branch coverage analysis
- Context-based coverage

### Java Coverage
- JaCoCo configuration for Java coverage
- Maven/Gradle integration
- Multi-module project support

### Coverage Merging
- Merge coverage reports from multiple sources
- Combine unit and integration coverage
- Cross-test-type aggregation

### Reporting
- Generate coverage badges
- Track coverage trends
- Generate HTML and XML reports

### Quality Gates
- Configure coverage thresholds
- Enforce minimum coverage requirements
- Block merges on coverage drops

### Analysis
- Analyze uncovered code paths
- Identify dead code
- Priority coverage recommendations

### Integration
- SonarQube integration
- Codecov/Coveralls integration
- CI/CD pipeline integration

## Target Processes

- `automation-framework.js` - Framework coverage setup
- `mutation-testing.js` - Coverage for mutation testing
- `quality-gates.js` - Coverage-based gates
- `continuous-testing.js` - CI/CD coverage

## Dependencies

- `nyc` / `c8` - JavaScript coverage
- `coverage.py` - Python coverage
- `JaCoCo` - Java coverage

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'code-coverage',
    context: {
      action: 'analyze',
      language: 'javascript',
      reportFormats: ['html', 'lcov', 'json'],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80
      }
    }
  }
}
```

## Configuration

The skill auto-detects project language and configures appropriate coverage tools.
