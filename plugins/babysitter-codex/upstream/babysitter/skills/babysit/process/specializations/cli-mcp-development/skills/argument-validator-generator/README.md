# Argument Validator Generator Skill

Generate argument validation logic with type coercion, constraints, and helpful error messages for CLI applications.

## Overview

This skill generates comprehensive argument validation code for CLI applications. It supports multiple languages and creates type coercion, constraint checking, and user-friendly error messages.

## When to Use

- Adding type validation to CLI arguments
- Creating custom argument validators
- Implementing complex constraint checking
- Generating validation error messages

## Quick Start

### Basic Validators

```json
{
  "language": "typescript",
  "validators": [
    {
      "name": "port",
      "type": "number",
      "constraints": { "min": 1, "max": 65535 }
    },
    {
      "name": "email",
      "type": "string",
      "pattern": "^[\\w.-]+@[\\w.-]+\\.\\w+$"
    }
  ]
}
```

### With Aliases

```json
{
  "language": "python",
  "validators": [
    {
      "name": "environment",
      "type": "enum",
      "values": ["development", "staging", "production"],
      "aliases": { "dev": "development", "prod": "production" }
    }
  ]
}
```

## Features

### Type Coercion
- String to number conversion
- Date parsing
- Boolean normalization

### Constraint Checking
- Min/max values
- String patterns (regex)
- Enum validation
- Custom predicates

### Error Messages
- Descriptive error text
- Suggested corrections
- Valid value hints

## Supported Languages

| Language | Validation Library |
|----------|-------------------|
| TypeScript | Zod |
| Python | Custom + pydantic |
| Go | Custom validators |
| Rust | Custom + validator |

## Integration with Processes

| Process | Integration |
|---------|-------------|
| argument-parser-setup | Validation logic |
| error-handling-user-feedback | Error messages |
| cli-command-structure-design | Type safety |
