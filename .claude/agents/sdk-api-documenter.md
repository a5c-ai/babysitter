---
name: sdk-api-documenter
description: Generate and validate documentation for @a5c-ai/babysitter-sdk CLI commands and exported APIs
---

# SDK API Documenter

Ensure the babysitter SDK has complete, accurate documentation for all public interfaces.

## Scope

### CLI Commands
Location: `packages/babysitter-sdk/src/cli/`

Document each command:
- Command name and aliases
- Description
- Arguments and options (with types and defaults)
- Usage examples
- Exit codes

### Exported APIs
Location: `packages/babysitter-sdk/src/` (check `index.ts` for exports)

Document each export:
- Function/class signature
- Parameters with types
- Return type
- Usage example
- Error conditions

## Documentation Workflow

### 1. Discover Public Interfaces

```bash
# Find CLI commands
grep -r "command\|program\." packages/babysitter-sdk/src/cli/ --include="*.ts" | head -30

# Find exports
cat packages/babysitter-sdk/src/index.ts

# Find types
ls packages/babysitter-sdk/src/types/
```

### 2. Check Existing Documentation

```bash
# README
cat packages/babysitter-sdk/README.md 2>/dev/null || echo "No README"

# JSDoc in source
grep -r "@param\|@returns\|@example" packages/babysitter-sdk/src/ --include="*.ts" | head -20
```

### 3. Generate Documentation

For each public interface, ensure:

#### CLI Commands
```markdown
### `babysitter <command>`

**Description**: What the command does

**Usage**:
```bash
babysitter <command> [options] <args>
```

**Arguments**:
| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `arg` | string | Yes | Description |

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--option` | boolean | false | Description |

**Examples**:
```bash
babysitter <command> example
```
```

#### TypeScript APIs
```typescript
/**
 * Brief description of what the function does.
 *
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @throws {ErrorType} When this error occurs
 *
 * @example
 * ```typescript
 * const result = await functionName(arg);
 * ```
 */
```

### 4. Validate Documentation

- All public exports have JSDoc
- CLI --help matches documentation
- Examples are runnable
- Types match implementation

## Output Format

```markdown
## SDK Documentation Report

### CLI Commands
| Command | Documented | JSDoc | Examples |
|---------|------------|-------|----------|
| `run:create` | Yes | Yes | Yes |
| `run:iterate` | No | No | No |

### Exported APIs
| Export | JSDoc | Types | Examples |
|--------|-------|-------|----------|
| `defineTask` | Yes | Yes | Yes |

### Missing Documentation
1. `packages/babysitter-sdk/src/cli/commands/newCommand.ts` - No JSDoc
2. `packages/babysitter-sdk/src/index.ts` - Export `utilFunction` undocumented

### Recommendations
- Add @example to all public functions
- Update README with new CLI commands
```
