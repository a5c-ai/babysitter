# Technical Debt Quantifier Skill

## Overview

The Technical Debt Quantifier skill measures and prioritizes technical debt. It provides actionable insights for debt remediation planning and migration readiness assessment.

## Quick Start

### Prerequisites

- Code quality tool (SonarQube, CodeClimate)
- Access to codebase metrics
- Historical data for trends

### Basic Usage

1. **Collect metrics**
   ```bash
   # Run quality analysis
   sonar-scanner
   ```

2. **Review debt inventory**
   - Categorize by type
   - Estimate remediation effort
   - Calculate interest cost

3. **Prioritize remediation**
   - Score by impact
   - Identify quick wins
   - Plan sprints

## Features

### Debt Categories

| Category | Examples | Impact |
|----------|----------|--------|
| Code Debt | Complexity, duplication | Productivity |
| Architecture | Coupling, layering | Flexibility |
| Test Debt | Coverage gaps | Quality |
| Documentation | Missing docs | Onboarding |

### Metrics

- **Debt Ratio**: Debt / Development cost
- **Interest Rate**: Ongoing maintenance cost
- **Debt per LOC**: Normalized debt measure
- **Remediation Time**: Hours to fix

## Configuration

```json
{
  "hourlyRate": 100,
  "categories": ["code", "architecture", "test", "documentation"],
  "priorityWeights": {
    "businessImpact": 0.4,
    "risk": 0.3,
    "effort": 0.3
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
