# Mutually Exclusive Group Handler Skill

Generate logic for handling mutually exclusive argument groups with validation and clear error messages.

## Overview

This skill generates validation logic for mutually exclusive CLI argument groups, handling conflicts and dependencies between options.

## When to Use

- Implementing mutually exclusive options
- Creating dependent argument chains
- Validating argument relationships
- Generating clear conflict messages

## Quick Start

```json
{
  "language": "typescript",
  "groups": [
    {
      "name": "output-format",
      "type": "mutually_exclusive",
      "required": true,
      "options": ["--json", "--yaml", "--table"]
    }
  ]
}
```

## Features

- Mutual exclusivity validation
- Required group support
- Dependent arguments
- Custom error messages

## Integration with Processes

| Process | Integration |
|---------|-------------|
| argument-parser-setup | Group validation |
| error-handling-user-feedback | Conflict messages |
| cli-command-structure-design | Option relationships |
