# Test Coverage Analyzer Skill

## Overview

The Test Coverage Analyzer skill provides comprehensive coverage analysis to identify testing gaps before migration. It ensures adequate test safety nets exist to catch regressions.

## Quick Start

### Prerequisites

- Coverage tool for your language (Istanbul, JaCoCo, Coverage.py, etc.)
- Existing test suite

### Basic Usage

1. **Run existing tests with coverage**
   ```bash
   # JavaScript/TypeScript
   npx nyc npm test

   # Java
   mvn test jacoco:report

   # Python
   pytest --cov=src
   ```

2. **Analyze coverage reports**
   - Review overall coverage percentages
   - Identify uncovered critical paths
   - Map coverage gaps

## Features

### Coverage Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Line Coverage | Lines executed | > 80% |
| Branch Coverage | Decision branches | > 70% |
| Function Coverage | Functions called | > 90% |
| Path Coverage | Execution paths | > 60% |

### Gap Analysis

- Identifies untested code
- Prioritizes by business criticality
- Suggests test generation targets
- Maps to characterization test needs

## Configuration

```json
{
  "coverageThresholds": {
    "line": 80,
    "branch": 70,
    "function": 90
  },
  "criticalPaths": [
    "src/auth/**",
    "src/payment/**"
  ],
  "excludePaths": ["test/", "dist/"]
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
