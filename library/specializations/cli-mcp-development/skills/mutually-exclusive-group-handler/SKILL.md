---
name: mutually-exclusive-group-handler
description: Generate logic for handling mutually exclusive argument groups with clear error messages and validation in CLI applications.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Mutually Exclusive Group Handler

Generate logic for handling mutually exclusive CLI argument groups.

## Capabilities

- Generate mutually exclusive group validation
- Create dependent argument relationships
- Set up required group validation
- Implement custom conflict messages
- Configure OR/XOR group logic
- Generate documentation for groups

## Usage

Invoke this skill when you need to:
- Implement mutually exclusive options
- Create dependent argument chains
- Validate argument relationships
- Generate clear conflict messages

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| language | string | Yes | Target language |
| groups | array | Yes | Mutually exclusive group definitions |

### Group Structure

```json
{
  "groups": [
    {
      "name": "output-format",
      "type": "mutually_exclusive",
      "required": true,
      "options": ["--json", "--yaml", "--table"],
      "errorMessage": "Choose one output format: --json, --yaml, or --table"
    },
    {
      "name": "auth-method",
      "type": "mutually_exclusive",
      "options": ["--token", "--username"],
      "dependencies": {
        "--username": ["--password"]
      }
    }
  ]
}
```

## Generated Patterns

### TypeScript Group Handler

```typescript
interface GroupValidation {
  name: string;
  options: string[];
  required?: boolean;
  errorMessage?: string;
  dependencies?: Record<string, string[]>;
}

export function validateMutuallyExclusiveGroups(
  args: Record<string, unknown>,
  groups: GroupValidation[]
): void {
  for (const group of groups) {
    const presentOptions = group.options.filter(opt => {
      const key = opt.replace(/^--/, '').replace(/-/g, '_');
      return args[key] !== undefined;
    });

    // Check mutual exclusivity
    if (presentOptions.length > 1) {
      throw new Error(
        group.errorMessage ||
        `Options ${presentOptions.join(', ')} are mutually exclusive`
      );
    }

    // Check required group
    if (group.required && presentOptions.length === 0) {
      throw new Error(
        `One of ${group.options.join(', ')} is required`
      );
    }

    // Check dependencies
    if (group.dependencies && presentOptions.length === 1) {
      const selected = presentOptions[0];
      const deps = group.dependencies[selected];
      if (deps) {
        for (const dep of deps) {
          const depKey = dep.replace(/^--/, '').replace(/-/g, '_');
          if (args[depKey] === undefined) {
            throw new Error(
              `${selected} requires ${dep} to be specified`
            );
          }
        }
      }
    }
  }
}
```

### Python Group Handler

```python
from typing import Dict, List, Optional, Any

class MutuallyExclusiveGroup:
    def __init__(
        self,
        name: str,
        options: List[str],
        required: bool = False,
        error_message: Optional[str] = None,
        dependencies: Optional[Dict[str, List[str]]] = None
    ):
        self.name = name
        self.options = options
        self.required = required
        self.error_message = error_message
        self.dependencies = dependencies or {}

def validate_groups(args: Dict[str, Any], groups: List[MutuallyExclusiveGroup]) -> None:
    for group in groups:
        present = [
            opt for opt in group.options
            if args.get(opt.lstrip('-').replace('-', '_')) is not None
        ]

        # Check mutual exclusivity
        if len(present) > 1:
            raise ValueError(
                group.error_message or
                f"Options {', '.join(present)} are mutually exclusive"
            )

        # Check required
        if group.required and not present:
            raise ValueError(
                f"One of {', '.join(group.options)} is required"
            )

        # Check dependencies
        if present and group.dependencies:
            selected = present[0]
            deps = group.dependencies.get(selected, [])
            for dep in deps:
                dep_key = dep.lstrip('-').replace('-', '_')
                if args.get(dep_key) is None:
                    raise ValueError(
                        f"{selected} requires {dep} to be specified"
                    )
```

## Workflow

1. **Define groups** - Specify mutually exclusive options
2. **Set requirements** - Required vs optional groups
3. **Add dependencies** - Dependent argument chains
4. **Create messages** - Custom error messages
5. **Generate validator** - Validation logic
6. **Generate docs** - Group documentation

## Target Processes

- argument-parser-setup
- error-handling-user-feedback
- cli-command-structure-design
