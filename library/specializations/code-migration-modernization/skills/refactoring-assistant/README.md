# Refactoring Assistant Skill

## Overview

The Refactoring Assistant skill provides intelligent refactoring suggestions. It guides the application of proven refactoring patterns to improve code quality and maintainability.

## Quick Start

### Prerequisites

- IDE with refactoring support
- Code analysis tools
- Test suite for validation

### Basic Usage

1. **Analyze code**
   - Identify code smells
   - Review complexity metrics
   - Map dependencies

2. **Get suggestions**
   - Review refactoring recommendations
   - Prioritize by impact
   - Plan execution order

3. **Apply refactorings**
   - Use IDE automated refactoring
   - Verify with tests
   - Commit incrementally

## Features

### Refactoring Patterns

| Pattern | Use Case | Benefit |
|---------|----------|---------|
| Extract Method | Long methods | Readability |
| Extract Class | Large classes | SRP |
| Move Method | Feature envy | Cohesion |
| Introduce Parameter Object | Many params | Simplicity |
| Replace Conditional with Polymorphism | Complex conditionals | Extensibility |

### Design Patterns

Suggests application of:
- Strategy Pattern
- Factory Pattern
- Observer Pattern
- Decorator Pattern
- And more...

## Configuration

```json
{
  "prioritize": ["readability", "testability"],
  "skipPatterns": ["singleton"],
  "maxSuggestionsPerFile": 10,
  "includeDesignPatterns": true
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Refactoring: Improving the Design of Existing Code](https://martinfowler.com/books/refactoring.html)
