# Domain Model Extractor Skill

## Overview

The Domain Model Extractor skill identifies domain boundaries in monolithic codebases. It applies DDD principles to extract bounded contexts and aggregates for microservices decomposition.

## Quick Start

### Prerequisites

- Access to codebase
- Domain knowledge
- DDD understanding

### Basic Usage

1. **Analyze code structure**
   - Review module boundaries
   - Identify domain areas
   - Map dependencies

2. **Extract domain model**
   - Identify aggregates
   - Map entities
   - Find domain events

3. **Create context map**
   - Define bounded contexts
   - Map relationships
   - Document integration patterns

## Features

### DDD Patterns Identified

| Pattern | Description | Output |
|---------|-------------|--------|
| Bounded Context | Domain boundary | Context map |
| Aggregate | Consistency boundary | Aggregate list |
| Entity | Domain object | Entity catalog |
| Value Object | Immutable value | VO catalog |
| Domain Event | State change | Event catalog |

### Context Relationships

- Shared Kernel
- Customer/Supplier
- Conformist
- Anti-Corruption Layer
- Open Host Service
- Published Language

## Configuration

```json
{
  "analysis": {
    "targetPaths": ["./src"],
    "includeHistory": true,
    "teamMappings": "./teams.json"
  },
  "output": {
    "format": "markdown",
    "diagrams": true,
    "glossary": true
  },
  "ddd": {
    "identifyAggregates": true,
    "findEvents": true,
    "extractLanguage": true
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Domain-Driven Design](https://domainlanguage.com/ddd/)
