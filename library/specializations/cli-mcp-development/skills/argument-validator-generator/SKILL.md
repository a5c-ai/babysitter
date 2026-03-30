---
name: argument-validator-generator
description: Generate argument validation logic with type coercion, constraints, custom validators, and helpful error messages for CLI applications.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Argument Validator Generator

Generate comprehensive argument validation logic for CLI applications with type coercion and constraint checking.

## Capabilities

- Generate type coercion functions for arguments
- Create custom validators with constraint checking
- Set up validation error messages
- Implement value normalization
- Configure mutually exclusive validation
- Generate validation schemas

## Usage

Invoke this skill when you need to:
- Add type validation to CLI arguments
- Create custom argument validators
- Implement complex constraint checking
- Generate helpful validation error messages

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| language | string | Yes | Target language (typescript, python, go, rust) |
| validators | array | Yes | List of validators to generate |
| outputPath | string | No | Output path for generated files |

### Validator Structure

```json
{
  "validators": [
    {
      "name": "port",
      "type": "number",
      "constraints": {
        "min": 1,
        "max": 65535
      },
      "errorMessage": "Port must be between 1 and 65535"
    },
    {
      "name": "email",
      "type": "string",
      "pattern": "^[\\w.-]+@[\\w.-]+\\.\\w+$",
      "errorMessage": "Invalid email format"
    },
    {
      "name": "environment",
      "type": "enum",
      "values": ["development", "staging", "production"],
      "aliases": { "dev": "development", "prod": "production" }
    }
  ]
}
```

## Generated Code Patterns

### TypeScript Validators

```typescript
import { z } from 'zod';

// Port validator
export const portSchema = z
  .number()
  .int()
  .min(1, 'Port must be at least 1')
  .max(65535, 'Port must be at most 65535');

export function validatePort(value: unknown): number {
  const parsed = typeof value === 'string' ? parseInt(value, 10) : value;
  return portSchema.parse(parsed);
}

// Email validator
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase();

export function validateEmail(value: unknown): string {
  return emailSchema.parse(value);
}

// Environment enum with aliases
const envAliases: Record<string, string> = {
  dev: 'development',
  prod: 'production',
};

export const environmentSchema = z
  .string()
  .transform((val) => envAliases[val] || val)
  .pipe(z.enum(['development', 'staging', 'production']));

export function validateEnvironment(value: unknown): string {
  return environmentSchema.parse(value);
}
```

### Python Validators

```python
from typing import Any, List, Optional, Union
import re

class ValidationError(Exception):
    """Raised when validation fails."""
    pass

def validate_port(value: Any) -> int:
    """Validate port number."""
    try:
        port = int(value)
    except (TypeError, ValueError):
        raise ValidationError(f"Invalid port number: {value}")

    if not 1 <= port <= 65535:
        raise ValidationError("Port must be between 1 and 65535")

    return port

def validate_email(value: Any) -> str:
    """Validate email address."""
    if not isinstance(value, str):
        raise ValidationError(f"Email must be a string, got {type(value).__name__}")

    pattern = r'^[\w.-]+@[\w.-]+\.\w+$'
    if not re.match(pattern, value):
        raise ValidationError("Invalid email format")

    return value.lower()

ENV_ALIASES = {'dev': 'development', 'prod': 'production'}
VALID_ENVIRONMENTS = ['development', 'staging', 'production']

def validate_environment(value: Any) -> str:
    """Validate environment name."""
    if not isinstance(value, str):
        raise ValidationError(f"Environment must be a string")

    normalized = ENV_ALIASES.get(value, value)
    if normalized not in VALID_ENVIRONMENTS:
        raise ValidationError(
            f"Invalid environment: {value}. "
            f"Must be one of: {', '.join(VALID_ENVIRONMENTS)}"
        )

    return normalized
```

### Go Validators

```go
package validators

import (
    "fmt"
    "regexp"
    "strconv"
    "strings"
)

// ValidationError represents a validation failure
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// ValidatePort validates a port number
func ValidatePort(value string) (int, error) {
    port, err := strconv.Atoi(value)
    if err != nil {
        return 0, &ValidationError{
            Field:   "port",
            Message: fmt.Sprintf("invalid port number: %s", value),
        }
    }

    if port < 1 || port > 65535 {
        return 0, &ValidationError{
            Field:   "port",
            Message: "port must be between 1 and 65535",
        }
    }

    return port, nil
}

// ValidateEmail validates an email address
func ValidateEmail(value string) (string, error) {
    pattern := `^[\w.-]+@[\w.-]+\.\w+$`
    matched, _ := regexp.MatchString(pattern, value)

    if !matched {
        return "", &ValidationError{
            Field:   "email",
            Message: "invalid email format",
        }
    }

    return strings.ToLower(value), nil
}

var envAliases = map[string]string{
    "dev":  "development",
    "prod": "production",
}

var validEnvironments = []string{"development", "staging", "production"}

// ValidateEnvironment validates environment name
func ValidateEnvironment(value string) (string, error) {
    if alias, ok := envAliases[value]; ok {
        value = alias
    }

    for _, env := range validEnvironments {
        if env == value {
            return value, nil
        }
    }

    return "", &ValidationError{
        Field:   "environment",
        Message: fmt.Sprintf("invalid environment: %s", value),
    }
}
```

## Validation Patterns

### Composite Validators

```typescript
// URL with specific protocol
export const apiUrlSchema = z
  .string()
  .url()
  .refine(
    (url) => url.startsWith('https://'),
    'API URL must use HTTPS'
  );

// File path that must exist
export const existingFileSchema = z
  .string()
  .refine(
    (path) => fs.existsSync(path),
    (path) => ({ message: `File not found: ${path}` })
  );
```

### Dependent Validation

```typescript
// Validate that end date is after start date
export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(
  (data) => data.endDate > data.startDate,
  'End date must be after start date'
);
```

## Workflow

1. **Analyze requirements** - Review validation needs
2. **Generate base validators** - Type coercion and basic checks
3. **Add constraints** - Min/max, patterns, enums
4. **Create error messages** - Helpful, actionable messages
5. **Add aliases/transforms** - Normalize input values
6. **Generate tests** - Validation test cases

## Best Practices Applied

- Type coercion before validation
- Descriptive error messages
- Input normalization (lowercase, trim)
- Alias support for common values
- Composable validation schemas
- Consistent error types

## Target Processes

- argument-parser-setup
- error-handling-user-feedback
- cli-command-structure-design
