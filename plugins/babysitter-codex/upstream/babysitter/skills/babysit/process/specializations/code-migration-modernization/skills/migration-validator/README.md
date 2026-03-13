# Migration Validator Skill

## Overview

The Migration Validator skill verifies functional equivalence after migration. It compares source and target systems to ensure behavior is preserved.

## Quick Start

### Prerequisites

- Access to both systems
- Test scenarios defined
- Comparison criteria

### Basic Usage

1. **Define validation scenarios**
   - List critical flows
   - Define comparison rules
   - Set tolerance levels

2. **Run parallel validation**
   - Send requests to both
   - Capture responses
   - Compare results

3. **Review differences**
   - Analyze discrepancies
   - Classify issues
   - Document findings

## Features

### Validation Types

| Type | Description | Coverage |
|------|-------------|----------|
| API Comparison | Response diffing | High |
| Data Validation | State comparison | High |
| Behavioral | Flow testing | Medium |
| Integration | External systems | Medium |

### Comparison Methods

- Exact match
- Structural comparison
- Semantic equivalence
- Tolerance-based

## Configuration

```json
{
  "source": {
    "baseUrl": "https://legacy.example.com",
    "headers": {}
  },
  "target": {
    "baseUrl": "https://new.example.com",
    "headers": {}
  },
  "validation": {
    "scenarios": ["./scenarios/*.json"],
    "tolerance": {
      "responseTime": 0.2,
      "numericPrecision": 0.001
    }
  },
  "reporting": {
    "format": "html",
    "outputDir": "./validation-results"
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
