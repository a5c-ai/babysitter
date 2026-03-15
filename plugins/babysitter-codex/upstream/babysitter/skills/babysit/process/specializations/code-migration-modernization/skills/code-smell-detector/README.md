# Code Smell Detector Skill

## Overview

The Code Smell Detector skill provides automated detection of code smells and anti-patterns. It identifies refactoring opportunities and helps prioritize technical debt remediation.

## Quick Start

### Prerequisites

- Node.js 18+
- Optional: SonarQube, PMD, ESLint, Designite

### Basic Usage

1. **Configure detection rules**
   ```json
   {
     "thresholds": {
       "methodLength": 30,
       "classSize": 500,
       "parameterCount": 5,
       "complexity": 10
     }
   }
   ```

2. **Run detection**
   ```bash
   # The skill auto-detects smells based on language
   ```

3. **Review findings**
   - Check smell reports by category
   - Review hotspot analysis
   - Follow refactoring suggestions

## Features

### Smell Categories

| Category | Examples | Severity |
|----------|----------|----------|
| Bloaters | Long Method, Large Class | High |
| Object-Orientation | Feature Envy, Refused Bequest | Medium |
| Change Preventers | Divergent Change, Shotgun Surgery | High |
| Dispensables | Dead Code, Speculative Generality | Low |
| Couplers | Inappropriate Intimacy | Medium |

### Detection Methods

- AST-based pattern matching
- Metrics threshold analysis
- Heuristic pattern detection
- Cross-reference analysis

## Configuration

```json
{
  "enabledSmells": {
    "longMethod": true,
    "largeClass": true,
    "featureEnvy": true,
    "godClass": true
  },
  "thresholds": {
    "methodLength": 30,
    "classSize": 500
  },
  "excludePaths": ["test/", "vendor/"]
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Refactoring Guru - Code Smells](https://refactoring.guru/refactoring/smells)
