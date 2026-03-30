# Dead Code Eliminator Skill

## Overview

The Dead Code Eliminator skill identifies and safely removes unused code. It helps reduce codebase complexity, improve maintainability, and prepare for migrations by eliminating dead weight.

## Quick Start

### Prerequisites

- Language-specific dead code detection tool
- Test suite for validation
- Version control

### Basic Usage

1. **Detect dead code**
   ```bash
   # TypeScript
   npx ts-prune

   # JavaScript
   npx unimported

   # Python
   deadcode .
   ```

2. **Review findings**
   - Verify unused status
   - Check for dynamic usage
   - Assess removal risk

3. **Remove safely**
   - Remove in small batches
   - Run tests after each removal
   - Commit incrementally

## Features

### Detection Types

| Type | Description | Risk |
|------|-------------|------|
| Unused exports | Exported but never imported | Low |
| Dead functions | Defined but never called | Medium |
| Unreachable code | Code after return/throw | Low |
| Orphan files | Files never imported | Medium |

### Safety Checks

- Dynamic import analysis
- Reflection usage detection
- Entry point validation
- Test coverage consideration

## Configuration

```json
{
  "exclude": ["**/*.test.ts", "**/__mocks__/**"],
  "checkDynamicImports": true,
  "confidence": "high",
  "outputFormat": "json"
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
